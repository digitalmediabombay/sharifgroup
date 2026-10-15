<?php
$output = shell_exec('php -r "$_SERVER[\'REQUEST_METHOD\']=\'GET\'; $_GET[\'mode\']=\'live\'; include \'admin/api/content.php\';"');
$j = json_decode($output, true);
echo "Live Success: " . ($j['success'] ? 'true' : 'false') . "\n";
echo "Live Hero ZH: " . ($j['data']['sgcms_homepage']['hero']['zh']['headline'] ?? 'N/A') . "\n";
echo "Live Hero AR: " . ($j['data']['sgcms_homepage']['hero']['ar']['headline'] ?? 'N/A') . "\n";
echo "Live Hero FA: " . ($j['data']['sgcms_homepage']['hero']['fa']['headline'] ?? 'N/A') . "\n";
echo "Live About ZH: " . ($j['data']['sgcms_aboutus']['overview']['zh']['heading'] ?? 'N/A') . "\n";
