# "Become a Partner" page — technical handoff

**Version:** demo v1, 18 October 2026 · **From:** Sharif Group Marketing

A clickable reference for a new partner-recruitment page at `/partners/`. It uses the same design tokens, fonts and four-language setup as the Webinars section. It is a reference only, not production code.

## 1. Open the demo

- Double-click `index.html`. It works offline.
- The **Demo controls** button links to every page: partner page, thank-you page, applications preview and site integration.
- Applications are stored only in this browser. The payload is printed to the console, and nothing is sent anywhere.

| Demo route | Production URL |
|---|---|
| `#/partners` | `/partners/` · `/fa/partners/` · `/ar/partners/` · `/zh/partners/` |
| `#/partners/thanks` | `/partners/thanks/` (+ language prefix), **noindex** |
| `#/admin` | Preview of the Google Sheet tab. Not a real admin. |
| `#/integration` | Menu, footer and homepage placements + URL map |

## 2. Where it goes on the site

1. **"About Us" dropdown:** add **"Become a Partner"** as the last item, below a divider, with a small "New" badge. Add the same item in the mobile drawer under About Us.
   - Do **not** add it as a top-level menu item or as a header pill button. Those are for clients.
2. **Footer → Quick Links:** add **"Partner With Us"**.
3. **Homepage:** add a slim dark band just above the footer ("Are you an agency, firm or introducer?" + *Become a Partner* button).
4. **Dedicated page** `/partners/` in all four languages, so the link can be shared directly on LinkedIn, by email and on WhatsApp.

## 3. Page sections (top to bottom)

| # | Section | Notes |
|---|---|---|
| 1 | Hero | Eyebrow, title, short intro, *Apply to partner* (scrolls to form) and *How it works* (scrolls to steps) |
| 2 | Stats band | Same four numbers as the homepage stats band. Keep them in sync with the homepage. |
| 3 | Who can partner | 3 cards: immigration agencies, professional firms, individual introducers. Each card's link scrolls to the form and pre-selects that type. |
| 4 | What you get | 6 benefits on the dark "Our Services" style card |
| 5 | How it works | 4 steps: apply → introductory call → written agreement → refer clients |
| 6 | Programmes | Chips for all citizenship, residency and other programmes (same list as the footer) |
| 7 | Application form + "Good to know" | Sidebar is sticky on desktop and goes under the form on mobile |
| 8 | FAQ | 5 questions |

**Do not show:** commission percentages or amounts, government agent licences or listings, or any promise of approval, timelines or results.

## 4. Application form

| Field (payload key) | Required | Rule |
|---|---|---|
| `partner_type` | yes | `agency` · `firm` · `individual` (radio cards) |
| `fullName` | yes | 2–80 chars |
| `job_title` | no | |
| `company` | yes, except `individual` | Becomes optional when "Individual introducer" is selected |
| `country` | yes | Free text |
| `city` | no | |
| `dialCode` + `phone` | yes | Default **+971**. Normalise Persian/Arabic digits and drop leading 0. Store `whatsapp_e164`. |
| `email` | yes | Lower-cased. Used for the duplicate check. |
| `website` | no | Domain or LinkedIn URL |
| `programmes` | no | Multi-select chips, sent as a comma-separated list of keys |
| `referrals_per_year` | no | `v1` 1–5 · `v2` 6–20 · `v3` 21–50 · `v4` 50+ · `unsure` |
| `heard_from` | no | referral · linkedin · instagram · search · event · other |
| `message` | no | Max 1000 chars |
| `consent` | yes | Checkbox: "I agree that Sharif Group may contact me about this application." |
| hidden | auto | `form_id: "partner-application"`, `application_id`, `submitted_at_utc`, `lang`, `source`, `page` |

- **Submission:** use the existing `forms.js` → `CRM_WEBHOOK_URL` flow. In the Apps Script, route `form_id === "partner-application"` to a new sheet tab **`Partner_Applications`**, separate from client leads and webinar registrations.
- **Duplicates:** the same email returns the existing application and creates no new row.
- **Spam:** hidden honeypot field `hp_url`.
- **Notification:** send an email to the partnerships owner (address to be confirmed by marketing) for each new application. An auto-reply to the applicant is optional.
- The CSV export in the demo shows the column order.

## 5. Translations

- UI strings are in `assets/js/partners-i18n.js`. Ready-to-merge copies are in `locales/partners.{en,fa,ar,zh}.json`.
- Add `nav.becomePartner` and `footer.partnerWithUs` to the existing blocks. Add `partners` as a new top-level block.
- **Arabic and Chinese should be reviewed by a fluent speaker.**

## 6. Remove before production

Demo bar, demo controls, `localStorage`, the `#/admin` and `#/integration` preview pages, and `fonts-local.css` (the site already loads these fonts).

## 7. Test checklist

- [ ] Menu item appears under About Us on desktop and mobile in all four languages.
- [ ] Each "Who can partner" link scrolls to the form and pre-selects the right type.
- [ ] Company becomes optional for "Individual introducer".
- [ ] A submission lands in `Partner_Applications` with the right columns, and the notification email arrives.
- [ ] Submitting again with the same email does not create a second row.
- [ ] RTL layout is correct in Persian and Arabic, with no horizontal scroll at 320 px.
