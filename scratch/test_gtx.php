<?php
require_once __DIR__ . '/../admin/api/translate_sync.php';

$resZh = translateTextServer("Welcome to Sharif Group", "zh", "en");
echo "ZH result: " . $resZh . "\n";
echo "ZH hex: " . bin2hex($resZh) . "\n";

$resAr = translateTextServer("Welcome to Sharif Group", "ar", "en");
echo "AR result: " . $resAr . "\n";

$resFa = translateTextServer("Welcome to Sharif Group", "fa", "en");
echo "FA result: " . $resFa . "\n";
