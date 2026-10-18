/**
 * Sharif Group - Dynamic Blog Webinar Floating Banner
 * Automatically displays a luxury floating promotional card for webinars
 * that match the topic/country of the current blog article.
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

  // Extract current article slug
  function getArticleSlug() {
    var path = (window.location && window.location.pathname) ? window.location.pathname : '';
    path = path.replace(/index\.html$/i, '').replace(/\/+$/, '');
    var parts = path.split('/').filter(Boolean);
    var bIdx = parts.indexOf('blog');
    if (bIdx !== -1 && parts.length > bIdx + 1) {
      var s = parts[bIdx + 1].toLowerCase().trim();
      if (s && s !== 'index' && s !== 'index.html') return s;
    }
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      var m = canonical.href.match(/\/blog\/([a-z0-9-]+)/i);
      if (m && m[1] && m[1] !== 'blog') return m[1].toLowerCase().trim();
    }
    return null;
  }

  // Translations dictionary for banner UI
  var I18N = {
    en: {
      badge: 'Upcoming Free Webinar',
      cta: 'View Session & Register',
      datePrefix: 'Live Session:',
      closeTitle: 'Dismiss notice'
    },
    fa: {
      badge: 'وبینار آنلاین رایگان',
      cta: 'مشاهده و ثبت‌نام رایگان',
      datePrefix: 'زمان جلسه:',
      closeTitle: 'بستن'
    },
    ar: {
      badge: 'ندوة مجانية عبر الإنترنت',
      cta: 'عرض الجلسة والتسجيل المجاني',
      datePrefix: 'موعد الجلسة:',
      closeTitle: 'إغلاق'
    },
    zh: {
      badge: '免费线上讲座',
      cta: '查看详情并免费报名',
      datePrefix: '讲座时间：',
      closeTitle: '关闭'
    }
  };

  // Find matching webinar based on slug and metadata
  function findMatchingWebinar(catalog, slug) {
    if (!catalog || !catalog.length) return null;
    slug = (slug || '').toLowerCase();
    var pageText = (slug + ' ' + document.title + ' ' + (document.querySelector('meta[name="keywords"]')?.content || '')).toLowerCase();

    // Prioritize webinars that are open for registration or scheduled
    var list = catalog.slice().sort(function(a, b) {
      if (a.registration_open && !b.registration_open) return -1;
      if (!a.registration_open && b.registration_open) return 1;
      return (a.session_no || 0) - (b.session_no || 0);
    });

    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      var subcat = (w.subcategory || '').toLowerCase().trim();
      if (subcat && pageText.indexOf(subcat) !== -1) {
        return w;
      }
      var wKeywords = (w.slug || '').split('-').filter(function(k) {
        return k.length > 3 && ['second', 'passport', 'introducing', 'pilot', 'programme', 'program', 'questions'].indexOf(k) === -1;
      });
      for (var j = 0; j < wKeywords.length; j++) {
        if (pageText.indexOf(wKeywords[j]) !== -1) {
          return w;
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

  // Inject CSS styles for the floating banner
  function injectStyles() {
    if (document.getElementById('sg-webinar-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'sg-webinar-banner-styles';
    style.textContent = `
      .sg-wb-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9998;
        width: 380px;
        max-width: calc(100vw - 32px);
        background: rgba(7, 14, 26, 0.94);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid rgba(197, 168, 128, 0.45);
        border-radius: 22px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 30px rgba(197, 168, 128, 0.28);
        padding: 20px 22px 18px;
        color: #ffffff;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        transform: translateY(35px) scale(0.96);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        direction: ltr;
        text-align: left;
      }
      [dir="rtl"] .sg-wb-banner, html[lang="fa"] .sg-wb-banner, html[lang="ar"] .sg-wb-banner {
        right: auto;
        left: 24px;
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
        margin-bottom: 8px;
      }
      .sg-wb-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
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
        font-size: 20px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 6px;
        transition: color 0.2s, background 0.2s;
      }
      .sg-wb-close:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }
      .sg-wb-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-style: italic;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.35;
        color: #ffffff;
        margin: 0 0 8px;
      }
      html[lang="fa"] .sg-wb-title, html[lang="ar"] .sg-wb-title {
        font-family: inherit;
        font-style: normal;
        font-weight: 700;
        font-size: 15px;
      }
      .sg-wb-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #d1d5db;
        margin-bottom: 14px;
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
        padding: 12px 18px;
        border-radius: 12px;
        background: #786142;
        color: #ffffff !important;
        font-size: 12px;
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
      @media (max-width: 480px) {
        .sg-wb-banner {
          bottom: 14px;
          right: 14px;
          left: 14px;
          width: auto;
          max-width: none;
          padding: 16px 18px 16px;
          border-radius: 18px;
        }
        [dir="rtl"] .sg-wb-banner, html[lang="fa"] .sg-wb-banner, html[lang="ar"] .sg-wb-banner {
          left: 14px;
          right: 14px;
        }
        .sg-wb-title { font-size: 14.5px; }
      }
    `;
    document.head.appendChild(style);
  }

  // Build and display the floating banner
  function showBanner(webinar) {
    var lang = getLang();
    var dismissKey = 'sg_dismiss_wb_' + webinar.id;
    if (sessionStorage.getItem(dismissKey)) return;

    var c = webinar[lang] || webinar.en || {};
    var title = c.title || webinar.slug;
    var tUI = I18N[lang] || I18N.en;

    var dateStr = webinar.start_utc ? formatSessionDate(webinar.start_utc, lang) : '';
    var webinarUrl = (lang === 'en' ? '' : '/' + lang) + '/webinars/#/webinars/' + webinar.slug;

    injectStyles();

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

    document.body.appendChild(banner);

    // Bind close button
    var closeBtn = banner.querySelector('.sg-wb-close');
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      sessionStorage.setItem(dismissKey, '1');
      banner.classList.remove('sg-wb-visible');
      setTimeout(function() {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 500);
    });

    // Animate in after 1.5 seconds of reading
    setTimeout(function() {
      banner.classList.add('sg-wb-visible');
    }, 1500);
  }

  // Load webinar catalog and initialize banner matching
  function init() {
    var slug = getArticleSlug();
    if (!slug) return; // Only run on blog post articles

    function proceed(catalog) {
      if (!catalog || !catalog.length) return;
      var match = findMatchingWebinar(catalog, slug);
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
    var scr = document.createElement('script');
    scr.src = isFile ? '../../assets/js/webinars-data.js' : '/assets/js/webinars-data.js';
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
