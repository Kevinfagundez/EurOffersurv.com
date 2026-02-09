<?php
header('Content-Type: application/json');

// Subimos dos niveles para llegar al backend desde /postback/timewall.php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/classes/User.php';
require_once __DIR__ . '/../backend/classes/Transaction.php';

// 1. CAPTURA DE DATOS (Basado exactamente en la URL de tu imagen)
// TimeWall envía: ?userID={userID}&transactionID={transactionID}&currencyAmount={currencyAmount}
$userId        = $_GET['userID']        ?? null;
$transactionId = $_GET['transactionID'] ?? null;
$reward        = $_GET['currencyAmount'] ?? null;

if (!$userId || !$transactionId || !$reward) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Faltan parametros"]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $conn->beginTransaction();

    $user = new User();
    $tx = new Transaction();

    // Verificar usuario
    $existingUser = $user->getUserById($userId);
    if (!$existingUser) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Usuario no existe"]);
        exit;
    }

    // Registrar crédito
    $txResult = $tx->create($userId, $transactionId, (float)$reward, 'reward', 'timewall', 'Retiro de TimeWall');

    if (!empty($txResult['duplicate'])) {
        $conn->commit();
        echo json_encode(["status" => "ok", "message" => "Duplicado"]);
        exit;
    }

    $user->updateBalance($userId, (float)$reward);

    $conn->commit();
    echo json_encode(["status" => "ok"]);

} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}