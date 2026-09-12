# CMS & System Feature Requirements Specification

## 1. Multilingual Support (4 Languages)
- **Independent Language Management:**
  - Dashboard allows independent content management across 4 languages:
    - English (LTR)
    - Farsi / Persian (RTL)
    - Arabic (RTL)
    - Chinese (LTR)
- **Bidirectional Layout Handling:**
  - Automatic RTL (Arabic / Farsi) and LTR (English / Chinese) direction switching and styling without layout breakage.
- **Translation Status & Quality Gate:**
  - Clear translation status indicators (Draft vs. Complete) to prevent incomplete or untranslated content from accidentally going live.

## 2. Program & Service Pages (Citizenship & Residency)
- **Reusable Modular Template:**
  - Standardized dynamic templates enable admins to launch new country program pages without developer intervention.
- **Structured Dedicated Fields:**
  - Program Title & Subtitle
  - Overview & Summary
  - Key Benefits
  - Eligibility Criteria
  - Investment Options & Pathways
  - Government & Legal Fees Breakdown
  - Processing Timeline & Milestones
  - Eligible Dependants (spouses, children, parents, etc.)
  - Step-by-Step Process Flow
  - Document Checklists
  - Restrictions (Ineligible Nationalities / Sanctioned Countries)
- **Access, Compliance & Updates:**
  - Travel & visa-free access destination counts
  - Legal disclaimers & compliance notices
  - Automated/manual "Last Updated" badge
- **Dedicated FAQs:**
  - 5 to 10 structured FAQs per program, fully editable across all 4 languages.

## 3. Blogs & Media Management
- **Editorial Lifecycle:**
  - Full article workflow: Create, Edit, Delete, Save Draft, Schedule Future Publishing, and Archive.
- **Article Metadata & Fields:**
  - Title & URL Slug
  - Category & Tag selection
  - Author profile attribution
  - Publish date & Scheduled date
  - Modular content blocks (rich text, callouts, images, quotes)
  - Featured thumbnail and banner images
  - SEO Meta tags (Meta Title, Meta Description, OpenGraph image, Canonical URL)
- **Central Media Library:**
  - Dedicated media manager to upload, organize, search, optimize, and replace image assets across the entire website.

## 4. Homepage, Navigation & General Content
- **Navigation & Menus:**
  - Header navigation menu items, dropdowns, and footer links editable and reorderable directly from the admin panel.
- **Global & Central Content Control:**
  - Homepage hero section (headlines, background visuals, CTA buttons)
  - Key statistics & trust counters
  - Team member profiles
  - Physical office addresses, interactive map coordinates
  - Official phone numbers, WhatsApp quick links, and email addresses
- **Forms & Communication:**
  - Contact form labels, dropdown options, privacy consent text, and custom thank-you confirmation notices.

## 5. Content Review & Status Tracking
- **Content Workflow Statuses:**
  - Draft → Under Review → Approved → Published → Expired / Hidden
- **Audit & Maintenance Triggers:**
  - "Next Review Date" reminders for periodic legal, immigration fee, and policy verification.
- **Temporary Visibility Control:**
  - One-click visibility toggle (Show/Hide) to temporarily unpublish seasonal or changing programs without deleting data.

## 6. User Roles & Permissions
- **Role-Based Access Control (RBAC):**
  - **Admin:** Full privileges (user management, settings, publishing, audit logs).
  - **Editor:** Content drafting, editing, and media library access.
  - **Translator:** Isolated access limited only to translation fields for assigned languages.
  - **Reviewer / Publisher:** Review, approve, schedule, and push content live.

## 7. Eligibility Checker Tool
- **Dynamic Assessment Configuration:**
  - Custom questionnaire creation (questions, choices, scoring thresholds, and logic branches) without code changes.
- **CRM & Lead Integration:**
  - Automatic lead qualification tags based on user responses for targeted routing to consultants.

---

# Client Presentation Document: Dynamic Content Scope & Page-by-Page Input Guide

This section is prepared specifically to present to clients and stakeholders. It clearly defines **what will be editable**, **how the CMS works**, and **what exact inputs will be available on a page-by-page basis**.

---

## 1. Executive Summary: How the Dynamic System Works

```
┌─────────────────────────────────────────────────────────────┐
│                       Authorized User                       │
│        (Logs in securely via Company Google Account)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Secure Cloud Admin Dashboard (/admin)           │
│  - Select Page / Section                                    │
│  - Fill structured fields or rich-text editor               │
│  - Choose language (EN / AR / FA / ZH)                      │
│  - Upload images to Media Manager                           │
│  - Click "Save Draft" or "Publish Live"                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 cPanel VPS Database & API                   │
│  - Stores version history & audit logs                      │
│  - High-speed cached JSON delivery                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Public Website (sharifgroup.ae)               │
│  - Instantly displays updated text, numbers, and images     │
│  - Fully preserves lightning-fast speed, styling & SEO      │
└─────────────────────────────────────────────────────────────┘
```

### Key Highlights for the Client:
1. **Zero Coding Knowledge Required:** Non-technical staff can update fees, dates, phone numbers, and programs using clean, user-friendly forms.
2. **One-Click Google Authentication:** No passwords to remember or compromise. Only approved corporate Google email addresses have access.
3. **Structured Form Fields:** Instead of one messy text box, inputs are neatly divided (e.g., "Minimum Investment", "Processing Time", "Visa-Free Countries"), ensuring the design layout stays 100% pixel-perfect on mobile and desktop.
4. **Independent 4-Language Translation:** Edit English first, then effortlessly add or update Arabic, Persian (Farsi), or Chinese translations with native RTL support.
5. **Instant Live Updates:** Changes published in the dashboard appear on the live site immediately.

---

## 2. Page-by-Page Breakdown of Editable Inputs

Below is the complete catalog of pages and the exact input fields provided to the client in the dashboard:

### A. Global Header, Footer & Contact Info (Site-Wide)
Applied across all pages automatically:
- **Header:**
  - Navigation menu labels & order
  - Top bar notification / alert banner message
  - Primary CTA button text & target link (e.g., "Book Private Consultation")
- **Contact & Social:**
  - WhatsApp direct phone number (triggers instant chat)
  - Dubai Office phone & international lines
  - Official contact email addresses
  - Social media links (LinkedIn, Instagram, YouTube, X)
- **Footer:**
  - Office physical addresses (Dubai, regional offices)
  - Footer navigation columns & links
  - Copyright statement & license/registration numbers

---

### B. Homepage (`/index.html`)
- **Hero Banner:**
  - Main headline and secondary subtitle
  - Background image / banner graphic
  - Primary & secondary CTA buttons (text + link destination)
- **Trust & Statistics Bar:**
  - Counter numbers (e.g., "15+ Years Experience", "100% Success Rate", "50+ Countries")
  - Accreditations, government agent badges, and partner logos
- **Featured Programs Section:**
  - Selection of which citizenship & residency programs to feature on the homepage
  - Badge text (e.g., "Most Popular", "Fast Track", "Top European Choice")
- **Founder / Leadership Highlight:**
  - Quote / short statement from Alireza Sharif
  - Designation & signature image
- **Client Testimonials / Reviews:**
  - Client name / country / program chosen
  - Review text & 5-star rating display
  - Photo / video review link

---

### C. Program & Service Pages (Citizenship & Residency by Investment)
*(Applies to Dominica, St. Kitts, Vanuatu, Grenada, Portugal Golden Visa, UAE Golden Visa, Spain, Malta, etc.)*

For every program, the client gets the following structured inputs:
1. **Header & Key Metrics:**
   - Program Title (e.g., *Dominica Citizenship by Investment*)
   - Hero Banner Image
   - Starting Investment Amount (e.g., *From $100,000 USD*)
   - Processing Time (e.g., *3 to 4 Months*)
   - Visa-Free Destination Count (e.g., *140+ Countries*)
2. **Program Overview & Benefits:**
   - Executive summary paragraph
   - Key benefits bullet points (tax perks, dual citizenship recognition, family inclusion)
3. **Investment Options / Pathways:**
   - Option Name (e.g., *Government Economic Diversification Fund* vs. *Approved Real Estate*)
   - Minimum investment amount
   - Breakdown of refundable vs. non-refundable portions
4. **Government & Legal Fees Breakdown:**
   - Due diligence fees (main applicant, spouse, dependants)
   - Government processing & application fees
   - Passport issuance & bank clearing fees
5. **Timeline & Step-by-Step Milestones:**
   - Step title, duration, and detailed action items (Month 1: Document preparation → Month 2: Government submission → Month 3: Approval in principle → Month 4: Passport issuance)
6. **Eligible Dependants & Criteria:**
   - Age limits for children, inclusion of parents/grandparents, unmarried siblings
7. **Document Checklist:**
   - Downloadable PDF guide attachment
   - List of required documents (police clearance, medical, financial records)
8. **Restrictions & Sanctions Notice:**
   - List of restricted nationalities or special conditions
9. **Program-Specific FAQs:**
   - 5 to 10 expandable questions and answers per program
10. **Compliance & Last Updated:**
    - "Last Updated" date badge (instills trust that immigration laws are current)

---

### D. Blog & Newsroom (`/blog/`)
- **Single-Screen Multilingual Publishing (No External Translation API Required):**
  - Because no automated translation API keys (e.g., paid Google Cloud Translate or DeepL) are needed, **the admin inputs the content manually in all 4 languages directly on the same editor page**.
  - **Shared Global Attributes (Set once):**
    - Featured banner & thumbnail image upload
    - Author attribution (with author avatar)
    - Category & Tags
    - Global Publish Date & Scheduled time
  - **Per-Language Content Tabs (`[EN]`, `[AR]`, `[FA]`, `[ZH]` on the same screen):**
    - Post Title (in English, Arabic, Farsi, Chinese)
    - SEO URL Slug
    - Excerpt / Short Summary
    - Full Rich Text Content (custom formatting, sub-headings, pull-quotes, bullet points)
    - Language-specific SEO Meta Title & Meta Description
  - **RTL/LTR Native Editor Support:**
    - The rich-text editor automatically switches to **RTL mode** when editing Arabic or Farsi, and **LTR mode** for English and Chinese.
  - **Independent Language Status:**
    - Each language has its own status toggle (`Published` or `Draft`). If the client only has the English and Arabic versions ready today, they can publish both immediately while leaving Farsi and Chinese as drafts to be completed later.

---

### E. About Us, Founder & Team Pages (`/aboutus/`, `/aboutfounder/`, `/ali-sharif/`)
- **Company Narrative:**
  - Mission, Vision & Core Values statements
  - History & milestones timeline
- **Founder Profile (Alireza Sharif):**
  - Biography and credentials
  - Executive portrait / media gallery
  - Message from the Chairman
- **Team Management:**
  - Add / edit / reorder team members
  - Fields: Full Name, Job Title, Department, Bio, Photo, LinkedIn URL

---

### F. Real Estate & Educational Advisory (`/realestate/`, `/educationaladvisory/`)
- **Real Estate Advisory:**
  - Featured developer projects & off-plan properties in Dubai
  - Minimum purchase thresholds for UAE 10-Year Golden Visa qualification
  - Projected ROI & rental yield figures
  - Project brochures (downloadable PDF uploads)
- **Educational Advisory:**
  - Service introduction & university placement advisory
  - Partner institutions & countries
  - Consultation CTA form

---

### G. Contact & Office Locations (`/contact/`)
- **Office Location Cards:**
  - Office title (e.g., *Headquarters – Business Bay, Dubai*)
  - Full address, floor, and building name
  - Google Maps pin coordinates & embed link
  - Office hours and visiting schedule
- **Inquiry Form Management:**
  - Lead recipient email addresses (where notifications are sent)
  - Program dropdown options in the form
  - Consent / Privacy confirmation checkbox text
  - Custom Thank You page message after submission

---

### H. Legal & Compliance Pages (`/privacypolicy/`, `/cookiepolicy/`, `/termsofuse/`)
- Last Revised Date
- Formatted legal clauses and policy text
- Data protection officer contact details

---

## 3. Multilingual Operation: Unified Single-Screen Input (Zero Translation API Key Needed)

Because legal, residency, and immigration advisory content requires **100% accurate human translation** (machine translation like Google Translate often mistranslates sensitive legal clauses or immigration terms), the CMS eliminates the need for expensive external translation API subscriptions.

Instead, the dashboard delivers a **Unified Multi-Language Editor**:
- Every editable content item (Blog post, Program page, FAQ, Homepage block) has 4 dedicated language tabs located directly on the same screen:
  - **`[English]`** (Primary source, LTR layout)
  - **`[العربية - Arabic]`** (Native RTL layout, right-aligned rich-text editor)
  - **`[فارسی - Farsi]`** (Native RTL layout, right-aligned rich-text editor)
  - **`[中文 - Chinese]`** (Native LTR layout, font-optimized)

### How It Works:
1. **Single Entry Point:** The admin opens **"Add New Blog Post"**.
2. **Common Attributes Set Once:** The admin uploads the featured image, selects the author, and tags the article once.
3. **Tab-by-Tab Human Input:**
   - Click `[English]` → Paste or write English title, excerpt, and body.
   - Click `[العربية]` → Paste the Arabic translation (editor automatically flips to RTL).
   - Click `[فارسی]` → Paste the Farsi translation (editor automatically flips to RTL).
   - Click `[中文]` → Paste the Chinese translation.
4. **Independent Language Gate / Fallback Control:**
   - If translations for all 4 languages are not ready simultaneously, the admin can mark:
     - `English: Published`
     - `Arabic: Published`
     - `Farsi: Draft`
     - `Chinese: Draft`
   - The article will appear live in English and Arabic immediately. Visitors browsing the Persian or Chinese site will not see an empty or broken page; the system either cleanly hides the draft post or gracefully informs the user that translation is pending.

---

## 4. User Roles & Governance

To keep operations safe and organized, the dashboard provides 4 specific access tiers:
1. **Administrator:** Unrestricted access (can create users, change global settings, publish or delete any page).
2. **Editor:** Can write and edit programs, blog posts, and team pages; upload media.
3. **Translator:** Restricted view; can only translate existing content into their assigned language. Cannot delete pages or change system settings.
4. **Reviewer / Compliance Officer:** Can preview and approve drafts before they go live on the official website.

---

## 5. Typical Workflows for the Client

### Workflow A: Adding a New 4-Language Blog Post
1. **Sign In:** Admin logs in via Google at `sharifgroup.ae/admin`.
2. **Navigate:** Click **Blog** → Click **"Add New Article"**.
3. **Upload Media:** Upload the featured thumbnail and header image (used across all languages).
4. **Fill Language Content on the Same Page:**
   - **Tab 1 `[English]`:** Type title: *"Dominica Announces 2026 Citizenship Policy Updates"*, write the article text, add SEO meta description.
   - **Tab 2 `[العربية]`:** Click tab → Type Arabic title: *"دومينيكا تعلن عن تحديثات برنامج الجنسية لعام 2026"*, paste Arabic article text.
   - **Tab 3 `[فارسی]`:** Click tab → Paste Persian translation.
   - **Tab 4 `[中文]`:** Click tab → Paste Chinese translation.
5. **Set Status & Publish:** Select status **"Published"** and click **"Save & Publish"**.
6. **Live Result:** The new blog post is immediately published across all 4 language sub-directories (`/blog/`, `/arabic/blog/`, `/persian/blog/`, `/chinese/blog/`).

### Workflow B: Updating Program Fees or Details
1. Go to **Programs** → Select **"Dominica Citizenship"**.
2. Update the minimum investment figure or fee row in the structured table.
3. Switch language tabs to update the corresponding localized fee text.
4. Click **"Save Changes"** → Live website is updated instantly.

---

## 6. Complete Page Matrix: Dashboard Options & Automatic Navbar Integration

This section provides a 1-to-1 mapping of **every page on the website**, **what options the admin gets in the dashboard**, and **how the page automatically links into the website Navbar/Mega Menu**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 DASHBOARD NAVIGATION & NAVBAR INTEGRATION ENGINE                 │
│                                                                                  │
│  When creating or editing ANY page, the admin gets a "Navbar Settings" card:     │
│  [✔] Include in Website Navigation                                               │
│  ├── Parent Menu:  [ Citizenship ▼ | Residency ▼ | VIEW ALL SERVICEs ▼ | Main Bar ] │
│  ├── Sub-Column:   [ Caribbean Portfolios ▼ | Global ▼ | European ▼ | Custom ]  │
│  ├── Menu Label:   [ English | العربية | فارسی | 中文 ]                           │
│  ├── Menu Icon:    [ Upload Country Flag or Badge Image ]                        │
│  └── Sort Order:   [ Number field: 1, 2, 3... to control display sequence ]      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Page 1: Homepage (`/index.html`)
- **Dashboard Section:** `Dashboard → Homepage Manager`
- **Dashboard Editing Options:**
  - **Hero Slider / Banner:** Headline, subheadline, background video/image upload, Primary CTA button text & link, Secondary CTA button text & link (all 4 languages).
  - **Trust & Statistics Bar:** 4 to 6 counter numbers (e.g. `15+ Years`, `100% Success`, `50+ Countries`) + descriptive subtitle per counter.
  - **Featured Citizenship Programs:** Select which programs appear on homepage cards, set badge labels (e.g. `Fast Track 45 Days`, `Most Affordable`).
  - **Chairman / Founder Highlight:** Quote, photo, title, link to founder biography.
  - **Why Sharif Group (USPs):** Icon upload, feature title, description.
  - **Client Testimonials / Reviews Slider:** Client name, country flag, review text, rating (1-5 stars), video thumbnail link.
  - **Latest Insights (Blog Slider):** Toggle auto-fetch latest 3 articles or manually pin specific articles.
- **Navbar Integration:**
  - Default root `Logo` click links to `/index.html`.

---

### Page 2: Citizenship By Investment Programs
*(e.g., Dominica, St. Kitts & Nevis, Antigua & Barbuda, Saint Lucia, Grenada, Vanuatu, São Tomé and Príncipe, Republic of Nauru, or ANY future country)*

- **Dashboard Section:** `Dashboard → Citizenship Programs → [Add New / Edit]`
- **Dashboard Editing Options:**
  - **Basic Info:** Country Name, Hero Banner Image, Country Flag Icon, Passport Cover Image.
  - **Core Metrics (Top Badges):**
    - Starting Investment (e.g. `$100,000 USD`)
    - Processing Speed (e.g. `3–4 Months`)
    - Visa-Free Travel Destinations (e.g. `140+ Countries`)
  - **Key Benefits:** Repeater list (Add Benefit Title + Description + Icon).
  - **Eligibility Requirements:** Age requirements, clean criminal record, source of funds criteria.
  - **Investment Pathways:** Multiple tabs/cards (e.g. *Government Donation Fund* vs. *Real Estate Investment*) with minimum sums and lock-in periods.
  - **Official Government & Legal Fees Schedule:** Dynamic fee table (Main applicant fee, spouse fee, dependant fees, due diligence, passport fee).
  - **Step-by-Step Roadmap:** Milestone timeline (Step 1 to Step 5 with description of each stage).
  - **Eligible Family Dependants:** Inclusion rules for spouses, children under 30, parents/grandparents over 55, siblings.
  - **Document Checklist:** List of items + button to upload & attach official downloadable PDF checklist.
  - **Sanctions & Nationality Restrictions:** Restricted countries list / special notes.
  - **Dedicated Program FAQs:** 5 to 10 expandable Q&As (each editable in EN, AR, FA, ZH).
  - **SEO Metadata:** Meta title, Meta description, Focus keywords.
- **Navbar & Mega Menu Integration:**
  - **Parent Menu:** `Citizenship By Investment`
  - **Column Category Selection:**
    - Option 1: `Caribbean Portfolios` (shows under Dominica, St. Kitts, Antigua, St. Lucia, Grenada)
    - Option 2: `Global Portfolios` (shows under Vanuatu, São Tomé, Nauru)
    - Option 3: `Create New Portfolio Column` (for future expansion, e.g. *Pacific Portfolios*)
  - **Menu Item Label:** Localized name + subtitle (e.g. `Dominica | Passport`).
  - **Menu Flag/Thumbnail:** 48x32px flag preview displayed directly in the dropdown.
  - **Sort Order:** Numerical position (1 to 20).
  - **Instant Visibility Toggle:** Checked = appears in Mega Menu dropdown; Unchecked = hidden from menu without deleting the page.

---

### Page 3: Residency By Investment / Golden Visa Programs
*(e.g., Portugal Golden Visa, Greece Golden Visa, UAE 10-Year Golden Visa, Panama, or any future residency pathway)*

- **Dashboard Section:** `Dashboard → Residency Programs → [Add New / Edit]`
- **Dashboard Editing Options:**
  - **Program Identity:** Program Title, Country, Official Visa Type, Banner Image, Flag.
  - **Core Metrics:** Minimum Investment (e.g. `€250,000` / `AED 2,000,000`), Processing Time, Physical Stay Requirements (e.g. *7 days per year*).
  - **Path to Citizenship / PR:** Years to permanent residency or passport eligibility.
  - **Investment Categories:** Real estate, fund subscription, business capital, capital transfer.
  - **Government Fees & Tax Incentives:** Processing costs, Golden Visa card renewal fees, tax perks (e.g. Non-Habitual Resident rules).
  - **Application Roadmap:** Timeline from initial consultation to biometric capture and card issuance.
  - **Program FAQs:** Program-specific questions in all 4 languages.
  - **SEO Settings:** Multi-language SEO tags.
- **Navbar & Mega Menu Integration:**
  - **Parent Menu:** `Residency By Investment`
  - **Column Category Selection:**
    - `European Portfolios` (Portugal, Greece, Spain, Malta)
    - `Americas & UAE` (Panama, UAE 10-Year Golden Visa)
  - **Menu Thumbnail:** Country flag or landmark image.
  - **Sort Order:** Custom priority sequencing.
  - **Visibility Toggle:** One-click show/hide in the mega dropdown.

---

### Page 4: Blog & Insights (`/blog/`)
- **Dashboard Section:** `Dashboard → Blog Articles → [Add New / Edit]`
- **Dashboard Editing Options:**
  - **Shared Metadata (Once):** Featured image, Author, Category dropdown, Tags, Publication Date, Scheduled Date.
  - **4-Language Content Tabs (Same Screen):**
    - `[EN]`: Title, URL slug, summary, rich-text body, SEO title/description.
    - `[AR]`: Arabic title, summary, rich-text body (RTL), Arabic SEO tags.
    - `[FA]`: Farsi title, summary, rich-text body (RTL), Farsi SEO tags.
    - `[ZH]`: Chinese title, summary, rich-text body (LTR), Chinese SEO tags.
  - **Publishing Status per Language:** `Published` vs. `Draft`.
- **Navbar Integration:**
  - Main top bar item: `Blog` / `Insights`.
  - Automatically lists the latest articles inside the main `/blog/` archive page with category filters.

---

### Page 5: Real Estate Advisory (`/realestate/`)
- **Dashboard Section:** `Dashboard → Real Estate Advisory`
- **Dashboard Editing Options:**
  - **Hero & Intro:** Headline, description, luxury banner image.
  - **Featured Off-Plan Projects / Properties:**
    - Project Name, Developer (e.g. Emaar, Damac, Sobha), Location (e.g. Downtown Dubai, Business Bay).
    - Starting Price (AED / USD).
    - Golden Visa Eligibility Badge (`[✔] Qualifies for 10-Year UAE Golden Visa`).
    - ROI / Projected Rental Yield percentage.
    - Photo Gallery upload & Downloadable Brochure PDF.
  - **Why Invest in Dubai Real Estate:** 4 customizable value propositions.
  - **Consultation Form Trigger:** Custom inquiry form routing.
- **Navbar & Mega Menu Integration:**
  - Appears under `VIEW ALL SERVICEs` mega menu with an image card.
  - Configurable sort order and label.

---

### Page 6: Educational Advisory (`/educationaladvisory/`)
- **Dashboard Section:** `Dashboard → Educational Advisory`
- **Dashboard Editing Options:**
  - **Introduction:** Service overview, student pathway advisory details.
  - **Global University Destinations:** Country list (UK, USA, Canada, Europe) with requirements.
  - **Service Offerings:** School placement, visa processing, family relocation assistance.
  - **Brochure Download & Inquiry CTA:** Form customization.
- **Navbar & Mega Menu Integration:**
  - Appears under `VIEW ALL SERVICEs` mega menu.

---

### Page 7: About Us, Founder & Leadership
*(Pages: `/aboutus/`, `/aboutfounder/`, `/ali-sharif/`)*

- **Dashboard Section:** `Dashboard → About & Team Management`
- **Dashboard Editing Options:**
  - **Company Overview:** Mission, Vision, Values, Timeline milestones.
  - **Founder Profile (Alireza Sharif):** Biography text, official executive portrait, Chairman's message, media features / press links.
  - **Team Members Grid:**
    - Add/Edit/Delete team members.
    - Fields: Full Name, Job Title/Role, Department, Portrait Photo, Bio, LinkedIn URL, Display Order.
  - **Licenses & Accreditations:** Government licenses, Dubai Business Bay registration certificates, IMC (Investment Migration Council) logos.
- **Navbar Integration:**
  - Appears in top navbar: `About Us` (with dropdown for *Company Overview*, *Founder Profile*, *Our Team*).

---

### Page 8: Contact & Global Offices (`/contact/`)
- **Dashboard Section:** `Dashboard → Contact & Offices`
- **Dashboard Editing Options:**
  - **Headquarters & Regional Offices:**
    - Office Name (e.g. *Dubai Head Office - Binary Tower, Business Bay*).
    - Physical address, floor, office number.
    - Phone number & direct WhatsApp number (auto-updates click-to-chat button across the site).
    - Direct contact email.
    - Working hours & days.
    - Google Maps embed URL / coordinates.
  - **Contact Form Management:**
    - Recipient email address for inquiries.
    - Program selection dropdown list.
    - Custom GDPR/consent checkbox text.
    - Success/Thank You page confirmation message.
- **Navbar Integration:**
  - Persistent Header Button: `Contact` / `Book Consultation` (label & destination configurable).

---

### Page 9: Legal & Compliance Pages
*(Pages: `/privacypolicy/`, `/cookiepolicy/`, `/termsofservice/`, `/termsofuse/`)*

- **Dashboard Section:** `Dashboard → Legal Pages`
- **Dashboard Editing Options:**
  - Effective / Last Revised Date.
  - Policy Title.
  - Full Policy Text (WYSIWYG editor supporting legal clauses, tables, and lists in all 4 languages).
- **Navbar Integration:**
  - Automatically linked in the **Website Footer** under `Legal & Privacy`.

---

## 7. Summary: How the Navbar Stays Synchronized

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Admin adds new program (e.g. "Malta Citizenship") in Dashboard         │
│  └── Marks: [✔] Show in Menu -> Category: "Citizenship" -> "Europe"     │
├──────────────────────────────────────────────────────────────────────────┤
│  API automatically updates the navigation cache in real-time             │
├──────────────────────────────────────────────────────────────────────────┤
│  Frontend Navbar renders:                                                │
│  - English Visitor sees: "Malta | Passport" under European Portfolios    │
│  - Arabic Visitor sees: "مالطا | جواز سفر" in Arabic mega menu            │
│  - Persian Visitor sees: "مالت | پاسپورت" in Farsi mega menu              │
│  - Chinese Visitor sees: "马耳他 | 护照" in Chinese mega menu            │
│  Zero code edits required. 100% automated & synchronized.                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Dynamic Navigation & Menu Builder: Adding Custom Tabs & Section Headings

If the client wants to introduce **an entirely new top-level tab in the navbar** (for example: *"Corporate Services"*, *"Tax Advisory"*, *"Media & Press"*, or *"Careers"*), along with **custom sub-headings/columns inside the dropdown**, the CMS provides a dedicated **Visual Navigation Tree Builder**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         NAVIGATION & MENU TREE BUILDER                           │
│                                                                                  │
│  [+ Add New Main Tab]                                                            │
│  ├── Tab: [ Corporate Services ] (EN) | [ خدمات الشركات ] (AR)                   │
│  │   ├── Dropdown Type: [ Mega Menu Dropdown ▼ ]                                 │
│  │   ├── [+ Add Section Heading / Column]                                        │
│  │   │   ├── Section 1 Heading: [ Company Formation ]                            │
│  │   │   │   ├── Link 1: Dubai Mainland License                                  │
│  │   │   │   └── Link 2: Free Zone Entity Setup                                  │
│  │   │   └── Section 2 Heading: [ Banking & Compliance ]                         │
│  │   │       ├── Link 1: Corporate Bank Account Opening                          │
│  │   │       └── Link 2: Tax Residency Advisory                                  │
│  └── Sort Position: [ Drag to reorder anywhere in the header ]                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Capabilities for Custom Navigation:
1. **Create Brand-New Main Header Tabs:**
   - Admin can add a new main navbar item at any time.
   - Enter tab name in all 4 languages (`[EN]`, `[AR]`, `[FA]`, `[ZH]`).
   - Choose behavior:
     - **Direct Link:** Directly navigates to a specific URL or page.
     - **Mega Menu Dropdown:** Opens a multi-column dropdown container.
     - **Standard Dropdown:** Simple single-column dropdown list.
2. **Add Custom Section Headings / Columns Inside Mega Menus:**
   - Inside any dropdown or mega menu, admin can create new section heading titles (e.g., *Caribbean Portfolios*, *European Portfolios*, *Corporate Banking*, *Legal Advisory*).
   - Headings are fully localized across all 4 languages.
3. **Assign Pages / Links Under Any Heading:**
   - Attach dynamic program pages, blog categories, or custom external/internal URLs under the chosen heading.
4. **Drag-and-Drop Reordering:**
   - Move tabs left or right on the main navbar.
   - Reorder section headings and individual links within the dropdown without developer assistance.
5. **Instant Live Sync:**
   - As soon as the admin clicks "Save Navigation", the changes reflect immediately across English, Arabic (RTL), Farsi (RTL), and Chinese layouts.