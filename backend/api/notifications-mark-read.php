<?php
/**
 * POST /backend/api/notifications-mark-read.php
 * Marca todas las notificaciones como leídas
 */
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

require_once __DIR__ . '/../classes/Notification.php';

$userId = (string)$_SESSION['user_id'];

$n = new Notification();
$ok = $n->markAllRead($userId);

echo json_encode(['success' => $ok]);
