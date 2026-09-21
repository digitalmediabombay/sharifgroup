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

    function decodeHtmlEntities(str) {
        if (!str || typeof str !== 'string') return str;
        if (str.indexOf('&') === -1) return str;
        var decoded = str;
        while (decoded.indexOf('&amp;') !== -1) {
            decoded = decoded.replace(/&amp;/g, '&');
        }
        return decoded
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#38;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }
    window.decodeHtmlEntities = decodeHtmlEntities;

    window.localizeNumbers = function (str, lang) {
        return localizeNumbers(str, lang || currentLang);
    };

    window.getCurrentLanguage = function () {
        if (!currentLang || currentLang === 'en') {
            var initial = getInitialLang();
            if (initial && initial !== 'en') {
                currentLang = initial;
            }
        }
        return currentLang;
    };

    window.getTranslation = function (keyPath, lang) {
        var l = normalizeLang(lang || currentLang);
        var data = translationsCache[l];
        if (!data) return null;
        return getNestedValue(data, keyPath);
    };

    window.applyTranslationsToElement = function (container, lang) {
        if (!container) return;
        var l = normalizeLang(lang || currentLang);
        var data = translationsCache[l];
        if (!data) return;

        container.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                var localized = (l === 'ar' || l === 'fa') ? localizeNumbers(val, l) : val;
                el.textContent = decodeHtmlEntities(localized);
            }
        });

        container.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                el.innerHTML = val;
            }
        });
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
        // 1. Check clean path prefix: /ar/, /fa/, /zh/, /en/
        var pathname = (window.location && window.location.pathname) ? window.location.pathname : '';
        var segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
            var first = segments[0].toLowerCase();
            if (first === 'ar' || first === 'fa' || first === 'zh' || first === 'en') {
                return first;
            }
        }

        // 2. Check query param: ?lang=ar
        var urlParams = new URLSearchParams(window.location.search);
        var urlLang = urlParams.get('lang');
        if (urlLang) {
            return normalizeLang(urlLang);
        }

        // 3. Check stored preference
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
                    href.includes('/eligibilitychecker') ||
                    href.includes('/privacypolicy/') ||
                    href.includes('/cookiepolicy/') ||
                    href.includes('/termsofuse/') ||
                    href.includes('/citizenship/') ||
                    href.includes('/realestate/') ||
                    href.includes('/contact/') ||
                    href.includes('/about/') ||
                    href.includes('/programs/');

        var isFileProto = window.location && window.location.protocol === 'file:';
        if (!isFileProto && window.location && window.location.origin) {
            return [
                '/assets/locales/' + lang + '.json',
                '../assets/locales/' + lang + '.json',
                '../../assets/locales/' + lang + '.json',
                'assets/locales/' + lang + '.json'
            ];
        }

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

    var I18N_VERSION = '20260921_v18';

    function loadTranslation(lang, callback) {
        var pathname = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
        var href = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';
        var isEligibilityChecker = pathname.includes('/eligibilitychecker') || href.includes('/eligibilitychecker');

        // 1. If already loaded in memory and has deep content
        if (translationsCache[lang] && (translationsCache[lang].pages || translationsCache[lang].nav)) {
            if (!isEligibilityChecker || (translationsCache[lang].pages && translationsCache[lang].pages.eligibilityChecker)) {
                callback(translationsCache[lang]);
                return;
            }
        }

        // 2. Initialize from in-memory preloaded legal translations if available
        if (window.LEGAL_TRANSLATIONS && window.LEGAL_TRANSLATIONS[lang]) {
            translationsCache[lang] = deepMerge(translationsCache[lang] || {}, JSON.parse(JSON.stringify(window.LEGAL_TRANSLATIONS[lang])));
        }

        // Proactively clean any outdated cache that lacks eligibilityChecker translations
        try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var k = localStorage.key(i);
                if (k && k.indexOf('sharif_i18n_') === 0) {
                    try {
                        var d = JSON.parse(localStorage.getItem(k));
                        if (d && (!d.pages || !d.pages.eligibilityChecker)) {
                            localStorage.removeItem(k);
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // 3. Check persistent localStorage cache for instant 0ms zero-network retrieval
        var storageKey = 'sharif_i18n_' + lang + '_' + I18N_VERSION;
        try {
            var cachedJson = localStorage.getItem(storageKey);
            if (cachedJson) {
                var parsedData = JSON.parse(cachedJson);
                if (isEligibilityChecker && (!parsedData.pages || !parsedData.pages.eligibilityChecker)) {
                    // Stale cache missing eligibility checker translations: discard and re-fetch fresh!
                } else if (parsedData && (parsedData.pages || parsedData.nav || parsedData.services || parsedData.footer)) {
                    translationsCache[lang] = deepMerge(translationsCache[lang] || {}, parsedData);
                    window.translationsCache = translationsCache;
                    callback(translationsCache[lang]);
                    return; // Return immediately from browser storage!
                }
            }
        } catch (e) {
            // Storage access blocked or parsing error; continue to fetch
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
                // Safety: remove pending class if load fails
                document.documentElement.classList.remove('i18n-pending');
                return;
            }
            var url = candidates[index++];
            var fetchUrl = url + (url.indexOf('?') === -1 ? '?v=' + I18N_VERSION : '&v=' + I18N_VERSION);
            // Allow browser caching instead of forcing uncached roundtrip on every page
            fetch(fetchUrl, { cache: 'default' })
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(function (data) {
                    translationsCache[lang] = deepMerge(translationsCache[lang] || {}, data);
                    window.translationsCache = translationsCache;

                    // Save to localStorage for instant subsequent loads
                    try {
                        // Purge old versions of this language to keep storage tidy
                        for (var i = localStorage.length - 1; i >= 0; i--) {
                            var k = localStorage.key(i);
                            if (k && k.indexOf('sharif_i18n_' + lang) === 0 && k !== storageKey) {
                                localStorage.removeItem(k);
                            }
                        }
                        localStorage.setItem(storageKey, JSON.stringify(translationsCache[lang]));
                    } catch (err) {
                        // In case of quota limit or private mode, gracefully continue
                    }

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
                    if (parent.closest && parent.closest('i, svg, .fa, [class*="fa-"], a[href^="tel:"], [data-no-localize], input[type="tel"], .custom-select-wrapper, .selected-country-span, [dir="ltr"], script, style, img, picture, video, figure')) {
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

    var PREFERRED_LANG_MAP = {
        'english': { 'en': 'English', 'ar': 'الإنجليزية (English)', 'fa': 'انگلیسی (English)', 'zh': '英语 (English)' },
        'arabic': { 'en': 'Arabic', 'ar': 'العربية', 'fa': 'عربی', 'zh': '阿拉伯语' },
        'russian': { 'en': 'Russian', 'ar': 'الروسية', 'fa': 'روسی', 'zh': '俄语' },
        'french': { 'en': 'French', 'ar': 'الفرنسية', 'fa': 'فرانسوی', 'zh': '法语' },
        'hindi': { 'en': 'Hindi', 'ar': 'الهندية', 'fa': 'هندی', 'zh': '印地语' },
        'urdu': { 'en': 'Urdu', 'ar': 'الأردية', 'fa': 'اردو', 'zh': '乌尔都语' },
        'farsi': { 'en': 'Persian (Farsi)', 'ar': 'الفارسية (فارسی)', 'fa': 'فارسی', 'zh': '波斯语' },
        'spanish': { 'en': 'Spanish', 'ar': 'الإسبانية', 'fa': 'اسپانیایی', 'zh': '西班牙语' }
    };

    var METHOD_OPTIONS_MAP = {
        'phone': { 'en': 'Phone Call', 'ar': 'اتصال هاتفي', 'fa': 'تماس تلفنی', 'zh': '电话沟通' },
        'whatsapp': { 'en': 'WhatsApp', 'ar': 'واتساب', 'fa': 'واتس‌اپ', 'zh': 'WhatsApp' },
        'zoom': { 'en': 'Video Call', 'ar': 'مكالمة فيديو', 'fa': 'تماس تصویری', 'zh': '视频通话' }
    };

    var FORM_PLACEHOLDER_MAP = {
        'firstName': {
            'en': 'John',
            'ar': 'الاسم الأول',
            'fa': 'نام کوچک',
            'zh': '名'
        },
        'lastName': {
            'en': 'Doe',
            'ar': 'اسم العائلة',
            'fa': 'نام خانوادگی',
            'zh': '姓'
        },
        'address': {
            'en': 'Suite, Tower, City, Country',
            'ar': 'الجناح، البرج، المدينة، الدولة',
            'fa': 'ساختمان، شهر، کشور',
            'zh': '套房、大厦、城市、国家'
        },
        'notes': {
            'en': '...Detail any specific family parameters',
            'ar': 'تفاصيل متطلبات العائلة أو أي استفسار خاص...',
            'fa': 'جزئیات شرایط خانواده یا یادداشت‌های خاص...',
            'zh': '填写您的具体家庭需求或咨询细节...'
        }
    };

    var TIMEZONE_FIRST_OPTION = {
        'en': 'Select Time Zone',
        'ar': 'اختر المنطقة الزمنية',
        'fa': 'انتخاب منطقه زمانی',
        'zh': '请选择时区'
    };

    var SELECT_PROGRAM_FIRST_OPTION = {
        'en': 'Select Option',
        'ar': 'اختر البرنامج',
        'fa': 'انتخاب برنامه',
        'zh': '请选择项目'
    };

    var SELECT_SUBPROGRAM_FIRST_OPTION = {
        'en': 'Select Sub-Program',
        'ar': 'اختر المسار الفرعي',
        'fa': 'انتخاب زیربرنامه',
        'zh': '请选择子项目'
    };

    var TARGET_PROGRAM_OPTIONS_MAP = {
        'citizenship': {
            'en': 'Citizenship By Investment',
            'ar': 'الجنسية عن طريق الاستثمار',
            'fa': 'شهروندی از طریق سرمایه‌گذاری',
            'zh': '投资入籍（第二护照）'
        },
        'residency': {
            'en': 'Residency By Investment',
            'ar': 'الإقامة عن طريق الاستثمار',
            'fa': 'اقامت از طریق سرمایه‌گذاری',
            'zh': '投资居留（黄金签证）'
        },
        'real-estate': {
            'en': 'Real Estate',
            'ar': 'الاستثمار العقاري',
            'fa': 'سرمایه‌گذاری املاک',
            'zh': '海外高端房产投资'
        },
        'education': {
            'en': 'Educational Advisory',
            'ar': 'الاستشارات التعليمية',
            'fa': 'مشاوره تحصیلی',
            'zh': '国际名校教育咨询'
        }
    };

    var FORM_LABELS_MAP = {
        'firstName': {
            'en': 'First Name',
            'ar': 'الاسم الأول',
            'fa': 'نام کوچک',
            'zh': '名',
            required: true
        },
        'lastName': {
            'en': 'Last Name',
            'ar': 'اسم العائلة',
            'fa': 'نام خانوادگی',
            'zh': '姓',
            required: true
        },
        'fullName': {
            'en': 'Full Name',
            'ar': 'الاسم الكامل',
            'fa': 'نام و نام خانوادگی',
            'zh': '姓名',
            required: true
        },
        'name': {
            'en': 'Full Name',
            'ar': 'الاسم الكامل',
            'fa': 'نام و نام خانوادگی',
            'zh': '姓名',
            required: true
        },
        'email': {
            'en': 'Email Address',
            'ar': 'البريد الإلكتروني',
            'fa': 'آدرس ایمیل',
            'zh': '电子邮箱',
            required: true
        },
        'phone': {
            'en': 'Phone Number',
            'ar': 'رقم الهاتف',
            'fa': 'شماره تماس',
            'zh': '联系电话',
            required: true
        },
        'targetProgram': {
            'en': 'Program of Choice',
            'ar': 'البرنامج المطلوب',
            'fa': 'انتخاب برنامه',
            'zh': '意向申请项目',
            required: true
        },
        'subProgram': {
            'en': 'Sub-Program Pathway',
            'ar': 'المسار الفرعي',
            'fa': 'انتخاب زیربرنامه',
            'zh': '细分通道选项',
            required: true
        },
        'preferredLanguage': {
            'en': 'Preferred Language',
            'ar': 'لغة التواصل المفضلة',
            'fa': 'زبان مورد نظر',
            'zh': '首选沟通语言',
            required: true
        },
        'preferredDate': {
            'en': 'Preferred Date',
            'ar': 'التاريخ المفضل',
            'fa': 'تاریخ پیشنهادی',
            'zh': '期望沟通日期',
            required: true
        },
        'preferredMethod': {
            'en': 'Preferred Method',
            'ar': 'طريقة التواصل المفضلة',
            'fa': 'روش تماس ترجیحی',
            'zh': '首选联系方式',
            required: true
        },
        'timezone': {
            'en': 'Time Zone',
            'ar': 'المنطقة الزمنية',
            'fa': 'منطقه زمانی',
            'zh': '所在时区',
            required: true
        },
        'address': {
            'en': 'Corporate Physical Address (Optional)',
            'ar': 'العنوان الفعلي للشركة (اختياري)',
            'fa': 'نشانی فیزیکی شرکت (اختیاری)',
            'zh': '公司办公地址（选填）',
            required: false
        },
        'notes': {
            'en': 'Confidential notes (Optional)',
            'ar': 'ملاحظات وتفاصيل سرية (اختياري)',
            'fa': 'یادداشت‌ها و توضیحات محرمانه (اختیاری)',
            'zh': '保密咨询备注与需求（选填）',
            required: false
        }
    };

    var TIMEZONE_OPTIONS_MAP = {
        'UTC-12:00': {
            'en': 'UTC-12:00 (Baker Island)',
            'ar': 'UTC-12:00 (جزيرة بيكر)',
            'fa': 'UTC-12:00 (جزیره بیکر)',
            'zh': 'UTC-12:00 (贝克岛)'
        },
        'UTC-11:00': {
            'en': 'UTC-11:00 (American Samoa, Niue)',
            'ar': 'UTC-11:00 (ساموا الأمريكية، نييوي)',
            'fa': 'UTC-11:00 (ساموآی آمریکا، نیووی)',
            'zh': 'UTC-11:00 (美属萨摩亚、纽埃)'
        },
        'UTC-10:00': {
            'en': 'UTC-10:00 (Hawaii, Cook Islands)',
            'ar': 'UTC-10:00 (هاواي، جزر كوك)',
            'fa': 'UTC-10:00 (هاوایی، جزایر کوک)',
            'zh': 'UTC-10:00 (夏威夷、库克群岛)'
        },
        'UTC-09:30': {
            'en': 'UTC-09:30 (Marquesas Islands)',
            'ar': 'UTC-09:30 (جزر ماركيساس)',
            'fa': 'UTC-09:30 (جزایر مارکیز)',
            'zh': 'UTC-09:30 (马克萨斯群岛)'
        },
        'UTC-09:00': {
            'en': 'UTC-09:00 (Alaska)',
            'ar': 'UTC-09:00 (ألاسكا)',
            'fa': 'UTC-09:00 (آلاسکا)',
            'zh': 'UTC-09:00 (阿拉斯加)'
        },
        'UTC-08:00': {
            'en': 'UTC-08:00 (Pacific Time - US/Canada, Los Angeles)',
            'ar': 'UTC-08:00 (توقيت المحيط الهادئ - لوس أنجلوس)',
            'fa': 'UTC-08:00 (زمان اقیانوس آرام - لس آنجلس)',
            'zh': 'UTC-08:00 (太平洋时间 - 洛杉矶)'
        },
        'UTC-07:00': {
            'en': 'UTC-07:00 (Mountain Time - US/Canada, Denver)',
            'ar': 'UTC-07:00 (التوقيت الجبلي - دنفر)',
            'fa': 'UTC-07:00 (زمان کوهستانی - دنور)',
            'zh': 'UTC-07:00 (山地时间 - 丹佛)'
        },
        'UTC-06:00': {
            'en': 'UTC-06:00 (Central Time - US/Canada, Mexico City)',
            'ar': 'UTC-06:00 (التوقيت المركزي - مكسيكو سيتي)',
            'fa': 'UTC-06:00 (زمان مرکزی - مکزیکوسیتی)',
            'zh': 'UTC-06:00 (中部时间 - 墨西哥城)'
        },
        'UTC-05:00': {
            'en': 'UTC-05:00 (Eastern Time - US/Canada, New York)',
            'ar': 'UTC-05:00 (التوقيت الشرقي - نيويورك)',
            'fa': 'UTC-05:00 (زمان شرقی - نیویورک)',
            'zh': 'UTC-05:00 (东部时间 - 纽约)'
        },
        'UTC-04:00': {
            'en': 'UTC-04:00 (Atlantic Time - Canada, Santiago)',
            'ar': 'UTC-04:00 (توقيت الأطلسي - سانتياغو)',
            'fa': 'UTC-04:00 (زمان اقیانوس اطلس - سانتیاگو)',
            'zh': 'UTC-04:00 (大西洋时间 - 圣地亚哥)'
        },
        'UTC-03:30': {
            'en': 'UTC-03:30 (Newfoundland)',
            'ar': 'UTC-03:30 (نيوفاوندلاند)',
            'fa': 'UTC-03:30 (نیوفاندلند)',
            'zh': 'UTC-03:30 (纽芬兰)'
        },
        'UTC-03:00': {
            'en': 'UTC-03:00 (Buenos Aires, Brasilia)',
            'ar': 'UTC-03:00 (بوينس آيرس، برازيليا)',
            'fa': 'UTC-03:00 (بوئنوس آیرس، برازیلیا)',
            'zh': 'UTC-03:00 (布宜诺斯艾利斯、巴西利亚)'
        },
        'UTC-02:00': {
            'en': 'UTC-02:00 (South Georgia/Sandwich Islands)',
            'ar': 'UTC-02:00 (جورجيا الجنوبية)',
            'fa': 'UTC-02:00 (جورجیای جنوبی)',
            'zh': 'UTC-02:00 (南乔治亚岛)'
        },
        'UTC-01:00': {
            'en': 'UTC-01:00 (Azores, Cape Verde)',
            'ar': 'UTC-01:00 (جزر الأزور، الرأس الأخضر)',
            'fa': 'UTC-01:00 (آزور، کیپ ورد)',
            'zh': 'UTC-01:00 (亚速尔群岛、佛得角)'
        },
        'UTC+00:00': {
            'en': 'UTC+00:00 (GMT / London, Lisbon, Casablanca)',
            'ar': 'UTC+00:00 (غرينتش / لندن، لشبونة، الدار البيضاء)',
            'fa': 'UTC+00:00 (گرینویچ / لندن، لیسبون، کازابلانکا)',
            'zh': 'UTC+00:00 (格林威治 / 伦敦、里斯本、卡萨布兰卡)'
        },
        'UTC+01:00': {
            'en': 'UTC+01:00 (Central European Time - Paris, Berlin, Rome)',
            'ar': 'UTC+01:00 (توقيت وسط أوروبا - باريس، برلين، روما)',
            'fa': 'UTC+01:00 (زمان اروپای مرکزی - پاریس، برلین، رم)',
            'zh': 'UTC+01:00 (欧洲中部时间 - 巴黎、柏林、罗马)'
        },
        'UTC+02:00': {
            'en': 'UTC+02:00 (Eastern European Time - Cairo, Athens, Istanbul)',
            'ar': 'UTC+02:00 (توقيت شرق أوروبا - القاهرة، أثينا، إسطنبول)',
            'fa': 'UTC+02:00 (زمان اروپای شرقی - قاهره، آتن، استانبول)',
            'zh': 'UTC+02:00 (欧洲东部时间 - 开罗、雅典、伊斯坦布尔)'
        },
        'UTC+03:00': {
            'en': 'UTC+03:00 (Moscow, Riyadh, Nairobi)',
            'ar': 'UTC+03:00 (موسكو، الرياض، نيروبي)',
            'fa': 'UTC+03:00 (مسکو، ریاض، نایروبی)',
            'zh': 'UTC+03:00 (莫斯科、利雅得、内罗毕)'
        },
        'UTC+03:30': {
            'en': 'UTC+03:30 (Tehran)',
            'ar': 'UTC+03:30 (طهران)',
            'fa': 'UTC+03:30 (تهران)',
            'zh': 'UTC+03:30 (德黑兰)'
        },
        'UTC+04:00': {
            'en': 'UTC+04:00 (GST - Gulf Standard Time / Dubai, Abu Dhabi)',
            'ar': 'UTC+04:00 (توقيت الخليج / دبي، أبوظبي)',
            'fa': 'UTC+04:00 (زمان استاندارد خلیج / دبی، ابوظبی)',
            'zh': 'UTC+04:00 (海湾标准时间 / 迪拜、阿布扎比)'
        },
        'UTC+04:30': {
            'en': 'UTC+04:30 (Kabul)',
            'ar': 'UTC+04:30 (كابول)',
            'fa': 'UTC+04:30 (کابل)',
            'zh': 'UTC+04:30 (喀布尔)'
        },
        'UTC+05:00': {
            'en': 'UTC+05:00 (Karachi, Tashkent)',
            'ar': 'UTC+05:00 (كراتشي، طشقند)',
            'fa': 'UTC+05:00 (کراچی، تاشکند)',
            'zh': 'UTC+05:00 (卡拉奇、塔什干)'
        },
        'UTC+05:30': {
            'en': 'UTC+05:30 (IST - Indian Standard Time / Mumbai, New Delhi)',
            'ar': 'UTC+05:30 (توقيت الهند القياسي / مومباي، نيودلهي)',
            'fa': 'UTC+05:30 (زمان استاندارد هند / بمبئی، دهلی نو)',
            'zh': 'UTC+05:30 (印度标准时间 / 孟买、新德里)'
        },
        'UTC+05:45': {
            'en': 'UTC+05:45 (Kathmandu)',
            'ar': 'UTC+05:45 (كاتماندو)',
            'fa': 'UTC+05:45 (کاتماندو)',
            'zh': 'UTC+05:45 (加德满都)'
        },
        'UTC+06:00': {
            'en': 'UTC+06:00 (Dhaka, Almaty)',
            'ar': 'UTC+06:00 (دكا، ألماتي)',
            'fa': 'UTC+06:00 (داکا، آلماتی)',
            'zh': 'UTC+06:00 (达卡、阿拉木图)'
        },
        'UTC+06:30': {
            'en': 'UTC+06:30 (Yangon)',
            'ar': 'UTC+06:30 (يانغون)',
            'fa': 'UTC+06:30 (یانگون)',
            'zh': 'UTC+06:30 (仰光)'
        },
        'UTC+07:00': {
            'en': 'UTC+07:00 (Bangkok, Jakarta, Hanoi)',
            'ar': 'UTC+07:00 (بانكوك، جاكرتا، هانوي)',
            'fa': 'UTC+07:00 (بانکوک، جاکارتا، هانوی)',
            'zh': 'UTC+07:00 (曼谷、雅加达、河内)'
        },
        'UTC+08:00': {
            'en': 'UTC+08:00 (Singapore, Beijing, Hong Kong)',
            'ar': 'UTC+08:00 (سنغافورة، بكين، هونغ كونغ)',
            'fa': 'UTC+08:00 (سنگاپور، پکن، هنگ‌کنگ)',
            'zh': 'UTC+08:00 (新加坡、北京、香港)'
        },
        'UTC+08:45': {
            'en': 'UTC+08:45 (Eucla)',
            'ar': 'UTC+08:45 (يوكلا)',
            'fa': 'UTC+08:45 (یوکلا)',
            'zh': 'UTC+08:45 (尤克拉)'
        },
        'UTC+09:00': {
            'en': 'UTC+09:00 (Tokyo, Seoul)',
            'ar': 'UTC+09:00 (طوكيو، سيول)',
            'fa': 'UTC+09:00 (توکیو، سئول)',
            'zh': 'UTC+09:00 (东京、首尔)'
        },
        'UTC+09:30': {
            'en': 'UTC+09:30 (Adelaide, Darwin)',
            'ar': 'UTC+09:30 (أديلايد، داروين)',
            'fa': 'UTC+09:30 (آدلاید، داروین)',
            'zh': 'UTC+09:30 (阿德莱德、达尔文)'
        },
        'UTC+10:00': {
            'en': 'UTC+10:00 (Sydney, Melbourne, Guam)',
            'ar': 'UTC+10:00 (سيدني، ملبورن، غوام)',
            'fa': 'UTC+10:00 (سیدنی، ملبورن، گوام)',
            'zh': 'UTC+10:00 (悉尼、墨尔本、关岛)'
        },
        'UTC+10:30': {
            'en': 'UTC+10:30 (Lord Howe Island)',
            'ar': 'UTC+10:30 (جزيرة لورد هاو)',
            'fa': 'UTC+10:30 (جزیره لرد هاو)',
            'zh': 'UTC+10:30 (豪勋爵岛)'
        },
        'UTC+11:00': {
            'en': 'UTC+11:00 (Solomon Islands, Vanuatu)',
            'ar': 'UTC+11:00 (جزر سليمان، فانواتو)',
            'fa': 'UTC+11:00 (جزایر سلیمان، وانواتو)',
            'zh': 'UTC+11:00 (所罗门群岛、瓦努阿图)'
        },
        'UTC+12:00': {
            'en': 'UTC+12:00 (Auckland, Fiji)',
            'ar': 'UTC+12:00 (أوكلاند، فيجي)',
            'fa': 'UTC+12:00 (اوکلند، فیجی)',
            'zh': 'UTC+12:00 (奥克兰、斐济)'
        },
        'UTC+12:45': {
            'en': 'UTC+12:45 (Chatham Islands)',
            'ar': 'UTC+12:45 (جزر تشاتام)',
            'fa': 'UTC+12:45 (جزایر چاتام)',
            'zh': 'UTC+12:45 (查塔姆群岛)'
        },
        'UTC+13:00': {
            'en': 'UTC+13:00 (Samoa, Tonga)',
            'ar': 'UTC+13:00 (ساموا، تونغا)',
            'fa': 'UTC+13:00 (ساموآ، تونگا)',
            'zh': 'UTC+13:00 (萨摩亚、汤加)'
        },
        'UTC+14:00': {
            'en': 'UTC+14:00 (Line Islands, Kiribati)',
            'ar': 'UTC+14:00 (جزر لاين، كيريباتي)',
            'fa': 'UTC+14:00 (جزایر لاین، کیریباتی)',
            'zh': 'UTC+14:00 (莱恩群岛、基里巴斯)'
        }
    };

    var SUBMIT_BTN_MAP = {
        'en': 'Register Inquiry',
        'ar': 'تسجيل استفسار',
        'fa': 'ثبت درخواست',
        'zh': '提交咨询'
    };

    function findFieldLabel(el) {
        if (!el) return null;
        if (el.id) {
            var lbl = document.querySelector('label[for="' + el.id + '"]');
            if (lbl) return lbl;
        }
        var prev = el.previousElementSibling;
        while (prev) {
            if (prev.tagName && prev.tagName.toLowerCase() === 'label') return prev;
            prev = prev.previousElementSibling;
        }
        var parent = el.parentElement;
        if (parent) {
            var pPrev = parent.previousElementSibling;
            while (pPrev) {
                if (pPrev.tagName && pPrev.tagName.toLowerCase() === 'label') return pPrev;
                pPrev = pPrev.previousElementSibling;
            }
            var container = el.closest('div:not(.flex):not(.custom-select-wrapper)');
            if (container) {
                var cLbl = container.querySelector('label');
                if (cLbl) return cLbl;
            }
        }
        return null;
    }

    function translateConsultationForms(lang) {
        var curLang = lang || 'en';

        // 1. Form Labels
        for (var fKey in FORM_LABELS_MAP) {
            var cfg = FORM_LABELS_MAP[fKey];
            var fInputs = document.querySelectorAll(
                'input[name="' + fKey + '"], select[name="' + fKey + '"], textarea[name="' + fKey + '"]'
            );
            fInputs.forEach(function(inputEl) {
                var label = findFieldLabel(inputEl);
                if (label) {
                    var text = cfg[curLang] || cfg['en'];
                    if (cfg.required) {
                        label.innerHTML = text + ' <span class="text-red-500">*</span>';
                    } else {
                        label.textContent = text;
                    }
                }
            });
        }

        // 2. Preferred Language dropdown
        document.querySelectorAll('select[name="preferredLanguage"]').forEach(function(sel) {
            for (var i = 0; i < sel.options.length; i++) {
                var opt = sel.options[i];
                var val = (opt.value || '').toLowerCase().trim();
                if (PREFERRED_LANG_MAP[val] && PREFERRED_LANG_MAP[val][curLang]) {
                    opt.textContent = PREFERRED_LANG_MAP[val][curLang];
                }
            }
        });

        // 3. Preferred Method dropdown
        document.querySelectorAll('select[name="preferredMethod"]').forEach(function(sel) {
            for (var i = 0; i < sel.options.length; i++) {
                var opt = sel.options[i];
                var val = (opt.value || '').toLowerCase().trim();
                if (METHOD_OPTIONS_MAP[val] && METHOD_OPTIONS_MAP[val][curLang]) {
                    opt.textContent = METHOD_OPTIONS_MAP[val][curLang];
                }
            }
        });

        // 4. Timezone Select (Set dir="ltr" to prevent reversing UTC+04:00 into -UTC in RTL, and translate all options)
        document.querySelectorAll('select[name="timezone"]').forEach(function(sel) {
            sel.setAttribute('dir', 'ltr');
            for (var i = 0; i < sel.options.length; i++) {
                var opt = sel.options[i];
                var val = (opt.value || '').trim();
                if (!val) {
                    opt.textContent = TIMEZONE_FIRST_OPTION[curLang] || 'Select Time Zone';
                } else if (TIMEZONE_OPTIONS_MAP[val] && TIMEZONE_OPTIONS_MAP[val][curLang]) {
                    opt.textContent = TIMEZONE_OPTIONS_MAP[val][curLang];
                }
            }
        });

        // 5. Target Program and Sub-program options
        document.querySelectorAll('select[name="targetProgram"]').forEach(function(sel) {
            for (var i = 0; i < sel.options.length; i++) {
                var opt = sel.options[i];
                var val = (opt.value || '').trim();
                if (!val) {
                    opt.textContent = SELECT_PROGRAM_FIRST_OPTION[curLang] || 'Select Option';
                } else if (TARGET_PROGRAM_OPTIONS_MAP[val] && TARGET_PROGRAM_OPTIONS_MAP[val][curLang]) {
                    opt.textContent = TARGET_PROGRAM_OPTIONS_MAP[val][curLang];
                }
            }
        });

        document.querySelectorAll('select[name="subProgram"], select#sub-service-choice, select#sub-service-choice-standalone').forEach(function(sel) {
            if (sel.options && sel.options.length > 0 && (!sel.options[0].value || sel.options[0].value === '')) {
                sel.options[0].textContent = SELECT_SUBPROGRAM_FIRST_OPTION[curLang] || 'Select Sub-Program';
            }
        });

        // 6. Placeholders for common form fields
        for (var fName in FORM_PLACEHOLDER_MAP) {
            var fields = document.querySelectorAll('input[name="' + fName + '"], textarea[name="' + fName + '"]');
            fields.forEach(function(fEl) {
                if (FORM_PLACEHOLDER_MAP[fName][curLang]) {
                    fEl.setAttribute('placeholder', FORM_PLACEHOLDER_MAP[fName][curLang]);
                }
            });
        }

        // 7. Submit Button inside consultation forms
        document.querySelectorAll('form[onsubmit*="handleContactSubmit"] button[type="submit"], #standalone-contact-form button[type="submit"], #contact-portal-form button[type="submit"]').forEach(function(btn) {
            if (!btn.disabled && !btn.getAttribute('data-i18n')) {
                btn.textContent = SUBMIT_BTN_MAP[curLang] || SUBMIT_BTN_MAP['en'];
            }
        });
    }

    window.translateConsultationForms = translateConsultationForms;

    function applyTranslations(data, lang) {
        if (!data) return;
        var cfg = LANG_CONFIG[lang] || LANG_CONFIG['en'];

        // 1. Set HTML attributes
        document.documentElement.lang = cfg.code;
        document.documentElement.dir = cfg.dir;

        // 2. Set Body Font / Lang classes
        document.body.classList.remove('lang-en', 'lang-ar', 'lang-fa', 'lang-zh');
        document.body.classList.add('lang-' + cfg.code);

        // 3. Update Title & Meta based on current page
        var pathname = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
        var href = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';

        var titleAttrEl = document.querySelector('title[data-i18n]');
        var pageTitle = null;
        if (titleAttrEl) {
            var titleKey = titleAttrEl.getAttribute('data-i18n');
            pageTitle = getNestedValue(data, titleKey);
        }

        if (!pageTitle) {

            if (pathname.includes('/privacypolicy/') || href.includes('/privacypolicy/')) {
                pageTitle = getNestedValue(data, 'pages.privacyPolicy.metaTitle');
            } else if (pathname.includes('/cookiepolicy/') || href.includes('/cookiepolicy/')) {
                pageTitle = getNestedValue(data, 'pages.cookiePolicy.metaTitle');
            } else if (pathname.includes('/termsofuse/') || href.includes('/termsofuse/') || pathname.includes('/termsofservice/') || href.includes('/termsofservice/')) {
                pageTitle = getNestedValue(data, 'pages.termsOfUse.metaTitle');
            } else if (pathname.includes('/contact/') || href.includes('/contact/')) {
                pageTitle = getNestedValue(data, 'pages.contact.metaTitle');
            } else if (pathname.includes('/eligibilitychecker') || href.includes('/eligibilitychecker')) {
                pageTitle = getNestedValue(data, 'pages.eligibilityChecker.metaTitle');
            } else {
                var isHomePage = (pathname === '' || pathname === '/' || pathname.endsWith('/index.html')) &&
                                 !pathname.includes('/programs/') &&
                                 !pathname.includes('/citizenship') &&
                                 !pathname.includes('/residency') &&
                                 !pathname.includes('/about') &&
                                 !pathname.includes('/realestate') &&
                                 !pathname.includes('/educational') &&
                                 !pathname.includes('/social') &&
                                 !pathname.includes('/blog') &&
                                 !pathname.includes('/eligibilitychecker') &&
                                 !pathname.includes('/contact');
                if (isHomePage) {
                    pageTitle = (data.meta && data.meta.title);
                }
            }
        }

        if (pageTitle) {
            document.title = decodeHtmlEntities(pageTitle);
        }

        if (pathname.includes('/eligibilitychecker') || href.includes('/eligibilitychecker')) {
            var ecDesc = getNestedValue(data, 'pages.eligibilityChecker.metaDescription');
            if (ecDesc) {
                var descMetaEC = document.querySelector('meta[name="description"]');
                if (descMetaEC) descMetaEC.setAttribute('content', ecDesc);
                var ogDescEC = document.querySelector('meta[property="og:description"]');
                if (ogDescEC) ogDescEC.setAttribute('content', ecDesc);
            }
        }

        var isHomeForDesc = (pathname === '' || pathname === '/' || (pathname && pathname.endsWith('/index.html'))) &&
                            !pathname.includes('/programs/') &&
                            !pathname.includes('/citizenship') &&
                            !pathname.includes('/residency') &&
                            !pathname.includes('/about') &&
                            !pathname.includes('/realestate') &&
                            !pathname.includes('/educational') &&
                            !pathname.includes('/social') &&
                            !pathname.includes('/blog') &&
                            !pathname.includes('/privacypolicy') &&
                            !pathname.includes('/cookiepolicy') &&
                            !pathname.includes('/termsof') &&
                            !pathname.includes('/eligibilitychecker') &&
                            !pathname.includes('/contact');
        if (isHomeForDesc) {
            var pageDesc = getNestedValue(data, 'meta.description') || (data.meta && data.meta.description);
            if (pageDesc) {
                var descMeta = document.querySelector('meta[name="description"]');
                if (descMeta) descMeta.setAttribute('content', pageDesc);
                var ogDesc = document.querySelector('meta[property="og:description"]');
                if (ogDesc) ogDesc.setAttribute('content', pageDesc);
            }
        }

        // 4. Translate textContent for [data-i18n] with number localization
        var i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                var localized = (lang === 'ar' || lang === 'fa') ? localizeNumbers(val, lang) : val;
                localized = decodeHtmlEntities(localized);
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
                } else if (el.querySelector('.text-red-500, span.text-red-500')) {
                    // Form label has a required asterisk span: preserve it!
                    var starEl = el.querySelector('.text-red-500, span.text-red-500');
                    var starHtml = starEl ? starEl.outerHTML : ' <span class="text-red-500">*</span>';
                    el.innerHTML = localized + ' ' + starHtml;
                } else if (typeof localized === 'string' && localized.indexOf('<') !== -1 && localized.indexOf('>') !== -1) {
                    // If the translation contains HTML formatting (e.g. italic spans, line breaks), preserve it
                    el.innerHTML = localized;
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
                el.innerHTML = decodeHtmlEntities(val);
            }
        });

        // 6. Translate placeholders for [data-i18n-placeholder]
        var i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
        i18nPlaceholders.forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            var val = getNestedValue(data, key);
            if (val !== null && val !== undefined) {
                var isTel = el.type === 'tel' || el.getAttribute('type') === 'tel';
                var text = (!isTel && (lang === 'ar' || lang === 'fa')) ? localizeNumbers(val, lang) : val;
                el.setAttribute('placeholder', decodeHtmlEntities(text));
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
                        span.textContent = decodeHtmlEntities(localizedFooterAddr);
                    }
                }
            });
        }

        // 7. Apply number localization to counters and numeric displays across DOM
        applyNumberLocalization(lang);

        // 7b. Force LTR on Phone Number and Country Code inputs across all forms
        document.querySelectorAll('input[type="tel"]').forEach(function (el) {
            el.setAttribute('dir', 'ltr');
            var parentFlex = el.closest('.flex');
            if (parentFlex) {
                parentFlex.setAttribute('dir', 'ltr');
            }
        });

        // Normalize country dial codes in dropdown buttons back to standard Western digits
        document.querySelectorAll('.selected-country-span').forEach(function (el) {
            var txt = el.textContent || '';
            el.textContent = txt
                .replace(/[٠-٩]/g, function (d) { return ARABIC_DIGITS.indexOf(d); })
                .replace(/[۰-۹]/g, function (d) { return PERSIAN_DIGITS.indexOf(d); });
        });

        // 7c. Localize Consultation & Inquiry Form elements (Dropdowns, Placeholders, Timezone)
        translateConsultationForms(lang);

        // 8. Update UI switcher states
        updateLanguageUI(lang);

        // 8b. Re-apply live published CMS hydration so custom CMS edits are NEVER wiped out by static i18n JSON
        if (typeof window.reapplyCmsHydration === 'function') {
            try {
                window.reapplyCmsHydration(lang);
            } catch (err) {
                console.warn('[i18n] Reapplying CMS hydration error:', err);
            }
        }

        // Re-apply translations specifically to the dynamic mega-menus and mobile menus
        var navMenus = document.querySelectorAll('#citizenship-menu, #residency-menu, #mob-cbi, #mob-rbi');
        navMenus.forEach(function (container) {
            container.querySelectorAll('[data-i18n]').forEach(function (el) {
                var key = el.getAttribute('data-i18n');
                var val = getNestedValue(data, key);
                if (val !== null && val !== undefined) {
                    var localized = (lang === 'ar' || lang === 'fa') ? localizeNumbers(val, lang) : val;
                    el.textContent = decodeHtmlEntities(localized);
                }
            });
            container.querySelectorAll('[data-i18n-html]').forEach(function (el) {
                var key = el.getAttribute('data-i18n-html');
                var val = getNestedValue(data, key);
                if (val !== null && val !== undefined) {
                    el.innerHTML = val;
                }
            });
        });

        // 9. Reveal translated content instantly without any English flicker
        document.documentElement.classList.remove('i18n-pending');

        // Dispatch language change event for any custom components
        if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('languageChanged', {
                    detail: { lang: lang, config: cfg, data: data }
                }));
            } catch (e) {}
        }
        if (typeof window.updateWhatsAppWidget === 'function') {
            try { window.updateWhatsAppWidget(); } catch (e) {}
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

    function updateUrlPathForLang(lang) {
        if (!window.history || !window.history.pushState) return;
        if (window.location && window.location.protocol === 'file:') return;

        var pathname = window.location.pathname || '/';
        var search = window.location.search || '';
        var hash = window.location.hash || '';

        var segments = pathname.split('/').filter(Boolean);
        // If first segment is currently a supported lang code, remove it
        if (segments.length > 0 && ['ar', 'fa', 'zh', 'en'].indexOf(segments[0].toLowerCase()) !== -1) {
            segments.shift();
        }

        var newPathname = '';
        if (lang === 'en') {
            newPathname = '/' + segments.join('/');
        } else {
            newPathname = '/' + lang + (segments.length > 0 ? '/' + segments.join('/') : '/');
        }

        if (pathname.endsWith('/') && !newPathname.endsWith('/')) {
            newPathname += '/';
        }

        if (search.includes('lang=')) {
            var params = new URLSearchParams(search);
            params.delete('lang');
            var str = params.toString();
            search = str ? '?' + str : '';
        }

        var newUrl = newPathname + search + hash;
        if (newUrl !== (window.location.pathname + window.location.search + window.location.hash)) {
            window.history.pushState({ lang: lang }, '', newUrl);
        }
    }

    window.switchLanguage = function (targetLang) {
        var lang = normalizeLang(targetLang);
        currentLang = lang;

        try {
            localStorage.setItem('sharif_lang', lang);
            localStorage.setItem('sharif_preferred_lang', lang);
        } catch (e) {}

        // Update clean URL path in browser address bar (e.g. /ar/, /zh/, /fa/)
        updateUrlPathForLang(lang);

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

    window.addEventListener('popstate', function () {
        var lang = getInitialLang();
        if (lang !== currentLang) {
            currentLang = lang;
            loadTranslation(lang, function (data) {
                applyTranslations(data, lang);
            });
        }
    });

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
    // Enforce standard Western digits in phone inputs on live typing/pasting
    document.addEventListener('input', function (e) {
        if (e.target && (e.target.type === 'tel' || e.target.getAttribute('type') === 'tel')) {
            var val = e.target.value;
            if (/[٠-٩۰-۹]/.test(val)) {
                e.target.value = val
                    .replace(/[٠-٩]/g, function (d) { return ARABIC_DIGITS.indexOf(d); })
                    .replace(/[۰-۹]/g, function (d) { return PERSIAN_DIGITS.indexOf(d); });
            }
        }
    }, true);

    function loadWhatsAppWidget() {
        // Do not load on admin panel or editor iframes
        try {
            var path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
            var href = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';
            var search = (window.location && window.location.search) ? window.location.search.toLowerCase() : '';
            if (path.includes('/admin/') || path.endsWith('/admin') || href.includes('dashboard.html') || href.includes('admin/index.html') || href.includes('/admin')) return;
            if (window.self !== window.top) return;
            if (search.includes('cms_editor') || search.includes('cms_preview')) return;
        } catch (e) {}

        if (window.updateWhatsAppWidget) {
            window.updateWhatsAppWidget();
            return;
        }
        if (document.getElementById('sg-whatsapp-script')) return;

        var langScript = document.querySelector('script[src*="language-switcher.js"]');
        var basePath = '';
        if (langScript) {
            var src = langScript.getAttribute('src');
            basePath = src.substring(0, src.indexOf('language-switcher.js'));
        } else {
            basePath = '/assets/js/';
        }

        var widgetScript = document.createElement('script');
        widgetScript.id = 'sg-whatsapp-script';
        widgetScript.src = basePath + 'whatsapp-widget.js?v=' + Date.now();
        widgetScript.async = true;
        (document.body || document.head).appendChild(widgetScript);
    }

    function loadBlogTranslator() {
        try {
            var path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
            if (path.indexOf('/blog/') === -1 && path.indexOf('/blog') === -1) return;
        } catch (e) { return; }

        if (window.getLocalizedArticleData || document.getElementById('sg-blog-translator-script')) return;

        var langScript = document.querySelector('script[src*="language-switcher.js"]');
        var basePath = '';
        if (langScript) {
            var src = langScript.getAttribute('src');
            basePath = src.substring(0, src.indexOf('language-switcher.js'));
        } else {
            basePath = '/assets/js/';
        }

        var btScript = document.createElement('script');
        btScript.id = 'sg-blog-translator-script';
        btScript.src = basePath + 'blog-translator.js?v=' + Date.now();
        btScript.async = true;
        (document.body || document.head).appendChild(btScript);
    }

    function ensureMultilingualCSS() {
        if (document.querySelector('link[href*="multilingual.css"]')) return;
        var langScript = document.querySelector('script[src*="language-switcher.js"]');
        var basePath = '';
        if (langScript) {
            var src = langScript.getAttribute('src');
            var idx = src.indexOf('js/');
            if (idx !== -1) {
                basePath = src.substring(0, idx);
            }
        }
        if (!basePath) basePath = '/assets/';
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = basePath + 'css/multilingual.css?v=7';
        document.head.appendChild(link);
    }

    function init() {
        // Ensure multilingual CSS styling is always loaded
        ensureMultilingualCSS();

        currentLang = getInitialLang();
        if (currentLang === 'en') {
            document.documentElement.classList.remove('i18n-pending');
        }
        setupCounterInterceptor();
        loadTranslation(currentLang, function (data) {
            applyTranslations(data, currentLang);
        });

        // Initialize blog translation engine on blog pages
        loadBlogTranslator();

        // Initialize floating WhatsApp advisor widget site-wide
        loadWhatsAppWidget();

        // Initialize footer canvas video site-wide
        initFooterCanvasVideo();

        // Ensure Blog navigation links site-wide always route to /blog/ (never root /)
        function normalizeNavLinks() {
            document.querySelectorAll('a[data-i18n="nav.blog"], a[data-i18n="megaMenu.insights"]').forEach(function(el) {
                var href = el.getAttribute('href') || '';
                if (href === '/' || href === 'index.html' || href === '../index.html' || href === '') {
                    el.setAttribute('href', '/blog/');
                }
            });
        }
        normalizeNavLinks();

        // Safety fallback: if anything stalls, unmask the UI so user is never blocked
        setTimeout(function () {
            document.documentElement.classList.remove('i18n-pending');
        }, 1500);
    }

    // Global Robust Footer Canvas Video Controller
    function initFooterCanvasVideo() {
        const canvas = document.getElementById("footer-seamless-canvas");
        if (!canvas || canvas._hasCanvasEngine) return;
        canvas._hasCanvasEngine = true;

        const v1 = document.getElementById("footer-hidden-video");
        const v2 = document.getElementById("footer-hidden-video-2");
        if (!v1) return;

        // Ensure video elements are active in browser rendering pipeline (not display: none)
        // while remaining invisible to the user
        [v1, v2].forEach(function(v) {
            if (!v) return;
            v.classList.remove('hidden');
            v.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:-100;';
            v.muted = true;
            v.playsInline = true;
            v.setAttribute('muted', '');
            v.setAttribute('playsinline', '');
            v.setAttribute('webkit-playsinline', '');
            v.preload = 'auto';

            // Verify source
            var srcEl = v.querySelector('source');
            if (srcEl && srcEl.getAttribute('src')) {
                var rawSrc = srcEl.getAttribute('src');
                if (!rawSrc.startsWith('/') && !rawSrc.startsWith('http') && window.location.pathname.startsWith('/blog/')) {
                    srcEl.src = '/assets/videos/footer_bg_e58bba71.mp4';
                    v.src = '/assets/videos/footer_bg_e58bba71.mp4';
                }
            }
        });

        const ctx = canvas.getContext("2d", { alpha: false });
        let activeVideo = v1;
        let standbyVideo = v2;
        let crossfadeAlpha = 0;
        let isFading = false;
        let animationFrameId = null;
        let isFooterVisible = false;

        function resizeCanvas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const parent = canvas.parentElement || canvas;
            const w = Math.floor((parent.clientWidth || canvas.offsetWidth || window.innerWidth) * dpr);
            const h = Math.floor((parent.clientHeight || canvas.offsetHeight || 500) * dpr);
            if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
                canvas.width = w;
                canvas.height = h;
            }
        }

        if (window.ResizeObserver) {
            try {
                new ResizeObserver(resizeCanvas).observe(canvas.parentElement || canvas);
            } catch(e) {}
        }
        window.addEventListener("resize", resizeCanvas, { passive: true });
        resizeCanvas();

        function renderFrame() {
            if (!isFooterVisible) return;

            if (activeVideo && activeVideo.duration && activeVideo.currentTime >= activeVideo.duration - 1.2 && !isFading && standbyVideo) {
                isFading = true;
                standbyVideo.currentTime = 0;
                standbyVideo.play().catch(function() {});
            }
            if (isFading) {
                crossfadeAlpha += 0.04;
                if (crossfadeAlpha >= 1) {
                    crossfadeAlpha = 1;
                    if (activeVideo) activeVideo.pause();
                    let temp = activeVideo;
                    activeVideo = standbyVideo;
                    standbyVideo = temp;
                    isFading = false;
                    crossfadeAlpha = 0;
                }
            }
            ctx.globalAlpha = 1;
            if (activeVideo && activeVideo.readyState >= 2) {
                ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
            }
            if (isFading && standbyVideo && standbyVideo.readyState >= 2) {
                ctx.globalAlpha = crossfadeAlpha;
                ctx.drawImage(standbyVideo, 0, 0, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(renderFrame);
        }

        function startPlayback() {
            if (activeVideo && activeVideo.paused) {
                activeVideo.play().catch(function() {});
            }
            if (!animationFrameId) {
                renderFrame();
            }
        }

        function pausePlayback() {
            if (activeVideo) activeVideo.pause();
            if (standbyVideo) standbyVideo.pause();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        const target = canvas.closest('footer') || canvas.parentElement || canvas;
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    isFooterVisible = entry.isIntersecting;
                    if (isFooterVisible) {
                        startPlayback();
                    } else {
                        pausePlayback();
                    }
                });
            }, { rootMargin: '350px' });
            observer.observe(target);
        } else {
            isFooterVisible = true;
            startPlayback();
        }

        // Handle user interaction unlock for mobile browsers
        function unlockAutoplay() {
            if (activeVideo && activeVideo.paused && isFooterVisible) {
                activeVideo.play().catch(function() {});
            }
        }
        ['touchstart', 'click', 'scroll'].forEach(function(evt) {
            window.addEventListener(evt, unlockAutoplay, { once: true, passive: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

