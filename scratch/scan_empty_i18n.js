const fs = require('fs');
const html = fs.readFileSync('aboutus/index.html', 'utf8');
const en = JSON.parse(fs.readFileSync('assets/locales/en.json', 'utf8'));

function getNested(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const re = /data-i18n=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:span|p|h1|h2|h3|h4|h5|h6|a|div|li|button|label)>/gi;
let m;
let emptyCount = 0;
while ((m = re.exec(html)) !== null) {
  const key = m[1];
  const inner = m[2].replace(/<[^>]*>/g, '').trim();
  if (!inner) {
    const enVal = getNested(en, key);
    console.log('EMPTY:', key, '--> expected:', enVal);
    emptyCount++;
  }
}
console.log('Total empty data-i18n elements in aboutus/index.html:', emptyCount);
