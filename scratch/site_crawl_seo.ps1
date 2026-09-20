$files = Get-ChildItem -Path . -Filter *.html -Recurse | Where-Object { 
    $_.FullName -notmatch '\\(admin|dist|node_modules|scratch)\\' -and
    $_.Name -notmatch 'WorldMap' -and
    $_.Name -ne 'dashboard.html'
}

Write-Host "CRAWLING $($files.Count) INDEXABLE PUBLIC PAGES..."

$titleMap = @{}
$descMap = @{}

$missingTitles = @()
$overTitles = @()
$duplicateTitles = @()

$missingDescs = @()
$underDescs = @()
$overDescs = @()
$duplicateDescs = @()

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    $rel = $f.FullName.Replace((Get-Location).Path, "").Replace("\", "/")

    # Title extraction
    $title = ""
    if ($content -match '<title[^>]*>(.*?)</title>') {
        $title = $matches[1].Trim()
    }

    # Description extraction
    $desc = ""
    if ($content -match '<meta\s+[^>]*name="description"\s+content="([^"]*)"') {
        $desc = $matches[1].Trim()
    } elseif ($content -match '<meta\s+[^>]*content="([^"]*)"\s+name="description"') {
        $desc = $matches[1].Trim()
    }

    # 1. Title Checks
    if ([string]::IsNullOrWhiteSpace($title)) {
        $missingTitles += $rel
    } else {
        if ($title.Length -gt 60) {
            $overTitles += [PSCustomObject]@{ File = $rel; Len = $title.Length; Title = $title }
        }
        if ($titleMap.ContainsKey($title)) {
            $duplicateTitles += [PSCustomObject]@{ Title = $title; File1 = $titleMap[$title]; File2 = $rel }
        } else {
            $titleMap[$title] = $rel
        }
    }

    # 2. Description Checks
    if ([string]::IsNullOrWhiteSpace($desc)) {
        $missingDescs += $rel
    } else {
        if ($desc.Length -lt 140) {
            $underDescs += [PSCustomObject]@{ File = $rel; Len = $desc.Length; Desc = $desc }
        } elseif ($desc.Length -gt 155) {
            $overDescs += [PSCustomObject]@{ File = $rel; Len = $desc.Length; Desc = $desc }
        }
        if ($descMap.ContainsKey($desc)) {
            $duplicateDescs += [PSCustomObject]@{ Desc = $desc; File1 = $descMap[$desc]; File2 = $rel }
        } else {
            $descMap[$desc] = $rel
        }
    }
}

Write-Host "`n========================================================"
Write-Host "                SITEWIDE SEO AUDIT RESULTS              "
Write-Host "========================================================"
Write-Host "Total Pages Crawled        : $($files.Count)"
Write-Host "Missing Titles             : $($missingTitles.Count)"
Write-Host "Over-length Titles (>60)   : $($overTitles.Count)"
Write-Host "Duplicate Titles           : $($duplicateTitles.Count)"
Write-Host "Missing Descriptions       : $($missingDescs.Count)"
Write-Host "Under-length Descs (<140)  : $($underDescs.Count)"
Write-Host "Over-length Descs (>155)   : $($overDescs.Count)"
Write-Host "Duplicate Descriptions     : $($duplicateDescs.Count)"
Write-Host "========================================================"

if ($missingTitles.Count -gt 0) {
    Write-Host "`n--- Missing Titles ---"
    $missingTitles | Format-Table -AutoSize
}
if ($overTitles.Count -gt 0) {
    Write-Host "`n--- Over-length Titles (>60 chars) ---"
    $overTitles | Format-Table -AutoSize
}
if ($duplicateTitles.Count -gt 0) {
    Write-Host "`n--- Duplicate Titles ---"
    $duplicateTitles | Format-Table -AutoSize
}
if ($missingDescs.Count -gt 0) {
    Write-Host "`n--- Missing Descriptions ---"
    $missingDescs | Format-Table -AutoSize
}
if ($underDescs.Count -gt 0) {
    Write-Host "`n--- Under-length Descriptions (<140 chars) ---"
    $underDescs | Format-Table -AutoSize
}
if ($overDescs.Count -gt 0) {
    Write-Host "`n--- Over-length Descriptions (>155 chars) ---"
    $overDescs | Format-Table -AutoSize
}
if ($duplicateDescs.Count -gt 0) {
    Write-Host "`n--- Duplicate Descriptions ---"
    $duplicateDescs | Format-Table -AutoSize
}

if ($missingTitles.Count -eq 0 -and $overTitles.Count -eq 0 -and $duplicateTitles.Count -eq 0 -and
    $missingDescs.Count -eq 0 -and $underDescs.Count -eq 0 -and $overDescs.Count -eq 0 -and $duplicateDescs.Count -eq 0) {
    Write-Host "`nALL 133 PAGES PASSED WITH 100% COMPLIANCE! NO MISSING, DUPLICATE OR OVER-LENGTH TITLES OR DESCRIPTIONS."
}
