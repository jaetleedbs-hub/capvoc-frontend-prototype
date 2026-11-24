```markdown
# 🎯 NEXSIS 프론트엔드 화면 개발 프롬프트

React 16.14 기반 NEXSIS 프로젝트의 표준 화면을 개발합니다.

## 📋 사전 준비

### 🏗️ 작업 환경
- **프로젝트 경로**: `aicc-frontend/`
- **작업 범위**: `프로젝트 경로` 폴더 내에서만 작업
- **프로젝트 규칙**: `프로젝트 경로` 폴더 내의 workspace rules의 모든 규칙을 엄격히 준수
- **표준 패턴**: NEXSIS 표준 화면 구조 패턴 적용
- **컴포넌트**: `프로젝트 경로` 폴더 내의 `src/components/` 기존 컴포넌트 활용 (수정 금지)

### 📚 필수 학습 자료
다음 문서들을 반드시 숙지한 후 개발을 진행하세요:
1. 개발 문서
    - **문서경로**: '@dev-doc/3.impl/{MODULE_LOWERCASE}/{MODULE_CODE}{SCREEN_CODE}/'
    - `@{MODULE_CODE}{SCREEN_CODE}_기능정의서.md` - 기능 요구사항 및 비즈니스 로직
    - `@{MODULE_CODE}{SCREEN_CODE}_기능목록.md` - 상세 기능 명세
    - `@{MODULE_CODE}{SCREEN_CODE}_화면정의서.md` - UI/UX 설계 및 화면 구성

2. 컴포넌트 가이드
    - **문서경로**: '@aicc-frontend/src/containers/docsample/doc/components/'
    - `Button-Guide.md` - Button 컴포넌트 사용 가이드
    - `Charts-Guide.md` - Charts 컴포넌트 사용 가이드
    - `Dialog-Guide.md` - Dialog 컴포넌트 사용 가이드
    - `FileUpload-Guide.md` - FileUpload 컴포넌트 사용 가이드
    - `Grid-Guide.md` - Grid 컴포넌트 사용 가이드
    - `HtmlEditor-Guide.md` - HtmlEditor 컴포넌트 사용 가이드
    - `Input-Guide.md` - Input 컴포넌트 사용 가이드
    - `Layout-Guide.md` - Layout 컴포넌트 사용 가이드
    - `ProgressBar-Guide.md` - ProgressBar 컴포넌트 사용 가이드
    - `Radio-Guide.md` - Radio 컴포넌트 사용 가이드
    - `SelectBox-Guide.md` - SelectBox 컴포넌트 사용 가이드
    - `Switch-Guide.md` - Switch 컴포넌트 사용 가이드
    - `Tab-Guide.md` - Tab 컴포넌트 사용 가이드
    - `Table-Guide.md` - Table 컴포넌트 사용 가이드
    - `Textarea-Guide.md` - Textarea 컴포넌트 사용 가이드
    - `Tree-Guide.md` - Tree 컴포넌트 사용 가이드


## 🎯 개발 대상 정보

### 📁 프로그램 정보
- **프로그램 경로**: `./src/containers/{MODULE_LOWERCASE}/{MODULE_CODE}{SCREEN_CODE}/`
- **프로그램 ID**: `{MODULE_CODE}{SCREEN_CODE}`
- **메인 파일**: `index.js`
- **클래스명**: `View` (필수)

### 🏗️ 표준 구조 적용
- 표준 화면 구조 패턴 100% 준수

## 🚀 개발 진행 단계

### 1️⃣ 설계 분석 단계
- [ ] 기능정의서 분석하여 필요한 기능 목록 파악
- [ ] 화면설계서 분석하여 UI 구성 요소 확인
- [ ] 테이블정의서 분석하여 데이터 구조 파악
- [ ] 필요한 컴포넌트 및 Props 구조 설계

### 2️⃣ 컴포넌트 구조 설계
- [ ] Import 문 작성 (표준 순서 준수)
- [ ] State 구조 설계 (데이터셋, Props 등)
- [ ] 이벤트 핸들러 구조 설계
- [ ] 렌더링 구조 설계

### 3️⃣ 핵심 기능 구현
- [ ] 데이터셋 구성 및 초기화
- [ ] 서버 통신 로직 구현 (transaction, callback)
- [ ] 유효성 검증 로직 구현
- [ ] 이벤트 핸들러 구현

### 4️⃣ UI 컴포넌트 구현
- [ ] 검색 영역 구현 (SearchPanel)
- [ ] 메인 컨텐츠 영역 구현 (Grid, Form 등)
- [ ] 액션 버튼 영역 구현
- [ ] Props 설정 (버튼, 그리드, 입력 필드 등)

### 5️⃣ 품질 검증 단계
- [ ] **표준 패턴 준수 확인**
  - 클래스명이 'View'인가?
  - 필수 메서드들이 모두 구현되어 있는가?
  - Import 순서가 표준을 따르고 있는가?
  - Props 구조가 표준화된 형태인가?

- [ ] **기능 동작 확인**
  - 초기 데이터 로드가 정상 동작하는가?
  - 검색 기능이 정상 동작하는가?
  - 저장/수정/삭제 기능이 정상 동작하는가?
  - 에러 처리가 적절한가?

- [ ] **UI/UX 확인**
  - 검색 영역과 결과 영역이 적절히 분리되어 있는가?
  - 버튼 색상이 용도에 맞게 설정되어 있는가?
  - 그리드 헤더가 명확하게 정의되어 있는가?
  - 필수 필드 표시가 되어 있는가?

- [ ] **데이터 흐름 확인**
  - validation → transaction → callback 흐름이 올바른가?
  - 상태 업데이트가 올바르게 이루어지는가?
  - 그리드 포커스 복원이 동작하는가?

## 📝 구현 시 주의사항

### 🚫 절대 금지 사항
- `src/components/` 하위 컴포넌트 수정 금지
- `package.json` 수정 금지
- 환경 변수 파일 수정 금지
- 기존 공통 라이브러리 수정 금지

### ✅ 필수 준수 사항
- `common/index.js` 참조 시, 실제 구현된 함수와 값만 사용 (존재하지 않는 기능 사용 금지)
예시) ComLib.getComCodeList (존재하지 않는 기능) => ComLib.getCommCodeList 사용

- 컴포넌트 생성 시 `컴포넌트 가이드`에 명시된 속성 및 이벤트만 사용해야 합니다. (임의의 값으로 생성 금지)
- 컴포넌트 초기값은 렌더링 오류 방지를 위해 빈 값 (`''`, `[]`, `{}`)으로 기본 설정합니다. (추후 개발자가 값을 매핑하여 채울 수 있도록)

- 모든 데이터셋 항목ID는 **camelCase** 사용
- 트랜잭션 ID는 **SYS5010R01, SYS5010C01** 형식 준수
- 버튼 색상: 조회(blue), 저장(purple), 삭제(red)
- 이벤트 바인딩은 constructor에서 필수 수행

### 🎯 코드 품질 기준
- 표준 화면 구조 패턴 100% 준수
- 에러 처리 및 유효성 검증 포함
- 주석을 통한 코드 설명 제공
- 재사용 가능한 구조로 작성

## 🔧 개발 완료 후 체크리스트

### 📋 최종 검증 항목
1. **파일 구조 확인**
   - [ ] `src/containers/{MODULE_LOWERCASE}/{MODULE_CODE}{SCREEN_CODE}/index.js` 파일 생성
   - [ ] 클래스명이 'View'로 정의됨
   - [ ] export default View 구문 포함

2. **표준 패턴 준수 확인**
   - [ ] 필수 메서드 모두 구현 (componentDidMount, validation, transaction, callback, event)
   - [ ] 데이터셋 명명 규칙 준수 (dsXXXList, dsSearch 등)
   - [ ] Props 구조 표준화 (btnProps, grdProps 등)

3. **기능 구현 확인**
   - [ ] 초기 데이터 로드 기능
   - [ ] 검색 기능
   - [ ] CRUD 기능 (조회, 등록, 수정, 삭제)
   - [ ] 유효성 검증 및 에러 처리

4. **UI/UX 구현 확인**
   - [ ] 표준 레이아웃 구조 적용
   - [ ] 적절한 컴포넌트 사용
   - [ ] 버튼 색상 및 스타일 준수
   - [ ] 반응형 디자인 고려

## 🎯 개발 시작

위의 모든 준비사항을 확인한 후, 설계 문서를 바탕으로 {MODULE_CODE}{SCREEN_CODE} 화면을 개발해주세요.

**개발 시 궁금한 점이 있으면 언제든지 질문하세요!**
```