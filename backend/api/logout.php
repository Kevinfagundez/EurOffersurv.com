<?php
/**
 * API Endpoint - Logout
 * POST /api/logout.php
 */

declare(strict_types=1);

require_once __DIR__ . '/_cors.php';

session_start();
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

session_unset();
session_destroy();

echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente']);
