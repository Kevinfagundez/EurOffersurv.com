<?php
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');

file_put_contents(
  __DIR__ . '/timewall_ping.log',
  date('c') . ' ' . json_encode($_GET) . PHP_EOL,
  FILE_APPEND
);

echo json_encode([
  'status' => 'ok',
  'message' => 'TimeWall postback reached'
]);
