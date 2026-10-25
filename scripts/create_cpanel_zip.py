import os
import zipfile
import sys

def create_cpanel_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_update_latest.zip')
    
    EXCLUDE_DIRS = {
        '.git', '.gemini', 'scratch', 'scripts',
        'sharif-partners-demo', 'Sharif-Webinars-Demo_1', 'Sharif-Partners-Demo_1'
    }

    EXCLUDE_FILES = {
        os.path.normpath('admin/api/config.php'),
        os.path.normpath('admin/api/.auth_tokens.json'),
        os.path.normpath('.gitignore'),
        os.path.normpath('package.json'),
        os.path.normpath('package-lock.json'),
        os.path.normpath('tailwind.config.js'),
        os.path.normpath('tailwindcss.exe'),
        os.path.normpath('build_css.bat'),
        os.path.normpath('generate_static_multilingual.py'),
        os.path.normpath('generate_blog_static.ps1'),
        os.path.normpath('sharifgroup_database.sql'),
        os.path.normpath('DESIGN_SYSTEM.md'),
        os.path.normpath('dynamic_content.md'),
        os.path.normpath('step.md')
    }

    EXCLUDE_EXTENSIONS = {'.zip', '.py', '.bat', '.exe', '.sql', '.txt', '.md'}

    files_to_zip = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        rel_dir = os.path.relpath(dirpath, root_dir)
        if rel_dir == '.':
            rel_dir = ''

        # Filter out excluded directories
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith('.')]

        if any(part in EXCLUDE_DIRS for part in rel_dir.split(os.sep)):
            continue

        for fname in filenames:
            rel_path = os.path.normpath(os.path.join(rel_dir, fname)) if rel_dir else fname
            ext = os.path.splitext(fname)[1].lower()

            if ext in EXCLUDE_EXTENSIONS:
                continue
            if rel_path in EXCLUDE_FILES:
                continue
            if fname.startswith('.') and fname != '.htaccess':
                continue

            files_to_zip.append(rel_path)

    # STRICT SAFETY CHECK: Ensure config.php is never included!
    for f in files_to_zip:
        if 'config.php' in f.lower():
            raise RuntimeError(f"CRITICAL SAFETY ABORT: {f} was matched! config.php must NOT be zipped.")

    print(f"Compressing {len(files_to_zip)} production files into {output_zip}...")
    
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        for rel_path in sorted(files_to_zip):
            full_path = os.path.join(root_dir, rel_path)
            # Store in zip using unix-style forward slashes for cPanel Linux compatibility
            archive_name = rel_path.replace(os.sep, '/')
            zipf.write(full_path, arcname=archive_name)

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"SUCCESS: Created {output_zip} ({size_mb:.2f} MB)")
    print("VERIFIED: admin/api/config.php was NOT included. Your live database config on cPanel is completely safe.")

if __name__ == '__main__':
    create_cpanel_zip()
