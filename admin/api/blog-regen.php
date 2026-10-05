<?php
/**
 * Sharif Group CMS - Blog Listing Pre-Renderer / SSG Engine
 * 
 * Re-generates static HTML blog listing cards across all 4 language versions:
 *  - English: blog/index.html
 *  - Arabic:  ar/blog/index.html
 *  - Farsi:   fa/blog/index.html
 *  - Chinese: zh/blog/index.html
 * 
 * Injects pre-rendered static <article> cards directly into #all-blogs-grid so
 * visitors see newly published blogs instantly with ZERO pop-in delay, ZERO layout shift,
 * and 100% SEO accessibility.
 */

if (!function_exists('mapCategoryToDataCat')) {
    function mapCategoryToDataCat($cat, $subcat, $title = '', $slug = '') {
        $cat = strtolower((string)$cat);
        $subcat = strtolower((string)$subcat);
        $res = [];
        if (strpos($cat, 'citizen') !== false || strpos($subcat, 'citizen') !== false) $res[] = 'citizenship';
        if (strpos($cat, 'residen') !== false || strpos($subcat, 'residen') !== false) $res[] = 'residency';
        if (strpos($cat, 'golden') !== false || strpos($subcat, 'golden') !== false) $res[] = 'golden-visa';
        if (strpos($cat, 'estate') !== false || strpos($subcat, 'estate') !== false) $res[] = 'real-estate';
        if (strpos($cat, 'educat') !== false || strpos($subcat, 'educat') !== false) $res[] = 'educational';
        if (strpos($cat, 'company') !== false || strpos($cat, 'tax') !== false || strpos($subcat, 'company') !== false) $res[] = 'company';
        if (strpos($cat, 'sharif') !== false || strpos($subcat, 'sharif') !== false) $res[] = 'sharif';

        $knownSubs = [
            'dominica'   => 'dominica',
            'stkitts'    => 'st-kitts',
            'st-kitts'   => 'st-kitts',
            'antigua'    => 'antigua',
            'stlucia'    => 'saint-lucia',
            'saint-lucia'=> 'saint-lucia',
            'grenada'    => 'grenada',
            'vanuatu'    => 'vanuatu',
            'saotome'    => 'sao-tome',
            'sao-tome'   => 'sao-tome',
            'nauru'      => 'nauru',
            'portugal'   => 'portugal',
            'greece'     => 'greece',
            'panama'     => 'panama',
            'uae'        => 'uae'
        ];

        $titleLower = strtolower((string)$title);
        $slugLower = strtolower((string)$slug);
        foreach ($knownSubs as $pattern => $tag) {
            $spacePattern = str_replace('-', ' ', $pattern);
            if ($subcat === $pattern || strpos($subcat, $pattern) !== false || strpos($titleLower, $spacePattern) !== false || strpos($slugLower, $pattern) !== false) {
                if (!in_array($tag, $res)) $res[] = $tag;
                if (in_array($tag, ['dominica', 'st-kitts', 'antigua', 'saint-lucia', 'grenada', 'vanuatu', 'sao-tome', 'nauru'])) {
                    if (!in_array('citizenship', $res)) $res[] = 'citizenship';
                }
                if (in_array($tag, ['portugal', 'greece', 'panama', 'uae'])) {
                    if (!in_array('residency', $res)) $res[] = 'residency';
                }
            }
        }

        if (empty($res)) $res[] = 'citizenship';
        return implode(' ', array_unique($res));
    }
}

if (!function_exists('normalizeBlogImgUrl')) {
    function normalizeBlogImgUrl($url) {
        $u = trim((string)$url);
        if ($u === '') return '/assets/images/dubai-office-2.webp';
        if (preg_match('#^(https?:)?//#i', $u) || strpos($u, 'data:') === 0) return $u;
        $u = preg_replace('#^(\.\./)+#', '/', $u);
        if ($u[0] !== '/') $u = '/' . $u;
        return $u;
    }
}

/**
 * Main Regeneration Function
 */
function regenerateBlogListings($rootDir = null, $publishedSnapshot = null) {
    if (!$rootDir) {
        $rootDir = realpath(dirname(__DIR__, 2));
    }
    if (!$rootDir || !is_dir($rootDir)) {
        return ['success' => false, 'error' => 'Invalid root directory: ' . $rootDir];
    }

    $pubFile = $rootDir . '/admin/api/published_content.json';
    if ($publishedSnapshot === null) {
        if (!file_exists($pubFile)) {
            return ['success' => false, 'error' => 'published_content.json not found'];
        }
        $raw = file_get_contents($pubFile);
        $publishedSnapshot = json_decode($raw, true) ?: [];
    }

    $blogs = $publishedSnapshot['sgcms_blog'] ?? [];
    if (!is_array($blogs)) $blogs = [];

    // Blacklist check
    $deletedSlugs = array_map('strtolower', array_map('trim', $publishedSnapshot['sgcms_deleted_slugs'] ?? []));
    $delMap = array_flip($deletedSlugs);

    // Filter active published blogs
    $activeBlogs = [];
    foreach ($blogs as $b) {
        if (!is_array($b)) continue;
        if (!empty($b['deleted']) || ($b['status'] ?? '') === 'deleted') continue;

        $id = strtolower(trim($b['id'] ?? ''));
        $slug = strtolower(trim($b['slug'] ?? ($b['en']['slug'] ?? '')));
        if ($id && isset($delMap[$id])) continue;
        if ($slug && isset($delMap[$slug])) continue;

        $status = strtolower($b['status'] ?? ($b['status_en'] ?? ($b['en']['status'] ?? 'published')));
        if ($status === 'draft' || $status === 'hidden') continue;

        $activeBlogs[] = $b;
    }

    // Sort newest publish_date first
    usort($activeBlogs, function($a, $b) {
        $da = $a['publish_date'] ?? '2026-01-01';
        $db = $b['publish_date'] ?? '2026-01-01';
        return strcmp($db, $da);
    });

    $targets = [
        'en' => [
            'file'          => $rootDir . '/blog/index.html',
            'urlPrefix'     => '/blog/',
            'readMore'      => 'READ MORE',
            'isRtl'         => false
        ],
        'ar' => [
            'file'          => $rootDir . '/ar/blog/index.html',
            'urlPrefix'     => '/ar/blog/',
            'readMore'      => 'اقرأ المزيد',
            'isRtl'         => true
        ],
        'fa' => [
            'file'          => $rootDir . '/fa/blog/index.html',
            'urlPrefix'     => '/fa/blog/',
            'readMore'      => 'ادامه مطلب',
            'isRtl'         => true
        ],
        'zh' => [
            'file'          => $rootDir . '/zh/blog/index.html',
            'urlPrefix'     => '/zh/blog/',
            'readMore'      => '阅读更多',
            'isRtl'         => false
        ]
    ];

    $updatedFiles = [];
    $errors = [];

    foreach ($targets as $lang => $cfg) {
        $filePath = $cfg['file'];
        if (!file_exists($filePath)) {
            $errors[] = "Listing file not found for {$lang}: {$filePath}";
            continue;
        }

        $html = file_get_contents($filePath);
        if (!$html) {
            $errors[] = "Empty or unreadable file for {$lang}: {$filePath}";
            continue;
        }

        // 1. Build Cards HTML for this language
        $cardsHtml = '';
        foreach ($activeBlogs as $b) {
            $ld = $b[$lang] ?? ($b['en'] ?? $b);
            $title = trim($ld['title'] ?? ($b['en']['title'] ?? ($b['title'] ?? '')));
            if ($title === '') continue;

            $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ($ld['slug'] ?? $b['id'])));
            $id = trim($b['id'] ?? $slug);
            $imgUrl = normalizeBlogImgUrl($b['featured_img'] ?? '');
            $dataCat = mapCategoryToDataCat($b['category'] ?? '', $b['subcategory'] ?? '', $title, $slug);
            $href = $cfg['urlPrefix'] . rawurlencode($slug) . '/';
            $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeSlug = htmlspecialchars($slug, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeId = htmlspecialchars($id, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeImg = htmlspecialchars($imgUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $readMoreText = htmlspecialchars($cfg['readMore'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $dirAttr = $cfg['isRtl'] ? ' dir="rtl"' : '';

            $cardItem = <<<HTML
<!-- Pre-rendered CMS Blog Card: {$safeSlug} -->
<article class="space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog" data-cat="{$dataCat}" data-cms-blog-id="{$safeId}" data-cms-slug="{$safeSlug}" style="display: flex;" data-paginated="true"{$dirAttr}>
<div class="space-y-3">
<div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-md neon-card-hover border border-neutral-200/70">
<img alt="{$safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="{$safeImg}" onerror="this.onerror=null;this.src='/assets/images/dubai-office-2.webp'"/>
</div>
<h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">
    {$safeTitle}
</h4>
</div>
<a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start cursor-pointer" href="{$href}" onclick="openBlogDetailBySlug('{$safeSlug}', event)">
    {$readMoreText}
</a>
</article>
HTML;
            $cardsHtml .= $cardItem . "\n";
        }

        // 2. Prepare Injection Markers
        $markerStart = '<!-- CMS_PRE_RENDERED_BLOGS_START -->';
        $markerEnd   = '<!-- CMS_PRE_RENDERED_BLOGS_END -->';
        $blockContent = $markerStart . "\n" . ($cardsHtml !== '' ? $cardsHtml : '') . $markerEnd;

        // 3. Inject cards inside #all-blogs-grid
        if (strpos($html, $markerStart) !== false && strpos($html, $markerEnd) !== false) {
            // Replace existing block
            $pattern = '#' . preg_quote($markerStart, '#') . '.*?' . preg_quote($markerEnd, '#') . '#s';
            $html = preg_replace($pattern, $blockContent, $html);
        } else {
            // Insert directly inside the opening #all-blogs-grid tag
            $gridPattern = '#(<div[^>]*id=["\']all-blogs-grid["\'][^>]*>)#i';
            if (preg_match($gridPattern, $html)) {
                $html = preg_replace($gridPattern, "$1\n" . $blockContent, $html, 1);
            } else {
                $errors[] = "Could not find #all-blogs-grid in {$filePath}";
                continue;
            }
        }

        // 4. Inject Inline Pre-Rendered Data Script for Instant In-Memory Detail Loading
        $cleanActiveBlogsJson = json_encode($activeBlogs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $dataMarkerStart = '<!-- CMS_PRE_RENDERED_DATA_START -->';
        $dataMarkerEnd   = '<!-- CMS_PRE_RENDERED_DATA_END -->';
        $dataScript = <<<HTML
{$dataMarkerStart}
<script id="cms-pre-rendered-data">
window.__PRE_RENDERED_CMS_BLOGS = {$cleanActiveBlogsJson};
(function() {
    try {
        if (!window.articlesDatabase) window.articlesDatabase = {};
        var pBlogs = window.__PRE_RENDERED_CMS_BLOGS || [];
        var curLang = '{$lang}';
        pBlogs.forEach(function(b) {
            if (!b) return;
            var ld = b[curLang] || b.en || b;
            var s = b.slug || (b.en && b.en.slug) || ld.slug || b.id;
            if (!s) return;
            var cl = String(s).toLowerCase();
            var bId = String(b.id || '').toLowerCase();
            var enLd = b.en || b;
            var dFaqs = (ld.faqs && Array.isArray(ld.faqs) && ld.faqs.length) ? ld.faqs : ((enLd.faqs && Array.isArray(enLd.faqs) && enLd.faqs.length) ? enLd.faqs : (b.faqs || []));
            var entry = {
                title: ld.title || (b.en && b.en.title) || b.title,
                category: b.category || 'Citizenship',
                author: b.author || 'Sharif Group Advisory',
                date: b.publish_date || '2026-09-01',
                updated: b.publish_date || '2026-09-01',
                image: b.featured_img || '/assets/images/dubai-office-2.webp',
                content: ld.body || (b.en && b.en.body) || ('<p>' + (ld.excerpt || '') + '</p>'),
                faqs: dFaqs
            };
            window.articlesDatabase[cl] = entry;
            window.articlesDatabase[s] = entry;
            if (bId) window.articlesDatabase[bId] = entry;
        });
    } catch(e) {}
})();
</script>
{$dataMarkerEnd}
HTML;

        if (strpos($html, $dataMarkerStart) !== false && strpos($html, $dataMarkerEnd) !== false) {
            $dPattern = '#' . preg_quote($dataMarkerStart, '#') . '.*?' . preg_quote($dataMarkerEnd, '#') . '#s';
            $html = preg_replace($dPattern, $dataScript, $html);
        } else {
            // Place right before closing </head>
            if (stripos($html, '</head>') !== false) {
                $html = str_ireplace('</head>', $dataScript . "\n</head>", $html);
            }
        }

        // Write file back atomically
        $tempFile = $filePath . '.tmp.' . bin2hex(random_bytes(4));
        if (file_put_contents($tempFile, $html) !== false) {
            if (@rename($tempFile, $filePath)) {
                $updatedFiles[] = $filePath;
            } else {
                @unlink($tempFile);
                file_put_contents($filePath, $html);
                $updatedFiles[] = $filePath;
            }
        } else {
            $errors[] = "Failed to write temp file for {$filePath}";
        }
    }

    // Also generate dedicated static physical article pages (zero-redirect, instant loads)
    $staticRes = regenerateStaticArticlePages($rootDir, $activeBlogs, $deletedSlugs);
    if (!empty($staticRes['errors'])) {
        $errors = array_merge($errors, $staticRes['errors']);
    }

    return [
        'success'               => count($updatedFiles) > 0,
        'updatedFiles'          => $updatedFiles,
        'blogCount'             => count($activeBlogs),
        'generatedStaticPages'  => $staticRes['generatedPages'] ?? [],
        'staticCount'           => $staticRes['generatedCount'] ?? 0,
        'errors'                => $errors
    ];
}

/**
 * Generate dedicated physical standalone article pages for all active published CMS blogs:
 *  - English: blog/<slug>/index.html
 *  - Arabic:  ar/blog/<slug>/index.html
 *  - Farsi:   fa/blog/<slug>/index.html
 *  - Chinese: zh/blog/<slug>/index.html
 * 
 * Ensures that clicking a blog from any program page loads directly with ZERO redirection,
 * zero layout pop-in, and 100% pre-rendered content.
 */
function regenerateStaticArticlePages($rootDir, $activeBlogs, $deletedSlugs = []) {
    $generatedPages = [];
    $errors = [];

    // 1. Clean up deleted blog folders
    foreach ($deletedSlugs as $delSlug) {
        $delSlug = trim((string)$delSlug);
        if ($delSlug === '' || $delSlug === 'index.html' || $delSlug === 'blog') continue;
        $paths = [
            $rootDir . '/blog/' . $delSlug,
            $rootDir . '/ar/blog/' . $delSlug,
            $rootDir . '/fa/blog/' . $delSlug,
            $rootDir . '/zh/blog/' . $delSlug,
        ];
        foreach ($paths as $p) {
            if (is_dir($p)) {
                @unlink($p . '/index.html');
                @rmdir($p);
            }
        }
    }

    // 2. Base reference template files
    $masterTemplates = [
        'en' => [
            'file'    => $rootDir . '/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => '',
            'lang'    => 'en',
            'dir'     => 'ltr',
            'brand'   => ' | Sharif Group'
        ],
        'ar' => [
            'file'    => $rootDir . '/ar/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'ar/',
            'lang'    => 'ar',
            'dir'     => 'rtl',
            'brand'   => ' | مجموعة شريف'
        ],
        'fa' => [
            'file'    => $rootDir . '/fa/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'fa/',
            'lang'    => 'fa',
            'dir'     => 'rtl',
            'brand'   => ' | شریف گروپ'
        ],
        'zh' => [
            'file'    => $rootDir . '/zh/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'zh/',
            'lang'    => 'zh',
            'dir'     => 'ltr',
            'brand'   => ' | 谢里夫集团'
        ]
    ];

    $templateCache = [];
    foreach ($masterTemplates as $lang => $info) {
        if (file_exists($info['file'])) {
            $templateCache[$lang] = file_get_contents($info['file']);
        }
    }

    if (empty($templateCache['en'])) {
        return ['generatedCount' => 0, 'errors' => ['Master English template not found']];
    }

    foreach ($activeBlogs as $b) {
        if (!is_array($b)) continue;
        $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ($b['id'] ?? '')));
        if (!$slug || $slug === 'index.html' || $slug === 'blog') continue;

        $enSlug = trim($b['en']['slug'] ?? $slug);
        $arSlug = trim($b['ar']['slug'] ?? $slug);
        $faSlug = trim($b['fa']['slug'] ?? $slug);
        $zhSlug = trim($b['zh']['slug'] ?? $slug);

        $imgUrl = normalizeBlogImgUrl($b['featured_img'] ?? '');
        $fullImgUrl = (strpos($imgUrl, 'http') === 0) ? $imgUrl : ('https://sharifgroup.ae' . ($imgUrl[0] === '/' ? '' : '/') . $imgUrl);
        $author = trim($b['author'] ?? 'Sharif Group Advisory Desk');
        $pubDate = trim($b['publish_date'] ?? date('Y-m-d'));
        $dateFormatted = date('F Y', strtotime($pubDate));

        foreach ($masterTemplates as $lang => $info) {
            $tpl = $templateCache[$lang] ?? $templateCache['en'];
            $ld = $b[$lang] ?? ($b['en'] ?? $b);
            $title = trim($ld['title'] ?? ($b['en']['title'] ?? ($b['title'] ?? '')));
            if ($title === '') continue;

            $body = trim($ld['body'] ?? ($b['en']['body'] ?? ($b['body'] ?? '')));
            if ($body === '') {
                $body = '<p>' . htmlspecialchars($ld['excerpt'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
            }

            // Clean description
            $cleanText = trim(preg_replace('/\s+/', ' ', strip_tags($body)));
            $desc = trim($ld['meta_desc'] ?? ($ld['excerpt'] ?? ''));
            if ($desc === '') {
                $desc = function_exists('mb_substr') ? mb_substr($cleanText, 0, 155, 'UTF-8') : substr($cleanText, 0, 155);
            }

            $pageTitle = $title . $info['brand'];
            $safePageTitle = htmlspecialchars($pageTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeDesc = htmlspecialchars($desc, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $canonicalUrl = 'https://sharifgroup.ae/' . $info['prefix'] . 'blog/' . rawurlencode($slug) . '/';

            // Clone template
            $pageHtml = $tpl;

            // 1. Replace Title & Meta Title & Description
            $pageHtml = preg_replace('#<title>.*?</title>#is', '<title>' . $safePageTitle . '</title>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta[^>]+name="title"[^>]*>#is', '<meta name="title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta[^>]+name="description"[^>]*>#is', '<meta name="description" content="' . $safeDesc . '"/>', $pageHtml, 1);

            // 2. Replace Canonical & Hreflangs
            $pageHtml = preg_replace('#<link[^>]+rel="canonical"[^>]*>#is', '<link rel="canonical" href="' . $canonicalUrl . '" />', $pageHtml, 1);
            $hreflangs = <<<HREF
<link rel="alternate" hreflang="x-default" href="https://sharifgroup.ae/blog/{$enSlug}/" />
<link rel="alternate" hreflang="en" href="https://sharifgroup.ae/blog/{$enSlug}/" />
<link rel="alternate" hreflang="fa" href="https://sharifgroup.ae/fa/blog/{$faSlug}/" />
<link rel="alternate" hreflang="ar" href="https://sharifgroup.ae/ar/blog/{$arSlug}/" />
<link rel="alternate" hreflang="zh" href="https://sharifgroup.ae/zh/blog/{$zhSlug}/" />
HREF;
            $pageHtml = preg_replace('#<link[^>]+rel="alternate"[^>]+hreflang="x-default"[^>]*>.*?(?=<meta name="robots")#is', $hreflangs . "\n    ", $pageHtml, 1);

            // 3. Replace OpenGraph & Twitter
            $pageHtml = preg_replace('#<meta property="og:title"[^>]*>#is', '<meta property="og:title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta property="og:description"[^>]*>#is', '<meta property="og:description" content="' . $safeDesc . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta property="og:url"[^>]*>#is', '<meta property="og:url" content="' . $canonicalUrl . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta property="og:image"[^>]*>#is', '<meta property="og:image" content="' . htmlspecialchars($fullImgUrl, ENT_QUOTES, 'UTF-8') . '"/>', $pageHtml, 1);

            $pageHtml = preg_replace('#<meta name="twitter:title"[^>]*>#is', '<meta name="twitter:title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta name="twitter:description"[^>]*>#is', '<meta name="twitter:description" content="' . $safeDesc . '"/>', $pageHtml, 1);
            $pageHtml = preg_replace('#<meta name="twitter:image"[^>]*>#is', '<meta name="twitter:image" content="' . htmlspecialchars($fullImgUrl, ENT_QUOTES, 'UTF-8') . '"/>', $pageHtml, 1);

            // 4. Replace Breadcrumb title
            $pageHtml = preg_replace('#<span class="text-luxury-gold truncate max-w-\[200px\][^"]*">.*?</span>#is', '<span class="text-luxury-gold truncate max-w-[200px] sm:max-w-xs">' . $safeTitle . '</span>', $pageHtml, 1);

            // 5. Replace Hero H1
            $pageHtml = preg_replace('#<h1 class="font-serif[^"]*">.*?</h1>#is', '<h1 class="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 leading-tight">' . $safeTitle . '</h1>', $pageHtml, 1);

            // 6. Replace Author and Dates in Meta Bar
            $pageHtml = preg_replace('#<span>Sharif Group Advisory Desk</span>#is', '<span>' . htmlspecialchars($author, ENT_QUOTES, 'UTF-8') . '</span>', $pageHtml, 1);
            $pageHtml = preg_replace('#<span>August 2026</span>#is', '<span>' . $dateFormatted . '</span>', $pageHtml);

            // 7. Replace Featured Image
            $imgTag = '<img alt="' . $safeTitle . '" class="w-full h-full object-cover" src="' . htmlspecialchars($imgUrl, ENT_QUOTES, 'UTF-8') . '" onerror="this.src=\'/assets/images/dubai-office-2.webp\'"/>';
            $pageHtml = preg_replace('#<div class="aspect-video[^"]*">\s*<img[^>]+>\s*</div>#is', '<div class="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-200 bg-neutral-100">' . "\n                " . $imgTag . "\n            </div>", $pageHtml, 1);

            // 8. Replace Article Content Body
            $contentDiv = '<div class="article-content space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-light">' . "\n" . $body . "\n            </div>";
            $pageHtml = preg_replace('#<div class="article-content space-y-6[^"]*">.*?</div>\s*(?=<!-- FAQ ACCORDION SECTION)#is', $contentDiv . "\n\n            ", $pageHtml, 1);

            // 9. Replace FAQs if custom FAQs provided
            $faqs = $ld['faqs'] ?? ($b['faqs'] ?? []);
            if (is_array($faqs) && count($faqs) > 0) {
                $faqCol1 = '';
                $faqCol2 = '';
                $mid = max(1, (int)ceil(count($faqs) / 2));
                $textAlignClass = $info['dir'] === 'rtl' ? 'text-right' : 'text-left';
                $paddingClass = $info['dir'] === 'rtl' ? 'pl-3' : 'pr-3';

                foreach ($faqs as $fIdx => $faq) {
                    $q = htmlspecialchars($faq['q'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $a = htmlspecialchars($faq['a'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $faqItem = <<<FAQITEM
        <div class="border-b border-neutral-200 py-3.5">
            <button onclick="toggleBlogFAQ('faq-dyn-{$fIdx}')" class="w-full flex justify-between items-center focus:outline-none group {$textAlignClass}">
                <span class="text-xs uppercase tracking-wider font-bold text-neutral-800 group-hover:text-luxury-gold transition {$paddingClass}">
                    {$q}
                </span>
                <span class="text-neutral-400 transition-transform duration-300 shrink-0" id="icon-faq-dyn-{$fIdx}">
                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                </span>
            </button>
            <div id="content-faq-dyn-{$fIdx}" class="max-h-0 overflow-hidden transition-all duration-500 ease-in-out">
                <p class="text-xs text-neutral-600 leading-relaxed mt-2.5 font-light">
                    {$a}
                </p>
            </div>
        </div>
FAQITEM;
                    if ($fIdx < $mid) {
                        $faqCol1 .= $faqItem;
                    } else {
                        $faqCol2 .= $faqItem;
                    }
                }

                $faqGrid = <<<FAQGRID
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 text-start items-start">
                    <div class="flex flex-col">
{$faqCol1}                    </div>
                    <div class="flex flex-col">
{$faqCol2}                    </div>
                </div>
FAQGRID;
                $pageHtml = preg_replace('#<div class="grid grid-cols-1 lg:grid-cols-2[^"]*">.*?</div>\s*</div>\s*(?=<!-- SECTION: CONSULTATION FORM|<!-- FULL CONSULTATION)#is', $faqGrid . "\n            </div>\n\n            ", $pageHtml, 1);
            }

            // Output directory
            $outDir = ($lang === 'en') ? ($rootDir . '/blog/' . $slug) : ($rootDir . '/' . $lang . '/blog/' . $slug);
            if (!is_dir($outDir)) {
                @mkdir($outDir, 0755, true);
            }
            $outFile = $outDir . '/index.html';
            if (file_put_contents($outFile, $pageHtml) !== false) {
                $generatedPages[] = $outFile;
            } else {
                $errors[] = "Failed to write {$outFile}";
            }
        }
    }

    return [
        'generatedCount' => count($generatedPages),
        'generatedPages' => $generatedPages,
        'errors'         => $errors
    ];
}

// Allow direct HTTP / CLI invocation
if (php_sapi_name() === 'cli' || (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__)) {
    $rootDir = realpath(dirname(__DIR__, 2));
    $res = regenerateBlogListings($rootDir);
    if (php_sapi_name() === 'cli') {
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    } else {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($res, JSON_UNESCAPED_SLASHES);
    }
}
