/**
 * 표준용어 목록(R01)과 상세(R02).
 * 화면은 키워드를 고치지 않고, 여기서 Athena와 같은 순서로 자른다.
 * 결과는 현재본에 다시 쓰지 않는다.
 */

import { LocalHttpError } from '../httpError.js';
import { normalizeKeyword } from './normalize.js';
import { FUZZY_THRESHOLD, similarity } from './similarity.js';
import { VOCAB } from './seed.js';

const PAGE_SIZES = [15, 30, 50, 100, 500];
const EXPORT_LIMIT = 50000;
const FUZZY_OPEN_UNDER = 20;
const FUZZY_LIMIT = 200;
const SORT_FIELDS = new Set([
  'rank',
  'concept_id',
  'concept_code',
  'concept_name',
  'concept_class_id',
  'standard_concept',
  'invalid_reason',
  'domain_id',
  'vocabulary_id',
]);

function versionOptions(vocab) {
  return (vocab.versions || [])
    .filter((row) => row && row.status === 'ACTIVE' && row.versionLabel)
    .map((row) => ({ versionLabel: row.versionLabel, status: row.status }));
}

function resolveVersion(vocab, request) {
  const options = versionOptions(vocab);
  const wanted = request && request.versionLabel != null ? String(request.versionLabel).trim() : '';
  if (!wanted) return options[0] || null;
  return options.find((row) => row.versionLabel === wanted) || null;
}

function chosen(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((value) => (value == null ? '' : String(value)));
}

function pageSize(value) {
  const size = Number(value);
  return PAGE_SIZES.includes(size) ? size : 15;
}

function pageNumber(value) {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function emptyFacets() {
  return { domain: [], standard: [], class: [], vocabulary: [], validity: [] };
}

function emptyList(versionLabel, versions) {
  return {
    versionLabel: versionLabel || '',
    versions: versions || [],
    total: 0,
    items: [],
    facets: emptyFacets(),
  };
}

function standardId(concept) {
  return concept.standardConcept == null ? '' : String(concept.standardConcept);
}

function isInvalid(concept) {
  return concept.invalidReason != null && concept.invalidReason !== '';
}

/**
 * 유효 패싯. 배열로 오면 고른 값만 남긴다.
 * 둘 다 고르거나 아무것도 없으면 제한이 없다. 예전 단일 값도 받는다.
 */
function validityChoice(request) {
  if (Array.isArray(request.validityFlags)) {
    const flags = request.validityFlags.filter((value) => value === 'VALID' || value === 'INVALID');
    if (flags.length === 0 || (flags.includes('VALID') && flags.includes('INVALID'))) return null;
    return flags[0];
  }
  if (request.validity === 'VALID' || request.validity === 'INVALID') return request.validity;
  return null;
}

/** 한 패싯의 선택만 빼고 나머지를 건다. 고르지 않은 값이 목록에서 사라지지 않게 한다. */
function matchesFacets(concept, request, skip) {
  const domainIds = chosen(request.domainIds);
  const vocabularyIds = chosen(request.vocabularyIds);
  const classIds = chosen(request.classIds);
  const standardFlags = chosen(request.standardFlags);
  const validity = validityChoice(request);

  if (skip !== 'domain' && domainIds && !domainIds.includes(concept.domainId)) return false;
  if (skip !== 'vocabulary' && vocabularyIds && !vocabularyIds.includes(concept.vocabularyId)) return false;
  if (skip !== 'class' && classIds && !classIds.includes(concept.conceptClassId)) return false;
  if (skip !== 'standard' && standardFlags && !standardFlags.includes(standardId(concept))) return false;
  if (skip !== 'validity' && validity === 'VALID' && isInvalid(concept)) return false;
  if (skip !== 'validity' && validity === 'INVALID' && !isInvalid(concept)) return false;
  return true;
}

function bump(hits, conceptId, rank) {
  const previous = hits.get(conceptId) || 0;
  if (rank > previous) hits.set(conceptId, rank);
}

function synonymsOf(vocab, conceptId) {
  return (vocab.synonyms || []).filter((row) => row.conceptId === conceptId);
}

/**
 * 순위 갈래. 한 컨셉이 여러 갈래에 걸리면 가장 높은 순위만 남긴다.
 * 완전 일치 모드는 식별자, 코드, 이름, 동의어의 완전 일치만 연다.
 * 유사 철자는 그 앞 후보가 20건 미만일 때만, 상위 200개만 더한다.
 */
function collectHits(vocab, norm) {
  const hits = new Map();
  const phrase = norm.phrase;

  (vocab.concepts || []).forEach((concept) => {
    const name = String(concept.conceptName || '').toLowerCase();
    const code = String(concept.conceptCode || '').toLowerCase();
    if (norm.numericIds.includes(concept.conceptId)) bump(hits, concept.conceptId, 1000);
    if (phrase && code === phrase) bump(hits, concept.conceptId, 900);
    if (phrase && name === phrase) bump(hits, concept.conceptId, 800);
    if (!norm.exact && phrase && name.includes(phrase)) bump(hits, concept.conceptId, 700);
    if (!norm.exact && norm.tokens.length > 0 && norm.tokens.every((token) => name.includes(token))) {
      bump(hits, concept.conceptId, 500);
    }
  });

  (vocab.synonyms || []).forEach((row) => {
    const text = String(row.conceptSynonymName || '').toLowerCase();
    if (phrase && text === phrase) bump(hits, row.conceptId, 650);
    if (!norm.exact && phrase && text.includes(phrase)) bump(hits, row.conceptId, 600);
    if (!norm.exact && norm.tokens.length > 0 && norm.tokens.every((token) => text.includes(token))) {
      bump(hits, row.conceptId, 500);
    }
  });

  if (!norm.exact && phrase && hits.size < FUZZY_OPEN_UNDER) {
    const fuzzy = (vocab.concepts || [])
      .map((concept) => ({ concept, score: similarity(concept.conceptName, phrase) }))
      .filter((row) => row.score >= FUZZY_THRESHOLD)
      .sort((left, right) => right.score - left.score || left.concept.conceptId - right.concept.conceptId)
      .slice(0, FUZZY_LIMIT);
    fuzzy.forEach((row) => bump(hits, row.concept.conceptId, Math.trunc(row.score * 100)));
  }

  return hits;
}

function fieldValue(row, field) {
  const concept = row.concept;
  if (field === 'rank') return row.rank;
  if (field === 'concept_id') return concept.conceptId;
  if (field === 'concept_code') return concept.conceptCode || '';
  if (field === 'concept_name') return concept.conceptName || '';
  if (field === 'concept_class_id') return concept.conceptClassId || '';
  if (field === 'standard_concept') return standardId(concept);
  if (field === 'invalid_reason') return concept.invalidReason || '';
  if (field === 'domain_id') return concept.domainId || '';
  if (field === 'vocabulary_id') return concept.vocabularyId || '';
  return '';
}

function compareValue(left, right) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'en', { sensitivity: 'base', numeric: true });
}

function sortRows(rows, sort, sortDir, keywordEmpty) {
  const field = SORT_FIELDS.has(sort) ? sort : 'rank';
  const byName = keywordEmpty && (field === 'rank' || !sort);
  const direction = sortDir === 'desc' ? -1 : 1;
  return rows.slice().sort((left, right) => {
    if (byName) {
      const byNameOrder = compareValue(fieldValue(left, 'concept_name'), fieldValue(right, 'concept_name'));
      if (byNameOrder !== 0) return byNameOrder;
      return left.concept.conceptId - right.concept.conceptId;
    }
    if (field === 'rank') {
      if (left.rank !== right.rank) return right.rank - left.rank;
      const byNameOrder = compareValue(fieldValue(left, 'concept_name'), fieldValue(right, 'concept_name'));
      if (byNameOrder !== 0) return byNameOrder;
      return left.concept.conceptId - right.concept.conceptId;
    }
    const compared = compareValue(fieldValue(left, field), fieldValue(right, field));
    if (compared !== 0) return compared * direction;
    return left.concept.conceptId - right.concept.conceptId;
  });
}

function toItem(row) {
  const concept = row.concept;
  return {
    conceptId: concept.conceptId,
    conceptCode: concept.conceptCode,
    conceptName: concept.conceptName,
    conceptClassId: concept.conceptClassId,
    standardConcept: concept.standardConcept,
    invalidReason: concept.invalidReason,
    domainId: concept.domainId,
    vocabularyId: concept.vocabularyId,
    isLocal: concept.isLocal === true,
    rank: row.rank,
  };
}

function countBy(rows, idOf) {
  const counts = new Map();
  rows.forEach((row) => {
    const id = idOf(row.concept);
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  return [...counts.entries()].map(([id, cnt]) => ({ id, cnt }));
}

function byCount(left, right) {
  if (right.cnt !== left.cnt) return right.cnt - left.cnt;
  return String(left.id).localeCompare(String(right.id));
}

function buildFacets(rows, request, vocab) {
  const domainNames = new Map((vocab.domains || []).map((row) => [row.domainId, row.domainName]));
  const domain = countBy(rows.filter((row) => matchesFacets(row.concept, request, 'domain')), (concept) => concept.domainId)
    .sort(byCount)
    .map((row) => ({ ...row, name: domainNames.get(row.id) || row.id }));
  const standard = countBy(rows.filter((row) => matchesFacets(row.concept, request, 'standard')), standardId).sort(byCount);
  const conceptClass = countBy(rows.filter((row) => matchesFacets(row.concept, request, 'class')), (concept) => concept.conceptClassId).sort(byCount);
  const vocabulary = countBy(rows.filter((row) => matchesFacets(row.concept, request, 'vocabulary')), (concept) => concept.vocabularyId).sort(byCount);
  const validity = countBy(
    rows.filter((row) => matchesFacets(row.concept, request, 'validity')),
    (concept) => (isInvalid(concept) ? 'INVALID' : 'VALID'),
  ).sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return { domain, standard, class: conceptClass, vocabulary, validity };
}

function rowsOf(vocab, request) {
  const norm = normalizeKeyword(request.keyword);
  if (!norm.phrase) {
    return {
      keywordEmpty: true,
      rows: (vocab.concepts || []).map((concept) => ({ concept, rank: 0 })),
    };
  }
  const hits = collectHits(vocab, norm);
  const byId = new Map((vocab.concepts || []).map((concept) => [concept.conceptId, concept]));
  const rows = [];
  hits.forEach((rank, conceptId) => {
    const concept = byId.get(conceptId);
    if (concept) rows.push({ concept, rank });
  });
  return { keywordEmpty: false, rows };
}

/**
 * R01. 현재본이 없으면 오류가 아니라 빈 목록이다.
 * download 가 참이면 페이지를 자르지 않는다. 5만 건을 넘으면 파일을 만들지 않는다.
 */
export function searchConcepts(request, vocab = VOCAB) {
  const query = request && typeof request === 'object' ? request : {};
  const versions = versionOptions(vocab);
  const version = resolveVersion(vocab, query);
  if (!version) return emptyList('', versions);

  const { keywordEmpty, rows } = rowsOf(vocab, query);
  const filtered = rows.filter((row) => matchesFacets(row.concept, query));
  const sorted = sortRows(filtered, query.sort, query.sortDir, keywordEmpty);
  const total = sorted.length;
  const facets = buildFacets(rows, query, vocab);

  if (query.download === true) {
    if (total > EXPORT_LIMIT) {
      return {
        versionLabel: version.versionLabel,
        versions,
        total,
        items: [],
        facets,
        exportRefused: true,
        message: '5만 건을 넘습니다. 조건을 더 좁혀 주세요.',
      };
    }
    return {
      versionLabel: version.versionLabel,
      versions,
      total,
      items: sorted.map(toItem),
      facets,
      exportRefused: false,
    };
  }

  const size = pageSize(query.size);
  const page = pageNumber(query.page);
  const start = (page - 1) * size;
  return {
    versionLabel: version.versionLabel,
    versions,
    total,
    items: sorted.slice(start, start + size).map(toItem),
    facets,
  };
}

function languageName(vocab, languageConceptId) {
  const listed = (vocab.languages || []).find((row) => row.conceptId === languageConceptId);
  if (listed) return listed.conceptName;
  const concept = (vocab.concepts || []).find((row) => row.conceptId === languageConceptId);
  return concept ? concept.conceptName : '';
}

function relationshipName(vocab, relationshipId) {
  const listed = (vocab.relationshipCatalog || []).find((row) => row.relationshipId === relationshipId);
  return listed ? listed.relationshipName : relationshipId;
}

function vocabularyOf(vocab, vocabularyId) {
  const listed = (vocab.vocabularies || []).find((row) => row.vocabularyId === vocabularyId);
  if (listed) return listed;
  return {
    vocabularyId: vocabularyId || '',
    vocabularyName: vocabularyId || '',
    vocabularyReference: '',
    vocabularyVersion: '',
  };
}

function toDetail(concept, vocab) {
  const synonyms = synonymsOf(vocab, concept.conceptId)
    .slice()
    .sort((left, right) => String(left.conceptSynonymName).localeCompare(String(right.conceptSynonymName), 'en', { sensitivity: 'base' }))
    .map((row) => ({
      conceptSynonymName: row.conceptSynonymName,
      languageConceptId: row.languageConceptId,
      languageName: languageName(vocab, row.languageConceptId),
    }));

  const byId = new Map((vocab.concepts || []).map((row) => [row.conceptId, row]));
  const connections = (vocab.relationships || [])
    .filter((row) => row.conceptId1 === concept.conceptId && (row.invalidReason == null || row.invalidReason === ''))
    .map((row) => {
      const target = byId.get(row.conceptId2);
      if (!target) return null;
      return {
        relationshipId: row.relationshipId,
        relationshipName: relationshipName(vocab, row.relationshipId),
        targetConceptId: target.conceptId,
        targetConceptName: target.conceptName,
        targetConceptCode: target.conceptCode,
        targetVocabularyId: target.vocabularyId,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const byRelation = String(left.relationshipName).localeCompare(String(right.relationshipName));
      if (byRelation !== 0) return byRelation;
      const byName = String(left.targetConceptName).localeCompare(String(right.targetConceptName), 'en', { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return left.targetConceptId - right.targetConceptId;
    });

  return {
    conceptId: concept.conceptId,
    conceptName: concept.conceptName,
    domainId: concept.domainId,
    vocabularyId: concept.vocabularyId,
    vocabulary: vocabularyOf(vocab, concept.vocabularyId),
    conceptClassId: concept.conceptClassId,
    standardConcept: concept.standardConcept,
    conceptCode: concept.conceptCode,
    validStartDate: concept.validStartDate,
    validEndDate: concept.validEndDate,
    invalidReason: concept.invalidReason,
    isLocal: concept.isLocal === true,
    synonyms,
    connections,
  };
}

/** R02. 없는 식별자는 404 다. */
export function getConceptDetail(request, vocab = VOCAB) {
  const conceptId = Number(request && request.conceptId);
  const concept = (vocab.concepts || []).find((row) => row.conceptId === conceptId);
  if (!concept) {
    throw new LocalHttpError(404, { message: '없는 컨셉입니다.' });
  }
  return toDetail(concept, vocab);
}

export { EXPORT_LIMIT, PAGE_SIZES };
