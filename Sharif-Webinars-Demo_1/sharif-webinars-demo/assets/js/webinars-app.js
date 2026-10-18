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
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>',
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
  function webinars() {
    const edits = store.get(K.edits, {});
    const list = JSON.parse(JSON.stringify(BASE)).map(w => {
      const e = edits[w.id];
      if (e) {
        ['event_status', 'registration_open', 'start_utc', 'date_confirmed', 'join_visibility', 'join_url', 'capacity'].forEach(k => { if (k in e) w[k] = e[k]; });
        if (e.title_fa) w.fa.title = e.title_fa;
        if (e.title_en) w.en.title = e.title_en;
      }
      return w;
    });
    const w1 = list[0];
    w1.event_status = demo.status;
    w1.join_visibility = demo.visibility;
    if (!(edits.WEB01 && 'join_url' in edits.WEB01)) w1.join_url = demo.link === 'set' ? SAMPLE_URL : '';
    if (demo.status === 'ended') { list[1].registration_open = true; w1.registration_open = false; }
    if (demo.status === 'live') w1.registration_open = false;
    return list;
  }
  const byslug = s => webinars().find(w => w.slug === s);
  /* held | locked | soon | ready */
  const linkState = w => w.event_status === 'ended' ? 'held' : (w.join_visibility !== 'public' ? 'locked' : (w.join_url ? 'ready' : 'soon'));
  const C = w => w[lang] || w.en;
  const startOf = w => new Date(w.start_utc);
  const featured = () => webinars().find(w => w.event_status !== 'ended') || webinars()[0];

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
      { h: '#/webinars', l: N.webinars, active: 1, isNew: 1 }
    ];
  }
  function headerHTML(staticCopy) {
    const N = L().nav, F = L().footer, p = prefix();
    const langs = LANGS.map(c => `<button type="button" data-lang="${c}" aria-current="${c === lang}"><span lang="${c}">${esc(I18N[c].meta.name)}</span><small>${c.toUpperCase()}</small></button>`).join('');

    return `<div class="header-inner">
      <a class="brand" href="${SITE + p}" aria-label="Sharif Group"><img src="${LOGO}" alt="Sharif Group" width="42" height="46"></a>
      <span class="brand-sep" aria-hidden="true">|</span>
      <nav class="main-nav" aria-label="Main">
        <!-- Citizenship with Mega Menu -->
        <div class="nav-item has-dd" data-dd="cbi">
          <a class="nav-link caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.citizenship)} ${I.chev}</a>
          <div class="mega-menu" id="mm-cbi">
            <div class="mega-menu-inner">
              <div class="mm-side">
                <p class="mm-title">${N.cbiTitle || 'Citizenship<br>By<br>Investment'}</p>
                <a class="mm-all-btn caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.allCitizenship)}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.caribbeanPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/dominica/"><img src="https://flagcdn.com/dm.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.dominica || 'Dominica | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stkitts/"><img src="https://flagcdn.com/kn.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/"><img src="https://flagcdn.com/ag.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stlucia/"><img src="https://flagcdn.com/lc.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/grenada/"><img src="https://flagcdn.com/gd.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.grenada || 'Grenada | Passport')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.globalPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/vanuatu/"><img src="https://flagcdn.com/vu.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.vanuatu || 'Vanuatu | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/sao-tome-and-principe/"><img src="https://flagcdn.com/st.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.saotome || 'São Tomé and Príncipe | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/nauru/"><img src="https://flagcdn.com/nr.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.cbi?.nauru || 'Republic of Nauru | Passport')}</span></a></li>
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
                <p class="mm-title">${N.rbiTitle || 'Residency<br>By<br>Investment'}</p>
                <a class="mm-all-btn caps" href="${SITE + p}residencybyinvestment/">${esc(N.allResidency)}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.europeanPortfolios)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/residencybyinvestment/portugal/"><img src="https://flagcdn.com/pt.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</span></a></li>
                  <li><a href="${SITE + p}programs/residencybyinvestment/greece/"><img src="https://flagcdn.com/gr.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.rbi?.greece || 'Greece | Golden Visa')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.americasUAE)}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/residencybyinvestment/panama/"><img src="https://flagcdn.com/pa.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.rbi?.panama || 'Panama | Golden Visa')}</span></a></li>
                  <li><a href="${SITE + p}programs/residencybyinvestment/uae/"><img src="https://flagcdn.com/ae.svg" alt="" width="24" height="16" class="flag-icon"><span>${esc(F.rbi?.uae || 'United Arab Emirates | Golden Visa')}</span></a></li>
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
        <a class="nav-link caps is-active" href="#/webinars" aria-current="page">${esc(N.webinars)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>
      </nav>

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
            <li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5 foot-new-row" href="${SITE + p}webinars/"><span data-i18n="footer.webinars">${esc(F.webinars)}</span> <span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[8px] font-bold leading-none inline-flex items-center justify-center shrink-0 tracking-wider" data-i18n="nav.newBadge">${esc(t('common.isNew') || 'New')}</span></a></li>
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
          <a href="#/webinars" class="is-active">${esc(N.webinars)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>
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
    // Desktop hover & click handling for mega menus
    $$('.has-dd').forEach(item => {
      const link = $('.nav-link', item);
      if (link) {
        link.addEventListener('click', e => {
          if (window.innerWidth >= 1024) {
            const isOpen = item.classList.contains('is-open');
            $$('.has-dd').forEach(d => { if (d !== item) d.classList.remove('is-open'); });
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
        $$('.has-dd').forEach(d => d.classList.remove('is-open'));
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
      let targetPath = (c === 'en' ? '' : '/' + c) + '/webinars/';
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
    if (w.registration_open || w.join_visibility === 'public') return `<span class="badge badge--gold">${esc(t('status.regOpen'))}</span>`;
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
    if (st === 'held') return `<div class="held${light ? ' held--light' : ''}">${I.checkCircle}<div><strong>${esc(t('detail.heldTitle'))}</strong><span>${esc(t('detail.heldText'))}</span></div></div>`;
    if (st === 'locked') return `<div class="locked${light ? ' locked--light' : ''}">${I.lock}<div><strong>${esc(t('detail.lockedTitle'))}</strong><br>${esc(t('detail.lockedText'))}</div></div>`;
    if (st === 'soon') return `<span class="btn btn--soon${light ? ' btn--soon-light' : ''} btn--block" role="status">${I.clock}${esc(t('detail.linkSoon'))}</span><p class="note">${I.link}<span>${esc(t('detail.linkSoonNote'))}</span></p>`;
    return `<a class="btn btn--bronze btn--block" href="${esc(w.join_url)}" data-join target="_blank" rel="noopener">${I.video}${esc(live ? t('detail.joinNow') : t('detail.joinBtn'))}</a>
      ${live ? '' : `<p class="note">${I.clock}<span>${esc(t('detail.roomOpens', { time: tm(opens, TZ.kabul) }))}</span></p>`}`;
  }
  const pageUrl = w => `${SITE}${prefix()}webinars/${w.slug}/`;
  const waShare = w => `https://wa.me/?text=${encodeURIComponent(C(w).title + ' — ' + pageUrl(w))}`;

  /* ---------- LIST PAGE ---------- */
  function viewList() {
    const all = webinars(), f = featured(), fc = C(f), d = startOf(f);
    const st = linkState(f);
    const live = f.event_status === 'live';
    const series = all.filter(w => w.series === 'dominica-pilot');
    document.title = L().meta.title;
    return `
    <section class="hero">
      <img class="hero-mark mark-white" src="${LOGO}" alt="" aria-hidden="true">
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
            ${st === 'ready' ? `<a class="btn btn--bronze" href="${esc(f.join_url)}" data-join target="_blank" rel="noopener">${I.video}${esc(live ? t('detail.joinNow') : t('list.join'))}</a>` : ''}
            ${st === 'soon' ? `<span class="btn btn--soon btn--soon-light" role="status">${I.clock}${esc(t('detail.linkSoon'))}</span>` : ''}
            <a class="btn ${st === 'ready' || st === 'soon' ? 'btn--ghost' : 'btn--bronze'}" href="#/webinars/${f.slug}">${esc(t('list.details'))}${I.arrow}</a>
          </div>
        </div>
        <aside class="feature-side">
          <div><div class="side-label caps">${esc(t('list.whenTitle'))}</div>${dateLine(f)}</div>
          ${live ? `<div><span class="badge badge--live"><span class="dot"></span>${esc(t('detail.liveBanner'))}</span></div>` : `<div><div class="side-label caps" style="margin-bottom:10px">${esc(t('list.startsIn'))}</div>${countdownHTML(f)}</div>`}
          ${tzHTML(f)}
        </aside>
      </article>
    </div></section>

    <section class="section section--navy" style="margin-top:96px">
      <div class="container">
        <div class="section-head center">
          <span class="eyebrow caps">${I.spark}${esc(t('list.seriesTag'))}</span>
          <h2 class="display h-lg">${t('list.upTitle')}</h2>
        </div>
        <div class="series-card">
          <div class="series-top">
            <div class="series-id"><div class="series-icon">${I.passport}</div>
              <div><span class="series-tag caps">${esc(t('list.seriesTag'))}</span><h3 class="display h-sm">${esc(t('list.seriesTitle'))}</h3></div></div>
            <span class="badge badge--gold caps">${esc(t('common.free'))} · ${esc(t('common.online'))}</span>
          </div>
          <p>${esc(t('list.seriesText'))}</p>
          ${series.map(w => sessionRow(w)).join('')}
        </div>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container">
        <div class="section-head"><span class="eyebrow eyebrow--bronze caps">${I.phone}${esc(t('list.howEyebrow'))}</span><h2 class="display h-lg on-light">${t('list.howTitle')}</h2></div>
        <div class="steps">${t('list.steps').map((s, i) => `<div class="step"><span class="step-num">${pad2(i + 1)}</span><div class="step-ico">${[I.link, I.user, I.wifi, I.chat][i]}</div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('')}</div>
        <div class="privacy-strip">${I.shield}<div><h3>${esc(t('list.privacyTitle'))}</h3><p>${esc(t('list.privacyText'))}</p></div></div>
      </div>
    </section>

    <section class="section section--white"><div class="container">${ctaBand()}</div></section>`;
  }
  function sessionRow(w) {
    const c = C(w), d = startOf(w);
    return `<div class="session-row">
      <span class="session-no">${pad2(w.session_no)}</span>
      <div class="session-body"><h3>${esc(c.title)}</h3><p>${esc(c.excerpt)}</p>
        <div class="session-meta"><span>${esc(dShort(d, TZ.kabul))} · ${tm(d, TZ.kabul)} ${esc(t('tz.kabul'))}</span><span>${esc(t('common.min', { n: n(w.duration_min) }))}</span></div></div>
      <div class="session-actions">${statusBadge(w)}<a class="btn btn--bronze btn--sm caps" href="#/webinars/${w.slug}">${esc(t('list.sessionCta'))}${I.arrow}</a></div>
    </div>`;
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
    const isFirst = w.session_no === 1;
    document.title = `${c.title} | ${L().nav.webinars} | Sharif Group`;
    const others = webinars().filter(x => x.series === w.series && x.id !== w.id);
    return `
    <section class="hero hero--detail">
      <img class="hero-mark mark-white" src="${LOGO}" alt="" aria-hidden="true">
      <div class="container hero-inner">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE + prefix()}">${esc(t('detail.home'))}</a>${I.crumb}<a href="#/webinars">${esc(L().nav.webinars)}</a>${I.crumb}<span aria-current="page">${esc(t('common.sessionN', { n: pad2(w.session_no) }))}</span></nav>
        <div class="btn-row" style="gap:8px;align-items:center"><span class="eyebrow caps">${esc(t('list.seriesTag'))} · ${esc(t('common.sessionN', { n: pad2(w.session_no) }))}</span>${statusBadge(w)}</div>
        <h1 class="display h-lg">${esc(c.title)}</h1>
        <p class="lede">${esc(c.excerpt)}</p>
        <div class="hero-meta">
          <span>${I.cal}${esc(dLong(d, TZ.kabul))}</span>
          <span>${I.clock}${tm(d, TZ.kabul)} ${esc(t('tz.kabul'))} · ${tm(d, TZ.dubai)} ${esc(t('tz.dubai'))}</span>
          <span>${I.mic}${esc(t('common.lang'))}</span>
          <span>${I.checkCircle}${esc(t('common.free'))} · ${esc(t('common.min', { n: n(w.duration_min) }))}</span>
        </div>
      </div>
    </section>
    <div class="container"><div class="detail">
      <div class="d-join">${joinCard(w)}</div>
      <div class="d-main">
        <section class="block"><h2 class="block-title">${esc(t('detail.about'))}</h2><div class="prose">${c.body.map(p => `<p>${esc(p)}</p>`).join('')}</div></section>
        <section class="block"><h2 class="block-title">${esc(t('detail.learn'))}</h2><ul class="learn">${c.outcomes.map(o => `<li>${I.check}<span>${esc(o)}</span></li>`).join('')}</ul></section>
        <section class="block"><h2 class="block-title">${esc(t('detail.agenda'))}</h2><ol class="agenda">${t('detail.agendaItems').map(a => `<li><span class="ag-time">${esc(a.t)} ${esc(t('detail.minutes'))}</span><span class="ag-label">${esc(a.l)}<span class="ag-who">${esc(a.w)}</span></span></li>`).join('')}</ol></section>
        <section class="block"><h2 class="block-title">${esc(t('detail.speakers'))}</h2><div class="speakers">
          ${[['expert', I.user], ['host', I.mic]].map(([k, ic]) => `<div class="speaker"><div class="avatar">${ic}</div><div><h4>${esc(t('detail.' + k + 'Name'))}</h4><p>${esc(t('detail.' + k + 'Role'))}</p><span class="tbd">${esc(t('detail.tbd'))}</span></div></div>`).join('')}
        </div></section>
        <section class="block"><h2 class="block-title">${esc(t('detail.privacy'))}</h2><ul class="privacy-list">${t('detail.privacyItems').map(p => `<li>${I.shield}<span>${esc(p)}</span></li>`).join('')}</ul></section>
        <section class="block faq"><h2 class="block-title">${esc(t('detail.faq'))}</h2>${t('detail.faqs').map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}${I.plus}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
        ${others.length ? `<section class="block"><h2 class="block-title">${esc(t('detail.other'))}</h2><div class="section--navy" style="border-radius:22px;padding:8px 14px 18px">${others.map(sessionRow).join('')}</div></section>` : ''}
      </div>
      <div class="d-form" id="register">${formCard(w)}</div>
    </div></div>
    <section class="section section--cream section--tight"><div class="container">${ctaBand()}</div></section>`;
  }
  function joinCard(w) {
    const st = linkState(w), live = w.event_status === 'live', held = st === 'held';
    return `<div class="card card--dark">
      <div class="join-head">${statusBadge(w)}${w.join_visibility === 'public' && !held ? `<span class="badge badge--gold">${I.link.replace('<svg', '<svg width="12" height="12"')}${esc(t('status.publicLink'))}</span>` : ''}</div>
      ${held ? '' : `<h3>${esc(t('detail.joinTitle'))}</h3>`}
      ${held ? '' : `<p class="sub">${esc(w.join_visibility === 'public' ? t('detail.joinPublic') : t('form.subPrivate'))}</p>`}
      <div style="margin-bottom:18px">${dateLine(w)}</div>
      ${live || held ? '' : `<div style="margin-bottom:18px">${countdownHTML(w)}</div>`}
      ${held ? '' : `<div style="margin-bottom:20px">${tzHTML(w)}</div>`}
      ${joinAction(w)}
      ${held ? `<a class="btn btn--bronze btn--block" style="margin-top:16px" href="${SITE + prefix()}contact/">${esc(t('detail.consultBtn'))}${I.arrow}</a>` : `<div class="mini-links">
        ${st === 'ready' ? `<button class="btn btn--ghost-light btn--sm" type="button" data-copy="${esc(w.join_url)}">${I.copy}${esc(t('common.copy'))}</button>` : ''}
        <button class="btn btn--ghost-light btn--sm" type="button" data-ics="${w.id}">${I.cal}${esc(t('detail.addCal'))}</button>
        <a class="btn btn--ghost-light btn--sm" href="${waShare(w)}" target="_blank" rel="noopener">${I.wa}${esc(t('detail.shareWa'))}</a>
      </div>`}
      ${w.registration_open && st !== 'locked' && !held ? `<p class="note">${I.wa}<a href="#register" style="text-decoration:underline;text-underline-offset:3px">${esc(t('list.remind'))}</a></p>` : ''}
    </div>`;
  }
  function formCard(w) {
    const pub = w.join_visibility === 'public';
    if (w.event_status === 'ended') return '';
    if (!w.registration_open) {
      const msg = w.event_status === 'upcoming' ? t('detail.notOpen', { n: n(w.session_no - 1) }) : t('form.closed');
      return `<div class="card"><h3>${esc(t('form.title'))}</h3><div class="closed-msg">${esc(msg)}</div></div>`;
    }
    const F = k => esc(t('form.' + k));
    const dial = DIAL.map(([c, k]) => `<option value="${c}">${c} ${k}</option>`).join('');
    const ctry = Object.entries(t('form.countries')).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
    return `<div class="card">
      <h3>${F('title')}</h3><p class="sub">${esc(pub ? t('form.subPublic') : t('form.subPrivate'))}</p>
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
        <button class="btn btn--bronze btn--block" type="submit">${F('submit')}</button>
        <p class="consent-note">${I.shield}<span>${F('privacy')}</span></p>
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

      let rec = dup;
      if (!dup) {
        rec = {
          form_id: 'webinar-registration',
          registration_id: 'REG-' + w.id + '-' + Date.now().toString(36).toUpperCase().slice(-6),
          webinar_id: w.id, webinar_slug: w.slug, webinar_start_utc: w.start_utc,
          fullName: name, dialCode: dial, phone: `${dial} ${local}`, whatsapp_e164: e164,
          email, residence_country: country, question,
          newsletter_optin: fd.get('newsletter_optin') === 'yes' ? 'yes' : 'no',
          utm_source: allowedSrc.includes(src) ? src : (src ? 'unknown' : 'website'),
          utm_campaign: params.get('utm_campaign') || w.utm_campaign,
          lang, registered_at_utc: new Date().toISOString(),
          source: pageUrl(w), page: `/${prefix()}webinars/${w.slug}/`
        };
        regs.push(rec); store.set(K.regs, regs);
      }
      store.set(K.last, { id: rec.registration_id, dup: !!dup });

      if (CRM_WEBHOOK_URL) {
        fetch(CRM_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rec)
        }).catch(err => console.warn('CRM sync error:', err));
      }

      setTimeout(() => {
        const thanksUrl = `${SITE}${prefix()}webinars/${w.slug}/thanks/` + (DEMO ? '?demo=1' : '');
        if (window.location.protocol === 'file:') {
          location.hash = `#/webinars/${w.slug}/thanks`;
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
      <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="${SITE + prefix()}webinars/">${esc(t('thanks.back'))}</a><a class="btn btn--ghost" href="${SITE + prefix()}contact/">${esc(L().nav.bookConsultation)}</a></div>
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
        <div class="btn-row"><button class="btn btn--bronze" type="submit">${A('save')}</button><a class="btn btn--ghost" href="#/webinars/${w.slug}">${esc(t('list.details'))}${I.arrow}</a></div>
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
        <a class="home-banner" href="#/webinars/${f.slug}"><span class="hb-l">${I.video}<span><b>${esc(t('int.homeT', { title: c.title }))}</b><small>${esc(t('int.homeD', { date: dShort(d, TZ.kabul), time: tm(d, TZ.kabul) }))} · ${esc(t('common.lang'))} · ${esc(t('common.free'))}</small></span></span><span class="btn btn--bronze btn--sm caps">${T('homeBtn')}${I.arrow}</span></a></div></div>
      <div class="int-block"><span class="int-label">${T('blog')}</span><div class="frame frame--pad">
        <div class="blog-end"><div class="be-date"><b>${esc(dayNum(d, TZ.kabul))}</b><span>${esc(monthName(d, TZ.kabul))} · ${tm(d, TZ.kabul)}</span></div>
          <div><span class="eyebrow eyebrow--bronze caps">${I.spark}${T('blogEyebrow')} · ${esc(t('common.free'))}</span><h4>${esc(c.title)}</h4><p>${esc(c.excerpt)}</p><a class="btn btn--bronze btn--sm caps" href="#/webinars/${f.slug}">${esc(t('list.details'))}${I.arrow}</a></div></div></div></div>
      <div class="int-block"><span class="int-label">${T('urls')}</span><div class="frame"><table class="urlmap"><thead><tr>${t('int.urlCols').map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td>${esc(r)}</td><td><code>${urls[i][0]}</code></td><td><code>${urls[i][1]}</code></td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
  }

  function viewNotFound() { return `<div class="container thanks"><h1 class="display h-md on-light">404</h1><p><a class="btn btn--dark" href="#/webinars">${esc(t('thanks.back'))}</a></p></div>`; }

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
        <a class="lnk" href="#/webinars">${D('list')}</a><a class="lnk" href="#/webinars/${w1}">${D('detail')}</a><a class="lnk" href="#/webinars/${w1}/thanks">${D('thanks')}</a><a class="lnk" href="#/admin">${D('admin')}</a><a class="lnk" href="#/integration">${D('integration')}</a></div>
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
    // 1. Hash support
    if (location.hash && location.hash.length > 1) {
      const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      if (p[0] === 'webinars') {
        if (!p[1]) return { page: 'list', slug: null };
        if (p[2] === 'thanks') return { page: 'thanks', slug: p[1] };
        return { page: 'detail', slug: p[1] };
      }
      if (p[0] === 'admin') return { page: 'admin', slug: null };
      if (p[0] === 'integration') return { page: 'integration', slug: null };
    }
    // 2. Pathname support
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    const segs = path.split('/').filter(Boolean);
    const wIdx = segs.indexOf('webinars');
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
    return { page: 'list', slug: null };
  }
  function routeName() { return parseRoute().page; }
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
    clearInterval(cdTimer); tickCountdowns(); if ($('[data-cd]')) cdTimer = setInterval(tickCountdowns, 1000);
  }
  function route() { render(); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  window.addEventListener('hashchange', () => { $('#drawer').classList.remove('open'); route(); $('#main').focus({ preventScroll: true }); });
  window.addEventListener('popstate', () => { $('#drawer').classList.remove('open'); route(); });

  renderShell();
  route();
})();
