import React from 'react';

// 1. 레이아웃 컴포넌트
import { ComponentPanel, FullPanel, SubFullPanel, BottomPanel, SearchPanel, LFloatArea, RFloatArea, RelativeGroup } from 'components';
// 2. UI 컴포넌트
import { Grid, Label, Textfield, Selectbox, Textarea, Table } from 'components';
// 3. 버튼 컴포넌트
import { BasicButton as Button } from 'components';
// 4. 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

/**
 * @class SYS5010
 * @classdesc 기준정보관리
 * @author 개발팀
 */
class View extends React.Component {
	constructor() {
		super();

		// Grid API
		this.gridApi = null;
		this.gridDetailApi = null;
		
		this.currentRow = '';

		this.state = {
			// data
			dsList: DataLib.datalist.getInstance(),
			dsDetail: DataLib.datalist.getInstance(),
			dsSearch: DataLib.datalist.getInstance(),
			
			// search
			textFieldProps: {
				iptSearch: {
					id: 'iptSearch',
					name: 'iptSearch',
					value: '',
					placeholder: '기준 정보명 또는 코드로 검색',
					onKeyPress: this.event.input.onKeyPress,
				},
			},
			selectboxProps: {
				selSysCrtrType: {
					id: 'selSysCrtrType',
					name: 'selSysCrtrType',
					value: '', // 전체 선택을 위한 빈 값
					dataset: ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD'), newScrmObj.constants.select.argument.all),
				},
				selUseYn: {
					id: 'selUseYn',
					name: 'selUseYn',
					value: 'Y', // 사용 여부 기본값 'Y'로 설정
					dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.all),
				},
			},
			// button
			btnProps: {
				btnSearch: {
					id: 'btnSearch',
					disabled: false,
					value: '조회',
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
				btnNew: {
					id: 'btnNew',
					value: '신규',
					hidden: false,
					color: 'grey',
					size: 'md',
					fiiled: false,
					className: 'icon-plus'
				},
				btnSave: {
					id: 'btnSave',
					value: '저장',
					hidden: false,
					color: 'blue',
					size: 'md',
					fiiled: true,
					className: 'icon-act'
				},
				btnDelete: {
					id: 'btnDelete',
					value: '삭제',
					hidden: false,
					color: 'grey',
					size: 'md',
					fiiled: false,
					className: 'icon-del'
				}
			},
			// grid
			grdProps: {
				grdList: {
					id: 'grdList',
					areaName: '기준 정보 목록',
					addRowBtn: false,
					delRowBtn: false,
					dnlExcelBtn: true,
					header: [
						{ headerName: '기준유형', field: 'sysCrtrTypeCd', colId: 'sysCrtrTypeCd', width: 120, editable: false,
						  valueFormatter: (param) => {
							  const codeName = ComLib.getComCodeName('SYS_CRTR_TYPE_CD', param.value);
							  console.log('ValueFormatter - SYS_CRTR_TYPE:', param.value, 'Name:', codeName);
							  return codeName;
						  } },
						{ headerName: '기준코드', field: 'sysCrtrCd', colId: 'sysCrtrCd', width: 120, editable: false, req: true, 
						  cellStyle: { textAlign: 'center' } },
						{ headerName: '기준명', field: 'sysCrtrCdNm', colId: 'sysCrtrCdNm', width: 200, editable: false, req: true },
						{ headerName: '기준값', field: 'sysCrtrCdVl', colId: 'sysCrtrCdVl', width: 120, editable: false },
						{ 
							headerName: '사용여부', field: 'useYn', colId: 'useYn', width: 100, editable: false, req: true,
							cellEditor: 'agSelectCellEditor',
							cellEditorParams: { values: ComLib.getComCodeValue('USE_YN') },
							valueFormatter: (param) => {
								const codeName = ComLib.getComCodeName('USE_YN', param.value);
								console.log('ValueFormatter - USE_YN:', param.value, 'Name:', codeName);
								return codeName;
							}
						},
						{ headerName: '비고', field: 'rmrkCn', colId: 'rmrkCn', width: 250, editable: false },
					],
					rowSelection: 'single',
					height: 'calc(100vh - 600px)',
				},
			},
			// detail form
			detailProps: {
				selDetailSysCrtrTypeCd: {
					id: 'selDetailSysCrtrTypeCd',
					name: 'selDetailSysCrtrTypeCd',
					value: 'SYS', // 신규 등록 시 빈 값
					label: '기준유형',
					req: true,
					dataset: ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD')),
				},
				iptCrtrId: {
					id: 'iptCrtrId',
					name: 'iptCrtrId',
					value: '',
					label: '기준코드',
					// disabled: true,
					onBlur: this.event.input.onBlur,
				},
				iptSysCrtrCdNm: {
					id: 'iptSysCrtrCdNm',
					name: 'iptSysCrtrCdNm',
					value: '',
					label: '기준명',
					req: true
				},
				iptSysCrtrCdVl: {
					id: 'iptSysCrtrCdVl',
					name: 'iptSysCrtrCdVl',
					value: '',
					label: '기준값'
				},
				selDetailUseYn: {
					id: 'selDetailUseYn',
					name: 'selDetailUseYn',
					value: 'Y', // 사용여부 기본값 'Y'로 설정
					label: '사용여부',
					req: true,
					dataset: ComLib.convComboList(ComLib.getCommCodeList('USE_YN')),
				},
				txaRmrkCn: {
					id: 'txaRmrkCn',
					name: 'txaRmrkCn',
					value: '',
					label: '비고'
				}
			}
		};

		// 이벤트 바인딩
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.input.onKeyPress = this.event.input.onKeyPress.bind(this);
		this.event.input.onBlur = this.event.input.onBlur.bind(this);
		this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
		this.onGridReady = this.onGridReady.bind(this);
		this.onRowClicked = this.onRowClicked.bind(this);

	}

	/*------------------------------------------------------------------------------------------------*
	 * React 라이프 사이클
	 *------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		// 디버깅: 공통코드 확인
		console.log('=== SYS5010 디버깅 시작 ===');
		console.log('sessionStorage gdsCommCode:', sessionStorage.getItem('gdsCommCode'));
		
		// 공통코드 로딩 확인 및 재로딩
		this.ensureCommCodeLoaded();
		
		// 공통코드 로딩 후 dataset 업데이트
		this.updateCommCodeDatasets();
		
		const sysCrtrTypeList = ComLib.getCommCodeList('SYS_CRTR_TYPE_CD');
		console.log('SYS_CRTR_TYPE_CD 코드 목록:', sysCrtrTypeList);
		
		const useYnList = ComLib.getCommCodeList('USE_YN');
		console.log('USE_YN 코드 목록:', useYnList);
		
		// 테스트: 특정 값으로 코드명 조회 테스트
		console.log('SYS_CRTR_TYPE_CD 테스트 - 값 "01"의 이름:', ComLib.getComCodeName('SYS_CRTR_TYPE_CD', '01'));
		console.log('USE_YN 테스트 - 값 "Y"의 이름:', ComLib.getComCodeName('USE_YN', 'Y'));
		
		if (this.validation('SYS5010R01')) {
			this.transaction('SYS5010R01');
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 * 공통코드 로딩 확인
	 *------------------------------------------------------------------------------------------------*/
	ensureCommCodeLoaded = () => {
		// 공통코드가 로딩되지 않은 경우 재로딩
		const commCodeList = ComLib.getCommCodeList('SYS_CRTR_TYPE_CD');
		if (!commCodeList || commCodeList.length === 0) {
			console.log('공통코드가 로딩되지 않았습니다. 재로딩을 시도합니다.');
			// 공통코드 재로딩 로직이 있다면 여기서 호출
			// ComLib.reloadCommCode();
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 * 공통코드 dataset 업데이트
	 *------------------------------------------------------------------------------------------------*/
	updateCommCodeDatasets = () => {
		// 검색 조건의 dataset 업데이트
		const searchSysCrtrTypeDataset = ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD'), newScrmObj.constants.select.argument.all);
		const searchUseYnDataset = ComLib.convComboList(ComLib.getCommCodeList('USE_YN'), newScrmObj.constants.select.argument.all);
		
		// 상세 폼의 dataset 업데이트
		const detailSysCrtrTypeDataset = ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD'));
		const detailUseYnDataset = ComLib.convComboList(ComLib.getCommCodeList('USE_YN'));
		
		console.log('검색 조건 기준유형 dataset:', searchSysCrtrTypeDataset);
		console.log('상세 폼 기준유형 dataset:', detailSysCrtrTypeDataset);
		
		this.setState({
			...this.state,
			selectboxProps: {
				...this.state.selectboxProps,
				selSysCrtrType: {
					...this.state.selectboxProps.selSysCrtrType,
					dataset: searchSysCrtrTypeDataset
				},
				selUseYn: {
					...this.state.selectboxProps.selUseYn,
					dataset: searchUseYnDataset
				}
			},
			detailProps: {
				...this.state.detailProps,
				selDetailSysCrtrTypeCd: {
					...this.state.detailProps.selDetailSysCrtrTypeCd,
					dataset: detailSysCrtrTypeDataset
				},
				selDetailUseYn: {
					...this.state.detailProps.selDetailUseYn,
					dataset: detailUseYnDataset
				}
			}
		});
	}

	/*------------------------------------------------------------------------------------------------*
	 * Grid 이벤트
	 *------------------------------------------------------------------------------------------------*/
	onGridReady(params) {
		this.gridApi = params.api;
		this.columnApi = params.columnApi;
	}

	onRowClicked(params) {
		// 현재 기준코드 필드에 포커스가 있는 경우 중복 검증 방지
		const activeElement = document.activeElement;
		if (activeElement && activeElement.id === 'iptCrtrId') {
			// 기준코드 필드에서 포커스 해제
			activeElement.blur();
		}
		
		this.currentRow = params.data.sysCrtrCd;
		if (this.validation('SYS5010R02')) {
			this.transaction('SYS5010R02', params.data);
		}
	}

	/*------------------------------------------------------------------------------------------------*
	 * 데이터 처리
	 *------------------------------------------------------------------------------------------------*/
	validation = (transId) => {
		switch (transId) {
			case 'SYS5010R01':
				break;
			case 'SYS5010R02':
				break;
			case 'SYS5010U01':
				if (StrLib.isNull(this.state.detailProps.iptSysCrtrCdNm.value)) {
					ComLib.openDialog('A', 'SYSI0010', ['기준명은 필수 입력 항목입니다.']);
					return false;
				}
				if (StrLib.isNull(this.state.detailProps.selDetailSysCrtrTypeCd.value)) {
					ComLib.openDialog('A', 'SYSI0010', ['기준유형은 필수 선택 항목입니다.']);
					return false;
				}
				break;
			case 'SYS5010D01':
				if (StrLib.isNull(this.state.detailProps.iptCrtrId.value)) {
					ComLib.openDialog('A', 'SYSI0010', ['삭제할 데이터를 선택해주세요.']);
					return false;
				}
				break;
			default:
				break;
		}
		return true;
	}

	transaction = (transId, data) => {
		let transManager = new TransManager();
		transManager.setTransId(transId);
		// transManager.setTransUrl("r01");
		transManager.setCallBack(this.callback);

		try {
			switch (transId) {
				case 'SYS5010R01':
					transManager.setTransUrl("/api/cmm/sys-crtr/r01");
					transManager.addConfig({
						datasetrecv: 'dsList',
					});
					
					let searchData = {
						sysCrtrTypeCd: this.state.selectboxProps.selSysCrtrType.value,
						sysCrtrCdOrNm: this.state.textFieldProps.iptSearch.value,
						useYn: this.state.selectboxProps.selUseYn.value
					};
					transManager.setFormData(searchData);

					// this.state.dsSearch.setRecords([searchData]);
					// transManager.addDataset('dsSearch', this.state.dsSearch.getRecords());
					
					transManager.agent();
					break;

				case 'SYS5010R02':
					this.state.dsDetail.setRecords([data]);
					
					// 공통코드 dataset 재확인
					const detailSysCrtrTypeDataset = ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD'));
					const detailUseYnDataset = ComLib.convComboList(ComLib.getCommCodeList('USE_YN'));
					
					console.log('상세 폼 업데이트 - 기준유형 값:', data.sysCrtrTypeCd);
					console.log('상세 폼 기준유형 dataset:', detailSysCrtrTypeDataset);
					
					this.setState({
						...this.state,
						detailProps: {
							...this.state.detailProps,
							selDetailSysCrtrTypeCd: { 
								...this.state.detailProps.selDetailSysCrtrTypeCd, 
								value: data.sysCrtrTypeCd,
								dataset: detailSysCrtrTypeDataset
							},
							iptCrtrId: { ...this.state.detailProps.iptCrtrId, value: data.sysCrtrCd, disabled: true },
							iptSysCrtrCdNm: { ...this.state.detailProps.iptSysCrtrCdNm, value: data.sysCrtrCdNm },
							iptSysCrtrCdVl: { ...this.state.detailProps.iptSysCrtrCdVl, value: data.sysCrtrCdVl },
							selDetailUseYn: { 
								...this.state.detailProps.selDetailUseYn, 
								value: data.useYn,
								dataset: detailUseYnDataset
							},
							txaRmrkCn: { ...this.state.detailProps.txaRmrkCn, value: data.rmrkCn },
						}
					});
					break;

				case 'SYS5010U01':
					transManager.setTransUrl("/api/cmm/sys-crtr/u01");
					transManager.addConfig({
						datasetrecv: 'dsSaveResult'
					});
					let detailData = {
						sysCrtrTypeCd: this.state.detailProps.selDetailSysCrtrTypeCd.value,
						sysCrtrCd: this.state.detailProps.iptCrtrId.value,
						sysCrtrCdNm: this.state.detailProps.iptSysCrtrCdNm.value,
						sysCrtrCdVl: this.state.detailProps.iptSysCrtrCdVl.value,
						useYn: this.state.detailProps.selDetailUseYn.value,
						rmrkCn: this.state.detailProps.txaRmrkCn.value
					};
					transManager.setFormData(detailData);
					// this.state.dsDetail.setRecords([detailData]);
					// transManager.addDataset('dsDetail', this.state.dsDetail.getRecords());
					transManager.agent();
					break;

				case 'SYS5010D01':
					transManager.setTransUrl("/api/cmm/sys-crtr/d01");
					transManager.addConfig({
						datasetrecv: 'dsDeleteResult'
					});
					let deleteData = {
						sysCrtrCd: this.state.detailProps.iptCrtrId.value
					};
					transManager.setFormData(deleteData);
					// this.state.dsDetail.setRecords([deleteData]);
					// transManager.addDataset('dsDetail', this.state.dsDetail.getRecords());
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
		console.log('res:',res);

		if (res.result === 'success') {
			switch (res.id) {
				case 'SYS5010R01':
					console.log('SYS5010R01 데이터 수신:', res.data);
					if (res.data && res.data) {
						console.log('그리드 데이터 샘플:', res.data.slice(0, 3));
						this.state.dsList.setRecords(res.data);
					} else {
						this.state.dsList.setRecords([]);
					}
					
					this.setState({ ...this.state }, () => {
						if (this.gridApi) {
							let rowNum = this.rowFinder(this.state.dsList.getRecords(), 'sysCrtrCd', this.currentRow);
							this.gridApi.setFocusedCell(rowNum, 'sysCrtrCd');
						}
					});
					this.clearDetailForm();
					break;
				case 'SYS5010U01':
					ComLib.openDialog('A', 'SYSI0010', ['저장되었습니다.']);
					this.transaction('SYS5010R01');
					break;
				case 'SYS5010D01':
					ComLib.openDialog('A', 'SYSI0010', ['삭제되었습니다.']);
					this.transaction('SYS5010R01');
					break;
				default:
					break;
			}
		} else {
			if (res.data && res.data.message) {
				ComLib.openDialog('A', '오류', [res.data.message]);
			} else {
				ComLib.openDialog('A', '오류', ['알 수 없는 오류가 발생했습니다.']);
			}
		}
	}
	
	/*------------------------------------------------------------------------------------------------*
	 * 사용자 정의 함수
	 *------------------------------------------------------------------------------------------------*/
	clearDetailForm = () => {
		this.currentRow = '';
		
		// 공통코드 dataset 재확인
		const detailSysCrtrTypeDataset = ComLib.convComboList(ComLib.getCommCodeList('SYS_CRTR_TYPE_CD'));
		const detailUseYnDataset = ComLib.convComboList(ComLib.getCommCodeList('USE_YN'));
		
		this.setState({
			...this.state,
			detailProps: {
				...this.state.detailProps,
				selDetailSysCrtrTypeCd: { 
					...this.state.detailProps.selDetailSysCrtrTypeCd, 
					value: 'SYS', // 기준유형 기본값 'SYS'로 설정
					dataset: detailSysCrtrTypeDataset
				},
				iptCrtrId: { ...this.state.detailProps.iptCrtrId, value: '', disabled: false },
				iptSysCrtrCdNm: { ...this.state.detailProps.iptSysCrtrCdNm, value: '' },
				iptSysCrtrCdVl: { ...this.state.detailProps.iptSysCrtrCdVl, value: '' },
				selDetailUseYn: { 
					...this.state.detailProps.selDetailUseYn, 
					value: 'Y',
					dataset: detailUseYnDataset
				},
				txaRmrkCn: { ...this.state.detailProps.txaRmrkCn, value: '' },
			}
		});
	}

	rowFinder = (targetRecords, targetColumn, currentRow) => {
		let rowNum = 0;
		if (!targetRecords || StrLib.isNull(currentRow)) return rowNum;
		for (let i = 0; i < targetRecords.length; i++) {
			if (targetRecords[i][targetColumn] === currentRow) {
				rowNum = i;
				break;
			}
		}
		return rowNum;
	};

	/**
	 * 기준코드 중복 검증
	 * @param {string} code - 검증할 기준코드
	 */
	checkDuplicateCode = (code) => {
		const currentRecords = this.state.dsList.getRecords();
		
		// 수정 모드인지 확인 (disabled가 true이면 수정 모드)
		const isEditMode = this.state.detailProps.iptCrtrId.disabled;
		const originalCode = this.currentRow; // 현재 선택된 행의 원본 기준코드
		
		// 현재 입력된 기준코드와 동일한 코드가 있는지 확인
		const duplicateRecord = currentRecords.find(record => {
			// 수정 모드인 경우 현재 선택된 행의 기준코드는 제외
			if (isEditMode && record.sysCrtrCd === originalCode) {
				return false;
			}
			return record.sysCrtrCd === code;
		});
		
		if (duplicateRecord) {
			ComLib.openDialog('A', 'SYSI0010', [`이미 존재하는 기준코드입니다. (${code})`]);
			
			// 기준코드 필드에 포커스 다시 설정
			setTimeout(() => {
				const inputElement = document.getElementById('iptCrtrId');
				if (inputElement) {
					inputElement.focus();
					inputElement.select();
				}
			}, 100);
		}
	};

	/**
	 * 포커스 이동 시 중복 검증 제어
	 * @param {Event} e - blur 이벤트 객체
	 */
	handleBlurValidation = (e) => {
		const { id, value } = e.target;
		
		// 기준코드 필드에서만 중복 검증 수행
		if (id === 'iptCrtrId' && value && !this.state.detailProps.iptCrtrId.disabled) {
			// 다음에 포커스될 요소 확인
			const nextElement = e.relatedTarget;
			
			// 그리드 행을 클릭하는 경우 중복 검증 건너뛰기
			if (nextElement && (
				nextElement.closest('.ag-row') || // ag-Grid 행
				nextElement.closest('.ag-cell') || // ag-Grid 셀
				nextElement.closest('.ag-header') || // ag-Grid 헤더
				nextElement.closest('.ag-paging') || // ag-Grid 페이징
				nextElement.closest('.ag-tool-panel') // ag-Grid 도구 패널
			)) {
				console.log('그리드 영역으로 포커스 이동 - 중복 검증 건너뛰기');
				return;
			}
			
			// 버튼 클릭하는 경우 중복 검증 건너뛰기
			if (nextElement && (
				nextElement.tagName === 'BUTTON' ||
				nextElement.closest('button')
			)) {
				console.log('버튼 클릭 - 중복 검증 건너뛰기');
				return;
			}
			
			// 일반적인 필드 이동인 경우에만 중복 검증 수행
			this.checkDuplicateCode(value);
		}
	};

	/*------------------------------------------------------------------------------------------------*
	 * 이벤트 핸들러
	 *------------------------------------------------------------------------------------------------*/
	event = {
		button: {
			onClick: (e) => {
				// 버튼 클릭 시 현재 기준코드 필드에서 포커스 해제
				const activeElement = document.activeElement;
				if (activeElement && activeElement.id === 'iptCrtrId') {
					activeElement.blur();
				}
				
				switch (e.target.id) {
					case 'btnSearch':
						if (this.validation('SYS5010R01')) this.transaction('SYS5010R01');
						break;
					case 'btnNew':
						this.clearDetailForm();
						break;
					case 'btnSave':
						if (this.validation('SYS5010U01')) this.transaction('SYS5010U01');
						break;
					case 'btnDelete':
						if (this.validation('SYS5010D01')) {
							ComLib.openDialog('C', 'SYSI0010', ['선택된 기준정보를 삭제하시겠습니까?'], (checked) => {
								if (checked === true) {
									this.transaction('SYS5010D01');
								}
							});
						}
						break;
					default:
						break;
				}
			},
		},
		input: {
			onChange: (e) => {
				const { id, value } = e.target;
				this.setState({ ...this.state,
					detailProps: {
						...this.state.detailProps,
						[id]: {
							...this.state.detailProps[id],
							value: value,
						}
					}
				});
			},
			onKeyPress: (e) => {
				if (e.key === 'Enter') {
					if (this.validation('SYS5010R01')) {
						this.transaction('SYS5010R01');
					}
				}
			},
			onBlur: (e) => {
				this.handleBlurValidation(e);
			},
		},
		selectbox: {
			onChange: (e) => {
				const { id, value } = e.target;
				if (id === 'selUseYn' || id === 'selSysCrtrType') {
					this.setState({ ...this.state, selectboxProps: { ...this.state.selectboxProps, [id]: { ...this.state.selectboxProps[id], value: value } }});
				} else {
					this.setState({ ...this.state, detailProps: { ...this.state.detailProps, [id]: { ...this.state.detailProps[id], value: value } } });
				}
			},
		},
	};

	render() {
		return (
			<FullPanel>
				<SearchPanel>
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '66px 120px 95px 250px 84px 120px', alignItems: 'center'}}>
								<Label value="기준유형" />
								<Selectbox
									id={this.state.selectboxProps.selSysCrtrType.id}
									name={this.state.selectboxProps.selSysCrtrType.name}
									value={this.state.selectboxProps.selSysCrtrType.value}
									dataset={this.state.selectboxProps.selSysCrtrType.dataset}
									onChange={this.event.selectbox.onChange}
								/>
								<Label value="기준코드/명" />
								<Textfield
									id={this.state.textFieldProps.iptSearch.id}
									name={this.state.textFieldProps.iptSearch.name}
									value={this.state.textFieldProps.iptSearch.value}
									placeholder={this.state.textFieldProps.iptSearch.placeholder}
									onChange={(e) => this.setState({ ...this.state, textFieldProps: { ...this.state.textFieldProps, iptSearch: { ...this.state.textFieldProps.iptSearch, value: e.target.value } } })}
									onKeyPress={this.state.textFieldProps.iptSearch.onKeyPress}
								/>
								<Label value="사용여부" />
								<Selectbox
									id={this.state.selectboxProps.selUseYn.id}
									name={this.state.selectboxProps.selUseYn.name}
									value={this.state.selectboxProps.selUseYn.value}
									dataset={this.state.selectboxProps.selUseYn.dataset}
									onChange={this.event.selectbox.onChange}
								/>
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
								<h3>기준정보목록</h3>
							</LFloatArea>
						</RelativeGroup>
						<Grid
							{...this.state.grdProps.grdList}
							data={this.state.dsList}
							onGridReady={this.onGridReady}
							onRowClicked={this.onRowClicked}
						/>
					</ComponentPanel>
				</SubFullPanel>
				<SubFullPanel>
					<ComponentPanel>
						<RelativeGroup>
							<LFloatArea>
								<h3>기준 정보 상세</h3>
							</LFloatArea>
						</RelativeGroup>
						<Table
							colGrp={[
								{ width: '8%' }, { width: '25%' },
								{ width: '8%' }, { width: '25%' },
								{ width: '8%' }, { width: '25%' }
							]}
							tbData={[
								[
									{ type: 'T', value: this.state.detailProps.selDetailSysCrtrTypeCd.label, className: this.state.detailProps.selDetailSysCrtrTypeCd.req ? 'req' : '' },
									{ type: 'D', value: (
										<Selectbox
										{...this.state.detailProps.selDetailSysCrtrTypeCd}
										onChange={this.event.selectbox.onChange}
										/>
									)},
									{ type: 'T', value: this.state.detailProps.iptCrtrId.label, className: this.state.detailProps.iptCrtrId.req ? 'req' : '' },
									{ type: 'D', value: (
										<Textfield
										{...this.state.detailProps.iptCrtrId}
										onChange={this.event.input.onChange}
										onBlur={this.event.input.onBlur}
										/>
									)},
									{ type: 'T', value: this.state.detailProps.iptSysCrtrCdNm.label, className: this.state.detailProps.iptSysCrtrCdNm.req ? 'req' : '' },
									{ type: 'D', value: (
										<Textfield
										{...this.state.detailProps.iptSysCrtrCdNm}
										onChange={this.event.input.onChange}
										/>
									)}
								],
								[
									{ type: 'T', value: this.state.detailProps.selDetailUseYn.label, className: this.state.detailProps.selDetailUseYn.req ? 'req' : '' },
									{ type: 'D', value: (
										<Selectbox
										{...this.state.detailProps.selDetailUseYn}
										onChange={this.event.selectbox.onChange}
										/>
									)},
									{ type: 'T', value: this.state.detailProps.iptSysCrtrCdVl.label, className: this.state.detailProps.iptSysCrtrCdVl.req ? 'req' : '' },
									{ type: 'D', colSpan: 3, value: (
										<Textfield
										{...this.state.detailProps.iptSysCrtrCdVl}
										onChange={this.event.input.onChange}
										/>										
									)}
								],
								[
									{ type: 'T', value: this.state.detailProps.txaRmrkCn.label, className: this.state.detailProps.txaRmrkCn.req ? 'req' : '' },
									{ type: 'D', colSpan: 5, value: (
										<Textarea
										{...this.state.detailProps.txaRmrkCn}
										onChange={this.event.input.onChange}
										/>
									)}
								]
							]}
						/>
					</ComponentPanel>
					<BottomPanel>
						<RelativeGroup>
							<RFloatArea>
								<Button {...this.state.btnProps.btnNew} onClick={this.event.button.onClick} />
								<Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
								<Button {...this.state.btnProps.btnDelete} onClick={this.event.button.onClick} />
							</RFloatArea>
						</RelativeGroup>
					</BottomPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View;
