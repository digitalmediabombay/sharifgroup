<?php
/**
 * Sharif Group Dubai - Automated Multilingual XML Sitemap Engine
 * Automatically discovers all core pages, programs, static blog articles,
 * and dynamically published CMS dashboard blog articles.
 * Includes full language alternates (EN, FA, AR, ZH, x-default) and real file lastmod timestamps.
 */

// Helper function to parse English dates like "August 2026", "2026-08-15" to YYYY-MM-DD
if (!function_exists('parseDateToIso')) {
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
}

/**
 * Builds the complete multilingual XML sitemap string and optionally writes it to sitemap.xml
 *
 * @param string $rootDir Absolute path to website root
 * @param bool $writeToDisk Whether to write the generated XML to sitemap.xml
 * @return array Result metadata including 'xml', 'urlCount', 'entriesCount', and 'fileWritten'
 */
if (!function_exists('buildSitemapXml')) {
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
    $cmsBlogs = [];
    $primaryPubJsonFile = $rootDir . '/assets/data/published_content.json';
    $legacyPubJsonFile  = $rootDir . '/admin/api/published_content.json';
    $publishedJsonFile  = file_exists($primaryPubJsonFile) ? $primaryPubJsonFile : $legacyPubJsonFile;
    if (file_exists($publishedJsonFile)) {
        $jsonStr = @file_get_contents($publishedJsonFile);
        if ($jsonStr) {
            $parsed = @json_decode($jsonStr, true);
            if (is_array($parsed)) {
                if (!empty($parsed['sgcms_blog']) && is_array($parsed['sgcms_blog'])) {
                    $cmsBlogs = $parsed['sgcms_blog'];
                }
                if (!empty($parsed['sgcms_deleted_slugs']) && is_array($parsed['sgcms_deleted_slugs'])) {
                    $deletedSlugs = array_merge($deletedSlugs, $parsed['sgcms_deleted_slugs']);
                }
            }
        }
    }

    // Fallback 1: Query MySQL if published_content.json has no blogs or was empty
    if (empty($cmsBlogs) && file_exists($rootDir . '/admin/api/db.php')) {
        try {
            require_once $rootDir . '/admin/api/db.php';
            if (function_exists('getDb')) {
                $db = getDb(true);
                if ($db !== null) {
                    $stmt = $db->prepare("SELECT live_data, draft_data FROM cms_content WHERE content_key = 'sgcms_blog' LIMIT 1");
                    $stmt->execute();
                    $row = $stmt->fetch();
                    $raw = !empty($row['live_data']) ? $row['live_data'] : (!empty($row['draft_data']) ? $row['draft_data'] : null);
                    if ($raw) {
                        $dbBlogs = json_decode($raw, true);
                        if (is_array($dbBlogs) && !empty($dbBlogs)) {
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

    // Fallback 2: Check draft_content.json if published_content and MySQL both had no blogs
    if (empty($cmsBlogs)) {
        $draftJsonFile = $rootDir . '/admin/api/draft_content.json';
        if (file_exists($draftJsonFile)) {
            $draftStr = @file_get_contents($draftJsonFile);
            if ($draftStr) {
                $dParsed = @json_decode($draftStr, true);
                if (isset($dParsed['sgcms_blog']) && is_array($dParsed['sgcms_blog']) && !empty($dParsed['sgcms_blog'])) {
                    $cmsBlogs = $dParsed['sgcms_blog'];
                }
                if (!empty($dParsed['sgcms_deleted_slugs']) && is_array($dParsed['sgcms_deleted_slugs'])) {
                    $deletedSlugs = array_merge($deletedSlugs, $dParsed['sgcms_deleted_slugs']);
                }
            }
        }
    }

    // Build hash map of deleted slugs / IDs for fast exclusion
    $permanentBlacklist = [
        'sample-dominicaartcile',
        'sample-dominicaarticle',
        'sampledominicaartcile',
        'sampledominicaarticle'
    ];
    $deletedSlugs = array_merge($deletedSlugs, $permanentBlacklist);

    $deletedMap = [];
    foreach ($deletedSlugs as $ds) {
        $clean = strtolower(trim((string)$ds));
        if ($clean !== '') {
            $deletedMap[$clean] = true;
        }
    }

    // Un-blacklist any slug or ID actively present in $cmsBlogs (user re-created or editing article)
    if (!empty($cmsBlogs) && is_array($cmsBlogs)) {
        $reHealed = false;
        foreach ($cmsBlogs as $b) {
            if (!is_array($b) || !empty($b['deleted']) || ($b['status'] ?? '') === 'deleted') continue;
            $as = strtolower(trim($b['slug'] ?? ($b['en']['slug'] ?? '')));
            $aid = strtolower(trim($b['id'] ?? ''));
            if (in_array($as, $permanentBlacklist) || in_array($aid, $permanentBlacklist)) continue;
            if ($as !== '' && isset($deletedMap[$as])) {
                unset($deletedMap[$as]);
                $reHealed = true;
            }
            if ($aid !== '' && isset($deletedMap[$aid])) {
                unset($deletedMap[$aid]);
                $reHealed = true;
            }
        }
        // Self-heal published_content.json & draft_content.json so deleted_slugs doesn't keep blocking it
        if ($reHealed) {
            if (file_exists($publishedJsonFile)) {
                $pRaw = @file_get_contents($publishedJsonFile);
                if ($pRaw) {
                    $pJson = @json_decode($pRaw, true);
                    if (isset($pJson['sgcms_deleted_slugs']) && is_array($pJson['sgcms_deleted_slugs'])) {
                        $pJson['sgcms_deleted_slugs'] = array_values(array_filter($pJson['sgcms_deleted_slugs'], function($s) use ($deletedMap) {
                            return isset($deletedMap[strtolower(trim((string)$s))]);
                        }));
                        @file_put_contents($publishedJsonFile, json_encode($pJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
                    }
                }
            }
            $draftJsonFile = $rootDir . '/admin/api/draft_content.json';
            if (file_exists($draftJsonFile)) {
                $dRaw = @file_get_contents($draftJsonFile);
                if ($dRaw) {
                    $dJson = @json_decode($dRaw, true);
                    if (isset($dJson['sgcms_deleted_slugs']) && is_array($dJson['sgcms_deleted_slugs'])) {
                        $dJson['sgcms_deleted_slugs'] = array_values(array_filter($dJson['sgcms_deleted_slugs'], function($s) use ($deletedMap) {
                            return isset($deletedMap[strtolower(trim((string)$s))]);
                        }));
                        @file_put_contents($draftJsonFile, json_encode($dJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
                    }
                }
            }
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

            // Include all active articles (exclude only explicitly deleted or hidden items)
            $statusEn = strtolower($b['status_en'] ?? ($b['status'] ?? ($b['en']['status'] ?? 'published')));
            if ($statusEn === 'deleted' || $statusEn === 'hidden' || !empty($b['deleted'])) {
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
        'fileWritten' => $fileWritten,
        'entries' => $entries,
        'languages' => $languages,
        'baseUrl' => $baseUrl
    ];
}
}

/**
 * Generates an interactive, styled HTML representation of the sitemap
 * for modern desktop and mobile browsers where client-side XSLT is disabled.
 */
if (!function_exists('buildSitemapHtml')) {
function buildSitemapHtml($entries, $languages, $baseUrl) {
    $totalCount = count($entries) * count($languages);
    $rowsHtml = '';
    $idx = 1;

    foreach ($languages as $langKey => $langMeta) {
        foreach ($entries as $e) {
            $p = $e['path'];
            $loc = ($langKey === 'en') ? ($baseUrl . $p) : ($baseUrl . $langMeta['prefix'] . ($p === '/' ? '/' : $p));
            $priority = $e['priority'];
            $priorityPercent = round((float)$priority * 100);
            $changefreq = htmlspecialchars($e['changefreq'], ENT_QUOTES, 'UTF-8');
            $lastmod = htmlspecialchars($e['lastmod'], ENT_QUOTES, 'UTF-8');
            $locEsc = htmlspecialchars($loc, ENT_QUOTES, 'UTF-8');
            $upperLang = strtoupper($langKey);

            $rowsHtml .= "                                    <tr data-url=\"{$locEsc}\" data-lang=\"{$langKey}\">\n";
            $rowsHtml .= "                                        <td class=\"col-idx\">{$idx}</td>\n";
            $rowsHtml .= "                                        <td><a class=\"url-link\" href=\"{$locEsc}\" target=\"_blank\" rel=\"noopener\">{$locEsc}</a></td>\n";
            $rowsHtml .= "                                        <td><span class=\"badge-lang badge-lang-{$langKey}\">{$upperLang}</span></td>\n";
            $rowsHtml .= "                                        <td><div class=\"priority-wrap\"><span class=\"priority-pill\">{$priority}</span><div class=\"priority-bar-bg\"><div class=\"priority-bar-fill\" style=\"width: {$priorityPercent}%\"></div></div></div></td>\n";
            $rowsHtml .= "                                        <td><span class=\"freq-tag\">{$changefreq}</span></td>\n";
            $rowsHtml .= "                                        <td><span class=\"date-text\">{$lastmod}</span></td>\n";
            $rowsHtml .= "                                    </tr>\n";
            $idx++;
        }
    }

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XML Sitemap | Sharif Group Dubai</title>
    <link rel="icon" type="image/svg+xml" href="/assets/images/Group-427321463.svg">
    <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/Group-427321463.svg">
    <style type="text/css">
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #f8fafc;
            line-height: 1.5;
            padding: 32px 24px;
        }
        .container {
            max-width: 1240px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0b192c 0%, #1e293b 100%);
            color: #ffffff;
            padding: 36px 40px;
            border-bottom: 3px solid #d4af37;
        }
        .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 12px;
        }
        .brand-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .brand-gold { color: #d4af37; }
        .badge-sitemap {
            background: rgba(212, 175, 55, 0.2);
            color: #fce79a;
            border: 1px solid rgba(212, 175, 55, 0.4);
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        .badge-sitemap:hover {
            background: rgba(212, 175, 55, 0.35);
            color: #ffffff;
        }
        .header-desc {
            font-size: 14px;
            color: #94a3b8;
            max-width: 800px;
            line-height: 1.6;
        }
        .header-desc a { color: #fce79a; text-decoration: underline; }
        .meta-bar {
            background: #f1f5f9;
            padding: 18px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .stat-group {
            display: flex;
            align-items: center;
            gap: 24px;
            flex-wrap: wrap;
        }
        .stat-item {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }
        .stat-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-val {
            font-size: 18px;
            font-weight: 700;
            color: #0b192c;
        }
        .filter-bar {
            padding: 20px 40px;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }
        .search-input {
            flex: 1;
            min-width: 280px;
            max-width: 420px;
            padding: 10px 16px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
            border-color: #d4af37;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
        }
        .lang-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .tab-btn {
            padding: 8px 14px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #475569;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tab-btn:hover { border-color: #0b192c; color: #0b192c; }
        .tab-btn.active {
            background: #0b192c;
            color: #ffffff;
            border-color: #0b192c;
        }
        .table-wrapper { overflow-x: auto; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
            text-align: left;
        }
        thead th {
            background: #f8fafc;
            color: #475569;
            padding: 14px 20px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11.5px;
            letter-spacing: 0.6px;
            border-bottom: 2px solid #e2e8f0;
            white-space: nowrap;
        }
        tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.15s ease;
        }
        tbody tr:hover { background-color: #f8fafc; }
        tbody td { padding: 14px 20px; vertical-align: middle; }
        .col-idx {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 500;
            width: 48px;
            text-align: center;
        }
        .url-link {
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
            white-space: nowrap;
            display: inline-block;
        }
        .url-link:hover { color: #0369a1; text-decoration: underline; }
        .badge-lang {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 6px;
        }
        .badge-lang-en { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .badge-lang-fa { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-lang-ar { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-lang-zh { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .priority-wrap { display: flex; align-items: center; gap: 8px; }
        .priority-pill {
            font-weight: 700;
            font-size: 12px;
            color: #334155;
            min-width: 28px;
        }
        .priority-bar-bg {
            width: 60px;
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            overflow: hidden;
        }
        .priority-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #d4af37, #f59e0b);
            border-radius: 3px;
        }
        .freq-tag {
            display: inline-block;
            padding: 3px 8px;
            background: #f1f5f9;
            color: #475569;
            border-radius: 6px;
            font-size: 11.5px;
            font-weight: 500;
            text-transform: capitalize;
        }
        .date-text { color: #64748b; font-size: 12.5px; white-space: nowrap; }
        .footer-note {
            padding: 20px 40px;
            background: #ffffff;
            border-top: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12.5px;
            color: #94a3b8;
            flex-wrap: wrap;
            gap: 12px;
        }
        .footer-note a { color: #64748b; text-decoration: none; }
        .footer-note a:hover { color: #0b192c; }
    </style>
    <script type="text/javascript">
        var currentLang = 'all';
        var currentQuery = '';

        function getTokens(str) {
            if (!str) return [];
            var s = str.toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/sharifgroup\.ae\/?/, '')
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();
            return s ? s.split(/\s+/).filter(Boolean) : [];
        }

        function filterRows() {
            var rows = document.querySelectorAll('tbody tr');
            var visibleCount = 0;
            var rawQ = (currentQuery || '').trim().toLowerCase();
            var directTerm = rawQ.replace(/^https?:\/\//, '').replace(/^www\./, '');
            var qTokens = getTokens(rawQ);

            rows.forEach(function(r) {
                var rawUrl = (r.getAttribute('data-url') || '').toLowerCase();
                var cleanUrl = rawUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
                var lang = r.getAttribute('data-lang') || 'en';

                var matchQuery = true;
                if (rawQ) {
                    var directMatch = (rawUrl.indexOf(rawQ) !== -1) || (cleanUrl.indexOf(directTerm) !== -1);
                    var tokenMatch = qTokens.length > 0 && qTokens.every(function(t) {
                        return cleanUrl.indexOf(t) !== -1;
                    });
                    matchQuery = directMatch || tokenMatch;
                }
                var matchLang = (currentLang === 'all') || (lang === currentLang);

                if (matchQuery && matchLang) {
                    r.style.display = '';
                    visibleCount++;
                } else {
                    r.style.display = 'none';
                }
            });
            var countEl = document.getElementById('visibleCount');
            if (countEl) countEl.textContent = visibleCount;
        }

        function onSearch(e) {
            currentQuery = (e.target.value || '').trim();
            filterRows();
        }

        function setLang(lang, btn) {
            currentLang = lang;
            document.querySelectorAll('.tab-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            if (btn) btn.classList.add('active');
            filterRows();
        }

        document.addEventListener('DOMContentLoaded', function() {
            var countEl = document.getElementById('visibleCount');
            var totalEl = document.getElementById('totalCount');
            var rows = document.querySelectorAll('tbody tr');
            if (countEl) countEl.textContent = rows.length;
            if (totalEl) totalEl.textContent = rows.length;
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand-row">
                <div class="brand-title">
                    <img src="/assets/images/Group-427321463.svg" alt="Sharif Group Logo" style="width: 28px; height: 32px; object-fit: contain;">
                    <span>SHARIF GROUP <span class="brand-gold">DUBAI</span></span>
                </div>
                <a href="/sitemap.xml?format=xml" class="badge-sitemap" title="Click to view raw XML output">
                    <span>Standard XML Protocol 0.9</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
            </div>
            <p class="header-desc">
                Automated Multilingual XML Sitemap for search engines and web crawlers (Google, Bing, Yandex). 
                Includes full reciprocal <a href="https://developers.google.com/search/docs/specialty/international/localized-versions" target="_blank" rel="noopener">hreflang alternates</a> for English, Persian (Farsi), Arabic, and Chinese.
            </p>
        </div>

        <div class="meta-bar">
            <div class="stat-group">
                <div class="stat-item">
                    <span class="stat-label">Total URLs:</span>
                    <span class="stat-val" id="totalCount">{$totalCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Showing:</span>
                    <span class="stat-val" id="visibleCount">{$totalCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Languages:</span>
                    <span class="stat-val">EN / FA / AR / ZH</span>
                </div>
            </div>
        </div>

        <div class="filter-bar">
            <input type="text" class="search-input" placeholder="Search page URL or slug..." oninput="onSearch(event)" onkeyup="onSearch(event)">
            <div class="lang-tabs">
                <button type="button" class="tab-btn active" onclick="setLang('all', this)">All</button>
                <button type="button" class="tab-btn" onclick="setLang('en', this)">English</button>
                <button type="button" class="tab-btn" onclick="setLang('fa', this)">Farsi (fa)</button>
                <button type="button" class="tab-btn" onclick="setLang('ar', this)">Arabic (ar)</button>
                <button type="button" class="tab-btn" onclick="setLang('zh', this)">Chinese (zh)</button>
            </div>
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th class="col-idx">#</th>
                        <th>Page URL</th>
                        <th>Lang</th>
                        <th>Priority</th>
                        <th>Change Frequency</th>
                        <th>Last Modified</th>
                    </tr>
                </thead>
                <tbody>
{$rowsHtml}
                </tbody>
            </table>
        </div>

        <div class="footer-note">
            <span>Sharif Group Dubai © All Rights Reserved</span>
            <a href="https://sharifgroup.ae" target="_blank">sharifgroup.ae</a>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}
}

// ── STANDALONE SCRIPT EXECUTION (Web Request or CLI) ─────────────────────────
$isDirectExecution = (
    php_sapi_name() === 'cli' ||
    (!defined('SITEMAP_LOADED_AS_LIB') && (
        basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'sitemap.php' ||
        basename($_SERVER['SCRIPT_NAME'] ?? '') === 'sitemap.php' ||
        strpos($_SERVER['REQUEST_URI'] ?? '', 'sitemap.php') !== false ||
        strpos($_SERVER['REQUEST_URI'] ?? '', 'sitemap.xml') !== false
    ))
);

if ($isDirectExecution) {
    $rootDir = realpath(__DIR__);
    // Always write sitemap.xml to disk so static web server delivery also remains 100% updated
    $shouldWrite = true;

    $res = buildSitemapXml($rootDir, $shouldWrite);

    if (php_sapi_name() === 'cli' && empty($_SERVER['HTTP_ACCEPT'])) {
        echo "Successfully wrote dynamic sitemap to " . $rootDir . "/sitemap.xml with " . $res['urlCount'] . " total URLs (" . $res['entriesCount'] . " unique paths across 4 languages).\n";
    } else {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $isBot = (bool)preg_match('/(googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora|whatsapp|crawler|spider|bot)/i', $userAgent);
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $wantsXml = (
            (isset($_GET['format']) && $_GET['format'] === 'xml') ||
            (strpos($accept, 'application/xml') !== false && strpos($accept, 'text/html') === false) ||
            $isBot
        );

        if ($wantsXml) {
            // Raw XML for search engines and API consumers
            header('Content-Type: application/xml; charset=utf-8');
            header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
            echo $res['xml'];
        } else {
            // Interactive HTML for human visitors and web browsers
            header('Content-Type: text/html; charset=utf-8');
            header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
            echo buildSitemapHtml($res['entries'], $res['languages'], $res['baseUrl']);
        }
    }
}
