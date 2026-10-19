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
  function footerLinks() {
    const F = L().footer, p = prefix();
    return `<a href="${SITE + p}">${esc(F.home)}</a><a href="${SITE + p}blog/">${esc(F.insightsBlog)}</a><a href="${SITE + p}webinars/">${esc(L().nav.webinars)}</a><a class="foot-new" href="#/partners">${esc(F.partnerWithUs)}</a><a href="${SITE + p}contact/">${esc(F.contactUs)}</a>`;
  }
  function renderShell() {
    const M = L().meta, F = L().footer, N = L().nav, p = prefix();
    document.documentElement.lang = lang;
    document.documentElement.dir = M.dir;
    document.body.className = 'lang-' + lang;
    $('#demoBar').innerHTML = `<strong>${esc(t('common.demoStrong'))}</strong>${esc(t('common.demoText'))}`;
    $('.skip').textContent = t('common.skip');
    $('#siteHeader').innerHTML = headerHTML(false);
    $('#drawer').innerHTML = navItems().map(i => `<a href="${i.h}">${esc(i.l)}</a>${i.about ? `<a class="drawer-sub is-active" href="#/partners">${esc(N.becomePartner)} <span class="nav-new">${esc(t('common.isNew'))}</span></a>` : ''}`).join('') +
      `<div class="drawer-ctas"><a href="${SITE + p}eligibilitychecker/">${esc(N.eligibilityChecker)}</a><a class="solid" href="${SITE + p}contact/">${esc(N.bookConsultation)}</a></div>`;
    $('#siteFooter').innerHTML = `<div class="container"><div class="foot-grid">
      <div class="foot-brand"><img src="${LOGO}" alt="Sharif Group" width="48" height="52"><p>${esc(F.tagline)}</p><p>${esc(F.address)}</p><p><a class="ltr" href="tel:+97143578737">+971 4 357 8737</a> · <a class="ltr" href="mailto:contact@sharifgroup.ae">contact@sharifgroup.ae</a></p></div>
      <div><h4 class="caps">${esc(F.quickLinks)}</h4>${footerLinks()}</div>
      <div><h4 class="caps">${esc(F.programmes)}</h4><a href="${SITE + p}citizenshipbyinvestment/">${esc(N.citizenship)}</a><a href="${SITE + p}residencybyinvestment/">${esc(N.residency)}</a><a href="${SITE + p}realestate/">${esc(N.moreServices)}</a></div>
      <div><h4 class="caps">${esc(F.legalFrameworks)}</h4><a href="${SITE + p}privacy-policy/">${esc(F.privacyPolicy)}</a><a href="${SITE + p}terms-of-use/">${esc(F.termsOfUse)}</a></div>
      </div><div class="foot-bottom"><span>${esc(F.allRightsReserved)}</span><span><a href="https://www.linkedin.com/company/sharif-group-uae/">LinkedIn</a> · <a href="https://www.instagram.com/sharifgroup.uae">Instagram</a></span></div></div>`;
    $('meta[name="description"]').setAttribute('content', M.description);
    const box = $('#langBox'), btn = $('.lang-btn', box);
    btn.addEventListener('click', e => { e.stopPropagation(); const o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    $$('[data-lang]', box).forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const bg = $('#burger');
    bg.addEventListener('click', () => { const dr = $('#drawer'); dr.style.top = Math.max(0, $('#siteHeader').getBoundingClientRect().bottom) + 'px'; const o = dr.classList.toggle('open'); bg.setAttribute('aria-expanded', o); bg.innerHTML = o ? I.x : I.menu; });
    renderDemoPanel();
  }
  function setLang(c) {
    lang = c; store.set(K.lang, c);
    const u = new URL(location.href); u.searchParams.set('lang', c); history.replaceState(null, '', u);
    renderShell(); route();
  }

  /* ---------- PARTNER PAGE ---------- */
  const typeIcon = { agency: I.building, firm: I.briefcase, individual: I.user };
  const whyIcons = [I.headset, I.file, I.chart, I.cap, I.book, I.pin];
  function viewPartners() {
    document.title = L().meta.title;
    const P = k => t(k);
    return `
    <section class="hero">
      <img class="hero-mark mark-white" src="${LOGO}" alt="" aria-hidden="true">
      <div class="container hero-inner">
        <span class="eyebrow caps">${I.handshake}${esc(P('hero.eyebrow'))}</span>
        <h1 class="display h-xl" style="margin-top:14px">${P('hero.title')}</h1>
        <p class="hero-sub caps">${esc(P('hero.sub'))}</p>
        <p class="lede">${esc(P('hero.lede'))}</p>
        <div class="btn-row" style="justify-content:center;margin-top:28px">
          <button class="btn btn--bronze" type="button" data-scroll="apply">${esc(P('hero.apply'))}${I.arrow}</button>
          <button class="btn btn--ghost-light" type="button" data-scroll="how">${esc(P('hero.how'))}${I.down}</button>
        </div>
      </div>
    </section>

    <section class="stats-band"><div class="container stats">${P('stats').map(s => `<div class="stat"><b class="ltr">${esc(s.n)}</b><span class="caps">${esc(s.l)}</span></div>`).join('')}</div></section>

    <section class="section section--white">
      <div class="container">
        <div class="section-head center"><span class="eyebrow eyebrow--bronze caps">${I.spark}${esc(P('who.eyebrow'))}</span><h2 class="display h-lg on-light">${P('who.title')}</h2></div>
        <div class="who-grid">${P('who.items').map(w => `<article class="who-card"><div class="who-ico">${typeIcon[w.k]}</div><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p>
          <button class="who-link" type="button" data-scroll="apply" data-type="${w.k}">${esc(P('hero.apply'))}${I.arrow}</button></article>`).join('')}</div>
      </div>
    </section>

    <section class="section section--navy">
      <div class="container">
        <div class="section-head center"><span class="eyebrow caps">${I.star}${esc(P('why.eyebrow'))}</span><h2 class="display h-lg">${P('why.title')}</h2></div>
        <div class="series-card why-card"><div class="why-grid">${P('why.items').map((w, i) => `<div class="why-item"><div class="why-ico">${whyIcons[i]}</div><div><h3>${esc(w.t)}</h3><p>${esc(w.d)}</p></div></div>`).join('')}</div></div>
      </div>
    </section>

    <section class="section section--sand" id="how">
      <div class="container">
        <div class="section-head"><span class="eyebrow eyebrow--bronze caps">${I.handshake}${esc(P('steps.eyebrow'))}</span><h2 class="display h-lg on-light">${P('steps.title')}</h2></div>
        <div class="steps">${P('steps.items').map((s, i) => `<div class="step"><span class="step-num">${pad2(i + 1)}</span><div class="step-ico">${[I.file, I.headset, I.shield, I.handshake][i]}</div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`).join('')}</div>
      </div>
    </section>

    <section class="section section--white">
      <div class="container">
        <div class="section-head"><span class="eyebrow eyebrow--bronze caps">${I.passport}${esc(P('progs.eyebrow'))}</span><h2 class="display h-lg on-light">${P('progs.title')}</h2></div>
        <div class="prog-grid">
          ${[['cit', I.passport], ['res', I.home], ['other', I.star]].map(([k, ic]) => `<div class="prog-col"><h3>${ic}${esc(P('progs.' + k))}</h3><div class="prog-chips">${P('progs.' + k + 'List').map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section section--cream" id="apply">
      <div class="container">
        <div class="section-head"><span class="eyebrow eyebrow--bronze caps">${I.file}${esc(P('form.eyebrow'))}</span><h2 class="display h-lg on-light">${P('form.title')}</h2><p class="lede" style="margin-top:10px">${esc(P('form.sub'))}</p></div>
        <div class="apply-grid">
          <div class="card apply-form">${formHTML()}</div>
          <aside class="apply-side">
            <div class="card card--dark"><h3>${I.info.replace('<svg', '<svg width="18" height="18" style="display:inline;vertical-align:-3px;margin-inline-end:8px;color:var(--gold)"')}${esc(P('note.title'))}</h3>
              <ul class="note-list">${P('note.items').map(x => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul></div>
            <div class="card contact-card"><p>${esc(L().footer.address)}</p><p><a class="ltr" href="tel:+97143578737">+971 4 357 8737</a></p><p><a class="ltr" href="mailto:contact@sharifgroup.ae">contact@sharifgroup.ae</a></p></div>
          </aside>
        </div>
      </div>
    </section>

    <section class="section section--white">
      <div class="container faq-wrap"><div class="faq"><h2 class="block-title">${esc(P('faq.title'))}</h2>${P('faq.items').map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}${I.plus}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></div>
    </section>`;
  }
  function formHTML() {
    const F = k => esc(t('form.' + k));
    const types = Object.entries(t('form.types')).map(([k, v]) => `<label class="type-card"><input type="radio" name="partner_type" value="${k}"><span class="tc-ico">${typeIcon[k]}</span><span class="tc-l">${esc(v)}</span></label>`).join('');
    const dial = DIAL.map(([c, k]) => `<option value="${c}">${c} ${k}</option>`).join('');
    const progs = [...t('progs.citList'), ...t('progs.resList'), ...t('progs.otherList')];
    const progKeys = ['dominica', 'stkitts', 'antigua', 'stlucia', 'grenada', 'vanuatu', 'saotome', 'nauru', 'portugal-gv', 'greece-gv', 'panama-pr', 'uae-gv', 'dubai-real-estate', 'education'];
    const chips = progs.map((p, i) => `<label class="chip-check"><input type="checkbox" name="programmes" value="${progKeys[i]}"><span>${esc(p)}</span></label>`).join('');
    const opt = obj => Object.entries(obj).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
    return `<form class="form" id="partnerForm" novalidate>
      <div class="form-alert" role="alert" id="formAlert">${F('alert')}</div>
      <fieldset class="field" id="f-type-wrap"><legend class="label">${F('type')}<span class="req">*</span></legend><div class="type-grid">${types}</div><span class="err">${F('errType')}</span></fieldset>
      <div class="form-2">
        <div class="field"><label for="f-name">${F('name')}<span class="req">*</span></label><input class="input" id="f-name" name="fullName" autocomplete="name" maxlength="80"><span class="err">${F('errName')}</span></div>
        <div class="field"><label for="f-role">${F('role')}<span class="opt">(${esc(t('common.optional'))})</span></label><input class="input" id="f-role" name="job_title" autocomplete="organization-title" maxlength="80"></div>
      </div>
      <div class="field" id="company-field"><label for="f-company">${F('company')}<span class="req">*</span></label><input class="input" id="f-company" name="company" autocomplete="organization" maxlength="120"><span class="hint">${F('companyHint')}</span><span class="err">${F('errCompany')}</span></div>
      <div class="form-2">
        <div class="field"><label for="f-country">${F('country')}<span class="req">*</span></label><input class="input" id="f-country" name="country" autocomplete="country-name" maxlength="60"><span class="err">${F('errCountry')}</span></div>
        <div class="field"><label for="f-city">${F('city')}<span class="opt">(${esc(t('common.optional'))})</span></label><input class="input" id="f-city" name="city" autocomplete="address-level2" maxlength="60"></div>
      </div>
      <div class="form-2">
        <div class="field"><label for="f-phone">${F('wa')}<span class="req">*</span></label><div class="phone"><select class="select" id="f-dial" name="dialCode" aria-label="Country code">${dial}</select><input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national"></div><span class="err">${F('errPhone')}</span></div>
        <div class="field"><label for="f-email">${F('email')}<span class="req">*</span></label><input class="input" id="f-email" name="email" type="email" inputmode="email" autocomplete="email" dir="ltr"><span class="err">${F('errEmail')}</span></div>
      </div>
      <div class="field"><label for="f-web">${F('web')}<span class="opt">(${esc(t('common.optional'))})</span></label><input class="input" id="f-web" name="website" inputmode="url" dir="ltr" placeholder="www.example.com / linkedin.com/in/…"><span class="err">${F('errWeb')}</span></div>
      <fieldset class="field"><legend class="label">${F('interest')}<span class="opt">(${esc(t('common.optional'))})</span></legend><div class="chip-grid">${chips}</div></fieldset>
      <div class="form-2">
        <div class="field"><label for="f-vol">${F('volume')}<span class="opt">(${esc(t('common.optional'))})</span></label><select class="select" id="f-vol" name="referrals_per_year"><option value="">${F('choose')}</option>${opt(t('form.volumes'))}</select></div>
        <div class="field"><label for="f-src">${F('source')}<span class="opt">(${esc(t('common.optional'))})</span></label><select class="select" id="f-src" name="heard_from"><option value="">${F('choose')}</option>${opt(t('form.sources'))}</select></div>
      </div>
      <div class="field"><label for="f-msg">${F('message')}<span class="opt">(${esc(t('common.optional'))})</span></label><textarea class="textarea" id="f-msg" name="message" maxlength="1000"></textarea></div>
      <div class="field" id="consent-field"><label class="check"><input type="checkbox" id="f-consent" name="consent" value="yes"><span>${F('consent')}<span class="req">*</span></span></label><span class="err">${F('errConsent')}</span></div>
      <div class="hp" aria-hidden="true"><label>Company website<input name="hp_url" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn--bronze btn--block" type="submit">${F('submit')}</button>
      <p class="consent-note">${I.shield}<span>${F('privacy')}</span></p>
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
      const web = String(fd.get('website') || '').trim();
      const checks = [
        ['f-type-wrap', !!type], ['f-name', name.length >= 2], ['f-company', type === 'individual' || company.length >= 2],
        ['f-country', country.length >= 2], ['f-phone', /^\d{6,13}$/.test(local)], ['f-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)],
        ['f-web', !web || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(web)], ['consent-field', fd.get('consent') === 'yes']
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
            partner_type: type, fullName: name, company, job_title: String(fd.get('job_title') || '').trim(),
            country, city: String(fd.get('city') || '').trim(),
            dialCode: dial, phone: `${dial} ${local}`, whatsapp_e164: dial + local, email, website: web,
            programmes: fd.getAll('programmes').join(', '),
            referrals_per_year: String(fd.get('referrals_per_year') || ''), heard_from: String(fd.get('heard_from') || ''),
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
      <div class="summary-card"><div class="summary-body"><ol class="timeline">${t('thanks.steps').map((s, i) => `<li class="${i === 0 ? 'done' : ''}"><strong>${esc(s.t)}</strong><span>${esc(s.d)}</span></li>`).join('')}</ol></div></div>
      <div class="btn-row" style="margin-top:28px"><a class="btn btn--dark" href="#/partners">${esc(t('thanks.back'))}</a><a class="btn btn--ghost" href="${SITE + prefix()}">${esc(t('thanks.home'))}</a></div>
    </div></div>`;
  }

  /* ---------- ADMIN ---------- */
  function viewAdmin() {
    const A = k => esc(t('admin.' + k));
    document.title = `${t('admin.title')} | Sharif Group`;
    const apps = store.get(K.apps, []);
    const cols = t('admin.cols'), types = t('form.types');
    const kp = [[apps.length, 'kTotal'], [apps.filter(a => a.partner_type === 'agency').length, 'kAgency'], [apps.filter(a => a.partner_type === 'firm').length, 'kFirm'], [apps.filter(a => a.partner_type === 'individual').length, 'kInd']];
    return `<div class="container admin-wrap">
      <span class="eyebrow eyebrow--bronze caps">${I.sliders}Google Sheet · Partner_Applications</span>
      <h1 class="display h-lg on-light" style="margin:10px 0 8px">${A('title')}</h1><p class="lede" style="margin-bottom:20px">${A('intro')}</p>
      <div class="warn">${A('warn')}</div>
      <div class="kpis">${kp.map(([v, k]) => `<div class="kpi"><b>${n(v)}</b><span>${A(k)}</span></div>`).join('')}</div>
      <div class="toolbar"><span style="font-size:13px;color:var(--muted)">CSV · UTF-8 BOM · Excel</span><button class="btn btn--dark btn--sm" type="button" id="csvBtn"${apps.length ? '' : ' disabled'}>${I.download}${A('export')}</button></div>
      ${apps.length ? `<div class="table-wrap"><table class="tbl"><thead><tr>${['id', 'at', 'type', 'name', 'company', 'country', 'wa', 'email', 'progs', 'vol'].map(k => `<th>${esc(cols[k])}</th>`).join('')}</tr></thead><tbody>
      ${apps.slice().reverse().map(a => `<tr><td><span class="ref">${esc(a.application_id)}</span></td><td dir="ltr">${esc(a.submitted_at_utc.replace('T', ' ').slice(0, 16))}</td><td>${esc(types[a.partner_type])}</td><td>${esc(a.fullName)}</td><td>${esc(a.company)}</td><td>${esc(a.country)}</td><td dir="ltr">${esc(a.phone)}</td><td dir="ltr">${esc(a.email)}</td><td style="white-space:normal;min-width:180px">${esc(a.programmes)}</td><td>${esc(a.referrals_per_year)}</td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${I.user}<p>${A('none')}</p></div>`}
    </div>`;
  }
  function exportCSV() {
    const apps = store.get(K.apps, []);
    const cols = ['application_id', 'submitted_at_utc', 'partner_type', 'fullName', 'company', 'job_title', 'country', 'city', 'phone', 'whatsapp_e164', 'email', 'website', 'programmes', 'referrals_per_year', 'heard_from', 'message', 'consent', 'lang', 'page'];
    const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const body = [cols.join(','), ...apps.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })); a.download = 'sharif-partner-applications.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
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
