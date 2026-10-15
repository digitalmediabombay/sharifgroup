<?php
$c = json_decode(file_get_contents(__DIR__ . '/../admin/api/published_content.json'), true);
foreach ($c['sgcms_blog'] ?? [] as $b) {
    echo "ID: " . ($b['id'] ?? '') . PHP_EOL;
    echo "Slug: " . ($b['slug'] ?? '') . PHP_EOL;
    echo "Title: " . ($b['title'] ?? '') . PHP_EOL;
    echo "EN title: " . ($b['en']['title'] ?? 'NONE') . PHP_EOL;
    echo "AR title: " . ($b['ar']['title'] ?? 'NONE') . PHP_EOL;
    echo "FA title: " . ($b['fa']['title'] ?? 'NONE') . PHP_EOL;
    echo "ZH title: " . ($b['zh']['title'] ?? 'NONE') . PHP_EOL;
    echo "FAQs count: " . count($b['faqs'] ?? []) . PHP_EOL;
    echo "AR FAQs count: " . count($b['ar']['faqs'] ?? []) . PHP_EOL;
    echo "ZH FAQs count: " . count($b['zh']['faqs'] ?? []) . PHP_EOL;
}
