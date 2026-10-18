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
    return { status: "success", duplicate: true, message: "Existing registration confirmed." };
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

  return { status: "success", duplicate: false, message: "Registration recorded successfully." };
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
  ui.createMenu("Sharif Group Webinars")
    .addItem("Refresh Registration Stats", "showRegistrationStats")
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
