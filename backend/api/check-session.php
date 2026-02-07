<?php
/**
 * API Endpoint - Verificar sesión actual
 * GET /api/check-session.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

session_start();
header('Content-Type: application/json; charset=UTF-8');

// 🔎 Debug útil para Render / cross-domain
$debug = [
    'session_id' => session_id(),
    'cookie_name' => session_name(),
    'has_cookie_in_request' => isset($_COOKIE[session_name()]),
    'session_logged_in' => $_SESSION['logged_in'] ?? null,
    'session_user_id' => $_SESSION['user_id'] ?? null,
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
    'xf_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null,
];

// ✅ Si no llega cookie -> no hay sesión que validar (evita falsos positivos)
if (!isset($_COOKIE[session_name()])) {
    echo json_encode([
        'authenticated' => false,
        'reason' => 'no_session_cookie',
        'debug' => $debug
    ]);
    exit;
}

// ✅ Si falta data de sesión -> no autenticado
if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => false,
        'reason' => 'no_session_data',
        'debug' => $debug
    ]);
    exit;
}

require_once __DIR__ . '/../classes/User.php';

$user = new User();
$userId = (int) $_SESSION['user_id'];
$userData = $user->getUserById($userId);

// ✅ Si el usuario no existe en DB, limpiar sesión
if (!$userData) {
    session_unset();
    session_destroy();

    echo json_encode([
        'authenticated' => false,
        'reason' => 'user_not_found',
        'debug' => $debug
    ]);
    exit;
}

// ✅ OK
echo json_encode([
    'authenticated' => true,
    'user' => [
        'user_id' => $userData['user_id'],
        'email' => $userData['email'],
        'first_name' => $userData['first_name'],
        'last_name' => $userData['last_name'] ?? null,
    ],
    'debug' => $debug
]);
