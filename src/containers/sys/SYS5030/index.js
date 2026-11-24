import React from 'react';

// 1. 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';
// 2. UI 컴포넌트
import { Grid, Label, RangeInputCalendar, Selectbox, Radio } from 'components';
// 3. 버튼 컴포넌트
import { BasicButton as Button } from 'components';
// 4. 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, DateLib, newScrmObj } from 'common';

/**
 * @class SYS5030
 * @classdesc 영업일관리
 * @author NEXSIS 개발팀
 */
class View extends React.Component {

	constructor(props) {
		super(props);

		// Grid API 참조
		this.gridApi = null;
		this.gridRef = null;
		this.columnApi = null;
		
		// 현재 선택 행 추적
		this.currentRow = '';
		
		// 강제 생성 플래그
		this.forceCreate = 'N';

		let year = new Date().getFullYear();
		const startDate = year + '0101';
		const endDate = year + '1231';
		
		this.state = {
			// 데이터셋 (필수)
			dsBizDayList: DataLib.datalist.getInstance({paging:{size:100}}),

			// 날짜 범위 Props
			rangeCalendarProps: {
				id: 'searchRangeCalender',
				startDate: startDate,
				endDate: endDate,
				strtId: 'searchRangeCalenderStart',
				endId: 'searchRangeCalenderEnd',
				label: '*조회일자',
			},
			
			radioProps: {
							rdoTypeFilter: {
								id: 'rdoTypeFilter',
								name: 'rdoTypeFilter',
								keyProp:"CODE",
								value:"NAME",
								dataset: [
									{CODE: 'ALL', NAME: '전체'},
									{CODE: 'NORMAL', NAME: '영업일'},
									{CODE: 'WEEKEND', NAME: '주말'},
									{CODE: 'HOLIDAY', NAME: '휴일'}
								],
								selected: 'ALL',
								readOnly : false,
								disabled : false,
							}
			},
			
			// Button Props 관리
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
				btnSave: {
					id: 'btnSave',
					disabled: false,
					value: '저장',
					hidden: false,
					color: 'purple',
					size: 'md',
					fiiled: true
				},
				btnCreate: {
					id: 'btnCreate',
					disabled: false,
					value: '영업일 생성',
					hidden: false,
					color: 'green',
					size: 'md',
					fiiled: true
				},
				btnValidate: {
					id: 'btnValidate',
					disabled: false,
					value: '유효성 검증',
					hidden: false,
					color: 'orange',
					size: 'md',
					fiiled: true
				}
			},
			
			// Grid Props 관리
			grdProps: {
				grdBizDayList: {
					id: 'grdBizDayList',
					areaName: '영업일 목록',
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: false,
					rowNum: true,
					infinite: true,
					height: '581px',
					rowSelection: 'multiple',
					suppressRowClickSelection: true, // 행 클릭 시 체크박스 선택 방지
					header: [
						{
							headerName: '',
							width: 10,
							textAlign: 'center',
							checkboxSelection: true,
							headerCheckboxSelection: true,
							editable: false
						},
						{
							headerName: '일자',
							field: 'saleDay',
							colId: 'saleDay',
							width: 120,
							editable: false,
							req: true,
							type: 'date',
							textAlign: 'center'
						},
						{
							headerName: '요일',
							field: 'wdaySeCd',
							colId: 'wdaySeCd',
							width: 80,
							editable: false,
							type: 'text',
							textAlign: 'center'
						},
						{
							headerName: '휴일구분',
							field: 'hldySeCd',
							colId: 'hldySeCd',
							width: 120,
							editable: true,
							req: true,
							// type: 'code',
							textAlign: 'center',
							cellEditor: 'agSelectCellEditor',
							cellEditorParams: { values: ['NORMAL', 'WEEKEND', 'HOLIDAY'] },
							valueFormatter: (param) => {
								switch(param.value) {
									case 'NORMAL': return '영업일';
									case 'WEEKEND': return '주말';
									case 'HOLIDAY': return '휴일';
									default: return param.value || '영업일';
								}
							}
						},
						{
							headerName: '휴일구분코드',
							field: 'hldySeCd',
							colId: 'hldySeCd',
							editable: true,
							hide: true
						},
						{
							headerName: '비고',
							field: 'rmrk',
							colId: 'rmrk',
							width: 200,
							editable: true,
							type: 'text'
						}
					],
					doFirst: false,
				}
			}
		};

		// 이벤트 바인딩 (필수)
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.rangeCalendar.onChange = this.event.rangeCalendar.onChange.bind(this);
		this.event.radio.onChange = this.event.radio.onChange.bind(this);
		this.onGridReady = this.onGridReady.bind(this);
		this.onRowClicked = this.onRowClicked.bind(this);
		this.onCellValueChanged = this.onCellValueChanged.bind(this);
	}

	/*------------------------------------------------------------------------------------------------*
	 * React 라이프 사이클
	 *------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		// 초기 데이터 로드
		if (this.validation('SYS5030R01')) {
			this.transaction('SYS5030R01');
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 * 초기화 메서드 (Main에서 호출)
	 *------------------------------------------------------------------------------------------------*/
	initialize = () => {
		console.log('SYS5030 initialize');
	};

	/*------------------------------------------------------------------------------------------------*
	 * Grid 이벤트 핸들러
	 *------------------------------------------------------------------------------------------------*/
	onGridReady(params) {
		this.gridApi = params.gridApi;
		this.columnApi = params.columnApi;
		this.gridRef = params.grid;
	}

	onRowClicked(params) {
		if (params.data) {
			this.currentRow = params.data.saleDay;
		}
	}

	onCellValueChanged(params) {
		const { row, col, newValue, oldValue } = params;
		const fieldName = col;

		if (newValue !== oldValue) {
			if (!fieldName) {
				console.error('컬럼 필드명(col)을 찾을 수 없습니다.');
				return;
			}
			
			// ★★★ 해결책: 원본 params.data 대신, 현재 상태의 데이터를 기준으로 삼습니다.
			const currentRecords = this.state.dsBizDayList.getRecords();

			// 1. 현재 상태 데이터를 기반으로 새로운 데이터 배열을 생성합니다.
			const newRecords = currentRecords.map((record, index) => {
				// 2. 변경이 발생한 행(row)을 찾습니다.
				if (index === row) {
					// 3. 해당 행의 복사본을 만들고 변경된 값을 적용합니다.
					const updatedRecord = {
						...record,
						[fieldName]: newValue,
						rowtype: (!record.rowtype || record.rowtype === 'r') ? 'u' : record.rowtype,
					};

					return updatedRecord;
				}
				// 변경되지 않은 행은 이전 상태 그대로 반환합니다.
				return record;
			});

			// 4. DataList 인스턴스에 완전히 새로운 배열을 설정합니다.
			this.state.dsBizDayList.setRecords(newRecords);

			// 5. 변경된 행의 노드를 가져와 체크박스를 선택 상태로 만듭니다.
			const node = this.gridApi.getDisplayedRowAtIndex(row);
			if (node) {
				node.setSelected(true);
			}


			// 7. '휴일구분'이 '영업일'로 변경된 경우, 연관 셀 표시를 갱신합니다.
			if (fieldName === 'bizDayYn' && newValue === 'Y') {
				// this.gridApi.refreshCells();
			}
			// 6. ★★★ 최종 해결책 ★★★
			// state 내부 데이터가 직접 수정되었으므로, forceUpdate()를 호출하여
			// React에게 강제로 리렌더링하도록 지시합니다.
			// this.forceUpdate(() => {
			// 	// 7. 리렌더링이 완료된 후, 그리드 셀의 표시를 갱신합니다.
			// 	if (fieldName === 'bizDayYn' && newValue === 'Y') {
			// 		this.gridApi.refreshCells();
			// 	}

			// 	// 8. ★★★ 추가된 로직 ★★★
			// 	// 변경된 행의 노드를 가져와 체크박스를 선택 상태로 만듭니다.
			// 	const node = this.gridApi.getDisplayedRowAtIndex(row);
			// 	if (node) {
			// 		node.setSelected(true);
			// 	}
			// });
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 * 유효성 검증
	 *------------------------------------------------------------------------------------------------*/
	validation = (transId) => {
		switch (transId) {
			case 'SYS5030R01': // 조회
				if (StrLib.isNull(this.state.rangeCalendarProps.startDate) || StrLib.isNull(this.state.rangeCalendarProps.endDate)) {
					ComLib.openDialog('A', 'SYSI0010', ['조회일자를 입력하세요.']);
					return false;
				}
				//this.state.dsBizDayList.setRecords([]);
				this.state.dsBizDayList.resetPage();
				//this.setState({ dsBizDayList: this.state.dsBizDayList });
				break;
				
			case 'SYS5030U01': // 저장
				// 변경된 데이터 존재 여부 확인
				const records = this.state.dsBizDayList.getRecords();
				// console.log('records', records);
				const changedRecords = records.filter(record => record.rowtype === 'u');
				
				if (changedRecords.length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['변경된 데이터가 없습니다.']);
					return false;
				}
				
				// 영업일여부 필수 검증
				for (let record of changedRecords) {
					if (StrLib.isNull(record.hldySeCd)) {
						ComLib.openDialog('A', 'SYSI0010', ['휴일구분은 필수 선택 항목입니다.']);
						return false;
					}
				}
				break;
				
			case 'SYS5030U02': // 영업일 생성
			case 'SYS5030U03': // 강제 영업일 생성
			case 'SYS5030V01': // 유효성 검증
				if (StrLib.isNull(this.state.rangeCalendarProps.startDate) || StrLib.isNull(this.state.rangeCalendarProps.endDate)) {
					ComLib.openDialog('A', 'SYSI0010', ['조회일자를 입력하세요.']);
					return false;
				}
				// 날짜 범위 검증 (최대 3년)
				const startDate = new Date(this.state.rangeCalendarProps.startDate);
				const endDate = new Date(this.state.rangeCalendarProps.endDate);
				const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
				
				if (yearsDiff > 3) {
					ComLib.openDialog('A', 'SYSI0010', ['영업일 생성 기간은 최대 3년까지 가능합니다.']);
					return false;
				}
				break;
			default:
				break;
		}
		return true;
	};

	/*------------------------------------------------------------------------------------------------*
	 * 서버 통신
	 *------------------------------------------------------------------------------------------------*/
	transaction = (transId) => {
		let transManager = new TransManager();
		
		let searchData = {};
		try {
			switch (transId) {
				case 'SYS5030R01': // 영업일 조회

					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/sale-day/r01");
					transManager.setCallBack(this.callback);
					
					// 검색 조건 데이터셋 구성 (camelCase 필수)
					searchData = {
						ognzCd: 'DEFAULT', // 기본 조직코드
						fromSaleDay: this.state.rangeCalendarProps.startDate,
						toSaleDay: this.state.rangeCalendarProps.endDate,
						hldySeCd: this.state.radioProps.rdoTypeFilter.selected !== 'ALL' ? this.state.radioProps.rdoTypeFilter.selected : null
					};
					
					transManager.setPaging(this.state.dsBizDayList.getPaging());
					transManager.setFormData(searchData);
					transManager.agent();
					break;

					
				case 'SYS5030U01': // 영업일 저장
					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/sale-day/u01");
					
					// 변경된 데이터만 전송
					const records = this.state.dsBizDayList.getRecords();
					const changedRecords = records.filter(record => record.rowtype === 'u');
					
					transManager.setFormData(changedRecords);
					transManager.setCallBack(this.callback);
					transManager.agent();
					break;
					
				case 'SYS5030U02': // 영업일 생성
					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/sale-day/u02");
					// 생성 조건 데이터셋 구성
					searchData = {
						ognzCd: 'DEFAULT', // 기본 조직코드
						fromSaleDay: this.state.rangeCalendarProps.startDate,
						toSaleDay: this.state.rangeCalendarProps.endDate,
						forceCreateYn: this.forceCreate || 'N' // 강제생성 플래그
					};
					transManager.setFormData(searchData);					
					transManager.setCallBack(this.callback);
					transManager.agent();
					break;
					
				case 'SYS5030U03': // 강제 영업일 생성
					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/sale-day/u02");
					// 강제 생성 조건 데이터셋 구성
					searchData = {
						ognzCd: 'DEFAULT', // 기본 조직코드
						fromSaleDay: this.state.rangeCalendarProps.startDate,
						toSaleDay: this.state.rangeCalendarProps.endDate,
						forceCreateYn: 'Y' // 강제생성
					};
					transManager.setFormData(searchData);					
					transManager.setCallBack(this.callback);
					transManager.agent();
					break;
					
				case 'SYS5030V01': // 영업일 유효성 검증
					transManager.setTransId(transId);
					transManager.setTransUrl("/api/cmm/sale-day/v01");
					// 검증 조건 데이터셋 구성
					searchData = {
						ognzCd: 'DEFAULT', // 기본 조직코드
						fromSaleDay: this.state.rangeCalendarProps.startDate,
						toSaleDay: this.state.rangeCalendarProps.endDate
					};
					transManager.setFormData(searchData);					
					transManager.setCallBack(this.callback);
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

	/*------------------------------------------------------------------------------------------------*
	 * 콜백 처리
	 *------------------------------------------------------------------------------------------------*/
	callback = (res) => {
		if (res.result) {
			switch (res.id) {
				case 'SYS5030R01': // 조회 결과
					console.log('SYS5030: 조회 결과 수신', {
						dataLength: res.data ? res.data.length : 0,
						currentRecordsLength: this.state.dsBizDayList.getRecords().length,
						isFirstPage: this.state.dsBizDayList.isFirstPage()
					});
					this.state.dsBizDayList.setRecords(res.data);
					console.log('SYS5030: setRecords 후', {
						recordsLength: this.state.dsBizDayList.getRecords().length
					});
					this.setState({
						dsBizDayList: this.state.dsBizDayList
					});
					console.log('SYS5030: setState 완료');
					break;
					
				case 'SYS5030U01': // 저장 결과
					ComLib.showSuccessMessage('저장되었습니다.');
					// 저장 후 재조회
					if (this.validation('SYS5030R01')) {
						this.transaction('SYS5030R01');
					}
					break;
				
				case 'SYS5030U02': // 영업일 생성 결과
					if(res.data && res.data.result) {
						// 생성 성공 - 재조회
						ComLib.openDialog('A', 'SYSI0010', [res.data.message || '영업일이 생성되었습니다.']);
						if (this.validation('SYS5030R01')) {
							this.transaction('SYS5030R01');
						}
					} else {
						// 중복 데이터 존재 - 강제 생성 확인
						const message = res.data && res.data.message ? res.data.message : '이미 존재하는 영업일이 있습니다.';
						ComLib.openConfirmDialog(message + '\n강제로 생성하시겠습니까?', (confirmed) => {
							if(confirmed) {
								this.forceCreate = 'Y';
								this.transaction('SYS5030U03'); // 강제 생성
							}
						});
					}
					break;
					
				case 'SYS5030U03': // 강제 영업일 생성 결과
					this.forceCreate = 'N'; // 플래그 초기화
					if(res.data && res.data.result) {
						ComLib.openDialog('A', 'SYSI0010', [res.data.message || '영업일이 강제 생성되었습니다.']);
						if (this.validation('SYS5030R01')) {
							this.transaction('SYS5030R01');
						}
					} else {
						ComLib.openDialog('A', 'SYSI0010', [res.data && res.data.message ? res.data.message : '영업일 생성에 실패했습니다.']);
					}
					break;
					
				case 'SYS5030V01': // 유효성 검증 결과
					if(res.data) {
						const validMessage = res.data.result ? '✓ 유효성 검증 통과' : '✗ 유효성 검증 실패';
						ComLib.openDialog('A', 'SYSI0010', [validMessage + '\n\n' + (res.data.message || '')]);
					}
					break;
				default:
					break;
			}
		} else {
			// 오류 메시지 표시
			ComLib.openDialog('A', 'SYSI0010', [res.message || '처리 중 오류가 발생했습니다.']);
		}
	};

	/*------------------------------------------------------------------------------------------------*
	 * 유틸리티 함수
	 *------------------------------------------------------------------------------------------------*/
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

	/*------------------------------------------------------------------------------------------------*
	 * 이벤트 핸들러
	 *------------------------------------------------------------------------------------------------*/
	event = {
		button: {
			onClick: (e) => {
				let btnId = e.target.id;
				
				switch (btnId) {
					case 'btnSearch':
						if (this.validation('SYS5030R01')) {
							this.transaction('SYS5030R01');
						}
						break;
					case 'btnCreate':
						if (this.validation('SYS5030U02')) {
							const startDate = this.state.rangeCalendarProps.startDate;
							const endDate = this.state.rangeCalendarProps.endDate;
							
							const confirmMessage = `다음 조건으로 영업일을 생성하시겠습니까?\n\n` +
								`조직: DEFAULT\n` +
								`기간: ${startDate} ~ ${endDate}`;
								
							ComLib.openConfirmDialog(confirmMessage, (confirmed) => {
								if(confirmed) {
									this.forceCreate = 'N'; // 일반 생성
									this.transaction('SYS5030U02');
								}
							});
						}
						break;
					case 'btnValidate':
						if (this.validation('SYS5030V01')) {
							this.transaction('SYS5030V01');
						}
						break;
					case 'btnSave':
						if (this.validation('SYS5030U01')) {
							const confirmMessage = `변경된 정보를 저장하시겠습니까?`;
							ComLib.openConfirmDialog(confirmMessage, (confirmed) => {
								if(confirmed) {
									this.transaction('SYS5030U01');
								}
							});							
						}
						break;
						
					default:
						break;
				}
			}
		},
		
		rangeCalendar: {
			onChange: (e) => {
				this.setState({
					...this.state,
					rangeCalendarProps: {
						...this.state.rangeCalendarProps
						, startDate : e.startDate, endDate : e.endDate
					}
				});
			}
		},

		radio: {
			onChange: (e) => {
				const { id, value } = e;
				this.setState(prevState => ({
					...prevState,
					radioProps: {
						...prevState.radioProps,
						[id]: {
							...prevState.radioProps[id],
							selected: value
						}
					}
				}));
			}
		},
		grid: {
			onScrollEnd: (e) => {
				if(this.state.dsBizDayList.isLastPage()) {
					console.log('마지막 페이지입니다.');
					return;
				}
				this.state.dsBizDayList.nextPage();
				this.transaction("SYS5030R01");
			}
		}
	};

	/*------------------------------------------------------------------------------------------------*
	 * 렌더링
	 *------------------------------------------------------------------------------------------------*/
	render() {
		return (
			<FullPanel>
				{/* 검색 영역 */}
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea>
							<FlexPanel>
								<Label value="*조회일자" />
								<RangeInputCalendar {...this.state.rangeCalendarProps} onChange={this.event.rangeCalendar.onChange} />
								<Label value="휴일구분" />
								<Radio {...this.state.radioProps.rdoTypeFilter} onChange={this.event.radio.onChange} />
							</FlexPanel>
						</LFloatArea>
						<RFloatArea>
							{/* <Button {...this.state.btnProps.btnValidate} onClick={this.event.button.onClick} /> */}
							<Button {...this.state.btnProps.btnCreate} onClick={this.event.button.onClick} />
							<Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				
				{/* 메인 컨텐츠 */}
				<SubFullPanel>
					<ComponentPanel>
						<RelativeGroup>
                            <LFloatArea>
                                <div className="scrm-component-panel-namearea">
                                    <span>영업일 목록</span>
                                </div>
                            </LFloatArea>
                        </RelativeGroup>
						<Grid
							{...this.state.grdProps.grdBizDayList}
							data={this.state.dsBizDayList}
							onGridReady={this.onGridReady}
							onRowClicked={this.onRowClicked}
							onCellValueChanged={this.onCellValueChanged}
							onScrollEnd={this.event.grid.onScrollEnd}
							totalRowCnt={this.state.dsBizDayList.getTotalRowCnt()}
						/>
					</ComponentPanel>
					<ComponentPanel>
						{/* 액션 버튼 영역 */}
						<RelativeGroup>
							<RFloatArea>
								<Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
							</RFloatArea>
						</RelativeGroup>
					</ComponentPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View;
