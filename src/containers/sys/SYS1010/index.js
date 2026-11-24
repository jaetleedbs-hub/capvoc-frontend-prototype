import React from 'react';

// 1. 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, SearchPanel, LFloatArea, RFloatArea, RelativeGroup, BottomPanel } from 'components';

// 2. UI 컴포넌트
import { Grid, Label, Textfield } from 'components';
import { BasicButton as Button } from 'components';
import { getPopupRoutes } from 'routes/popupRoute';
import { PopupManager } from 'common';

// 3. 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

/**
 * @name SYS1010
 * @author NEXSIS
 * @since 2025-07-02
 * @description 메뉴관리
 */
class View extends React.Component {
	/*------------------------------------------------------------------------------------------------*
	 *  검색 조건 초기값
	 *------------------------------------------------------------------------------------------------*/
	getInitialSearchData = () => ({
		keyword: ''
	});

	constructor(props) {
		super(props);

		// Grida API
		this.gridApi = null;
		this.columnApi = null;
		this.currentRowData = null;

		// 현재 행
		this.currentRow = '';

		this.state = {
			// data
			dsSearch: this.getInitialSearchData(),
			dsMenuList: DataLib.datalist.getInstance(),

			// prop
			textFieldProps: {
				iptMenuKeyword: {
					id: 'iptMenuKeyword',
					value: '',
					placeholder: '메뉴ID 또는 메뉴명',
					width: 200,
				},
			},
			btnProps: {
				btnSearch: {
					id: 'btnSearch',
					value: '조회',
					color: 'blue',
					fiiled: true,
					className : 'icon-srch',
					onClick: this.event.button.onClick,
				},
				btnReset: {
					id: 'btnReset',
					value: '',
					color: 'grey',
					className : 'icon-reset',
					type: 'icon',
					onClick: this.event.button.onClick,
				},
				btnPreview: {
					id: 'btnPreview',
					value: '팝업 미리보기',
					color: 'grey',
					className : 'icon-view',
					onClick: this.event.button.onClick,
				},				
				btnSave: {
					id: 'btnSave',
					value: '저장',
					color: 'blue',
					fiiled: true,
					className : 'icon-act',
					onClick: this.event.button.onClick,
				},
				btnAddRow: {
					id: 'btnAddRow',
					value: '행추가',
					color: 'grey',
					className : 'icon-plus',
					onClick: this.event.button.onClick,
				},
				btnDelRow: {
					id: 'btnDelRow',
					value: '행삭제',
					color: 'grey',
					className : 'icon-minus',
					onClick: this.event.button.onClick,
				}
			},
			grdProps: {
				grdMenuList: {
					id: 'grdMenuList',
					areaName: '메뉴 목록',
					height: 'calc(100vh - 372px)',
					rowNum: true,
					header: [
					{ headerName: '메뉴ID', field: 'menuId', colId: 'menuId', width: 100, editable: (params) => params.data.rowtype === 'c', req: true, type: 'code' },
						{ headerName: '메뉴명', field: 'menuNm', colId: 'menuNm', width: 200, editable: true, req: true },
						{ headerName: '상위메뉴ID', field: 'upMenuId', colId: 'upMenuId', width: 100, editable: true },
						{ headerName: '정렬순서', field: 'sortSn', colId: 'sortSn', width: 80, editable: true, req: true, type: 'num', cellStyle: { textAlign: 'right' } },
						{ headerName: 'URL주소', field: 'urlAddr', colId: 'urlAddr', width: 220, editable: true },
						{ headerName: '메뉴구분이름', field: 'npagYn', colId: 'npagYn', width: 140, editable: true, cellEditor: 'agSelectCellEditor',
						cellEditorParams: { values: ['X', 'Y', 'P', 'M'] },
						valueFormatter: (param) => {
							if (param.value === 'X') return '메뉴';
							if (param.value === 'Y') return 'MODAL 팝업';
							if (param.value === 'P') return '새창 팝업';
							if (param.value === 'M') return 'MDI 형식';
							return param.value || '메뉴';
						},
					},
					{ headerName: '화면크기', field: 'scrnSize', colId: 'scrnSize', width: 110, editable: true },
					{ headerName: '메뉴상태', field: 'menuUseYn', colId: 'menuUseYn', width: 90, editable: true, cellEditor: 'agSelectCellEditor',
						cellEditorParams: { values: ['Y', 'H', 'N'] },
						valueFormatter: (param) => {
							if (param.value === 'Y') return '메뉴사용';
							if (param.value === 'H') return '표시안함';
							if (param.value === 'N') return '사용안함';
							return param.value || '메뉴사용';
						},
						cellStyle: { textAlign: 'center' }
					},
					{ headerName: '수정자', field: 'mdfrId', colId: 'mdfrId', width: 100, cellStyle: { textAlign: 'center' } },
					{ headerName: '수정일시', field: 'mdfcnDt', colId: 'mdfcnDt', width: 150, cellStyle: { textAlign: 'center' } },
					],
					rowSelection: 'single',
					onGridReady: this.event.grid.onGridReady,
					onCellValueChanged: this.event.grid.onCellValueChanged,
				}
			},
			deletedMenuIds: [] // 🗑️ 삭제할 메뉴 ID 목록
		}

		// 이벤트 바인딩
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
	}

	/*------------------------------------------------------------------------------------------------*
	 *  LifeCycle Event
	 *------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		if (this.validation('SYS1010R01')) {
			this.transaction('SYS1010R01');
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 *  폐쇄 메서드
	 *------------------------------------------------------------------------------------------------*/
	validation = (transId) => {
		switch (transId) {
			case 'SYS1010R01':
				break;
			case 'SYS1010U01':
				const modifiedRows = this.state.dsMenuList.getRecords().filter(row => row.rowtype !== 'R');

				// 필수 입력 항목 검증
				for (const row of modifiedRows) {
					if (StrLib.isNull(row.menuId)) {
						ComLib.openDialog('A', 'SYSI0010', ['메뉴ID는 필수 입력 항목입니다.']);
						return false;
					}
					if (StrLib.isNull(row.menuNm)) {
						ComLib.openDialog('A', 'SYSI0010', ['메뉴명은 필수 입력 항목입니다.']);
						return false;
					}
					if (StrLib.isNull(row.sortSn)) {
						ComLib.openDialog('A', 'SYSI0010', ['정렬순서는 필수 입력 항목입니다.']);
						return false;
					}
					
					if( row.scrnSize && row.scrnSize.trim() !== '') {
						let scrnSize = row.scrnSize.trim();
						let arraySize = scrnSize.split(',');
						if( !scrnSize.includes(',') || isNaN(arraySize[0]) || isNaN(arraySize[1]) || arraySize.length > 2 ) {
							ComLib.openDialog('A', 'SYSI0010', ['화면 크기는 800,600 [넓이(숫자),높이(숫자)] 형식으로 입력하여 주십시오.']);
							return false;
						}
						if( arraySize[0] < 100 || arraySize[1] < 100|| arraySize[0] > 2000 || arraySize[1] > 1200 ) {
							ComLib.openDialog('A', 'SYSI0010', ['화면 넓이는 최소 100, 최대 2,000, 화면 높이는 최소 100, 최대 1,200 입니다.']);
							return false;
						}
					}

					// 정렬순서 숫자 검증
					if (row.sortSn && row.sortSn.toString().trim() !== '') {
						const sortSnValue = row.sortSn.toString().trim();
						
						// 숫자만 허용하는 정규식 검증
						if (!/^\d+$/.test(sortSnValue)) {
							ComLib.openDialog('A', 'SYSI0010', ['정렬순서는 숫자만 입력 가능합니다.']);
							return false;
						}
					}
				}

				// 메뉴ID 중복 검증 (저장 버튼에서 이미 검증했으므로 여기서는 기본 검증만)
				const allRows = this.state.dsMenuList.getRecords();
				const menuIdMap = new Map();
				
				for (let i = 0; i < allRows.length; i++) {
					const row = allRows[i];
					if (row.menuId && row.menuId.trim() !== '') {
						const menuId = row.menuId.trim();
						
						if (menuIdMap.has(menuId)) {
							// 중복된 메뉴ID 발견
							const duplicateRowIndex = menuIdMap.get(menuId);
							
							ComLib.openDialog('A', 'SYSI0010', [
								`메뉴ID '${menuId}'가 중복됩니다. 중복된 메뉴ID를 수정해주세요.`
							]);
							
							// 중복된 행을 포커스
							setTimeout(() => {
								if (this.gridApi) {
									this.gridApi.setFocusedCell(duplicateRowIndex, 'menuId');
									this.gridApi.selectRow(duplicateRowIndex);
								}
							}, 100);
							
							return false;
						} else {
							menuIdMap.set(menuId, i);
						}
					}
				}
				break;
			default: break;
		}
		return true;
	}

	transaction = (transId, deletePayload) => {
		let transManager = new TransManager();
		transManager.setTransId(transId);
		transManager.setCallBack(this.callback);

		switch (transId) {
			case 'SYS1010R01':
				transManager.setTransUrl('/api/cmm/menu/r01');
				transManager.addConfig({
					datasetrecv: 'dsMenuList',
					datasetsend: 'dsSearch'
				});

				let searchData = {
					keyword: this.state.dsSearch.keyword || '',
				};
				this.currentRowData = null;
				transManager.setFormData(searchData)
				transManager.agent();
				break;

			case 'SYS1010U01':
				transManager.setTransUrl('/api/cmm/menu/u01');
				transManager.addConfig({
					datasetrecv: 'dsResult',
					datasetsend: 'dsMenuList'
				});

				// 🔄 변경된 데이터만 필터링 (신규/수정/삭제된 행만 전송)
				const allRows = this.state.dsMenuList.getRecords();
				const modifiedRows = allRows.filter(row => row.rowtype !== 'R');
				
				if (modifiedRows.length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
					return;
				}

				ComLib.openDialog('C', 'SYSI0010', ['저장하시겠습니까?'], function (e){
					if(e) {
						transManager.setFormData(modifiedRows);
						transManager.agent();
					}
				});
				break;

			case 'SYS1010D01':
				transManager.setTransUrl('/api/cmm/menu/d01');
				transManager.addConfig({
					datasetrecv: 'dsResult',
					datasetsend: 'dsMenuList'
				});
				// 삭제할 메뉴 ID만 전송
				const menuIdsToDelete = deletePayload || this.state.deletedMenuIds.map(menuId => ({ menuId }));
				if (menuIdsToDelete.length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['삭제할 데이터가 없습니다.']);
					return;
				}
				transManager.setFormData(menuIdsToDelete);
				transManager.agent();
				break;

			default: break;
		}
	}

	callback = (res) => {
		switch (res.id) {
			case 'SYS1010R01':
				try {
					// API 응답 데이터 구조 확인 및 처리
					console.log('API 응답 데이터:', res);
					
					let menuData = [];
					if (res.data && Array.isArray(res.data)) {
						menuData = res.data;
					} else if (res.data && res.data.dsMenuList && Array.isArray(res.data.dsMenuList)) {
						menuData = res.data.dsMenuList;
					} else if (res.data && res.data.data && Array.isArray(res.data.data)) {
						menuData = res.data.data;
					} else if (Array.isArray(res)) {
						menuData = res;
					}
					
					// 🔄 조회된 데이터의 초기 상태를 'R' (Read)로 설정
					const initializedMenuData = menuData.map(item => ({
						...item,
						rowtype: 'R'
					}));
					
					this.state.dsMenuList.setRecords(initializedMenuData);
					this.setState({ ...this.state });
				} catch (error) {
					console.error('메뉴 목록 조회 중 오류:', error);
					ComLib.openDialog('A', 'SYSI0010', ['메뉴 목록 조회 중 오류가 발생했습니다.']);
				}
				break;

			case 'SYS1010U01':
				// ComLib.openDialog('A', 'SYSI0010', ['저장이 완료되었습니다.']);
				this.setState({ deletedMenuIds: [] }); // 저장 완료 후 삭제 목록 초기화
				if (this.validation('SYS1010R01')) {
					this.transaction('SYS1010R01');
				}
				break;

			case 'SYS1010D01':
				// ComLib.openDialog('A', 'SYSI0010', ['저장이 완료되었습니다.']);
				this.setState({ deletedMenuIds: [] }); // 삭제 완료 후 삭제 목록 초기화
				if (this.validation('SYS1010R01')) {
					this.transaction('SYS1010R01');
				}
				break;

			default: break;
		}
	}


	previewPopup = (currentMenu) => {

		if( !currentMenu ) {
			ComLib.openDialog('A', 'SYSI0010', ['미리보기할 행을 선택해주세요.']);
			return;
		}

		if( currentMenu.npagYn !== 'P' && currentMenu.npagYn !== 'Y') {
			ComLib.openDialog('A', 'SYSI0010', ['팝업 화면이 아니거나 실행할 수 없는 상태입니다.']);
			return;
		}

		if(!currentMenu.scrnSize ) {
			ComLib.openDialog('A', 'SYSI0010', ['화면 크기가 설정되지 않았습니다.']);
			return;
		}

		let scrnSize = currentMenu.scrnSize.trim();
		let arraySize = scrnSize.split(',');
		if( !scrnSize.includes(',') || isNaN(arraySize[0]) || isNaN(arraySize[1]) || arraySize.length > 2 ) {
			ComLib.openDialog('A', 'SYSI0010', ['화면 크기는 800,600 [넓이(숫자),높이(숫자)] 형식으로 입력하여 주십시오.']);
			return;
		}
		if( arraySize[0] < 100 || arraySize[1] < 100|| arraySize[0] > 2000 || arraySize[1] > 1200 ) {
			ComLib.openDialog('A', 'SYSI0010', ['화면 넓이는 최소 100, 최대 2,000, 화면 높이는 최소 100, 최대 1,200 입니다.']);
			return;
		}

		let originGdsMenu = ComLib.getSession('gdsMenu');
		let tempMenu = JSON.parse(JSON.stringify(currentMenu));
		ComLib.setSession('gdsMenu', [tempMenu]);

		// 🔧 PopupDialog 렌더링 완료 후 gdsMenu 원복을 위한 지연 함수
		const restoreGdsMenuSafely = () => {
			setTimeout(() => {
				ComLib.setSession('gdsMenu', originGdsMenu);
				console.log('✅ 미리보기 완료 - gdsMenu 안전 원복됨');
			}, 2000); // 2초 후 원복 (PopupDialog 렌더링 완료 대기)
		};

		// 동적 팝업 라우트에서 검색
		if( currentMenu.npagYn === 'Y') {
			// Modal 팝업
			ComLib.openPop(tempMenu.menuId, tempMenu.menuNm, {
				modaless: false, 
				width: arraySize[0]+'px', 
				height: arraySize[1] + 'px' 
			}, () => {
				// 팝업 닫힐 때 즉시 원복
				ComLib.setSession('gdsMenu', originGdsMenu);
				console.log('✅ Modal 팝업 닫힘 - gdsMenu 원복됨');
			});
			
			// 안전장치: PopupDialog 렌더링 완료 후 원복
			restoreGdsMenuSafely();
		} else {
			// 새창 팝업
			const allPopupRoutes = getPopupRoutes();
			const popupRoutes = allPopupRoutes.filter(route => route.id === tempMenu.menuId);
			if( !popupRoutes || popupRoutes.length === 0 ) {
				console.warn(`❌ 팝업 라우트를 찾을 수 없습니다: ${tempMenu.menuId}`);
				console.log('📋 사용 가능한 팝업 라우트:', allPopupRoutes.map(r => r.id));
				ComLib.openDialog('팝업 화면이 아니거나 실행할 수 없는 상태입니다. ' + tempMenu.menuId + " " + tempMenu.menuNm);
				ComLib.setSession('gdsMenu', originGdsMenu);
				return;
			}
	
			const popupRoute = popupRoutes[0];
			const popupUrl = popupRoute.path;
			const popupName = tempMenu.menuId;
			const popupFeatures = 'width='+arraySize[0]+',height='+arraySize[1]+',scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no';
			
			console.log(`✅ 미리보기 새창 팝업 열기: ${popupUrl}`);
	
			const popupId = PopupManager.open(
				popupUrl, 
				popupName, 
				popupFeatures,
				{},
				// 팝업 로드 완료 후 실행될 콜백
				(popupId, popupInfo, popupWindow) => {
					console.log('✅ 새창 팝업 로드 완료');
					
					// 팝업 창이 닫힐 때 원복하도록 이벤트 리스너 등록
					if (popupWindow && !popupWindow.closed) {
						const checkClosed = setInterval(() => {
							if (popupWindow.closed) {
								clearInterval(checkClosed);
								ComLib.setSession('gdsMenu', originGdsMenu);
								console.log('✅ 새창 팝업 닫힘 - gdsMenu 원복됨');
							}
						}, 1000);
					}
				}
			);
			
			// 안전장치: 팝업 로드 완료 후 원복
			restoreGdsMenuSafely();
		}

	}

	/*------------------------------------------------------------------------------------------------*
	 *  이벤트 핸들러
	 *------------------------------------------------------------------------------------------------*/
	event = {
		button: {
			onClick: (e) => {
				switch (e.target.id) {
					case 'btnSearch':
						if (this.validation('SYS1010R01')) {
							this.transaction('SYS1010R01');
						}
						break;
					case 'btnReset':
						this.initializeSearchData();
						break;
					case 'btnPreview':
						let selectedRows = this.gridApi.getSelectedRows();
						if (selectedRows.length === 0) {
							return;
						}						

						this.previewPopup(selectedRows[0]);
						break;
					case 'btnSave': {
						const allRows = this.state.dsMenuList.getRecords();
						const modifiedRows = allRows.filter(row => row.rowtype === 'C' || row.rowtype === 'U');
						const hasModifiedData = modifiedRows.length > 0;
						const hasDeletedData = this.state.deletedMenuIds.length > 0;
						
						if (!hasModifiedData && !hasDeletedData) {
							ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
							return;
						}
						
						// 🔍 저장 전 중복 메뉴ID 검증
						if (hasModifiedData) {
							const menuIdMap = new Map();
							let duplicateFound = false;
							let duplicateMenuId = '';
							let duplicateRowIndex = -1;
							
							for (let i = 0; i < allRows.length; i++) {
								const row = allRows[i];
								if (row.menuId && row.menuId.trim() !== '') {
									const menuId = row.menuId.trim();
									
									if (menuIdMap.has(menuId)) {
										duplicateFound = true;
										duplicateMenuId = menuId;
										duplicateRowIndex = i;
										break;
									} else {
										menuIdMap.set(menuId, i);
									}
								}
							}
							
							if (duplicateFound) {
								ComLib.openDialog('A', 'SYSI0010', [
									`메뉴ID '${duplicateMenuId}'가 중복됩니다. 중복된 메뉴ID를 수정한 후 저장해주세요.`
								]);
								
															// 중복된 행을 포커스
							setTimeout(() => {
								if (this.gridApi) {
									this.gridApi.setFocusedCell(duplicateRowIndex, 'menuId');
									const rowNode = this.gridApi.getDisplayedRowAtIndex(duplicateRowIndex);
									if (rowNode) {
										rowNode.setSelected(true);
									}
								}
							}, 100);
								
								return; // 저장 중단
							}
						}
						
						// 검증 통과 후 저장 진행
						if (hasModifiedData) {
							if (this.validation('SYS1010U01')) {
								this.transaction('SYS1010U01');
							}
						} 
						if (hasDeletedData) {
							this.processDelete();
						}
						break;
					}
					case 'btnAddRow': {
						const addMenuList = DataLib.datalist.getInstance();
						addMenuList.setRecords(this.state.dsMenuList.getRecords());
						addMenuList.addRow(0, { 
							npagYn: 'X',    // 기본값 설정
							rowtype: 'C'    // 🔄 신규 행 타입 설정
						}) 
						
						console.log('➕ 신규 행 추가됨 - rowtype: C');
						
						this.setState({
							dsMenuList: addMenuList
						});
				
						break;
					}
					case 'btnDelRow': {
						let selectedRows = this.gridApi.getSelectedRows();
						if (selectedRows.length === 0) {
							ComLib.openDialog('A', 'SYSI0010', ['삭제할 행을 선택해주세요.']);
							return;
						}
						const selectedMenuIds = selectedRows.map(row => row.menuId);
						const currentData = this.state.dsMenuList.getRecords();

						// 1. menuId가 없는(신규, 미입력) 행은 자식 체크 없이 바로 삭제
						const menuIdsToCheck = selectedMenuIds.filter(id => !!id && id.trim() !== '');

						// 2. 자식 메뉴 존재 여부 확인 (menuId가 있는 행만)
						const hasChild = menuIdsToCheck.some(menuId =>
							currentData.some(row => row.upMenuId === menuId)
						);
						if (hasChild) {
							ComLib.openDialog('A', 'SYSI0010', ['자식 메뉴가 존재합니다. 먼저 자식 메뉴를 삭제하세요.']);
							return;
						}

						// 3. deletedMenuIds에 추가 (menuId가 있는 행만)
						const newDeletedMenuIds = Array.from(new Set([
							...this.state.deletedMenuIds,
							...menuIdsToCheck
						]));

						// 4. dsMenuList에서 해당 menuId를 가진 row를 제거
						const updatedRecords = currentData.filter(row => !selectedMenuIds.includes(row.menuId));
						const updatedMenuList = DataLib.datalist.getInstance();
						updatedMenuList.setRecords(updatedRecords);
						this.setState({
							dsMenuList: updatedMenuList,
							deletedMenuIds: newDeletedMenuIds
						});
						break;
					}
					default: break;
				}
			}
		},
		input: {
			onChange: (e) => {
				let id = e.target.id;
				let value = e.target.value;

				const textFieldProps = { ...this.state.textFieldProps };
				textFieldProps[id].value = value;

				// dsSearch 상태도 함께 업데이트
				const dsSearch = { ...this.state.dsSearch };
				if (id === 'iptMenuKeyword') {
					dsSearch.keyword = value;
				}

				this.setState({ textFieldProps, dsSearch });
			},
			onKeyPress: (e) => {
				// 엔터키(13)를 눌렀을 때 조회 실행
				if (e.key === 'Enter') {
					e.preventDefault();
					if (this.validation('SYS1010R01')) {
						this.transaction('SYS1010R01');
					}
				}
			}
		},
		grid: {
			onGridReady: (params) => {
				this.gridApi = params.api;
				this.columnApi = params.columnApi;
			},
			onRowClicked: (e) => {
				this.currentRowData = e.data;
				console.log('onRowClicked', e);
			},
			onCellValueChanged: (e) => {
				try {
					const currentData = this.state.dsMenuList.getRecords();
					const changedRowIndex = Number(e.index);
			
					// 메뉴ID 필드가 변경된 경우 중복 검증 수행
					if (e.col === 'menuId' && e.newValue && e.newValue.trim() !== '') {
						const duplicateCheck = this.checkMenuIdDuplicate(e.newValue.trim(), changedRowIndex);
						if (duplicateCheck.isDuplicate) {
							// 중복된 메뉴ID가 있는 경우 즉시 경고
							ComLib.openDialog('A', 'SYSI0010', [
								`메뉴ID '${e.newValue.trim()}'가 이미 존재합니다. 다른 메뉴ID를 입력해주세요.`
							]);
							
							// 중복된 행을 포커스하여 사용자가 쉽게 확인할 수 있도록 함
							setTimeout(() => {
								if (this.gridApi && duplicateCheck.duplicateRow) {
									const currentData = this.state.dsMenuList.getRecords();
									const duplicateRowIndex = currentData.findIndex(row => 
										row.menuId === e.newValue.trim() && 
										currentData.indexOf(row) !== changedRowIndex
									);
									if (duplicateRowIndex !== -1) {
										this.gridApi.setFocusedCell(duplicateRowIndex, 'menuId');
										const rowNode = this.gridApi.getDisplayedRowAtIndex(duplicateRowIndex);
										if (rowNode) {
											rowNode.setSelected(true);
										}
									}
								}
							}, 100);
							
							// 중복된 값은 원래 값으로 되돌리기
							this.revertCellValue(changedRowIndex, e.col, e.oldValue);
							return;
						}
					}

					// 정렬순서 필드가 변경된 경우 숫자만 허용
					if (e.col === 'sortSn' && e.newValue !== null && e.newValue !== undefined) {
						const sortSnValue = e.newValue.toString().trim();
						
						// 빈 값이 아닌 경우에만 숫자 검증
						if (sortSnValue !== '') {
							// 숫자만 허용하는 정규식 검증
							if (!/^\d+$/.test(sortSnValue)) {
								// 숫자가 아닌 문자가 포함된 경우 원래 값으로 되돌리기
								this.revertCellValue(changedRowIndex, e.col, e.oldValue);
								return;
							}
						}
					}
			
					// 1. records 배열을 복사해서 불변성 유지
					const newData = currentData.map((row, idx) =>
						idx === changedRowIndex
							? { 
								...row, 
								[e.col]: e.newValue,   // 실제 값 변경!
								rowtype: 'U' 
							  }
							: row
					);
			
					const updatedMenuList = DataLib.datalist.getInstance();
					updatedMenuList.setRecords(newData);
			
					this.setState({
						dsMenuList: updatedMenuList
					});
				} catch (error) {
					console.error('셀 값 변경 처리 중 오류:', error);
				}
			}
		}
	}

	// 메뉴ID 중복 검증 메서드
	checkMenuIdDuplicate = (menuId, currentRowIndex) => {
		const currentData = this.state.dsMenuList.getRecords();
		const duplicateRow = currentData.find((row, index) => 
			index !== currentRowIndex && 
			row.menuId && 
			row.menuId.trim() !== '' &&
			row.menuId.trim() === menuId.trim()
		);
		
		return {
			isDuplicate: !!duplicateRow,
			duplicateRow: duplicateRow
		};
	}



	// 셀 값을 원래 값으로 되돌리는 메서드
	revertCellValue = (rowIndex, columnId, oldValue) => {
		const currentData = this.state.dsMenuList.getRecords();
		const updatedData = currentData.map((row, index) =>
			index === rowIndex
				? { ...row, [columnId]: oldValue }
				: row
		);
		
		const updatedMenuList = DataLib.datalist.getInstance();
		updatedMenuList.setRecords(updatedData);
		
		this.setState({
			dsMenuList: updatedMenuList
		});
	}

	// 삭제 처리 메서드
	processDelete = () => {
		if (this.state.deletedMenuIds.length === 0) {
			console.log('🗑️ 삭제할 데이터가 없습니다.');
			return;
		}
		const menuIdsToDelete = this.state.deletedMenuIds.map(menuId => ({ menuId }));
		console.log('🗑️ 삭제 처리 시작:', menuIdsToDelete);
		this.transaction('SYS1010D01', menuIdsToDelete);
	}

	/*------------------------------------------------------------------------------------------------*
	 *  검색 영역 초기화
	 *------------------------------------------------------------------------------------------------*/
	initializeSearchData = () => {
		const initialSearchData = this.getInitialSearchData();
		const textFieldProps = { ...this.state.textFieldProps };
		textFieldProps.iptMenuKeyword.value = initialSearchData.keyword;

		this.setState({ 
			dsSearch: initialSearchData,
			textFieldProps 
		});
	}

	render() {
		return (
			<FullPanel>
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '71px 300px', alignItems: 'center'}}>
								<Label value="메뉴ID/명" />
								<Textfield {...this.state.textFieldProps.iptMenuKeyword} 
									onChange={this.event.input.onChange}
									onKeyPress={this.event.input.onKeyPress} />
							</div>
						</LFloatArea>
						<RFloatArea>
							<Button {...this.state.btnProps.btnSearch}/>
							<Button {...this.state.btnProps.btnReset}/>
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				<SubFullPanel>
					<ComponentPanel>
						<RelativeGroup>
							<LFloatArea>
								<h3>메뉴 목록</h3>
							</LFloatArea>
							<RFloatArea>
								<div className="component-with">
								<Button {...this.state.btnProps.btnAddRow} fiiled={true}/>
								<Button {...this.state.btnProps.btnDelRow} fiiled={true}/>
								</div>
							</RFloatArea>
						</RelativeGroup>
						<Grid
							{...this.state.grdProps.grdMenuList}
							data={this.state.dsMenuList}
							onGridReady={this.event.grid.onGridReady}
							addRowBtn={false} 
							delRowBtn={false}
							onRowClicked={this.event.grid.onRowClicked}
							onCellValueChanged={this.event.grid.onCellValueChanged}
						/>
					</ComponentPanel>
					<BottomPanel>
						<RelativeGroup>
							<RFloatArea>
								<Button {...this.state.btnProps.btnPreview} fiiled={true}/>
								<Button {...this.state.btnProps.btnSave} fiiled={true}/>
							</RFloatArea>
						</RelativeGroup>
					</BottomPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View; 