# Parse all text content in index.html to find broken spacing and punctuation
$html = [System.IO.File]::ReadAllText("index.html", [System.Text.Encoding]::UTF8)

# Strip scripts and styles
$cleanHtml = [regex]::Replace($html, '(?s)<script.*?</script>', ' ')
$cleanHtml = [regex]::Replace($cleanHtml, '(?s)<style.*?</style>', ' ')
$cleanHtml = [regex]::Replace($cleanHtml, '(?s)<svg.*?</svg>', ' ')

# Find all text inside tags
$tagPattern = [regex]'>([^<]+)<'
$matches = $tagPattern.Matches($cleanHtml)

Write-Host "Total text segments: $($matches.Count)"

$issues = @()

foreach ($m in $matches) {
    $raw = $m.Groups[1].Value
    $text = [System.Net.WebUtility]::HtmlDecode($raw)
    $trimmed = $text.Trim()
    if (-not $trimmed) { continue }

    # 1. Broken apostrophe spacing (e.g., "we ’ve", "they 'll", "client 's")
    if ($trimmed -match '\b\w+\s+[''’`][a-zA-Z]') {
        $issues += [PSCustomObject]@{
            Type = "Broken Apostrophe Spacing"
            Match = $Matches[0]
            Context = $trimmed
        }
    }

    # 2. Broken hyphen / dash spacing (e.g., "end -to – end", "end - to", "word -word")
    if ($trimmed -match '\b\w+\s+-[a-zA-Z]|\b\w+-\s+[a-zA-Z]|\b\w+\s+–\s+\w+|\bend\s*-\s*to\b') {
        $issues += [PSCustomObject]@{
            Type = "Broken Dash/Hyphen Spacing"
            Match = $Matches[0]
            Context = $trimmed
        }
    }

    # 3. Space before punctuation (e.g., "Dubai ,", "visa .", "citizenship :")
    if ($trimmed -match '\b[A-Za-z0-9]+\s+[,.!?:;]') {
        $issues += [PSCustomObject]@{
            Type = "Space Before Punctuation"
            Match = $Matches[0]
            Context = $trimmed
        }
    }

    # 4. Spacing around quotes/parentheses (e.g., "( text )", "“ word")
    if ($trimmed -match '\(\s+[A-Za-z0-9]|[A-Za-z0-9]\s+\)') {
        $issues += [PSCustomObject]@{
            Type = "Parenthesis Spacing"
            Match = $Matches[0]
            Context = $trimmed
        }
    }

    # 5. Questionable characters / Mojibake
    if ($trimmed -match '[\uFFFD\u0080-\u009F]|\?{2,}') {
        $issues += [PSCustomObject]@{
            Type = "Encoding Issue / Mojibake"
            Match = $Matches[0]
            Context = $trimmed
        }
    }
}

Write-Host "Total Issues Found in Homepage index.html: $($issues.Count)"
$issues | ForEach-Object {
    Write-Host "[$($_.Type)] Match: '$($_.Match)'"
    Write-Host "   Context: $($_.Context)"
    Write-Host ""
}
