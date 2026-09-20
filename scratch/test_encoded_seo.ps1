function Format-SeoTitle([string]$rawTitle) {
    $raw = $rawTitle.Trim()
    $brand = " | Sharif Group"
    $shortBrand = " | Sharif"
    
    if (($raw + $brand).Length -le 55) {
        $candidate = ($raw + $brand)
    } elseif (($raw + $shortBrand).Length -le 55) {
        $candidate = ($raw + $shortBrand)
    } elseif ($raw.Length -le 58) {
        $candidate = $raw
    } else {
        $trunc = $raw.Substring(0, 56)
        $lastSpace = $trunc.LastIndexOf(" ")
        if ($lastSpace -gt 30) {
            $candidate = $trunc.Substring(0, $lastSpace).Trim()
        } else {
            $candidate = $trunc.Trim()
        }
    }
    
    $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
    while ($enc.Length -gt 60) {
        $lastSpace = $candidate.LastIndexOf(" ")
        if ($lastSpace -gt 20) {
            $candidate = $candidate.Substring(0, $lastSpace).Trim()
            $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
        } else {
            $candidate = $candidate.Substring(0, 50).Trim()
            $enc = [System.Net.WebUtility]::HtmlEncode($candidate)
        }
    }
    return $candidate
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

    $titlePrefix = "Explore " + $title + ": "
    if ($titlePrefix.Length -lt 70) {
        foreach ($cta in $ctas) {
            $avail = 148 - ($titlePrefix.Length + $cta.Length)
            $minAvail = 135 - ($titlePrefix.Length + $cta.Length)
            if ($avail -gt 20 -and $clean.Length -ge $minAvail) {
                $slice = $clean.Substring(0, [Math]::Min($clean.Length, $avail))
                $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
                if ($lastSpace -ge $minAvail) {
                    $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                    $desc = "$titlePrefix$base$cta"
                    $enc = [System.Net.WebUtility]::HtmlEncode($desc)
                    if ($enc.Length -ge 140 -and $enc.Length -le 155 -and -not $usedDescs.ContainsKey($enc)) {
                        return $desc
                    }
                }
            }
        }
    }

    foreach ($cta in $ctas) {
        $maxBaseLen = 148 - $cta.Length
        $minBaseLen = 135 - $cta.Length

        if ($clean.Length -ge $minBaseLen) {
            $slice = $clean.Substring(0, [Math]::Min($clean.Length, $maxBaseLen))
            $lastSpace = $slice.LastIndexOfAny(@(' ', '.', ',', ';'))
            if ($lastSpace -ge $minBaseLen) {
                $base = $slice.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
                $desc = $base + $cta
                $enc = [System.Net.WebUtility]::HtmlEncode($desc)
                if ($enc.Length -ge 140 -and $enc.Length -le 155 -and -not $usedDescs.ContainsKey($enc)) {
                    return $desc
                }
            }
        }
    }

    # Deterministic adjustment to guarantee exactly 140-155 for $enc.Length
    $cta = " Learn more with Sharif Group Dubai."
    $baseLen = 146 - $cta.Length
    $base = $clean.Substring(0, [Math]::Min($clean.Length, $baseLen)).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
    $desc = $base + $cta
    $enc = [System.Net.WebUtility]::HtmlEncode($desc)

    while ($enc.Length -lt 140) {
        $desc = $desc.Replace("Learn more", "Explore insights and learn more")
        $enc = [System.Net.WebUtility]::HtmlEncode($desc)
    }
    while ($enc.Length -gt 155) {
        # trim 1 word from base
        $lastSpace = $base.LastIndexOf(' ')
        if ($lastSpace -gt 10) {
            $base = $base.Substring(0, $lastSpace).Trim().TrimEnd(@('.', ',', ';', '-')) + "."
            $desc = $base + $cta
            $enc = [System.Net.WebUtility]::HtmlEncode($desc)
        } else {
            $desc = $desc.Substring(0, 150).Trim() + "..."
            $enc = [System.Net.WebUtility]::HtmlEncode($desc)
            break
        }
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

    $encTitle = [System.Net.WebUtility]::HtmlEncode($seoTitle)
    $encDesc = [System.Net.WebUtility]::HtmlEncode($seoDesc)

    if ($encTitle.Length -gt 60 -or $encTitle.Length -eq 0) {
        Write-Host "INVALID ENCODED TITLE: ($($encTitle.Length)) $encTitle [Slug: $slug]"
        $invalidTitles++
    }
    if ($encDesc.Length -lt 140 -or $encDesc.Length -gt 155) {
        Write-Host "INVALID ENCODED DESC: ($($encDesc.Length)) $encDesc [Slug: $slug]"
        $invalidDescs++
    }

    if ($titles.ContainsKey($encTitle)) {
        Write-Host "DUPLICATE TITLE: $encTitle"
    } else {
        $titles[$encTitle] = $slug
    }

    if ($descs.ContainsKey($encDesc)) {
        Write-Host "DUPLICATE DESC: $encDesc"
    } else {
        $descs[$encDesc] = $slug
    }
}

Write-Host "`n=== Test Results with Encoded Validation ==="
Write-Host "Total Articles: $($matches.Count)"
Write-Host "Invalid Titles (>60 chars): $invalidTitles"
Write-Host "Invalid Descs (not 140-155): $invalidDescs"
Write-Host "Unique Titles: $($titles.Count)"
Write-Host "Unique Descs: $($descs.Count)"
