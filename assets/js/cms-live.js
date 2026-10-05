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
    if (search.indexOf('cms_editor') !== -1) return;
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

  function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '/assets/images/dubai-office-2.webp';
    url = url.trim();
    if (!url) return '/assets/images/dubai-office-2.webp';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return url;
    if (url.startsWith('../')) return url.replace(/^(\.\.\/)+/, '/');
    return '/' + url;
  }

  function isEnglishFallback(str, currentLang) {
    if (!str || typeof str !== 'string') return true;
    if (isCorrupted(str)) return true;
    if (!currentLang || currentLang === 'en') return false;
    var trimmed = str.trim();
    var enPhrases = [
      'About Sharif Group',
      'EXECUTIVE BRIEFING',
      'A premier migration, citizenship, and luxury investment advisory platform rooted in Business Bay, Dubai.',
      'WHO WE ARE',
      'Company Overview: Sharif Group',
      'Company Overview:',
      'Sharif Group is a dedicated private consulting company based in Business Bay, Dubai.',
      'Book Consultation',
      'Three Companies. One Commitment.',
      'CORPORATE ARCHITECTURE',
      'A MESSAGE FROM OUR FOUNDER',
      'Ali Sharif',
      'CEO & Founder, Sharif Group',
      'Schedule Your Expert Consultation Today',
      'Request Executive Briefing'
    ];
    if (enPhrases.indexOf(trimmed) !== -1) return true;
    if (currentLang === 'ar' || currentLang === 'fa') {
      var hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(trimmed);
      var isAscii = /^[A-Za-z0-9\s.,:;!?'"()&/\-]+$/.test(trimmed);
      if (!hasArabic && isAscii && trimmed.length > 3) return true;
    }
    if (currentLang === 'zh') {
      var hasChinese = /[\u4E00-\u9FFF]/.test(trimmed);
      var isAsciiZh = /^[A-Za-z0-9\s.,:;!?'"()&/\-]+$/.test(trimmed);
      if (!hasChinese && isAsciiZh && trimmed.length > 3) return true;
    }
    return false;
  }

  function setEl(selector, text, all, lang) {
    if (text == null || text === '' || isCorrupted(text)) return;
    var targetLang = lang || getLang();
    if (targetLang && targetLang !== 'en' && isEnglishFallback(text, targetLang)) return;
    var list = all
      ? Array.from(document.querySelectorAll(selector))
      : [document.querySelector(selector)];
    var nextText = String(text);
    var nextTrimmed = nextText.trim();
    for (var i = 0; i < list.length; i++) {
      if (list[i]) {
        var curTrimmed = (list[i].textContent || '').trim();
        if (curTrimmed !== nextTrimmed) {
          list[i].textContent = nextText;
        }
      }
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

    var defAboutHero = {
      ar: { badge: 'إحاطة تنفيذية', title: 'نبذة عن مجموعة شريف', subtitle: 'منصة رائدة للاستشارات في مجال الهجرة والمواطنة والاستثمارات الفاخرة، تتخذ من الخليج التجاري في دبي مقرًا لها.' },
      fa: { badge: 'جلسه توجیهی اجرایی', title: 'درباره شریف گروپ', subtitle: 'یک پلتفرم برتر مشاوره در زمینه مهاجرت، شهروندی و سرمایه‌گذاری‌های لوکس، مستقر در بیزنس‌بی دبی.' },
      zh: { badge: '执行简报', title: '关于 谢里夫集团', subtitle: '一个立足于迪拜商业湾的高端移民、公民身份及奢华投资咨询平台。' }
    };

    var hero = isEn ? ((au.hero && (au.hero.en || au.hero[l])) || {}) : ((au.hero && au.hero[l]) || null);
    var badge = (hero && hero.badge && !isEnglishFallback(hero.badge, l)) ? hero.badge : (defAboutHero[l] ? defAboutHero[l].badge : null);
    var title = (hero && hero.title && !isEnglishFallback(hero.title, l)) ? hero.title : (defAboutHero[l] ? defAboutHero[l].title : null);
    var subtitle = (hero && hero.subtitle && !isEnglishFallback(hero.subtitle, l)) ? hero.subtitle : (defAboutHero[l] ? defAboutHero[l].subtitle : null);
    if (badge) setEl('[data-i18n="pages.aboutUs.heroBadge"]', badge, true);
    if (title) setEl('[data-i18n="pages.aboutUs.heroTitle"]', title, true);
    if (subtitle) setEl('[data-i18n="pages.aboutUs.heroSubtitle"]', subtitle, true);

    var ov = isEn ? ((au.overview && (au.overview.en || au.overview[l])) || {}) : ((au.overview && au.overview[l]) || null);
    if (ov) {
      if (ov.badge && !isEnglishFallback(ov.badge, l)) setEl('[data-i18n="pages.aboutUs.about_overview_item1"]', ov.badge, true);
      if (ov.heading && !isEnglishFallback(ov.heading, l)) {
        var el = document.querySelector('[data-i18n-html="pages.aboutUs.about_overview_item2"], [data-i18n="pages.aboutUs.about_overview_item2"]');
        if (el) {
          if (ov.heading.indexOf('<') !== -1) {
            el.innerHTML = ov.heading;
          } else {
            var brandMap = { ar: 'مجموعة شريف', fa: 'شریف گروپ', zh: '谢里夫集团', en: 'Sharif Group' };
            var brand = brandMap[l] || 'Sharif Group';
            var cleanHead = ov.heading.replace(new RegExp(brand + '$', 'i'), '').trim();
            cleanHead = cleanHead.replace(/[:：\s]+$/, '').trim();
            var colon = l === 'zh' ? '：' : ':';
            el.innerHTML = cleanHead + colon + '<br/><span class="italic text-[#C5A880] font-serif font-normal">' + brand + '</span>';
          }
        }
      }
      if (ov.p1 && !isEnglishFallback(ov.p1, l)) setEl('[data-i18n="pages.aboutUs.about_overview_item3"]', ov.p1, true);
      if (ov.p2 && !isEnglishFallback(ov.p2, l)) setEl('[data-i18n="pages.aboutUs.about_overview_item4"]', ov.p2, true);
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
  function mapCategoryToDataCat(cat, subcat, title, slug) {
    cat = (cat || '').toLowerCase();
    subcat = (subcat || '').toLowerCase();
    title = (title || '').toLowerCase();
    slug = (slug || '').toLowerCase();
    var res = [];
    if (cat.indexOf('citizen') !== -1 || subcat.indexOf('citizen') !== -1 || title.indexOf('passport') !== -1 || title.indexOf('citizen') !== -1) res.push('citizenship');
    if (cat.indexOf('residen') !== -1 || subcat.indexOf('residen') !== -1) res.push('residency');
    if (cat.indexOf('golden') !== -1 || subcat.indexOf('golden') !== -1) { res.push('golden-visa'); res.push('residency'); }
    if (cat.indexOf('estate') !== -1 || subcat.indexOf('estate') !== -1) res.push('real-estate');
    if (cat.indexOf('educat') !== -1 || subcat.indexOf('educat') !== -1) res.push('educational');
    if (cat.indexOf('company') !== -1 || cat.indexOf('tax') !== -1 || cat.indexOf('corporate') !== -1) res.push('company');
    if (cat.indexOf('sharif') !== -1) res.push('sharif');

    var knownSubs = {
      'dominica': 'dominica',
      'st-kitts': 'st-kitts',
      'stkitts': 'st-kitts',
      'antigua': 'antigua',
      'saint-lucia': 'saint-lucia',
      'stlucia': 'saint-lucia',
      'grenada': 'grenada',
      'vanuatu': 'vanuatu',
      'sao-tome': 'sao-tome',
      'saotome': 'sao-tome',
      'nauru': 'nauru',
      'portugal': 'portugal',
      'greece': 'greece',
      'panama': 'panama',
      'uae': 'uae'
    };

    for (var k in knownSubs) {
      if (subcat.indexOf(k) !== -1 || title.indexOf(k.replace(/-/g, ' ')) !== -1 || slug.indexOf(k) !== -1) {
        var tag = knownSubs[k];
        if (res.indexOf(tag) === -1) res.push(tag);
        if (tag === 'dominica' || tag === 'st-kitts' || tag === 'antigua' || tag === 'saint-lucia' || tag === 'grenada' || tag === 'vanuatu' || tag === 'sao-tome' || tag === 'nauru') {
          if (res.indexOf('citizenship') === -1) res.push('citizenship');
        }
        if (tag === 'portugal' || tag === 'greece' || tag === 'panama' || tag === 'uae') {
          if (res.indexOf('residency') === -1) res.push('residency');
        }
      }
    }

    if (!res.length) res.push('citizenship');
    return Array.from(new Set(res)).join(' ');
  }

  function hydrateBlog(l) {
    var blogs = (_data && _data.sgcms_blog) || [];
    if (!Array.isArray(blogs) || !blogs.length) {
      try {
        var rawLocal = localStorage.getItem('sgcms_blog_live');
        if (rawLocal) {
          var parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal) && parsedLocal.length) {
            blogs = parsedLocal;
          }
        }
      } catch (e) {}
    }
    if (!Array.isArray(blogs) || !blogs.length) return;

    // Deduplicate blogs to avoid duplicate cards on the public website
    var seen = {};
    var deduped = [];
    blogs.forEach(function (b) {
      if (!b) return;
      var id = b.id || '';
      var tEn = ((b.en && b.en.title) || b.title || '').trim().toLowerCase();
      var tAr = ((b.ar && b.ar.title) || '').trim().toLowerCase();
      var tFa = ((b.fa && b.fa.title) || '').trim().toLowerCase();
      var tZh = ((b.zh && b.zh.title) || '').trim().toLowerCase();
      var titleKey = tEn || tAr || tFa || tZh;

      if (id && seen['id:' + id]) return;
      if (titleKey && seen['t:' + titleKey]) return;

      if (id) seen['id:' + id] = true;
      if (titleKey) seen['t:' + titleKey] = true;
      deduped.push(b);
    });
    blogs = deduped;

    window.articlesDatabase = window.articlesDatabase || {};

    var grid = document.getElementById('all-blogs-grid');
    if (!grid) return;

    blogs.forEach(function (b) {
      if (!b) return;
      var ld = b[l] || b.en || b;
      var title = ld.title || (b.en && b.en.title) || b.title;
      if (!title || isCorrupted(title)) return;
      var slug = b.slug || (b.en && b.en.slug) || ld.slug || b.id;
      var status = (b['status_' + l] || b.status_en || b.status || (b.en && b.en.status) || 'published').toLowerCase();
      if (status === 'draft' || status === 'hidden' || status !== 'published') return;

      var subcat = b.subcategory ? ' · ' + b.subcategory : '';
      var catDisplay = (b.category || 'Sharif Group Insights') + subcat;
      var dataCat = mapCategoryToDataCat(b.category, b.subcategory, title, slug);

      var localizedFaqs = (ld.faqs && Array.isArray(ld.faqs) && ld.faqs.length) ? ld.faqs
        : ((b[l] && b[l].faqs && Array.isArray(b[l].faqs) && b[l].faqs.length) ? b[l].faqs
          : ((b.en && Array.isArray(b.en.faqs) && b.en.faqs.length) ? b.en.faqs
            : (b.faqs || [])));

      var enLd = b.en || b;
      var enTitle = (b.en && b.en.title) || b.title;
      var enBody = (b.en && b.en.body) || b.body || ('<p>' + (enLd.excerpt || '') + '</p>');
      var enArticleData = {
        title: enTitle,
        category: catDisplay,
        author: b.author || 'Sharif Group Advisory',
        date: b.publish_date || '2026-09-01',
        updated: b.publish_date || '2026-09-01',
        image: normalizeImageUrl(b.featured_img),
        content: enBody,
        faqs: (b.en && Array.isArray(b.en.faqs) && b.en.faqs.length) ? b.en.faqs : (b.faqs || [])
      };

      window.articlesDatabase[slug] = enArticleData;
      window.articlesDatabase[b.id] = enArticleData;

      // Find any existing dynamic cards matching id or slug
      var matchingCards = grid.querySelectorAll('[data-cms-blog-id="' + b.id + '"], [data-cms-slug="' + slug + '"]');
      var existingCard = matchingCards.length ? matchingCards[0] : null;
      for (var m = 1; m < matchingCards.length; m++) {
        matchingCards[m].remove();
      }

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
            existingCard.setAttribute('data-cms-slug', slug);
            break;
          }
        }
      }

      var readMoreLabel = (l === 'ar') ? 'اقرأ المزيد' : ((l === 'fa') ? 'ادامه مطلب' : ((l === 'zh') ? '阅读更多' : 'READ MORE'));

      if (existingCard) {
        var existingCat = existingCard.getAttribute('data-cat') || ''; var combinedCat = Array.from(new Set((existingCat + ' ' + dataCat).trim().split(/\s+/))).filter(Boolean).join(' '); existingCard.setAttribute('data-cat', combinedCat);
        existingCard.setAttribute('data-cms-slug', slug);
        var h4El = existingCard.querySelector('h4');
        if (h4El) h4El.textContent = title;
        var pEl = existingCard.querySelector('p');
        if (pEl && ld.excerpt) pEl.textContent = ld.excerpt;
        var existingImgEl = existingCard.querySelector('img');
        if (existingImgEl && b.featured_img) existingImgEl.src = normalizeImageUrl(b.featured_img);
        var rm = existingCard.querySelector('a[onclick*="openBlogDetailBySlug"]');
        if (rm) rm.textContent = readMoreLabel;
      } else {
        var articleEl = document.createElement('article');
        articleEl.className = 'space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog';
        articleEl.setAttribute('data-cms-blog-id', b.id);
        articleEl.setAttribute('data-cms-slug', slug);
        articleEl.setAttribute('data-cat', dataCat);
        articleEl.style.display = 'flex';
        articleEl.setAttribute('data-paginated', 'true');

        var cleanImg = normalizeImageUrl(b.featured_img);

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
          readMoreLabel +
          '</a>';

        grid.prepend(articleEl);
      }
    });

    if (typeof window.initPagination === 'function') {
      window.initPagination();
    }
  }

  /* ── Homepage Blog Carousel Hydration ─────────────────── */
  function formatBlogDate(raw) {
    if (!raw) return 'Oct 04, 2026';
    try {
      var parts = String(raw).split('-');
      if (parts.length === 3) {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return months[mIdx] + ' ' + parts[2] + ', ' + parts[0];
        }
      }
    } catch (e) {}
    return raw;
  }

  function hydrateHomepageBlogs(l) {
    var slider = document.getElementById('blog-slider-inner');
    if (!slider) return;

    // Enable smooth native scroll behavior on the slider container
    try {
      slider.style.overflowX = 'auto';
      slider.style.scrollbarWidth = 'none';
      slider.style.msOverflowStyle = 'none';
      if (!document.getElementById('hide-blog-slider-scrollbar-style')) {
        var st = document.createElement('style');
        st.id = 'hide-blog-slider-scrollbar-style';
        st.textContent = '#blog-slider-inner::-webkit-scrollbar { display: none !important; }';
        document.head.appendChild(st);
      }
    } catch (e) {}

    var blogs = (_data && _data.sgcms_blog) || [];
    if (!Array.isArray(blogs) || !blogs.length) {
      try {
        var rawLocal = localStorage.getItem('sgcms_blog_live');
        if (rawLocal) {
          var parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal) && parsedLocal.length) blogs = parsedLocal;
        }
      } catch (e) {}
    }
    if (!Array.isArray(blogs) || !blogs.length) return;

    var readMoreText = (l === 'ar') ? 'اقرأ المزيد' : ((l === 'fa') ? 'ادامه مطلب' : ((l === 'zh') ? '阅读更多' : 'Read More'));

    // Filter published blogs
    var publishedBlogs = blogs.filter(function(b) {
      if (!b) return false;
      var status = (b['status_' + l] || b.status_en || b.status || (b.en && b.en.status) || 'published').toLowerCase();
      return (status !== 'draft' && status !== 'hidden');
    });

    if (!publishedBlogs.length) return;

    // Prepend new blogs (newest first: iterate reversed so the first blog ends up at index 0)
    publishedBlogs.slice().reverse().forEach(function(b) {
      var ld = b[l] || b.en || b;
      var title = (ld && ld.title) || (b.en && b.en.title) || b.title || '';
      if (!title || isCorrupted(title)) {
        if (b.en && b.en.title && !isCorrupted(b.en.title)) title = b.en.title;
        else if (b.title && !isCorrupted(b.title)) title = b.title;
      }
      if (!title) return;
      if (/^read\s+full\s+guide/i.test(title.trim())) {
        if (b.en && b.en.title && !/^read\s+full\s+guide/i.test(b.en.title.trim())) {
          title = b.en.title;
        } else if (b.slug) {
          title = b.slug.replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
        }
      }

      var slug = b.slug || (b.en && b.en.slug) || (ld && ld.slug) || b.id;
      var excerpt = (ld && ld.excerpt) || (b.en && b.en.excerpt) || b.excerpt || '';
      if (!excerpt) {
        var rawBody = (ld && ld.body) || (b.en && b.en.body) || b.body || '';
        if (rawBody) {
          var cleanText = rawBody.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanText) {
            excerpt = cleanText.substring(0, 140) + (cleanText.length > 140 ? '...' : '');
          }
        }
      }

      var cleanImg = normalizeImageUrl(b.featured_img);
      var catBadge = b.subcategory ? b.subcategory.toUpperCase().replace(/-/g, ' ') : (b.category ? b.category.toUpperCase() : 'INSIGHTS');
      var blogUrl = '/' + (l !== 'en' ? l + '/' : '') + 'blog/' + slug + '/';
      var dateStr = formatBlogDate(b.publish_date || '2026-10-01');

      // Check if dynamic card already exists
      var existing = slider.querySelector('[data-cms-blog-id="' + b.id + '"], [data-cms-slug="' + slug + '"]');
      if (existing) {
        var h3Link = existing.querySelector('h3 a') || existing.querySelector('h3');
        if (h3Link) {
          h3Link.textContent = title;
          if (h3Link.tagName.toLowerCase() === 'a') {
            h3Link.setAttribute('href', blogUrl);
          } else {
            var inA = h3Link.querySelector('a');
            if (inA) {
              inA.textContent = title;
              inA.setAttribute('href', blogUrl);
            }
          }
        }
        var p = existing.querySelector('p');
        if (p && excerpt) p.textContent = excerpt;
        var img = existing.querySelector('img');
        if (img && cleanImg) {
          img.src = cleanImg;
          var imgLink = img.closest('a');
          if (imgLink) imgLink.setAttribute('href', blogUrl);
        }
        var badge = existing.querySelector('.relative span');
        if (badge && catBadge) badge.textContent = catBadge;
        var dateEl = existing.querySelector('.text-\\[10px\\]');
        if (dateEl) dateEl.innerHTML = '<i class="fa-regular fa-calendar mr-1"></i> ' + dateStr;
        var rm = existing.querySelector('[data-home-read-more], .home-blog-read-more, div.px-6.pb-6 a');
        if (rm && rm !== h3Link) {
          rm.setAttribute('href', blogUrl);
          var sp = rm.querySelector('span');
          if (sp) sp.textContent = readMoreText;
        }
        return;
      }

      // Check if static card with this slug exists
      var staticCards = slider.querySelectorAll('h3 a');
      var foundStatic = null;
      for (var scIdx = 0; scIdx < staticCards.length; scIdx++) {
        var scLink = staticCards[scIdx];
        if (scLink.getAttribute('href') && scLink.getAttribute('href').indexOf(slug) !== -1) {
          foundStatic = scLink.closest('.bg-neutral-900') || scLink.parentElement.parentElement.parentElement;
          break;
        }
      }
      if (foundStatic) {
        foundStatic.setAttribute('data-cms-blog-id', b.id);
        foundStatic.setAttribute('data-cms-slug', slug);
        var staticH3Link = foundStatic.querySelector('h3 a') || foundStatic.querySelector('h3');
        if (staticH3Link) {
          staticH3Link.textContent = title;
          if (staticH3Link.tagName.toLowerCase() === 'a') {
            staticH3Link.setAttribute('href', blogUrl);
          } else {
            var stA = staticH3Link.querySelector('a');
            if (stA) {
              stA.textContent = title;
              stA.setAttribute('href', blogUrl);
            }
          }
        }
        var staticP = foundStatic.querySelector('p');
        if (staticP && excerpt) staticP.textContent = excerpt;
        var staticImg = foundStatic.querySelector('img');
        if (staticImg && cleanImg) staticImg.src = cleanImg;
        return;
      }

      // Create new dynamic card matching the exact homepage luxury dark styling
      var card = document.createElement('div');
      card.className = 'bg-neutral-900 rounded-[2rem] border border-luxury-gold/30 overflow-hidden shadow-xl flex flex-col justify-between hover:shadow-[0_0_25px_rgba(197,168,128,0.4)] transition duration-500 min-w-[320px] max-w-[320px] shrink-0 group dynamic-home-blog';
      card.setAttribute('data-cms-blog-id', b.id);
      card.setAttribute('data-cms-slug', slug);

      card.innerHTML =
        '<div>' +
          '<div class="relative aspect-[16/10] overflow-hidden">' +
            '<img alt="' + title.replace(/"/g, '&quot;') + '" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="' + cleanImg + '" onerror="this.onerror=null;this.src=\'/assets/images/dubai-office-2.webp\'" loading="lazy" decoding="async"/>' +
            '<div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>' +
            '<span class="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-luxury-gold border border-luxury-gold/30 rounded-full">' + catBadge + '</span>' +
          '</div>' +
          '<div class="p-6 space-y-2.5 text-left">' +
            '<span class="text-[10px] text-luxury-gold font-bold uppercase tracking-widest"><i class="fa-regular fa-calendar mr-1"></i> ' + dateStr + '</span>' +
            '<h3 class="font-serif font-bold text-white text-base group-hover:text-luxury-gold transition leading-snug">' +
              '<a href="' + blogUrl + '">' + title + '</a>' +
            '</h3>' +
            '<p class="text-xs text-neutral-300 leading-relaxed font-light line-clamp-3">' + excerpt + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="px-6 pb-6 pt-0 text-left">' +
          '<a class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-luxury-gold font-bold group-hover:text-white transition home-blog-read-more" data-home-read-more="true" href="' + blogUrl + '">' +
            '<span>' + readMoreText + '</span> <i class="fa-solid fa-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-1"></i>' +
          '</a>' +
        '</div>';

      slider.prepend(card);
    });
    try {
      var allCards = slider.querySelectorAll('.premium-hover, .bg-white.rounded-3xl');
      allCards.forEach(function(c) {
        if (c.getAttribute('data-clickable-initialized')) return;
        c.setAttribute('data-clickable-initialized', 'true');
        c.style.cursor = 'pointer';
        c.addEventListener('click', function(e) {
          if (e.target.closest('a') || e.target.closest('button')) return;
          var a = c.querySelector('h4 a, a.program-blog-read-more, a[data-program-read-more]');
          if (a && a.href) {
            window.location.href = a.href;
          }
        });
      });
    } catch(e) {}
  }

  /* ── Program / Service Pages Blog Carousel Hydration ── */
  function hydrateProgramPageBlogs(l) {
    var slider = document.getElementById('dominica-blog-slider-inner');
    if (!slider) return;

    var path = window.location.pathname.toLowerCase();
    var pageKey = '';
    var isCitizenship = false;
    var isResidency = false;

    if (path.indexOf('dominica') !== -1) { pageKey = 'dominica'; isCitizenship = true; }
    else if (path.indexOf('stkitts') !== -1 || path.indexOf('st-kitts') !== -1) { pageKey = 'stkitts'; isCitizenship = true; }
    else if (path.indexOf('grenada') !== -1) { pageKey = 'grenada'; isCitizenship = true; }
    else if (path.indexOf('stlucia') !== -1 || path.indexOf('saint-lucia') !== -1) { pageKey = 'stlucia'; isCitizenship = true; }
    else if (path.indexOf('antigua') !== -1) { pageKey = 'antiguaandbarbuda'; isCitizenship = true; }
    else if (path.indexOf('vanuatu') !== -1) { pageKey = 'vanuatu'; isCitizenship = true; }
    else if (path.indexOf('sao-tome') !== -1) { pageKey = 'sao-tome-and-principe'; isCitizenship = true; }
    else if (path.indexOf('nauru') !== -1) { pageKey = 'nauru'; isCitizenship = true; }
    else if (path.indexOf('/uae') !== -1) { pageKey = 'uae'; isResidency = true; }
    else if (path.indexOf('portugal') !== -1) { pageKey = 'portugal'; isResidency = true; }
    else if (path.indexOf('greece') !== -1) { pageKey = 'greece'; isResidency = true; }
    else if (path.indexOf('panama') !== -1) { pageKey = 'panama'; isResidency = true; }
    else if (path.indexOf('realestate') !== -1 || path.indexOf('real-estate') !== -1) { pageKey = 'realestate'; }
    else if (path.indexOf('educationaladvisory') !== -1 || path.indexOf('educational') !== -1) { pageKey = 'educationaladvisory'; }

    if (!pageKey) return;

    var blogs = (_data && _data.sgcms_blog) || [];
    if (!Array.isArray(blogs) || !blogs.length) {
      try {
        var rawLocal = localStorage.getItem('sgcms_blog_live');
        if (rawLocal) {
          var parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal) && parsedLocal.length) blogs = parsedLocal;
        }
      } catch (e) {}
    }
    if (!Array.isArray(blogs) || !blogs.length) return;

    var readMoreLabel = (l === 'ar') ? 'اقرأ الدليل الكامل' : ((l === 'fa') ? 'مشاهده راهنمای کامل' : ((l === 'zh') ? '阅读完整指南' : 'Read Full Guide'));

    // Filter matching blogs
    var matchedBlogs = blogs.filter(function(b) {
      if (!b) return false;
      var status = (b['status_' + l] || b.status_en || b.status || (b.en && b.en.status) || 'published').toLowerCase();
      if (status === 'draft' || status === 'hidden' || status !== 'published') return false;

      // 1. Check target_programs array (explicit targets selected in CMS)
      if (Array.isArray(b.target_programs) && b.target_programs.length) {
        for (var i = 0; i < b.target_programs.length; i++) {
          var tp = (b.target_programs[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          var pk = pageKey.replace(/[^a-z0-9]/g, '');
          if (tp === pk || (pk && tp.indexOf(pk) !== -1) || (tp && pk.indexOf(tp) !== -1)) return true;
          if (tp === 'citizenship' || tp === 'allcitizenship') {
            if (isCitizenship) return true;
          }
          if (tp === 'residency' || tp === 'allresidency') {
            if (isResidency) return true;
          }
        }
      }

      // 2. Check subcategory
      if (b.subcategory) {
        var sc = (b.subcategory || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        var pk = pageKey.replace(/[^a-z0-9]/g, '');
        if (sc === pk || (pk && sc.indexOf(pk) !== -1) || (sc && pk.indexOf(sc) !== -1)) return true;
      }

      // 3. Check tags
      if (Array.isArray(b.tags)) {
        for (var t = 0; t < b.tags.length; t++) {
          var tag = (b.tags[t] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          var pk = pageKey.replace(/[^a-z0-9]/g, '');
          if (tag === pk) return true;
        }
      }

      // 4. Fallback: Category match for standalone pages (Real Estate, Educational Advisory)
      if (pageKey === 'realestate' && (b.category || '').toLowerCase().indexOf('estate') !== -1) return true;
      if (pageKey === 'educationaladvisory' && (b.category || '').toLowerCase().indexOf('educat') !== -1) return true;

      return false;
    });

    if (!matchedBlogs.length) return;

    // Prepend matched blogs to the slider (newest first)
    matchedBlogs.forEach(function(b) {
      var ld = b[l] || b.en || b;
      var title = (ld && ld.title) || (b.en && b.en.title) || b.title || '';
      if (!title || isCorrupted(title)) {
        if (b.en && b.en.title && !isCorrupted(b.en.title)) title = b.en.title;
        else if (b.title && !isCorrupted(b.title)) title = b.title;
      }
      if (!title) return;
      // Guard against title being accidentally saved as "Read Full Guide"
      if (/^read\s+full\s+guide/i.test(title.trim())) {
        if (b.en && b.en.title && !/^read\s+full\s+guide/i.test(b.en.title.trim())) {
          title = b.en.title;
        } else if (b.slug) {
          title = b.slug.replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
        }
      }

      var slug = b.slug || (b.en && b.en.slug) || (ld && ld.slug) || b.id;
      var excerpt = (ld && ld.excerpt) || (b.en && b.en.excerpt) || b.excerpt || '';
      if (!excerpt) {
        var rawBody = (ld && ld.body) || (b.en && b.en.body) || b.body || '';
        if (rawBody) {
          var cleanText = rawBody.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanText) {
            excerpt = cleanText.substring(0, 130) + (cleanText.length > 130 ? '...' : '');
          }
        }
      }

      var cleanImg = normalizeImageUrl(b.featured_img);
      var catBadge = b.subcategory ? b.subcategory.toUpperCase().replace(/-/g, ' ') : (b.category || 'INSIGHTS');
      var blogUrl = '/' + (l !== 'en' ? l + '/' : '') + 'blog/' + slug + '/';
      var dateStr = b.publish_date || '2026-09-01';

      // Check if dynamic card already exists
      var existing = slider.querySelector('[data-cms-blog-id="' + b.id + '"], [data-cms-slug="' + slug + '"]');
      if (existing) {
        var h4Link = existing.querySelector('h4 a');
        if (h4Link) {
          h4Link.textContent = title;
          h4Link.setAttribute('href', blogUrl);
        } else {
          var h4 = existing.querySelector('h4');
          if (h4) {
            h4.innerHTML = '<a href="' + blogUrl + '">' + title + '</a>';
          }
        }
        var p = existing.querySelector('p');
        if (p && excerpt) p.textContent = excerpt;
        var img = existing.querySelector('img');
        if (img && cleanImg) {
          img.src = cleanImg;
          var imgLink = img.closest('a');
          if (imgLink) imgLink.setAttribute('href', blogUrl);
        }
        // Target ONLY the bottom Read More button, never the title link!
        var rm = existing.querySelector('[data-program-read-more], .program-blog-read-more, div.px-6.pb-6 a');
        if (rm && rm !== h4Link) {
          rm.setAttribute('href', blogUrl);
          rm.textContent = readMoreLabel + ' →';
        }
        return;
      }

      // Check if static card with this slug exists
      var staticCards = slider.querySelectorAll('h4 a');
      var foundStatic = null;
      for (var scIdx = 0; scIdx < staticCards.length; scIdx++) {
        var scLink = staticCards[scIdx];
        if (scLink.getAttribute('href') && scLink.getAttribute('href').indexOf(slug) !== -1) {
          foundStatic = scLink.closest('.bg-white') || scLink.parentElement.parentElement.parentElement;
          break;
        }
      }
      if (foundStatic) {
        foundStatic.setAttribute('data-cms-blog-id', b.id);
        foundStatic.setAttribute('data-cms-slug', slug);
        var staticH4Link = foundStatic.querySelector('h4 a');
        if (staticH4Link) {
          staticH4Link.textContent = title;
          staticH4Link.setAttribute('href', blogUrl);
        } else {
          var staticH4 = foundStatic.querySelector('h4');
          if (staticH4) {
            staticH4.innerHTML = '<a href="' + blogUrl + '">' + title + '</a>';
          }
        }
        var p = foundStatic.querySelector('p');
        if (p && excerpt) p.textContent = excerpt;
        var img = foundStatic.querySelector('img');
        if (img && cleanImg) {
          img.src = cleanImg;
          var staticImgLink = img.closest('a');
          if (staticImgLink) staticImgLink.setAttribute('href', blogUrl);
        }
        var staticRm = foundStatic.querySelector('[data-program-read-more], .program-blog-read-more, div.px-6.pb-6 a');
        if (staticRm && staticRm !== staticH4Link) {
          staticRm.setAttribute('href', blogUrl);
          staticRm.textContent = readMoreLabel + ' →';
        }
        return;
      }

      // Create new dynamic card matching the exact luxury styling of program pages
      var card = document.createElement('div');
      card.className = 'bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 premium-hover dynamic-program-blog';
      card.setAttribute('data-cms-blog-id', b.id);
      card.setAttribute('data-cms-slug', slug);

      card.innerHTML =
        '<div>' +
          '<div class="relative h-48 overflow-hidden bg-neutral-900">' +
            '<a href="' + blogUrl + '" class="block w-full h-full">' +
              '<img alt="' + title.replace(/"/g, '&quot;') + '" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="' + cleanImg + '" onerror="this.onerror=null;this.src=\'/assets/images/dubai-office-2.webp\'" />' +
            '</a>' +
            '<span class="absolute top-4 left-4 px-3 py-1 bg-neutral-900/90 backdrop-blur text-[9px] font-bold uppercase tracking-widest text-luxury-gold rounded-full border border-luxury-gold/30 pointer-events-none">' + catBadge + '</span>' +
          '</div>' +
          '<div class="p-6 space-y-2 text-left">' +
            '<span class="text-[10px] text-neutral-400 font-bold block">' + dateStr + '</span>' +
            '<h4 class="font-serif font-bold text-lg text-neutral-900 hover:text-luxury-gold transition-colors leading-snug">' +
              '<a href="' + blogUrl + '">' + title + '</a>' +
            '</h4>' +
            '<p class="text-xs text-neutral-600 font-light leading-relaxed">' + excerpt + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="px-6 pb-6 pt-2 text-left">' +
          '<a class="text-xs font-bold uppercase tracking-wider text-[#786142] border-b border-[#786142] hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 inline-block program-blog-read-more" data-program-read-more="true" href="' + blogUrl + '">' +
            readMoreLabel + ' →' +
          '</a>' +
        '</div>';

      slider.prepend(card);
    });
    try {
      var allCards = slider.querySelectorAll('.premium-hover, .bg-white.rounded-3xl');
      allCards.forEach(function(c) {
        if (c.getAttribute('data-clickable-initialized')) return;
        c.setAttribute('data-clickable-initialized', 'true');
        c.style.cursor = 'pointer';
        c.addEventListener('click', function(e) {
          if (e.target.closest('a') || e.target.closest('button')) return;
          var a = c.querySelector('h4 a, a.program-blog-read-more, a[data-program-read-more]');
          if (a && a.href) {
            window.location.href = a.href;
          }
        });
      });
    } catch(e) {}
  }

  /* ── Main Hydration Router ──────────────────────── */
  function runHydration(lang) {
    if (!_data) {
      try {
        var rawLocal = localStorage.getItem('sgcms_blog_live');
        if (rawLocal) {
          _data = { sgcms_blog: JSON.parse(rawLocal) };
        }
      } catch (e) {}
    }
    if (!_data) return;
    var l = lang || getLang();
    var path = window.location.pathname.toLowerCase();

    var isHome = (
      path === '/' ||
      path === '/index.html' ||
      path.match(/^\/(en|ar|fa|zh)\/?$/) ||
      (!path.match(/\/citizenship|\/residency|\/programs|\/about|\/contact|\/blog|\/cookie|\/eligibility|\/realestate|\/educational|\/privacy|\/term|\/social|\/ali-sharif/))
    );

    if (isHome || document.getElementById('blog-slider-inner')) {
      hydrateHomepage(l);
      hydrateHomepageBlogs(l);
    } else if (path.indexOf('/about') !== -1 && path.indexOf('/programs') === -1) {
      hydrateAboutUs(l);
    } else if (path.indexOf('/contact') !== -1) {
      hydrateContact(l);
    } else if (path.indexOf('/blog') !== -1) {
      hydrateBlog(l);
    }

    // Program pages or any page containing an insights/blog carousel
    hydrateProgramPageBlogs(l);

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

  /* ── Instant 0ms Pre-Hydration from Local Live Store ───────────────── */
  try {
    var cachedLiveBlogs = localStorage.getItem('sgcms_blog_live');
    if (cachedLiveBlogs) {
      var parsedBlogs = JSON.parse(cachedLiveBlogs);
      if (Array.isArray(parsedBlogs) && parsedBlogs.length) {
        if (!_data) _data = {};
        _data.sgcms_blog = parsedBlogs;
        runHydration(getLang());
      }
    }
  } catch (e) {}

  /* ── Cross-Tab Real-Time Sync (0ms latency across tabs & iframe) ───── */
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      var bc = new BroadcastChannel('sgcms_blog_channel');
      bc.onmessage = function (ev) {
        if (ev && ev.data && ev.data.type === 'BLOGS_UPDATED' && Array.isArray(ev.data.blogs)) {
          if (!_data) _data = {};
          _data.sgcms_blog = ev.data.blogs;
          try {
            localStorage.setItem('sgcms_blog_live', JSON.stringify(ev.data.blogs));
          } catch (e) {}
          var curL = getLang();
          runHydration(curL);
          if (document.getElementById('blog-slider-inner')) hydrateHomepageBlogs(curL);
          if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
          if (typeof window.handleDirectArticleRoute === 'function') window.handleDirectArticleRoute();
        }
      };
    }
  } catch (e) {}

  window.addEventListener('storage', function (e) {
    if (e.key === 'sgcms_blog_live' && e.newValue) {
      try {
        var updated = JSON.parse(e.newValue);
        if (Array.isArray(updated) && updated.length) {
          if (!_data) _data = {};
          _data.sgcms_blog = updated;
          var curL = getLang();
          runHydration(curL);
          if (document.getElementById('blog-slider-inner')) hydrateHomepageBlogs(curL);
          if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
        }
      } catch (err) {}
    }
  });

  window.addEventListener('message', function (ev) {
    if (ev && ev.data && ev.data.type === 'CMS_BLOGS_LIVE_UPDATED' && Array.isArray(ev.data.blogs)) {
      if (!_data) _data = {};
      _data.sgcms_blog = ev.data.blogs;
      try {
        localStorage.setItem('sgcms_blog_live', JSON.stringify(ev.data.blogs));
      } catch (e) {}
      var curL = getLang();
      runHydration(curL);
      if (document.getElementById('blog-slider-inner')) hydrateHomepageBlogs(curL);
      if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
    }
  });

  /* ── Fetch published_content.json from Server ───────────────── */
  function fetchAndApply() {
    var primaryUrl = (window.location.pathname.indexOf('/blog') !== -1 || window.location.pathname.indexOf('/programs') !== -1)
      ? '/admin/api/published_content.json?v=' + Date.now()
      : 'admin/api/published_content.json?v=' + Date.now();

    var candidates = [
      primaryUrl,
      '/admin/api/published_content.json?v=' + Date.now(),
      '/admin/api/content.php?mode=live&v=' + Date.now(),
      '../admin/api/published_content.json?v=' + Date.now(),
      '../../admin/api/published_content.json?v=' + Date.now()
    ];
    var idx = 0;

    function tryNext() {
      if (idx >= candidates.length) {
        runHydration();
        return;
      }
      var url = candidates[idx++];
      fetch(url, { cache: 'no-store' })
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

          // Cache published blog data into localStorage live cache
          try {
            if (Array.isArray(json.sgcms_blog) && json.sgcms_blog.length) {
              localStorage.setItem('sgcms_blog_live', JSON.stringify(json.sgcms_blog));
              if (window.location.pathname.toLowerCase().indexOf('/blog') !== -1) {
                var lang = getLang();
                setTimeout(function () {
                  hydrateBlog(lang);
                  if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
                  if (typeof window.handleDirectArticleRoute === 'function') {
                    window.handleDirectArticleRoute();
                  }
                }, 50);
              } else if (document.getElementById('blog-slider-inner')) {
                var lang = getLang();
                setTimeout(function () {
                  hydrateHomepageBlogs(lang);
                }, 50);
              } else if (document.getElementById('dominica-blog-slider-inner')) {
                var lang = getLang();
                setTimeout(function () {
                  hydrateProgramPageBlogs(lang);
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

  /* ── 0ms Instant Boot Hydration from Local Live Store ──────── */
  try {
    var rawLocal = localStorage.getItem('sgcms_blog_live');
    if (rawLocal) {
      var cachedBlogs = JSON.parse(rawLocal);
      if (Array.isArray(cachedBlogs) && cachedBlogs.length) {
        _data = _data || {};
        _data.sgcms_blog = cachedBlogs;
        var initLang = getLang();
        if (window.location.pathname.toLowerCase().indexOf('/blog') !== -1) {
          hydrateBlog(initLang);
        } else if (document.getElementById('blog-slider-inner')) {
          hydrateHomepageBlogs(initLang);
        } else if (document.getElementById('dominica-blog-slider-inner')) {
          hydrateProgramPageBlogs(initLang);
        }
      }
    }
  } catch (e) { }

  /* ── 0ms Real-Time Multi-Tab Broadcast Synchronization ─────── */
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      var bc = new BroadcastChannel('sgcms_blog_channel');
      bc.onmessage = function (e) {
        if (e.data && e.data.blogs && Array.isArray(e.data.blogs)) {
          _data = _data || {};
          _data.sgcms_blog = e.data.blogs;
          try { localStorage.setItem('sgcms_blog_live', JSON.stringify(e.data.blogs)); } catch (err) { }
          var activeLang = getLang();
          if (window.location.pathname.toLowerCase().indexOf('/blog') !== -1) {
            hydrateBlog(activeLang);
            if (typeof window.paginateBlogs === 'function') window.paginateBlogs();
            if (typeof window.handleDirectArticleRoute === 'function') window.handleDirectArticleRoute();
          } else if (document.getElementById('blog-slider-inner')) {
            hydrateHomepageBlogs(activeLang);
          } else if (document.getElementById('dominica-blog-slider-inner')) {
            hydrateProgramPageBlogs(activeLang);
          }
        }
      };
    }
  } catch (e) { }

  window.slideBlogs = function (direction) {
    var inner = document.getElementById('blog-slider-inner');
    if (!inner) return;
    var cardWidth = 344;
    var scrollAmount = cardWidth * 2;
    if (direction === 'right') {
      inner.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      inner.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndApply);
  } else {
    setTimeout(fetchAndApply, 0);
  }
})();
