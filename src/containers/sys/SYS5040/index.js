import React from 'react';

// Layout Components
import { 
    ComponentPanel, FlexPanel, FullPanel, SubFullPanel, BottomPanel,
    SearchPanel, LFloatArea, RFloatArea, RelativeGroup 
} from 'components';

// UI Components
import { 
    Grid, Label, Textfield, Selectbox, Table
} from 'components';
import { BasicButton as Button } from 'components';

// Common Libraries
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
    constructor(props) {
        super(props);

        // Grid API
        this.gridLCatApi = null;
        this.gridSCatApi = null;
        this.gridRfrncApi = null;

        // Grid-related states
        this.currentRow = {
            lcat: '',
            scat: ''
        };
        
        this.state = {
            // DataSets
            dsLCatList: DataLib.datalist.getInstance(),      // 대분류 목록 (대분류 그리드)
            dsSCatList: DataLib.datalist.getInstance(),      // 소분류 목록 (소분류 그리드)
            dsRfrncList: DataLib.datalist.getInstance(),     // 참조 목록 (참조 그리드)

            dsLCatDtl: DataLib.datalist.getInstance(),       // 대분류 상세 (대분류 상세 폼)
            dsSCatDtl: DataLib.datalist.getInstance(),       // 소분류 상세 (소분류 상세 폼)
            
            dsSearch: DataLib.datalist.getInstance(),         // 검색 조건 (API 전송용)
            dsLCatSearch: DataLib.datalist.getInstance(),     // 대분류 검색 조건
            dsSCatSearch: DataLib.datalist.getInstance(),     // 소분류 검색 조건

            deletedRfrncCds: [], // 🗑️ 삭제할 참조코드 목록

            // Button Props
            btnProps: {
                btnSearchLCat: { 
                    id: 'btnSearchLCat', 
                    value: '조회', 
                    color: 'blue', 
                    fiiled: true, 
                    className: 'icon-srch',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnResetLCat: {
                    id: 'btnResetLCat',
                    value: '',
                    color: 'grey',
                    className: 'icon-reset',
                    type: 'icon',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick
                },
                btnSaveLCat: { 
                    id: 'btnSaveLCat', 
                    value: '저장', 
                    color: 'blue', 
                    fiiled: true, 
                    className: 'icon-act',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnNewLCat: { 
                    id: 'btnNewLCat', 
                    value: '신규', 
                    color: 'grey', 
                    fiiled: false, 
                    className: 'icon-add',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                
                btnSearchSCat: { 
                    id: 'btnSearchSCat', 
                    value: '조회', 
                    color: 'blue', 
                    fiiled: true, 
                    className: 'icon-srch',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnResetSCat: {
                    id: 'btnResetSCat',
                    value: '',
                    color: 'grey',
                    className: 'icon-reset',
                    type: 'icon',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick
                },
                btnSaveSCat: { 
                    id: 'btnSaveSCat', 
                    value: '저장', 
                    color: 'blue', 
                    fiiled: true, 
                    className: 'icon-act',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnNewSCat: { 
                    id: 'btnNewSCat', 
                    value: '신규', 
                    color: 'grey', 
                    fiiled: false, 
                    className: 'icon-add',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },

                btnAddRowRfrnc: { 
                    id: 'btnAddRowRfrnc', 
                    value: '행추가', 
                    color: 'grey',
                    fiiled: false,
                    className: 'icon-plus',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnDelRowRfrnc: { 
                    id: 'btnDelRowRfrnc', 
                    value: '행삭제', 
                    color: 'grey',
                    fiiled: false,
                    className: 'icon-minus',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
                btnSaveRfrnc: { 
                    id: 'btnSaveRfrnc', 
                    value: '저장', 
                    color: 'blue', 
                    fiiled: true, 
                    className: 'icon-act',
                    disabled: false,
                    hidden: false,
                    onClick: this.event.button.onClick 
                },
            },

            // Grid Props
            grdProps: {
                grdLCatList: {
                    id: 'grdLCatList',
                    areaName: '대분류코드 목록',
                    rowNum: true,
                    header: [
                        { headerName: '유형', field: 'cdPlcusCd', width: 100 ,textAlign: 'center'  ,
                            valueGetter: (param) => param.node.data.cdPlcusCd === "SYS" ? '시스템' :'공통'
                        },
                        { headerName: '대분류코드', field: 'cdGroup', width: 120,textAlign: 'left' },
                        { headerName: '대분류코드명', field: 'cdGroupNm', width: 200 },
                        { headerName: '사용여부', field: 'useYnNm', width: 100,textAlign: 'center' ,
                            valueGetter: (param) => ComLib.getComCodeName('USE_YN', param.data.useYn)
                        },
                        { headerName: '비고', field: 'rmrkCn', width: 80 },
                    ],
                    onGridReady: (e) => { this.gridLCatApi = e.api; },
                    onRowClicked: this.event.grid.onRowClicked,
                    height: 'calc(100vh - 602px)',
                    addRowBtn: false,
                    delRowBtn: false,
                },
                grdSCatList: {
                    id: 'grdSCatList',
                    areaName: '소분류코드 목록',
                    header: [
                        { headerName: 'NO', field: 'no', width: 60, type: 'no', 
                            valueGetter: (param) => param.node.rowIndex + 1 },
                        { headerName: '대분류코드', field: 'cdGroup', width: 120,textAlign: 'left' },
                        { headerName: '소분류코드', field: 'cd', width: 120,textAlign: 'center' },
                        { headerName: '소분류코드명', field: 'cdNm', width: 200 },
                        { headerName: '사용여부', field: 'useYn', width: 100,textAlign: 'center' ,
                            valueGetter: (param) => ComLib.getComCodeName('USE_YN', param.data.useYn)
                        },
                        { headerName: '정렬순서', field: 'sortSn', width: 100 },
                    ],
                    onGridReady: (e) => { this.gridSCatApi = e.api; },
                    onRowClicked: this.event.grid.onRowClicked,
                    height: 'calc(100vh - 796px)',
                    addRowBtn: false,
                    delRowBtn: false,
                },
                grdRfrncList: {
                    id: 'grdRfrncList',
                    areaName: '소분류코드 참조',
                    header: [
                        { headerName: '참조코드', field: 'rfrncCd', width: 150, editable: true, req: true },
                        { headerName: '참조명', field: 'rfrncNm', width: 200, editable: true, req: true },
                        { headerName: '참조값', field: 'rfrncVl', width: 150, editable: true, req: true },
                    ],
                    onGridReady: (e) => { this.gridRfrncApi = e.api; },
                    onRowClicked: this.event.grid.onRowClicked,
                    onCellValueChanged: this.event.grid.onCellValueChanged,
                    rowNum: true,
                    height: '102px',
                    addRowBtn: false,
                    delRowBtn: false,
                }
            },

            // Selectbox Props
            selectboxProps: {
                selLCatType: {
                    id: 'selLCatType',
                    dataset: [
                        { value: '', name: '전체' },
                        { value: 'SYS', name: '시스템' },
                        { value: 'COM', name: '공통' },
                    ],
                    value: '',
                    width: 120,
                    onChange: this.event.selectbox.onChange,
                },
                selLCatUseYn: {
                    id: 'selLCatUseYn',
                    dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.all),
                    value: 'Y',
                    width: 120,
                    onChange: this.event.selectbox.onChange,
                },
                selSCatUseYn: {
                    id: 'selSCatUseYn',
                    dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.all),
                    value: 'Y',
                    width: 120,
                    onChange: this.event.selectbox.onChange,
                },
                // Detail forms
                selLCatCdPlcusCdDtl: {
                    id: 'selLCatCdPlcusCdDtl',
                    dataset: [
                        { value: 'SYS', name: '시스템' },
                        { value: 'COM', name: '공통' },
                    ],
                    value: '',
                    width: '100%',
                    disabled: false
                },
                selLCatUseYnDtl: {
                    id: 'selLCatUseYnDtl',
                    dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.none),
                    value: 'Y',
                    width: '100%',
                    disabled: false
                },
                selSCatUseYnDtl: {
                    id: 'selSCatUseYnDtl',
                    dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.none),
                    value: 'Y',
                    width: '100%',
                    disabled: false
                }
            },
            
            // Textfield Props
            textFieldProps: {
                iptLCatCd: { 
                    id: 'iptLCatCd', 
                    name: 'iptLCatCd',
                    value: '', 
                    type: 'text',
                    maxLength: 50,
                    readOnly: false,
                    disabled: false,
                    onChange: this.event.input.onChange, 
                    onKeyPress: this.event.input.onKeyPress 
                },
                iptLCatNm: { 
                    id: 'iptLCatNm', 
                    name: 'iptLCatNm',
                    value: '', 
                    type: 'text',
                    maxLength: 100,
                    readOnly: false,
                    disabled: false,
                    onChange: this.event.input.onChange, 
                    onKeyPress: this.event.input.onKeyPress 
                },
                iptSCatCd: { 
                    id: 'iptSCatCd', 
                    name: 'iptSCatCd',
                    value: '', 
                    type: 'text',
                    maxLength: 50,
                    readOnly: false,
                    disabled: false,
                    onChange: this.event.input.onChange, 
                    onKeyPress: this.event.input.onKeyPress 
                },
                iptSCatNm: { 
                    id: 'iptSCatNm', 
                    name: 'iptSCatNm',
                    value: '', 
                    type: 'text',
                    maxLength: 100,
                    readOnly: false,
                    disabled: false,
                    onChange: this.event.input.onChange, 
                    onKeyPress: this.event.input.onKeyPress 
                },
            }
        };

        this.event.button.onClick = this.event.button.onClick.bind(this);
        this.event.input.onChange = this.event.input.onChange.bind(this);
        this.event.input.onKeyPress = this.event.input.onKeyPress.bind(this);
        this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
        this.event.grid.onRowClicked = this.event.grid.onRowClicked.bind(this);
        this.event.grid.onCellValueChanged = this.event.grid.onCellValueChanged.bind(this);
    }
    
    componentDidMount() {
        if (this.validation("SYS5040R01")) {
            this.transaction("SYS5040R01");
        }
    }

    validation = (transId) => {
        switch (transId) {
            case 'SYS5040R01':
            case 'SYS5040R02':
            case 'SYS5040R03':
            case 'SYS5040R04':
                break;
            case 'SYS5040U01': { // LCat Save
                const cdGroup = this.state.dsLCatDtl.records[0].cdGroup;
                const cdGroupNm = this.state.dsLCatDtl.records[0].cdGroupNm;
                if (StrLib.isNull(cdGroup)) {
                    ComLib.openDialog('A', 'SYSI0010', ['대분류코드를 입력해주세요.']);
                    return false;
                }
                if (StrLib.isNull(cdGroupNm)) {
                    ComLib.openDialog('A', 'SYSI0010', ['대분류코드명을 입력해주세요.']);
                    return false;
                }
                
                // 신규 저장 시 중복 코드 체크
                const isNewMode = this.state.dsLCatDtl.records.rowStatus === 'C';
                if (isNewMode) {
                    const existingCodes = this.state.dsLCatList.getRecords();
                    const isDuplicate = existingCodes.some(item => item.cdGroup === cdGroup);
                    if (isDuplicate) {
                        ComLib.openDialog('A', 'SYSI0010', [`대분류코드 '${cdGroup}'는 이미 존재합니다.`]);
                        return false;
                    }
                }
                break; 
            }
            case 'SYS5040U02': { // SCat Save
                const cd = this.state.dsSCatDtl.records[0].cd;
                const cdNm = this.state.dsSCatDtl.records[0].cdNm;
                if (StrLib.isNull(cd)) {
                    ComLib.openDialog('A', 'SYSI0010', ['소분류코드를 입력해주세요.']);
                    return false;
                }
                if (StrLib.isNull(cdNm)) {
                    ComLib.openDialog('A', 'SYSI0010', ['소분류코드명을 입력해주세요.']);
                    return false;
                }
                
                // 신규 저장 시 중복 코드 체크
                const isNewMode = this.state.dsSCatDtl.records[0].rowStatus === 'C';
                if (isNewMode) {
                    const existingCodes = this.state.dsSCatList.getRecords();
                    const isDuplicate = existingCodes.some(item => 
                        item.cd === cd && item.cdGroup === this.currentRow.cdGroup
                    );
                    if (isDuplicate) {
                        ComLib.openDialog('A', 'SYSI0010', [`소분류코드 '${cd}'는 이미 존재합니다.`]);
                        return false;
                    }
                }
                break;
            }
            case 'SYS5040U03': { // Rfrnc Save
                let rfrncRecords = this.state.dsRfrncList.getRecords();
                
                // 1. 필수 필드 검증
                for (const record of rfrncRecords) {
                    console.log(record)
                    if(StrLib.isNull(record.rfrncCd)) {
                        ComLib.openDialog('A', 'SYSI0010', ['참조코드는 필수입니다.']);
                        return false;
                    }
                }
                
                // 2. 전체 참조코드 중복 체크 (신규 + 기존 모두 포함)
                const allRfrncCodes = rfrncRecords
                    .filter(record => record.rfrncCd && record.rfrncCd.trim() !== '')
                    .map(record => record.rfrncCd);
                
                // 중복된 코드 찾기
                const duplicateCodes = allRfrncCodes.filter((code, index) => 
                    allRfrncCodes.indexOf(code) !== index
                );
                
                if (duplicateCodes.length > 0) {
                    const uniqueDuplicates = [...new Set(duplicateCodes)];
                    ComLib.openDialog('A', 'SYSI0010', [`참조코드 '${uniqueDuplicates[0]}'가 중복 입력되었습니다.`]);
                    return false;
                }
                
                // 3. 신규 코드들만 따로 중복 체크 (추가 검증)
                const newRfrncCodes = rfrncRecords
                    .filter(record => record.rowtype === 'C' && record.rfrncCd && record.rfrncCd.trim() !== '')
                    .map(record => record.rfrncCd);
                
                const existingRfrncCodes = rfrncRecords
                    .filter(record => record.rowtype === 'U' && record.rfrncCd && record.rfrncCd.trim() !== '')
                    .map(record => record.rfrncCd);
                
                // 신규 코드들 중 중복 체크
                const duplicateNewCodes = newRfrncCodes.filter((code, index) => 
                    newRfrncCodes.indexOf(code) !== index
                );
                if (duplicateNewCodes.length > 0) {
                    ComLib.openDialog('A', 'SYSI0010', [`참조코드 '${duplicateNewCodes[0]}'가 중복 입력되었습니다.`]);
                    return false;
                }
                
                // 기존 코드와 중복 체크
                const duplicateWithExisting = newRfrncCodes.filter(code => 
                    existingRfrncCodes.includes(code)
                );
                if (duplicateWithExisting.length > 0) {
                    ComLib.openDialog('A', 'SYSI0010', [`참조코드 '${duplicateWithExisting[0]}'는 이미 존재합니다.`]);
                    return false;
                }
                break;
            }
            default:
                break;
        }
        return true;
    }

    transaction = (transId, params) => {
        let transManager = new TransManager();
        transManager.setTransId(transId);
        transManager.setCallBack(this.callback);

        try {
            switch (transId) {
                case 'SYS5040R01': // LCat list search
                    transManager.setTransUrl("/api/cmm/cd/r01");
                    transManager.addConfig({
                        datasetrecv: "dsLCatList",
                    });
                    
                    const searchData = {
                        cdPlcusCd: this.state.selectboxProps.selLCatType.value,
                        useYn: this.state.selectboxProps.selLCatUseYn.value,
                        cdGroup: this.state.textFieldProps.iptLCatCd.value,
                        cdGroupNm: this.state.textFieldProps.iptLCatNm.value,
                    }
                    transManager.setFormData(searchData);
                    transManager.agent();
                    break;
                
                case 'SYS5040R02': // SCat list search (by LCat click)
                    transManager.setTransUrl("/api/cmm/cd/r02");
                    transManager.addConfig({
                        datasetrecv: "dsLCatDtl",
                    });
                    
                    const searchData2 = {
                        cdGroup: this.currentRow.cdGroup
                    }
                    transManager.setFormData(searchData2);
                    transManager.agent();
                    break;
                
                case 'SYS5040R03': // SCat list search (by button)
                    transManager.setTransUrl("/api/cmm/cd/r03"); // Same as R02 but with more params
                    transManager.addConfig({
                        datasetrecv: "dsSCatList",
                    });
                    
                    const searchData3 = {
                        cdGroup: this.currentRow.cdGroup,
                        useYn: this.state.selectboxProps.selSCatUseYn.value,
                        cd: this.state.textFieldProps.iptSCatCd.value,
                        cdNm: this.state.textFieldProps.iptSCatNm.value,
                    }
                    transManager.setFormData(searchData3);
                    transManager.agent();
                    break;
                
                case 'SYS5040R04': // SCat detail search
                    transManager.setTransUrl("/api/cmm/cd/r04");
                    transManager.addConfig({
                        datasetrecv: "dsSCatDtl",
                    });
                    const searchData4 = {
                        cdGroup: this.currentRow.cdGroup,
                        cd:  this.currentRow.cd,
                    }
                    transManager.setFormData(searchData4);
                    transManager.agent();
                    break;
                
                case 'SYS5040R05': // Rfrnc list search
                    transManager.setTransUrl("/api/cmm/cd/r05");
                    transManager.addConfig({
                        datasetrecv: "dsRfrncList",
                    });
                    const searchData5 = {
                        cdGroup: this.currentRow.cdGroup,
                        cd: this.currentRow.cd,
                    }
                    transManager.setFormData(searchData5);
                    transManager.agent();
                    break;
                
                case 'SYS5040U01': // Save LCat
                    transManager.setTransUrl("/api/cmm/cd/u01");
                    transManager.addConfig({
                        datasetsend: "dsLCatDtl",
                    });
                    const modifyData = {
                        cdGroup: this.state.dsLCatDtl.records[0].cdGroup,
                        cdGroupNm: this.state.dsLCatDtl.records[0].cdGroupNm,
                        cdPlcusCd: this.state.dsLCatDtl.records[0].cdPlcusCd,
                        useYn: this.state.dsLCatDtl.records[0].useYn,
                        rmrkCn: this.state.dsLCatDtl.records[0].rmrkCn,
                    }
                    transManager.setFormData(modifyData);
                    transManager.agent();
                    break;
                
                case 'SYS5040U02': // Save SCat
                    transManager.setTransUrl("/api/cmm/cd/u02");
                    transManager.addConfig({
                        datasetsend: "dsSCatDtl",
                    });
                    const modifyData2 = {
                        cdGroup: this.currentRow.cdGroup,
                        useYn: this.state.dsSCatDtl.records[0].useYn,
                        cd: this.currentRow.cd || this.state.dsSCatDtl.records[0].cd,
                        cdNm: this.state.dsSCatDtl.records[0].cdNm,
                        sortSn: this.state.dsSCatDtl.records[0].sortSn,
                    };
                    transManager.setFormData(modifyData2);
                    transManager.agent();
                    break;
                
             case 'SYS5040U03': // Save Rfrnc
                transManager.setTransUrl("/api/cmm/cd/u03");
                transManager.addConfig({
                    datasetsend: "dsRfrncList",
                });
                let rfrncRecords = this.state.dsRfrncList.getRecords();
                const cd = this.currentRow.cd;
                const cdGroup = this.currentRow.cdGroup;
                if (cd && cdGroup && rfrncRecords && Array.isArray(rfrncRecords)) {
                    rfrncRecords.forEach(rec => {
                        if (rec) {
                            rec.cdGroup = cdGroup || '';
                            rec.cd = cd || '';
                        }
                    });
                    transManager.setFormData(rfrncRecords);
                }
                if(rfrncRecords.length === 0) {
                    transManager.setFormData([{cd:cd, cdGroup:cdGroup}]);
                }

                // 🗑️ 삭제된 참조코드도 함께 전송
                // if (this.state.deletedRfrncCds.length > 0) {
                //     const deletedRfrncData = this.state.deletedRfrncCds.map(rfrncCd => ({
                //         rfrncCd: rfrncCd,
                //         cdGroup: this.currentRow.cdGroup || '',
                //         cd: this.currentRow.cd || '',
                //         deleteFlag: 'Y' // 삭제 플래그
                //     }));
                //     transManager.setFormData(deletedRfrncData);
                // }
                
                transManager.agent();
                break;

                default:
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    }
    
    callback = (res) => {
        switch (res.id) {
            case 'SYS5040R01':
                this.state.dsLCatList.setRecords(res.data);
                this.clearLCatDetail();
                this.clearSCatList();
                this.setState({ ...this.state });
                break;
            case 'SYS5040R02':
                res.data.rowStatus = 'U';
                console.log(res.data);
                this.state.dsLCatDtl.setRecords([res.data]);
                this.setState({ ...this.state });
                break;
            case 'SYS5040R03':
                this.state.dsSCatList.setRecords(res.data);
                this.clearSCatDetail();
                this.setState({ ...this.state });
                break;
            case 'SYS5040R04':
                res.data.rowStatus = 'U';
                this.state.dsSCatDtl.setRecords([res.data]);
                this.setState({ ...this.state });
                break;
            case 'SYS5040R05':
                this.state.dsRfrncList.setRecords(res.data || {});
                this.setState({ ...this.state });
                break;
            case 'SYS5040U01':
                const lcatMode = this.isNewMode('lcat') ? '신규 등록' : '수정';
                ComLib.openDialog('A', 'SYSI0010', [`대분류코드가 ${lcatMode}되었습니다.`]);
                this.transaction("SYS5040R01");
                break;
            case 'SYS5040U02':
                const scatMode = this.isNewMode('scat') ? '신규 등록' : '수정';
                ComLib.openDialog('A', 'SYSI0010', [`소분류코드가 ${scatMode}되었습니다.`]);
                this.transaction("SYS5040R03");
                break;
            case 'SYS5040U03':
                ComLib.openDialog('A', 'SYSI0010', ['저장되었습니다.']);
                this.setState({ deletedRfrncCds: [] }); // 저장 완료 후 삭제 목록 초기화
                // 참조 목록 저장 후 참조 목록 다시 조회
                this.transaction("SYS5040R05", { 
                    cdGroup: this.currentRow.cdGroup,
                    cd: this.currentRow.cd 
                });
                break;
            default:
                break;
        }
    }

    event = {
        button: {
            onClick: (e) => {
                const btnId = e.target.id;
                switch (btnId) {
                    case 'btnSearchLCat':
                        if(this.validation('SYS5040R01')) this.transaction('SYS5040R01');
                        break;
                    case 'btnSearchSCat':
                        if (!this.currentRow.cdGroup) {
                            ComLib.openDialog('A', 'SYSI0010', ['대분류 코드를 먼저 선택해주세요.']);
                            return;
                        }
                        if(this.validation('SYS5040R03')) this.transaction('SYS5040R03');
                        break;
                    case 'btnSaveLCat':
                        if(this.validation('SYS5040U01')) this.transaction('SYS5040U01');
                        break;
                    case 'btnSaveSCat':
                        if (!this.currentRow.cdGroup) {
                            ComLib.openDialog('A', 'SYSI0010', ['대분류 코드를 먼저 선택해주세요.']);
                            return;
                        }
                        if(this.validation('SYS5040U02')) this.transaction('SYS5040U02');
                        break;
                    case 'btnSaveRfrnc':
                         if (!this.currentRow.cd) {
                            ComLib.openDialog('A', 'SYSI0010', ['소분류 코드를 먼저 선택해주세요.']);
                            return;
                        }
                        
                        // 저장 전 추가 중복 체크
                        if (this.validateRfrncBeforeSave()) {
                            if(this.validation('SYS5040U03')) this.transaction('SYS5040U03');
                        }
                        break;
                    case 'btnNewLCat':
                        this.clearLCatDetail();
                        break;
                    case 'btnNewSCat':
                        this.clearSCatDetail();
                        break;
                    case 'btnAddRowRfrnc':
                        // 소분류가 선택되지 않은 경우 경고
                        if (!this.currentRow.cd) {
                            ComLib.openDialog('A', 'SYSI0010', ['소분류코드를 먼저 선택해주세요.']);
                            return;
                        }

                        if(!this.currentRow.cdGroup) {
                            ComLib.openDialog('A', 'SYSI0010', ['대분류코드를 먼저 선택해주세요.']);
                            return;
                        }
                        
                        // 현재 데이터를 안전하게 가져오기
                        const currentRecords = this.state.dsRfrncList.records || [];
                        const addRfrncList = DataLib.datalist.getInstance();
                        addRfrncList.setRecords([...currentRecords]);
                        
                        // 새 행 추가
                        const newIndex = addRfrncList.addRow(0);
                        
                        // 추가된 행에 데이터 설정
                        addRfrncList.records[newIndex] = {
                            rfrncCd: '',
                            rfrncNm: '',
                            rfrncVl: '',
                            cdGroup: this.currentRow.cdGroup,
                            cd: this.currentRow.cd,
                            rowtype: 'C',
                            selectedIndex: this.state.dsRfrncList.records.length,
                            recid: Date.now() + Math.random() // 고유 ID 생성
                        };

                        console.log('➕ 신규 행 추가됨 - rowtype: C');

                        // 참조 목록에 새 행 추가 (초기값 설정)
                        this.setState({ 
                            dsRfrncList: addRfrncList
                        }, () => {
                            // 행 추가 후 그리드 포커스 설정
                            if (this.gridRfrncApi) {
                                setTimeout(() => {
                                    const rowCount = this.state.dsRfrncList.getRecords().length;
                                    if (rowCount > 0) {
                                        this.gridRfrncApi.setFocusedCell(0, 'rfrncCd');
                                    }
                                }, 100);
                            }
                        });
                        break;
                    case 'btnDelRowRfrnc': {
                        // ag-Grid의 선택된 행 가져오기
                        const selectedRows = this.gridRfrncApi.getSelectedRows();
                        console.log('🔍 삭제 디버깅:', {
                            selectedRows: selectedRows,
                            selectedIndex: this.currentRow.selectedIndex,
                            currentRow: this.currentRow
                        });
                        
                        if (selectedRows.length === 0) {
                            ComLib.openDialog('A', 'SYSI0010', ['삭제할 행을 선택해주세요.']);
                            return;
                        }

                        // 현재 데이터를 안전하게 가져오기
                        const currentRecords = this.state.dsRfrncList.records || [];
                        
                        // 선택된 행들의 rfrncCd 추출 (DB 삭제용)
                        const selectedRfrncCds = selectedRows.map(row => row.rfrncCd);
                        
                        // rowtype이 'U'인 행들만 삭제 목록에 추가
                        const rfrncCdsToCheck = selectedRows
                            .filter(row => row.rowtype === 'U' && row.rfrncCd && row.rfrncCd.trim() !== '')
                            .map(row => row.rfrncCd);

                        // 삭제 목록에 추가 (rowtype이 'U'인 행들만)
                        const newDeletedRfrncCds = Array.from(new Set([
                            ...this.state.deletedRfrncCds,
                            ...rfrncCdsToCheck
                        ]));
                        
                        // 선택된 행들을 제외한 새로운 배열 생성
                        console.log('현재 데이터:', currentRecords);
                        console.log('선택된 행들:', selectedRows);
                        
                        const updatedRecords = currentRecords.filter(row => {
                            // 선택된 행 중에 현재 행과 일치하는 것이 있는지 확인
                            return !selectedRows.some(selectedRow => {
                                // rowtype이 'C'인 신규 행들은 recid로 매칭
                                if (row.rowtype === 'C' && selectedRow.rowtype === 'C') {
                                    return row.recid === selectedRow.recid;
                                } else {
                                    // 기존 행들은 필드 비교
                                    return selectedRow.rfrncCd === row.rfrncCd &&
                                           selectedRow.rfrncNm === row.rfrncNm &&
                                           selectedRow.rfrncVl === row.rfrncVl &&
                                           selectedRow.cdGroup === row.cdGroup &&
                                           selectedRow.cd === row.cd;
                                }
                            });
                        });
                        
                        const updatedRfrncList = DataLib.datalist.getInstance();
                        updatedRfrncList.setRecords(updatedRecords);
                        
                        this.setState({
                            dsRfrncList: updatedRfrncList,
                            deletedRfrncCds: newDeletedRfrncCds
                        });
                        
                        console.log('🗑️ 선택된 행 삭제 완료:', {
                            selectedRows: selectedRows.length,
                            selectedRfrncCds,
                            rfrncCdsToCheck,
                            newDeletedRfrncCds,
                            originalCount: currentRecords.length,
                            updatedCount: updatedRecords.length
                        });
                        break; 
                    }
                    default:
                        break;
                }
            }
        },
        input: {
            onChange: (e) => {
                const id = e.target.id;
                const value = e.target.value;
                this.setState({ ...this.state, textFieldProps: { ...this.state.textFieldProps, [id]: { ...this.state.textFieldProps[id], value: value }}});
            },
            onKeyPress: (e) => {
                if (e.key === 'Enter') {
                    const id = e.target.id;
                    if (id === 'iptLCatCd' || id === 'iptLCatNm') {
                        // 대분류코드 또는 대분류코드명에서 엔터키 입력 시 대분류 조회 실행
                        if(this.validation('SYS5040R01')) {
                            this.transaction('SYS5040R01');
                        }
                    } else if (id === 'iptSCatCd' || id === 'iptSCatNm') {
                        // 소분류코드 또는 소분류코드명에서 엔터키 입력 시 소분류 조회 실행
                        if (!this.currentRow.cdGroup) {
                            ComLib.openDialog('A', 'SYSI0010', ['대분류 코드를 먼저 선택해주세요.']);
                            return;
                        }
                        if(this.validation('SYS5040R03')) {
                            this.transaction('SYS5040R03');
                        }
                    }
                }
            },
            onBlur: (e) => {}
        },
        selectbox: {
            onChange: (e) => {
                const id = e.target.id;
                const value = e.target.value;
                const ds = this.state.selectboxProps[id].dataset;
                const index = e.target.selectedIndex;
                
                if (id.includes('Dtl')) { // Detail Form
                    const formType = id.includes('LCat') ? 'dsLCatDtl' : 'dsSCatDtl';
                    const field = id.includes('CdPlcusCd') ? 'cdPlcusCd' : 'useYn';
                    let newRecord = [...this.state[formType].records];
                    newRecord[0][field] = value;
                    this.setState({ ...this.state, [formType]: { ...this.state[formType], records: newRecord }});
                } else { // Search Form
                    this.setState({ ...this.state, selectboxProps: { ...this.state.selectboxProps, [id]: { ...this.state.selectboxProps[id], value: value }}});
                }
            }
        },
        grid: {
            onRowClicked: (e) => {
                const gridId = e.id;
                const rowData = e.data;
                console.log('Grid Click Event:', { gridId, rowData });
                if (gridId === 'grdLCatList') {
                    console.log('LCat row clicked, cdGroup:', rowData.cdGroup);
                    this.currentRow.cdGroup = rowData.cdGroup;
                    this.currentRow.cd = undefined;
                    this.currentRow.selectedIndex = undefined;
                    
                    // 대분류 상세 폼에 데이터 설정 (필드명 매핑)
                    const detailData = {
                        cdGroup: rowData.cdGroup,
                        cdGroupNm: rowData.cdGroupNm,
                        cdPlcusCd: rowData.cdPlcusCd,
                        useYn: rowData.useYn,
                        rmrkCn: rowData.rmrkCn,
                        rowStatus: rowData.rowStatus || 'U'
                    };
                    this.state.dsLCatDtl.setRecords([detailData]);   
                    this.transaction('SYS5040R03', { cdGroup: rowData.cdGroup });
                    this.setState({ ...this.state }, () => {
                        console.log('Calling SYS5040R02 with cdGroup:', rowData.cdGroup);
                        this.transaction('SYS5040R02', { cdGroup: rowData.cdGroup });
                    });
                } else if (gridId === 'grdSCatList') {
                    console.log('SCat row clicked, scatCd:', rowData);
                    this.currentRow.selectedIndex = undefined;
                    this.currentRow.cd = rowData.cd;
                    // this.currentRow.scat = rowData.cd;

                    // 소분류 상세 폼에 데이터 설정 (수정 모드로 설정)
                    const scatDetailData = {
                        ...rowData,
                        rowStatus: 'U'
                    };
                    this.state.dsSCatDtl.setRecords([scatDetailData]);
                    
                    // 참조 목록 초기화
                    this.state.dsRfrncList.setRecords([]);
                      this.currentRow.selectedIndex = undefined;  
                    this.setState({ ...this.state }, () => {
                        // 소분류 상세 조회
                        this.transaction('SYS5040R04', { cd: rowData.cd });
                        
                        // 참조 목록 조회 (r05 API 호출)
                        this.transaction('SYS5040R05', { 
                            cdGroup: this.currentRow.cdGroup,
                            cd: rowData.cd 
                        });
                    });
                }
                else if (gridId === 'grdRfrncList') {
                    console.log('Rfrnc row clicked, rfrncCd:', rowData);
                    this.currentRow.selectedIndex = rowData.recid || rowData.rowIndex;
                }
            },
            onCellValueChanged: (e) => {
                try {
                    const currentData = this.state.dsRfrncList.records || [];
                    const changedRowIndex = Number(e.index);
            
                    // 1. records 배열을 복사해서 불변성 유지
                    const newData = currentData.map((row, idx) =>
                        idx === changedRowIndex
                            ? { 
                                ...row, 
                                [e.col]: e.newValue,   // 실제 값 변경!
                                rowtype: row.rowtype === 'C' ? 'C' : 'U' 
                              }
                            : row
                    );
            
                    const updatedRfrncList = DataLib.datalist.getInstance();
                    updatedRfrncList.setRecords(newData);
            
                    this.setState({
                        dsRfrncList: updatedRfrncList
                    });
                    
                    // 2. 참조코드 필드가 변경된 경우 실시간 중복 체크
                    if (e.col === 'rfrncCd' && e.newValue && e.newValue.trim() !== '') {
                        this.checkRfrncCodeDuplicate(e.newValue, changedRowIndex);
                    }
                    
                    console.log('🔧 참조코드 셀 값 변경:', {
                        field: e.col,
                        oldValue: e.oldValue,
                        newValue: e.newValue,
                        rowIndex: changedRowIndex
                    });
                } catch (error) {
                    console.error('참조코드 셀 값 변경 중 오류:', error);
                }
            }
        }
    }

    clearLCatDetail = () => {
        this.currentRow.lcat = '';
        this.state.dsLCatDtl.setRecords([{
            cdGroup: '',    
            cdGroupNm: '',
            cdPlcusCd: 'SYS',
            useYn: 'Y',
            rmrkCn: '',
            rowStatus: 'C'
        }]);
        this.setState({ ...this.state });
    }
    
    clearSCatList = () => {
        this.state.dsSCatList.setRecords([]);
        this.clearSCatDetail();
    }

    clearSCatDetail = () => {
        this.currentRow.cd = '';
        this.state.dsSCatDtl.setRecords([{
            cd: '',
            cdNm: '',
            cdGroup: '',
            useYn: 'Y',
            sortSn: '',
            rowStatus: 'C'
        }]);
        this.state.dsRfrncList.setRecords([]);
        this.setState({ 
            ...this.state,
            deletedRfrncCds: [] // 삭제 목록도 초기화
        });
    }

    // 신규/수정 모드 구분 헬퍼 함수
    isNewMode = (type) => {
        switch (type) {
            case 'lcat':
                return this.state.dsLCatDtl.records && 
                       this.state.dsLCatDtl.records.length > 0 && 
                       this.state.dsLCatDtl.records[0].rowStatus === 'C';
            case 'scat':
                return this.state.dsSCatDtl.records && 
                       this.state.dsSCatDtl.records.length > 0 && 
                       this.state.dsSCatDtl.records[0].rowStatus === 'C';
            default:
                return false;
        }
    }

    // 모드별 버튼 텍스트 반환 (현재는 동일하지만 향후 확장 가능)
    getButtonText = (type) => {
        const isNew = this.isNewMode(type);
        return isNew ? '저장' : '저장';
    }

    // 중복 코드 체크 헬퍼 함수
    checkDuplicateCode = (type, code, parentCode = null) => {
        switch (type) {
            case 'lcat':
                const existingLCatCodes = this.state.dsLCatList.getRecords();
                return existingLCatCodes.some(item => item.cdGroup === code);
            case 'scat':
                const existingSCatCodes = this.state.dsSCatList.getRecords();
                return existingSCatCodes.some(item => 
                    item.cd === code && item.cdGroup === parentCode
                );
            default:
                return false;
        }
    }

    // 참조코드 실시간 중복 체크 헬퍼 함수
    checkRfrncCodeDuplicate = (newValue, currentRowIndex) => {
        const rfrncRecords = this.state.dsRfrncList.getRecords();
        
        // 현재 행을 제외한 다른 행들에서 동일한 참조코드가 있는지 확인
        const duplicateFound = rfrncRecords.some((record, index) => 
            index !== currentRowIndex && 
            record.rfrncCd && 
            record.rfrncCd.trim() !== '' && 
            record.rfrncCd === newValue
        );
        
        if (duplicateFound) {
            ComLib.openDialog('A', 'SYSI0010', [`참조코드 '${newValue}'는 이미 존재합니다.`]);
            
            // 중복된 값을 빈 값으로 초기화
            const updatedRecords = rfrncRecords.map((record, index) =>
                index === currentRowIndex
                    ? { ...record, rfrncCd: '' }
                    : record
            );
            
            const updatedRfrncList = DataLib.datalist.getInstance();
            updatedRfrncList.setRecords([updatedRecords]);
            
            this.setState({
                dsRfrncList: updatedRfrncList
            });
            
            return true;
        }
        
        return false;
    }

    // 저장 전 참조코드 중복 체크 헬퍼 함수
    validateRfrncBeforeSave = () => {
        const rfrncRecords = this.state.dsRfrncList.getRecords();
        
        // 빈 참조코드가 있는지 확인
        const emptyCodes = rfrncRecords.filter(record => 
            !record.rfrncCd || record.rfrncCd.trim() === ''
        );
        
        if (emptyCodes.length > 0) {
            ComLib.openDialog('A', 'SYSI0010', ['참조코드는 필수입니다.']);
            return false;
        }
        
        // 전체 중복 체크
        const allRfrncCodes = rfrncRecords
            .filter(record => record.rfrncCd && record.rfrncCd.trim() !== '')
            .map(record => record.rfrncCd);
        
        const duplicateCodes = allRfrncCodes.filter((code, index) => 
            allRfrncCodes.indexOf(code) !== index
        );
        
        if (duplicateCodes.length > 0) {
            const uniqueDuplicates = [...new Set(duplicateCodes)];
            ComLib.openDialog('A', 'SYSI0010', [`참조코드 '${uniqueDuplicates[0]}'가 중복 입력되었습니다.`]);
            return false;
        }
        
        return true;
    }

    // 버튼 Props 동적 업데이트
    updateButtonProps = () => {
        const updatedBtnProps = {
            ...this.state.btnProps,
            btnSaveLCat: {
                ...this.state.btnProps.btnSaveLCat,
                value: this.getButtonText('lcat')
            },
            btnSaveSCat: {
                ...this.state.btnProps.btnSaveSCat,
                value: this.getButtonText('scat')
            }
        };
        
        this.setState({
            ...this.state,
            btnProps: updatedBtnProps
        });
    }

    render() {
        const { dsLCatDtl, dsSCatDtl } = this.state;

        const lcatRecord = dsLCatDtl.records[0] || {};
        const scatRecord = dsSCatDtl.records[0] || {};

        console.log('lcatRecord',lcatRecord);
        console.log('scatRecord',scatRecord);

        // 모드에 따른 버튼 텍스트 동적 업데이트
        const btnSaveLCatText = this.getButtonText('lcat');
        const btnSaveSCatText = this.getButtonText('scat');

        return (
            <FullPanel>
                <SubFullPanel>
                    <FlexPanel style={{justifyContent: 'space-between', gap: '16px'}}>
                        <div style={{flex: 1}}>
                            <SearchPanel>
                                <RelativeGroup>
                                    <LFloatArea style={{flexDirection: 'column'}}>
                                        <div style={{display: 'grid', gridTemplateColumns: '86px 120px 84px 120px 95px 200px', alignItems: 'center', marginBottom: '5px'}}>
                                            <Label value="유형" />
                                            <Selectbox {...this.state.selectboxProps.selLCatType} />
                                            <Label value="사용여부" />
                                            <Selectbox {...this.state.selectboxProps.selLCatUseYn} />
                                            <Label value="대분류코드" />
                                            <Textfield {...this.state.textFieldProps.iptLCatCd} />
                                        </div>
                                        <div style={{display: 'grid', gridTemplateColumns: '86px 2fr', alignItems: 'center'}}>
                                            <Label value="대분류코드명" />
                                            <Textfield {...this.state.textFieldProps.iptLCatNm} />
                                        </div>
                                    </LFloatArea>
                                    <RFloatArea>
                                        <Button {...this.state.btnProps.btnSearchLCat} />
                                        <Button {...this.state.btnProps.btnResetLCat} />
                                    </RFloatArea>
                                </RelativeGroup>
                            </SearchPanel>
                        </div>
                        <div style={{flex: 1}}>
                            <SearchPanel>
                                <RelativeGroup>
                                    <LFloatArea style={{flexDirection: 'column'}}>
                                        <div style={{display: 'grid', gridTemplateColumns: '86px 200px 84px 120px', alignItems: 'center', marginBottom: '5px'}}>
                                            <Label value="소분류코드" />
                                            <Textfield {...this.state.textFieldProps.iptSCatCd} />
                                            <Label value="사용여부" />
                                            <Selectbox {...this.state.selectboxProps.selSCatUseYn} />
                                        </div>
                                        <div style={{display: 'grid', gridTemplateColumns: '86px 2fr', alignItems: 'center'}}>
                                            <Label value="소분류코드명" />
                                            <Textfield {...this.state.textFieldProps.iptSCatNm} />
                                        </div>
                                    </LFloatArea>
                                    <RFloatArea>
                                        <Button {...this.state.btnProps.btnSearchSCat} />
                                        <Button {...this.state.btnProps.btnResetSCat} />
                                    </RFloatArea>
                                </RelativeGroup>
                            </SearchPanel>
                        </div>
                    </FlexPanel>
                </SubFullPanel>
                <SubFullPanel>
                    <FlexPanel style={{justifyContent: 'space-between', gap: '16px'}}>
                        {/* Left Panel: LCat */}
                        <div style={{flex: 1}}>
                            <ComponentPanel title="대분류">
                                <SubFullPanel>
                                    <RelativeGroup>
                                        <LFloatArea>
                                            <h3>대분류코드목록</h3>
                                        </LFloatArea>
                                    </RelativeGroup>
                                    <Grid {...this.state.grdProps.grdLCatList} data={this.state.dsLCatList}/>
                                </SubFullPanel>
                            <SubFullPanel>
                                <Table
                                    width="100%"
                                    colGrp={[
                                        {width: '120px'}, {width: '300px'}, 
                                        {width: '120px'}, {width: '300px'}
                                    ]}
                                    tbData={[
                                        [
                                            {type: 'T', value: '대분류코드', className: 'req'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.cdGroup || ''} 
                                                    onChange={(e) => {
                                                        this.state.dsLCatDtl.records[0].cdGroup = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                    disabled={!StrLib.isNull(lcatRecord.rowStatus) && lcatRecord.rowStatus === 'U'}
                                                />
                                            )},
                                            {type: 'T', value: '코드유형', className: 'req'},
                                            {type: 'D', value: (
                                                <Selectbox 
                                                    {...this.state.selectboxProps.selLCatCdPlcusCdDtl} 
                                                    value={lcatRecord.cdPlcusCd || ''}
                                                    onChange={(e) => {
                                                        console.log('CodeType onChange:', e.target.value);
                                                        this.state.dsLCatDtl.records[0].cdPlcusCd = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '대분류코드명', className: 'req'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.cdGroupNm || ''}
                                                    onChange={(e) => {
                                                        this.state.dsLCatDtl.records[0].cdGroupNm = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )},
                                            {type: 'T', value: '사용여부', className: 'req'},
                                            {type: 'D', value: (
                                                <Selectbox 
                                                    {...this.state.selectboxProps.selLCatUseYnDtl}
                                                    value={lcatRecord.useYn || 'Y'}
                                                    onChange={(e) => {
                                                        console.log('UseYn onChange:', e.target.value);
                                                        this.state.dsLCatDtl.records[0].useYn = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '비고'},
                                            {type: 'D', colSpan: 3, value: (
                                                <Textfield 
                                                    value={lcatRecord.rmrkCn || ''}
                                                    onChange={(e) => {
                                                        this.state.dsLCatDtl.records[0].rmrkCn = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '등록자'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.rgtrId || ''} 
                                                    disabled={true} 
                                                />
                                            )},
                                            {type: 'T', value: '등록일시'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.regDt || ''} 
                                                    disabled={true} 
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '수정자'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.mdfrId || ''} 
                                                    disabled={true} 
                                                />
                                            )},
                                            {type: 'T', value: '수정일시'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={lcatRecord.mdfcnDt || ''} 
                                                    disabled={true} 
                                                />
                                            )}
                                        ]
                                    ]}
                                />
                            </SubFullPanel>
                            </ComponentPanel>
                            <BottomPanel>
                                <RelativeGroup>
                                    <RFloatArea>
                                        <Button {...this.state.btnProps.btnNewLCat} />
                                        <Button 
                                            {...this.state.btnProps.btnSaveLCat} 
                                            value={btnSaveLCatText}
                                        />
                                    </RFloatArea>
                                </RelativeGroup>
                            </BottomPanel>
                        </div>

                        {/* Right Panel: SCat */}
                        <div style={{flex: 1}}>
                            <ComponentPanel title="소분류">
                                <SubFullPanel>
                                    <RelativeGroup>
                                        <LFloatArea>
                                            <h3>소분류코드목록</h3>
                                        </LFloatArea>
                                    </RelativeGroup>                            
                                    <Grid {...this.state.grdProps.grdSCatList} data={this.state.dsSCatList}/>
                                </SubFullPanel>
                            <SubFullPanel>
                                <Table
                                    width="100%"
                                    colGrp={[
                                        {width: '120px'}, {width: '300px'}, 
                                        {width: '120px'}, {width: '300px'}
                                    ]}
                                    tbData={[
                                        [
                                            {type: 'T', value: '소분류코드', className: 'req'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.cd || ''}
                                                    onChange={(e) => {
                                                        this.state.dsSCatDtl.records[0].cd = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                    disabled={!StrLib.isNull(scatRecord.rowStatus) && scatRecord.rowStatus === 'U'}
                                                />
                                            )},
                                            {type: 'T', value: '소분류코드명', className: 'req'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.cdNm || ''}
                                                    onChange={(e) => {
                                                        this.state.dsSCatDtl.records[0].cdNm = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '정렬순서'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.sortSn || ''}
                                                    type="onlyNum"
                                                    onChange={(e) => {
                                                        this.state.dsSCatDtl.records[0].sortSn = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )},
                                            {type: 'T', value: '사용여부', className: 'req'},
                                            {type: 'D', value: (
                                                <Selectbox 
                                                    {...this.state.selectboxProps.selSCatUseYnDtl}
                                                    value={scatRecord.useYn || 'Y'}
                                                    onChange={(e) => {
                                                        this.state.dsSCatDtl.records[0].useYn = e.target.value;
                                                        this.setState({ ...this.state });
                                                    }}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '등록자'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.rgtrId || ''}
                                                    disabled={true}
                                                />
                                            )},
                                            {type: 'T', value: '등록일시'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.regDt || ''}
                                                    disabled={true}
                                                />
                                            )}
                                        ],
                                        [
                                            {type: 'T', value: '수정자'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.mdfrId || ''}
                                                    disabled={true}
                                                />
                                            )},
                                            {type: 'T', value: '수정일시'},
                                            {type: 'D', value: (
                                                <Textfield 
                                                    value={scatRecord.mdfcnDt || ''}
                                                    disabled={true}
                                                />
                                            )}
                                        ]
                                    ]}
                                />
                            </SubFullPanel>
                            </ComponentPanel>
                            <BottomPanel>
                                <RelativeGroup>
                                    <RFloatArea>
                                        <Button {...this.state.btnProps.btnNewSCat} />
                                        <Button 
                                            {...this.state.btnProps.btnSaveSCat} 
                                            value={btnSaveSCatText}
                                        />
                                    </RFloatArea>
                                </RelativeGroup>
                            </BottomPanel>
                            <ComponentPanel title="소분류코드 참조">
                                <SubFullPanel>
                                    <RelativeGroup>
                                        <LFloatArea>
                                            <h3>소분류코드 참조</h3>
                                        </LFloatArea>
                                        <RFloatArea>
                                            <div className="component-with">
                                                <Button {...this.state.btnProps.btnAddRowRfrnc} />
                                                <Button {...this.state.btnProps.btnDelRowRfrnc} />
                                            </div>
                                        </RFloatArea>
                                    </RelativeGroup>
                                    <Grid {...this.state.grdProps.grdRfrncList} data={this.state.dsRfrncList}/>
                                </SubFullPanel>
                            </ComponentPanel>
                            <BottomPanel>
                                <RelativeGroup>
                                    <RFloatArea>
                                        <Button {...this.state.btnProps.btnSaveRfrnc} />
                                    </RFloatArea>
                                </RelativeGroup>
                            </BottomPanel>
                        </div>
                    </FlexPanel>
                </SubFullPanel>
            </FullPanel>
        )
    }
}

export default View; 