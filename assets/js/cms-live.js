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
  // Never run inside the admin dashboard or studio preview iframes
  try {
    if (window.self !== window.top) return;
    var search = (window.location && window.location.search) ? window.location.search.toLowerCase() : '';
    if (search.indexOf('cms_editor') !== -1 || search.indexOf('cms_preview') !== -1) return;
    if (window.location.pathname.toLowerCase().indexOf('/admin') !== -1) return;
  } catch (e) { }

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

  function isCorrupted(text) {
    if (!text || typeof text !== 'string') return false;
    // Block DOS box-drawing/mojibake characters like ╪, ┘, ┌, █, etc.
    return /[\u2500-\u259F\uFFFD]/.test(text);
  }

  function setEl(selector, text, all) {
    if (text == null || text === '' || isCorrupted(text)) return;
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
    try { clean = decodeURIComponent(clean); } catch (e) { }
    var segs = clean.split('/').filter(Boolean);
    return (segs[segs.length - 1] || 'homepage').toLowerCase();
  }

  /* ── Homepage Hydration ─────────────────────────── */
  function hydrateHomepage(l) {
    var hp = _data.sgcms_homepage;
    if (!hp) return;

    var isEn = (l === 'en');

    // 1. Hero
    // For non-English languages, ONLY use localized CMS overrides if they exist and are non-empty & uncorrupted.
    // NEVER fall back to English (.en), because that would overwrite valid i18n translations with English text!
    var hero = isEn ? ((hp.hero && (hp.hero.en || hp.hero[l])) || {}) : ((hp.hero && hp.hero[l]) || null);
    if (hero) {
      if (hero.headline && !isCorrupted(hero.headline)) {
        setEl('[data-cms="hero-headline"], [data-i18n="hero.title"]', hero.headline, true);
      }
      if (hero.tagline && !isCorrupted(hero.tagline)) {
        setEl('[data-i18n="hero.tagline"]', hero.tagline, true);
      }
      if (hero.pathway_citizenship && !isCorrupted(hero.pathway_citizenship)) {
        setEl('[data-i18n="hero.citizenship"]', hero.pathway_citizenship, true);
      }
      if (hero.pathway_residency && !isCorrupted(hero.pathway_residency)) {
        setEl('[data-i18n="hero.residency"]', hero.pathway_residency, true);
      }
      if (hero.pathway_realestate && !isCorrupted(hero.pathway_realestate)) {
        setEl('[data-i18n="hero.realEstate"]', hero.pathway_realestate, true);
      }
      if (hero.pathway_education && !isCorrupted(hero.pathway_education)) {
        setEl('[data-i18n="hero.educationalAdvisory"]', hero.pathway_education, true);
      }
    }

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
          var lbl = stat['label_' + l];
          if (!lbl && isEn) lbl = stat.label_en;
          if (lbl && !isCorrupted(lbl)) p.textContent = lbl;
        }
      }
    }

    // 3. About Preview
    var about = isEn ? ((hp.about && (hp.about.en || hp.about[l])) || {}) : ((hp.about && hp.about[l]) || null);
    if (about) {
      if (about.badge && !isCorrupted(about.badge)) setEl('[data-i18n="about.badge"]', about.badge);
      if (about.heading && !isCorrupted(about.heading)) setEl('[data-i18n="about.heading"]', about.heading);
      if (about.subheading && !isCorrupted(about.subheading)) setEl('[data-i18n="about.subheading"]', about.subheading);
      if (about.p1 && !isCorrupted(about.p1)) setEl('[data-i18n="about.p1"]', about.p1);
      if (about.p2 && !isCorrupted(about.p2)) setEl('[data-i18n="about.p2"]', about.p2);
      if (about.btn1_text && !isCorrupted(about.btn1_text)) setEl('[data-i18n="about.readStory"]', about.btn1_text);
      if (about.btn2_text && !isCorrupted(about.btn2_text)) setEl('[data-i18n="about.bookConsultation"]', about.btn2_text);
    }

    // 4. Services
    // Only apply services if localized object exists OR if we are on English
    if (isEn) {
      var srv = hp.services || {};
      if (srv.badge && !isCorrupted(srv.badge)) setEl('[data-i18n="services.badge"]', srv.badge);
      if (srv.heading && !isCorrupted(srv.heading)) setEl('[data-i18n="services.heading"]', srv.heading);
      if (srv.heading_italic && !isCorrupted(srv.heading_italic)) setEl('[data-i18n="services.headingItalic"]', srv.heading_italic);
      if (srv.description && !isCorrupted(srv.description)) setEl('[data-i18n="services.description"]', srv.description);

      // Pillars
      var pillars = [
        { key: 'pillar_cbi', prefix: 'services.cbi' },
        { key: 'pillar_rbi', prefix: 'services.rbi' },
        { key: 'pillar_uae', prefix: 'services.uaeGolden' },
        { key: 'pillar_realestate', prefix: 'services.realEstate' },
        { key: 'pillar_education', prefix: 'services.education' }
      ];
      for (var pi = 0; pi < pillars.length; pi++) {
        var pDef = pillars[pi];
        var pData = srv[pDef.key];
        if (!pData) continue;
        if (pData.pillar_badge) setEl('[data-i18n="' + pDef.prefix + '.pillar"]', pData.pillar_badge);
        if (pData.title) setEl('[data-i18n="' + pDef.prefix + '.title"]', pData.title);
        if (pData.p1) setEl('[data-i18n="' + pDef.prefix + '.p1"]', pData.p1);
        if (pData.p2) setEl('[data-i18n="' + pDef.prefix + '.p2"]', pData.p2);
      }
    } else if (hp.services && hp.services[l]) {
      var srvL = hp.services[l];
      if (srvL.badge && !isCorrupted(srvL.badge)) setEl('[data-i18n="services.badge"]', srvL.badge);
      if (srvL.heading && !isCorrupted(srvL.heading)) setEl('[data-i18n="services.heading"]', srvL.heading);
      if (srvL.heading_italic && !isCorrupted(srvL.heading_italic)) setEl('[data-i18n="services.headingItalic"]', srvL.heading_italic);
      if (srvL.description && !isCorrupted(srvL.description)) setEl('[data-i18n="services.description"]', srvL.description);
    }

    // 5. Social Responsibility
    if (isEn && hp.social_responsibility) {
      var sr = hp.social_responsibility;
      if (sr.badge) setEl('[data-i18n="social.badge"]', sr.badge);
      if (sr.heading) setEl('[data-i18n="social.heading"]', sr.heading);
      if (sr.description) setEl('[data-i18n="social.description"]', sr.description);
      if (sr.btn_text) setEl('[data-i18n="social.exploreInitiatives"]', sr.btn_text);
    } else if (hp.social_responsibility && hp.social_responsibility[l]) {
      var srL = hp.social_responsibility[l];
      if (srL.badge && !isCorrupted(srL.badge)) setEl('[data-i18n="social.badge"]', srL.badge);
      if (srL.heading && !isCorrupted(srL.heading)) setEl('[data-i18n="social.heading"]', srL.heading);
      if (srL.description && !isCorrupted(srL.description)) setEl('[data-i18n="social.description"]', srL.description);
      if (srL.btn_text && !isCorrupted(srL.btn_text)) setEl('[data-i18n="social.exploreInitiatives"]', srL.btn_text);
    }

    // 6. Reviews
    if (isEn && hp.reviews) {
      var rev = hp.reviews;
      if (rev.badge) setEl('[data-i18n="reviews.badge"]', rev.badge);
      if (rev.heading) setEl('[data-i18n="reviews.heading"]', rev.heading);
      if (rev.slides && rev.slides.length) {
        var quotes = document.querySelectorAll('#review-slider-track blockquote');
        var imgs = document.querySelectorAll('#review-slider-track img.client-img');
        for (var ri = 0; ri < rev.slides.length; ri++) {
          if (quotes[ri] && rev.slides[ri].quote) quotes[ri].textContent = rev.slides[ri].quote;
          if (imgs[ri] && rev.slides[ri].img) imgs[ri].src = rev.slides[ri].img;
        }
      }
    }
  }

  /* ── About-Us Page Hydration ────────────────────── */
  function hydrateAboutUs(l) {
    var au = _data.sgcms_aboutus;
    if (!au) return;
    var isEn = (l === 'en');

    var hero = isEn ? ((au.hero && (au.hero.en || au.hero[l])) || {}) : ((au.hero && au.hero[l]) || null);
    if (hero) {
      if (hero.badge && !isCorrupted(hero.badge)) setEl('[data-i18n="pages.aboutUs.heroBadge"]', hero.badge, true);
      if (hero.title && !isCorrupted(hero.title)) setEl('[data-i18n="pages.aboutUs.heroTitle"]', hero.title, true);
      if (hero.subtitle && !isCorrupted(hero.subtitle)) setEl('[data-i18n="pages.aboutUs.heroSubtitle"]', hero.subtitle, true);
    }

    var ov = isEn ? ((au.overview && (au.overview.en || au.overview[l])) || {}) : ((au.overview && au.overview[l]) || null);
    if (ov) {
      if (ov.badge && !isCorrupted(ov.badge)) setEl('[data-i18n="pages.aboutUs.about_overview_item1"]', ov.badge, true);
      if (ov.heading && !isCorrupted(ov.heading)) setEl('[data-i18n="pages.aboutUs.about_overview_item2"]', ov.heading, true);
      if (ov.p1 && !isCorrupted(ov.p1)) setEl('[data-i18n="pages.aboutUs.about_overview_item3"]', ov.p1, true);
      if (ov.p2 && !isCorrupted(ov.p2)) setEl('[data-i18n="pages.aboutUs.about_overview_item4"]', ov.p2, true);
    }
  }

  /* ── Contact Page Hydration ─────────────────────── */
  function hydrateContact(l) {
    var ct = _data.sgcms_contact;
    if (!ct) return;
    var isEn = (l === 'en');
    var d = isEn ? (ct.en || ct[l] || {}) : (ct[l] || null);
    if (d) {
      if (d.badge && !isCorrupted(d.badge)) setEl('[data-i18n="pages.contact.badge"]', d.badge, true);
      if (d.heading && !isCorrupted(d.heading)) setEl('[data-i18n="pages.contact.heading"]', d.heading, true);
      if (d.sub && !isCorrupted(d.sub)) setEl('[data-i18n="pages.contact.sub"]', d.sub, true);
    }
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
          selector.indexOf('header') !== -1 ||
          selector.indexOf('nav') !== -1 ||
          selector.indexOf('logo') !== -1 ||
          selector.indexOf('text-neutral-300') !== -1 ||
          selector.indexOf('detail-') !== -1 ||
          selector.indexOf('blog-detail') !== -1 ||
          selector.indexOf('content-body') !== -1 ||
          selector.indexOf('faq-dyn') !== -1 ||
          selector === 'span' ||
          selector.indexOf('div.flex') === 0
        ) continue;

        var item = pageOv[selector];
        var strVal = typeof item === 'string' ? item : (item && item.text ? item.text : '');
        if (!strVal || isCorrupted(strVal)) continue;

        var el = document.querySelector(selector);
        if (!el) continue;
        if (el.closest('header, nav, #main-header, #nav-logo, .mega-dropdown, #mobile-menu')) continue;

        if (typeof item === 'object' && item !== null) {
          if (item.text !== undefined && !isCorrupted(item.text)) el.textContent = item.text;
          if (item.href !== undefined && el.tagName === 'A') el.setAttribute('href', item.href);
        } else {
          el.textContent = strVal;
        }
      } catch (e) { /* ignore malformed selectors */ }
    }
  }

  /* ── Blog Hydration (Public Grid & Reader) ───────── */
  function mapCategoryToDataCat(cat, subcat) {
    cat = (cat || '').toLowerCase();
    subcat = (subcat || '').toLowerCase();
    var res = [];
    if (cat.indexOf('citizen') !== -1 || subcat.indexOf('citizen') !== -1) res.push('citizenship');
    if (cat.indexOf('residen') !== -1 || subcat.indexOf('residen') !== -1) res.push('residency');
    if (cat.indexOf('golden') !== -1 || subcat.indexOf('golden') !== -1) res.push('golden-visa');
    if (cat.indexOf('estate') !== -1 || subcat.indexOf('estate') !== -1) res.push('real-estate');
    if (cat.indexOf('educat') !== -1 || subcat.indexOf('educat') !== -1) res.push('educational');
    return res.length ? res.join(' ') : 'citizenship';
  }

  function hydrateBlog(l) {
    var blogs = _data.sgcms_blog;
    if (!Array.isArray(blogs) || !blogs.length) return;

    window.articlesDatabase = window.articlesDatabase || {};

    var grid = document.getElementById('all-blogs-grid');
    if (!grid) return;

    blogs.forEach(function (b) {
      if (!b) return;
      var ld = b[l] || b.en || b;
      var title = ld.title || (b.en && b.en.title) || b.title;
      if (!title || isCorrupted(title)) return;
      var slug = b.slug || (b.en && b.en.slug) || ld.slug || b.id;
      var status = b['status_' + l] || b.status_en || 'published';
      if (status !== 'published') return;

      var subcat = b.subcategory ? ' · ' + b.subcategory : '';
      var catDisplay = (b.category || 'Sharif Group Insights') + subcat;
      var dataCat = mapCategoryToDataCat(b.category, b.subcategory);

      var localizedFaqs = (ld.faqs && Array.isArray(ld.faqs) && ld.faqs.length) ? ld.faqs
        : ((b[l] && b[l].faqs && Array.isArray(b[l].faqs) && b[l].faqs.length) ? b[l].faqs
          : ((b.en && Array.isArray(b.en.faqs) && b.en.faqs.length) ? b.en.faqs
            : (b.faqs || [])));

      var articleData = {
        title: title,
        category: catDisplay,
        author: b.author || 'Sharif Group Advisory',
        date: b.publish_date || '2026-09-01',
        updated: b.publish_date || '2026-09-01',
        image: b.featured_img || '/assets/images/dubai-office-2.webp',
        content: ld.body || (b.en && b.en.body) || ('<p>' + (ld.excerpt || '') + '</p>'),
        faqs: localizedFaqs
      };

      window.articlesDatabase[slug] = articleData;
      window.articlesDatabase[b.id] = articleData;

      var existingCard = grid.querySelector('[data-cms-blog-id="' + b.id + '"]');
      if (!existingCard) {
        var staticCards = grid.querySelectorAll('article.blog-item:not(.dynamic-cms-blog)');
        for (var i = 0; i < staticCards.length; i++) {
          var sc = staticCards[i];
          var a = sc.querySelector('a[onclick*="openBlogDetailBySlug"]');
          var onclickAttr = a ? a.getAttribute('onclick') || '' : '';
          var h4 = sc.querySelector('h4');
          var cardTitle = h4 ? h4.textContent.trim().toLowerCase() : '';
          var blogTitle = title.trim().toLowerCase();
          if (onclickAttr.indexOf(slug) !== -1 || (cardTitle && cardTitle === blogTitle)) {
            existingCard = sc;
            existingCard.setAttribute('data-cms-blog-id', b.id);
            break;
          }
        }
      }

      if (existingCard) {
        var h4El = existingCard.querySelector('h4');
        if (h4El) h4El.textContent = title;
        var pEl = existingCard.querySelector('p');
        if (pEl && ld.excerpt) pEl.textContent = ld.excerpt;
      } else {
        var articleEl = document.createElement('article');
        articleEl.className = 'space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog';
        articleEl.setAttribute('data-cms-blog-id', b.id);
        articleEl.setAttribute('data-cat', dataCat);
        articleEl.style.display = 'flex';
        articleEl.setAttribute('data-paginated', 'true');

        var cleanImg = b.featured_img || '/assets/images/dubai-office-2.webp';
        if (cleanImg.indexOf('http') !== 0 && cleanImg.indexOf('/') !== 0) cleanImg = '/' + cleanImg;

        articleEl.innerHTML =
          '<div class="space-y-3">' +
          '<div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-md neon-card-hover border border-neutral-200/70">' +
          '<img alt="' + title.replace(/"/g, '&quot;') + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="' + cleanImg + '" onerror="this.onerror=null;this.src=\'/assets/images/dubai-office-2.webp\'">' +
          '</div>' +
          '<h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">' +
          title +
          '</h4>' +
          '</div>' +
          '<a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start cursor-pointer" href="javascript:void(0)" onclick="openBlogDetailBySlug(\'' + slug + '\', event)">' +
          'READ MORE' +
          '</a>';

        grid.prepend(articleEl);
      }
    });

    if (typeof window.initPagination === 'function') {
      window.initPagination();
    }
  }

  /* ── Main Hydration Router ──────────────────────── */
  function runHydration(lang) {
    if (!_data) return;
    var l = lang || getLang();
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
    } else if (path.indexOf('/blog') !== -1) {
      hydrateBlog(l);
    }

    // DOM overrides apply to every page (programme pages etc.)
    applyDomOverrides(l);
  }

  /* ── Global Hook (called by language-switcher.js) ── */
  window.reapplyCmsHydration = function (lang) {
    runHydration(lang || getLang());
  };

  window.renderBlogCards = function (lang) {
    hydrateBlog(lang || getLang());
  };

  /* ── Re-run on every language change ────────────── */
  window.addEventListener('languageChanged', function (e) {
    var l = (e && e.detail && e.detail.lang) ? e.detail.lang : getLang();
    runHydration(l);
  });

  /* ── Fetch published_content.json ───────────────── */
  function fetchAndApply() {
    var candidates = [
      '/admin/api/published_content.json?v=' + Date.now(),
      '/admin/api/content.php?mode=live&v=' + Date.now(),
      '../admin/api/published_content.json?v=' + Date.now(),
      '../../admin/api/published_content.json?v=' + Date.now()
    ];
    var idx = 0;

    function tryNext() {
      if (idx >= candidates.length) return;
      var url = candidates[idx++];
      fetch(url, { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) { tryNext(); return null; }
          return res.json();
        })
        .then(function (json) {
          if (!json || typeof json !== 'object') return;
          if (json.data && typeof json.data === 'object' && json.success) {
            json = json.data;
          }
          if (Object.keys(json).length === 0) return;

          // Unwrap any nested/double-stringified JSON values
          for (var k in json) {
            if (typeof json[k] === 'string') {
              var trimmed = json[k].trim();
              if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
                try { json[k] = JSON.parse(trimmed); } catch (e) { }
              }
            }
          }
          _data = json;

          // Seed blog data into localStorage without overwriting active draft
          try {
            if (Array.isArray(json.sgcms_blog) && json.sgcms_blog.length) {
              localStorage.setItem('sgcms_blog_live', JSON.stringify(json.sgcms_blog));
              if (!localStorage.getItem('sgcms_blog')) {
                localStorage.setItem('sgcms_blog', JSON.stringify(json.sgcms_blog));
              }
              if (window.location.pathname.toLowerCase().indexOf('/blog') !== -1) {
                var lang = getLang();
                setTimeout(function () {
                  hydrateBlog(lang);
                  if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
                }, 50);
              }
            }
          } catch (e) { }

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
