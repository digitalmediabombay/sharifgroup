<?php
/**
 * Sharif Group CMS - Save Blog Post Draft API
 * Saves or updates a single blog post in draft_content.json and MySQL cms_content.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$adminUser = requireAdminAuth();
$body = getJsonBody();

if (empty($body) || !is_array($body)) {
    jsonResponse(['success' => false, 'error' => 'No content received.'], 400);
}

// Generate or sanitize ID
$id = trim($body['id'] ?? '');
if (!$id || strpos($id, 'new-') === 0 || $id === 'null' || $id === 'undefined') {
    $id = 'bid-' . substr(bin2hex(random_bytes(4)), 0, 7);
}

// Extract base properties
$program = trim($body['program'] ?? '');
$category = trim($body['category'] ?? 'Citizenship');
$subcategory = trim($body['subcategory'] ?? ($program ?: ''));
$author = trim($body['author'] ?? 'Sharif Group Legal Desk');
if ($author === '') $author = 'Sharif Group Legal Desk';
$featuredImg = trim($body['featured_img'] ?? '');
$publishDate = trim($body['publish_date'] ?? date('Y-m-d'));

// Derive English title for fallback slug
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

// Process 4 language structures
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

    // Normalize FAQs for this language
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

// Global combined canonical FAQs (defaults to English or first non-empty)
$globalFaqs = !empty($langData['en']['faqs']) ? $langData['en']['faqs'] : [];

$targetPrograms = is_array($body['target_programs'] ?? null) ? $body['target_programs'] : [
    $program,
    $subcategory,
    strtolower($category)
];
$targetPrograms = array_values(array_unique(array_filter($targetPrograms)));

// Build unified blog object conforming to Sharif Group schema
$blogItem = [
    'id'              => $id,
    'slug'            => $slug,
    'program'         => $program,
    'author'          => $author,
    'category'        => $category,
    'subcategory'     => $subcategory,
    'target_programs' => $targetPrograms,
    'featured_img'    => $featuredImg,
    'publish_date'    => $publishDate,
    'updated_at'      => date('Y-m-d H:i:s'),
    'status'          => 'draft',
    'status_en'       => 'draft',
    'status_ar'       => 'draft',
    'status_fa'       => 'draft',
    'status_zh'       => 'draft',
    'faqs'            => $globalFaqs,
    'en'              => $langData['en'],
    'ar'              => $langData['ar'],
    'fa'              => $langData['fa'],
    'zh'              => $langData['zh']
];

// 1. Read current draft snapshot
$draftSnapshot = readDraftSnapshot();
if (!isset($draftSnapshot['sgcms_blog']) || !is_array($draftSnapshot['sgcms_blog'])) {
    $draftSnapshot['sgcms_blog'] = [];
}

// Find existing index by ID or by Slug
$foundIndex = -1;
foreach ($draftSnapshot['sgcms_blog'] as $idx => $existing) {
    if (!is_array($existing)) continue;
    if (($existing['id'] ?? '') === $id || ($existing['slug'] ?? '') === $slug) {
        $foundIndex = $idx;
        break;
    }
}

if ($foundIndex >= 0) {
    $draftSnapshot['sgcms_blog'][$foundIndex] = $blogItem;
} else {
    // Prepend new draft to top of list
    array_unshift($draftSnapshot['sgcms_blog'], $blogItem);
}

// 2. Persist to draft_content.json
$savedDisk = writeDraftSnapshot($draftSnapshot);

// 3. Persist to MySQL cms_content draft_data if available
try {
    $pdo = getDb(true);
    if ($pdo) {
        $jsonBlogs = json_encode($draftSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare("
            INSERT INTO cms_content (content_key, draft_data, updated_at)
            VALUES ('sgcms_blog', :draft, NOW())
            ON DUPLICATE KEY UPDATE draft_data = :draft_up, updated_at = NOW()
        ");
        $stmt->execute([
            ':draft'    => $jsonBlogs,
            ':draft_up' => $jsonBlogs
        ]);
    }
} catch (Throwable $dbErr) {
    error_log('[SharifCMS Save Draft DB Warning] ' . $dbErr->getMessage());
}

jsonResponse([
    'success' => true,
    'id'      => $id,
    'slug'    => $slug,
    'message' => 'Draft saved successfully.',
    'blog'    => $blogItem
]);
