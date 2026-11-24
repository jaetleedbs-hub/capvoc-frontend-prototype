/**
 * 로컬 로그인.
 * 비밀번호는 PBKDF2 해시로만 보관한다. 화면에는 프로토타입 계정을 안내한다.
 * 계정: admin / Proto#2026
 */

import { verifyPassword } from 'utils/passwordHasher';
import { LocalHttpError } from './httpError';
import { appendRow, readList } from './collection';
import { readUser, writeUser } from './store';

const PASSWORD_HASH = 'e7333ef7995d922a69d42ced1f0a503a4a7315015d97a782d78f74adcf76521a';
const PASSWORD_SALT = 'Y2Fwdm9jLXByb3RvLXYx';
const PASSWORD_ITERATIONS = 100000;
const DEMO_USER_ID = 'admin';

function ymd(date) {
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${z(date.getMonth() + 1)}${z(date.getDate())}`;
}

function readField(body, key) {
  if (!body || typeof body !== 'object') return '';
  const value = body[key];
  return value == null ? '' : String(value);
}

export async function login(body) {
  const username = readField(body, 'username').trim();
  const password = readField(body, 'password');

  const passwordOk = username === DEMO_USER_ID
    && await verifyPassword(password, PASSWORD_HASH, PASSWORD_SALT, PASSWORD_ITERATIONS);

  if (!passwordOk) {
    throw new LocalHttpError(400, { message: '아이디 또는 비밀번호가 올바르지 않습니다.', error: 'BAD_CREDENTIALS' });
  }

  const user = readUser();
  const menus = readList('/api/cmm/menu');
  const codes = readList('/api/cmm/cd/items');
  const bookmarks = readList('/api/sup/bookmark/items');

  writeUser({ ...user, lgnYn: 'Y', lgnIp: '127.0.0.1' });

  appendRow('/api/log/user-login', {
    lgnId: `LGN${Date.now()}`,
    lgnYmd: ymd(new Date()),
    ognzNm: user.ognzNm || '',
    userId: user.userId,
    userNm: user.userNm,
    lgnDt: ymd(new Date()),
    lgtDt: '',
    lgnCnt: 1,
  });

  return {
    user: readUser(),
    codeList: codes,
    menuList: menus,
    bookmarkList: bookmarks,
    frontendSysBaseInfo: {
      CTI_SERVER_IP_A: '',
      CTI_SERVER_IP_B: '',
      CTI_PORT_A: '',
      CTI_PORT_B: '',
      CTI_SSL: 'N',
      CTI_ENABLED: 'N',
      CTI_PREFIX: '',
      CTI_SSE_SERVER: '',
      ENV_CORP: 'PROTO',
    },
  };
}
