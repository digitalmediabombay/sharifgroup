/**
 * ==============================================================================
 * SHARIF GROUP — MASTER MULTI-PROGRAM CRM & WEBHOOK (Google Apps Script)
 * ==============================================================================
 * Purpose:
 * Routes every incoming submission to its DEDICATED Program Sheet Tab:
 *   • Dominica              ➔ "Dominica"
 *   • UAE / Dubai Residency ➔ "UAE"
 *   • Grenada               ➔ "Grenada"
 *   • Antigua & Barbuda     ➔ "Antigua_Barbuda"
 *   • Saint Lucia           ➔ "Saint_Lucia"
 *   • St. Kitts & Nevis     ➔ "St_Kitts"
 *   • Vanuatu               ➔ "Vanuatu"
 *   • Nauru                 ➔ "Nauru"
 *   • Sao Tome & Principe   ➔ "Sao_Tome"
 *   • Greece Golden Visa    ➔ "Greece"
 *   • Portugal Golden Visa  ➔ "Portugal"
 *   • Panama Residency      ➔ "Panama"
 *   • Dubai Real Estate     ➔ "Dubai_Real_Estate"
 *   • Educational Advisory  ➔ "Educational_Advisory"
 *   • Eligibility Checker   ➔ "Eligibility_Checker"
 *   • General Inquiries     ➔ "General_Inquiries"
 *   • All Leads Overview    ➔ "All_Leads" (Master list)
 *   • Partner Applications  ➔ "Partner_Applications"
 *   • Event Registrations   ➔ "Event_Registrations"
 * 
 * NOTE: Phone numbers are automatically escaped with a leading apostrophe (')
 * and formatted as Plain Text to prevent Google Sheets from evaluating "+..."
 * as a formula (which causes #ERROR!).
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  MASTER_LEADS_TAB: "All_Leads",
  PARTNER_TAB: "Partner_Applications",
  EVENT_TAB: "Event_Registrations",

  // Admin Notification Recipient
  ADMIN_EMAIL: "mohammad@sharifgroup.ae",
  SENDER_NAME: "Sharif Group CRM",
  REPLY_TO_EMAIL: "mohammad@sharifgroup.ae"
};

const LEAD_HEADERS = [
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
];

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
    service: "Sharif Group Multi-Program Master CRM",
    timestamp: new Date().toISOString(),
    dailyEmailQuotaRemaining: quota,
    adminNotificationEmail: CONFIG.ADMIN_EMAIL,
    instructions: "POST JSON. Routes automatically to program-specific tab & All_Leads."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Central POST Endpoint with Concurrency Lock
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Server busy, retry in a moment." }))
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

    // 1. Partner Applications
    if (formId === "partner-application" || formId.indexOf("partner") !== -1) {
      var partnerResult = handlePartnerApplication(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(partnerResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // 2. Event & Webinar Registrations
    else if (formId === "webinar-registration" || data.webinar_id || formId.indexOf("webinar") !== -1 || formId.indexOf("event") !== -1) {
      var webinarResult = handleWebinarRegistration(data);
      lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify(webinarResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // 3. Program & Consultation Leads (Dominica, UAE, Grenada, Greece, Real Estate, etc.)
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
// 1. MULTI-PROGRAM ROUTER & DISPATCHER
// ==============================================================================
function handleStandardLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var nowUtc = new Date().toISOString();
  var leadName = (data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim() || "Website Client");
  var leadEmail = (data.email || "").toLowerCase().trim();
  
  // Phone formatting: Escape leading '+' so Google Sheets never interprets it as a math formula (#ERROR!)
  var rawPhone = (data.phone || (data.dialCode ? (data.dialCode + " " + (data.rawPhone || "")) : "")).trim();
  var cleanPhone = rawPhone.replace(/^'+/, "").trim();
  var safePhone = cleanPhone ? ("'" + cleanPhone) : "";

  var leadService = data.service || data.targetProgram || data.program || data.investmentRoute || "General Consultation";
  var leadCountry = data.country || data.residence || data.citizenship || "";
  var leadNotes = data.notes || data.message || data.confidentialNotes || "";
  var leadLang = (data.lang || "en").toLowerCase();
  var sourceUrl = data.source || "";
  var pagePath = data.page || "";
  var formId = data.form_id || "consultation-lead";

  // Identify the target program sheet tab
  var programTabName = resolveProgramTabName(data);

  var emailStatus = "Pending";

  // Dispatch instant admin email alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "⚡ New Lead [" + programTabName + "]: " + leadName + " (" + leadLang.toUpperCase() + ")",
      body: "New Website Consultation Lead Received:\n\n" +
            "• Program Sheet Tab:  " + programTabName + "\n" +
            "• Full Name:          " + leadName + "\n" +
            "• Email Address:      " + (leadEmail || "Not provided") + "\n" +
            "• Phone Number:       " + (cleanPhone || "Not provided") + "\n" +
            "• Program / Service:  " + leadService + "\n" +
            "• Country:            " + (leadCountry || "Not specified") + "\n" +
            "• Language:           " + leadLang.toUpperCase() + "\n" +
            "• Form ID:            " + formId + "\n" +
            "• Timestamp:          " + nowUtc + "\n" +
            "• Page:               " + (pagePath || sourceUrl) + "\n\n" +
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

  var row = [
    nowUtc,
    leadName,
    leadEmail,
    safePhone,
    leadCountry,
    leadService,
    leadLang,
    leadNotes,
    sourceUrl,
    pagePath,
    formId,
    emailStatus
  ];

  // 1. Save to dedicated Program Sheet Tab (e.g. Dominica, UAE, etc.)
  var programSheet = getOrCreateTab(ss, programTabName, [], LEAD_HEADERS);
  programSheet.appendRow(row);

  // 2. Also save to Master "All_Leads" Tab (complete chronological record)
  var masterSheet = getOrCreateTab(ss, CONFIG.MASTER_LEADS_TAB, ["Programs_and_Leads", "Inquiries"], LEAD_HEADERS);
  masterSheet.appendRow(row);

  return {
    status: "success",
    programTab: programTabName,
    masterTab: CONFIG.MASTER_LEADS_TAB,
    message: "Inquiry saved to " + programTabName + " tab.",
    emailStatus: emailStatus
  };
}

/**
 * Smart Program Resolver - Detects program from service, page, subprogram, and notes across all languages
 */
function resolveProgramTabName(data) {
  var text = (
    (data.service || "") + " " +
    (data.subProgram || "") + " " +
    (data.targetProgram || "") + " " +
    (data.program || "") + " " +
    (data.investmentRoute || "") + " " +
    (data.page || "") + " " +
    (data.source || "") + " " +
    (data.notes || "")
  ).toLowerCase();

  // 1. Countries First (Guarantees no false positives from words like 'golden visa' or 'advisory')
  if (text.indexOf("dominica") !== -1 || text.indexOf("دومینیکا") !== -1 || text.indexOf("دومينيكا") !== -1 || text.indexOf("多米尼克") !== -1) {
    return "Dominica";
  }
  if (text.indexOf("grenada") !== -1 || text.indexOf("گرانادا") !== -1 || text.indexOf("غرينادا") !== -1 || text.indexOf("格林纳达") !== -1) {
    return "Grenada";
  }
  if (text.indexOf("antigua") !== -1 || text.indexOf("آنتیگوا") !== -1 || text.indexOf("أنتيغوا") !== -1 || text.indexOf("安提瓜") !== -1) {
    return "Antigua_Barbuda";
  }
  if (text.indexOf("stlucia") !== -1 || text.indexOf("st lucia") !== -1 || text.indexOf("saint lucia") !== -1 || text.indexOf("سنت لوسیا") !== -1 || text.indexOf("سانت لوسيا") !== -1 || text.indexOf("圣卢西亚") !== -1) {
    return "Saint_Lucia";
  }
  if (text.indexOf("stkitts") !== -1 || text.indexOf("st kitts") !== -1 || text.indexOf("saint kitts") !== -1 || text.indexOf("سنت کیتس") !== -1 || text.indexOf("سانت كيتس") !== -1 || text.indexOf("圣基茨") !== -1) {
    return "St_Kitts";
  }
  if (text.indexOf("vanuatu") !== -1 || text.indexOf("وانواتو") !== -1 || text.indexOf("فانواتو") !== -1 || text.indexOf("瓦努阿图") !== -1) {
    return "Vanuatu";
  }
  if (text.indexOf("nauru") !== -1 || text.indexOf("نائورو") !== -1 || text.indexOf("ناورو") !== -1 || text.indexOf("瑙鲁") !== -1) {
    return "Nauru";
  }
  if (text.indexOf("sao tome") !== -1 || text.indexOf("sao-tome") !== -1 || text.indexOf("سائوتومه") !== -1 || text.indexOf("ساو تومي") !== -1 || text.indexOf("圣多美") !== -1) {
    return "Sao_Tome";
  }
  if (text.indexOf("greece") !== -1 || text.indexOf("یونان") !== -1 || text.indexOf("اليونان") !== -1 || text.indexOf("希腊") !== -1) {
    return "Greece";
  }
  if (text.indexOf("portugal") !== -1 || text.indexOf("پرتغال") !== -1 || text.indexOf("البرتغال") !== -1 || text.indexOf("葡萄牙") !== -1) {
    return "Portugal";
  }
  if (text.indexOf("panama") !== -1 || text.indexOf("پاناما") !== -1 || text.indexOf("بنما") !== -1 || text.indexOf("巴拿马") !== -1) {
    return "Panama";
  }

  // 2. Dubai Real Estate
  if (text.indexOf("realestate") !== -1 || text.indexOf("real estate") !== -1 || text.indexOf("عقارات") !== -1 || text.indexOf("املاک") !== -1 || text.indexOf("ملک") !== -1 || text.indexOf("property") !== -1 || text.indexOf("off-plan") !== -1 || text.indexOf("offplan") !== -1 || text.indexOf("房产") !== -1) {
    return "Dubai_Real_Estate";
  }

  // 3. UAE / Dubai Residency & UAE Golden Visa
  if (text.indexOf("uae") !== -1 || text.indexOf("dubai") !== -1 || text.indexOf("امارات") !== -1 || text.indexOf("دبی") !== -1 || text.indexOf("دبي") !== -1 || text.indexOf("emirates") !== -1 || text.indexOf("uae golden visa") !== -1 || text.indexOf("ویزای طلایی امارات") !== -1 || text.indexOf("阿联酋") !== -1) {
    return "UAE";
  }

  // 4. Educational Advisory
  if (text.indexOf("educationaladvisory") !== -1 || text.indexOf("educational advisory") !== -1 || text.indexOf("education") !== -1 || text.indexOf("تحصیلی") !== -1 || text.indexOf("تعليمي") !== -1 || text.indexOf("boarding school") !== -1 || text.indexOf("university admission") !== -1 || text.indexOf("教育") !== -1) {
    return "Educational_Advisory";
  }

  // 5. Eligibility Assessment
  if (text.indexOf("eligibilitychecker") !== -1 || text.indexOf("eligibility") !== -1 || text.indexOf("checker") !== -1 || text.indexOf("ارزیابی") !== -1 || text.indexOf("اهلية") !== -1) {
    return "Eligibility_Checker";
  }

  // 6. Broad Categories
  if (text.indexOf("citizenship") !== -1 || text.indexOf("passport") !== -1 || text.indexOf("شهروندی") !== -1 || text.indexOf("جنسية") !== -1) {
    return "General_Citizenship";
  }
  if (text.indexOf("residency") !== -1 || text.indexOf("اقامت") !== -1 || text.indexOf("إقامة") !== -1) {
    return "General_Residency";
  }

  return "General_Inquiries";
}

// ==============================================================================
// 2. PARTNER APPLICATIONS
// ==============================================================================
function handlePartnerApplication(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.PARTNER_TAB, [], [
    "Timestamp (UTC)", "Application ID", "Full Name", "Partner Type", "Company / Firm", "Job Title",
    "Country", "City", "Dial Code", "Phone (WhatsApp)", "Email Address", "Website / LinkedIn",
    "Programmes of Interest", "Est. Annual Referrals", "Heard From", "Confidential Message",
    "Language", "Source URL", "Status", "Confirmation Email Status"
  ]);

  var nowUtc = new Date().toISOString();
  var appId = data.application_id || ("PAR-" + Utilities.getUuid().slice(0, 6).toUpperCase());
  var fullName = data.fullName || data.name || "Partner Applicant";
  var partnerType = data.partner_type || "";
  var company = data.company || "";
  var jobTitle = data.job_title || "";
  var country = data.country || "";
  var city = data.city || "";
  
  // Safe phone escaping
  var dialCode = (data.dialCode || "").trim().replace(/^'+/, "");
  var safeDialCode = dialCode ? ("'" + dialCode) : "";
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = rawPhone ? ("'" + rawPhone) : "";

  var email = (data.email || "").toLowerCase().trim();
  var website = data.website || "";
  var programmes = data.programmes || "";
  var referrals = data.referrals_per_year || "";
  var heardFrom = data.heard_from || "";
  var message = data.message || "";
  var lang = (data.lang || "en").toLowerCase();
  var source = data.source || "";

  var emailStatus = "Not Sent (No Email)";
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendPartnerConfirmationEmail(email, fullName, appId, company, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  sheet.appendRow([
    nowUtc, appId, fullName, partnerType, company, jobTitle,
    country, city, safeDialCode, safePhone, email, website,
    programmes, referrals, heardFrom, message, lang, source,
    "Pending Review", emailStatus
  ]);

  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🤝 New Partner Application: " + fullName + " (" + (company || "Individual") + ")",
      body: "New Partner Application Received:\n\n" +
            "• Application ID: " + appId + "\n" +
            "• Full Name:      " + fullName + "\n" +
            "• Company / Firm: " + (company || "None") + "\n" +
            "• Email:          " + email + "\n" +
            "• Phone:          " + (dialCode ? dialCode + " " : "") + rawPhone + "\n" +
            "• Country/City:   " + country + (city ? ", " + city : "") + "\n" +
            "• Timestamp:      " + nowUtc + "\n\n" +
            "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {}

  return { status: "success", tab: CONFIG.PARTNER_TAB, message: "Partner application submitted successfully." };
}

// ==============================================================================
// 3. EVENT & WEBINAR REGISTRATIONS
// ==============================================================================
function handleWebinarRegistration(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.EVENT_TAB, ["Webinar_Registrations"], [
    "Timestamp (UTC)", "Webinar ID", "Webinar Slug", "Full Name", "Dial Code", "Phone Number",
    "Email Address", "Country of Residence", "Questions / Notes", "Newsletter Opt-In",
    "Language", "Source URL", "Page Path", "Status", "Email Dispatch Status"
  ]);

  var nowUtc = new Date().toISOString();
  var webinarId = data.webinar_id || "WEB01";
  var webinarSlug = data.slug || "";
  var fullName = data.fullName || data.name || "Attendee";
  
  // Safe phone escaping
  var dialCode = (data.dialCode || "").trim().replace(/^'+/, "");
  var safeDialCode = dialCode ? ("'" + dialCode) : "";
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = rawPhone ? ("'" + rawPhone) : "";

  var email = (data.email || "").toLowerCase().trim();
  var residence = data.residence_country || data.country || "";
  var question = data.question || "";
  var newsletter = data.newsletter_optin ? "Yes" : "No";
  var lang = (data.lang || "fa").toLowerCase();
  var source = data.source || "";
  var page = data.page || "";

  var emailStatus = "Not Sent (No Email Provided)";
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendWebinarConfirmationEmail(email, fullName, webinarId, lang);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  sheet.appendRow([
    nowUtc, webinarId, webinarSlug, fullName, safeDialCode, safePhone,
    email, residence, question, newsletter, lang, source, page,
    "Registered", emailStatus
  ]);

  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🔔 New Event Registration: " + fullName + " (" + webinarId + ")",
      body: "New Event Registration Received:\n\n" +
            "• Full Name:        " + fullName + "\n" +
            "• Email:            " + email + "\n" +
            "• Phone:            " + ((dialCode ? dialCode + " " : "") + rawPhone).trim() + "\n" +
            "• Country:          " + residence + "\n" +
            "• Webinar Session:  " + webinarId + "\n" +
            "• Language:         " + lang.toUpperCase() + "\n" +
            "• Timestamp:        " + nowUtc + "\n\n" +
            "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {}

  return { status: "success", tab: CONFIG.EVENT_TAB, message: "Registration recorded successfully." };
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

  sheet = ss.insertSheet(preferredName);
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#070E1A")
    .setFontColor("#C5A880");
  sheet.setFrozenRows(1);

  // Set all columns format to plain text to avoid formula injection / #ERROR!
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 50), headers.length).setNumberFormat("@");
  } catch (e) {}

  return sheet;
}

// ==============================================================================
// CONFIRMATION EMAIL HELPERS
// ==============================================================================
function sendWebinarConfirmationEmail(recipientEmail, recipientName, webinarId, lang) {
  var subject = (lang === "fa")
    ? "تاییدیه ثبت‌نام وبینار شریف گروپ | Sharif Group Webinar Confirmation"
    : "Sharif Group Webinar Confirmation | تاییدیه ثبت‌نام وبینار شریف گروپ";

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: "<p>Dear " + recipientName + ",<br/>Your webinar registration is confirmed.</p>",
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO_EMAIL
  });
  return "Sent via Google Mail (" + new Date().toISOString() + ")";
}

function sendPartnerConfirmationEmail(recipientEmail, recipientName, applicationId, company, lang) {
  var subject = "Sharif Group — Partnership Application Received (" + applicationId + ")";
  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: "<p>Dear " + recipientName + ",<br/>Your partner application #" + applicationId + " has been received.</p>",
    name: "Sharif Group Partnerships",
    replyTo: CONFIG.REPLY_TO_EMAIL
  });
  return "Sent via Google Mail (" + new Date().toISOString() + ")";
}

// ==============================================================================
// UI MENU & AUTOMATIC CLEANUP UTILITY
// ==============================================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⭐ Sharif Group CRM")
    .addItem("🔧 Fix Existing Phone Number #ERROR! (Clean All)", "fixExistingPhoneErrors")
    .addItem("🛠️ Create All Program Tabs Now", "initializeAllProgramTabs")
    .addItem("✉️ Send Test Admin Email Alert", "testEmailPermissions")
    .addToUi();
}

/**
 * One-click utility that scans every sheet tab, converts phone numbers to clean text,
 * and eliminates all #ERROR! formula parse errors.
 */
function fixExistingPhoneErrors() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var fixedCount = 0;

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Find Phone column
    var phoneCols = [];
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "").toLowerCase();
      if (h.indexOf("phone") !== -1 || h.indexOf("dial") !== -1) {
        phoneCols.push(c + 1);
      }
    }

    for (var i = 0; i < phoneCols.length; i++) {
      var col = phoneCols[i];
      var range = sheet.getRange(2, col, lastRow - 1, 1);
      
      // Set column format to plain text
      range.setNumberFormat("@");

      var formulas = range.getFormulas();
      var values = range.getValues();

      for (var r = 0; r < values.length; r++) {
        var formula = formulas[r][0];
        var val = values[r][0];

        if (formula && formula.charAt(0) === "+") {
          range.getCell(r + 1, 1).setValue("'" + formula);
          fixedCount++;
        } else if (String(val) === "#ERROR!" || String(val).indexOf("ERROR") !== -1) {
          if (formula) {
            range.getCell(r + 1, 1).setValue("'" + formula);
            fixedCount++;
          }
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert("✅ Phone number formatting fixed across all sheets!\nFixed " + fixedCount + " formula errors.");
}

function initializeAllProgramTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var programTabs = [
    "All_Leads",
    "Dominica",
    "UAE",
    "Grenada",
    "Greece",
    "Portugal",
    "Antigua_Barbuda",
    "Saint_Lucia",
    "St_Kitts",
    "Vanuatu",
    "Panama",
    "Nauru",
    "Sao_Tome",
    "Dubai_Real_Estate",
    "Educational_Advisory",
    "Eligibility_Checker",
    "General_Inquiries"
  ];

  for (var i = 0; i < programTabs.length; i++) {
    getOrCreateTab(ss, programTabs[i], [], LEAD_HEADERS);
  }

  getOrCreateTab(ss, CONFIG.PARTNER_TAB, [], [
    "Timestamp (UTC)", "Application ID", "Full Name", "Partner Type", "Company / Firm", "Job Title",
    "Country", "City", "Dial Code", "Phone (WhatsApp)", "Email Address", "Website / LinkedIn",
    "Programmes of Interest", "Est. Annual Referrals", "Heard From", "Confidential Message",
    "Language", "Source URL", "Status", "Confirmation Email Status"
  ]);

  getOrCreateTab(ss, CONFIG.EVENT_TAB, ["Webinar_Registrations"], [
    "Timestamp (UTC)", "Webinar ID", "Webinar Slug", "Full Name", "Dial Code", "Phone Number",
    "Email Address", "Country of Residence", "Questions / Notes", "Newsletter Opt-In",
    "Language", "Source URL", "Page Path", "Status", "Email Dispatch Status"
  ]);

  SpreadsheetApp.getUi().alert("✅ All program tabs have been created!");
}

function testEmailPermissions() {
  var quota = MailApp.getRemainingDailyQuota();
  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "✅ Sharif Group Master CRM — Test Alert",
    body: "Operational test.\nDaily Quota: " + quota
  });
  SpreadsheetApp.getUi().alert("✅ Test email sent to " + CONFIG.ADMIN_EMAIL);
}
