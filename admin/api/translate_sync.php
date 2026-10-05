<?php
/**
 * Sharif Group CMS - Server-Side Automatic Translation & Change Detection Engine
 * 
 * Automatically detects what content changed in English and translates only the
 * modified fields into Arabic (ar), Farsi (fa), and Chinese (zh).
 * Works seamlessly with zero-config Google Translate (dict-chrome-ex / at) or AI keys.
 */

if (!function_exists('translateTextServer')) {

    /**
     * Cache translations within the request to prevent duplicate network calls
     */
    $GLOBALS['_cms_translation_cache'] = [];

    /**
     * Translates text from source language to target language
     * 
     * @param string $text
     * @param string $targetLang  ar|fa|zh
     * @param string $sourceLang  en
     * @return string
     */
    function translateTextServer($text, $targetLang = 'ar', $sourceLang = 'en') {
        if (!is_scalar($text)) {
            return '';
        }
        $text = trim((string)$text);
        if ($text === '') {
            return '';
        }
        if ($targetLang === $sourceLang) {
            return $text;
        }

        $cacheKey = md5($sourceLang . '_' . $targetLang . '_' . $text);
        if (isset($GLOBALS['_cms_translation_cache'][$cacheKey])) {
            return $GLOBALS['_cms_translation_cache'][$cacheKey];
        }

        // Try AI providers first if configured in settings
        $translated = null;
        $aiSettings = getAiCredentials();
        if (!empty($aiSettings['key'])) {
            try {
                if ($aiSettings['provider'] === 'openrouter') {
                    $res = callOpenRouterTranslate($aiSettings['key'], $text, $targetLang, $sourceLang);
                    if ($res && !empty($res['content'])) {
                        $translated = trim($res['content']);
                    }
                } elseif ($aiSettings['provider'] === 'gemini') {
                    $res = callGeminiTranslate($aiSettings['key'], $text, $targetLang, $sourceLang);
                    if ($res && !empty($res['content'])) {
                        $translated = trim($res['content']);
                    }
                }
            } catch (Exception $e) {
                // Fallback to Google Translate
            }
        }

        // Sanitize incoming text before translation
        $cleanSource = str_replace(['\\u0026amp;', '&amp;', 'ΓÇô', 'ΓÇó', '\\u0027', '\\\"'], ['&', '&', '–', '•', "'", '"'], $text);

        // Fallback: Free Google Translate service (official Chrome client, zero rate-limit 429)
        if (empty($translated)) {
            $translated = callGoogleGtxTranslate($cleanSource, $targetLang, $sourceLang);
        }

        // Final safety fallback: return original text if translation failed
        if (empty($translated)) {
            $translated = $cleanSource;
        }

        if (!empty($translated) && is_string($translated)) {
            $translated = str_replace(['\\u0026amp;', '&amp;', 'ΓÇô', 'ΓÇó', '\\u0027', '\\\"'], ['&', '&', '–', '•', "'", '"'], $translated);
            $translated = html_entity_decode($translated, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $translated = trim($translated);
        }

        $GLOBALS['_cms_translation_cache'][$cacheKey] = $translated;
        return $translated;
    }

    /**
     * Free Google Translate HTTP endpoint using official dict-chrome-ex / at client
     */
    function callGoogleGtxTranslate($text, $targetLang, $sourceLang = 'en') {
        $cleanTarget = strtolower($targetLang);
        if ($cleanTarget === 'fa') {
            $cleanTarget = 'fa';
        } elseif ($cleanTarget === 'zh') {
            $cleanTarget = 'zh-CN';
        }

        $clients = ['dict-chrome-ex', 'at'];
        foreach ($clients as $client) {
            $url = 'https://translate.googleapis.com/translate_a/single?client=' . urlencode($client) . '&sl=' . urlencode($sourceLang) . '&tl=' . urlencode($cleanTarget) . '&dt=t&q=' . urlencode($text);

            $response = null;
            $httpCode = 0;

            if (function_exists('curl_init')) {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 8);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            } else {
                $ctx = stream_context_create([
                    'http' => [
                        'timeout' => 8,
                        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ]);
                $response = @file_get_contents($url, false, $ctx);
                if ($response !== false) {
                    $httpCode = 200;
                }
            }

            if ($httpCode === 200 && !empty($response)) {
                $data = json_decode($response, true);
                if (is_array($data) && isset($data[0]) && is_array($data[0])) {
                    $result = '';
                    foreach ($data[0] as $segment) {
                        if (is_array($segment) && isset($segment[0])) {
                            $result .= $segment[0];
                        }
                    }
                    if ($result !== '') {
                        return $result;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Retrieve AI configuration from database if available
     */
    function getAiCredentials() {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $cached = ['provider' => '', 'key' => ''];
        try {
            if (function_exists('getDb')) {
                $db = getDb();
                if ($db) {
                    $stmt = $db->prepare("SELECT draft_data FROM cms_content WHERE content_key = 'sgcms_settings' LIMIT 1");
                    $stmt->execute();
                    $row = $stmt->fetch();
                    if ($row && !empty($row['draft_data'])) {
                        $settings = json_decode($row['draft_data'], true);
                        if (!empty($settings['openrouter_api_key'])) {
                            $cached['provider'] = 'openrouter';
                            $cached['key'] = trim($settings['openrouter_api_key']);
                        } elseif (!empty($settings['gemini_api_key'])) {
                            $cached['provider'] = 'gemini';
                            $cached['key'] = trim($settings['gemini_api_key']);
                        }
                    }
                }
            }
        } catch (Exception $e) {}

        return $cached;
    }

    /**
     * Call OpenRouter API for translation
     */
    function callOpenRouterTranslate($apiKey, $text, $targetLang, $sourceLang) {
        $langNames = ['en' => 'English', 'ar' => 'Arabic', 'fa' => 'Farsi (Persian)', 'zh' => 'Chinese'];
        $tName = isset($langNames[$targetLang]) ? $langNames[$targetLang] : $targetLang;
        $sName = isset($langNames[$sourceLang]) ? $langNames[$sourceLang] : $sourceLang;
        $prompt = "You are a professional luxury translator for Sharif Group, Dubai. Translate from {$sName} to {$tName}. Formal, premium advisory tone. Return ONLY the translated text.\n\nText:\n" . $text;

        $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'openrouter/free',
            'messages' => [['role' => 'user', 'content' => $prompt]]
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'HTTP-Referer: https://sharifgroup.ae'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($code === 200 && $res) {
            $data = json_decode($res, true);
            $content = $data['choices'][0]['message']['content'] ?? null;
            if ($content) return ['content' => trim($content)];
        }
        return null;
    }

    /**
     * Call Gemini API for translation
     */
    function callGeminiTranslate($apiKey, $text, $targetLang, $sourceLang) {
        $langNames = ['en' => 'English', 'ar' => 'Arabic', 'fa' => 'Farsi (Persian)', 'zh' => 'Chinese'];
        $tName = isset($langNames[$targetLang]) ? $langNames[$targetLang] : $targetLang;
        $sName = isset($langNames[$sourceLang]) ? $langNames[$sourceLang] : $sourceLang;
        $prompt = "You are a professional luxury translator for Sharif Group, Dubai. Translate from {$sName} to {$tName}. Formal, premium advisory tone. Return ONLY the translated text.\n\nText:\n" . $text;

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]]
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($code === 200 && $res) {
            $data = json_decode($res, true);
            $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($content) return ['content' => trim($content)];
        }
        return null;
    }

    function isMojibake($str) {
        if (!is_string($str) || trim($str) === '') return false;
        return preg_match('/[\x{2500}-\x{259F}\x{FFFD}]|ΓÇô|ΓÇó|u0026amp;/u', $str) === 1;
    }

    /**
     * Checks if a string has actual Arabic/Persian/Chinese characters
     */
    function hasNonLatinChars($str) {
        if (!is_string($str) || trim($str) === '') return false;
        return preg_match('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}\x{4E00}-\x{9FFF}]/u', $str) === 1;
    }

    /**
     * Evaluates if a given string requires translation
     */
    function shouldTranslateField($newEn, $oldEn, $currTarget, $targetLang) {
        if (!is_scalar($newEn) || is_bool($newEn)) return false;
        $newEn = trim((string)$newEn);
        if ($newEn === '') return false;

        // Skip non-translatable values: URLs, file paths, phone, numbers, image links
        if (preg_match('~^(https?://|/|\.\./|#|mailto:|tel:|\+?[0-9\s\-()]+$|[a-z0-9_\-\.\/]+\.(webp|jpg|jpeg|png|svg|ico|pdf|html|mp4))$~i', $newEn)) {
            return false;
        }
        if (preg_match('~^(fa-|fa[srbld]\s)~i', $newEn)) {
            return false;
        }

        $currTarget = (!is_scalar($currTarget) || is_bool($currTarget)) ? '' : trim((string)$currTarget);
        $oldEn = (!is_scalar($oldEn) || is_bool($oldEn)) ? '' : trim((string)$oldEn);

        // 1. Missing or corrupted target
        if ($currTarget === '' || isMojibake($currTarget)) {
            return true;
        }

        // 2. English text changed vs old version
        if ($oldEn !== '' && $newEn !== $oldEn) {
            return true;
        }

        // 3. Target language contains English text (legacy untranslated fallback)
        if ($targetLang !== 'en' && strlen($newEn) > 3) {
            $hasNonLatin = hasNonLatinChars($currTarget);
            $isAscii = (bool)preg_match('~^[A-Za-z0-9\s.,:;!?\'"()&/\-]+$~', $currTarget);
            if (!$hasNonLatin && $isAscii) {
                return true;
            }
        }

        return false;
    }

    /**
     * Helper to translate a single field inside target langs
     */
    function syncSingleField(&$container, $field, $newEn, $oldEn = '') {
        $newEn = trim((string)$newEn);
        if ($newEn === '') return;

        $targetLangs = ['ar', 'fa', 'zh'];
        foreach ($targetLangs as $lang) {
            if (!isset($container[$lang]) || !is_array($container[$lang])) {
                $container[$lang] = [];
            }
            $currVal = $container[$lang][$field] ?? '';
            if (shouldTranslateField($newEn, $oldEn, $currVal, $lang)) {
                $trans = translateTextServer($newEn, $lang, 'en');
                if (!empty($trans)) {
                    $container[$lang][$field] = $trans;
                }
            }
        }
    }

    /**
     * MAIN ENGINE: Detects what changed in English and auto-translates only modified parts
     * 
     * @param string $contentKey e.g. 'sgcms_homepage', 'sgcms_citizenship'
     * @param mixed &$newData   Incoming data to be saved or published
     * @param mixed $oldData    Existing data in database or snapshot
     */
    function autoTranslateChangedData($contentKey, &$newData, $oldData = null) {
        if (!is_array($newData)) {
            return;
        }

        $targetLangs = ['ar', 'fa', 'zh'];

        // ══════════════════════════════════════════════════════════════
        // 1. HOMEPAGE (sgcms_homepage)
        // ══════════════════════════════════════════════════════════════
        if ($contentKey === 'sgcms_homepage') {
            // A. Hero
            $heroEn = $newData['hero']['en'] ?? ($newData['hero'] ?? []);
            $oldHeroEn = $oldData['hero']['en'] ?? ($oldData['hero'] ?? []);
            $heroFields = [
                'tagline', 'headline', 'subheadline',
                'cta_primary', 'cta_secondary',
                'pathway_citizenship', 'pathway_residency',
                'pathway_realestate', 'pathway_education'
            ];

            foreach ($targetLangs as $lang) {
                if (!isset($newData['hero'][$lang]) || !is_array($newData['hero'][$lang])) {
                    $newData['hero'][$lang] = [];
                }
                foreach ($heroFields as $field) {
                    $newVal = trim((string)($heroEn[$field] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldHeroEn[$field] ?? ''));
                    $currVal = trim((string)($newData['hero'][$lang][$field] ?? ''));

                    if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                        $trans = translateTextServer($newVal, $lang, 'en');
                        if (!empty($trans)) $newData['hero'][$lang][$field] = $trans;
                    }
                }
                if (isset($heroEn['cta_primary_link'])) $newData['hero'][$lang]['cta_primary_link'] = $heroEn['cta_primary_link'];
                if (isset($heroEn['cta_secondary_link'])) $newData['hero'][$lang]['cta_secondary_link'] = $heroEn['cta_secondary_link'];
            }

            // B. About section
            $aboutEn = $newData['about']['en'] ?? ($newData['about'] ?? []);
            $oldAboutEn = $oldData['about']['en'] ?? ($oldData['about'] ?? []);
            $aboutFields = ['badge', 'heading', 'subheading', 'p1', 'p2', 'btn1_text', 'btn2_text'];

            foreach ($targetLangs as $lang) {
                if (!isset($newData['about'][$lang]) || !is_array($newData['about'][$lang])) {
                    $newData['about'][$lang] = [];
                }
                foreach ($aboutFields as $field) {
                    $newVal = trim((string)($aboutEn[$field] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldAboutEn[$field] ?? ''));
                    $currVal = trim((string)($newData['about'][$lang][$field] ?? ''));

                    if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                        $trans = translateTextServer($newVal, $lang, 'en');
                        if (!empty($trans)) $newData['about'][$lang][$field] = $trans;
                    }
                }
                if (isset($aboutEn['btn1_link'])) $newData['about'][$lang]['btn1_link'] = $aboutEn['btn1_link'];
                if (isset($aboutEn['btn2_link'])) $newData['about'][$lang]['btn2_link'] = $aboutEn['btn2_link'];
            }

            // C. Stats
            if (isset($newData['stats']) && is_array($newData['stats'])) {
                foreach ($newData['stats'] as $i => &$stat) {
                    $labelEn = trim((string)($stat['label_en'] ?? ''));
                    if ($labelEn === '') continue;
                    $oldStat = $oldData['stats'][$i] ?? [];
                    $oldLabelEn = trim((string)($oldStat['label_en'] ?? ''));

                    foreach ($targetLangs as $lang) {
                        $targetKey = 'label_' . $lang;
                        $currVal = trim((string)($stat[$targetKey] ?? ''));
                        if (shouldTranslateField($labelEn, $oldLabelEn, $currVal, $lang)) {
                            $trans = translateTextServer($labelEn, $lang, 'en');
                            if (!empty($trans)) $stat[$targetKey] = $trans;
                        }
                    }
                }
                unset($stat);
            }

            // D. Services & Pillars
            if (isset($newData['services']) && is_array($newData['services'])) {
                $srvEn = $newData['services']['en'] ?? $newData['services'];
                $oldSrvEn = $oldData['services']['en'] ?? ($oldData['services'] ?? []);
                $srvFields = ['badge', 'heading', 'heading_italic', 'description'];

                foreach ($targetLangs as $lang) {
                    if (!isset($newData['services'][$lang]) || !is_array($newData['services'][$lang])) {
                        $newData['services'][$lang] = [];
                    }
                    foreach ($srvFields as $f) {
                        $newVal = trim((string)($srvEn[$f] ?? ''));
                        if ($newVal === '') continue;
                        $oldVal = trim((string)($oldSrvEn[$f] ?? ''));
                        $currVal = trim((string)($newData['services'][$lang][$f] ?? ''));
                        if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                            $trans = translateTextServer($newVal, $lang, 'en');
                            if (!empty($trans)) $newData['services'][$lang][$f] = $trans;
                        }
                    }

                    // Pillars
                    $pillars = ['pillar_cbi', 'pillar_rbi', 'pillar_uae', 'pillar_realestate', 'pillar_education'];
                    foreach ($pillars as $pilKey) {
                        if (isset($srvEn[$pilKey]) && is_array($srvEn[$pilKey])) {
                            if (!isset($newData['services'][$lang][$pilKey]) || !is_array($newData['services'][$lang][$pilKey])) {
                                $newData['services'][$lang][$pilKey] = [];
                            }
                            $pilEn = $srvEn[$pilKey];
                            $oldPilEn = $oldSrvEn[$pilKey] ?? [];
                            foreach (['pillar_badge', 'title', 'p1', 'p2'] as $pf) {
                                $newVal = trim((string)($pilEn[$pf] ?? ''));
                                if ($newVal === '') continue;
                                $oldVal = trim((string)($oldPilEn[$pf] ?? ''));
                                $currVal = trim((string)($newData['services'][$lang][$pilKey][$pf] ?? ''));
                                if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                                    $trans = translateTextServer($newVal, $lang, 'en');
                                    if (!empty($trans)) $newData['services'][$lang][$pilKey][$pf] = $trans;
                                }
                            }
                        }
                    }
                }
            }

            // E. Social Responsibility
            if (isset($newData['social_responsibility']) && is_array($newData['social_responsibility'])) {
                $srEn = $newData['social_responsibility']['en'] ?? $newData['social_responsibility'];
                $oldSrEn = $oldData['social_responsibility']['en'] ?? ($oldData['social_responsibility'] ?? []);
                foreach ($targetLangs as $lang) {
                    if (!isset($newData['social_responsibility'][$lang]) || !is_array($newData['social_responsibility'][$lang])) {
                        $newData['social_responsibility'][$lang] = [];
                    }
                    foreach (['badge', 'heading', 'description', 'btn_text'] as $sf) {
                        $newVal = trim((string)($srEn[$sf] ?? ''));
                        if ($newVal === '') continue;
                        $oldVal = trim((string)($oldSrEn[$sf] ?? ''));
                        $currVal = trim((string)($newData['social_responsibility'][$lang][$sf] ?? ''));
                        if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                            $trans = translateTextServer($newVal, $lang, 'en');
                            if (!empty($trans)) $newData['social_responsibility'][$lang][$sf] = $trans;
                        }
                    }
                }
            }

            // F. Reviews
            if (isset($newData['reviews']) && is_array($newData['reviews'])) {
                $revEn = $newData['reviews']['en'] ?? $newData['reviews'];
                $oldRevEn = $oldData['reviews']['en'] ?? ($oldData['reviews'] ?? []);
                foreach ($targetLangs as $lang) {
                    if (!isset($newData['reviews'][$lang]) || !is_array($newData['reviews'][$lang])) {
                        $newData['reviews'][$lang] = [];
                    }
                    foreach (['badge', 'heading'] as $rf) {
                        $newVal = trim((string)($revEn[$rf] ?? ''));
                        if ($newVal === '') continue;
                        $oldVal = trim((string)($oldRevEn[$rf] ?? ''));
                        $currVal = trim((string)($newData['reviews'][$lang][$rf] ?? ''));
                        if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                            $trans = translateTextServer($newVal, $lang, 'en');
                            if (!empty($trans)) $newData['reviews'][$lang][$rf] = $trans;
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // 2. CITIZENSHIP & RESIDENCY PROGRAMS (sgcms_citizenship, sgcms_residency)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_citizenship' || $contentKey === 'sgcms_residency') {
            $progFields = [
                'title', 'hero_title', 'hero_subtitle', 'hero_tagline',
                'nav_label', 'overview_title', 'overview', 'overview_p1', 'overview_p2',
                'investment_title', 'investment_desc', 'who_can_apply_title', 'who_can_apply_desc',
                'docs_title', 'docs_desc', 'timeline_title', 'timeline_desc',
                'faq_title', 'faq_desc', 'consult_heading', 'consult_subheading', 'consult_btn_text'
            ];

            $oldMap = [];
            if (is_array($oldData)) {
                foreach ($oldData as $op) {
                    if (isset($op['id'])) $oldMap[$op['id']] = $op;
                }
            }

            foreach ($newData as &$prog) {
                if (!is_array($prog) || !isset($prog['id'])) continue;
                $pId = $prog['id'];
                $oldProg = $oldMap[$pId] ?? [];
                $enData = $prog['en'] ?? [];
                $oldEnData = $oldProg['en'] ?? [];

                foreach ($targetLangs as $lang) {
                    if (!isset($prog[$lang]) || !is_array($prog[$lang])) {
                        $prog[$lang] = [];
                    }

                    foreach ($progFields as $f) {
                        $newVal = trim((string)($enData[$f] ?? ''));
                        if ($newVal === '') continue;
                        $oldVal = trim((string)($oldEnData[$f] ?? ''));
                        $currVal = trim((string)($prog[$lang][$f] ?? ''));

                        if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                            $trans = translateTextServer($newVal, $lang, 'en');
                            if (!empty($trans)) $prog[$lang][$f] = $trans;
                        }
                    }

                    // Benefits
                    if (!empty($enData['benefits']) && is_array($enData['benefits'])) {
                        $oldBenefits = $oldEnData['benefits'] ?? [];
                        $currBenefits = $prog[$lang]['benefits'] ?? [];
                        if (empty($currBenefits) || count($currBenefits) !== count($enData['benefits']) || json_encode($enData['benefits']) !== json_encode($oldBenefits)) {
                            $transBen = [];
                            foreach ($enData['benefits'] as $b) {
                                $transBen[] = translateTextServer($b, $lang, 'en');
                            }
                            $prog[$lang]['benefits'] = $transBen;
                        }
                    }

                    // FAQs
                    if (!empty($enData['faqs']) && is_array($enData['faqs'])) {
                        $oldFaqs = $oldEnData['faqs'] ?? [];
                        $currFaqs = $prog[$lang]['faqs'] ?? [];
                        if (empty($currFaqs) || json_encode($enData['faqs']) !== json_encode($oldFaqs)) {
                            $translatedFaqs = [];
                            foreach ($enData['faqs'] as $faqItem) {
                                $translatedFaqs[] = [
                                    'q' => translateTextServer($faqItem['q'] ?? '', $lang, 'en'),
                                    'a' => translateTextServer($faqItem['a'] ?? '', $lang, 'en')
                                ];
                            }
                            $prog[$lang]['faqs'] = $translatedFaqs;
                        }
                    }
                }
            }
            unset($prog);
        }

        // ══════════════════════════════════════════════════════════════
        // 3. ABOUT US (sgcms_aboutus)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_aboutus') {
            $heroEn = $newData['hero']['en'] ?? ($newData['hero'] ?? []);
            $oldHeroEn = $oldData['hero']['en'] ?? ($oldData['hero'] ?? []);
            $overviewEn = $newData['overview']['en'] ?? ($newData['overview'] ?? []);
            $oldOverviewEn = $oldData['overview']['en'] ?? ($oldData['overview'] ?? []);

            foreach ($targetLangs as $lang) {
                if (!isset($newData['hero'][$lang])) $newData['hero'][$lang] = [];
                if (!isset($newData['overview'][$lang])) $newData['overview'][$lang] = [];

                foreach (['badge', 'title', 'subtitle'] as $f) {
                    $newVal = trim((string)($heroEn[$f] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldHeroEn[$f] ?? ''));
                    $currVal = trim((string)($newData['hero'][$lang][$f] ?? ''));
                    if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                        $trans = translateTextServer($newVal, $lang, 'en');
                        if (!empty($trans)) $newData['hero'][$lang][$f] = $trans;
                    }
                }

                foreach (['badge', 'heading', 'p1', 'p2'] as $f) {
                    $newVal = trim((string)($overviewEn[$f] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldOverviewEn[$f] ?? ''));
                    $currVal = trim((string)($newData['overview'][$lang][$f] ?? ''));
                    if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                        $trans = translateTextServer($newVal, $lang, 'en');
                        if (!empty($trans)) $newData['overview'][$lang][$f] = $trans;
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // 4. CONTACT (sgcms_contact)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_contact') {
            $ctEn = $newData['en'] ?? $newData;
            $oldCtEn = $oldData['en'] ?? ($oldData ?? []);
            foreach ($targetLangs as $lang) {
                if (!isset($newData[$lang]) || !is_array($newData[$lang])) {
                    $newData[$lang] = [];
                }
                foreach (['badge', 'heading', 'sub'] as $f) {
                    $newVal = trim((string)($ctEn[$f] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldCtEn[$f] ?? ''));
                    $currVal = trim((string)($newData[$lang][$f] ?? ''));
                    if (shouldTranslateField($newVal, $oldVal, $currVal, $lang)) {
                        $trans = translateTextServer($newVal, $lang, 'en');
                        if (!empty($trans)) $newData[$lang][$f] = $trans;
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // 5. DOM OVERRIDES (sgcms_dom_overrides)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_dom_overrides') {
            foreach ($newData as $pageSlug => &$pageLangs) {
                if (!is_array($pageLangs)) continue;
                $enOv = $pageLangs['en'] ?? [];
                if (!is_array($enOv) || empty($enOv)) continue;

                foreach ($targetLangs as $lang) {
                    if (!isset($pageLangs[$lang]) || !is_array($pageLangs[$lang])) {
                        $pageLangs[$lang] = [];
                    }
                    foreach ($enOv as $sel => $val) {
                        $enText = is_array($val) ? ($val['text'] ?? '') : (string)$val;
                        if (!trim($enText)) continue;
                        $currTarget = is_array($pageLangs[$lang][$sel] ?? null) ? ($pageLangs[$lang][$sel]['text'] ?? '') : ($pageLangs[$lang][$sel] ?? '');
                        if (shouldTranslateField($enText, '', $currTarget, $lang)) {
                            $trans = translateTextServer($enText, $lang, 'en');
                            if (!empty($trans)) {
                                if (is_array($val)) {
                                    $pageLangs[$lang][$sel] = array_merge($val, ['text' => $trans]);
                                } else {
                                    $pageLangs[$lang][$sel] = $trans;
                                }
                            }
                        }
                    }
                }
            }
            unset($pageLangs);
        }
    }

    /**
     * Complete Database & JSON Snapshot Sweep: Translates any remaining untranslated
     * English strings in Arabic, Farsi, and Chinese across all content keys.
     */
    function syncAllUntranslatedContent(&$snapshot) {
        if (!is_array($snapshot)) return 0;
        $keys = array_keys($snapshot);
        $translatedCount = 0;
        foreach ($keys as $k) {
            if ($k === 'sgcms_blog' || $k === 'sgcms_deleted_slugs' || $k === 'sgcms_settings') continue;
            autoTranslateChangedData($k, $snapshot[$k], null);
        }
        return count($keys);
    }
}
