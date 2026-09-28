$destZip = 'c:\Users\Admin\Desktop\sharifgrp\cpanel_update_images_fixed.zip'
if (Test-Path $destZip) { Remove-Item $destZip -Force }

$tempDir = 'c:\Users\Admin\Desktop\sharifgrp\scratch\cpanel_pkg'
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 1. about-founder
New-Item -ItemType Directory -Path "$tempDir\about-founder" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\about-founder\*" -Destination "$tempDir\about-founder" -Recurse

# 2. citizenshipbyinvestment
New-Item -ItemType Directory -Path "$tempDir\citizenshipbyinvestment" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\citizenshipbyinvestment\*" -Destination "$tempDir\citizenshipbyinvestment" -Recurse

# 3. residencybyinvestment
New-Item -ItemType Directory -Path "$tempDir\residencybyinvestment" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\residencybyinvestment\*" -Destination "$tempDir\residencybyinvestment" -Recurse

# 4. programs
New-Item -ItemType Directory -Path "$tempDir\programs\citizenshipbyinvestment\grenada" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\programs\citizenshipbyinvestment\grenada\*" -Destination "$tempDir\programs\citizenshipbyinvestment\grenada" -Recurse

New-Item -ItemType Directory -Path "$tempDir\programs\citizenshipbyinvestment\nauru" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\programs\citizenshipbyinvestment\nauru\*" -Destination "$tempDir\programs\citizenshipbyinvestment\nauru" -Recurse

New-Item -ItemType Directory -Path "$tempDir\programs\citizenshipbyinvestment\sao-tome-and-principe" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\programs\citizenshipbyinvestment\sao-tome-and-principe\*" -Destination "$tempDir\programs\citizenshipbyinvestment\sao-tome-and-principe" -Recurse

# Also include programs/residencybyinvestment
New-Item -ItemType Directory -Path "$tempDir\programs\residencybyinvestment" -Force | Out-Null
Copy-Item "c:\Users\Admin\Desktop\sharifgrp\programs\residencybyinvestment\*" -Destination "$tempDir\programs\residencybyinvestment" -Recurse

# 5. assets/images - the updated image files
New-Item -ItemType Directory -Path "$tempDir\assets\images" -Force | Out-Null
$imageFiles = @(
    'grenada-aerial.webp',
    'greece.webp',
    'panama.webp',
    'portugal.webp',
    'uae-dubai.webp',
    'Caribbean-beach-1-.webp',
    'sharifcapital.webp',
    'globalperspective.webp',
    'directadvisory.webp',
    'rootsindevelopment.webp',
    'St-kitts-nevis-passp_535b42.webp',
    'sao-tome-church.webp',
    'sao-tome-beach.webp',
    'sao-tome-coast.webp',
    'sao-tome-mountain.webp',
    'sao-tome-pico.webp',
    'sao-tome-pier.webp',
    'sao-tome-sunset.webp',
    'sao-tome-waterfall.webp'
)
foreach ($img in $imageFiles) {
    $imgPath = Join-Path 'c:\Users\Admin\Desktop\sharifgrp\assets\images' $img
    if (Test-Path $imgPath) {
        Copy-Item $imgPath -Destination "$tempDir\assets\images"
    }
}
Get-ChildItem -Path 'c:\Users\Admin\Desktop\sharifgrp\assets\images' -Filter '*location_map*' | ForEach-Object {
    Copy-Item $_.FullName -Destination "$tempDir\assets\images"
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $destZip -Force
$zipItem = Get-Item $destZip
Write-Output "SUCCESS: Created $destZip with size $($zipItem.Length) bytes"
