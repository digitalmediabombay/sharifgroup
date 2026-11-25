<?php
/**
 * Sharif Group CMS - Blog Listing Pre-Renderer & Static Article Generator (SSG Engine)
 * 
 * Re-generates static HTML blog listing cards across all 4 language versions:
 *  - English: blog/index.html
 *  - Arabic:  ar/blog/index.html
 *  - Farsi:   fa/blog/index.html
 *  - Chinese: zh/blog/index.html
 * 
 * Generates standalone pre-rendered physical article pages:
 *  - English: blog/<slug>/index.html
 *  - Arabic:  ar/blog/<slug>/index.html
 *  - Farsi:   fa/blog/<slug>/index.html
 *  - Chinese: zh/blog/<slug>/index.html
 * 
 * Features:
 *  - 100% pre-rendered authentic canonical 12 FAQs for every language version
 *  - Fully localized FAQ headers ("Program Integrity & FAQs" -> Chinese / Arabic / Farsi)
 *  - Automatic multi-language translation synchronization (Google GTX / AI)
 *  - Zero layout shift, zero redirect delays, full SEO & AEO accessibility
 */

require_once __DIR__ . '/translate_sync.php';

if (!function_exists('isMojibakeString')) {
    function isMojibakeString($raw) {
        if (!is_string($raw) || trim($raw) === '') return false;
        if (strpos($raw, '????') !== false) return true;
        if (preg_match('/[\x{2500}-\x{259F}\x{FFFD}]|ΓÇ[ôöòóõô–•]|u0026amp;/u', $raw)) return true;
        if (preg_match('/[ØÙ][\x80-\xFF]/', $raw) && !preg_match('/[\x{0600}-\x{06FF}]/u', $raw)) return true;
        if (preg_match('/(?:æ[•™\x80-\xFF]|è[‚²¯¢¿Ž°\x80-\xFF]|å[’¨ˆ°«\x80-\xFF]|ç[º»\x80-\xFF]|é[\x80-\xFF]|ä[\x80-\xFF])/', $raw) && !preg_match('/[\x{4E00}-\x{9FFF}]/u', $raw)) return true;
        if (preg_match('/[äåæçèéêëìíîï][\x{0080}-\x{00FF}\x{201A}-\x{2026}\x{2018}-\x{201D}\x{2122}\x{0152}\x{0153}\x{0160}\x{0161}\x{0178}\x{017E}\x{02C6}\x{02DC}]/u', $raw) && !preg_match('/[\x{4E00}-\x{9FFF}]/u', $raw)) return true;
        if (preg_match('/(?:O\s*U,|AE\+|[A-Za-z]\s*[¿Ž°ˆ¬¢]|A["”][A-Za-z"”]+)/', $raw)) return true;
        return false;
    }
}

if (!function_exists('mapCategoryToDataCat')) {
    function mapCategoryToDataCat($cat, $subcat, $title = '', $slug = '') {
        $cat = strtolower((string)$cat);
        $subcat = strtolower((string)$subcat);
        $res = [];
        if (strpos($cat, 'citizen') !== false || strpos($subcat, 'citizen') !== false) $res[] = 'citizenship';
        if (strpos($cat, 'residen') !== false || strpos($subcat, 'residen') !== false) $res[] = 'residency';
        if (strpos($cat, 'golden') !== false || strpos($subcat, 'golden') !== false) $res[] = 'golden-visa';
        if (strpos($cat, 'estate') !== false || strpos($subcat, 'estate') !== false) $res[] = 'real-estate';
        if (strpos($cat, 'educat') !== false || strpos($subcat, 'educat') !== false) $res[] = 'educational';
        if (strpos($cat, 'company') !== false || strpos($cat, 'tax') !== false || strpos($subcat, 'company') !== false) $res[] = 'company';
        if (strpos($cat, 'sharif') !== false || strpos($subcat, 'sharif') !== false) $res[] = 'sharif';

        $knownSubs = [
            'dominica'   => 'dominica',
            'stkitts'    => 'st-kitts',
            'st-kitts'   => 'st-kitts',
            'antigua'    => 'antigua',
            'stlucia'    => 'saint-lucia',
            'saint-lucia'=> 'saint-lucia',
            'grenada'    => 'grenada',
            'vanuatu'    => 'vanuatu',
            'saotome'    => 'sao-tome',
            'sao-tome'   => 'sao-tome',
            'nauru'      => 'nauru',
            'portugal'   => 'portugal',
            'greece'     => 'greece',
            'panama'     => 'panama',
            'uae'        => 'uae'
        ];

        $titleLower = strtolower((string)$title);
        $slugLower = strtolower((string)$slug);
        foreach ($knownSubs as $pattern => $tag) {
            $spacePattern = str_replace('-', ' ', $pattern);
            if ($subcat === $pattern || strpos($subcat, $pattern) !== false || strpos($titleLower, $spacePattern) !== false || strpos($slugLower, $pattern) !== false) {
                if (!in_array($tag, $res)) $res[] = $tag;
                if (in_array($tag, ['dominica', 'st-kitts', 'antigua', 'saint-lucia', 'grenada', 'vanuatu', 'sao-tome', 'nauru'])) {
                    if (!in_array('citizenship', $res)) $res[] = 'citizenship';
                }
                if (in_array($tag, ['portugal', 'greece', 'panama', 'uae'])) {
                    if (!in_array('residency', $res)) $res[] = 'residency';
                }
            }
        }

        if (empty($res)) $res[] = 'citizenship';
        return implode(' ', array_unique($res));
    }
}

if (!function_exists('normalizeBlogImgUrl')) {
    function normalizeBlogImgUrl($url) {
        $u = trim((string)$url);
        if ($u === '') return '/assets/images/dubai-office-2.webp';
        if (preg_match('#^(https?:)?//#i', $u) || strpos($u, 'data:') === 0) return $u;
        $u = preg_replace('#^(\.\./)+#', '/', $u);
        if ($u[0] !== '/') $u = '/' . $u;
        return $u;
    }
}

if (!function_exists('ssgReplaceBetweenMarkers')) {
    /**
     * Replace a section bounded by exact start/end markers using byte offsets.
     * Avoids PCRE backtrack limits and `$` backreference corruption on large HTML payloads.
     */
    function ssgReplaceBetweenMarkers($html, $startMarker, $endMarker, $replacement) {
        $startPos = strpos($html, $startMarker);
        if ($startPos === false) {
            return ['found' => false, 'html' => $html];
        }
        $endPos = strpos($html, $endMarker, $startPos + strlen($startMarker));
        if ($endPos === false) {
            return ['found' => false, 'html' => $html];
        }
        $updated = substr($html, 0, $startPos) . $replacement . substr($html, $endPos + strlen($endMarker));
        return ['found' => true, 'html' => $updated];
    }
}

if (!function_exists('ssgPregReplaceLiteral')) {
    /**
     * Safe regex replacement treating $literalReplacement as a plain string
     * (prevents `$100` currency amounts from acting as backreferences and
     * never overwrites valid HTML with NULL if PCRE fails).
     */
    function ssgPregReplaceLiteral($pattern, $literalReplacement, $subject, $limit = -1) {
        if (!is_string($subject) || $subject === '') return $subject;
        $res = @preg_replace_callback($pattern, function() use ($literalReplacement) {
            return $literalReplacement;
        }, $subject, $limit);
        if (!is_string($res) || $res === '') {
            return $subject;
        }
        return $res;
    }
}

if (!function_exists('ssgPregReplaceCallbackSafe')) {
    function ssgPregReplaceCallbackSafe($pattern, $callback, $subject, $limit = -1) {
        if (!is_string($subject) || $subject === '') return $subject;
        $res = @preg_replace_callback($pattern, $callback, $subject, $limit);
        if (!is_string($res) || $res === '') {
            return $subject;
        }
        return $res;
    }
}

if (!function_exists('ssgPersistBase64Image')) {
    /**
     * Extracts a data:image/...;base64,... URI into a physical file under /assets/images/uploads/
     * (converting raster images to WebP via GD when available) and returns the root-relative URL.
     */
    function ssgPersistBase64Image($imgUrl, $slugHint = 'blog', $rootDir = null) {
        $u = trim((string)$imgUrl);
        if ($u === '' || stripos($u, 'data:image/') !== 0) {
            return $imgUrl;
        }

        $commaPos = strpos($u, ',');
        if ($commaPos === false) {
            return '/assets/images/dubai-office-2.webp';
        }

        $header = strtolower(substr($u, 0, $commaPos));
        if (strpos($header, ';base64') === false) {
            return '/assets/images/dubai-office-2.webp';
        }

        $mimePart = substr($header, 5); // strip "data:"
        $semiPos = strpos($mimePart, ';');
        $mime = $semiPos !== false ? substr($mimePart, 0, $semiPos) : $mimePart;

        $extMap = [
            'image/jpeg'    => 'jpg',
            'image/jpg'     => 'jpg',
            'image/png'     => 'png',
            'image/webp'    => 'webp',
            'image/gif'     => 'gif',
            'image/svg+xml' => 'svg'
        ];
        if (!isset($extMap[$mime])) {
            return '/assets/images/dubai-office-2.webp';
        }

        $b64 = substr($u, $commaPos + 1);
        $b64 = strtr($b64, [' ' => '+', "\r" => '', "\n" => '', "\t" => '']);
        $bytes = base64_decode($b64, true);
        if ($bytes === false) {
            $bytes = base64_decode($b64);
        }
        if (!is_string($bytes) || strlen($bytes) < 32) {
            return '/assets/images/dubai-office-2.webp';
        }

        $baseDir = ($rootDir && is_dir($rootDir)) ? rtrim($rootDir, '/\\') : realpath(dirname(__DIR__, 2));
        if (!$baseDir) {
            return '/assets/images/dubai-office-2.webp';
        }
        $uploadDir = $baseDir . '/assets/images/uploads';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
        }
        if (!is_dir($uploadDir) || !is_writable($uploadDir)) {
            return '/assets/images/dubai-office-2.webp';
        }

        $safeSlug = preg_replace('/[^a-z0-9_-]+/', '-', strtolower((string)$slugHint));
        $safeSlug = trim(substr($safeSlug ?: 'blog', 0, 40), '-');
        if ($safeSlug === '') $safeSlug = 'blog';
        $hash = substr(sha1($bytes), 0, 12);
        $prefix = 'blog_' . $safeSlug . '_' . $hash;

        // Try converting raster images to compact WebP via GD
        $ext = $extMap[$mime];
        if ($ext !== 'svg' && function_exists('imagecreatefromstring') && function_exists('imagewebp')) {
            $webpName = $prefix . '.webp';
            $webpPath = $uploadDir . '/' . $webpName;
            if (file_exists($webpPath) && filesize($webpPath) > 0) {
                return '/assets/images/uploads/' . $webpName;
            }
            $img = @imagecreatefromstring($bytes);
            if ($img !== false) {
                if (function_exists('imagepalettetotruecolor')) {
                    @imagepalettetotruecolor($img);
                }
                @imagealphablending($img, true);
                @imagesavealpha($img, true);
                $ok = @imagewebp($img, $webpPath, 86);
                @imagedestroy($img);
                if ($ok && file_exists($webpPath) && filesize($webpPath) > 0) {
                    return '/assets/images/uploads/' . $webpName;
                }
            }
        }

        $rawName = $prefix . '.' . $ext;
        $rawPath = $uploadDir . '/' . $rawName;
        if (file_exists($rawPath) && filesize($rawPath) > 0) {
            return '/assets/images/uploads/' . $rawName;
        }
        if (@file_put_contents($rawPath, $bytes, LOCK_EX) !== false && filesize($rawPath) > 0) {
            return '/assets/images/uploads/' . $rawName;
        }

        return '/assets/images/dubai-office-2.webp';
    }
}

if (!function_exists('ssgExtractBodyBase64Images')) {
    /**
     * Replaces any inline data:image/... URI inside HTML attributes with persisted files under /assets/images/uploads/.
     * Uses pure string offsets to avoid PCRE backtracking on megabyte strings.
     */
    function ssgExtractBodyBase64Images($html, $slugHint = 'blog', $rootDir = null) {
        if (!is_string($html) || stripos($html, 'data:image/') === false) {
            return $html;
        }
        $offset = 0;
        $idx = 0;
        while (($pos = stripos($html, 'data:image/', $offset)) !== false) {
            $quote = ($pos > 0) ? $html[$pos - 1] : '';
            if ($quote !== '"' && $quote !== "'") {
                $offset = $pos + 11;
                continue;
            }
            $endPos = strpos($html, $quote, $pos);
            if ($endPos === false) {
                break;
            }
            $dataUri = substr($html, $pos, $endPos - $pos);
            $idx++;
            $url = ssgPersistBase64Image($dataUri, $slugHint . '-inline-' . $idx, $rootDir);
            $html = substr($html, 0, $pos) . $url . substr($html, $endPos);
            $offset = $pos + strlen($url);
        }
        return $html;
    }
}

if (!function_exists('ssgSanitizeBlogItemMedia')) {
    /**
     * Converts any base64 featured_img / image / inline body images on a blog entry to file URLs
     * so JSON snapshots and pre-rendered HTML remain compact. Returns true if the item was modified.
     */
    function ssgSanitizeBlogItemMedia(&$b, $rootDir = null) {
        if (!is_array($b)) return false;
        $changed = false;
        $slugHint = trim((string)($b['slug'] ?? ($b['en']['slug'] ?? ($b['id'] ?? 'blog'))));

        $candidates = [
            $b['featured_img'] ?? '',
            $b['image'] ?? '',
            $b['en']['featured_img'] ?? '',
            $b['en']['image'] ?? '',
            $b['ar']['featured_img'] ?? '',
            $b['fa']['featured_img'] ?? '',
            $b['zh']['featured_img'] ?? ''
        ];
        $resolvedImg = '';
        foreach ($candidates as $cand) {
            $c = trim((string)$cand);
            if ($c !== '') {
                $resolvedImg = $c;
                break;
            }
        }

        if ($resolvedImg !== '' && stripos($resolvedImg, 'data:image/') === 0) {
            $resolvedImg = ssgPersistBase64Image($resolvedImg, $slugHint, $rootDir);
            $changed = true;
        }

        if ($resolvedImg !== '') {
            if (($b['featured_img'] ?? '') !== $resolvedImg) {
                $b['featured_img'] = $resolvedImg;
                $changed = true;
            }
            if (array_key_exists('image', $b) && $b['image'] !== $resolvedImg) {
                $b['image'] = $resolvedImg;
                $changed = true;
            }
            foreach (['en', 'ar', 'fa', 'zh'] as $lng) {
                if (isset($b[$lng]) && is_array($b[$lng])) {
                    if (array_key_exists('featured_img', $b[$lng]) && ($b[$lng]['featured_img'] !== $resolvedImg)) {
                        $b[$lng]['featured_img'] = $resolvedImg;
                        $changed = true;
                    }
                    if (array_key_exists('image', $b[$lng]) && ($b[$lng]['image'] !== $resolvedImg)) {
                        $b[$lng]['image'] = $resolvedImg;
                        $changed = true;
                    }
                }
            }
        }

        if (!empty($b['body']) && is_string($b['body']) && stripos($b['body'], 'data:image/') !== false) {
            $cleanBody = ssgExtractBodyBase64Images($b['body'], $slugHint, $rootDir);
            if ($cleanBody !== $b['body']) {
                $b['body'] = $cleanBody;
                $changed = true;
            }
        }
        foreach (['en', 'ar', 'fa', 'zh'] as $lng) {
            if (!empty($b[$lng]['body']) && is_string($b[$lng]['body']) && stripos($b[$lng]['body'], 'data:image/') !== false) {
                $cleanBody = ssgExtractBodyBase64Images($b[$lng]['body'], $slugHint . '-' . $lng, $rootDir);
                if ($cleanBody !== $b[$lng]['body']) {
                    $b[$lng]['body'] = $cleanBody;
                    $changed = true;
                }
            }
        }

        return $changed;
    }
}

/**
 * Global Sovereign Legal 12 Canonical FAQs for Each Language
 */
function getCanonicalBlogFaqs() {
    return [
        'en' => [
            ['q' => 'What are the sovereign eligibility criteria for this pathway?', 'a' => 'Applicants must possess a pristine background, pass strict multi-tier AML compliance, and fulfill the designated capital allocation.'],
            ['q' => 'Can immediate family and senior dependents be included?', 'a' => 'Yes. The principal investor may include their spouse, dependent children under 30, and dependent parents or grandparents above 55.'],
            ['q' => 'Is physical presence or relocation required in Dubai or the host state?', 'a' => 'No mandatory residency requirements apply during processing. All government vetting and apostilles are finalized remotely through our Dubai headquarters.'],
            ['q' => 'What are the processing timelines from submission to approval?', 'a' => 'Official government clearance is expedited under our legal protocol, typically taking between 60 to 90 business days.'],
            ['q' => 'How is confidential wealth and asset protection guaranteed?', 'a' => 'Sharif Group operates under strict non-disclosure legal mandates and international private client confidentiality standards.'],
            ['q' => 'What are the visa-free mobility advantages granted?', 'a' => 'Successful holders gain visa-free or visa-on-arrival access across key international business hubs, Schengen states, and Commonwealth jurisdictions.'],
            ['q' => 'Are taxes levied on worldwide income or capital gains?', 'a' => 'Most sovereign pathways feature territorial or zero tax regimes, shielding offshore income, dividends, and inherited assets from local taxation.'],
            ['q' => 'What official compliance and police clearances are needed?', 'a' => 'Applicants must supply certified police clearance certificates from their country of citizenship and any jurisdiction where they resided for over six months.'],
            ['q' => 'Is dual citizenship or multiple legal residency permitted?', 'a' => 'Yes. Most host jurisdictions legally recognize dual or multiple citizenships without requiring you to renounce your original passport.'],
            ['q' => 'How are government fees and investment funds held securely?', 'a' => 'All capital allocations are deposited into regulated sovereign escrow accounts or authorized central bank facilities under institutional oversight.'],
            ['q' => 'Can investment properties or capital assets be liquidated later?', 'a' => 'Depending on the statutory holding period (typically 3 to 5 years), qualifying real estate or bonds can be liquidated while retaining acquired sovereign rights.'],
            ['q' => 'How does Sharif Group represent investors through official channels?', 'a' => 'Sharif Group acts as an accredited advisory firm in Business Bay, Dubai, managing direct liaison, government apostilles, and expedited legal filing.']
        ],
        'ar' => [
            ['q' => 'ما هي معايير الأهلية السيادية لهذا المسار؟', 'a' => 'يجب أن يتمتع المتقدمون بسجل أمني وقانوني نظيف، واجتياز تدقيق مكافحة غسل الأموال، واستيفاء متطلبات التخصيص المالي المحددة.'],
            ['q' => 'هل يمكن تضمين أفراد الأسرة المباشرين والمعالين الأكبر سناً؟', 'a' => 'نعم، يمكن للمستثمر الرئيسي تضمين الزوج/الزوجة، والأبناء المعالين حتى سن 30 عاماً، والوالدين أو الأجداد المعالين فوق سن 55 عاماً.'],
            ['q' => 'هل يلزم التواجد الفعلي أو الانتقال للإقامة في دبي أو الدولة المضيفة؟', 'a' => 'لا توجد متطلبات إقامة إلزامية أثناء الإجراءات. يتم استكمال كافة الموافقات والتوثيقات الحكومية عن بُعد عبر مقرنا الرئيسي في دبي.'],
            ['q' => 'ما هي الجداول الزمنية المتوقعة من تقديم الطلب حتى الموافقة النهائية؟', 'a' => 'يتم تسريع استخراج الموافقات الرسمية بموجب بروتوكولنا القانوني المعتمد، وعادةً ما يستغرق ذلك ما بين 60 إلى 90 يوم عمل.'],
            ['q' => 'كيف يتم ضمان سرية وحماية الأصول والثروات العائلية؟', 'a' => 'تعمل مجموعة الشريف بموجب تفويضات قانونية صارمة لعدم الإفصاح ومعايير السرية الدولية المعتمدة لعملاء إدارة الثروات الخاصة.'],
            ['q' => 'ما هي مزايا حرية التنقل والسفر بدون تأشيرة الممنوحة؟', 'a' => 'يحصل حاملو الوثائق المعتمدة على إمكانية السفر بدون تأشيرة أو بتأشيرة عند الوصول إلى أبرز مراكز الأعمال الدولية، ودول الشنغن، ودول الكومنولث.'],
            ['q' => 'هل تُفرض ضرائب على الدخل العالمي أو الأرباح الرأسمالية؟', 'a' => 'تتميز معظم المسارات السيادية بأنظمة ضريبية إقليمية أو صفرية، مما يحمي الدخل الخارجي وتوزيعات الأرباح والأصول الموروثة من الضرائب المحلية.'],
            ['q' => 'ما هي الوثائق الأمنية والشهادات الجنائية المطلوبة للتقديم؟', 'a' => 'يجب على المتقدمين تقديم شهادات بحث الحالة الجنائية مصدقة وموثقة من بلد الجنسية ومن أي دولة أقاموا فيها لأكثر من ستة أشهر.'],
            ['q' => 'هل يُسمح بازدواج الجنسية أو الاحتفاظ بإقامات متعددة؟', 'a' => 'نعم، تعترف معظم الدول المضيفة قانوناً بازدواج أو تعدد الجنسيات دون اشتراط التخلي عن جواز السفر أو الجنسية الأصلية.'],
            ['q' => 'كيف يتم ضمان أمان الودائع وصناديق الاستثمار الحكومية؟', 'a' => 'يتم إيداع كافة الأموال في حسابات ضمان بنكية رسمية (Escrow) خاضعة لرقابة البنوك المركزية والجهات التنظيمية الحكومية المعتمدة.'],
            ['q' => 'هل يمكن إعادة بيع العقار الاستثماري أو تسييل الأصول لاحقاً؟', 'a' => 'وفقاً لمدة الاحتفاظ القانونية (عادة من 3 إلى 5 سنوات)، يمكن تسييل العقار أو استرداد السندات مع الاحتفاظ الكامل بالحقوق السيادية المكتسبة.'],
            ['q' => 'كيف تمثل مجموعة الشريف المستثمرين عبر القنوات الرسمية؟', 'a' => 'تعمل مجموعة الشريف كجهة استشارية معتمدة من الخليج التجاري بدبي، وتتولى التنسيق المباشر والتصديقات الحكومية والتقديم القانوني السريع.']
        ],
        'fa' => [
            ['q' => 'معیارهای صلاحیت قانونی و حاکمیتی برای این مسیر چیست؟', 'a' => 'متقاضیان باید دارای پیشینه کاملاً پاک، موفقیت در بررسی‌های چندمرحله‌ای ضدپولشویی و تأمین سرمایه‌گذاری مصوب باشند.'],
            ['q' => 'آیا امکان اضافه کردن اعضای درجه یک خانواده و وابستگان وجود دارد؟', 'a' => 'بله. سرمایه‌گذار اصلی می‌تواند همسر، فرزندان وابسته تا ۳۰ سال و والدین یا پدربزرگ و مادربزرگ وابسته بالای ۵۵ سال را اضافه نماید.'],
            ['q' => 'آیا حضور فیزیکی یا تغییر محل سکونت در دبی یا کشور مقصد الزامی است؟', 'a' => 'خیر، هیچ شرط اقامت اجباری در طول مراحل پرونده وجود ندارد. تمامی تأییدیه‌ها و آپوستیل‌ها به صورت غیرحضوری از طریق دفتر مرکزی ما در دبی انجام می‌شود.'],
            ['q' => 'جدول زمانی پردازش پرونده از ثبت تا تأیید نهایی چقدر است؟', 'a' => 'مراحل تأییدیه رسمی دولتی بر اساس پروتکل حقوقی ما تسریع شده و معمولاً بین ۶۰ تا ۹۰ روز کاری به طول می‌انجامد.'],
            ['q' => 'محرمانگی اطلاعات و حفاظت از ثروت و دارایی‌ها چگونه تضمین می‌شود؟', 'a' => 'شریف گروپ تحت تعهدنامه‌های حقوقی عدم افشای اطلاعات و استانداردهای بین‌المللی حفظ حریم خصوصی مشتریان ویژه فعالیت می‌کند.'],
            ['q' => 'مزایای تحرک جهانی و سفر بدون ویزا چیست؟', 'a' => 'دارندگان این وضعیت به سفر بدون ویزا یا با ویزای فرودگاهی به مراکز تجاری بین‌المللی، کشورهای حوزه شنگن و اتحادیه کشورهای مشترک‌المنافع دسترسی خواهند داشت.'],
            ['q' => 'آیا مالیاتی بر درآمدهای جهانی یا سود سرمایه اعمال می‌شود؟', 'a' => 'اکثر مسیرهای حاکمیتی از رژیم‌های مالیاتی منطقه‌ای یا صفر درصد بهره می‌برند و درآمد برون‌مرزی و سود سهام را از مالیات محلی معاف می‌دارند.'],
            ['q' => 'چه مدارک عدم سوءپیشینه و بررسی‌های امنیتی مورد نیاز است؟', 'a' => 'متقاضیان باید گواهی رسمی عدم سوءپیشینه از کشور تابعیت و هر حوزه‌ای که بیش از شش ماه در آن سکونت داشته‌اند با ترجمه رسمی و تأییدات لازم ارائه دهند.'],
            ['q' => 'آیا تابعیت مضاعف یا داشتن اقامت‌های قانونی متعدد مجاز است؟', 'a' => 'بله، قوانین اکثر کشورهای مقصد تابعیت دوگانه یا چندگانه را کاملاً به رسمیت شناخته و نیازی به ترک تابعیت اصلی سرمایه‌گذار نیست.'],
            ['q' => 'وجوه سرمایه‌گذاری و هزینه‌های دولتی چگونه به طور امن نگهداری می‌شوند؟', 'a' => 'کلیه مبالغ در حساب‌های امانی دولتی (Escrow) یا بانک‌های مرکزی معتبر با نظارت نهادهای قانونی بین‌المللی تودیع می‌گردد.'],
            ['q' => 'آیا امکان فروش ملک یا نقد کردن دارایی‌های سرمایه‌گذاری پس از مدتی وجود دارد؟', 'a' => 'با پایان یافتن دوره نگهداری قانونی (معمولاً ۳ تا ۵ سال)، می‌توان ملک یا اوراق قرضه را به فروش رساند در حالی که وضعیت حاکمیتی محفوظ می‌ماند.'],
            ['q' => 'شریف گروپ چگونه پرونده سرمایه‌گذاران را از مراجع رسمی پیگیری می‌کند؟', 'a' => 'شریف گروپ به عنوان شرکت مشاوره‌ای معتبر در بیزنس بی دبی، هماهنگی مستقیم با مراجع دولتی، آپوستیل اسناد و ثبت فوری حقوقی را مدیریت می‌کند.']
        ],
        'zh' => [
            ['q' => '申请该项目的核心资格条件是什么？', 'a' => '申请人须具备良好的无犯罪背景记录，通过严格的多层级反洗钱合规审查，并完成指定的官方投资额度。'],
            ['q' => '直系亲属及年长受抚养人可以一并随行申请吗？', 'a' => '可以。主申请人可随同申请配偶、30周岁以下的经济依附子女，以及55周岁以上的受抚养父母或祖父母。'],
            ['q' => '申请期间是否要求在迪拜或目标国实际居住或登陆？', 'a' => '办理过程中无强制居住要求。所有政府背景背调及公证海牙认证均由我们迪拜总部合规团队远程协助办理完毕。'],
            ['q' => '从正式递交到获得政府批准通常需要多长时间？', 'a' => '在我们的优先法律通道协助下，官方审批流程高效推进，通常仅需60至90个工作日。'],
            ['q' => '如何确保家族财富及隐私信息的绝对保密安全？', 'a' => '谢里夫集团严格恪守国际顶级保密协议与全球私人客户专属合规标准，确保客户资产与身份信息滴水不漏。'],
            ['q' => '获得身份后享有哪些免签及全球通行便利？', 'a' => '成功持有者可享有免签或落地签前往全球重要金融中心、欧洲申根区以及英联邦等多个国家和地区的通行便利。'],
            ['q' => '是否对全球收入或资本利得征收所得税？', 'a' => '绝大多数主权项目实行属地税制或零税率政策，海外经营所得、分红派息以及家族传承资产均免除本土税负。'],
            ['q' => '申请过程中需要提供哪些官方无犯罪记录及合规证明？', 'a' => '申请人须提供国籍国以及过去居住满六个月以上国家所开具的正规无犯罪记录公证书及官方海牙认证文件。'],
            ['q' => '是否承认双重国籍或允许多重合法居留身份？', 'a' => '完全允许。绝大多数主权法案在法律层面上充分认可双重或多重国籍，无需申请人放弃原有的国籍或护照。'],
            ['q' => '官方投资款项及政府规费如何确保资金安全监管？', 'a' => '所有指定投资资金均直接存入官方指定的政府监管信托托管账户（Escrow）或受中央银行监管的专属资金池中。'],
            ['q' => '所投资的合规房产或金融资产后续是否可以转让退出？', 'a' => '在满足法定的持有年限要求后（通常为3至5年），投资者可自由转让变现房产或债券，且已获得的合法主权权益继续保留。'],
            ['q' => '谢里夫集团如何通过官方通道代表投资者跟进审批？', 'a' => '谢里夫集团总部设立于迪拜商业湾，作为官方认可的专业咨询机构，直接对接审批部门并提供全流程法务公证与加急递交服务。']
        ]
    ];
}

/**
 * Main Blog Listing Regeneration Function
 */
function regenerateBlogListings($rootDir = null, $publishedSnapshot = null) {
    if (!$rootDir) {
        $rootDir = realpath(dirname(__DIR__, 2));
    }
    if (!$rootDir || !is_dir($rootDir)) {
        return ['success' => false, 'error' => 'Invalid root directory: ' . $rootDir];
    }

    $primaryPub = $rootDir . '/assets/data/published_content.json';
    $legacyPub  = $rootDir . '/admin/api/published_content.json';
    $pubFile    = file_exists($primaryPub) ? $primaryPub : $legacyPub;
    if ($publishedSnapshot === null) {
        if (!file_exists($pubFile)) {
            return ['success' => false, 'error' => 'published_content.json not found'];
        }
        $raw = file_get_contents($pubFile);
        if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
            $raw = substr($raw, 3);
        }
        $publishedSnapshot = json_decode($raw, true) ?: [];
    }

    $blogs = $publishedSnapshot['sgcms_blog'] ?? [];
    if (!is_array($blogs)) $blogs = [];

    // Normalize/extract any embedded base64 images to physical files on disk
    $mediaChanged = false;
    foreach ($blogs as &$rawBlog) {
        if (!is_array($rawBlog)) continue;
        if (ssgSanitizeBlogItemMedia($rawBlog, $rootDir)) {
            $mediaChanged = true;
        }
    }
    unset($rawBlog);
    if ($mediaChanged) {
        $publishedSnapshot['sgcms_blog'] = $blogs;
    }

    // Blacklist check
    $deletedSlugs = array_map('strtolower', array_map('trim', $publishedSnapshot['sgcms_deleted_slugs'] ?? []));
    $delMap = array_flip($deletedSlugs);

    // Filter active published blogs
    $activeBlogs = [];
    foreach ($blogs as $b) {
        if (!is_array($b)) continue;
        if (!empty($b['deleted']) || ($b['status'] ?? '') === 'deleted') continue;

        $id = strtolower(trim($b['id'] ?? ''));
        $slug = strtolower(trim($b['slug'] ?? ($b['en']['slug'] ?? '')));
        if ($id && isset($delMap[$id])) continue;
        if ($slug && isset($delMap[$slug])) continue;

        $status = strtolower($b['status'] ?? ($b['status_en'] ?? ($b['en']['status'] ?? 'published')));
        if ($status === 'draft' || $status === 'hidden') continue;

        $activeBlogs[] = $b;
    }

    // Sort newest publish_date first
    usort($activeBlogs, function($a, $b) {
        $da = $a['publish_date'] ?? '2026-01-01';
        $db = $b['publish_date'] ?? '2026-01-01';
        return strcmp($db, $da);
    });

    // Auto-translate any missing/mojibake fields for active blogs
    $blogsChanged = false;
    foreach ($activeBlogs as &$b) {
        $enTitle = trim($b['en']['title'] ?? ($b['title'] ?? ''));
        $enBody = trim($b['en']['body'] ?? ($b['body'] ?? ''));
        if ($enTitle === '') continue;

        foreach (['zh', 'ar', 'fa'] as $tLang) {
            if (!isset($b[$tLang]) || !is_array($b[$tLang])) {
                $b[$tLang] = [];
            }
            $tTitle = trim($b[$tLang]['title'] ?? '');
            $tBody = trim($b[$tLang]['body'] ?? '');

            if ($tTitle === '' || isMojibakeString($tTitle) || $tTitle === $enTitle) {
                if (function_exists('translateTextServer')) {
                    $b[$tLang]['title'] = translateTextServer($enTitle, $tLang, 'en');
                    $blogsChanged = true;
                }
            }
            if ($tBody === '' || isMojibakeString($tBody) || $tBody === $enBody) {
                if (function_exists('translateTextServer')) {
                    $b[$tLang]['body'] = translateTextServer($enBody, $tLang, 'en');
                    $blogsChanged = true;
                }
            }
            if (empty($b[$tLang]['slug'])) {
                $b[$tLang]['slug'] = $b['slug'] ?? ($b['en']['slug'] ?? $b['id']);
                $blogsChanged = true;
            }
        }
    }
    unset($b);

    // Sync auto-translated active blogs back into full snapshot list (preserving any drafts/hidden items)
    if ($blogsChanged) {
        $activeByKey = [];
        foreach ($activeBlogs as $ab) {
            $k = strtolower(trim((string)($ab['id'] ?? ($ab['slug'] ?? ''))));
            if ($k !== '') $activeByKey[$k] = $ab;
        }
        foreach ($publishedSnapshot['sgcms_blog'] as $idx => $orig) {
            if (!is_array($orig)) continue;
            $k = strtolower(trim((string)($orig['id'] ?? ($orig['slug'] ?? ''))));
            if ($k !== '' && isset($activeByKey[$k])) {
                $publishedSnapshot['sgcms_blog'][$idx] = $activeByKey[$k];
            }
        }
    }

    if (($blogsChanged || $mediaChanged) && file_exists($pubFile)) {
        $encodedPub = json_encode($publishedSnapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (is_string($encodedPub) && strlen($encodedPub) > 2) {
            $pubTmp = $pubFile . '.tmp.' . bin2hex(random_bytes(4));
            if (@file_put_contents($pubTmp, $encodedPub, LOCK_EX) !== false) {
                if (!@rename($pubTmp, $pubFile)) {
                    @unlink($pubTmp);
                    @file_put_contents($pubFile, $encodedPub, LOCK_EX);
                }
            } else {
                @unlink($pubTmp);
            }
            if ($pubFile !== $legacyPub && file_exists($legacyPub)) {
                @file_put_contents($legacyPub, $encodedPub, LOCK_EX);
            }
        }
    }

    // If base64 images were compacted on live publish snapshot, also compact draft JSON snapshots and MySQL row
    if ($mediaChanged) {
        foreach ([$rootDir . '/assets/data/draft_content.json', $rootDir . '/admin/api/draft_content.json'] as $draftPath) {
            if (!file_exists($draftPath)) continue;
            $rawDraft = @file_get_contents($draftPath);
            if (!is_string($rawDraft) || stripos($rawDraft, 'data:image/') === false) continue;
            $draftData = json_decode($rawDraft, true);
            if (!is_array($draftData) || empty($draftData['sgcms_blog']) || !is_array($draftData['sgcms_blog'])) continue;
            $draftUpdated = false;
            foreach ($draftData['sgcms_blog'] as &$dbItem) {
                if (is_array($dbItem) && ssgSanitizeBlogItemMedia($dbItem, $rootDir)) {
                    $draftUpdated = true;
                }
            }
            unset($dbItem);
            if ($draftUpdated) {
                $encDraft = json_encode($draftData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if (is_string($encDraft) && strlen($encDraft) > 2) {
                    @file_put_contents($draftPath, $encDraft, LOCK_EX);
                }
            }
        }

        if (function_exists('getDb')) {
            try {
                $pdo = getDb(true);
                if ($pdo) {
                    $jsonLive = json_encode($publishedSnapshot['sgcms_blog'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    if (is_string($jsonLive) && $jsonLive !== '') {
                        $stmt = $pdo->prepare("UPDATE cms_content SET live_data = :live, updated_at = NOW() WHERE content_key = 'sgcms_blog'");
                        $stmt->execute([':live' => $jsonLive]);
                    }
                }
            } catch (Throwable $dbErr) {}
        }
    }

    $targets = [
        'en' => [
            'file'          => $rootDir . '/blog/index.html',
            'urlPrefix'     => '/blog/',
            'readMore'      => 'READ MORE',
            'isRtl'         => false
        ],
        'ar' => [
            'file'          => $rootDir . '/ar/blog/index.html',
            'urlPrefix'     => '/ar/blog/',
            'readMore'      => 'اقرأ المزيد',
            'isRtl'         => true
        ],
        'fa' => [
            'file'          => $rootDir . '/fa/blog/index.html',
            'urlPrefix'     => '/fa/blog/',
            'readMore'      => 'ادامه مطلب',
            'isRtl'         => true
        ],
        'zh' => [
            'file'          => $rootDir . '/zh/blog/index.html',
            'urlPrefix'     => '/zh/blog/',
            'readMore'      => '阅读更多',
            'isRtl'         => false
        ]
    ];

    $updatedFiles = [];
    $errors = [];

    // Prepare compact JSON payload once for inline hydration across all 4 language index pages
    $listingBlogs = [];
    foreach ($activeBlogs as $ab) {
        $compact = $ab;
        if (isset($compact['featured_img']) && stripos((string)$compact['featured_img'], 'data:image/') === 0 && strlen((string)$compact['featured_img']) > 8192) {
            $compact['featured_img'] = '/assets/images/dubai-office-2.webp';
        }
        if (isset($compact['image']) && stripos((string)$compact['image'], 'data:image/') === 0 && strlen((string)$compact['image']) > 8192) {
            $compact['image'] = '/assets/images/dubai-office-2.webp';
        }
        foreach (['en', 'ar', 'fa', 'zh'] as $lng) {
            if (isset($compact[$lng]) && is_array($compact[$lng])) {
                unset($compact[$lng]['featured_img'], $compact[$lng]['image']);
            }
        }
        $listingBlogs[] = $compact;
    }
    $cleanActiveBlogsJson = json_encode($listingBlogs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
    if (!is_string($cleanActiveBlogsJson) || $cleanActiveBlogsJson === '') {
        $cleanActiveBlogsJson = '[]';
    }

    foreach ($targets as $lang => $cfg) {
        $filePath = $cfg['file'];
        if (!file_exists($filePath)) {
            $errors[] = "Listing file not found for {$lang}: {$filePath}";
            continue;
        }

        $html = file_get_contents($filePath);
        if (!is_string($html) || strlen($html) < 5000 || stripos($html, '</html>') === false) {
            $errors[] = "Empty, corrupt, or truncated listing file for {$lang}: {$filePath}";
            continue;
        }

        // 1. Build Cards HTML for this language
        $cardsHtml = '';
        foreach ($activeBlogs as $b) {
            $ld = $b[$lang] ?? ($b['en'] ?? $b);
            $title = trim($ld['title'] ?? ($b['en']['title'] ?? ($b['title'] ?? '')));
            if ($title === '') continue;

            $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ($ld['slug'] ?? $b['id'])));
            $id = trim($b['id'] ?? $slug);
            $imgUrl = normalizeBlogImgUrl($b['featured_img'] ?? '');
            $dataCat = mapCategoryToDataCat($b['category'] ?? '', $b['subcategory'] ?? '', $title, $slug);
            $href = $cfg['urlPrefix'] . rawurlencode($slug) . '/';
            $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeSlug = htmlspecialchars($slug, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeId = htmlspecialchars($id, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeImg = htmlspecialchars($imgUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $readMoreText = htmlspecialchars($cfg['readMore'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $dirAttr = $cfg['isRtl'] ? ' dir="rtl"' : '';

            $cardItem = <<<HTML
<!-- Pre-rendered CMS Blog Card: {$safeSlug} -->
<article class="space-y-4 text-left flex flex-col justify-between blog-item dynamic-cms-blog" data-cat="{$dataCat}" data-cms-blog-id="{$safeId}" data-cms-slug="{$safeSlug}" style="display: flex;" data-paginated="true"{$dirAttr}>
<div class="space-y-3">
<div class="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 shadow-md neon-card-hover border border-neutral-200/70">
<img alt="{$safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="{$safeImg}" onerror="this.onerror=null;this.src='/assets/images/dubai-office-2.webp'"/>
</div>
<h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">
    {$safeTitle}
</h4>
</div>
<a class="inline-block text-[11px] font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-800 hover:text-luxury-gold hover:border-luxury-gold transition-colors pb-0.5 self-start cursor-pointer" href="{$href}" onclick="openBlogDetailBySlug('{$safeSlug}', event)">
    {$readMoreText}
</a>
</article>
HTML;
            $cardsHtml .= $cardItem . "\n";
        }

        // 2. Prepare Injection Markers
        $markerStart = '<!-- CMS_PRE_RENDERED_BLOGS_START -->';
        $markerEnd   = '<!-- CMS_PRE_RENDERED_BLOGS_END -->';
        $blockContent = $markerStart . "\n" . ($cardsHtml !== '' ? $cardsHtml : '') . $markerEnd;

        // 3. Inject cards inside #all-blogs-grid using deterministic marker slicing (no PCRE backtrack limits)
        $markerRes = ssgReplaceBetweenMarkers($html, $markerStart, $markerEnd, $blockContent);
        if ($markerRes['found']) {
            $html = $markerRes['html'];
        } else {
            $gridPattern = '#(<div[^>]*id=["\']all-blogs-grid["\'][^>]*>)#i';
            if (preg_match($gridPattern, $html)) {
                $html = ssgPregReplaceCallbackSafe($gridPattern, function($m) use ($blockContent) {
                    return $m[1] . "\n" . $blockContent;
                }, $html, 1);
            } else {
                $errors[] = "Could not find #all-blogs-grid in {$filePath}";
                continue;
            }
        }

        // 4. Inject Inline Pre-Rendered Data Script for Instant In-Memory Detail Loading (single JSON copy)
        $dataMarkerStart = '<!-- CMS_PRE_RENDERED_DATA_START -->';
        $dataMarkerEnd   = '<!-- CMS_PRE_RENDERED_DATA_END -->';
        $dataScript = <<<HTML
{$dataMarkerStart}
<script id="cms-pre-rendered-data">
window.__PRE_RENDERED_CMS_BLOGS = {$cleanActiveBlogsJson};
(function() {
    try {
        window.articlesDatabase = window.articlesDatabase || {};
        var blogs = window.__PRE_RENDERED_CMS_BLOGS;
        if (!Array.isArray(blogs)) return;
        blogs.forEach(function(b) {
            if (!b) return;
            var s = String(b.slug || (b.en && b.en.slug) || b.id || '').trim();
            if (!s) return;
            var cl = s.toLowerCase();
            var ld = b['{$lang}'] || b.en || b;
            var bId = String(b.id || '').toLowerCase();
            var enLd = b.en || b;
            var dFaqs = (ld.faqs && Array.isArray(ld.faqs) && ld.faqs.length) ? ld.faqs : ((enLd.faqs && Array.isArray(enLd.faqs) && enLd.faqs.length) ? enLd.faqs : (b.faqs || []));
            var entry = {
                title: ld.title || (b.en && b.en.title) || b.title,
                category: b.category || 'Citizenship',
                author: b.author || 'Sharif Group Advisory',
                date: b.publish_date || '2026-09-01',
                updated: b.publish_date || '2026-09-01',
                image: b.featured_img || '/assets/images/dubai-office-2.webp',
                content: ld.body || (b.en && b.en.body) || ('<p>' + (ld.excerpt || '') + '</p>'),
                faqs: dFaqs
            };
            window.articlesDatabase[cl] = entry;
            window.articlesDatabase[s] = entry;
            if (bId) window.articlesDatabase[bId] = entry;
        });
    } catch(e) {}
})();
</script>
{$dataMarkerEnd}
HTML;

        $dataMarkerRes = ssgReplaceBetweenMarkers($html, $dataMarkerStart, $dataMarkerEnd, $dataScript);
        if ($dataMarkerRes['found']) {
            $html = $dataMarkerRes['html'];
        } else {
            $headPos = stripos($html, '</head>');
            if ($headPos !== false) {
                $html = substr($html, 0, $headPos) . $dataScript . "\n" . substr($html, $headPos);
            }
        }

        // Strict integrity guard: never overwrite an HTML file with NULL, empty, or truncated content
        if (!is_string($html) || strlen($html) < 5000 || stripos($html, '</html>') === false || strpos($html, 'all-blogs-grid') === false) {
            $errors[] = "Refusing to write invalid or truncated HTML for {$filePath}";
            continue;
        }

        // Write file back atomically
        $tempFile = $filePath . '.tmp.' . bin2hex(random_bytes(4));
        $writtenBytes = file_put_contents($tempFile, $html, LOCK_EX);
        if ($writtenBytes !== false && $writtenBytes >= 5000) {
            if (@rename($tempFile, $filePath)) {
                $updatedFiles[] = $filePath;
            } else {
                @unlink($tempFile);
                $directBytes = file_put_contents($filePath, $html, LOCK_EX);
                if ($directBytes !== false && $directBytes >= 5000) {
                    $updatedFiles[] = $filePath;
                } else {
                    $errors[] = "Failed direct write for {$filePath}";
                }
            }
        } else {
            @unlink($tempFile);
            $errors[] = "Failed to write valid temp file for {$filePath}";
        }
    }

    // Also generate dedicated static physical article pages (zero-redirect, instant loads)
    $staticRes = regenerateStaticArticlePages($rootDir, $activeBlogs, $deletedSlugs);
    if (!empty($staticRes['errors'])) {
        $errors = array_merge($errors, $staticRes['errors']);
    }

    return [
        'success'               => count($updatedFiles) > 0,
        'updatedFiles'          => $updatedFiles,
        'blogCount'             => count($activeBlogs),
        'generatedStaticPages'  => $staticRes['generatedPages'] ?? [],
        'staticCount'           => $staticRes['generatedCount'] ?? 0,
        'errors'                => $errors
    ];
}

/**
 * Generate dedicated physical standalone article pages for all active published CMS blogs:
 *  - English: blog/<slug>/index.html
 *  - Arabic:  ar/blog/<slug>/index.html
 *  - Farsi:   fa/blog/<slug>/index.html
 *  - Chinese: zh/blog/<slug>/index.html
 */
function regenerateStaticArticlePages($rootDir, $activeBlogs, $deletedSlugs = []) {
    $generatedPages = [];
    $errors = [];

    // 1. Clean up deleted blog folders
    foreach ($deletedSlugs as $delSlug) {
        $delSlug = trim((string)$delSlug);
        if ($delSlug === '' || $delSlug === 'index.html' || $delSlug === 'blog') continue;
        $paths = [
            $rootDir . '/blog/' . $delSlug,
            $rootDir . '/ar/blog/' . $delSlug,
            $rootDir . '/fa/blog/' . $delSlug,
            $rootDir . '/zh/blog/' . $delSlug,
        ];
        foreach ($paths as $p) {
            if (is_dir($p)) {
                @unlink($p . '/index.html');
                @rmdir($p);
            }
        }
    }

    // Canonical 12 FAQs
    $allCanonicalFaqs = getCanonicalBlogFaqs();

    // FAQ Headers
    $faqHeaders = [
        'en' => [
            'badge'   => 'Desk Answers',
            'heading' => 'Program Integrity & FAQs',
            'desc'    => 'Common questions regarding compliance, processing times, and legal safeguards.'
        ],
        'ar' => [
            'badge'   => 'إجابات الخبراء',
            'heading' => 'النزاهة والأسئلة الشائعة للبرنامج',
            'desc'    => 'أسئلة شائعة حول الامتثال، والمدد الزمنية للمعالجة، والضمانات القانونية.'
        ],
        'fa' => [
            'badge'   => 'پاسخ‌های کارشناسان',
            'heading' => 'سلامت برنامه‌ها و سوالات متداول',
            'desc'    => 'سوالات متداول در خصوص انطباق قانونی، زمان‌بندی بررسی و ضمانت‌های حقوقی.'
        ],
        'zh' => [
            'badge'   => '专家解答',
            'heading' => '项目合规与常见问题解答',
            'desc'    => '关于合规审查、办理周期及法律保障的常见问题解答。'
        ]
    ];

    // Navigation UI labels
    $uiTexts = [
        'en' => [
            'back'      => '<i class="fa-solid fa-arrow-left"></i> Back to All Articles',
            'home'      => 'Home',
            'blog'      => 'Insights & Blog',
            'langBadge' => 'EN'
        ],
        'ar' => [
            'back'      => '<i class="fa-solid fa-arrow-right"></i> العودة إلى جميع المقالات',
            'home'      => 'الرئيسية',
            'blog'      => 'المدونة',
            'langBadge' => 'AR'
        ],
        'fa' => [
            'back'      => '<i class="fa-solid fa-arrow-right"></i> بازگشت به همه مقالات',
            'home'      => 'صفحه اصلی',
            'blog'      => 'بلاگ',
            'langBadge' => 'FA'
        ],
        'zh' => [
            'back'      => '<i class="fa-solid fa-arrow-left"></i> 返回所有文章',
            'home'      => '首页',
            'blog'      => '博客',
            'langBadge' => 'ZH'
        ]
    ];

    // 2. Base reference template files
    $masterTemplates = [
        'en' => [
            'file'    => $rootDir . '/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => '',
            'lang'    => 'en',
            'dir'     => 'ltr',
            'brand'   => ' | Sharif Group'
        ],
        'ar' => [
            'file'    => $rootDir . '/ar/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'ar/',
            'lang'    => 'ar',
            'dir'     => 'rtl',
            'brand'   => ' | مجموعة شريف'
        ],
        'fa' => [
            'file'    => $rootDir . '/fa/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'fa/',
            'lang'    => 'fa',
            'dir'     => 'rtl',
            'brand'   => ' | شریف گروپ'
        ],
        'zh' => [
            'file'    => $rootDir . '/zh/blog/what-is-dominica-citizenship-by-investment/index.html',
            'prefix'  => 'zh/',
            'lang'    => 'zh',
            'dir'     => 'ltr',
            'brand'   => ' | 谢里夫集团'
        ]
    ];

    $templateCache = [];
    foreach ($masterTemplates as $lang => $info) {
        if (file_exists($info['file'])) {
            $tRaw = file_get_contents($info['file']);
            if (substr($tRaw, 0, 3) === "\xEF\xBB\xBF") {
                $tRaw = substr($tRaw, 3);
            }
            $templateCache[$lang] = $tRaw;
        }
    }

    if (empty($templateCache['en'])) {
        return ['generatedCount' => 0, 'errors' => ['Master English template not found']];
    }

    foreach ($activeBlogs as $b) {
        if (!is_array($b)) continue;
        $slug = trim($b['slug'] ?? ($b['en']['slug'] ?? ($b['id'] ?? '')));
        if (!$slug || $slug === 'index.html' || $slug === 'blog') continue;

        $enSlug = trim($b['en']['slug'] ?? $slug);
        $arSlug = trim($b['ar']['slug'] ?? ($b['slug'] ?? $enSlug));
        $faSlug = trim($b['fa']['slug'] ?? ($b['slug'] ?? $enSlug));
        $zhSlug = trim($b['zh']['slug'] ?? ($b['slug'] ?? $enSlug));

        $rawImg = $b['featured_img'] ?? '';
        if (is_string($rawImg) && stripos($rawImg, 'data:image/') === 0) {
            $rawImg = ssgPersistBase64Image($rawImg, $slug, $rootDir);
        }
        $imgUrl = normalizeBlogImgUrl($rawImg);
        if (stripos($imgUrl, 'data:image/') === 0) {
            $imgUrl = '/assets/images/dubai-office-2.webp';
        }
        $fullImgUrl = (strpos($imgUrl, 'http') === 0) ? $imgUrl : ('https://sharifgroup.ae' . ($imgUrl[0] === '/' ? '' : '/') . $imgUrl);
        $author = trim($b['author'] ?? 'Sharif Group Advisory Desk');
        $pubDate = trim($b['publish_date'] ?? date('Y-m-d'));
        $dateFormatted = date('F Y', strtotime($pubDate));

        $enTitle = trim($b['en']['title'] ?? ($b['title'] ?? ''));
        $enBody  = trim($b['en']['body'] ?? ($b['body'] ?? ''));
        $enExcerpt = trim($b['en']['excerpt'] ?? ($b['excerpt'] ?? ''));

        foreach ($masterTemplates as $lang => $info) {
            $tpl = $templateCache[$lang] ?? $templateCache['en'];
            $ld = $b[$lang] ?? ($b['en'] ?? $b);

            $title = trim($ld['title'] ?? '');
            if ($title === '' || isMojibakeString($title) || ($lang !== 'en' && $title === $enTitle)) {
                if ($lang !== 'en' && $enTitle !== '' && function_exists('translateTextServer')) {
                    $title = translateTextServer($enTitle, $lang, 'en');
                } else {
                    $title = $enTitle;
                }
            }
            if ($title === '') continue;

            $body = trim($ld['body'] ?? '');
            if ($body === '' || isMojibakeString($body) || ($lang !== 'en' && $body === $enBody)) {
                if ($lang !== 'en' && $enBody !== '' && function_exists('translateTextServer')) {
                    $body = translateTextServer($enBody, $lang, 'en');
                } else {
                    $body = $enBody;
                }
            }
            if ($body === '') {
                $body = '<p>' . htmlspecialchars($enExcerpt ?: $title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
            }

            // Clean description
            $cleanText = trim(preg_replace('/\s+/', ' ', strip_tags($body)));
            $desc = trim($ld['meta_desc'] ?? ($ld['excerpt'] ?? ''));
            if ($desc === '' || isMojibakeString($desc) || ($lang !== 'en' && $desc === $enExcerpt)) {
                if ($lang !== 'en' && $enExcerpt !== '' && function_exists('translateTextServer')) {
                    $desc = translateTextServer($enExcerpt, $lang, 'en');
                } else {
                    $desc = function_exists('mb_substr') ? mb_substr($cleanText, 0, 155, 'UTF-8') : substr($cleanText, 0, 155);
                }
            }

            $pageTitle = $title . $info['brand'];
            $safePageTitle = htmlspecialchars($pageTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeDesc = htmlspecialchars($desc, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $canonicalUrl = 'https://sharifgroup.ae/' . $info['prefix'] . 'blog/' . rawurlencode($slug) . '/';

            // Clone template & verify baseline integrity
            if (!is_string($tpl) || strlen($tpl) < 5000 || stripos($tpl, '</html>') === false) {
                $errors[] = "Master template invalid/truncated for {$lang} ({$slug})";
                continue;
            }
            $pageHtml = $tpl;

            // 0. Ensure root-relative assets across all scripts, styles, images, videos
            $pageHtml = str_replace(
                ['../../assets/', '../assets/'],
                ['/assets/', '/assets/'],
                $pageHtml
            );

            // 0b. Enforce document dir and lang
            $pageHtml = ssgPregReplaceLiteral('#<html[^>]*>#is', '<html class="scroll-smooth" dir="' . $info['dir'] . '" lang="' . $lang . '">', $pageHtml, 1);

            // 1. Replace Title & Meta Title & Description
            $pageHtml = ssgPregReplaceLiteral('#<title>.*?</title>#is', '<title>' . $safePageTitle . '</title>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta[^>]+name="title"[^>]*>#is', '<meta name="title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta[^>]+name="description"[^>]*>#is', '<meta name="description" content="' . $safeDesc . '"/>', $pageHtml, 1);

            // 2. Replace Canonical & Hreflangs
            $pageHtml = ssgPregReplaceLiteral('#<link[^>]+rel="canonical"[^>]*>#is', '<link rel="canonical" href="' . $canonicalUrl . '" />', $pageHtml, 1);
            $hreflangs = <<<HREF
<link rel="alternate" hreflang="x-default" href="https://sharifgroup.ae/blog/{$enSlug}/" />
    <link rel="alternate" hreflang="en" href="https://sharifgroup.ae/blog/{$enSlug}/" />
    <link rel="alternate" hreflang="fa" href="https://sharifgroup.ae/fa/blog/{$faSlug}/" />
    <link rel="alternate" hreflang="ar" href="https://sharifgroup.ae/ar/blog/{$arSlug}/" />
    <link rel="alternate" hreflang="zh" href="https://sharifgroup.ae/zh/blog/{$zhSlug}/" />
HREF;
            // Strip any existing alternate hreflang links, then inject clean set after canonical
            $pageHtml = ssgPregReplaceLiteral('#\s*<link[^>]+hreflang="[^"]+"[^>]*>#is', '', $pageHtml);
            $pageHtml = ssgPregReplaceCallbackSafe('#(<link[^>]+rel="canonical"[^>]*>)#is', function($m) use ($hreflangs) {
                return $m[1] . "\n    " . $hreflangs;
            }, $pageHtml, 1);

            // 3. Replace OpenGraph & Twitter
            $pageHtml = ssgPregReplaceLiteral('#<meta property="og:title"[^>]*>#is', '<meta property="og:title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta property="og:description"[^>]*>#is', '<meta property="og:description" content="' . $safeDesc . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta property="og:url"[^>]*>#is', '<meta property="og:url" content="' . $canonicalUrl . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta property="og:image"[^>]*>#is', '<meta property="og:image" content="' . htmlspecialchars($fullImgUrl, ENT_QUOTES, 'UTF-8') . '"/>', $pageHtml, 1);

            $pageHtml = ssgPregReplaceLiteral('#<meta name="twitter:title"[^>]*>#is', '<meta name="twitter:title" content="' . $safePageTitle . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta name="twitter:description"[^>]*>#is', '<meta name="twitter:description" content="' . $safeDesc . '"/>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<meta name="twitter:image"[^>]*>#is', '<meta name="twitter:image" content="' . htmlspecialchars($fullImgUrl, ENT_QUOTES, 'UTF-8') . '"/>', $pageHtml, 1);

            // 4. Update Header Language Switcher Badge Label
            $curLangBadge = $uiTexts[$lang]['langBadge'];
            $pageHtml = ssgPregReplaceLiteral(
                '#<span id="current-lang-text">.*?</span>#is',
                '<span id="current-lang-text">' . $curLangBadge . '</span>',
                $pageHtml,
                1
            );

            // 5. Update Language Switcher Dropdown Links & Active Classes
            $activeEn = ($lang === 'en') ? ' active-lang' : '';
            $activeAr = ($lang === 'ar') ? ' active-lang' : '';
            $activeFa = ($lang === 'fa') ? ' active-lang' : '';
            $activeZh = ($lang === 'zh') ? ' active-lang' : '';

            $dropdownMenuHtml = <<<DDHTML
<div class="hidden absolute right-0 mt-2 w-44 bg-white/95 rounded-2xl shadow-2xl border border-neutral-200/80 py-2 z-50 overflow-hidden" id="lang-dropdown-menu">
<a href="/blog/{$enSlug}/" class="lang-option{$activeEn}" data-lang="en" onclick="switchLanguage('en', event)">
<span data-i18n="langSwitcher.en">English</span>
<span class="text-[10px] text-neutral-400">EN</span>
</a>
<a href="/ar/blog/{$arSlug}/" class="lang-option{$activeAr}" data-lang="ar" onclick="switchLanguage('ar', event)">
<span class="font-medium" data-i18n="langSwitcher.ar">العربية</span>
<span class="text-[10px] text-neutral-400">AR</span>
</a>
<a href="/fa/blog/{$faSlug}/" class="lang-option{$activeFa}" data-lang="fa" onclick="switchLanguage('fa', event)">
<span class="font-medium" data-i18n="langSwitcher.fa">فارسی</span>
<span class="text-[10px] text-neutral-400">FA</span>
</a>
<a href="/zh/blog/{$zhSlug}/" class="lang-option{$activeZh}" data-lang="zh" onclick="switchLanguage('zh', event)">
<span class="font-medium" data-i18n="langSwitcher.zh">中文</span>
<span class="text-[10px] text-neutral-400">ZH</span>
</a>
</div>
DDHTML;

            $pageHtml = ssgPregReplaceLiteral(
                '#<div class="hidden absolute right-0 mt-2 w-44[^"]*" id="lang-dropdown-menu">.*?</div>#is',
                $dropdownMenuHtml,
                $pageHtml,
                1
            );

            // Mobile Language Switcher Grid
            $mobileGridHtml = <<<MGHTML
<div class="mobile-lang-grid">
<a href="/blog/{$enSlug}/" class="lang-option{$activeEn}" data-lang="en" onclick="switchLanguage('en', event)">English</a>
<a href="/ar/blog/{$arSlug}/" class="lang-option{$activeAr}" data-lang="ar" onclick="switchLanguage('ar', event)">العربية</a>
<a href="/fa/blog/{$faSlug}/" class="lang-option{$activeFa}" data-lang="fa" onclick="switchLanguage('fa', event)">فارسی</a>
<a href="/zh/blog/{$zhSlug}/" class="lang-option{$activeZh}" data-lang="zh" onclick="switchLanguage('zh', event)">中文</a>
</div>
MGHTML;

            $pageHtml = ssgPregReplaceLiteral(
                '#<div class="mobile-lang-grid">.*?</div>#is',
                $mobileGridHtml,
                $pageHtml,
                1
            );

            // 6. Replace Breadcrumbs & Back Button
            $backText = $uiTexts[$lang]['back'];
            $homeText = $uiTexts[$lang]['home'];
            $blogText = $uiTexts[$lang]['blog'];
            $homeUrl = ($lang === 'en') ? '/' : '/' . $lang . '/';
            $blogUrl = ($lang === 'en') ? '/blog/' : '/' . $lang . '/blog/';

            $pageHtml = ssgPregReplaceLiteral('#<a[^>]+href="[^"]*blog/[^"]*"[^>]*class="[^"]*inline-flex items-center[^"]*"[^>]*>.*?</a>#is', '<a href="' . $blogUrl . '" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-luxury-gold transition mb-8">' . $backText . '</a>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<a[^>]+href="/"[^>]*class="hover:text-luxury-gold[^"]*"[^>]*>.*?</a>#is', '<a href="' . $homeUrl . '" class="hover:text-luxury-gold transition">' . $homeText . '</a>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<a[^>]+href="/(?:ar/|fa/|zh/)?blog/"[^>]*class="hover:text-luxury-gold[^"]*"[^>]*>.*?</a>#is', '<a href="' . $blogUrl . '" class="hover:text-luxury-gold transition">' . $blogText . '</a>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<span class="text-luxury-gold truncate max-w-\[200px\][^"]*">.*?</span>#is', '<span class="text-luxury-gold truncate max-w-[200px] sm:max-w-xs">' . $safeTitle . '</span>', $pageHtml, 1);

            // 7. Replace Hero H1
            $pageHtml = ssgPregReplaceLiteral('#<h1 class="font-serif[^"]*">.*?</h1>#is', '<h1 class="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 leading-tight">' . $safeTitle . '</h1>', $pageHtml, 1);

            // 8. Replace Author and Dates in Meta Bar
            $pageHtml = ssgPregReplaceLiteral('#<span>Sharif Group Advisory Desk</span>#is', '<span>' . htmlspecialchars($author, ENT_QUOTES, 'UTF-8') . '</span>', $pageHtml, 1);
            $pageHtml = ssgPregReplaceLiteral('#<span>August 2026</span>#is', '<span>' . $dateFormatted . '</span>', $pageHtml);

            // 9. Replace Featured Image
            $imgTag = '<img alt="' . $safeTitle . '" class="w-full h-full object-cover" src="' . htmlspecialchars($imgUrl, ENT_QUOTES, 'UTF-8') . '" onerror="this.onerror=null;this.src=\'/assets/images/dubai-office-2.webp\'"/>';
            $pageHtml = ssgPregReplaceLiteral('#<div class="aspect-video[^"]*">\s*<img[^>]+>\s*</div>#is', '<div class="aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-200 bg-neutral-100">' . "\n                " . $imgTag . "\n            </div>", $pageHtml, 1);

            // 10. Replace Article Content Body
            $contentDiv = '<div class="article-content space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-light">' . "\n" . $body . "\n            </div>";
            $pageHtml = ssgPregReplaceLiteral('#<div class="article-content space-y-6[^"]*">.*?</div>\s*(?=<!-- (?:FAQ ACCORDION SECTION|SECTION: CONSULTATION))#is', $contentDiv . "\n\n            ", $pageHtml, 1);

            // 11. Replace FAQs (Prioritize user's custom FAQs; only fallback to defaults if zero custom FAQs)
            $faqsToUse = null;
            $customFaqs = !empty($ld['faqs']) && is_array($ld['faqs']) 
                ? $ld['faqs'] 
                : (!empty($b['faqs']) && is_array($b['faqs']) 
                    ? $b['faqs'] 
                    : (!empty($b['en']['faqs']) && is_array($b['en']['faqs']) ? $b['en']['faqs'] : []));

            if (is_array($customFaqs) && count($customFaqs) > 0) {
                // Filter out empty items
                $validCustom = [];
                foreach ($customFaqs as $cf) {
                    if (!is_array($cf)) continue;
                    $q = trim($cf['q'] ?? '');
                    $a = trim($cf['a'] ?? '');
                    if ($q !== '' || $a !== '') {
                        $validCustom[] = ['q' => $q, 'a' => $a];
                    }
                }

                if (!empty($validCustom)) {
                    $firstQ = $validCustom[0]['q'] ?? '';
                    $isTargetLang = ($lang === 'en') ||
                        ($lang === 'zh' && preg_match('/[\x{4E00}-\x{9FFF}]/u', $firstQ)) ||
                        (($lang === 'ar' || $lang === 'fa') && preg_match('/[\x{0600}-\x{06FF}]/u', $firstQ));

                    if ($isTargetLang) {
                        $faqsToUse = $validCustom;
                    } else if ($lang !== 'en' && function_exists('translateTextServer')) {
                        $translatedCustom = [];
                        foreach ($validCustom as $cf) {
                            $tQ = translateTextServer($cf['q'] ?? '', $lang, 'en');
                            $tA = translateTextServer($cf['a'] ?? '', $lang, 'en');
                            $translatedCustom[] = [
                                'q' => $tQ ?: ($cf['q'] ?? ''),
                                'a' => $tA ?: ($cf['a'] ?? '')
                            ];
                        }
                        $faqsToUse = $translatedCustom;
                    } else {
                        $faqsToUse = $validCustom;
                    }
                }
            }

            if (empty($faqsToUse)) {
                $faqsToUse = $allCanonicalFaqs[$lang] ?? $allCanonicalFaqs['en'];
            }

            // Build FAQ 6-left, 6-right layout
            $faqCol1 = '';
            $faqCol2 = '';
            $mid = max(1, (int)ceil(count($faqsToUse) / 2));
            $textAlignClass = $info['dir'] === 'rtl' ? 'text-right' : 'text-left';
            $paddingClass   = $info['dir'] === 'rtl' ? 'pl-3' : 'pr-3';

            foreach ($faqsToUse as $fIdx => $faq) {
                $q = htmlspecialchars($faq['q'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                $a = htmlspecialchars($faq['a'] ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                $faqItem = <<<FAQITEM
        <div class="border-b border-neutral-200 py-3.5">
            <button onclick="toggleBlogFAQ('faq-dyn-{$fIdx}')" class="w-full flex justify-between items-center focus:outline-none group {$textAlignClass}">
                <span class="text-xs uppercase tracking-wider font-bold text-neutral-800 group-hover:text-luxury-gold transition {$paddingClass}">
                    {$q}
                </span>
                <span class="text-neutral-400 transition-transform duration-300 shrink-0" id="icon-faq-dyn-{$fIdx}">
                    <i class="fa-solid fa-chevron-down text-[10px]"></i>
                </span>
            </button>
            <div id="content-faq-dyn-{$fIdx}" class="max-h-0 overflow-hidden transition-all duration-500 ease-in-out">
                <p class="text-xs text-neutral-600 leading-relaxed mt-2.5 font-light">
                    {$a}
                </p>
            </div>
        </div>
FAQITEM;
                if ($fIdx < $mid) {
                    $faqCol1 .= $faqItem . "\n";
                } else {
                    $faqCol2 .= $faqItem . "\n";
                }
            }

            $headerBadge = htmlspecialchars($faqHeaders[$lang]['badge'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $headerTitle = htmlspecialchars($faqHeaders[$lang]['heading'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $headerDesc  = htmlspecialchars($faqHeaders[$lang]['desc'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $fullFaqSection = <<<FAQSEC
<!-- FAQ ACCORDION SECTION (Split: 6 Left, 6 Right) -->
<div class="space-y-6 pt-12 border-t border-neutral-200">
    <div class="text-center space-y-3 mb-8">
        <span class="text-xs font-bold uppercase tracking-[0.25em] text-luxury-gold flex items-center justify-center gap-2">
            <i class="fa-regular fa-circle-question"></i> {$headerBadge}
        </span>
        <h2 class="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">{$headerTitle}</h2>
        <p class="text-xs text-neutral-500">{$headerDesc}</p>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 text-start items-start">
        <div class="flex flex-col">
{$faqCol1}        </div>
        <div class="flex flex-col">
{$faqCol2}        </div>
    </div>
</div>
FAQSEC;

            $pageHtml = ssgPregReplaceLiteral(
                '#(<!-- FAQ ACCORDION SECTION[^>]*-->\s*)?<div class="space-y-6 pt-12 border-t border-neutral-200">.*?</div>\s*</div>\s*(?=</div>\s*</main|</main|<!-- RELATED|<!-- (?:SECTION: )?CONSULTATION|<!-- FULL CONSULTATION|<!-- FOOTER)#is',
                $fullFaqSection . "\n\n            ",
                $pageHtml,
                1
            );

            if (!is_string($pageHtml) || strlen($pageHtml) < 5000 || stripos($pageHtml, '</html>') === false) {
                $errors[] = "Refusing to write invalid or truncated article HTML for {$slug} ({$lang})";
                continue;
            }

            // Output directory
            $outDir = ($lang === 'en') ? ($rootDir . '/blog/' . $slug) : ($rootDir . '/' . $lang . '/blog/' . $slug);
            if (!is_dir($outDir)) {
                @mkdir($outDir, 0755, true);
            }
            $outFile = $outDir . '/index.html';
            $tmpOut = $outFile . '.tmp.' . bin2hex(random_bytes(4));
            $writtenBytes = file_put_contents($tmpOut, $pageHtml, LOCK_EX);
            if ($writtenBytes !== false && $writtenBytes >= 5000) {
                if (@rename($tmpOut, $outFile)) {
                    $generatedPages[] = $outFile;
                } else {
                    @unlink($tmpOut);
                    $directBytes = file_put_contents($outFile, $pageHtml, LOCK_EX);
                    if ($directBytes !== false && $directBytes >= 5000) {
                        $generatedPages[] = $outFile;
                    } else {
                        $errors[] = "Failed direct write {$outFile}";
                    }
                }
            } else {
                @unlink($tmpOut);
                $errors[] = "Failed to write valid article HTML {$outFile}";
            }
        }
    }

    return [
        'generatedCount' => count($generatedPages),
        'generatedPages' => $generatedPages,
        'errors'         => $errors
    ];
}

// Allow direct HTTP / CLI script invocation (never auto-run when included via require_once)
$isDirectCliBlog = (php_sapi_name() === 'cli' && !empty($_SERVER['argv'][0]) && realpath($_SERVER['argv'][0]) === __FILE__);
$isDirectHttpBlog = (php_sapi_name() !== 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__);
if ($isDirectCliBlog || $isDirectHttpBlog) {
    if (php_sapi_name() !== 'cli') {
        require_once __DIR__ . '/db.php';
        requireAdminAuth();
    }
    $rootDir = realpath(dirname(__DIR__, 2));
    $res = regenerateBlogListings($rootDir);
    if (php_sapi_name() === 'cli') {
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    } else {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($res, JSON_UNESCAPED_SLASHES);
    }
}
