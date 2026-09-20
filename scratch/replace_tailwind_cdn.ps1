$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" | Where-Object { 
    $_.FullName -notmatch "\\scratch\\" -and $_.FullName -notmatch "\\admin\\"
}

$regex = '(?s)<script\s+src="https?://cdn\.tailwindcss\.com"></script>\s*<script>\s*tailwind\.config\s*=.*?</script>'
$replacement = '<link rel="stylesheet" href="/assets/css/tailwind.min.css?v=20260920_v1" />'

$updated = 0
foreach ($f in $htmlFiles) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    if ($text -match $regex) {
        $newText = [regex]::Replace($text, $regex, $replacement)
        [System.IO.File]::WriteAllText($f.FullName, $newText, $utf8NoBom)
        $updated++
    }
}

Write-Host "Updated $updated HTML files with compiled Tailwind CSS stylesheet link!"
