/** 목록과 상세가 같이 쓰는 표시. 코드값은 바꾸지 않고 글자만 바꾼다. */

export function conceptText(flag) {
  if (flag === 'S') return 'Standard';
  if (flag === 'C') return 'Classification';
  return 'Non-standard';
}

export function validityText(reason) {
  return reason == null || reason === '' ? 'Valid' : 'Invalid';
}

export function dateText(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

export function displayName(item) {
  if (!item) return '';
  const name = item.conceptName || '';
  return item.isLocal ? `임시 ${name}` : name;
}
