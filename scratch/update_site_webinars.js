const fs = require('fs');
const path = require('path');

function updateHtmlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  const eol = isCrlf ? '\r\n' : '\n';

  // 1. Desktop Nav
  const desktopSearch = '<a class="hover:text-luxury-gold transition duration-200 py-2" data-i18n="nav.blog" href="/blog/">Blog</a>';
  const desktopReplace = desktopSearch + eol +
    '<span class="text-neutral-300 font-light">|</span>' + eol +
    '<a class="hover:text-luxury-gold transition duration-200 py-2 inline-flex items-center gap-1.5" href="/webinars/">' + eol +
    '<span data-i18n="nav.webinars">Webinars</span>' + eol +
    '<span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span>' + eol +
    '</a>';

  if (!content.includes('href="/webinars/"') && content.includes(desktopSearch)) {
    content = content.replace(desktopSearch, desktopReplace);
    console.log('Added desktop nav to', filePath);
  }

  // 2. Mobile Drawer
  const mobileSearch = 'data-i18n="mobileMenu.insightsBlog" href="/blog/" onclick="toggleMobileMenu()">Insights &amp; Blog</a></li>';
  const mobileReplace = mobileSearch + eol +
    '<li><a class="flex items-center justify-between hover:text-luxury-gold py-0.5" href="/webinars/" onclick="toggleMobileMenu()"><span data-i18n="mobileMenu.webinars">Webinars</span><span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>';

  if (content.includes(mobileSearch) && !content.includes('mobileMenu.webinars')) {
    content = content.replace(mobileSearch, mobileReplace);
    console.log('Added mobile drawer item to', filePath);
  }

  // 3. Footer Quick Links
  const footerSearch = 'data-i18n="footer.insightsBlog" href="/blog/">Insights &amp; Blog</a></li>';
  const footerReplace = footerSearch + eol +
    '<li><a class="hover:text-luxury-gold transition inline-flex items-center gap-1.5" href="/webinars/"><span data-i18n="footer.webinars">Webinars</span> <span class="inline-block text-[8px] leading-none px-1.5 py-0.5 rounded-full bg-[#786142] text-white tracking-wider font-bold" data-i18n="nav.newBadge">New</span></a></li>';

  if (content.includes(footerSearch) && !content.includes('footer.webinars')) {
    content = content.replace(footerSearch, footerReplace);
    console.log('Added footer quick link to', filePath);
  }

  // 4. Homepage banner (only for index.html)
  if (path.basename(filePath) === 'index.html' && path.dirname(filePath) === '.') {
    const statsEnd = '<!-- ABOUT US PREVIEW SECTION -->';
    const bannerHtml = '<!-- WEBINAR UPCOMING SESSION BANNER -->' + eol +
      '<section class="py-5 px-6 bg-[#FAF6EE] border-b border-neutral-200/70" id="webinar-homepage-banner">' + eol +
      '<div class="max-w-7xl mx-auto">' + eol +
      '<a class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#070E1A] text-white border border-white/10 hover:border-[#C5A880]/50 transition shadow-lg group" href="/webinars/dominica-second-passport-for-afghans/">' + eol +
      '<div class="flex items-center gap-3.5 min-w-0">' + eol +
      '<div class="w-10 h-10 rounded-xl bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">' + eol +
      '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"></rect><path d="M16 10l5-3v10l-5-3"></path></svg>' + eol +
      '</div>' + eol +
      '<div class="min-w-0 text-start">' + eol +
      '<b class="block text-sm sm:text-base font-bold text-white truncate" data-i18n="webinarBanner.title">Next live session: A Second Passport for Afghans: Introducing the Dominica Programme</b>' + eol +
      '<small class="block text-xs text-neutral-400 mt-0.5" data-i18n="webinarBanner.meta">Thursday 29 October · 20:00 Kabul / 19:30 Dubai · Free · Persian (Dari)</small>' + eol +
      '</div>' + eol +
      '</div>' + eol +
      '<span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#786142] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap transition shrink-0 shadow-md">' + eol +
      '<span data-i18n="webinarBanner.btn">Details &amp; Join</span>' + eol +
      '<i class="fa-solid fa-arrow-right text-[10px]"></i>' + eol +
      '</span>' + eol +
      '</a>' + eol +
      '</div>' + eol +
      '</section>' + eol +
      '<!-- ABOUT US PREVIEW SECTION -->';

    if (!content.includes('id="webinar-homepage-banner"') && content.includes(statsEnd)) {
      content = content.replace(statsEnd, bannerHtml);
      console.log('Added homepage banner to', filePath);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// Update primary pages
updateHtmlFile('index.html');
updateHtmlFile('aboutus/index.html');
updateHtmlFile('blog/index.html');
console.log('Done updating main site pages.');
