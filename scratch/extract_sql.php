<?php
$sql = file_get_contents(__DIR__ . '/../sharifgroup_database.sql');

$lines = explode("\n", $sql);
$keys = [];

for ($i = 0; $i < count($lines); $i++) {
    $line = $lines[$i];
    if (preg_match("/\('(sgcms_[a-z0-9_]+)',\s*'(.*)/", $line, $m)) {
        $key = $m[1];
        $rest = $m[2];
        $parts = explode("', '", $rest);
        if (count($parts) >= 2) {
            $draftRaw = $parts[0];
            $draftJsonStr = str_replace("''", "'", $draftRaw);
            $draftJsonStr = str_replace('\\\\"', '\\"', $draftJsonStr);
            $draftDec = json_decode($draftJsonStr, true);
            if ($draftDec) {
                $keys[$key] = $draftDec;
                echo "Successfully extracted clean $key\n";
            } else {
                // Try stripslashes or parsing
                $draftJsonStr2 = stripslashes($draftJsonStr);
                $draftDec2 = json_decode($draftJsonStr2, true);
                if ($draftDec2) {
                    $keys[$key] = $draftDec2;
                    echo "Successfully extracted clean $key (pass 2)\n";
                } else {
                    echo "Failed to decode $key: " . json_last_error_msg() . "\n";
                }
            }
        }
    }
}

if (isset($keys['sgcms_homepage'])) {
    echo "Homepage ZH Headline: " . ($keys['sgcms_homepage']['hero']['zh']['headline'] ?? 'N/A') . "\n";
    echo "Homepage AR Headline: " . ($keys['sgcms_homepage']['hero']['ar']['headline'] ?? 'N/A') . "\n";
    echo "Homepage FA Headline: " . ($keys['sgcms_homepage']['hero']['fa']['headline'] ?? 'N/A') . "\n";
}
if (isset($keys['sgcms_aboutus'])) {
    echo "AboutUs EN Title: " . ($keys['sgcms_aboutus']['hero']['en']['title'] ?? 'N/A') . "\n";
}
