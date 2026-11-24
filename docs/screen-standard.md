# 화면 개발 표준서

> **읽는 이** — 이 저장소에서 화면을 만드는 **AI(Claude·Cursor)와 개발자.**
> **입력** — 개발자가 PPTX 로 그린 화면설계를 **캡처한 그림**.
> **출력** — `frontend/src/containers/<모듈>/<화면ID>/` 의 `SPEC.md`(화면기능정의) + `index.js`(화면).
>
> 함께 보는 문서 — [design-standard.md](design-standard.md)(색·글꼴·버튼) ·
> [component-reference.md](component-reference.md)(부품의 속성·이벤트) ·
> [spec-template.md](spec-template.md)(SPEC.md 양식) · [ai-prompt.md](ai-prompt.md)(요청 문구)

### ★ 이 문서가 기존 화면 코드보다 앞선다

`containers/sys/*` 의 화면 22개는 **원본 프로젝트에서 넘어온 것**이라 서로 다르게 짜여 있다
(성공 판정 4가지, 검색 ID 6가지, 오타 `fiiled` 85곳, 효과 없는 `addConfig` 전부 …).
**옆 화면을 베끼지 말고 이 문서를 따른다.** 이 문서에 없는 것만 기존 화면에서 찾고,
찾은 것이 둘 이상이면 **묻는다.**

다만 **보이는 모양은 옆 화면과 같아야 한다** — 같은 부품(`components`)을 같은 자리에 쓰면 그렇게 된다.
새 CSS·새 색·새 간격을 만들지 않는다([design-standard.md](design-standard.md) §0).

---

## 1. 작업 순서

| 단계 | 하는 일 | 산출물 | 멈춤 |
|---|---|---|---|
| ① 판독 | 그림을 영역으로 나누고, 요소마다 부품을 정한다(§4) | — | |
| ② 정의 | 화면기능정의를 쓴다(§2) | `SPEC.md` | **⏸ 개발자 확인** — 「확인 필요」가 하나라도 있으면 여기서 멈추고 묻는다 |
| ③ 퍼블리싱 | 골격(§5-1)에 맞춰 화면을 짠다 | `index.js` | |
| ④ 등록 | 메뉴·권한 SQL 을 만든다(§6) | `db/sql/V{n}__menu_{화면ID}.sql` | |
| ⑤ 확인 | `yarn build` → 띄워서 **화면 전체**를 본다(§8) → 그 화면을 찍어 SPEC 옆에 둔다(§2) | `screen.png` | 띄울 수 없으면 개발자에게 확인을 요청한다 |

> **그림에 없는 것을 지어내지 않는다.** 읽히지 않는 글자, 정해지지 않은 코드값, 모르는 API 는
> `SPEC.md` §8 「확인 필요」에 적고 **묻는다.** 그럴듯한 값으로 채운 화면은 «돌아가는 것처럼 보여서»
> 틀린 곳이 가장 늦게 드러난다.

---

## 2. 화면 기능 정의 — `SPEC.md`

그림은 대화가 끝나면 사라진다. **그림에서 읽어 낸 것을 글로 남기는 것**이 `SPEC.md` 다.
다음 사람(사람이든 AI 든)이 화면을 고칠 때 「이 칸이 왜 필수인가」를 여기서 찾는다.

- **자리** — 화면 폴더 안: `frontend/src/containers/<모듈>/<화면ID>/SPEC.md`
  (라우터는 `**/*.js` 만 모으므로 `.md` 는 번들에 들어가지 않는다)
- **양식** — [spec-template.md](spec-template.md) 를 복사해 채운다. 절을 빼지 않는다 — 해당 없으면 「없음」.
- **화면 그림 `screen.png` 를 SPEC.md 옆에 두고 §0 에 건다.** 글만으로는 영역·배치가 떠오르지 않고,
  다음 사람은 「이 그림 → 이 SPEC」 짝을 본보기로 삼는다.
  - 찍는 것은 **구현한 화면**이다 — ⑤ 확인에서 띄운 화면을 «열었을 때» 모양 그대로, 1600×900 에서.
    본문 탭 화면은 화면 영역만, 팝업은 팝업 상자만 자른다(메뉴 트리·상단바는 넣지 않는다).
  - **개인정보·시험 데이터가 찍히지 않게 한다.** 자동 조회하지 않는 화면은 빈 목록 그대로 찍는다.
  - **화면 배치를 바꾸면 다시 찍는다.** 코드와 다른 그림은 없는 것보다 나쁘다.
- **PPTX 캡처 파일은 저장소에 넣지 않는다.** 대신 §0 「출처」에 PPTX 파일명·슬라이드 번호·판을 적는다.
- **코드와 어긋나면 코드를 고치기 전에 SPEC 부터 고친다.**

| 절 | 담는 것 |
|---|---|
| §0 출처 | 설계서 파일·슬라이드·판, 작성일, 화면 그림(`screen.png`) |
| §1 개요 | 화면ID·화면명·모듈·경로·**화면 패턴(§4-3)**·팝업 여부·크기 |
| §2 영역 | 그림을 나눈 영역과 각 영역의 부품 패널 |
| §3 컴포넌트 정의 | 요소마다 — 영역·표시명·부품·**ID**·바인딩 필드·필수·기본값·코드그룹·길이 |
| §4 기능 정의 | 트랜잭션마다 — ID·이름·계기(버튼/이벤트)·검증·API·요청·응답·후처리 |
| §5 그리드 컬럼 | 머리글·field·폭·정렬·형식·편집·필수 |
| §6 문구 | `TEXT` 의 키와 문구 |
| §7 등록 | 메뉴 행·권한·API 목록 |
| §8 확인 필요 | 그림만으로 정할 수 없던 것 — **질문 형태로** |

---

## 3. 명명 규칙

모든 식별자는 **ASCII** 다. 한글은 «보이는 문구»(`TEXT`·공통코드 이름)에만 쓴다.

### 3-1. 화면 ID · 폴더 · 메뉴

| 무엇 | 규칙 | 예 |
|---|---|---|
| 모듈 코드 | 영문 대문자 3자. `SYS`·`COM` 은 템플릿 예약 | `SMP` |
| 화면 ID | `{모듈}{분류 1자리}{순번 2자리}0` — 순번은 10 간격으로 비워 둔다 | `SMP0010` · `SMP0020` · `SMP1010` |
| 폴더 | `containers/{모듈 소문자}/{화면ID}/index.js` | `containers/smp/SMP0010/index.js` |
| 메뉴 `url_addr` | `/{모듈 소문자}/{화면ID}` | `/smp/SMP0010` |
| 메뉴 폴더 ID | 대분류 `{모듈}`, 중분류 `{모듈}{분류}` | `SMP` · `SMP0` |

> **화면 ID 는 개발자가 정한다.** 그림·요청에 없으면 지어내지 말고 묻는다 —
> 같은 번호를 두 사람이 쓰면 메뉴 PK 가 부딪친다.

### 3-2. 팝업

| 종류 | 언제 | ID · 파일 | 등록 |
|---|---|---|---|
| **공용 팝업** | 여러 화면이 연다(찾기 팝업 등) | 일반 화면 ID (`SMP0090`) · 자기 폴더 | 메뉴 행 `npag_yn='Y'`, `menu_use_yn='H'`(트리에 숨김) |
| **딸린 팝업** | 한 화면만 연다(상세·편집) | `{부모ID}_{이름}Popup` · 부모 폴더의 `{이름}Popup.js` | `routes/EssentialRoutes.js` 의 `SPECIAL_POPUPS` 한 줄 |

```js
// routes/EssentialRoutes.js — SPECIAL_POPUPS
{ owner: 'SMP0010', id: 'SMP0010_detailPopup',
  load: () => import('containers/smp/SMP0010/detailPopup.js'),
  description: '샘플 상세 팝업' },
```

딸린 팝업은 **부모 화면을 볼 수 있는 사람에게만** 등록된다 — 권한을 두 번 관리하지 않는다.

### 3-3. 트랜잭션 ID · API

| 무엇 | 규칙 | 예 |
|---|---|---|
| 트랜잭션 ID | `{화면ID}{구분}{순번 2자리}` | `SMP0010R01` |
| 구분 | `R` 조회 · `U` 저장(등록·수정 모두) · `D` 삭제 · `V` 서버 검증(중복확인 등) · `E` 내보내기(엑셀·CSV) | |
| API 경로 | `/api/{모듈 소문자}/{자원 kebab-case}/{구분 소문자}{순번}` · **POST** | `/api/smp/sample/r01` |

- **등록용 `C` 는 쓰지 않는다.** 등록과 수정은 같은 `U` 로 보내고 행의 `rowtype`(`c`/`u`)으로 가른다 —
  백엔드 컨트롤러가 `/u01` 하나로 받는다(`backend/…/cmm/*/web/*Controller.java`).
- ⚠ **템플릿의 기존 cmm 서비스는 `rowtype` 을 읽지 않고 upsert 한다** — 등록하려던 키가 이미 있으면
  그 행을 **말없이 덮어쓴다**(SYS0010·SYS0080·SYS1010 에서 실제로 확인). 그래서 등록 화면은
  저장 전에 중복을 확인한다 — 화면 안 목록으로 보거나, 키 조회 API 를 `V` 트랜잭션으로 부른다.
  새로 만드는 API 는 `rowtype` 을 읽어 등록·수정을 가르게 짓는다.
- 트랜잭션 ID 의 끝(`R01`)과 API 경로의 끝(`r01`)을 **같게** 맞춘다. 화면 하나의 API 는 보통 자원 하나다.
  예외 — **다른 자원의 API 를 빌려 쓸 때**(예: SYS0030 이 권한등급 목록 `/api/cmm/authrt-grade/r01` 을 부른다)와
  **기존 조회 API 를 `V`(중복확인)로 쓸 때**는 트랜잭션 ID 를 화면 순번대로 짓고(`SYS0030R03`·`SYS0010V01`),
  API 맵에 실제 경로를 그대로 적는다. 끝자리가 달라도 된다.
- 경로 변수를 받는 API 는 맵에 앞부분만 두고 부를 때 붙인다 — `tm.setTransUrl(\`${API.SYS6020R02}/${logSid}\`)`.
- **백엔드에 이미 있는 API 는 지어내지 말고 찾는다** —
  `grep -rn "@RequestMapping\|@PostMapping" backend/src/main/java` .
  아직 없으면 SPEC §4 의 「API 상태」를 `미구현` 으로 적는다(§5-2 참고).
- `backend/docs/DEVELOPMENT_GUIDE.md` 의 `/api/{프로그램id소문자}` 규칙은 **낡았다.** 실제 컨트롤러는 위 형식이다.

### 3-4. 컴포넌트 ID

```
{접두어}[Srch]{필드}
```

- **`{필드}`** — 그 칸이 담는 **데이터 필드명**(DB 컬럼의 camelCase)을 PascalCase 로.
  DB 의 축약명을 그대로 쓴다(`userNm`, `useYn`, `rmrkCn`) — 영어로 «풀어» 쓰지 않는다.
  그래야 ID ↔ 필드 ↔ API 가 기계적으로 이어진다.
- **`Srch`** — 검색 영역의 칸에만 붙인다. 같은 필드가 검색과 상세에 다 있어도 ID 가 갈린다.
- ID 는 **화면 안에서** 유일하면 된다. 다른 화면과 겹치는 것은 막을 수 없다 — 열어 둔 탭은 `display:none` 으로 숨을 뿐
  DOM 에 남고(로그인하면 숨은 조직관리 탭이 늘 있다), 팝업은 겹쳐 뜬다(COM1100 위의 COM0020 이 둘 다 `iptUserId`).
  그래서 `document.getElementById` 로 찾지 않는다 — 골격의 `focus(id)` 처럼 **보이는 것**을 찾거나, 그리드는 `gridApi` 로.
- 접두어는 부품마다 하나다:

| 부품 | 접두어 | 예 |
|---|---|---|
| `BasicButton` | `btn` | `btnSearch` (§3-4-1) |
| `Textfield` · `TextPasswdfield` | `ipt` | `iptSrchUserNm` · `iptUserNm` |
| `Textarea` | `txa` | `txaRmrkCn` |
| `Selectbox` · `MulitSelectBox` | `sel` | `selSrchUseYn` · `selUseYn` |
| `ComboList` | `cmb` | `cmbOgnzCd` |
| `ToggleButtonGroup` | `tgl` | `tglPrdSeCd` |
| `Checkbox` · `MultiCheckBox` | `chk` | `chkUseYn` |
| `Radio` | `rdo` | `rdoUserTypeCd` |
| `Switch` | `swt` | `swtNtcYn` |
| `InputCalendar` | `cal` | `calJncmpYmd` |
| `RangeInputCalendar` | `rng` | `rngSrchRegDt` |
| `NumberStepper` | `num` | `numSortSn` |
| `UserSelect` · `UserMultiSelect` | `usr` | `usrSrchMngr` |
| `OgnzSelect` | `ognz` | `ognzSrchOgnz` |
| `Grid` | `grd` | `grdUserList` |
| `Table`(폼) | `tbl` | `tblUserDetail` |
| `Tree` · `SortableTree` | `tree` | `treeOgnz` |
| `Tabs` | `tab` | `tabUserInfo` |
| `FileManager` | `file` | `fileAtch` |
| `HtmlEditor` | `edt` | `edtPstCn` |

#### 3-4-1. 버튼 ID — 동작어를 고정한다

| 동작 | ID | 동작 | ID |
|---|---|---|---|
| 조회 | `btnSearch` | 행추가 | `btnAddRow` |
| 초기화(검색조건) | `btnReset` | 행삭제 | `btnDelRow` |
| 신규 | `btnNew` | 엑셀 | `btnExcel` |
| 저장 | `btnSave` | 선택(팝업) | `btnSelect` |
| 삭제 | `btnDelete` | 닫기(팝업) | `btnClose` |
| 취소 | `btnCancel` | 확인 | `btnConfirm` |

한 화면에 같은 동작이 둘이면 대상을 붙인다 — `btnSaveDetail`, `btnSearchHist`.
탭마다 같은 버튼이 있으면 탭 대상을 붙여 **DOM id 가 겹치지 않게** 한다 — `btnSaveMenu`·`btnSavePrgrm`(SYS3030).
대상에 대한 동작은 `btn{동작}{대상}` — `btnResetPswd`(비밀번호 초기화), `btnResetLgn`(로그인 초기화).

### 3-5. state 키

| 무엇 | 규칙 | 예 |
|---|---|---|
| 목록 데이터셋 | `ds{엔터티}List` — 그리드 ID 와 엔터티를 같게 | `dsUserList` ↔ `grdUserList` |
| 단건 데이터셋 | `ds{엔터티}Detail` (필요할 때만) | `dsUserDetail` |
| 부품 props 묶음 | 부품 종류별 하나, **키는 컴포넌트 ID** | 아래 |

| 묶음 | 담는 부품 |
|---|---|
| `btnProps` | BasicButton |
| `textFieldProps` | Textfield · TextPasswdfield |
| `textareaProps` | Textarea |
| `selectboxProps` | Selectbox · ComboList · ToggleButtonGroup |
| `checkboxProps` · `radioProps` | Checkbox · Radio |
| `calendarProps` · `rangeCalendarProps` | InputCalendar · RangeInputCalendar |
| `grdProps` · `treeProps` | Grid · Tree |
| `userSelectProps` · `ognzSelectProps` | UserSelect · OgnzSelect |

- **값은 props 안에 둔다**(`textFieldProps.iptUserNm.value`). 같은 값을 다른 곳에 두 벌 두지 않는다.
  값을 담는 속성 이름은 부품마다 다르다 — `value`·`checked`·`selected`·`startDate/endDate` (§5-9).
- 검색 조건 전용 데이터셋(`dsSearch`)은 **만들지 않는다** — 트랜잭션에서 props 값을 모아 보낸다(§5-2).

### 3-6. 메서드 · 이벤트

| 무엇 | 이름 |
|---|---|
| 클래스 | `View` (`export default View`) |
| 생명주기 | `componentDidMount` |
| 검증 → 통신 → 결과 | `validation(transId)` → `transaction(transId)` → `callback(res)` |
| 이벤트 | `event = { button: {onClick}, input: {onChange, onKeyPress}, selectbox: {onChange}, grid: {onGridReady, onRowClicked, …}, … }` |
| 보조 | 동사로 시작하는 camelCase — `search()`, `clearDetail()`, `fillDetail(row)` |

### 3-7. 문구 키 (`TEXT`)

화면에 보이는 글자는 전부 파일 맨 위 `TEXT` 한 곳에 둔다(§5-4). 키는 ASCII camelCase:

| 묶음 | 키 | 예 |
|---|---|---|
| `TEXT.title` | 패널 제목 | `list`, `detail` |
| `TEXT.label` | 칸 이름·그리드 머리글 — **키 = 필드명**. 필드가 아닌 라벨(기간·체크박스 옆 글자)은 뜻으로 | `userNm`, `useYn`, `period` |
| `TEXT.placeholder` | 입력칸 안내 글 — 키 = 필드명 | `cmpyId` |
| `TEXT.btn` | 버튼 글자 — **키 = 버튼 동작어** | `search`, `save` |
| `TEXT.msg` | 알림·확인 문구 | `required{필드}`, `confirmSave`, `saved` |
| `TEXT.code` | **공통코드 그룹이 없는** 코드값의 이름 — `{그룹}.{코드값}` | `code.sevCd.ERROR` |
| `TEXT.file` | 내려받는 파일 이름 앞부분 | `csvPrefix` |

> `TEXT.code` 는 예외 자리다. 코드 이름은 **공통코드에서** 가져오는 것이 원칙이고(§5-6, 서버가 언어별로 준다),
> 서버 enum 처럼 공통코드 그룹이 없는 값만 여기 둔다. **모르는 코드값은 빈칸이 아니라 코드값 그대로** 보인다 —
> 그래야 새 코드가 오고 있다는 것이 화면에 드러난다(SYS6020 `labelOf`).

---

## 4. 컴포넌트 배치 표준 — 그림을 화면으로

### 4-1. 그림을 읽는 원칙

1. **그림은 «무엇이 어디에»다. 시각 사양이 아니다.** PPT 의 색·글꼴·픽셀 크기·그림자를 베끼지 않는다.
   색과 크기는 [design-standard.md](design-standard.md) 가 정한다. 그림에서 가져오는 것은
   **영역의 순서, 칸의 순서, 칸의 종류, 글자, 필수 표시, 버튼의 종류와 위치**다.
2. **위 → 아래, 왼 → 오른쪽** 순서로 사각 영역을 나눈다. 영역마다 §4-3 의 패널 하나로 옮긴다.
3. 요소마다 §4-2 표에서 부품을 고른다. 표에 없는 모양이면 **새 부품을 만들지 말고 묻는다.**
4. 그림의 좌우 비율은 `flex` 숫자로만 옮긴다(예: 3:7 → `flex: 3` / `flex: 7`). 픽셀로 옮기지 않는다.
5. 그림의 글자가 표준 문구와 다르면(「검색」 vs 「조회」) **표준을 따르고** SPEC §8 에 적는다.

### 4-2. 판독표 — 그림의 요소 → 부품

| 그림에서 보이는 것 | 부품 | 비고 |
|---|---|---|
| 라벨 + 빈 칸 | `Label` + `Textfield` | 숫자만이면 `type:'onlyNum'` + 검증(§5-5) |
| 라벨 + 칸 + ▼ | `Selectbox` | 항목이 공통코드면 §5-6. 20개를 넘고 검색이 필요하면 `ComboList` |
| 칸 + 📅 / `YYYY-MM-DD` | `InputCalendar` | `YYYY-MM` 이면 `plugins="month"` |
| `날짜 ~ 날짜` | `RangeInputCalendar` | |
| ☐ 하나 (예/아니오) | `Checkbox` | 값은 `'Y'`/`'N'` |
| ☐ 여럿 | `MultiCheckBox` | |
| ◯ 2~4개 | `Radio` | 붙은 버튼 모양이면 `ToggleButtonGroup` |
| 켜짐/꺼짐 스위치 | `Switch` | |
| 칸 + 🔍 — **사용자·담당자** | `UserSelect` (여럿이면 `UserMultiSelect`) | 찾기 팝업 SYS0040 이 딸려 온다 |
| 칸 + 🔍 — **조직·부서** | `OgnzSelect` | 찾기 팝업 SYS0020 이 딸려 온다 |
| 칸 + 🔍 — 그 밖 | `<div className="component-with">` 안에 `Textfield` + `BasicButton`(`type: 'icon'`, `className: 'icon-srchBlue'`) → 공용 찾기 팝업 | 사용자·조직 찾기와 같은 모양이 된다(COM2070 의 메뉴 🔍). 팝업이 없으면 **묻는다** |
| 여러 줄 칸 | `Textarea` | |
| 서식 도구막대 + 큰 칸 | `HtmlEditor` | |
| 첨부·끌어놓기 | `FileManager` | 첨부 부품은 이것 하나다([component-reference.md](component-reference.md) §9) |
| `− [ 3 ] +` | `NumberStepper` | |
| 머리행 + 여러 데이터 행 | `Grid` | 셀 안 입력칸이 보이면 편집 그리드(§5-7) |
| 회색 라벨칸 + 흰 값칸이 짝지어 반복 | `Table`(폼) | §4-5 |
| ▸ 접고 펴는 계층 | `Tree` | 끌어서 순서를 바꾸면 `SortableTree` |
| 탭 머리 | `Tabs` + `TabPanel` | |
| 색 칩 여러 개 | `TagSelector` | |
| 영역 위 굵은 글자 | 패널 제목 `<h3>` | §4-3 골격 |
| 버튼 | `BasicButton` | 모양은 [design-standard.md](design-standard.md) §4 의 표에서 고른다 |
| 그 밖(차트·카드·배지 …) | — | **묻는다**. 차트는 아직 표준이 없다 |

### 4-3. 화면 패턴

화면은 아래 일곱 중 하나다. SPEC §1 에 고른 패턴을 적는다. 둘에 걸치면 가까운 쪽을 고르고 §8 에 적는다.

| 패턴 | 모양 | 원형 화면 |
|---|---|---|
| **L1 조회형** | 검색 + 목록 | `SYS6010` |
| **L2 목록·상세(상하)** | 검색 + 목록 + 아래 상세폼 | `SYS5010` |
| **L3 목록·상세(좌우)** | 검색 + 왼쪽 목록/트리 + 오른쪽 상세폼 | `SYS0010` |
| **L4 편집 그리드** | 검색 + 셀에서 고치는 목록 + 저장 | `SYS1010` · `SYS3040` |
| **L5 선택 팝업** | 검색 + 목록 + 선택/닫기 | `SYS0040` |
| **L6 입력 팝업** | 폼 + 저장/닫기 | `COM2080` |
| **L7 매핑형** | 검색 + 왼쪽 주체 목록 + 오른쪽 대상 체크 그리드 + 저장 | `SYS3020` · `SYS3050` |

공통 뼈대 — 모든 화면은 `FullPanel` 하나로 감싼다. 패널 사이 간격·카드 배경·둥근 모서리는
**패널 부품이 정한다.** `style` 로 여백·배경·테두리를 더하지 않는다.

```
FullPanel
├─ SearchPanel                     ← 검색 영역 (있으면 언제나 맨 위)
│   └─ RelativeGroup
│       ├─ LFloatArea  : 라벨 + 칸들 (§4-4)
│       └─ RFloatArea  : [조회] [↺]
└─ SubFullPanel                    ← 본문 영역 (여러 개면 위→아래로 쌓인다)
    ├─ ComponentPanel              ← 흰 카드 하나 = 영역 하나
    │   ├─ RelativeGroup
    │   │   ├─ LFloatArea : <h3>제목</h3>
    │   │   └─ RFloatArea : 그 영역의 보조 버튼 (행추가·엑셀 …)
    │   └─ Grid | Table | Tree | Tabs
    └─ BottomPanel                 ← 그 카드의 주 버튼 줄 (신규·저장·삭제)
        └─ RelativeGroup > RFloatArea
```

#### L1 조회형

```
┌ 검색 ───────────────────────────────── [조회][↺] ┐
└──────────────────────────────────────────────────┘
┌ 제목 ─────────────────────────────────── [엑셀] ┐
│ Grid                                             │
└──────────────────────────────────────────────────┘
```

```jsx
<FullPanel>
  <SearchPanel>…§4-4…</SearchPanel>
  <SubFullPanel>
    <ComponentPanel>
      <RelativeGroup>
        <LFloatArea><h3>{TEXT.title.list}</h3></LFloatArea>
        <RFloatArea><Button {...btnProps.btnExcel} /></RFloatArea>
      </RelativeGroup>
      <Grid {...grdProps.grdXxxList} data={dsXxxList} onGridReady={this.event.grid.onGridReady} />
    </ComponentPanel>
  </SubFullPanel>
</FullPanel>
```

#### L2 목록·상세(상하) — 전체 골격은 §5-1

```
┌ 검색 ───────────────────────────────── [조회][↺] ┐
┌ 목록 제목 ───────────────────────────────────────┐
│ Grid                                             │
└──────────────────────────────────────────────────┘
┌ 상세 제목 ───────────────────────────────────────┐
│ Table(폼)                                        │
└──────────────────────────────────────────────────┘
                                 [신규][저장][삭제]
```

목록과 상세는 **각각의 `SubFullPanel`** 에 둔다. 버튼 줄은 상세 `SubFullPanel` 안 `BottomPanel` 이다.

#### L3 목록·상세(좌우)

```
┌ 검색 ───────────────────────────────── [조회][↺] ┐
┌ 목록 ──────────┐ ┌ 상세 ────────────────────────┐
│ Tree | Grid     │ │ Table(폼)                     │
│                 │ └───────────────────────────────┘
│                 │              [신규][저장][삭제]
└─────────────────┘
```

```jsx
<SubFullPanel>
  <FlexPanel style={{ gap: '16px', width: '100%' }}>
    <div style={{ flex: 3, minWidth: 0 }}>
      <ComponentPanel>…제목 + Tree/Grid…</ComponentPanel>
    </div>
    <div style={{ flex: 7, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <ComponentPanel>…제목 + Table…</ComponentPanel>
      <BottomPanel><RelativeGroup><RFloatArea>…신규·저장·삭제…</RFloatArea></RelativeGroup></BottomPanel>
    </div>
  </FlexPanel>
</SubFullPanel>
```

> 좌우 분할만 `div` + `style` 을 허용한다 — 분할 전용 부품이 없다(`SYS0010` 과 같은 값: `gap 16px`).
> `flex` 숫자는 그림의 비율에서 온다.

#### L4 편집 그리드

```
┌ 검색 ───────────────────────────────── [조회][↺] ┐
┌ 제목 ────────────────────────── [행추가][행삭제] ┐
│ Grid (셀 편집)                                   │
└──────────────────────────────────────────────────┘
                                             [저장]
```

행추가·행삭제는 그리드 카드의 제목 줄 오른쪽, 저장은 `BottomPanel`. 저장 규칙은 §5-7.

#### L5 선택 팝업

```
┌ 검색 ───────────────────── [조회] ┐
┌───────────────────────────────────┐
│ Grid                               │
└───────────────────────────────────┘
                       [선택][닫기]
```

```jsx
<FullPanel>
  <SearchPanel>…</SearchPanel>
  <SubFullPanel><Grid … onRowDoubleClicked={this.event.grid.onRowDoubleClicked} /></SubFullPanel>
  <RelativeGroup>
    <RFloatArea>
      <Button {...btnProps.btnSelect} />
      <Button {...btnProps.btnClose} />
    </RFloatArea>
  </RelativeGroup>
</FullPanel>
```

행을 더블클릭하면 선택과 같다. 선택한 행이 없으면 `btnSelect` 를 `disabled` 로 둔다.

**돌려주는 모양** — 새 팝업은 이렇게 한다:

| `param.rowSelection` | [선택] | 더블클릭 | 그리드 |
|---|---|---|---|
| `'single'`(기본) | 행 **객체** 하나 | 행 객체 하나 | |
| `'multiple'` | 행 **배열** | 무시(닫지 않는다) | `infoCheckBox: { use: true }` |

> 옛 공용 팝업은 계약이 다르다 — SYS0040 은 single 이어도 [선택]이 **배열**을 준다. 여는 쪽(`components/User`)이
> 그 모양을 읽으므로 **고치지 않는다.** 옛 팝업의 계약은 그 팝업의 SPEC.md §4 에 적혀 있다.

#### L6 입력 팝업

```
┌───────────────────────────────────┐
│ Table(폼)                          │
└───────────────────────────────────┘
                       [저장][닫기]
```

`FullPanel > SubFullPanel > ComponentPanel > Table` + `BottomPanel` 의 `[저장][닫기]`.

팝업 높이는 **표 줄 수 × 36px + 약 140px**(머리·패널 여백·버튼 줄) 이상으로 연다. 모자라면 버튼 줄이 잘린다 —
비밀번호 변경(COM0020, 3줄)은 250px 에서 [변경] 이 가려졌고 300px 로 올렸다.

#### L7 매핑형 — 주체 목록 + 대상 체크

```
┌ 검색 ───────────────────────────────── [조회][↺] ┐
┌ 주체(권한·사용자) ┐ ┌ 대상(메뉴·프로그램) ──────── ┐
│ Grid              │ │ Grid (체크 열)                │
└───────────────────┘ └───────────────────────────────┘
                                             [저장]
```

왼쪽에서 주체를 고르면 오른쪽에 대상 전체를 읽어 이미 가진 것에 체크한다. [저장]은 **체크가 바뀐 행만** 보낸다.
배치는 L3 의 좌우 분할과 같다. 원형 — `SYS3020`(권한 ↔ 메뉴) · `SYS3050`(권한 ↔ 프로그램) · `SYS3030`(사용자 ↔ 예외, 탭 둘).

> 두 패턴을 한 화면에 나란히 두는 «복합형»(SYS5040 — 그룹 L2 · 코드 L2 · 참조 L4)은 따로 패턴을 두지 않는다.
> 영역마다 위 패턴을 따르고, 각 영역의 버튼은 그 영역의 카드 안에 둔다.

#### 탭이 있을 때

탭은 **상세 영역 안**에 둔다(L2·L3 의 상세 카드). 탭마다 내용은 `TabPanel` 의 자식이다.
`Tabs` 는 활성 탭을 밖에서 정할 수 없다 — `onClick(index)` 로 받아 state 에 적어 두기만 한다.

### 4-4. 검색 영역 배치

```jsx
<SearchPanel>
  <RelativeGroup>
    <LFloatArea style={{ flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 200px 70px 120px 70px 268px', alignItems: 'center' }}>
        <Label value={TEXT.label.userNm} />
        <Textfield {...textFieldProps.iptSrchUserNm} onChange={this.event.input.onChange} onKeyPress={this.event.input.onKeyPress} />
        <Label value={TEXT.label.useYn} />
        <Selectbox {...selectboxProps.selSrchUseYn} onChange={this.event.selectbox.onChange} />
        <Label value={TEXT.label.regDt} />
        <RangeInputCalendar {...rangeCalendarProps.rngSrchRegDt} onChange={this.event.calendar.onRangeChange} />  {/* §5-9 */}
      </div>
    </LFloatArea>
    <RFloatArea>
      <Button {...btnProps.btnSearch} />
      <Button {...btnProps.btnReset} />
    </RFloatArea>
  </RelativeGroup>
</SearchPanel>
```

| 규칙 | 값 |
|---|---|
| 한 줄 | 라벨·칸 **3쌍까지**(6열). 넘으면 같은 `grid` 가 다음 줄로 넘긴다 — 줄을 따로 만들지 않는다 |
| 라벨 열 폭 | 글자 수로 — 2~3자 `60px` · 4~5자 `75px` · 6자 이상 `95px` |
| 칸 열 폭 | 글자칸 `200px` · 선택상자 `120px` · 날짜 `120px` · 기간 `268px` · 사용자/조직 `1fr` |
| 넓은 칸 | 사용자·조직 찾기는 한 칸이 **약 430~490px** 다. 같은 grid 의 다른 줄에서 좁은 열(예: 기간 268px)을 함께 쓰게 되면 옆 칸으로 넘쳐 그려진다 — 그 칸을 `<div style={{ gridColumn: 'span 3' }}>`(라벨 다음 칸부터 두 쌍 폭) 처럼 감싸 여러 열을 차지하게 한다(SYS0040) |
| 한 줄 폭 | **칸 열 합계 + 버튼 약 105px ≤ 약 1265px**(1600px 화면 기준). 넘으면 [조회][↺] 가 다음 줄로 밀린다 — 한 줄 쌍 수를 줄인다. 확인은 1600×900 으로 띄워서 |
| 엔터 | 글자칸에서 엔터 = 조회 (`onKeyPress`) |
| 필수 검색조건 | `<Label value=… req />` (별표가 앞에 붙는다) |
| 버튼 | `[조회][↺]` 만. 다른 버튼을 검색 영역에 두지 않는다 |

### 4-5. 상세(폼) 배치

```jsx
<Table
  id="tblUserDetail"
  colGrp={[{ width: '12%' }, { width: '38%' }, { width: '12%' }, { width: '38%' }]}
  tbData={[
    [
      { type: 'T', value: TEXT.label.userId },
      { type: 'D', value: <Textfield {...textFieldProps.iptUserId} /> },
      { type: 'T', value: TEXT.label.userNm, required: true },
      { type: 'D', value: <Textfield {...textFieldProps.iptUserNm} onChange={this.event.input.onChange} /> },
    ],
    [
      { type: 'T', value: TEXT.label.rmrkCn },
      { type: 'D', value: <Textarea {...textareaProps.txaRmrkCn} onChange={this.event.input.onChange} />, colSpan: 3 },
    ],
  ]}
/>
```

| 규칙 | 값 |
|---|---|
| 열 구성 | 기본 **2쌍(4열)** `12% · 38% · 12% · 38%`. 칸이 12개를 넘으면 3쌍 `10% · 23% · 10% · 23% · 10% · 24%` |
| 순서 | 그림의 순서 그대로, 왼→오, 위→아래 |
| 긴 칸 | `Textarea`·`HtmlEditor`·`FileManager` 는 한 줄을 다 쓴다 — `colSpan` 으로 |
| 필수 | 라벨칸에 `required: true` (별표가 뒤에 붙는다) |
| 키·자동값 | PK·등록자·등록일은 `readOnly` 로 보이기만 한다. 신규일 때 PK 를 입력받으면 SPEC 에 적는다 |
| 선택 전 | 목록에서 행을 고르기 전에는 칸을 비워 둔다 — 지난 행의 값이 남지 않게 `clearDetail()` |

### 4-6. 버튼 배치

| 자리 | 버튼 | 순서 |
|---|---|---|
| 검색 영역 오른쪽 | 조회 · 초기화 | `[조회][↺]` |
| 카드 제목 줄 오른쪽 | 그 카드만의 보조 동작 — 행추가·행삭제·엑셀 | `[행추가][행삭제]` `[엑셀]` |
| 카드 아래 `BottomPanel` 오른쪽 | 그 카드의 주 동작 — 신규·저장·삭제 | `[신규][저장][삭제]` |
| 팝업 아래 오른쪽 | 선택·저장 · 닫기 | `[선택][닫기]` `[저장][닫기]` |

- **파란(주) 버튼은 영역마다 하나다** — 검색 영역은 조회, 버튼 줄은 저장, 선택 팝업은 선택.
- 색·아이콘은 [design-standard.md](design-standard.md) §4 의 표 그대로 쓴다.
- 그림에 없는 버튼을 더하지 않는다. 그림에 있는데 표에 없는 버튼은 **묻는다.**
- 쓸 수 없는 상태는 숨기지 말고 `disabled` 로 둔다(`hidden` 은 자리를 남긴 채 투명해진다).

---

## 5. 코드 표준

### 5-1. 파일 골격 — L2 목록·상세

복사해서 시작한다. `SMP0010`·`sample`·`smpl*` 을 바꾸고, 쓰지 않는 부분은 지운다.
**`dsSearch`·`addConfig`·`bind` 줄·`fiiled` 은 쓰지 않는다** — 옛 화면에 있어도 효과가 없거나 오타다.

```jsx
/**
 * SMP0010 샘플관리
 *
 * 화면기능정의 — ./SPEC.md
 * - 목록 조회 (SMP0010R01)
 * - 저장 (SMP0010U01) · 삭제 (SMP0010D01)
 */

import React from 'react';

// 1. 레이아웃
import {
  FullPanel, SearchPanel, SubFullPanel, ComponentPanel, BottomPanel,
  RelativeGroup, LFloatArea, RFloatArea,
} from 'components';
// 2. 입력·표시
import { Grid, Table, Label, Textfield, Textarea, Selectbox } from 'components';
// 3. 버튼
import { BasicButton as Button } from 'components';
// 4. 공통
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

/**
 * 화면 문구 — «이 한 곳»에만 둔다.
 * 프론트엔드에는 아직 i18n 이 없다. 들어오면 이 맵이 그대로 리소스로 간다.
 * 키는 ASCII, 값은 «표시 전용» — 이 값으로 분기·비교하지 않는다.
 */
const TEXT = {
  title: { list: '샘플 목록', detail: '샘플 상세' },
  label: { smplId: '샘플ID', smplNm: '샘플명', useYn: '사용여부', rmrkCn: '비고' },
  btn: { search: '조회', new: '신규', save: '저장', delete: '삭제' },
  msg: {
    requiredSmplNm: '샘플명은 필수 입력 항목입니다.',
    selectRow: '삭제할 항목을 선택하세요.',
    confirmSave: '저장하시겠습니까?',
    confirmDelete: '삭제하시겠습니까?',
    saved: '저장되었습니다.',
    deleted: '삭제되었습니다.',
  },
};

/** API — SPEC.md §4 와 같아야 한다. */
const API = {
  SMP0010R01: '/api/smp/sample/r01',
  SMP0010U01: '/api/smp/sample/u01',
  SMP0010D01: '/api/smp/sample/d01',
};

const CD_USE_YN = 'USE_YN';

class View extends React.Component {
  constructor(props) {
    super(props);

    this.gridApi = null;

    this.state = {
      dsSmplList: DataLib.datalist.getInstance(),
      selectedRow: null,

      btnProps: {
        btnSearch: { id: 'btnSearch', value: TEXT.btn.search, color: 'blue', size: 'md', filled: true, className: 'icon-srch', onClick: this.event.button.onClick },
        btnReset:  { id: 'btnReset', value: '', color: 'grey', type: 'icon', className: 'icon-reset', onClick: this.event.button.onClick },
        btnNew:    { id: 'btnNew', value: TEXT.btn.new, color: 'grey', size: 'md', className: 'icon-add', onClick: this.event.button.onClick },
        btnSave:   { id: 'btnSave', value: TEXT.btn.save, color: 'blue', size: 'md', filled: true, className: 'icon-act', onClick: this.event.button.onClick },
        btnDelete: { id: 'btnDelete', value: TEXT.btn.delete, color: 'grey', size: 'md', className: 'icon-del', onClick: this.event.button.onClick },
      },
      textFieldProps: {
        iptSrchSmplNm: { id: 'iptSrchSmplNm', value: '', maxLength: 100 },
        iptSmplId:     { id: 'iptSmplId', value: '', readOnly: true },
        iptSmplNm:     { id: 'iptSmplNm', value: '', maxLength: 100 },
      },
      textareaProps: {
        txaRmrkCn: { id: 'txaRmrkCn', value: '', rows: 3, maxLength: 1000 },
      },
      selectboxProps: {
        selSrchUseYn: { id: 'selSrchUseYn', value: '', dataset: ComLib.convComboList(ComLib.getCommCodeList(CD_USE_YN), newScrmObj.constants.select.argument.all) },
        selUseYn:     { id: 'selUseYn', value: 'Y', dataset: ComLib.convComboList(ComLib.getCommCodeList(CD_USE_YN), newScrmObj.constants.select.argument.none) },
      },
      grdProps: {
        grdSmplList: {
          id: 'grdSmplList',
          height: 'calc(100vh - 560px)',
          rowSelection: 'single',
          rowNum: true,
          header: [
            { headerName: TEXT.label.smplId, field: 'smplId', colId: 'smplId', width: 120, textAlign: 'center' },
            { headerName: TEXT.label.smplNm, field: 'smplNm', colId: 'smplNm', width: 240 },
            { headerName: TEXT.label.useYn, field: 'useYn', colId: 'useYn', width: 100, textAlign: 'center',
              valueFormatter: (p) => ComLib.getComCodeName(CD_USE_YN, p.value) },
          ],
        },
      },
    };
  }

  /*------------------------------------------------------------ 생명주기 */
  componentDidMount() {
    this.search();
  }

  /*------------------------------------------------------------ 검증 · 통신 · 결과 */
  validation = (transId) => {
    const { textFieldProps } = this.state;
    switch (transId) {
      case 'SMP0010U01':
        if (StrLib.isNull(textFieldProps.iptSmplNm.value)) {
          ComLib.openAlertDialog(TEXT.msg.requiredSmplNm, () => this.focus('iptSmplNm'));
          return false;
        }
        break;
      case 'SMP0010D01':
        if (!this.state.selectedRow) {
          ComLib.openAlertDialog(TEXT.msg.selectRow);
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  transaction = (transId) => {
    const { textFieldProps, textareaProps, selectboxProps } = this.state;
    const tm = new TransManager();
    tm.setTransId(transId);
    tm.setTransUrl(API[transId]);
    tm.setCallBack(this.callback);

    switch (transId) {
      case 'SMP0010R01':
        tm.setFormData({
          smplNm: textFieldProps.iptSrchSmplNm.value,
          useYn: selectboxProps.selSrchUseYn.value,
        });
        break;
      case 'SMP0010U01':
        tm.setFormData({
          rowtype: StrLib.isNull(textFieldProps.iptSmplId.value) ? 'c' : 'u',
          smplId: textFieldProps.iptSmplId.value,
          smplNm: textFieldProps.iptSmplNm.value,
          useYn: selectboxProps.selUseYn.value,
          rmrkCn: textareaProps.txaRmrkCn.value,
        });
        break;
      case 'SMP0010D01':
        tm.setFormData({ smplId: this.state.selectedRow.smplId });
        break;
      default:
        return;
    }
    tm.agent();
  };

  callback = (res) => {
    if (!ComLib.handleResponse(res)) return;   // 실패면 서버 메시지를 이미 띄웠다

    switch (res.id) {
      case 'SMP0010R01':
        ComLib.setStateRecords(this, 'dsSmplList', res.data);
        this.clearDetail();
        break;
      case 'SMP0010U01':
        ComLib.openAlertDialog(TEXT.msg.saved, () => this.search());
        break;
      case 'SMP0010D01':
        ComLib.openAlertDialog(TEXT.msg.deleted, () => this.search());
        break;
      default:
        break;
    }
  };

  /*------------------------------------------------------------ 보조 */
  search = () => {
    if (this.validation('SMP0010R01')) this.transaction('SMP0010R01');
  };

  /** 묶음 안 여러 칸의 `value` 를 한 번에 — setValues('textFieldProps', { iptA: 'x', iptB: '' }) */
  setValues = (group, values) => {
    this.setState((s) => {
      const next = { ...s[group] };
      Object.keys(values).forEach((id) => { next[id] = { ...next[id], value: values[id] }; });
      return { [group]: next };
    });
  };

  /** 칸 하나의 여러 속성을 — 기간·사용자/조직 찾기·체크박스처럼 값이 `value` 가 아닌 부품에 (§5-9) */
  patchProps = (group, id, patch) => {
    this.setState((s) => ({ [group]: { ...s[group], [id]: { ...s[group][id], ...patch } } }));
  };

  fillDetail = (row) => {
    this.setState({ selectedRow: row });
    this.setValues('textFieldProps', { iptSmplId: row.smplId || '', iptSmplNm: row.smplNm || '' });
    this.setValues('selectboxProps', { selUseYn: row.useYn || 'Y' });
    this.setValues('textareaProps', { txaRmrkCn: row.rmrkCn || '' });
  };

  clearDetail = () => {
    this.setState({ selectedRow: null });
    this.setValues('textFieldProps', { iptSmplId: '', iptSmplNm: '' });
    this.setValues('selectboxProps', { selUseYn: 'Y' });
    this.setValues('textareaProps', { txaRmrkCn: '' });
    if (this.gridApi) this.gridApi.deselectAll();
  };

  /** 같은 id 가 숨은 탭·겹친 팝업에도 있을 수 있다 — 보이는 것 중 첫째에 포커스(getElementById 는 숨은 것을 줄 수 있다) */
  focus = (id) => {
    const el = Array.from(document.querySelectorAll(`[id="${id}"]`)).find((x) => x.offsetParent !== null);
    if (el) el.focus();
  };

  /*------------------------------------------------------------ 이벤트 */
  event = {
    button: {
      onClick: (e) => {
        switch (e.target.id) {
          case 'btnSearch':
            this.search();
            break;
          case 'btnReset':
            this.setValues('textFieldProps', { iptSrchSmplNm: '' });
            this.setValues('selectboxProps', { selSrchUseYn: '' });
            break;
          case 'btnNew':
            this.clearDetail();
            break;
          case 'btnSave':
            if (!this.validation('SMP0010U01')) return;
            ComLib.openConfirmDialog(TEXT.msg.confirmSave, (ok) => { if (ok) this.transaction('SMP0010U01'); });
            break;
          case 'btnDelete':
            if (!this.validation('SMP0010D01')) return;
            ComLib.openConfirmDialog(TEXT.msg.confirmDelete, (ok) => { if (ok) this.transaction('SMP0010D01'); });
            break;
          default:
            break;
        }
      },
    },
    input: {
      onChange: (e) => {
        const { id, value } = e.target;
        this.setValues(id.startsWith('txa') ? 'textareaProps' : 'textFieldProps', { [id]: value });
      },
      onKeyPress: (e) => {
        if (e.key === 'Enter') this.search();
      },
    },
    selectbox: {
      onChange: (e) => this.setValues('selectboxProps', { [e.target.id]: e.target.value }),
    },
    grid: {
      onGridReady: (e) => { this.gridApi = e.api; },
      onRowClicked: (e) => this.fillDetail(e.data),
    },
  };

  /*------------------------------------------------------------ 화면 */
  render() {
    const { btnProps, textFieldProps, textareaProps, selectboxProps, grdProps, dsSmplList } = this.state;

    return (
      <FullPanel>
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{ flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 200px 75px 120px', alignItems: 'center' }}>
                <Label value={TEXT.label.smplNm} />
                <Textfield {...textFieldProps.iptSrchSmplNm} onChange={this.event.input.onChange} onKeyPress={this.event.input.onKeyPress} />
                <Label value={TEXT.label.useYn} />
                <Selectbox {...selectboxProps.selSrchUseYn} onChange={this.event.selectbox.onChange} />
              </div>
            </LFloatArea>
            <RFloatArea>
              <Button {...btnProps.btnSearch} />
              <Button {...btnProps.btnReset} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>

        <SubFullPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea><h3>{TEXT.title.list}</h3></LFloatArea>
            </RelativeGroup>
            <Grid
              {...grdProps.grdSmplList}
              data={dsSmplList}
              onGridReady={this.event.grid.onGridReady}
              onRowClicked={this.event.grid.onRowClicked}
            />
          </ComponentPanel>
        </SubFullPanel>

        <SubFullPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea><h3>{TEXT.title.detail}</h3></LFloatArea>
            </RelativeGroup>
            <Table
              id="tblSmplDetail"
              colGrp={[{ width: '12%' }, { width: '38%' }, { width: '12%' }, { width: '38%' }]}
              tbData={[
                [
                  { type: 'T', value: TEXT.label.smplId },
                  { type: 'D', value: <Textfield {...textFieldProps.iptSmplId} /> },
                  { type: 'T', value: TEXT.label.smplNm, required: true },
                  { type: 'D', value: <Textfield {...textFieldProps.iptSmplNm} onChange={this.event.input.onChange} /> },
                ],
                [
                  { type: 'T', value: TEXT.label.useYn, required: true },
                  { type: 'D', value: <Selectbox {...selectboxProps.selUseYn} onChange={this.event.selectbox.onChange} />, colSpan: 3 },
                ],
                [
                  { type: 'T', value: TEXT.label.rmrkCn },
                  { type: 'D', value: <Textarea {...textareaProps.txaRmrkCn} onChange={this.event.input.onChange} />, colSpan: 3 },
                ],
              ]}
            />
          </ComponentPanel>
          <BottomPanel>
            <RelativeGroup>
              <RFloatArea>
                <Button {...btnProps.btnNew} />
                <Button {...btnProps.btnSave} />
                <Button {...btnProps.btnDelete} />
              </RFloatArea>
            </RelativeGroup>
          </BottomPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;
```

**골격에서 지키는 것**

| | 규칙 | 왜 |
|---|---|---|
| 1 | 클래스 컴포넌트 `View`, 화살표 필드 메서드 | 모든 화면이 그렇다. 훅으로 짜면 옆 화면과 읽는 법이 달라진다 |
| 2 | `bind` 줄을 쓰지 않는다 | 화살표 필드는 이미 `this` 가 묶여 있다. 옛 화면의 `bind` 는 아무 일도 안 한다 |
| 3 | 부품의 `onClick` 은 `btnProps` 안에 둔다 | JSX 와 props 두 곳에 나눠 두다가 **둘 다 빠진 버튼**이 생겼다(`SYS5010` 조회) |
| 4 | state 는 `setState` 로만 바꾼다 | 옛 화면의 `this.state.ds.setRecords(); this.setState({...this.state})` 는 쓰지 않는다. **예외 하나** — 편집 그리드의 셀 편집은 데이터셋 행을 제자리에서 고친다(§5-7, 다시 그리면 Tab 입력을 잃는다) |
| 5 | 그리드 API 는 `e.api` | ag-Grid 32 에서 `columnApi` 는 없어졌다 |

### 5-2. 서버 통신

```js
const tm = new TransManager();
tm.setTransId(transId);          // 콜백의 res.id 가 이 값이다
tm.setTransUrl(API[transId]);
tm.setCallBack(this.callback);
tm.setFormData({ … });           // 요청 본문(JSON). 이것이 «전부»다
tm.agent();                      // POST
```

- **`addConfig({ datasetsend, datasetrecv })` 는 쓰지 않는다.** `setFormData` 가 덮어써서 서버에도 콜백에도 닿지 않는다 — 옛 화면 전부가 쓰고 있지만 효과가 없다.
- 요청 본문은 **API 의 DTO 필드명 그대로**(camelCase). 빈 검색조건은 `''` 로 보낸다.
- 페이징(무한 스크롤)은 `SYS6010` 의 방식 하나만 쓴다 — 데이터셋 `getInstance({ paging: { size: 100 } })` ·
  조회 전 `ds.resetPage()` · 보낼 때 `tm.setPaging(ds.getPaging())` · 그리드 `infinite: true` +
  `onScrollEnd` 에서 `if (!ds.isLastPage()) { ds.nextPage(); 다시 조회 }` · `totalRowCnt={ds.getTotalRowCnt()}`.
- **API 가 아직 없을 때**(SPEC §4 「API 상태 = 미구현」) — 코드는 위와 같이 다 쓰되,
  `componentDidMount` 의 자동 조회만 **빼 둔다.** 화면을 여는 순간 오류창이 뜨면 퍼블리싱을 검토할 수 없다.
  API 가 생기면 넣고 SPEC 을 `구현` 으로 고친다.
- `service/mockdata/` 는 원본 프로젝트의 상담 화면 전용 잔재다 — **쓰지 않는다.**
- **GET 인 옛 API**(`/api/sup/bookmark/r01`·`/api/sup/memo/r03` 등 `@GetMapping`)는 `tm.httpMethod = 'get'` 을 두고 보낸다 —
  TransManager 에 정하는 함수가 없다(COM2070). 새 API 는 POST 로 짓는다.
- 통신이 없는 화면(COM0030 환경설정처럼 브라우저 저장소만 읽고 쓰는 것)은 `validation`·`transaction`·`callback` 을 두지 않는다.

### 5-3. 응답 처리

```js
callback = (res) => {
  if (!ComLib.handleResponse(res)) return;
  switch (res.id) { … }
};
```

| 무엇이 오나 | 값 |
|---|---|
| 성공 | `{ id: 트랜잭션ID, data: 서버 본문 그대로, result: 'success' }` — 목록이면 배열, 페이징이면 `{ content, totalElements, … }` |
| 실패 | `{ id, data: { message, … }, status: 'invalid' \| 'error' }` — `result` 가 **없다** |

- 성공 판정은 **`ComLib.handleResponse(res)` 하나로** 한다. 실패면 서버 메시지를 띄우고 `false` 를 준다.
  (공통 처리기는 400·404 를 화면에 넘기기만 하고 알리지 않는다 — 판정을 빼먹으면 **아무 말 없이** 실패한다)
- 목록 결과는 `ComLib.setStateRecords(this, 'dsXxxList', res.data)` — 배열·페이지 둘 다 받는다.
- 401·403·세션 만료는 공통이 처리하고 콜백을 부르지 않는다. 화면이 따로 다루지 않는다.

### 5-4. 문구 · 알림

- **보이는 글자는 전부 `TEXT` 에서 꺼낸다** — 라벨, 그리드 머리글, 버튼, 제목, placeholder, 알림.
  `render()` 와 `header` 에 한글 리터럴이 있으면 표준 위반이다.
- 알림은 `ComLib.openAlertDialog(문구, 닫은뒤콜백)`, 확인은 `ComLib.openConfirmDialog(문구, (ok) => …)`.
  옛 화면의 `ComLib.openDialog('A', 'SYSI0010', [문구])` 와 같은 일을 한다 — `'SYSI0010'` 은 **아무도 읽지 않는 값**이다.
- 코드값의 이름(사용/미사용 …)은 `TEXT` 에 두지 않는다 — **공통코드에서** 가져온다(§5-6). 서버가 언어별로 준다.
- 표준 문구 — 같은 일에 다른 말을 쓰지 않는다:

| 상황 | 문구 |
|---|---|
| 필수 미입력 | `{항목}은(는) 필수 입력 항목입니다.` |
| 선택 필요 | `{대상}을(를) 선택하세요.` |
| 저장 확인 / 완료 | `저장하시겠습니까?` / `저장되었습니다.` |
| 삭제 확인 / 완료 | `삭제하시겠습니까?` / `삭제되었습니다.` |
| 바뀐 것 없음 | `변경된 내용이 없습니다.` |
| 조회 결과 없음 | 알리지 않는다 — 그리드가 스스로 보인다 |

문구 안에 값을 넣을 때는 **이름 붙은 자리** `{필드명}` 을 쓴다 — `'메뉴ID \'{menuId}\'가 중복됩니다.'` →
`TEXT.msg.duplicateMenuId.replace('{menuId}', v)`. 번호 자리(`{0}`)나 문자열 이어 붙이기를 쓰지 않는다 —
언어마다 어순이 달라 리소스로 옮길 때 이름이 있어야 한다.

### 5-5. 검증

- `validation(transId)` 안에서 트랜잭션별로 한다. **첫 위반 하나만** 알리고 `false` — 알림을 닫으면 그 칸에 포커스.
- 필수·길이·형식·기간(시작 ≤ 끝)·선택 여부를 본다. 서버가 다시 검증하더라도 화면에서 먼저 막는다.
- `Textfield type="onlyNum"` 은 **보이는 값만** 거른다. `onChange` 는 거르지 않은 값을 받으므로 검증에서 다시 본다.
- 날짜 비교는 `YYYYMMDD` 문자열끼리. 기간 제한은 `DateLib.getDiffDate(시작, 끝)`.

### 5-6. 공통코드

```js
// 선택상자 — 맨 앞에 「전체」(검색) 또는 「선택」(입력)
dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.all)
// 그리드 — 코드값을 이름으로
valueFormatter: (p) => ComLib.getComCodeName('USE_YN', p.value)
```

- 공통코드는 로그인 때 받아 둔 것이다. 화면에서 다시 조회하지 않는다.
- 「전체」의 값은 **`''`** 다(`convComboList` 가 넣는 값). `'ALL'` 을 새로 만들지 않는다.
- **그룹 코드는 SPEC §3 에 적는다.** 없는 그룹이면 「확인 필요」 — 코드 목록을 화면에 박아 넣지 않는다.

### 5-7. 편집 그리드 (L4)

행 상태는 **소문자** `rowtype` — `'r'` 조회 · `'c'` 추가 · `'u'` 수정 · `'d'` 삭제. 옛 화면의 대문자 `'C'`/`'U'` 를 따라 쓰지 않는다.

**그리드는 데이터셋을 대신 고쳐 주지 않는다.** 셀을 고치면 그리드 «자기 사본»만 바뀐다 — 화면이 `onCellValueChanged` 에서
데이터셋에 옮기지 않으면 `getTransRecords` 가 빈 배열을 준다. 그리고 그리드는 **records 배열이 새것일 때만** 다시 그린다.
그래서 아래 세 가지를 이 모양 그대로 쓴다(본보기: `containers/sys/SYS0080`):

```js
constructor(props) {
  …
  this.newRowSeq = 0;   // 새 행의 recid — 서버가 주는 recid(UUID)와 겹치지 않게 'new1', 'new2' …
}

/** [행추가] — 맨 위에 빈 행. recid 는 화면이 매긴다(ds.addRow 는 recid 를 비워 둬 새 행끼리 구별이 안 된다) */
addRow = () => {
  this.newRowSeq += 1;
  const records = this.state.dsXxxList.getRecords();   // 복사본이 온다
  records.unshift({ ...기본값, rowtype: 'c', recid: `new${this.newRowSeq}` });
  ComLib.setStateRecords(this, 'dsXxxList', records);
};

/** [행삭제] — 저장 안 한 새 행은 바로 빼고, 저장된 행은 'd' 로 둔다(그리드가 'd' 행을 감춘다). [저장] 때 지운다 */
deleteRow = () => {
  const ids = this.gridApi.getSelectedRows().map((r) => r.recid);
  const records = this.state.dsXxxList.getRecords()
    .filter((r) => !(ids.includes(r.recid) && r.rowtype === 'c'))
    .map((r) => (ids.includes(r.recid) ? { ...r, rowtype: 'd' } : r));
  ComLib.setStateRecords(this, 'dsXxxList', records);
};

grid: {
  /**
   * 셀을 고치면 데이터셋의 그 행에 «제자리에서» 적는다 — 행은 recid 로 찾는다('d' 행·정렬 때문에 화면 순번과 다르다).
   * ⚠ 새 배열로 갈아 넣지 않는다(setStateRecords) — 그리드가 다시 그려져 Tab 으로 옮겨 간 다음 칸의 입력이 사라진다(SYS1010 실측).
   *   그리드는 고친 값을 이미 보이고 있으므로 다시 그릴 필요도 없다.
   */
  onCellValueChanged: (e) => {
    const rec = this.state.dsXxxList.records.find((r) => r.recid === e.node.data.recid);
    if (!rec) return;
    rec[e.col] = e.newValue;
    if (rec.rowtype !== 'c' && rec.rowtype !== 'd') rec.rowtype = 'u';   // 조회 행은 u 로만 오른다 — 'r' 이 아니라 null 로 오는 DTO 도 있다
  },
},
```

- 상태는 **`r → u` 로만 오른다** — 고쳤다가 원래 값으로 되돌려도 `u` 로 남는다(한 번 더 저장될 뿐 잃는 것이 없다).
  조건을 `=== 'r'` 로 쓰지 않는다 — 데이터셋은 `rowtype` 속성이 **없을 때만** `'r'` 을 넣는데, 메뉴 DTO 처럼
  `rowtype: null` 을 실어 보내는 API 가 있다(SYS1010 에서 수정이 저장되지 않아 드러났다). `'c'`·`'d'` 가 아니면 `'u'` 로 올린다.
  `ds.setValue`/`ComLib.setStateValue` 의 «원본과 견주어 r 로 되돌리기»는 쓰지 않는다 — 행추가·삭제로 records 를 다시 넣으면
  견줄 원본(`orgrecords`)이 그 순간의 값으로 덮여, 다른 열의 수정까지 `r` 로 잃을 수 있다.
- 셀 편집은 다시 그리지 않고(제자리), **행추가·행삭제만** 새 배열로 넣어 다시 그린다.
- ⚠ **무한 스크롤로 이어 붙인 쪽(2쪽부터)의 행에는 `recid`·`rowtype` 이 없다** — `DataLib.appendRecords` 가
  초기화를 하지 않는다. 그래서 무한 스크롤 편집 그리드(SYS5030)는 `rowtype` 대신 **업무 키로 고친 행을 모은다**
  (`Map` — 키 `saleDay|ognzCd`). 그 화면의 SPEC §8 에 이유를 적는다.
- 저장할 행은 `ds.getTransRecords(newScrmObj.constants.rowtype.CREATE_OR_UPDATE)`, 지울 행은 `…rowtype.DESTROY`.
  보낼 것이 없으면 `변경된 내용이 없습니다.` 요청 본문은 **DTO 필드만** 골라 보낸다(`recid`·`orgdata` 같은 화면용 값을 싣지 않는다).
- 지우기와 저장이 함께 있으면 **D01 을 먼저**, 성공하면 U01 — 같은 키를 지우고 다시 넣는 경우가 된다. 확인창은 한 번만.
- 키 열은 새 행에서만 고치게 한다 — `editable: (p) => p.data.rowtype === 'c'`. 저장된 행의 키를 고치면 서버(upsert)가 새 행을 만들고 옛 행이 남는다.
- 행추가·행삭제 **버튼은 직접 둔다**(§4-6). 그리드의 `addRowBtn`·`delRowBtn` 은 화면에 나타나지 않는다.
- 셀 안 선택상자는 `cellEditor: 'agSelectCellEditor'` + `cellEditorParams: { values: ComLib.getComCodeValue('그룹') }`.
  `'checkbox'`·`'selectbox'` 같은 문자열 렌더러는 ag-Grid 32 에서 **등록되지 않는다.**
- 필수 열은 머리글에 `req: true`. 검증에서 빈 셀을 찾으면 `gridApi.setFocusedCell(행, 열)`.

### 5-8. 팝업

**여는 쪽**

```js
ComLib.openPop('SMP0090', TEXT.title.findPopup,
  { modaless: false, width: 800, height: 600, param: { keyword } },   // 크기는 «숫자» — '800px' 은 무시된다
  (data) => { if (data) this.setValues('textFieldProps', { iptMngrNm: data.userNm }); });
```

**팝업 쪽**

```js
constructor(props) {
  super(props);
  this.param = (props.options && props.options.param) || {};   // 여는 쪽이 준 값
  …
}
// 선택
this.props.onCallbackFunc(row);
this.props.onClose();
```

- `modaless: false` 를 **반드시** 준다 — 빼면 모달이 아니게 열린다(기본값이 `true`).
- 돌려줄 때는 `onCallbackFunc` 하나만 쓴다. `options` 에 함수를 실어 보내지 않는다.
  옛 계약은 지킨다 — SYS1020 은 COM2070 이 `options.onMenuSelect` 를 싣고 열므로, 그것이 함수면 부르고 `onCallbackFunc` 도 함께 부른다.
- 크기는 메뉴의 `scrn_size`('800,600') 또는 `openPop` 의 `width`·`height`(**숫자**). `openPop` 은 `isNaN` 으로 걸러
  `'800px'` 같은 문자열을 버리고 `scrn_size` 를 쓴다. L5 기본 `800×600`.
- **확인창 콜백 안에서 곧바로 알림을 열지 않는다** — 닫히는 확인창을 그 자리에서 unmount 하며 React 경고
  (`Attempted to synchronously unmount a root while React was already rendering`)가 난다. 알림이 필요하면
  서버 응답 뒤(`callback`)에 열거나, 묻지 않아도 되는 경우(새 행만 지울 때 등)는 확인창을 띄우지 않는다.

### 5-9. 부품별 값과 `onChange`

부품마다 **값을 담는 속성**과 **`onChange` 가 넘기는 모양**이 다르다. 골격의 `setValues(묶음, { id: 값 })` 로 받는다.

| 부품 | 값 속성 | `onChange` 가 넘기는 것 | 받는 법 |
|---|---|---|---|
| `Textfield` · `Textarea` · `TextPasswdfield` | `value` | DOM 이벤트 `e` | `setValues(묶음, { [e.target.id]: e.target.value })` |
| `Selectbox` · `ComboList` · `ToggleButtonGroup` | `value` | `{ target: { id, value }, id }` | `setValues('selectboxProps', { [e.target.id]: e.target.value })` |
| `InputCalendar` · `NumberStepper` | `value` | `{ target: { id, value } }` | `setValues(묶음, { [e.target.id]: e.target.value })` — 날짜는 `'YYYYMMDD'` |
| `RangeInputCalendar` | `startDate` · `endDate` | `{ target: { id }, startDate, endDate }` | 아래 |
| `Checkbox` | `checked` (`'Y'`/`'N'`) | `{ id, checked }` — ⚠ `e.target.id` 는 `chk_…` 로 **바뀐** id | `e.id` 로, `checked ? 'Y' : 'N'` |
| `Radio` | `selected` | `{ id, value }` | `e.id` · `e.value` |
| `Switch` | `checked` (boolean) | DOM 이벤트 | `e.target.checked` |
| `UserSelect` | `userId` · `userNm` · `keyword` | `{ userId, userNm }` — **id 가 없다** | 칸마다 핸들러를 따로 |
| `OgnzSelect` | `ognzCd` · `ognzNm` · `keyword` | `{ ognzCd, ognzNm }` — **id 가 없다** | 칸마다 핸들러를 따로 |

```js
calendar: {
  onRangeChange: (e) => this.patchProps('rangeCalendarProps', e.target.id, { startDate: e.startDate, endDate: e.endDate }),
},
checkbox: {
  onChange: (e) => this.patchProps('checkboxProps', e.id, { checked: e.checked ? 'Y' : 'N' }),
},
ognzSelect: {   // id 가 오지 않으므로 칸마다 하나 — 이름은 onChange{Srch|대상}
  onChangeSrch: (d) => this.patchProps('ognzSelectProps', 'ognzSrchOgnzCd', {
    ognzCd: d.ognzCd || '', ognzNm: d.ognzNm || '', keyword: d.ognzCd || d.ognzNm || '',
  }),
},
userSelect: {
  onChangeSrch: (d) => this.patchProps('userSelectProps', 'usrSrchUserId', {
    userId: d.userId || '', userNm: d.userNm || '', keyword: d.userId || d.userNm || '',
  }),
},
```

> 본보기 — `containers/sys/SYS6010`(기간·조직·사용자 검색 + 무한 스크롤 + CSV) 이 이 표의 부품들을 표준대로 쓴다.

> `Checkbox` 는 한 번 누르면 `onClick` 과 `onChange` 를 **둘 다** 부른다. 하나(`onChange`)에만 단다.

---

## 6. 메뉴 · 권한 등록

새 화면은 **폴더 하나 + 메뉴 한 행**이다. 라우트 파일을 고치지 않는다(딸린 팝업만 `SPECIAL_POPUPS`).

```sql
-- db/sql/V{다음 번호}__menu_SMP0010.sql
-- 대분류·중분류 폴더가 아직 없을 때만 (npag_yn 'X' = 폴더)
INSERT INTO cmpt_menu (menu_id, menu_nm, url_addr, npag_yn, up_menu_id, sort_sn, scrn_size, menu_use_yn) VALUES
  ('SMP',  '샘플',     NULL, 'X', NULL,  2, NULL, 'Y'),
  ('SMP0', '샘플관리', NULL, 'X', 'SMP', 0, NULL, 'Y');

-- 화면 (npag_yn 'M' = 본문 탭, 'Y' = 팝업 / menu_use_yn 'H' = 트리에 숨김)
INSERT INTO cmpt_menu (menu_id, menu_nm, url_addr, npag_yn, up_menu_id, sort_sn, scrn_size, menu_use_yn) VALUES
  ('SMP0010', '샘플관리', '/smp/SMP0010', 'M', 'SMP0', 0, NULL, 'Y');

-- 메뉴 권한 — 폴더도 넣는다. 부모가 없으면 자식이 트리에 나오지 않는다
INSERT INTO cmpt_menu_authrt (authrt_cd, menu_id) VALUES
  ('SYSADM', 'SMP'), ('SYSADM', 'SMP0'), ('SYSADM', 'SMP0010');
```

- 번호는 `npm run db:status` 로 본 마지막 번호 + 1. **적용된 파일은 고치지 않는다** — 정정은 새 번호로.
- 두 사람이 같은 번호를 쓰면 적용기가 멈춘다. MR 전에 `dev` 를 merge 하고 `npm run db:status` 로 확인한다.
- **화면을 숨기는 것은 인가가 아니다.** 화면이 부르는 API 는 프로그램관리(SYS3040)·프로그램권한관리(SYS3050)
  에도 등록한다 — SPEC §7 에 URI 목록을 적어 둔다. 로컬은 `API_AUTH_POLICY=AUDIT` 라 빠져도 열리지만,
  운영(`ENFORCE`)에서는 막힌다.
- 메뉴명(`menu_nm`)은 표시값이라 한글이어도 된다. `menu_id`·`url_addr` 는 ASCII.

---

## 7. 하지 말 것

| 하지 않는다 | 대신 |
|---|---|
| 라우트 파일에 화면을 더한다 | 폴더 + 메뉴 한 행(§6) |
| `components/` 의 부품을 고친다 | 화면에서 쓰는 법을 바꾸거나 **묻는다**. 부품은 모든 화면이 함께 쓴다 |
| `'components/Input'` 처럼 부품 폴더에서 직접 가져온다 | `from 'components'` 하나로 |
| 화면 전용 CSS 파일을 만든다 | 패널·부품만으로 짠다. 꼭 필요하면 묻는다(옛 `SYS0030` 의 CSS 는 전역으로 새어 다른 화면을 바꿨다) |
| 색 hex·글꼴·`px` 여백을 `style` 에 쓴다 | [design-standard.md](design-standard.md) |
| 한글로 분기·비교한다 (`if (x === '사용')`) | 코드값으로 (`if (x === 'Y')`) |
| 문구를 `render()` 에 리터럴로 쓴다 | `TEXT` |
| 없는 API·코드그룹·필드를 지어낸다 | SPEC §8 「확인 필요」에 적고 묻는다 |
| 그림의 색·크기를 베낀다 | 표준 토큰·부품 크기 |
| `package.json` 에 의존성을 더한다 | 묻는다 |
| 다른 프로젝트의 업로드 부품을 옮겨 온다 | `FileManager` — 옛 `InputFileUpload` 는 파일을 **외부 사이트(httpbin.org)로 보내도록** 짜여 있어 걷었다 |
| `console.log` 를 남긴다 | 지우고 낸다 |

---

## 8. 끝났다고 말하기 전에

**빌드가 되는 것은 「깨지지 않았다」이지 「보인다」가 아니다.**

```bash
cd frontend && yarn build        # 컴파일 오류
cd frontend && yarn dev          # :18031 — 띄워서 본다
```

- [ ] `SPEC.md` 가 있고, §8 「확인 필요」가 비었거나 개발자가 답했다
- [ ] 그림과 나란히 놓고 **영역 순서·칸 순서·버튼 위치**가 같다
- [ ] 바꾼 칸 하나가 아니라 **화면 전체**를 봤다 — 페이지에 세로 스크롤이 생기지 않는다(그리드 `height` 로 맞춘다)
- [ ] 조회 → 행 선택 → 상세 표시 → 신규 → 저장 → 삭제를 **눌러 봤다** (API 가 없으면 버튼이 오류창을 띄우는 데까지)
- [ ] 필수 칸을 비우고 저장해 알림·포커스를 봤다
- [ ] `render()`·`header` 에 한글 리터럴이 없다 (`TEXT` 로)
- [ ] 브라우저 콘솔에 빨간 오류가 없다
- [ ] 메뉴 SQL 을 적용해 트리에서 열어 봤다
- [ ] 지금 화면을 찍어 `screen.png` 로 두고 SPEC §0 에 걸었다 — 배치를 바꿨으면 다시 찍었다
- [ ] 띄울 수 없었다면 — **그렇다고 말하고** 개발자에게 확인을 요청했다
