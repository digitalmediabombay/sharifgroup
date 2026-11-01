/* /**
 * ==============================================================================
 * SHARIF GROUP — MASTER CRM & WEBHOOK CONTROLLER (Google Apps Script)
 * ==============================================================================
 * Single Web App URL for ALL website forms:
 *   1. Programs & Consultations (Citizenship, Residency, Real Estate, Advisory, Contact, Eligibility)
 *   2. Partner Applications (B2B Partnerships)
 *   3. Event Registrations (Webinars & Live Sessions)
 * 
 * ------------------------------------------------------------------------------
 * STEP-BY-STEP SETUP INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.new) and name the spreadsheet:
 *    "Sharif Group — Master CRM 2026"
 * 
 * 2. In Google Sheets, click:
 *    Extensions > Apps Script
 * 
 * 3. Delete any default code in Code.gs, paste this ENTIRE file, and click Save (💾).
 * 
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 *    - Click the gear icon next to "Select type" and choose: "Web app"
 *    - Description: "Sharif Group Master CRM v1"
 *    - Execute as: "Me (<your-google-email>)"
 *    - Who has access: "Anyone"   <-- [CRITICAL: Allows website visitors to submit forms]
 * 
 * 5. Click "Deploy".
 *    - Click "Review permissions", select your account, click "Advanced" > "Go to Untitled project (unsafe)", and click "Allow".
 * 
 * 6. Copy the resulting "Web app URL":
 *    (It looks like: https://script.google.com/macros/s/AKfycb.../exec)
 * 
 * 7. Paste that single Web App URL in your chat with Antigravity!
 *    We will update it across all website forms so everything connects instantly.
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  // Tab Names inside the Spreadsheet
  LEADS_TAB: "Programs_and_Leads",
  PARTNER_TAB: "Partner_Applications",
  EVENT_TAB: "Event_Registrations",

  // Fallback Tab Names (if migrating an older sheet)
  FALLBACK_LEADS: ["Inquiries", "Website_Leads", "Sheet1"],
  FALLBACK_EVENTS: ["Webinar_Registrations"],

  // Admin Notification Recipient
  ADMIN_EMAIL: "mohammad@sharifgroup.ae",
  SENDER_NAME: "Sharif Group CRM",
  REPLY_TO_EMAIL: "mohammad@sharifgroup.ae",
  DEFAULT_SENDER: "Sharif Group <mohammad@sharifgroup.ae>",

  // Built-in Google MailApp (Requires zero external API keys)
  PREFER_GOOGLE_MAIL: true,
  RESEND_API_URL: "https://api.resend.com/emails"
};

/**
 * Diagnostic GET endpoint
 * Test by pasting the Web App URL directly in any browser window
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
    service: "Sharif Group Master CRM Unified Webhook",
    timestamp: new Date().toISOString(),
    dailyEmailQuotaRemaining: quota,
    adminNotificationEmail: CONFIG.ADMIN_EMAIL,
    managedTabs: [CONFIG.LEADS_TAB, CONFIG.PARTNER_TAB, CONFIG.EVENT_TAB],
    instructions: "POST JSON or form data. Routes automatically by form_id to the appropriate tab."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main Central POST Endpoint with Concurrency Lock
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent submissions to prevent collision
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

    var formId = String(data.form_id || (data.webinar_id ? "webinar-registration" : "consultation-lead")).toLowerCase();

    // 1. Route to Partner Applications
    if (formId === "partner-application" || formId.indexOf("partner") !== -1) {
      var partnerResult = handlePartnerApplication(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(partnerResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // 2. Route to Event / Webinar Registrations
    else if (formId === "webinar-registration" || data.webinar_id || formId.indexOf("webinar") !== -1 || formId.indexOf("event") !== -1) {
      var webinarResult = handleWebinarRegistration(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(webinarResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // 3. Route All Other Forms to Programs & Consultations
    else {
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

// ==============================================================================
// 1. PROGRAMS & CONSULTATION LEADS (All Citizenship, Residency, Real Estate, Advisory, Contact, Eligibility)
// ==============================================================================
function handleStandardLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.LEADS_TAB, CONFIG.FALLBACK_LEADS, [
    "Timestamp (UTC)",
    "Full Name",
    "Email Address",
    "Phone Number",
    "Country / Residence",
    "Program / Service",
    "Language",
    "Notes & Details",
    "Source URL",
    "Page Path",
    "Form ID",
    "Email Status"
  ]);

  var nowUtc = new Date().toISOString();
  var leadName = (data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim() || "Website Client");
  var leadEmail = (data.email || "").toLowerCase().trim();
  var leadPhone = (data.phone || (data.dialCode ? (data.dialCode + " " + (data.rawPhone || "")) : "")).trim();
  var leadService = data.service || data.targetProgram || data.program || data.investmentRoute || "General Consultation";
  var leadCountry = data.country || data.residence || data.citizenship || "";
  var leadNotes = data.notes || data.message || data.confidentialNotes || "";
  var leadLang = (data.lang || "en").toLowerCase();
  var sourceUrl = data.source || "";
  var pagePath = data.page || "";
  var formId = data.form_id || "consultation-lead";

  var emailStatus = "Pending";

  // Dispatch instant admin email alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "⚡ New Website Lead: " + leadName + " (" + (leadService || "General") + " | " + leadLang.toUpperCase() + ")",
      body: "New Website Consultation Lead Received:\n\n" +
        "• Full Name:         " + leadName + "\n" +
        "• Email Address:     " + (leadEmail || "Not provided") + "\n" +
        "• Phone Number:      " + (leadPhone || "Not provided") + "\n" +
        "• Program / Service: " + leadService + "\n" +
        "• Country:           " + (leadCountry || "Not specified") + "\n" +
        "• Language:          " + leadLang.toUpperCase() + "\n" +
        "• Form ID:           " + formId + "\n" +
        "• Timestamp:         " + nowUtc + "\n" +
        "• Page:              " + (pagePath || sourceUrl) + "\n\n" +
        "----------------------------------------------------\n" +
        "CLIENT NOTES & DETAILS:\n" +
        "----------------------------------------------------\n" +
        (leadNotes || "None") + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
    emailStatus = "Sent via Google Mail (" + nowUtc + ")";
  } catch (adminErr) {
    emailStatus = "Failed: " + adminErr.message;
    Logger.log("Admin notify error: " + adminErr.message);
  }

  sheet.appendRow([
    nowUtc,
    leadName,
    leadEmail,
    leadPhone,
    leadCountry,
    leadService,
    leadLang,
    leadNotes,
    sourceUrl,
    pagePath,
    formId,
    emailStatus
  ]);

  return {
    status: "success",
    tab: CONFIG.LEADS_TAB,
    message: "Inquiry saved successfully.",
    emailStatus: emailStatus
  };
}

// ==============================================================================
// 2. PARTNER APPLICATIONS (B2B Onboarding)
// ==============================================================================
function handlePartnerApplication(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.PARTNER_TAB, [], [
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
    "Confirmation Email Status"
  ]);

  var nowUtc = new Date().toISOString();
  var appId = data.application_id || ("PAR-" + Utilities.getUuid().slice(0, 6).toUpperCase());
  var fullName = data.fullName || data.name || "Partner Applicant";
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

  var applicationStatus = "Pending Review";
  if (isDuplicate) {
    applicationStatus = "Re-submission (Duplicate Email)";
    try {
      sheet.getRange(existingRowIndex, 19).setValue("Re-applied: " + nowUtc);
    } catch (e) { }
  }

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
    applicationStatus,
    emailStatus
  ]);

  // Dispatch instant admin notification alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🤝 New Partner Application: " + fullName + " (" + (company || "Individual") + ")",
      body: "New Partner Application Received:\n\n" +
        "• Application ID: " + appId + "\n" +
        "• Full Name:      " + fullName + "\n" +
        "• Company / Firm: " + (company || "None") + "\n" +
        "• Job Title:      " + (jobTitle || "None") + "\n" +
        "• Partner Type:   " + (partnerType || "General") + "\n" +
        "• Email:          " + email + "\n" +
        "• Phone:          " + (dialCode ? dialCode + " " : "") + phone + "\n" +
        "• Country/City:   " + country + (city ? ", " + city : "") + "\n" +
        "• Est. Referrals: " + (referrals || "Not specified") + "\n" +
        "• Language:       " + lang.toUpperCase() + "\n" +
        "• Timestamp:      " + nowUtc + "\n\n" +
        "----------------------------------------------------\n" +
        "CONFIDENTIAL MESSAGE:\n" +
        "----------------------------------------------------\n" +
        (message || "None") + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notify error: " + adminErr.message);
  }

  return {
    status: "success",
    tab: CONFIG.PARTNER_TAB,
    duplicate: isDuplicate,
    application_id: appId,
    message: "Partner application submitted successfully.",
    emailStatus: emailStatus
  };
}

// ==============================================================================
// 3. EVENT & WEBINAR REGISTRATIONS
// ==============================================================================
function handleWebinarRegistration(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.EVENT_TAB, CONFIG.FALLBACK_EVENTS, [
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
  ]);

  var nowUtc = new Date().toISOString();
  var webinarId = data.webinar_id || "WEB01";
  var webinarSlug = data.slug || "";
  var fullName = data.fullName || data.name || "Attendee";
  var dialCode = data.dialCode || "";
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim();
  var email = (data.email || "").toLowerCase().trim();
  var residence = data.residence_country || data.country || "";
  var question = data.question || "";
  var newsletter = data.newsletter_optin ? "Yes" : "No";
  var lang = (data.lang || "fa").toLowerCase();
  var source = data.source || "";
  var page = data.page || "";

  // Check duplicate registrations by (webinar_id + phone)
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

  // Send automatic confirmation email to attendee
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendWebinarConfirmationEmail(email, fullName, webinarId, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  if (isDuplicate && existingRowIndex > 0) {
    if (email) sheet.getRange(existingRowIndex, 7).setValue(email);
    sheet.getRange(existingRowIndex, 15).setValue(emailStatus);
    return {
      status: "success",
      tab: CONFIG.EVENT_TAB,
      duplicate: true,
      message: "Existing registration confirmed.",
      emailStatus: emailStatus
    };
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
      subject: "🔔 New Event Registration: " + fullName + " (" + webinarId + ")",
      body: "New Event Registration Received:\n\n" +
        "• Full Name:        " + fullName + "\n" +
        "• Email:            " + (email || "Not provided") + "\n" +
        "• Phone:            " + ((dialCode ? dialCode + " " : "") + rawPhone).trim() + "\n" +
        "• Country:          " + residence + "\n" +
        "• Webinar Session:  " + webinarId + "\n" +
        "• Language:         " + lang.toUpperCase() + "\n" +
        "• Timestamp:        " + nowUtc + "\n" +
        "• Page:             " + page + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {
    Logger.log("Admin notify error: " + adminErr.message);
  }

  return {
    status: "success",
    tab: CONFIG.EVENT_TAB,
    duplicate: false,
    message: "Registration recorded successfully.",
    emailStatus: emailStatus
  };
}

// ==============================================================================
// HELPER: GET OR AUTO-CREATE FORMATTED SHEET TAB
// ==============================================================================
function getOrCreateTab(ss, preferredName, fallbacks, headers) {
  var sheet = ss.getSheetByName(preferredName);
  if (sheet) return sheet;

  if (fallbacks && fallbacks.length > 0) {
    for (var i = 0; i < fallbacks.length; i++) {
      var fb = ss.getSheetByName(fallbacks[i]);
      if (fb) return fb;
    }
  }

  // Insert new tab and format headers with Sharif Gold & Navy
  sheet = ss.insertSheet(preferredName);
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#070E1A")
    .setFontColor("#C5A880");
  sheet.setFrozenRows(1);
  return sheet;
}

// ==============================================================================
// CONFIRMATION EMAIL DISPATCHERS
// ==============================================================================
function sendWebinarConfirmationEmail(recipientEmail, recipientName, webinarId, lang) {
  var subject = (lang === "fa")
    ? "تاییدیه ثبت‌نام وبینار شریف گروپ | Sharif Group Webinar Confirmation"
    : (lang === "ar")
      ? "تأكيد التسجيل في فعالية شريف جروب | Sharif Group Event Confirmation"
      : (lang === "zh")
        ? "盛睿集团讲座报名确认函 | Sharif Group Event Confirmation"
        : "Sharif Group Webinar Confirmation | تاییدیه ثبت‌نام وبینار شریف گروپ";

  var htmlContent = getWebinarEmailTemplate(recipientName, lang);

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlContent,
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO_EMAIL
  });

  return "Sent via Google Mail (" + new Date().toISOString() + ")";
}

function sendPartnerConfirmationEmail(recipientEmail, recipientName, applicationId, company, lang) {
  var subject = (lang === "fa")
    ? "تأییدیه دریافت درخواست همکاری شریف گروپ — " + applicationId
    : (lang === "ar")
      ? "تأكيد استلام طلب الشراكة — شريف جروب (" + applicationId + ")"
      : (lang === "zh")
        ? "盛睿集团官方合作伙伴申请确认函 — " + applicationId
        : "Sharif Group — Partnership Application Received (" + applicationId + ")";

  var htmlContent = getPartnerEmailTemplate(recipientName, applicationId, company, lang);

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlContent,
    name: "Sharif Group Partnerships",
    replyTo: CONFIG.REPLY_TO_EMAIL
  });

  return "Sent via Google Mail (" + new Date().toISOString() + ")";
}

// ==============================================================================
// BRANDED EMAIL TEMPLATES
// ==============================================================================
function getWebinarEmailTemplate(name, lang) {
  var isRtl = (lang === "fa" || lang === "ar");
  var dir = isRtl ? "rtl" : "ltr";
  var align = isRtl ? "right" : "left";

  var heading = (lang === "fa") ? "ثبت‌نام وبینار تأیید شد" : (lang === "ar") ? "تم تأكيد تسجيلكم في الفعالية" : (lang === "zh") ? "您的讲座报名已确认" : "Webinar Registration Confirmed";
  var bodyText = (lang === "fa")
    ? "از ثبت‌نام شما در وبینار تخصصی شریف گروپ سپاسگزاریم. لینک ورود اختصاصی جلسه به زودی برای شما ارسال خواهد شد."
    : (lang === "ar")
      ? "نشكركم على التسجيل في فعاليتنا المباشرة. سيتم تزويدكم برابط الدخول المباشر قبل انطلاق الجلسة."
      : (lang === "zh")
        ? "感谢您报名参加盛睿集团（Sharif Group）专题线上讲座。直播间直达链接将在活动开始前发送至您的联系方式。"
        : "Thank you for registering for our exclusive online session. The direct link to join will be active and sent to your contact details before the session starts.";

  return '<!DOCTYPE html><html lang="' + lang + '" dir="' + dir + '"><body style="margin:0;padding:24px 12px;background-color:#FAF6EE;font-family:sans-serif;color:#111;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border-radius:16px;border:1px solid #E5E0D8;overflow:hidden;">' +
    '<tr><td style="background:#070E1A;padding:32px 24px;text-align:center;"><span style="font-size:22px;font-weight:700;letter-spacing:0.18em;color:#C5A880;text-transform:uppercase;">SHARIF GROUP</span></td></tr>' +
    '<tr><td style="padding:36px 32px;direction:' + dir + ';text-align:' + align + ';"><h1 style="color:#070E1A;font-size:22px;font-weight:700;">' + heading + '</h1>' +
    '<p style="font-size:15px;line-height:1.7;color:#334155;">' + bodyText + '</p>' +
    '<p style="font-size:13px;color:#64748B;margin-top:24px;">Sharif Group • Private Advisory & Citizenship</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function getPartnerEmailTemplate(name, applicationId, company, lang) {
  var isRtl = (lang === "fa" || lang === "ar");
  var dir = isRtl ? "rtl" : "ltr";
  var align = isRtl ? "right" : "left";

  return '<!DOCTYPE html><html lang="' + lang + '" dir="' + dir + '"><body style="margin:0;padding:24px 12px;background-color:#FAF6EE;font-family:sans-serif;color:#111;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border-radius:16px;border:1px solid #E5E0D8;overflow:hidden;">' +
    '<tr><td style="background:#070E1A;padding:32px 24px;text-align:center;"><span style="font-size:22px;font-weight:700;letter-spacing:0.18em;color:#C5A880;text-transform:uppercase;">SHARIF GROUP</span><div style="font-size:11px;color:#94A3B8;letter-spacing:0.12em;margin-top:4px;">PARTNERSHIPS NETWORK</div></td></tr>' +
    '<tr><td style="padding:36px 32px;direction:' + dir + ';text-align:' + align + ';"><h1 style="color:#070E1A;font-size:22px;font-weight:700;">Partnership Application Received</h1>' +
    '<p style="font-size:15px;line-height:1.7;color:#334155;">Dear ' + name + ',<br/><br/>Thank you for submitting your partnership application to the Sharif Group Network. Your application <strong>#' + applicationId + '</strong> has been queued for institutional review by our partnerships desk.</p>' +
    '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:20px 0;"><strong>Application Reference:</strong> ' + applicationId + '<br/><strong>Company / Firm:</strong> ' + (company || "Individual / Not Specified") + '<br/><strong>Desk Review SLA:</strong> 24 to 48 Hours</div>' +
    '<p style="font-size:13px;color:#64748B;">Sharif Group Partnerships Desk • Dubai, UAE</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

// ==============================================================================
// UI MENU & DIAGNOSTICS FOR SPREADSHEET OWNER
// ==============================================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⭐ Sharif Group CRM")
    .addItem("🛠️ Setup / Refresh All 3 Tabs", "initializeAllTabs")
    .addItem("✉️ Send Test Admin Email Alert", "testEmailPermissions")
    .addItem("📊 View Lead Counts & Stats", "showAllStats")
    .addToUi();
}

function initializeAllTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Tab 1: Programs & Consultations
  getOrCreateTab(ss, CONFIG.LEADS_TAB, CONFIG.FALLBACK_LEADS, [
    "Timestamp (UTC)", "Full Name", "Email Address", "Phone Number", "Country / Residence",
    "Program / Service", "Language", "Notes & Details", "Source URL", "Page Path", "Form ID", "Email Status"
  ]);

  // Tab 2: Partner Applications
  getOrCreateTab(ss, CONFIG.PARTNER_TAB, [], [
    "Timestamp (UTC)", "Application ID", "Full Name", "Partner Type", "Company / Firm", "Job Title",
    "Country", "City", "Dial Code", "Phone (WhatsApp)", "Email Address", "Website / LinkedIn",
    "Programmes of Interest", "Est. Annual Referrals", "Heard From", "Confidential Message",
    "Language", "Source URL", "Status", "Confirmation Email Status"
  ]);

  // Tab 3: Event Registrations
  getOrCreateTab(ss, CONFIG.EVENT_TAB, CONFIG.FALLBACK_EVENTS, [
    "Timestamp (UTC)", "Webinar ID", "Webinar Slug", "Full Name", "Dial Code", "Phone Number",
    "Email Address", "Country of Residence", "Questions / Notes", "Newsletter Opt-In",
    "Language", "Source URL", "Page Path", "Status", "Email Dispatch Status"
  ]);

  SpreadsheetApp.getUi().alert("✅ Success: All 3 CRM tabs (Programs, Partners, Events) have been created and formatted with luxury styling!");
}

function testEmailPermissions() {
  var quota = MailApp.getRemainingDailyQuota();
  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "✅ Sharif Group Master CRM — Test Alert",
    body: "This is a verification test from your Sharif Group Master CRM Google Spreadsheet.\n\n" +
      "• Status: Google MailApp is operational!\n" +
      "• Daily Quota Remaining: " + quota + " emails\n" +
      "• Timestamp: " + new Date().toISOString()
  });

  SpreadsheetApp.getUi().alert("✅ Test email successfully sent to " + CONFIG.ADMIN_EMAIL + "!\nDaily quota remaining: " + quota);
}

function showAllStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s1 = ss.getSheetByName(CONFIG.LEADS_TAB);
  var s2 = ss.getSheetByName(CONFIG.PARTNER_TAB);
  var s3 = ss.getSheetByName(CONFIG.EVENT_TAB);

  var c1 = s1 ? Math.max(0, s1.getLastRow() - 1) : 0;
  var c2 = s2 ? Math.max(0, s2.getLastRow() - 1) : 0;
  var c3 = s3 ? Math.max(0, s3.getLastRow() - 1) : 0;

  SpreadsheetApp.getUi().alert(
    "📊 Sharif Group Master CRM Statistics:\n\n" +
    "• Programs & Consultations: " + c1 + " leads\n" +
    "• Partner Applications:     " + c2 + " applications\n" +
    "• Event Registrations:      " + c3 + " attendees\n\n" +
    "Total Inquiries: " + (c1 + c2 + c3)
  );
}

 */