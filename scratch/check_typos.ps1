$text = [System.IO.File]::ReadAllText("index.html", [System.Text.Encoding]::UTF8)

# Look for patterns
$regexes = @(
    '(?i)\bwe\s*[\x27\x{2019}\x{2018}`]?\s*ve\b',
    '(?i)end\s*-\s*to\s*[-–—]?\s*end',
    '(?i)\b\w+\s+[\x27\x{2019}](?:ve|ll|d|s|re|m|t)\b',
    '(?i)\b\w+\s+[-–—]\s+[a-z]',
    '[\x{0080}-\x{00FF}]{2,}',
    '&[a-zA-Z]+;',
    '\s{2,}'
)

foreach ($r in $regexes) {
    $matches = [regex]::Matches($text, $r)
    Write-Host "Pattern: $r => Found: $($matches.Count)"
    $matches | Select-Object -First 10 | ForEach-Object {
        $idx = $_.Index
        $start = [Math]::Max(0, $idx - 30)
        $sub = $text.Substring($start, $len)
        $cleanSub = $sub -replace '\s+', ' '
        Write-Host "   Match: '$($_.Value)' in context: '...$cleanSub...'"
    }
}
