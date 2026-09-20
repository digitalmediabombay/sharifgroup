$pages = @('index.html', 'aboutus\index.html', 'about-founder\index.html', 'blog\index.html', 'citizenshipbyinvestment\index.html')
foreach ($p in $pages) {
    $c = Get-Content $p -Raw -Encoding utf8
    $t = if ($c -match '<title>(.*?)</title>') { $matches[1] } else { 'NONE' }
    $d = if ($c -match '<meta\s+(?:name="description"\s+content="([^"]*)"|content="([^"]*)"\s+name="description")') { if ($matches[1]) { $matches[1] } else { $matches[2] } } else { 'NONE' }
    Write-Host "FILE: $p"
    Write-Host "TITLE ($($t.Length)): $t"
    Write-Host "DESC ($($d.Length)): $d"
    Write-Host "---"
}
