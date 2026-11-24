/**
 * CAP-VOC 업무 메뉴.
 * 대메뉴 ID 와 화면 ID 앞 3자는 업무 구분값이다.
 * DSH 대시보드, OMP OMOP, CTM 공통용어, OTC OMOP 임시컨셉,
 * HIF 병원기관 TF, ITD 통합 데이터, MAP 매핑 및 배포, QCM QC,
 * RQS 요청(타부서 재매핑), COM 공통.
 * SYS 시스템 관리 트리는 seeds.js 에 둔다.
 * BAT 배치 작업은 구분값만 있고, 이 프로토타입에는 화면이 없다.
 *
 * 화면 폴더는 containers/voc/{screenId}/index.js 이고, 아직 업무 로직 대신
 * ScreenShell 이 이 목록의 설명을 보여 준다.
 */

function row(screenId, menuNm, groupId, sortSn, kind, caller, description) {
  return {
    screenId,
    menuNm,
    groupId,
    sortSn,
    kind,
    caller,
    description,
  };
}

/** 아이콘바에 보이는 대메뉴. sortSn 10 간격이라 시스템 관리(100) 앞에 놓인다. */
export const VOC_GROUPS = [
  { menuId: 'DSH', menuNm: '대시보드', sortSn: 10 },
  { menuId: 'OMP', menuNm: 'OMOP 업무', sortSn: 20 },
  { menuId: 'CTM', menuNm: '공통용어 업무', sortSn: 30 },
  { menuId: 'OTC', menuNm: 'OMOP 임시컨셉 업무', sortSn: 40 },
  { menuId: 'HIF', menuNm: '병원기관 TF 업무', sortSn: 50 },
  { menuId: 'ITD', menuNm: '통합 데이터 업무', sortSn: 60 },
  { menuId: 'MAP', menuNm: '매핑 및 배포 업무', sortSn: 70 },
  { menuId: 'QCM', menuNm: 'QC 업무', sortSn: 80 },
  { menuId: 'RQS', menuNm: '요청 업무', sortSn: 90 },
];

export const VOC_SCREENS = [
  row('DSH0010', '대시보드', 'DSH', 10, 'MDI', '',
    '데이터 현황을 화면에 보여 준다. 세부 지표는 협의가 필요하다.'),

  row('OMP1010', 'OMOP 코드 관리', 'OMP', 10, 'MDI', '',
    'OMOP 현황과 등록된 버전을 보여 준다. 신규 OMOP 버전을 등록하거나 OMOP 상태를 처리하는 화면을 연다.'),
  row('OMP1020', 'OMOP 코드 조회', 'OMP', 20, 'MDI', '',
    '버전을 고르고 OMOP 테이블별 탭에서 코드를 조회한다. Etc 탭은 두 버전의 차이를 색으로 보여 준다.'),
  row('OMP1060', 'OMOP 코드 조회2', 'OMP', 25, 'MDI', '',
    'Athena 검색과 같은 표준용어 검색이다. 이름을 누르면 상세 팝업에서 속성, 동의어, 관계를 본다.'),
  row('OMP1030', 'OMOP 코드 신규 등록', 'OMP', 30, 'MODAL', 'OMOP 코드 관리',
    '자동 등록에 실패했을 때 신규 OMOP 코드 버전을 만든다.'),
  row('OMP1040', 'OMOP 파일 등록', 'OMP', 40, 'MODAL', 'OMOP 코드 관리',
    '신규 버전의 OMOP 파일을 올리고, 파일과 테이블 컬럼을 맞춰 레이아웃을 정한다. 레이아웃을 고르면 아래에 샘플을 보여 준다.'),
  row('OMP1050', 'OMOP 코드 상세 보기', 'OMP', 50, 'MODAL', 'OMOP 코드 관리',
    '신규 버전과 업로드한 OMOP 코드 목록을 보여 주고 직접 고칠 수 있다. 검수가 끝나면 배포한다.'),

  row('CTM1010', '공통용어 코드 관리', 'CTM', 10, 'MDI', '',
    '공통용어 버전 목록에서 신규 등록, 수정, 파일 등록, 상세 보기를 연다.'),
  row('CTM1020', '공통용어 코드 조회', 'CTM', 20, 'MDI', '',
    '구분과 참조구분, 생성일, 코드, 명칭으로 등록된 공통용어 코드를 조회한다.'),
  row('CTM1030', '공통용어 레이아웃 관리', 'CTM', 30, 'MDI', '',
    '공통용어구분, 참조구분, 컬럼 레이아웃 순으로 고르고 대상 컬럼의 매핑을 저장한다.'),
  row('CTM1040', '공통용어 코드 신규 등록', 'CTM', 40, 'MODAL', '공통용어 코드 관리',
    '자동 등록에 실패했을 때 공통용어 코드 버전을 만든다. 약가, 치료재료, 행위수가, KCD 중 유형을 고르고 그 버전의 기본 정보를 등록한다.'),
  row('CTM1050', '공통용어 파일 등록', 'CTM', 50, 'MODAL', '공통용어 코드 관리',
    '신규 버전의 파일을 유형별로 올리고, 파일 컬럼과 테이블 컬럼을 연결한다. 레이아웃을 고르면 샘플을 보여 주고 적재 가능 여부를 확인한다.'),
  row('CTM1060', '공통용어 코드 상세 보기', 'CTM', 60, 'MODAL', '공통용어 코드 관리',
    '신규 버전과 업로드한 코드 목록을 유형과 상관없이 한 화면에서 조회·수정한다. 오류를 확인하고 검수 후 배포하며, 유형별 검수·배포 상태를 보여 준다.'),

  row('OTC1010', '임시컨셉 관리', 'OTC', 10, 'MDI', '',
    'OMOP 임시컨셉 현황과 버전을 보여 준다. 신규 임시컨셉을 여러 건 등록하거나 상태를 처리한다. 현재 OMOP·공통용어에 매핑되지 않은 임시컨셉을 뽑아 낼 수 있다.'),
  row('OTC1020', '임시컨셉 등록·수정·삭제', 'OTC', 20, 'MDI', '',
    '등록된 임시컨셉을 조회하고 한 건씩 등록, 수정, 삭제한다.'),
  row('OTC1030', '임시컨셉 코드 검수', 'OTC', 30, 'MDI', '',
    '아직 검수하지 않은 임시컨셉 코드를 조회하고 검수 완료로 처리한다. 완료되면 OMOP Concept 테이블에 저장한다.'),
  row('OTC1040', '임시컨셉 코드 조회', 'OTC', 40, 'MDI', '',
    '등록된 임시컨셉 코드 목록을 조회한다.'),
  row('OTC1050', '임시컨셉 파일 등록', 'OTC', 50, 'MODAL', '임시컨셉 관리',
    'OMOP 코드와 공통용어(KCD/EDI)에서 매핑되지 않은 임시컨셉을 한 번에 등록할 파일을 올린다.'),

  row('HIF1010', '기관정보 관리', 'HIF', 10, 'MDI', '',
    '업무에 필요한 기관코드를 등록, 수정, 삭제한다. 기존 Evix-Term의 기관 관리 화면을 참조한다.'),
  row('HIF1020', '기관별 예외코드 관리', 'HIF', 20, 'MDI', '',
    '기관별 예외코드를 등록, 수정, 삭제한다. 지금은 공통코드 매핑 여부와 매핑 필요 여부만 다루고, 이후 특정 코드를 Concept ID로 매핑하는 기능을 더한다.'),
  row('HIF1030', '기관 코드 관리', 'HIF', 30, 'MDI', '',
    '기관코드 현황과 버전을 보여 준다. 매핑이 필요한 기관코드를 등록하거나 등록된 코드를 처리하는 화면을 연다.'),
  row('HIF1040', '기관 코드 조회', 'HIF', 40, 'MDI', '',
    '등록된 기관 코드 목록을 조회한다.'),
  row('HIF1050', '기관 코드 신규 등록', 'HIF', 50, 'MODAL', '기관 코드 관리',
    '자동 등록에 실패했거나 엑셀로 받은 기관 코드의 신규 버전을 만든다. 정규 등록과 마이너 버전 등록을 고를 수 있다.'),
  row('HIF1060', '기관 코드 파일 등록', 'HIF', 60, 'MODAL', '기관 코드 관리',
    '신규 버전의 기관 코드 파일을 올리고 레이아웃을 정한다. 레이아웃을 고르면 아래에 샘플을 보여 준다.'),
  row('HIF1070', '기관 코드 상세 보기', 'HIF', 70, 'MODAL', '기관 코드 관리',
    '신규 버전과 업로드한 기관 코드 목록을 보여 주고 직접 고칠 수 있다. 검수가 끝나면 배포한다.'),

  row('ITD1010', '통합 데이터 관리', 'ITD', 10, 'MDI', '',
    'OMOP 데이터와 공통용어(KCD/EDI)를 합친 form_edi 를 관리한다. 화면 기능과 MODAL 필요 여부는 추가 분석이 필요하다.'),
  row('ITD1020', '매핑 여부 관리', 'ITD', 20, 'MDI', '',
    '통합 데이터(form_edi)와 기관 코드(form_src)의 매핑 여부를 수정한다. 재매핑 여부도 이 화면에서 바꿀 수 있게 둘 예정이다.'),

  row('MAP1010', '매핑 작업 할당 관리', 'MAP', 10, 'MDI', '',
    '매핑이 필요한 대상(need_mapping 이 참인 데이터)을 조회해 사용자에게 할당한다. 할당 이력 화면이 필요한지는 확인이 필요하다.'),
  row('MAP1020', '코드 매핑 관리', 'MAP', 20, 'MDI', '',
    '본인에게 할당된 매핑 코드를 조회하고 그 작업을 관리한다.'),
  row('MAP1030', '코드 배포 및 버전 관리', 'MAP', 30, 'MDI', '',
    '공통코드와 기관별 코드의 매핑 상태를 확인하고 배포한다. 기존 Evix-Term의 작업 배포 화면을 참조한다.'),
  row('MAP1040', '기관별 배포 코드 관리', 'MAP', 40, 'MDI', '',
    '등록된 코드로 기관별 Map Main 을 만든 뒤 배포 배치 일정을 만든다. 기존 Evix-Term의 MapMain 만들기 화면을 참조한다.'),
  row('MAP1050', '나의 검색 조건 관리', 'MAP', 50, 'MODAL', '매핑 작업 할당 관리',
    '할당에 자주 쓰는 조건을 미리 저장한다. 조건을 고르면 매핑 작업 할당 관리의 할당 조건에 채워진다.'),
  row('MAP1060', '코드 매핑 작업', 'MAP', 60, 'MODAL', '코드 매핑 관리',
    '할당된 코드의 컨셉 매핑을 진행한다. 작업자 매핑, 배포, 관리자 검토, 검수자 매핑을 반복할 수 있다. Evix-Term의 컨셉 매핑, 1차 검토, 3자 검토를 참조한다.'),

  row('QCM1010', 'QC 관리', 'QCM', 10, 'MDI', '',
    '매핑 중이거나 매핑이 끝난 코드에 재매핑을 요청한다. 상세 업무는 추가 분석 후 설계한다.'),
  row('QCM1020', 'QC 매핑 결과 조회', 'QCM', 20, 'MDI', '',
    'QC 요청으로 생긴 매핑 항목의 결과를 조회한다. 상세 업무는 추가 분석 후 설계한다.'),
  row('QCM1030', 'QC 신규 등록', 'QCM', 30, 'MODAL', 'QC 관리',
    '매핑 중이거나 매핑이 끝난 코드의 재매핑 요청을 등록한다.'),
  row('QCM1040', 'QC 상세 보기', 'QCM', 40, 'MODAL', 'QC 관리',
    '등록된 QC 업무의 상세를 조회한다.'),

  row('RQS1010', '타부서 재매핑 관리', 'RQS', 10, 'MDI', '',
    '매핑이 끝난 코드에 대해 타부서 재매핑을 요청한다. QC 관리와 비슷하나, 관리자가 먼저 승인한 뒤 재매핑한다.'),
  row('RQS1020', '타부서 재매핑 결과 조회', 'RQS', 20, 'MDI', '',
    '타부서 재매핑 요청으로 생긴 매핑 항목의 결과를 조회한다.'),
  row('RQS1030', '타부서 재매핑 요청 신규 등록', 'RQS', 30, 'MODAL', '타부서 재매핑 관리',
    '매핑이 끝난 코드의 타부서 재매핑 요청을 등록한다.'),
  row('RQS1040', '타부서 재매핑 요청 상세 보기', 'RQS', 40, 'MODAL', '타부서 재매핑 관리',
    '재매핑 요청 상세를 조회한다. 관리자는 요청을 검토하고 승인 또는 거부를 지정한다.'),

  row('COM1010', '컨셉 상세 보기', 'COM', 10, 'MODAL', '공통',
    '선택한 컨셉의 상세를 보여 준다. Evix-Term에서 컨셉을 눌렀을 때의 Concept Details 를 참조한다.'),
  row('COM1020', '파이프라인 구성', 'COM', 20, 'MODAL', '공통',
    '업무별 단계를 그림으로만 보여 준다. OMOP, KCD/EDI 등 업무에 따라 해당 단계 이미지를 표시하며 별도의 업무 로직은 없다.'),
  row('COM1030', '이슈건 대상 목록 조회', 'COM', 30, 'MODAL', '공통',
    'OMOP 수정, QC, 타부서 재매핑처럼 진행 중 매핑을 고쳐야 할 이슈를 목록으로 보여 준다. 매핑 화면이 아닌 곳에서는 독립 MODAL로 열리고, 코드 매핑 작업에서는 화면 일부로 들어와 체크 후 저장한다.'),
];

const SCREEN_BY_ID = new Map(VOC_SCREENS.map((screen) => [screen.screenId, screen]));

export function getVocScreen(screenId) {
  return SCREEN_BY_ID.get(screenId) || null;
}

/**
 * gdsMenu 에 넣을 업무 메뉴 행.
 * MDI 는 서브메뉴에 보이고, MODAL 은 부모 화면이 열 수 있게 라우트만 등록한다.
 * 공통 MODAL 묶음(COM)은 아이콘바에 올리지 않는다.
 */
export function buildVocMenus(stampText) {
  const groups = VOC_GROUPS.map((group) => ({
    menuId: group.menuId,
    menuNm: group.menuNm,
    upMenuId: '',
    sortSn: group.sortSn,
    urlAddr: '',
    npagYn: 'N',
    menuUseYn: 'Y',
    scrnSize: '',
    mdfrId: 'admin',
    mdfcnDt: stampText,
  }));

  groups.push({
    menuId: 'COM',
    menuNm: '공통',
    upMenuId: '',
    sortSn: 95,
    urlAddr: '',
    npagYn: 'N',
    menuUseYn: 'H',
    scrnSize: '',
    mdfrId: 'admin',
    mdfcnDt: stampText,
  });

  const screens = VOC_SCREENS.map((screen) => {
    const modal = screen.kind === 'MODAL';
    return {
      menuId: screen.screenId,
      menuNm: screen.menuNm,
      upMenuId: screen.groupId,
      sortSn: screen.sortSn,
      urlAddr: `/voc/${screen.screenId}`,
      npagYn: modal ? 'Y' : 'N',
      menuUseYn: modal ? 'H' : 'Y',
      scrnSize: modal ? '960,720' : '',
      mdfrId: 'admin',
      mdfcnDt: stampText,
    };
  });

  return groups.concat(screens);
}
