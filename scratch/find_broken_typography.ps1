# Search for broken punctuation and spacing
$patterns = @(
    '\b\w+\s+[’''](?:ve|ll|d|s|re|m|t)\b',  # e.g. "we ’ve", "it 's"
    'end\s*-\s*to\s*[–-]\s*end',             # e.g. "end -to – end"
    '\b\w+\s+-\s+\w+\b',                     # e.g. "word - word" where hyphen was used instead of dash
    '\w+\s+-[a-zA-Z]',                       # e.g. "end -to"
    '[a-zA-Z]-\s+[a-zA-Z]',                  # e.g. "- end"
    'â€™|â€“|â€”|Ã¢|Â',                       # Mojibake UTF-8 misinterpretations
    '\s+[,.!?;:]',                            # space before punctuation (e.g. "Dubai ,")
    '["“]\s+\w+',                             # space after opening quote
    '\w+\s+["”]',                             # space before closing quote
    '\(\s+\w+',                               # space after opening paren
    '\w+\s+\)'                                # space before closing paren
)

$targetExts = @('*.html', '*.json', '*.js')
$files = Get-ChildItem -Path . -Recurse -Include $targetExts | Where-Object { 
    $_.FullName -notmatch '\\\.git\\' -and 
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\scratch\\'
}

Write-Host "Scanning $($files.Count) files..."

$results = @()
foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Test each pattern
        if ($line -match '\b\w+\s+[’''](?:ve|ll|d|s|re|m|t)\b') {
            $results += [PSCustomObject]@{ File = $file.FullName.Replace((Get-Location).Path, ""); Line = ($i+1); Type = "Apostrophe Spacing"; Match = $Matches[0]; Snippet = $line.Trim() }
        }
        if ($line -match 'end\s*-\s*to\s*[–-]\s*end') {
            $results += [PSCustomObject]@{ File = $file.FullName.Replace((Get-Location).Path, ""); Line = ($i+1); Type = "End-to-End Dash"; Match = $Matches[0]; Snippet = $line.Trim() }
        }
        if ($line -match '\w+\s+-[a-zA-Z]|[a-zA-Z]-\s+[a-zA-Z]') {
            $results += [PSCustomObject]@{ File = $file.FullName.Replace((Get-Location).Path, ""); Line = ($i+1); Type = "Broken Hyphen Spacing"; Match = $Matches[0]; Snippet = $line.Trim() }
        }
        if ($line -match 'â€™|â€“|â€”|Ã¢|Â') {
            $results += [PSCustomObject]@{ File = $file.FullName.Replace((Get-Location).Path, ""); Line = ($i+1); Type = "Mojibake Encoding"; Match = $Matches[0]; Snippet = $line.Trim() }
        }
        if ($line -match '\b[A-Za-z0-9]+\s+[,;:]\s+') {
            $results += [PSCustomObject]@{ File = $file.FullName.Replace((Get-Location).Path, ""); Line = ($i+1); Type = "Space Before Comma/Colon"; Match = $Matches[0]; Snippet = $line.Trim() }
        }
    }
}

Write-Host "Found $($results.Count) suspicious occurrences."
$results | Group-Object Type | ForEach-Object {
    Write-Host "--- $($_.Name) ($($_.Count)) ---"
    $_.Group | Select-Object -First 10 | ForEach-Object {
        Write-Host "$($_.File):$($_.Line) [$($_.Match)] -> $($_.Snippet.Substring(0, [Math]::Min(100, $_.Snippet.Length)))"
    }
}
