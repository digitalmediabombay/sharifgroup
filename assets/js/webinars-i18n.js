/* ==========================================================================
   UI STRINGS — Webinars section, 4 languages (en / fa / ar / zh)
   Production: merge into /assets/locales/{lang}.json
     - nav.webinars, footer.webinars  -> existing "nav" / "footer" blocks
     - everything under "webinars"    -> new top-level "webinars" block
   Ready-to-merge JSON copies are in /locales/*.json (generated from this file).
   Persian copy is written for an Afghan (Dari) audience: پاسپورت، تذکره، کمره، دالر.
   Machine-assisted translations — please have a native speaker review AR & ZH.
   ========================================================================== */
window.WEBINAR_I18N = {
  en: {
    meta: { dir: "ltr", code: "EN", locale: "en-GB", name: "English", title: "Webinars | Sharif Group Dubai", description: "Free live webinars by Sharif Group on second citizenship and residency — join from your phone, no installation." },
    nav: {
      citizenship: "Citizenship",
      residency: "Residency",
      moreServices: "Other Services",
      aboutUs: "About Us",
      contact: "Contact Us",
      blog: "Blog",
      webinars: "Webinars",
      eligibilityChecker: "Eligibility Checker",
      bookConsultation: "Book Consultation",
      dualCitizenship: "Dual Citizenship",
      allCitizenship: "All Citizenship Programs",
      globalResidency: "Global Residency",
      allResidency: "All Residency Programs",
      realEstate: "Real Estate Advisory",
      education: "Educational Advisory",
      socialResp: "Social Responsibility",
      aboutSharif: "About Sharif Group",
      aboutFounder: "About Founder | Ali Sharif",
      eligibilityAssessment: "Eligibility Assessment",
      caribbeanPortfolios: "Caribbean Portfolios",
      globalPortfolios: "Global Portfolios",
      europeanPortfolios: "European Portfolios",
      americasUAE: "Americas & UAE",
      corporateIdentity: "Corporate Identity",
      overview: "Overview",
      viewAllServices: "View All Services",
      cbiTitle: "Citizenship By Investment",
      rbiTitle: "Residency By Investment"
    },
    footer: {
      webinars: "Webinars",
      quickLinks: "Quick Links",
      home: "Home",
      aboutSharif: "About | Sharif Group",
      aboutAli: "About | Ali Sharif",
      socialResp: "Social Responsibility",
      citizenshipPrograms: "Citizenship Programs",
      residencyPrograms: "Residency Programs",
      realEstate: "Real Estate",
      educationalAdvisory: "Educational Advisory",
      contactUs: "Contact Us",
      insightsBlog: "Insights & Blog",
      eligibilityChecker: "Eligibility Checker",
      citizenshipProgramsCol: "Citizenship Programs",
      residencyProgramsCol: "Residency Programs",
      otherServices: "Other Services",
      legalFrameworks: "Legal Frameworks",
      privacyPolicy: "Privacy Policy",
      termsOfUse: "Terms of Use",
      cookiePolicy: "Cookie Policy",
      allRightsReserved: "© 2026 Sharif Group. All Rights Reserved.",
      designedBy: "Designed and Developed by",
      address: "116, The Binary Tower, Business Bay, Dubai, United Arab Emirates",
      tagline: "Trusted private consultancy for second citizenship, residency, real estate and education — Business Bay, Dubai.",
      upcoming: "Upcoming sessions",
      cbi: {
        dominica: "Dominica | Passport",
        kitts: "St. Kitts & Nevis | Passport",
        antigua: "Antigua & Barbuda | Passport",
        lucia: "Saint Lucia | Passport",
        grenada: "Grenada | Passport",
        vanuatu: "Vanuatu | Passport",
        saotome: "São Tomé and Príncipe | Passport",
        nauru: "Republic of Nauru | Passport"
      },
      rbi: {
        portugal: "Portugal | Golden Visa",
        greece: "Greece | Golden Visa",
        panama: "Panama | Golden Visa",
        uae: "United Arab Emirates | Golden Visa"
      }
    },
    webinars: {
      common: { demoStrong: "Demo", demoText: "Preview for the web team — nothing is sent or saved outside this browser.", skip: "Skip to content", isNew: "New", free: "Free", min: "{n} min", sample: "Sample date — pending approval", copy: "Copy link", copied: "Link copied", close: "Close", lang: "Persian (Dari)", online: "Online", seats: "{n} seats", sessionN: "Session {n}", of: "of" },
      cd: { d: "Days", h: "Hours", m: "Minutes", s: "Seconds" },
      tz: { kabul: "Kabul", dubai: "Dubai", istanbul: "Istanbul", you: "Your time" },
      status: { upcoming: "Upcoming", live: "Live now", ended: "Held", postponed: "Postponed", cancelled: "Cancelled", regOpen: "Registration open", regClosed: "Registration closed", soon: "Coming soon", publicLink: "Public link" },
      list: {
        eyebrow: "Live Sessions & Insights", title: "Webinars", sub: "SHARIF GROUP DUBAI",
        lede: "Free, live online sessions where our specialists explain citizenship and residency pathways clearly — and answer your questions.",
        nextEyebrow: "Next live session", join: "Join the webinar", remind: "Get WhatsApp reminder", details: "Full details",
        startsIn: "Starts in", whenTitle: "Date & time", noInstall: "No app needed", phoneOk: "Works on mobile",
        upTitle: "Upcoming <em>Sessions</em>", seriesTag: "Series 01 · Dominica", seriesTitle: "Dominica Pilot Series", seriesText: "Three sessions, two weeks apart — from the basics to documents and your own questions. Every session is free and in Persian (Dari).",
        sessionCta: "Details", howEyebrow: "Before you join", howTitle: "How to <em>join</em>",
        howSub: "Follow these four simple steps to participate in any live session — no downloads, apps, or registration required.",
        steps: [
          { t: "Open the link", d: "Tap “Join the webinar” on this page from your phone or computer. No app to install." },
          { t: "Enter any name", d: "You can join with any name. Your camera and microphone stay off." },
          { t: "Weak internet?", d: "Choose “audio only”. The voice is the heart of the session; slides are simple." },
          { t: "Ask in the chat", d: "Type your question in the chat. The host reads it out without your name." }
        ],
        timelineEyebrow: "TIMELINE",
        stepPrefix: "STEP",
        stepTips: [
          "Instant 1-click browser access from your phone or PC — no apps to install.",
          "Complete anonymity guaranteed — your camera & mic remain strictly off.",
          "Lightweight audio-only mode ensures uninterrupted listening even on weak connections.",
          "Submit confidential questions in the chat — the host answers live without revealing your identity."
        ],
        finalKicker: "READY TO JOIN",
        finalTitle: "You're All Set to Join the Webinar!",
        finalDesc: "Zero installation, zero cameras, 100% confidential and free. Our specialists are ready to answer all your questions.",
        privacyTitle: "Your privacy is protected", privacyText: "Nobody sees who attended. The recording shows only the speakers and slides — never participants' names or images.",
        ctaTitle: "Prefer a private conversation?", ctaText: "Book a confidential consultation with our team in Business Bay, Dubai — in person, by phone or online.", ctaBtn: "Book Consultation"
      },
      detail: {
        recapTitle: "Session summary", home: "Home", about: "About this session", learn: "What you will learn", agenda: "Session agenda", speakers: "Speakers",
        agendaItems: [
          { t: "0–5", l: "Welcome in Dari and a short poll", w: "Host" },
          { t: "5–10", l: "About Sharif Group and the speaker", w: "Host" },
          { t: "10–40", l: "Main content", w: "Speaker" },
          { t: "40–45", l: "Next step: free private consultation and checklist", w: "Speaker" },
          { t: "45–63", l: "Live Q&A", w: "Host & speaker" },
          { t: "63–65", l: "Summary and next session", w: "Host" }
        ],
        minutes: "min",
        expertName: "Senior Citizenship Specialist", expertRole: "Sharif Group, Dubai", hostName: "Dari-speaking host", hostRole: "Moderates questions and chat", tbd: "Name to be announced",
        privacy: "Privacy during the session",
        privacyItems: ["Join with any name — camera and microphone are off by default.", "The recording shows only the speakers and slides.", "The host never reads out the name of the person asking.", "You can send your question privately to the host."],
        faq: "Frequently asked questions",
        faqs: [
          { q: "Do I need to install an app?", a: "No. The link opens in your phone or computer browser. Chrome works best." },
          { q: "Where is the joining link?", a: "On this page — it is open to everyone. It is posted shortly before the session and the room opens 10 minutes before the start. If you register, we also send it to you on WhatsApp." },
          { q: "Will others see my name or face?", a: "No. You can use any name, your camera and microphone are off, and the recording only shows the speakers and slides." },
          { q: "What if my internet is weak?", a: "Choose “audio only”. The voice is the heart of the session and the slides are simple." },
          { q: "Is it free?", a: "Yes, attending is completely free." },
          { q: "Can I ask about my personal situation?", a: "General questions are answered live. For personal or financial matters, book a private consultation." }
        ],
        joinTitle: "Join this session", joinPublic: "The link is open to everyone — no registration needed.",
        joinBtn: "Join the webinar", joinNow: "Join now — live", roomOpens: "Room opens {time} (Kabul), 10 minutes before the start.",
        lockedTitle: "Link sent after registration", lockedText: "For this session the joining link is sent by WhatsApp to registered participants, 24 hours and 1 hour before the start.",
        shareWa: "Share on WhatsApp", addCal: "Add to calendar", liveBanner: "This session is live now",
        linkSoon: "Link will be posted soon", linkSoonNote: "The joining link will appear here before the session starts. Register to get it on WhatsApp too.",
        heldTitle: "This session has been held", heldText: "Thank you to everyone who joined. The next session of this series is listed below.", consultTitle: "Free private consultation", consultText: "A 15–20 minute confidential call for participants of this session.", consultBtn: "Book a consultation",
        notOpen: "Registration for this session opens after Session {n}.", other: "Other sessions in this series", soonCta: "Notify me"
      },
      form: {
        title: "Get reminders & checklist", subPublic: "Optional — receive the link and reminders on WhatsApp, plus the Dari document checklist after the session.", subPrivate: "Register to receive the joining link and reminders on WhatsApp.",
        name: "Name", nameHint: "Doesn't have to be your real name.", wa: "WhatsApp number", waHint: "We send the link and reminders here.", email: "Email", optional: "optional",
        country: "Where do you live?", choose: "Select…", countries: { AF: "Afghanistan", AE: "United Arab Emirates", TR: "Turkey", IR: "Iran", other: "Other" },
        question: "Your question for the specialist", questionHint: "Please don't write personal or financial details.", newsletter: "Send me news about future webinars",
        submit: "Register — free", sending: "Registering…", privacy: "Your information is used only to inform you about this webinar and to answer your consultation request, and is never shared with anyone else.",
        errName: "Please enter a name (at least 2 characters).", errPhone: "Please enter a valid WhatsApp number.", errEmail: "This email address doesn't look right.", errCountry: "Please choose where you live.", errQuestion: "Please keep your question under 500 characters.", alert: "Please correct the highlighted fields.", closed: "Registration for this session is closed."
      },
      thanks: {
        eyebrow: "Registration confirmed", title: "You're registered!", text: "Thank you, {name}. Your place is saved. Here is everything you need for the session.", already: "This WhatsApp number was already registered for this session — here are your details.",
        ref: "Reference", next: "What happens next",
        steps: [
          { t: "Now", d: "Confirmation (and email, if you added one)." },
          { t: "3 days before", d: "WhatsApp reminder — send us your question." },
          { t: "24 hours & 1 hour before", d: "The joining link on WhatsApp and email." },
          { t: "Within 24 hours after", d: "Thank-you message, short summary, checklist and consultation link." }
        ],
        back: "Back to webinars"
      },
      demo: { fab: "Demo controls", title: "Demo controls", intro: "Switch states to preview every version of the page. These controls are not part of the production design.", state: "Session 1 state", visibility: "Who sees the link", public: "Public on page", registrants: "Registrants only", pages: "Preview pages", list: "Webinars list", detail: "Session 1 page", thanks: "Thank-you page", admin: "Admin & registrations", integration: "Site integration", reset: "Reset demo data", resetDone: "Demo data reset", sampleLink: "Sample link — the real meeting link is set in the admin panel.", linkState: "Link status", linkSoon: "Coming soon", linkSet: "Link ready" },
      admin: {
        title: "Admin preview", intro: "What the marketing team needs in the existing CMS (like Blog posts) and what the registration export looks like.", warn: "Demo only: in production this page sits behind the existing admin login and the data comes from the CRM / Google Sheet.",
        tabContent: "Webinar fields", tabRegs: "Registrations", pick: "Webinar", status: "Event status", regOpen: "Registration open", start: "Start (Kabul time)", confirmed: "Date confirmed", vis: "Joining link visibility", url: "Meeting room link (leave empty = “coming soon”)", cap: "Capacity", titleFa: "Title — Persian", titleEn: "Title — English", save: "Save (demo)", saved: "Saved — preview updated",
        kRegs: "Registrations", kAF: "Living in Afghanistan", kNews: "Newsletter opt-ins", kQ: "Questions received", export: "Export CSV (Excel)", none: "No registrations yet — submit the form on the session page to see a row here.",
        cols: { id: "Reference", at: "Registered (UTC)", name: "Name", wa: "WhatsApp", email: "Email", country: "Country", q: "Question", news: "Newsletter", src: "utm_source", lang: "Language" }
      },
      int: {
        title: "Site integration", intro: "Where the new section connects to the existing website. All components below are live and follow the selected language.",
        nav: "1 · Main menu — “Webinars” next to Blog", home: "2 · Homepage — slim banner under the stats band", homeT: "Free live webinar: {title}", homeD: "{date} · {time} Kabul", homeBtn: "Details & join",
        blog: "3 · End of related blog posts", blogEyebrow: "Live webinar", urls: "4 · URL map", urlCols: ["Page", "English", "Persian / Arabic / Chinese"], urlRows: ["Webinars list", "Session page", "Thank-you page (noindex)"]
      }
    }
  },

  fa: {
    meta: { dir: "rtl", code: "FA", locale: "fa-AF", name: "فارسی", title: "وبینارها | شریف گروپ دبی", description: "وبینارهای زنده و رایگان شریف گروپ درباره شهروندی دوم و اقامت — ورود با گوشی، بدون نصب برنامه." },
    nav: {
      citizenship: "شهروندی",
      residency: "اقامت",
      moreServices: "سایر خدمات",
      aboutUs: "درباره ما",
      contact: "تماس با ما",
      blog: "بلاگ",
      webinars: "وبینارها",
      eligibilityChecker: "بررسی شرایط واجد بودن",
      bookConsultation: "رزرو مشاوره",
      dualCitizenship: "تابعیت دوگانه",
      allCitizenship: "تمام برنامه‌های شهروندی",
      globalResidency: "اقامت جهانی",
      allResidency: "تمام برنامه‌های اقامتی",
      realEstate: "مشاوره املاک و مستغلات",
      education: "مشاوره تحصیلی بین‌المللی",
      socialResp: "مسئولیت اجتماعی",
      aboutSharif: "درباره شریف گروپ",
      aboutFounder: "درباره بنیان‌گذار | علی شریف",
      eligibilityAssessment: "بررسی شرایط واجدین",
      caribbeanPortfolios: "پرونده‌های کارائیب",
      globalPortfolios: "پرونده‌های بین‌المللی",
      europeanPortfolios: "پرونده‌های اروپایی",
      americasUAE: "قاره آمریکا و امارات",
      corporateIdentity: "هویت سازمانی",
      overview: "نمای کلی",
      viewAllServices: "مشاهده همه خدمات",
      cbiTitle: "شهروندی<br>از طریق<br>سرمایه‌گذاری",
      rbiTitle: "اقامت<br>از طریق<br>سرمایه‌گذاری"
    },
    footer: {
      webinars: "وبینارها",
      quickLinks: "لینک‌های سریع",
      home: "خانه",
      aboutSharif: "درباره | شریف گروپ",
      aboutAli: "درباره | علی شریف",
      socialResp: "مسئولیت اجتماعی",
      citizenshipPrograms: "برنامه‌های شهروندی",
      residencyPrograms: "برنامه‌های اقامتی",
      realEstate: "املاک و مستغلات",
      educationalAdvisory: "مشاوره تحصیلی",
      contactUs: "تماس با ما",
      insightsBlog: "مقالات و دانستنی‌ها",
      eligibilityChecker: "بررسی شرایط واجدین",
      citizenshipProgramsCol: "برنامه‌های شهروندی",
      residencyProgramsCol: "برنامه‌های اقامت",
      otherServices: "سایر خدمات",
      legalFrameworks: "چارچوب‌های قانونی",
      privacyPolicy: "سیاست حفظ حریم خصوصی",
      termsOfUse: "شرایط استفاده",
      cookiePolicy: "سیاست کوکی‌ها",
      allRightsReserved: "© 2026 شریف گروپ. تمامی حقوق محفوظ است.",
      designedBy: "طراحی و توسعه توسط",
      address: "واحد ۱۱۶، برج باینری، بیزنس بی، دبی، امارات متحده عربی",
      tagline: "مشاوره خصوصی و مورد اعتماد در شهروندی دوم، اقامت، املاک و تحصیل — بیزنس بی، دبی.",
      upcoming: "جلسه‌های پیش رو",
      cbi: {
        dominica: "دومینیکا | پاسپورت",
        kitts: "سنت کیتس و نویس | پاسپورت",
        antigua: "آنتیگوا و باربودا | پاسپورت",
        lucia: "سنت لوسیا | پاسپورت",
        grenada: "گرانادا | پاسپورت",
        vanuatu: "وانواتو | پاسپورت",
        saotome: "سائوتومه و پرنسیپ | پاسپورت",
        nauru: "جمهوری نائورو | پاسپورت"
      },
      rbi: {
        portugal: "پرتغال | گلدن ویزا",
        greece: "یونان | گلدن ویزا",
        panama: "پاناما | گلدن ویزا",
        uae: "امارات متحده عربی | گلدن ویزا"
      }
    },
    webinars: {
      common: { demoStrong: "نسخه دمو", demoText: "پیش‌نمایش برای تیم وبسایت — هیچ اطلاعاتی بیرون از این مرورگر ارسال یا ذخیره نمی‌شود.", skip: "رفتن به محتوا", isNew: "جدید", free: "رایگان", min: "{n} دقیقه", sample: "تاریخ نمونه — در انتظار تأیید", copy: "کپی لینک", copied: "لینک کپی شد", close: "بستن", lang: "فارسی (دری)", online: "آنلاین", seats: "{n} نفر ظرفیت", sessionN: "جلسه {n}", of: "از" },
      cd: { d: "روز", h: "ساعت", m: "دقیقه", s: "ثانیه" },
      tz: { kabul: "کابل", dubai: "دبی", istanbul: "استانبول", you: "وقت شما" },
      status: { upcoming: "پیش رو", live: "در حال پخش", ended: "برگزار شد", postponed: "به تعویق افتاد", cancelled: "لغو شد", regOpen: "ثبت‌نام باز است", regClosed: "ثبت‌نام بسته شد", soon: "به‌زودی", publicLink: "لینک عمومی" },
      list: {
        eyebrow: "جلسه‌های زنده و دانستنی‌ها", title: "وبینارها", sub: "شریف گروپ دبی",
        lede: "جلسه‌های آنلاین، زنده و رایگان که در آن کارشناسان ما مسیرهای شهروندی و اقامت را روشن توضیح می‌دهند و به پرسش‌های شما پاسخ می‌دهند.",
        nextEyebrow: "جلسه زنده بعدی", join: "ورود به وبینار", remind: "یادآوری در واتس‌اپ", details: "جزئیات کامل",
        startsIn: "زمان باقی‌مانده تا شروع", whenTitle: "تاریخ و ساعت", noInstall: "بدون نصب برنامه", phoneOk: "قابل استفاده با گوشی",
        upTitle: "جلسه‌های <em>پیش رو</em>", seriesTag: "مجموعه ۰۱ · دومینیکا", seriesTitle: "مجموعه آزمایشی دومینیکا", seriesText: "سه جلسه با فاصله دو هفته — از آشنایی کلی تا مدارک و پرسش‌های خود شما. همه جلسه‌ها رایگان و به فارسی (دری) است.",
        sessionCta: "جزئیات", howEyebrow: "پیش از ورود", howTitle: "چطور <em>وارد شویم</em>",
        howSub: "چهار مرحله ساده برای ورود و مشارکت در جلسات زنده — بدون نیاز به نصب هیچ‌گونه اپلیکیشن.",
        steps: [
          { t: "لینک را باز کنید", d: "از گوشی یا کمپیوتر روی «ورود به وبینار» در همین صفحه بزنید. نیازی به نصب برنامه نیست." },
          { t: "با هر نامی وارد شوید", d: "می‌توانید با هر نامی وارد شوید. کمره و مایکروفون شما خاموش است." },
          { t: "اینترنت ضعیف است؟", d: "گزینه «فقط صدا» را انتخاب کنید. صدا محور اصلی جلسه است و اسلایدها ساده‌اند." },
          { t: "در چت بپرسید", d: "پرسش خود را در چت بنویسید. مجری آن را بدون نام شما می‌خواند." }
        ],
        timelineEyebrow: "مراحل ورود",
        stepPrefix: "مرحله",
        stepTips: [
          "ورود مستقیم با یک کلیک از طریق گوشی یا کمپیوتر — بدون نیاز به نصب برنامه.",
          "حفظ کامل حریم خصوصی — کمره و مایکروفون شما کاملاً خاموش می‌ماند.",
          "حالت فقط صوتی برای ارتباط پایدار و بدون وقفه حتی با اینترنت ضعیف.",
          "پرسش‌های خود را خصوصی بفرستید — مجری بدون ذکر هویت شما پاسخ می‌دهد."
        ],
        finalKicker: "آماده ورود",
        finalTitle: "شما کاملاً آماده ورود به جلسه زنده هستید!",
        finalDesc: "بدون نصب برنامه، بدون کمره، کاملاً محرمانه و رایگان. متخصصان ما آماده پاسخ به پرسش‌های شما هستند.",
        privacyTitle: "حریم خصوصی شما محفوظ است", privacyText: "هیچ‌کس نمی‌بیند چه کسی در جلسه بوده است. ضبط جلسه فقط سخنران و اسلایدها را نشان می‌دهد، نه نام یا تصویر شرکت‌کنندگان.",
        ctaTitle: "گفت‌وگوی خصوصی را ترجیح می‌دهید؟", ctaText: "یک مشاوره محرمانه با تیم ما در بیزنس بی دبی رزرو کنید — حضوری، تلفنی یا آنلاین.", ctaBtn: "رزرو مشاوره"
      },
      detail: {
        recapTitle: "خلاصه جلسه", home: "خانه", about: "درباره این جلسه", learn: "در این جلسه یاد می‌گیرید", agenda: "برنامه جلسه", speakers: "سخنرانان",
        agendaItems: [
          { t: "۰–۵", l: "خوشامد به دری و نظرسنجی کوتاه", w: "مجری" },
          { t: "۵–۱۰", l: "معرفی شریف گروپ و سخنران", w: "مجری" },
          { t: "۱۰–۴۰", l: "محتوای اصلی جلسه", w: "سخنران" },
          { t: "۴۰–۴۵", l: "قدم بعدی: مشاوره خصوصی رایگان و چک‌لیست", w: "سخنران" },
          { t: "۴۵–۶۳", l: "پرسش‌وپاسخ زنده", w: "مجری و سخنران" },
          { t: "۶۳–۶۵", l: "جمع‌بندی و معرفی جلسه بعد", w: "مجری" }
        ],
        minutes: "دقیقه",
        expertName: "کارشناس ارشد شهروندی", expertRole: "شریف گروپ، دبی", hostName: "مجری دری‌زبان", hostRole: "مدیریت پرسش‌ها و چت", tbd: "نام پس از تأیید اعلام می‌شود",
        privacy: "حریم خصوصی در جلسه",
        privacyItems: ["با هر نامی وارد شوید — کمره و مایکروفون به‌طور پیش‌فرض خاموش است.", "ضبط جلسه فقط سخنران و اسلایدها را نشان می‌دهد.", "مجری هنگام خواندن پرسش‌ها نام پرسنده را نمی‌خواند.", "می‌توانید پرسش خود را خصوصی برای مجری بفرستید."],
        faq: "پرسش‌های متداول",
        faqs: [
          { q: "آیا باید برنامه‌ای نصب کنم؟", a: "خیر. لینک در مرورگر گوشی یا کمپیوتر باز می‌شود. بهتر است با Chrome وارد شوید." },
          { q: "لینک ورود کجاست؟", a: "در همین صفحه است و برای همه باز است. لینک کمی پیش از جلسه گذاشته می‌شود و اتاق ۱۰ دقیقه پیش از شروع باز می‌شود. اگر ثبت‌نام کنید، لینک را در واتس‌اپ هم برایتان می‌فرستیم." },
          { q: "آیا دیگران نام یا تصویر مرا می‌بینند؟", a: "خیر. می‌توانید با هر نامی وارد شوید، کمره و مایکروفون شما خاموش است و ضبط جلسه فقط سخنران و اسلایدها را نشان می‌دهد." },
          { q: "اگر اینترنتم ضعیف باشد؟", a: "گزینه «فقط صدا» را انتخاب کنید. صدا محور اصلی جلسه است و اسلایدها ساده‌اند." },
          { q: "آیا شرکت در جلسه هزینه دارد؟", a: "خیر، شرکت کاملاً رایگان است." },
          { q: "می‌توانم درباره شرایط شخصی خودم بپرسم؟", a: "پرسش‌های عمومی در جلسه پاسخ داده می‌شود. برای موضوعات شخصی یا مالی، مشاوره خصوصی رزرو کنید." }
        ],
        joinTitle: "ورود به این جلسه", joinPublic: "لینک برای همه باز است — ثبت‌نام لازم نیست.",
        joinBtn: "ورود به وبینار", joinNow: "ورود — جلسه زنده است", roomOpens: "اتاق ساعت {time} به وقت کابل، ۱۰ دقیقه پیش از شروع باز می‌شود.",
        lockedTitle: "لینک پس از ثبت‌نام ارسال می‌شود", lockedText: "لینک ورود این جلسه ۲۴ ساعت و ۱ ساعت پیش از شروع از راه واتس‌اپ برای ثبت‌نام‌کنندگان فرستاده می‌شود.",
        shareWa: "اشتراک در واتس‌اپ", addCal: "افزودن به تقویم", liveBanner: "این جلسه هم‌اکنون زنده است",
        linkSoon: "لینک به‌زودی گذاشته می‌شود", linkSoonNote: "لینک ورود پیش از شروع جلسه در همین‌جا قرار می‌گیرد. با ثبت‌نام، آن را در واتس‌اپ هم دریافت می‌کنید.",
        heldTitle: "این جلسه برگزار شد", heldText: "از همه شرکت‌کنندگان تشکر می‌کنیم. جلسه بعدی این مجموعه را در پایین ببینید.", consultTitle: "مشاوره خصوصی رایگان", consultText: "یک تماس محرمانه ۱۵ تا ۲۰ دقیقه‌ای برای شرکت‌کنندگان این جلسه.", consultBtn: "رزرو مشاوره",
        notOpen: "ثبت‌نام این جلسه بعد از جلسه {n} باز می‌شود.", other: "جلسه‌های دیگر این مجموعه", soonCta: "خبرم کنید"
      },
      form: {
        title: "یادآوری و چک‌لیست", subPublic: "اختیاری — لینک و یادآوری را در واتس‌اپ و چک‌لیست مدارک به دری را بعد از جلسه دریافت کنید.", subPrivate: "برای دریافت لینک ورود و یادآوری در واتس‌اپ ثبت‌نام کنید.",
        name: "نام", nameHint: "لازم نیست نام واقعی باشد.", wa: "شماره واتس‌اپ", waHint: "لینک و یادآوری را به این شماره می‌فرستیم.", email: "ایمیل", optional: "اختیاری",
        country: "محل زندگی شما", choose: "انتخاب کنید…", countries: { AF: "افغانستان", AE: "امارات", TR: "ترکیه", IR: "ایران", other: "سایر" },
        question: "پرسش شما از کارشناس", questionHint: "لطفاً اطلاعات شخصی و مالی ننویسید.", newsletter: "خبر وبینارهای بعدی را برایم بفرستید",
        submit: "ثبت‌نام رایگان", sending: "در حال ثبت…", privacy: "اطلاعات شما فقط برای اطلاع‌رسانی همین وبینار و پاسخ به درخواست مشاوره استفاده می‌شود و در اختیار شخص دیگری قرار نمی‌گیرد.",
        errName: "لطفاً یک نام بنویسید (حداقل ۲ حرف).", errPhone: "لطفاً شماره واتس‌اپ درست وارد کنید.", errEmail: "این ایمیل درست به نظر نمی‌رسد.", errCountry: "لطفاً محل زندگی را انتخاب کنید.", errQuestion: "پرسش باید کمتر از ۵۰۰ حرف باشد.", alert: "لطفاً موارد مشخص‌شده را اصلاح کنید.", closed: "ثبت‌نام این جلسه بسته شده است."
      },
      thanks: {
        eyebrow: "ثبت‌نام تأیید شد", title: "ثبت‌نام شما انجام شد!", text: "{name} عزیز، تشکر. جای شما ثبت شد. همه چیزهایی که برای جلسه لازم دارید این‌جاست.", already: "این شماره واتس‌اپ قبلاً برای همین جلسه ثبت شده است — اطلاعات ثبت‌نام شما:",
        ref: "کد پیگیری", next: "مراحل بعدی",
        steps: [
          { t: "همین حالا", d: "تأیید ثبت‌نام (و ایمیل، اگر وارد کرده باشید)." },
          { t: "۳ روز قبل", d: "یادآوری در واتس‌اپ — پرسش خود را بفرستید." },
          { t: "۲۴ ساعت و ۱ ساعت قبل", d: "لینک ورود در واتس‌اپ و ایمیل." },
          { t: "تا ۲۴ ساعت بعد", d: "پیام تشکر، خلاصه جلسه، چک‌لیست و لینک رزرو مشاوره." }
        ],
        back: "بازگشت به وبینارها"
      },
      demo: { fab: "کنترل دمو", title: "کنترل‌های دمو", intro: "با تغییر حالت‌ها همه نسخه‌های صفحه را ببینید. این کنترل‌ها جزو طراحی نهایی نیستند.", state: "وضعیت جلسه اول", visibility: "چه کسی لینک را می‌بیند", public: "عمومی روی صفحه", registrants: "فقط ثبت‌نام‌کنندگان", pages: "صفحه‌ها", list: "فهرست وبینارها", detail: "صفحه جلسه اول", thanks: "صفحه تشکر", admin: "مدیریت و ثبت‌نام‌ها", integration: "اتصال به سایت", reset: "پاک کردن داده‌های دمو", resetDone: "داده‌های دمو پاک شد", sampleLink: "لینک نمونه — لینک واقعی جلسه در پنل مدیریت تنظیم می‌شود.", linkState: "وضعیت لینک", linkSoon: "به‌زودی", linkSet: "لینک آماده" },
      admin: {
        title: "پیش‌نمایش پنل مدیریت", intro: "فیلدهایی که تیم مارکتینگ در CMS فعلی (مثل پست‌های بلاگ) لازم دارد و شکل خروجی ثبت‌نام‌ها.", warn: "فقط دمو: در نسخه نهایی این صفحه پشت ورود پنل مدیریت فعلی است و داده‌ها از CRM / گوگل‌شیت می‌آید.",
        tabContent: "فیلدهای وبینار", tabRegs: "ثبت‌نام‌ها", pick: "وبینار", status: "وضعیت جلسه", regOpen: "ثبت‌نام باز", start: "شروع (وقت کابل)", confirmed: "تاریخ تأیید شده", vis: "نمایش لینک ورود", url: "لینک اتاق جلسه (خالی = «به‌زودی»)", cap: "ظرفیت", titleFa: "عنوان — فارسی", titleEn: "عنوان — انگلیسی", save: "ذخیره (دمو)", saved: "ذخیره شد — پیش‌نمایش به‌روز شد",
        kRegs: "ثبت‌نام", kAF: "ساکن افغانستان", kNews: "عضویت خبرنامه", kQ: "پرسش دریافتی", export: "خروجی CSV (اکسل)", none: "هنوز ثبت‌نامی نیست — فرم صفحه جلسه را پر کنید تا ردیف آن این‌جا دیده شود.",
        cols: { id: "کد", at: "زمان ثبت (UTC)", name: "نام", wa: "واتس‌اپ", email: "ایمیل", country: "کشور", q: "پرسش", news: "خبرنامه", src: "utm_source", lang: "زبان" }
      },
      int: {
        title: "اتصال به سایت", intro: "جاهایی که بخش جدید به وبسایت فعلی وصل می‌شود. همه اجزای زیر زنده‌اند و با زبان انتخاب‌شده تغییر می‌کنند.",
        nav: "۱ · منوی اصلی — «وبینارها» کنار بلاگ", home: "۲ · صفحه اصلی — بنر باریک زیر بخش آمار", homeT: "وبینار زنده و رایگان: {title}", homeD: "{date} · ساعت {time} کابل", homeBtn: "جزئیات و ورود",
        blog: "۳ · انتهای پست‌های مرتبط بلاگ", blogEyebrow: "وبینار زنده", urls: "۴ · نقشه آدرس‌ها", urlCols: ["صفحه", "انگلیسی", "فارسی / عربی / چینی"], urlRows: ["فهرست وبینارها", "صفحه هر جلسه", "صفحه تشکر (noindex)"]
      }
    }
  },

  ar: {
    meta: { dir: "rtl", code: "AR", locale: "ar-AE", name: "العربية", title: "الندوات عبر الإنترنت | مجموعة شريف دبي", description: "ندوات مباشرة ومجانية من مجموعة شريف حول الجنسية الثانية والإقامة — انضم من هاتفك دون تثبيت أي تطبيق." },
    nav: {
      citizenship: "الجنسية",
      residency: "الإقامة",
      moreServices: "خدمات أخرى",
      aboutUs: "من نحن",
      contact: "اتصل بنا",
      blog: "المدونة",
      webinars: "الندوات",
      eligibilityChecker: "التحقق من الأهلية",
      bookConsultation: "حجز استشارة",
      dualCitizenship: "الجنسية المزدوجة",
      allCitizenship: "جميع برامج الجنسية",
      globalResidency: "الإقامة العالمية",
      allResidency: "جميع برامج الإقامة",
      realEstate: "الاستشارات العقارية",
      education: "الاستشارات التعليمية",
      socialResp: "المسؤولية الاجتماعية",
      aboutSharif: "عن مجموعة شريف",
      aboutFounder: "عن المؤسس | علي شريف",
      eligibilityAssessment: "تقييم الأهلية",
      caribbeanPortfolios: "محافظ الكاريبي",
      globalPortfolios: "المحافظ العالمية",
      europeanPortfolios: "المحافظ الأوروبية",
      americasUAE: "الأمريكتان والإمارات",
      corporateIdentity: "الهوية المؤسسية",
      overview: "نظرة عامة",
      viewAllServices: "عرض جميع الخدمات",
      cbiTitle: "الجنسية<br>عبر<br>الاستثمار",
      rbiTitle: "الإقامة<br>عبر<br>الاستثمار"
    },
    footer: {
      webinars: "الندوات عبر الإنترنت",
      quickLinks: "روابط سريعة",
      home: "الرئيسية",
      aboutSharif: "عن | مجموعة شريف",
      aboutAli: "عن | علي شريف",
      socialResp: "المسؤولية الاجتماعية",
      citizenshipPrograms: "برامج الجنسية",
      residencyPrograms: "برامج الإقامة",
      realEstate: "العقارات",
      educationalAdvisory: "الاستشارات التعليمية",
      contactUs: "اتصل بنا",
      insightsBlog: "المقالات والمدونة",
      eligibilityChecker: "فحص الأهلية",
      citizenshipProgramsCol: "برامج الجنسية",
      residencyProgramsCol: "برامج الإقامة",
      otherServices: "خدمات أخرى",
      legalFrameworks: "الأطر القانونية",
      privacyPolicy: "سياسة الخصوصية",
      termsOfUse: "شروط الاستخدام",
      cookiePolicy: "سياسة ملفات تعريف الارتباط",
      allRightsReserved: "© 2026 مجموعة شريف. جميع الحقوق محفوظة.",
      designedBy: "تصميم وتطوير بواسطة",
      address: "116، برج باينري، الخليج التجاري، دبي، الإمارات العربية المتحدة",
      tagline: "استشارات خاصة موثوقة في الجنسية الثانية والإقامة والعقارات والتعليم — الخليج التجاري، دبي.",
      upcoming: "الجلسات القادمة",
      cbi: {
        dominica: "دومينيكا | جواز سفر",
        kitts: "سانت كيتس ونيفيس | جواز سفر",
        antigua: "أنتيغوا وبربودا | جواز سفر",
        lucia: "سانت لوسيا | جواز سفر",
        grenada: "غرينادا | جواز سفر",
        vanuatu: "فانواتو | جواز سفر",
        saotome: "ساو تومي وبرينسيب | جواز سفر",
        nauru: "جمهورية ناورو | جواز سفر"
      },
      rbi: {
        portugal: "البرتغال | التأشيرة الذهبية",
        greece: "اليونان | التأشيرة الذهبية",
        panama: "بنما | التأشيرة الذهبية",
        uae: "الإمارات العربية المتحدة | التأشيرة الذهبية"
      }
    },
    webinars: {
      common: { demoStrong: "نسخة تجريبية", demoText: "معاينة لفريق الموقع — لا يتم إرسال أو حفظ أي بيانات خارج هذا المتصفح.", skip: "انتقل إلى المحتوى", isNew: "جديد", free: "مجاناً", min: "{n} دقيقة", sample: "تاريخ تجريبي — بانتظار الاعتماد", copy: "نسخ الرابط", copied: "تم نسخ الرابط", close: "إغلاق", lang: "الفارسية (الدرية)", online: "عبر الإنترنت", seats: "{n} مقعداً", sessionN: "الجلسة {n}", of: "من" },
      cd: { d: "أيام", h: "ساعات", m: "دقائق", s: "ثوانٍ" },
      tz: { kabul: "كابول", dubai: "دبي", istanbul: "إسطنبول", you: "توقيتك" },
      status: { upcoming: "قادمة", live: "مباشر الآن", ended: "انعقدت", postponed: "مؤجلة", cancelled: "ملغاة", regOpen: "التسجيل مفتوح", regClosed: "التسجيل مغلق", soon: "قريباً", publicLink: "رابط عام" },
      list: {
        eyebrow: "جلسات مباشرة ورؤى", title: "الندوات عبر الإنترنت", sub: "مجموعة شريف دبي",
        lede: "جلسات مباشرة ومجانية عبر الإنترنت يشرح فيها خبراؤنا مسارات الجنسية والإقامة بوضوح ويجيبون عن أسئلتكم.",
        nextEyebrow: "الجلسة المباشرة القادمة", join: "الانضمام إلى الندوة", remind: "تذكير عبر واتساب", details: "التفاصيل الكاملة",
        startsIn: "تبدأ بعد", whenTitle: "التاريخ والوقت", noInstall: "دون تثبيت تطبيق", phoneOk: "تعمل على الهاتف",
        upTitle: "الجلسات <em>القادمة</em>", seriesTag: "السلسلة 01 · دومينيكا", seriesTitle: "السلسلة التجريبية لدومينيكا", seriesText: "ثلاث جلسات بفاصل أسبوعين — من الأساسيات إلى المستندات وأسئلتكم الخاصة. جميع الجلسات مجانية وباللغة الفارسية (الدرية).",
        sessionCta: "التفاصيل", howEyebrow: "قبل الانضمام", howTitle: "كيف <em>تنضم</em>",
        howSub: "أربع خطوات بسيطة للمشاركة في الجلسات المباشرة — دون الحاجة لتحميل أي تطبيقات.",
        steps: [
          { t: "افتح الرابط", d: "اضغط «الانضمام إلى الندوة» في هذه الصفحة من هاتفك أو حاسوبك. لا حاجة لتثبيت أي تطبيق." },
          { t: "ادخل بأي اسم", d: "يمكنك الانضمام بأي اسم. تبقى الكاميرا والميكروفون مغلقين." },
          { t: "الإنترنت ضعيف؟", d: "اختر «الصوت فقط». الصوت هو محور الجلسة والشرائح بسيطة." },
          { t: "اسأل في الدردشة", d: "اكتب سؤالك في الدردشة، وسيقرؤه المقدّم دون ذكر اسمك." }
        ],
        timelineEyebrow: "المسار الزمني",
        stepPrefix: "الخطوة",
        stepTips: [
          "وصول فوري بنقرة واحدة من هاتفك أو حاسوبك دون الحاجة لتثبيت أي تطبيق.",
          "خصوصية تامة مضمونة — الكاميرا والميكروفون مغلقان تماماً افتراضياً.",
          "وضع الصوت فقط يضمن متابعة واضحة وسلسة حتى مع الاتصالات الضعيفة.",
          "اطرح أسئلتك في الدردشة الخاصة وسيجيب المحاضر دون الكشف عن هويتك."
        ],
        finalKicker: "أنت جاهز للمشاركة",
        finalTitle: "أنت الآن جاهز بالكامل لحضور الجلسة المباشرة!",
        finalDesc: "دون تحميل أي برنامج، بدون كاميرا، مجاناً وسرية ١٠٠٪. خبراؤنا بانتظار الإجابة على استفساراتكم.",
        privacyTitle: "خصوصيتك محمية", privacyText: "لا أحد يعرف من حضر. يُظهر التسجيل المتحدثين والشرائح فقط، دون أسماء المشاركين أو صورهم.",
        ctaTitle: "تفضّل محادثة خاصة؟", ctaText: "احجز استشارة سرية مع فريقنا في الخليج التجاري بدبي — حضورياً أو هاتفياً أو عبر الإنترنت.", ctaBtn: "حجز استشارة"
      },
      detail: {
        recapTitle: "ملخص الجلسة", home: "الرئيسية", about: "عن هذه الجلسة", learn: "ما ستتعلمه", agenda: "جدول الجلسة", speakers: "المتحدثون",
        agendaItems: [
          { t: "0–5", l: "ترحيب بالدرية واستطلاع قصير", w: "المقدّم" },
          { t: "5–10", l: "تعريف بمجموعة شريف والمتحدث", w: "المقدّم" },
          { t: "10–40", l: "المحتوى الرئيسي", w: "المتحدث" },
          { t: "40–45", l: "الخطوة التالية: استشارة خاصة مجانية وقائمة المستندات", w: "المتحدث" },
          { t: "45–63", l: "أسئلة وأجوبة مباشرة", w: "المقدّم والمتحدث" },
          { t: "63–65", l: "الخلاصة والجلسة القادمة", w: "المقدّم" }
        ],
        minutes: "دقيقة",
        expertName: "أخصائي أول في الجنسية", expertRole: "مجموعة شريف، دبي", hostName: "مقدّم يتحدث الدرية", hostRole: "يدير الأسئلة والدردشة", tbd: "يُعلن الاسم لاحقاً",
        privacy: "الخصوصية أثناء الجلسة",
        privacyItems: ["انضم بأي اسم — الكاميرا والميكروفون مغلقان افتراضياً.", "يُظهر التسجيل المتحدثين والشرائح فقط.", "لا يقرأ المقدّم اسم صاحب السؤال.", "يمكنك إرسال سؤالك إلى المقدّم بشكل خاص."],
        faq: "الأسئلة الشائعة",
        faqs: [
          { q: "هل أحتاج إلى تثبيت تطبيق؟", a: "لا. يفتح الرابط في متصفح الهاتف أو الحاسوب، ويُفضّل استخدام Chrome." },
          { q: "أين رابط الانضمام؟", a: "في هذه الصفحة وهو متاح للجميع. يُنشر قبل الجلسة بوقت قصير وتُفتح الغرفة قبل البدء بـ10 دقائق. وإذا سجّلت نرسله إليك أيضاً عبر واتساب." },
          { q: "هل سيرى الآخرون اسمي أو صورتي؟", a: "لا. يمكنك استخدام أي اسم، والكاميرا والميكروفون مغلقان، ويُظهر التسجيل المتحدثين والشرائح فقط." },
          { q: "ماذا لو كان الإنترنت ضعيفاً؟", a: "اختر «الصوت فقط». الصوت هو محور الجلسة والشرائح بسيطة." },
          { q: "هل الحضور مجاني؟", a: "نعم، الحضور مجاني تماماً." },
          { q: "هل يمكنني السؤال عن وضعي الشخصي؟", a: "تتم الإجابة عن الأسئلة العامة مباشرة. للمسائل الشخصية أو المالية احجز استشارة خاصة." }
        ],
        joinTitle: "الانضمام إلى هذه الجلسة", joinPublic: "الرابط متاح للجميع — لا يلزم التسجيل.",
        joinBtn: "الانضمام إلى الندوة", joinNow: "انضم الآن — مباشر", roomOpens: "تُفتح الغرفة الساعة {time} بتوقيت كابول، قبل البدء بـ10 دقائق.",
        lockedTitle: "يُرسل الرابط بعد التسجيل", lockedText: "يُرسل رابط هذه الجلسة عبر واتساب إلى المسجّلين قبل البدء بـ24 ساعة وبساعة واحدة.",
        shareWa: "مشاركة عبر واتساب", addCal: "إضافة إلى التقويم", liveBanner: "هذه الجلسة مباشرة الآن",
        linkSoon: "سيُنشر الرابط قريباً", linkSoonNote: "سيظهر رابط الانضمام هنا قبل بدء الجلسة. سجّل لتستلمه عبر واتساب أيضاً.",
        heldTitle: "انعقدت هذه الجلسة", heldText: "شكراً لكل من حضر. الجلسة التالية من هذه السلسلة مذكورة أدناه.", consultTitle: "استشارة خاصة مجانية", consultText: "مكالمة سرية من 15 إلى 20 دقيقة لحضور هذه الجلسة.", consultBtn: "احجز استشارة",
        notOpen: "يُفتح التسجيل لهذه الجلسة بعد الجلسة {n}.", other: "جلسات أخرى في هذه السلسلة", soonCta: "أبلغني"
      },
      form: {
        title: "التذكيرات وقائمة المستندات", subPublic: "اختياري — استلم الرابط والتذكيرات عبر واتساب، وقائمة المستندات بالدرية بعد الجلسة.", subPrivate: "سجّل لاستلام رابط الانضمام والتذكيرات عبر واتساب.",
        name: "الاسم", nameHint: "لا يلزم أن يكون اسمك الحقيقي.", wa: "رقم واتساب", waHint: "نرسل الرابط والتذكيرات إلى هذا الرقم.", email: "البريد الإلكتروني", optional: "اختياري",
        country: "أين تقيم؟", choose: "اختر…", countries: { AF: "أفغانستان", AE: "الإمارات", TR: "تركيا", IR: "إيران", other: "أخرى" },
        question: "سؤالك للأخصائي", questionHint: "يرجى عدم كتابة معلومات شخصية أو مالية.", newsletter: "أرسلوا لي أخبار الندوات القادمة",
        submit: "سجّل مجاناً", sending: "جارٍ التسجيل…", privacy: "تُستخدم معلوماتك فقط لإبلاغك بهذه الندوة والرد على طلب الاستشارة، ولا تُشارك مع أي طرف آخر.",
        errName: "يرجى إدخال اسم (حرفان على الأقل).", errPhone: "يرجى إدخال رقم واتساب صحيح.", errEmail: "يبدو أن البريد الإلكتروني غير صحيح.", errCountry: "يرجى اختيار مكان الإقامة.", errQuestion: "يرجى ألا يتجاوز السؤال 500 حرف.", alert: "يرجى تصحيح الحقول المحددة.", closed: "التسجيل لهذه الجلسة مغلق."
      },
      thanks: {
        eyebrow: "تم تأكيد التسجيل", title: "تم تسجيلك!", text: "شكراً {name}. تم حجز مكانك، وإليك كل ما تحتاجه للجلسة.", already: "رقم واتساب هذا مسجّل مسبقاً لهذه الجلسة — إليك بياناتك.",
        ref: "رقم المرجع", next: "الخطوات التالية",
        steps: [
          { t: "الآن", d: "تأكيد التسجيل (وبريد إلكتروني إن أضفته)." },
          { t: "قبل 3 أيام", d: "تذكير عبر واتساب — أرسل لنا سؤالك." },
          { t: "قبل 24 ساعة وساعة واحدة", d: "رابط الانضمام عبر واتساب والبريد الإلكتروني." },
          { t: "خلال 24 ساعة بعد الجلسة", d: "رسالة شكر وملخص قصير وقائمة المستندات ورابط حجز الاستشارة." }
        ],
        back: "العودة إلى الندوات"
      },
      demo: { fab: "تحكم العرض", title: "أدوات التحكم التجريبية", intro: "بدّل الحالات لمعاينة كل نسخ الصفحة. هذه الأدوات ليست جزءاً من التصميم النهائي.", state: "حالة الجلسة الأولى", visibility: "من يرى الرابط", public: "عام على الصفحة", registrants: "للمسجلين فقط", pages: "صفحات المعاينة", list: "قائمة الندوات", detail: "صفحة الجلسة 1", thanks: "صفحة الشكر", admin: "الإدارة والتسجيلات", integration: "الربط بالموقع", reset: "إعادة ضبط بيانات العرض", resetDone: "تمت إعادة الضبط", sampleLink: "رابط تجريبي — يُضبط رابط الجلسة الحقيقي من لوحة الإدارة.", linkState: "حالة الرابط", linkSoon: "قريباً", linkSet: "الرابط جاهز" },
      admin: {
        title: "معاينة لوحة الإدارة", intro: "الحقول التي يحتاجها فريق التسويق في نظام إدارة المحتوى الحالي (مثل مقالات المدونة) وشكل ملف التسجيلات.", warn: "للعرض فقط: في النسخة النهائية تكون هذه الصفحة خلف تسجيل دخول لوحة الإدارة الحالية وتأتي البيانات من CRM / Google Sheet.",
        tabContent: "حقول الندوة", tabRegs: "التسجيلات", pick: "الندوة", status: "حالة الجلسة", regOpen: "التسجيل مفتوح", start: "البداية (توقيت كابول)", confirmed: "التاريخ معتمد", vis: "ظهور رابط الانضمام", url: "رابط غرفة الاجتماع (فارغ = «قريباً»)", cap: "السعة", titleFa: "العنوان — فارسي", titleEn: "العنوان — إنجليزي", save: "حفظ (تجريبي)", saved: "تم الحفظ — تم تحديث المعاينة",
        kRegs: "التسجيلات", kAF: "مقيمون في أفغانستان", kNews: "اشتراكات النشرة", kQ: "أسئلة مستلمة", export: "تصدير CSV (Excel)", none: "لا توجد تسجيلات بعد — املأ النموذج في صفحة الجلسة لترى صفاً هنا.",
        cols: { id: "المرجع", at: "وقت التسجيل (UTC)", name: "الاسم", wa: "واتساب", email: "البريد", country: "الدولة", q: "السؤال", news: "النشرة", src: "utm_source", lang: "اللغة" }
      },
      int: {
        title: "الربط بالموقع", intro: "أماكن ربط القسم الجديد بالموقع الحالي. جميع المكونات أدناه حيّة وتتبع اللغة المختارة.",
        nav: "1 · القائمة الرئيسية — «الندوات» بجانب المدونة", home: "2 · الصفحة الرئيسية — شريط رفيع تحت قسم الأرقام", homeT: "ندوة مباشرة مجانية: {title}", homeD: "{date} · {time} بتوقيت كابول", homeBtn: "التفاصيل والانضمام",
        blog: "3 · نهاية مقالات المدونة ذات الصلة", blogEyebrow: "ندوة مباشرة", urls: "4 · خريطة الروابط", urlCols: ["الصفحة", "الإنجليزية", "الفارسية / العربية / الصينية"], urlRows: ["قائمة الندوات", "صفحة الجلسة", "صفحة الشكر (noindex)"]
      }
    }
  },

  zh: {
    meta: { dir: "ltr", code: "中文", locale: "zh-CN", name: "中文", title: "在线讲座 | 谢里夫集团迪拜", description: "谢里夫集团免费直播讲座：第二国籍与居留——手机即可参加，无需安装应用。" },
    nav: {
      citizenship: "公民身份",
      residency: "居留",
      moreServices: "其他服务",
      aboutUs: "关于我们",
      contact: "联系我们",
      blog: "博客",
      webinars: "在线讲座",
      eligibilityChecker: "资格检查",
      bookConsultation: "预约咨询",
      dualCitizenship: "双重国籍",
      allCitizenship: "所有入籍项目",
      globalResidency: "全球居留",
      allResidency: "所有居留项目",
      realEstate: "房产投资咨询",
      education: "国际教育咨询",
      socialResp: "企业社会责任",
      aboutSharif: "关于谢里夫集团",
      aboutFounder: "关于创始人 | 阿里·谢里夫",
      eligibilityAssessment: "资格在线评估",
      caribbeanPortfolios: "加勒比投资组合",
      globalPortfolios: "全球投资组合",
      europeanPortfolios: "欧洲投资组合",
      americasUAE: "美洲与阿联酋",
      corporateIdentity: "企业形象",
      overview: "概览",
      viewAllServices: "查看所有服务",
      cbiTitle: "投资<br>入籍<br>项目",
      rbiTitle: "投资<br>居留<br>项目"
    },
    footer: {
      webinars: "在线讲座",
      quickLinks: "快速链接",
      home: "首页",
      aboutSharif: "关于 | 谢里夫集团",
      aboutAli: "关于 | 阿里·谢里夫",
      socialResp: "社会责任",
      citizenshipPrograms: "投资入籍项目",
      residencyPrograms: "投资居留项目",
      realEstate: "高端房产",
      educationalAdvisory: "国际教育咨询",
      contactUs: "联系我们",
      insightsBlog: "行业洞察与博客",
      eligibilityChecker: "资格评估工具",
      citizenshipProgramsCol: "入籍项目",
      residencyProgramsCol: "居留项目",
      otherServices: "其他尊贵服务",
      legalFrameworks: "法律框架",
      privacyPolicy: "隐私政策",
      termsOfUse: "使用条款",
      cookiePolicy: "信息记录程序政策",
      allRightsReserved: "© 2026 谢里夫集团。保留所有权利。",
      designedBy: "设计与技术支持：",
      address: "阿拉伯联合酋长国 迪拜 商业湾 双子塔 116室",
      tagline: "值得信赖的私人顾问：第二国籍、居留、房产与教育——迪拜商业湾。",
      upcoming: "即将举行",
      cbi: {
        dominica: "多米尼克 | 护照",
        kitts: "圣基茨和尼维斯 | 护照",
        antigua: "安提瓜和巴布达 | 护照",
        lucia: "圣卢西亚 | 护照",
        grenada: "格林纳达 | 护照",
        vanuatu: "瓦努阿图 | 护照",
        saotome: "圣多美和普林西比 | 护照",
        nauru: "瑙鲁共和国 | 护照"
      },
      rbi: {
        portugal: "葡萄牙 | 黄金签证",
        greece: "希腊 | 黄金签证",
        panama: "巴拿马 | 黄金签证",
        uae: "阿联酋 | 黄金签证"
      }
    },
    webinars: {
      common: { demoStrong: "演示版", demoText: "供网站团队预览——任何数据都不会发送或保存到本浏览器之外。", skip: "跳到内容", isNew: "新", free: "免费", min: "{n} 分钟", sample: "示例日期——待确认", copy: "复制链接", copied: "链接已复制", close: "关闭", lang: "波斯语（达利语）", online: "线上", seats: "{n} 个名额", sessionN: "第 {n} 场", of: "/" },
      cd: { d: "天", h: "小时", m: "分钟", s: "秒" },
      tz: { kabul: "喀布尔", dubai: "迪拜", istanbul: "伊斯坦布尔", you: "您的时间" },
      status: { upcoming: "即将开始", live: "正在直播", ended: "已举行", postponed: "已延期", cancelled: "已取消", regOpen: "报名开放", regClosed: "报名已截止", soon: "敬请期待", publicLink: "公开链接" },
      list: {
        eyebrow: "直播讲座与洞察", title: "在线讲座", sub: "谢里夫集团 · 迪拜",
        lede: "免费在线直播讲座：我们的专家清晰讲解入籍与居留路径，并现场解答您的问题。",
        nextEyebrow: "下一场直播", join: "进入讲座", remind: "WhatsApp 提醒", details: "查看详情",
        startsIn: "距离开始", whenTitle: "日期与时间", noInstall: "无需安装应用", phoneOk: "支持手机观看",
        upTitle: "即将<em>开讲</em>", seriesTag: "系列 01 · 多米尼克", seriesTitle: "多米尼克试点系列", seriesText: "共三场，每两周一场——从基础知识到申请材料，再到您的个人问题。全部免费，以波斯语（达利语）进行。",
        sessionCta: "详情", howEyebrow: "参加之前", howTitle: "如何<em>参加</em>",
        howSub: "只需简单四步即可参与直播互动 — 无需下载任何应用程序。",
        steps: [
          { t: "打开链接", d: "用手机或电脑点击本页的“进入讲座”，无需安装任何应用。" },
          { t: "任意名字进入", d: "可使用任意名字进入，您的摄像头和麦克风保持关闭。" },
          { t: "网络较慢？", d: "选择“仅音频”。讲座以语音为主，幻灯片简洁。" },
          { t: "在聊天区提问", d: "在聊天区输入问题，主持人会匿名宣读。" }
        ],
        timelineEyebrow: "时间轴",
        stepPrefix: "第",
        stepTips: [
          "手机或电脑一键极速接入，无需下载安装任何软件。",
          "严格保护参会隐私——摄像头与麦克风全程保持关闭。",
          "支持纯音频模式，即使网络信号较弱也能流畅清晰收听。",
          "在聊天栏随时提出疑问，主持人将匿名解答，不透露个人身份。"
        ],
        finalKicker: "准备就绪",
        finalTitle: "您已准备好加入在线研讨会！",
        finalDesc: "无需下载、无需开摄像头，百分之百私密且完全免费。专家团队将为您深度解答。",
        privacyTitle: "您的隐私受到保护", privacyText: "没有人能看到谁参加了讲座。录像仅显示主讲人和幻灯片，不包含参与者的姓名或影像。",
        ctaTitle: "更希望私下沟通？", ctaText: "预约与我们迪拜商业湾团队的保密咨询——到访、电话或线上均可。", ctaBtn: "预约咨询"
      },
      detail: {
        recapTitle: "讲座摘要", home: "首页", about: "关于本场讲座", learn: "您将了解", agenda: "讲座流程", speakers: "主讲人",
        agendaItems: [
          { t: "0–5", l: "达利语欢迎及简短投票", w: "主持人" },
          { t: "5–10", l: "介绍谢里夫集团及主讲人", w: "主持人" },
          { t: "10–40", l: "主要内容", w: "主讲人" },
          { t: "40–45", l: "下一步：免费私人咨询与材料清单", w: "主讲人" },
          { t: "45–63", l: "现场问答", w: "主持人与主讲人" },
          { t: "63–65", l: "总结及下期预告", w: "主持人" }
        ],
        minutes: "分钟",
        expertName: "资深入籍顾问", expertRole: "谢里夫集团，迪拜", hostName: "达利语主持人", hostRole: "负责提问与聊天管理", tbd: "姓名待公布",
        privacy: "讲座中的隐私保护",
        privacyItems: ["可用任意名字进入——摄像头和麦克风默认关闭。", "录像仅显示主讲人和幻灯片。", "主持人宣读问题时不念提问者姓名。", "您可以私信向主持人提问。"],
        faq: "常见问题",
        faqs: [
          { q: "需要安装应用吗？", a: "不需要。链接可在手机或电脑浏览器中直接打开，推荐使用 Chrome。" },
          { q: "参会链接在哪里？", a: "就在本页，向所有人公开。链接会在讲座前不久发布，会议室在开始前 10 分钟开放。报名后我们也会通过 WhatsApp 发送给您。" },
          { q: "别人会看到我的名字或样貌吗？", a: "不会。您可以使用任意名字，摄像头和麦克风关闭，录像只显示主讲人和幻灯片。" },
          { q: "网络不好怎么办？", a: "选择“仅音频”。讲座以语音为主，幻灯片简洁。" },
          { q: "参加需要付费吗？", a: "完全免费。" },
          { q: "可以咨询我的个人情况吗？", a: "通用问题会在现场解答。涉及个人或财务的问题，请预约私人咨询。" }
        ],
        joinTitle: "参加本场讲座", joinPublic: "链接向所有人公开——无需报名。",
        joinBtn: "进入讲座", joinNow: "立即进入——直播中", roomOpens: "会议室将于喀布尔时间 {time}（开始前 10 分钟）开放。",
        lockedTitle: "报名后发送链接", lockedText: "本场参会链接将在开始前 24 小时和 1 小时通过 WhatsApp 发送给报名者。",
        shareWa: "分享到 WhatsApp", addCal: "添加到日历", liveBanner: "本场讲座正在直播",
        linkSoon: "链接即将公布", linkSoonNote: "参会链接将在讲座开始前发布在此处。报名后也会通过 WhatsApp 发送给您。",
        heldTitle: "本场讲座已举行", heldText: "感谢所有参与者。本系列的下一场讲座见下方。", consultTitle: "免费私人咨询", consultText: "为本场参与者提供 15–20 分钟的保密通话。", consultBtn: "预约咨询",
        notOpen: "本场报名将在第 {n} 场结束后开放。", other: "本系列其他场次", soonCta: "通知我"
      },
      form: {
        title: "提醒与材料清单", subPublic: "可选——通过 WhatsApp 接收链接和提醒，讲座后获取达利语材料清单。", subPrivate: "报名后通过 WhatsApp 接收参会链接和提醒。",
        name: "姓名", nameHint: "不必使用真实姓名。", wa: "WhatsApp 号码", waHint: "我们将把链接和提醒发送到此号码。", email: "电子邮箱", optional: "选填",
        country: "您居住在哪里？", choose: "请选择…", countries: { AF: "阿富汗", AE: "阿联酋", TR: "土耳其", IR: "伊朗", other: "其他" },
        question: "您想问专家的问题", questionHint: "请勿填写个人或财务信息。", newsletter: "向我发送后续讲座信息",
        submit: "免费报名", sending: "正在报名…", privacy: "您的信息仅用于本次讲座通知及回复您的咨询请求，绝不会提供给任何第三方。",
        errName: "请输入姓名（至少 2 个字符）。", errPhone: "请输入有效的 WhatsApp 号码。", errEmail: "邮箱地址格式似乎不正确。", errCountry: "请选择居住地。", errQuestion: "问题请控制在 500 字以内。", alert: "请修改标出的字段。", closed: "本场报名已截止。"
      },
      thanks: {
        eyebrow: "报名成功", title: "您已成功报名！", text: "谢谢您，{name}。您的名额已保留，以下是参会所需的全部信息。", already: "该 WhatsApp 号码已报名本场讲座——以下是您的报名信息。",
        ref: "报名编号", next: "接下来",
        steps: [
          { t: "现在", d: "报名确认（如填写邮箱，也会发送邮件）。" },
          { t: "开始前 3 天", d: "WhatsApp 提醒——欢迎提交您的问题。" },
          { t: "开始前 24 小时和 1 小时", d: "通过 WhatsApp 和邮件发送参会链接。" },
          { t: "结束后 24 小时内", d: "感谢信息、简短摘要、材料清单及咨询预约链接。" }
        ],
        back: "返回讲座列表"
      },
      demo: { fab: "演示控制", title: "演示控制", intro: "切换状态以预览页面的各个版本。这些控件不属于正式设计。", state: "第 1 场状态", visibility: "谁可见链接", public: "页面公开", registrants: "仅报名者", pages: "预览页面", list: "讲座列表", detail: "第 1 场页面", thanks: "感谢页面", admin: "后台与报名", integration: "网站集成", reset: "重置演示数据", resetDone: "演示数据已重置", sampleLink: "示例链接——真实的会议链接在后台设置。", linkState: "链接状态", linkSoon: "即将公布", linkSet: "链接已就绪" },
      admin: {
        title: "后台预览", intro: "市场团队在现有 CMS（与博客文章相同）中需要的字段，以及报名导出的格式。", warn: "仅供演示：正式版中此页面位于现有后台登录之后，数据来自 CRM / Google 表格。",
        tabContent: "讲座字段", tabRegs: "报名记录", pick: "讲座", status: "讲座状态", regOpen: "报名开放", start: "开始时间（喀布尔）", confirmed: "日期已确认", vis: "参会链接可见性", url: "会议室链接（留空 = “即将公布”）", cap: "名额", titleFa: "标题——波斯语", titleEn: "标题——英语", save: "保存（演示）", saved: "已保存——预览已更新",
        kRegs: "报名人数", kAF: "居住在阿富汗", kNews: "订阅资讯", kQ: "收到的问题", export: "导出 CSV（Excel）", none: "暂无报名——在讲座页面提交表单后，此处将显示记录。",
        cols: { id: "编号", at: "报名时间 (UTC)", name: "姓名", wa: "WhatsApp", email: "邮箱", country: "国家", q: "问题", news: "资讯", src: "utm_source", lang: "语言" }
      },
      int: {
        title: "网站集成", intro: "新栏目与现有网站的连接位置。以下组件均为实时组件，随所选语言切换。",
        nav: "1 · 主导航——“在线讲座”位于博客旁", home: "2 · 首页——数据栏下方的细横幅", homeT: "免费直播讲座：{title}", homeD: "{date} · 喀布尔时间 {time}", homeBtn: "详情与参加",
        blog: "3 · 相关博客文章末尾", blogEyebrow: "直播讲座", urls: "4 · 网址结构", urlCols: ["页面", "英文", "波斯语 / 阿拉伯语 / 中文"], urlRows: ["讲座列表", "讲座详情页", "感谢页（noindex）"]
      }
    }
  }
};
