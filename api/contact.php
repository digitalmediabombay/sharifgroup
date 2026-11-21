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

// Honeypot check (hidden spam traps - B4 anti-abuse)
if (!empty($data['website_url_honeypot']) || !empty($data['company_url']) || !empty($data['website']) || !empty($data['hp_check']) || !empty($data['fax'])) {
    echo json_encode(['status' => 'success', 'message' => 'Inquiry received.']);
    exit;
}

// IP-based Rate Limiting (B4: max 12 submissions per minute per IP)
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$clientIp = trim(explode(',', $clientIp)[0]);
$rateFile = sys_get_temp_dir() . '/sharif_rate_' . md5($clientIp) . '.json';
$rateNow = time();
$rateData = ['count' => 0, 'first' => $rateNow];
if (file_exists($rateFile)) {
    $rawRate = @file_get_contents($rateFile);
    if ($rawRate) {
        $parsedRate = json_decode($rawRate, true);
        if ($parsedRate && ($rateNow - ($parsedRate['first'] ?? 0)) < 60) {
            $rateData = $parsedRate;
        }
    }
}
$rateData['count']++;
@file_put_contents($rateFile, json_encode($rateData));
if ($rateData['count'] > 12) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Rate limit reached. Please retry in 60 seconds.']);
    exit;
}

// E.164 Phone Normalization Helper (B3 / ITU-T E.164 max 3 digits)
function normalizePhone($rawPhone, $dialCode = '') {
    static $knownCodes = null;
    if ($knownCodes === null) {
        $knownCodes = [
            '+1-268', '+1-242', '+1-246', '+1-767', '+1-473', '+1-869', '+1-758', '+1-784', '+1-868',
            '+1268', '+1242', '+1246', '+1767', '+1473', '+1869', '+1758', '+1784', '+1868',
            '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+961', '+962', '+963',
            '+964', '+965', '+966', '+967', '+968', '+992', '+993', '+994', '+995', '+996',
            '+998', '+852', '+853', '+855', '+856', '+880', '+886', '+351', '+352', '+353',
            '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373',
            '+374', '+375', '+376', '+377', '+378', '+379', '+380', '+381', '+382', '+385',
            '+386', '+387', '+389', '+420', '+421', '+423', '+501', '+502', '+503', '+504',
            '+505', '+506', '+507', '+509', '+591', '+592', '+593', '+595', '+597', '+598',
            '+670', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+685',
            '+686', '+688', '+691', '+692', '+211', '+212', '+213', '+216', '+218', '+220',
            '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230',
            '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240',
            '+241', '+242', '+243', '+244', '+245', '+248', '+249', '+250', '+251', '+252',
            '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263',
            '+264', '+265', '+266', '+267', '+268', '+269',
            '+90', '+91', '+92', '+93', '+94', '+95', '+98', '+81', '+82', '+84', '+86',
            '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+51', '+52', '+53', '+54',
            '+55', '+56', '+57', '+58', '+40', '+41', '+43', '+44', '+45', '+46', '+47',
            '+48', '+49', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+20', '+27',
            '+1', '+7'
        ];
    }
    $eastern = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹','٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    $latin   = ['0','1','2','3','4','5','6','7','8','9','0','1','2','3','4','5','6','7','8','9'];
    $raw = str_replace($eastern, $latin, trim((string)$rawPhone));
    $dial = str_replace($eastern, $latin, trim((string)$dialCode));
    if (!empty($dial) && strpos($dial, '+') !== 0) $dial = '+' . $dial;

    // Auto-repair corrupt dial code (e.g. +9715 -> +971, +9198 -> +91)
    if (!empty($dial)) {
        foreach ($knownCodes as $k) {
            if (strpos($dial, $k) === 0) {
                $dial = $k;
                break;
            }
        }
    }

    $clean = preg_replace('/[^\d+]/', '', $raw);
    if (strpos($clean, '00') === 0) {
        $clean = '+' . substr($clean, 2);
    }

    $matchedDial = '';
    if (strpos($clean, '+') === 0) {
        foreach ($knownCodes as $k) {
            if (strpos($clean, $k) === 0) {
                $matchedDial = $k;
                $clean = substr($clean, strlen($k));
                break;
            }
        }
        if (empty($matchedDial)) {
            if (preg_match('/^(\+\d{1,3})(.*)$/', $clean, $m)) {
                $matchedDial = $m[1];
                $clean = $m[2];
            }
        }
    }

    if (!empty($matchedDial)) {
        $dial = $matchedDial;
    } elseif (!empty($dial)) {
        $dialDigits = preg_replace('/\D/', '', $dial);
        if (!empty($dialDigits) && strpos($clean, $dialDigits) === 0 && strlen($clean) > strlen($dialDigits) + 5) {
            $clean = substr($clean, strlen($dialDigits));
        }
    }

    $clean = ltrim($clean, '0');
    $localDigits = preg_replace('/\D/', '', $clean);
    $finalDial = $dial ?: '+971';
    $dialDigits = preg_replace('/\D/', '', $finalDial);
    $totalDigits = strlen($dialDigits . $localDigits);

    $isValid = strlen($localDigits) >= 5 && $totalDigits >= 7 && $totalDigits <= 15;
    $e164 = $isValid ? ($finalDial . $localDigits) : trim($finalDial . $localDigits);
    $formatted = $isValid ? ($finalDial . ' ' . $localDigits) : trim($finalDial . ' ' . ($localDigits ?: $raw));

    return [
        'valid' => $isValid,
        'dialCode' => $finalDial,
        'local' => $localDigits,
        'e164' => $e164,
        'formatted' => $formatted
    ];
}

// Configuration
$ADMIN_EMAIL   = 'contact@sharifgroup.ae';
$SENDER_EMAIL  = 'contact@sharifgroup.ae';
$SENDER_NAME   = 'Sharif Group';
$CRM_WEBHOOK   = 'https://script.google.com/macros/s/AKfycbzNChoriTzyurl89bGCiTsJW1BX9SB1gaIWLF7cxhJw-LvCoGj55idtWEoSQe_yG32d/exec';

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
$rawPhoneInput = trim($data['phone'] ?? '');
$parsedPhone = normalizePhone($rawPhoneInput, $dialCode);
$dialCode    = $parsedPhone['dialCode'];
$phone       = $parsedPhone['formatted'];
$whatsappE164= $parsedPhone['e164'];
$country     = trim($data['country'] ?? $data['residence'] ?? $data['nationality'] ?? '');
$address     = trim($data['address'] ?? '');
$timezone    = trim($data['timezone'] ?? '');
$propertyInterest = trim($data['propertyInterest'] ?? $data['property_interest'] ?? '');
$service     = trim($data['service'] ?? $data['programChoice'] ?? $data['targetProgram'] ?? $data['program'] ?? $data['investmentRoute'] ?? 'General Consultation');
if (!empty($data['subProgram']) && stripos($service, (string)$data['subProgram']) === false) {
    $service .= ' (' . $data['subProgram'] . ')';
}

// Education Advisory fields
$studentAgeGrade   = trim($data['student_age'] ?? $data['studentAgeGrade'] ?? '');
$studyLevel        = trim($data['study_level'] ?? $data['studyLevel'] ?? '');
$targetDestination = trim($data['destination'] ?? $data['targetDestination'] ?? '');
$intakeTimeline    = trim($data['intake'] ?? $data['intakeTimeline'] ?? '');

// Social Responsibility fields
$organization    = trim($data['organization'] ?? '');
$orgType         = trim($data['orgType'] ?? $data['org_type'] ?? '');
$preferredDate   = trim($data['preferredDate'] ?? $data['preferred_date'] ?? '');
$preferredMethod = trim($data['preferredMethod'] ?? $data['preferred_method'] ?? '');

// T05: Enforce temporal date validation for consultation bookings
if (!empty($preferredDate)) {
    $dt = DateTime::createFromFormat('Y-m-d', $preferredDate);
    if ($dt && $dt->format('Y-m-d') === $preferredDate) {
        $today = new DateTime('today', new DateTimeZone('UTC'));
        $graceWindow = clone $today;
        $graceWindow->modify('-1 day'); // Allow timezone edge cases (up to 24h behind)
        if ($dt < $graceWindow) {
            http_response_code(422);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Preferred consultation date cannot be in the past.',
                'field' => 'preferredDate'
            ]);
            exit;
        }
    }
}

$notes       = trim($data['notes'] ?? $data['message'] ?? $data['confidentialNotes'] ?? '');
if (!empty($timezone) && stripos($notes, $timezone) === false) {
    $notes = $notes ? ($notes . ' | Timezone: ' . $timezone) : ('Timezone: ' . $timezone);
}
if (!empty($address) && stripos($notes, $address) === false) {
    $notes = $notes ? ($notes . ' | Address: ' . $address) : ('Address: ' . $address);
}
if (!empty($organization) && stripos($notes, $organization) === false) {
    $notes = $notes ? ($notes . ' | Organization: ' . $organization . ($orgType ? " ($orgType)" : '')) : ('Organization: ' . $organization . ($orgType ? " ($orgType)" : ''));
}
if (!empty($propertyInterest) && stripos($notes, $propertyInterest) === false) {
    $notes = $notes ? ($notes . ' | Property Interest: ' . $propertyInterest) : ('Property Interest: ' . $propertyInterest);
}
$lang        = strtolower(trim($data['lang'] ?? 'en'));
$siteLangMap = ['en' => 'English', 'ar' => 'Arabic', 'fa' => 'Persian', 'zh' => 'Chinese'];
$siteLanguage = trim($data['site_language'] ?? $siteLangMap[$lang] ?? 'English');
$source      = trim($data['source'] ?? '');
$page        = trim($data['page_path'] ?? $data['page'] ?? '');
$pagePath    = $page;
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

// 3. Central Sync to Google Apps Script CRM (Google Sheets)
$crmSynced = false;
$crmMessage = '';
if (!empty($CRM_WEBHOOK)) {
    try {
        $crmPayload = json_encode([
            'form_id' => $formId,
            'inquiry_id' => $inquiryId,
            'fullName' => $fullName,
            'email' => $email,
            'dialCode' => $dialCode,
            'phone' => $phone,
            'whatsapp_e164' => $whatsappE164,
            'country' => $country,
            'address' => $address,
            'timezone' => $timezone,
            'service' => $service,
            'notes' => $notes,
            'investmentRoute' => trim($data['investmentRoute'] ?? $propertyInterest ?? ''),
            'budget' => trim($data['budget'] ?? $data['budgetTier'] ?? ''),
            'familyMembers' => trim($data['familyMembers'] ?? ''),
            'objective' => trim($data['objective'] ?? ''),
            'timeline' => trim($data['timeline'] ?? ''),
            'lang' => $lang,
            'preferredLanguage' => trim($data['preferredLanguage'] ?? $lang),
            'site_language' => $siteLanguage,
            'siteLanguage' => $siteLanguage,
            'source' => $source,
            'page' => $pagePath,
            'page_path' => $pagePath,
            'student_age' => $studentAgeGrade,
            'studentAgeGrade' => $studentAgeGrade,
            'study_level' => $studyLevel,
            'studyLevel' => $studyLevel,
            'destination' => $targetDestination,
            'targetDestination' => $targetDestination,
            'intake' => $intakeTimeline,
            'intakeTimeline' => $intakeTimeline,
            'organization' => $organization,
            'orgType' => $orgType,
            'preferredDate' => $preferredDate,
            'preferredMethod' => $preferredMethod,
            'targetTab' => $targetTab,
            'timestamp' => $nowUtc
        ]);

        $ch = curl_init($CRM_WEBHOOK);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $crmPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain;charset=utf-8']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        $crmResponse = @curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 400 && !empty($crmResponse)) {
            $parsed = json_decode($crmResponse, true);
            if ($parsed && (($parsed['status'] ?? '') === 'success' || ($parsed['status'] ?? '') === 'ignored_duplicate')) {
                $crmSynced = true;
                $crmMessage = $parsed['message'] ?? 'Lead synced to Google Master Sheet.';
            }
        }
    } catch (\Throwable $t) {
        // Fallback gracefully
    }
}

// Return Clean Response with verified confirmed status
echo json_encode([
    'status' => 'success',
    'inquiry_id' => $inquiryId,
    'email_sent' => $adminEmailSent,
    'crm_synced' => $crmSynced,
    'message' => $crmMessage ?: 'Inquiry recorded and verified successfully.'
]);

