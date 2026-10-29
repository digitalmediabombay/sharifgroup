import os
import zipfile
import sys

def create_events_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_events_update.zip')

    # Comprehensive list of all files modified for the Events & Webinars update
    events_files = [
        # Events landing & detail pages (all 4 languages)
        'events/index.html',
        'fa/events/index.html',
        'ar/events/index.html',
        'zh/events/index.html',

        # Webinars pages (redirect / alternative routes)
        'webinars/index.html',
        'fa/webinars/index.html',
        'ar/webinars/index.html',
        'zh/webinars/index.html',

        # Core frontend JS & CSS for events
        'assets/js/webinars-app.js',
        'assets/js/webinars-data.js',
        'assets/js/webinars-i18n.js',
        'assets/css/webinars.css',

        # Locales with webinar translations
        'assets/locales/en.json',
        'assets/locales/fa.json',
        'assets/locales/ar.json',
        'assets/locales/zh.json',

        # CMS & Data backend
        'data/sgcms_webinars.json',
        'admin/api/published_content.json',
        'admin/api/draft_content.json',
        'admin/api/webinars-regen.php',
        'admin/dashboard.html',

        # Homepages featuring the updated webinar card
        'index.html',
        'fa/index.html',
        'ar/index.html',
        'zh/index.html',

        # Blog sidebars featuring the updated webinar card
        'blog/index.html',
        'fa/blog/index.html',
        'ar/blog/index.html',
        'zh/blog/index.html'
    ]

    # Dynamically include all physical session detail pages
    for root_folder in ['events', 'fa/events', 'ar/events', 'zh/events', 'webinars', 'fa/webinars', 'ar/webinars', 'zh/webinars']:
        full_rf = os.path.join(root_dir, root_folder)
        if os.path.exists(full_rf):
            for sub in os.listdir(full_rf):
                sub_p = os.path.join(full_rf, sub, 'index.html')
                if os.path.isfile(sub_p):
                    rel = os.path.relpath(sub_p, root_dir).replace(os.sep, '/')
                    if rel not in events_files:
                        events_files.append(rel)

    print(f"Creating Events Update ZIP: {output_zip}...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for rel_path in events_files:
            full_path = os.path.join(root_dir, rel_path)
            if not os.path.exists(full_path):
                print(f"  ! Warning: {rel_path} not found, skipping.")
                continue

            # Strict security check: never allow config.php
            if 'config.php' in rel_path.lower():
                raise RuntimeError("Security error: config.php matched!")

            # Store in zip using unix-style forward slashes for Linux cPanel compatibility
            archive_name = rel_path.replace(os.sep, '/')
            zipf.write(full_path, arcname=archive_name)
            print(f"  + Added: {archive_name}")

    size_kb = os.path.getsize(output_zip) / 1024
    print(f"\nSUCCESS: Created {output_zip} ({size_kb:.1f} KB)")
    print("VERIFIED: Clean archive ready for direct cPanel extraction.")

if __name__ == '__main__':
    create_events_zip()
