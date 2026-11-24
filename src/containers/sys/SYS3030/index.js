/**
 * SYS3030 사용자별권한관리
 * 
 * 시스템 사용자별 메뉴 및 프로그램 권한을 관리하는 화면
 * - 이중 그리드 구조 (사용자 목록 + 프로그램 권한 목록)
 * - 사용자 선택 시 해당 사용자의 프로그램 권한 조회
 * - 권한별 체크박스를 통한 권한 관리
 * - 권한 저장 및 삭제 기능
 */

import React from 'react';

// 레이아웃 컴포넌트
import { ComponentPanel, FullPanel, SubFullPanel, SearchPanel, BottomPanel,
         RelativeGroup, LFloatArea, RFloatArea, FlexPanel, Tabs, TabPanel } from 'components';

// UI 컴포넌트
import { Grid, Label, Textfield, Selectbox } from 'components';
import { UserSelect } from 'components';
import { OgnzSelect } from 'components';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';
import { head } from 'lodash';

class View extends React.Component {
  constructor(props) {
    super(props);
    
    // 그리드 API 참조 (이중 그리드)
    this.userGridApi = null;
    this.userColumnApi = null;
    this.programGridApi = null;
    this.programColumnApi = null;
    this.userProgramGridApi = null;
    this.userProgramColumnApi = null;
    
    this.menuGridApi = null;
    this.menuColumnApi = null;
    this.userMenuGridApi = null;
    this.userMenuColumnApi = null;

    
    // 현재 선택 상태
    this.currentUserRow = '';
    this.selectedUserId = '';
    this.isProcessingRowSelection = false; // 중복 실행 방지 플래그
    this.isInitialLoadComplete = false; // 초기 로드 완료 플래그
    
    this.state = {
      // 현재 활성 탭 상태
      activeTab: '', // 'menu' 또는 'program'
      
      // 데이터셋 (필수)
      dsUserList: DataLib.datalist.getInstance(),           // 사용자 목록 데이터
      dsUserProgramList: DataLib.datalist.getInstance(),     // 사용자별 프로그램 권한 목록 데이터
      dsMenuList: DataLib.datalist.getInstance(),            // 메뉴 권한 목록 데이터
      dsUserMenuList: DataLib.datalist.getInstance(),        // 사용자별 메뉴 권한 목록 데이터
      dsSearch: DataLib.datalist.getInstance(),              // 검색 조건 데이터
      dsProgramSearch: DataLib.datalist.getInstance(),       // 프로그램 검색 조건 데이터
      dsProgramList: DataLib.datalist.getInstance(),         // 프로그램 목록 데이터
      
      // UserSelect & OgnzSelect Props
      userSelectProps: {
        id: 'userSelectSearch',
        userId: '',
        userNm: '',
        keyword: ''
      },
      ognzSelectProps: {
        id: 'ognzSelectSearch',
        ognzCd: '',
        ognzNm: '',
        keyword: ''
      },
      
      // UI Props 관리 (표준화된 구조)
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
        btnReset: {
          id: 'btnReset',
          disabled: false,
          value: '',
          hidden: false,
          color: 'grey',
          className: 'icon-reset',
          type: 'icon'
        },
        btnSave: {
          id: 'btnSave',
          disabled: true,
          value: '저장',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-act'
        },
        btnDelete: {
          id: 'btnDelete',
          disabled: true,
          value: '삭제',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: false,
          className: 'icon-del'
        },
        btnMenuSearch: {
          id: 'btnMenuSearch',
          disabled: false,
          value: '조회',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-srch'
        },
        btnProgramSearch: {
          id: 'btnProgramSearch',
          disabled: false,
          value: '조회',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-srch'
        },
        btnGrantAdd:{
          id: 'btnGrantAdd',
          disabled: false,
          value: '권한추가',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: false,
          className: 'icon-plus'
        },
        btnGrantExclude:{
          id: 'btnGrantExclude',
          disabled: false,
          value: '권한제외',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: false,
          className: 'icon-minus'
        }
      },
      
      // 텍스트필드 Props
      textFieldProps: {
        iptUserName: {
          id: 'iptUserName',
          value: '',
          placeholder: '사용자명을 입력하세요',
          maxLength: 50,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptUserId: {
          id: 'iptUserId',
          value: '',
          placeholder: '사용자ID를 입력하세요',
          maxLength: 50,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptProgramName: {
          id: 'iptProgramName',
          value: '',
          placeholder: '프로그램명을 입력하세요',
          maxLength: 50,
          type: 'text',
          readOnly: false,
          disabled: false
        },
        iptMenuName: {
          id: 'iptMenuName',
          value: '',
          placeholder: '메뉴명을 입력하세요',
          maxLength: 50,
          type: 'text',
        }
      },
      
      // 셀렉트박스 Props
      selectboxProps: {
        selOrganization: {
          id: 'selOrganization',
          value: '',
          width: 150,
          selected: 0,
          disabled: false,
          label: '조직',
          dataset: [
            { code: '', name: '전체' },
            { code: 'ORG001', name: '개발팀' },
            { code: 'ORG002', name: '기획팀' },
            { code: 'ORG003', name: '운영팀' }
          ]
        },
        selUseYn: {
          id: 'selUseYn',
          value: '',
          width: 100,
          selected: 0,
          disabled: false,
          label: '사용여부',
          dataset: [
            { code: '', name: '전체' },
            { code: 'Y', name: '사용' },
            { code: 'N', name: '미사용' }
          ]
        },
        selMenuType: {
          id: 'selMenuType',
          value: '',
          width: 120,
          selected: 0,
          disabled: false,
          label: '메뉴구분',
          dataset: [
            { code: '', name: '전체' },
            { code: 'MENU', name: '메뉴' },
            { code: 'PROGRAM', name: '프로그램' },
            { code: 'POPUP', name: '팝업' }
          ]
        },
        selProgramType: {
          id: 'selProgramType',
          value: '',
          width: 120,
          selected: 0,
          disabled: false,
        }
      },
      
      // 그리드 Props
      grdProps: {
        grdUserList: {
          id: 'grdUserList',
          areaName: '사용자 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          header: [
            {
              headerName: '사용자ID',
              field: 'userId',
              colId: 'userId',
              editable: false,
              width: 120,
              req: true,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '사용자명',
              field: 'userNm',
              colId: 'userNm',
              editable: false,
              width: 120,
              req: true,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '조직명',
              field: 'ognzNm',
              colId: 'ognzNm',
              editable: false,
              width: 150,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '권한',
              field: 'authrtCdNm',
              colId: 'authrtCdNm',
              editable: false,
              width: 120,
              type: 'text',
              textAlign: 'center'
            }
          ],
          height: 'calc(100vh - 332px)',
          rowSelection: 'single'
        },
        
        grdProgramList: {
          id: 'grdProgramList',
          areaName: '프로그램 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          rowSelection: 'multiple',
          header: [
            {
              headerName: '',
              // field: 'selected',
              // colId: 'selected',
              width: 0,
              checkboxSelection: true,
              headerCheckboxSelection: true,
              headerCheckboxSelectionFilteredOnly: true,
            },
            {
              headerName: '프로그램ID',
              field: 'prgrmId',
              colId: 'prgrmId',
              editable: false,
              width: 280,
              req: true,
              type: 'text',
              textAlign: 'left'
            },
            {
              headerName: '프로그램명',
              field: 'prgrmNm',
              colId: 'prgrmNm',
              editable: false,
              width: 280,
              req: true,
              type: 'text',
              textAlign: 'left'
            }
            // {
            //   headerName: 'URL패턴',
            //   field: 'urlAddrPtrn',
            //   colId: 'urlAddrPtrn',
            //   editable: false,
            //   width: 200,
            //   type: 'text',
            //   textAlign: 'left'
            // }
          ],
          height: '200px',
          rowSelection: 'multiple'
        },
         
        grdUserProgramList: {
          id: 'grdUserProgramList',
          areaName: '프로그램 권한 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          header: [
            {
              headerName: '',
              field: 'selected',
              colId: 'selected',
              width: 0,
              checkboxSelection: true,
              headerCheckboxSelection: true,
              headerCheckboxSelectionFilteredOnly: true,
            },
            {
              headerName: '프로그램ID',
              field: 'prgrmId',
              colId: 'prgrmId',
              editable: false,
              width: 260,
              req: true,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '프로그램명',
              field: 'prgrmNm',
              colId: 'prgrmNm',
              editable: false,
              width: 250,
              req: true,
              type: 'text',
              textAlign: 'left'
            },
            {
              headerName: '권한부여구분',
              field: 'authrtGrntSeCd',
              colId: 'authrtGrntSeCd',
              editable: false,
              width: 100,
              type: 'code',
              textAlign: 'center',
              valueGetter: (params) => {
                const value = params.data.authrtGrntSeCd;
                if (value === '01') return '권한추가';
                if (value === '02') return '권한제외';
                return value;
              }
            }
            // {
            //   headerName: 'URL패턴',
            //   field: 'urlAddrPtrn',
            //   colId: 'urlAddrPtrn',
            //   editable: false,
            //   width: 200,
            //   type: 'text',
            //   textAlign: 'left'
            // }
          ],
          height: 'calc(100vh - 790px)',
          rowSelection: 'multiple'
        },
        
        grdMenuList: {
          id: 'grdMenuList',
          areaName: '메뉴 권한 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          header: [
            {
              headerName: '',
              // field: 'selected',
              // colId: 'selected',
              width: 0,
              checkboxSelection: true,
              headerCheckboxSelection: true,
              headerCheckboxSelectionFilteredOnly: true,
            },
            {
              headerName: '메뉴ID',
              field: 'menuId',
              colId: 'menuId',
              editable: false,
              width: 120,
              req: true,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '메뉴명',
              field: 'menuNm',
              colId: 'menuNm',
              editable: false,
              width: 150,
              req: true,
              type: 'text',
              textAlign: 'left'
            }
          ],
          height: '200px',
          rowSelection: 'multiple'
        },
        
        grdUserMenuList: {
          id: 'grdUserMenuList',
          areaName: '사용자 메뉴 권한 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          header: [
            {
              headerName: '',
              //field: 'selected',
              //colId: 'selected',
              width: 0,
              checkboxSelection: true,
              headerCheckboxSelection: true,
              headerCheckboxSelectionFilteredOnly: true,
            },
            {
              headerName: '메뉴ID',
              field: 'menuId',
              colId: 'menuId',
              editable: false,
              width: 120,
              req: true,
              type: 'text',
              textAlign: 'left'
            },
            {
              headerName: '메뉴명',
              field: 'menuNm',
              colId: 'menuNm',
              editable: false,
              width: 150,
              req: true,
              type: 'text',
              textAlign: 'left'
            },
            {
              headerName: '권한부여구분',
              field: 'authrtGrntSeCd',
              colId: 'authrtGrntSeCd',
              editable: false,
              width: 100,
              type: 'code',
              textAlign: 'center',
              valueGetter: (params) => {
                const value = params.data.authrtGrntSeCd;
                if (value === '01') return '권한추가';
                if (value === '02') return '권한제외';
                return value;
              }
            }
          ],
          height: 'calc(100vh - 790px)',
          rowSelection: 'multiple'
        }
      }
    };
    
    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
    this.event.userSelect.onChange = this.event.userSelect.onChange.bind(this);
    this.event.ognzSelect.onChange = this.event.ognzSelect.onChange.bind(this);
    
    // 탭 클릭 이벤트 바인딩
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleUserGridReady = this.handleUserGridReady.bind(this);
    this.handleProgramGridReady = this.handleProgramGridReady.bind(this);
    this.handleMenuGridReady = this.handleMenuGridReady.bind(this);
    this.handleUserMenuGridReady = this.handleUserMenuGridReady.bind(this);
    this.handleUserProgramGridReady = this.handleUserProgramGridReady.bind(this);
    this.handleUserRowSelected = this.handleUserRowSelected.bind(this);
    this.handleProgramCellValueChanged = this.handleProgramCellValueChanged.bind(this);
    this.handleMenuCellValueChanged = this.handleMenuCellValueChanged.bind(this);
  }
  
  // 컴포넌트 마운트
  componentDidMount() {
    console.log('SYS3030 component mounted');
    
    this.handleTabClick(0);
  }
  
  // 컴포넌트 업데이트 후 - 초기 데이터 로드 처리
  componentDidUpdate(prevProps, prevState) {
    // 초기 로드가 완료되지 않았고, 조직 정보가 설정된 경우에만 실행
    if (!this.isInitialLoadComplete ) {
      
      console.log('초기 조직 정보 설정 완료, 사용자 목록 조회 시작');
      this.isInitialLoadComplete = true;
      
      // 모든 컴포넌트 값이 설정된 후 transaction 실행
      setTimeout(() => {
        if (this.validation('SYS3030R01')) {
          this.transaction('SYS3030R01');
        }
      }, 100); // 100ms 지연으로 컴포넌트 렌더링 완료 보장
    }
  }
  
  // 유효성 검증
  validation = (...params) => {
    let transId = params[0];
    
    switch (transId) {
      case 'SYS3030R01': // 사용자 목록 조회
        // 특별한 검증 조건 없음
        break;
        
      case 'SYS3030R02': // 메뉴 목록 조회
        break;

      case 'SYS3030R03': // 메뉴 권한 목록 조회
        console.log('SYS3030R03');
         if (StrLib.isNull(this.selectedUserId)) {
           ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
           return false;
         }
        break;

      case 'SYS3030U01': // 권한 저장
        if (StrLib.isNull(this.selectedUserId)) {
          ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
          return false;
        }
        
        // 변경된 권한이 있는지 확인
        const changedRows = this.state.dsUserMenuList.getRecords().filter(
          row => row.rowtype && (row.rowtype === 'u' || row.rowtype === 'c')
        );
        
        if (changedRows.length === 0) {
          ComLib.openDialog('A', 'SYSI0010', ['변경된 권한 정보가 없습니다.']);
          return false;
        }
        break;
        
      case 'SYS3030D01': // 프로그램 권한 삭제
        if (StrLib.isNull(this.selectedUserId)) {
          ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
          return false;
        }
        
        const selectedRows = this.userMenuGridApi ? this.userMenuGridApi.getSelectedRows() : [];
        if (selectedRows.length === 0) {
          ComLib.openDialog('A', 'SYSI0010', ['삭제할 프로그램 권한을 선택하세요.']);
          return false;
        }
        break;
        
      case 'SYS3030R03': // 메뉴 목록 조회
        // 특별한 검증 조건 없음
        break;
        
      case 'SYS3030R04': // 전체 프로그램 목록 조회
        // 특별한 검증 조건 없음
        break;

      case 'SYS3030R06': // 사용자별 프로그램 권한 목록 조회
        if (StrLib.isNull(this.selectedUserId)) {
          ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
          return false;
        }
        break;
        
      case 'SYS3030U02': // 메뉴 권한 저장
        if (StrLib.isNull(this.selectedUserId)) {
          ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
          return false;
        }
        
        // 변경된 메뉴 권한이 있는지 확인
        const changedMenuRows = this.state.dsUserProgramList.getRecords().filter(
          row => row.rowtype && (row.rowtype === 'u' || row.rowtype === 'c')
        );
        
        if (changedMenuRows.length === 0) {
          ComLib.openDialog('A', 'SYSI0010', ['변경된 프로그램 권한 정보가 없습니다.']);
          return false;
        }
        break;
        
      case 'SYS3030D02': // 프로그램램 권한 삭제
        if (StrLib.isNull(this.selectedUserId)) {
          ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
          return false;
        }
        
        const selectedProgramRows = this.userProgramGridApi ? this.userProgramGridApi.getSelectedRows() : [];
        if (selectedProgramRows.length === 0) {
          ComLib.openDialog('A', 'SYSI0010', ['삭제할 프로그램 권한을 선택하세요.']);
          return false;
        }
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
        case 'SYS3030R01': // 사용자 목록 조회
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/user-authrt/r01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsUserList'
          });
          
          // 검색 조건 구성 (UserSelect와 OgnzSelect 사용)
          let userSearchData = {
            ognzCd: this.state.ognzSelectProps.ognzCd,
            userId: this.state.userSelectProps.userId,
            userNm: this.state.userSelectProps.userNm
          };
          
          transManager.setFormData(userSearchData);
          transManager.agent();
          break;
          
        case 'SYS3030R02': // 메뉴 권한 목록 조회
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/user-authrt/r02");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsUserMenuList',
            datasetrecv: 'dsUserMenuList'
          });
          
          // 프로그램 검색 조건 구성
          let menuGrantSearchData = {
            userId: this.selectedUserId,
            menuIdOrNm: this.state.textFieldProps.iptProgramName.value,
            // menuType: this.state.selectboxProps.selMenuType.value
          };
          
          transManager.setFormData(menuGrantSearchData);
          transManager.agent();
          break;
        
       case 'SYS3030R03': // 메뉴 목록 조회
        transManager.setTransId(transId);
        transManager.setTransUrl("/api/cmm/user-authrt/r03");
        transManager.setCallBack(this.callback);
        transManager.addConfig({
          datasetsend: 'dsUserMenuList',
          datasetrecv: 'dsUserMenuList'
        });
        
        // 검색 조건 구성
        let menuSearchData = {
          userId: this.selectedUserId,
          menuIdOrNm: this.state.textFieldProps.iptMenuName.value,
        };

        transManager.setFormData(menuSearchData);
        transManager.agent();
        break;

        case 'SYS3030R04': // 전체 프로그램 목록 조회
        transManager.setTransId(transId);
        transManager.setTransUrl("/api/cmm/user-authrt/r04");
        transManager.setCallBack(this.callback);
        transManager.addConfig({
          datasetsend: 'dsProgramSearch',
          datasetrecv: 'dsProgramList'
        });

        let programSearchData = {
          prgrmIdOrNm: this.state.textFieldProps.iptProgramName.value,
        };

        transManager.setFormData(programSearchData);
        transManager.agent();
        break;

        case 'SYS3030R06': // 사용자별 프로그램 권한 목록 조회
        transManager.setTransId(transId);
        transManager.setTransUrl("/api/cmm/user-authrt/r06");
        transManager.setCallBack(this.callback);
        transManager.addConfig({
          datasetsend: 'dsUserProgramSearch',
          datasetrecv: 'dsUserProgramList'
        });

        let userProgramSearchData = {
            userId: this.selectedUserId,
            prgrmIdOrNm: this.state.textFieldProps.iptProgramName.value,
          };

        console.log('userProgramSearchData', userProgramSearchData);
        transManager.setFormData(userProgramSearchData);
        transManager.agent();
        break;

  
        
        case 'SYS3030U01': // 메뉴 권한 저장
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/user-authrt/u01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsUserMenuList',
            datasetrecv: ''
          });
          
          // 변경된 권한 데이터만 전송
          const modifiedData = this.state.dsUserMenuList.getRecords().filter(
            row => row.rowtype && (row.rowtype === 'u' || row.rowtype === 'c')
          );
    
          transManager.setFormData(modifiedData);
          transManager.agent();
          break;
          
        case 'SYS3030D01': // 메뉴 권한 삭제
          // 선택된 권한 데이터 가져오기
          const selectedMenuRows = this.userMenuGridApi.getSelectedRows();
          
          if (selectedMenuRows.length === 0) {
            ComLib.openDialog('A', 'SYSI0010', ['삭제할 메뉴 권한을 선택하세요.']);
            return;
          }

          // 저장되지 않은 신규 행과 저장된 기존 행 분리
          const newMenuRows = selectedMenuRows.filter(row => row.rowtype === 'c');
          const existingMenuRows = selectedMenuRows.filter(row => !row.rowtype || row.rowtype !== 'c');

          // 저장되지 않은 신규 행은 클라이언트에서만 제거
          if (newMenuRows.length > 0) {
            const currentMenuRecords = this.state.dsUserMenuList.getRecords();
            const updatedMenuRecords = currentMenuRecords.filter(record => 
              !newMenuRows.some(newRow => 
                newRow.menuId === record.menuId && record.rowtype === 'c'
              )
            );
            this.state.dsUserMenuList.setRecords(updatedMenuRecords);
            this.setState({...this.state});
          }

          // 저장된 기존 행이 있는 경우에만 서버로 삭제 요청
          if (existingMenuRows.length > 0) {
            transManager.setTransId(transId);
            transManager.setTransUrl("/api/cmm/user-authrt/d01");
            transManager.setCallBack(this.callback);
            transManager.addConfig({
              datasetsend: 'dsUserMenuList',
              datasetrecv: ''
            });
            
            // 기존 행들에 삭제 마크 설정
            existingMenuRows.forEach(row => {
              row.userId = this.selectedUserId;
              row.rowtype = 'd'; // 삭제 마크
            });
            
            transManager.setFormData(existingMenuRows);
            transManager.agent();
                              } else {
                      // 모든 선택된 행이 신규 행인 경우 바로 완료 처리
                      // 그리드 선택 해제
                      if (this.userMenuGridApi) this.userMenuGridApi.deselectAll();
                    }
          break;
          
        case 'SYS3030U02': // 프로그램 권한 저장
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/user-authrt/u02");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsUserMenuList',
            datasetrecv: ''
          });
          
          // 변경된 메뉴 권한 데이터만 전송
          const modifiedProgramData = this.state.dsUserProgramList.getRecords().filter(
            row => row.rowtype && (row.rowtype === 'u' || row.rowtype === 'c')
          );
          
          modifiedProgramData.forEach(row => {
            row.userId = this.selectedUserId;
          });
          
          console.log('modifiedProgramData', modifiedProgramData);
          transManager.setFormData(modifiedProgramData);
          transManager.agent();
          break;
          
        case 'SYS3030D02': // 프로그램 권한 삭제
          // 선택된 프로그램 권한 데이터 가져오기
          const selectedProgramRows = this.userProgramGridApi ? this.userProgramGridApi.getSelectedRows() : [];
          
          if (selectedProgramRows.length === 0) {
            ComLib.openDialog('A', 'SYSI0010', ['삭제할 프로그램 권한을 선택하세요.']);
            return;
          }

          // 저장되지 않은 신규 행과 저장된 기존 행 분리
          const newProgramRows = selectedProgramRows.filter(row => row.rowtype === 'c');
          const existingProgramRows = selectedProgramRows.filter(row => !row.rowtype || row.rowtype !== 'c');

          // 저장되지 않은 신규 행은 클라이언트에서만 제거
          if (newProgramRows.length > 0) {
            const currentProgramRecords = this.state.dsUserProgramList.getRecords();
            const updatedProgramRecords = currentProgramRecords.filter(record => 
              !newProgramRows.some(newRow => 
                newRow.prgrmId === record.prgrmId && record.rowtype === 'c'
              )
            );
            this.state.dsUserProgramList.setRecords(updatedProgramRecords);
            this.setState({...this.state});
          }

          // 저장된 기존 행이 있는 경우에만 서버로 삭제 요청
          if (existingProgramRows.length > 0) {
            transManager.setTransId(transId);
            transManager.setTransUrl("/api/cmm/user-authrt/d02");
            transManager.setCallBack(this.callback);
            transManager.addConfig({
              datasetsend: 'dsUserProgramList',
              datasetrecv: ''
            });
            
            // 기존 행들에 삭제 마크 설정
            existingProgramRows.forEach(row => {
              row.userId = this.selectedUserId;
              row.rowtype = 'd'; // 삭제 마크
            });
            
            transManager.setFormData(existingProgramRows);
            transManager.agent();
          } else {
            // 모든 선택된 행이 신규 행인 경우 바로 완료 처리
            ComLib.openDialog('A', 'SYSI0010', ['선택된 프로그램 권한이 삭제되었습니다.']);
            // 그리드 선택 해제
            if (this.userProgramGridApi) this.userProgramGridApi.deselectAll();
          }
          break;
          
        case 'SYS3030U02': // 메뉴 권한 저장
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/user-authrt/u02");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsMenuList',
            datasetrecv: ''
          });
          
          // 체크된 메뉴들만 필터링하여 저장
          const checkedMenus = this.state.dsMenuList.getRecords().filter(
            row => row.selected === true
          );
          
          if (checkedMenus.length === 0) {
            ComLib.openDialog('A', 'SYSI0010', ['저장할 메뉴를 선택하세요.']);
            return;
          }
          
          // 저장할 데이터 구성
                      const menuAuthData = checkedMenus.map(menu => ({
              userId: this.selectedUserId,
              menuId: menu.menuId,
              menuNm: menu.menuNm,
              rowtype: 'c' // 신규 생성
            }));
          
          transManager.addDataset('dsMenuList', menuAuthData);
          transManager.agent();
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error('Transaction Error:', err);
      console.error('Error stack:', err.stack);
      ComLib.openDialog('A', 'SYSI0010', ['처리 중 오류가 발생했습니다.']);
    }
  };
  
  // 응답 처리
  callback = (res) => {
    console.log('Callback received:', res);
    
    if (res.result) {
      switch (res.id) {
        case 'SYS3030R01': // 사용자 목록 조회 결과
          console.log('SYS3030R01 response:', res.data);
          if (res.data) {
            this.state.dsUserList.setRecords(res.data);
            this.setState({...this.state});
            
            // 사용자 그리드 포커스 복원
            if (this.userGridApi) {
              let rowNum = this.rowFinder(res.data, 'userId', this.currentUserRow);
              this.userGridApi.setFocusedCell(rowNum, 'userId');
            }
            
            // 조회 결과 메시지
            const recordCount = res.data ? res.data.length : 0;
            // ComLib.openDialog('A', 'SYSI0010', [`총 ${recordCount}명의 사용자가 조회되었습니다.`]);
          } else {
            this.state.dsUserList.setRecords([]);
            this.setState({...this.state});
            ComLib.openDialog('A', 'SYSI0010', ['조회된 사용자가 없습니다.']);
          }
          break;
          
        case 'SYS3030R02': // 메뉴 권한 목록 조회 결과
          console.log('SYS3030R02 response:', res.data);
          if (res.data) {
            // 체크박스 초기값 설정
            const programList = res.data.map(item => ({
              ...item,
              selected: false,
              readAuth: item.readAuth === 'Y',
              createAuth: item.createAuth === 'Y',
              updateAuth: item.updateAuth === 'Y',
              deleteAuth: item.deleteAuth === 'Y'
            }));
            
            this.state.dsUserMenuList.setRecords(programList);
            this.setState({...this.state});
            
            // 버튼 활성화
            this.setState({
              ...this.state,
              btnProps: {
                ...this.state.btnProps,
                btnSave: { ...this.state.btnProps.btnSave, disabled: false },
                btnDelete: { ...this.state.btnProps.btnDelete, disabled: false }
              }
            });
          } else {
            this.state.dsUserMenuList.setRecords([]);
            this.setState({...this.state});
            ComLib.openDialog('A', 'SYSI0010', ['해당 사용자의 프로그램 권한이 없습니다.']);
          }
          break;

          
        case 'SYS3030U01': // 메뉴 권한 저장 결과
          ComLib.openDialog('A', 'SYSI0010', ['권한 정보가 저장되었습니다.']);
          // 프로그램 권한 목록 재조회
          if (this.validation('SYS3030R02')) {
            this.transaction('SYS3030R02');
          }
          break;
          
        case 'SYS3030D01': // 메뉴 권한 삭제 결과
          ComLib.openDialog('A', 'SYSI0010', ['선택된 메뉴 권한이 삭제되었습니다.']);
          // 프로그램 권한 목록 재조회
          if (this.validation('SYS3030R02')) {
            this.transaction('SYS3030R02');
          }
          break;
          
        case 'SYS3030R03': // 메뉴록 조회 결과
          // console.log('SYS3030R03 response:', res.data);
          if (res.data) {
            // 체크박스 초기값 설정
            const menuList = res.data.map(item => ({
              ...item,
              selected: false
            }));
            
            this.state.dsMenuList.setRecords(menuList);
            this.setState({...this.state});
            
            // 조회 결과 메시지
            // const recordCount = res.data ? res.data.length : 0;
            // ComLib.openDialog('A', 'SYSI0010', [`총 ${recordCount}개의 메뉴가 조회되었습니다.`]);
          } else {
            this.state.dsMenuList.setRecords([]);
            this.setState({...this.state});
            ComLib.openDialog('A', 'SYSI0010', ['조회된 메뉴가 없습니다.']);
          }
          break;
          
        case 'SYS3030R04': // 전체 프로그램 목록 조회 결과
          console.log('SYS3030R04 response:', res.data);
          if (res.data) {
            // 체크박스 초기값 설정
            const programList = res.data.map(item => ({
              ...item,
              selected: false
            }));
            
            this.state.dsProgramList.setRecords(programList);
            this.setState({...this.state});
            
            // 조회 결과 메시지
            // const recordCount = res.data ? res.data.length : 0;
          
          } else {
            this.state.dsProgramList.setRecords([]);
            this.setState({...this.state});
            ComLib.openDialog('A', 'SYSI0010', ['조회된 프로그램이 없습니다.']);
          }
          break;

        case 'SYS3030R06': // 사용자별 프로그램 권한 목록 조회 결과
          console.log('SYS3030R06 response:', res.data);
          if (res.data) {
            // 체크박스 초기값 설정
            const userProgramList = res.data.map(item => ({
              ...item,
              selected: false
            }));
            
            this.state.dsUserProgramList.setRecords(userProgramList);
            this.setState({...this.state});
            
            // 버튼 활성화
            this.setState({
              ...this.state,
              btnProps: {
                ...this.state.btnProps,
                btnSave: { ...this.state.btnProps.btnSave, disabled: false },
                btnDelete: { ...this.state.btnProps.btnDelete, disabled: false }
              }
            });
          } else {
            this.state.dsUserProgramList.setRecords([]);
            this.setState({...this.state});
            ComLib.openDialog('A', 'SYSI0010', ['해당 사용자의 프로그램 권한이 없습니다.']);
          }
          break;
          
        case 'SYS3030U02': // 프로그램 권한 저장 결과
          ComLib.openDialog('A', 'SYSI0010', ['메뉴 권한 정보가 저장되었습니다.']);
          // 메뉴 권한 목록 재조회
          if (this.validation('SYS3030R04')) {
            this.transaction('SYS3030R04');
          }
          break;
          
        case 'SYS3030D02': // 프로그램 권한 삭제 결과
          ComLib.openDialog('A', 'SYSI0010', ['선택된 프로그램 권한이 삭제되었습니다.']);
          // 메뉴 권한 목록 재조회
          if (this.validation('SYS3030R06')) {
            this.transaction('SYS3030R06');
          }
          break;


          
        default:
          break;
      }
    } else {
      console.error('API Error:', res);
      ComLib.openDialog('A', 'SYSI0010', [res.message || '데이터 처리 중 오류가 발생했습니다.']);
    }
  };
  
  // 그리드 포커스 복원용 유틸리티
  rowFinder = (targetRecords, targetColumn, currentRow) => {
    let rowNum = 0;
    
    if (!targetRecords || StrLib.isNull(currentRow)) {
      return rowNum;
    }
    
    for (let i = 0; i < targetRecords.length; i++) {
      if (targetRecords[i][targetColumn] === currentRow) {
        rowNum = i;
        break;
      }
    }
    return rowNum;
  };
  
  // 사용자 그리드 Ready 이벤트
  handleUserGridReady = (params) => {
    this.userGridApi = params.api;
    this.userColumnApi = params.columnApi;
  };
  
  // 프로그램 그리드 Ready 이벤트
  handleProgramGridReady = (params) => {
    this.programGridApi = params.api;
    this.programColumnApi = params.columnApi;
  };
  
  // 메뉴 그리드 Ready 이벤트
  handleMenuGridReady = (params) => {
    this.menuGridApi = params.api;
    this.menuColumnApi = params.columnApi;
  };
  
  // 사용자 메뉴 권한 그리드 Ready 이벤트
  handleUserMenuGridReady = (params) => {
    this.userMenuGridApi = params.api;
    this.userMenuColumnApi = params.columnApi;
  };
  
  // 사용자 프로그램 권한 그리드 Ready 이벤트
  handleUserProgramGridReady = (params) => {
    this.userProgramGridApi = params.api;
    this.userProgramColumnApi = params.columnApi;
  };
  
  // 탭 클릭 이벤트 핸들러 추가
  handleTabClick = (tabIndex) => {
    console.log('Tab clicked:', tabIndex);
    
    // index 기반 탭 구분 (0: 메뉴 권한, 1: 프로그램 권한)
    const newActiveTab = tabIndex === 0 ? 'menu' : 'program';
    this.setState({
      ...this.state,
      activeTab: newActiveTab
    });
    
    console.log('Active tab changed to:', newActiveTab);
    
    // 사용자가 선택되어 있고, 탭 변경 시 해당 탭의 데이터 조회
    if (this.selectedUserId) {
      if (newActiveTab === 'menu') {
        // 메뉴 권한 탭: 메뉴 목록과 사용자 메뉴 권한 조회
        if (this.validation('SYS3030R03')) {
          this.transaction('SYS3030R03'); // 메뉴 목록 조회
        }
        // 선택된 사용자의 메뉴 권한 조회
        if (this.validation('SYS3030R02')) {
          this.transaction('SYS3030R02');
        }
      } else {
        // 프로그램 권한 탭: 전체 프로그램 목록과 사용자 프로그램 권한 조회
        if (this.validation('SYS3030R04')) {
          this.transaction('SYS3030R04'); // 전체 프로그램 목록 조회
        }
        // 선택된 사용자의 프로그램 권한 조회
        if (this.validation('SYS3030R06')) {
          this.transaction('SYS3030R06');
        }
      }
    }
  };

  // 사용자 그리드 행 선택 이벤트
  handleUserRowSelected = (params) => {
    
    // 중복 실행 방지: 이미 처리 중인 경우 무시
    if (this.isProcessingRowSelection) {
      console.log('Row selection already in progress, skipping...');
      return;
    }
    
    // 선택된 행이 없는 경우 무시
    if (!params.data) {
      console.log('No data in selected row, skipping...');
      return;
    }
    
    // 같은 사용자가 이미 선택된 경우 무시
    if (this.selectedUserId === params.data.userId) {
      console.log('Same user already selected, skipping...');
      return;
    }
    
    this.isProcessingRowSelection = true;
    
    try {
      this.currentUserRow = params.data.userId;
      this.selectedUserId = params.data.userId;
      
      console.log('Selected user:', this.selectedUserId);
      
      const newActiveTab = this.state.activeTab;

      if (this.selectedUserId) {
        if (newActiveTab === 'menu') {
          // 메뉴 권한 탭: 메뉴 목록과 사용자 메뉴 권한 조회
          if (this.validation('SYS3030R03')) {
            this.transaction('SYS3030R03'); // 메뉴 목록 조회
          }
          // 선택된 사용자의 프로그램 권한과 메뉴 권한 조회
          if (this.validation('SYS3030R02')) {
            this.transaction('SYS3030R02');
          }
        } else if(newActiveTab === 'program'){
          // 프로그램 권한 탭: 전체 프로그램 목록과 사용자 프로그램 권한 조회
          if (this.validation('SYS3030R04')) {
            this.transaction('SYS3030R04'); // 전체 프로그램 목록 조회
          }
          // 선택된 사용자 프로그램 권한 조회
          if (this.validation('SYS3030R06')) {
            this.transaction('SYS3030R06'); 
          }
        }
      }
    } catch (error) {
      console.error('Error in handleUserRowSelected:', error);
      ComLib.openDialog('A', 'SYSI0010', ['사용자 선택 중 오류가 발생했습니다.']);
    } finally {
      // 처리 완료 후 플래그 해제
      setTimeout(() => {
        this.isProcessingRowSelection = false;
      }, 100); // 100ms 지연으로 중복 실행 방지
    }
  };
  
  // 프로그램 그리드 셀 값 변경 이벤트
  handleProgramCellValueChanged = (params) => {
    const { data, colDef, newValue } = params;
    
    // rowtype 설정 (수정 표시)
    if (!data.rowtype || data.rowtype === 'r') {
      data.rowtype = 'u';
    }
    
    // 체크박스 값 처리
    if (['readAuth', 'createAuth', 'updateAuth', 'deleteAuth'].includes(colDef.field)) {
      data[colDef.field] = newValue ? 'Y' : 'N';
    }
    
    console.log('Program permission changed:', data);
  };
  
  // 메뉴 그리드 셀 값 변경 이벤트
  handleMenuCellValueChanged = (params) => {
    const { data, colDef, newValue } = params;
    
    // rowtype 설정 (수정 표시)
    if (!data.rowtype || data.rowtype === 'r') {
      data.rowtype = 'u';
    }
    
    // 체크박스 값 처리
    if (colDef.field === 'selected') {
      data.selected = newValue; // true/false 값으로 저장
      console.log('Menu checkbox changed:', data.menuId, 'selected:', newValue);
      
      // 데이터셋 업데이트
      this.setState({...this.state});
    }
    
    console.log('Menu cell changed:', data);
  };

  // 메뉴 권한 추가 메서드
  addMenuPermissions = () => {
    console.log('메뉴 권한 추가 시작');
    
    if (!this.selectedUserId) {
      ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
      return;
    }

    // 선택된 메뉴들 가져오기
    const selectedMenus = this.menuGridApi ? this.menuGridApi.getSelectedRows() : [];


    if (selectedMenus.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['추가할 메뉴를 선택하세요.']);
      return;
    }

    // 기존 사용자 메뉴 권한 목록 가져오기
    const currentUserMenus = this.state.dsUserMenuList.getRecords();
    
    // 중복 체크 및 새 권한 추가
    const newPermissions = selectedMenus.filter(menu => {
      return !currentUserMenus.some(userMenu => userMenu.menuId === menu.menuId );
    });

    if (newPermissions.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['선택된 메뉴는 이미 권한이 부여되어 있습니다.']);
      return;
    }

    console.log(newPermissions);
    // 새 권한을 사용자 메뉴 권한 목록에 추가
    const updatedUserMenus = [...currentUserMenus];
    newPermissions.forEach(menu => {
      updatedUserMenus.push({
        userId: this.selectedUserId,
        menuId: menu.menuId,
        menuNm: menu.menuNm,
        authrtGrntSeCd: '01',
        rowtype: 'c' // 신규 생성
      });
    });

    this.state.dsUserMenuList.setRecords(updatedUserMenus);
    this.setState({...this.state});
    
    // ComLib.openDialog('A', 'SYSI0010', [`${newPermissions.length}개의 메뉴 권한이 추가되었습니다.`]);
    // 체크박스 해제
    if (this.menuGridApi) this.menuGridApi.deselectAll();
  };

  // 프로그램 권한 추가 메서드
  addProgramPermissions = () => {
    console.log('프로그램 권한 추가 시작');
    
    if (!this.selectedUserId) {
      ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
      return;
    }

   // 선택된 사용자 프로그램 권한들 가져오기
   const selectedPrograms = this.programGridApi ? this.programGridApi.getSelectedRows() : [];
  
    if (selectedPrograms.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['추가할 프로그램을 선택하세요.']);
      return;
    }

    // 기존 사용자 프로그램 권한 목록 가져오기
    const currentUserPrograms = this.state.dsUserProgramList.getRecords();
    
    // 중복 체크 및 새 권한 추가
    const newPermissions = selectedPrograms.filter(program => {
      return !currentUserPrograms.some(userProgram => userProgram.prgrmId === program.prgrmId);
    });

    if (newPermissions.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['선택된 프로그램은 이미 권한이 부여되어 있습니다.']);
      return;
    }

    // 새 권한을 사용자 프로그램 권한 목록에 추가
    const updatedUserPrograms = [...currentUserPrograms];
    newPermissions.forEach(program => {
      updatedUserPrograms.push({
        userId: this.selectedUserId,
        prgrmId: program.prgrmId,
        prgrmNm: program.prgrmNm,
        httpMethod: program.httpMethod,
        urlAddrPtrn: program.urlAddrPtrn,
        authrtGrntSeCd: '01',
        rowtype: 'c' // 신규 생성
      });
    });

    this.state.dsUserProgramList.setRecords(updatedUserPrograms);
    this.setState({...this.state});
    
    // 체크박스 해제
    if (this.programGridApi) this.programGridApi.deselectAll();
  };

  // 메뉴 권한 제외 메서드
  excludeMenuPermissions = () => {
    console.log('메뉴 제외 권한 추가 시작');
    
    if (!this.selectedUserId) {
      ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
      return;
    }

    // 선택된 메뉴들 가져오기
    const selectedMenus = this.menuGridApi ? this.menuGridApi.getSelectedRows() : [];


    if (selectedMenus.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['추가할 메뉴를 선택하세요.']);
      return;
    }

    // 기존 사용자 메뉴 권한 목록 가져오기
    const currentUserMenus = this.state.dsUserMenuList.getRecords();
    
    // 중복 체크 및 새 권한 추가
    const newPermissions = selectedMenus.filter(menu => {
      return !currentUserMenus.some(userMenu => userMenu.menuId === menu.menuId );
    });

    if (newPermissions.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['선택된 메뉴는 이미 권한이 제외외되어 있습니다.']);
      return;
    }

    console.log(newPermissions);
    // 새 권한을 사용자 메뉴 권한 목록에 추가
    const updatedUserMenus = [...currentUserMenus];
    newPermissions.forEach(menu => {
      updatedUserMenus.push({
        userId: this.selectedUserId,
        menuId: menu.menuId,
        menuNm: menu.menuNm,
        authrtGrntSeCd: '02',
        rowtype: 'c' // 신규 생성
      });
    });

    this.state.dsUserMenuList.setRecords(updatedUserMenus);
    this.setState({...this.state});
    // 체크박스 해제
    if (this.menuGridApi) this.menuGridApi.deselectAll();
  };

  // 프로그램 권한 제외 메서드
  excludeProgramPermissions = () => {
    console.log('프로그램 권한 제외 시작');
    
    if (!this.selectedUserId) {
      ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택하세요.']);
      return;
    }

   // 선택된 사용자 프로그램 권한들 가져오기
   const selectedPrograms = this.programGridApi ? this.programGridApi.getSelectedRows() : [];
  
    if (selectedPrograms.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['제외외할 프로그램을 선택하세요.']);
      return;
    }

    // 기존 사용자 프로그램 권한 목록 가져오기
    const currentUserPrograms = this.state.dsUserProgramList.getRecords();
    
    // 중복 체크 및 새 권한 추가
    const newPermissions = selectedPrograms.filter(program => {
      return !currentUserPrograms.some(userProgram => userProgram.prgrmId === program.prgrmId);
    });

    if (newPermissions.length === 0) {
      ComLib.openDialog('A', 'SYSI0010', ['선택된 프로그램은 이미 권한이 부여되어 있습니다.']);
      return;
    }

    // 새 권한을 사용자 프로그램 권한 목록에 추가
    const updatedUserPrograms = [...currentUserPrograms];
    newPermissions.forEach(program => {
      updatedUserPrograms.push({
        userId: this.selectedUserId,
        prgrmId: program.prgrmId,
        prgrmNm: program.prgrmNm,
        httpMethod: program.httpMethod,
        urlAddrPtrn: program.urlAddrPtrn,
        authrtGrntSeCd: '02',
        rowtype: 'c' // 신규 생성
      });
    });

    this.state.dsUserProgramList.setRecords(updatedUserPrograms);
    this.setState({...this.state});
    // 체크박스 해제
    if (this.programGridApi) this.programGridApi.deselectAll();
  };
  
  // 이벤트 핸들러
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;
        
        switch (btnId) {
          case 'btnSearch':
            if (this.validation('SYS3030R01')) {
              this.transaction('SYS3030R01');
            }
            break;
            
          case 'btnSave':
            // 현재 활성화된 탭에 따라 다른 저장 로직 실행
            if (this.state.activeTab === 'program') {
              // 프로그램 권한 저장
              if (this.validation('SYS3030U02')) {
                this.transaction('SYS3030U02');
              }
            } else if (this.state.activeTab === 'menu') {
              // 메뉴 권한 저장
              if (this.validation('SYS3030U01')) {
                this.transaction('SYS3030U01');
              }
            }
            break;
            
          case 'btnDelete':
            // 먼저 validation 체크
            let validationPassed = false;
            let transId = '';
            
            if (this.state.activeTab === 'program') {
              // 프로그램 권한 삭제
              transId = 'SYS3030D02';
              validationPassed = this.validation('SYS3030D02');
            } else if (this.state.activeTab === 'menu') {
              // 메뉴 권한 삭제
              transId = 'SYS3030D01';
              validationPassed = this.validation('SYS3030D01');
            }
            
            // validation 통과 시에만 컨펌 다이얼로그 표시
            if (validationPassed) {
              ComLib.openDialog('C', 'SYSI0010', ['선택된 권한을 삭제하시겠습니까?'], (checked) => {
                // checked 파라미터를 통해 사용자 선택 확인
                if (checked === true) {
                  this.transaction(transId);
                }
              });
            }
           
            break;
          case 'btnMenuSearch':
            if (this.validation('SYS3030R03')) {
              this.transaction('SYS3030R03');
            }
            break;
          case 'btnProgramSearch':
            if (this.validation('SYS3030R04')) {
              this.transaction('SYS3030R04');
            }
            break;
          case 'btnGrantAdd':
            console.log('권한추가 버튼 클릭',this.state.activeTab);
            // 상태 기반 탭 구분
            if (this.state.activeTab === 'menu') {
              console.log('메뉴 권한 추가 실행');
              this.addMenuPermissions();
            } else {
              console.log('프로그램 권한 추가 실행');
              this.addProgramPermissions();
            }
            break;
          case 'btnGrantExclude':
            console.log('권한제외 버튼 클릭');
            // 상태 기반 탭 구분
            if (this.state.activeTab === 'menu') {
              console.log('메뉴 권한 제외 실행');
              this.excludeMenuPermissions();
            } else {
              console.log('프로그램 권한 제외 실행');
              this.excludeProgramPermissions();
            }
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
        
        // 상태 업데이트 패턴
        this.setState({
          ...this.state,
          textFieldProps: {
            ...this.state.textFieldProps,
            [fieldId]: {
              ...this.state.textFieldProps[fieldId],
              value: value
            }
          }
        });
        
        // 프로그램 검색 필드 변경 시 실시간 검색
        if (fieldId === 'iptProgramName' && this.selectedUserId) {
          // 디바운싱을 위한 타이머 설정 (옵션)
          clearTimeout(this.searchTimer);
          this.searchTimer = setTimeout(() => {
            if (this.validation('SYS3030R02')) {
              this.transaction('SYS3030R02');
            }
          }, 500);
        }
      },
      
      onKeyPress: (e) => {
        // 엔터 키 이벤트 처리
        if (e.key === 'Enter') {
          let fieldId = e.target.id;
          
          // 메뉴ID/명 텍스트박스에서 엔터 키 입력 시 메뉴 검색 실행
          if (fieldId === 'iptMenuName') {
            if (this.validation('SYS3030R03')) {
              this.transaction('SYS3030R03');
            }
          }
          // 프로그램 ID/명 텍스트박스에서 엔터 키 입력 시 프로그램 검색 실행
          else if (fieldId === 'iptProgramName') {
            if (this.validation('SYS3030R04')) {
              this.transaction('SYS3030R04');
            }
          }
        }
      }
    },
    
    selectbox: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;
        
        this.setState({
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [fieldId]: {
              ...this.state.selectboxProps[fieldId],
              value: value,
              selected: e.target.selectedIndex
            }
          }
        });
        
        // 메뉴구분 변경 시 실시간 검색
        if (fieldId === 'selMenuType' && this.selectedUserId) {
          if (this.validation('SYS3030R02')) {
            this.transaction('SYS3030R02');
          }
        }
      }
    },
    userSelect: {
      onChange: (userData) => {
        console.log('UserSelect onChange:', userData);
        
        // UserSelect에서 전달받은 userData는 {userId, userNm} 형태
        this.setState({
          ...this.state,
          userSelectProps: {
            ...this.state.userSelectProps,
            userId: userData.userId,
            userNm: userData.userNm,
            keyword: userData.userId || userData.userNm || ''
          }
        });
      }
    },
    ognzSelect: {
      onChange: (ognzData) => {
        console.log('OgnzSelect onChange:', ognzData);
        
        this.setState({
          ...this.state,
          ognzSelectProps: {	
            ...this.state.ognzSelectProps,
            ognzCd: ognzData.ognzCd,
            ognzNm: ognzData.ognzNm,
            keyword: ognzData.ognzCd || ognzData.ognzNm || ''
          }
        });
      }
    }
  };
  
  render() {

    const { activeTab, userInfo, settings } = this.state;

    return (
      <FullPanel>
        {/* 검색 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{flexDirection: 'column'}}>
              <div style={{display: 'grid', gridTemplateColumns: '42px 460px 73px 460px', alignItems: 'center'}}>
                <Label value="조직" />
                <OgnzSelect
                  id={this.state.ognzSelectProps.id}
                  ognzCd={this.state.ognzSelectProps.ognzCd}
                  ognzNm={this.state.ognzSelectProps.ognzNm}
                  keyword={this.state.ognzSelectProps.keyword}
                  disabled={false}
                  onChange={this.event.ognzSelect.onChange}
                />
                <Label value="사용자" />
                <UserSelect
                  id={this.state.userSelectProps.id}
                  userId={this.state.userSelectProps.userId}
                  userNm={this.state.userSelectProps.userNm}
                  keyword={this.state.userSelectProps.keyword}
                  disabled={false}
                  onChange={this.event.userSelect.onChange}
                />
              </div>
            </LFloatArea>
            <RFloatArea>
              <Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
              <Button {...this.state.btnProps.btnReset} onClick={this.event.button.onClick} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        
        {/* 메인 컨텐츠 - 이중 그리드 */}
        <SubFullPanel>
          <FlexPanel>
            <div style={{width : "50%", marginRight: '8px'}} >
                {/* 왼쪽: 사용자 목록 그리드 (50%) */}
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>사용자목록</h3>
                  </LFloatArea>
                </RelativeGroup>
                <Grid 
                  {...this.state.grdProps.grdUserList}
                  data={this.state.dsUserList}
                  onGridReady={this.handleUserGridReady}
                  onRowSelected={this.handleUserRowSelected}
                />
              </ComponentPanel>
            </div>
            <div style={{width : "50%", marginLeft: '8px'}} >
              <Tabs
                id="basicTabs"
                onClick={this.handleTabClick}
              >
                <TabPanel 
                  id="menuAuthInfoTab" 
                  index={0} 
                  label="메뉴 권한"
                >
                  <ComponentPanel className="tab-component-panel">
                    {/* 프로그램 권한 검색 */}
                    <SearchPanel>
                      <RelativeGroup>
                        <LFloatArea style={{flexDirection: 'column'}}>
                          <div style={{display: 'grid', gridTemplateColumns: '70px 200px', alignItems: 'center'}}>
                            <Label value="메뉴ID/명" />
                            <Textfield 
                              {...this.state.textFieldProps.iptMenuName} 
                              onChange={this.event.input.onChange} 
                              onKeyPress={this.event.input.onKeyPress}
                            />
                          </div>
                        </LFloatArea>
                        <RFloatArea>
                          <Button {...this.state.btnProps.btnMenuSearch} onClick={this.event.button.onClick} />
                        </RFloatArea>
                      </RelativeGroup>
                    </SearchPanel>
                    
                    <ComponentPanel>
                      <RelativeGroup>
                        <LFloatArea>
                          <h3>사용자 권한 프로그램</h3>
                        </LFloatArea>
                        <RFloatArea>
                          <Button {...this.state.btnProps.btnGrantAdd} onClick={this.event.button.onClick} />
                          <Button {...this.state.btnProps.btnGrantExclude} onClick={this.event.button.onClick} />
                        </RFloatArea>
                      </RelativeGroup>
                      <Grid 
                        {...this.state.grdProps.grdMenuList}
                        data={this.state.dsMenuList}
                        onGridReady={this.handleMenuGridReady}
                        onCellValueChanged={this.handleMenuCellValueChanged}
                      />
                    </ComponentPanel>
                  
                    <ComponentPanel>
                      <RelativeGroup>
                        <LFloatArea>
                          <h3>사용자권한 예외적용 프로그램</h3>
                        </LFloatArea>
                      </RelativeGroup>
                      <Grid 
                        {...this.state.grdProps.grdUserMenuList}
                        data={this.state.dsUserMenuList}
                        onGridReady={this.handleUserMenuGridReady}
                        onCellValueChanged={this.handleProgramCellValueChanged}
                      />
                    </ComponentPanel>
                    
                    {/* 권한 관리 버튼 */}
                    <BottomPanel>
                      <RelativeGroup>
                        <RFloatArea>
                          <Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
                          <Button {...this.state.btnProps.btnDelete} onClick={this.event.button.onClick} />
                        </RFloatArea>
                      </RelativeGroup>
                    </BottomPanel>
                  </ComponentPanel>
              </TabPanel>
              <TabPanel
                id="programInfoTab"
                index={1}
                label="프로그램 권한"
              >
                <ComponentPanel className="tab-component-panel">
                  {/* 프로그램 권한 검색 */}
                  <SearchPanel>
                    <RelativeGroup>
                      <LFloatArea style={{flexDirection: 'column'}}>
                        <div style={{display: 'grid', gridTemplateColumns: '95px 300px 1fr', alignItems: 'center'}}>
                          <Label value="프로그램 ID/명" />                          
                            <Textfield 
                            {...this.state.textFieldProps.iptProgramName} 
                            onChange={this.event.input.onChange} 
                            onKeyPress={this.event.input.onKeyPress}
                            />
                            <span className="text-caption">
                              ※ 공통 프로그램은 권한관리 대상이 아니므로 조회되지 않습니다.
                            </span>
                        </div>
                        
                      </LFloatArea>
                      <RFloatArea>
                        <Button {...this.state.btnProps.btnProgramSearch} onClick={this.event.button.onClick} />
                      </RFloatArea>
                    </RelativeGroup>
                  </SearchPanel>
                    
                  <ComponentPanel>
                    <RelativeGroup>
                      <LFloatArea>
                        <h3>사용자등급 권한 프로그램</h3>
                      </LFloatArea>
                      <RFloatArea>
                        <Button {...this.state.btnProps.btnGrantAdd} onClick={this.event.button.onClick} />
                        <Button {...this.state.btnProps.btnGrantExclude} onClick={this.event.button.onClick} />
                      </RFloatArea>
                    </RelativeGroup>                  
                    <Grid 
                      {...this.state.grdProps.grdProgramList}
                      data={this.state.dsProgramList}
                      onGridReady={this.handleProgramGridReady}
                      onCellValueChanged={this.handleProgramCellValueChanged}
                    />
                  </ComponentPanel>
                  
                  <ComponentPanel>
                    <RelativeGroup>
                      <LFloatArea>
                        <h3>사용자등급 예외적용 프로그램</h3>
                      </LFloatArea>
                    </RelativeGroup>
                    <Grid 
                      {...this.state.grdProps.grdUserProgramList}
                      data={this.state.dsUserProgramList}
                      onGridReady={this.handleUserProgramGridReady}
                      onCellValueChanged={this.handleProgramCellValueChanged}
                    />
                  </ComponentPanel>

                  {/* 권한 관리 버튼 */}
                  <BottomPanel>
                    <RelativeGroup>
                      <RFloatArea>
                        <Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
                        <Button {...this.state.btnProps.btnDelete} onClick={this.event.button.onClick} />
                      </RFloatArea>
                    </RelativeGroup>
                  </BottomPanel>
                </ComponentPanel>
              </TabPanel>
            </Tabs>
          </div>
        </FlexPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View; 