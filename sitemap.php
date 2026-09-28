<?php
/**
 * Sharif Group Dubai - Automated Multilingual XML Sitemap Engine
 * Automatically discovers all pages, programs, and blog articles.
 * Includes full language alternates (EN, FA, AR, ZH, x-default) and real file lastmod timestamps.
 */

// If running in web context, set XML header
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/xml; charset=utf-8');
    header('X-Robots-Tag: noindex'); // Do not index the sitemap as a webpage itself
    header('Cache-Control: public, max-age=3600');
}

$rootDir = realpath(__DIR__);
$baseUrl = 'https://sharifgroup.ae';

// Helper function to parse English dates like "August 2026" or "2026-08-15" to YYYY-MM-DD
function parseDateToIso($rawDate, $fallbackMtime) {
    if (!$rawDate) {
        return date('Y-m-d', $fallbackMtime);
    }
    $raw = trim($rawDate);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
        return $raw;
    }
    $ts = strtotime($raw);
    if ($ts !== false && $ts > 0) {
        return date('Y-m-d', $ts);
    }
    return date('Y-m-d', $fallbackMtime);
}

// 1. Core static pages definition
$corePages = [
    '/' => ['priority' => '1.0', 'changefreq' => 'daily', 'file' => 'index.html'],
    '/citizenshipbyinvestment/' => ['priority' => '0.9', 'changefreq' => 'weekly', 'file' => 'citizenshipbyinvestment/index.html'],
    '/residencybyinvestment/' => ['priority' => '0.9', 'changefreq' => 'weekly', 'file' => 'residencybyinvestment/index.html'],
    '/realestate/' => ['priority' => '0.9', 'changefreq' => 'weekly', 'file' => 'realestate/index.html'],
    '/educationaladvisory/' => ['priority' => '0.8', 'changefreq' => 'weekly', 'file' => 'educationaladvisory/index.html'],
    '/eligibilitychecker/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'file' => 'eligibilitychecker/index.html'],
    '/aboutus/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'file' => 'aboutus/index.html'],
    '/about-founder/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'file' => 'about-founder/index.html'],
    '/contact/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'file' => 'contact/index.html'],
    '/socialresponsibility/' => ['priority' => '0.6', 'changefreq' => 'monthly', 'file' => 'socialresponsibility/index.html'],
    '/privacypolicy/' => ['priority' => '0.3', 'changefreq' => 'yearly', 'file' => 'privacypolicy/index.html'],
    '/cookiepolicy/' => ['priority' => '0.3', 'changefreq' => 'yearly', 'file' => 'cookiepolicy/index.html'],
    '/termsofuse/' => ['priority' => '0.3', 'changefreq' => 'yearly', 'file' => 'termsofuse/index.html'],
    '/blog/' => ['priority' => '0.9', 'changefreq' => 'daily', 'file' => 'blog/index.html'],

    // CBI Programs
    '/programs/citizenshipbyinvestment/dominica/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/dominica/index.html'],
    '/programs/citizenshipbyinvestment/stkitts/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/stkitts/index.html'],
    '/programs/citizenshipbyinvestment/antiguaandbarbuda/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/antiguaandbarbuda/index.html'],
    '/programs/citizenshipbyinvestment/stlucia/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/stlucia/index.html'],
    '/programs/citizenshipbyinvestment/grenada/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/grenada/index.html'],
    '/programs/citizenshipbyinvestment/vanuatu/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/vanuatu/index.html'],
    '/programs/citizenshipbyinvestment/sao-tome-and-principe/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/sao-tome-and-principe/index.html'],
    '/programs/citizenshipbyinvestment/nauru/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/citizenshipbyinvestment/nauru/index.html'],

    // RBI Programs
    '/programs/residencybyinvestment/portugal/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/residencybyinvestment/portugal/index.html'],
    '/programs/residencybyinvestment/greece/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/residencybyinvestment/greece/index.html'],
    '/programs/residencybyinvestment/panama/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/residencybyinvestment/panama/index.html'],
    '/programs/residencybyinvestment/uae/' => ['priority' => '0.85', 'changefreq' => 'weekly', 'file' => 'programs/residencybyinvestment/uae/index.html'],
];

$entries = [];

// Parse core pages
foreach ($corePages as $path => $meta) {
    $filePath = $rootDir . '/' . $meta['file'];
    $mtime = file_exists($filePath) ? filemtime($filePath) : time();
    $entries[] = [
        'path' => $path,
        'lastmod' => date('Y-m-d', $mtime),
        'changefreq' => $meta['changefreq'],
        'priority' => $meta['priority']
    ];
}

// 2. Discover blog articles dynamically from filesystem
$blogDir = $rootDir . '/blog';
if (is_dir($blogDir)) {
    $items = scandir($blogDir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || !is_dir($blogDir . '/' . $item)) {
            continue;
        }
        $articleIndex = $blogDir . '/' . $item . '/index.html';
        if (file_exists($articleIndex)) {
            $mtime = filemtime($articleIndex);
            
            // Check if article file contains "Last Updated: Month Year" or "date: Month Year"
            $artDate = null;
            $sample = file_get_contents($articleIndex, false, null, 0, 50000);
            if (preg_match('/Last Updated:\s*([A-Za-z]+ \d{4})/i', $sample, $dm)) {
                $artDate = $dm[1];
            } elseif (preg_match('/date:\s*[\'"]([A-Za-z]+ \d{4})[\'"]/i', $sample, $dm)) {
                $artDate = $dm[1];
            }
            $lastmod = parseDateToIso($artDate, $mtime);

            $entries[] = [
                'path' => '/blog/' . $item . '/',
                'lastmod' => $lastmod,
                'changefreq' => 'weekly',
                'priority' => '0.80'
            ];
        }
    }
}

// Languages configuration
$languages = [
    'en' => ['prefix' => '', 'code' => 'en'],
    'fa' => ['prefix' => '/fa', 'code' => 'fa'],
    'ar' => ['prefix' => '/ar', 'code' => 'ar'],
    'zh' => ['prefix' => '/zh', 'code' => 'zh']
];

// Build XML output
$out = [];
$out[] = '<?xml version="1.0" encoding="UTF-8"?>';
$out[] = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
$out[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
$out[] = '        xmlns:xhtml="http://www.w3.org/1999/xhtml"';
$out[] = '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
$out[] = '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9';
$out[] = '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';

foreach ($languages as $langKey => $langMeta) {
    $out[] = "\n    <!-- ==================== " . strtoupper($langKey) . " PAGES ==================== -->";
    foreach ($entries as $e) {
        $p = $e['path'];
        $loc = ($langKey === 'en') ? ($baseUrl . $p) : ($baseUrl . $langMeta['prefix'] . ($p === '/' ? '/' : $p));

        $out[] = '    <url>';
        $out[] = '        <loc>' . htmlspecialchars($loc, ENT_QUOTES, 'UTF-8') . '</loc>';
        $out[] = '        <lastmod>' . $e['lastmod'] . '</lastmod>';
        $out[] = '        <changefreq>' . $e['changefreq'] . '</changefreq>';
        $out[] = '        <priority>' . $e['priority'] . '</priority>';

        // Reciprocal alternates
        $out[] = '        <xhtml:link rel="alternate" hreflang="x-default" href="' . htmlspecialchars($baseUrl . $p, ENT_QUOTES, 'UTF-8') . '" />';
        $out[] = '        <xhtml:link rel="alternate" hreflang="en" href="' . htmlspecialchars($baseUrl . $p, ENT_QUOTES, 'UTF-8') . '" />';
        $out[] = '        <xhtml:link rel="alternate" hreflang="fa" href="' . htmlspecialchars($baseUrl . '/fa' . ($p === '/' ? '/' : $p), ENT_QUOTES, 'UTF-8') . '" />';
        $out[] = '        <xhtml:link rel="alternate" hreflang="ar" href="' . htmlspecialchars($baseUrl . '/ar' . ($p === '/' ? '/' : $p), ENT_QUOTES, 'UTF-8') . '" />';
        $out[] = '        <xhtml:link rel="alternate" hreflang="zh" href="' . htmlspecialchars($baseUrl . '/zh' . ($p === '/' ? '/' : $p), ENT_QUOTES, 'UTF-8') . '" />';
        $out[] = '    </url>';
    }
}

$out[] = '</urlset>';
$xmlContent = implode("\n", $out) . "\n";

// If requested via CLI flag `--write` or via GET parameter `?save=1`
if ((isset($argv) && in_array('--write', $argv)) || (!empty($_GET['save']) && $_GET['save'] === '1')) {
    $targetFile = $rootDir . '/sitemap.xml';
    file_put_contents($targetFile, $xmlContent);
    if (php_sapi_name() === 'cli') {
        echo "Successfully wrote dynamic sitemap to " . $targetFile . " with " . (count($entries) * count($languages)) . " total URLs.\n";
    }
}

// If in web context, print XML
if (php_sapi_name() !== 'cli') {
    echo $xmlContent;
}
