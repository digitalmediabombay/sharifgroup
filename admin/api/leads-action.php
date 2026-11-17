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

$allowedStatuses = ['new', 'contacted', 'qualified', 'archived'];
$status = isset($body['status']) ? strtolower(trim($body['status'])) : null;
if ($status !== null && !in_array($status, $allowedStatuses, true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid status. Allowed: ' . implode(', ', $allowedStatuses)], 400);
}

$adminNote = isset($body['admin_note']) ? trim($body['admin_note']) : null;

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
