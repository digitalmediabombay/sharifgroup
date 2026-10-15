function isMojibakeString(str) {
  if (typeof str !== 'string' || !str) return false;
  if (/[\u2500-\u259F\uFFFD]|ΓÇ[ôöòóõô–•]|\\u0026amp;/i.test(str)) return true;
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
  'å…¬æ°‘èº«ä»½',
  'å±…ç•™æ ƒ',
  'æˆ¿åœ°äº§æŠ•èµ„',
  'æ•™è‚²å’¨è¯¢',
  'è°¢é‡Œå¤«'
];

for (const t of tests) {
  console.log(t, '->', isMojibakeString(t));
}
