import os
import re
import subprocess
import hashlib
import requests

TARGET_DIR = os.path.join("assets", "videos")
os.makedirs(TARGET_DIR, exist_ok=True)

VIDEO_REGEX = re.compile(r'(<source\b[^>]*?\bsrc=["\'])(https?://[^"\']+)(["\'])', re.IGNORECASE)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

downloaded_videos = {}

def process_video(url):
    if url in downloaded_videos:
        return downloaded_videos[url]
    
    try:
        print(f"\n[1/3] Downloading external video: {url}")
        resp = requests.get(url, headers=headers, stream=True, timeout=60)
        if resp.status_code != 200:
            print(f"--> Download failed with status: {resp.status_code}")
            return url
        
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        temp_file = os.path.join(TARGET_DIR, f"temp_{url_hash}.mp4")
        final_filename = f"footer_bg_{url_hash}.mp4"
        final_file = os.path.join(TARGET_DIR, final_filename)
        
        with open(temp_file, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
        
        print("[2/3] Optimizing video for ultra-fast web playback...")
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", temp_file,
            "-vcodec", "libx264", "-crf", "24", "-preset", "slow",
            "-an",
            "-movflags", "+faststart",
            final_file
        ]
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        local_web_path = f"/assets/videos/{final_filename}"
        downloaded_videos[url] = local_web_path
        print(f"[3/3] Ready & Compressed: {local_web_path}")
        return local_web_path

    except Exception as e:
        print(f"--> Error: {e}")
        return url

for root, dirs, files in os.walk("."):
    if "assets" in root or ".git" in root or "node_modules" in root or ".vercel" in root:
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
                new_url = process_video(old_url)
                return f"{prefix}{new_url}{suffix}"
            
            new_content, count = VIDEO_REGEX.subn(replacer, content)
            
            if count > 0:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"[UPDATED] {file_path}")

print("\n--- ALL FOOTER VIDEOS DOWNLOADED, OPTIMIZED & PATHS UPDATED ---")