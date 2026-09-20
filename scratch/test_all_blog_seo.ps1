function Format-SeoTitle([string]$rawTitle) {
    $raw = $rawTitle.Trim()
    $brand = " | Sharif Group"
    $shortBrand = " | Sharif"
    
    if (($raw + $brand).Length -le 60) {
        return ($raw + $brand)
    }
    if (($raw + $shortBrand).Length -le 60) {
        return ($raw + $shortBrand)
    }
    if ($raw.Length -le 60) {
        return $raw
    }
    $trunc = $raw.Substring(0, 60)
    $lastSpace = $trunc.LastIndexOf(" ")
    if ($lastSpace -gt 35) {
        return $trunc.Substring(0, $lastSpace).Trim()
    }
    return $trunc.Trim()
}

function Format-SeoDescription([string]$title, [string]$bodyHtml, [hashtable]$usedDescs) {
    $clean = [regex]::Replace($bodyHtml, "<[^>]+>", " ")
    $clean = [regex]::Replace($clean, "\s+", " ").Trim()
    $clean = $clean.Trim('`').Trim()

    $ctas = @(
        " Learn more with Sharif Group Dubai.",      # 36 chars
        " Consult Sharif Group in Dubai today.",      # 37 chars
        " Read our complete guide from Dubai.",       # 36 chars
        " Apply today with Sharif Group Dubai.",      # 37 chars
        " Read the full advisory guide now.",         # 34 chars
        " Book a consultation with our team.",        # 35 chars
        " Read the expert analysis in Dubai."         # 35 chars
    )

    # Strategy 1: Title prefix: "Explore [Title]: [Excerpt]. [CTA]"
    $titlePrefix = "Explore ${title}: "
    if ($titlePrefix.Length -lt 70) {
        foreach ($cta in $ctas) {
            $avail = 155 - ($titlePrefix.Length + $cta.Length)
            $minAvail = 140 - ($titlePrefix.Length + $cta.Length)
            if ($avail -gt 25 -and $clean.Length -ge $minAvail) {
                $slice = $clean.Substring(0, [Math]::Min($clean.Length, $avail))
                $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
                if ($lastSpace -ge $minAvail) {
                    $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                    $desc = "$titlePrefix$base$cta"
                    if ($desc.Length -ge 140 -and $desc.Length -le 155 -and -not $usedDescs.ContainsKey($desc)) {
                        return $desc
                    }
                }
            }
        }
    }

    # Strategy 2: Body slice + CTA
    foreach ($cta in $ctas) {
        $maxBaseLen = 155 - $cta.Length
        $minBaseLen = 140 - $cta.Length

        if ($clean.Length -ge $minBaseLen) {
            $slice = $clean.Substring(0, [Math]::Min($clean.Length, $maxBaseLen))
            $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
            if ($lastSpace -ge $minBaseLen) {
                $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                $desc = $base + $cta
                if ($desc.Length -ge 140 -and $desc.Length -le 155 -and -not $usedDescs.ContainsKey($desc)) {
                    return $desc
                }
            }
        }
    }

    # Strategy 3: Deterministic pad/trim guaranteed between 140 and 155
    $cta = " Learn more with Sharif Group Dubai."
    $targetLen = 148
    $baseLen = $targetLen - $cta.Length
    $base = $clean.Substring(0, [Math]::Min($clean.Length, $baseLen)).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
    $desc = $base + $cta
    while ($desc.Length -lt 140) {
        $desc = $desc.Replace("Learn more", "Explore insights and learn more")
    }
    if ($desc.Length -gt 155) {
        $desc = $desc.Substring(0, 155)
    }
    return $desc
}

$blogFile = "blog\index.html"
$content = [System.IO.File]::ReadAllText($blogFile, [System.Text.Encoding]::UTF8)

$startPos = $content.IndexOf("const articlesDatabase = {")
$endPos = $content.IndexOf("window.articlesDatabase = articlesDatabase;", $startPos)
$dbText = $content.Substring($startPos, $endPos - $startPos)
$pattern = [regex]"(?ms)^\s*['""]([a-z0-9-]+)['""]\s*:\s*\{\s*title:\s*['""](.*?)['""],\s*category:\s*['""](.*?)['""],\s*author:\s*['""](.*?)['""],\s*date:\s*['""](.*?)['""],\s*updated:\s*['""](.*?)['""],\s*image:\s*['""](.*?)['""],\s*content:\s*`?(.*?)`?,\s*faqs:\s*\[(.*?)\s*\]\s*\}"
$matches = $pattern.Matches($dbText)

Write-Host "Evaluating $($matches.Count) articles..."

$titles = @{}
$descs = @{}
$invalidTitles = 0
$invalidDescs = 0

foreach ($m in $matches) {
    $slug = $m.Groups[1].Value
    $rawTitle = $m.Groups[2].Value
    $rawContent = $m.Groups[8].Value

    $seoTitle = Format-SeoTitle $rawTitle
    $seoDesc = Format-SeoDescription $rawTitle $rawContent $descs

    if ($seoTitle.Length -gt 60 -or $seoTitle.Length -eq 0) {
        Write-Host "INVALID TITLE: ($($seoTitle.Length)) $seoTitle [Slug: $slug]"
        $invalidTitles++
    }
    if ($seoDesc.Length -lt 140 -or $seoDesc.Length -gt 155) {
        Write-Host "INVALID DESC: ($($seoDesc.Length)) $seoDesc [Slug: $slug]"
        $invalidDescs++
    }

    if ($titles.ContainsKey($seoTitle)) {
        Write-Host "DUPLICATE TITLE: $seoTitle [Slug: $slug vs $($titles[$seoTitle])]"
    } else {
        $titles[$seoTitle] = $slug
    }

    if ($descs.ContainsKey($seoDesc)) {
        Write-Host "DUPLICATE DESC: $seoDesc [Slug: $slug vs $($descs[$seoDesc])]"
    } else {
        $descs[$seoDesc] = $slug
    }
}

Write-Host "`nResults Summary:"
Write-Host "Total Articles: $($matches.Count)"
Write-Host "Invalid Titles (not in 1-60): $invalidTitles"
Write-Host "Invalid Descs (not in 140-155): $invalidDescs"
Write-Host "Unique Titles: $($titles.Count)"
Write-Host "Unique Descs: $($descs.Count)"
