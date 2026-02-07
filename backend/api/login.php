<?php
/**
 * API Endpoint - Login de usuarios
 * POST /api/login.php
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

// ✅ Obtener user_id de forma robusta (según cómo lo devuelva tu clase User)
$uidRaw =
    $result['user']['user_id'] ??
    $result['user']['id'] ??
    $result['user']['userId'] ??
    null;

$uid = is_numeric($uidRaw) ? (int)$uidRaw : 0;

if ($uid <= 0) {
    // Si no hay ID válido, NO crear sesión “a medias”
    session_unset();
    session_destroy();

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login inválido: user_id no válido (0). Revisa User::login()',
        'debug' => [
            'uidRaw' => $uidRaw,
            'user_keys' => isset($result['user']) && is_array($result['user']) ? array_keys($result['user']) : null,
            'session_id' => session_id(),
        ]
    ]);
    exit;
}

// ✅ CLAVE: regenerar ID al loguear
session_regenerate_id(true);

$_SESSION['logged_in'] = true;
$_SESSION['user_id'] = $uid;
$_SESSION['email'] = (string)($result['user']['email'] ?? '');

session_write_close();

echo json_encode([
    'success' => true,
    'message' => $result['message'] ?? 'Inicio de sesión exitoso',
    'user' => $result['user'],
    'debug' => [
        'session_id' => session_id(),
        'cookie_name' => session_name(),
        'uid' => $uid,
        'uidRaw' => $uidRaw,
        'user_keys' => isset($result['user']) && is_array($result['user']) ? array_keys($result['user']) : null,
    ]
]);
