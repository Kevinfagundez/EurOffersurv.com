<?php
/**
 * THEOREMREACH REWARD CALLBACK (POSTBACK)
 * Espera: user_id, reward, tx_id (o transaction_id), hash
 */

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../../config/database.php"; // AJUSTA si tu ruta difiere
require_once __DIR__ . "/../../classes/User.php";
require_once __DIR__ . "/../../classes/Transaction.php";

function respond(int $code, array $payload) {
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
  respond(405, ["status" => "error", "message" => "Method not allowed"]);
}

$userId = trim((string)($_GET["user_id"] ?? ""));
$rewardRaw = trim((string)($_GET["reward"] ?? ""));
$txId = trim((string)($_GET["tx_id"] ?? ($_GET["transaction_id"] ?? "")));
$hash = trim((string)($_GET["hash"] ?? ""));

if ($userId === "" || $rewardRaw === "" || $txId === "" || $hash === "") {
  respond(400, ["status" => "error", "message" => "Missing params"]);
}

if (!is_numeric($rewardRaw)) {
  respond(400, ["status" => "error", "message" => "Invalid reward"]);
}
$reward = (float)$rewardRaw;
if ($reward <= 0) {
  respond(400, ["status" => "error", "message" => "Invalid reward (<=0)"]);
}

/**
 * ✅ VALIDACIÓN HASH (HMAC-SHA1, base64, url-safe)
 * TR firma la URL base (callback + query sin hash).
 * Para evitar problemas de orden, usamos la query EXACTA recibida:
 */
$SECRET = getenv("THEOREMREACH_SECRET");
if (!$SECRET) {
  respond(500, ["status" => "error", "message" => "Secret not configured"]);
}

$scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
$host = $_SERVER["HTTP_HOST"] ?? "";
$path = strtok($_SERVER["REQUEST_URI"], "?"); // path sin query
$queryString = (string)($_SERVER["QUERY_STRING"] ?? "");

// quitar el hash de la query preservando orden
// elimina: hash=... y su & sobrante
$qsNoHash = preg_replace('/(^|&)\s*hash=[^&]*/', '', $queryString);
$qsNoHash = ltrim($qsNoHash, '&'); // por si quedó al inicio

$baseUrl = $scheme . "://" . $host . $path . ($qsNoHash !== "" ? "?" . $qsNoHash : "");

// firmar como en el ejemplo de TR
$hmac = hash_hmac("sha1", utf8_encode($baseUrl), utf8_encode($SECRET), true);
$signature = base64_encode($hmac);
$expectedHash = str_replace(["+","/","=","\n","\r"], ["-","_","","",""], $signature);

if (!hash_equals($expectedHash, $hash)) {
  respond(403, [
    "status" => "error",
    "message" => "Invalid hash"
    // En producción NO devuelvas expected/baseUrl
  ]);
}

// ✅ Procesamiento DB (idempotente por tx_id)
try {
  $db = Database::getInstance();
  $conn = $db->getConnection();
  $conn->beginTransaction();

  $user = new User();
  $existingUser = $user->getUserById($userId);
  if (!$existingUser) {
    $conn->rollBack();
    respond(404, ["status" => "error", "message" => "User not found"]);
  }

  $tx = new Transaction();

  // Importante: usa tx_id de TheoremReach como ID único
  // Asegúrate de que Transaction->create trate tx_id como UNIQUE para evitar doble crédito.
  $txResult = $tx->create($userId, $txId, $reward, "reward", "theoremreach", "TR reward");

  if (!empty($txResult["duplicate"])) {
    $conn->commit();
    respond(200, ["status" => "ok", "message" => "Already processed"]);
  }

  if (empty($txResult["success"])) {
    $conn->rollBack();
    respond(500, ["status" => "error", "message" => "Could not create transaction"]);
  }

  $updated = $user->updateBalance($userId, $reward);

  $conn->commit();
  respond(200, [
    "status" => "ok",
    "user_id" => $userId,
    "reward" => $reward,
    "tx_id" => $txId
  ]);
} catch (Throwable $e) {
  try {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
  } catch (Throwable $ignored) {}

  error_log("TR postback error: " . $e->getMessage());
  respond(500, ["status" => "error", "message" => "Server error"]);
}
