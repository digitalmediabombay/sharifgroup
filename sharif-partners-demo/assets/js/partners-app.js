/* ==========================================================================
   Sharif Group — "Become a Partner" section · interactive demo
   Vanilla JS, no dependencies, works from file:// or any static host.
   DEMO ONLY: applications are stored in this browser (localStorage) and the
   payload is printed to the console in the shape the live site's forms.js
   sends to the CRM webhook (form_id: "partner-application"). Nothing leaves
   the browser.
   ========================================================================== */
(() => {
  'use strict';

  const LANGS = ['fa', 'en', 'ar', 'zh'];
  const SITE = 'https://www.sharifgroup.ae/';
  const FOOTER_VIDEO = 'assets/videos/footer_bg_e58bba71.mp4';
  const FOOTER_LOGO = 'assets/images/vector_2d09c4bb.svg';
  const IMC_LOGO = 'assets/images/imclogo.webp';
  let footerCanvasAnimId = null;
  const DIAL = [['+971', 'AE'], ['+93', 'AF'], ['+98', 'IR'], ['+90', 'TR'], ['+92', 'PK'], ['+91', 'IN'], ['+966', 'SA'], ['+974', 'QA'], ['+965', 'KW'], ['+968', 'OM'], ['+973', 'BH'], ['+20', 'EG'], ['+86', 'CN'], ['+852', 'HK'], ['+7', 'RU/KZ'], ['+44', 'GB'], ['+49', 'DE'], ['+1', 'US/CA'], ['+61', 'AU']];
  const I18N = window.PARTNER_I18N;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const mem = {};
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  };
  const K = { lang: 'sgp.lang', apps: 'sgp.applications', last: 'sgp.last' };

  const urlLang = new URLSearchParams(location.search).get('lang');
  let lang = LANGS.includes(urlLang) ? urlLang : (LANGS.includes(store.get(K.lang)) ? store.get(K.lang) : 'fa');
  const L = () => I18N[lang];
  function t(path, vars) {
    let v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), L().partners);
    if (v == null) v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), I18N.en.partners);
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    return v;
  }
  const loc = () => ({ fa: 'fa-IR', ar: 'ar-AE', zh: 'zh-CN', en: 'en-GB' }[lang]);
  const n = x => new Intl.NumberFormat(loc()).format(x);
  const pad2 = x => new Intl.NumberFormat(loc(), { minimumIntegerDigits: 2 }).format(x);
  const prefix = () => (lang === 'en' ? '' : lang + '/');

  const I = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
    handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.6A5 5 0 0 1 22 19.5"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    passport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };
  const LOGO = 'assets/images/logo.svg';

  /* ---------- shell ---------- */
  function navItems() {
    const N = L().nav, p = prefix();
    return [
      { h: SITE + p + 'citizenshipbyinvestment/', l: N.citizenship, dd: 1 },
      { h: SITE + p + 'residencybyinvestment/', l: N.residency, dd: 1 },
      { h: SITE + p + 'realestate/', l: N.moreServices, dd: 1 },
      { h: SITE + p + 'aboutus/', l: N.aboutUs, dd: 1, about: 1, active: 1 },
      { h: SITE + p + 'contact/', l: N.contact },
      { h: SITE + p + 'blog/', l: N.blog },
      { h: SITE + p + 'webinars/', l: N.webinars }
    ];
  }
  function aboutMenu(open) {
    const N = L().nav, p = prefix();
    return `<div class="dd-menu${open ? ' dd-open' : ''}" role="menu">
      <a href="${SITE + p}aboutus/">${esc(N.aboutSharif)}</a><a href="${SITE + p}aboutus/">${esc(N.aboutAli)}</a><a href="${SITE + p}aboutus/">${esc(N.socialResp)}</a>
      <a class="dd-new" href="#/partners" aria-current="page">${I.handshake}<span>${esc(N.becomePartner)}</span><span class="nav-new">${esc(t('common.isNew'))}</span></a></div>`;
  }
  function headerHTML(staticCopy) {
    const N = L().nav, p = prefix();
    const items = navItems().map(i => i.about
      ? `<div class="dd${staticCopy ? ' dd-static' : ''}"><a class="caps is-active" href="${i.h}" aria-haspopup="true">${esc(i.l)}${I.chev}</a>${aboutMenu(staticCopy)}</div>`
      : `<a class="caps" href="${i.h}">${esc(i.l)}${i.dd ? I.chev : ''}</a>`).join('');
    const langs = LANGS.map(c => `<button type="button" data-lang="${c}" aria-current="${c === lang}"><span lang="${c}">${esc(I18N[c].meta.name)}</span><small>${c.toUpperCase()}</small></button>`).join('');
    return `<div class="header-inner">
      <a class="brand" href="${SITE + p}" aria-label="Sharif Group"><img src="${LOGO}" alt="Sharif Group" width="42" height="46"></a>
      <span class="brand-sep" aria-hidden="true"></span>
      <nav class="main-nav" aria-label="Main">${items}</nav>
      <div class="header-actions">
        <a class="pill pill--bronze caps" href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityChecker)}</a>
        <a class="pill caps" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a>
        <div class="lang"${staticCopy ? '' : ' id="langBox"'}>
          <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false">${I.globe}<span>${esc(L().meta.code)}</span>${I.chev}</button>
          <div class="lang-menu" role="menu">${langs}</div>
        </div>
        <button class="burger" type="button" aria-label="Menu" aria-expanded="false"${staticCopy ? '' : ' id="burger"'}>${I.menu}</button>
      </div></div>`;
  }
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
        crossfadeAlpha = 0;
      }
      if (isFading) {
        crossfadeAlpha += 0.035;
        if (crossfadeAlpha >= 1) {
          crossfadeAlpha = 1;
          isFading = false;
          activeVideo.pause();
          const temp = activeVideo;
          activeVideo = standbyVideo;
          standbyVideo = temp;
        }
      }
      try {
        if (activeVideo.readyState >= 2) {
          ctx.globalAlpha = 1.0;
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
        }
        if (isFading && standbyVideo.readyState >= 2) {
          ctx.globalAlpha = crossfadeAlpha;
          ctx.drawImage(standbyVideo, 0, 0, canvas.width, canvas.height);
        }
      } catch (err) {}
      footerCanvasAnimId = requestAnimationFrame(renderFrame);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isFooterVisible = entry.isIntersecting;
        if (isFooterVisible) {
          resizeCanvas();
          activeVideo.play().catch(() => {});
          if (!footerCanvasAnimId) footerCanvasAnimId = requestAnimationFrame(renderFrame);
        } else {
          activeVideo.pause();
          standbyVideo.pause();
          if (footerCanvasAnimId) {
            cancelAnimationFrame(footerCanvasAnimId);
            footerCanvasAnimId = null;
          }
        }
      });
    }, { rootMargin: "250px" });

    const footerElem = document.getElementById("siteFooter");
    if (footerElem) observer.observe(footerElem);
  }

  function footerHTML() {
    const F = L().footer || {}, p = prefix();
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

      <!-- FOOTER CONTENT (MATCHING LIVE WEBSITE 5-COLUMN FOOTER EXACTLY) -->
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
            <p class="flex items-start"><i class="fa-solid fa-location-dot mt-1 mr-3 text-luxury-gold text-sm foot-ico"></i> <span>${esc(F.address || '116, The Binary Tower, Business Bay, Dubai, United Arab Emirates')}</span></p>
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
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-6 foot-col-title mb-6">${esc(F.quickLinks || 'Quick Links')}</p>
          <ul class="space-y-2.5 text-xs text-neutral-300 foot-link-list space-y-2.5">
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}">${esc(F.home || 'Home')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}aboutus/">${esc(F.aboutSharif || 'About | Sharif Group')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}about-founder/">${esc(F.aboutAli || 'About | Ali Sharif')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}socialresponsibility/">${esc(F.socialResp || 'Social Responsibility')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}citizenshipbyinvestment/">${esc(F.citizenshipPrograms || 'Citizenship Programs')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}residencybyinvestment/">${esc(F.residencyPrograms || 'Residency Programs')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}realestate/">${esc(F.realEstate || 'Real Estate')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}educationaladvisory/">${esc(F.educationalAdvisory || 'Educational Advisory')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}contact/">${esc(F.contactUs || 'Contact Us')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}blog/">${esc(F.insightsBlog || 'Insights & Blog')}</a></li>
            <li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5 foot-new-row" href="${SITE + p}events/"><span>${esc(F.webinars || 'Events')}</span> <span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[8px] font-bold leading-none inline-flex items-center justify-center shrink-0 tracking-wider">${esc(t('common.isNew') || 'New')}</span></a></li>
            <li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5 foot-new-row is-active" href="#/partners" style="color:var(--bronze);font-weight:700;"><span>${esc(F.partnerWithUs || 'Partner With Us')}</span> <span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[8px] font-bold leading-none inline-flex items-center justify-center shrink-0 tracking-wider">${esc(t('common.isNew') || 'New')}</span></a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}eligibilitychecker/">${esc(F.eligibilityChecker || 'Eligibility Checker')}</a></li>
          </ul>
        </div>

        <!-- Col 3: Citizenship Programs -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-4 foot-col-title mb-4">${esc(F.citizenshipProgramsCol || 'Citizenship Programs')}</p>
          <ul class="space-y-2 text-xs text-neutral-300 foot-link-list space-y-2">
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/dominica/">${esc(F.cbi?.dominica || 'Dominica | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/stkitts/">${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/">${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/stlucia/">${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/grenada/">${esc(F.cbi?.grenada || 'Grenada | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/vanuatu/">${esc(F.cbi?.vanuatu || 'Vanuatu | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/sao-tome-and-principe/">${esc(F.cbi?.saotome || 'São Tomé and Príncipe | Passport')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/citizenshipbyinvestment/nauru/">${esc(F.cbi?.nauru || 'Republic of Nauru | Passport')}</a></li>
          </ul>
        </div>

        <!-- Col 4: Residency & Other Services -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-4 foot-col-title mb-4">${esc(F.residencyProgramsCol || 'Residency Programs')}</p>
          <ul class="space-y-2 text-xs text-neutral-300 mb-6 foot-link-list space-y-2 mb-6">
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/residencybyinvestment/portugal/">${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/residencybyinvestment/greece/">${esc(F.rbi?.greece || 'Greece | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/residencybyinvestment/panama/">${esc(F.rbi?.panama || 'Panama | Golden Visa')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}programs/residencybyinvestment/uae/">${esc(F.rbi?.uae || 'United Arab Emirates | Golden Visa')}</a></li>
          </ul>
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-3 foot-col-title mb-3">${esc(F.otherServices || 'Other Services')}</p>
          <ul class="space-y-2 text-xs text-neutral-300 foot-link-list space-y-2">
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}realestate/">${esc(F.realEstate || 'Real Estate')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}educationaladvisory/">${esc(F.educationalAdvisory || 'Educational Advisory')}</a></li>
          </ul>
        </div>

        <!-- Col 5: Legal Frameworks -->
        <div class="foot-col">
          <p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-6 foot-col-title mb-6">${esc(F.legalFrameworks || 'Legal Frameworks')}</p>
          <ul class="space-y-3 text-xs text-neutral-300 foot-link-list space-y-3">
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}privacypolicy/">${esc(F.privacyPolicy || 'Privacy Policy')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}termsofuse/">${esc(F.termsOfUse || 'Terms of Use')}</a></li>
            <li><a class="hover:text-luxury-gold transition" href="${SITE + p}cookiepolicy/">${esc(F.cookiePolicy || 'Cookie Policy')}</a></li>
          </ul>
        </div>
      </div>

      <!-- Foot Bottom Bar -->
      <div class="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-700/50 text-[11px] text-neutral-400 font-light relative z-30 foot-bottom-bar">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 foot-bottom-inner">
          <p>${esc(F.allRightsReserved || '© 2026 Sharif Group. All Rights Reserved.')}</p>
          <p class="text-xs foot-credit">
            <span>${esc(F.designedBy || 'Designed and Developed by')}</span> <a class="font-bold hover:underline text-white dmb-link" href="https://www.digitalmediabombay.com" target="_blank" rel="noopener noreferrer">Digital Media <span class="text-[#e4aa25]">Bombay</span></a>
          </p>
        </div>
      </div>`;
  }
  function renderShell() {
    const M = L().meta, F = L().footer, N = L().nav, p = prefix();
    document.documentElement.lang = lang;
    document.documentElement.dir = M.dir;
    document.body.className = 'lang-' + lang;
    $('#demoBar').innerHTML = `<strong>${esc(t('common.demoStrong'))}</strong>${esc(t('common.demoText'))}`;
    $('.skip').textContent = t('common.skip');

    // Mount Universal Navbar
    if (typeof window.mountUniversalNavbar === 'function') {
      window.mountUniversalNavbar('#siteHeader');
      const legacyDrawer = $('#drawer');
      if (legacyDrawer) legacyDrawer.style.display = 'none';
    } else {
      $('#siteHeader').innerHTML = headerHTML(false);
      $('#drawer').innerHTML = navItems().map(i => `<a href="${i.h}">${esc(i.l)}</a>${i.about ? `<a class="drawer-sub is-active" href="#/partners">${esc(N.becomePartner)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>` : ''}`).join('') +
        `<div class="drawer-ctas"><a href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityChecker)}</a><a class="solid" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a></div>`;
    }

    $('#siteFooter').innerHTML = footerHTML();
    initFooterCanvas();
    $('meta[name="description"]').setAttribute('content', M.description);

    const box = $('#langBox'), btn = box ? $('.lang-btn', box) : null;
    if (btn) {
      btn.addEventListener('click', e => { e.stopPropagation(); const o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      $$('[data-lang]', box).forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    }
    const bg = $('#burger');
    if (bg) {
      bg.addEventListener('click', () => { const dr = $('#drawer'); dr.style.top = Math.max(0, $('#siteHeader').getBoundingClientRect().bottom) + 'px'; const o = dr.classList.toggle('open'); bg.setAttribute('aria-expanded', o); bg.innerHTML = o ? I.x : I.menu; });
    }
    renderDemoPanel();
  }
  function setLang(c) {
    lang = c; store.set(K.lang, c);
    const u = new URL(location.href); u.searchParams.set('lang', c); history.replaceState(null, '', u);
    renderShell();
    if (typeof window.mountUniversalNavbar === 'function') {
      window.mountUniversalNavbar('#siteHeader');
    }
    route();
  }
  window.__SG_ON_LANG_CHANGE__ = setLang;

  /* ---------- PARTNER PAGE ---------- */
  const typeIcon = { agency: I.building, firm: I.briefcase, individual: I.user };
  const whyIcons = [I.headset, I.file, I.chart, I.cap, I.book, I.pin];
  function viewPartners() {
    document.title = L().meta.title;
    const P = k => t(k);
    return `
    <section class="hero hero--compact">
      <img class="hero-mark mark-white" src="${LOGO}" alt="" aria-hidden="true">
      <div class="container hero-inner">
        <span class="eyebrow caps">${I.handshake}${esc(P('hero.eyebrow'))}</span>
        <h1 class="display h-xl" style="margin-top:14px">${P('hero.title')}</h1>
        <p class="hero-sub caps">${esc(P('hero.sub'))}</p>
        <p class="lede">${esc(P('hero.lede'))}</p>
        <div class="btn-row" style="justify-content:center;margin-top:26px">
          <button class="btn btn--bronze" type="button" data-scroll="apply">${esc(P('hero.apply'))}${I.down}</button>
        </div>
      </div>
    </section>

    <section class="section section--cream" id="apply">
      <div class="container apply-grid">
        <div class="intro-col">
          <h2 class="intro-h">${esc(P('who.title'))}</h2>
          <ul class="who-list">${P('who.items').map(w => `<li><span class="wl-ico">${typeIcon[w.k]}</span><div><strong>${esc(w.t)}</strong><span>${esc(w.d)}</span></div></li>`).join('')}</ul>
          <h2 class="intro-h">${esc(P('steps.title'))}</h2>
          <ol class="mini-steps">${P('steps.items').map((st, i) => `<li><span class="ms-n">${pad2(i + 1)}</span><div><strong>${esc(st.t)}</strong><span>${esc(st.d)}</span></div></li>`).join('')}</ol>
        </div>
        <div class="card apply-form"><h2 class="form-title">${esc(P('form.title').replace(/<\/?em>/g, ''))}</h2><p class="sub">${esc(P('form.sub'))}</p>${formHTML()}</div>
      </div>
    </section>`;
  }
  function formHTML() {
    const F = k => esc(t('form.' + k));
    const types = Object.entries(t('form.types')).map(([k, v]) => `<label class="type-card"><input type="radio" name="partner_type" value="${k}"><span class="tc-ico">${typeIcon[k]}</span><span class="tc-l">${esc(v)}</span></label>`).join('');
    const dial = DIAL.map(([c, k]) => `<option value="${c}">${c} ${k}</option>`).join('');
    return `<form class="form" id="partnerForm" novalidate>
      <div class="form-alert" role="alert" id="formAlert">${F('alert')}</div>
      <fieldset class="field" id="f-type-wrap"><legend class="label">${F('type')}<span class="req">*</span></legend><div class="type-grid">${types}</div><span class="err">${F('errType')}</span></fieldset>
      <div class="form-2">
        <div class="field"><label for="f-name">${F('name')}<span class="req">*</span></label><input class="input" id="f-name" name="fullName" autocomplete="name" maxlength="80"><span class="err">${F('errName')}</span></div>
        <div class="field" id="company-field"><label for="f-company">${F('company')}<span class="req">*</span></label><input class="input" id="f-company" name="company" autocomplete="organization" maxlength="120"><span class="hint">${F('companyHint')}</span><span class="err">${F('errCompany')}</span></div>
      </div>
      <div class="form-2">
        <div class="field"><label for="f-country">${F('country')}<span class="req">*</span></label><input class="input" id="f-country" name="country" autocomplete="country-name" maxlength="60"><span class="err">${F('errCountry')}</span></div>
        <div class="field"><label for="f-email">${F('email')}<span class="req">*</span></label><input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" dir="ltr"><span class="err">${F('errEmail')}</span></div>
      </div>
      <div class="field"><label for="f-phone">${F('wa')}<span class="req">*</span></label><div class="phone"><select class="select" id="f-dial" name="dialCode" aria-label="Country code">${dial}</select><input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national"></div><span class="err">${F('errPhone')}</span></div>
      <div class="field"><label for="f-msg">${F('message')}<span class="opt">(${esc(t('common.optional'))})</span></label><textarea class="textarea" id="f-msg" name="message" maxlength="1000" rows="3"></textarea></div>
      <div class="field" id="consent-field"><label class="check"><input type="checkbox" id="f-consent" name="consent" value="yes"><span>${F('consent')}<span class="req">*</span></span></label><span class="err">${F('errConsent')}</span></div>
      <div class="hp" aria-hidden="true"><label>Company website<input name="hp_url" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn--bronze btn--block" type="submit">${F('submit')}</button>
      <p class="consent-note">${I.shield}<span>${F('note')} ${F('privacy')}</span></p>
    </form>`;
  }
  const toLatin = s => String(s || '').replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
  function bindForm(preType) {
    const form = $('#partnerForm'); if (!form) return;
    const syncCompany = () => {
      const tp = (form.querySelector('input[name="partner_type"]:checked') || {}).value;
      const cf = $('#company-field'); cf.classList.toggle('is-optional', tp === 'individual');
      $('.req', cf).style.display = tp === 'individual' ? 'none' : '';
    };
    $$('input[name="partner_type"]', form).forEach(r => r.addEventListener('change', syncCompany));
    if (preType) { const r = form.querySelector(`input[name="partner_type"][value="${preType}"]`); if (r) { r.checked = true; syncCompany(); } }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('hp_url')) return;
      const type = String(fd.get('partner_type') || '');
      const name = String(fd.get('fullName') || '').trim();
      const company = String(fd.get('company') || '').trim();
      const country = String(fd.get('country') || '').trim();
      const dial = String(fd.get('dialCode'));
      const local = toLatin(fd.get('phone')).replace(/[^\d]/g, '').replace(/^0+/, '');
      const email = toLatin(String(fd.get('email') || '').trim()).toLowerCase();
      const checks = [
        ['f-type-wrap', !!type], ['f-name', name.length >= 2], ['f-company', type === 'individual' || company.length >= 2],
        ['f-country', country.length >= 2], ['f-phone', /^\d{6,13}$/.test(local)], ['f-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)],
        ['consent-field', fd.get('consent') === 'yes']
      ];
      let first = null;
      checks.forEach(([id, ok]) => {
        const el = $('#' + id); const field = el.classList.contains('field') ? el : el.closest('.field');
        field.classList.toggle('has-err', !ok);
        if (el.matches('input,select,textarea')) el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !first) first = el.matches('input,select,textarea') ? el : (field.querySelector('input') || field);
      });
      $('#formAlert').classList.toggle('show', !!first);
      if (first) { first.focus(); first.scrollIntoView({ block: 'center' }); return; }
      const apps = store.get(K.apps, []);
      const dup = apps.find(a => a.email === email);
      const btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = t('form.sending');
      setTimeout(() => {
        let rec = dup;
        if (!dup) {
          rec = {
            form_id: 'partner-application',
            application_id: 'PAR-' + Date.now().toString(36).toUpperCase().slice(-6),
            submitted_at_utc: new Date().toISOString(),
            partner_type: type, fullName: name, company, country,
            dialCode: dial, phone: `${dial} ${local}`, whatsapp_e164: dial + local, email,
            message: String(fd.get('message') || '').trim(), consent: 'yes', lang,
            source: `${SITE}${prefix()}partners/`, page: `/${prefix()}partners/`
          };
          apps.push(rec); store.set(K.apps, apps);
          console.info('[Sharif partners demo] Payload that production would POST to CRM_WEBHOOK_URL (forms.js):', rec);
        }
        store.set(K.last, { id: rec.application_id, dup: !!dup });
        location.hash = '#/partners/thanks';
      }, 500);
    });
  }

  /* ---------- THANKS ---------- */
  function viewThanks() {
    const last = store.get(K.last, null);
    const rec = last && store.get(K.apps, []).find(a => a.application_id === last.id);
    document.title = `${t('thanks.eyebrow')} | Sharif Group`;
    return `<div class="container"><div class="thanks">
      <div class="thanks-icon">${I.check}</div>
      <span class="eyebrow eyebrow--bronze caps">${esc(t('thanks.eyebrow'))}</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 12px">${esc(t('thanks.title', { name: rec ? rec.fullName : '' }))}</h1>
      <p class="lede" style="color:var(--text)">${esc(last && last.dup ? t('thanks.already') : t('thanks.text'))}</p>
      ${rec ? `<p style="font-size:13px;color:var(--muted)">${esc(t('thanks.ref'))}: <span class="ref">${esc(rec.application_id)}</span></p>` : ''}
      <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="#/partners">${esc(t('thanks.back'))}</a><a class="btn btn--ghost" href="${SITE + prefix()}">${esc(t('thanks.home'))}</a></div>
    </div></div>`;
  }

  /* ---------- ADMIN ---------- */
  function viewAdmin() {
    const A = k => esc(t('admin.' + k));
    document.title = `${t('admin.title')} | Sharif Group`;
    const apps = store.get(K.apps, []);
    const cols = t('admin.cols'), types = t('form.types');
    const kp = [[apps.length, A('kTotal')], ...['agency', 'firm', 'individual'].map(k => [apps.filter(a => a.partner_type === k).length, esc(types[k])])];
    return `<div class="container admin-wrap">
      <span class="eyebrow eyebrow--bronze caps">${I.sliders}Google Sheet · Partner_Applications</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 8px">${A('title')}</h1><p class="lede" style="margin-bottom:20px">${A('intro')}</p>
      <div class="warn">${A('warn')}</div>
      <div class="kpis">${kp.map(([v, k]) => `<div class="kpi"><b>${n(v)}</b><span>${k}</span></div>`).join('')}</div>
      <div class="toolbar"><span style="font-size:13px;color:var(--muted)">CSV · UTF-8 BOM · Excel</span><button class="btn btn--dark btn--sm" type="button" id="csvBtn"${apps.length ? '' : ' disabled'}>${I.download}${A('export')}</button></div>
      ${apps.length ? `<div class="table-wrap"><table class="tbl"><thead><tr>${['id', 'at', 'type', 'name', 'company', 'country', 'wa', 'email', 'msg'].map(k => `<th>${esc(cols[k])}</th>`).join('')}</tr></thead><tbody>
      ${apps.slice().reverse().map(a => `<tr><td><span class="ref">${esc(a.application_id)}</span></td><td dir="ltr">${esc(a.submitted_at_utc.replace('T', ' ').slice(0, 16))}</td><td>${esc(types[a.partner_type])}</td><td>${esc(a.fullName)}</td><td>${esc(a.company)}</td><td>${esc(a.country)}</td><td dir="ltr">${esc(a.phone)}</td><td dir="ltr">${esc(a.email)}</td><td style="white-space:normal;min-width:220px">${esc(a.message)}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${I.user}<p>${A('none')}</p></div>`}
    </div>`;
  }
  function exportCSV() {
    const apps = store.get(K.apps, []);
    const cols = ['application_id', 'submitted_at_utc', 'partner_type', 'fullName', 'company', 'country', 'phone', 'whatsapp_e164', 'email', 'message', 'consent', 'lang', 'page'];
    const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const body = [cols.join(','), ...apps.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })); a.download = 'sharif-partner-applications.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function footerLinks() {
    const F = L().footer || {}, p = prefix();
    return `<ul class="space-y-2" style="list-style:none;padding:0;margin:12px 0 0">
      <li><a class="hover:text-luxury-gold transition" href="${SITE + p}">${esc(F.home || 'Home')}</a></li>
      <li><a class="hover:text-luxury-gold transition" href="${SITE + p}aboutus/">${esc(F.aboutSharif || 'About Us')}</a></li>
      <li><a class="hover:text-luxury-gold transition" href="#/partners" style="color:var(--bronze);font-weight:700">${esc(F.partnerWithUs || 'Partner With Us')}</a></li>
    </ul>`;
  }

  /* ---------- INTEGRATION ---------- */
  function viewIntegration() {
    const T = k => esc(t('int.' + k));
    document.title = `${t('int.title')} | Sharif Group`;
    const urls = [['/partners/', '/fa/partners/  /ar/partners/  /zh/partners/'], ['/partners/thanks/', '/fa/partners/thanks/']];
    return `<div class="container admin-wrap">
      <span class="eyebrow eyebrow--bronze caps">${I.link}sharifgroup.ae</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 8px">${T('title')}</h1><p class="lede" style="margin-bottom:34px">${T('intro')}</p>
      <div class="int-block"><span class="int-label">${T('nav')}</span><div class="frame" style="overflow:visible;padding-bottom:230px"><header class="site-header" style="position:relative">${headerHTML(true)}</header></div></div>
      <div class="int-block"><span class="int-label">${T('footer')}</span><div class="frame frame--pad" style="font-size:13px;color:var(--muted)"><div class="foot-grid" style="grid-template-columns:1fr"><div><h4 class="caps">${esc(L().footer.quickLinks)}</h4>${footerLinks()}</div></div></div></div>
      <div class="int-block"><span class="int-label">${T('home')}</span><div class="frame frame--pad" style="background:var(--paper)">
        <a class="home-banner partner-band" href="#/partners"><span class="hb-l">${I.handshake}<span><b>${T('homeT')}</b><small>${T('homeD')}</small></span></span><span class="btn btn--bronze btn--sm caps">${T('homeBtn')}${I.arrow}</span></a></div></div>
      <div class="int-block"><span class="int-label">${T('urls')}</span><div class="frame"><table class="urlmap"><thead><tr>${t('int.urlCols').map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${t('int.urlRows').map((r, i) => `<tr><td>${esc(r)}</td><td><code>${urls[i][0]}</code></td><td><code>${urls[i][1]}</code></td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
  }

  /* ---------- demo panel ---------- */
  function renderDemoPanel() {
    const D = k => esc(t('demo.' + k));
    $('#demoFab').innerHTML = `${I.sliders}<span class="fab-l">${D('fab')}</span>`;
    $('#demoFab').setAttribute('aria-label', t('demo.fab'));
    $('#demoPanel').innerHTML = `<h3>${D('title')}</h3><p>${D('intro')}</p>
      <div class="grp"><span>${D('pages')}</span><a class="lnk" href="#/partners">${D('page')}</a><a class="lnk" href="#/partners/thanks">${D('thanks')}</a><a class="lnk" href="#/admin">${D('admin')}</a><a class="lnk" href="#/integration">${D('integration')}</a></div>
      <button class="btn btn--ghost btn--sm" type="button" id="demoReset">${D('reset')}</button>`;
    $('#demoReset').addEventListener('click', () => { [K.apps, K.last].forEach(store.del); toast(t('demo.resetDone')); route(); });
  }
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }

  document.addEventListener('click', e => {
    if (!e.target.closest('.lang')) $$('.lang.open').forEach(b => { b.classList.remove('open'); $('.lang-btn', b).setAttribute('aria-expanded', 'false'); });
    const sc = e.target.closest('[data-scroll]');
    if (sc) {
      const target = document.getElementById(sc.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (sc.dataset.type) { const r = $(`#partnerForm input[name="partner_type"][value="${sc.dataset.type}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }
      return;
    }
    if (e.target.closest('#csvBtn')) { exportCSV(); return; }
    if (e.target.closest('a[href^="#/"]')) $('#drawer').classList.remove('open');
  });
  $('#demoFab').addEventListener('click', () => $('#demoPanel').classList.toggle('open'));

  /* ---------- router ---------- */
  function render() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    let html;
    if (!p.length || (p[0] === 'partners' && !p[1])) html = viewPartners();
    else if (p[0] === 'partners' && p[1] === 'thanks') html = viewThanks();
    else if (p[0] === 'admin') html = viewAdmin();
    else if (p[0] === 'integration') html = viewIntegration();
    else html = viewPartners();
    $('#main').innerHTML = html;
    bindForm();
  }
  function route() { render(); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  window.addEventListener('hashchange', () => { $('#drawer').classList.remove('open'); route(); $('#main').focus({ preventScroll: true }); });

  renderShell();
  route();
})();
