import os
import zipfile

def create_patch_zip():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_zip = os.path.join(root_dir, 'cpanel_blog_fix_update.zip')
    
    # List of files specifically needed for the blog system & image upload fix
    patch_files = [
        'admin/blog-editor.html',
        'admin/blog-faq-defaults.js',
        'admin/api/upload.php',
        'admin/api/blog-save-draft.php',
        'admin/api/blog-publish.php',
        'admin/api/blog-load.php',
        'admin/api/blog-list-drafts.php',
        'admin/api/blog-list-published.php',
        'admin/api/blog-delete-draft.php',
        'admin/api/delete-blog.php',
        'admin/api/save.php',
        'admin/api/webinars-regen.php',
        'assets/js/webinars-app.js',
        'admin/dashboard.html'
    ]

    print(f"Creating patch zip: {output_zip}...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for rel_path in patch_files:
            full_path = os.path.join(root_dir, rel_path)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Missing file: {full_path}")
            
            # Use forward slashes for Linux cPanel compatibility
            archive_name = rel_path.replace(os.sep, '/')
            zipf.write(full_path, arcname=archive_name)
            print(f"  + Added: {archive_name}")

    size_kb = os.path.getsize(output_zip) / 1024
    print(f"\nSUCCESS: Created {output_zip} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    create_patch_zip()
