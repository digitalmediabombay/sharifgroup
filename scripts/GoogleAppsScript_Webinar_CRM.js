/**
 * ==============================================================================
 * Sharif Group — Unified Webhook & Webinar Registration CRM (Google Apps Script)
 * ==============================================================================
 * Instructions:
 * 1. Open your Google Spreadsheet (e.g. "Sharif Group CRM 2026").
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all existing code with this script.
 * 4. Google Mail (MailApp) handles confirmation emails automatically out-of-the-box
 *    using your Google account. No external API keys or domain verifications required!
 * 5. (Optional) If you ever want to use Resend API, add Script Properties:
 *    - RESEND_API_KEY : Your Resend API key (e.g. re_xxxxxxxxx)
 *    - SENDER_EMAIL   : webinars@sharifgroup.ae
 * 6. Click "Deploy" > "Manage Deployments" > "New Deployment" > Web App.
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Copy the Web App URL and set CRM_WEBHOOK_URL in assets/js/webinars-app.js.
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  WEBINAR_SHEET_NAME: "Webinar_Registrations",
  PARTNER_SHEET_NAME: "Partner_Applications",
  LEADS_SHEET_NAME: "Inquiries",
  ADMIN_EMAIL: "mohammad@sharifgroup.ae",
  SENDER_NAME: "Sharif Group",
  REPLY_TO_EMAIL: "mohammad@sharifgroup.ae",
  DEFAULT_SENDER: "Sharif Group <mohammad@sharifgroup.ae>",
  RESEND_API_URL: "https://api.resend.com/emails",
  // Default to Google Mail (MailApp) as requested by client
  PREFER_GOOGLE_MAIL: true
};

/**
 * Diagnostic GET endpoint
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
    service: "Sharif Group Unified CRM",
    timestamp: new Date().toISOString(),
    dailyEmailQuotaRemaining: quota,
    adminEmail: CONFIG.ADMIN_EMAIL,
    instructions: "POST json with form_id: 'webinar-registration', 'partner-application', or standard leads."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle incoming POST requests from website forms
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent requests
    lock.waitLock(30000);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Server busy, try again" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e.postData.contents;
    var data = {};

    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      // Fallback if form-encoded
      data = e.parameter || {};
    }

    var formId = data.form_id || (data.webinar_id ? "webinar-registration" : "contact");

    if (formId === "webinar-registration") {
      var result = handleWebinarRegistration(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (formId === "partner-application") {
      var partnerResult = handlePartnerApplication(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(partnerResult))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Standard lead from contact or program forms
      var leadResult = handleStandardLead(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(leadResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    if (lock) lock.releaseLock();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle Webinar Registrations with Deduplication & Google Mail Confirmation
 */
function handleWebinarRegistration(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.WEBINAR_SHEET_NAME);

  // If sheet doesn't exist, create it with formatted headers
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.WEBINAR_SHEET_NAME);
    var headers = [
      "Timestamp (UTC)",
      "Webinar ID",
      "Webinar Slug",
      "Full Name",
      "Dial Code",
      "Phone Number",
      "Email Address",
      "Country of Residence",
      "Questions / Notes",
      "Newsletter Opt-In",
      "Language",
      "Source URL",
      "Page Path",
      "Status",
      "Email Dispatch Status"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#070E1A")
      .setFontColor("#C5A880");
    sheet.setFrozenRows(1);
  }

  var nowUtc = new Date().toISOString();
  var webinarId = data.webinar_id || "WEB01";
  var webinarSlug = data.slug || "";
  var fullName = data.fullName || data.name || "";
  var dialCode = data.dialCode || "";
  var rawPhone = data.whatsapp_e164 || data.phone || "";
  var email = data.email || "";
  var residence = data.residence_country || data.country || "";
  var question = data.question || "";
  var newsletter = data.newsletter_optin ? "Yes" : "No";
  var lang = data.lang || "fa";
  var source = data.source || "";
  var page = data.page || "";

  // Check for duplicate registrations by (webinar_id + phone)
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var isDuplicate = false;
  var existingRowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    var rowWebinarId = String(values[i][1] || "").trim();
    var rowPhone = String(values[i][5] || "").replace(/[^\d+]/g, "").trim();
    if (rowWebinarId === webinarId && rowPhone === rawPhone) {
      isDuplicate = true;
      existingRowIndex = i + 1;
      break;
    }
  }

  var emailStatus = "Not Sent (No Email Provided)";

  // Send automatic confirmation email via Google Mail (or Resend fallback)
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendConfirmationEmail(email, fullName, webinarId, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  if (isDuplicate) {
    // Note duplicate timestamp in existing row without adding spam entry
    sheet.getRange(existingRowIndex, 14).setValue("Duplicate Re-registration: " + nowUtc);
    if (email) sheet.getRange(existingRowIndex, 7).setValue(email);
    sheet.getRange(existingRowIndex, 15).setValue(emailStatus);
    return { status: "success", duplicate: true, message: "Existing registration confirmed.", emailStatus: emailStatus };
  }

  // Append new clean row
  sheet.appendRow([
    nowUtc,
    webinarId,
    webinarSlug,
    fullName,
    dialCode,
    rawPhone,
    email,
    residence,
    question,
    newsletter,
    lang,
    source,
    page,
    "Registered",
    emailStatus
  ]);

  // Dispatch instant admin notification alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🔔 New Webinar Registration: " + fullName,
      body: "New Webinar Registration Received:\n\n" +
            "• Name: " + fullName + "\n" +
            "• Email: " + email + "\n" +
            "• Phone: " + ((dialCode ? dialCode + " " : "") + rawPhone).trim() + "\n" +
            "• Country: " + residence + "\n" +
            "• Webinar Session: " + webinarId + "\n" +
            "• Language: " + lang + "\n" +
            "• Timestamp: " + new Date().toISOString() + "\n" +
            "• Page: " + page + "\n\n" +
            "View registrations in Google Sheet: " + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notify error: " + adminErr.message);
  }

  return { status: "success", duplicate: false, message: "Registration recorded successfully.", emailStatus: emailStatus };
}

/**
 * Handle Standard Contact & Eligibility Leads
 */
function handleStandardLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.LEADS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.LEADS_SHEET_NAME);
    var headers = ["Timestamp", "Full Name", "Email", "Phone", "Country", "Program/Service", "Notes", "Source URL", "Form ID"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F1F5F9");
    sheet.setFrozenRows(1);
  }

  var leadName = data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim();
  var leadEmail = data.email || "";
  var leadPhone = data.phone || "";
  var leadService = data.service || data.program || data.programChoice || "";
  var leadCountry = data.country || data.citizenship || "";
  var leadNotes = data.notes || data.message || data.confidentialNotes || "";

  sheet.appendRow([
    new Date().toISOString(),
    leadName,
    leadEmail,
    leadPhone,
    leadCountry,
    leadService,
    leadNotes,
    data.source || "",
    data.form_id || "general"
  ]);

  // Dispatch instant admin alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "⚡ New Website Inquiry: " + leadName + " (" + (leadService || "General") + ")",
      body: "New Website Lead Received:\n\n" +
            "• Name: " + leadName + "\n" +
            "• Email: " + leadEmail + "\n" +
            "• Phone: " + leadPhone + "\n" +
            "• Service: " + leadService + "\n" +
            "• Country: " + leadCountry + "\n" +
            "• Notes: " + leadNotes + "\n" +
            "• Form ID: " + (data.form_id || "general") + "\n" +
            "• Source: " + (data.source || "") + "\n\n" +
            "View in Google Sheet: " + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notify error: " + adminErr.message);
  }

  return { status: "success", message: "Inquiry saved." };
}

/**
 * Smart Confirmation Email Dispatcher (Google Mail + Resend Support)
 */
function sendConfirmationEmail(recipientEmail, recipientName, webinarId, lang) {
  var subject = (lang === "fa")
    ? "تاییدیه ثبت‌نام وبینار شریف گروپ | Sharif Group Webinar Confirmation"
    : "Sharif Group Webinar Confirmation | تاییدیه ثبت‌نام وبینار شریف گروپ";
  var htmlContent = getEmailTemplate(recipientName, lang);
  var plainText = (lang === "fa")
    ? "سلام " + (recipientName || "دوست گرامی") + "،\n\nثبت‌نام شما در وبینار شریف گروپ با موفقیت انجام شد.\nلینک ورود به جلسه قبل از شروع برای شما ارسال خواهد شد.\n\nشریف گروپ دبی"
    : "Dear " + (recipientName || "Valued Client") + ",\n\nYour registration for the Sharif Group live webinar has been confirmed.\nThe direct joining link will be sent to you before the session starts.\n\nSharif Group Dubai";

  var scriptProperties = PropertiesService.getScriptProperties();
  var resendApiKey = scriptProperties.getProperty("RESEND_API_KEY");
  var fromAddress = scriptProperties.getProperty("SENDER_EMAIL") || CONFIG.DEFAULT_SENDER;

  // 1. Primary: Use Google Mail (MailApp) directly (Zero setup required)
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
      // If Google Mail hits daily quota and Resend key is set, fallback to Resend
      if (resendApiKey) {
        return sendViaResend(recipientEmail, subject, htmlContent, resendApiKey, fromAddress) + " (Google Mail failed: " + gmailErr.message + ")";
      }
      return "Google Mail Error: " + gmailErr.message;
    }
  }

  // 2. If configured to try Resend first, attempt Resend with Google Mail fallback
  try {
    var resendStatus = sendViaResend(recipientEmail, subject, htmlContent, resendApiKey, fromAddress);
    if (resendStatus.indexOf("Sent successfully") !== -1) {
      return resendStatus;
    }
    // Fallback to Google Mail if Resend returns an error
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: plainText,
      htmlBody: htmlContent,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.REPLY_TO_EMAIL
    });
    return "Sent via Google Mail (Resend fallback: " + resendStatus + ")";
  } catch (err) {
    try {
      MailApp.sendEmail({
        to: recipientEmail,
        subject: subject,
        body: plainText,
        htmlBody: htmlContent,
        name: CONFIG.SENDER_NAME,
        replyTo: CONFIG.REPLY_TO_EMAIL
      });
      return "Sent via Google Mail (Resend exception fallback)";
    } catch (finalErr) {
      return "Email Dispatch Error: " + finalErr.message;
    }
  }
}

/**
 * Resend.com Dispatcher Helper
 */
function sendViaResend(recipientEmail, subject, htmlContent, apiKey, fromAddress) {
  var payload = {
    from: fromAddress,
    to: [recipientEmail],
    subject: subject,
    html: htmlContent
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(CONFIG.RESEND_API_URL, options);
  var code = response.getResponseCode();
  var resText = response.getContentText();

  if (code >= 200 && code < 300) {
    return "Sent successfully via Resend";
  } else {
    return "Resend Error " + code + ": " + resText;
  }
}

/**
 * Multilingual Branded HTML Email Template
 */
function getEmailTemplate(name, lang) {
  var isFa = lang === "fa";
  var greeting = isFa ? ("سلام " + (name || "دوست گرامی") + "،") : ("Dear " + (name || "Valued Client") + ",");

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #FAF6EE; padding: 24px; color: #111;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: #070E1A; padding: 28px 32px; text-align: center;">
        <span style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; color: #C5A880; text-transform: uppercase;">SHARIF GROUP</span>
      </div>
      <div style="padding: 32px; direction: ${isFa ? 'rtl' : 'ltr'}; text-align: ${isFa ? 'right' : 'left'};">
        <h2 style="color: #070E1A; margin-top: 0;">${isFa ? 'ثبت‌نام شما با موفقیت تایید شد' : 'Your Webinar Registration is Confirmed'}</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">
          ${isFa
            ? 'از ثبت‌نام شما در وبینار تخصصی «پاسپورت دوم برای افغان‌ها: آشنایی با برنامه دومینیکا» سپاسگزاریم. لینک ورود به اتاق وبینار و یادآوری‌ها قبل از شروع جلسه برای شما ارسال خواهد شد.'
            : 'Thank you for registering for our live webinar: "A Second Passport for Afghans: Introducing the Dominica Programme". The direct joining link will appear on the webinar page and will be sent to your WhatsApp/email before the session starts.'}
        </p>
        
        <div style="background: #FAF6EE; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #E5E0D8;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #786142;">${isFa ? 'زمان برگزاری جلسه:' : 'Session Schedule:'}</p>
          <p style="margin: 0; font-size: 14px; color: #334155;">
            • ${isFa ? 'کابل: پنجشنبه ۸ عقرب / ساعت ۲۰:۰۰' : 'Kabul Time: Thursday 29 October, 20:00'}<br/>
            • ${isFa ? 'دبی: پنجشنبه ۲۹ اکتبر / ساعت ۱۹:۳۰' : 'Dubai Time: Thursday 29 October, 19:30'}<br/>
            • ${isFa ? 'مدت زمان: ۶۵ دقیقه (همراه با پرسش و پاسخ)' : 'Duration: 65 minutes (including Q&A)'}
          </p>
        </div>

        <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
          ${isFa
            ? 'نکته: ورود به وبینار مستقیماً از طریق مرورگر تلفن همراه امکان‌پذیر است و نیاز به نصب هیچ‌گونه نرم‌افزاری ندارد.'
            : 'Note: You can join the webinar directly from your mobile browser without installing any application.'}
        </p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
          Sharif Group Dubai • 116 The Binary Tower, Business Bay, Dubai, UAE<br/>
          WhatsApp: +971 4 357 8737 | mohammad@sharifgroup.ae
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Custom spreadsheet menu for stats
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Sharif Group CRM")
    .addItem("Refresh Partner Application Stats", "showPartnerStats")
    .addItem("Refresh Webinar Stats", "showRegistrationStats")
    .addToUi();
}

function showRegistrationStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.WEBINAR_SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("No webinar registrations sheet found yet.");
    return;
  }
  var count = Math.max(0, sheet.getLastRow() - 1);
  SpreadsheetApp.getUi().alert("Total Webinar Registrations: " + count);
}

function showPartnerStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PARTNER_SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("No partner applications sheet found yet.");
    return;
  }
  var count = Math.max(0, sheet.getLastRow() - 1);
  SpreadsheetApp.getUi().alert("Total Partner Applications: " + count);
}

/**
 * ==============================================================================
 * PARTNER APPLICATIONS CRM HANDLER & NOTIFICATIONS
 * ==============================================================================
 */

/**
 * Handle Partner Applications with Deduplication & Confirmation Email
 */
function handlePartnerApplication(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PARTNER_SHEET_NAME);

  // If sheet doesn't exist, create it with formatted headers
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PARTNER_SHEET_NAME);
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
      "Phone Number",
      "Email Address",
      "Website",
      "Programmes of Interest",
      "Estimated Referrals / Year",
      "Heard From",
      "Confidential Message",
      "Language",
      "Source URL",
      "Status",
      "Confirmation Email Status"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#070E1A")
      .setFontColor("#C5A880");
    sheet.setFrozenRows(1);
  }

  var nowUtc = new Date().toISOString();
  var appId = data.application_id || ("PAR-" + Utilities.getUuid().slice(0, 8).toUpperCase());
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
  var lang = data.lang || "en";
  var source = data.source || "";

  // Check for duplicate application by email
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

  var emailStatus = "Not Sent (No Email)";

  // Send automatic confirmation email to applicant
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendPartnerConfirmationEmail(email, fullName, appId, company, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  if (isDuplicate) {
    sheet.getRange(existingRowIndex, 19).setValue("Re-applied: " + nowUtc);
    return { status: "success", duplicate: true, message: "Existing partner application confirmed." };
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

  // Dispatch instant admin alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🤝 New Partner Application: " + fullName + (company ? " (" + company + ")" : ""),
      body: "New Partner Application Received:\n\n" +
            "• Application ID: " + appId + "\n" +
            "• Full Name: " + fullName + "\n" +
            "• Partner Type: " + partnerType + "\n" +
            "• Company: " + (company || "N/A") + "\n" +
            "• Job Title: " + (jobTitle || "N/A") + "\n" +
            "• Email: " + email + "\n" +
            "• Phone: " + phone + "\n" +
            "• Country & City: " + country + (city ? " / " + city : "") + "\n" +
            "• Website: " + (website || "N/A") + "\n" +
            "• Programmes: " + (programmes || "All Programmes") + "\n" +
            "• Est. Annual Referrals: " + referrals + "\n" +
            "• Heard From: " + heardFrom + "\n" +
            "• Confidential Notes: " + message + "\n" +
            "• Language: " + lang + "\n" +
            "• Timestamp: " + nowUtc + "\n\n" +
            "View Applications in Google Sheet: " + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notify error: " + adminErr.message);
  }

  return { status: "success", duplicate: false, message: "Partner application submitted successfully." };
}

/**
 * Partner Confirmation Email Dispatcher
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
 * Multilingual Branded Partner HTML Email Template
 */
function getPartnerEmailTemplate(name, applicationId, company, lang) {
  var isFa = lang === "fa";
  var isAr = lang === "ar";
  var isRtl = isFa || isAr;

  var title = "Partnership Application Received";
  var greeting = "Dear " + (name || "Valued Partner") + ",";
  var intro = "Thank you for submitting your partnership application to Sharif Group Dubai. We are delighted by your interest in joining our global network of introducers, law firms, and advisory agencies.";
  var refLabel = "Application Reference";
  var nextTitle = "What Happens Next?";
  var step1 = "<strong>1. Compliance & Document Review:</strong> Our partnerships desk reviews your firm profile within 2 business days.";
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
    step3 = "<strong>٣. توقيع الاتفاقية وحزمة الشريك:</strong> إبرام عقد الشراكة وتسليم المواد الترويجية وقنوات التقديم السريعة.";
    contactNote = "إذا كانت لديكم أية استفسارات عاجلة، يمكنكم الرد مباشرة على هذا البريد أو التواصل عبر الواتساب.";
  } else if (lang === "zh") {
    title = "合作伙伴申请已确认送达";
    greeting = "尊敬的 " + (name || "合作伙伴") + "：";
    intro = "非常感谢您申请成为迪拜谢里夫集团官方合作伙伴。我们非常期待与具有远见的专业机构携手，共同拓展全球第二身份与海外资产配置市场。";
    refLabel = "申请追踪编号";
    nextTitle = "后续流程安排：";
    step1 = "<strong>1. 资质合规审核：</strong> 我们的合规与战略合作团队将在2个工作日内完成初步审核。";
    step2 = "<strong>2. 专属顾问对接：</strong> 专属机构关系经理将与您沟通，明确佣金机制、引荐流程与合作模式。";
    step3 = "<strong>3. 协议签署与赋能：</strong> 签署正式B2B合作协议，获取联合品牌资料包与VIP快速递件通道。";
    contactNote = "如有任何即时疑问，可直接回复此邮件，或通过官方 WhatsApp 与我们的合作团队取得联系。";
  }

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #FAF6EE; padding: 24px; color: #111; margin: 0;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: #070E1A; padding: 28px 32px; text-align: center;">
        <span style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; color: #C5A880; text-transform: uppercase;">SHARIF GROUP</span>
        <div style="font-size: 11px; letter-spacing: 0.2em; color: #94A3B8; text-transform: uppercase; margin-top: 4px;">GLOBAL CITIZENSHIP & RESIDENCY PARTNERSHIPS</div>
      </div>
      <div style="padding: 32px; direction: ${isRtl ? 'rtl' : 'ltr'}; text-align: ${isRtl ? 'right' : 'left'};">
        <h2 style="color: #070E1A; margin-top: 0; font-size: 20px;">${title}</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">${intro}</p>
        
        <div style="background: #FAF6EE; border-radius: 12px; padding: 18px 22px; margin: 22px 0; border: 1px solid #E5E0D8; text-align: center;">
          <div style="font-size: 12px; font-weight: 600; color: #786142; text-transform: uppercase; letter-spacing: 0.1em;">${refLabel}</div>
          <div style="font-size: 22px; font-weight: 800; color: #070E1A; letter-spacing: 0.08em; margin-top: 4px; font-family: monospace;">${applicationId}</div>
          ${company ? `<div style="font-size: 12px; color: #64748B; margin-top: 4px;">${company}</div>` : ''}
        </div>

        <div style="margin: 22px 0;">
          <h3 style="font-size: 14px; color: #070E1A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">${nextTitle}</h3>
          <div style="font-size: 13px; color: #334155; line-height: 1.7; padding-${isRtl ? 'right' : 'left'}: 4px;">
            <div style="margin-bottom: 10px;">${step1}</div>
            <div style="margin-bottom: 10px;">${step2}</div>
            <div>${step3}</div>
          </div>
        </div>

        <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin-top: 24px; background: #F8FAFC; padding: 14px 18px; border-radius: 8px; border: 1px solid #EDF2F7;">
          ${contactNote}
        </p>

        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.6;">
          Sharif Group Dubai • 116 The Binary Tower, Business Bay, Dubai, UAE<br/>
          Direct Inquiries: <a href="mailto:mohammad@sharifgroup.ae" style="color: #786142; text-decoration: none;">mohammad@sharifgroup.ae</a> | WhatsApp: +971 4 357 8737
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * ==============================================================================
 * ONE-CLICK PERMISSION & AUTHORIZATION TESTER
 * ==============================================================================
 * Select "testEmailPermissions" from the Apps Script function dropdown and click "Run".
 * Google will display the "Authorization Required" popup.
/**
 * BARE AUTHORIZATION TRIGGER (NO TRY/CATCH)
 * Select "authorizeMailNow" and click "Run".
 * Because there is no try/catch, Google CANNOT swallow the permission check
 * and will immediately pop up the "Authorization Required" window!
 */
function authorizeMailNow() {
  var remaining = MailApp.getRemainingDailyQuota();
  Logger.log("Permission granted! Remaining quota: " + remaining);
}

function testEmailPermissions() {
  var quota = -1;
  try {
    quota = MailApp.getRemainingDailyQuota();
    Logger.log("✅ Remaining Google Mail quota: " + quota);
  } catch (err) {
    Logger.log("❌ Quota error: " + err.message);
  }

  var testRecipient = CONFIG.ADMIN_EMAIL;
  Logger.log("📤 Sending test confirmation email to: " + testRecipient);
  var status = sendConfirmationEmail(testRecipient, "Test Attendee", "WEB01", "en");
  Logger.log("📬 Dispatch result: " + status);
}


