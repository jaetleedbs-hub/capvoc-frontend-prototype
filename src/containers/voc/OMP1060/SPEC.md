# OMP1060 OMOP 코드 조회2 — 화면기능정의

## 0. 출처

| | |
|---|---|
| 설계서 | `표준용어검색-athna사이트.pptx` 슬라이드 2~5, `표준용어검색-v0.2.md` |
| 작성 | 2026-11-23 |
| 상태 | 구현됨 |

슬라이드 1(Explore domains)은 Athena 첫 화면이다. 이 메뉴의 본문은 슬라이드 2의 검색이다.

## 1. 개요

| | |
|---|---|
| 화면 ID | `OMP1060` |
| 화면명 | OMOP 코드 조회2 |
| 모듈 | `voc` — 폴더 `containers/voc/OMP1060/` · 메뉴 `/voc/OMP1060` |
| 패턴 | 검색 + 왼쪽 패싯 + 오른쪽 목록. 상세는 딸린 팝업 |
| 열리는 방식 | 본문 탭. 상세 팝업 `OMP1060_detailPopup` 1100×720 |
| 하는 일 | 현재본 컨셉을 키워드와 다섯 패싯으로 찾고, 이름을 누르면 속성·동의어·관계를 팝업으로 본다. 저장하지 않는다. |

## 2. 영역

| # | 영역 | 패널 | 담는 것 |
|---|---|---|---|
| A | 검색 | `SearchPanel` | 아테나 버전, 키워드, [검색][초기화][?] |
| B | 선택 칩 | 검색 아래 | 적용된 키워드와 패싯. 없으면 그리지 않는다 |
| C | 패싯 | `SubFullPanel` 왼쪽 `ComponentPanel` | DOMAIN, CONCEPT, CLASS, VOCAB, VALIDITY, [필터 지우기] |
| D | 결과 | `SubFullPanel` 오른쪽 `ComponentPanel` | 내려받기, 페이지 크기, 정렬, 총건수, 페이지, `grdConceptList` |
| E | 상세 팝업 | `FullPanel` | DETAILS, SYNONYMS, TERM CONNECTIONS, [이전][닫기] |

## 3. 컴포넌트 정의

| 영역 | 표시명 | 부품 | ID | 바인딩 필드 | 필수 | 기본값 | 코드그룹 | 길이·형식 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| A | 아테나 버전 | Selectbox | `selSrchAthenaVersion` | `athenaVersion` | | 현재본 | | | 키워드 앞. 활성 버전만. 바꾸면 1페이지를 다시 조회한다 |
| A | 키워드 | Textfield | `iptSrchKeyword` | `keyword` | | `''` | | | 엔터 = 검색. 화면은 정규화하지 않는다 |
| A | 검색 | BasicButton | `btnSearch` | | | | | | 파랑 채움 |
| A | 초기화 | BasicButton | `btnReset` | | | | | | 키워드만 비운다 |
| A | ? | BasicButton | `btnHelp` | | | | | | 검색 규칙 |
| C | 패싯 필터 | Textfield | `iptSrchFacetDomain` 외 4개 | | | `''` | | | 보이는 체크만 줄인다. 조회 조건이 아니다 |
| C | 패싯 값 | Checkbox | `chkSrchdomain` 외 | 패싯 배열 | | | | | 한 패싯 안은 OR |
| C | 필터 지우기 | BasicButton | `btnClearFacet` | | | | | | 패싯만 비운다. 키워드는 남긴다 |
| D | 결과 내려받기 | BasicButton | `btnDownload` | | | | | | 같은 조건의 CSV. 5만 건 초과면 받지 않는다 |
| D | 페이지 | Selectbox | `selSrchPageSize` | `size` | | `15` | | 15·30·50·100·500 | |
| D | 정렬 | Selectbox | `selSrchSort` | `sort` | | `rank` | | | 그리드 머리 클릭은 서버 정렬로 이어지지 않아 선택상자를 쓴다 |
| D | 방향 | Selectbox | `selSrchSortDir` | `sortDir` | | `desc` | | | `rank` 일 때 비활성. 순위는 항상 높은 값 먼저 |
| E | 용어집 | BasicButton | `btnVocabInfo` | | | | | | 이름, 참조, 버전 |
| E | 이전 | BasicButton | `btnBack` | | | | | | 팝업 안에서 연 컨셉이 둘 이상일 때만 |
| E | 닫기 | BasicButton | `btnClose` | | | | | | 목록으로 돌아간다. 목록 조건은 유지 |

## 4. 기능 정의

| 트랜잭션 ID | 기능 | 계기 | 검증 | API | API 상태 | 요청 | 응답 | 후처리 |
|---|---|---|---|---|---|---|---|---|
| `OMP1060R01` | 목록 조회 | 화면 열림, 검색, 아테나 버전, 패싯, 정렬, 페이지 | 페이지 크기는 허용값만. 버전은 활성 현재본만 | `POST /api/term/search/concepts/r01` | 프로토타입 로컬. 백엔드 컨트롤러는 아직 없다 | versionLabel, 키워드, 다섯 패싯, page, size, sort, sortDir | versionLabel, versions, total, items, facets | 버전 콤보, 그리드, 패싯 건수를 채운다 |
| `OMP1060R02` | 상세 조회 | 이름 클릭, 관계 이름 클릭, 이전 | conceptId | `POST /api/term/search/concepts/r02` | 프로토타입 로컬. 백엔드 컨트롤러는 아직 없다 | conceptId | 속성, vocabulary, synonyms, connections | 팝업을 그 컨셉으로 바꾼다. 없으면 오류 문구 |
| `OMP1060E01` | 결과 내려받기 | [결과 내려받기] | 총건수 5만 이하 | `POST /api/term/search/concepts/r01` | 같은 조회에 `download=true` | R01과 같고 download | items 또는 exportRefused | CSV 저장. 넘치면 안내만 |

| 계기 | 일 |
|---|---|
| 이름 칸 클릭 | `OMP1060_detailPopup` 을 연다 |
| 칩의 × | 그 키워드 또는 패싯 값만 빼고 1페이지를 다시 조회한다 |
| 패싯 글자 필터 | 서버를 부르지 않는다 |
| 상세의 RELATES TO | 같은 팝업에서 그 컨셉을 조회하고 이력을 쌓는다 |
| [초기화] | 키워드만 비운다 |
| GNB 초기화 | 키워드, 패싯, 정렬, 페이지를 처음 값으로 |

패싯은 서로 AND 다. 한 패싯에서 여러 값을 고르면 그 패싯만 OR 다. 유효를 Valid 와 Invalid 둘 다 고르면 제한이 없다. 건수는 지금 보고 있는 패싯의 선택만 빼고 센다.

## 5. 그리드 컬럼 — `grdConceptList`

| 머리글 | field | 폭 | 정렬 | 형식(`type`) | 코드그룹 | 편집 | 필수 |
|---|---|---|---|---|---|---|---|
| ID | `conceptId` | 110 | right | | | | |
| CODE | `conceptCode` | 150 | left | | | | |
| NAME | `conceptName` | 280 | left | | | | 클릭하면 상세. `isLocal` 이면 앞에 `임시` |
| CLASS | `conceptClassId` | 140 | left | | | | |
| CONCEPT | `standardConcept` | 140 | center | | | | S Standard, C Classification, 그 밖 Non-standard |
| VALIDITY | `invalidReason` | 110 | center | | | | 빈 값 Valid, 값이 있으면 Invalid |
| DOMAIN | `domainId` | 120 | left | | | | |
| VOCAB | `vocabularyId` | 140 | left | | | | |

그리드 속성: 행 번호 없음 · 무한 스크롤 아니오 · 클라이언트 정렬 끔 · 높이 `calc(100vh - 340px)`

상세 `grdSynonym`: LANGUAGE `languageName`, SYNONYM CONCEPT `conceptSynonymName`. 높이 200px.

상세 `grdConnection`: RELATIONSHIP `relationshipName`, RELATES TO `targetConceptName`, CONCEPT ID `targetConceptId`, VOCABULARY `targetVocabularyId`. 높이 460px. RELATES TO 만 클릭한다.

## 6. 문구 (`TEXT`)

| 키 | 문구 |
|---|---|
| `download` | 결과 내려받기 |
| `clear` | 필터 지우기 |
| `noSynonym` | 동의어 없음 |
| `noConnection` | 관계 없음 |
| `missing` | 없는 컨셉입니다. |
| `exportLimit` | 5만 건을 넘습니다. 조건을 더 좁혀 주세요. |
| `noVocab` | 용어집 정보가 없습니다. |

도움말 여섯 줄은 화면 상수 `helpLines` 에 있다.

## 7. 등록

| 무엇 | 값 |
|---|---|
| 메뉴 | 프로토타입 `vocCatalog` 의 `OMP1060`. 메뉴명 `OMOP 코드 조회2` |
| 새 메뉴 폴더 | 없음. `OMP` 아래에 있다 |
| 메뉴 권한 | 프로토타입 로그인 계정이 업무 메뉴를 본다 |
| 프로그램(API) 권한 | `/api/term/search/concepts/r01` · `r02`. 백엔드 등록은 컨트롤러가 생긴 뒤 |
| 딸린 팝업 | `EssentialRoutes.js` `SPECIAL_POPUPS` — owner `OMP1060`, id `OMP1060_detailPopup` |
| 마이그레이션 파일 | 없음. 이 저장소는 메뉴를 로컬 카탈로그로 만든다 |

## 8. 확인 필요

| # | 질문 | 왜 묻나 | 답 |
|---|---|---|---|
| 1 | Athena 의 보라색 내려받기 버튼을 따라갈까? | 캡처와 버튼 표준이 다르다 | 2026-11-23 표준을 따른다. 검색만 파랑이고 내려받기는 회색이다 |
| 2 | 날짜를 `01-Jan-1970` 으로 보일까? | 캡처는 그 형식이다 | 2026-11-23 표준의 `YYYY-MM-DD` 를 쓴다 |
| 3 | 팝업이 이미 열려 있을 때 다른 행을 누르면? | 팝업 셸이 같은 주소를 한 번만 연다 | 이미 열린 창을 앞으로 가져온다. 다른 컨셉은 닫은 뒤 누른다. 관계 이동은 팝업 안에서 한다 |
