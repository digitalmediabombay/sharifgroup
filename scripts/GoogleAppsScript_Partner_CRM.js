/**
 * ==============================================================================
 * Sharif Group — Official Partnership Application CRM (Google Apps Script)
 * ==============================================================================
 * 
 * Purpose:
 * Receives partner onboarding applications from /partners/ pages, stores them in
 * Google Sheets with automatic deduplication, sends multilingual branded HTML 
 * confirmation emails to applicants, and notifies the partnerships desk.
 * 
 * ------------------------------------------------------------------------------
 * STEP-BY-STEP SETUP & DEPLOYMENT INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.new) and name it:
 *    "Sharif Group — Partner Applications CRM"
 * 
 * 2. In Google Sheets, click:
 *    Extensions > Apps Script
 * 
 * 3. Delete any default code in Code.gs, paste this entire file, and click Save (💾).
 * 
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 *    - Click the gear icon next to "Select type" and choose: "Web app"
 *    - Description: "Sharif Group Partner CRM v1"
 *    - Execute as: "Me (<your-email>)"
 *    - Who has access: "Anyone"   <-- CRITICAL for public website forms
 * 
 * 5. Click "Deploy".
 *    - Review permissions if prompted and grant access to your Google account.
 * 
 * 6. Copy the resulting "Web app URL":
 *    Active Deployment URL:
 *    https://script.google.com/macros/s/AKfycbx866xd6P2fT7xqDJ1WGg10vSCXExEMnZylhrJHpMq0rCG0UotP23GIgbFEoK-0r7rQMA/exec
 *    Deployment ID:
 *    AKfycbx866xd6P2fT7xqDJ1WGg10vSCXExEMnZylhrJHpMq0rCG0UotP23GIgbFEoK-0r7rQMA
 * 
 * 7. Configured in:
 *    - assets/js/partners-app.js  (const CRM_WEBHOOK_URL = "...")
 *    - sharif-partners-demo/assets/js/partners-app.js (const CRM_WEBHOOK_URL = "...")
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  SHEET_NAME: "Partner_Applications",
  ADMIN_EMAIL: "mohammad@sharifgroup.ae",
  SENDER_NAME: "Sharif Group Partnerships",
  REPLY_TO_EMAIL: "mohammad@sharifgroup.ae",
  DEFAULT_SENDER: "Sharif Group <mohammad@sharifgroup.ae>",
  RESEND_API_URL: "https://api.resend.com/emails",
  // Uses built-in Google MailApp by default (no external API keys needed)
  PREFER_GOOGLE_MAIL: true
};

/**
 * Diagnostic GET endpoint
 * Test by opening the Web App URL directly in a browser
 */
function doGet(e) {
  var quota = -1;
  try {
    quota = MailApp.getRemainingDailyQuota();
  } catch (err) {
    quota = "Error: " + err.message;
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Sharif Group Partner CRM Webhook",
    timestamp: new Date().toISOString(),
    dailyEmailQuotaRemaining: quota,
    adminNotificationEmail: CONFIG.ADMIN_EMAIL,
    instructions: "POST JSON payload with form_id: 'partner-application'"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main POST endpoint - handles partner submissions with concurrency protection
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent submissions to prevent sheet collisions
    lock.waitLock(30000);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Server busy, please retry in a moment." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = {};

    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = (e && e.parameter) ? e.parameter : {};
    }

    var result = processPartnerApplication(data);
    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    if (lock) lock.releaseLock();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Process partner application, save to Google Sheet & trigger emails
 */
function processPartnerApplication(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // If sheet doesn't exist, create it with luxury branded header styling
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    var headers = [
      "Timestamp (UTC)",
      "Application ID",
      "Full Name",
      "Partner Type",
      "Company / Firm",
      "Job Title",
      "Country",
      "City",
      "Dial Code",
      "Phone (WhatsApp)",
      "Email Address",
      "Website / LinkedIn",
      "Programmes of Interest",
      "Est. Annual Referrals",
      "Heard From",
      "Confidential Message",
      "Language",
      "Source URL",
      "Status",
      "Applicant Confirmation Email"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#070E1A")
      .setFontColor("#C5A880");
    sheet.setFrozenRows(1);
  }

  var nowUtc = new Date().toISOString();
  var appId = data.application_id || ("PAR-" + Utilities.getUuid().slice(0, 6).toUpperCase());
  var fullName = data.fullName || data.name || "";
  var partnerType = data.partner_type || "";
  var company = data.company || "";
  var jobTitle = data.job_title || "";
  var country = data.country || "";
  var city = data.city || "";
  var dialCode = data.dialCode || "";
  var phone = data.whatsapp_e164 || data.phone || "";
  var email = (data.email || "").toLowerCase().trim();
  var website = data.website || "";
  var programmes = data.programmes || "";
  var referrals = data.referrals_per_year || "";
  var heardFrom = data.heard_from || "";
  var message = data.message || "";
  var lang = (data.lang || "en").toLowerCase();
  var source = data.source || "";

  // Duplicate Check by email
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var isDuplicate = false;
  var existingRowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    var rowEmail = String(values[i][10] || "").toLowerCase().trim();
    if (rowEmail && rowEmail === email) {
      isDuplicate = true;
      existingRowIndex = i + 1;
      break;
    }
  }

  var emailStatus = "Not Sent (No Email Provided)";

  // Send branded confirmation email to the applicant
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendPartnerConfirmationEmail(email, fullName, appId, company, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  if (isDuplicate) {
    // Record re-submission timestamp without overwriting primary application
    sheet.getRange(existingRowIndex, 19).setValue("Re-applied: " + nowUtc);
    sheet.getRange(existingRowIndex, 20).setValue(emailStatus);
    return {
      status: "success",
      duplicate: true,
      application_id: appId,
      message: "Application re-confirmed.",
      emailStatus: emailStatus
    };
  }

  // Append new clean row
  sheet.appendRow([
    nowUtc,
    appId,
    fullName,
    partnerType,
    company,
    jobTitle,
    country,
    city,
    dialCode,
    phone,
    email,
    website,
    programmes,
    referrals,
    heardFrom,
    message,
    lang,
    source,
    "Pending Review",
    emailStatus
  ]);

  // Dispatch instant admin alert to partnerships desk
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🤝 New Partner Application: " + fullName + (company ? " (" + company + ")" : ""),
      body: "New Partner Application Received:\n\n" +
            "• Application ID: " + appId + "\n" +
            "• Full Name: " + fullName + "\n" +
            "• Partner Type: " + partnerType + "\n" +
            "• Company / Firm: " + (company || "N/A") + "\n" +
            "• Job Title: " + (jobTitle || "N/A") + "\n" +
            "• Email: " + email + "\n" +
            "• Phone: " + phone + "\n" +
            "• Location: " + country + (city ? " / " + city : "") + "\n" +
            "• Website / LinkedIn: " + (website || "N/A") + "\n" +
            "• Target Programmes: " + (programmes || "All Programmes") + "\n" +
            "• Est. Annual Referrals: " + (referrals || "N/A") + "\n" +
            "• Heard From: " + (heardFrom || "N/A") + "\n" +
            "• Message: " + (message || "N/A") + "\n" +
            "• Language: " + lang + "\n" +
            "• Timestamp: " + nowUtc + "\n\n" +
            "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notification failed: " + adminErr.message);
  }

  return {
    status: "success",
    duplicate: false,
    application_id: appId,
    message: "Partner application submitted successfully.",
    emailStatus: emailStatus
  };
}

/**
 * Dispatch confirmation email to the applicant (Google Mail or optional Resend API)
 */
function sendPartnerConfirmationEmail(recipientEmail, recipientName, applicationId, company, lang) {
  var isFa = lang === "fa";
  var isAr = lang === "ar";
  var isZh = lang === "zh";

  var subject = "Sharif Group | Partnership Application Received (" + applicationId + ")";
  if (isFa) subject = "تاییدیه دریافت درخواست همکاری شریف گروپ (" + applicationId + ")";
  else if (isAr) subject = "تأكيد استلام طلب الشراكة - مجموعة شريف (" + applicationId + ")";
  else if (isZh) subject = "谢里夫集团 | 合作伙伴申请已确认 (" + applicationId + ")";

  var htmlContent = getPartnerEmailTemplate(recipientName, applicationId, company, lang);
  var plainText = (isFa)
    ? "سلام " + (recipientName || "همکار گرامی") + "،\n\nدرخواست همکاری شما با کد رهگیری " + applicationId + " با موفقیت دریافت شد. تیم روابط بین‌الملل شریف گروپ ظرف حداکثر ۲ روز کاری جهت بررسی مدارک و آغاز همکاری با شما تماس خواهد گرفت.\n\nشریف گروپ دبی\nmohammad@sharifgroup.ae"
    : (isAr)
    ? "مرحباً " + (recipientName || "شريكنا العزيز") + "،\n\nتم استلام طلب الشراكة بنجاح برقم مرجعي: " + applicationId + ". سيتواصل معك فريق علاقات الشركاء خلال يومي عمل لمناقشة التفاصيل وبدء التعاون.\n\nمجموعة شريف دبي\nmohammad@sharifgroup.ae"
    : (isZh)
    ? "尊敬的 " + (recipientName || "合作伙伴") + "：\n\n您的合作伙伴申请已成功送达，申请编号：" + applicationId + "。我们的战略合作团队将在2个工作日内与您联系，安排对接事宜。\n\n迪拜谢里夫集团\nmohammad@sharifgroup.ae"
    : "Dear " + (recipientName || "Valued Partner") + ",\n\nThank you for applying to become an official Sharif Group Partner. Your application reference is " + applicationId + ".\nOur Global Partnerships team will review your credentials and contact you within 2 business days to schedule an introductory onboarding call.\n\nSharif Group Dubai\nmohammad@sharifgroup.ae";

  var scriptProperties = PropertiesService.getScriptProperties();
  var resendApiKey = scriptProperties.getProperty("RESEND_API_KEY");
  var fromAddress = scriptProperties.getProperty("SENDER_EMAIL") || CONFIG.DEFAULT_SENDER;

  // 1. Primary: Use Google MailApp directly
  if (CONFIG.PREFER_GOOGLE_MAIL || !resendApiKey) {
    try {
      MailApp.sendEmail({
        to: recipientEmail,
        subject: subject,
        body: plainText,
        htmlBody: htmlContent,
        name: CONFIG.SENDER_NAME,
        replyTo: CONFIG.REPLY_TO_EMAIL
      });
      return "Sent via Google Mail (" + new Date().toISOString() + ")";
    } catch (gmailErr) {
      if (resendApiKey) {
        return sendViaResend(recipientEmail, subject, htmlContent, resendApiKey, fromAddress) + " (Google Mail failed: " + gmailErr.message + ")";
      }
      return "Google Mail Error: " + gmailErr.message;
    }
  }

  // 2. Secondary: Resend API if configured
  try {
    return sendViaResend(recipientEmail, subject, htmlContent, resendApiKey, fromAddress);
  } catch (err) {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: plainText,
      htmlBody: htmlContent,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.REPLY_TO_EMAIL
    });
    return "Sent via Google Mail (Fallback)";
  }
}

/**
 * Resend API integration (Optional)
 */
function sendViaResend(toEmail, subject, htmlBody, apiKey, fromEmail) {
  var payload = {
    from: fromEmail,
    to: [toEmail],
    subject: subject,
    html: htmlBody,
    reply_to: CONFIG.REPLY_TO_EMAIL
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(CONFIG.RESEND_API_URL, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();

  if (responseCode === 200 || responseCode === 201) {
    return "Sent via Resend API (" + new Date().toISOString() + ")";
  } else {
    throw new Error("Resend API failed (" + responseCode + "): " + responseText);
  }
}

/**
 * Multilingual Luxury Branded Partner HTML Email Template
 */
function getPartnerEmailTemplate(name, applicationId, company, lang) {
  var isFa = lang === "fa";
  var isAr = lang === "ar";
  var isZh = lang === "zh";
  var isRtl = isFa || isAr;

  var title = "Partnership Application Received";
  var greeting = "Dear " + (name || "Valued Partner") + ",";
  var intro = "Thank you for submitting your partnership application to Sharif Group Dubai. We are delighted by your interest in joining our global network of introducers, law firms, and advisory agencies.";
  var refLabel = "Application Reference";
  var nextTitle = "What Happens Next?";
  var step1 = "<strong>1. Compliance & Profile Review:</strong> Our partnerships desk reviews your firm credentials within 2 business days.";
  var step2 = "<strong>2. Strategic Onboarding Call:</strong> A dedicated Relationship Manager connects with you to discuss commission structures and referral protocols.";
  var step3 = "<strong>3. Agreement & Partner Kit:</strong> Formal B2B agreement execution and access to marketing collateral, co-branded decks, and private client processing pipelines.";
  var contactNote = "If you have any immediate questions, feel free to reply directly to this email or reach our partnerships desk via WhatsApp.";

  if (isFa) {
    title = "درخواست همکاری شما دریافت شد";
    greeting = "سلام " + (name || "همکار گرامی") + "،";
    intro = "از ارسال درخواست همکاری شما با شریف گروپ دبی صمیمانه سپاسگزاریم. ما از پیوستن آژانس‌ها و معرف‌های معتبر به شبکه جهانی خود بسیار خرسندیم.";
    refLabel = "کد پیگیری درخواست";
    nextTitle = "مراحل بعدی چیست؟";
    step1 = "<strong>۱. بررسی مدارک و انطباق:</strong> تیم ارزیابی بین‌الملل حداکثر ظرف ۲ روز کاری پروفایل کاری شما را بررسی می‌کند.";
    step2 = "<strong>۲. جلسه معارفه و تعیین شرایط:</strong> مدیر روابط اختصاصی شما جهت هماهنگی ساختار کمیسیون‌ها و رویه‌های معرفی با شما تماس خواهد گرفت.";
    step3 = "<strong>۳. عقد قرارداد و اعطای ابزارها:</strong> امضای تفاهم‌نامه رسمی همکاری و ارائه پکیج مارکتینگ، بروشورهای اختصاصی و کانال پردازش سریع پرونده‌ها.";
    contactNote = "در صورت نیاز به ارتباط فوری، می‌توانید مستقیماً به این ایمیل پاسخ داده یا از طریق واتس‌اپ با بخش همکاران در تماس باشید.";
  } else if (isAr) {
    title = "تم استلام طلب الشراكة بنجاح";
    greeting = "عزيزنا " + (name || "الشريك المحترم") + "،";
    intro = "نشكرك على تقديم طلب الانضمام إلى شبكة شركاء مجموعة شريف في دبي. يسعدنا توسيع آفاق التعاون المشترك في مجال الجنسية والإقامة عبر الاستثمار.";
    refLabel = "رقم الطلب المرجعي";
    nextTitle = "الخطوات التالية:";
    step1 = "<strong>١. التدقيق والامتثال:</strong> يقوم فريق الشراكات بمراجعة بياناتكم خلال يومي عمل.";
    step2 = "<strong>٢. جلسة التعارف وتحديد العمولات:</strong> يتواصل معكم مدير حسابات مخصص لمناقشة نماذج العمولات وآليات الإحالة.";
    step3 = "<strong>٣. توقيع الاتفاقية وحزمة الشريك:</strong> إبرام عقد الشراكة وتسليم المواد الترويجية وقنوات التقدیم السريعة.";
    contactNote = "إذا كانت لديكم أية استفسارات عاجلة، يمكنكم الرد مباشرة على هذا البريد أو التواصل عبر الواتساب.";
  } else if (isZh) {
    title = "合作伙伴申请已确认送达";
    greeting = "尊敬的 " + (name || "合作伙伴") + "：";
    intro = "非常感谢您申请成为迪拜谢里夫集团官方合作伙伴。我们非常期待与具有远见的专业机构携手，共同拓展全球第二身份与海外资产配置市场。";
    refLabel = "申请专属识别码";
    nextTitle = "后续流程安排：";
    step1 = "<strong>1. 合规与资质审核：</strong> 我们的战略合作团队将在2个工作日内审阅您的机构背景。";
    step2 = "<strong>2. 专属对接沟通：</strong> 专属渠道总监将与您联络，确定佣金分成模式与引流对接协议。";
    step3 = "<strong>3. 签署B2B协议与材料发放：</strong> 正式缔结合作协议，并开通私银级客户极速递件专属通道与全套宣传物料。";
    contactNote = "如您有任何紧急事项，欢迎直接回复此邮件，或通过官方微信/WhatsApp与我们联络。";
  }

  var dirAttr = isRtl ? "dir=\"rtl\"" : "dir=\"ltr\"";
  var textAlign = isRtl ? "right" : "left";

  return '<!DOCTYPE html>' +
    '<html lang="' + lang + '" ' + dirAttr + '>' +
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + title + '</title>' +
    '</head>' +
    '<body style="margin:0;padding:0;background-color:#070E1A;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#EAEFF8;line-height:1.6;">' +
    '  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#070E1A;padding:40px 15px;">' +
    '    <tr><td align="center">' +
    '      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#0C172B;border-radius:12px;border:1px solid #1E2D4A;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.5);">' +
    '        <tr>' +
    '          <td style="background:#070E1A;padding:30px 40px;text-align:center;border-bottom:1px solid #C5A880;">' +
    '            <h1 style="margin:0;font-size:22px;letter-spacing:3px;color:#C5A880;font-weight:700;text-transform:uppercase;">SHARIF GROUP</h1>' +
    '            <p style="margin:6px 0 0 0;font-size:11px;color:#8B9BB4;letter-spacing:2px;text-transform:uppercase;">Global Citizenship & Residency • Dubai</p>' +
    '          </td>' +
    '        </tr>' +
    '        <tr>' +
    '          <td style="padding:40px;text-align:' + textAlign + ';">' +
    '            <h2 style="margin:0 0 16px 0;font-size:20px;color:#FFFFFF;font-weight:600;">' + title + '</h2>' +
    '            <p style="margin:0 0 14px 0;font-size:15px;color:#C4D1E5;">' + greeting + '</p>' +
    '            <p style="margin:0 0 24px 0;font-size:14px;color:#9FB0C9;line-height:1.7;">' + intro + '</p>' +
    '            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#070E1A;border:1px solid #1E2D4A;border-radius:8px;margin-bottom:28px;">' +
    '              <tr>' +
    '                <td style="padding:16px 20px;">' +
    '                  <span style="display:block;font-size:11px;color:#8B9BB4;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">' + refLabel + '</span>' +
    '                  <span style="font-size:18px;font-weight:700;color:#C5A880;letter-spacing:1.5px;font-family:Courier,monospace;">' + applicationId + '</span>' +
    (company ? '<div style="margin-top:8px;font-size:13px;color:#CBD5E1;">🏢 ' + company + '</div>' : '') +
    '                </td>' +
    '              </tr>' +
    '            </table>' +
    '            <h3 style="margin:0 0 14px 0;font-size:15px;color:#EAEFF8;font-weight:600;border-bottom:1px solid #1E2D4A;padding-bottom:8px;">' + nextTitle + '</h3>' +
    '            <p style="margin:0 0 10px 0;font-size:13px;color:#A9B9D1;">' + step1 + '</p>' +
    '            <p style="margin:0 0 10px 0;font-size:13px;color:#A9B9D1;">' + step2 + '</p>' +
    '            <p style="margin:0 0 20px 0;font-size:13px;color:#A9B9D1;">' + step3 + '</p>' +
    '            <p style="margin:0 0 24px 0;font-size:13px;color:#8B9BB4;line-height:1.6;">' + contactNote + '</p>' +
    '            <table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">' +
    '              <tr>' +
    '                <td style="background-color:#C5A880;border-radius:6px;padding:12px 24px;text-align:center;">' +
    '                  <a href="mailto:mohammad@sharifgroup.ae" style="color:#070E1A;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.5px;display:inline-block;">Contact Partnerships Desk</a>' +
    '                </td>' +
    '              </tr>' +
    '            </table>' +
    '          </td>' +
    '        </tr>' +
    '        <tr>' +
    '          <td style="background-color:#050912;padding:24px 40px;text-align:center;border-top:1px solid #142036;">' +
    '            <p style="margin:0 0 6px 0;font-size:11px;color:#61718A;">Sharif Group • Conrad Dubai, Sheikh Zayed Road, Dubai, UAE</p>' +
    '            <p style="margin:0;font-size:11px;color:#4B586E;">Confidential &amp; Proprietary • Global Citizenship &amp; Residency Advisory</p>' +
    '          </td>' +
    '        </tr>' +
    '      </table>' +
    '    </td></tr>' +
    '  </table>' +
    '</body>' +
    '</html>';
}
