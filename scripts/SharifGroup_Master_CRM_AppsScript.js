/**
 * ==============================================================================
 * SHARIF GROUP — 7-CATEGORY MASTER CRM & WEBHOOK (Google Apps Script)
 * ==============================================================================
 * Purpose:
 * Organizes ALL website inquiries into 7 clean, dedicated sheet tabs with
 * full questionnaire parameter tracking:
 * 
 *   1. General Enquiries    ➔ Home Page (#contact-portal-form) & Contact Us forms (General Queries)
 *   2. Citizenship          ➔ Dedicated CBI program pages (Dominica, Grenada, Antigua, Saint Lucia, St Kitts, Vanuatu, Nauru, Sao Tome, etc.)
 *                              Tracking: Investment Route, Budget, Family Members, Primary Objective, Planning Timeline
 *   3. Residency            ➔ Dedicated RBI & Golden Visa program pages (UAE Golden Visa, Greece, Portugal, Panama, etc.)
 *   4. Real Estate          ➔ Dedicated Dubai Real Estate & Property investment pages
 *   5. Educational Advisory ➔ Dedicated global student & school advisory pages
 *   6. Partnership          ➔ B2B Partner applications (Partner Type, Job Title, City, Programmes, Referrals, etc.)
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

  // Google Workspace Account Hosting this CRM Sheet
  SHEET_OWNER: "mohammad@sharifgroup.ae",

  // Admin Notification Alerts (Received at this address for all leads/applications)
  ADMIN_EMAIL: "contact@sharifgroup.ae",

  // Outgoing Sender & Client Communication
  SENDER_NAME: "Sharif Group",
  SENDER_EMAIL: "contact@sharifgroup.ae",
  REPLY_TO_EMAIL: "contact@sharifgroup.ae",

  // Auto-send instant confirmation receipt to client when they enter their email
  SEND_CLIENT_CONFIRMATION: true
};

// Full Headers for Category Tabs (Citizenship, Residency, Real Estate, Education, General)
const CATEGORY_HEADERS = [
  "Timestamp (UTC)",
  "Full Name",
  "Email Address",
  "Phone Number",
  "Nationality",
  "Country / Residence",
  "Program / Route",
  "Investment Route",
  "Approx Budget",
  "Family Members",
  "Primary Objective",
  "Planning Timeline",
  "Site Language",
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
  "Site Language",
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
  "Site Language",
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
    version: "2.2-qa-fixes",
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
    features: [
      "Exact Budget Range Mapping without substring collision",
      "Explicit Portugal CMVM Regulated Fund and Property Desk Route Mapping",
      "Non-blocking QA/TEST Lead Processing and 5s Rapid Submission Debounce",
      "Dynamic Partner Status vs Confirmation Email Column Alignment",
      "Automatic Phone #ERROR! Prevention (Plain text + leading apostrophe escape)",
      "Instant Admin Email Alerts with full dossier"
    ]
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

    // ── Anti-Abuse & Honeypot Traps (B4) ──────────────────────────────────────
    var isBotTrap = Boolean(
      (data.company_url && String(data.company_url).trim()) ||
      (data.website && String(data.website).trim() && formId !== "partner-application") ||
      (data.hp_check && String(data.hp_check).trim()) ||
      (data.hp_url && String(data.hp_url).trim()) ||
      (data.company && String(data.company).trim() && formId === "webinar-registration") ||
      (data.fax && String(data.fax).trim())
    );
    if (isBotTrap) {
      if (lock) lock.releaseLock();
      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", message: "Inquiry processed successfully." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Anti-Abuse Rate Limiting (B4: Max 5 submissions per 60s per email/identity) ──
    var leadEmail = String(data.email || "").toLowerCase().trim();
    var isTest = (
      leadEmail.indexOf("test") !== -1 ||
      leadEmail.indexOf("qa") !== -1 ||
      String(data.fullName || "").toLowerCase().indexOf("test") !== -1 ||
      Boolean(data.is_test)
    );

    if (leadEmail && !isTest) {
      var cache = CacheService.getScriptCache();
      var rateKey = "rate_limit_" + leadEmail.replace(/[^a-z0-9]/g, "").slice(0, 40);
      var currentRate = Number(cache.get(rateKey) || 0);
      if (currentRate >= 5) {
        if (lock) lock.releaseLock();
        return ContentService
          .createTextOutput(JSON.stringify({ status: "ignored_rate_limit", message: "Submission accepted for processing." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      cache.put(rateKey, String(currentRate + 1), 60);
    }

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

/**
 * Universal E.164 Phone Normalizer for Google Sheets (B3 / B4 / ITU-T max 3 digits)
 * - Converts Persian & Arabic numerals
 * - Prevents duplicate prefixes (+9393..., +971971...)
 * - Auto-repairs corrupt 4-digit prefixes (+9715 -> +971, +9198 -> +91)
 * - Strips leading trunk zeros (0783... -> 783..., 050... -> 50...)
 * - Prepends leading apostrophe (') so Google Sheets never evaluates #ERROR!
 */
const CRM_KNOWN_DIAL_CODES = [
  "+1-268", "+1-242", "+1-246", "+1-767", "+1-473", "+1-869", "+1-758", "+1-784", "+1-868",
  "+1268", "+1242", "+1246", "+1767", "+1473", "+1869", "+1758", "+1784", "+1868",
  "+971", "+972", "+973", "+974", "+975", "+976", "+977", "+961", "+962", "+963",
  "+964", "+965", "+966", "+967", "+968", "+992", "+993", "+994", "+995", "+996",
  "+998", "+852", "+853", "+855", "+856", "+880", "+886", "+351", "+352", "+353",
  "+354", "+355", "+356", "+357", "+358", "+359", "+370", "+371", "+372", "+373",
  "+374", "+375", "+376", "+377", "+378", "+379", "+380", "+381", "+382", "+385",
  "+386", "+387", "+389", "+420", "+421", "+423", "+501", "+502", "+503", "+504",
  "+505", "+506", "+507", "+509", "+591", "+592", "+593", "+595", "+597", "+598",
  "+670", "+673", "+674", "+675", "+676", "+677", "+678", "+679", "+680", "+685",
  "+686", "+688", "+691", "+692", "+211", "+212", "+213", "+216", "+218", "+220",
  "+221", "+222", "+223", "+224", "+225", "+226", "+227", "+228", "+229", "+230",
  "+231", "+232", "+233", "+234", "+235", "+236", "+237", "+238", "+239", "+240",
  "+241", "+242", "+243", "+244", "+245", "+248", "+249", "+250", "+251", "+252",
  "+253", "+254", "+255", "+256", "+257", "+258", "+260", "+261", "+262", "+263",
  "+264", "+265", "+266", "+267", "+268", "+269",
  "+90", "+91", "+92", "+93", "+94", "+95", "+98", "+81", "+82", "+84", "+86",
  "+60", "+61", "+62", "+63", "+64", "+65", "+66", "+51", "+52", "+53", "+54",
  "+55", "+56", "+57", "+58", "+40", "+41", "+43", "+44", "+45", "+46", "+47",
  "+48", "+49", "+30", "+31", "+32", "+33", "+34", "+36", "+39", "+20", "+27",
  "+1", "+7"
];

function normalizeCrmPhone(rawPhone, dialCode) {
  var s = String(rawPhone || "").trim().replace(/^'+/, "");
  var d = String(dialCode || "+971").trim().replace(/^'+/, "");
  if (d && d.indexOf("+") !== 0) d = "+" + d;

  var eastern = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹","٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  var latin   = ["0","1","2","3","4","5","6","7","8","9","0","1","2","3","4","5","6","7","8","9"];
  for (var i = 0; i < eastern.length; i++) {
    while (s.indexOf(eastern[i]) !== -1) s = s.replace(eastern[i], latin[i]);
    while (d.indexOf(eastern[i]) !== -1) d = d.replace(eastern[i], latin[i]);
  }

  // Auto-repair corrupt dial code (e.g. +9715 -> +971, +9198 -> +91)
  if (d) {
    for (var k = 0; k < CRM_KNOWN_DIAL_CODES.length; k++) {
      if (d.indexOf(CRM_KNOWN_DIAL_CODES[k]) === 0) {
        d = CRM_KNOWN_DIAL_CODES[k];
        break;
      }
    }
  }

  var clean = s.replace(/[^\d+]/g, "");
  if (clean.indexOf("00") === 0) clean = "+" + clean.slice(2);

  var matchedDial = "";
  if (clean.indexOf("+") === 0) {
    for (var j = 0; j < CRM_KNOWN_DIAL_CODES.length; j++) {
      if (clean.indexOf(CRM_KNOWN_DIAL_CODES[j]) === 0) {
        matchedDial = CRM_KNOWN_DIAL_CODES[j];
        clean = clean.slice(CRM_KNOWN_DIAL_CODES[j].length);
        break;
      }
    }
    if (!matchedDial) {
      var match = clean.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        matchedDial = match[1];
        clean = match[2];
      }
    }
  } else {
    // PRESERVE SELECTED CODE: Only strip if user retyped the selected country's own dial digits!
    if (d) {
      var dDigits = d.replace(/\D/g, "");
      if (dDigits && clean.indexOf(dDigits) === 0 && clean.length > dDigits.length + 5) {
        clean = clean.slice(dDigits.length);
      }
    }
  }

  if (matchedDial) {
    d = matchedDial;
  }

  clean = clean.replace(/^0+/, "");
  var localDigits = clean.replace(/\D/g, "");

  var finalDial = d || "+971";
  if (!localDigits) return s ? ("'" + s) : "";
  return "'" + finalDial + " " + localDigits;
}

// ==============================================================================
// 1. CATEGORY ROUTER (Citizenship, Residency, Real Estate, Education, General)
// ==============================================================================
function handleCategoryLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var nowUtc = new Date().toISOString();
  var leadName = (data.fullName || ((data.firstName || "") + " " + (data.lastName || "")).trim() || "Website Client");
  var leadEmail = (data.email || "").toLowerCase().trim();

  // Safe phone escaping: Avoid #ERROR! formula evaluation in Google Sheets (B3)
  var rawPhone = (data.whatsapp_e164 || data.phone || (data.dialCode ? (data.dialCode + " " + (data.rawPhone || "")) : "")).trim();
  var safePhone = normalizeCrmPhone(rawPhone, data.dialCode);
  var cleanPhone = safePhone.replace(/^'+/, "").trim();

  // Resolve target tab upfront so dedupe key is accurately scoped
  var targetTabName = resolveCategoryTabName(data);

  // Deduplication guard: Prevent accidental double-clicks within 5 seconds for same form
  // NOTE: Test submissions (QA / TEST in name or email) and unique inquiry IDs are NEVER blocked!
  var isTestSubmission = (
    leadName.toLowerCase().indexOf("test") !== -1 ||
    leadName.toLowerCase().indexOf("qa") !== -1 ||
    leadEmail.indexOf("test") !== -1 ||
    Boolean(data.is_test)
  );

  var cache = CacheService.getScriptCache();
  var dedupeIdentity = (data.inquiry_id || (leadEmail + "_" + (data.form_id || targetTabName)) || cleanPhone || leadName).toLowerCase().replace(/[^a-z0-9_]/g, "");

  if (!isTestSubmission && dedupeIdentity.length >= 3) {
    var dedupeKey = "lead_" + dedupeIdentity.slice(0, 45);
    if (cache.get(dedupeKey)) {
      return {
        status: "ignored_duplicate",
        targetTab: targetTabName,
        message: "Duplicate lead submission ignored (debounced within 5s)."
      };
    }
    cache.put(dedupeKey, "1", 5); // 5-second debounce lock
  }

  var leadNationality = (data.nationality || data.citizenship || "").trim();
  var leadResidence = (data.residence || data.country || "").trim();

  // Prevent UTC / GMT timezone strings from contaminating Country / Residence column
  if (leadResidence && (/^UTC[+-]/i.test(leadResidence) || /^GMT[+-]/i.test(leadResidence))) {
    if (!data.notes || data.notes.indexOf(leadResidence) === -1) {
      data.notes = (data.notes ? data.notes + " | " : "") + "Timezone: " + leadResidence;
    }
    leadResidence = "";
  }
  if (leadNationality && (/^UTC[+-]/i.test(leadNationality) || /^GMT[+-]/i.test(leadNationality))) {
    leadNationality = "";
  }
  var leadService = data.service || data.programChoice || data.targetProgram || data.program || "General Consultation";
  if (data.subProgram && leadService.indexOf(data.subProgram) === -1) {
    leadService += " (" + data.subProgram + ")";
  }

  // Education Advisory fields (B2 item 2)
  var studentAge = String(data.student_age || data.studentAgeGrade || data.studentAge || "").trim();
  var studyLevel = String(data.study_level || data.studyLevel || "").trim();
  var destination = String(data.destination || data.targetDestination || "").trim();
  var intake = String(data.intake || data.intakeTimeline || "").trim();

  // Social Responsibility fields (B2 item 3)
  var organization = String(data.organization || "").trim();
  var orgType = String(data.orgType || data.org_type || "").trim();
  var preferredDate = String(data.preferredDate || data.preferred_date || "").trim();
  var preferredMethod = String(data.preferredMethod || data.preferred_method || "").trim();

  // Dedicated citizenship & residency questionnaire parameters
  var investmentRoute = data.investmentRoute || data.route || "";
  var budget = data.budget || data.budgetTier || "";
  var familyMembers = data.familyMembers || data.family || data.familySize || "";
  var objective = data.objective || data.primaryObjective || (Array.isArray(data.goals) ? data.goals.join(", ") : (data.goals || ""));
  var timeline = data.timeline || data.planningTimeline || "";

  // Category tab resolved upfront for dedupe scoping and context mapping
  targetTabName = targetTabName || resolveCategoryTabName(data);

  if (targetTabName === CONFIG.TAB_EDUCATION || studentAge || studyLevel || destination || intake) {
    if (studyLevel && !investmentRoute) investmentRoute = studyLevel;
    if (destination && !objective) objective = destination;
    if (studentAge && !familyMembers) familyMembers = formatEducationAge(studentAge);
    if (intake && !timeline) timeline = formatEducationIntake(intake);
  }

  if (preferredDate && !timeline) {
    timeline = preferredDate; // Keep date intact without converting via formatTimeline
  }

  var friendlyRoute = formatRoute(investmentRoute);
  var friendlyBudget = formatBudget(budget);
  var friendlyFamily = formatFamily(familyMembers);
  var friendlyObjective = formatObjective(objective);
  var friendlyTimeline = preferredDate ? preferredDate : formatTimeline(timeline);

  // Site Language (B2 item 7) vs Client Preferred Contact Language
  var rawSiteLang = data.site_language || data.siteLanguage || "";
  var siteLang = rawSiteLang ? formatLanguage(rawSiteLang) : formatLanguage(data.lang || "en");
  var preferredLanguage = data.preferredLanguage || data.lang || "en";
  var friendlyLang = formatLanguage(preferredLanguage);

  var leadNotes = (data.notes || data.message || data.confidentialNotes || "").trim();
  var extraLeadNotes = [];
  if (organization) extraLeadNotes.push("Organization: " + organization + (orgType ? " (" + orgType + ")" : ""));
  if (preferredMethod) extraLeadNotes.push("Preferred Discussion Method: " + formatContactMethod(preferredMethod));
  if (studentAge || studyLevel || destination || intake) {
    extraLeadNotes.push("Educational Advisory Profile: " + [
      studentAge ? ("Age/Grade: " + formatEducationAge(studentAge)) : "",
      studyLevel ? ("Level: " + formatRoute(studyLevel)) : "",
      destination ? ("Target: " + formatObjective(destination)) : "",
      intake ? ("Intake: " + formatEducationIntake(intake)) : ""
    ].filter(Boolean).join(" | "));
  }
  if (data.address && leadNotes.indexOf(data.address) === -1) extraLeadNotes.push("Address: " + data.address);
  if (data.timezone && leadNotes.indexOf(data.timezone) === -1) extraLeadNotes.push("Timezone: " + data.timezone);

  if (extraLeadNotes.length > 0) {
    leadNotes = (leadNotes ? (leadNotes + "\n---\n") : "") + extraLeadNotes.join("\n");
  }

  var sourceUrl = data.source || "";
  var pagePath = data.page_path || data.page || "";
  var formId = data.form_id || "consultation-lead";

  var emailStatus = "Pending";

  // Dispatch instant admin email alert to contact@sharifgroup.ae
  try {
    sendSmartEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "⚡ New Lead [" + targetTabName + "]: " + leadName + " (" + (leadService || "General") + " | " + friendlyLang + ")",
      body: "New Website Lead Received:\n\n" +
        "• Category Sheet Tab:  " + targetTabName + "\n" +
        "• Full Name:           " + leadName + "\n" +
        "• Email Address:       " + (leadEmail || "Not provided") + "\n" +
        "• Phone Number:        " + (cleanPhone || "Not provided") + "\n" +
        "• Current Nationality: " + (leadNationality || "Not specified") + "\n" +
        "• Residence Country:   " + (leadResidence || "Not specified") + "\n" +
        "• Target Program:      " + leadService + "\n" +
        "• Investment Route:    " + (friendlyRoute || "Not specified") + "\n" +
        "• Approx. Budget:      " + (friendlyBudget || "Not specified") + "\n" +
        "• Family Members:      " + (friendlyFamily || "Not specified") + "\n" +
        "• Primary Objective:   " + (friendlyObjective || "Not specified") + "\n" +
        "• Planning Timeline:   " + (friendlyTimeline || "Not specified") + "\n" +
        "• Site Language:       " + siteLang + "\n" +
        "• Preferred Language:  " + friendlyLang + "\n" +
        "• Form ID:             " + formId + "\n" +
        "• Timestamp (UTC):     " + nowUtc + "\n" +
        "• Page:                " + (pagePath || sourceUrl) + "\n\n" +
        "----------------------------------------------------\n" +
        "CLIENT NOTES & DETAILS:\n" +
        "----------------------------------------------------\n" +
        (leadNotes || "None") + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
    emailStatus = "Admin alerted (" + CONFIG.ADMIN_EMAIL + ")";

    // Send instant confirmation receipt to client if email provided
    if (CONFIG.SEND_CLIENT_CONFIRMATION && leadEmail && leadEmail.indexOf("@") !== -1) {
      try {
        sendLeadConfirmationEmail(leadEmail, leadName, leadService, (data.lang || "en"));
        emailStatus += " + Client confirmed (" + leadEmail + ")";
      } catch (clientErr) {
        // Non-fatal client send error
      }
    }
  } catch (adminErr) {
    emailStatus = "Failed: " + adminErr.message;
  }

  var row = [
    nowUtc,
    leadName,
    leadEmail,
    safePhone,
    leadNationality,
    leadResidence,
    leadService,
    friendlyRoute,
    friendlyBudget,
    friendlyFamily,
    friendlyObjective,
    friendlyTimeline,
    siteLang,
    friendlyLang,
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
 * NOTE: Home Page and Contact Us forms are ALWAYS routed directly to General Enquiries / General Queries tab.
 */
function resolveCategoryTabName(data) {
  var formId = String(data.form_id || "").toLowerCase().trim();
  var page = String(data.page || "").toLowerCase().trim();
  var source = String(data.source || "").toLowerCase().trim();
  var targetTab = String(data.targetTab || "").toLowerCase().trim();

  // 1. Explicit targetTab overrides (passed directly from client or API)
  if (targetTab) {
    if (targetTab.indexOf("general") !== -1 || targetTab.indexOf("quer") !== -1 || targetTab.indexOf("enquir") !== -1) {
      return CONFIG.TAB_GENERAL;
    }
    if (targetTab.indexOf("residency") !== -1) {
      return CONFIG.TAB_RESIDENCY;
    }
    if (targetTab.indexOf("citizenship") !== -1) {
      return CONFIG.TAB_CITIZENSHIP;
    }
    if (targetTab.indexOf("real") !== -1 || targetTab.indexOf("property") !== -1) {
      return CONFIG.TAB_REAL_ESTATE;
    }
    if (targetTab.indexOf("education") !== -1) {
      return CONFIG.TAB_EDUCATION;
    }
  }

  // 2. Home Page Form -> ALWAYS route to General Enquiries (General Queries)
  // Match ONLY the root homepage, not sub-pages like /programs/.../index.html
  var isRootPage = (
    page === "" || page === "/" || page === "/index.html" ||
    page === "/fa" || page === "/fa/" || page === "/fa/index.html" ||
    page === "/ar" || page === "/ar/" || page === "/ar/index.html" ||
    page === "/zh" || page === "/zh/" || page === "/zh/index.html"
  );
  var isRootSource = (
    source.endsWith("sharifgroup.ae") || source.endsWith("sharifgroup.ae/") ||
    source.endsWith("sharifgroup.ae/index.html") ||
    source.endsWith("sharifgroup.ae/fa") || source.endsWith("sharifgroup.ae/fa/") || source.endsWith("sharifgroup.ae/fa/index.html") ||
    source.endsWith("sharifgroup.ae/ar") || source.endsWith("sharifgroup.ae/ar/") || source.endsWith("sharifgroup.ae/ar/index.html") ||
    source.endsWith("sharifgroup.ae/zh") || source.endsWith("sharifgroup.ae/zh/") || source.endsWith("sharifgroup.ae/zh/index.html")
  );
  var isHomePage = (formId === "contact-portal-form") || (isRootPage && (page !== "" || isRootSource));

  // 3. Contact Us Page Form -> ALWAYS route to General Enquiries (General Queries)
  var isContactPage = (
    page.indexOf("/contact") !== -1 || page.indexOf("contact.html") !== -1 ||
    source.indexOf("/contact") !== -1 || formId === "contact-form" || formId === "contact-us" ||
    (page.indexOf("contact") !== -1 && formId === "standalone-contact-form")
  );

  if (isHomePage || isContactPage) {
    return CONFIG.TAB_GENERAL;
  }

  // 4. Eligibility Checker Forms -> ALWAYS route to Citizenship (or Residency if user assessed for residency)
  if (
    page.indexOf("eligibility") !== -1 ||
    source.indexOf("eligibility") !== -1 ||
    formId.indexOf("eligibility") !== -1 ||
    formId === "onpage-lead-form"
  ) {
    var checkProgram = String(data.targetProgram || data.program || "").toLowerCase();
    if (checkProgram.indexOf("residency") !== -1 || checkProgram.indexOf("golden") !== -1) {
      return CONFIG.TAB_RESIDENCY;
    }
    return CONFIG.TAB_CITIZENSHIP;
  }

  // 5. Dedicated Page URL Path checks (Page URL defines the exact program domain!)
  if (page.indexOf("/residency") !== -1 || source.indexOf("/residency") !== -1) {
    return CONFIG.TAB_RESIDENCY;
  }
  if (page.indexOf("/citizenship") !== -1 || source.indexOf("/citizenship") !== -1) {
    return CONFIG.TAB_CITIZENSHIP;
  }
  if (page.indexOf("/realestate") !== -1 || source.indexOf("/realestate") !== -1) {
    return CONFIG.TAB_REAL_ESTATE;
  }
  if (page.indexOf("/educationaladvisory") !== -1 || source.indexOf("/educationaladvisory") !== -1) {
    return CONFIG.TAB_EDUCATION;
  }

  // 5. Program & Service tokens (Explicit program names take priority over generic words in user notes)
  var programText = (
    (data.program || "") + " " +
    (data.programChoice || "") + " " +
    (data.subProgram || "") + " " +
    (data.targetProgram || "") + " " +
    (data.service || "")
  ).toLowerCase();

  // Specific Residency Programs:
  if (
    programText.indexOf("portugal") !== -1 || programText.indexOf("پرتغال") !== -1 || programText.indexOf("البرتغال") !== -1 || programText.indexOf("葡萄牙") !== -1 ||
    programText.indexOf("greece") !== -1 || programText.indexOf("یونان") !== -1 || programText.indexOf("اليونان") !== -1 || programText.indexOf("希腊") !== -1 ||
    programText.indexOf("uae-gv") !== -1 || programText.indexOf("golden visa") !== -1 || programText.indexOf("golden-visa") !== -1 ||
    programText.indexOf("panama") !== -1 || programText.indexOf("پاناما") !== -1 || programText.indexOf("بنما") !== -1 || programText.indexOf("巴拿马") !== -1 ||
    programText.indexOf("residency") !== -1 || programText.indexOf("اقامت") !== -1 || programText.indexOf("إقامة") !== -1 || programText.indexOf("居留") !== -1
  ) {
    return CONFIG.TAB_RESIDENCY;
  }

  // Specific Citizenship Programs:
  if (
    programText.indexOf("dominica") !== -1 || programText.indexOf("دومینیکا") !== -1 || programText.indexOf("دومينيكا") !== -1 || programText.indexOf("多米尼克") !== -1 ||
    programText.indexOf("grenada") !== -1 || programText.indexOf("گرانادا") !== -1 || programText.indexOf("غرينادا") !== -1 || programText.indexOf("格林纳达") !== -1 ||
    programText.indexOf("antigua") !== -1 || programText.indexOf("آنتیگوا") !== -1 || programText.indexOf("أنتيغوا") !== -1 || programText.indexOf("安提瓜") !== -1 ||
    programText.indexOf("stlucia") !== -1 || programText.indexOf("st lucia") !== -1 || programText.indexOf("saint lucia") !== -1 || programText.indexOf("سنت لوسیا") !== -1 || programText.indexOf("سانت لوسيا") !== -1 || programText.indexOf("圣卢西亚") !== -1 ||
    programText.indexOf("stkitts") !== -1 || programText.indexOf("st kitts") !== -1 || programText.indexOf("saint kitts") !== -1 || programText.indexOf("سنت کیتس") !== -1 || programText.indexOf("سانت كيتس") !== -1 || programText.indexOf("圣基茨") !== -1 ||
    programText.indexOf("vanuatu") !== -1 || programText.indexOf("وانواتو") !== -1 || programText.indexOf("فانواتو") !== -1 || programText.indexOf("瓦努阿图") !== -1 ||
    programText.indexOf("nauru") !== -1 || programText.indexOf("نائورو") !== -1 || programText.indexOf("ناورو") !== -1 || programText.indexOf("瑙鲁") !== -1 ||
    programText.indexOf("sao tome") !== -1 || programText.indexOf("sao-tome") !== -1 || programText.indexOf("saotome") !== -1 || programText.indexOf("سائوتومه") !== -1 || programText.indexOf("ساو تومي") !== -1 || programText.indexOf("圣多美") !== -1 ||
    programText.indexOf("cbi") !== -1 || programText.indexOf("citizenship") !== -1 || programText.indexOf("passport") !== -1 ||
    programText.indexOf("شهروندی") !== -1 || programText.indexOf("پاسپورت") !== -1 || programText.indexOf("جنسية") !== -1 || programText.indexOf("جواز") !== -1 ||
    programText.indexOf("入籍") !== -1 || programText.indexOf("护照") !== -1
  ) {
    return CONFIG.TAB_CITIZENSHIP;
  }

  // Real Estate:
  if (
    programText.indexOf("realestate") !== -1 || programText.indexOf("real estate") !== -1 ||
    programText.indexOf("dubai-offplan") !== -1 || programText.indexOf("dubai-ready") !== -1 || programText.indexOf("commercial-re") !== -1 ||
    programText.indexOf("property") !== -1 || programText.indexOf("off-plan") !== -1 ||
    programText.indexOf("عقارات") !== -1 || programText.indexOf("املاک") !== -1 || programText.indexOf("ملک") !== -1 || programText.indexOf("房产") !== -1
  ) {
    return CONFIG.TAB_REAL_ESTATE;
  }

  // Educational Advisory:
  if (
    programText.indexOf("educationaladvisory") !== -1 || programText.indexOf("educational advisory") !== -1 ||
    programText.indexOf("boarding-schools") !== -1 || programText.indexOf("undergrad") !== -1 || programText.indexOf("postgrad") !== -1 ||
    programText.indexOf("education") !== -1 || programText.indexOf("school") !== -1 || programText.indexOf("university") !== -1 ||
    programText.indexOf("تحصیلی") !== -1 || programText.indexOf("تعليمي") !== -1 || programText.indexOf("教育") !== -1
  ) {
    return CONFIG.TAB_EDUCATION;
  }

  // 6. Broad text match (including notes, investmentRoute, page, source)
  var allText = (programText + " " + (data.investmentRoute || "") + " " + (data.page || "") + " " + (data.source || "") + " " + (data.notes || "")).toLowerCase();

  // Check country names first before generic words like "citizenship"
  if (
    allText.indexOf("portugal") !== -1 || allText.indexOf("پرتغال") !== -1 || allText.indexOf("البرتغال") !== -1 || allText.indexOf("葡萄牙") !== -1 ||
    allText.indexOf("greece") !== -1 || allText.indexOf("یونان") !== -1 || allText.indexOf("اليونان") !== -1 || allText.indexOf("希腊") !== -1 ||
    allText.indexOf("uae-gv") !== -1 || allText.indexOf("golden visa") !== -1 || allText.indexOf("golden-visa") !== -1 ||
    allText.indexOf("panama") !== -1 || allText.indexOf("پاناما") !== -1 || allText.indexOf("بنما") !== -1 || allText.indexOf("巴拿马") !== -1
  ) {
    return CONFIG.TAB_RESIDENCY;
  }

  if (
    allText.indexOf("dominica") !== -1 || allText.indexOf("grenada") !== -1 || allText.indexOf("antigua") !== -1 ||
    allText.indexOf("stlucia") !== -1 || allText.indexOf("st lucia") !== -1 || allText.indexOf("saint lucia") !== -1 ||
    allText.indexOf("stkitts") !== -1 || allText.indexOf("st kitts") !== -1 || allText.indexOf("saint kitts") !== -1 ||
    allText.indexOf("vanuatu") !== -1 || allText.indexOf("nauru") !== -1 || allText.indexOf("sao tome") !== -1 || allText.indexOf("saotome") !== -1
  ) {
    return CONFIG.TAB_CITIZENSHIP;
  }

  if (allText.indexOf("residency") !== -1 || allText.indexOf("اقامت") !== -1 || allText.indexOf("إقامة") !== -1 || allText.indexOf("居留") !== -1) {
    return CONFIG.TAB_RESIDENCY;
  }

  if (
    allText.indexOf("citizenship") !== -1 || allText.indexOf("passport") !== -1 || allText.indexOf("cbi") !== -1 ||
    allText.indexOf("شهروندی") !== -1 || allText.indexOf("پاسپورت") !== -1 || allText.indexOf("جنسية") !== -1 ||
    allText.indexOf("جواز") !== -1 || allText.indexOf("入籍") !== -1 || allText.indexOf("护照") !== -1
  ) {
    return CONFIG.TAB_CITIZENSHIP;
  }

  if (allText.indexOf("realestate") !== -1 || allText.indexOf("real estate") !== -1 || allText.indexOf("property") !== -1) {
    return CONFIG.TAB_REAL_ESTATE;
  }

  if (allText.indexOf("education") !== -1 || allText.indexOf("school") !== -1 || allText.indexOf("university") !== -1) {
    return CONFIG.TAB_EDUCATION;
  }

  // 7. Default Fallback
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
  var jobTitle = data.job_title || data.jobTitle || "";
  var country = data.country || "";
  var city = data.city || "";

  var dialCode = (data.dialCode || "").trim().replace(/^'+/, "");
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = normalizeCrmPhone(rawPhone, dialCode);
  var cleanPhone = safePhone.replace(/^'+/, "").trim();

  // Extract canonical dial code (max 3 digits) from normalized phone
  var resolvedDial = cleanPhone.indexOf(" ") !== -1 ? cleanPhone.split(" ")[0] : (dialCode ? (dialCode.indexOf("+") === 0 ? dialCode : "+" + dialCode) : "+971");
  for (var k = 0; k < CRM_KNOWN_DIAL_CODES.length; k++) {
    if (resolvedDial.indexOf(CRM_KNOWN_DIAL_CODES[k]) === 0) {
      resolvedDial = CRM_KNOWN_DIAL_CODES[k];
      break;
    }
  }
  var safeDialCode = resolvedDial ? ("'" + resolvedDial) : "'+971";

  var email = (data.email || "").toLowerCase().trim();

  // Deduplication guard: Prevent duplicate partner submissions within 5 seconds
  var isTestSubmission = (
    fullName.toLowerCase().indexOf("test") !== -1 ||
    fullName.toLowerCase().indexOf("qa") !== -1 ||
    email.indexOf("test") !== -1 ||
    Boolean(data.is_test)
  );

  var cache = CacheService.getScriptCache();
  var dedupeIdentity = (data.application_id || email || rawPhone.replace(/[^0-9]/g, "") || fullName).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!isTestSubmission && dedupeIdentity.length >= 3) {
    var dedupeKey = "partner_" + dedupeIdentity.slice(0, 45);
    if (cache.get(dedupeKey)) {
      return {
        status: "ignored_duplicate",
        tab: CONFIG.TAB_PARTNERSHIP,
        message: "Duplicate partner application ignored (debounced within 5s)."
      };
    }
    cache.put(dedupeKey, "1", 5);
  }

  var website = data.website || data.linkedin || "";
  var programmes = data.programmes || data.programs || "";
  var referrals = data.referrals_per_year || data.referrals || "";
  var heardFrom = data.heard_from || data.heardFrom || "";
  var message = data.message || data.notes || "";
  var preferredLanguage = data.preferredLanguage || data.lang || "en";
  var friendlyLang = formatLanguage(preferredLanguage);
  var rawSiteLang = data.site_language || data.siteLanguage || "";
  var siteLang = rawSiteLang ? formatLanguage(rawSiteLang) : formatLanguage(data.lang || "en");
  var source = data.source || "";

  var friendlyProgrammes = formatProgrammes(programmes);
  var friendlyReferrals = formatReferrals(referrals);
  var friendlyHeard = formatHeard(heardFrom);

  var emailStatus = "Not Sent (No Email)";
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendPartnerConfirmationEmail(email, fullName, appId, company, preferredLanguage);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  // Column Alignment: "Pending Review" lands under Status (for staff review), emailStatus lands under Confirmation Email Status
  sheet.appendRow([
    nowUtc,
    appId,
    fullName,
    partnerType,
    company,
    jobTitle,
    country,
    city,
    safeDialCode,
    safePhone,
    email,
    website,
    friendlyProgrammes,
    friendlyReferrals,
    friendlyHeard,
    message,
    siteLang,
    friendlyLang,
    source,
    "Pending Review",
    emailStatus
  ]);

  try {
    sendSmartEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🤝 New Partner Application: " + fullName + " (" + (company || "Individual") + ")",
      body: "New Partner Application Received:\n\n" +
        "• Application ID:          " + appId + "\n" +
        "• Full Name:               " + fullName + "\n" +
        "• Partner Type:            " + partnerType + "\n" +
        "• Company / Firm:          " + (company || "None (Individual)") + "\n" +
        "• Job Title / Role:        " + (jobTitle || "Not specified") + "\n" +
        "• Preferred Language:      " + friendlyLang + "\n" +
        "• Website / LinkedIn:      " + (website || "Not provided") + "\n" +
        "• Email Address:           " + email + "\n" +
        "• WhatsApp / Phone:        " + ((dialCode ? dialCode + " " : "") + rawPhone).trim() + "\n" +
        "• Country:                 " + country + "\n" +
        "• City:                    " + (city || "Not specified") + "\n" +
        "• Programmes of Interest:  " + (friendlyProgrammes || "All Programmes") + "\n" +
        "• Est. Annual Referrals:   " + (friendlyReferrals || "Not specified") + "\n" +
        "• Heard From:              " + (friendlyHeard || "Not specified") + "\n" +
        "• Timestamp (UTC):         " + nowUtc + "\n\n" +
        "----------------------------------------------------\n" +
        "CONFIDENTIAL MESSAGE:\n" +
        "----------------------------------------------------\n" +
        (message || "None") + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) { }

  return { status: "success", tab: CONFIG.TAB_PARTNERSHIP, message: "Partner application submitted successfully." };
}

// ==============================================================================
// 3. EVENT & WEBINAR REGISTRATIONS (Event Tab)
// ==============================================================================
function handleWebinarRegistration(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateTab(ss, CONFIG.TAB_EVENT, EVENT_HEADERS);

  var nowUtc = new Date().toISOString();
  var webinarId = data.webinar_id || data.webinarId || "WEB01";
  var webinarSlug = data.webinar_slug || data.webinarSlug || data.slug || "";
  var fullName = data.fullName || data.name || "Attendee";

  var dialCode = (data.dialCode || "").trim().replace(/^'+/, "");
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = normalizeCrmPhone(rawPhone, dialCode);
  var cleanPhone = safePhone.replace(/^'+/, "").trim();

  // Extract canonical dial code (max 3 digits) from normalized phone
  var resolvedDial = cleanPhone.indexOf(" ") !== -1 ? cleanPhone.split(" ")[0] : (dialCode ? (dialCode.indexOf("+") === 0 ? dialCode : "+" + dialCode) : "+971");
  for (var k = 0; k < CRM_KNOWN_DIAL_CODES.length; k++) {
    if (resolvedDial.indexOf(CRM_KNOWN_DIAL_CODES[k]) === 0) {
      resolvedDial = CRM_KNOWN_DIAL_CODES[k];
      break;
    }
  }
  var safeDialCode = resolvedDial ? ("'" + resolvedDial) : "'+971";

  var email = (data.email || "").toLowerCase().trim();

  // Deduplication guard: Prevent duplicate webinar submissions within 20 seconds
  var cache = CacheService.getScriptCache();
  var dedupeIdentity = (data.registration_id || (email + "_" + webinarId) || rawPhone.replace(/[^0-9]/g, "") || fullName).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (dedupeIdentity.length >= 3) {
    var dedupeKey = "event_" + dedupeIdentity.slice(0, 45);
    if (cache.get(dedupeKey)) {
      return {
        status: "ignored_duplicate",
        tab: CONFIG.TAB_EVENT,
        message: "Duplicate event registration ignored (debounced within 20s)."
      };
    }
    cache.put(dedupeKey, "1", 20);
  }

  var residence = data.residence_country || data.country || "";
  var question = data.question || "";
  var newsletter = data.newsletter_optin ? "Yes" : "No";
  var preferredLanguage = data.preferredLanguage || data.lang || "fa";
  var friendlyLang = formatLanguage(preferredLanguage);
  var rawSiteLang = data.site_language || data.siteLanguage || "";
  var siteLang = rawSiteLang ? formatLanguage(rawSiteLang) : formatLanguage(data.lang || "en");
  var source = data.source || "";
  var page = data.page_path || data.page || "";

  var emailStatus = "Not Sent (No Email Provided)";
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendWebinarConfirmationEmail(email, fullName, webinarId, preferredLanguage);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  sheet.appendRow([
    nowUtc,
    webinarId,
    webinarSlug,
    fullName,
    safeDialCode,
    safePhone,
    email,
    residence,
    question,
    newsletter,
    siteLang,
    friendlyLang,
    source,
    page,
    "Registered",
    emailStatus
  ]);

  try {
    sendSmartEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: "🔔 New Event Registration: " + fullName + " (" + webinarId + ")",
      body: "New Event Registration Received:\n\n" +
        "• Full Name:        " + fullName + "\n" +
        "• Email:            " + email + "\n" +
        "• Phone:            " + ((dialCode ? dialCode + " " : "") + rawPhone).trim() + "\n" +
        "• Country:          " + residence + "\n" +
        "• Webinar Session:  " + webinarId + "\n" +
        "• Language:         " + friendlyLang + "\n" +
        "• Timestamp:        " + nowUtc + "\n\n" +
        "View in Google Sheet:\n" + ss.getUrl()
    });
  } catch (adminErr) { }

  return { status: "success", tab: CONFIG.TAB_EVENT, message: "Registration recorded successfully." };
}

// ==============================================================================
// HELPER: VALUE FORMATTERS FOR CLEAN SPREADSHEET REPORTING
// ==============================================================================
function formatObjective(val) {
  if (!val) return "";
  var rawList = Array.isArray(val) ? val : String(val).split(/[,;|]/);
  var formatted = [];

  for (var i = 0; i < rawList.length; i++) {
    var s = String(rawList[i]).toLowerCase().trim();
    if (!s) continue;
    if (s === "mobility" || s === "global-mobility" || s.indexOf("mobility") !== -1 || s.indexOf("travel") !== -1) {
      formatted.push("Global Mobility & Visa-Free Travel");
    } else if (s === "security" || s === "plan-b" || s.indexOf("plan b") !== -1 || s.indexOf("passport") !== -1 || s.indexOf("security") !== -1) {
      formatted.push("Security & Second Passport (Plan B)");
    } else if (s === "tax" || s === "tax-optimization" || s.indexOf("tax") !== -1 || s.indexOf("wealth") !== -1) {
      formatted.push("Wealth Preservation & Tax Structuring");
    } else if (s === "family" || s === "family-future" || s.indexOf("family") !== -1 || s.indexOf("children") !== -1) {
      formatted.push("Security & Future for Children");
    } else if (s === "lifestyle" || s === "minimal-stay" || s.indexOf("presence") !== -1) {
      formatted.push("European Residence & Minimal Physical Presence");
    } else if (s.indexOf("eu-citizenship") !== -1 || s.indexOf("citizenship pathway") !== -1) {
      formatted.push("Pathway to EU Citizenship (5 Years)");
    } else if (s.indexOf("schengen") !== -1) {
      formatted.push("Visa-Free Schengen Mobility");
    } else if (s.indexOf("family-inclusion") !== -1) {
      formatted.push("Include Dependent Children & Parents");
    } else if (s.indexOf("tax-planning") !== -1) {
      formatted.push("International Tax & Wealth Planning");
    } else if (s === "rental-roi" || s.indexOf("yield") !== -1 || s.indexOf("roi") !== -1) {
      formatted.push("High Rental Yields & ROI");
    } else if (s === "capital-growth" || s.indexOf("capital") !== -1 || s.indexOf("appreciation") !== -1) {
      formatted.push("Long-Term Capital Appreciation");
    } else if (s === "golden-visa" || s.indexOf("golden visa") !== -1) {
      formatted.push("UAE 10-Year Golden Visa via Property");
    } else if (s === "holiday-home" || s.indexOf("holiday") !== -1 || s.indexOf("secondary") !== -1) {
      formatted.push("Holiday Home / Secondary Residence");
    } else if (s === "uk" || s.indexOf("united kingdom") !== -1) {
      formatted.push("United Kingdom (UK)");
    } else if (s === "switzerland" || s.indexOf("swiss") !== -1) {
      formatted.push("Switzerland");
    } else if (s === "eu-english" || s.indexOf("netherlands") !== -1 || s.indexOf("ireland") !== -1) {
      formatted.push("EU English-Taught Universities");
    } else if (s === "us-canada" || s.indexOf("us / canada") !== -1) {
      formatted.push("USA & Canada");
    } else if (s === "uae-branch" || s.indexOf("uae") !== -1) {
      formatted.push("UAE International Branch Campuses");
    } else {
      formatted.push(rawList[i].trim());
    }
  }

  var unique = [];
  for (var j = 0; j < formatted.length; j++) {
    if (unique.indexOf(formatted[j]) === -1) {
      unique.push(formatted[j]);
    }
  }
  return unique.length > 0 ? unique.join(", ") : String(val);
}

function formatTimeline(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  // Safe exact check to avoid mistaking dates containing '0' (e.g. 2026-11-20) for 0-3 months
  if (s === "immediate" || s.indexOf("immediate") !== -1 || s === "0-3" || s.indexOf("0-3") !== -1 || s.indexOf("0–3") !== -1) return "Immediately (0–3 months)";
  if (s === "short_term" || s.indexOf("short") !== -1 || s.indexOf("3-6") !== -1 || s.indexOf("3–6") !== -1) return "3–6 months";
  if (s === "planning" || s.indexOf("plan") !== -1 || s.indexOf("6-12") !== -1 || s.indexOf("6–12") !== -1) return "6–12 months";
  return String(val);
}

function formatEducationAge(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "prep_school" || s.indexOf("prep") !== -1 || s.indexOf("7-11") !== -1 || s.indexOf("7–11") !== -1) return "Ages 7–11 (Prep / Primary)";
  if (s === "senior_school" || s.indexOf("senior") !== -1 || s.indexOf("11-16") !== -1 || s.indexOf("11–16") !== -1) return "Ages 11–16 (Senior School / GCSE)";
  if (s === "sixth_form" || s.indexOf("sixth") !== -1 || s.indexOf("16-18") !== -1 || s.indexOf("16–18") !== -1) return "Ages 16–18 (Sixth Form / A-Levels / IB)";
  if (s === "university" || s.indexOf("18+") !== -1) return "Ages 18+ (University / Degree)";
  if (s === "adult" || s.indexOf("adult") !== -1 || s.indexOf("postgraduate") !== -1) return "Postgraduate / Adult Executive";
  return String(val);
}

function formatEducationIntake(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "sep-2026" || s.indexOf("sep-2026") !== -1 || s.indexOf("september 2026") !== -1) return "September 2026 Intake";
  if (s === "jan-2027" || s.indexOf("jan-2027") !== -1 || s.indexOf("january 2027") !== -1 || s.indexOf("spring 2027") !== -1) return "January / Spring 2027 Intake";
  if (s === "sep-2027" || s.indexOf("sep-2027") !== -1 || s.indexOf("september 2027") !== -1) return "September 2027 Intake";
  if (s === "future" || s.indexOf("2028") !== -1) return "2028 or Later";
  return String(val);
}

function formatContactMethod(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "phone" || s.indexOf("phone") !== -1 || s.indexOf("call") !== -1) return "Phone Call";
  if (s === "whatsapp" || s.indexOf("whatsapp") !== -1) return "WhatsApp";
  if (s === "zoom" || s.indexOf("zoom") !== -1 || s.indexOf("teams") !== -1 || s.indexOf("meeting") !== -1) return "Video Meeting (Zoom / Teams)";
  if (s === "email" || s.indexOf("email") !== -1) return "Email Correspondence";
  return String(val);
}

function formatFamily(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "single" || s.indexOf("single") !== -1) return "Single Applicant";
  if (s === "couple" || s.indexOf("spouse") !== -1) return "Applicant + Spouse";
  if (s === "family_small" || s.indexOf("small") !== -1 || s.indexOf("4") !== -1) return "Family up to 4";
  if (s === "family_large" || s.indexOf("large") !== -1 || s.indexOf("5") !== -1) return "Family of 5+";
  return String(val);
}

function formatBudget(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim().replace(/\s+/g, "");

  var exactMap = {
    // Caribbean CBI (USD)
    "under_100k": "$100,000 or under",
    "under100k": "$100,000 or under",
    "100_200k": "$100,000 – $200,000",
    "100k-200k": "$100,000 – $200,000",
    "100k200k": "$100,000 – $200,000",
    "100200k": "$100,000 – $200,000",
    "200_350k": "$200,000 – $350,000",
    "200k-350k": "$200,000 – $350,000",
    "200k350k": "$200,000 – $350,000",
    "200350k": "$200,000 – $350,000",
    "350_600k": "$350,000 – $600,000",
    "350k-600k": "$350,000 – $600,000",
    "350k600k": "$350,000 – $600,000",
    "350600k": "$350,000 – $600,000",
    "over_600k": "$600,000 or more",
    "over600k": "$600,000 or more",
    "600k+": "$600,000 or more",
    "600kplus": "$600,000 or more",
    "90k-100k": "$90,000 – $100,000",
    "100k-150k": "$100,000 – $150,000",
    "115k-150k": "$115,000 – $150,000",
    "130k-180k": "$130,000 – $180,000",
    "150k-200k": "$150,000 – $200,000",
    "180k-260k": "$180,000 – $260,000",
    "200k-250k": "$200,000 – $250,000",
    "230k-300k": "$230,000 – $300,000",
    "235k-300k": "$235,000 – $300,000",
    "240k-300k": "$240,000 – $300,000",
    "250k-350k": "$250,000 – $350,000",
    "260k-400k": "$260,000 – $400,000",
    "300k-400k": "$300,000 – $400,000",
    "300k-450k": "$300,000 – $450,000",
    "350k-500k": "$350,000 – $500,000",
    "300k-500k": "$300,000 – $500,000",
    "350k+": "$350,000+",
    "400k+": "$400,000+",
    "450k+": "$450,000+",
    "500k+": "$500,000+",
    // European RBI / Golden Visas (EUR)
    "250k-400k": "€250,000 – €400,000",
    "250k-500k": "€250,000 – €500,000",
    "400k-800k": "€400,000 – €800,000",
    "500k-750k": "€500,000 – €750,000",
    "750k-1m": "€750,000 – €1,000,000",
    "800k-1.5m": "€800,000 – €1,500,000",
    "1m+": "€1,000,000+",
    "1.5m+": "€1,500,000+",
    // Dubai Real Estate (AED)
    "1m-2m": "AED 1,000,000 – AED 2,000,000",
    "2m-3m": "AED 2,000,000 – AED 3,000,000",
    "2m-5m": "AED 2,000,000 – AED 5,000,000 (Golden Visa)",
    "3m-5m": "AED 3,000,000 – AED 5,000,000",
    "5m-10m": "AED 5,000,000 – AED 10,000,000",
    "10m+": "AED 10,000,000+",
    "2m+": "AED 2,000,000+",
    "aed2m+": "AED 2,000,000+",
    // Educational Advisory
    "under-15k": "Under €15,000 / yr (European Public Unis)",
    "15k-30k": "€15,000 – €30,000 / yr (Private / Direct Entry)",
    "18k-30k": "£18,000 – £30,000 / yr (UK Universities)",
    "30k-50k": "£30,000 – £50,000 / yr (UK Boarding & Russell Group)",
    "35k-50k": "£35,000 – £50,000 / yr (UK Boarding Schools)",
    "50k+": "£50,000+ / yr (Elite Swiss / UK Boarding Schools)",
    "80k-plus": "CHF 80,000+ / yr (Swiss Elite Boarding)"
  };

  if (exactMap[s]) {
    return exactMap[s];
  }

  // Already formatted string with currency symbols
  if (s.indexOf("$") !== -1 || s.indexOf("€") !== -1 || s.indexOf("£") !== -1 || s.indexOf("aed") !== -1 || s.indexOf("chf") !== -1) {
    return String(val).trim();
  }

  // Exact bounds fallback without collision
  if (s.indexOf("100_200") !== -1 || s.indexOf("100k-200") !== -1) return "$100,000 – $200,000";
  if (s.indexOf("200_350") !== -1 || s.indexOf("200k-350") !== -1) return "$200,000 – $350,000";
  if (s.indexOf("350_600") !== -1 || s.indexOf("350k-600") !== -1) return "$350,000 – $600,000";
  if (s.indexOf("over_600") !== -1 || s.indexOf("over600") !== -1 || s.indexOf("600k") !== -1) return "$600,000 or more";
  if (s.indexOf("under_100") !== -1 || s.indexOf("under100") !== -1) return "$100,000 or under";
  if (s.indexOf("500k-750") !== -1) return "€500,000 – €750,000";
  if (s.indexOf("750k-1m") !== -1) return "€750,000 – €1,000,000";
  if (s.indexOf("250k-500") !== -1) return "€250,000 – €500,000";
  if (s.indexOf("200k-250") !== -1) return "$200,000 – $250,000";
  if (s.indexOf("250k-350") !== -1) return "$250,000 – $350,000";
  if (s.indexOf("350k") !== -1) return "$350,000+";
  if (s.indexOf("1m-2m") !== -1) return "AED 1,000,000 – AED 2,000,000";
  if (s.indexOf("2m-5m") !== -1) return "AED 2,000,000 – AED 5,000,000 (Golden Visa)";
  if (s.indexOf("5m-10m") !== -1) return "AED 5,000,000 – AED 10,000,000";
  if (s.indexOf("10m") !== -1) return "AED 10,000,000+";

  return String(val);
}

function formatRoute(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();

  // Portugal RBI (Programme-specific CMVM regulated fund & EUR)
  if (s === "regulated-fund" || s.indexOf("regulated-fund") !== -1 || s.indexOf("investment fund") !== -1 || s.indexOf("cmvm") !== -1) return "CMVM Regulated Investment Fund (€500k)";
  if (s === "cultural-heritage" || s.indexOf("cultural") !== -1) return "Cultural Heritage / Arts (€250k)";
  if (s === "scientific-research" || s.indexOf("scientific") !== -1) return "Scientific Research (€500k)";
  if (s === "business-job-creation" || s.indexOf("job-creation") !== -1) return "Business & Job Creation (€500k)";

  // Greece Golden Visa
  if (s === "real-estate-250k" || (s.indexOf("250k") !== -1 && s.indexOf("greece") !== -1)) return "Commercial-to-Residential Conversion (€250k)";
  if (s === "real-estate-400k" || (s.indexOf("400k") !== -1 && s.indexOf("greece") !== -1)) return "Regional Property Investment (€400k)";
  if (s === "real-estate-800k" || (s.indexOf("800k") !== -1 && s.indexOf("greece") !== -1)) return "Prime Tier Property Investment (€800k)";

  // Panama Residency
  if (s.indexOf("qualified-investor") !== -1 || s.indexOf("panama-real-estate") !== -1) return "Real Estate Investment ($300k+)";
  if (s.indexOf("bank-deposit") !== -1) return "Fixed-Term Bank Deposit ($750k+)";

  // UAE Golden Visa
  if (s === "property-2m" || s.indexOf("uae-property") !== -1 || (s.indexOf("2m") !== -1 && s.indexOf("uae") !== -1)) return "Real Estate Purchase (AED 2M+)";

  // Real Estate (Property Desk - Human readable labels with AED)
  if (s === "ready-villas" || s.indexOf("ready") !== -1 || s.indexOf("villa") !== -1) return "Ready Homes & Luxury Villas";
  if (s === "golden-visa" || s.indexOf("golden-visa") !== -1) return "Golden Visa Property (AED 2M+)";
  if (s === "off-plan" || s.indexOf("off-plan") !== -1 || s.indexOf("offplan") !== -1) return "Off-Plan & High ROI Projects";
  if (s === "prime-penthouses" || s.indexOf("penthouse") !== -1) return "Prime Penthouses & Waterfront";
  if (s === "commercial" || s.indexOf("commercial") !== -1) return "Commercial & Retail Property";

  // Educational Advisory Study Levels
  if (s === "boarding-school" || s.indexOf("boarding") !== -1) return "Boarding School (UK / Switzerland)";
  if (s === "undergraduate" || s.indexOf("undergrad") !== -1) return "Undergraduate Degree (UK / EU)";
  if (s === "postgraduate" || s.indexOf("postgrad") !== -1 || s.indexOf("master") !== -1) return "Postgraduate / Master's / MBA";
  if (s === "foundation" || s.indexOf("foundation") !== -1) return "University Foundation / Pathway";
  if (s === "language-prep" || s.indexOf("language") !== -1) return "Language Immersion & Exam Prep";

  // Caribbean & Pacific CBI routes
  if (s === "edf-donation" || s.indexOf("edf") !== -1) return "Economic Diversification Fund ($200k+)";
  if (s === "ntf-donation" || s.indexOf("ntf") !== -1) return "National Transformation Fund ($235k+)";
  if (s === "ndf-donation" || s.indexOf("ndf") !== -1) return "National Development Fund ($230k+)";
  if (s === "nef-donation" || s.indexOf("nef") !== -1) return "National Economic Fund ($240k+)";
  if (s === "sisc-contribution" || s.indexOf("sisc") !== -1) return "Sustainable Island State Contribution ($250k+)";
  if (s === "dsp-donation" || s.indexOf("dsp") !== -1) return "Development Support Program ($130k+)";
  if (s === "climate-resilience" || s.indexOf("climate") !== -1) return "Climate Resilience Fund ($105k+)";
  if (s === "public-investment" || s.indexOf("infrastructure") !== -1) return "National Infrastructure Fund ($90k+)";
  if (s === "real-estate" || s.indexOf("property") !== -1 || s.indexOf("estate") !== -1) return "Approved Real Estate Project ($200k+)";
  if (s.indexOf("donation") !== -1 || s.indexOf("fund donation") !== -1) return "Government Fund Donation";

  return String(val);
}

function formatProgrammes(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "all") return "All Programmes (Citizenship & Residency)";
  if (s === "cbi") return "Citizenship by Investment (Caribbean & Vanuatu)";
  if (s === "rbi") return "Residency & Golden Visas (UAE, Greece, Portugal)";
  if (s === "realestate") return "Dubai Real Estate Investment";
  if (s === "education") return "Global Educational Advisory";
  return String(val);
}

function formatReferrals(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "1-5") return "1 – 5 clients / year";
  if (s === "5-15") return "5 – 15 clients / year";
  if (s === "15-30") return "15 – 30 clients / year";
  if (s === "30+") return "30+ clients / year";
  return String(val);
}

function formatHeard(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "search") return "Google / Online Search";
  if (s === "social") return "LinkedIn / Social Media";
  if (s === "referral") return "Referral / Industry Colleague";
  if (s === "event") return "Webinar / Event / Conference";
  if (s === "other") return "Other";
  return String(val);
}

function formatLanguage(val) {
  if (!val) return "English";
  var s = String(val).toLowerCase().trim();
  if (s === "en" || s === "english") return "English";
  if (s === "ar" || s === "arabic") return "Arabic (العربية)";
  if (s === "fa" || s === "farsi" || s === "persian") return "Persian (فارسی)";
  if (s === "ru" || s === "russian") return "Russian (Русский)";
  if (s === "fr" || s === "french") return "French (Français)";
  if (s === "hi" || s === "hindi" || s === "urdu") return "Hindi / Urdu";
  if (s === "es" || s === "spanish") return "Spanish (Español)";
  if (s === "zh" || s === "chinese") return "Chinese (中文)";
  return String(val);
}

// ==============================================================================
// HELPER: GET OR AUTO-CREATE/SYNC FORMATTED SHEET TAB
// ==============================================================================
function getOrCreateTab(ss, preferredName, headers) {
  var sheet = null;

  // 1. Direct match
  sheet = ss.getSheetByName(preferredName);

  // 1b. Direct alias match for General Enquiries / General Queries
  if (!sheet && preferredName === CONFIG.TAB_GENERAL) {
    sheet = ss.getSheetByName("General Queries") ||
      ss.getSheetByName("General_Queries") ||
      ss.getSheetByName("General Inquiries") ||
      ss.getSheetByName("General");
  }

  // 2. Space <-> Underscore interchangeability
  if (!sheet) {
    var altName = preferredName.indexOf(" ") !== -1
      ? preferredName.replace(/ /g, "_")
      : preferredName.replace(/_/g, " ");
    sheet = ss.getSheetByName(altName);
  }

  // 3. Flexible match across all existing sheets (case-insensitive, space/underscore, real state)
  if (!sheet) {
    var allSheets = ss.getSheets();
    var normalizedPreferred = preferredName.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (var i = 0; i < allSheets.length; i++) {
      var existingSheet = allSheets[i];
      var existingName = existingSheet.getName();
      var normalizedExisting = existingName.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (normalizedExisting === normalizedPreferred) {
        sheet = existingSheet;
        break;
      }
      if ((normalizedPreferred.indexOf("realestate") !== -1 || normalizedPreferred.indexOf("realstate") !== -1) &&
        (normalizedExisting.indexOf("realestate") !== -1 || normalizedExisting.indexOf("realstate") !== -1)) {
        sheet = existingSheet;
        break;
      }
      if (normalizedPreferred.indexOf("general") !== -1 && normalizedExisting.indexOf("general") !== -1) {
        sheet = existingSheet;
        break;
      }
      if (normalizedPreferred.indexOf("education") !== -1 && normalizedExisting.indexOf("education") !== -1) {
        sheet = existingSheet;
        break;
      }
    }
  }

  // 4. If sheet exists, check if row 1 headers need upgrade/sync
  if (sheet) {
    try {
      var curCols = sheet.getLastColumn();
      if (curCols < headers.length) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length)
          .setFontWeight("bold")
          .setBackground("#070E1A")
          .setFontColor("#C5A880");
        sheet.setFrozenRows(1);
      }
    } catch (syncErr) { }
    return sheet;
  }

  // 5. Create new tab if not found
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
  } catch (e) { }

  return sheet;
}

function sendWebinarConfirmationEmail(recipientEmail, recipientName, webinarId, lang) {
  var subject = (lang === "fa")
    ? "تاییدیه ثبت‌نام وبینار شریف گروپ | Sharif Group Webinar Confirmation"
    : "Sharif Group Webinar Confirmation | تاییدیه ثبت‌نام وبینار شریف گروپ";

  sendSmartEmail({
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
  sendSmartEmail({
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

/**
 * Smart Email Dispatcher:
 * Tries sending via GmailApp using the configured SENDER_EMAIL alias (contact@sharifgroup.ae)
 * if verified in the sheet owner's Gmail (mohammad@sharifgroup.ae).
 * If alias is not set up or throws, smoothly falls back to MailApp with replyTo: contact@sharifgroup.ae.
 */
function sendSmartEmail(options) {
  var to = options.to;

  // Anti-Spam Relay & RFC 5322 Email Validation (B4)
  var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!to || !emailRegex.test(to)) return false;

  var domain = (to.split("@")[1] || "").toLowerCase();
  var blockedDomains = ["mailinator.com", "guerrillamail.com", "tempmail.com", "example.com", "test.com", "localhost", "127.0.0.1"];
  if (blockedDomains.indexOf(domain) !== -1) return false;

  var subject = options.subject;
  var body = options.body || "";
  var name = options.name || CONFIG.SENDER_NAME;
  var replyTo = options.replyTo || CONFIG.REPLY_TO_EMAIL;
  var targetFrom = options.from || CONFIG.SENDER_EMAIL;

  var mailOptions = {
    name: name,
    replyTo: replyTo
  };
  if (options.htmlBody) {
    mailOptions.htmlBody = options.htmlBody;
  }

  var sent = false;
  try {
    var aliases = GmailApp.getAliases();
    var hasAlias = false;
    for (var i = 0; i < aliases.length; i++) {
      if (aliases[i].toLowerCase() === targetFrom.toLowerCase()) {
        hasAlias = true;
        break;
      }
    }
    if (hasAlias) {
      mailOptions.from = targetFrom;
      GmailApp.sendEmail(to, subject, body, mailOptions);
      sent = true;
    }
  } catch (aliasErr) {
    // If GmailApp alias lookup or sending fails, continue to MailApp fallback
  }

  if (!sent) {
    MailApp.sendEmail(to, subject, body, mailOptions);
  }
}

/**
 * Sends a luxury, branded confirmation email to the website client
 */
function sendLeadConfirmationEmail(leadEmail, leadName, leadService, lang) {
  if (!leadEmail || leadEmail.indexOf("@") === -1) return "No email provided";

  var isFa = (lang === "fa" || lang === "fa-ir" || lang === "persian" || lang === "dari");
  var isAr = (lang === "ar" || lang === "ar-ae" || lang === "arabic");

  var subject = isFa
    ? "تایید دریافت پیام شما در شریف گروپ دبی | Sharif Group Dubai"
    : (isAr
      ? "تأكيد استلام استفساركم لدى مجموعة شريف دبي | Sharif Group Dubai"
      : "Thank you for contacting Sharif Group Dubai | Confirmation");

  var htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B132B;color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #C5A880;">' +
    '<div style="background:#070E1A;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(197,168,128,0.3);">' +
    '  <h1 style="color:#C5A880;font-size:22px;margin:0;letter-spacing:1px;font-weight:700;">SHARIF GROUP</h1>' +
    '  <p style="color:#94A3B8;font-size:12px;margin:6px 0 0 0;letter-spacing:1px;text-transform:uppercase;">Private Client Advisory & Citizenship by Investment</p>' +
    '</div>' +
    '<div style="padding:32px 32px 24px 32px;color:#E2E8F0;font-size:15px;line-height:1.7;">' +
    (isFa
      ? ('<p style="direction:rtl;text-align:right;">سلام <strong>' + leadName + '</strong> گرامی،</p>' +
        '<p style="direction:rtl;text-align:right;">از پیام شما به شریف گروپ دبی درباره <strong>' + (leadService || 'مشاوره اختصاصی') + '</strong> سپاسگزاریم.</p>' +
        '<p style="direction:rtl;text-align:right;">مشاوران ارشد ما جزئیات درخواست شما را به صورت محرمانه بررسی نموده و ظرف حداکثر ۲۴ ساعت کاری با شما تماس خواهند گرفت.</p>')
      : (isAr
        ? ('<p style="direction:rtl;text-align:right;">مرحباً <strong>' + leadName + '</strong>،</p>' +
          '<p style="direction:rtl;text-align:right;">شكراً لتواصلكم مع مجموعة شريف دبي. تم استلام طلبكم بنجاح بخصوص <strong>' + (leadService || 'الاستشارة الخاصة') + '</strong>.</p>' +
          '<p style="direction:rtl;text-align:right;">سيقوم مستشارنا الخاص بمراجعة متطلباتكم والتواصل معكم خلال 24 ساعة عمل.</p>')
        : ('<p>Dear <strong>' + leadName + '</strong>,</p>' +
          '<p>Thank you for reaching out to <strong>Sharif Group Dubai</strong>. We have successfully received your inquiry regarding <strong>' + (leadService || 'Private Client Consultation') + '</strong>.</p>' +
          '<p>Our senior advisory team is reviewing your requirements under strict confidentiality and will reach out to you within 24 business hours.</p>'))) +
    '</div>' +
    '<div style="background:#070E1A;padding:20px 32px;border-top:1px solid rgba(197,168,128,0.2);text-align:center;font-size:12px;color:#94A3B8;line-height:1.6;">' +
    '  <strong style="color:#C5A880;">Sharif Group Dubai</strong> • 116 The Binary Tower, Business Bay, Dubai, UAE<br/>' +
    '  Email: <a href="mailto:contact@sharifgroup.ae" style="color:#C5A880;text-decoration:none;">contact@sharifgroup.ae</a> • ' +
    '  Website: <a href="https://sharifgroup.ae" style="color:#C5A880;text-decoration:none;">sharifgroup.ae</a>' +
    '</div>' +
    '</div>';

  sendSmartEmail({
    to: leadEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO_EMAIL
  });

  return "Confirmation sent to client (" + leadEmail + ")";
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⭐ Sharif Group CRM")
    .addItem("🛠️ Setup All 7 Clean Tabs", "initializeAll7Tabs")
    .addItem("🔧 Fix Existing Phone Number #ERROR! (Clean All)", "fixExistingPhoneErrors")
    .addItem("📊 Format Existing Budget & Nationality Cells", "fixExistingBudgetAndNationality")
    .addItem("📥 Migrate Leads from Old CRM Sheet", "migrateOldSheetLeadsPrompt")
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
    var catSheet = getOrCreateTab(ss, categoryTabs[i], CATEGORY_HEADERS);
    // Explicitly guarantee headers match the latest schema
    catSheet.getRange(1, 1, 1, CATEGORY_HEADERS.length).setValues([CATEGORY_HEADERS]);
    catSheet.getRange(1, 1, 1, CATEGORY_HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#070E1A")
      .setFontColor("#C5A880");
    catSheet.setFrozenRows(1);
    try {
      catSheet.getRange(1, 1, Math.max(catSheet.getMaxRows(), 100), CATEGORY_HEADERS.length).setNumberFormat("@");
    } catch (e) { }
  }

  var partSheet = getOrCreateTab(ss, CONFIG.TAB_PARTNERSHIP, PARTNER_HEADERS);
  partSheet.getRange(1, 1, 1, PARTNER_HEADERS.length).setValues([PARTNER_HEADERS]);
  partSheet.getRange(1, 1, 1, PARTNER_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#070E1A")
    .setFontColor("#C5A880");
  partSheet.setFrozenRows(1);
  try {
    partSheet.getRange(1, 1, Math.max(partSheet.getMaxRows(), 100), PARTNER_HEADERS.length).setNumberFormat("@");
  } catch (e) { }

  var eventSheet = getOrCreateTab(ss, CONFIG.TAB_EVENT, EVENT_HEADERS);
  eventSheet.getRange(1, 1, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]);
  eventSheet.getRange(1, 1, 1, EVENT_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#070E1A")
    .setFontColor("#C5A880");
  eventSheet.setFrozenRows(1);
  try {
    eventSheet.getRange(1, 1, Math.max(eventSheet.getMaxRows(), 100), EVENT_HEADERS.length).setNumberFormat("@");
  } catch (e) { }

  // Auto clean phone columns
  try {
    fixExistingPhoneErrors();
  } catch (e) { }

  SpreadsheetApp.getUi().alert(
    "✅ All 7 Clean CRM Tabs are ready and formatted with full questionnaire tracking!\n\n" +
    "1. " + CONFIG.TAB_CITIZENSHIP + " (with Investment Route, Budget, Family, Objective, Timeline)\n" +
    "2. " + CONFIG.TAB_RESIDENCY + "\n" +
    "3. " + CONFIG.TAB_REAL_ESTATE + "\n" +
    "4. " + CONFIG.TAB_EDUCATION + "\n" +
    "5. " + CONFIG.TAB_GENERAL + "\n" +
    "6. " + CONFIG.TAB_PARTNERSHIP + " (with Job Title, City, Preferred Language, Programmes, Referrals, Heard From)\n" +
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
      if (h.indexOf("phone") !== -1 || h.indexOf("dial") !== -1 || h.indexOf("whatsapp") !== -1 || h.indexOf("mobile") !== -1 || h.indexOf("tel") !== -1) {
        phoneCols.push(c + 1);
      }
    }

    for (var i = 0; i < phoneCols.length; i++) {
      var col = phoneCols[i];
      var range = sheet.getRange(2, col, lastRow - 1, 1);
      range.setNumberFormat("@");

      var formulas = range.getFormulas();
      var values = range.getValues();
      var allRowValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

      for (var r = 0; r < values.length; r++) {
        var formula = formulas[r][0];
        var val = values[r][0];
        var cell = sheet.getRange(2 + r, col);
        var rowVals = allRowValues[r] || [];

        var rawStr = String(formula || val || "").trim();
        if (!rawStr) continue;

        // Clean formula / equal / plus / apostrophe prefixes
        var cleanInput = rawStr.replace(/^[+=]+/, "+").replace(/^'+/, "").trim();
        if (!cleanInput) continue;

        // Check dial hint from row (e.g. dial column, country/residence/nationality column)
        var dialHint = "";
        for (var c = 0; c < headers.length; c++) {
          var h = String(headers[c] || "").toLowerCase();
          if (h.indexOf("dial") !== -1) {
            var dVal = String(rowVals[c] || "").trim().replace(/^'+/, "");
            if (dVal) { dialHint = dVal.indexOf("+") === 0 ? dVal : "+" + dVal; break; }
          }
          if (h.indexOf("country") !== -1 || h.indexOf("residence") !== -1 || h.indexOf("nationality") !== -1) {
            var cVal = String(rowVals[c] || "").toLowerCase();
            if (cVal.indexOf("united kingdom") !== -1 || cVal === "uk" || cVal === "gb" || cVal.indexOf("britain") !== -1) dialHint = "+44";
            else if (cVal.indexOf("united states") !== -1 || cVal === "usa" || cVal === "us" || cVal.indexOf("america") !== -1) dialHint = "+1";
            else if (cVal.indexOf("emirates") !== -1 || cVal === "uae" || cVal.indexOf("dubai") !== -1) dialHint = "+971";
            else if (cVal.indexOf("afghanistan") !== -1) dialHint = "+93";
          }
        }

        // Auto-recover misassigned +7 / +20 from testing
        if (dialHint === "+44" && cleanInput.indexOf("+7") === 0) {
          var dgt = cleanInput.replace(/\D/g, "").replace(/^7/, "");
          if (dgt.indexOf("7") !== 0) dgt = "7" + dgt;
          cleanInput = "+44 " + dgt;
        } else if (dialHint === "+1" && cleanInput.indexOf("+20") === 0) {
          var dgt = cleanInput.replace(/\D/g, "").replace(/^20/, "");
          if (dgt.indexOf("20") !== 0) dgt = "20" + dgt;
          cleanInput = "+1 " + dgt;
        }

        var normalized = normalizeCrmPhone(cleanInput, dialHint);
        var currentFormatted = String(val || "").trim().replace(/^'+/, "");
        var targetClean = normalized.replace(/^'+/, "").trim();

        if (formula && (formula.charAt(0) === "+" || formula.charAt(0) === "=")) {
          cell.setValue(normalized || ("'" + cleanInput));
          fixedCount++;
        } else if (String(val) === "#ERROR!" || String(val).indexOf("ERROR") !== -1) {
          cell.setValue(normalized || ("'" + cleanInput));
          fixedCount++;
        } else if (targetClean && currentFormatted !== targetClean) {
          cell.setValue(normalized);
          fixedCount++;
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert("✅ Phone number formatting fixed across all sheets!\nCleaned and normalized " + fixedCount + " phone entries (fixed #ERROR! formulas and corrected 4-digit prefixes).");
}

function testEmailPermissions() {
  var quota = MailApp.getRemainingDailyQuota();
  sendSmartEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "✅ Sharif Group Master CRM — Test Alert",
    body: "Operational test.\nDaily Quota: " + quota + "\nSender: " + CONFIG.SENDER_EMAIL + "\nRecipient: " + CONFIG.ADMIN_EMAIL
  });
  SpreadsheetApp.getUi().alert("✅ Test email sent to " + CONFIG.ADMIN_EMAIL);
}

/**
 * Migration Utility (B4): Moves leads from old "Sharif Group CRM 2026" sheet into Master Sheet
 */
function migrateOldSheetLeadsPrompt() {
  var ui = SpreadsheetApp.getUi();
  var prompt = ui.prompt(
    "📥 Migrate Historical Leads (B4)",
    "Enter the Google Sheet ID or URL of the old 'Sharif Group CRM 2026' sheet:",
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) return;
  var input = prompt.getResponseText().trim();
  if (!input) return;

  var sheetId = input;
  var m = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (m) sheetId = m[1];

  try {
    var sourceSs = SpreadsheetApp.openById(sheetId);
    var movedCount = migrateOldSheetLeads(sourceSs);
    ui.alert("✅ Migration Complete!\n\nSuccessfully migrated " + movedCount + " lead(s) into the Master CRM Sheet.");
  } catch (err) {
    ui.alert("❌ Migration Error:\n\n" + err.toString());
  }
}

function migrateOldSheetLeads(sourceSs) {
  var sheets = sourceSs.getSheets();
  var totalMigrated = 0;

  for (var s = 0; s < sheets.length; s++) {
    var srcSheet = sheets[s];
    var data = srcSheet.getDataRange().getValues();
    if (data.length <= 1) continue;

    var srcHeaders = data[0].map(function(h) { return String(h || "").toLowerCase().trim(); });

    var colMap = {};
    for (var c = 0; c < srcHeaders.length; c++) {
      var h = srcHeaders[c];
      if (h.indexOf("time") !== -1 || h.indexOf("date") !== -1) colMap.timestamp = c;
      if (h.indexOf("inquiry") !== -1 || h.indexOf("id") !== -1) colMap.inquiryId = c;
      if (h.indexOf("name") !== -1) colMap.name = c;
      if (h.indexOf("email") !== -1) colMap.email = c;
      if (h.indexOf("phone") !== -1 || h.indexOf("dial") !== -1) colMap.phone = c;
      if (h.indexOf("country") !== -1 || h.indexOf("residence") !== -1) colMap.country = c;
      if (h.indexOf("program") !== -1 || h.indexOf("service") !== -1) colMap.service = c;
      if (h.indexOf("lang") !== -1) colMap.lang = c;
      if (h.indexOf("note") !== -1 || h.indexOf("message") !== -1) colMap.notes = c;
    }

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var name = (colMap.name !== undefined ? row[colMap.name] : "") || "Lead";
      var email = (colMap.email !== undefined ? row[colMap.email] : "") || "";
      var phone = (colMap.phone !== undefined ? row[colMap.phone] : "") || "";
      var service = (colMap.service !== undefined ? row[colMap.service] : "") || "";

      if (!name && !email && !phone) continue;

      var leadObj = {
        fullName: name,
        email: email,
        phone: String(phone),
        service: service,
        country: (colMap.country !== undefined ? row[colMap.country] : ""),
        lang: (colMap.lang !== undefined ? row[colMap.lang] : "en"),
        notes: (colMap.notes !== undefined ? row[colMap.notes] : "Migrated from legacy sheet"),
        inquiry_id: (colMap.inquiryId !== undefined ? row[colMap.inquiryId] : "") || ("INQ-MIG-" + r),
        is_test: true // prevent external email dispatch during bulk migration
      };

      handleCategoryLead(leadObj);
      totalMigrated++;
    }
  }

  return totalMigrated;
}

/**
 * Traverses category sheets and cleans/formats raw budget codes and blank nationality cells
 */
function fixExistingBudgetAndNationality() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var budgetFixed = 0;
  var natFixed = 0;

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    var budgetCol = -1;
    var natCol = -1;
    var countryCol = -1;
    var notesCol = -1;
    var phoneCol = -1;

    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "").toLowerCase().trim();
      if (h.indexOf("budget") !== -1) budgetCol = c + 1;
      else if (h.indexOf("nationality") !== -1) natCol = c + 1;
      else if (h.indexOf("country") !== -1 || h.indexOf("residence") !== -1) countryCol = c + 1;
      else if (h.indexOf("note") !== -1 || h.indexOf("message") !== -1) notesCol = c + 1;
      else if (h.indexOf("phone") !== -1 || h.indexOf("whatsapp") !== -1) phoneCol = c + 1;
    }

    if (budgetCol === -1 && natCol === -1) continue;

    var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];

      // 1. Fix Budget cell if raw code or unformatted
      if (budgetCol !== -1) {
        var rawBudget = String(row[budgetCol - 1] || "").trim();
        if (rawBudget) {
          var formattedBudget = formatBudget(rawBudget);
          if (formattedBudget && formattedBudget !== rawBudget) {
            sheet.getRange(2 + r, budgetCol).setValue(formattedBudget);
            budgetFixed++;
          }
        }
      }

      // 2. Fix Nationality cell if blank
      if (natCol !== -1) {
        var rawNat = String(row[natCol - 1] || "").trim();
        if (!rawNat) {
          var derivedNat = "";
          // Check Country / Residence column
          if (countryCol !== -1) {
            var cVal = String(row[countryCol - 1] || "").trim();
            if (cVal) derivedNat = cVal;
          }
          // Check notes for nationality mentions
          if (!derivedNat && notesCol !== -1) {
            var nVal = String(row[notesCol - 1] || "").toLowerCase();
            if (nVal.indexOf("afghan") !== -1) derivedNat = "Afghanistan";
            else if (nVal.indexOf("iran") !== -1) derivedNat = "Iran";
            else if (nVal.indexOf("chin") !== -1) derivedNat = "China";
            else if (nVal.indexOf("arab") !== -1 || nVal.indexOf("uae") !== -1) derivedNat = "United Arab Emirates";
            else if (nVal.indexOf("syria") !== -1) derivedNat = "Syria";
            else if (nVal.indexOf("leban") !== -1) derivedNat = "Lebanon";
            else if (nVal.indexOf("egypt") !== -1) derivedNat = "Egypt";
            else if (nVal.indexOf("uk") !== -1 || nVal.indexOf("british") !== -1) derivedNat = "United Kingdom";
            else if (nVal.indexOf("usa") !== -1 || nVal.indexOf("american") !== -1) derivedNat = "United States";
          }
          // Check phone code
          if (!derivedNat && phoneCol !== -1) {
            var pVal = String(row[phoneCol - 1] || "").trim();
            if (pVal.indexOf("+93") === 0) derivedNat = "Afghanistan";
            else if (pVal.indexOf("+98") === 0) derivedNat = "Iran";
            else if (pVal.indexOf("+86") === 0) derivedNat = "China";
            else if (pVal.indexOf("+971") === 0) derivedNat = "United Arab Emirates";
            else if (pVal.indexOf("+44") === 0) derivedNat = "United Kingdom";
            else if (pVal.indexOf("+1") === 0) derivedNat = "United States";
            else if (pVal.indexOf("+20") === 0) derivedNat = "Egypt";
          }

          if (derivedNat) {
            sheet.getRange(2 + r, natCol).setValue(derivedNat);
            natFixed++;
          }
        }
      }
    }
  }

  SpreadsheetApp.getUi().alert("✅ Budget & Nationality format scan complete!\nFormatted " + budgetFixed + " budget cell(s) and recovered " + natFixed + " nationality cell(s).");
}
