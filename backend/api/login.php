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

// ✅ Iniciar sesión DESPUÉS de CORS+cookie params (que ya setea _cors.php)
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

if (!empty($result['success']) && !empty($result['user']['user_id'])) {

    // ✅ CLAVE: regenerar el ID de sesión al autenticar (evita sesiones inestables)
    session_regenerate_id(true);

    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = (int)$result['user']['user_id'];
    $_SESSION['email'] = (string)($result['user']['email'] ?? '');

    // ✅ Asegura que PHP escriba la sesión antes de responder
    session_write_close();

    echo json_encode([
        'success' => true,
        'message' => $result['message'] ?? 'Inicio de sesión exitoso',
        'user' => $result['user'],
        'debug' => [
            'session_id' => session_id(), // ojo: después de write_close puede quedar el anterior en algunos entornos
            'cookie_name' => session_name(),
            'has_cookie_in_request' => isset($_COOKIE[session_name()]),
            'origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
            'xf_proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null,
            'host' => $_SERVER['HTTP_HOST'] ?? null,
            'uri' => $_SERVER['REQUEST_URI'] ?? null,
        ],
    ]);
    exit;
}

http_response_code(401);
echo json_encode($result);
