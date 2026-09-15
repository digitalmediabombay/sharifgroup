/**
 * Sharif Group — Floating WhatsApp Action Widget
 * Specification: "Talk to an Advisor — WhatsApp Action"
 * Approved Destination: https://wa.me/971541243007 (+971 54 124 3007)
 */
(function () {
    'use strict';

    var WHATSAPP_DESTINATION = 'https://wa.me/971541243007';

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
                align-items: center;
                gap: 8px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                pointer-events: auto;
            }

            html[dir="rtl"] .sg-wa-widget-container {
                right: auto;
                left: 24px;
                left: max(24px, env(safe-area-inset-left, 24px));
                flex-direction: row-reverse;
            }

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
                outline: 3px solid #786142;
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

            /* Privacy safe pulse indicator */
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
            }
        `;
        document.head.appendChild(style);
    }

    var WA_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

    function createOrUpdateWidget() {
        injectStyles();

        var container = document.getElementById('sg-whatsapp-widget');
        var lang = getCurrentLang();
        var labelText = LABELS[lang] || LABELS['en'];
        var ariaLabel = ARIA_LABELS[lang] || ARIA_LABELS['en'];

        if (!container) {
            container = document.createElement('div');
            container.id = 'sg-whatsapp-widget';
            container.className = 'sg-wa-widget-container';

            var link = document.createElement('a');
            link.className = 'sg-wa-btn';
            link.id = 'sg-wa-action-btn';
            link.href = WHATSAPP_DESTINATION;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('role', 'link');
            link.setAttribute('aria-label', ariaLabel);

            link.innerHTML = `
                <span class="sg-wa-icon-wrap" aria-hidden="true">
                    ${WA_SVG}
                </span>
                <span class="sg-wa-label" id="sg-wa-label-text">${labelText}</span>
                <span class="sg-wa-pulse-dot" aria-hidden="true"></span>
            `;

            // Privacy-safe analytics tracking
            link.addEventListener('click', function () {
                try {
                    if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
                        window.dataLayer.push({
                            event: 'advisor_click',
                            page_path: window.location.pathname || '/',
                            language: getCurrentLang()
                        });
                    }
                } catch (e) {}
            });

            container.appendChild(link);
            document.body.appendChild(container);
        } else {
            var labelEl = document.getElementById('sg-wa-label-text');
            if (labelEl) labelEl.textContent = labelText;
            var linkEl = document.getElementById('sg-wa-action-btn');
            if (linkEl) {
                linkEl.href = WHATSAPP_DESTINATION;
                linkEl.setAttribute('aria-label', ariaLabel);
            }
        }

        // Update any existing site-wide WhatsApp destination that still uses 97143578737
        updateExistingWhatsAppLinks();
    }

    function updateExistingWhatsAppLinks() {
        try {
            var existingLinks = document.querySelectorAll('a[href*="97143578737"], a[href*="whatsapp.com"], a[href*="wa.me"]');
            existingLinks.forEach(function (a) {
                if (a.id === 'sg-wa-action-btn') return;
                var href = a.getAttribute('href') || '';
                if (href.includes('97143578737') || href.includes('whatsapp') || href.includes('wa.me')) {
                    a.setAttribute('href', WHATSAPP_DESTINATION);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            });
        } catch (e) {}
    }

    window.updateWhatsAppWidget = createOrUpdateWidget;

    // Listen to custom languageChanged event for instant reactive translation
    window.addEventListener('languageChanged', createOrUpdateWidget);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createOrUpdateWidget);
    } else {
        createOrUpdateWidget();
    }
})();
