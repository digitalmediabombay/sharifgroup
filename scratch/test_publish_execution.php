<?php
$rootDir = realpath(__DIR__ . '/..');

// Simulate POST to publish.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ACCEPT'] = 'application/json';

// Create a valid publish payload
$samplePayload = [
    'version' => '3.0.0',
    'publisher' => 'Admin User',
    'publishedAt' => date('Y-m-d H:i:s'),
    'data' => [
        'sgcms_settings' => [
            'site_name' => 'Sharif Group'
        ]
    ]
];

file_put_contents(__DIR__ . '/mock_input.json', json_encode($samplePayload));

// Set up php://input override or test by running php with piped stdin
echo "Payload prepared.\n";
