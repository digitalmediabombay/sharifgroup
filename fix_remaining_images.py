import os, re, hashlib, requests
from PIL import Image
from io import BytesIO
import urllib3
urllib3.disable_warnings()

TARGET_DIR = os.path.join("assets", "images")
os.makedirs(TARGET_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
}

cache = {}

def get_clean_local_image(url):
    if url in cache:
        return cache[url]
    
    clean_url = url.split('&amp;')[0]
    ext = clean_url.split('?')[0].split('.')[-1].lower()
    url_hash = hashlib.md5(clean_url.encode()).hexdigest()[:8]
    
    try:
        resp = requests.get(clean_url, headers=headers, timeout=20, verify=False)
        if resp.status_code != 200:
            print(f"[SKIP {resp.status_code}] {url}")
            return url
        
        # If it is SVG, save as is
        if ext == 'svg' or 'image/svg' in resp.headers.get('Content-Type', ''):
            filename = f"vector_{url_hash}.svg"
            local_path = os.path.join(TARGET_DIR, filename)
            with open(local_path, 'wb') as f:
                f.write(resp.content)
            web_path = f"/assets/images/{filename}"
            cache[url] = web_path
            print(f"[SAVED SVG] {web_path}")
            return web_path
        
        # Convert regular images to optimized WebP
        img = Image.open(BytesIO(resp.content))
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
            
        filename = f"img_{url_hash}.webp"
        local_path = os.path.join(TARGET_DIR, filename)
        img.save(local_path, 'WEBP', quality=85, optimize=True)
        
        web_path = f"/assets/images/{filename}"
        cache[url] = web_path
        print(f"[SAVED WEBP] {web_path}")
        return web_path

    except Exception as e:
        print(f"[ERR] {url} -> {e}")
        return url

# Update all HTML files
for root, dirs, files in os.walk("."):
    if any(x in root for x in ['assets', '.git', 'node_modules', '.vercel']):
        continue
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            pattern = r'(<img\b[^>]*?\bsrc=[\"\'])(https?://[^\"\']+)([\"\'])'
            
            def replacer(match):
                prefix = match.group(1)
                old_url = match.group(2)
                suffix = match.group(3)
                new_url = get_clean_local_image(old_url)
                return f"{prefix}{new_url}{suffix}"

            new_content, count = re.subn(pattern, replacer, content)
            if count > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"[UPDATED] {file_path}")

print("\n--- ALL REMAINING IMAGES & SVGs LOCALIZED ---")
