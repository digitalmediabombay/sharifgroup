<?php
require_once __DIR__ . '/../admin/api/db.php';
require_once __DIR__ . '/../admin/api/homepage-regen.php';

$pub = readPublishedSnapshot();
$rootDir = realpath(__DIR__ . '/..');

$hp = $pub['sgcms_homepage'] ?? [];
$homeFiles = [
    'en' => $rootDir . '/index.html',
    'ar' => $rootDir . '/ar/index.html',
    'fa' => $rootDir . '/fa/index.html',
    'zh' => $rootDir . '/zh/index.html',
];

foreach ($homeFiles as $lang => $filePath) {
    $t0 = microtime(true);
    $html = file_get_contents($filePath);
    $tRead = microtime(true);
    
    // Test regex speed
    $hero = $hp['hero'][$lang] ?? ($hp['hero']['en'] ?? []);
    if (!empty($hero['headline'])) {
        $html = ssgReplaceI18nElement($html, 'hero.title', $hero['headline']);
    }
    $tHero = microtime(true);
    
    file_put_contents($filePath, $html);
    $tWrite = microtime(true);
    
    echo "$lang: Read=" . round(($tRead - $t0)*1000) . "ms, Regex=" . round(($tHero - $tRead)*1000) . "ms, Write=" . round(($tWrite - $tHero)*1000) . "ms\n";
}
