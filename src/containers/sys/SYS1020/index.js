import React from 'react';

// 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, 
         SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';

// UI 컴포넌트
import { Grid, Label, Textfield, Dialog } from 'components';

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
		this.isPopupMode = (this.props.options)? true : false;
		this.fromComponent = (this.props.options)? this.props.options.fromComponent : null;
		// 현재 선택 행 추적용
		this.currentRow = '';
		
		this.state = {
			// 데이터셋 (필수)
			dsMenuList: DataLib.datalist.getInstance(),
			dsSearch: DataLib.datalist.getInstance(),
			
			// Dialog 상태
			isDialogOpen: false,
			selectedMenu: null,
			
			// UI Props 관리
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
				btnConfirm: {
					id: 'btnConfirm',
					disabled: false,
					value: '확인',
					hidden: false,
					color: 'purple',
					size: 'md',
					fiiled: true
				},
				btnCancel: {
					id: 'btnCancel',
					disabled: false,
					value: '취소',
					hidden: false,
					color: 'grey',
					size: 'md',
					fiiled: true
				}
			},
			
			grdProps: {
				grdMenuList: {
					id: 'grdMenuList',
					areaName: '메뉴 목록',
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: false,
					header: [
						{
							headerName: '메뉴ID',
							field: 'menuId',
							colId: 'menuId',
							editable: false,
							width: 90,
							type: 'text',
							req: true,
							textAlign: 'center'
						},
						{
							headerName: '메뉴명',
							field: 'menuNm',
							colId: 'menuNm',
							editable: false,
							width: 150,
							type: 'text',
							req: true,
							textAlign: 'left'
						},
						{
							headerName: '상위메뉴명',
							field: 'upMenuIdNm',
							colId: 'upMenuIdNm',
							editable: false,
							width: 200,
							type: 'text',
							textAlign: 'left'
						}
					],
					height: '400px',
					rowSelection: 'single'
				}
			},
			

			
			textFieldProps: {
				iptMenuName: {
					id: 'iptMenuName',
					value: '',
					placeholder: '메뉴명을 입력하세요',
					maxLength: 50,
					type: 'text',
					readOnly: false,
					disabled: false
				}
			}
		};
		
		// 이벤트 바인딩 (필수)
		this.event = {
			button: {
				onClick: this.event.button.onClick.bind(this)
			},
			input: {
				onChange: this.event.input.onChange.bind(this),
				onKeyPress: this.event.input.onKeyPress.bind(this)
			},
			grid: {
				onGridReady: this.event.grid.onGridReady.bind(this),
				onRowSelected: this.event.grid.onRowSelected.bind(this),
				onRowClicked: this.event.grid.onRowClicked.bind(this),
				onRowDoubleClicked: this.event.grid.onRowDoubleClicked.bind(this)
			}
		};
	}
	
	/*------------------------------------------------------------------------------------------------*/
	// [2. LifeCycle Zone]
	/*------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		// 팝업 호출 시 초기 메뉴 목록 조회
		if (this.validation('SYS1020R01')) {
			this.transaction('SYS1020R01');
		}
	}
	
	/*------------------------------------------------------------------------------------------------*/
	// [3. Validation Zone]
	/*------------------------------------------------------------------------------------------------*/
	validation = (...params) => {
		let transId = params[0];
		
		switch (transId) {
			case 'SYS1020R01': // 메뉴 조회
				// 메뉴명 길이 검증
				const menuName = this.state.textFieldProps.iptMenuName.value;
				if (menuName && menuName.length > 50) {
					ComLib.openDialog('A', '', '메뉴명은 50자 이내로 입력하세요.');
					return false;
				}
				break;
				
			case 'SYS1020_SELECT': // 메뉴 선택
				if (!this.state.selectedMenu) {
					ComLib.openDialog('A', '', '선택할 메뉴를 선택해주세요.');
					return false;
				}
				break;
				
			default:
				break;
		}
		return true;
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [4. Transaction Zone]
	/*------------------------------------------------------------------------------------------------*/
	transaction = (...params) => {
		let transId = params[0];
		let transManager = new TransManager();
		
		try {
			switch (transId) {
				case 'SYS1020R01':
					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/menu/search/r01");
					transManager.setCallBack(this.callback);
					transManager.addConfig({
						datasetsend: 'dsSearch',
						datasetrecv: 'dsMenuList'
					});
					
					// 검색 조건 설정 (백엔드 필드명에 맞춤)
					let searchData = {
						menuIdOrNm: this.state.textFieldProps.iptMenuName.value
					};
					
					this.state.dsSearch.setRecords([searchData]);
					transManager.setFormData(searchData);
					transManager.agent();
					break;
					
				default:
					break;
			}
		} catch (err) {
			console.error('Transaction Error:', err);
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [5. Callback Zone]
	/*------------------------------------------------------------------------------------------------*/
	callback = (res) => {
		console.log('SYS1020 - callback 호출됨:', res);
		
		if (res.result) {
			switch (res.id) {
				case 'SYS1020R01':
					console.log('SYS1020 - API 응답 성공');
					console.log('SYS1020 - 받은 데이터:', res.data);
					
					// 메뉴 목록 조회 결과 처리 (res.data 자체가 메뉴 목록)
					const menuList = res.data || [];
					console.log('SYS1020 - 처리할 메뉴 목록:', menuList);
					console.log('SYS1020 - 메뉴 목록 길이:', menuList.length);
					
					// 데이터셋에 레코드 설정
					this.state.dsMenuList.setRecords(menuList);
					console.log('SYS1020 - dsMenuList에 데이터 설정 완료');
					console.log('SYS1020 - dsMenuList.getRecords():', this.state.dsMenuList.getRecords());
					console.log('SYS1020 - dsMenuList.getRecords() 길이:', this.state.dsMenuList.getRecords().length);
					
					// 상태 업데이트
					this.setState({
						dsMenuList: this.state.dsMenuList
					});
					console.log('SYS1020 - setState 완료');
					console.log('SYS1020 - 현재 state:', this.state);
					
					// 그리드 포커스 복원
					if (this.gridApi && menuList.length > 0) {
						let rowNum = this.rowFinder(menuList, 'menuId', this.currentRow);
						this.gridApi.setFocusedCell(rowNum, 'menuId');
					}
					break;
					
				default:
					break;
			}
		} else {
			// 에러 처리
			console.error('SYS1020 - API 응답 실패:', res.message);
			ComLib.openDialog('A', '', res.message || '처리 중 오류가 발생했습니다.');
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [6. Event Zone]
	/*------------------------------------------------------------------------------------------------*/
	event = {
		button: {
			onClick: (e) => {
				let btnId = e.target.id;

				switch (btnId) {
					case 'btnSearch':
						if (this.validation('SYS1020R01')) {
							this.transaction('SYS1020R01');
						}
						break;
						
					case 'btnConfirm':
						if (this.validation('SYS1020_SELECT')) {					
							const selectedMenuInfo = {
								menuId: this.state.selectedMenu.menuId,
								menuNm: this.state.selectedMenu.menuNm,
								closeable: true
							};
							
							// 선택된 메뉴 정보를 부모 창에 전달하고 팝업 닫기
							if (this.props.options.onMenuSelect && this.fromComponent === 'COM2070') {
								this.props.options.onMenuSelect(this.state.selectedMenu);
							} else {
								if (this.props.openMenu) {
									this.props.openMenu(selectedMenuInfo);
								}
							} 
							this.closeDialog();
						}
						break;
						
					case 'btnCancel':
						this.closeDialog();
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
				// 엔터키(13)를 눌렀을 때 조회 실행
				if (e.key === 'Enter') {
					e.preventDefault();
					if (this.validation('SYS1020R01')) {
						this.transaction('SYS1020R01');
					}
				}
			}
		},
		

		
		grid: {
			onGridReady: (params) => {
				try {
					console.log('SYS1020 - Grid Ready');
					
					// Grid API 설정
					if (params && params.api) {
						this.gridApi = params.api;
					}
					if (params && params.columnApi) {
						this.columnApi = params.columnApi;
					}
					
					console.log('SYS1020 - Grid API 설정 완료');
					
					// 데이터 확인
					const records = this.state.dsMenuList.getRecords();
					console.log('SYS1020 - Grid 데이터 확인:', records);
					console.log('SYS1020 - Grid 데이터 길이:', records ? records.length : 0);
					
				} catch (error) {
					console.error('SYS1020 - Grid Ready 이벤트 처리 중 오류 발생:', error);
				}
			},
			
			onRowClicked: (params) => {
				try {
					console.log('SYS1020 - onRowClicked 이벤트 발생:', params);
					console.log('SYS1020 - 클릭된 행 데이터:', params.data);
					
					if (params.data) {
						const clickedData = params.data;
						
						console.log('SYS1020 - 클릭된 메뉴 데이터:', clickedData);
						console.log('SYS1020 - 클릭된 메뉴 ID:', clickedData.menuId);
						
						// 현재 행 추적
						this.currentRow = clickedData.menuId || '';
						
						// 상태 업데이트
						this.setState({
							...this.state,
							selectedMenu: clickedData
						}, () => {
							// setState 완료 후 콜백에서 상태 확인
							console.log('SYS1020 - 클릭 후 setState 완료, selectedMenu:', this.state.selectedMenu);
						});
					}
				} catch (error) {
					console.error('SYS1020 - 행 클릭 이벤트 처리 중 오류 발생:', error);
				}
			},
			
			onRowSelected: (params) => {
				try {
					console.log('SYS1020 - onRowSelected 이벤트 발생:', params);
					console.log('SYS1020 - params.node:', params.node);
					console.log('SYS1020 - params.node.selected:', params.node ? params.node.selected : 'undefined');
					console.log('SYS1020 - params.data:', params.data);
					
					if (params.node && params.node.selected) {
						const selectedData = params.data;
						
						// 데이터 유효성 검사
						if (!selectedData) {
							console.warn('SYS1020 - 선택된 데이터가 없습니다.');
							return;
						}
						
						console.log('SYS1020 - 선택된 메뉴 데이터:', selectedData);
						console.log('SYS1020 - 선택된 메뉴 ID:', selectedData.menuId);
						
						// 현재 행 추적
						this.currentRow = selectedData.menuId || '';
						
						// 상태 업데이트
						this.setState({
							...this.state,
							selectedMenu: selectedData
						}, () => {
							// setState 완료 후 콜백에서 상태 확인
							console.log('SYS1020 - setState 완료 후 selectedMenu:', this.state.selectedMenu);
						});
						
					} else if (params.node && !params.node.selected) {
						// 행 선택 해제 시
						console.log('SYS1020 - 행 선택 해제됨');
						this.setState({
							...this.state,
							selectedMenu: null
						});
					}
				} catch (error) {
					console.error('SYS1020 - 행 선택 이벤트 처리 중 오류 발생:', error);
				}
			},
			
			onRowDoubleClicked: (params) => {
				try {
					// 더블클릭으로 메뉴 선택
					const selectedData = params.data;
					
					// 데이터 유효성 검사
					if (!selectedData) {
						console.warn('SYS1020 - 선택된 데이터가 없습니다.');
						return;
					}
					
					console.log('SYS1020 - 더블클릭된 메뉴 데이터:', selectedData);
					
					// 상태 업데이트
					this.setState({
						...this.state,
						selectedMenu: selectedData
					});
					
					const selectedMenuInfo = {
						menuId: selectedData.menuId,
						menuNm: selectedData.menuNm,
						closeable: true
					};
					
					// 부모 컴포넌트에 선택된 메뉴 전달
					if (this.props.options && this.props.options.onMenuSelect) {
						this.props.options.onMenuSelect(selectedData);
					} else {
						// 일반적인 메뉴 오픈
						if (this.props.openMenu) {
							this.props.openMenu(selectedMenuInfo);
						}
					}
					
					// 다이얼로그 닫기
					if (typeof this.closeDialog === 'function') {
						this.closeDialog();
					} else {
						console.warn('SYS1020 - closeDialog 메서드가 정의되지 않았습니다.');
					}
					
				} catch (error) {
					console.error('SYS1020 - 더블클릭 이벤트 처리 중 오류 발생:', error);
					ComLib.openDialog('A', '', '메뉴 선택 중 오류가 발생했습니다.');
				}
			}
		}
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [7. Utility Zone]
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
	
	// Dialog 제어
	openDialog = () => {
		this.setState({ isDialogOpen: true });
		// 팝업 열릴 때 메뉴 목록 조회
		if (this.validation('SYS1020R01')) {
			this.transaction('SYS1020R01');
		}
	};
	
	closeDialog = () => {
		// 팝업 닫기 수정 및 추가
		if(this.isPopupMode){
			this.props.onClose();
			return;
		}

		this.setState({ 
			isDialogOpen: false,
			selectedMenu: null
		});
	};
	
	/*------------------------------------------------------------------------------------------------*/
	// [8. Render Zone]
	/*------------------------------------------------------------------------------------------------*/
	render() {
		console.log('SYS1020 - render 실행');
		const records = this.state.dsMenuList.getRecords();
		console.log('SYS1020 - dsMenuList 데이터:', records);
		console.log('SYS1020 - dsMenuList 길이:', records.length);
		console.log('SYS1020 - dsMenuList 타입:', typeof records);
		console.log('SYS1020 - dsMenuList가 배열인가:', Array.isArray(records));
		console.log('SYS1020 - 현재 선택된 메뉴:', this.state.selectedMenu);
		return (
			<FullPanel>
				{/* 검색 조건 영역 */}
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea>
							<FlexPanel>
								<Label value="메뉴명" />
								<Textfield 
									{...this.state.textFieldProps.iptMenuName}
									width={200}
									onChange={this.event.input.onChange}
									onKeyPress={this.event.input.onKeyPress}
								/>

							</FlexPanel>
						</LFloatArea>
						<RFloatArea>
							<Button 
								{...this.state.btnProps.btnSearch}
								onClick={this.event.button.onClick}
							/>
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				
				{/* 메뉴 목록 그리드 */}
				<SubFullPanel>
					<RelativeGroup>
						<LFloatArea>
							<div className="scrm-component-panel-namearea">
								<span>메뉴 목록</span>
							</div>
						</LFloatArea>
					</RelativeGroup>						
					<Grid 
						// 기본 그리드 설정
						{...this.state.grdProps.grdMenuList}							
						// 데이터 및 이벤트 핸들러
						data={this.state.dsMenuList}
						onGridReady={this.event.grid.onGridReady}
						onRowClicked={this.event.grid.onRowClicked}
						onRowSelected={this.event.grid.onRowSelected}
						onRowDoubleClicked={this.event.grid.onRowDoubleClicked}
						/>
					</SubFullPanel>
					
					{/* 팝업 액션 버튼 */}
					<RelativeGroup>
						<RFloatArea>
							<Button 
								{...this.state.btnProps.btnCancel}
								onClick={this.event.button.onClick}
								 mt="10px"
							/>
							<Button 
								{...this.state.btnProps.btnConfirm}
								onClick={this.event.button.onClick}
							/>
						</RFloatArea>
					</RelativeGroup>
				
			</FullPanel>
		);
	}
}

export default View; 