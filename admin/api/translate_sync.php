<?php
/**
 * Sharif Group CMS - Server-Side Automatic Translation & Change Detection Engine
 * 
 * Automatically detects what content changed in English and translates only the
 * modified fields into Arabic (ar), Farsi (fa), and Chinese (zh).
 * Works seamlessly with OpenRouter, Gemini, or zero-config Google Translate fallback.
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
                // Fallback to Google GTX
            }
        }

        // Fallback: Free Google Translate GTX service (always available, ultra-fast, no key required)
        if (empty($translated)) {
            $translated = callGoogleGtxTranslate($text, $targetLang, $sourceLang);
        }

        // Final safety fallback: return original text if translation failed
        if (empty($translated)) {
            $translated = $text;
        }

        $GLOBALS['_cms_translation_cache'][$cacheKey] = $translated;
        return $translated;
    }

    /**
     * Free Google Translate GTX HTTP endpoint
     */
    function callGoogleGtxTranslate($text, $targetLang, $sourceLang = 'en') {
        $cleanTarget = strtolower($targetLang);
        if ($cleanTarget === 'fa') {
            $cleanTarget = 'fa';
        } elseif ($cleanTarget === 'zh') {
            $cleanTarget = 'zh-CN';
        }

        $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' . urlencode($sourceLang) . '&tl=' . urlencode($cleanTarget) . '&dt=t&q=' . urlencode($text);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

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
        return null;
    }

    /**
     * Retrieve AI configuration from database
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
        curl_close($ch);

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
        curl_close($ch);

        if ($code === 200 && $res) {
            $data = json_decode($res, true);
            $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($content) return ['content' => trim($content)];
        }
        return null;
    }

    /**
     * Checks if a string has actual Arabic/Persian/Chinese characters
     */
    function hasNonLatinChars($str) {
        if (!is_string($str) || trim($str) === '') return false;
        // Arabic / Persian block: \x{0600}-\x{06FF}, Chinese: \x{4E00}-\x{9FFF}
        return preg_match('/[\x{0600}-\x{06FF}\x{4E00}-\x{9FFF}]/u', $str) === 1;
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
            $heroEn = $newData['hero']['en'] ?? [];
            $oldHeroEn = $oldData['hero']['en'] ?? [];

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
                    $currTargetVal = trim((string)($newData['hero'][$lang][$field] ?? ''));

                    // Trigger translation if:
                    // 1. English text changed vs old database text, OR
                    // 2. Target language text is empty/missing, OR
                    // 3. Target language text is identical to English (untranslated) AND it's not a proper name
                    $needsTranslate = ($oldVal !== '' && $newVal !== $oldVal)
                        || ($currTargetVal === '')
                        || ($currTargetVal === $newVal && strlen($newVal) > 4 && !hasNonLatinChars($currTargetVal));

                    if ($needsTranslate) {
                        $translated = translateTextServer($newVal, $lang, 'en');
                        if (!empty($translated)) {
                            $newData['hero'][$lang][$field] = $translated;
                        }
                    }
                }

                // Preserve links
                if (isset($heroEn['cta_primary_link'])) $newData['hero'][$lang]['cta_primary_link'] = $heroEn['cta_primary_link'];
                if (isset($heroEn['cta_secondary_link'])) $newData['hero'][$lang]['cta_secondary_link'] = $heroEn['cta_secondary_link'];
            }

            // About section
            $aboutEn = $newData['about']['en'] ?? [];
            $oldAboutEn = $oldData['about']['en'] ?? [];
            $aboutFields = ['badge', 'heading', 'subheading', 'p1', 'p2', 'btn1_text', 'btn2_text'];

            foreach ($targetLangs as $lang) {
                if (!isset($newData['about'][$lang]) || !is_array($newData['about'][$lang])) {
                    $newData['about'][$lang] = [];
                }

                foreach ($aboutFields as $field) {
                    $newVal = trim((string)($aboutEn[$field] ?? ''));
                    if ($newVal === '') continue;

                    $oldVal = trim((string)($oldAboutEn[$field] ?? ''));
                    $currTargetVal = trim((string)($newData['about'][$lang][$field] ?? ''));

                    $needsTranslate = ($oldVal !== '' && $newVal !== $oldVal)
                        || ($currTargetVal === '')
                        || ($currTargetVal === $newVal && strlen($newVal) > 4 && !hasNonLatinChars($currTargetVal));

                    if ($needsTranslate) {
                        $translated = translateTextServer($newVal, $lang, 'en');
                        if (!empty($translated)) {
                            $newData['about'][$lang][$field] = $translated;
                        }
                    }
                }

                if (isset($aboutEn['btn1_link'])) $newData['about'][$lang]['btn1_link'] = $aboutEn['btn1_link'];
                if (isset($aboutEn['btn2_link'])) $newData['about'][$lang]['btn2_link'] = $aboutEn['btn2_link'];
            }

            // Stats
            if (isset($newData['stats']) && is_array($newData['stats'])) {
                foreach ($newData['stats'] as $i => &$stat) {
                    $labelEn = trim((string)($stat['label_en'] ?? $stat['label_en'] ?? ''));
                    if ($labelEn === '') continue;

                    $oldStat = $oldData['stats'][$i] ?? [];
                    $oldLabelEn = trim((string)($oldStat['label_en'] ?? ''));

                    foreach ($targetLangs as $lang) {
                        $targetKey = 'label_' . $lang;
                        $currVal = trim((string)($stat[$targetKey] ?? ''));

                        $needsTranslate = ($oldLabelEn !== '' && $labelEn !== $oldLabelEn)
                            || ($currVal === '')
                            || ($currVal === $labelEn && !hasNonLatinChars($currVal));

                        if ($needsTranslate) {
                            $trans = translateTextServer($labelEn, $lang, 'en');
                            if (!empty($trans)) {
                                $stat[$targetKey] = $trans;
                            }
                        }
                    }
                }
                unset($stat);
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

                        $needsTranslate = ($oldVal !== '' && $newVal !== $oldVal)
                            || ($currVal === '')
                            || ($currVal === $newVal && strlen($newVal) > 4 && !hasNonLatinChars($currVal));

                        if ($needsTranslate) {
                            $trans = translateTextServer($newVal, $lang, 'en');
                            if (!empty($trans)) {
                                $prog[$lang][$f] = $trans;
                            }
                        }
                    }

                    // Translate FAQs if modified
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
        // 3. BLOG (sgcms_blog)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_blog') {
            $oldMap = [];
            if (is_array($oldData)) {
                foreach ($oldData as $ob) {
                    $slug = $ob['slug'] ?? ($ob['id'] ?? '');
                    if ($slug) $oldMap[$slug] = $ob;
                }
            }

            foreach ($newData as &$post) {
                if (!is_array($post)) continue;
                $slug = $post['slug'] ?? ($post['id'] ?? '');
                $oldPost = $oldMap[$slug] ?? [];

                $enData = $post['en'] ?? $post;
                $oldEnData = $oldPost['en'] ?? $oldPost;

                foreach ($targetLangs as $lang) {
                    if (!isset($post[$lang]) || !is_array($post[$lang])) {
                        $post[$lang] = [];
                    }

                    $fields = ['title', 'excerpt'];
                    foreach ($fields as $f) {
                        $newVal = trim((string)($enData[$f] ?? ''));
                        if ($newVal === '') continue;

                        $oldVal = trim((string)($oldEnData[$f] ?? ''));
                        $currVal = trim((string)($post[$lang][$f] ?? ''));

                        if (($oldVal !== '' && $newVal !== $oldVal) || $currVal === '' || ($currVal === $newVal && !hasNonLatinChars($currVal))) {
                            $post[$lang][$f] = translateTextServer($newVal, $lang, 'en');
                        }
                    }

                    // Body translation if changed and not excessively huge
                    $newBody = trim((string)($enData['body'] ?? ''));
                    $oldBody = trim((string)($oldEnData['body'] ?? ''));
                    $currBody = trim((string)($post[$lang]['body'] ?? ''));
                    if ($newBody !== '' && (($oldBody !== '' && $newBody !== $oldBody) || $currBody === '')) {
                        if (strlen($newBody) < 8000) {
                            $post[$lang]['body'] = translateTextServer($newBody, $lang, 'en');
                        }
                    }
                }
            }
            unset($post);
        }

        // ══════════════════════════════════════════════════════════════
        // 4. ABOUT US (sgcms_aboutus)
        // ══════════════════════════════════════════════════════════════
        elseif ($contentKey === 'sgcms_aboutus') {
            $heroEn = $newData['hero']['en'] ?? [];
            $oldHeroEn = $oldData['hero']['en'] ?? [];
            $overviewEn = $newData['overview']['en'] ?? [];
            $oldOverviewEn = $oldData['overview']['en'] ?? [];

            foreach ($targetLangs as $lang) {
                if (!isset($newData['hero'][$lang])) $newData['hero'][$lang] = [];
                if (!isset($newData['overview'][$lang])) $newData['overview'][$lang] = [];

                foreach (['title', 'subtitle'] as $f) {
                    $newVal = trim((string)($heroEn[$f] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldHeroEn[$f] ?? ''));
                    $currVal = trim((string)($newData['hero'][$lang][$f] ?? ''));
                    if (($oldVal !== '' && $newVal !== $oldVal) || $currVal === '' || ($currVal === $newVal && !hasNonLatinChars($currVal))) {
                        $newData['hero'][$lang][$f] = translateTextServer($newVal, $lang, 'en');
                    }
                }

                foreach (['badge', 'heading', 'p1', 'p2'] as $f) {
                    $newVal = trim((string)($overviewEn[$f] ?? ''));
                    if ($newVal === '') continue;
                    $oldVal = trim((string)($oldOverviewEn[$f] ?? ''));
                    $currVal = trim((string)($newData['overview'][$lang][$f] ?? ''));
                    if (($oldVal !== '' && $newVal !== $oldVal) || $currVal === '' || ($currVal === $newVal && !hasNonLatinChars($currVal))) {
                        $newData['overview'][$lang][$f] = translateTextServer($newVal, $lang, 'en');
                    }
                }
            }
        }
    }
}
