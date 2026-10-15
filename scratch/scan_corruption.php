<?php
$draft = json_decode(file_get_contents(__DIR__ . '/../admin/api/draft_content.json'), true);
$pub = json_decode(file_get_contents(__DIR__ . '/../admin/api/published_content.json'), true);

function scanArray($arr, $path = '') {
    $corrupt = [];
    foreach ($arr as $k => $v) {
        $currPath = $path ? "$path.$k" : $k;
        if (is_array($v)) {
            $corrupt = array_merge($corrupt, scanArray($v, $currPath));
        } elseif (is_string($v)) {
            // Check for mojibake patterns:
            // 1. Double UTF-8 Arabic: Ø or Ù followed by Latin-1
            // 2. Double UTF-8 Chinese: æ, è, å, ç, é followed by Latin-1
            // 3. Question mark blocks:  or ?
            // 4. CP437: ΓÇ
            if (preg_match('/[ØÙ][\x80-\xFF]|[\xE4-\xE9][\x80-\xFF]{2}|[\x{FFFD}]|ΓÇ|O\s*U,|AE\+/u', $v) ||
                preg_match('/æ[¬¢]|è[¿Ž°]|å[ˆ°«]|ç[º»]/', $v)) {
                $corrupt[] = [
                    'path' => $currPath,
                    'preview' => mb_substr($v, 0, 40)
                ];
            }
        }
    }
    return $corrupt;
}

$draftCorrupt = scanArray($draft);
echo "Draft corrupt count: " . count($draftCorrupt) . "\n";
foreach (array_slice($draftCorrupt, 0, 15) as $c) {
    echo "  {$c['path']}: {$c['preview']}\n";
}

$pubCorrupt = scanArray($pub);
echo "Pub corrupt count: " . count($pubCorrupt) . "\n";
foreach (array_slice($pubCorrupt, 0, 15) as $c) {
    echo "  {$c['path']}: {$c['preview']}\n";
}
