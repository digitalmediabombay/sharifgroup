$root = "c:\Users\Admin\Desktop\sharifgrp"
$staging = "$root\scratch\cpanel_staging"
$zipOut = "$root\cpanel_update_latest.zip"

if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging | Out-Null

if (Test-Path $zipOut) {
    Remove-Item -Force $zipOut
}

$filesToCopy = @(
    "assets\js\language-switcher.js",
    "assets\js\blog-translator.js",
    "assets\js\cms-live.js",
    "admin\api\blog-regen.php",
    "admin\api\publish.php",
    "admin\api\published_content.json",
    "admin\api\draft_content.json",
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
    "admin\cms-loader.js",
    "admin\dashboard.html",
    "aboutus\index.html",
    "ar\aboutus\index.html",
    "fa\aboutus\index.html",
    "zh\aboutus\index.html"
)

foreach ($rel in $filesToCopy) {
    $src = Join-Path $root $rel
    $dest = Join-Path $staging $rel
    $destDir = Split-Path $dest
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Force
        Write-Host "Staged: $rel"
    } else {
        Write-Warning "File not found: $src"
    }
}

Write-Host "Creating ZIP archive at $zipOut..."
Compress-Archive -Path "$staging\*" -DestinationPath $zipOut -Force
$zipSize = (Get-Item $zipOut).Length
Write-Host "Archive created successfully: $zipSize bytes"
