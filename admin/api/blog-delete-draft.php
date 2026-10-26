<?php
/**
 * Sharif Group CMS - Delete Draft Blog API
 * Removes a draft blog post from draft_content.json and MySQL.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

$body = getJsonBody();
$id = trim($body['id'] ?? '');

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Missing draft ID.'], 400);
}

$draftSnapshot = readDraftSnapshot();
$draftBlogs = $draftSnapshot['sgcms_blog'] ?? [];

$newDrafts = [];
$deleted = false;

foreach ($draftBlogs as $item) {
    if (!is_array($item)) continue;
    if (($item['id'] ?? '') === $id || ($item['slug'] ?? '') === $id) {
        $deleted = true;
        continue; // skip
    }
    $newDrafts[] = $item;
}

if ($deleted) {
    $draftSnapshot['sgcms_blog'] = $newDrafts;
    writeDraftSnapshot($draftSnapshot);

    try {
        $pdo = getDb(true);
        if ($pdo) {
            $jsonDraft = json_encode($newDrafts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt = $pdo->prepare("
                UPDATE cms_content SET draft_data = :draft, updated_at = NOW() WHERE content_key = 'sgcms_blog'
            ");
            $stmt->execute([':draft' => $jsonDraft]);
        }
    } catch (Throwable $e) {
        error_log('[SharifCMS Delete Draft DB Warning] ' . $e->getMessage());
    }
}

jsonResponse([
    'success' => true,
    'deleted' => $deleted,
    'message' => $deleted ? 'Draft deleted.' : 'Draft was not found.'
]);
