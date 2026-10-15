const fs = require('fs');

// 1. Update aboutus/index.html
let aboutHtml = fs.readFileSync('aboutus/index.html', 'utf8');
const eolAbout = aboutHtml.includes('\r\n') ? '\r\n' : '\n';

const oldAboutNav = '<a class="hover:text-luxury-gold transition duration-200 py-2" data-i18n="nav.blog" href="/blog/" onmouseenter="closeAllMegaMenus()">Blog</a>';
const newAboutNav = oldAboutNav + eolAbout +
  '<span class="text-neutral-300 font-light">|</span>' + eolAbout +
  '<a class="hover:text-luxury-gold transition duration-200 py-2 inline-flex items-center gap-1.5" href="/webinars/" onmouseenter="closeAllMegaMenus()">' + eolAbout +
  '<span data-i18n="nav.webinars">Webinars</span>' + eolAbout +
  '<span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span>' + eolAbout +
  '</a>';

const oldAboutMob = '<a class="block text-neutral-800 hover:text-[#C5A880] pl-3" data-i18n="megaMenu.insights" href="/blog/" onclick="toggleMobileMenu()">Insights &amp; Blog</a>';
const newAboutMob = oldAboutMob + eolAbout +
  '<a class="flex items-center justify-between text-neutral-800 hover:text-[#C5A880] pl-3 py-0.5" href="/webinars/" onclick="toggleMobileMenu()"><span data-i18n="mobileMenu.webinars">Webinars</span><span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a>';

const oldAboutFoot = '<li><a class="hover:text-luxury-gold transition" data-i18n="megaMenu.insights" href="/blog/">Insights &amp; Blog</a></li>';
const newAboutFoot = oldAboutFoot + eolAbout +
  '<li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5" href="/webinars/"><span data-i18n="footer.webinars">Webinars</span> <span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>';

if (!aboutHtml.includes('href="/webinars/"') && aboutHtml.includes(oldAboutNav)) {
  aboutHtml = aboutHtml.replace(oldAboutNav, newAboutNav);
  aboutHtml = aboutHtml.replace(oldAboutMob, newAboutMob);
  aboutHtml = aboutHtml.replace(oldAboutFoot, newAboutFoot);
  fs.writeFileSync('aboutus/index.html', aboutHtml, 'utf8');
  console.log('Successfully updated aboutus/index.html');
}

// 2. Update blog/index.html
let blogHtml = fs.readFileSync('blog/index.html', 'utf8');
const eolBlog = blogHtml.includes('\r\n') ? '\r\n' : '\n';

const oldBlogNav = '<a class="hover:text-luxury-gold transition duration-200 py-2" data-i18n="nav.blog" href="/blog/" onmouseenter="closeAllMegaMenus()">Blog</a>';
const newBlogNav = oldBlogNav + eolBlog +
  '<span class="text-neutral-300 font-light">|</span>' + eolBlog +
  '<a class="hover:text-luxury-gold transition duration-200 py-2 inline-flex items-center gap-1.5" href="/webinars/" onmouseenter="closeAllMegaMenus()">' + eolBlog +
  '<span data-i18n="nav.webinars">Webinars</span>' + eolBlog +
  '<span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span>' + eolBlog +
  '</a>';

const oldBlogMob = '<a class="py-3 border-b border-neutral-200 hover:text-luxury-gold transition block" data-i18n="nav.blog" href="/blog/" onclick="toggleMobileMenu()">INSIGHTS &amp; BLOG</a>';
const newBlogMob = oldBlogMob + eolBlog +
  '<a class="py-3 border-b border-neutral-200 hover:text-luxury-gold transition flex items-center justify-between" href="/webinars/" onclick="toggleMobileMenu()"><span data-i18n="mobileMenu.webinars">WEBINARS</span><span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a>';

const oldBlogFoot = '<li><a class="hover:text-luxury-gold transition" data-i18n="megaMenu.insights" href="/blog/">Insights &amp; Blog</a></li>';
const newBlogFoot = oldBlogFoot + eolBlog +
  '<li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5" href="/webinars/"><span data-i18n="footer.webinars">Webinars</span> <span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>';

const targetContentBody = '<div class="space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-light" id="detail-content-body">' + eolBlog +
'<!-- Dynamic paragraphs and subheadings will be injected here -->' + eolBlog +
'</div>';

const webinarCardSnippet = targetContentBody + eolBlog +
'<!-- WEBINAR CALLOUT CARD FOR CITIZENSHIP / DOMINICA ARTICLES -->' + eolBlog +
'<div class="hidden pt-6 pb-2" id="detail-webinar-card">' + eolBlog +
'  <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5 items-center p-6 rounded-2xl bg-[#070E1A] text-white border border-white/10 shadow-xl">' + eolBlog +
'    <div class="bg-[#050B14] border border-white/10 rounded-xl p-4 text-center">' + eolBlog +
'      <b class="block font-serif text-3xl sm:text-4xl text-[#C5A880] leading-none mb-1" id="dwc-day">29</b>' + eolBlog +
'      <span class="text-[11px] text-neutral-300 uppercase tracking-wider block" id="dwc-month">Oct · 20:00</span>' + eolBlog +
'    </div>' + eolBlog +
'    <div class="space-y-2 text-start">' + eolBlog +
'      <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A880] flex items-center gap-1.5">' + eolBlog +
'        <i class="fa-solid fa-video text-[10px]"></i> <span id="dwc-eyebrow">UPCOMING LIVE WEBINAR · FREE</span>' + eolBlog +
'      </span>' + eolBlog +
'      <h4 class="font-serif text-lg sm:text-xl font-bold text-white leading-snug" id="dwc-title">A Second Passport for Afghans: Introducing the Dominica Programme</h4>' + eolBlog +
'      <p class="text-xs text-neutral-300 font-light leading-relaxed line-clamp-2" id="dwc-excerpt">Free online session in Persian (Dari): what Dominica\'s citizenship programme is, why it matters for Afghans, and who can apply.</p>' + eolBlog +
'      <div class="pt-2">' + eolBlog +
'        <a class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#786142] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-wider transition shadow-md" id="dwc-link" href="/webinars/dominica-second-passport-for-afghans/">' + eolBlog +
'          <span id="dwc-btn">Webinar Details &amp; Registration</span>' + eolBlog +
'          <i class="fa-solid fa-arrow-right text-[10px]"></i>' + eolBlog +
'        </a>' + eolBlog +
'      </div>' + eolBlog +
'    </div>' + eolBlog +
'  </div>' + eolBlog +
'</div>';

if (!blogHtml.includes('href="/webinars/"') && blogHtml.includes(oldBlogNav)) {
  blogHtml = blogHtml.replace(oldBlogNav, newBlogNav);
  blogHtml = blogHtml.replace(oldBlogMob, newBlogMob);
  blogHtml = blogHtml.replace(oldBlogFoot, newBlogFoot);
  if (blogHtml.includes(targetContentBody)) {
    blogHtml = blogHtml.replace(targetContentBody, webinarCardSnippet);
  }
  
  // Inject logic in openBlogDetailBySlug to show the webinar card on related articles
  const renderMarker = 'updateBlogArticleSeo(article, activeSlug, currentLang);';
  const webinarLogic = renderMarker + eolBlog +
  '                // Check if related to Dominica or Citizenship to show Webinar Promo Card' + eolBlog +
  '                try {' + eolBlog +
  '                    var cardEl = document.getElementById("detail-webinar-card");' + eolBlog +
  '                    if (cardEl) {' + eolBlog +
  '                        var checkText = ((article.category || "") + " " + (article.subcategory || "") + " " + (activeSlug || "") + " " + (article.title || "")).toLowerCase();' + eolBlog +
  '                        if (checkText.indexOf("dominica") !== -1 || checkText.indexOf("citizenship") !== -1 || checkText.indexOf("passport") !== -1 || checkText.indexOf("afghan") !== -1) {' + eolBlog +
  '                            cardEl.classList.remove("hidden");' + eolBlog +
  '                            var prefix = (currentLang && currentLang !== "en") ? "/" + currentLang : "";' + eolBlog +
  '                            var linkEl = document.getElementById("dwc-link");' + eolBlog +
  '                            if (linkEl) linkEl.href = prefix + "/webinars/dominica-second-passport-for-afghans/";' + eolBlog +
  '                            if (currentLang === "fa") {' + eolBlog +
  '                                document.getElementById("dwc-day").textContent = "۸";' + eolBlog +
  '                                document.getElementById("dwc-month").textContent = "عقرب · ۲۰:۰۰";' + eolBlog +
  '                                document.getElementById("dwc-eyebrow").textContent = "وبینار زنده بعدی · رایگان";' + eolBlog +
  '                                document.getElementById("dwc-title").textContent = "پاسپورت دوم برای افغان‌ها: آشنایی با برنامه دومینیکا";' + eolBlog +
  '                                document.getElementById("dwc-excerpt").textContent = "جلسه آنلاین و رایگان به فارسی (دری): برنامه شهروندی دومینیکا چیست، چرا برای افغان‌ها مهم است و چه کسانی می‌توانند درخواست بدهند.";' + eolBlog +
  '                                document.getElementById("dwc-btn").textContent = "جزئیات وبینار و ثبت نام";' + eolBlog +
  '                            } else if (currentLang === "ar") {' + eolBlog +
  '                                document.getElementById("dwc-day").textContent = "29";' + eolBlog +
  '                                document.getElementById("dwc-month").textContent = "أكتوبر · 20:00";' + eolBlog +
  '                                document.getElementById("dwc-eyebrow").textContent = "الندوة المباشرة القادمة · مجاناً";' + eolBlog +
  '                                document.getElementById("dwc-title").textContent = "جواز سفر ثانٍ للأفغان: التعريف ببرنامج دومينيكا";' + eolBlog +
  '                                document.getElementById("dwc-excerpt").textContent = "جلسة مجانية عبر الإنترنت باللغة الفارسية (الدرية): ما هو برنامج جنسية دومينیکا ولماذا يهم الأفغان.";' + eolBlog +
  '                                document.getElementById("dwc-btn").textContent = "تفاصيل الندوة والتسجيل";' + eolBlog +
  '                            } else if (currentLang === "zh") {' + eolBlog +
  '                                document.getElementById("dwc-day").textContent = "29";' + eolBlog +
  '                                document.getElementById("dwc-month").textContent = "10月 · 20:00";' + eolBlog +
  '                                document.getElementById("dwc-eyebrow").textContent = "即将开播的网络研讨会 · 免费";' + eolBlog +
  '                                document.getElementById("dwc-title").textContent = "阿富汗人的第二本护照：多米尼克入籍项目介绍";' + eolBlog +
  '                                document.getElementById("dwc-excerpt").textContent = "免费在线讲座（波斯语/达利语）：多米尼克投资入籍项目是什么、为何对阿富汗人重要。";' + eolBlog +
  '                                document.getElementById("dwc-btn").textContent = "研讨会详情与报名";' + eolBlog +
  '                            }' + eolBlog +
  '                        } else {' + eolBlog +
  '                            cardEl.classList.add("hidden");' + eolBlog +
  '                        }' + eolBlog +
  '                    }' + eolBlog +
  '                } catch(e) {}';
  
  if (blogHtml.includes(renderMarker)) {
    blogHtml = blogHtml.replace(renderMarker, webinarLogic);
  }

  fs.writeFileSync('blog/index.html', blogHtml, 'utf8');
  console.log('Successfully updated blog/index.html');
}
