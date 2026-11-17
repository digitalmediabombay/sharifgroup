<?php
/**
 * Sharif Group CMS - Get Active Live Webinar Series API
 * 
 * Returns the currently active webinar series, its sessions pipeline,
 * and the auto-derived hero session currently promoted on the live website.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$rootDir = realpath(dirname(__DIR__, 2));

// ── 1. READ WEBINARS DATA (Single Source of Truth) ──────────────────────
$webinars = [];

// Source A: data/sgcms_webinars.json
$jsonFile = $rootDir . '/data/sgcms_webinars.json';
if (file_exists($jsonFile)) {
    $raw = @file_get_contents($jsonFile);
    $decoded = json_decode($raw, true);
    if (!empty($decoded['sgcms_webinars']) && is_array($decoded['sgcms_webinars'])) {
        $webinars = $decoded['sgcms_webinars'];
    } elseif (!empty($decoded) && is_array($decoded)) {
        $webinars = $decoded;
    }
}

// Source B: published_content.json fallback
if (empty($webinars)) {
    $pubSnapshot = readPublishedSnapshot();
    if (!empty($pubSnapshot['sgcms_webinars']) && is_array($pubSnapshot['sgcms_webinars'])) {
        $webinars = $pubSnapshot['sgcms_webinars'];
    }
}

// Source C: assets/js/webinars-data.js fallback
if (empty($webinars)) {
    $jsFile = $rootDir . '/assets/js/webinars-data.js';
    if (file_exists($jsFile)) {
        $rawJs = @file_get_contents($jsFile);
        if (preg_match('/window\.SGCMS_WEBINARS\s*=\s*(\[.*?\])\s*;/s', $rawJs, $matches)) {
            $decJs = json_decode($matches[1], true);
            if (!empty($decJs) && is_array($decJs)) {
                $webinars = $decJs;
            }
        }
    }
}

if (empty($webinars) || !is_array($webinars)) {
    jsonResponse([
        'success'  => false,
        'error'    => 'No webinar data found.',
        'series'   => null,
        'sessions' => []
    ], 404);
}

// ── 2. READ REALTIME SCHEDULE OVERRIDES ──────────────────────────────────
$schedule = null;
$draftSnapshot = readDraftSnapshot();
if (!empty($draftSnapshot['sgcms_webinar_schedule'])) {
    $schedule = $draftSnapshot['sgcms_webinar_schedule'];
} else {
    $pubSnapshot = readPublishedSnapshot();
    if (!empty($pubSnapshot['sgcms_webinar_schedule'])) {
        $schedule = $pubSnapshot['sgcms_webinar_schedule'];
    }
}

$activeSessionNoOverride = !empty($schedule['active_session_no']) ? (int)$schedule['active_session_no'] : null;

// Apply session schedule overrides if present
if (!empty($schedule['sessions']) && is_array($schedule['sessions'])) {
    foreach ($webinars as &$wItem) {
        $sNum = (int)($wItem['session_no'] ?? 0);
        if (!empty($schedule['sessions'][$sNum])) {
            $ovr = $schedule['sessions'][$sNum];
            if (!empty($ovr['start_utc'])) $wItem['start_utc'] = $ovr['start_utc'];
            if (isset($ovr['join_url'])) $wItem['join_url'] = trim($ovr['join_url']);
            if (isset($ovr['reg_status'])) {
                $wItem['registration_open'] = ($ovr['reg_status'] === 'open');
            }
            if (!empty($ovr['event_status'])) {
                $wItem['event_status'] = $ovr['event_status'];
            }
        }
    }
    unset($wItem);
}

// ── 3. PROCESS SESSIONS & MULTI-TIMEZONE CONVERSIONS ─────────────────────
$nowTimestamp = time();
$processedSessions = [];
$completedCount = 0;
$upcomingCount = 0;

$firstItem = $webinars[0];
$seriesSlug = $firstItem['series'] ?? 'dominica-pilot';
$seriesCategory = $firstItem['category'] ?? 'Citizenship';
$seriesSubcat = $firstItem['subcategory'] ?? 'dominica';

foreach ($webinars as $w) {
    $sNo = (int)($w['session_no'] ?? 1);
    $startUtc = $w['start_utc'] ?? '2026-11-19T15:30:00Z';
    $durationMin = (int)($w['duration_min'] ?? 60);

    // Calculate start & end unix timestamps
    $startTs = strtotime($startUtc);
    if ($startTs === false) $startTs = $nowTimestamp;
    $endTs = $startTs + ($durationMin * 60);

    // Determine derived real-time event status
    $rawStatus = strtolower(trim($w['event_status'] ?? 'upcoming'));
    $derivedStatus = $rawStatus;

    if ($rawStatus === 'cancelled' || $rawStatus === 'postponed') {
        $derivedStatus = $rawStatus;
    } elseif ($nowTimestamp > $endTs) {
        $derivedStatus = 'ended';
        $completedCount++;
    } elseif ($nowTimestamp >= $startTs && $nowTimestamp <= $endTs) {
        $derivedStatus = 'live';
        $upcomingCount++;
    } else {
        $derivedStatus = 'upcoming';
        $upcomingCount++;
    }

    // Timezone conversions
    $dtUtc = new DateTime("@$startTs");
    $dtUtc->setTimezone(new DateTimeZone('UTC'));

    $dtDubai = clone $dtUtc;
    $dtDubai->setTimezone(new DateTimeZone('Asia/Dubai'));

    $dtKabul = clone $dtUtc;
    $dtKabul->setTimezone(new DateTimeZone('Asia/Kabul'));

    $dtIstanbul = clone $dtUtc;
    $dtIstanbul->setTimezone(new DateTimeZone('Europe/Istanbul'));

    $titleEn = $w['en']['title'] ?? ($w['title'] ?? ('Session ' . $sNo));
    $titleFa = $w['fa']['title'] ?? '';
    $titleAr = $w['ar']['title'] ?? '';
    $titleZh = $w['zh']['title'] ?? '';

    $excerptEn = $w['en']['excerpt'] ?? ($w['excerpt'] ?? '');
    $excerptFa = $w['fa']['excerpt'] ?? '';

    $joinUrl = trim($w['join_url'] ?? '');
    $regOpen = !empty($w['registration_open']) && $derivedStatus !== 'ended';

    $processedSessions[] = [
        'session_no'        => $sNo,
        'id'                => $w['id'] ?? ('WEB0' . $sNo),
        'slug'              => $w['slug'] ?? '',
        'category'          => $w['category'] ?? $seriesCategory,
        'subcategory'       => $w['subcategory'] ?? $seriesSubcat,
        'title'             => $titleEn,
        'title_en'          => $titleEn,
        'title_fa'          => $titleFa,
        'title_ar'          => $titleAr,
        'title_zh'          => $titleZh,
        'excerpt'           => $excerptEn,
        'excerpt_fa'        => $excerptFa,
        'start_utc'         => $dtUtc->format('Y-m-d\TH:i:s\Z'),
        'date_formatted'    => $dtUtc->format('l, j M Y'),
        'date_day_num'      => $dtUtc->format('j'),
        'date_month'        => $dtUtc->format('M'),
        'date_year'         => $dtUtc->format('Y'),
        'time_utc'          => $dtUtc->format('H:i') . ' UTC',
        'time_dubai'        => $dtDubai->format('H:i') . ' GST',
        'time_kabul'        => $dtKabul->format('H:i') . ' AFT',
        'time_istanbul'     => $dtIstanbul->format('H:i') . ' TRT',
        'duration_min'      => $durationMin,
        'event_status'      => $derivedStatus,
        'registration_open' => $regOpen,
        'join_visibility'   => $w['join_visibility'] ?? 'public',
        'join_url'          => $joinUrl,
        'has_join_url'      => !empty($joinUrl),
        'is_hero'           => false // will be marked below
    ];
}

// Sort sessions chronologically by session_no
usort($processedSessions, function($a, $b) {
    return ($a['session_no'] <=> $b['session_no']);
});

// ── 4. DERIVE THE ACTIVE FEATURED HERO SESSION ──────────────────────────
$heroSession = null;
$heroSource = 'auto_upcoming';

// Case A: Explicit admin override
if ($activeSessionNoOverride) {
    foreach ($processedSessions as &$s) {
        if ($s['session_no'] === $activeSessionNoOverride) {
            $heroSession = &$s;
            $heroSource = 'manual_pin';
            break;
        }
    }
    unset($s);
}

// Case B: First currently LIVE session
if (!$heroSession) {
    foreach ($processedSessions as &$s) {
        if ($s['event_status'] === 'live') {
            $heroSession = &$s;
            $heroSource = 'auto_live';
            break;
        }
    }
    unset($s);
}

// Case C: First UPCOMING session
if (!$heroSession) {
    foreach ($processedSessions as &$s) {
        if ($s['event_status'] === 'upcoming') {
            $heroSession = &$s;
            $heroSource = 'auto_upcoming';
            break;
        }
    }
    unset($s);
}

// Case D: If all sessions have ended, select the final session
if (!$heroSession && !empty($processedSessions)) {
    $heroSession = &$processedSessions[count($processedSessions) - 1];
    $heroSource = 'series_concluded';
}

if ($heroSession) {
    $heroSession['is_hero'] = true;
    $heroSession['hero_source'] = $heroSource;
    $heroSession['is_manual_pin'] = ($heroSource === 'manual_pin');
}

// ── 5. ASSEMBLE SERIES METADATA ─────────────────────────────────────────
$totalSessions = count($processedSessions);
$progressPercent = $totalSessions > 0 ? (int)round(($completedCount / $totalSessions) * 100) : 0;
$isSeriesComplete = ($completedCount >= $totalSessions && $totalSessions > 0);

$seriesDisplayTitle = 'Dominica Pilot Series — Second Passport for Afghans';
if ($seriesSubcat) {
    $countryName = ucwords(str_replace('-', ' ', $seriesSubcat));
    if ($seriesSlug !== 'dominica-pilot') {
        $seriesDisplayTitle = $countryName . ' Citizenship & Residency Series';
    }
}

$seriesData = [
    'id'                 => $seriesSlug,
    'slug'               => $seriesSlug,
    'title'              => $seriesDisplayTitle,
    'category'           => $seriesCategory,
    'country'            => ucwords(str_replace('-', ' ', $seriesSubcat)),
    'total_sessions'     => $totalSessions,
    'completed_sessions' => $completedCount,
    'upcoming_sessions'  => $upcomingCount,
    'progress_percent'   => $progressPercent,
    'is_active'          => true,
    'is_complete'        => $isSeriesComplete,
    'public_events_url'  => '/events/',
    'public_webinar_url' => '/webinars/'
];

// ── 6. RESPONSE ─────────────────────────────────────────────────────────
jsonResponse([
    'success'               => true,
    'series'                => $seriesData,
    'featured_hero_session' => $heroSession,
    'sessions'              => $processedSessions,
    'transition'            => [
        'is_series_complete'    => $isSeriesComplete,
        'can_create_new_series' => $isSeriesComplete,
        'notice'                => $isSeriesComplete
            ? 'All sessions in this series have concluded. You can now launch a new series for the website.'
            : "Current active series has {$upcomingCount} upcoming session(s). It remains live on the website until all sessions conclude."
    ]
]);
