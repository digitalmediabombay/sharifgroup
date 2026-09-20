$programFiles = Get-ChildItem -Path "programs" -Filter "index.html" -Recurse

foreach ($f in $programFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    $orig = $content

    # 1. Program Overview: ... Guide
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Program Overview:[\s\S]*?</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Program Overview:[\s\S]*?)</h3>', '$1</h2>')

    # 2. Application Process & Steps
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Application Process &amp; Steps</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Application Process & Steps</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Application Process &amp; Steps)</h3>', '$1</h2>')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Application Process & Steps)</h3>', '$1</h2>')

    # 3. Why partner with Sharif Group...
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Why partner with Sharif Group[\s\S]*?</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Why partner with Sharif Group[\s\S]*?)</h3>', '$1</h2>')

    # 4. Essential Guides for ...
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Essential Guides for[\s\S]*?</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Essential Guides for[\s\S]*?)</h3>', '$1</h2>')

    # 5. Passport Dashboard
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>(?:[A-Za-z\s&;]+Passport Dashboard)</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>[A-Za-z\s&;]+Passport Dashboard)</h3>', '$1</h2>')

    # 6. Apply for a Personalized Consultation
    $content = [regex]::Replace($content, '<h3(\s+class="[^"]*font-serif[^"]*"(?:[^>]*)>Apply for a Personalized Consultation[\s\S]*?</h3>)', '<h2$1')
    $content = [regex]::Replace($content, '(<h2\b[^>]*>Apply for a Personalized Consultation[\s\S]*?)</h3>', '$1</h2>')

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($f.FullName)"
    }
}
