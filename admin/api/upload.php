<?php
/**
 * Sharif Group CMS - Media & Image Upload API
 * Safely handles images for Programs, Blogs, Logos, and Banners
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
requireAdminAuth();

if (empty($_FILES['file'])) {
    jsonResponse(['success' => false, 'error' => 'No file uploaded.'], 400);
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'error' => 'Upload error code: ' . $file['error']], 400);
}

if ($file['size'] > MAX_UPLOAD_SIZE) {
    jsonResponse(['success' => false, 'error' => 'File exceeds 15MB size limit.'], 400);
}

// Allowed extensions & mime types
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'pdf'];
$origName = $file['name'];
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExtensions, true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid file extension. Allowed: jpg, png, webp, svg, pdf.'], 400);
}

// Verify actual MIME type if fileinfo is available
$allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf'];
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mimeType, $allowedMimes, true)) {
        jsonResponse(['success' => false, 'error' => 'Invalid file content detected.'], 400);
    }
} elseif (function_exists('mime_content_type')) {
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowedMimes, true)) {
        jsonResponse(['success' => false, 'error' => 'Invalid file content detected.'], 400);
    }
}

// Target folder
$uploadDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}

// Generate unique clean file name
$baseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$fileName = $baseName . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $fileName;

if (!@move_uploaded_file($file['tmp_name'], $targetPath)) {
    if (!@copy($file['tmp_name'], $targetPath)) {
        jsonResponse(['success' => false, 'error' => 'Failed to save uploaded file on server. Check folder permissions.'], 500);
    }
}
@chmod($targetPath, 0666);

$publicUrl = UPLOAD_URL_PREFIX . $fileName;

// Log to cms_media if table exists
try {
    $db = getDb(true);
    if ($db) {
        $stmt = $db->prepare("INSERT INTO cms_media (filename, filepath, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$fileName, $publicUrl, $ext, $file['size']]);
    }
} catch (Exception $e) {
    // Non-fatal if media table isn't created yet
}

jsonResponse([
    'success'  => true,
    'url'      => $publicUrl,
    'filename' => $fileName,
    'size'     => $file['size']
]);
