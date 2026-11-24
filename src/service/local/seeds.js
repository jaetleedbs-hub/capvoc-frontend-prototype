/**
 * 프로토타입 초기 데이터.
 * 화면 그리드가 읽는 필드명을 그대로 둔다.
 * 메뉴 urlAddr 는 DynamicRouteManager 가 containers 경로로 바꾼다.
 */

import { buildVocMenus } from './vocCatalog';

function ymd(date) {
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${z(date.getMonth() + 1)}${z(date.getDate())}`;
}

function stamp() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}

function menu(menuId, menuNm, upMenuId, sortSn, urlAddr, npagYn, menuUseYn) {
  return {
    menuId,
    menuNm,
    upMenuId: upMenuId || '',
    sortSn,
    urlAddr: urlAddr || '',
    npagYn: npagYn || 'N',
    menuUseYn: menuUseYn || 'Y',
    scrnSize: npagYn === 'Y' ? '900,640' : '',
    mdfrId: 'admin',
    mdfcnDt: stamp(),
  };
}

/**
 * 로그인 메뉴.
 * 앞부분은 업무 메뉴이고, SYS 는 시스템 관리로 그대로 둔다.
 * BAT(배치 작업)은 업무 구분값만 있고 화면이 없어 메뉴에 넣지 않는다.
 * SYS 의 sortSn 만 100 으로 두어 업무 메뉴 뒤에 오게 한다.
 */
export function buildMenus() {
  const when = stamp();
  return [
    ...buildVocMenus(when),
    menu('SYS', '시스템 관리', '', 100, '', 'N', 'Y'),
    menu('SYS0', '조직/사용자', 'SYS', 10, '', 'N', 'Y'),
    menu('SYS0010', '조직관리', 'SYS0', 10, '/sys/SYS0010', 'N', 'Y'),
    menu('SYS0020', '조직찾기', 'SYS0', 20, '/sys/SYS0020', 'Y', 'Y'),
    menu('SYS0030', '사용자관리', 'SYS0', 30, '/sys/SYS0030', 'N', 'Y'),
    menu('SYS0040', '사용자찾기', 'SYS0', 40, '/sys/SYS0040', 'Y', 'Y'),
    menu('SYS0080', '접속 IP', 'SYS0', 50, '/sys/SYS0080', 'N', 'Y'),
    menu('SYS1', '메뉴', 'SYS', 20, '', 'N', 'Y'),
    menu('SYS1010', '메뉴관리', 'SYS1', 10, '/sys/SYS1010', 'N', 'Y'),
    menu('SYS1020', '메뉴찾기', 'SYS1', 20, '/sys/SYS1020', 'Y', 'Y'),
    menu('SYS3', '권한', 'SYS', 30, '', 'N', 'Y'),
    menu('SYS3010', '권한코드', 'SYS3', 10, '/sys/SYS3010', 'N', 'Y'),
    menu('SYS3020', '권한등급', 'SYS3', 20, '/sys/SYS3020', 'N', 'Y'),
    menu('SYS3030', '사용자권한', 'SYS3', 30, '/sys/SYS3030', 'N', 'Y'),
    menu('SYS3040', '프로그램', 'SYS3', 40, '/sys/SYS3040', 'N', 'Y'),
    menu('SYS3050', '프로그램권한', 'SYS3', 50, '/sys/SYS3050', 'N', 'Y'),
    menu('SYS5', '기준정보', 'SYS', 40, '', 'N', 'Y'),
    menu('SYS5010', '시스템기준', 'SYS5', 10, '/sys/SYS5010', 'N', 'Y'),
    menu('SYS5020', '비밀번호정책', 'SYS5', 20, '/sys/SYS5020', 'N', 'Y'),
    menu('SYS5030', '영업일', 'SYS5', 30, '/sys/SYS5030', 'N', 'Y'),
    menu('SYS5040', '공통코드', 'SYS5', 40, '/sys/SYS5040', 'N', 'Y'),
    menu('SYS6', '로그', 'SYS', 50, '', 'N', 'Y'),
    menu('SYS6010', '로그인 이력', 'SYS6', 10, '/sys/SYS6010', 'N', 'Y'),
    menu('SYS6020', '오류 로그', 'SYS6', 20, '/sys/SYS6020', 'N', 'Y'),
    menu('SYS6030', '사용자 변경', 'SYS6', 30, '/sys/SYS6030', 'N', 'Y'),
    menu('SYS6040', '접속 로그', 'SYS6', 40, '/sys/SYS6040', 'N', 'Y'),
    // 메뉴 트리에는 숨기고, 팝업 라우트만 연다.
    menu('COM1100', '로그인 정보', 'SYS', 90, '/com/COM1100', 'Y', 'H'),
    menu('COM2070', '즐겨찾기 등록', 'SYS', 91, '/com/COM2070', 'Y', 'H'),
    menu('COM2080', '메모 등록', 'SYS', 92, '/com/COM2080', 'Y', 'H'),
  ];
}

function codeGroup(cdGroup, cdGroupNm, rmrkCn) {
  return {
    cdGroup,
    cdGroupNm,
    cdPlcusCd: 'SYS',
    useYn: 'Y',
    useYnNm: '사용',
    rmrkCn: rmrkCn || '',
  };
}

function codeItem(cdGroup, cd, cdNm, sortSn) {
  return {
    cdGroup,
    cd,
    cdNm,
    value: cd,
    name: cdNm,
    useYn: 'Y',
    sortSn,
  };
}

function saleDays() {
  const today = new Date();
  const rows = [];
  for (let offset = -2; offset <= 2; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const day = date.getDay();
    rows.push({
      saleDay: ymd(date),
      ognzCd: 'DEFAULT',
      wdaySeCd: String(day),
      hldySeCd: day === 0 || day === 6 ? 'H' : 'W',
      rmrk: day === 0 || day === 6 ? '주말' : '',
      rowtype: 'R',
    });
  }
  return rows;
}

export function createInitialDb() {
  const now = stamp();
  return {
    version: 4,
    user: {
      userId: 'admin',
      userNm: '프로토타입 관리자',
      ognzCd: 'ORG001',
      ognzNm: '본사',
      authrtCd: 'ADMIN',
      authrtNm: '시스템관리자',
      ctiUseYn: 'N',
      ctiAutoLgnYn: 'N',
      lgnYn: 'Y',
      lgnIp: '127.0.0.1',
      lgnTryCnt: 0,
      bscScrnMenuId: 'DSH0010',
      userPhoto: '',
      wrkStatNm: '근무',
      jncmpYmd: '20240101',
      rsgntnYmd: '',
      homeTelNo: '',
      mblTelNo: '',
      extNo: '1000',
      emlAddr: 'admin@prototype.local',
    },
    singletons: {
      '/api/cmm/pswd-plcy': {
        pswdChgCycCnt: 90,
        lgnTryPsbltyCnt: 5,
        pswdReuseYn: 'N',
        pswdMinLen: 8,
        pswdUcReqYn: 'Y',
        pswdLcReqYn: 'Y',
        pswdNumReqYn: 'Y',
        pswdSpcCharReqYn: 'Y',
        pswdDenyChar: '',
      },
    },
    collections: {
      '/api/cmm/ognz': [
        { ognzCd: 'ORG001', ognzNm: '본사', upOgnzCd: null, ognzLvl: 1, sortSn: 1, useYn: 'Y', hrOrgNo: 'H001', repTelNo: '02-000-0000' },
        { ognzCd: 'ORG002', ognzNm: '개발팀', upOgnzCd: 'ORG001', ognzLvl: 2, sortSn: 1, useYn: 'Y', hrOrgNo: 'H002', repTelNo: '02-000-1000' },
        { ognzCd: 'ORG003', ognzNm: '프론트엔드팀', upOgnzCd: 'ORG002', ognzLvl: 3, sortSn: 1, useYn: 'Y', hrOrgNo: 'H003', repTelNo: '' },
        { ognzCd: 'ORG004', ognzNm: '영업팀', upOgnzCd: 'ORG001', ognzLvl: 2, sortSn: 2, useYn: 'Y', hrOrgNo: 'H004', repTelNo: '02-000-2000' },
      ],
      '/api/cmm/user': [
        {
          userId: 'admin', userNm: '프로토타입 관리자', ognzCd: 'ORG001', ognzNm: '본사',
          authrtCd: 'ADMIN', authrtNm: '시스템관리자', lgnYn: 'N', lgnIp: '',
          wrkStatNm: '근무', jncmpYmd: '20240101', rsgntnYmd: '',
          ctiUseYn: 'N', ctiAutoLgnYn: 'N', useYn: 'Y',
          homeTelNo: '', mblTelNo: '010-0000-0000', extNo: '1000', emlAddr: 'admin@prototype.local',
        },
        {
          userId: 'user01', userNm: '김상담', ognzCd: 'ORG004', ognzNm: '영업팀',
          authrtCd: 'USER', authrtNm: '일반사용자', lgnYn: 'N', lgnIp: '',
          wrkStatNm: '근무', jncmpYmd: '20240601', rsgntnYmd: '',
          ctiUseYn: 'Y', ctiAutoLgnYn: 'N', useYn: 'Y',
          homeTelNo: '', mblTelNo: '010-1111-2222', extNo: '2001', emlAddr: 'user01@prototype.local',
        },
      ],
      '/api/cmm/menu': buildMenus(),
      '/api/cmm/authrt-cd': [
        { authrtCd: 'ADMIN', authrtNm: '시스템관리자', ognzInqRangCdNm: '전체', authrtSe: 'SYS', bscScrnMenuId: 'SYS0010', mdfcnDt: now, useYn: 'Y', authrtUserCnt: 1 },
        { authrtCd: 'USER', authrtNm: '일반사용자', ognzInqRangCdNm: '소속', authrtSe: 'USR', bscScrnMenuId: 'SYS0030', mdfcnDt: now, useYn: 'Y', authrtUserCnt: 1 },
      ],
      '/api/cmm/prgrm': [
        { prgrmId: 'PGM001', prgrmNm: '조직 조회', httpMethod: 'POST', urlAddrPtrn: '/api/cmm/ognz/r01', sortSn: 1, rgtrId: 'admin', regDt: now, mdfrId: 'admin', mdfcnDt: now },
        { prgrmId: 'PGM002', prgrmNm: '사용자 조회', httpMethod: 'POST', urlAddrPtrn: '/api/cmm/user/r01', sortSn: 2, rgtrId: 'admin', regDt: now, mdfrId: 'admin', mdfcnDt: now },
        { prgrmId: 'PGM003', prgrmNm: '메뉴 저장', httpMethod: 'POST', urlAddrPtrn: '/api/cmm/menu/u01', sortSn: 3, rgtrId: 'admin', regDt: now, mdfrId: 'admin', mdfcnDt: now },
      ],
      '/api/cmm/user-ip': [
        { userId: 'admin', lgnIp: '127.0.0.1', extNo: '1000' },
        { userId: 'user01', lgnIp: '10.0.0.21', extNo: '2001' },
      ],
      '/api/cmm/sys-crtr': [
        { sysCrtrTypeCd: 'SYS', sysCrtrCd: 'SESSION_MIN', sysCrtrCdNm: '세션 유지(분)', sysCrtrCdVl: '60', useYn: 'Y', rmrkCn: '프로토타입 기본값' },
        { sysCrtrTypeCd: 'SYS', sysCrtrCd: 'PAGE_SIZE', sysCrtrCdNm: '목록 크기', sysCrtrCdVl: '20', useYn: 'Y', rmrkCn: '' },
      ],
      '/api/cmm/sale-day': saleDays(),
      '/api/cmm/cd/groups': [
        codeGroup('USE_YN', '사용여부', 'Y/N'),
        codeGroup('SYS_CRTR_TYPE_CD', '기준유형', '시스템 기준 구분'),
        codeGroup('HLDY_SE_CD', '휴일구분', '영업일 휴일 구분'),
      ],
      '/api/cmm/cd/items': [
        codeItem('USE_YN', 'Y', '사용', 1),
        codeItem('USE_YN', 'N', '미사용', 2),
        codeItem('SYS_CRTR_TYPE_CD', 'SYS', '시스템', 1),
        codeItem('SYS_CRTR_TYPE_CD', 'BIZ', '업무', 2),
        codeItem('HLDY_SE_CD', 'W', '영업일', 1),
        codeItem('HLDY_SE_CD', 'H', '휴일', 2),
      ],
      '/api/cmm/cd/refs': [
        { cdGroup: 'USE_YN', cd: 'Y', rfrncCd: 'LABEL', rfrncNm: '표시명', rfrncVl: '사용' },
      ],
      '/api/log/user-login': [
        { lgnId: 'LGN001', lgnYmd: ymd(new Date()), ognzNm: '본사', userId: 'admin', userNm: '프로토타입 관리자', lgnDt: ymd(new Date()), lgtDt: '', lgnCnt: 1 },
      ],
      '/api/log/error': [
        { logSid: 'ERR001', logDt: ymd(new Date()), svcCd: 'SYS', sevCd: 'WARN', failKindCd: 'BIZ', cmpyId: 'PROTO', svrId: 'local', subject: '샘플 오류', errCd: 'E_SAMPLE', message: '프로토타입 샘플 오류입니다.' },
      ],
      '/api/log/user-change': [
        { chgId: 'CHG001', chgDt: ymd(new Date()), chgTypeNm: '수정', chgBfrInfoNm: '일반사용자', chgAftrInfoNm: '시스템관리자', prcrNm: 'admin', userId: 'user01' },
      ],
      '/api/log/access': [
        { accessId: 'ACC001', logDt: ymd(new Date()), userNm: '프로토타입 관리자', ipAddr: '127.0.0.1', httpMethod: 'POST', urlAddr: '/api/cmm/ognz/r01' },
      ],
      '/api/sup/bookmark/folders': [
        { bokmkCtgySn: 1, bokmkCtgyNm: '기본' },
      ],
      '/api/sup/bookmark/items': [
        { bokmkCtgySn: 1, bokmkMenuId: 'SYS0010', menuNm: '조직관리' },
      ],
      '/api/sup/memo/folders': [
        { memoCtgySid: 1, memoCtgyNm: '기본' },
      ],
      '/api/sup/memo/items': [
        { memoSid: 1, memoCtgySid: 1, memoTtl: '프로토타입', memoCn: '로컬 데이터로 동작합니다.', memoAlarmYn: 'N' },
      ],
    },
  };
}
