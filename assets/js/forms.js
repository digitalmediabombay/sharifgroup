// --- CENTRAL FORM & CRM DISPATCH CONTROLLER ---

// Webhook URL connected to Website_Leads Google Sheet
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

// 2. Dynamic Service & Sub-Program Mapping (Homepage & Contact Us)
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

function handleServiceSelectionChange(selectEl) {
  const selectedService = selectEl.value;
  const form = selectEl.closest('form');
  const subSelect = form.querySelector('#sub-service-choice') || form.querySelector('#sub-service-choice-standalone');
  if (!subSelect) return;
  
  subSelect.innerHTML = '<option value="">Select Sub-Program</option>';

  if (SUB_PROGRAM_MAP[selectedService]) {
    SUB_PROGRAM_MAP[selectedService].forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub.value;
      opt.textContent = sub.label;
      subSelect.appendChild(opt);
    });
  }
}

// 3. Central Submission Handler (Sabhi forms ke liye)
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

  // FormData se sabhi input/select values auto collect hongi
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  // Phone number ko dial code ke sath jodna
  const dialCode = form.querySelector('.dial-code-hidden-value')?.value || '';
  const rawPhone = form.querySelector('input[type="tel"]')?.value || '';
  payload.phone = `${dialCode} ${rawPhone}`.trim();
  
  // Page source and identification mapping
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
    } else {
      console.log("Form submitted locally:", payload);
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
