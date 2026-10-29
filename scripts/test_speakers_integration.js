// Test simulation of webinars-app.js speaker resolution
const fs = require('fs');

const appCode = fs.readFileSync('assets/js/webinars-app.js', 'utf8');

// Extract DEFAULT_SPEAKERS_BY_LANG, isBorsalani, isYarahmadi, localizeSpeaker, localizeSpeakers
const sub = appCode.substring(
  appCode.indexOf('const DEFAULT_SPEAKERS_BY_LANG'),
  appCode.indexOf('function webinars()')
);

// Evaluate helper functions in test scope
const helpers = new Function(sub + '; return { DEFAULT_SPEAKERS_BY_LANG, isBorsalani, isYarahmadi, localizeSpeaker, localizeSpeakers };')();
const { DEFAULT_SPEAKERS_BY_LANG, localizeSpeakers } = helpers;

console.log('Testing DEFAULT_SPEAKERS_BY_LANG and localizeSpeakers:');

const testCases = [
  { lang: 'ar', expectedName1: 'محمد برسلاني', expectedName2: 'مهدي يار أحمدي' },
  { lang: 'fa', expectedName1: 'محمد برسلانی', expectedName2: 'مهدی یاراحمدی' },
  { lang: 'zh', expectedName1: '穆罕默德·巴尔塞拉尼 (Mohammad Borsalani)', expectedName2: '迈赫迪·亚拉赫马迪 (Mehdi Yarahmadi)' },
  { lang: 'en', expectedName1: 'Mohammad Borsalani', expectedName2: 'Mehdi Yarahmadi' },
];

let allPassed = true;

// 1. Test standard resolution from English source array
testCases.forEach(tc => {
  const input = [
    { name: 'Mohammad Borsalani', title: 'Senior Consultant...', affiliation: 'Sharif Group Dubai' },
    { name: 'Mehdi Yarahmadi', title: 'Dominica Specialist...', affiliation: 'Sharif Group Dubai' }
  ];
  const out = localizeSpeakers(input, tc.lang);
  const pass1 = out[0].name === tc.expectedName1;
  const pass2 = out[1].name === tc.expectedName2;
  console.log(`[${tc.lang.toUpperCase()}] Sp1: ${out[0].name} (Pass: ${pass1}), Sp2: ${out[1].name} (Pass: ${pass2})`);
  if (!pass1 || !pass2) allPassed = false;
});

// 2. Test custom speaker preservation
const customInput = [
  { name: 'Dr. Ali Reza', title: 'Managing Director', affiliation: 'Sharif Group Dubai' }
];
['en', 'ar', 'fa', 'zh'].forEach(lg => {
  const out = localizeSpeakers(customInput, lg);
  const pass = out[0].name === 'Dr. Ali Reza';
  console.log(`[Custom Speaker in ${lg.toUpperCase()}] Name: ${out[0].name} (Pass: ${pass})`);
  if (!pass) allPassed = false;
});

// 3. Test C(w) logic simulation with session 1
const mockSession1 = {
  session_no: 1,
  speakers: [
    { name: 'Mohammad Borsalani', title: 'Senior Consultant', affiliation: 'Sharif Group Dubai' },
    { name: 'Mehdi Yarahmadi', title: 'Specialist', affiliation: 'Sharif Group Dubai' }
  ],
  ar: {
    speakers: [
      { name: 'محمد برسلاني', title: 'مستشار أول لبرامج الجنسية في دول الكاريبي', affiliation: 'شريف جروب دبي' },
      { name: 'مهدي يار أحمدي', title: 'خبير برنامج جواز سفر دومينيكا', affiliation: 'شريف جروب دبي' }
    ]
  }
};

const resolveSpeakersForLang = (w, lang) => {
  const cur = w[lang] || {};
  const en = w.en || {};
  let rawSpeakers = [];
  if (Array.isArray(cur.speakers) && cur.speakers.length) {
    rawSpeakers = cur.speakers;
  } else if (Array.isArray(w.speakers) && w.speakers.length) {
    rawSpeakers = w.speakers;
  } else if (Array.isArray(en.speakers) && en.speakers.length) {
    rawSpeakers = en.speakers;
  }
  return localizeSpeakers(rawSpeakers, lang);
};

const arResolved = resolveSpeakersForLang(mockSession1, 'ar');
console.log('[Mock C(w) for Arabic]:', arResolved[0].name, '|', arResolved[0].title, '|', arResolved[0].affiliation);
if (arResolved[0].name !== 'محمد برسلاني' || arResolved[0].affiliation !== 'شريف جروب دبي') {
  allPassed = false;
}

if (allPassed) {
  console.log('\n>>> ALL SPEAKER LOCALIZATION TESTS PASSED SUCCESSFULLY! <<<');
} else {
  console.error('\n>>> SOME TESTS FAILED! <<<');
  process.exit(1);
}

