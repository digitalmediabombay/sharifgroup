import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor

repo_root = r"c:\Users\Admin\Desktop\sharifgrp"
all_local_urls = set()

for root, dirs, files in os.walk(repo_root):
    if any(x in root for x in [".git", "node_modules", "scratch", ".gemini"]):
        continue
    for f in files:
        if f.endswith(".html"):
            try:
                content = open(os.path.join(root, f), encoding="utf-8", errors="ignore").read()
                # Find all root-relative paths like /assets/..., /aboutus/..., /blog/...
                matches = re.findall(r'[\"\'\(](/[a-zA-Z0-9_\-\./]+\.(?:webp|png|jpg|jpeg|svg|ico|pdf))', content)
                for m in matches:
                    if not m.startswith("//") and not m.startswith("/api/"):
                        all_local_urls.add(m)
            except Exception:
                pass

print(f"Total root-relative media/files referenced across site: {len(all_local_urls)}")

missing_local = []
for u in sorted(list(all_local_urls)):
    local_path = os.path.join(repo_root, u.lstrip("/").replace("/", os.sep))
    if not os.path.exists(local_path):
        missing_local.append(u)

print(f"Total missing locally: {len(missing_local)}")
for m in missing_local:
    print(f"  [MISSING LOCAL] {m}")

def check_url(u):
    url = "https://sharifgroup.ae" + u
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        res = urllib.request.urlopen(req, timeout=6)
        if res.status == 200:
            return (u, 200, None)
        return (u, res.status, None)
    except Exception as e:
        return (u, 404, str(e))

missing_live = []
with ThreadPoolExecutor(max_workers=12) as executor:
    results = executor.map(check_url, sorted(list(all_local_urls)))
    for u, status, err in results:
        if status != 200:
            missing_live.append((u, status, err))

print(f"\nTOTAL FILES TESTED ON LIVE CPANEL: {len(all_local_urls)}")
print(f"TOTAL 404 ON LIVE CPANEL: {len(missing_live)}")
for u, status, err in sorted(missing_live):
    print(f"  [404 LIVE] {u}")
