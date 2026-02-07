<?php

require_once __DIR__ . '/_cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__) . '/classes/User.php';

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Leer JSON
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'JSON inválido o vacío'
    ]);
    exit;
}

// Campos obligatorios reales
$requiredFields = [
    'firstName',
    'lastName',
    'email',
    'password',
    'birthDate'
];

foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Falta el campo: $field"
        ]);
        exit;
    }
}

// Validaciones
if (!User::validateEmail($input['email'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email inválido'
    ]);
    exit;
}

if (!User::validatePassword($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'La contraseña debe tener al menos 8 caracteres'
    ]);
    exit;
}

// Valores por defecto
$input['newsletter'] = isset($input['newsletter']) ? (bool)$input['newsletter'] : false;

// Registrar
$user = new User();
$result = $user->register($input);

http_response_code($result['success'] ? 201 : 400);
echo json_encode($result);
