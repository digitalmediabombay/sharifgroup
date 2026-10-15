function isMojibakeString(str) {
  if (typeof str !== 'string' || !str) return false;
  if (/[\u2500-\u259F\uFFFD]|ΓÇ[ôöòóõ]|[\u0390-\u03C9]{2,}|\\u0026amp;/i.test(str)) return true;
  if (/æ[¬¢\x80-\xFF]|è[¿Ž°\x80-\xFF]|å[ˆ°«\x80-\xFF]|ç[º»\x80-\xFF]|é[\x80-\xFF]|ä[\x80-\xFF]/.test(str)) {
    if (!/[\u4E00-\u9FFF]/.test(str)) return true;
  }
  if (/[ØÙ][\u0080-\u00FF]/.test(str)) {
    if (!/[\u0600-\u06FF]/.test(str)) return true;
  }
  if (/(?:O\s*U,|AE\+|[A-Za-z]\s*[¿Ž°ˆ¬¢]|A["”][A-Za-z"”]+)/.test(str)) return true;
  return false;
}

const tests = [
  ['æ¬¢è¿Žæ ¥åˆ°è°¢é‡Œå¤«é›†å›¢', true],
  ['欢迎来到谢里夫集团', false],
  ['Ø§Ù„Ø¬Ù†Ø³ÙŠØ©', true],
  ['مرحباً بكم في مجموعة شريف', false],
  ['به شریف گروپ خوش آمدید', false],
  ['Welcome to Sharif Group', false],
  ['O U,U.U^O OU+Oc', true],
  ['å·²é‡‡å½...', true],
  ['Three Companies. One Commitment.', false]
];

let allPassed = true;
tests.forEach(([s, exp]) => {
  const res = isMojibakeString(s);
  const ok = res === exp;
  if (!ok) allPassed = false;
  console.log((ok ? 'PASS' : 'FAIL') + ' -> isMojibake: ' + res + ' for: ' + s);
});
console.log('All passed:', allPassed);
