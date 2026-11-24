import React from 'react';

// Layout Components
import { FullPanel, SubFullPanel, ComponentPanel, SearchPanel, RelativeGroup, LFloatArea, RFloatArea, FlexPanel } from 'components';

// UI Components
import { BasicButton as Button } from 'components';
import { Grid, Label, Textfield } from 'components';

// Common Libraries
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
    constructor(props) {
        super(props);

        this.gridApi = null;
        this.columnApi = null;
        this.currentRow = '';

        this.state = {
            dsIpList: DataLib.datalist.getInstance(),
            dsSearch: DataLib.datalist.getInstance(),

            textFieldProps: {
                lgnIp: {
                    id: 'lgnIp',
                    value: '',
                    placeholder: 'IP 주소',
                },
                extNo: {
                    id: 'extNo',
                    value: '',
                    placeholder: '내선번호',
                }
            },
            btnProps: {
                btnSearch: { id: 'btnSearch', value: '조회', color: 'blue', fiiled: true },
                btnAdd: { id: 'btnAdd', value: '행추가', color: 'green' },
                btnDelete: { id: 'btnDelete', value: '행삭제', color: 'red' },
                btnSave: { id: 'btnSave', value: '저장', color: 'purple', fiiled: true },
            },
            grdProps: {
                grdIpList: {
                    id: 'grdIpList',
                    areaName: 'IP주소 목록',
                    header: [
                        { headerName: 'IP주소', field: 'lgnIp', colId: 'lgnIp', width: 200, editable: true, req: true, textAlign: 'center' },
                        { headerName: '내선번호', field: 'extNo', colId: 'extNo', width: 200, editable: true, maxLength: 4, textAlign: 'center' }
                    ],
                    rowSelection: 'single', // 다중 선택으로 변경
                    height: '350px',
                    addRowBtn: false,
                    delRowBtn: false,
                }
            },
            deletedIpIds: [] // 🗑️ 삭제할 IP ID 목록
        };

    }

    componentDidMount() {

        // 팝업 창 크기 자동 조정 (현재 컴포넌트 참조 전달)
        ComLib.resizePopupAfterLoad({
            width: 800,
            height: 550,
            center: true 
        }, this);

      
        if (this.validation("SYS0080R01")) {
            this.transaction("SYS0080R01");
        }
    }

    validation = (transId) => {
        switch (transId) {
            case 'SYS0080R01':
                break;
            case 'SYS0080U01':
                const modifiedData = this.state.dsIpList.getRecords();
                const invalidData = modifiedData.filter(data => (data['__row_status__'] === 'C' || data['__row_status__'] === 'U') && StrLib.isNull(data.lgnIp));
                
                if (invalidData.length > 0) {
                    ComLib.openDialog('A', 'SYSI0010', ['IP 주소는 필수 입력 항목입니다.']);
                    return false;
                }

                // 내선번호 길이 체크 (4자 이하)
                const invalidExtNoData = modifiedData.filter(data => 
                    (data['__row_status__'] === 'C' || data['__row_status__'] === 'U') && 
                    data.extNo && data.extNo.length > 4
                );
                
                if (invalidExtNoData.length > 0) {
                    ComLib.openDialog('A', 'SYSI0010', ['내선번호는 4자 이하로 입력해주세요.']);
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    }

    transaction = (transId, deletePayload) => {
        let transManager = new TransManager();
        try {
            switch (transId) {
                case 'SYS0080R01':
                    transManager.setTransId(transId);
                    transManager.setTransUrl('/api/cmm/user-ip/r01');
                    transManager.setCallBack(this.callback);
                    transManager.addConfig({
                        dao: transManager.constants.dao.base,
                        crudh: transManager.constants.crudh.read,
                        sqlmapid: 'SYS.R_getIpList',
                        datasetsend: 'dsSearch',
                        datasetrecv: 'dsIpList',
                    });

                    const searchData = {
                        lgnIp: this.state.textFieldProps.lgnIp.value,
                        extNo: this.state.textFieldProps.extNo.value
                    };
                    this.state.dsSearch.setRecords([searchData]);

                    transManager.setFormData(searchData);
                    transManager.agent();
                    break;

                case 'SYS0080U01':
                    transManager.setTransId(transId);
                    transManager.setTransUrl('/api/cmm/user-ip/u01');
                    transManager.setCallBack(this.callback);
                    transManager.addConfig({
                        dao: transManager.constants.dao.base,
                        crudh: transManager.constants.crudh.handle,
                        sqlmapid: 'SYS.H_ipList',
                        datasetsend: 'dsIpList',
                    });
                    
                    // 🔄 변경된 데이터만 필터링 (신규/수정된 행만 전송)
                    const allRows = this.state.dsIpList.getRecords();
                    const modifiedRows = allRows.filter(row => row.rowtype !== 'R');
                    
                    // 입력이 전혀 되지 않은 행 제외 (IP주소와 내선번호가 모두 빈 값인 경우)
                    const validModifiedRows = modifiedRows.filter(row => {
                        const hasIpAddress = row.lgnIp && row.lgnIp.trim() !== '';
                        const hasExtNo = row.extNo && row.extNo.trim() !== '';
                        // IP주소는 필수이므로 IP주소라도 있으면 유효한 행으로 간주
                        return hasIpAddress;
                    });
                    
                    // 📊 백엔드로 전송되는 데이터 로그 확인
                    console.log('💾 전체 IP 데이터:', allRows);
                    console.log('🔄 각 행의 rowtype 상태:', allRows.map(item => ({ 
                        lgnIp: item.lgnIp, 
                        extNo: item.extNo, 
                        rowtype: item.rowtype 
                    })));
                    console.log('🔄 변경된 데이터만 전송:', modifiedRows);
                    console.log('🔍 유효한 변경 데이터 (입력된 행만):', validModifiedRows);
                    console.log('🔍 필터링된 IP 데이터:', validModifiedRows.map(item => ({ 
                        lgnIp: item.lgnIp, 
                        extNo: item.extNo,
                        rowtype: item.rowtype
                    })));

                    if (validModifiedRows.length === 0) {
                        ComLib.openDialog('A', 'SYSI0010', ['저장할 데이터가 없습니다. IP주소를 입력해주세요.']);
                        return;
                    }

                    // 백엔드에서 List<SYS0080002Dto>를 기대하므로 배열을 직접 전송
                    transManager.setFormData(validModifiedRows);
                    transManager.agent();
                    break;

                case 'SYS0080D01':
                    transManager.setTransId(transId);
                    transManager.setTransUrl('/api/cmm/user-ip/d01');
                    transManager.setCallBack(this.callback);
                    transManager.addConfig({
                        dao: transManager.constants.dao.base,
                        crudh: transManager.constants.crudh.handle,
                        sqlmapid: 'SYS.D_ipList',
                        datasetsend: 'dsIpList',
                    });
                    
                    // 🔄 백엔드가 기대하는 SYS0080002Dto 형식으로 변환
                    const deletePayload = deletePayload || this.state.deletedIpIds;
                    const dtoListToDelete = deletePayload.map(ipId => ({
                        lgnIp: ipId,  // 백엔드가 기대하는 필드명
                        extNo: ''     // 삭제 시에는 내선번호는 빈 값으로 전송
                    }));
                    
                    if (dtoListToDelete.length === 0) {
                        ComLib.openDialog('A', 'SYSI0010', ['삭제할 데이터가 없습니다.']);
                        return;
                    }
                    
                    console.log('🗑️ 삭제 요청 데이터 (SYS0080002Dto 형식):', dtoListToDelete);
                    transManager.setFormData(dtoListToDelete);
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
        try {
            if (res.result) {
                switch (res.id) {
                    case 'SYS0080R01':
                        if (res.data) {
                            // 조회된 데이터의 초기 상태를 'R' (Read)로 설정
                            const initializedData = res.data.map(item => ({
                                ...item,
                                rowtype: 'R'
                            }));
                            this.state.dsIpList.setRecords(initializedData);
                            this.setState({ ...this.state });
                            console.log('SYS0080 - IP 목록 조회 완료:', initializedData);
                        } else {
                            console.warn('SYS0080 - 조회된 데이터가 없습니다.');
                        }
                        break;
                    case 'SYS0080U01':
                        ComLib.openDialog('A', 'SYSI0010', ['저장되었습니다.']);
                        this.setState({ deletedIpIds: [] }); // 저장 완료 후 삭제 목록 초기화
                        this.transaction('SYS0080R01');
                        break;
                    case 'SYS0080D01':
                        ComLib.openDialog('A', 'SYSI0010', ['삭제가 완료되었습니다.']);
                        this.setState({ deletedIpIds: [] }); // 삭제 완료 후 삭제 목록 초기화
                        this.transaction('SYS0080R01');
                        break;
                    default:
                        break;
                }
            } else {
                console.error('SYS0080 - API 응답 실패:', res.message);
                ComLib.openDialog('A', 'SYSI0010', [res.message || '처리 중 오류가 발생했습니다.']);
            }
        } catch (error) {
            console.error('SYS0080 - Callback 처리 중 오류:', error);
            ComLib.openDialog('A', 'SYSI0010', ['처리 중 오류가 발생했습니다.']);
        }
    }

    event = {
        button: {
            onClick: (e) => {
                switch (e.target.id) {
                    case 'btnSearch':
                        if (this.validation('SYS0080R01')) this.transaction('SYS0080R01');
                        break;
                    case 'btnAdd': {
                        // SYS1010 방식으로 개선된 행추가
                        const addIpList = DataLib.datalist.getInstance();
                        addIpList.setRecords(this.state.dsIpList.getRecords());
                        addIpList.addRow(0, { 
                            lgnIp: '',      // 기본값 설정
                            extNo: '',      // 기본값 설정
                            rowtype: 'C'    // 신규 행 타입 설정
                        }) 
                        
                        console.log('➕ 신규 IP 행 추가됨 - rowtype: C');
                        
                        this.setState({
                            dsIpList: addIpList
                        });
                        break;
                    }
                    case 'btnDelete': {
                        // SYS1010 방식으로 개선된 행삭제
                        let selectedRows = this.gridApi.getSelectedRows();
                        if (selectedRows.length === 0) {
                            ComLib.openDialog('A', 'SYSI0010', ['삭제할 행을 선택해주세요.']);
                            return;
                        }
                        
                        const selectedIpIds = selectedRows.map(row => row.lgnIp);
                        const currentData = this.state.dsIpList.getRecords();

                        // 1. lgnIp가 없는(신규, 미입력) 행은 자식 체크 없이 바로 삭제
                        const ipIdsToCheck = selectedIpIds.filter(id => !!id && id.trim() !== '');

                        // 2. deletedIpIds에 추가 (lgnIp가 있는 행만)
                        const newDeletedIpIds = Array.from(new Set([
                            ...this.state.deletedIpIds,
                            ...ipIdsToCheck
                        ]));

                        // 3. dsIpList에서 해당 lgnIp를 가진 row를 제거
                        const updatedRecords = currentData.filter(row => !selectedIpIds.includes(row.lgnIp));
                        const updatedIpList = DataLib.datalist.getInstance();
                        updatedIpList.setRecords(updatedRecords);
                        
                        this.setState({
                            dsIpList: updatedIpList,
                            deletedIpIds: newDeletedIpIds
                        });
                        break;
                    }
                    case 'btnSave': {
                        const allRows = this.state.dsIpList.getRecords();
                        const modifiedRows = allRows.filter(row => row.rowtype === 'C' || row.rowtype === 'U');
                        const hasModifiedData = modifiedRows.length > 0;
                        const hasDeletedData = this.state.deletedIpIds.length > 0;
                        
                        if (!hasModifiedData && !hasDeletedData) {
                            ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
                            return;
                        }
                        
                        if (hasModifiedData) {
                            if (this.validation('SYS0080U01')) {
                                this.transaction('SYS0080U01');
                            }
                        } 
                        
                        if (hasDeletedData) {
                            this.processDelete();
                        }
                        break;
                    }
                    default:
                        break;
                }
            }
        },
        input: {
            onChange: (e) => {
                const { id, value } = e.target;
                
                // IP주소와 내선번호 각각 다른 필드로 처리
                if (id === 'lgnIp') {
                    // IP주소 필드
                    this.setState({
                        ...this.state,
                        textFieldProps: {
                            ...this.state.textFieldProps,
                            lgnIp: {
                                ...this.state.textFieldProps.lgnIp,
                                value: value
                            }
                        }
                    });
                } else if (id === 'extNo') {
                    // 내선번호 필드
                    this.setState({
                        ...this.state,
                        textFieldProps: {
                            ...this.state.textFieldProps,
                            extNo: {
                                ...this.state.textFieldProps.extNo,
                                value: value
                            }
                        }
                    });
                }
            },
            onKeyPress: (e) => {
                // 엔터키(Enter) 입력 시 조회 실행
                if (e.key === 'Enter') {
                    if (this.validation('SYS0080R01')) {
                        this.transaction('SYS0080R01');
                    }
                }
            }
        },
        grid: {
            onGridReady: (params) => {
                this.gridApi = params.api;
                this.columnApi = params.columnApi;
            },
            onCellValueChanged: (e) => {
                try {
                    const currentData = this.state.dsIpList.getRecords();
                    const changedRowIndex = Number(e.index);
            
                    // 내선번호 필드의 경우 4자로 제한
                    let newValue = e.newValue;
                    if (e.col === 'extNo' && newValue && newValue.length > 4) {
                        newValue = newValue.substring(0, 4);
                        console.log('⚠️ 내선번호가 4자를 초과하여 자동으로 잘렸습니다:', newValue);
                    }
            
                    // 1. records 배열을 복사해서 불변성 유지
                    const newData = currentData.map((row, idx) =>
                        idx === changedRowIndex
                            ? { 
                                ...row, 
                                [e.col]: newValue,   // 제한된 값 적용
                                rowtype: 'U' 
                              }
                            : row
                    );
            
                    const updatedIpList = DataLib.datalist.getInstance();
                    updatedIpList.setRecords(newData);
            
                    this.setState({
                        dsIpList: updatedIpList
                    });
                } catch (error) {
                    console.error('셀 값 변경 처리 중 오류:', error);
                }
            }
        }
    }

    // 삭제 처리 메서드
    processDelete = () => {
        if (this.state.deletedIpIds.length === 0) {
            console.log('🗑️ 삭제할 데이터가 없습니다.');
            return;
        }
        
        // 🔄 백엔드가 기대하는 SYS0080002Dto 형식으로 변환
        const dtoListToDelete = this.state.deletedIpIds.map(ipId => ({
            lgnIp: ipId,  // 백엔드가 기대하는 필드명
            extNo: ''     // 삭제 시에는 내선번호는 빈 값으로 전송
        }));
        
        console.log('🗑️ 삭제 처리 시작 (SYS0080002Dto 형식):', dtoListToDelete);
        this.transaction('SYS0080D01', dtoListToDelete);
    }

    render() {
        return (
            <FullPanel>
                <SearchPanel>
                    <RelativeGroup>
                        <LFloatArea>
                            <FlexPanel>
                                <Label value="IP주소" />
                                <Textfield 
                                    id="lgnIp"
                                    value={this.state.textFieldProps.lgnIp.value} 
                                    onChange={this.event.input.onChange}
                                    onKeyPress={this.event.input.onKeyPress}
                                    />
                                <Label value="내선번호" />
                                <Textfield
                                    id="extNo"
                                    value={this.state.textFieldProps.extNo.value} 
                                    onChange={this.event.input.onChange}
                                    onKeyPress={this.event.input.onKeyPress}
                                     />
                            </FlexPanel>
                        </LFloatArea>
                        <RFloatArea>
                            <Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} fiiled={true}/>
                        </RFloatArea>
                    </RelativeGroup>
                </SearchPanel>
                <SubFullPanel>
                    <ComponentPanel>
                        <RelativeGroup>
                            <LFloatArea>
                                <div className="scrm-component-panel-namearea">
                                    <span>{this.state.grdProps.grdIpList.areaName}</span>
                                </div>
                            </LFloatArea>
                            <RFloatArea>
                                <Button {...this.state.btnProps.btnAdd} onClick={this.event.button.onClick} fiiled={true}/>
                                <Button {...this.state.btnProps.btnDelete} onClick={this.event.button.onClick} fiiled={true}/>
                            </RFloatArea>
                        </RelativeGroup>
                        <Grid
                            {...this.state.grdProps.grdIpList}
                            data={this.state.dsIpList}
                            onGridReady={this.event.grid.onGridReady}
                            onCellValueChanged={this.event.grid.onCellValueChanged}
                        />
                         <RelativeGroup>
                            <RFloatArea style={{marginTop: '10px'}}>
                                <Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} fiiled={true}/>
                            </RFloatArea>
                        </RelativeGroup>
                    </ComponentPanel>
                </SubFullPanel>
            </FullPanel>
        );
    }
}

export default View;