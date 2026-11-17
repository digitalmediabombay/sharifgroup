*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 1 of 8*

# Website Change Request and Quotation

sharifgroup.ae | Fixes, new features and Pashto language

| To | From | Date |
|---|---|---|
| Digital Media Bombay (Kaleem Shaikh and team) | Sharif Group | 14 November 2026 |

## 1. Summary

This document brings together everything we need from the website team in this round: urgent fixes, lead-capture and admin-panel problems, other open issues, two new features and a separate Pashto language project. Please treat it as the single reference and reply with one quotation and schedule.

All items were checked on the live site on 14 November 2026. Ticket IDs such as **T07** refer to the Technical Developer Handoff of 10 November (attached), which has full evidence and acceptance tests.

| Part | What | Priority |
|---|---|---|
| A | Urgent fixes: webinar registration, admin folder exposure, incorrect published claims | Urgent, before the 25 Nov webinar |
| B | Lead capture: confirmed submissions and correct Master Sheet data | High |
| C | Admin panel and blog: articles saved but not published, language and listing mismatches | High |
| D | Other open website issues (menus, forms, content, SEO, speed) | Medium |
| E | New features: Success Stories page and quick enquiry form | New work, please quote |
| F | Pashto language | New project, separate quote |

Thank you for the fixes already delivered: all website forms in the four languages now reach the Master Sheet, the About Us menu is the same on every page, and the Become a Partner card has its image.

## 2. Part A – Urgent fixes

Please release these three items together and confirm when they are live. Session 2 of our webinar series is on 25 November.

### A1. Webinar Session 2 cannot be registered for

The site sends visitors to Session 2, but its page has no registration form: the event data has `registration_open=false` for every session, and the page still says registration opens after Session 1, which was held on 29 October.

- The Events page features the finished Session 1 as "Next live session" (the `featured()` function starts with session 1).
- The homepage webinar band in all four languages links to the old Session 1 page; the FA/AR/ZH countdowns still count to 12 November.
- The floating popup advertises Session 2 ("View and register free") but leads to the closed page, and it covers FAQ text and blog content.
- Session 1 kept accepting registrations after it ended: the Master Sheet received 16 registrations for WEB01 between 9 and 12 November. The Webinar Slug column is empty in every row.

*[Screenshot: Events page showing "Next live session · Session 01" with a "Held" badge. Title: "A Second Passport for Afghans: Introducing the Dominica Programme". Description: "A free online session in Persian: what Dominica's citizenship programme is, why it matters for Afghans and who can apply." Details: 65 min, Persian, No app needed, Free, Public link. Notice: "This session has been held" with a "Full details" button. Date & time: Thursday, 29 October 2026. Notice: "THIS SESSION HAS BEEN HELD – Thank you to everyone who joined. The next session of this series is listed below." Times: Kabul 20:00, Dubai 19:30, Istanbul 18:30, Your time (Tehran) 19:00 · Thu 29 Oct.]*

*Events page: the 29 October session is shown as "Next live session" although it is marked as held.*

*[Screenshot: "Program Integrity & FAQs" section, with a floating card at lower right: "UPCOMING FREE WEBINAR – From Decision to Passport: Steps, Documents and Source of Funds – Live Session: Wed 25 Nov – VIEW SESSION & REGISTER".]*

*The floating webinar card covers the FAQ list and its controls.*

**Required**

1. Open Session 2 registration in all four languages now.
2. Drive "Next live session", the homepage band, countdowns, blog widgets and the popup from one event source, based on each session's start and end time. Past sessions move to "Past sessions" and never accept registrations.
3. Fill Webinar ID and Webinar Slug in the Event tab of the Master Sheet.

### A2. Admin folder and drafts are publicly accessible

`/admin/api/` shows a public list of 24 files, including `reset.php`, `repair.php`, `diagnostics.php`, `upload.php`, `save.php` and `db.php`. `draft_content.json` (unpublished content) and `published_content.json` download without a login. Directory listings are also open on `/api/`, `/clients/`, `/assets/js/`, `/assets/images/uploads/` and `/assets/videos/`, and `/package.json` is public. (`/data/` is now blocked, thank you.)

**Required (T31)**

1. Move the published content file that public pages need to a public path such as `/assets/data/`, then put all of `/admin/` behind a login or IP allow-list.
2. Remove `reset.php`, `repair.php` and `diagnostics.php` from the live server.
3. Turn off directory listing for the whole site (`Options -Indexes`).
4. Change the CMS and database passwords and confirm in writing that every admin script requires a login.

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 3 of 8*

### A3. Content corrections

| Page | Current text | Change |
|---|---|---|
| Dominica programme page (EN and ZH) | "Visa-free access to over 132 countries including the EU and UK"; "Stay in the UK for up to 6 months at a time"; FAQ answer on 6-month UK stays | Remove every reference to visa-free UK access. The page's own passport dashboard already marks the UK as visa required. |
| Dominica programme page (EN and ZH) | Dependent parents/grandparents "above 65" in one section and "over 55" in another | Use one age rule; "above 65" |
| Dominica Passport for Afghans in 2026 (all 4 languages) | "US0,000" in the real estate paragraph | Correct the figure. |
| /blog/sample-dominicaartcile/ (all 4 languages) | Test article is live and in the sitemap | Unpublish, return 410 and remove from the sitemap. |

## 3. Part B – Lead capture and Master Sheet

Every form tested on 8 and 14 November created a row in the correct Master Sheet tab, in all four languages. Two problems remain: the site shows success without confirming the row was saved, and several fields are lost or written to the wrong column.

### B1. Show success only after the lead is saved (T01–T03)

`forms.js` sends to `/api/contact.php` without waiting for the result and ignores errors (`.catch(function(){})`). It sends to Google Apps Script with `mode: 'no-cors'`, so the browser cannot read the reply, then clears the form and shows success. The partner and webinar forms go to the thank-you page after 400 ms in the same way. If the Apps Script fails or times out, the visitor sees success and the lead is lost.

**Required:** show success only after a confirmed save; add a timeout with a clear retry message that keeps the visitor's input; prevent duplicate rows from double clicks or retries.

### B2. Field mapping in the Master Sheet

| Form / tab | Problem | Fix |
|---|---|---|
| Portugal (ZH) / Residency | Selected €250,000–500,000 and CMVM regulated fund; Sheet shows $250,000–350,000 and "Government Fund Donation" | Programme-specific labels and correct currency |
| Education (AR, ZH) / Educational Advisory | Student age/grade, study level, destination and intake are lost | Save all four fields |
| Social Responsibility / General_Inquiries | Organization and Organization Type lost; preferred date shown as "Immediately (0–3 months)"; contact method under Primary Objective; unrelated "Subprogram" field marked required | Save organization fields, map date and method correctly, fix or remove the sub-program field. Keep routing to General_Inquiries. |
| Real Estate / all languages | Raw codes such as off-plan, 2m-5m, rental-roi; no currency | Readable labels with AED |
| Contact and overview forms | Time zone ("UTC+03:30") or address written into "Country / Residence" | Each value in its own column |
| Partnership | "Confirmation Email Status" shows "Pending Review"; "Status" shows the email result | Use the correct columns; leave Status for our team |
| All tabs | "Language" holds the visitor's preferred contact language, not the page language; eligibility checker sends no page path | Add a "Site Language" column; send page path from the eligibility checker |

### B3. Phone numbers (T04, T19, T20)

The phone is saved as dial code + typed text with no check. The Sheet already has +9393777382941 (prefix twice), an Afghan number saved with +971, +93 0783… (extra zero) and +971 123. Searching "افغانستان" in the Persian country picker finds nothing, and the webinar form offers only 13 dial codes.

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 4 of 8*

**Required:** country-aware phone parsing that accepts national and international formats, Persian/Arabic digits and pasted numbers without adding a second prefix; save one standard format (E.164); reject impossible numbers with a clear message; full country list, searchable in all site languages.

### B4. Other lead-capture items

- **Old sheets:** "Sharif Group CRM 2026" received a row on 13 November from `sharifgroupdubai.vercel.app` (phone shows #ERROR!). Disconnect every staging or old integration from the old sheets.
- **Earlier leads:** item 4 of our 1 November routing request is still open. Move the Persian, Arabic and Chinese website leads saved in the old sheets before 5 November into the Master Sheet and tell us how many rows were moved.
- **Response time:** use "within 24 business hours" in every success message and confirmation email (some pages currently say 2 hours).
- **Abuse protection:** the Apps Script web app is open to anyone and emails any address typed in a form. Add a honeypot field, rate limiting and server-side validation so it cannot be used to send mail from contact@sharifgroup.ae.
- **Personal data in the browser (T32):** remove console logs of form data and keep only what draft recovery needs in localStorage, with an expiry.

## 4. Part C – Admin panel and blog

Our content team cannot publish an article from the admin panel and see it on the site. We need a permanent publishing fix, not a one-off manual upload of the latest article.

### C1. Publishing does not complete

After saving a new article, the panel shows "Draft Saved" and a note that the site is on Vercel static hosting where PHP does not run, asking staff to generate HTML files, update listing cards and regenerate the sitemap through cPanel.

*[Screenshot: dialog titled "sharifgroup.ae says": "Draft Saved! NOTE (Vercel Hosting): You are currently viewing on Vercel static hosting (where PHP is not executed). To generate the live physical HTML article files (/blog/caribbean-cbi-eu-november-2026/), update blog listing cards, and regenerate sitemap.xml, deploy/upload to your cPanel hosting (as detailed in step.md) where PHP & MySQL are active." With an OK button.]*

*Message shown after saving a new article in the admin panel.*

**Required:** one clear Publish action that builds and deploys the article page, language-specific listing cards, homepage "Latest Articles", sitemap and metadata, clears the cache, and shows the live URL or a clear error. Unpublish and Update must work the same way. Please also explain where article data is stored and how the admin panel, Vercel and the cPanel/PHP/MySQL server relate.

### C2. Admin panel and live blog show different articles

The panel lists Caribbean CBI, Argentina citizenship, Barbados residency and Dominica as recent articles; the live blog shows a different set of four cards.

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 5 of 8*

*[Screenshot: admin panel sidebar with Blog & Articles, "New Blog Post (Easy Form)", Manage Draft Blogs, and entries for Barbados Residency, Argentina's New Citizenship, Caribbean Citizenship and Dominica Passport; four article cards: "Caribbean Citizenship by Investment Programs Face an Uncertain Future Amid EU Pressure", "Argentina's New Citizenship by Investment Programme: What Families Should Know Before It Opens", "Barbados Residency in 2026: New Law, Requirements and Latest Updates", "Dominica Passport for Afghans in 2026".]*

*Admin panel: recent articles.*

*[Screenshot: live blog with category filters (All, Citizenship, Residency, Golden Visa, Real Estate, Educational Advisory, Corporate & Tax Strategy, Sharif Group Insights) and four cards: "Dominica Passport for Afghans in 2026", "About Sharif Group: Who We Are and How We Help", "All Services We Offer at Sharif Group", "Meet the Team Behind Sharif Group". The webinar popup card ("From Decision to Passport: Steps, Documents and Source of Funds – Live Session: Wed 25 Nov – VIEW SESSION & REGISTER") overlaps the lower right.]*

*Live blog: a different set of cards; the webinar card also covers content at the lower right.*

### C3. Other blog problems

- **Languages:** an article can appear in English but not in Persian, irregularly. Each language needs its own publish status, linked translations and correct locale, canonical and hreflang. Never show English cards in Persian sections.
- **Homepage "Latest Articles"** shows only the 3 October Dominica article with empty space. Show the latest published articles for the page language, with a set number of cards.
- **Persian article in English:** "Dominica Passport for Afghans in 2026" has an English title and body on the Persian site (T23).

*[Screenshot: homepage "Latest Articles" section showing a single card, "Dominica Passport for Afghans in 2026" (Oct 03, 2026), with empty space beside it.]*

*Homepage "Latest Articles": one October article and empty space.*

### C4. Persian header font

The Persian header and menus use a different font from the rest of the Persian site. Use one Persian font family across header, menus and body on all devices, and check that the font files load.

**After the fix**, please send a list of all articles with admin ID, language, status, live URL and sitemap presence, so we can confirm nothing is missing.

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 6 of 8*

## 5. Part D – Other open website issues

These items were still open on 14 November. Details and acceptance tests are in the attached handoff and verification report.

| Area | Issue | Status | Ref |
|---|---|---|---|
| Menus | FA/AR menus right-to-left, ZH menu matching EN, full-width dropdown: correct at 1180 px, not yet confirmed at 1440 × 900 and 390 × 844 | Partly fixed | Menu report 5 Nov |
| Menus | Tab skips mega-menu links; closed mobile drawer still focusable; Escape does not close it | Not fixed | T16 |
| Contact | JavaScript SyntaxError on all four contact pages | Not fixed | T07 |
| Contact | "Book Consultation" reloads the top of the page instead of scrolling to the form | Not fixed | T21 |
| Forms | Past dates accepted; Istanbul listed under UTC+02 | Not fixed | T05, T06 |
| Forms | Fields have no programmatic labels; gold text fails contrast | Not fixed | T17, T18 |
| Events | WhatsApp share and calendar file use a relative link instead of the full https event URL | Partly fixed | T28, T29 |
| Partners | English placeholders in the FA/AR/ZH partner form (job title, company, country, city, website, message) | Partly fixed | – |
| Content | IMC logo broken on 336 translated articles (../imclogo.webp) | Not fixed | T13 |
| Content | Social preview images for Portugal and Nauru return 404 | Not fixed | T14 |
| Content | Homepage counters are 0 in the HTML until the animation runs | Not fixed | – |
| Brand | Alternate favicon and three homepage images still load from Sharif Trip | Partly fixed | – |
| SEO | Events and Partners pages use www canonical/hreflang and are missing from the sitemap; meta keywords tag still present | Not fixed | T34, T42 |
| Speed | 13.8 MB footer video, slow hero image, render-blocking CSS and fonts; English articles preload AR/ZH/FA translation files | Partly fixed | T09–T12 |
| Release | forms.js, navbar.js, language-switcher.js have no version, so visitors keep old code for 30 days | Not fixed | T08 |
| Images | Images loaded from 76 outside websites, including competitors and Google thumbnails | Not fixed | T15 |
| Security | No safe fallback if JavaScript fails; no Content-Security-Policy; no cookie consent | Not fixed | T38, T39 |

The remaining handoff tickets (T22, T25–T27, T30, T33, T35–T37, T40, T41, T43, T44) were not re-checked. Please tell us which of them you will include in this round.

## 6. Part E – New features (please quote)

### E1. Success Stories as its own web page

Success Stories should be a separate web page where our team can add new videos and photos with a short description, without developer help. Today it is only a homepage carousel of seven short quotes with photos and no videos, and `/success-stories/` returns 404.

- One page per site language (EN, FA, AR, ZH, and Pashto if Part F goes ahead), linked from the homepage section ("View all"), the About Us menu and the footer.
- Each story: video (uploaded file or YouTube link), one or more photos, short description, programme, country and date. Client name only with the client's consent.
- Managed in the admin panel: add, edit, hide, delete and reorder stories per language, using the same working publish flow as Part C.

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 7 of 8*

- Filter by programme (for example Dominica, Grenada, Residency, Education).
- Videos load only when played; photos are compressed and sized for mobile. The homepage section shows the latest stories from the same source.

### E2. Quick enquiry form

Our webinar registration form receives many submissions because it is short and opens in a popup. The contact form asks for 9 required fields and the Dominica form for 12. We want a short form to capture the first contact in the same simple way.

- Fields: full name, WhatsApp number (country picker and the checks in B3), programme of interest, optional short message, consent.
- A button that opens the form in a popup or slide-in panel on programme pages, blog articles and the homepage, in all site languages, on desktop and mobile.
- Easy to close, never covers page content, and never shown at the same time as the webinar popup.
- Saved to the Master Sheet (General_Inquiries, Form ID quick-enquiry, with page path and site language), with the confirmed-save behaviour in B1 and an alert to contact@sharifgroup.ae.
- The full consultation forms remain available for visitors who want to give more detail.

## 7. Part F – Pashto language (separate quote)

We want to add Pashto as a fifth website language. Please quote it as a separate project so we can decide on it independently of Parts A–E.

### Expected scope

- A `/ps/` version of the site, right-to-left, with a Pashto-capable font matching the Persian design, and Pashto in the language switcher on every page.
- hreflang, canonical and sitemap entries for every Pashto page.
- Forms, success messages, thank-you pages and confirmation emails in Pashto; Master Sheet rows recorded with site language "Pashto".
- Events, Partners, eligibility checker and (if ordered) Success Stories in Pashto.
- Admin panel support for Pashto content, with the same publish flow as the other languages.

### Please quote in two phases, each with two translation options

| Phase | Content |
|---|---|
| 1 | Site structure and shared components; homepage, About, Contact, Citizenship and Residency overviews, Dominica and other priority programme pages, Events, Partners, forms and emails |
| 2 | Remaining programme and service pages, and blog articles |

Option (a): Sharif Group supplies the Pashto text. Option (b): your team supplies the translation. Please also give the cost of each new page or article in Pashto after launch.

## 8. What we need back

Please reply with one document that completes the table below, including a proposed schedule. For Parts A–D, tell us which items are part of the existing build and support, and which are chargeable. Part A should be completed before the 25 November webinar.

| Part | Price (AED) | In existing scope? | Start | Delivery | Notes |
|---|---|---|---|---|---|
| A – Urgent fixes | | | | | |
| B – Lead capture | | | | | |
| C – Admin panel and blog | | | | | |
| D – Other open issues | | | | | |
| E1 – Success Stories page | | | | | |

---

*Sharif Group | Website Change Request and Quotation | 14 Nov 2026 | Page 8 of 8*

| Part | Price (AED) | In existing scope? | Start | Delivery | Notes |
|---|---|---|---|---|---|
| E2 – Quick enquiry form | | | | | |
| F – Pashto phase 1: option a / b | | | | | |
| F – Pashto phase 2: option a / b | | | | | |
| F – Pashto, per new page after launch | | | | | |

### When reporting work as done

- For each item: the ID used here, release date, affected URLs, and how it was tested in all four languages on desktop and mobile.
- For form fixes, include the Master Sheet row. A thank-you screen alone does not prove that a lead was saved.
- After each release, check the main pages in every language before telling us it is ready, as requested on 5 November.
- We are still waiting for the progress report requested on 2 November (work delivered, in progress and pending, with traffic, enquiries and SEO results). Please send it with your reply, then a short weekly update.

### Attachments

1. Technical Developer Handoff, 10 November 2026 (T01–T44), with the Developer Issue Register (CSV)
2. Website Verification report, 14 November 2026 (41 checked items with evidence)
3. Lead Capture Verification report, 14 November 2026 (Master Sheet test rows and findings)
