/**
 * 컬렉션 조회·저장·삭제.
 * 화면이 보내는 본문(객체 또는 행 배열)을 같은 규칙으로 처리한다.
 * React 에 의존하지 않으므로 요청 객체만으로 결과를 검증할 수 있다.
 */

import { clone, listOf, readList, readSingleton, saveDb, writeSingleton } from './store';

/** 자원별 식별 필드. 앞에 있을수록 우선한다. 복합키는 있는 필드를 모두 맞춘다. */
const ID_FIELDS = {
  '/api/cmm/ognz': ['ognzCd'],
  '/api/cmm/user': ['userId'],
  '/api/cmm/menu': ['menuId'],
  '/api/cmm/authrt-cd': ['authrtCd'],
  '/api/cmm/prgrm': ['prgrmId'],
  '/api/cmm/user-ip': ['userId', 'lgnIp'],
  '/api/cmm/sys-crtr': ['sysCrtrCd'],
  '/api/cmm/sale-day': ['saleDay'],
  '/api/cmm/cd/groups': ['cdGroup'],
  '/api/cmm/cd/items': ['cdGroup', 'cd'],
  '/api/cmm/cd/refs': ['cdGroup', 'cd', 'rfrncCd'],
  '/api/log/user-login': ['lgnId'],
  '/api/log/error': ['logSid'],
  '/api/log/user-change': ['chgId'],
  '/api/log/access': ['accessId'],
  '/api/sup/bookmark/folders': ['bokmkCtgySn'],
  '/api/sup/bookmark/items': ['bokmkMenuId'],
  '/api/sup/memo/folders': ['memoCtgySid'],
  '/api/sup/memo/items': ['memoSid'],
};

export function idFieldsOf(key) {
  return ID_FIELDS[key] || ['id'];
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value) !== '';
}

function sameId(row, sample, fields) {
  const used = fields.filter((field) => hasValue(sample[field]));
  if (used.length === 0) return false;
  return used.every((field) => String(row[field]) === String(sample[field]));
}

/** 검색 본문의 스칼라 값이 행에 포함되면 남긴다. 행에 없는 필드는 조건에서 뺀다. */
export function filterRows(rows, criteria) {
  if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
    return clone(rows);
  }
  const entries = Object.entries(criteria).filter(([key, value]) => {
    if (key === 'paging' || key === 'rowtype') return false;
    if (value === undefined || value === null || value === '') return false;
    return typeof value !== 'object';
  });
  if (entries.length === 0) return clone(rows);
  return rows.filter((row) => entries.every(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(row, key) || row[key] == null) return true;
    return String(row[key]).toLowerCase().includes(String(value).toLowerCase());
  })).map((row) => clone(row));
}

export function readFiltered(key, criteria) {
  return filterRows(listOf(key), criteria);
}

export function findOne(key, criteria) {
  const rows = readFiltered(key, criteria);
  if (rows.length > 0) return rows[0];
  const fields = idFieldsOf(key);
  const sample = criteria && typeof criteria === 'object' ? criteria : {};
  const hit = listOf(key).find((row) => sameId(row, sample, fields));
  return hit ? clone(hit) : null;
}

/**
 * 행 배열 또는 객체 하나를 저장한다.
 * rowtype 이 d 이거나 deleteFlag 가 Y 이면 삭제한다.
 */
export function upsert(key, payload) {
  const rows = listOf(key);
  const fields = idFieldsOf(key);
  const incoming = Array.isArray(payload) ? payload : [payload];
  incoming.forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const sample = { ...item };
    delete sample.rowtype;
    delete sample.deleteFlag;
    if (item.rowtype === 'd' || item.deleteFlag === 'Y') {
      const index = rows.findIndex((row) => sameId(row, item, fields));
      if (index >= 0) rows.splice(index, 1);
      return;
    }
    const index = rows.findIndex((row) => sameId(row, item, fields));
    if (index >= 0) {
      rows[index] = { ...rows[index], ...sample, rowtype: 'R' };
    } else {
      rows.push({ ...sample, rowtype: 'R' });
    }
  });
  saveDb();
  return { result: true, message: '저장되었습니다.' };
}

export function removeRows(key, payload) {
  const rows = listOf(key);
  const fields = idFieldsOf(key);
  const incoming = Array.isArray(payload) ? payload : [payload];
  incoming.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const index = rows.findIndex((row) => sameId(row, item, fields));
    if (index >= 0) rows.splice(index, 1);
  });
  saveDb();
  return { result: true, message: '삭제되었습니다.' };
}

export function readSingle(key) {
  return readSingleton(key);
}

export function writeSingle(key, payload) {
  const prev = readSingleton(key) || {};
  const next = { ...prev, ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}) };
  writeSingleton(key, next);
  return { result: true, message: '저장되었습니다.' };
}

/** Spring Page 형태. 로그 화면은 res.data.content 를 읽는다. */
export function toPage(rows, query) {
  const page = Number(query && query.page != null ? query.page : 0);
  const size = Number(query && query.size != null ? query.size : (rows.length || 20));
  const safeSize = size > 0 ? size : 20;
  const start = page * safeSize;
  const content = rows.slice(start, start + safeSize);
  return {
    content,
    totalElements: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / safeSize)),
    number: page,
    size: safeSize,
    first: page === 0,
    last: start + safeSize >= rows.length,
  };
}

export function appendRow(key, row) {
  listOf(key).push(clone(row));
  saveDb();
}

export { readList };
