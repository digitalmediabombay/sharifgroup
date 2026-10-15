<?php
$draft = json_decode(file_get_contents(__DIR__ . '/../admin/api/draft_content.json'), true);
foreach ($draft['sgcms_blog'] as $b) {
    if ($b['id'] === 'bid-izo738') {
        echo "status_en: " . var_export($b['status_en'] ?? null, true) . "\n";
        echo "status_ar: " . var_export($b['status_ar'] ?? null, true) . "\n";
        echo "status_fa: " . var_export($b['status_fa'] ?? null, true) . "\n";
        echo "status_zh: " . var_export($b['status_zh'] ?? null, true) . "\n";
        echo "status: " . var_export($b['status'] ?? null, true) . "\n";
    }
}
