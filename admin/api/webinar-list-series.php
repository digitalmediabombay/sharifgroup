<?php
/**
 * Sharif Group CMS - List Webinar Series (Active, Staged, Archived) API
 * 
 * Returns the catalog of all webinar series, categorized by active,
 * staged drafts, and archived past series.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$rootDir = realpath(dirname(__DIR__, 2));
$catalogFile = $rootDir . '/data/sgcms_series_catalog.json';

$catalogList = [];
if (file_exists($catalogFile)) {
    $rawCat = @file_get_contents($catalogFile);
    $decCat = json_decode($rawCat, true);
    if (!empty($decCat['catalog']) && is_array($decCat['catalog'])) {
        $catalogList = $decCat['catalog'];
    }
}

// Fallback: If catalog is empty, extract active series from data/sgcms_webinars.json
if (empty($catalogList)) {
    $jsonFile = $rootDir . '/data/sgcms_webinars.json';
    if (file_exists($jsonFile)) {
        $rawW = @file_get_contents($jsonFile);
        $decW = json_decode($rawW, true);
        $webinars = $decW['sgcms_webinars'] ?? ($decW ?? []);
        if (!empty($webinars) && is_array($webinars)) {
            $first = $webinars[0];
            $seriesId = $first['series'] ?? 'dominica-pilot';
            $seriesName = 'Dominica Second Passport for Afghan Families';
            $cat = $first['category'] ?? 'Citizenship';
            $subcat = $first['subcategory'] ?? 'dominica';
            $lang = $first['language_code'] ?? 'fa';

            $activeItem = [
                'series_id'        => $seriesId,
                'series_name'      => $seriesName,
                'category'         => $cat,
                'subcategory'      => $subcat,
                'primary_language' => $lang,
                'session_count'    => count($webinars),
                'status'           => 'active',
                'created_at'       => '2026-10-29T17:00:00Z',
                'updated_at'       => gmdate('Y-m-d\TH:i:s\Z'),
                'sessions'         => array_map(function($s) {
                    return [
                        'session_no'   => $s['session_no'] ?? 1,
                        'id'           => $s['id'] ?? 'WEB01',
                        'slug'         => $s['slug'] ?? '',
                        'title'        => $s['en']['title'] ?? ($s['fa']['title'] ?? ''),
                        'start_utc'    => $s['start_utc'] ?? '',
                        'event_status' => $s['event_status'] ?? 'upcoming'
                    ];
                }, $webinars)
            ];
            $catalogList = [$activeItem];
        }
    }
}

$activeSeries = null;
$stagedSeries = [];
$archivedSeries = [];

foreach ($catalogList as $item) {
    $st = strtolower($item['status'] ?? 'staged');
    if ($st === 'active' && $activeSeries === null) {
        $activeSeries = $item;
    } elseif ($st === 'staged' || $st === 'draft') {
        $stagedSeries[] = $item;
    } else {
        $archivedSeries[] = $item;
    }
}

jsonResponse([
    'success'         => true,
    'active_series'   => $activeSeries,
    'staged_series'   => $stagedSeries,
    'archived_series' => $archivedSeries,
    'total_series'    => count($catalogList)
]);
