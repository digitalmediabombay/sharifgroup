const fs = require('fs');
const code = fs.readFileSync(__dirname + '/../admin/cms.js', 'utf8');

const startIdx = code.indexOf('const DEFAULTS = {');
const endIdx = code.indexOf('\n// ─── CMS CORE API');

const defaultsCode = code.substring(startIdx, endIdx).replace('const DEFAULTS =', 'sandbox.DEFAULTS =');
const sandbox = {};
const fn = new Function('sandbox', defaultsCode);
fn(sandbox);
const D = sandbox.DEFAULTS;

console.log("Keys in DEFAULTS:", Object.keys(D));
console.log("Homepage ZH headline:", D.homepage?.hero?.zh?.headline);
console.log("Homepage AR headline:", D.homepage?.hero?.ar?.headline);
console.log("Homepage FA headline:", D.homepage?.hero?.fa?.headline);
console.log("About Us ZH title:", D.aboutus?.hero?.zh?.title);
console.log("About Us AR title:", D.aboutus?.hero?.ar?.title);
console.log("About Us FA title:", D.aboutus?.hero?.fa?.title);
console.log("Citizenship count:", D.citizenship?.length);
console.log("Residency count:", D.residency?.length);
