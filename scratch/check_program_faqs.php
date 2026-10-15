<?php
$c = json_decode(file_get_contents(__DIR__ . '/../admin/api/published_content.json'), true);
$allProgs = array_merge($c['sgcms_citizenship'] ?? [], $c['sgcms_residency'] ?? []);
foreach ($allProgs as $p) {
    foreach (['en','ar','fa','zh'] as $l) {
        $cnt = count($p[$l]['faqs'] ?? []);
        if ($cnt > 0) {
            echo ($p['id'] ?? '') . " [{$l}] faqs count = {$cnt}\n";
        }
    }
}
