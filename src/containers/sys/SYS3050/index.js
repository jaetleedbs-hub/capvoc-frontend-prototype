/**
 * SYS3050 프로그램권한관리
 * 
 * 사용자 권한 등급별로 프로그램 접근 권한을 관리하는 시스템입니다.
 * - 사용자 권한 등급 목록 조회 (SYS3050R01)
 * - 사용자 권한 등급 별 프로그램목록 조회 (SYS3050R02)
 * - 사용자 권한 등급 별 프로그램목록 저장 (SYS3050U01)
 */

import React from 'react';

// 레이아웃 컴포넌트
import { 
  ComponentPanel, FullPanel, SubFullPanel, BottomPanel,
  SearchPanel, LFloatArea, RFloatArea, RelativeGroup
} from 'components';

// UI 컴포넌트
import { Grid, Label, Textfield, Selectbox } from 'components';
import { Checkbox } from 'components/Input';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, DateLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
  constructor(props) {
        super(props);
    
    // 체크박스 렌더러 정의
    // this.checkboxRenderer = (params) => {
    //   return (
    //     <Checkbox
    //       id={params.column.colId}
    //       index={'checkbox_'+params.rowIndex}
    //       keyProp={params.rowIndex}
    //       value=""
    //       checked={params.value}
    //       readOnly={false}
    //       onClick={(e) => {
    //         const records = this.state.dsUserAuthTypeMenuList.getRecords();
    //         if (typeof params.rowIndex === 'number' && records[params.rowIndex]) {
    //           const row = records[params.rowIndex];
    //           const newValue = e.checked ? 'Y' : 'N';
    //           row.saveSeYn = newValue;
    //           if (!row.rowtype || row.rowtype === 'r') {
    //             row.rowtype = 'u';
    //           }
    //           this.state.dsUserAuthTypeMenuList.setRecords([...records]);
    //           this.setState({ dsUserAuthTypeMenuList: this.state.dsUserAuthTypeMenuList });
    //       }
    //       }}
    //     />
    //   );
    // };

    // 그리드 API 참조 (필수)
    this.gridApiLeft = null;        // 좌측 권한등급 그리드
    this.columnApiLeft = null;
    this.gridApiRight = null;       // 우측 메뉴권한 그리드
    this.columnApiRight = null;
    
    // 현재 선택 행 추적용
    this.currentAuthRow = '';       // 선택된 권한등급
    this.currentMenuRow = '';       // 선택된 메뉴
    
    // 이벤트 중복 실행 방지 플래그
    this.isProcessingRowSelection = false;


    this.state = {
      // 데이터셋 (필수)
      dsUserAuthList: DataLib.datalist.getInstance(),           // 권한등급 목록
      dsUserAuthTypeMenuList: DataLib.datalist.getInstance(),   // 메뉴권한 목록
      dsSearch: DataLib.datalist.getInstance(), 
      
      selectedProgramRows: [],
      extractedRows: [],

      // SelectBox Props
      selectboxProps: {
        selAuthLevel: {
          id: 'selAuthLevel',
          value: '',
          dataset: [
            { code: '', name: '전체' }
          ],
          width: 120,
          selected: 0,
          disabled: false,
          label: '권한등급'
        },
        selUseYn: {
          id: 'selUseYn',
          value: '',
          dataset: ComLib.convComboList(ComLib.getCommCodeList("USE_YN"), newScrmObj.constants.select.argument.all),
          width: 80,
          selected: 0,
          disabled: false,
          label: '사용여부'
        },

      },
      
      // TextField Props
      textFieldProps: {
        iptMenuSearch: {
          id: 'iptMenuSearch',
          name: 'iptMenuSearch',
          value: '',
          placeholder: '프로그램ID 또는 프로그램명',
          maxLength: 50,
          readOnly: false,
          disabled: false,
          type: 'text'
        }
      },

      // Button Props
      btnProps: {
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
        btnRefresh: {
          id: 'btnRefresh',
          disabled: false,
          value: '',
          hidden: false,
          color: 'grey',
          className: 'icon-reset',
          type: 'icon'
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
        }
      },
      
      // Grid Props
      grdProps: {
        grdAuthLevel: {
          id: 'grdAuthLevel',
          areaName: '권한등급 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          header: [
            {
              headerName: '권한등급코드',
              field: 'authrtCd',
              colId: 'authrtCd',
              editable: false,
              width: 120,
              type: 'code',
              req: true,
              textAlign: 'center'
            },
            {
              headerName: '권한등급명',
              field: 'authrtNm',
              colId: 'authrtNm',
              editable: false,
              width: 150,
              type: 'text',
              req: true,
              textAlign: 'left'
            },
            {
              headerName: '사용자수',
              field: 'authrtUserCnt',
              colId: 'authrtUserCnt',
              editable: false,
              width: 80,
              type: 'num',
              textAlign: 'right'
            },

          ],
          height: 'calc(100vh - 314px)',
          rowSelection: 'single'
        },
        
        grdMenuAuth: {
          id: 'grdMenuAuth',
          areaName: '프로그램권한 목록',
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          rowSelection: 'multiple',
          suppressRowClickSelection : true,
          onSelectionChanged: this.handleChangeMenuAuthSelection.bind(this),
          header: [
            // No 컬럼은 rowNum: true 옵션으로 자동 추가됨
            {
              headerName: '프로그램ID',
              field: 'prgrmId',
              colId: 'prgrmId',
              editable: false,
              width: 100,
              type: 'code',
              req: true,
              textAlign: 'center'
            },
            {
              headerName: '프로그램명',
              field: 'prgrmNm',
              colId: 'prgrmNm',
              editable: false,
              width: 180,
              type: 'text',
              req: true,
              textAlign: 'left'
            },
            {
              headerName: '권한부여 여부',
              field: 'checkbox',
              colId: 'saveSeYn',
              // type : 'checkbox',
              // editable: true,
              // headerCheckboxSelection: true,
              checkboxSelection: true,
              width: 80,
              // cellRendererFramework: this.checkboxRenderer,
              textAlign: 'center'
            }

          ],
          height: 'calc(100vh - 372px)',
          rowNum: true, // No 컬럼 추가

        }
      }
    };
    
    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
    this.handleGridLeftReady = this.handleGridLeftReady.bind(this);
    this.handleGridRightReady = this.handleGridRightReady.bind(this);
    this.handleLeftRowSelected = this.handleLeftRowSelected.bind(this);
    this.handleLeftRowDoubleClicked = this.handleLeftRowDoubleClicked.bind(this);
    this.handleRightRowDoubleClicked = this.handleRightRowDoubleClicked.bind(this);
    this.handleCellValueChanged = this.handleCellValueChanged.bind(this);
  }
  
  /*------------------------------------------------------------------------------------------------*/
  // [1. 라이프사이클 메서드]
  /*------------------------------------------------------------------------------------------------*/
  
  componentDidMount() {
    // 그리드 초기화
    this.initializeGrids();
    
    // 초기 데이터 로드
    this.loadInitialData();
  }

  componentWillUnmount() {
    // 전역 핸들러 제거
    if (this.gridApiLeft) {
      this.gridApiLeft.removeEventListener('rowSelected', this.handleLeftRowSelected);
    }
  }
  
  /*------------------------------------------------------------------------------------------------*/
  // [2. 초기화 메서드]
  /*------------------------------------------------------------------------------------------------*/
  
  initializeGrids = () => {
    // 그리드 완전 초기화
    this.setState({
      dsUserAuthList: DataLib.datalist.getInstance(),
      dsUserAuthTypeMenuList: DataLib.datalist.getInstance(),
      dsSearch: DataLib.datalist.getInstance()
    }, () => {
      // 그리드 API가 준비된 경우 초기화
      if (this.gridApiLeft) {
        this.gridApiLeft.updateGridOptions({ rowData: [] });
      }
      if (this.gridApiRight) {
        this.gridApiRight.updateGridOptions({ rowData: [] });
        this.gridApiRight.refreshCells();
      }
      console.log('[Debug] 그리드 초기화 완료');
    });
  };

  loadInitialData = () => {
    // 권한등급 목록 조회
    if (this.validation('SYS3050R01')) {
      this.transaction('SYS3050R01');
    }
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [3. 유효성 검증]
  /*------------------------------------------------------------------------------------------------*/
  
  validation = (...params) => {
    let transId = params[0];
    
    switch (transId) {
      case 'SYS3050R01': // 권한등급 목록 조회
        // 별도 검증 조건 없음 (전체 조회)
        break;
        
              case 'SYS3050R02': // 프로그램권한 조회
        // 권한등급 선택 여부 검증
        if (StrLib.isNull(this.currentAuthRow)) {
          ComLib.openDialog('A', 'SYSI0010', ['권한등급을 선택하세요.']);
          return false;
        }
        break;
      
        case 'SYS3050U01': // 프로그램권한 저장
        if (this.state.extractedRows.length === 0) {
          ComLib.openDialog('A', 'SYSI0010', ['저장할 프로그램권한을 수정하세요.']);
          return false;
        }
        
        // 선택된 권한등급 확인
        if (StrLib.isNull(this.currentAuthRow)) {
          ComLib.openDialog('A', 'SYSI0010', ['권한등급을 선택하세요.']);
          return false;
        }
        
        break;
        
      default:
        break;
    }
    
    return true;
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [4. 서버 통신]
  /*------------------------------------------------------------------------------------------------*/
  
  transaction = (...params) => {
    let transId = params[0];
    let transManager = new TransManager();
    
    try {
      switch (transId) {
        case 'SYS3050R01':
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/prgrm-authrt/r01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch',
            datasetrecv: 'dsUserAuthList'
          });
          
          // 검색 조건 데이터셋 구성 (전체 조회)
          let searchData = {
            authLevel: '',
            useYn: '',
            searchKeyword: ''
          };
          
          this.state.dsSearch.setRecords([searchData]);
          transManager.addDataset('dsSearch', this.state.dsSearch.getRecords());
          transManager.agent();
          break;
          
        case 'SYS3050R02':
          try {
            // 권한코드 유효성 검사 추가
            if (!this.currentAuthRow) {
              console.warn('[Warning] 권한코드가 없습니다.');
              ComLib.openDialog('A', 'SYSI0010', ['권한등급을 선택하세요.']);
              return;
            }

            transManager.setTransId(transId);
            transManager.setTransUrl("/api/cmm/prgrm-authrt/r02");
            transManager.setCallBack(this.callback);
            transManager.addConfig({
              datasetsend: 'dsSearch',
              datasetrecv: 'dsUserAuthTypeMenuList'
            });

            // 검색어를 읽어서 menuIdOrNm 파라미터로 전달
            const searchKeyword = this.state.textFieldProps.iptMenuSearch.value;

            const menuSearchData = {
              authrtCd: this.currentAuthRow,
              prgrmIdOrNm: searchKeyword // 검색어가 있으면 전달, 없으면 빈 문자열
            };

            // dsSearch 데이터셋도 검색어 반영
            this.state.dsSearch.setRecords([menuSearchData]);

            transManager.addDataset('dsSearch', this.state.dsSearch.getRecords());
            transManager.setFormData(menuSearchData);

            transManager.agent();
          } catch (err) {
            console.error('[Error] SYS3050R02 호출 중 오류:', err);
            ComLib.openDialog('A', 'SYSI0010', ['프로그램권한 목록 조회 중 오류가 발생했습니다.']);
          }
          break;
          
        case 'SYS3050U01':
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/prgrm-authrt/u01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsUserAuthTypeMenuList',
            datasetrecv: 'dsResult'
          });
          
          // 수정된 항목만 저장 (rowtype === 'u')
          
          transManager.setFormData(this.state.extractedRows);
          transManager.agent();
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error('Transaction Error:', err);
      ComLib.openDialog('A', 'SYSI0010', ['처리 중 오류가 발생했습니다.']);
    }
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [5. 콜백 처리]
  /*------------------------------------------------------------------------------------------------*/
  
  callback = (res) => {
    
    if (res.result) {
      switch (res.id) {
        case 'SYS3050R01':
          // 권한등급 목록 조회 결과 처리
          
          // API 응답 구조에 따라 데이터 추출 방식 수정
          let authListData = [];
          if (res.data) {
            if (Array.isArray(res.data)) {
              authListData = res.data;
            } else if (res.data.dsUserAuthList) {
              authListData = res.data.dsUserAuthList;
            } else if (res.data.data) {
              authListData = res.data.data;
            }
          }
          
          // 새로운 DataList 인스턴스 생성
          const newDsUserAuthList = DataLib.datalist.getInstance();
          newDsUserAuthList.setRecords(authListData);
          
          setTimeout(() => {
            // setState를 통한 상태 업데이트
            this.setState({
              dsUserAuthList: newDsUserAuthList
            }, () => {
              // setState 콜백에서 그리드 데이터 설정
              if (this.gridApiLeft) {
                // 그리드 완전 초기화 후 데이터 설정
                this.gridApiLeft.updateGridOptions({ rowData: [] });
                this.gridApiLeft.updateGridOptions({ rowData: authListData });
                
                // 그리드 포커스 복원
                if (authListData.length > 0) {
                  let rowNum = this.rowFinder(authListData, 'authrtCd', this.currentAuthRow);
                  this.gridApiLeft.setFocusedCell(rowNum, 'authrtCd');
                }
              } else {
                console.warn('[Debug] 그리드 API가 준비되지 않음');
              }
          }, 1000);
          });
          
          // 우측 프로그램권한 목록 완전 초기화
          const newDsUserAuthTypeMenuList = DataLib.datalist.getInstance();
          this.setState({
            dsUserAuthTypeMenuList: newDsUserAuthTypeMenuList
          }, () => {
            if (this.gridApiRight) {
              // 그리드 완전 초기화
              this.gridApiRight.updateGridOptions({ rowData: [] });
              this.gridApiRight.refreshCells();
            }
          });
          
          this.currentAuthRow = '';
          break;
          
        case 'SYS3050R02':
          // 프로그램권한 목록 조회 결과 처리
          
          let menuAuthData = [];
          try {
            // API 응답 데이터 추출
            if (res.data) {
              if (Array.isArray(res.data)) {
                menuAuthData = res.data;
              } else if (res.data.dsUserAuthTypeMenuList) {
                menuAuthData = res.data.dsUserAuthTypeMenuList;
              } else if (res.data.data) {
                menuAuthData = res.data.data;
              }
            }
            
            if (menuAuthData.length === 0) {
              console.warn('[Warning] 프로그램권한 데이터가 없습니다.');
              ComLib.openDialog('A', 'SYSI0010', ['조회된 프로그램권한이 없습니다.']);
            }
          
            // 새로운 DataList 인스턴스 생성
            const newDsMenuAuthList = DataLib.datalist.getInstance();
            
            // saveSeYn 기본값 설정 및 rowtype 초기화
            menuAuthData = menuAuthData.map(item => ({
              ...item,
              saveSeYn: item.saveSeYn || 'N',  // 값이 없으면 'N'으로 설정
              rowtype: 'r'  // 초기 상태는 'r' (read)
            }));
            
            newDsMenuAuthList.setRecords(menuAuthData);
            
            // state 업데이트
            this.setState({
              dsUserAuthTypeMenuList: newDsMenuAuthList
            }, () => {
              // 그리드 데이터 설정
              if (this.gridApiRight) {
                // 그리드 완전 초기화 후 새 데이터 설정
                this.gridApiRight.updateGridOptions({ rowData: [] });
                this.gridApiRight.updateGridOptions({ rowData: menuAuthData });
                
                // saveSeYn === 'Y'인 행만 선택
                this.gridApiRight.forEachNode(node => {
                  if (node.data && node.data.saveSeYn === 'Y') {
                    node.setSelected(true);
                  }
                });
                
                // 그리드 새로고침
                this.gridApiRight.refreshCells();
                
                // 그리드 포커스 복원
                if (menuAuthData.length > 0) {
                  let rowNum = this.rowFinder(menuAuthData, 'prgrmId', this.currentMenuRow);
                  this.gridApiRight.setFocusedCell(rowNum, 'prgrmId');
                }
              } else {
                console.warn('[Warning] 우측 그리드 API가 준비되지 않았습니다.');
              }
            });
            
            if (menuAuthData.length > 0) {
              console.log('[Debug] 프로그램권한 데이터 로드 완료:', menuAuthData.length + '건');
            }
          } catch (err) {
            console.error('[Error] 프로그램권한 데이터 처리 중 오류:', err);
            ComLib.openDialog('A', 'SYSI0010', ['프로그램권한 데이터 처리 중 오류가 발생했습니다.']);
          }
          break;
          
        case 'SYS3050U01':
          // 저장 결과 처리
          ComLib.openDialog('A', 'SYSI0010', ['프로그램권한이 저장되었습니다.']);
          
          // 프로그램권한 재조회
          if (this.validation('SYS3050R02')) {
            this.transaction('SYS3050R02');
          }
          break;
          
        default:
          break;
      }
    } else {
      ComLib.openDialog('A', 'SYSI0010', [res.message || '처리 중 오류가 발생했습니다.']);
    }
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [6. 이벤트 핸들러]
  /*------------------------------------------------------------------------------------------------*/
  
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;
        
        switch (btnId) {
          case 'btnMenuSearch':
            // 프로그램 검색 기능 구현
            this.handleMenuSearch();
            break;
            
          case 'btnRefresh':
            // 검색 조건 초기화
            this.setState({
              ...this.state,
              textFieldProps: {
                ...this.state.textFieldProps,
                iptMenuSearch: {
                  ...this.state.textFieldProps.iptMenuSearch,
                  value: ''
                }
              }
            }, () => {
              // 초기화 후 조회 실행
              if (!StrLib.isNull(this.currentAuthRow)) {
                if (this.validation('SYS3050R02')) {
                  this.transaction('SYS3050R02');
                }
              }
            });
            break;
            
          case 'btnSave':
            // 수정된 항목만 저장
            this.handleSaveMenuAuthState();
            
            // API 호출도 함께 수행
            if (this.validation('SYS3050U01')) {
              this.transaction('SYS3050U01');
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
      },
      
      onKeyPress: (e) => {
        // Enter 키로 프로그램 검색 실행
        if (e.key === 'Enter' && e.target.id === 'iptMenuSearch') {
          this.handleMenuSearch();
        }
      }
    },
    
    selectbox: {
      onChange: (e) => {
        let selectId = e.target.id;
        let value = e.target.value;
        
        this.setState({
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [selectId]: {
              ...this.state.selectboxProps[selectId],
              value: value
            }
          }
        });
      }
    }
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [7. 그리드 이벤트 핸들러]
  /*------------------------------------------------------------------------------------------------*/
  
  handleGridLeftReady = (params) => {
    this.gridApiLeft = params.api;
    this.columnApiLeft = params.columnApi;
    
    console.log('[Debug] 좌측 그리드 준비 완료');
    
    // 그리드 준비 후 현재 state의 데이터 설정
    const currentData = this.state.dsUserAuthList.getRecords();
    
    if (currentData && currentData.length > 0) {
      this.gridApiLeft.updateGridOptions({ rowData: currentData });
      console.log('[Debug] 좌측 그리드 데이터 설정 완료:', currentData.length + '건');
    } else {
      console.log('[Debug] 좌측 그리드 초기 데이터 없음');
    }
    
    // 그리드 이벤트 설정 최적화
    this.gridApiLeft.addEventListener('rowSelected', this.handleLeftRowSelected);
  };
  
  handleGridRightReady = (params) => {
    this.gridApiRight = params.api;
    this.columnApiRight = params.columnApi;
    
    console.log('[Debug] 우측 그리드 준비 완료');
    
    // 그리드 기본 설정
    if (this.gridApiRight) {
      // 초기 빈 데이터 설정으로 완전 초기화
      this.gridApiRight.updateGridOptions({ rowData: [] });
      this.gridApiRight.refreshCells();
      console.log('[Debug] 우측 그리드 초기화 완료');
    }
  };
  
  handleLeftRowSelected = (params) => {
    try {
      // 이벤트 중복 실행 방지
      if (this.isProcessingRowSelection) {
        console.log('[Debug] 행 선택 처리 중 - 중복 실행 방지');
        return;
      }
      
      console.log('[Debug] 좌측 그리드 행 선택 이벤트 처리 시작');
      console.log('[Debug] 선택된 행 데이터:', params?.data?.authrtCd);
      
      if (params?.data?.authrtCd) {
        const selectedData = params.data;
        const newAuthRow = selectedData.authrtCd;
        
        // 같은 행이 이미 선택된 경우 중복 처리 방지
        if (this.currentAuthRow === newAuthRow) {
          console.log('[Debug] 같은 권한등급이 이미 선택됨:', newAuthRow);
          return;
        }
        
        // 처리 중 플래그 설정
        this.isProcessingRowSelection = true;
        
        this.currentAuthRow = newAuthRow;
        console.log('[Debug] 새로운 권한등급 선택:', newAuthRow);
        
        // 우측 그리드 초기화
        if (this.gridApiRight) {
          this.gridApiRight.updateGridOptions({ rowData: [] });
          this.gridApiRight.refreshCells();
        }
        
        // 0.3초 딜레이 후 프로그램권한 목록 조회
        setTimeout(() => {
          // 선택된 권한등급에 대한 프로그램권한 목록 조회
          if (this.validation('SYS3050R02')) {
            this.transaction('SYS3050R02');
          } else {
            console.warn('[Warning] validation 실패');
          }
          
          // 처리 완료 후 플래그 해제
          this.isProcessingRowSelection = false;
        }, 300);
      } else {
        console.warn('[Flow-2-Fail] 권한코드 없음:', params);
        this.isProcessingRowSelection = false;
      }
    } catch (err) {
      console.error('[Error] 행 선택 처리 중 오류:', err);
      this.isProcessingRowSelection = false;
    }
  };

  handleLeftRowDoubleClicked = (params) => {

    // try {
    //   if (params?.data?.authrtCd) {
    //     const selectedData = params.data;
    //     this.currentAuthRow = selectedData.authrtCd;
    //     console.log('[Flow-2] 선택된 권한코드 설정:', {
    //       selectedData,
    //       currentAuthRow: this.currentAuthRow
    //     });
        
    //     // 선택된 권한등급에 대한 프로그램권한 목록 조회
    //     if (this.validation('SYS3050R02')) {
    //       console.log('[Flow-3] validation 통과, transaction 호출 직전');
    //       this.transaction('SYS3050R02');
    //     } else {
    //       console.log('[Flow-3-Fail] validation 실패');
    //     }
    //   } else {
    //     console.warn('[Flow-2-Fail] 권한코드 없음:', params);
    //   }
    // } catch (err) {
    //   console.error('[Error] 더블클릭 처리 중 오류:', err);
    // }
  };
  

  handleRightRowDoubleClicked = (params) => {
    try {
      if (params?.data) {
        // 필요한 경우 여기에 더블클릭 처리 로직 추가
      }
    } catch (err) {
      console.error('[Error] 우측 그리드 더블클릭 처리 중 오류:', err);
    }
  };
  
  handleCellValueChanged = (params) => {
    const { data, colDef, newValue, oldValue } = params;

    if (newValue !== oldValue) {
      // rowtype만 data에 직접 할당
      if (!data.rowtype || data.rowtype === 'r') {
        data.rowtype = 'u';
      }
      // 강제 동기화: setRecords + setState
      const records = this.state.dsUserAuthTypeMenuList.getRecords();
      this.state.dsUserAuthTypeMenuList.setRecords([...records]);
      this.setState({ dsUserAuthTypeMenuList: this.state.dsUserAuthTypeMenuList });
      // 그리드 새로고침
      if (this.gridApiRight) {
        this.gridApiRight.refreshCells({
          rowNodes: [params.node],
          columns: [colDef]
        });
      }
    }
  };
  
  handleChangeMenuAuthSelection = (params) => {
    const selectedRows = params.gridApi.getSelectedRows();
    this.setState({
      selectedProgramRows: selectedRows,
    });
  };

  /*------------------------------------------------------------------------------------------------*/
  // [8. 유틸리티 함수]
  /*------------------------------------------------------------------------------------------------*/
  
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
  
  handleAuthInheritance = (data, fieldName, newValue) => {
    // 권한 상속 관계 처리
    const menuAuthData = this.state.dsUserAuthTypeMenuList.getRecords();
    
    if (fieldName === 'readAuthYn' && newValue === false) {
      // 조회권한이 해제되면 다른 모든 권한도 해제
      data.insertAuthYn = false;
      data.updateAuthYn = false;
      data.deleteAuthYn = false;
    } else if ((fieldName === 'insertAuthYn' || fieldName === 'updateAuthYn' || fieldName === 'deleteAuthYn') && newValue === true) {
      // 등록/수정/삭제 권한이 설정되면 조회권한 자동 설정
      data.readAuthYn = true;
    }
    
    // 그리드 새로고침
    if (this.gridApiRight) {
      this.gridApiRight.refreshCells();
    }
  };

  // 프로그램 검색 기능
  handleMenuSearch = () => {
    // 검색어가 있든 없든 항상 서버에 재조회 요청
    if (!StrLib.isNull(this.currentAuthRow)) {
      // 그리드 초기화 후 조회
      if (this.gridApiRight) {
        this.gridApiRight.updateGridOptions({ rowData: [] });
        this.gridApiRight.refreshCells();
      }
      
      if (this.validation('SYS3050R02')) {
        this.transaction('SYS3050R02');
      }
    } else {
      ComLib.openDialog('A', 'SYSI0010', ['권한등급을 먼저 선택하세요.']);
    }
  };

  // 프로그램 권한 상태 저장 및 확인 (수정된 항목만)
  handleSaveMenuAuthState = () => {
    try {
      
      // 현재 선택된 권한등급 확인
      if (StrLib.isNull(this.currentAuthRow)) {
        console.warn('[Warning] 선택된 권한등급이 없습니다.');
        ComLib.openDialog('A', 'SYSI0010', ['권한등급을 선택하세요.']);
        return;
      }
      
      // // 수정된 항목만 가져오기 (rowtype === 'u')
      // const modifiedRows = [];
      // const allRecords = this.state.dsUserAuthTypeMenuList.getRecords();
      
      // allRecords.forEach(item => {
      //   if (item.rowtype === 'u') {
      //     modifiedRows.push(item);
      //   }
      // });
      
      
      //         if (!modifiedRows || modifiedRows.length === 0) {
      //     console.warn('[Warning] 수정된 프로그램 권한이 없습니다.');
      //     ComLib.openDialog('A', 'SYSI0010', ['저장할 프로그램 권한을 수정하세요.']);
      //     return;
      //   }
      
      // // 수정된 행들만 처리
      // const updatedModifiedRows = modifiedRows.map(item => {
      //   const updatedItem = { ...item };
        
      //   // 권한등급 코드 설정
      //   updatedItem.authrtCd = this.currentAuthRow;
        
      //   return updatedItem;
      // });
      
      
      // // 수정된 행들만 새로운 DataList로 생성
      // const newDsSelectedMenuAuthList = DataLib.datalist.getInstance();
      // newDsSelectedMenuAuthList.setRecords(updatedModifiedRows);
      
      // // 수정된 행들만 state에 저장 (임시 저장용)
      // this.setState({
      //   dsSelectedMenuAuthList: newDsSelectedMenuAuthList
      // }, () => {
        
      //   // 저장된 상태 요약 출력
      //   const savedCount = updatedModifiedRows.length;
        
      //   // ComLib.openDialog('A', 'SYSI0010', [`수정된 ${savedCount}개 프로그램 권한이 저장되었습니다.`]);
        

      // });
      
      const allRecords = this.state.dsUserAuthTypeMenuList.getRecords();
      const selectedRows = this.state.selectedProgramRows;
      const selectedProgramIds = new Set(selectedRows.map(row => row.prgrmId));
  
      const modifiedRows = allRecords.reduce((acc, record) => {
        const newSaveSeYn = selectedProgramIds.has(record.prgrmId) ? 'Y' : 'N';
        if (record.saveSeYn !== newSaveSeYn) {
          acc.push({ ...record, saveSeYn: newSaveSeYn });
        }
        return acc;
      }, []);

      this.setState({ extractedRows: modifiedRows }, () => {
        if (this.validation('SYS3050U01')) {
          this.transaction('SYS3050U01');
        }
      });
    } catch (err) {
      console.error('[Error] 프로그램 권한 상태 저장 중 오류:', err);
      ComLib.openDialog('A', 'SYSI0010', ['프로그램 권한 상태 저장 중 오류가 발생했습니다.']);
    }
  };

  handleChangeProgramAuthSelection = (params) => {
    const selectedRows = params.gridApi.getSelectedRows();
    this.setState({
      selectedProgramRows: selectedRows,
    });
  };
  
  /*------------------------------------------------------------------------------------------------*/
  // [9. 렌더링]
  /*------------------------------------------------------------------------------------------------*/
  
  render() {
    return (
      <FullPanel>
        {/* 메인 컨텐츠 영역 */}
        <SubFullPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between'}}>
            {/* 좌측: 권한등급 목록 */}
            <div style={{ width: '35%', marginRight: '10px'}}>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>권한등급 목록</h3>
                  </LFloatArea>
                </RelativeGroup>
                <Grid 
                  {...this.state.grdProps.grdAuthLevel}
                  data={this.state.dsUserAuthList}
                  onGridReady={this.handleGridLeftReady}
                  onRowDoubleClicked={this.handleLeftRowDoubleClicked}
                />
              </ComponentPanel>
            </div>
            
            {/* 우측: 프로그램권한 목록 */}
            <div style={{ width: '65%', marginLeft: '10px' }}>
              <SearchPanel>
                <RelativeGroup>
                  <LFloatArea style={{flexDirection: 'column'}}>
                    <div style={{display: 'grid', gridTemplateColumns: '84px 300px 1fr', alignItems: 'center'}}>
                      <Label value="프로그램검색" />
                        <Textfield 
                          {...this.state.textFieldProps.iptMenuSearch}
                          onChange={this.event.input.onChange}
                          onKeyPress={this.event.input.onKeyPress}
                        />
                        <span className="text-caption">
                          ※ 공통 프로그램은 권한관리 대상이 아니므로 조회되지 않습니다.
                        </span>
                    </div>
                  </LFloatArea>
                  <RFloatArea>
                    <Button 
                      {...this.state.btnProps.btnMenuSearch}
                      onClick={this.event.button.onClick}
                    />
                    <Button 
                      {...this.state.btnProps.btnRefresh}
                      onClick={this.event.button.onClick}
                    />
                  </RFloatArea>
                </RelativeGroup>
              </SearchPanel>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>프로그램 목록</h3>
                  </LFloatArea>
                </RelativeGroup>
                <SubFullPanel className="auth-type-grid">
                  <Grid 
                    {...this.state.grdProps.grdMenuAuth}
                    data={this.state.dsUserAuthTypeMenuList}
                    onGridReady={this.handleGridRightReady}
                    onRowSelected={this.handleRightRowSelected}
                    onRowDoubleClicked={this.handleRightRowDoubleClicked}
                    onCellValueChanged={this.handleCellValueChanged}
                  />
                </SubFullPanel>
              </ComponentPanel>
              {/* 버튼 영역 */}
              <BottomPanel>
                <RelativeGroup>
                  <RFloatArea>
                    <Button 
                      {...this.state.btnProps.btnSave}
                      onClick={this.event.button.onClick}
                    />
                  </RFloatArea>
                </RelativeGroup>
              </BottomPanel>
            </div>
          </div>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;