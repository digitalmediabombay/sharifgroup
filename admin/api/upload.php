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

// Target folder
$uploadDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique clean file name
$baseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$fileName = $baseName . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $fileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(['success' => false, 'error' => 'Failed to save uploaded file on server.'], 500);
}

$publicUrl = UPLOAD_URL_PREFIX . $fileName;

// Log to cms_media if table exists
try {
    $db = getDb();
    $stmt = $db->prepare("INSERT INTO cms_media (filename, filepath, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$fileName, $publicUrl, $ext, $file['size']]);
} catch (Exception $e) {
    // Non-fatal if media table isn't created yet
}

jsonResponse([
    'success'  => true,
    'url'      => $publicUrl,
    'filename' => $fileName,
    'size'     => $file['size']
]);
