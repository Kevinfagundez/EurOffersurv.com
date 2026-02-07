<?php
/**
 * API Endpoint - Logout
 * POST /backend/api/logout.php
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_unset();
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente']);
