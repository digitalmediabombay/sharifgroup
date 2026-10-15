$root = "c:\Users\Admin\Desktop\sharifgrp"
$pkgDir = "$root\scratch\cpanel_deploy_pkg"
$zipOut = "$root\cpanel_update_latest.zip"

if (Test-Path $pkgDir) {
    Remove-Item -Recurse -Force $pkgDir
}
New-Item -ItemType Directory -Path $pkgDir | Out-Null

$filesToCopy = @(
    "assets\js\language-switcher.js",
    "assets\js\blog-translator.js",
    "assets\js\cms-live.js",
    "admin\cms-loader.js",
    "admin\cms.js",
    "admin\dashboard.html",
    "admin\index.html",
    "admin\api\blog-regen.php",
    "admin\api\content.php",
    "admin\api\publish.php",
    "admin\api\published_content.json",
    "admin\api\draft_content.json",
    "admin\api\repair.php",
    "admin\api\translate_sync.php",
    "sharifgroup_database.sql",
    "blog\what-is-dominica-citizenship-by-investment\index.html",
    "ar\blog\what-is-dominica-citizenship-by-investment\index.html",
    "fa\blog\what-is-dominica-citizenship-by-investment\index.html",
    "zh\blog\what-is-dominica-citizenship-by-investment\index.html",
    "blog\index.html",
    "ar\blog\index.html",
    "fa\blog\index.html",
    "zh\blog\index.html",
    "blog\dominica-passport-for-afghans-in-2026\index.html",
    "ar\blog\dominica-passport-for-afghans-in-2026\index.html",
    "fa\blog\dominica-passport-for-afghans-in-2026\index.html",
    "zh\blog\dominica-passport-for-afghans-in-2026\index.html",
    "programs\citizenshipbyinvestment\sao-tome-and-principe\index.html",
    "programs\citizenshipbyinvestment\nauru\index.html",
    "programs\residencybyinvestment\portugal\index.html",
    "programs\residencybyinvestment\greece\index.html",
    "programs\residencybyinvestment\panama\index.html",
    "programs\residencybyinvestment\uae\index.html",
    "aboutus\index.html",
    "ar\aboutus\index.html",
    "fa\aboutus\index.html",
    "zh\aboutus\index.html"
)

foreach ($rel in $filesToCopy) {
    $src = Join-Path $root $rel
    $dest = Join-Path $pkgDir $rel
    $destDir = Split-Path $dest
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Force
    } else {
        Write-Warning "Missing: $src"
    }
}

if (Test-Path $zipOut) {
    Remove-Item -Force $zipOut
}

tar -a -c -f $zipOut -C $pkgDir .
$sz = (Get-Item $zipOut).Length
Write-Host "Created cpanel_update_latest.zip successfully: $sz bytes"
