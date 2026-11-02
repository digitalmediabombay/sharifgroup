# -*- coding: utf-8 -*-
import os
import zipfile

def create_changed_only_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_update_only_changed_files.zip')

    files = [
        '.htaccess',
        'api/contact.php',
        'api/event-register.php',
        'admin/blog-editor.html',
        'assets/css/partners.css',
        'assets/js/forms.js',
        'assets/js/partners-app.js',
        'assets/js/partners-i18n.js',
        'assets/js/language-switcher.js',
        'assets/js/blog-webinar-banner.js',
        'assets/js/webinars-app.js',
        'data/sgcms_webinars.json',
        'index.html',
        'ar/index.html',
        'fa/index.html',
        'zh/index.html',
        'contact/index.html',
        'ar/contact/index.html',
        'fa/contact/index.html',
        'zh/contact/index.html',
        'citizenshipbyinvestment/index.html',
        'ar/citizenshipbyinvestment/index.html',
        'fa/citizenshipbyinvestment/index.html',
        'zh/citizenshipbyinvestment/index.html',
        'residencybyinvestment/index.html',
        'ar/residencybyinvestment/index.html',
        'fa/residencybyinvestment/index.html',
        'zh/residencybyinvestment/index.html',
        'realestate/index.html',
        'ar/realestate/index.html',
        'fa/realestate/index.html',
        'zh/realestate/index.html',
        'educationaladvisory/index.html',
        'ar/educationaladvisory/index.html',
        'fa/educationaladvisory/index.html',
        'zh/educationaladvisory/index.html',
        'eligibilitychecker/index.html',
        'ar/eligibilitychecker/index.html',
        'fa/eligibilitychecker/index.html',
        'zh/eligibilitychecker/index.html',
        'aboutus/index.html',
        'ar/aboutus/index.html',
        'fa/aboutus/index.html',
        'zh/aboutus/index.html',
        'about-founder/index.html',
        'ar/about-founder/index.html',
        'fa/about-founder/index.html',
        'zh/about-founder/index.html',
    ]

    # Add all program pages across all 4 languages (EN, AR, FA, ZH)
    for prefix in ['', 'ar/', 'fa/', 'zh/']:
        base = os.path.join(root_dir, prefix + 'programs')
        if os.path.exists(base):
            for r, _, fs in os.walk(base):
                for f in fs:
                    if f.endswith('.html'):
                        rel = os.path.relpath(os.path.join(r, f), root_dir).replace('\\', '/')
                        files.append(rel)

    # Sort & deduplicate
    files = sorted(list(set(files)))
    print(f"Total files to pack: {len(files)}")

    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        added = 0
        for rel_p in files:
            full_p = os.path.join(root_dir, rel_p)
            if not os.path.exists(full_p):
                print(f"  Warning: {rel_p} not found, skipping.")
                continue
            zf.write(full_p, arcname=rel_p)
            added += 1

    size_kb = os.path.getsize(output_zip) / 1024
    size_mb = size_kb / 1024
    print(f"\nSUCCESS! Created: {output_zip}")
    print(f"Total files archived: {added}")
    print(f"Archive Size: {size_kb:.1f} KB ({size_mb:.2f} MB)")

if __name__ == '__main__':
    create_changed_only_zip()

