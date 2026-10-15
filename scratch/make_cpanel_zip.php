<?php
$rootDir = realpath(dirname(__DIR__));
$zipFile = $rootDir . '/cpanel_update_latest.zip';
if (file_exists($zipFile)) {
    @unlink($zipFile);
}

$zip = new ZipArchive();
if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    die("Cannot create zip at {$zipFile}\n");
}

// Function to add file if exists
function addFileToZip($zip, $rootDir, $relPath) {
    $fullPath = $rootDir . '/' . $relPath;
    if (file_exists($fullPath)) {
        $zip->addFile($fullPath, str_replace('\\', '/', $relPath));
        echo "Added: " . $relPath . "\n";
    } else {
        echo "MISSING: " . $relPath . "\n";
    }
}

// Function to add directory recursively
function addDirToZip($zip, $rootDir, $relDir) {
    $fullDir = $rootDir . '/' . $relDir;
    if (!is_dir($fullDir)) return;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($fullDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($it as $item) {
        $filePath = $item->getRealPath();
        $subRel = substr($filePath, strlen($rootDir) + 1);
        $normRel = str_replace('\\', '/', $subRel);
        if ($item->isDir()) {
            $zip->addEmptyDir($normRel);
        } else {
            $zip->addFile($filePath, $normRel);
            echo "Added: " . $normRel . "\n";
        }
    }
}

// 1. Core JS engines
addFileToZip($zip, $rootDir, 'assets/js/language-switcher.js');
addFileToZip($zip, $rootDir, 'assets/js/blog-translator.js');
addFileToZip($zip, $rootDir, 'assets/js/cms-live.js');

// 2. Admin APIs & Snapshots
addFileToZip($zip, $rootDir, 'admin/api/blog-regen.php');
addFileToZip($zip, $rootDir, 'admin/api/publish.php');
addFileToZip($zip, $rootDir, 'admin/api/published_content.json');
addFileToZip($zip, $rootDir, 'admin/api/draft_content.json');

// 3. Master reference templates
addFileToZip($zip, $rootDir, 'blog/what-is-dominica-citizenship-by-investment/index.html');
addFileToZip($zip, $rootDir, 'ar/blog/what-is-dominica-citizenship-by-investment/index.html');
addFileToZip($zip, $rootDir, 'fa/blog/what-is-dominica-citizenship-by-investment/index.html');
addFileToZip($zip, $rootDir, 'zh/blog/what-is-dominica-citizenship-by-investment/index.html');

// 4. Blog listings
addFileToZip($zip, $rootDir, 'blog/index.html');
addFileToZip($zip, $rootDir, 'ar/blog/index.html');
addFileToZip($zip, $rootDir, 'fa/blog/index.html');
addFileToZip($zip, $rootDir, 'zh/blog/index.html');

// 5. Active published blog post (all 4 languages)
addDirToZip($zip, $rootDir, 'blog/dominica-passport-for-afghans-in-2026');
addDirToZip($zip, $rootDir, 'ar/blog/dominica-passport-for-afghans-in-2026');
addDirToZip($zip, $rootDir, 'fa/blog/dominica-passport-for-afghans-in-2026');
addDirToZip($zip, $rootDir, 'zh/blog/dominica-passport-for-afghans-in-2026');

// 6. Modified Program & Residency pages with all FAQs fixed
$fixedPages = [
    'programs/citizenshipbyinvestment/sao-tome-and-principe/index.html',
    'programs/citizenshipbyinvestment/nauru/index.html',
    'programs/residencybyinvestment/portugal/index.html',
    'programs/residencybyinvestment/greece/index.html',
    'programs/residencybyinvestment/panama/index.html',
    'programs/residencybyinvestment/uae/index.html',
    'aboutus/index.html',
    'ar/aboutus/index.html',
    'fa/aboutus/index.html',
    'zh/aboutus/index.html'
];
foreach ($fixedPages as $p) {
    addFileToZip($zip, $rootDir, $p);
}

$zip->close();
echo "SUCCESS! Created " . $zipFile . " (" . filesize($zipFile) . " bytes)\n";
