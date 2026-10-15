<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['mode'] = 'draft';
ob_start();
require __DIR__ . '/../admin/api/content.php';
$out = ob_get_clean();
$json = json_decode($out, true);

echo "Success: " . ($json['success'] ? 'true' : 'false') . "\n";
echo "Source: " . ($json['source'] ?? 'unknown') . "\n";
echo "Count: " . ($json['count'] ?? 0) . "\n";
$hp = $json['data']['sgcms_homepage'] ?? null;
echo "Hero ZH headline: " . ($hp['hero']['zh']['headline'] ?? 'N/A') . "\n";
echo "Hero AR headline: " . ($hp['hero']['ar']['headline'] ?? 'N/A') . "\n";
echo "Hero FA headline: " . ($hp['hero']['fa']['headline'] ?? 'N/A') . "\n";
$ab = $json['data']['sgcms_aboutus'] ?? null;
echo "Aboutus ZH heading: " . ($ab['overview']['zh']['heading'] ?? 'N/A') . "\n";
echo "Aboutus ZH p1: " . mb_substr($ab['overview']['zh']['p1'] ?? '', 0, 40) . "\n";
