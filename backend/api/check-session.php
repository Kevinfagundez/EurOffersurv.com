<?php
/**
 * API Endpoint - Verificar sesión actual
 * GET /api/check-session.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

header('Content-Type: application/json; charset=UTF-8');

session_start();

$debug = [
    'session_id' => session_id(),
    'cookie_name' => session_name(),
    'has_cookie_in_request' => isset($_COOKIE[session_name()]),
    'session_logged_in' => $_SESSION['logged_in'] ?? null,
    'session_user_id' => $_SESSION['user_id'] ?? null,
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
    'xf_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null,
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
];

// ✅ Si no llega cookie, no hay sesión que validar
if (!isset($_COOKIE[session_name()])) {
    echo json_encode([
        'authenticated' => false,
        'reason' => 'no_session_cookie',
        'debug' => $debug,
    ]);
    exit;
}

// ✅ FIX: NO usar empty($_SESSION['user_id']) porque user_id=0 hace empty()=true
$uid = (int)($_SESSION['user_id'] ?? 0);

if (empty($_SESSION['logged_in']) || $uid <= 0) {
    echo json_encode([
        'authenticated' => false,
        'reason' => 'no_session_data',
        'debug' => $debug,
    ]);
    exit;
}

require_once __DIR__ . '/../classes/User.php';

$user = new User();
$userId = $uid;
$userData = $user->getUserById($userId);

if (!$userData) {
    // Si el user no existe, limpiar sesión
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

    echo json_encode([
        'authenticated' => false,
        'reason' => 'user_not_found',
        'debug' => $debug,
    ]);
    exit;
}

echo json_encode([
    'authenticated' => true,
    'user' => [
        'user_id' => $userData['user_id'],
        'email' => $userData['email'],
        'first_name' => $userData['first_name'],
        'last_name' => $userData['last_name'] ?? null,
    ],
    'debug' => $debug,
]);
