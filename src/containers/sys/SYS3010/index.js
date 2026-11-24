import React from 'react';

// Layout 컴포넌트
import { ComponentPanel, FullPanel, SubFullPanel, SearchPanel, BottomPanel,
         RelativeGroup, LFloatArea, RFloatArea, FlexPanel } from 'components';

// UI 컴포넌트
import { Grid, Label, Textfield, Selectbox, Textarea, Table } from 'components';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';
import axios from 'axios';

/**
 * SYS3010 사용자권한코드관리
 * 
 * 기능:
 * - 사용자별 권한 코드 조회/검색
 * - 권한 코드 추가/수정/삭제
 * - 권한 정보 상세 표시
 * - 엑셀 다운로드
 */
class View extends React.Component {
    constructor(props) {
        super(props);
        
        // 그리드 API 참조 (필수)
        this.gridApi = null;
        this.columnApi = null;
        
        // 현재 선택 행 추적용
        this.currentRow = '';
        
        // 현재 진행 중인 트랜잭션 추적
        this.currentTransaction = null;
        
        // API 호출 디바운싱을 위한 타이머
        this.apiCallTimer = null;
        
        // 행 선택 중복 방지를 위한 플래그
        this.isProcessingRowSelection = false;
        

        
        // 임시 코드 관리 (신규 데이터용)
        this.maxTempCd = 0;
        
        this.state = {
            // 데이터셋 (필수)
            dsUserAuthList: DataLib.datalist.getInstance(),
            dsSearch: DataLib.datalist.getInstance(),
            
            // UI Props 관리
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
                btnAdd: {
                    id: 'btnAdd',
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
                btnExcel: {
                    id: 'btnExcel',
                    disabled: false,
                    value: '엑셀다운로드',
                    hidden: false,
                    color: 'yellow',
                    size: 'md',
                    fiiled: true
                }
            },
            
            grdProps: {
                grdUserAuthList: {
                    id: 'grdUserAuthList',
                    areaName: '사용자 권한 코드 목록',
                    addRowBtn: false,
                    delRowBtn: false,
                    dnlExcelBtn: false,
                    height: 'calc(100vh - 524px)',
                    rowSelection: 'single',
                    rowNum: true,
                    header: [
                        {
                            headerName: '권한코드',
                            field: 'authrtCd',
                            colId: 'authrtCd',
                            editable: false,
                            width: 120,
                            type: 'text',
                            req: true,
                            textAlign: 'center'
                        },
                        {
                            headerName: '권한명',
                            field: 'authrtNm',
                            colId: 'authrtNm',
                            editable: false,
                            width: 150,
                            type: 'text',
                            req: true,
                            textAlign: 'left'
                        },

                        {
                            headerName: '조직조회범위',
                            field: 'ognzInqRangCdNm',
                            colId: 'ognzInqRangCdNm',
                            editable: false,
                            width: 120,
                            type: 'text',
                            req: false,
                            textAlign: 'center'
                        },
                        {
                            headerName: '권한레벨',
                            field: 'authrtSe',
                            colId: 'authrtSe',
                            editable: false,
                            width: 120,
                            type: 'text',
                            req: false,
                            textAlign: 'center',
                            valueFormatter: (param) => {
                                const codeList = ComLib.getCommCodeList("AUTHRT_SE");
                                const foundCode = codeList.find(code => code.value === param.data.authrtSe);
                                return foundCode ? foundCode.name : param.data.authrtSe;
                            }
                        },
                        {
                            headerName: '기본화면',
                            field: 'bscScrnMenuId',
                            colId: 'bscScrnMenuId',
                            editable: false,
                            width: 150,
                            type: 'text',
                            req: false,
                            textAlign: 'left'
                        },
    
                        {
                            headerName: '수정일시',
                            field: 'mdfcnDt',
                            colId: 'mdfcnDt',
                            editable: false,
                            width: 140,
                            type: 'text',
                            textAlign: 'center',
                            valueFormatter: (param) => {
                                return param.value ? StrLib.setFormatData(param.value, 'YYYY-MM-DD HH:mm') : '';
                            }
                        }
                    ]
                }
            },
            
            selectboxProps: {
                selOrgScope: {
                    id: 'selOrgScope',
                    value: '',
                    width: 120,
                    selected: 0,
                    disabled: false,
                    dataset: [{ value: '', name: '전체' }]
                },
                selDetailOrgScope: {
                    id: 'selDetailOrgScope',
                    value: '',
                    width: 120,
                    selected: 0,
                    disabled: false,
                    dataset: [{ value: '', name: '전체' }]
                },
                selDetailAuthLevel: {
                    id: 'selDetailAuthLevel',
                    value: '',
                    width: 120,
                    selected: 0,
                    disabled: false,
                    dataset: [{ value: '', name: '전체' }]
                }
            },
            
            textFieldProps: {
                iptSearchKeyword: {
                    id: 'iptSearchKeyword',
                    name: 'iptSearchKeyword',
                    value: '',
                    placeholder: '권한코드/명',
                    maxLength: 100,
                    readOnly: false,
                    disabled: false,
                    type: 'text'
                },
                iptAuthCd: {
                    id: 'iptAuthCd',
                    name: 'iptAuthCd',
                    value: '',
                    placeholder: "권한코드",
                    maxLength: 50,
                    readOnly: false,
                    disabled: false,
                    type: 'text'
                },
                iptAuthNm: {
                    id: 'iptAuthNm',
                    name: 'iptAuthNm',
                    value: '',
                    placeholder: '권한명',
                    maxLength: 100,
                    readOnly: false,
                    disabled: false,
                    type: 'text'
                },
                iptAuthType: {
                    id: 'iptAuthType',
                    name: 'iptAuthType',
                    value: '',
                    placeholder: '권한구분',
                    maxLength: 50,
                    readOnly: false,
                    disabled: false,
                    type: 'text'
                },
                iptDefaultScreen: {
                    id: 'iptDefaultScreen',
                    name: 'iptDefaultScreen',
                    value: '',
                    placeholder: '기본화면',
                    maxLength: 100,
                    readOnly: false,
                    disabled: false,
                    type: 'text'
                },

            },
            
            textareaProps: {
                txtRemark: {
                    id: 'txtRemark',
                    name: 'txtRemark',
                    value: '',
                    placeholder: '비고를 입력하세요',
                    rows: 4,
                    readOnly: false,
                    disabled: false
                }
            },
            
            // 선택된 권한 상세 정보
            selectedAuth: {
                authCd: '',
                authNm: '',
                authType: '',
                orgScope: '',
                defaultScreen: '',
                remark: ''
            }
        };
        
        // 이벤트 바인딩 (필수)
        this.event.button.onClick = this.event.button.onClick.bind(this);
        this.event.input.onChange = this.event.input.onChange.bind(this);
        this.event.input.onKeyPress = this.event.input.onKeyPress.bind(this);
        this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
        this.event.textarea.onChange = this.event.textarea.onChange.bind(this);
        this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
        this.event.grid.onRowSelected = this.event.grid.onRowSelected.bind(this);
        this.event.grid.onCellValueChanged = this.event.grid.onCellValueChanged.bind(this);
    }
    
    // 라이프사이클
    componentDidMount() {
        // 1. 조직 조회 범위 공통코드 설정
        this.loadOrgScopeCode();
        
        // 2. 메인 조회 실행
        if (this.validation('SYS3010R01')) {
            this.transaction('SYS3010R01');
        }
    }
    
    componentWillUnmount() {
        // 타이머 정리
        if (this.apiCallTimer) {
            clearTimeout(this.apiCallTimer);
        }
        
        // 플래그 정리
        this.isProcessingRowSelection = false;

    }

    // 공통코드 로드 (ComLib 사용)
    loadOrgScopeCode = () => {
        // 조직 조회 범위 공통코드 로드
        const orgScopeCodeList = ComLib.getCommCodeList("OGNZ_INQ_RANG_CD");
        const orgScopeDataset = [{ value: '', name: '전체' }, ...orgScopeCodeList];
        
        // 권한레벨 공통코드 로드
        const authLevelCodeList = ComLib.getCommCodeList("AUTHRT_SE");
        const authLevelDataset = [{ value: '', name: '전체' }, ...authLevelCodeList];
        
        this.setState({
            selectboxProps: {
                ...this.state.selectboxProps,
                selOrgScope: {
                    ...this.state.selectboxProps.selOrgScope,
                    dataset: orgScopeDataset
                },
                selDetailOrgScope: {
                    ...this.state.selectboxProps.selDetailOrgScope,
                    dataset: orgScopeDataset
                },
                selDetailAuthLevel: {
                    ...this.state.selectboxProps.selDetailAuthLevel,
                    dataset: authLevelDataset
                }
            }
        });
    }





    
    // 유효성 검증
    validation = (...params) => {
        let transId = params[0];
        
        switch (transId) {
            case 'SYS3010R01': // 조회
                // 검색 조건 유효성 검증 (특별한 검증 없음)
                break;
                
            case 'SYS3010R02': // 상세 조회
                if (StrLib.isNull(this.currentRow)) {
                    ComLib.openDialog('A', 'SYSI0010', ['선택된 행이 없습니다.']);
                    return false;
                }
                break;
                
            case 'SYS3010U01': // 저장
                const records = this.state.dsUserAuthList.getRecords();
                if (!records || records.length === 0) {
                    ComLib.openDialog('A', 'SYSI0010', ['저장할 데이터가 없습니다.']);
                    return false;
                }
                
                // 필수값 검증 (상세 폼 데이터)
                if (StrLib.isNull(this.state.textFieldProps.iptAuthCd.value)) {
                    ComLib.openDialog('A', 'SYSI0010', ['권한코드를 입력하세요.']);
                    return false;
                }
                if (StrLib.isNull(this.state.textFieldProps.iptAuthNm.value)) {
                    ComLib.openDialog('A', 'SYSI0010', ['권한명을 입력하세요.']);
                    return false;
                }
                if (StrLib.isNull(this.state.selectboxProps.selDetailOrgScope.value)) {
                    ComLib.openDialog('A', 'SYSI0010', ['조직조회범위를 선택하세요.']);
                    return false;
                }
                if (StrLib.isNull(this.state.selectboxProps.selDetailAuthLevel.value)) {
                    ComLib.openDialog('A', 'SYSI0010', ['권한레벨을 선택하세요.']);
                    return false;
                }
                break;
                
            case 'SYS3010D01': // 삭제
                if (StrLib.isNull(this.currentRow)) {
                    ComLib.openDialog('A', 'SYSI0010', ['삭제할 행을 선택하세요.']);
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
        
        // 현재 트랜잭션 추적
        this.currentTransaction = transManager;
        
        try {
            switch (transId) {
                case 'SYS3010R01': // 사용자 권한 코드 조회
                    console.log('SYS3010R01 조회 시작'); // 디버깅용 로그
                    
                    transManager.setTransId(transId);
                    transManager.setTransUrl("/api/cmm/authrt-cd/r01");
                    transManager.setCallBack(this.callback);
                    
                    // 검색 조건 구성 (camelCase 필수)
                    let searchData = {
                        authrtCdOrNm: this.state.textFieldProps.iptSearchKeyword.value || '',
                        ognzInqRangCd: this.state.selectboxProps.selOrgScope.value || ''
                    };
                    
                    transManager.setFormData(searchData);
                    transManager.agent();
                    break;
                    
                case 'SYS3010R02': // 사용자 권한 코드 상세 조회
                    console.log('SYS3010R02 상세 조회 시작')
                    transManager.setTransId(transId);
                    transManager.setTransUrl("/api/cmm/authrt-cd/r02");
                    transManager.setCallBack(this.callback);  
                    
                    // 현재 선택된 권한코드로 검색 조건 구성
                    console.log('현재 선택된 권한코드:', this.currentRow);
                    let detailSearchData = {
                        authrtCd: this.currentRow
                    };
                    transManager.setFormData(detailSearchData);
                    transManager.agent();
                    break;
                    
                case 'SYS3010U01': // 사용자 권한 코드 저장
                    transManager.setTransId(transId);
                    transManager.setTransUrl("/api/cmm/authrt-cd/u01");
                    transManager.setCallBack(this.callback);
                    transManager.addConfig({
                        datasetsend: 'dsUserAuth'
                    });
                    
                                         // 상세 폼의 데이터로 저장용 데이터 구성
                     let saveData = {
                         authrtCd: this.state.textFieldProps.iptAuthCd.value,
                         authrtNm: this.state.textFieldProps.iptAuthNm.value,
                         authrtSe: this.state.selectboxProps.selDetailAuthLevel.value,
                         ognzInqRangCd: this.state.selectboxProps.selDetailOrgScope.value,
                         bscScrnMenuId: this.state.textFieldProps.iptDefaultScreen.value,
                         rowtype: this.currentRow ? 'u' : 'c' // 기존 데이터면 수정, 신규면 등록
                     };
                    
                    console.log('저장 모드:', this.currentRow ? '수정' : '신규');
                    console.log('저장 데이터:', saveData);
                    transManager.setFormData(saveData);
                    transManager.agent();
                    break;
                    
                case 'SYS3010D01': // 사용자 권한 코드 삭제
                    transManager.setTransId(transId);
                    transManager.setTransUrl("/api/cmm/authrt-cd/d01");
                    transManager.setCallBack(this.callback);
                    transManager.addConfig({
                        datasetsend: 'dsUserAuth'
                    });
                    
                    // 현재 선택된 권한코드로 삭제 데이터 구성
                    let deleteData = {
                        authrtCd: this.currentRow,
                        rowtype: 'd'
                    };
                    
                    transManager.setFormData(deleteData);
                    transManager.agent();
                    break;
                    
                default:
                    break;
            }
        } catch (err) {
            console.error('Transaction Error:', err);
        }
    };
    
    // 응답 처리
    callback = (res) => {
        console.log('API 응답 전체:', res); // 디버깅용 로그
        
        // 트랜잭션 완료 시 추적 해제
        this.currentTransaction = null;
        
        // 행 선택 처리 플래그 해제
        this.isProcessingRowSelection = false;
        
        if (res.result) {
            switch (res.id) {
                case 'SYS3010R01': // 조회 결과 처리
                    console.log('조회 응답 데이터:', res.data); // 디버깅용 로그
                    
                    // 다양한 응답 구조에 대응
                    let resultData = [];
                    if (res.data) {
                        if (Array.isArray(res.data)) {
                            // res.data가 바로 배열인 경우
                            resultData = res.data;
                        } else if (res.data.dsUserAuthList && Array.isArray(res.data.dsUserAuthList)) {
                            // res.data.dsUserAuthList가 배열인 경우
                            resultData = res.data.dsUserAuthList;
                        } else if (res.data.list && Array.isArray(res.data.list)) {
                            // res.data.list가 배열인 경우
                            resultData = res.data.list;
                        }
                    }
                    
                    console.log('최종 데이터:', resultData); // 디버깅용 로그
                    console.log('데이터 개수:', resultData.length); // 디버깅용 로그
                    
                    this.state.dsUserAuthList.setRecords(resultData);
                    this.setState({...this.state});
                    
                    // 그리드 포커스 복원
                    if (this.gridApi && resultData.length > 0) {
                        let rowNum = this.rowFinder(resultData, 'authrtCd', this.currentRow);
                        this.gridApi.setFocusedCell(rowNum, 'authrtCd');
                    }
                    break;
                    
                case 'SYS3010R02': // 상세 조회 결과 처리
                    console.log('SYS3010R02 응답 데이터:', res.data); // 디버깅용 로그
                    
                    // 신규 모드일 때는 상세 데이터를 설정하지 않음
                    if (!this.currentRow) {
                        console.log('신규 모드이므로 상세 데이터 설정 건너뜀');
                        break;
                    }
                    
                    // 다양한 응답 구조에 대응
                    let detailData = res.data;
        
                    console.log('상세 데이터:', detailData); // 디버깅용 로그
                    
                    if (detailData) {
                        // 상세 폼에 데이터 설정 (수정 모드에서는 권한코드 필드 비활성화)
                        this.setState({
                            ...this.state,
                            selectedAuth: {
                                authrtCd: detailData.authrtCd || detailData.authCd || '',
                                authrtNm: detailData.authrtNm || detailData.authNm || '',
                                authrtSe: detailData.authrtSe || detailData.authSe || '',
                                ognzInqRangCd: detailData.ognzInqRangCd || detailData.orgScope || '',
                                bscScrnMenuId: detailData.bscScrnMenuId || detailData.defaultScreen || '',
                                sortSn: detailData.sortSn || detailData.sortOrder || '',
                                useYn: detailData.useYn || 'Y'
                            },
                            textFieldProps: {
                                ...this.state.textFieldProps,
                                iptAuthCd: { 
                                    ...this.state.textFieldProps.iptAuthCd, 
                                    value: detailData.authrtCd || detailData.authCd || '',
                                    disabled: true  // 수정 모드에서는 비활성화
                                },
                               iptAuthNm: { ...this.state.textFieldProps.iptAuthNm, value: detailData.authrtNm || detailData.authNm || '' },
                                 iptDefaultScreen: { ...this.state.textFieldProps.iptDefaultScreen, value: detailData.bscScrnMenuId || detailData.defaultScreen || '' }
                            },
                             selectboxProps: {
                                 ...this.state.selectboxProps,
                                 selDetailOrgScope: { 
                                     ...this.state.selectboxProps.selDetailOrgScope, 
                                     value: detailData.ognzInqRangCd || detailData.orgScope || '',
                                     selected: (detailData.ognzInqRangCd || detailData.orgScope) ? 
                                         this.state.selectboxProps.selDetailOrgScope.dataset.findIndex(item => 
                                             item.value === (detailData.ognzInqRangCd || detailData.orgScope)
                                         ) : 0
                                 },
                                 selDetailAuthLevel: { 
                                     ...this.state.selectboxProps.selDetailAuthLevel, 
                                     value: detailData.authrtSe || detailData.authSe || '',
                                     selected: (detailData.authrtSe || detailData.authSe) ? 
                                         this.state.selectboxProps.selDetailAuthLevel.dataset.findIndex(item => 
                                             item.value === (detailData.authrtSe || detailData.authSe)
                                         ) : 0
                                 }
                             },
                            textareaProps: {
                                ...this.state.textareaProps,
                                txtRemark: { ...this.state.textareaProps.txtRemark, value: detailData.remark || '' }
                            }
                        });
                        
                        console.log('State 업데이트 완료'); // 디버깅용 로그
                    } else {
                        console.error('상세 데이터를 찾을 수 없습니다:', res.data);
                        // 데이터가 없을 경우 상세 폼 초기화
                        this.clearDetailForm();
                    }
                    break;
                    
                case 'SYS3010U01': // 저장 결과 처리
                    ComLib.openDialog('A', 'SYSI0010', ['저장되었습니다.']);
                    
                    // 저장 후 권한코드 필드 비활성화 (수정 모드 유지)
                    if (this.currentRow) {
                        this.setState({
                            ...this.state,
                            textFieldProps: {
                                ...this.state.textFieldProps,
                                iptAuthCd: { 
                                    ...this.state.textFieldProps.iptAuthCd, 
                                    disabled: true  // 수정 모드에서는 비활성화 유지
                                }
                            }
                        });
                    }
                    
                    this.transaction('SYS3010R01'); // 재조회
                    break;
                    
                case 'SYS3010D01': // 삭제 결과 처리
                    ComLib.openDialog('A', 'SYSI0010', ['삭제되었습니다.']);
                    this.currentRow = '';
                    
                    // 삭제 후 상세 폼 초기화
                    this.clearDetailForm();
                    
                    this.transaction('SYS3010R01'); // 재조회
                    break;
                    
                default:
                    break;
            }
        } else {
            // 에러 처리
            console.error('API 오류 응답:', res); // 디버깅용 로그
            ComLib.openDialog('A', 'SYSI0010', [res.message || '처리 중 오류가 발생했습니다.']);
        }
    };
    
    // 이벤트 핸들러
    event = {
        button: {
            onClick: (e) => {
                let btnId = e.target.id;
                
                switch (btnId) {
                    case 'btnSearch':
                        if (this.validation('SYS3010R01')) {
                            this.transaction('SYS3010R01');
                        }
                        break;
                        
                    case 'btnAdd':
                        this.addNewRow();
                        break;
                        
                    case 'btnSave':
                        if (this.validation('SYS3010U01')) {
                            this.transaction('SYS3010U01');
                        }
                        break;
                        
                    case 'btnDelete':
                        if (this.validation('SYS3010D01')) {
                            ComLib.openConfirmDialog('선택된 권한을 삭제하시겠습니까?', (result) => {
                                if (result) {
                                    this.transaction('SYS3010D01');
                                }
                            });
                        }
                        break;
                        
                    case 'btnExcel':
                        this.downloadExcel();
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
                // 엔터키(13)를 눌렀을 때 검색 실행
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.validation('SYS3010R01')) {
                        this.transaction('SYS3010R01');
                    }
                }
            }
        },
        
        selectbox: {
            onChange: (e) => {
                let fieldId = e.target.id;
                let value = e.target.value;
                let selectedIndex = e.target.selectedIndex;
                
                this.setState({
                    ...this.state,
                    selectboxProps: {
                        ...this.state.selectboxProps,
                        [fieldId]: {
                            ...this.state.selectboxProps[fieldId],
                            value: value,
                            selected: selectedIndex
                        }
                    }
                });
            }
        },
        
        textarea: {
            onChange: (e) => {
                let fieldId = e.target.id;
                let value = e.target.value;
                
                this.setState({
                    ...this.state,
                    textareaProps: {
                        ...this.state.textareaProps,
                        [fieldId]: {
                            ...this.state.textareaProps[fieldId],
                            value: value
                        }
                    }
                });
            }
        },
        
        grid: {
            onGridReady: (params) => {
                this.gridApi = params.api;
                this.columnApi = params.columnApi;
            },
            
            onRowSelected: (params) => {
                console.log('onRowSelected 전체 params:', params);
                
                // 행 선택 해제 이벤트인 경우 (params.data가 null)
                if (!params.data) {
                    console.log('행 선택 해제 이벤트 - 무시');
                    return; // 해제 이벤트는 무시
                }
                
                // 이미 처리 중인 경우 중복 실행 방지
                if (this.isProcessingRowSelection) {
                    console.log('이미 행 선택 처리 중 - 중복 실행 방지');
                    return;
                }
                
                // 처리 시작 플래그 설정
                this.isProcessingRowSelection = true;
                
                // 실제 행 선택 이벤트인 경우만 처리
                const selectedData = params.data;
                console.log('선택된 행의 전체 데이터:', selectedData);
                console.log('authrtCd 값:', selectedData.authrtCd);
                console.log('authCd 값:', selectedData.authCd);
                
                // 다양한 필드명으로 권한코드 추출 시도
                const newCurrentRow = selectedData?.authrtCd || selectedData?.authCd || '';
                console.log('추출된 권한코드:', newCurrentRow);
                
                // 같은 행을 다시 선택한 경우 중복 실행 방지
                if (this.currentRow === newCurrentRow) {
                    console.log('같은 행이므로 중복 실행 방지');
                    this.isProcessingRowSelection = false; // 플래그 해제
                    return;
                }
                
                // 즉시 상세 폼 초기화 (이전 데이터 제거)
                this.clearDetailForm();
                
                this.currentRow = newCurrentRow;
                console.log('현재 선택된 권한코드:', this.currentRow);
                
                // 상세 정보 조회 API 실행 (신규 모드가 아닐 때만)
                if (this.currentRow && this.validation('SYS3010R02')) {
                    console.log('SYS3010R02 API 호출 시작');
                    // 이전 타이머가 있으면 취소
                    if (this.apiCallTimer) {
                        clearTimeout(this.apiCallTimer);
                    }
                    
                    // 이전 API 호출이 진행 중인 경우 취소
                    if (this.currentTransaction) {
                        this.currentTransaction.cancel();
                    }
                    
                    // 즉시 API 호출 (디바운싱 제거)
                    this.transaction('SYS3010R02');
                } else {
                    console.log('API 호출 조건 불만족:', { currentRow: this.currentRow, validation: this.validation('SYS3010R02') });
                    this.isProcessingRowSelection = false; // 플래그 해제
                }
            },
            
            
            onCellValueChanged: (params) => {
                const { data, colDef, newValue, oldValue } = params;
                
                if (newValue !== oldValue) {
                    // 변경된 데이터 처리
                    data[colDef.field] = newValue;
                    
                    // rowtype 설정 (CRUD 관리)
                    if (!data.rowtype || data.rowtype === 'r') {
                        data.rowtype = 'u'; // 수정
                    }
                }
            }
        }
    };
    
    // 그리드 포커스 복원용 유틸리티
    rowFinder = (targetRecords, targetColumn, currentRow) => {
        let rowNum = 0;
        
        if (!targetRecords || StrLib.isNull(currentRow)) {
            return rowNum;
        }
        
        for (let i = 0; i < targetRecords.length; i++) {
            if (targetRecords[i].authCd === currentRow) {
                rowNum = i;
                break;
            }
        }
        return rowNum;
    };
    
    // 상세 폼 초기화 메서드
    clearDetailForm = () => {
        this.setState({
            ...this.state,
            textFieldProps: {
                ...this.state.textFieldProps,
                iptAuthCd: { 
                    ...this.state.textFieldProps.iptAuthCd, 
                    value: '',
                    disabled: false
                },
                iptAuthNm: { ...this.state.textFieldProps.iptAuthNm, value: '' },
                iptAuthType: { ...this.state.textFieldProps.iptAuthType, value: '' },
                iptDefaultScreen: { ...this.state.textFieldProps.iptDefaultScreen, value: '' }
            },
            selectboxProps: {
                ...this.state.selectboxProps,
                selDetailOrgScope: { 
                    ...this.state.selectboxProps.selDetailOrgScope, 
                    value: '',
                    selected: 0
                }
            },
            textareaProps: {
                ...this.state.textareaProps,
                txtRemark: { ...this.state.textareaProps.txtRemark, value: '' }
            },
            selectedAuth: {
                authCd: '',
                authNm: '',
                authType: '',
                orgScope: '',
                defaultScreen: '',
                remark: ''
            }
        });
        
        console.log('상세 폼 초기화 완료');
    };

    // 신규 행 추가
    addNewRow = () => {
        // 현재 선택 행 초기화
        this.currentRow = '';
         // 상세 폼 초기화 (신규 모드에서는 권한코드 필드 활성화)
                                    this.setState({
                                        ...this.state,
                                        textFieldProps: {
                                            ...this.state.textFieldProps,
                                            iptAuthCd: { 
                                                ...this.state.textFieldProps.iptAuthCd, 
                                                value: '',
                                                disabled: false  // 신규 모드에서는 활성화
                                            },
                                            iptAuthNm: { ...this.state.textFieldProps.iptAuthNm, value: '' },
                                            iptDefaultScreen: { ...this.state.textFieldProps.iptDefaultScreen, value: '' }
                                        },
                                        selectboxProps: {
                                            ...this.state.selectboxProps,
                                            selDetailOrgScope: { 
                                                ...this.state.selectboxProps.selDetailOrgScope, 
                                                value: '',
                                                selected: 0
                                            },
                                            selDetailAuthLevel: { 
                                                ...this.state.selectboxProps.selDetailAuthLevel, 
                                                value: '',
                                                selected: 0
                                            }
                                        },
                                        textareaProps: {
                                            ...this.state.textareaProps,
                                            txtRemark: { ...this.state.textareaProps.txtRemark, value: '' }
                                        },
                                        selectedAuth: {
                                            authCd: '',
                                            authNm: '',
                                            authType: '',
                                            orgScope: '',
                                            defaultScreen: '',
                                            remark: ''
                                        }
        }, () => {
            // 권한코드 입력 필드에 포커스
            setTimeout(() => {
                const authCdInput = document.getElementById('iptAuthCd');
                if (authCdInput) {
                    authCdInput.focus();
                }
            }, 100);
        });
    };
    
    // 엑셀 다운로드
    downloadExcel = () => {
        if (this.gridApi) {
            this.gridApi.exportDataAsCsv({
                fileName: `사용자권한코드목록_${StrLib.getToday()}.csv`
            });
        }
    };
    
    render() {
        return (
            <FullPanel>
                {/* 검색 영역 */}
                <SearchPanel>
                    <RelativeGroup>
                        <LFloatArea style={{flexDirection: 'column'}}>
                            <div style={{display: 'grid', gridTemplateColumns: '80px 200px 106px 120px', alignItems: 'center'}}>
                                <Label value="권한코드/명" />
                                <Textfield {...this.state.textFieldProps.iptSearchKeyword} 
                                            onChange={this.event.input.onChange}
                                            onKeyPress={this.event.input.onKeyPress} />
                                <Label value="조직조회범위" />
                                <Selectbox {...this.state.selectboxProps.selOrgScope} 
                                            onChange={this.event.selectbox.onChange} />
                            </div>
                        </LFloatArea>
                        <RFloatArea>
                            <Button {...this.state.btnProps.btnSearch} 
                                    onClick={this.event.button.onClick} />
                            <Button {...this.state.btnProps.btnReset} 
                                    onClick={this.event.button.onClick} />
                        </RFloatArea>
                    </RelativeGroup>
                </SearchPanel>
                
                {/* 메인 컨텐츠 영역 */}
                <SubFullPanel>
                    <ComponentPanel>
                        <RelativeGroup>
                            <LFloatArea>
                                <h3>사용자 권한 코드 목록</h3>
                            </LFloatArea>
                        </RelativeGroup>
                        {/* 권한 목록 그리드 */}
                        <Grid {...this.state.grdProps.grdUserAuthList}
                                data={this.state.dsUserAuthList}
                                onGridReady={this.event.grid.onGridReady}
                                onRowSelected={this.event.grid.onRowSelected}
                                onCellValueChanged={this.event.grid.onCellValueChanged} />
                    </ComponentPanel>
                </SubFullPanel>
                
                {/* 상세정보 패널 */}
                <SubFullPanel>
                    <ComponentPanel>
                        <RelativeGroup>
                            <LFloatArea>
                                <h3>사용자 권한 코드 상세</h3>
                            </LFloatArea>
                        </RelativeGroup>
                        <Table  
                            id="" 
                            colGrp={[
                            {width: '7%'}, {width: '20%'}, 
                            {width: '7%'}, {width: ''},  
                            {width: '7%'}, {width: '20%'}
                            ]}
                            tbData={[
                            [
                                {type: 'T', value: '사용자권한코드', colSpan: 1, rowSpan: 1 },
                                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                                    <Textfield {...this.state.textFieldProps.iptAuthCd} 
                                    onChange={this.event.input.onChange} 
                                        />
                                )},
                                {type: 'T', value: '권한명', colSpan: 1, rowSpan: 1 },
                                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                                    <Textfield {...this.state.textFieldProps.iptAuthNm} 
                                    onChange={this.event.input.onChange} 
                                    />
                                )},
                                {type: 'T', value: '조직조회범위', colSpan: 1, rowSpan: 1 },
                                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                                    <Selectbox {...this.state.selectboxProps.selDetailOrgScope} 
                                    onChange={this.event.selectbox.onChange} 
                                    />
                                )}                      
                            ],
                            [
                                {type: 'T', value: '권한레벨', colSpan: 1, rowSpan: 1 },
                                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                                    <Selectbox {...this.state.selectboxProps.selDetailAuthLevel} 
                                    onChange={this.event.selectbox.onChange} 
                                    />
                                )},
                                {type: 'T', value: '기본화면', colSpan: 1, rowSpan: 1 },
                                {type: 'D', colSpan: 3, rowSpan: 1, value: (
                                    <Textfield {...this.state.textFieldProps.iptDefaultScreen} 
                                    onChange={this.event.input.onChange} 
                                    />
                                )}
                            ]
                            ]}
                        />
                    </ComponentPanel>
                    
                    {/* 버튼 영역 */}
                    <BottomPanel>
                        <RelativeGroup>
                            <RFloatArea>
                                <Button {...this.state.btnProps.btnAdd} 
                                        onClick={this.event.button.onClick} />
                                <Button {...this.state.btnProps.btnSave} 
                                        onClick={this.event.button.onClick} />
                                <Button {...this.state.btnProps.btnDelete} 
                                        onClick={this.event.button.onClick} />
                            </RFloatArea>
                        </RelativeGroup>
                    </BottomPanel>
                </SubFullPanel>
            </FullPanel>
        );
    }
}

export default View; 