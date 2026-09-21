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

$db = getDb(true);

if ($db === null) {
    // Database connection could not be established (e.g., credentials not yet set in config.php)
    $staticFile = __DIR__ . '/published_content.json';
    $staticData = file_exists($staticFile) ? json_decode(file_get_contents($staticFile), true) : null;

    if (!empty($key)) {
        if (is_array($staticData) && isset($staticData[$key])) {
            jsonResponse([
                'success'      => true,
                'key'          => $key,
                'mode'         => 'live',
                'data'         => $staticData[$key],
                'updated_at'   => null,
                'published_at' => null
            ]);
        }
        jsonResponse([
            'success' => false,
            'key'     => $key,
            'error'   => 'Database connection not available and key not in local snapshot.'
        ], 404);
    } else {
        jsonResponse([
            'success'    => true,
            'mode'       => $mode,
            'count'      => is_array($staticData) ? count($staticData) : 0,
            'data'       => is_array($staticData) ? $staticData : (object)[],
            'timestamps' => (object)[]
        ], 200);
    }
}

try {
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
} catch (Exception $e) {
    error_log('[SharifCMS Content API Error] ' . $e->getMessage());

    // Graceful fallback to static published snapshot to ensure mode=live ALWAYS returns HTTP 200
    $staticFile = __DIR__ . '/published_content.json';
    $staticData = file_exists($staticFile) ? json_decode(file_get_contents($staticFile), true) : [];

    jsonResponse([
        'success'    => true,
        'mode'       => 'live',
        'fallback'   => true,
        'count'      => is_array($staticData) ? count($staticData) : 0,
        'data'       => is_array($staticData) ? $staticData : (object)[],
        'timestamps' => (object)[]
    ], 200);
}
