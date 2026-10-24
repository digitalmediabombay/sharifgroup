/* ==========================================================================
   Sharif Group — Webinars section · interactive demo (v3)
   Vanilla JS, no dependencies, works from file:// or any static host.
   Site rules: no recordings/archive on the site, never show the meeting platform
   name or the raw meeting URL as text.
   DEMO ONLY: registrations are stored in this browser (localStorage) and the
   payload is printed to the console in the same shape the live site's
   forms.js sends to the CRM webhook. Nothing leaves the browser.
   ========================================================================== */
(() => {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const DEMO = urlParams.get('demo') === '1';
  const CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyO6vUrWreO-zeAj1gfmWTish9ntgeYOaUthNSmFRAFfdG6trRgoLjmo1JN-Z57_hdK/exec";
  const LANGS = ['fa', 'en', 'ar', 'zh'];
  const SITE = window.location.protocol === 'file:' ? 'https://www.sharifgroup.ae/' : '/';
  const TZ = { kabul: 'Asia/Kabul', dubai: 'Asia/Dubai', istanbul: 'Europe/Istanbul' };
  const DIAL = [
    ['+93', 'AF'], ['+971', 'AE'], ['+90', 'TR'], ['+98', 'IR'], ['+92', 'PK'], ['+966', 'SA'],
    ['+974', 'QA'], ['+968', 'OM'], ['+49', 'DE'], ['+44', 'GB'], ['+1', 'US/CA'], ['+61', 'AU'], ['+86', 'CN']
  ];
  const PHONE_RULES = { '+93': /^7\d{8}$/, '+971': /^5\d{8}$/, '+90': /^5\d{9}$/, '+98': /^9\d{9}$/ };

  const I18N = window.WEBINAR_I18N;
  const BASE = window.SGCMS_WEBINARS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- safe storage ---------- */
  const mem = {};
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  };
  const K = { lang: 'sgw.lang', demo: 'sgw.demo', edits: 'sgw.edits', regs: 'sgw.registrations', last: 'sgw.last' };

  /* ---------- language ---------- */
  const pathParts = window.location.pathname.replace(/^\/+/, '').split('/');
  const pathLang = LANGS.includes(pathParts[0]) ? pathParts[0] : null;
  const urlLang = urlParams.get('lang');
  let lang = pathLang || (LANGS.includes(urlLang) ? urlLang : 'en');
  const L = () => I18N[lang];
  const W = () => I18N[lang].webinars;
  function t(path, vars) {
    let v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), W());
    if (v == null) v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), I18N.en.webinars);
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    return v;
  }
  const loc = () => ({ fa: 'fa-AF', ar: 'ar-AE', zh: 'zh-CN', en: 'en-GB' }[lang]);
  const n = x => new Intl.NumberFormat(loc()).format(x);
  const pad2 = x => new Intl.NumberFormat(loc(), { minimumIntegerDigits: 2 }).format(x);
  const prefix = () => (lang === 'en' ? '' : lang + '/');

  /* ---------- dates ---------- */
  const dLong = (d, tz) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-AF-u-ca-gregory' : loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(d);
  const dShort = (d, tz) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-AF-u-ca-gregory' : loc(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(d);
  const dSolar = (d, tz) => new Intl.DateTimeFormat('fa-AF-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(d);
  const tm = (d, tz) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-AF' : loc(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(d);
  const dayNum = (d, tz) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-AF-u-ca-gregory' : loc(), { day: 'numeric', timeZone: tz }).format(d);
  const monthName = (d, tz) => new Intl.DateTimeFormat(lang === 'fa' ? 'fa-AF-u-ca-gregory' : loc(), { month: 'long', timeZone: tz }).format(d);
  const userTZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } })();

  /* ---------- icons ---------- */
  const I = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    arrow: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    crumb: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 6l6 6-6 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    passport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
  };
  const isFile = window.location.protocol === 'file:';
  const ROOT_PATH = isFile ? (window.location.pathname.includes('/webinars') ? '../' : '') : '/';
  const LOGO = isFile ? (window.location.pathname.includes('/webinars') ? '../assets/images/logo.svg' : 'assets/images/logo.svg') : '/assets/images/logo.svg';
  const FOOTER_LOGO = ROOT_PATH + 'assets/images/vector_2d09c4bb.svg';
  const IMC_LOGO = ROOT_PATH + 'imclogo.webp';
  const FOOTER_VIDEO = ROOT_PATH + 'assets/videos/footer_bg_e58bba71.mp4';
  const imgRel = path => (window.location.protocol === 'file:' ? 'assets/images/' : '/assets/images/') + path;

  /* ---------- data (CMS + admin edits + demo state) ---------- */
  const demoDefaults = { status: 'upcoming', visibility: 'public', link: 'soon' };
  const SAMPLE_URL = 'https://meet.example/sharif-WEB01';
  let demo = Object.assign({}, demoDefaults, store.get(K.demo, {}));

  // Clean up any stale partial draft in localStorage so official sessions are never truncated
  try {
    const rawOld = localStorage.getItem('sgcms_webinars');
    if (rawOld) {
      const pOld = JSON.parse(rawOld);
      if (!Array.isArray(pOld) || pOld.length < 3 || !pOld[0].en || !pOld[0].en.title) {
        localStorage.removeItem('sgcms_webinars');
        localStorage.removeItem('sgcms_webinars_live');
      }
    }
  } catch(e) {}

  const BASELINE_SESSIONS = [
    {
      id: "WEB01",
      slug: "dominica-second-passport-for-afghans",
      series: "dominica-pilot",
      session_no: 1,
      category: "Citizenship",
      start_utc: "2026-10-29T15:30:00Z",
      duration_min: 65,
      event_status: "upcoming",
      registration_open: true,
      join_visibility: "public",
      join_url: "",
      en: {
        title: "A Second Passport for Afghans: Introducing the Dominica Programme",
        excerpt: "A free online session in Persian (Dari): what Dominica's citizenship programme is, why it matters for Afghans and who can apply."
      },
      fa: {
        title: "پاسپورت دوم برای افغان‌ها: آشنایی با برنامه دومینیکا",
        excerpt: "جلسه آنلاین و رایگان به فارسی (دری): برنامه شهروندی دومینیکا چیست، چرا برای افغان‌ها مهم است و چه کسانی می‌توانند درخواست بدهند."
      },
      ar: {
        title: "جواز سفر ثانٍ للأفغان: التعريف ببرنامج دومينيكا",
        excerpt: "جلسة مجانية عبر الإنترنت باللغة الفارسية (الدرية): ما هو برنامج جنسية دومينیکا، ولماذا يهم الأفغان، ومن يحق له التقديم."
      },
      zh: {
        title: "阿富汗人的第二本护照：多米尼克入籍项目介绍",
        excerpt: "免费在线讲座（波斯语／达利语）：多米尼克投资入籍项目是什么、为何对阿富汗人重要、哪些人可以申请。"
      }
    },
    {
      id: "WEB02",
      slug: "dominica-from-decision-to-passport",
      series: "dominica-pilot",
      session_no: 2,
      category: "Citizenship",
      start_utc: "2026-11-12T15:30:00Z",
      duration_min: 65,
      event_status: "upcoming",
      registration_open: false,
      join_visibility: "registrants",
      join_url: "",
      en: {
        title: "From Decision to Passport: Steps, Documents and Source of Funds",
        excerpt: "The application steps, required documents (Tazkira, passport, financial records), proving and transferring source of funds, interview preparation and a full cost breakdown."
      },
      fa: {
        title: "از تصمیم تا پاسپورت: مراحل، مدارک و منشأ پول",
        excerpt: "مراحل پرونده، مدارک لازم (تذکره، پاسپورت، اسناد مالی)، اثبات و انتقال منشأ پول، آمادگی برای مصاحبه و ریز هزینه‌های کامل."
      },
      ar: {
        title: "من القرار إلى الجواز: الخطوات والمستندات ومصدر الأموال",
        excerpt: "مراحل الملف، والمستندات المطلوبة (التذكرة والجواز والسجلات المالية)، وإثبات مصدر الأموال وتحويلها، والاستعداد للمقابلة، وتفصيل كامل للتكاليف."
      },
      zh: {
        title: "从决定到护照：流程、材料与资金来源",
        excerpt: "申请流程、所需材料（身份证Tazkira、护照、财务文件）、资金来源证明与转账、面试准备及完整费用明细。"
      }
    },
    {
      id: "WEB03",
      slug: "dominica-your-questions-answered",
      series: "dominica-pilot",
      session_no: 3,
      category: "Citizenship",
      start_utc: "2026-11-26T15:30:00Z",
      duration_min: 65,
      event_status: "upcoming",
      registration_open: false,
      join_visibility: "registrants",
      join_url: "",
      en: {
        title: "Your Questions, Our Answers",
        excerpt: "Answers to the questions collected in earlier sessions and the registration form: life after the passport, travel, banking and family."
      },
      fa: {
        title: "پرسش‌های شما، پاسخ‌های ما",
        excerpt: "پاسخ به پرسش‌هایی که در جلسات قبل و فرم ثبت‌نام جمع شده: زندگی بعد از پاسپورت، سفر، بانک و خانواده."
      },
      ar: {
        title: "أسئلتكم، وإجاباتنا",
        excerpt: "إجابات عن الأسئلة التي جُمعت في الجلسات السابقة ونموذج التسجيل: الحياة بعد الجواز، والسفر، والبنوك، والعائلة."
      },
      zh: {
        title: "您的问题，我们来解答",
        excerpt: "解答往期讲座及报名表中收集的问题：入籍后的生活、出行、银行与家庭。"
      }
    }
  ];

  function webinars() {
    let sourceList = null;
    if (typeof window.SGCMS_WEBINARS !== 'undefined' && Array.isArray(window.SGCMS_WEBINARS) && window.SGCMS_WEBINARS.length >= 3) {
      sourceList = window.SGCMS_WEBINARS;
    } else if (Array.isArray(BASE) && BASE.length >= 3) {
      sourceList = BASE;
    }
    if (!sourceList) {
      try {
        const liveStr = localStorage.getItem('sgcms_webinars_live') || localStorage.getItem('sgcms_webinars');
        if (liveStr) {
          const parsed = JSON.parse(liveStr);
          if (Array.isArray(parsed) && parsed.length >= 3 && parsed[0].en && parsed[0].en.title) {
            sourceList = parsed;
          }
        }
      } catch (e) {}
    }
    if (!sourceList || !sourceList.length) {
      sourceList = BASELINE_SESSIONS;
    }

    // Read ONLY schedule overrides (date/time & link) from sgcms_webinar_schedule
    let schedule = null;
    try {
      const schStr = localStorage.getItem('sgcms_webinar_schedule');
      if (schStr) schedule = JSON.parse(schStr);
    } catch (e) {}

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const list = JSON.parse(JSON.stringify(sourceList)).map(w => {
      // 1. Apply overrides from CRM schedule if present (time, link, and reg_status)
      if (schedule && schedule.sessions && schedule.sessions[w.session_no]) {
        const sData = schedule.sessions[w.session_no];
        if (sData.start_utc) w.start_utc = sData.start_utc;
        if (typeof sData.join_url === 'string') w.join_url = sData.join_url.trim();
        if (typeof sData.duration_min !== 'undefined') w.duration_min = sData.duration_min;
        if (sData.reg_status) {
          w.reg_status = sData.reg_status;
          w.registration_open = (sData.reg_status === 'open');
        }
      }
      if (!w.reg_status) {
        w.reg_status = w.registration_open ? 'open' : 'soon';
      }

      // 2. Compute dynamic time status & 2-Hour Auto-Expiry Lifecycle
      const startMs = Date.parse(w.start_utc);
      if (!isNaN(startMs)) {
        if (now > (startMs + TWO_HOURS)) {
          // Rule: After 2 hours, link is automatically removed from public website
          w.event_status = 'ended';
          w.join_url = '';
        } else if (now >= startMs && now <= (startMs + TWO_HOURS)) {
          // Rule: During 2-hour window, session is live
          w.event_status = 'live';
        } else {
          // Upcoming
          w.event_status = 'upcoming';
        }
      }

      return w;
    });

    return list;
  }
  const byslug = s => webinars().find(w => w.slug === s || (w.id && w.id.toLowerCase() === String(s).toLowerCase()) || ('session-' + w.session_no) === s);
  
  /* held (ended) | locked | soon | ready */
  const linkState = w => {
    const now = Date.now();
    const stTime = startOf(w).getTime();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (w.event_status === 'ended' || (!isNaN(stTime) && now > (stTime + TWO_HOURS))) return 'held';
    if (w.join_visibility !== 'public' && Number(w.session_no) > 1) return 'locked';
    return (w.join_url && String(w.join_url).trim()) ? 'ready' : 'soon';
  };
  const C = w => {
    if (!w) return { title: '', excerpt: '', series_tag: '' };
    const cur = w[lang] || {};
    const en = w.en || {};
    return {
      title: cur.title || en.title || w.title || ('Session ' + w.session_no),
      excerpt: cur.excerpt || en.excerpt || w.excerpt || '',
      series_tag: cur.series_tag || en.series_tag || w.series_tag || '',
      body: cur.body || en.body || [],
      outcomes: cur.outcomes || en.outcomes || []
    };
  };
  const startOf = w => new Date(w.start_utc);

  /* featured(): Returns whichever session admin marked active in CRM, defaulting to first upcoming */
  const featured = () => {
    let activeNo = 1;
    try {
      const schStr = localStorage.getItem('sgcms_webinar_schedule');
      if (schStr) {
        const sch = JSON.parse(schStr);
        if (sch.active_session_no) activeNo = Number(sch.active_session_no);
      }
    } catch (e) {}
    const all = webinars();
    return all.find(w => Number(w.session_no) === activeNo) || all.find(w => w.event_status !== 'ended') || all[0];
  };

  /* ---------- shell: header / footer ---------- */
  function navItems() {
    const N = L().nav, p = prefix();
    return [
      { h: SITE + p + 'citizenshipbyinvestment/', l: N.citizenship, dd: 'cbi' },
      { h: SITE + p + 'residencybyinvestment/', l: N.residency, dd: 'rbi' },
      { h: SITE + p + 'realestate/', l: N.moreServices, dd: 'services' },
      { h: SITE + p + 'aboutus/', l: N.aboutUs, dd: 'about' },
      { h: SITE + p + 'contact/', l: N.contact },
      { h: SITE + p + 'blog/', l: N.blog },
      { h: `${SITE}${p}events/`, l: N.webinars, active: 1, isNew: 1 }
    ];
  }
  function headerHTML(staticCopy) {
    const N = L().nav, F = L().footer, p = prefix();
    const langs = LANGS.map(c => `<button type="button" data-lang="${c}" aria-current="${c === lang}"><span lang="${c}">${esc(I18N[c].meta.name)}</span><small>${c.toUpperCase()}</small></button>`).join('');

    return `<div class="header-inner">
      <div class="brand-group">
        <a class="brand" href="${SITE + p}" aria-label="Sharif Group"><img src="${LOGO}" alt="Sharif Group" width="50" height="56"></a>
        <span class="brand-sep" aria-hidden="true">|</span>
        <nav class="main-nav" aria-label="Main">
        <!-- Citizenship with Mega Menu -->
        <div class="nav-item has-dd" data-dd="cbi">
          <a class="nav-link caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.citizenship)} ${I.chev}</a>
          <div class="mega-menu" id="mm-cbi">
            <div class="mega-menu-inner">
              <div class="mm-side">
                <p class="mm-title">${N.cbiTitle || 'Citizenship By Investment'}</p>
                <a class="mm-all-btn caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.allCitizenship)}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.caribbeanPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/dominica/"><img src="https://flagcdn.com/dm.svg" alt="Dominica" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.dominica || 'Dominica | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stkitts/"><img src="https://flagcdn.com/kn.svg" alt="St. Kitts & Nevis" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/"><img src="https://flagcdn.com/ag.svg" alt="Antigua & Barbuda" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stlucia/"><img src="https://flagcdn.com/lc.svg" alt="Saint Lucia" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/grenada/"><img src="https://flagcdn.com/gd.svg" alt="Grenada" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.grenada || 'Grenada | Passport')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.globalPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/vanuatu/"><img src="https://flagcdn.com/vu.svg" alt="Vanuatu" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.vanuatu || 'Vanuatu | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/sao-tome-and-principe/"><img src="https://flagcdn.com/st.svg" alt="São Tomé and Príncipe" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.saotome || 'São Tomé and Príncipe | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/nauru/"><img src="https://flagcdn.com/nr.svg" alt="Republic of Nauru" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.nauru || 'Republic of Nauru | Passport')}</span></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <span class="nav-sep" aria-hidden="true">|</span>

        <!-- Residency with Mega Menu -->
        <div class="nav-item has-dd" data-dd="rbi">
          <a class="nav-link caps" href="${SITE + p}residencybyinvestment/">${esc(N.residency)} ${I.chev}</a>
          <div class="mega-menu" id="mm-rbi">
            <div class="mega-menu-inner">
              <div class="mm-side">
                <p class="mm-title">${N.rbiTitle || 'Residency By Investment'}</p>
                <a class="mm-all-btn caps" href="${SITE + p}residencybyinvestment/">${esc(N.allResidency)}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.europeanPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/residencybyinvestment/portugal/"><img src="https://flagcdn.com/pt.svg" alt="Portugal" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</span></a></li>
                  <li><a href="${SITE + p}programs/residencybyinvestment/greece/"><img src="https://flagcdn.com/gr.svg" alt="Greece" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.greece || 'Greece | Golden Visa')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.americasUAE)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/residencybyinvestment/panama/"><img src="https://flagcdn.com/pa.svg" alt="Panama" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.panama || 'Panama | Golden Visa')}</span></a></li>
                  <li><a href="${SITE + p}programs/residencybyinvestment/uae/"><img src="https://flagcdn.com/ae.svg" alt="UAE" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.uae || 'United Arab Emirates | Golden Visa')}</span></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <span class="nav-sep" aria-hidden="true">|</span>

        <!-- Other Services with Mega Menu -->
        <div class="nav-item has-dd" data-dd="services">
          <a class="nav-link caps" href="${SITE + p}realestate/">${esc(N.moreServices)} ${I.chev}</a>
          <div class="mega-menu" id="mm-services">
            <div class="mega-menu-inner mm-cards-layout">
              <div class="mm-side">
                <p class="mm-title">${esc(N.moreServices)}</p>
                <a class="mm-all-btn caps" href="${SITE + p}realestate/">${esc(N.viewAllServices || 'View All Services')}</a>
              </div>
              <div class="mm-cards-grid">
                <a class="mm-card" href="${SITE + p}realestate/">
                  <img src="${imgRel('isdubairealestateago_3194a5.webp')}" alt="Real Estate">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.realEstate)}</span>
                </a>
                <a class="mm-card" href="${SITE + p}educationaladvisory/">
                  <img src="${imgRel('photo-154133990719_46b647.webp')}" alt="Educational Advisory">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.education)}</span>
                </a>
                <a class="mm-card" href="${SITE + p}socialresponsibility/">
                  <img src="${imgRel('photo-148852178799_7302db.webp')}" alt="Social Responsibility">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.socialResp)}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <span class="nav-sep" aria-hidden="true">|</span>

        <!-- About Us with Mega Menu -->
        <div class="nav-item has-dd" data-dd="about">
          <a class="nav-link caps" href="${SITE + p}aboutus/">${esc(N.aboutUs)} ${I.chev}</a>
          <div class="mega-menu" id="mm-about">
            <div class="mega-menu-inner mm-cards-layout">
              <div class="mm-side">
                <p class="mm-title">${esc(N.corporateIdentity || 'Corporate Identity')}</p>
                <a class="mm-all-btn caps" href="${SITE + p}aboutus/">${esc(N.overview || 'Overview')}</a>
              </div>
              <div class="mm-cards-grid">
                <a class="mm-card" href="${SITE + p}aboutus/">
                  <img src="${imgRel('dubai-office-2.webp')}" alt="Sharif Group">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.aboutSharif)}</span>
                </a>
                <a class="mm-card" href="${SITE + p}about-founder/">
                  <img src="${imgRel('founder-ali-sharif.webp')}" alt="Ali Sharif">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.aboutFounder)}</span>
                </a>
                <a class="mm-card" href="${SITE + p}socialresponsibility/">
                  <img src="${imgRel('photo-148852178799_7302db.webp')}" alt="Social Responsibility">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.socialResp)}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <span class="nav-sep" aria-hidden="true">|</span>

        <!-- Direct links -->
        <a class="nav-link caps" href="${SITE + p}contact/">${esc(N.contact)}</a>
        <span class="nav-sep" aria-hidden="true">|</span>
        <a class="nav-link caps" href="${SITE + p}blog/">${esc(N.blog)}</a>
        <span class="nav-sep" aria-hidden="true">|</span>
        <a class="nav-link caps is-active" href="${SITE + p}events/" aria-current="page">${esc(N.webinars)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>
      </nav>
      </div>

      <div class="header-actions">
        <a class="pill pill--bronze caps" href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityChecker)}</a>
        <a class="pill caps" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a>
        <div class="lang"${staticCopy ? '' : ' id="langBox"'}>
          <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${esc(I18N[lang].meta.name)}">${I.globe}<span>${esc(L().meta.code)}</span>${I.chev}</button>
          <div class="lang-menu" role="menu">${langs}</div>
        </div>
        <button class="burger" type="button" aria-label="Menu" aria-expanded="false"${staticCopy ? '' : ' id="burger"'}>${I.menu}</button>
      </div></div>`;
  }
  /* ---------- footer with seamless video canvas crossfade ---------- */
  let footerCanvasAnimId = null;
  function initFooterCanvas() {
    if (footerCanvasAnimId) {
      cancelAnimationFrame(footerCanvasAnimId);
      footerCanvasAnimId = null;
    }
    const v1 = document.getElementById("footer-hidden-video");
    const v2 = document.getElementById("footer-hidden-video-2");
    const canvas = document.getElementById("footer-seamless-canvas");
    if (!v1 || !v2 || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    let activeVideo = v1;
    let standbyVideo = v2;
    let crossfadeAlpha = 0;
    let isFading = false;
    let isFooterVisible = false;

    function resizeCanvas() {
      if (!canvas || !canvas.offsetWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
    }
    window.removeEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    function renderFrame() {
      if (!isFooterVisible) return;
      if (activeVideo.duration && activeVideo.currentTime >= activeVideo.duration - 1.2 && !isFading) {
        isFading = true;
        standbyVideo.currentTime = 0;
        standbyVideo.play().catch(() => {});
      }
      if (isFading) {
        crossfadeAlpha += 0.04;
        if (crossfadeAlpha >= 1) {
          crossfadeAlpha = 1;
          activeVideo.pause();
          let temp = activeVideo;
          activeVideo = standbyVideo;
          standbyVideo = temp;
          isFading = false;
          crossfadeAlpha = 0;
        }
      }
      ctx.globalAlpha = 1;
      if (activeVideo.readyState >= 2) {
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
      }
      if (isFading && standbyVideo.readyState >= 2) {
        ctx.globalAlpha = crossfadeAlpha;
        ctx.drawImage(standbyVideo, 0, 0, canvas.width, canvas.height);
      }
      footerCanvasAnimId = requestAnimationFrame(renderFrame);
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isFooterVisible = entry.isIntersecting;
          if (isFooterVisible) {
            activeVideo.play().catch(() => {});
            if (!footerCanvasAnimId) renderFrame();
          } else {
            activeVideo.pause();
            standbyVideo.pause();
            if (footerCanvasAnimId) {
              cancelAnimationFrame(footerCanvasAnimId);
              footerCanvasAnimId = null;
            }
          }
        });
      }, { rootMargin: '250px' });
      observer.observe(canvas.parentElement || canvas);
    } else {
      isFooterVisible = true;
      activeVideo.play().catch(() => {});
      renderFrame();
    }
  }

  function footerHTML() {
    const F = L().footer, p = prefix();
    return `
      <!-- TOP GRADIENT FADE (CREAM INTO VIDEO) -->
      <div class="footer-top-fade"></div>

      <!-- VIDEO BACKGROUND WITH SEAMLESS CANVAS CROSSFADE -->
      <div class="footer-video-layer">
        <canvas id="footer-seamless-canvas"></canvas>
        <video id="footer-hidden-video" style="display:none" muted playsinline preload="none">
          <source src="${FOOTER_VIDEO}" type="video/mp4"/>
        </video>
        <video id="footer-hidden-video-2" style="display:none" muted playsinline preload="none">
          <source src="${FOOTER_VIDEO}" type="video/mp4"/>
        </video>
        <div class="footer-video-overlay"></div>
      </div>

      <!-- FOOTER CONTENT (MATCHING LIVE HOME PAGE FOOTER EXACTLY) -->
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16 relative z-30 [text-shadow:_0_1px_3px_rgb(0_0_0_/_80%)]">
        <!-- Col 1: Brand Info -->
        <div class="flex flex-col space-y-6 lg:col-span-1 foot-brand-col">
          <a class="flex items-center space-x-2 group cursor-pointer foot-brand-link" href="${SITE + p}">
            <img alt="Sharif Group Logo" class="h-14 w-auto group-hover:scale-105 transition-transform duration-300 foot-brand-logo" src="${FOOTER_LOGO}" loading="lazy" decoding="async"/>
            <div class="flex items-center space-x-2 translate-y-1.5 foot-brand-text-wrap">
              <div class="h-10 w-[1px] bg-neutral-500/50 foot-brand-divider"></div>
              <div class="flex flex-col justify-center font-serif text-white tracking-[0.2em] font-bold leading-tight group-hover:text-luxury-gold transition foot-brand-text">
                <span class="text-base uppercase">SHARIF</span>
                <span class="text-base uppercase">GROUP</span>
              </div>
            </div>
          </a>
          <div class="pt-2 foot-imc-wrap">
            <img alt="Investment Migration Council" class="h-10 w-auto brightness-0 invert object-contain foot-imc-logo" src="${IMC_LOGO}" loading="lazy" decoding="async"/>
          </div>
          <div class="text-xs text-neutral-300 space-y-3 pt-2 foot-contact-list">
            <p class="flex items-start"><i class="fa-solid fa-location-dot mt-1 mr-3 text-luxury-gold text-sm foot-ico"></i> <span data-i18n="footer.address">${esc(F.address)}</span></p>
            <p class="flex items-center"><i class="fa-solid fa-phone mr-3 text-luxury-gold text-sm foot-ico"></i> <a class="hover:text-white transition ltr" href="tel:+97143578737">+971 4 357 8737</a></p>
            <p class="flex items-center"><i class="fa-solid fa-envelope mr-3 text-luxury-gold text-sm foot-ico"></i> <a class="hover:text-white transition ltr" href="mailto:contact@sharifgroup.ae">contact@sharifgroup.ae</a></p>
          </div>
          <!-- SOCIAL MEDIA LINKS BLOCK -->
          <div class="flex items-center space-x-3 pt-2 foot-social-list">
            <a class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-luxury-gold hover:border-luxury-gold transition foot-social-btn" href="https://www.linkedin.com/company/sharif-group-uae/" rel="noopener noreferrer" target="_blank" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in text-xs"></i></a>
            <a class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-luxury-gold hover:border-luxury-gold transition foot-social-btn" href="https://www.instagram.com/sharifgroup.uae" rel="noopener noreferrer" target="_blank" aria-label="Instagram"><i class="fa-brands fa-instagram text-xs"></i></a>
            <a class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-luxury-gold hover:border-luxury-gold transition foot-social-btn" href="https://api.whatsapp.com/send?phone=97143578737" rel="noopener noreferrer" target="_blank" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp text-xs"></i></a>
            <a class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-luxury-gold hover:border-luxury-gold transition foot-social-btn" href="mailto:contact@sharifgroup.ae" aria-label="Email"><i class="fa-solid fa-envelope text-xs"></i></a>
          </div>
        </div>

        <!-- Col 2: Quick Links -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-6 foot-col-title mb-6" data-i18n="footer.quickLinks">${esc(F.quickLinks)}</p>
          <ul class="space-y-2.5 text-xs text-neutral-300 foot-link-list space-y-2.5">
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.home" href="${SITE + p}">${esc(F.home)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.aboutSharif" href="${SITE + p}aboutus/">${esc(F.aboutSharif)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.aboutAli" href="${SITE + p}about-founder/">${esc(F.aboutAli)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.socialResp" href="${SITE + p}socialresponsibility/">${esc(F.socialResp)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.citizenshipPrograms" href="${SITE + p}citizenshipbyinvestment/">${esc(F.citizenshipPrograms)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.residencyPrograms" href="${SITE + p}residencybyinvestment/">${esc(F.residencyPrograms)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.realEstate" href="${SITE + p}realestate/">${esc(F.realEstate)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.educationalAdvisory" href="${SITE + p}educationaladvisory/">${esc(F.educationalAdvisory)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.contactUs" href="${SITE + p}contact/">${esc(F.contactUs)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.insightsBlog" href="${SITE + p}blog/">${esc(F.insightsBlog)}</a></li>
            <li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5 foot-new-row" href="${SITE + p}events/"><span data-i18n="footer.webinars">${esc(F.webinars)}</span> <span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[8px] font-bold leading-none inline-flex items-center justify-center shrink-0 tracking-wider" data-i18n="nav.newBadge">${esc(t('common.isNew') || 'New')}</span></a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.eligibilityChecker" href="${SITE + p}eligibilitychecker/">${esc(F.eligibilityChecker)}</a></li>
          </ul>
        </div>

        <!-- Col 3: Citizenship Programs -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-4 foot-col-title mb-4" data-i18n="footer.citizenshipProgramsCol">${esc(F.citizenshipProgramsCol)}</p>
          <ul class="space-y-2 text-xs text-neutral-300 foot-link-list space-y-2">
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.dominica" href="${SITE + p}programs/citizenshipbyinvestment/dominica/">${esc(F.cbi?.dominica || 'Dominica | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.kitts" href="${SITE + p}programs/citizenshipbyinvestment/stkitts/">${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.antigua" href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/">${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.lucia" href="${SITE + p}programs/citizenshipbyinvestment/stlucia/">${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.grenada" href="${SITE + p}programs/citizenshipbyinvestment/grenada/">${esc(F.cbi?.grenada || 'Grenada | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.vanuatu" href="${SITE + p}programs/citizenshipbyinvestment/vanuatu/">${esc(F.cbi?.vanuatu || 'Vanuatu | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.saotome" href="${SITE + p}programs/citizenshipbyinvestment/sao-tome-and-principe/">${esc(F.cbi?.saotome || 'São Tomé and Príncipe | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.cbi.nauru" href="${SITE + p}programs/citizenshipbyinvestment/nauru/">${esc(F.cbi?.nauru || 'Republic of Nauru | Passport')}</a></li>
          </ul>
        </div>

        <!-- Col 4: Residency & Other Services -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-4 foot-col-title mb-4" data-i18n="footer.residencyProgramsCol">${esc(F.residencyProgramsCol)}</p>
          <ul class="space-y-2 text-xs text-neutral-300 mb-6 foot-link-list space-y-2 mb-6">
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.rbi.portugal" href="${SITE + p}programs/residencybyinvestment/portugal/">${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.rbi.greece" href="${SITE + p}programs/residencybyinvestment/greece/">${esc(F.rbi?.greece || 'Greece | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.rbi.panama" href="${SITE + p}programs/residencybyinvestment/panama/">${esc(F.rbi?.panama || 'Panama | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="services.rbi.uae" href="${SITE + p}programs/residencybyinvestment/uae/">${esc(F.rbi?.uae || 'United Arab Emirates | Golden Visa')}</a></li>
          </ul>
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-3 foot-col-title mb-3" data-i18n="footer.otherServices">${esc(F.otherServices)}</p>
          <ul class="space-y-2 text-xs text-neutral-300 foot-link-list space-y-2">
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.realEstate" href="${SITE + p}realestate/">${esc(F.realEstate)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.educationalAdvisory" href="${SITE + p}educationaladvisory/">${esc(F.educationalAdvisory)}</a></li>
          </ul>
        </div>

        <!-- Col 5: Legal Frameworks -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-6 foot-col-title mb-6" data-i18n="footer.legalFrameworks">${esc(F.legalFrameworks)}</p>
          <ul class="space-y-3 text-xs text-neutral-300 foot-link-list space-y-3">
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.privacyPolicy" href="${SITE + p}privacypolicy/">${esc(F.privacyPolicy)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.termsOfUse" href="${SITE + p}termsofuse/">${esc(F.termsOfUse)}</a></li>
            <li><a class="hover:text-luxury-gold transition" data-i18n="footer.cookiePolicy" href="${SITE + p}cookiepolicy/">${esc(F.cookiePolicy)}</a></li>
          </ul>
        </div>
      </div>

      <!-- Foot Bottom Bar -->
      <div class="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-700/50 text-[11px] text-neutral-400 font-light relative z-30 foot-bottom-bar">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 foot-bottom-inner">
          <p data-i18n="footer.allRightsReserved">${esc(F.allRightsReserved)}</p>
          <p class="text-xs foot-credit">
            <span data-i18n="footer.designedBy">${esc(F.designedBy)}</span> <a class="font-bold hover:underline text-white dmb-link" href="https://www.digitalmediabombay.com" target="_blank" rel="noopener noreferrer">Digital Media <span class="text-[#e4aa25]">Bombay</span></a>
          </p>
        </div>
      </div>`;
  }

  function renderShell() {
    const M = L().meta, F = L().footer, N = L().nav, p = prefix();
    document.documentElement.lang = lang;
    document.documentElement.dir = M.dir;
    document.body.className = 'lang-' + lang;
    if ($('#demoBar')) {
      if (DEMO) {
        $('#demoBar').style.display = 'block';
        $('#demoBar').innerHTML = `<strong>${esc(t('common.demoStrong'))}</strong>${esc(t('common.demoText'))}`;
      } else {
        $('#demoBar').style.display = 'none';
      }
    }
    $('.skip').textContent = t('common.skip');
    if (typeof window.mountUniversalNavbar === 'function') {
      window.mountUniversalNavbar('#siteHeader');
      if ($('#drawer')) $('#drawer').style.display = 'none';
    } else if ($('#siteHeader')) {
      $('#siteHeader').innerHTML = headerHTML(false);
      $('#drawer').innerHTML = `
      <!-- Mobile Language Selector -->
      <div class="drawer-lang-section">
        <div class="drawer-lang-head">
          <span>Language / اللغة</span>
          ${I.globe}
        </div>
        <div class="drawer-lang-grid">
          ${LANGS.map(c => `<button type="button" class="drawer-lang-btn${c === lang ? ' is-active' : ''}" data-lang="${c}">${esc(I18N[c].meta.name)}</button>`).join('')}
        </div>
      </div>

      <!-- Top Action Assessment -->
      <div class="drawer-top-cta">
        <a class="drawer-btn-outline caps" href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityAssessment || N.eligibilityChecker)}</a>
      </div>

      <!-- Navigation Accordions & Links -->
      <nav class="drawer-nav">
        <!-- Dual Citizenship Accordion -->
        <div class="drawer-acc" id="acc-cbi">
          <button type="button" class="drawer-acc-btn">
            <span class="caps">${esc(N.dualCitizenship)}</span>
            ${I.chev}
          </button>
          <div class="drawer-acc-body">
            <a class="drawer-acc-all caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.allCitizenship)}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/dominica/">${esc(F.cbi?.dominica || 'Dominica | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/stkitts/">${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/">${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/stlucia/">${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/grenada/">${esc(F.cbi?.grenada || 'Grenada | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/vanuatu/">${esc(F.cbi?.vanuatu || 'Vanuatu | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/sao-tome-and-principe/">${esc(F.cbi?.saotome || 'São Tomé and Príncipe | Passport')}</a>
            <a href="${SITE + p}programs/citizenshipbyinvestment/nauru/">${esc(F.cbi?.nauru || 'Republic of Nauru | Passport')}</a>
          </div>
        </div>

        <!-- Global Residency Accordion -->
        <div class="drawer-acc" id="acc-rbi">
          <button type="button" class="drawer-acc-btn">
            <span class="caps">${esc(N.globalResidency)}</span>
            ${I.chev}
          </button>
          <div class="drawer-acc-body">
            <a class="drawer-acc-all caps" href="${SITE + p}residencybyinvestment/">${esc(N.allResidency)}</a>
            <a href="${SITE + p}programs/residencybyinvestment/portugal/">${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</a>
            <a href="${SITE + p}programs/residencybyinvestment/greece/">${esc(F.rbi?.greece || 'Greece | Golden Visa')}</a>
            <a href="${SITE + p}programs/residencybyinvestment/panama/">${esc(F.rbi?.panama || 'Panama | Golden Visa')}</a>
            <a href="${SITE + p}programs/residencybyinvestment/uae/">${esc(F.rbi?.uae || 'United Arab Emirates | Golden Visa')}</a>
          </div>
        </div>

        <!-- Other Services Section -->
        <div class="drawer-group">
          <span class="drawer-group-title caps">${esc(N.moreServices)}</span>
          <a href="${SITE + p}realestate/">${esc(N.realEstate)}</a>
          <a href="${SITE + p}educationaladvisory/">${esc(N.education)}</a>
          <a href="${SITE + p}socialresponsibility/">${esc(N.socialResp)}</a>
        </div>

        <!-- Sharif Group / Company Links -->
        <div class="drawer-group">
          <span class="drawer-group-title caps">Sharif Group</span>
          <a href="${SITE + p}aboutus/">${esc(N.aboutSharif)}</a>
          <a href="${SITE + p}about-founder/">${esc(N.aboutFounder)}</a>
          <a href="${SITE + p}socialresponsibility/">${esc(N.socialResp)}</a>
          <a href="${SITE + p}blog/">${esc(N.blog)}</a>
          <a href="${SITE + p}events/" class="is-active">${esc(N.webinars)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>
          <a href="${SITE + p}contact/">${esc(N.contact)}</a>
        </div>
      </nav>

      <!-- Bottom Consultation Pill -->
      <div class="drawer-bottom-cta">
        <a class="drawer-btn-solid caps" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a>
      </div>

      <div class="drawer-contact-info">
        <p>+971 4 357 8737 • contact@sharifgroup.ae</p>
      </div>`;
    }
    $('#siteFooter').innerHTML = footerHTML();
    initFooterCanvas();
    if (typeof window.updateWhatsAppWidget === 'function') {
      try { window.updateWhatsAppWidget(); } catch (e) {}
    }
    document.title = (routeName() === 'list' ? M.title : document.title);
    $('meta[name="description"]').setAttribute('content', M.description);
    bindShell();
    renderDemoPanel();
  }
  function bindShell() {
    const box = $('#langBox');
    if (box) {
      const btn = $('.lang-btn', box);
      btn.addEventListener('click', e => { e.stopPropagation(); const o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      $$('[data-lang]', box).forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    }
    const dr = $('#drawer');
    const bg = $('#burger');
    if (bg && dr) {
      bg.addEventListener('click', () => {
        dr.style.top = Math.max(0, $('#siteHeader').getBoundingClientRect().bottom) + 'px';
        const o = dr.classList.toggle('open');
        bg.setAttribute('aria-expanded', o);
        bg.innerHTML = o ? I.x : I.menu;
      });
      // Language selector inside mobile drawer
      $$('.drawer-lang-btn', dr).forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
      // Accordions inside mobile drawer
      $$('.drawer-acc-btn', dr).forEach(b => {
        b.addEventListener('click', () => {
          const acc = b.closest('.drawer-acc');
          if (acc) acc.classList.toggle('is-open');
        });
      });
      // Auto-close drawer on internal link click
      $$('a[href^="#"]', dr).forEach(a => {
        a.addEventListener('click', () => {
          dr.classList.remove('open');
          bg.setAttribute('aria-expanded', 'false');
          bg.innerHTML = I.menu;
        });
      });
    }
    // Desktop hover & click handling for mega menus with smooth grace period
    let mmTimer = null;
    const closeAllMegaMenus = () => {
      clearTimeout(mmTimer);
      $$('.has-dd').forEach(d => d.classList.remove('is-open'));
    };

    $$('.has-dd').forEach(item => {
      const link = $('.nav-link', item);
      const menu = $('.mega-menu', item);

      // On mouseenter nav trigger
      item.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          clearTimeout(mmTimer);
          $$('.has-dd').forEach(d => { if (d !== item) d.classList.remove('is-open'); });
          item.classList.add('is-open');
        }
      });

      // On mouseleave nav trigger -> wait 250ms before closing
      item.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          clearTimeout(mmTimer);
          mmTimer = setTimeout(closeAllMegaMenus, 250);
        }
      });

      // Keep menu open when mouse moves over the dropdown content
      if (menu) {
        menu.addEventListener('mouseenter', () => {
          if (window.innerWidth >= 1024) {
            clearTimeout(mmTimer);
            item.classList.add('is-open');
          }
        });
        menu.addEventListener('mouseleave', () => {
          if (window.innerWidth >= 1024) {
            clearTimeout(mmTimer);
            mmTimer = setTimeout(closeAllMegaMenus, 250);
          }
        });
      }

      // Click to toggle on desktop
      if (link) {
        link.addEventListener('click', e => {
          if (window.innerWidth >= 1024) {
            const isOpen = item.classList.contains('is-open');
            closeAllMegaMenus();
            if (!isOpen) {
              e.preventDefault();
              item.classList.add('is-open');
            }
          }
        });
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.has-dd')) {
        closeAllMegaMenus();
      }
      if (box && !e.target.closest('#langBox')) {
        box.classList.remove('open');
        const btn = $('.lang-btn', box);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  function setLang(c) {
    if (!LANGS.includes(c)) return;
    lang = c; store.set(K.lang, c);
    if (window.location.protocol === 'file:') {
      const u = new URL(location.href); u.searchParams.set('lang', c); history.replaceState(null, '', u);
      renderShell(); route();
    } else {
      const r = parseRoute();
      let targetPath = (c === 'en' ? '' : '/' + c) + '/events/';
      if (r.slug) {
        targetPath += r.slug + '/';
        if (r.page === 'thanks') targetPath += 'thanks/';
      }
      window.location.href = targetPath + (DEMO ? '?demo=1' : '');
    }
  }

  /* ---------- shared components ---------- */
  function statusBadge(w) {
    const s = w.event_status;
    if (s === 'live') return `<span class="badge badge--live"><span class="dot"></span>${esc(t('status.live'))}</span>`;
    if (s === 'ended') return `<span class="badge badge--muted">${esc(t('status.ended'))}</span>`;
    if (s === 'postponed' || s === 'cancelled') return `<span class="badge badge--muted">${esc(t('status.' + s))}</span>`;
    if (w.reg_status === 'closed') {
      return `<span class="badge badge--muted" style="border-color:rgba(239,68,68,0.3);color:#ef4444;background:rgba(239,68,68,0.08)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>${esc(t('status.regClosed') || 'Registration closed')}</span>`;
    }
    if (w.reg_status === 'open' || w.registration_open || w.join_visibility === 'public') {
      return `<span class="badge badge--gold">${esc(t('status.regOpen'))}</span>`;
    }
    return `<span class="badge badge--muted">${esc(t('status.soon'))}</span>`;
  }
  function countdownHTML(w, light) {
    return `<div class="countdown${light ? ' countdown--light' : ''}" data-cd="${w.start_utc}" aria-label="${esc(t('list.startsIn'))}">
      ${['d', 'h', 'm', 's'].map(u => `<div class="cd-cell"><div class="cd-num" data-u="${u}">--</div><div class="cd-lbl">${esc(t('cd.' + u))}</div></div>`).join('')}</div>`;
  }
  function tzHTML(w, light) {
    const d = startOf(w);
    const rows = [['kabul', TZ.kabul], ['dubai', TZ.dubai], ['istanbul', TZ.istanbul]];
    const known = Object.values(TZ).includes(userTZ);
    let h = rows.map(([k, z]) => `<div class="tz-row${z === userTZ ? ' is-you' : ''}"><span class="tz-city">${esc(t('tz.' + k))}${z === userTZ ? ' · ' + esc(t('tz.you')) : ''}</span><span class="tz-time">${tm(d, z)}</span></div>`).join('');
    if (userTZ && !known) h += `<div class="tz-row is-you"><span class="tz-city">${esc(t('tz.you'))} <small class="ltr">(${esc(userTZ.split('/').pop().replace(/_/g, ' '))})</small></span><span class="tz-time">${tm(d, userTZ)} · ${esc(dShort(d, userTZ))}</span></div>`;
    return `<div class="tz-list${light ? ' tz-list--light' : ''}">${h}</div>`;
  }
  function dateLine(w) {
    const d = startOf(w);
    const solar = lang === 'fa' ? ` · ${dSolar(d, TZ.kabul)}` : '';
    const sample = (!w.date_confirmed && DEMO) ? `<small>${esc(t('common.sample'))}</small>` : '';
    return `<div class="date-line">${esc(dLong(d, TZ.kabul))}${esc(solar)}${sample}</div>`;
  }
  function joinAction(w, light) {
    const st = linkState(w), live = w.event_status === 'live';
    const opens = new Date(startOf(w).getTime() - w.room_opens_min_before * 60000);
    if (st === 'held') return `<div class="held${light ? ' held--light' : ''}"><div class="notice-ico"><i class="fa-regular fa-circle-check"></i></div><div><strong>${esc(t('detail.heldTitle'))}</strong><p class="notice-desc">${esc(t('detail.heldText'))}</p></div></div>`;
    if (st === 'locked') return `<div class="locked${light ? ' locked--light' : ''}"><div class="notice-ico"><i class="fa-solid fa-lock"></i></div><div><strong>${esc(t('detail.lockedTitle'))}</strong><p class="notice-desc">${esc(t('detail.lockedText'))}</p></div></div>`;
    if (st === 'soon') return `<div class="soon-wrap"><span class="btn btn--soon${light ? ' btn--soon-light' : ''} btn--block" role="status"><i class="fa-regular fa-clock"></i><span>${esc(t('detail.linkSoon'))}</span></span><p class="note"><i class="fa-solid fa-link"></i><span>${esc(t('detail.linkSoonNote'))}</span></p></div>`;
    return `<a class="btn btn--bronze btn--block" href="${esc(w.join_url)}" data-join target="_blank" rel="noopener"><i class="fa-solid fa-video"></i><span>${esc(live ? t('detail.joinNow') : t('detail.joinBtn'))}</span></a>
      ${live ? '' : `<p class="note"><i class="fa-regular fa-clock"></i><span>${esc(t('detail.roomOpens', { time: tm(opens, TZ.kabul) }))}</span></p>`}`;
  }
  const pageUrl = w => `${SITE}${prefix()}events/${w.slug}/`;
  const waShare = w => `https://wa.me/?text=${encodeURIComponent(C(w).title + ' — ' + pageUrl(w))}`;

  function webinarImg(sessionNo) {
    const num = Number(sessionNo) || 1;
    const imgName = 'web_' + (((num - 1) % 4) + 1) + '.webp';
    if (window.location.protocol === 'file:') {
      if (window.location.pathname.includes('/fa/') || window.location.pathname.includes('/ar/') || window.location.pathname.includes('/zh/')) return '../../assets/images/' + imgName;
      if (window.location.pathname.includes('/webinars') || window.location.pathname.includes('/events')) return '../assets/images/' + imgName;
      return 'assets/images/' + imgName;
    }
    return window.location.pathname.includes('/sharif-webinars-demo/') ? ('assets/images/' + imgName) : ('/assets/images/' + imgName);
  }

  const HERO_BG_IMAGES = ['web_1.webp', 'web_2.webp', 'web_3.webp', 'web_4.webp'];
  function heroSlideshowHTML() {
    const basePath = (window.location.protocol === 'file:')
      ? (window.location.pathname.includes('/fa/') || window.location.pathname.includes('/ar/') || window.location.pathname.includes('/zh/') ? '../../assets/images/' : (window.location.pathname.includes('/webinars') || window.location.pathname.includes('/events') ? '../assets/images/' : 'assets/images/'))
      : (window.location.pathname.includes('/sharif-webinars-demo/') ? 'assets/images/' : '/assets/images/');
    return `
    <div class="hero-slides-wrapper" aria-hidden="true">
      ${HERO_BG_IMAGES.map((img, i) => `
        <div class="hero-slide${i === 0 ? ' is-active' : ''}" style="background-image: url('${basePath + img}');"></div>
      `).join('')}
    </div>
    <div class="hero-overlay" aria-hidden="true"></div>`;
  }

  let heroSlideshowTimer = null;
  function initHeroSlideshow() {
    if (heroSlideshowTimer) {
      clearInterval(heroSlideshowTimer);
      heroSlideshowTimer = null;
    }
    const slides = $$('.hero-slide');
    if (!slides.length) return;
    let current = 0;
    heroSlideshowTimer = setInterval(() => {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 4500);
  }

  /* ---------- LIST PAGE ---------- */
  function viewList() {
    const all = webinars(), f = featured(), fc = C(f), d = startOf(f);
    const st = linkState(f);
    const live = f.event_status === 'live';
    let series = all.filter(w => !w.series || w.series === f.series || w.series === 'dominica-pilot');
    if (!series.length) series = all;
    document.title = L().meta.title;
    return `
    <section class="hero">
      ${heroSlideshowHTML()}
      <div class="container hero-inner">
        <span class="eyebrow caps">${I.video}${esc(t('list.eyebrow'))}</span>
        <h1 class="display h-xl" style="margin-top:14px">${esc(t('list.title'))}</h1>
        <p class="hero-sub caps">${esc(t('list.sub'))}</p>
        <p class="lede">${esc(t('list.lede'))}</p>
      </div>
    </section>

    <section class="feature"><div class="container">
      <article class="feature-card">
        <div class="feature-main">
          <div class="btn-row" style="gap:8px;align-items:center">
            <span class="eyebrow eyebrow--bronze caps">${I.spark}${esc(t('list.nextEyebrow'))} · ${esc(t('common.sessionN', { n: pad2(f.session_no) }))}</span>
            ${statusBadge(f)}
          </div>
          <h2 class="display h-md on-light">${esc(fc.title)}</h2>
          <p>${esc(fc.excerpt)}</p>
          <div class="chips">
            <span class="chip">${I.clock}${esc(t('common.min', { n: n(f.duration_min) }))}</span>
            <span class="chip">${I.mic}${esc(t('common.lang'))}</span>
            <span class="chip">${I.phone}${esc(t('list.noInstall'))}</span>
            <span class="chip">${I.checkCircle}${esc(t('common.free'))}</span>
            ${f.join_visibility === 'public' ? `<span class="chip">${I.link}${esc(t('status.publicLink'))}</span>` : ''}
          </div>
          <div class="btn-row">
            ${st === 'held' ? `<span class="btn btn--soon btn--soon-light" style="border-color:rgba(239,68,68,0.3);color:#ef4444;background:rgba(239,68,68,0.08)" role="status"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>${esc(t('detail.heldTitle') || 'Session Ended')}</span>` : ''}
            ${st === 'ready' ? `<a class="btn btn--bronze" href="${esc(f.join_url)}" data-join target="_blank" rel="noopener">${I.video}${esc(live ? (t('detail.joinNow') || 'Join Live Session Now') : (t('list.join') || 'Join Live Session'))}</a>` : ''}
            ${st === 'soon' ? `<span class="btn btn--soon btn--soon-light" role="status">${I.clock}${esc(t('detail.linkSoon') || 'Link will be posted soon')}</span>` : ''}
            <a class="btn ${st === 'ready' || st === 'soon' ? 'btn--ghost' : 'btn--bronze'}" href="${pageUrl(f)}">${esc(t('list.details'))}${I.arrow}</a>
          </div>
        </div>
        <aside class="feature-side">
          <div><div class="side-label caps">${esc(t('list.whenTitle'))}</div>${dateLine(f)}</div>
          ${st === 'held'
            ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:12px 14px;margin:8px 0 14px"><div class="side-label caps" style="margin-bottom:4px;color:#ef4444;font-weight:700">${esc(t('detail.heldTitle') || 'Session Ended')}</div><p style="font-size:12px;opacity:0.85;margin:0;line-height:1.4">${esc(t('detail.heldText') || 'This session has concluded.')}</p></div>`
            : (live
                ? `<div><span class="badge badge--live"><span class="dot"></span>${esc(t('detail.liveBanner'))}</span></div>`
                : `<div><div class="side-label caps" style="margin-bottom:10px">${esc(t('list.startsIn'))}</div>${countdownHTML(f)}</div>`
              )
          }
          ${tzHTML(f)}
        </aside>
      </article>
    </div></section>

    <section class="section section--navy" style="margin-top:96px">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow caps">${I.spark}${esc(fc.series_tag || t('list.seriesTag'))}</span>
          <h2 class="display h-lg">${t('list.upTitle')}</h2>
        </div>
        <div class="series-card">
          <div class="series-top">
            <div class="series-id"><div class="series-icon">${I.passport}</div>
              <div><span class="series-tag caps">${esc(fc.series_tag || t('list.seriesTag'))}</span><h3 class="display h-sm">${esc(t('list.seriesTitle'))}</h3></div></div>
            <span class="badge badge--gold caps">${esc(t('common.free'))} · ${esc(t('common.online'))}</span>
          </div>
          <p>${esc(t('list.seriesText'))}</p>
          ${series.map(w => sessionRow(w)).join('')}
        </div>
      </div>
    </section>

    <section class="section section--sand how-to-join-sec timeline-section relative overflow-hidden">
      <div class="timeline-logo-bg pointer-events-none select-none" aria-hidden="true">
        <img src="${LOGO}" alt="" class="w-full h-auto">
      </div>
      <div class="container relative z-10">
        <div class="section-head section-head--centered mb-12">
          <span class="eyebrow caps"><i class="fa-regular fa-clock text-[10px]"></i> <span>${esc(t('list.timelineEyebrow') || 'TIMELINE')}</span></span>
          <h2 class="display h-lg on-light">${t('list.howTitle')}</h2>
          <div class="section-gold-line"></div>
          <p class="section-sub">${esc(t('list.howSub'))}</p>
        </div>

        <div class="timeline-track" id="timeline-track">
          <!-- Central Track Line -->
          <div class="timeline-central-line"></div>

          <!-- Animated Central Floating Tracker Card -->
          <div id="central-passport-node">
            <div class="timeline-node-card">
              <div class="timeline-node-icon"><i class="fa-solid fa-play"></i></div>
              <span class="timeline-node-badge">LIVE</span>
            </div>
          </div>

          <!-- Steps 1 to 4 -->
          <div class="timeline-steps-list">
            ${t('list.steps').map((s, i) => {
              const stepNum = i + 1;
              const isOdd = (stepNum % 2 !== 0);
              const stepTips = t('list.stepTips') || [];
              const tipText = stepTips[i] || '';
              const stepPrefix = t('list.stepPrefix') || 'STEP';

              return `
                <div class="timeline-step" data-step="${stepNum}">
                  <!-- Left Side -->
                  <div class="timeline-side timeline-side-left">
                    ${isOdd ? `
                      <div class="timeline-step-content">
                        <span class="timeline-step-kicker">${esc(stepPrefix)} ${pad2(stepNum)}</span>
                        <h4 class="timeline-step-title">${esc(s.t)}</h4>
                        <p class="timeline-step-desc">${esc(s.d)}</p>
                      </div>
                    ` : `
                      <div class="timeline-step-tip">
                        <p class="timeline-step-note">${esc(tipText)}</p>
                      </div>
                    `}
                  </div>

                  <!-- Center Badge -->
                  <div class="timeline-side-center">
                    <div class="step-badge" id="step-badge-${stepNum}" data-badge="${stepNum}">
                      <span>${stepNum}</span>
                    </div>
                  </div>

                  <!-- Right Side -->
                  <div class="timeline-side-right">
                    ${!isOdd ? `
                      <div class="timeline-step-content">
                        <span class="timeline-step-kicker">${esc(stepPrefix)} ${pad2(stepNum)}</span>
                        <h4 class="timeline-step-title">${esc(s.t)}</h4>
                        <p class="timeline-step-desc">${esc(s.d)}</p>
                      </div>
                    ` : `
                      <div class="timeline-step-tip">
                        <p class="timeline-step-note">${esc(tipText)}</p>
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Step 5: Final Milestone (Checkmark Badge & Celebration) -->
          <div class="timeline-step timeline-step-5" data-step="5">
            <div class="timeline-side-center">
              <div class="step-badge step-badge--final" id="step-badge-5" data-badge="5">
                <i class="fa-solid fa-check"></i>
              </div>
            </div>
            <div class="timeline-final-content">
              <span class="timeline-final-kicker text-neutral-500" id="congrats-label">${esc(t('list.finalKicker') || 'JOIN OUR NEXT LIVE SESSION')}</span>
              <h3 class="timeline-final-title">${esc(t('list.finalTitle') || "You're All Set to Experience Sharif Group Live!")}</h3>
              <p class="timeline-final-desc">${esc(t('list.finalDesc') || "Enjoy direct access to licensed immigration lawyers, bespoke investment advisory, and live Q&A in your preferred language.")}</p>
            </div>
          </div>
        </div>

        <div class="privacy-strip mt-16">
          <div class="privacy-strip-ico"><i class="fa-solid fa-shield-halved"></i></div>
          <div>
            <h3>${esc(t('list.privacyTitle'))}</h3>
            <p>${esc(t('list.privacyText'))}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--cream section--tight"><div class="container">${ctaBand()}</div></section>`;
  }
  function sessionRow(w) {
    const c = C(w), d = startOf(w);
    const imgSrc = w.image || webinarImg(w.session_no);
    return `<article class="session-row" tabindex="0" role="region" aria-label="${esc(c.title || ('Session ' + w.session_no))}">
      <div class="session-row-head">
        <span class="session-no">${pad2(w.session_no)}</span>
        <div class="session-head-title">
          <h3>${esc(c.title || ('Session ' + w.session_no))}</h3>
        </div>
        <div class="session-head-actions">
          ${statusBadge(w)}
          <span class="session-chevron" aria-hidden="true"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
      </div>
      <div class="session-row-collapse">
        <div class="session-row-inner">
          <div class="session-divider"></div>
          <div class="session-detail-grid">
            <div class="session-detail-media">
              <div class="session-thumb-wrap">
                <img src="${imgSrc}" alt="${esc(c.title || ('Session ' + w.session_no))}" class="session-thumb" loading="lazy" />
                <span class="session-thumb-badge"><i class="fa-solid fa-play"></i></span>
              </div>
            </div>
            <div class="session-detail-info">
              <p class="session-desc">${esc(c.excerpt || '')}</p>
              <div class="session-meta">
                <span><i class="fa-regular fa-calendar-check"></i> ${esc(dShort(d, TZ.kabul))} · ${tm(d, TZ.kabul)} ${esc(t('tz.kabul'))}</span>
                <span><i class="fa-regular fa-clock"></i> ${esc(t('common.min', { n: n(w.duration_min) }))}</span>
              </div>
            </div>
            <div class="session-detail-btn">
              <a class="btn btn--bronze btn--sm caps" href="${pageUrl(w)}">
                <span>${esc(t('list.sessionCta'))}</span>
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }
  function ctaBand() {
    return `<div class="cta-band"><div><h2 class="display h-md">${esc(t('list.ctaTitle'))}</h2><p>${esc(t('list.ctaText'))}</p></div>
      <a class="btn btn--bronze" href="${SITE + prefix()}contact/">${esc(t('list.ctaBtn'))}${I.arrow}</a></div>`;
  }

  /* ---------- DETAIL PAGE ---------- */
  function viewDetail(slug) {
    const w = byslug(slug);
    if (!w) return viewNotFound();
    const c = C(w), d = startOf(w);
    const isFirst = Number(w.session_no) === 1;
    document.title = `${c.title || ('Session ' + w.session_no)} | ${L().nav.webinars} | Sharif Group`;
    const others = webinars().filter(x => (x.series === w.series || !x.series) && x.id !== w.id);
    const bodyParas = (Array.isArray(c.body) ? c.body : (typeof c.body === 'string' ? [c.body] : [])).filter(Boolean);
    const outcomeItems = (Array.isArray(c.outcomes) ? c.outcomes : (typeof c.outcomes === 'string' ? [c.outcomes] : [])).filter(Boolean);
    const agendaList = (Array.isArray(c.agenda) && c.agenda.length) ? c.agenda : (t('detail.agendaItems') || []);
    const speakersList = (Array.isArray(c.speakers) && c.speakers.length) ? c.speakers : [['expert', I.user], ['host', I.mic]];

    return `
    <section class="hero hero--detail">
      ${heroSlideshowHTML()}
      <div class="container hero-inner">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE + prefix()}">${esc(t('detail.home'))}</a><i class="fa-solid fa-chevron-right crumb-ico"></i><a href="${SITE + prefix()}events/">${esc(L().nav.webinars)}</a><i class="fa-solid fa-chevron-right crumb-ico"></i><span aria-current="page">${esc(t('common.sessionN', { n: pad2(w.session_no) }))}</span></nav>
        <div class="btn-row" style="gap:8px;align-items:center"><span class="eyebrow caps"><i class="fa-solid fa-star text-[10px]"></i> ${esc(c.series_tag || t('list.seriesTag'))} · ${esc(t('common.sessionN', { n: pad2(w.session_no) }))}</span>${statusBadge(w)}</div>
        <h1 class="display h-lg">${esc(c.title || ('Session ' + w.session_no))}</h1>
        <p class="lede">${esc(c.excerpt || '')}</p>
        <div class="hero-meta">
          <span><i class="fa-regular fa-calendar-check"></i> ${esc(dLong(d, TZ.kabul))}</span>
          <span><i class="fa-regular fa-clock"></i> ${tm(d, TZ.kabul)} ${esc(t('tz.kabul'))} · ${tm(d, TZ.dubai)} ${esc(t('tz.dubai'))}</span>
          <span><i class="fa-solid fa-language"></i> ${esc(t('common.lang'))}</span>
          <span><i class="fa-solid fa-circle-check"></i> ${esc(t('common.free'))} · ${esc(t('common.min', { n: n(w.duration_min) }))}</span>
        </div>
      </div>
    </section>
    <div class="container"><div class="detail">
      <div class="d-join">${joinCard(w)}</div>
      <div class="d-main">
        <section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-circle-info"></i></span><span>${esc(t('detail.about'))}</span></h2><div class="prose card card--prose">${bodyParas.length ? bodyParas.map(p => `<p>${esc(p)}</p>`).join('') : `<p>${esc(c.excerpt || '')}</p>`}</div></section>
        <section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-graduation-cap"></i></span><span>${esc(t('detail.learn'))}</span></h2><ul class="learn">${outcomeItems.length ? outcomeItems.map(o => `<li><div class="learn-ico"><i class="fa-solid fa-check"></i></div><span>${esc(o)}</span></li>`).join('') : `<li><div class="learn-ico"><i class="fa-solid fa-check"></i></div><span>${esc(t('common.free'))}</span></li>`}</ul></section>
        <section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-list-check"></i></span><span>${esc(t('detail.agenda'))}</span></h2><ol class="agenda">${agendaList.map(a => `<li><span class="ag-time">${esc(a.time || a.t || '')}</span><span class="ag-label">${esc(a.topic || a.l || '')}<span class="ag-who">${esc(a.speaker || a.w || '')}</span></span></li>`).join('')}</ol></section>
        <section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-users"></i></span><span>${esc(t('detail.speakers'))}</span></h2><div class="speakers">
          ${speakersList.map(sp => {
            if (Array.isArray(sp)) {
              const [k] = sp;
              const faIcon = k === 'host' ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-user-tie"></i>';
              return `<div class="speaker"><div class="avatar">${faIcon}</div><div><h4>${esc(t('detail.' + k + 'Name'))}</h4><p>${esc(t('detail.' + k + 'Role'))}</p><span class="tbd">${esc(t('detail.tbd'))}</span></div></div>`;
            }
            const speakerName = sp.name || sp.title || t('detail.expertName');
            const speakerRole = (sp.name && sp.title)
              ? (sp.title + (sp.affiliation ? ` · ${sp.affiliation}` : ''))
              : (sp.affiliation || sp.role || sp.title || t('detail.expertRole'));
            const speakerNote = sp.note || (sp.name ? '' : t('detail.tbd'));
            return `<div class="speaker"><div class="avatar"><i class="fa-solid fa-user-tie"></i></div><div><h4>${esc(speakerName)}</h4><p>${esc(speakerRole)}</p>${speakerNote ? `<span class="tbd">${esc(speakerNote)}</span>` : ''}</div></div>`;
          }).join('')}
        </div></section>
        <section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-shield-halved"></i></span><span>${esc(t('detail.privacy'))}</span></h2><div class="privacy-strip"><div class="privacy-strip-ico"><i class="fa-solid fa-shield-halved"></i></div><div style="flex:1"><h3 style="margin-bottom:8px">${esc(t('detail.privacy'))}</h3><ul class="privacy-list">${t('detail.privacyItems').map(p => `<li><i class="fa-solid fa-check"></i><span>${esc(p)}</span></li>`).join('')}</ul></div></div></section>
        <section class="block faq"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-circle-question"></i></span><span>${esc(t('detail.faq'))}</span></h2>${t('detail.faqs').map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}<i class="fa-solid fa-plus faq-toggle-ico"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</section>
        ${others.length ? `<section class="block"><h2 class="block-title"><span class="bt-icon"><i class="fa-solid fa-layer-group"></i></span><span>${esc(t('detail.other'))}</span></h2><div class="section--navy other-sessions-box" style="border-radius:24px;padding:12px 18px 22px">${others.map(sessionRow).join('')}</div></section>` : ''}
      </div>
      <div class="d-form" id="register">${formCard(w)}</div>
    </div></div>
    <section class="section section--cream section--tight"><div class="container">${ctaBand()}</div></section>`;
  }
  function joinCard(w) {
    const st = linkState(w), live = w.event_status === 'live', held = st === 'held';
    return `<div class="card card--dark join-card-luxury">
      <div class="join-head">${statusBadge(w)}${w.join_visibility === 'public' && !held ? `<span class="badge badge--gold"><i class="fa-solid fa-link" style="font-size:11px"></i>${esc(t('status.publicLink'))}</span>` : ''}</div>
      ${held ? '' : `<h3 class="join-card-title">${esc(t('detail.joinTitle'))}</h3>`}
      ${held ? '' : `<p class="sub">${esc(w.join_visibility === 'public' ? t('detail.joinPublic') : t('form.subPrivate'))}</p>`}
      <div style="margin-bottom:18px">${dateLine(w)}</div>
      ${live || held ? '' : `<div style="margin-bottom:18px">${countdownHTML(w)}</div>`}
      ${held ? '' : `<div style="margin-bottom:20px">${tzHTML(w)}</div>`}
      ${joinAction(w)}
      ${held ? `<a class="btn btn--bronze btn--block" style="margin-top:16px" href="${SITE + prefix()}contact/"><span>${esc(t('detail.consultBtn'))}</span><i class="fa-solid fa-arrow-right"></i></a>` : `<div class="mini-links">
        ${st === 'ready' ? `<button class="btn btn--ghost-light btn--sm" type="button" data-copy="${esc(w.join_url)}"><i class="fa-regular fa-copy"></i><span>${esc(t('common.copy'))}</span></button>` : ''}
        <button class="btn btn--ghost-light btn--sm" type="button" data-ics="${w.id}"><i class="fa-regular fa-calendar-plus"></i><span>${esc(t('detail.addCal'))}</span></button>
        <a class="btn btn--ghost-light btn--sm" href="${waShare(w)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i><span>${esc(t('detail.shareWa'))}</span></a>
      </div>`}
      ${w.registration_open && st !== 'locked' && !held ? `<p class="note"><i class="fa-brands fa-whatsapp text-emerald-400"></i><a href="#register" style="text-decoration:underline;text-underline-offset:3px">${esc(t('list.remind'))}</a></p>` : ''}
    </div>`;
  }
  function formCard(w) {
    const pub = w.join_visibility === 'public';
    if (w.event_status === 'ended') return '';
    if (w.reg_status === 'closed') {
      return `<div class="card card--form"><h3>${esc(t('form.title'))}</h3><div class="closed-msg" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.06);color:#dc2626"><i class="fa-regular fa-circle-xmark" style="margin-inline-end:8px"></i>${esc(t('form.closed'))}</div></div>`;
    }
    if (w.reg_status === 'soon' || !w.registration_open) {
      const msg = w.event_status === 'upcoming' ? t('detail.notOpen', { n: n(w.session_no - 1) }) : t('form.closed');
      return `<div class="card card--form"><h3>${esc(t('form.title'))}</h3><div class="closed-msg"><i class="fa-regular fa-clock" style="margin-inline-end:8px"></i>${esc(msg)}</div></div>`;
    }
    const F = k => esc(t('form.' + k));
    const dial = DIAL.map(([c, k]) => `<option value="${c}">${c} ${k}</option>`).join('');
    const ctry = Object.entries(t('form.countries')).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
    return `<div class="card card--form">
      <h3 class="form-card-title">${F('title')}</h3><p class="sub">${esc(pub ? t('form.subPublic') : t('form.subPrivate'))}</p>
      <form class="form" id="regForm" novalidate data-id="${w.id}">
        <div class="form-alert" role="alert" id="formAlert">${F('alert')}</div>
        <div class="field"><label for="f-name">${F('name')}<span class="req">*</span></label>
          <input class="input" id="f-name" name="fullName" autocomplete="nickname" maxlength="60" aria-describedby="h-name e-name"><span class="hint" id="h-name">${F('nameHint')}</span><span class="err" id="e-name">${F('errName')}</span></div>
        <div class="field"><label for="f-phone">${F('wa')}<span class="req">*</span></label>
          <div class="phone"><select class="select" id="f-dial" name="dialCode" aria-label="Country code">${dial}</select>
          <input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="7X XXX XXXX" aria-describedby="h-phone e-phone"></div>
          <span class="hint" id="h-phone">${F('waHint')}</span><span class="err" id="e-phone">${F('errPhone')}</span></div>
        <div class="field"><label for="f-email">${F('email')}<span class="opt">(${F('optional')})</span></label>
          <input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" dir="ltr" aria-describedby="e-email"><span class="err" id="e-email">${F('errEmail')}</span></div>
        <div class="field"><label for="f-country">${F('country')}<span class="req">*</span></label>
          <select class="select" id="f-country" name="residence_country" aria-describedby="e-country"><option value="">${F('choose')}</option>${ctry}</select><span class="err" id="e-country">${F('errCountry')}</span></div>
        <div class="field"><label for="f-q">${F('question')}<span class="opt">(${F('optional')})</span></label>
          <textarea class="textarea" id="f-q" name="question" maxlength="500" aria-describedby="h-q e-q"></textarea><span class="hint" id="h-q">${F('questionHint')}</span><span class="counter" id="qCount">${n(0)} / ${n(500)}</span><span class="err" id="e-q">${F('errQuestion')}</span></div>
        <label class="check"><input type="checkbox" name="newsletter_optin" value="yes"><span>${F('newsletter')}</span></label>
        <div class="hp" aria-hidden="true"><label>Company<input name="company" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn btn--bronze btn--block btn--submit" type="submit">
          <span>${F('submit')}</span>
          <i class="fa-solid fa-arrow-right btn-arrow-ico"></i>
        </button>
        <p class="consent-note"><i class="fa-solid fa-shield-halved"></i><span>${F('privacy')}</span></p>
      </form></div>`;
  }

  /* ---------- registration logic ---------- */
  const toLatin = s => String(s || '').replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
  const normPhone = s => toLatin(s).replace(/[^\d]/g, '').replace(/^0+/, '');
  function bindForm() {
    const form = $('#regForm'); if (!form) return;
    const q = $('#f-q', form);
    q.addEventListener('input', () => { $('#qCount').textContent = `${n(q.value.length)} / ${n(500)}`; });
    const dialSel = $('#f-dial', form);
    const ph = { '+93': '7X XXX XXXX', '+971': '5X XXX XXXX', '+90': '5XX XXX XXXX', '+98': '9XX XXX XXXX' };
    dialSel.addEventListener('change', () => { $('#f-phone', form).placeholder = ph[dialSel.value] || ''; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('company')) return; // honeypot
      const name = String(fd.get('fullName') || '').trim();
      const dial = String(fd.get('dialCode'));
      const local = normPhone(fd.get('phone'));
      const email = toLatin(String(fd.get('email') || '').trim());
      const country = String(fd.get('residence_country') || '');
      const question = String(fd.get('question') || '').trim();
      const rule = PHONE_RULES[dial] || /^\d{6,13}$/;
      const checks = { name: name.length >= 2, phone: rule.test(local), email: !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), country: !!country, q: question.length <= 500 };
      const map = { name: 'f-name', phone: 'f-phone', email: 'f-email', country: 'f-country', q: 'f-q' };
      let first = null;
      Object.entries(checks).forEach(([k, ok]) => {
        const el = $('#' + map[k]); const field = el.closest('.field');
        field.classList.toggle('has-err', !ok); el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !first) first = el;
      });
      $('#formAlert').classList.toggle('show', !!first);
      if (first) { first.focus(); return; }
      if (fd.get('company')) {
        console.warn('Honeypot hit');
        return;
      }
      const w = webinars().find(x => x.id === form.dataset.id);
      const e164 = dial + local;
      const regs = store.get(K.regs, []);
      const dup = regs.find(r => r.webinar_id === w.id && r.whatsapp_e164 === e164);
      const params = new URLSearchParams(location.search);
      const allowedSrc = ['website', 'instagram', 'facebook', 'telegram', 'whatsapp', 'email', 'test'];
      const src = params.get('utm_source');
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.textContent = t('form.sending');

      const regId = (dup && dup.registration_id) ? dup.registration_id : ('REG-' + w.id + '-' + Date.now().toString(36).toUpperCase().slice(-6));
      const rec = {
        form_id: 'webinar-registration',
        registration_id: regId,
        webinar_id: w.id,
        webinar_slug: w.slug,
        webinar_title: (w.en && w.en.title) || w.title || '',
        webinar_start_utc: w.start_utc,
        fullName: name,
        dialCode: dial,
        phone: `${dial} ${local}`,
        whatsapp_e164: e164,
        email: email,
        residence_country: country,
        question: question,
        newsletter_optin: fd.get('newsletter_optin') === 'yes' ? 'yes' : 'no',
        utm_source: allowedSrc.includes(src) ? src : (src ? 'unknown' : 'website'),
        utm_campaign: params.get('utm_campaign') || w.utm_campaign,
        lang: lang,
        registered_at_utc: new Date().toISOString(),
        source: pageUrl(w),
        page: `/${prefix()}events/${w.slug}/`
      };

      if (dup) {
        const idx = regs.findIndex(r => r.webinar_id === w.id && r.whatsapp_e164 === e164);
        if (idx !== -1) regs[idx] = rec;
      } else {
        regs.push(rec);
      }
      store.set(K.regs, regs);
      store.set(K.last, { id: rec.registration_id, dup: !!dup });

      // 1. Primary Direct Server Email Dispatcher (SPF/DKIM authenticated from @sharifgroup.ae)
      if (window.location.protocol !== 'file:') {
        fetch('/api/event-register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rec)
        }).catch(err => console.warn('Server registration notice:', err));
      }

      // 2. Central CRM Sheet Sync (Google Apps Script)
      if (CRM_WEBHOOK_URL) {
        fetch(CRM_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rec)
        }).catch(err => console.warn('CRM sync error:', err));
      }

      setTimeout(() => {
        const thanksUrl = `${SITE}${prefix()}events/${w.slug}/thanks/` + (DEMO ? '?demo=1' : '');
        if (window.location.protocol === 'file:') {
          location.hash = `#/events/${w.slug}/thanks`;
        } else {
          try {
            history.pushState({ page: 'thanks', slug: w.slug }, '', thanksUrl);
            route();
          } catch (_) {
            window.location.href = thanksUrl;
          }
        }
      }, 550);
    });
  }

  /* ---------- THANKS PAGE ---------- */
  function viewThanks(slug) {
    const w = byslug(slug); if (!w) return viewNotFound();
    const last = store.get(K.last, null);
    const rec = last && store.get(K.regs, []).find(r => r.registration_id === last.id && r.webinar_id === w.id);
    const c = C(w), d = startOf(w);
    document.title = `${t('thanks.title')} | Sharif Group`;
    const name = rec ? rec.fullName : '—';
    return `<div class="container"><div class="thanks">
      <div class="thanks-icon">${I.check}</div>
      <span class="eyebrow eyebrow--bronze caps">${esc(t('thanks.eyebrow'))}</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 12px">${esc(t('thanks.title'))}</h1>
      <p class="lede" style="color:var(--text)">${last && last.dup ? esc(t('thanks.already')) : esc(t('thanks.text', { name }))}</p>
      ${rec ? `<p style="font-size:13px;color:var(--muted)">${esc(t('thanks.ref'))}: <span class="ref">${esc(rec.registration_id)}</span></p>` : ''}
      <div class="summary-card">
        <div class="summary-top"><span class="eyebrow caps">${esc(t('common.sessionN', { n: pad2(w.session_no) }))} · ${esc(t('common.lang'))}</span><h2>${esc(c.title)}</h2>
          <div style="margin-top:16px">${dateLine(w)}</div><div style="margin-top:14px">${tzHTML(w)}</div></div>
        <div class="summary-body">
          <div class="join-light">${joinAction(w, true)}</div>
          <div class="btn-row"><button class="btn btn--ghost" type="button" data-ics="${w.id}">${I.cal}${esc(t('detail.addCal'))}</button><a class="btn btn--ghost" href="${waShare(w)}" target="_blank" rel="noopener">${I.wa}${esc(t('detail.shareWa'))}</a></div>
          <div><h3 style="margin:6px 0 16px;font-size:16px">${esc(t('thanks.next'))}</h3>
            <ol class="timeline">${t('thanks.steps').map((s, i) => `<li class="${i === 0 ? 'done' : ''}"><strong>${esc(s.t)}</strong><span>${esc(s.d)}</span></li>`).join('')}</ol></div>
        </div>
      </div>
      <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="${SITE + prefix()}events/">${esc(t('thanks.back'))}</a><a class="btn btn--ghost" href="${SITE + prefix()}contact/">${esc(L().nav.bookConsultation)}</a></div>
    </div></div>`;
  }

  /* ---------- ADMIN PREVIEW ---------- */
  let adminTab = 'content', adminPick = 'WEB01';
  function viewAdmin() {
    const A = k => esc(t('admin.' + k));
    document.title = `${t('admin.title')} | Sharif Group`;
    const all = webinars(); const w = all.find(x => x.id === adminPick) || all[0];
    const regs = store.get(K.regs, []);
    const kabulLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ.kabul, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(startOf(w)).replace(' ', 'T');
    const opt = (v, cur, label) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
    const content = `
      <div class="fieldset" style="margin-bottom:18px"><div class="field" style="max-width:420px"><label for="a-pick">${A('pick')}</label>
        <select class="select" id="a-pick">${all.map(x => opt(x.id, w.id, `${x.id} · ${C(x).title}`)).join('')}</select></div></div>
      <form id="adminForm" data-id="${w.id}">
        <fieldset class="fieldset"><legend>${esc(C(w).title)}</legend><div class="admin-grid">
          <div class="field"><label for="a-status">${A('status')}</label><select class="select" id="a-status" name="event_status">${['upcoming', 'live', 'ended', 'postponed', 'cancelled'].map(s => opt(s, w.event_status, t('status.' + s))).join('')}</select></div>
          <div class="field"><label for="a-start">${A('start')}</label><input class="input" id="a-start" name="start" type="datetime-local" value="${kabulLocal}" dir="ltr"></div>
          <div class="field"><label for="a-vis">${A('vis')}</label><select class="select" id="a-vis" name="join_visibility">${opt('public', w.join_visibility, t('demo.public'))}${opt('registrants', w.join_visibility, t('demo.registrants'))}</select></div>
          <div class="field"><label for="a-cap">${A('cap')}</label><input class="input" id="a-cap" name="capacity" type="number" min="1" value="${w.capacity}" dir="ltr"></div>
          <div class="field full"><label for="a-url">${A('url')}</label><input class="input" id="a-url" name="join_url" value="${esc(w.join_url)}" dir="ltr" placeholder="https://…"></div>
          <div class="field" style="align-content:end"><label class="check"><input type="checkbox" name="registration_open"${w.registration_open ? ' checked' : ''}><span>${A('regOpen')}</span></label><label class="check"><input type="checkbox" name="date_confirmed"${w.date_confirmed ? ' checked' : ''}><span>${A('confirmed')}</span></label></div>
          <div class="field full"><label for="a-tfa">${A('titleFa')}</label><input class="input" id="a-tfa" name="title_fa" dir="rtl" value="${esc(w.fa.title)}"></div>
          <div class="field full"><label for="a-ten">${A('titleEn')}</label><input class="input" id="a-ten" name="title_en" dir="ltr" value="${esc(w.en.title)}"></div>
        </div></fieldset>
        <div class="btn-row"><button class="btn btn--bronze" type="submit">${A('save')}</button><a class="btn btn--ghost" href="${pageUrl(w)}">${esc(t('list.details'))}${I.arrow}</a></div>
      </form>`;
    const kp = [[regs.length, 'kRegs'], [regs.filter(r => r.residence_country === 'AF').length, 'kAF'], [regs.filter(r => r.newsletter_optin === 'yes').length, 'kNews'], [regs.filter(r => r.question).length, 'kQ']];
    const cols = t('admin.cols');
    const table = `<div class="kpis">${kp.map(([v, k]) => `<div class="kpi"><b>${n(v)}</b><span>${A(k)}</span></div>`).join('')}</div>
      <div class="toolbar"><span style="font-size:13px;color:var(--muted)">CSV · UTF-8 BOM · Excel</span><button class="btn btn--dark btn--sm" type="button" id="csvBtn"${regs.length ? '' : ' disabled'}>${I.download}${A('export')}</button></div>
      ${regs.length ? `<div class="table-wrap"><table class="tbl"><thead><tr>${['id', 'at', 'name', 'wa', 'email', 'country', 'q', 'news', 'src', 'lang'].map(k => `<th>${esc(cols[k])}</th>`).join('')}</tr></thead><tbody>
        ${regs.slice().reverse().map(r => `<tr><td><span class="ref">${esc(r.registration_id)}</span></td><td dir="ltr">${esc(r.registered_at_utc.replace('T', ' ').slice(0, 16))}</td><td>${esc(r.fullName)}</td><td dir="ltr">${esc(r.phone)}</td><td dir="ltr">${esc(r.email)}</td><td>${esc(r.residence_country)}</td><td style="white-space:normal;min-width:200px">${esc(r.question)}</td><td>${esc(r.newsletter_optin)}</td><td>${esc(r.utm_source)}</td><td>${esc(r.lang)}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${I.user}<p>${A('none')}</p></div>`}`;
    return `<div class="container admin-wrap">
      <span class="eyebrow eyebrow--bronze caps">${I.sliders}CMS · sgcms_webinars</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 8px">${A('title')}</h1><p class="lede" style="margin-bottom:20px">${A('intro')}</p>
      <div class="warn">${A('warn')}</div>
      <div class="tabs" role="tablist"><button role="tab" type="button" data-tab="content" aria-selected="${adminTab === 'content'}">${A('tabContent')}</button><button role="tab" type="button" data-tab="regs" aria-selected="${adminTab === 'regs'}">${A('tabRegs')} (${n(regs.length)})</button></div>
      <div role="tabpanel">${adminTab === 'content' ? content : table}</div>
    </div>`;
  }
  function bindAdmin() {
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => { adminTab = b.dataset.tab; render(); }));
    const pick = $('#a-pick'); if (pick) pick.addEventListener('change', () => { adminPick = pick.value; render(); });
    const f = $('#adminForm');
    if (f) f.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(f), id = f.dataset.id, edits = store.get(K.edits, {});
      const start = String(fd.get('start'));
      let startUtc;
      if (/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(start)) startUtc = new Date(Date.parse(start + ':00Z') - 4.5 * 3600000).toISOString().replace('.000', '');
      edits[id] = Object.assign({}, edits[id], {
        event_status: fd.get('event_status'), join_visibility: fd.get('join_visibility'), join_url: String(fd.get('join_url')).trim(),
        capacity: +fd.get('capacity') || 100,
        registration_open: fd.get('registration_open') === 'on', date_confirmed: fd.get('date_confirmed') === 'on',
        title_fa: String(fd.get('title_fa')).trim(), title_en: String(fd.get('title_en')).trim()
      }, startUtc ? { start_utc: startUtc } : {});
      store.set(K.edits, edits);
      if (id === 'WEB01') { demo.status = edits[id].event_status === 'live' || edits[id].event_status === 'ended' ? edits[id].event_status : 'upcoming'; demo.visibility = edits[id].join_visibility; demo.link = edits[id].join_url ? 'set' : 'soon'; store.set(K.demo, demo); }
      toast(t('admin.saved')); renderShell(); render();
    });
    const csv = $('#csvBtn'); if (csv) csv.addEventListener('click', exportCSV);
  }
  function exportCSV() {
    const regs = store.get(K.regs, []);
    const cols = ['registration_id', 'webinar_id', 'registered_at_utc', 'fullName', 'phone', 'whatsapp_e164', 'email', 'residence_country', 'question', 'newsletter_optin', 'utm_source', 'utm_campaign', 'lang', 'page'];
    const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const body = [cols.join(','), ...regs.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
    download('\ufeff' + body, 'sharif-webinar-registrations.csv', 'text/csv;charset=utf-8');
  }

  /* ---------- INTEGRATION PREVIEW ---------- */
  function viewIntegration() {
    const f = featured(), c = C(f), d = startOf(f);
    const T = k => esc(t('int.' + k));
    document.title = `${t('int.title')} | Sharif Group`;
    const rows = t('int.urlRows');
    const urls = [['/webinars/', '/fa/webinars/  /ar/webinars/  /zh/webinars/'], ['/webinars/{slug}/', '/fa/webinars/{slug}/'], ['/webinars/{slug}/thanks/', '/fa/webinars/{slug}/thanks/']];
    return `<div class="container admin-wrap">
      <span class="eyebrow eyebrow--bronze caps">${I.link}sharifgroup.ae</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 8px">${T('title')}</h1><p class="lede" style="margin-bottom:34px">${T('intro')}</p>
      <div class="int-block"><span class="int-label">${T('nav')}</span><div class="frame"><header class="site-header" style="position:relative">${headerHTML(true)}</header></div></div>
      <div class="int-block"><span class="int-label">${T('home')}</span><div class="frame frame--pad" style="background:var(--sand)">
        <a class="home-banner" href="${pageUrl(f)}"><span class="hb-l">${I.video}<span><b>${esc(t('int.homeT', { title: c.title }))}</b><small>${esc(t('int.homeD', { date: dShort(d, TZ.kabul), time: tm(d, TZ.kabul) }))} · ${esc(t('common.lang'))} · ${esc(t('common.free'))}</small></span></span><span class="btn btn--bronze btn--sm caps">${T('homeBtn')}${I.arrow}</span></a></div></div>
      <div class="int-block"><span class="int-label">${T('blog')}</span><div class="frame frame--pad">
        <div class="blog-end"><div class="be-date"><b>${esc(dayNum(d, TZ.kabul))}</b><span>${esc(monthName(d, TZ.kabul))} · ${tm(d, TZ.kabul)}</span></div>
          <div><span class="eyebrow eyebrow--bronze caps">${I.spark}${T('blogEyebrow')} · ${esc(t('common.free'))}</span><h4>${esc(c.title)}</h4><p>${esc(c.excerpt)}</p><a class="btn btn--bronze btn--sm caps" href="${pageUrl(f)}">${esc(t('list.details'))}${I.arrow}</a></div></div></div></div>
      <div class="int-block"><span class="int-label">${T('urls')}</span><div class="frame"><table class="urlmap"><thead><tr>${t('int.urlCols').map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${esc(r)}</td><td><code>${urls[i][0]}</code></td><td><code>${urls[i][1]}</code></td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
  }

  function viewNotFound() { return `<div class="container thanks"><h1 class="display h-md on-light">404</h1><p><a class="btn btn--dark" href="${SITE + prefix()}events/">${esc(t('thanks.back'))}</a></p></div>`; }

  /* ---------- demo panel ---------- */
  function renderDemoPanel() {
    if (!DEMO) {
      if ($('#demoFab')) $('#demoFab').style.display = 'none';
      if ($('#demoPanel')) $('#demoPanel').style.display = 'none';
      return;
    }
    if ($('#demoFab')) $('#demoFab').style.display = 'inline-flex';
    const D = k => esc(t('demo.' + k));
    const seg = (key, vals) => `<div class="seg">${vals.map(([v, l]) => `<button type="button" data-demo="${key}" data-v="${v}" aria-pressed="${demo[key] === v}">${esc(l)}</button>`).join('')}</div>`;
    const w1 = BASE[0].slug;
    $('#demoFab').innerHTML = `${I.sliders}<span class="fab-l">${D('fab')}</span>`; $('#demoFab').setAttribute('aria-label', t('demo.fab'));
    $('#demoPanel').innerHTML = `<h3>${D('title')}</h3><p>${D('intro')}</p>
      <div class="grp"><span>${D('state')}</span>${seg('status', [['upcoming', t('status.upcoming')], ['live', t('status.live')], ['ended', t('status.ended')]])}</div>
      <div class="grp"><span>${D('linkState')}</span>${seg('link', [['soon', t('demo.linkSoon')], ['set', t('demo.linkSet')]])}</div>
      <div class="grp"><span>${D('visibility')}</span>${seg('visibility', [['public', t('demo.public')], ['registrants', t('demo.registrants')]])}</div>
      <div class="grp"><span>${D('pages')}</span>
        <a class="lnk" href="${SITE + prefix()}events/">${D('list')}</a><a class="lnk" href="${pageUrl(BASE[0])}">${D('detail')}</a><a class="lnk" href="${pageUrl(BASE[0])}thanks/">${D('thanks')}</a><a class="lnk" href="#/admin">${D('admin')}</a><a class="lnk" href="#/integration">${D('integration')}</a></div>
      <button class="btn btn--ghost btn--sm" type="button" id="demoReset">${D('reset')}</button>`;
    $$('[data-demo]').forEach(b => b.addEventListener('click', () => {
      demo[b.dataset.demo] = b.dataset.v; store.set(K.demo, demo);
      const edits = store.get(K.edits, {}); if (edits.WEB01) { delete edits.WEB01.event_status; delete edits.WEB01.join_visibility; delete edits.WEB01.join_url; store.set(K.edits, edits); }
      renderShell(); render(); $('#demoPanel').classList.add('open');
    }));
    $('#demoReset').addEventListener('click', () => { [K.demo, K.edits, K.regs, K.last].forEach(store.del); demo = Object.assign({}, demoDefaults); toast(t('demo.resetDone')); renderShell(); render(); });
  }

  /* ---------- global behaviours ---------- */
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }
  function download(text, name, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function ics(w) {
    const c = C(w), s = startOf(w), e = new Date(s.getTime() + w.duration_min * 60000);
    const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escI = v => String(v).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const pub = linkState(w) === 'ready';
    const desc = `${c.excerpt}\n\n${pub ? w.join_url + '\n' : ''}${pageUrl(w)}`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sharif Group//Webinars//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:${w.id}-${w.start_utc}@sharifgroup.ae`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
      `SUMMARY:${escI(c.title)}`, `DESCRIPTION:${escI(desc)}`, `LOCATION:${escI(pub ? w.join_url : 'Online')}`, `URL:${pageUrl(w)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'];
    download(lines.join('\r\n'), `sharif-webinar-${w.id}.ics`, 'text/calendar;charset=utf-8');
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang')) $$('.lang.open').forEach(b => { b.classList.remove('open'); $('.lang-btn', b).setAttribute('aria-expanded', 'false'); });
    const anchor = e.target.closest('a[href="#register"]');
    if (anchor) { e.preventDefault(); const r = $('#register'); if (r) { r.scrollIntoView({ behavior: 'smooth', block: 'start' }); const fi = $('#f-name'); if (fi) setTimeout(() => fi.focus({ preventScroll: true }), 400); } return; }
    const join = e.target.closest('[data-join]');
    if (join && DEMO && join.getAttribute('href') === SAMPLE_URL) { e.preventDefault(); toast(t('demo.sampleLink')); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) { const v = cp.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast(t('common.copied')), () => toast(v)); return; }
    const ic = e.target.closest('[data-ics]');
    if (ic) { const w = webinars().find(x => x.id === ic.dataset.ics); if (w) ics(w); return; }
    const tt = e.target.closest('[data-toast]');
    if (tt) { toast(t('demo.' + tt.dataset.toast)); return; }
    if (e.target.closest('a[href^="#/"]')) { $('#drawer').classList.remove('open'); }
    const wLink = e.target.closest('a');
    if (wLink && window.location.protocol !== 'file:') {
      const href = wLink.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http') && wLink.target !== '_blank') {
        const p = prefix();
        const baseEvents = (p ? `/${p}events` : '/events');
        const baseWebinars = (p ? `/${p}webinars` : '/webinars');
        if (href.startsWith(baseEvents) || href.startsWith('/events') || href.startsWith(baseWebinars) || href.startsWith('/webinars')) {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            $('#drawer').classList.remove('open');
            if (location.pathname !== href && (location.pathname + '/') !== href && location.pathname !== (href + '/')) {
              try {
                history.pushState(null, '', href);
              } catch (_) {}
            }
            route();
            return;
          }
        }
      }
    }
    const sessionRow = e.target.closest('.session-row');
    if (sessionRow && !e.target.closest('a') && !e.target.closest('button')) {
      sessionRow.classList.toggle('is-open');
    }
  });
  $('#demoFab') && $('#demoFab').addEventListener('click', () => $('#demoPanel').classList.toggle('open'));

  let cdTimer = null;
  function tickCountdowns() {
    const now = Date.now();
    $$('[data-cd]').forEach(el => {
      let ms = Math.max(0, Date.parse(el.dataset.cd) - now);
      const v = { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
      Object.entries(v).forEach(([u, x]) => { const c = $(`[data-u="${u}"]`, el); if (c) c.textContent = pad2(x); });
    });
  }

  /* ---------- router ---------- */
  function parseRoute() {
    // 1. Clean up legacy hash if present on http/https
    if (window.location.protocol !== 'file:' && location.hash && (location.hash.startsWith('#/webinars') || location.hash.startsWith('#/events'))) {
      const cleanSub = location.hash.replace(/^#\/?(webinars|events)\/?/i, '');
      const cleanUrl = `${SITE}${prefix()}events/${cleanSub}${cleanSub && !cleanSub.endsWith('/') ? '/' : ''}${location.search}`;
      try {
        history.replaceState(null, '', cleanUrl);
      } catch (_) {}
    }

    // 2. Pathname support (primary for clean URLs)
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    const segs = path.split('/').filter(Boolean);
    const segsLower = segs.map(s => s.toLowerCase());
    let wIdx = segsLower.indexOf('events');
    if (wIdx === -1) wIdx = segsLower.indexOf('webinars');
    if (wIdx !== -1) {
      const rest = segs.slice(wIdx + 1);
      if (!rest.length || rest[0] === 'index.html' || rest[0] === 'index.php') {
        return { page: 'list', slug: null };
      }
      if (rest[1] === 'thanks') {
        return { page: 'thanks', slug: rest[0] };
      }
      return { page: 'detail', slug: rest[0] };
    }

    // 3. Hash fallback (for demo panels or file: protocol)
    if (location.hash && location.hash.length > 1) {
      const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      const first = p[0] ? p[0].toLowerCase() : '';
      if (first === 'events' || first === 'webinars') {
        if (!p[1]) return { page: 'list', slug: null };
        if (p[2] === 'thanks') return { page: 'thanks', slug: p[1] };
        return { page: 'detail', slug: p[1] };
      }
      if (p[0] === 'admin') return { page: 'admin', slug: null };
      if (p[0] === 'integration') return { page: 'integration', slug: null };
    }

    return { page: 'list', slug: null };
  }
  function routeName() { return parseRoute().page; }
  let timelineScrollHandler = null;
  function updateTimeline() {
    const passportNode = document.getElementById("central-passport-node");
    const track = document.getElementById("timeline-track");
    const steps = document.querySelectorAll(".timeline-step");

    if (!passportNode || !track || steps.length === 0) return;

    const trackRect = track.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    const viewportCenter = window.innerHeight * (isMobile ? 0.45 : 0.5);

    // Calculate max downward travel bound (stops precisely at Step 5 badge)
    const finalStep = steps[steps.length - 1];
    let maxTravel = trackRect.height;
    if (finalStep) {
      const finalBadge = finalStep.querySelector(".step-badge");
      if (finalBadge) {
        const badgeRect = finalBadge.getBoundingClientRect();
        maxTravel = badgeRect.top + (badgeRect.height / 2) - trackRect.top;
      }
    }

    // Terminate central line precisely at the center of the final milestone badge
    const centralLine = track.querySelector(".timeline-central-line");
    if (centralLine && maxTravel > 0) {
      centralLine.style.setProperty("bottom", "auto", "important");
      centralLine.style.setProperty("height", `${maxTravel}px`, "important");
    }

    // Calculate travel relative to track container & clamp precisely
    let relativeY = viewportCenter - trackRect.top;
    relativeY = Math.max(0, Math.min(relativeY, maxTravel));

    // Move passport node smoothly
    passportNode.style.top = `${relativeY}px`;

    // Proximity threshold adapted for mobile vs desktop screens
    const proximityThreshold = isMobile ? 70 : 110;

    // Check proximity to light up badges step by step
    steps.forEach((step) => {
      const badge = step.querySelector(".step-badge");
      if (!badge) return;

      const badgeRect = badge.getBoundingClientRect();
      const badgeCenter = badgeRect.top + badgeRect.height / 2;
      const stepNum = step.dataset.step;

      if (Math.abs(viewportCenter - badgeCenter) < proximityThreshold) {
        // Active Light-Up State (Yellow/Golden Glow)
        badge.classList.remove("bg-neutral-200", "text-neutral-600", "badge-passed-green");
        badge.classList.add("bg-amber-500", "text-neutral-950", "ring-4", "scale-110", "shadow-xl");

        if (stepNum === "5") {
          const label = document.getElementById("congrats-label");
          if (label) {
            label.classList.remove("text-neutral-500");
            label.classList.add("text-amber-600");
          }
        }
      } else if (badgeCenter < viewportCenter) {
        // Passed State
        badge.classList.remove("bg-neutral-200", "text-neutral-600", "bg-amber-500", "ring-4", "scale-110", "shadow-xl");

        if (stepNum === "5") {
          badge.classList.add("bg-amber-500", "text-neutral-950");
        } else {
          badge.classList.add("badge-passed-green");
        }
      } else {
        // Upcoming State
        badge.classList.remove("bg-amber-500", "badge-passed-green", "text-white", "text-neutral-950", "ring-4", "scale-110", "shadow-xl");
        badge.classList.add("bg-neutral-200", "text-neutral-600");

        if (stepNum === "5") {
          const label = document.getElementById("congrats-label");
          if (label) {
            label.classList.remove("text-amber-600");
            label.classList.add("text-neutral-500");
          }
        }
      }
    });
  }

  function initTimelineAnimation() {
    if (timelineScrollHandler) {
      window.removeEventListener("scroll", timelineScrollHandler);
      window.removeEventListener("resize", timelineScrollHandler);
      timelineScrollHandler = null;
    }
    const track = document.getElementById("timeline-track");
    if (!track) return;

    timelineScrollHandler = () => {
      requestAnimationFrame(updateTimeline);
    };

    window.addEventListener("scroll", timelineScrollHandler, { passive: true });
    window.addEventListener("resize", timelineScrollHandler, { passive: true });
    requestAnimationFrame(updateTimeline);
  }

  function render() {
    const r = parseRoute();
    const main = $('#main');
    let html;
    if (r.page === 'list') html = viewList();
    else if (r.page === 'thanks') html = viewThanks(r.slug);
    else if (r.page === 'detail') html = viewDetail(r.slug);
    else if (r.page === 'admin' && DEMO) html = viewAdmin();
    else if (r.page === 'integration' && DEMO) html = viewIntegration();
    else html = viewNotFound();
    main.innerHTML = html;
    bindForm(); if (r.page === 'admin') bindAdmin();
    initHeroSlideshow();
    initTimelineAnimation();
    clearInterval(cdTimer); tickCountdowns(); if ($('[data-cd]')) cdTimer = setInterval(tickCountdowns, 1000);
  }
  function route() { render(); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  window.addEventListener('hashchange', () => { $('#drawer').classList.remove('open'); route(); $('#main').focus({ preventScroll: true }); });
  window.addEventListener('popstate', () => { $('#drawer').classList.remove('open'); route(); });
  window.addEventListener('storage', e => {
    if (e.key === 'sgcms_webinars' || e.key === 'sgcms_webinars_live' || e.key === 'sgcms_webinars_data' || e.key === 'sgcms_webinar_schedule') {
      route();
    }
  });
  window.addEventListener('message', e => {
    if (e.data && (e.data.type === 'CMS_WEBINARS_UPDATED' || e.data.type === 'CMS_PREVIEW_RELOAD')) {
      route();
    }
  });

  renderShell();
  route();
})();
