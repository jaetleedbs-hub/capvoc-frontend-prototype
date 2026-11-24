import React from 'react';

// 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, BottomPanel,
         SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';

// UI 컴포넌트
import { Tree, Label, Textfield, Selectbox, Table } from 'components';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
  constructor(props) {
    super(props);
    
    // 트리 API 참조
    this.treeApi = null;
    
    // 현재 선택 조직
    this.currentOrgCd = '';
    this.currentIndex = -1; // 현재 선택된 조직의 인덱스
    
    // 임시 코드 관리 (신규 데이터용)
    this.maxTempCd = 0;
    
    // 편집 모드 관리 (조직 추가/수정 시 사용)
    this.isEditMode = false;
    this.editingOrgCd = null; // 편집 중인 조직 코드
    
    // 신규 모드 관리 (신규 버튼 클릭 시 사용)
    this.isNewMode = false;
    
    // Tree 컴포넌트 리셋용 키 (선택 상태 초기화용)
    this.treeKey = Date.now();
    
    this.state = {
      // 데이터셋 정의
      dsOrgList: DataLib.datalist.getInstance(),
      dsSearch: DataLib.datalist.getInstance(),
      dsOrgInfo: DataLib.datalist.getInstance(),
      
      // 버튼 Props
      btnProps: {
        btnSearch: {
          id: 'btnSearch',
          disabled: false,
          value: '조회',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-srch'
        },
        btnAddOrg: {
          id: 'btnAddOrg',
          value: '조직추가',
					color: 'grey',
					className : 'icon-add'
        },
        btnTestData: {
          id: 'btnTestData',
          disabled: false,
          value: '테스트데이터',
          hidden: false,
          color: 'gray',
          size: 'sm',
          fiiled: true
        },
        btnTestDetail: {
          id: 'btnTestDetail',
          disabled: false,
          value: '상세테스트',
          hidden: false,
          color: 'orange',
          size: 'sm',
          fiiled: true
        },
        btnTestApi: {
          id: 'btnTestApi',
          disabled: false,
          value: 'API테스트',
          hidden: false,
          color: 'red',
          size: 'sm',
          fiiled: true
        },
        btnNew: {
          id: 'btnNew',
          disabled: false,
          value: '신규',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: false,
          className: 'icon-add'
        },
        btnSave: {
          id: 'btnSave',
          disabled: false,
          value: '저장',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-act'
        },
        btnDelete: {
          id: 'btnDelete',
          disabled: false,
          value: '삭제',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: false,
          className: 'icon-del'
        },
        btnReset: {
          id: 'btnReset',
          disabled: false,
          value: '',
          hidden: false,
          color: 'grey',
          className: 'icon-reset',
          type: 'icon'
        }
      },
      
      // 텍스트필드 Props
      textFieldProps: {
        iptSrchOrgNm: {
          id: 'iptSrchOrgNm',
          value: '',
          placeholder: '조직명을 입력하세요',
          maxLength: 100,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptOrgCd: {
          id: 'iptOrgCd',
          value: '',
          placeholder: '조직코드',
          maxLength: 20,
          type: 'text',
          readOnly: false,
          disabled: true  // 기본값은 수정 불가능
        },
        iptOrgNm: {
          id: 'iptOrgNm',
          value: '',
          placeholder: '조직명',
          maxLength: 100,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptUpperOrgCd: {
          id: 'iptUpperOrgCd',
          value: '',
          placeholder: '상위조직코드',
          maxLength: 20,
          type: 'text',
          readOnly: false,
          disabled: true
        },
        iptHrOrgNo: {
          id: 'iptHrOrgNo',
          value: '',
          placeholder: '인사조직번호',
          maxLength: 20,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptRepTelNo: {
          id: 'iptRepTelNo',
          value: '',
          placeholder: '대표번호',
          maxLength: 20,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptSortOrder: {
          id: 'iptSortOrder',
          value: '',
          placeholder: '정렬순서',
          maxLength: 5,
          type: 'onlyNum',
          readOnly: false,
          disabled: false
        },
        useYn: {
          id: 'useYn',
          value: 'Y',
          type: 'text',
          readOnly: false,
          disabled: false
        }
      },
      
      // 셀렉트박스 Props
      selectboxProps: {
        selSrchUseYn: {
          id: 'selSrchUseYn',
          value: '',
          width: 120,
          selected: 0,
          disabled: false,
          label: '사용여부',
          dataset: [
            {value: '', name: '선택'},
            {value: 'Y', name: '사용'},
            {value: 'N', name: '미사용'}
          ]
        },
        selUseYn: {
          id: 'selUseYn',
          value: '',
          width: 120,
          selected: 0,
          disabled: false,
          label: '사용여부',
          dataset: [
            {value: 'Y', name: '사용'},
            {value: 'N', name: '미사용'}
          ]
        }
      },
      
      // 트리 Props
      treeProps: {
        treeOrgList: {
          id: 'treeOrgList',
          data: DataLib.datalist.getInstance(),
          idField: 'ognzCd',        // 조직 코드 필드
          parentField: 'upOgnzCd',  // 상위 조직 코드 필드
          titleField: 'ognzNm',     // 조직명 필드
          sortField: 'sortSn', // 정렬 필드
          header: [
            { headerName: '조직명', field: 'ognzNm', fieldLen: 200, type: 'text' },
            { headerName: '코드', field: 'ognzCd', fieldLen: 120, type: 'text' },
            { headerName: '레벨', field: 'ognzLvl', fieldLen: 80, type: 'text' }
          ],
          height: '646px',
          areaName: '조직 목록',
          addRowBtn: false,
          delRowBtn: false,
          openAllonInitial: true,
          maxDepth: 10
        }
      },
      
      // 상세정보 테이블 데이터
      detailTableData: [
        [
          { type: 'T', value: '조직코드', className: 'req', required: true, colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '조직명', className: 'req', required: true, colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '상위조직', colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '인사조직번호', colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '대표번호', colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '사용여부', colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ],
        [
          { type: 'T', value: '정렬순서', colSpan: 1, rowSpan: 1 },
          { type: 'D', value: '', colSpan: 1, rowSpan: 1 }
        ]
      ],
      
      colGroupDetail: [
        { width: '150px' },
        { width: 'auto' }
      ]
    };
    
    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.input.onKeyDown = this.event.input.onKeyDown.bind(this);
    this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
    this.event.tree.onRowSelect = this.event.tree.onRowSelect.bind(this);
  }
  
  componentDidMount() {
    console.log('🔧 SYS0010 componentDidMount 시작');
    
    // ESC 키 이벤트 리스너 등록
    document.addEventListener('keydown', this.handleKeyDown);
    
    // 초기 데이터 로드 - 사용중인 조직만 조회
    this.setState({
      ...this.state,
      selectboxProps: {
        ...this.state.selectboxProps,
        selSrchUseYn: {
          ...this.state.selectboxProps.selSrchUseYn,
          value: 'Y',
          selected: 1
        }
      }
    }, () => {
      console.log('🔧 setState 완료, API 호출 시작');
      if (this.validation('SYS0010R01')) {
        this.transaction('SYS0010R01');
      } else {
        console.log('❌ validation 실패');
      }
    });
  }

  componentWillUnmount() {
    // ESC 키 이벤트 리스너 해제
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  // 키보드 이벤트 핸들러
  handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      // ESC 키 누를 때 편집 모드일 경우에만 리셋
      if (this.isEditMode) {
        console.log('⌨️ ESC 키 누름 - 편집 모드 리셋');
        this.handleReset();
      }
    }
  };
  
  // 유효성 검증
  validation = (...params) => {
    let transId = params[0];
    
    switch (transId) {
      case 'SYS0010R01': // 조직 조회
        // 조회 조건 검증 (특별한 검증 없음)
        break;
        
      case 'SYS0010R02': // 조직 상세정보 조회
        if (StrLib.isNull(this.currentOrgCd)) {
          ComLib.openDialog('A', 'SYSI0010', ['조직을 선택해주세요.']);
          return false;
        }
        break;
        
      case 'SYS0010U01': // 조직 저장
        // 필수 필드 검증
        let orgCd = this.state.textFieldProps.iptOrgCd.value;
        let orgNm = this.state.textFieldProps.iptOrgNm.value;
        let missingFields = [];
        
        // 조직코드 검증
        if (StrLib.isNull(orgCd) || orgCd.trim() === '') {
          missingFields.push('조직코드');
        }
        
        // 조직명 검증
        if (StrLib.isNull(orgNm) || orgNm.trim() === '') {
          missingFields.push('조직명');
        }
        
        // 빈 필드가 있으면 통합 메시지 표시
        if (missingFields.length > 0) {
          ComLib.openDialog('A', 'SYSI0010', ['필수값을 입력해주세요.', `[${missingFields.join(', ')}]`]);
          return false;
        }
        
        // if( this.validation('SYS0010R01')){
        //   this.transaction('SYS0010R01');
        // }
        break;
        
      case 'SYS0010D01': // 조직 삭제
        console.log('🔍 SYS0010D01 Validation 시작');
        console.log('🔍 검증할 조직코드:', this.currentOrgCd);
        
        if (StrLib.isNull(this.currentOrgCd)) {
          console.log('❌ Validation 실패: 조직이 선택되지 않음');
          ComLib.openDialog('A', 'SYSI0010', ['삭제할 조직을 선택해주세요.']);
          return false;
        }
        
        // 하위 조직 존재 여부 확인
        console.log('🔍 하위 조직 존재 여부 확인 중...');
        if (this.hasChildOrganizations(this.currentOrgCd)) {
          console.log('❌ Validation 실패: 하위 조직 존재');
          ComLib.openDialog('A', 'SYSI0010', ['하위 조직이 존재하여 삭제할 수 없습니다.']);
          return false;
        }
        
        console.log('✅ SYS0010D01 Validation 통과');
        break;
        
      default:
        break;
    }
    return true;
  };
  
  // 서버 통신
  transaction = (...params) => {
    let transId = params[0];
    let transManager = new TransManager();
    
    try {
      switch (transId) {
        case 'SYS0010R01': // 조직 조회
          console.log('🚀 SYS0010R01 API 호출 시작');
          console.log('🌐 API URL: /api/cmm/ognz/r01');
          
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/ognz/r01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsOrgList'
          });
          
          // 검색 조건 데이터셋 구성
          let searchData = {
            ognzCdOrNm: this.state.textFieldProps.iptSrchOrgNm.value,
            useYn: this.state.selectboxProps.selSrchUseYn.value
          };
          
          console.log('📤 요청 데이터:', searchData);
          console.log('🔧 TransManager 설정 완료, agent() 호출 전');
          
          transManager.setFormData(searchData)
          
          try {
            transManager.agent();
            console.log('✅ agent() 호출 성공');
          } catch (agentError) {
            console.error('❌ agent() 호출 실패:', agentError);
            throw agentError;
          }
          break;
          
          case 'SYS0010R02': // 조직 상세정보 조회
          console.log('🚀 SYS0010R02 상세정보 API 호출 시작');
          console.log('🔑 조회할 조직코드:', this.currentOrgCd);
          
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/ognz/r02");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsOrgInfo'
          });
          
          // 상세정보 조회 조건 데이터셋 구성
          let detailSearchData = {
            ognzCd: this.currentOrgCd,
            ognzCdOrNm: '',  // SYS0010001Dto 필드
            useYn: ''        // SYS0010001Dto 필드
          };
          
          console.log('📤 상세정보 요청 데이터:', detailSearchData);
          
          transManager.setFormData(detailSearchData);
          transManager.agent(); // ← 실제 API 호출
          break;
          
        case 'SYS0010U01': // 조직 저장
          console.log('🚀 SYS0010U01 조직 저장 API 호출 시작');
          
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/ognz/u01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsOrgInfo'
          });
          
          // 저장할 조직 데이터
          let saveData = {
            ognzCd: this.state.textFieldProps.iptOrgCd.value,
            ognzNm: this.state.textFieldProps.iptOrgNm.value,
            upOgnzCd: this.state.textFieldProps.iptUpperOrgCd.value,
            hrOgnzCd : this.state.textFieldProps.iptHrOrgNo.value,
            ognzRprsTelNo: this.state.textFieldProps.iptRepTelNo.value,
            sortSn: parseInt(this.state.textFieldProps.iptSortOrder.value) || 0,
            useYn: this.state.textFieldProps.useYn.value
          };

          console.log('📤 저장 데이터:', saveData);
          console.log('🔍 필드별 상세 값 확인:');
          console.log('  - 조직코드:', saveData.ognzCd);
          console.log('  - 조직명:', saveData.ognzNm);
          console.log('  - 상위조직코드:', saveData.upOgnzCd);
          console.log('  - 인사조직번호:', saveData.hrOgnzNo, '(타입:', typeof saveData.hrOgnzNo, ')');
          console.log('  - 대표번호:', saveData.repTelNo, '(타입:', typeof saveData.repTelNo, ')');
          console.log('  - 정렬순서:', saveData.sortSn, '(타입:', typeof saveData.sortSn, ')');
          console.log('  - 사용여부:', saveData.useYn);
          
          // 빈 값 체크
          if (!saveData.hrOgnzNo || saveData.hrOgnzNo.trim() === '') {
            console.log('⚠️ 인사조직번호가 빈 값입니다.');
          }
          if (!saveData.repTelNo || saveData.repTelNo.trim() === '') {
            console.log('⚠️ 대표번호가 빈 값입니다.');
          }
          
          transManager.setFormData(saveData);
          transManager.agent();
          break;

        case 'SYS0010D01': // 조직 삭제
          console.log('🚀 SYS0010D01 Transaction 시작');
          console.log('🔍 삭제할 조직코드:', this.currentOrgCd);
          
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/ognz/d01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsOrgInfo'
          });
          
          // 삭제할 조직코드
          let deleteData = {
            ognzCd: this.currentOrgCd
          };
          
          console.log('📤 삭제 요청 데이터:', deleteData);
          console.log('🌐 API 요청 URL: /api/cmm/ognz/d01');
          
          transManager.setFormData(deleteData);
          
          console.log('🚀 서버로 삭제 요청 전송 시작...');
          transManager.agent();
          console.log('📡 transManager.agent() 호출 완료');
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error('❌ Transaction 에러 발생:', err);
      console.error('🔍 에러 상세 정보:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        transId: transId,
        timestamp: new Date().toISOString()
      });
      
      // 에러 유형별 구체적인 메시지 제공
      let errorMessage = '처리 중 오류가 발생했습니다.';
      
      if (err.name === 'NetworkError' || err.code === 'ERR_NETWORK') {
        errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
      } else if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        errorMessage = '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.name === 'TypeError') {
        errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.name === 'SyntaxError') {
        errorMessage = '서버 응답을 처리하는 중 오류가 발생했습니다.';
      } else if (transId === 'SYS0010D01') {
        errorMessage = '조직 삭제 중 오류가 발생했습니다.';
      } else if (transId === 'SYS0010U01') {
        errorMessage = '조직 저장 중 오류가 발생했습니다.';
      } else if (transId === 'SYS0010R01' || transId === 'SYS0010R02') {
        errorMessage = '조직 정보 조회 중 오류가 발생했습니다.';
      }
      
      console.log('📢 사용자에게 표시할 Transaction 에러 메시지:', errorMessage);
      
      // 에러 팝업 표시
      ComLib.openDialog('A', 'SYSI0010', [errorMessage]);
    }
  };
  
  // 응답 처리
  callback = (res) => {
    console.log('📥 API 응답 받음:', res);
    
    if (res.result) {
      switch (res.id) {
        case 'SYS0010R01': // 조직 조회 응답
          console.log('✅ 조직 조회 성공:', res);
          console.log('✅ 응답 데이터 구조:', res.data);
          
          // 응답 구조 확인 - 여러 가능성 대응
          let orgData = [];
          
          if (res.data && res.data.dsOrgList) {
            // 래핑된 형태: { data: { dsOrgList: [...] } }
            orgData = res.data.dsOrgList;
          } else if (Array.isArray(res.data)) {
            // 직접 배열 형태: [...] 
            orgData = res.data;
          } else if (res.data && Array.isArray(res.data.data)) {
            // 중첩된 형태: { data: { data: [...] } }
            orgData = res.data.data;
          }
          
          console.log('📋 추출된 조직 데이터:', orgData);
          
          if (!orgData || orgData.length === 0) {
            console.log('⚠️ 백엔드 데이터가 없어서 테스트 데이터 사용');
                          // 테스트 데이터 (다양한 useYn 값 포함)
              // orgData = [
              //   {
              //     ognzCd: 'ORG001',
              //     ognzNm: '본사',
              //     upOgnzCd: null,
              //     ognzLvl: 1,
              //     sortSn: 1,
              //     useYn: 'Y'
              //   },
              //   {
              //     ognzCd: 'ORG002',
              //     ognzNm: '개발팀',
              //     upOgnzCd: 'ORG001',
              //     ognzLvl: 2,
              //     sortSn: 1,
              //     useYn: 'Y'
              //   },
              //   {
              //     ognzCd: 'ORG003',
              //     ognzNm: '프론트엔드팀',
              //     upOgnzCd: 'ORG002',
              //     ognzLvl: 3,
              //     sortSn: 1,
              //     useYn: 'N'  // 테스트용으로 미사용
              //   },
              //   {
              //     ognzCd: 'ORG004',
              //     ognzNm: '영업팀',
              //     upOgnzCd: 'ORG001',
              //     ognzLvl: 2,
              //     sortSn: 2,
              //     useYn: 'Y'
              //   }
              // ];
          }
          
          console.log('🌳 Tree에 설정할 최종 데이터:', orgData);
          
          // 트리 데이터 설정
          this.state.dsOrgList.setRecords(orgData);
          this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
          this.setState({...this.state});
          break;
          
        case 'SYS0010R02': // 조직 상세정보 조회 응답
          console.log('✅ 조직 상세정보 조회 성공:', res);
          
          // 응답 구조 확인 - 여러 가능성 대응
          let orgInfo = null;
          
          if (res.data && res.data.dsOrgInfo) {
            // 래핑된 형태: { data: { dsOrgInfo: {...} } }
            orgInfo = Array.isArray(res.data.dsOrgInfo) ? res.data.dsOrgInfo[0] : res.data.dsOrgInfo;
          } else if (res.data && typeof res.data === 'object') {
            // 직접 객체 형태: {...}
            orgInfo = res.data;
          }
          
          console.log('📋 추출된 상세정보:', orgInfo);
          
          if (orgInfo) {
            this.setDetailFormData(orgInfo);
          }
          break;
          
        case 'SYS0010U01': // 조직 저장 응답
          console.log('✅ 조직 저장 성공');
          this.transaction('SYS0010R01');
          // 저장된 조직 정보 확인
          let savedOrgCd = this.state.textFieldProps.iptOrgCd.value;
          let wasNewMode = this.isNewMode;
          
          // 🔓 편집 모드 해제 (저장 성공 시)
          if (this.isEditMode) {
            console.log('🔓 편집 모드 해제:', {
              이전편집모드: this.isEditMode,
              이전편집조직: this.editingOrgCd
            });
            
            this.isEditMode = false;
            this.editingOrgCd = null;
            
            console.log('✅ 편집 모드 해제 완료');
          }
          
          // 🔓 신규 모드 해제 (저장 성공 시)
          if (this.isNewMode) {
            console.log('🔓 신규 모드 해제');
            this.isNewMode = false;
            console.log('✅ 신규 모드 해제 완료');
          }
          
          // 성공 메시지 표시
          let successMessage = wasNewMode ? '새로운 조직이 추가되었습니다.' : '조직 정보가 수정되었습니다.';
          ComLib.openDialog('A', 'SYSI0010', [successMessage]);
          
          // 저장 완료 후 처리
          console.log('🔄 저장 완료 후 새로고침 시작');
          
          // 1. 조직코드 필드를 disabled로 설정 (저장 완료 후 수정 불가)
          this.setState({
            ...this.state,
            textFieldProps: {
              ...this.state.textFieldProps,
              iptOrgCd: {
                ...this.state.textFieldProps.iptOrgCd,
                disabled: true  // 저장 완료 후 조직코드 수정 불가
              }
            }
          });
          
          // 2. 조직 목록 재조회
          this.transaction('SYS0010R01');
          
          // 3. 저장된 조직을 현재 선택으로 설정 (TEMP 코드에서 실제 코드로 변경될 수 있음)
          this.currentOrgCd = savedOrgCd;
          
          console.log('✅ 저장 완료 후 처리 완료:', {
            저장된조직: savedOrgCd,
            신규모드였음: wasNewMode,
            현재선택조직: this.currentOrgCd,
            조직코드필드: 'disabled로 설정됨'
          });
          
          break;
          
        case 'SYS0010D01': // 조직 삭제 응답
          console.log('✅ SYS0010D01 삭제 응답 성공');
          console.log('📥 삭제된 조직:', this.currentOrgCd);
          
          ComLib.openDialog('A', 'SYSI0010', ['삭제되었습니다.']);
          
          console.log('🧹 상세 폼 초기화 시작');
          this.clearDetailForm();
          
          console.log('🔄 조직 목록 재조회 시작');
          this.transaction('SYS0010R01'); // 트리 재조회
          break;
          
        default:
          break;
      }
    } else {
      // 에러 처리
      console.log('❌ API 응답 실패:', res);
      console.log('🔍 에러 상세 분석:', {
        id: res.id,
        result: res.result,
        message: res.message,
        data: res.data,
        status: res.status,
        statusText: res.statusText,
        전체응답: res
      });
      
      // 삭제 API 실패 특별 처리
      if (res.id === 'SYS0010D01') {
        console.log('🚨 조직 삭제 API 실패:', {
          조직코드: this.currentOrgCd,
          에러메시지: res.message,
          HTTP상태: res.status,
          응답데이터: res.data,
          상세에러: res
        });
        
        // 삭제 전용 에러 메시지 처리
        let deleteErrorMessage = '조직 삭제에 실패했습니다.';
        
        if (res.message) {
          deleteErrorMessage = res.message;
        } else if (res.data && res.data.message) {
          deleteErrorMessage = res.data.message;
        } else if (res.status === 404) {
          deleteErrorMessage = '삭제할 조직을 찾을 수 없습니다.';
        } else if (res.status === 403) {
          deleteErrorMessage = '조직 삭제 권한이 없습니다.';
        } else if (res.status === 500) {
          deleteErrorMessage = '서버 내부 오류가 발생했습니다.';
        } else if (!res.status) {
          deleteErrorMessage = '서버에 연결할 수 없습니다.';
        }
        
        console.log('📢 사용자에게 표시할 삭제 에러 메시지:', deleteErrorMessage);
        ComLib.openDialog('A', 'SYSI0010', [deleteErrorMessage]);
        return; // 여기서 리턴하여 아래 공통 에러 처리 건너뛰기
      }
      
      // API 실패 시에도 테스트 데이터 표시
      if (res.id === 'SYS0010R01') {
        console.log('⚠️ API 실패로 테스트 데이터 사용');
        let testData = [
          {
            ognzCd: 'ORG001',
            ognzNm: '본사',
            upOgnzCd: null,
            ognzLvl: 1,
            sortSn: 1
          },
          {
            ognzCd: 'ORG002',
            ognzNm: '개발팀',
            upOgnzCd: 'ORG001',
            ognzLvl: 2,
            sortSn: 1
          },
          {
            ognzCd: 'ORG003',
            ognzNm: '프론트엔드팀',
            upOgnzCd: 'ORG002',
            ognzLvl: 3,
            sortSn: 1
          },
          {
            ognzCd: 'ORG004',
            ognzNm: '영업팀',
            upOgnzCd: 'ORG001',
            ognzLvl: 2,
            sortSn: 2
          }
        ];
        
        this.state.dsOrgList.setRecords(testData);
        this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
        this.setState({...this.state});
              } else if (res.id === 'SYS0010R02') {
          console.log('⚠️ 상세정보 API 실패로 테스트 데이터 사용');
          
          // 현재 선택된 조직에 따라 다른 테스트 데이터 제공
          let useYnValue = 'Y';
          let orgName = '테스트 조직';
          
          if (this.currentOrgCd === 'ORG003') {
            useYnValue = 'N';  // 프론트엔드팀은 미사용으로 테스트
            orgName = '프론트엔드팀';
          } else if (this.currentOrgCd === 'ORG001') {
            orgName = '본사';
          } else if (this.currentOrgCd === 'ORG002') {
            orgName = '개발팀';
          } else if (this.currentOrgCd === 'ORG004') {
            orgName = '영업팀';
          }
          
          let testDetailData = {
            ognzCd: this.currentOrgCd || 'ORG001',
            ognzNm: orgName,
            upOgnzCd: this.currentOrgCd === 'ORG001' ? null : 'ORG001',
            ognzLvl: this.currentOrgCd === 'ORG001' ? 1 : 2,
            hrOgnzCd: 'HR001',
            ognzRprsTelNo: '02-1234-5678',
            sortSn: 1,
            useYn: useYnValue  // 동적으로 설정
          };
          
          console.log('📋 생성된 테스트 상세정보:', testDetailData);
          this.setDetailFormData(testDetailData);
        }
      
      // 공통 에러 메시지 처리
      let errorMessage = '처리 중 오류가 발생했습니다.';
      
      // 에러 메시지 우선순위: res.message > res.data.message > HTTP 상태별 메시지 > 기본 메시지
      if (res.message) {
        errorMessage = res.message;
      } else if (res.data && res.data.message) {
        errorMessage = res.data.message;
      } else if (res.status === 400) {
        errorMessage = '잘못된 요청입니다.';
      } else if (res.status === 401) {
        errorMessage = '인증이 필요합니다.';
      } else if (res.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (res.status === 404) {
        errorMessage = '요청한 리소스를 찾을 수 없습니다.';
      } else if (res.status === 500) {
        errorMessage = '서버 내부 오류가 발생했습니다.';
      } else if (res.status === 502) {
        errorMessage = '서버 게이트웨이 오류가 발생했습니다.';
      } else if (res.status === 503) {
        errorMessage = '서비스를 사용할 수 없습니다.';
      } else if (!res.status) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
      }
      
      console.log('📢 사용자에게 표시할 에러 메시지:', errorMessage);
      console.log('🔧 에러 메시지 결정 과정:', {
        'res.message': res.message,
        'res.data.message': res.data ? res.data.message : '없음',
        'res.status': res.status,
        '최종메시지': errorMessage
      });
      
      ComLib.openDialog('A', 'SYSI0010', [errorMessage]);
    }
  };
  
  // 상세 폼 데이터 설정
  setDetailFormData = (orgInfo) => {
    console.log('📝 상세 폼 데이터 설정 시작:', orgInfo);
    
    // 각 필드별로 어떤 값이 설정되는지 확인
    const formData = {
      ognzCd: orgInfo.ognzCd || '',
      ognzNm: orgInfo.ognzNm || '',
      upOgnzCd: orgInfo.upOgnzCd || '',
      hrOgnzCd: orgInfo.hrOgnzCd || '',
      ognzRprsTelNo: orgInfo.ognzRprsTelNo || '',
      sortSn: orgInfo.sortSn || '',
      useYn: orgInfo.useYn || 'Y'
    };
    
    console.log('📋 설정할 폼 데이터:', formData);
    
    this.setState({
      ...this.state,
      textFieldProps: {
        ...this.state.textFieldProps,
        iptOrgCd: {
          ...this.state.textFieldProps.iptOrgCd,
          value: formData.ognzCd,
          disabled: true  // 기존 조직 코드는 수정 불가능
        },
        iptOrgNm: {
          ...this.state.textFieldProps.iptOrgNm,
          value: formData.ognzNm
        },
        iptUpperOrgCd: {
          ...this.state.textFieldProps.iptUpperOrgCd,
          value: formData.upOgnzCd
        },
        iptHrOrgNo: {
          ...this.state.textFieldProps.iptHrOrgNo,
          value: formData.hrOgnzCd
        },
        iptRepTelNo: {
          ...this.state.textFieldProps.iptRepTelNo,
          value: formData.ognzRprsTelNo
        },
        iptSortOrder: {
          ...this.state.textFieldProps.iptSortOrder,
          value: formData.sortSn
        },
        useYn: {
          ...this.state.textFieldProps.useYn,
          value: formData.useYn
        }
      },
      selectboxProps: {
        ...this.state.selectboxProps,
        selUseYn: {
          ...this.state.selectboxProps.selUseYn,
          value: formData.useYn,
          selected: formData.useYn === 'N' ? 1 : 0
        }
      }
    }, () => {
      console.log('✅ 상세 폼 상태 업데이트 완료');
      console.log('📄 업데이트된 textFieldProps:', this.state.textFieldProps);
      // 테이블 데이터 업데이트 — React18 자동배칭으로 setState 직후엔 state가 아직 갱신 전이라
      // 반드시 콜백 안에서 호출해야 갱신된 textFieldProps 기준으로 Textfield가 빌드됨(상세 표시)
      this.updateDetailTableData(orgInfo);
    });
  };
  
  // 상세 폼 초기화
  clearDetailForm = () => {
    this.setState({
      ...this.state,
      textFieldProps: {
        ...this.state.textFieldProps,
        iptOrgCd: { ...this.state.textFieldProps.iptOrgCd, value: '', disabled: true },
        iptOrgNm: { ...this.state.textFieldProps.iptOrgNm, value: '' },
        iptUpperOrgCd: { ...this.state.textFieldProps.iptUpperOrgCd, value: '' },
        iptHrOrgNo: { ...this.state.textFieldProps.iptHrOrgNo, value: '' },
        iptRepTelNo: { ...this.state.textFieldProps.iptRepTelNo, value: '' },
        iptSortOrder: { ...this.state.textFieldProps.iptSortOrder, value: '' },
        useYn: { ...this.state.textFieldProps.useYn, value: 'Y' }
      },
      selectboxProps: {
        ...this.state.selectboxProps,
        selUseYn: {
          ...this.state.selectboxProps.selUseYn,
          value: 'Y',
          selected: 0
        }
      }
    }, () => {
      // React18 배칭: 갱신된 textFieldProps 기준으로 빈 Textfield 재빌드
      this.updateDetailTableData({});
    });

    this.currentOrgCd = '';
  };
  
  // 테이블 데이터 업데이트
  updateDetailTableData = (orgInfo) => {
    const updatedTableData = [
      [
        { type: 'T', value: '조직코드', className: 'req', required: true, colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptOrgCd} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '조직명', className: 'req', required: true, colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptOrgNm} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '상위조직', colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptUpperOrgCd} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '인사조직번호', colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptHrOrgNo} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '대표번호', colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptRepTelNo} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '사용여부', colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Selectbox {...this.state.selectboxProps.selUseYn} onChange={this.event.selectbox.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ],
      [
        { type: 'T', value: '정렬순서', colSpan: 1, rowSpan: 1 },
        { 
          type: 'D', 
          value: <Textfield {...this.state.textFieldProps.iptSortOrder} onChange={this.event.input.onChange} />, 
          colSpan: 1, 
          rowSpan: 1 
        }
      ]
    ];
    
    this.setState({
      ...this.state,
      detailTableData: updatedTableData
    });
  };

  // 주어진 조직의 모든 하위 조직들의 마지막 인덱스를 찾는 함수
  findLastDescendantIndex = (records, parentOrgCd, startIndex) => {
    let lastIndex = startIndex;
    
    console.log('🔍 findLastDescendantIndex 호출:', {
      상위조직코드: parentOrgCd,
      시작인덱스: startIndex,
      전체레코드수: records.length
    });
    
    // 현재 조직의 직접 하위 조직들을 찾음
    for (let i = startIndex + 1; i < records.length; i++) {
      let record = records[i];
      
      // 직접 하위 조직인 경우
      if (record.upOgnzCd === parentOrgCd) {
        lastIndex = i;
        console.log('  ✅ 하위조직 발견:', {
          인덱스: i,
          조직코드: record.ognzCd,
          조직명: record.ognzNm
        });
        
        // 이 하위 조직의 모든 하위 조직들도 재귀적으로 찾음
        let descendantLastIndex = this.findLastDescendantIndex(records, record.ognzCd, i);
        lastIndex = Math.max(lastIndex, descendantLastIndex);
      }
    }
    
    console.log('  📍 findLastDescendantIndex 결과:', {
      상위조직코드: parentOrgCd,
      마지막인덱스: lastIndex
    });
    
    return lastIndex;
  };

  // 하위 조직 존재 여부를 확인하는 함수
  hasChildOrganizations = (orgCd) => {
    const records = this.state.dsOrgList.getRecords();
    
    console.log('🔍 하위조직 존재 여부 확인:', {
      조직코드: orgCd,
      전체레코드수: records.length
    });
    
    // 해당 조직을 상위조직으로 하는 하위 조직들을 찾음
    const childOrgs = records.filter(record => record.upOgnzCd === orgCd);
    
    console.log('📋 하위조직 검색 결과:', {
      조직코드: orgCd,
      하위조직수: childOrgs.length,
      하위조직목록: childOrgs.map(org => ({
        조직코드: org.ognzCd,
        조직명: org.ognzNm
      }))
    });
    
    return childOrgs.length > 0;
  };

  // 미저장 데이터 리셋 메서드
  resetUnsavedData = () => {
    console.log('🔄 미저장 데이터 리셋 시작');
    
    if (!this.isEditMode || !this.editingOrgCd) {
      console.log('⚠️ 편집 모드가 아니거나 편집 중인 조직이 없음');
      return;
    }
    
    // 1. 편집 중인 임시 조직 데이터 제거
    let orgRecords = this.state.dsOrgList.getRecords();
    let filteredRecords = orgRecords.filter(record => record.ognzCd !== this.editingOrgCd);
    
    console.log('🗑️ 임시 조직 데이터 제거:', {
      편집중인조직: this.editingOrgCd,
      제거전개수: orgRecords.length,
      제거후개수: filteredRecords.length
    });
    
    // 2. 데이터셋 업데이트
    this.state.dsOrgList.setRecords(filteredRecords);
    this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
    
    // 3. 폼 초기화
    this.clearDetailForm();
    
    // 4. 편집 모드 해제
    this.isEditMode = false;
    this.editingOrgCd = null;
    
    // 5. 현재 선택 초기화
    this.currentOrgCd = '';
    this.currentIndex = -1;
    
    // 6. 상태 업데이트
    this.setState({
      ...this.state,
      treeProps: {
        ...this.state.treeProps,
        treeOrgList: {
          ...this.state.treeProps.treeOrgList,
          data: this.state.dsOrgList
        }
      }
    }, () => {
      this.updateDetailTableData({});
      console.log('✅ 미저장 데이터 리셋 완료');
    });
  };

  // 리셋 버튼 핸들러 (새로고침처럼 동작)
  handleReset = () => {
    console.log('🔄 화면 리셋 시작 (새로고침 방식)');
    
    // 편집 모드 즉시 해제
    this.isEditMode = false;
    this.editingOrgCd = null;
    
    // 신규 모드 해제
    this.isNewMode = false;
    
    // 현재 선택 정보 초기화
    this.currentOrgCd = null;
    this.currentIndex = -1;
    
    // Tree 컴포넌트 강제 리셋을 위한 새로운 키 생성
    this.treeKey = Date.now();
    
    // 검색 조건 및 상세 정보 모두 초기화
    this.setState({
      ...this.state,
      // 검색 조건 초기화
      textFieldProps: {
        ...this.state.textFieldProps,
        iptSrchOrgNm: {
          ...this.state.textFieldProps.iptSrchOrgNm,
          value: ''
        },
        // 상세 정보 필드들도 함께 초기화
        iptOrgCd: { ...this.state.textFieldProps.iptOrgCd, value: '' },
        iptOrgNm: { ...this.state.textFieldProps.iptOrgNm, value: '' },
        iptUpperOrgCd: { ...this.state.textFieldProps.iptUpperOrgCd, value: '' },
        iptHrOrgNo: { ...this.state.textFieldProps.iptHrOrgNo, value: '' },
        iptRepTelNo: { ...this.state.textFieldProps.iptRepTelNo, value: '' },
        iptSortOrder: { ...this.state.textFieldProps.iptSortOrder, value: '' },
        useYn: { ...this.state.textFieldProps.useYn, value: 'Y' }
      },
      selectboxProps: {
        ...this.state.selectboxProps,
        selSrchUseYn: {
          ...this.state.selectboxProps.selSrchUseYn,
          value: 'Y',
          selected: 1
        },
        // 상세 정보 사용여부 selectbox도 초기화
        selUseYn: {
          ...this.state.selectboxProps.selUseYn,
          value: 'Y',
          selected: 0
        }
      }
    }, () => {
      // 상세 테이블 데이터 업데이트 (초기화된 값들로)
      this.updateDetailTableData({});
      
      // 조직 목록 재조회 (새로고침 효과)
      console.log('🔄 조직 목록 재조회 시작 - Tree 선택 상태 및 상세 정보 모두 초기화됨');
      if (this.validation('SYS0010R01')) {
        this.transaction('SYS0010R01');
      }
      
      console.log('✅ 화면 리셋 완료 (새로고침 효과 + 상세 정보 초기화)');
    });
  };

  // 리셋 후 선택한 조직으로 이동
  selectOrgAfterReset = (event) => {
    console.log('🔄 리셋 후 조직 선택 시작', event);
    
    if (!event || !event.data) {
      console.log('⚠️ 이벤트 데이터가 없음');
      return;
    }
    
    let selectedOrgCd = event.data.ognzCd || event.data.ID;
    this.currentOrgCd = selectedOrgCd;
    
    // 실제 배열에서의 인덱스 찾기
    let currentRecords = this.state.dsOrgList.getRecords();
    this.currentIndex = currentRecords.findIndex(record => record.ognzCd === selectedOrgCd);
    
    console.log('🔑 리셋 후 조직 선택:', {
      선택조직: selectedOrgCd,
      인덱스: this.currentIndex
    });
    
    if (!selectedOrgCd) {
      console.log('⚠️ 선택할 조직코드가 없음');
      return;
    }
    
    // 임시 조직 vs 기존 조직 판단
    const isTemporaryOrg = selectedOrgCd.startsWith('AICC_');
    
    if (isTemporaryOrg) {
      // 임시 조직 처리
      console.log('🏗️ 임시 조직 선택');
      const orgData = currentRecords.find(record => record.ognzCd === selectedOrgCd);
      
      if (orgData) {
        this.setState({
          ...this.state,
          textFieldProps: {
            ...this.state.textFieldProps,
            iptOrgCd: {
              ...this.state.textFieldProps.iptOrgCd,
              value: orgData.ognzCd
            },
            iptOrgNm: {
              ...this.state.textFieldProps.iptOrgNm,
              value: orgData.ognzNm || ''
            },
            iptUpperOrgCd: {
              ...this.state.textFieldProps.iptUpperOrgCd,
              value: orgData.upOgnzCd || ''
            },
            iptHrOrgNo: {
              ...this.state.textFieldProps.iptHrOrgNo,
              value: ''
            },
            iptRepTelNo: {
              ...this.state.textFieldProps.iptRepTelNo,
              value: ''
            },
            iptSortOrder: {
              ...this.state.textFieldProps.iptSortOrder,
              value: orgData.sortSn ? orgData.sortSn.toString() : ''
            },
            useYn: {
              ...this.state.textFieldProps.useYn,
              value: orgData.useYn || 'Y'
            }
          },
          selectboxProps: {
            ...this.state.selectboxProps,
            selUseYn: {
              ...this.state.selectboxProps.selUseYn,
              value: orgData.useYn || 'Y',
              selected: (orgData.useYn === 'N') ? 1 : 0
            }
          }
        }, () => {
          this.updateDetailTableData({});
          console.log('✅ 임시 조직 폼 설정 완료');
        });
      }
    } else {
      // 기존 조직 처리
      console.log('🏢 기존 조직 선택 - API 호출');
      if (this.validation('SYS0010R02')) {
        this.transaction('SYS0010R02');
      }
    }
  };
  
  // 이벤트 핸들러
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;
        
        switch (btnId) {
          case 'btnSearch':
            if (this.validation('SYS0010R01')) {
              this.transaction('SYS0010R01');
            }
            break;
            
            case 'btnAddOrg':
            console.log('🔄 조직 추가 시작');
            
            // 🔒 편집 모드 중복 실행 방지
            if (this.isEditMode) {
              console.log('⚠️ 이미 조직 추가 중입니다.');
              ComLib.openDialog('A', 'SYSI0010', ['이미 조직 추가 중입니다.', '현재 작업을 완료 후 시도해주세요.']);
              return;
            }
            
            console.log('🔄 버튼 클릭 시점의 this.currentOrgCd:', this.currentOrgCd);
            
            // 연속 클릭 방지를 위한 버튼 비활성화
            this.setState({
              ...this.state,
              btnProps: {
                ...this.state.btnProps,
                btnAddOrg: {
                  ...this.state.btnProps.btnAddOrg,
                  disabled: true
                }
              }
            });
            
            // 현재 선택된 조직 코드를 안전하게 보존
            let selectedOrgCd = this.currentOrgCd;
            
            // 현재 데이터에서 실제 선택된 조직 찾기
            let orgRecords = this.state.dsOrgList.getRecords();
            
            console.log('🔍 선택된 조직 정보:', {
              selectedOrgCd: selectedOrgCd,
              isTemp: selectedOrgCd?.startsWith('TEMP_'),
              orgRecords: orgRecords.map(r => ({코드: r.ognzCd, 이름: r.ognzNm, 상위: r.upOgnzCd}))
            });
            let actualSelectedIndex = orgRecords.findIndex(record => record.ognzCd === selectedOrgCd);
            
            // 1. 선택된 조직 확인
            if (!selectedOrgCd || actualSelectedIndex === -1) {
              console.log('⚠️ 선택된 조직이 없음 - 최상위 조직 추가 확인');
              
              // 최상위 조직 추가 확인 다이얼로그
              ComLib.openDialog('C', 'SYSI0010', ['최상위 조직을 추가하시겠습니까?'], (result) => {
                console.log('💬 최상위 조직 추가 확인 결과:', result);
                
                if (result === true || result === 'Y') {
                  console.log('✅ 최상위 조직 추가 진행');
                  
                  // 최상위 조직 추가 로직
                  this.clearDetailForm();
                  this.maxTempCd++;
                  let tempOrgCd = `TEMP_${String(this.maxTempCd).padStart(3, '0')}`;
                  
                  // 최상위 조직의 sortSn 계산 (기존 최상위 조직 중 최대값 + 1)
                  let topLevelOrgs = orgRecords.filter(record => !record.upOgnzCd || record.upOgnzCd === null || record.upOgnzCd === '');
                  let newSortSn = 1;
                  if (topLevelOrgs.length > 0) {
                    newSortSn = Math.max(...topLevelOrgs.map(org => org.sortSn || 0)) + 1;
                  }
                  
                  // 최상위 조직 데이터 생성
                  let newOrgData = {
                    ognzCd: tempOrgCd,
                    ognzNm: '',
                    upOgnzCd: null,
                    ognzLvl: 1,
                    sortSn: newSortSn,
                    useYn: 'Y',
                    rowtype: 'C'
                  };
                  
                  // 맨 마지막에 추가
                  orgRecords.push(newOrgData);
                  this.state.dsOrgList.setRecords(orgRecords);
                  this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
                  
                  // 폼 상태 업데이트
                  this.setState({
                    ...this.state,
                    textFieldProps: {
                      ...this.state.textFieldProps,
                      iptOrgCd: {
                        ...this.state.textFieldProps.iptOrgCd,
                        value: tempOrgCd,
                        disabled: false
                      },
                      iptOrgNm: {
                        ...this.state.textFieldProps.iptOrgNm,
                        value: ''
                      },
                      iptUpperOrgCd: {
                        ...this.state.textFieldProps.iptUpperOrgCd,
                        value: ''
                      },
                      iptHrOrgNo: {
                        ...this.state.textFieldProps.iptHrOrgNo,
                        value: ''
                      },
                      iptRepTelNo: {
                        ...this.state.textFieldProps.iptRepTelNo,
                        value: ''
                      },
                      iptSortOrder: {
                        ...this.state.textFieldProps.iptSortOrder,
                        value: newSortSn.toString()
                      },
                      useYn: {
                        ...this.state.textFieldProps.useYn,
                        value: 'Y'
                      }
                    },
                    selectboxProps: {
                      ...this.state.selectboxProps,
                      selUseYn: {
                        ...this.state.selectboxProps.selUseYn,
                        value: 'Y',
                        selected: 0
                      }
                    },
                    btnProps: {
                      ...this.state.btnProps,
                      btnAddOrg: {
                        ...this.state.btnProps.btnAddOrg,
                        disabled: false
                      }
                    }
                  }, () => {
                    this.updateDetailTableData({});
                    console.log('✅ 최상위 조직 추가 완료');
                  });
                  
                  // 새로 추가된 조직을 현재 선택으로 설정
                  this.currentOrgCd = tempOrgCd;
                  this.currentIndex = orgRecords.length - 1;
                  
                  // 편집 모드 설정
                  this.isEditMode = true;
                  this.editingOrgCd = tempOrgCd;
                  
                  console.log('✅ 최상위 조직 추가 완료:', {
                    새조직코드: tempOrgCd,
                    정렬순서: newSortSn,
                    편집모드: this.isEditMode
                  });
                } else {
                  console.log('❌ 최상위 조직 추가 취소');
                  
                  // 버튼 다시 활성화
                  this.setState({
                    ...this.state,
                    btnProps: {
                      ...this.state.btnProps,
                      btnAddOrg: {
                        ...this.state.btnProps.btnAddOrg,
                        disabled: false
                      }
                    }
                  });
                }
              });
              
              return;
            }
            
            // 2. 폼 초기화 및 임시 코드 생성
            this.clearDetailForm();
            this.maxTempCd++;
            let tempOrgCd = `TEMP_${String(this.maxTempCd).padStart(3, '0')}`;
            
            // 3. 현재 데이터 및 선택된 조직 정보 가져오기 (보존된 선택 조직 사용)
            let selectedOrgInfo = orgRecords.find(record => record.ognzCd === selectedOrgCd);
            
            // 4. 새로운 조직의 sortSn 계산
            let newSortSn = 1;
            if (selectedOrgInfo) {
              let childOrgs = orgRecords.filter(record => record.upOgnzCd === selectedOrgCd);
              if (childOrgs.length > 0) {
                newSortSn = Math.max(...childOrgs.map(org => org.sortSn || 0)) + 1;
              }
            }
            
            // 5. 새로운 조직 데이터 생성
            let newOrgData = {
              ognzCd: tempOrgCd,
              ognzNm: '',
              upOgnzCd: selectedOrgCd,
              ognzLvl: selectedOrgInfo ? (selectedOrgInfo.ognzLvl || 0) + 1 : 1,
              sortSn: newSortSn,
              useYn: 'Y',
              rowtype: 'C'
            };
            
            // 6. 삽입 위치 계산
            let insertIndex = actualSelectedIndex + 1; // 기본값: 현재 선택된 조직 바로 다음
            
            // 현재 선택된 조직에 하위 조직이 있는지 확인
            let hasChildren = orgRecords.some(record => record.upOgnzCd === selectedOrgCd);
            
            console.log('🔍 삽입 위치 계산:', {
              보존된선택조직: selectedOrgCd,
              실제인덱스: actualSelectedIndex,
              하위조직있음: hasChildren,
              전체레코드수: orgRecords.length
            });
            
            if (hasChildren) {
              // 자식이 있는 경우: 모든 하위 조직의 마지막 다음에 삽입
              let lastDescendantIndex = this.findLastDescendantIndex(orgRecords, selectedOrgCd, actualSelectedIndex);
              insertIndex = lastDescendantIndex + 1;
              console.log('✅ 하위조직 있음 → 마지막 하위조직 다음에 삽입:', insertIndex);
            } else {
              // 자식이 없는 경우: 바로 다음에 삽입
              insertIndex = actualSelectedIndex + 1;
              console.log('✅ 하위조직 없음 → 바로 다음에 삽입:', insertIndex);
            }
            
            // 삽입 위치 유효성 검사
            if (insertIndex > orgRecords.length) {
              insertIndex = orgRecords.length;
              console.log('⚠️ 삽입 위치 조정 → 맨 마지막으로:', insertIndex);
            }
            
            // 7. 데이터 삽입 및 업데이트
            orgRecords.splice(insertIndex, 0, newOrgData);
            this.state.dsOrgList.setRecords(orgRecords);
            this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
            
            // 8. 폼 상태 업데이트 및 버튼 다시 활성화
            this.setState({
              ...this.state,
              textFieldProps: {
                ...this.state.textFieldProps,
                iptOrgCd: {
                  ...this.state.textFieldProps.iptOrgCd,
                  value: tempOrgCd,
                  disabled: false // 조직 추가 시에는 조직코드 입력 가능 (TEMP 코드)
                },
                iptOrgNm: {
                  ...this.state.textFieldProps.iptOrgNm,
                  value: '' // 조직명은 사용자가 입력
                },
                iptUpperOrgCd: {
                  ...this.state.textFieldProps.iptUpperOrgCd,
                  value: selectedOrgCd
                },
                iptHrOrgNo: {
                  ...this.state.textFieldProps.iptHrOrgNo,
                  value: '' // 인사조직번호는 비워둠
                },
                iptRepTelNo: {
                  ...this.state.textFieldProps.iptRepTelNo,
                  value: '' // 대표번호는 비워둠
                },
                iptSortOrder: {
                  ...this.state.textFieldProps.iptSortOrder,
                  value: newSortSn.toString() // 🔥 계산된 정렬순서 설정
                },
                useYn: {
                  ...this.state.textFieldProps.useYn,
                  value: 'Y' // 사용여부 기본값
                }
              },
              selectboxProps: {
                ...this.state.selectboxProps,
                selUseYn: {
                  ...this.state.selectboxProps.selUseYn,
                  value: 'Y',
                  selected: 0
                }
              },
              btnProps: {
                ...this.state.btnProps,
                btnAddOrg: {
                  ...this.state.btnProps.btnAddOrg,
                  disabled: false // 버튼 다시 활성화
                }
              }
            }, () => {
              // 🔄 핵심: setState 완료 후 Table 데이터 재생성
              this.updateDetailTableData({});
              console.log('✅ 조직추가 후 Table 데이터 업데이트 완료');
            });
            
            // 9. 새로 추가된 조직을 현재 선택으로 설정
            this.currentOrgCd = tempOrgCd;
            // 삽입 후 실제 인덱스 재계산 (배열이 변경되었으므로)
            this.currentIndex = orgRecords.findIndex(record => record.ognzCd === tempOrgCd);
            
            // 🔒 편집 모드 설정 (미저장 데이터 보호)
            this.isEditMode = true;
            this.editingOrgCd = tempOrgCd;
            
            console.log('✅ 조직 추가 완료:', {
              새조직코드: tempOrgCd,
              상위조직: selectedOrgInfo?.ognzNm,
              삽입위치: insertIndex,
              정렬순서: newSortSn,
              보존된선택조직: selectedOrgCd,
              새로운현재선택: this.currentOrgCd,
              새로운현재인덱스: this.currentIndex,
              편집모드: this.isEditMode
            });
            break;
                                case 'btnNew':
            console.log('🆕 신규 버튼 클릭 - 신규 모드 활성화');
            
            // 현재 상위조직 값 보존 (기존 상위조직 정보를 그대로 유지)
            let preservedUpperOrgCd = this.state.textFieldProps.iptUpperOrgCd.value;
            
            // 기존 조직코드 값 보존
            let preservedOrgCd = this.state.textFieldProps.iptOrgCd.value;
            
            console.log('🔄 보존할 값들:', {
              현재선택조직: this.currentOrgCd,
              기존상위조직: this.state.textFieldProps.iptUpperOrgCd.value,
              보존될상위조직: preservedUpperOrgCd,
              기존조직코드: preservedOrgCd,
              보존될조직코드: preservedOrgCd
            });
            
            // 신규 모드 활성화 (currentOrgCd는 유지)
            this.isNewMode = true;
            this.isEditMode = false; // 편집 모드는 해제
            this.editingOrgCd = null;
            
            // 상위조직을 제외한 모든 필드 초기화
            this.setState({
              ...this.state,
              textFieldProps: {
                ...this.state.textFieldProps,
                iptOrgCd: {
                  ...this.state.textFieldProps.iptOrgCd,
                  value: preservedOrgCd, // 기존 조직코드 보존
                  disabled: true // 신규 모드에서도 조직코드 수정 불가
                },
                iptOrgNm: { 
                  ...this.state.textFieldProps.iptOrgNm, 
                  value: '' // 조직명 초기화
                },
                iptUpperOrgCd: { 
                  ...this.state.textFieldProps.iptUpperOrgCd, 
                  value: preservedUpperOrgCd // 상위조직 보존
                },
                iptHrOrgNo: { 
                  ...this.state.textFieldProps.iptHrOrgNo, 
                  value: '' // 인사조직번호 초기화
                },
                iptRepTelNo: { 
                  ...this.state.textFieldProps.iptRepTelNo, 
                  value: '' // 대표번호 초기화
                },
                iptSortOrder: { 
                  ...this.state.textFieldProps.iptSortOrder, 
                  value: '' // 정렬순서 초기화
                },
                useYn: {
                  ...this.state.textFieldProps.useYn,
                  value: 'Y' // 사용여부 기본값
                }
              },
              selectboxProps: {
                ...this.state.selectboxProps,
                selUseYn: {
                  ...this.state.selectboxProps.selUseYn,
                  value: 'Y',
                  selected: 0 // 'Y' 선택
                }
              }
            }, () => {
              // setState 완료 후 테이블 데이터 업데이트
              this.updateDetailTableData({});
              console.log('✅ 신규 모드 활성화 완료 (기존 조직코드 및 상위조직 보존, disabled 상태)');
            });
            break;
            
          case 'btnTestData':
            // 테스트 데이터 강제 로드
            console.log('🧪 테스트 데이터 강제 로드');
            let testData = [
              {
                ognzCd: 'ORG001',
                ognzNm: '본사',
                upOgnzCd: null,
                ognzLvl: 1,
                sortSn: 1
              },
              {
                ognzCd: 'ORG002',
                ognzNm: '개발팀',
                upOgnzCd: 'ORG001',
                ognzLvl: 2,
                sortSn: 1
              },
              {
                ognzCd: 'ORG003',
                ognzNm: '프론트엔드팀',
                upOgnzCd: 'ORG002',
                ognzLvl: 3,
                sortSn: 1
              },
              {
                ognzCd: 'ORG004',
                ognzNm: '영업팀',
                upOgnzCd: 'ORG001',
                ognzLvl: 2,
                sortSn: 2
              },
              {
                ognzCd: 'ORG005',
                ognzNm: '지사',
                upOgnzCd: null,
                ognzLvl: 1,
                sortSn: 2
              }
            ];
            
            // this.state.dsOrgList.setRecords(testData);
            this.state.treeProps.treeOrgList.data = this.state.dsOrgList;
            this.setState({...this.state});
            break;
            
          case 'btnTestDetail':
            // 상세 정보 테스트 데이터
            console.log('🧪 상세 정보 테스트 데이터 설정');
            let testDetailData = {
              ognzCd: 'ORG001',
              ognzNm: '본사',
              upOgnzCd: null,
              ognzLvl: 1,
              hrOgnzCd: 'HR001',
              ognzRprsTelNo: '02-1234-5678',
              sortSn: 1,
              useYn: 'Y'
            };
            this.setDetailFormData(testDetailData);
            break;
            
          case 'btnTestApi':
            // API 직접 호출 테스트
            console.log('🧪 API 직접 호출 테스트 시작');
            this.currentOrgCd = 'ORG001'; // 테스트용 조직코드 설정
            console.log('🔑 테스트용 조직코드 설정:', this.currentOrgCd);
            
            if (this.validation('SYS0010R02')) {
              console.log('✅ validation 통과 - API 호출 시작');
              this.transaction('SYS0010R02');
            } else {
              console.log('❌ validation 실패');
            }
            break;
            
          case 'btnSave':
            if (this.validation('SYS0010U01')) {
              this.transaction('SYS0010U01');
            }
            break;
            
          case 'btnDelete':
            console.log('🗑️ 삭제 버튼 클릭됨');
            console.log('🔍 현재 선택된 조직:', this.currentOrgCd);
            
            if (this.validation('SYS0010D01')) {
              console.log('✅ Validation 통과 - 확인 다이얼로그 표시');
              ComLib.openDialog('C', 'SYSI0010', ['선택된 조직을 삭제하시겠습니까?'], (result) => {
                console.log('💬 사용자 선택 결과:', result, '(타입:', typeof result, ')');
                if (result === true || result === 'Y') {
                  console.log('✅ 사용자가 예 선택 - 삭제 API 호출 시작');
                  this.transaction('SYS0010D01');
                } else {
                  console.log('❌ 사용자가 취소 선택 - 삭제 중단');
                }
              });
            } else {
              console.log('❌ Validation 실패 - 삭제 중단');
            }
            break;
            
          case 'btnReset':
            console.log('🔄 리셋 버튼 클릭');
            this.handleReset();
            break;
            

            
          default:
            break;
        }
      }
    },
    
    input: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;
        
        console.log('📝 Input 변경 이벤트 발생:', { fieldId, value });
        
        // 인사조직번호와 대표번호 필드 특별 로그
        if (fieldId === 'iptHrOrgNo') {
          console.log('🏢 인사조직번호 변경됨:', {
            필드ID: fieldId,
            이전값: this.state.textFieldProps[fieldId]?.value,
            신규값: value,
            값타입: typeof value,
            값길이: value ? value.length : 0,
            빈값여부: !value || value.trim() === ''
          });
        }
        
        if (fieldId === 'iptRepTelNo') {
          console.log('📞 대표번호 변경됨:', {
            필드ID: fieldId,
            이전값: this.state.textFieldProps[fieldId]?.value,
            신규값: value,
            값타입: typeof value,
            값길이: value ? value.length : 0,
            빈값여부: !value || value.trim() === ''
          });
        }
        
        // 상태 업데이트
        this.setState({
          ...this.state,
          textFieldProps: {
            ...this.state.textFieldProps,
            [fieldId]: {
              ...this.state.textFieldProps[fieldId],
              value: value
            }
          }
        }, () => {
          // 🔄 핵심: setState 완료 후 Table 데이터 재생성
          this.updateDetailTableData({});
          
          console.log('✅ Input 상태 업데이트 완료:', {
            fieldId,
            newValue: this.state.textFieldProps[fieldId]?.value
          });
          
          // 인사조직번호와 대표번호 필드 setState 후 로그
          if (fieldId === 'iptHrOrgNo' || fieldId === 'iptRepTelNo') {
            console.log('🔍 setState 후 상태 확인:', {
              필드ID: fieldId,
              저장된값: this.state.textFieldProps[fieldId]?.value,
              저장된값타입: typeof this.state.textFieldProps[fieldId]?.value
            });
          }
        });
      },
      
      onKeyDown: (e) => {
        let fieldId = e.target.id;
        
        // 조직명 검색 필드에서 엔터키 감지
        if (fieldId === 'iptSrchOrgNm' && e.key === 'Enter') {
          console.log('🔍 조직명 검색 필드에서 엔터키 감지됨');
          
          // 기본 이벤트 방지
          e.preventDefault();
          
          // 조회 버튼 클릭 이벤트 실행
          if (this.validation('SYS0010R01')) {
            this.transaction('SYS0010R01');
          }
        }
      }
    },
    
    selectbox: {
      onChange: (e) => {
        let selectId = e.target.id;
        let value = e.target.value;
        let selectedIndex = e.target.selectedIndex;
        
        console.log('📦 Selectbox 변경 이벤트 발생:', {
          selectId,
          value,
          selectedIndex
        });
        
        // 상태 업데이트
        let newState = {
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [selectId]: {
              ...this.state.selectboxProps[selectId],
              value: value,
              selected: selectedIndex
            }
          }
        };
        
        // 사용여부 selectbox인 경우 textFieldProps.useYn도 동기화
        if (selectId === 'selUseYn') {
          newState.textFieldProps = {
            ...newState.textFieldProps,
            useYn: {
              ...newState.textFieldProps.useYn,
              value: value
            }
          };
        }
        
        this.setState(newState, () => {
          console.log('🔍 === 디버깅 시작 ===');
          console.log('🔍 setState 완료 후 selectboxProps.selUseYn:', this.state.selectboxProps.selUseYn);
          console.log('🔍 setState 완료 후 textFieldProps.useYn:', this.state.textFieldProps.useYn);
          console.log('🔍 Table 데이터 업데이트 전');
          
          // 🔄 핵심: setState 완료 후 Table 데이터 재생성
          this.updateDetailTableData({});
          
          console.log('🔍 Table 데이터 업데이트 후');
          console.log('🔍 최종 detailTableData[5] (사용여부 행):', this.state.detailTableData[5]);
          console.log('🔍 === 디버깅 끝 ===');
          
          console.log('✅ Selectbox 상태 업데이트 완료:', {
            selectId,
            selectboxValue: this.state.selectboxProps[selectId].value,
            selectboxSelected: this.state.selectboxProps[selectId].selected,
            textFieldValue: selectId === 'selUseYn' ? this.state.textFieldProps.useYn.value : 'N/A'
          });
        });
      }
    },
    
    tree: {
      onRowSelect: (event) => {
        console.log('🌳 Tree 노드 클릭됨!', event);
        
        if (event && event.data) {
                  // 🔒 편집 모드 체크: 미저장 데이터 보호
        if (this.isEditMode) {
          console.log('⚠️ 편집 모드 중 다른 조직 선택 시도 감지');
          
          // 선택하려는 조직이 현재 편집 중인 조직과 같은지 확인
          let selectedOrgCd = event.data.ognzCd || event.data.ID;
          this.currentOrgCd = selectedOrgCd;
          
          if (selectedOrgCd === this.editingOrgCd) {
            console.log('✅ 동일한 조직 재선택 - 편집 모드 유지');
          } else {
            console.log('⚠️ 다른 조직 선택 시도 - 클릭 차단');
            
            // 사용자에게 알림만 표시하고 클릭 방지
            ComLib.openDialog('A', 'SYSI0010', 
              ['조직 추가 중입니다.', '저장 또는 취소 후 선택해주세요.']
            );
            return; // 여기서 완전히 차단
          }
        }
          
          this.currentOrgCd = event.data.ognzCd || event.data.ID;
          
          // 🔓 신규 모드 해제 (조직 선택 시)
          if (this.isNewMode) {
            console.log('🔓 조직 선택으로 신규 모드 해제');
            this.isNewMode = false;
          }
          
          // 실제 배열에서의 인덱스 찾기
          let currentRecords = this.state.dsOrgList.getRecords();
          this.currentIndex = currentRecords.findIndex(record => record.ognzCd === this.currentOrgCd);
          
          
          if (!this.currentOrgCd) {
            console.log('⚠️ 조직코드를 찾을 수 없음! 전체 데이터:', JSON.stringify(event.data, null, 2));
            return;
          }
            console.log('🏢 기존 조직 클릭 - API 호출하여 상세정보 조회');
            
            if (this.validation('SYS0010R02')) {
              this.transaction('SYS0010R02');
            } else {
              console.log('❌ SYS0010R02 validation 실패');
            }
          
        }
      }
    }
  };
  
  render() {
    // Tree 데이터 디버깅
    const treeData = this.state.dsOrgList.getRecords ? this.state.dsOrgList.getRecords() : [];
    
    return (
      <FullPanel>
        {/* 검색 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{flexDirection: 'column'}}>
              <div style={{display: 'grid', gridTemplateColumns: '53px 200px 84px 120px', alignItems: 'center'}}>
                <Label value="조직명"/>
                <Textfield {...this.state.textFieldProps.iptSrchOrgNm} onChange={this.event.input.onChange} onKeyDown={this.event.input.onKeyDown} />
                <Label value="사용여부"/>
                <Selectbox {...this.state.selectboxProps.selSrchUseYn} onChange={this.event.selectbox.onChange} />
              </div>
            </LFloatArea>
            <RFloatArea>
              <Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
              <Button {...this.state.btnProps.btnReset} onClick={this.event.button.onClick} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>

        <SubFullPanel>
          <FlexPanel style={{gap: '16px', width: '100%'}}>
            {/* 좌측 조직 목록 패널 */}
            <div style={{flex: '2', minWidth: 0}}>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>조직 목록</h3>
                  </LFloatArea>
                  <RFloatArea>
                    <span style={{fontSize: '12px', color: '#64748B', marginLeft: '10px', fontWeight: 'normal'}}>
                      총 {treeData.length}개의 조직
                    </span>
                    <Button 
                      {...this.state.btnProps.btnAddOrg} 
                      disabled={this.isEditMode}
                      onClick={this.event.button.onClick} 
                    />
                  </RFloatArea>
                </RelativeGroup>
                
                <div style={{ 
                  position: 'relative',
                  opacity: this.isEditMode ? 0.5 : 1,
                  pointerEvents: this.isEditMode ? 'none' : 'auto'
                }}>
                  <Tree 
                    key={this.treeKey}
                    {...this.state.treeProps.treeOrgList}
                    onNodeClick={this.event.tree.onRowSelect}
                    height="calc(100vh - 332px)"
                  />
                  {this.isEditMode && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 1000
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '16px 24px',
                        color: '#475569',
                        fontWeight: '500'
                      }}>
                        조직 추가 중입니다. 저장 후 선택해주세요.
                      </div>
                    </div>
                  )}
                </div>
              </ComponentPanel>
            </div>

            {/* 우측 조직 상세 정보 패널 */}
            <div style={{flex: '7', display: 'flex', flexDirection: 'column', minWidth: 0}}>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>조직 상세정보</h3>
                  </LFloatArea>                
                </RelativeGroup>
                
                <div style={{ 
                  position: 'relative',
                  flex: 1,
                  opacity: (!this.currentOrgCd && !this.isNewMode) ? 0.5 : 1,
                  pointerEvents: (!this.currentOrgCd && !this.isNewMode) ? 'none' : 'auto'
                }}>
                  {/* 상세 정보 폼 (Table 컴포넌트 활용) */}
                  <Table
                    id="tblOrgDetail"
                    className="scrm-modern-detail-table ghost"
                    width="100%"
                    colGrp={this.state.colGroupDetail}
                    tbData={this.state.detailTableData}
                  />
                  {(!this.currentOrgCd && !this.isNewMode) && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      zIndex: 1000
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#475569',
                        fontWeight: '500'
                      }}>
                        조직을 선택해주세요.
                      </div>
                    </div>
                  )}
                </div>
              </ComponentPanel>

              {/* 버튼 영역 */}
              <BottomPanel>
                <RelativeGroup>
                  <RFloatArea>
                    {!this.isEditMode && (
                      <Button 
                        {...this.state.btnProps.btnNew} 
                        disabled={!this.currentOrgCd && !this.isNewMode}
                        onClick={this.event.button.onClick} 
                      />
                    )}
                    <Button 
                      {...this.state.btnProps.btnSave} 
                      disabled={!this.currentOrgCd && !this.isNewMode}
                      onClick={this.event.button.onClick} 
                    />
                    <Button 
                      {...this.state.btnProps.btnDelete} 
                      disabled={!this.currentOrgCd && !this.isNewMode}
                      onClick={this.event.button.onClick} 
                    />
                    {this.isEditMode && (
                      <Button {...this.state.btnProps.btnReset} onClick={this.event.button.onClick} />
                    )}
                  </RFloatArea>
                </RelativeGroup>
              </BottomPanel>
            </div>
          </FlexPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View; 