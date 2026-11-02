/**
 * ==============================================================================
 * SHARIF GROUP — 7-CATEGORY MASTER CRM & WEBHOOK (Google Apps Script)
 * ==============================================================================
 * Purpose:
 * Organizes ALL website inquiries into 7 clean, dedicated sheet tabs:
 * 
 *   1. Citizenship          ➔ All CBI programs (Dominica, Grenada, Antigua, Saint Lucia, St Kitts, Vanuatu, Nauru, Sao Tome, etc.)
 *   2. Residency            ➔ All Golden Visa & Residency programs (UAE Golden Visa, Greece, Portugal, Panama, etc.)
 *   3. Real Estate          ➔ Dubai Real Estate & Property investment leads
 *   4. Educational Advisory ➔ Global student & school advisory leads
 *   5. General Enquiries    ➔ Contact Us form & General inquiries
 *   6. Partnership          ➔ B2B Partner applications
 *   7. Event                ➔ Webinar & Live Session registrations
 * 
 * NOTE: Phone numbers are automatically escaped with a leading apostrophe (')
 * and formatted as Plain Text to prevent Google Sheets from evaluating "+..."
 * as a formula (which causes #ERROR!).
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  TAB_CITIZENSHIP: "Citizenship",
  TAB_RESIDENCY: "Residency",
  TAB_REAL_ESTATE: "Real Estate",
  TAB_EDUCATION: "Educational Advisory",
  TAB_GENERAL: "General Enquiries",
  TAB_PARTNERSHIP: "Partnership",
  TAB_EVENT: "Event",

  // Admin Notification Recipient
  ADMIN_EMAIL: "mohammad@sharifgroup.ae",
  SENDER_NAME: "Sharif Group CRM",
  REPLY_TO_EMAIL: "mohammad@sharifgroup.ae"
};

// Headers for Category Tabs (Citizenship, Residency, Real Estate, Education, General)
const CATEGORY_HEADERS = [
  "Timestamp (UTC)",
  "Full Name",
  "Email Address",
  "Phone Number",
  "Country / Residence",
  "Program / Route",
  "Language",
  "Notes & Details",
  "Source URL",
  "Page Path",
  "Form ID",
  "Email Status"
];

// Headers for Partnership Tab
const PARTNER_HEADERS = [
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
];

// Headers for Event Tab
const EVENT_HEADERS = [
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
    service: "Sharif Group 7-Category Master CRM",
    timestamp: new Date().toISOString(),
    dailyEmailQuotaRemaining: quota,
    adminNotificationEmail: CONFIG.ADMIN_EMAIL,
    tabs: [
      CONFIG.TAB_CITIZENSHIP,
      CONFIG.TAB_RESIDENCY,
      CONFIG.TAB_REAL_ESTATE,
      CONFIG.TAB_EDUCATION,
      CONFIG.TAB_GENERAL,
      CONFIG.TAB_PARTNERSHIP,
      CONFIG.TAB_EVENT
    ],
    instructions: "POST JSON or form data. Automatically routes to one of the 7 clean category tabs."
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

    // 1. Partnership Applications (Partnership tab)
    if (formId === "partner-application" || formId.indexOf("partner") !== -1) {
      var partnerResult = handlePartnerApplication(data);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(partnerResult)).setMimeType(ContentService.MimeType.JSON);
    }
    // 2. Event & Webinar Registrations (Event tab)
    else if (formId === "webinar-registration" || data.webinar_id || formId.indexOf("webinar") !== -1 || formId.indexOf("event") !== -1) {
      var webinarResult = handleWebinarRegistration(data);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(webinarResult)).setMimeType(ContentService.MimeType.JSON);
    }
    // 3. Category Leads (Citizenship, Residency, Real Estate, Educational Advisory, General Enquiries)
    else {
      var leadResult = handleCategoryLead(data);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(leadResult)).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    if (lock) lock.releaseLock();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==============================================================================
// 1. CATEGORY ROUTER (Citizenship, Residency, Real Estate, Education, General)
// ==============================================================================
function handleCategoryLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var nowUtc = new Date().toISOString();
  var leadName = (data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim() || "Website Client");
  var leadEmail = (data.email || "").toLowerCase().trim();
  
  // Safe phone escaping: Avoid #ERROR! formula evaluation in Google Sheets
  var rawPhone = (data.phone || (data.dialCode ? (data.dialCode + " " + (data.rawPhone || "")) : "")).trim();
  var cleanPhone = rawPhone.replace(/^'+/, "").trim();
  var safePhone = cleanPhone ? ("'" + cleanPhone) : "";

  var leadService = data.service || data.targetProgram || data.program || data.investmentRoute || "General Consultation";
  var leadCountry = data.country || data.residence || data.citizenship || "";
  
  // Extra metadata from eligibility checker or detailed questionnaires
  var extraDetails = [];
  if (data.citizenship && data.citizenship !== leadCountry) extraDetails.push("Citizenship: " + data.citizenship);
  if (data.residence && data.residence !== leadCountry) extraDetails.push("Residence: " + data.residence);
  if (data.familySize) extraDetails.push("Family: " + data.familySize);
  if (data.budgetTier) extraDetails.push("Budget: " + data.budgetTier);
  if (data.goals) extraDetails.push("Goals: " + data.goals);

  var baseNotes = (data.notes || data.message || data.confidentialNotes || "").trim();
  var leadNotes = baseNotes;
  if (extraDetails.length > 0) {
    leadNotes = (baseNotes ? baseNotes + "\n" : "") + "[" + extraDetails.join(" | ") + "]";
  }

  var leadLang = (data.lang || "en").toLowerCase();
  var sourceUrl = data.source || "";
  var pagePath = data.page || "";
  var formId = data.form_id || "consultation-lead";

  // Resolve to one of the 5 category tabs
  var targetTabName = resolveCategoryTabName(data);
  var emailStatus = "Pending";

  // Dispatch instant admin email alert to Mohammad
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "⚡ New Lead [" + targetTabName + "]: " + leadName + " (" + (leadService || "General") + " | " + leadLang.toUpperCase() + ")",
      body: "New Website Lead Received:\n\n" +
            "• Category Sheet Tab: " + targetTabName + "\n" +
            "• Full Name:          " + leadName + "\n" +
            "• Email Address:      " + (leadEmail || "Not provided") + "\n" +
            "• Phone Number:       " + (cleanPhone || "Not provided") + "\n" +
            "• Program / Route:    " + leadService + "\n" +
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

  // Save directly to the designated category sheet tab
  var sheet = getOrCreateTab(ss, targetTabName, CATEGORY_HEADERS);
  sheet.appendRow(row);

  return {
    status: "success",
    targetTab: targetTabName,
    message: "Inquiry saved to " + targetTabName + " tab.",
    emailStatus: emailStatus
  };
}

/**
 * Smart Category Resolver: Routes leads to Citizenship, Residency, Real Estate, Educational Advisory, or General Enquiries
 */
function resolveCategoryTabName(data) {
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

  // 1. Real Estate (checked first so property queries don't get mixed with residency)
  if (text.indexOf("realestate") !== -1 || text.indexOf("real estate") !== -1 ||
      text.indexOf("property") !== -1 || text.indexOf("off-plan") !== -1 ||
      text.indexOf("offplan") !== -1 || text.indexOf("عقارات") !== -1 ||
      text.indexOf("املاک") !== -1 || text.indexOf("ملک") !== -1 || text.indexOf("房产") !== -1) {
    return CONFIG.TAB_REAL_ESTATE;
  }

  // 2. Educational Advisory
  if (text.indexOf("educationaladvisory") !== -1 || text.indexOf("educational advisory") !== -1 ||
      text.indexOf("education") !== -1 || text.indexOf("school") !== -1 ||
      text.indexOf("university") !== -1 || text.indexOf("تحصیلی") !== -1 ||
      text.indexOf("تعليمي") !== -1 || text.indexOf("教育") !== -1) {
    return CONFIG.TAB_EDUCATION;
  }

  // 3. Citizenship (All CBI countries + keywords)
  if (text.indexOf("citizenship") !== -1 || text.indexOf("passport") !== -1 ||
      text.indexOf("cbi") !== -1 || text.indexOf("شهروندی") !== -1 ||
      text.indexOf("پاسپورت") !== -1 || text.indexOf("جنسية") !== -1 ||
      text.indexOf("جواز") !== -1 || text.indexOf("入籍") !== -1 || text.indexOf("护照") !== -1 ||
      text.indexOf("dominica") !== -1 || text.indexOf("دومینیکا") !== -1 || text.indexOf("دومينيكا") !== -1 || text.indexOf("多米尼克") !== -1 ||
      text.indexOf("grenada") !== -1 || text.indexOf("گرانادا") !== -1 || text.indexOf("غرينادا") !== -1 || text.indexOf("格林纳达") !== -1 ||
      text.indexOf("antigua") !== -1 || text.indexOf("آنتیگوا") !== -1 || text.indexOf("أنتيغوا") !== -1 || text.indexOf("安提瓜") !== -1 ||
      text.indexOf("stlucia") !== -1 || text.indexOf("st lucia") !== -1 || text.indexOf("saint lucia") !== -1 || text.indexOf("سنت لوسیا") !== -1 || text.indexOf("سانت لوسيا") !== -1 || text.indexOf("圣卢西亚") !== -1 ||
      text.indexOf("stkitts") !== -1 || text.indexOf("st kitts") !== -1 || text.indexOf("saint kitts") !== -1 || text.indexOf("سنت کیتس") !== -1 || text.indexOf("سانت كيتس") !== -1 || text.indexOf("圣基茨") !== -1 ||
      text.indexOf("vanuatu") !== -1 || text.indexOf("وانواتو") !== -1 || text.indexOf("فانواتو") !== -1 || text.indexOf("瓦努阿图") !== -1 ||
      text.indexOf("nauru") !== -1 || text.indexOf("نائورو") !== -1 || text.indexOf("ناورو") !== -1 || text.indexOf("瑙鲁") !== -1 ||
      text.indexOf("sao tome") !== -1 || text.indexOf("sao-tome") !== -1 || text.indexOf("سائوتومه") !== -1 || text.indexOf("ساو تومي") !== -1 || text.indexOf("圣多美") !== -1) {
    return CONFIG.TAB_CITIZENSHIP;
  }

  // 4. Residency (All RBI countries + Golden Visa keywords)
  if (text.indexOf("residency") !== -1 || text.indexOf("golden visa") !== -1 ||
      text.indexOf("golden-visa") !== -1 || text.indexOf("اقامت") !== -1 ||
      text.indexOf("إقامة") !== -1 || text.indexOf("ویزای طلایی") !== -1 ||
      text.indexOf("居留") !== -1 || text.indexOf("黄金签证") !== -1 ||
      text.indexOf("uae") !== -1 || text.indexOf("dubai") !== -1 || text.indexOf("امارات") !== -1 || text.indexOf("دبی") !== -1 || text.indexOf("دبي") !== -1 || text.indexOf("阿联酋") !== -1 ||
      text.indexOf("greece") !== -1 || text.indexOf("یونان") !== -1 || text.indexOf("اليونان") !== -1 || text.indexOf("希腊") !== -1 ||
      text.indexOf("portugal") !== -1 || text.indexOf("پرتغال") !== -1 || text.indexOf("البرتغال") !== -1 || text.indexOf("葡萄牙") !== -1 ||
      text.indexOf("panama") !== -1 || text.indexOf("پاناما") !== -1 || text.indexOf("بنما") !== -1 || text.indexOf("巴拿马") !== -1) {
    return CONFIG.TAB_RESIDENCY;
  }

  // 5. Default Fallback
  return CONFIG.TAB_GENERAL;
}

// ==============================================================================
// 2. PARTNERSHIP APPLICATIONS (Partnership Tab)
// ==============================================================================
function handlePartnerApplication(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.TAB_PARTNERSHIP, PARTNER_HEADERS);

  var nowUtc = new Date().toISOString();
  var appId = data.application_id || ("PAR-" + Utilities.getUuid().slice(0, 6).toUpperCase());
  var fullName = data.fullName || data.name || "Partner Applicant";
  var partnerType = data.partner_type || "";
  var company = data.company || "";
  var jobTitle = data.job_title || "";
  var country = data.country || "";
  var city = data.city || "";
  
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
            "• Job Title:      " + (jobTitle || "None") + "\n" +
            "• Email:          " + email + "\n" +
            "• Phone:          " + (dialCode ? dialCode + " " : "") + rawPhone + "\n" +
            "• Country/City:   " + country + (city ? ", " + city : "") + "\n" +
            "• Timestamp:      " + nowUtc + "\n\n" +
            "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) {}

  return { status: "success", tab: CONFIG.TAB_PARTNERSHIP, message: "Partner application submitted successfully." };
}

// ==============================================================================
// 3. EVENT & WEBINAR REGISTRATIONS (Event Tab)
// ==============================================================================
function handleWebinarRegistration(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.TAB_EVENT, EVENT_HEADERS);

  var nowUtc = new Date().toISOString();
  var webinarId = data.webinar_id || "WEB01";
  var webinarSlug = data.slug || "";
  var fullName = data.fullName || data.name || "Attendee";
  
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

  return { status: "success", tab: CONFIG.TAB_EVENT, message: "Registration recorded successfully." };
}

// ==============================================================================
// HELPER: GET OR AUTO-CREATE FORMATTED SHEET TAB
// ==============================================================================
function getOrCreateTab(ss, preferredName, headers) {
  // 1. Direct match
  var sheet = ss.getSheetByName(preferredName);
  if (sheet) return sheet;

  // 2. Space <-> Underscore interchangeability
  var altName = preferredName.indexOf(" ") !== -1 
    ? preferredName.replace(/ /g, "_") 
    : preferredName.replace(/_/g, " ");
  sheet = ss.getSheetByName(altName);
  if (sheet) return sheet;

  // 3. Flexible match across all existing sheets (case-insensitive, space/underscore, real state)
  var allSheets = ss.getSheets();
  var normalizedPreferred = preferredName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (var i = 0; i < allSheets.length; i++) {
    var existingSheet = allSheets[i];
    var existingName = existingSheet.getName();
    var normalizedExisting = existingName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    if (normalizedExisting === normalizedPreferred) {
      return existingSheet;
    }
    // Handle "realstate" vs "realestate"
    if ((normalizedPreferred.indexOf("realestate") !== -1 || normalizedPreferred.indexOf("realstate") !== -1) &&
        (normalizedExisting.indexOf("realestate") !== -1 || normalizedExisting.indexOf("realstate") !== -1)) {
      return existingSheet;
    }
    // Handle "generalenquir" vs "generalinquair"
    if (normalizedPreferred.indexOf("general") !== -1 && normalizedExisting.indexOf("general") !== -1) {
      return existingSheet;
    }
    // Handle "education"
    if (normalizedPreferred.indexOf("education") !== -1 && normalizedExisting.indexOf("education") !== -1) {
      return existingSheet;
    }
  }

  // 4. Create new tab if not found
  sheet = ss.insertSheet(preferredName);
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#070E1A")
    .setFontColor("#C5A880");
  sheet.setFrozenRows(1);

  // Set Plain Text format on columns to prevent formula parsing (#ERROR!)
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 100), headers.length).setNumberFormat("@");
  } catch (e) {}

  return sheet;
}

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
    .addItem("🛠️ Setup All 7 Clean Tabs", "initializeAll7Tabs")
    .addItem("🔧 Fix Existing Phone Number #ERROR! (Clean All)", "fixExistingPhoneErrors")
    .addItem("✉️ Send Test Admin Email Alert", "testEmailPermissions")
    .addToUi();
}

/**
 * Creates and formats the 7 Clean Category Tabs in the Spreadsheet
 */
function initializeAll7Tabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var categoryTabs = [
    CONFIG.TAB_CITIZENSHIP,
    CONFIG.TAB_RESIDENCY,
    CONFIG.TAB_REAL_ESTATE,
    CONFIG.TAB_EDUCATION,
    CONFIG.TAB_GENERAL
  ];

  for (var i = 0; i < categoryTabs.length; i++) {
    getOrCreateTab(ss, categoryTabs[i], CATEGORY_HEADERS);
  }

  getOrCreateTab(ss, CONFIG.TAB_PARTNERSHIP, PARTNER_HEADERS);
  getOrCreateTab(ss, CONFIG.TAB_EVENT, EVENT_HEADERS);

  // Auto clean phone columns
  try {
    fixExistingPhoneErrors();
  } catch (e) {}

  SpreadsheetApp.getUi().alert(
    "✅ All 7 Clean CRM Tabs are ready and formatted!\n\n" +
    "1. " + CONFIG.TAB_CITIZENSHIP + "\n" +
    "2. " + CONFIG.TAB_RESIDENCY + "\n" +
    "3. " + CONFIG.TAB_REAL_ESTATE + "\n" +
    "4. " + CONFIG.TAB_EDUCATION + "\n" +
    "5. " + CONFIG.TAB_GENERAL + "\n" +
    "6. " + CONFIG.TAB_PARTNERSHIP + "\n" +
    "7. " + CONFIG.TAB_EVENT
  );
}

/**
 * Traverses all sheets and permanently fixes any phone number with formula parse error #ERROR!
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
    
    var phoneCols = [];
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "").toLowerCase();
      if (h.indexOf("phone") !== -1 || h.indexOf("dial") !== -1 || h.indexOf("whatsapp") !== -1) {
        phoneCols.push(c + 1);
      }
    }

    for (var i = 0; i < phoneCols.length; i++) {
      var col = phoneCols[i];
      var range = sheet.getRange(2, col, lastRow - 1, 1);
      range.setNumberFormat("@");

      var formulas = range.getFormulas();
      var values = range.getValues();

      for (var r = 0; r < values.length; r++) {
        var formula = formulas[r][0];
        var val = values[r][0];
        var cell = sheet.getRange(2 + r, col);

        if (formula && (formula.charAt(0) === "+" || formula.charAt(0) === "=")) {
          var cleanVal = formula.replace(/^[+=]+/, "+").trim();
          cell.setValue("'" + cleanVal);
          fixedCount++;
        } else if (String(val) === "#ERROR!" || String(val).indexOf("ERROR") !== -1) {
          var txt = formula || String(cell.getFormula() || "");
          if (txt) {
            var cleanVal = txt.replace(/^[+=]+/, "+").trim();
            cell.setValue("'" + cleanVal);
            fixedCount++;
          }
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert("✅ Phone number formatting fixed across all sheets!\nFixed " + fixedCount + " formula errors.");
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
