<?php
// /api/_cors.php
// CORS + Session cookie settings (Render cross-domain)

declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'https://euroffersurv-frontend.onrender.com',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
    header("Access-Control-Allow-Credentials: true");
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Evita cachés raros con sesión
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ===== Detectar HTTPS detrás de proxy (Render) =====
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

// ===== CLAVE: cookie de sesión compatible cross-site =====
// SameSite=None requiere Secure sí o sí en HTTPS
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.cookie_samesite', 'None');
ini_set('session.use_strict_mode', '1');

// Asegura params consistentes para la cookie de sesión
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'None',
]);
