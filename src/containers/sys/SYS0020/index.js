import React from 'react';

// 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel,
         SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';

// UI 컴포넌트
import { Grid, Tree, Label, Textfield, Checkbox } from 'components';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
  constructor(props) {
    super(props);
    
    // 그리드 API 참조
    this.gridApi = null;
    this.columnApi = null;
    
    // 트리 API 참조
    this.treeApi = null;
    
    // 현재 선택 행 추적용
    this.currentRow = '';
    
    // 선택된 조직 정보
    this.selectedOrgId = '';

    this.props = props;
    this.isPopupMode = (this.props.options)? true : false;
    this.keyword = ((this.props.options && this.props.options.param) || {}).keyword || '';
    this.rowSelection = ((this.props.options && this.props.options.param) || {}).rowSelection || 'multiple';
    this.authrt = ((this.props.options && this.props.options.param) || {}).authrt;
    if( this.authrt === undefined){
      this.authrt = 'true';
    }

    this.state = {
      // 데이터셋 (필수)
      dsOgnz: DataLib.datalist.getInstance(),
      dsSearch: DataLib.datalist.getInstance(),
      
      // UI Props 관리 (표준화된 구조)
      btnProps: {
        btnSearch: {
          id: 'btnSearch',
          disabled: false,
          value: '조회',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true
        },
        btnSelect: {
          id: 'btnSelect',
          disabled: false,
          value: '선택',
          hidden: false,
          color: 'navy',
          size: 'md',
          fiiled: true
        },
				btnClose: {
					id: 'btnClose',
					disabled: false,
					value: '닫기',
					hidden: false,
					color: 'grey',
					size: 'md'
        }
      },
      
      // 텍스트필드 Props
      textFieldProps: {
        iptOrgSearch: {
          id: 'iptOrgSearch',
          value: '',
          placeholder: '조직ID 또는 조직명을 입력하세요',
          maxLength: 50,
          type: 'text',
          readOnly: false,
          disabled: false
        }
      },
      
      // 체크박스 Props
      checkboxProps: {
        chkIncludeClosedOrg: {
          id: 'chkIncludeClosedOrg',
          index: 0,
          value: '폐쇄조직 포함',
          checked: 'N',
          keyProp: 'includeClosedOrg',
          readOnly: false,
          disabled: false
        }
      },
      

      

      // 그리드 Props
      grdProps: {
        grdOgnz: {
          id: 'grdOgnz',
          areaName: '조직목록',
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: false,          
          header: [
            {
              headerName: '조직ID',
              field: 'ognzCd',
              colId: 'ognzCd',
              editable: false,
              width: 100,
              req: true,
              type: 'text',
              textAlign: 'center'
            },
            {
              headerName: '조직명',
              field: 'ognzPathNm',
              colId: 'ognzPathNm',
              editable: false,
              width: 400,
              req: true,
              type: 'text',
              cellRenderer: (params) => {
                return `<span style="white-space: pre;">${params.value}</span>`;
              }
            },
            {
              headerName: '사용여부',
              field: 'useYn',
              colId: 'useYn',
              editable: false,
              width: 100,
              type: 'text',
              textAlign: 'center',
              valueFormatter: (param) => {
                if (param.value === 'Y') return '정상';
                if (param.value === 'N') return '폐쇄';
                return param.value;
              }
            }
          ],
          height: '431px',
          rowSelection: this.rowSelection,
          infoCheckBox: (this.rowSelection === 'multiple') ? {use : true} : null
        }
      },
      
      // 트리 Props
      treeProps: {
        treeOrg: {
          id: 'treeOrg',
          data: DataLib.datalist.getInstance(),
          header: [
            { headerName: '조직명', field: 'fullPathName', fieldLen: 180, type: 'text' },
            { headerName: '상태', field: 'orgStat', fieldLen: 60, type: 'text' }
          ],
          height: '400px',
          areaName: '조직목록',
          addRowBtn: false,
          delRowBtn: false,
          ediRowBtn: false,
          openAllonInitial: false,
          maxDepth: 10,
          allowSearch: false
        }
      }
    };
    
    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.checkbox.onChange = this.event.checkbox.onChange.bind(this);
  }
  
  // 컴포넌트 마운트
  componentDidMount() {
    // 초기 조직 트리 데이터 로드
    if (this.validation('SYS0020R01')) {
      this.transaction('SYS0020R01');
    }
  }
  
  // 유효성 검증
  validation = (...params) => {
    let transId = params[0];
    
    switch (transId) {
      case 'SYS0020R01': // 조직 조회
        // 검색 조건 유효성 검증
        const searchText = this.state.textFieldProps.iptOrgSearch.value;
        if (searchText && searchText.length > 50) {
          ComLib.openDialog('A', 'SYSI0010', ['검색어는 50자 이내로 입력해주세요.']);
          return false;
        }
        break;
        
        
      case 'SYS0020_SELECT': // 조직 선택
        // 선택된 조직 검증
        if (StrLib.isNull(this.currentRow)) {
          ComLib.openDialog('A', 'SYSI0010', ['조직을 선택해주세요.']);
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
        case 'SYS0020R01': // 조직 조회
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/ognz/search/r01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsSearch'
          });
          
          // 검색 조건 구성 (camelCase 사용)
          let searchData = {
            ognzCdOrNm: this.state.textFieldProps.iptOrgSearch.value,
            useYn: (this.state.checkboxProps.chkIncludeClosedOrg.checked === 'Y')? "" : 'Y',
            authrt: this.authrt
          };
          
					transManager.setFormData(searchData);


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
  
  // 응답 처리
  callback = (res) => {
    if (res.result) {
      switch (res.id) {
        case 'SYS0020R01': // 조직 조회 결과
          if (res.data) {
            this.state.dsOgnz.setRecords(res.data);
            this.setState({
              ...this.state
            });
          }
          break;
          
        default:
          break;
      }
    } else {
      ComLib.openDialog('A', 'SYSI0010', [res.message || '데이터 조회 중 오류가 발생했습니다.']);
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
  
  // 조직 선택 처리
  handleOrgSelect = () => {
    
    // 선택된 조직 정보 가져오기
    const selectedData = this.getSelectedOrgData();
    
    if (!selectedData) {
        ComLib.openDialog('A', 'SYSI0010', ['선택된 부서가 없습니다.']);
        return;
    }
      
    this.props.onCallbackFunc(selectedData);      
      // 팝업 닫기
    this.handleClose();
  };
  
  // 선택된 조직 데이터 가져오기
  getSelectedOrgData = () => {
    if (this.gridApi) {
      const selectedRows = this.gridApi.getSelectedRows();
      if (selectedRows && selectedRows.length > 0) {
        if( this.rowSelection === 'multiple'){
          return this.gridApi.getSelectedRows();
        }
        return selectedRows[0];
      }
    }
    return null;
  };
  
  // 이벤트 핸들러
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;
        
        switch (btnId) {
          case 'btnSearch':
            if (this.validation('SYS0020R01')) {
              this.transaction('SYS0020R01');
            }
            break;
            
          case 'btnSelect':
            this.handleOrgSelect();
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
      },
      onKeyPress: (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          this.transaction('SYS0020R01');
        }
      }
    },
    
    checkbox: {
      onChange: (e) => {
        let fieldId = e.id;  // Checkbox 컴포넌트에서 전달하는 id 사용
        let checked = e.checked ? 'Y' : 'N';  // Checkbox 컴포넌트에서 전달하는 checked 사용
        
        this.setState({
          ...this.state,
          checkboxProps: {
            ...this.state.checkboxProps,
            [fieldId]: {
              ...this.state.checkboxProps[fieldId],
              checked: checked
            }
          }
        });
      }
    },
    
    grid: {
      onGridReady : (e) => {
        this.gridApi = e.api;
        this.columnApi = e.columnApi;        
			},
      onRowClicked: (e) => {
        console.log('console.log grid onrowclicked');
        console.log(e);
      },
      onRowDoubleClicked: (e) => {
        if( this.rowSelection === 'multiple'){
          return;
        }

        if( e.data ){
          this.props.onCallbackFunc(e.data);      
          // 팝업 닫기
          this.handleClose();
      }
      }
    }
  };

	handleClose = () => {
		if(this.isPopupMode){
			this.props.onClose();
			return;
    }
  };

  
  render() {
    return (
      <FullPanel>
        {/* 검색 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="조직ID/명" />
                <Textfield {...this.state.textFieldProps.iptOrgSearch} 
                onChange={this.event.input.onChange} 
                onKeyPress={this.event.input.onKeyPress}
                />
                <Checkbox {...this.state.checkboxProps.chkIncludeClosedOrg} onChange={this.event.checkbox.onChange} />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>

        {/* 메인 컨텐츠 */}
        <SubFullPanel>
            <Grid
              {...this.state.grdProps.grdOgnz}
              data = {this.state.dsOgnz}
              onGridReady = {this.event.grid.onGridReady}
              onRowClicked = {this.event.grid.onRowClicked}
              onRowDoubleClicked = {this.event.grid.onRowDoubleClicked}

            />            
        </SubFullPanel>

        {/* 버튼 영역 */}
        <RelativeGroup>
          <RFloatArea>
            <Button {...this.state.btnProps.btnSelect} onClick={this.event.button.onClick} mt="10px"/>
            <Button {...this.state.btnProps.btnClose} onClick={(e) => {this.handleClose() }} />
          </RFloatArea>
        </RelativeGroup>
      </FullPanel>
    );
  }
}

export default View; 