$blogFiles = Get-ChildItem -Path "blog" -Filter "index.html" -Recurse | Where-Object { 
    $_.DirectoryName -ne (Join-Path (Get-Location).Path "blog") 
}

Write-Host "Total Blog Posts: $($blogFiles.Count)"

$overTitle = @()
$nonRangeDesc = @()

foreach ($f in $blogFiles) {
    $c = Get-Content $f.FullName -Raw -Encoding utf8
    $rel = $f.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
    
    $t = ""
    if ($c -match '<title[^>]*>(.*?)</title>') { $t = $matches[1].Trim() }
    
    $d = ""
    if ($c -match '<meta\s+name="description"\s+content="([^"]*)"') {
        $d = $matches[1].Trim()
    } elseif ($c -match '<meta\s+content="([^"]*)"\s+name="description"') {
        $d = $matches[1].Trim()
    }
    
    if ($t.Length -gt 60) {
        $overTitle += [PSCustomObject]@{ File = $rel; TLen = $t.Length; Title = $t }
    }
    if ($d.Length -lt 140 -or $d.Length -gt 155) {
        $nonRangeDesc += [PSCustomObject]@{ File = $rel; DLen = $d.Length; Desc = $d }
    }
}

Write-Host "Blog Titles > 60 chars: $($overTitle.Count)"
Write-Host "Blog Descs outside 140-155 chars: $($nonRangeDesc.Count)"

if ($overTitle.Count -gt 0) {
    Write-Host "`nSample over-length blog titles:"
    $overTitle | Select-Object -First 10 | Format-Table -AutoSize
}

if ($nonRangeDesc.Count -gt 0) {
    Write-Host "`nSample blog descs outside 140-155:"
    $nonRangeDesc | Select-Object -First 10 | Format-Table -AutoSize
}
