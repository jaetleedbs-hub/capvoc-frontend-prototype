/**
 * pg_trgm 과 같은 3글자 유사도.
 * 양쪽 끝에 공백 두 칸을 붙인 뒤 겹치는 트라이그램 비율을 낸다.
 * `%` 연산의 기본 한계(0.3) 이상만 유사 철자 후보로 쓴다.
 */

const FUZZY_THRESHOLD = 0.3;

function trigrams(value) {
  const padded = `  ${value} `;
  const grams = [];
  for (let index = 0; index < padded.length - 2; index += 1) {
    grams.push(padded.slice(index, index + 3));
  }
  return grams;
}

export function similarity(left, right) {
  const a = trigrams(String(left || '').toLowerCase());
  const b = trigrams(String(right || '').toLowerCase());
  if (a.length === 0 || b.length === 0) return 0;
  const counts = new Map();
  b.forEach((gram) => counts.set(gram, (counts.get(gram) || 0) + 1));
  let shared = 0;
  a.forEach((gram) => {
    const count = counts.get(gram) || 0;
    if (count > 0) {
      shared += 1;
      counts.set(gram, count - 1);
    }
  });
  return shared / (a.length + b.length - shared);
}

export function isSimilar(left, right) {
  return similarity(left, right) >= FUZZY_THRESHOLD;
}

export { FUZZY_THRESHOLD };
