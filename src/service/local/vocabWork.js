/**
 * OMOP·공통용어 설계 화면이 읽고 쓰는 프로토타입 데이터.
 * 화면은 TransManager 로만 오고, 이 모듈은 저장소 한 덩어리를 고친다.
 */

import { applyHifAction, createHifPack } from './hifWork';
import { readSingleton, readUser, writeSingleton } from './store';

const KEY = '/api/voc/work';

export const OMP_FILE_KINDS = [
  'CONCEPT',
  'CONCEPT_SYNONYM',
  'DOMAIN',
  'CONCEPT_CLASS',
  'RELATIONSHIP',
  'VOCABULARY',
  'CONCEPT_RELATIONSHIP',
  'DRUG_STRENGTH',
  'CONCEPT_ANCESTOR',
  'SOURCE_TO_CONCEPT_MAP',
];

export const CTM_TERM_KINDS = ['EDI-DRUG', 'EDI-DEVICE', 'EDI-PROCEDURE', 'KCD', 'ICDO3', 'NEDIS'];

/** 참조구분은 그 구분의 파일 목록과 같다. KCD 이하는 설계서에 하위 구분이 없어 기본 하나만 둔다. */
export const CTM_REF_KINDS = {
  'EDI-DRUG': ['급여', '비급여'],
  'EDI-DEVICE': ['급여', '100대100', '허가초과', '비급여', '정액수가'],
  'EDI-PROCEDURE': ['급여'],
  KCD: ['기본'],
  ICDO3: ['기본'],
  NEDIS: ['기본'],
};

const LAYOUT_TARGETS = [
  'source_code',
  'source_name',
  'source_name_add',
  'code_attribute_코드분류',
  'code_attribute_코드값',
  'class_code_1_코드분류',
  'class_code_1_코드값',
  'class_code_2_코드분류',
  'class_code_2_코드값',
  'add_info_1_코드분류',
  'add_info_1_코드값',
];

function fileRow(versionId, fileKind, fileName, loadedYn) {
  return { versionId, fileKind, fileName, loadedYn };
}

function bothVersions(row) {
  return ['omop_20260831', 'omop_20260303'].map((versionId) => ({
    ...row,
    versionId,
    id: `${versionId}-${row.id}`,
  }));
}

function createSeed() {
  const omopFiles = [
    fileRow('omop_20260831', 'CONCEPT', 'CONCEPT.csv', 'Y'),
    fileRow('omop_20260831', 'CONCEPT_SYNONYM', 'CONCEPT_SYNONYM.csv', 'Y'),
    fileRow('omop_20260831', 'DOMAIN', 'DOMAIN.csv', 'Y'),
    fileRow('omop_20260831', 'CONCEPT_CLASS', 'CONCEPT_CLASS.csv', 'Y'),
    fileRow('omop_20260831', 'RELATIONSHIP', 'RELATIONSHIP.csv', 'Y'),
    fileRow('omop_20260831', 'VOCABULARY', 'VOCABULARY.csv', 'Y'),
    fileRow('omop_20260831', 'CONCEPT_RELATIONSHIP', 'CONCEPT_RELATIONSHIP.csv', 'Y'),
    fileRow('omop_20260831', 'DRUG_STRENGTH', 'DRUG_STRENGTH.csv', 'Y'),
    fileRow('omop_20260831', 'CONCEPT_ANCESTOR', 'CONCEPT_ANCESTOR.csv', 'N'),
  ];
  OMP_FILE_KINDS.forEach((kind) => {
    omopFiles.push(fileRow('omop_20260303', kind, `${kind}.csv`, 'Y'));
  });

  const concepts = [
    ...bothVersions({
      id: 'c9', conceptId: '9', conceptName: 'Visit type', domainId: 'Metadata', vocabularyId: 'Domain',
      conceptClassId: 'Domain', standardConcept: 'S', conceptCode: 'OMOP generated',
      validStart: '1970-01-01', validEnd: '2015-10-15', invalidReason: 'U',
    }),
    ...bothVersions({
      id: 'c10', conceptId: '10', conceptName: 'Procedure', domainId: 'Metadata', vocabularyId: 'Domain',
      conceptClassId: 'Domain', standardConcept: 'S', conceptCode: 'OMOP generated',
      validStart: '1970-01-01', validEnd: '2099-12-31', invalidReason: '',
    }),
    ...bothVersions({
      id: 'c11', conceptId: '11', conceptName: 'Procedure type', domainId: 'Metadata', vocabularyId: 'Domain',
      conceptClassId: 'Domain', standardConcept: '', conceptCode: 'OMOP generated',
      validStart: '1970-01-01', validEnd: '2099-12-31', invalidReason: '',
    }),
  ];
  const renamed = concepts.find((row) => row.versionId === 'omop_20260303' && row.conceptId === '9');
  if (renamed) renamed.conceptName = 'Visit type (이전)';

  return {
    OMP: {
      fileKinds: OMP_FILE_KINDS,
      versions: [
        {
          versionId: 'omop_20260831', versionNm: 'omop_20260831', athenaVersion: 'v5.0 29-AUG-26',
          createdYmd: '2026-09-14', remark: 'XXX', archiveYn: 'N', stage: 1,
        },
        {
          versionId: 'omop_20260303', versionNm: 'omop_20260303', athenaVersion: 'v5.0 27-FEB-26',
          createdYmd: '2026-08-12', remark: 'YYY', archiveYn: 'Y', stage: 3,
        },
      ],
      files: omopFiles,
      histories: [
        { id: 'h1', versionId: 'omop_20260831', fileKind: 'DRUG_STRENGTH', fileName: 'DRUG_STRENGTH_최종수정.csv', uploadedAt: '2026-11-12 16:21:31', uploader: '홍길동' },
        { id: 'h2', versionId: 'omop_20260831', fileKind: 'DRUG_STRENGTH', fileName: 'DRUG_STRENGTH_수정2.csv', uploadedAt: '2026-11-12 14:11:07', uploader: '홍길동' },
        { id: 'h3', versionId: 'omop_20260831', fileKind: 'DRUG_STRENGTH', fileName: 'DRUG_STRENGTH_수정.csv', uploadedAt: '2026-11-12 09:07:11', uploader: '홍길동' },
        { id: 'h4', versionId: 'omop_20260831', fileKind: 'DRUG_STRENGTH', fileName: 'DRUG_STRENGTH.csv', uploadedAt: '2026-11-11 23:21:19', uploader: 'BATCH' },
      ],
      stages: [
        { versionId: 'omop_20260831', phase: 'stage', tableName: 'DRUG_STRENGTH', leftCount: '2,966,568', rightCount: '2,966,568', status: '정상', remark: 'XXXX' },
        { versionId: 'omop_20260831', phase: 'stage', tableName: 'CONCEPT_RELATIONSHIP', leftCount: '54,904,246', rightCount: '54,904,249', status: '정상', remark: 'YYYY' },
        { versionId: 'omop_20260831', phase: 'stage', tableName: 'CONCEPT_ANCESTOR', leftCount: '97,115,713', rightCount: '97,115,713', status: '정상', remark: 'ZZZZ' },
        { versionId: 'omop_20260831', phase: 'official', tableName: 'DRUG_STRENGTH', leftCount: '2,966,568', rightCount: '2,966,568', status: '정상', remark: 'XXXX' },
        { versionId: 'omop_20260831', phase: 'official', tableName: 'CONCEPT_RELATIONSHIP', leftCount: '54,904,249', rightCount: '54,904,249', status: '정상', remark: 'YYYY' },
        { versionId: 'omop_20260831', phase: 'official', tableName: 'CONCEPT_ANCESTOR', leftCount: '97,115,713', rightCount: '97,115,713', status: '정상', remark: 'ZZZZ' },
        { versionId: 'omop_20260303', phase: 'stage', tableName: 'DRUG_STRENGTH', leftCount: '2,901,102', rightCount: '2,901,102', status: '정상', remark: '' },
        { versionId: 'omop_20260303', phase: 'official', tableName: 'DRUG_STRENGTH', leftCount: '2,901,102', rightCount: '2,901,102', status: '정상', remark: '' },
      ],
      tables: {
        concept: concepts,
        synonym: bothVersions({ id: 's1', conceptId: '33', synonymName: 'Provider specialty', languageConceptId: '4180186' })
          .concat(bothVersions({ id: 's2', conceptId: '8516', synonymName: 'African American/Black', languageConceptId: '4180186' }))
          .concat(bothVersions({ id: 's3', conceptId: '8516', synonymName: 'Black/African American', languageConceptId: '4180186' })),
        domain: bothVersions({ id: 'd1', domainId: 'Condition', domainName: 'Condition', domainConceptId: '19' })
          .concat(bothVersions({ id: 'd2', domainId: 'Condition Status', domainName: 'OMOP Condition Status', domainConceptId: '32889' }))
          .concat(bothVersions({ id: 'd3', domainId: 'Condition/Device', domainName: 'Condition/Device', domainConceptId: '235' })),
        conceptClass: bothVersions({ id: 'cc1', classId: '10th level', className: '10th administrative level', classConceptId: '32559' })
          .concat(bothVersions({ id: 'cc2', classId: '11-digit NDC', className: '11-digit NDC code', classConceptId: '44819243' }))
          .concat(bothVersions({ id: 'cc3', classId: '11th level', className: '11th administrative level', classConceptId: '32567' })),
        relationship: bothVersions({
          id: 'r1', relationshipId: 'AB-drug cjgt of', relationshipName: 'Antibody-drug conjugate of',
          isHierarchical: '0', definesAncestry: '0', reverseRelationshipId: 'Has AB-drug cjgt', relationshipConceptId: '33016',
        }).concat(bothVersions({
          id: 'r2', relationshipId: 'AMP of', relationshipName: 'Actual medicinal product of',
          isHierarchical: '0', definesAncestry: '0', reverseRelationshipId: 'Has AMP', relationshipConceptId: '45905757',
        })),
        vocabulary: bothVersions({
          id: 'v1', vocabularyId: 'ABMS', vocabularyName: 'Provider Specialty (American Board)',
          vocabularyReference: 'http://www.abms.org/member-boards', vocabularyVersion: '2018-06-26 ABMS', vocabularyConceptId: '45756746',
        }).concat(bothVersions({
          id: 'v2', vocabularyId: 'AMT', vocabularyName: 'Australian Medicines Terminology',
          vocabularyReference: 'https://www.nehta.gov.au/', vocabularyVersion: 'Clinical Terminology v20210630', vocabularyConceptId: '238',
        })),
        ancestor: bothVersions({ id: 'a1', ancestorConceptId: '24296', descendantConceptId: '36524718', minLevel: '2', maxLevel: '2' })
          .concat(bothVersions({ id: 'a2', ancestorConceptId: '24296', descendantConceptId: '36549248', minLevel: '2', maxLevel: '2' }))
          .concat(bothVersions({ id: 'a3', ancestorConceptId: '24296', descendantConceptId: '36566420', minLevel: '2', maxLevel: '2' })),
        conceptRelationship: bothVersions({
          id: 'cr1', conceptId1: '33', conceptId2: '8516', relationshipId: 'Has synonym',
          validStart: '1970-01-01', validEnd: '2099-12-31', invalidReason: '',
        }),
        drugStrength: bothVersions({
          id: 'ds1', drugConceptId: '19000001', ingredientConceptId: '11000001', amountValue: '5',
          amountUnitConceptId: '8576', numeratorValue: '', numeratorUnitConceptId: '',
          denominatorValue: '', denominatorUnitConceptId: '', boxSize: '30',
          validStart: '1970-01-01', validEnd: '2099-12-31', invalidReason: '',
        }),
      },
    },
    CTM: {
      termKinds: CTM_TERM_KINDS,
      refKinds: CTM_REF_KINDS,
      versions: [
        {
          versionId: 'EDI-DRUG_20260803', versionNm: 'EDI-DRUG_20260803', termKind: 'EDI-DRUG',
          createdYmd: '2026-08-03', remark: 'XXX', archiveYn: 'N', stage: 1,
        },
        {
          versionId: 'EDI-PROCEDURE_20260803', versionNm: 'EDI-PROCEDURE_20260803', termKind: 'EDI-PROCEDURE',
          createdYmd: '2026-08-03', remark: 'YYY', archiveYn: 'N', stage: 3,
        },
        {
          versionId: 'EDI-DEVICE_20260801', versionNm: 'EDI-DEVICE_20260801', termKind: 'EDI-DEVICE',
          createdYmd: '2026-08-01', remark: '', archiveYn: 'Y', stage: 2,
        },
      ],
      files: [
        fileRow('EDI-DRUG_20260803', '급여', '약제급여목록및급여상한금액표_(20260803).xlsx', 'Y'),
        fileRow('EDI-DRUG_20260803', '비급여', '20260801_DUR점검대상 비급여의약품.xlsx', 'Y'),
        fileRow('EDI-PROCEDURE_20260803', '급여', '행위급여목록_(20260803).xlsx', 'Y'),
        fileRow('EDI-DEVICE_20260801', '급여', '치료재료급여목록_(20260801).xlsx', 'Y'),
      ],
      histories: [
        {
          id: 'ch1', versionId: 'EDI-DRUG_20260803', fileKind: '급여',
          fileName: '약제급여목록및급여상한금액표_(20260803).xlsx',
          uploadedAt: '2026-08-03 01:21:31', uploader: 'BATCH',
        },
      ],
      codes: [
        code('EDI-DRUG_20260803', 'EDI-DRUG', '급여', '645302132', '포크랄시럽(포수클로랄)', '', '급여', '주성분코드 : 130830ASY', '분류번호 : 112'),
        code('EDI-DRUG_20260803', 'EDI-DRUG', '급여', '645302135', '포크랄시럽(포수클로랄) 5mL', '', '급여', '주성분코드 : 130830ASY', '분류번호 : 112'),
        code('EDI-DRUG_20260803', 'EDI-DRUG', '급여', '651904420', '명세핀정 3밀리그램', '', '급여', '주성분코드 : 149203ATB', '분류번호 : 112'),
        code('EDI-DRUG_20260803', 'EDI-DRUG', '비급여', '647801450', '아네모정 (1정)', '', '비급여', '주성분코드 : 411700ATB', '분류번호 : 234'),
        code('EDI-DEVICE_20260801', 'EDI-DEVICE', '급여', 'A0013001', 'CARBON SET (P.A. SET)', '', '급여', '중분류코드 : 010001', ''),
        code('EDI-DEVICE_20260801', 'EDI-DEVICE', '100대100', 'B1901001', 'COR-KNOT DEVICE', '', '100분의 100 미만 본인부담', '중분류코드 : 250251', ''),
        code('EDI-DEVICE_20260801', 'EDI-DEVICE', '허가초과', 'J4001002E', 'ANGIOGRAPHY CATHETER', '', '허가초과', '중분류코드 : 104033', ''),
        code('EDI-PROCEDURE_20260803', 'EDI-PROCEDURE', '급여', '10010', '주조금관', '', '급여', '산정명칭 : 장구분', '장구분 : 공상'),
        code('EDI-PROCEDURE_20260803', 'EDI-PROCEDURE', '급여', '20011', '어깨가슴 의지-미관형', 'Scapulo-thoracic', '급여', '산정명칭 : 장구분', '장구분 : 공상'),
      ],
      layouts: drugLayout(),
    },
    HIF: createHifPack(),
  };
}

function code(versionId, termKind, refKind, sourceCode, sourceName, sourceNameAdd, gubun, codeAttribute, classCode1) {
  return {
    id: `${versionId}-${sourceCode}`,
    versionId,
    termKind,
    refKind,
    sourceCode,
    sourceName,
    sourceNameAdd,
    careSiteName: termKind,
    gubun,
    codeAttribute,
    classCode1,
  };
}

function drugLayout() {
  const pairs = [
    ['source_code', '컬럼명', '제품코드'],
    ['source_name', '컬럼명', '제품명'],
    ['source_name_add', '빈값', ''],
    ['code_attribute_코드분류', '고정값', '급여'],
    ['code_attribute_코드값', '고정값', '급여'],
    ['class_code_1_코드분류', '고정값', '주성분코드'],
    ['class_code_1_코드값', '컬럼명', '주성분코드'],
    ['class_code_2_코드분류', '고정값', '분류번호'],
    ['class_code_2_코드값', '컬럼명', '분류번호'],
    ['add_info_1_코드분류', '고정값', '주성분명'],
    ['add_info_1_코드값', '컬럼명', '주성분명'],
  ];
  return pairs.map(([targetColumnId, mapType, mapValue]) => ({
    termKind: 'EDI-DRUG',
    refKind: '급여',
    targetColumnId,
    mapType,
    mapValue,
  }));
}

export function blankLayout(termKind, refKind) {
  return LAYOUT_TARGETS.map((targetColumnId) => ({
    termKind,
    refKind,
    targetColumnId,
    mapType: '컬럼명',
    mapValue: '',
  }));
}

function readWork() {
  let current = readSingleton(KEY);
  if (!current || !current.OMP || !current.CTM) {
    current = createSeed();
    writeSingleton(KEY, current);
    return current;
  }
  if (!current.HIF) {
    current.HIF = createHifPack();
    writeSingleton(KEY, current);
  }
  return current;
}

export function readDomain(domain) {
  const pack = readWork()[domain];
  return pack || null;
}

function stampNow() {
  const date = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())} ${z(date.getHours())}:${z(date.getMinutes())}:${z(date.getSeconds())}`;
}

function fail(message) {
  return { ok: false, message };
}

function saveVersion(pack, body) {
  const row = body.row || {};
  const versionNm = String(row.versionNm || '').trim();
  if (!versionNm) return fail('버전명을 입력해 주세요.');
  if (body.domain === 'OMP' && !String(row.athenaVersion || '').trim()) return fail('아테나 버전을 입력해 주세요.');
  if (body.domain === 'CTM' && !String(row.termKind || '').trim()) return fail('공통용어구분을 선택해 주세요.');
  if (body.domain === 'HIF' && !String(row.siteName || '').trim()) return fail('기관을 선택해 주세요.');
  if (!String(row.createdYmd || '').trim()) return fail('생성일을 입력해 주세요.');
  const duplicate = pack.versions.some((item) => item.versionNm === versionNm && item.versionId !== row.versionId);
  if (duplicate) return fail('같은 버전명이 이미 있습니다.');

  if (body.mode === 'edit') {
    const index = pack.versions.findIndex((item) => item.versionId === row.versionId);
    if (index < 0) return fail('수정할 버전을 찾지 못했습니다.');
    pack.versions[index] = { ...pack.versions[index], ...row, versionNm };
    return { ok: true, message: '저장되었습니다.', pack };
  }

  pack.versions.unshift({
    versionId: `v_${Date.now()}`,
    versionNm,
    athenaVersion: row.athenaVersion || '',
    termKind: row.termKind || '',
    createdYmd: row.createdYmd,
    remark: row.remark || '',
    archiveYn: 'N',
    stage: 1,
  });
  return { ok: true, message: '저장되었습니다.', pack };
}

function requiredKinds(pack, version, domain) {
  if (domain === 'OMP' || domain === 'HIF') return pack.fileKinds || [];
  return (pack.refKinds && pack.refKinds[version.termKind]) || ['기본'];
}

function uploadFile(pack, body) {
  const version = pack.versions.find((item) => item.versionId === body.versionId);
  if (!version) return fail('버전을 찾지 못했습니다.');
  if (version.stage >= 3) return fail('정식 테이블 적재 단계에서는 파일을 수정할 수 없습니다.');
  const fileKind = String(body.fileKind || '').trim();
  const fileName = String(body.fileName || '').trim();
  if (!fileKind || !fileName) return fail('파일 종류와 파일을 선택해 주세요.');

  const resetStage = version.stage === 2;
  if (resetStage) {
    version.stage = 1;
    pack.files.forEach((item) => {
      if (item.versionId === version.versionId) item.loadedYn = 'N';
    });
  }

  const found = pack.files.find((item) => item.versionId === version.versionId && item.fileKind === fileKind);
  if (found) {
    found.fileName = fileName;
    found.loadedYn = 'N';
  } else {
    pack.files.push(fileRow(version.versionId, fileKind, fileName, 'N'));
  }
  pack.histories.unshift({
    id: `h_${Date.now()}`,
    versionId: version.versionId,
    fileKind,
    fileName,
    uploadedAt: stampNow(),
    uploader: (readUser() && readUser().userNm) || 'admin',
  });
  const message = resetStage
    ? '파일을 등록했습니다. 1단계부터 다시 시작합니다.'
    : '파일을 등록했습니다.';
  return { ok: true, message, pack };
}

function approve(pack, body) {
  const version = pack.versions.find((item) => item.versionId === body.versionId);
  if (!version) return fail('버전을 찾지 못했습니다.');
  if (version.stage >= 3) return fail('이미 정식 적재가 끝난 버전입니다.');
  if (version.stage === 1) {
    const kinds = requiredKinds(pack, version, body.domain);
    const missing = kinds.filter((kind) => {
      const hit = pack.files.find((item) => item.versionId === version.versionId && item.fileKind === kind && item.fileName);
      return !hit;
    });
    if (missing.length > 0) return fail(`등록되지 않은 파일이 ${missing.length}건 있습니다.`);
    pack.files.forEach((item) => {
      if (item.versionId === version.versionId && item.fileName) item.loadedYn = 'Y';
    });
  }
  version.stage += 1;
  return { ok: true, message: '승인했습니다. 다음 단계로 넘어갑니다.', pack };
}

function saveLayout(pack, body) {
  const termKind = body.termKind;
  const refKind = body.refKind;
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!termKind || !refKind) return fail('공통용어구분과 참조구분을 선택해 주세요.');
  pack.layouts = pack.layouts.filter((item) => !(item.termKind === termKind && item.refKind === refKind));
  rows.forEach((item) => {
    pack.layouts.push({
      termKind,
      refKind,
      targetColumnId: item.targetColumnId,
      mapType: item.mapType || '컬럼명',
      mapValue: item.mapType === '빈값' ? '' : (item.mapValue || ''),
    });
  });
  return { ok: true, message: '레이아웃을 저장했습니다.', pack };
}

export function applyWork(body) {
  if (!body || (body.domain !== 'OMP' && body.domain !== 'CTM' && body.domain !== 'HIF')) {
    return fail('업무 구분이 없습니다.');
  }
  const all = readWork();
  const pack = all[body.domain];
  let result;
  if (body.domain === 'HIF' && (body.action === 'saveOrg' || body.action === 'saveException' || body.action === 'uploadExceptions')) {
    result = applyHifAction(pack, body);
  } else if (body.action === 'saveVersion') result = saveVersion(pack, body);
  else if (body.action === 'uploadFile') result = uploadFile(pack, body);
  else if (body.action === 'approve') result = approve(pack, body);
  else if (body.action === 'saveLayout') result = saveLayout(pack, body);
  else result = fail('처리할 수 없는 요청입니다.');
  if (!result.ok) return result;
  all[body.domain] = result.pack;
  writeSingleton(KEY, all);
  return { ok: true, message: result.message, bundle: readWork()[body.domain] };
}
