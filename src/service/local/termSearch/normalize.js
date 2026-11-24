/**
 * Athena 검색과 같은 키워드 정규화.
 * 화면은 문자열을 고치지 않고, 조회 쪽이 이 세 값을 만든다.
 *
 * exact  — 전체가 따옴표로 감싸져 완전 일치만 찾을 때
 * phrase — 구분자와 공백을 정리한 소문자 구문
 * tokens — 구문을 단어로 나눈 것. 기호만 있는 토큰은 버린다.
 */

const SPLIT_MARKS = /[/\\|?!,;.\s]+/g;
const LONE_MARK = /^[+\-():^[\]~*&]$/;

export function normalizeKeyword(keyword) {
  const trimmed = String(keyword == null ? '' : keyword).trim();
  const quoted = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
  const body = (quoted ? trimmed.slice(1, -1) : trimmed).trim();
  const phrase = body.replace(SPLIT_MARKS, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const tokens = phrase.split(' ').filter((token) => token && !LONE_MARK.test(token));
  const numericIds = tokens
    .filter((token) => /^\d+$/.test(token))
    .map((token) => Number(token))
    .filter((value) => Number.isSafeInteger(value));

  return {
    exact: quoted,
    phrase,
    tokens,
    numericIds,
  };
}
