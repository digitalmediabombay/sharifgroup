import os, re, urllib.request, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def get_status(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8, context=ctx) as res:
            return res.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return "TIMEOUT/FAILED"

external_assets = []
url_pattern = re.compile(r'(?:src|poster|href)=["\'](https?://[^"\']+\.(?:png|jpg|jpeg|webp|gif|svg|mp4|webm|mov))["\']', re.I)

for root, _, files in os.walk('.'):
    if any(x in root for x in ['.git', 'node_modules', '.vercel']):
        continue
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                matches = url_pattern.findall(content)
                for url in matches:
                    external_assets.append((path, url))

print('=' * 80)
print(f'TOTAL HOTLINKED EXTERNAL ASSETS FOUND: {len(external_assets)}')
print('=' * 80)

checked = {}
for file_path, url in external_assets:
    if url not in checked:
        print(f"Checking URL: {url[:70]}...")
        status = get_status(url)
        checked[url] = status
    else:
        status = checked[url]
    
    flag = "[BROKEN/ERROR]" if status in [403, 404, "TIMEOUT/FAILED"] else "[WORKING]"
    print(f"{flag} Status: {status} | File: {file_path}")
    print(f"   └── URL: {url}")
    print('-' * 80)

broken_count = sum(1 for s in checked.values() if s in [403, 404, "TIMEOUT/FAILED"])
print(f"\nAUDIT SUMMARY: Unique URLs: {len(checked)} | Broken/Forbidden: {broken_count}")
print('=' * 80)
