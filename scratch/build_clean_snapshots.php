<?php
/**
 * Master Data Snapshot Builder
 * Creates 100% clean, pristine UTF-8 snapshots for draft_content.json and published_content.json
 */

$root = dirname(__DIR__);

// 1. Extract clean SQL data
require_once __DIR__ . '/extract_sql.php'; // yields $keys

// 2. Extract clean DEFAULTS from admin/cms.js using node
$nodeScript = <<<'NODE'
global.window = {};
global.document = { querySelector: () => null, querySelectorAll: () => [] };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.fetch = () => {};
const fs = require('fs');
const s = fs.readFileSync('admin/cms.js', 'utf8');
eval(s);
console.log(JSON.stringify(window.CMS.DEFAULTS));
NODE;

$descriptors = [
    0 => ["pipe", "r"],
    1 => ["pipe", "w"],
    2 => ["pipe", "w"]
];
$process = proc_open("node", $descriptors, $pipes, $root);
if (is_resource($process)) {
    fwrite($pipes[0], $nodeScript);
    fclose($pipes[0]);
    $defaultsJson = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($process);
} else {
    die("Failed to run node to get DEFAULTS\n");
}

$defaults = json_decode($defaultsJson, true);
if (!$defaults) {
    die("Failed to parse DEFAULTS JSON\n");
}
echo "DEFAULTS loaded successfully. Keys: " . implode(', ', array_keys($defaults)) . "\n";

// 3. Assemble clean sgcms_homepage
$cleanHomepage = $keys['sgcms_homepage'] ?? $defaults['homepage'];
// Double check hero translations in $cleanHomepage:
foreach (['en', 'ar', 'fa', 'zh'] as $l) {
    if (empty($cleanHomepage['hero'][$l]['headline']) && !empty($defaults['homepage']['hero'][$l]['headline'])) {
        $cleanHomepage['hero'][$l] = $defaults['homepage']['hero'][$l];
    }
}

// 4. Assemble clean sgcms_aboutus
// We use defaults['aboutus'] as baseline because it contains full EN, AR, FA, ZH translations for hero, overview, stats, architecture, founder, cta!
$cleanAboutUs = $defaults['aboutus'];

// 5. Assemble clean sgcms_citizenship
$cleanCitizenship = $keys['sgcms_citizenship'] ?? $defaults['citizenship'];

// 6. Assemble clean sgcms_residency
$cleanResidency = $keys['sgcms_residency'] ?? $defaults['residency'];

// 7. Assemble clean sgcms_team
$cleanTeam = $keys['sgcms_team'] ?? $defaults['team'];

// 8. Assemble clean sgcms_offices
$cleanOffices = $keys['sgcms_offices'] ?? $defaults['offices'];

// 9. Assemble clean sgcms_contact
$cleanContact = $keys['sgcms_contact'] ?? $defaults['contact'];

// 10. Assemble clean sgcms_cookiepolicy
$cleanCookiePolicy = $keys['sgcms_cookiepolicy'] ?? $defaults['cookiepolicy'];

// 11. Assemble clean sgcms_settings
$existingSettings = [];
if (file_exists($root . '/admin/api/published_content.json')) {
    $existingPub = json_decode(file_get_contents($root . '/admin/api/published_content.json'), true);
    if (!empty($existingPub['sgcms_settings'])) {
        $existingSettings = $existingPub['sgcms_settings'];
    }
}
$cleanSettings = array_merge([
    'site_name' => 'Sharif Group',
    'openrouter_api_key' => '',
    'gemini_api_key' => '',
    'ai_provider' => 'openrouter',
    'preview_url' => ''
], $keys['sgcms_settings'] ?? [], $existingSettings);

// 12. Assemble clean sgcms_flag_codes
$cleanFlagCodes = $keys['sgcms_flag_codes'] ?? null;

// 13. Preserve clean blog articles
$cleanBlogs = [];
if (!empty($existingPub['sgcms_blog']) && is_array($existingPub['sgcms_blog'])) {
    foreach ($existingPub['sgcms_blog'] as $b) {
        $slug = $b['slug'] ?? ($b['en']['slug'] ?? '');
        if (!empty($slug) && $slug !== 'deleted') {
            $cleanBlogs[] = $b;
        }
    }
}
if (empty($cleanBlogs) && !empty($defaults['blog'])) {
    $cleanBlogs = $defaults['blog'];
}

echo "Clean blogs gathered: " . count($cleanBlogs) . "\n";

// Rebuild Clean Draft Bundle
$cleanDraft = [
    'sgcms_homepage' => $cleanHomepage,
    'sgcms_citizenship' => $cleanCitizenship,
    'sgcms_residency' => $cleanResidency,
    'sgcms_team' => $cleanTeam,
    'sgcms_offices' => $cleanOffices,
    'sgcms_contact' => $cleanContact,
    'sgcms_aboutus' => $cleanAboutUs,
    'sgcms_cookiepolicy' => $cleanCookiePolicy,
    'sgcms_settings' => $cleanSettings,
    'sgcms_flag_codes' => $cleanFlagCodes,
    'sgcms_blog' => $cleanBlogs
];

// Rebuild Clean Published Bundle
$cleanPublished = [
    'sgcms_blog' => $cleanBlogs,
    'sgcms_deleted_slugs' => [],
    'sgcms_homepage' => $cleanHomepage,
    'sgcms_citizenship' => $cleanCitizenship,
    'sgcms_residency' => $cleanResidency,
    'sgcms_team' => $cleanTeam,
    'sgcms_aboutus' => $cleanAboutUs,
    'sgcms_contact' => $cleanContact,
    'sgcms_flag_codes' => $cleanFlagCodes,
    'sgcms_cookiepolicy' => $cleanCookiePolicy,
    'sgcms_dom_overrides' => new stdClass(),
    'sgcms_offices' => $cleanOffices,
    'sgcms_sections_residency' => $existingPub['sgcms_sections_residency'] ?? [],
    'sgcms_sections_citizenship' => $existingPub['sgcms_sections_citizenship'] ?? [],
    'sgcms_settings' => $cleanSettings,
    'sgcms_published_timestamp' => time()
];

// Verify with scanArray
require_once __DIR__ . '/scan_corruption.php';
$draftCorrupt = scanArray($cleanDraft);
$pubCorrupt = scanArray($cleanPublished);

echo "Built Clean Draft corrupt count: " . count($draftCorrupt) . "\n";
echo "Built Clean Published corrupt count: " . count($pubCorrupt) . "\n";

if (count($draftCorrupt) === 0 && count($pubCorrupt) === 0) {
    echo "SUCCESS: 100% clean data verified!\n";
    // Write out test files first to verify
    file_put_contents(__DIR__ . '/clean_draft_test.json', json_encode($cleanDraft, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    file_put_contents(__DIR__ . '/clean_published_test.json', json_encode($cleanPublished, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    echo "Saved clean_draft_test.json and clean_published_test.json\n";
} else {
    echo "WARNING: Corruptions detected in test build:\n";
    foreach ($draftCorrupt as $c) echo "  Draft: {$c['path']}: {$c['preview']}\n";
    foreach ($pubCorrupt as $c) echo "  Pub: {$c['path']}: {$c['preview']}\n";
}
