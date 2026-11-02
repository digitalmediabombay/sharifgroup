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
    features: [
      "Dedicated Citizenship Questionnaire Columns (Route, Budget, Family, Objective, Timeline)",
      "Dedicated Partner Onboarding Columns (Job Title, City, Programmes, Referrals, Heard From)",
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

  // Deduplication guard: Prevent duplicate submissions within 20 seconds
  var cache = CacheService.getScriptCache();
  var dedupeIdentity = (data.inquiry_id || leadEmail || cleanPhone.replace(/[^0-9]/g, "") || leadName).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (dedupeIdentity.length >= 3) {
    var dedupeKey = "lead_" + dedupeIdentity.slice(0, 45);
    if (cache.get(dedupeKey)) {
      return {
        status: "ignored_duplicate",
        targetTab: resolveCategoryTabName(data),
        message: "Duplicate lead submission ignored (debounced within 20s)."
      };
    }
    cache.put(dedupeKey, "1", 20); // 20-second debounce lock
  }

  var leadNationality = (data.nationality || data.citizenship || "").trim();
  var leadResidence = (data.residence || data.country || "").trim();
  var leadService = data.service || data.programChoice || data.targetProgram || data.program || "General Consultation";
  if (data.subProgram && leadService.indexOf(data.subProgram) === -1) {
    leadService += " (" + data.subProgram + ")";
  }

  // Dedicated citizenship & residency questionnaire parameters
  var investmentRoute = data.investmentRoute || data.route || "";
  var budget = data.budget || data.budgetTier || "";
  var familyMembers = data.familyMembers || data.family || data.familySize || "";
  var objective = data.objective || data.primaryObjective || (Array.isArray(data.goals) ? data.goals.join(", ") : (data.goals || ""));
  var timeline = data.timeline || data.planningTimeline || "";

  var friendlyRoute = formatRoute(investmentRoute);
  var friendlyBudget = formatBudget(budget);
  var friendlyFamily = formatFamily(familyMembers);
  var friendlyObjective = formatObjective(objective);
  var friendlyTimeline = formatTimeline(timeline);

  var preferredLanguage = data.preferredLanguage || data.lang || "en";
  var friendlyLang = formatLanguage(preferredLanguage);
  var leadNotes = (data.notes || data.message || data.confidentialNotes || "").trim();
  var sourceUrl = data.source || "";
  var pagePath = data.page || "";
  var formId = data.form_id || "consultation-lead";

  // Resolve to one of the 5 category tabs
  var targetTabName = resolveCategoryTabName(data);
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

  // 4. Dedicated Page URL Path checks (Page URL defines the exact program domain!)
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
  var safeDialCode = dialCode ? ("'" + dialCode) : "";
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = rawPhone ? ("'" + rawPhone) : "";

  var email = (data.email || "").toLowerCase().trim();

  // Deduplication guard: Prevent duplicate partner submissions within 20 seconds
  var cache = CacheService.getScriptCache();
  var dedupeIdentity = (data.application_id || email || rawPhone.replace(/[^0-9]/g, "") || fullName).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (dedupeIdentity.length >= 3) {
    var dedupeKey = "partner_" + dedupeIdentity.slice(0, 45);
    if (cache.get(dedupeKey)) {
      return {
        status: "ignored_duplicate",
        tab: CONFIG.TAB_PARTNERSHIP,
        message: "Duplicate partner application ignored (debounced within 20s)."
      };
    }
    cache.put(dedupeKey, "1", 20);
  }

  var website = data.website || data.linkedin || "";
  var programmes = data.programmes || data.programs || "";
  var referrals = data.referrals_per_year || data.referrals || "";
  var heardFrom = data.heard_from || data.heardFrom || "";
  var message = data.message || data.notes || "";
  var preferredLanguage = data.preferredLanguage || data.lang || "en";
  var friendlyLang = formatLanguage(preferredLanguage);
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
  var webinarId = data.webinar_id || "WEB01";
  var webinarSlug = data.slug || "";
  var fullName = data.fullName || data.name || "Attendee";

  var dialCode = (data.dialCode || "").trim().replace(/^'+/, "");
  var safeDialCode = dialCode ? ("'" + dialCode) : "";
  var rawPhone = (data.whatsapp_e164 || data.phone || "").trim().replace(/^'+/, "");
  var safePhone = rawPhone ? ("'" + rawPhone) : "";

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
  var source = data.source || "";
  var page = data.page || "";

  var emailStatus = "Not Sent (No Email Provided)";
  if (email && email.indexOf("@") !== -1) {
    try {
      emailStatus = sendWebinarConfirmationEmail(email, fullName, webinarId, preferredLanguage);
    } catch (mailErr) {
      emailStatus = "Failed: " + mailErr.toString();
    }
  }

  sheet.appendRow([
    nowUtc, webinarId, webinarSlug, fullName, safeDialCode, safePhone,
    email, residence, question, newsletter, friendlyLang, source, page,
    "Registered", emailStatus
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
  var s = String(val).toLowerCase().trim();
  if (s === "global-mobility" || s.indexOf("mobility") !== -1 || s.indexOf("travel") !== -1) return "Global Mobility & Visa-Free Travel";
  if (s === "plan-b" || s.indexOf("plan b") !== -1 || s.indexOf("passport") !== -1) return "Secure Second Passport (Plan B)";
  if (s === "tax-optimization" || s.indexOf("tax") !== -1 || s.indexOf("wealth") !== -1) return "Wealth Preservation & Tax Structuring";
  if (s === "family-future" || s.indexOf("family") !== -1 || s.indexOf("children") !== -1) return "Security & Future for Children";
  return String(val);
}

function formatTimeline(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "immediate" || s.indexOf("immediate") !== -1 || s.indexOf("0") !== -1) return "Immediately (0–3 months)";
  if (s === "short_term" || s.indexOf("short") !== -1 || s.indexOf("3-6") !== -1 || s.indexOf("3–6") !== -1) return "3–6 months";
  if (s === "planning" || s.indexOf("plan") !== -1 || s.indexOf("6-12") !== -1 || s.indexOf("6–12") !== -1) return "6–12 months";
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
  var s = String(val).toLowerCase().trim();
  if (s === "200k-250k" || s.indexOf("200k") !== -1) return "$200,000 – $250,000";
  if (s === "250k-350k" || s.indexOf("250k") !== -1) return "$250,000 – $350,000";
  if (s === "350k+" || s.indexOf("350k") !== -1) return "$350,000+";
  return String(val);
}

function formatRoute(val) {
  if (!val) return "";
  var s = String(val).toLowerCase().trim();
  if (s === "edf-donation" || s.indexOf("edf") !== -1) return "Economic Diversification Fund ($200k+)";
  if (s === "ntf-donation" || s.indexOf("ntf") !== -1) return "National Transformation Fund ($235k+)";
  if (s === "ndf-donation" || s.indexOf("ndf") !== -1) return "National Development Fund ($230k+)";
  if (s === "nef-donation" || s.indexOf("nef") !== -1) return "National Economic Fund ($240k+)";
  if (s === "sisc-contribution" || s.indexOf("sisc") !== -1) return "Sustainable Island State Contribution ($250k+)";
  if (s === "dsp-donation" || s.indexOf("dsp") !== -1) return "Development Support Program ($130k+)";
  if (s === "climate-resilience" || s.indexOf("climate") !== -1) return "Climate Resilience Fund ($105k+)";
  if (s === "public-investment" || s.indexOf("infrastructure") !== -1) return "National Infrastructure Fund ($90k+)";
  if (s === "real-estate" || s.indexOf("property") !== -1 || s.indexOf("estate") !== -1) return "Approved Real Estate Project ($200k+)";
  if (s.indexOf("donation") !== -1 || s.indexOf("fund") !== -1) return "Government Fund Donation";
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

  var htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0B132B;color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #C5A880;">' +
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
  sendSmartEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: "✅ Sharif Group Master CRM — Test Alert",
    body: "Operational test.\nDaily Quota: " + quota + "\nSender: " + CONFIG.SENDER_EMAIL + "\nRecipient: " + CONFIG.ADMIN_EMAIL
  });
  SpreadsheetApp.getUi().alert("✅ Test email sent to " + CONFIG.ADMIN_EMAIL);
}
