<?php
/**
 * Sharif Group CMS - Form Leads & Inquiries Inbox API
 * 
 * Securely aggregates, normalizes, and filters submissions from:
 * - Consultation requests (data/inquiries.json)
 * - General contact forms (data/inquiries.json)
 * - Webinar registrations (data/event_registrations.json)
 * - Status & Admin Notes (data/leads_status.json)
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$rootDir = realpath(dirname(__DIR__, 2));
$nowTs = time();

// ── 1. READ STATUSES & NOTES (data/leads_status.json) ────────────────────
$statusFile = $rootDir . '/data/leads_status.json';
$statusStore = [];
if (file_exists($statusFile)) {
    $rawSt = @file_get_contents($statusFile);
    $decSt = json_decode($rawSt, true);
    if (is_array($decSt)) {
        $statusStore = $decSt;
    }
}

// ── 2. READ CONTACT & CONSULTATION INQUIRIES (data/inquiries.json) ───────
$inquiriesFile = $rootDir . '/data/inquiries.json';
$inquiriesRaw = [];
if (file_exists($inquiriesFile)) {
    $rawInq = @file_get_contents($inquiriesFile);
    $decInq = json_decode($rawInq, true);
    if (is_array($decInq)) {
        $inquiriesRaw = $decInq;
    }
}

$allLeads = [];

foreach ($inquiriesRaw as $item) {
    $id = trim($item['inquiry_id'] ?? '');
    if (empty($id)) {
        $id = 'INQ-' . substr(md5(json_encode($item)), 0, 8);
    }

    $rawTime = trim($item['timestamp'] ?? '');
    $ts = strtotime($rawTime);
    if ($ts === false) $ts = $nowTs;

    $service = trim($item['service'] ?? 'General Consultation');
    $formId = strtolower(trim($item['form_id'] ?? ''));
    $sourcePage = strtolower(trim($item['page'] ?? ($item['source'] ?? '')));
    $targetTabRaw = strtolower(trim($item['targetTab'] ?? ''));
    $haystackCat = strtolower($service . ' ' . $sourcePage . ' ' . $formId . ' ' . $targetTabRaw);

    // 7-Category classification: citizenship, residency, event, general, realestate, education, partnership
    $channel = 'general';
    $channelLabel = 'General Enquiry';

    if (strpos($haystackCat, 'partner') !== false || strpos($sourcePage, '/partners') !== false) {
        $channel = 'partnership';
        $channelLabel = 'Partnership';
    } elseif (strpos($haystackCat, 'education') !== false || strpos($haystackCat, 'school') !== false || strpos($haystackCat, 'university') !== false) {
        $channel = 'education';
        $channelLabel = 'Educational';
    } elseif (strpos($haystackCat, 'real estate') !== false || strpos($haystackCat, 'realestate') !== false || strpos($haystackCat, 'property') !== false || strpos($haystackCat, 'off-plan') !== false) {
        $channel = 'realestate';
        $channelLabel = 'Real Estate';
    } elseif (strpos($haystackCat, 'residency') !== false || strpos($haystackCat, 'golden visa') !== false || strpos($haystackCat, 'portugal') !== false || strpos($haystackCat, 'greece') !== false || strpos($haystackCat, 'panama') !== false || strpos($haystackCat, 'uae') !== false) {
        $channel = 'residency';
        $channelLabel = 'Residency';
    } elseif (strpos($haystackCat, 'citizenship') !== false || strpos($haystackCat, 'cbi') !== false || strpos($haystackCat, 'dominica') !== false || strpos($haystackCat, 'grenada') !== false || strpos($haystackCat, 'antigua') !== false || strpos($haystackCat, 'lucia') !== false || strpos($haystackCat, 'kitts') !== false || strpos($haystackCat, 'vanuatu') !== false || strpos($haystackCat, 'nauru') !== false || strpos($haystackCat, 'sao tome') !== false) {
        $channel = 'citizenship';
        $channelLabel = 'Citizenship';
    } elseif (strpos($formId, 'contact-portal-form') !== false || strpos($formId, 'contact') !== false) {
        $channel = 'general';
        $channelLabel = 'General Enquiry';
    }

    // E.164 phone extraction for WhatsApp
    $rawPhone = trim($item['phone'] ?? '');
    $phoneDigits = preg_replace('/[^\d+]/', '', $rawPhone);
    if (!str_starts_with($phoneDigits, '+') && !empty($phoneDigits)) {
        $phoneDigits = '+' . $phoneDigits;
    }

    $statusInfo = $statusStore[$id] ?? [];
    $status = $statusInfo['status'] ?? 'new';
    $adminNote = $statusInfo['notes'] ?? '';

    $allLeads[] = [
        'id'            => $id,
        'channel'       => $channel,
        'channel_label' => $channelLabel,
        'full_name'     => trim($item['fullName'] ?? 'Website Client'),
        'email'         => trim($item['email'] ?? ''),
        'phone'         => $rawPhone,
        'whatsapp_e164' => $phoneDigits,
        'country'       => trim($item['country'] ?? ''),
        'service'       => $service,
        'notes'         => trim($item['notes'] ?? ''),
        'lang'          => strtolower(trim($item['lang'] ?? 'en')),
        'form_id'       => $formId,
        'source_page'   => trim($item['page'] ?? ($item['source'] ?? '')),
        'timestamp'     => gmdate('Y-m-d\TH:i:s\Z', $ts),
        'relative_time' => formatRelativeTime($ts, $nowTs),
        'status'        => $status,
        'admin_note'    => $adminNote
    ];
}

// ── 3. READ WEBINAR REGISTRATIONS (data/event_registrations.json) ────────
$regFile = $rootDir . '/data/event_registrations.json';
$regsRaw = [];
if (file_exists($regFile)) {
    $rawReg = @file_get_contents($regFile);
    $decReg = json_decode($rawReg, true);
    if (is_array($decReg)) {
        $regsRaw = $decReg;
    }
}

foreach ($regsRaw as $item) {
    $id = trim($item['registration_id'] ?? '');
    if (empty($id)) {
        $id = 'REG-' . substr(md5(json_encode($item)), 0, 8);
    }

    $rawTime = trim($item['timestamp'] ?? '');
    $ts = strtotime($rawTime);
    if ($ts === false) $ts = $nowTs;

    $webinarId = trim($item['webinar_id'] ?? 'WEB01');
    $serviceTitle = "Webinar Registration ({$webinarId})";

    $rawPhone = trim($item['phone'] ?? '');
    $phoneDigits = preg_replace('/[^\d+]/', '', $rawPhone);
    if (!str_starts_with($phoneDigits, '+') && !empty($phoneDigits)) {
        $phoneDigits = '+' . $phoneDigits;
    }

    $statusInfo = $statusStore[$id] ?? [];
    $status = $statusInfo['status'] ?? 'new';
    $adminNote = $statusInfo['notes'] ?? '';

    $notes = !empty($item['question']) ? ('Attendee Question: ' . trim($item['question'])) : 'Registered for upcoming webinar session.';
    if (!empty($item['newsletter']) && strtolower($item['newsletter']) === 'yes') {
        $notes .= ' | Newsletter Opt-in: Yes';
    }

    $allLeads[] = [
        'id'            => $id,
        'channel'       => 'event',
        'channel_label' => 'Events',
        'full_name'     => trim($item['fullName'] ?? 'Webinar Attendee'),
        'email'         => trim($item['email'] ?? ''),
        'phone'         => $rawPhone,
        'whatsapp_e164' => $phoneDigits,
        'country'       => trim($item['country'] ?? ''),
        'service'       => $serviceTitle,
        'notes'         => $notes,
        'lang'          => strtolower(trim($item['lang'] ?? 'fa')),
        'form_id'       => 'webinar-registration-form',
        'source_page'   => trim($item['page'] ?? '/events/'),
        'timestamp'     => gmdate('Y-m-d\TH:i:s\Z', $ts),
        'relative_time' => formatRelativeTime($ts, $nowTs),
        'status'        => $status,
        'admin_note'    => $adminNote
    ];
}

// ── 4. COMPUTE AGGREGATE STATS ──────────────────────────────────────────
$totalCount = count($allLeads);
$newCount = 0;

foreach ($allLeads as $l) {
    if ($l['status'] === 'new') $newCount++;
}

// ── 5. SORT CHRONOLOGICALLY (Newest First) ──────────────────────────────
usort($allLeads, function($a, $b) {
    return strcmp($b['timestamp'], $a['timestamp']);
});

// ── 6. APPLY FILTERS (CATEGORY, SEARCH, STATUS) ─────────────────────────
$channelFilter = strtolower(trim($_GET['channel'] ?? 'all'));
$searchQuery = strtolower(trim($_GET['search'] ?? ''));
$statusFilter = strtolower(trim($_GET['status'] ?? 'all'));

$filteredLeads = array_values(array_filter($allLeads, function($l) use ($channelFilter, $searchQuery, $statusFilter) {
    // Category filter
    if ($channelFilter !== 'all') {
        $normFilter = ($channelFilter === 'webinar' || $channelFilter === 'webinars' || $channelFilter === 'events') ? 'event' : $channelFilter;
        if ($l['channel'] !== $normFilter) return false;
    }

    // Status filter
    if ($statusFilter !== 'all' && $l['status'] !== $statusFilter) return false;

    // Search query
    if ($searchQuery !== '') {
        $haystack = strtolower($l['full_name'] . ' ' . $l['email'] . ' ' . $l['phone'] . ' ' . $l['country'] . ' ' . $l['service'] . ' ' . $l['notes']);
        if (strpos($haystack, $searchQuery) === false) return false;
    }

    return true;
}));

// ── 7. RETURN JSON RESPONSE ─────────────────────────────────────────────
jsonResponse([
    'success' => true,
    'stats'   => [
        'total'    => $totalCount,
        'new'      => $newCount,
        'filtered' => count($filteredLeads)
    ],
    'leads'   => $filteredLeads
]);

/**
 * Format timestamp into human-readable relative time string
 */
function formatRelativeTime($ts, $now) {
    $diff = max(0, $now - $ts);
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) {
        $m = floor($diff / 60);
        return $m . ($m == 1 ? ' min ago' : ' mins ago');
    }
    if ($diff < 86400) {
        $h = floor($diff / 3600);
        return $h . ($h == 1 ? ' hour ago' : ' hours ago');
    }
    if ($diff < 172800) return 'Yesterday';
    if ($diff < 604800) {
        $d = floor($diff / 86400);
        return $d . ($d == 1 ? ' day ago' : ' days ago');
    }
    return date('j M Y', $ts);
}
