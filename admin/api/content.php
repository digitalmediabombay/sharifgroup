<?php
/**
 * Sharif Group CMS - Content Delivery API
 * Fetches Live or Draft site content from MySQL or server snapshots
 */

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

$mode = isset($_GET['mode']) && strtolower($_GET['mode']) === 'draft' ? 'draft' : 'live';
$key = isset($_GET['key']) ? trim($_GET['key']) : '';

$db = getDb(true);

// Preload fallback snapshot
$snapshot = [];
if ($mode === 'draft') {
    $snapshot = readDraftSnapshot();
    if (empty($snapshot)) {
        $snapshot = readPublishedSnapshot();
    }
} else {
    $snapshot = readPublishedSnapshot();
}

/**
 * Check if a string contains CP437 mojibake or entity corruptions
 */
function isMojibakeString($raw) {
    if (!is_string($raw) || trim($raw) === '') return false;
    return preg_match('/[\x{2500}-\x{259F}\x{FFFD}]|ΓÇô|ΓÇó|u0026amp;/u', $raw) === 1;
}

/**
 * Deeply sanitize entities and dashes across arrays and strings
 */
function deepSanitizeData(&$val) {
    if (is_string($val)) {
        $val = str_replace(
            ['\\u0026amp;', '&amp;', 'ΓÇô', 'ΓÇó', '\\u0027', '\\\"'],
            ['&', '&', '–', '•', "'", '"'],
            $val
        );
    } elseif (is_array($val)) {
        foreach ($val as &$sub) {
            deepSanitizeData($sub);
        }
    }
}

/**
 * Unwrap any nested/double-encoded JSON and shield against mojibake
 */
function cleanJsonValue($raw, $fallback = null, $contentKey = '', $db = null) {
    if ($raw === null || $raw === '') {
        return $fallback;
    }

    $isCorrupt = is_string($raw) && isMojibakeString($raw);
    if ($isCorrupt && $fallback !== null) {
        // Auto-heal MySQL row in the background if database is writable
        if ($db !== null && !empty($contentKey)) {
            try {
                $cleanJson = json_encode($fallback, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmt = $db->prepare("UPDATE cms_content SET draft_data = :c, live_data = :c, updated_at = NOW() WHERE content_key = :k");
                $stmt->execute([':c' => $cleanJson, ':k' => $contentKey]);
            } catch (Exception $e) {}
        }
        return $fallback;
    }

    $val = $raw;
    while (is_string($val)) {
        $trimmed = trim($val);
        if (($trimmed !== '' && $trimmed[0] === '{') || ($trimmed !== '' && $trimmed[0] === '[')) {
            $dec = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE && (is_array($dec) || is_object($dec))) {
                $val = $dec;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    deepSanitizeData($val);
    return $val;
}

// 1. Database attempt
if ($db !== null) {
    try {
        if (!empty($key)) {
            $stmt = $db->prepare("SELECT content_key, draft_data, live_data, updated_at, published_at FROM cms_content WHERE content_key = ? LIMIT 1");
            $stmt->execute([$key]);
            $row = $stmt->fetch();

            if ($row) {
                $raw = $mode === 'draft' ? $row['draft_data'] : $row['live_data'];
                if ($raw === null || $raw === '') {
                    if ($mode === 'live' && !empty($row['draft_data'])) {
                        $raw = $row['draft_data'];
                    }
                }
                $fallback = isset($snapshot[$key]) ? $snapshot[$key] : null;
                $cleanData = cleanJsonValue($raw, $fallback, $key, $db);

                if ($cleanData !== null) {
                    jsonResponse([
                        'success'      => true,
                        'key'          => $row['content_key'],
                        'mode'         => $mode,
                        'source'       => 'mysql',
                        'data'         => $cleanData,
                        'updated_at'   => $row['updated_at'],
                        'published_at' => $row['published_at']
                    ]);
                }
            }
        } else {
            $stmt = $db->query("SELECT content_key, draft_data, live_data, updated_at, published_at FROM cms_content");
            $rows = $stmt->fetchAll();

            if (!empty($rows)) {
                $contentBundle = [];
                $timestamps = [];

                foreach ($rows as $r) {
                    $raw = $mode === 'draft' ? $r['draft_data'] : $r['live_data'];
                    if ($raw === null || $raw === '') {
                        if ($mode === 'live' && !empty($r['draft_data'])) {
                            // If live_data is empty, fallback to draft
                            $raw = $r['draft_data'];
                        }
                    }
                    $k = $r['content_key'];
                    $fallback = isset($snapshot[$k]) ? $snapshot[$k] : null;
                    $cleanData = cleanJsonValue($raw, $fallback, $k, $db);

                    $contentBundle[$k] = $cleanData !== null ? $cleanData : $raw;
                    $timestamps[$k] = [
                        'updated_at'   => $r['updated_at'],
                        'published_at' => $r['published_at']
                    ];
                }

                // If any keys are in snapshot but missing in DB, fill them in
                foreach ($snapshot as $sk => $sv) {
                    if (!isset($contentBundle[$sk])) {
                        $contentBundle[$sk] = $sv;
                    }
                }

                if (!empty($contentBundle)) {
                    jsonResponse([
                        'success'    => true,
                        'mode'       => $mode,
                        'source'     => 'mysql',
                        'count'      => count($contentBundle),
                        'data'       => $contentBundle,
                        'timestamps' => $timestamps
                    ]);
                }
            }
        }
    } catch (Exception $e) {
        error_log('[SharifCMS Content API DB Error] ' . $e->getMessage());
    }
}

// 2. File-based fallback (Guarantees zero downtime even during DB maintenance)
if (empty($snapshot)) {
    $snapshot = readPublishedSnapshot();
}

if (!empty($key)) {
    if (isset($snapshot[$key])) {
        jsonResponse([
            'success'      => true,
            'key'          => $key,
            'mode'         => $mode,
            'source'       => 'file',
            'data'         => $snapshot[$key],
            'updated_at'   => null,
            'published_at' => null
        ]);
    }
    jsonResponse([
        'success' => false,
        'key'     => $key,
        'error'   => 'Content key not found.'
    ], 404);
}

jsonResponse([
    'success'    => true,
    'mode'       => $mode,
    'source'     => 'file',
    'count'      => count($snapshot),
    'data'       => (object)$snapshot,
    'timestamps' => (object)[]
]);
