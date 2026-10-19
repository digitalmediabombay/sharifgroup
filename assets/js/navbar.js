/* ==========================================================================
   Sharif Group — Universal Navigation Component (navbar.js)
   Single source of truth for Navbar, Mega-Menus & Drawer on ALL pages.
   Zero dependencies, full RTL/LTR support, automatic language detection.
   ========================================================================== */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__SG_NAVBAR_INITIALIZED__) return;
  window.__SG_NAVBAR_INITIALIZED__ = true;

  const I18N = {
    en: {
      langName: 'English',
      code: 'EN',
      dir: 'ltr',
      nav: {
        citizenship: 'Citizenship',
        residency: 'Residency',
        moreServices: 'Other Services',
        aboutUs: 'About Us',
        contact: 'Contact Us',
        blog: 'Blog',
        webinars: 'Webinars',
        eligibilityChecker: 'Eligibility Checker',
        bookConsultation: 'Book Consultation',
        newBadge: 'New',
        allCitizenship: 'All Citizenship Programs',
        caribbeanPortfolios: 'Caribbean Portfolios',
        globalPortfolios: 'Global Portfolios',
        allResidency: 'All Residency Programs',
        europeanPortfolios: 'European Portfolios',
        americasUAE: 'Americas & UAE',
        cbiTitle: 'Citizenship By Investment',
        rbiTitle: 'Residency By Investment',
        viewAllServices: 'View All Services',
        realEstate: 'Real Estate Advisory',
        education: 'Educational Advisory',
        socialResp: 'Social Responsibility',
        corporateIdentity: 'Corporate Identity',
        overview: 'Overview',
        aboutSharif: 'About Sharif Group',
        aboutFounder: 'About Founder | Ali Sharif',
        becomePartner: 'Become a Partner'
      },
      cbi: {
        dominica: 'Dominica | Passport',
        kitts: 'St. Kitts & Nevis | Passport',
        antigua: 'Antigua & Barbuda | Passport',
        lucia: 'Saint Lucia | Passport',
        grenada: 'Grenada | Passport',
        vanuatu: 'Vanuatu | Passport',
        saotome: 'São Tomé and Príncipe | Passport',
        nauru: 'Republic of Nauru | Passport'
      },
      rbi: {
        portugal: 'Portugal | Golden Visa',
        greece: 'Greece | Golden Visa',
        panama: 'Panama | Golden Visa',
        uae: 'United Arab Emirates | Golden Visa'
      }
    },
    ar: {
      langName: 'العربية',
      code: 'AR',
      dir: 'rtl',
      nav: {
        citizenship: 'الجنسية',
        residency: 'الإقامة',
        moreServices: 'خدمات أخرى',
        aboutUs: 'من نحن',
        contact: 'اتصل بنا',
        blog: 'المدونة',
        webinars: 'الندوات عبر الإنترنت',
        eligibilityChecker: 'التحقق من الأهلية',
        bookConsultation: 'حجز استشارة',
        newBadge: 'جديد',
        allCitizenship: 'جميع برامج الجنسية',
        caribbeanPortfolios: 'برامج الكاريبي',
        globalPortfolios: 'البرامج العالمية',
        allResidency: 'جميع برامج الإقامة',
        europeanPortfolios: 'برامج أوروبا',
        americasUAE: 'الأمريكتان والإمارات',
        cbiTitle: 'الجنسية عن طريق الاستثمار',
        rbiTitle: 'الإقامة عن طريق الاستثمار',
        viewAllServices: 'عرض جميع الخدمات',
        realEstate: 'الاستشارات العقارية',
        education: 'الاستشارات الأكاديمية',
        socialResp: 'المسؤولية الاجتماعية',
        corporateIdentity: 'الهوية المؤسسية',
        overview: 'نظرة عامة',
        aboutSharif: 'عن مجموعة شريف',
        aboutFounder: 'عن المؤسس | علي شريف',
        becomePartner: 'كن شريكاً لنا'
      },
      cbi: {
        dominica: 'دومينيكا | جواز السفر',
        kitts: 'سانت كيتس ونيفيس | جواز السفر',
        antigua: 'أنتيغوا وبربودا | جواز السفر',
        lucia: 'سانت لوسيا | جواز السفر',
        grenada: 'غرينادا | جواز السفر',
        vanuatu: 'فانواتو | جواز السفر',
        saotome: 'ساو تومي وبرينسيبي | جواز السفر',
        nauru: 'جمهورية ناورو | جواز السفر'
      },
      rbi: {
        portugal: 'البرتغال | التأشيرة الذهبية',
        greece: 'اليونان | التأشيرة الذهبية',
        panama: 'بنما | التأشيرة الذهبية',
        uae: 'الإمارات العربية المتحدة | التأشيرة الذهبية'
      }
    },
    fa: {
      langName: 'فارسی',
      code: 'FA',
      dir: 'rtl',
      nav: {
        citizenship: 'شهروندی',
        residency: 'اقامت',
        moreServices: 'خدمات دیگر',
        aboutUs: 'درباره ما',
        contact: 'تماس با ما',
        blog: 'وبلاگ',
        webinars: 'وبینارها',
        eligibilityChecker: 'بررسی واجد شرایط بودن',
        bookConsultation: 'رزرو مشاوره',
        newBadge: 'جدید',
        allCitizenship: 'تمام برنامه‌های شهروندی',
        caribbeanPortfolios: 'برنامه‌های کارائیب',
        globalPortfolios: 'برنامه‌های جهانی',
        allResidency: 'تمام برنامه‌های اقامت',
        europeanPortfolios: 'برنامه‌های اروپایی',
        americasUAE: 'قاره آمریکا و امارات',
        cbiTitle: 'شهروندی از طریق سرمایه‌گذاری',
        rbiTitle: 'اقامت از طریق سرمایه‌گذاری',
        viewAllServices: 'مشاهده همه خدمات',
        realEstate: 'مشاوره املاک و مستغلات',
        education: 'مشاوره تحصیلی',
        socialResp: 'مسئولیت اجتماعی',
        corporateIdentity: 'هویت سازمانی',
        overview: 'بررسی اجمالی',
        aboutSharif: 'درباره شریف گروپ',
        aboutFounder: 'درباره بنیان‌گذار | علی شریف',
        becomePartner: 'همکار ما شوید'
      },
      cbi: {
        dominica: 'دومینیکا | پاسپورت',
        kitts: 'سنت کیتس و نویس | پاسپورت',
        antigua: 'آنتیگوا و باربودا | پاسپورت',
        lucia: 'سنت لوسیا | پاسپورت',
        grenada: 'گرانادا | پاسپورت',
        vanuatu: 'وانواتو | پاسپورت',
        saotome: 'سائوتومه و پرنسیپ | پاسپورت',
        nauru: 'جمهوری نائورو | پاسپورت'
      },
      rbi: {
        portugal: 'پرتغال | ویزای طلایی',
        greece: 'یونان | ویزای طلایی',
        panama: 'پاناما | ویزای طلایی',
        uae: 'امارات متحده عربی | ویزای طلایی'
      }
    },
    zh: {
      langName: '中文',
      code: 'ZH',
      dir: 'ltr',
      nav: {
        citizenship: '公民身份',
        residency: '居留权',
        moreServices: '其他服务',
        aboutUs: '关于我们',
        contact: '联系我们',
        blog: '博客',
        webinars: '在线讲座',
        eligibilityChecker: '资格评估',
        bookConsultation: '预约咨询',
        newBadge: '新',
        allCitizenship: '所有入籍项目',
        caribbeanPortfolios: '加勒比投资入籍',
        globalPortfolios: '全球投资入籍',
        allResidency: '所有黄金签证项目',
        europeanPortfolios: '欧洲黄金签证',
        americasUAE: '美洲与阿联酋',
        cbiTitle: '投资入籍项目',
        rbiTitle: '投资居留项目',
        viewAllServices: '查看所有服务',
        realEstate: '迪拜房地产咨询',
        education: '留学教育咨询',
        socialResp: '企业社会责任',
        corporateIdentity: '公司介绍',
        overview: '概览',
        aboutSharif: '关于谢里夫集团',
        aboutFounder: '创始人简介 | 阿里·谢里夫',
        becomePartner: '成为合作伙伴'
      },
      cbi: {
        dominica: '多米尼克 | 护照',
        kitts: '圣基茨和尼维斯 | 护照',
        antigua: '安提瓜和巴布达 | 护照',
        lucia: '圣卢西亚 | 护照',
        grenada: '格林纳达 | 护照',
        vanuatu: '瓦努阿图 | 护照',
        saotome: '圣多美和普林西比 | 护照',
        nauru: '瑙鲁共和国 | 护照'
      },
      rbi: {
        portugal: '葡萄牙 | 黄金签证',
        greece: '希腊 | 黄金签证',
        panama: '巴拿马 | 黄金签证',
        uae: '阿拉伯联合酋长国 | 黄金签证'
      }
    }
  };

  // Helper functions
  function detectLang() {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/ar/') || path === '/ar') return 'ar';
    if (path.startsWith('/fa/') || path === '/fa') return 'fa';
    if (path.startsWith('/zh/') || path === '/zh') return 'zh';
    const htmlLang = (document.documentElement.lang || 'en').toLowerCase().substring(0, 2);
    if (['ar', 'fa', 'zh'].includes(htmlLang)) return htmlLang;
    return 'en';
  }

  function getRootSite() {
    return window.location.protocol === 'file:' ? 'https://www.sharifgroup.ae/' : '/';
  }

  function getLangPrefix(lang) {
    return lang === 'en' ? '' : lang + '/';
  }

  function getSwitchUrl(targetLang) {
    let clean = window.location.pathname.replace(/^\/(ar|fa|zh|en)(\/|$)/i, '/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    if (targetLang === 'en') {
      return clean + search + hash;
    }
    return '/' + targetLang + clean + search + hash;
  }

  function getAssetUrl(relPath) {
    if (window.location.protocol === 'file:') {
      const depth = (window.location.pathname.match(/\//g) || []).length;
      return relPath;
    }
    return '/' + relPath.replace(/^\/+/, '');
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Generate Navigation Markup
  function renderNavbarHTML() {
    const lang = detectLang();
    const data = I18N[lang] || I18N.en;
    const n = data.nav;
    const cbi = data.cbi;
    const rbi = data.rbi;
    const p = getLangPrefix(lang);
    const site = getRootSite();
    const homeUrl = site + p;
    const logoUrl = getAssetUrl('assets/images/logo.svg');

    // Language options
    const langs = ['en', 'ar', 'fa', 'zh'];
    const langOptionsHTML = langs.map(l => {
      const isCur = l === lang;
      return `<li class="sg-lang-item${isCur ? ' is-current' : ''}">
        <a href="${getSwitchUrl(l)}" data-lang="${l}">
          <span>${esc(I18N[l].langName)}</span>
          <small>${esc(I18N[l].code)}</small>
        </a>
      </li>`;
    }).join('');

    const drawerLangsHTML = langs.map(l => {
      const isCur = l === lang;
      return `<a href="${getSwitchUrl(l)}" class="sg-drawer-lang-btn${isCur ? ' is-active' : ''}" data-lang="${l}">
        ${esc(I18N[l].langName)}
      </a>`;
    }).join('');

    return `
    <div class="sg-header-inner">
      <!-- Left: Logo & Menu -->
      <div class="sg-brand-group">
        <a class="sg-brand" href="${homeUrl}" aria-label="Sharif Group Home">
          <img src="${logoUrl}" alt="Sharif Group" id="nav-logo" width="50" height="56">
        </a>
        <span class="sg-brand-sep" aria-hidden="true">|</span>

        <nav class="sg-main-nav" aria-label="Main Navigation">
          <!-- 1. Citizenship with Mega Menu -->
          <div class="sg-nav-item" data-sg-dd="cbi">
            <a class="sg-nav-link" href="${site + p}citizenshipbyinvestment/">
              <span>${esc(n.citizenship)}</span>
              <i class="fa-solid fa-chevron-down sg-chev"></i>
            </a>
            <div class="sg-mega-menu">
              <div class="sg-mm-inner">
                <div class="sg-mm-side">
                  <p class="sg-mm-title">${esc(n.cbiTitle)}</p>
                  <a class="sg-mm-all-btn" href="${site + p}citizenshipbyinvestment/">${esc(n.allCitizenship)}</a>
                </div>
                <div>
                  <span class="sg-mm-col-head">${esc(n.caribbeanPortfolios)}</span>
                  <ul class="sg-mm-list">
                    <li><a href="${site + p}programs/citizenshipbyinvestment/dominica/"><img src="https://flagcdn.com/dm.svg" alt="Dominica" class="sg-flag-icon"><span>${esc(cbi.dominica)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/stkitts/"><img src="https://flagcdn.com/kn.svg" alt="St. Kitts & Nevis" class="sg-flag-icon"><span>${esc(cbi.kitts)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/antiguaandbarbuda/"><img src="https://flagcdn.com/ag.svg" alt="Antigua & Barbuda" class="sg-flag-icon"><span>${esc(cbi.antigua)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/stlucia/"><img src="https://flagcdn.com/lc.svg" alt="Saint Lucia" class="sg-flag-icon"><span>${esc(cbi.lucia)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/grenada/"><img src="https://flagcdn.com/gd.svg" alt="Grenada" class="sg-flag-icon"><span>${esc(cbi.grenada)}</span></a></li>
                  </ul>
                </div>
                <div>
                  <span class="sg-mm-col-head sg-mm-col-head--alt">${esc(n.globalPortfolios)}</span>
                  <ul class="sg-mm-list">
                    <li><a href="${site + p}programs/citizenshipbyinvestment/vanuatu/"><img src="https://flagcdn.com/vu.svg" alt="Vanuatu" class="sg-flag-icon"><span>${esc(cbi.vanuatu)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/sao-tome-and-principe/"><img src="https://flagcdn.com/st.svg" alt="São Tomé and Príncipe" class="sg-flag-icon"><span>${esc(cbi.saotome)}</span></a></li>
                    <li><a href="${site + p}programs/citizenshipbyinvestment/nauru/"><img src="https://flagcdn.com/nr.svg" alt="Republic of Nauru" class="sg-flag-icon"><span>${esc(cbi.nauru)}</span></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <!-- 2. Residency with Mega Menu -->
          <div class="sg-nav-item" data-sg-dd="rbi">
            <a class="sg-nav-link" href="${site + p}residencybyinvestment/">
              <span>${esc(n.residency)}</span>
              <i class="fa-solid fa-chevron-down sg-chev"></i>
            </a>
            <div class="sg-mega-menu">
              <div class="sg-mm-inner">
                <div class="sg-mm-side">
                  <p class="sg-mm-title">${esc(n.rbiTitle)}</p>
                  <a class="sg-mm-all-btn" href="${site + p}residencybyinvestment/">${esc(n.allResidency)}</a>
                </div>
                <div>
                  <span class="sg-mm-col-head">${esc(n.europeanPortfolios)}</span>
                  <ul class="sg-mm-list">
                    <li><a href="${site + p}programs/residencybyinvestment/portugal/"><img src="https://flagcdn.com/pt.svg" alt="Portugal" class="sg-flag-icon"><span>${esc(rbi.portugal)}</span></a></li>
                    <li><a href="${site + p}programs/residencybyinvestment/greece/"><img src="https://flagcdn.com/gr.svg" alt="Greece" class="sg-flag-icon"><span>${esc(rbi.greece)}</span></a></li>
                  </ul>
                </div>
                <div>
                  <span class="sg-mm-col-head sg-mm-col-head--alt">${esc(n.americasUAE)}</span>
                  <ul class="sg-mm-list">
                    <li><a href="${site + p}programs/residencybyinvestment/panama/"><img src="https://flagcdn.com/pa.svg" alt="Panama" class="sg-flag-icon"><span>${esc(rbi.panama)}</span></a></li>
                    <li><a href="${site + p}programs/residencybyinvestment/uae/"><img src="https://flagcdn.com/ae.svg" alt="UAE" class="sg-flag-icon"><span>${esc(rbi.uae)}</span></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <!-- 3. Other Services with Mega Menu -->
          <div class="sg-nav-item" data-sg-dd="services">
            <a class="sg-nav-link" href="${site + p}realestate/">
              <span>${esc(n.moreServices)}</span>
              <i class="fa-solid fa-chevron-down sg-chev"></i>
            </a>
            <div class="sg-mega-menu">
              <div class="sg-mm-inner sg-mm-cards-layout">
                <div class="sg-mm-side">
                  <p class="sg-mm-title">${esc(n.moreServices)}</p>
                  <a class="sg-mm-all-btn" href="${site + p}realestate/">${esc(n.viewAllServices)}</a>
                </div>
                <div class="sg-mm-cards-grid">
                  <a class="sg-mm-card" href="${site + p}realestate/">
                    <img src="${getAssetUrl('assets/images/isdubairealestateago_3194a5.webp')}" alt="Real Estate" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.realEstate)}</span>
                  </a>
                  <a class="sg-mm-card" href="${site + p}educationaladvisory/">
                    <img src="${getAssetUrl('assets/images/photo-154133990719_46b647.webp')}" alt="Educational Advisory" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.education)}</span>
                  </a>
                  <a class="sg-mm-card" href="${site + p}socialresponsibility/">
                    <img src="${getAssetUrl('assets/images/photo-148852178799_7302db.webp')}" alt="Social Responsibility" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.socialResp)}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <!-- 4. About Us with Mega Menu -->
          <div class="sg-nav-item" data-sg-dd="about">
            <a class="sg-nav-link" href="${site + p}aboutus/">
              <span>${esc(n.aboutUs)}</span>
              <i class="fa-solid fa-chevron-down sg-chev"></i>
            </a>
            <div class="sg-mega-menu">
              <div class="sg-mm-inner sg-mm-cards-layout">
                <div class="sg-mm-side">
                  <p class="sg-mm-title">${esc(n.corporateIdentity)}</p>
                  <a class="sg-mm-all-btn" href="${site + p}aboutus/">${esc(n.overview)}</a>
                </div>
                <div class="sg-mm-cards-grid sg-mm-cards-grid--4">
                  <a class="sg-mm-card" href="${site + p}aboutus/">
                    <img src="${getAssetUrl('assets/images/dubai-office-2.webp')}" alt="About Sharif Group" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.aboutSharif)}</span>
                  </a>
                  <a class="sg-mm-card" href="${site + p}about-founder/">
                    <img src="${getAssetUrl('assets/images/Masoud_Sharif_3x2_60_dd0fff.webp')}" alt="Founder" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.aboutFounder)}</span>
                  </a>
                  <a class="sg-mm-card" href="${site + p}socialresponsibility/">
                    <img src="${getAssetUrl('assets/images/photo-148852178799_7302db.webp')}" alt="Social Responsibility" loading="lazy">
                    <div class="sg-mm-card-overlay"></div>
                    <span class="sg-mm-card-title">${esc(n.socialResp)}</span>
                  </a>
                  <a class="sg-mm-card" href="${site + p}partners/" style="border: 1px solid rgba(197, 168, 128, 0.45); background: #060a12;">
                    <div class="sg-mm-card-overlay" style="background: linear-gradient(180deg, rgba(6,10,18,0.3) 0%, rgba(6,10,18,0.95) 100%);"></div>
                    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; padding: 12px; text-align: center;">
                      <i class="fa-solid fa-handshake" style="color: var(--sg-gold); font-size: 18px; margin-bottom: 6px;"></i>
                      <span class="sg-mm-card-title" style="position: static; font-size: 10px;">${esc(n.becomePartner)}</span>
                      <span class="sg-badge-new" style="margin-top: 5px;">${esc(n.newBadge)}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <!-- 5. Direct links -->
          <div class="sg-nav-item">
            <a class="sg-nav-link" href="${site + p}contact/">${esc(n.contact)}</a>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <div class="sg-nav-item">
            <a class="sg-nav-link" href="${site + p}blog/">${esc(n.blog)}</a>
          </div>
          <span class="sg-nav-sep" aria-hidden="true">|</span>

          <div class="sg-nav-item">
            <a class="sg-nav-link" href="${site + p}webinars/">
              <span>${esc(n.webinars)}</span>
              <span class="sg-badge-new">${esc(n.newBadge)}</span>
            </a>
          </div>
        </nav>
      </div>

      <!-- Right Action Items -->
      <div class="sg-right-actions">
        <a class="sg-pill-btn sg-btn-eligibility" href="${site + p}eligibilitychecker/">
          ${esc(n.eligibilityChecker)}
        </a>
        <a class="sg-pill-btn sg-btn-consult" href="${site + p}contact/">
          ${esc(n.bookConsultation)}
        </a>

        <!-- Language Switcher Dropdown -->
        <div class="sg-lang-wrap" id="sgLangWrap">
          <button class="sg-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" id="sgLangBtn">
            <i class="fa-solid fa-globe"></i>
            <span>${esc(data.code)}</span>
            <i class="fa-solid fa-chevron-down sg-lang-arrow"></i>
          </button>
          <ul class="sg-lang-menu" id="sgLangMenu" role="menu">
            ${langOptionsHTML}
          </ul>
        </div>

        <!-- Mobile Hamburger Toggle -->
        <button class="sg-mob-toggle" type="button" aria-label="Toggle Navigation Menu" id="sgMobToggle">
          <span class="sg-mob-bar"></span>
          <span class="sg-mob-bar"></span>
          <span class="sg-mob-bar"></span>
        </button>
      </div>
    </div>
    `;
  }

  function renderDrawerHTML() {
    const lang = detectLang();
    const data = I18N[lang] || I18N.en;
    const n = data.nav;
    const cbi = data.cbi;
    const rbi = data.rbi;
    const p = getLangPrefix(lang);
    const site = getRootSite();

    const langs = ['en', 'ar', 'fa', 'zh'];
    const drawerLangsHTML = langs.map(l => {
      const isCur = l === lang;
      return `<a href="${getSwitchUrl(l)}" class="sg-drawer-lang-btn${isCur ? ' is-active' : ''}" data-lang="${l}">
        ${esc(I18N[l].langName)}
      </a>`;
    }).join('');

    return `
    <nav class="sg-drawer" id="sgDrawer" aria-label="Mobile Navigation">
      <div class="sg-drawer-langs">
        ${drawerLangsHTML}
      </div>

      <a class="sg-pill-btn sg-btn-eligibility" href="${site + p}eligibilitychecker/" style="width:100%;text-align:center;">
        ${esc(n.eligibilityChecker)}
      </a>

      <!-- Accordion: Citizenship -->
      <div class="sg-drawer-acc-item">
        <button class="sg-drawer-acc-head" type="button">
          <span>${esc(n.citizenship)}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <ul class="sg-drawer-acc-body">
          <li><a href="${site + p}citizenshipbyinvestment/" style="font-weight:700;color:var(--sg-gold-dark);">★ ${esc(n.allCitizenship)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/dominica/">${esc(cbi.dominica)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/stkitts/">${esc(cbi.kitts)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/antiguaandbarbuda/">${esc(cbi.antigua)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/stlucia/">${esc(cbi.lucia)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/grenada/">${esc(cbi.grenada)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/vanuatu/">${esc(cbi.vanuatu)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/sao-tome-and-principe/">${esc(cbi.saotome)}</a></li>
          <li><a href="${site + p}programs/citizenshipbyinvestment/nauru/">${esc(cbi.nauru)}</a></li>
        </ul>
      </div>

      <!-- Accordion: Residency -->
      <div class="sg-drawer-acc-item">
        <button class="sg-drawer-acc-head" type="button">
          <span>${esc(n.residency)}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <ul class="sg-drawer-acc-body">
          <li><a href="${site + p}residencybyinvestment/" style="font-weight:700;color:var(--sg-gold-dark);">★ ${esc(n.allResidency)}</a></li>
          <li><a href="${site + p}programs/residencybyinvestment/portugal/">${esc(rbi.portugal)}</a></li>
          <li><a href="${site + p}programs/residencybyinvestment/greece/">${esc(rbi.greece)}</a></li>
          <li><a href="${site + p}programs/residencybyinvestment/panama/">${esc(rbi.panama)}</a></li>
          <li><a href="${site + p}programs/residencybyinvestment/uae/">${esc(rbi.uae)}</a></li>
        </ul>
      </div>

      <!-- Accordion: Other Services -->
      <div class="sg-drawer-acc-item">
        <button class="sg-drawer-acc-head" type="button">
          <span>${esc(n.moreServices)}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <ul class="sg-drawer-acc-body">
          <li><a href="${site + p}realestate/">${esc(n.realEstate)}</a></li>
          <li><a href="${site + p}educationaladvisory/">${esc(n.education)}</a></li>
          <li><a href="${site + p}socialresponsibility/">${esc(n.socialResp)}</a></li>
        </ul>
      </div>

      <!-- Accordion: About Us -->
      <div class="sg-drawer-acc-item">
        <button class="sg-drawer-acc-head" type="button">
          <span>${esc(n.aboutUs)}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <ul class="sg-drawer-acc-body">
          <li><a href="${site + p}aboutus/">${esc(n.aboutSharif)}</a></li>
          <li><a href="${site + p}about-founder/">${esc(n.aboutFounder)}</a></li>
          <li><a href="${site + p}socialresponsibility/">${esc(n.socialResp)}</a></li>
          <li><a href="${site + p}partners/">${esc(n.becomePartner)}</a></li>
        </ul>
      </div>

      <!-- Direct Links -->
      <a class="sg-drawer-link-direct" href="${site + p}contact/">
        <span>${esc(n.contact)}</span>
        <i class="fa-solid fa-arrow-right"></i>
      </a>

      <a class="sg-drawer-link-direct" href="${site + p}blog/">
        <span>${esc(n.blog)}</span>
        <i class="fa-solid fa-arrow-right"></i>
      </a>

      <a class="sg-drawer-link-direct" href="${site + p}webinars/">
        <span>${esc(n.webinars)} <span class="sg-badge-new">${esc(n.newBadge)}</span></span>
        <i class="fa-solid fa-arrow-right"></i>
      </a>

      <!-- Bottom CTAs -->
      <div class="sg-drawer-ctas">
        <a class="sg-pill-btn sg-btn-consult" href="${site + p}contact/">
          ${esc(n.bookConsultation)}
        </a>
      </div>
    </nav>
    `;
  }

  // Bind interactive behavior
  function bindNavbarEvents(headerEl, drawerEl) {
    // 1. Language switcher toggle
    const langBtn = headerEl.querySelector('#sgLangBtn');
    const langWrap = headerEl.querySelector('#sgLangWrap');
    if (langBtn && langWrap) {
      langBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = langWrap.classList.toggle('is-open');
        langBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('click', function(e) {
        if (!langWrap.contains(e.target)) {
          langWrap.classList.remove('is-open');
          langBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 2. Mobile toggle
    const mobToggle = headerEl.querySelector('#sgMobToggle');
    if (mobToggle && drawerEl) {
      mobToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = drawerEl.classList.toggle('is-open');
        headerEl.classList.toggle('drawer-open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Close drawer when clicking any link inside
      drawerEl.addEventListener('click', function(e) {
        if (e.target.closest('a')) {
          drawerEl.classList.remove('is-open');
          headerEl.classList.remove('drawer-open');
          document.body.style.overflow = '';
        }
      });
    }

    // 3. Mobile accordions
    if (drawerEl) {
      const heads = drawerEl.querySelectorAll('.sg-drawer-acc-head');
      heads.forEach(h => {
        h.addEventListener('click', function() {
          const item = h.closest('.sg-drawer-acc-item');
          if (item) item.classList.toggle('is-open');
        });
      });
    }

    // 4. Header scroll shadow
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        headerEl.classList.add('is-scrolled');
      } else {
        headerEl.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  // Mount Navbar to Page
  function mountUniversalNavbar(targetSelector) {
    // Ensure font awesome & fonts are loaded
    if (!document.querySelector('link[href*="navbar.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = getAssetUrl('assets/css/navbar.css');
      document.head.appendChild(link);
    }

    let headerEl = null;
    if (targetSelector && typeof targetSelector === 'string') {
      headerEl = document.querySelector(targetSelector);
    }
    if (!headerEl) {
      headerEl = document.querySelector('header#main-header') ||
                 document.querySelector('header#siteHeader') ||
                 document.querySelector('header.site-header') ||
                 document.querySelector('header');
    }

    if (!headerEl) {
      headerEl = document.createElement('header');
      headerEl.className = 'site-header';
      headerEl.id = 'main-header';
      document.body.insertBefore(headerEl, document.body.firstChild);
    } else {
      headerEl.classList.add('site-header');
      if (!headerEl.id) headerEl.id = 'main-header';
    }

    // Remove legacy old mobile drawers if present to avoid dual menus
    const oldDrawers = document.querySelectorAll('#drawer, #mobile-menu-drawer');
    oldDrawers.forEach(d => {
      if (d.id !== 'sgDrawer') d.style.display = 'none';
    });

    // Remove legacy mega-dropdown blocks inside header to prevent layout collision
    const oldMega = headerEl.querySelectorAll('.mega-dropdown, .mega-menu');
    oldMega.forEach(m => m.remove());

    // Inject Navbar HTML
    headerEl.innerHTML = renderNavbarHTML();

    // Check or create Drawer
    let drawerEl = document.getElementById('sgDrawer');
    if (!drawerEl) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = renderDrawerHTML();
      drawerEl = tempDiv.firstElementChild;
      headerEl.insertAdjacentElement('afterend', drawerEl);
    } else {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = renderDrawerHTML();
      drawerEl.replaceWith(tempDiv.firstElementChild);
      drawerEl = document.getElementById('sgDrawer');
    }

    // Bind events
    bindNavbarEvents(headerEl, drawerEl);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountUniversalNavbar);
  } else {
    mountUniversalNavbar();
  }

  window.mountUniversalNavbar = mountUniversalNavbar;
})();
