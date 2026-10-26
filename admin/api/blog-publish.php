<?php
/**
 * Sharif Group CMS - Publish Blog Post API
 * Promotes a blog post to live production, compiles static HTML for all 4 languages,
 * updates blog index pages, and regenerates sitemap.xml.
 */

require_once __DIR__ . '/db.php';

@set_time_limit(180);
@ignore_user_abort(true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

if (empty($body) || !is_array($body)) {
    jsonResponse(['success' => false, 'error' => 'No content received.'], 400);
}

$id = trim($body['id'] ?? '');
$draftSnapshot = readDraftSnapshot();
$publishedSnapshot = readPublishedSnapshot();

if (!isset($draftSnapshot['sgcms_blog']) || !is_array($draftSnapshot['sgcms_blog'])) {
    $draftSnapshot['sgcms_blog'] = [];
}
if (!isset($publishedSnapshot['sgcms_blog']) || !is_array($publishedSnapshot['sgcms_blog'])) {
    $publishedSnapshot['sgcms_blog'] = [];
}

$blogItem = null;

// Case 1: Full blog object passed directly in request
if (!empty($body['en']['title']) || !empty($body['slug'])) {
    // Generate or keep id
    if (!$id || strpos($id, 'new-') === 0 || $id === 'null' || $id === 'undefined') {
        $id = 'bid-' . substr(bin2hex(random_bytes(4)), 0, 7);
    }
    $program = trim($body['program'] ?? '');
    $category = trim($body['category'] ?? 'Citizenship');
    $subcategory = trim($body['subcategory'] ?? ($program ?: ''));
    $author = trim($body['author'] ?? 'Sharif Group Legal Desk');
    if ($author === '') $author = 'Sharif Group Legal Desk';
    $featuredImg = trim($body['featured_img'] ?? '');
    $publishDate = trim($body['publish_date'] ?? date('Y-m-d'));

    $enTitle = trim($body['en']['title'] ?? '');
    $slug = trim($body['slug'] ?? '');
    if ($slug === '') {
        $rawSlug = $enTitle !== '' ? $enTitle : 'blog-' . $id;
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $rawSlug));
        $slug = trim($slug, '-');
    } else {
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9\-]+/', '-', $slug));
        $slug = trim($slug, '-');
    }
    if ($slug === '') $slug = 'blog-' . $id;

    $languages = ['en', 'ar', 'fa', 'zh'];
    $langData = [];
    $incomingFaqs = is_array($body['faqs'] ?? null) ? $body['faqs'] : [];

    foreach ($languages as $lng) {
        $src = is_array($body[$lng] ?? null) ? $body[$lng] : [];
        $title = trim($src['title'] ?? '');
        $bodyHtml = trim($src['body'] ?? '');
        $excerpt = trim($src['excerpt'] ?? '');
        $metaTitle = trim($src['meta_title'] ?? '');
        $metaDesc = trim($src['meta_desc'] ?? '');

        $lngFaqs = [];
        if (!empty($incomingFaqs[$lng]) && is_array($incomingFaqs[$lng])) {
            foreach ($incomingFaqs[$lng] as $faq) {
                if (!is_array($faq)) continue;
                $q = trim($faq['q'] ?? '');
                $a = trim($faq['a'] ?? '');
                if ($q !== '' || $a !== '') {
                    $lngFaqs[] = ['q' => $q, 'a' => $a];
                }
            }
        }

        $langData[$lng] = [
            'title'        => $title,
            'slug'         => $slug,
            'category'     => $category,
            'subcategory'  => $subcategory,
            'excerpt'      => $excerpt,
            'body'         => $bodyHtml,
            'meta_title'   => $metaTitle ?: ($title ? "$title | Sharif Group" : ''),
            'meta_desc'    => $metaDesc ?: ($excerpt ?: 'Strategic advisory & legal insights from Sharif Group Dubai.'),
            'faqs'         => $lngFaqs,
            'featured_img' => $featuredImg,
            'image'        => $featuredImg
        ];
    }

    $globalFaqs = !empty($langData['en']['faqs']) ? $langData['en']['faqs'] : [];

    $blogItem = [
        'id'           => $id,
        'slug'         => $slug,
        'program'      => $program,
        'author'       => $author,
        'category'     => $category,
        'subcategory'  => $subcategory,
        'featured_img' => $featuredImg,
        'publish_date' => $publishDate,
        'updated_at'   => date('Y-m-d H:i:s'),
        'status'       => 'published',
        'status_en'    => 'published',
        'status_ar'    => 'published',
        'status_fa'    => 'published',
        'status_zh'    => 'published',
        'faqs'         => $globalFaqs,
        'en'           => $langData['en'],
        'ar'           => $langData['ar'],
        'fa'           => $langData['fa'],
        'zh'           => $langData['zh']
    ];
} else if ($id) {
    // Case 2: ID supplied, locate in draft snapshot
    foreach ($draftSnapshot['sgcms_blog'] as $existing) {
        if (!is_array($existing)) continue;
        if (($existing['id'] ?? '') === $id || ($existing['slug'] ?? '') === $id) {
            $blogItem = $existing;
            break;
        }
    }
}

if (!$blogItem) {
    jsonResponse(['success' => false, 'error' => 'Blog item not found or invalid payload.'], 404);
}

// Mark statuses as published
$blogItem['status'] = 'published';
$blogItem['status_en'] = 'published';
$blogItem['status_ar'] = 'published';
$blogItem['status_fa'] = 'published';
$blogItem['status_zh'] = 'published';
$blogItem['updated_at'] = date('Y-m-d H:i:s');
$blogId = $blogItem['id'];
$blogSlug = $blogItem['slug'];

// 1. Update draft snapshot with published status
$foundDraft = false;
foreach ($draftSnapshot['sgcms_blog'] as $idx => $existing) {
    if (!is_array($existing)) continue;
    if (($existing['id'] ?? '') === $blogId || ($existing['slug'] ?? '') === $blogSlug) {
        $draftSnapshot['sgcms_blog'][$idx] = $blogItem;
        $foundDraft = true;
        break;
    }
}
if (!$foundDraft) {
    array_unshift($draftSnapshot['sgcms_blog'], $blogItem);
}
writeDraftSnapshot($draftSnapshot);

// 2. Remove slug from deleted blacklist if present
if (!empty($publishedSnapshot['sgcms_deleted_slugs']) && is_array($publishedSnapshot['sgcms_deleted_slugs'])) {
    $publishedSnapshot['sgcms_deleted_slugs'] = array_values(array_filter(
        $publishedSnapshot['sgcms_deleted_slugs'],
        function($s) use ($blogSlug, $blogId) {
            $sl = strtolower(trim($s));
            return $sl !== strtolower($blogSlug) && $sl !== strtolower($blogId);
        }
    ));
}

// 3. Update published snapshot: replace or unshift
$foundPub = false;
foreach ($publishedSnapshot['sgcms_blog'] as $idx => $existing) {
    if (!is_array($existing)) continue;
    if (($existing['id'] ?? '') === $blogId || ($existing['slug'] ?? '') === $blogSlug) {
        $publishedSnapshot['sgcms_blog'][$idx] = $blogItem;
        $foundPub = true;
        break;
    }
}
if (!$foundPub) {
    array_unshift($publishedSnapshot['sgcms_blog'], $blogItem);
}
writePublishedSnapshot($publishedSnapshot);

// 4. Update MySQL database
try {
    $pdo = getDb(true);
    if ($pdo) {
        $jsonPub = json_encode($publishedSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $jsonDraft = json_encode($draftSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare("
            INSERT INTO cms_content (content_key, draft_data, live_data, updated_at, published_at)
            VALUES ('sgcms_blog', :draft, :live, NOW(), NOW())
            ON DUPLICATE KEY UPDATE draft_data = :draft_up, live_data = :live_up, updated_at = NOW(), published_at = NOW()
        ");
        $stmt->execute([
            ':draft'    => $jsonDraft,
            ':live'     => $jsonPub,
            ':draft_up' => $jsonDraft,
            ':live_up'  => $jsonPub
        ]);

        // Publish log entry
        $logStmt = $pdo->prepare("
            INSERT INTO cms_publish_log (version, publisher, published_at, summary)
            VALUES ('3.0.0', :pub, NOW(), :summary)
        ");
        $logStmt->execute([
            ':pub'     => !empty($adminUser['name']) ? $adminUser['name'] : 'Admin',
            ':summary' => 'Published blog: ' . ($blogItem['en']['title'] ?? $blogSlug)
        ]);
    }
} catch (Throwable $dbErr) {
    error_log('[SharifCMS Publish DB Warning] ' . $dbErr->getMessage());
}

// 5. Trigger SSG Engine: Regenerate all 4 physical HTML article pages & blog listings
$ssgResult = null;
$rootDir = realpath(dirname(__DIR__, 2));
try {
    require_once __DIR__ . '/blog-regen.php';
    if (function_exists('regenerateBlogListings')) {
        $ssgResult = regenerateBlogListings($rootDir, $publishedSnapshot);
    }
} catch (Throwable $ssgErr) {
    error_log('[SharifCMS Blog SSG Error] ' . $ssgErr->getMessage());
}

// 6. Trigger Sitemap XML rebuild
$sitemapResult = null;
try {
    $sitemapFile = $rootDir . '/sitemap.php';
    if (file_exists($sitemapFile)) {
        require_once $sitemapFile;
        if (function_exists('buildSitemapXml')) {
            $sitemapResult = buildSitemapXml($rootDir, true);
        }
    }
} catch (Throwable $smErr) {
    error_log('[SharifCMS Sitemap Update Error] ' . $smErr->getMessage());
}

jsonResponse([
    'success'       => true,
    'id'            => $blogId,
    'slug'          => $blogSlug,
    'url'           => '/blog/' . $blogSlug . '/',
    'message'       => 'Blog published successfully across English, Arabic, Farsi, and Chinese!',
    'ssg'           => $ssgResult,
    'sitemap'       => $sitemapResult,
    'blog'          => $blogItem
]);
