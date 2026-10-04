<?php
/**
 * Sharif Group CMS - Delete Blog API
 * Permanently removes a blog article from both draft and live published stores
 * (MySQL and JSON snapshots), updates deleted slugs blacklist, and immediately
 * regenerates sitemap.xml so deleted articles disappear instantly from the sitemap.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$payload = getJsonBody();
if (empty($payload)) {
    jsonResponse(['success' => false, 'error' => 'No request body received.'], 400);
}

$id = isset($payload['id']) ? trim($payload['id']) : '';
$slug = isset($payload['slug']) ? trim($payload['slug']) : '';
$incomingList = (isset($payload['data']) && is_array($payload['data'])) ? $payload['data'] : null;

if (!$id && !$slug && $incomingList === null) {
    jsonResponse(['success' => false, 'error' => 'Article ID or slug is required.'], 400);
}

// Build list of targets to delete
$targets = [];
if ($id !== '') {
    $targets[strtolower($id)] = true;
}
if ($slug !== '') {
    $targets[strtolower($slug)] = true;
}

// Helper filter function
$filterBlogs = function($list) use ($targets) {
    if (!is_array($list)) return [];
    $filtered = [];
    foreach ($list as $item) {
        if (!is_array($item)) continue;
        $iId = strtolower(trim($item['id'] ?? ''));
        $iSlug = strtolower(trim($item['slug'] ?? ($item['en']['slug'] ?? '')));
        $iEnSlug = strtolower(trim($item['en']['slug'] ?? ''));

        if ($iId && isset($targets[$iId])) continue;
        if ($iSlug && isset($targets[$iSlug])) continue;
        if ($iEnSlug && isset($targets[$iEnSlug])) continue;

        $filtered[] = $item;
    }
    return $filtered;
};

// 1. Update published_content.json (LIVE)
$pubSnapshot = readPublishedSnapshot();
$pubBlogs = $pubSnapshot['sgcms_blog'] ?? [];
if ($incomingList !== null) {
    $updatedPubBlogs = $filterBlogs($incomingList);
} else {
    $updatedPubBlogs = $filterBlogs($pubBlogs);
}
$pubSnapshot['sgcms_blog'] = array_values($updatedPubBlogs);

// Maintain sgcms_deleted_slugs blacklist
if (!isset($pubSnapshot['sgcms_deleted_slugs']) || !is_array($pubSnapshot['sgcms_deleted_slugs'])) {
    $pubSnapshot['sgcms_deleted_slugs'] = [];
}
foreach (array_keys($targets) as $t) {
    if (!in_array($t, $pubSnapshot['sgcms_deleted_slugs'])) {
        $pubSnapshot['sgcms_deleted_slugs'][] = $t;
    }
}
$pubWritten = writePublishedSnapshot($pubSnapshot);

// 2. Update draft_content.json (DRAFT)
$draftSnapshot = readDraftSnapshot();
$draftBlogs = $draftSnapshot['sgcms_blog'] ?? [];
if ($incomingList !== null) {
    $updatedDraftBlogs = $filterBlogs($incomingList);
} else {
    $updatedDraftBlogs = $filterBlogs($draftBlogs);
}
$draftSnapshot['sgcms_blog'] = array_values($updatedDraftBlogs);

if (!isset($draftSnapshot['sgcms_deleted_slugs']) || !is_array($draftSnapshot['sgcms_deleted_slugs'])) {
    $draftSnapshot['sgcms_deleted_slugs'] = [];
}
foreach (array_keys($targets) as $t) {
    if (!in_array($t, $draftSnapshot['sgcms_deleted_slugs'])) {
        $draftSnapshot['sgcms_deleted_slugs'][] = $t;
    }
}
$draftWritten = writeDraftSnapshot($draftSnapshot);

// 3. Update MySQL if configured
$db = getDb(true);
$dbUpdated = false;
if ($db !== null) {
    try {
        $jsonPub = json_encode($pubSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $jsonDraft = json_encode($draftSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $stmt = $db->prepare("
            INSERT INTO cms_content (content_key, draft_data, live_data, updated_at, published_at)
            VALUES ('sgcms_blog', :draft, :live, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                draft_data = VALUES(draft_data),
                live_data = VALUES(live_data),
                updated_at = NOW(),
                published_at = NOW()
        ");
        $stmt->execute([':draft' => $jsonDraft, ':live' => $jsonPub]);

        // Also record deleted slugs blacklist in MySQL
        $delJson = json_encode($pubSnapshot['sgcms_deleted_slugs'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $dStmt = $db->prepare("
            INSERT INTO cms_content (content_key, draft_data, live_data, updated_at)
            VALUES ('sgcms_deleted_slugs', :d, :d, NOW())
            ON DUPLICATE KEY UPDATE
                draft_data = VALUES(draft_data),
                live_data = VALUES(live_data),
                updated_at = NOW()
        ");
        $dStmt->execute([':d' => $delJson]);

        $dbUpdated = true;
    } catch (Exception $e) {
        error_log('[SharifCMS Delete Blog DB Error] ' . $e->getMessage());
    }
}

// 4. Regenerate sitemap.xml immediately
$sitemapUpdated = false;
$urlCount = 0;
$rootDir = realpath(dirname(__DIR__, 2));
if ($rootDir && file_exists($rootDir . '/sitemap.php')) {
    try {
        require_once $rootDir . '/sitemap.php';
        if (function_exists('buildSitemapXml')) {
            $sRes = buildSitemapXml($rootDir, true);
            $sitemapUpdated = $sRes['fileWritten'] ?? false;
            $urlCount = $sRes['urlCount'] ?? 0;
        }
    } catch (Throwable $e) {
        error_log('[SharifCMS Delete Blog Sitemap Error] ' . $e->getMessage());
    }
}

jsonResponse([
    'success'        => true,
    'message'        => 'Article permanently deleted from drafts, live site, and sitemap.',
    'deletedId'      => $id,
    'deletedSlug'    => $slug,
    'remainingCount' => count($pubSnapshot['sgcms_blog']),
    'sitemapUpdated' => $sitemapUpdated,
    'sitemapUrls'    => $urlCount,
    'fileWritten'    => $pubWritten && $draftWritten,
    'dbUpdated'      => $dbUpdated
]);
