# Webinars section: handoff for the Dubai web team

**Version:** demo v3.1, 13 October 2026  
**Owner:** Marketing (Mehdi Yarahmadi's reports, Parts 1–4, Mehr 1405)  
**Goal:** add a `/webinars` section to sharifgroup.ae, in the same style as the Blog, and run the first Dominica pilot session with a **public joining link**.

> **Site rules from management (must follow):**
> 1. **No recordings or archive on sharifgroup.ae.** The sessions are in Persian and must not be associated with Iran. Recordings go only to the Persian YouTube channel, and the site does not link to or embed them.
> 2. **Never show the meeting platform's name** (the Alocom brand) anywhere on the site, and never print the raw meeting URL as text. The only places the link appears are the button `href`, the "copy link" action and the calendar file.
> 3. Joining-link states: **"Link will be posted soon"** until marketing pastes the link, **"Join the webinar"** once it is set, and **"This session has been held"** after the event, replacing the link.

This package is a **clickable design reference**. It is not production code. It was built from the live site's own design tokens, fonts, locale structure and CMS shape, so you can port it into the existing stack without much translation work.

---

## 1. Open the demo

- Double-click `index.html`. It works offline from `file://`, and any static host also works.
- **Demo controls** (bottom corner) switch Session 1 between *Upcoming / Live / Held*, the link between *Coming soon / Link ready*, and visibility between *Public on page / Registrants only*. They also link to every page.
- Language switcher in the header covers **FA · EN · AR · ZH**. RTL/LTR switches automatically.
- Registrations are stored only in this browser (`localStorage`). The payload is printed to the console. Nothing is sent anywhere.

| Hash route (demo) | Production URL |
|---|---|
| `#/webinars` | `/webinars/` · `/fa/webinars/` · `/ar/webinars/` · `/zh/webinars/` |
| `#/webinars/{slug}` | `/webinars/{slug}/` (+ language prefix) |
| `#/webinars/{slug}/thanks` | `/webinars/{slug}/thanks/`, **noindex** |
| `#/admin` | Preview of the fields to add to the existing `/admin` CMS. Not a real admin. |
| `#/integration` | Shows the menu item, homepage banner, blog-post end card and URL map |

## 2. Where it plugs into the existing site

1. **Main menu:** add a "Webinars" item after *Blog*, with a small "New" badge for the first few weeks. Add the same item to the mobile menu and the footer Quick Links.
2. **Homepage:** add a slim dark banner under the stats band. It shows the next session title, its date and a *Details & join* button. Hide it when no session is upcoming.
3. **Blog:** at the end of related posts (category `Citizenship` / subcategory `dominica`), add a card linking to the next webinar. For example: *Dominica Passport for Afghans in 2026*.
4. **Header / footer:** reuse the existing components unchanged. The demo only reproduces them for context.

## 3. Design system (taken from the live site)

| Token | Value | Use |
|---|---|---|
| Ink | `#111111` / `#171717` | Text, black pill button |
| Bronze | `#786142` | Primary button (`Read Our Story` style, radius 12px) |
| Gold | `#C5A880` | Eyebrows and accents on dark sections |
| Navy | `#070E1A` / `#050B14` | Dark sections ("Our Services & Pathways" look) |
| Cream / Sand | `#FAF6EE` / `#F5F2EB` | Light sections, stats band |
| Paper | `#FDFCFB` | Page background |
| Fonts | Inter + Playfair Display (EN) · Vazirmatn (FA) · Cairo (AR) · Noto Sans SC (ZH) | Same as `multilingual.css` |

**RTL rule:** uppercase and letter-spacing are applied only to Latin and Chinese text (`.caps`). Letter-spacing breaks Arabic-script joining, so FA/AR get `letter-spacing: 0`. The live nav already does this.

`assets/css/fonts-local.css` exists only so the demo renders offline. Drop it in production, because the site already loads these families.

## 4. Translations

- UI strings: `assets/js/webinars-i18n.js`. Ready-to-merge copies are in `locales/webinars.{en,fa,ar,zh}.json`.
  - Merge `nav.webinars` and `footer.webinars` / `footer.upcoming` into the existing `nav` and `footer` blocks of `/assets/locales/{lang}.json`.
  - Add the whole `webinars` object as a new top-level block, then use your usual `data-i18n="webinars.list.title"` keys.
- Persian copy is written for an **Afghan (Dari) audience** (پاسپورت، تذکره، کمره، دالر), as Report Part 2 asks.
- **AR and ZH were machine-assisted.** A native speaker should review them before publishing.

## 5. CMS: new collection `sgcms_webinars`

Mirror the existing `sgcms_blog` collection: shared fields, one object per language, and the `status_en/fa/ar/zh` publication flags. The sample is in `data/sgcms_webinars.sample.json`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `WEB01`, `WEB02`, …. Matches the marketing tracker. |
| `slug` | string | Same slug for all languages |
| `series`, `session_no` | string, int | e.g. `dominica-pilot`, 1 |
| `start_utc` | ISO UTC | **Store UTC only.** Render Kabul (`Asia/Kabul`), Dubai, Istanbul and the visitor's own zone. |
| `date_confirmed` | bool | Show the "sample date" label while false |
| `duration_min`, `room_opens_min_before` | int | 65 and 10 for the pilot |
| `event_status` | enum | `upcoming · live · ended · postponed · cancelled`. `ended` is shown as **"Held"** (برگزار شد). |
| `registration_open`, `capacity` | bool, int | Close the form when full or past the deadline |
| `join_visibility` | enum | **`public`** shows the link on the page (Session 1). `registrants` sends the link only by WhatsApp/email. |
| `join_url` | url | Meeting room link. **Empty means "Link will be posted soon".** Never print it as text, and with `registrants` never render it in the HTML at all. |
| `utm_campaign` | string | Default campaign for registrations |
| `{lang}.title / excerpt / body[] / outcomes[]` | text | Per language |

Marketing must be able to create and edit these entries without a developer, exactly like blog posts.

## 6. Page behaviour

**Joining card** (session page sidebar; it comes first on mobile). The same logic drives the list-page feature card and the thank-you page.

| Condition | What shows in place of the link |
|---|---|
| `event_status = ended` | ✅ **"This session has been held"** box + *Book a consultation*. No countdown, no form, **no video**. |
| `join_visibility = registrants` | 🔒 "Link sent after registration" |
| public, `join_url` empty | ⏳ Dashed, non-clickable **"Link will be posted soon"** + "the link will appear here before the session" note |
| public, `join_url` set | **Join the webinar** (opens in a new tab), *Copy link*, "room opens 10 min before" note. When `live`, the button says *Join now — live* and the countdown is hidden. |

Countdown, time zones, *Add to calendar* (.ics) and *Share on WhatsApp* are shown in every state except `ended`.

The list page has **no "past sessions" section**. A held session stays in the series list with a "Held" badge. The feature card moves to the next upcoming session.

**Registration form.** It is *optional* for Session 1 and gives WhatsApp reminders plus the checklist.

| Field | Required | Rule |
|---|---|---|
| Name (`fullName`) | yes | 2–60 chars. Doesn't have to be the real name. |
| WhatsApp (`dialCode` + `phone`) | yes | Default **+93**. Also +971, +90, +98 and others. Normalise Persian/Arabic digits and drop leading 0. +93 → `7XXXXXXXX`, +971 → `5XXXXXXXX`. |
| Email | no | Optional on purpose: requiring it causes drop-off inside Afghanistan |
| Residence country | yes | AF / AE / TR / IR / other |
| Question | no | Max 500 chars, with the hint "don't write personal or financial details" |
| Newsletter | no | Checkbox, **off by default** |
| Hidden | auto | `webinar_id`, `utm_source`, `utm_campaign`, `lang`, `registered_at_utc`, `source`, `page` |

- Never ask for assets, investment amount, passport or Tazkira numbers.
- **Duplicates:** the same WhatsApp number on the same webinar returns the existing registration and does not create a new row. Do this server-side (Apps Script).
- **Spam:** hidden honeypot field `company`, plus a per-IP rate limit. Avoid heavy CAPTCHAs, because many visitors are on weak connections.
- Privacy line under the button (all 4 languages are in the locale files).

**Submission.** Reuse `assets/js/forms.js` → `CRM_WEBHOOK_URL` (Google Apps Script) with `form_id: "webinar-registration"`. The demo payload keys (`fullName`, `dialCode`, `phone`, `source`, `page`, `form_id`) already match `handleContactSubmit`. Write webinar registrations to their own sheet tab, so marketing can export Excel/CSV per webinar. The demo's CSV export (UTF-8 BOM, formula-safe) shows the column order.

**Messages** (pilot: marketing sends WhatsApp manually from the export, from the UAE number):

| When | Message | Channel |
|---|---|---|
| Immediately | Confirmation + session time | Thank-you page (+ email if given) |
| 3 days before | Reminder + "send your question" | WhatsApp |
| 24 h & 1 h before | Meeting link | WhatsApp + email |
| ≤ 24 h after | Thanks, short summary, checklist, consultation link (a YouTube link may be sent here, but never placed on the site) | WhatsApp + email |

## 7. Privacy and data

- Do not put phone numbers or emails in URLs, Google Analytics or ad pixels.
- Limit access to the registration data to 2–3 named people (marketing and consultation).
- Recordings (YouTube only, not the site) must show only the speakers and slides, never participants.
- Do not add the meeting platform's name to page text, alt text, meta tags, structured data or the calendar file's LOCATION (use "Online").

## 8. Test before publishing (Report Part 3)

- [ ] The form opens and submits on an Android phone over a slow connection. Test once from inside Afghanistan.
- [ ] +93 and +971 numbers are saved correctly and appear with the country code in the export.
- [ ] Registering twice with the same number does not create a second row.
- [ ] The confirmation email reaches Gmail and Outlook and does not land in spam.
- [ ] Kabul and Dubai times display correctly, including around the day change.
- [ ] The form closes when capacity is full or the deadline passes.
- [ ] Full path works: campaign link → registration → confirmation email → row in export with the correct source.
- [ ] The public meeting link opens in under 2 minutes with no app installation (Kabul and Herat).
- [ ] With `join_url` empty the page shows "Link will be posted soon". Pasting the link in the admin switches it to the button with no code change.
- [ ] After setting `ended`, every page shows "Held", and no link, video or platform name is visible.
- [ ] A search of the page source finds no "Alocom" or "الوکام".

## 9. Questions for the web team

1. Stack (WordPress or custom)? How long and how much for a blog-like content type?
2. Which service sends the automatic email?
3. Can the UAE WhatsApp Business number be used for sending?
4. Who has panel access, and who owns the data?
5. Can you deliver a first version **10 days before Session 1** (campaign start)? If not, marketing will use a temporary form with the same fields and migrate the data later.

## 10. Remove before production

Demo bar, demo controls panel, `localStorage` storage, `#/admin` and `#/integration` preview pages, `fonts-local.css`, the sample meeting link (`meet.example`) and the "sample date" labels.

## Files

```
index.html                     demo entry (hash router)
assets/css/webinars.css        all section styles (tokens on :root)
assets/css/fonts-local.css     offline fonts for the demo only
assets/js/webinars-i18n.js     UI strings, 4 languages
assets/js/webinars-data.js     sample sgcms_webinars entries
assets/js/webinars-app.js      rendering, form, .ics, CSV, demo controls
assets/images/logo.svg         site logo (from /assets/images/vector_b5a81734.svg)
locales/webinars.*.json        merge into /assets/locales/{lang}.json
data/sgcms_webinars.sample.json  CMS sample
screenshots/                   desktop + mobile, all languages and states
```
