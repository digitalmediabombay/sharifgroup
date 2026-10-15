<?php
require_once __DIR__ . '/../admin/api/db.php';
require_once __DIR__ . '/../admin/api/blog-regen.php';
require_once __DIR__ . '/../admin/api/homepage-regen.php';

$t0 = microtime(true);
$pub = readPublishedSnapshot();
$tRead = microtime(true);

$bRes = regenerateBlogListings(realpath(__DIR__ . '/..'), $pub);
$tBlog = microtime(true);

$hRes = regenerateHomepage(realpath(__DIR__ . '/..'), $pub);
$tHome = microtime(true);

echo "Read: " . round(($tRead - $t0) * 1000) . "ms\n";
echo "Blog regen: " . round(($tBlog - $tRead) * 1000) . "ms\n";
echo "Home regen: " . round(($tHome - $tBlog) * 1000) . "ms\n";
echo "Total: " . round(($tHome - $t0) * 1000) . "ms\n";
