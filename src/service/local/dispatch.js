/**
 * TransManager 가 백엔드로 보내던 요청을 프론트 저장소로 처리한다.
 * 화면의 URL·콜백 계약({ result: 'success', data })은 바꾸지 않는다.
 */

import { login } from './auth';
import {
  findOne,
  readFiltered,
  readList,
  readSingle,
  removeRows,
  toPage,
  upsert,
  writeSingle,
} from './collection';
import { LocalHttpError } from './httpError';
import { getConceptDetail, searchConcepts } from './termSearch/search.js';
import { applyWork, readDomain } from './vocabWork';
import { listOf, readUser, saveDb, writeUser } from './store';

/** 식별자가 비어 있으면 컬렉션의 다음 번호를 붙인다. */
function withSerial(key, field, body) {
  const rows = Array.isArray(body) ? body : [body || {}];
  let next = listOf(key).reduce((max, item) => Math.max(max, Number(item[field]) || 0), 0);
  return rows.map((row) => {
    if (row && row[field] != null && row[field] !== '') return row;
    next += 1;
    return { ...(row || {}), [field]: next };
  });
}

const PAGE_PATHS = new Set([
  '/api/log/access/r01',
  '/api/log/user-change/r01',
  '/api/log/error/r01',
  '/api/log/user-login/r01',
]);

function splitUrl(url) {
  const raw = String(url || '');
  let path = raw;
  let queryText = '';
  const mark = raw.indexOf('?');
  if (mark >= 0) {
    path = raw.slice(0, mark);
    queryText = raw.slice(mark + 1);
  }
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(raw);
      path = parsed.pathname;
      queryText = parsed.search ? parsed.search.slice(1) : queryText;
    } catch (error) {
      path = raw;
    }
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  const query = {};
  if (queryText) {
    const params = new URLSearchParams(queryText);
    params.forEach((value, key) => {
      query[key] = value;
    });
  }
  return { path, query };
}

function parseBody(data) {
  if (data == null || data === 'null') return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  if (typeof data.entries === 'function') {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'object') return data;
  return null;
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function saved(message) {
  return { result: true, message: message || '저장되었습니다.' };
}

function operationOf(path) {
  const matched = path.match(/\/([rudve])(\d{2})(?:\/([^/]+))?$/i);
  if (!matched) return null;
  return { kind: matched[1].toLowerCase(), seq: matched[2], extra: matched[3] || '' };
}

function resourceOf(path) {
  return path
    .replace(/\/search(?=\/)/, '')
    .replace(/\/[rudve]\d{2}(?:\/[^/]+)?$/i, '');
}

function criteriaOf(body, query) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  return { ...query, ...source };
}

function filterSaleDays(body) {
  const rows = readList('/api/cmm/sale-day');
  const from = digits(body && body.fromSaleDay);
  const to = digits(body && body.toSaleDay);
  const holiday = body && body.hldySeCd;
  return rows.filter((row) => {
    const day = digits(row.saleDay);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (holiday && row.hldySeCd !== holiday) return false;
    return true;
  });
}

function generateSaleDays(body) {
  const from = digits(body && body.fromSaleDay);
  const to = digits(body && body.toSaleDay);
  if (from.length !== 8 || to.length !== 8 || from > to) {
    return { result: false, message: '생성 기간이 올바르지 않습니다.' };
  }
  const existing = listOf('/api/cmm/sale-day');
  const force = body && body.forceCreateYn === 'Y';
  const hasOverlap = existing.some((row) => {
    const day = digits(row.saleDay);
    return day >= from && day <= to;
  });
  if (hasOverlap && !force) {
    return { result: false, message: '이미 존재하는 영업일이 있습니다.' };
  }
  if (force) {
    for (let index = existing.length - 1; index >= 0; index -= 1) {
      const day = digits(existing[index].saleDay);
      if (day >= from && day <= to) existing.splice(index, 1);
    }
  }
  const cursor = new Date(Number(from.slice(0, 4)), Number(from.slice(4, 6)) - 1, Number(from.slice(6, 8)));
  const end = new Date(Number(to.slice(0, 4)), Number(to.slice(4, 6)) - 1, Number(to.slice(6, 8)));
  while (cursor <= end) {
    const z = (n) => String(n).padStart(2, '0');
    const saleDay = `${cursor.getFullYear()}${z(cursor.getMonth() + 1)}${z(cursor.getDate())}`;
    const week = cursor.getDay();
    existing.push({
      saleDay,
      ognzCd: (body && body.ognzCd) || 'DEFAULT',
      wdaySeCd: String(week),
      hldySeCd: week === 0 || week === 6 ? 'H' : 'W',
      rmrk: '',
      rowtype: 'R',
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  saveDb();
  return { result: true, message: '영업일이 생성되었습니다.' };
}

function handleCodes(path, body) {
  if (path.endsWith('/r01')) return readFiltered('/api/cmm/cd/groups', body);
  if (path.endsWith('/r02')) {
    return findOne('/api/cmm/cd/groups', body) || { cdGroup: body && body.cdGroup, cdGroupNm: '', useYn: 'Y', cdPlcusCd: 'SYS', rmrkCn: '' };
  }
  if (path.endsWith('/r03')) return readFiltered('/api/cmm/cd/items', body);
  if (path.endsWith('/r04')) {
    return findOne('/api/cmm/cd/items', body) || { cdGroup: body && body.cdGroup, cd: body && body.cd, cdNm: '', useYn: 'Y', sortSn: 1 };
  }
  if (path.endsWith('/r05')) return readFiltered('/api/cmm/cd/refs', body);
  if (path.endsWith('/u01')) return upsert('/api/cmm/cd/groups', body);
  if (path.endsWith('/u02')) return upsert('/api/cmm/cd/items', body);
  if (path.endsWith('/u03')) return upsert('/api/cmm/cd/refs', Array.isArray(body) ? body : [body]);
  return [];
}

function handleExact(path, body, query) {
  // 표준용어 검색. 읽기 전용이며 현재본 컬렉션에 결과를 쓰지 않는다.
  if (path === '/api/term/search/concepts/r01') return searchConcepts(body);
  if (path === '/api/term/search/concepts/r02') return getConceptDetail(body);
  if (path === '/api/voc/work/r01') return readDomain(body && body.domain);
  if (path === '/api/voc/work/u01') return applyWork(body);

  if (path === '/api/cmm/login-user/menus') return readList('/api/cmm/menu');
  if (path === '/api/cmm/login-user/r01') return readUser();
  if (path === '/api/cmm/login-user/u01') {
    writeUser({ ...readUser(), ...(body || {}) });
    return saved('저장되었습니다.');
  }
  if (path === '/api/common/polling/user-summary') {
    return { noticesCount: 1, reservationMemosCount: 0 };
  }
  if (path === '/api/common/polling/notification') {
    return {
      notices: [
        { id: 'N1', type: 'normal', message: '프로토타입은 이 브라우저 안에서만 동작합니다.' },
      ],
    };
  }
  if (path === '/api/common/user-auth/logout' || path === '/logout') return 'ok';
  if (path === '/api/auth/refresh') return { ok: true };
  if (path === '/api/common/user-auth/duplicate-login') return 'ok';

  if (path === '/api/cmm/pswd-plcy/r01') return readSingle('/api/cmm/pswd-plcy') || {};
  if (path === '/api/cmm/pswd-plcy/u01') return writeSingle('/api/cmm/pswd-plcy', body);

  if (path === '/api/cmm/sale-day/r01') return filterSaleDays(body);
  if (path === '/api/cmm/sale-day/u02') return generateSaleDays(body);
  if (path === '/api/cmm/sale-day/v01') return { result: true, message: '유효성 검증을 통과했습니다.' };

  if (path === '/api/sup/bookmark/r01') return readList('/api/sup/bookmark/folders');
  if (path === '/api/sup/bookmark/r02') return readList('/api/sup/bookmark/items');
  // u01 은 즐겨찾기 항목, u02 는 폴더. 화면이 이 번호로 나눈다.
  if (path === '/api/sup/bookmark/u01') {
    if (body && body.action === 'DELETE') return removeRows('/api/sup/bookmark/items', body);
    return upsert('/api/sup/bookmark/items', body);
  }
  if (path === '/api/sup/bookmark/u02') return upsert('/api/sup/bookmark/folders', withSerial('/api/sup/bookmark/folders', 'bokmkCtgySn', body));
  if (path === '/api/sup/bookmark/d01') return removeRows('/api/sup/bookmark/folders', body);

  if (path === '/api/sup/memo/r03') return readList('/api/sup/memo/folders');
  if (path === '/api/sup/memo/r02') return readList('/api/sup/memo/items');
  if (path === '/api/sup/memo/u01') {
    if (body && body.action === 'DELETE') return removeRows('/api/sup/memo/items', body);
    return upsert('/api/sup/memo/items', withSerial('/api/sup/memo/items', 'memoSid', body));
  }
  if (path === '/api/sup/memo/u02') return upsert('/api/sup/memo/folders', withSerial('/api/sup/memo/folders', 'memoCtgySid', body));
  if (path === '/api/sup/memo/d02') return removeRows('/api/sup/memo/items', body);

  if (path === '/api/cmm/authrt-grade/r01' || path === '/api/cmm/authrt-cd/r01' || path === '/api/cmm/prgrm-authrt/r01') {
    return readFiltered('/api/cmm/authrt-cd', body);
  }
  if (path === '/api/cmm/authrt-cd/r02') return findOne('/api/cmm/authrt-cd', body) || {};
  if (path === '/api/cmm/authrt-grade/r02' || path === '/api/cmm/user-authrt/r02' || path === '/api/cmm/user-authrt/r03') {
    return readFiltered('/api/cmm/menu', criteriaOf(body, query));
  }
  if (path === '/api/cmm/user-authrt/r01') return readFiltered('/api/cmm/user', body);
  if (path === '/api/cmm/user-authrt/r04' || path === '/api/cmm/user-authrt/r06' || path === '/api/cmm/prgrm-authrt/r02') {
    return readFiltered('/api/cmm/prgrm', body);
  }
  if (path.startsWith('/api/cmm/authrt-grade/u')) return upsert('/api/cmm/authrt-cd', body);
  if (path.startsWith('/api/cmm/authrt-grade/d')) return removeRows('/api/cmm/authrt-cd', body);
  if (path.startsWith('/api/cmm/user-authrt/u') || path.startsWith('/api/cmm/user-authrt/d')) return saved();
  if (path.startsWith('/api/cmm/prgrm-authrt/u') || path.startsWith('/api/cmm/prgrm-authrt/d')) return saved();

  if (path === '/api/cmm/ognz/r02') return findOne('/api/cmm/ognz', body) || {};
  if (path === '/api/cmm/user/r02' || path === '/api/cmm/user/search/r02') {
    const one = findOne('/api/cmm/user', body);
    if (path.endsWith('/search/r02')) return readFiltered('/api/cmm/user', body);
    return one || {};
  }

  if (path.startsWith('/api/cmm/cd/')) return handleCodes(path, body);
  if (PAGE_PATHS.has(path)) {
    const key = resourceOf(path);
    return toPage(readFiltered(key, criteriaOf(body, query)), query);
  }
  if (path.startsWith('/api/log/error/r02')) {
    const logSid = path.split('/').pop();
    return findOne('/api/log/error', { logSid, ...(body || {}) }) || {};
  }
  return undefined;
}

function handleGeneric(path, body, query) {
  const op = operationOf(path);
  const key = resourceOf(path);
  if (!op) return [];
  if (op.kind === 'r') {
    if (op.seq === '02') return findOne(key, criteriaOf(body, query)) || {};
    return readFiltered(key, criteriaOf(body, query));
  }
  if (op.kind === 'u' || op.kind === 'e') return upsert(key, body);
  if (op.kind === 'd') return removeRows(key, body);
  if (op.kind === 'v') return { result: true, message: '유효성 검증을 통과했습니다.' };
  return [];
}

/**
 * axios 요청 옵션을 받아 응답 본문을 돌려준다.
 * 실패는 LocalHttpError 로 던져 TransManager 오류 분기를 탄다.
 */
export async function dispatchLocal(reqOptions) {
  const method = String((reqOptions && reqOptions.method) || 'post').toLowerCase();
  const { path, query } = splitUrl(reqOptions && reqOptions.url);
  const body = parseBody(reqOptions && reqOptions.data);

  if (path === '/login' && method === 'post') {
    return login(body);
  }

  const exact = handleExact(path, body, query);
  if (exact !== undefined) return exact;
  return handleGeneric(path, body, query);
}

/** axios 응답과 같은 껍데기. TransManager 는 resData.data 를 콜백에 넘긴다. */
export async function runLocalRequest(reqOptions) {
  try {
    const data = await dispatchLocal(reqOptions);
    return { data, status: 200 };
  } catch (error) {
    if (error instanceof LocalHttpError) throw error;
    throw new LocalHttpError(500, { message: '로컬 데이터 처리 중 오류가 발생했습니다.' });
  }
}
