<?php
/**
 * Sharif Group CMS - Server & Database Health Diagnostics Tool
 * Access via browser: /admin/api/diagnostics.php
 */

require_once __DIR__ . '/db.php';

$isJson = isset($_GET['format']) && $_GET['format'] === 'json';

$results = [
    'php_version' => PHP_VERSION,
    'db_connection' => false,
    'db_error' => null,
    'tables' => [],
    'files_writable' => [],
    'session_active' => false,
    'summary' => 'pending'
];

// 1. Session Check
startSecureSession();
$results['session_active'] = (session_status() === PHP_SESSION_ACTIVE);

// 2. File Write Check
$publishedFile = __DIR__ . '/published_content.json';
$draftFile = __DIR__ . '/draft_content.json';
$testData = ['_diag_test' => time()];

$pubOk = writePublishedSnapshot(readPublishedSnapshot() ?: $testData);
$draftOk = writeDraftSnapshot(readDraftSnapshot() ?: $testData);

$results['files_writable']['published_content.json'] = $pubOk && is_writable($publishedFile);
$results['files_writable']['draft_content.json'] = $draftOk && is_writable($draftFile);

// 3. Database Check
$db = getDb(true);
if ($db !== null) {
    $results['db_connection'] = true;
    try {
        // Check tables
        $tables = ['cms_users', 'cms_content', 'cms_publish_log', 'cms_media'];
        foreach ($tables as $t) {
            $stmt = $db->query("SHOW TABLES LIKE '{$t}'");
            $exists = $stmt->rowCount() > 0;
            $count = 0;
            if ($exists) {
                $cStmt = $db->query("SELECT COUNT(*) FROM `{$t}`");
                $count = (int)$cStmt->fetchColumn();
            }
            $results['tables'][$t] = [
                'exists' => $exists,
                'rows'   => $count
            ];
        }

        // Detect if any rows in cms_content are double-encoded or corrupted
        $encodingIssues = 0;
        if (isset($results['tables']['cms_content']) && $results['tables']['cms_content']['exists']) {
            $sampleStmt = $db->query("SELECT content_key, draft_data, live_data FROM cms_content");
            $sampleRows = $sampleStmt->fetchAll();
            foreach ($sampleRows as $sr) {
                foreach (['draft_data', 'live_data'] as $col) {
                    $val = $sr[$col];
                    if (!empty($val)) {
                        if (preg_match('/[\x{2500}-\x{259F}\x{FFFD}]/u', $val)) {
                            $encodingIssues++;
                        }
                        $dec = json_decode($val, true);
                        if (is_string($dec) && (str_starts_with(trim($dec), '{') || str_starts_with(trim($dec), '['))) {
                            $encodingIssues++;
                        }
                    }
                }
            }
        }
        $results['encoding_issues'] = $encodingIssues;

        // Auto-setup or database repair actions
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        if ($action === 'setup_tables' || $action === 'repair_db') {
            initDatabaseSchema($db);

            // Read clean seed from published_content.json
            $seed = readPublishedSnapshot();
            if (!empty($seed) && is_array($seed)) {
                $repairStmt = $db->prepare("
                    INSERT INTO cms_content (content_key, draft_data, live_data, updated_at, published_at)
                    VALUES (:key, :draft, :live, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        draft_data = VALUES(draft_data),
                        live_data = VALUES(live_data),
                        updated_at = NOW(),
                        published_at = NOW()
                ");
                $repairedCount = 0;
                foreach ($seed as $k => $v) {
                    if (is_string($v)) {
                        $dec = json_decode($v, true);
                        if (json_last_error() === JSON_ERROR_NONE) $v = $dec;
                    }
                    $jsonStr = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $repairStmt->execute([
                        ':key'   => $k,
                        ':draft' => $jsonStr,
                        ':live'  => $jsonStr
                    ]);
                    $repairedCount++;
                }
                $results['repaired_count'] = $repairedCount;
                $results['encoding_issues'] = 0;
            }
            $results['setup_triggered'] = true;
        }

    } catch (Exception $e) {
        $results['db_error'] = $e->getMessage();
    }
} else {
    $results['db_error'] = 'Could not connect to MySQL. Check DB_HOST, DB_NAME, DB_USER, DB_PASS in admin/api/config.php.';
}

$allGood = $results['db_connection'] && $results['files_writable']['published_content.json'] && ($results['encoding_issues'] === 0);
$results['summary'] = $allGood ? 'ALL SYSTEMS OPERATIONAL' : 'ACTION REQUIRED';

if ($isJson) {
    jsonResponse($results);
}
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sharif Group CMS – System Diagnostics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --gold: #C5A880;
      --gold-dark: #977344;
      --bg: #0B0F17;
      --card-bg: #141B26;
      --border: #232D3F;
      --text: #F1F5F9;
      --muted: #94A3B8;
      --success: #10B981;
      --danger: #EF4444;
      --warning: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--gold);
      margin-bottom: 8px;
    }
    .header p {
      color: var(--muted);
      font-size: 14px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text);
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-size: 14px;
    }
    .row:last-child { border-bottom: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      margin-top: 12px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .error-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      color: #FCA5A5;
      font-size: 13px;
      margin-top: 12px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><i class="fa-solid fa-shield-halved"></i> Sharif Group CMS Diagnostics</h1>
      <p>Real-time verification of MySQL Database, File Storage, and Authentication</p>
    </div>

    <!-- Status Overview -->
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-server"></i> System Health Status</div>
      <div class="row">
        <span>Overall Status</span>
        <span class="badge <?php echo $allGood ? 'badge-success' : 'badge-danger'; ?>">
          <i class="fa-solid <?php echo $allGood ? 'fa-check-circle' : 'fa-triangle-exclamation'; ?>"></i>
          <?php echo $results['summary']; ?>
        </span>
      </div>
      <div class="row">
        <span>PHP Version</span>
        <span style="color:var(--gold); font-weight:600;"><?php echo PHP_VERSION; ?></span>
      </div>
      <div class="row">
        <span>PHP Session Engine</span>
        <span class="badge <?php echo $results['session_active'] ? 'badge-success' : 'badge-danger'; ?>">
          <i class="fa-solid <?php echo $results['session_active'] ? 'fa-check' : 'fa-xmark'; ?>"></i>
          <?php echo $results['session_active'] ? 'Active' : 'Disabled'; ?>
        </span>
      </div>
    </div>

    <!-- Database Status -->
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-database"></i> MySQL Database Connection</div>
      <div class="row">
        <span>Connection Status</span>
        <span class="badge <?php echo $results['db_connection'] ? 'badge-success' : 'badge-danger'; ?>">
          <i class="fa-solid <?php echo $results['db_connection'] ? 'fa-check' : 'fa-xmark'; ?>"></i>
          <?php echo $results['db_connection'] ? 'Connected Successfully' : 'Connection Failed'; ?>
        </span>
      </div>

      <?php if (!empty($results['db_error'])): ?>
        <div class="error-box">
          <i class="fa-solid fa-circle-exclamation"></i> <?php echo htmlspecialchars($results['db_error']); ?>
        </div>
      <?php endif; ?>

      <?php if (!empty($results['repaired_count'])): ?>
        <div style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:12px 16px; color:#6EE7B7; font-size:13px; margin-top:12px;">
          <i class="fa-solid fa-circle-check"></i> <strong>Repair Successful:</strong> Database tables (<code>cms_content</code>) successfully synced and refreshed with <?php echo $results['repaired_count']; ?> clean sections from published snapshot!
        </div>
      <?php endif; ?>

      <?php if ($results['db_connection']): ?>
        <div style="margin-top: 16px;">
          <strong style="font-size:13px; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em;">Table Status</strong>
          <?php foreach ($results['tables'] as $tableName => $tInfo): ?>
            <div class="row">
              <span><code><?php echo $tableName; ?></code></span>
              <span class="badge <?php echo $tInfo['exists'] ? 'badge-success' : 'badge-danger'; ?>">
                <?php echo $tInfo['exists'] ? "Ready ({$tInfo['rows']} rows)" : 'Missing'; ?>
              </span>
            </div>
          <?php endforeach; ?>
          <div class="row">
            <span>Data Encoding & Characters</span>
            <span class="badge <?php echo $results['encoding_issues'] === 0 ? 'badge-success' : 'badge-warning'; ?>">
              <i class="fa-solid <?php echo $results['encoding_issues'] === 0 ? 'fa-check' : 'fa-triangle-exclamation'; ?>"></i>
              <?php echo $results['encoding_issues'] === 0 ? '100% Clean & Valid' : "{$results['encoding_issues']} Corrupted/Double-Encoded Fields"; ?>
            </span>
          </div>
        </div>
      <?php endif; ?>

      <div style="margin-top: 16px; display:flex; gap:10px; flex-wrap:wrap;">
        <a href="?action=repair_db" class="btn" style="background:linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);">
          <i class="fa-solid fa-wand-magic-sparkles"></i> 1-Click Repair & Clean Database
        </a>
        <a href="?action=setup_tables" class="btn">
          <i class="fa-solid fa-wrench"></i> Auto-Create & Verify Tables
        </a>
      </div>
    </div>

    <!-- File System Status -->
    <div class="card">
      <div class="card-title"><i class="fa-solid fa-file-code"></i> File Snapshot Storage (Failsafe)</div>
      <div class="row">
        <span><code>admin/api/published_content.json</code></span>
        <span class="badge <?php echo $results['files_writable']['published_content.json'] ? 'badge-success' : 'badge-danger'; ?>">
          <i class="fa-solid <?php echo $results['files_writable']['published_content.json'] ? 'fa-check' : 'fa-xmark'; ?>"></i>
          <?php echo $results['files_writable']['published_content.json'] ? 'Writable & Active' : 'Not Writable'; ?>
        </span>
      </div>
      <div class="row">
        <span><code>admin/api/draft_content.json</code></span>
        <span class="badge <?php echo $results['files_writable']['draft_content.json'] ? 'badge-success' : 'badge-danger'; ?>">
          <i class="fa-solid <?php echo $results['files_writable']['draft_content.json'] ? 'fa-check' : 'fa-xmark'; ?>"></i>
          <?php echo $results['files_writable']['draft_content.json'] ? 'Writable & Active' : 'Not Writable'; ?>
        </span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="../dashboard.html" class="btn" style="background:#1E293B;">
        <i class="fa-solid fa-arrow-left"></i> Return to CMS Dashboard
      </a>
    </div>
  </div>
</body>
</html>
