<?php
/**
 * API Endpoint - Logout
 * POST /api/logout.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

header('Content-Type: application/json; charset=UTF-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

session_start();

$_SESSION = [];
session_unset();

$cookieName = session_name();
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

setcookie($cookieName, '', [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'None',
]);

session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente']);
