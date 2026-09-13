<?php
/**
 * Sharif Group CMS - Content Delivery API
 * Fetches Live or Draft site content from MySQL
 */

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

$mode = isset($_GET['mode']) && strtolower($_GET['mode']) === 'draft' ? 'draft' : 'live';
$key = isset($_GET['key']) ? trim($_GET['key']) : '';

$db = getDb();

if (!empty($key)) {
    // Single section requested
    $stmt = $db->prepare("SELECT content_key, draft_data, live_data, updated_at, published_at FROM cms_content WHERE content_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse([
            'success' => false,
            'key'     => $key,
            'error'   => 'Content key not found in database.'
        ], 404);
    }

    $raw = $mode === 'draft' ? $row['draft_data'] : $row['live_data'];
    $data = json_decode($raw, true);

    jsonResponse([
        'success'      => true,
        'key'          => $row['content_key'],
        'mode'         => $mode,
        'data'         => $data !== null ? $data : $raw,
        'updated_at'   => $row['updated_at'],
        'published_at' => $row['published_at']
    ]);
} else {
    // Entire site content bundle requested
    $stmt = $db->query("SELECT content_key, draft_data, live_data, updated_at, published_at FROM cms_content");
    $rows = $stmt->fetchAll();

    $contentBundle = [];
    $timestamps = [];

    foreach ($rows as $r) {
        $raw = $mode === 'draft' ? $r['draft_data'] : $r['live_data'];
        $decoded = json_decode($raw, true);
        $contentBundle[$r['content_key']] = $decoded !== null ? $decoded : $raw;
        $timestamps[$r['content_key']] = [
            'updated_at'   => $r['updated_at'],
            'published_at' => $r['published_at']
        ];
    }

    jsonResponse([
        'success'    => true,
        'mode'       => $mode,
        'count'      => count($contentBundle),
        'data'       => $contentBundle,
        'timestamps' => $timestamps
    ]);
}
