# ==============================================================================
# Sharif Group Dubai - Static Blog Article Pre-renderer & Sitemap Generator
# Usage: powershell -ExecutionPolicy Bypass -File .\generate_blog_static.ps1
# ==============================================================================

param(
    [int]$Limit = 0
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = Get-Location }

$baseDir = $scriptDir
$blogFile = Join-Path $baseDir "blog\index.html"

if (-not (Test-Path $blogFile)) {
    Write-Error "Could not find $blogFile"
    exit 1
}

$content = [System.IO.File]::ReadAllText($blogFile, [System.Text.Encoding]::UTF8)

# 1. Parse Articles from articlesDatabase
$startPos = $content.IndexOf("const articlesDatabase = {")
$endPos = $content.IndexOf("window.articlesDatabase = articlesDatabase;", $startPos)
if ($startPos -lt 0 -or $endPos -lt 0) {
    Write-Error "Could not find articlesDatabase in $blogFile"
    exit 1
}

$dbText = $content.Substring($startPos, $endPos - $startPos)
$pattern = [regex]"(?ms)^\s*['""]([a-z0-9-]+)['""]\s*:\s*\{\s*title:\s*['""](.*?)['""],\s*category:\s*['""](.*?)['""],\s*author:\s*['""](.*?)['""],\s*date:\s*['""](.*?)['""],\s*updated:\s*['""](.*?)['""],\s*image:\s*['""](.*?)['""],\s*content:\s*`?(.*?)`?,\s*faqs:\s*\[(.*?)\s*\]\s*\}"
$articleMatches = $pattern.Matches($dbText)
Write-Host "Discovered $($articleMatches.Count) total articles in articlesDatabase."

$faqPattern = [regex]'(?ms)\{\s*q:\s*"(.*?)",\s*a:\s*"(.*?)"\s*\}'

function Format-SeoTitle([string]$rawTitle) {
    $raw = $rawTitle.Trim()
    $brand = " | Sharif Group"
    $shortBrand = " | Sharif"
    
    if (($raw + $brand).Length -le 55) {
        $candidate = ($raw + $brand)
    } elseif (($raw + $shortBrand).Length -le 55) {
        $candidate = ($raw + $shortBrand)
    } elseif ($raw.Length -le 58) {
        $candidate = $raw
    } else {
        $trunc = $raw.Substring(0, 56)
        $lastSpace = $trunc.LastIndexOf(" ")
        if ($lastSpace -gt 30) {
            $candidate = $trunc.Substring(0, $lastSpace).Trim()
        } else {
            $candidate = $trunc.Trim()
        }
    }
    
    $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
    while ($enc.Length -gt 60) {
        $lastSpace = $candidate.LastIndexOf(" ")
        if ($lastSpace -gt 20) {
            $candidate = $candidate.Substring(0, $lastSpace).Trim()
            $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
        } else {
            $candidate = $candidate.Substring(0, 50).Trim()
            $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
        }
    }
    return $candidate
}

function Format-SeoDescription([string]$title, [string]$bodyHtml, [hashtable]$usedDescs) {
    $clean = [regex]::Replace($bodyHtml, "<[^>]+>", " ")
    $clean = [regex]::Replace($clean, "\s+", " ").Trim()
    $clean = $clean.Trim('`').Trim()

    $ctas = @(
        " Learn more with Sharif Group Dubai.",
        " Consult Sharif Group in Dubai today.",
        " Read our complete guide from Dubai.",
        " Apply today with Sharif Group Dubai.",
        " Read the full advisory guide now.",
        " Book a consultation with our team.",
        " Read the expert analysis in Dubai."
    )

    $titlePrefix = "Explore " + $title + ": "
    if ($titlePrefix.Length -lt 70) {
        foreach ($cta in $ctas) {
            $avail = 148 - ($titlePrefix.Length + $cta.Length)
            $minAvail = 135 - ($titlePrefix.Length + $cta.Length)
            if ($avail -gt 20 -and $clean.Length -ge $minAvail) {
                $slice = $clean.Substring(0, [Math]::Min($clean.Length, $avail))
                $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
                if ($lastSpace -ge $minAvail) {
                    $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                    $desc = "$titlePrefix$base$cta"
                    $enc = [System.Net.WebUtility]::HtmlEncode($desc)
                    if ($enc.Length -ge 140 -and $enc.Length -le 155 -and -not $usedDescs.ContainsKey($enc)) {
                        return $desc
                    }
                }
            }
        }
    }

    foreach ($cta in $ctas) {
        $maxBaseLen = 148 - $cta.Length
        $minBaseLen = 135 - $cta.Length

        if ($clean.Length -ge $minBaseLen) {
            $slice = $clean.Substring(0, [Math]::Min($clean.Length, $maxBaseLen))
            $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
            if ($lastSpace -ge $minBaseLen) {
                $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                $desc = $base + $cta
                $enc = [System.Net.WebUtility]::HtmlEncode($desc)
                if ($enc.Length -ge 140 -and $enc.Length -le 155 -and -not $usedDescs.ContainsKey($enc)) {
                    return $desc
                }
            }
        }
    }

    $cta = " Learn more with Sharif Group Dubai."
    $baseLen = 146 - $cta.Length
    $base = $clean.Substring(0, [Math]::Min($clean.Length, $baseLen)).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
    $desc = $base + $cta
    $enc = [System.Net.WebUtility]::HtmlEncode($desc)

    while ($enc.Length -lt 140) {
        $desc = $desc.Replace("Learn more", "Explore insights and learn more")
        $enc = [System.Net.WebUtility]::HtmlEncode($desc)
    }
    while ($enc.Length -gt 155) {
        $lastSpace = $base.LastIndexOf(' ')
        if ($lastSpace -gt 10) {
            $base = $base.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
            $desc = $base + $cta
            $enc = [System.Net.WebUtility]::HtmlEncode($desc)
        } else {
            $desc = $desc.Substring(0, 150).Trim() + "..."
            $enc = [System.Net.WebUtility]::HtmlEncode($desc)
            break
        }
    }
    return $desc
}

function Escape-Json([string]$str) {
    if (-not $str) { return "" }
    return $str.Replace('\', '\\').Replace('"', '\"').Replace("`r", "").Replace("`n", "\n").Replace("`t", "\t").Trim('`').Trim()
}

function Fix-ImagePath([string]$img) {
    if (-not $img) { return "https://sharifgroup.ae/assets/images/dubai-office-2.webp" }
    if ($img.StartsWith("http://") -or $img.StartsWith("https://")) { return $img }
    if ($img.StartsWith("/")) { return $img }
    if ($img.StartsWith("assets/")) { return "/" + $img }
    return "/blog/" + $img
}

function Get-AbsoluteImageUrl([string]$img) {
    $fixed = Fix-ImagePath $img
    if ($fixed.StartsWith("http")) { return $fixed }
    return "https://sharifgroup.ae" + $fixed
}

# Extract Complete Header (Navbar, Language Switcher, Mobile Drawer, and Mega-Dropdowns)
$headerStart = $content.IndexOf("<header")
$headerEnd = $content.IndexOf("</header>", $headerStart) + 9
$navHtml = $content.Substring($headerStart, $headerEnd - $headerStart)
$navHtml = $navHtml.Replace('href="../index.html"', 'href="/"')
$navHtml = $navHtml.Replace('href="../citizenshipbyinvestment/index.html"', 'href="/citizenshipbyinvestment/"')
$navHtml = $navHtml.Replace('href="../residencybyinvestment/index.html"', 'href="/residencybyinvestment/"')
$navHtml = $navHtml.Replace('href="../realestate/index.html"', 'href="/realestate/"')
$navHtml = $navHtml.Replace('href="../educationaladvisory/index.html"', 'href="/educationaladvisory/"')
$navHtml = $navHtml.Replace('href="../aboutus/index.html"', 'href="/aboutus/"')
$navHtml = $navHtml.Replace('href="../ali-sharif/index.html"', 'href="/about-founder/"')
$navHtml = $navHtml.Replace('href="../contact/index.html"', 'href="/contact/"')
$navHtml = $navHtml.Replace('href="../eligibilitychecker/index.html"', 'href="/eligibilitychecker/"')
$navHtml = $navHtml.Replace('href="../programs/citizenshipbyinvestment/stkittis/index.html"', 'href="/programs/citizenshipbyinvestment/stkitts/"')
$navHtml = $navHtml.Replace('href="../programs/citizenshipbyinvestment/greneda/index.html"', 'href="/programs/citizenshipbyinvestment/grenada/"')
$navHtml = $navHtml.Replace('href="../programs/', 'href="/programs/')
$navHtml = $navHtml.Replace('href="index.html"', 'href="/blog/"')
$navHtml = $navHtml.Replace('src="../assets/', 'src="/assets/')
$navHtml = $navHtml.Replace('src="../alirezasharif.svg"', 'src="/blog/alirezasharif.svg"')
$navHtml = $navHtml.Replace('src="alirezasharif.svg"', 'src="/blog/alirezasharif.svg"')
$navHtml = $navHtml.Replace('src="imclogo.webp"', 'src="/blog/imclogo.webp"')
$navHtml = [regex]::Replace($navHtml, '(<a[^>]+data-i18n="nav\.blog"[^>]+href=)"[^"]*"', '$1"/blog/"')
$navHtml = [regex]::Replace($navHtml, '(<a[^>]+href=)"[^"]*"([^>]+data-i18n="nav\.blog")', '$1"/blog/"$2')

# Extract Footer
$footerStart = $content.IndexOf("<footer")
$footerEnd = $content.IndexOf("</footer>", $footerStart) + 9
$footerHtml = $content.Substring($footerStart, $footerEnd - $footerStart)
$footerHtml = $footerHtml.Replace('href="../index.html"', 'href="/"')
$footerHtml = $footerHtml.Replace('href="../citizenshipbyinvestment/index.html"', 'href="/citizenshipbyinvestment/"')
$footerHtml = $footerHtml.Replace('href="../residencybyinvestment/index.html"', 'href="/residencybyinvestment/"')
$footerHtml = $footerHtml.Replace('href="../realestate/index.html"', 'href="/realestate/"')
$footerHtml = $footerHtml.Replace('href="../educationaladvisory/index.html"', 'href="/educationaladvisory/"')
$footerHtml = $footerHtml.Replace('href="../aboutus/index.html"', 'href="/aboutus/"')
$footerHtml = $footerHtml.Replace('href="../ali-sharif/index.html"', 'href="/about-founder/"')
$footerHtml = $footerHtml.Replace('href="../contact/index.html"', 'href="/contact/"')
$footerHtml = $footerHtml.Replace('href="../eligibilitychecker/index.html"', 'href="/eligibilitychecker/"')
$footerHtml = $footerHtml.Replace('href="../programs/citizenshipbyinvestment/stkittis/index.html"', 'href="/programs/citizenshipbyinvestment/stkitts/"')
$footerHtml = $footerHtml.Replace('href="../programs/citizenshipbyinvestment/greneda/index.html"', 'href="/programs/citizenshipbyinvestment/grenada/"')
$footerHtml = $footerHtml.Replace('href="../programs/', 'href="/programs/')
$footerHtml = $footerHtml.Replace('href="index.html"', 'href="/blog/"')
$footerHtml = [regex]::Replace($footerHtml, '(<a[^>]+data-i18n="megaMenu\.insights"[^>]+href=)"[^"]*"', '$1"/blog/"')
$footerHtml = [regex]::Replace($footerHtml, '(<a[^>]+href=)"[^"]*"([^>]+data-i18n="megaMenu\.insights")', '$1"/blog/"$2')

$navHtml = $navHtml.Replace('../assets/', '../../assets/')
$footerHtml = $footerHtml.Replace('../assets/', '../../assets/')
$footerHtml = $footerHtml.Replace('href="../cookiepolicy/index.html"', 'href="/cookiepolicy/"')
$footerHtml = $footerHtml.Replace('href="../privacypolicy/index.html"', 'href="/privacypolicy/"')
$footerHtml = $footerHtml.Replace('href="../termsofuse/index.html"', 'href="/termsofuse/"')

# Extract Consultation Form Section
$formSectionStart = $content.IndexOf('id="detail-consultation-section"')
$formStart = $content.LastIndexOf('<div class="py-24', $formSectionStart)
$sectionClose = $content.IndexOf('</section>', $formStart)
$formHtml = $content.Substring($formStart, $sectionClose - $formStart)
$formHtml = [regex]::Replace($formHtml, '^<div\s+class="py-24\s+px-6\s+bg-\[#FAF6EE\][^"]*"\s+id="detail-consultation-section">', '<section class="py-24 px-6 bg-[#FAF6EE] relative overflow-hidden border-t border-neutral-200/80" id="detail-consultation-section">')
$formHtml = [regex]::Replace($formHtml, '</div>\s*$', '</section>')
$formHtml = [regex]::Replace($formHtml, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)data-i18n-html="contact\.consultationHeading"[^>]*)>([\s\S]*?)</h3>', '<h2$1>$2</h2>')
$formHtml = $formHtml.Replace('style="display: none !important;"', '')

# Pre-collect all articles metadata
$articlesList = @()
foreach ($m in $articleMatches) {
    $rawContent = $m.Groups[8].Value.Trim()
    if ($rawContent.StartsWith('`')) { $rawContent = $rawContent.Substring(1) }
    if ($rawContent.EndsWith('`')) { $rawContent = $rawContent.Substring(0, $rawContent.Length - 1) }
    $rawContent = $rawContent.Trim()

    $articlesList += @{
        slug = $m.Groups[1].Value
        title = $m.Groups[2].Value.Trim()
        category = $m.Groups[3].Value.Trim()
        author = $m.Groups[4].Value.Trim()
        date = $m.Groups[5].Value.Trim()
        updated = $m.Groups[6].Value.Trim()
        image = Fix-ImagePath $m.Groups[7].Value
        content = $rawContent
        faqsRaw = $m.Groups[9].Value
    }
}

$count = $articlesList.Count
if ($Limit -gt 0 -and $Limit -lt $count) {
    $count = $Limit
}

Write-Host "Building $count static HTML article pages..."

$usedDescs = @{}

for ($i = 0; $i -lt $count; $i++) {
    $art = $articlesList[$i]
    $slug = $art.slug
    $title = $art.title
    $category = $art.category
    $author = $art.author
    $date = $art.date
    $updated = $art.updated
    $image = $art.image
    $absImage = Get-AbsoluteImageUrl $image
    $articleContent = $art.content

    $seoTitle = Format-SeoTitle $title
    $seoDesc = Format-SeoDescription $title $articleContent $usedDescs
    $usedDescs[$seoDesc] = $slug

    $encTitle = [System.Net.WebUtility]::HtmlEncode($title)
    $encSeoTitle = [System.Net.WebUtility]::HtmlEncode($seoTitle)
    $encCategory = [System.Net.WebUtility]::HtmlEncode($category)
    $encAuthor = [System.Net.WebUtility]::HtmlEncode($author)
    $encDate = [System.Net.WebUtility]::HtmlEncode($date)
    $encUpdated = [System.Net.WebUtility]::HtmlEncode($updated)
    $encSeoDesc = [System.Net.WebUtility]::HtmlEncode($seoDesc)

    # Parse FAQs
    $faqMatches = $faqPattern.Matches($art.faqsRaw)
    $faqs = @()
    foreach ($fm in $faqMatches) {
        $faqs += @{
            q = $fm.Groups[1].Value
            a = $fm.Groups[2].Value
        }
    }

    # Generate FAQ Accordion HTML
    $faqCol1Html = ""
    $faqCol2Html = ""
    $faqSchemaItems = @()

    for ($fIdx = 0; $fIdx -lt $faqs.Count; $fIdx++) {
        $faq = $faqs[$fIdx]
        $escapedQ = [System.Net.WebUtility]::HtmlEncode($faq.q)
        $escapedA = [System.Net.WebUtility]::HtmlEncode($faq.a)

        $faqSchemaItems += @"
        {
          "@type": "Question",
          "name": "$(Escape-Json $faq.q)",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "$(Escape-Json $faq.a)"
          }
        }
"@

        $faqItemHtml = @"
        <div class="border-b border-neutral-200 py-3.5">
            <button onclick="toggleBlogFAQ('faq-dyn-$fIdx')" class="w-full flex justify-between items-center focus:outline-none group text-left">
                <span class="text-xs uppercase tracking-wider font-bold text-neutral-800 group-hover:text-luxury-gold transition pr-3">
                    $escapedQ
                </span>
                <span class="text-neutral-400 transition-transform duration-300 shrink-0" id="icon-faq-dyn-$fIdx">
                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                </span>
            </button>
            <div id="content-faq-dyn-$fIdx" class="max-h-0 overflow-hidden transition-all duration-500 ease-in-out">
                <p class="text-xs text-neutral-600 leading-relaxed mt-2.5 font-light">
                    $escapedA
                </p>
            </div>
        </div>
"@
        if ($fIdx -lt 6) {
            $faqCol1Html += $faqItemHtml
        } else {
            $faqCol2Html += $faqItemHtml
        }
    }

    $faqSchemaJson = $faqSchemaItems -join ",`n"

    # Pick 3 Related Articles
    $relCardsHtml = ""
    for ($r = 1; $r -le 3; $r++) {
        $relIdx = ($i + $r) % $articlesList.Count
        $relArt = $articlesList[$relIdx]
        $relTitleEnc = [System.Net.WebUtility]::HtmlEncode($relArt.title)
        $relCatEnc = [System.Net.WebUtility]::HtmlEncode($relArt.category)
        $relCardsHtml += @"
        <article class="space-y-4 text-left flex flex-col justify-between blog-item bg-white p-5 rounded-2xl border border-neutral-200/70 shadow-sm neon-card-hover">
            <div class="space-y-3">
                <div class="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 shadow-sm">
                    <img alt="$relTitleEnc" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="$($relArt.image)" onerror="this.src='/assets/images/dubai-office-2.webp'"/>
                </div>
                <div class="text-[11px] font-bold tracking-wider text-[#786142] uppercase related-category-tag" data-category="$relCatEnc">
                    $relCatEnc
                </div>
                <h3 class="font-serif font-bold text-base text-neutral-900 leading-snug line-clamp-2">
                    $relTitleEnc
                </h3>
            </div>
            <a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start" href="/blog/$($relArt.slug)/" data-i18n="blog.readMore">
                READ MORE
            </a>
        </article>
"@
    }

    # Page Markup
    $pageHtml = @"
<!DOCTYPE html>
<html class="scroll-smooth" lang="en">
<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WQV73SMP');</script>
    <!-- End Google Tag Manager -->

    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <script>
        (function() {
            try {
                var l = localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang') || 'en';
                if (l === 'ar' || l === 'fa') {
                    document.documentElement.dir = 'rtl';
                    document.documentElement.lang = l;
                } else if (l === 'zh') {
                    document.documentElement.dir = 'ltr';
                    document.documentElement.lang = 'zh';
                }
                if (l !== 'en') {
                    document.documentElement.classList.add('i18n-pending');
                }
            } catch(e) {}
        })();
    </script>

    <!-- Favicon & App Icons -->
    <link href="https://shariftrip.com/wp-content/uploads/2024/06/Group-427321463.svg" rel="icon" type="image/svg+xml"/>
    <link href="/assets/images/shariftrip-logo-1.svg" rel="alternate icon" type="image/svg+xml"/>
    <link href="../../assets/images/shariftrip-logo-1.svg" rel="alternate icon" type="image/svg+xml"/>
    <link href="https://shariftrip.com/wp-content/uploads/2024/06/Group-427321463.svg" rel="apple-touch-icon" sizes="180x180"/>

    <!-- Primary SEO & AEO Meta Tags -->
    <title>$encSeoTitle</title>
    <meta name="title" content="$encSeoTitle"/>
    <meta name="description" content="$encSeoDesc"/>
    <meta name="author" content="$encAuthor"/>
    <link rel="canonical" href="https://sharifgroup.ae/blog/$slug/"/>
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>

    <!-- Geo Meta Tags -->
    <meta name="geo.region" content="AE-DU"/>
    <meta name="geo.placename" content="Dubai"/>
    <meta name="geo.position" content="25.1874464;55.2641931"/>
    <meta name="ICBM" content="25.1874464, 55.2641931"/>

    <!-- Open Graph / Social Media Card -->
    <meta property="og:type" content="article"/>
    <meta property="og:locale" content="en_US"/>
    <meta property="og:site_name" content="Sharif Group Dubai"/>
    <meta property="og:title" content="$encSeoTitle"/>
    <meta property="og:description" content="$encSeoDesc"/>
    <meta property="og:url" content="https://sharifgroup.ae/blog/$slug/"/>
    <meta property="og:image" content="$absImage"/>
    <meta property="article:published_time" content="2026-01-15T00:00:00+04:00"/>
    <meta property="article:modified_time" content="2026-08-20T00:00:00+04:00"/>
    <meta property="article:section" content="$encCategory"/>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="$encSeoTitle"/>
    <meta name="twitter:description" content="$encSeoDesc"/>
    <meta name="twitter:image" content="$absImage"/>

    <!-- Structured Data: Article + FAQPage + BreadcrumbList -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": "https://sharifgroup.ae/blog/$slug/#article",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "https://sharifgroup.ae/#website",
            "name": "Sharif Group Dubai",
            "url": "https://sharifgroup.ae/"
          },
          "headline": "$(Escape-Json $title)",
          "description": "$(Escape-Json $seoDesc)",
          "image": "$absImage",
          "datePublished": "2026-01-15T00:00:00+04:00",
          "dateModified": "2026-08-20T00:00:00+04:00",
          "author": {
            "@type": "Organization",
            "name": "$(Escape-Json $author)",
            "url": "https://sharifgroup.ae/"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Sharif Group",
            "url": "https://sharifgroup.ae/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://sharifgroup.ae/assets/images/vector_2d09c4bb.svg"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://sharifgroup.ae/blog/$slug/"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://sharifgroup.ae/blog/$slug/#faq",
          "mainEntity": [
$faqSchemaJson
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://sharifgroup.ae/blog/$slug/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://sharifgroup.ae/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "https://sharifgroup.ae/blog/"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "$(Escape-Json $title)",
              "item": "https://sharifgroup.ae/blog/$slug/"
            }
          ]
        }
      ]
    }
    </script>

    <!-- Compiled Tailwind Production CSS (Zero Runtime Compiler) -->
    <link rel="stylesheet" href="../../assets/css/tailwind.min.css?v=20260920_v1" />
    <link rel="stylesheet" href="../../assets/css/multilingual.css?v=7" />

    <!-- Google Fonts & Icon Libraries -->
    <link href="https://fonts.googleapis.com" rel="preconnect"/>
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet"/>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"/>

    <style>
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #FDFCFB; }
        ::-webkit-scrollbar-thumb { background: #C5A880; border-radius: 3px; }

        .neon-card-hover {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 768px) {
            .neon-card-hover:hover {
                border-color: #C5A880 !important;
                box-shadow: 0 0 25px rgba(197, 168, 128, 0.45) !important;
                transform: translateY(-3px);
            }
        }
        .mega-dropdown {
            margin-top: 0;
            padding-top: 10px;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
        }
        .mega-dropdown::before {
            content: '';
            position: absolute;
            top: -20px;
            left: 0;
            width: 100%;
            height: 20px;
            background: transparent;
        }
        .custom-select-wrapper { position: relative !important; }
        .custom-select-dropdown {
            display: none;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            width: 260px !important;
            max-height: 220px !important;
            overflow-y: auto !important;
            z-index: 9999 !important;
            margin-top: 4px !important;
            border-radius: 0.75rem !important;
        }
        .custom-select-dropdown.active { display: block !important; }
    </style>
</head>
<body class="bg-[#FDFCFB] text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-luxury-gold selection:text-white">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WQV73SMP"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

$navHtml

    <!-- MAIN ARTICLE LAYOUT -->
    <main class="blog-article-layout pt-28 sm:pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="space-y-10">
            <!-- Breadcrumbs + Back Button -->
            <div class="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
                <a class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-gold hover:text-neutral-900 transition-colors" href="/blog/">
                    <i class="fa-solid fa-arrow-left"></i> Back to All Articles
                </a>
                <nav class="text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <a class="hover:text-neutral-900" href="/">Home</a>
                    <span>/</span>
                    <a class="hover:text-neutral-900" href="/blog/">Blog</a>
                    <span>/</span>
                    <span class="text-luxury-gold truncate max-w-[200px] sm:max-w-xs">$encTitle</span>
                </nav>
            </div>

            <!-- Hero Header of Article -->
            <div class="space-y-4">
                <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 leading-tight">
                    $encTitle
                </h1>
                <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-neutral-500 pt-2 border-t border-neutral-100 font-light">
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-user-tie text-luxury-gold"></i> <span>$encAuthor</span></span>
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-calendar text-luxury-gold"></i> <span>$encDate</span></span>
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-clock-rotate-left text-luxury-gold"></i> <span>Last Updated: $encUpdated</span></span>
                </div>
            </div>

            <!-- Featured Image -->
            <div class="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-200 bg-neutral-100">
                <img alt="$encTitle" class="w-full h-full object-cover" src="$image" onerror="this.src='/assets/images/dubai-office-2.webp'"/>
            </div>

            <!-- Article Content Body (Raw HTML Pre-rendered) -->
            <div class="article-content space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-light">
$articleContent
            </div>

            <!-- FAQ ACCORDION SECTION (Split: 6 Left, 6 Right) -->
            <div class="space-y-6 pt-12 border-t border-neutral-200">
                <div class="text-center space-y-3 mb-8">
                    <span class="text-xs font-bold uppercase tracking-[0.25em] text-luxury-gold flex items-center justify-center gap-2">
                        <i class="fa-regular fa-circle-question"></i> Desk Answers
                    </span>
                    <h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">Program Integrity &amp; FAQs</h2>
                    <p class="text-xs text-neutral-500">Clear and comprehensive answers regarding legal, investment, and residency parameters</p>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 text-start items-start">
                    <div class="flex flex-col">
$faqCol1Html
                    </div>
                    <div class="flex flex-col">
$faqCol2Html
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- RELATED ARTICLES -->
    <section class="py-20 bg-[#FDFCFB] border-t border-neutral-200/80" id="related-articles-section">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div class="text-center space-y-2">
                <span class="text-xs font-bold uppercase tracking-[0.25em] text-luxury-gold" data-i18n="blog.recommendedReading">Recommended Reading</span>
                <h2 class="font-serif text-2xl sm:text-3xl font-bold text-neutral-900" data-i18n="blog.relatedGuides">Related Advisory Guides</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
$relCardsHtml
            </div>
        </div>
    </section>

    <!-- FULL FREE CONSULTATION FORM SECTION -->
$formHtml

$footerHtml

    <!-- Core Scripts -->
    <script>
        let megaMenuTimer = null;

        function openMegaMenu(menuId) {
            clearTimeout(megaMenuTimer);
            document.querySelectorAll('.mega-dropdown').forEach(menu => {
                if (menu.id !== menuId) {
                    menu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                    menu.classList.add('opacity-0', 'translate-y-[-10px]', 'pointer-events-none');
                }
            });
            document.querySelectorAll('nav i.fa-chevron-down').forEach(arrow => {
                if (arrow.id !== 'arrow-' + menuId) arrow.style.transform = "rotate(0deg)";
            });
            const menu = document.getElementById(menuId);
            if (menu) {
                menu.classList.remove('opacity-0', 'translate-y-[-10px]', 'pointer-events-none');
                menu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
            }
            const activeArrow = document.getElementById('arrow-' + menuId);
            if (activeArrow) activeArrow.style.transform = "rotate(180deg)";
        }

        function keepMegaMenuOpen() {
            clearTimeout(megaMenuTimer);
        }

        function scheduleCloseMegaMenus() {
            clearTimeout(megaMenuTimer);
            megaMenuTimer = setTimeout(() => {
                closeAllMegaMenus();
            }, 250);
        }

        function closeAllMegaMenus() {
            clearTimeout(megaMenuTimer);
            document.querySelectorAll('.mega-dropdown').forEach(menu => {
                menu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                menu.classList.add('opacity-0', 'translate-y-[-10px]', 'pointer-events-none');
            });
            document.querySelectorAll('nav i.fa-chevron-down').forEach(arrow => {
                arrow.style.transform = "rotate(0deg)";
            });
        }

        // Global safety listeners: close when clicking outside, scrolling, or pressing Escape
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#main-header') && !e.target.closest('.mega-dropdown')) {
                closeAllMegaMenus();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllMegaMenus();
            }
        });

        window.addEventListener('scroll', function() {
            closeAllMegaMenus();
        }, { passive: true });

        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.mega-dropdown').forEach(function(dropdown) {
                dropdown.addEventListener('mouseenter', keepMegaMenuOpen);
                dropdown.addEventListener('mouseleave', scheduleCloseMegaMenus);
            });
            const mainHeader = document.getElementById('main-header');
            if (mainHeader) {
                mainHeader.addEventListener('mouseleave', scheduleCloseMegaMenus);
            }
        });

        // Accordion toggle handler
        function toggleBlogFAQ(id) {
            const content = document.getElementById('content-' + id);
            const icon = document.getElementById('icon-' + id);
            if (content && content.style.maxHeight && content.style.maxHeight !== "0px") {
                content.style.maxHeight = "0px";
                if (icon) icon.style.transform = "rotate(0deg)";
            } else if (content) {
                content.style.maxHeight = content.scrollHeight + "px";
                if (icon) icon.style.transform = "rotate(180deg)";
            }
        }

        // Mobile Menu Drawer Toggle
        let isMobileMenuOpen = false;
        function toggleMobileMenu() {
            const drawer = document.getElementById('mobile-menu-drawer');
            const bar1 = document.getElementById('mob-bar1');
            const bar2 = document.getElementById('mob-bar2');
            const bar3 = document.getElementById('mob-bar3');
            isMobileMenuOpen = !isMobileMenuOpen;
            if (isMobileMenuOpen) {
                drawer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
                drawer.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
                if (bar1 && bar2 && bar3) {
                    bar1.style.transform = 'translateY(6.5px) rotate(45deg)';
                    bar2.style.opacity = '0';
                    bar3.style.transform = 'translateY(-6.5px) rotate(-45deg)';
                }
                document.body.style.overflow = 'hidden';
            } else {
                drawer.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
                if (bar1 && bar2 && bar3) {
                    bar1.style.transform = 'none';
                    bar2.style.opacity = '1';
                    bar3.style.transform = 'none';
                }
                document.body.style.overflow = '';
            }
        }
        function toggleMobileAccordion(contentId, arrowId) {
            const content = document.getElementById(contentId);
            const arrow = document.getElementById(arrowId);
            if (content) {
                content.classList.toggle('hidden');
                if (arrow) arrow.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        }
    </script>
    <script src="../../assets/js/language-switcher.js"></script>
    <script src="../../assets/js/blog-translator.js"></script>
    <script src="../../assets/js/forms.js"></script>
</body>
</html>
"@

    # Ensure Directory Exists
    $outDir = Join-Path $baseDir "blog\$slug"
    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    # Write Static HTML in UTF8
    $outFile = Join-Path $outDir "index.html"
    [System.IO.File]::WriteAllText($outFile, $pageHtml, [System.Text.Encoding]::UTF8)

    if (($i + 1) % 10 -eq 0 -or $i -eq $count - 1) {
        Write-Host "Generated $($i + 1)/$count articles ($slug)"
    }
}

Write-Host "All article pages generated successfully!"
