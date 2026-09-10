import hashlib
from io import BytesIO
import html
import os
import re
from urllib.parse import urlparse
from PIL import Image
import requests

TARGET_DIR = os.path.join("assets", "images")
os.makedirs(TARGET_DIR, exist_ok=True)

downloaded_cache = {}

SRC_REGEX = re.compile(
    r'(<img\b[^>]*?\bsrc=["\'])(https?://[^"\']+)(["\'])',
    re.IGNORECASE,
)

headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,"
        " like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Referer": "https://www.google.com/",
}


def get_webp_image(url):
  clean_url = html.unescape(url)

  if clean_url in downloaded_cache:
    return downloaded_cache[clean_url]

  try:
    print(f"Downloading: {clean_url[:70]}...")
    resp = requests.get(clean_url, headers=headers, timeout=20)

    if resp.status_code != 200:
      print(f"--> Skipped (Status {resp.status_code})")
      return url

    parsed = urlparse(clean_url)
    base_name = os.path.splitext(os.path.basename(parsed.path))[0]
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', base_name)[:18] or 'asset'
    url_hash = hashlib.md5(clean_url.encode()).hexdigest()[:6]
    file_name = f"{clean_name}_{url_hash}.webp"

    local_file_path = os.path.join(TARGET_DIR, file_name)

    img = Image.open(BytesIO(resp.content))
    if img.mode in ("RGBA", "LA") or (
        img.mode == "P" and "transparency" in img.info
    ):
      img = img.convert("RGBA")
    else:
      img = img.convert("RGB")

    img.save(local_file_path, "WEBP", quality=80, optimize=True)

    web_path = f"/assets/images/{file_name}"
    downloaded_cache[clean_url] = web_path
    print(f"--> Successfully converted: {web_path}")
    return web_path

  except Exception as e:
    print(f"--> Error: {e}")
    return url


for root, dirs, files in os.walk("."):
  if (
      "assets" in root
      or ".git" in root
      or "node_modules" in root
      or ".vercel" in root
  ):
    continue

  for file in files:
    if file.endswith(".html"):
      file_path = os.path.join(root, file)
      with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

      def replacer(match):
        prefix = match.group(1)
        old_url = match.group(2)
        suffix = match.group(3)
        new_url = get_webp_image(old_url)
        return f"{prefix}{new_url}{suffix}"

      new_content, count = SRC_REGEX.subn(replacer, content)

      if count > 0:
        with open(file_path, "w", encoding="utf-8") as f:
          f.write(new_content)
        print(f"[UPDATED] {file_path}")

print("\n--- PROCESS COMPLETED ---")