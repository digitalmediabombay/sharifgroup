import os
import zipfile

def create_partners_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_partners_update.zip')

    partners_files = [
        'assets/js/partners-app.js',
        'assets/js/partners-i18n.js',
        'assets/css/partners.css',
        'partners/index.html',
        'fa/partners/index.html',
        'ar/partners/index.html',
        'zh/partners/index.html'
    ]

    print(f"Creating Partners Update ZIP: {output_zip}...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for rel_path in partners_files:
            full_path = os.path.join(root_dir, rel_path)
            if not os.path.exists(full_path):
                print(f"  ! Warning: {rel_path} not found, skipping.")
                continue

            archive_name = rel_path.replace(os.sep, '/')
            zipf.write(full_path, arcname=archive_name)
            print(f"  + Added: {archive_name}")

    size_kb = os.path.getsize(output_zip) / 1024
    print(f"\nSUCCESS: Created {output_zip} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    create_partners_zip()
