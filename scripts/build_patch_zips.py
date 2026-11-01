# -*- coding: utf-8 -*-
import os, zipfile

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# 1. Update only changed files (3.35 MB)
import create_cpanel_changed_only_zip
create_cpanel_changed_only_zip.create_changed_only_zip()

# 2. Forms only patch (3.09 MB)
patch_zip = os.path.join(root_dir, 'cpanel_forms_patch.zip')
patch_files = [
    '.htaccess',
    'api/contact.php',
    'api/event-register.php',
    'assets/js/forms.js',
    'assets/js/partners-app.js',
    'assets/js/webinars-app.js',
    'assets/js/language-switcher.js',
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
]

for prefix in ['', 'ar/', 'fa/', 'zh/']:
    base = os.path.join(root_dir, prefix + 'programs')
    if os.path.exists(base):
        for r, _, fs in os.walk(base):
            for f in fs:
                if f.endswith('.html'):
                    patch_files.append(os.path.relpath(os.path.join(r, f), root_dir).replace('\\', '/'))

patch_files = sorted(list(set(patch_files)))
with zipfile.ZipFile(patch_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for rel_p in patch_files:
        full_p = os.path.join(root_dir, rel_p)
        if os.path.exists(full_p):
            zf.write(full_p, arcname=rel_p)

size_mb = os.path.getsize(patch_zip) / (1024 * 1024)
print(f"Created: {patch_zip} ({size_mb:.2f} MB, {len(patch_files)} files)")

