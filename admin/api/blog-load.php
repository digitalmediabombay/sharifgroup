<?php
/**
 * Sharif Group CMS - Load Single Blog Post API
 * Retrieves full blog post data for editing (from draft or published content).
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed. Only GET is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

$id = trim($_GET['id'] ?? ($_GET['slug'] ?? ''));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Missing blog ID or slug.'], 400);
}

$draftSnapshot = readDraftSnapshot();
$publishedSnapshot = readPublishedSnapshot();

$draftBlogs = $draftSnapshot['sgcms_blog'] ?? [];
$pubBlogs = $publishedSnapshot['sgcms_blog'] ?? [];

$found = null;

// Search drafts first
foreach ($draftBlogs as $item) {
    if (!is_array($item)) continue;
    if (($item['id'] ?? '') === $id || ($item['slug'] ?? '') === $id) {
        $found = $item;
        break;
    }
}

// Fallback search published
if (!$found) {
    foreach ($pubBlogs as $item) {
        if (!is_array($item)) continue;
        if (($item['id'] ?? '') === $id || ($item['slug'] ?? '') === $id) {
            $found = $item;
            break;
        }
    }
}

if (!$found) {
    jsonResponse(['success' => false, 'error' => 'Blog post not found.'], 404);
}

// Ensure clean structure for all 4 languages
$languages = ['en', 'ar', 'fa', 'zh'];
foreach ($languages as $lng) {
    if (!isset($found[$lng]) || !is_array($found[$lng])) {
        $found[$lng] = [];
    }
    $found[$lng]['title'] = $found[$lng]['title'] ?? ($lng === 'en' ? ($found['title'] ?? '') : '');
    $found[$lng]['body'] = $found[$lng]['body'] ?? ($lng === 'en' ? ($found['body'] ?? '') : '');
    $found[$lng]['excerpt'] = $found[$lng]['excerpt'] ?? '';
    $found[$lng]['meta_title'] = $found[$lng]['meta_title'] ?? '';
    $found[$lng]['meta_desc'] = $found[$lng]['meta_desc'] ?? '';
    $foundFaqs = !empty($found['faqs']) && is_array($found['faqs']) ? $found['faqs'] : [];
    $enFaqs = !empty($found['en']['faqs']) && is_array($found['en']['faqs']) ? $found['en']['faqs'] : $foundFaqs;
    if (!isset($found[$lng]['faqs']) || !is_array($found[$lng]['faqs']) || empty($found[$lng]['faqs'])) {
        $found[$lng]['faqs'] = $enFaqs;
    }
}

// Normalize faqs map for frontend
$enFaqs = !empty($found['en']['faqs']) && is_array($found['en']['faqs']) ? $found['en']['faqs'] : (!empty($found['faqs']) && is_array($found['faqs']) ? $found['faqs'] : []);
$faqsMap = [
    'en' => $enFaqs,
    'ar' => !empty($found['ar']['faqs']) && is_array($found['ar']['faqs']) ? $found['ar']['faqs'] : $enFaqs,
    'fa' => !empty($found['fa']['faqs']) && is_array($found['fa']['faqs']) ? $found['fa']['faqs'] : $enFaqs,
    'zh' => !empty($found['zh']['faqs']) && is_array($found['zh']['faqs']) ? $found['zh']['faqs'] : $enFaqs
];

jsonResponse([
    'success' => true,
    'blog'    => $found,
    'faqs'    => $faqsMap
]);
