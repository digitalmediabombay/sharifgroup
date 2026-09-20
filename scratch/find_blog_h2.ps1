$lines = Get-Content -Path "blog\index.html"
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '<h2\b') {
        Write-Host "Line $($i+1): $($lines[$i].Trim())"
    }
}
