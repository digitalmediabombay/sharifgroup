// --- CENTRAL FORM & CRM DISPATCH CONTROLLER ---

const CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzNChoriTzyurl89bGCiTsJW1BX9SB1gaIWLF7cxhJw-LvCoGj55idtWEoSQe_yG32d/exec"; 

// 1. Country Dial Code Dropdown Toggle & Filter
const DEFAULT_COUNTRY_CODES = [
	{ code: "+971", flag: "🇦🇪", name: "United Arab Emirates", aliases: ["امارات", "الامارات", "الإمارات", "دبی", "دبي", "ابوظبی", "أبوظبي", "uae", "emirates", "united arab emirates", "dubai", "阿联酋", "迪拜"] },
	{ code: "+93", flag: "🇦🇫", name: "Afghanistan", aliases: ["افغانستان", "أفغانستان", "阿富汗", "afghanistan", "afghan"] },
	{ code: "+355", flag: "🇦🇱", name: "Albania" },
	{ code: "+213", flag: "🇩🇿", name: "Algeria", aliases: ["الجزایر", "الجزائر", "algeria", "algiers", "阿尔及利亚"] },
	{ code: "+376", flag: "🇦🇩", name: "Andorra" },
	{ code: "+244", flag: "🇦🇴", name: "Angola" },
	{ code: "+1-268", flag: "🇦🇬", name: "Antigua and Barbuda", aliases: ["آنتیگوا", "أنتيغوا", "antigua", "barbuda", "安提瓜"] },
	{ code: "+54", flag: "🇦🇷", name: "Argentina", aliases: ["آرژانتین", "الأرجنتين", "argentina", "buenos aires", "بوئنوس آیرس", "بوينس آيرس", "阿根廷"] },
	{ code: "+374", flag: "🇦🇲", name: "Armenia", aliases: ["ارمنستان", "أرمينيا", "armenia", "yerevan", "ایروان", "يريفان", "亚美尼亚"] },
	{ code: "+61", flag: "🇦🇺", name: "Australia", aliases: ["استرالیا", "استراليا", "أستراليا", "australia", "sydney", "melbourne", "澳大利亚", "澳洲"] },
	{ code: "+43", flag: "🇦🇹", name: "Austria", aliases: ["اتریش", "النمسا", "austria", "austrian", "vienna", "وین", "فيينا", "奥地利"] },
	{ code: "+994", flag: "🇦🇿", name: "Azerbaijan", aliases: ["آذربایجان", "أذربيجان", "azerbaijan", "baku", "باکو", "باكو", "阿塞拜疆"] },
	{ code: "+1-242", flag: "🇧🇸", name: "Bahamas" },
	{ code: "+973", flag: "🇧🇭", name: "Bahrain", aliases: ["بحرین", "البحرين", "bahrain", "manama", "المنامة", "巴林"] },
	{ code: "+880", flag: "🇧🇩", name: "Bangladesh" },
	{ code: "+1-246", flag: "🇧🇧", name: "Barbados" },
	{ code: "+375", flag: "🇧🇾", name: "Belarus" },
	{ code: "+32", flag: "🇧🇪", name: "Belgium", aliases: ["بلژیک", "بلجيكا", "belgium", "belgian", "brussels", "بروکسل", "بروكسل", "比利时"] },
	{ code: "+501", flag: "🇧🇿", name: "Belize" },
	{ code: "+229", flag: "🇧🇯", name: "Benin" },
	{ code: "+975", flag: "🇧🇹", name: "Bhutan" },
	{ code: "+591", flag: "🇧🇴", name: "Bolivia" },
	{ code: "+387", flag: "🇧🇦", name: "Bosnia and Herzegovina" },
	{ code: "+267", flag: "🇧🇼", name: "Botswana" },
	{ code: "+55", flag: "🇧🇷", name: "Brazil", aliases: ["برزیل", "البرازيل", "brazil", "brazilian", "sao paulo", "rio", "巴西"] },
	{ code: "+673", flag: "🇧🇳", name: "Brunei" },
	{ code: "+359", flag: "🇧🇬", name: "Bulgaria" },
	{ code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
	{ code: "+257", flag: "🇧🇮", name: "Burundi" },
	{ code: "+238", flag: "🇨🇻", name: "Cabo Verde" },
	{ code: "+855", flag: "🇰🇭", name: "Cambodia" },
	{ code: "+237", flag: "🇨🇲", name: "Cameroon" },
	{ code: "+1", flag: "🇨🇦", name: "Canada", aliases: ["کانادا", "كندا", "canada", "canadian", "toronto", "vancouver", "加拿大"] },
	{ code: "+236", flag: "🇨🇫", name: "Central African Republic" },
	{ code: "+235", flag: "🇹🇩", name: "Chad" },
	{ code: "+56", flag: "🇨🇱", name: "Chile" },
	{ code: "+86", flag: "🇨🇳", name: "China", aliases: ["چین", "الصين", "china", "chinese", "beijing", "shanghai", "中国", "中国人"] },
	{ code: "+57", flag: "🇨🇴", name: "Colombia" },
	{ code: "+269", flag: "🇰🇲", name: "Comoros" },
	{ code: "+242", flag: "🇨🇬", name: "Congo (Congo-Brazzaville)" },
	{ code: "+506", flag: "🇨🇷", name: "Costa Rica" },
	{ code: "+385", flag: "🇭🇷", name: "Croatia" },
	{ code: "+53", flag: "🇨🇺", name: "Cuba" },
	{ code: "+357", flag: "🇨🇾", name: "Cyprus", aliases: ["قبرس", "قبرص", "cyprus", "cypriot", "塞浦路斯"] },
	{ code: "+420", flag: "🇨🇿", name: "Czechia (Czech Republic)" },
	{ code: "+243", flag: "🇨🇩", name: "Democratic Republic of the Congo" },
	{ code: "+45", flag: "🇩🇰", name: "Denmark", aliases: ["دانمارک", "الدانمارک", "الدنمارك", "denmark", "danish", "copenhagen", "کپنهاگ", "كوبنهاغن", "丹麦"] },
	{ code: "+253", flag: "🇩🇯", name: "Djibouti" },
	{ code: "+1-767", flag: "🇩🇲", name: "Dominica", aliases: ["دومینیکا", "دومينيكا", "dominica", "commonwealth of dominica", "多米尼克"] },
	{ code: "+1-809", flag: "🇩🇴", name: "Dominican Republic" },
	{ code: "+593", flag: "🇪🇨", name: "Ecuador" },
	{ code: "+20", flag: "🇪🇬", name: "Egypt", aliases: ["مصر", "egypt", "egyptian", "cairo", "قاهره", "القاهرة", "埃及"] },
	{ code: "+503", flag: "🇸🇻", name: "El Salvador" },
	{ code: "+240", flag: "🇬🇶", name: "Equatorial Guinea" },
	{ code: "+291", flag: "🇪🇷", name: "Eritrea" },
	{ code: "+372", flag: "🇪🇪", name: "Estonia" },
	{ code: "+268", flag: "🇸🇿", name: "Eswatini (formerly Swaziland)" },
	{ code: "+251", flag: "🇪🇹", name: "Ethiopia" },
	{ code: "+679", flag: "🇫🇯", name: "Fiji" },
	{ code: "+358", flag: "🇫🇮", name: "Finland", aliases: ["فنلاند", "فنلندا", "finland", "finnish", "helsinki", "هلسینکی", "هلسنكي", "芬兰"] },
	{ code: "+33", flag: "🇫🇷", name: "France", aliases: ["فرانسه", "فرنسا", "france", "french", "paris", "پاریس", "باريس", "法国"] },
	{ code: "+241", flag: "🇬🇦", name: "Gabon" },
	{ code: "+220", flag: "🇬🇲", name: "Gambia" },
	{ code: "+995", flag: "🇬🇪", name: "Georgia", aliases: ["گرجستان", "جورجيا", "georgia", "tbilisi", "تفلیس", "تبليسي", "格鲁吉亚"] },
	{ code: "+49", flag: "🇩🇪", name: "Germany", aliases: ["آلمان", "المانيا", "ألمانيا", "germany", "deutschland", "berlin", "برلین", "برلين", "德国"] },
	{ code: "+233", flag: "🇬🇭", name: "Ghana" },
	{ code: "+30", flag: "🇬🇷", name: "Greece", aliases: ["یونان", "اليونان", "greece", "greek", "athens", "آتن", "أثينا", "希腊"] },
	{ code: "+1-473", flag: "🇬🇩", name: "Grenada", aliases: ["گرانادا", "غرينادا", "grenada", "格林纳达"] },
	{ code: "+502", flag: "🇬🇹", name: "Guatemala" },
	{ code: "+224", flag: "🇬🇳", name: "Guinea" },
	{ code: "+245", flag: "🇬🇼", name: "Guinea-Bissau" },
	{ code: "+592", flag: "🇬🇾", name: "Guyana" },
	{ code: "+509", flag: "🇭🇹", name: "Haiti" },
	{ code: "+504", flag: "🇭🇳", name: "Honduras" },
	{ code: "+36", flag: "🇭🇺", name: "Hungary" },
	{ code: "+354", flag: "🇮🇸", name: "Iceland" },
	{ code: "+91", flag: "🇮🇳", name: "India", aliases: ["هند", "هندوستان", "الهند", "india", "indian", "mumbai", "delhi", "印度"] },
	{ code: "+62", flag: "🇮🇩", name: "Indonesia", aliases: ["اندونزی", "إندونيسيا", "indonesia", "jakarta", "جاکارتا", "جاكرتا", "印度尼西亚"] },
	{ code: "+98", flag: "🇮🇷", name: "Iran", aliases: ["ایران", "إيران", "iran", "iranian", "persia", "tehran", "طهران", "تهران", "伊朗"] },
	{ code: "+964", flag: "🇮🇶", name: "Iraq", aliases: ["عراق", "العراق", "iraq", "iraqi", "baghdad", "بغداد", "erbil", "اربیل", "أربيل", "伊拉克"] },
	{ code: "+353", flag: "🇮🇪", name: "Ireland", aliases: ["ایرلند", "أيرلندا", "ireland", "irish", "dublin", "دوبلین", "دبلن", "爱尔兰"] },
	{ code: "+972", flag: "🇮🇱", name: "Israel" },
	{ code: "+39", flag: "🇮🇹", name: "Italy", aliases: ["ایتالیا", "إيطاليا", "italy", "italian", "rome", "رم", "روما", "milan", "میلان", "ميلانو", "意大利"] },
	{ code: "+225", flag: "🇨🇮", name: "Ivory Coast" },
	{ code: "+1-876", flag: "🇯🇲", name: "Jamaica" },
	{ code: "+81", flag: "🇯🇵", name: "Japan", aliases: ["ژاپن", "اليابان", "japan", "japanese", "tokyo", "توکیو", "طوكيو", "日本"] },
	{ code: "+962", flag: "🇯🇴", name: "Jordan", aliases: ["اردن", "الأردن", "jordan", "jordanian", "amman", "امان", "عمان (الأردن)", "约旦"] },
	{ code: "+7", flag: "🇰🇿", name: "Kazakhstan", aliases: ["قزاقستان", "كازاخستان", "kazakhstan", "almaty", "آلماتی", "ألماتي", "astana", "آستانه", "أستانا", "哈萨克斯坦"] },
	{ code: "+254", flag: "🇰🇪", name: "Kenya" },
	{ code: "+686", flag: "🇰🇮", name: "Kiribati" },
	{ code: "+965", flag: "🇰🇼", name: "Kuwait", aliases: ["کویت", "الكويت", "kuwait", "科威特"] },
	{ code: "+996", flag: "🇰🇬", name: "Kyrgyzstan", aliases: ["قرقیزستان", "قيرغيزستان", "kyrgyzstan", "bishkek", "بیشکک", "بيشكك", "吉尔吉斯斯坦"] },
	{ code: "+856", flag: "🇱🇦", name: "Laos" },
	{ code: "+371", flag: "🇱🇻", name: "Latvia" },
	{ code: "+961", flag: "🇱🇧", name: "Lebanon", aliases: ["لبنان", "lebanon", "lebanese", "beirut", "بیروت", "بيروت", "黎巴嫩"] },
	{ code: "+266", flag: "🇱🇸", name: "Lesotho" },
	{ code: "+231", flag: "🇱🇷", name: "Liberia" },
	{ code: "+218", flag: "🇱🇾", name: "Libya", aliases: ["لیبی", "ليبيا", "libya", "tripoli", "طرابلس", "利比亚"] },
	{ code: "+423", flag: "🇱🇮", name: "Liechtenstein" },
	{ code: "+370", flag: "🇱🇹", name: "Lithuania" },
	{ code: "+352", flag: "🇱🇺", name: "Luxembourg" },
	{ code: "+261", flag: "🇲🇬", name: "Madagascar" },
	{ code: "+265", flag: "🇲🇼", name: "Malawi" },
	{ code: "+60", flag: "🇲🇾", name: "Malaysia", aliases: ["مالزی", "ماليزيا", "malaysia", "kuala lumpur", "کوالالامپور", "كوالالمبور", "马来西亚"] },
	{ code: "+960", flag: "🇲🇻", name: "Maldives" },
	{ code: "+223", flag: "🇲🇱", name: "Mali" },
	{ code: "+356", flag: "🇲🇹", name: "Malta", aliases: ["مالت", "مالطا", "malta", "maltese", "马耳他"] },
	{ code: "+692", flag: "🇲🇭", name: "Marshall Islands" },
	{ code: "+222", flag: "🇲🇷", name: "Mauritania" },
	{ code: "+230", flag: "🇲🇺", name: "Mauritius" },
	{ code: "+52", flag: "🇲🇽", name: "Mexico", aliases: ["مکزیک", "المكسيك", "mexico", "mexican", "墨西哥"] },
	{ code: "+691", flag: "🇫🇲", name: "Micronesia" },
	{ code: "+373", flag: "🇲🇩", name: "Moldova" },
	{ code: "+377", flag: "🇲🇨", name: "Monaco" },
	{ code: "+976", flag: "🇲🇳", name: "Mongolia" },
	{ code: "+382", flag: "🇲🇪", name: "Montenegro" },
	{ code: "+212", flag: "🇲🇦", name: "Morocco", aliases: ["مراکش", "المغرب", "morocco", "moroccan", "casablanca", "کازابلانکا", "الدار البيضاء", "rabat", "رباط", "الرباط", "摩洛哥"] },
	{ code: "+258", flag: "🇲🇿", name: "Mozambique" },
	{ code: "+95", flag: "🇲🇲", name: "Myanmar (formerly Burma)" },
	{ code: "+264", flag: "🇳🇦", name: "Namibia" },
	{ code: "+674", flag: "🇳🇷", name: "Nauru", aliases: ["نائورو", "ناورو", "nauru", "瑙鲁"] },
	{ code: "+977", flag: "🇳🇵", name: "Nepal" },
	{ code: "+31", flag: "🇳🇱", name: "Netherlands", aliases: ["هلند", "هولندا", "netherlands", "holland", "dutch", "amsterdam", "آمستردام", "امستردام", "荷兰"] },
	{ code: "+64", flag: "🇳🇿", name: "New Zealand" },
	{ code: "+505", flag: "🇳🇮", name: "Nicaragua" },
	{ code: "+227", flag: "🇳🇪", name: "Niger" },
	{ code: "+234", flag: "🇳🇬", name: "Nigeria" },
	{ code: "+850", flag: "🇰🇵", name: "North Korea" },
	{ code: "+389", flag: "🇲🇰", name: "North Macedonia" },
	{ code: "+47", flag: "🇳🇴", name: "Norway", aliases: ["نروژ", "النرويج", "norway", "norwegian", "oslo", "اسلو", "أوسلو", "挪威"] },
	{ code: "+968", flag: "🇴🇲", name: "Oman", aliases: ["عمان", "عُمان", "سلطنة عمان", "oman", "muscat", "مسقط", "阿曼"] },
	{ code: "+92", flag: "🇵🇰", name: "Pakistan", aliases: ["پاکستان", "باكستان", "pakistan", "pakistani", "巴基斯坦"] },
	{ code: "+680", flag: "🇵🇼", name: "Palau" },
	{ code: "+970", flag: "🇵🇸", name: "Palestine" },
	{ code: "+507", flag: "🇵🇦", name: "Panama", aliases: ["پاناما", "بنما", "panama", "巴拿马"] },
	{ code: "+675", flag: "🇵🇬", name: "Papua New Guinea" },
	{ code: "+595", flag: "🇵🇾", name: "Paraguay" },
	{ code: "+51", flag: "🇵🇪", name: "Peru" },
	{ code: "+63", flag: "🇵🇭", name: "Philippines" },
	{ code: "+48", flag: "🇵🇱", name: "Poland", aliases: ["لهستان", "بولندا", "poland", "polish", "warsaw", "ورشو", "وارسو", "波兰"] },
	{ code: "+351", flag: "🇵🇹", name: "Portugal", aliases: ["پرتغال", "البرتغال", "portugal", "portuguese", "lisbon", "لیسبون", "لشبونة", "葡萄牙"] },
	{ code: "+974", flag: "🇶🇦", name: "Qatar", aliases: ["قطر", "qatar", "doha", "الدوحة", "卡塔尔"] },
	{ code: "+40", flag: "🇷🇴", name: "Romania" },
	{ code: "+7", flag: "🇷🇺", name: "Russia", aliases: ["روسیه", "روسيا", "russia", "russian", "moscow", "مسکو", "موسكو", "俄罗斯"] },
	{ code: "+250", flag: "🇷🇼", name: "Rwanda" },
	{ code: "+1-869", flag: "🇰🇳", name: "Saint Kitts and Nevis", aliases: ["سنت کیتس", "سانت كيتس", "saint kitts", "st kitts", "nevis", "圣基茨"] },
	{ code: "+1-758", flag: "🇱🇨", name: "Saint Lucia", aliases: ["سنت لوسیا", "سانت لوسيا", "saint lucia", "st lucia", "圣卢西亚"] },
	{ code: "+1-784", flag: "🇻🇨", name: "Saint Vincent and the Grenadines" },
	{ code: "+685", flag: "🇼🇸", name: "Samoa" },
	{ code: "+378", flag: "🇸🇲", name: "San Marino" },
	{ code: "+239", flag: "🇸🇹", name: "Sao Tome and Principe", aliases: ["سائوتومه", "ساو تومي", "sao tome", "sao tome and principe", "圣多美"] },
	{ code: "+966", flag: "🇸🇦", name: "Saudi Arabia", aliases: ["عربستان", "السعودية", "المملكة العربية السعودية", "saudi", "ksa", "saudi arabia", "riyadh", "الرياض", "沙特", "沙特阿拉伯"] },
	{ code: "+221", flag: "🇸🇳", name: "Senegal" },
	{ code: "+381", flag: "🇷🇸", name: "Serbia" },
	{ code: "+248", flag: "🇸🇨", name: "Seychelles" },
	{ code: "+232", flag: "🇸🇱", name: "Sierra Leone" },
	{ code: "+65", flag: "🇸🇬", name: "Singapore", aliases: ["سنگاپور", "سنغافورة", "singapore", "新加坡"] },
	{ code: "+421", flag: "🇸🇰", name: "Slovakia" },
	{ code: "+386", flag: "🇸🇮", name: "Slovenia" },
	{ code: "+677", flag: "🇸🇧", name: "Solomon Islands" },
	{ code: "+252", flag: "🇸🇴", name: "Somalia", aliases: ["سومالی", "الصومال", "somalia", "mogadishu", "موگادیشو", "مقديشو", "索马里"] },
	{ code: "+27", flag: "🇿🇦", name: "South Africa", aliases: ["آفریقای جنوبی", "جنوب أفريقيا", "south africa", "南非"] },
	{ code: "+82", flag: "🇰🇷", name: "South Korea", aliases: ["کره جنوبی", "كوريا الجنوبية", "south korea", "korea", "seoul", "سئول", "سيول", "韩国"] },
	{ code: "+211", flag: "🇸🇸", name: "South Sudan" },
	{ code: "+34", flag: "🇪🇸", name: "Spain", aliases: ["اسپانیا", "إسبانيا", "spain", "spanish", "madrid", "مادرید", "مدريد", "barcelona", "بارسلونا", "برشلونة", "西班牙"] },
	{ code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
	{ code: "+249", flag: "🇸🇩", name: "Sudan", aliases: ["سودان", "السودان", "sudan", "khartoum", "خارطوم", "الخرطوم", "苏丹"] },
	{ code: "+597", flag: "🇸🇷", name: "Suriname" },
	{ code: "+46", flag: "🇸🇪", name: "Sweden", aliases: ["سوئد", "السويد", "sweden", "swedish", "stockholm", "استکهلم", "ستوكهولم", "瑞典"] },
	{ code: "+41", flag: "🇨🇭", name: "Switzerland", aliases: ["سوئیس", "سويسرا", "switzerland", "swiss", "geneva", "ژنو", "جنيف", "zurich", "زوریخ", "زيورخ", "瑞士"] },
	{ code: "+963", flag: "🇸🇾", name: "Syria", aliases: ["سوریه", "سوريا", "syria", "syrian", "damascus", "دمشق", "叙利亚"] },
	{ code: "+992", flag: "🇹🇯", name: "Tajikistan", aliases: ["تاجیکستان", "طاجيكستان", "tajikistan", "dushanbe", "دوشنبه", "塔吉克斯坦"] },
	{ code: "+255", flag: "🇹🇿", name: "Tanzania" },
	{ code: "+66", flag: "🇹🇭", name: "Thailand", aliases: ["تایلند", "تايلاند", "thailand", "bangkok", "بانکوک", "بانكوك", "泰国"] },
	{ code: "+670", flag: "🇹🇱", name: "Timor-Leste" },
	{ code: "+228", flag: "🇹🇬", name: "Togo" },
	{ code: "+676", flag: "🇹🇴", name: "Tonga" },
	{ code: "+1-868", flag: "🇹🇹", name: "Trinidad and Tobago" },
	{ code: "+216", flag: "🇹🇳", name: "Tunisia", aliases: ["تونس", "tunisia", "tunis", "突尼斯"] },
	{ code: "+90", flag: "🇹🇷", name: "Turkey", aliases: ["ترکیه", "تركيا", "turkey", "turkiye", "türkiye", "istanbul", "استانبول", "اسطنبول", "土耳其"] },
	{ code: "+993", flag: "🇹🇲", name: "Turkmenistan", aliases: ["ترکمنستان", "تركمانستان", "turkmenistan", "ashgabat", "عشق‌آباد", "عشق آباد", "土库曼斯坦"] },
	{ code: "+688", flag: "🇹🇻", name: "Tuvalu" },
	{ code: "+256", flag: "🇺🇬", name: "Uganda" },
	{ code: "+380", flag: "🇺🇦", name: "Ukraine" },
	{ code: "+44", flag: "🇬🇧", name: "United Kingdom", aliases: ["انگلستان", "انگلیس", "بریتانیا", "المملكة المتحدة", "بريطانيا", "انجلترا", "uk", "united kingdom", "britain", "great britain", "england", "london", "لندن", "英国"] },
	{ code: "+1", flag: "🇺🇸", name: "United States of America", aliases: ["امریکا", "آمریکا", "ایالات متحده", "امريكا", "أمريكا", "الولايات المتحدة", "us", "usa", "united states", "america", "美国"] },
	{ code: "+598", flag: "🇺🇾", name: "Uruguay" },
	{ code: "+998", flag: "🇺🇿", name: "Uzbekistan", aliases: ["ازبکستان", "أوزبكستان", "uzbekistan", "tashkent", "تاشکند", "طشقند", "乌兹别克斯坦"] },
	{ code: "+678", flag: "🇻🇺", name: "Vanuatu", aliases: ["وانواتو", "فانواتو", "vanuatu", "瓦努阿图"] },
	{ code: "+379", flag: "🇻🇦", name: "Vatican City" },
	{ code: "+58", flag: "🇻🇪", name: "Venezuela" },
	{ code: "+84", flag: "🇻🇳", name: "Vietnam" },
	{ code: "+967", flag: "🇾🇪", name: "Yemen", aliases: ["یمن", "اليمن", "yemen", "yemeni", "sanaa", "صنعاء", "也门"] },
	{ code: "+260", flag: "🇿🇲", name: "Zambia" },
	{ code: "+263", flag: "🇿🇼", name: "Zimbabwe" }
];

// Normalizes Persian, Arabic and Latin digits, letters and harakat for accurate searching
function normalizeSearchText(str) {
  return String(str || '')
    .replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
    .replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c))
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

// Known dial codes sorted by length descending for accurate greedy prefix extraction
const KNOWN_DIAL_CODES = DEFAULT_COUNTRY_CODES
  .map(c => c.code)
  .sort((a, b) => b.length - a.length);

/**
 * Universal E.164 Phone Parser (T04, T19, T20)
 * - Converts Persian (۰-۹) and Arabic (٠-٩) digits to standard 0-9
 * - Strips double prefixes (+9393..., +971 +971...)
 * - Detects explicit typed international prefix (+ or 00) overriding dropdown
 * - Strips domestic leading trunk zeros (0783... -> 783..., 050... -> 50...)
 * - Enforces ITU-T E.164 length constraints (min 7, max 15 digits)
 */
function parsePhoneNumber(rawInput, defaultDial) {
  const rawStr = String(rawInput || '').trim();
  let defaultCode = String(defaultDial || '+971').trim();
  if (!defaultCode.startsWith('+')) defaultCode = '+' + defaultCode;
  const matchedDefault = KNOWN_DIAL_CODES.find(dc => defaultCode.startsWith(dc));
  if (matchedDefault) defaultCode = matchedDefault;

  if (!rawStr) {
    return {
      valid: false,
      dialCode: defaultCode,
      nationalNumber: '',
      e164: '',
      formatted: '',
      error: 'Phone number is required'
    };
  }

  // 1. Convert Persian & Arabic digits to Latin
  let converted = rawStr
    .replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
    .replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));

  // 2. Clean punctuation but preserve leading '+'
  let clean = converted.replace(/[^\d+]/g, '');

  // Convert international '00' prefix to '+'
  if (clean.startsWith('00')) {
    clean = '+' + clean.slice(2);
  }

  let finalDial = defaultCode;

  // 3. Detect international country prefix in typed input
  if (clean.startsWith('+')) {
    const matched = KNOWN_DIAL_CODES.find(dc => clean.startsWith(dc));
    if (matched) {
      finalDial = matched;
      clean = clean.slice(matched.length);
    } else {
      const genericMatch = clean.match(/^(\+\d{1,3})(.*)$/);
      if (genericMatch) {
        finalDial = genericMatch[1];
        clean = genericMatch[2];
      }
    }
  } else {
    // Check if user typed country code without '+' (e.g. 97150... or 9377...)
    const dialDigits = finalDial.replace(/\D/g, '');
    if (dialDigits && clean.startsWith(dialDigits) && clean.length > dialDigits.length + 5) {
      clean = clean.slice(dialDigits.length);
    }
  }

  // Auto-repair finalDial if any extraneous digits were attached
  const repairedDial = KNOWN_DIAL_CODES.find(dc => finalDial.startsWith(dc));
  if (repairedDial) finalDial = repairedDial;

  // 4. Strip domestic trunk leading zeros (e.g. 050... -> 50..., 0783... -> 783...)
  clean = clean.replace(/^0+/, '');

  const localDigits = clean.replace(/\D/g, '');
  const dialDigits = finalDial.replace(/\D/g, '');
  const totalDigits = dialDigits.length + localDigits.length;

  // E.164 validity check: national number >= 5 digits, total between 7 and 15 digits
  const isValid = localDigits.length >= 5 && totalDigits >= 7 && totalDigits <= 15;

  return {
    valid: isValid,
    dialCode: finalDial,
    nationalNumber: localDigits,
    e164: isValid ? `${finalDial}${localDigits}` : `${finalDial}${localDigits}`,
    formatted: isValid ? `${finalDial} ${localDigits}` : (clean ? `${finalDial} ${clean}` : ''),
    error: isValid ? null : 'Invalid phone number format or length'
  };
}

function initCountryPickers() {
  const list = DEFAULT_COUNTRY_CODES;
  const currentLang = (document.documentElement.lang || 'en').toLowerCase();

  document.querySelectorAll('.country-list-container').forEach(container => {
    // Re-populate if empty or if previously populated with un-aliased list
    if (container.children.length > 0 && container.getAttribute('data-multilingual') === 'true') return;
    container.innerHTML = '';
    container.setAttribute('data-multilingual', 'true');

    const fragment = document.createDocumentFragment();
    list.forEach(c => {
      const item = document.createElement('div');
      item.className = 'country-item flex items-center space-x-2 p-2 hover:bg-neutral-100 cursor-pointer text-xs whitespace-nowrap';

      const aliases = c.aliases || [];
      const keywords = [c.name, c.code, c.code.replace('+', ''), ...aliases].join(' ');
      item.setAttribute('data-keywords', keywords);
      item.setAttribute('data-search', normalizeSearchText(keywords));

      let displayName = c.name;
      if (currentLang === 'fa' && aliases[0]) {
        displayName = `${c.name} (${aliases[0]})`;
      } else if (currentLang === 'ar' && aliases[1]) {
        displayName = `${c.name} (${aliases[1]})`;
      } else if (currentLang === 'zh' && aliases[2]) {
        displayName = `${c.name} (${aliases[2]})`;
      }

      item.innerHTML = `<span>${c.flag}</span><span class="text-neutral-500 font-semibold" dir="ltr">${c.code}</span><span class="text-neutral-900 truncate">${displayName}</span>`;
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        selectCountryCode(this, c.code, c.flag);
      });
      fragment.appendChild(item);
    });
    container.appendChild(fragment);
  });
}

function toggleCountryDropdown(button) {
  const wrapper = button.closest('.custom-select-wrapper') || button.parentElement;
  if (!wrapper) return;
  const dropdown = wrapper.querySelector('.custom-select-dropdown') || button.nextElementSibling;
  if (!dropdown) return;
  
  const container = dropdown.querySelector('.country-list-container');
  if (container && (container.children.length === 0 || container.getAttribute('data-multilingual') !== 'true')) {
    initCountryPickers();
  }

  const isCurrentlyOpen = dropdown.classList.contains('active') && dropdown.style.display === 'block';

  document.querySelectorAll('.custom-select-dropdown').forEach(d => {
    d.classList.remove('active');
    d.style.setProperty('display', 'none', 'important');
  });

  if (!isCurrentlyOpen) {
    dropdown.classList.add('active');
    dropdown.style.setProperty('display', 'block', 'important');
    const searchInput = dropdown.querySelector('input');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  }
}

function filterCountryCode(input) {
  const query = normalizeSearchText(input.value);
  const listContainer = input.parentElement.querySelector('.country-list-container') || input.nextElementSibling;
  if (!listContainer) return;
  
  const items = listContainer.querySelectorAll('.country-item');
  items.forEach(item => {
    const searchTarget = item.getAttribute('data-search') || normalizeSearchText(item.textContent || '');
    const isMatch = !query || searchTarget.includes(query);
    item.style.display = isMatch ? 'flex' : 'none';
  });
}

function selectCountryCode(element, code, flag) {
  const wrapper = element.closest('.custom-select-wrapper') || element.closest('.relative');
  if (!wrapper) return;

  let dialCode = code;
  let countryFlag = flag;
  if (typeof code === 'string' && !code.startsWith('+') && typeof flag === 'string' && flag.startsWith('+')) {
    dialCode = flag;
    countryFlag = code;
  }
  
  const span = wrapper.querySelector('.selected-country-span');
  if (span) {
    span.textContent = `${countryFlag || ''} ${dialCode || ''}`.trim();
  }
  
  const hiddenInput = wrapper.querySelector('.dial-code-hidden-value') ||
                      wrapper.parentElement.querySelector('.dial-code-hidden-value') ||
                      wrapper.nextElementSibling;
  if (hiddenInput && (hiddenInput.classList?.contains('dial-code-hidden-value') || hiddenInput.type === 'hidden')) {
    hiddenInput.value = dialCode;
  }
  
  const dropdown = wrapper.querySelector('.custom-select-dropdown') || element.closest('.custom-select-dropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
    dropdown.style.setProperty('display', 'none', 'important');
  }
}

// Global expose
window.toggleCountryDropdown = toggleCountryDropdown;
window.filterCountryCode = filterCountryCode;
window.selectCountryCode = selectCountryCode;
window.initCountryPickers = initCountryPickers;

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.custom-select-dropdown')) {
    document.querySelectorAll('.custom-select-dropdown').forEach(d => {
      d.classList.remove('active');
      d.style.setProperty('display', 'none', 'important');
    });
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountryPickers);
} else {
  initCountryPickers();
}

// 2. Dynamic Service & Sub-Program Mapping
const SUB_PROGRAM_MAP = {
  citizenship: [
    { value: 'dominica', label: 'Dominica' },
    { value: 'antigua', label: 'Antigua & Barbuda' },
    { value: 'grenada', label: 'Grenada' },
    { value: 'stkitts', label: 'St. Kitts & Nevis' },
    { value: 'stlucia', label: 'Saint Lucia' },
    { value: 'vanuatu', label: 'Vanuatu' },
    { value: 'nauru', label: 'Republic of Nauru' },
    { value: 'saotome', label: 'São Tomé & Príncipe' }
  ],
  residency: [
    { value: 'uae-gv', label: 'UAE Golden Visa' },
    { value: 'greece-gv', label: 'Greece Golden Visa' },
    { value: 'portugal-gv', label: 'Portugal Golden Visa' },
    { value: 'panama-pr', label: 'Panama Qualified Investor' }
  ],
  'real-estate': [
    { value: 'dubai-offplan', label: 'Dubai Off-Plan / New Launch' },
    { value: 'dubai-ready', label: 'Ready Homes & Villas' },
    { value: 'commercial-re', label: 'Commercial & Office Space' }
  ],
  education: [
    { value: 'boarding-schools', label: 'UK & Swiss Boarding Schools' },
    { value: 'undergrad', label: 'Undergraduate Placement' },
    { value: 'postgrad', label: 'Postgraduate & MBA Admission' }
  ]
};

const SUB_PROGRAM_LOCALIZED = {
  ar: {
    placeholder: 'اختر المسار الفرعي للبرنامج',
    dominica: 'دومينيكا | جواز سفر',
    antigua: 'أنتيغوا وبربودا | جواز سفر',
    grenada: 'غرينادا | جواز سفر',
    stkitts: 'سانت كيتس ونيفيس | جواز سفر',
    stlucia: 'سانت لوسيا | جواز سفر',
    vanuatu: 'فانواتو | جواز سفر',
    nauru: 'جمهورية ناورو | جواز سفر',
    saotome: 'ساو تومي وبرينسيب | جواز سفر',
    'uae-gv': 'الإمارات العربية المتحدة | التأشيرة الذهبية',
    'greece-gv': 'اليونان | التأشيرة الذهبية',
    'portugal-gv': 'البرتغال | التأشيرة الذهبية',
    'panama-pr': 'بنما | إقامة المستثمر المؤهل',
    'dubai-offplan': 'عقارات دبي على الخارطة والمشاريع الجديدة',
    'dubai-ready': 'المنازل والفلل الجاهزة في دبي',
    'commercial-re': 'المساحات التجارية والأصول الاستثمارية',
    'boarding-schools': 'المدارس الداخلية في بريطانيا وسويسرا',
    undergrad: 'القبول الجامعي لدرجة البكالوريوس',
    postgrad: 'الدراسات العليا وماجستير إدارة الأعمال'
  },
  fa: {
    placeholder: 'انتخاب مسیر فرعی برنامه',
    dominica: 'دومینیکا | پاسپورت',
    antigua: 'آنتیگوا و باربودا | پاسپورت',
    grenada: 'گرانادا | پاسپورت',
    stkitts: 'سنت کیتس و نویس | پاسپورت',
    stlucia: 'سنت لوسیا | پاسپورت',
    vanuatu: 'وانواتو | پاسپورت',
    nauru: 'جمهوری نائورو | پاسپورت',
    saotome: 'سائوتومه و پرنسیپ | پاسپورت',
    'uae-gv': 'امارات متحده عربی | ویزای طلایی ۱۰ ساله',
    'greece-gv': 'یونان | ویزای طلایی اروپا',
    'portugal-gv': 'پرتغال | ویزای طلایی سرمایه‌گذاری',
    'panama-pr': 'پاناما | اقامت دائم سرمایه‌گذار واجد شرایط',
    'dubai-offplan': 'پروژه‌های در حال ساخت و پیش‌فروش دبی',
    'dubai-ready': 'خانه‌ها، آپارتمان‌ها و ویلاهای آماده دبی',
    'commercial-re': 'املاک تجاری و اداری سرمایه‌گذاری',
    'boarding-schools': 'مدارس شبانه‌روزی نخبگان بریتانیا و سوئیس',
    undergrad: 'پذیرش دوره‌های کارشناسی دانشگاهی',
    postgrad: 'تحصیلات تکمیلی، کارشناسی ارشد و ام‌بی‌ای'
  },
  zh: {
    placeholder: '请选择细分通道',
    dominica: '多米尼克 | 第二护照',
    antigua: '安提瓜和巴布达 | 第二护照',
    grenada: '格林纳达 | 第二护照',
    stkitts: '圣基茨和尼维斯 | 第二护照',
    stlucia: '圣卢西亚 | 第二护照',
    vanuatu: '瓦努阿图 | 第二护照',
    nauru: '瑙鲁共和国 | 第二护照',
    saotome: '圣多美和普林西比 | 第二护照',
    'uae-gv': '阿拉伯联合酋长国 | 10年黄金签证',
    'greece-gv': '希腊 | 欧洲黄金签证',
    'portugal-gv': '葡萄牙 | 黄金居留签证',
    'panama-pr': '巴拿马 | 合格投资者永久居留',
    'dubai-offplan': '迪拜期房 / 全球首发项目',
    'dubai-ready': '现房与高端奢华别墅',
    'commercial-re': '商业物业与投资型办公楼',
    'boarding-schools': '英国与瑞士顶尖寄宿学校',
    undergrad: '海外名校本科申请录取',
    postgrad: '研究生与MBA高级学位录取'
  },
  en: {
    placeholder: 'Select Sub-Program Pathway',
    dominica: 'Dominica | Passport',
    antigua: 'Antigua & Barbuda | Passport',
    grenada: 'Grenada | Passport',
    stkitts: 'St. Kitts & Nevis | Passport',
    stlucia: 'Saint Lucia | Passport',
    vanuatu: 'Vanuatu | Passport',
    nauru: 'Republic of Nauru | Passport',
    saotome: 'São Tomé & Príncipe | Passport',
    'uae-gv': 'United Arab Emirates | Golden Visa',
    'greece-gv': 'Greece | Golden Visa',
    'portugal-gv': 'Portugal | Golden Visa',
    'panama-pr': 'Panama | Qualified Investor PR',
    'dubai-offplan': 'Dubai Off-Plan / New Launch',
    'dubai-ready': 'Ready Homes & Luxury Villas',
    'commercial-re': 'Commercial & Rental Assets',
    'boarding-schools': 'UK & Swiss Boarding Schools',
    undergrad: 'Undergraduate Degrees Placement',
    postgrad: 'Postgraduate & MBA Admission'
  }
};

const CATEGORY_GROUP_TITLES = {
  en: {
    citizenship: 'Citizenship By Investment (Passports)',
    residency: 'Residency By Investment (Golden Visas)',
    'real-estate': 'Dubai Real Estate & Property',
    education: 'Global Educational Advisory'
  },
  ar: {
    citizenship: 'الجنسية عن طريق الاستثمار (جوازات السفر)',
    residency: 'الإقامة عن طريق الاستثمار (التأشيرة الذهبية)',
    'real-estate': 'عقارات دبي والاستثمار العقاري',
    education: 'الاستشارات التعليمية والقبول الجامعي'
  },
  fa: {
    citizenship: 'اخذ شهروندی و پاسپورت از طریق سرمایه‌گذاری',
    residency: 'اخذ اقامت و ویزای طلایی (Golden Visa)',
    'real-estate': 'املاک دبی و سرمایه‌گذاری ملکی',
    education: 'مشاوره تحصیلی و پذیرش دانشگاه‌های بین‌المللی'
  },
  zh: {
    citizenship: '投资入籍项目（第二护照）',
    residency: '投资居留项目（黄金签证）',
    'real-estate': '迪拜房产与高端置业',
    education: '全球优质教育与名校咨询'
  }
};

// --- TOAST NOTIFICATION UTILITY ---
function showFormNotification(message, type) {
  type = type || 'success';
  let toast = document.getElementById('sg-form-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sg-form-toast';
    // Positioned safely on the bottom-left with max-width constraint to NEVER overlap WhatsApp or Live Webinar widgets on bottom-right
    toast.className = 'fixed bottom-6 left-6 md:bottom-8 md:left-8 z-[99999] max-w-[calc(100vw-110px)] md:max-w-md p-4 rounded-2xl shadow-2xl text-xs font-medium transition-all duration-300 transform translate-y-12 opacity-0 flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-md';
    document.body.appendChild(toast);
  }
  
  const icon = type === 'success' 
    ? '<span style="font-size:1.2rem;color:#C5A880;flex-shrink:0;">✓</span>' 
    : '<span style="font-size:1.2rem;color:#FCA5A5;flex-shrink:0;">⚠</span>';
  
  if (type === 'success') {
    toast.style.backgroundColor = 'rgba(28, 25, 23, 0.96)';
    toast.style.color = '#F5F5F4';
    toast.style.border = '1px solid rgba(197, 168, 128, 0.45)';
    toast.style.boxShadow = '0 14px 40px rgba(0, 0, 0, 0.65), 0 0 15px rgba(197, 168, 128, 0.2)';
  } else {
    toast.style.backgroundColor = 'rgba(127, 29, 29, 0.96)';
    toast.style.color = '#FEE2E2';
    toast.style.border = '1px solid #EF4444';
    toast.style.boxShadow = '0 14px 40px rgba(0, 0, 0, 0.65), 0 0 15px rgba(239, 68, 68, 0.25)';
  }

  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;">
      ${icon}
      <span style="line-height:1.45;">${message}</span>
    </div>
    <button type="button" aria-label="Close notification" onclick="this.closest('#sg-form-toast').classList.remove('translate-y-0','opacity-100');this.closest('#sg-form-toast').classList.add('translate-y-12','opacity-0');" style="background:none;border:none;color:inherit;opacity:0.6;cursor:pointer;padding:2px 6px;font-size:16px;line-height:1;margin-left:6px;transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">×</button>
  `;

  if (toast.__hideTimeout) clearTimeout(toast.__hideTimeout);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });
  
  toast.__hideTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0');
  }, 6000);
}
window.showFormNotification = showFormNotification;

const TRANSMIT_MESSAGES = {
  en: {
    transmitting: 'Transmitting...',
    success: 'Inquiry confirmed and received. Our advisory team will contact you within 24 business hours.',
    error: 'Submission could not be confirmed. Please check your connection and retry, or contact us directly on WhatsApp.'
  },
  ar: {
    transmitting: 'جارٍ الإرسال...',
    success: 'تم تأكيد واستلام استفسارك بنجاح. سيتواصل معك مستشارونا المتخصصون خلال 24 ساعة عمل.',
    error: 'تعذر تأكيد الإرسال. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة، أو التواصل معنا مباشرة عبر واتساب.'
  },
  fa: {
    transmitting: 'در حال ارسال...',
    success: 'درخواست شما با موفقیت ثبت و تایید گردید. مشاوران شریف گروپ ظرف ۲۴ ساعت کاری با شما تماس خواهند گرفت.',
    error: 'تایید ثبت درخواست انجام نشد. لطفاً اتصال اینترنت خود را بررسی کرده و مجدداً تلاش نمایید، یا از طریق واتس‌اپ پیام دهید.'
  },
  zh: {
    transmitting: '正在提交...',
    success: '您的咨询已成功提交并确认。我们的资深顾问将在24个工作小时内与您联系。',
    error: '提交确认超时或失败。请检查网络后重试，或直接通过 WhatsApp 与我们联系。'
  }
};

function handleServiceSelectionChange(selectEl) {
  let selectedService = '';
  let form = null;

  if (selectEl && selectEl.nodeType === 1) {
    selectedService = selectEl.value || '';
    form = selectEl.closest('form');
  } else if (typeof selectEl === 'string') {
    selectedService = selectEl;
  }

  if (!form) {
    form = document.querySelector('#standalone-contact-form') || 
           document.querySelector('#contact-portal-form') || 
           document.querySelector('form[onsubmit*="handleContactSubmit"]');
  }
  if (!form) return;

  const subSelect = form.querySelector('#sub-service-choice') || 
                    form.querySelector('#sub-service-choice-standalone') || 
                    form.querySelector('select[name="subProgram"]');
  if (!subSelect) return;
  
  const curLang = (window.getCurrentLanguage ? window.getCurrentLanguage() : document.documentElement.lang) || 'en';
  const loc = SUB_PROGRAM_LOCALIZED[curLang] || SUB_PROGRAM_LOCALIZED['en'];
  const placeholderText = (loc && loc.placeholder) ? loc.placeholder : 'Select Sub-Program Pathway';

  const previousValue = subSelect.value;
  subSelect.innerHTML = `<option value="">${placeholderText}</option>`;

  if (selectedService && SUB_PROGRAM_MAP[selectedService]) {
    // 1. Specific service category selected -> populate only its sub-programs
    SUB_PROGRAM_MAP[selectedService].forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.value;
      opt.textContent = (loc && loc[sub.value]) ? loc[sub.value] : sub.label;
      if (opt.value === previousValue) opt.selected = true;
      subSelect.appendChild(opt);
    });
  } else {
    // 2. No specific service selected yet -> populate ALL 18+ sub-programs grouped by category!
    const catTitles = CATEGORY_GROUP_TITLES[curLang] || CATEGORY_GROUP_TITLES['en'];
    Object.keys(SUB_PROGRAM_MAP).forEach(catKey => {
      const group = document.createElement('optgroup');
      group.label = catTitles[catKey] || catKey;
      SUB_PROGRAM_MAP[catKey].forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.value;
        opt.textContent = (loc && loc[sub.value]) ? loc[sub.value] : sub.label;
        if (opt.value === previousValue) opt.selected = true;
        group.appendChild(opt);
      });
      subSelect.appendChild(group);
    });
  }

  // 3. Two-way listener: selecting a sub-program auto-selects matching category in main dropdown
  if (!subSelect.dataset.syncBound) {
    subSelect.dataset.syncBound = 'true';
    subSelect.addEventListener('change', function() {
      const chosenVal = this.value;
      if (!chosenVal) return;
      for (const [catKey, items] of Object.entries(SUB_PROGRAM_MAP)) {
        if (items.some(item => item.value === chosenVal)) {
          const pForm = this.closest('form');
          if (pForm) {
            const mainSel = pForm.querySelector('select[name="targetProgram"]') || 
                            pForm.querySelector('select[name="programChoice"]') || 
                            pForm.querySelector('#primary-service-choice');
            if (mainSel && mainSel.value !== catKey) {
              mainSel.value = catKey;
            }
          }
          break;
        }
      }
    });
  }
}

// Auto-detect page category and pre-populate targetProgram & subProgram dropdowns
function autoInitStandaloneForms() {
  const path = (window.location.pathname || '').toLowerCase();

  // 1. Check all primary service dropdowns
  document.querySelectorAll('select[name="targetProgram"], select[name="programChoice"]').forEach(sel => {
    if (!sel.value) {
      if (path.includes('citizenshipbyinvestment') || path.includes('/citizenship')) {
        sel.value = 'citizenship';
      } else if (path.includes('residencybyinvestment') || path.includes('/residency')) {
        sel.value = 'residency';
      } else if (path.includes('realestate')) {
        sel.value = 'real-estate';
      } else if (path.includes('educationaladvisory')) {
        sel.value = 'education';
      }
    }
    // Always populate sub-programs (categorized optgroups if empty, filtered if category selected)
    handleServiceSelectionChange(sel);
  });

  // 2. Also ensure any standalone sub-program dropdowns are populated
  document.querySelectorAll('select[name="subProgram"], #sub-service-choice-standalone, #sub-service-choice').forEach(subSel => {
    subSel.removeAttribute('required');
    if (subSel.options.length <= 1) {
      const parentForm = subSel.closest('form');
      const mainSel = parentForm ? (parentForm.querySelector('select[name="targetProgram"]') || parentForm.querySelector('select[name="programChoice"]')) : null;
      handleServiceSelectionChange(mainSel || subSel);
    }
  });

  // T05: Enforce dynamic minimum date (today) on preferred-date controls
  try {
    const todayIso = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"], input[name="preferredDate"], input[name="date"]').forEach(dateEl => {
      dateEl.setAttribute('min', todayIso);
    });
  } catch (err) {}

  // T39: Ensure safe POST method and action fallback on all forms (prevent accidental GET leaks)
  try {
    document.querySelectorAll('form').forEach(f => {
      if (!f.getAttribute('method') || f.getAttribute('method').toUpperCase() !== 'POST') {
        f.setAttribute('method', 'POST');
      }
      if (!f.getAttribute('action')) {
        f.setAttribute('action', '/api/contact.php');
      }
    });
  } catch (err) {}

  // T06: Auto-detect and pre-select user's timezone based on IANA zone
  try {
    const tzSel = document.getElementById('contact-timezone');
    if (tzSel && !tzSel.value) {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) {
        // Try exact match first
        let matched = false;
        for (const opt of tzSel.options) {
          if (opt.value === detectedTz) {
            tzSel.value = detectedTz;
            matched = true;
            break;
          }
        }
        // Fallback: match by UTC offset
        if (!matched) {
          const offsetMin = -new Date().getTimezoneOffset();
          const sign = offsetMin >= 0 ? '+' : '-';
          const absMin = Math.abs(offsetMin);
          const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
          const mm = String(absMin % 60).padStart(2, '0');
          const utcStr = 'UTC' + sign + hh + ':' + mm;
          // Try partial text match in option text
          for (const opt of tzSel.options) {
            if (opt.textContent.includes(utcStr)) {
              tzSel.value = opt.value;
              break;
            }
          }
        }
      }
    }
  } catch (err) {}

  // T35: Autocomplete optimization for mobile & desktop form completion
  try {
    document.querySelectorAll('input[name="firstName"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'given-name'); });
    document.querySelectorAll('input[name="lastName"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'family-name'); });
    document.querySelectorAll('input[name="email"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'email'); });
    document.querySelectorAll('input[name="phone"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'tel'); });
    document.querySelectorAll('input[name="address"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'street-address'); });
    document.querySelectorAll('input[name="fullName"]').forEach(el => { if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'name'); });
  } catch (err) {}

  // T17 & T18: Programmatic label association and accessible controls
  try {
    document.querySelectorAll('form').forEach(f => {
      f.querySelectorAll('label').forEach((lbl, idx) => {
        if (!lbl.getAttribute('for')) {
          const container = lbl.closest('div') || lbl.parentElement;
          if (container) {
            const ctrl = container.querySelector('input:not([type="hidden"]), select, textarea');
            if (ctrl) {
              if (!ctrl.id) {
                const name = ctrl.name || ctrl.type || 'input';
                ctrl.id = (f.id ? f.id + '-' : 'form-') + name + '-' + idx;
              }
              lbl.setAttribute('for', ctrl.id);
            }
          }
        }
      });
    });
  } catch (err) {}
}

// T36: Educational Advisory School Preselection Handler
function preselectEduProgram(level, dest, budget) {
  const form = document.getElementById('standalone-contact-form') || document.querySelector('#program-consult-form-section form') || document.querySelector('form');
  if (form) {
    if (level) {
      const levelSel = form.querySelector('select[name="studyLevel"]');
      if (levelSel) levelSel.value = level;
    }
    if (dest) {
      const destSel = form.querySelector('select[name="targetDestination"]');
      if (destSel) destSel.value = dest;
    }
    if (budget) {
      const budgetSel = form.querySelector('select[name="budget"]');
      if (budgetSel) budgetSel.value = budget;
    }
  }
}
window.preselectEduProgram = preselectEduProgram;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitStandaloneForms);
} else {
  autoInitStandaloneForms();
}

// Helper to normalize Eastern Arabic and Persian digits to standard Latin (0-9)
const toLatinDigits = s => String(s || '')
  .replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
  .replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));

// 3. Central Submission Handler
async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target || event.currentTarget;
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  const successBox = form.querySelector('#contact-form-success') || 
                     form.querySelector('#standalone-form-success') ||
                     document.getElementById('contact-form-success') ||
                     document.getElementById('standalone-form-success');

  // Detect submission language from pathname or document lang
  const pathParts = window.location.pathname.replace(/^\/+/, '').split('/');
  const pageLang = ['fa', 'ar', 'zh'].includes(pathParts[0]) ? pathParts[0] : (document.documentElement.lang || 'en');
  const i18nMsg = TRANSMIT_MESSAGES[pageLang] || TRANSMIT_MESSAGES['en'];

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = i18nMsg.transmitting;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.lang = pageLang;

  const SITE_LANG_MAP = {
    'en': 'English',
    'ar': 'Arabic',
    'fa': 'Persian',
    'zh': 'Chinese'
  };
  payload.site_language = SITE_LANG_MAP[pageLang] || 'English';
  payload.page_path = window.location.pathname;

  // Honeypot anti-spam check (B4)
  if (payload.company_url || payload.website || payload.hp_check || payload.fax) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
    if (successBox) { successBox.classList.remove('hidden'); successBox.style.display = 'block'; }
    form.reset();
    return;
  }

  // Phone number & Dial Code handling with country-aware E.164 parser (B3 / T04 / T19)
  const dialInput = form.querySelector('.dial-code-hidden-value')?.value || payload.dialCode || '+971';
  const rawPhoneInput = form.querySelector('input[type="tel"]')?.value || payload.phone || '';
  const parsedPhone = parsePhoneNumber(rawPhoneInput, dialInput);

  if (rawPhoneInput && !parsedPhone.valid) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
    const invalidPhoneMsg = {
      en: 'Please enter a valid phone number (e.g. +971 50 123 4567).',
      ar: 'يرجى إدخال رقم هاتف صحيح مع رمز الدولة (مثال: 4567 123 50 971+).',
      fa: 'لطفاً یک شماره تماس معتبر همراه با پیش‌شماره وارد نمایید (مثال: ۴۵۶۷ ۱۲۳ ۵۰ ۹۷۱+).',
      zh: '请输入有效的电话号码及国家代码（例如：+971 50 123 4567）。'
    }[pageLang] || 'Please enter a valid phone number.';

    showFormNotification(invalidPhoneMsg, 'error');
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField) phoneField.focus();
    return;
  }

  payload.dialCode = parsedPhone.dialCode;
  payload.phone = parsedPhone.formatted || rawPhoneInput;
  payload.whatsapp_e164 = parsedPhone.e164 || rawPhoneInput;
  payload.rawPhone = parsedPhone.nationalNumber || rawPhoneInput;

  // Normalize email digits if present
  if (payload.email) {
    payload.email = toLatinDigits(payload.email).trim();
  }

  // T05: Validate preferred date is not in the past
  if (payload.preferredDate) {
    try {
      const parts = payload.preferredDate.split('-');
      if (parts.length === 3) {
        const selDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selDate < today) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          const invalidDateMsg = {
            en: 'Please select today or a future date for your consultation.',
            ar: 'يرجى اختيار تاريخ اليوم أو تاريخ في المستقبل للاستشارة.',
            fa: 'لطفاً تاریخ امروز یا تاریخی در آینده را برای مشاوره انتخاب فرمایید.',
            zh: '请选择今天或未来的咨询日期。'
          }[pageLang] || 'Please select a valid upcoming date.';
          showFormNotification(invalidDateMsg, 'error');
          const dateField = form.querySelector('input[name="preferredDate"], input[type="date"]');
          if (dateField) dateField.focus();
          return;
        }
      }
    } catch (err) {}
  }

  // Full name handling (Salutation removed)
  if (!payload.fullName && (payload.firstName || payload.lastName)) {
    payload.fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  }

  // Map country/residence for CRM (strictly country/residence/nationality, never timezone or street address)
  if (!payload.country) {
    payload.country = payload.residence || payload.nationality || '';
  }

  // Normalize dedicated questionnaire fields for CRM
  payload.propertyInterest = payload.propertyInterest || payload.property_interest || payload.propertyType || '';
  payload.familyMembers = payload.familyMembers || payload.family || payload.familySize || '';
  payload.investmentRoute = payload.investmentRoute || payload.route || payload.propertyInterest || '';
  payload.budget = payload.budget || payload.budgetTier || '';
  payload.objective = payload.objective || payload.primaryObjective || (Array.isArray(payload.goals) ? payload.goals.join(', ') : (payload.goals || ''));
  payload.timeline = payload.timeline || payload.planningTimeline || '';
  payload.nationality = payload.nationality || payload.citizenship || '';
  payload.residence = payload.residence || payload.country || '';

  // Education fields (B2 item 2)
  payload.student_age = payload.studentAgeGrade || payload.student_age || payload.studentAge || '';
  payload.study_level = payload.studyLevel || payload.study_level || '';
  payload.destination = payload.targetDestination || payload.destination || '';
  payload.intake = payload.intakeTimeline || payload.intake || '';

  // Social Responsibility fields (B2 item 3)
  const curPath = (window.location.pathname || '').toLowerCase();
  if (curPath.includes('/socialresponsibility') || form.id === 'social-resp-form') {
    payload.targetTab = 'General Enquiries';
    payload.organization = payload.organization || '';
    payload.orgType = payload.orgType || '';
    payload.preferredDate = payload.preferredDate || payload.timeline || '';
    payload.preferredMethod = payload.preferredMethod || payload.objective || '';
    // Avoid date being parsed by formatTimeline into "Immediately (0-3 months)"
    delete payload.timeline;
    delete payload.objective;
  }

  // Real Estate fields (B2 item 4)
  if (curPath.includes('/realestate')) {
    payload.targetTab = 'Real Estate';
    if (!payload.program) payload.program = 'Dubai Real Estate Investment';
    if (payload.propertyInterest) payload.investmentRoute = payload.propertyInterest;
  }
  let detectedProgram = '';
  let detectedTab = '';

  if (curPath.includes('/residencybyinvestment/portugal') || curPath.includes('/portugal')) {
    detectedProgram = 'Portugal Golden Visa';
    detectedTab = 'Residency';
  } else if (curPath.includes('/residencybyinvestment/greece') || curPath.includes('/greece')) {
    detectedProgram = 'Greece Golden Visa';
    detectedTab = 'Residency';
  } else if (curPath.includes('/residencybyinvestment/uae') || curPath.includes('/uae')) {
    detectedProgram = 'UAE Golden Visa';
    detectedTab = 'Residency';
  } else if (curPath.includes('/residencybyinvestment/panama') || curPath.includes('/panama')) {
    detectedProgram = 'Panama Residency';
    detectedTab = 'Residency';
  } else if (curPath.includes('/residencybyinvestment') || curPath.includes('/residency')) {
    detectedTab = 'Residency';
  } else if (curPath.includes('/citizenshipbyinvestment/dominica') || curPath.includes('/dominica')) {
    detectedProgram = 'Dominica CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/grenada') || curPath.includes('/grenada')) {
    detectedProgram = 'Grenada CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/antigua') || curPath.includes('/antigua')) {
    detectedProgram = 'Antigua & Barbuda CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/stlucia') || curPath.includes('/stlucia')) {
    detectedProgram = 'Saint Lucia CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/stkitts') || curPath.includes('/stkitts')) {
    detectedProgram = 'St. Kitts & Nevis CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/vanuatu') || curPath.includes('/vanuatu')) {
    detectedProgram = 'Vanuatu CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/nauru') || curPath.includes('/nauru')) {
    detectedProgram = 'Nauru CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment/sao-tome') || curPath.includes('/saotome')) {
    detectedProgram = 'Sao Tome & Principe CBI';
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/citizenshipbyinvestment') || curPath.includes('/citizenship')) {
    detectedTab = 'Citizenship';
  } else if (curPath.includes('/realestate')) {
    detectedProgram = 'Real Estate';
    detectedTab = 'Real Estate';
  } else if (curPath.includes('/educationaladvisory')) {
    detectedProgram = 'Educational Advisory';
    detectedTab = 'Educational Advisory';
  }

  if (detectedProgram && !payload.program && !payload.programChoice) {
    payload.program = detectedProgram;
  }
  if (detectedTab && !payload.targetTab) {
    payload.targetTab = detectedTab;
  }

  // Explicitly route Home Page & Contact Us submissions to General Enquiries (General Queries)
  const isHome = form.id === 'contact-portal-form' || curPath === '' || curPath === '/' || curPath.endsWith('/index.html') || curPath.endsWith('/fa/') || curPath.endsWith('/ar/') || curPath.endsWith('/zh/');
  const isContact = curPath.includes('/contact') || form.id === 'contact-form' || (form.id === 'standalone-contact-form' && curPath.includes('contact'));
  if (isHome || isContact) {
    payload.targetTab = 'General Enquiries';
  }

  // Map service/program clearly for Google Sheet
  const primaryProgram = payload.program || payload.programChoice || payload.targetProgram || payload.investmentRoute || '';
  if (!payload.service) {
    payload.service = primaryProgram;
    if (payload.investmentRoute && payload.program && !payload.program.includes(payload.investmentRoute)) {
      payload.service += ` (${payload.investmentRoute})`;
    } else if (payload.subProgram) {
      payload.service += (payload.service ? ` (${payload.subProgram})` : payload.subProgram);
    }
  } else if (payload.subProgram && !payload.service.includes(payload.subProgram)) {
    payload.service += ` (${payload.subProgram})`;
  }

  // Enriched notes
  const extraDetails = [];
  if (payload.program) extraDetails.push(`Program: ${payload.program}`);
  else if (payload.programChoice) extraDetails.push(`Program: ${payload.programChoice}`);
  if (payload.subProgram) extraDetails.push(`Sub-Program: ${payload.subProgram}`);
  if (payload.propertyInterest) extraDetails.push(`Property Interest: ${payload.propertyInterest}`);
  if (payload.investmentRoute) extraDetails.push(`Route: ${payload.investmentRoute}`);
  if (payload.budget) extraDetails.push(`Budget: ${payload.budget}`);
  if (payload.familyMembers) extraDetails.push(`Family: ${payload.familyMembers}`);
  if (payload.preferredLanguage) extraDetails.push(`Pref. Lang: ${payload.preferredLanguage}`);
  if (payload.timeline) extraDetails.push(`Timeline: ${payload.timeline}`);
  if (payload.objective) extraDetails.push(`Objective: ${payload.objective}`);
  const contactMethod = payload.contactMethod || payload.preferredMethod || '';
  if (contactMethod) extraDetails.push(`Method: ${contactMethod}`);
  if (payload.timezone) extraDetails.push(`Timezone: ${payload.timezone}`);
  if (payload.preferredDate) extraDetails.push(`Date: ${payload.preferredDate}`);
  if (payload.address) extraDetails.push(`Address: ${payload.address}`);

  if (extraDetails.length > 0) {
    const existingNotes = payload.notes || '';
    payload.notes = existingNotes ? `${existingNotes}\n---\n[Details] ${extraDetails.join(' | ')}` : extraDetails.join(' | ');
  }

  // Unique inquiry identifier for CRM tracking and deduplication
  if (!payload.inquiry_id) {
    payload.inquiry_id = 'INQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  payload.source = window.location.href;
  payload.page = window.location.pathname;
  payload.page_path = window.location.pathname;
  payload.form_id = form.id || 'program-consult-form';

  try {
    let confirmed = false;
    let confirmMessage = '';

    // 1. Dispatch to direct server mailer API (authenticated email to contact@sharifgroup.ae + local data backup + background CRM sync)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const result = await res.json().catch(() => null);
        if (result && result.status === 'success') {
          confirmed = true;
          confirmMessage = result.message || '';
        }
      }
    } catch (apiErr) {
      console.warn('Direct server mailer notice:', apiErr);
    }

    // 2. Fallback / Direct CRM Sheets Sync via Google Apps Script (without no-cors, text/plain prevents preflight blocking)
    if (!confirmed && CRM_WEBHOOK_URL) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(CRM_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const result = await res.json().catch(() => null);
          if (result && (result.status === 'success' || result.status === 'ignored_duplicate')) {
            confirmed = true;
            confirmMessage = result.message || '';
          }
        }
      } catch (crmErr) {
        console.warn('Direct CRM sync notice:', crmErr);
      }
    }

    if (confirmed) {
      form.reset();

      // Show inline success box if present
      if (successBox) {
        successBox.classList.remove('hidden');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Always show modern floating confirmation toast
      showFormNotification(i18nMsg.success, 'success');
    } else {
      // Save could not be confirmed within 10s: keep inputs intact, show retry message
      throw new Error('Save confirmation timed out or failed. Inputs preserved.');
    }

  } catch (error) {
    console.error("Transmission error:", error);
    // Keep user input intact so lead is never lost on retry
    showFormNotification(i18nMsg.error, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

// Explicit global exposure
window.handleServiceSelectionChange = handleServiceSelectionChange;
window.handleContactSubmit = handleContactSubmit;
window.toLatinDigits = toLatinDigits;
window.normalizeSearchText = normalizeSearchText;
window.parsePhoneNumber = parsePhoneNumber;
window.DEFAULT_COUNTRY_CODES = DEFAULT_COUNTRY_CODES;
window.autoInitStandaloneForms = autoInitStandaloneForms;
window.filterCountryCode = filterCountryCode;
window.toggleCountryDropdown = toggleCountryDropdown;
window.selectCountryCode = selectCountryCode;
window.initCountryPickers = initCountryPickers;
