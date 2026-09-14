================================================================
  SHARIF GROUP — CMS Dashboard Setup Guide (cPanel)
  MySQL Database Creation, SQL Import & CMS Connection
================================================================

FILES PROVIDED BY US:
  1. sharifgroup_database.sql  — Database tables & initial content
  2. admin_dashboard.zip       — Admin login, CMS Dashboard & config


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
   → COPY and SAVE this name — you will need it in Step 4.

   ── Create a Database User ─────────────────────────────────
   5. Scroll down to "MySQL Users – Add New User".
   6. Enter a username:
      Example: sharif_admin
   7. Set a strong password — use the Password Generator.
   → SAVE this password securely — you will need it in Step 4.
   8. Click "Create User".
   → Your full username will look like: cpaneluser_sharif_admin

   ── Add the User to the Database ───────────────────────────
   9.  Scroll down to "Add User To Database".
   10. Select the User and Database you just created.
   11. Click "Add".
   12. On the next screen, tick "ALL PRIVILEGES" → click "Make Changes".


================================================================
STEP 2: Import the SQL File into the Database (phpMyAdmin)
================================================================

1. Go back to cPanel Home.
2. In the "Databases" section, click "phpMyAdmin".
3. In the left sidebar, click on your newly created database
   (e.g. cpaneluser_sharif_cms).
4. From the top menu, click the "Import" tab.
5. Click "Choose File" and select the file we provided:
   → sharifgroup_database.sql
6. Scroll to the very bottom and click "Go" or "Import".
7. You should see a green message:
   "Import has been successfully finished."
   ✅ All database tables and content are now ready.


================================================================
STEP 3: Upload the Admin Dashboard Files
================================================================

1. In cPanel, open "File Manager".
2. Navigate to the "public_html" folder.
3. Click "Upload" at the top and upload:
   → admin_dashboard.zip
4. After upload, right-click "admin_dashboard.zip" in public_html
   and select "Extract".
5. After extraction, you should see:
   → public_html/admin/    ✅ (this folder should now exist)


================================================================
STEP 4: Update the Database Connection File (config.php)
================================================================

1. In File Manager, open: public_html/admin/api/
2. Right-click the file "config.php" → select "Edit".
3. Replace the placeholder values with YOUR actual database
   details from Step 1:

   ┌─────────────────────────────────────────────────────────┐
   │  define('DB_HOST', 'localhost');                        │
   │  define('DB_NAME', 'cpaneluser_sharif_cms');  ← Step 1 │
   │  define('DB_USER', 'cpaneluser_sharif_admin');← Step 1 │
   │  define('DB_PASS', 'YourStrongPasswordHere'); ← Step 1 │
   └─────────────────────────────────────────────────────────┘

4. Click "Save Changes" → close the editor.


================================================================
STEP 5: Log In and Test the Live Dashboard
================================================================

Open your browser and go to:
  → Admin Login:     https://yourdomain.com/admin/
  → CMS Dashboard:   https://yourdomain.com/admin/dashboard.html

Default Login Credentials:
  Email:     admin@sharifgroup.ae
  Password:  SharifCMS@2026

✅ If you see the CMS Dashboard — setup is complete!


================================================================
STEP 6: Change Your Admin Email & Password (IMPORTANT)
================================================================

For security, change your default password immediately after
your first login.

1. After logging in, click "Settings" in the left sidebar.
2. Scroll down to the "Admin Account & Security Credentials"
   section.
3. Fill in the form:
   - Current Password:  SharifCMS@2026
   - New Admin Email:   (your preferred email — optional)
   - New Password:      (minimum 8 characters)
   - Confirm Password:  (repeat new password)
4. Click "Update Admin Credentials".
✅ Your new credentials are now securely saved in the database.


================================================================
CHECKLIST — Confirm All Steps Are Done
================================================================

  [ ] STEP 1: MySQL Database & User created in cPanel
  [ ] STEP 1: User assigned to Database with ALL PRIVILEGES
  [ ] STEP 2: sharifgroup_database.sql imported via phpMyAdmin
  [ ] STEP 3: admin_dashboard.zip uploaded & extracted to public_html/admin/
  [ ] STEP 4: config.php updated with your DB name, user & password
  [ ] STEP 5: Login tested at https://yourdomain.com/admin/
  [ ] STEP 6: Admin email & password updated in Settings

================================================================
  Need help? Contact us and we will assist you immediately.
================================================================