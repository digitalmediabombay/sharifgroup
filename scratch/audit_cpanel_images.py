import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor

repo_root = r"c:\Users\Admin\Desktop\sharifgrp"
all_imgs = set()

for root, dirs, files in os.walk(repo_root):
    if any(x in root for x in [".git", "node_modules", "scratch", ".gemini"]):
        continue
    for f in files:
        if f.endswith(".html"):
            try:
                content = open(os.path.join(root, f), encoding="utf-8", errors="ignore").read()
                matches = re.findall(r'[\"\'\(](/assets/images/[a-zA-Z0-9_\-\.]+\.(?:webp|png|jpg|jpeg|svg))', content)
                all_imgs.update(matches)
                matches_other = re.findall(r'[\"\'\(](/(?:aboutus|citizenshipbyinvestment|residencybyinvestment|realestate|programs)/[a-zA-Z0-9_\-\./]+\.(?:webp|png|jpg|jpeg|svg))', content)
                all_imgs.update(matches_other)
            except Exception:
                pass

print(f"Total unique images referenced in HTML: {len(all_imgs)}")

missing_local = [img for img in all_imgs if not os.path.exists(os.path.join(repo_root, img.lstrip("/").replace("/", os.sep)))]
print(f"Missing locally on disk: {len(missing_local)}")
for m in missing_local:
    print(f"  [MISSING LOCAL] {m}")

def check_cpanel(img):
    url = "https://sharifgroup.ae" + img
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        res = urllib.request.urlopen(req, timeout=8)
        if res.status == 200:
            return (img, 200, None)
        return (img, res.status, None)
    except Exception as e:
        return (img, 404, str(e))

missing_cpanel = []
with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(check_cpanel, sorted(list(all_imgs)))
    for img, status, err in results:
        if status != 200:
            missing_cpanel.append((img, status, err))

print(f"\nTOTAL IMAGES TESTED ON CPANEL: {len(all_imgs)}")
print(f"TOTAL MISSING ON CPANEL (404): {len(missing_cpanel)}")
for img, status, err in missing_cpanel:
    print(f"  [404 ON LIVE CPANEL] {img}")
