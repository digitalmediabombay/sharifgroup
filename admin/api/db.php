<?php
/**
 * Sharif Group CMS - Database Connection & API Utility Core
 */

require_once __DIR__ . '/config.php';

// Set Standard JSON & CORS Headers
header('Content-Type: application/json; charset=utf-8');
// Use the request's own origin (same-origin only) — works on any domain/IP/cPanel temp URL
$allowedOrigin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
// Only allow if the origin matches our own host
$requestHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
if (!empty($allowedOrigin) && parse_url($allowedOrigin, PHP_URL_HOST) === $requestHost) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
} else {
    // Same-origin requests (no Origin header) are always fine — just don't set ACAO header
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Respond to preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Singleton Database Connection
 * @return PDO
 */
function getDb() {
    static $pdo = null;
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
        return $pdo;
    } catch (PDOException $e) {
        error_log('[SharifCMS DB Error] ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error'   => 'Database connection failed. Please verify DB_HOST, DB_NAME, DB_USER, and DB_PASS in admin/api/config.php.',
            'details' => $e->getMessage()
        ], 500);
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
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
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
        session_start();
    }
}

/**
 * Verify whether caller is an authenticated administrator
 */
function requireAdminAuth() {
    startSecureSession();
    if (!empty($_SESSION['sgcms_user'])) {
        return $_SESSION['sgcms_user'];
    }

    // Also support Bearer Token header or fallback demo token for API calls
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    
    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        if (!empty($_SESSION['sgcms_token']) && hash_equals($_SESSION['sgcms_token'], $token)) {
            return $_SESSION['sgcms_user'];
        }
    }

    // Unauthenticated
    jsonResponse([
        'success' => false,
        'error'   => 'Authentication required. Please log in to Sharif Group CMS.'
    ], 401);
}
