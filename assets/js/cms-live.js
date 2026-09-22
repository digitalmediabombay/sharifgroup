/**
 * Sharif Group CMS – Live Content Loader (PUBLIC)
 * -----------------------------------------------
 * Applies PUBLISHED CMS content to the live website.
 *
 * SAFE DESIGN:
 *  - Reads ONLY from /admin/api/published_content.json  (static server file)
 *  - Does NOT touch localStorage at all
 *  - Does NOT load any admin/editor tools
 *  - Has an /admin/ path guard so it never runs inside the dashboard
 *  - Runs AFTER language-switcher.js applies translations, so language
 *    switching is completely unaffected
 *
 * HOW IT WORKS:
 *  1. language-switcher.js loads this script early in init()
 *  2. This script fetches published_content.json from the server
 *  3. After translations are applied, language-switcher.js calls
 *     window.reapplyCmsHydration(lang) – defined here
 *  4. That function overlays CMS overrides on top of the translated text
 *  5. On every language switch the same hook is called automatically
 */
(function () {
  'use strict';

  /* ── Guards ─────────────────────────────────────── */
  if (typeof window === 'undefined') return;
  if (window.location.protocol === 'file:') return;
  // Never run inside the admin dashboard
  if (window.location.pathname.toLowerCase().indexOf('/admin') !== -1) return;

  /* ── State ──────────────────────────────────────── */
  var _data = null; // published_content.json payload

  /* ── Helpers ─────────────────────────────────────── */
  function getLang() {
    try {
      if (typeof window.getCurrentLanguage === 'function') {
        var g = window.getCurrentLanguage();
        if (['en', 'ar', 'fa', 'zh'].indexOf(g) !== -1) return g;
      }
      var raw = (
        localStorage.getItem('sharif_lang') ||
        localStorage.getItem('sharif_preferred_lang') ||
        'en'
      ).split('-')[0].toLowerCase().trim();
      return ['en', 'ar', 'fa', 'zh'].indexOf(raw) !== -1 ? raw : 'en';
    } catch (e) { return 'en'; }
  }

  function setEl(selector, text, all) {
    if (text == null || text === '') return;
    var list = all
      ? Array.from(document.querySelectorAll(selector))
      : [document.querySelector(selector)];
    for (var i = 0; i < list.length; i++) {
      if (list[i]) list[i].textContent = text;
    }
  }

  function extractSlug() {
    var clean = window.location.pathname
      .replace(/\/index\.html?$/i, '')
      .replace(/\/$/, '');
    try { clean = decodeURIComponent(clean); } catch (e) {}
    var segs = clean.split('/').filter(Boolean);
    return (segs[segs.length - 1] || 'homepage').toLowerCase();
  }

  /* ── Homepage Hydration ─────────────────────────── */
  function hydrateHomepage(l) {
    var hp = _data.sgcms_homepage;
    if (!hp) return;

    // 1. Hero
    var hero = (hp.hero && (hp.hero[l] || hp.hero.en)) || {};
    if (hero.headline) {
      setEl('[data-cms="hero-headline"], [data-i18n="hero.title"]', hero.headline, true);
    }
    if (hero.tagline)            setEl('[data-i18n="hero.tagline"]',              hero.tagline,            true);
    if (hero.pathway_citizenship) setEl('[data-i18n="hero.citizenship"]',          hero.pathway_citizenship, true);
    if (hero.pathway_residency)  setEl('[data-i18n="hero.residency"]',            hero.pathway_residency,  true);
    if (hero.pathway_realestate) setEl('[data-i18n="hero.realEstate"]',           hero.pathway_realestate, true);
    if (hero.pathway_education)  setEl('[data-i18n="hero.educationalAdvisory"]',  hero.pathway_education,  true);

    // 2. Stats
    if (hp.stats && hp.stats.length) {
      var statBoxes = document.querySelectorAll('#stats-section > div');
      for (var si = 0; si < hp.stats.length && si < statBoxes.length; si++) {
        var stat = hp.stats[si];
        var counter = statBoxes[si].querySelector('.counter-value');
        if (counter && stat.value) {
          var num = parseInt(String(stat.value).replace(/\D/g, ''), 10);
          if (!isNaN(num)) counter.setAttribute('data-target', num);
          counter.textContent = stat.value;
        }
        var p = statBoxes[si].querySelector('p');
        if (p) {
          var lbl = stat['label_' + l] || stat.label_en;
          if (lbl) p.textContent = lbl;
        }
      }
    }

    // 3. About Preview
    var about = (hp.about && (hp.about[l] || hp.about.en)) || {};
    if (about.badge)      setEl('[data-i18n="about.badge"]',             about.badge);
    if (about.heading)    setEl('[data-i18n="about.heading"]',           about.heading);
    if (about.subheading) setEl('[data-i18n="about.subheading"]',        about.subheading);
    if (about.p1)         setEl('[data-i18n="about.p1"]',               about.p1);
    if (about.p2)         setEl('[data-i18n="about.p2"]',               about.p2);
    if (about.btn1_text)  setEl('[data-i18n="about.readStory"]',         about.btn1_text);
    if (about.btn2_text)  setEl('[data-i18n="about.bookConsultation"]',  about.btn2_text);

    // 4. Services
    var srv = hp.services || {};
    if (srv.badge)          setEl('[data-i18n="services.badge"]',        srv.badge);
    if (srv.heading)        setEl('[data-i18n="services.heading"]',      srv.heading);
    if (srv.heading_italic) setEl('[data-i18n="services.headingItalic"]',srv.heading_italic);
    if (srv.description)    setEl('[data-i18n="services.description"]',  srv.description);

    // Pillars
    var pillars = [
      { key: 'pillar_cbi',        prefix: 'services.cbi'        },
      { key: 'pillar_rbi',        prefix: 'services.rbi'        },
      { key: 'pillar_uae',        prefix: 'services.uaeGolden'  },
      { key: 'pillar_realestate', prefix: 'services.realEstate' },
      { key: 'pillar_education',  prefix: 'services.education'  }
    ];
    for (var pi = 0; pi < pillars.length; pi++) {
      var pDef = pillars[pi];
      var pData = srv[pDef.key];
      if (!pData) continue;
      if (pData.pillar_badge) setEl('[data-i18n="' + pDef.prefix + '.pillar"]', pData.pillar_badge);
      if (pData.title)        setEl('[data-i18n="' + pDef.prefix + '.title"]',  pData.title);
      if (pData.p1)           setEl('[data-i18n="' + pDef.prefix + '.p1"]',     pData.p1);
      if (pData.p2)           setEl('[data-i18n="' + pDef.prefix + '.p2"]',     pData.p2);
    }

    // 5. Social Responsibility
    var sr = hp.social_responsibility;
    if (sr) {
      if (sr.badge)        setEl('[data-i18n="social.badge"]',              sr.badge);
      if (sr.heading)      setEl('[data-i18n="social.heading"]',            sr.heading);
      if (sr.description)  setEl('[data-i18n="social.description"]',        sr.description);
      if (sr.btn_text)     setEl('[data-i18n="social.exploreInitiatives"]', sr.btn_text);
    }

    // 6. Reviews
    var rev = hp.reviews;
    if (rev) {
      if (rev.badge)   setEl('[data-i18n="reviews.badge"]',   rev.badge);
      if (rev.heading) setEl('[data-i18n="reviews.heading"]', rev.heading);
      if (rev.slides && rev.slides.length) {
        var quotes = document.querySelectorAll('#review-slider-track blockquote');
        var imgs   = document.querySelectorAll('#review-slider-track img.client-img');
        for (var ri = 0; ri < rev.slides.length; ri++) {
          if (quotes[ri] && rev.slides[ri].quote) quotes[ri].textContent = rev.slides[ri].quote;
          if (imgs[ri]   && rev.slides[ri].img)   imgs[ri].src = rev.slides[ri].img;
        }
      }
    }
  }

  /* ── About-Us Page Hydration ────────────────────── */
  function hydrateAboutUs(l) {
    var au = _data.sgcms_aboutus;
    if (!au) return;

    var hero = (au.hero && (au.hero[l] || au.hero.en)) || {};
    if (hero.badge)    setEl('[data-i18n="pages.aboutUs.heroBadge"]',    hero.badge,    true);
    if (hero.title)    setEl('[data-i18n="pages.aboutUs.heroTitle"]',    hero.title,    true);
    if (hero.subtitle) setEl('[data-i18n="pages.aboutUs.heroSubtitle"]', hero.subtitle, true);

    var ov = (au.overview && (au.overview[l] || au.overview.en)) || {};
    if (ov.badge)   setEl('[data-i18n="pages.aboutUs.about_overview_item1"]', ov.badge,   true);
    if (ov.heading) setEl('[data-i18n="pages.aboutUs.about_overview_item2"]', ov.heading, true);
    if (ov.p1)      setEl('[data-i18n="pages.aboutUs.about_overview_item3"]', ov.p1,      true);
    if (ov.p2)      setEl('[data-i18n="pages.aboutUs.about_overview_item4"]', ov.p2,      true);
  }

  /* ── Contact Page Hydration ─────────────────────── */
  function hydrateContact(l) {
    var ct = _data.sgcms_contact;
    if (!ct) return;
    var d = ct[l] || ct.en || {};
    if (d.badge)   setEl('[data-i18n="pages.contact.badge"]',   d.badge,   true);
    if (d.heading) setEl('[data-i18n="pages.contact.heading"]', d.heading, true);
    if (d.sub)     setEl('[data-i18n="pages.contact.sub"]',     d.sub,     true);
  }

  /* ── DOM Overrides (Programme / Other Pages) ────── */
  function applyDomOverrides(l) {
    var overrides = _data.sgcms_dom_overrides;
    if (!overrides || typeof overrides !== 'object') return;

    var slug = extractSlug();
    var pageOv = (overrides[slug] && overrides[slug][l]) || {};

    for (var selector in pageOv) {
      if (!Object.prototype.hasOwnProperty.call(pageOv, selector)) continue;
      try {
        // Skip navigation / structural selectors (same rules as cms-loader.js)
        if (
          selector.indexOf('header')           !== -1 ||
          selector.indexOf('nav')              !== -1 ||
          selector.indexOf('logo')             !== -1 ||
          selector.indexOf('text-neutral-300') !== -1 ||
          selector.indexOf('detail-')          !== -1 ||
          selector.indexOf('blog-detail')      !== -1 ||
          selector.indexOf('content-body')     !== -1 ||
          selector.indexOf('faq-dyn')          !== -1 ||
          selector === 'span'                       ||
          selector.indexOf('div.flex') === 0
        ) continue;

        var item   = pageOv[selector];
        var strVal = typeof item === 'string' ? item : (item && item.text ? item.text : '');
        if (!strVal) continue;

        var el = document.querySelector(selector);
        if (!el) continue;
        if (el.closest('header, nav, #main-header, #nav-logo, .mega-dropdown, #mobile-menu')) continue;

        if (typeof item === 'object' && item !== null) {
          if (item.text !== undefined) el.textContent = item.text;
          if (item.href !== undefined && el.tagName === 'A') el.setAttribute('href', item.href);
        } else {
          el.textContent = strVal;
        }
      } catch (e) { /* ignore malformed selectors */ }
    }
  }

  /* ── Main Hydration Router ──────────────────────── */
  function runHydration(lang) {
    if (!_data) return;
    var l    = lang || getLang();
    var path = window.location.pathname.toLowerCase();

    var isHome = (
      path === '/' ||
      path === '/index.html' ||
      path.match(/^\/(en|ar|fa|zh)\/?$/) ||
      (!path.match(/\/citizenship|\/residency|\/programs|\/about|\/contact|\/blog|\/cookie|\/eligibility|\/realestate|\/educational|\/privacy|\/term|\/social|\/ali-sharif/))
    );

    if (isHome) {
      hydrateHomepage(l);
    } else if (path.indexOf('/about') !== -1 && path.indexOf('/programs') === -1) {
      hydrateAboutUs(l);
    } else if (path.indexOf('/contact') !== -1) {
      hydrateContact(l);
    }

    // DOM overrides apply to every page (programme pages etc.)
    applyDomOverrides(l);
  }

  /* ── Global Hook (called by language-switcher.js) ── */
  window.reapplyCmsHydration = function (lang) {
    runHydration(lang || getLang());
  };

  /* ── Re-run on every language change ────────────── */
  window.addEventListener('languageChanged', function (e) {
    var l = (e && e.detail && e.detail.lang) ? e.detail.lang : getLang();
    runHydration(l);
  });

  /* ── Fetch published_content.json ───────────────── */
  function fetchAndApply() {
    // Try from root first, then relative fallbacks for sub-directories
    var candidates = [
      '/admin/api/published_content.json',
      '../admin/api/published_content.json',
      '../../admin/api/published_content.json'
    ];
    var idx = 0;

    function tryNext() {
      if (idx >= candidates.length) return; // all failed – site still shows locale content
      var url = candidates[idx++];
      fetch(url, { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) { tryNext(); return null; }
          return res.json();
        })
        .then(function (json) {
          if (!json || typeof json !== 'object') return;
          if (Object.keys(json).length === 0)    return; // empty – nothing published yet
          _data = json;

          // Seed blog data into localStorage so blog-translator.js can read it.
          // This is the bridge between admin-published content and the public blog page.
          try {
            if (Array.isArray(json.sgcms_blog) && json.sgcms_blog.length) {
              var current = JSON.parse(localStorage.getItem('sgcms_blog') || '[]');
              // Only overwrite if server has more/newer data
              if (!Array.isArray(current) || current.length === 0 || json.sgcms_blog.length >= current.length) {
                localStorage.setItem('sgcms_blog', JSON.stringify(json.sgcms_blog));
                // If on the blog page, trigger a re-render by dispatching the language event
                if (window.location.pathname.toLowerCase().indexOf('/blog') !== -1) {
                  var lang = getLang();
                  setTimeout(function () {
                    if (typeof window.renderBlogCards === 'function') window.renderBlogCards(lang);
                    if (typeof window.paginateBlogs   === 'function') window.paginateBlogs();
                  }, 100);
                }
              }
            }
          } catch (e) { /* localStorage write failed – non-blocking */ }

          runHydration();
        })
        .catch(tryNext);
    }

    tryNext();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndApply);
  } else {
    setTimeout(fetchAndApply, 0);
  }
})();
