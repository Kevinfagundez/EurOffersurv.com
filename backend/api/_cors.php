<?php
// /api/_cors.php
// CORS + Session cookie settings (Render + custom domain)

declare(strict_types=1);

// =====================
// 1) ORIGIN / WHITELIST
// =====================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    // ✅ Producción (dominio real)
    'https://www.euroffersurv.com',
    'https://euroffersurv.com',

    // ✅ Render (frontend preview)
    'https://euroffersurv-frontend.onrender.com',

    // ✅ Desarrollo local
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

// Si es un request CORS válido, devolvemos headers CORS correctos
if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
    header("Access-Control-Allow-Credentials: true");
}

// Para preflight y requests normales
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Evita cachés raros con sesión / auth
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// =====================
// 2) PRE-FLIGHT OPTIONS
// =====================
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    // Si el Origin no está permitido, cortamos (mejor seguridad)
    if ($origin && !in_array($origin, $allowed_origins, true)) {
        http_response_code(403);
        exit;
    }

    http_response_code(200);
    exit;
}

// =====================
// 3) HTTPS DETECTION
// =====================
$isHttps =
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

// =====================
// 4) SESSION COOKIE SETUP
// =====================
// IMPORTANTE: SameSite=None requiere Secure=true cuando estás en HTTPS.
// En Render, con proxy, $isHttps suele ser true gracias a X_FORWARDED_PROTO.
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.cookie_samesite', 'None');
ini_set('session.use_strict_mode', '1');

// Fijamos params consistentes (antes de session_start en los endpoints)
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'None',
]);

// NOTA: No llamamos session_start() acá para no forzar sesión en endpoints públicos.
// Llamalo en login/check-session/etc según necesites.
