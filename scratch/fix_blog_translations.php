<?php
require_once __DIR__ . '/../admin/api/translate_sync.php';

function isMojibakeString($raw) {
    if (!is_string($raw) || trim($raw) === '') return false;
    if (strpos($raw, '????') !== false) return true;
    if (preg_match('/[\x{2500}-\x{259F}\x{FFFD}]|ΓÇ[ôöòóõô–•]|u0026amp;/u', $raw)) return true;
    if (preg_match('/[ØÙ][\x80-\xFF]/', $raw) && !preg_match('/[\x{0600}-\x{06FF}]/u', $raw)) return true;
    if (preg_match('/(?:æ[•™\x80-\xFF]|è[‚²¯¢¿Ž°\x80-\xFF]|å[’¨ˆ°«\x80-\xFF]|ç[º»\x80-\xFF]|é[\x80-\xFF]|ä[\x80-\xFF])/', $raw) && !preg_match('/[\x{4E00}-\x{9FFF}]/u', $raw)) return true;
    if (preg_match('/[äåæçèéêëìíîï][\x{0080}-\x{00FF}\x{201A}-\x{2026}\x{2018}-\x{201D}\x{2122}\x{0152}\x{0153}\x{0160}\x{0161}\x{0178}\x{017E}\x{02C6}\x{02DC}]/u', $raw) && !preg_match('/[\x{4E00}-\x{9FFF}]/u', $raw)) return true;
    if (preg_match('/(?:O\s*U,|AE\+|[A-Za-z]\s*[¿Ž°ˆ¬¢]|A["”][A-Za-z"”]+)/', $raw)) return true;
    return false;
}

$pubFile = __DIR__ . '/../admin/api/published_content.json';
$raw = file_get_contents($pubFile);
$data = json_decode($raw, true);

if (!isset($data['sgcms_blog']) || !is_array($data['sgcms_blog'])) {
    die("No blogs found in JSON\n");
}

foreach ($data['sgcms_blog'] as &$b) {
    if (!is_array($b)) continue;
    $enTitle = trim($b['en']['title'] ?? ($b['title'] ?? ''));
    $enBody = trim($b['en']['body'] ?? ($b['body'] ?? ''));
    if ($enTitle === '') continue;

    foreach (['zh', 'ar', 'fa'] as $lang) {
        if (!isset($b[$lang]) || !is_array($b[$lang])) {
            $b[$lang] = [];
        }
        $currTitle = trim($b[$lang]['title'] ?? '');
        $currBody = trim($b[$lang]['body'] ?? '');

        $needsTitle = ($currTitle === '' || isMojibakeString($currTitle) || $currTitle === $enTitle);
        $needsBody = ($currBody === '' || isMojibakeString($currBody) || $currBody === $enBody);

        if ($needsTitle) {
            echo "Translating Title to {$lang} for {$b['id']}...\n";
            $b[$lang]['title'] = translateTextServer($enTitle, $lang, 'en');
            echo "  Result ({$lang}): " . $b[$lang]['title'] . "\n";
        }
        if ($needsBody) {
            echo "Translating Body to {$lang} for {$b['id']}...\n";
            $b[$lang]['body'] = translateTextServer($enBody, $lang, 'en');
        }
        if (empty($b[$lang]['slug'])) {
            $b[$lang]['slug'] = $b['slug'] ?? ($b['en']['slug'] ?? $b['id']);
        }
    }
}
unset($b);

file_put_contents($pubFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "Successfully updated published_content.json!\n";
