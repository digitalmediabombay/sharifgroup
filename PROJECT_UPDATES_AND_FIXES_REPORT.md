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

### 1.2 Phone Country Dial Code 4-Digit Bug (`+9715`, `+9391`)
- **Issue:** Dial codes were capturing 4 digits (e.g. `+9715 1234567` for UAE, `+9391 52923084` for Afghanistan) instead of standard 2–3 digit country dial codes (`+971`, `+93`).
- **Root Cause:** A greedy regex pattern (`\d{1,4}`) merged the first digit of the national phone number into the dial code.
- **Fix Implemented:**
  - Strict ITU-T country dial code dictionary (`CRM_KNOWN_DIAL_CODES`) matching longest-prefix-first (`+1-268`... `+971`, `+93`, `+90`, `+44`, `+1`).
  - Strict digit-level dial code splitting applied across:
    - `scripts/SharifGroup_Master_CRM_AppsScript.js`
    - `scripts/GoogleAppsScript_Webinar_CRM.js`
    - `api/contact.php`
    - `api/event-register.php`
    - `assets/js/forms.js`
  - Upgraded `fixExistingPhoneErrors()` in Apps Script to automatically re-parse and correct all past corrupted entries in Google Sheets.

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

## 5. Deployment Files & Packages

| Package | Path | Size | Description |
|---|---|---|---|
| **Changed Only Zip** | `cpanel_update_only_changed_files.zip` | ~4.01 MB | Contains only modified core files (PHP APIs, JS apps, stylesheets, sitemap, HTML templates) |
| **Complete Update Zip** | `cpanel_complete_update.zip` | ~16.12 MB | Full production archive ready for root extraction into `public_html` |
| **Master CRM Apps Script** | `scripts/SharifGroup_Master_CRM_AppsScript.js` | ~78 KB | Complete Google Apps Script code for Google Sheets |

---

## 6. Action Checklist for Google Sheets Maintenance

1. **Deploy New Apps Script:**
   - Copy code from `scripts/SharifGroup_Master_CRM_AppsScript.js`.
   - In Google Sheets: **Extensions > Apps Script > Paste & Save (Ctrl+S)**.
   - Click **Deploy > Manage deployments > Edit > New version > Deploy**.
2. **Clean Historical Sheet Rows:**
   - Refresh the Google Sheet.
   - Click **⭐ Sharif Group CRM > 🔧 Fix Existing Phone Number #ERROR! (Clean All)**.
   - All past numbers with 4-digit prefixes (`+9715`, `+9391`) and formula errors are instantly converted to valid standard format (`+971 51234567`, `+93 9152923084`).
