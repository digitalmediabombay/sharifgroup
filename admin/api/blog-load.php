<?php
/**
 * Sharif Group CMS - Load Single Blog Post API
 * Retrieves full blog post data for editing (from draft or published content).
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/translate_sync.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

$id = trim($_GET['id'] ?? ($_GET['slug'] ?? ''));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Missing blog ID or slug.'], 400);
}

$draftSnapshot = readDraftSnapshot();
$publishedSnapshot = readPublishedSnapshot();

$draftBlogs = $draftSnapshot['sgcms_blog'] ?? [];
$pubBlogs = $publishedSnapshot['sgcms_blog'] ?? [];

$found = null;

// Search drafts first
foreach ($draftBlogs as $item) {
    if (!is_array($item)) continue;
    if (($item['id'] ?? '') === $id || ($item['slug'] ?? '') === $id) {
        $found = $item;
        break;
    }
}

// Fallback search published
if (!$found) {
    foreach ($pubBlogs as $item) {
        if (!is_array($item)) continue;
        if (($item['id'] ?? '') === $id || ($item['slug'] ?? '') === $id) {
            $found = $item;
            break;
        }
    }
}

// Cross-check MySQL cms_content so valid database translations (e.g. zh/ar/fa) are never masked by stale JSON
try {
    $pdo = getDb(true);
    if ($pdo) {
        $stmt = $pdo->query("SELECT draft_data, live_data FROM cms_content WHERE content_key = 'sgcms_blog' LIMIT 1");
        $row = $stmt ? $stmt->fetch() : null;
        if ($row) {
            foreach (['draft_data', 'live_data'] as $col) {
                if (empty($row[$col])) continue;
                $dbList = json_decode($row[$col], true);
                if (!is_array($dbList)) continue;
                foreach ($dbList as $dbItem) {
                    if (!is_array($dbItem)) continue;
                    if (($dbItem['id'] ?? '') !== $id && ($dbItem['slug'] ?? '') !== $id) continue;
                    if (!$found) {
                        $found = $dbItem;
                        break;
                    }
                    foreach (['zh', 'ar', 'fa'] as $chkLng) {
                        if (empty($dbItem[$chkLng]) || !is_array($dbItem[$chkLng])) continue;
                        if (!isset($found[$chkLng]) || !is_array($found[$chkLng])) $found[$chkLng] = [];
                        foreach (['title', 'body', 'excerpt', 'meta_title', 'meta_desc'] as $fld) {
                            $dbVal = trim((string)($dbItem[$chkLng][$fld] ?? ''));
                            $curVal = trim((string)($found[$chkLng][$fld] ?? ''));
                            if ($dbVal !== '' && hasNonLatinChars($dbVal, $chkLng) && !hasNonLatinChars($curVal, $chkLng)) {
                                $found[$chkLng][$fld] = $dbItem[$chkLng][$fld];
                            }
                        }
                    }
                    break;
                }
            }
        }
    }
} catch (Throwable $e) {}

if (!$found) {
    jsonResponse(['success' => false, 'error' => 'Blog post not found.'], 404);
}

// Ensure clean structure for all 4 languages
$languages = ['en', 'ar', 'fa', 'zh'];
foreach ($languages as $lng) {
    if (!isset($found[$lng]) || !is_array($found[$lng])) {
        $found[$lng] = [];
    }
    $found[$lng]['title'] = $found[$lng]['title'] ?? ($lng === 'en' ? ($found['title'] ?? '') : '');
    $found[$lng]['body'] = $found[$lng]['body'] ?? ($lng === 'en' ? ($found['body'] ?? '') : '');
    $found[$lng]['excerpt'] = $found[$lng]['excerpt'] ?? '';
    $found[$lng]['meta_title'] = $found[$lng]['meta_title'] ?? '';
    $found[$lng]['meta_desc'] = $found[$lng]['meta_desc'] ?? '';
    $foundFaqs = !empty($found['faqs']) && is_array($found['faqs']) ? $found['faqs'] : [];
    $enFaqs = !empty($found['en']['faqs']) && is_array($found['en']['faqs']) ? $found['en']['faqs'] : $foundFaqs;
    if (!isset($found[$lng]['faqs']) || !is_array($found[$lng]['faqs']) || empty($found[$lng]['faqs'])) {
        $found[$lng]['faqs'] = $enFaqs;
    }
}

// Normalize faqs map for frontend
$enFaqs = !empty($found['en']['faqs']) && is_array($found['en']['faqs']) ? $found['en']['faqs'] : (!empty($found['faqs']) && is_array($found['faqs']) ? $found['faqs'] : []);
$faqsMap = [
    'en' => $enFaqs,
    'ar' => !empty($found['ar']['faqs']) && is_array($found['ar']['faqs']) ? $found['ar']['faqs'] : $enFaqs,
    'fa' => !empty($found['fa']['faqs']) && is_array($found['fa']['faqs']) ? $found['fa']['faqs'] : $enFaqs,
    'zh' => !empty($found['zh']['faqs']) && is_array($found['zh']['faqs']) ? $found['zh']['faqs'] : $enFaqs
];

jsonResponse([
    'success' => true,
    'blog'    => $found,
    'faqs'    => $faqsMap
]);
