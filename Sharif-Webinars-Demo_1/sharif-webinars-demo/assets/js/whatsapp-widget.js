/**
 * Sharif Group — Luxury WhatsApp Advisory Widget
 * Pixel-accurate implementation matching Sharif Group brand design system.
 * Features:
 * - Floating circular trigger with gold rim, centered WhatsApp green logo, and active green status badge.
 * - Elegant luxury dark modal popup with gold border, Playfair Display serif typography, and dual advisory team cards:
 *   1. International Advisory Team (+971 4 357 8737) [Primary]
 *   2. Dubai Advisory Team (+971 54 124 3007)
 * - Multilingual support (en, ar, fa, zh) with proper RTL layout support.
 * - Responsive design for desktop, tablet, and mobile.
 */
(function () {
    'use strict';

    var I18N = {
        brand: {
            'en': 'SHARIF GROUP',
            'ar': 'مجموعة شريف',
            'fa': 'شریف گروپ',
            'zh': 'SHARIF GROUP'
        },
        title: {
            'en': 'Talk to Our Advisory Team',
            'ar': 'تحدث مع فريقنا الاستشاري',
            'fa': 'گفتگو با تیم مشاوره ما',
            'zh': '与我们的顾问团队交谈'
        },
        subtitle: {
            'en': 'Choose the team you would like to contact.',
            'ar': 'اختر الفريق الذي ترغب في التواصل معه.',
            'fa': 'جهت ارتباط مستقیم با دفتر دبی پیام ارسال نمایید.',
            'zh': '请选择您希望联系的咨询团队。'
        },
        primaryBadge: {
            'en': 'Primary',
            'ar': 'رئيسي',
            'fa': 'اصلی',
            'zh': '主要'
        },
        intlTeam: {
            title: {
                'en': 'International Advisory Team',
                'ar': 'فريق الاستشارات الدولي',
                'fa': 'تیم مشاوره بین‌المللی',
                'zh': '国际顾问团队'
            },
            desc: {
                'en': 'Global Client Consultation',
                'ar': 'استشارات العملاء الدولية',
                'fa': 'مشاوره بین‌المللی مشتریان',
                'zh': '全球客户专属咨询'
            },
            phoneDisplay: '+971 4 357 8737',
            phoneRaw: '97143578737',
            msg: {
                'en': 'Hello Sharif Group, I would like to inquire with the International Advisory Team.',
                'ar': 'مرحباً مجموعة شريف، أود الاستفسار مع فريق الاستشارات الدولي.',
                'fa': 'سلام شریف گروپ، مایل به مشاوره با تیم بین‌المللی هستم.',
                'zh': '您好谢里夫集团，我想咨询国际顾问团队。'
            }
        },
        dubaiTeam: {
            title: {
                'en': 'Dubai Advisory Team',
                'ar': 'فريق استشارات دبي',
                'fa': 'تیم مشاوره دبی',
                'zh': '迪拜顾问团队'
            },
            desc: {
                'en': 'Dubai Office & Enquiries',
                'ar': 'مكتب واستفسارات دبي',
                'fa': 'دفتر و پیگیری‌های دبی',
                'zh': '迪拜办事处与业务咨询'
            },
            phoneDisplay: '+971 54 124 3007',
            phoneRaw: '971541243007',
            msg: {
                'en': 'Hello Sharif Group, I would like to contact the Dubai Advisory Team.',
                'ar': 'مرحباً مجموعة شريف، أود التواصل مع فريق استشارات دبي.',
                'fa': 'سلام شریف گروپ، مایل به تماس با تیم دبی هستم.',
                'zh': '您好谢里夫集团，我想联系迪拜顾问团队。'
            }
        },
        confidential: {
            'en': 'Private and confidential.',
            'ar': 'خاص وسري للغاية.',
            'fa': 'محرمانه و امن.',
            'zh': '严格保密，安全受信。'
        },
        ariaOpen: {
            'en': 'Open WhatsApp Advisory Desk',
            'ar': 'فتح مكتب استشارات واتساب',
            'fa': 'باز کردن میز مشاوره واتس‌اپ',
            'zh': '打开 WhatsApp 顾问咨询'
        },
        ariaClose: {
            'en': 'Close WhatsApp Advisory Desk',
            'ar': 'إغلاق مكتب استشارات واتساب',
            'fa': 'بستن میز مشاوره واتس‌اپ',
            'zh': '关闭 WhatsApp 顾问咨询'
        }
    };

    function getCurrentLang() {
        if (window.getCurrentLanguage) {
            try { return window.getCurrentLanguage() || 'en'; } catch (e) { }
        }
        var docLang = (document.documentElement.lang || '').toLowerCase().trim();
        if (docLang === 'fa' || docLang === 'ar' || docLang === 'zh') return docLang;
        try {
            var stored = localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang');
            if (stored === 'fa' || stored === 'ar' || stored === 'zh') return stored;
        } catch (e) { }
        return 'en';
    }

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
        } catch (e) { }
        return false;
    }

    function injectStyles() {
        var existing = document.getElementById('sg-whatsapp-styles');
        if (existing) {
            existing.remove();
        }
        var style = document.createElement('style');
        style.id = 'sg-whatsapp-styles';
        style.textContent = `
            /* Container fixed in bottom-right regardless of language */
            .sg-wa-widget-container,
            html[dir="rtl"] .sg-wa-widget-container,
            [dir="rtl"] .sg-wa-widget-container {
                position: fixed;
                bottom: 24px;
                right: 24px !important;
                left: auto !important;
                bottom: max(24px, env(safe-area-inset-bottom, 24px));
                right: max(24px, env(safe-area-inset-right, 24px)) !important;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: flex-end !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                pointer-events: auto;
            }

            /* Circular Trigger Button */
            .sg-wa-trigger-btn {
                position: relative;
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: #07131F;
                border: 1.5px solid #C5A880;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), 0 0 20px rgba(197, 168, 128, 0.22);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease;
                outline: none;
                padding: 0;
                user-select: none;
                -webkit-user-select: none;
            }

            .sg-wa-trigger-btn:hover {
                transform: scale(1.06) translateY(-2px);
                border-color: #E2C07C;
                box-shadow: 0 14px 36px rgba(0, 0, 0, 0.75), 0 0 26px rgba(226, 192, 124, 0.4);
            }

            .sg-wa-trigger-btn:active {
                transform: scale(0.96);
            }

            .sg-wa-trigger-btn:focus-visible {
                outline: 3px solid #C5A880;
                outline-offset: 4px;
            }

            /* Center WhatsApp Icon */
            .sg-wa-trigger-icon {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .sg-wa-trigger-icon svg {
                width: 100%;
                height: 100%;
                fill: #25D366;
                filter: drop-shadow(0 2px 5px rgba(37, 211, 102, 0.35));
            }

            /* Online Status Dot (Clipped at top-right) */
            .sg-wa-status-dot,
            html[dir="rtl"] .sg-wa-status-dot,
            [dir="rtl"] .sg-wa-status-dot {
                position: absolute;
                top: 2px;
                right: 2px !important;
                left: auto !important;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #00E676;
                border: 2.5px solid #07131F;
                box-shadow: 0 0 10px rgba(0, 230, 118, 0.7);
                animation: sg-wa-status-pulse 2.2s infinite ease-in-out;
            }

            @keyframes sg-wa-status-pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                    box-shadow: 0 0 10px rgba(0, 230, 118, 0.7);
                }
                50% {
                    transform: scale(0.85);
                    opacity: 0.75;
                    box-shadow: 0 0 4px rgba(0, 230, 118, 0.4);
                }
            }

            /* Modal Popup Card */
            .sg-wa-modal {
                position: absolute;
                bottom: calc(100% + 18px);
                right: 0;
                width: 395px;
                max-width: calc(100vw - 32px);
                background: #07131F;
                border: 1.5px solid #C5A880;
                border-radius: 26px;
                padding: 24px 22px 20px 22px;
                box-sizing: border-box;
                box-shadow: 0 25px 65px rgba(0, 0, 0, 0.85), 0 0 35px rgba(197, 168, 128, 0.15);
                color: #FFFFFF;
                display: flex;
                flex-direction: column;
                opacity: 0;
                visibility: hidden;
                transform: translateY(16px) scale(0.96);
                transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.28s;
                pointer-events: none;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
            }

            /* Invisible bridge to prevent mouseleave when moving between button and modal */
            .sg-wa-modal::after {
                content: '';
                position: absolute;
                bottom: -24px;
                left: 0;
                right: 0;
                height: 24px;
                background: transparent;
                pointer-events: auto;
            }

            .sg-wa-modal,
            html[dir="rtl"] .sg-wa-modal,
            [dir="rtl"] .sg-wa-modal {
                right: 0 !important;
                left: auto !important;
            }

            html[dir="rtl"] .sg-wa-modal,
            [dir="rtl"] .sg-wa-modal {
                text-align: right;
                direction: rtl;
            }

            .sg-wa-widget-container.sg-wa-open .sg-wa-modal {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            /* Modal Header */
            .sg-wa-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                position: relative;
                z-index: 2;
            }

            .sg-wa-brand-tag {
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
                font-size: 11px;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                color: #C5A880;
                font-weight: 600;
            }

            .sg-wa-brand-line {
                display: inline-block;
                width: 38px;
                height: 1px;
                background: #C5A880;
                opacity: 0.85;
            }

            .sg-wa-close-btn {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
                outline: none;
                padding: 0;
                position: relative;
                z-index: 10;
                -webkit-tap-highlight-color: transparent;
            }

            .sg-wa-close-btn:hover {
                color: #C5A880;
                background: rgba(197, 168, 128, 0.16);
                transform: scale(1.1);
            }

            .sg-wa-modal-title {
                font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
                font-size: 26px;
                line-height: 1.22;
                font-weight: 500;
                color: #FFFFFF;
                margin: 0 0 6px 0;
                letter-spacing: -0.01em;
            }

            .sg-wa-modal-subtitle {
                font-size: 13px;
                line-height: 1.45;
                color: #8E9DAE;
                margin: 0 0 18px 0;
                font-weight: 400;
            }

            /* Advisory Cards Container */
            .sg-wa-cards-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            /* Single Advisory Card */
            .sg-wa-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                background: rgba(9, 23, 36, 0.6);
                border: 1px solid rgba(197, 168, 128, 0.25);
                border-radius: 18px;
                padding: 14px 16px;
                text-decoration: none !important;
                color: #FFFFFF !important;
                transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                cursor: pointer;
            }

            .sg-wa-card:hover {
                background: rgba(197, 168, 128, 0.09);
                border-color: rgba(197, 168, 128, 0.65);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            }

            /* Left Circular Icon Badge */
            .sg-wa-card-icon-wrap {
                width: 48px;
                height: 48px;
                min-width: 48px;
                border-radius: 50%;
                border: 1.5px solid #C5A880;
                background: rgba(197, 168, 128, 0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease;
            }

            .sg-wa-card:hover .sg-wa-card-icon-wrap {
                border-color: #E2C07C;
                background: rgba(197, 168, 128, 0.12);
                transform: scale(1.05);
            }

            .sg-wa-card-icon-wrap svg {
                width: 22px;
                height: 22px;
            }

            /* Card Content Details */
            .sg-wa-card-details {
                display: flex;
                flex-direction: column;
                gap: 3px;
                flex: 1;
                min-width: 0;
            }

            .sg-wa-card-title-row {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 8px;
            }

            .sg-wa-card-title {
                font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
                font-size: 15px;
                font-weight: 600;
                color: #FFFFFF;
                line-height: 1.3;
                white-space: normal;
                word-break: normal;
                flex: 1;
                min-width: 0;
            }

            .sg-wa-primary-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(197, 168, 128, 0.85);
                border-radius: 9999px;
                padding: 1.5px 9px;
                font-size: 10.5px;
                color: #C5A880;
                font-family: 'Playfair Display', Georgia, serif;
                font-weight: 500;
                letter-spacing: 0.02em;
                flex-shrink: 0;
                background: rgba(197, 168, 128, 0.06);
                white-space: nowrap;
                margin-top: 1px;
            }

            .sg-wa-card-desc {
                font-size: 12px;
                color: #8E9DAE;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
            }

            .sg-wa-card-phone {
                display: flex;
                align-items: center;
                gap: 6px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 13px;
                font-weight: 600;
                color: #FFFFFF;
                direction: ltr !important;
                unicode-bidi: embed;
            }

            .sg-wa-phone-icon {
                width: 12px;
                height: 12px;
                fill: #C5A880;
                flex-shrink: 0;
            }

            /* Card Action Side: Divider & WhatsApp Icon */
            .sg-wa-card-action {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }

            .sg-wa-v-divider {
                width: 1px;
                height: 38px;
                background: rgba(255, 255, 255, 0.14);
            }

            .sg-wa-chat-icon {
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.22s ease, filter 0.22s ease;
            }

            .sg-wa-chat-icon svg {
                width: 100%;
                height: 100%;
                fill: #25D366;
            }

            .sg-wa-card:hover .sg-wa-chat-icon {
                transform: scale(1.15);
                filter: drop-shadow(0 0 6px rgba(37, 211, 102, 0.5));
            }

            /* Horizontal Line above Footer */
            .sg-wa-footer-line {
                width: 100%;
                height: 1px;
                background: rgba(197, 168, 128, 0.32);
                margin: 18px 0 14px 0;
            }

            /* Footer Confidentiality Notice */
            .sg-wa-modal-footer {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 12px;
                color: #8E9DAE;
                letter-spacing: 0.01em;
            }

            .sg-wa-lock-icon {
                width: 12px;
                height: 12px;
                fill: #C5A880;
                flex-shrink: 0;
            }

            /* Responsive tweaks */
            @media (max-width: 480px) {
                .sg-wa-widget-container,
                html[dir="rtl"] .sg-wa-widget-container,
                [dir="rtl"] .sg-wa-widget-container {
                    bottom: 18px;
                    right: 16px !important;
                    left: auto !important;
                    bottom: max(18px, env(safe-area-inset-bottom, 18px));
                    right: max(16px, env(safe-area-inset-right, 16px)) !important;
                    align-items: flex-end !important;
                }
                .sg-wa-trigger-btn {
                    width: 58px;
                    height: 58px;
                }
                .sg-wa-trigger-icon {
                    width: 28px;
                    height: 28px;
                }
                .sg-wa-modal {
                    width: calc(100vw - 32px);
                    padding: 20px 16px 16px 16px;
                    border-radius: 22px;
                    bottom: calc(100% + 14px);
                }
                .sg-wa-modal-title {
                    font-size: 22px;
                }
                .sg-wa-card {
                    padding: 12px 14px;
                }
                .sg-wa-card-icon-wrap {
                    width: 42px;
                    height: 42px;
                    min-width: 42px;
                }
                .sg-wa-card-icon-wrap svg {
                    width: 19px;
                    height: 19px;
                }
                .sg-wa-card-title {
                    font-size: 14.5px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    var WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

    /* 3-people group icon outline matching Image 1 */
    var USERS_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#C5A880" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.2"/><path d="M6 19a6 6 0 0 1 12 0"/><circle cx="4.8" cy="9.5" r="2.2"/><path d="M2.5 19a4 4 0 0 1 4.5-3.5"/><circle cx="19.2" cy="9.5" r="2.2"/><path d="M17 15.5a4 4 0 0 1 4.5 3.5"/></svg>';

    /* Globe with meridians and equator matching Image 1 */
    var GLOBE_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#C5A880" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><line x1="2.8" y1="12" x2="21.2" y2="12"/><path d="M12 2.8a13.5 13.5 0 0 1 4 9.2 13.5 13.5 0 0 1-4 9.2 13.5 13.5 0 0 1-4-9.2 13.5 13.5 0 0 1 4-9.2z"/></svg>';

    var PHONE_ICON_SVG = '<svg class="sg-wa-phone-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';

    var LOCK_ICON_SVG = '<svg class="sg-wa-lock-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>';

    var CLOSE_ICON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="pointer-events: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    function buildWhatsAppUrl(phoneRaw, msgText) {
        return 'https://wa.me/' + phoneRaw + (msgText ? '?text=' + encodeURIComponent(msgText) : '');
    }

    function buildModalHtml(lang) {
        var brand = I18N.brand[lang] || I18N.brand['en'];
        var title = I18N.title[lang] || I18N.title['en'];
        var subtitle = I18N.subtitle[lang] || I18N.subtitle['en'];
        var primaryBadge = I18N.primaryBadge[lang] || I18N.primaryBadge['en'];
        var confidential = I18N.confidential[lang] || I18N.confidential['en'];
        var ariaClose = I18N.ariaClose[lang] || I18N.ariaClose['en'];

        var intl = I18N.intlTeam;
        var intlTitle = intl.title[lang] || intl.title['en'];
        var intlDesc = intl.desc[lang] || intl.desc['en'];
        var intlMsg = intl.msg[lang] || intl.msg['en'];
        var intlUrl = buildWhatsAppUrl(intl.phoneRaw, intlMsg);

        var dubai = I18N.dubaiTeam;
        var dubaiTitle = dubai.title[lang] || dubai.title['en'];
        var dubaiDesc = dubai.desc[lang] || dubai.desc['en'];
        var dubaiMsg = dubai.msg[lang] || dubai.msg['en'];
        var dubaiUrl = buildWhatsAppUrl(dubai.phoneRaw, dubaiMsg);

        return `
            <div class="sg-wa-modal-header">
                <div class="sg-wa-brand-tag">
                    <span>${brand}</span>
                    <span class="sg-wa-brand-line"></span>
                </div>
                <button type="button" class="sg-wa-close-btn" id="sg-wa-close-btn" aria-label="${ariaClose}">
                    ${CLOSE_ICON_SVG}
                </button>
            </div>

            <h3 class="sg-wa-modal-title">${title}</h3>
            <p class="sg-wa-modal-subtitle">${subtitle}</p>

            <div class="sg-wa-cards-list">
                ${lang === 'fa' ? `
                <!-- Dubai Advisory Team (+971 54 124 3007) -->
                <a class="sg-wa-card" href="${dubaiUrl}" target="_blank" rel="noopener noreferrer" data-team="dubai">
                    <div class="sg-wa-card-icon-wrap">
                        ${GLOBE_ICON_SVG}
                    </div>
                    <div class="sg-wa-card-details">
                        <div class="sg-wa-card-title-row">
                            <span class="sg-wa-card-title">${dubaiTitle}</span>
                        </div>
                        <span class="sg-wa-card-desc">${dubaiDesc}</span>
                        <div class="sg-wa-card-phone">
                            ${PHONE_ICON_SVG}
                            <span>${dubai.phoneDisplay}</span>
                        </div>
                    </div>
                    <div class="sg-wa-card-action">
                        <span class="sg-wa-v-divider"></span>
                        <span class="sg-wa-chat-icon" aria-label="WhatsApp">
                            ${WA_SVG}
                        </span>
                    </div>
                </a>
                ` : `
                <!-- 1. International Advisory Team (Primary) -->
                <a class="sg-wa-card" href="${intlUrl}" target="_blank" rel="noopener noreferrer" data-team="international">
                    <div class="sg-wa-card-icon-wrap">
                        ${USERS_ICON_SVG}
                    </div>
                    <div class="sg-wa-card-details">
                        <div class="sg-wa-card-title-row">
                            <span class="sg-wa-card-title">${intlTitle}</span>
                            <span class="sg-wa-primary-pill">${primaryBadge}</span>
                        </div>
                        <span class="sg-wa-card-desc">${intlDesc}</span>
                        <div class="sg-wa-card-phone">
                            ${PHONE_ICON_SVG}
                            <span>${intl.phoneDisplay}</span>
                        </div>
                    </div>
                    <div class="sg-wa-card-action">
                        <span class="sg-wa-v-divider"></span>
                        <span class="sg-wa-chat-icon" aria-label="WhatsApp">
                            ${WA_SVG}
                        </span>
                    </div>
                </a>

                <!-- 2. Dubai Advisory Team -->
                <a class="sg-wa-card" href="${dubaiUrl}" target="_blank" rel="noopener noreferrer" data-team="dubai">
                    <div class="sg-wa-card-icon-wrap">
                        ${GLOBE_ICON_SVG}
                    </div>
                    <div class="sg-wa-card-details">
                        <div class="sg-wa-card-title-row">
                            <span class="sg-wa-card-title">${dubaiTitle}</span>
                        </div>
                        <span class="sg-wa-card-desc">${dubaiDesc}</span>
                        <div class="sg-wa-card-phone">
                            ${PHONE_ICON_SVG}
                            <span>${dubai.phoneDisplay}</span>
                        </div>
                    </div>
                    <div class="sg-wa-card-action">
                        <span class="sg-wa-v-divider"></span>
                        <span class="sg-wa-chat-icon" aria-label="WhatsApp">
                            ${WA_SVG}
                        </span>
                    </div>
                </a>
                `}
            </div>

            <div class="sg-wa-footer-line"></div>

            <div class="sg-wa-modal-footer">
                ${LOCK_ICON_SVG}
                <span>${confidential}</span>
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
        var ariaOpen = I18N.ariaOpen[lang] || I18N.ariaOpen['en'];

        if (!container) {
            container = document.createElement('div');
            container.id = 'sg-whatsapp-widget';
            container.className = 'sg-wa-widget-container';

            // 1. Modal Popup
            var modal = document.createElement('div');
            modal.id = 'sg-wa-modal-popup';
            modal.className = 'sg-wa-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.innerHTML = buildModalHtml(lang);
            container.appendChild(modal);

            // 2. Circular Trigger Button
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'sg-wa-trigger-btn';
            button.id = 'sg-wa-trigger-action';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-haspopup', 'dialog');
            button.setAttribute('aria-label', ariaOpen);

            button.innerHTML = `
                <span class="sg-wa-trigger-icon" aria-hidden="true">
                    ${WA_SVG}
                </span>
                <span class="sg-wa-status-dot" aria-hidden="true"></span>
            `;

            container.appendChild(button);
            document.body.appendChild(container);

            bindWidgetEvents(container, button, modal);
        } else {
            var triggerBtn = document.getElementById('sg-wa-trigger-action');
            if (triggerBtn) triggerBtn.setAttribute('aria-label', ariaOpen);

            var modalEl = document.getElementById('sg-wa-modal-popup');
            if (modalEl) {
                modalEl.innerHTML = buildModalHtml(lang);
                var closeBtn = modalEl.querySelector('#sg-wa-close-btn');
                if (closeBtn && triggerBtn) {
                    closeBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        closeModal(container, triggerBtn);
                    });
                }
            }
        }

        updateExistingWhatsAppLinks();
    }

    function openModal(container, button) {
        container.classList.add('sg-wa-open');
        button.setAttribute('aria-expanded', 'true');
    }

    function closeModal(container, button) {
        container.classList.remove('sg-wa-open');
        button.setAttribute('aria-expanded', 'false');
    }

    function toggleModal(container, button) {
        if (container.classList.contains('sg-wa-open')) {
            closeModal(container, button);
        } else {
            openModal(container, button);
        }
    }

    function bindWidgetEvents(container, button, modal) {
        // Click on circular WhatsApp button toggles modal open/close
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleModal(container, button);
        });

        // Direct close button binding (clicking on X)
        var closeBtn = modal.querySelector('#sg-wa-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                closeModal(container, button);
            });
        }

        // Delegated clicks inside modal
        modal.addEventListener('click', function (e) {
            // Clicking on X close button
            var btn = e.target.closest('#sg-wa-close-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                closeModal(container, button);
                return;
            }

            // Clicking on team card / phone number
            var card = e.target.closest('.sg-wa-card');
            if (card) {
                try {
                    var teamKey = card.getAttribute('data-team') || 'advisory';
                    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
                        window.dataLayer.push({
                            event: 'whatsapp_advisory_click',
                            team: teamKey,
                            page_path: window.location.pathname || '/',
                            language: getCurrentLang()
                        });
                    }
                } catch (err) { }
                // Allow link navigation to process cleanly before closing
                setTimeout(function () {
                    closeModal(container, button);
                }, 300);
            }
        });

        // Clicking anywhere outside the container closes modal
        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) {
                closeModal(container, button);
            }
        });

        // Escape key closes modal
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closeModal(container, button);
            }
        });
    }

    function updateExistingWhatsAppLinks() {
        try {
            var lang = getCurrentLang();
            var defaultPhone = (lang === 'fa') ? '971541243007' : '97143578737';
            var existingLinks = document.querySelectorAll('a[href*="whatsapp.com"], a[href*="wa.me"]');
            existingLinks.forEach(function (a) {
                if (a.closest('#sg-whatsapp-widget')) return;
                var href = a.getAttribute('href') || '';
                if (!href.includes('97143578737') && !href.includes('971541243007')) {
                    a.setAttribute('href', 'https://wa.me/' + defaultPhone);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            });
        } catch (e) { }
    }

    window.updateWhatsAppWidget = createOrUpdateWidget;
    window.addEventListener('languageChanged', createOrUpdateWidget);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createOrUpdateWidget);
    } else {
        createOrUpdateWidget();
    }
})();
