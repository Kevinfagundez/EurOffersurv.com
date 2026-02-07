<?php
/**
 * API Endpoint - Obtener datos del usuario actual
 * GET /backend/api/user-data.php
 */

declare(strict_types=1);

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

session_start();

header('Content-Type: application/json');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Vary: Origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../classes/User.php';

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
