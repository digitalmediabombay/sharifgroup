const fs = require('fs');

const cmsJs = fs.readFileSync(__dirname + '/../admin/cms.js', 'utf8');

const aboutusStart = cmsJs.indexOf('  aboutus: {');
const cookieStart = cmsJs.indexOf('  cookiepolicy: {');
const aboutusStr = cmsJs.substring(aboutusStart + '  aboutus: '.length, cookieStart).trim().replace(/,\s*$/, '');

const aboutus = eval('(' + aboutusStr + ')');
console.log("AboutUs languages in hero:", Object.keys(aboutus.hero));
console.log("AboutUs languages in overview:", Object.keys(aboutus.overview));
console.log("AboutUs ZH overview p1:", aboutus.overview.zh.p1);
console.log("AboutUs AR overview p1:", aboutus.overview.ar.p1);
console.log("AboutUs FA overview p1:", aboutus.overview.fa.p1);

// Save clean aboutus to JSON
fs.writeFileSync(__dirname + '/clean_aboutus.json', JSON.stringify(aboutus, null, 2), 'utf8');
console.log("Saved clean_aboutus.json successfully!");
