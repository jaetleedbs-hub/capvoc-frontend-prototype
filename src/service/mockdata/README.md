# Mock Data Service 가이드

## 📋 개요

이 문서는 NEXSIS 프론트엔드 프로젝트의 Mock Data Service 사용법을 설명합니다.

## 🏗️ 구조

```
src/service/mockdata/
├── MockServiceManager.js      # Mock 서비스 관리자
├── MockTransManager.js        # Mock TransManager (기존 TransManager와 동일한 인터페이스)
├── data/                      # Mock 데이터 JSON 파일들
│   └── cns/
│       ├── cns0010/
│       │   ├── customer-info.json
│       │   ├── customer-info-update.json
│       │   ├── customer-info-delete.json
│       │   └── customer-info-create.json
│       ├── cns0060/
│       │   ├── customer-basic-info.json
│       │   ├── customer-basic-info-list.json
│       │   ├── customer-basic-info-update.json
│       │   ├── customer-basic-info-delete.json
│       │   └── customer-basic-info-create.json
│       ├── cns0082/
│       │   └── account-info-list.json
│       └── cns0083/
│           └── agent-info-list.json
└── README.md                  # 이 문서
```

## 🚀 사용법

### 1. Mock TransManager 사용

```javascript
import MockTransManager from '../../../service/mockdata/MockTransManager';

// Mock 서비스 호출 (기존 TransManager와 동일한 방식)
MockTransManager.post('/api/cns/cns0083/r01', requestData, (res) => {
    if (res.success) {
        console.log('Mock 데이터 조회 성공:', res.data);
    } else {
        console.error('Mock 데이터 조회 실패:', res.message);
    }
});
```

### 2. Mock 모드 토글

```javascript
// Mock 모드 활성화/비활성화
MockTransManager.setMockMode(true);  // Mock 모드 활성화
MockTransManager.setMockMode(false); // 실제 서비스 모드

// Mock 모드 상태 확인
const isMockEnabled = MockTransManager.isMockEnabled();
```

### 3. Mock 데이터 파일 생성

새로운 Mock 데이터를 추가하려면:

1. **JSON 파일 생성**: `src/service/mockdata/data/{module}/{screen}/{action}.json`
2. **URL 매핑 규칙**:
   - `/api/cns/cns0010/r01` → `cns/cns0010/customer-info.json`
   - `/api/cns/cns0010/u01` → `cns/cns0010/customer-info-update.json`
   - `/api/cns/cns0010/d01` → `cns/cns0010/customer-info-delete.json`
   - `/api/cns/cns0010/c01` → `cns/cns0010/customer-info-create.json`
   - `/api/cns/cns0060/r01` → `cns/cns0060/customer-basic-info.json`
   - `/api/cns/cns0060/u01` → `cns/cns0060/customer-basic-info-update.json`
   - `/api/cns/cns0060/d01` → `cns/cns0060/customer-basic-info-delete.json`
   - `/api/cns/cns0060/c01` → `cns/cns0060/customer-basic-info-create.json`
   - `/api/cns/cns0082/r01` → `cns/cns0082/account-info-list.json`
   - `/api/cns/cns0082/u01` → `cns/cns0082/account-info-update.json`
   - `/api/cns/cns0082/d01` → `cns/cns0082/account-info-delete.json`
   - `/api/cns/cns0083/r01` → `cns/cns0083/agent-info-list.json`
   - `/api/cns/cns0083/u01` → `cns/cns0083/agent-info-update.json`
   - `/api/cns/cns0083/d01` → `cns/cns0083/agent-info-delete.json`

### 4. 필터링 기능

MockServiceManager는 특정 서비스에 대해 검색 조건에 따른 필터링 기능을 제공합니다.

#### CNS0010 (고객정보 조회)
- **지원 필터**: `accountNo`, `birthDate`, `bankAccount`
- **필터링 방식**: 부분 일치 (includes)

#### CNS0060 (고객 기본정보 조회)
- **지원 필터**: `AcntNo`, `CustmNm`, `CustmNo`, `CustmDob`, `CustmHpNo`, `EmailAddr`
- **필터링 방식**: 
  - `AcntNo`, `CustmNo`: 정확히 일치
  - `CustmNm`, `CustmDob`, `CustmHpNo`, `EmailAddr`: 부분 일치
- **조건 결합**: AND 조건 (모든 조건을 만족하는 데이터만 반환)

#### CNS0070 (고객 상세정보 조회)
- **지원 필터**: `ClntNo`
- **필터링 방식**: 
  - `ClntNo`: 정확히 일치
- **조건 결합**: 고객번호만 사용

#### 필터링 사용 예시
```javascript
// CNS0060 필터링 예시
const requestData = {
    CustmNm: "홍",           // 고객명에 "홍"이 포함된 고객
    CustmDob: "1985",        // 생년월일에 "1985"가 포함된 고객
    AcntNo: "1234567890"     // 계좌번호가 정확히 일치하는 고객
};

MockTransManager.post('/api/cns/cns0060/r01', requestData, (res) => {
    console.log('필터링된 결과:', res.data);
});

// CNS0070 필터링 예시
const detailRequestData = {
    ClntNo: "CUST001"                    // 고객번호가 정확히 일치하는 고객
};

MockTransManager.post('/api/cns/cns0070/r01', detailRequestData, (res) => {
    console.log('필터링된 고객 상세정보:', res.data);
});
```

### 5. JSON 파일 형식

```json
{
  "success": true,
  "message": "조회가 완료되었습니다.",
  "data": [
    {
      "CustmNo": "CUST001",
      "AcntNo": "12345678901234567890",
      "CustmDob": "19850315",
      "CustmNm": "홍길동"
    }
  ],
  "totalCount": 1
      "totalPages": 1
    }
  }
}
```

### 5. 검색 조건별 필터링 (CNS0010)

CNS0010 고객정보 조회 시 검색 조건에 따라 자동으로 데이터가 필터링됩니다:

```javascript
// 계좌번호로 검색
MockTransManager.post('/api/cns/cns0010/r01', { 
  accountNo: '12345678901234567890' 
}, callback);

// 생년월일로 검색  
MockTransManager.post('/api/cns/cns0010/r01', { 
  birthDate: '19850315' 
}, callback);

// 은행제휴계좌로 검색
MockTransManager.post('/api/cns/cns0010/r01', { 
  bankAccount: '12345678901234567890' 
}, callback);

// 복합 조건으로 검색
MockTransManager.post('/api/cns/cns0010/r01', { 
  accountNo: '12345678901234567890',
  birthDate: '19850315',
  bankAccount: '12345678901234567890'
}, callback);
```

**필터링 규칙:**
- **계좌번호**: `AcntNo` 필드에서 부분 일치 검색
- **생년월일**: `CustmDob` 필드에서 부분 일치 검색  
- **은행제휴계좌**: `AcntNo` 필드에서 부분 일치 검색
- **복합 조건**: 모든 조건을 AND로 적용

### 6. CustomerService를 통한 Mock 서비스 사용 (권장)

CNS0060 고객기본정보 관리를 위한 중앙 집중식 서비스:

```javascript
import CustomerService from 'containers/cns/CNS0010/customerService';

// 고객 기본정보 조회 (단일 고객) - 계좌번호와 고객명으로 조회
const customerData = await CustomerService.getCustomerBasicInfoMock('12345678901234567890', '홍길동');

// 고객 기본정보 목록 조회 (전체 고객)
const customerList = await CustomerService.getCustomerBasicInfoListMock();

// 고객 기본정보 생성
const newCustomer = { customerName: '새고객', phone: '010-0000-0000' };
const createResult = await CustomerService.createCustomerBasicInfoMock(newCustomer);
```

**CustomerService 장점:**
- Promise 기반 비동기 처리
- 중앙 집중식 에러 처리
- 일관된 로깅 및 메시지 관리
- 실제 서비스와 동일한 인터페이스

### 7. 연쇄 호출 방식 (SearchArea → CustomerService)

SearchArea에서 고객정보 조회 후 고객 기본정보를 연쇄적으로 조회하는 방식:

```javascript
// SearchArea.js에서의 연쇄 호출
const customerInfoResponse = await this.searchCustomerInfo();
if (customerInfoResponse && customerInfoResponse.length > 0) {
  const customerData = customerInfoResponse[0];
  const basicInfoResponse = await CustomerService.getCustomerBasicInfoMock(
    customerData.AcntNo, 
    customerData.CustmNm
  );
  
  // 고객정보와 기본정보 결합
  const combinedCustomerInfo = customerInfoResponse.map(customer => ({
    ...customer,
    basicInfo: basicInfoResponse
  }));
}
```

**연쇄 호출 장점:**
- 검색 조건에 따른 정확한 고객 기본정보 조회
- 중복 API 호출 방지
- 데이터 일관성 보장
- 성능 최적화

## 🔄 실제 서비스 연계 시 전환 방법

### 방법 1: Import 변경만으로 전환

```javascript
// Mock 사용 시
import MockTransManager from '../../../service/mockdata/MockTransManager';

// 실제 서비스 연계 시
import { TransManager } from 'common';

// 사용법은 동일
TransManager.post('/api/cns/cns0083/r01', requestData, callback);
```

### 방법 2: 조건부 사용

```javascript
import { TransManager } from 'common';
import MockTransManager from '../../../service/mockdata/MockTransManager';

// 환경에 따라 선택
const ServiceManager = process.env.REACT_APP_USE_MOCK === 'true' 
    ? MockTransManager 
    : TransManager;

// 사용법은 동일
ServiceManager.post('/api/cns/cns0083/r01', requestData, callback);
```

## 🧪 테스트

### 필터링 기능 테스트

#### CNS0010 필터링 테스트
```javascript
// 브라우저 콘솔에서 실행
import('./service/mockdata/test-cns0010-filter.js').then(module => {
    module.runAllTests();
});

// 또는 개별 테스트 실행
import('./service/mockdata/test-cns0010-filter.js').then(module => {
    module.testFilterByAccountNo();      // 계좌번호로 필터링
    module.testFilterByBirthDate();      // 생년월일로 필터링
    module.testFilterByBankAccount();    // 은행제휴계좌로 필터링
    module.testMockServiceCall();        // 실제 Mock 서비스 호출 테스트
});
```

#### CNS0060 필터링 테스트
```javascript
// 브라우저 콘솔에서 실행
import('./service/mockdata/test-cns0060-filter.js').then(module => {
    module.runAllTests();
});

// 또는 개별 테스트 실행
import('./service/mockdata/test-cns0060-filter.js').then(module => {
    module.testFilterByAccountNo();      // 계좌번호로 필터링
    module.testFilterByCustomerName();   // 고객명으로 필터링
    module.testFilterByMultipleConditions(); // 다중 조건으로 필터링
});
```

#### CNS0070 필터링 테스트
```javascript
// 브라우저 콘솔에서 실행
import('./service/mockdata/test-cns0070-filter.js').then(module => {
    module.runAllTests();
});

// 또는 개별 테스트 실행
import('./service/mockdata/test-cns0070-filter.js').then(module => {
    module.testFilterByCustomerNo();     // 고객번호로 필터링
    module.testFilterByMultipleConditions(); // 다중 조건으로 필터링
});
```

### 디버깅 로그

MockServiceManager는 상세한 디버깅 로그를 제공합니다:

#### CNS0010 디버깅 로그
```javascript
// 콘솔에서 확인할 수 있는 로그들
[MockService] 호출: /api/cns/cns0010/r01
[MockService] CNS0010 필터링 적용: {accountNo: "11223344556677889900"}
[MockService] 응답: /api/cns/cns0010/r01
```

#### CNS0060 디버깅 로그
```javascript
// 콘솔에서 확인할 수 있는 로그들
[MockService] 호출: /api/cns/cns0060/r01
[MockService] CNS0060 필터링 적용: {CustmNm: "홍"}
[MockService] filterCustomerBasicInfo 시작: {requestData: {...}, originalDataCount: 5}
[MockService] filterCustomerBasicInfo - 초기 데이터 개수: 5
[MockService] filterCustomerBasicInfo - 필터링 후 데이터 개수: 1
[MockService] filterCustomerBasicInfo 완료: {filteredCount: 1, message: "...", sampleData: {...}}
[MockService] 응답: /api/cns/cns0060/r01
```

#### CNS0070 디버깅 로그
```javascript
// 콘솔에서 확인할 수 있는 로그들
[MockService] 호출: /api/cns/cns0070/r01
[MockService] CNS0070 필터링 적용: {ClntNo: "CUST001"}
[MockService] filterCustomerDetailInfo 시작 - 요청 데이터: {ClntNo: "CUST001"}
[MockService] filterCustomerDetailInfo - 초기 데이터 개수: 5
[MockService] filterCustomerDetailInfo - 필터링 후 데이터 개수: 1
[MockService] filterCustomerDetailInfo 완료: {filteredCount: 1, message: "...", sampleData: {...}}
[MockService] 응답: /api/cns/cns0070/r01
```

## 📝 샘플 화면

Mock 기능을 사용하는 샘플 화면: 
- `src/containers/docsample/examples/Mock-CNS-Example.js`
- `src/containers/cns/CNS0010/SearchArea.js` (고객정보 조회)
- `src/containers/cns/CNS0010/customerService.js` (고객 서비스 - Mock 기능 포함)
- `src/containers/cns/CNS0060/index.js` (고객기본정보 조회 - CustomerService 사용)
- `src/containers/cns/CNS0082/index.js` (계좌정보 조회)
- `src/containers/cns/CNS0083/index.js` (대리인 정보 조회)

### 주요 기능:
- Mock 데이터 조회
- Mock 모드 토글
- 실제 서비스와 동일한 인터페이스
- 고객정보 조회 및 관리 (CNS0010)
  - 계좌번호(AcntNo) 필터링
  - 생년월일(CustmDob) 필터링  
  - 은행제휴계좌(AcntNo) 필터링
- 고객기본정보 조회 및 관리 (CNS0060)
  - CustomerService를 통한 중앙 집중식 Mock 서비스 관리
  - CRUD 작업 (조회, 생성)
- 계좌상태별 필터링 (CNS0082)
- 대리인 정보 상세 조회 (CNS0083)

## ⚙️ 설정 옵션

### Mock 서비스 매니저 설정

```javascript
import MockTransManager from '../../../service/mockdata/MockTransManager';

// 지연 시간 설정 (로딩 시뮬레이션)
MockTransManager.configure({ delay: 1000 });

// 캐시 초기화
MockTransManager.configure({ clearCache: true });
```

### 에러 시뮬레이션

```javascript
MockTransManager.post('/api/cns/cns0083/r01', requestData, callback, {
    error: true,
    errorMessage: '네트워크 오류가 발생했습니다.'
});
```

## 🔧 개발 팁

### 1. Mock 데이터 관리
- 각 화면별로 폴더 구조화
- 액션별로 파일 분리 (조회/수정/삭제)
- 실제 API 응답 형식과 동일하게 구성

### 2. 디버깅
- 브라우저 개발자 도구에서 Mock 호출 로그 확인
- Mock 데이터 캐시 초기화로 최신 데이터 반영

### 3. 성능 최적화
- Mock 데이터 캐싱으로 반복 로드 방지
- 지연 시간 설정으로 실제 네트워크 환경 시뮬레이션

## 🚨 주의사항

1. **기존 소스 수정 금지**: 기존 화면 코드는 수정하지 말고 새로운 화면에서만 Mock 기능 사용
2. **실제 서비스 연계 준비**: Mock 사용 시에도 실제 서비스 연계를 고려한 구조 설계
3. **데이터 형식 일치**: Mock 데이터는 실제 API 응답 형식과 일치해야 함

## 📚 참고 자료

- [Complete-CNS-Example.js](../containers/docsample/examples/Complete-CNS-Example.js) - 기존 서비스 호출 방식
- [Mock-CNS-Example.js](../containers/docsample/examples/Mock-CNS-Example.js) - Mock 기능 사용 예시 