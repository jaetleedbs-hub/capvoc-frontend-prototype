# 디자인 표준

> **읽는 이** — 화면을 만드는 AI·개발자.
> 여기 적은 값은 **지금 화면에 실제로 그려지는 값**이다(빌드된 CSS 와 대조했다).
> 「이렇게 되면 좋겠다」가 아니라 「이렇게 되어 있다」이다.

## 0. 원칙 — 정하지 말고 찾아 쓴다

1. **화면은 부품과 패널만으로 짠다.** 색·글꼴·간격·둥근 모서리·그림자는 부품이 이미 갖고 있다.
   화면 코드에서 이것들을 다시 정하지 않는다.
2. **PPTX 그림의 색과 크기를 베끼지 않는다.** 그림은 배치와 내용을 정하고, 모양은 이 문서가 정한다.
   그림이 「빨간 저장 버튼」이어도 저장은 파란 버튼이다(§4).
3. **새 CSS 파일을 만들지 않는다.** 화면 CSS 는 화면을 닫아도 남아 **다른 화면까지** 바꾼다
   (옛 `SYS0030/UserManagement.css` 의 전역 `table{width:100%}` 가 실제로 그랬다).
4. 꼭 `style` 을 써야 하면 **토큰(`var(--cw-*)`)만** 쓴다. hex·rgb 를 쓰지 않는다.
5. 한 화면에 두 규칙이 섞이면 사용자는 그것을 «다른 뜻»으로 읽는다 — 버튼 모양이 다르면 다른 일을 한다고 여긴다.

## 1. 색

### 1-1. 포인트 색은 «사용자의 것»이다

포인트 색 기본값은 `#007acc` 지만 **사용자가 환경설정(COM0030)에서 바꾼다**(브라우저에 저장).
그래서 포인트 색을 코드에 박으면 그 사용자에게만 틀린 화면이 된다.

| 쓰는 곳 | 쓰는 법 |
|---|---|
| 주 버튼 | `color: 'blue'` 버튼 — 포인트 색을 따라가는 **유일한** 버튼 색이다 |
| 그 밖에 포인트 색이 필요할 때 | `var(--cw-point)` · 옅은 바탕 `var(--cw-point-light)` |

### 1-2. 토큰

`frontend/src/assets/styles/tokens.css` 가 원본이다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--cw-point` / `--cw-point-hover` / `--cw-point-light` | `#007acc` / `#006aad` / `#e6f2fa` | 주 동작·선택 (사용자가 바꾼다) |
| `--cw-bg` | `#f1f4f9` | 화면 바탕 |
| `--cw-card-bg` | `#fff` | 카드(패널) |
| `--cw-text` | `#1e293b` | 본문 글자 |
| `--cw-text-secondary` | `#64748b` | 보조 글자·그리드 머리글 |
| `--cw-border` | `#e2e8f0` | 테두리·구분선 |
| `--cw-success` / `-light` | `#16a34a` / `#f0fdf4` | 성공·정상 |
| `--cw-warning` / `-light` | `#d97706` / `#fffbeb` | 주의 |
| `--cw-danger` / `-light` | `#dc2626` / `#fef2f2` | 오류·위험 |
| `--cw-info` / `-light` | `#2563eb` / `#eff6ff` | 안내 |

### 1-3. 상태를 색으로만 말하지 않는다

상태는 **글자(공통코드 이름)** 로 보이고, 색은 거들기만 한다. 색을 쓸 때는 위 의미 토큰만 쓴다.

```js
// 그리드 — 상태 글자에 색을 더할 때
{ headerName: TEXT.label.sttsCd, field: 'sttsCd', colId: 'sttsCd', width: 100, textAlign: 'center',
  valueFormatter: (p) => ComLib.getComCodeName('STTS_CD', p.value),
  cellStyle: (p) => (p.value === 'FAIL' ? { color: 'var(--cw-danger)' } : null) }   // 판정은 코드값으로
```

### 1-4. 쓰지 않는 것

| 쓰지 않는다 | 이유 |
|---|---|
| `src/assets/styles/modern-design.css` 의 값(`#2563EB`·Pretendard …) | **어디서도 불러오지 않는 죽은 파일**이다. 옛 문서가 「적용됐다」고 잘못 적었다 |
| `--primary-color`·`--secondary-color` | 값은 매겨지지만 읽는 CSS 가 없다 |
| 회사별 빌드 테마(`build:company-a/b/c`) | 키가 어긋나 언제나 기본값이 된다. 동작하지 않는다 |
| 다크 모드 | 없다(`color-scheme: light`). 만들지 않는다 |

## 2. 글꼴

| 무엇 | 값 | 비고 |
|---|---|---|
| 글꼴 | **Noto Sans KR** (+ Roboto) | `!important` 로 강제된다. 화면에서 `font-family` 를 쓰지 않는다 |
| 본문 | 13px / 줄높이 1.5 | |
| 패널 제목 `<h3>` | 14px / 400 | [screen-standard.md](screen-standard.md) §4-3 골격의 자리에만 쓴다 |
| 라벨 | 14px / 500 — 검색 영역 안에서는 12px · 오른쪽 정렬 | `Label` 부품이 정한다 |
| 폼 표 라벨칸·값칸 | 13px | `Table` 부품이 정한다 |
| 입력칸·선택상자 | 14px | |
| 그리드 | 14px | |
| 화면 제목 | 17px / 700 — **상단바(GNB)에만** 나온다 | 화면 안에 제목을 또 쓰지 않는다 |

- `h1`·`h2`·`h4` 이하는 쓰지 않는다. 패널 제목은 `<h3>` 하나다.
- 굵기·크기를 `style` 로 바꾸지 않는다.

## 3. 크기 · 간격

| 무엇 | 값 | 정하는 곳 |
|---|---|---|
| 입력칸·선택상자·버튼(md) 높이 | **32px** | 부품 |
| 그리드 행·머리글 높이 | **30px** | `Grid` (CSS 로 바꾸지 않는다) |
| 카드 안쪽 여백 | 16px | `ComponentPanel` |
| 카드 둥근 모서리 / 그림자 | 8px / `0 1px 3px rgba(0,0,0,.05)` | `ComponentPanel`·`SearchPanel` |
| 입력칸·버튼 둥근 모서리 | 6px | 부품 |
| 검색 영역 → 카드 | 8px | 패널 |
| 카드 → 카드 / 영역 → 영역 | 10px | 패널 |
| 버튼 사이 | 5px | `RFloatArea` |
| 좌우 분할 사이(L3) | 16px | `FlexPanel style={{ gap: '16px' }}` |
| 화면 바깥 여백 | 14px 16px | 화면 틀 |

- **간격은 패널을 쌓는 방식으로 생긴다.** `margin`·`padding` 을 `style` 로 더하지 않는다.
- 그리드 높이는 `height: 'calc(100vh - Npx)'` — 페이지에 세로 스크롤이 생기지 않는 가장 작은 `N` 을 **띄워서** 찾는다.
  시작값: L1 `367px`(SYS6010) · L2 `560px` · L3 `332px`(SYS0010) · 팝업은 고정 `px`.
  ⚠ `Tree`·`SortableTree` 의 `height` 는 **`'NNNpx'` 꼴**이어야 한다 — `calc()` 를 주면 빈 결과 안내의 높이 계산이 깨진다.
- 화면은 **데스크톱 전용**이다. 모바일 폭을 맞추지 않는다. 최소 폭도 정하지 않는다(대시보드만 1280px).

## 4. 버튼

### 4-1. 동작별 모양 — 이 표 밖의 조합을 만들지 않는다

| 동작 | `value` | `color` | `filled` | `className` | 그 밖 |
|---|---|---|---|---|---|
| 조회 | `조회` | `blue` | `true` | `icon-srch` | |
| 초기화 | `''` | `grey` | | `icon-reset` | `type: 'icon'` (아이콘만) |
| 신규 | `신규` | `grey` | | `icon-add` | |
| 저장 | `저장` | `blue` | `true` | `icon-act` | |
| 삭제 | `삭제` | `grey` | | `icon-del` | 빨강이 아니다 — 확인창이 막는다 |
| 행추가 / 행삭제 | `행추가` / `행삭제` | `grey` | | `icon-plus` / `icon-minus` | |
| 엑셀 | `엑셀` | `grey` | `true` | `icon-excel` | |
| 선택(팝업) | `선택` | `blue` | `true` | `icon-act` | 고른 행이 없으면 `disabled` |
| 닫기·취소 | `닫기` / `취소` | `grey` | | `icon-cancel` | |
| 확인 | `확인` | `blue` | `true` | `icon-act` | |

- **표에 없는 동작**(팝업 미리보기·권한추가·로그인초기화 …)은 회색(`filled` 없음) + 뜻이 가장 가까운 `icon-*` 로 한다.
  그 영역의 **주 동작**일 때만 파랑 채움이다(예: 사용자정보 팝업의 [비밀번호 변경]). ID 는 `btn{동작}{대상}`.
- 크기는 `size: 'md'`(32px) 하나. `xs`(28px)는 표 안의 작은 버튼에만, `lg`(48px)는 쓰지 않는다. **`sm` 은 없다.**
- **파란 버튼은 영역마다 하나**(그 영역의 주 동작). 나머지는 회색이다.
- `purple`·`green`·`red`·`yellow`·`navy`·`white` 는 새 화면에 쓰지 않는다 — 옛 화면에 남은 것은 표준이 아니다.
  `orange`·`gray`(철자) 는 **CSS 가 없어** 맨 버튼으로 나온다.
- 글자는 `TEXT.btn` 에서 꺼낸다. 위 `value` 는 표준 문구다.
- `fiiled` 는 옛 오타다 — `filled` 로 쓴다(부품이 둘 다 받는다).

### 4-2. 버튼 아이콘

`className` 의 `icon-*` 가 18px 아이콘을 앞에 붙인다: `icon-srch` `icon-reset` `icon-add` `icon-plus`
`icon-minus` `icon-del` `icon-act` `icon-save` `icon-cancel` `icon-view` `icon-excel` `icon-download`
`icon-preview` `icon-edit`. 이 밖의 이름은 아무것도 그리지 않는다.

## 5. 폼 · 표

| 무엇 | 모양 | 쓰는 법 |
|---|---|---|
| 폼 라벨칸 | 바탕 `#f8fafc`, 13px / 500, 왼쪽 정렬, 높이 32px | `Table` 의 `{ type: 'T' }` |
| 폼 값칸 | 흰 바탕, 13px | `{ type: 'D' }` |
| 필수 — 폼 | 라벨 **뒤**에 빨간 `*` | `{ type: 'T', required: true }` |
| 필수 — 검색 라벨 | 라벨 **앞**에 빨간 `*` | `<Label value=… req />` |
| 필수 — 그리드 열 | 머리글 뒤에 `*` | 열 정의 `req: true` |
| 읽기 전용 칸 | 옅은 회색 바탕 | `readOnly: true` (입력 못 하지만 값은 보인다) |
| 사용 불가 칸 | 회색 바탕·흐린 글자 | `disabled: true` |
| 열 폭 | 2쌍 `12% 38% 12% 38%` · 3쌍 `10% 23% 10% 23% 10% 24%` | `colGrp` |

## 6. 그리드

| 무엇 | 값 |
|---|---|
| 테마 | ag-Grid 32 `ag-theme-alpine` — 부품이 씌운다 |
| 행·머리글 높이 | 30px |
| 머리글 | 가운데 정렬, `--cw-text-secondary` |
| 선택 행 | `--cw-point-light` |
| 빈 결과 | 「조회된 결과가 존재하지 않습니다.」를 부품이 보인다 — 알림을 띄우지 않는다 |

**열 정렬 — 내용으로 정한다**

| 내용 | 정렬 | 형식 |
|---|---|---|
| 글(이름·제목·설명) | 왼쪽 (기본) | |
| 코드·ID·여부·상태 | `textAlign: 'center'` | 코드면 `valueFormatter` 로 이름 |
| 날짜 | `center` | `type: 'date'` → `YYYY-MM-DD` · `type: 'datetime'` → `YYYY-MM-DD HH:mm:ss` |
| 숫자·금액·건수 | `textAlign: 'right'` | `type: 'number'` → 천 단위 쉼표 |
| 개인정보 | | `type: 'phone'`·`'email'`·`'name'`·`'rrn'`·`'account'` → 가린다 |

- 날짜·숫자를 손으로 자르거나 쉼표를 붙이지 않는다 — `type` 하나로 한 곳에서 정한다.
- ⚠ `type: 'date'`·`'datetime'` 은 값이 **`YYYYMMDD[HHmmss]` 꼴일 때만** 붙인다. 형식기가 앞에서부터 잘라 쓰므로,
  서버가 이미 `'2026-10-07 08:37:35'` 처럼 바꿔 준 값에 붙이면 **망가진다.** 그런 열은 `type` 없이 그대로 둔다
  (예: SYS6010 의 `lgnDt` — 매퍼가 `TO_CHAR(…, 'YYYY-MM-DD HH24:MI:SS')` 로 준다). 응답 형식은 매퍼 XML 에서 확인한다.
- 열 폭은 `width`(px) 로 **비율**을 준다. 부품이 열들을 같은 비율로 늘려 그리드 폭을 채운다(`autoFitMode`).
- 순번 열은 `rowNum: true` — 데이터에 `rowNum` 을 만들어 넣지 않는다.
- 서버가 앞 공백으로 계층을 주는 열(조직 경로 등)은 `cellStyle: { whiteSpace: 'pre' }` 로 들여쓰기를 살린다.
  HTML(`<span style=…>`)을 값에 넣지 않는다 — 그리드는 그것을 **글자 그대로** 보인다(옛 SYS0020 이 그랬다).

## 7. 아이콘

| 쓰는 곳 | 쓰는 것 |
|---|---|
| 버튼 | `className: 'icon-*'` (§4-2) |
| 그 밖 | XEIcon — `<i className="xi-close" />` |

Font Awesome 도 들어 있지만 새 화면은 XEIcon 하나만 쓴다. 이모지를 아이콘으로 쓰지 않는다.

## 8. 화면 틀 — 화면이 건드리지 않는 것

왼쪽 아이콘바·하위메뉴·상단바(화면 제목)·탭 줄·오른쪽 서랍은 **틀**이 그린다.
화면은 `FullPanel` 안쪽만 책임진다. 화면 제목을 화면 안에 다시 쓰지 않는다 — 상단바에 이미 있다.
