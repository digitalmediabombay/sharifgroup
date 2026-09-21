================================================================
  SHARIF GROUP — Full Website & CMS Deployment Guide (cPanel)
  Landing Pages, Assets, MySQL Database, & CMS Dashboard Setup
================================================================

CRITICAL NOTE — WHY FULL UPLOAD IS REQUIRED:
  The CMS Live Studio directly interacts with your website's landing
  pages (e.g. index.html, blog/index.html, ali-sharif/, etc.) inside
  an interactive canvas iframe.
  
  If you only upload admin/, the landing pages on your server will
  be missing or outdated, and the visual studio will fail to load or
  edit them.
  
  THEREFORE: You must upload BOTH the website landing pages AND the
  admin/ folder to public_html/!


FILES PROVIDED IN THIS PACKAGE:
  1. Full Website Files       — All HTML landing pages, assets/, .htaccess
  2. admin/ (or admin_dashboard.zip) — Admin Login, CMS Studio, & API
  3. sharifgroup_database.sql — Clean database tables & schema


================================================================
STEP 1: Create a New MySQL Database in cPanel
================================================================

1. Log in to your cPanel account.
2. Go to "Databases" section → click "MySQL® Databases".

   ── Create a New Database ──────────────────────────────────
   3. In the "New Database" box, type a name:
      Example: sharif_cms
   4. Click "Create Database".
   → Your full database name will look like: cpaneluser_sharif_cms
   → COPY and SAVE this exact name — you will need it in Step 4.

   ── Create a Database User ─────────────────────────────────
   5. Scroll down to "MySQL Users – Add New User".
   6. Enter a username:
      Example: sharif_admin
   7. Set a strong password — use the Password Generator.
   → SAVE this password securely — you will need it in Step 4.
   8. Click "Create User".
   → Your full username will look like: cpaneluser_sharif_admin

   ── Add the User to the Database (VERY IMPORTANT) ───────────
   9.  Scroll down to "Add User To Database".
   10. Select the User (cpaneluser_sharif_admin) and Database (cpaneluser_sharif_cms).
   11. Click "Add".
   12. On the next screen, tick the checkbox "ALL PRIVILEGES".
   13. Click "Make Changes".
   ⚠️ DO NOT SKIP "ALL PRIVILEGES"! Without this, the CMS cannot save or publish!


================================================================
STEP 2: Import the SQL File into the Database (phpMyAdmin)
================================================================

1. Go back to cPanel Home.
2. In the "Databases" section, click "phpMyAdmin".
3. In the left sidebar, click on your newly created database
   (e.g. cpaneluser_sharif_cms).
4. From the top navigation menu, click the "Import" tab.
5. Click "Choose File" and select:
   → sharifgroup_database.sql
6. Scroll to the bottom and click "Go" or "Import".
7. You should see a green success message:
   "Import has been successfully finished."
   ✅ All database tables (cms_content, cms_publish_log, cms_users) are ready.


================================================================
STEP 3: Upload the Full Website & Admin to public_html
================================================================

In cPanel, open "File Manager" and navigate to the "public_html" directory.

Make sure your files are placed directly inside "public_html/":
  public_html/
    ├── index.html                           (Main homepage)
    ├── ali-sharif/index.html                (Founder page)
    ├── contact/index.html                   (Contact page with phone selector)
    ├── blog/index.html                      (Blog page)
    ├── citizenshipbyinvestment/index.html
    ├── residencybyinvestment/index.html
    ├── programs/                            (All country program sub-pages)
    ├── aboutus/index.html
    ├── realestate/index.html
    ├── assets/                              (CSS, JS, Images, WhatsApp widget)
    ├── admin/                               (CMS Login, Studio, API backend)
    └── .htaccess                            (Apache rewrite & performance rules)

UPLOAD METHODS (Choose One):

  METHOD A (Recommended — Zip Upload):
  1. Select all files & folders in your project folder and zip them (website.zip).
  2. In cPanel File Manager, upload website.zip to public_html/.
  3. Right-click website.zip → select "Extract" into public_html/.
  4. Ensure files are directly in public_html/ (not inside an extra subfolder).

  METHOD B (FTP / FileZilla):
  1. Connect via FTP to your host.
  2. Upload all files & folders directly into the public_html/ folder.


================================================================
STEP 4: Update the Database Connection File (config.php)
================================================================

1. In File Manager, open: public_html/admin/api/
2. Right-click the file "config.php" → select "Edit".
3. Replace the placeholder values with your actual database details from Step 1:

   ┌──────────────────────────────────────────────────────────────────┐
   │  define('DB_HOST', 'localhost');                                 │
   │  define('DB_NAME', 'cpaneluser_sharif_cms');     ← Step 1 exact  │
   │  define('DB_USER', 'cpaneluser_sharif_admin');   ← Step 1 exact  │
   │  define('DB_PASS', 'YourStrongPasswordHere');    ← Step 1 exact  │
   └──────────────────────────────────────────────────────────────────┘

   * Note: On almost all cPanel hosts, DB_HOST remains 'localhost'.
   * Ensure the cpaneluser_ prefix is included in both DB_NAME and DB_USER!

4. Click "Save Changes" and close the editor.


================================================================
STEP 5: Verify File Permissions & Hidden Files
================================================================

1. In cPanel File Manager, click "Settings" (top right corner).
2. Ensure "Show Hidden Files (dotfiles)" is TICKED → click "Save".
3. Verify that:
   - public_html/.htaccess is present.
   - public_html/admin/api/.htaccess is present.
4. Folders should have permission 755; files should have permission 644.


================================================================
STEP 6: Test Website & CMS Dashboard
================================================================

1. Test the Public Website:
   → Open https://yourdomain.com/ in your browser (use Incognito or Ctrl+F5).
   → Check WhatsApp widget:
       • Mr. Ali Sharif circle should show his photo with gold border.
       • Sales Expert circle should show the Sharif Group official logo.
   → Check Navigation and Contact form phone dropdown.

2. Test the CMS Dashboard:
   → Go to: https://yourdomain.com/admin/
   → Default Login Credentials:
       Email:     admin@sharifgroup.ae
       Password:  SharifCMS@2026
   → Click "Visual Studio" or "Programs" or "Blog".
   → Live preview canvas will load your actual landing pages.
   → Click any text on the canvas to edit, then click "Publish Live".
   → If you see "Published Successfully" (green notification) — setup is 100% complete!


================================================================
TROUBLESHOOTING GUIDE
================================================================

Q: "Dashboard opens, but saving/publishing fails or shows connection error"
A: Check public_html/admin/api/config.php.
   1. Did you include the cPanel prefix? (e.g. cpaneluser_sharif_cms, not just sharif_cms).
   2. In cPanel MySQL Databases, did you click "ALL PRIVILEGES" when adding the user to the database?
   3. Did you import sharifgroup_database.sql in phpMyAdmin?

Q: "Visual Live Studio canvas shows 404 or blank white screen"
A: The landing pages are missing from public_html/.
   Make sure index.html and all page folders are directly in public_html/ so
   the relative path ../index.html can find them.

Q: "Changes don't show up on the live website after publishing"
A: Hard-refresh your browser using Ctrl + F5 (or Cmd + Shift + R on Mac),
   or test in a private/incognito window to bypass browser cache.


================================================================
CHECKLIST — Confirm All Steps Are Done
================================================================

  [ ] STEP 1: MySQL Database & User created in cPanel
  [ ] STEP 1: User added to Database with ALL PRIVILEGES checked
  [ ] STEP 2: sharifgroup_database.sql imported via phpMyAdmin
  [ ] STEP 3: Full website (landing pages + assets + admin) extracted directly into public_html/
  [ ] STEP 4: admin/api/config.php updated with exact DB Name, User & Password
  [ ] STEP 5: Root .htaccess and admin/api/.htaccess verified
  [ ] STEP 6: Public website tested in Incognito (WhatsApp widget, contact form)
  [ ] STEP 6: Admin login & Publish Live tested at https://yourdomain.com/admin/

================================================================