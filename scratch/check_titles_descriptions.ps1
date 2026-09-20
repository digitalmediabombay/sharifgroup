$files = Get-ChildItem -Path . -Filter *.html -Recurse | Where-Object { 
    $_.FullName -notmatch '\\(admin|dist|node_modules|scratch)\\' -and
    $_.Name -notmatch 'WorldMap' -and
    $_.Name -ne 'dashboard.html'
}

$results = @()
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    $rel = $f.FullName.Replace((Get-Location).Path, '')
    
    $title = ''
    if ($content -match '<title>(.*?)</title>') {
        $title = $matches[1].Trim()
    }
    
    $desc = ''
    if ($content -match '<meta\s+name=["'']description["'']\s+content=["''](.*?)["'']') {
        $desc = $matches[1].Trim()
    } elseif ($content -match '<meta\s+content=["''](.*?)["'']\s+name=["'']description["'']') {
        $desc = $matches[1].Trim()
    }
    
    $results += [PSCustomObject]@{
        File = $rel
        Title = $title
        TitleLen = $title.Length
        Desc = $desc
        DescLen = $desc.Length
    }
}

Write-Host "Total Pages: $($results.Count)"
$overTitle = $results | Where-Object { $_.TitleLen -gt 60 }
$underDesc = $results | Where-Object { $_.DescLen -lt 140 }
$overDesc = $results | Where-Object { $_.DescLen -gt 160 }
$missingTitle = $results | Where-Object { [string]::IsNullOrWhiteSpace($_.Title) }
$missingDesc = $results | Where-Object { [string]::IsNullOrWhiteSpace($_.Desc) }

Write-Host "Titles > 60 chars: $($overTitle.Count)"
Write-Host "Descs < 140 chars: $($underDesc.Count)"
Write-Host "Descs > 160 chars: $($overDesc.Count)"
Write-Host "Missing Titles: $($missingTitle.Count)"
Write-Host "Missing Descs: $($missingDesc.Count)"

Write-Host "`nCore pages (non-article):"
$results | Where-Object { $_.File -notmatch '\\blog\\[^\\]+\\' } | Select-Object File, TitleLen, Title, DescLen, Desc | Format-List
