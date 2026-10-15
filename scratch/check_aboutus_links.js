const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('aboutus/index.html', 'utf8');

const regex = /(?:src|href)=['"]([^'"]+\.(?:js|css|webp|png|jpg|jpeg|svg|gif|mp4|json|ico)[^'"]*)['"]/gi;
let m;
const list = new Set();
while ((m = regex.exec(html)) !== null) {
  list.add(m[1]);
}

console.log('--- CHECKING ABOUT US ASSETS ---');
for (const res of list) {
  let clean = res.split('?')[0].split('#')[0];
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    continue;
  }
  let localPath;
  if (clean.startsWith('/')) {
    localPath = path.join('.', clean.substring(1));
  } else {
    localPath = path.join('aboutus', clean);
  }
  const exists = fs.existsSync(localPath);
  console.log((exists ? 'OK  :' : '404 :'), clean, '-->', localPath);
}
