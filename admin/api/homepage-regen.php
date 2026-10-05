<?php
/**
 * Sharif Group CMS - Homepage & Static Pages SSG Pre-Renderer
 * 
 * Pre-renders static HTML for:
 *  - Homepage: index.html, ar/index.html, fa/index.html, zh/index.html
 *  - About Us: aboutus/index.html, ar/aboutus/index.html, fa/aboutus/index.html, zh/aboutus/index.html
 *  - Contact:  contact/index.html, ar/contact/index.html, fa/contact/index.html, zh/contact/index.html
 * 
 * Re-bakes updated content directly into static HTML on publish so that:
 * 1. Zero millisecond render delay (Frame 1 instant display).
 * 2. Zero layout shift / pop-in.
 * 3. 100% SEO accessible to web crawlers and social share scrapers.
 */

if (!function_exists('ssgReplaceI18nElement')) {
    function ssgReplaceI18nElement($html, $i18nKey, $newText, $isHtml = false) {
        if ($newText === null) return $html;
        $str = trim((string)$newText);
        if ($str === '') return $html;

        $safeText = $isHtml ? $str : htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        // 1. Match data-i18n="key"
        $pattern = '#(<([a-zA-Z0-9]+)[^>]*\bdata-i18n="' . preg_quote($i18nKey, '#') . '"[^>]*>)(.*?)(</\2>)#us';
        if (preg_match($pattern, $html)) {
            $html = preg_replace($pattern, '${1}' . $safeText . '${4}', $html, 1);
        }

        // 2. Match data-i18n-html="key"
        $patternHtml = '#(<([a-zA-Z0-9]+)[^>]*\bdata-i18n-html="' . preg_quote($i18nKey, '#') . '"[^>]*>)(.*?)(</\2>)#us';
        if (preg_match($patternHtml, $html)) {
            $html = preg_replace($patternHtml, '${1}' . $safeText . '${4}', $html, 1);
        }

        return $html;
    }
}

if (!function_exists('ssgReplaceI18nLink')) {
    function ssgReplaceI18nLink($html, $i18nKey, $newText, $newHref = null) {
        $textVal = trim((string)$newText);
        $hrefVal = trim((string)$newHref);
        if ($textVal === '' && $hrefVal === '') return $html;

        $pattern = '#(<a\b[^>]*\bdata-i18n="' . preg_quote($i18nKey, '#') . '"[^>]*>)(.*?)(</a>)#us';
        if (preg_match($pattern, $html, $matches)) {
            $openTag = $matches[1];
            $inner = $matches[2];
            if ($hrefVal !== '') {
                $safeHref = htmlspecialchars($hrefVal, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                if (preg_match('#\bhref="[^"]*"#i', $openTag)) {
                    $openTag = preg_replace('#\bhref="[^"]*"#i', 'href="' . $safeHref . '"', $openTag, 1);
                }
            }
            if ($textVal !== '') {
                $inner = htmlspecialchars($textVal, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            }
            return str_replace($matches[0], $openTag . $inner . $matches[3], $html);
        }
        return $html;
    }
}

if (!function_exists('ssgGenerateBlogCard')) {
    function ssgGenerateBlogCard($b, $lang) {
        $ld = $b[$lang] ?? ($b['en'] ?? $b);
        $title = trim($ld['title'] ?? ($b['en']['title'] ?? ($b['title'] ?? '')));
        if ($title === '') return '';

        $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ($ld['slug'] ?? ($b['id'] ?? ''))));
        $excerpt = trim($ld['excerpt'] ?? ($b['en']['excerpt'] ?? ($b['excerpt'] ?? '')));
        if ($excerpt === '') {
            $rawBody = $ld['body'] ?? ($b['en']['body'] ?? ($b['body'] ?? ''));
            if ($rawBody) {
                $cleanText = trim(preg_replace('/\s+/', ' ', strip_tags($rawBody)));
                if ($cleanText !== '') {
                    $excerpt = function_exists('mb_substr') ? mb_substr($cleanText, 0, 140, 'UTF-8') : substr($cleanText, 0, 140);
                    if (mb_strlen($cleanText) > 140) $excerpt .= '...';
                }
            }
        }

        $imgUrl = trim($b['featured_img'] ?? '');
        if ($imgUrl === '') $imgUrl = '/assets/images/dubai-office-2.webp';
        if (!preg_match('#^(https?:)?//#i', $imgUrl) && strpos($imgUrl, 'data:') !== 0) {
            $imgUrl = preg_replace('#^(\.\./)+#', '/', $imgUrl);
            if ($imgUrl[0] !== '/') $imgUrl = '/' . $imgUrl;
        }

        $subcat = trim($b['subcategory'] ?? '');
        $cat = trim($b['category'] ?? '');
        $catBadge = $subcat !== '' ? strtoupper(str_replace('-', ' ', $subcat)) : ($cat !== '' ? strtoupper($cat) : 'INSIGHTS');

        $prefix = ($lang === 'en') ? '' : $lang . '/';
        $blogUrl = '/' . $prefix . 'blog/' . rawurlencode($slug) . '/';

        $readMoreTexts = [
            'en' => 'Read More',
            'ar' => 'اقرأ المزيد',
            'fa' => 'ادامه مطلب',
            'zh' => '阅读更多',
        ];
        $readMoreText = $readMoreTexts[$lang] ?? 'Read More';

        $rawDate = trim($b['publish_date'] ?? date('Y-m-d'));
        $dateFormatted = date('M d, Y', strtotime($rawDate));

        $alignClass = in_array($lang, ['ar', 'fa']) ? 'text-right' : 'text-left';
        $arrowClass = in_array($lang, ['ar', 'fa']) ? 'fa-arrow-left group-hover:-translate-x-1' : 'fa-arrow-right group-hover:translate-x-1';

        $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeExcerpt = htmlspecialchars($excerpt, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeCatBadge = htmlspecialchars($catBadge, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeImgUrl = htmlspecialchars($imgUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeId = htmlspecialchars($b['id'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeSlug = htmlspecialchars($slug, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return <<<CARD
<div class="bg-neutral-900 rounded-[2rem] border border-luxury-gold/30 overflow-hidden shadow-xl flex flex-col justify-between hover:shadow-[0_0_25px_rgba(197,168,128,0.4)] transition duration-500 min-w-[320px] max-w-[320px] shrink-0 group dynamic-home-blog" data-cms-blog-id="{$safeId}" data-cms-slug="{$safeSlug}">
<div>
<div class="relative aspect-[16/10] overflow-hidden">
<img alt="{$safeTitle}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="{$safeImgUrl}" onerror="this.onerror=null;this.src='/assets/images/dubai-office-2.webp'" loading="lazy" decoding="async"/>
<div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
<span class="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-luxury-gold border border-luxury-gold/30 rounded-full">{$safeCatBadge}</span>
</div>
<div class="p-6 space-y-2.5 {$alignClass}">
<span class="text-[10px] text-luxury-gold font-bold uppercase tracking-widest"><i class="fa-regular fa-calendar mr-1"></i> {$dateFormatted}</span>
<h3 class="font-serif font-bold text-white text-base group-hover:text-luxury-gold transition leading-snug"><a href="{$blogUrl}">{$safeTitle}</a></h3>
<p class="text-xs text-neutral-300 leading-relaxed font-light line-clamp-3">{$safeExcerpt}</p>
</div>
</div>
<div class="px-6 pb-6 pt-0 {$alignClass}">
<a class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-luxury-gold font-bold group-hover:text-white transition home-blog-read-more" data-home-read-more="true" href="{$blogUrl}"> <span>{$readMoreText}</span> <i class="fa-solid {$arrowClass} text-[10px] transition-transform duration-300"></i>
</a>
</div>
</div>
CARD;
    }
}

/**
 * Main SSG Regeneration Function
 */
function regenerateHomepage($rootDir = null, $publishedSnapshot = null) {
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

    $hp = $publishedSnapshot['sgcms_homepage'] ?? [];
    $blogs = $publishedSnapshot['sgcms_blog'] ?? [];
    $aboutData = $publishedSnapshot['sgcms_aboutus'] ?? [];
    $contactData = $publishedSnapshot['sgcms_contact'] ?? [];
    $domOverrides = $publishedSnapshot['sgcms_dom_overrides'] ?? [];

    $languages = ['en', 'ar', 'fa', 'zh'];
    $updatedFiles = [];

    // ─────────────────────────────────────────────────────────────
    // 1. REGENERATE HOMEPAGE (index.html, ar/index.html, etc.)
    // ─────────────────────────────────────────────────────────────
    $homeFiles = [
        'en' => $rootDir . '/index.html',
        'ar' => $rootDir . '/ar/index.html',
        'fa' => $rootDir . '/fa/index.html',
        'zh' => $rootDir . '/zh/index.html',
    ];

    foreach ($homeFiles as $lang => $filePath) {
        if (!file_exists($filePath)) continue;
        $html = file_get_contents($filePath);
        if ($html === false || strlen($html) < 200) continue;

        // 1a. Hero Section
        $hero = ($lang === 'en')
            ? ($hp['hero']['en'] ?? ($hp['hero'] ?? []))
            : ($hp['hero'][$lang] ?? []);

        if (!empty($hero['headline'])) {
            $html = ssgReplaceI18nElement($html, 'hero.title', $hero['headline']);
            // Also replace data-cms="hero-headline" if present
            $patternHero = '#(<([a-zA-Z0-9]+)[^>]*\bdata-cms="hero-headline"[^>]*>)(.*?)(</\2>)#us';
            if (preg_match($patternHero, $html)) {
                $html = preg_replace($patternHero, '${1}' . htmlspecialchars($hero['headline'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '${4}', $html, 1);
            }
        }
        if (!empty($hero['tagline'])) {
            $html = ssgReplaceI18nElement($html, 'hero.tagline', $hero['tagline']);
        }
        if (!empty($hero['pathway_citizenship'])) {
            $html = ssgReplaceI18nElement($html, 'hero.citizenship', $hero['pathway_citizenship']);
        }
        if (!empty($hero['pathway_residency'])) {
            $html = ssgReplaceI18nElement($html, 'hero.residency', $hero['pathway_residency']);
        }
        if (!empty($hero['pathway_realestate'])) {
            $html = ssgReplaceI18nElement($html, 'hero.realEstate', $hero['pathway_realestate']);
        }
        if (!empty($hero['pathway_education'])) {
            $html = ssgReplaceI18nElement($html, 'hero.educationalAdvisory', $hero['pathway_education']);
        }

        // 1b. Stats Section
        if (!empty($hp['stats']) && is_array($hp['stats'])) {
            $statKeys = ['stats.yearsExp', 'stats.cbiCases', 'stats.residencyCases', 'stats.families'];
            foreach ($hp['stats'] as $si => $stat) {
                if ($si >= count($statKeys)) break;
                $k = $statKeys[$si];

                // Update counter data-target
                if (!empty($stat['value'])) {
                    $numVal = intval(preg_replace('/\D/', '', (string)$stat['value']));
                    if ($numVal > 0) {
                        // Pattern matches the si-th counter-value inside stats-section
                        $counterPattern = '#(<span\b[^>]*\bclass="counter-value"[^>]*\bdata-target=")\d+("[^>]*>)#us';
                        // Let's replace specifically near the data-i18n key or sequentially
                    }
                }

                // Update label
                $label = $stat['label_' . $lang] ?? ($lang === 'en' ? ($stat['label_en'] ?? '') : '');
                if ($label !== '') {
                    $html = ssgReplaceI18nElement($html, $k, $label);
                }
            }
        }

        // 1c. About Us Section
        $about = ($lang === 'en')
            ? ($hp['about']['en'] ?? ($hp['about'] ?? []))
            : ($hp['about'][$lang] ?? []);

        if (!empty($about['badge'])) $html = ssgReplaceI18nElement($html, 'about.badge', $about['badge']);
        if (!empty($about['heading'])) $html = ssgReplaceI18nElement($html, 'about.heading', $about['heading']);
        if (!empty($about['subheading'])) $html = ssgReplaceI18nElement($html, 'about.subheading', $about['subheading']);
        if (!empty($about['p1'])) $html = ssgReplaceI18nElement($html, 'about.p1', $about['p1']);
        if (!empty($about['p2'])) $html = ssgReplaceI18nElement($html, 'about.p2', $about['p2']);
        if (!empty($about['btn1_text'])) $html = ssgReplaceI18nLink($html, 'about.readStory', $about['btn1_text'], $about['btn1_link'] ?? null);
        if (!empty($about['btn2_text'])) $html = ssgReplaceI18nLink($html, 'about.bookConsultation', $about['btn2_text'], $about['btn2_link'] ?? null);

        // 1d. Services Section
        $services = ($lang === 'en')
            ? ($hp['services'] ?? [])
            : ($hp['services'][$lang] ?? []);

        if (!empty($services['badge'])) $html = ssgReplaceI18nElement($html, 'services.badge', $services['badge']);
        if (!empty($services['heading'])) $html = ssgReplaceI18nElement($html, 'services.heading', $services['heading']);
        if (!empty($services['heading_italic'])) $html = ssgReplaceI18nElement($html, 'services.headingItalic', $services['heading_italic']);
        if (!empty($services['description'])) $html = ssgReplaceI18nElement($html, 'services.description', $services['description']);

        if ($lang === 'en') {
            $pillars = [
                'pillar_cbi'        => 'services.cbi',
                'pillar_rbi'        => 'services.rbi',
                'pillar_uae'        => 'services.uaeGolden',
                'pillar_realestate' => 'services.realEstate',
                'pillar_education'  => 'services.education'
            ];
            foreach ($pillars as $pKey => $prefix) {
                if (!empty($services[$pKey]) && is_array($services[$pKey])) {
                    $pData = $services[$pKey];
                    if (!empty($pData['pillar_badge'])) $html = ssgReplaceI18nElement($html, $prefix . '.pillar', $pData['pillar_badge']);
                    if (!empty($pData['title'])) $html = ssgReplaceI18nElement($html, $prefix . '.title', $pData['title']);
                    if (!empty($pData['p1'])) $html = ssgReplaceI18nElement($html, $prefix . '.p1', $pData['p1']);
                    if (!empty($pData['p2'])) $html = ssgReplaceI18nElement($html, $prefix . '.p2', $pData['p2']);
                }
            }
        }

        // 1e. Social Responsibility Section
        $social = ($lang === 'en')
            ? ($hp['social_responsibility'] ?? [])
            : ($hp['social_responsibility'][$lang] ?? []);

        if (!empty($social['badge'])) $html = ssgReplaceI18nElement($html, 'social.badge', $social['badge']);
        if (!empty($social['heading'])) $html = ssgReplaceI18nElement($html, 'social.heading', $social['heading']);
        if (!empty($social['description'])) $html = ssgReplaceI18nElement($html, 'social.description', $social['description']);
        if (!empty($social['btn_text'])) $html = ssgReplaceI18nLink($html, 'social.exploreInitiatives', $social['btn_text'], $social['btn_link'] ?? null);

        // 1f. Reviews Section
        if (!empty($hp['reviews']) && is_array($hp['reviews']) && $lang === 'en') {
            if (!empty($hp['reviews']['badge'])) $html = ssgReplaceI18nElement($html, 'reviews.badge', $hp['reviews']['badge']);
            if (!empty($hp['reviews']['heading'])) $html = ssgReplaceI18nElement($html, 'reviews.heading', $hp['reviews']['heading']);
        }

        // 1g. Blog Carousel: Pre-bake the latest 10 published blogs directly into #blog-slider-inner
        if (!empty($blogs) && is_array($blogs)) {
            $publishedBlogs = [];
            foreach ($blogs as $b) {
                if (!is_array($b)) continue;
                $status = strtolower(trim($b['status_' . $lang] ?? ($b['status_en'] ?? ($b['status'] ?? 'published'))));
                if ($status === 'draft' || $status === 'hidden' || $status === 'deleted') continue;
                $publishedBlogs[] = $b;
            }

            usort($publishedBlogs, function($a, $b) {
                $da = strtotime($a['publish_date'] ?? '1970-01-01');
                $db = strtotime($b['publish_date'] ?? '1970-01-01');
                return $db <=> $da;
            });

            $topBlogs = array_slice($publishedBlogs, 0, 10);
            $cards = [];
            foreach ($topBlogs as $b) {
                $cardHtml = ssgGenerateBlogCard($b, $lang);
                if ($cardHtml !== '') $cards[] = $cardHtml;
            }

            if (!empty($cards)) {
                $sliderPattern = '#(<div[^>]*\bid="blog-slider-inner"[^>]*>)(.*?)(?=\s*</div>\s*</div>\s*</div>\s*</section>)#us';
                if (preg_match($sliderPattern, $html)) {
                    $cardsBlock = "\n" . implode("\n", $cards) . "\n";
                    $html = preg_replace($sliderPattern, '${1}' . $cardsBlock, $html, 1);
                }
            }
        }

        // 1h. Apply DOM Overrides if defined for homepage
        $homeOverrides = $domOverrides['homepage'][$lang] ?? ($domOverrides[$lang][$lang] ?? []);
        if (!empty($homeOverrides) && is_array($homeOverrides)) {
            foreach ($homeOverrides as $selector => $val) {
                $textVal = is_array($val) ? ($val['text'] ?? '') : (string)$val;
                if (trim($textVal) === '') continue;

                // If selector is [data-i18n="..."]
                if (preg_match('/^\[data-i18n=["\']([^"\']+)["\']\]$/', trim($selector), $sm)) {
                    $html = ssgReplaceI18nElement($html, $sm[1], $textVal);
                }
            }
        }

        // Save atomically
        file_put_contents($filePath, $html, LOCK_EX);
        $updatedFiles[] = $filePath;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. REGENERATE ABOUT US PAGE (aboutus/index.html, etc.)
    // ─────────────────────────────────────────────────────────────
    if (!empty($aboutData) && is_array($aboutData)) {
        $aboutFiles = [
            'en' => $rootDir . '/aboutus/index.html',
            'ar' => $rootDir . '/ar/aboutus/index.html',
            'fa' => $rootDir . '/fa/aboutus/index.html',
            'zh' => $rootDir . '/zh/aboutus/index.html',
        ];

        foreach ($aboutFiles as $lang => $filePath) {
            if (!file_exists($filePath)) continue;
            $html = file_get_contents($filePath);
            if ($html === false || strlen($html) < 200) continue;

            $hero = ($lang === 'en')
                ? ($aboutData['hero']['en'] ?? ($aboutData['hero'] ?? []))
                : ($aboutData['hero'][$lang] ?? []);

            if (!empty($hero['badge'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.heroBadge', $hero['badge']);
            if (!empty($hero['title'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.heroTitle', $hero['title']);
            if (!empty($hero['subtitle'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.heroSubtitle', $hero['subtitle']);

            $ov = ($lang === 'en')
                ? ($aboutData['overview']['en'] ?? ($aboutData['overview'] ?? []))
                : ($aboutData['overview'][$lang] ?? []);

            if (!empty($ov['badge'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.about_overview_item1', $ov['badge']);
            if (!empty($ov['heading'])) {
                $brandMap = ['ar' => 'مجموعة شريف', 'fa' => 'شریف گروپ', 'zh' => '谢里夫集团', 'en' => 'Sharif Group'];
                $brand = $brandMap[$lang] ?? 'Sharif Group';
                $cleanHead = trim(preg_replace('/' . preg_quote($brand, '/') . '$/i', '', $ov['heading']));
                $cleanHead = trim(preg_replace('/[:：\s]+$/u', '', $cleanHead));
                $colon = ($lang === 'zh') ? '：' : ':';
                $formattedHeading = $cleanHead . $colon . '<br/><span class="italic text-[#C5A880] font-serif font-normal">' . $brand . '</span>';
                $html = ssgReplaceI18nElement($html, 'pages.aboutUs.about_overview_item2', $formattedHeading, true);
            }
            if (!empty($ov['p1'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.about_overview_item3', $ov['p1']);
            if (!empty($ov['p2'])) $html = ssgReplaceI18nElement($html, 'pages.aboutUs.about_overview_item4', $ov['p2']);

            file_put_contents($filePath, $html, LOCK_EX);
            $updatedFiles[] = $filePath;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. REGENERATE CONTACT PAGE (contact/index.html, etc.)
    // ─────────────────────────────────────────────────────────────
    if (!empty($contactData) && is_array($contactData)) {
        $contactFiles = [
            'en' => $rootDir . '/contact/index.html',
            'ar' => $rootDir . '/ar/contact/index.html',
            'fa' => $rootDir . '/fa/contact/index.html',
            'zh' => $rootDir . '/zh/contact/index.html',
        ];

        foreach ($contactFiles as $lang => $filePath) {
            if (!file_exists($filePath)) continue;
            $html = file_get_contents($filePath);
            if ($html === false || strlen($html) < 200) continue;

            $d = ($lang === 'en')
                ? ($contactData['en'] ?? ($contactData ?? []))
                : ($contactData[$lang] ?? []);

            if (!empty($d['badge'])) $html = ssgReplaceI18nElement($html, 'pages.contact.badge', $d['badge']);
            if (!empty($d['heading'])) $html = ssgReplaceI18nElement($html, 'pages.contact.heading', $d['heading']);
            if (!empty($d['sub'])) $html = ssgReplaceI18nElement($html, 'pages.contact.sub', $d['sub']);

            file_put_contents($filePath, $html, LOCK_EX);
            $updatedFiles[] = $filePath;
        }
    }

    return [
        'success'      => true,
        'updatedFiles' => $updatedFiles,
        'count'        => count($updatedFiles)
    ];
}
