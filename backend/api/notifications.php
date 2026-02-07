<?php
/**
 * GET /backend/api/notifications.php
 * Devuelve notificaciones del usuario logueado
 */
declare(strict_types=1);

session_start();
header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

require_once __DIR__ . '/../classes/Notification.php';

$userId = (string)$_SESSION['user_id'];
$limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 20;

$n = new Notification();
$items = $n->getLatest($userId, $limit);
$unread = $n->getUnreadCount($userId);

echo json_encode([
    'success' => true,
    'unread_count' => $unread,
    'notifications' => $items
]);
