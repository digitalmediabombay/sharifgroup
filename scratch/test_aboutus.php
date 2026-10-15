<?php
require_once __DIR__ . '/extract_sql.php';
$ab = $keys['sgcms_aboutus'] ?? null;
echo "Aboutus keys: " . implode(', ', array_keys($ab)) . "\n";
echo "Overview keys: " . implode(', ', array_keys($ab['overview'] ?? [])) . "\n";
if (isset($ab['overview']['zh'])) {
    echo "Overview ZH: " . json_encode($ab['overview']['zh'], JSON_UNESCAPED_UNICODE) . "\n";
}
if (isset($ab['overview']['ar'])) {
    echo "Overview AR: " . json_encode($ab['overview']['ar'], JSON_UNESCAPED_UNICODE) . "\n";
}
if (isset($ab['overview']['fa'])) {
    echo "Overview FA: " . json_encode($ab['overview']['fa'], JSON_UNESCAPED_UNICODE) . "\n";
}
