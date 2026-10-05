<?php
/**
 * Sharif Group CMS - Save Draft API
 * Updates working draft data in MySQL and server-side draft snapshot
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

if (empty($body)) {
    jsonResponse(['success' => false, 'error' => 'No content received.'], 400);
}

$savedKeys = [];
$incomingData = [];

// Support single key save
if (isset($body['key']) && array_key_exists('data', $body)) {
    $incomingData[$body['key']] = $body['data'];
    $savedKeys[] = $body['key'];
}

// Support batch save
if (isset($body['batch']) && is_array($body['batch'])) {
    foreach ($body['batch'] as $k => $v) {
        $incomingData[$k] = $v;
        if (!in_array($k, $savedKeys)) {
            $savedKeys[] = $k;
        }
    }
}

if (empty($savedKeys)) {
    jsonResponse(['success' => false, 'error' => 'No valid keys to save.'], 400);
}

// Ensure no double-encoded JSON strings in incomingData
foreach ($incomingData as $k => $v) {
    if (is_string($v)) {
        $trimmed = trim($v);
        if (($trimmed !== '' && $trimmed[0] === '{') || ($trimmed !== '' && $trimmed[0] === '[')) {
            $dec = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $incomingData[$k] = $dec;
            }
        }
    }
}

// Deduplicate blog entries if sgcms_blog is present
if (!empty($incomingData['sgcms_blog']) && is_array($incomingData['sgcms_blog'])) {
    $dedupedBlogs = [];
    $seenIds = [];
    $seenTitles = [];
    foreach ($incomingData['sgcms_blog'] as $blogItem) {
        if (!is_array($blogItem)) continue;
        $id = $blogItem['id'] ?? '';
        $titleEn = trim($blogItem['en']['title'] ?? ($blogItem['title'] ?? ''));
        $titleAr = trim($blogItem['ar']['title'] ?? '');
        $titleFa = trim($blogItem['fa']['title'] ?? '');
        $titleZh = trim($blogItem['zh']['title'] ?? '');
        $rawTitle = $titleEn ?: ($titleAr ?: ($titleFa ?: $titleZh));
        $titleKey = mb_strtolower($rawTitle);
        
        if ($id && isset($seenIds[$id])) continue;
        if ($titleKey && mb_strlen($titleKey) > 2 && isset($seenTitles[$titleKey])) continue;
        
        if ($id) $seenIds[$id] = true;
        if ($titleKey && mb_strlen($titleKey) > 2) $seenTitles[$titleKey] = true;
        $dedupedBlogs[] = $blogItem;
    }
    $incomingData['sgcms_blog'] = $dedupedBlogs;
}

// 0b. AUTOMATIC MULTI-LANGUAGE TRANSLATION SYNC:
try {
    require_once __DIR__ . '/translate_sync.php';
    if (function_exists('autoTranslateChangedData')) {
        $currentDraftBefore = readDraftSnapshot();
        foreach ($incomingData as $k => &$sectionData) {
            if ($k === 'sgcms_blog' || $k === 'sgcms_deleted_slugs' || $k === 'sgcms_settings') continue;
            autoTranslateChangedData($k, $sectionData, $currentDraftBefore[$k] ?? null);
        }
        unset($sectionData);
    }
} catch (Throwable $te) {
    error_log('[SharifCMS Save Translate Warning] ' . $te->getMessage());
}

// 1. Dual-Write: Update server-side draft snapshot file immediately
try {
    $currentDraft = readDraftSnapshot();
    foreach ($incomingData as $k => $v) {
        $currentDraft[$k] = $v;
    }
    writeDraftSnapshot($currentDraft);
} catch (Exception $e) {
    error_log('[SharifCMS Draft File Warning] ' . $e->getMessage());
}

// 2. Dual-Write: Synchronize into MySQL database cms_content draft_data only
$db = getDb(true);
$dbSaved = false;
$dbError = null;

if ($db !== null) {
    try {
        $db->beginTransaction();

        $stmt = $db->prepare("
            INSERT INTO cms_content (content_key, draft_data, live_data, updated_at)
            VALUES (:key, :draft, '', NOW())
            ON DUPLICATE KEY UPDATE
                draft_data = VALUES(draft_data),
                updated_at = NOW()
        ");

        foreach ($incomingData as $k => $v) {
            $jsonStr = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt->execute([
                ':key'   => $k,
                ':draft' => $jsonStr
            ]);
        }

        $db->commit();
        $dbSaved = true;
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        $dbError = $e->getMessage();
        error_log('[SharifCMS Save Draft DB Error] ' . $dbError);
    }
}

// 3. Atomically update sitemap.xml on disk if blogs were modified
if (in_array('sgcms_blog', $savedKeys)) {
    try {
        $rootDir = realpath(dirname(__DIR__, 2));
        if ($rootDir && file_exists($rootDir . '/sitemap.php')) {
            require_once $rootDir . '/sitemap.php';
            if (function_exists('buildSitemapXml')) {
                buildSitemapXml($rootDir, true);
            }
        }
    } catch (Throwable $se) {
        error_log('[SharifCMS Save Sitemap Warning] ' . $se->getMessage());
    }
}

jsonResponse([
    'success'   => true,
    'message'   => 'Draft saved successfully' . ($dbSaved ? ' to MySQL & server snapshot.' : ' to server snapshot.'),
    'savedKeys' => $savedKeys,
    'dbSynced'  => $dbSaved,
    'dbError'   => $dbError,
    'savedAt'   => date('Y-m-d H:i:s')
]);
