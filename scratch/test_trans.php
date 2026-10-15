<?php
require_once __DIR__ . '/../admin/api/translate_sync.php';
$t = translateTextServer('Citizenship', 'zh', 'en');
echo json_encode(['res' => $t], JSON_UNESCAPED_UNICODE) . PHP_EOL;
$t2 = translateTextServer('Educational Advisory', 'zh', 'en');
echo json_encode(['res' => $t2], JSON_UNESCAPED_UNICODE) . PHP_EOL;
