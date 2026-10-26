<?php
/**
 * Sharif Group CMS - List Draft Blogs API
 * Returns all articles that are currently in draft state.
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

$draftSnapshot = readDraftSnapshot();
$publishedSnapshot = readPublishedSnapshot();

$draftBlogs = $draftSnapshot['sgcms_blog'] ?? [];
$pubBlogs = $publishedSnapshot['sgcms_blog'] ?? [];

// Create quick lookup of published slugs/ids
$pubMap = [];
foreach ($pubBlogs as $pb) {
    if (!is_array($pb)) continue;
    $pid = $pb['id'] ?? '';
    $pslug = $pb['slug'] ?? '';
    if ($pid) $pubMap[$pid] = $pb;
    if ($pslug) $pubMap[$pslug] = $pb;
}

$draftsList = [];

foreach ($draftBlogs as $item) {
    if (!is_array($item)) continue;
    $id = $item['id'] ?? '';
    $slug = $item['slug'] ?? ($item['en']['slug'] ?? '');
    $status = strtolower($item['status'] ?? ($item['status_en'] ?? 'draft'));

    // Check if this item is a draft
    $isDraft = ($status === 'draft');
    if (!$isDraft) {
        // If not in published map, it's also effectively a draft
        if (!isset($pubMap[$id]) && !isset($pubMap[$slug])) {
            $isDraft = true;
        }
    }

    if ($isDraft) {
        $enTitle = $item['en']['title'] ?? ($item['title'] ?? '');
        $arTitle = $item['ar']['title'] ?? '';
        $faTitle = $item['fa']['title'] ?? '';
        $zhTitle = $item['zh']['title'] ?? '';

        $draftsList[] = [
            'id'           => $id,
            'slug'         => $slug,
            'program'      => $item['program'] ?? '',
            'category'     => $item['category'] ?? 'Citizenship',
            'subcategory'  => $item['subcategory'] ?? '',
            'title'        => $enTitle ?: ($arTitle ?: ($faTitle ?: ($zhTitle ?: 'Untitled Draft'))),
            'featured_img' => $item['featured_img'] ?? ($item['en']['featured_img'] ?? ''),
            'publish_date' => $item['publish_date'] ?? date('Y-m-d'),
            'updated_at'   => $item['updated_at'] ?? ($item['publish_date'] ?? date('Y-m-d')),
            'status'       => 'draft'
        ];
    }
}

// Sort newest updated first
usort($draftsList, function($a, $b) {
    $da = $a['updated_at'] ?? '2020-01-01';
    $db = $b['updated_at'] ?? '2020-01-01';
    return strcmp($db, $da);
});

jsonResponse([
    'success' => true,
    'count'   => count($draftsList),
    'drafts'  => $draftsList
]);
