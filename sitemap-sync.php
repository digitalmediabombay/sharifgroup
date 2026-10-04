<?php
/**
 * Sharif Group - Immediate Sitemap Sync & Self-Heal Tool
 * Run via browser: https://sharifgroup.ae/sitemap-sync.php
 * Completely cleanses deleted_slugs blacklist, syncs draft blogs to live sitemap,
 * and regenerates sitemap.xml on disk.
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$rootDir = __DIR__;
$pubFile = $rootDir . '/admin/api/published_content.json';
$draftFile = $rootDir . '/admin/api/draft_content.json';

$log = [];
$log[] = "Starting Sharif Group Sitemap & Blacklist Sync...";

// 1. Read draft content
$draftData = [];
$draftBlogs = [];
if (file_exists($draftFile)) {
    $draftRaw = @file_get_contents($draftFile);
    if ($draftRaw) {
        $draftData = @json_decode($draftRaw, true) ?: [];
        if (!empty($draftData['sgcms_blog']) && is_array($draftData['sgcms_blog'])) {
            $draftBlogs = $draftData['sgcms_blog'];
            $log[] = "Found " . count($draftBlogs) . " blog article(s) in draft_content.json.";
        }
    }
}

// 2. Read published content
$pubData = [];
$pubBlogs = [];
if (file_exists($pubFile)) {
    $pubRaw = @file_get_contents($pubFile);
    if ($pubRaw) {
        $pubData = @json_decode($pubRaw, true) ?: [];
        if (!empty($pubData['sgcms_blog']) && is_array($pubData['sgcms_blog'])) {
            $pubBlogs = $pubData['sgcms_blog'];
            $log[] = "Found " . count($pubBlogs) . " blog article(s) in published_content.json.";
        }
    }
}

// 3. Collect active slugs that MUST NOT be blacklisted
$activeSlugs = [];
foreach (array_merge($pubBlogs, $draftBlogs) as $b) {
    if (!is_array($b)) continue;
    $s = strtolower(trim($b['slug'] ?? ($b['en']['slug'] ?? '')));
    $id = strtolower(trim($b['id'] ?? ''));
    if ($s !== '') $activeSlugs[$s] = true;
    if ($id !== '') $activeSlugs[$id] = true;
}

// 4. Remove active slugs from published_content.json deleted_slugs
if (isset($pubData['sgcms_deleted_slugs']) && is_array($pubData['sgcms_deleted_slugs'])) {
    $beforeCount = count($pubData['sgcms_deleted_slugs']);
    $pubData['sgcms_deleted_slugs'] = array_values(array_filter($pubData['sgcms_deleted_slugs'], function($item) use ($activeSlugs) {
        $ci = strtolower(trim((string)$item));
        return !isset($activeSlugs[$ci]);
    }));
    $afterCount = count($pubData['sgcms_deleted_slugs']);
    if ($beforeCount !== $afterCount) {
        $log[] = "Purged " . ($beforeCount - $afterCount) . " active slug(s) from published_content.json deleted list.";
    }
}

// 5. Remove active slugs from draft_content.json deleted_slugs
if (isset($draftData['sgcms_deleted_slugs']) && is_array($draftData['sgcms_deleted_slugs'])) {
    $beforeCount = count($draftData['sgcms_deleted_slugs']);
    $draftData['sgcms_deleted_slugs'] = array_values(array_filter($draftData['sgcms_deleted_slugs'], function($item) use ($activeSlugs) {
        $ci = strtolower(trim((string)$item));
        return !isset($activeSlugs[$ci]);
    }));
    $afterCount = count($draftData['sgcms_deleted_slugs']);
    if ($beforeCount !== $afterCount) {
        $log[] = "Purged " . ($beforeCount - $afterCount) . " active slug(s) from draft_content.json deleted list.";
    }
}

// 6. If published_content has no blogs but draft does, promote draft blogs to published
if (empty($pubData['sgcms_blog']) && !empty($draftBlogs)) {
    // Ensure status is published
    foreach ($draftBlogs as &$db) {
        $db['status_en'] = 'published';
        $db['status_ar'] = 'published';
        $db['status_fa'] = 'published';
        $db['status_zh'] = 'published';
        $db['status'] = 'published';
    }
    unset($db);
    $pubData['sgcms_blog'] = $draftBlogs;
    $log[] = "Promoted " . count($draftBlogs) . " draft blog(s) to published_content.json.";
}

// Save JSON snapshots
if (!empty($pubData)) {
    @file_put_contents($pubFile, json_encode($pubData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    $log[] = "Updated " . $pubFile;
}
if (!empty($draftData)) {
    @file_put_contents($draftFile, json_encode($draftData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    $log[] = "Updated " . $draftFile;
}

// 7. Update MySQL if available
if (file_exists($rootDir . '/admin/api/db.php')) {
    try {
        require_once $rootDir . '/admin/api/db.php';
        if (function_exists('getDb')) {
            $db = getDb(true);
            if ($db !== null) {
                if (!empty($pubData['sgcms_blog'])) {
                    $jsonStr = json_encode($pubData['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $stmt = $db->prepare("INSERT INTO cms_content (content_key, live_data, draft_data, updated_at) 
                        VALUES ('sgcms_blog', :live, :draft, NOW()) 
                        ON DUPLICATE KEY UPDATE live_data = :live2, draft_data = :draft2, updated_at = NOW()");
                    $stmt->execute([
                        ':live' => $jsonStr,
                        ':draft' => $jsonStr,
                        ':live2' => $jsonStr,
                        ':draft2' => $jsonStr
                    ]);
                    $log[] = "Synchronized sgcms_blog to MySQL.";
                }
                if (isset($pubData['sgcms_deleted_slugs'])) {
                    $delStr = json_encode($pubData['sgcms_deleted_slugs'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $stmt = $db->prepare("INSERT INTO cms_content (content_key, live_data, draft_data, updated_at) 
                        VALUES ('sgcms_deleted_slugs', :del, :del, NOW()) 
                        ON DUPLICATE KEY UPDATE live_data = :del2, draft_data = :del2, updated_at = NOW()");
                    $stmt->execute([
                        ':del' => $delStr,
                        ':del2' => $delStr
                    ]);
                    $log[] = "Synchronized sgcms_deleted_slugs to MySQL.";
                }
            }
        }
    } catch (Throwable $e) {
        $log[] = "MySQL Sync Note: " . $e->getMessage();
    }
}

// 8. Rebuild sitemap.xml on disk
require_once $rootDir . '/sitemap.php';
$sitemapResult = buildSitemapXml($rootDir, true);

$log[] = "Rebuilt sitemap.xml on disk: " . ($sitemapResult['fileWritten'] ? 'SUCCESS' : 'FAILED');
$log[] = "Total URLs indexed: " . $sitemapResult['urlCount'] . " (" . $sitemapResult['entriesCount'] . " unique paths × 4 languages).";

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sharif Group - Sitemap Sync Complete</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; margin: 0; }
        .container { max-width: 720px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { color: #f59e0b; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 10px; }
        .badge { background: #10b981; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
        .stat-card { background: #0f172a; padding: 18px; border-radius: 8px; border: 1px solid #334155; text-align: center; }
        .stat-val { font-size: 36px; font-weight: 800; color: #38bdf8; }
        .stat-lbl { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        ul.log { background: #0f172a; border-radius: 8px; padding: 16px 20px; list-style: none; margin: 20px 0; border: 1px solid #334155; font-family: monospace; font-size: 13px; line-height: 1.8; color: #cbd5e1; }
        ul.log li::before { content: "✓ "; color: #10b981; font-weight: bold; }
        .btn-group { display: flex; gap: 12px; margin-top: 24px; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer; }
        .btn-primary { background: #d97706; color: #fff; border: none; }
        .btn-primary:hover { background: #b45309; }
        .btn-secondary { background: #334155; color: #f8fafc; }
        .btn-secondary:hover { background: #475569; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sharif Group Dubai <span class="badge">Sitemap Synced</span></h1>
        <p style="color: #94a3b8;">The sitemap engine has purged the deleted blacklist, promoted dynamic CMS blogs, and generated fresh XML files on disk.</p>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-val"><?= htmlspecialchars((string)$sitemapResult['urlCount']) ?></div>
                <div class="stat-lbl">Total URLs in Sitemap</div>
            </div>
            <div class="stat-card">
                <div class="stat-val"><?= htmlspecialchars((string)$sitemapResult['entriesCount']) ?></div>
                <div class="stat-lbl">Unique Paths (×4 Languages)</div>
            </div>
        </div>

        <h3 style="font-size: 15px; color: #cbd5e1; margin-bottom: 8px;">Execution Log:</h3>
        <ul class="log">
            <?php foreach ($log as $line): ?>
                <li><?= htmlspecialchars($line) ?></li>
            <?php endforeach; ?>
        </ul>

        <div class="btn-group">
            <a href="/sitemap.xml" class="btn btn-primary" target="_blank">Open sitemap.xml</a>
            <a href="/admin/dashboard.html" class="btn btn-secondary">Go to Admin Dashboard</a>
        </div>
    </div>
</body>
</html>
