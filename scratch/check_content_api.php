<?php
$output = shell_exec('php -r "$_SERVER[\'REQUEST_METHOD\']=\'GET\'; $_GET[\'mode\']=\'draft\'; include \'admin/api/content.php\';"');
$j = json_decode($output, true);
$blogs = $j['data']['sgcms_blog'] ?? [];
foreach ($blogs as $b) {
    if ($b['id'] === 'bid-izo738') {
        echo "Found bid-izo738 in content.php output!\n";
        echo "AR Title: " . $b['ar']['title'] . "\n";
        echo "AR Body len: " . strlen($b['ar']['body'] ?? '') . "\n";
    }
}
