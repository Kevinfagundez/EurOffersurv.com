<?php
require_once '../config/database.php';

header('Content-Type: application/json; charset=utf-8');

function pick($arr, $keys, $default = null) {
  foreach ($keys as $k) {
    if (isset($arr[$k]) && $arr[$k] !== '') return $arr[$k];
  }
  return $default;
}

function ok($payload = []) {
  http_response_code(200);
  echo json_encode(array_merge(['status' => 'success'], $payload));
  exit;
}

function bad($message, $extra = []) {
  http_response_code(400);
  echo json_encode(array_merge(['status' => 'error', 'message' => $message], $extra));
  exit;
}

// Log crudo para ver qué llega
$raw = [
  'time' => date('c'),
  'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
  'get' => $_GET,
];
@file_put_contents(__DIR__ . '/timewall_postback.log', json_encode($raw) . PHP_EOL, FILE_APPEND);

// Params (TimeWall puede variar nombres)
$uid = pick($_GET, ['uid', 'external_user_id', 'externalUserId', 'user_id', 'userid']);
$status = strtoupper(pick($_GET, ['status', 'event_status', 'state'], ''));

// Monto (a veces viene como usd_amount)
$amount = pick($_GET, ['amount', 'usd_amount', 'payout', 'usd', 'reward'], 0);
$currency = pick($_GET, ['currency', 'cur'], 'USD');

// ID único (en tu BD será transactions.transaction_id)
$txId = pick($_GET, ['tx_id', 'transaction_id', 'withdraw_id', 'withdrawId', 'click_id', 'conversion_id']);

if (!$uid || !$txId) {
  bad('Faltan parámetros mínimos (uid/txId)', [
    'received_uid' => $uid,
    'received_txId' => $txId
  ]);
}

if (!is_numeric($amount)) $amount = 0;
$amount = floatval($amount);

// Conexión
$db = Database::getInstance()->getConnection();

// Buscar usuario por users.user_id (NO por id numérico)
$stmt = $db->prepare("SELECT user_id, username, balance, total_earned FROM users WHERE user_id = :uid LIMIT 1");
$stmt->execute([':uid' => $uid]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
  // Respondemos 200 para que TimeWall no reintente eternamente
  ok([
    'message' => 'Usuario no encontrado (no se acreditó)',
    'uid' => $uid,
    'tx_id' => $txId,
    'status_in' => $status
  ]);
}

// Idempotencia: si ya existe esa transaction_id, no acreditamos 2 veces
$exists = $db->prepare("SELECT id, created_at FROM transactions WHERE transaction_id = :tx LIMIT 1");
$exists->execute([':tx' => $txId]);
$existingTx = $exists->fetch(PDO::FETCH_ASSOC);

if ($existingTx) {
  ok([
    'message' => 'Duplicado (ya procesado)',
    'tx_id' => $txId,
    'user_id' => $user['user_id'],
    'original_date' => $existingTx['created_at']
  ]);
}

// Decisión de acreditación (si querés solo approved, dejalo así)
$shouldCredit = in_array($status, ['APPROVED', 'PAID', 'COMPLETED', ''], true);

// Guardar user_agent e ip si querés
$ip = $_SERVER['REMOTE_ADDR'] ?? null;
$ua = $_SERVER['HTTP_USER_AGENT'] ?? null;

$db->beginTransaction();

try {
  // Insertar transacción SIEMPRE
  $ins = $db->prepare("
    INSERT INTO transactions (user_id, transaction_id, amount, type, status, source, description, ip_address, user_agent, created_at)
    VALUES (:user_id, :tx, :amount, 'reward', :status, 'timewall', :desc, :ip, :ua, CURRENT_TIMESTAMP)
  ");
  $desc = "TimeWall postback. Status={$status}. Currency={$currency}";
  $ins->execute([
    ':user_id' => $user['user_id'],
    ':tx' => $txId,
    ':amount' => $amount,
    ':status' => ($status !== '' ? strtolower($status) : 'completed'),
    ':desc' => $desc,
    ':ip' => $ip,
    ':ua' => $ua
  ]);

  // Acreditar solo si corresponde y amount>0
  if ($shouldCredit && $amount > 0) {
    $upd = $db->prepare("
      UPDATE users
      SET balance = balance + :amount,
          total_earned = total_earned + :amount,
          completed_offers = completed_offers + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = :user_id
    ");
    $upd->execute([
      ':amount' => $amount,
      ':user_id' => $user['user_id']
    ]);
  }

  $db->commit();

  ok([
    'message' => ($shouldCredit && $amount > 0) ? 'Acreditado' : 'Registrado (sin acreditar por status/payout)',
    'uid' => $uid,
    'tx_id' => $txId,
    'amount' => $amount,
    'currency' => $currency,
    'status_in' => $status
  ]);

} catch (Exception $e) {
  $db->rollBack();
  http_response_code(500);
  echo json_encode([
    'status' => 'error',
    'message' => 'Error interno',
    'details' => $e->getMessage()
  ]);
  exit;
}
