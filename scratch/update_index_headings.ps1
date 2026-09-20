$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$path = "$PWD\index.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# 1. Preloader h1 -> div
$content = $content.Replace(
    '<h1 class="font-serif text-2xl md:text-4xl tracking-[0.2em] uppercase text-neutral-900 mb-2 opacity-0 transform translate-y-4" id="preloader-title">SHARIF GROUP</h1>',
    '<div class="font-serif text-2xl md:text-4xl tracking-[0.2em] uppercase text-neutral-900 mb-2 opacity-0 transform translate-y-4 font-bold" id="preloader-title">SHARIF GROUP</div>'
)

# 2. Mega Menu dropdown h3 -> p
$content = $content.Replace(
    '<h3 class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.citizenshipTitle">Citizenship By Investment</h3>',
    '<p class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.citizenshipTitle">Citizenship By Investment</p>'
)
$content = $content.Replace(
    '<h3 class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.residencyTitle">Residency By Investment</h3>',
    '<p class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.residencyTitle">Residency By Investment</p>'
)
$content = $content.Replace(
    '<h3 class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.moreServicesTitle">Other Services</h3>',
    '<p class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.moreServicesTitle">Other Services</p>'
)
$content = $content.Replace(
    '<h3 class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.aboutTitle">About Sharif Group</h3>',
    '<p class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4" data-i18n="megaMenu.aboutTitle">About Sharif Group</p>'
)

# 3. Mega Menu h4 subheaders -> p
$content = $content.Replace(
    '<h4 class="text-[11px] font-bold tracking-[0.18em] uppercase text-luxury-gold mb-6 text-center lg:text-left" data-i18n="megaMenu.caribbeanPortfolios">Caribbean Portfolios</h4>',
    '<p class="text-[11px] font-bold tracking-[0.18em] uppercase text-luxury-gold mb-6 text-center lg:text-left" data-i18n="megaMenu.caribbeanPortfolios">Caribbean Portfolios</p>'
)
$content = $content.Replace(
    '<h4 class="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 mb-6 text-center lg:text-left" data-i18n="megaMenu.globalPortfolios">Global Portfolios</h4>',
    '<p class="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 mb-6 text-center lg:text-left" data-i18n="megaMenu.globalPortfolios">Global Portfolios</p>'
)
$content = $content.Replace(
    '<h4 class="text-[11px] font-bold tracking-[0.18em] uppercase text-luxury-gold mb-6 text-center lg:text-left" data-i18n="megaMenu.europeanPortfolios">European Portfolios</h4>',
    '<p class="text-[11px] font-bold tracking-[0.18em] uppercase text-luxury-gold mb-6 text-center lg:text-left" data-i18n="megaMenu.europeanPortfolios">European Portfolios</p>'
)
$content = $content.Replace(
    '<h4 class="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 mb-6 text-center lg:text-left" data-i18n="megaMenu.americasUAE">Americas &amp; UAE</h4>',
    '<p class="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 mb-6 text-center lg:text-left" data-i18n="megaMenu.americasUAE">Americas &amp; UAE</p>'
)

# 4. Hero Single H1 with who we are and what we do
$oldHero = '<h1 class="font-serif text-white font-normal tracking-tight drop-shadow-xl whitespace-nowrap">
<span class="dominica-hero-glow text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl cursor-pointer" data-i18n="hero.title">Welcome to Sharif Group</span>
</h1>'
$newHero = '<h1 class="font-serif text-white font-normal tracking-tight drop-shadow-xl flex flex-col items-center">
<span class="dominica-hero-glow text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl cursor-pointer" data-i18n="hero.title">Welcome to Sharif Group</span>
<span class="sr-only"> - Citizenship and Residency by Investment Advisory Dubai</span>
</h1>'
$content = $content.Replace($oldHero, $newHero)

# 5. Stats h3 -> div
$content = [regex]::Replace($content, '(?s)<h3 class="text-4xl md:text-5xl font-serif text-luxury-gold font-bold">(.*?)</h3>', '<div class="text-4xl md:text-5xl font-serif text-luxury-gold font-bold">$1</div>')

# 6. About Overview (Why Sharif Group) h3 -> h2
$oldAboutH3 = '<h3 class="font-serif text-3xl sm:text-4xl xl:text-5xl font-bold text-white leading-tight">
<span data-i18n="about.heading">Our Story &amp; Background:</span> <br/>
<span class="italic text-[#C5A880] font-serif font-normal" data-i18n="about.subheading">Sharif Group</span>
</h3>'
$newAboutH2 = '<h2 class="font-serif text-3xl sm:text-4xl xl:text-5xl font-bold text-white leading-tight">
<span data-i18n="about.heading">Our Story &amp; Background:</span> <br/>
<span class="italic text-[#C5A880] font-serif font-normal" data-i18n="about.subheading">Sharif Group</span>
</h2>'
$content = $content.Replace($oldAboutH3, $newAboutH2)

# 7. Services block intro heading h3 -> p (or stay h2)
$oldServIntro = '<h3 class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
<span data-i18n="services.heading">Our Services &amp;</span> <span class="italic text-luxury-gold font-serif font-normal" data-i18n="services.headingItalic">Pathways</span>
</h3>'
$newServIntro = '<p class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
<span data-i18n="services.heading">Our Services &amp;</span> <span class="italic text-luxury-gold font-serif font-normal" data-i18n="services.headingItalic">Pathways</span>
</p>'
$content = $content.Replace($oldServIntro, $newServIntro)

# 8. Pillars inside Services: h4 -> h2
$content = $content.Replace(
    '<h4 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.cbi.title">Citizenship by Investment</h4>',
    '<h2 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.cbi.title">Citizenship by Investment</h2>'
)
$content = $content.Replace(
    '<h4 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.rbi.title">Residency by Investment</h4>',
    '<h2 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.rbi.title">Residency by Investment</h2>'
)
$content = $content.Replace(
    '<h4 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.uaeGolden.title">UAE 10-Year Golden Visa</h4>',
    '<h2 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.uaeGolden.title">UAE 10-Year Golden Visa</h2>'
)
$content = $content.Replace(
    '<h4 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.realEstate.title">Prime Real Estate Advisory</h4>',
    '<h2 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.realEstate.title">Prime Real Estate Advisory</h2>'
)
$content = $content.Replace(
    '<h4 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.education.title">Educational Advisory</h4>',
    '<h2 class="font-serif text-base sm:text-2xl font-bold text-white leading-snug" data-i18n="services.education.title">Educational Advisory</h2>'
)

# 9. Pillar program items: h5 -> h3
$content = [regex]::Replace($content, '<h5 class="font-serif text-lg font-bold text-white"([^>]*)>(.*?)</h5>', '<h3 class="font-serif text-lg font-bold text-white"$1>$2</h3>')

# 10. Social Responsibility: h4 -> h2
$oldSocial = '<h4 class="font-serif text-2xl md:text-3xl font-bold text-white"><span data-i18n="socialResp.heading">Our Commitment to</span> <span class="italic text-[#C5A880] font-serif font-normal" data-i18n="socialResp.headingItalic">Social Responsibility</span></h4>'
$newSocial = '<h2 class="font-serif text-2xl md:text-3xl font-bold text-white"><span data-i18n="socialResp.heading">Our Commitment to</span> <span class="italic text-[#C5A880] font-serif font-normal" data-i18n="socialResp.headingItalic">Social Responsibility</span></h2>'
$content = $content.Replace($oldSocial, $newSocial)

# 11. Latest Articles (Blog): h3 -> h2, and card titles h4 -> h3
$oldBlog = '<h3 class="text-3xl md:text-5xl font-serif font-bold text-neutral-900 leading-tight"><span data-i18n="blog.heading">Latest</span> <span class="italic text-[#786142] font-serif font-normal" data-i18n="blog.headingItalic">Articles</span></h3>'
$newBlog = '<h2 class="text-3xl md:text-5xl font-serif font-bold text-neutral-900 leading-tight"><span data-i18n="blog.heading">Latest</span> <span class="italic text-[#786142] font-serif font-normal" data-i18n="blog.headingItalic">Articles</span></h2>'
$content = $content.Replace($oldBlog, $newBlog)

$content = [regex]::Replace(
    $content,
    '<h4 class="font-serif font-bold text-white text-base group-hover:text-luxury-gold transition leading-snug">(.*?)</h4>',
    '<h3 class="font-serif font-bold text-white text-base group-hover:text-luxury-gold transition leading-snug">$1</h3>'
)

# 12. Success Stories: h3 -> h2
$oldReviews = '<h3 class="font-serif text-3xl md:text-5xl text-white font-bold tracking-tight"><span data-i18n="reviews.heading">Success</span> <span class="italic text-luxury-gold font-serif font-normal" data-i18n="reviews.headingItalic">Stories</span></h3>'
$newReviews = '<h2 class="font-serif text-3xl md:text-5xl text-white font-bold tracking-tight"><span data-i18n="reviews.heading">Success</span> <span class="italic text-luxury-gold font-serif font-normal" data-i18n="reviews.headingItalic">Stories</span></h2>'
$content = $content.Replace($oldReviews, $newReviews)

# 13. Contact: h3 -> h2
$oldContact = '<h3 class="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mt-2"><span data-i18n="contact.heading">Book a Free</span> <span class="italic text-[#786142] font-serif font-normal" data-i18n="contact.headingItalic">Consultation</span></h3>'
$newContact = '<h2 class="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mt-2"><span data-i18n="contact.heading">Book a Free</span> <span class="italic text-[#786142] font-serif font-normal" data-i18n="contact.headingItalic">Consultation</span></h2>'
$content = $content.Replace($oldContact, $newContact)

# 14. Footer h4 -> p
$content = [regex]::Replace(
    $content,
    '<h4 class="text-\[11px\] uppercase tracking-\[0\.2em\] text-luxury-gold font-bold mb-(\d+)"([^>]*)>(.*?)</h4>',
    '<p class="text-[11px] uppercase tracking-[0.2em] text-luxury-gold font-bold mb-$1"$2>$3</p>'
)

[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
Write-Host "Updated index.html headings successfully!"
