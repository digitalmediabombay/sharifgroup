# Comprehensive scanner for Issue #11 using pure ASCII with Unicode escapes
$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\\.git\\' -and
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\scratch\\' -and
    ($_.Extension -in @('.html', '.json', '.js', '.sql', '.php'))
}

Write-Host "Checking $($files.Count) files..."

$issues = @()

$p1 = [regex]'\b([A-Za-z0-9]+)\s+([\x27\u2019\u2018`])(ve|ll|d|s|re|m|t)\b'
$p2 = [regex]'(?i)\bend\s*-\s*to\s*[-–—]?\s*end|\bend\s+-\s*to|\bto\s+-\s*end'
$p3 = [regex]'\u00C3\u00A2|\u00C2|\uFFFD|\b\w+\?{1,2}\w+\b'
$p4 = [regex]'\b([a-zA-Z]{3,})\s+([,;:\?!])(?:\s+|$)'

foreach ($f in $files) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $rel = $f.FullName.Replace((Get-Location).Path, "")

    # Check 1: Spaced apostrophe
    foreach ($m in $p1.Matches($text)) {
        $idx = $m.Index
        $start = [Math]::Max(0, $idx - 30)
        $len = [Math]::Min($text.Length - $start, 80)
        $ctx = ($text.Substring($start, $len) -replace '\s+', ' ')
        $issues += [PSCustomObject]@{
            File = $rel
            Type = "Broken Apostrophe Spacing"
            Match = $m.Value
            Context = $ctx
        }
    }

    # Check 2: Broken "end -to - end"
    foreach ($m in $p2.Matches($text)) {
        $idx = $m.Index
        $start = [Math]::Max(0, $idx - 30)
        $len = [Math]::Min($text.Length - $start, 80)
        $ctx = ($text.Substring($start, $len) -replace '\s+', ' ')
        $issues += [PSCustomObject]@{
            File = $rel
            Type = "Broken Hyphen Spacing (end-to-end)"
            Match = $m.Value
            Context = $ctx
        }
    }

    # Check 3: Mojibake / corruption
    foreach ($m in $p3.Matches($text)) {
        $idx = $m.Index
        $start = [Math]::Max(0, $idx - 30)
        $len = [Math]::Min($text.Length - $start, 80)
        $ctx = ($text.Substring($start, $len) -replace '\s+', ' ')
        # ignore intentional regex or base64
        if ($ctx -match 'regex|base64|font|sha|data:image') { continue }
        $issues += [PSCustomObject]@{
            File = $rel
            Type = "Mojibake / Corrupted Character"
            Match = $m.Value
            Context = $ctx
        }
    }

    # Check 4: Space before punctuation
    if ($f.Extension -notin @('.js', '.php')) {
        foreach ($m in $p4.Matches($text)) {
            $idx = $m.Index
            $start = [Math]::Max(0, $idx - 30)
            $len = [Math]::Min($text.Length - $start, 80)
            $ctx = ($text.Substring($start, $len) -replace '\s+', ' ')
            if ($ctx -match 'style|script|class|px|rem|\$|data-|http|SELECT|CREATE|UPDATE|INSERT') { continue }
            $issues += [PSCustomObject]@{
                File = $rel
                Type = "Space Before Punctuation"
                Match = $m.Value
                Context = $ctx
            }
        }
    }
}

Write-Host "Scan completed. Found $($issues.Count) issues."
$issues | Group-Object Type | ForEach-Object {
    Write-Host "`n=== $($_.Name) ($($_.Count)) ==="
    $_.Group | Select-Object -First 25 | ForEach-Object {
        Write-Host "$($_.File): [$($_.Match)] in: $($_.Context)"
    }
}
