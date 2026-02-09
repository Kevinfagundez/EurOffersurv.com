<?php
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');

// Dentro de frontend/postback.php
require_once __DIR__ . '/../backend/config/database.php';
require_once __DIR__ . '/../backend/classes/Transaction.php';
require_once __DIR__ . '/../backend/classes/User.php';

// ... resto de la lógica de TheoremReach/TimeWall

file_put_contents(
  __DIR__ . '/timewall_ping.log',
  date('c') . ' ' . json_encode($_GET) . PHP_EOL,
  FILE_APPEND
);

echo json_encode([
  'status' => 'ok',
  'message' => 'TimeWall postback reached'
]);
