<?php
/**
 * ==============================================================================
 * Sharif Group - Event Registration & Direct Email Dispatcher API
 * ==============================================================================
 * Handles registrations from /events/, dispatches instant branded confirmation
 * emails directly via server mailer (SPF/DKIM authenticated @sharifgroup.ae),
 * alerts the admin, syncs to Google Sheets CRM, and logs locally.
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

// Honeypot check (hidden spam traps - B4)
if (!empty($data['company']) || !empty($data['website']) || !empty($data['hp_url']) || !empty($data['hp_check'])) {
    echo json_encode(['status' => 'success', 'message' => 'Registration received.']);
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
    } else {
        // PRESERVE SELECTED CODE: Only strip if user retyped the selected country's own dial digits!
        if (!empty($dial)) {
            $dialDigits = preg_replace('/\D/', '', $dial);
            if (!empty($dialDigits) && strpos($clean, $dialDigits) === 0 && strlen($clean) > strlen($dialDigits) + 5) {
                $clean = substr($clean, strlen($dialDigits));
            }
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
$fullName    = trim($data['fullName'] ?? $data['name'] ?? 'Valued Client');
$dialCode    = trim($data['dialCode'] ?? '');
$rawPhoneInput = trim($data['phone'] ?? $data['whatsapp_e164'] ?? '');
$parsedPhone = normalizePhone($rawPhoneInput, $dialCode);
$dialCode    = $parsedPhone['dialCode'];
$phone       = $parsedPhone['formatted'];
$whatsappE164= $parsedPhone['e164'];
$email       = trim(strtolower($data['email'] ?? ''));
$country     = trim($data['residence_country'] ?? $data['country'] ?? '');
$question    = trim($data['question'] ?? '');
$newsletter  = (!empty($data['newsletter_optin']) && $data['newsletter_optin'] === 'yes') ? 'Yes' : 'No';
$lang        = strtolower(trim($data['lang'] ?? 'en'));
$webinarId   = trim($data['webinar_id'] ?? 'WEB01');
$webinarSlug = trim($data['webinar_slug'] ?? $data['slug'] ?? 'dominica-second-passport-for-afghans');
$webinarTitle= trim($data['webinar_title'] ?? '');
$regId       = trim($data['registration_id'] ?? ('REG-' . $webinarId . '-' . strtoupper(substr(uniqid(), -6))));
$source      = trim($data['source'] ?? '');
$page        = trim($data['page'] ?? $data['page_path'] ?? '/events/');
$siteLanguage= trim($data['site_language'] ?? '');
if (empty($siteLanguage)) {
    switch ($lang) {
        case 'fa': $siteLanguage = 'Persian'; break;
        case 'ar': $siteLanguage = 'Arabic'; break;
        case 'zh': $siteLanguage = 'Chinese'; break;
        default:   $siteLanguage = 'English'; break;
    }
}
$startUtc    = trim($data['start_utc'] ?? '');
$durationMin = max(15, (int)($data['duration_min'] ?? 65));
$nowUtc      = gmdate('Y-m-d H:i:s') . ' UTC';

$emailDispatched = false;
$emailError = null;

// 1. Dispatch Automated Confirmation Email to Attendee (if email provided)
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $subject = getEmailSubject($lang);
    $emailSchedule = formatEmailSchedule($startUtc, $durationMin, $lang);
    $htmlBody = getEmailTemplate($fullName, $lang, $webinarTitle, $emailSchedule['info']);
    
    // Headers for maximum deliverability and anti-spam compliance
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode($SENDER_NAME), $SENDER_EMAIL);
    $headers[] = 'Reply-To: ' . $SENDER_EMAIL;
    $headers[] = 'X-Mailer: PHP/' . phpversion();
    $headers[] = 'X-SharifGroup-Event: ' . $webinarId;

    $headerStr = implode("\r\n", $headers);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    // Dispatch via server mailer
    $sent = @mail($email, $encodedSubject, $htmlBody, $headerStr, "-f" . $SENDER_EMAIL);
    if ($sent) {
        $emailDispatched = true;
    } else {
        $emailError = 'Native mailer returned false';
    }
}

// 2. Dispatch Admin Notification Alert to Mohammad
if (!empty($ADMIN_EMAIL)) {
    $adminSubject = '=?UTF-8?B?' . base64_encode("🔔 New Event Registration: " . $fullName) . '?=';
    $adminBody = "New Event Registration Received:\n\n"
        . "• Registration ID: " . $regId . "\n"
        . "• Full Name: " . $fullName . "\n"
        . "• Email: " . ($email ?: 'Not provided') . "\n"
        . "• Phone: " . ($dialCode ? $dialCode . ' ' : '') . $phone . "\n"
        . "• Country: " . $country . "\n"
        . "• Event ID: " . $webinarId . "\n"
        . "• Questions/Notes: " . ($question ?: 'None') . "\n"
        . "• Language: " . strtoupper($lang) . "\n"
        . "• Newsletter Opt-in: " . $newsletter . "\n"
        . "• Confirmation Email Sent: " . ($emailDispatched ? 'YES' : 'NO (' . ($email ? ($emailError ?: 'Failed') : 'No Email') . ')') . "\n"
        . "• Timestamp: " . $nowUtc . "\n"
        . "• Source Page: " . $page . "\n";

    $adminHeaders = "From: " . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode('Sharif Group CRM'), $SENDER_EMAIL) . "\r\n"
        . "Reply-To: " . ($email ?: $SENDER_EMAIL) . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "X-Mailer: PHP/" . phpversion();

    @mail($ADMIN_EMAIL, $adminSubject, $adminBody, $adminHeaders, "-f" . $SENDER_EMAIL);
}

// 3. Local JSON Backup (Never lose any lead)
try {
    $logDir = dirname(__DIR__) . '/data';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/event_registrations.json';
    $entry = [
        'registration_id' => $regId,
        'timestamp' => $nowUtc,
        'fullName' => $fullName,
        'dialCode' => $dialCode,
        'phone' => $phone,
        'email' => $email,
        'country' => $country,
        'question' => $question,
        'newsletter' => $newsletter,
        'lang' => $lang,
        'webinar_id' => $webinarId,
        'email_dispatched' => $emailDispatched,
        'source' => $source,
        'page' => $page
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

// 4. Background Sync to Google Apps Script CRM (Google Sheets)
// T40: Authoritative server-owned sync contract. Server performs sync to Google Apps Script
// CRM unless an acknowledged completion is already attested by an upstream trusted gateway.
$crmSynced = false;
$alreadySynced = !empty($data['crm_synced']) && ($data['crm_synced'] === true || $data['crm_synced'] === 'true');

if (!empty($CRM_WEBHOOK) && !$alreadySynced) {
    try {
        $crmPayload = json_encode([
            'form_id' => 'webinar-registration',
            'registration_id' => $regId,
            'webinar_id' => $webinarId,
            'webinar_slug' => $webinarSlug,
            'fullName' => $fullName,
            'dialCode' => $dialCode,
            'phone' => $phone,
            'whatsapp_e164' => $whatsappE164,
            'email' => $email,
            'residence_country' => $country,
            'question' => $question,
            'newsletter_optin' => ($newsletter === 'Yes') ? 'yes' : 'no',
            'lang' => $lang,
            'site_language' => $siteLanguage,
            'page_path' => $page,
            'registered_at_utc' => gmdate('c'),
            'source' => $source,
            'page' => $page,
            'start_utc'   => $startUtc,
            'duration_min' => $durationMin,
        ]);

        $ch = curl_init($CRM_WEBHOOK);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $crmPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($res !== false && $httpCode >= 200 && $httpCode < 400) {
            $crmSynced = true;
        }
        curl_close($ch);
    } catch (\Throwable $t) {
        // CRM sync error caught
    }
}

// Return Clean Response
echo json_encode([
    'status' => 'success',
    'registration_id' => $regId,
    'crm_synced' => $crmSynced,
    'email_sent' => $emailDispatched,
    'message' => 'Registration successfully recorded.' . ($emailDispatched ? ' Confirmation email dispatched.' : '')
]);
exit;

// ── Dynamic Schedule Formatter ────────────────────────────────────────────────
function formatEmailSchedule($startUtc, $durationMin, $lang) {
    $durationMin = max(15, (int)$durationMin);
    if (empty($startUtc)) {
        return ['info' => ''];
    }
    try {
        $dt = new DateTime($startUtc, new DateTimeZone('UTC'));
    } catch (Exception $e) {
        return ['info' => ''];
    }
    $dtKabul = clone $dt; $dtKabul->modify('+270 minutes'); // UTC+4:30
    $dtDubai = clone $dt; $dtDubai->modify('+240 minutes'); // UTC+4:00
    $dayEn    = $dt->format('l');
    $kabulTime = $dtKabul->format('H:i');
    $dubaiTime = $dtDubai->format('H:i');
    $kabulDate = $dtKabul->format('j F Y');
    $dubaiDate = $dtDubai->format('j F Y');
    $dayNames = [
        'fa' => ['Sunday'=>'یک‌شنبه','Monday'=>'دوشنبه','Tuesday'=>'سه‌شنبه','Wednesday'=>'چهارشنبه','Thursday'=>'پنج‌شنبه','Friday'=>'جمعه','Saturday'=>'شنبه'],
        'ar' => ['Sunday'=>'الأحد','Monday'=>'الإثنين','Tuesday'=>'الثلاثاء','Wednesday'=>'الأربعاء','Thursday'=>'الخميس','Friday'=>'الجمعة','Saturday'=>'السبت'],
    ];
    switch ($lang) {
        case 'fa':
            $dayLabel = $dayNames['fa'][$dayEn] ?? $dayEn;
            return ['info' => "• به وقت کابل: {$dayLabel} {$kabulDate} / ساعت {$kabulTime}<br/>• به وقت دبی: {$dayLabel} {$dubaiDate} / ساعت {$dubaiTime}<br/>• مدت زمان: {$durationMin} دقیقه (همراه با پرسش و پاسخ زنده)"];
        case 'ar':
            $dayLabel = $dayNames['ar'][$dayEn] ?? $dayEn;
            return ['info' => "• بتوقيت كابول: {$dayLabel} {$kabulDate} / {$kabulTime}<br/>• بتوقيت دبي: {$dayLabel} {$dubaiDate} / {$dubaiTime}<br/>• المدة: {$durationMin} دقيقة (تشمل الأسئلة والأجوبة)"];
        case 'zh':
            return ['info' => "• 喀布尔时间：{$kabulDate} {$kabulTime}<br/>• 迪拜时间：{$dubaiDate} {$dubaiTime}<br/>• 时长：{$durationMin}分钟（含现场问答环节）"];
        default:
            return ['info' => "• Kabul Time: {$kabulDate} {$kabulTime}<br/>• Dubai Time: {$dubaiDate} {$dubaiTime}<br/>• Duration: {$durationMin} minutes (including live Q&amp;A)"];
    }
}

// ── Email Subject Helper ──────────────────────────────────────────────────────
function getEmailSubject($lang) {
    switch ($lang) {
        case 'fa':
            return 'تاییدیه ثبت‌نام وبینار تخصصی شریف گروپ | Sharif Group';
        case 'ar':
            return 'تأكيد التسجيل في فعالية شريف جروب | Sharif Group';
        case 'zh':
            return '盛睿集团讲座报名确认函 | Sharif Group Event Confirmation';
        default:
            return 'Sharif Group Event Registration Confirmed | تاییدیه ثبت‌نام رویداد';
    }
}

// ── Multilingual Email HTML Template Helper ───────────────────────────────────
function getEmailTemplate($name, $lang, $webinarTitle = '', $scheduleInfoDynamic = '') {
    $isRtl = in_array($lang, ['fa', 'ar']);
    $dir = $isRtl ? 'rtl' : 'ltr';
    $align = $isRtl ? 'right' : 'left';

    $heading = 'Your Event Registration is Confirmed';
    $greeting = 'Dear ' . htmlspecialchars($name) . ',';
    $bodyText = 'Thank you for registering for our exclusive online session. The direct link to join the session will be active on the event page and sent to your email / WhatsApp before the event begins.';
    $scheduleTitle = 'Session Details:';
    $scheduleInfo = !empty($scheduleInfoDynamic) ? $scheduleInfoDynamic
        : '• Kabul Time: Thursday 29 October, 20:00<br/>• Dubai Time: Thursday 29 October, 19:30<br/>• Duration: 65 minutes (including live Q&amp;A)';
    $noteText = 'Note: You can access the live session directly via any modern browser on mobile or desktop without installing additional software.';
    $btnText = 'Visit Event Page';
    $btnUrl = 'https://sharifgroup.ae/events/';

    if ($lang === 'fa') {
        $heading = 'ثبت‌نام شما با موفقیت تأیید شد';
        $greeting = 'سلام ' . htmlspecialchars($name) . ' گرامی،';
        $bodyText = 'از ثبت‌نام شما در این وبینار تخصصی سپاسگزاریم. لینک ورود به اتاق وبینار و یادآوری‌ها قبل از شروع جلسه برای شما ارسال خواهد شد.';
        $scheduleTitle = 'زمان برگزاری جلسه:';
        $scheduleInfo = !empty($scheduleInfoDynamic) ? $scheduleInfoDynamic
            : '• به وقت کابل: پنجشنبه ۸ عقرب / ساعت ۲۰:۰۰<br/>• به وقت دبی: پنجشنبه ۲۹ اکتبر / ساعت ۱۹:۳۰<br/>• مدت زمان: ۶۵ دقیقه (همراه با پرسش و پاسخ زنده)';
        $noteText = 'نکته: ورود به وبینار مستقیماً از طریق مرورگر تلفن همراه یا کامپیوتر امکان‌پذیر است و نیاز به نصب هیچ‌گونه نرم‌افزاری ندارد.';
        $btnText = 'مشاهده صفحه رویداد';
        $btnUrl = 'https://sharifgroup.ae/fa/events/';
    } elseif ($lang === 'ar') {
        $heading = 'تم تأكيد تسجيلكم بنجاح';
        $greeting = 'عزيزنا ' . htmlspecialchars($name) . '،';
        $bodyText = 'نشكركم على التسجيل في فعاليتنا المباشرة. سيتم إرسال رابط الدخول المباشر والتذكيرات عبر البريد الإلكتروني والواتساب قبل موعد الجلسة.';
        $scheduleTitle = 'تفاصيل الجلسة:';
        $scheduleInfo = !empty($scheduleInfoDynamic) ? $scheduleInfoDynamic
            : '• بتوقيت دبي: الخميس ۲۹ أكتوبر / الساعة ۱۹:۳۰<br/>• بتوقيت كابول: الخميس ۲۹ أكتوبر / الساعة ۲۰:۰۰<br/>• المدة: ۶۵ دقيقة (تشمل فقرة الأسئلة والأجوبة)';
        $noteText = 'ملاحظة: يمكنك الانضمام مباشرة من خلال متصفح هاتفك المحمول أو الكمبيوتر دون الحاجة إلى تثبيت أي برامج إضافية.';
        $btnText = 'عرض صفحة الفعاليات';
        $btnUrl = 'https://sharifgroup.ae/ar/events/';
    } elseif ($lang === 'zh') {
        $heading = '您的讲座报名已确认';
        $greeting = '尊敬的 ' . htmlspecialchars($name) . '，';
        $bodyText = '感谢您报名参加盛睿集团（Sharif Group）的专题线上讲座。直播间直达链接将在讲座开始前通过邮件与短信/WhatsApp发送至您的联系方式。';
        $scheduleTitle = '讲座安排：';
        $scheduleInfo = !empty($scheduleInfoDynamic) ? $scheduleInfoDynamic
            : '• 迪拜时间：10月29日 星期四 19:30<br/>• 喀布尔时间：10月29日 星期四 20:00<br/>• 时长：65分钟（含现场问答环节）';
        $noteText = '提示：您可直接使用手机或电脑浏览器进入直播，无需额外下载安装任何第三方软件。';
        $btnText = '访问讲座页面';
        $btnUrl = 'https://sharifgroup.ae/zh/events/';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="{$lang}" dir="{$dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$heading}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #E5E0D8;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#070E1A;padding:32px 24px;text-align:center;">
              <span style="font-size:22px;font-weight:700;letter-spacing:0.18em;color:#C5A880;text-transform:uppercase;font-family:Georgia,serif;">SHARIF GROUP</span>
              <div style="font-size:11px;color:#94A3B8;letter-spacing:0.12em;margin-top:4px;text-transform:uppercase;">Private Advisory & Citizenship</div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;direction:{$dir};text-align:{$align};">
              <h1 style="color:#070E1A;font-size:22px;font-weight:700;margin:0 0 16px 0;line-height:1.4;">{$heading}</h1>
              <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px 0;">{$greeting}</p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px 0;">{$bodyText}</p>
              
              <!-- Session Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF6EE;border-radius:12px;border:1px solid #E5E0D8;margin:24px 0;">
                <tr>
                  <td style="padding:20px;direction:{$dir};text-align:{$align};">
                    <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#786142;">{$scheduleTitle}</p>
                    <p style="margin:0;font-size:14px;color:#334155;line-height:1.8;">{$scheduleInfo}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#64748B;line-height:1.6;margin:20px 0 28px 0;">{$noteText}</p>

              <!-- Action Button -->
              <div style="text-align:center;margin:32px 0 16px 0;">
                <a href="{$btnUrl}" target="_blank" style="display:inline-block;background:#C5A880;color:#070E1A;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;text-decoration:none;box-shadow:0 2px 8px rgba(197,168,128,0.3);">{$btnText}</a>
              </div>

              <!-- Footer info -->
              <div style="margin-top:36px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#94A3B8;line-height:1.6;">
                <strong>Sharif Group Dubai</strong> • 116 The Binary Tower, Business Bay, Dubai, UAE<br/>
                Tel: +971 4 357 8737 • WhatsApp: +971 4 357 8737<br/>
                Email: <a href="mailto:contact@sharifgroup.ae" style="color:#C5A880;text-decoration:none;">contact@sharifgroup.ae</a> • <a href="https://sharifgroup.ae" style="color:#C5A880;text-decoration:none;">sharifgroup.ae</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}
