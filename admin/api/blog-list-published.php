<?php
/**
 * Sharif Group CMS - List Published Blogs API
 * Returns all articles that are currently live and published.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

$pubSnapshot = readPublishedSnapshot();
$pubBlogs = $pubSnapshot['sgcms_blog'] ?? [];
$deletedSlugs = array_map('strtolower', array_map('trim', $pubSnapshot['sgcms_deleted_slugs'] ?? []));
$delMap = array_flip($deletedSlugs);

$publishedList = [];

foreach ($pubBlogs as $item) {
    if (!is_array($item)) continue;
    $id = trim($item['id'] ?? '');
    $slug = trim($item['slug'] ?? ($item['en']['slug'] ?? ''));

    if ($id && isset($delMap[strtolower($id)])) continue;
    if ($slug && isset($delMap[strtolower($slug)])) continue;

    $status = strtolower($item['status'] ?? ($item['status_en'] ?? 'published'));
    if ($status === 'draft' || $status === 'hidden' || $status === 'deleted') continue;

    $enTitle = $item['en']['title'] ?? ($item['title'] ?? '');
    $arTitle = $item['ar']['title'] ?? '';
    $faTitle = $item['fa']['title'] ?? '';
    $zhTitle = $item['zh']['title'] ?? '';

    $publishedList[] = [
        'id'           => $id,
        'slug'         => $slug,
        'program'      => $item['program'] ?? ($item['subcategory'] ?? ''),
        'category'     => $item['category'] ?? 'Citizenship',
        'subcategory'  => $item['subcategory'] ?? '',
        'title'        => $enTitle ?: ($arTitle ?: ($faTitle ?: ($zhTitle ?: 'Untitled Article'))),
        'featured_img' => $item['featured_img'] ?? ($item['en']['featured_img'] ?? ''),
        'publish_date' => $item['publish_date'] ?? date('Y-m-d'),
        'updated_at'   => $item['updated_at'] ?? ($item['publish_date'] ?? date('Y-m-d')),
        'url'          => '/blog/' . rawurlencode($slug) . '/',
        'status'       => 'published'
    ];
}

// Sort newest publish_date first
usort($publishedList, function($a, $b) {
    $da = strtotime($a['publish_date'] ?? '1970-01-01');
    $db = strtotime($b['publish_date'] ?? '1970-01-01');
    return $db <=> $da;
});

jsonResponse([
    'success'   => true,
    'count'     => count($publishedList),
    'published' => $publishedList
]);
