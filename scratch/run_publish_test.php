<?php
chdir(__DIR__ . '/../admin/api');
$_SERVER['REQUEST_METHOD'] = 'POST';

// Mock session and auth
session_start();
$_SESSION['sgcms_admin_authenticated'] = true;
$_SESSION['sgcms_admin_role'] = 'superadmin';
$_SESSION['sgcms_admin_user'] = ['id' => 'u1', 'name' => 'Admin User', 'email' => 'admin@sharifgroup.ae'];

$payload = [
    'version' => '3.0.0',
    'publisher' => 'Admin User',
    'publishedAt' => date('Y-m-d H:i:s'),
    'data' => [
        'sgcms_settings' => [
            'site_name' => 'Sharif Group'
        ]
    ]
];

// Mock getJsonBody in db.php:
require_once __DIR__ . '/../admin/api/db.php';

// We can test the publish routines directly
$t0 = microtime(true);
$currentPublished = readPublishedSnapshot();
$currentPublished['sgcms_settings']['site_name'] = 'Sharif Group';

$fileWritten = writePublishedSnapshot($currentPublished);
require_once __DIR__ . '/../admin/api/blog-regen.php';
$bRes = regenerateBlogListings(realpath(__DIR__ . '/../..'), $currentPublished);

require_once __DIR__ . '/../admin/api/homepage-regen.php';
$hRes = regenerateHomepage(realpath(__DIR__ . '/../..'), $currentPublished);

$elapsed = round((microtime(true) - $t0) * 1000);
echo "Publish simulation finished successfully in {$elapsed}ms!\n";
echo "File written: " . ($fileWritten ? 'YES' : 'NO') . "\n";
echo "Blog listings updated: " . ($bRes['success'] ? 'YES' : 'NO') . "\n";
echo "Homepage updated: " . ($hRes['success'] ? 'YES' : 'NO') . "\n";
