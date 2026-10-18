/* ==========================================================================
   UI STRINGS — "Become a Partner" section, 4 languages (en / fa / ar / zh)
   Production: merge into /assets/locales/{lang}.json
     - nav.becomePartner, footer.partnerWithUs -> existing "nav" / "footer" blocks
     - everything under "partners"             -> new top-level "partners" block
   Ready-to-merge JSON copies are in /locales/*.json (generated from this file).
   Arabic and Chinese copy needs review by a fluent speaker.
   ========================================================================== */
window.PARTNER_I18N = {
  en: {
    meta: { dir: "ltr", code: "EN", locale: "en-GB", name: "English", title: "Become a Partner | Sharif Group Dubai", description: "Partner with Sharif Group, Dubai: refer clients for second citizenship and residency by investment and work with a dedicated case team." },
    nav: { citizenship: "Citizenship", residency: "Residency", moreServices: "Other Services", aboutUs: "About Us", contact: "Contact Us", blog: "Blog", webinars: "Webinars", eligibilityChecker: "Eligibility Checker", bookConsultation: "Book Consultation", aboutSharif: "About | Sharif Group", aboutAli: "About | Ali Sharif", socialResp: "Social Responsibility", becomePartner: "Become a Partner" },
    footer: { partnerWithUs: "Partner With Us", quickLinks: "Quick Links", home: "Home", insightsBlog: "Insights & Blog", contactUs: "Contact Us", legalFrameworks: "Legal Frameworks", privacyPolicy: "Privacy Policy", termsOfUse: "Terms of Use", allRightsReserved: "© 2026 Sharif Group. All Rights Reserved.", address: "116, The Binary Tower, Business Bay, Dubai, United Arab Emirates", tagline: "Trusted private consultancy for second citizenship, residency, real estate and education — Business Bay, Dubai.", programmes: "Programmes" },
    partners: {
      common: { demoStrong: "Demo", demoText: "Preview for the web team — nothing is sent or saved outside this browser.", skip: "Skip to content", isNew: "New", required: "required", optional: "optional" },
      hero: { eyebrow: "Partnership Programme", title: "Become a <em>Partner</em>", sub: "SHARIF GROUP DUBAI", lede: "Work with a Dubai-based team with more than 10 years in citizenship and residency by investment. You introduce the client; we handle the file from start to finish and keep you informed.", apply: "Apply to partner", how: "How it works" },
      stats: [{ n: "10+", l: "Years of experience" }, { n: "1000+", l: "Successful CBI cases" }, { n: "100+", l: "Residency & education cases" }, { n: "450+", l: "Families relocated" }],
      who: { eyebrow: "Who can partner", title: "Built for <em>three kinds</em> of partners",
        items: [
          { k: "agency", t: "Immigration agencies & consultancies", d: "Offer your clients more programmes, backed by an experienced case team in Dubai." },
          { k: "firm", t: "Professional firms", d: "Law and accounting firms, real estate and travel agencies: add second citizenship and residency to the services you offer." },
          { k: "individual", t: "Individual introducers", d: "Know people looking for a second passport or residency? Introduce them and we take it from there." }
        ] },
      why: { eyebrow: "Why Sharif Group", title: "What you <em>get</em>",
        items: [
          { t: "Dedicated partner manager", d: "One contact person for all your referrals and questions." },
          { t: "End-to-end file handling", d: "Documents, background checks and government submission handled by our team." },
          { t: "Clear case updates", d: "You are kept informed at every stage, with your client's consent." },
          { t: "Training & partner webinars", d: "Regular briefings on programme changes, so you can advise with confidence." },
          { t: "Ready-to-use materials", d: "Programme overviews you can share with your clients." },
          { t: "Office in Business Bay, Dubai", d: "Meet our team in person whenever you or your clients are in Dubai." }
        ] },
      steps: { eyebrow: "How it works", title: "Four simple <em>steps</em>",
        items: [
          { t: "Apply", d: "Fill in the short form below. It takes about two minutes." },
          { t: "Introductory call", d: "We review your application and get to know your business." },
          { t: "Partnership agreement", d: "Terms and commission are agreed in a written agreement." },
          { t: "Refer clients", d: "Introduce clients. We manage the file and keep you updated." }
        ] },
      progs: { eyebrow: "Programmes", title: "What you can <em>offer</em>", cit: "Citizenship by investment", res: "Residency & golden visas", other: "Other services",
        citList: ["Dominica", "St. Kitts & Nevis", "Antigua & Barbuda", "Saint Lucia", "Grenada", "Vanuatu", "São Tomé and Príncipe", "Republic of Nauru"],
        resList: ["Portugal Golden Visa", "Greece Golden Visa", "Panama Qualified Investor", "UAE Golden Visa"],
        otherList: ["Dubai real estate", "Educational advisory"] },
      form: {
        eyebrow: "Apply", title: "Partnership <em>application</em>", sub: "Tell us a little about you. Our partnerships team will contact you after reviewing your application.",
        type: "I am applying as", types: { agency: "Immigration agency / consultancy", firm: "Professional firm", individual: "Individual introducer" },
        name: "Full name", company: "Company name", companyHint: "Not needed for individual introducers.", role: "Job title",
        country: "Country of operation", city: "City", wa: "WhatsApp number", email: "Email", web: "Website or LinkedIn",
        interest: "Programmes of interest", volume: "Clients you could refer per year", volumes: { v1: "1–5", v2: "6–20", v3: "21–50", v4: "More than 50", unsure: "Not sure yet" },
        source: "How did you hear about us?", sources: { referral: "Referral", linkedin: "LinkedIn", instagram: "Instagram", search: "Google search", event: "Event or webinar", other: "Other" },
        message: "Anything else we should know?", choose: "Select…",
        consent: "I agree that Sharif Group may contact me about this application.", submit: "Submit application", sending: "Sending…",
        privacy: "Your details are used only to review your application and contact you. They are never shared with anyone else.",
        errType: "Please choose how you are applying.", errName: "Please enter your full name.", errCompany: "Please enter your company name.", errCountry: "Please enter your country.", errPhone: "Please enter a valid WhatsApp number.", errEmail: "Please enter a valid email address.", errWeb: "Please enter a valid website or LinkedIn link.", errConsent: "Please confirm that we may contact you.", alert: "Please correct the highlighted fields."
      },
      note: { title: "Good to know", items: ["Joining is free. There is no fee to become a partner.", "Commission terms are shared after review, in a written agreement.", "Partners act as independent introducers. They may not present themselves as government-authorised agents or promise approvals, timelines or results.", "Every partner and referred client goes through our due-diligence checks."] },
      faq: { title: "Frequently asked questions",
        items: [
          { q: "Is there a cost to become a partner?", a: "No. Joining the partnership programme is free." },
          { q: "How does commission work?", a: "Commission terms are agreed in a written partnership agreement after we review your application." },
          { q: "Do I need a licence?", a: "It depends on your country and type of business. We review every application individually, and individual introducers are welcome." },
          { q: "Do I keep the relationship with my client?", a: "Yes. You stay in contact with your client and receive updates on the case, with the client's consent." },
          { q: "Which countries do you work with?", a: "We work with partners in many countries, subject to our due-diligence checks." }
        ] },
      thanks: { eyebrow: "Application received", title: "Thank you, {name}!", text: "We have received your partnership application. Here is what happens next.", already: "We already have an application with this email address. Our team will be in touch.", ref: "Reference",
        steps: [{ t: "Review", d: "Our partnerships team reviews your application." }, { t: "Introductory call", d: "We contact you on WhatsApp or by email to arrange a call." }, { t: "Agreement", d: "If it's a good fit, we share the partnership agreement and terms." }],
        back: "Back to partner page", home: "Go to homepage" },
      demo: { fab: "Demo controls", title: "Demo controls", intro: "Preview pages. These controls are not part of the production design.", pages: "Preview pages", page: "Partner page", thanks: "Thank-you page", admin: "Admin & applications", integration: "Site integration", reset: "Reset demo data", resetDone: "Demo data reset" },
      admin: { title: "Applications preview", intro: "How partner applications will look in the Google Sheet tab “Partner_Applications”.", warn: "Demo only: in production the data comes from the Google Sheet, behind the existing admin login.",
        kTotal: "Applications", kAgency: "Agencies", kFirm: "Professional firms", kInd: "Individuals", export: "Export CSV (Excel)", none: "No applications yet — submit the form on the partner page to see a row here.",
        cols: { id: "Reference", at: "Submitted (UTC)", type: "Type", name: "Name", company: "Company", country: "Country", wa: "WhatsApp", email: "Email", progs: "Programmes", vol: "Clients/yr" } },
      int: { title: "Site integration", intro: "Where the partner page connects to the existing website. All components below are live and follow the selected language.",
        nav: "1 · “About Us” menu — new last item", footer: "2 · Footer — Quick Links", home: "3 · Homepage — slim band above the footer",
        homeT: "Are you an agency, firm or introducer?", homeD: "Partner with Sharif Group and offer your clients second citizenship and residency.", homeBtn: "Become a Partner",
        urls: "4 · URL map", urlCols: ["Page", "English", "Persian / Arabic / Chinese"], urlRows: ["Partner page", "Thank-you page (noindex)"] }
    }
  },

  fa: {
    meta: { dir: "rtl", code: "FA", locale: "fa-IR", name: "فارسی", title: "همکاری با ما | شریف گروپ دبی", description: "با شریف گروپ دبی همکاری کنید: مشتریان خود را برای شهروندی دوم و اقامت از راه سرمایه‌گذاری معرفی کنید و با تیم پرونده اختصاصی ما کار کنید." },
    nav: { citizenship: "شهروندی", residency: "اقامت", moreServices: "سایر خدمات", aboutUs: "درباره ما", contact: "تماس با ما", blog: "بلاگ", webinars: "وبینارها", eligibilityChecker: "بررسی شرایط واجد بودن", bookConsultation: "رزرو مشاوره", aboutSharif: "درباره | شریف گروپ", aboutAli: "درباره | علی شریف", socialResp: "مسئولیت اجتماعی", becomePartner: "همکاری با ما" },
    footer: { partnerWithUs: "همکاری با ما", quickLinks: "لینک‌های سریع", home: "خانه", insightsBlog: "مقالات و دانستنی‌ها", contactUs: "تماس با ما", legalFrameworks: "چارچوب‌های قانونی", privacyPolicy: "سیاست حفظ حریم خصوصی", termsOfUse: "شرایط استفاده", allRightsReserved: "© 2026 شریف گروپ. تمامی حقوق محفوظ است.", address: "واحد ۱۱۶، برج باینری، بیزنس بی، دبی، امارات متحده عربی", tagline: "مشاوره خصوصی و مورد اعتماد در شهروندی دوم، اقامت، املاک و تحصیل — بیزنس بی، دبی.", programmes: "برنامه‌ها" },
    partners: {
      common: { demoStrong: "نسخه دمو", demoText: "پیش‌نمایش برای تیم وبسایت — هیچ اطلاعاتی بیرون از این مرورگر ارسال یا ذخیره نمی‌شود.", skip: "رفتن به محتوا", isNew: "جدید", required: "الزامی", optional: "اختیاری" },
      hero: { eyebrow: "برنامه همکاری", title: "شریک <em>ما شوید</em>", sub: "شریف گروپ دبی", lede: "با تیمی در دبی همکاری کنید که بیش از ۱۰ سال در شهروندی و اقامت از راه سرمایه‌گذاری تجربه دارد. شما مشتری را معرفی می‌کنید؛ ما پرونده را از ابتدا تا انتها پیش می‌بریم و شما را در جریان نگه می‌داریم.", apply: "درخواست همکاری", how: "روند همکاری" },
      stats: [{ n: "+۱۰", l: "سال تجربه" }, { n: "+۱۰۰۰", l: "پرونده موفق شهروندی" }, { n: "+۱۰۰", l: "پرونده اقامت و تحصیل" }, { n: "+۴۵۰", l: "خانواده مهاجرت‌کرده" }],
      who: { eyebrow: "چه کسانی می‌توانند شریک شوند", title: "برای <em>سه گروه</em> از همکاران",
        items: [
          { k: "agency", t: "آژانس‌ها و دفترهای مهاجرتی", d: "برنامه‌های بیشتری به مشتریانتان پیشنهاد دهید، با پشتیبانی یک تیم پرونده باتجربه در دبی." },
          { k: "firm", t: "شرکت‌های حرفه‌ای", d: "دفترهای وکالت و حسابداری، املاک و آژانس‌های مسافرتی: شهروندی دوم و اقامت را به خدمات خود اضافه کنید." },
          { k: "individual", t: "معرف‌های فردی", d: "کسی را می‌شناسید که دنبال پاسپورت دوم یا اقامت است؟ معرفی کنید، بقیه کار با ما." }
        ] },
      why: { eyebrow: "چرا شریف گروپ", title: "چه چیزی <em>دریافت می‌کنید</em>",
        items: [
          { t: "مدیر همکاری اختصاصی", d: "یک فرد مشخص برای همه معرفی‌ها و پرسش‌های شما." },
          { t: "پیگیری کامل پرونده", d: "مدارک، بررسی سوابق و ثبت نزد دولت توسط تیم ما انجام می‌شود." },
          { t: "گزارش روشن وضعیت پرونده", d: "در هر مرحله، با رضایت مشتری، در جریان قرار می‌گیرید." },
          { t: "آموزش و وبینار مخصوص همکاران", d: "جلسه‌های منظم درباره تغییرات برنامه‌ها تا با اطمینان مشاوره دهید." },
          { t: "فایل‌های آماده معرفی", d: "معرفی برنامه‌ها که می‌توانید برای مشتریانتان بفرستید." },
          { t: "دفتر در بیزنس بی دبی", d: "هر زمان شما یا مشتریانتان در دبی بودید، حضوری با تیم ما دیدار کنید." }
        ] },
      steps: { eyebrow: "روند همکاری", title: "چهار <em>قدم ساده</em>",
        items: [
          { t: "درخواست", d: "فرم کوتاه پایین صفحه را پر کنید؛ حدود دو دقیقه طول می‌کشد." },
          { t: "جلسه آشنایی", d: "درخواست شما را بررسی می‌کنیم و با کسب‌وکارتان آشنا می‌شویم." },
          { t: "قرارداد همکاری", d: "شرایط و کمیسیون در یک قرارداد کتبی توافق می‌شود." },
          { t: "معرفی مشتری", d: "مشتری معرفی کنید؛ ما پرونده را پیش می‌بریم و شما را در جریان می‌گذاریم." }
        ] },
      progs: { eyebrow: "برنامه‌ها", title: "چه چیزی می‌توانید <em>پیشنهاد دهید</em>", cit: "شهروندی از راه سرمایه‌گذاری", res: "اقامت و ویزای طلایی", other: "سایر خدمات",
        citList: ["دومینیکا", "سنت کیتس و نویس", "آنتیگوا و باربودا", "سنت لوسیا", "گرانادا", "وانواتو", "سائوتومه و پرنسیپ", "جمهوری نائورو"],
        resList: ["ویزای طلایی پرتغال", "ویزای طلایی یونان", "اقامت سرمایه‌گذار پاناما", "ویزای طلایی امارات"],
        otherList: ["املاک دبی", "مشاوره تحصیلی"] },
      form: {
        eyebrow: "درخواست", title: "فرم <em>درخواست همکاری</em>", sub: "کمی درباره خودتان بگویید. تیم همکاری‌های ما پس از بررسی درخواست با شما تماس می‌گیرد.",
        type: "درخواست من به‌عنوان", types: { agency: "آژانس / دفتر مهاجرتی", firm: "شرکت حرفه‌ای", individual: "معرف فردی" },
        name: "نام و نام خانوادگی", company: "نام شرکت", companyHint: "برای معرف‌های فردی لازم نیست.", role: "سمت",
        country: "کشور محل فعالیت", city: "شهر", wa: "شماره واتس‌اپ", email: "ایمیل", web: "وبسایت یا لینکدین",
        interest: "برنامه‌های مورد علاقه", volume: "تعداد مشتری که در سال می‌توانید معرفی کنید", volumes: { v1: "۱ تا ۵", v2: "۶ تا ۲۰", v3: "۲۱ تا ۵۰", v4: "بیش از ۵۰", unsure: "هنوز مطمئن نیستم" },
        source: "از کجا با ما آشنا شدید؟", sources: { referral: "معرفی دیگران", linkedin: "لینکدین", instagram: "اینستاگرام", search: "جستجوی گوگل", event: "رویداد یا وبینار", other: "سایر" },
        message: "نکته دیگری که باید بدانیم؟", choose: "انتخاب کنید…",
        consent: "موافقم شریف گروپ درباره این درخواست با من تماس بگیرد.", submit: "ارسال درخواست", sending: "در حال ارسال…",
        privacy: "اطلاعات شما فقط برای بررسی درخواست و تماس با شما استفاده می‌شود و در اختیار شخص دیگری قرار نمی‌گیرد.",
        errType: "لطفاً نوع همکاری را انتخاب کنید.", errName: "لطفاً نام و نام خانوادگی را بنویسید.", errCompany: "لطفاً نام شرکت را بنویسید.", errCountry: "لطفاً کشور را بنویسید.", errPhone: "لطفاً شماره واتس‌اپ درست وارد کنید.", errEmail: "لطفاً ایمیل درست وارد کنید.", errWeb: "لطفاً آدرس وبسایت یا لینکدین درست وارد کنید.", errConsent: "لطفاً اجازه تماس را تأیید کنید.", alert: "لطفاً موارد مشخص‌شده را اصلاح کنید."
      },
      note: { title: "بهتر است بدانید", items: ["همکاری رایگان است و هزینه‌ای برای عضویت ندارد.", "شرایط کمیسیون پس از بررسی و در یک قرارداد کتبی اعلام می‌شود.", "همکاران به‌عنوان معرف مستقل فعالیت می‌کنند و نباید خود را نماینده رسمی دولت‌ها معرفی کنند یا وعده تأیید، زمان یا نتیجه بدهند.", "همه همکاران و مشتریان معرفی‌شده بررسی‌های لازم (Due Diligence) را می‌گذرانند."] },
      faq: { title: "پرسش‌های متداول",
        items: [
          { q: "همکاری هزینه‌ای دارد؟", a: "خیر. عضویت در برنامه همکاری رایگان است." },
          { q: "کمیسیون چطور محاسبه می‌شود؟", a: "شرایط کمیسیون پس از بررسی درخواست، در قرارداد کتبی همکاری توافق می‌شود." },
          { q: "آیا مجوز لازم دارم؟", a: "بستگی به کشور و نوع فعالیت شما دارد. هر درخواست جداگانه بررسی می‌شود و معرف‌های فردی هم می‌توانند درخواست بدهند." },
          { q: "ارتباطم با مشتری حفظ می‌شود؟", a: "بله. ارتباط شما با مشتری می‌ماند و با رضایت او از وضعیت پرونده باخبر می‌شوید." },
          { q: "با چه کشورهایی کار می‌کنید؟", a: "با همکارانی از کشورهای مختلف کار می‌کنیم، به شرط گذراندن بررسی‌های لازم." }
        ] },
      thanks: { eyebrow: "درخواست دریافت شد", title: "{name} عزیز، تشکر!", text: "درخواست همکاری شما به دست ما رسید. مراحل بعدی این است:", already: "درخواستی با این ایمیل قبلاً ثبت شده است. تیم ما با شما تماس می‌گیرد.", ref: "کد پیگیری",
        steps: [{ t: "بررسی", d: "تیم همکاری‌ها درخواست شما را بررسی می‌کند." }, { t: "جلسه آشنایی", d: "از راه واتس‌اپ یا ایمیل برای تعیین جلسه با شما تماس می‌گیریم." }, { t: "قرارداد", d: "در صورت تناسب، قرارداد و شرایط همکاری را برایتان می‌فرستیم." }],
        back: "بازگشت به صفحه همکاری", home: "رفتن به صفحه اصلی" },
      demo: { fab: "کنترل دمو", title: "کنترل‌های دمو", intro: "پیش‌نمایش صفحه‌ها. این کنترل‌ها جزو طراحی نهایی نیستند.", pages: "صفحه‌ها", page: "صفحه همکاری", thanks: "صفحه تشکر", admin: "مدیریت و درخواست‌ها", integration: "اتصال به سایت", reset: "پاک کردن داده‌های دمو", resetDone: "داده‌های دمو پاک شد" },
      admin: { title: "پیش‌نمایش درخواست‌ها", intro: "شکل درخواست‌های همکاری در تب «Partner_Applications» گوگل‌شیت.", warn: "فقط دمو: در نسخه نهایی داده‌ها از گوگل‌شیت و پشت ورود پنل مدیریت فعلی است.",
        kTotal: "درخواست", kAgency: "آژانس", kFirm: "شرکت حرفه‌ای", kInd: "معرف فردی", export: "خروجی CSV (اکسل)", none: "هنوز درخواستی نیست — فرم صفحه همکاری را پر کنید تا ردیف آن این‌جا دیده شود.",
        cols: { id: "کد", at: "زمان ثبت (UTC)", type: "نوع", name: "نام", company: "شرکت", country: "کشور", wa: "واتس‌اپ", email: "ایمیل", progs: "برنامه‌ها", vol: "مشتری در سال" } },
      int: { title: "اتصال به سایت", intro: "جاهایی که صفحه همکاری به وبسایت فعلی وصل می‌شود. همه اجزای زیر زنده‌اند و با زبان انتخاب‌شده تغییر می‌کنند.",
        nav: "۱ · منوی «درباره ما» — آیتم آخر", footer: "۲ · فوتر — لینک‌های سریع", home: "۳ · صفحه اصلی — نوار باریک بالای فوتر",
        homeT: "آژانس، شرکت یا معرف هستید؟", homeD: "با شریف گروپ همکاری کنید و شهروندی دوم و اقامت را به مشتریانتان پیشنهاد دهید.", homeBtn: "همکاری با ما",
        urls: "۴ · نقشه آدرس‌ها", urlCols: ["صفحه", "انگلیسی", "فارسی / عربی / چینی"], urlRows: ["صفحه همکاری", "صفحه تشکر (noindex)"] }
    }
  },

  ar: {
    meta: { dir: "rtl", code: "AR", locale: "ar-AE", name: "العربية", title: "كن شريكاً | مجموعة شريف دبي", description: "كن شريكاً لمجموعة شريف في دبي: أحِل عملاءك للجنسية الثانية والإقامة عن طريق الاستثمار واعمل مع فريق ملفات مخصص." },
    nav: { citizenship: "الجنسية", residency: "الإقامة", moreServices: "خدمات أخرى", aboutUs: "من نحن", contact: "اتصل بنا", blog: "المدونة", webinars: "الندوات", eligibilityChecker: "التحقق من الأهلية", bookConsultation: "حجز استشارة", aboutSharif: "عن | مجموعة شريف", aboutAli: "عن | علي شريف", socialResp: "المسؤولية الاجتماعية", becomePartner: "كن شريكاً" },
    footer: { partnerWithUs: "شاركنا", quickLinks: "روابط سريعة", home: "الرئيسية", insightsBlog: "المقالات والمدونة", contactUs: "اتصل بنا", legalFrameworks: "الأطر القانونية", privacyPolicy: "سياسة الخصوصية", termsOfUse: "شروط الاستخدام", allRightsReserved: "© 2026 مجموعة شريف. جميع الحقوق محفوظة.", address: "116، برج باينري، الخليج التجاري، دبي، الإمارات العربية المتحدة", tagline: "استشارات خاصة موثوقة في الجنسية الثانية والإقامة والعقارات والتعليم — الخليج التجاري، دبي.", programmes: "البرامج" },
    partners: {
      common: { demoStrong: "نسخة تجريبية", demoText: "معاينة لفريق الموقع — لا يتم إرسال أو حفظ أي بيانات خارج هذا المتصفح.", skip: "انتقل إلى المحتوى", isNew: "جديد", required: "مطلوب", optional: "اختياري" },
      hero: { eyebrow: "برنامج الشراكة", title: "كن <em>شريكاً</em>", sub: "مجموعة شريف دبي", lede: "اعمل مع فريق في دبي يتمتع بأكثر من 10 سنوات من الخبرة في الجنسية والإقامة عن طريق الاستثمار. أنت تُعرّفنا بالعميل، ونحن ندير الملف من البداية إلى النهاية ونبقيك على اطلاع.", apply: "قدّم طلب الشراكة", how: "كيف تعمل الشراكة" },
      stats: [{ n: "+10", l: "سنوات من الخبرة" }, { n: "+1000", l: "ملف جنسية ناجح" }, { n: "+100", l: "ملف إقامة وتعليم" }, { n: "+450", l: "عائلة انتقلت" }],
      who: { eyebrow: "من يمكنه الشراكة", title: "مصمم <em>لثلاث فئات</em> من الشركاء",
        items: [
          { k: "agency", t: "وكالات ومكاتب الهجرة", d: "قدّم لعملائك برامج أكثر بدعم من فريق ملفات ذي خبرة في دبي." },
          { k: "firm", t: "الشركات المهنية", d: "مكاتب المحاماة والمحاسبة ووكالات العقارات والسفر: أضف الجنسية الثانية والإقامة إلى خدماتك." },
          { k: "individual", t: "المُعرّفون الأفراد", d: "تعرف أشخاصاً يبحثون عن جواز سفر ثانٍ أو إقامة؟ عرّفنا بهم ونحن نتولى الباقي." }
        ] },
      why: { eyebrow: "لماذا مجموعة شريف", title: "ما الذي <em>تحصل عليه</em>",
        items: [
          { t: "مدير شراكة مخصص", d: "جهة اتصال واحدة لجميع إحالاتك وأسئلتك." },
          { t: "إدارة كاملة للملف", d: "المستندات والتحقق من الخلفية والتقديم الحكومي يتولاها فريقنا." },
          { t: "تحديثات واضحة للملف", d: "نبقيك على اطلاع في كل مرحلة، بموافقة عميلك." },
          { t: "تدريب وندوات للشركاء", d: "جلسات منتظمة حول تغييرات البرامج لتقدّم المشورة بثقة." },
          { t: "مواد جاهزة للاستخدام", d: "نبذات عن البرامج يمكنك مشاركتها مع عملائك." },
          { t: "مكتب في الخليج التجاري، دبي", d: "التقِ بفريقنا شخصياً متى كنت أنت أو عملاؤك في دبي." }
        ] },
      steps: { eyebrow: "كيف تعمل الشراكة", title: "أربع <em>خطوات بسيطة</em>",
        items: [
          { t: "قدّم الطلب", d: "املأ النموذج القصير أدناه، ويستغرق نحو دقيقتين." },
          { t: "مكالمة تعارف", d: "نراجع طلبك ونتعرّف على نشاطك." },
          { t: "اتفاقية الشراكة", d: "يُتفق على الشروط والعمولة في اتفاقية مكتوبة." },
          { t: "أحِل العملاء", d: "عرّفنا بالعملاء، ونحن ندير الملف ونبقيك على اطلاع." }
        ] },
      progs: { eyebrow: "البرامج", title: "ما الذي يمكنك <em>تقديمه</em>", cit: "الجنسية عن طريق الاستثمار", res: "الإقامة والتأشيرات الذهبية", other: "خدمات أخرى",
        citList: ["دومينيكا", "سانت كيتس ونيفيس", "أنتيغوا وبربودا", "سانت لوسيا", "غرينادا", "فانواتو", "ساو تومي وبرينسيب", "جمهورية ناورو"],
        resList: ["التأشيرة الذهبية للبرتغال", "التأشيرة الذهبية لليونان", "المستثمر المؤهل في بنما", "التأشيرة الذهبية للإمارات"],
        otherList: ["عقارات دبي", "الاستشارات التعليمية"] },
      form: {
        eyebrow: "قدّم الطلب", title: "طلب <em>الشراكة</em>", sub: "أخبرنا قليلاً عنك. سيتواصل معك فريق الشراكات بعد مراجعة طلبك.",
        type: "أتقدّم بصفتي", types: { agency: "وكالة / مكتب هجرة", firm: "شركة مهنية", individual: "مُعرّف فردي" },
        name: "الاسم الكامل", company: "اسم الشركة", companyHint: "غير مطلوب للمُعرّفين الأفراد.", role: "المسمى الوظيفي",
        country: "بلد النشاط", city: "المدينة", wa: "رقم واتساب", email: "البريد الإلكتروني", web: "الموقع الإلكتروني أو لينكدإن",
        interest: "البرامج التي تهمك", volume: "عدد العملاء الذين يمكنك إحالتهم سنوياً", volumes: { v1: "1–5", v2: "6–20", v3: "21–50", v4: "أكثر من 50", unsure: "غير متأكد بعد" },
        source: "كيف عرفت عنا؟", sources: { referral: "توصية", linkedin: "لينكدإن", instagram: "إنستغرام", search: "بحث جوجل", event: "فعالية أو ندوة", other: "أخرى" },
        message: "هل هناك شيء آخر يجب أن نعرفه؟", choose: "اختر…",
        consent: "أوافق على أن تتواصل معي مجموعة شريف بخصوص هذا الطلب.", submit: "إرسال الطلب", sending: "جارٍ الإرسال…",
        privacy: "تُستخدم بياناتك فقط لمراجعة طلبك والتواصل معك، ولا تُشارك مع أي طرف آخر.",
        errType: "يرجى اختيار صفة التقديم.", errName: "يرجى إدخال الاسم الكامل.", errCompany: "يرجى إدخال اسم الشركة.", errCountry: "يرجى إدخال البلد.", errPhone: "يرجى إدخال رقم واتساب صحيح.", errEmail: "يرجى إدخال بريد إلكتروني صحيح.", errWeb: "يرجى إدخال رابط موقع أو لينكدإن صحيح.", errConsent: "يرجى تأكيد الموافقة على التواصل.", alert: "يرجى تصحيح الحقول المحددة."
      },
      note: { title: "معلومات مهمة", items: ["الانضمام مجاني ولا توجد رسوم للشراكة.", "تُقدَّم شروط العمولة بعد المراجعة في اتفاقية مكتوبة.", "يعمل الشركاء كمُعرّفين مستقلين، ولا يجوز لهم تقديم أنفسهم كوكلاء معتمدين من الحكومات أو التعهد بالموافقات أو المدد أو النتائج.", "يخضع كل شريك وكل عميل محال لإجراءات العناية الواجبة لدينا."] },
      faq: { title: "الأسئلة الشائعة",
        items: [
          { q: "هل هناك تكلفة للانضمام كشريك؟", a: "لا. الانضمام إلى برنامج الشراكة مجاني." },
          { q: "كيف تعمل العمولة؟", a: "يُتفق على شروط العمولة في اتفاقية شراكة مكتوبة بعد مراجعة طلبك." },
          { q: "هل أحتاج إلى ترخيص؟", a: "يعتمد ذلك على بلدك ونوع نشاطك. نراجع كل طلب على حدة، ونرحّب بالمُعرّفين الأفراد." },
          { q: "هل أحافظ على علاقتي بعميلي؟", a: "نعم. تبقى على تواصل مع عميلك وتتلقى تحديثات الملف بموافقته." },
          { q: "مع أي دول تعملون؟", a: "نعمل مع شركاء في دول عديدة، رهناً بإجراءات العناية الواجبة لدينا." }
        ] },
      thanks: { eyebrow: "تم استلام الطلب", title: "شكراً لك، {name}!", text: "استلمنا طلب الشراكة الخاص بك. إليك الخطوات التالية.", already: "لدينا طلب مسجّل بهذا البريد الإلكتروني. سيتواصل معك فريقنا.", ref: "رقم المرجع",
        steps: [{ t: "المراجعة", d: "يراجع فريق الشراكات طلبك." }, { t: "مكالمة تعارف", d: "نتواصل معك عبر واتساب أو البريد لترتيب مكالمة." }, { t: "الاتفاقية", d: "إذا كان هناك توافق، نرسل لك اتفاقية الشراكة وشروطها." }],
        back: "العودة إلى صفحة الشراكة", home: "الصفحة الرئيسية" },
      demo: { fab: "تحكم العرض", title: "أدوات التحكم التجريبية", intro: "معاينة الصفحات. هذه الأدوات ليست جزءاً من التصميم النهائي.", pages: "صفحات المعاينة", page: "صفحة الشراكة", thanks: "صفحة الشكر", admin: "الإدارة والطلبات", integration: "الربط بالموقع", reset: "إعادة ضبط بيانات العرض", resetDone: "تمت إعادة الضبط" },
      admin: { title: "معاينة الطلبات", intro: "شكل طلبات الشراكة في تبويب «Partner_Applications» في Google Sheet.", warn: "للعرض فقط: في النسخة النهائية تأتي البيانات من Google Sheet خلف تسجيل دخول الإدارة الحالي.",
        kTotal: "الطلبات", kAgency: "وكالات", kFirm: "شركات مهنية", kInd: "أفراد", export: "تصدير CSV (Excel)", none: "لا توجد طلبات بعد — املأ النموذج في صفحة الشراكة لترى صفاً هنا.",
        cols: { id: "المرجع", at: "وقت الإرسال (UTC)", type: "النوع", name: "الاسم", company: "الشركة", country: "البلد", wa: "واتساب", email: "البريد", progs: "البرامج", vol: "عملاء/سنة" } },
      int: { title: "الربط بالموقع", intro: "أماكن ربط صفحة الشراكة بالموقع الحالي. جميع المكونات أدناه حيّة وتتبع اللغة المختارة.",
        nav: "1 · قائمة «من نحن» — عنصر أخير جديد", footer: "2 · التذييل — روابط سريعة", home: "3 · الصفحة الرئيسية — شريط رفيع فوق التذييل",
        homeT: "هل أنت وكالة أو شركة أو مُعرّف؟", homeD: "كن شريكاً لمجموعة شريف وقدّم لعملائك الجنسية الثانية والإقامة.", homeBtn: "كن شريكاً",
        urls: "4 · خريطة الروابط", urlCols: ["الصفحة", "الإنجليزية", "الفارسية / العربية / الصينية"], urlRows: ["صفحة الشراكة", "صفحة الشكر (noindex)"] }
    }
  },

  zh: {
    meta: { dir: "ltr", code: "中文", locale: "zh-CN", name: "中文", title: "成为合作伙伴 | 谢里夫集团迪拜", description: "成为谢里夫集团（迪拜）的合作伙伴：推荐客户办理投资入籍与居留，与专属案件团队合作。" },
    nav: { citizenship: "公民身份", residency: "居留", moreServices: "其他服务", aboutUs: "关于我们", contact: "联系我们", blog: "博客", webinars: "在线讲座", eligibilityChecker: "资格检查", bookConsultation: "预约咨询", aboutSharif: "关于 | 谢里夫集团", aboutAli: "关于 | 阿里·谢里夫", socialResp: "社会责任", becomePartner: "成为合作伙伴" },
    footer: { partnerWithUs: "合作伙伴计划", quickLinks: "快速链接", home: "首页", insightsBlog: "行业洞察与博客", contactUs: "联系我们", legalFrameworks: "法律框架", privacyPolicy: "隐私政策", termsOfUse: "使用条款", allRightsReserved: "© 2026 谢里夫集团。保留所有权利。", address: "阿拉伯联合酋长国 迪拜 商业湾 双子塔 116室", tagline: "值得信赖的私人顾问：第二国籍、居留、房产与教育——迪拜商业湾。", programmes: "项目" },
    partners: {
      common: { demoStrong: "演示版", demoText: "供网站团队预览——任何数据都不会发送或保存到本浏览器之外。", skip: "跳到内容", isNew: "新", required: "必填", optional: "选填" },
      hero: { eyebrow: "合作伙伴计划", title: "成为<em>合作伙伴</em>", sub: "谢里夫集团 · 迪拜", lede: "与在投资入籍和居留领域拥有十余年经验的迪拜团队合作。您介绍客户，我们从头到尾办理案件，并随时向您通报进展。", apply: "申请合作", how: "合作流程" },
      stats: [{ n: "10+", l: "年经验" }, { n: "1000+", l: "成功入籍案例" }, { n: "100+", l: "居留与教育案例" }, { n: "450+", l: "移居家庭" }],
      who: { eyebrow: "谁可以合作", title: "面向<em>三类</em>合作伙伴",
        items: [
          { k: "agency", t: "移民中介与咨询机构", d: "依托迪拜经验丰富的案件团队，为客户提供更多项目选择。" },
          { k: "firm", t: "专业服务机构", d: "律师事务所、会计师事务所、房产及旅行社：将第二国籍和居留纳入您的服务。" },
          { k: "individual", t: "个人推荐人", d: "认识想办理第二护照或居留的人？介绍给我们，其余交给我们。" }
        ] },
      why: { eyebrow: "为何选择谢里夫集团", title: "您将<em>获得</em>",
        items: [
          { t: "专属合作经理", d: "一位固定联系人，负责您所有的推荐和问题。" },
          { t: "全程案件办理", d: "文件准备、背景审查及政府递交均由我们团队完成。" },
          { t: "清晰的案件进展", d: "在客户同意的前提下，每个阶段都会通知您。" },
          { t: "培训与合作伙伴讲座", d: "定期讲解项目变化，让您更有把握地为客户提供建议。" },
          { t: "现成的介绍资料", d: "可直接分享给客户的项目简介。" },
          { t: "迪拜商业湾办公室", d: "您或您的客户来迪拜时，可随时与我们团队面谈。" }
        ] },
      steps: { eyebrow: "合作流程", title: "简单<em>四步</em>",
        items: [
          { t: "提交申请", d: "填写下方简短表格，约需两分钟。" },
          { t: "初步沟通", d: "我们审核您的申请并了解您的业务。" },
          { t: "签订合作协议", d: "条款与佣金以书面协议约定。" },
          { t: "推荐客户", d: "介绍客户，我们办理案件并及时更新进展。" }
        ] },
      progs: { eyebrow: "项目", title: "您可以<em>提供</em>的项目", cit: "投资入籍", res: "居留与黄金签证", other: "其他服务",
        citList: ["多米尼克", "圣基茨和尼维斯", "安提瓜和巴布达", "圣卢西亚", "格林纳达", "瓦努阿图", "圣多美和普林西比", "瑙鲁共和国"],
        resList: ["葡萄牙黄金签证", "希腊黄金签证", "巴拿马合格投资者", "阿联酋黄金签证"],
        otherList: ["迪拜房产", "教育咨询"] },
      form: {
        eyebrow: "申请", title: "合作<em>申请表</em>", sub: "请简单介绍一下您自己。合作团队审核申请后将与您联系。",
        type: "我的申请身份", types: { agency: "移民中介 / 咨询机构", firm: "专业服务机构", individual: "个人推荐人" },
        name: "姓名", company: "公司名称", companyHint: "个人推荐人无需填写。", role: "职位",
        country: "业务所在国家", city: "城市", wa: "WhatsApp 号码", email: "电子邮箱", web: "网站或 LinkedIn",
        interest: "感兴趣的项目", volume: "每年可推荐的客户数量", volumes: { v1: "1–5", v2: "6–20", v3: "21–50", v4: "50 以上", unsure: "暂不确定" },
        source: "您是如何了解我们的？", sources: { referral: "他人推荐", linkedin: "LinkedIn", instagram: "Instagram", search: "Google 搜索", event: "活动或讲座", other: "其他" },
        message: "还有其他需要我们了解的吗？", choose: "请选择…",
        consent: "我同意谢里夫集团就本申请与我联系。", submit: "提交申请", sending: "正在提交…",
        privacy: "您的信息仅用于审核申请并与您联系，绝不会提供给任何第三方。",
        errType: "请选择申请身份。", errName: "请输入姓名。", errCompany: "请输入公司名称。", errCountry: "请输入国家。", errPhone: "请输入有效的 WhatsApp 号码。", errEmail: "请输入有效的邮箱地址。", errWeb: "请输入有效的网站或 LinkedIn 链接。", errConsent: "请确认同意我们与您联系。", alert: "请修改标出的字段。"
      },
      note: { title: "须知", items: ["加入免费，成为合作伙伴无需任何费用。", "佣金条款在审核后以书面协议形式提供。", "合作伙伴以独立推荐人身份开展合作，不得自称政府授权代理，也不得承诺审批结果、时间或成效。", "所有合作伙伴及被推荐客户均须通过我们的尽职调查。"] },
      faq: { title: "常见问题",
        items: [
          { q: "成为合作伙伴需要付费吗？", a: "不需要。加入合作伙伴计划完全免费。" },
          { q: "佣金如何计算？", a: "审核申请后，佣金条款将在书面合作协议中约定。" },
          { q: "需要执照吗？", a: "取决于您所在国家和业务类型。我们会逐一审核申请，也欢迎个人推荐人申请。" },
          { q: "我能保持与客户的联系吗？", a: "可以。您与客户保持联系，并在客户同意下获得案件进展。" },
          { q: "你们与哪些国家合作？", a: "我们与多个国家的合作伙伴合作，前提是通过我们的尽职调查。" }
        ] },
      thanks: { eyebrow: "已收到申请", title: "谢谢您，{name}！", text: "我们已收到您的合作申请。接下来的流程如下。", already: "该邮箱已提交过申请，我们的团队会与您联系。", ref: "申请编号",
        steps: [{ t: "审核", d: "合作团队审核您的申请。" }, { t: "初步沟通", d: "我们通过 WhatsApp 或邮件与您约定沟通时间。" }, { t: "协议", d: "如双方契合，我们将发送合作协议及条款。" }],
        back: "返回合作页面", home: "前往首页" },
      demo: { fab: "演示控制", title: "演示控制", intro: "预览页面。这些控件不属于正式设计。", pages: "预览页面", page: "合作页面", thanks: "感谢页面", admin: "后台与申请", integration: "网站集成", reset: "重置演示数据", resetDone: "演示数据已重置" },
      admin: { title: "申请预览", intro: "合作申请在 Google 表格“Partner_Applications”标签页中的样式。", warn: "仅供演示：正式版数据来自 Google 表格，位于现有后台登录之后。",
        kTotal: "申请数", kAgency: "中介机构", kFirm: "专业机构", kInd: "个人", export: "导出 CSV（Excel）", none: "暂无申请——在合作页面提交表单后，此处将显示记录。",
        cols: { id: "编号", at: "提交时间 (UTC)", type: "类型", name: "姓名", company: "公司", country: "国家", wa: "WhatsApp", email: "邮箱", progs: "项目", vol: "每年客户" } },
      int: { title: "网站集成", intro: "合作页面与现有网站的连接位置。以下组件均为实时组件，随所选语言切换。",
        nav: "1 · “关于我们”菜单——新增最后一项", footer: "2 · 页脚——快速链接", home: "3 · 首页——页脚上方的细横幅",
        homeT: "您是中介、专业机构还是推荐人？", homeD: "成为谢里夫集团的合作伙伴，为您的客户提供第二国籍与居留方案。", homeBtn: "成为合作伙伴",
        urls: "4 · 网址结构", urlCols: ["页面", "英文", "波斯语 / 阿拉伯语 / 中文"], urlRows: ["合作页面", "感谢页（noindex）"] }
    }
  }
};
