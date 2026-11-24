/**
 * 병원기관 TF 설계 화면이 읽고 쓰는 프로토타입 데이터.
 * 화면은 TransManager 로만 오고, 저장은 vocabWork 가 이 묶음을 고친다.
 */

export const HIF_FILE_KIND = '기관 코드 리스트';

export const HIF_SITES = ['아주대학교', '분당차병원', '전북대학교병원'];

function org(codeOwnerId, careSiteId, name, fullName, description, commonYn) {
  return { codeOwnerId, careSiteId, name, fullName, description, commonYn };
}

function exception(id, siteName, domain, localCd1, localCd1Nm, localCd1Type) {
  return {
    id,
    siteName,
    domain,
    localCd1,
    localCd1Nm,
    localCd1Type,
    localCd2: '',
    localCd2Nm: '',
    localCd2Type: '',
    localCd3: '',
    localCd3Nm: '',
    localCd3Type: '',
    localCd4: '',
    localCd4Nm: '',
    localCd4Type: '',
    concept1Id: '',
    concept1Nm: '',
    concept1Type: '',
    concept2Id: '',
    concept2Nm: '',
    concept2Type: '',
    concept3Id: '',
    concept3Nm: '',
    concept3Type: '',
    concept4Id: '',
    concept4Nm: '',
    concept4Type: '',
    concept5Id: '',
    concept5Nm: '',
    concept5Type: '',
    commonMapYn: 'N',
    manualMapYn: 'Y',
    deletedYn: 'N',
    deleteReason: '',
  };
}

const CARE_SITE = {
  아주대학교: '8200001',
  분당차병원: '8200002',
  전북대학교병원: '8200007',
};

function localCode(id, siteName, sourceDomain, localCd1, localCd1Nm, localCd1Type, commonCd, commonCdNm) {
  return {
    id,
    siteName,
    createdYmd: '2026-08-03',
    careSiteId: CARE_SITE[siteName] || '',
    sourceDomain,
    sourceDomainId: sourceDomain,
    commonCd,
    commonCdNm,
    commonCdType: 'KCD',
    localCd1,
    localCd1Nm,
    localCd1Type,
    localCd2: '',
    localCd2Nm: '',
    localCd2Type: '',
    localCd3: '',
    localCd3Nm: '',
    localCd3Type: '',
    localCd4: '',
    localCd4Nm: '',
    localCd4Type: '',
    frequency: '',
    additionalInfo1: '',
    additionalInfoType1: '',
    additionalInfo2: '',
    additionalInfoType2: '',
    additionalInfo3: '',
    additionalInfoType3: '',
    extractedDt: '2026-08-03',
  };
}

export function createHifPack() {
  return {
    sites: HIF_SITES.slice(),
    fileKinds: [HIF_FILE_KIND],
    orgs: [
      org('1', '1', 'EDI', 'Electronic Data Interchange code', '국민건강보험 청구코드', 'Y'),
      org('2', '2', 'KCD7', 'Korean Classification of Disease 7', '한국표준질병·사인분류 7차개정', 'Y'),
      org('3', '3', 'KCD7-specified', 'Korean Classification of Disease 7; specified', '한국표준질병·사인분류 7차개정; 세분화', 'Y'),
      org('4', '4', 'ICDO3', 'International Classification of Diseases for Oncology 3', '국제종양분류', 'Y'),
      org('5', '5', 'KCD6', 'Korean Classification of Disease 6', '한국표준질병·사인분류 6차개정', 'Y'),
      org('6', '6', 'KCD5', 'Korean Classification of Disease 5', '한국표준질병·사인분류 5차개정', 'Y'),
      org('7', '7', 'NEDIS', 'National Emergency Department Information Network', '국가응급환자진료정보망', 'Y'),
      org('8', '8200001', 'AUSOM_Ajou university Hospital', '아주대학교병원', '', 'N'),
      org('9', '8200002', 'CHA Bundang Medical Center', '분당차병원', '', 'N'),
      org('10', '8200007', 'Jeonbuk National University Hospital', '전북대학교병원', '', 'N'),
    ],
    exceptions: [
      exception('e1', '전북대학교병원', 'Order', 'ABC07', 'enlite sensor', '수가코드'),
      exception('e2', '전북대학교병원', 'Order', 'ZAM39', '인슐린주사법 교육(외래)', '수가코드'),
      exception('e3', '전북대학교병원', 'Order', 'ABC00', '혈당측정검사지', '수가코드'),
      exception('e4', '전북대학교병원', 'Order', 'ABC01', '채혈침', '수가코드'),
    ],
    versions: [
      {
        versionId: '아주대학교_202608', versionNm: '아주대학교_202608', siteName: '아주대학교',
        createdYmd: '2026-08-03', remark: 'XXX', archiveYn: 'N', stage: 1,
      },
      {
        versionId: '분당차병원_202608', versionNm: '분당차병원_202608', siteName: '분당차병원',
        createdYmd: '2026-08-01', remark: 'YYY', archiveYn: 'N', stage: 1,
      },
      {
        versionId: '전북대학교병원_202608', versionNm: '전북대학교병원_202608', siteName: '전북대학교병원',
        createdYmd: '2026-08-01', remark: 'ZZZ', archiveYn: 'Y', stage: 2,
      },
    ],
    files: [
      {
        versionId: '아주대학교_202608', fileKind: HIF_FILE_KIND,
        fileName: '아주대학교_202608.csv', loadedYn: 'Y',
      },
    ],
    histories: [
      {
        id: 'hh1', versionId: '아주대학교_202608', fileKind: HIF_FILE_KIND,
        fileName: '아주대학교_202608.csv', uploadedAt: '2026-08-03 01:21:31', uploader: 'BATCH',
      },
    ],
    codes: [
      localCode('c1', '아주대학교', 'Condition', 'A15.31C', 'Tuberculous pneumonia', '진단코드', 'A1531', 'Tuberculous pneumonia'),
      localCode('c2', '아주대학교', 'Condition', 'E11.58E', 'Type 2 diabetes mellitus', '진단코드', 'E1158', 'Type 2 diabetes mellitus'),
      localCode('c3', '아주대학교', 'Condition', 'C83.2', 'Mixed small and large cell', '진단코드', 'C832', 'Mixed small and large cell'),
      localCode('c4', '아주대학교', 'Condition', 'F62.8', 'Other enduring personality change', '진단코드', 'F628', 'Other enduring personality change'),
      localCode('c5', '아주대학교', 'Condition', 'Q82.0A', 'Congenital lymphedema', '진단코드', 'Q820', 'Congenital lymphedema'),
      localCode('c6', '아주대학교', 'Condition', 'M85092', 'Solid papillary carcinoma', '진단코드', 'M8509', 'Solid papillary carcinoma'),
    ],
  };
}

function fail(message) {
  return { ok: false, message };
}

function saveOrg(pack, body) {
  const row = body.row || {};
  const careSiteId = String(row.careSiteId || '').trim();
  const name = String(row.name || '').trim();
  if (!careSiteId || !name) return fail('Care Site ID와 Name을 입력해 주세요.');
  const originalId = body.originalId || '';
  const duplicate = pack.orgs.some((item) => item.careSiteId === careSiteId && item.careSiteId !== originalId);
  if (duplicate) return fail('같은 Care Site ID가 이미 있습니다.');
  const next = {
    codeOwnerId: String(row.codeOwnerId || '').trim(),
    careSiteId,
    name,
    fullName: String(row.fullName || '').trim(),
    description: String(row.description || '').trim(),
    commonYn: row.commonYn === 'N' ? 'N' : 'Y',
  };
  if (body.mode === 'edit') {
    const index = pack.orgs.findIndex((item) => item.careSiteId === originalId);
    if (index < 0) return fail('수정할 기관코드를 찾지 못했습니다.');
    pack.orgs[index] = next;
    return { ok: true, message: '저장되었습니다.', pack };
  }
  if (!next.codeOwnerId) {
    const max = pack.orgs.reduce((acc, item) => Math.max(acc, Number(item.codeOwnerId) || 0), 0);
    next.codeOwnerId = String(max + 1);
  }
  pack.orgs.push(next);
  return { ok: true, message: '저장되었습니다.', pack };
}

function textOf(row, field, fallbackField) {
  const primary = String((row && row[field]) || '').trim();
  if (primary) return primary;
  return String((row && fallbackField && row[fallbackField]) || '').trim();
}

function cleanException(row, id) {
  const yn = (value, fallback) => (value === 'Y' || value === 'N' ? value : fallback);
  const next = {
    id,
    siteName: String(row.siteName || '').trim(),
    domain: String(row.domain || '').trim(),
    commonMapYn: yn(row.commonMapYn, 'N'),
    manualMapYn: yn(row.manualMapYn, 'N'),
    deletedYn: yn(row.deletedYn, 'N'),
    deleteReason: row.deletedYn === 'Y' ? String(row.deleteReason || '').trim() : '',
  };
  [1, 2, 3, 4].forEach((index) => {
    next[`localCd${index}`] = textOf(row, `localCd${index}`);
    next[`localCd${index}Nm`] = textOf(row, `localCd${index}Nm`);
    next[`localCd${index}Type`] = textOf(row, `localCd${index}Type`);
  });
  [1, 2, 3, 4, 5].forEach((index) => {
    next[`concept${index}Id`] = textOf(row, `concept${index}Id`, `concept${index}`);
    next[`concept${index}Nm`] = textOf(row, `concept${index}Nm`);
    next[`concept${index}Type`] = textOf(row, `concept${index}Type`);
  });
  return next;
}

function saveException(pack, body) {
  const row = body.row || {};
  if (!String(row.siteName || '').trim() || !String(row.localCd1 || '').trim()) {
    return fail('기관과 Local Code1을 입력해 주세요.');
  }
  if (row.deletedYn === 'Y' && !String(row.deleteReason || '').trim()) {
    return fail('삭제하는 코드는 삭제 사유를 입력해 주세요.');
  }
  if (body.mode === 'edit') {
    const index = pack.exceptions.findIndex((item) => item.id === body.originalId);
    if (index < 0) return fail('수정할 예외코드를 찾지 못했습니다.');
    pack.exceptions[index] = cleanException(row, body.originalId);
    return { ok: true, message: '저장되었습니다.', pack };
  }
  pack.exceptions.unshift(cleanException(row, `e_${Date.now()}`));
  return { ok: true, message: '저장되었습니다.', pack };
}

function uploadExceptions(pack, body) {
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const usable = rows.filter((row) => String(row.siteName || '').trim() && String(row.localCd1 || '').trim());
  if (usable.length === 0) return fail('저장할 예외코드가 없습니다.');
  usable.forEach((row, index) => {
    pack.exceptions.unshift(cleanException(row, `e_${Date.now()}_${index}`));
  });
  return { ok: true, message: `${usable.length}건을 저장했습니다.`, pack };
}

export function applyHifAction(pack, body) {
  if (body.action === 'saveOrg') return saveOrg(pack, body);
  if (body.action === 'saveException') return saveException(pack, body);
  if (body.action === 'uploadExceptions') return uploadExceptions(pack, body);
  return fail('처리할 수 없는 요청입니다.');
}
