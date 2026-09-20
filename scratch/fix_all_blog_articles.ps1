$blogFiles = Get-ChildItem -Path "blog" -Filter "index.html" -Recurse | Where-Object { $_.DirectoryName -ne (Join-Path (Get-Location).Path "blog") }

Write-Host "Found $($blogFiles.Count) blog article files to process..."

$updatedCount = 0
foreach ($f in $blogFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding utf8
    $orig = $content

    # Mega menu citizenship
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4"\s+data-i18n="nav\.citizenship">Citizenship<br/>By<br/>Investment)</h3>', '<p$1</p>')
    # Mega menu residency
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4"\s+data-i18n="nav\.residency">Residency<br/>By<br/>Investment)</h3>', '<p$1</p>')
    # Mega menu other services
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-3xl text-neutral-900 font-bold leading-tight mb-4"\s+data-i18n="megaMenu\.otherServices">[\s\S]*?)</h3>', '<p$1</p>')
    # Mega menu corporate identity
    $content = [regex]::Replace($content, '<h3([^>]*data-i18n="megaMenu\.corporateIdentity"[^>]*)>([\s\S]*?)</h3>', '<p$1>$2</p>')

    # Consultation section title
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-3xl md:text-5xl font-bold text-neutral-900 leading-tight"\s+data-i18n-html="contact\.consultationHeading">)([\s\S]*?)</h3>', '<h2$1$2</h2>')

    # Program Integrity & FAQs
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">Program Integrity &amp; FAQs)</h3>', '<h2$1</h2>')

    # Related Advisory Guides
    $content = [regex]::Replace($content, '<h3(\s+class="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">Related Advisory Guides)</h3>', '<h2$1</h2>')

    # Related article cards
    $content = [regex]::Replace($content, '<h4(\s+class="font-serif font-bold text-base text-neutral-900 leading-snug">)([\s\S]*?)</h4>', '<h3$1$2</h3>')

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
        $updatedCount++
    }
}

Write-Host "Successfully updated $updatedCount blog article files!"
