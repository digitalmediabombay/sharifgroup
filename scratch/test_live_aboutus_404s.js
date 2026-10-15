const fs = require('fs');
const https = require('https');

const html = fs.readFileSync('scratch/live_aboutus.html', 'utf8');

const regex = /(?:src|href|url)=['"]([^'"]+)['"]/gi;
let m;
const list = new Set();
while ((m = regex.exec(html)) !== null) {
  let val = m[1].trim();
  if (val.match(/\.(js|css|webp|png|jpg|jpeg|svg|gif|mp4|json|ico)/i)) {
    list.add(val);
  }
}

async function checkUrl(urlStr) {
  return new Promise((resolve) => {
    https.get(urlStr, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url: urlStr, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url: urlStr, status: 'ERR: ' + err.message });
    });
  });
}

async function run() {
  console.log('Testing', list.size, 'resources found on live aboutus page...');
  for (const raw of list) {
    let clean = raw.split('?')[0].split('#')[0];
    let fullUrl = '';
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      fullUrl = clean;
    } else if (clean.startsWith('/')) {
      fullUrl = 'https://sharifgroup.ae' + clean;
    } else {
      // relative to https://sharifgroup.ae/aboutus/
      fullUrl = 'https://sharifgroup.ae/aboutus/' + clean;
    }
    const res = await checkUrl(fullUrl);
    if (res.status === 404 || res.status >= 400 || typeof res.status === 'string') {
      console.log('FAIL:', res.status, fullUrl, '(original was:', raw + ')');
    } else {
      console.log('OK  :', res.status, fullUrl);
    }
  }

  // Also check the dynamic fetch candidates from cms-live.js on /aboutus/
  console.log('\nTesting dynamic candidates from cms-live.js on /aboutus/...');
  const dynamicUrls = [
    'https://sharifgroup.ae/aboutus/admin/api/published_content.json',
    'https://sharifgroup.ae/admin/api/published_content.json',
    'https://sharifgroup.ae/admin/api/content.php?mode=live',
    'https://sharifgroup.ae/assets/js/cms-live.js',
    'https://sharifgroup.ae/aboutus/certificates/IMC.webp',
    'https://sharifgroup.ae/aboutus/alisharif.webp'
  ];
  for (const u of dynamicUrls) {
    const res = await checkUrl(u);
    console.log(res.status === 404 ? '404-ERR:' : 'STATUS :', res.status, u);
  }
}

run();
