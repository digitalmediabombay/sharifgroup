/**
 * Sharif Group - Dynamic Blog & Program Webinar Floating Banner & Reopen Trigger
 * Automatically displays a luxury floating promotional card for webinars
 * that match the topic/country of the current page.
 * Sits cleanly above the WhatsApp widget with minimize & reopen support.
 * Automatically rotates to the next upcoming session when a session concludes.
 */
(function() {
  'use strict';

  // Prevent duplicate instances
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

  // Known country keyword mapping to ensure strict, accurate matching
  var KNOWN_COUNTRIES = [
    { key: 'dominica', terms: ['dominica'] },
    { key: 'stkitts', terms: ['stkitts', 'st-kitts', 'saint-kitts', 'stkitts-and-nevis', 'saint kitts'] },
    { key: 'antigua', terms: ['antigua', 'antigua-and-barbuda', 'antiguaandbarbuda'] },
    { key: 'grenada', terms: ['grenada'] },
    { key: 'stlucia', terms: ['stlucia', 'st-lucia', 'saint-lucia'] },
    { key: 'vanuatu', terms: ['vanuatu'] },
    { key: 'nauru', terms: ['nauru'] },
    { key: 'sao-tome', terms: ['sao-tome', 'sao tome', 'sao-tome-and-principe'] },
    { key: 'portugal', terms: ['portugal'] },
    { key: 'greece', terms: ['greece'] },
    { key: 'panama', terms: ['panama'] },
    { key: 'uae', terms: ['uae', 'dubai'] }
  ];

  function getCountryKey(str) {
    if (!str) return null;
    str = String(str).toLowerCase();
    for (var i = 0; i < KNOWN_COUNTRIES.length; i++) {
      var kc = KNOWN_COUNTRIES[i];
      for (var j = 0; j < kc.terms.length; j++) {
        if (str.indexOf(kc.terms[j]) !== -1) {
          return kc.key;
        }
      }
    }
    return null;
  }

  // Check if a webinar is genuinely upcoming (has not concluded)
  function isWebinarUpcoming(w, nowMs) {
    if (!w) return false;
    nowMs = nowMs || Date.now();
    
    // Explicitly ended or cancelled status
    if (w.event_status === 'ended' || w.event_status === 'cancelled') {
      return false;
    }

    // Check if start time + duration has passed
    if (w.start_utc) {
      var startMs = new Date(w.start_utc).getTime();
      if (!isNaN(startMs)) {
        var durationMs = ((w.duration_min || 120) * 60 * 1000);
        if (nowMs >= (startMs + durationMs)) {
          return false;
        }
      }
    }

    return true;
  }

  // Extract current page topic/context
  function getPageContext() {
    var path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
    path = path.replace(/index\.html$/i, '').replace(/\/+$/, '');

    // Pages that must NEVER show the promotional webinar popup
    var blacklist = [
      '/admin',
      '/events',
      '/webinars',
      '/partners',
      '/contact',
      '/aboutus',
      '/about-founder',
      '/eligibilitychecker',
      '/socialresponsibility',
      '/privacypolicy',
      '/termsofuse',
      '/cookiepolicy',
      '404'
    ];
    for (var b = 0; b < blacklist.length; b++) {
      if (path.indexOf(blacklist[b]) !== -1) {
        return null;
      }
    }

    var href = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';
    var search = (window.location && window.location.search) ? window.location.search.toLowerCase() : '';
    if (search.indexOf('cms_editor') !== -1 || search.indexOf('cms_preview') !== -1 || href.indexOf('dashboard.html') !== -1) {
      return null;
    }
    if (window.self !== window.top) {
      return null;
    }

    var parts = path.split('/').filter(Boolean);

    // Strip language prefix (fa, ar, zh)
    if (parts.length > 0 && ['fa', 'ar', 'zh'].indexOf(parts[0]) !== -1) {
      parts.shift();
    }

    var isBlog = parts.indexOf('blog') !== -1;
    var isProgram = parts.indexOf('programs') !== -1;
    var isCitizenship = path.indexOf('citizenship') !== -1;
    var isResidency = path.indexOf('residency') !== -1;

    // Only run on blog, programs, citizenship or residency pages
    if (!isBlog && !isProgram && !isCitizenship && !isResidency) {
      return null;
    }

    var specificSlug = null;
    var countryKey = null;

    if (isBlog) {
      var bIdx = parts.indexOf('blog');
      if (bIdx !== -1 && parts.length > bIdx + 1) {
        specificSlug = parts[bIdx + 1].toLowerCase().trim();
        countryKey = getCountryKey(specificSlug) || getCountryKey(document.title);
      }
    } else if (isProgram) {
      // e.g. ["programs", "citizenshipbyinvestment", "dominica"]
      if (parts.length >= 3) {
        specificSlug = parts[2].toLowerCase().trim();
        countryKey = getCountryKey(specificSlug);
      } else if (parts.length >= 2) {
        // e.g. ["programs", "citizenshipbyinvestment"] -> category hub
        specificSlug = null;
      }
    }

    return {
      path: path,
      parts: parts,
      isBlog: isBlog,
      isProgram: isProgram,
      isCitizenship: isCitizenship,
      isResidency: isResidency,
      specificSlug: specificSlug,
      countryKey: countryKey
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

  // Find matching upcoming webinar based on page context
  function findMatchingWebinar(catalog, ctx, nowMs) {
    if (!catalog || !catalog.length || !ctx) return null;
    nowMs = nowMs || Date.now();

    // 1. Filter out all webinars that have ended or passed their duration
    var upcomingList = catalog.filter(function(w) {
      return isWebinarUpcoming(w, nowMs);
    }).sort(function(a, b) {
      // Sort upcoming webinars chronologically
      var tA = a.start_utc ? new Date(a.start_utc).getTime() : 0;
      var tB = b.start_utc ? new Date(b.start_utc).getTime() : 0;
      return tA - tB;
    });

    if (!upcomingList.length) {
      return null; // All events have concluded
    }

    // 2. If page is dedicated to a specific country (Dominica, St. Kitts, etc.)
    if (ctx.countryKey) {
      for (var i = 0; i < upcomingList.length; i++) {
        var w = upcomingList[i];
        var wCountry = getCountryKey(w.subcategory || w.slug);
        if (wCountry === ctx.countryKey) {
          return w;
        }
      }
      // If user is viewing a country program without any upcoming webinar, do not show an unrelated country!
      return null;
    }

    // 3. Category Hub: /programs/citizenshipbyinvestment/ or /citizenshipbyinvestment/
    if (ctx.isCitizenship) {
      for (var j = 0; j < upcomingList.length; j++) {
        var cw = upcomingList[j];
        if ((cw.category || '').toLowerCase() === 'citizenship') {
          return cw;
        }
      }
    }

    // 4. Category Hub: /programs/residencybyinvestment/ or /residencybyinvestment/
    if (ctx.isResidency) {
      for (var k = 0; k < upcomingList.length; k++) {
        var rw = upcomingList[k];
        if ((rw.category || '').toLowerCase() === 'residency') {
          return rw;
        }
      }
    }

    // 5. General Blog Hub (/blog/) or general citizenship blog article
    if (ctx.isBlog) {
      return upcomingList[0];
    }

    return null;
  }

  // Format date helper
  function formatSessionDate(utcStr, lang) {
    try {
      var d = new Date(utcStr);
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

      /* Reopen Trigger Badge — Appears above WhatsApp when banner is minimized */
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
    // If an existing banner is already shown for this webinar, keep it
    var existingBanner = document.querySelector('.sg-wb-banner');
    if (existingBanner) return;

    var lang = getLang();
    var c = webinar[lang] || webinar.en || {};
    var title = c.title || webinar.slug;
    var tUI = I18N[lang] || I18N.en;

    var dateStr = webinar.start_utc ? formatSessionDate(webinar.start_utc, lang) : '';
    // Canonical events path with trailing slash
    var eventUrl = (lang === 'en' ? '' : '/' + lang) + '/events/' + webinar.slug + '/';

    injectStyles();

    // 1. Create main banner card
    var banner = document.createElement('aside');
    banner.className = 'sg-wb-banner';
    banner.setAttribute('role', 'complementary');
    banner.setAttribute('aria-label', tUI.badge);
    banner.setAttribute('data-webinar-slug', webinar.slug);

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
      <a class="sg-wb-btn" href="${eventUrl}">
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

    var dismissalKey = 'sg_dismissed_webinar_' + webinar.slug;

    // Close action: hides banner, saves session dismissal, shows reopen button
    var closeBtn = banner.querySelector('.sg-wb-close');
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      banner.classList.remove('sg-wb-visible');
      try {
        sessionStorage.setItem(dismissalKey, 'true');
      } catch(err) {}
      setTimeout(function() {
        reopenBtn.classList.add('sg-wb-reopen-visible');
      }, 250);
    });

    // Reopen action: hides reopen button, clears session dismissal, shows banner
    reopenBtn.addEventListener('click', function(e) {
      e.preventDefault();
      try {
        sessionStorage.removeItem(dismissalKey);
      } catch(err) {}
      reopenBtn.classList.remove('sg-wb-reopen-visible');
      setTimeout(function() {
        banner.classList.add('sg-wb-visible');
      }, 200);
    });

    // Check if dismissed previously in this session
    var wasDismissed = false;
    try {
      wasDismissed = sessionStorage.getItem(dismissalKey) === 'true';
    } catch(err) {}

    if (wasDismissed) {
      // Show compact reopen trigger pill instead of interrupting
      reopenBtn.classList.add('sg-wb-reopen-visible');
    } else {
      // Animate banner in after 1.5 seconds
      setTimeout(function() {
        banner.classList.add('sg-wb-visible');
      }, 1500);
    }
  }

  // Load webinar catalog and initialize banner matching
  function init() {
    var ctx = getPageContext();
    if (!ctx) {
      // If we are on an excluded page, clean up any lingering banners
      var lingeringBanner = document.querySelector('.sg-wb-banner');
      if (lingeringBanner) lingeringBanner.remove();
      var lingeringReopen = document.querySelector('.sg-wb-reopen-btn');
      if (lingeringReopen) lingeringReopen.remove();
      return;
    }

    function proceed(catalog) {
      if (!catalog || !catalog.length) return;
      var match = findMatchingWebinar(catalog, ctx);
      if (match) {
        showBanner(match);
      } else {
        // If no match found for this page, remove any lingering banner
        var lingeringBanner = document.querySelector('.sg-wb-banner');
        if (lingeringBanner) lingeringBanner.remove();
        var lingeringReopen = document.querySelector('.sg-wb-reopen-btn');
        if (lingeringReopen) lingeringReopen.remove();
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
