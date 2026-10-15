const fs = require('fs');

let html = fs.readFileSync('aboutus/index.html', 'utf8');
const en = JSON.parse(fs.readFileSync('assets/locales/en.json', 'utf8'));

function getNested(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const keysToFix = [
  'certifications_item8',
  'certifications_item9',
  'certifications_item10',
  'certifications_item11',
  'certifications_item16',
  'certifications_item17',
  'certifications_item18',
  'certifications_item19',
  'certifications_item24',
  'certifications_item25',
  'certifications_item26',
  'certifications_item27',
  'certifications_item32',
  'certifications_item33',
  'certifications_item34'
];

let replacedCount = 0;
for (const key of keysToFix) {
  const fullKey = 'pages.aboutUs.' + key;
  const enVal = getNested(en, fullKey);
  if (!enVal) {
    console.error('Missing key in en.json:', fullKey);
    continue;
  }

  // Look for data-i18n="pages.aboutUs.certifications_itemX"><span></span></span>
  const targetPattern = new RegExp(`(data-i18n=["']${fullKey.replace('.', '\\.')}["'][^>]*>)(?:<span></span>|\\s*)*(</span>)`, 'g');
  if (targetPattern.test(html)) {
    html = html.replace(targetPattern, `$1${enVal}$2`);
    console.log('Fixed:', fullKey, '->', enVal);
    replacedCount++;
  } else {
    console.warn('Pattern not matched for:', fullKey);
  }
}

fs.writeFileSync('aboutus/index.html', html, 'utf8');
console.log('Done! Replaced', replacedCount, 'elements in aboutus/index.html');
