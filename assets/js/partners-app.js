/* ==========================================================================
   Sharif Group — "Become a Partner" Portal Controller (Production)
   Multi-lingual (EN, FA, AR, ZH), Vanilla JS, No external dependencies.
   ========================================================================== */
(() => {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const DEMO = urlParams.get('demo') === '1';
    const PRIMARY_CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx866xd6P2fT7xqDJ1WGg10vSCXExEMnZylhrJHpMq0rCG0UotP23GIgbFEoK-0r7rQMA/exec";
  const UNIFIED_CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwRFNqHPPeGo4UqWU7jkhMdJPCTNkirDhCEvBQjWc9YUFufe535vIl89vYyg4NiRhnt_Q/exec";
  const CRM_WEBHOOK_URL = PRIMARY_CRM_WEBHOOK_URL;
  const LANGS = ['fa', 'en', 'ar', 'zh'];
  const SITE = window.location.protocol === 'file:' ? 'https://www.sharifgroup.ae/' : '/';
  const DIAL = [
    ['+971', 'AE'], ['+93', 'AF'], ['+98', 'IR'], ['+90', 'TR'], ['+92', 'PK'],
    ['+91', 'IN'], ['+966', 'SA'], ['+974', 'QA'], ['+965', 'KW'], ['+968', 'OM'],
    ['+973', 'BH'], ['+20', 'EG'], ['+86', 'CN'], ['+852', 'HK'], ['+7', 'RU/KZ'],
    ['+44', 'GB'], ['+49', 'DE'], ['+1', 'US/CA'], ['+61', 'AU']
  ];
  const I18N = window.PARTNER_I18N;
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
  const K = { lang: 'sgp.lang', apps: 'sgp.applications', last: 'sgp.last' };

  /* ---------- language resolution ---------- */
  const pathParts = window.location.pathname.replace(/^\/+/, '').split('/');
  const pathLang = LANGS.includes(pathParts[0]) ? pathParts[0] : null;
  const urlLang = urlParams.get('lang');
  let lang = pathLang || (LANGS.includes(urlLang) ? urlLang : (LANGS.includes(store.get(K.lang)) ? store.get(K.lang) : 'en'));
  const L = () => I18N[lang] || I18N.en;
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

  /* ---------- iconography ---------- */
  const I = {
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
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

  const isFile = window.location.protocol === 'file:';
  const ROOT_PATH = isFile ? (window.location.pathname.includes('/partners') ? '../' : './') : '/';
  const LOGO = isFile ? (window.location.pathname.includes('/partners') ? '../assets/images/logo.svg' : 'assets/images/logo.svg') : '/assets/images/logo.svg';
  const FOOTER_LOGO = ROOT_PATH + 'assets/images/vector_2d09c4bb.svg';
  const IMC_LOGO = ROOT_PATH + 'imclogo.webp';
  const FOOTER_VIDEO = ROOT_PATH + 'assets/videos/footer_bg_e58bba71.mp4';
  let footerCanvasAnimId = null;
  const imgRel = path => (window.location.protocol === 'file:' ? 'assets/images/' : '/assets/images/') + path;

  /* ---------- shell: header / footer ---------- */
  function navItems() {
    const N = L().nav, p = prefix();
    return [
      { h: SITE + p + 'citizenshipbyinvestment/', l: N.citizenship, dd: 'cbi' },
      { h: SITE + p + 'residencybyinvestment/', l: N.residency, dd: 'rbi' },
      { h: SITE + p + 'realestate/', l: N.moreServices, dd: 'services' },
      { h: SITE + p + 'aboutus/', l: N.aboutUs, dd: 'about', active: 1 },
      { h: SITE + p + 'contact/', l: N.contact },
      { h: SITE + p + 'blog/', l: N.blog },
      { h: SITE + p + 'webinars/', l: N.webinars }
    ];
  }

  function headerHTML(staticCopy) {
    const N = L().nav, F = L().footer, p = prefix();
    const langs = LANGS.map(c => `<button type="button" data-lang="${c}" aria-current="${c === lang}"><span lang="${c}">${esc(I18N[c]?.meta?.name || c.toUpperCase())}</span><small>${c.toUpperCase()}</small></button>`).join('');

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
                <a class="mm-all-btn caps" href="${SITE + p}citizenshipbyinvestment/">${esc(N.allCitizenship || 'All Programmes')}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.caribbeanPortfolios || 'Caribbean Portfolios')}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/dominica/"><img src="https://flagcdn.com/dm.svg" alt="Dominica" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.dominica || 'Dominica | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stkitts/"><img src="https://flagcdn.com/kn.svg" alt="St. Kitts & Nevis" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.kitts || 'St. Kitts & Nevis | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/antiguaandbarbuda/"><img src="https://flagcdn.com/ag.svg" alt="Antigua & Barbuda" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.antigua || 'Antigua & Barbuda | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/stlucia/"><img src="https://flagcdn.com/lc.svg" alt="Saint Lucia" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.lucia || 'Saint Lucia | Passport')}</span></a></li>
                  <li><a href="${SITE + p}programs/citizenshipbyinvestment/grenada/"><img src="https://flagcdn.com/gd.svg" alt="Grenada" width="48" height="32" class="flag-icon"><span>${esc(F.cbi?.grenada || 'Grenada | Passport')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.globalPortfolios || 'Global Portfolios')}</div>
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
                <a class="mm-all-btn caps" href="${SITE + p}residencybyinvestment/">${esc(N.allResidency || 'All Programmes')}</a>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps">${esc(N.goldenVisas || 'European Golden Visas')}</div>
                <ul class="mm-list">
                  <li><a href="${SITE + p}programs/residencybyinvestment/portugal/"><img src="https://flagcdn.com/pt.svg" alt="Portugal" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.portugal || 'Portugal | Golden Visa')}</span></a></li>
                  <li><a href="${SITE + p}programs/residencybyinvestment/greece/"><img src="https://flagcdn.com/gr.svg" alt="Greece" width="48" height="32" class="flag-icon"><span>${esc(F.rbi?.greece || 'Greece | Golden Visa')}</span></a></li>
                </ul>
              </div>
              <div class="mm-col">
                <div class="mm-col-head caps mm-col-head--alt">${esc(N.americasMiddleEast || 'Americas & UAE')}</div>
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
                <a class="mm-all-btn caps" href="${SITE + p}realestate/">${esc(N.allServices || 'Explore All')}</a>
              </div>
              <div class="mm-cards-grid">
                <a class="mm-card" href="${SITE + p}realestate/">
                  <img src="${imgRel('isdubairealestateago_3194a5.webp')}" alt="Real Estate">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.realEstate || 'Prime Real Estate')}</span>
                </a>
                <a class="mm-card" href="${SITE + p}educationaladvisory/">
                  <img src="${imgRel('photo-154133990719_46b647.webp')}" alt="Educational Advisory">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.education || 'Educational Advisory')}</span>
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

        <!-- About Us with Mega Menu & Become a Partner link -->
        <div class="nav-item has-dd is-active" data-dd="about">
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
                  <span class="mm-card-title caps">${esc(N.aboutFounder || N.aboutAli)}</span>
                </a>
                <a class="mm-card" href="${SITE + p}socialresponsibility/">
                  <img src="${imgRel('photo-148852178799_7302db.webp')}" alt="Social Responsibility">
                  <div class="mm-card-overlay"></div>
                  <span class="mm-card-title caps">${esc(N.socialResp)}</span>
                </a>
                <a class="mm-card mm-card--partner is-active" href="${SITE + p}partners/">
                  <img src="${imgRel('card.webp')}" alt="Become a Partner" loading="lazy">
                  <div class="mm-card-overlay mm-card-overlay--gold"></div>
                  <span class="mm-card-title caps">${esc(N.becomePartner)} <span class="nav-new">${esc(t('common.isNew'))}</span></span>
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
        <a class="nav-link caps" href="${SITE + p}webinars/">${esc(N.webinars)}</a>
      </nav>
      </div>

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
            <li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5 foot-new-row" href="${SITE + p}partners/"><span>${esc(F.partnerWithUs || 'Partner With Us')}</span> <span class="nav-new-badge ml-1.5 px-1.5 py-0.5 rounded-full bg-[#786142] text-white text-[8px] font-bold leading-none inline-flex items-center justify-center shrink-0 tracking-wider">${esc(t('common.isNew') || 'New')}</span></a></li>
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
    $('.skip').textContent = t('common.skip');

    // Mount Universal Navbar if available
    if (typeof window.mountUniversalNavbar === 'function') {
      window.mountUniversalNavbar('#siteHeader');
      const legacyDrawer = $('#drawer');
      if (legacyDrawer) legacyDrawer.style.display = 'none';
    } else {
      $('#siteHeader').innerHTML = headerHTML(false);
      $('#drawer').innerHTML = navItems().map(i => `<a href="${i.h}">${esc(i.l)}</a>${i.about ? `<a class="drawer-sub is-active" href="${SITE + p}partners/">${esc(N.becomePartner)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>` : ''}`).join('') +
        `<div class="drawer-ctas"><a href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityChecker)}</a><a class="solid" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a></div>`;
    }

    // Mount Luxury 5-Column Video Canvas Footer
    $('#siteFooter').innerHTML = footerHTML();
    initFooterCanvas();

    $('meta[name="description"]')?.setAttribute('content', M.description);

    // Synchronize language switching with Universal Navbar
    window.__SG_ON_LANG_CHANGE__ = setLang;

    // Language dropdown toggle (fallback)
    const box = $('#langBox'), btn = box ? $('.lang-btn', box) : null;
    if (box && btn) {
      btn.addEventListener('click', e => { e.stopPropagation(); const o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      $$('[data-lang]', box).forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    }

    // Burger menu toggle (fallback)
    const bg = $('#burger');
    if (bg) {
      bg.addEventListener('click', () => {
        const dr = $('#drawer');
        dr.style.top = Math.max(0, $('#siteHeader').getBoundingClientRect().bottom) + 'px';
        const o = dr.classList.toggle('open');
        bg.setAttribute('aria-expanded', o);
        bg.innerHTML = o ? I.x : I.menu;
      });
    }

    // Desktop hover & click handling for mega menus (fallback)
    let mmTimer = null;
    const closeAllMegaMenus = () => {
      clearTimeout(mmTimer);
      $$('.has-dd').forEach(d => d.classList.remove('is-open'));
    };

    $$('.has-dd').forEach(item => {
      const link = $('.nav-link', item);
      const menu = $('.mega-menu', item);

      item.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          clearTimeout(mmTimer);
          $$('.has-dd').forEach(d => { if (d !== item) d.classList.remove('is-open'); });
          item.classList.add('is-open');
        }
      });

      item.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          clearTimeout(mmTimer);
          mmTimer = setTimeout(closeAllMegaMenus, 250);
        }
      });

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
    store.set(K.lang, c);
    if (window.location.protocol === 'file:') {
      const u = new URL(location.href); u.searchParams.set('lang', c); history.replaceState(null, '', u);
      lang = c; renderShell(); route();
    } else {
      const r = parseRoute();
      let targetPath = (c === 'en' ? '' : '/' + c) + '/partners/';
      if (r.page === 'thanks') targetPath += 'thanks/';
      window.location.href = targetPath + (DEMO ? '?demo=1' : '');
    }
  }

  /* ---------- PARTNER PAGE ---------- */
  const typeIcon = { agency: I.building, firm: I.briefcase, individual: I.user };
  const whyIcons = [I.headset, I.file, I.chart, I.cap, I.book, I.pin];
  const HERO_BG_IMAGES = ['partner-1.webp', 'partner-2.webp', 'partner-3.webp', 'partner-4.webp', 'partner-5.webp'];

  function getPartnerImgUrl(imgName) {
    if (window.location.protocol === 'file:') {
      return (window.location.pathname.includes('/partners') || window.location.pathname.includes('\\partners'))
        ? ('../assets/images/' + imgName)
        : ('assets/images/' + imgName);
    }
    if (window.location.pathname.includes('/sharif-partners-demo/')) {
      return 'assets/images/' + imgName;
    }
    return '/assets/images/' + imgName;
  }

  function heroSlideshowHTML() {
    return `
    <div class="hero-slides-wrapper" aria-hidden="true">
      ${HERO_BG_IMAGES.map((img, i) => `
        <div class="hero-slide${i === 0 ? ' is-active' : ''}" style="background-image: linear-gradient(rgba(11,15,20,0.58), rgba(11,15,20,0.72)), url('${getPartnerImgUrl(img)}');"></div>
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
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    let current = 0;
    heroSlideshowTimer = setInterval(() => {
      if (!slides[current]) return;
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      if (!slides[current]) return;
      slides[current].classList.add('is-active');
    }, 4500);
  }

  const WHO_BG_IMAGES = {
    agency: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    firm: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    individual: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200'
  };

  const CARD_LABELS = {
    en: {
      category: 'CATEGORY',
      step: 'STEP',
      hover: 'HOVER TO EXPAND',
      active: 'ACTIVE UNIT',
      applyFor: 'Apply as',
      stepPillars: ['PHASE 01 • APPLICATION', 'PHASE 02 • SCREENING', 'PHASE 03 • ONBOARDING'],
      whoPillars: ['PORTFOLIO 01 • AGENTS', 'PORTFOLIO 02 • FIRMS', 'PORTFOLIO 03 • NETWORK']
    },
    fa: {
      category: 'دسته‌بندی',
      step: 'مرحله',
      hover: 'برای مشاهده کامل لمس کنید',
      active: 'بخش فعال',
      applyFor: 'درخواست به‌عنوان',
      stepPillars: ['مرحله ۰۱ • ثبت درخواست', 'مرحله ۰۲ • بررسی و اعتبارسنجی', 'مرحله ۰۳ • عقد قرارداد'],
      whoPillars: ['بخش ۰۱ • آژانس‌ها', 'بخش ۰۲ • شرکت‌ها', 'بخش ۰۳ • شبکه‌سازان']
    },
    ar: {
      category: 'الفئة',
      step: 'الخطوة',
      hover: 'مرر للتوسيع',
      active: 'الوحدة النشطة',
      applyFor: 'تقديم الطلب كـ',
      stepPillars: ['المرحلة ۰۱ • تقديم الطلب', 'المرحلة ۰۲ • التدقيق والمراجعة', 'المرحلة ۰۳ • اتفاقية الشراكة'],
      whoPillars: ['المحفظة ۰۱ • الوكالات', 'المحفظة ۰۲ • الشركات', 'المحفظة ۰۳ • الأفراد']
    },
    zh: {
      category: '类别',
      step: '阶段',
      hover: '悬停展开详情',
      active: '已展开',
      applyFor: '申请身份：',
      stepPillars: ['第一阶段 • 在线申请', '第二阶段 • 审核与背调', '第三阶段 • 签署合作协议'],
      whoPillars: ['领域 01 • 移民与咨询机构', '领域 02 • 专业服务事务所', '领域 03 • 高净值关系网络']
    }
  };

  function overviewSectionHTML() {
    const O = L().partners.overview || I18N.en.partners.overview;
    const bgUrl = getPartnerImgUrl('dubai-office-2.webp');

    return `
    <!-- =========================================================================
         SECTION: PARTNERSHIP OVERVIEW (HERO CARD WITH BACKGROUND IMAGE & 2x2 GRID)
         ========================================================================= -->
    <section class="sec-overview-wrapper" id="overview">
      <div class="container">
        <div class="overview-hero-card neon-card-hover group cursor-pointer">
          <div class="overview-card-bg" style="background-image: url('${bgUrl}');" aria-hidden="true"></div>
          <div class="overview-card-overlay" aria-hidden="true"></div>
          <div class="overview-card-content">
            <!-- Left Column: Branding, Title, Subtitle, CTA -->
            <div class="overview-col-left">
              <div class="overview-badge">
                <span class="overview-badge-icon icon-hover-box" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
                  </svg>
                </span>
                <span class="overview-badge-text">${esc(O.badge)}</span>
              </div>

              <h2 class="overview-title">
                ${esc(O.title)}
                <span class="overview-title-highlight">${esc(O.titleHighlight)}</span>
              </h2>

              <div class="overview-gold-line" aria-hidden="true"></div>

              <p class="overview-desc">${esc(O.desc)}</p>

              <div class="overview-action">
                <button type="button" class="overview-cta-btn" data-scroll="apply">
                  <span>${esc(O.cta)}</span>
                  <svg class="overview-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Right Column: 2x2 Glass Cards Grid -->
            <div class="overview-col-right">
              <div class="overview-cards-grid">
                <!-- Card 1: Global Network -->
                <div class="overview-feature-card about-feature-box">
                  <div class="overview-feature-header">
                    <div class="overview-feature-icon feature-icon-pill">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L13 12"/>
                        <path d="m13 12-4.3-4.3a1 1 0 0 0-1.4 0L4.7 10.3a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0L11 12"/>
                        <path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/>
                        <path d="m2 14 4-2"/>
                        <path d="m20 10 2 2"/>
                      </svg>
                    </div>
                    <h3 class="overview-feature-title">${esc(O.cards.network.title)}</h3>
                  </div>
                  <p class="overview-feature-desc">${esc(O.cards.network.desc)}</p>
                </div>

                <!-- Card 2: Secure Programs -->
                <div class="overview-feature-card about-feature-box">
                  <div class="overview-feature-header">
                    <div class="overview-feature-icon feature-icon-pill">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <circle cx="12" cy="15" r="2.5"/>
                        <path d="M10.5 17.5 9 21l3-1 3 1-1.5-3.5"/>
                      </svg>
                    </div>
                    <h3 class="overview-feature-title">${esc(O.cards.secure.title)}</h3>
                  </div>
                  <p class="overview-feature-desc">${esc(O.cards.secure.desc)}</p>
                </div>

                <!-- Card 3: Expert Support -->
                <div class="overview-feature-card about-feature-box">
                  <div class="overview-feature-header">
                    <div class="overview-feature-icon feature-icon-pill">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                      </svg>
                    </div>
                    <h3 class="overview-feature-title">${esc(O.cards.support.title)}</h3>
                  </div>
                  <p class="overview-feature-desc">${esc(O.cards.support.desc)}</p>
                </div>

                <!-- Card 4: High Commissions -->
                <div class="overview-feature-card about-feature-box">
                  <div class="overview-feature-header">
                    <div class="overview-feature-icon feature-icon-pill">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </div>
                    <h3 class="overview-feature-title">${esc(O.cards.commissions.title)}</h3>
                  </div>
                  <p class="overview-feature-desc">${esc(O.cards.commissions.desc)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  function viewPartners() {
    document.title = L().meta.title;
    const P = k => t(k);
    const curLabels = CARD_LABELS[lang] || CARD_LABELS.en;
    return `
    <section class="hero hero--compact">
      ${heroSlideshowHTML()}
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

    ${overviewSectionHTML()}

    <!-- =========================================================================
         SECTION 1: WHO WE WORK WITH (IMMERSIVE ACCORDION CARDS - MATCHING IMAGE 2)
         ========================================================================= -->
    <section class="section section--who scroll-mt-28" id="who">
      <div class="container">
        <!-- Centered Heading Intro matching Image 2 style -->
        <div class="who-sec-head" style="text-align:center;max-width:760px;margin:0 auto 44px;">
          <span class="text-xs font-bold uppercase tracking-[0.25em] text-luxury-gold flex items-center justify-center gap-2" style="display:inline-flex;align-items:center;gap:8px;color:#C5A880;font-size:11px;font-weight:700;letter-spacing:0.22em;">
            <i class="fa-solid fa-handshake"></i> <span>SHARIF GROUP PARTNERS</span>
          </span>
          <h2 class="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight" style="font-family:var(--font-serif);font-size:clamp(28px, 4vw, 46px);font-weight:700;color:#ffffff;margin:14px 0 12px;line-height:1.2;">
            ${esc(P('who.title'))}
          </h2>
          <p class="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-light leading-relaxed" style="font-size:14px;color:#a3a3a3;max-width:580px;margin:0 auto;line-height:1.6;">
            ${esc(P('hero.sub') || '')}
          </p>
        </div>

        <!-- Accordion Cards Stack (Itemized List with Glowing Active Card) -->
        <div class="who-acc-container" id="who-accordion-container">
          ${P('who.items').map((w, idx) => {
            const bgImg = WHO_BG_IMAGES[w.k] || WHO_BG_IMAGES.agency;
            const isAct = false;
            return `
            <div class="who-acc-item" data-partner-type="${w.k}" tabindex="0" role="button" aria-expanded="false" aria-label="${esc(w.t)}">
              <div class="who-acc-bg" style="background-image: url('${bgImg}');"></div>
              <div class="who-acc-overlay"></div>
              <div class="who-acc-main">
                <div class="who-acc-header">
                  <div class="who-acc-lead">
                    <div class="who-acc-icon">
                      ${typeIcon[w.k]}
                    </div>
                    <div class="who-acc-meta">
                      <span class="who-acc-pillar">${esc(curLabels.whoPillars[idx] || (curLabels.category + ' ' + pad2(idx + 1)))}</span>
                      <h3 class="who-acc-title">${esc(w.t)}</h3>
                    </div>
                  </div>
                  <span class="who-acc-badge">${esc(isAct ? curLabels.active : curLabels.hover)}</span>
                </div>
                <div class="who-acc-grid">
                  <div class="who-acc-body">
                    <div class="who-acc-content">
                      <p class="who-acc-desc">${esc(w.d)}</p>
                      <div class="who-acc-action">
                        <button type="button" class="who-acc-btn" data-scroll="apply" data-type="${w.k}">
                          <span>${esc(curLabels.applyFor)}: ${esc(w.t)}</span>
                          <i class="fa-solid fa-arrow-right ml-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- =========================================================================
         SECTION 2: HOW IT WORKS (ROADMAP MAP ANIMATION IDENTICAL TO REFERENCE)
         ========================================================================= -->
    <section class="sec-timeline-wrapper relative overflow-hidden scroll-mt-36" id="sec-timeline">
      <div class="timeline-logo-bg pointer-events-none select-none" aria-hidden="true">
        <img src="${LOGO}" alt="" class="w-full h-auto">
      </div>

      <div class="max-w-5xl mx-auto space-y-16 relative z-10 px-6">
        <div class="text-center space-y-3 relative" style="text-align:center;margin-bottom:36px;">
          <span class="text-xs font-bold uppercase tracking-[0.25em] text-luxury-gold flex items-center justify-center gap-2" style="display:inline-flex;align-items:center;gap:8px;color:#C5A880;font-size:11px;font-weight:700;letter-spacing:0.25em;">
            <i class="fa-regular fa-clock"></i> <span>${esc(P('steps.timelineBadge'))}</span>
          </span>
          <h2 class="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 leading-tight" style="font-family:var(--font-serif);font-size:clamp(22px, 2.5vw, 34px);font-weight:700;color:#171717;margin:10px 0 8px;">
            ${P('steps.timelineTitle')}
          </h2>
          <p class="text-xs sm:text-sm text-neutral-600 font-light max-w-xl mx-auto" style="font-size:13px;color:#525252;max-width:540px;margin:0 auto;line-height:1.55;">
            ${esc(P('steps.timelineDesc'))}
          </p>
        </div>

        <div class="relative pt-8 pb-12" id="timeline-track">
          <!-- Central Track Line -->
          <div class="timeline-central-line"></div>

          <!-- Animated Central Floating Luxury Badge Node -->
          <div class="central-passport-node" id="central-passport-node">
            <div class="central-passport-card">
              <div class="passport-crest">
                <i class="fa-solid fa-handshake"></i>
              </div>
              <span class="passport-brand">SHARIF</span>
              <span class="passport-sub">PARTNER</span>
            </div>
          </div>

          <div class="space-y-16 sm:space-y-20 relative z-10" style="display:flex;flex-direction:column;gap:56px;">
            ${(() => {
              const items = P('steps.items') || [];
              const s1 = items[0] || {}, s2 = items[1] || {}, s3 = items[2] || {};
              return `
              <!-- Step 1 -->
              <div class="timeline-step grid grid-cols-12 gap-2 sm:gap-8 items-center relative" data-step="1">
                <div class="col-span-5 text-end pe-2 sm:pe-12 space-y-1 sm:space-y-2 timeline-text-col">
                  <span class="timeline-step-phase">${esc(s1.phase || 'PHASE 01')} • ${esc(s1.time || 'DAY 1')}</span>
                  <h4 class="timeline-step-heading">${esc(s1.t)}</h4>
                  <p class="timeline-step-text hidden xs:block">${esc(s1.d)}</p>
                </div>
                <div class="col-span-2 flex justify-center relative">
                  <div class="step-badge">1</div>
                </div>
                <div class="col-span-5 text-start ps-2 sm:ps-12 timeline-note-col">
                  <p class="timeline-step-note">${esc(s1.note)}</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="timeline-step grid grid-cols-12 gap-2 sm:gap-8 items-center relative" data-step="2">
                <div class="col-span-5 text-end pe-2 sm:pe-12 timeline-note-col">
                  <p class="timeline-step-note">${esc(s2.note)}</p>
                </div>
                <div class="col-span-2 flex justify-center relative">
                  <div class="step-badge">2</div>
                </div>
                <div class="col-span-5 text-start ps-2 sm:ps-12 space-y-1 sm:space-y-2 timeline-text-col">
                  <span class="timeline-step-phase">${esc(s2.phase || 'PHASE 02')} • ${esc(s2.time || 'DAYS 2-3')}</span>
                  <h4 class="timeline-step-heading">${esc(s2.t)}</h4>
                  <p class="timeline-step-text hidden xs:block">${esc(s2.d)}</p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="timeline-step grid grid-cols-12 gap-2 sm:gap-8 items-center relative" data-step="3">
                <div class="col-span-5 text-end pe-2 sm:pe-12 space-y-1 sm:space-y-2 timeline-text-col">
                  <span class="timeline-step-phase">${esc(s3.phase || 'PHASE 03')} • ${esc(s3.time || 'DAY 4')}</span>
                  <h4 class="timeline-step-heading">${esc(s3.t)}</h4>
                  <p class="timeline-step-text hidden xs:block">${esc(s3.d)}</p>
                </div>
                <div class="col-span-2 flex justify-center relative">
                  <div class="step-badge">3</div>
                </div>
                <div class="col-span-5 text-start ps-2 sm:ps-12 timeline-note-col">
                  <p class="timeline-step-note">${esc(s3.note)}</p>
                </div>
              </div>

              <!-- Final Celebration Milestone (Checkmark ✓) -->
              <div class="timeline-step grid grid-cols-12 gap-8 items-center relative" data-step="4">
                <div class="col-span-12 flex flex-col items-center justify-center text-center pt-4 sm:pt-8" style="text-align:center;display:flex;flex-direction:column;align-items:center;">
                  <div class="step-badge step-badge--final">✓</div>
                  <div class="mt-4 sm:mt-6 space-y-2" style="margin-top:16px;">
                    <span class="timeline-congrats-label" id="congrats-label">${esc(P('steps.congrats'))}</span>
                    <h4 class="timeline-congrats-title">${esc(P('steps.congratsTitle'))}</h4>
                    <p class="timeline-congrats-desc">${esc(P('steps.congratsDesc'))}</p>
                    <div style="margin-top:18px;">
                      <button class="btn btn--bronze btn--sm" type="button" data-scroll="apply" style="display:inline-flex;align-items:center;gap:8px;">
                        <span>${esc(P('hero.apply'))}</span>
                        ${I.down}
                      </button>
                    </div>
                  </div>
                </div>
              </div>`;
            })()}
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         SECTION 3: PARTNERSHIP APPLICATION FORM (STANDALONE DEDICATED SECTION)
         ========================================================================= -->
    <section class="section section--apply-standalone scroll-mt-24 relative overflow-hidden" id="apply">
      <div class="apply-map-bg" aria-hidden="true"></div>
      <div class="apply-map-overlay" aria-hidden="true"></div>
      <div class="container relative z-10">
        <div class="sec-head" style="text-align:center;max-width:760px;margin:0 auto 40px;position:relative;z-index:10;">
          <span class="eyebrow caps" style="justify-content:center;color:#786142;letter-spacing:0.25em;font-size:11.5px;font-weight:700;"><i class="fa-solid fa-file-signature" style="margin-inline-end:6px"></i><span>${esc(P('hero.apply'))}</span></span>
          <h2 class="display h-lg font-serif" style="margin:14px 0 0;color:#171717;font-weight:700;">${P('form.title')}</h2>
          <div style="width:64px;height:2px;background:#786142;margin:16px auto;"></div>
          <p class="lede" style="margin:0 auto;color:#525252;line-height:1.6;font-size:14.5px;max-width:620px;">${esc(P('form.sub'))}</p>
        </div>
        <div class="apply-form--standalone">
          ${formHTML()}
        </div>
      </div>
    </section>`;
  }


  function formHTML() {
    const F = k => esc(t('form.' + k));
    const types = Object.entries(t('form.types')).map(([k, v]) => `<label class="type-card"><input type="radio" name="partner_type" value="${k}"><span class="tc-ico">${typeIcon[k]}</span><span class="tc-l">${esc(v)}</span></label>`).join('');
    const dial = DIAL.map(([c, k]) => `<option value="${c}">${c} ${k}</option>`).join('');
    return `<form class="form" id="partnerForm" novalidate>
      <div class="form-alert" role="alert" id="formAlert">${F('alert')}</div>
      
      <!-- Row 1: 3 Columns (Matches Program Pages UI/UX) -->
      <div class="form-grid-3">
        <div class="field">
          <label class="field-label-caps" for="f-name">${F('name')}<span class="req">*</span></label>
          <input class="input" id="f-name" name="fullName" autocomplete="name" placeholder="John Doe" maxlength="80">
          <span class="err">${F('errName')}</span>
        </div>
        <div class="field">
          <label class="field-label-caps" for="f-email">${F('email')}<span class="req">*</span></label>
          <input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@domain.com" dir="ltr">
          <span class="err">${F('errEmail')}</span>
        </div>
        <div class="field">
          <label class="field-label-caps" for="f-phone">${F('wa')}<span class="req">*</span></label>
          <div class="phone" dir="ltr">
            <select class="select" id="f-dial" name="dialCode" aria-label="Country code">${dial}</select>
            <input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="50 123 4567" dir="ltr">
          </div>
          <span class="err">${F('errPhone')}</span>
        </div>
      </div>

      <!-- Row 2: 2 Columns -->
      <div class="form-grid-2">
        <div class="field" id="company-field">
          <label class="field-label-caps" for="f-company">${F('company')}<span class="req">*</span></label>
          <input class="input" id="f-company" name="company" autocomplete="organization" placeholder="e.g. Legal Partners LLC" maxlength="120">
          <span class="hint" style="font-size:11px;color:#737373;margin-top:3px;display:block;">${F('companyHint')}</span>
          <span class="err">${F('errCompany')}</span>
        </div>
        <div class="field">
          <label class="field-label-caps" for="f-country">${F('country')}<span class="req">*</span></label>
          <input class="input" id="f-country" name="country" autocomplete="country-name" placeholder="e.g. UAE, Saudi Arabia, USA" maxlength="60">
          <span class="err">${F('errCountry')}</span>
        </div>
      </div>

      <!-- Row 3: Partner Category / Type Selection -->
      <fieldset class="field" id="f-type-wrap" style="margin:6px 0 22px;">
        <legend class="field-label-caps">${F('type')}<span class="req">*</span></legend>
        <div class="type-grid">${types}</div>
        <span class="err">${F('errType')}</span>
      </fieldset>

      <!-- Row 4: Confidential Notes -->
      <div class="field" style="margin-bottom:22px;">
        <label class="field-label-caps" for="f-msg">${F('message')} <span class="opt" style="font-weight:normal;color:#737373;text-transform:none;">(${esc(t('common.optional'))})</span></label>
        <textarea class="textarea" id="f-msg" name="message" maxlength="1000" rows="3" placeholder="...Detail any specific partnership parameters, portfolio size, or questions"></textarea>
      </div>

      <!-- Row 5: Consent Checkbox -->
      <div class="field" id="consent-field" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:16px;margin-bottom:20px;">
        <label class="check" style="cursor:pointer;display:flex;align-items:flex-start;gap:10px;">
          <input type="checkbox" id="f-consent" name="consent" value="yes" style="margin-top:3px;">
          <span style="font-size:12.5px;color:#525252;line-height:1.6;">${F('consent')}<span class="req">*</span></span>
        </label>
        <span class="err">${F('errConsent')}</span>
      </div>

      <div class="hp" aria-hidden="true"><label>Company website<input name="hp_url" tabindex="-1" autocomplete="off"></label></div>

      <!-- Row 6: Centered CTA Button -->
      <div style="text-align:center;padding-top:6px;">
        <button class="btn-program-submit" type="submit">${F('submit')} →</button>
      </div>
      <p class="consent-note" style="text-align:center;margin-top:16px;font-size:12px;color:#737373;display:flex;align-items:center;justify-content:center;gap:6px;">
        ${I.shield}<span>${F('note')} ${F('privacy')}</span>
      </p>
    </form>`;
  }

  const toLatin = s => String(s || '').replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));

  function bindForm(preType) {
    const form = $('#partnerForm'); if (!form) return;
    const syncCompany = () => {
      const tp = (form.querySelector('input[name="partner_type"]:checked') || {}).value;
      const cf = $('#company-field');
      if (cf) {
        cf.classList.toggle('is-optional', tp === 'individual');
        const reqEl = $('.req', cf);
        if (reqEl) reqEl.style.display = tp === 'individual' ? 'none' : '';
      }
    };
    $$('input[name="partner_type"]', form).forEach(r => r.addEventListener('change', syncCompany));
    if (preType) {
      const r = form.querySelector(`input[name="partner_type"][value="${preType}"]`);
      if (r) { r.checked = true; syncCompany(); }
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('hp_url')) return; // honeypot spam protection

      const type = String(fd.get('partner_type') || '');
      const name = String(fd.get('fullName') || '').trim();
      const company = String(fd.get('company') || '').trim();
      const country = String(fd.get('country') || '').trim();
      const dial = String(fd.get('dialCode'));
      const local = toLatin(fd.get('phone')).replace(/[^\d]/g, '').replace(/^0+/, '');
      const email = toLatin(String(fd.get('email') || '').trim()).toLowerCase();

      const checks = [
        ['f-type-wrap', !!type],
        ['f-name', name.length >= 2],
        ['f-company', type === 'individual' || company.length >= 2],
        ['f-country', country.length >= 2],
        ['f-phone', /^\d{6,13}$/.test(local)],
        ['f-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)],
        ['consent-field', fd.get('consent') === 'yes']
      ];

      let first = null;
      checks.forEach(([id, ok]) => {
        const el = $('#' + id);
        if (!el) return;
        const field = el.classList.contains('field') ? el : el.closest('.field');
        if (field) field.classList.toggle('has-err', !ok);
        if (el.matches('input,select,textarea')) el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !first) first = el.matches('input,select,textarea') ? el : (field ? (field.querySelector('input') || field) : el);
      });

      const alertEl = $('#formAlert');
      if (alertEl) alertEl.classList.toggle('show', !!first);
      if (first) { first.focus(); first.scrollIntoView({ block: 'center' }); return; }

      const apps = Array.isArray(store.get(K.apps, [])) ? store.get(K.apps, []) : [];
      const dup = apps.find(a => a && a.email === email);
      const btn = $('button[type="submit"]', form);
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;">${I.spark || ''}<span>${t('form.sending') || 'Sending...'}</span></span>`;
      }

      // Always create a complete, fresh partner application record
      const rec = {
        form_id: 'partner-application',
        application_id: 'PAR-' + Date.now().toString(36).toUpperCase().slice(-6),
        submitted_at_utc: new Date().toISOString(),
        partner_type: type,
        fullName: name,
        company: company,
        job_title: String(fd.get('job_title') || '').trim(),
        country: country,
        city: String(fd.get('city') || '').trim(),
        dialCode: dial,
        phone: `${dial} ${local}`,
        whatsapp_e164: dial + local,
        email: email,
        website: String(fd.get('website') || '').trim(),
        programmes: fd.getAll('programmes').join(', '),
        referrals_per_year: String(fd.get('referrals_per_year') || ''),
        heard_from: String(fd.get('heard_from') || ''),
        message: String(fd.get('message') || '').trim(),
        consent: 'yes',
        lang: lang,
        source: `${SITE}${prefix()}partners/`,
        page: `/${prefix()}partners/`
      };
      apps.push(rec);
      store.set(K.apps, apps);
      store.set(K.last, { id: rec.application_id, dup: !!dup });

      // Dispatch to Live Google Apps Script CRM Webhooks (Primary & Unified Fallback)
      const payloadString = JSON.stringify(rec);
      const postHeaders = { 'Content-Type': 'text/plain;charset=utf-8' };
      const webhooks = [
        typeof PRIMARY_CRM_WEBHOOK_URL !== 'undefined' ? PRIMARY_CRM_WEBHOOK_URL : null,
        typeof UNIFIED_CRM_WEBHOOK_URL !== 'undefined' ? UNIFIED_CRM_WEBHOOK_URL : null,
        typeof CRM_WEBHOOK_URL !== 'undefined' ? CRM_WEBHOOK_URL : null
      ].filter(Boolean);

      // Deduplicate webhooks
      [...new Set(webhooks)].forEach(url => {
        try {
          fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: postHeaders,
            body: payloadString
          }).catch(err => console.warn('Partner CRM sync warning:', err));
        } catch (e) {
          console.warn('Partner CRM sync error:', e);
        }
      });

      // Smooth transition to Thank-you page with guaranteed fallback
      setTimeout(() => {
        const thanksUrl = `${SITE}${prefix()}partners/thanks/` + (DEMO ? '?demo=1' : '');
        if (window.location.protocol === 'file:') {
          location.hash = '#/partners/thanks';
          route();
        } else {
          try {
            history.pushState({ page: 'thanks' }, '', thanksUrl);
            route();
          } catch (_) {
            window.location.href = thanksUrl;
          }
        }
        // Safety guard: if form is still visible after 600ms, force direct navigation
        setTimeout(() => {
          if (document.getElementById('partnerForm')) {
            window.location.href = thanksUrl;
          }
        }, 600);
      }, 400);
    });
  }

  /* ---------- THANKS PAGE ---------- */
  function viewThanks() {
    try {
      const last = store.get(K.last, null);
      const apps = Array.isArray(store.get(K.apps, [])) ? store.get(K.apps, []) : [];
      const rec = (last && last.id) ? apps.find(a => a && a.application_id === last.id) : (apps.length ? apps[apps.length - 1] : null);
      document.title = `${t('thanks.eyebrow') || 'Application received'} | Sharif Group`;
      const rawSteps = t('thanks.steps') || t('steps.items');
      const stepsList = Array.isArray(rawSteps) ? rawSteps : [];
      const applicantName = rec ? (rec.fullName || rec.name || '') : '';
      const thanksTitle = t('thanks.title', { name: applicantName }) || (applicantName ? `Thank you, ${applicantName}!` : 'Thank you!');
      const thanksMsg = (last && last.dup)
        ? (t('thanks.already') || 'We already have an application with this email address. Our team will be in touch.')
        : (t('thanks.text') || 'We have received your application. Our partnerships team will contact you on WhatsApp or by email.');

      return `<div class="container"><div class="thanks">
        <div class="thanks-icon">${I.check || '<i class="fa-solid fa-check"></i>'}</div>
        <span class="eyebrow eyebrow--bronze caps">${esc(t('thanks.eyebrow') || 'Application received')}</span>
        <h1 class="display h-lg on-light" style="margin:10px 0 12px">${esc(thanksTitle)}</h1>
        <p class="lede" style="color:var(--text)">${esc(thanksMsg)}</p>
        ${rec && rec.application_id ? `<p style="font-size:13px;color:var(--muted)">${esc(t('thanks.ref') || 'Reference')}: <span class="ref">${esc(rec.application_id)}</span></p>` : ''}
        ${stepsList.length ? `<div class="summary-card"><div class="summary-body"><ol class="timeline">${stepsList.map((s, i) => `<li class="${i === 0 ? 'done' : ''}"><strong>${esc((s && s.t) || '')}</strong><span>${esc((s && s.d) || '')}</span></li>`).join('')}</ol></div></div>` : ''}
        <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="${SITE + prefix()}partners/">${esc(t('thanks.back') || 'Back to partner page')}</a><a class="btn btn--ghost" href="${SITE + prefix()}">${esc(t('thanks.home') || 'Go to homepage')}</a></div>
      </div></div>`;
    } catch (err) {
      console.error('viewThanks render error:', err);
      return `<div class="container"><div class="thanks">
        <div class="thanks-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg></div>
        <span class="eyebrow eyebrow--bronze caps">Application received</span>
        <h1 class="display h-lg on-light" style="margin:10px 0 12px">Thank You!</h1>
        <p class="lede" style="color:var(--text)">We have received your application. Our partnerships team will contact you on WhatsApp or by email.</p>
        <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="${SITE + prefix()}partners/">Back to partner page</a><a class="btn btn--ghost" href="${SITE + prefix()}">Go to homepage</a></div>
      </div></div>`;
    }
  }

  /* ---------- event bindings & scroll handling ---------- */
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang')) $$('.lang.open').forEach(b => { b.classList.remove('open'); $('.lang-btn', b).setAttribute('aria-expanded', 'false'); });
    const sc = e.target.closest('[data-scroll]');
    if (sc) {
      const target = document.getElementById(sc.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (sc.dataset.type) {
        const r = $(`#partnerForm input[name="partner_type"][value="${sc.dataset.type}"]`);
        if (r) {
          r.checked = true;
          r.dispatchEvent(new Event('change'));
        }
      }
      return;
    }
    if (e.target.closest('a[href^="#/"]')) $('#drawer')?.classList.remove('open');
  });

  /* ---------- router ---------- */
  function parseRoute() {
    if (location.hash && location.hash.length > 1) {
      const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      if (p.includes('thanks')) return { page: 'thanks' };
      return { page: 'partners' };
    }
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    const segs = path.split('/').filter(Boolean);
    const pIdx = segs.indexOf('partners');
    if (segs.includes('thanks')) return { page: 'thanks' };
    if (pIdx !== -1) {
      const rest = segs.slice(pIdx + 1);
      if (rest[0] === 'thanks') return { page: 'thanks' };
      return { page: 'partners' };
    }
    return { page: 'partners' };
  }

  function bindPartnerCards() {
    const curLabels = CARD_LABELS[lang] || CARD_LABELS.en;
    const whoCards = $$('.who-acc-item, .who-card');

    function setCardActive(card) {
      if (!card) return;
      whoCards.forEach(c => {
        c.classList.remove('is-active');
        c.setAttribute('aria-expanded', 'false');
        const b = c.querySelector('.who-acc-badge, .partner-card-badge');
        if (b) b.textContent = curLabels.hover;
      });
      card.classList.add('is-active');
      card.setAttribute('aria-expanded', 'true');
      const ab = card.querySelector('.who-acc-badge, .partner-card-badge');
      if (ab) ab.textContent = curLabels.active;

      const type = card.dataset.partnerType;
      if (type) {
        const radio = $(`#partnerForm input[name="partner_type"][value="${type}"]`);
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    function deactivateCard(card) {
      if (!card) return;
      card.classList.remove('is-active');
      card.setAttribute('aria-expanded', 'false');
      const b = card.querySelector('.who-acc-badge, .partner-card-badge');
      if (b) b.textContent = curLabels.hover;
    }

    whoCards.forEach(card => {
      card.addEventListener('mouseenter', () => setCardActive(card));
      card.addEventListener('mouseleave', () => deactivateCard(card));
      card.addEventListener('click', e => {
        if (e.target.closest('[data-scroll]')) return;
        if (card.classList.contains('is-active')) {
          deactivateCard(card);
        } else {
          setCardActive(card);
        }
      });
    });

    const form = $('#partnerForm');
    if (form) {
      form.querySelectorAll('input[name="partner_type"]').forEach(input => {
        input.addEventListener('change', () => {
          const val = input.value;
          const matchingCard = $(`.who-acc-item[data-partner-type="${val}"], .who-card[data-partner-type="${val}"]`);
          if (matchingCard && !matchingCard.classList.contains('is-active')) {
            setCardActive(matchingCard);
          }
        });
      });
    }
  }

  function updateTimeline() {
    const passportNode = document.getElementById("central-passport-node");
    const track = document.getElementById("timeline-track");
    const steps = document.querySelectorAll(".timeline-step");

    if (!passportNode || !track || steps.length === 0) return;

    const trackRect = track.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;

    // Calculate max downward travel bound (stops precisely at final badge)
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

    // Calculate travel relative to track container & clamp precisely to final tick
    let relativeY = viewportCenter - trackRect.top;
    relativeY = Math.max(0, Math.min(relativeY, maxTravel));

    // Move passport node smoothly
    passportNode.style.top = `${relativeY}px`;

    // Proximity threshold adapted for mobile vs desktop screens
    const proximityThreshold = window.innerWidth < 640 ? 80 : 110;

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
        badge.classList.add("bg-amber-500", "text-neutral-950", "ring-4", "ring-amber-300/60", "scale-110", "shadow-xl");

        if (stepNum === "4") {
          const label = document.getElementById("congrats-label");
          if (label) {
            label.style.color = "#d97706";
          }
        }
      } else if (badgeCenter < viewportCenter) {
        // Passed State
        badge.classList.remove("bg-neutral-200", "text-neutral-600", "bg-amber-500", "ring-4", "ring-amber-300/60", "scale-110", "shadow-xl");

        if (stepNum === "4") {
          badge.classList.add("bg-amber-500", "text-neutral-950");
        } else {
          badge.classList.add("badge-passed-green");
        }
      } else {
        // Upcoming State (Default Gray)
        badge.classList.remove("bg-amber-500", "badge-passed-green", "text-white", "text-neutral-950", "ring-4", "ring-amber-300/60", "scale-110", "shadow-xl");
        badge.classList.add("bg-neutral-200", "text-neutral-600");
      }
    });
  }

  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline, { passive: true });
  window.addEventListener("load", updateTimeline, { passive: true });

  function render() {
    const r = parseRoute();
    const main = $('#main');
    if (!main) return;
    let html;
    if (r.page === 'thanks') html = viewThanks();
    else html = viewPartners();
    main.innerHTML = html;
    bindForm();
    if (r.page !== 'thanks') {
      initHeroSlideshow();
      bindPartnerCards();
      updateTimeline();
      requestAnimationFrame(updateTimeline);
      setTimeout(updateTimeline, 60);
      setTimeout(updateTimeline, 250);
    }
  }

  function route() { render(); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }

  window.addEventListener('hashchange', () => { $('#drawer')?.classList.remove('open'); route(); $('#main')?.focus({ preventScroll: true }); });
  window.addEventListener('popstate', () => { $('#drawer')?.classList.remove('open'); route(); });

  renderShell();
  route();
})();
