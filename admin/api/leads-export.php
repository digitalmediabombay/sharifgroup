<?php
/**
 * Sharif Group CMS - Export Leads to CSV API
 * 
 * Generates an Excel-ready CSV export with UTF-8 BOM encoding
 * for proper display of Persian, Arabic, and Chinese names.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();

$rootDir = realpath(dirname(__DIR__, 2));

// 1. Read status overrides
$statusFile = $rootDir . '/data/leads_status.json';
$statusStore = [];
if (file_exists($statusFile)) {
    $rawSt = @file_get_contents($statusFile);
    $decSt = json_decode($rawSt, true);
    if (is_array($decSt)) $statusStore = $decSt;
}

// 2. Read Inquiries
$inquiriesFile = $rootDir . '/data/inquiries.json';
$inquiriesRaw = [];
if (file_exists($inquiriesFile)) {
    $rawInq = @file_get_contents($inquiriesFile);
    $decInq = json_decode($rawInq, true);
    if (is_array($decInq)) $inquiriesRaw = $decInq;
}

// 3. Read Registrations
$regFile = $rootDir . '/data/event_registrations.json';
$regsRaw = [];
if (file_exists($regFile)) {
    $rawReg = @file_get_contents($regFile);
    $decReg = json_decode($rawReg, true);
    if (is_array($decReg)) $regsRaw = $decReg;
}

$rows = [];

foreach ($inquiriesRaw as $item) {
    $id = trim($item['inquiry_id'] ?? '');
    $stInfo = $statusStore[$id] ?? [];
    $rows[] = [
        'id'          => $id,
        'channel'     => 'Consultation / Contact',
        'name'        => trim($item['fullName'] ?? ''),
        'email'       => trim($item['email'] ?? ''),
        'phone'       => trim($item['phone'] ?? ''),
        'country'     => trim($item['country'] ?? ''),
        'service'     => trim($item['service'] ?? 'General Consultation'),
        'language'    => strtoupper(trim($item['lang'] ?? 'en')),
        'status'      => ucfirst($stInfo['status'] ?? 'new'),
        'date'        => trim($item['timestamp'] ?? ''),
        'source_url'  => trim($item['page'] ?? ''),
        'client_notes'=> trim($item['notes'] ?? ''),
        'admin_notes' => trim($stInfo['notes'] ?? '')
    ];
}

foreach ($regsRaw as $item) {
    $id = trim($item['registration_id'] ?? '');
    $stInfo = $statusStore[$id] ?? [];
    $webinarId = trim($item['webinar_id'] ?? 'WEB01');
    $rows[] = [
        'id'          => $id,
        'channel'     => 'Webinar Registration',
        'name'        => trim($item['fullName'] ?? ''),
        'email'       => trim($item['email'] ?? ''),
        'phone'       => trim($item['phone'] ?? ''),
        'country'     => trim($item['country'] ?? ''),
        'service'     => "Webinar Session ({$webinarId})",
        'language'    => strtoupper(trim($item['lang'] ?? 'fa')),
        'status'      => ucfirst($stInfo['status'] ?? 'new'),
        'date'        => trim($item['timestamp'] ?? ''),
        'source_url'  => trim($item['page'] ?? '/events/'),
        'client_notes'=> trim($item['question'] ?? ''),
        'admin_notes' => trim($stInfo['notes'] ?? '')
    ];
}

// Sort newest first
usort($rows, function($a, $b) {
    return strcmp($b['date'], $a['date']);
});

$filename = 'sharif_group_leads_' . date('Ymd_His') . '.csv';

// Output CSV headers
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

// Open output stream
$out = fopen('php://output', 'w');

// Emit UTF-8 Byte Order Mark (BOM) for Excel
fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

// Header row
fputcsv($out, [
    'Lead ID',
    'Channel',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Country',
    'Target Program / Service',
    'Language',
    'Status',
    'Submission Timestamp (UTC)',
    'Source Page URL',
    'Client Notes / Questions',
    'Internal Admin Notes'
]);

foreach ($rows as $r) {
    fputcsv($out, [
        $r['id'],
        $r['channel'],
        $r['name'],
        $r['email'],
        $r['phone'],
        $r['country'],
        $r['service'],
        $r['language'],
        $r['status'],
        $r['date'],
        $r['source_url'],
        $r['client_notes'],
        $r['admin_notes']
    ]);
}

fclose($out);
exit();
