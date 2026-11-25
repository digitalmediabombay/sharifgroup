<?php
/**
 * Sharif Group CMS - Update Lead Status & Internal Notes API
 * 
 * Updates a lead's status (new, contacted, qualified, archived)
 * and records internal admin follow-up notes in data/leads_status.json.
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

$leadId = trim($body['lead_id'] ?? '');
if (empty($leadId)) {
    jsonResponse(['success' => false, 'error' => 'Lead ID is required.'], 400);
}

$action = strtolower(trim($body['action'] ?? 'update'));
$rootDir = realpath(dirname(__DIR__, 2));
$statusFile = $rootDir . '/data/leads_status.json';

$statusStore = [];
if (file_exists($statusFile)) {
    $raw = @file_get_contents($statusFile);
    $dec = json_decode($raw, true);
    if (is_array($dec)) {
        $statusStore = $dec;
    }
}

// ── DELETE LEAD PERMANENTLY ──────────────────────────────────────────────
if ($action === 'delete') {
    $deletedFromInquiries = false;
    $deletedFromEvents = false;

    $inquiriesFile = $rootDir . '/data/inquiries.json';
    if (file_exists($inquiriesFile)) {
        $decInq = json_decode(@file_get_contents($inquiriesFile), true);
        if (is_array($decInq)) {
            $filteredInq = [];
            foreach ($decInq as $item) {
                $itemId = trim($item['inquiry_id'] ?? '');
                $fallbackId = 'INQ-' . substr(md5(json_encode($item)), 0, 8);
                if ($itemId === $leadId || (empty($itemId) && $fallbackId === $leadId)) {
                    $deletedFromInquiries = true;
                    continue;
                }
                $filteredInq[] = $item;
            }
            if ($deletedFromInquiries) {
                @file_put_contents($inquiriesFile, json_encode(array_values($filteredInq), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
            }
        }
    }

    $regFile = $rootDir . '/data/event_registrations.json';
    if (file_exists($regFile)) {
        $decReg = json_decode(@file_get_contents($regFile), true);
        if (is_array($decReg)) {
            $filteredReg = [];
            foreach ($decReg as $item) {
                $itemId = trim($item['registration_id'] ?? '');
                $fallbackId = 'REG-' . substr(md5(json_encode($item)), 0, 8);
                if ($itemId === $leadId || (empty($itemId) && $fallbackId === $leadId)) {
                    $deletedFromEvents = true;
                    continue;
                }
                $filteredReg[] = $item;
            }
            if ($deletedFromEvents) {
                @file_put_contents($regFile, json_encode(array_values($filteredReg), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
            }
        }
    }

    if (isset($statusStore[$leadId])) {
        unset($statusStore[$leadId]);
        @file_put_contents($statusFile, json_encode($statusStore, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }

    jsonResponse([
        'success' => true,
        'deleted' => true,
        'lead_id' => $leadId,
        'removed_inquiry' => $deletedFromInquiries,
        'removed_event'   => $deletedFromEvents,
        'message' => "Lead {$leadId} deleted permanently."
    ]);
}

$allowedStatuses = ['new', 'contacted', 'qualified', 'archived'];
$status = isset($body['status']) ? strtolower(trim($body['status'])) : null;
if ($status !== null && !in_array($status, $allowedStatuses, true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid status. Allowed: ' . implode(', ', $allowedStatuses)], 400);
}

$adminNote = isset($body['admin_note']) ? trim($body['admin_note']) : null;

if (!isset($statusStore[$leadId])) {
    $statusStore[$leadId] = [
        'status'     => 'new',
        'notes'      => '',
        'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
    ];
}

if ($status !== null) {
    $statusStore[$leadId]['status'] = $status;
}
if ($adminNote !== null) {
    $statusStore[$leadId]['notes'] = $adminNote;
}
$statusStore[$leadId]['updated_at'] = gmdate('Y-m-d\TH:i:s\Z');
$statusStore[$leadId]['updated_by'] = $adminUser['name'] ?? 'Admin';

if (!is_dir($rootDir . '/data')) {
    @mkdir($rootDir . '/data', 0755, true);
}
@file_put_contents($statusFile, json_encode($statusStore, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

jsonResponse([
    'success'    => true,
    'lead_id'    => $leadId,
    'status'     => $statusStore[$leadId]['status'],
    'admin_note' => $statusStore[$leadId]['notes'],
    'updated_at' => $statusStore[$leadId]['updated_at'],
    'message'    => "Lead {$leadId} updated successfully."
]);
