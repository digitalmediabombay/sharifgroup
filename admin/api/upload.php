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

// Generate unique clean file name base
$baseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$timestamp = time();

// Auto-compress and convert raster images to lightweight WebP
$rasterExts = ['jpg', 'jpeg', 'png', 'webp'];
$finalFileName = $baseName . '_' . $timestamp . '.' . $ext;
$targetPath = $uploadDir . $finalFileName;
$finalSize = $file['size'];

if (in_array($ext, $rasterExts, true) && extension_loaded('gd') && function_exists('imagecreatefromstring')) {
    $imgData = @file_get_contents($file['tmp_name']);
    $srcImg = $imgData ? @imagecreatefromstring($imgData) : null;
    if ($srcImg) {
        $origW = imagesx($srcImg);
        $origH = imagesy($srcImg);

        // Retina quality max dimensions: 1400 x 900
        $maxW = 1400;
        $maxH = 900;
        $targetW = $origW;
        $targetH = $origH;

        if ($origW > $maxW || $origH > $maxH) {
            $ratio = min($maxW / $origW, $maxH / $origH);
            $targetW = (int)round($origW * $ratio);
            $targetH = (int)round($origH * $ratio);
        }

        $dstImg = imagecreatetruecolor($targetW, $targetH);
        imagealphablending($dstImg, false);
        imagesavealpha($dstImg, true);
        $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
        imagefilledrectangle($dstImg, 0, 0, $targetW, $targetH, $transparent);
        imagealphablending($dstImg, true);

        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $targetW, $targetH, $origW, $origH);
        imagedestroy($srcImg);

        // Save as WebP if supported, otherwise progressive JPEG
        if (function_exists('imagewebp')) {
            $finalFileName = $baseName . '_' . $timestamp . '.webp';
            $targetPath = $uploadDir . $finalFileName;
            imagewebp($dstImg, $targetPath, 80);
            $ext = 'webp';
        } else {
            $finalFileName = $baseName . '_' . $timestamp . '.jpg';
            $targetPath = $uploadDir . $finalFileName;
            imageinterlace($dstImg, 1);
            imagejpeg($dstImg, $targetPath, 82);
            $ext = 'jpg';
        }
        imagedestroy($dstImg);
        $finalSize = @filesize($targetPath) ?: $file['size'];
    } else {
        if (!@move_uploaded_file($file['tmp_name'], $targetPath)) {
            @copy($file['tmp_name'], $targetPath);
        }
    }
} else {
    // Non-raster file (SVG, PDF) or GD not available
    if (!@move_uploaded_file($file['tmp_name'], $targetPath)) {
        if (!@copy($file['tmp_name'], $targetPath)) {
            jsonResponse(['success' => false, 'error' => 'Failed to save uploaded file on server. Check folder permissions.'], 500);
        }
    }
}
@chmod($targetPath, 0666);

$publicUrl = UPLOAD_URL_PREFIX . $finalFileName;

// Log to cms_media if table exists
try {
    $db = getDb(true);
    if ($db) {
        $stmt = $db->prepare("INSERT INTO cms_media (filename, filepath, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$finalFileName, $publicUrl, $ext, $finalSize]);
    }
} catch (Exception $e) {
    // Non-fatal if media table isn't created yet
}

jsonResponse([
    'success'  => true,
    'url'      => $publicUrl,
    'filename' => $finalFileName,
    'size'     => $finalSize
]);
