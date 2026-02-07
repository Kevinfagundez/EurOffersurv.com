<?php
/**
 * API Endpoint - Login de usuarios
 * POST /api/login.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../classes/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos']);
    exit();
}

$user = new User();
$result = $user->login($data['email'], $data['password']);

if (!empty($result['success'])) {
    $_SESSION['logged_in'] = true;
    $_SESSION['user_id'] = $result['user']['user_id'];
    $_SESSION['email'] = $result['user']['email'];

    session_write_close();

    echo json_encode([
        'success' => true,
        'message' => $result['message'] ?? 'Inicio de sesión exitoso',
        'user' => $result['user'],
        'debug' => [
            'session_id' => session_id(),
            'cookie_name' => session_name(),
            'has_cookie_in_request' => isset($_COOKIE[session_name()]),
            'host' => $_SERVER['HTTP_HOST'] ?? null,
            'uri' => $_SERVER['REQUEST_URI'] ?? null,
        ]
    ]);
    exit();
}

http_response_code(401);
echo json_encode($result);
