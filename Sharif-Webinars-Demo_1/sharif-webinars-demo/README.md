# Sharif Group — Webinars section prototype (v3.1)

**For:** Dubai web team · **From:** Marketing team · 13 October 2026

## What this is

A clickable prototype of the new **Webinars** section (`/webinars`) for sharifgroup.ae. Colours, fonts, header and footer were taken from the live site so the new section matches the rest of it. All four languages (Persian, English, Arabic, Chinese) are included, with full RTL and LTR support.

This is a design and behaviour reference, not production code. Please build it on the current website platform.

## How to view it

Double-click `index.html`. No internet connection is needed. The **Demo controls** button in the bottom corner switches between states:

- session: upcoming, live or held
- link: "coming soon" or "ready"
- link visibility: public or registrants only

## Key points

1. **The joining link has three states.** Until we paste the link in the admin panel, the page shows "Link will be posted soon". Once the link is set, a public "Join the webinar" button appears. After the session, "This session has been held" replaces the link. Registration is optional and only used for WhatsApp reminders.
   - **No recordings or archive on the website.** Videos are published only on our Persian YouTube channel.
   - **The meeting platform's name (Alocom) must never appear on the website.**
2. **Admin like the Blog.** A new `sgcms_webinars` collection with the same structure as `sgcms_blog`, so marketing can add webinars without a developer.
3. **Registration form:** name, WhatsApp (default +93), optional email, country of residence, optional question and a newsletter checkbox (off by default). It submits through the existing `forms.js` → CRM webhook with `form_id: webinar-registration`.
4. **Site integration:**
   - a "Webinars" menu item next to Blog
   - a slim homepage banner
   - a card at the end of related blog posts
5. **Deadline:** the first version should be ready **10 days before the first session** (campaign start).

The short brief is in `Brief-for-Web-Team.pdf`. Full technical details (fields, behaviour, tests) are in [`docs/HANDOFF.md`](docs/HANDOFF.md).

Dates, speakers and the meeting link are placeholders. The Arabic and Chinese text needs review by a fluent speaker.
