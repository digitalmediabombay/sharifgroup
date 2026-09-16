<?php
/**
 * Sharif Group CMS - OpenRouter AI & Gemini Translation Backend API
 * Handles server-side AI translation for Arabic, Farsi, and Chinese
 */

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed. Only POST is accepted.'], 405);
}

startSecureSession();
$action = isset($_GET['action']) ? trim($_GET['action']) : 'translate';
$body = getJsonBody();

$provider = isset($body['provider']) ? trim(strtolower($body['provider'])) : 'openrouter'; // 'openrouter' or 'gemini'
$apiKey = isset($body['api_key']) ? $body['api_key'] : '';
$apiKey = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $apiKey);
$apiKey = preg_replace('/^Bearer\s+/i', '', $apiKey);
$apiKey = trim($apiKey, " \t\n\r\0\x0B\"'`");
$model = isset($body['model']) ? trim($body['model']) : 'google/gemini-2.0-flash-001';

// If API key not passed in request body, attempt to read from database settings
if (empty($apiKey)) {
    try {
        $db = getDb();
        $stmt = $db->prepare("SELECT draft_data FROM cms_content WHERE content_key = 'sgcms_settings' LIMIT 1");
        $stmt->execute();
        $settingsRow = $stmt->fetch();
        if ($settingsRow && !empty($settingsRow['draft_data'])) {
            $settings = json_decode($settingsRow['draft_data'], true);
            if (!empty($settings['openrouter_api_key'])) {
                $apiKey = $settings['openrouter_api_key'];
                $provider = 'openrouter';
            } elseif (!empty($settings['gemini_api_key'])) {
                $apiKey = $settings['gemini_api_key'];
                $provider = 'gemini';
            }
        }
    } catch (Exception $e) {}
}

if (empty($apiKey)) {
    jsonResponse([
        'success' => false,
        'error'   => 'No AI API Key provided. Please configure OpenRouter or Gemini API key in CMS Settings.'
    ], 400);
}

// ── TEST KEY ACTION ───────────────────────────────────────────────
if ($action === 'test') {
    if ($provider === 'openrouter') {
        // Direct key authentication check (zero credits required)
        $ch = curl_init('https://openrouter.ai/api/v1/auth/key');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code === 200) {
            $data = json_decode($res, true);
            jsonResponse(['success' => true, 'data' => $data['data'] ?? null]);
        }
        if ($code === 401 || $code === 403) {
            $data = json_decode($res, true);
            jsonResponse(['success' => false, 'error' => $data['error']['message'] ?? 'Invalid OpenRouter API Key'], 401);
        }

        $testResult = callOpenRouter($apiKey, 'Say "OK" in one word.', 'meta-llama/llama-3.3-70b-instruct:free');
        if (!$testResult['success']) {
            $testResult = callOpenRouter($apiKey, 'Say "OK" in one word.', 'google/gemini-2.0-flash-001');
        }
        jsonResponse($testResult);
    } else {
        $testResult = callGemini($apiKey, 'Say "OK" in one word.');
        jsonResponse($testResult);
    }
}

// ── TRANSLATE ACTION ──────────────────────────────────────────────
if ($action === 'translate') {
    $text = isset($body['text']) ? trim($body['text']) : '';
    $targetLang = isset($body['targetLang']) ? trim(strtolower($body['targetLang'])) : 'ar';
    $sourceLang = isset($body['sourceLang']) ? trim(strtolower($body['sourceLang'])) : 'en';

    if (empty($text)) {
        jsonResponse(['success' => true, 'translated' => '']);
    }

    $langMap = [
        'en' => 'English',
        'ar' => 'Arabic',
        'fa' => 'Farsi (Persian)',
        'zh' => 'Chinese (Simplified)'
    ];

    $targetName = isset($langMap[$targetLang]) ? $langMap[$targetLang] : $targetLang;
    $sourceName = isset($langMap[$sourceLang]) ? $langMap[$sourceLang] : $sourceLang;

    $prompt = "You are a professional luxury translator for a premier investment migration, second citizenship, and residency advisory firm (Sharif Group, Dubai). Translate the following text from {$sourceName} to {$targetName}. Maintain an ultra-premium, formal, high-end advisory tone suitable for high-net-worth investors. Return ONLY the translation, with no explanation or conversational filler.\n\nText:\n" . $text;

    if ($provider === 'openrouter') {
        $res = callOpenRouter($apiKey, $prompt, $model);
    } else {
        $res = callGemini($apiKey, $prompt);
    }

    if ($res['success']) {
        jsonResponse([
            'success'    => true,
            'translated' => $res['content'],
            'targetLang' => $targetLang,
            'provider'   => $provider
        ]);
    } else {
        jsonResponse([
            'success'  => false,
            'error'    => $res['error'],
            'provider' => $provider
        ], 500);
    }
}

// ── CURL HELPER FOR OPENROUTER ────────────────────────────────────
function callOpenRouter($apiKey, $prompt, $model = 'google/gemini-2.0-flash-001') {
    $url = 'https://openrouter.ai/api/v1/chat/completions';

    $modelsToTry = array_unique([
        $model,
        'google/gemini-2.0-flash-001',
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free'
    ]);

    $lastError = 'OpenRouter request failed';

    foreach ($modelsToTry as $currentModel) {
        $payload = [
            'model' => $currentModel,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.3
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'HTTP-Referer: https://sharifgroup.ae',
            'X-Title: Sharif Group CMS Studio'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            $lastError = 'cURL Error: ' . $err;
            continue;
        }

        $data = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && !empty($data['choices'][0]['message']['content'])) {
            return [
                'success' => true,
                'content' => trim($data['choices'][0]['message']['content']),
                'model'   => $currentModel
            ];
        }

        $lastError = isset($data['error']['message']) ? $data['error']['message'] : ('HTTP ' . $httpCode . ': ' . $response);
    }

    return ['success' => false, 'error' => $lastError];
}

// ── CURL HELPER FOR GEMINI ────────────────────────────────────────
function callGemini($apiKey, $prompt, $requestedModel = 'gemini-2.0-flash') {
    // If the key starts with sk- (sk-or- or OpenAI sk-), automatically route to OpenRouter
    if (strpos($apiKey, 'sk-') === 0) {
        return callOpenRouter($apiKey, $prompt);
    }

    $modelsToTry = array_unique([
        $requestedModel,
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.5-flash',
        'gemini-1.5-pro'
    ]);

    $lastError = 'Google Gemini request failed';

    foreach ($modelsToTry as $model) {
        foreach (['v1beta', 'v1'] as $apiVersion) {
            $url = "https://generativelanguage.googleapis.com/{$apiVersion}/models/{$model}:generateContent?key=" . urlencode($apiKey);

            $payload = [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $apiKey
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);

            if ($err) {
                $lastError = 'cURL Error: ' . $err;
                continue;
            }

            $data = json_decode($response, true);
            if ($httpCode >= 200 && $httpCode < 300 && !empty($data['candidates'][0]['content']['parts'][0]['text'])) {
                return [
                    'success' => true,
                    'content' => trim($data['candidates'][0]['content']['parts'][0]['text']),
                    'model'   => $model,
                    'version' => $apiVersion
                ];
            }

            if (isset($data['error']['message'])) {
                $lastError = $data['error']['message'];
                // If API key is fundamentally invalid, stop trying other versions
                if (stripos($lastError, 'API key not valid') !== false || stripos($lastError, 'API_KEY_INVALID') !== false) {
                    return ['success' => false, 'error' => $lastError];
                }
            } else {
                $lastError = 'HTTP ' . $httpCode . ': ' . $response;
            }
        }
    }

    return ['success' => false, 'error' => $lastError];
}

jsonResponse(['error' => 'Invalid action.'], 404);
