<?php
/**
 * Sharif Group CMS - Save Draft API
 * Updates working draft data in MySQL without altering live website visitors
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();
$body = getJsonBody();

if (empty($body)) {
    jsonResponse(['success' => false, 'error' => 'No content received.'], 400);
}

$db = getDb();

try {
    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO cms_content (content_key, draft_data, live_data, updated_at)
        VALUES (:key, :draft, :draft, NOW())
        ON DUPLICATE KEY UPDATE
            draft_data = VALUES(draft_data),
            updated_at = NOW()
    ");

    $savedKeys = [];

    // Support single key save
    if (isset($body['key']) && array_key_exists('data', $body)) {
        $jsonStr = json_encode($body['data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt->execute([
            ':key'   => $body['key'],
            ':draft' => $jsonStr
        ]);
        $savedKeys[] = $body['key'];
    }

    // Support batch save
    if (isset($body['batch']) && is_array($body['batch'])) {
        foreach ($body['batch'] as $k => $v) {
            $jsonStr = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt->execute([
                ':key'   => $k,
                ':draft' => $jsonStr
            ]);
            $savedKeys[] = $k;
        }
    }

    $db->commit();

    jsonResponse([
        'success'   => true,
        'message'   => 'Draft saved successfully.',
        'savedKeys' => $savedKeys,
        'savedAt'   => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('[SharifCMS Save Draft Error] ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'error'   => 'Database error while saving draft.',
        'details' => $e->getMessage()
    ], 500);
}
