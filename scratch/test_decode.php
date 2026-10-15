<?php
$mojibakeZh = "æ¬¢è¿Žæ ¥åˆ°è°¢é‡Œå¤«é›†å›¢";
$decodedZh = mb_convert_encoding($mojibakeZh, 'ISO-8859-1', 'UTF-8');
echo "ZH: " . $decodedZh . "\n";

$mojibakeFa = "Ø²Ù†Ø¯Ú¯ÛŒ Ø®ÙˆØ¯ Ø±Ø§ Ø§Ø±ØªÙ‚Ø§ Ø¯Ù‡ÛŒØ¯";
$decodedFa = mb_convert_encoding($mojibakeFa, 'Windows-1252', 'UTF-8');
echo "FA (1252): " . $decodedFa . "\n";

$decodedFaIso = mb_convert_encoding($mojibakeFa, 'ISO-8859-1', 'UTF-8');
echo "FA (ISO): " . $decodedFaIso . "\n";
