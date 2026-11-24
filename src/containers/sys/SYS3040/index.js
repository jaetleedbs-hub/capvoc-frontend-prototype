import React from 'react';

// 1. 레이아웃 컴포넌트
import { ComponentPanel, FullPanel, SubFullPanel, SearchPanel, BottomPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';

// 2. UI 컴포넌트
import { Grid, Label, Textfield } from 'components';
import { BasicButton as Button } from 'components';

// 3. 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

/**
 * @name SYS3040
 * @author NEXSIS
 * @since 2025-07-02
 * @description 프로그램관리
 */
class View extends React.Component {
	constructor(props) {
		super(props);

		// Grida API
		this.gridApi = null;
		this.columnApi = null;

		// 현재 행
		this.currentRow = '';

		this.state = {
			// data
			dsSearch: DataLib.datalist.getInstance(),
			dsMenuList: DataLib.datalist.getInstance(),

			// prop
			textFieldProps: {
				iptPrgrmKeyword: {
					id: 'iptPrgrmKeyword',
					value: '',
					placeholder: '프로그램ID 또는 프로그램명',
					width: 200,
				},
			},
			btnProps: {
				btnSearch: {
					id: 'btnSearch',
					value: '조회',
					color: 'blue',
					fiiled: true,
					className: 'icon-srch',
					onClick: this.event.button.onClick
				},
				btnReset: {
					id: 'btnReset',
					disabled: false,
					value: '',
					hidden: false,
					color: 'grey',
					className: 'icon-reset',
					type: 'icon',
					onClick: this.event.button.onClick
				},
				btnSave: {
					id: 'btnSave',
					value: '저장',
					hidden: false,
					color: 'blue',
					size: 'md',
					fiiled: true,
					className: 'icon-act',
					onClick: this.event.button.onClick
				},
				btnAddRow: {
					id: 'btnAddRow',
					value: '행추가',
					hidden: false,
					color: 'grey',
					size: 'md',
					fiiled: false,
					className: 'icon-plus',
					onClick: this.event.button.onClick
				},
				btnDelRow: {
					id: 'btnDelRow',
					value: '행삭제',
					hidden: false,
					color: 'grey',
					size: 'md',
					fiiled: false,
					className: 'icon-minus',
					onClick: this.event.button.onClick
				}
			},
			grdProps: {
				grdMenuList: {
					id: 'grdMenuList',
					areaName: '프로그램 목록',
					height: 'calc(100vh - 372px)',
					rowNum: true,
					header: [
					{ 
						headerName: '프로그램ID', 
						field: 'prgrmId', 
						colId: 'prgrmId', 
						width: 270, 
						editable: (params) => params.data.rowtype === 'c', 
						req: true, 
						type: 'code',
						cellStyle: { textAlign: 'left' }
					},
					{ 
						headerName: '프로그램명', 
						field: 'prgrmNm', 
						colId: 'prgrmNm', 
						width: 250, 
						editable: true, 
						req: true,
						cellStyle: { textAlign: 'left' }
					},
					{ 
						headerName: '공통프로그램 여부', 
						field: 'httpMethod', 
						colId: 'httpMethod', 
						width: 100, 
						editable: true,
						cellStyle: { textAlign: 'center' }, editable: true, 
						cellEditor: 'agSelectCellEditor',
						cellEditorParams: { values: ['','common'] },
						valueFormatter: (param) => {
							if (param.value === 'common') return '공통프로그램';
							return '';
						},
					},
					// { 
					// 	headerName: 'URL 주소 패턴', 
					// 	field: 'urlAddrPtrn', 
					// 	colId: 'urlAddrPtrn', 
					// 	width: 250, 
					// 	editable: true,
					// 	cellStyle: { textAlign: 'left' }
					// }, //아마 ----------------- 주석 처리 될 예정?
					// { 
					// 	headerName: '정렬순서', 
					// 	field: 'sortSn', 
					// 	colId: 'sortSn', 
					// 	width: 100, 
					// 	editable: true,
					// 	cellStyle: { textAlign: 'right' }
					// },
					{ 
						headerName: '등록자', 
						field: 'rgtrId', 
						colId: 'rgtrId', 
						width: 80,
						cellStyle: { textAlign: 'center' }
					},
					{ 
						headerName: '등록일시', 
						field: 'regDt', 
						colId: 'regDt', 
						width: 140,
						cellStyle: { textAlign: 'center' }
					},
					{ 
						headerName: '수정자', 
						field: 'mdfrId', 
						colId: 'mdfrId', 
						width: 80,
						cellStyle: { textAlign: 'center' }
					},
					{ 
						headerName: '수정일시', 
						field: 'mdfcnDt', 
						colId: 'mdfcnDt', 
						width: 140,
						cellStyle: { textAlign: 'center' }
					},
					],
					rowSelection: 'multiple',
					onGridReady: this.event.grid.onGridReady,
					onCellValueChanged: this.event.grid.onCellValueChanged,
				}
			},
			deletedPrgrmIds: [] // 🗑️ 삭제할 프로그램 ID 목록
		}

		// 이벤트 바인딩
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.input.onKeyPress = this.event.input.onKeyPress.bind(this);
		this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
	}

	/*------------------------------------------------------------------------------------------------*
	 *  LifeCycle Event
	 *------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		if (this.validation('SYS3040R01')) {
			this.transaction('SYS3040R01');
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 *  폐쇄 메서드
	 *------------------------------------------------------------------------------------------------*/
	validation = (transId) => {
		switch (transId) {
			case 'SYS3040R01':
				break;
			case 'SYS3040U01':
				const modifiedRows = this.state.dsMenuList.getRecords().filter(row => row.rowtype !== 'R');

				for (const row of modifiedRows) {
					if (StrLib.isNull(row.prgrmId)) {
						ComLib.openDialog('A', 'SYSI0010', ['프로그램ID는 필수 입력 항목입니다.']);
						return false;
					}
					if (StrLib.isNull(row.prgrmNm)) {
						ComLib.openDialog('A', 'SYSI0010', ['프로그램명은 필수 입력 항목입니다.']);
						return false;
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
			case 'SYS3040R01':
				transManager.setTransUrl('/api/cmm/prgrm/r01');
				transManager.addConfig({
					datasetrecv: 'dsMenuList',
					datasetsend: 'dsSearch'
				});

				let searchData = {
					prgrmIdOrNm: this.state.textFieldProps.iptPrgrmKeyword.value || '',
				};

				transManager.setFormData(searchData)
				transManager.agent();
				break;

			case 'SYS3040U01':
				transManager.setTransUrl('/api/cmm/prgrm/u01');
				transManager.addConfig({
					datasetrecv: 'dsResult',
					datasetsend: 'dsMenuList'
				});

				// 🔄 변경된 데이터만 필터링 (신규/수정/삭제된 행만 전송)
				const allRows = this.state.dsMenuList.getRecords();
				const modifiedRows = allRows.filter(row => row.rowtype !== 'R');
				
				// 📊 백엔드로 전송되는 데이터 로그 확인
				console.log('💾 전체 프로그램 데이터:', allRows);
				console.log('🔄 각 행의 rowtype 상태:', allRows.map(item => ({ 
					prgrmId: item.prgrmId, 
					prgrmNm: item.prgrmNm, 
					rowtype: item.rowtype 
				})));
				console.log('🔄 변경된 데이터만 전송:', modifiedRows);
				console.log('🔍 변경된 프로그램 구분 값들:', modifiedRows.map(item => ({ 
					prgrmId: item.prgrmId, 
					prgrmNm: item.prgrmNm, 
					sortSn: item.sortSn,
					rowtype: item.rowtype
				})));

				if (modifiedRows.length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
					return;
				}

				transManager.setFormData(modifiedRows);
				ComLib.openDialog('C', 'SYSI0010', ['저장 하시겠습니까?'], checked => { 
					if( checked){
						transManager.agent();
					}
				});
				break;

			case 'SYS3040D01':
				transManager.setTransUrl('/api/cmm/prgrm/d01');
				transManager.addConfig({
					datasetrecv: 'dsResult',
					datasetsend: 'dsMenuList'
				});
				// 삭제할 프로그램 ID만 전송
				const prgrmIdsToDelete = deletePayload || this.state.deletedPrgrmIds.map(prgrmId => ({ prgrmId }));
				if (prgrmIdsToDelete.length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['삭제할 데이터가 없습니다.']);
					return;
				}
				transManager.setFormData(prgrmIdsToDelete);
				transManager.agent();
				break;

			default: break;
		}
	}

	callback = (res) => {
		switch (res.id) {
			case 'SYS3040R01':
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

			case 'SYS3040U01':
				ComLib.openDialog('A', 'SYSI0010', ['저장이 완료되었습니다.']);
				this.setState({ deletedPrgrmIds: [] }); // 저장 완료 후 삭제 목록 초기화
				if (this.validation('SYS3040R01')) {
					this.transaction('SYS3040R01');
				}
				break;

			case 'SYS3040D01':
				ComLib.openDialog('A', 'SYSI0010', ['삭제가 완료되었습니다.']);
				this.setState({ deletedPrgrmIds: [] }); // 삭제 완료 후 삭제 목록 초기화
				if (this.validation('SYS3040R01')) {
					this.transaction('SYS3040R01');
				}
				break;

			default: break;
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
						if (this.validation('SYS3040R01')) {
							this.transaction('SYS3040R01');
						}
						break;
					case 'btnReset':
						// 검색 조건 초기화
						this.setState({
							...this.state,
							textFieldProps: {
								...this.state.textFieldProps,
								iptPrgrmKeyword: {
									...this.state.textFieldProps.iptPrgrmKeyword,
									value: ''
								}
							}
						}, () => {
							// 초기화 후 조회 실행
							if (this.validation('SYS3040R01')) {
								this.transaction('SYS3040R01');
							}
						});
						break;
					case 'btnSave': {
						const allRows = this.state.dsMenuList.getRecords();
						const modifiedRows = allRows.filter(row => row.rowtype === 'C' || row.rowtype === 'U');
						const hasModifiedData = modifiedRows.length > 0;
						const hasDeletedData = this.state.deletedPrgrmIds.length > 0;
						if (!hasModifiedData && !hasDeletedData) {
							ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
							return;
						}
						if (hasModifiedData) {
							if (this.validation('SYS3040U01')) {
								this.transaction('SYS3040U01');
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
							sortSn: 0,    // 기본값 설정
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
						const selectedPrgrmIds = selectedRows.map(row => row.prgrmId);
						const currentData = this.state.dsMenuList.getRecords();

						// 1. prgrmId가 없는(신규, 미입력) 행은 바로 삭제
						const prgrmIdsToCheck = selectedPrgrmIds.filter(id => !!id && id.trim() !== '');

						// 2. 프로그램 삭제 확인 (prgrmId가 있는 행만)
						if (prgrmIdsToCheck.length > 0) {
							const confirmDelete = window.confirm('선택한 프로그램을 삭제하시겠습니까?');
							if (!confirmDelete) {
								return;
							}
						}

						// 3. deletedPrgrmIds에 추가 (prgrmId가 있는 행만)
						const newDeletedPrgrmIds = Array.from(new Set([
							...this.state.deletedPrgrmIds,
							...prgrmIdsToCheck
						]));

						// 4. dsMenuList에서 해당 prgrmId를 가진 row를 제거
						const updatedRecords = currentData.filter(row => !selectedPrgrmIds.includes(row.prgrmId));
						const updatedMenuList = DataLib.datalist.getInstance();
						updatedMenuList.setRecords(updatedRecords);
						this.setState({
							dsMenuList: updatedMenuList,
							deletedPrgrmIds: newDeletedPrgrmIds
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

				this.setState({ textFieldProps });
			},
			onKeyPress: (e) => {
				// 엔터키(Enter) 입력 시 조회 실행
				if (e.key === 'Enter') {
					if (this.validation('SYS3040R01')) {
						this.transaction('SYS3040R01');
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
					const currentData = this.state.dsMenuList.getRecords();
					const changedRowIndex = Number(e.index);
			
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

			// 삭제 처리 메서드
	processDelete = () => {
		if (this.state.deletedPrgrmIds.length === 0) {
			console.log('🗑️ 삭제할 데이터가 없습니다.');
			return;
		}
		const prgrmIdsToDelete = this.state.deletedPrgrmIds.map(prgrmId => ({ prgrmId }));
		console.log('🗑️ 삭제 처리 시작:', prgrmIdsToDelete);
		this.transaction('SYS3040D01', prgrmIdsToDelete);
	}

	render() {
		return (
			<FullPanel>
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '92px 200px', alignItems: 'center'}}>
								<Label value="프로그램ID/명" />
								<Textfield {...this.state.textFieldProps.iptPrgrmKeyword} onChange={this.event.input.onChange} onKeyPress={this.event.input.onKeyPress} />
							</div>
						</LFloatArea>
						<RFloatArea>
							<Button {...this.state.btnProps.btnSearch} />
							<Button {...this.state.btnProps.btnReset} />
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				<SubFullPanel>
					<ComponentPanel>
						<RelativeGroup>
							<LFloatArea>
								<h3>프로그램 목록</h3>
							</LFloatArea>
							<RFloatArea>
								<Button {...this.state.btnProps.btnAddRow} />
								<Button {...this.state.btnProps.btnDelRow} />
							</RFloatArea>
						</RelativeGroup>
						<Grid
							{...this.state.grdProps.grdMenuList}
							data={this.state.dsMenuList}
							onGridReady={this.event.grid.onGridReady}
							addRowBtn={false} 
							delRowBtn={false}
							onCellValueChanged={this.event.grid.onCellValueChanged}
						/>						
					</ComponentPanel>
					<BottomPanel>
						<RelativeGroup>
							<RFloatArea>
								<Button {...this.state.btnProps.btnSave} />
							</RFloatArea>
						</RelativeGroup>
					</BottomPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View; 