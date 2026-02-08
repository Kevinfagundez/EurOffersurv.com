<?php
/**
 * API Endpoint - Login de usuarios
 * POST /api/login.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';
header('Content-Type: application/json; charset=UTF-8');

// Si por alguna razón llega OPTIONS directo acá (a veces pasa según server),
// respondemos limpio.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

session_start();

require_once __DIR__ . '/../classes/User.php';

$data = json_decode((string)file_get_contents('php://input'), true);

if (!$data || empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos']);
    exit;
}

$user = new User();
$result = $user->login($data['email'], $data['password']);

if (empty($result['success'])) {
    http_response_code(401);
    echo json_encode($result);
    exit;
}

// ✅ user_id es STRING (ej: user_...)
// NO castear a int
$uid = $result['user']['user_id'] ?? null;

if (!is_string($uid) || trim($uid) === '') {
    session_unset();
    session_destroy();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login inválido: user_id no válido (vacío). Revisa User::login()',
        'debug' => [
            'user_keys' => isset($result['user']) && is_array($result['user']) ? array_keys($result['user']) : null,
        ]
    ]);
    exit;
}

// ✅ CLAVE: regenerar ID al loguear
session_regenerate_id(true);

$_SESSION['logged_in'] = true;
$_SESSION['user_id'] = $uid;
$_SESSION['email'] = (string)($result['user']['email'] ?? '');

// 🔥 DEBUG (temporal): ver si la sesión se setea y qué ID queda
$debug = [
    'session_id' => session_id(),
    'cookie_name' => session_name(),
    'has_cookie_in_request' => isset($_COOKIE[session_name()]),
    'cookies_received' => array_keys($_COOKIE),
    'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
    'xf_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null,
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
    'session_logged_in' => $_SESSION['logged_in'] ?? null,
    'session_user_id' => $_SESSION['user_id'] ?? null,
];

// Guardar sesión antes de responder
session_write_close();

echo json_encode([
    'success' => true,
    'message' => $result['message'] ?? 'Inicio de sesión exitoso',
    'user' => $result['user'],
    'debug' => $debug,
]);
