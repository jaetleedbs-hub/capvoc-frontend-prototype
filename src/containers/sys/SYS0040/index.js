import React from 'react';

// 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, BottomPanel,
         SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';

// UI 컴포넌트
import { Grid, Tree, Label, Textfield, SortableTree, Selectbox, Checkbox, OgnzSelect } from 'components';

// 버튼 컴포넌트
import { BasicButton as Button } from 'components';

// 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

class View extends React.Component {
	/*------------------------------------------------------------------------------------------------*/
	// [1. Default State Zone]
	/*------------------------------------------------------------------------------------------------*/
	constructor(props) {
		super(props);
		
		// 그리드 API 참조
		this.gridApi = null;
		this.columnApi = null;
		
		// 현재 선택 행 추적용
		this.currentRow = '';
		this.currentOrgId = '';

		
		this.isPopupMode = (this.props.options)? true : false;
		this.rowSelection = ((this.props.options && this.props.options.param) || {}).rowSelection || 'multiple';
		this.keyword = ((this.props.options && this.props.options.param) || {}).keyword || '';
		// this.keyword = this.keyword || this.sessionUserInfo.userId;
		this.authrt = ((this.props.options && this.props.options.param) || {}).authrt;
		if( this.authrt === undefined){
			this.authrt = 'true';
		}

		this.ognzCd = '';
		this.ognzNm = '';
		
		if( this.authrt !== false){
			this.sessionUserInfo = ComLib.getSessionUserInfo();
			this.ognzCd = this.sessionUserInfo.ognzCd;
			this.ognzNm = this.sessionUserInfo.ognzNm;
		}

		let userGridHeader = [
			{
				headerName: '사용자ID',
				field: 'userId',
				colId: 'userId',
				width: 100,
				minWidth: 80,
				maxWidth: 120,
				editable: false,
				req: true,
				type: 'text',
				resizable: true,
				suppressSizeToFit: false,
				cellStyle: { textAlign: 'center' }
			},
			{
				headerName: '사용자명',
				field: 'userNm',
				colId: 'userNm',
				width: 100,
				minWidth: 80,
				maxWidth: 130,
				editable: false,
				req: true,
				type: 'text',
				resizable: true,
				suppressSizeToFit: false,
				cellStyle: { textAlign: 'center' }
			},
			{
				headerName: '소속조직',
				field: 'ognzPathNm',
				colId: 'ognzPathNm',
				flex: 1, // flex만 사용하고 width는 제거
				minWidth: 120,
				editable: false,
				type: 'text',
				resizable: true,
				suppressSizeToFit: false,
				cellStyle: { textAlign: 'left' }
			},
			{
				headerName: '직급',
				field: 'userTypeCdNm',
				colId: 'userTypeCdNm',
				width: 80,
				minWidth: 70,
				maxWidth: 100,
				editable: false,
				type: 'text',
				resizable: true,
				suppressSizeToFit: false,
				cellStyle: { textAlign: 'center' }
			},
			{
				headerName: '로그인여부',
				field: 'lgnYn',
				colId: 'lgnYn',
				width: 90,
				minWidth: 70,
				maxWidth: 90,
				editable: false,
				type: 'text',
				resizable: false,
				suppressSizeToFit: true, // 로그인여부 컬럼은 자동 크기 조정에서 제외
				cellStyle: { textAlign: 'center' }
			}
		];

		if(this.rowSelection === 'multiple') {

		}


		this.state = {
			// 데이터셋
			dsOrgList: DataLib.datalist.getInstance(),
			dsUserList: DataLib.datalist.getInstance(),
			dsSearch: DataLib.datalist.getInstance(),
			
			ognzProps: {
				ognzSearch: {
					id: 'ognzSearch',
					value: '',
					placeholder: '조직',
					style: {width: '600px'},
					ognzCd: this.ognzCd,
					ognzNm: this.ognzNm,
					authrt: this.authrt
				}
			},
			// UI Props 관리
			btnProps: {
				btnSearch: {
					id: 'btnSearch',
					disabled: false,
					value: '조회',
					color: 'blue',
					fiiled: true,
					className: 'icon-srch'
				},
				btnSelect: {
					id: 'btnSelect',
					disabled: true,
					value: '선택',
					color: 'blue',
					fiiled: true,
					className: 'icon-act'
				},
				btnClose: {
					id: 'btnClose',
					disabled: false,
					value: '닫기',
					color: 'grey',
					className: 'icon-cancel'
				}
			},
			
			textFieldProps: {
				iptUserSearch: {
					id: 'iptUserSearch',
					value: this.keyword,
					placeholder: '사용자ID/명',
					maxLength: 10,
					type: 'text',
					readOnly: false,
					disabled: false
				}
			},
			
			checkboxProps: {
				chkIncludeInactive: {
					id: 'chkIncludeInactive',
					index: 0,
					value: '휴직/퇴사자 포함',
					checked: 'N',
					keyProp: 'includeInactive',
					readOnly: false,
					disabled: false,
					style: {marginLeft: '5px'}
				}
			},
			

			
			grdProps: {
				grdUserList: {
					id: 'grdUserList',
					areaName: '사용자 목록',
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: false,
					// 그리드 정렬 및 레이아웃 옵션 추가
					suppressColumnVirtualisation: false,
					suppressSizeToFit: false,
					suppressHorizontalScroll: false,
					suppressScrollOnNewData: true,
					ensureDomOrder: true,
					suppressColumnMoveAnimation: true,
					suppressRowTransform: true,
					suppressAutoSize: false,
					header: userGridHeader,
					height: 'calc(100vh - 531px)',
					rowSelection: this.rowSelection || 'multiple'
				}
			}, 

		};

		// 이벤트 바인딩
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.checkbox.onChange = this.event.checkbox.onChange.bind(this);
		this.event.ognz.onChange = this.event.ognz.onChange.bind(this);
		this.event.grid.onRowClicked = this.event.grid.onRowClicked.bind(this);

	}

	static defaultProps = {
		authrt: true
	}
	
	/*------------------------------------------------------------------------------------------------*/
	// [2. React Lifecycle Method Zone]
	/*------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		// 초기 조직 트리 로드
		if (this.validation('SYS0040R01')) {
			this.transaction('SYS0040R01');
		}
		
		// 창 크기 변경 이벤트 리스너 추가
		this.handleResize = this.handleResize.bind(this);
		window.addEventListener('resize', this.handleResize);
	};
	
	componentWillUnmount() {
		// 이벤트 리스너 제거
		window.removeEventListener('resize', this.handleResize);
	}
	
	handleResize = () => {
		// 창 크기 변경 시 그리드 컬럼 크기 재조정 및 헤더 정렬
		if (this.gridApi) {
			setTimeout(() => {
				try {
					this.forceGridAlignment();
				} catch (error) {
					console.warn('Grid resize error:', error);
				}
			}, 100);
		}
	};

	/*------------------------------------------------------------------------------------------------*/
	// [3. validation Event Zone]
	/*------------------------------------------------------------------------------------------------*/
	validation = (...params) => {
		let transId = params[0];
		
		switch (transId) {
			case 'SYS0040R01': // 조직 트리 조회
				break;
				
			case 'SYS0040R02': // 사용자 목록 조회
				// 조직이 선택되었는지 확인
				if (StrLib.isNull(this.state.ognzProps.ognzSearch.ognzCd)) {
//					ComLib.openDialog('A', 'SYSI0010', ['조직을 선택하세요.']);
//					return false;
				}
				break;
				
			default:
				break;
		}
		return true;
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [4. transaction Event Zone]
	/*------------------------------------------------------------------------------------------------*/
	transaction = (...params) => {
		let transId = params[0];
		let transManager = new TransManager();
		
		switch (transId) {
				
			case 'SYS0040R02': // 사용자 목록 조회
				transManager.setTransId(transId);
				transManager.setTransUrl("/api/cmm/user/search/r02");
				transManager.setCallBack(this.callback);
				transManager.addConfig({
					datasetsend: 'dsSearch',
					datasetrecv: 'dsUserList'
				});
				// 검색 조건 구성
				let userSearchData = {
					ognzCd: this.state.ognzProps.ognzSearch.ognzCd,
					userIdOrNm: this.state.textFieldProps.iptUserSearch.value,
					leaveRsgntnIncl: (this.state.checkboxProps.chkIncludeInactive.checked === 'Y')? "Y" : "N",
					authrt: this.authrt
				};
				transManager.setFormData(userSearchData);
				transManager.agent();
				break;
				
			default:
				break;
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [5. Callback Event Zone]
	/*------------------------------------------------------------------------------------------------*/
	callback = (res) => {
		let errorMessage = '처리 중 오류가 발생했습니다.';
		if (!res.result || res.data.error) {
			if (res.data.message) {
				errorMessage = res.data.message;
			}
			ComLib.openDialog('A', 'SYSI0010', [errorMessage]);
			return;
		}
				
		switch (res.id) {
			case 'SYS0040R01': // 조직 트리 조회 결과
				if (res.data.length > 0) {
					this.state.dsOrgList.setRecords(res.data);
					this.setState({...this.state});
				}
				break;
				
			case 'SYS0040R02': // 사용자 목록 조회 결과
				this.state.dsUserList.setRecords(res.data);
				this.setState({...this.state});
				
				// 사용자 데이터가 있고 그리드가 준비되었을 때만 선택 버튼 활성화
				const hasUserData = res.data && res.data.length > 0;
				
				this.setState({
					...this.state,
					btnProps: {
						...this.state.btnProps,
						btnSelect: {
							...this.state.btnProps.btnSelect,
							disabled: !hasUserData
						}
					}
				});
				
				// 그리드 포커스 복원 및 크기 조정
				if (this.gridApi) {
					// 그리드 크기 재조정 및 헤더 정렬
					this.forceGridAlignment();
					
					// 포커스 복원
					if (this.currentRow && res.data) {
						let rowNum = this.rowFinder(res.data, 'userId', this.currentRow);
						this.gridApi.setFocusedCell(rowNum, 'userId');
					}

				}
				break;
				
			default:
				break;
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [6. event Handler Zone]
	/*------------------------------------------------------------------------------------------------*/
	event = {
		button: {
			onClick: (e) => {
				let btnId = e.target.id;
				console.log('Button clicked:', btnId);
				
				switch (btnId) {
					case 'btnSearch':
						console.log('Search button clicked');
						if (this.validation('SYS0040R02')) {
							this.transaction('SYS0040R02');
						}
						break;
						
					case 'btnSelect':
						console.log('Select button clicked');
						this.handleUserSelect();
						break;
						
					case 'btnClose':
						console.log('Close button clicked');
						this.handleClose();
						break;
						
					default:
						console.log('Unknown button clicked:', btnId);
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
				// 엔터키 입력 시 조회 실행
				if (e.key === 'Enter' || e.keyCode === 13) {
					e.preventDefault();
					if (this.validation('SYS0040R02')) {
						this.transaction('SYS0040R02');
					}
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
			onRowClicked: (e) => {
				console.log('Grid row clicked:', e.data);
				this.currentRow = e.data.userId;
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
		},
		ognz: {
			onChange: (e) => {
				console.log('Ognz changed:', e);
				console.log('e.ognzCd:', e.ognzCd);
				console.log('e.ognzNm:', e.ognzNm);
				// OgnzSelect에서 선택한 조직 정보를 state에 반영
				this.setState({
					...this.state,
					ognzProps: {
						...this.state.ognzProps,
						ognzSearch: {
							...this.state.ognzProps.ognzSearch,
							ognzCd: e.ognzCd || '',
							ognzNm: e.ognzNm || '',
							value: e.ognzNm || ''
						}
					}
				}, () => {
					console.log('Updated ognzProps:', this.state.ognzProps.ognzSearch);
				});
			}
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [7. Utility Functions Zone]
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
	
	// 그리드 헤더와 컨텐츠 간격 강제 정렬 함수
	forceGridAlignment = () => {
		if (!this.gridApi) {
			return;
		}
		
		try {
			// 그리드 크기 재계산 강제
			this.gridApi.resetRowHeights();
			this.gridApi.sizeColumnsToFit();
			
			// DOM 강제 갱신
			setTimeout(() => {
				if (this.gridApi) {
					this.gridApi.redrawRows();
					this.gridApi.refreshHeader();
				}
			}, 50);
			
		} catch (error) {
			console.warn('Grid alignment force error:', error);
		}
	};
	
	handleUserSelect = () => {
		
		// 1. 사용자 데이터가 있는지 확인
		const userData = this.state.dsUserList.getRecords();
		if (!userData || userData.length === 0) {
			ComLib.openDialog('A', 'SYSI0010', ['먼저 조직을 선택하여 사용자 목록을 조회하세요.']);
			return;
		}
		
		// 2. 그리드 API가 준비되었는지 확인
		if (!this.gridApi) {
			console.error('GridApi is not available');
			// gridApi가 없을 때 재시도 로직
			setTimeout(() => {
				if (this.gridApi) {
					this.handleUserSelect();
				} else {
					ComLib.openDialog('A', 'SYSI0010', ['그리드가 준비되지 않았습니다. 잠시 후 다시 시도하세요.']);
				}
			}, 500);
			return;
		}
		
		// 3. 선택된 행 가져오기
		let selectedRows;
		try {
			selectedRows = this.gridApi.getSelectedRows();
		} catch (error) {
			console.error('Error getting selected rows:', error);
			ComLib.openDialog('A', 'SYSI0010', ['선택된 데이터를 가져오는데 실패했습니다.']);
			return;
		}
		
		// 4. 선택된 사용자가 있는지 확인
		if (!selectedRows || selectedRows.length === 0) {
			ComLib.openDialog('A', 'SYSI0010', ['체크박스를 클릭하여 사용자를 선택하세요.']);
			return;
		}
		
		try {
			// 조회 요청 페이지에 전달
			this.props.onCallbackFunc(selectedRows);
			this.handleClose();
		} catch (error) {
			console.error('사용자 선택 전달 중 오류:', error);
			ComLib.openDialog('A', 'SYSI0010', ['사용자 데이터 전달 중 오류가 발생했습니다.']);
		}
	};
	
	handleClose = () => {
		if(this.isPopupMode){
			this.props.onClose();
			return;
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [8. Render Zone]
	/*------------------------------------------------------------------------------------------------*/
	render() {
		return (
			<FullPanel>
				{/* 검색 영역 */}
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '53px 1fr', alignItems: 'center', marginBottom: '5px'}}>
								<Label value="조직"/>
								<OgnzSelect
									{...this.state.ognzProps.ognzSearch}
									onChange={this.event.ognz.onChange}
									ognzNmWidth = '150px'
								/>
							</div>
							<div style={{display: 'grid', gridTemplateColumns: '53px 200px 1fr', alignItems: 'center'}}>
								<Label value="사용자"/>
								<Textfield 
									{...this.state.textFieldProps.iptUserSearch} 
									onChange={this.event.input.onChange}
									onKeyPress={this.event.input.onKeyPress}
								/>
								<Checkbox 
									{...this.state.checkboxProps.chkIncludeInactive}
									onChange={this.event.checkbox.onChange}
								/>
							</div>
						</LFloatArea>
						<RFloatArea>
							<Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				
				{/* 메인 컨텐츠 */}
				<SubFullPanel>
					<ComponentPanel>
						<Grid 
							{...this.state.grdProps.grdUserList}
							data={this.state.dsUserList}
							onGridReady={(params) => {
								this.gridApi = params.api;
								this.columnApi = params.columnApi;
							}}
							onRowDoubleClicked={this.event.grid.onRowDoubleClicked}
							onRowClicked={this.event.grid.onRowClicked}
						/>
					</ComponentPanel>
					<BottomPanel>
						<RelativeGroup>
							<RFloatArea>
								<Button {...this.state.btnProps.btnSelect} onClick={this.event.button.onClick} />
								<Button {...this.state.btnProps.btnClose} onClick={this.event.button.onClick} />
							</RFloatArea>
						</RelativeGroup>
					</BottomPanel>
				</SubFullPanel>				
			</FullPanel>
		);
	}
}

export default View; 