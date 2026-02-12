<?php
/**
 * Wannads Postback Handler
 * Procesa las recompensas de Wannads y las acredita al usuario
 * 
 * URL de configuración en Wannads:
 * https://tudominio.com/backend/api/wannads-postback.php
 * 
 * Parámetros que Wannads envía:
 * - userId: ID del usuario
 * - amount: Monto a acreditar (en puntos, se convierte a dólares)
 * - offerName: Nombre de la oferta
 * - offerId: ID de la oferta
 * - transactionId: ID único de la transacción
 * - hash: Hash de seguridad (SHA256)
 */

require_once '../config/database.php';
require_once '../classes/User.php';
require_once '../classes/Transaction.php';

// Configuración de Wannads
define('WANNADS_API_KEY', '698c972b2683b866438761');
define('WANNADS_SECRET', '264623b798');

// Configurar headers
header('Content-Type: application/json');

// Log de debugging
error_log('[Wannads Postback] Request recibido: ' . json_encode($_GET));

// Obtener parámetros de Wannads
$userId = $_GET['userId'] ?? null;
$amount = $_GET['amount'] ?? null;
$offerName = $_GET['offerName'] ?? 'Wannads Offer';
$offerId = $_GET['offerId'] ?? null;
$transactionId = $_GET['transactionId'] ?? null;
$hash = $_GET['hash'] ?? null;
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Validar parámetros requeridos
if (!$userId || !$amount || !$transactionId) {
    http_response_code(400);
    $error = [
        'status' => 'error',
        'message' => 'Parámetros faltantes',
        'required' => ['userId', 'amount', 'transactionId'],
        'received' => [
            'userId' => $userId,
            'amount' => $amount,
            'transactionId' => $transactionId
        ]
    ];
    error_log('[Wannads Postback] Error: ' . json_encode($error));
    echo json_encode($error);
    exit;
}

// Verificar el hash de seguridad (si Wannads lo envía)
if ($hash) {
    // Construir el hash esperado
    // Formato: SHA256(userId + amount + transactionId + secret)
    $expectedHash = hash('sha256', $userId . $amount . $transactionId . WANNADS_SECRET);
    
    if ($hash !== $expectedHash) {
        http_response_code(403);
        $error = [
            'status' => 'error',
            'message' => 'Hash de seguridad inválido',
            'received_hash' => $hash
        ];
        error_log('[Wannads Postback] Error de seguridad: ' . json_encode($error));
        echo json_encode($error);
        exit;
    }
}

// Validar que el monto sea numérico y positivo
if (!is_numeric($amount) || $amount <= 0) {
    http_response_code(400);
    $error = [
        'status' => 'error',
        'message' => 'Monto inválido',
        'amount' => $amount
    ];
    error_log('[Wannads Postback] Error: ' . json_encode($error));
    echo json_encode($error);
    exit;
}

// Convertir amount a dólares (Wannads típicamente envía en centavos o puntos)
// Ajusta esta conversión según cómo Wannads envíe el monto
$amountInDollars = floatval($amount) / 100; // Si envían centavos, dividir por 100
// Si envían directamente en dólares: $amountInDollars = floatval($amount);

try {
    $db = Database::getInstance()->getConnection();
    
    // Verificar que el usuario existe
    $stmt = $db->prepare("SELECT id, username FROM users WHERE id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        $error = [
            'status' => 'error',
            'message' => 'Usuario no encontrado',
            'user_id' => $userId
        ];
        error_log('[Wannads Postback] Error: ' . json_encode($error));
        echo json_encode($error);
        exit;
    }
    
    // Verificar si la transacción ya existe (prevenir duplicados)
    $stmt = $db->prepare("
        SELECT id, created_at FROM transactions 
        WHERE external_transaction_id = :tx_id 
        AND source = 'wannads'
    ");
    $stmt->execute([':tx_id' => $transactionId]);
    $existingTransaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingTransaction) {
        // Transacción duplicada - retornar éxito
        $response = [
            'status' => 'success',
            'message' => 'Transacción duplicada',
            'transaction_id' => $existingTransaction['id'],
            'original_date' => $existingTransaction['created_at']
        ];
        error_log('[Wannads Postback] Duplicado detectado: ' . json_encode($response));
        echo json_encode($response);
        exit;
    }
    
    // Iniciar transacción de base de datos
    $db->beginTransaction();
    
    try {
        // Registrar la transacción
        $transaction = new Transaction($db);
        $result = $transaction->create(
            $userId,
            $amountInDollars,
            'credit',
            'wannads_offer',
            "Wannads Offer: {$offerName}",
            $transactionId
        );
        
        if (!$result) {
            throw new Exception('Error al crear la transacción');
        }
        
        // Actualizar el balance del usuario
        $stmt = $db->prepare("
            UPDATE users 
            SET balance = balance + :amount,
                total_earned = total_earned + :amount,
                completed_offers = completed_offers + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
        ");
        
        $updateResult = $stmt->execute([
            ':amount' => $amountInDollars,
            ':user_id' => $userId
        ]);
        
        if (!$updateResult) {
            throw new Exception('Error al actualizar el balance del usuario');
        }
        
        // Log de la operación exitosa
        $logStmt = $db->prepare("
            INSERT INTO postback_logs 
            (user_id, source, transaction_id, amount, ip_address, status, raw_data) 
            VALUES 
            (:user_id, 'wannads', :tx_id, :amount, :ip, 'success', :raw_data)
        ");
        
        $logStmt->execute([
            ':user_id' => $userId,
            ':tx_id' => $transactionId,
            ':amount' => $amountInDollars,
            ':ip' => $ip,
            ':raw_data' => json_encode($_GET)
        ]);
        
        // Commit de la transacción
        $db->commit();
        
        // Respuesta exitosa (Wannads espera un código 200 y opcionalmente "1" o "OK")
        $response = [
            'status' => 'success',
            'message' => 'Recompensa acreditada correctamente',
            'user_id' => $userId,
            'username' => $user['username'],
            'amount' => $amountInDollars,
            'transaction_id' => $transactionId
        ];
        
        error_log('[Wannads Postback] Éxito: ' . json_encode($response));
        
        // Wannads puede esperar solo "1" o "OK" como respuesta
        echo "1"; // O puedes usar: echo json_encode($response);
        
    } catch (Exception $e) {
        // Rollback en caso de error
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    $error = [
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'details' => $e->getMessage()
    ];
    
    error_log('[Wannads Postback] Error crítico: ' . json_encode($error));
    echo json_encode($error);
    
    // Intentar registrar el error en la BD
    try {
        $db = Database::getInstance()->getConnection();
        $logStmt = $db->prepare("
            INSERT INTO postback_logs 
            (user_id, source, transaction_id, amount, ip_address, status, error_message, raw_data) 
            VALUES 
            (:user_id, 'wannads', :tx_id, :amount, :ip, 'error', :error, :raw_data)
        ");
        
        $logStmt->execute([
            ':user_id' => $userId,
            ':tx_id' => $transactionId,
            ':amount' => $amountInDollars ?? 0,
            ':ip' => $ip,
            ':error' => $e->getMessage(),
            ':raw_data' => json_encode($_GET)
        ]);
    } catch (Exception $logError) {
        error_log('[Wannads Postback] Error al registrar log: ' . $logError->getMessage());
    }
}

/**
 * NOTAS DE CONFIGURACIÓN:
 * 
 * 1. URL de Postback en Wannads Panel:
 *    https://tudominio.com/backend/api/wannads-postback.php
 * 
 * 2. Wannads normalmente envía estos parámetros:
 *    - userId: ID del usuario
 *    - amount: Monto (verifica si es en centavos o dólares)
 *    - transactionId: ID único
 *    - offerName: Nombre de la oferta
 *    - offerId: ID de la oferta
 *    - hash: Hash de seguridad (opcional)
 * 
 * 3. Ajusta la conversión de monto según lo que Wannads envíe:
 *    - Si envía centavos: $amountInDollars = floatval($amount) / 100;
 *    - Si envía dólares: $amountInDollars = floatval($amount);
 * 
 * 4. Wannads puede esperar una respuesta simple:
 *    - "1" = éxito
 *    - "0" = error
 *    O un JSON con más detalles
 * 
 * 5. Consulta la documentación de Wannads para los parámetros exactos
 */
?>