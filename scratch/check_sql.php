<?php
$sql = file_get_contents(__DIR__ . '/../sharifgroup_database.sql');

preg_match_all("/\('([^']+)',\s*'((?:[^'\\\\]|\\\\.)*)'/", $sql, $matches, PREG_SET_ORDER);
echo "SQL found matches: " . count($matches) . "\n";
$sqlData = [];
foreach ($matches as $m) {
    $key = $m[1];
    $val = stripslashes($m[2]);
    $dec = json_decode($val, true);
    if ($dec) {
        $sqlData[$key] = $dec;
        echo "Key: $key (valid JSON)\n";
    } else {
        echo "Key: $key (JSON error: " . json_last_error_msg() . ")\n";
    }
}
