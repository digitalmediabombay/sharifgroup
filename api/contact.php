<?php
/**
 * ==============================================================================
 * Sharif Group - Contact & Consultation Lead Dispatcher API
 * ==============================================================================
 * Purpose:
 * Receives consultation & contact inquiries from all language sites (en, fa, ar, zh),
 * dispatches an instant admin notification email to mohammad@sharifgroup.ae via
 * authenticated cPanel mailer, logs the lead locally to data/inquiries.json,
 * and forwards the payload to the Google Sheets CRM Webhook.
 * ==============================================================================
 */

// Headers & CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

// Read JSON Input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !is_array($data)) {
    // Fallback to $_POST
    $data = $_POST;
}

// Honeypot check (hidden spam traps)
if (!empty($data['website_url_honeypot'])) {
    echo json_encode(['status' => 'success', 'message' => 'Spam detected']);
    exit;
}

// Configuration
$ADMIN_EMAIL   = 'contact@sharifgroup.ae';
$SENDER_EMAIL  = 'contact@sharifgroup.ae';
$SENDER_NAME   = 'Sharif Group';
$CRM_WEBHOOK   = 'https://script.google.com/macros/s/AKfycby30xpRFvm-ZHoFTlMAY-JkVKNfwP1ccA4pKJS5kr_KJvYEljYgh2u129peMGl8ut5s/exec';

// Extract Form Fields
$fullName = trim($data['fullName'] ?? '');
if (empty($fullName)) {
    $fullName = trim(($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''));
}
if (empty($fullName)) {
    $fullName = 'Website Client';
}

$email       = trim(strtolower($data['email'] ?? ''));
$dialCode    = trim($data['dialCode'] ?? '');
$phone       = trim($data['phone'] ?? '');
$country     = trim($data['country'] ?? $data['residence'] ?? $data['nationality'] ?? $data['address'] ?? '');
$timezone    = trim($data['timezone'] ?? '');
$propertyInterest = trim($data['propertyInterest'] ?? $data['property_interest'] ?? '');
$service     = trim($data['service'] ?? $data['programChoice'] ?? $data['targetProgram'] ?? $data['program'] ?? $data['investmentRoute'] ?? 'General Consultation');
if (!empty($data['subProgram']) && stripos($service, (string)$data['subProgram']) === false) {
    $service .= ' (' . $data['subProgram'] . ')';
}
$notes       = trim($data['notes'] ?? $data['message'] ?? $data['confidentialNotes'] ?? '');
if (!empty($timezone) && stripos($notes, $timezone) === false) {
    $notes = $notes ? ($notes . ' | Timezone: ' . $timezone) : ('Timezone: ' . $timezone);
}
if (!empty($propertyInterest) && stripos($notes, $propertyInterest) === false) {
    $notes = $notes ? ($notes . ' | Property Interest: ' . $propertyInterest) : ('Property Interest: ' . $propertyInterest);
}
$lang        = strtolower(trim($data['lang'] ?? 'en'));
$source      = trim($data['source'] ?? '');
$page        = trim($data['page'] ?? '');
$formId      = trim($data['form_id'] ?? 'consultation-form');
$nowUtc      = gmdate('Y-m-d H:i:s') . ' UTC';
$inquiryId   = !empty($data['inquiry_id']) ? trim($data['inquiry_id']) : ('INQ-' . strtoupper(substr(uniqid(), -6)));

$targetTab   = trim($data['targetTab'] ?? '');
if (empty($targetTab)) {
    $curPath = strtolower($page . ' ' . $source);
    if (strpos($curPath, '/residency') !== false || strpos($curPath, 'portugal') !== false || strpos($curPath, 'greece') !== false || strpos($curPath, 'uae') !== false || strpos($curPath, 'panama') !== false) {
        $targetTab = 'Residency';
    } elseif (strpos($curPath, '/citizenship') !== false || strpos($curPath, 'dominica') !== false || strpos($curPath, 'grenada') !== false || strpos($curPath, 'antigua') !== false || strpos($curPath, 'stlucia') !== false || strpos($curPath, 'stkitts') !== false || strpos($curPath, 'vanuatu') !== false || strpos($curPath, 'nauru') !== false || strpos($curPath, 'sao tome') !== false) {
        $targetTab = 'Citizenship';
    } elseif (strpos($curPath, '/realestate') !== false) {
        $targetTab = 'Real Estate';
    } elseif (strpos($curPath, '/educationaladvisory') !== false) {
        $targetTab = 'Educational Advisory';
    }

    $isContact = (strpos($curPath, '/contact') !== false || $formId === 'contact-form' || $formId === 'contact-us');
    $isHome = ($formId === 'contact-portal-form' || $page === '' || $page === '/' || $page === '/index.html' || $page === '/fa/' || $page === '/ar/' || $page === '/zh/');
    if ($isHome || $isContact) {
        $targetTab = 'General Enquiries';
    }
}

// 1. Dispatch Instant Admin Notification Email to Mohammad
$adminEmailSent = false;
$adminEmailError = null;

if (!empty($ADMIN_EMAIL)) {
    $adminSubject = sprintf(
        "⚡ New Inquiry: %s (%s | %s)",
        $fullName,
        $service ?: 'General',
        strtoupper($lang)
    );
    $encodedSubject = '=?UTF-8?B?' . base64_encode($adminSubject) . '?=';

    $adminBody = "====================================================\n"
        . "SHARIF GROUP — NEW WEBSITE INQUIRY RECEIVED\n"
        . "====================================================\n\n"
        . "• Inquiry ID:    " . $inquiryId . "\n"
        . "• Full Name:     " . $fullName . "\n"
        . "• Email Address: " . ($email ?: 'Not provided') . "\n"
        . "• Phone Number:  " . ($phone ?: 'Not provided') . "\n"
        . "• Country:       " . ($country ?: 'Not specified') . "\n"
        . "• Service/Route: " . ($service ?: 'General Inquiry') . "\n"
        . "• Language:      " . strtoupper($lang) . "\n"
        . "• Form ID:       " . $formId . "\n"
        . "• Timestamp:     " . $nowUtc . "\n"
        . "• Source Page:   " . ($page ?: $source) . "\n\n"
        . "----------------------------------------------------\n"
        . "CLIENT NOTES & DETAILS:\n"
        . "----------------------------------------------------\n"
        . ($notes ?: 'No additional notes entered.') . "\n\n"
        . "====================================================\n";

    $adminHeaders = "From: " . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode($SENDER_NAME), $SENDER_EMAIL) . "\r\n"
        . "Reply-To: " . ($email ?: $SENDER_EMAIL) . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "X-Mailer: PHP/" . phpversion();

    $adminEmailSent = @mail($ADMIN_EMAIL, $encodedSubject, $adminBody, $adminHeaders, "-f" . $SENDER_EMAIL);
    if (!$adminEmailSent) {
        $adminEmailError = 'Native mailer returned false';
    }
}

// 1.1 Automated Client Confirmation Receipt (From: contact@sharifgroup.ae)
$clientEmailSent = false;
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $clientSubject = ($lang === 'fa')
        ? 'تایید دریافت پیام شما در شریف گروپ دبی [کد پیگیری: ' . $inquiryId . ']'
        : (($lang === 'ar')
            ? 'تأكيد استلام استفساركم لدى مجموعة شريف دبي [المرجع: ' . $inquiryId . ']'
            : 'Thank you for contacting Sharif Group Dubai [Ref: ' . $inquiryId . ']');

    $encodedClientSubject = '=?UTF-8?B?' . base64_encode($clientSubject) . '?=';
    $clientBody = ($lang === 'fa')
        ? "سلام " . $fullName . " گرامی،\n\nاز تماس شما با شریف گروپ دبی سپاسگزاریم. درخواست مشاوره شما در خصوص (" . ($service ?: 'مشاوره اختصاصی') . ") با کد رهگیری " . $inquiryId . " با موفقیت در سیستم ثبت گردید.\n\nمشاوران ارشد ما درخواست شما را بررسی نموده و ظرف حداکثر ۲۴ ساعت کاری با شما تماس خواهند گرفت.\n\nبا احترام،\nشریف گروپ دبی\nبرج باینری ۱۱۶، بیزینس بی، دبی، امارات متحده عربی\nایمیل: contact@sharifgroup.ae\nوبسایت: https://sharifgroup.ae"
        : (($lang === 'ar')
            ? "مرحباً " . $fullName . "،\n\nشكراً لتواصلكم مع مجموعة شريف دبي. تم استلام طلبكم بخصوص (" . ($service ?: 'الاستشارة الخاصة') . ") بنجاح برقم مرجعي " . $inquiryId . ".\n\nسيقوم فريق الاستشارات الخاصة لدينا بمراجعة طلبكم والتواصل معكم خلال 24 ساعة عمل.\n\nمع التحية والتقدير،\nمجموعة شريف دبي\nبرج باينري 116، الخليج التجاري، دبی، الإمارات العربية المتحدة\ncontact@sharifgroup.ae\nhttps://sharifgroup.ae"
            : "Dear " . $fullName . ",\n\nThank you for contacting Sharif Group Dubai. We have received your inquiry regarding " . ($service ?: 'our advisory services') . " (Reference ID: " . $inquiryId . ").\n\nOur senior private client advisors will carefully review your requirements and connect with you within 24 business hours.\n\nWarm regards,\nSharif Group Dubai\n116 The Binary Tower, Business Bay, Dubai, UAE\nEmail: contact@sharifgroup.ae\nWebsite: https://sharifgroup.ae");

    $clientHeaders = "From: " . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode($SENDER_NAME), $SENDER_EMAIL) . "\r\n"
        . "Reply-To: " . $SENDER_EMAIL . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "X-Mailer: PHP/" . phpversion();

    $clientEmailSent = @mail($email, $encodedClientSubject, $clientBody, $clientHeaders, "-f" . $SENDER_EMAIL);
}

// 2. Local JSON Backup (Never lose any lead)
try {
    $logDir = dirname(__DIR__) . '/data';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/inquiries.json';
    $entry = [
        'inquiry_id' => $inquiryId,
        'timestamp' => $nowUtc,
        'fullName' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'country' => $country,
        'service' => $service,
        'notes' => $notes,
        'lang' => $lang,
        'form_id' => $formId,
        'source' => $source,
        'page' => $page,
        'email_sent' => $adminEmailSent
    ];
    $existing = [];
    if (file_exists($logFile)) {
        $existing = json_decode(file_get_contents($logFile), true) ?: [];
    }
    $existing[] = $entry;
    @file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
} catch (\Throwable $t) {
    // Silent catch so backup error does not stop response
}

// 3. Background Sync to Google Apps Script CRM (Google Sheets)
if (!empty($CRM_WEBHOOK)) {
    try {
        $crmPayload = json_encode([
            'form_id' => $formId,
            'inquiry_id' => $inquiryId,
            'fullName' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'country' => $country,
            'service' => $service,
            'notes' => $notes,
            'investmentRoute' => trim($data['investmentRoute'] ?? $propertyInterest ?? ''),
            'budget' => trim($data['budget'] ?? $data['budgetTier'] ?? ''),
            'familyMembers' => trim($data['familyMembers'] ?? ''),
            'objective' => trim($data['objective'] ?? ''),
            'timeline' => trim($data['timeline'] ?? ''),
            'lang' => $lang,
            'preferredLanguage' => trim($data['preferredLanguage'] ?? $lang),
            'source' => $source,
            'page' => $page,
            'targetTab' => $targetTab,
            'timestamp' => $nowUtc
        ]);

        $ch = curl_init($CRM_WEBHOOK);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $crmPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        @curl_exec($ch);
    } catch (\Throwable $t) {
        // Opportunistic execution
    }
}

// Return Clean Response
echo json_encode([
    'status' => 'success',
    'inquiry_id' => $inquiryId,
    'email_sent' => $adminEmailSent,
    'message' => 'Inquiry recorded successfully.'
]);

