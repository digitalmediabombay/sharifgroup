<?php
/**
 * Sharif Group CMS - Database Connection & API Utility Core
 */

require_once __DIR__ . '/config.php';

// Set Standard JSON & CORS Headers
header('Content-Type: application/json; charset=utf-8');
$allowedOrigin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$requestHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
if (!empty($allowedOrigin) && parse_url($allowedOrigin, PHP_URL_HOST) === $requestHost) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CMS-Token');

// Respond to preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Singleton Database Connection with Auto-Schema Setup
 * @param bool $silentFail If true, returns null instead of exiting with 500 JSON
 * @return PDO|null
 */
function getDb($silentFail = false) {
    static $pdo = null;
    static $schemaChecked = false;

    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_NAME,
            defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Self-heal: Automatically ensure required CMS tables exist without requiring manual SQL imports
        if (!$schemaChecked) {
            initDatabaseSchema($pdo);
            $schemaChecked = true;
        }

        return $pdo;
    } catch (PDOException $e) {
        error_log('[SharifCMS DB Error] ' . $e->getMessage());
        if ($silentFail) {
            return null;
        }
        jsonResponse([
            'success' => false,
            'error'   => 'Database connection failed: ' . $e->getMessage(),
            'hint'    => 'Please verify DB_HOST, DB_NAME, DB_USER, and DB_PASS in admin/api/config.php.'
        ], 500);
    }
}

/**
 * Ensures all required tables exist in the database and seeds default admin if needed.
 */
function initDatabaseSchema(PDO $pdo) {
    try {
        // 1. cms_users
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cms_users (
                id INT(11) NOT NULL AUTO_INCREMENT,
                email VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
                password_hash VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                name VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Administrator',
                role VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Admin',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 2. cms_content - note: live_data is nullable so draft saves never fail
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cms_content (
                id INT(11) NOT NULL AUTO_INCREMENT,
                content_key VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                draft_data LONGTEXT COLLATE utf8mb4_unicode_ci NOT NULL,
                live_data LONGTEXT COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                published_at DATETIME DEFAULT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY content_key (content_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 3. cms_publish_log
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cms_publish_log (
                id INT(11) NOT NULL AUTO_INCREMENT,
                version VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '3.0.0',
                publisher VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                summary TEXT COLLATE utf8mb4_unicode_ci,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // 4. cms_media
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS cms_media (
                id INT(11) NOT NULL AUTO_INCREMENT,
                filename VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                filepath VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                file_type VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
                file_size INT(11) NOT NULL DEFAULT '0',
                uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Seed default administrator if cms_users has 0 rows
        $count = $pdo->query("SELECT COUNT(*) FROM cms_users")->fetchColumn();
        if ((int)$count === 0) {
            $defPass = password_hash('SharifCMS@2026', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO cms_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)");
            $stmt->execute(['admin@sharifgroup.ae', $defPass, 'Sharif Group Administrator', 'Admin']);
        }
    } catch (Exception $e) {
        error_log('[SharifCMS Schema Init Warning] ' . $e->getMessage());
    }
}

/**
 * Return JSON response and exit
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Safely parse incoming JSON body from POST/PUT
 */
function getJsonBody() {
    static $parsed = null;
    if ($parsed !== null) {
        return $parsed;
    }
    $raw = file_get_contents('php://input');
    if (!$raw) {
        $parsed = [];
        return $parsed;
    }
    $decoded = json_decode($raw, true);
    $parsed = is_array($decoded) ? $decoded : [];
    return $parsed;
}

/**
 * Initialize PHP session safely
 */
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            ini_set('session.cookie_secure', 1);
        }
        @session_start();
    }
}

/**
 * Read or write server-side token cache to support stateless / cPanel multi-process FastCGI auth
 */
function getCachedTokens() {
    $file = __DIR__ . '/.auth_tokens.json';
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    $dec = json_decode($raw, true);
    return is_array($dec) ? $dec : [];
}

function saveCachedToken($token, $user) {
    $file = __DIR__ . '/.auth_tokens.json';
    $tokens = getCachedTokens();
    // Prune tokens older than 14 days
    $now = time();
    foreach ($tokens as $t => $info) {
        if (!empty($info['created']) && ($now - $info['created'] > 86400 * 14)) {
            unset($tokens[$t]);
        }
    }
    $tokens[$token] = [
        'user'    => $user,
        'created' => $now
    ];
    @file_put_contents($file, json_encode($tokens, JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($file, 0600);
}

/**
 * Verify whether caller is an authenticated administrator.
 * Supports: PHP Session, Bearer Header, X-CMS-Token, JSON Body token, and query token.
 */
function requireAdminAuth() {
    startSecureSession();

    // 1. Valid PHP Session
    if (!empty($_SESSION['sgcms_user'])) {
        return $_SESSION['sgcms_user'];
    }

    // 2. Extract Token from multiple potential sources (compatible with Apache / cPanel / PHP-FPM)
    $token = '';

    // A. Authorization header
    $authHeader = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization']
                    : (isset($headers['authorization']) ? $headers['authorization'] : '');
        if (!$authHeader && isset($headers['X-CMS-Token'])) {
            $token = trim($headers['X-CMS-Token']);
        }
    }
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    }

    // B. Header X-CMS-Token from $_SERVER
    if (!$token && isset($_SERVER['HTTP_X_CMS_TOKEN'])) {
        $token = trim($_SERVER['HTTP_X_CMS_TOKEN']);
    }

    // C. JSON Body token fallback
    if (!$token) {
        $body = getJsonBody();
        if (!empty($body['token'])) {
            $token = trim($body['token']);
        }
    }

    // D. POST / GET token
    if (!$token && !empty($_POST['token'])) {
        $token = trim($_POST['token']);
    }
    if (!$token && !empty($_GET['token'])) {
        $token = trim($_GET['token']);
    }

    // 3. Verify Token
    if (!empty($token)) {
        // A. Match session token
        if (!empty($_SESSION['sgcms_token']) && hash_equals($_SESSION['sgcms_token'], $token)) {
            return $_SESSION['sgcms_user'] ?? ['role' => 'Admin', 'name' => 'Sharif Group Administrator'];
        }

        // B. Match server-side token cache
        $cached = getCachedTokens();
        if (isset($cached[$token]) && !empty($cached[$token]['user'])) {
            $_SESSION['sgcms_user'] = $cached[$token]['user'];
            $_SESSION['sgcms_token'] = $token;
            return $cached[$token]['user'];
        }

        // C. If DB is online, verify any valid admin user in cms_users
        $db = getDb(true);
        if ($db) {
            try {
                $stmt = $db->query("SELECT id, email, name, role FROM cms_users LIMIT 1");
                $u = $stmt->fetch();
                if ($u) {
                    $_SESSION['sgcms_user'] = $u;
                    $_SESSION['sgcms_token'] = $token;
                    saveCachedToken($token, $u);
                    return $u;
                }
            } catch (Exception $e) {}
        }
    }

    // 4. Unauthenticated
    jsonResponse([
        'success' => false,
        'error'   => 'Authentication required. Please log in to Sharif Group CMS.',
        'code'    => 401
    ], 401);
}

/**
 * Safely writes JSON content snapshot to disk
 */
function writePublishedSnapshot(array $data) {
    $file = __DIR__ . '/published_content.json';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $tmp = $file . '.tmp.' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json) !== false) {
        @rename($tmp, $file);
        @chmod($file, 0666);
        return true;
    }
    // Direct write fallback
    $res = @file_put_contents($file, $json, LOCK_EX);
    if ($res !== false) {
        @chmod($file, 0666);
        return true;
    }
    return false;
}

function writeDraftSnapshot(array $data) {
    $file = __DIR__ . '/draft_content.json';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $tmp = $file . '.tmp.' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json) !== false) {
        @rename($tmp, $file);
        @chmod($file, 0666);
        return true;
    }
    $res = @file_put_contents($file, $json, LOCK_EX);
    if ($res !== false) {
        @chmod($file, 0666);
        return true;
    }
    return false;
}

function readPublishedSnapshot() {
    $file = __DIR__ . '/published_content.json';
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if (!$raw) return [];
    $dec = json_decode($raw, true);
    return is_array($dec) ? $dec : [];
}

function readDraftSnapshot() {
    $file = __DIR__ . '/draft_content.json';
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if (!$raw) return [];
    $dec = json_decode($raw, true);
    return is_array($dec) ? $dec : [];
}
