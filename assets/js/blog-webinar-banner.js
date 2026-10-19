/**
 * Sharif Group - Dynamic Blog Webinar Floating Banner & Reopen Trigger
 * Automatically displays a luxury floating promotional card for webinars
 * that match the topic/country of the current blog article.
 * Sits cleanly above the WhatsApp widget with minimize & reopen support.
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__sgWebinarBannerLoaded) return;
  window.__sgWebinarBannerLoaded = true;

  // Extract current language from URL or html lang attribute
  function getLang() {
    var p = (window.location && window.location.pathname) ? window.location.pathname : '';
    var parts = p.replace(/^\/+/, '').split('/');
    if (['fa', 'ar', 'zh'].indexOf(parts[0]) !== -1) return parts[0];
    var docLang = document.documentElement.lang;
    if (['fa', 'ar', 'zh'].indexOf(docLang) !== -1) return docLang;
    return 'en';
  }

  // Extract current page topic/context (blog slug, country program slug, or category)
  function getPageContext() {
    var path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    path = path.replace(/index\.html$/i, '').replace(/\/+$/, '');
    var parts = path.split('/').filter(Boolean);

    // Strip out language segment if present (fa, ar, zh)
    if (parts.length > 0 && ['fa', 'ar', 'zh'].indexOf(parts[0]) !== -1) {
      parts.shift();
    }

    // Do NOT show on webinars hub or admin studio
    if (path.indexOf('webinar') !== -1 || path.indexOf('admin') !== -1) {
      return null;
    }

    var isBlog = parts.indexOf('blog') !== -1;
    var isProgram = parts.indexOf('programs') !== -1;
    var isCitizenship = path.indexOf('citizenship') !== -1;
    var isResidency = path.indexOf('residency') !== -1;

    // Only run on blog, program, citizenship or residency pages
    if (!isBlog && !isProgram && !isCitizenship && !isResidency) {
      return null;
    }

    // Determine specific program or article slug
    var specificSlug = null;
    if (isBlog) {
      var bIdx = parts.indexOf('blog');
      if (bIdx !== -1 && parts.length > bIdx + 1) {
        specificSlug = parts[bIdx + 1].toLowerCase().trim();
      }
    } else if (isProgram) {
      // e.g. ["programs", "citizenshipbyinvestment", "dominica"]
      if (parts.length >= 3) {
        specificSlug = parts[2].toLowerCase().trim();
      } else if (parts.length >= 2) {
        specificSlug = parts[1].toLowerCase().trim();
      }
    }

    var canonical = document.querySelector('link[rel="canonical"]');
    var canonicalUrl = (canonical && canonical.href) ? canonical.href.toLowerCase() : '';

    var pageText = (
      path + ' ' +
      canonicalUrl + ' ' +
      (specificSlug || '') + ' ' +
      (document.title || '') + ' ' +
      (document.querySelector('meta[name="keywords"]')?.content || '') + ' ' +
      (document.querySelector('meta[name="description"]')?.content || '')
    ).toLowerCase();

    return {
      path: path,
      parts: parts,
      isBlog: isBlog,
      isProgram: isProgram,
      isCitizenship: isCitizenship,
      isResidency: isResidency,
      specificSlug: specificSlug,
      pageText: pageText
    };
  }

  // Translations dictionary for banner UI
  var I18N = {
    en: {
      badge: 'Upcoming Free Webinar',
      cta: 'View Session & Register',
      datePrefix: 'Live Session:',
      closeTitle: 'Minimize webinar banner',
      reopenLabel: 'Live Webinar',
      reopenTitle: 'Open webinar announcement'
    },
    fa: {
      badge: 'وبینار آنلاین رایگان',
      cta: 'مشاهده و ثبت‌نام رایگان',
      datePrefix: 'زمان جلسه:',
      closeTitle: 'کوچک کردن اعلان',
      reopenLabel: 'وبینار آنلاین',
      reopenTitle: 'مشاهده اعلان وبینار'
    },
    ar: {
      badge: 'ندوة مجانية عبر الإنترنت',
      cta: 'عرض الجلسة والتسجيل المجاني',
      datePrefix: 'موعد الجلسة:',
      closeTitle: 'تصغير الإشعار',
      reopenLabel: 'الندوة المباشرة',
      reopenTitle: 'فتح إشعار الندوة'
    },
    zh: {
      badge: '免费线上讲座',
      cta: '查看详情并免费报名',
      datePrefix: '讲座时间：',
      closeTitle: '最小化讲座通知',
      reopenLabel: '线上讲座',
      reopenTitle: '打开讲座通知'
    }
  };

  // Find matching webinar based on page context (country, subcategory, keywords, category)
  function findMatchingWebinar(catalog, ctx) {
    if (!catalog || !catalog.length || !ctx) return null;

    // Prioritize webinars that are open for registration or scheduled
    var list = catalog.slice().sort(function(a, b) {
      if (a.registration_open && !b.registration_open) return -1;
      if (!a.registration_open && b.registration_open) return 1;
      return (a.session_no || 0) - (b.session_no || 0);
    });

    // 1. Direct subcategory / country matching (e.g. Dominica, Grenada, Saint Kitts, Vanuatu, etc.)
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      var subcat = (w.subcategory || '').toLowerCase().trim();
      if (subcat && ctx.pageText.indexOf(subcat) !== -1) {
        return w;
      }
      var wKeywords = (w.slug || '').split('-').filter(function(k) {
        return k.length > 3 && ['second', 'passport', 'introducing', 'pilot', 'programme', 'program', 'questions'].indexOf(k) === -1;
      });
      for (var j = 0; j < wKeywords.length; j++) {
        if (ctx.pageText.indexOf(wKeywords[j]) !== -1) {
          return w;
        }
      }
    }

    // 2. If visitor is on a general Category Hub page (e.g. /citizenshipbyinvestment/ or /residencybyinvestment/)
    // and NOT on a specific country program page (e.g. not /programs/citizenshipbyinvestment/grenada/),
    // match the active webinar belonging to this broad category!
    if (!ctx.specificSlug) {
      for (var k = 0; k < list.length; k++) {
        var cw = list[k];
        var cat = (cw.category || '').toLowerCase().trim();
        if (ctx.isCitizenship && cat === 'citizenship') {
          return cw;
        }
        if (ctx.isResidency && cat === 'residency') {
          return cw;
        }
      }
    }

    return null;
  }

  // Format date helper
  function formatSessionDate(utcStr, lang) {
    try {
      var d = new Date(utcStr);
      var tz = 'Asia/Kabul';
      var loc = { fa: 'fa-AF-u-ca-gregory', ar: 'ar-AE', zh: 'zh-CN', en: 'en-GB' }[lang] || 'en-GB';
      return new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    } catch(e) {
      return '';
    }
  }

  // Inject CSS styles for the floating banner and reopen trigger
  function injectStyles() {
    if (document.getElementById('sg-webinar-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'sg-webinar-banner-styles';
    style.textContent = `
      /* Floating Webinar Card — Positioned above WhatsApp button */
      .sg-wb-banner {
        position: fixed;
        bottom: 104px;
        right: 24px;
        z-index: 9998;
        width: 380px;
        max-width: calc(100vw - 32px);
        background: rgba(7, 14, 26, 0.95);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(197, 168, 128, 0.45);
        border-radius: 24px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(197, 168, 128, 0.28);
        padding: 22px 24px 20px;
        color: #ffffff;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        transform: translateY(35px) scale(0.96);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        direction: ltr;
        text-align: left;
      }
      .sg-wb-banner:hover {
        border-color: #c5a880;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55), 0 0 35px rgba(197, 168, 128, 0.4);
      }
      [dir="rtl"] .sg-wb-banner, html[lang="fa"] .sg-wb-banner, html[lang="ar"] .sg-wb-banner {
        right: 24px;
        direction: rtl;
        text-align: right;
        font-family: 'Vazirmatn', 'Cairo', system-ui, sans-serif;
      }
      .sg-wb-banner.sg-wb-visible {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: auto;
      }
      .sg-wb-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .sg-wb-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #c5a880;
      }
      .sg-wb-pulse {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 8px #34d399;
        animation: sgWbPulse 2s infinite;
      }
      @keyframes sgWbPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
      .sg-wb-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 6px;
        transition: color 0.2s, background 0.2s, transform 0.2s;
      }
      .sg-wb-close:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
      }
      /* Bold, clean, solid title */
      .sg-wb-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-style: normal;
        font-weight: 700;
        font-size: 16.5px;
        line-height: 1.4;
        color: #ffffff;
        margin: 0 0 10px;
        letter-spacing: -0.01em;
        transition: color 0.3s ease;
      }
      html[lang="fa"] .sg-wb-title, html[lang="ar"] .sg-wb-title {
        font-family: inherit;
        font-style: normal;
        font-weight: 800;
        font-size: 15.5px;
        line-height: 1.45;
      }
      .sg-wb-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #d1d5db;
        margin-bottom: 16px;
        font-weight: 300;
      }
      .sg-wb-meta i {
        color: #c5a880;
        font-size: 12px;
      }
      .sg-wb-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 13px 18px;
        border-radius: 12px;
        background: #786142;
        color: #ffffff !important;
        font-size: 12.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        text-decoration: none !important;
        transition: all 0.35s ease;
        box-shadow: 0 4px 16px rgba(120, 97, 66, 0.35);
      }
      .sg-wb-btn:hover {
        background: #c5a880;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(197, 168, 128, 0.45);
        color: #ffffff !important;
      }
      .sg-wb-btn-arrow {
        font-size: 11px;
        transition: transform 0.25s ease;
      }
      .sg-wb-btn:hover .sg-wb-btn-arrow {
        transform: translateX(4px);
      }
      [dir="rtl"] .sg-wb-btn:hover .sg-wb-btn-arrow {
        transform: translateX(-4px);
      }

      /* Reopen Trigger Badge — Appears above WhatsApp when banner is closed */
      .sg-wb-reopen-btn {
        position: fixed;
        bottom: 104px;
        right: 24px;
        z-index: 9998;
        height: 46px;
        padding: 0 16px 0 14px;
        border-radius: 9999px;
        background: rgba(7, 14, 26, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1.5px solid #c5a880;
        color: #c5a880;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 20px rgba(197, 168, 128, 0.3);
        cursor: pointer;
        opacity: 0;
        transform: scale(0.85) translateY(10px);
        pointer-events: none;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: inherit;
        user-select: none;
        outline: none;
      }
      [dir="rtl"] .sg-wb-reopen-btn, html[lang="fa"] .sg-wb-reopen-btn, html[lang="ar"] .sg-wb-reopen-btn {
        right: 24px;
        direction: rtl;
      }
      .sg-wb-reopen-btn.sg-wb-reopen-visible {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }
      .sg-wb-reopen-btn:hover {
        background: #c5a880;
        color: #ffffff;
        border-color: #c5a880;
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 12px 32px rgba(197, 168, 128, 0.5);
      }
      .sg-wb-reopen-pulse {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 6px #34d399;
        animation: sgWbPulse 2s infinite;
      }
      .sg-wb-reopen-btn i {
        font-size: 13px;
      }

      @media (max-width: 600px) {
        .sg-wb-banner {
          bottom: 100px;
          right: 16px;
          left: 16px;
          width: auto;
          max-width: none;
          padding: 18px 20px 18px;
          border-radius: 20px;
        }
        [dir="rtl"] .sg-wb-banner, html[lang="fa"] .sg-wb-banner, html[lang="ar"] .sg-wb-banner {
          left: 16px;
          right: 16px;
        }
        .sg-wb-title { font-size: 15px; }
        .sg-wb-reopen-btn {
          bottom: 100px;
          right: 16px;
        }
        [dir="rtl"] .sg-wb-reopen-btn, html[lang="fa"] .sg-wb-reopen-btn, html[lang="ar"] .sg-wb-reopen-btn {
          right: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Build and display the floating banner with reopen trigger
  function showBanner(webinar) {
    if (document.querySelector('.sg-wb-banner')) return;

    var lang = getLang();
    var c = webinar[lang] || webinar.en || {};
    var title = c.title || webinar.slug;
    var tUI = I18N[lang] || I18N.en;

    var dateStr = webinar.start_utc ? formatSessionDate(webinar.start_utc, lang) : '';
    var webinarUrl = (lang === 'en' ? '' : '/' + lang) + '/webinars/' + webinar.slug + '/';

    injectStyles();

    // 1. Create main banner card
    var banner = document.createElement('aside');
    banner.className = 'sg-wb-banner';
    banner.setAttribute('role', 'complementary');
    banner.setAttribute('aria-label', tUI.badge);

    var arrowIcon = (lang === 'fa' || lang === 'ar') ? '←' : '→';

    banner.innerHTML = `
      <div class="sg-wb-top">
        <span class="sg-wb-badge">
          <span class="sg-wb-pulse"></span>
          <span>${tUI.badge}</span>
        </span>
        <button class="sg-wb-close" type="button" aria-label="${tUI.closeTitle}" title="${tUI.closeTitle}">&times;</button>
      </div>
      <h4 class="sg-wb-title">${title}</h4>
      ${dateStr ? `<div class="sg-wb-meta"><i class="fa-regular fa-calendar-check"></i><span>${tUI.datePrefix} ${dateStr}</span></div>` : ''}
      <a class="sg-wb-btn" href="${webinarUrl}">
        <span>${tUI.cta}</span>
        <span class="sg-wb-btn-arrow">${arrowIcon}</span>
      </a>
    `;

    // 2. Create reopen trigger button
    var reopenBtn = document.createElement('button');
    reopenBtn.className = 'sg-wb-reopen-btn';
    reopenBtn.type = 'button';
    reopenBtn.setAttribute('aria-label', tUI.reopenTitle);
    reopenBtn.setAttribute('title', tUI.reopenTitle);
    reopenBtn.innerHTML = `
      <span class="sg-wb-reopen-pulse"></span>
      <i class="fa-solid fa-video"></i>
      <span>${tUI.reopenLabel}</span>
    `;

    document.body.appendChild(banner);
    document.body.appendChild(reopenBtn);

    // Close action: hides banner, shows reopen button
    var closeBtn = banner.querySelector('.sg-wb-close');
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      banner.classList.remove('sg-wb-visible');
      setTimeout(function() {
        reopenBtn.classList.add('sg-wb-reopen-visible');
      }, 250);
    });

    // Reopen action: hides reopen button, shows banner
    reopenBtn.addEventListener('click', function(e) {
      e.preventDefault();
      reopenBtn.classList.remove('sg-wb-reopen-visible');
      setTimeout(function() {
        banner.classList.add('sg-wb-visible');
      }, 200);
    });

    // Animate banner in after 1.5 seconds of reading
    setTimeout(function() {
      banner.classList.add('sg-wb-visible');
    }, 1500);
  }

  // Load webinar catalog and initialize banner matching
  function init() {
    var ctx = getPageContext();
    if (!ctx) return; // Only run on blog, programs, citizenship or residency pages

    function proceed(catalog) {
      if (!catalog || !catalog.length) return;
      var match = findMatchingWebinar(catalog, ctx);
      if (match) {
        showBanner(match);
      }
    }

    // 1. Check if SGCMS_WEBINARS is already in memory
    if (window.SGCMS_WEBINARS && Array.isArray(window.SGCMS_WEBINARS)) {
      proceed(window.SGCMS_WEBINARS);
      return;
    }

    // 2. Check localStorage cache
    try {
      var cached = localStorage.getItem('sgcms_webinars_live') || localStorage.getItem('sgcms_webinars');
      if (cached) {
        var parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          proceed(parsed);
          return;
        }
      }
    } catch(e) {}

    // 3. Dynamically load webinars-data.js script
    var isFile = window.location.protocol === 'file:';
    var scriptPath = isFile ? '../../assets/js/webinars-data.js' : '/assets/js/webinars-data.js';
    if (isFile) {
      var refEl = document.querySelector('script[src*="assets/js/"]') || document.querySelector('link[href*="assets/"]');
      if (refEl) {
        var refStr = refEl.getAttribute('src') || refEl.getAttribute('href') || '';
        var aIdx = refStr.indexOf('assets/');
        if (aIdx !== -1) scriptPath = refStr.substring(0, aIdx) + 'assets/js/webinars-data.js';
      }
    }
    var scr = document.createElement('script');
    scr.src = scriptPath;
    scr.onload = function() {
      if (window.SGCMS_WEBINARS && Array.isArray(window.SGCMS_WEBINARS)) {
        proceed(window.SGCMS_WEBINARS);
      }
    };
    document.head.appendChild(scr);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.initWebinarBlogBanner = init;
})();
