<?php
$d = json_decode(file_get_contents(__DIR__ . '/../admin/api/draft_content.json'), true);
foreach ($d['sgcms_blog'] as $b) {
    if ($b['id'] === 'bid-izo738') {
        echo "Root slug: " . ($b['slug'] ?? 'none') . "\n";
        echo "EN slug: " . ($b['en']['slug'] ?? 'none') . "\n";
        echo "AR slug: " . ($b['ar']['slug'] ?? 'none') . "\n";
        echo "FA slug: " . ($b['fa']['slug'] ?? 'none') . "\n";
        echo "ZH slug: " . ($b['zh']['slug'] ?? 'none') . "\n";
    }
}
