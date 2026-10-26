<?php
/**
 * Sharif Group CMS - Webinar SSG & Data Generator
 *
 * Synchronizes webinar data upon publication:
 * 1. Writes out /assets/js/webinars-data.js so the client-side SPA (/webinars/) is immediately updated.
 * 2. Updates /assets/locales/{en,fa,ar,zh}.json with the featured session content and localized schedules.
 * 3. Updates the featured webinar section and countdown target (data-cd) in index.html and all language versions (/fa/, /ar/, /zh/).
 */

if (!function_exists('formatWebinarSchedule')) {
    function formatWebinarSchedule($startUtc, $lang) {
        try {
            $dt = new DateTime($startUtc, new DateTimeZone('UTC'));
        } catch (Exception $e) {
            $dt = new DateTime('now', new DateTimeZone('UTC'));
        }

        // Times in key cities
        $dtKabul = clone $dt; $dtKabul->modify('+270 minutes'); // UTC+4:30
        $dtDubai = clone $dt; $dtDubai->modify('+240 minutes'); // UTC+4:00

        $kabulTime = $dtKabul->format('H:i');
        $dubaiTime = $dtDubai->format('H:i');
        $dayNameEn = $dt->format('l');
        $day = $dt->format('j');
        $monthEn = $dt->format('F');
        $year = $dt->format('Y');

        $days = [
            'en' => ['Sunday'=>'Sunday','Monday'=>'Monday','Tuesday'=>'Tuesday','Wednesday'=>'Wednesday','Thursday'=>'Thursday','Friday'=>'Friday','Saturday'=>'Saturday'],
            'fa' => ['Sunday'=>'یک‌شنبه','Monday'=>'دوشنبه','Tuesday'=>'سه‌شنبه','Wednesday'=>'چهارشنبه','Thursday'=>'پنج‌شنبه','Friday'=>'جمعه','Saturday'=>'شنبه'],
            'ar' => ['Sunday'=>'الأحد','Monday'=>'الإثنين','Tuesday'=>'الثلاثاء','Wednesday'=>'الأربعاء','Thursday'=>'الخميس','Friday'=>'الجمعة','Saturday'=>'السبت'],
            'zh' => ['Sunday'=>'星期日','Monday'=>'星期一','Tuesday'=>'星期二','Wednesday'=>'星期三','Thursday'=>'星期四','Friday'=>'星期五','Saturday'=>'星期六'],
        ];
        $months = [
            'en' => [1=>'January',2=>'February',3=>'March',4=>'April',5=>'May',6=>'June',7=>'July',8=>'August',9=>'September',10=>'October',11=>'November',12=>'December'],
            'fa' => [1=>'ژانویه',2=>'فوریه',3=>'مارس',4=>'آوریل',5=>'مه',6=>'ژوئن',7=>'ژوئیه',8=>'اوت',9=>'سپتامبر',10=>'اکتبر',11=>'نوامبر',12=>'دسامبر'],
            'ar' => [1=>'يناير',2=>'فبراير',3=>'مارس',4=>'أبريل',5=>'مايو',6=>'يونيو',7=>'يوليو',8=>'أغسطس',9=>'سبتمبر',10=>'أكتوبر',11=>'نوفمبر',12=>'ديسمبر'],
            'zh' => [1=>'1月',2=>'2月',3=>'3月',4=>'4月',5=>'5月',6=>'6月',7=>'7月',8=>'8月',9=>'9月',10=>'10月',11=>'11月',12=>'12月'],
        ];
        $mNum = (int)$dt->format('n');

        switch ($lang) {
            case 'fa':
                $dayFa = $days['fa'][$dayNameEn] ?? $dayNameEn;
                $monthFa = $months['fa'][$mNum] ?? $monthEn;
                return [
                    'dateValue' => "{$dayFa}، {$day} {$monthFa} {$year}",
                    'dateTime' => "{$dayFa} {$day} {$monthFa} · {$kabulTime} کابل / {$dubaiTime} دبی"
                ];
            case 'ar':
                $dayAr = $days['ar'][$dayNameEn] ?? $dayNameEn;
                $monthAr = $months['ar'][$mNum] ?? $monthEn;
                return [
                    'dateValue' => "{$dayAr}، {$day} {$monthAr} {$year}",
                    'dateTime' => "{$dayAr} {$day} {$monthAr} · {$kabulTime} كابل / {$dubaiTime} دبي"
                ];
            case 'zh':
                $dayZh = $days['zh'][$dayNameEn] ?? $dayNameEn;
                $monthZh = $months['zh'][$mNum] ?? $monthEn;
                return [
                    'dateValue' => "{$year}年{$monthZh}{$day}日 {$dayZh}",
                    'dateTime' => "{$monthZh}{$day}日{$dayZh} · 喀布尔 {$kabulTime} / 迪拜 {$dubaiTime}"
                ];
            default:
                return [
                    'dateValue' => "{$dayNameEn}, {$day} {$monthEn} {$year}",
                    'dateTime' => "{$dayNameEn} {$day} {$monthEn} · {$kabulTime} Kabul / {$dubaiTime} Dubai"
                ];
        }
    }
}

if (!function_exists('regenerateWebinars')) {
    function regenerateWebinars($rootDir, $publishedData) {
        $rootDir = rtrim(str_replace('\\', '/', $rootDir), '/');
        $updatedFiles = [];

        if (empty($publishedData['sgcms_webinars'])) {
            $pubJsonFile = $rootDir . '/admin/api/published_content.json';
            if (file_exists($pubJsonFile)) {
                $raw = @file_get_contents($pubJsonFile);
                $d = json_decode($raw, true);
                if (!empty($d['sgcms_webinars'])) {
                    $publishedData['sgcms_webinars'] = $d['sgcms_webinars'];
                }
            }
        }
        if (empty($publishedData['sgcms_webinars'])) {
            $draftJsonFile = $rootDir . '/admin/api/draft_content.json';
            if (file_exists($draftJsonFile)) {
                $rawD = @file_get_contents($draftJsonFile);
                $dD = json_decode($rawD, true);
                if (!empty($dD['sgcms_webinars'])) {
                    $publishedData['sgcms_webinars'] = $dD['sgcms_webinars'];
                }
            }
        }

        $webinars = $publishedData['sgcms_webinars'] ?? null;
        if (empty($webinars) || !is_array($webinars)) {
            return ['success' => false, 'message' => 'No webinars data to regenerate'];
        }

        // Merge CRM schedule & speaker overrides from sgcms_webinar_schedule
        $schedule = $publishedData['sgcms_webinar_schedule'] ?? null;
        if (!$schedule) {
            $draftJsonFile = $rootDir . '/admin/api/draft_content.json';
            if (file_exists($draftJsonFile)) {
                $rawSch = @file_get_contents($draftJsonFile);
                $decSch = json_decode($rawSch, true);
                if (!empty($decSch['sgcms_webinar_schedule'])) {
                    $schedule = $decSch['sgcms_webinar_schedule'];
                }
            }
        }
        if (!$schedule) {
            $pubJsonFile = $rootDir . '/admin/api/published_content.json';
            if (file_exists($pubJsonFile)) {
                $rawSchPub = @file_get_contents($pubJsonFile);
                $decSchPub = json_decode($rawSchPub, true);
                if (!empty($decSchPub['sgcms_webinar_schedule'])) {
                    $schedule = $decSchPub['sgcms_webinar_schedule'];
                }
            }
        }

        if (!empty($schedule['sessions']) && is_array($schedule['sessions'])) {
            foreach ($webinars as &$wItem) {
                $sNum = $wItem['session_no'] ?? 0;
                if (!empty($schedule['sessions'][$sNum])) {
                    $sData = $schedule['sessions'][$sNum];
                    if (!empty($sData['start_utc'])) $wItem['start_utc'] = $sData['start_utc'];
                    if (isset($sData['join_url'])) $wItem['join_url'] = trim($sData['join_url']);
                    if (isset($sData['reg_status'])) {
                        $wItem['reg_status'] = $sData['reg_status'];
                        $wItem['registration_open'] = ($sData['reg_status'] === 'open');
                    }
                    if (!empty($sData['speakers']) && is_array($sData['speakers'])) {
                        $wItem['speakers'] = $sData['speakers'];
                    } elseif (!empty($sData['speaker_name'])) {
                        $spList = [
                            [
                                'name'        => trim($sData['speaker_name']),
                                'title'       => !empty($sData['speaker_role']) ? trim($sData['speaker_role']) : 'Senior Consultant, Caribbean Citizenship Programs',
                                'affiliation' => !empty($sData['speaker_affiliation']) ? trim($sData['speaker_affiliation']) : 'Sharif Group Dubai'
                            ]
                        ];
                        if (!empty($sData['speaker2_name'])) {
                            $spList[] = [
                                'name'        => trim($sData['speaker2_name']),
                                'title'       => !empty($sData['speaker2_role']) ? trim($sData['speaker2_role']) : 'Dominica Passport Program Specialist',
                                'affiliation' => !empty($sData['speaker2_affiliation']) ? trim($sData['speaker2_affiliation']) : 'Sharif Group Dubai'
                            ];
                        }
                        $wItem['speakers'] = $spList;
                    }
                }
            }
            unset($wItem);
        }

        // 1. UPDATE assets/js/webinars-data.js
        $webinarsJsFile = $rootDir . '/assets/js/webinars-data.js';
        $jsContent = "/* Auto-generated by Sharif Group CMS */\n";
        $jsContent .= "window.SGCMS_WEBINARS = " . json_encode($webinars, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
        if (@file_put_contents($webinarsJsFile, $jsContent, LOCK_EX) !== false) {
            $updatedFiles[] = $webinarsJsFile;
        }

        // 2. IDENTIFY FEATURED / NEXT UPCOMING SESSION (Session 1 or first active)
        $featured = null;
        $activeSessionNo = !empty($schedule['active_session_no']) ? (int)$schedule['active_session_no'] : null;
        if ($activeSessionNo) {
            foreach ($webinars as $w) {
                if ((int)($w['session_no'] ?? 0) === $activeSessionNo) {
                    $featured = $w;
                    break;
                }
            }
        }
        if (!$featured) {
            foreach ($webinars as $w) {
                if (!empty($w['event_status']) && in_array($w['event_status'], ['upcoming', 'live'])) {
                    $featured = $w;
                    break;
                }
            }
        }
        if (!$featured && !empty($webinars[0])) {
            $featured = $webinars[0];
        }

        if ($featured) {
            $startUtc = $featured['start_utc'] ?? '2026-10-29T15:30:00Z';
            $regOpen = !empty($featured['registration_open']);
            $seriesTag = $featured['series_tag'] ?? 'Series 01 · Dominica';

            // 3. UPDATE assets/locales/{en,fa,ar,zh}.json
            $locales = ['en', 'fa', 'ar', 'zh'];
            foreach ($locales as $lang) {
                $locFile = $rootDir . "/assets/locales/{$lang}.json";
                if (!file_exists($locFile)) continue;
                $raw = @file_get_contents($locFile);
                if (substr($raw, 0, 3) === "\xEF\xBB\xBF") $raw = substr($raw, 3);
                $locData = json_decode($raw, true);
                if (!is_array($locData)) continue;

                if (!isset($locData['homeWebinar'])) $locData['homeWebinar'] = [];

                $lObj = $featured[$lang] ?? ($featured['en'] ?? []);
                if (!empty($lObj['title'])) {
                    $locData['homeWebinar']['title'] = $lObj['title'];
                }
                if (!empty($lObj['excerpt'])) {
                    $locData['homeWebinar']['desc'] = $lObj['excerpt'];
                }
                if (!empty($lObj['series_tag'])) {
                    $locData['homeWebinar']['seriesTag'] = $lObj['series_tag'];
                } else if (!empty($featured['series_tag'])) {
                    $locData['homeWebinar']['seriesTag'] = $featured['series_tag'];
                }

                // Dynamic localized date & schedule
                $sched = formatWebinarSchedule($startUtc, $lang);
                if (!empty($sched['dateValue'])) {
                    $locData['homeWebinar']['dateValue'] = $sched['dateValue'];
                }
                if (!empty($sched['dateTime'])) {
                    $locData['homeWebinar']['dateTime'] = $sched['dateTime'];
                }

                if ($regOpen) {
                    $statusMap = [
                        'en' => 'Registration Open',
                        'fa' => 'ثبت‌نام باز است',
                        'ar' => 'التسجيل متاح',
                        'zh' => '报名开放中'
                    ];
                    $locData['homeWebinar']['status'] = $statusMap[$lang] ?? 'Registration Open';
                } else {
                    $statusMap = [
                        'en' => 'Coming Soon',
                        'fa' => 'به زودی',
                        'ar' => 'قريباً',
                        'zh' => '即将开放'
                    ];
                    $locData['homeWebinar']['status'] = $statusMap[$lang] ?? 'Coming Soon';
                }

                @file_put_contents($locFile, json_encode($locData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
                $updatedFiles[] = $locFile;
            }

            // 4. PRE-RENDER INTO index.html AND MULTILINGUAL EDITIONS (/fa/, /ar/, /zh/)
            $indexFiles = [
                'en' => $rootDir . '/index.html',
                'fa' => $rootDir . '/fa/index.html',
                'ar' => $rootDir . '/ar/index.html',
                'zh' => $rootDir . '/zh/index.html'
            ];

            foreach ($indexFiles as $lang => $idxPath) {
                if (!file_exists($idxPath)) continue;
                $html = @file_get_contents($idxPath);
                if (!$html || strlen($html) < 200) continue;

                $lObj = $featured[$lang] ?? ($featured['en'] ?? []);
                $titleText = $lObj['title'] ?? '';
                $descText = $lObj['excerpt'] ?? '';
                $sched = formatWebinarSchedule($startUtc, $lang);

                // Replace countdown data-cd attribute
                if (preg_match('#\bid="home-webinar-countdown"[^>]*\bdata-cd="[^"]*"#i', $html)) {
                    $html = preg_replace('#(\bid="home-webinar-countdown"[^>]*\bdata-cd=")[^"]*(")#i', '${1}' . $startUtc . '${2}', $html, 1);
                }

                // Replace title
                if ($titleText) {
                    $safeTitle = htmlspecialchars($titleText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $html = preg_replace('#(<a\b[^>]*\bdata-i18n="homeWebinar.title"[^>]*>)(.*?)(</a>)#us', '${1}' . $safeTitle . '${3}', $html, 1);
                }

                // Replace description
                if ($descText) {
                    $safeDesc = htmlspecialchars($descText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $html = preg_replace('#(<p\b[^>]*\bdata-i18n="homeWebinar.desc"[^>]*>)(.*?)(</p>)#us', '${1}' . $safeDesc . '${3}', $html, 1);
                }

                // Replace dateValue
                if (!empty($sched['dateValue'])) {
                    $safeDate = htmlspecialchars($sched['dateValue'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $html = preg_replace('#(<div\b[^>]*\bdata-i18n="homeWebinar.dateValue"[^>]*>)(.*?)(</div>)#us', '${1}' . $safeDate . '${3}', $html, 1);
                }

                // Replace dateTime
                if (!empty($sched['dateTime'])) {
                    $safeDT = htmlspecialchars($sched['dateTime'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $html = preg_replace('#(<span\b[^>]*\bdata-i18n="homeWebinar.dateTime"[^>]*>)(.*?)(</span>)#us', '${1}' . $safeDT . '${3}', $html, 1);
                }

                // Replace seriesTag if present
                $sTag = $lObj['series_tag'] ?? ($featured['series_tag'] ?? '');
                if ($sTag) {
                    $safeTag = htmlspecialchars($sTag, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $html = preg_replace('#(<span\b[^>]*\bdata-i18n="homeWebinar.seriesTag"[^>]*>)(.*?)(</span>)#us', '${1}' . $safeTag . '${3}', $html, 1);
                }

                @file_put_contents($idxPath, $html, LOCK_EX);
                $updatedFiles[] = $idxPath;
            }
        }

        return [
            'success' => true,
            'updatedFiles' => $updatedFiles,
            'count' => count($updatedFiles)
        ];
    }
}
