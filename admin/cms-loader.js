/**
 * Sharif Group CMS Loader & Visual Live Studio Bridge (v3)
 * Enables WordPress / Wix Studio-style visual editing directly on the live website pages.
 *
 * Supported modes:
 *   1. ?cms_editor=1  — Embedded inside admin Studio iframe. Enables universal
 *                        click-to-edit on any text across the entire page,
 *                        hover indicators, floating action toolbar, and live persistence.
 *   2. ?cms_preview=1 — Standalone live preview tab with badge.
 *   3. Normal load    — Normal static website behavior.
 */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const isEditor = params.get('cms_editor') === '1';
  const isPreview = params.get('cms_preview') === '1' || isEditor;
  if (!isPreview) return;

  let _isSyncingLang = false;

  // ── Storage Helpers ─────────────────────────────────────
  function store(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function saveStore(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  }

  function getLang() {
    return document.documentElement.lang?.split('-')[0] || localStorage.getItem('sharif_lang') || 'en';
  }

  function setText(selector, text, opts = {}) {
    if (text === undefined || text === null) return;
    const elements = opts.all
      ? document.querySelectorAll(selector)
      : [document.querySelector(selector)];
    elements.forEach(e => {
      if (e) {
        e.textContent = text;
        if (opts.dir) e.dir = opts.dir;
      }
    });
  }

  function extractSlug() {
    const clean = window.location.pathname.replace(/\/index\.html?$/i, '').replace(/\/$/, '');
    const segments = clean.split('/').filter(Boolean);
    const last = (segments[segments.length - 1] || '').toLowerCase();
    return last || 'homepage';
  }

  // ── Language Sync ───────────────────────────────────────
  function applyLanguage(lang, source) {
    if (!['en', 'ar', 'fa', 'zh'].includes(lang)) return;
    _isSyncingLang = true;

    if (typeof window.switchLanguage === 'function') {
      try { window.switchLanguage(lang); } catch(e) {}
    } else {
      document.documentElement.lang = lang;
      document.documentElement.dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
      localStorage.setItem('sharif_lang', lang);
      localStorage.setItem('sharif_preferred_lang', lang);
    }

    runHydration(lang);
    updateWebsiteLangButtonsUI(lang);

    if (source !== 'parent' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CMS_LANG_CHANGED', lang }, '*');
    }

    setTimeout(() => { _isSyncingLang = false; }, 150);
  }

  function updateWebsiteLangButtonsUI(lang) {
    const currentLangText = document.getElementById('current-lang-text');
    if (currentLangText) currentLangText.textContent = lang.toUpperCase();

    document.querySelectorAll('[data-lang], .lang-option, .language-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang') || btn.getAttribute('data-language');
      if (btnLang === lang) {
        btn.classList.add('active', 'bg-luxury-gold', 'text-white');
      } else {
        btn.classList.remove('active', 'bg-luxury-gold', 'text-white');
      }
    });
  }

  // ── Standalone Preview Badge ────────────────────────────
  function showPreviewBadge() {
    if (isEditor || document.getElementById('cms-preview-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'cms-preview-badge';
    badge.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e"></span>
        <span>Sharif CMS Preview Active</span>
        <button onclick="window.close()" style="background:rgba(0,0,0,0.28);border:none;padding:4px 10px;border-radius:999px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;margin-left:4px">Close</button>
      </div>
    `;
    Object.assign(badge.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg,#C5A880,#9A7B54)', color: '#fff',
      padding: '8px 18px', borderRadius: '999px', fontFamily: 'Inter,sans-serif',
      fontSize: '12px', fontWeight: '600', zIndex: '999999', boxShadow: '0 8px 32px rgba(0,0,0,.45)',
      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'
    });
    document.body.appendChild(badge);
  }

  // ── Universal DOM Overrides ─────────────────────────────
  function applyDomOverrides(lang) {
    const l = lang || getLang();
    const pageKey = extractSlug();
    const allOverrides = store('sgcms_dom_overrides') || {};
    const pageOverrides = allOverrides[pageKey]?.[l] || {};
    for (const selector in pageOverrides) {
      try {
        const item = pageOverrides[selector];
        const el = document.querySelector(selector);
        if (el) {
          if (typeof item === 'string') {
            el.textContent = item;
          } else if (typeof item === 'object' && item !== null) {
            if (item.text !== undefined) el.textContent = item.text;
            if (item.href !== undefined && el.tagName === 'A') el.setAttribute('href', item.href);
          }
        }
      } catch(e) {}
    }
  }

  function saveDomOverride(selector, text, href) {
    const l = getLang();
    const pageKey = extractSlug();
    const allOverrides = store('sgcms_dom_overrides') || {};
    if (!allOverrides[pageKey]) allOverrides[pageKey] = {};
    if (!allOverrides[pageKey][l]) allOverrides[pageKey][l] = {};

    if (href !== undefined) {
      allOverrides[pageKey][l][selector] = { text, href };
    } else {
      allOverrides[pageKey][l][selector] = text;
    }
    saveStore('sgcms_dom_overrides', allOverrides);
  }

  // ── Page Hydration ──────────────────────────────────────
  function hydrateHomepage(lang) {
    const data = store('sgcms_homepage');
    if (!data) return;
    const l = lang || getLang();

    // 1. Hero
    const hero = data.hero?.[l] || data.hero?.en || {};
    if (hero.headline) {
      const h = document.querySelectorAll('[data-cms="hero-headline"], [data-i18n="hero.title"], #hero-section h1 .dominica-hero-glow');
      h.forEach(el => { el.textContent = hero.headline; });
    }
    if (hero.tagline) {
      const tag = document.querySelectorAll('[data-cms="hero-tagline"], [data-i18n="hero.tagline"]');
      tag.forEach(el => { el.textContent = hero.tagline; });
    }
    if (hero.pathway_citizenship) setText('[data-i18n="hero.citizenship"]', hero.pathway_citizenship);
    if (hero.pathway_residency) setText('[data-i18n="hero.residency"]', hero.pathway_residency);
    if (hero.pathway_realestate) setText('[data-i18n="hero.realEstate"]', hero.pathway_realestate);
    if (hero.pathway_education) setText('[data-i18n="hero.educationalAdvisory"]', hero.pathway_education);

    // 2. Stats
    if (data.stats && data.stats.length) {
      const statBoxes = document.querySelectorAll('#stats-section > div');
      data.stats.forEach((stat, i) => {
        if (statBoxes[i]) {
          const counter = statBoxes[i].querySelector('.counter-value');
          if (counter) {
            const num = parseInt(String(stat.value).replace(/\D/g, ''), 10);
            if (!isNaN(num)) counter.setAttribute('data-target', num);
            counter.textContent = stat.value;
          }
          const p = statBoxes[i].querySelector('p');
          if (p) p.textContent = stat['label_' + l] || stat.label_en || p.textContent;
        }
      });
    }

    // 3. About Us Preview
    const about = data.about?.[l] || data.about?.en || {};
    if (about.badge) setText('[data-i18n="about.badge"]', about.badge);
    if (about.heading) setText('[data-i18n="about.heading"]', about.heading);
    if (about.subheading) setText('[data-i18n="about.subheading"]', about.subheading);
    if (about.p1) setText('[data-i18n="about.p1"]', about.p1);
    if (about.p2) setText('[data-i18n="about.p2"]', about.p2);
    if (about.btn1_text) setText('[data-i18n="about.readStory"]', about.btn1_text);
    if (about.btn2_text) setText('[data-i18n="about.bookConsultation"]', about.btn2_text);

    // 4. Services & Pathways
    const srv = data.services || {};
    if (srv.badge) setText('[data-i18n="services.badge"]', srv.badge);
    if (srv.heading) setText('[data-i18n="services.heading"]', srv.heading);
    if (srv.heading_italic) setText('[data-i18n="services.headingItalic"]', srv.heading_italic);
    if (srv.description) setText('[data-i18n="services.description"]', srv.description);

    // Pillar 1: CBI
    if (srv.pillar_cbi) {
      const p = srv.pillar_cbi;
      if (p.pillar_badge) setText('[data-i18n="services.cbi.pillar"]', p.pillar_badge);
      if (p.title) setText('[data-i18n="services.cbi.title"]', p.title);
      if (p.p1) setText('[data-i18n="services.cbi.p1"]', p.p1);
      if (p.p2) setText('[data-i18n="services.cbi.p2"]', p.p2);
      if (p.items && p.items.length) {
        const itemEls = document.querySelectorAll('#focus-accordion-container > div:nth-child(1) .program-neon-item');
        p.items.forEach((it, idx) => {
          if (itemEls[idx]) {
            const h5 = itemEls[idx].querySelector('h5');
            const desc = itemEls[idx].querySelector('p span');
            if (h5 && it.title) h5.textContent = it.title;
            if (desc && it.desc) desc.textContent = it.desc;
          }
        });
      }
    }

    // Pillar 2: RBI
    if (srv.pillar_rbi) {
      const p = srv.pillar_rbi;
      if (p.pillar_badge) setText('[data-i18n="services.rbi.pillar"]', p.pillar_badge);
      if (p.title) setText('[data-i18n="services.rbi.title"]', p.title);
      if (p.p1) setText('[data-i18n="services.rbi.p1"]', p.p1);
      if (p.p2) setText('[data-i18n="services.rbi.p2"]', p.p2);
      if (p.items && p.items.length) {
        const itemEls = document.querySelectorAll('#focus-accordion-container > div:nth-child(2) .program-neon-item');
        p.items.forEach((it, idx) => {
          if (itemEls[idx]) {
            const h5 = itemEls[idx].querySelector('h5');
            const desc = itemEls[idx].querySelector('p span');
            if (h5 && it.title) h5.textContent = it.title;
            if (desc && it.desc) desc.textContent = it.desc;
          }
        });
      }
    }

    // Pillar 3: UAE Golden Visa
    if (srv.pillar_uae) {
      const p = srv.pillar_uae;
      if (p.pillar_badge) setText('[data-i18n="services.uaeGolden.pillar"]', p.pillar_badge);
      if (p.title) setText('[data-i18n="services.uaeGolden.title"]', p.title);
      if (p.p1) setText('[data-i18n="services.uaeGolden.p1"]', p.p1);
      if (p.p2) setText('[data-i18n="services.uaeGolden.p2"]', p.p2);
      if (p.btn_text) setText('[data-i18n="services.uaeGolden.viewProcess"]', p.btn_text);
    }

    // Pillar 4: Prime Real Estate
    if (srv.pillar_realestate) {
      const p = srv.pillar_realestate;
      if (p.pillar_badge) setText('[data-i18n="services.realEstate.pillar"]', p.pillar_badge);
      if (p.title) setText('[data-i18n="services.realEstate.title"]', p.title);
      if (p.p1) setText('[data-i18n="services.realEstate.p1"]', p.p1);
      if (p.p2) setText('[data-i18n="services.realEstate.p2"]', p.p2);
      if (p.btn_text) setText('[data-i18n="services.realEstate.exploreProperties"]', p.btn_text);
    }

    // Pillar 5: Educational Advisory
    if (srv.pillar_education) {
      const p = srv.pillar_education;
      if (p.pillar_badge) setText('[data-i18n="services.education.pillar"]', p.pillar_badge);
      if (p.title) setText('[data-i18n="services.education.title"]', p.title);
      if (p.p1) setText('[data-i18n="services.education.p1"]', p.p1);
      if (p.p2) setText('[data-i18n="services.education.p2"]', p.p2);
      if (p.btn_text) setText('[data-i18n="services.education.viewAdvisory"]', p.btn_text);
    }

    // 5. Social Responsibility
    const sr = data.social_responsibility;
    if (sr) {
      if (sr.badge) setText('[data-i18n="social.badge"]', sr.badge);
      if (sr.heading) setText('[data-i18n="social.heading"]', sr.heading);
      if (sr.description) setText('[data-i18n="social.description"]', sr.description);
      if (sr.btn_text) setText('[data-i18n="social.exploreInitiatives"]', sr.btn_text);
    }

    // 6. Reviews / Client Stories
    const rev = data.reviews;
    if (rev) {
      if (rev.badge) setText('[data-i18n="reviews.badge"]', rev.badge);
      if (rev.heading) setText('[data-i18n="reviews.heading"]', rev.heading);
      if (rev.slides && rev.slides.length) {
        const quoteEls = document.querySelectorAll('#review-slider-track blockquote');
        const imgEls = document.querySelectorAll('#review-slider-track img.client-img');
        rev.slides.forEach((sl, idx) => {
          if (quoteEls[idx] && sl.quote) quoteEls[idx].textContent = sl.quote;
          if (imgEls[idx] && sl.img) imgEls[idx].src = sl.img;
        });
      }
    }

    // 7. Contact Block
    const cb = data.contact_block;
    if (cb) {
      if (cb.badge) setText('[data-i18n="contact.badge"]', cb.badge);
      if (cb.heading) setText('[data-i18n="contact.heading"]', cb.heading);
      if (cb.subheading) setText('[data-i18n="contact.subheading"]', cb.subheading);
      if (cb.phone) {
        const ph = document.querySelector('[data-i18n="contact.phoneNumber"] ~ p a');
        if (ph) { ph.textContent = cb.phone; ph.href = 'tel:' + cb.phone.replace(/\s+/g, ''); }
      }
      if (cb.email) {
        const em = document.querySelector('[data-i18n="contact.emailAddress"] ~ p a');
        if (em) { em.textContent = cb.email; em.href = 'mailto:' + cb.email; }
      }
      if (cb.office_address) setText('[data-i18n="contact.officeAddress"]', cb.office_address);
    }
  }

  function hydrateProgramPage(type, lang) {
    const list = store(type === 'citizenship' ? 'sgcms_citizenship' : 'sgcms_residency');
    if (!list) return;

    const slug = extractSlug();
    const l = lang || getLang();
    const prog = list.find(p => p.slug === slug || p.id === slug || slug.includes(p.slug || p.id)) || list[0];
    if (!prog) return;

    const ld = prog[l] || prog.en || {};

    // 1. Hero Title & Glow
    const displayTitle = ld.hero_title || (ld.title ? ld.title.replace(/\s+(citizenship|residency).*$/i, '').trim() : '');
    if (displayTitle) {
      const h1 = document.querySelector('h1 .dominica-hero-glow') || document.querySelector('h1');
      if (h1) h1.textContent = displayTitle;
      document.title = (ld.title || prog.en?.title || displayTitle) + ' | Sharif Group';
    }

    // Hero Subtitle & Tagline
    if (ld.hero_subtitle) {
      const sub = document.querySelector('h1 span.uppercase, [data-i18n*="heroSubtitle"]');
      if (sub) sub.textContent = ld.hero_subtitle;
    }
    if (ld.hero_tagline) {
      const tag = document.querySelector('h1 + p, [data-i18n*="heroTagline"], [data-i18n*="heroDesc"]');
      if (tag) tag.textContent = ld.hero_tagline;
    }

    // 2. 5 Hero Badges
    if (Array.isArray(ld.badges)) {
      ld.badges.forEach((badgeText, idx) => {
        if (!badgeText) return;
        const el = document.querySelector(`[data-i18n*="heroBadge${idx + 1}"]`);
        if (el) el.textContent = badgeText;
      });
    }

    // 3. Specs / Fast Facts
    if (ld.investment_from) setText('[data-i18n*="specInvestmentCostDesc"]', ld.investment_from);
    if (ld.processing_time) setText('[data-i18n*="specProcessingDesc"]', ld.processing_time);
    if (ld.visa_free) setText('[data-i18n*="specVisaFreeDesc"]', ld.visa_free);

    if (Array.isArray(ld.specs)) {
      if (ld.specs[0]?.desc) setText('[data-i18n*="specProcessingDesc"]', ld.specs[0].desc);
      if (ld.specs[1]?.desc) setText('[data-i18n*="specVisaFreeDesc"]', ld.specs[1].desc);
      if (ld.specs[2]?.desc) setText('[data-i18n*="specInvestmentTypeDesc"]', ld.specs[2].desc);
      if (ld.specs[3]?.desc) setText('[data-i18n*="specInvestmentCostDesc"]', ld.specs[3].desc);
      if (ld.specs[4]?.desc) setText('[data-i18n*="specFamilyDesc"]', ld.specs[4].desc);
    }

    // 4. Executive Overview
    if (ld.overview_title) setText('[data-i18n*="overviewTitle"]', ld.overview_title);
    if (ld.overview || ld.overview_p1) setText('[data-i18n*="overviewDesc"]', ld.overview_p1 || ld.overview);

    // 5. Benefits Cards
    if (Array.isArray(ld.benefits) && ld.benefits.length) {
      const benefitEls = document.querySelectorAll('#sec-benefits .benefit-card-group, #sec-benefits .benefit-item, #benefits-grid > div');
      ld.benefits.forEach((b, i) => {
        if (benefitEls[i]) {
          const title = benefitEls[i].querySelector('h3, h4, .benefit-title');
          const desc = benefitEls[i].querySelector('p, .benefit-desc');
          if (title && b.title) title.textContent = b.title;
          if (desc && b.desc) desc.textContent = b.desc;
        }
      });
    }

    // 6. Investment Routes
    if (Array.isArray(ld.investment_options) && ld.investment_options.length) {
      if (ld.investment_options[0]) {
        setText('[data-i18n*="edfTitle"]', ld.investment_options[0].title);
        setText('[data-i18n*="edfDesc"]', ld.investment_options[0].desc);
      }
      if (ld.investment_options[1]) {
        setText('[data-i18n*="realEstateTitle"]', ld.investment_options[1].title);
        setText('[data-i18n*="realEstateDesc"]', ld.investment_options[1].desc);
      }
    }

    // 7. Who Can Apply Requirements
    if (Array.isArray(ld.applicant_reqs)) {
      ld.applicant_reqs.forEach((r, i) => {
        if (r) setText(`[data-i18n*="whoCanApplyReq${i + 1}"]`, r);
      });
    }
    if (Array.isArray(ld.family_reqs)) {
      ld.family_reqs.forEach((f, i) => {
        if (f) setText(`[data-i18n*="whoCanApplyFam${i + 1}"]`, f);
      });
    }

    // 8. Required Documents
    if (Array.isArray(ld.documents)) {
      ld.documents.forEach((d, i) => {
        if (d && d.title) setText(`[data-i18n*="doc${i + 1}Title"]`, d.title);
        if (d && d.desc) setText(`[data-i18n*="doc${i + 1}Desc"]`, d.desc);
      });
    }

    // 9. Timeline Steps
    if (Array.isArray(ld.timeline_steps)) {
      ld.timeline_steps.forEach((s, i) => {
        if (!s) return;
        if (s.month) setText(`[data-i18n*="timelineStep${i + 1}Month"]`, s.month);
        if (s.title) setText(`[data-i18n*="timelineStep${i + 1}Title"]`, s.title);
        if (s.desc) setText(`[data-i18n*="timelineStep${i + 1}Desc"]`, s.desc);
        if (s.note) setText(`[data-i18n*="timelineStep${i + 1}Note"]`, s.note);
      });
    }

    // 10. FAQs
    if (Array.isArray(ld.faqs)) {
      ld.faqs.forEach((faq, i) => {
        if (!faq) return;
        if (faq.a) setText(`[data-i18n*="faqA${i + 1}"]`, faq.a);
      });
    }

    // 11. Consultation Section
    if (ld.consult_heading) setText('#program-consult-form-section h3, [data-i18n*="consultTitle"]', ld.consult_heading);
    if (ld.consult_subheading) setText('#program-consult-form-section p, [data-i18n*="consultDesc"]', ld.consult_subheading);
  }

  
  function mapCategoryToDataCat(catName, subCat) {
    if (!catName) return 'sharif';
    const c = catName.trim().toLowerCase();
    let tokens = [];
    if (c === 'citizenship' || c.includes('citizenship')) tokens.push('citizenship');
    if (c === 'residency' || c.includes('residency')) tokens.push('residency');
    if (c.includes('golden') || c.includes('golden-visa')) { tokens.push('golden-visa'); tokens.push('residency'); }
    if (c.includes('real estate') || c.includes('real-estate')) tokens.push('real-estate');
    if (c.includes('educational')) tokens.push('educational');
    if (c.includes('corporate') || c.includes('tax') || c.includes('company')) tokens.push('company');
    if (c.includes('sharif') || c.includes('insight')) tokens.push('sharif');
    if (!tokens.length) tokens.push('sharif');
    if (subCat) tokens.push(subCat.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    return tokens.join(' ');
  }

  function updateLiveBlogDraft(draft) {
    if (!draft) return;
    const grid = document.getElementById('all-blogs-grid');
    if (!grid) return;

    window.articlesDatabase = window.articlesDatabase || {};

    const title = draft.title || 'New Strategic Insight Article';
    const excerpt = draft.excerpt || '';
    const category = draft.category || 'Citizenship';
    const subcat = draft.subcategory ? ' · ' + draft.subcategory : '';
    const author = draft.author || 'Sharif Group Advisory';
    const date = draft.publish_date || draft.date || new Date().toISOString().split('T')[0];
    const img = draft.featured_img || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';
    const slug = draft.slug || 'live-draft-preview';
    const dataCat = mapCategoryToDataCat(category, draft.subcategory);

    // Register into client-side database so clicking 'READ MORE' works instantly
    const draftArticleObj = {
      title: title,
      category: category + subcat,
      author: author,
      date: date,
      updated: date,
      image: img,
      content: draft.body || (excerpt ? `<p>${excerpt}</p>` : '<p>Article content preview will appear here...</p>'),
      faqs: []
    };
    window.articlesDatabase[slug] = draftArticleObj;
    window.articlesDatabase['live-draft-preview'] = draftArticleObj;
    if (draft.id) window.articlesDatabase[draft.id] = draftArticleObj;

    let card = document.getElementById('cms-live-draft-card');
    const isNewCard = !card;
    if (!card) {
      card = document.createElement('article');
      card.id = 'cms-live-draft-card';
      card.className = 'space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog live-draft-active';
      grid.prepend(card);
      setTimeout(() => {
        try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
      }, 100);
    }

    card.setAttribute('data-cat', dataCat);
    card.style.display = 'flex';
    card.setAttribute('data-paginated', 'true');

    card.innerHTML = `
      <div class="space-y-3">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-xl border-2 border-[#C5A880] relative group">
          <img alt="${escH(title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${img}" onerror="this.src='https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp'">
          <div style="position:absolute;top:10px;left:10px;background:linear-gradient(135deg,#B38E5D,#8a6839);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(0,0,0,.35);letter-spacing:.05em">
            <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;display:inline-block"></span>
            LIVE ARTICLE PREVIEW
          </div>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-[#786142] font-semibold uppercase tracking-wider">
          <span class="blog-card-cat font-bold text-[#9C7744]">${escH(category + subcat)}</span>
          <span>•</span>
          <span class="blog-card-date">${escH(date)}</span>
          <span>•</span>
          <span class="blog-card-author text-neutral-400 font-normal">${escH(author)}</span>
        </div>
        <h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">
          ${escH(title)}
        </h4>
        ${excerpt ? `<p class="text-xs text-neutral-500 font-light line-clamp-2">${escH(excerpt)}</p>` : ''}
      </div>
      <a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start cursor-pointer" href="javascript:void(0)" onclick="openBlogDetailBySlug('${slug}')">
        READ MORE
      </a>
    `;

    // Also update detail drawer if it's currently open
    const detailView = document.getElementById('blog-detail-view-container');
    if (detailView && !detailView.classList.contains('hidden')) {
      const dt = document.getElementById('detail-title'); if (dt) dt.innerText = title;
      const dc = document.getElementById('detail-category-badge'); if (dc) dc.innerText = category + subcat;
      const da = document.getElementById('detail-author'); if (da) da.innerText = author;
      const dd = document.getElementById('detail-date'); if (dd) dd.innerText = date;
      const di = document.getElementById('detail-image'); if (di) di.src = img;
      const db = document.getElementById('detail-content-body'); if (db && draft.body) db.innerHTML = draft.body;
    }
  }

  function hydrateBlog(lang) {
    const blogs = store('sgcms_blog') || [];
    const l = lang || getLang();

    // Ensure articlesDatabase exists so dynamically added articles can open in detail reader
    window.articlesDatabase = window.articlesDatabase || {};

    const grid = document.getElementById('all-blogs-grid');
    if (!grid) return;

    if (!Array.isArray(blogs) || !blogs.length) return;

    // Process every blog created or edited in CMS
    blogs.forEach((b) => {
      const ld = b[l] || b.en || {};
      if (!ld || !ld.title) return;
      const slug = ld.slug || b.id;
      const status = b['status_' + l] || b.status_en || 'published';
      if (status !== 'published') return;

      const subcat = b.subcategory ? ' · ' + b.subcategory : '';
      const catDisplay = (b.category || 'Sharif Group Insights') + subcat;
      const dataCat = mapCategoryToDataCat(b.category, b.subcategory);

      // Register article data in the client-side database
      const articleData = {
        title: ld.title || 'Untitled Article',
        category: catDisplay,
        author: b.author || 'Sharif Group Advisory',
        date: b.publish_date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        updated: b.publish_date || '',
        image: b.featured_img || 'https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp',
        content: ld.body || `<p>${ld.excerpt || ''}</p>`,
        faqs: []
      };
      window.articlesDatabase[slug] = articleData;
      window.articlesDatabase[b.id] = articleData;

      let existingCard = document.querySelector(`[data-cms-blog-id="${b.id}"]`);
      if (!existingCard) {
        const articleEl = document.createElement('article');
        articleEl.className = 'space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog';
        articleEl.setAttribute('data-cms-blog-id', b.id);
        articleEl.setAttribute('data-cat', dataCat);
        articleEl.style.display = 'flex';
        articleEl.setAttribute('data-paginated', 'true');

        articleEl.innerHTML = `
          <div class="space-y-3">
            <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-md neon-card-hover border border-neutral-200/70">
              <img alt="${escH(ld.title || 'Article')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${b.featured_img || 'https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp'}" onerror="this.src='https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp'">
            </div>
            <div class="flex items-center gap-2 text-[10px] text-[#786142] font-semibold uppercase tracking-wider">
              <span>${escH(catDisplay)}</span>
              <span>•</span>
              <span>${escH(b.publish_date || 'Recent')}</span>
              <span>•</span>
              <span class="text-neutral-400 font-normal">${escH(b.author || 'Sharif Group')}</span>
            </div>
            <h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">
              ${escH(ld.title || 'Untitled Article')}
            </h4>
            ${ld.excerpt ? `<p class="text-xs text-neutral-500 font-light line-clamp-2">${escH(ld.excerpt)}</p>` : ''}
          </div>
          <a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start cursor-pointer" href="javascript:void(0)" onclick="openBlogDetailBySlug('${slug}')">
            READ MORE
          </a>
        `;
        const draftCard = document.getElementById('cms-live-draft-card');
        if (draftCard && draftCard.nextSibling) {
          grid.insertBefore(articleEl, draftCard.nextSibling);
        } else {
          grid.prepend(articleEl);
        }
      } else {
        // Update existing card
        existingCard.setAttribute('data-cat', dataCat);
        existingCard.style.display = 'flex';
        existingCard.setAttribute('data-paginated', 'true');
        const img = existingCard.querySelector('img');
        if (img && b.featured_img) img.src = b.featured_img;
        const h4 = existingCard.querySelector('h4');
        if (h4 && ld.title) h4.textContent = ld.title;
        const p = existingCard.querySelector('p');
        if (p && ld.excerpt) p.textContent = ld.excerpt;
      }
    });

    // Force all CMS-added cards to stay visible at the top of the grid (pinned before hardcoded articles)
    const draftCard = document.getElementById('cms-live-draft-card');
    const dynamicCards = grid.querySelectorAll('.dynamic-cms-blog');
    if (draftCard) {
      grid.prepend(draftCard);
    }
    Array.from(dynamicCards).reverse().forEach(card => {
      if (draftCard) {
        draftCard.after(card);
      } else {
        grid.prepend(card);
      }
    });

    // Re-run pagination if available
    if (typeof window.paginateBlogs === 'function') {
      window.paginateBlogs();
    } else if (typeof window.initPagination === 'function') {
      window.initPagination();
    }
    // Always guarantee all CMS dynamic cards and live draft stay visible
    grid.querySelectorAll('.dynamic-cms-blog, #cms-live-draft-card').forEach(el => {
      el.style.display = 'flex';
      el.setAttribute('data-paginated', 'true');
    });

    // Update single-article detail view if currently reading
    const first = blogs[0];
    if (first) {
      const firstLd = first[l] || first.en || {};
      if (firstLd.title) {
        const titleEl = document.querySelector('[data-cms="blog-title"]');
        if (titleEl) titleEl.textContent = firstLd.title;
      }
    }
  }

  function hydrateNavigation(lang) {
    const l = lang || getLang();
    const ci = store('sgcms_citizenship');
    const ri = store('sgcms_residency');

    function updateMenuLinks(programs, type) {
      if (!Array.isArray(programs)) return;
      programs.forEach(p => {
        if (!p || !p.id) return;
        const aliases = [p.id, p.slug];
        if (p.id === 'stkitts') aliases.push('stkittis');
        if (p.id === 'grenada') aliases.push('greneda');
        if (p.id === 'antigua') aliases.push('antiguaandbarbuda');
        if (p.id === 'saotome') aliases.push('sãotoméandpríncipe', 'sao-tome');

        const label = (p[l]?.nav_label || p.en?.nav_label || p.en?.title || '').trim();
        const isVisible = p.nav_visible !== false;

        document.querySelectorAll('a[href]').forEach(a => {
          const href = a.getAttribute('href') || '';
          const matches = aliases.some(alias => href.toLowerCase().includes('/' + alias.toLowerCase() + '/') || href.toLowerCase().endsWith('/' + alias.toLowerCase()) || href.toLowerCase().includes(alias.toLowerCase() + '.html'));
          if (matches && (href.includes(type) || href.includes('programs'))) {
            const li = a.closest('li');
            if (li) {
              li.style.display = isVisible ? '' : 'none';
            } else {
              a.style.display = isVisible ? '' : 'none';
            }
            if (label) {
              const textSpan = a.querySelector('[data-i18n], span, font') || a;
              if (textSpan && textSpan.children.length === 0) {
                textSpan.textContent = label;
              }
            }
          }
        });
      });
    }

    if (ci) {
      updateMenuLinks(ci, 'citizenship');
      const ciMenuEl = document.querySelector('[data-cms-nav="citizenship"]');
      if (ciMenuEl) {
        const visible = ci.filter(p => p.nav_visible && p.status === 'published').sort((a,b)=>(a.nav_sort||0)-(b.nav_sort||0));
        ciMenuEl.innerHTML = visible.map(p => `<a href="programs/citizenshipbyinvestment/${p.slug || p.id}/index.html" class="mega-menu-item">${(p[l]?.nav_label || p.en?.nav_label || p.en?.title || '').trim()}</a>`).join('');
      }
    }
    if (ri) {
      updateMenuLinks(ri, 'residency');
      const riMenuEl = document.querySelector('[data-cms-nav="residency"]');
      if (riMenuEl) {
        const visible = ri.filter(p => p.nav_visible && p.status === 'published').sort((a,b)=>(a.nav_sort||0)-(b.nav_sort||0));
        riMenuEl.innerHTML = visible.map(p => `<a href="programs/residencybyinvestment/${p.slug || p.id}/index.html" class="mega-menu-item">${(p[l]?.nav_label || p.en?.nav_label || p.en?.title || '').trim()}</a>`).join('');
      }
    }
  }

  function hydrateAboutUs(lang) {
    const data = store('sgcms_aboutus');
    if (!data) return;
    const l = lang || getLang();

    // 1. Hero
    const hero = data.hero?.[l] || data.hero?.en || {};
    if (hero.badge) setText('[data-i18n="pages.aboutUs.heroBadge"]', hero.badge);
    if (hero.title) setText('[data-i18n="pages.aboutUs.heroTitle"]', hero.title);
    if (hero.subtitle) setText('.about-hero-subtitle, [data-i18n="pages.aboutUs.heroSubtitle"]', hero.subtitle);
    if (hero.img) {
      const heroSlide = document.querySelector('.contact-hero-slide');
      if (heroSlide) heroSlide.style.backgroundImage = `linear-gradient(rgba(11,15,20,0.7), rgba(11,15,20,0.8)), url('${hero.img}')`;
    }

    // 2. Overview
    const ov = data.overview?.[l] || data.overview?.en || {};
    if (ov.badge) setText('[data-i18n="pages.aboutUs.about_overview_item1"]', ov.badge);
    if (ov.heading) {
      const el = document.querySelector('[data-i18n-html="pages.aboutUs.about_overview_item2"], [data-i18n="pages.aboutUs.about_overview_item2"]');
      if (el) el.innerHTML = ov.heading.includes('<') ? ov.heading : `${ov.heading}:<br/><span class="italic text-[#C5A880] font-serif font-normal">Sharif Group</span>`;
    }
    if (ov.p1) setText('[data-i18n="pages.aboutUs.about_overview_item3"]', ov.p1);
    if (ov.p2) setText('[data-i18n="pages.aboutUs.about_overview_item4"]', ov.p2);
    if (ov.cta_text) setText('[data-i18n="pages.aboutUs.about_overview_item5"]', ov.cta_text);

    // 3. Stats
    if (Array.isArray(data.stats) && data.stats.length) {
      const counters = document.querySelectorAll('#kpi-counters-section .counter-val');
      const labels = document.querySelectorAll('#kpi-counters-section p');
      data.stats.forEach((st, i) => {
        if (counters[i] && st.value) {
          const num = parseInt(String(st.value).replace(/\D/g, ''), 10);
          if (!isNaN(num)) counters[i].setAttribute('data-target', num);
          counters[i].textContent = st.value;
        }
        if (labels[i]) {
          labels[i].textContent = st['label_' + l] || st.label_en || labels[i].textContent;
        }
      });
    }

    // 4. Corporate Architecture
    const arch = data.architecture?.[l] || data.architecture?.en || {};
    if (arch.badge) setText('[data-i18n="pages.aboutUs.corporate_architecture_item1"]', arch.badge);
    if (arch.title) {
      const el = document.querySelector('[data-i18n-html="pages.aboutUs.corporate_architecture_item2"], [data-i18n="pages.aboutUs.corporate_architecture_item2"]');
      if (el) el.innerHTML = arch.title.includes('<') ? arch.title : `Three Companies. <span class="italic text-[#C5A880] font-serif font-normal">One Commitment.</span>`;
    }
    if (arch.desc) setText('[data-i18n="pages.aboutUs.corporate_architecture_item3"]', arch.desc);

    if (arch.c1_badge) setText('[data-i18n="pages.aboutUs.corporate_architecture_item4"]', arch.c1_badge);
    if (arch.c1_p1) setText('[data-i18n="pages.aboutUs.corporate_architecture_item7"]', arch.c1_p1);
    if (arch.c1_p2) setText('[data-i18n="pages.aboutUs.corporate_architecture_item8"]', arch.c1_p2);

    if (arch.c2_badge) setText('[data-i18n="pages.aboutUs.corporate_architecture_item11"]', arch.c2_badge);
    if (arch.c2_p1) setText('[data-i18n="pages.aboutUs.corporate_architecture_item14"]', arch.c2_p1);
    if (arch.c2_p2) setText('[data-i18n="pages.aboutUs.corporate_architecture_item15"]', arch.c2_p2);

    if (arch.c3_badge) setText('[data-i18n="pages.aboutUs.corporate_architecture_item18"]', arch.c3_badge);
    if (arch.c3_p1) setText('[data-i18n="pages.aboutUs.corporate_architecture_item21"]', arch.c3_p1);
    if (arch.c3_p2) setText('[data-i18n="pages.aboutUs.corporate_architecture_item22"]', arch.c3_p2);

    // 5. Founder
    const f = data.founder?.[l] || data.founder?.en || {};
    if (f.name) setText('[data-i18n="pages.aboutUs.founder_message_item1"], [data-i18n="pages.aboutUs.founder_message_item7"]', f.name, { all: true });
    if (f.title) setText('[data-i18n="pages.aboutUs.founder_message_item2"], [data-i18n="pages.aboutUs.founder_message_item8"]', f.title, { all: true });
    if (f.badge) setText('[data-i18n="pages.aboutUs.founder_message_item3"]', f.badge);
    if (f.quote) setText('[data-i18n-html="pages.aboutUs.founder_message_item4"], [data-i18n="pages.aboutUs.founder_message_item4"]', f.quote);
    if (f.p1) setText('[data-i18n="pages.aboutUs.founder_message_item5"]', f.p1);
    if (f.p2) setText('[data-i18n="pages.aboutUs.founder_message_item6"]', f.p2);

    // 6. Bottom CTA
    const cta = data.cta?.[l] || data.cta?.en || {};
    if (cta.badge) setText('[data-i18n="pages.aboutUs.about_cta_item1"]', cta.badge);
    if (cta.heading) setText('[data-i18n-html="pages.aboutUs.about_cta_item2"], [data-i18n="pages.aboutUs.about_cta_item2"]', cta.heading);
    if (cta.desc) setText('[data-i18n="pages.aboutUs.about_cta_item3"]', cta.desc);
    if (cta.btn_text) setText('[data-i18n="pages.aboutUs.about_cta_item4"]', cta.btn_text);
  }

  function runHydration(lang) {
    const l = lang || getLang();
    const path = window.location.pathname.toLowerCase();
    hydrateNavigation(l);

    const isNonHome = path.includes('/citizenship') || path.includes('/residency') || path.includes('/programs') || path.includes('/about') || path.includes('/contact') || path.includes('/blog') || path.includes('/admin');

    if (!isNonHome) {
      hydrateHomepage(l);
    } else if (path.includes('citizenship')) {
      hydrateProgramPage('citizenship', l);
    } else if (path.includes('residency')) {
      hydrateProgramPage('residency', l);
    } else if (path.includes('about')) {
      hydrateAboutUs(l);
    } else if (path.includes('blog')) {
      hydrateBlog(l);
    }

    // Apply any arbitrary saved DOM overrides for this page & language
    applyDomOverrides(l);
  }

  // ── True WordPress/Wix Style Universal Click-to-Edit ───
  function setupVisualEditor() {
    if (!isEditor) return;

    // Inject Studio Styles
    const style = document.createElement('style');
    style.id = 'cms-editor-styles';
    style.textContent = `
      /* Hover outlines */
      .cms-target-hover {
        outline: 2px dashed #C5A880 !important;
        outline-offset: 3px !important;
        cursor: text !important;
        background-color: rgba(197, 168, 128, 0.08) !important;
        border-radius: 4px !important;
        transition: outline 0.15s ease, background-color 0.15s ease !important;
      }

      /* Active editing */
      .cms-inline-active {
        outline: 2.5px solid #C5A880 !important;
        outline-offset: 4px !important;
        background-color: rgba(197, 168, 128, 0.18) !important;
        box-shadow: 0 0 24px rgba(197, 168, 128, 0.45) !important;
        caret-color: #C5A880 !important;
        cursor: text !important;
        border-radius: 5px !important;
        position: relative !important;
        z-index: 999998 !important;
      }

      /* Floating Action Toolbar */
      #cms-inline-toolbar {
        position: fixed;
        z-index: 999999;
        display: none;
        align-items: center;
        gap: 6px;
        background: #181818;
        border: 1px solid #C5A880;
        border-radius: 8px;
        padding: 5px 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.85);
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: #fff;
        user-select: none;
      }
      .cft-lang {
        background: #C5A880;
        color: #0A0A0A;
        font-weight: 800;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .cft-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: 1px solid rgba(255,255,255,0.15);
        color: #fff;
        border-radius: 5px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .cft-btn:hover {
        background: rgba(255,255,255,0.1);
      }
      .cft-btn-save {
        background: linear-gradient(135deg, #C5A880, #B3946B) !important;
        border: none !important;
        color: #0A0A0A !important;
        font-weight: 700 !important;
      }
      .cft-btn-save:hover {
        box-shadow: 0 2px 10px rgba(197,168,128,0.5) !important;
      }
      .cft-btn-cancel {
        color: #f87171 !important;
        border-color: rgba(239,68,68,0.3) !important;
      }
      .cft-btn-cancel:hover {
        background: rgba(239,68,68,0.15) !important;
      }

      /* Hover Tooltip */
      #cms-hover-tooltip {
        position: fixed;
        z-index: 999997;
        pointer-events: none;
        display: none;
        background: #C5A880;
        color: #0A0A0A;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        white-space: nowrap;
      }

      /* Floating Save Toast */
      #cms-save-toast {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: #11261a;
        border: 1px solid #22c55e;
        color: #4ade80;
        padding: 6px 16px;
        border-radius: 999px;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        font-weight: 600;
        z-index: 1000000;
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #cms-save-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* Section Add / Settings Floating Badge */
      .cms-section-tool {
        position: absolute;
        top: 10px;
        right: 14px;
        z-index: 99999;
        display: none;
        background: rgba(20,20,20,0.92);
        border: 1px solid #C5A880;
        border-radius: 999px;
        padding: 4px 10px;
        color: #C5A880;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      }
      .cms-section-tool:hover {
        background: #C5A880;
        color: #0A0A0A;
      }

      /* Browse Mode Inactive Styles */
      body.cms-mode-browse .cms-target-hover {
        outline: none !important;
        cursor: inherit !important;
      }
      body.cms-mode-browse #cms-hover-tooltip {
        display: none !important;
      }
      body.cms-mode-browse #cms-inline-toolbar {
        display: none !important;
      }
      body.cms-mode-browse .cms-section-tool {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Create Tooltip, Toolbar and Toast elements
    const tooltip = document.createElement('div');
    tooltip.id = 'cms-hover-tooltip';
    tooltip.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>Click to edit';
    document.body.appendChild(tooltip);

    const toast = document.createElement('div');
    toast.id = 'cms-save-toast';
    toast.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:5px"><polyline points="20 6 9 17 4 12"/></svg><span>Saved to website!</span>';
    document.body.appendChild(toast);

    function flashToast(msg) {
      if (msg) toast.querySelector('span:last-child').textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }

    const toolbar = document.createElement('div');
    toolbar.id = 'cms-inline-toolbar';
    toolbar.innerHTML = `
      <span class="cft-lang">${getLang().toUpperCase()}</span>
      <button type="button" class="cft-btn cft-btn-save" id="cft-btn-save"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>Save</button>
      <button type="button" class="cft-btn cft-btn-cancel" id="cft-btn-cancel" title="Cancel edit"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      <button type="button" class="cft-btn" id="cft-btn-link" style="display:none" title="Edit link URL"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Link</button>
      <input type="text" id="cft-link-input" placeholder="https:// or page.html" style="display:none;background:#262626;border:1px solid #C5A880;color:#fff;font-size:11px;padding:3px 6px;border-radius:4px;width:140px;outline:none">
    `;
    document.body.appendChild(toolbar);

    let activeEl = null;
    let originalText = '';
    let hoveredEl = null;

    let editMode = localStorage.getItem('sgcms_canvas_mode') !== 'browse';

    function setEditMode(enabled, notifyParent, showMsg) {
      editMode = enabled;
      localStorage.setItem('sgcms_canvas_mode', enabled ? 'edit' : 'browse');
      document.body.classList.toggle('cms-mode-browse', !enabled);

      if (!enabled) {
        if (activeEl) cancelCurrentActive();
        if (hoveredEl) {
          hoveredEl.classList.remove('cms-target-hover');
          hoveredEl = null;
        }
        tooltip.style.display = 'none';
        toolbar.style.display = 'none';
      }

      if (showMsg) {
        flashToast(enabled ? 'Edit Mode: Click any text to edit' : 'Live Browse: Click links & buttons freely');
      }

      if (notifyParent && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CMS_MODE_CHANGED', mode: enabled ? 'edit' : 'browse' }, '*');
      }
    }

    setEditMode(editMode, false, false);

    // Helper to generate a stable selector for any element
    function getStableSelector(el) {
      if (!el) return '';
      if (el.id) return '#' + el.id;
      if (el.getAttribute('data-i18n')) return `[data-i18n="${el.getAttribute('data-i18n')}"]`;
      if (el.getAttribute('data-cms')) return `[data-cms="${el.getAttribute('data-cms')}"]`;

      let path = [];
      let cur = el;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        let tag = cur.tagName.toLowerCase();
        if (cur.id) {
          path.unshift('#' + cur.id);
          break;
        }
        let parent = cur.parentElement;
        if (parent) {
          let siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
          if (siblings.length > 1) {
            let index = siblings.indexOf(cur) + 1;
            tag += `:nth-of-type(${index})`;
          }
        }
        path.unshift(tag);
        cur = cur.parentElement;
      }
      return path.join(' > ');
    }

    // Determine if element is an editable text target
    function isEditableTarget(el) {
      if (!el || el === document.body || el === document.documentElement) return false;
      const ignoreTags = ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'CANVAS'];
      if (ignoreTags.includes(el.tagName)) return false;
      if (el.closest('#cms-inline-toolbar') || el.closest('#cms-hover-tooltip') || el.closest('#cms-save-toast') || el.closest('#cms-preview-badge') || el.closest('.cms-section-tool')) return false;

      const tag = el.tagName;
      const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'SPAN', 'LABEL', 'STRONG', 'EM', 'B', 'I', 'LI', 'BLOCKQUOTE'];
      if (textTags.includes(tag) || el.classList.contains('dominica-hero-glow') || el.classList.contains('counter-value')) {
        // Return true if it has text
        return Boolean(el.innerText && el.innerText.trim().length > 0);
      }
      if (el.hasAttribute('data-i18n') || el.hasAttribute('data-cms')) return true;
      return false;
    }

    // Position floating toolbar above active element
    function positionToolbar(el) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      toolbar.querySelector('.cft-lang').textContent = getLang().toUpperCase();

      const linkBtn = toolbar.querySelector('#cft-btn-link');
      const linkInput = toolbar.querySelector('#cft-link-input');
      const isAnchor = el.tagName === 'A' || Boolean(el.closest('a'));
      linkBtn.style.display = isAnchor ? 'inline-flex' : 'none';
      linkInput.style.display = 'none';

      toolbar.style.display = 'flex';
      let top = rect.top - toolbar.offsetHeight - 8;
      if (top < 10) top = rect.bottom + 8; // flip below if at very top
      let left = rect.left;
      if (left + toolbar.offsetWidth > window.innerWidth - 10) {
        left = window.innerWidth - toolbar.offsetWidth - 10;
      }
      if (left < 10) left = 10;

      toolbar.style.top = `${top}px`;
      toolbar.style.left = `${left}px`;
    }

    // Save active element content
    function saveCurrentActive() {
      if (!activeEl) return;
      const newText = activeEl.innerText.trim();
      const l = getLang();
      const selector = getStableSelector(activeEl);

      let hrefVal = undefined;
      const anchor = activeEl.tagName === 'A' ? activeEl : activeEl.closest('a');
      if (anchor) hrefVal = anchor.getAttribute('href');

      // 1. Save DOM Override
      saveDomOverride(selector, newText, hrefVal);

      // 2. Map to structured CMS keys if recognized
      const cmsField = activeEl.getAttribute('data-cms');
      const i18nKey = activeEl.getAttribute('data-i18n');
      const path = window.location.pathname.toLowerCase();
      const isHomepage = !path.includes('/programs') && !path.includes('/citizenship') && !path.includes('/residency') && !path.includes('/about') && !path.includes('/contact');

      if (isHomepage) {
        const d = store('sgcms_homepage') || {};
        if (cmsField === 'hero-headline' || i18nKey === 'hero.title' || activeEl.closest('#hero-section h1')) {
          if (!d.hero) d.hero = {};
          if (!d.hero[l]) d.hero[l] = {};
          d.hero[l].headline = newText;
        } else if (cmsField === 'hero-tagline' || i18nKey === 'hero.tagline') {
          if (!d.hero) d.hero = {};
          if (!d.hero[l]) d.hero[l] = {};
          d.hero[l].tagline = newText;
        } else if (i18nKey === 'about.heading') {
          if (!d.about) d.about = {};
          if (!d.about[l]) d.about[l] = {};
          d.about[l].heading = newText;
        } else if (i18nKey === 'about.p1') {
          if (!d.about) d.about = {};
          if (!d.about[l]) d.about[l] = {};
          d.about[l].p1 = newText;
        } else if (i18nKey === 'about.p2') {
          if (!d.about) d.about = {};
          if (!d.about[l]) d.about[l] = {};
          d.about[l].p2 = newText;
        }
        saveStore('sgcms_homepage', d);
      } else {
        // Program page
        const type = path.includes('residency') ? 'sgcms_residency' : 'sgcms_citizenship';
        const list = store(type);
        if (list && list.length) {
          const slug = extractSlug();
          const idx = list.findIndex(p => p.slug === slug || p.id === slug || slug.includes(p.slug || p.id));
          if (idx >= 0) {
            if (!list[idx][l]) list[idx][l] = {};
            if (activeEl.closest('h1')) {
              list[idx][l].title = newText;
            } else if (i18nKey && i18nKey.includes('overviewDesc')) {
              list[idx][l].overview = newText;
            } else if (i18nKey && i18nKey.includes('specInvestmentCostDesc')) {
              list[idx][l].investment_from = newText;
            } else if (i18nKey && i18nKey.includes('specProcessingDesc')) {
              list[idx][l].processing_time = newText;
            } else if (i18nKey && i18nKey.includes('specVisaFreeDesc')) {
              list[idx][l].visa_free = newText;
            }
            saveStore(type, list);
          }
        }
      }

      // Notify parent dashboard
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'CMS_INLINE_SAVED',
          text: newText,
          selector,
          lang: l
        }, '*');
      }

      flashToast('Saved: "' + (newText.length > 20 ? newText.slice(0, 20) + '…' : newText) + '"');

      // Cleanup
      activeEl.contentEditable = 'false';
      activeEl.classList.remove('cms-inline-active');
      activeEl = null;
      toolbar.style.display = 'none';
    }

    function cancelCurrentActive() {
      if (!activeEl) return;
      activeEl.innerText = originalText;
      activeEl.contentEditable = 'false';
      activeEl.classList.remove('cms-inline-active');
      activeEl = null;
      toolbar.style.display = 'none';
    }

    // Toolbar button clicks
    toolbar.querySelector('#cft-btn-save').addEventListener('click', (e) => {
      e.stopPropagation();
      saveCurrentActive();
    });

    toolbar.querySelector('#cft-btn-cancel').addEventListener('click', (e) => {
      e.stopPropagation();
      cancelCurrentActive();
    });

    toolbar.querySelector('#cft-btn-link').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeEl) return;
      const anchor = activeEl.tagName === 'A' ? activeEl : activeEl.closest('a');
      if (!anchor) return;
      const input = toolbar.querySelector('#cft-link-input');
      input.style.display = input.style.display === 'none' ? 'inline-block' : 'none';
      input.value = anchor.getAttribute('href') || '';
      input.focus();
    });

    toolbar.querySelector('#cft-link-input').addEventListener('change', (e) => {
      if (!activeEl) return;
      const anchor = activeEl.tagName === 'A' ? activeEl : activeEl.closest('a');
      if (anchor) {
        anchor.setAttribute('href', e.target.value.trim());
        saveCurrentActive();
      }
    });

    // Delegated Hover
    document.addEventListener('mouseover', (e) => {
      if (!editMode || activeEl) return;
      const target = e.target.closest('h1, h2, h3, h4, h5, h6, p, a, button, span, label, strong, em, b, i, li, [data-i18n], [data-cms], .counter-value');
      if (target && isEditableTarget(target)) {
        if (hoveredEl && hoveredEl !== target) hoveredEl.classList.remove('cms-target-hover');
        hoveredEl = target;
        target.classList.add('cms-target-hover');

        const rect = target.getBoundingClientRect();
        tooltip.style.display = 'block';
        let top = rect.top - 20;
        if (top < 5) top = rect.bottom + 4;
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${Math.max(5, rect.left)}px`;
      } else {
        if (hoveredEl) {
          hoveredEl.classList.remove('cms-target-hover');
          hoveredEl = null;
          tooltip.style.display = 'none';
        }
      }
    }, true);

    document.addEventListener('mouseout', (e) => {
      if (hoveredEl && e.relatedTarget && !hoveredEl.contains(e.relatedTarget)) {
        hoveredEl.classList.remove('cms-target-hover');
        hoveredEl = null;
        tooltip.style.display = 'none';
      }
    }, true);

    // Delegated Click to Edit
    document.addEventListener('click', (e) => {
      if (!editMode) return; // Allow natural browsing, link clicking, and button interaction!

      // If clicking inside toolbar, allow toolbar interaction
      if (e.target.closest('#cms-inline-toolbar') || e.target.closest('#cms-hover-tooltip')) return;

      const target = e.target.closest('h1, h2, h3, h4, h5, h6, p, a, button, span, label, strong, em, b, i, li, [data-i18n], [data-cms], .counter-value');

      if (target && isEditableTarget(target)) {
        e.preventDefault();
        e.stopPropagation();

        if (activeEl && activeEl !== target) {
          saveCurrentActive();
        }

        activeEl = target;
        originalText = target.innerText;
        target.classList.remove('cms-target-hover');
        target.classList.add('cms-inline-active');
        tooltip.style.display = 'none';

        target.contentEditable = 'true';
        target.focus();
        positionToolbar(target);

      } else {
        // Clicked outside any editable element while editing -> auto-save
        if (activeEl) {
          saveCurrentActive();
        }
      }
    }, true);

    // Keydown shortcuts (Enter to save, Esc to cancel)
    document.addEventListener('keydown', (e) => {
      if (!activeEl) return;
      if (e.key === 'Escape') {
        cancelCurrentActive();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Single line headings and buttons save on Enter
        const tag = activeEl.tagName;
        if (['H1','H2','H3','H4','H5','H6','BUTTON','A','SPAN'].includes(tag)) {
          e.preventDefault();
          saveCurrentActive();
        }
      }
    });

    // Add Section floating tools on major sections
    const sectionSelectors = [
      { sel: '#hero-section', name: 'hero', label: 'Hero Banner' },
      { sel: '#stats-section', name: 'stats', label: 'Statistics' },
      { sel: '#sec-about-overview', name: 'about', label: 'About Us' },
      { sel: '#focus-accordion-container', name: 'services', label: 'Services & Pillars' },
      { sel: '#success-stories-section', name: 'reviews', label: 'Reviews' },
      { sel: '#home-contact-section', name: 'contact-block', label: 'Contact Desk' },
      { sel: '#sec-benefits', name: 'benefits', label: 'Benefits' },
      { sel: '#sec-investment', name: 'investment', label: 'Investment' },
      { sel: '#sec-faq, #sec-faqs', name: 'faqs', label: 'FAQs' }
    ];

    sectionSelectors.forEach(item => {
      const sec = document.querySelector(item.sel);
      if (sec) {
        sec.style.position = 'relative';
        const badge = document.createElement('div');
        badge.className = 'cms-section-tool';
        badge.innerHTML = `<i class="fa-solid fa-plus" style="margin-right:4px"></i> + Add / Edit ${item.label}`;
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'CMS_OPEN_SECTION_BUILDER',
              section: item.name
            }, '*');
          }
        });
        sec.appendChild(badge);

        sec.addEventListener('mouseenter', () => { badge.style.display = 'inline-flex'; });
        sec.addEventListener('mouseleave', () => { badge.style.display = 'none'; });
      }
    });

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CMS_FRAME_READY', path: window.location.pathname }, '*');
    }

    // Intercept website's own language switcher events
    window.addEventListener('languageChanged', (e) => {
      if (_isSyncingLang) return;
      const lang = e.detail?.lang;
      if (lang && ['en', 'ar', 'fa', 'zh'].includes(lang)) {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'CMS_LANG_CHANGED', lang }, '*');
        }
      }
    });

    // Listen for live messages from parent dashboard
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'CMS_SET_LANG') {
        applyLanguage(msg.lang, 'parent');
      } else if (msg.type === 'CMS_SET_MODE') {
        setEditMode(msg.mode === 'edit', false, false);
      } else if (msg.type === 'CMS_UPDATE_BLOG_DRAFT') {
        updateLiveBlogDraft(msg.draft);
      } else if (msg.type === 'CMS_BLOG_SAVED') {
        const dc = document.getElementById('cms-live-draft-card');
        if (dc) dc.remove();
        hydrateBlog(getLang());
      } else if (msg.type === 'CMS_UPDATE_FIELD') {
        const { field, value } = msg;
        if (typeof value === 'undefined' || value === null) return;

        // ── Comprehensive Real-time Program Fields ───────────
        if (field === 'title' || field === 'hero_title') {
          const els = document.querySelectorAll('h1 .dominica-hero-glow, h1 span:first-child, [data-i18n*="heroTitle"], [data-cms="hero-title"]');
          els.forEach(el => { el.textContent = String(value).replace(/\s+(citizenship|residency).*$/i, '').trim(); });
          document.title = value + ' | Sharif Group';
        } else if (field === 'hero_subtitle') {
          const els = document.querySelectorAll('h1 span.uppercase, [data-i18n*="heroSubtitle"], [data-cms="hero-subtitle"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'hero_tagline') {
          const els = document.querySelectorAll('h1 + p, [data-i18n*="heroTagline"], [data-i18n*="heroDesc"], [data-cms="hero-tagline"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'badge1' || field === 'badge2' || field === 'badge3' || field === 'badge4' || field === 'badge5') {
          const bIdx = field.replace('badge', '');
          setText(`[data-i18n*="heroBadge${bIdx}"]`, value);
        } else if (field === 'processing_time' || field === 'spec_processing') {
          setText('[data-i18n*="specProcessingDesc"]', value);
        } else if (field === 'visa_free' || field === 'spec_visa') {
          setText('[data-i18n*="specVisaFreeDesc"]', value);
        } else if (field === 'spec_investment_type') {
          setText('[data-i18n*="specInvestmentTypeDesc"]', value);
        } else if (field === 'investment_from' || field === 'spec_investment_cost') {
          setText('[data-i18n*="specInvestmentCostDesc"]', value);
        } else if (field === 'spec_family') {
          setText('[data-i18n*="specFamilyDesc"]', value);
        } else if (field === 'spec_presence') {
          setText('[data-i18n*="specPresenceDesc"]', value);
        } else if (field === 'overview_badge') {
          setText('#sec-overview span.uppercase, [data-i18n*="overviewBadge"]', value);
        } else if (field === 'overview_title') {
          setText('#sec-overview h3, [data-i18n*="overviewTitle"]', value);
        } else if (field === 'overview' || field === 'overview_p1') {
          setText('#sec-overview p, [data-i18n*="overviewDesc"]', value);
        } else if (field === 'benefits_badge') {
          setText('#sec-benefits span.uppercase, [data-i18n*="benefitsBadge"]', value);
        } else if (field === 'benefits_title') {
          setText('#sec-benefits h2, [data-i18n*="benefitsTitle"]', value);
        } else if (field === 'benefits_desc') {
          setText('#sec-benefits p.max-w-2xl, [data-i18n*="benefitsDesc"]', value);
        } else if (field === 'investment_badge') {
          setText('#sec-investment span.uppercase, [data-i18n*="investmentBadge"], #sec-pricing-grid span.uppercase, [data-i18n*="pricingBadge"]', value);
        } else if (field === 'investment_title') {
          setText('#sec-investment h2, [data-i18n*="investmentTitle"], #sec-pricing-grid h3, [data-i18n*="pricingTitle"]', value);
        } else if (field === 'investment_desc') {
          setText('#sec-investment p.max-w-2xl, [data-i18n*="investmentDesc"], #sec-pricing-grid p.max-w-2xl, [data-i18n*="pricingDesc"]', value);
        } else if (field === 'r1_title') {
          setText('[data-i18n*="edfTitle"], [data-i18n*="pricingOptionATitle"]', value);
        } else if (field === 'r1_amt') {
          setText('[data-i18n*="pricingSingleApplicant"] ~ p, [data-i18n*="edfDesc"] strong', value);
        } else if (field === 'r1_desc') {
          setText('[data-i18n*="edfDesc"]', value);
        } else if (field === 'r1_fam') {
          setText('[data-i18n*="pricingFamilyOf4"] ~ p', value);
        } else if (field === 'r1_add') {
          setText('[data-i18n*="pricingAdditionalUnder18"] ~ p', value);
        } else if (field === 'r2_title') {
          setText('[data-i18n*="realEstateTitle"], [data-i18n*="pricingOptionBTitle"]', value);
        } else if (field === 'r2_amt') {
          setText('[data-i18n*="pricingMinAssetValue"] ~ p, [data-i18n*="realEstateDesc"] strong', value);
        } else if (field === 'r2_desc') {
          setText('[data-i18n*="realEstateDesc"]', value);
        } else if (field === 'r2_hold') {
          setText('[data-i18n*="pricingHoldingYears"]', value);
        } else if (field === 'r2_fee') {
          setText('[data-i18n*="pricingGovFeeSingle"] ~ p', value);
        } else if (field === 'fee_dd_main') {
          setText('[data-i18n*="pricingFeeDueDiligenceMain"] ~ span', value);
        } else if (field === 'fee_dd_dep') {
          setText('[data-i18n*="pricingFeeDueDiligenceDep"] ~ span', value);
        } else if (field === 'fee_interview') {
          setText('[data-i18n*="pricingFeeInterview"] ~ span', value);
        } else if (field === 'fee_cert') {
          setText('[data-i18n*="pricingFeeNaturalisation"] ~ span', value);
        } else if (field === 'who_can_apply_badge') {
          setText('#sec-who-can-apply span.uppercase, [data-i18n*="whoCanApplyBadge"]', value);
        } else if (field === 'who_can_apply_title') {
          setText('#sec-who-can-apply h3, [data-i18n*="whoCanApplyTitle"]', value);
        } else if (field === 'who_can_apply_desc') {
          setText('#sec-who-can-apply p.max-w-2xl, [data-i18n*="whoCanApplyDesc"]', value);
        } else if (field === 'docs_badge') {
          setText('#sec-required-documents span.uppercase, [data-i18n*="docsBadge"]', value);
        } else if (field === 'docs_title') {
          setText('#sec-required-documents h2, [data-i18n*="docsTitle"]', value);
        } else if (field === 'docs_desc') {
          setText('#sec-required-documents p.max-w-2xl, [data-i18n*="docsDesc"]', value);
        } else if (field === 'timeline_badge') {
          setText('#sec-timeline span.uppercase, [data-i18n*="timelineBadge"]', value);
        } else if (field === 'timeline_title') {
          setText('#sec-timeline h3, [data-i18n*="timelineTitle"]', value);
        } else if (field === 'timeline_desc') {
          setText('#sec-timeline p.max-w-xl, [data-i18n*="timelineDesc"]', value);
        } else if (field === 'faq_title') {
          setText('#program-faq-section h3, [data-i18n*="faqTitle"]', value);
        } else if (field === 'faq_desc') {
          setText('#program-faq-section p, [data-i18n*="faqDesc"]', value);
        } else if (field === 'consult_heading') {
          setText('#program-consult-form-section h3, [data-i18n*="formTitle"]', value);
        } else if (field === 'consult_subheading') {
          setText('#program-consult-form-section p, [data-i18n*="formDesc"]', value);
        }
        // ── Real-time Blog Fields ───────────────────────────
        else if (field === 'blog_title') {
          const els = document.querySelectorAll('#detail-title, .blog-hero-title, [data-cms="blog-title"], #cms-live-draft-card h4');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'blog_excerpt') {
          const els = document.querySelectorAll('#detail-excerpt, .blog-hero-desc, [data-cms="blog-excerpt"], #cms-live-draft-card p');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'blog_category') {
          const els = document.querySelectorAll('#detail-category, .blog-category-badge, [data-cms="blog-cat"], #cms-live-draft-card .blog-card-cat');
          els.forEach(el => { el.textContent = value; });
          const card = document.getElementById('cms-live-draft-card');
          if (card) card.setAttribute('data-cat', mapCategoryToDataCat(value));
        } else if (field === 'blog_img') {
          const els = document.querySelectorAll('#detail-image, [data-cms="blog-img"], #cms-live-draft-card img');
          els.forEach(el => { el.src = value; });
        } else if (field === 'blog_author') {
          const els = document.querySelectorAll('#detail-author, [data-cms="blog-author"], #cms-live-draft-card .blog-card-author');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'blog_date') {
          const els = document.querySelectorAll('#detail-date, [data-cms="blog-date"], #cms-live-draft-card .blog-card-date');
          els.forEach(el => { el.textContent = value; });
        }
        // ── Team Real-time Fields ───────────────────────────
        else if (field === 'team_name') {
          const els = document.querySelectorAll('.team-card:first-child h3, .team-card:first-child h4, [data-cms="team-name"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'team_title') {
          const els = document.querySelectorAll('.team-card:first-child p, [data-cms="team-title"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'team_photo') {
          const els = document.querySelectorAll('.team-card:first-child img, [data-cms="team-photo"]');
          els.forEach(el => { el.src = value; });
        }
        // ── Office Real-time Fields ─────────────────────────
        else if (field === 'office_name') {
          const els = document.querySelectorAll('.office-card:first-child h3, [data-cms="office-name"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'office_address') {
          const els = document.querySelectorAll('.office-card:first-child p, [data-cms="office-address"]');
          els.forEach(el => { el.textContent = value; });
        }
        // ── Homepage fields ─────────────────────────────────
        if (field === 'headline') {
          const els = document.querySelectorAll('[data-cms="hero-headline"], [data-i18n="hero.title"], .dominica-hero-glow');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'tagline') {
          const els = document.querySelectorAll('[data-cms="hero-tagline"], [data-i18n="hero.tagline"]');
          els.forEach(el => { el.textContent = value; });
        } else if (field === 'about_badge') {
          setText('[data-i18n="about.badge"]', value);
        } else if (field === 'about_heading') {
          setText('[data-i18n="about.heading"]', value);
        } else if (field === 'about_subheading') {
          setText('[data-i18n="about.subheading"]', value);
        } else if (field === 'about_p1') {
          setText('[data-i18n="about.p1"]', value);
        } else if (field === 'about_p2') {
          setText('[data-i18n="about.p2"]', value);
        } else if (field === 'about_btn1') {
          setText('[data-i18n="about.readStory"]', value);
        } else if (field === 'about_btn2') {
          setText('[data-i18n="about.bookConsultation"]', value);
        } else if (field === 'services_badge') {
          setText('[data-i18n="services.badge"]', value);
        } else if (field === 'services_heading') {
          setText('[data-i18n="services.heading"]', value);
        } else if (field === 'services_desc') {
          setText('[data-i18n="services.description"]', value);
        } else if (field === 'reviews_heading') {
          setText('[data-i18n="reviews.heading"]', value);
        } else if (field === 'contact_heading') {
          setText('[data-i18n="contact.heading"]', value);
        } else if (field === 'contact_phone') {
          const p = document.querySelector('[data-i18n="contact.phoneNumber"] ~ p a');
          if (p) p.textContent = value;
        } else if (field === 'contact_email') {
          const em = document.querySelector('[data-i18n="contact.emailAddress"] ~ p a');
          if (em) em.textContent = value;
        } else if (field === 'contact_address') {
          setText('[data-i18n="contact.officeAddress"]', value);
        }
        // Program fields
        else if (field === 'title') {
          const h1 = document.querySelector('h1 .dominica-hero-glow') || document.querySelector('h1');
          if (h1) h1.textContent = value.replace(/\s+citizenship.*$/i, '').trim();
          document.title = value + ' | Sharif Group';
        } else if (field === 'overview') {
          setText('[data-i18n*="overviewDesc"]', value);
        } else if (field === 'investment_from') {
          setText('[data-i18n*="specInvestmentCostDesc"]', value);
        } else if (field === 'processing_time') {
          setText('[data-i18n*="specProcessingDesc"]', value);
        } else if (field === 'visa_free') {
          setText('[data-i18n*="specVisaFreeDesc"]', value);
        }
        // ── About Us Dedicated Page Live Fields ─────────────
        else if (field.startsWith('about_')) {
          if (field === 'about_hero_badge') setText('[data-i18n="pages.aboutUs.heroBadge"]', value);
          else if (field === 'about_hero_title') setText('[data-i18n="pages.aboutUs.heroTitle"]', value);
          else if (field === 'about_hero_sub') setText('.about-hero-subtitle, [data-i18n="pages.aboutUs.heroSubtitle"]', value);
          else if (field === 'about_hero_img') {
            const hs = document.querySelector('.contact-hero-slide');
            if (hs) hs.style.backgroundImage = `linear-gradient(rgba(11,15,20,0.7), rgba(11,15,20,0.8)), url('${value}')`;
          }
          else if (field === 'about_ov_badge') setText('[data-i18n="pages.aboutUs.about_overview_item1"]', value);
          else if (field === 'about_ov_heading') {
            const el = document.querySelector('[data-i18n-html="pages.aboutUs.about_overview_item2"], [data-i18n="pages.aboutUs.about_overview_item2"]');
            if (el) el.innerHTML = value.includes('<') ? value : `${value}:<br/><span class="italic text-[#C5A880] font-serif font-normal">Sharif Group</span>`;
          }
          else if (field === 'about_ov_p1') setText('[data-i18n="pages.aboutUs.about_overview_item3"]', value);
          else if (field === 'about_ov_p2') setText('[data-i18n="pages.aboutUs.about_overview_item4"]', value);
          else if (field === 'about_ov_cta_text') setText('[data-i18n="pages.aboutUs.about_overview_item5"]', value);
          else if (field === 'about_arch_badge') setText('[data-i18n="pages.aboutUs.corporate_architecture_item1"]', value);
          else if (field === 'about_arch_title') {
            const el = document.querySelector('[data-i18n-html="pages.aboutUs.corporate_architecture_item2"], [data-i18n="pages.aboutUs.corporate_architecture_item2"]');
            if (el) el.innerHTML = value.includes('<') ? value : `Three Companies. <span class="italic text-[#C5A880] font-serif font-normal">One Commitment.</span>`;
          }
          else if (field === 'about_arch_desc') setText('[data-i18n="pages.aboutUs.corporate_architecture_item3"]', value);
          else if (field === 'about_c1_badge') setText('[data-i18n="pages.aboutUs.corporate_architecture_item4"]', value);
          else if (field === 'about_c1_p1') setText('[data-i18n="pages.aboutUs.corporate_architecture_item7"]', value);
          else if (field === 'about_c1_p2') setText('[data-i18n="pages.aboutUs.corporate_architecture_item8"]', value);
          else if (field === 'about_c2_badge') setText('[data-i18n="pages.aboutUs.corporate_architecture_item11"]', value);
          else if (field === 'about_c2_p1') setText('[data-i18n="pages.aboutUs.corporate_architecture_item14"]', value);
          else if (field === 'about_c2_p2') setText('[data-i18n="pages.aboutUs.corporate_architecture_item15"]', value);
          else if (field === 'about_c3_badge') setText('[data-i18n="pages.aboutUs.corporate_architecture_item18"]', value);
          else if (field === 'about_c3_p1') setText('[data-i18n="pages.aboutUs.corporate_architecture_item21"]', value);
          else if (field === 'about_c3_p2') setText('[data-i18n="pages.aboutUs.corporate_architecture_item22"]', value);
          else if (field === 'about_founder_name') setText('[data-i18n="pages.aboutUs.founder_message_item1"], [data-i18n="pages.aboutUs.founder_message_item7"]', value, { all: true });
          else if (field === 'about_founder_title') setText('[data-i18n="pages.aboutUs.founder_message_item2"], [data-i18n="pages.aboutUs.founder_message_item8"]', value, { all: true });
          else if (field === 'about_founder_badge') setText('[data-i18n="pages.aboutUs.founder_message_item3"]', value);
          else if (field === 'about_founder_quote') setText('[data-i18n-html="pages.aboutUs.founder_message_item4"], [data-i18n="pages.aboutUs.founder_message_item4"]', value);
          else if (field === 'about_founder_p1') setText('[data-i18n="pages.aboutUs.founder_message_item5"]', value);
          else if (field === 'about_founder_p2') setText('[data-i18n="pages.aboutUs.founder_message_item6"]', value);
          else if (field === 'about_cta_badge') setText('[data-i18n="pages.aboutUs.about_cta_item1"]', value);
          else if (field === 'about_cta_heading') setText('[data-i18n-html="pages.aboutUs.about_cta_item2"], [data-i18n="pages.aboutUs.about_cta_item2"]', value);
          else if (field === 'about_cta_desc') setText('[data-i18n="pages.aboutUs.about_cta_item3"]', value);
          else if (field === 'about_cta_btn') setText('[data-i18n="pages.aboutUs.about_cta_item4"]', value);
        }
      } else if (msg.type === 'CMS_SCROLL_TO') {
        const target = document.querySelector(`[data-cms-section="${msg.section}"]`) || document.getElementById(msg.section + '-section') || document.getElementById('sec-' + msg.section);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ── Execution Entrypoint ────────────────────────────────
  function init() {
    showPreviewBadge();
    runHydration();
    setupVisualEditor();
    console.log('%c[Sharif Group CMS Studio] Active mode:', 'color:#C5A880;font-weight:700', isEditor ? 'Visual Editor (Live Studio)' : 'Preview Mode');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
