<?php
/**
 * Sharif Group CMS - Database & System Configuration
 *
 * Follow STEP 4 in your setup guide:
 * Replace 'cpaneluser_sharif_cms', 'cpaneluser_sharif_admin', and 'YourStrongPasswordHere'
 * with the actual MySQL database credentials created in your cPanel.
 */

// Prevent direct script execution from browser without context
if (basename($_SERVER['PHP_SELF']) === 'config.php') {
    http_response_code(403);
    exit('Direct access forbidden.');
}

// ── Database Credentials ──────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'cpaneluser_sharif_cms');     // Database Name created in Step 1
define('DB_USER', 'cpaneluser_sharif_admin');   // Database User created in Step 1
define('DB_PASS', 'YourStrongPasswordHere');    // Password created in Step 1
define('DB_CHARSET', 'utf8mb4');

// ── Upload & Asset Settings ───────────────────────────────────────
define('UPLOAD_DIR', dirname(dirname(__DIR__)) . '/assets/images/uploads/');
define('UPLOAD_URL_PREFIX', '/assets/images/uploads/');
define('MAX_UPLOAD_SIZE', 15 * 1024 * 1024); // 15 Megabytes

// ── Session & Security ───────────────────────────────────────────
define('SESSION_LIFETIME', 604800); // 7 Days
define('ADMIN_DEFAULT_EMAIL', 'admin@sharifgroup.ae');
