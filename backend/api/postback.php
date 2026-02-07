<?php
/**
 * POSTBACK ENDPOINT - THEOREMREACH
 * Recibe notificaciones de recompensas completadas (server-to-server)
 *
 * ✅ RECOMENDADO: proteger con token secreto
 * Configurar en TheoremReach (Server Callback URL) algo como:
 * https://tudominio.com/backend/api/postback.php?token=TU_TOKEN&user_id={user_id}&reward={reward}&transaction_id={transaction_id}
 *
 * Parámetros:
 * - token (recomendado): secreto para validar que el request es legítimo
 * - user_id
 * - reward
 * - transaction_id
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/User.php';
require_once __DIR__ . '/../classes/Transaction.php';

/** =========================
 *  CONFIG
 *  ========================= */
const POSTBACK_TOKEN = 'CHANGE_ME_SUPER_SECRET_TOKEN'; // <-- CAMBIA ESTO (largo, random)
const REWARD_IS_CENTS = false; // si tu reward viene "en centavos", ponlo en true

// Log (opcional)
$logDir = __DIR__ . '/../logs';
$logFile = $logDir . '/postback.log';

/** =========================
 *  Helpers
 *  ========================= */
function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit();
}

function safe_mkdir($path) {
    if (!is_dir($path)) {
        @mkdir($path, 0775, true);
    }
}

function log_line($file, $arr) {
    @file_put_contents($file, json_encode($arr, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND);
}

/** =========================
 *  Basic validation
 *  ========================= */

// Solo GET
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    respond(405, ['status' => 'error', 'message' => 'Método no permitido']);
}

// Crear carpeta logs si no existe
safe_mkdir($logDir);

// Log de entrada
log_line($logFile, [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'] ?? '',
    'get' => $_GET,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
]);

// Token (seguridad)
$token = isset($_GET['token']) ? trim($_GET['token']) : '';
if (!hash_equals(POSTBACK_TOKEN, $token)) {
    // 401 para evitar que te “invente” rewards cualquiera
    respond(401, ['status' => 'error', 'message' => 'Unauthorized']);
}

// Parámetros requeridos
$required = ['user_id', 'reward', 'transaction_id'];
foreach ($required as $p) {
    if (!isset($_GET[$p]) || trim((string)$_GET[$p]) === '') {
        respond(400, ['status' => 'error', 'message' => "Parámetro {$p} es requerido"]);
    }
}

$userId = trim((string)$_GET['user_id']);
$transactionId = trim((string)$_GET['transaction_id']);

// reward puede venir como string decimal "0.5" o como entero.
// No asumimos centavos a menos que REWARD_IS_CENTS = true.
$rewardRaw = trim((string)$_GET['reward']);

if (!preg_match('/^\d+(\.\d+)?$/', $rewardRaw)) {
    respond(400, ['status' => 'error', 'message' => 'Reward inválido']);
}

$reward = (float)$rewardRaw;
if (REWARD_IS_CENTS) {
    $reward = $reward / 100.0;
}

// Reward debe ser positivo
if ($reward <= 0) {
    respond(400, ['status' => 'error', 'message' => 'Reward inválido (<= 0)']);
}

/** =========================
 *  DB transactional processing
 *  ========================= */
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->beginTransaction();

    $user = new User();
    $existingUser = $user->getUserById($userId);
    if (!$existingUser) {
        $conn->rollBack();
        respond(404, ['status' => 'error', 'message' => 'Usuario no encontrado']);
    }

    $tx = new Transaction();

    // 1) Crear transacción (idempotente por transaction_id)
    $txResult = $tx->create($userId, $transactionId, $reward, 'reward', 'theoremreach', 'Encuesta completada');

    if (!empty($txResult['duplicate'])) {
        // Ya procesada: responder OK para que TR no reintente
        $conn->commit();
        respond(200, [
            'status' => 'ok',
            'message' => 'Transacción ya procesada',
            'duplicate' => true
        ]);
    }

    if (empty($txResult['success'])) {
        $conn->rollBack();
        respond(500, ['status' => 'error', 'message' => 'Error al registrar transacción']);
    }

    // 2) Actualizar balance + stats (balance, total_earned, completed_offers)
    $updated = $user->updateBalance($userId, $reward);

    // Commit final
    $conn->commit();

    // Log éxito
    log_line($logFile, [
        'timestamp' => date('Y-m-d H:i:s'),
        'status' => 'success',
        'user_id' => $userId,
        'reward' => $reward,
        'transaction_id' => $transactionId,
        'balance' => $updated['balance'] ?? null,
        'total_earned' => $updated['total_earned'] ?? null,
        'completed_offers' => $updated['completed_offers'] ?? null
    ]);

    respond(200, [
        'status' => 'ok',
        'message' => 'Recompensa procesada exitosamente',
        'user_id' => $userId,
        'reward' => $reward,
        'transaction_id' => $transactionId,
        'user' => [
            'balance' => $updated['balance'] ?? null,
            'total_earned' => $updated['total_earned'] ?? null,
            'completed_offers' => $updated['completed_offers'] ?? null
        ]
    ]);
} catch (Throwable $e) {
    // Si falla, intentar rollback
    try {
        if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    } catch (Throwable $ignored) {}

    error_log("Postback error: " . $e->getMessage());
    log_line($logFile, [
        'timestamp' => date('Y-m-d H:i:s'),
        'status' => 'error',
        'error' => $e->getMessage()
    ]);

    respond(500, ['status' => 'error', 'message' => 'Error interno']);
}
