<?php
// /backend/api/theoremreach/callback.php

require_once __DIR__ . "/../../config/database.php"; // ajusta tu ruta real

header("Content-Type: application/json; charset=utf-8");

// 1) Tomar params
$user_id = $_GET["user_id"] ?? "";
$reward  = $_GET["reward"]  ?? "";
$tx_id   = $_GET["tx_id"]   ?? "";
$hash    = $_GET["hash"]    ?? "";

// Validaciones básicas
if ($user_id === "" || $reward === "" || $tx_id === "" || $hash === "") {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Missing params"]);
  exit;
}

// Normalizar reward a número (entero o decimal según tu app)
if (!is_numeric($reward)) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Invalid reward"]);
  exit;
}

// 2) Validar hash (firma)
// IMPORTANTE: TheoremReach suele firmar la URL completa (base) con HMAC-SHA1,
// luego base64 y "url-safe": +->-, /->_, quitar "=" y saltos.
// La "url base" debe ser EXACTAMENTE la misma que TR usó para generar el hash.
// Generalmente: callback.php + querystring SIN el hash (en el mismo orden).
$SECRET = getenv("THEOREMREACH_SECRET"); // mejor en env var
if (!$SECRET) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "Secret not configured"]);
  exit;
}

// Construir la URL base (sin hash). OJO: el orden de parámetros importa.
// Recomiendo fijarlo: user_id, reward, tx_id.
$scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
$host   = $_SERVER["HTTP_HOST"];
$path   = strtok($_SERVER["REQUEST_URI"], "?"); // /backend/api/theoremreach/callback.php

$baseUrl = $scheme . "://" . $host . $path . "?user_id=" . rawurlencode($user_id)
        . "&reward=" . rawurlencode($reward)
        . "&tx_id=" . rawurlencode($tx_id);

// Firmar
$hmac = hash_hmac("sha1", utf8_encode($baseUrl), utf8_encode($SECRET), true);
$signature = base64_encode($hmac);

// url-safe (como en tu captura: reemplazos y quitar "=")
$expectedHash = str_replace(["+","/","=","\n","\r"], ["-","_","","",""], $signature);

// Comparación segura
if (!hash_equals($expectedHash, $hash)) {
  http_response_code(403);
  echo json_encode([
    "status" => "error",
    "message" => "Invalid hash",
    "expected" => $expectedHash // QUITALO en producción
  ]);
  exit;
}

// 3) Idempotencia + acreditar
try {
  $pdo->beginTransaction();

  // tabla sugerida: theoremreach_transactions(tx_id UNIQUE, user_id, reward, created_at)
  $stmt = $pdo->prepare("SELECT 1 FROM theoremreach_transactions WHERE tx_id = ? LIMIT 1");
  $stmt->execute([$tx_id]);
  if ($stmt->fetchColumn()) {
    // Ya procesado: responder 200 igual
    $pdo->commit();
    http_response_code(200);
    echo json_encode(["status" => "ok", "message" => "Already processed"]);
    exit;
  }

  // Insertar transacción
  $stmt = $pdo->prepare("INSERT INTO theoremreach_transactions (tx_id, user_id, reward) VALUES (?, ?, ?)");
  $stmt->execute([$tx_id, $user_id, $reward]);

  // Acreditar al usuario (ajusta el nombre de tu tabla/campo)
  $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
  $stmt->execute([$reward, $user_id]);

  $pdo->commit();

  http_response_code(200);
  echo json_encode(["status" => "ok"]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "Server error"]);
}
