$files = Get-ChildItem -Path . -Filter *.html -Recurse | Where-Object { 
    $_.FullName -notmatch '\\(admin|dist|node_modules|scratch)\\' -and
    $_.Name -notmatch 'WorldMap' -and
    $_.Name -ne 'dashboard.html'
}

Write-Host "Total public pages to audit: $($files.Count)"

$pagesWithH1NotOne = @()
$pagesWithHeaderFooterHeadings = @()

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    # Strip script and style
    $clean = [regex]::Replace($content, '<script\b[^>]*>.*?</script>', '', [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    $clean = [regex]::Replace($clean, '<style\b[^>]*>.*?</style>', '', [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    # Count H1
    $h1Matches = [regex]::Matches($clean, '<h1\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($h1Matches.Count -ne 1) {
        $pagesWithH1NotOne += [PSCustomObject]@{
            File = $f.FullName.Replace((Get-Location).Path, "")
            H1Count = $h1Matches.Count
        }
    }

    # Check for headings in header or footer
    $headerMatch = [regex]::Match($clean, '<header\b[\s\S]*?</header>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($headerMatch.Success) {
        $hfHeadings = [regex]::Matches($headerMatch.Value, '<h[1-6]\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($hfHeadings.Count -gt 0) {
            $pagesWithHeaderFooterHeadings += [PSCustomObject]@{
                File = $f.FullName.Replace((Get-Location).Path, "")
                Location = "header"
                Count = $hfHeadings.Count
            }
        }
    }

    $footerMatch = [regex]::Match($clean, '<footer\b[\s\S]*?</footer>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($footerMatch.Success) {
        $hfHeadings = [regex]::Matches($footerMatch.Value, '<h[1-6]\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($hfHeadings.Count -gt 0) {
            $pagesWithHeaderFooterHeadings += [PSCustomObject]@{
                File = $f.FullName.Replace((Get-Location).Path, "")
                Location = "footer"
                Count = $hfHeadings.Count
            }
        }
    }
}

Write-Host "`n=== Audit Results ==="
Write-Host "Pages where H1 count != 1: $($pagesWithH1NotOne.Count)"
if ($pagesWithH1NotOne.Count -gt 0) {
    $pagesWithH1NotOne | Format-Table -AutoSize
}

Write-Host "Pages with headings in header/footer: $($pagesWithHeaderFooterHeadings.Count)"
if ($pagesWithHeaderFooterHeadings.Count -gt 0) {
    $pagesWithHeaderFooterHeadings | Format-Table -AutoSize
}
