<?php
/**
 * Sharif Group CMS - Create Webinar Series & Multi-Session Studio API
 * 
 * Creates a new webinar series with N dynamic sessions.
 * Supports "stage" (save draft series) or "activate" (live website launch).
 * Atomically backs up previous series, updates data/sgcms_webinars.json,
 * generates assets/js/webinars-data.js, and creates SEO directory shells.
 */

require_once __DIR__ . '/db.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

if (empty($body) || !is_array($body)) {
    jsonResponse(['success' => false, 'error' => 'Invalid request payload.'], 400);
}

$action = strtolower(trim($body['action'] ?? 'stage'));
if (!in_array($action, ['activate', 'stage'], true)) {
    $action = 'stage';
}

$seriesInput = $body['series'] ?? [];
$sessionsInput = $body['sessions'] ?? [];

if (!is_array($seriesInput) || empty($seriesInput)) {
    jsonResponse(['success' => false, 'error' => 'Series metadata is required.'], 400);
}

if (!is_array($sessionsInput) || empty($sessionsInput)) {
    jsonResponse(['success' => false, 'error' => 'At least one session is required.'], 400);
}

// ── 1. VALIDATE SERIES METADATA ──────────────────────────────────────────
$seriesName = trim($seriesInput['series_name'] ?? '');
if (empty($seriesName)) {
    jsonResponse(['success' => false, 'error' => 'Series title/name is required.'], 400);
}

$seriesId = strtolower(trim($seriesInput['series_id'] ?? ''));
if (empty($seriesId)) {
    // Generate clean slug from series name
    $seriesId = preg_replace('/[^a-z0-9]+/i', '-', strtolower($seriesName));
    $seriesId = trim($seriesId, '-');
}
$seriesId = preg_replace('/[^a-z0-9_-]/', '', $seriesId);
if (empty($seriesId)) {
    $seriesId = 'series-' . time();
}

$category = trim($seriesInput['category'] ?? 'Citizenship');
$subcategory = strtolower(trim($seriesInput['subcategory'] ?? 'grenada'));
$primaryLang = strtolower(trim($seriesInput['primary_language'] ?? 'fa'));
if (!in_array($primaryLang, ['fa', 'en', 'ar', 'zh'], true)) {
    $primaryLang = 'fa';
}

$sessionCount = max(1, min(6, (int)($seriesInput['session_count'] ?? count($sessionsInput))));
if (count($sessionsInput) !== $sessionCount) {
    // Slice or clamp to sessionCount
    $sessionsInput = array_slice($sessionsInput, 0, $sessionCount);
}

// ── 2. PROCESS AND VALIDATE EACH SESSION ────────────────────────────────
$processedSessions = [];
$seenSlugs = [];

$defaultSpeakers = [
    [
        'name'        => 'Mohammad Borsalani',
        'title'       => 'Senior Consultant, Caribbean Citizenship Programs',
        'affiliation' => 'Sharif Group Dubai'
    ],
    [
        'name'        => 'Mehdi Yarahmadi',
        'title'       => 'Caribbean Passport Program Specialist',
        'affiliation' => 'Sharif Group Dubai'
    ]
];

$defaultSpeakersFa = [
    [
        'name'        => 'محمد برسلانی',
        'title'       => 'مشاور ارشد برنامه‌های شهروندی کارائیب',
        'affiliation' => 'شریف گروپ دبی'
    ],
    [
        'name'        => 'مهدی یاراحمدی',
        'title'       => 'کارشناس برنامه شهروندی کارائیب',
        'affiliation' => 'شریف گروپ دبی'
    ]
];

$defaultAgenda = [
    ['time' => '0–5',   'topic' => 'Welcome and introductory poll', 'speaker' => ''],
    ['time' => '5–10',  'topic' => 'About Sharif Group & speakers', 'speaker' => ''],
    ['time' => '10–40', 'topic' => 'Main program & presentation',   'speaker' => ''],
    ['time' => '40–45', 'topic' => 'Next steps: private consultation', 'speaker' => ''],
    ['time' => '45–60', 'topic' => 'Live Q&A session',              'speaker' => ''],
    ['time' => '60–65', 'topic' => 'Summary & next session',        'speaker' => '']
];

$defaultAgendaFa = [
    ['time' => '۰–۵',   'topic' => 'خوشامدگویی و نظرسنجی آغازین', 'speaker' => ''],
    ['time' => '۵–۱۰',  'topic' => 'معرفی شریف گروپ و سخنرانان', 'speaker' => ''],
    ['time' => '۱۰–۴۰', 'topic' => 'محتوای اصلی و تحلیل برنامه', 'speaker' => ''],
    ['time' => '۴۰–۴۵', 'topic' => 'قدم بعدی: مشاوره خصوصی و چک‌لیست', 'speaker' => ''],
    ['time' => '۴۵–۶۰', 'topic' => 'پرسش و پاسخ زنده', 'speaker' => ''],
    ['time' => '۶۰–۶۵', 'topic' => 'جمع‌بندی و معرفی جلسه بعد', 'speaker' => '']
];

foreach ($sessionsInput as $idx => $sInput) {
    $sNo = $idx + 1;
    $sId = 'WEB' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT);

    // Title resolution
    $titlePrimary = trim($sInput['title'] ?? ($sInput['title_fa'] ?? ''));
    $titleEn = trim($sInput['title_en'] ?? '');
    if (empty($titleEn) && !empty($titlePrimary)) {
        $titleEn = $titlePrimary;
    }
    if (empty($titlePrimary)) {
        $titlePrimary = "Session {$sNo}: {$seriesName}";
    }
    if (empty($titleEn)) {
        $titleEn = "Session {$sNo}: {$seriesName}";
    }

    // Slug generation & validation
    $slug = trim($sInput['slug'] ?? '');
    if (empty($slug)) {
        $slug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($titleEn));
        $slug = trim($slug, '-');
    }
    $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower($slug));
    if (empty($slug) || in_array($slug, $seenSlugs, true)) {
        $slug = strtolower($seriesId . '-session-' . $sNo);
    }
    $seenSlugs[] = $slug;

    // Date & UTC parsing
    $startUtc = trim($sInput['start_utc'] ?? '');
    if (empty($startUtc)) {
        // Fallback default: 7 days from now + sNo * 7 days
        $futureTs = strtotime("+{$sNo} week 15:30:00 UTC");
        $startUtc = gmdate('Y-m-d\TH:i:s\Z', $futureTs);
    } else {
        $parsedTs = strtotime($startUtc);
        if ($parsedTs === false) {
            $parsedTs = time() + (86400 * 7 * $sNo);
        }
        $startUtc = gmdate('Y-m-d\TH:i:s\Z', $parsedTs);
    }

    $durationMin = max(15, (int)($sInput['duration_min'] ?? 65));
    $capacity = max(10, (int)($sInput['capacity'] ?? 100));
    $joinVis = in_array(strtolower(trim($sInput['join_visibility'] ?? '')), ['public', 'registrants'], true)
        ? strtolower(trim($sInput['join_visibility']))
        : 'public';
    $joinUrl = trim($sInput['join_url'] ?? '');
    $regOpen = isset($sInput['registration_open']) ? (bool)$sInput['registration_open'] : true;

    // Excerpt & Body
    $excerptPrimary = trim($sInput['excerpt'] ?? ($sInput['excerpt_fa'] ?? ''));
    $excerptEn = trim($sInput['excerpt_en'] ?? $excerptPrimary);
    if (empty($excerptPrimary)) {
        $excerptPrimary = "جلسه آنلاین و رایگان درباره {$seriesName}.";
    }
    if (empty($excerptEn)) {
        $excerptEn = "Free online session on {$seriesName}.";
    }

    // Body
    $bodyRaw = $sInput['body'] ?? ($sInput['body_fa'] ?? []);
    if (is_string($bodyRaw)) {
        $bodyParas = array_values(array_filter(array_map('trim', explode("\n\n", $bodyRaw))));
    } elseif (is_array($bodyRaw)) {
        $bodyParas = array_values(array_filter(array_map('trim', $bodyRaw)));
    } else {
        $bodyParas = [];
    }
    if (empty($bodyParas)) {
        $bodyParas = [
          "برنامه سرمایه‌گذاری {$seriesName} یکی از گزینه‌های برجسته برای متقاضیان بین‌المللی است.",
          "در این وبینار جامع، کارشناسان ارشد شریف گروپ کلیه جزئیات، مراحل و هزینه‌ها را تشریح خواهند کرد."
        ];
    }

    $bodyEnRaw = $sInput['body_en'] ?? [];
    if (is_string($bodyEnRaw)) {
        $bodyEnParas = array_values(array_filter(array_map('trim', explode("\n\n", $bodyEnRaw))));
    } elseif (is_array($bodyEnRaw)) {
        $bodyEnParas = array_values(array_filter(array_map('trim', $bodyEnRaw)));
    } else {
        $bodyEnParas = [];
    }
    if (empty($bodyEnParas)) {
        $bodyEnParas = [
            "The {$seriesName} offers an established legal pathway for international investors and families.",
            "In this session, Sharif Group specialists provide full details on requirements, timelines, and costs."
        ];
    }

    // Outcomes
    $outcomesRaw = $sInput['outcomes'] ?? ($sInput['outcomes_fa'] ?? []);
    if (is_string($outcomesRaw)) {
        $outcomes = array_values(array_filter(array_map('trim', explode("\n", $outcomesRaw))));
    } elseif (is_array($outcomesRaw)) {
        $outcomes = array_values(array_filter(array_map('trim', $outcomesRaw)));
    } else {
        $outcomes = [];
    }
    if (empty($outcomes)) {
        $outcomes = [
            "آشنایی با قوانین و شرایط برنامه",
            "بررسی گزینه‌های سرمایه‌گذاری و جدول هزینه‌ها",
            "شرایط افزودن افراد وابسته و اعضای خانواده",
            "مراحل گام‌به‌گام از ثبت پرونده تا دریافت نتیجه",
            "پرسش و پاسخ زنده با مشاوران ارشد"
        ];
    }

    $outcomesEnRaw = $sInput['outcomes_en'] ?? [];
    if (is_string($outcomesEnRaw)) {
        $outcomesEn = array_values(array_filter(array_map('trim', explode("\n", $outcomesEnRaw))));
    } elseif (is_array($outcomesEnRaw)) {
        $outcomesEn = array_values(array_filter(array_map('trim', $outcomesEnRaw)));
    } else {
        $outcomesEn = [];
    }
    if (empty($outcomesEn)) {
        $outcomesEn = [
            "Program overview and eligibility criteria",
            "Investment options and complete cost breakdown",
            "Including dependent family members in the application",
            "Step-by-step roadmap from filing to completion",
            "Live interactive Q&A with Senior Consultants"
        ];
    }

    // Speakers
    $speakers = !empty($sInput['speakers']) && is_array($sInput['speakers'])
        ? $sInput['speakers']
        : $defaultSpeakers;

    // Agenda
    $agenda = !empty($sInput['agenda']) && is_array($sInput['agenda'])
        ? $sInput['agenda']
        : ($primaryLang === 'fa' ? $defaultAgendaFa : $defaultAgenda);

    // Assemble Full Session Record
    $sessionRecord = [
        'id'                    => $sId,
        'slug'                  => $slug,
        'series'                => $seriesId,
        'session_no'            => $sNo,
        'category'              => $category,
        'subcategory'           => $subcategory,
        'start_utc'             => $startUtc,
        'date_confirmed'        => true,
        'duration_min'          => $durationMin,
        'room_opens_min_before' => 10,
        'event_status'          => 'upcoming',
        'registration_open'     => $regOpen,
        'capacity'              => $capacity,
        'join_visibility'       => $joinVis,
        'join_url'              => $joinUrl,
        'language_code'         => $primaryLang,
        'utm_campaign'          => $seriesId,
        'series_tag'            => trim($seriesInput['series_tag'] ?? ('Series ' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT) . ' · ' . ucfirst($subcategory))),
        'status_en'             => 'published',
        'status_fa'             => 'published',
        'status_ar'             => 'published',
        'status_zh'             => 'published',
        'speakers'              => $speakers,
        'fa' => [
            'title'             => $primaryLang === 'fa' ? $titlePrimary : $titleEn,
            'excerpt'           => $primaryLang === 'fa' ? $excerptPrimary : $excerptEn,
            'body'              => $bodyParas,
            'outcomes'          => $outcomes,
            'speakers'          => $defaultSpeakersFa,
            'agenda'            => $defaultAgendaFa,
            'series_tag'        => trim($seriesInput['series_tag'] ?? ('Series ' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT) . ' · ' . ucfirst($subcategory))),
        ],
        'en' => [
            'title'             => $titleEn,
            'excerpt'           => $excerptEn,
            'body'              => $bodyEnParas,
            'outcomes'          => $outcomesEn,
            'speakers'          => $defaultSpeakers,
            'agenda'            => $defaultAgenda,
            'series_tag'        => trim($seriesInput['series_tag'] ?? ('Series ' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT) . ' · ' . ucfirst($subcategory))),
        ],
        'ar' => [
            'title'             => $titleEn,
            'excerpt'           => $excerptEn,
            'body'              => $bodyEnParas,
            'outcomes'          => $outcomesEn,
            'speakers'          => $defaultSpeakers,
            'agenda'            => $defaultAgenda,
            'series_tag'        => trim($seriesInput['series_tag'] ?? ('Series ' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT) . ' · ' . ucfirst($subcategory))),
        ],
        'zh' => [
            'title'             => $titleEn,
            'excerpt'           => $excerptEn,
            'body'              => $bodyEnParas,
            'outcomes'          => $outcomesEn,
            'speakers'          => $defaultSpeakers,
            'agenda'            => $defaultAgenda,
            'series_tag'        => trim($seriesInput['series_tag'] ?? ('Series ' . str_pad((string)$sNo, 2, '0', STR_PAD_LEFT) . ' · ' . ucfirst($subcategory))),
        ]
    ];

    $processedSessions[] = $sessionRecord;
}

$rootDir = realpath(dirname(__DIR__, 2));
$nowIso = gmdate('Y-m-d\TH:i:s\Z');

// ── 3. UPDATE CATALOG STORAGE (data/sgcms_series_catalog.json) ───────────
$catalogFile = $rootDir . '/data/sgcms_series_catalog.json';
$catalog = ['catalog' => []];
if (file_exists($catalogFile)) {
    $rawCat = @file_get_contents($catalogFile);
    $decCat = json_decode($rawCat, true);
    if (!empty($decCat['catalog']) && is_array($decCat['catalog'])) {
        $catalog = $decCat;
    }
}

$seriesMeta = [
    'series_id'        => $seriesId,
    'series_name'      => $seriesName,
    'category'         => $category,
    'subcategory'      => $subcategory,
    'primary_language' => $primaryLang,
    'session_count'    => count($processedSessions),
    'status'           => ($action === 'activate') ? 'active' : 'staged',
    'created_at'       => $nowIso,
    'updated_at'       => $nowIso,
    'sessions'         => array_map(function($s) {
        return [
            'session_no'   => $s['session_no'],
            'id'           => $s['id'],
            'slug'         => $s['slug'],
            'title'        => $s['en']['title'],
            'start_utc'    => $s['start_utc'],
            'event_status' => $s['event_status']
        ];
    }, $processedSessions),
    'full_sessions'    => $processedSessions
];

// If activating, mark all previously active series as archived
if ($action === 'activate') {
    foreach ($catalog['catalog'] as &$catItem) {
        if (($catItem['status'] ?? '') === 'active') {
            $catItem['status'] = 'completed';
            $catItem['updated_at'] = $nowIso;
        }
    }
    unset($catItem);
}

// Add or update entry in catalog
$foundCatIdx = -1;
foreach ($catalog['catalog'] as $cIdx => $cItem) {
    if (($cItem['series_id'] ?? '') === $seriesId) {
        $foundCatIdx = $cIdx;
        break;
    }
}
if ($foundCatIdx >= 0) {
    $catalog['catalog'][$foundCatIdx] = $seriesMeta;
} else {
    array_unshift($catalog['catalog'], $seriesMeta);
}

if (!is_dir($rootDir . '/data')) {
    @mkdir($rootDir . '/data', 0755, true);
}
@file_put_contents($catalogFile, json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

// ── 4. IF ACTION IS ACTIVATE: LAUNCH LIVE TO WEBSITE ─────────────────────
if ($action === 'activate') {
    // A. Archive outgoing live series
    $archiveDir = $rootDir . '/data/sgcms_series_archive';
    if (!is_dir($archiveDir)) {
        @mkdir($archiveDir, 0755, true);
    }
    $currentJson = $rootDir . '/data/sgcms_webinars.json';
    if (file_exists($currentJson)) {
        $rawCurrent = @file_get_contents($currentJson);
        $decCurrent = json_decode($rawCurrent, true);
        $oldSeriesSlug = 'previous';
        if (!empty($decCurrent['sgcms_webinars'][0]['series'])) {
            $oldSeriesSlug = preg_replace('/[^a-z0-9_-]/i', '', $decCurrent['sgcms_webinars'][0]['series']);
        }
        $archivePath = $archiveDir . '/series_' . $oldSeriesSlug . '_' . date('Ymd_His') . '.json';
        @file_put_contents($archivePath, $rawCurrent, LOCK_EX);

        // A2. Delete old session slug directories so orphaned URLs don't persist
        $oldSessions = [];
        if (isset($decCurrent['sgcms_webinars']) && is_array($decCurrent['sgcms_webinars'])) {
            $oldSessions = $decCurrent['sgcms_webinars'];
        } elseif (is_array($decCurrent)) {
            $oldSessions = $decCurrent;
        }
        // Build a lookup of new slugs so we don't delete a reused slug
        $newSlugs = array_column($processedSessions, 'slug');
        foreach ($oldSessions as $oldS) {
            $oldSlug = preg_replace('/[^a-z0-9_-]/i', '', $oldS['slug'] ?? '');
            if (empty($oldSlug) || in_array($oldSlug, $newSlugs, true)) continue;
            // Delete across all language prefixes for both /events/ and /webinars/ paths
            foreach (['events', 'fa/events', 'ar/events', 'zh/events', 'webinars', 'fa/webinars', 'ar/webinars', 'zh/webinars'] as $base) {
                $oldDir = $rootDir . '/' . $base . '/' . $oldSlug;
                if (is_dir($oldDir)) {
                    $oldIndex = $oldDir . '/index.html';
                    if (file_exists($oldIndex)) @unlink($oldIndex);
                    // Remove any other stray files
                    foreach ((array)glob($oldDir . '/*') as $f) {
                        if (is_file($f)) @unlink($f);
                    }
                    @rmdir($oldDir);
                }
            }
        }
    }

    // B. Write new series to data/sgcms_webinars.json
    $livePayload = ['sgcms_webinars' => $processedSessions];
    $jsonEncoded = json_encode($livePayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    @file_put_contents($currentJson, $jsonEncoded, LOCK_EX);

    // C. Write assets/js/webinars-data.js
    $jsContent = "/* Auto-generated by Sharif Group CMS */\n";
    $jsContent .= "window.SGCMS_WEBINARS = " . json_encode($processedSessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
    $jsContent .= "window.SGCMS_ACTIVE_SERIES = " . json_encode($seriesId) . ";\n";
    $jsContent .= "window.SGCMS_HERO_SESSION_NO = 1;\n";
    @file_put_contents($rootDir . '/assets/js/webinars-data.js', $jsContent, LOCK_EX);

    // D. Mirror to demo if present
    $demoJs = $rootDir . '/Sharif-Webinars-Demo_1/sharif-webinars-demo/assets/js/webinars-data.js';
    if (file_exists($demoJs)) {
        @file_put_contents($demoJs, $jsContent, LOCK_EX);
    }

    // E. Clear legacy overrides in snapshots so new series starts clean
    foreach (['draft_content.json', 'published_content.json'] as $fSnap) {
        $snapPath = $rootDir . '/admin/api/' . $fSnap;
        if (file_exists($snapPath)) {
            $rawSnap = @file_get_contents($snapPath);
            $decSnap = json_decode($rawSnap, true);
            if (is_array($decSnap)) {
                $decSnap['sgcms_webinars'] = $processedSessions;
                $decSnap['sgcms_webinar_schedule'] = [
                    'active_session_no' => 1,
                    'updated_at'        => $nowIso,
                    'sessions'          => []
                ];
                @file_put_contents($snapPath, json_encode($decSnap, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
            }
        }
    }

    // F. Generate Clean Directory Shells for Each Session Slug
    // This gives immediate 200 OK access on all web servers and search crawlers
    foreach ($processedSessions as $s) {
        $sSlug = $s['slug'];
        $titleSafe = htmlspecialchars($s['en']['title'], ENT_QUOTES, 'UTF-8');
        $descSafe = htmlspecialchars($s['en']['excerpt'], ENT_QUOTES, 'UTF-8');
        $titleFaSafe = htmlspecialchars($s['fa']['title'], ENT_QUOTES, 'UTF-8');
        $descFaSafe = htmlspecialchars($s['fa']['excerpt'], ENT_QUOTES, 'UTF-8');

        // 1. Root /events/<slug>/index.html
        $dirEn = $rootDir . '/events/' . $sSlug;
        if (!is_dir($dirEn)) {
            @mkdir($dirEn, 0755, true);
        }
        $htmlEn = generateSessionHtmlShell('en', 'ltr', $titleSafe, $descSafe, $sSlug, 'Skip to content');
        @file_put_contents($dirEn . '/index.html', $htmlEn, LOCK_EX);

        // 2. /fa/events/<slug>/index.html
        $dirFa = $rootDir . '/fa/events/' . $sSlug;
        if (!is_dir($dirFa)) {
            @mkdir($dirFa, 0755, true);
        }
        $htmlFa = generateSessionHtmlShell('fa', 'rtl', $titleFaSafe, $descFaSafe, $sSlug, 'رفتن به محتوا');
        @file_put_contents($dirFa . '/index.html', $htmlFa, LOCK_EX);

        // 3. /ar/events/<slug>/index.html
        $dirAr = $rootDir . '/ar/events/' . $sSlug;
        if (!is_dir($dirAr)) {
            @mkdir($dirAr, 0755, true);
        }
        $htmlAr = generateSessionHtmlShell('ar', 'rtl', $titleSafe, $descSafe, $sSlug, 'الانتقال إلى المحتوى');
        @file_put_contents($dirAr . '/index.html', $htmlAr, LOCK_EX);

        // 4. /zh/events/<slug>/index.html
        $dirZh = $rootDir . '/zh/events/' . $sSlug;
        if (!is_dir($dirZh)) {
            @mkdir($dirZh, 0755, true);
        }
        $htmlZh = generateSessionHtmlShell('zh', 'ltr', $titleSafe, $descSafe, $sSlug, '跳转到主要内容');
        @file_put_contents($dirZh . '/index.html', $htmlZh, LOCK_EX);
    }
}

// ── 5. RETURN SUCCESS RESPONSE ──────────────────────────────────────────
$urls = array_map(function($s) {
    return [
        'session_no' => $s['session_no'],
        'slug'       => $s['slug'],
        'url_en'     => '/events/' . $s['slug'] . '/',
        'url_fa'     => '/fa/events/' . $s['slug'] . '/'
    ];
}, $processedSessions);

jsonResponse([
    'success'       => true,
    'action'        => $action,
    'series_id'     => $seriesId,
    'series_name'   => $seriesName,
    'status'        => ($action === 'activate') ? 'active' : 'staged',
    'session_count' => count($processedSessions),
    'sessions'      => $processedSessions,
    'urls'          => $urls,
    'message'       => ($action === 'activate')
        ? "Series '{$seriesName}' has been activated and published to the live website!"
        : "Series '{$seriesName}' has been saved as a staged draft."
]);

/**
 * Helper to generate the exact 56-line HTML shell for session landing pages
 */
function generateSessionHtmlShell($lang, $dir, $title, $description, $slug, $skipText) {
    return <<<HTML
<!DOCTYPE html>
<html class="scroll-smooth" lang="{$lang}" dir="{$dir}">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-WQV73SMP');</script>
  <!-- End Google Tag Manager -->

  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title} | Sharif Group Dubai</title>
  <meta name="description" content="{$description}">
  <link rel="canonical" href="https://sharifgroup.ae/events/{$slug}/">
  <link rel="alternate" hreflang="en" href="https://sharifgroup.ae/events/{$slug}/">
  <link rel="alternate" hreflang="fa" href="https://sharifgroup.ae/fa/events/{$slug}/">
  <link rel="alternate" hreflang="ar" href="https://sharifgroup.ae/ar/events/{$slug}/">
  <link rel="alternate" hreflang="zh" href="https://sharifgroup.ae/zh/events/{$slug}/">
  <link rel="alternate" hreflang="x-default" href="https://sharifgroup.ae/events/{$slug}/">

  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261109">
  <link rel="shortcut icon" href="/favicon.ico?v=20261109">
  <meta name="theme-color" content="#0a0a0a">

  <!-- Typography & Styling -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/assets/css/webinars.css?v=20261029c">
  <link rel="stylesheet" href="/assets/css/navbar.css?v=20261117">
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WQV73SMP" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <a class="skip" href="#main">{$skipText}</a>
  <div class="demo-bar" id="demoBar" style="display:none"></div>
  <header class="site-header" id="main-header"></header>
  <nav class="drawer" id="drawer" aria-label="Mobile Navigation"></nav>
  <main id="main" tabindex="-1"></main>
  <footer class="site-footer" id="siteFooter"></footer>
  <button class="demo-fab" id="demoFab" type="button" style="display:none" aria-label="Demo controls"></button>
  <div class="demo-panel" id="demoPanel" role="dialog" aria-label="Demo controls" style="display:none"></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script src="/assets/js/webinars-i18n.js?v=20261029c"></script>
  <script src="/assets/js/webinars-data.js?v=20261029c"></script>
  <script src="/assets/js/navbar.js?v=20261117"></script>
  <script src="/assets/js/webinars-app.js?v=20261117"></script>
  <script defer src="/assets/js/whatsapp-widget.js"></script>
</body>
</html>
HTML;
}
