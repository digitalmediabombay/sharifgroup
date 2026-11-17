*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 1*

# Website Technical Remediation Handoff

**Sharif Group | sharifgroup.ae | Reviewed edition**

44 evidence-labelled findings and proposals, implementation guidance, acceptance tests and supporting evidence.

- **First:** make submissions verifiably reliable.
- **Next:** measure and reduce costly mobile loading work.
- **Also:** repair broken interactions and review public CMS access.

**For the developer:** Use this as a triage and implementation backlog. Confirm requirements for proposals before scheduling them. Keep ticket IDs T01-T44 in commits, pull requests and test evidence. Report completed work against the acceptance criteria, with the deployed URL and release identifier.

**Scope:** Technical operation, speed, reliability, accessibility, localization and navigation. No marketing-copy rewrite or complete rebuild is prescribed.

**Evidence:** Observed public responses, browser interactions and exact-function isolated replays from 10 November 2026. No production form submissions or site changes were made.

**Important distinction:** The 44 entries include confirmed defects, reproducible edge cases, conditional risks and improvement proposals. They are not 44 security vulnerabilities. Private backend behavior requires inspection and integration tests.

### Package contents

This PDF; editable English issue register (CSV/JSON); proposed submission contract; performance plan; public source snapshots and test evidence. Source references use the packaged work/audit-10nov/ directory. Line numbers refer to saved snapshots and may differ after a new release.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 2*

# Scope, priorities and reading guide

### Coverage

572 distinct HTML pages (552 sitemap + 20 additional), 143 per locale. All returned 200. Resource inventory 840 distinct URLs: 837 attempted, 834 HTTP responses and 3 transport errors; 3 intentionally not fetched. Of attempted resources, 807 returned 200/206, 5 returned 404, 6 returned 403, 15 returned 429 and 1 returned 520. 2152 executable inline script blocks were checked; 4 syntax failures were found.

### Interpretation

HTTP 200 does not prove a working form or correct content. External 403/429/520 responses do not universally prove browser-visible failure. Performance results are single-run lab observations without sufficient real-user field data. Backend receipt/delivery and vulnerability exploitability are not inferred from client code.

### Priority calibration

No P0 is assigned from the available public evidence. P1 means urgent next-release work or investigation, not a proven security emergency. Escalate only when internal evidence establishes impact.

### P1 - next release

Receipt integrity and recovery, phone payload handling, Contact syntax errors, mobile load investigation, keyboard/label behavior, webinar phone coverage, WhatsApp share and JavaScript-failure fallback.

### P2/P3

P2 covers remaining fixes, deployment risks and backend/product reviews. P3 covers optional rendering, family-cost, sitemap, image and defense-in-depth improvements. A proposal is not a confirmed defect.

### Implementation sequence

1) Inspect and test receipt handling. 2) Fix Contact script and WhatsApp sharing; release versioned assets. 3) Measure footer/hero loading and improve accessibility/forms. 4) Resolve localization, assessment and event logic issues. 5) Review data access and integration contracts; schedule optional improvements.

### Definition of done

Code change + automated/manual evidence + deployment version + same-scenario retest. A screenshot of a thank-you screen alone does not prove persistence or CRM delivery.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 3*

# Implementation tickets

## T01 | Success shown without confirmed server receipt

**P1 | Backend + Frontend | Confirmed client reliability defect; isolated failure tests**

**Observed / why it matters.** Isolated rejected-fetch tests still show success or a thank-you screen in all four flows. Additional contact/webinar tests model a readable first-party HTTP 503 and an opaque CRM response (status 0; outcome unknown). The handlers do not verify receipt. Actual production request loss was not measured.

**Action / proposed change.** Require a verifiable acknowledgement before success/reset. Inspect existing persistence and delivery guarantees first. Appendix A proposes a first-party receipt and durable retry design; an equivalent architecture is acceptable. Remove swallowed errors and timer-driven unverified success.

**Acceptance test.** Offline/4xx/5xx/malformed-response tests never show unconfirmed success. Input survives. Every valid receipt is traceable to one persisted record.

**Source:** forms-live.js:811-840; partners-app.js:1483-1553; webinars-app.js:2093-2127; raw/15d992d0a7a3d6c891.html:1603-1670

## T02 | No bounded recovery from a pending request

**P1 | Frontend + Backend | Confirmed**

**Observed / why it matters.** The contact button remains disabled while its awaited CRM promise never settles. There is no application-level timeout/recovery path; the browser may eventually fail the connection.

**Action / proposed change.** Add a documented timeout and an outcome_unknown state. Preserve a frozen payload and idempotency key. Retry the same operation or check its receipt status. An aborted browser request does not prove server rollback.

**Acceptance test.** A stalled response leaves pending within the configured time. Input remains available and retry cannot duplicate a previously accepted request.

**Source:** forms-live.js:656-658,821-848; technical-form-replay-reviewed.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 4*

# Implementation tickets

## T03 | Review re-entry and server idempotency protection

**P2 | Frontend + Backend | Hardening and integration testing required**

**Observed / why it matters.** No application-level in-flight guard was found. Directly calling the eligibility handler twice creates new IDs, but bypasses native validation; reset clears required fields. Real double-click duplication was not reproduced. Backend deduplication is unknown.

**Action / proposed change.** Test the actual browser flow and concurrent API requests on staging. If absent, add an in-flight guard and server-enforced idempotency. Reuse the same operation key after an uncertain outcome; do not rely on a disabled button alone.

**Acceptance test.** Rapid double-click, concurrent retry and lost-response scenarios create one record and one job per destination.

**Source:** raw/15d992d0a7a3d6c891.html:1603-1670; technical-form-replay-reviewed.json

## T04 | Phone payload can receive a duplicate country prefix

**P1 | Frontend + Backend | Confirmed client payload-normalization defect**

**Observed / why it matters.** The handler blindly concatenates dialCode with rawPhone. Isolated replay produced `+971 abc` and `+971 +971 50 123 4567`. The 528 inspected phone controls lack a pattern; one live short-number validity check passed. Backend acceptance of invalid numbers is untested.

**Action / proposed change.** Use country-aware parsing for national and international formats. Normalize Persian/Arabic digits and canonical E.164 once. Validate again on the server. Show localized inline errors; do not indiscriminately remove meaningful leading digits.

**Acceptance test.** National, +971 and 00971 forms normalize consistently. Reject letters/impossible lengths. Pasted international numbers never receive a second prefix.

**Source:** forms-live.js:665-669; technical-form-inventory.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 5*

# Implementation tickets

## T05 | Past contact dates pass client validation

**P2 | Frontend + Backend | Confirmed**

**Observed / why it matters.** 472 inspected preferred-date controls have no min. The handler forwards the date without a temporal check. On 10 November 2026, the live browser reported validity.valid=true for 2025-01-01 without submitting. Server acceptance was not tested.

**Action / proposed change.** Define allowed dates/minimum notice in the selected timezone, set the client minimum and enforce the same rule on the server. Return a field-specific validation error.

**Acceptance test.** Yesterday is rejected; earliest valid date works. Test midnight boundaries for Dubai, Kabul and a western timezone.

**Source:** forms-live.js:790-791; technical-form-inventory.json; technical-ui-evidence.json:UI09

## T06 | Fixed UTC offsets do not match city/date rules

**P2 | Frontend + Backend | Confirmed**

**Observed / why it matters.** Contact/home options place Istanbul under UTC+02 although IANA resolves it to +03. Fixed London/LosAngeles labels do not account for summer offsets.

**Action / proposed change.** Store IANA timezone IDs, not just offsets. Derive the offset for the requested date using Intl or a maintained timezone implementation. Detect the browser zone only as a suggestion.

**Acceptance test.** Dubai, Kabul, Istanbul, London and LosAngeles are correct in winter and summer; payload preserves the selected zone ID.

**Source:** historical/technical-logic-findings.json:LOGIC-11; contact/home timezone options

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 6*

# Implementation tickets

## T07 | Syntax error in all four Contact locales

**P1 | Frontend / Templates | Confirmed**

**Observed / why it matters.** All four Contact pages contain a malformed inline script. Across 2152 executable inline blocks, exactly 4 failed parsing. An orphan option-template tail and unmatched braces follow the comment about moving sub-service logic to forms.js. Live Persian console reproduced SyntaxError.

**Action / proposed change.** Remove the residual template fragment in the source template, centralize active country-picker logic, rebuild all locales and parse-check generated scripts before deployment.

**Acceptance test.** All 4 Contact pages load without SyntaxError. Slideshow, country picker, dependent selects and form behavior each pass a browser test.

**Source:** raw/f1d71b392b0b4361e8.html:1524-1528; technical-inline-errors.json

## T08 | Unversioned scripts are cached for 30 days

**P2 | Build / Hosting | Confirmed cache configuration; deployment risk**

**Observed / why it matters.** forms.js is referenced without a version on 532 pages and served with max-age=2592000. Other shared scripts/styles show the same pattern. Returning browsers may keep old behavior after an in-place replacement.

**Action / proposed change.** Publish content-hashed asset URLs or consistently bumped release versions. Keep long caching for immutable versioned assets. Revalidate or explicitly purge HTML so it references the new build. Deploy/rollback a consistent asset set.

**Acceptance test.** Warm the previous release cache, deploy, then test ordinary navigation and normal reload separately. Updated HTML must reference the correct release assets without manual cache clearing. Repeat for all four locales.

**Source:** technical-http-evidence.json; technical-asset-probes.json; raw/13746fdfb4a0dffd9c.html:3225

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 7*

# Implementation tickets

## T09 | Investigate large reported footer-video payload

**P1 | Frontend / Performance | Confirmed lab observation; causality requires network trace**

**Observed / why it matters.** Dominica mobile PSI reports 33,511 KiB total. Its payload table lists the same MP4 twice, each 13,501.6 KiB. Two video elements feed a canvas crossfade; preload=none and IntersectionObserver already exist. Full duplicate downloads and their initiators are not proven by this table alone.

**Action / proposed change.** Capture request initiators, byte counts and Range behavior. Compare a static poster on mobile with the current implementation. If video is retained, test one compressed stream, on-demand source attachment and pausing when hidden; preserve the visual effect only if its measured cost is justified.

**Acceptance test.** Compare equal-condition 30-second traces before scrolling and approaching the footer. Report total bytes and Range requests accurately; multiple partial responses do not alone prove duplicate streams. Retain only changes with measured benefit.

**Source:** raw/13746fdfb4a0dffd9c.html:2237, 2419, 2444; perf-mobile.json

## T10 | Late LCP and heavy changing hero backgrounds

**P1 | Frontend / Performance | Confirmed**

**Observed / why it matters.** Mobile LCP: Dominica EN 21.8s, FA 32.2s, AR 18.0s, ZH 36.8s; home EN 13.2s, FA 13.7s. EN Dominica FCP was 2.6s, so the page was not necessarily blank until LCP. Five CSS backgrounds rotate every 3000 ms; opacity 0 does not prevent download.

**Action / proposed change.** Use a stable first img/picture with responsive variants, explicit dimensions and high fetch priority. Load later slides on demand. Test a static first hero to separate carousel timing from network delay. Do not lazy-load the actual LCP image.

**Acceptance test.** Identify the LCP element and its discovery/download/render delays. Run at least 3 cold tests per selected locale using the same profile. Add real-user metrics; current PSI has no field data.

**Source:** raw/13746fdfb4a0dffd9c.html:751, 2483; perf-mobile.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 8*

# Implementation tickets

## T11 | English articles schedule all three translation datasets

**P2 | Frontend / Content delivery | Confirmed**

**Observed / why it matters.** After 150 ms, blog-translator.js queues AR/ZH/FA datasets not currently loaded. 452 blog pages include it. Measured totals are 638745 gzip bytes and 2908688 decoded bytes; repeat transfer may be reduced by cache.

**Action / proposed change.** First remove background prefetch of unrelated languages while preserving current-language fetch and the language-change listener. Then deliver only the current article/locale, preferably pre-rendered.

**Acceptance test.** Cold EN article load makes no AR/FA/ZH dataset requests. FA downloads only needed FA content. Switching language still opens the equivalent article.

**Source:** logic-blog-translator.js:484,548-560; technical-dataset-transfer.json

## T12 | CSS and font dependency chain delays rendering

**P2 | Frontend / Build | Confirmed**

**Observed / why it matters.** Dominica PSI estimates potential savings of 139 KiB for unused CSS, 76 KiB for unused JS and 1,930 ms for render-blocking requests. These are not proven safely removable totals. multilingual.css uses nested Google Fonts @import; preconnect and display=swap already exist. Estimates are not additive guarantees.

**Action / proposed change.** Generate used Tailwind rules, split page-specific CSS, trim icon families, and load required locale font styles/weights directly in head. Keep existing swap/preconnect. Inspect Coverage before removal.

**Acceptance test.** Network/Coverage show fewer blocking dependencies and less unused code. Validate menus, forms, RTL and all locales. Font declarations alone do not prove every font file downloads.

**Source:** technical-assets/b67ea7798e1b8eadef.txt:2; raw/13746fdfb4a0dffd9c.html:147; perf-mobile.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 9*

# Implementation tickets

## T13 | Broken IMC image on 336 localized articles

**P2 | Templates | Confirmed**

**Observed / why it matters.** /fa/blog/imclogo.webp, /ar/blog/imclogo.webp and /zh/blog/imclogo.webp return 404. Each is referenced by 112 articles. EN image works. This is 3 missing resources affecting 336 pages.

**Action / proposed change.** Use one tested root-relative shared image path or provide the missing assets. Fix the common article template and rebuild affected pages.

**Acceptance test.** Re-crawl all 336 source pages; image responses and naturalWidth are valid. No broken icon is rendered.

**Source:** technical-asset-inventory.json; links.json; historical/technical-crawl-findings.json:TC10

## T14 | Broken social-preview images on 8 programme pages

**P2 | Templates / Content assets | Confirmed**

**Observed / why it matters.** Portugal local portugal-golden-visa-guide.jpg and external Nauru-01.jpg return 404. Each appears in OG/Twitter metadata in 4 locales. Visible body images are a separate check.

**Action / proposed change.** Replace with stable licensed images on controlled hosting, using complete absolute URLs. Update both OG and Twitter metadata and refresh relevant preview caches.

**Acceptance test.** All 8 URLs generate the intended preview image. Asset returns 200 with correct MIME/dimensions.

**Source:** historical/technical-crawl-findings.json:TC11; technical-asset-probes.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 10*

# Implementation tickets

## T15 | External image availability is not fully reliable

**P2 | Frontend / Content assets | Observed availability risk; end-user impact conditional**

**Observed / why it matters.** Beyond 5 confirmed 404 resources, probes saw 6 x 403, 15 x 429, 1 x 520 and 3 transport errors. Bot/rate/network restrictions may explain some; these are not 22 universally broken images.

**Action / proposed change.** Recheck failed resources in normal browsers and another network. Move essential licensed media to controlled delivery, with suitable fallback. Separate permanent failures from conditional host responses.

**Acceptance test.** Hero/maps/trust images work across clean mobile/desktop sessions. Record confirmed failures separately from probe restrictions.

**Source:** external-images.json; technical-asset-probes.json

## T16 | Keyboard navigation fails in desktop and mobile menus

**P1 | Frontend / Accessibility | Confirmed**

**Observed / why it matters.** Desktop Tab skips hidden mega-menu links. Mobile closed drawer remains focusable offscreen; Tab reached a link at x 404 in a 390 px viewport. Escape did not close it. State attributes are incomplete.

**Action / proposed change.** Use disclosure buttons with aria-expanded/controls. Support Enter/Space and Escape; hide or inert the closed drawer. Move/restore focus deliberately and prevent focus from being lost behind a modal drawer.

**Acceptance test.** Every destination is reachable using keyboard alone. Closed drawer contains no focusable controls. Screen reader announces expanded/collapsed state.

**Source:** logic-navbar.css:278; logic-navbar.js; technical-ui-evidence.json:UI01-02

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 11*

# Implementation tickets

## T17 | Visible labels are not programmatically associated

**P1 | Frontend / Accessibility | Confirmed**

**Observed / why it matters.** Persian Contact has 13 controls without standard linked labels, including country search. Four initial eligibility selects have the same association gap. Some controls may obtain fallback names; not all were proven unnamed.

**Action / proposed change.** Give each control a unique id and matching label for. Associate help/error text using aria-describedby. Use aria-invalid after validation and aria-pressed for toggle choices.

**Acceptance test.** Accessibility tree exposes correct names/states. Labels activate controls. Complete a form with VoiceOver or NVDA.

**Source:** technical-ui-evidence.json:UI03; historical/technical-logic-findings.json:LOGIC-10

## T18 | Dialog focus and dynamic results are not announced

**P2 | Frontend / Accessibility | Confirmed**

**Observed / why it matters.** WhatsApp modal has role=dialog and aria-modal=true but lacks an accessible name; opening leaves focus on its trigger. Eligibility result replacement has no clear live announcement/focus target.

**Action / proposed change.** Name the dialog using its heading, move focus inside and return it on close. Announce a short result summary through a polite live region and provide a focusable result heading.

**Acceptance test.** Keyboard/screen-reader users detect opening, result count and closing without visual scrolling. No background focus escape from a modal.

**Source:** technical-ui-evidence.json:UI04; historical/technical-logic-findings.json:LOGIC-10

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 12*

# Implementation tickets

## T19 | Persian country search accepts English names only

**P2 | Frontend / Localization | Confirmed**

**Observed / why it matters.** Searching Afghanistan in Persian found nothing, while Afghanistan in English immediately returned +93. Search placeholder and stored country names are English.

**Action / proposed change.** Index localized names, English aliases and dial codes. Normalize Persian/Arabic letter variants and digits. Keep a stable country identifier separate from translated display text.

**Acceptance test.** Persian name, English name, 93 and +93 resolve to the same country. Repeat equivalent cases in AR/ZH.

**Source:** technical-ui-evidence.json:UI09; /fa/contact/

## T20 | Webinar dial-code selector excludes many countries

**P1 | Frontend / Forms | Confirmed**

**Observed / why it matters.** Webinar DIAL list has 13 fixed entries and no custom alternative although residence allows Other. +33, +31, +46 and many valid numbers have no correct prefix option.

**Action / proposed change.** Use a complete localized country selector with country-aware phone parsing. Support pasting international numbers without requiring a conflicting prefix.

**Acceptance test.** Valid numbers from existing and omitted countries normalize correctly; invalid numbers get clear errors.

**Source:** webinars-app.js:19-22; historical/technical-logic-findings.json:LOGIC-12

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 13*

# Implementation tickets

## T21 | Book Consultation reloads the contact page top

**P2 | Frontend / Navigation | Confirmed**

**Observed / why it matters.** On Persian Contact, the consultation link returned to the top of the same page; form was still 3767 px below the viewport in the observed desktop session.

**Action / proposed change.** Link to the correct form anchor. Apply scroll-margin for the fixed header and focus the form heading/first appropriate control after navigation. Respect reduced motion.

**Acceptance test.** CTA brings the usable form into view in all 4 locales and mobile/desktop, without covering its heading.

**Source:** technical-ui-evidence.json:UI09; /fa/contact/

## T22 | Office map links use inconsistent destination strategies

**P2 | Frontend / Shared configuration | Confirmed**

**Observed / why it matters.** Main Contact address card uses a general Google Maps query; footer uses an exact Office 116 PlaceID. A different resolved physical pin was not proven.

**Action / proposed change.** Centralize the verified office destination and PlaceID, then reuse it for every address card, footer and directions action.

**Acceptance test.** All 4 locales use the intended exact office destination. Test the actual maps result, not just the label.

**Source:** Contact pages; /contact/ and footer map anchors

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 14*

# Implementation tickets

## T23 | Localized article URL still renders English content

**P2 | Localization / Templates | Confirmed**

**Observed / why it matters.** The Persian Dominica Passport for Afghans article retained English heading/body with Persian digits. Related locale metadata also matches English in some inspected pages.

**Action / proposed change.** Generate the actual localized article and title/description/share metadata from a locale record. Define an explicit missing-translation fallback; preserve equivalent-article routing.

**Acceptance test.** Initial HTML and rendered content have the intended language. Language switch preserves article identity and does not merely replace numerals.

**Source:** /fa/blog/dominica-passport-for-afghans-in-2026/; metrics.json; technical-ui-evidence.json:UI10

## T24 | Runtime text replacement produces duplicated UI text

**P2 | Frontend / Localization | Confirmed**

**Observed / why it matters.** Rendered home heading became Success Stories Stories; original and post-processed text differed. Some translated CTA labels are also incorrect.

**Action / proposed change.** Use stable translation keys and deterministic component rendering. Make repeated localization idempotent; avoid global replacement of already translated visible text.

**Acceptance test.** Load, switch language and navigate back repeatedly. No appended duplicate words or stale mixed-language UI remains.

**Source:** Home rendered UI; historical/technical-crawl-findings.json:TC17; language scripts

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 15*

# Implementation tickets

## T25 | Confirm the intended treatment of Other nationality

**P2 | Frontend / Assessment logic | Confirmed output; product and rules clarification**

**Observed / why it matters.** Other + UAE + single + over 600k returns eight recommendations and requiresReview=false under a categorical eligibility heading. A disclaimer qualifies the results. Every country in the coded restriction lists appears in the selector, so Other may intentionally mean remaining countries.

**Action / proposed change.** Confirm the intended nationality coverage with the product/rules owner. Align the heading and review flag with that definition. If Other means unknown or unsupported, request clarification; if it means the remaining countries, explain this clearly. Legal rule accuracy was not audited.

**Acceptance test.** Document and test the meaning of Other, missing and unsupported values. Result headings, explanations and review states consistently reflect the approved model and existing disclaimer.

**Source:** raw/15d992d0a7a3d6c891.html:1172-1189, 1463; technical-logic-replay.json

## T26 | Conditional alternatives omit budget qualification

**P2 | Frontend / Assessment logic | Confirmed behavior; clarify intended product rule**

**Observed / why it matters.** conditionalList is filled before maxBudget filtering. Afghan/UAE/single/under 100k returns site-dataset minimums of 105k, 130k, 230k and 235k. The conditional explanation addresses residence exceptions, not the budget mismatch. Showing alternatives may be intentional.

**Action / proposed change.** Apply budget evaluation to every result category, or explicitly label above-budget options and show the amount/shortfall. Keep each criterion result separate.

**Acceptance test.** No option above the chosen ceiling is represented as budget-compatible. Test every tier boundary and conditional category.

**Source:** raw/15d992d0a7a3d6c891.html:1178-1189, 1215-1216

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 16*

# Implementation tickets

## T27 | Consider family-specific cost clarification

**P3 | Product + Assessment logic | Optional product and clarity enhancement**

**Observed / why it matters.** Family selection changes ranking bonuses, not fromUSD or budget filtering. Prices already say From; a disclaimer explains investment thresholds, excluded fees and case-by-case eligibility. The current tool does not calculate household cost; an incorrect quotation was not proven.

**Action / proposed change.** Decide whether household cost estimation is in scope. If so, use verified dependent details and versioned rules. Otherwise consider placing a short family-cost limitation beside the results, retaining the existing price and eligibility qualifications.

**Acceptance test.** Approved scope is clear to users. If a family-cost estimate is added, validate it against reviewed cases and identify excluded fees. Do not require a new calculator solely from the current observation.

**Source:** raw/15d992d0a7a3d6c891.html:1191-1203, 1463

## T28 | WhatsApp sharing is rewritten into company contact

**P1 | Frontend / Shared widget | Confirmed**

**Observed / why it matters.** Global widget rewrites non-company wa.me links to a company number, deleting share text. Both tested event pages showed the wrong share target. Original share builder also uses a relative event path.

**Action / proposed change.** Restrict rewriting to explicitly marked contact links. Leave share links unchanged. Build absolute event URLs with `new URL(pageUrl(w), location.origin).href`.

**Acceptance test.** Share opens recipient selection with correct title and full HTTPS event URL; contact actions still use intended company numbers in all locales.

**Source:** logic-whatsapp-widget.js:901-914; webinars-app.js:1538-1539

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 17*

# Implementation tickets

## T29 | Calendar export contains a relative event URL

**P2 | Frontend / Calendar | Confirmed**

**Observed / why it matters.** Exact-function replay generates a relative /events/... value in ICS URL. That property requires a URI; a relative path lacks the scheme. The same path in DESCRIPTION is a usability concern, not the same format violation. Real calendar imports were not tested.

**Action / proposed change.** Use the same absolute canonical event URL in ICS URL, description and sharing. Keep UTC time generation and verify escaping/format during import.

**Acceptance test.** Apple Calendar, Google Calendar and Outlook imports have the correct time and a clickable full event URL.

**Source:** webinars-app.js:2285-2295; technical-logic-extra-replay.json

## T30 | Time-derived status overwrites cancelled/postponed

**P2 | Frontend / Event state | Confirmed isolated edge-case replay**

**Observed / why it matters.** Exact-function replay changes future cancelled/postponed records to upcoming through date processing. Both manual states exist in the client admin selector and public badge renderer. No current event is asserted cancelled; private CMS persistence was not tested.

**Action / proposed change.** Preserve manual cancelled/postponed states before deriving upcoming/live/ended. Define registration and join behavior for every supported state. The function already clones its input; shared-state mutation was not established.

**Acceptance test.** State tests cover scheduled, live, ended, cancelled and postponed. Future cancelled events never reappear as active upcoming sessions.

**Source:** webinars-app.js:786-801, 1500-1502, 2174; technical-logic-extra-replay.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 18*

# Implementation tickets

## T31 | Review public CMS snapshot and directory listings

**P2 | Hosting / Backend | Confirmed public access; sensitivity review required**

**Observed / why it matters.** Unauthenticated draft_content.json GET returned 200; directory indexes were visible at /admin/api/, /api/, /clients/, /assets/js/ and /assets/images/uploads/. Intended publicity and content sensitivity were not established. No secret leak, privilege bypass or executable access was demonstrated.

**Action / proposed change.** Review the snapshot content and publishing contract. Restrict confidential drafts/configuration while allowlisting intended public JSON. Disable unnecessary directory indexes, prioritizing operational paths; escalate severity if sensitive material is confirmed. Audit admin authorization internally.

**Acceptance test.** Document which data is intentionally public. Confidential drafts and operational files require authorization; public content remains functional. Unnecessary directory listings are disabled. Do not treat a public asset listing alone as a critical vulnerability.

**Source:** technical-directory-evidence.json; technical-operational-evidence.json

## T32 | Personal records persist in localStorage and console

**P2 | Frontend / Data handling | Confirmed storage behavior; privacy and retention hygiene**

**Observed / why it matters.** Partners/webinars retain name, phone, email and message/question in persistent localStorage without routine expiry. Eligibility logs the lead object. This exposes values to the same browser profile and same-origin scripts; no external access or breach was established.

**Action / proposed change.** Remove unnecessary production personal-data logs. Define retention and draft-recovery needs; minimize local fields, add expiry and cleanup, and retain sensitive records in appropriate protected storage. Keep useful local drafts only where justified.

**Acceptance test.** Document retained fields, purpose and expiry. Verify cleanup and absence of unnecessary console data. Confirmation and approved draft recovery still work; no external exfiltration is asserted.

**Source:** partners-app.js:220-224, 1481-1508; webinars-app.js:2064-2094; eligibility submit handler

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 19*

# Implementation tickets

## T33 | 20 wrong-article schema references; review 321 locale links

**P2 | Templates / Technical SEO | Confirmed wrong-topic references plus localization review**

**Observed / why it matters.** 341 mainEntityOfPage values differ from their document URL. Normalizing locale paths gives 20 different-article references (five slugs across four locales) and 321 equivalent-article English references. Argentina also contains copied Dominica schema text. The 321 locale references are not automatically invalid.

**Action / proposed change.** Correct copied wrong-topic references and schema text. Review the intended translation/entity model for the remaining 321 references; mainEntityOfPage is not universally required to equal the current document URL. Keep identity, language and visible content consistent.

**Acceptance test.** All 448 article records are reviewed against their actual subject and documented locale model. No copied unrelated article remains. Validate representative structured data; no ranking penalty is claimed.

**Source:** technical-schema-issues.json; raw/1fe311bf3b039569a6.html:92; REVIEW-NOTES-EN.txt

## T34 | Event/partner canonical URLs redirect to another host

**P2 | Templates / Technical SEO | Confirmed**

**Observed / why it matters.** 20 added public pages declare www canonical/hreflang targets, but those targets redirect to non-www. 552 sitemap pages use the final non-www host.

**Action / proposed change.** Generate canonical, hreflang, internal links and sitemap using the final non-www origin. Retain the www-to-non-www redirect and verify a permanent 301/308 response.

**Acceptance test.** All declared canonical/alternate targets return 200 directly and language groups reciprocate.

**Source:** extra-pages.json; historical/technical-crawl-findings.json:TC13

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 20*

# Implementation tickets

## T35 | Review first-contact form effort and autofill

**P2 | Product + Frontend | UX improvement proposal**

**Observed / why it matters.** Contact has 9 required fields and Dominica 12. Contact name/email/phone inputs lack explicit autocomplete attributes. Actual abandonment impact has not been measured.

**Action / proposed change.** Agree a minimal initial enquiry schema, then collect further details progressively. Add autocomplete given-name/family-name/name/email/tel as appropriate and suitable mobile input controls.

**Acceptance test.** A new mobile visitor completes an initial enquiry with minimal manual input. Measure completion and lead quality before/after rather than assuming uplift.

**Source:** technical-ui-evidence.json:UI03, UI05; Contact/Dominica forms

## T36 | School exploration CTAs land on a generic form

**P2 | Product + Frontend | Verified UX path mismatch**

**Observed / why it matters.** Explore UK Boarding Schools and Explore Swiss Boarding Schools both target the generic consultation section without passing the selected school category.

**Action / proposed change.** Send exploration CTAs to relevant details, or rename them as consultation actions and preselect the chosen category in the form. Preserve context across the journey.

**Acceptance test.** Destination behavior matches the button promise and the selection is retained in the enquiry.

**Source:** /educationaladvisory/ CTA anchors

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 21*

# Implementation tickets

## T37 | Mobile first screen gives limited direct contact access

**P2 | Product + Frontend | UX improvement proposal**

**Observed / why it matters.** At 390 x 844 the home hero occupies most of the first screen. Consultation is in navigation or lower down; WhatsApp remains visible. Conversion impact was not measured.

**Action / proposed change.** Reduce excessive hero height and expose a clear direct consultation/contact action. Any sticky action must respect safe areas and avoid covering fields or the on-screen keyboard.

**Acceptance test.** At 320/390 px users find and reach contact without opening the menu. Test keyboard-open, landscape and zoomed layouts.

**Source:** technical-ui-evidence.json; home mobile screenshot

## T38 | Content Security Policy needs staged hardening

**P3 | Hosting + Frontend | Defense-in-depth proposal**

**Observed / why it matters.** Sampled responses already contain HSTS, nosniff, SAMEORIGIN, Referrer-Policy and Permissions-Policy. CSP was not observed. This is not proof of exploitable XSS.

**Action / proposed change.** Inventory actual resources, introduce CSP Report-Only, reduce inline handlers/scripts as needed, then enforce a tested policy. Keep necessary integrations functional and validate output encoding separately.

**Acceptance test.** All key flows work under the enforced policy and unauthorized resources are blocked. Review violations without logging personal form data.

**Source:** technical-http-evidence.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 22*

# Implementation tickets

## T39 | Common forms lack a safe JavaScript-failure fallback

**P1 | Frontend + Backend | Confirmed markup risk; browser failure test pending**

**Observed / why it matters.** 528 forms have no method/action and depend on an inline handler. If submission is not cancelled after script failure, HTML defaults can place named fields in a GET URL. A real-browser failure-mode leak was not observed.

**Action / proposed change.** Provide explicit POST and a safe first-party action supporting its form encoding, enhanced by JS. Alternatively block unsafe fallback and show a usable recovery path until initialization succeeds.

**Acceptance test.** On staging, block forms.js and submit synthetic values. No personal data appears in URL/history/referrer; user gets a working response or clear recovery.

**Source:** technical-form-inventory.json; historical/technical-backend-findings.md:F07

## T40 | Clarify the contract of client-supplied crm_synced

**P2 | Backend + Frontend | Confirmed client field; backend contract review**

**Observed / why it matters.** The webinar client sets crm_synced:true before either destination acknowledges. PHP interpretation is unknown; it may be a routing flag indicating that the browser owns delivery, rather than a persisted completion state. False server status or lost retries were not established.

**Action / proposed change.** Inspect PHP and downstream use before changing the field. Distinguish delivery ownership from acknowledged completion in the integration contract. If it controls a success state, make that state server-owned and based on acknowledgement.

**Acceptance test.** Document the field meaning. Verify outage, retry and duplicate cases end to end on staging. No delivery-complete state may depend solely on an unverified browser assertion.

**Source:** webinars-app.js:2098-2111; technical-form-replay-reviewed.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 23*

# Implementation tickets

## T41 | Blog index embeds a large corpus in HTML

**P2 | Frontend / Content delivery | Measured payload; optimization proposal**

**Observed / why it matters.** Four blog indexes are about 1.16 MB decoded each. EN is 263684 gzip bytes, 950,184 inline-script/data characters, including JSON-LD and 127 image elements, before external resources.

**Action / proposed change.** Profile startup/parse cost and intended offline/search behavior. Compare an initial page of summaries with pagination or incremental cached data. Adopt splitting if measured gains justify the tradeoff; a corpus embedded for an intentional feature is not itself a functional defect.

**Acceptance test.** Initial HTML/parse work decreases. Pagination, direct article URLs, history/back and crawlable links still work.

**Source:** /blog/ and localized indexes; historical/technical-crawl-findings.json:TC08

## T42 | 20 public pages are omitted from sitemap

**P3 | Build / Technical SEO | Confirmed omission; indexing maintenance proposal**

**Observed / why it matters.** The 552-entry sitemap excludes 4 Partners pages, 4 event indexes and 12 event details that return 200. Omission does not prove they are unindexed.

**Action / proposed change.** Confirm which event and partner pages are intended for indexing. Consider generating the sitemap from that approved route registry, using final canonical URLs and truthful modification dates; sitemap omission alone does not require a repair.

**Acceptance test.** Approved indexable routes are consistently represented under the chosen sitemap policy. Drafts, redirects, 404 and noindex entries are excluded.

**Source:** sitemap_entries.json; extra-pages.json

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 24*

# Implementation tickets

## T43 | Consider prerendering essential event and partner content

**P3 | Frontend / Rendering | Resilience and rendering enhancement proposal**

**Observed / why it matters.** Initial main content is empty on 20 Events/Partners pages and client scripts populate it. This is a normal application-shell pattern; no failed normal-browser rendering or indexing was established.

**Action / proposed change.** Evaluate resilience, search visibility and first-render needs. If justified, prerender essential heading, description, status and links, then enhance interactions. Do not prescribe an architecture rewrite from empty initial HTML alone.

**Acceptance test.** If adopted, verify useful content with JS disabled and no mismatch with enabled rendering. Compare render timing and indexing evidence before treating this as a mandatory change.

**Source:** extra-pages.json; /events/ and /partners/ source HTML

## T44 | Review responsive photographs and reserved image space

**P3 | Frontend / Images | Markup inventory; measured optimization opportunity**

**Observed / why it matters.** Home has 30 images and Dominica 32 without srcset; 22/31 respectively lack HTML width/height. Some are flags or CSS-sized. Recorded CLS is 0. Neither oversized delivery nor missing layout reservation follows automatically from these attributes.

**Action / proposed change.** Check rendered size, downloaded dimensions and CSS reservation for substantial photographs. Add srcset/sizes and width/height or aspect-ratio where beneficial. Preserve eager LCP loading and avoid unnecessary variants for small icons or SVG flags.

**Acceptance test.** Mobile downloads an appropriate variant; delayed loading preserves geometry. Existing good CLS is not regressed.

**Source:** Home/Dominica HTML img inventory; historical/technical-crawl-findings.json:TC06

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 25*

# Appendix A | Submission reliability contract

### Purpose and evidence

This is a reference implementation, not a mandatory backend rewrite. An equivalent architecture is acceptable if it demonstrates acknowledged durable receipt, safe retries and traceable delivery. Public browser code was inspected and tested in isolation; no real forms were submitted. PHP, database, email and CRM internals were unavailable. Existing persistence or delivery controls may already exist; this review does not establish that they are absent. Inspect and reuse them where suitable.

### Observed problems and code locations

All references below are to saved audit snapshots, not necessarily the developer's repository filenames.

- **forms-live.js:799-840:** sends independently to server and CRM, suppresses delivery errors, then resets the form and displays success. Corrected isolated tests reproduce success after rejected requests, and after a readable first-party HTTP 503 alongside an opaque CRM response whose outcome is unknown.
- **partners-app.js:1506-1553:** saves the application in browser storage and opens the thank-you page after 400 milliseconds without confirming server receipt.
- **webinars-app.js:2093-2127:** stores the record locally, sends crm_synced:true before acknowledgement, and opens the thank-you page after 550 milliseconds. The server's interpretation of that flag is unknown.
- **raw/15d992d0a7a3d6c891.html:1603-1670:** eligibility consultation submission immediately displays success and resets input. It also logs the personal-data payload. This is the saved English eligibilitychecker page.

### 1. Use one first-party submission path

The recommended design sends all four flows through a shared first-party submission service and removes independent browser-to-CRM sends. Existing PHP URLs can remain. An alternative verified receipt/delivery design can meet the same requirements.

Accept an allowlisted form type, schema version, language and relevant customer fields. Validate and normalize telephone, email and appointment date on the server. Derive routing on the server; do not trust client-supplied targetTab, crm_synced or eligibility conclusions.

For the database/outbox design, use ONE transaction to save the submission, idempotency key, normalized payload hash and CRM/email delivery jobs. Commit before acknowledging receipt. Return a server-generated reference and explicit receipt=persisted. CRM may remain pending. Confirm receipt only, not approval, a booked appointment or delivered email. Other storage/queue designs must demonstrate equivalent durability.

### 2. Make retries safe

Create one cryptographically random idempotency key per intended submission. Retain the same key and frozen payload on uncertain retries. Enforce uniqueness atomically in the authoritative persistence layer. Suggested response contract:

- New key: create one submission and return HTTP 201.
- Same key and same payload: return the original receipt with HTTP 200.
- Same key but changed payload: return HTTP 409 with an explicit conflict error.

Simultaneous requests sharing the same key and payload must create one submission and one job per destination. Do not deduplicate solely by telephone/email: a customer can legitimately make another inquiry. Document key retention and retry expiry.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 26*

# Appendix A | Submission reliability contract (continued)

### 3. Handle uncertainty honestly

Use a bounded browser timeout, for example 12 seconds. Aborting a browser request does not prove the server cancelled it. Maintain these states: idle, submitting, received, rejected, outcome_unknown.

After timeout, connection loss, malformed response or unexplained server error, preserve the fields and show that receipt could not be confirmed. Retry the same payload/key. An optional session-bound status endpoint may return receipt status without personal details. Resolve an uncertain submission before treating edited data as a new request. Reset fields and navigate to thanks only after validating the server receipt. Remove personal-data console logging.

### 4. Define response handling

HTTP 400: malformed request; HTTP 422: field errors; neither should persist a submission. HTTP 429: respect Retry-After and reuse the key. For HTTP 503, treat receipt as unknown unless a trusted structured response guarantees no commit. Use HTTP 202 only for a clearly defined durable processing stage. Set Cache-Control: no-store on submission/status responses. Provide an explicit POST action and safe non-JavaScript fallback.

### 5. Deliver through a server outbox

A worker should claim delivery jobs safely, record actual CRM/email acknowledgement, retry with backoff and recover interrupted jobs. Alert on overdue or permanently failed delivery. CRM synchronization state must be server-owned.

If the CRM accepted a write but its response was lost, retry must use a downstream idempotency key/upsert or reconciliation. Do not promise exactly-once external delivery without that capability. Email-provider ambiguity needs equivalent handling.

### Required acceptance tests

- Offline, HTTP 503 and malformed response: no false success or erased input.
- Database commit followed by lost response: retry returns the original reference.
- Twenty concurrent requests with the same key/payload: one record and one job per destination.
- Same key with changed data: HTTP 409.
- Database failure: no receipt or orphan delivery job.
- Worker crash after CRM acceptance: no duplicate CRM record after recovery.
- CRM outage: durable submission retained, sync pending and alert generated.
- JavaScript blocked: no personal fields in URL/history; usable recovery path.
- All four languages: equivalent validation and receipt behavior.
- Warm browser cache after deployment: versioned corrected script loads normally.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 27*

# Appendix B | Performance implementation plan

### Measurement boundary

The saved PageSpeed results are individual Lighthouse lab runs, not real-user monitoring (RUM). English Dominica recorded LCP 21.8s, FCP 2.6s, TBT 280 ms and CLS 0; the English homepage recorded LCP 13.2s. Both reports state "No Data" for field experience. LCP does not mean the page remained blank until that time.

Recommendations below are proposed changes and test gates, not proof of their causal benefit or guaranteed performance budgets. Agree any visual-behavior change with the owner.

### 1. P1 investigation: footer media and transfer volume

Dominica defines two videos using the same file, both with preload="none" (raw/13746fdfb4a0dffd9c.html:2237). The second starts near the first video's end for canvas crossfade (:2419). IntersectionObserver already pauses playback/drawing outside a 250 px margin (:2444). The PSI payload table lists this MP4 twice at 13,501.6 KiB each: 27,003.2 KiB of the reported 33,511 KiB total. This establishes a large reported payload, not which player caused each network record or two independently verified complete downloads.

**Proposed action:** capture request initiators, response/range sizes and timing first. Compare a static mobile poster with the existing effect; consider a smaller single video if motion is retained. Attach media sources only when needed and respect reduced motion/data. Proposed acceptance: no footer media transfer before it is needed, materially reduced bytes, and acceptable visuals. Multiple legitimate HTTP Range requests are allowed. Two-player crossfade is not inherently a defect; measured avoidable transfer is the target.

### 2. P1 investigation: hero discovery and changing LCP candidates

Five external CSS-background slides are declared at raw/13746fdfb4a0dffd9c.html:751; opacity:0 does not guarantee that hidden slides avoid downloads. The interval at :2483 changes slides every 3,000 ms. This can affect LCP independently of network delays.

**Proposed action:** record LCP candidates and compare a static first slide with the carousel before attributing delay to rotation. Test responsive picture/img with explicit dimensions and high priority, or prioritize/preload the actual LCP resource if CSS backgrounds are retained. Defer unnecessary later-slide resources. Acceptance: improved discovery and measured LCP under identical conditions, with correct mobile imagery and no layout regression. Not every slide change necessarily produces a new LCP candidate.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 28*

# Appendix B | Performance implementation plan (continued)

### 3. P2 optimization: avoid unrelated-language prefetch

logic-blog-translator.js:548 loads the active non-English dataset immediately; :555 schedules all remaining AR/ZH/FA datasets after 150 ms, including all three on English pages. Their measured combined size is 638,745 gzip bytes and 2,908,688 decoded bytes (technical-dataset-transfer.json:3).

**Proposed action:** first disable background all-language prefetch while retaining active-language loading and language-change handling. Consider article-level delivery afterward. Acceptance: a cold English article makes no translated-dataset requests; language switching remains correct and responsive. Compare cold/warm transfer and interaction latency. Prefetch is a design tradeoff; its observed scheduling and file sizes do not establish a runtime failure.

### 4. P2 optimization: CSS/font dependencies

technical-assets/b67ea7798e1b8eadef.txt:2 imports three language font families through CSS. Existing preconnect and display=swap must be preserved (Dominica HTML:147). Declared families do not prove every font binary downloads.

**Proposed action:** load required locale font styles directly and inspect Coverage across menus, forms, viewports and languages before removing rules. PSI reports potential savings of 139 KiB for unused CSS, 76 KiB for unused JavaScript and 1,930 ms for render-blocking requests. These are lab estimates, not proven safely removable totals or additive guarantees. Preserve interactive/RTL styling and verify network/rendering changes.

### 5. P2 deployment risk; release gate for critical fixes

forms.js is unversioned in Dominica HTML:3225 but cached for 30 days (technical-asset-probes.json:7704); language-switcher.js has the same policy (:8301). Compression already works.

**Proposed action:** publish content-hashed asset URLs consistently across locales. The headers establish a freshness policy, not an observed stale customer session. Validators do not force every fresh response to revalidate, while reload behavior varies by browser. Acceptance: warm the previous release's cache, deploy, then test ordinary navigation and normal reload separately; verify that the intended new assets load across locales without requiring users to clear cache.

### Retest protocol

Change one cause at a time. Run at least three cold-cache tests with identical Lighthouse/device/network settings and report median plus range. Capture a 30-second no-scroll trace and a separate footer-scroll trace; keep interaction traces separate from initial-load LCP comparisons. Compare transfer bytes, request initiators, LCP candidates, TBT and CLS. Test warm cache and real iOS/Android browsers across four languages. Set numerical budgets from the verified baseline and agreed user experience. Add RUM when available; lab scores do not establish conversion or field-performance outcomes.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 29*

# Release acceptance and open verification

### Submission tests on staging

Offline; 400/422; 429 with Retry-After; 503; malformed JSON; never-settling response; server commit followed by lost response; duplicate/concurrent submit; CRM timeout after a successful remote write; worker restart. Verify record counts and delivery states, not just UI. Do not load-test production during routine QA.

### Browser and accessibility matrix

All 4 locales; 320/390/768/1440 px; 200% and 400% zoom; keyboard open; landscape; keyboard-only Tab/Enter/Space/Escape; VoiceOver or NVDA. Test real iPhone Safari and Android Chrome, plus desktop Chrome/Safari/Firefox. Existing sampled viewport checks are not full device certification.

### Release gates

Parse generated inline/external JS, lint source, test common components and pure assessment/event logic, crawl final URLs/resources, validate canonical/hreflang/schema and enforce a performance budget. Deploy versioned assets atomically with rollback capability; test an old warm browser cache.

### Operational evidence

Monitor first-party submission acceptance/error rates, receipt IDs, queue age, downstream acknowledgement and client errors with personal-data redaction. Conversion analytics should reflect a confirmed persisted submission, not mere click/thank-you navigation; current GTM/GA4 configuration was not verified.

### Private access still required

PHP/CRM code, database transactions/deduplication, server validation, authentication/authorization, CSRF where applicable, upload controls, rate limits, session cookies, secret handling, full TLS configuration, backup restoration, log retention and sustained availability/load. Public observations neither prove nor disprove these controls.

### Already passing / do not regress

HTTP-to-HTTPS and www-to-non-www redirects; standard protective headers noted in T38; real 404 for a nonexistent path. Known /data/ customer-record paths returned 403 to HEAD requests. No missing fragment targets or duplicate IDs were found in the inspected static HTML. Sampled narrow layouts had no whole-document horizontal overflow.

### Superseded observation

The earlier stale webinar route was corrected in the later live check: session01 shows 12 November and an open form; session02 shows 19 November and an open form. Do not treat the old 29 October route as a current defect.

---

*SHARIFGROUP.AE | DEVELOPER HANDOFF | Evidence cutoff: 10 November 2026 | Public-site technical and UX audit | Page 30*

# Evidence and reference index

All source/test paths below are relative to work/audit-10nov/ inside the ZIP. They are audit snapshots, not a repository checkout. Use the current source repository for implementation.

### Submission evidence

REVIEW-NOTES-EN.txt; technical-form-replay-reviewed.json; technical-form-replay-reviewed.cjs; technical-form-inventory.json; forms-live.js; partners-app.js; webinars-app.js.

### Logic and interaction evidence

historical/technical-logic-findings.json; technical-logic-replay.json; technical-logic-extra-replay.json; technical-ui-evidence.json; logic-navbar.js; logic-navbar.css; logic-whatsapp-widget.js; logic-blog-translator.js.

### Crawl and performance evidence

historical/technical-crawl-findings.json; technical-asset-inventory.json; technical-asset-probes.json; links.json; external-images.json; technical-dataset-transfer.json; technical-inline-errors.json; technical-schema-issues.json; perf-mobile.json; perf-desktop.json. Performance JSON in this English bundle includes only SharifGroup results.

### Key source snapshots

raw/13746fdfb4a0dffd9c.html (Dominica EN); raw/f1d71b392b0b4361e8.html (Contact FA); raw/15d992d0a7a3d6c891.html (Eligibility EN); technical-assets/b67ea7798e1b8eadef.txt (multilingual CSS).

### Review precedence

This reviewed PDF and register supersede earlier severity and interpretation. Original investigator notes, if included, are historical working notes; use REVIEW-NOTES-EN.txt for corrections. The original form replay was superseded by the reviewed replay.

### Evidence boundary

No customer database bodies or authenticated admin actions were collected. Public source snapshots contain deployed frontend integration references and are intended for the owner/development team. No unauthorized third-party outreach was performed.

### References

- PageSpeed - Dominica mobile
- PageSpeed - Home mobile
- Fetch response handling - MDN
- LCP optimization - Google
- HTTP caching - MDN
- Schema identity - Schema.org
- iCalendar URL property - RFC 5545
- Disclosure navigation - W3C APG
