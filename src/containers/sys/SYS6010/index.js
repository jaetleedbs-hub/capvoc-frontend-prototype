/**
 * SYS6010 사용자로그인이력-일별
 * 
 * 시스템 사용자의 일별 로그인 이력을 조회하고 관리하는 화면
 * - 검색 조건에 따른 일별 사용자 로그인 이력 조회
 * - 엑셀 다운로드 기능
 * - 조회기간 제한 (최대 31일)
 */

import React from 'react';
import { 
	FullPanel, SubFullPanel, SearchPanel, ComponentPanel, 
	FlexPanel, LFloatArea, RFloatArea, RelativeGroup,
	Grid, BasicButton as Button, Selectbox, Label,
	Textfield, RangeInputCalendar, OgnzSelect, UserSelect
} from 'components';
import { ComLib, DataLib, TransManager, StrLib, DateLib } from 'common';
import { formatDateToDisplay, formatDateToStorage } from '../../../utils/dateUtils';

/**
 * @class View
 * @description SYS6010 사용자로그인이력-일별
 * @version 1.0
 * @author 개발팀
 */
class View extends React.Component {
	constructor(props) {
		super(props);

		// Grid API 참조 변수 (필수)
		this.gridApi = null;
		this.columnApi = null;
		this.currentRow = '';

		this.state = {
			// 데이터셋 (표준 패턴)
			dsDailyLoginHistList: DataLib.datalist.getInstance({paging:{size:100}}),
			dsSearch: DataLib.datalist.getInstance(),
			
			// 버튼 Props (색상 가이드라인 준수)
			btnProps: this.getInitialButtonProps(),

			// 그리드 Props (화면정의서 기준)
			grdProps: {
				grdDailyLoginHistList: {
					id: 'grdDailyLoginHistList',
					areaName: '일별 사용자 로그인 이력 목록',
					infinite: true,
					height: 'calc(100vh - 367px)',
					rowSelection: 'single',
					suppressRowClickSelection: false,
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: false,
					rowNum: true,
					header: [
						{ headerName: '로그인일자', field: 'lgnYmd', colId: 'lgnYmd', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '조직', field: 'ognzNm', colId: 'ognzNm', width: 150, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '사용자ID', field: 'userId', colId: 'userId', width: 120, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '사용자명', field: 'userNm', colId: 'userNm', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '최초 로그인', field: 'lgnDt', colId: 'lgnDt', width: 150, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '최종 로그아웃', field: 'lgtDt', colId: 'lgtDt', width: 150, cellStyle: () => ({ textAlign: 'center' }) },
						{ headerName: '로그인 횟수', field: 'lgnCnt', colId: 'lgnCnt', width: 100, cellStyle: () => ({ textAlign: 'center' }) }
					],
				}
			},

			// 검색 조건 Props
			userSelectProps: this.getInitialUserSelectProps(),
			ognzSelectProps: this.getInitialOgnzSelectProps(),
			textFieldProps: this.getInitialTextFieldProps(),
			calendarProps: this.getInitialCalendarProps()
		};

		// 이벤트 바인딩 (필수)
		this.bindEvents();
	}

	// 🔧 초기 버튼 Props 생성
	getInitialButtonProps = () => ({
		btnSearch: {
			id: 'btnSearch',
			value: '조회',
			color: 'blue',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false,
			className: 'icon-srch',
			onClick: this.event.button.onClick
		},
		btnReset: {
			id: 'btnReset',
			value: '',
			color: 'grey',
			className: 'icon-reset',
			type: 'icon',
			disabled: false,
			hidden: false,
			onClick: this.event.button.onClick
		},
		btnExcel: {
			id: 'btnExcel',
			value: '엑셀',
			color: 'grey',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false,
			className: 'icon-excel',
			onClick: this.event.button.onClick
		}
	});

	// 🔧 초기 사용자 선택 Props
	getInitialUserSelectProps = () => ({
		id: 'iptUserIdSearch',
		userId: '',
		userNm: '',
		keyword: ''
	});

	// 🔧 초기 조직 선택 Props
	getInitialOgnzSelectProps = () => ({
		id: 'iptOgnzNmSearch',
		ognzCd: '',
		ognzNm: '',
		keyword: ''
	});

	// 🔧 초기 TextField Props
	getInitialTextFieldProps = () => ({
		iptSearchKeyword: {
			id: 'iptSearchKeyword',
			value: '',
			placeholder: '입력항목',
			maxLength: 50,
			type: 'text',
			width: 120,
			readOnly: false,
			disabled: false
		}
	});

	// 🔧 초기 Calendar Props
	getInitialCalendarProps = () => ({
		rangeCalFromtoLgnDttm: {
			id: 'rngFromtoLgnDttm',
			strtId: 'fromLgnDttm',
			endId: 'toLgnDttm'
		}
	});

	// 🔧 이벤트 바인딩
	bindEvents = () => {
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
		this.event.grid.onRowClicked = this.event.grid.onRowClicked.bind(this);
		this.event.grid.onScrollEnd = this.event.grid.onScrollEnd.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.userSelect.onChange = this.event.userSelect.onChange.bind(this);
		this.event.ognzSelect.onChange = this.event.ognzSelect.onChange.bind(this);
	};

	componentDidMount() {
		// 기본 최근 1개월 날짜 설정
		this.setUpDateRange();
	}

	setUpDateRange = () => {
		const today = DateLib.getToday();
		const startDate = DateLib.getAddMonth(today, -1);

		this.setState({
			calendarProps: {
				...this.state.calendarProps,
				rangeCalFromtoLgnDttm: { ...this.state.calendarProps.rangeCalFromtoLgnDttm, strtId: startDate, endId: today }
			}
		});

		ComLib.updateStateObject(this, 'dsSearch', {	
			fromLgnDttm: startDate,
			toLgnDttm: today
		});
	}

	// 🔧 유효성 검증
	validation = (transId) => {
		const { dsSearch } = this.state;

		const startDate = dsSearch.fromLgnDttm;
		const endDate = dsSearch.toLgnDttm;
		const today = DateLib.getToday();

		switch (transId) {
			case 'SYS6010R01':
				// 날짜 범위 검증
				if (StrLib.isNull(startDate) || StrLib.isNull(endDate)) {
					ComLib.openDialog("A", "SYSI0010", [
					  "조회할 실행 기간을 선택하세요.",
					]);
					return false;
				  }

				if (startDate > endDate) {
						ComLib.openDialog('A', 'SYSI0010', ['시작일이 종료일보다 늦을 수 없습니다.']);
						return false;
					}

				if (endDate > today) {
						ComLib.openDialog('A', 'SYSI0010', ['종료일이 현재보다 빠를 수 없습니다.']);
						return false;
					}

					// 1개월 범위 제한 검증
					const diffDays = DateLib.getDiffDate(startDate, endDate);
					if (diffDays > 31) {
					  ComLib.openAlertDialog("조회 기간은 최대 1개월까지 가능합니다.");
					  return false;
					}
				
				this.state.dsDailyLoginHistList.resetPage();
				break;

			case 'SYS6010E01':
				// 조회된 데이터 존재 여부 확인
				const { dsDailyLoginHistList } = this.state;
				if (!dsDailyLoginHistList.getRecords() || dsDailyLoginHistList.getRecords().length === 0) {
					ComLib.openDialog('A', 'SYSI0010', ['다운로드할 데이터가 없습니다. 먼저 조회를 실행해주세요.']);
					return false;
				}
				break;

			default:
				break;
		}

		return true;
	};
	
	// 🔧 서버 통신
	transaction = (transId) => {
		let transManager = new TransManager();
		transManager.setTransId(transId);

		switch (transId) {
			case 'SYS6010R01':
				this.executeSearch(transManager);
				break;

			case 'SYS6010E01':
				this.executeExcelDownload(transManager);
				break;

			default:
				break;
		}
	};

	// 🔧 검색 실행
	executeSearch = (transManager) => {
		transManager.setTransUrl('/api/log/user-login/r01');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsSearch',
			datasetrecv: 'dsDailyLoginHistList'
		});
		
		const searchData = {
			userId: this.state.userSelectProps.userId || '',
			startDate: formatDateToStorage(this.state.dsSearch.fromLgnDttm) || '',
			endDate: formatDateToStorage(this.state.dsSearch.toLgnDttm) || '',
			ognzCd: this.state.ognzSelectProps.ognzCd || '',
		};
		
		transManager.setPaging(this.state.dsDailyLoginHistList.getPaging());
		transManager.setFormData(searchData);
		transManager.agent();
	};

	// 🔧 엑셀 다운로드 실행
	executeExcelDownload = () => {
		this.downloadCSV();
	};

	// 🔧 CSV 다운로드 (클라이언트 사이드)
	downloadCSV = async() => {
		try {
			const records = await this.state.dsDailyLoginHistList.getRecords();
		
			if (!records || records.length === 0) {
				ComLib.openDialog('A', 'SYSI0010', ['다운로드할 데이터가 없습니다.']);
				return;
			}

			// CSV 헤더
			const headers = this.state.grdProps.grdDailyLoginHistList.header.map(header => 
				header.headerName);
			headers.unshift('No');
	
					// CSV 데이터 생성
		const csvData = records.map((item, index) => [
			index + 1, // No
			item.lgnYmd || '', // 로그인일자
			item.ognzNm || '', // 조직
			item.userId || '', // 사용자ID
			item.userNm || '', // 사용자명
			item.lgnDt || '', // 최초 로그인 (백엔드에서 문자열로 변환됨)
			item.lgtDt || '', // 최종 로그아웃 (백엔드에서 문자열로 변환됨)
			item.lgnCnt || '' // 로그인 횟수
		]);
	
			// CSV 문자열 생성
			const csvContent = [
				headers.join(','),
				...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
			].join('\n');
	
			// BOM 추가 (한글 깨짐 방지)
			const BOM = '\uFEFF';
			const csvWithBOM = BOM + csvContent;
	
			// 파일 다운로드
			const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `사용자로그인이력_${new Date().toISOString().slice(0, 10)}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
	
			ComLib.openDialog('A', 'SYSI0010', ['CSV 파일이 다운로드되었습니다.']);
		} catch (error) {
			ComLib.openDialog('A', 'SYSI0010', ['엑셀 다운로드 중 오류가 발생했습니다.']);
		}
	};

	// 🔧 콜백 처리
	callback = (res) => {
		let errorMessage = '처리 중 오류가 발생했습니다.';

		if (!res.result || res.data.error) {
			if (res.data.message || res.message) {
				errorMessage = res.data.message || res.message;
			}
			ComLib.openDialog('A', 'SYSI0010', [errorMessage]);
			return;
		}

		switch (res.id) {
				case 'SYS6010R01':
					this.handleSearchResult(res);
					break;

			default:
				break;
		}
	};

	// 🔧 검색 결과 처리
	handleSearchResult = (res) => {
		if (res.result) {
			// 행 번호 추가
			const formattedData = res.data.content.map((item, index) => ({
				...item,
				rowNum: index + 1,
				lgnYmd: item.lgnYmd ? StrLib.setFormatData(item.lgnYmd, '-') : '',
				ognzNm: item.ognzNm || '',
				userId: item.userId || '',
				userNm: item.userNm || '',
				lgnDt: item.lgnDt ? StrLib.setFormatData(item.lgnDt, '-') : '',
				lgtDt: item.lgtDt ? StrLib.setFormatData(item.lgtDt, '-') : '',
				lgnCnt: item.lgnCnt || ''
			}));
			
			// formattedData를 res.data.content에 적용
			const updatedResData = {
				...res.data,
				content: formattedData
			};
			
			ComLib.setStateRecords(this, "dsDailyLoginHistList", updatedResData);
		}
	};

	// 🔧 이벤트 핸들러
	event = {
		button: {
			onClick: (e) => {
				const { id } = e.target;
				switch (id) {
					case 'btnSearch':
						if (this.validation('SYS6010R01')) {
							this.transaction('SYS6010R01');
						} else {
						}
						break;
					case 'btnExcel':
						if (this.validation('SYS6010E01')) {
							this.transaction('SYS6010E01');
						}
						break;
					default:
						break;
				}
			}
		},
		grid: {
			onGridReady: (params) => {
				this.gridApi = params.api;
				this.columnApi = params.columnApi;
			},
			onRowClicked: (params) => {
				this.currentRow = params.data;
			},
			onScrollEnd: () => {
				if(this.state.dsDailyLoginHistList.isLastPage()) {
					return;
				}
				
				this.state.dsDailyLoginHistList.nextPage();
				this.transaction("SYS6010R01");
			}
		},
		input: {
			onChange: (e) => {
				const { id, value } = e.target;
				const { textFieldProps } = this.state;
				
				// TextField Props 업데이트
				if (textFieldProps[id]) {
					this.setState({
						textFieldProps: {
							...textFieldProps,
							[id]: {
								...textFieldProps[id],
								value: value
							}
						}
					});
				}

				// 검색 데이터 업데이트
				const { dsSearch } = this.state;
				const searchData = dsSearch.getRecords()[0] || {};
				searchData[id.replace('ipt', '').toLowerCase()] = value;
				dsSearch.setRecords([searchData]);
			}
		},
		userSelect: {	
			onChange: (userData) => {
				this.setState({
					...this.state,
					userSelectProps: {
						...this.state.userSelectProps,
						userId: userData.userId || '',
						userNm: userData.userNm || '',
						keyword: userData.userId || userData.userNm || ''
					}
				});
			}
		},
		ognzSelect: {
			onChange: (ognzData) => {
				this.setState({
					...this.state,
					ognzSelectProps: {
						...this.state.ognzSelectProps,
						ognzCd: ognzData.ognzCd || '',
						ognzNm: ognzData.ognzNm || '',
						keyword: ognzData.ognzCd || ognzData.ognzNm || ''
					}
				});
			}
		}
	};

	render() {
		const { 
			btnProps, 
			grdProps, 
			textFieldProps, 
			userSelectProps,
			ognzSelectProps,
			calendarProps,
			dsDailyLoginHistList 
		} = this.state;

		return (
			<FullPanel>
				{/* 검색 영역 */}
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '75px 268px 62px 1fr 73px 1fr', alignItems: 'center'}}>
								<Label value="로그인일자" />
								<RangeInputCalendar 
									{...calendarProps.rangeCalFromtoLgnDttm}
									startDate={this.state.dsSearch.fromLgnDttm}
									endDate={this.state.dsSearch.toLgnDttm}
									onChange={ComLib.handleRangeCalendarChange(this, 'dsSearch', "fromLgnDttm", "toLgnDttm")}
									onKeyPress={ComLib.handleEnterKey(this.event.button.onClick)}
								/>
								<Label value="조직" />
								<OgnzSelect
									id={ognzSelectProps.id}
									ognzCd={ognzSelectProps.ognzCd}
									ognzNm={ognzSelectProps.ognzNm}
									keyword={ognzSelectProps.keyword}
									disabled={false}
									onChange={this.event.ognzSelect.onChange}
								/>
								<Label value="사용자" />
								<UserSelect
									id={userSelectProps.id}
									userId={userSelectProps.userId}
									userNm={userSelectProps.userNm}
									keyword={userSelectProps.keyword}
									disabled={false}
									onChange={this.event.userSelect.onChange}
								/>
							</div>
						</LFloatArea>
						<RFloatArea>
							<Button {...btnProps.btnSearch} />
							<Button {...btnProps.btnReset} />
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>
				
				{/* 메인 컨텐츠 */}
				<SubFullPanel>
					<ComponentPanel>
						<RelativeGroup>
							<LFloatArea>
								<h3>로그인이력목록</h3>
							</LFloatArea>
							<RFloatArea>
								<Button {...btnProps.btnExcel} />
							</RFloatArea>
						</RelativeGroup>
						<Grid
							{...grdProps.grdDailyLoginHistList}
							data={this.state.dsDailyLoginHistList}
							onGridReady={this.event.grid.onGridReady}
							onRowClicked={this.event.grid.onRowClicked}
							onScrollEnd={this.event.grid.onScrollEnd}
							totalRowCnt={this.state.dsDailyLoginHistList.getTotalRowCnt()}
						/>
					</ComponentPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View; 