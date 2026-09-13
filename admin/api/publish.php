<?php
/**
 * Sharif Group CMS - Publish Live API
 * Promotes all draft content keys to live production status in MySQL
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

// Ensure session exists
startSecureSession();

$payload = getJsonBody();

if (empty($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
    jsonResponse(['success' => false, 'error' => 'Invalid publication payload.'], 400);
}

$db = getDb();
$version = isset($payload['version']) ? trim($payload['version']) : '3.0.0';
$publisher = isset($payload['publisher']) ? trim($payload['publisher']) : 'Admin User';
if (!empty($_SESSION['sgcms_user']['name'])) {
    $publisher = $_SESSION['sgcms_user']['name'];
}
$publishedAt = isset($payload['publishedAt']) ? $payload['publishedAt'] : date('Y-m-d H:i:s');

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

    $updatedKeys = [];

    foreach ($payload['data'] as $key => $val) {
        $jsonStr = json_encode($val, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $upsertStmt->execute([
            ':key'   => $key,
            ':draft' => $jsonStr,
            ':live'  => $jsonStr
        ]);
        $updatedKeys[] = $key;
    }

    // Insert into Publish Log
    $logStmt = $db->prepare("
        INSERT INTO cms_publish_log (version, publisher, published_at, summary)
        VALUES (?, ?, NOW(), ?)
    ");
    $summary = sprintf("Published %d sections: %s", count($updatedKeys), implode(', ', $updatedKeys));
    $logStmt->execute([$version, $publisher, $summary]);

    $db->commit();

    jsonResponse([
        'success'       => true,
        'message'       => 'Content successfully published to live website and MySQL database.',
        'publishedAt'   => $publishedAt,
        'publisher'     => $publisher,
        'publishedKeys' => $updatedKeys,
        'count'         => count($updatedKeys)
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('[SharifCMS Publish Error] ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error'   => 'Failed to publish changes to database.',
        'details' => $e->getMessage()
    ], 500);
}
