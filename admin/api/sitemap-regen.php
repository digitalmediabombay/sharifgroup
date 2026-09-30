<?php
/**
 * Sharif Group CMS - Sitemap Regeneration Endpoint
 * Called asynchronously (fire-and-forget) from the admin dashboard after publish.
 * Completely decouples sitemap generation from the publish response so the
 * publish button does not get stuck waiting for disk I/O.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed.'], 405);
}

startSecureSession();
requireAdminAuth();

$rootDir = realpath(dirname(__DIR__, 2));

if (!$rootDir) {
    jsonResponse(['success' => false, 'error' => 'Could not resolve website root directory.'], 500);
}

$sitemapFile = $rootDir . '/sitemap.php';

if (!file_exists($sitemapFile)) {
    jsonResponse(['success' => false, 'error' => 'sitemap.php not found at: ' . $sitemapFile], 500);
}

try {
    require_once $sitemapFile;
    if (!function_exists('buildSitemapXml')) {
        jsonResponse(['success' => false, 'error' => 'buildSitemapXml() function not found in sitemap.php.'], 500);
    }
    $result = buildSitemapXml($rootDir, true);
    jsonResponse([
        'success'      => true,
        'fileWritten'  => $result['fileWritten'] ?? false,
        'urlCount'     => $result['urlCount'] ?? 0,
        'entriesCount' => $result['entriesCount'] ?? 0,
        'message'      => 'Sitemap regenerated with ' . ($result['urlCount'] ?? 0) . ' URLs.'
    ]);
} catch (Throwable $e) {
    error_log('[SharifCMS Sitemap Regen Error] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
