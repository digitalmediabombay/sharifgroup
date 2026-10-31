import sys

with open('admin/api/delete-blog.php', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == '// 4. Regenerate sitemap.xml immediately':
        code = '''// 3b. Physically delete static HTML article folders from disk across all 4 languages
$rootDir = realpath(dirname(__DIR__, 2));
if ($rootDir && !empty($targets)) {
    foreach (array_keys($targets) as $t) {
        $delSlug = trim($t);
        if ($delSlug === '' || $delSlug === 'index.html' || $delSlug === 'blog') continue;
        $paths = [
            $rootDir . '/blog/' . $delSlug,
            $rootDir . '/ar/blog/' . $delSlug,
            $rootDir . '/fa/blog/' . $delSlug,
            $rootDir . '/zh/blog/' . $delSlug,
        ];
        foreach ($paths as $p) {
            if (is_dir($p)) {
                $subFiles = glob($p . '/*');
                if ($subFiles) {
                    foreach ($subFiles as $sf) {
                        if (is_file($sf)) @unlink($sf);
                    }
                }
                @rmdir($p);
            }
        }
    }
}

// 4. Regenerate sitemap.xml immediately\n'''
        new_lines.append(code)
    elif line.strip() == '$rootDir = realpath(dirname(__DIR__, 2));':
        continue
    else:
        new_lines.append(line)

with open('admin/api/delete-blog.php', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated delete-blog.php cleanly!')

