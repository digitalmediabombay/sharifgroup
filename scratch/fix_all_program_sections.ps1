$programFiles = Get-ChildItem -Path "programs" -Filter "index.html" -Recurse

foreach ($f in $programFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    $orig = $content

    # Match any h3 with data-i18n(-html)? for overviewTitle, timelineTitle, whyTitle, articlesTitle, compareTitle, consultTitle
    $patterns = @(
        'overviewTitle',
        'timelineTitle',
        'whyTitle',
        'articlesTitle',
        'compareTitle',
        'consultTitle'
    )

    foreach ($p in $patterns) {
        # Pattern where data-i18n is on h3 tag:
        # <h3([^>]*data-i18n(?:-html)?="[^"]*\.$p"[^>]*)>(.*?)</h3>
        $regex = [regex]("<h3([^>]*data-i18n(?:-html)?=""[^""]*\.$p""[^>]*)>([\s\S]*?)</h3>")
        $content = $regex.Replace($content, '<h2$1>$2</h2>')

        # Also pattern where data-i18n might be inside the tag or after
        $regex2 = [regex]("<h3([^>]*)data-i18n(?:-html)?=""[^""]*\.$p""([^>]*)>([\s\S]*?)</h3>")
        $content = $regex2.Replace($content, '<h2$1data-i18n-html="programs.$p"$2>$3</h2>')
    }

    # Also catch "Application Process" or "Passport Dashboard" or "Why partner with" or "Essential Guides" or "Apply for a Personalized Consultation"
    $content = [regex]::Replace($content, '<h3([^>]*>\s*(?:Application|Why partner|Essential Guides|Apply for a Personalized Consultation|.*Passport Dashboard)[\s\S]*?)</h3>', '<h2$1</h2>')
    # Replace leading <h3 with <h2 for those matched
    $content = [regex]::Replace($content, '<h3([^>]*?(?:overviewTitle|timelineTitle|whyTitle|articlesTitle|compareTitle|consultTitle)[\s\S]*?)</h3>', '<h2$1</h2>')

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated program sections in: $($f.FullName)"
    }
}
