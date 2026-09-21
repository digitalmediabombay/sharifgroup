// --- CENTRAL FORM & CRM DISPATCH CONTROLLER ---

const CRM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx1htojc2xrudJ3i9eRepORLmAXqh6vk2IoBy6bUrtPqlcpODqI5XVdgUpXWYbgpCXOvg/exec"; 

// 1. Country Dial Code Dropdown Toggle & Filter
function toggleCountryDropdown(button) {
  const wrapper = button.closest('.custom-select-wrapper');
  const dropdown = wrapper ? wrapper.querySelector('.custom-select-dropdown') : null;
  
  document.querySelectorAll('.custom-select-dropdown').forEach(d => {
    if (d !== dropdown) d.classList.remove('active');
  });
  
  if (dropdown) dropdown.classList.toggle('active');
}

function filterCountryCode(input) {
  const filter = input.value.toLowerCase();
  const listContainer = input.parentElement.querySelector('.country-list-container');
  if (!listContainer) return;
  
  const items = listContainer.querySelectorAll('.country-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(filter) ? '' : 'none';
  });
}

function selectCountryCode(element, code, dial) {
  const wrapper = element.closest('.custom-select-wrapper');
  if (!wrapper) return;
  
  const span = wrapper.querySelector('.selected-country-span');
  if (span) span.textContent = `${code} ${dial}`;
  
  const hiddenInput = wrapper.parentElement.querySelector('.dial-code-hidden-value');
  if (hiddenInput) hiddenInput.value = dial;
  
  const dropdown = wrapper.querySelector('.custom-select-dropdown');
  if (dropdown) dropdown.classList.remove('active');
}

// Bahar click karne par dropdown close ho jaye
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select-wrapper')) {
    document.querySelectorAll('.custom-select-dropdown').forEach(d => d.classList.remove('active'));
  }
});

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

// 3. Central Submission Handler
async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
  const successBox = form.querySelector('#contact-form-success') || form.querySelector('#standalone-form-success');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Transmitting...';
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  // Phone number & Dial Code handling
  const dialCode = form.querySelector('.dial-code-hidden-value')?.value || '+971';
  const rawPhone = form.querySelector('input[type="tel"]')?.value || '';
  payload.dialCode = dialCode;
  payload.phone = `${dialCode} ${rawPhone}`.trim();

  // Full name handling (Salutation removed)
  if (!payload.fullName && (payload.firstName || payload.lastName)) {
    payload.fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  }

  payload.source = window.location.href;
  payload.page = window.location.pathname;
  payload.form_id = form.id || 'program-consult-form';

  try {
    if (CRM_WEBHOOK_URL) {
      await fetch(CRM_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    form.reset();
    if (successBox) {
      successBox.classList.remove('hidden');
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (error) {
    console.error("Transmission error:", error);
    alert('Failed to send request. Please check your connection.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}
