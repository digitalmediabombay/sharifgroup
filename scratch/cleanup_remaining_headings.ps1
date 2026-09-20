$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" | Where-Object { 
    $_.FullName -notmatch "\\scratch\\" -and $_.FullName -notmatch "\\admin\\"
}

$count = 0
foreach ($f in $htmlFiles) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $orig = $text

    # 1. Clean any remaining h3 inside <header>
    $text = [regex]::Replace($text, '(?si)(<header[^>]*>.*?</header>)', {
        param($match)
        $h = $match.Groups[1].Value
        $h = [regex]::Replace($h, '(?si)<h3([^>]*)>(.*?)</h3>', '<p$1>$2</p>')
        $h = [regex]::Replace($h, '(?si)<h4([^>]*)>(.*?)</h4>', '<p$1>$2</p>')
        return $h
    })

    # 2. Program pages section titles h3 -> h2
    if ($f.FullName -match '\\programs\\') {
        # Program overview
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*overview[^"]*"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Program Overview:[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Application process
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*process[^"]*"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Application Process &amp; Steps</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Why partner with Sharif Group
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*whyPartner[^"]*"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Why partner with Sharif Group[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Essential guides
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Essential Guides[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Consultation form
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Apply for a Personalized Consultation[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*consultation[^"]*"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*formTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
    }

    if ($text -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
        $count++
    }
}

Write-Host "Updated $count files with clean headings!"
