<?php
/**
 * Sharif Group CMS - Authentication API
 * Handles Admin Login, Session Verification, and Logout
 */

require_once __DIR__ . '/db.php';

startSecureSession();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// ── LOGIN ──────────────────────────────────────────────────────────
if ($method === 'POST' && ($action === 'login' || empty($action))) {
    $body = getJsonBody();
    $email = isset($body['email']) ? trim(strtolower($body['email'])) : '';
    $password = isset($body['password']) ? trim($body['password']) : '';

    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'error' => 'Email and password are required.'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare("SELECT id, email, password_hash, name, role FROM cms_users WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    $authenticated = false;

    if ($user) {
        // Check BCrypt hash first
        if (password_verify($password, $user['password_hash'])) {
            $authenticated = true;
        } elseif ($password === 'SharifCMS@2026' && !str_starts_with($user['password_hash'], '$2y$')) {
            // Auto-heal: only allow default password if the stored hash is NOT yet a bcrypt hash
            $authenticated = true;
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $upd = $db->prepare("UPDATE cms_users SET password_hash = ? WHERE id = ?");
            $upd->execute([$newHash, $user['id']]);
        }
    } else {
        // Fallback for initial default admin before SQL import or if user deleted
        if ($email === 'admin@sharifgroup.ae' && $password === 'SharifCMS@2026') {
            $authenticated = true;
            $user = [
                'id'    => 1,
                'email' => 'admin@sharifgroup.ae',
                'name'  => 'Sharif Group Administrator',
                'role'  => 'Admin'
            ];
            // Insert admin into database if missing
            try {
                $ins = $db->prepare("INSERT INTO cms_users (email, password_hash, name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)");
                $ins->execute([$email, password_hash($password, PASSWORD_BCRYPT), $user['name'], $user['role']]);
            } catch (Exception $e) {}
        }
    }

    if ($authenticated) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['sgcms_user'] = [
            'id'    => $user['id'],
            'email' => $user['email'],
            'name'  => $user['name'],
            'role'  => $user['role']
        ];
        $_SESSION['sgcms_token'] = $token;

        jsonResponse([
            'success' => true,
            'message' => 'Authentication successful.',
            'token'   => $token,
            'user'    => $_SESSION['sgcms_user']
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'error'   => 'Invalid email or password.'
        ], 401);
    }
}

// ── SESSION STATUS ────────────────────────────────────────────────
if ($method === 'GET' && $action === 'status') {
    if (!empty($_SESSION['sgcms_user'])) {
        jsonResponse([
            'authenticated' => true,
            'user'          => $_SESSION['sgcms_user']
        ]);
    } else {
        jsonResponse([
            'authenticated' => false
        ]);
    }
}

// ── LOGOUT ────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    jsonResponse([
        'success' => true,
        'message' => 'Successfully logged out.'
    ]);
}

jsonResponse(['error' => 'Endpoint action not supported.'], 404);
