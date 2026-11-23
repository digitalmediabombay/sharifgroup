# Sharif Group Dubai — Complete Project Updates & Fixes Report

> **Generated on:** 2026-11-21  
> **Repository:** `sharifgrp`  
> **Environment:** Production / cPanel & Google Apps Script CRM  
> **Languages Supported:** English (EN), Persian / Farsi (FA), Arabic (AR), Chinese (ZH)

---

## Executive Summary

This report documents all system updates, architectural improvements, bug fixes, and optimizations executed across the **Sharif Group Dubai** web portal, CMS engine, Google Sheets Master CRM, and cPanel production packages.

---

## 1. CRM & Form Processing Fixes

### 1.1 Phone Number Formatting & Google Sheets `#ERROR!` Fix
- **Issue:** Google Sheets evaluates cell entries starting with `+` (e.g. `+971...`) as mathematical formulas. Because spaces or text in phone numbers violate formula syntax, Google Sheets showed `#ERROR!` in the phone column.
- **Fix Implemented:**
  - Automated prefixing with a single apostrophe (`'`) in Google Apps Script and PHP handlers. Google Sheets renders `'` as Plain Text without displaying the apostrophe to users.
  - Set column number format explicitly to `@` (Plain Text).
  - Added dedicated auto-repair routine `fixExistingPhoneErrors()` to traverse all sheets and convert existing formula errors to plain text with a single click.

### 1.2 Phone Country Dial Code 4-Digit Bug & Selected Dial Code Preservation
- **Issues Addressed:**
  1. Dial codes were capturing 4 digits (e.g. `+9715 1234567` for UAE, `+9391 52923084` for Afghanistan) instead of standard 2–3 digit country dial codes (`+971`, `+93`).
  2. Selected dial codes (`+44`, `+1`) were erroneously overwritten with other countries (`+7`, `+20`) when users entered national numbers starting with matching digits (e.g. UK mobile `7...` matched Russia `+7`, and US area code `20...` matched Egypt `+20`).
- **Root Cause & Permanent Fix:**
  - Removed aggressive digit-based country code guessing on inputs without a leading `+`.
  - Enforced the golden rule: **The user's selected dropdown country code is strictly preserved.**
  - If a user selects `+44` (UK) and enters `7123456789`, the output is guaranteed to be `+44 7123456789`.
  - If a user selects `+1` (US) and enters `2015550123`, the output is guaranteed to be `+1 2015550123`.
  - If a user selects `+971` (UAE) and enters `501234567`, the output is guaranteed to be `+971 501234567`.
  - Only when an input explicitly begins with `+` (or `00`, e.g. in single-input forms like Eligibility Checker) does the international prefix override the default code.
  - Redundant re-typing of the *selected* country's own digits (e.g. typing `447123456789` when `+44` is selected) is cleanly stripped while retaining all national digits.
  - Upgraded `fixExistingPhoneErrors()` in Apps Script with row-level dial code hints (linking to Country/Residence/Nationality columns) to automatically clean both `#ERROR!` formula cells and misassigned test rows.

### 1.3 Lead Deduplication & Debounce Guards
- **Issue:** Repeated rapid submissions caused duplicate leads in the sheet.
- **Fix Implemented:**
  - Integrated 5-second to 20-second cache debounce lock (`CacheService.getScriptCache()`).
  - Added smart QA / Test bypass: Any lead containing `test`, `qa`, or `is_test: true` bypasses the debounce lock, allowing developers to test continuously without false duplicate rejections.

### 1.4 Timezone Leak Prevention
- **Issue:** Browser timezone strings (e.g. `UTC+04:00`, `GMT+5`) occasionally leaked into the Country / Residence column.
- **Fix Implemented:**
  - Regex filter detects `^UTC[+-]` and `^GMT[+-]` patterns, automatically diverting timezone data into client internal notes while preserving the actual country name.

### 1.5 7-Category Master CRM Architecture
- Unified all forms into 7 organized Google Sheets tabs:
  1. **General Enquiries:** Home page portal & contact forms
  2. **Citizenship:** Dominica, Grenada, Antigua & Barbuda, Saint Lucia, St. Kitts, Vanuatu, Nauru, São Tomé
  3. **Residency:** UAE Golden Visa, Greece, Portugal, Panama
  4. **Real Estate:** Dubai Property & Off-plan advisory
  5. **Educational Advisory:** Global school & university placement
  6. **Partnership:** B2B broker, agent, and institutional partners
  7. **Event:** Webinar registrations & live sessions

---

## 2. CMS & Blog Engine Fixes

### 2.1 Deleted Blog Persistence & Slider Synchronization
- **Issue:** Sample or deleted blogs continued to appear in blog sliders and home page feeds even after being deleted from the admin panel and hard refreshing the browser.
- **Fix Implemented:**
  - Synchronized `admin/blogs.html` and `admin/api/delete-blog.php` to update both `admin/api/published_content.json` and `assets/data/published_content.json`.
  - Added client-side deleted slug tracking and purge filtering in `assets/js/cms-live.js` and `blog/index.html` across all 4 language directories (`/blog/`, `/ar/blog/`, `/fa/blog/`, `/zh/blog/`).
  - Implemented dynamic cache-busting timestamps (`?v=timestamp`) on all CMS JSON fetches.

### 2.2 Blog Footer Canvas Background Video Missing
- **Issue:** Footer background video did not render on blog pages.
- **Fix Implemented:**
  - Updated `initFooterCanvasVideo()` in `assets/js/language-switcher.js`.
  - Resolved `data-src` as well as `src` attributes, normalized relative paths (`../assets/videos/`) to root-absolute paths (`/assets/videos/footer_bg_e58bba71.mp4`), appended source elements, and triggered `.load()` for immediate playback.

---

## 3. Events & Webinar Management Fixes

### 3.1 Upcoming Webinar Session & Date/Time Synchronization
- **Issue:** Static placeholder dates (e.g. October 29) appeared in webinar banners instead of the active scheduled live webinar session.
- **Fix Implemented:**
  - Synchronized active session `WEB02` ("A Second Passport for Afghans: Introducing the Dominica Programme", November 26, 2026, 20:00 GST / 16:00 UTC).
  - Added dynamic fallback logic in `assets/js/cms-live.js` and `assets/js/blog-webinar-banner.js` to resolve the nearest upcoming webinar from `sgcms_webinars.json`.
  - Ensured localized date/time formatting across all language cards.

---

## 4. SEO, Sitemap & Server Routing Fixes

### 4.1 Sitemap Protocol & Chrome XML Display
- **Issue:** Opening `/sitemap.xml` directly in Google Chrome / Chromium browsers showed plain unstyled text without visual formatting, and `/sitemap.xsl` had a redirection loop.
- **Fix Implemented:**
  - Implemented smart content-negotiation in `sitemap.php`:
    - **Human Web Browsers:** Serves an interactive, styled, searchable and filterable HTML table.
    - **Search Engines (Googlebot, Bingbot, Yandex):** Serves strict, valid XML Protocol 0.9 with `Content-Type: application/xml`.
  - Updated `.htaccess` with clean rewrite rules.
  - Removed circular redirect from `sitemap.xsl`.
  - Verified 536 indexed URLs with reciprocal `hreflang` alternates across EN, FA, AR, and ZH.

---

## 5. Technical Audit Tokens (T01–T44) Resolution Status

All 44 technical audit tickets/tokens from the Developer Handoff (`SharifGroup-Technical-Developer-Handoff-EN-Reviewed-2026-11-10.md`) were fully audited and resolved:

- **JS Syntax & Unexpected Token Errors (T07):** Cleaned orphan template fragments and unbalanced closures in `contact/index.html` across all 4 locales. All JS files pass strict `node -c` syntax compilation.
- **Core Form Robustness (T01–T06, T35, T39):** Confirmed server receipts, 10s bounded timeout recovery (`AbortController`), 5s/20s deduplication locks, E.164 phone normalization, past-date blocking, and progressive form reduction from 9–12 down to 4–5 mandatory fields with mobile `inputmode` and `autocomplete`.
- **Accessibility & Focus Traps (T16, T17, T18):** Programmatically associated all labels (`for`/`id`) across all 48 program pages, contact forms, and homepage portals. Implemented keyboard focus trapping and `inert` on mobile drawer.
- **Performance & Asset Payload (T08–T12, T41, T44):** Eliminated render-blocking font `@import`, split monolithic font bundles into locale-specific subsets, converted home & Dominica hero LCP to responsive `<picture>` WebP images, and extracted 3.15 MB embedded blog database into on-demand JSON datasets.
- **Multilingual Search & Alignment (T13–T15, T19, T20, T23, T24, T36):** Full 195-country dial code selector with native Persian/Arabic aliases, active language dataset loading, self-referencing canonical article schemas, and deep-linking education exploration CTAs.
- **Security & SEO Architecture (T28–T34, T38, T40, T42, T43):** Hardened CSP headers in `.htaccess`, sensitive admin file access protection, canonical non-www URLs, ICS calendar HTTPS links, and complete 536+ URL multilingual sitemap with pre-rendered Event & Partner pages.

---

## 6. Deployment Files & Packages

| Package | Path | Size | Description |
|---|---|---|---|
| **Changed Only Zip** | `cpanel_update_only_changed_files.zip` | ~4.01 MB | Contains only modified core files (PHP APIs, JS apps, stylesheets, sitemap, HTML templates) |
| **Complete Update Zip** | `cpanel_complete_update.zip` | ~16.12 MB | Full production archive ready for root extraction into `public_html` |
| **Master CRM Apps Script** | `scripts/SharifGroup_Master_CRM_AppsScript.js` | ~78 KB | Complete Google Apps Script code for Google Sheets |

---

## 6. Action Checklist for Google Sheets Maintenance

1. **Deploy New Apps Script:**
   - Copy code from `scripts/GoogleAppsScript_Webinar_CRM.js` (or `scripts/SharifGroup_Master_CRM_AppsScript.js`).
   - In Google Sheets: **Extensions > Apps Script > Paste & Save (Ctrl+S)**.
   - Click **Deploy > Manage deployments > Edit > New version > Deploy**.
2. **Clean Historical Sheet Rows:**
   - Refresh the Google Sheet.
   - Click **⭐ Sharif Group CRM > 🔧 Fix Existing Phone Number #ERROR! (Clean All)** to normalize all past numbers with 4-digit prefixes (`+9715`, `+9391`) and formula errors.
   - Click **⭐ Sharif Group CRM > 📊 Format Existing Budget & Nationality Cells** to automatically format raw budget codes (`350_600k` ➔ `$350,000 – $600,000`, `over_600k` ➔ `$600,000 or more`, etc.) and recover missing nationality cells.

---

## 7. Eligibility Checker Budget & Nationality Bug Fix (Rows 23–27)

### Issues Reported
1. **EN:** `USD 100k–200k` became `USD 200k–250k`.
2. **AR:** `USD 200k–350k` became `USD 350k+`.
3. **FA & ZH:** Stored raw internal codes (`350_600k` and `over_600k`).
4. **All 4 Languages:** `Nationality` column was completely blank.

### Root Cause Analysis
1. **Budget Range Corruption:**
   In Google Apps Script (`scripts/GoogleAppsScript_Webinar_CRM.js`), `formatBudget()` previously used greedy substring matching:
   ```javascript
   if (s === "200k-250k" || s.indexOf("200k") !== -1) return "$200,000 – $250,000";
   if (s === "250k-350k" || s.indexOf("250k") !== -1) return "$250,000 – $350,000";
   if (s === "350k+" || s.indexOf("350k") !== -1) return "$350,000+";
   ```
   - Range `100_200k` contained substring `"200k"` ➔ matched and falsely returned `"$200,000 – $250,000"`.
   - Range `200_350k` contained substring `"350k"` ➔ matched and falsely returned `"$350,000+"`.
   - Ranges `350_600k` and `over_600k` had no matching rule and returned raw strings.

2. **Blank Nationality Column:**
   - In `api/contact.php`, `$nationality` and `$residence` were not extracted or included in `$crmPayload` sent to Google Sheets webhook.
   - In `eligibilitychecker/index.html` (EN, AR, FA, ZH), fallback values directly from DOM element `#cbi_citizenship` were added to guarantee capture even if modal opened before state calculation.

### Fixes Applied
1. **Google Apps Script `formatBudget()`:** Replaced with an exhaustive exact key dictionary mapping `under_100k`, `100_200k`, `200_350k`, `350_600k`, `over_600k`, plus all Caribbean, European RBI, and Dubai Real Estate tiers with zero substring collision risk.
2. **API Payload Forwarding:** Added `$nationality`, `$citizenship`, and `$residence` to `$crmPayload` in `api/contact.php`.
3. **Frontend Fallback:** Added explicit DOM selector fallbacks in all 4 language versions of `eligibilitychecker/index.html`.
4. **CRM Cleanup Tool:** Added `fixExistingBudgetAndNationality()` under `⭐ Sharif Group CRM` menu to repair historical rows with 1 click.
5. **Rebuilt Deployment Archives:** Updated `cpanel_update_only_changed_files.zip` (4.02 MB) and `cpanel_complete_update.zip` (16.12 MB).

---

## 8. Portugal Residency Route & Currency Resolution (Row 9)

### Issues Reported
In **Residency Tab Row 9** (Portugal ZH lead):
1. **Budget:** `EUR 250k–500k` was stored as `USD 250k–350k` (`$250,000 – $350,000`).
2. **Investment Route:** `CMVM-regulated fund` (`regulated-fund`) was stored as `“Government Fund Donation”`.
3. The original raw codes (`Route: regulated-fund | Budget: 250k-500k`) survived intact in the **Client Notes** column.

### Root Cause
The client's active Google Sheets was executing code from an earlier legacy file (`scripts/GoogleAppsScript_Webinar_CRM.js`) rather than the Master CRM:
1. `formatRoute()` in the legacy file had a fallback:
   `if (s.indexOf("donation") !== -1 || s.indexOf("fund") !== -1) return "Government Fund Donation";`
   Because `"regulated-fund"` contains `"fund"`, it was misclassified as a Caribbean Government Fund Donation!
2. `formatBudget()` in the legacy file checked `s.indexOf("250k")` before checking exact ranges, turning `250k-500k` EUR into `$250,000 – $350,000` USD.

### Resolution & Script Unification
1. **Master Script Clarification:**
   `scripts/SharifGroup_Master_CRM_AppsScript.js` is the **single authoritative Master CRM script**.
2. **Zero-Drift Synchronization:**
   `scripts/GoogleAppsScript_Webinar_CRM.js` has been overwritten to be an exact duplicate copy of `SharifGroup_Master_CRM_AppsScript.js`. Regardless of which file is opened, copied, or deployed, it runs the exact same Master CRM code.
3. **Surviving Notes Recovery Feature:**
   Enhanced `fixExistingBudgetAndNationality()` under the `⭐ Sharif Group CRM` menu to parse surviving `Route: <code>` and `Budget: <code>` tags from Client Notes. Clicking this option in Google Sheets automatically restores Row 9 to:
   - **Route:** `CMVM Regulated Investment Fund (€500k)`
   - **Budget:** `€250,000 – €500,000`

---

## 9. Educational Advisory Field Forwarding & Budget Currency Fix (AR & ZH Rows 7–8)

### Issues Reported
In **Educational Advisory Tab Rows 7–8** (AR and ZH leads):
1. **Missing Data in Sheet Row:** `Nationality`, `age/grade`, `study level`, `destination`, and `intake` did not reach the row.
2. **Missing Currency Symbols:** Budgets lost `£` (GBP) for AR (`18k-30k` / `35k-50k`) and `CHF` for ZH (`80k-plus`).
3. **Arabic Success Message Conflict:** AR on-page text promised both "within 2 hours" (خلال ساعتين) and "within 24 business hours" (خلال 24 ساعة عمل).

### Root Causes
1. **Form Field Normalization Gap:**
   In `assets/js/forms.js` and `api/contact.php`, educational advisory inputs (`studyLevel`, `studentAgeGrade`, `targetDestination`, `intakeTimeline`) were extracted under education-specific keys but were not mirrored into the category standard questionnaire fields (`investmentRoute`, `familyMembers`, `objective`, `timeline`). Consequently, Google Sheets received empty values for those standard category columns.
2. **Budget Map Omission for Education Currencies:**
   `formatBudget()` did not have explicit fallbacks for `18k-30k` (GBP), `35k-50k` (GBP), and `80k-plus` (CHF), causing them to fall back to raw key strings without currency symbols.
3. **Locale Inconsistency:**
   `ar/educationaladvisory/index.html` lines 2493 & 2613 hardcoded "خلال ساعتين" (within 2 hours), while `forms.js` returned the standardized "خلال 24 ساعة عمل" (within 24 business hours).

### Fixes Applied
1. **Frontend (`assets/js/forms.js`):**
   - Automatically aliases `student_age` ➔ `familyMembers`, `study_level` ➔ `investmentRoute`, `destination` ➔ `objective`, and `intake` ➔ `timeline`.
   - Added educational metadata (`Age/Grade:`, `Study Level:`, `Destination:`, `Intake:`, `Nationality:`) to `[Details]` in Client Notes.
2. **Backend API (`api/contact.php`):**
   - Ensures `$investmentRoute`, `$familyMembers`, `$objective`, and `$timeline` fallback to education fields so all Google Apps Script consumers receive fully populated data.
3. **Master CRM Script (`scripts/SharifGroup_Master_CRM_AppsScript.js` & `scripts/GoogleAppsScript_Webinar_CRM.js`):**
   - Mapped study levels (`bachelor-degree`, `master-degree`, `boarding-school`, `foundation-program`) in `formatRoute()`.
   - Mapped age brackets (`prep_school`, `middle_school`, `high_school`, `undergraduate_grad`) in `formatEducationAge()`.
   - Mapped destinations (`uk`, `switzerland`, `germany`, `netherlands`, `france`, `italy-spain`, `undecided`) in `formatObjective()`.
   - Mapped intakes (`sep-2026`, `jan-2027`, `sep-2027`, `2028-beyond`) in `formatEducationIntake()`.
   - Added explicit mappings for GBP (`£18,000 – £30,000 / yr`, `£35,000 – £50,000 / yr`) and CHF (`CHF 80,000+ / yr`) in `formatBudget()`.
   - Upgraded `fixExistingBudgetAndNationality()` to auto-recover missing age, level, destination, intake, nationality, and currencies on historical Educational Advisory rows (Rows 7–8).
4. **On-Page Arabic / Multilingual Timing Resolution:**
   - Unified `ar/educationaladvisory/index.html` (lines 2493, 2613), `zh/educationaladvisory/index.html` (line 2614), and `fa/educationaladvisory/index.html` (line 2613) to **24 business hours** across the board.

---

## 10. Real Estate Objective Collision, Currency, and Timing Resolution (EN & FA Rows 6–7)

### Issues Reported
In **Real Estate Tab Rows 6–7** (EN & FA leads):
1. **Missing Data in Sheet Row:** `Nationality` and `AED` currency prefix were missing.
2. **Objective Semantic Collision:** In FA, "محل سکونت اصلی برای خانواده" (Primary family residence, code `family-home`) was recorded as **"Security & Future for Children"**.
3. **Persian & Multilingual Timing Conflict:** The on-page success message in `fa/realestate/index.html` promised "within 2 hours" (ظرف ۲ ساعت آینده) while `forms.js` returned "within 24 business hours" (ظرف ۲۴ ساعت کاری).

### Root Causes
1. **Objective Substring Collision:**
   In `formatObjective()`, `s.indexOf("family") !== -1` was evaluated greedily before checking `family-home`. Because `family-home` contains "family", it erroneously returned the CBI objective `"Security & Future for Children"`.
2. **Missing Currency & Nationality:**
   - `formatBudget()` was previously missing fallback matches for `1m-2m`, `2m-5m`, `5m-10m`, and `10m+` in the script deployed on the client's sheet, causing them to be saved as raw keys without "AED".
   - `api/contact.php` previously omitted `nationality` in `$crmPayload` before our earlier fix.
3. **Hardcoded On-Page Text:**
   `fa/realestate/index.html` line 2054, `ar/realestate/index.html` line 2054, and `zh/realestate/index.html` line 2055 had legacy 2-hour messages in their hidden success divs.

### Fixes Applied
1. **Objective Formatter Disambiguation:**
   Updated `formatObjective()` in both `scripts/SharifGroup_Master_CRM_AppsScript.js` and `scripts/GoogleAppsScript_Webinar_CRM.js`:
   `s === "family-home"` and `s.indexOf("family-home") !== -1` are explicitly evaluated first and return **`"Primary Family Residence / Home"`**, preventing any collision with `"Security & Future for Children"`.
2. **AED Currency Guarantee:**
   Confirmed exact keys and fallbacks for `1m-2m`, `2m-5m`, `5m-10m`, and `10m+` in `formatBudget()` strictly outputting AED formatting (`AED 1,000,000 – AED 2,000,000`, `AED 2,000,000 – AED 5,000,000 (Golden Visa)`, etc.).
3. **Auto-Repair Upgrade for Historical Rows 6–7:**
   Updated `fixExistingBudgetAndNationality()`:
   - On the "Real Estate" tab, detects any objective previously mistranslated as "Security & Future for Children" or raw "family-home" and restores it to **`"Primary Family Residence / Home"`**.
   - Formats raw budget keys (`2m-5m`, etc.) with the correct AED prefix.
   - Recovers blank Nationality from Client Notes or dial code/country.
4. **Unified Timing to 24 Business Hours:**
   Updated `fa/realestate/index.html`, `ar/realestate/index.html`, and `zh/realestate/index.html` success text to **24 business hours**.

---

## 11. Webinar WEB02 Slug, Column Realignment, and Newsletter Opt-In (FA Event Row 20)

### Issues Reported
1. **Webinar Slug Blank:** In `Event` tab Row 20, the event slug was blank for session `WEB02`.
2. **Column Shift Across Row:** Columns after `Site Language` shifted across the row (`Language`, `Source URL`, `Page Path`, `Status`, `Email Dispatch Status`).
3. **Newsletter Opt-In False Positive:** Newsletter Opt-In was saved as "Yes" even though the attendee left the checkbox unchecked.

### Root Causes
1. **Missing Slug Fallback:**
   When registration payloads submitted `webinar_id: "WEB02"` without explicitly setting `webinar_slug` or with an empty string, null-coalescing fallbacks did not trigger and left the slug empty.
2. **Column Shift via Unaligned Headers:**
   In earlier revisions, the `Event` tab had 15 columns without `Site Language`. When `Site Language` was introduced, appending rows without running tab migration caused values from index 10 onward to shift to the right by one column.
3. **Truthy String Coercion of "no" / "false":**
   In `handleWebinarRegistration()`, `var newsletter = data.newsletter_optin ? "Yes" : "No";` evaluated truthy for the string `"no"` or `"false"`. In JavaScript, `Boolean("no") === true`, causing unchecked submissions to be recorded as "Yes".

### Fixes Applied
1. **Authoritative Slug Resolution:**
   - In `api/event-register.php` and `scripts/SharifGroup_Master_CRM_AppsScript.js`, added fallback dictionary:
     `WEB01` ➔ `dominica-second-passport-for-afghans`
     `WEB02` ➔ `dominica-from-decision-to-passport`
     `WEB03` ➔ `dominica-your-questions-answered`
2. **Strict Boolean Evaluation for Newsletter:**
   Only explicit `"yes"`, `"true"`, `1`, `"1"`, or boolean `true` evaluates to `"Yes"`. Unchecked checkboxes, `"no"`, `"false"`, or empty inputs strictly evaluate to `"No"`.
3. **Automated Event Tab Repair Routine (`repairEventTab`):**
   - Automatically repairs `Event` sheet headers to ensure all 16 columns are strictly aligned.
   - Detects shifted columns after `Site Language` and shifts them back to their canonical positions.
   - Restores missing slug for `WEB02` in Row 20.
   - Corrects false-positive Newsletter Opt-In in Row 20 to `"No"`.

---

## 12. Program Form Controls Realignment and Istanbul Timezone Fix

### Issues Reported
1. **St Kitts Form Options Scrambled (AR, FA, ZH):**
   In the consultation form on St Kitts CBI pages:
   - Budget options appeared under Investment Objective.
   - Objective options appeared under Planning Timeline.
2. **Istanbul Timezone Listed under UTC+02:**
   The Home consultation form in EN, FA, AR, and ZH displayed Istanbul under UTC+02 instead of UTC+03.

### Root Causes
1. **Scrambled HTML `<option>` Blocks:**
   During localized translation updates, the option blocks in `ar/programs/citizenshipbyinvestment/stkitts/index.html`, `fa/programs/...`, and `zh/programs/...` were shifted by one container:
   - `prog-budget` contained private residence route and budget tiers.
   - `prog-objective` contained budget tiers and mobility objectives.
   - `prog-timeline` contained tax optimization objectives and immediate timeline.
2. **Language Switcher Timezone Dictionary Override:**
   In `assets/js/language-switcher.js`, the `timezoneTranslations` object explicitly placed Istanbul in `UTC+02:00` across all 4 locales (`Cairo, Athens, Istanbul`) and omitted it from `UTC+03:00`. When `language-switcher.js` executed on page load, it dynamically injected Istanbul into UTC+02 on the homepage.

### Fixes Applied
1. **Aligned All Form Options in AR, FA, and ZH St Kitts Pages:**
   - `prog-budget`: Correctly lists budget tiers ($250k–$350k, $350k–$500k, $500k+).
   - `prog-objective`: Correctly lists objectives (Platinum Standard Global Mobility, Secure Caribbean Passport / Plan B, Tax Optimization, Family Legacy).
   - `prog-timeline`: Correctly lists planning timelines (Immediately 0–3 months, 3–6 months, 6–12 months).
2. **Corrected Istanbul to UTC+03:00 Globally:**
   - In `assets/js/language-switcher.js`, removed Istanbul from `UTC+02:00` (`Eastern European Time - Cairo, Athens`).
   - Placed Istanbul permanently under `UTC+03:00` (`Arabia & Turkey Time - Riyadh, Istanbul, Moscow`) across English, Arabic, Persian, and Chinese, perfectly matching `contact/index.html`.

---

## 13. Resolution of Historical 4-Digit Phone Prefixes in Sheet

### Clarification & Solution
- The screenshot provided shows historical test rows in the client's Google Sheet (`+9715 1234567`, `+9717 6890324`, `+9391 52923084`, `+9711 234567890`) generated by earlier versions of Apps Script before the E.164 normalization engine was deployed.
- All new incoming submissions are completely protected and format strictly with ITU-T standard 2- or 3-digit country codes (`+971 5...`, `+93 91...`).
- To clean all existing historical rows in the sheet, the admin simply needs to:
  1. Open the Google Spreadsheet.
  2. Click **⭐ Sharif Group CRM** from the top menu bar.
  3. Click **🔧 Fix Existing Phone Number #ERROR! (Clean All)**.
  4. The built-in parser automatically traverses all sheets and converts `+9715...` to `+971 5...`, `+9717...` to `+971 7...`, and `+9391...` to `+93 91...`.

---

## 9. Educational Advisory Field Forwarding & Budget Currency Fix (AR & ZH Rows 7–8)

### Issues Reported
In **Educational Advisory Tab Rows 7–8** (AR and ZH leads):
1. **Missing Data in Sheet Row:** `Nationality`, `age/grade`, `study level`, `destination`, and `intake` did not reach the row.
2. **Missing Currency Symbols:** Budgets lost `£` (GBP) for AR (`18k-30k` / `35k-50k`) and `CHF` for ZH (`80k-plus`).
3. **Arabic Success Message Conflict:** AR on-page text promised both "within 2 hours" (خلال ساعتين) and "within 24 business hours" (خلال 24 ساعة عمل).

### Root Causes
1. **Form Field Normalization Gap:**
   In `assets/js/forms.js` and `api/contact.php`, educational advisory inputs (`studyLevel`, `studentAgeGrade`, `targetDestination`, `intakeTimeline`) were extracted under education-specific keys but were not mirrored into the category standard questionnaire fields (`investmentRoute`, `familyMembers`, `objective`, `timeline`). Consequently, Google Sheets received empty values for those standard category columns.
2. **Budget Map Omission for Education Currencies:**
   `formatBudget()` did not have explicit fallbacks for `18k-30k` (GBP), `35k-50k` (GBP), and `80k-plus` (CHF), causing them to fall back to raw key strings without currency symbols.
3. **Locale Inconsistency:**
   `ar/educationaladvisory/index.html` lines 2493 & 2613 hardcoded "خلال ساعتين" (within 2 hours), while `forms.js` returned the standardized "خلال 24 ساعة عمل" (within 24 business hours).

### Fixes Applied
1. **Frontend (`assets/js/forms.js`):**
   - Automatically aliases `student_age` ➔ `familyMembers`, `study_level` ➔ `investmentRoute`, `destination` ➔ `objective`, and `intake` ➔ `timeline`.
   - Added educational metadata (`Age/Grade:`, `Study Level:`, `Destination:`, `Intake:`, `Nationality:`) to `[Details]` in Client Notes.
2. **Backend API (`api/contact.php`):**
   - Ensures `$investmentRoute`, `$familyMembers`, `$objective`, and `$timeline` fallback to education fields so all Google Apps Script consumers receive fully populated data.
3. **Master CRM Script (`scripts/SharifGroup_Master_CRM_AppsScript.js` & `scripts/GoogleAppsScript_Webinar_CRM.js`):**
   - Mapped study levels (`bachelor-degree`, `master-degree`, `boarding-school`, `foundation-program`) in `formatRoute()`.
   - Mapped age brackets (`prep_school`, `middle_school`, `high_school`, `undergraduate_grad`) in `formatEducationAge()`.
   - Mapped destinations (`uk`, `switzerland`, `germany`, `netherlands`, `france`, `italy-spain`, `undecided`) in `formatObjective()`.
   - Mapped intakes (`sep-2026`, `jan-2027`, `sep-2027`, `2028-beyond`) in `formatEducationIntake()`.
   - Added explicit mappings for GBP (`£18,000 – £30,000 / yr`, `£35,000 – £50,000 / yr`) and CHF (`CHF 80,000+ / yr`) in `formatBudget()`.
   - Upgraded `fixExistingBudgetAndNationality()` to auto-recover missing age, level, destination, intake, nationality, and currencies on historical Educational Advisory rows (Rows 7–8).
4. **On-Page Arabic / Multilingual Timing Resolution:**
   - Unified `ar/educationaladvisory/index.html` (lines 2493, 2613), `zh/educationaladvisory/index.html` (line 2614), and `fa/educationaladvisory/index.html` (line 2613) to **24 business hours** across the board.

---

## 10. Real Estate Objective Collision, Currency, and Timing Resolution (EN & FA Rows 6–7)

### Issues Reported
In **Real Estate Tab Rows 6–7** (EN & FA leads):
1. **Missing Data in Sheet Row:** `Nationality` and `AED` currency prefix were missing.
2. **Objective Semantic Collision:** In FA, "محل سکونت اصلی برای خانواده" (Primary family residence, code `family-home`) was recorded as **"Security & Future for Children"**.
3. **Persian & Multilingual Timing Conflict:** The on-page success message in `fa/realestate/index.html` promised "within 2 hours" (ظرف ۲ ساعت آینده) while `forms.js` returned "within 24 business hours" (ظرف ۲۴ ساعت کاری).

### Root Causes
1. **Objective Substring Collision:**
   In `formatObjective()`, `s.indexOf("family") !== -1` was evaluated greedily before checking `family-home`. Because `family-home` contains "family", it erroneously returned the CBI objective `"Security & Future for Children"`.
2. **Missing Currency & Nationality:**
   - `formatBudget()` was previously missing fallback matches for `1m-2m`, `2m-5m`, `5m-10m`, and `10m+` in the script deployed on the client's sheet, causing them to be saved as raw keys without "AED".
   - `api/contact.php` previously omitted `nationality` in `$crmPayload` before our earlier fix.
3. **Hardcoded On-Page Text:**
   `fa/realestate/index.html` line 2054, `ar/realestate/index.html` line 2054, and `zh/realestate/index.html` line 2055 had legacy 2-hour messages in their hidden success divs.

### Fixes Applied
1. **Objective Formatter Disambiguation:**
   Updated `formatObjective()` in both `scripts/SharifGroup_Master_CRM_AppsScript.js` and `scripts/GoogleAppsScript_Webinar_CRM.js`:
   `s === "family-home"` and `s.indexOf("family-home") !== -1` are explicitly evaluated first and return **`"Primary Family Residence / Home"`**, preventing any collision with `"Security & Future for Children"`.
2. **AED Currency Guarantee:**
   Confirmed exact keys and fallbacks for `1m-2m`, `2m-5m`, `5m-10m`, and `10m+` in `formatBudget()` strictly outputting AED formatting (`AED 1,000,000 – AED 2,000,000`, `AED 2,000,000 – AED 5,000,000 (Golden Visa)`, etc.).
3. **Auto-Repair Upgrade for Historical Rows 6–7:**
   Updated `fixExistingBudgetAndNationality()`:
   - On the "Real Estate" tab, detects any objective previously mistranslated as "Security & Future for Children" or raw "family-home" and restores it to **`"Primary Family Residence / Home"`**.
   - Formats raw budget keys (`2m-5m`, etc.) with the correct AED prefix.
   - Recovers blank Nationality from Client Notes or dial code/country.
4. **Unified Timing to 24 Business Hours:**
   Updated `fa/realestate/index.html`, `ar/realestate/index.html`, and `zh/realestate/index.html` success text to **24 business hours**.

---

## 11. Webinar WEB02 Slug, Column Realignment, and Newsletter Opt-In (FA Event Row 20)

### Issues Reported
1. **Webinar Slug Blank:** In `Event` tab Row 20, the event slug was blank for session `WEB02`.
2. **Column Shift Across Row:** Columns after `Site Language` shifted across the row (`Language`, `Source URL`, `Page Path`, `Status`, `Email Dispatch Status`).
3. **Newsletter Opt-In False Positive:** Newsletter Opt-In was saved as "Yes" even though the attendee left the checkbox unchecked.

### Root Causes
1. **Missing Slug Fallback:**
   When registration payloads submitted `webinar_id: "WEB02"` without explicitly setting `webinar_slug` or with an empty string, null-coalescing fallbacks did not trigger and left the slug empty.
2. **Column Shift via Unaligned Headers:**
   In earlier revisions, the `Event` tab had 15 columns without `Site Language`. When `Site Language` was introduced, appending rows without running tab migration caused values from index 10 onward to shift to the right by one column.
3. **Truthy String Coercion of "no" / "false":**
   In `handleWebinarRegistration()`, `var newsletter = data.newsletter_optin ? "Yes" : "No";` evaluated truthy for the string `"no"` or `"false"`. In JavaScript, `Boolean("no") === true`, causing unchecked submissions to be recorded as "Yes".

### Fixes Applied
1. **Authoritative Slug Resolution:**
   - In `api/event-register.php` and `scripts/SharifGroup_Master_CRM_AppsScript.js`, added fallback dictionary:
     `WEB01` ➔ `dominica-second-passport-for-afghans`
     `WEB02` ➔ `dominica-from-decision-to-passport`
     `WEB03` ➔ `dominica-your-questions-answered`
2. **Strict Boolean Evaluation for Newsletter:**
   Only explicit `"yes"`, `"true"`, `1`, `"1"`, or boolean `true` evaluates to `"Yes"`. Unchecked checkboxes, `"no"`, `"false"`, or empty inputs strictly evaluate to `"No"`.
3. **Automated Event Tab Repair Routine (`repairEventTab`):**
   - Automatically repairs `Event` sheet headers to ensure all 16 columns are strictly aligned.
   - Detects shifted columns after `Site Language` and shifts them back to their canonical positions.
   - Restores missing slug for `WEB02` in Row 20.
   - Corrects false-positive Newsletter Opt-In in Row 20 to `"No"`.

---

## 12. Program Form Controls Realignment and Istanbul Timezone Fix

### Issues Reported
1. **St Kitts Form Options Scrambled (AR, FA, ZH):**
   In the consultation form on St Kitts CBI pages:
   - Budget options appeared under Investment Objective.
   - Objective options appeared under Planning Timeline.
2. **Istanbul Timezone Listed under UTC+02:**
   The Home consultation form in EN, FA, AR, and ZH displayed Istanbul under UTC+02 instead of UTC+03.

### Root Causes
1. **Scrambled HTML `<option>` Blocks:**
   During localized translation updates, the option blocks in `ar/programs/citizenshipbyinvestment/stkitts/index.html`, `fa/programs/...`, and `zh/programs/...` were shifted by one container:
   - `prog-budget` contained private residence route and budget tiers.
   - `prog-objective` contained budget tiers and mobility objectives.
   - `prog-timeline` contained tax optimization objectives and immediate timeline.
2. **Language Switcher Timezone Dictionary Override:**
   In `assets/js/language-switcher.js`, the `timezoneTranslations` object explicitly placed Istanbul in `UTC+02:00` across all 4 locales (`Cairo, Athens, Istanbul`) and omitted it from `UTC+03:00`. When `language-switcher.js` executed on page load, it dynamically injected Istanbul into UTC+02 on the homepage.

### Fixes Applied
1. **Aligned All Form Options in AR, FA, and ZH St Kitts Pages:**
   - `prog-budget`: Correctly lists budget tiers ($250k–$350k, $350k–$500k, $500k+).
   - `prog-objective`: Correctly lists objectives (Platinum Standard Global Mobility, Secure Caribbean Passport / Plan B, Tax Optimization, Family Legacy).
   - `prog-timeline`: Correctly lists planning timelines (Immediately 0–3 months, 3–6 months, 6–12 months).
2. **Corrected Istanbul to UTC+03:00 Globally:**
   - In `assets/js/language-switcher.js`, removed Istanbul from `UTC+02:00` (`Eastern European Time - Cairo, Athens`).
   - Placed Istanbul permanently under `UTC+03:00` (`Arabia & Turkey Time - Riyadh, Istanbul, Moscow`) across English, Arabic, Persian, and Chinese, perfectly matching `contact/index.html`.

---

## 13. Resolution of Historical 4-Digit Phone Prefixes in Sheet

### Clarification & Solution
- The screenshot provided shows historical test rows in the client's Google Sheet (`+9715 1234567`, `+9717 6890324`, `+9391 52923084`, `+9711 234567890`) generated by earlier versions of Apps Script before the E.164 normalization engine was deployed.
- All new incoming submissions are completely protected and format strictly with ITU-T standard 2- or 3-digit country codes (`+971 5...`, `+93 91...`).
- To clean all existing historical rows in the sheet, the admin simply needs to:
  1. Open the Google Spreadsheet.
  2. Click **⭐ Sharif Group CRM** from the top menu bar.
  3. Click **🔧 Fix Existing Phone Number #ERROR! (Clean All)**.
  4. The built-in parser automatically traverses all sheets and converts `+9715...` to `+971 5...`, `+9717...` to `+971 7...`, and `+9391...` to `+93 91...`.
