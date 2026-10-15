<?php
$files = [
    'zh' => 'zh/blog/what-is-dominica-citizenship-by-investment/index.html',
    'en' => 'blog/what-is-dominica-citizenship-by-investment/index.html',
    'ar' => 'ar/blog/what-is-dominica-citizenship-by-investment/index.html',
    'fa' => 'fa/blog/what-is-dominica-citizenship-by-investment/index.html',
];

$pattern = '#(<!-- FAQ ACCORDION SECTION[^>]*-->\s*)?<div class="space-y-6 pt-12 border-t border-neutral-200">.*?</div>\s*</div>\s*(?=</div>\s*</main|</main|<!-- RELATED|<!-- (?:SECTION: )?CONSULTATION)#is';

foreach ($files as $l => $f) {
    $html = file_get_contents($f);
    if (preg_match($pattern, $html, $m)) {
        echo "{$l}: MATCHED " . strlen($m[0]) . " bytes\n";
    } else {
        echo "{$l}: NOT MATCHED\n";
    }
}
