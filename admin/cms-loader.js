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

  // ── Storage Helpers ─────────────────────────────────────
  function store(key) {
    try {
      if (!isEditor) {
        const live = localStorage.getItem(key + '_live');
        if (live !== null) return JSON.parse(live);
        const manifestStr = localStorage.getItem('sgcms_published_manifest');
        if (manifestStr) {
          const manifest = JSON.parse(manifestStr);
          if (manifest && manifest.data && manifest.data[key] !== undefined) {
            return manifest.data[key];
          }
        }
      }
      return JSON.parse(localStorage.getItem(key));
    } catch { return null; }
  }

  function saveStore(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  }

  function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '/assets/images/dubai-office-2.webp';
    url = url.trim();
    if (!url) return '/assets/images/dubai-office-2.webp';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return url;
    if (url.startsWith('../')) return url.replace(/^(\.\.\/)+/, '/');
    return '/' + url;
  }

  const params = new URLSearchParams(window.location.search);
  const isInsideIframe = (function () {
    try {
      return window.self !== window.top && (window.location.pathname.indexOf('/admin/') === -1);
    } catch (e) {
      return true;
    }
  })();
  const isEditor = params.get('cms_editor') === '1' || isInsideIframe;
  const isPreview = params.get('cms_preview') === '1' || isEditor;

  async function syncLiveFromBackend() {
    // Vercel is a static host that does not run PHP - skip immediately to avoid network hanging
    if (window.location.hostname.includes('vercel.app') || window.location.protocol === 'file:') {
      return;
    }
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/admin/api/content.php?mode=live', { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          for (const k in json.data) {
            localStorage.setItem(k + '_live', JSON.stringify(json.data[k]));
          }
          runHydration();
        }
      }
    } catch(e) {}
  }

  let _isSyncingLang = false;

  function getLang() {
    const raw = (document.documentElement.lang || localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang') || 'en').split('-')[0].toLowerCase().trim();
    if (['en', 'ar', 'fa', 'zh'].includes(raw)) return raw;
    return 'en';
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
    const urlParams = new URLSearchParams(window.location.search);
    const progParam = urlParams.get('program_id') || urlParams.get('id') || urlParams.get('program');
    if (progParam) {
      try { return decodeURIComponent(progParam).toLowerCase(); } catch(e) { return progParam.toLowerCase(); }
    }

    let clean = window.location.pathname.replace(/\/index\.html?$/i, '').replace(/\/$/, '');
    try { clean = decodeURIComponent(clean); } catch(e) {}
    const segments = clean.split('/').filter(Boolean);
    const last = (segments[segments.length - 1] || '').toLowerCase();
    return last || 'homepage';
  }

  function formatProgramPageTitle(pageName, type, sectionTabName, fallbackCountry) {
    let cleanPage = String(pageName || '').trim();
    cleanPage = cleanPage.replace(/\s*\|\s*.*$/i, '').trim();
    cleanPage = cleanPage
      .replace(/^(citizenship(\s+by\s+investment)?|residency(\s+by\s+investment)?|golden\s+visa(\s*&\s*residency)?)\s*/i, '')
      .replace(/\s+(citizenship(\s+by\s+investment)?|residency(\s+by\s+investment)?|golden\s+visa(\s*&\s*residency)?).*$/i, '')
      .trim();

    if (!cleanPage && fallbackCountry) {
      cleanPage = String(fallbackCountry).trim().replace(/\s*\|\s*.*$/i, '').replace(/^(citizenship|residency).*/i, '').trim();
    }

    const isResidency = type === 'residency' || (typeof type === 'string' && type.includes('residency'));
    let tab = String(sectionTabName || '').trim();
    if (!tab || /^(citizenship|residency)$/i.test(tab)) {
      tab = isResidency ? 'Residency by investment' : 'Citizenship by investment';
    } else {
      if (/^citizenship\s+by\s+investment$/i.test(tab)) {
        tab = 'Citizenship by investment';
      } else if (/^residency\s+by\s+investment$/i.test(tab)) {
        tab = 'Residency by investment';
      }
    }

    if (!cleanPage) return tab;
    cleanPage = cleanPage.charAt(0).toUpperCase() + cleanPage.slice(1);
    return `${cleanPage} ${tab}`;
  }

  function formatOverviewTitleHtml(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';

    // If it already contains formatted luxury gold or italic markup, keep it
    if (str.includes('<span') && (str.includes('text-luxury-gold') || str.includes('italic') || str.includes('text-[#C5A880]'))) {
      return str;
    }

    // Strip raw HTML tags to parse text cleanly
    const clean = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Chinese fullwidth colon
    if (clean.includes('：')) {
      const idx = clean.indexOf('：');
      const prefix = clean.slice(0, idx + 1);
      const suffix = clean.slice(idx + 1).trim();
      return `${prefix} <br/><span class="italic font-normal text-luxury-gold">${suffix || "谢里夫集团专业指南"}</span>`;
    }

    // Standard colon (English, Arabic, Persian)
    if (clean.includes(':')) {
      const idx = clean.indexOf(':');
      const prefix = clean.slice(0, idx + 1);
      const suffix = clean.slice(idx + 1).trim();
      return `${prefix} <br/><span class="italic font-normal text-luxury-gold">${suffix || "Sharif Group's Guide"}</span>`;
    }

    // Common overview heading prefixes without colon
    const match = clean.match(/^(program\s+overview|golden\s+visa\s*&\s*residency|residency\s+overview|executive\s+briefing)\s*(.*)$/i);
    if (match) {
      const prefix = match[1].trim() + ':';
      const suffix = match[2].trim();
      return `${prefix} <br/><span class="italic font-normal text-luxury-gold">${suffix || "Sharif Group's Guide"}</span>`;
    }

    return `<span class="italic font-normal text-luxury-gold">${clean}</span>`;
  }

  function extractCountryName() {
    const slug = extractSlug();
    const clean = slug.replace(/[^a-zA-Z]/g, ' ').trim();
    if (clean) return clean.charAt(0).toUpperCase() + clean.slice(1);
    return 'Dominica';
  }

  function formatInvestmentTitleHtml(raw, fallbackCountry) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';
    if (str.includes('<span') && (str.includes('text-[#786142]') || str.includes('text-luxury-gold') || str.includes('italic'))) {
      if (!str.includes('font-normal')) {
        str = str.replace(/class="([^"]*)"/, 'class="$1 font-normal"');
      }
      return str;
    }
    const clean = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const cName = fallbackCountry || extractCountryName();
    if (/costs\s+for/i.test(clean)) {
      const idx = clean.search(/costs\s+for/i);
      const prefix = clean.slice(0, idx).trim();
      const suffix = clean.slice(idx).trim();
      return `${prefix} <span class="italic text-[#786142] font-serif font-normal">${suffix}</span>`;
    }
    if (clean.includes('&')) {
      const idx = clean.indexOf('&');
      const prefix = clean.slice(0, idx + 1);
      const suffix = clean.slice(idx + 1).trim();
      return `${prefix} <span class="italic text-[#786142] font-serif font-normal">${suffix}</span>`;
    }
    return `Explore Investment Options & <span class="italic text-[#786142] font-serif font-normal">Costs for ${cName}</span>`;
  }

  function formatWhoCanApplyTitleHtml(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';
    if (str.includes('<span') && (str.includes('text-[#786142]') || str.includes('italic'))) {
      if (!str.includes('font-normal')) {
        str = str.replace(/class="([^"]*)"/, 'class="$1 font-normal"');
      }
      return str;
    }
    const clean = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/who\s+can\s+apply/i.test(clean)) {
      const hasQ = clean.includes('?');
      return `Who Can <span class="italic text-[#786142] font-serif font-normal">Apply${hasQ ? '?' : ''}</span>`;
    }
    return clean;
  }

  function formatBenefitsTitleHtml(raw, fallbackCountry) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';
    if (str.includes('<span') && str.includes('italic')) {
      if (!str.includes('font-normal')) {
        str = str.replace(/class="([^"]*)"/, 'class="$1 font-normal"');
      }
      return str;
    }
    const clean = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const cName = fallbackCountry || extractCountryName();
    if (/benefits\s+of/i.test(clean)) {
      const idx = clean.search(/benefits\s+of/i);
      const prefix = clean.slice(0, idx + 11).trim();
      const suffix = clean.slice(idx + 11).trim();
      return `${prefix} <span class="italic text-[#786142] font-serif font-normal">${suffix || (cName + ' Citizenship')}</span>`;
    }
    return clean;
  }

  function formatFormTitleHtml(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    if (!str) return '';
    if (str.includes('<span') && (str.includes('italic') || str.includes('text-[#786142]') || str.includes('text-luxury-gold'))) {
      if (!str.includes('font-normal')) {
        str = str.replace(/class="([^"]*)"/, 'class="$1 font-normal"');
      }
      return str;
    }
    const clean = str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/consultation/i.test(clean)) {
      const parts = clean.split(/consultation/i);
      const prefix = parts[0].trim() || 'Apply for a Personalized';
      return `${prefix} <span class="italic text-[#786142] font-serif font-normal">Consultation — It's Free!</span>`;
    }
    return clean;
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

  // ── Standalone Preview Badge (Permanently Disabled) ────
  function showPreviewBadge() {
    const existing = document.getElementById('cms-preview-badge');
    if (existing) existing.remove();
    return;
  }

  // ── Universal DOM Overrides & Header Sanitization ───────
  function purgeCorruptedOverridesAndSanitizeHeader() {
    try {
      // 1. Clean localStorage sgcms_dom_overrides and sgcms_dom_overrides_live
      ['sgcms_dom_overrides', 'sgcms_dom_overrides_live'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        let obj = JSON.parse(raw);
        let modified = false;
        for (const pKey in obj) {
          if (!obj[pKey] || typeof obj[pKey] !== 'object') continue;
          for (const langKey in obj[pKey]) {
            const group = obj[pKey][langKey];
            if (!group || typeof group !== 'object') continue;
            for (const sel in group) {
              const val = group[sel];
              const strVal = typeof val === 'string' ? val : (val?.text || '');
              if (
                strVal.includes('naikhsn') ||
                strVal.includes('Costs\nfor') ||
                sel.includes('header') ||
                sel.includes('nav') ||
                sel.includes('logo') ||
                sel.includes('text-neutral-300') ||
                sel === 'span' ||
                sel.startsWith('div.flex') ||
                sel.startsWith('header')
              ) {
                delete group[sel];
                modified = true;
              } else if (
                (
                  sel.includes('overviewTitle') || (sel.includes('sec-overview') && sel.includes('h3')) ||
                  sel.includes('investmentTitle') || (sel.includes('sec-investment') && sel.includes('h2')) ||
                  sel.includes('whoCanApplyTitle') || (sel.includes('sec-who-can-apply') && sel.includes('h3')) ||
                  sel.includes('benefitsTitle') || (sel.includes('sec-benefits') && sel.includes('h2')) ||
                  sel.includes('formTitle') || (sel.includes('program-consult-form-section') && sel.includes('h3'))
                ) &&
                !strVal.includes('<span')
              ) {
                delete group[sel];
                modified = true;
              }
            }
          }
        }
        if (modified) {
          localStorage.setItem(key, JSON.stringify(obj));
        }
      });

      // 2. Clean sgcms_published_manifest if it contains corrupted DOM overrides
      const manifestStr = localStorage.getItem('sgcms_published_manifest');
      if (manifestStr) {
        let manifest = JSON.parse(manifestStr);
        if (manifest && manifest.data && manifest.data.sgcms_dom_overrides) {
          let ov = manifest.data.sgcms_dom_overrides;
          let modified = false;
          for (const pKey in ov) {
            if (!ov[pKey] || typeof ov[pKey] !== 'object') continue;
            for (const langKey in ov[pKey]) {
              const group = ov[pKey][langKey];
              if (!group || typeof group !== 'object') continue;
              for (const sel in group) {
                const strVal = typeof group[sel] === 'string' ? group[sel] : (group[sel]?.text || '');
                if (
                  strVal.includes('naikhsn') ||
                  strVal.includes('Costs\nfor') ||
                  sel.includes('header') ||
                  sel.includes('nav') ||
                  sel.includes('logo') ||
                  sel.includes('text-neutral-300') ||
                  sel === 'span' ||
                  sel.startsWith('div.flex') ||
                  sel.startsWith('header')
                ) {
                  delete group[sel];
                  modified = true;
                } else if (
                  (
                    sel.includes('overviewTitle') || (sel.includes('sec-overview') && sel.includes('h3')) ||
                    sel.includes('investmentTitle') || (sel.includes('sec-investment') && sel.includes('h2')) ||
                    sel.includes('whoCanApplyTitle') || (sel.includes('sec-who-can-apply') && sel.includes('h3')) ||
                    sel.includes('benefitsTitle') || (sel.includes('sec-benefits') && sel.includes('h2')) ||
                    sel.includes('formTitle') || (sel.includes('program-consult-form-section') && sel.includes('h3'))
                  ) &&
                  !strVal.includes('<span')
                ) {
                  delete group[sel];
                  modified = true;
                }
              }
            }
          }
          if (modified) {
            localStorage.setItem('sgcms_published_manifest', JSON.stringify(manifest));
          }
        }
      }
    } catch(e) {}

    // 3. Immediately restore DOM header divider pipes and purge rogue text
    try {
      document.querySelectorAll('#main-header .text-neutral-300, header .text-neutral-300').forEach(span => {
        if (span.textContent !== '|') span.textContent = '|';
      });

      // Search for any element currently containing 'naikhsn' and purge/clean it
      document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && (el.textContent || '').includes('naikhsn')) {
          if (el.closest('header, nav, #main-header, #nav-logo')) {
            el.textContent = '|';
          } else {
            el.textContent = el.textContent.replace(/naikhsn/gi, 'Dominica');
          }
        }
      });

      // 4. Automatically restore overview heading luxury gold/italic styling if it was flattened
      const ovHeading = document.querySelector('[data-i18n-html*="overviewTitle"], [data-i18n*="overviewTitle"], #sec-overview h3');
      if (ovHeading && (!ovHeading.querySelector('.text-luxury-gold') || !ovHeading.querySelector('.italic'))) {
        ovHeading.innerHTML = formatOverviewTitleHtml(ovHeading.textContent);
      }

      // 5. Automatically restore investment title styling (Costs for Dominica) and ensure font-normal
      const invHeading = document.querySelector('[data-i18n-html*="investmentTitle"], #sec-investment h2');
      if (invHeading) {
        if (!invHeading.querySelector('.italic') || !invHeading.querySelector('span')) {
          invHeading.innerHTML = formatInvestmentTitleHtml(invHeading.textContent);
        } else {
          const sp = invHeading.querySelector('span');
          if (sp && !sp.classList.contains('font-normal')) sp.classList.add('font-normal');
        }
      }

      // 6. Automatically restore who can apply title (Who Can Apply?) and ensure "Apply" is thin (font-normal)
      const whoHeading = document.querySelector('[data-i18n-html*="whoCanApplyTitle"], #sec-who-can-apply h3');
      if (whoHeading) {
        if (!whoHeading.querySelector('.italic') || !whoHeading.querySelector('span')) {
          whoHeading.innerHTML = formatWhoCanApplyTitleHtml(whoHeading.textContent);
        } else {
          const sp = whoHeading.querySelector('span');
          if (sp && !sp.classList.contains('font-normal')) sp.classList.add('font-normal');
        }
      }

      // 7. Automatically restore benefits title styling
      const benHeading = document.querySelector('[data-i18n-html*="benefitsTitle"], #sec-benefits h2');
      if (benHeading) {
        if (!benHeading.querySelector('.italic') || !benHeading.querySelector('span')) {
          benHeading.innerHTML = formatBenefitsTitleHtml(benHeading.textContent);
        } else {
          const sp = benHeading.querySelector('span');
          if (sp && !sp.classList.contains('font-normal')) sp.classList.add('font-normal');
        }
      }

      // 8. Automatically restore consultation form title styling
      const formHeading = document.querySelector('[data-i18n-html*="formTitle"], #program-consult-form-section h3');
      if (formHeading) {
        if (!formHeading.querySelector('.italic') || !formHeading.querySelector('span')) {
          formHeading.innerHTML = formatFormTitleHtml(formHeading.textContent);
        } else {
          const sp = formHeading.querySelector('span');
          if (sp && !sp.classList.contains('font-normal')) sp.classList.add('font-normal');
        }
      }
    } catch(e) {}
  }

  // Run header sanitization immediately on script execution
  purgeCorruptedOverridesAndSanitizeHeader();

  function applyDomOverrides(lang) {
    purgeCorruptedOverridesAndSanitizeHeader();
    const l = lang || getLang();
    const pageKey = extractSlug();

    const allOverrides = store('sgcms_dom_overrides') || {};
    const pageOverrides = (allOverrides[pageKey] && allOverrides[pageKey][l]) || {};

    for (const selector in pageOverrides) {
      try {
        if (
          selector.includes('header') ||
          selector.includes('nav') ||
          selector.includes('logo') ||
          selector.includes('text-neutral-300') ||
          selector === 'span' ||
          selector.startsWith('div.flex')
        ) {
          continue;
        }

        const item = pageOverrides[selector];
        const strVal = typeof item === 'string' ? item : (item?.text || '');
        if (strVal.includes('naikhsn') || strVal.includes('Costs\nfor')) continue;

        const el = document.querySelector(selector);
        if (el) {
          if (el.closest('header, nav, #main-header, #nav-logo, .mega-dropdown, #mobile-menu')) {
            continue;
          }
          const isOverviewHeading = selector.includes('overviewTitle') || (selector.includes('sec-overview') && selector.includes('h3'));
          const isInvestmentHeading = selector.includes('investmentTitle') || (selector.includes('sec-investment') && selector.includes('h2'));
          const isWhoCanApplyHeading = selector.includes('whoCanApplyTitle') || (selector.includes('sec-who-can-apply') && selector.includes('h3'));
          const isBenefitsHeading = selector.includes('benefitsTitle') || (selector.includes('sec-benefits') && selector.includes('h2'));
          const isFormHeading = selector.includes('formTitle') || (selector.includes('program-consult-form-section') && selector.includes('h3'));

          if (isOverviewHeading) {
            const rawVal = typeof item === 'string' ? item : (item?.text || '');
            el.innerHTML = formatOverviewTitleHtml(rawVal);
          } else if (isInvestmentHeading) {
            const rawVal = typeof item === 'string' ? item : (item?.text || '');
            el.innerHTML = formatInvestmentTitleHtml(rawVal);
          } else if (isWhoCanApplyHeading) {
            const rawVal = typeof item === 'string' ? item : (item?.text || '');
            el.innerHTML = formatWhoCanApplyTitleHtml(rawVal);
          } else if (isBenefitsHeading) {
            const rawVal = typeof item === 'string' ? item : (item?.text || '');
            el.innerHTML = formatBenefitsTitleHtml(rawVal);
          } else if (isFormHeading) {
            const rawVal = typeof item === 'string' ? item : (item?.text || '');
            el.innerHTML = formatFormTitleHtml(rawVal);
          } else if (typeof item === 'string') {
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
    if (!selector || typeof selector !== 'string') return;
    if (
      selector.includes('header') ||
      selector.includes('nav') ||
      selector.includes('logo') ||
      selector.includes('text-neutral-300') ||
      selector === 'span' ||
      selector.startsWith('div.flex')
    ) {
      return; // Never store DOM overrides targeting header or generic navigation elements
    }
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
      const h = document.querySelectorAll('[data-cms="hero-headline"], [data-i18n="hero.title"]');
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
    if (!list || !list.length) return;

    const slug = extractSlug();
    const l = lang || getLang();
    const prog = list.find(p => p.slug === slug || p.id === slug || (p.slug && slug.includes(p.slug)) || (p.id && slug.includes(p.id)));
    if (!prog) return;

    const ld = prog[l] || prog.en || {};

    // 1. Resolve canonical Country Name & Section Tab Name
    let rawCountry = (ld.hero_title || (ld.title ? ld.title.replace(/\s+(citizenship|residency).*$/i, '').trim() : '') || prog.name || prog.id || slug || '').trim();
    if (slug === 'uae' || prog.id === 'uae') {
      if (!ld.hero_title || ld.hero_title === 'UAE' || /10-year/i.test(ld.title || '')) {
        rawCountry = 'United Arab Emirates';
      }
    }
    if (/^(citizenship(\s+by\s+investment)?|residency(\s+by\s+investment)?)$/i.test(rawCountry)) {
      rawCountry = (prog.name || prog.id || slug || '').replace(/[^a-zA-Z\s]/g, ' ').trim();
    }
    const displayCountry = rawCountry ? (rawCountry.charAt(0).toUpperCase() + rawCountry.slice(1)) : 'Dominica';
    const isResidency = type === 'residency' || (typeof type === 'string' && type.includes('residency'));
    let defaultTab = isResidency ? 'Residency by investment' : 'Citizenship by investment';
    if (slug === 'uae' || prog.id === 'uae') {
      defaultTab = 'Golden Visa';
    }
    let sectionTab = (ld.hero_subtitle || defaultTab).trim();
    if (slug === 'uae' || prog.id === 'uae') {
      if (/^(residency(\s+by\s+investment)?|10-year.*)$/i.test(sectionTab) || sectionTab.toLowerCase().includes('residency')) {
        sectionTab = 'Golden Visa';
      }
    }

    // Canonical program title: {page name } {section tab name }
    const canonicalTitle = formatProgramPageTitle(displayCountry, type, sectionTab);

    // Self-heal corrupted or incomplete stored titles in localStorage
    if (l === 'en' || !ld.title || /^(citizenship(\s+by\s+investment)?|residency(\s+by\s+investment)?)$/i.test((ld.title || '').trim()) || (ld.title || '').trim().toLowerCase() === displayCountry.toLowerCase()) {
      ld.title = canonicalTitle;
      ld.hero_title = displayCountry;
      ld.hero_subtitle = sectionTab;
      if (prog.en) {
        prog.en.title = canonicalTitle;
        prog.en.hero_title = displayCountry;
        prog.en.hero_subtitle = sectionTab;
      }
      try {
        saveStore(type === 'citizenship' ? 'sgcms_citizenship' : 'sgcms_residency', list);
      } catch (e) {}
    }

    // Set Hero Country Glow Title & Subtitle in DOM with automatic self-healing
    const h1 = document.querySelector('h1');
    const h1Glow = document.querySelector('h1 [class*="-hero-glow"]') || 
                   document.querySelector('h1 .dominica-hero-glow') || 
                   document.querySelector('h1 .stlucia-hero-glow') || 
                   document.querySelector('h1 span:first-child');
    const sub = document.querySelector('h1 span.uppercase, [data-i18n*="heroSubtitle"], [data-cms="hero-subtitle"]');

    if (!h1Glow && h1) {
      // Self-heal: h1 was flattened to plain text or lacks glow span! Rebuild full structured hero
      h1.className = 'font-serif text-white font-normal tracking-tight drop-shadow-xl flex flex-col items-center gap-3';
      const glowClass = (slug === 'stlucia' || slug.includes('lucia')) ? 'stlucia-hero-glow dominica-hero-glow' : 'dominica-hero-glow';
      h1.innerHTML = `<span class="${glowClass} font-serif text-5xl sm:text-7xl md:text-8xl cursor-pointer" data-i18n="programs.${slug}.heroTitle">${displayCountry}</span><span class="text-xl sm:text-3xl md:text-4xl text-white font-serif tracking-widest uppercase font-semibold" data-i18n="programs.${slug}.heroSubtitle">${sectionTab}</span>`;
    } else {
      if (h1Glow && displayCountry) h1Glow.textContent = displayCountry;
      if (!sub && h1) {
        // Subtitle span was lost: append it back
        const newSub = document.createElement('span');
        newSub.className = 'text-xl sm:text-3xl md:text-4xl text-white font-serif tracking-widest uppercase font-semibold';
        newSub.setAttribute('data-i18n', `programs.${slug}.heroSubtitle`);
        newSub.textContent = sectionTab;
        h1.appendChild(newSub);
      } else if (sub && sectionTab) {
        sub.textContent = sectionTab;
      }
    }

    // Set document.title: {page name } {section tab name } | Sharif Group Dubai
    const finalTitle = (l === 'en' || !ld.title) ? canonicalTitle : ld.title;
    document.title = finalTitle + ' | Sharif Group Dubai';

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
    if (ld.overview_title) {
      const ovHeading = document.querySelector('[data-i18n-html*="overviewTitle"], [data-i18n*="overviewTitle"], #sec-overview h3');
      if (ovHeading) {
        ovHeading.innerHTML = formatOverviewTitleHtml(ld.overview_title);
      }
    }
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

    const cleanImg = normalizeImageUrl(img);

    card.innerHTML = `
      <div class="space-y-3">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-xl border-2 border-[#C5A880] relative group">
          <img alt="${escH(title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${cleanImg}" onerror="this.onerror=null;this.src='/assets/images/dubai-office-2.webp'">
          <div style="position:absolute;top:10px;left:10px;background:linear-gradient(135deg,#B38E5D,#8a6839);color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(0,0,0,.35);letter-spacing:.05em">
            <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;display:inline-block"></span>
            LIVE ARTICLE PREVIEW
          </div>
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
      let ld = b[l];
      if (!ld || (!ld.title && !ld.body)) {
        ld = b.en || b;
      }
      if (!ld || (!ld.title && !b.title && (!b.en || !b.en.title))) return;
      const slug = b.slug || (b.en && b.en.slug) || ld.slug || b.id;
      const status = b['status_' + l] || b.status_en || 'published';
      if (status !== 'published') return;

      const subcat = b.subcategory ? ' · ' + b.subcategory : '';
      const catDisplay = (b.category || 'Sharif Group Insights') + subcat;
      const dataCat = mapCategoryToDataCat(b.category, b.subcategory);

      // Prioritize localized FAQs for current language:
      const localizedFaqs = (ld.faqs && Array.isArray(ld.faqs) && ld.faqs.length) ? ld.faqs
        : ((b[l]?.faqs && Array.isArray(b[l].faqs) && b[l].faqs.length) ? b[l].faqs
        : ((b.en && Array.isArray(b.en.faqs) && b.en.faqs.length) ? b.en.faqs
        : (b.faqs || [])));

      // Register article data in the client-side database
      const articleData = {
        title: ld.title || (b.en && b.en.title) || b.title || 'Untitled Article',
        category: catDisplay,
        author: b.author || 'Sharif Group Advisory',
        date: b.publish_date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        updated: b.publish_date || '',
        image: b.featured_img || 'https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp',
        content: ld.body || (b.en && b.en.body) || `<p>${ld.excerpt || ''}</p>`,
        faqs: localizedFaqs
      };
      window.articlesDatabase[slug] = articleData;
      window.articlesDatabase[b.id] = articleData;

      // If this article is currently displayed on canvas in detail reader, re-render it in the new language!
      const detailView = document.getElementById('blog-detail-view-container');
      if (detailView && !detailView.classList.contains('hidden') && (window.currentActiveArticleSlug === slug || window.currentActiveArticleSlug === b.id)) {
        if (typeof window.openBlogDetailBySlug === 'function') {
          setTimeout(() => { window.openBlogDetailBySlug(slug, true); }, 20);
        }
      }

      let existingCard = document.querySelector(`[data-cms-blog-id="${b.id}"]`);
      if (!existingCard) {
        const articleEl = document.createElement('article');
        articleEl.className = 'space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog';
        articleEl.setAttribute('data-cms-blog-id', b.id);
        articleEl.setAttribute('data-cat', dataCat);
        articleEl.style.display = 'flex';
        articleEl.setAttribute('data-paginated', 'true');

        const cleanImg = normalizeImageUrl(b.featured_img);

        articleEl.innerHTML = `
          <div class="space-y-3">
            <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-md neon-card-hover border border-neutral-200/70">
              <img alt="${escH(ld.title || 'Article')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${cleanImg}" onerror="this.onerror=null;this.src='/assets/images/dubai-office-2.webp'">
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
        if (img && b.featured_img) img.src = normalizeImageUrl(b.featured_img);
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

  const escH = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function getPathPrefix() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/programs/')) return '../../../';
    if (path.includes('/citizenshipbyinvestment/') || path.includes('/residencybyinvestment/') || path.includes('/blog/') || path.includes('/aboutus/') || path.includes('/contact/') || path.includes('/realestate/') || path.includes('/educationaladvisory/') || path.includes('/privacypolicy/') || path.includes('/socialresponsibility/') || path.includes('/ali-sharif/')) {
      return '../';
    }
    return '';
  }

  function getCategorySections(type, programs) {
    const defaults = type === 'citizenship'
      ? [
        { key: 'caribbean', label: 'Caribbean Portfolios', i18nKey: 'megaMenu.caribbeanPortfolios', colorClass: 'text-luxury-gold' },
        { key: 'global', label: 'Global Portfolios', i18nKey: 'megaMenu.globalPortfolios', colorClass: 'text-neutral-400' }
      ]
      : [
        { key: 'european', label: 'European Portfolios', i18nKey: 'megaMenu.europeanPortfolios', colorClass: 'text-luxury-gold' },
        { key: 'uae', label: 'Americas & UAE', i18nKey: 'megaMenu.americasUAE', colorClass: 'text-neutral-400' }
      ];
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem('sgcms_sections_' + type)) || [];
    } catch (e) { }

    const fromProgs = [];
    (programs || []).forEach(p => {
      const port = (p.portfolio || '').toLowerCase();
      if (!port) return;
      if (type === 'residency' && (port === 'americas' || port === 'uae' || port === 'americas_uae')) return;
      if (type === 'citizenship' && (port === 'caribbean' || port === 'global')) return;
      if (!defaults.some(d => d.key === port) && !custom.some(c => c.key === port) && !fromProgs.some(f => f.key === port)) {
        const label = p.portfolio_label || (port.charAt(0).toUpperCase() + port.slice(1));
        fromProgs.push({ key: port, label, colorClass: 'text-neutral-400' });
      }
    });

    return [...defaults, ...custom, ...fromProgs];
  }

  const KNOWN_PROGRAM_PATHS = {
    dominica: 'programs/citizenshipbyinvestment/dominica/index.html',
    stkitts: 'programs/citizenshipbyinvestment/stkittis/index.html',
    antigua: 'programs/citizenshipbyinvestment/antiguaandbarbuda/index.html',
    stlucia: 'programs/citizenshipbyinvestment/stlucia/index.html',
    grenada: 'programs/citizenshipbyinvestment/greneda/index.html',
    vanuatu: 'programs/citizenshipbyinvestment/vanuatu/index.html',
    saotome: 'programs/citizenshipbyinvestment/sãotoméandpríncipe/index.html',
    nauru: 'programs/citizenshipbyinvestment/nauru/index.html',
    portugal: 'programs/residencybyinvestment/portugal/index.html',
    greece: 'programs/residencybyinvestment/greece/index.html',
    panama: 'programs/residencybyinvestment/panama/index.html',
    uae: 'programs/residencybyinvestment/uae/index.html'
  };

  const BUILTIN_PASSPORT_IMAGES = {
    dominica: 'assets/images/Dominica-Americas-Hu_10e82c.webp',
    stkitts: 'assets/images/st-kitts-passport.webp',
    antigua: 'assets/images/passport-investment-_6f41c1.webp',
    stlucia: 'assets/images/610fd15b02a12_38ea93.webp',
    lucia: 'assets/images/610fd15b02a12_38ea93.webp',
    grenada: 'assets/images/citizenship-passport_35b3b6.webp',
    vanuatu: 'assets/images/how-to-get-vanuatu-c_adddfe.webp',
    saotome: 'assets/images/Sao_Tome_passport_7c536c.webp',
    nauru: 'assets/images/reloc8-online-nauru-_16c98e.webp',
    portugal: 'assets/images/portugal-golden-vsa_47319a.webp',
    greece: 'assets/images/golden-visa-greece-t_12b60b.webp',
    panama: 'assets/images/images_5d28a7.webp',
    uae: 'assets/images/uae-residence-visa_df80b3.webp'
  };

  const BUILTIN_FLAG_CODES = {
    dominica: 'dm', stkitts: 'kn', antigua: 'ag', stlucia: 'lc', grenada: 'gd',
    vanuatu: 'vu', saotome: 'st', nauru: 'nr', portugal: 'pt', greece: 'gr',
    panama: 'pa', uae: 'ae'
  };

  function getProgramUrl(prog, type, prefix) {
    if (KNOWN_PROGRAM_PATHS[prog.id]) {
      return prefix + KNOWN_PROGRAM_PATHS[prog.id];
    }
    const base = type === 'residency'
      ? 'programs/residencybyinvestment/portugal/index.html'
      : 'programs/citizenshipbyinvestment/dominica/index.html';
    return prefix + base + '?program_id=' + encodeURIComponent(prog.id);
  }

  function getProgramFlag(prog, prefix) {
    const builtinImg = BUILTIN_PASSPORT_IMAGES[prog.id];
    // If it's a builtin program and the flag is empty, a flat flagcdn svg, or Flag_of svg, always use authentic passport cover image
    if (builtinImg && (!prog.flag || prog.flag.includes('flagcdn.com') || prog.flag.includes('Flag_of_') || prog.flag.endsWith('.svg'))) {
      return prefix + builtinImg;
    }
    if (prog.flag && prog.flag.trim()) {
      if (prog.flag.startsWith('/assets/')) return prefix + prog.flag.slice(1);
      if (prog.flag.startsWith('assets/')) return prefix + prog.flag;
      return prog.flag;
    }
    if (builtinImg) {
      return prefix + builtinImg;
    }
    const code = prog.flag_code || BUILTIN_FLAG_CODES[prog.id];
    if (code) {
      return `https://flagcdn.com/${code}.svg`;
    }
    return prefix + 'assets/images/citizenship-passport_35b3b6.webp';
  }

  function renderMegaMenu(menuEl, type, programs, sections, prefix, l) {
    if (!menuEl) return;
    const gridWrap = menuEl.querySelector('.max-w-7xl');
    if (!gridWrap) return;

    const isCitizenship = (type === 'citizenship');
    const allUrl = prefix + (isCitizenship ? 'citizenshipbyinvestment/index.html' : 'residencybyinvestment/index.html');
    const allLabel = isCitizenship ? 'All Citizenship Programs' : 'All Residency Programs';
    const titleLabel = isCitizenship ? 'Citizenship By Investment' : 'Residency By Investment';

    function programMatchesSection(p, secKey) {
      const port = (p.portfolio || '').toLowerCase();
      const skey = (secKey || '').toLowerCase();
      if (port === skey) return true;
      if (type === 'residency' && (skey === 'uae' || skey === 'americas') && (port === 'uae' || port === 'americas' || port === 'americas_uae')) {
        return true;
      }
      return false;
    }

    // Filter sections that have active published programs or are custom-added
    const activeSections = sections.filter(sec => {
      return programs.some(p => programMatchesSection(p, sec.key) && p.nav_visible !== false);
    });
    const secsToRender = activeSections.length ? activeSections : sections;
    const numCols = Math.max(1, Math.min(4, secsToRender.length));

    let columnsHtml = secsToRender.map((sec, idx) => {
      const secProgs = programs.filter(p => programMatchesSection(p, sec.key) && p.nav_visible !== false)
        .sort((a, b) => (a.nav_sort || 0) - (b.nav_sort || 0));

      let secLabel = sec.label;
      if (!secLabel) {
        secLabel = sec.key.charAt(0).toUpperCase() + sec.key.slice(1);
      }
      let headingText = secLabel;
      if (sec.key === 'uae' || /americas/i.test(headingText)) {
        headingText = 'Americas & UAE';
      } else if (!/portfolios$/i.test(headingText)) {
        headingText += ' Portfolios';
      }

      const colorClass = sec.colorClass || (idx === 0 ? 'text-luxury-gold' : 'text-neutral-400');
      const i18nAttr = sec.i18nKey ? ` data-i18n="${sec.i18nKey}"` : '';

      const itemsHtml = secProgs.map(p => {
        const pLabel = escH((p[l]?.nav_label || p.en?.nav_label || p.en?.title || p.name || p.id).trim());
        const pUrl = getProgramUrl(p, type, prefix);
        const flagImg = getProgramFlag(p, prefix);

        return `
          <li class="flex items-center group">
            <div class="flex items-center space-x-3">
              <img alt="${pLabel}" class="w-12 h-8 object-cover rounded-sm border border-neutral-200 shadow-sm flex-shrink-0" src="${flagImg}" onerror="this.style.display='none'" loading="lazy" decoding="async"/>
              <a class="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-700 group-hover:text-luxury-gold transition" href="${pUrl}">${pLabel}</a>
            </div>
          </li>
        `;
      }).join('');

      return `
        <div class="px-4">
          <h4 class="text-[11px] font-bold tracking-[0.18em] uppercase ${colorClass} mb-6 text-center lg:text-left"${i18nAttr}>${headingText}</h4>
          <ul class="space-y-4">
            ${itemsHtml || '<li class="text-xs text-neutral-400">No programs yet</li>'}
          </ul>
        </div>
      `;
    }).join('');

    const gridColsStyle = numCols === 2 ? 'grid-template-columns: 5fr 4fr;' : `grid-template-columns: repeat(${numCols}, minmax(0, 1fr));`;

    gridWrap.innerHTML = `
      <div class="col-span-3 flex flex-col items-center justify-center text-center pr-4 border-r border-neutral-200">
        <h3 class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="${isCitizenship ? 'megaMenu.citizenshipTitle' : 'megaMenu.residencyTitle'}">${titleLabel}</h3>
        <a class="px-4 py-1.5 border border-neutral-400 text-[11px] font-bold tracking-[0.18em] uppercase rounded-full hover:bg-luxury-dark hover:text-white transition whitespace-nowrap" data-i18n="${isCitizenship ? 'megaMenu.allCitizenshipPrograms' : 'megaMenu.allResidencyPrograms'}" href="${allUrl}" onclick="if(typeof closeAllMegaMenus==='function')closeAllMegaMenus()">${allLabel}</a>
      </div>
      <div class="col-span-9 grid gap-6" style="${gridColsStyle}">
        ${columnsHtml}
      </div>
    `;
  }

  function renderMobileSubmenu(mobUl, type, programs, prefix, l) {
    if (!mobUl) return;
    const isCitizenship = (type === 'citizenship');
    const allUrl = prefix + (isCitizenship ? 'citizenshipbyinvestment/index.html' : 'residencybyinvestment/index.html');
    const allLabel = isCitizenship ? 'All Citizenship Programs' : 'All Residency Programs';

    const visibleProgs = programs.filter(p => p.nav_visible !== false)
      .sort((a, b) => (a.nav_sort || 0) - (b.nav_sort || 0));

    const itemsHtml = visibleProgs.map(p => {
      const pLabel = escH((p[l]?.nav_label || p.en?.nav_label || p.en?.title || p.name || p.id).trim());
      const pUrl = getProgramUrl(p, type, prefix);
      return `<li><a class="block hover:text-luxury-gold" href="${pUrl}" onclick="if(typeof toggleMobileMenu==='function')toggleMobileMenu()">${pLabel}</a></li>`;
    }).join('');

    mobUl.innerHTML = `
      <li><a class="block font-bold hover:text-luxury-gold" href="${allUrl}" onclick="if(typeof toggleMobileMenu==='function')toggleMobileMenu()">${allLabel}</a></li>
      ${itemsHtml}
    `;
  }

  function hydrateNavigation(lang) {
    const l = lang || getLang();
    const prefix = getPathPrefix();

    let ci = store('sgcms_citizenship');
    let ri = store('sgcms_residency');

    const DEFAULT_CITIZENSHIP = [
      { id: 'dominica', slug: 'dominica', name: 'Dominica', portfolio: 'caribbean', flag: prefix + BUILTIN_PASSPORT_IMAGES.dominica, en: { nav_label: 'Dominica | Passport' } },
      { id: 'stkitts', slug: 'stkittis', name: 'St. Kitts & Nevis', portfolio: 'caribbean', flag: prefix + BUILTIN_PASSPORT_IMAGES.stkitts, en: { nav_label: 'St. Kitts & Nevis | Passport' } },
      { id: 'antigua', slug: 'antiguaandbarbuda', name: 'Antigua & Barbuda', portfolio: 'caribbean', flag: prefix + BUILTIN_PASSPORT_IMAGES.antigua, en: { nav_label: 'Antigua & Barbuda | Passport' } },
      { id: 'stlucia', slug: 'stlucia', name: 'Saint Lucia', portfolio: 'caribbean', flag: prefix + BUILTIN_PASSPORT_IMAGES.stlucia, en: { nav_label: 'Saint Lucia | Passport' } },
      { id: 'grenada', slug: 'greneda', name: 'Grenada', portfolio: 'caribbean', flag: prefix + BUILTIN_PASSPORT_IMAGES.grenada, en: { nav_label: 'Grenada | Passport' } },
      { id: 'vanuatu', slug: 'vanuatu', name: 'Vanuatu', portfolio: 'global', flag: prefix + BUILTIN_PASSPORT_IMAGES.vanuatu, en: { nav_label: 'Vanuatu | Passport' } },
      { id: 'saotome', slug: 'sãotoméandpríncipe', name: 'São Tomé and Príncipe', portfolio: 'global', flag: prefix + BUILTIN_PASSPORT_IMAGES.saotome, en: { nav_label: 'São Tomé and Príncipe | Passport' } },
      { id: 'nauru', slug: 'nauru', name: 'Republic of Nauru', portfolio: 'global', flag: prefix + BUILTIN_PASSPORT_IMAGES.nauru, en: { nav_label: 'Republic of Nauru | Passport' } }
    ];

    const DEFAULT_RESIDENCY = [
      { id: 'portugal', slug: 'portugal', name: 'Portugal', portfolio: 'european', flag: prefix + BUILTIN_PASSPORT_IMAGES.portugal, en: { nav_label: 'Portugal | Golden Visa' } },
      { id: 'greece', slug: 'greece', name: 'Greece', portfolio: 'european', flag: prefix + BUILTIN_PASSPORT_IMAGES.greece, en: { nav_label: 'Greece | Golden Visa' } },
      { id: 'panama', slug: 'panama', name: 'Panama', portfolio: 'uae', flag: prefix + BUILTIN_PASSPORT_IMAGES.panama, en: { nav_label: 'Panama | Golden Visa' } },
      { id: 'uae', slug: 'uae', name: 'United Arab Emirates', portfolio: 'uae', flag: prefix + BUILTIN_PASSPORT_IMAGES.uae, en: { nav_label: 'United Arab Emirates | Golden Visa' } }
    ];

    if (Array.isArray(ci)) {
      ci.forEach(p => {
        if (p && BUILTIN_PASSPORT_IMAGES[p.id] && (!p.flag || p.flag.includes('flagcdn.com') || p.flag.includes('Flag_of_') || p.flag.endsWith('.svg'))) {
          p.flag = prefix + BUILTIN_PASSPORT_IMAGES[p.id];
        }
      });
    }

    if (Array.isArray(ri)) {
      ri.forEach(p => {
        if (p && (p.id === 'panama' || p.slug === 'panama') && (!p.portfolio || p.portfolio === 'americas')) {
          p.portfolio = 'uae'; // Canonicalize Panama to Americas & UAE
        }
        if (p && (p.id === 'uae' || p.slug === 'uae')) {
          p.name = 'United Arab Emirates';
          if (p.en) {
            p.en.nav_label = 'United Arab Emirates | Golden Visa';
            p.en.hero_title = 'United Arab Emirates';
            p.en.hero_subtitle = 'Golden Visa';
            p.en.title = 'United Arab Emirates Golden Visa';
          }
        }
        if (p && BUILTIN_PASSPORT_IMAGES[p.id] && (!p.flag || p.flag.includes('flagcdn.com') || p.flag.includes('Flag_of_') || p.flag.endsWith('.svg'))) {
          p.flag = prefix + BUILTIN_PASSPORT_IMAGES[p.id];
        }
      });
    }

    const ciList = Array.isArray(ci) && ci.length ? ci : DEFAULT_CITIZENSHIP;
    const riList = Array.isArray(ri) && ri.length ? ri : DEFAULT_RESIDENCY;

    const ciSections = getCategorySections('citizenship', ciList);
    const riSections = getCategorySections('residency', riList);

    // 1. Render Desktop Mega-Menus
    renderMegaMenu(document.getElementById('citizenship-menu'), 'citizenship', ciList, ciSections, prefix, l);
    renderMegaMenu(document.getElementById('residency-menu'), 'residency', riList, riSections, prefix, l);

    // 2. Render Mobile Submenus
    renderMobileSubmenu(document.getElementById('mob-cbi'), 'citizenship', ciList, prefix, l);
    renderMobileSubmenu(document.getElementById('mob-rbi'), 'residency', riList, prefix, l);
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

  function hydrateContact(lang) {
    const data = store('sgcms_contact');
    if (!data) return;
    const l = lang || getLang();

    const genEmail = data.general_email || data.form_recipient;
    const salesEmail = data.sales_email || genEmail;
    const phone = data.phone;
    const wa = data.whatsapp;
    const addr = data.address;
    const hours = data.hours;

    if (phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.textContent = phone;
        a.href = 'tel:' + phone.replace(/\s+/g, '');
      });
      setText('[data-i18n="pages.contact.telVal"]', phone);
    }

    if (wa) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.href = 'https://wa.me/' + wa.replace(/\D/g, '');
      });
    }

    if (genEmail) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        if (!a.href.includes('sales')) {
          a.textContent = genEmail;
          a.href = 'mailto:' + genEmail;
        }
      });
      setText('[data-i18n="pages.contact.emailVal"]', genEmail);
    }

    if (salesEmail) {
      document.querySelectorAll('.sales-email, [data-cms="contact-sales-email"]').forEach(el => {
        el.textContent = salesEmail;
        if (el.tagName === 'A') el.href = 'mailto:' + salesEmail;
      });
    }

    if (addr) setText('[data-i18n="pages.contact.addressVal"]', addr);
    if (hours) setText('[data-i18n="pages.contact.hoursVal"]', hours);
  }

  function hydrateCookiePolicy(lang) {
    const data = store('sgcms_cookiepolicy');
    if (!data) return;
    const l = lang || getLang();
    const d = data[l] || data.en || data;

    if (d.hero_badge) setText('[data-i18n="pages.cookiePolicy.heroBadge"]', d.hero_badge);
    if (d.hero_title) setText('[data-i18n="pages.cookiePolicy.heroTitle"], [data-i18n="footer.cookiePolicy"]', d.hero_title);
    if (d.hero_desc) setText('[data-i18n="pages.cookiePolicy.heroDesc"]', d.hero_desc);

    if (d.p1_title) {
      const el = document.querySelector('#sec-cookie-content h4, .cookie-p1-title');
      if (el) el.textContent = d.p1_title;
    }
    if (d.p1_desc) {
      const el = document.querySelector('#sec-cookie-content p, .cookie-p1-desc');
      if (el) el.textContent = d.p1_desc;
    }
  }

  function runHydration(lang) {
    const l = lang || getLang();
    const path = window.location.pathname.toLowerCase();
    hydrateNavigation(l);

    const isNonHome = path.includes('/citizenship') || path.includes('/residency') || path.includes('/programs') || path.includes('/about') || path.includes('/contact') || path.includes('/blog') || path.includes('/admin') || path.includes('/cookie');

    if (!isNonHome) {
      hydrateHomepage(l);
    } else if (path.includes('/programs/') || new URLSearchParams(window.location.search).has('program_id')) {
      if (path.includes('residency')) {
        hydrateProgramPage('residency', l);
      } else {
        hydrateProgramPage('citizenship', l);
      }
    } else if (path.includes('about')) {
      hydrateAboutUs(l);
    } else if (path.includes('blog')) {
      hydrateBlog(l);
    } else if (path.includes('contact')) {
      hydrateContact(l);
    } else if (path.includes('cookie')) {
      hydrateCookiePolicy(l);
    }

    // Apply any arbitrary saved DOM overrides for this page & language
    applyDomOverrides(l);
  }

  // Expose global rehydration function for language-switcher.js and custom components
  window.reapplyCmsHydration = function(lang) {
    runHydration(lang || getLang());
  };

  // Listen to language switch events globally on live website and editor
  window.addEventListener('languageChanged', function(e) {
    const l = e.detail?.lang || getLang();
    runHydration(l);
  });

  // Listen to multi-tab storage publish updates
  window.addEventListener('storage', function(e) {
    if (e.key && (e.key.startsWith('sgcms_') || e.key === 'sharif_lang')) {
      runHydration();
    }
  });

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
      <button type="button" class="cft-btn" id="cft-btn-open-link" style="display:none" title="Open this page"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Open</button>
      <input type="text" id="cft-link-input" placeholder="https:// or page.html" style="display:none;background:#262626;border:1px solid #C5A880;color:#fff;font-size:11px;padding:3px 6px;border-radius:4px;width:140px;outline:none">
    `;
    document.body.appendChild(toolbar);

    // Image Picker Popover
    const imagePopover = document.createElement('div');
    imagePopover.id = 'cms-image-popover';
    imagePopover.style.cssText = `
      position: fixed; z-index: 1000001; display: none; background: #181818;
      border: 1px solid #C5A880; border-radius: 12px; padding: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.85); font-family: 'Inter', sans-serif;
      width: 310px; color: #fff; user-select: none;
    `;
    imagePopover.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:#C5A880;text-transform:uppercase;letter-spacing:.05em">Replace Image</span>
        <button type="button" id="cip-close-btn" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px">&times;</button>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:6px">Quick Luxury Presets:</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px" id="cip-presets">
        <img class="cip-preset-img" data-src="../assets/images/dubai-office-2.webp" src="../assets/images/dubai-office-2.webp" title="Dubai HQ" style="width:100%;height:46px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #333">
        <img class="cip-preset-img" data-src="../assets/images/Dominica-Americas-Hu_10e82c.webp" src="../assets/images/Dominica-Americas-Hu_10e82c.webp" title="Caribbean" style="width:100%;height:46px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #333">
        <img class="cip-preset-img" data-src="../assets/images/portugal-golden-vsa_47319a.webp" src="../assets/images/portugal-golden-vsa_47319a.webp" title="Europe" style="width:100%;height:46px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #333">
        <img class="cip-preset-img" data-src="../assets/images/isdubairealestateago_3194a5.webp" src="../assets/images/isdubairealestateago_3194a5.webp" title="Real Estate" style="width:100%;height:46px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #333">
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Or Paste Custom Image URL:</div>
      <div style="display:flex;gap:6px">
        <input type="text" id="cip-url-input" placeholder="https://images.unsplash.com/..." style="flex:1;background:#262626;border:1px solid #C5A880;color:#fff;font-size:11px;padding:6px 8px;border-radius:6px;outline:none">
        <button type="button" id="cip-apply-btn" style="background:linear-gradient(135deg,#C5A880,#B3946B);border:none;color:#0A0A0A;font-size:11px;font-weight:700;padding:6px 12px;border-radius:6px;cursor:pointer">Apply</button>
      </div>
    `;
    document.body.appendChild(imagePopover);

    let activeImgEl = null;

    function openImagePickerPopover(imgEl) {
      activeImgEl = imgEl;
      const rect = imgEl.getBoundingClientRect();
      const popW = 310;
      let left = rect.left + window.scrollX + (rect.width / 2) - (popW / 2);
      let top = rect.top + window.scrollY + 20;

      left = Math.max(10, Math.min(window.innerWidth - popW - 10, left));
      top = Math.max(10, top);

      imagePopover.style.left = left + 'px';
      imagePopover.style.top = top + 'px';
      imagePopover.style.display = 'block';

      const input = imagePopover.querySelector('#cip-url-input');
      input.value = imgEl.src || '';
      input.focus();
    }

    imagePopover.querySelector('#cip-close-btn').addEventListener('click', () => {
      imagePopover.style.display = 'none';
      activeImgEl = null;
    });

    function applyNewImage(newSrc) {
      if (!activeImgEl || !newSrc) return;
      activeImgEl.src = newSrc;
      imagePopover.style.display = 'none';
      flashToast('Image updated!');

      const path = window.location.pathname.toLowerCase();
      if (path.includes('blog')) {
        const blogs = store('sgcms_blog') || [];
        const currentSlug = window.currentActiveArticleSlug || extractSlug();
        const bIdx = blogs.findIndex(b => b.slug === currentSlug || b.id === currentSlug || (b.en && b.en.slug === currentSlug));
        if (bIdx >= 0) {
          blogs[bIdx].featured_img = newSrc;
          saveStore('sgcms_blog', blogs);
        }
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'CMS_INLINE_SAVED', selector: 'image', src: newSrc }, '*');
      }
      activeImgEl = null;
    }

    imagePopover.querySelectorAll('.cip-preset-img').forEach(pImg => {
      pImg.addEventListener('click', () => {
        applyNewImage(pImg.getAttribute('data-src'));
      });
    });

    imagePopover.querySelector('#cip-apply-btn').addEventListener('click', () => {
      const val = imagePopover.querySelector('#cip-url-input').value.trim();
      if (val) applyNewImage(val);
    });

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
      const tag = el.tagName;
      const ignoreTags = ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'CANVAS'];
      if (ignoreTags.includes(tag)) return false;
      if (el.closest('#cms-inline-toolbar') || el.closest('#cms-hover-tooltip') || el.closest('#cms-save-toast') || el.closest('#cms-preview-badge') || el.closest('.cms-section-tool')) return false;

      // Navigation header, navbar, mobile menu and mega-menus are site navigation, NOT editable body text
      if (el.closest('header, nav, #main-header, #mobile-menu, .mega-menu, [id*="mega"], [class*="navbar"]')) {
        return false;
      }

      const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'SPAN', 'LABEL', 'STRONG', 'EM', 'B', 'I', 'LI', 'BLOCKQUOTE'];
      if (textTags.includes(tag) || el.className.includes('-hero-glow') || el.classList.contains('dominica-hero-glow') || el.classList.contains('stlucia-hero-glow') || el.classList.contains('counter-value')) {
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
      const openBtn = toolbar.querySelector('#cft-btn-open-link');
      const linkInput = toolbar.querySelector('#cft-link-input');
      const isAnchor = el.tagName === 'A' || Boolean(el.closest('a'));
      linkBtn.style.display = isAnchor ? 'inline-flex' : 'none';
      if (openBtn) openBtn.style.display = isAnchor ? 'inline-flex' : 'none';
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
      } else if (path.includes('blog')) {
        // Blog article page
        const blogs = store('sgcms_blog') || [];
        const urlParams = new URLSearchParams(window.location.search);
        const currentSlug = window.currentActiveArticleSlug || urlParams.get('article_slug') || urlParams.get('slug') || extractSlug() || 'about-sharif-group';
        const bIdx = blogs.findIndex(b => b.slug === currentSlug || b.id === currentSlug || (b.en && b.en.slug === currentSlug));
        if (bIdx >= 0) {
          if (!blogs[bIdx][l]) blogs[bIdx][l] = {};
          if (activeEl.id === 'detail-title' || activeEl.closest('#detail-title')) {
            blogs[bIdx][l].title = newText;
            if (window.articlesDatabase && window.articlesDatabase[currentSlug]) window.articlesDatabase[currentSlug].title = newText;
          } else if (activeEl.id === 'detail-category-badge') {
            blogs[bIdx].category = newText;
            if (window.articlesDatabase && window.articlesDatabase[currentSlug]) window.articlesDatabase[currentSlug].category = newText;
          } else if (activeEl.id === 'detail-author') {
            blogs[bIdx].author = newText;
            if (window.articlesDatabase && window.articlesDatabase[currentSlug]) window.articlesDatabase[currentSlug].author = newText;
          } else if (activeEl.id === 'detail-date') {
            blogs[bIdx].publish_date = newText;
            if (window.articlesDatabase && window.articlesDatabase[currentSlug]) window.articlesDatabase[currentSlug].date = newText;
          } else if (activeEl.closest('#detail-content-body')) {
            const bodyEl = document.getElementById('detail-content-body');
            if (bodyEl) {
              blogs[bIdx][l].body = bodyEl.innerHTML;
              if (window.articlesDatabase && window.articlesDatabase[currentSlug]) window.articlesDatabase[currentSlug].content = bodyEl.innerHTML;
            }
          } else if (activeEl.closest('#detail-faq-wrapper')) {
            const allFaqItems = document.querySelectorAll('#detail-faq-col-1 .border-b, #detail-faq-col-2 .border-b');
            const updatedFaqs = [];
            allFaqItems.forEach(item => {
              const qText = (item.querySelector('button span.uppercase')?.innerText || '').trim();
              const aText = (item.querySelector('div p')?.innerText || '').trim();
              if (qText) updatedFaqs.push({ q: qText, a: aText });
            });
            if (updatedFaqs.length) {
              blogs[bIdx].faqs = updatedFaqs;
              blogs[bIdx][l].faqs = updatedFaqs;
              if (window.articlesDatabase && window.articlesDatabase[currentSlug]) {
                window.articlesDatabase[currentSlug].faqs = updatedFaqs;
              }
            }
          }
          saveStore('sgcms_blog', blogs);
        }
      } else {
        // Program page
        const type = path.includes('residency') ? 'sgcms_residency' : 'sgcms_citizenship';
        const list = store(type);
        if (list && list.length) {
          const slug = extractSlug();
          const urlParams = new URLSearchParams(window.location.search);
          const progId = urlParams.get('program_id');
          const idx = list.findIndex(p => (progId && (p.id === progId || p.slug === progId)) || p.slug === slug || p.id === slug || slug.includes(p.slug || p.id));
          if (idx >= 0) {
            if (!list[idx][l]) list[idx][l] = {};
            const progType = type.includes('residency') ? 'residency' : 'citizenship';
            const defaultTab = progType === 'residency' ? 'Residency by investment' : 'Citizenship by investment';

            if (activeEl.closest('h1')) {
              const isSubtitle = activeEl.classList.contains('uppercase') || 
                                 (activeEl.getAttribute('data-i18n') && activeEl.getAttribute('data-i18n').includes('heroSubtitle')) ||
                                 activeEl !== activeEl.closest('h1').firstElementChild;

              let currentCountry = (list[idx][l].hero_title || (list[idx][l].title ? list[idx][l].title.replace(/\s+(citizenship|residency).*$/i, '').trim() : '') || list[idx].name || list[idx].id || 'Dominica').trim();
              if (/^(citizenship|residency)/i.test(currentCountry)) {
                currentCountry = (list[idx].name || list[idx].id || 'Dominica').trim();
              }
              currentCountry = currentCountry.charAt(0).toUpperCase() + currentCountry.slice(1);

              let currentTab = (list[idx][l].hero_subtitle || defaultTab).trim();

              if (isSubtitle) {
                currentTab = newText.trim();
                list[idx][l].hero_subtitle = currentTab;
              } else {
                currentCountry = newText.replace(/\s+(citizenship|residency).*$/i, '').trim();
                currentCountry = currentCountry.charAt(0).toUpperCase() + currentCountry.slice(1);
                list[idx][l].hero_title = currentCountry;
              }

              const fullTitle = formatProgramPageTitle(currentCountry, progType, currentTab);
              list[idx][l].title = fullTitle;
              document.title = `${fullTitle} | Sharif Group Dubai`;
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
        window.parent.postMessage({
          type: 'CMS_CONTENT_CHANGED',
          section: path,
          lang: l
        }, '*');
      }

      try {
        localStorage.setItem('sgcms_publish_status', JSON.stringify({ status: 'draft', lastEdited: new Date().toISOString() }));
      } catch(e) {}

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

    const openBtn = toolbar.querySelector('#cft-btn-open-link');
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!activeEl) return;
        const anchor = activeEl.tagName === 'A' ? activeEl : activeEl.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          if (isInsideIframe) {
            try {
              window.parent.postMessage({ type: 'CMS_NAVIGATE_PAGE', url: anchor.href, path: anchor.pathname }, '*');
            } catch(err) {}
          }
          window.location.href = anchor.href;
        }
      });
    }

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

    // Delegated Click to Edit & Navbar Navigation
    document.addEventListener('click', (e) => {
      // 1. Allow Ctrl+Click or Cmd+Click on ANY link to follow it directly
      if (e.ctrlKey || e.metaKey) return;

      // 2. Check if clicked inside header/navbar
      const navArea = e.target.closest('header, nav, #main-header, #mobile-menu, .mega-menu, [id*="mega"], [class*="navbar"]');
      if (navArea) {
        const anchor = e.target.closest('a');
        if (anchor && anchor.getAttribute('href')) {
          const href = anchor.getAttribute('href').trim();
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            if (isInsideIframe) {
              e.preventDefault();
              try {
                window.parent.postMessage({
                  type: 'CMS_NAVIGATE_PAGE',
                  url: anchor.href,
                  path: anchor.pathname
                }, '*');
              } catch(err) {}
              window.location.href = anchor.href;
              return;
            }
          }
        }
        // Allow menu toggles, dropdown buttons, etc. to run naturally without interruption
        return;
      }

      if (!editMode) return; // Allow natural browsing, link clicking, and button interaction!

      // If clicking inside toolbar, allow toolbar interaction
      if (e.target.closest('#cms-inline-toolbar') || e.target.closest('#cms-hover-tooltip') || e.target.closest('#cms-image-popover')) return;

      const clickedImg = e.target.closest('img');
      if (clickedImg) {
        e.preventDefault();
        e.stopPropagation();
        openImagePickerPopover(clickedImg);
        return;
      }

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

    if (isInsideIframe) {
      try {
        window.parent.postMessage({
          type: 'CMS_FRAME_READY',
          path: window.location.pathname,
          search: window.location.search,
          href: window.location.href,
          slug: extractSlug()
        }, '*');
      } catch(e) {}
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

      if (msg.type === 'CMS_ADD_SECTION') {
        const blockType = msg.blockType || 'section';
        const main = document.querySelector('main') || document.body;
        const newSec = document.createElement('section');
        newSec.className = 'py-16 px-6 relative bg-white border-t border-neutral-200 dynamic-cms-section';
        newSec.innerHTML = `
          <div class="max-w-6xl mx-auto text-center">
            <span class="text-xs uppercase font-bold text-luxury-gold tracking-widest">[CUSTOM SECTION: ${blockType.toUpperCase()}]</span>
            <h2 class="font-serif text-3xl font-bold text-neutral-900 mt-2 mb-4">Click Here to Customize Your New ${blockType.toUpperCase()} Headline</h2>
            <p class="text-sm text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">This section was added via the Visual Studio. Click on any of this text to edit inline, and your changes will be saved directly.</p>
          </div>
        `;
        main.appendChild(newSec);
        newSec.scrollIntoView({ behavior: 'smooth' });
        flashToast('Section added to canvas! Click text to edit.');
      } else if (msg.type === 'CMS_SET_LANG') {
        applyLanguage(msg.lang, 'parent');
      } else if (msg.type === 'CMS_REHYDRATE') {
        runHydration();
      } else if (msg.type === 'CMS_OPEN_ARTICLE') {
        if (typeof window.openBlogDetailBySlug === 'function') {
          window.openBlogDetailBySlug(msg.slug);
        }
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
          const path = window.location.pathname.toLowerCase();
          const progType = path.includes('residency') ? 'residency' : 'citizenship';
          const defaultTab = progType === 'residency' ? 'Residency by investment' : 'Citizenship by investment';
          const subEl = document.querySelector('h1 span.uppercase, [data-i18n*="heroSubtitle"], [data-cms="hero-subtitle"]');
          const currentSub = (subEl?.textContent?.trim() || defaultTab);
          const cleanCountry = String(value).replace(/\s+(citizenship|residency).*$/i, '').trim();
          const els = document.querySelectorAll('h1 [class*="-hero-glow"], h1 .dominica-hero-glow, h1 .stlucia-hero-glow, h1 span:first-child, [data-i18n*="heroTitle"], [data-cms="hero-title"]');
          els.forEach(el => { el.textContent = cleanCountry; });
          const fullTitle = formatProgramPageTitle(cleanCountry || value, progType, currentSub);
          document.title = `${fullTitle} | Sharif Group Dubai`;
        } else if (field === 'hero_subtitle') {
          const path = window.location.pathname.toLowerCase();
          const progType = path.includes('residency') ? 'residency' : 'citizenship';
          const els = document.querySelectorAll('h1 span.uppercase, [data-i18n*="heroSubtitle"], [data-cms="hero-subtitle"]');
          els.forEach(el => { el.textContent = value; });
          const countryEl = document.querySelector('h1 [class*="-hero-glow"], h1 .dominica-hero-glow, h1 .stlucia-hero-glow, h1 span:first-child, [data-i18n*="heroTitle"]');
          const countryName = countryEl?.textContent?.trim() || '';
          if (countryName) {
            const fullTitle = formatProgramPageTitle(countryName, progType, value);
            document.title = `${fullTitle} | Sharif Group Dubai`;
          }
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
          const ovHeading = document.querySelector('[data-i18n-html*="overviewTitle"], [data-i18n*="overviewTitle"], #sec-overview h3');
          if (ovHeading) {
            ovHeading.innerHTML = formatOverviewTitleHtml(value);
          }
        } else if (field === 'overview' || field === 'overview_p1') {
          setText('#sec-overview p, [data-i18n*="overviewDesc"]', value);
        } else if (field === 'benefits_badge') {
          setText('#sec-benefits span.uppercase, [data-i18n*="benefitsBadge"]', value);
        } else if (field === 'benefits_title') {
          const benHeading = document.querySelector('[data-i18n-html*="benefitsTitle"], [data-i18n*="benefitsTitle"], #sec-benefits h2');
          if (benHeading) {
            benHeading.innerHTML = formatBenefitsTitleHtml(value);
          }
        } else if (field === 'benefits_desc') {
          setText('#sec-benefits p.max-w-2xl, [data-i18n*="benefitsDesc"]', value);
        } else if (field === 'investment_badge') {
          setText('#sec-investment span.uppercase, [data-i18n*="investmentBadge"], #sec-pricing-grid span.uppercase, [data-i18n*="pricingBadge"]', value);
        } else if (field === 'investment_title') {
          const invHeading = document.querySelector('[data-i18n-html*="investmentTitle"], [data-i18n*="investmentTitle"], #sec-investment h2');
          if (invHeading) {
            invHeading.innerHTML = formatInvestmentTitleHtml(value);
          }
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
        } else if (field === 'consult_heading' || field === 'form_title') {
          const formHeading = document.querySelector('#program-consult-form-section h3, [data-i18n*="formTitle"]');
          if (formHeading) {
            formHeading.innerHTML = formatFormTitleHtml(value);
          }
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
          const els = document.querySelectorAll('[data-cms="hero-headline"], [data-i18n="hero.title"]');
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
          const path = window.location.pathname.toLowerCase();
          const progType = path.includes('residency') ? 'residency' : 'citizenship';
          const defaultTab = progType === 'residency' ? 'Residency by investment' : 'Citizenship by investment';
          const subEl = document.querySelector('h1 span.uppercase, [data-i18n*="heroSubtitle"], [data-cms="hero-subtitle"]');
          const currentSub = (subEl?.textContent?.trim() || defaultTab);
          const cleanCountry = String(value).replace(/\s+(citizenship|residency).*$/i, '').trim();
          const glowEl = document.querySelector('h1 [class*="-hero-glow"]') || document.querySelector('h1 .dominica-hero-glow') || document.querySelector('h1 .stlucia-hero-glow') || document.querySelector('h1 span:first-child');
          if (glowEl) {
            glowEl.textContent = cleanCountry;
          } else {
            const h1 = document.querySelector('h1');
            if (h1) {
              h1.innerHTML = `<span class="dominica-hero-glow stlucia-hero-glow font-serif text-5xl sm:text-7xl md:text-8xl cursor-pointer">${cleanCountry}</span><span class="text-xl sm:text-3xl md:text-4xl text-white font-serif tracking-widest uppercase font-semibold">${currentSub}</span>`;
            }
          }
          const fullTitle = formatProgramPageTitle(cleanCountry || value, progType, currentSub);
          document.title = `${fullTitle} | Sharif Group Dubai`;
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
    runHydration();
    setupVisualEditor();
    if (!isEditor) {
      syncLiveFromBackend();
    }
    console.log('%c[Sharif Group CMS Studio] Active mode:', 'color:#C5A880;font-weight:700', isEditor ? 'Visual Editor (Live Studio)' : 'Preview Mode');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
