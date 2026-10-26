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

// Support multiple input field names ('file', 'image', 'upload')
$file = !empty($_FILES['file']) ? $_FILES['file'] 
      : (!empty($_FILES['image']) ? $_FILES['image'] 
      : (!empty($_FILES['upload']) ? $_FILES['upload'] : null));

if (!$file) {
    jsonResponse(['success' => false, 'error' => 'No file uploaded. Please select an image file.'], 400);
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    $errMap = [
        UPLOAD_ERR_INI_SIZE   => 'Uploaded file exceeds upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'Uploaded file exceeds MAX_FILE_SIZE directive in form.',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on server.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.'
    ];
    $msg = $errMap[$file['error']] ?? ('Upload error code: ' . $file['error']);
    jsonResponse(['success' => false, 'error' => $msg], 400);
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
if (!is_writable($uploadDir)) {
    @chmod($uploadDir, 0777);
}

// Generate unique clean file name base
$baseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$timestamp = time();

// Auto-compress and convert raster images to lightweight WebP
$rasterExts = ['jpg', 'jpeg', 'png', 'webp'];
$finalFileName = $baseName . '_' . $timestamp . '.' . $ext;
$targetPath = $uploadDir . $finalFileName;
$finalSize = $file['size'];
$savedSuccessfully = false;

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
            $savedSuccessfully = @imagewebp($dstImg, $targetPath, 80);
            $ext = 'webp';
        } else {
            $finalFileName = $baseName . '_' . $timestamp . '.jpg';
            $targetPath = $uploadDir . $finalFileName;
            imageinterlace($dstImg, 1);
            $savedSuccessfully = @imagejpeg($dstImg, $targetPath, 82);
            $ext = 'jpg';
        }
        imagedestroy($dstImg);
    }
}

// Fallback if GD was not used or GD save failed
if (!$savedSuccessfully || !file_exists($targetPath) || @filesize($targetPath) === 0) {
    $finalFileName = $baseName . '_' . $timestamp . '.' . strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $targetPath = $uploadDir . $finalFileName;
    if (!@move_uploaded_file($file['tmp_name'], $targetPath)) {
        if (!@copy($file['tmp_name'], $targetPath)) {
            jsonResponse([
                'success' => false, 
                'error'   => 'Failed to save uploaded file to ' . $uploadDir . '. Please check directory permissions (chmod 755 or 777).'
            ], 500);
        }
    }
}

@chmod($targetPath, 0666);
$finalSize = @filesize($targetPath) ?: $file['size'];
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
    'file'     => [
        'url'      => $publicUrl,
        'filename' => $finalFileName,
        'size'     => $finalSize
    ],
    'filename' => $finalFileName,
    'size'     => $finalSize
]);
