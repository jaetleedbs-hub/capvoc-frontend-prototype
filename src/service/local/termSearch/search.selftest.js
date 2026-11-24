/**
 * 표준용어 검색 확인. 화면 설계 8장의 입력을 로컬 현재본으로 대조한다.
 * 실행: node --experimental-default-type=module src/service/local/termSearch/search.selftest.js
 */

import { LocalHttpError } from '../httpError.js';
import { normalizeKeyword } from './normalize.js';
import { getConceptDetail, searchConcepts } from './search.js';
import { VOCAB } from './seed.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function idsOf(keyword, extra) {
  return searchConcepts({ keyword, page: 1, size: 50, ...extra }).items.map((item) => item.conceptId);
}

function sum(rows) {
  return (rows || []).reduce((total, row) => total + row.cnt, 0);
}

const before = VOCAB.concepts.length;
const empty = searchConcepts({ keyword: '', page: 1, size: 15 });
assert(empty.items[0].conceptName === 'Abdominal pain', '빈 키워드의 첫 행은 이름 순이다');
assert(empty.versions.some((row) => row.versionLabel === 'v20250827'), '아테나 버전 목록에 현재본이 있다');
assert(empty.items.every((item, index) => index === 0 || item.conceptName.localeCompare(empty.items[index - 1].conceptName, 'en', { sensitivity: 'base' }) >= 0), '빈 키워드는 이름 오름차순이다');
assert(sum(empty.facets.domain) === empty.total, 'DOMAIN 건수 합은 총건수와 같다');
assert(sum(empty.facets.standard) === empty.total, 'CONCEPT 건수 합은 총건수와 같다');
assert(sum(empty.facets.class) === empty.total, 'CLASS 건수 합은 총건수와 같다');
assert(sum(empty.facets.vocabulary) === empty.total, 'VOCAB 건수 합은 총건수와 같다');
assert(sum(empty.facets.validity) === empty.total, 'VALIDITY 건수 합은 총건수와 같다');
assert(empty.facets.domain.some((row) => row.id === 'Obs' && row.name === 'Obs'), '도메인 마스터에 없으면 코드를 그대로 보여 준다');

const byId = searchConcepts({ keyword: '1112807', page: 1, size: 15 });
assert(byId.items[0].conceptId === 1112807, '숫자 키워드의 1행은 그 concept_id 다');
assert(byId.items.some((item, index) => index > 0 && item.conceptCode === '1112807'), '같은 숫자의 코드 일치가 아래에 있다');

const aspirin = searchConcepts({ keyword: 'aspirin', page: 1, size: 15 });
const aspirinIds = aspirin.items.map((item) => item.conceptId);
assert(aspirinIds.indexOf(1200001) < aspirinIds.indexOf(1112807), '코드 완전 일치가 이름 완전 일치보다 위다');
assert(aspirinIds.indexOf(1112807) < aspirinIds.indexOf(19019073), '이름 완전 일치가 구문 포함보다 위다');
assert(aspirinIds.includes(440001), '동의어만 맞은 행이 나온다');
assert(aspirin.items.find((item) => item.conceptId === 990001).isLocal === true, '임시컨셉은 isLocal 이다');

const quoted = idsOf('"aspirin"');
assert(quoted.includes(1112807) && quoted.includes(1200001) && quoted.includes(440001), '따옴표는 완전 일치만 남긴다');
assert(!quoted.includes(19019073) && !quoted.includes(990001), '따옴표 검색에 구문 포함이 없다');

const fuzzy = idsOf('asprin');
assert(fuzzy.includes(1112807), '오타 asprin 에 aspirin 유사 행이 있다');
assert(!fuzzy.includes(2001), '유사도가 낮은 행은 오타 결과에 없다');

const bothFlags = searchConcepts({ keyword: '', validityFlags: ['VALID', 'INVALID'], page: 1, size: 100 });
assert(bothFlags.total === empty.total, '유효와 무효를 같이 고르면 제한이 없다');
const onlyInvalid = searchConcepts({ keyword: '', validityFlags: ['INVALID'], page: 1, size: 100 });
assert(onlyInvalid.total > 0 && onlyInvalid.items.every((item) => item.invalidReason), 'INVALID 만 고르면 무효 행만 남는다');
assert(onlyInvalid.facets.validity.some((row) => row.id === 'VALID' && row.cnt > 0), '유효 건수는 자기 선택에 가리지 않는다');
const nonStandard = searchConcepts({ keyword: '', standardFlags: [''], page: 1, size: 100 });
assert(nonStandard.total > 0 && nonStandard.items.every((item) => item.standardConcept == null || item.standardConcept === ''), '빈 표준 플래그는 Non-standard 다');

const both = searchConcepts({ keyword: '', domainIds: ['Drug'], standardFlags: ['S'], page: 1, size: 100 });
assert(both.items.length > 0 && both.items.every((item) => item.domainId === 'Drug' && item.standardConcept === 'S'), '도메인과 표준 여부는 AND 다');
assert(both.facets.domain.some((row) => row.id === 'Condition' && row.cnt > 0), '다른 도메인 건수는 자기 선택에 가리지 않는다');

const detail = getConceptDetail({ conceptId: 1112807 });
assert(detail.conceptCode === '1191', '상세 코드를 읽는다');
assert(detail.validStartDate === '1970-01-01', '날짜를 그대로 둔다');
assert(detail.synonyms.map((row) => row.conceptSynonymName).join('|') === 'acetylsalicylic acid|ASA', '동의어를 이름 순으로 둔다');
assert(detail.synonyms.every((row) => row.languageName === 'English'), '동의어 언어 이름을 붙인다');
assert(detail.vocabulary.vocabularyName === 'RxNorm', '용어집 이름을 붙인다');
assert(detail.connections.some((row) => row.relationshipId === 'Maps to' && row.relationshipName === 'Non-standard to Standard map (OMOP)' && row.targetConceptId === 440001), 'Maps to 는 관계 이름으로 나온다');
assert(detail.connections.some((row) => row.relationshipId === 'RxNorm ing of' && row.relationshipName === 'Ingredient of (RxNorm)'), '성분 관계가 있다');
assert(!detail.connections.some((row) => row.targetConceptId === 19019074), '무효 관계는 빠진다');
assert(getConceptDetail({ conceptId: 990001 }).isLocal === true, '임시컨셉 상세를 읽는다');

let missing = null;
try {
  getConceptDetail({ conceptId: 999999999 });
} catch (error) {
  missing = error;
}
assert(missing instanceof LocalHttpError && missing.response.status === 404, '없는 상세는 404 다');

const norm = normalizeKeyword(' Type-2 + diabetes ');
assert(norm.exact === false && norm.tokens.join(',') === 'type-2,diabetes', '하이픈은 남고 단독 기호는 버린다');
assert(idsOf('type-2 + diabetes').includes(500100), '모든 토큰이 있는 행을 찾는다');
assert(idsOf('chest.pain').includes(2006), '구분자는 공백이 된다');
assert(idsOf('  ASPIRIN  ').includes(1112807), '대소문자와 앞뒤 공백을 가리지 않는다');

const inactive = searchConcepts({ keyword: 'aspirin' }, { ...VOCAB, versions: [{ versionLabel: 'v0', status: 'RETIRED' }] });
assert(inactive.total === 0 && inactive.items.length === 0, '현재본이 없으면 빈 목록이다');
const picked = searchConcepts({ keyword: 'aspirin', versionLabel: 'v20250827' });
assert(picked.total === aspirin.total && picked.versionLabel === 'v20250827', '고른 아테나 버전으로 찾는다');
const unknown = searchConcepts({ keyword: 'aspirin', versionLabel: 'missing' });
assert(unknown.total === 0 && unknown.versions.some((row) => row.versionLabel === 'v20250827'), '없는 버전은 빈 목록이다');

const file = searchConcepts({ keyword: 'aspirin', download: true });
assert(file.exportRefused === false && file.items.length === aspirin.total, '내려받기는 같은 조건의 전체 행이다');
assert(VOCAB.concepts.length === before, '검색이 현재본 건수를 바꾸지 않는다');
assert(VOCAB.concepts.find((row) => row.conceptId === 1112807).conceptName === 'aspirin', '검색이 현재본 이름을 바꾸지 않는다');

console.log('term search checks passed', empty.total);
