<?php
/**
 * API Endpoint - Verificar sesión actual
 * GET /backend/api/check-session.php
 */

declare(strict_types=1);

session_start();
header('Content-Type: application/json');

$debug = [
    'session_id' => session_id(),
    'cookie_name' => session_name(),
    'has_cookie_in_request' => isset($_COOKIE[session_name()]),
    'session_logged_in' => $_SESSION['logged_in'] ?? null,
    'session_user_id' => $_SESSION['user_id'] ?? null,
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
];

if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => false,
        'debug' => $debug
    ]);
    exit();
}

require_once __DIR__ . '/../classes/User.php';

$user = new User();
$userData = $user->getUserById($_SESSION['user_id']);

if (!$userData) {
    session_unset();
    session_destroy();
    echo json_encode([
        'authenticated' => false,
        'debug' => $debug
    ]);
    exit();
}

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
