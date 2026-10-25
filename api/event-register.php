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

// Honeypot check
if (!empty($data['company'])) {
    echo json_encode(['status' => 'success', 'message' => 'Spam detected']);
    exit;
}

// Configuration
$ADMIN_EMAIL   = 'mohammad@sharifgroup.ae';
$SENDER_EMAIL  = 'mohammad@sharifgroup.ae';
$SENDER_NAME   = 'Sharif Group';
$CRM_WEBHOOK   = 'https://script.google.com/macros/s/AKfycbwRFNqHPPeGo4UqWU7jkhMdJPCTNkirDhCEvBQjWc9YUFufe535vIl89vYyg4NiRhnt_Q/exec';

// Extract Form Fields
$fullName    = trim($data['fullName'] ?? $data['name'] ?? 'Valued Client');
$dialCode    = trim($data['dialCode'] ?? '');
$phone       = trim($data['phone'] ?? $data['whatsapp_e164'] ?? '');
$email       = trim(strtolower($data['email'] ?? ''));
$country     = trim($data['residence_country'] ?? $data['country'] ?? '');
$question    = trim($data['question'] ?? '');
$newsletter  = (!empty($data['newsletter_optin']) && $data['newsletter_optin'] === 'yes') ? 'Yes' : 'No';
$lang        = strtolower(trim($data['lang'] ?? 'en'));
$webinarId   = trim($data['webinar_id'] ?? 'WEB01');
$webinarSlug = trim($data['webinar_slug'] ?? 'dominica-second-passport-for-afghans');
$webinarTitle= trim($data['webinar_title'] ?? '');
$regId       = trim($data['registration_id'] ?? ('REG-' . $webinarId . '-' . strtoupper(substr(uniqid(), -6))));
$source      = trim($data['source'] ?? '');
$page        = trim($data['page'] ?? '/events/');
$nowUtc      = gmdate('Y-m-d H:i:s') . ' UTC';

$emailDispatched = false;
$emailError = null;

// 1. Dispatch Automated Confirmation Email to Attendee (if email provided)
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $subject = getEmailSubject($lang);
    $htmlBody = getEmailTemplate($fullName, $lang, $webinarTitle);
    
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
if (!empty($CRM_WEBHOOK)) {
    try {
        $crmPayload = json_encode([
            'form_id' => 'webinar-registration',
            'registration_id' => $regId,
            'webinar_id' => $webinarId,
            'webinar_slug' => $webinarSlug,
            'fullName' => $fullName,
            'dialCode' => $dialCode,
            'phone' => ($dialCode ? $dialCode . ' ' : '') . $phone,
            'whatsapp_e164' => $phone,
            'email' => $email,
            'residence_country' => $country,
            'question' => $question,
            'newsletter_optin' => ($newsletter === 'Yes') ? 'yes' : 'no',
            'lang' => $lang,
            'registered_at_utc' => gmdate('c'),
            'source' => $source,
            'page' => $page
        ]);

        $ch = curl_init($CRM_WEBHOOK);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $crmPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        @curl_exec($ch);
    } catch (\Throwable $t) {
        // CRM sync runs opportunistically
    }
}

// Return Clean Response
echo json_encode([
    'status' => 'success',
    'registration_id' => $regId,
    'email_sent' => $emailDispatched,
    'message' => 'Registration successfully recorded.' . ($emailDispatched ? ' Confirmation email dispatched.' : '')
]);
exit;

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
function getEmailTemplate($name, $lang, $webinarTitle = '') {
    $isRtl = in_array($lang, ['fa', 'ar']);
    $dir = $isRtl ? 'rtl' : 'ltr';
    $align = $isRtl ? 'right' : 'left';

    $heading = 'Your Event Registration is Confirmed';
    $greeting = 'Dear ' . htmlspecialchars($name) . ',';
    $bodyText = 'Thank you for registering for our exclusive online session. The direct link to join the session will be active on the event page and sent to your email / WhatsApp before the event begins.';
    $scheduleTitle = 'Session Details:';
    $scheduleInfo = '• Kabul Time: Thursday 29 October, 20:00<br/>• Dubai Time: Thursday 29 October, 19:30<br/>• Duration: 65 minutes (including live Q&A)';
    $noteText = 'Note: You can access the live session directly via any modern browser on mobile or desktop without installing additional software.';
    $btnText = 'Visit Event Page';
    $btnUrl = 'https://sharifgroup.ae/events/';

    if ($lang === 'fa') {
        $heading = 'ثبت‌نام شما با موفقیت تأیید شد';
        $greeting = 'سلام ' . htmlspecialchars($name) . ' گرامی،';
        $bodyText = 'از ثبت‌نام شما در وبینار تخصصی «پاسپورت دوم برای افغان‌ها: آشنایی با برنامه دومینیکا» سپاسگزاریم. لینک ورود به اتاق وبینار و یادآوری‌ها قبل از شروع جلسه برای شما ارسال خواهد شد.';
        $scheduleTitle = 'زمان برگزاری جلسه:';
        $scheduleInfo = '• به وقت کابل: پنجشنبه ۸ عقرب / ساعت ۲۰:۰۰<br/>• به وقت دبی: پنجشنبه ۲۹ اکتبر / ساعت ۱۹:۳۰<br/>• مدت زمان: ۶۵ دقیقه (همراه با پرسش و پاسخ زنده)';
        $noteText = 'نکته: ورود به وبینار مستقیماً از طریق مرورگر تلفن همراه یا کامپیوتر امکان‌پذیر است و نیاز به نصب هیچ‌گونه نرم‌افزاری ندارد.';
        $btnText = 'مشاهده صفحه رویداد';
        $btnUrl = 'https://sharifgroup.ae/fa/events/';
    } elseif ($lang === 'ar') {
        $heading = 'تم تأكيد تسجيلكم بنجاح';
        $greeting = 'عزيزنا ' . htmlspecialchars($name) . '،';
        $bodyText = 'نشكركم على التسجيل في فعاليتنا المباشرة. سيتم إرسال رابط الدخول المباشر والتذكيرات عبر البريد الإلكتروني والواتساب قبل موعد الجلسة.';
        $scheduleTitle = 'تفاصيل الجلسة:';
        $scheduleInfo = '• بتوقيت دبي: الخميس ۲۹ أكتوبر / الساعة ۱۹:۳۰<br/>• بتوقيت كابول: الخميس ۲۹ أكتوبر / الساعة ۲۰:۰۰<br/>• المدة: ۶۵ دقيقة (تشمل فقرة الأسئلة والأجوبة)';
        $noteText = 'ملاحظة: يمكنك الانضمام مباشرة من خلال متصفح هاتفك المحمول أو الكمبيوتر دون الحاجة إلى تثبيت أي برامج إضافية.';
        $btnText = 'عرض صفحة الفعاليات';
        $btnUrl = 'https://sharifgroup.ae/ar/events/';
    } elseif ($lang === 'zh') {
        $heading = '您的讲座报名已确认';
        $greeting = '尊敬的 ' . htmlspecialchars($name) . '，';
        $bodyText = '感谢您报名参加盛睿集团（Sharif Group）的专题线上讲座。直播间直达链接将在讲座开始前通过邮件与短信/WhatsApp发送至您的联系方式。';
        $scheduleTitle = '讲座安排：';
        $scheduleInfo = '• 迪拜时间：10月29日 星期四 19:30<br/>• 喀布尔时间：10月29日 星期四 20:00<br/>• 时长：65分钟（含现场问答环节）';
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
                Email: <a href="mailto:mohammad@sharifgroup.ae" style="color:#C5A880;text-decoration:none;">mohammad@sharifgroup.ae</a> • <a href="https://sharifgroup.ae" style="color:#C5A880;text-decoration:none;">sharifgroup.ae</a>
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
