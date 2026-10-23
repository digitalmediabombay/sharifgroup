# "Become a Partner" page — technical handoff

**Version:** demo v2 (short version), 19 October 2026 · **From:** Sharif Group Marketing

A clickable reference for a short partner-recruitment page at `/partners/`. It uses the same design tokens, fonts and four-language setup as the Webinars section.

**This is only a demo.** Please feel free to use your own creativity to make the page look more professional and to integrate it better with the rest of the website.

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

1. **"About Us" dropdown:** add **"Become a Partner"** as the last item, below a divider, with a small "New" badge. Do the same in the mobile drawer.
2. **Footer → Quick Links:** add **"Partner With Us"**.
3. **Homepage:** add a slim dark band just above the footer with a *Become a Partner* button.

## 3. Page content (short on purpose)

1. **Hero:** title, a two-sentence intro and one *Apply now* button that scrolls to the form.
2. **Left column:**
   - **Who we work with:** 3 one-line items (immigration agencies & consultancies; professional firms such as law, accounting, wealth management, real estate and travel; individuals with a network).
   - **How it works:** 3 steps: *Apply → Introductory call & due diligence → Partnership agreement*.
3. **Right column:** the application form.

**Not on the page:** stats, benefit lists, programme lists, FAQ, commission figures, government agent licences, and any promise of approval or timelines.

## 4. Application form

| Field (payload key) | Required | Rule |
|---|---|---|
| `partner_type` | yes | `agency` · `firm` · `individual` |
| `fullName` | yes | 2–80 chars |
| `company` | yes, except `individual` | Becomes optional when "Individual" is selected |
| `country` | yes | Free text |
| `email` | yes | Lower-cased; used for the duplicate check |
| `dialCode` + `phone` | yes | Default **+971**. Normalise Persian/Arabic digits and drop leading 0. Store `whatsapp_e164`. |
| `message` | no | Max 1000 chars |
| `consent` | yes | "I agree that Sharif Group may contact me about this application." |
| hidden | auto | `form_id: "partner-application"`, `application_id`, `submitted_at_utc`, `lang`, `source`, `page` |

- **Submission:** use the existing `forms.js` → `CRM_WEBHOOK_URL` flow. In the Apps Script, route `form_id === "partner-application"` to a new sheet tab **`Partner_Applications`**, separate from client leads and webinar registrations.
- **Duplicates:** the same email returns the existing application and creates no new row.
- **Spam:** hidden honeypot field `hp_url`.
- **Notification:** email every new application to **mohammad@sharifgroup.ae**.

## 5. Translations

- UI strings are in `assets/js/partners-i18n.js`. Ready-to-merge copies are in `locales/partners.{en,fa,ar,zh}.json`.
- Add `nav.becomePartner` and `footer.partnerWithUs` to the existing blocks, and `partners` as a new top-level block.
- **Arabic and Chinese should be reviewed by a fluent speaker.**

## 6. Remove before production

Demo bar, demo controls, `localStorage`, the `#/admin` and `#/integration` preview pages, and `fonts-local.css`.

## 7. Test checklist

- [ ] The menu item appears under About Us on desktop and mobile in all four languages.
- [ ] Company becomes optional for "Individual".
- [ ] A submission lands in `Partner_Applications` and the notification reaches mohammad@sharifgroup.ae.
- [ ] Submitting again with the same email does not create a second row.
- [ ] RTL layout is correct in Persian and Arabic, with no horizontal scroll at 320 px.
