/**
 * Sharif Group - Dynamic Multilingual Blog Article Translation Engine
 * Supported Languages: en (English), ar (Arabic), fa (Persian), zh (Chinese)
 */
(function() {
    'use strict';

    var CATEGORY_MAP = {
        'Sharif Group Insights': {
            'ar': 'رؤى مجموعة شريف',
            'fa': 'دیدگاه‌های شریف گروپ',
            'zh': '谢里夫集团专栏'
        },
        'Citizenship': {
            'ar': 'الجنسية عن طريق الاستثمار',
            'fa': 'شهروندی از طریق سرمایه‌گذاری',
            'zh': '投资入籍项目'
        },
        'Residency': {
            'ar': 'الإقامة عن طريق الاستثمار',
            'fa': 'اقامت از طریق سرمایه‌گذاری',
            'zh': '投资居留项目'
        },
        'Golden Visa': {
            'ar': 'التأشيرة الذهبية',
            'fa': 'ویزای طلایی',
            'zh': '黄金签证'
        },
        'Real Estate': {
            'ar': 'العقارات الفاخرة',
            'fa': 'املاک و مستغلات',
            'zh': '高端房地产'
        },
        'Educational Advisory': {
            'ar': 'الاستشارات التعليمية',
            'fa': 'مشاوره تحصیلی',
            'zh': '教育咨询'
        },
        'Corporate & Tax Strategy': {
            'ar': 'استراتيجيات الشركات والضرائب',
            'fa': 'استراتژی شرکتی و مالیاتی',
            'zh': '企业与税务战略'
        }
    };

    var AUTHOR_MAP = {
        'Sharif Group Advisory Desk': {
            'ar': 'مكتب استشارات مجموعة شريف',
            'fa': 'دپارتمان مشاوره شریف گروپ',
            'zh': '谢里夫集团咨询顾问部'
        }
    };

    var MONTH_MAP = {
        'January': { 'ar': 'يناير', 'fa': 'ژانویه', 'zh': '1月' },
        'February': { 'ar': 'فبراير', 'fa': 'فوریه', 'zh': '2月' },
        'March': { 'ar': 'مارس', 'fa': 'مارس', 'zh': '3月' },
        'April': { 'ar': 'أبريل', 'fa': 'آوریل', 'zh': '4月' },
        'May': { 'ar': 'مايو', 'fa': 'مه', 'zh': '5月' },
        'June': { 'ar': 'يونيو', 'fa': 'ژوئن', 'zh': '6月' },
        'July': { 'ar': 'يوليو', 'fa': 'ژوئیه', 'zh': '7月' },
        'August': { 'ar': 'أغسطس', 'fa': 'اوت', 'zh': '8月' },
        'September': { 'ar': 'سبتمبر', 'fa': 'سپتامبر', 'zh': '9月' },
        'October': { 'ar': 'أكتوبر', 'fa': 'اکتبر', 'zh': '10月' },
        'November': { 'ar': 'نوفمبر', 'fa': 'نوامبر', 'zh': '11月' },
        'December': { 'ar': 'ديسمبر', 'fa': 'دسامبر', 'zh': '12月' }
    };

    function translateDate(dateStr, lang) {
        if (!dateStr || lang === 'en') return dateStr;
        var res = String(dateStr);
        for (var m in MONTH_MAP) {
            if (res.indexOf(m) !== -1) {
                res = res.replace(m, MONTH_MAP[m][lang] || m);
            }
        }
        if (window.localizeNumbers) {
            res = window.localizeNumbers(res, lang);
        }
        return res;
    }

    function translateCategory(cat, lang) {
        if (!cat || lang === 'en') return cat;
        return (CATEGORY_MAP[cat] && CATEGORY_MAP[cat][lang]) || cat;
    }

    function translateAuthor(auth, lang) {
        if (!auth || lang === 'en') return auth;
        return (AUTHOR_MAP[auth] && AUTHOR_MAP[auth][lang]) || auth;
    }

    // Curated rich translations for key flagship articles
    var FULL_ARTICLES = {
        'meet-the-team-behind-sharif-group': {
            'ar': {
                title: 'تعرف على فريق العمل وراء مجموعة شريف',
                content: `
                    <p>إن النجاح والمكانة الدولية المرموقة لمجموعة شريف مبنية على الخبرات المتراكمة لفريق قيادتنا المتفاني، وشركائنا القانونيين المرخصين، وخبراء الامتثال ومستشاري العلاقات الخاصة. يقع مقرنا الرئيسي في الخليج التجاري بدبي، حيث يجمع فريقنا متعدد التخصصات عقوداً من الخبرة المشتركة في القانون الدولي للهجرة، وإدارة الثروات السيادية، والمعاملات العقارية، والاستشارات الضريبية الدولية للشركات. نؤمن بأن التميز الحقيقي في استشارات الهجرة يتطلب المسؤولية الشخصية والتدقيق القانوني الصارم؛ فبدلاً من التعامل مع العملاء كأرقام معاملات، تشرف قيادتنا شخصياً على إعداد كل ملف سيادي لضمان تلبية أهداف العائلة، والهياكل المالية، ومعايير الخصوصية بأعلى درجات الدقة.</p>
                    <p>يتمتع شركاؤنا الكبار بتقدير واسع كشخصيات موثوقة في قطاع الهجرة الاستثمارية، حيث يقدمون استشارات منتظمة للمستثمرين المؤسسيين والمكاتب العائلية والجهات السيادية بشأن اتجاهات التنظيم وحوكمة الامتثال. لقد بنينا علاقات عمل مباشرة مع وحدات الجنسية الحكومية، والقنصليات الدبلوماسية، والبنوك الدولية الكبرى لحسابات الضمان، مما يتيح لنا إزالة العقبات البيروقراطية، وحل الاستفسارات الإدارية بسرعة فائقة، والحفاظ على سجل نجاح واعتمادات رائد لعملائنا في الشرق الأوسط وآسيا وأوروبا وإفريقيا.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">مستشارون مخصصون للعملاء وشركاء قانونيون</h2>
                    <p>يُعيَّن لكل عميل في مجموعة شريف مدير ملفات أول ليكون جهة الاتصال المباشرة طوال مراحل رحلة الهجرة بأكملها. يضم فريقنا الاستشاري كفاءات متعددة اللغات تقدم استشارات بطلاقة باللغات العربية والإنجليزية والروسية والفرنسية والفارسية والهندية والأردية. نحرص على دراسة تفاصيل عائلتك وأهدافك التجارية والتزاماتك الضريبية قبل التوصية بأي برنامج سيادي محدد، سواء كان ذلك لطلب جنسية كاريبية متعدد الأجيال أو الاشتراك في صناديق استثمارية في لشبونة، حيث يضمن مستشارونا إعداد جميع الوثائق بدقة تامة وتقديمها في المواعيد المحددة.</p>
                    <p>تمتد شبكتنا من المحامين الدوليين المرخصين عبر أثينا ولشبونة وبنما سيتي ولندن وشرق الكاريبي. كل محامٍ شريك هو عضو نشط في نقابة المحامين الوطنية في بلده، مما يضمن إتمام عمليات شراء العقارات والاكتتاب في الصناديق وطلبات الجنسية بما يتوافق تماماً مع القوانين والتشريعات المحلية، موفراً لعملائنا عقوداً موثقة وسندات ملكية واضحة وحماية كاملة لرؤوس أموالهم.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">فريق الامتثال الداخلي وخبراء تدقيق المستندات</h2>
                    <p>أحد الركائز الأساسية لنجاحنا التشغيلي هو مكتب الامتثال والتدقيق الداخلي المتخصص لدينا. فقبل إرسال أي ملف إلى الدوائر الحكومية المعنية، يُجري مسؤولو الامتثال تدقيقاً أمنياً وقانونياً شاملاً لكل متقدم باستخدام أحدث أنظمة الفحص وقواعد البيانات الدولية المعتمدة لدى جهات الاستخبارات السيادية، للتحقق من خلو السجل من العقوبات الدولية وتصنيفات الشخصيات السياسية البارزة ومطابقة معايير مكافحة غسل الأموال. يتيح لنا هذا الفحص المسبق حل أي ملاحظات أو استفسارات مبكراً قبل التقديم الرسمي، مما يضمن نسبة القبول المتميزة لملفاتنا.</p>
                    <p>يتولى خبراؤنا إدارة كافة الإجراءات الإدارية واللوجستية المعقدة، بما في ذلك الترجمات القانونية المعتمدة، وتوثيقات الكاتب العدل، وتصديقات وزارة الخارجية (MOFA) والأبوستيل لشهادات الميلاد والزواج وبطاقات خلو السوابق والسجلات التجارية. وعقب صدور الموافقة، يقدم فريقنا رعاية مستمرة لعملائنا تشمل تجديد الجوازات وإضافة المواليد الجدد والمساعدة في فتح الحسابات البنكية الخاصة الدولية.</p>
                `
            },
            'fa': {
                title: 'با تیم متخصص پشت شریف گروپ آشنا شوید',
                content: `
                    <p>موفقیت و اعتبار بین‌المللی شریف گروپ بر پایه تخصص جمعی تیم رهبری متعهد، وکلای رسمی همکار، کارشناسان انطباق قانونی و مشاوران اختصاصی ما شکل گرفته است. تیم چندرشته‌ای ما مستقر در بیزینس بی دبی، دهه‌ها تجربه ارزشمند در حوزه حقوق بین‌الملل مهاجرت، مدیریت ثروت‌های بین‌المللی، معاملات املاک و برنامه‌ریزی مالیاتی شرکت‌ها را گردهم آورده است. ما معتقدیم تعالی در مشاوره مهاجرت مستلزم مسئولیت‌پذیری فردی و دقت بالای حقوقی است؛ بنابراین رهبری مجموعه شخصاً بر آماده‌سازی تک‌تک پرونده‌های شهروندی نظارت می‌کند تا اهداف خانواده، ساختارهای مالی و نیازهای محرمانگی با نهایت دقت برآورده شوند.</p>
                    <p>شرکای ارشد ما به عنوان چهره‌های شناخته‌شده در صنعت مهاجرت سرمایه‌گذاری، همواره به سرمایه‌گذاران نهادی و سازمان‌ها مشاوره می‌دهند. ما روابط کاری مستقیمی با واحدهای رسمی شهروندی دولت‌ها، سفارتخانه‌ها و معتبرترین بانک‌های بین‌المللی ایجاد کرده‌ایم که به ما امکان می‌دهد موانع اداری را برطرف نموده و بالاترین نرخ قبولی پرونده‌ها را برای موکلان خود در خاورمیانه، آسیا، اروپا و آفریقا حفظ نماییم.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">مشاوران اختصاصی موکلان و شرکای حقوقی</h2>
                    <p>برای هر موکل در شریف گروپ یک مدیر پرونده ارشد تعیین می‌شود تا در تمام مراحل مهاجرت به عنوان نقطه تماس مستقیم شما عمل کند. تیم مشاوره ما چندزبانه بوده و به زبان‌های فارسی، عربی، انگلیسی، روسی، فرانسوی، هندی و اردو مسلط است. ما پیش از پیشنهاد هر برنامه، شرایط خاص خانواده، اهداف تجاری بلندمدت و ملاحظات مالیاتی شما را به دقت ارزیابی می‌کنیم تا مدارک به موقع و با بالاترین استانداردها ثبت گردند.</p>
                    <p>شبکه وکلای رسمی بین‌المللی ما در آتن، لیسبون، پاناماسیتی، لندن و حوزه کارائیب شرقی فعال است. تمامی وکلای همکار عضو رسمی کانون وکلای کشورهای خود هستند تا اطمینان حاصل شود که خریدهای ملکی، سرمایه‌گذاری در صندوق‌ها و درخواست‌های شهروندی کاملاً منطبق با قوانین جاری انجام شده و سرمایه شما در امنیت کامل قرار دارد.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">کارشناسان انطباق داخلی و متخصصان مدارک</h2>
                    <p>یکی از ارکان اصلی موفقیت عملیاتی ما، دپارتمان تخصصی انطباق قانونی و بررسی پیشینه است. قبل از ارسال هر پرونده به مراجع دولتی، کارشناسان ما یک بررسی جامع امنیتی بر روی مدارک انجام می‌دهند. این ارزیابی اولیه موجب رفع هرگونه نقص احتمالی پیش از ارسال رسمی شده و قبولی ۱۰۰ درصدی پرونده را تضمین می‌کند.</p>
                    <p>متخصصان اسناد ما تمامی هماهنگی‌های لجستیکی پیچیده از جمله ترجمه رسمی، تایید دادگستری، تصدیق وزارت امور خارجه و آپوستیل مدارک هویتی را مدیریت می‌کنند. پس از صدور پاسپورت و کارت اقامت نیز خدمات پشتیبانی مادام‌العمر شامل تمدید گذرنامه، ثبت فرزندان جدید و تسهیل گشایش حساب‌های بانکی بین‌المللی ارائه می‌گردد.</p>
                `
            },
            'zh': {
                title: '走进谢里夫集团背后的专家团队',
                content: `
                    <p>谢里夫集团卓越的国际声誉与成功，源自我们富有远见的领导层团队、官方持牌法律合伙人、合规审核专员以及全流程尊享顾问的深厚积淀。集团总部设立于阿联酋迪拜商业湾（Business Bay），汇聚跨国移民法律、主权财富管理、海外房地产产权交割及跨境企业税务规划等多元领域的数十年综合实操经验。我们深知，顶尖的投资移民规划需要严谨的专业态度与高度的个人责任心。我们绝不将客户视为冷冰冰的交易数字，集团领导层亲自统筹把关每一份主权申请档案，确保客户家庭的发展目标、资金架构与隐私安全以最高精密度得以落实。</p>
                    <p>我们的资深合伙人是投资移民行业的权威标杆人物，长期为主权基金、家族办公室及高净值投资人提供合规与政策走向顾问。我们与多国政府投资入籍局（CIU）、外交使团领馆以及国际顶级信托银行保持着深度直接合作。这种无缝对接使我们能够消除繁琐的官僚壁垒，快速处理复杂的审批流程，为中东、亚洲、欧洲及非洲的全球尊贵客户保持行业领先的获批率。</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">专属私人顾问与合规法律合伙人</h2>
                    <p>在谢里夫集团，每位尊贵客户均配备一名资深案审专员，作为贯穿整个移民规划周期的唯一直接对接人。我们的咨询顾问团队精通英语、阿拉伯语、波斯语、俄语、法语、印地语和乌尔都语等多国语言。在推荐具体国家项目之前，我们深入调研您的家庭结构、长期商业规划与全球税务需求，确保所有法律文件完备且在约定周期内高效递交。</p>
                    <p>我们的持牌国际律师网络覆盖雅典、里斯本、巴拿马城、伦敦以及东加勒比海域。每位合作律师均为所在国国家律师协会正式注册成员，确保房产购置、基金认购及公民身份申请完全符合当地法定程序，为客户的每一笔核心资本提供全周期产权清晰度与法律安全保障。</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">内部合规风控与文件背调专员</h2>
                    <p>专业独立的内部合规审核部是我们保持无瑕获批纪录的核心基石。在向主权政府部门正式递交档案前，合规专员将使用与国际主权情报机构同级别的全球背调数据库，对所有申请人进行前置尽职调查，排查制裁名单、政治公众人物（PEP）合规及反洗钱（AML）风险，提前化解潜在疑点，确保正式申报万无一失。</p>
                    <p>我们的文件专家全面统筹跨国涉外文件的复杂公证认证链条，包括司法翻译、公证处公证、阿联酋外交部（MOFA）认证及海牙认证（Apostille）。在获批后，我们提供终身礼宾关怀服务，包括5年及10年期护照换发、新生儿血统入籍申报及国际私人银行账户开户引介。</p>
                `
            }
        },
        'what-is-citizenship-by-investment-a-simple-guide': {
            'ar': {
                title: 'ما هي الجنسية عن طريق الاستثمار؟ دليل مبسط',
                content: `
                    <p>الجنسية عن طريق الاستثمار (CBI) هي إجراء قانوني منظم بموجب تشريعات حكومية رسمية، يتيح للأفراد الأجانب وعائلاتهم الحصول على جنسية ثانية دائمة وجواز سفر سيادي معتمد مقابل مساهمة اقتصادية أو استثمار عقاري مؤهل في الدولة المضيفة. وخلافاً لمسارات الهجرة التقليدية التي تتطلب سنوات من الإقامة الفعلية والعمل المتواصل واجتياز اختبارات لغوية معقدة، صُممت برامج الجنسية الاستثمارية لرواد الأعمال والمستثمرين العالميين الراغبين في اكتساب جنسية قانونية سريعة عن بعد دون الحاجة لنقل مقر إقامتهم أو تعطيل أعمالهم اليومية.</p>
                    <p>جميع برامج الجنسية الحقيقية التي تمثلها مجموعة شريف مؤسسة وفق قوانين برلمانية وأحكام دستورية وطنية. هذا يعني أن وضعك القانوني كمواطن دائم مدى الحياة، وسيادي، ومحمي بالكامل ضد التغيرات السياسية أو الحكومية. وبمجرد الموافقة، تتسلم شهادة تجنس أو تسجيل رسمية مختومة بختم الدولة، مما يمنحك أنت وعائلتك حقوقاً مدنية واقتصادية مماثلة للمواطنين الأصليين، كما أن الجنسية قابلة للتوريث بالكامل للأجيال القادمة.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">لماذا تختار العائلات الجنسية عن طريق الاستثمار؟</h2>
                    <p>إن حيازة جواز سفر ثانٍ من دولة محايدة سياسياً وعضو في الكومنولث يغير بشكل جذري حرية السفر والتنقل عالمياً وممارسة الأعمال بحرية. فبدلاً من أسابيع الانتظار للحصول على تأشيرات الدخول، يمنحك جواز السفر الكاريبي أو دول المحيط الهادئ إمكانية السفر بدون تأشيرة أو بتأشيرة عند الوصول إلى أكثر من 140 إلى 155+ دولة، بما في ذلك مراكز مالية كبرى مثل سنغافورة وهونغ كونغ والمملكة المتحدة وسويسرا ومنطقة الشنغن الأوروبية.</p>
                    <p>إلى جانب حرية السفر، تعد الجنسية الثانية أداة لا غنى عنها لحماية الأصول والحفاظ على الثروة العائلية، حيث تتميز هذه الدول بأنظمة ضريبية تنافسية مع 0% ضريبة دخل شخصي على الأرباح الخارجية، وعدم وجود ضرائب على الأرباح الرأسمالية أو الثروات أو المواريث.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">المسارات الاستثمارية المعتمدة</h2>
                    <p>توفر برامج الجنسية مسارات تأهيلية متعددة لتناسب ميزانيات المستثمرين وتفضيلات السيولة لديهم. والمسار الأكثر شيوعاً هو المساهمة المالية المباشرة غير القابلة للاسترداد لصالح الصناديق السيادية الوطنية (مثل صندوق التنويع الاقتصادي في دومينيكا أو مساهمة الدولة المستدامة في سانت كيتس ونيفيس)، وهو الخيار الأسرع والأقل تكلفة بدون أي التزامات لإدارة ممتلكات.</p>
                    <p>أما بالنسبة للمستثمرين الباحثين عن استرداد رأس المال وحيازة أصول ملموسة، فيتيح مسار العقارات المعتمد شراء حصص في منتجعات فاخرة أو فلل خاصة يتم الاحتفاظ بها لمدة تتراوح بين 3 إلى 7 سنوات مع إمكانية تحقيق عوائد إيجارية بالدولار قبل إعادة بيع العقار مع الاحتفاظ بالجنسية مدى الحياة.</p>
                `
            },
            'fa': {
                title: 'شهروندی از طریق سرمایه‌گذاری چیست؟ راهنمای جامع و ساده',
                content: `
                    <p>شهروندی از طریق سرمایه‌گذاری (CBI) یک فرآیند رسمی و قانونی تحت نظارت دولت‌ها است که به سرمایه‌گذاران خارجی و خانواده‌هایشان اجازه می‌دهد در ازای مشارکت اقتصادی یا خرید ملک تایید شده، پاسپورت دوم معتبر دریافت نمایند. این فرآیند بدون نیاز به اقامت فیزیکی یا آزمون‌های سخت زبانی قابل انجام است.</p>
                    <p>تمامی برنامه‌های ارائه‌شده توسط شریف گروپ بر اساس مصوبات رسمی پارلمان کشورها بوده و تابعیت اعطا شده مادام‌العمر و قابل انتقال به نسل‌های آینده است.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">چرا خانواده‌ها اخذ پاسپورت دوم را انتخاب می‌کنند؟</h2>
                    <p>داشتن پاسپورت دوم از کشورهای مشترک‌المنافع، سفر بدون ویزا به بیش از ۱۴۰ تا ۱۵۵ کشور از جمله انگلستان، سوئیس، سنگاپور و حوزه شنگن را فراهم می‌سازد و محدودیت‌های سفر را برطرف می‌نماید.</p>
                    <p>همچنین این کشورها دارای سیستم مالیاتی صفر بر درآمد خارجی، سود سرمایه و ارث هستند که امنیتی استثنایی برای سرمایه شما به ارمغان می‌آورد.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">مسیرهای محبوب سرمایه‌گذاری</h2>
                    <p>مسیر کمک بلاعوض دولتی سریع‌ترین و کم‌هزینه‌ترین شیوه است. همچنین خرید املاک و مستغلات در پروژه‌های لوکس با قابلیت فروش مجدد پس از چند سال، امکان بازگشت اصل سرمایه را میسر می‌سازد.</p>
                `
            },
            'zh': {
                title: '什么是投资入籍（CBI）？极简实用指南',
                content: `
                    <p>投资入籍（Citizenship by Investment, CBI）是指主权国家依据其法定移民法案，允许外国投资者及其直系家庭成员通过向该国做出国家级经济贡献或购置经政府批准的房产，合法直接获批该国永久公民身份与主权护照的官方通道。</p>
                    <p>谢里夫集团代理的所有公民身份项目均受国家宪法与议会法案全力保护，身份终身有效，且代代可传承。</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">全球精英家庭选择第二身份的核心考量</h2>
                    <p>加勒比海或英联邦护照能够免签畅行全球140至155个以上国家和地区，包括英国、瑞士、新加坡、中国香港及欧洲申根区。</p>
                    <p>同时，这些国家无全球征税、无资本利得税、无遗产税，是离岸财富传承与资产配置的理想护城河。</p>
                `
            }
        },
        'about-sharif-group-who-we-are-and-how-we-help': {
            'ar': {
                title: 'عن مجموعة شريف: من نحن وكيف نساعدك',
                content: `
                    <p>مجموعة شريف هي شركة استشارية رائدة في مجال الهجرة الاستثمارية والخدمات الإدارية وتخليص المعاملات السيادية، تأسست وتعمل من قلب الخليج التجاري في دبي، دولة الإمارات العربية المتحدة. نتخصص في تزويد المستثمرين الدوليين ورجال الأعمال والعائلات بحلول موثوقة وقانونية للحصول على الجنسية الثانية، والإقامة الذهبية، والاستثمارات العقارية الفاخرة، والقبول الأكاديمي المرموق. تنطلق رؤيتنا من الإيمان الراسخ بأن حرية التنقل العالمي والأمان المالي هما أثمن استثمار للمستقبل.</p>
                    <p>بفضل خبرتنا الواسعة ومعرفتنا الدقيقة بالتشريعات الدولية، نقدم لعملائنا توجيهاً واضحاً ومباشراً بدون أي غموض أو تعقيدات بيروقراطية. نحن نتعامل مباشرة مع الوحدات الحكومية الرسمية، مما يضمن معالجة ملفك بسرعة وبأعلى درجات الخصوصية والأمان القانوني.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">مسارات حكومية مباشرة ويقين قانوني تام</h2>
                    <p>نحن لا نعتمد على وسطاء غير مرخصين؛ بل نعمل بشكل مباشر كوكلاء معتمدين أو بالتعاون مع مكاتب المحاماة الرائدة في الدول المانحة للجوازات والإقامات. يشمل ذلك برامج الجنسية الكاريبية في دومينيكا وسانت كيتس ونيفيس وأنتيغوا وبربودا وسانت لوسيا وغرينادا، إضافة إلى فانواتو وساو تومي وناورو. كما نوفر مسارات الإقامة الذهبية في البرتغال واليونان وبنما ودولة الإمارات العربية المتحدة.</p>
                    <p>يقوم مستشارونا القانونيون بفحص وتدقيق كل وثيقة قبل التقديم لضمان مطابقتها الكاملة لمتطلبات الدولة المعنية، مما يمنح ملفك أعلى نسب القبول دون تأخير.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">دعم شامل عبر العقارات والإقامة والتعليم</h2>
                    <p>إلى جانب خدمات الجوازات، تملك مجموعة شريف ذراعاً عقارياً مرخصاً في دبي لمساعدة المستثمرين في اختيار أفضل العقارات ذات العوائد الإيجارية المرتفعة، والتي تؤهل المالك للحصول على الإقامة الذهبية لمدة 10 سنوات في الإمارات.</p>
                    <p>كما يقدم مستشارونا التعليميون دعماً استثنائياً لتسجيل أبنائكم في أعرق المدارس والجامعات في بريطانيا وأوروبا وأمريكا، مع الاستفادة من مزايا الجنسية المزدوجة لتخفيض الرسوم الدراسية الجامعية.</p>
                `
            },
            'fa': {
                title: 'درباره شریف گروپ: ما چه کسی هستیم و چگونه کمک می‌کنیم',
                content: `
                    <p>شریف گروپ یکی از برجسته‌ترین شرکت‌های مشاوره مهاجرت سرمایه‌گذاری و پیگیری اسناد رسمی است که در منطقه بیزینس بی دبی فعالیت می‌کند. ما به متقاضیان بین‌المللی و خانواده‌هایشان کمک می‌کنیم تا از مسیرهای قانونی به پاسپورت دوم، اقامت طلایی، خریدهای ملکی مطمئن و پذیرش‌های تحصیلی دست یابند.</p>
                    <p>تیم ما با تسلط کامل بر قوانین بین‌المللی، تمامی مراحل اداری را با نهایت شفافیت و بدون واسطه به انجام می‌رساند تا امنیت سرمایه و آینده فرزندان شما تضمین گردد.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">مسیرهای مستقیم دولتی و اطمینان حقوقی</h2>
                    <p>شریف گروپ به صورت رسمی با واحدهای دولتی صادرکننده شهروندی در حوزه کارائیب، اروپا و اقیانوس آرام همکاری می‌کند. ما شما را در برنامه‌های دومینیکا، سنت کیتس، آنتیگوا، سنت لوسیا، گرنادا، وانواتو و ویزاهای طلایی پرتغال، یونان، پاناما و امارات همراهی می‌نماییم.</p>
                    <p>تمام پرونده‌ها پیش از ثبت نهایی توسط دپارتمان حقوقی ما مورد ارزیابی قرار می‌گیرند تا بالاترین شانس قبولی حاصل شود.</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">پشتیبانی همه‌جانبه در املاک، اقامت و تحصیل</h2>
                    <p>ما همچنین با برخورداری از مجوز رسمی املاک در دبی، شما را در خرید املاک مرغوب با بازدهی بالا و واجد شرایط ویزای طلایی ۱۰ ساله دبی یاری می‌رسانیم.</p>
                    <p>مشاوران آموزشی ما نیز مسیر ثبت‌نام فرزندانتان در برترین مدارس و دانشگاه‌های انگلستان و آمریکا را با تعرفه‌های بومی هموار می‌کنند.</p>
                `
            },
            'zh': {
                title: '关于谢里夫集团：我们是谁以及我们如何提供帮助',
                content: `
                    <p>谢里夫集团是立足于阿联酋迪拜商业湾的顶级主权投资移民与涉外政务咨询机构。我们专注于为全球高净值家族与企业家提供合规第二国籍、欧洲及阿联酋黄金居留签证、优质房产资产配置以及顶级名校留学规划服务。</p>
                    <p>我们秉持高度的法律严谨性与全透明原则，直联各国主权政府审批机构，确保客户家庭的全球资产安全与自由通行权。</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">官方主权直接通道与法治保障</h2>
                    <p>我们业务覆盖多米尼克、圣基茨和尼维斯、安提瓜和巴布达、圣卢西亚、格林纳达等加勒比海权威法案项目，以及葡萄牙、希腊、巴拿马及阿联酋黄金签证。</p>
                    <p>由资深合规律师全程把关背调与材料递交，消除繁琐环节，确保申请高效获批。</p>

                    <h2 class="font-serif text-2xl text-neutral-900 font-bold pt-4">房产配置、黄金居留与国际教育全景协同</h2>
                    <p>依托迪拜土地局持牌经纪资质，精选具备丰厚租金收益与升值空间的优质资产，完美匹配10年黄金居留资格。</p>
                    <p>同时依托英美名校教育资源，协助客户子女以本国生优惠学费入读常春藤与罗素集团名校。</p>
                `
            }
        }
    };

    // Global Cache of Localized Articles
    window.articlesTranslations = window.articlesTranslations || {
        'ar': null,
        'fa': null,
        'zh': null
    };

    var pendingFetches = {};

    function getArticleCandidateUrls(lang) {
        var prefix = '';
        var langScript = document.querySelector('script[src*="language-switcher.js"]') || document.querySelector('script[src*="blog-translator.js"]');
        if (langScript) {
            var src = langScript.getAttribute('src');
            var idx = src.indexOf('assets/');
            if (idx !== -1) {
                prefix = src.substring(0, idx);
            }
        }
        var list = [];
        if (prefix) {
            list.push(prefix + 'assets/locales/articles_' + lang + '.json');
        }
        list.push('/assets/locales/articles_' + lang + '.json');
        list.push('../../assets/locales/articles_' + lang + '.json');
        list.push('../assets/locales/articles_' + lang + '.json');
        list.push('assets/locales/articles_' + lang + '.json');
        return list;
    }

    function loadArticlesDataset(lang, callback) {
        if (!lang || lang === 'en') {
            if (callback) callback({});
            return;
        }
        if (window.articlesTranslations[lang]) {
            if (callback) callback(window.articlesTranslations[lang]);
            return;
        }
        if (pendingFetches[lang]) {
            if (callback) pendingFetches[lang].push(callback);
            return;
        }

        pendingFetches[lang] = callback ? [callback] : [];

        var BLOG_I18N_VERSION = '20260921_v15';
        var candidates = getArticleCandidateUrls(lang);
        var index = 0;

        function tryNext() {
            if (index >= candidates.length) {
                var cbs = pendingFetches[lang] || [];
                delete pendingFetches[lang];
                cbs.forEach(function(cb) { cb(null); });
                return;
            }
            var url = candidates[index++];
            var fetchUrl = url + (url.indexOf('?') === -1 ? '?v=' + BLOG_I18N_VERSION : '&v=' + BLOG_I18N_VERSION);
            fetch(fetchUrl)
                .then(function(res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(function(data) {
                    window.articlesTranslations[lang] = data;
                    var cbs = pendingFetches[lang] || [];
                    delete pendingFetches[lang];
                    cbs.forEach(function(cb) { cb(data); });

                    // If user is currently looking at an article, refresh it!
                    if (window.currentActiveArticleSlug && typeof window.openBlogDetailBySlug === 'function') {
                        var cur = (window.getCurrentLanguage && window.getCurrentLanguage()) || getStoredOrInitialLang();
                        if (cur === lang) {
                            window.openBlogDetailBySlug(window.currentActiveArticleSlug, true);
                        }
                    }
                })
                .catch(function() {
                    tryNext();
                });
        }

        tryNext();
    }

    function getStoredOrInitialLang() {
        if (typeof window.getCurrentLanguage === 'function') {
            var cl = window.getCurrentLanguage();
            if (cl && cl !== 'en') return cl;
        }
        try {
            var pathname = (window.location && window.location.pathname) ? window.location.pathname : '';
            var segments = pathname.split('/').filter(Boolean);
            if (segments.length > 0) {
                var first = segments[0].toLowerCase();
                if (first === 'ar' || first === 'fa' || first === 'zh' || first === 'en') {
                    return first;
                }
            }
            var stored = localStorage.getItem('sharif_lang') || localStorage.getItem('sharif_preferred_lang');
            if (stored) {
                var l = String(stored).toLowerCase().trim();
                if (l === 'ar' || l === 'arabic') return 'ar';
                if (l === 'fa' || l === 'persian') return 'fa';
                if (l === 'zh' || l === 'chinese' || l === 'zh-hans' || l === 'zh-cn') return 'zh';
            }
        } catch (e) {}
        if (document.documentElement.lang && document.documentElement.lang !== 'en') {
            var dl = document.documentElement.lang.toLowerCase().trim();
            if (dl === 'ar' || dl === 'fa' || dl === 'zh') return dl;
        }
        return 'en';
    }

    // Preload articles dataset for active language immediately
    try {
        var initialLang = getStoredOrInitialLang();
        if (initialLang && initialLang !== 'en') {
            loadArticlesDataset(initialLang);
        }
        // Also queue preloading for remaining languages in background
        setTimeout(function() {
            ['ar', 'zh', 'fa'].forEach(function(l) {
                if (l !== initialLang) loadArticlesDataset(l);
            });
        }, 150);
    } catch(e) {}

    // Listen to language changes
    window.addEventListener('languageChanged', function(e) {
        var newLang = (e.detail && e.detail.lang) || (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
        if (newLang && newLang !== 'en') {
            loadArticlesDataset(newLang, function() {
                if (window.currentActiveArticleSlug && typeof window.openBlogDetailBySlug === 'function') {
                    window.openBlogDetailBySlug(window.currentActiveArticleSlug, true);
                }
            });
        }
    });

    function cleanArticleImageUrl(img, fallback) {
        if (!img || typeof img !== 'string') return fallback || '';
        var s = img.trim();
        var m = s.match(/\((https?:\/\/[^\s\)]+)\)/i) || s.match(/\[(https?:\/\/[^\]]+)\]/i);
        if (m) s = m[1];
        s = s.replace(/\\([_&])/g, '$1');
        return s || fallback || '';
    }

    function resolveArticleImage(artImg, baseImg) {
        if (baseImg && typeof baseImg === 'string' && baseImg.trim()) {
            var b = baseImg.trim();
            if (b.startsWith('http') || b.startsWith('/') || b.startsWith('../') || b.endsWith('.png') || b.endsWith('.jpg') || b.endsWith('.webp') || b.endsWith('.svg')) {
                return b;
            }
        }
        return cleanArticleImageUrl(artImg, baseImg || '');
    }

    // Expose Global Resolver
    window.getLocalizedArticleData = function(slug, lang) {
        var base = (window.articlesDatabase && window.articlesDatabase[slug]) 
                || (typeof articlesDatabase !== 'undefined' && articlesDatabase[slug]) 
                || null;

        var curLang = lang || (window.getCurrentLanguage ? window.getCurrentLanguage() : getStoredOrInitialLang());
        if (curLang === 'en') return base;

        // 0. Check dynamic CMS blog storage first
        try {
            var localBlogs = JSON.parse(localStorage.getItem('sgcms_blog') || '[]');
            var foundCms = localBlogs.find(function(b) {
                return b.slug === slug || b.id === slug || (b.en && b.en.slug === slug);
            });
            if (foundCms) {
                var ldCms = (foundCms[curLang] && (foundCms[curLang].title || foundCms[curLang].body)) ? foundCms[curLang] : (foundCms.en || foundCms);
                var curFaqs = (ldCms.faqs && Array.isArray(ldCms.faqs) && ldCms.faqs.length)
                    ? ldCms.faqs
                    : ((foundCms[curLang] && Array.isArray(foundCms[curLang].faqs) && foundCms[curLang].faqs.length) ? foundCms[curLang].faqs
                    : ((foundCms.en && Array.isArray(foundCms.en.faqs) && foundCms.en.faqs.length) ? foundCms.en.faqs
                    : (foundCms.faqs || (base && base.faqs) || [])));
                return {
                    title: ldCms.title || (foundCms.en && foundCms.en.title) || (base && base.title) || 'Article',
                    category: translateCategory(foundCms.category || (base && base.category) || 'Citizenship', curLang),
                    author: translateAuthor(foundCms.author || (base && base.author) || 'Sharif Group Advisory Desk', curLang),
                    date: translateDate(foundCms.publish_date || (base && base.date) || '', curLang),
                    updated: translateDate(foundCms.publish_date || (base && base.updated) || '', curLang),
                    image: resolveArticleImage(foundCms.featured_img, (base && base.image) || ''),
                    content: ldCms.body || (foundCms.en && foundCms.en.body) || (base && base.content) || '',
                    faqs: curFaqs
                };
            }
        } catch(e) {}

        // 1. Check loaded articles dataset
        var store = window.articlesTranslations && window.articlesTranslations[curLang];
        if (store && store[slug]) {
            var art = store[slug];
            return {
                title: art.title || (base && base.title) || '',
                category: art.category || translateCategory(base && base.category, curLang),
                author: art.author || translateAuthor(base && base.author, curLang),
                date: art.date || translateDate(base && base.date, curLang),
                updated: art.updated || translateDate(base && base.updated, curLang),
                image: resolveArticleImage(art.image, base && base.image),
                content: art.content || (base && base.content) || '',
                faqs: art.faqs || (base && base.faqs) || []
            };
        }

        // 2. Check curated translations
        if (FULL_ARTICLES[slug] && FULL_ARTICLES[slug][curLang]) {
            var cur = FULL_ARTICLES[slug][curLang];
            return {
                title: cur.title || (base && base.title) || '',
                category: translateCategory(base && base.category, curLang),
                author: translateAuthor(base && base.author, curLang),
                date: translateDate(base && base.date, curLang),
                updated: translateDate(base && base.updated, curLang),
                image: resolveArticleImage(cur.image, base && base.image),
                content: cur.content || (base && base.content) || '',
                faqs: cur.faqs || (base && base.faqs) || []
            };
        }

        // 3. Trigger asynchronous load so it re-renders immediately upon arrival
        loadArticlesDataset(curLang);

        if (!base) return null;

        // Fallback: title, author, category, dates translated; content returned clean
        var locTitle = base.title;
        var locales = window.translationsCache || {};
        if (locales[curLang] && locales[curLang].blog && locales[curLang].blog.articles && locales[curLang].blog.articles[slug]) {
            locTitle = locales[curLang].blog.articles[slug].title || base.title;
        }

        return {
            title: locTitle,
            category: translateCategory(base.category, curLang),
            author: translateAuthor(base.author, curLang),
            date: translateDate(base.date, curLang),
            updated: translateDate(base.updated, curLang),
            image: base.image,
            content: base.content,
            faqs: base.faqs
        };
    };

    // =========================================================================
    // STANDALONE / STATIC BLOG ARTICLE PAGE TRANSLATOR
    // Automatically translates blog/<slug>/index.html pages into AR / FA / ZH
    // =========================================================================
    var originalStaticData = null;

    function getArticleSlugFromPath() {
        var path = (window.location && window.location.pathname) ? window.location.pathname : '';
        path = path.replace(/index\.html$/i, '').replace(/\/+$/, '');
        var parts = path.split('/').filter(Boolean);
        var blogIdx = parts.indexOf('blog');
        if (blogIdx !== -1 && parts.length > blogIdx + 1) {
            var slug = parts[blogIdx + 1].toLowerCase().trim();
            if (slug && slug !== 'index' && slug !== 'index.html') {
                return slug;
            }
        }
        var canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && canonical.href) {
            var m = canonical.href.match(/\/blog\/([a-z0-9-]+)/i);
            if (m && m[1] && m[1] !== 'blog') {
                return m[1].toLowerCase().trim();
            }
        }
        return null;
    }

    function sanitizeLocalizedText(text, lang) {
        if (!text || typeof text !== 'string') return text;
        if (lang === 'ar') {
            return text
                .replace(/Sharif Group Advisory Desk/gi, 'مكتب استشارات مجموعة شريف')
                .replace(/Sharif Group Dubai/gi, 'مجموعة شريف دبي')
                .replace(/SHARIF GROUP/g, 'مجموعة شريف')
                .replace(/Sharif Group/gi, 'مجموعة شريف')
                .replace(/\bSharif\b/g, 'شريف');
        } else if (lang === 'fa') {
            return text
                .replace(/Sharif Group Advisory Desk/gi, 'میز مشاوره شریف گروپ')
                .replace(/Sharif Group Dubai/gi, 'شریف گروپ دبی')
                .replace(/SHARIF GROUP/g, 'شریف گروپ')
                .replace(/Sharif Group/gi, 'شریف گروپ')
                .replace(/\bSharif\b/g, 'شریف');
        } else if (lang === 'zh') {
            return text
                .replace(/Sharif Group Advisory Desk/gi, '谢里夫集团咨询顾问部')
                .replace(/Sharif Group Dubai/gi, '谢里夫集团迪拜')
                .replace(/SHARIF GROUP/g, '谢里夫集团')
                .replace(/Sharif Group/gi, '谢里夫集团')
                .replace(/\bSharif\b/g, '谢里夫');
        }
        return text;
    }

    function captureOriginalStaticContent() {
        if (originalStaticData) return;
        var h1 = document.querySelector('main h1');
        var contentEl = document.querySelector('.article-content');
        if (!h1 || !contentEl) return;

        var catEl = document.querySelector('#detail-category-badge');
        var breadcrumbNav = document.querySelector('main nav');
        var breadcrumbHome = breadcrumbNav ? breadcrumbNav.querySelector('a[href="/"]') : null;
        var breadcrumbBlog = breadcrumbNav ? breadcrumbNav.querySelector('a[href="/blog/"]') : null;
        var breadcrumbTitle = breadcrumbNav ? breadcrumbNav.querySelector('span.text-luxury-gold') : null;
        var metaBar = document.querySelector('main .space-y-4 .flex.flex-wrap');
        var authorEl = metaBar ? metaBar.querySelector('span:nth-child(1) span') : null;
        var dateEl = metaBar ? metaBar.querySelector('span:nth-child(2) span') : null;
        var updatedEl = metaBar ? metaBar.querySelector('span:nth-child(3) span') : null;

        var faqs = [];
        for (var i = 0; i < 30; i++) {
            var btn = document.querySelector('button[onclick*="faq-dyn-' + i + '"]');
            var ansP = document.querySelector('#content-faq-dyn-' + i + ' p');
            if (btn && ansP) {
                var qSpan = btn.querySelector('span:first-child');
                faqs.push({
                    idx: i,
                    q: qSpan ? qSpan.textContent.trim() : '',
                    a: ansP.textContent.trim()
                });
            }
        }

        var faqSection = document.querySelector('.pt-12.border-t.border-neutral-200');
        var faqHeaderData = null;
        if (faqSection) {
            var deskBadge = faqSection.querySelector('span.text-luxury-gold');
            var faqH2 = faqSection.querySelector('h2');
            var faqDesc = faqSection.querySelector('p.text-neutral-500');
            faqHeaderData = {
                badgeHtml: deskBadge ? deskBadge.innerHTML : '',
                h2: faqH2 ? faqH2.textContent.trim() : '',
                desc: faqDesc ? faqDesc.textContent.trim() : ''
            };
        }

        // Capture Related Articles section
        var relSection = document.querySelector('div.pt-16.border-t.border-neutral-200\\/80.space-y-8') ||
                         document.querySelector('#related-articles-section') ||
                         (function() {
                             var h2s = document.querySelectorAll('main h2');
                             for (var k = 0; k < h2s.length; k++) {
                                 var txt = h2s[k].textContent.toLowerCase();
                                 if (txt.includes('related advisory guides') || txt.includes('أدلة استشارية') || txt.includes('راهنماهای مشاوره‌ای') || txt.includes('相关咨询指南')) {
                                     return h2s[k].closest('.space-y-8') || h2s[k].parentElement.parentElement;
                                 }
                             }
                             return null;
                         })();

        var relatedData = null;
        if (relSection) {
            var relBadge = relSection.querySelector('span.text-luxury-gold');
            var relH2 = relSection.querySelector('h2');
            var relCards = relSection.querySelectorAll('article, .blog-item');
            var cardList = [];
            relCards.forEach(function(card) {
                var catEl = card.querySelector('.text-\\[\\#786142\\]') || card.querySelector('.text-luxury-gold.uppercase') || card.querySelector('div.text-\\[11px\\]');
                var titleEl = card.querySelector('h3');
                var linkEl = card.querySelector('a[href*="/blog/"]');
                var imgEl = card.querySelector('img');
                var href = linkEl ? linkEl.getAttribute('href') : '';
                var m = href.match(/\/blog\/([^\/]+)/);
                cardList.push({
                    slug: m ? m[1] : '',
                    cat: catEl ? catEl.textContent.trim() : '',
                    title: titleEl ? titleEl.textContent.trim() : '',
                    alt: imgEl ? imgEl.getAttribute('alt') : '',
                    btn: linkEl ? linkEl.textContent.trim() : ''
                });
            });
            relatedData = {
                badge: relBadge ? relBadge.textContent.trim() : '',
                heading: relH2 ? relH2.textContent.trim() : '',
                cards: cardList
            };
        }

        originalStaticData = {
            docTitle: document.title,
            title: h1.textContent.trim(),
            breadcrumbHome: breadcrumbHome ? breadcrumbHome.textContent.trim() : 'Home',
            breadcrumbBlog: breadcrumbBlog ? breadcrumbBlog.textContent.trim() : 'Blog',
            breadcrumb: breadcrumbTitle ? breadcrumbTitle.textContent.trim() : h1.textContent.trim(),
            category: catEl ? catEl.textContent.trim() : '',
            author: authorEl ? authorEl.textContent.trim() : '',
            date: dateEl ? dateEl.textContent.trim() : '',
            updated: updatedEl ? updatedEl.textContent.trim() : '',
            content: contentEl.innerHTML,
            faqs: faqs,
            faqHeader: faqHeaderData,
            related: relatedData
        };
    }

    function translateStaticArticlePage(lang) {
        var slug = getArticleSlugFromPath();
        if (!slug) return;

        var contentEl = document.querySelector('.article-content');
        var h1 = document.querySelector('main h1');
        if (!contentEl || !h1) return;

        captureOriginalStaticContent();

        var curLang = lang || (window.getCurrentLanguage ? window.getCurrentLanguage() : getStoredOrInitialLang());

        // Helper to locate the Related Advisory Guides container
        function getRelatedSection() {
            return document.querySelector('div.pt-16.border-t.border-neutral-200\\/80.space-y-8') ||
                   document.querySelector('#related-articles-section') ||
                   (function() {
                       var h2s = document.querySelectorAll('main h2');
                       for (var k = 0; k < h2s.length; k++) {
                           var txt = h2s[k].textContent.toLowerCase();
                           if (txt.includes('related advisory guides') || txt.includes('أدلة استشارية') || txt.includes('راهنماهای مشاوره‌ای') || txt.includes('相关咨询指南')) {
                               return h2s[k].closest('.space-y-8') || h2s[k].parentElement.parentElement;
                           }
                       }
                       return null;
                   })();
        }

        // If English, restore original content
        if (curLang === 'en') {
            if (originalStaticData) {
                document.title = originalStaticData.docTitle;
                h1.textContent = originalStaticData.title;

                var breadcrumbNav = document.querySelector('main nav');
                if (breadcrumbNav) {
                    var bHome = breadcrumbNav.querySelector('a[href="/"]');
                    var bBlog = breadcrumbNav.querySelector('a[href="/blog/"]');
                    var bTitle = breadcrumbNav.querySelector('span.text-luxury-gold');
                    if (bHome) bHome.textContent = originalStaticData.breadcrumbHome || 'Home';
                    if (bBlog) bBlog.textContent = originalStaticData.breadcrumbBlog || 'Blog';
                    if (bTitle) bTitle.textContent = originalStaticData.breadcrumb;
                }

                var catEl = document.querySelector('#detail-category-badge');
                if (catEl) catEl.textContent = originalStaticData.category;

                var metaBar = document.querySelector('main .space-y-4 .flex.flex-wrap');
                if (metaBar) {
                    var authorEl = metaBar.querySelector('span:nth-child(1) span');
                    var dateEl = metaBar.querySelector('span:nth-child(2) span');
                    var updatedEl = metaBar.querySelector('span:nth-child(3) span');
                    if (authorEl) authorEl.textContent = originalStaticData.author;
                    if (dateEl) dateEl.textContent = originalStaticData.date;
                    if (updatedEl) updatedEl.textContent = originalStaticData.updated;
                }
                contentEl.innerHTML = originalStaticData.content;

                var backLink = document.querySelector('main a[href="/blog/"]');
                if (backLink) backLink.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back to All Articles';

                // Restore FAQ Header
                var faqSection = document.querySelector('.pt-12.border-t.border-neutral-200');
                if (faqSection && originalStaticData.faqHeader) {
                    var deskBadge = faqSection.querySelector('span.text-luxury-gold');
                    if (deskBadge && originalStaticData.faqHeader.badgeHtml) deskBadge.innerHTML = originalStaticData.faqHeader.badgeHtml;
                    var faqH2 = faqSection.querySelector('h2');
                    if (faqH2 && originalStaticData.faqHeader.h2) faqH2.textContent = originalStaticData.faqHeader.h2;
                    var faqDesc = faqSection.querySelector('p.text-neutral-500');
                    if (faqDesc && originalStaticData.faqHeader.desc) faqDesc.textContent = originalStaticData.faqHeader.desc;
                }

                // Restore FAQs
                if (originalStaticData.faqs && originalStaticData.faqs.length) {
                    originalStaticData.faqs.forEach(function(f) {
                        var btn = document.querySelector('button[onclick*="faq-dyn-' + f.idx + '"]');
                        if (btn) {
                            var qSpan = btn.querySelector('span:first-child');
                            if (qSpan) qSpan.textContent = f.q;
                        }
                        var ansP = document.querySelector('#content-faq-dyn-' + f.idx + ' p');
                        if (ansP) ansP.textContent = f.a;
                    });
                }

                // Restore Related Advisory Guides
                var relSec = getRelatedSection();
                if (relSec && originalStaticData.related) {
                    var rBadge = relSec.querySelector('span.text-luxury-gold');
                    if (rBadge) rBadge.textContent = originalStaticData.related.badge;
                    var rH2 = relSec.querySelector('h2');
                    if (rH2) rH2.textContent = originalStaticData.related.heading;

                    var rCards = relSec.querySelectorAll('article, .blog-item');
                    rCards.forEach(function(card, idx) {
                        var origCard = originalStaticData.related.cards[idx];
                        if (!origCard) return;
                        var cCat = card.querySelector('.text-\\[\\#786142\\]') || card.querySelector('.text-luxury-gold.uppercase') || card.querySelector('div.text-\\[11px\\]');
                        if (cCat) cCat.textContent = origCard.cat;
                        var cTitle = card.querySelector('h3');
                        if (cTitle) cTitle.textContent = origCard.title;
                        var cImg = card.querySelector('img');
                        if (cImg && origCard.alt) cImg.setAttribute('alt', origCard.alt);
                        var cBtn = card.querySelector('a[href*="/blog/"]');
                        if (cBtn) cBtn.textContent = origCard.btn;
                    });
                }
            }
            return;
        }

        // Apply translations for target language
        function applyData(dataset) {
            var baseArt = (dataset && dataset[slug]) || null;
            var curatedArt = (FULL_ARTICLES[slug] && FULL_ARTICLES[slug][curLang]) || null;

            // 1. Title
            var transTitle = (curatedArt && curatedArt.title) || (baseArt && baseArt.title);
            if (transTitle) {
                transTitle = sanitizeLocalizedText(transTitle, curLang);
                h1.textContent = transTitle;
                var brandSuffix = curLang === 'ar' ? ' | مجموعة شريف دبي' : (curLang === 'fa' ? ' | شریف گروپ دبی' : (curLang === 'zh' ? ' | 谢里夫集团迪拜' : ' | Sharif Group'));
                document.title = transTitle + brandSuffix;

                var breadcrumbNav = document.querySelector('main nav');
                if (breadcrumbNav) {
                    var bHome = breadcrumbNav.querySelector('a[href="/"]');
                    var bBlog = breadcrumbNav.querySelector('a[href="/blog/"]');
                    var bTitle = breadcrumbNav.querySelector('span.text-luxury-gold');
                    if (bHome) {
                        var homeMap = { 'ar': 'الرئيسية', 'fa': 'صفحه اصلی', 'zh': '首页' };
                        bHome.textContent = homeMap[curLang] || 'Home';
                    }
                    if (bBlog) {
                        var blogMap = { 'ar': 'المدونة', 'fa': 'وبلاگ', 'zh': '博客' };
                        bBlog.textContent = blogMap[curLang] || 'Blog';
                    }
                    if (bTitle) bTitle.textContent = transTitle;
                }
            }

            // 2. Category
            var catEl = document.querySelector('#detail-category-badge');
            if (catEl) {
                var rawCat = (baseArt && baseArt.category) || (originalStaticData ? originalStaticData.category : '');
                var translatedCat = translateCategory(rawCat, curLang);
                if (translatedCat) catEl.textContent = sanitizeLocalizedText(translatedCat, curLang);
            }

            // 3. Meta (Author, Date, Updated)
            var metaBar = document.querySelector('main .space-y-4 .flex.flex-wrap');
            if (metaBar) {
                var authorEl = metaBar.querySelector('span:nth-child(1) span');
                var dateEl = metaBar.querySelector('span:nth-child(2) span');
                var updatedEl = metaBar.querySelector('span:nth-child(3) span');
                if (authorEl) {
                    var rawAuthor = (baseArt && baseArt.author) || (originalStaticData ? originalStaticData.author : '');
                    var transAuthor = translateAuthor(rawAuthor, curLang);
                    if (transAuthor) authorEl.textContent = sanitizeLocalizedText(transAuthor, curLang);
                }
                if (dateEl) {
                    var rawDate = (baseArt && baseArt.date) || (originalStaticData ? originalStaticData.date : '');
                    var transDate = translateDate(rawDate, curLang);
                    if (transDate) dateEl.textContent = transDate;
                }
                if (updatedEl) {
                    var rawUpdated = (baseArt && baseArt.updated) || (originalStaticData ? originalStaticData.updated : '');
                    var transUpdated = translateDate(rawUpdated, curLang);
                    if (transUpdated) {
                        var updatedPrefix = curLang === 'ar' ? 'آخر تحديث: ' : (curLang === 'fa' ? 'آخرین به‌روزرسانی: ' : (curLang === 'zh' ? '最近更新：' : 'Last Updated: '));
                        updatedEl.textContent = updatedPrefix + transUpdated;
                    }
                }
            }

            // 4. Content HTML
            var contentHtml = (curatedArt && curatedArt.content) || (baseArt && baseArt.content);
            if (contentHtml && contentHtml.trim()) {
                contentEl.innerHTML = sanitizeLocalizedText(contentHtml, curLang);
            }

            // 5. Back link
            var backLink = document.querySelector('main a[href="/blog/"]');
            if (backLink) {
                var arrowIcon = (curLang === 'ar' || curLang === 'fa') ? 'fa-arrow-right' : 'fa-arrow-left';
                var backText = curLang === 'ar' ? 'العودة إلى جميع المقالات' : (curLang === 'fa' ? 'بازگشت به همه مقالات' : (curLang === 'zh' ? '返回所有文章' : 'Back to All Articles'));
                backLink.innerHTML = '<i class="fa-solid ' + arrowIcon + '"></i> ' + backText;
            }

            // 6. FAQ Header
            var faqSection = document.querySelector('.pt-12.border-t.border-neutral-200');
            if (faqSection) {
                var deskBadge = faqSection.querySelector('span.text-luxury-gold');
                if (deskBadge) {
                    var badgeText = curLang === 'ar' ? 'إجابات الخبراء' : (curLang === 'fa' ? 'پاسخ‌های کارشناسان' : (curLang === 'zh' ? '专家解答' : 'Desk Answers'));
                    deskBadge.innerHTML = '<i class="fa-regular fa-circle-question"></i> ' + badgeText;
                }
                var faqH2 = faqSection.querySelector('h2');
                if (faqH2) {
                    var h2Text = curLang === 'ar' ? 'الأسئلة الشائعة ونزاهة البرامج' : (curLang === 'fa' ? 'سوالات متداول و سلامت برنامه‌ها' : (curLang === 'zh' ? '常见问题解答与合规标准' : 'Program Integrity & FAQs'));
                    faqH2.textContent = h2Text;
                }
                var faqDesc = faqSection.querySelector('p.text-neutral-500');
                if (faqDesc) {
                    var descText = curLang === 'ar' ? 'إجابات واضحة وشاملة حول المعايير القانونية والاستثمارية والإقامة' : (curLang === 'fa' ? 'پاسخ‌های شفاف و جامع درباره معیارهای قانونی، سرمایه‌گذاری و اقامت' : (curLang === 'zh' ? '针对法律、投资和居留参数的清晰全面解答' : 'Clear and comprehensive answers regarding legal, investment, and residency parameters'));
                    faqDesc.textContent = descText;
                }
            }

            // 7. ALL FAQs (Always apply full list from baseArt.faqs)
            var faqsToApply = (baseArt && Array.isArray(baseArt.faqs) && baseArt.faqs.length) ? baseArt.faqs : ((curatedArt && curatedArt.faqs) || []);
            if (Array.isArray(faqsToApply) && faqsToApply.length) {
                faqsToApply.forEach(function(faq, idx) {
                    var btn = document.querySelector('button[onclick*="faq-dyn-' + idx + '"]');
                    if (btn) {
                        var qSpan = btn.querySelector('span:first-child');
                        if (qSpan && faq.q) qSpan.textContent = sanitizeLocalizedText(faq.q, curLang);
                    }
                    var ansP = document.querySelector('#content-faq-dyn-' + idx + ' p');
                    if (ansP && faq.a) ansP.textContent = sanitizeLocalizedText(faq.a, curLang);
                });
            }

            // 8. Related Advisory Guides Section
            var relSec = getRelatedSection();
            if (relSec) {
                var rBadge = relSec.querySelector('span.text-luxury-gold');
                if (rBadge) {
                    var BADGE_TEXTS = {
                        'ar': 'قراءات موصى بها',
                        'fa': 'مطالعه پیشنهادی',
                        'zh': '推荐阅读'
                    };
                    rBadge.textContent = BADGE_TEXTS[curLang] || 'Recommended Reading';
                }

                var rH2 = relSec.querySelector('h2');
                if (rH2) {
                    var HEADING_TEXTS = {
                        'ar': 'أدلة استشارية ذات صلة',
                        'fa': 'راهنماهای مشاوره‌ای مرتبط',
                        'zh': '相关咨询指南'
                    };
                    rH2.textContent = HEADING_TEXTS[curLang] || 'Related Advisory Guides';
                }

                var rCards = relSec.querySelectorAll('article, .blog-item');
                var READ_MORE_TEXTS = {
                    'ar': 'اقرأ المزيد',
                    'fa': 'بیشتر بخوانید',
                    'zh': '阅读全文'
                };
                var readMoreText = READ_MORE_TEXTS[curLang] || 'READ MORE';

                rCards.forEach(function(card, cIdx) {
                    var linkEl = card.querySelector('a[href*="/blog/"]');
                    var href = linkEl ? linkEl.getAttribute('href') : '';
                    var m = href.match(/\/blog\/([^\/]+)/);
                    var cardSlug = m ? m[1] : '';

                    // Category
                    var catEl = card.querySelector('.text-\\[\\#786142\\]') || card.querySelector('.text-luxury-gold.uppercase') || card.querySelector('div.text-\\[11px\\]');
                    if (catEl) {
                        var rawCat = (originalStaticData && originalStaticData.related && originalStaticData.related.cards[cIdx]) ? originalStaticData.related.cards[cIdx].cat : catEl.textContent.trim();
                        var transCat = translateCategory(rawCat, curLang);
                        if (transCat) catEl.textContent = sanitizeLocalizedText(transCat, curLang);
                    }

                    // Title & Image Alt
                    var titleEl = card.querySelector('h3');
                    var imgEl = card.querySelector('img');
                    var cardTitle = null;
                    if (dataset && dataset[cardSlug] && dataset[cardSlug].title) {
                        cardTitle = dataset[cardSlug].title;
                    } else if (FULL_ARTICLES[cardSlug] && FULL_ARTICLES[cardSlug][curLang] && FULL_ARTICLES[cardSlug][curLang].title) {
                        cardTitle = FULL_ARTICLES[cardSlug][curLang].title;
                    } else if (window.getTranslation) {
                        cardTitle = window.getTranslation('blog.articles.' + cardSlug + '.title', curLang);
                    }
                    if (cardTitle) {
                        cardTitle = sanitizeLocalizedText(cardTitle, curLang);
                        if (titleEl) titleEl.textContent = cardTitle;
                        if (imgEl) imgEl.setAttribute('alt', cardTitle);
                    }

                    // Read More Button
                    if (linkEl) {
                        linkEl.textContent = readMoreText;
                    }
                });
            }
        }

        // 1. If we already have dataset cached, apply immediately!
        var store = window.articlesTranslations && window.articlesTranslations[curLang];
        if (store) {
            applyData(store);
            return;
        }

        // 2. If curated content is available, apply immediately for instant zero-delay rendering
        if (FULL_ARTICLES[slug] && FULL_ARTICLES[slug][curLang]) {
            applyData(null);
        }

        // 3. Always fetch and ensure full dataset is loaded, then apply complete faqs & related guides
        loadArticlesDataset(curLang, function(dataset) {
            if (dataset) {
                applyData(dataset);
            }
        });
    }

    // Auto-init for static blog article page
    function initStaticBlogTranslator() {
        var slug = getArticleSlugFromPath();
        if (!slug) return;

        var curLang = (window.getCurrentLanguage ? window.getCurrentLanguage() : null) || getStoredOrInitialLang();
        if (curLang && curLang !== 'en') {
            translateStaticArticlePage(curLang);
        }

        // Listen for language switch
        window.addEventListener('languageChanged', function(e) {
            var newLang = (e.detail && e.detail.lang) || (window.getCurrentLanguage && window.getCurrentLanguage()) || 'en';
            translateStaticArticlePage(newLang);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStaticBlogTranslator);
    } else {
        initStaticBlogTranslator();
    }

})();

