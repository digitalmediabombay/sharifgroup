<?php
$draft = json_decode(file_get_contents(__DIR__ . '/../admin/api/draft_content.json'), true);
$pub = json_decode(file_get_contents(__DIR__ . '/../admin/api/published_content.json'), true);

echo "Draft blogs count: " . count($draft['sgcms_blog'] ?? []) . "\n";
echo "Pub blogs count: " . count($pub['sgcms_blog'] ?? []) . "\n";

foreach ($draft['sgcms_blog'] ?? [] as $b) {
    $slug = $b['slug'] ?? ($b['en']['slug'] ?? 'unknown');
    echo "Blog: $slug\n";
    echo "  EN title: " . ($b['en']['title'] ?? '') . "\n";
    echo "  AR title: " . ($b['ar']['title'] ?? '') . "\n";
    echo "  FA title: " . ($b['fa']['title'] ?? '') . "\n";
    echo "  ZH title: " . ($b['zh']['title'] ?? '') . "\n";
}
