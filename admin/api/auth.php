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
                $chk = $db->prepare("SELECT id FROM cms_users WHERE LOWER(email) = ? LIMIT 1");
                $chk->execute([$email]);
                $r = $chk->fetch();
                if ($r && !empty($r['id'])) {
                    $user['id'] = (int)$r['id'];
                }
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

        // Persist to server token cache so fastcgi / multi-process cPanel sessions never drop
        saveCachedToken($token, $_SESSION['sgcms_user']);

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

// ── CHANGE PASSWORD / EMAIL ───────────────────────────────────────
if ($method === 'POST' && $action === 'change_password') {
    // Must be logged in
    if (empty($_SESSION['sgcms_user'])) {
        jsonResponse(['success' => false, 'error' => 'Not authenticated.'], 401);
    }

    $body        = getJsonBody();
    $currentPass = isset($body['current_password']) ? trim($body['current_password']) : '';
    $newEmail    = isset($body['new_email'])    ? trim(strtolower($body['new_email'])) : '';
    $newPass     = isset($body['new_password']) ? trim($body['new_password']) : '';

    if (empty($currentPass)) {
        jsonResponse(['success' => false, 'error' => 'Current password is required.'], 400);
    }

    $userId    = $_SESSION['sgcms_user']['id'] ?? null;
    $sessEmail = strtolower($_SESSION['sgcms_user']['email'] ?? '');
    $db        = getDb();

    // Fetch current user from DB by ID or fallback to email
    $user = null;
    if ($userId) {
        $stmt = $db->prepare("SELECT id, password_hash, email FROM cms_users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
    }
    if (!$user && !empty($sessEmail)) {
        $stmt = $db->prepare("SELECT id, password_hash, email FROM cms_users WHERE LOWER(email) = ? LIMIT 1");
        $stmt->execute([$sessEmail]);
        $user = $stmt->fetch();
        if ($user) {
            $userId = (int)$user['id'];
            $_SESSION['sgcms_user']['id'] = $userId;
        }
    }

    $validPass = false;
    if ($user) {
        if (password_verify($currentPass, $user['password_hash'])) {
            $validPass = true;
        } elseif ($currentPass === 'SharifCMS@2026' && !str_starts_with($user['password_hash'], '$2y$')) {
            $validPass = true;
        } elseif ($user['password_hash'] === $currentPass) {
            $validPass = true;
        }
    }

    if (!$validPass) {
        jsonResponse(['success' => false, 'error' => 'Current password is incorrect.'], 403);
    }

    // Build update fields
    $fields = [];
    $params = [];

    if (!empty($newEmail)) {
        // Check email not taken by another user
        $chk = $db->prepare("SELECT id FROM cms_users WHERE LOWER(email) = ? AND id != ? LIMIT 1");
        $chk->execute([$newEmail, $userId]);
        if ($chk->fetch()) {
            jsonResponse(['success' => false, 'error' => 'That email is already in use.'], 409);
        }
        $fields[] = 'email = ?';
        $params[] = $newEmail;
    }

    if (!empty($newPass)) {
        if (strlen($newPass) < 8) {
            jsonResponse(['success' => false, 'error' => 'New password must be at least 8 characters.'], 400);
        }
        $fields[] = 'password_hash = ?';
        $params[] = password_hash($newPass, PASSWORD_BCRYPT);
    }

    if (empty($fields)) {
        jsonResponse(['success' => false, 'error' => 'No changes provided.'], 400);
    }

    $params[] = $userId;
    $upd = $db->prepare("UPDATE cms_users SET " . implode(', ', $fields) . " WHERE id = ?");
    $upd->execute($params);

    // Update session so new email is reflected immediately
    if (!empty($newEmail)) {
        $_SESSION['sgcms_user']['email'] = $newEmail;
    }

    jsonResponse(['success' => true, 'message' => 'Credentials updated successfully.']);
}

jsonResponse(['error' => 'Endpoint action not supported.'], 404);
