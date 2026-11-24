/**
 * 프로토타입 문서 저장소.
 * 화면이 조회·저장하는 컬렉션을 탭 세션(sessionStorage)에 둔다.
 * 새로고침 후에도 저장분이 남고, 탭을 닫으면 사라진다.
 * 비밀번호 원문은 여기 넣지 않는다. 계정 검증 값은 auth.js 의 해시뿐이다.
 */

import { createInitialDb } from './seeds';

const STORAGE_KEY = 'capvoc.prototype.db.v4';

let memory = null;

function canUseSessionStorage() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage !== null;
  } catch (error) {
    return false;
  }
}

function readStored() {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 4 || !parsed.collections) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

/** 깊은 복사. 화면이 응답 객체를 고쳐도 저장소 원본은 바뀌지 않는다. */
export function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export function getDb() {
  if (memory) return memory;
  memory = readStored() || createInitialDb();
  return memory;
}

export function saveDb() {
  const db = getDb();
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    // 용량 초과여도 메모리 안의 값은 이번 탭에서는 유지한다.
  }
}

export function resetDb() {
  memory = createInitialDb();
  saveDb();
  return memory;
}

export function listOf(key) {
  const db = getDb();
  if (!Array.isArray(db.collections[key])) {
    db.collections[key] = [];
  }
  return db.collections[key];
}

export function readList(key) {
  return clone(listOf(key));
}

export function writeList(key, rows) {
  getDb().collections[key] = clone(rows);
  saveDb();
}

export function readSingleton(key) {
  return clone(getDb().singletons[key]);
}

export function writeSingleton(key, value) {
  getDb().singletons[key] = clone(value);
  saveDb();
}

export function readUser() {
  return clone(getDb().user);
}

export function writeUser(user) {
  const next = clone(user);
  if (next) delete next.password;
  getDb().user = next;
  saveDb();
}
