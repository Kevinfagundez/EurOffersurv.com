<?php
/**
 * API Endpoint - Obtener datos del usuario actual
 * GET /api/user-data.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../classes/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$user = new User();
$userData = $user->getUserById($_SESSION['user_id']);

if (!$userData) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    exit();
}

echo json_encode([
    'success' => true,
    'user' => $userData
]);
