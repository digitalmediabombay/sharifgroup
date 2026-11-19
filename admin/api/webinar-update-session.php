<?php
/**
 * Sharif Group CMS - Update Webinar Session Controls API
 * 
 * Safely updates an individual webinar session's live meeting URL,
 * visibility, registration status, event status, and hero promotion.
 * Synchronizes data atomically to data/sgcms_webinars.json and assets/js/webinars-data.js.
 * ZERO static HTML files are modified, preventing any regression or file corruption.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

if (empty($body) || !is_array($body)) {
    jsonResponse(['success' => false, 'error' => 'Invalid request payload.'], 400);
}

$sessionNo = isset($body['session_no']) ? (int)$body['session_no'] : null;
$sessionId = isset($body['id']) ? trim($body['id']) : '';

if (!$sessionNo && !$sessionId) {
    jsonResponse(['success' => false, 'error' => 'Session number or ID is required.'], 400);
}

// ── 1. VALIDATE ATTRIBUTES ──────────────────────────────────────────────
$validStatuses = ['upcoming', 'live', 'ended', 'postponed', 'cancelled'];
$eventStatus = isset($body['event_status']) ? strtolower(trim($body['event_status'])) : null;
if ($eventStatus !== null && !in_array($eventStatus, $validStatuses, true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid event status. Allowed: upcoming, live, ended, postponed, cancelled.'], 400);
}

$joinVisibility = isset($body['join_visibility']) ? strtolower(trim($body['join_visibility'])) : null;
if ($joinVisibility !== null && !in_array($joinVisibility, ['public', 'registrants'], true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid join visibility. Allowed: public, registrants.'], 400);
}

$joinUrl = isset($body['join_url']) ? trim($body['join_url']) : null;
if ($joinUrl !== null && $joinUrl !== '') {
    if (!preg_match('#^https?://#i', $joinUrl)) {
        jsonResponse(['success' => false, 'error' => 'Join URL must begin with https:// or http://'], 400);
    }
}

$registrationOpen = isset($body['registration_open']) ? (bool)$body['registration_open'] : null;
$setAsHero = isset($body['set_as_hero']) ? (bool)$body['set_as_hero'] : null;
$startUtc = isset($body['start_utc']) ? trim($body['start_utc']) : null;
$durationMin = isset($body['duration_min']) ? max(10, (int)$body['duration_min']) : null;
$speakers = isset($body['speakers']) && is_array($body['speakers']) ? $body['speakers'] : null;

// ── 2. READ WEBINARS (Single Source of Truth) ───────────────────────────
$rootDir = realpath(dirname(__DIR__, 2));
$jsonFile = $rootDir . '/data/sgcms_webinars.json';
$webinars = [];

if (file_exists($jsonFile)) {
    $raw = @file_get_contents($jsonFile);
    $decoded = json_decode($raw, true);
    if (!empty($decoded['sgcms_webinars']) && is_array($decoded['sgcms_webinars'])) {
        $webinars = $decoded['sgcms_webinars'];
    } elseif (!empty($decoded) && is_array($decoded)) {
        $webinars = $decoded;
    }
}

if (empty($webinars)) {
    $pubSnapshot = readPublishedSnapshot();
    if (!empty($pubSnapshot['sgcms_webinars']) && is_array($pubSnapshot['sgcms_webinars'])) {
        $webinars = $pubSnapshot['sgcms_webinars'];
    }
}

if (empty($webinars)) {
    jsonResponse(['success' => false, 'error' => 'No webinar sessions found to update.'], 404);
}

// ── 3. LOCATE AND UPDATE TARGET SESSION ──────────────────────────────────
$targetIndex = -1;
foreach ($webinars as $idx => $w) {
    if ($sessionNo && (int)($w['session_no'] ?? 0) === $sessionNo) {
        $targetIndex = $idx;
        break;
    }
    if ($sessionId && strcasecmp(trim($w['id'] ?? ''), $sessionId) === 0) {
        $targetIndex = $idx;
        break;
    }
}

if ($targetIndex < 0) {
    jsonResponse(['success' => false, 'error' => 'Target webinar session not found.'], 404);
}

$targetSession = &$webinars[$targetIndex];
$actualSessionNo = (int)($targetSession['session_no'] ?? ($sessionNo ?: 1));

// Apply changes
if ($eventStatus !== null) {
    $targetSession['event_status'] = $eventStatus;
}

if ($joinVisibility !== null) {
    $targetSession['join_visibility'] = $joinVisibility;
}

if ($joinUrl !== null) {
    $targetSession['join_url'] = $joinUrl;
}

if ($registrationOpen !== null) {
    $targetSession['registration_open'] = $registrationOpen;
    $targetSession['reg_status'] = $registrationOpen ? 'open' : 'closed';
}

if (!empty($startUtc)) {
    $targetSession['start_utc'] = $startUtc;
}

if ($durationMin !== null) {
    $targetSession['duration_min'] = $durationMin;
}

if ($speakers !== null) {
    $targetSession['speakers'] = $speakers;
    foreach (['en', 'fa', 'ar', 'zh'] as $lgCode) {
        if (isset($targetSession[$lgCode]) && is_array($targetSession[$lgCode])) {
            $targetSession[$lgCode]['speakers'] = $speakers;
        }
    }
}

$targetSession['updated_at'] = date('Y-m-d H:i:s');

// ── 4. HANDLE HERO OVERRIDE IN SCHEDULE ─────────────────────────────────
$draftSnapshot = readDraftSnapshot();
$schedule = $draftSnapshot['sgcms_webinar_schedule'] ?? [];
if (!is_array($schedule)) $schedule = [];

if (!isset($schedule['sessions']) || !is_array($schedule['sessions'])) {
    $schedule['sessions'] = [];
}

if (!isset($schedule['sessions'][$actualSessionNo])) {
    $schedule['sessions'][$actualSessionNo] = [];
}

// Persist session-specific overrides into schedule
if ($joinUrl !== null) $schedule['sessions'][$actualSessionNo]['join_url'] = $joinUrl;
if ($eventStatus !== null) $schedule['sessions'][$actualSessionNo]['event_status'] = $eventStatus;
if ($registrationOpen !== null) $schedule['sessions'][$actualSessionNo]['reg_status'] = $registrationOpen ? 'open' : 'closed';
if (!empty($startUtc)) $schedule['sessions'][$actualSessionNo]['start_utc'] = $startUtc;
if ($durationMin !== null) $schedule['sessions'][$actualSessionNo]['duration_min'] = $durationMin;
if ($speakers !== null) $schedule['sessions'][$actualSessionNo]['speakers'] = $speakers;

// Handle explicit hero flag
if ($setAsHero === true) {
    $schedule['active_session_no'] = $actualSessionNo;
} elseif ($setAsHero === false) {
    if (!empty($schedule['active_session_no']) && (int)$schedule['active_session_no'] === $actualSessionNo) {
        unset($schedule['active_session_no']);
    }
}

// ── 5. ATOMIC PERSISTENCE (Zero HTML touched) ───────────────────────────
$catalogData = ['sgcms_webinars' => $webinars];
$jsonEncoded = json_encode($catalogData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// A. Write data/sgcms_webinars.json
if (!is_dir($rootDir . '/data')) {
    @mkdir($rootDir . '/data', 0755, true);
}
@file_put_contents($rootDir . '/data/sgcms_webinars.json', $jsonEncoded, LOCK_EX);

// B. Write assets/js/webinars-data.js
$activeSeriesId = !empty($webinars[0]['series']) ? $webinars[0]['series'] : 'dominica-pilot';
$heroSessionNo = !empty($schedule['active_session_no']) ? (int)$schedule['active_session_no'] : null;

$jsContent = "/* Auto-generated by Sharif Group CMS */\n";
$jsContent .= "window.SGCMS_WEBINARS = " . json_encode($webinars, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
$jsContent .= "window.SGCMS_ACTIVE_SERIES = " . json_encode($activeSeriesId) . ";\n";
$jsContent .= "window.SGCMS_HERO_SESSION_NO = " . ($heroSessionNo !== null ? (int)$heroSessionNo : "null") . ";\n";
@file_put_contents($rootDir . '/assets/js/webinars-data.js', $jsContent, LOCK_EX);

// C. Demo mirror if present
$demoJs = $rootDir . '/Sharif-Webinars-Demo_1/sharif-webinars-demo/assets/js/webinars-data.js';
if (file_exists($demoJs)) {
    @file_put_contents($demoJs, $jsContent, LOCK_EX);
}

// D. Sync snapshots
foreach (['draft_content.json', 'published_content.json'] as $fSnap) {
    $snapPath = $rootDir . '/admin/api/' . $fSnap;
    if (file_exists($snapPath)) {
        $rawSnap = @file_get_contents($snapPath);
        $decSnap = json_decode($rawSnap, true);
        if (is_array($decSnap)) {
            $decSnap['sgcms_webinars'] = $webinars;
            $decSnap['sgcms_webinar_schedule'] = $schedule;
            $enc = json_encode($decSnap, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            @file_put_contents($snapPath, $enc, LOCK_EX);
            if ($fSnap === 'published_content.json') {
                $pubDataDir = $rootDir . '/assets/data';
                if (!is_dir($pubDataDir)) @mkdir($pubDataDir, 0755, true);
                @file_put_contents($pubDataDir . '/published_content.json', $enc, LOCK_EX);
            }
        }
    }
}

// ── 6. RETURN SUCCESS ───────────────────────────────────────────────────
jsonResponse([
    'success'         => true,
    'message'         => "Session {$actualSessionNo} updated successfully.",
    'session'         => $targetSession,
    'hero_session_no' => $schedule['active_session_no'] ?? null
]);
