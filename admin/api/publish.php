<?php
/**
 * Sharif Group CMS - Publish Live API
 * Promotes all draft content keys to live production status in MySQL and published_content.json.
 * NOTE: Sitemap regeneration is handled separately via api/sitemap-regen.php (called async from JS).
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$payload = getJsonBody();

if (empty($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
    jsonResponse(['success' => false, 'error' => 'Invalid publication payload.'], 400);
}

$version = isset($payload['version']) ? trim($payload['version']) : '3.0.0';
$publisher = !empty($adminUser['name']) ? $adminUser['name'] : 'Admin User';
if (!empty($payload['publisher'])) {
    $publisher = trim($payload['publisher']);
}
$publishedAt = isset($payload['publishedAt']) ? $payload['publishedAt'] : date('Y-m-d H:i:s');

// Ensure no double-encoded JSON strings in published payload
foreach ($payload['data'] as $k => $v) {
    if (is_string($v)) {
        $trimmed = trim($v);
        if (($trimmed !== '' && $trimmed[0] === '{') || ($trimmed !== '' && $trimmed[0] === '[')) {
            $dec = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $payload['data'][$k] = $dec;
            }
        }
    }
}

// Maintain deleted slugs blacklist
$deletedSlugs = [];
if (!empty($payload['data']['sgcms_deleted_slugs']) && is_array($payload['data']['sgcms_deleted_slugs'])) {
    $deletedSlugs = $payload['data']['sgcms_deleted_slugs'];
}
$currentPublishedBefore = readPublishedSnapshot();
if (!empty($currentPublishedBefore['sgcms_deleted_slugs']) && is_array($currentPublishedBefore['sgcms_deleted_slugs'])) {
    $deletedSlugs = array_unique(array_merge($deletedSlugs, $currentPublishedBefore['sgcms_deleted_slugs']));
}
$payload['data']['sgcms_deleted_slugs'] = array_values($deletedSlugs);

$delMap = [];
foreach ($deletedSlugs as $ds) {
    $c = strtolower(trim((string)$ds));
    if ($c !== '') $delMap[$c] = true;
}

// Deduplicate blog entries and filter deleted items if sgcms_blog is present
if (isset($payload['data']['sgcms_blog']) && is_array($payload['data']['sgcms_blog'])) {
    $dedupedBlogs = [];
    $seenIds = [];
    $seenTitles = [];
    foreach ($payload['data']['sgcms_blog'] as $blogItem) {
        if (!is_array($blogItem)) continue;
        $id = strtolower(trim($blogItem['id'] ?? ''));
        $slug = strtolower(trim($blogItem['slug'] ?? ($blogItem['en']['slug'] ?? '')));
        $enSlug = strtolower(trim($blogItem['en']['slug'] ?? ''));

        // Skip if deleted
        if ($id && isset($delMap[$id])) continue;
        if ($slug && isset($delMap[$slug])) continue;
        if ($enSlug && isset($delMap[$enSlug])) continue;
        if (!empty($blogItem['deleted']) || ($blogItem['status'] ?? '') === 'deleted') continue;

        $titleEn = trim($blogItem['en']['title'] ?? ($blogItem['title'] ?? ''));
        $titleAr = trim($blogItem['ar']['title'] ?? '');
        $titleKey = mb_strtolower($titleEn ?: $titleAr);

        if ($id && isset($seenIds[$id])) continue;
        if ($titleKey && isset($seenTitles[$titleKey])) continue;

        if ($id) $seenIds[$id] = true;
        if ($titleKey) $seenTitles[$titleKey] = true;
        $dedupedBlogs[] = $blogItem;
    }
    $payload['data']['sgcms_blog'] = array_values($dedupedBlogs);
}

// 1. GUARANTEED LIVE UPDATE: Merge and write published snapshot directly to published_content.json
$currentPublished = readPublishedSnapshot();
foreach ($payload['data'] as $k => $v) {
    $currentPublished[$k] = $v;
}
$fileWritten = writePublishedSnapshot($currentPublished);
if (!$fileWritten) {
    error_log('[SharifCMS Publish File Warning] published_content.json could not be written directly.');
}

// Also update draft snapshot
try {
    $currentDraft = readDraftSnapshot();
    foreach ($payload['data'] as $k => $v) {
        $currentDraft[$k] = $v;
    }
    writeDraftSnapshot($currentDraft);
} catch (Exception $e) {}

// 2. MySQL DATABASE UPDATE: Sync into MySQL if database is configured
$db = getDb(true);
$dbPublished = false;
$dbError = null;
$updatedKeys = array_keys($payload['data']);

if ($db !== null) {
    try {
        $db->beginTransaction();

        $upsertStmt = $db->prepare("
            INSERT INTO cms_content (content_key, draft_data, live_data, updated_at, published_at)
            VALUES (:key, :draft, :live, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                draft_data = VALUES(draft_data),
                live_data = VALUES(live_data),
                updated_at = NOW(),
                published_at = NOW()
        ");

        foreach ($payload['data'] as $key => $val) {
            $jsonStr = json_encode($val, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $upsertStmt->execute([
                ':key'   => $key,
                ':draft' => $jsonStr,
                ':live'  => $jsonStr
            ]);
        }

        // Insert into Publish Log
        $logStmt = $db->prepare("
            INSERT INTO cms_publish_log (version, publisher, published_at, summary)
            VALUES (?, ?, NOW(), ?)
        ");
        $summary = sprintf("Published %d sections: %s", count($updatedKeys), implode(', ', array_slice($updatedKeys, 0, 10)));
        $logStmt->execute([$version, $publisher, $summary]);

        $db->commit();
        $dbPublished = true;
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        $dbError = $e->getMessage();
        error_log('[SharifCMS Publish DB Error] ' . $dbError);
    }
}

// 3. Atomically update sitemap.xml on disk (takes ~25ms)
$sitemapUpdated = false;
$sitemapUrlCount = 0;
try {
    $rootDir = realpath(dirname(__DIR__, 2));
    if ($rootDir && file_exists($rootDir . '/sitemap.php')) {
        require_once $rootDir . '/sitemap.php';
        if (function_exists('buildSitemapXml')) {
            $sResult = buildSitemapXml($rootDir, true);
            $sitemapUpdated = $sResult['fileWritten'] ?? false;
            $sitemapUrlCount = $sResult['urlCount'] ?? 0;
        }
    }
} catch (Throwable $se) {
    error_log('[SharifCMS Publish Sitemap Warning] ' . $se->getMessage());
}

// 4. Respond with complete status
jsonResponse([
    'success'        => true,
    'message'        => 'Content successfully published to live website' . ($dbPublished ? ' & MySQL database.' : '.'),
    'publishedAt'    => $publishedAt,
    'publisher'      => $publisher,
    'publishedKeys'  => $updatedKeys,
    'count'          => count($updatedKeys),
    'fileWritten'    => $fileWritten,
    'dbSynced'       => $dbPublished,
    'dbError'        => $dbError,
    'sitemapUpdated' => $sitemapUpdated,
    'sitemapUrlCount'=> $sitemapUrlCount
]);
