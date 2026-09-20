$files = Get-ChildItem -Path . -Filter index.html -Recurse | Where-Object { 
    $_.FullName -notmatch '\\(admin|dist|node_modules|scratch)\\' -and
    $_.FullName -notmatch '\\blog\\[^\\]+\\'
}

$coreList = @()
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw -Encoding utf8
    $rel = $f.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
    
    $t = ""
    if ($c -match '<title[^>]*>(.*?)</title>') { $t = $matches[1].Trim() }
    
    $d = ""
    if ($c -match '<meta\s+name="description"\s+content="([^"]*)"') {
        $d = $matches[1].Trim()
    } elseif ($c -match '<meta\s+content="([^"]*)"\s+name="description"') {
        $d = $matches[1].Trim()
    }
    
    $coreList += [PSCustomObject]@{
        Path = $rel
        Title = $t
        TLen = $t.Length
        Desc = $d
        DLen = $d.Length
    }
}

foreach ($item in $coreList) {
    Write-Host "PATH: $($item.Path)"
    Write-Host "TITLE ($($item.TLen)): $($item.Title)"
    Write-Host "DESC ($($item.DLen)): $($item.Desc)"
    Write-Host "----------------------------------------------------"
}
