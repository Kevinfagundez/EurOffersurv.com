<?php
// ... (Tus headers y requires se mantienen igual)
// CORRIGE LOS REQUIRES PARA LA NUEVA UBICACIÓN:
require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/classes/User.php';
require_once __DIR__ . '/backend/classes/Transaction.php';

// ... (Config y Helpers se mantienen igual)

/** =========================
 * ADAPTACIÓN PARA TIMEWALL
 * ========================= */

// 1. Si viene de TimeWall, no traerá el token. 
// Vamos a relajar la validación SOLO si detectamos que es TimeWall o simplemente comenta esta parte para pruebas:
$token = $_GET['token'] ?? '';
if (!hash_equals(POSTBACK_TOKEN, $token) && !isset($_GET['external_user_id'])) {
    respond(401, ['status' => 'error', 'message' => 'Unauthorized']);
}

// 2. Mapeo de parámetros (Normalizamos los nombres)
$userId        = $_GET['user_id']        ?? $_GET['external_user_id'] ?? null;
$reward        = $_GET['reward']         ?? $_GET['amount']           ?? null;
$transactionId = $_GET['transaction_id'] ?? $_GET['withdraw_id']     ?? null;

// Validar que tenemos lo mínimo
if (!$userId || !$reward || !$transactionId) {
    respond(400, ['status' => 'error', 'message' => 'Faltan parámetros requeridos']);
}

// ... (El resto de tu lógica de Base de Datos se mantiene IGUAL)
// Solo asegúrate de cambiar la etiqueta del servicio al crear la transacción:
$provider = isset($_GET['external_user_id']) ? 'timewall' : 'theoremreach';
$txResult = $tx->create($userId, $transactionId, (float)$reward, 'reward', $provider, 'Oferta completada');