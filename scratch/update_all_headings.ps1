$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" | Where-Object { 
    $_.FullName -notmatch "\\scratch\\" -and $_.FullName -notmatch "\\admin\\"
}

Write-Host "Processing $($htmlFiles.Count) HTML files..."

$updatedFiles = 0
foreach ($f in $htmlFiles) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $original = $text

    # 1. Mega Menu dropdown h3 -> p
    $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="megaMenu\.[^"]*"[^>]*)>(.*?)</h3>', '<p$1>$2</p>')

    # 2. Mega Menu dropdown h4 -> p
    $text = [regex]::Replace($text, '(?si)<h4([^>]*data-i18n="megaMenu\.[^"]*"[^>]*)>(.*?)</h4>', '<p$1>$2</p>')

    # 3. Footer column h4 -> p
    $text = [regex]::Replace($text, '(?si)<h4([^>]*data-i18n="footer\.[^"]*"[^>]*)>(.*?)</h4>', '<p$1>$2</p>')

    # 4. Program pages major sections promotion (h3 -> h2)
    if ($f.FullName -match '\\programs\\') {
        # Program Overview
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*overviewTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Program Overview:[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        
        # Application Process & Steps
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Application Process &amp; Steps</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*processTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')

        # Why partner with Sharif Group
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Why partner with Sharif Group[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*whyPartnerTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')

        # Frequently Asked Questions
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Frequently Asked Questions</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*faqTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')

        # Essential Guides
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Essential Guides[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Apply for a Personalized Consultation
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Apply for a Personalized Consultation[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
        $text = [regex]::Replace($text, '(?si)<h3([^>]*data-i18n="[^"]*formTitle"[^>]*)>(.*?)</h3>', '<h2$1>$2</h2>')

        # Passport Dashboard
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>[^<]*Passport Dashboard</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
    }

    # 5. Blog pages sections promotion (h3 -> h2)
    if ($f.FullName -match '\\blog\\') {
        # Program Integrity & FAQs
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Program Integrity &amp; FAQs</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Apply for a Personalized Consultation
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Apply for a Personalized Consultation[^<]*</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })

        # Related Advisory Guides
        $text = [regex]::Replace($text, '(?si)<h3([^>]*>Related Advisory Guides</h3>)', { param($m) $m.Value -replace '^<h3', '<h2' -replace '</h3>$', '</h2>' })
    }

    if ($text -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
        $updatedFiles++
    }
}

Write-Host "Successfully updated $updatedFiles files with clean heading outlines!"
