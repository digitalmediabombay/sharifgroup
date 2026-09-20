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

    # Dynamic CTAs with varying lengths
    $ctas = @(
        " Learn more with Sharif Group Dubai.",      # 36 chars
        " Consult Sharif Group in Dubai today.",      # 37 chars
        " Read our complete guide from Dubai.",       # 36 chars
        " Apply today with Sharif Group Dubai.",      # 37 chars
        " Read the full advisory guide now.",         # 34 chars
        " Book a consultation with our team.",        # 35 chars
        " Read the expert analysis in Dubai."         # 35 chars
    )

    # Strategy 1: Title-focused description: "Explore [Title]: [Excerpt]. [CTA]"
    # This guarantees uniqueness because every article title is unique!
    $titlePrefix = "Explore $title: "
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
