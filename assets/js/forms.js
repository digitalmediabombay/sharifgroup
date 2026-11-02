// --- CENTRAL FORM & CRM DISPATCH CONTROLLER ---

const CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxZIEa4TJ2sHW0hdkL1MRmfEasE0MbEa3rruAebGFrmyt0JMjerMXnTKePAWdzmesRYaQ/exec"; 

// 1. Country Dial Code Dropdown Toggle & Filter
const DEFAULT_COUNTRY_CODES = [
	{ code: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
	{ code: "+93", flag: "🇦🇫", name: "Afghanistan" },
	{ code: "+355", flag: "🇦🇱", name: "Albania" },
	{ code: "+213", flag: "🇩🇿", name: "Algeria" },
	{ code: "+376", flag: "🇦🇩", name: "Andorra" },
	{ code: "+244", flag: "🇦🇴", name: "Angola" },
	{ code: "+1-268", flag: "🇦🇬", name: "Antigua and Barbuda" },
	{ code: "+54", flag: "🇦🇷", name: "Argentina" },
	{ code: "+374", flag: "🇦🇲", name: "Armenia" },
	{ code: "+61", flag: "🇦🇺", name: "Australia" },
	{ code: "+43", flag: "🇦🇹", name: "Austria" },
	{ code: "+994", flag: "🇦🇿", name: "Azerbaijan" },
	{ code: "+1-242", flag: "🇧🇸", name: "Bahamas" },
	{ code: "+973", flag: "🇧🇭", name: "Bahrain" },
	{ code: "+880", flag: "🇧🇩", name: "Bangladesh" },
	{ code: "+1-246", flag: "🇧🇧", name: "Barbados" },
	{ code: "+375", flag: "🇧🇾", name: "Belarus" },
	{ code: "+32", flag: "🇧🇪", name: "Belgium" },
	{ code: "+501", flag: "🇧🇿", name: "Belize" },
	{ code: "+229", flag: "🇧🇯", name: "Benin" },
	{ code: "+975", flag: "🇧🇹", name: "Bhutan" },
	{ code: "+591", flag: "🇧🇴", name: "Bolivia" },
	{ code: "+387", flag: "🇧🇦", name: "Bosnia and Herzegovina" },
	{ code: "+267", flag: "🇧🇼", name: "Botswana" },
	{ code: "+55", flag: "🇧🇷", name: "Brazil" },
	{ code: "+673", flag: "🇧🇳", name: "Brunei" },
	{ code: "+359", flag: "🇧🇬", name: "Bulgaria" },
	{ code: "+226", flag: "🇧🇫", name: "Burkina Faso" },
	{ code: "+257", flag: "🇧🇮", name: "Burundi" },
	{ code: "+238", flag: "🇨🇻", name: "Cabo Verde" },
	{ code: "+855", flag: "🇰🇭", name: "Cambodia" },
	{ code: "+237", flag: "🇨🇲", name: "Cameroon" },
	{ code: "+1", flag: "🇨🇦", name: "Canada" },
	{ code: "+236", flag: "🇨🇫", name: "Central African Republic" },
	{ code: "+235", flag: "🇹🇩", name: "Chad" },
	{ code: "+56", flag: "🇨🇱", name: "Chile" },
	{ code: "+86", flag: "🇨🇳", name: "China" },
	{ code: "+57", flag: "🇨🇴", name: "Colombia" },
	{ code: "+269", flag: "🇰🇲", name: "Comoros" },
	{ code: "+242", flag: "🇨🇬", name: "Congo (Congo-Brazzaville)" },
	{ code: "+506", flag: "🇨🇷", name: "Costa Rica" },
	{ code: "+385", flag: "🇭🇷", name: "Croatia" },
	{ code: "+53", flag: "🇨🇺", name: "Cuba" },
	{ code: "+357", flag: "🇨🇾", name: "Cyprus" },
	{ code: "+420", flag: "🇨🇿", name: "Czechia (Czech Republic)" },
	{ code: "+243", flag: "🇨🇩", name: "Democratic Republic of the Congo" },
	{ code: "+45", flag: "🇩🇰", name: "Denmark" },
	{ code: "+253", flag: "🇩🇯", name: "Djibouti" },
	{ code: "+1-767", flag: "🇩🇲", name: "Dominica" },
	{ code: "+1-809", flag: "🇩🇴", name: "Dominican Republic" },
	{ code: "+593", flag: "🇪🇨", name: "Ecuador" },
	{ code: "+20", flag: "🇪🇬", name: "Egypt" },
	{ code: "+503", flag: "🇸🇻", name: "El Salvador" },
	{ code: "+240", flag: "🇬🇶", name: "Equatorial Guinea" },
	{ code: "+291", flag: "🇪🇷", name: "Eritrea" },
	{ code: "+372", flag: "🇪🇪", name: "Estonia" },
	{ code: "+268", flag: "🇸🇿", name: "Eswatini (formerly Swaziland)" },
	{ code: "+251", flag: "🇪🇹", name: "Ethiopia" },
	{ code: "+679", flag: "🇫🇯", name: "Fiji" },
	{ code: "+358", flag: "🇫🇮", name: "Finland" },
	{ code: "+33", flag: "🇫🇷", name: "France" },
	{ code: "+241", flag: "🇬🇦", name: "Gabon" },
	{ code: "+220", flag: "🇬🇲", name: "Gambia" },
	{ code: "+995", flag: "🇬🇪", name: "Georgia" },
	{ code: "+49", flag: "🇩🇪", name: "Germany" },
	{ code: "+233", flag: "🇬🇭", name: "Ghana" },
	{ code: "+30", flag: "🇬🇷", name: "Greece" },
	{ code: "+1-473", flag: "🇬🇩", name: "Grenada" },
	{ code: "+502", flag: "🇬🇹", name: "Guatemala" },
	{ code: "+224", flag: "🇬🇳", name: "Guinea" },
	{ code: "+245", flag: "🇬🇼", name: "Guinea-Bissau" },
	{ code: "+592", flag: "🇬🇾", name: "Guyana" },
	{ code: "+509", flag: "🇭🇹", name: "Haiti" },
	{ code: "+504", flag: "🇭🇳", name: "Honduras" },
	{ code: "+36", flag: "🇭🇺", name: "Hungary" },
	{ code: "+354", flag: "🇮🇸", name: "Iceland" },
	{ code: "+91", flag: "🇮🇳", name: "India" },
	{ code: "+62", flag: "🇮🇩", name: "Indonesia" },
	{ code: "+98", flag: "🇮🇷", name: "Iran" },
	{ code: "+964", flag: "🇮🇶", name: "Iraq" },
	{ code: "+353", flag: "🇮🇪", name: "Ireland" },
	{ code: "+972", flag: "🇮🇱", name: "Israel" },
	{ code: "+39", flag: "🇮🇹", name: "Italy" },
	{ code: "+225", flag: "🇨🇮", name: "Ivory Coast" },
	{ code: "+1-876", flag: "🇯🇲", name: "Jamaica" },
	{ code: "+81", flag: "🇯🇵", name: "Japan" },
	{ code: "+962", flag: "🇯🇴", name: "Jordan" },
	{ code: "+7", flag: "🇰🇿", name: "Kazakhstan" },
	{ code: "+254", flag: "🇰🇪", name: "Kenya" },
	{ code: "+686", flag: "🇰🇮", name: "Kiribati" },
	{ code: "+965", flag: "🇰🇼", name: "Kuwait" },
	{ code: "+996", flag: "🇰🇬", name: "Kyrgyzstan" },
	{ code: "+856", flag: "🇱🇦", name: "Laos" },
	{ code: "+371", flag: "🇱🇻", name: "Latvia" },
	{ code: "+961", flag: "🇱🇧", name: "Lebanon" },
	{ code: "+266", flag: "🇱🇸", name: "Lesotho" },
	{ code: "+231", flag: "🇱🇷", name: "Liberia" },
	{ code: "+218", flag: "🇱🇾", name: "Libya" },
	{ code: "+423", flag: "🇱🇮", name: "Liechtenstein" },
	{ code: "+370", flag: "🇱🇹", name: "Lithuania" },
	{ code: "+352", flag: "🇱🇺", name: "Luxembourg" },
	{ code: "+261", flag: "🇲🇬", name: "Madagascar" },
	{ code: "+265", flag: "🇲🇼", name: "Malawi" },
	{ code: "+60", flag: "🇲🇾", name: "Malaysia" },
	{ code: "+960", flag: "🇲🇻", name: "Maldives" },
	{ code: "+223", flag: "🇲🇱", name: "Mali" },
	{ code: "+356", flag: "🇲🇹", name: "Malta" },
	{ code: "+692", flag: "🇲🇭", name: "Marshall Islands" },
	{ code: "+222", flag: "🇲🇷", name: "Mauritania" },
	{ code: "+230", flag: "🇲🇺", name: "Mauritius" },
	{ code: "+52", flag: "🇲🇽", name: "Mexico" },
	{ code: "+691", flag: "🇫🇲", name: "Micronesia" },
	{ code: "+373", flag: "🇲🇩", name: "Moldova" },
	{ code: "+377", flag: "🇲🇨", name: "Monaco" },
	{ code: "+976", flag: "🇲🇳", name: "Mongolia" },
	{ code: "+382", flag: "🇲🇪", name: "Montenegro" },
	{ code: "+212", flag: "🇲🇦", name: "Morocco" },
	{ code: "+258", flag: "🇲🇿", name: "Mozambique" },
	{ code: "+95", flag: "🇲🇲", name: "Myanmar (formerly Burma)" },
	{ code: "+264", flag: "🇳🇦", name: "Namibia" },
	{ code: "+674", flag: "🇳🇷", name: "Nauru" },
	{ code: "+977", flag: "🇳🇵", name: "Nepal" },
	{ code: "+31", flag: "🇳🇱", name: "Netherlands" },
	{ code: "+64", flag: "🇳🇿", name: "New Zealand" },
	{ code: "+505", flag: "🇳🇮", name: "Nicaragua" },
	{ code: "+227", flag: "🇳🇪", name: "Niger" },
	{ code: "+234", flag: "🇳🇬", name: "Nigeria" },
	{ code: "+850", flag: "🇰🇵", name: "North Korea" },
	{ code: "+389", flag: "🇲🇰", name: "North Macedonia" },
	{ code: "+47", flag: "🇳🇴", name: "Norway" },
	{ code: "+968", flag: "🇴🇲", name: "Oman" },
	{ code: "+92", flag: "🇵🇰", name: "Pakistan" },
	{ code: "+680", flag: "🇵🇼", name: "Palau" },
	{ code: "+970", flag: "🇵🇸", name: "Palestine" },
	{ code: "+507", flag: "🇵🇦", name: "Panama" },
	{ code: "+675", flag: "🇵🇬", name: "Papua New Guinea" },
	{ code: "+595", flag: "🇵🇾", name: "Paraguay" },
	{ code: "+51", flag: "🇵🇪", name: "Peru" },
	{ code: "+63", flag: "🇵🇭", name: "Philippines" },
	{ code: "+48", flag: "🇵🇱", name: "Poland" },
	{ code: "+351", flag: "🇵🇹", name: "Portugal" },
	{ code: "+974", flag: "🇶🇦", name: "Qatar" },
	{ code: "+40", flag: "🇷🇴", name: "Romania" },
	{ code: "+7", flag: "🇷🇺", name: "Russia" },
	{ code: "+250", flag: "🇷🇼", name: "Rwanda" },
	{ code: "+1-869", flag: "🇰🇳", name: "Saint Kitts and Nevis" },
	{ code: "+1-758", flag: "🇱🇨", name: "Saint Lucia" },
	{ code: "+1-784", flag: "🇻🇨", name: "Saint Vincent and the Grenadines" },
	{ code: "+685", flag: "🇼🇸", name: "Samoa" },
	{ code: "+378", flag: "🇸🇲", name: "San Marino" },
	{ code: "+239", flag: "🇸🇹", name: "Sao Tome and Principe" },
	{ code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
	{ code: "+221", flag: "🇸🇳", name: "Senegal" },
	{ code: "+381", flag: "🇷🇸", name: "Serbia" },
	{ code: "+248", flag: "🇸🇨", name: "Seychelles" },
	{ code: "+232", flag: "🇸🇱", name: "Sierra Leone" },
	{ code: "+65", flag: "🇸🇬", name: "Singapore" },
	{ code: "+421", flag: "🇸🇰", name: "Slovakia" },
	{ code: "+386", flag: "🇸🇮", name: "Slovenia" },
	{ code: "+677", flag: "🇸🇧", name: "Solomon Islands" },
	{ code: "+252", flag: "🇸🇴", name: "Somalia" },
	{ code: "+27", flag: "🇿🇦", name: "South Africa" },
	{ code: "+82", flag: "🇰🇷", name: "South Korea" },
	{ code: "+211", flag: "🇸🇸", name: "South Sudan" },
	{ code: "+34", flag: "🇪🇸", name: "Spain" },
	{ code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
	{ code: "+249", flag: "🇸🇩", name: "Sudan" },
	{ code: "+597", flag: "🇸🇷", name: "Suriname" },
	{ code: "+46", flag: "🇸🇪", name: "Sweden" },
	{ code: "+41", flag: "🇨🇭", name: "Switzerland" },
	{ code: "+963", flag: "🇸🇾", name: "Syria" },
	{ code: "+992", flag: "🇹🇯", name: "Tajikistan" },
	{ code: "+255", flag: "🇹🇿", name: "Tanzania" },
	{ code: "+66", flag: "🇹🇭", name: "Thailand" },
	{ code: "+670", flag: "🇹🇱", name: "Timor-Leste" },
	{ code: "+228", flag: "🇹🇬", name: "Togo" },
	{ code: "+676", flag: "🇹🇴", name: "Tonga" },
	{ code: "+1-868", flag: "🇹🇹", name: "Trinidad and Tobago" },
	{ code: "+216", flag: "🇹🇳", name: "Tunisia" },
	{ code: "+90", flag: "🇹🇷", name: "Turkey" },
	{ code: "+993", flag: "🇹🇲", name: "Turkmenistan" },
	{ code: "+688", flag: "🇹🇻", name: "Tuvalu" },
	{ code: "+256", flag: "🇺🇬", name: "Uganda" },
	{ code: "+380", flag: "🇺🇦", name: "Ukraine" },
	{ code: "+44", flag: "🇬🇧", name: "United Kingdom" },
	{ code: "+1", flag: "🇺🇸", name: "United States of America" },
	{ code: "+598", flag: "🇺🇾", name: "Uruguay" },
	{ code: "+998", flag: "🇺🇿", name: "Uzbekistan" },
	{ code: "+678", flag: "🇻🇺", name: "Vanuatu" },
	{ code: "+379", flag: "🇻🇦", name: "Vatican City" },
	{ code: "+58", flag: "🇻🇪", name: "Venezuela" },
	{ code: "+84", flag: "🇻🇳", name: "Vietnam" },
	{ code: "+967", flag: "🇾🇪", name: "Yemen" },
	{ code: "+260", flag: "🇿🇲", name: "Zambia" },
	{ code: "+263", flag: "🇿🇼", name: "Zimbabwe" }
];

function initCountryPickers() {
  const list = (window.countryCodes && window.countryCodes.length) ? window.countryCodes : DEFAULT_COUNTRY_CODES;
  document.querySelectorAll('.country-list-container').forEach(container => {
    if (container.children.length > 0) return;
    const fragment = document.createDocumentFragment();
    list.forEach(c => {
      const item = document.createElement('div');
      item.className = 'country-item flex items-center space-x-2 p-2 hover:bg-neutral-100 cursor-pointer text-xs whitespace-nowrap';
      item.innerHTML = `<span>${c.flag}</span><span class="text-neutral-500 font-semibold">${c.code}</span><span class="text-neutral-900 truncate">${c.name}</span>`;
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
  if (container && container.children.length === 0) {
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
  const filter = input.value.toLowerCase().trim();
  const listContainer = input.parentElement.querySelector('.country-list-container') || input.nextElementSibling;
  if (!listContainer) return;
  
  const items = listContainer.querySelectorAll('.country-item');
  items.forEach(item => {
    const text = (item.textContent || item.innerText || '').toLowerCase();
    item.style.display = text.includes(filter) ? 'flex' : 'none';
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
    placeholder: 'اختر المسار الفرعي',
    dominica: 'دومينيكا',
    antigua: 'أنتيغوا وبربودا',
    grenada: 'غرينادا',
    stkitts: 'سانت كيتس ونيفيس',
    stlucia: 'سانت لوسيا',
    vanuatu: 'فانواتو',
    nauru: 'جمهورية ناورو',
    saotome: 'ساو تومي وبرينسيب',
    'uae-gv': 'التأشيرة الذهبية للإمارات',
    'greece-gv': 'التأشيرة الذهبية لليونان',
    'portugal-gv': 'التأشيرة الذهبية للبرتغال',
    'panama-pr': 'الإقامة الدائمة في بنما (المستثمر المؤهل)',
    'dubai-offplan': 'عقارات دبي على الخارطة',
    'dubai-ready': 'منازل وفلل جاهزة في دبي',
    'commercial-re': 'مساحات تجارية ومكتبية',
    'boarding-schools': 'المدارس الداخلية في بريطانيا وسويسرا',
    undergrad: 'القبول الجامعي (البكالوريوس)',
    postgrad: 'الدراسات العليا وماجستير إدارة الأعمال'
  },
  fa: {
    placeholder: 'انتخاب زیربرنامه',
    dominica: 'دومینیکا',
    antigua: 'آنتیگوا و باربودا',
    grenada: 'گرانادا',
    stkitts: 'سنت کیتس و نویس',
    stlucia: 'سنت لوسیا',
    vanuatu: 'وانواتو',
    nauru: 'جمهوری نائورو',
    saotome: 'سائوتومه و پرنسیپ',
    'uae-gv': 'ویزای طلایی امارات',
    'greece-gv': 'ویزای طلایی یونان',
    'portugal-gv': 'ویزای طلایی پرتغال',
    'panama-pr': 'اقامت دائم پاناما (سرمایه‌گذار واجد شرایط)',
    'dubai-offplan': 'املاک در حال ساخت دبی',
    'dubai-ready': 'خانه‌ها و ویلاهای آماده دبی',
    'commercial-re': 'املاک تجاری و اداری',
    'boarding-schools': 'مدارس شبانه‌روزی بریتانیا و سوئیس',
    undergrad: 'پذیرش دوره کارشناسی',
    postgrad: 'تحصیلات تکمیلی و ام‌بی‌ای'
  },
  zh: {
    placeholder: '请选择子项目',
    dominica: '多米尼克',
    antigua: '安提瓜和巴布达',
    grenada: '格林纳达',
    stkitts: '圣基茨和尼维斯',
    stlucia: '圣卢西亚',
    vanuatu: '瓦努阿图',
    nauru: '瑙鲁共和国',
    saotome: '圣多美和普林西比',
    'uae-gv': '阿联酋黄金签证',
    'greece-gv': '希腊黄金签证',
    'portugal-gv': '葡萄牙黄金签证',
    'panama-pr': '巴拿马合格投资者永久居留',
    'dubai-offplan': '迪拜期房 / 新发项目',
    'dubai-ready': '现房与高端别墅',
    'commercial-re': '商业与写字楼物业',
    'boarding-schools': '英国与瑞士寄宿学校',
    undergrad: '本科申请',
    postgrad: '研究生与MBA录取'
  }
};

// --- TOAST NOTIFICATION UTILITY ---
function showFormNotification(message, type) {
  type = type || 'success';
  let toast = document.getElementById('sg-form-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sg-form-toast';
    toast.className = 'fixed bottom-6 right-6 z-[9999] max-w-md p-4 rounded-xl shadow-2xl text-xs font-medium transition-all duration-300 transform translate-y-12 opacity-0 flex items-center space-x-3 pointer-events-none';
    document.body.appendChild(toast);
  }
  
  if (type === 'success') {
    toast.style.backgroundColor = '#1C1917';
    toast.style.color = '#F5F5F4';
    toast.style.border = '1px solid #786142';
    toast.innerHTML = `<span style="font-size:1.2rem;color:#C5A880;margin-right:8px;">✓</span><span>${message}</span>`;
  } else {
    toast.style.backgroundColor = '#7F1D1D';
    toast.style.color = '#FEE2E2';
    toast.style.border = '1px solid #EF4444';
    toast.innerHTML = `<span style="font-size:1.2rem;color:#FCA5A5;margin-right:8px;">⚠</span><span>${message}</span>`;
  }

  toast.classList.remove('translate-y-12', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0');
  }, 6000);
}
window.showFormNotification = showFormNotification;

const TRANSMIT_MESSAGES = {
  en: {
    transmitting: 'Transmitting...',
    success: 'Inquiry submitted successfully. Our advisory team will contact you shortly.',
    error: 'Failed to send request. Please check your connection or contact us via WhatsApp.'
  },
  ar: {
    transmitting: 'جارٍ الإرسال...',
    success: 'تم إرسال استفسارك بنجاح. سيتواصل معك مستشارونا المتخصصون قريباً.',
    error: 'تعذر إرسال الطلب. يرجى التحقق من اتصال الإنترنت أو التواصل معنا عبر واتساب.'
  },
  fa: {
    transmitting: 'در حال ارسال...',
    success: 'درخواست شما با موفقیت ثبت شد. مشاوران شریف گروپ به زودی با شما تماس خواهند گرفت.',
    error: 'ارسال درخواست با خطا مواجه شد. لطفاً اتصال اینترنت خود را بررسی کنید یا از طریق واتس‌اپ پیام دهید.'
  },
  zh: {
    transmitting: '正在提交...',
    success: '您的咨询已成功提交。我们的专属顾问将尽快与您联系。',
    error: '提交失败，请检查网络连接或通过 WhatsApp 与我们联系。'
  }
};

function handleServiceSelectionChange(selectEl) {
  const selectedService = selectEl.value;
  const form = selectEl.closest('form');
  const subSelect = form.querySelector('#sub-service-choice') || form.querySelector('#sub-service-choice-standalone');
  if (!subSelect) return;
  
  const curLang = (window.getCurrentLanguage ? window.getCurrentLanguage() : document.documentElement.lang) || 'en';
  const loc = SUB_PROGRAM_LOCALIZED[curLang];
  const placeholderText = (loc && loc.placeholder) ? loc.placeholder : 'Select Sub-Program';

  subSelect.innerHTML = `<option value="" data-i18n="contact.selectSubProgram">${placeholderText}</option>`;

  if (SUB_PROGRAM_MAP[selectedService]) {
    SUB_PROGRAM_MAP[selectedService].forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.value;
      opt.textContent = (loc && loc[sub.value]) ? loc[sub.value] : sub.label;
      subSelect.appendChild(opt);
    });
  }
}

// Auto-detect page category and pre-populate targetProgram dropdown if present
function autoInitStandaloneForms() {
  const path = (window.location.pathname || '').toLowerCase();
  document.querySelectorAll('select[name="targetProgram"]').forEach(sel => {
    if (!sel.value) {
      if (path.includes('citizenshipbyinvestment') || path.includes('/citizenship')) {
        sel.value = 'citizenship';
        handleServiceSelectionChange(sel);
      } else if (path.includes('residencybyinvestment') || path.includes('/residency')) {
        sel.value = 'residency';
        handleServiceSelectionChange(sel);
      } else if (path.includes('realestate')) {
        sel.value = 'real-estate';
        handleServiceSelectionChange(sel);
      } else if (path.includes('educationaladvisory')) {
        sel.value = 'education';
        handleServiceSelectionChange(sel);
      }
    }
  });

  // Ensure subProgram does not block submission when empty
  document.querySelectorAll('select[name="subProgram"], #sub-service-choice-standalone').forEach(subSel => {
    subSel.removeAttribute('required');
  });
}

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

  // Phone number & Dial Code handling with digit normalization
  const dialCode = toLatinDigits(form.querySelector('.dial-code-hidden-value')?.value || payload.dialCode || '+971').trim();
  const rawPhone = toLatinDigits(form.querySelector('input[type="tel"]')?.value || payload.phone || '').trim();
  payload.dialCode = dialCode;
  payload.phone = `${dialCode} ${rawPhone}`.trim();

  // Normalize email digits if present
  if (payload.email) {
    payload.email = toLatinDigits(payload.email).trim();
  }

  // Full name handling (Salutation removed)
  if (!payload.fullName && (payload.firstName || payload.lastName)) {
    payload.fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  }

  // Map country/residence for CRM
  if (!payload.country) {
    payload.country = payload.residence || payload.nationality || payload.address || payload.timezone || '';
  }

  // Normalize dedicated questionnaire fields for CRM
  payload.familyMembers = payload.familyMembers || payload.family || payload.familySize || '';
  payload.investmentRoute = payload.investmentRoute || payload.route || '';
  payload.budget = payload.budget || payload.budgetTier || '';
  payload.objective = payload.objective || payload.primaryObjective || (Array.isArray(payload.goals) ? payload.goals.join(', ') : (payload.goals || ''));
  payload.timeline = payload.timeline || payload.planningTimeline || '';
  payload.nationality = payload.nationality || payload.citizenship || '';
  payload.residence = payload.residence || payload.country || '';

  // Map service/program clearly for Google Sheet
  const primaryProgram = payload.programChoice || payload.targetProgram || payload.program || payload.investmentRoute || '';
  if (!payload.service) {
    payload.service = primaryProgram;
    if (payload.subProgram) {
      payload.service += (payload.service ? ` (${payload.subProgram})` : payload.subProgram);
    }
  } else if (payload.subProgram && !payload.service.includes(payload.subProgram)) {
    payload.service += ` (${payload.subProgram})`;
  }

  // Enriched notes
  const extraDetails = [];
  if (payload.programChoice) extraDetails.push(`Program: ${payload.programChoice}`);
  if (payload.subProgram) extraDetails.push(`Sub-Program: ${payload.subProgram}`);
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

  payload.source = window.location.href;
  payload.page = window.location.pathname;
  payload.form_id = form.id || 'program-consult-form';

  try {
    // 1. Dispatch to direct server mailer API (authenticated email to mohammad@sharifgroup.ae + local data backup)
    try {
      fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function() {});
    } catch (apiErr) {}

    // 2. Dispatch to Google Apps Script CRM Webhook (Google Sheets sync)
    if (CRM_WEBHOOK_URL) {
      await fetch(CRM_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    }

    form.reset();

    // Show inline success box if present
    if (successBox) {
      successBox.classList.remove('hidden');
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Always show modern floating confirmation toast
    showFormNotification(i18nMsg.success, 'success');

  } catch (error) {
    console.error("Transmission error:", error);
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
window.autoInitStandaloneForms = autoInitStandaloneForms;
