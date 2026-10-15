<?php
$files = [
    'en' => __DIR__ . '/../blog/what-is-dominica-citizenship-by-investment/index.html',
    'ar' => __DIR__ . '/../ar/blog/what-is-dominica-citizenship-by-investment/index.html',
    'fa' => __DIR__ . '/../fa/blog/what-is-dominica-citizenship-by-investment/index.html',
    'zh' => __DIR__ . '/../zh/blog/what-is-dominica-citizenship-by-investment/index.html',
];

$dropdownBlock = function($lang, $slug) {
    $activeEn = ($lang === 'en') ? ' active-lang' : '';
    $activeAr = ($lang === 'ar') ? ' active-lang' : '';
    $activeFa = ($lang === 'fa') ? ' active-lang' : '';
    $activeZh = ($lang === 'zh') ? ' active-lang' : '';

    return <<<DD
<div class="hidden absolute right-0 mt-2 w-44 bg-white/95 rounded-2xl shadow-2xl border border-neutral-200/80 py-2 z-50 overflow-hidden" id="lang-dropdown-menu">
<a href="/blog/{$slug}/" class="lang-option{$activeEn}" data-lang="en" onclick="switchLanguage('en', event)">
<span data-i18n="langSwitcher.en">English</span>
<span class="text-[10px] text-neutral-400">EN</span>
</a>
<a href="/ar/blog/{$slug}/" class="lang-option{$activeAr}" data-lang="ar" onclick="switchLanguage('ar', event)">
<span class="font-medium" data-i18n="langSwitcher.ar">العربية</span>
<span class="text-[10px] text-neutral-400">AR</span>
</a>
<a href="/fa/blog/{$slug}/" class="lang-option{$activeFa}" data-lang="fa" onclick="switchLanguage('fa', event)">
<span class="font-medium" data-i18n="langSwitcher.fa">فارسی</span>
<span class="text-[10px] text-neutral-400">FA</span>
</a>
<a href="/zh/blog/{$slug}/" class="lang-option{$activeZh}" data-lang="zh" onclick="switchLanguage('zh', event)">
<span class="font-medium" data-i18n="langSwitcher.zh">中文</span>
<span class="text-[10px] text-neutral-400">ZH</span>
</a>
</div>
DD;
};

$mobileBlock = function($lang, $slug) {
    $activeEn = ($lang === 'en') ? ' active-lang' : '';
    $activeAr = ($lang === 'ar') ? ' active-lang' : '';
    $activeFa = ($lang === 'fa') ? ' active-lang' : '';
    $activeZh = ($lang === 'zh') ? ' active-lang' : '';

    return <<<MB
<div class="mobile-lang-grid">
<a href="/blog/{$slug}/" class="lang-option{$activeEn}" data-lang="en" onclick="switchLanguage('en', event)">English</a>
<a href="/ar/blog/{$slug}/" class="lang-option{$activeAr}" data-lang="ar" onclick="switchLanguage('ar', event)">العربية</a>
<a href="/fa/blog/{$slug}/" class="lang-option{$activeFa}" data-lang="fa" onclick="switchLanguage('fa', event)">فارسی</a>
<a href="/zh/blog/{$slug}/" class="lang-option{$activeZh}" data-lang="zh" onclick="switchLanguage('zh', event)">中文</a>
</div>
MB;
};

$slug = 'what-is-dominica-citizenship-by-investment';

foreach ($files as $lang => $file) {
    if (!file_exists($file)) continue;
    $c = file_get_contents($file);
    if (substr($c, 0, 3) === "\xEF\xBB\xBF") {
        $c = substr($c, 3);
    }

    // 1. Convert all ../../assets/ and ../assets/ to /assets/
    $c = str_replace(
        ['../../assets/', '../assets/'],
        ['/assets/', '/assets/'],
        $c
    );

    // 2. Replace language dropdown
    $c = preg_replace(
        '#<div class="hidden absolute right-0 mt-2 w-44[^"]*" id="lang-dropdown-menu">.*?</div>#is',
        $dropdownBlock($lang, $slug),
        $c,
        1
    );

    // 3. Replace mobile language grid
    $c = preg_replace(
        '#<div class="mobile-lang-grid">.*?</div>#is',
        $mobileBlock($lang, $slug),
        $c,
        1
    );

    // 4. Update current-lang-text badge
    $badge = strtoupper($lang);
    $c = preg_replace(
        '#<span id="current-lang-text">.*?</span>#is',
        '<span id="current-lang-text">' . $badge . '</span>',
        $c,
        1
    );

    // 5. Update FAQ header if non-English
    if ($lang === 'zh') {
        $c = preg_replace('#<i class="fa-regular fa-circle-question"></i>\s*Desk Answers#is', '<i class="fa-regular fa-circle-question"></i> 专家解答', $c, 1);
        $c = preg_replace('#<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">Program Integrity &amp; FAQs</h2>#is', '<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">项目合规与常见问题解答</h2>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Clear and comprehensive answers regarding legal, investment, and residency parameters</p>#is', '<p class="text-xs text-neutral-500">关于合规审查、办理周期及法律保障的常见问题解答。</p>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Common questions regarding compliance, processing times, and legal safeguards\.</p>#is', '<p class="text-xs text-neutral-500">关于合规审查、办理周期及法律保障的常见问题解答。</p>', $c, 1);
    } elseif ($lang === 'ar') {
        $c = preg_replace('#<i class="fa-regular fa-circle-question"></i>\s*Desk Answers#is', '<i class="fa-regular fa-circle-question"></i> إجابات الخبراء', $c, 1);
        $c = preg_replace('#<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">Program Integrity &amp; FAQs</h2>#is', '<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">النزاهة والأسئلة الشائعة للبرنامج</h2>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Clear and comprehensive answers regarding legal, investment, and residency parameters</p>#is', '<p class="text-xs text-neutral-500">أسئلة شائعة حول الامتثال، والمدد الزمنية للمعالجة، والضمانات القانونية.</p>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Common questions regarding compliance, processing times, and legal safeguards\.</p>#is', '<p class="text-xs text-neutral-500">أسئلة شائعة حول الامتثال، والمدد الزمنية للمعالجة، والضمانات القانونية.</p>', $c, 1);
    } elseif ($lang === 'fa') {
        $c = preg_replace('#<i class="fa-regular fa-circle-question"></i>\s*Desk Answers#is', '<i class="fa-regular fa-circle-question"></i> پاسخ‌های کارشناسان', $c, 1);
        $c = preg_replace('#<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">Program Integrity &amp; FAQs</h2>#is', '<h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">سلامت برنامه‌ها و سوالات متداول</h2>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Clear and comprehensive answers regarding legal, investment, and residency parameters</p>#is', '<p class="text-xs text-neutral-500">سوالات متداول در خصوص انطباق قانونی، زمان‌بندی بررسی و ضمانت‌های حقوقی.</p>', $c, 1);
        $c = preg_replace('#<p class="text-xs text-neutral-500">Common questions regarding compliance, processing times, and legal safeguards\.</p>#is', '<p class="text-xs text-neutral-500">سوالات متداول در خصوص انطباق قانونی، زمان‌بندی بررسی و ضمانت‌های حقوقی.</p>', $c, 1);
    }

    file_put_contents($file, $c);
    echo "Master template updated: {$lang} ({$file})\n";
}
echo "Done fixing master templates!\n";
