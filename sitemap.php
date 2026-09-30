<?php
/**
 * Sharif Group Dubai - Automated Multilingual XML Sitemap Engine
 * Automatically discovers all core pages, programs, static blog articles,
 * and dynamically published CMS dashboard blog articles.
 * Includes full language alternates (EN, FA, AR, ZH, x-default) and real file lastmod timestamps.
 */

// Helper function to parse English dates like "August 2026", "2026-08-15" to YYYY-MM-DD
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

/**
 * Builds the complete multilingual XML sitemap string and optionally writes it to sitemap.xml
 *
 * @param string $rootDir Absolute path to website root
 * @param bool $writeToDisk Whether to write the generated XML to sitemap.xml
 * @return array Result metadata including 'xml', 'urlCount', 'entriesCount', and 'fileWritten'
 */
function buildSitemapXml($rootDir, $writeToDisk = false) {
    $baseUrl = 'https://sharifgroup.ae';

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
    $seenPaths = [];

    // Parse core static pages
    foreach ($corePages as $path => $meta) {
        $filePath = $rootDir . '/' . $meta['file'];
        $mtime = file_exists($filePath) ? filemtime($filePath) : time();
        $entries[] = [
            'path' => $path,
            'lastmod' => date('Y-m-d', $mtime),
            'changefreq' => $meta['changefreq'],
            'priority' => $meta['priority']
        ];
        $seenPaths[$path] = true;
    }

    // Load deleted slugs blacklist from published_content.json if present
    $deletedSlugs = [];
    $cmsBlogs = null; // null indicates not yet loaded from any store
    $publishedJsonFile = $rootDir . '/admin/api/published_content.json';
    if (file_exists($publishedJsonFile)) {
        $jsonStr = @file_get_contents($publishedJsonFile);
        if ($jsonStr) {
            $parsed = @json_decode($jsonStr, true);
            if (is_array($parsed)) {
                if (isset($parsed['sgcms_blog']) && is_array($parsed['sgcms_blog'])) {
                    $cmsBlogs = $parsed['sgcms_blog'];
                }
                if (!empty($parsed['sgcms_deleted_slugs']) && is_array($parsed['sgcms_deleted_slugs'])) {
                    $deletedSlugs = array_merge($deletedSlugs, $parsed['sgcms_deleted_slugs']);
                }
            }
        }
    }

    // Fallback: ONLY query MySQL if published_content.json was missing or did not define sgcms_blog
    if ($cmsBlogs === null && file_exists($rootDir . '/admin/api/db.php')) {
        try {
            require_once $rootDir . '/admin/api/db.php';
            if (function_exists('getDb')) {
                $db = getDb(true);
                if ($db !== null) {
                    $stmt = $db->prepare("SELECT live_data FROM cms_content WHERE content_key = 'sgcms_blog' LIMIT 1");
                    $stmt->execute();
                    $row = $stmt->fetch();
                    if (!empty($row['live_data'])) {
                        $dbBlogs = json_decode($row['live_data'], true);
                        if (is_array($dbBlogs)) {
                            $cmsBlogs = $dbBlogs;
                        }
                    }
                    $dStmt = $db->prepare("SELECT live_data FROM cms_content WHERE content_key = 'sgcms_deleted_slugs' LIMIT 1");
                    $dStmt->execute();
                    $dRow = $dStmt->fetch();
                    if (!empty($dRow['live_data'])) {
                        $dbDel = json_decode($dRow['live_data'], true);
                        if (is_array($dbDel)) {
                            $deletedSlugs = array_merge($deletedSlugs, $dbDel);
                        }
                    }
                }
            }
        } catch (Throwable $e) {}
    }

    if ($cmsBlogs === null) {
        $cmsBlogs = [];
    }

    // Build hash map of deleted slugs / IDs for fast exclusion
    $deletedMap = [];
    foreach ($deletedSlugs as $ds) {
        $clean = strtolower(trim((string)$ds));
        if ($clean !== '') {
            $deletedMap[$clean] = true;
        }
    }

    // 2. Discover static blog articles from filesystem directories
    $blogDir = $rootDir . '/blog';
    if (is_dir($blogDir)) {
        $items = scandir($blogDir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || !is_dir($blogDir . '/' . $item)) {
                continue;
            }
            $cleanItem = strtolower(trim((string)$item));
            if (isset($deletedMap[$cleanItem])) {
                continue;
            }

            $articleIndex = $blogDir . '/' . $item . '/index.html';
            if (file_exists($articleIndex)) {
                $mtime = filemtime($articleIndex);

                // Check if article file contains "Last Updated: Month Year" or "date: Month Year"
                $artDate = null;
                $sample = @file_get_contents($articleIndex, false, null, 0, 2048);
                if ($sample) {
                    if (preg_match('/Last Updated:\s*([A-Za-z]+ \d{4})/i', $sample, $dm)) {
                        $artDate = $dm[1];
                    } elseif (preg_match('/date:\s*[\'"]([A-Za-z]+ \d{4})[\'"]/i', $sample, $dm)) {
                        $artDate = $dm[1];
                    }
                }
                $lastmod = parseDateToIso($artDate, $mtime);
                $entryPath = '/blog/' . $item . '/';

                if (!isset($seenPaths[$entryPath])) {
                    $entries[] = [
                        'path' => $entryPath,
                        'lastmod' => $lastmod,
                        'changefreq' => 'weekly',
                        'priority' => '0.80'
                    ];
                    $seenPaths[$entryPath] = true;
                }
            }
        }
    }

    // 3. Process published CMS blogs into sitemap
    if (!empty($cmsBlogs) && is_array($cmsBlogs)) {
        foreach ($cmsBlogs as $b) {
            if (!is_array($b)) continue;

            // Only include published articles (exclude explicit drafts and deleted items)
            $statusEn = strtolower($b['status_en'] ?? ($b['status'] ?? ($b['en']['status'] ?? 'published')));
            if ($statusEn === 'draft' || $statusEn === 'deleted' || !empty($b['deleted'])) {
                continue;
            }

            // Extract primary slug
            $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ''));
            if (!$slug && !empty($b['en']['title'])) {
                $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($b['en']['title'])));
                $slug = trim($slug, '-');
            }
            if (!$slug && !empty($b['title'])) {
                $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($b['title'])));
                $slug = trim($slug, '-');
            }
            if (!$slug && !empty($b['id'])) {
                $slug = trim($b['id']);
            }
            if (!$slug) continue;

            // Exclude if slug or ID matches deleted blacklist
            $slugClean = strtolower(trim($slug));
            $idClean = strtolower(trim($b['id'] ?? ''));
            if (isset($deletedMap[$slugClean]) || ($idClean !== '' && isset($deletedMap[$idClean]))) {
                continue;
            }

            $entryPath = '/blog/' . $slug . '/';
            if (!isset($seenPaths[$entryPath])) {
                $rawDate = $b['publish_date'] ?? ($b['date'] ?? ($b['updated_at'] ?? date('Y-m-d')));
                $lastmod = parseDateToIso($rawDate, time());

                $entries[] = [
                    'path' => $entryPath,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.80'
                ];
                $seenPaths[$entryPath] = true;
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

    $fileWritten = false;
    if ($writeToDisk) {
        $targetFile = $rootDir . '/sitemap.xml';
        $fileWritten = (file_put_contents($targetFile, $xmlContent) !== false);
    }

    return [
        'xml' => $xmlContent,
        'urlCount' => count($entries) * count($languages),
        'entriesCount' => count($entries),
        'fileWritten' => $fileWritten
    ];
}

// ── STANDALONE SCRIPT EXECUTION (Web Request or CLI) ─────────────────────────
$isDirectExecution = (
    (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === realpath(__FILE__)) ||
    (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__))
);

if ($isDirectExecution) {
    $rootDir = realpath(__DIR__);
    $shouldWrite = (
        (isset($argv) && in_array('--write', $argv)) ||
        (!empty($_GET['save']) && $_GET['save'] === '1')
    );

    $res = buildSitemapXml($rootDir, $shouldWrite);

    if (php_sapi_name() === 'cli') {
        if ($shouldWrite) {
            echo "Successfully wrote dynamic sitemap to " . $rootDir . "/sitemap.xml with " . $res['urlCount'] . " total URLs (" . $res['entriesCount'] . " unique paths across 4 languages).\n";
        } else {
            echo "Sitemap dry run completed: " . $res['urlCount'] . " URLs generated. Use --write to save to sitemap.xml.\n";
        }
    } else {
        // Web context: send XML headers and body
        header('Content-Type: application/xml; charset=utf-8');
        header('X-Robots-Tag: noindex');
        header('Cache-Control: public, max-age=3600');
        echo $res['xml'];
    }
}
