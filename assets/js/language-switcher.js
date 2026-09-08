/**
 * Sharif Group Multi-Language & i18n Translation Engine
 * Supported Languages: English (en), Arabic (ar), Persian (fa), Chinese (zh)
 * Includes site-wide Eastern Arabic & Persian Numeral Localization
 */

(function () {
    'use strict';

    var currentLang = 'en';
    var translationsCache = {};
    var isTranslating = false;

    var LANG_CONFIG = {
        'en': { code: 'en', dir: 'ltr', label: 'EN', name: 'English' },
        'ar': { code: 'ar', dir: 'rtl', label: 'العربية', name: 'Arabic' },
        'fa': { code: 'fa', dir: 'rtl', label: 'فارسی', name: 'Persian' },
        'zh': { code: 'zh', dir: 'ltr', label: '中文', name: 'Chinese' }
    };

    var ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    var PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    function localizeNumbers(str, lang) {
        if (!str && str !== 0) return '';
        str = String(str);
        if (lang === 'ar') {
            return str.replace(/[0-9]/g, function (d) { return ARABIC_DIGITS[+d]; });
        }
        if (lang === 'fa') {
            return str.replace(/[0-9]/g, function (d) { return PERSIAN_DIGITS[+d]; });
        }
        // Normalize back to Western digits for EN and ZH
        return str
            .replace(/[٠-٩]/g, function (d) { return ARABIC_DIGITS.indexOf(d); })
            .replace(/[۰-۹]/g, function (d) { return PERSIAN_DIGITS.indexOf(d); });
    }

    window.localizeNumbers = function (str, lang) {
        return localizeNumbers(str, lang || currentLang);
    };

    window.getCurrentLanguage = function () {
        return currentLang;
    };

    function normalizeLang(lang) {
        if (!lang) return 'en';
        var l = String(lang).toLowerCase().trim();
        if (l === 'ar' || l === 'arabic') return 'ar';
        if (l === 'fa' || l === 'persian') return 'fa';
        if (l === 'zh' || l === 'chinese' || l === 'zh-hans' || l === 'zh-cn') return 'zh';
        return 'en';
    }

    function getInitialLang() {
        var urlParams = new URLSearchParams(window.location.search);
        var urlLang = urlParams.get('lang');
        if (urlLang) {
            return normalizeLang(urlLang);
        }

        try {
            var stored = localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang');
            if (stored) {
                return normalizeLang(stored);
            }
        } catch (e) {}

        return 'en';
    }

    function getNestedValue(obj, keyPath) {
        if (!obj || !keyPath) return null;
        var parts = keyPath.split('.');
        var curr = obj;
        for (var i = 0; i < parts.length; i++) {
            if (curr && typeof curr === 'object' && parts[i] in curr) {
                curr = curr[parts[i]];
            } else {
                return null;
            }
        }
        return curr;
    }

    function deepMerge(target, source) {
        if (!source) return target;
        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    function getCandidateUrls(lang) {
        var path = (window.location && window.location.pathname) ? window.location.pathname : '';
        var href = (window.location && window.location.href) ? window.location.href : '';
        var isSub = (path.includes('/') && path.split('/').filter(Boolean).length > 1) ||
                    href.includes('/privacypolicy/') ||
                    href.includes('/cookiepolicy/') ||
                    href.includes('/termsofuse/') ||
                    href.includes('/citizenship/') ||
                    href.includes('/realestate/') ||
                    href.includes('/contact/') ||
                    href.includes('/about/') ||
                    href.includes('/programs/');

        if (isSub) {
            return [
                '../assets/locales/' + lang + '.json',
                '../../assets/locales/' + lang + '.json',
                '../../../assets/locales/' + lang + '.json',
                'assets/locales/' + lang + '.json',
                '/assets/locales/' + lang + '.json'
            ];
        } else {
            return [
                'assets/locales/' + lang + '.json',
                '../assets/locales/' + lang + '.json',
                '../../assets/locales/' + lang + '.json',
                '/assets/locales/' + lang + '.json'
            ];
        }
    }

    function loadTranslation(lang, callback) {
        // If already loaded and has deep content
        if (translationsCache[lang] && (translationsCache[lang].pages || translationsCache[lang].nav)) {
            callback(translationsCache[lang]);
            return;
        }

        // Initialize from in-memory preloaded legal translations if available
        if (window.LEGAL_TRANSLATIONS && window.LEGAL_TRANSLATIONS[lang]) {
            translationsCache[lang] = deepMerge(translationsCache[lang] || {}, JSON.parse(JSON.stringify(window.LEGAL_TRANSLATIONS[lang])));
        }

        // When running under file:// protocol (local file test), fetch() is blocked by CORS policy.
        // If we have bundled translations, apply them immediately.
        var isFileProto = window.location && window.location.protocol === 'file:';
        if (isFileProto && translationsCache[lang]) {
            window.translationsCache = translationsCache;
            callback(translationsCache[lang]);
            return;
        }

        var candidates = getCandidateUrls(lang);
        var index = 0;

        function tryNext() {
            if (index >= candidates.length) {
                if (translationsCache[lang]) {
                    window.translationsCache = translationsCache;
                    callback(translationsCache[lang]);
                    return;
                }
                console.error('[i18n] Failed to load locale for ' + lang + ' from all candidates.');
                return;
            }
            var url = candidates[index++];
            var fetchUrl = url + (url.indexOf('?') === -1 ? '?v=20260909_5' : '&v=20260909_5');
            fetch(fetchUrl, { cache: 'no-cache' })
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(function (data) {
                    translationsCache[lang] = deepMerge(translationsCache[lang] || {}, data);
                    window.translationsCache = translationsCache;
                    callback(translationsCache[lang]);
                })
                .catch(function () {
                    tryNext();
                });
        }

        tryNext();
    }

    function updateLanguageUI(lang) {
        var cfg = LANG_CONFIG[lang] || LANG_CONFIG['en'];

        // Update active desktop button label
        var labelEl = document.getElementById('current-lang-text');
        if (labelEl) {
            labelEl.textContent = cfg.label;
        }

        // Update desktop dropdown menu active classes
        document.querySelectorAll('.lang-option').forEach(function (opt) {
            var optLang = normalizeLang(opt.getAttribute('data-lang'));
            if (optLang === lang) {
                opt.classList.add('active-lang');
            } else {
                opt.classList.remove('active-lang');
            }
        });

        // Update mobile menu buttons active classes
        document.querySelectorAll('.mobile-lang-option').forEach(function (btn) {
            var btnLang = normalizeLang(btn.getAttribute('data-lang'));
            if (btnLang === lang) {
                btn.classList.add('active-lang');
            } else {
                btn.classList.remove('active-lang');
            }
        });
    }

    // Safe full DOM text node digit localization
    function localizeDomNumbers(lang) {
        if (!document.body || typeof document.createTreeWalker !== 'function') return;
        var filterReject = (typeof NodeFilter !== 'undefined' && NodeFilter.FILTER_REJECT) ? NodeFilter.FILTER_REJECT : 2;
        var filterAccept = (typeof NodeFilter !== 'undefined' && NodeFilter.FILTER_ACCEPT) ? NodeFilter.FILTER_ACCEPT : 1;
        var showText = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;

        var walker = document.createTreeWalker(
            document.body,
            showText,
            {
                acceptNode: function (node) {
                    var parent = node.parentElement;
                    if (!parent) return filterReject;
                    var tag = (parent.tagName || '').toLowerCase();
                    if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre' || tag === 'noscript') {
                        return filterReject;
                    }
                    if (parent.closest && parent.closest('i, svg, .fa, [class*="fa-"], a[href^="tel:"], [data-no-localize], script, style, img, picture, video, figure')) {
                        return filterReject;
                    }
                    return filterAccept;
                }
            },
            false
        );

        var node;
        var nodesToUpdate = [];
        while ((node = walker.nextNode())) {
            if (/[0-9٠-٩۰-۹]/.test(node.nodeValue)) {
                nodesToUpdate.push(node);
            }
        }

        nodesToUpdate.forEach(function (n) {
            n.nodeValue = localizeNumbers(n.nodeValue, lang);
        });
    }

    // Number localization for stats counters & numbers in text
    function applyNumberLocalization(lang) {
        // 1. Localize all counter elements
        document.querySelectorAll('.counter-value, .counter-val, .counter-element, [data-target]').forEach(function (el) {
            var currentText = el.textContent.trim();
            if (currentText) {
                el.textContent = localizeNumbers(currentText, lang);
            }
        });

        // 2. Localize specific number-carrying elements if marked
        document.querySelectorAll('[data-i18n-number]').forEach(function (el) {
            var currentText = el.textContent.trim();
            if (currentText) {
                el.textContent = localizeNumbers(currentText, lang);
            }
        });

        // 3. Localize all numbers across entire DOM text nodes
        localizeDomNumbers(lang);
    }

    function applyTranslations(data, lang) {
        if (!data) return;
        var cfg = LANG_CONFIG[lang] || LANG_CONFIG['en'];

        // 1. Set HTML attributes
        document.documentElement.lang = cfg.code;
        document.documentElement.dir = cfg.dir;

        // 2. Set Body Font / Lang classes
        document.body.classList.remove('lang-en', 'lang-ar', 'lang-fa', 'lang-zh');
        document.body.classList.add('lang-' + cfg.code);

        // 3. Update Title & Meta
        var pageTitle = getNestedValue(data, 'pages.privacyPolicy.metaTitle') ||
                        getNestedValue(data, 'pages.cookiePolicy.metaTitle') ||
                        getNestedValue(data, 'pages.termsOfUse.metaTitle') ||
                        (data.meta && data.meta.title);
        if (pageTitle) {
            document.title = pageTitle;
        }
        var pageDesc = getNestedValue(data, 'meta.description') || (data.meta && data.meta.description);
        if (pageDesc) {
            var descMeta = document.querySelector('meta[name="description"]');
            if (descMeta) descMeta.setAttribute('content', pageDesc);
            var ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', pageDesc);
        }

        // 4. Translate textContent for [data-i18n] with number localization
        var i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                var localized = (lang === 'ar' || lang === 'fa') ? localizeNumbers(val, lang) : val;
                var heroGlowChild = el.querySelector('.contact-hero-glow, .dominica-hero-glow, .stlucia-hero-glow');
                if (heroGlowChild && el !== heroGlowChild) {
                    heroGlowChild.textContent = localized;
                } else if (el.querySelector('span[data-i18n]') && el.querySelector('i, svg, [class*="fa-"]')) {
                    // Parent container has icons and a child span with data-i18n: do not wipe out icons!
                    var innerSpan = el.querySelector('span[data-i18n]');
                    if (innerSpan) innerSpan.textContent = localized;
                } else if (el.querySelector('i, svg, [class*="fa-"]') && el.querySelector('span')) {
                    // Parent has icon and inner span: update the span only
                    var targetSpan = el.querySelector('span');
                    if (targetSpan) targetSpan.textContent = localized;
                } else {
                    el.textContent = localized;
                }
            }
        });

        // 5. Translate innerHTML for [data-i18n-html] safely (preserving tag attributes, classes, and URLs)
        var i18nHtmlElements = document.querySelectorAll('[data-i18n-html]');
        i18nHtmlElements.forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                el.innerHTML = val;
            }
        });

        // 6. Translate placeholders for [data-i18n-placeholder]
        var i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
        i18nPlaceholders.forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                el.setAttribute('placeholder', (lang === 'ar' || lang === 'fa') ? localizeNumbers(val, lang) : val);
            }
        });

        // 6b. Ensure footer address is translated across all pages and dynamically loaded footers
        var footerAddressVal = getNestedValue(data, 'footer.address');
        if (footerAddressVal) {
            var localizedFooterAddr = (lang === 'ar' || lang === 'fa') ? localizeNumbers(footerAddressVal, lang) : footerAddressVal;
            document.querySelectorAll('footer p, .footer p').forEach(function (p) {
                if (p.querySelector('.fa-location-dot')) {
                    var span = p.querySelector('span');
                    if (span) {
                        span.textContent = localizedFooterAddr;
                    }
                }
            });
        }

        // 7. Apply number localization to counters and numeric displays across DOM
        applyNumberLocalization(lang);

        // 8. Update UI switcher states
        updateLanguageUI(lang);

        // Dispatch language change event for any custom components
        if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('languageChanged', {
                    detail: { lang: lang, config: cfg, data: data }
                }));
            } catch (e) {}
        }
    }

    // Intercept counter animation updates to format in Arabic / Persian digits
    function setupCounterInterceptor() {
        var counterSelector = '.counter-value, .counter-val, .counter-element, [data-target]';
        var counters = document.querySelectorAll(counterSelector);
        if (!counters.length) return;

        var isUpdating = false;
        var observer = new MutationObserver(function (mutations) {
            if (isUpdating) return;
            if (currentLang !== 'ar' && currentLang !== 'fa') return;
            mutations.forEach(function (mutation) {
                var target = mutation.target.nodeType === 3 ? mutation.target.parentNode : mutation.target;
                if (target && target.matches && target.matches(counterSelector)) {
                    var text = target.textContent;
                    if (/[0-9]/.test(text)) {
                        isUpdating = true;
                        target.textContent = localizeNumbers(text, currentLang);
                        isUpdating = false;
                    }
                }
            });
        });

        counters.forEach(function(c) {
            observer.observe(c, { childList: true, characterData: true, subtree: true });
        });
    }

    window.switchLanguage = function (targetLang) {
        var lang = normalizeLang(targetLang);
        currentLang = lang;

        try {
            localStorage.setItem('sharif_lang', lang);
            localStorage.setItem('sharif_preferred_lang', lang);
        } catch (e) {}

        // Hide dropdown
        var dropdown = document.getElementById('lang-dropdown-menu');
        var arrow = document.getElementById('lang-arrow-icon');
        if (dropdown) dropdown.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';

        // Load & apply
        loadTranslation(lang, function (data) {
            applyTranslations(data, lang);
        });
    };

    window.toggleLangDropdown = function (event) {
        if (event) {
            event.stopPropagation();
        }
        var dropdown = document.getElementById('lang-dropdown-menu');
        var arrow = document.getElementById('lang-arrow-icon');
        if (dropdown) {
            var isClosed = dropdown.classList.contains('hidden');
            if (isClosed) {
                dropdown.classList.remove('hidden');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            } else {
                dropdown.classList.add('hidden');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        var dropdown = document.getElementById('lang-dropdown-menu');
        var trigger = document.getElementById('lang-switcher-btn');
        var arrow = document.getElementById('lang-arrow-icon');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            if (trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var dropdown = document.getElementById('lang-dropdown-menu');
            var arrow = document.getElementById('lang-arrow-icon');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Global RTL-aware carousel navigation for any page with dominica-blog-slider-inner
    var dominicaBlogSliderIndex = 0;
    var dominicaBlogAutoScrollTimer = null;

    function updateDominicaBlogSliderGlobal() {
        var inner = document.getElementById('dominica-blog-slider-inner');
        if (!inner) return;
        var card = inner.querySelector('div');
        if (!card) return;

        var isRTL = document.documentElement.dir === 'rtl';
        var cardWidth = card.offsetWidth + 24;
        var visibleCards = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        var totalCards = inner.children.length;
        var maxIndex = Math.max(totalCards - visibleCards, 0);

        dominicaBlogSliderIndex = Math.max(0, Math.min(dominicaBlogSliderIndex, maxIndex));

        if (isRTL) {
            inner.style.transform = 'translateX(' + (dominicaBlogSliderIndex * cardWidth) + 'px)';
        } else {
            inner.style.transform = 'translateX(-' + (dominicaBlogSliderIndex * cardWidth) + 'px)';
        }
    }

    function nextDominicaBlogAutoGlobal() {
        var inner = document.getElementById('dominica-blog-slider-inner');
        if (!inner) return;
        var visibleCards = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        var totalCards = inner.children.length;
        var maxIndex = Math.max(totalCards - visibleCards, 0);

        if (dominicaBlogSliderIndex >= maxIndex) {
            dominicaBlogSliderIndex = 0;
        } else {
            dominicaBlogSliderIndex++;
        }
        updateDominicaBlogSliderGlobal();
    }

    function startDominicaBlogAutoScrollGlobal() {
        stopDominicaBlogAutoScrollGlobal();
        dominicaBlogAutoScrollTimer = setInterval(nextDominicaBlogAutoGlobal, 3500);
    }

    function stopDominicaBlogAutoScrollGlobal() {
        if (dominicaBlogAutoScrollTimer) {
            clearInterval(dominicaBlogAutoScrollTimer);
            dominicaBlogAutoScrollTimer = null;
        }
    }

    function restartDominicaBlogAutoScrollGlobal() {
        stopDominicaBlogAutoScrollGlobal();
        startDominicaBlogAutoScrollGlobal();
    }

    function setupDominicaBlogHoverPauseGlobal() {
        var container = document.getElementById('sec-dominica-blogs') || document.getElementById('dominica-blog-slider-inner');
        if (!container) return;
        container.addEventListener('mouseenter', stopDominicaBlogAutoScrollGlobal);
        container.addEventListener('mouseleave', startDominicaBlogAutoScrollGlobal);
        container.addEventListener('touchstart', stopDominicaBlogAutoScrollGlobal, { passive: true });
        container.addEventListener('touchend', startDominicaBlogAutoScrollGlobal, { passive: true });
    }

    function slideDominicaBlogsGlobal(direction) {
        var inner = document.getElementById('dominica-blog-slider-inner');
        if (!inner) return;
        var card = inner.querySelector('div');
        if (!card) return;

        var isRTL = document.documentElement.dir === 'rtl';
        var visibleCards = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        var totalCards = inner.children.length;
        var maxIndex = Math.max(totalCards - visibleCards, 0);

        var isNext = isRTL ? (direction === 'left') : (direction === 'right');

        if (isNext) {
            if (dominicaBlogSliderIndex >= maxIndex) {
                dominicaBlogSliderIndex = 0;
            } else {
                dominicaBlogSliderIndex++;
            }
        } else {
            if (dominicaBlogSliderIndex <= 0) {
                dominicaBlogSliderIndex = maxIndex;
            } else {
                dominicaBlogSliderIndex--;
            }
        }

        updateDominicaBlogSliderGlobal();
        restartDominicaBlogAutoScrollGlobal();
    }

    try {
        Object.defineProperty(window, 'slideDominicaBlogs', {
            get: function () { return slideDominicaBlogsGlobal; },
            set: function () {},
            configurable: true
        });
    } catch (e) {
        window.slideDominicaBlogs = slideDominicaBlogsGlobal;
    }

    // Intercept clicks on slider prev/next buttons globally across all pages
    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('button, a') : null;
        if (!btn) return;
        var onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.indexOf('slideDominicaBlogs') !== -1 || btn.id === 'dominica-blog-btn-prev' || btn.id === 'dominica-blog-btn-next') {
            e.preventDefault();
            e.stopImmediatePropagation();
            var dir = (onclickAttr.indexOf("'left'") !== -1 || onclickAttr.indexOf('"left"') !== -1 || btn.id === 'dominica-blog-btn-prev') ? 'left' : 'right';
            slideDominicaBlogsGlobal(dir);
        }
    }, true);

    window.addEventListener('languageChanged', function () {
        dominicaBlogSliderIndex = 0;
        updateDominicaBlogSliderGlobal();
        restartDominicaBlogAutoScrollGlobal();
    });

    window.addEventListener('resize', function () {
        updateDominicaBlogSliderGlobal();
    });

    document.addEventListener('DOMContentLoaded', function () {
        updateDominicaBlogSliderGlobal();
        setupDominicaBlogHoverPauseGlobal();
        startDominicaBlogAutoScrollGlobal();
    });
    updateDominicaBlogSliderGlobal();
    setupDominicaBlogHoverPauseGlobal();
    startDominicaBlogAutoScrollGlobal();

    function init() {
        currentLang = getInitialLang();
        setupCounterInterceptor();
        loadTranslation(currentLang, function (data) {
            applyTranslations(data, currentLang);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

