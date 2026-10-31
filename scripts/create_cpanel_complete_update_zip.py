# -*- coding: utf-8 -*-
import os
import zipfile
import subprocess
import sys

def build_complete_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_complete_update.zip')

    files_to_pack = set()

    # 1. Collect all files modified since base commit 3f9a70c0 up to HEAD
    try:
        git_out = subprocess.check_output(
            ['git', 'diff', '--name-only', '3f9a70c0', 'HEAD'],
            cwd=root_dir,
            text=True
        )
        for line in git_out.strip().split('\n'):
            line = line.strip().replace('\\', '/')
            if not line:
                continue
            # Ignore demo folders and local scripts
            if line.startswith(('Sharif-Webinars-Demo_1/', 'sharif-partners-demo/', 'scripts/')):
                continue
            files_to_pack.add(line)
    except Exception as e:
        print(f"Git diff warning: {e}")

    # 2. Add all key core files to guarantee completeness
    core_files = [
        '.htaccess',
        '404.html',
        'index.html',
        'blog/index.html',
        'events/index.html',
        'webinars/index.html',
        'partners/index.html',
        'partners/thanks/index.html',
        'data/sgcms_webinars.json',
        'admin/blog-editor.html',
        'admin/dashboard.html',
        'admin/api/published_content.json',
        'admin/api/draft_content.json',
        'admin/api/webinars-regen.php',
        'admin/api/delete-blog.php',
        'assets/css/webinars.css',
        'assets/js/forms.js',
        'assets/js/language-switcher.js',
        'assets/js/blog-webinar-banner.js',
        'assets/js/webinars-app.js',
        'assets/js/webinars-data.js',
        'assets/js/webinars-i18n.js',
        'assets/js/partners-app.js',
        'assets/js/partners-i18n.js',
        'assets/locales/en.json',
        'assets/locales/fa.json',
        'assets/locales/ar.json',
        'assets/locales/zh.json',
        'assets/locales/articles_fa.json',
        'assets/locales/articles_ar.json',
        'assets/locales/articles_zh.json'
    ]
    for cf in core_files:
        files_to_pack.add(cf)

    # 3. Add all event & webinar physical session detail pages in all languages
    for lang_prefix in ['', 'fa/', 'ar/', 'zh/']:
        for sec in ['events', 'webinars']:
            base_p = os.path.join(root_dir, lang_prefix + sec)
            if os.path.exists(base_p):
                for sub in os.listdir(base_p):
                    sub_idx = os.path.join(base_p, sub, 'index.html')
                    if os.path.isfile(sub_idx):
                        rel = os.path.relpath(sub_idx, root_dir).replace('\\', '/')
                        files_to_pack.add(rel)

    # Convert to sorted list
    sorted_files = sorted(list(files_to_pack))
    print(f"Total candidate files to pack: {len(sorted_files)}")

    print(f"\nWriting archive: {output_zip}...")
    added_count = 0
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for rel_path in sorted_files:
            full_path = os.path.join(root_dir, rel_path)
            if not os.path.exists(full_path):
                print(f"  ! Warning: {rel_path} not found, skipping.")
                continue

            # Strict security check: NEVER bundle config.php or server credentials
            if 'config.php' in rel_path.lower():
                raise RuntimeError("Security error: config.php matched!")

            arcname = rel_path.replace('\\', '/')
            zipf.write(full_path, arcname=arcname)
            added_count += 1

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    size_kb = os.path.getsize(output_zip) / 1024
    print(f"\nSUCCESS! Created {output_zip}")
    print(f"Total files archived: {added_count}")
    print(f"Archive Size: {size_kb:.1f} KB ({size_mb:.2f} MB)")
    print("Format: Unix-compatible paths, ready for direct root extraction into public_html on cPanel.")

if __name__ == '__main__':
    build_complete_zip()
