<?php
/**
 * Sharif Group CMS - Master Data Healer
 * Reconstructs 100% clean, pristine UTF-8 snapshots for draft_content.json and published_content.json
 */

$root = dirname(__DIR__);

// 1. Read clean defaults from admin/cms.js
$cmsJs = file_get_contents($root . '/admin/cms.js');
$startIdx = strpos($cmsJs, 'const DEFAULTS = {');
$endIdx = strpos($cmsJs, "\nfunction getData(key)");
$defaultsSnippet = substr($cmsJs, $startIdx, $endIdx - $startIdx);

// 2. Read clean data from sharifgroup_database.sql
require_once __DIR__ . '/extract_sql.php'; // sets $keys from SQL dump

// Let's verify what keys we have from SQL
echo "SQL Keys available: " . implode(', ', array_keys($keys)) . "\n";

// Let's inspect sgcms_homepage from SQL
$cleanHomepage = $keys['sgcms_homepage'] ?? null;
$cleanCitizenship = $keys['sgcms_citizenship'] ?? null;
$cleanResidency = $keys['sgcms_residency'] ?? null;
$cleanContact = $keys['sgcms_contact'] ?? null;
$cleanAboutUs = $keys['sgcms_aboutus'] ?? null;
$cleanCookiePolicy = $keys['sgcms_cookiepolicy'] ?? null;
$cleanTeam = $keys['sgcms_team'] ?? null;
$cleanOffices = $keys['sgcms_offices'] ?? null;
$cleanSettings = $keys['sgcms_settings'] ?? ["gemini_api_key" => "", "site_name" => "Sharif Group", "preview_url" => ""];
$cleanFlagCodes = $keys['sgcms_flag_codes'] ?? null;

// Read published blogs to preserve articles
$pubOld = json_decode(file_get_contents($root . '/admin/api/published_content.json'), true);
$draftOld = json_decode(file_get_contents($root . '/admin/api/draft_content.json'), true);

$cleanBlogs = [];
if (!empty($pubOld['sgcms_blog']) && is_array($pubOld['sgcms_blog'])) {
    foreach ($pubOld['sgcms_blog'] as $b) {
        if (!empty($b['slug']) && $b['slug'] === 'dominica-passport-for-afghans-in-2026') {
            $cleanBlogs[] = $b;
        }
    }
}
if (!empty($draftOld['sgcms_blog']) && is_array($draftOld['sgcms_blog'])) {
    foreach ($draftOld['sgcms_blog'] as $b) {
        $slug = $b['slug'] ?? ($b['en']['slug'] ?? '');
        $exists = false;
        foreach ($cleanBlogs as $cb) {
            if (($cb['slug'] ?? '') === $slug) { $exists = true; break; }
        }
        if (!$exists && !empty($slug) && $slug !== 'deleted') {
            $cleanBlogs[] = $b;
        }
    }
}

echo "Clean blogs gathered: " . count($cleanBlogs) . "\n";

// Clean AboutUs overview and hero if SQL aboutus is missing deep translations:
// Let's check AboutUs in SQL:
echo "AboutUs overview keys: " . implode(', ', array_keys($cleanAboutUs['overview'] ?? [])) . "\n";

