# Deep scan of all 26 core landing pages for copy spacing & typography anomalies
$corePages = @(
    "index.html",
    "aboutus\index.html",
    "about-founder\index.html",
    "citizenshipbyinvestment\index.html",
    "residencybyinvestment\index.html",
    "realestate\index.html",
    "educationaladvisory\index.html",
    "socialresponsibility\index.html",
    "eligibilitychecker\index.html",
    "contact\index.html",
    "cookiepolicy\index.html",
    "privacypolicy\index.html",
    "termsofuse\index.html",
    "blog\index.html",
    "programs\citizenshipbyinvestment\antiguaandbarbuda\index.html",
    "programs\citizenshipbyinvestment\dominica\index.html",
    "programs\citizenshipbyinvestment\grenada\index.html",
    "programs\citizenshipbyinvestment\nauru\index.html",
    "programs\citizenshipbyinvestment\sao-tome-and-principe\index.html",
    "programs\citizenshipbyinvestment\stkitts\index.html",
    "programs\citizenshipbyinvestment\stlucia\index.html",
    "programs\citizenshipbyinvestment\vanuatu\index.html",
    "programs\residencybyinvestment\greece\index.html",
    "programs\residencybyinvestment\panama\index.html",
    "programs\residencybyinvestment\portugal\index.html",
    "programs\residencybyinvestment\uae\index.html"
)

Write-Host "Auditing 26 core pages..."
$findings = @()

foreach ($page in $corePages) {
    if (-not (Test-Path $page)) { continue }
    $raw = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)

    # 1. Any space before apostrophe in English words
    $r1 = [regex]'(?i)\b[a-z]+\s+[''’`][a-z]+'
    foreach ($m in $r1.Matches($raw)) {
        # ignore JS like 'foo ' + bar
        if ($m.Value -match "'\s*\+") { continue }
        $findings += [PSCustomObject]@{ Page = $page; Type = "Space Before Apostrophe"; Match = $m.Value; Snippet = ($raw.Substring([Math]::Max(0, $m.Index - 20), [Math]::Min(60, $raw.Length - $m.Index)) -replace '\s+', ' ') }
    }

    # 2. Inconsistent hyphen/dash in "end to end"
    $r2 = [regex]'(?i)end[\s\-–—]+to[\s\-–—]+end'
    foreach ($m in $r2.Matches($raw)) {
        $val = $m.Value
        if ($val -ne "end-to-end" -and $val -ne "End-to-End" -and $val -ne "End-to-end" -and $val -ne "END-TO-END") {
            $findings += [PSCustomObject]@{ Page = $page; Type = "Inconsistent End-to-End"; Match = $val; Snippet = ($raw.Substring([Math]::Max(0, $m.Index - 20), [Math]::Min(60, $raw.Length - $m.Index)) -replace '\s+', ' ') }
        }
    }

    # 3. Floating hyphens like "word - word" (where it should be em-dash or comma or hyphenated) or "word -word"
    $r3 = [regex]'(?i)\b[a-z]{3,}\s+-[a-z]{3,}|\b[a-z]{3,}-\s+[a-z]{3,}'
    foreach ($m in $r3.Matches($raw)) {
        # ignore html attributes
        if ($m.Value -match 'class|aria|data|hover|focus') { continue }
        $findings += [PSCustomObject]@{ Page = $page; Type = "Broken Hyphen Spacing"; Match = $m.Value; Snippet = ($raw.Substring([Math]::Max(0, $m.Index - 20), [Math]::Min(60, $raw.Length - $m.Index)) -replace '\s+', ' ') }
    }

    # 4. Spaces before commas/periods/colons/question marks in visible text
    $r4 = [regex]'>([^<]*?\b[a-zA-Z]{3,}\s+[,:;?!][^<]*?)<'
    foreach ($m in $r4.Matches($raw)) {
        $content = $m.Groups[1].Value.Trim()
        if ($content -match 'function|var|const|let|return|document|window|style') { continue }
        $findings += [PSCustomObject]@{ Page = $page; Type = "Space Before Punctuation"; Match = $content; Snippet = ($content -replace '\s+', ' ') }
    }

    # 5. Mojibake characters
    $r5 = [regex]'Ã¢|Â|â€™|â€“|â€”|\uFFFD|[\u0080-\u009F]'
    foreach ($m in $r5.Matches($raw)) {
        $findings += [PSCustomObject]@{ Page = $page; Type = "Mojibake"; Match = $m.Value; Snippet = ($raw.Substring([Math]::Max(0, $m.Index - 20), [Math]::Min(60, $raw.Length - $m.Index)) -replace '\s+', ' ') }
    }
}

Write-Host "Total findings: $($findings.Count)"
$findings | Group-Object Type | ForEach-Object {
    Write-Host "`n=== $($_.Name) ($($_.Count)) ==="
    $_.Group | ForEach-Object {
        Write-Host "$($_.Page): [$($_.Match)] in: $($_.Snippet)"
    }
}
