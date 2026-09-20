param (
    [string]$FilePath = "index.html"
)

$content = Get-Content -Path $FilePath -Raw -Encoding utf8
# Remove script and style blocks
$content = [regex]::Replace($content, '<script\b[^>]*>.*?</script>', '', [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$content = [regex]::Replace($content, '<style\b[^>]*>.*?</style>', '', [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

$matches = [regex]::Matches($content, '<(h[1-6])\b[^>]*>(.*?)</\1>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "=== DOM Headings in $FilePath (Total: $($matches.Count)) ==="
foreach ($m in $matches) {
    $tag = $m.Groups[1].Value.ToUpper()
    $text = [regex]::Replace($m.Groups[2].Value, '<[^>]+>', ' ').Trim()
    $text = [regex]::Replace($text, '\s+', ' ')
    Write-Host "$tag : $text"
}
