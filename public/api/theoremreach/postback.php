<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../../../config/database.php";
require_once __DIR__ . "/../../../classes/User.php";
require_once __DIR__ . "/../../../classes/Transaction.php";

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

$SECRET = getenv("THEOREMREACH_SECRET");
if (!$SECRET) {
  respond(500, ["status" => "error", "message" => "Secret not configured"]);
}

$scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
$host = $_SERVER["HTTP_HOST"] ?? "";
$path = strtok($_SERVER["REQUEST_URI"], "?");
$queryString = (string)($_SERVER["QUERY_STRING"] ?? "");

$qsNoHash = preg_replace('/(^|&)\s*hash=[^&]*/', '', $queryString);
$qsNoHash = ltrim($qsNoHash, '&');

$baseUrl = $scheme . "://" . $host . $path . ($qsNoHash !== "" ? "?" . $qsNoHash : "");

$hmac = hash_hmac("sha1", utf8_encode($baseUrl), utf8_encode($SECRET), true);
$signature = base64_encode($hmac);
$expectedHash = str_replace(["+","/","=","\n","\r"], ["-","_","","",""], $signature);

if (!hash_equals($expectedHash, $hash)) {
  respond(403, ["status" => "error", "message" => "Invalid hash"]);
}

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
  $txResult = $tx->create($userId, $txId, $reward, "reward", "theoremreach", "TR reward");

  if (!empty($txResult["duplicate"])) {
    $conn->commit();
    respond(200, ["status" => "ok", "message" => "Already processed"]);
  }

  if (empty($txResult["success"])) {
    $conn->rollBack();
    respond(500, ["status" => "error", "message" => "Could not create transaction"]);
  }

  $user->updateBalance($userId, $reward);

  $conn->commit();
  respond(200, ["status" => "ok"]);
} catch (Throwable $e) {
  try { if (isset($conn) && $conn->inTransaction()) $conn->rollBack(); } catch (Throwable $ignored) {}
  error_log("TR postback error: " . $e->getMessage());
  respond(500, ["status" => "error", "message" => "Server error"]);
}
