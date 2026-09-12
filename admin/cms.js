'use strict';

// ─── CREDENTIALS (Demo) ───────────────────────────────────────
const CMS_CREDENTIALS = {
  email: 'admin@sharifgroup.ae',
  password: 'SharifCMS@2026',
  name: 'Sharif Group Administrator',
  role: 'Admin'
};

// ─── STORAGE KEYS ─────────────────────────────────────────────
const KEYS = {
  AUTH: 'sgcms_auth',
  HOMEPAGE: 'sgcms_homepage',
  CITIZENSHIP: 'sgcms_citizenship',
  RESIDENCY: 'sgcms_residency',
  BLOG: 'sgcms_blog',
  TEAM: 'sgcms_team',
  OFFICES: 'sgcms_offices',
  CONTACT: 'sgcms_contact',
  NAV: 'sgcms_navigation',
  LEGAL: 'sgcms_legal',
  SETTINGS: 'sgcms_settings',
  ABOUTUS: 'sgcms_aboutus'
};

// ─── AUTH ─────────────────────────────────────────────────────
const Auth = {
  login(email, password) {
    if (email.toLowerCase() === CMS_CREDENTIALS.email && password === CMS_CREDENTIALS.password) {
      sessionStorage.setItem(KEYS.AUTH, JSON.stringify({ email: CMS_CREDENTIALS.email, name: CMS_CREDENTIALS.name, role: CMS_CREDENTIALS.role, loginTime: new Date().toISOString() }));
      return { success: true };
    }
    return { success: false, error: 'Incorrect email or password.' };
  },
  logout() { sessionStorage.removeItem(KEYS.AUTH); window.location.href = 'index.html'; },
  getSession() { try { return JSON.parse(sessionStorage.getItem(KEYS.AUTH)); } catch { return null; } },
  isAuthenticated() { return !!this.getSession(); },
  requireAuth() { if (!this.isAuthenticated()) window.location.href = 'index.html'; }
};

// ─── STORE ────────────────────────────────────────────────────
const Store = {
  get(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  getOrDefault(key, def) { const v = this.get(key); return v !== null ? v : (typeof def === 'function' ? def() : JSON.parse(JSON.stringify(def))); }
};

// ─── SETTINGS ─────────────────────────────────────────────────
const Settings = {
  get() { return Store.getOrDefault(KEYS.SETTINGS, { gemini_api_key: '', site_name: 'Sharif Group', preview_url: '' }); },
  set(data) { Store.set(KEYS.SETTINGS, data); },
  getGeminiKey() { return this.get().gemini_api_key || ''; }
};

// ─── GEMINI AI TRANSLATION ────────────────────────────────────
const AI = {
  LANG_NAMES: { en: 'English', ar: 'Arabic', fa: 'Farsi (Persian)', zh: 'Chinese (Simplified)' },

  async translate(text, targetLang, sourceLang = 'en') {
    const apiKey = Settings.getGeminiKey();
    if (!apiKey) throw new Error('No Gemini API key configured. Go to Settings to add your key.');
    if (!text || !text.trim()) return '';

    const prompt = `You are a professional translator for a luxury citizenship and residency investment advisory firm. Translate the following text from ${this.LANG_NAMES[sourceLang]} to ${this.LANG_NAMES[targetLang]}. Maintain a formal, premium, high-end advisory tone appropriate for ultra-high-net-worth clients. Return ONLY the translated text, nothing else.\n\nText:\n${text}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err?.error?.message || 'Translation failed'); }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  },

  async translateAllFields(fields, targetLang, onProgress) {
    // fields: [{key, value}] — translates each and returns {key: translated}
    const results = {};
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (onProgress) onProgress(i + 1, fields.length, f.key);
      if (f.value && f.value.trim()) {
        results[f.key] = await this.translate(f.value, targetLang);
      } else {
        results[f.key] = '';
      }
    }
    return results;
  },

  async testKey(apiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }] })
    });
    return res.ok;
  }
};

// ─── DEFAULT DATA ─────────────────────────────────────────────
const DEFAULTS = {
  homepage: {
    hero: {
      en: {
        tagline: 'UPGRADE YOUR LIFE',
        headline: 'Welcome to Sharif Group',
        pathway_citizenship: 'Citizenship',
        pathway_residency: 'Residency',
        pathway_realestate: 'Real Estate',
        pathway_education: 'Educational Advisory',
        subheadline: 'Expert citizenship and residency by investment advisory. 100% government-approved. Business Bay, Dubai.',
        cta_primary: 'Book Free Consultation',
        cta_primary_link: 'contact/index.html',
        cta_secondary: 'Explore Programs',
        cta_secondary_link: 'citizenshipbyinvestment/index.html'
      },
      ar: {
        tagline: 'ارتقِ بحياتك',
        headline: 'مرحباً بكم في مجموعة شريف',
        pathway_citizenship: 'الجنسية',
        pathway_residency: 'الإقامة',
        pathway_realestate: 'العقارات',
        pathway_education: 'الاستشارات التعليمية',
        subheadline: 'استشارات متخصصة في الجنسية والإقامة عبر الاستثمار. معتمدة حكومياً. الخليج التجاري، دبي.',
        cta_primary: 'احجز استشارة مجانية',
        cta_primary_link: 'contact/index.html',
        cta_secondary: 'استكشف البرامج',
        cta_secondary_link: 'citizenshipbyinvestment/index.html'
      },
      fa: {
        tagline: 'زندگی خود را ارتقا دهید',
        headline: 'به گروه شریف خوش آمدید',
        pathway_citizenship: 'شهروندی',
        pathway_residency: 'اقامت',
        pathway_realestate: 'املاک و مستغلات',
        pathway_education: 'مشاوره تحصیلی',
        subheadline: 'مشاوره تخصصی اخذ شهروندی و اقامت از طریق سرمایه‌گذاری. تأیید رسمی دولتی. بیزینس بی، دبی.',
        cta_primary: 'رزرو مشاوره رایگان',
        cta_primary_link: 'contact/index.html',
        cta_secondary: 'مشاهده برنامه‌ها',
        cta_secondary_link: 'citizenshipbyinvestment/index.html'
      },
      zh: {
        tagline: '升级您的生活',
        headline: '欢迎来到谢里夫集团',
        pathway_citizenship: '公民身份',
        pathway_residency: '居留权',
        pathway_realestate: '房地产投资',
        pathway_education: '教育咨询',
        subheadline: '专业公民身份及居留权投资咨询。100%政府认证。迪拜商业湾。',
        cta_primary: '预约免费咨询',
        cta_primary_link: 'contact/index.html',
        cta_secondary: '探索项目',
        cta_secondary_link: 'citizenshipbyinvestment/index.html'
      }
    },
    stats: [
      { value: '10+', label_en: 'Years of Experience', label_ar: 'سنوات من الخبرة', label_fa: 'سال تجربه', label_zh: '年行业经验' },
      { value: '1000+', label_en: 'Successful CBI Cases', label_ar: 'حالات جنسية ناجحة', label_fa: 'پرونده موفق شهروندی', label_zh: '成功入籍案例' },
      { value: '100+', label_en: 'Residency & Education Cases', label_ar: 'حالات إقامة وتعليم', label_fa: 'پرونده اقامت و تحصیلی', label_zh: '居留及教育案例' },
      { value: '450+', label_en: 'Families Relocated', label_ar: 'عائلة تم نقلها', label_fa: 'خانواده مستقر شده', label_zh: '已安居家庭' }
    ],
    about: {
      en: {
        badge: 'INTRODUCTION',
        heading: 'OVERVIEW & Background:',
        subheading: 'Sharif Group',
        p1: 'Sharif Group is a trusted private consulting company based in Business Bay, Dubai. We help international clients and families secure legal second passports, residency visas, premium property investments, and student placements in top international universities.',
        p2: 'Our experienced team takes care of document preparation, background legal checks, and government clearance from start to finish, ensuring a straightforward, secure, and completely stress-free experience.',
        btn1_text: 'Read OVERVIEW',
        btn1_link: 'aboutus/index.html',
        btn2_text: 'Book Consultation',
        btn2_link: 'contact/index.html'
      },
      ar: {
        badge: 'مقدمة',
        heading: 'قصتنا وخبراتنا:',
        subheading: 'مجموعة شريف',
        p1: 'مجموعة شريف هي شركة استشارات خاصة موثوقة مقرها في الخليج التجاري، دبي. نساعد العملاء والعائلات الدولية في الحصول على جواز سفر ثانٍ قانوني وتأشيرات الإقامة والاستثمارات العقارية الفاخرة.',
        p2: 'يتولى فريقنا ذو الخبرة إعداد المستندات والفحوصات القانونية والتخليص الحكومي من البداية إلى النهاية لضمان تجربة آمنة وسلسة تماماً.',
        btn1_text: 'اقرأ قصتنا',
        btn1_link: 'aboutus/index.html',
        btn2_text: 'احجز استشارة',
        btn2_link: 'contact/index.html'
      },
      fa: {
        badge: 'معرفی',
        heading: 'داستان و پیشینه ما:',
        subheading: 'گروه شریف',
        p1: 'گروه شریف یک شرکت مشاوره خصوصی معتبر مستقر در بیزینس بی دبی است. ما به مشتریان و خانواده‌های بین‌المللی در دریافت پاسپورت دوم قانونی، ویزای اقامت، سرمایه‌گذاری املاک لوکس و پذیرش دانشگاه‌های برتر کمک می‌کنیم.',
        p2: 'تیم مجرب ما تمامی مراحل آماده‌سازی مدارک، بررسی‌های حقوقی و مجوزهای دولتی را از صفر تا صد با اطمینان کامل و بدون دغدغه به انجام می‌رساند.',
        btn1_text: 'خواندن داستان ما',
        btn1_link: 'aboutus/index.html',
        btn2_text: 'رزرو مشاوره',
        btn2_link: 'contact/index.html'
      },
      zh: {
        badge: '关于我们',
        heading: '我们的故事与背景：',
        subheading: '谢里夫集团',
        p1: '谢里夫集团是一家总部位于迪拜商业湾的知名专业咨询公司。我们协助全球客户及家庭合法获取第二本护照、居留签证、优质房产投资及世界顶级大学留学名额。',
        p2: '我们经验丰富的团队全程负责文件整理、背景合规审查以及政府审批流程，确保全程透明、安全、省心。',
        btn1_text: '了解我们的故事',
        btn1_link: 'aboutus/index.html',
        btn2_text: '预约咨询',
        btn2_link: 'contact/index.html'
      }
    },
    services: {
      badge: 'FEATURED PATHWAYS',
      heading: 'Our Services &',
      heading_italic: 'Pathways',
      description: 'Sovereign dual citizenship, European golden visas, Dubai luxury property portfolios, and Ivy League academic guidance.',
      pillar_cbi: {
        pillar_badge: 'Pillar 01 • Passports',
        title: 'Citizenship by Investment',
        p1: 'Getting a second citizenship gives you and your family the legal right to hold an extra passport. This opens up doors for easy global travel without needing visas ahead of time.',
        p2: 'Our team handles all paperwork, background checks, and official submissions so you do not have to worry about complicated rules.',
        items: [
          { id: 'dominica', title: 'Dominica | Passport', desc: 'Safe and peaceful Caribbean island offering straightforward legal passport processing without travel or language tests.', link: 'programs/citizenshipbyinvestment/dominica/index.html' },
          { id: 'stkitts', title: 'St. Kitts & Nevis | Passport', desc: 'The oldest and most trusted citizenship by investment program in the world, active since 1984 with dependable asset security.', link: 'programs/citizenshipbyinvestment/stkittis/index.html' },
          { id: 'antigua', title: 'Antigua & Barbuda | Passport', desc: 'The best and most cost-effective passport solution for large families, covering up to four members under one baseline fee.', link: 'programs/citizenshipbyinvestment/antiguaandbarbuda/index.html' },
          { id: 'lucia', title: 'Saint Lucia | Passport', desc: 'Flexible financial options with government-guaranteed bond investments that are 100% refundable after 5 years.', link: 'programs/citizenshipbyinvestment/stlucia/index.html' },
          { id: 'grenada', title: 'Grenada | Passport', desc: 'Powerful second passport providing direct qualification to apply for the USA E-2 Investor Visa to live and conduct business in America.', link: 'programs/citizenshipbyinvestment/greneda/index.html' },
          { id: 'vanuatu', title: 'Vanuatu | Passport', desc: 'The fastest legal citizenship pathway worldwide, delivered in 45 days with 100% remote processing.', link: 'programs/citizenshipbyinvestment/vanuatu/index.html' },
          { id: 'saotome', title: 'São Tomé and Príncipe | Passport', desc: 'Exclusive African island destination offering complete privacy, tax efficiency, and quiet citizenship by investment routes.', link: 'programs/citizenshipbyinvestment/sãotoméandpríncipe/index.html' },
          { id: 'nauru', title: 'Republic of Nauru | Passport', desc: 'Peaceful Pacific island citizenship offering zero residency requirements and straightforward remote management from Dubai.', link: 'programs/citizenshipbyinvestment/nauru/index.html' }
        ]
      },
      pillar_rbi: {
        pillar_badge: 'Pillar 02 • Residency',
        title: 'Residency by Investment',
        p1: 'Residency and Golden Visa programs allow you to live, work, and study in amazing countries like Portugal, Greece, Panama, and the UAE.',
        p2: 'We help you choose the best residency option based on your lifestyle and business goals. Our experts prepare all legal documents.',
        items: [
          { id: 'portugal', title: 'Portugal | Golden Visa', desc: 'European residency through regulated fund investments with a minimal 7 days per year stay requirement leading to EU citizenship.', link: 'programs/residencybyinvestment/portugal/index.html' },
          { id: 'greece', title: 'Greece | Golden Visa', desc: 'Permanent European residence cards and Schengen zone access granted through vetted real estate acquisitions.', link: 'programs/residencybyinvestment/greece/index.html' },
          { id: 'panama', title: 'Panama | Golden Visa', desc: 'International banking hub offering rapid permanent residency and complete offshore corporate tax exemptions.', link: 'programs/residencybyinvestment/panama/index.html' },
          { id: 'uae', title: 'United Arab Emirates | Golden Visa', desc: 'Secure 10-year residency for you and your family with zero personal income tax, world-class infrastructure, and direct Dubai clearing lanes.', link: 'programs/residencybyinvestment/uae/index.html' }
        ]
      },
      pillar_uae: {
        pillar_badge: 'Pillar 03 • Dubai Direct',
        title: 'UAE 10-Year Golden Visa',
        p1: 'The UAE Golden Visa gives investors, entrepreneurs, and skilled professionals the right to live in Dubai for 10 long years without needing a local sponsor.',
        p2: 'Our office in Business Bay, Dubai works directly with government authorities and the Dubai Land Department.',
        btn_text: 'View UAE Process',
        btn_link: 'programs/residencybyinvestment/uae/index.html'
      },
      pillar_realestate: {
        pillar_badge: 'Pillar 04 • Property Desk',
        title: 'Prime Real Estate Advisory',
        p1: 'Investing in real estate is one of the smartest ways to grow your wealth while securing a path to residency.',
        p2: 'Before you buy any property, our legal team checks all land titles, builder histories, and payment plans.',
        btn_text: 'Explore Properties',
        btn_link: 'realestate/index.html'
      },
      pillar_education: {
        pillar_badge: 'Pillar 05 • Academic Board',
        title: 'Educational Advisory',
        p1: 'Giving your children the best education opens up a bright future for them. We help families secure student placements in top boarding schools and famous universities.',
        p2: 'By pairing your university applications with a second citizenship or global residency, your children can qualify for domestic tuition rates.',
        btn_text: 'View Academic Advisory',
        btn_link: 'educationaladvisory/index.html'
      }
    },
    social_responsibility: {
      badge: 'COMMUNITY IMPACT & CHARITY',
      heading: 'Our Commitment to',
      heading_italic: 'Social Responsibility',
      description: 'Beyond global advisory, Sharif Group actively supports educational initiatives, vulnerable family assistance, and sustainable community developments.',
      btn_text: 'Explore Our Initiatives',
      btn_link: 'socialresponsibility/index.html'
    },
    reviews: {
      badge: 'CLIENT REVIEWS',
      heading: 'Success Stories',
      slides: [
        { id: 'r1', quote: '"Fast follow-up and straightforward documentation."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client1.png' },
        { id: 'r2', quote: '"Reliable advice based on real experience."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client2.jpg' },
        { id: 'r3', quote: '"Professional, structured, and transparent throughout."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client3.jpg' },
        { id: 'r4', quote: '"Great communication and support until approval."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client4.png' },
        { id: 'r5', quote: '"Extremely efficient process from start to finish."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client5.jpeg' },
        { id: 'r6', quote: '"Clear expectations and seamless delivery."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client6.jpeg' },
        { id: 'r7', quote: '"Exceptional guidance and advisory every step of the way."', btn_text: 'Start Your Journey Now', btn_link: 'contact/index.html', img: 'clients/client7.jpeg' }
      ]
    },
    contact_block: {
      badge: 'GET IN TOUCH',
      heading: 'Book a Free Consultation',
      subheading: 'Speak directly with our expert team in Dubai',
      office_label: 'Our Office',
      office_address: '116, The Binary Tower, Business Bay, Dubai, UAE',
      phone_label: 'Phone Number',
      phone: '+971 4 357 8737',
      email_label: 'Email Address',
      email: 'contact@sharifgroup.ae'
    }
  },
  citizenship: [
    {
      id: 'dominica',
      slug: 'dominica',
      flag: 'https://flagcdn.com/dm.svg',
      portfolio: 'caribbean',
      nav_visible: true,
      nav_sort: 1,
      status: 'published',
      en: {
        title: 'Dominica Citizenship by Investment',
        nav_label: 'Dominica | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$200,000 USD',
        processing_time: '6–9 Months',
        visa_free: '140+',
        overview_title: "Program Overview: Sharif Group's Guide",
        overview: "Dominica, known as the beautiful Nature Isle of the Caribbean, offers one of the most reliable and efficient second passport programs in the world. With quick processing speeds and a secure legal foundation, this program grants high-net-worth investors and their families instant global mobility. Our Business Bay firm guides your family securely from start to finish.",
        badges: [
          'Fully Remote, No Presence Requirements',
          '6-9 Months Time To Passport',
          'Contribution Starting from $200,000',
          '2 Investment Routes',
          '16+ Mandatory Interview Age'
        ],
        specs: [
          { title: 'PROCESSING TIME', desc: 'Approximately 6-9 months to complete' },
          { title: 'VISA-FREE TRAVEL', desc: 'Access to over 140+ countries worldwide' },
          { title: 'INVESTMENT TYPE', desc: 'Choose from economic donation or approved real estate' },
          { title: 'INVESTMENT COST', desc: 'USD 200,000 for single or USD 250,000 for family of 4' },
          { title: 'FAMILY DEPENDENTS', desc: 'Includes spouse, dependent children under 30, and dependent parents or grandparents above 65 years old' }
        ],
        benefits: [
          { title: 'Efficient Processing', desc: 'Citizenship achievable within 5 to 8 months.' },
          { title: 'Global Access', desc: 'Visa-free access to over 132 countries including the EU and UK.' },
          { title: 'Investment Flexibility', desc: 'Invest only after application approval, with options including donations or real estate.' },
          { title: 'Advantageous Tax Conditions', desc: 'Enjoy no taxation on worldwide income, gifts, wealth, or inheritance.' },
          { title: 'Inclusive Family Benefits', desc: 'Include dependent children under 30, unmarried daughters under 30, and dependent parents over 55.' },
          { title: 'Dual Citizenship', desc: 'Permitted without the need to renounce your current nationality.' },
          { title: 'Extended UK Stays', desc: 'Stay in the UK for up to 6 months at a time.' },
          { title: 'Flexible Residency Requirements', desc: 'Acquire citizenship without mandatory residency in Dominica.' }
        ],
        investment_options: [
          { title: '1. Economic Diversification Fund (EDF)', desc: 'Sovereign non-refundable contribution starting from $200,000 USD for a single applicant.' },
          { title: '2. Approved Real Estate Investment', desc: 'Purchase government-approved luxury resort or eco-villa shares starting from $200,000 USD.' }
        ],
        faqs: [
          { q: 'How long does the Dominica citizenship process take?', a: 'The typical timeline is 6 to 9 months from initial document submission to passport issuance.' },
          { q: 'Do I need to visit or reside in Dominica?', a: 'No, Dominica does not require any physical presence or residency before or after citizenship is granted.' }
        ]
      },
      ar: {
        title: 'الجنسية الدومينيكية عن طريق الاستثمار',
        nav_label: 'دومينيكا | جواز سفر',
        hero_subtitle: 'الجنسية عن طريق الاستثمار',
        investment_from: '$200,000 USD',
        processing_time: '6-9 أشهر',
        visa_free: '+140',
        overview_title: 'نظرة عامة على البرنامج: دليل مجموعة شريف',
        overview: 'تقدم دومينيكا، المعروفة بجزيرة الطبيعة في البحر الكاريبي، أحد أكثر برامج جوازات السفر الثانية موثوقية وكفاءة في العالم.',
        badges: ['عن بعد بالكامل، دون متطلبات حضور', '6-9 أشهر للحصول على الجواز', 'مساهمة تبدأ من 200,000 دولار', 'مساران استثماريان'],
        specs: [],
        benefits: [],
        investment_options: [],
        faqs: []
      },
      fa: {
        title: 'شهروندی دومینیکا از طریق سرمایه‌گذاری',
        nav_label: 'دومینیکا | پاسپورت',
        hero_subtitle: 'شهروندی از طریق سرمایه‌گذاری',
        investment_from: '$200,000 USD',
        processing_time: '۶ تا ۹ ماه',
        visa_free: '+۱۴۰',
        overview_title: 'بررسی جامع برنامه: راهنمای گروه شریف',
        overview: 'دومینیکا یکی از پایدارترین و معتبرترین برنامه‌های شهروندی از طریق سرمایه‌گذاری را ارائه می‌دهد.',
        badges: ['کاملاً غیرحضوری، بدون نیاز به اقامت', '۶ تا ۹ ماه تا صدور پاسپورت', 'شروع از ۲۰۰ هزار دلار', '۲ روش سرمایه‌گذاری'],
        specs: [],
        benefits: [],
        investment_options: [],
        faqs: []
      },
      zh: {
        title: '多米尼克投资入籍项目',
        nav_label: '多米尼克 | 护照',
        hero_subtitle: '投资入籍项目',
        investment_from: '$200,000美元',
        processing_time: '6-9个月',
        visa_free: '140+',
        overview_title: '项目概览：谢里夫集团指南',
        overview: '多米尼克被誉为加勒比海的“自然之岛”，提供全球最成熟且高效的第二护照投资入籍项目之一。',
        badges: ['全程远程办理，无居住要求', '6-9个月获发护照', '投资起价20万美元', '2种投资途径'],
        specs: [],
        benefits: [],
        investment_options: [],
        faqs: []
      }
    },
    {
      id: 'stkitts',
      slug: 'stkitts',
      flag: 'https://flagcdn.com/kn.svg',
      portfolio: 'caribbean',
      nav_visible: true,
      nav_sort: 2,
      status: 'published',
      en: {
        title: 'St. Kitts & Nevis Citizenship by Investment',
        nav_label: 'St. Kitts & Nevis | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$250,000 USD',
        processing_time: '3–6 Months',
        visa_free: '155+',
        overview: 'The oldest citizenship by investment program in the world, offering a prestigious passport and tax-free living since 1984.',
        benefits: [
          { title: 'Oldest CBI Program', desc: 'Established in 1984 with trusted global standing.' },
          { title: 'Visa-Free Access', desc: '155+ countries worldwide without advance visas.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية سانت كيتس ونيفيس', nav_label: 'سانت كيتس | جواز سفر', investment_from: '$250,000', processing_time: '3-6 أشهر', visa_free: '+155', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی سنت کیتس و نویس', nav_label: 'سنت کیتس | پاسپورت', investment_from: '$250,000', processing_time: '۳ تا ۶ ماه', visa_free: '+۱۵۵', overview: '', benefits: [], faqs: [] },
      zh: { title: '圣基茨和尼维斯投资入籍', nav_label: '圣基茨 | 护照', investment_from: '$250,000', processing_time: '3-6个月', visa_free: '155+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'antigua',
      slug: 'antigua',
      flag: 'https://flagcdn.com/ag.svg',
      portfolio: 'caribbean',
      nav_visible: true,
      nav_sort: 3,
      status: 'published',
      en: {
        title: 'Antigua & Barbuda Citizenship by Investment',
        nav_label: 'Antigua & Barbuda | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$100,000 USD',
        processing_time: '3–5 Months',
        visa_free: '150+',
        overview: 'Affordable Caribbean citizenship with excellent global mobility and family inclusion.',
        benefits: [
          { title: 'Best for Families', desc: 'Cost-effective for families up to 4 members.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية أنتيغوا وبربودا', nav_label: 'أنتيغوا | جواز سفر', investment_from: '$100,000', processing_time: '3-5 أشهر', visa_free: '+150', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی آنتیگوا و باربودا', nav_label: 'آنتیگوا | پاسپورت', investment_from: '$100,000', processing_time: '۳ تا ۵ ماه', visa_free: '+۱۵۰', overview: '', benefits: [], faqs: [] },
      zh: { title: '安提瓜和巴布达投资入籍', nav_label: '安提瓜 | 护照', investment_from: '$100,000', processing_time: '3-5个月', visa_free: '150+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'stlucia',
      slug: 'stlucia',
      flag: 'https://flagcdn.com/lc.svg',
      portfolio: 'caribbean',
      nav_visible: true,
      nav_sort: 4,
      status: 'published',
      en: {
        title: 'Saint Lucia Citizenship by Investment',
        nav_label: 'Saint Lucia | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$240,000 USD',
        processing_time: '3–4 Months',
        visa_free: '140+',
        overview: 'Saint Lucia offers a modern, prestigious Caribbean citizenship program with rapid processing through the National Economic Fund, real estate, or government bonds.',
        benefits: [
          { title: 'Visa-Free Mobility', desc: 'Access 140+ countries visa-free including EU Schengen and UK.' },
          { title: 'Remote Processing', desc: 'Zero physical residency or visit required before or after approval.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية سانت لوسيا عبر الاستثمار', nav_label: 'سانت لوسيا | جواز سفر', investment_from: '$240,000', processing_time: '3-4 أشهر', visa_free: '+140', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی سنت لوسیا از طریق سرمایه‌گذاری', nav_label: 'سنت لوسیا | پاسپورت', investment_from: '$240,000', processing_time: '۳ تا ۴ ماه', visa_free: '+۱۴۰', overview: '', benefits: [], faqs: [] },
      zh: { title: '圣卢西亚投资入籍', nav_label: '圣卢西亚 | 护照', investment_from: '$240,000', processing_time: '3-4个月', visa_free: '140+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'grenada',
      slug: 'grenada',
      flag: 'https://flagcdn.com/gd.svg',
      portfolio: 'caribbean',
      nav_visible: true,
      nav_sort: 5,
      status: 'published',
      en: {
        title: 'Grenada Citizenship by Investment',
        nav_label: 'Grenada | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$150,000 USD',
        processing_time: '4–6 Months',
        visa_free: '140+',
        overview: 'Grenada is the only Caribbean CBI program with a US E-2 Investor Visa treaty, enabling holders to reside and run a business in the United States.',
        benefits: [
          { title: 'USA E-2 Treaty', desc: 'Direct qualification to apply for the US E-2 Investor Visa.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية غرينادا', nav_label: 'غرينادا | جواز سفر', investment_from: '$150,000', processing_time: '4-6 أشهر', visa_free: '+140', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی گرنادا', nav_label: 'گرنادا | پاسپورت', investment_from: '$150,000', processing_time: '۴ تا ۶ ماه', visa_free: '+۱۴۰', overview: '', benefits: [], faqs: [] },
      zh: { title: '格林纳达投资入籍', nav_label: '格林纳达 | 护照', investment_from: '$150,000', processing_time: '4-6个月', visa_free: '140+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'vanuatu',
      slug: 'vanuatu',
      flag: 'https://flagcdn.com/vu.svg',
      portfolio: 'global',
      nav_visible: true,
      nav_sort: 1,
      status: 'published',
      en: {
        title: 'Vanuatu Citizenship by Investment',
        nav_label: 'Vanuatu | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$130,000 USD',
        processing_time: '30–60 Days',
        visa_free: '130+',
        overview: "World's fastest citizenship by investment program — complete remote approval in as little as 30 to 45 days.",
        benefits: [
          { title: 'Fastest in World', desc: 'Complete passport delivery in 45 days.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية فانواتو', nav_label: 'فانواتو | جواز سفر', investment_from: '$130,000', processing_time: '30-60 يوماً', visa_free: '+130', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی وانواتو', nav_label: 'وانواتو | پاسپورت', investment_from: '$130,000', processing_time: '۳۰ تا ۶۰ روز', visa_free: '+۱۳۰', overview: '', benefits: [], faqs: [] },
      zh: { title: '瓦努阿图投资入籍', nav_label: '瓦努阿图 | 护照', investment_from: '$130,000', processing_time: '30-60天', visa_free: '130+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'saotome',
      slug: 'sãotoméandpríncipe',
      flag: 'https://flagcdn.com/st.svg',
      portfolio: 'global',
      nav_visible: true,
      nav_sort: 2,
      status: 'published',
      en: {
        title: 'São Tomé & Príncipe Citizenship by Investment',
        nav_label: 'São Tomé and Príncipe | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$100,000 USD',
        processing_time: '2–3 Months',
        visa_free: '90+',
        overview: 'Official African island nation CBI offering fast-track dual citizenship, attractive tax neutrality, and emerging global mobility for forward-looking investors.',
        benefits: [
          { title: 'Affordable Entry', desc: 'Starting from $100,000 for single applicant.' },
          { title: 'Fast-Track Delivery', desc: 'Passport issued within 60 to 90 days with zero physical stay.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية ساو تومي وبرينسيبي', nav_label: 'ساو تومي | جواز سفر', investment_from: '$100,000', processing_time: '2-3 أشهر', visa_free: '+90', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی سائوتومه و پرنسیپ', nav_label: 'سائوتومه | پاسپورت', investment_from: '$100,000', processing_time: '۲ تا ۳ ماه', visa_free: '+۹۰', overview: '', benefits: [], faqs: [] },
      zh: { title: '圣多美和普林西比投资入籍', nav_label: '圣多美 | 护照', investment_from: '$100,000', processing_time: '2-3个月', visa_free: '90+', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'nauru',
      slug: 'nauru',
      flag: 'https://flagcdn.com/nr.svg',
      portfolio: 'global',
      nav_visible: true,
      nav_sort: 3,
      status: 'published',
      en: {
        title: 'Republic of Nauru Citizenship by Investment',
        nav_label: 'Republic of Nauru | Passport',
        hero_subtitle: 'Citizenship By Investment',
        investment_from: '$105,000 USD',
        processing_time: '3–4 Months',
        visa_free: '89+',
        overview: 'Official Pacific Climate Resilience citizenship by investment program granting rapid global mobility, remote filing from Dubai, and Commonwealth heritage privileges.',
        benefits: [
          { title: 'Climate Innovation Fund', desc: 'Government-backed contribution with strong international backing.' },
          { title: 'Zero Physical Presence', desc: 'Entire process handled securely through Sharif Group Business Bay.' }
        ],
        faqs: []
      },
      ar: { title: 'جنسية جمهورية ناورو', nav_label: 'جمهورية ناورو | جواز سفر', investment_from: '$105,000', processing_time: '3-4 أشهر', visa_free: '+89', overview: '', benefits: [], faqs: [] },
      fa: { title: 'شهروندی جمهوری نائورو', nav_label: 'جمهوری نائورو | پاسپورت', investment_from: '$105,000', processing_time: '۳ تا ۴ ماه', visa_free: '+۸۹', overview: '', benefits: [], faqs: [] },
      zh: { title: '瑙鲁共和国投资入籍', nav_label: '瑙鲁共和国 | 护照', investment_from: '$105,000', processing_time: '3-4个月', visa_free: '89+', overview: '', benefits: [], faqs: [] }
    }
  ],
  residency: [
    {
      id: 'portugal',
      slug: 'portugal',
      flag: 'https://flagcdn.com/pt.svg',
      portfolio: 'european',
      nav_visible: true,
      nav_sort: 1,
      status: 'published',
      en: {
        title: 'Portugal Golden Visa',
        nav_label: 'Portugal | Golden Visa',
        hero_subtitle: 'Residency By Investment',
        investment_from: '€500,000 EUR',
        processing_time: '6–12 Months',
        overview: 'Portugal Golden Visa offers European residency with a pathway to citizenship in 5 years and only 7 days per year stay requirement.',
        benefits: [
          { title: 'EU Residency', desc: 'Full Schengen travel and residence rights.' }
        ],
        faqs: []
      },
      ar: { title: 'التأشيرة الذهبية البرتغالية', nav_label: 'البرتغال | الذهبية', investment_from: '€500,000', processing_time: '6-12 شهراً', overview: '', benefits: [], faqs: [] },
      fa: { title: 'ویزای طلایی پرتغال', nav_label: 'پرتغال | ویزای طلایی', investment_from: '€500,000', processing_time: '۶ تا ۱۲ ماه', overview: '', benefits: [], faqs: [] },
      zh: { title: '葡萄牙黄金签证', nav_label: '葡萄牙 | 黄金签证', investment_from: '€500,000', processing_time: '6-12个月', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'greece',
      slug: 'greece',
      flag: 'https://flagcdn.com/gr.svg',
      portfolio: 'european',
      nav_visible: true,
      nav_sort: 2,
      status: 'published',
      en: {
        title: 'Greece Golden Visa',
        nav_label: 'Greece | Golden Visa',
        hero_subtitle: 'Residency By Investment',
        investment_from: '€250,000 EUR',
        processing_time: '3–6 Months',
        overview: 'Greece Golden Visa is among the most affordable EU residency programs granting permanent residence cards and Schengen zone access.',
        benefits: [
          { title: 'Affordable EU Residency', desc: 'Real estate investment from €250,000 with Schengen access.' }
        ],
        faqs: []
      },
      ar: { title: 'التأشيرة الذهبية اليونانية', nav_label: 'اليونان | الذهبية', investment_from: '€250,000', processing_time: '3-6 أشهر', overview: '', benefits: [], faqs: [] },
      fa: { title: 'ویزای طلایی یونان', nav_label: 'یونان | ویزای طلایی', investment_from: '€250,000', processing_time: '۳ تا ۶ ماه', overview: '', benefits: [], faqs: [] },
      zh: { title: '希腊黄金签证', nav_label: '希腊 | 黄金签证', investment_from: '€250,000', processing_time: '3-6个月', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'panama',
      slug: 'panama',
      flag: 'https://flagcdn.com/pa.svg',
      portfolio: 'americas',
      nav_visible: true,
      nav_sort: 3,
      status: 'published',
      en: {
        title: 'Panama Golden Visa & Permanent Residency',
        nav_label: 'Panama | Golden Visa',
        hero_subtitle: 'Residency By Investment',
        investment_from: '$200,000 USD',
        processing_time: '30–60 Days',
        overview: 'Panama Qualified Investor Visa provides permanent residency in 30 days via real estate or bank deposits, complete territorial tax freedom, and a direct citizenship pathway.',
        benefits: [
          { title: '30-Day Permanent Residency', desc: 'Immediate permanent resident status for the whole family.' },
          { title: '0% Foreign Income Tax', desc: 'Territorial tax system ensures zero tax on offshore earnings.' }
        ],
        faqs: []
      },
      ar: { title: 'التأشيرة الذهبية لبنما', nav_label: 'بنما | الذهبية', investment_from: '$200,000', processing_time: '30-60 يوماً', overview: '', benefits: [], faqs: [] },
      fa: { title: 'ویزای طلایی پاناما', nav_label: 'پاناما | ویزای طلایی', investment_from: '$200,000', processing_time: '۳۰ تا ۶۰ روز', overview: '', benefits: [], faqs: [] },
      zh: { title: '巴拿马黄金签证', nav_label: '巴拿马 | 黄金签证', investment_from: '$200,000', processing_time: '30-60天', overview: '', benefits: [], faqs: [] }
    },
    {
      id: 'uae',
      slug: 'uae',
      flag: 'https://flagcdn.com/ae.svg',
      portfolio: 'uae',
      nav_visible: true,
      nav_sort: 4,
      status: 'published',
      en: {
        title: 'UAE 10-Year Golden Visa',
        nav_label: 'UAE | 10-Year Golden Visa',
        hero_subtitle: 'Residency By Investment',
        investment_from: 'AED 2,000,000',
        processing_time: '2–4 Weeks',
        overview: 'The UAE Golden Visa grants 10-year renewable residency to investors, property owners, and entrepreneurs with zero personal income tax.',
        benefits: [
          { title: '10-Year Renewable', desc: 'Long-term stability in Dubai without local sponsor requirements.' }
        ],
        faqs: []
      },
      ar: { title: 'الإقامة الذهبية الإماراتية 10 سنوات', nav_label: 'الإمارات | الذهبية', investment_from: 'AED 2,000,000', processing_time: '2-4 أسابيع', overview: '', benefits: [], faqs: [] },
      fa: { title: 'ویزای طلایی ۱۰ ساله امارات', nav_label: 'امارات | ویزای طلایی', investment_from: 'AED 2,000,000', processing_time: '۲ تا ۴ هفته', overview: '', benefits: [], faqs: [] },
      zh: { title: '阿联酋10年黄金签证', nav_label: '阿联酋 | 黄金签证', investment_from: 'AED 200万', processing_time: '2-4周', overview: '', benefits: [], faqs: [] }
    }
  ],
  blog: [
    {
      id: 'b001',
      author: 'Sharif Group Editorial',
      category: 'Citizenship',
      tags: ['Dominica', 'Caribbean', '2026'],
      featured_img: 'https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp',
      publish_date: '2026-09-01',
      status_en: 'published',
      status_ar: 'published',
      status_fa: 'draft',
      status_zh: 'draft',
      en: {
        title: 'About Sharif Group: Who We Are and How We Help',
        slug: 'about-sharif-group',
        excerpt: 'Discover how our expert team in Business Bay, Dubai guides international families through secure legal second passport and residency pathways.',
        body: '<p>Discover how our expert team in Business Bay, Dubai guides international families through secure legal second passport and residency pathways...</p>',
        meta_title: 'CORPORATE IDENTITY| Dubai Advisory',
        meta_desc: 'Who we are and how we help.'
      },
      ar: { title: 'عن مجموعة شريف: من نحن وكيف نساعدك', slug: 'about-sharif-group', excerpt: '', body: '', meta_title: '', meta_desc: '' },
      fa: { title: 'درباره گروه شریف: ما کیستیم و چگونه کمک می‌کنیم', slug: 'about-sharif-group', excerpt: '', body: '', meta_title: '', meta_desc: '' },
      zh: { title: '关于谢里夫集团：我们是谁以及如何提供帮助', slug: 'about-sharif-group', excerpt: '', body: '', meta_title: '', meta_desc: '' }
    }
  ],
  team: [
    { id: 't001', name: 'Alireza Sharif', title: 'Founder & Chairman', dept: 'Executive Leadership', bio: 'Founder of Sharif Group with over 15 years in global mobility and investment migration advisory.', photo: 'alirezasharif.svg', linkedin: '', sort: 1, visible: true },
    { id: 't002', name: 'Sarah Al-Hassan', title: 'Head of Client Relations', dept: 'Client Services', bio: 'Leading client relations with expertise in UAE Golden Visa and European residency programs.', photo: '', linkedin: '', sort: 2, visible: true }
  ],
  offices: [
    { id: 'o001', name: 'Dubai Head Office', address: '116, The Binary Tower, Business Bay, Dubai, UAE', phone: '+971 4 357 8737', whatsapp: '+971 4 357 8737', email: 'contact@sharifgroup.ae', hours: 'Monday – Saturday: 9:00 AM – 7:00 PM', maps_url: 'https://maps.google.com/?q=25.187446,55.264193', visible: true }
  ],
  contact: {
    form_recipient: 'contact@sharifgroup.ae',
    thankyou_en: 'Thank you for your inquiry. Our team will be in touch within 24 hours.',
    thankyou_ar: 'شكراً على استفسارك. سيتواصل معك فريقنا خلال 24 ساعة.',
    thankyou_fa: 'ممنون از استعلام شما. تیم ما ظرف ۲۴ ساعت با شما تماس خواهد گرفت.',
    thankyou_zh: '感谢您的咨询。我们的团队将在24小时内与您联系。',
    consent_en: 'I agree to the Privacy Policy.',
    consent_ar: 'أوافق على سياسة الخصوصية.',
    consent_fa: 'با سیاست حریم خصوصی موافقم.',
    consent_zh: '我同意隐私政策。'
  },
  aboutus: {
    hero: {
      en: {
        badge: 'EXECUTIVE BRIEFING',
        title: 'About Sharif Group',
        subtitle: 'A premier migration, citizenship, and luxury investment advisory platform rooted in Business Bay, Dubai.',
        img: 'https://sharifgroup.ae/wp-content/uploads/2026/05/dubai-office-2.jpg.webp'
      }
    },
    overview: {
      en: {
        badge: 'WHO WE ARE',
        heading: 'Company Overview: Sharif Group',
        p1: 'Sharif Group is a dedicated private consulting company based in Business Bay, Dubai. We assist international clients and families with legal second passports, residency visas, premium property investments, and student placements in top international universities.',
        p2: 'Our team handles document preparation, background legal checks, and government clearance from start to finish, ensuring a straightforward and secure experience.',
        cta_text: 'Book Consultation',
        cta_link: '../contact/index.html'
      }
    },
    stats: [
      { value: '10+', label_en: 'Years of Experience' },
      { value: '1000+', label_en: 'Successful CBI Cases' },
      { value: '100+', label_en: 'Residency & Education Cases' },
      { value: '450+', label_en: 'Families Relocated' }
    ],
    architecture: {
      en: {
        badge: 'CORPORATE ARCHITECTURE',
        title: 'Three Companies. One Commitment.',
        desc: 'We structure our specialized operations under three dedicated corporate brands to deliver clean, transparent, and expert execution across every discipline.',
        c1_name: 'SHARIF GLOBAL DOCUMENTS CLEARING SERVICES L.L.C',
        c1_badge: 'Citizenship & Residency',
        c1_p1: 'Sharif Global helps families and investors get legal second passports and European residency cards. We handle all paperwork smoothly, check your documents carefully, and deal directly with government authorities.',
        c1_p2: 'We also guide your children with student admissions to top international schools and world-renowned universities abroad. Our team manages the legal attestation, translation, and complete file submissions.',
        c2_name: 'SHARIF STAR REAL ESTATE BROKER L.L.C',
        c2_badge: 'Real Estate Brokerage',
        c2_p1: 'Sharif Star is our official licensed real estate agency helping local and foreign buyers find premium homes across Dubai. We find luxury villas, high-floor apartments, and profitable off-plan projects in top neighborhoods.',
        c2_p2: 'We also structure high-value property purchases that qualify you directly for the 10-Year UAE Golden Visa. Our real estate brokers assist you through contract signing, title deed registration, and ongoing leasing.',
        c3_name: 'SHARIF CAPITAL COMMERCIAL BROKERS L.L.C',
        c3_badge: 'Capital & Brokerage',
        c3_p1: 'Sharif Capital is our specialized business brokerage branch connecting entrepreneurs and serious investors with solid commercial opportunities in Dubai and the GCC region.',
        c3_p2: 'We also help global business owners set up new companies, open corporate bank accounts, and structure joint business ventures with complete confidentiality.'
      }
    },
    founder: {
      en: {
        name: 'Ali Sharif',
        title: 'CEO & Founder, Sharif Group',
        badge: 'A MESSAGE FROM OUR FOUNDER',
        quote: 'A future where happy clients, positive community impact, and continuous progress guide everything we do.',
        p1: 'As the founder of Sharif Group, I, Ali Sharif, started this journey with a clear goal: to build real value for our clients and trusted partners. Today, with our hard-working team, we are proud to set high standards in second citizenship and global investment advisory.',
        p2: 'Over the past few years, our growth has been driven by honest effort and commitment. We have expanded our reach internationally, opening dedicated office hubs in both Dubai and London to serve our clients seamlessly.',
        photo: 'alisharif.webp',
        profile_link: 'https://sharifgroup.ae/ali-sharif/'
      }
    },
    cta: {
      en: {
        badge: 'EXECUTIVE ADVISORY DESK',
        heading: 'Schedule Your Expert Consultation Today',
        desc: 'Connect directly with our registered advisors at 116, The Binary Tower, Business Bay, Dubai to initialize your pre-vetting sequence.',
        btn_text: 'Request Executive Briefing',
        btn_link: '../contact/index.html'
      }
    }
  }
};

function getData(key) {
  const storeKey = key.startsWith('sgcms_') ? key : 'sgcms_' + key;
  const defKey = storeKey.replace('sgcms_', '');
  const stored = Store.getOrDefault(storeKey, DEFAULTS[defKey] || null);

  if (Array.isArray(stored) && Array.isArray(DEFAULTS[defKey])) {
    let updated = false;
    DEFAULTS[defKey].forEach(defItem => {
      if (defItem && defItem.id && !stored.some(s => s && s.id === defItem.id)) {
        stored.push(JSON.parse(JSON.stringify(defItem)));
        updated = true;
      }
    });
    // Auto-heal flags to ensure reliable display
    stored.forEach(item => {
      if (item && item.id) {
        const defMatch = DEFAULTS[defKey].find(d => d.id === item.id);
        if (defMatch && defMatch.flag) {
          if (!item.flag || item.flag.includes('Flag_of_Sao_Tome_and_Principe.svg') || item.flag.includes('wikimedia.org')) {
            item.flag = defMatch.flag;
            updated = true;
          }
        }
      }
    });
    if (updated) {
      Store.set(storeKey, stored);
    }
  }
  return stored;
}

function saveData(key, data) {
  const storeKey = key.startsWith('sgcms_') ? key : 'sgcms_' + key;
  Store.set(storeKey, data);
}

window.CMS = { Auth, Store, KEYS, DEFAULTS, getData, saveData, AI, Settings };
