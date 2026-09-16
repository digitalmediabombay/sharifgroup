/**
 * Sharif Group — Floating WhatsApp Action Widget with Advisor Selector Popup
 * Features:
 * - Hover & Click popup displaying advisor options.
 * - In English, Arabic, Chinese: 2 options (Mr. Ali Sharif: +971 54 124 3007 & Sales Expert: +971 4 357 8737).
 * - In Farsi (fa): Only 1 option (Mr. Ali Sharif: +971 54 124 3007).
 * - Fully responsive, RTL-aware, multilingual, with smooth transitions.
 */
(function () {
    'use strict';

    var LABELS = {
        'en': 'Talk to an Advisor',
        'fa': 'گفتگو با مشاور',
        'ar': 'تحدث مع مستشار',
        'zh': '咨询顾问'
    };

    var ARIA_LABELS = {
        'en': 'Talk to an Advisor on WhatsApp',
        'fa': 'گفتگو با مشاور در واتس‌اپ',
        'ar': 'تحدث مع مستشار عبر واتساب',
        'zh': '在 WhatsApp 上咨询顾问'
    };

    var POPUP_STRINGS = {
        title: {
            'en': 'WhatsApp Advisory Desk',
            'fa': 'میز مشاورین واتس‌اپ',
            'ar': 'مكتب استشارات واتساب',
            'zh': 'WhatsApp 专属咨询服务台'
        },
        subtitle: {
            'en': 'Select an advisor to start instant chat:',
            'fa': 'جهت آغاز گفتگوی مستقیم، مشاور مورد نظر را انتخاب کنید:',
            'ar': 'اختر المستشار لبدء محادثتك الفورية:',
            'zh': '请选择专属顾问开始即时沟通：'
        },
        online: {
            'en': 'Online Now',
            'fa': 'پاسخگویی آنلاین',
            'ar': 'متصل الآن',
            'zh': '在线'
        },
        chatNow: {
            'en': 'Chat Now',
            'fa': 'گفتگو',
            'ar': 'محادثة',
            'zh': '即刻交谈'
        }
    };

    var ADVISORS = {
        ali_sharif: {
            phone: '971541243007',
            displayPhone: '+971 54 124 3007',
            url: 'https://wa.me/971541243007',
            avatarText: 'AS',
            names: {
                'en': 'Mr. Ali Sharif',
                'fa': 'جناب آقای علی شریف',
                'ar': 'السيد علي شريف',
                'zh': '阿里·谢里夫先生'
            },
            roles: {
                'en': 'Founder & Chairman',
                'fa': 'بنیان‌گذار و رئیس هیئت مدیره',
                'ar': 'المؤسس ورئيس مجلس الإدارة',
                'zh': '创始人与董事长'
            },
            badge: {
                'en': 'VIP Direct',
                'fa': 'ارتباط مستقیم',
                'ar': 'مباشر VIP',
                'zh': 'VIP 直连'
            }
        },
        sales_expert: {
            phone: '97143578737',
            displayPhone: '+971 4 357 8737',
            url: 'https://wa.me/97143578737',
            avatarText: 'SE',
            names: {
                'en': 'Sales Expert',
                'fa': 'کارشناس فروش',
                'ar': 'خبير المبيعات',
                'zh': '投资咨询专家'
            },
            roles: {
                'en': 'Citizenship & Residency Desk',
                'fa': 'بخش شهروندی و اقامت',
                'ar': 'مكتب الجنسية والإقامة بالاستثمار',
                'zh': '投资入籍与居留顾问团队'
            },
            badge: {
                'en': 'Quick Desk',
                'fa': 'پاسخگویی سریع',
                'ar': 'استجابة سريعة',
                'zh': '快速响应'
            }
        }
    };

    var isClickLockedOpen = false;
    var hoverTimeout = null;

    function getCurrentLang() {
        if (window.getCurrentLanguage) {
            try { return window.getCurrentLanguage() || 'en'; } catch (e) {}
        }
        var docLang = (document.documentElement.lang || '').toLowerCase().trim();
        if (docLang === 'fa' || docLang === 'ar' || docLang === 'zh') return docLang;
        try {
            var stored = localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang');
            if (stored === 'fa' || stored === 'ar' || stored === 'zh') return stored;
        } catch (e) {}
        return 'en';
    }

    function injectStyles() {
        if (document.getElementById('sg-whatsapp-styles')) return;
        var style = document.createElement('style');
        style.id = 'sg-whatsapp-styles';
        style.textContent = `
            .sg-wa-widget-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                bottom: max(24px, env(safe-area-inset-bottom, 24px));
                right: max(24px, env(safe-area-inset-right, 24px));
                z-index: 9990;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                pointer-events: auto;
            }

            html[dir="rtl"] .sg-wa-widget-container {
                right: auto;
                left: 24px;
                left: max(24px, env(safe-area-inset-left, 24px));
                align-items: flex-start;
            }

            /* Main Trigger Button */
            .sg-wa-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                color: #FFFFFF !important;
                text-decoration: none !important;
                padding: 12px 20px 12px 16px;
                border-radius: 9999px;
                box-shadow: 0 8px 24px rgba(18, 140, 126, 0.38), 0 2px 6px rgba(0, 0, 0, 0.12);
                font-size: 14px;
                font-weight: 600;
                line-height: 1;
                letter-spacing: 0.02em;
                min-height: 48px;
                min-width: 48px;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background 0.3s ease;
                cursor: pointer;
                border: 1.5px solid rgba(255, 255, 255, 0.25);
                user-select: none;
                -webkit-user-select: none;
            }

            html[dir="rtl"] .sg-wa-btn {
                padding: 12px 16px 12px 20px;
                font-family: inherit;
            }

            .sg-wa-btn:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 14px 32px rgba(18, 140, 126, 0.48), 0 4px 10px rgba(0, 0, 0, 0.16);
                background: linear-gradient(135deg, #29e26f 0%, #0e7d70 100%);
                color: #FFFFFF !important;
            }

            .sg-wa-btn:active {
                transform: translateY(-1px) scale(0.98);
                box-shadow: 0 6px 16px rgba(18, 140, 126, 0.35);
            }

            .sg-wa-btn:focus-visible {
                outline: 3px solid #C5A880;
                outline-offset: 3px;
            }

            .sg-wa-icon-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                flex-shrink: 0;
            }

            .sg-wa-icon-wrap svg {
                width: 18px;
                height: 18px;
                fill: #FFFFFF;
                display: block;
            }

            .sg-wa-label {
                white-space: nowrap;
                font-size: 13.5px;
                font-weight: 600;
                letter-spacing: 0.01em;
            }

            /* Pulse dot */
            .sg-wa-pulse-dot {
                width: 8px;
                height: 8px;
                background: #FFFFFF;
                border-radius: 50%;
                margin-left: -2px;
                animation: sg-wa-dot-glow 2s infinite ease-in-out;
            }

            @keyframes sg-wa-dot-glow {
                0%, 100% { opacity: 0.95; transform: scale(1); }
                50% { opacity: 0.4; transform: scale(0.75); }
            }

            /* Popup Card */
            .sg-wa-popup {
                position: absolute;
                bottom: calc(100% + 14px);
                right: 0;
                width: 340px;
                background: #11161F;
                border: 1px solid rgba(197, 168, 128, 0.35);
                border-radius: 20px;
                box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), 0 0 20px rgba(197, 168, 128, 0.12);
                padding: 16px;
                box-sizing: border-box;
                opacity: 0;
                transform: translateY(12px) scale(0.96);
                pointer-events: none;
                transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
                color: #FFFFFF;
                display: flex;
                flex-direction: column;
                gap: 12px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }

            html[dir="rtl"] .sg-wa-popup {
                right: auto;
                left: 0;
                text-align: right;
            }

            .sg-wa-widget-container.sg-wa-open .sg-wa-popup,
            .sg-wa-widget-container:hover .sg-wa-popup {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            /* Popup Header */
            .sg-wa-popup-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding-bottom: 10px;
            }

            .sg-wa-popup-header-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .sg-wa-popup-header-title svg {
                width: 20px;
                height: 20px;
                fill: #25D366;
            }

            .sg-wa-popup-header-title h4 {
                margin: 0;
                font-size: 13.5px;
                font-weight: 700;
                color: #FFFFFF;
                letter-spacing: 0.02em;
            }

            .sg-wa-status-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: rgba(37, 211, 102, 0.15);
                border: 1px solid rgba(37, 211, 102, 0.3);
                color: #25D366;
                padding: 3px 8px;
                border-radius: 9999px;
                font-size: 10.5px;
                font-weight: 600;
            }

            .sg-wa-status-dot {
                width: 6px;
                height: 6px;
                background: #25D366;
                border-radius: 50%;
                animation: sg-wa-dot-glow 1.8s infinite;
            }

            .sg-wa-popup-desc {
                font-size: 11.5px;
                color: rgba(255, 255, 255, 0.65);
                margin: -4px 0 0 0;
                line-height: 1.4;
            }

            /* Advisor Option Cards */
            .sg-wa-advisor-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .sg-wa-advisor-card {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 10px 12px;
                text-decoration: none !important;
                color: #FFFFFF !important;
                transition: all 0.22s ease;
                cursor: pointer;
                position: relative;
            }

            .sg-wa-advisor-card:hover {
                background: rgba(197, 168, 128, 0.12);
                border-color: rgba(197, 168, 128, 0.45);
                transform: translateX(-2px);
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
            }

            html[dir="rtl"] .sg-wa-advisor-card:hover {
                transform: translateX(2px);
            }

            .sg-wa-advisor-card.sg-wa-card-vip {
                border-color: rgba(197, 168, 128, 0.25);
            }

            .sg-wa-advisor-card.sg-wa-card-vip:hover {
                border-color: #C5A880;
                background: linear-gradient(135deg, rgba(197, 168, 128, 0.16) 0%, rgba(28, 35, 46, 0.8) 100%);
            }

            /* Avatar */
            .sg-wa-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 13px;
                flex-shrink: 0;
                position: relative;
            }

            .sg-wa-card-vip .sg-wa-avatar {
                background: linear-gradient(135deg, #786142 0%, #C5A880 100%);
                color: #11161F;
                box-shadow: 0 0 10px rgba(197, 168, 128, 0.4);
            }

            .sg-wa-card-sales .sg-wa-avatar {
                background: linear-gradient(135deg, #128C7E 0%, #25D366 100%);
                color: #FFFFFF;
                box-shadow: 0 0 10px rgba(37, 211, 102, 0.3);
            }

            .sg-wa-advisor-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                min-width: 0;
            }

            .sg-wa-advisor-name-row {
                display: flex;
                align-items: center;
                gap: 6px;
                justify-content: space-between;
                flex-wrap: wrap;
            }

            .sg-wa-advisor-name {
                font-size: 13px;
                font-weight: 700;
                color: #FFFFFF;
                line-height: 1.3;
            }

            .sg-wa-card-tag {
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
            }

            .sg-wa-card-vip .sg-wa-card-tag {
                background: rgba(197, 168, 128, 0.2);
                color: #E2C07C;
                border: 1px solid rgba(197, 168, 128, 0.3);
            }

            .sg-wa-card-sales .sg-wa-card-tag {
                background: rgba(37, 211, 102, 0.15);
                color: #25D366;
                border: 1px solid rgba(37, 211, 102, 0.25);
            }

            .sg-wa-advisor-role {
                font-size: 10.5px;
                color: rgba(255, 255, 255, 0.6);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sg-wa-advisor-phone {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 11px;
                color: #C5A880;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 2px;
                direction: ltr !important;
                unicode-bidi: embed;
            }

            .sg-wa-card-sales .sg-wa-advisor-phone {
                color: #25D366;
            }

            .sg-wa-chat-pill {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: rgba(37, 211, 102, 0.15);
                color: #25D366;
                flex-shrink: 0;
                transition: transform 0.2s ease, background 0.2s ease;
            }

            .sg-wa-advisor-card:hover .sg-wa-chat-pill {
                background: #25D366;
                color: #FFFFFF;
                transform: scale(1.1);
            }

            .sg-wa-chat-pill svg {
                width: 15px;
                height: 15px;
                fill: currentColor;
            }

            .sg-wa-popup-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.4);
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                padding-top: 8px;
            }

            .sg-wa-close-btn {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: color 0.2s ease, background 0.2s ease;
            }

            .sg-wa-close-btn:hover {
                color: #FFFFFF;
                background: rgba(255, 255, 255, 0.1);
            }

            @media (max-width: 640px) {
                .sg-wa-widget-container {
                    bottom: 20px;
                    right: 16px;
                    bottom: max(20px, env(safe-area-inset-bottom, 20px));
                    right: max(16px, env(safe-area-inset-right, 16px));
                }
                html[dir="rtl"] .sg-wa-widget-container {
                    right: auto;
                    left: 16px;
                    left: max(16px, env(safe-area-inset-left, 16px));
                }
                .sg-wa-btn {
                    padding: 10px 16px 10px 12px;
                    font-size: 13px;
                }
                .sg-wa-popup {
                    width: calc(100vw - 32px);
                    max-width: 320px;
                    bottom: calc(100% + 10px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    var WA_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

    var CHAT_ICON_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>';

    function isInsideAdmin() {
        try {
            var path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
            var href = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';
            var search = (window.location && window.location.search) ? window.location.search.toLowerCase() : '';

            if (path.includes('/admin/') || path.endsWith('/admin') || href.includes('dashboard.html') || href.includes('admin/index.html') || href.includes('/admin')) {
                return true;
            }
            if (window.self !== window.top) {
                return true;
            }
            if (search.includes('cms_editor') || search.includes('cms_preview')) {
                return true;
            }
            if (document.body && (document.body.classList.contains('in-admin-studio') || document.body.hasAttribute('data-cms-editor'))) {
                return true;
            }
        } catch (e) {}
        return false;
    }

    function buildAdvisorCardHtml(key, lang) {
        var advisor = ADVISORS[key];
        if (!advisor) return '';
        var isVip = (key === 'ali_sharif');
        var cardClass = isVip ? 'sg-wa-card-vip' : 'sg-wa-card-sales';
        var name = advisor.names[lang] || advisor.names['en'];
        var role = advisor.roles[lang] || advisor.roles['en'];
        var badge = advisor.badge[lang] || advisor.badge['en'];

        return `
            <a class="sg-wa-advisor-card ${cardClass}" href="${advisor.url}" target="_blank" rel="noopener noreferrer" data-advisor="${key}">
                <div class="sg-wa-avatar">
                    ${advisor.avatarText}
                </div>
                <div class="sg-wa-advisor-info">
                    <div class="sg-wa-advisor-name-row">
                        <span class="sg-wa-advisor-name">${name}</span>
                        <span class="sg-wa-card-tag">${badge}</span>
                    </div>
                    <span class="sg-wa-advisor-role">${role}</span>
                    <span class="sg-wa-advisor-phone">${advisor.displayPhone}</span>
                </div>
                <div class="sg-wa-chat-pill" aria-label="Chat">
                    ${CHAT_ICON_SVG}
                </div>
            </a>
        `;
    }

    function buildPopupHtml(lang) {
        var title = POPUP_STRINGS.title[lang] || POPUP_STRINGS.title['en'];
        var subtitle = POPUP_STRINGS.subtitle[lang] || POPUP_STRINGS.subtitle['en'];
        var online = POPUP_STRINGS.online[lang] || POPUP_STRINGS.online['en'];

        // If Farsi ('fa'), ONLY show Mr. Ali Sharif (+971 54 124 3007)
        // In all other languages ('en', 'ar', 'zh'), show BOTH Mr. Ali Sharif and Sales Expert
        var advisorsHtml = '';
        if (lang === 'fa') {
            advisorsHtml += buildAdvisorCardHtml('ali_sharif', lang);
        } else {
            advisorsHtml += buildAdvisorCardHtml('ali_sharif', lang);
            advisorsHtml += buildAdvisorCardHtml('sales_expert', lang);
        }

        return `
            <div class="sg-wa-popup-header">
                <div class="sg-wa-popup-header-title">
                    ${WA_SVG}
                    <h4>${title}</h4>
                </div>
                <div class="sg-wa-status-badge">
                    <span class="sg-wa-status-dot"></span>
                    <span>${online}</span>
                </div>
            </div>
            <p class="sg-wa-popup-desc">${subtitle}</p>
            <div class="sg-wa-advisor-list">
                ${advisorsHtml}
            </div>
            <div class="sg-wa-popup-footer">
                <span>Sharif Group Private Advisory</span>
                <button type="button" class="sg-wa-close-btn" id="sg-wa-close-popup" aria-label="Close">&times;</button>
            </div>
        `;
    }

    function createOrUpdateWidget() {
        if (isInsideAdmin()) {
            var existing = document.getElementById('sg-whatsapp-widget');
            if (existing) existing.remove();
            return;
        }

        injectStyles();

        var container = document.getElementById('sg-whatsapp-widget');
        var lang = getCurrentLang();
        var labelText = LABELS[lang] || LABELS['en'];
        var ariaLabel = ARIA_LABELS[lang] || ARIA_LABELS['en'];

        if (!container) {
            container = document.createElement('div');
            container.id = 'sg-whatsapp-widget';
            container.className = 'sg-wa-widget-container';

            // 1. Popup card
            var popup = document.createElement('div');
            popup.id = 'sg-wa-popup-card';
            popup.className = 'sg-wa-popup';
            popup.innerHTML = buildPopupHtml(lang);
            container.appendChild(popup);

            // 2. Main Trigger Button
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'sg-wa-btn';
            button.id = 'sg-wa-action-btn';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-haspopup', 'dialog');
            button.setAttribute('aria-label', ariaLabel);

            button.innerHTML = `
                <span class="sg-wa-icon-wrap" aria-hidden="true">
                    ${WA_SVG}
                </span>
                <span class="sg-wa-label" id="sg-wa-label-text">${labelText}</span>
                <span class="sg-wa-pulse-dot" aria-hidden="true"></span>
            `;

            container.appendChild(button);
            document.body.appendChild(container);

            // Event Bindings
            bindWidgetEvents(container, button, popup);
        } else {
            // Update label text
            var labelEl = document.getElementById('sg-wa-label-text');
            if (labelEl) labelEl.textContent = labelText;
            var buttonEl = document.getElementById('sg-wa-action-btn');
            if (buttonEl) buttonEl.setAttribute('aria-label', ariaLabel);

            // Rebuild popup content according to current language
            var popupEl = document.getElementById('sg-wa-popup-card');
            if (popupEl) {
                popupEl.innerHTML = buildPopupHtml(lang);
                var closeBtn = popupEl.querySelector('#sg-wa-close-popup');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        closePopup(container, buttonEl);
                    });
                }
            }
        }

        // Update any other WhatsApp links
        updateExistingWhatsAppLinks();
    }

    function openPopup(container, button) {
        container.classList.add('sg-wa-open');
        button.setAttribute('aria-expanded', 'true');
    }

    function closePopup(container, button) {
        container.classList.remove('sg-wa-open');
        button.setAttribute('aria-expanded', 'false');
        isClickLockedOpen = false;
    }

    function togglePopup(container, button) {
        if (container.classList.contains('sg-wa-open')) {
            closePopup(container, button);
        } else {
            openPopup(container, button);
            isClickLockedOpen = true;
        }
    }

    function bindWidgetEvents(container, button, popup) {
        // Hover handling with debounce
        container.addEventListener('mouseenter', function () {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            openPopup(container, button);
        });

        container.addEventListener('mouseleave', function () {
            if (isClickLockedOpen) return;
            hoverTimeout = setTimeout(function () {
                closePopup(container, button);
            }, 250);
        });

        // Click on main WhatsApp button toggles popup
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            togglePopup(container, button);
        });

        // Close button inside popup
        popup.addEventListener('click', function (e) {
            var closeBtn = e.target.closest('#sg-wa-close-popup');
            if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                closePopup(container, button);
                return;
            }

            var card = e.target.closest('.sg-wa-advisor-card');
            if (card) {
                // Tracking
                try {
                    var advisorKey = card.getAttribute('data-advisor') || 'advisor';
                    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
                        window.dataLayer.push({
                            event: 'whatsapp_advisor_click',
                            advisor: advisorKey,
                            page_path: window.location.pathname || '/',
                            language: getCurrentLang()
                        });
                    }
                } catch (err) {}
                closePopup(container, button);
            }
        });

        // Clicking outside closes popup
        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) {
                closePopup(container, button);
            }
        });

        // Pressing Escape closes popup
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closePopup(container, button);
            }
        });
    }

    function updateExistingWhatsAppLinks() {
        try {
            var existingLinks = document.querySelectorAll('a[href*="whatsapp.com"], a[href*="wa.me"]');
            existingLinks.forEach(function (a) {
                if (a.closest('#sg-whatsapp-widget')) return;
                // Preserve targeted desk links
                var href = a.getAttribute('href') || '';
                if (!href.includes('97143578737') && !href.includes('971541243007')) {
                    a.setAttribute('href', 'https://wa.me/971541243007');
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            });
        } catch (e) {}
    }

    window.updateWhatsAppWidget = createOrUpdateWidget;

    // Listen to custom languageChanged event for reactive translation and advisor visibility
    window.addEventListener('languageChanged', createOrUpdateWidget);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createOrUpdateWidget);
    } else {
        createOrUpdateWidget();
    }
})();
