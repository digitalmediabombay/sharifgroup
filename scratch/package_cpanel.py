import os
import zipfile
import shutil

repo_root = r"c:\Users\Admin\Desktop\sharifgrp"
zip_path = os.path.join(repo_root, "cpanel_update_images_fixed.zip")

# Folders to completely include:
dirs_to_include = [
    "about-founder",
    "citizenshipbyinvestment",
    "residencybyinvestment",
    os.path.join("programs", "citizenshipbyinvestment", "grenada"),
    os.path.join("programs", "citizenshipbyinvestment", "nauru"),
    os.path.join("programs", "citizenshipbyinvestment", "sao-tome-and-principe"),
    os.path.join("programs", "residencybyinvestment"),
]

# Assets images to include (the changed/added images):
image_names = [
    "grenada-aerial.webp",
    "greece.webp",
    "panama.webp",
    "portugal.webp",
    "uae-dubai.webp",
    "Caribbean-beach-1-.webp",
    "sharifcapital.webp",
    "globalperspective.webp",
    "directadvisory.webp",
    "rootsindevelopment.webp",
    "St-kitts-nevis-passp_535b42.webp",
    "sao-tome-church.webp",
    "sao-tome-beach.webp",
    "sao-tome-coast.webp",
    "sao-tome-mountain.webp",
    "sao-tome-pico.webp",
    "sao-tome-pier.webp",
    "sao-tome-sunset.webp",
    "sao-tome-waterfall.webp",
]

if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    # 1. Add directories
    for rel_dir in dirs_to_include:
        full_dir = os.path.join(repo_root, rel_dir)
        if os.path.exists(full_dir):
            for root, dirs, files in os.walk(full_dir):
                for f in files:
                    file_path = os.path.join(root, f)
                    arcname = os.path.relpath(file_path, repo_root)
                    zf.write(file_path, arcname)
                    print(f"Added: {arcname}")

    # 2. Add assets/images
    assets_img_dir = os.path.join(repo_root, "assets", "images")
    for fname in os.listdir(assets_img_dir):
        if fname in image_names or "location_map" in fname:
            file_path = os.path.join(assets_img_dir, fname)
            arcname = os.path.join("assets", "images", fname)
            zf.write(file_path, arcname)
            print(f"Added image: {arcname}")

print(f"\nSUCCESS: Created {zip_path} ({os.path.getsize(zip_path)} bytes)")
