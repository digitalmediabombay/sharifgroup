Sharif Group — Complete MySQL Database & CMS Setup Guide (cPanel)
Database Creation, SQL Import & CMS Connection
Files We Are Providing You
[Provided by Us: sharifgroup_database.sql] — (Database tables and initial content data schema file.)
[Provided by Us: admin_dashboard.zip] — (Admin folder containing the Login, CMS Dashboard, and api/config.php database connection file.)
STEP 1: Create a New MySQL Database in cPanel
Log in to your cPanel.
Go to the Databases section and click "MySQL® Databases".
Create a New Database:
In the "New Database" box, enter a name (for example: sharif_cms).
Click "Create Database".
Your full Database Name will be created, for example: cpaneluser_sharif_cms — copy this name.
Create a Database User:
Scroll down to "MySQL Users - Add New User".
Enter a username (for example: sharif_admin).
Create a strong password. Use the Password Generator and save the password somewhere secure.
Click "Create User".
Your full Database User will be created, for example: cpaneluser_sharif_admin.
Add the User to the Database:
Scroll further down to the "Add User To Database" section.
User: Select the user you just created.
Database: Select the database you just created.
Click "Add".
On the next screen, check "ALL PRIVILEGES" and click "Make Changes".
STEP 2: Import the SQL File into the Database (phpMyAdmin)
Go back to the cPanel Home page.
In the Databases section, click "phpMyAdmin".
In the phpMyAdmin left sidebar, click your newly created database (for example: cpaneluser_sharif_cms).
From the top menu, click the "Import" tab.
Click the "Choose File" (Browse) button and select the SQL file provided by us:
[Provided by Us: sharifgroup_database.sql]
Scroll to the very bottom of the page and click the "Go" or "Import" button.
You should see a green message saying: "Import has been successfully finished." All database tables are now ready.
STEP 3: Upload the Admin Dashboard Files
Open File Manager in cPanel and go to the public_html folder.
Click the Upload button at the top and upload the ZIP file provided by us:
[Provided by Us: admin_dashboard.zip]
After the upload is complete, right-click admin_dashboard.zip in public_html/ and select Extract.
Once extracted, you should see an admin/ folder inside public_html/.
STEP 4: Update the Database Connection File (config.php)
In File Manager, open the public_html/admin/api/ folder.
[Provided by Us: admin/api/config.php] — Right-click the file and select Edit.
Enter the database details you created in Step 1:
// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_sharif_cms');     // Database Name created in Step 1
define('DB_USER', 'cpaneluser_sharif_admin');   // Database User created in Step 1
define('DB_PASS', 'YourStrongPasswordHere');    // Password created in Step 1
Click "Save Changes" in the top-right corner and close the editor.
STEP 5: Log In and Test the Live Dashboard
Your database and CMS dashboard should now be successfully connected!
- Admin Login URL: https://yourdomain.com/admin/
- Initial Default Email: admin@sharifgroup.ae
- Initial Default Password: SharifCMS@2026

STEP 6: Change Your Admin ID (Email) & Password
For security, please change your default password immediately after first login:
1. After logging in, click "Settings" in the left sidebar menu.
2. Scroll to the "Admin Account & Security Credentials" section.
3. Enter your Current Password: SharifCMS@2026
4. (Optional) Enter your New Admin Email / ID if you wish to change it.
5. Enter your New Password (minimum 8 characters) and confirm it.
6. Click "Update Admin Credentials". Your new credentials are now securely updated in the MySQL database.

From here, whenever you add a new Blog, create a new Program, or change Pricing, the data will be saved directly to your cPanel MySQL Database and displayed on the live website.

Ready-to-Send Checklist for Client
[x] MySQL Database & User created in cPanel.
[x] User assigned to Database with All Privileges.
[x] sharifgroup_database.sql imported via phpMyAdmin.
[x] admin_dashboard.zip extracted to public_html/admin/.
[x] admin/api/config.php updated with DB name, user & password.
[x] Login tested at https://yourdomain.com/admin/.
[x] Admin ID & password updated in Settings.