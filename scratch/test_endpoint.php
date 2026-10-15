<?php
$output = shell_exec('php -r "$_SERVER[\'REQUEST_METHOD\']=\'GET\'; $_GET[\'mode\']=\'draft\'; include \'admin/api/content.php\';"');
$j = json_decode($output, true);
echo "Success: " . ($j['success'] ? 'true' : 'false') . "\n";
echo "Hero ZH: " . ($j['data']['sgcms_homepage']['hero']['zh']['headline'] ?? 'N/A') . "\n";
echo "Hero AR: " . ($j['data']['sgcms_homepage']['hero']['ar']['headline'] ?? 'N/A') . "\n";
echo "Hero FA: " . ($j['data']['sgcms_homepage']['hero']['fa']['headline'] ?? 'N/A') . "\n";
echo "About ZH: " . ($j['data']['sgcms_aboutus']['overview']['zh']['heading'] ?? 'N/A') . "\n";
