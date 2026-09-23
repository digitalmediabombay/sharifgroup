<?php
/**
 * Sharif Group CMS - Reset / Restore to Code Defaults API
 * Clears CMS overrides so the site restores to original static code and multilingual translations
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

$scope = isset($body['scope']) ? trim($body['scope']) : (isset($body['key']) ? trim($body['key']) : 'homepage');

$keysToDelete = [];
if ($scope === 'homepage' || $scope === 'sgcms_homepage') {
    $keysToDelete = ['sgcms_homepage'];
} elseif ($scope === 'aboutus' || $scope === 'sgcms_aboutus') {
    $keysToDelete = ['sgcms_aboutus'];
} elseif ($scope === 'contact' || $scope === 'sgcms_contact') {
    $keysToDelete = ['sgcms_contact'];
} elseif ($scope === 'cookiepolicy' || $scope === 'sgcms_cookiepolicy') {
    $keysToDelete = ['sgcms_cookiepolicy'];
} elseif ($scope === 'legal' || $scope === 'sgcms_legal') {
    $keysToDelete = ['sgcms_legal'];
} elseif ($scope === 'all_pages' || $scope === 'all_content') {
    $keysToDelete = ['sgcms_homepage', 'sgcms_aboutus', 'sgcms_contact', 'sgcms_cookiepolicy', 'sgcms_legal'];
} elseif (!empty($scope)) {
    $keysToDelete = [$scope];
}

if (empty($keysToDelete)) {
    jsonResponse(['success' => false, 'error' => 'No valid scope or keys provided for reset.'], 400);
}

// 1. Update published_content.json file snapshot
try {
    $pub = readPublishedSnapshot();
    $modifiedPub = false;
    foreach ($keysToDelete as $k) {
        if (isset($pub[$k])) {
            unset($pub[$k]);
            $modifiedPub = true;
        }
    }
    if ($modifiedPub) {
        writePublishedSnapshot($pub);
    }
} catch (Exception $e) {
    error_log('[SharifCMS Reset Pub Warning] ' . $e->getMessage());
}

// 2. Update draft_content.json file snapshot
try {
    $draft = readDraftSnapshot();
    $modifiedDraft = false;
    foreach ($keysToDelete as $k) {
        if (isset($draft[$k])) {
            unset($draft[$k]);
            $modifiedDraft = true;
        }
    }
    if ($modifiedDraft) {
        writeDraftSnapshot($draft);
    }
} catch (Exception $e) {
    error_log('[SharifCMS Reset Draft Warning] ' . $e->getMessage());
}

// 3. Remove from MySQL database cms_content
$db = getDb(true);
$dbDeleted = false;
if ($db !== null) {
    try {
        $placeholders = implode(',', array_fill(0, count($keysToDelete), '?'));
        $stmt = $db->prepare("DELETE FROM cms_content WHERE content_key IN ($placeholders)");
        $stmt->execute($keysToDelete);
        $dbDeleted = true;
    } catch (Exception $e) {
        error_log('[SharifCMS Reset DB Error] ' . $e->getMessage());
    }
}

jsonResponse([
    'success'      => true,
    'message'      => 'Content reset to code defaults successfully.',
    'scope'        => $scope,
    'deleted_keys' => $keysToDelete,
    'db_deleted'   => $dbDeleted
]);
