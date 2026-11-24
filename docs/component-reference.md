# 컴포넌트 레퍼런스

> **읽는 이** — 화면을 짜는 AI·개발자.
> 여기 적은 속성·이벤트는 **부품 코드가 실제로 읽는 것**만이다(`frontend/src/components/`).
> **여기 없는 속성을 넘기지 않는다** — 오류 없이 무시되어, 넣은 줄 알았던 것이 조용히 빠진다.
> 표에 없는 것이 필요하면 부품 코드를 읽고, 그래도 없으면 **묻는다**(부품을 고치지 않는다).

모든 부품은 `import { … } from 'components'` 하나로 가져온다. 모두 클래스 컴포넌트다.

---

## 0. 한눈에

| 쓴다 | 부품 | § |
|---|---|---|
| 패널 | `FullPanel` `SearchPanel` `SubFullPanel` `ComponentPanel` `BottomPanel` `FlexPanel` `RelativeGroup` `LFloatArea` `RFloatArea` | 1 |
| 버튼 | `BasicButton` (`as Button`), `IconButton` | 2 |
| 글자 입력 | `Textfield` `TextPasswdfield` `Textarea` `NumberStepper` | 3 |
| 고르기 | `Selectbox` `ComboList` `ToggleButtonGroup` `MulitSelectBox` `Checkbox` `MultiCheckBox` `Radio` `Switch` | 4 |
| 날짜 | `InputCalendar` `RangeInputCalendar` | 5 |
| 사람·조직 | `UserSelect` `UserMultiSelect` `OgnzSelect` | 6 |
| 목록·폼 | `Grid` `Table` `Label` | 7 |
| 계층·탭 | `Tree` `SortableTree` `Tabs` `TabPanel` | 8 |
| 파일·편집기 | `FileManager` `HtmlEditor` | 9 |
| 그 밖 | `TagSelector` `ProgressBar` `ScrmBarChart` `ErrorBoundary` | 10 |
| **쓰지 않는다** | §11 | 11 |

---

## 1. 패널

전부 `<div>` 하나에 클래스를 붙인다. 간격·배경·모서리는 클래스가 정한다 — `style` 로 덧칠하지 않는다.

| 부품 | 하는 일 | 받는 속성 |
|---|---|---|
| `FullPanel` | 화면 전체를 감싼다. 화면당 하나 | `width` |
| `SearchPanel` | 검색 영역(흰 카드) | — |
| `SubFullPanel` | 본문 영역. 여럿이면 위→아래로 쌓인다 | `width` `height` |
| `ComponentPanel` | 흰 카드 = 영역 하나 | `width` `height` `sizeVar` |
| `BottomPanel` | 카드 아래 버튼 줄 | `style` |
| `FlexPanel` | 가로 배치(L3 좌우 분할) | `style` |
| `RelativeGroup` | 한 줄 묶음(왼쪽·오른쪽 영역을 담는다) | `width` `style` |
| `LFloatArea` / `RFloatArea` | 줄의 왼쪽 / 오른쪽 | `style` |

`className` 은 모두 받는다. 배치는 [screen-standard.md](screen-standard.md) §4-3.

## 2. 버튼

### `BasicButton` — `import { BasicButton as Button }`

| 속성 | 기본 | |
|---|---|---|
| `id` | | **필수** — `onClick` 에서 `e.target.id` 로 가른다 |
| `value` | | 글자. 아이콘만이면 `''` |
| `color` | `'grey'` | `blue` `grey` (표준). 그 밖은 [design-standard.md](design-standard.md) §4 |
| `filled` | `false` | `false` 면 테두리만(`-o`) |
| `size` | `'md'` | `md` `xs` (`sm` 은 **없다**) |
| `type` | `'default'` | `'icon'` = 아이콘만(32×32) |
| `className` | `''` | `icon-*` 아이콘 |
| `disabled` | `false` | |
| `hidden` | | 자리를 남긴 채 투명해진다 — 보통은 `disabled` 를 쓴다 |
| `tooltip` | | 마우스를 올리면 보이는 글 |
| `onClick` | | DOM 이벤트 `e` 를 받는다 |

**받지 않는 것** — `style`·`title`·`autoFocus` 는 무시된다.

### `IconButton`
`id` `classes`(className 으로 쓰인다) `style` `tooltip` `onClick(e)`. 글자 없는 버튼. 표준 화면에서는 `BasicButton type="icon"` 을 먼저 쓴다.

## 3. 글자 입력

### `Textfield`

| 속성 | | 속성 | |
|---|---|---|---|
| `id` `name` `value` | | `readOnly` `disabled` | |
| `placeholder` | | `width` | 감싸는 칸의 폭 |
| `maxLength` `minLength` | | `style` / `textStyle` | 감싸는 칸 / 입력칸 |
| `type` | `'onlyNum'` `'onlyKor'` `'onlyEng'` — **보이는 값만** 거른다 | `className` | 감싸는 칸과 입력칸 **둘 다**에 붙는다 |

이벤트 — `onChange` `onKeyPress` `onKeyDown` `onBlur` `onFocus` `onClick`. 모두 DOM 이벤트 `e`.
⚠ `type` 으로 걸러도 `onChange` 의 `e.target.value` 는 걸러지지 않은 값이다 → 검증에서 다시 본다.

### `TextPasswdfield`
`id` `name` `value` `placeholder` **`maxlength` `minlength`(소문자)** `readOnly` `className` `style` `textStyle`.
이벤트 `onChange(e)` `onKeyPress(e)`. `disabled` 가 없다.

### `Textarea`
`id` `name` `value` `placeholder` `maxLength` `minLength` `rows`(기본 3) `readOnly` `disabled` `type`(Textfield 와 같음)
`style`(입력칸) `className`(감싸는 칸). 이벤트 `onChange(e)` `onKeyPress(e)`.

### `NumberStepper`
`id` `value`(0) `min`(0) `max`(999999) `step`(1) `width`('100px') `disabled` `readOnly` `className` `style`.
`onChange({ target: { id, value } })` — `value` 는 **숫자**, min·max 안으로 잘린다.

## 4. 고르기

### `Selectbox`

| 속성 | |
|---|---|
| `id` `value` | 지금 값 |
| `dataset` | `[{ value, name }]` — `ComLib.convComboList(…)` 의 결과 그대로 |
| `width` | |
| `disabled` `readOnly` | `readOnly` 는 열리지 않게만 막는다 |
| `style` / `selectStyle` | 감싸는 칸 / select |

`onChange({ target: { id, name, value }, id })`.
**받지 않는 것** — `selected`(기본값만 있고 읽지 않는다), `color`(CSS 가 없다).

### `ComboList` — 검색되는 긴 목록
`id` `value` `dataset`(`[{ value, name }]`) `searchPlaceholder`('검색...') `width` `disabled` `readOnly`.
`onChange({ target: { id, name, value }, id })`.
⚠ `value` 가 목록에 없으면 **첫 항목이 보인다**(`placeholder` 는 사실상 안 보인다) — 「선택」을 첫 항목으로 넣는다.

### `ToggleButtonGroup` — 붙은 버튼 모양의 하나 고르기
`id` `value` `dataset`(`[{ value, name }]`) `width` `disabled` `readOnly`. `onChange({ target: { id, name, value }, id })`.

### `MulitSelectBox` — 여럿 고르기 (철자가 원래 이렇다)
`id`(**필수**) `dataset`(**필수**, 항목마다 `value: 'Y'|'N'`) `value`(**이름 필드명**) `keyProp`(키 필드명) `width` `displayCount` `disabled`.
`onChange({ id, target, dataset })` — **`onChange` 를 안 주면 첫 클릭에 오류가 난다.** 항목의 `value` 를 부품이 직접 바꾼다.

### `Checkbox`

| 속성 | |
|---|---|
| `id` | |
| `checked` | **`'Y'`** 면 체크 (`true` 가 아니다) |
| `value` | 옆에 붙는 **글자** (값이 아니다) |
| `keyProp` | DOM id 끝자리 — `chk_{id}_{index}_{keyProp}`. 주지 않으면 id 끝에 `undefined` 가 붙는다 |
| `disabled` `readOnly` `className` `style` | |

`onChange({ id, target, index, checked })` — `checked` 는 boolean.
⚠ `e.target.id` 는 `chk_{id}_{index}_…` 로 **바뀐** DOM id 다 → `e.id` 를 쓴다.
⚠ 한 번 누르면 `onClick` 과 `onChange` 가 **둘 다** 온다 → `onChange` 하나에만 단다.

### `MultiCheckBox`
`id` `dataset` `value`(**글자 필드명**) `keyProp`(키 필드명). 체크 여부는 항목의 **`value` 필드**(`'Y'`).
`onChange({ id, target, index, checked })`.

### `Radio`

| 속성 | |
|---|---|
| `id` | |
| `dataset` | 선택지 배열 |
| `keyProp` | 값으로 쓸 **필드명** |
| `value` | 글자로 쓸 **필드명** (값이 아니다) |
| `selected` | 지금 값 — `undefined` 면 아무것도 체크되지 않는다 |
| `defaultSelected` | `selected === null` 일 때만 쓰는 순번 |
| `disabled` `readOnly` `width` | |

`onChange({ id, value })`.

### `Switch`
`id` `checked`(boolean) `onChange(e)` — **`onChange` 필수**(없으면 그리는 순간 오류). `e.target.checked`.

## 5. 날짜

### `InputCalendar`
`id` `value`(`YYYYMMDD`·`YYYY-MM-DD`·`YYYYMM`) `placeholder` `inputWidth`('120px') `disabled` `plugins`(`"month"` = 월 선택).
`onChange({ target: { id, value } })` — `value` 는 `'YYYYMMDD'`(월이면 `'YYYYMM'`) 또는 `null`.

### `RangeInputCalendar`
`id` `strtId` / `endId`(두 입력칸의 id) `startDate` `endDate` `inputWidth`('120px') `useClearButton` `disabled`.
`onChange({ target: { id }, startDate, endDate })` — 둘 다 `'YYYYMMDD'` 또는 `null`.

```js
rangeCalendarProps: {
  rngSrchRegDt: { id: 'rngSrchRegDt', strtId: 'rngSrchRegDtFrom', endId: 'rngSrchRegDtTo', startDate: '', endDate: '' },
},
```

## 6. 사람 · 조직

세 부품 모두 **로그인한 사용자의 조직 조회 범위**를 따른다 — 권한이 좁으면 자기 조직·자기 자신이 미리 채워지고 잠긴다.

### `UserSelect` — 사용자 찾기(칸 + 🔍)
`id` `userId` `userNm` `keyword` `width` `userNmWidth` `placeholder` `disabled` `readOnly` `authrt`(기본 `true` = 조회 범위 적용).
`onChange({ userId, userNm })` — **id 가 없다.** 🔍 는 찾기 팝업 `SYS0040` 을 연다.

### `OgnzSelect` — 조직 찾기
`id` `ognzCd` `ognzNm` `keyword` `width` `ognzNmWidth` `placeholder` `disabled` `readOnly` `authrt`.
`onChange({ ognzCd, ognzNm })`. 🔍 는 `SYS0020` 을 연다.

### `UserMultiSelect` — 여러 사용자
`selectedUsers`(`[{ userId, userNm }]`) `width` `disabled` `authrt` `maxUsers` `maxVisibleTags`(4).
`onChange({ selectedUsers, userIds, userNames })`.

## 7. 목록 · 폼

### `Grid` (ag-Grid 32 감싸개)

| 속성 | 기본 | |
|---|---|---|
| `id` | | **필수** — 없으면 대부분의 이벤트가 오지 않는다 |
| `data` | | **DataLib 데이터셋** (`DataLib.datalist.getInstance()`). 배열을 넘기지 않는다 |
| `header` | `[]` | 열 정의 — 아래 |
| `height` | | `'calc(100vh - 367px)'` 같은 CSS 높이 (`gridHeight` 는 **없다**) |
| `rowSelection` | `'single'` | `'single'` · `'multiple'` |
| `rowNum` | | `true` = 순번 열 |
| `infoCheckBox` | `{ use: false }` | `{ use: true }` = 체크 선택 열 |
| `infinite` · `totalRowCnt` | | 무한 스크롤 — `onScrollEnd` 와 함께 ([screen-standard.md](screen-standard.md) §5-2) |
| `colPinned` | | 숫자 n — 앞 **n−1** 개 열을 고정 |
| `sort` / `filter` | `true` / `false` | 머리글 정렬 / 필터 |
| `suppressRowClickSelection` | `false` | |
| `getRowStyle` | | 행 모양 함수 |

**열 정의** — ag-Grid 의 열 속성은 그대로 지나가고, 감싸개가 아래를 더 처리한다:

| 키 | |
|---|---|
| `headerName` `field` `colId` | 셋 다 준다. `colId` = `field` |
| `width` | px (비율로 늘어난다) |
| `textAlign` | `'left'`(기본) · `'center'` · `'right'` |
| `type` | `date` `datetime` `time` `number` `phone` `email` `name` `rrn` `account` — 형식·가림을 붙인다. 날짜 형은 값이 `YYYYMMDD[HHmmss]` 일 때만 |
| `req` | `true` = 머리글에 `*` |
| `editable` · `cellEditor` · `cellEditorParams` | 셀 편집. 선택상자는 `'agSelectCellEditor'` |
| `valueFormatter` | 코드 → 이름 등 |
| `children` | 묶음 머리글 |
| `defaultValue` | 행추가 때 넣을 값 |
| `rowSpan` | `true` = 같은 값 세로 병합 |

⚠ 감싸개가 `header` 객체를 **직접 바꾼다**(`req` 를 지우고 `*` 를 붙인다). 같은 배열을 두 그리드에 넘기지 않는다.
⚠ 그리드는 고친 셀 값을 **자기 사본에만** 둔다 — 화면의 데이터셋에 옮기는 것은 화면 몫이다. 또 `data` 의 records **배열이 새것일 때만** 다시 그린다.
⚠ `rowMultiSelectWithClick` 이 켜져 있어, 단일 선택 그리드에서도 고른 행을 다시 누르면 선택이 풀린다.
`'rowtype' === 'd'` 인 행은 그리드가 감춰 그린다.
⚠ `autoHeight: true` 는 `cellStyle` 이 없으면 오류가 난다.

**이벤트** — 감싸개가 모양을 바꿔 넘긴다(ag-Grid 원본 모양이 아니다):

| 이벤트 | 받는 것 |
|---|---|
| `onGridReady` | `{ id, api, gridApi, grid }` — `api` 를 붙잡아 둔다. `columnApi` 는 ag-Grid 32 에 없다 |
| `onRowClicked` · `onRowDoubleClicked` | `{ id, data, index }` |
| `onCellClicked` · `onCellDoubleClicked` | `{ id, data, index, col }` |
| `onCellValueChanged` | `{ id, data(전체), index, row, col, node, oldValue, newValue }` — 값이 바뀌었을 때만. **행은 `node.data.recid` 로 찾는다** — `index` 는 ag-Grid 의 node id 라 데이터셋 순번이 아니다. 데이터셋에 옮기는 법은 [screen-standard.md](screen-standard.md) §5-7 |
| `onSelectionChanged` | `{ id, gridApi, event }` |
| `onRowSelected` | `{ id, data, index, event }` |
| `onScrollEnd` | `{ id }` — 무한 스크롤 끝에 닿았다 |
| `onRowDragEnd` | `{ id, data, dragData }` |

**쓰지 않는 속성** — `addRowBtn`·`delRowBtn`·`dnlExcelBtn` 은 **화면에 나타나지 않는다**(숨은 영역에 그려진다).
버튼을 직접 둔다. `onCellFocused`·`onPaginationChanged` 는 오지 않는다.
`cellRenderer: 'checkbox'|'selectbox'|'delButton'|'actionButton'…` 같은 **문자열 렌더러는 등록되지 않는다**(ag-Grid 32 가 옛 등록 방식을 읽지 않는다).

### `Table` (폼 표)

| 속성 | |
|---|---|
| `id` | |
| `colGrp` | `[{ width }]` — 열 폭 (`colGroup` 이 아니다) |
| `tbData` | 행 배열. 행 = 칸 배열. 칸 = `{ type, value, colSpan, rowSpan, className, required }` |
| `width` `className` `style` | |

- `type: 'T'` = 라벨칸(`<th>`), `type: 'D'` = 값칸(`<td>`). `value` 에 글자나 부품을 넣는다.
- `required: true` = 라벨 뒤 `*`.
- ⚠ `head`·`footer` 속성은 **그려지지 않는다**(조건이 뒤집혀 있다). 쓰지 않는다.

### `Label`
`value`(글자) `req`(앞에 `*`) `className` `style`. 이벤트 없음. 검색 영역 라벨에 쓴다.

## 8. 계층 · 탭

### `Tree` — 읽기 전용 트리
`id` `data`(DataLib 데이터셋) `height`(**`'NNNpx'` 꼴** — 빈 상태 표시가 그 숫자를 읽는다)
`idField`('ID') `parentField`('PARENT_ID') `titleField`('TITLE') `sortField`('SORT_ORD') `openAllonInitial`.

| 이벤트 | 받는 것 |
|---|---|
| `onNodeClick` | `{ id, node, data, event, dataId }` |
| `onNodeDoubleClick` | `{ id, node, data, event, hasChildren }` |
| `onTreeReady` | `{ getSelectedNodes, setRowData, forEachNode, setSelectedNodes }` |

⚠ 부품이 데이터 행에 `treeIndex`·`parent` 를 **더한다.** 서버로 다시 보낼 때 빼고 보낸다.

### `SortableTree` — 끌어서 순서를 바꾸는 트리
`id`(**필수**) `data` `height`('NNNpx') `header` `idField` `parentField` `sortField` `addRowBtn` `delRowBtn` `ediRowBtn` `maxDepth`(10).
`onChange({ id, data })`, `onRowSelect({ id, data, type: 'add'|'edit'|'view' })` — **`onRowSelect` 필수**(행 버튼을 누르는 순간 오류).

### `Tabs` · `TabPanel`

```jsx
<Tabs id="tabUserInfo" onClick={(index) => this.setState({ tabIndex: index })}>
  <TabPanel index={0} label={TEXT.title.basic}>…</TabPanel>
  <TabPanel index={1} label={TEXT.title.auth}>…</TabPanel>
</Tabs>
```

- `Tabs` — `id` `className` `height` `tabWidth` `onClick(index)`.
- `TabPanel` — `index` `label` `display`(`'none'` = 탭 숨김).
- ⚠ 활성 탭을 **밖에서 정할 수 없다**(첫 탭으로 시작한다). `onClick` 으로 받은 순번을 기억만 한다.

## 9. 파일 · 편집기

### `FileManager` — 첨부 (표준)

| 속성 | 기본 | |
|---|---|---|
| `id` | | |
| `mode` | `'multi'` | `'multi'` · `'single'` · `'view'` · `'single-view'` |
| `height` | 200 | px 숫자 |
| `initialFiles` | `[]` | `[{ fileId, fileName, fileSize }]` |
| `initialGroupId` | | 이미 있는 첨부 묶음 ID |
| `maxFiles` / `maxSize` | 10 / 100MB | |
| `uploadValidation` | `() => true` | `([{ file }]) => boolean` |
| `disabled` | | |

| 이벤트 | 받는 것 |
|---|---|
| `onUploadComplete` | `{ id, msg, savedFileList, atchFileGroupId }` |
| `onGroupIdChange` | `groupId` — 이 값을 저장 API 에 함께 보낸다 |
| `onFileDelete` | `fileId` |

`ref` 로 `getFiles()` `getGroupId()` `isUploading()` `clearAll()` 를 부를 수 있다.
업로드·삭제·내려받기 주소는 공통 API(`/api/common/…`)가 기본값이다 — 바꾸지 않는다.

### `HtmlEditor` — 서식 편집기
`id` `value`(HTML) `height`(px 숫자 — **기본값이 없다**, 꼭 준다) `readOnly` `toolbarHidden`(처음 한 번만 읽힌다).
`onChange({ id, value })`. 들어오는 HTML 은 부품이 DOMPurify 로 거른다.

## 10. 그 밖

| 부품 | 속성 · 이벤트 |
|---|---|
| `TagSelector` | `tags`(`[{ name, color, selected }]`, color: `red` `green` `blue` `orange` `purple` `yellow` `grey` + `-light`/`-dark`) `disabled` · `onTagClick(tag)` |
| `ProgressBar` | `data`(퍼센트 숫자) `options`(`{ type, status }`) |
| `ScrmBarChart` | `width` `height` `data` `layout` `dailyOptions`(`{ YAsisKey, dataKey: [{ key, color }] }`) — X축이 0~100% 로 고정 |
| `ErrorBoundary` | `fallback` `showRetry` `showDetails` — 화면 일부가 깨져도 전체가 하얗게 되지 않게 감싼다 |

차트는 아직 표준이 없다. 필요하면 **묻는다.**

## 11. 쓰지 않는다

| 부품 | 이유 |
|---|---|
| ~~`InputFileUpload` · `MultiFileUpload` · `IconFileUpload`~~ | **걷었다(2026-10-07).** 앞의 것은 올린 파일을 `https://httpbin.org/post`(외부 공개 사이트)로 보냈고, 뒤의 둘은 빈 껍데기였다. 첨부는 `FileManager` |
| `CentListSelectBox` · `TeamListSelectBox` · `UsrListSelectBox` | 원본 프로젝트의 것. 언제나 빈 목록이고 하나는 오류를 낸다 |
| `ScrmLineBarChart` | 범례를 누르면 오류(없는 메서드를 부른다) |
| `ScrmRadialBarChart` | 고정된 예시 데이터만 그린다 |
| `Badge` | 파일이 비어 있다 |
| `ApiErrorBanner` | 배럴에 없다 |
| `Menu` · `HeaderMenu` · `TrayDiv` · `CustomSlide` | 화면 틀 전용 |
| `AppPanel` · `HeadPanel` · `MiddlePanel` · `SidePanel` · `MainPanel` · `FooterPanel` · `TrayPanel` · `DashboardPanel` | 옛 화면 틀. 쓰는 화면이 없다 |
| `Dialog.*` 직접 그리기 | `ComLib.openAlertDialog` · `openConfirmDialog` · `openPop` 으로 연다 |
