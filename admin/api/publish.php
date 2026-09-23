<?php
/**
 * Sharif Group CMS - Publish Live API
 * Promotes all draft content keys to live production status in MySQL and published_content.json
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

jsonResponse([
    'success'       => true,
    'message'       => 'Content successfully published to live website' . ($dbPublished ? ' & MySQL database.' : '.'),
    'publishedAt'   => $publishedAt,
    'publisher'     => $publisher,
    'publishedKeys' => $updatedKeys,
    'count'         => count($updatedKeys),
    'fileWritten'   => $fileWritten,
    'dbSynced'      => $dbPublished,
    'dbError'       => $dbError
]);
