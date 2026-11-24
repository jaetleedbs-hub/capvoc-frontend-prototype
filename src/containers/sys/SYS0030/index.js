import React from 'react';

// Layout Components
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, SearchPanel, LFloatArea, RFloatArea, RelativeGroup, BottomPanel } from 'components';
// UI Components
import { Grid, Label, Textfield, Selectbox, InputCalendar, UserSelect, OgnzSelect, Table } from 'components';
import { BasicButton as Button } from 'components';
// Common Libraries
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';
import { formatDateToDisplay, formatDateToStorage, getCurrentDateDisplay } from '../../../utils/dateUtils';
import './UserManagement.css';

/**
 * @class View
 * @description SYS0030 사용자관리
 * @version 1.0
 * @author NEXSIS 개발팀
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
			dsUserList: DataLib.datalist.getInstance(),
			dsUserDetail: DataLib.datalist.getInstance(),
			dsSearch: DataLib.datalist.getInstance(),
			dsOgnzList: DataLib.datalist.getInstance(),
			dsAuthrtList: DataLib.datalist.getInstance(),
			dsUserTypeList: DataLib.datalist.getInstance(),
			dsCtiUseYnList: DataLib.datalist.getInstance(),
			dsUseYnList: DataLib.datalist.getInstance(),
			dsWorkTypeList: DataLib.datalist.getInstance(),
			
			authrtList: [],
			userDetailForm:{},

			// 버튼 Props (색상 가이드라인 준수)
			btnProps: this.getInitialButtonProps(),

			// 그리드 Props (화면정의서 기준)
			grdProps: {
				grdUserList: this.getGridProps()
			},

			// 검색 조건 Props
			userSelectProps: this.getInitialUserSelectProps(),
			ognzSelectProps: this.getInitialOgnzSelectProps(),
			selectboxProps: this.getInitialSelectboxProps(),
			textFieldProps: this.getInitialTextFieldProps(),
			calendarProps: this.getInitialCalendarProps(),

			// 읽기 전용 정보
			readOnlyInfo: {
				lgnYn: '',
				lgnIp: '',
				lgnTryCnt: '',
				pswdChgDt: '',
			},

			// 사진 정보
			userPhotoProps: {
				userPhoto: '',
			},

			// 이미지 미리보기
			profileImagePreview: null
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
			fiiled: true,		
			disabled: false,
			hidden: false,
			className : 'icon-srch'
		},
		btnReset: {
			id: 'btnReset',
			value: '',
			color: 'grey',
			className : 'icon-reset',
			type: 'icon'
		},
		btnSave: {
			id: 'btnSave',
			value: '저장',
			color: 'blue',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false,
			className : 'icon-act'
		},
		btnNew: {
			id: 'btnNew',
			value: '신규',
			color: 'grey',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false,
			className : 'icon-add'
		},
		btnLoginReset: {
			id: 'btnLoginReset',
			value: '로그인초기화',
			color: 'grey',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false
		},
		btnPasswordReset: {
			id: 'btnPasswordReset',
			value: '비밀번호초기화',
			color: 'grey',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false
		},
		// btnIpManage: {
		// 	id: 'btnIpManage',
		// 	value: 'IP관리',
		// 	color: 'grey',
		// 	size: 'md',
		// 	fiiled: true,
		// 	disabled: false,
		// 	hidden: false
		// },
		btnOrgzSearch: {
			title: '조직조회',
			id: 'btnOrgzSearch',
			value: '',
			icon: 'srch',
			innerImage: true,
			color: 'purple',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false
		},
		btnOrgzReset: {
			title: '초기화',
			id: 'btnOrgzReset',
			value: '',
			icon: 'del',
			innerImage: true,
			color: 'purple',
			size: 'md',
			fiiled: true,
			disabled: false,
			hidden: false
		}
	});

	// 🔧 그리드 Props 생성
	getGridProps = () => ({
		id: 'grdUserList',
		areaName: '사용자목록',
		height: 'calc(100vh - 626px)',
		header: [
			{ headerName: '사용자ID', field: 'userId', colId: 'userId', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '사용자명', field: 'userNm', colId: 'userNm', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '소속부서', field: 'ognzNm', colId: 'ognzNm', width: 120, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '사용자등급', field: 'authrtNm', colId: 'authrtNm', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '로그인여부', field: 'lgnYn', colId: 'lgnYn', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '로그인IP', field: 'lgnIp', colId: 'lgnIp', width: 120, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '근태상태', field: 'wrkStatNm', colId: 'wrkStatNm', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '입사일자', field: 'jncmpYmd', colId: 'jncmpYmd', width: 100, cellStyle: () => ({ textAlign: 'center' }) },
			{ headerName: '퇴사일자', field: 'rsgntnYmd', colId: 'rsgntnYmd', width: 100, cellStyle: () => ({ textAlign: 'center' }) }
		],
		rowSelection: 'single',
		addRowBtn: false,
		delRowBtn: false,
		rowNum: true
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

	// 🔧 초기 Selectbox Props
	getInitialSelectboxProps = () => ({
		// 상단 검색 필터
		selAuthrtNmSearch: {
			id: 'selAuthrtNmSearch',
			value: 'ALL',
			width: '100%',
			disabled: false,
			label: '사용자등급',
			dataset: [{value: 'ALL', name: '전체'}], 
		},
		selCtiUseYnSearch: {
			id: 'selCtiUseYnSearch',
			value: 'ALL',
			dataset: [{ value: 'ALL', name: '전체' }],
			width: '100%',
			disabled: false
		},
		selUseYnSearch: {
			id: 'selUseYnSearch',
			value: 'ALL',
			dataset: [{ value: 'ALL', name: '전체' }],
			width: '100%',
			disabled: false
		},
		// 상세 정보 selectbox들
		selAuthrtNm: { id: 'selAuthrtNm', value: '', dataset: [], width: '100%', disabled: false },
		selCtiUseYn: { id: 'selCtiUseYn', value: 'Y', dataset: [], width: '100%', disabled: false },
		selUseYn: { id: 'selUseYn', value: 'Y', dataset: [], width: '100%', disabled: false },
		selUserTypeNm: { id: 'selUserTypeNm', value: '', dataset: [], width: '100%', disabled: true },
		selCtiAutoLgnYn: { id: 'selCtiAutoLgnYn', value: 'N', dataset: [], width: '100%', disabled: false },
		selDscsnTaskSeCd: { id: 'selDscsnTaskSeCd', value: '', dataset: [], width: '100%', disabled: false },
		selCallbakTaskUseYn: { id: 'selCallbakTaskUseYn', value: 'N', dataset: [], width: '100%', disabled: false },
		selWorkTm: { id: 'selWorkTm', value: '', dataset: [], width: '100%', disabled: false }
	});

	// 🔧 초기 TextField Props
	getInitialTextFieldProps = () => ({
		iptOgnzNm: { id: 'iptOgnzNm', value: '', placeholder: '', maxLength: 100, readOnly: false, disabled: false },
		userIdSearch: { id: 'userIdSearch', value: '', placeholder: '사용자코드', maxLength: 50, readOnly: false, disabled: false },
		iptUserId: { id: 'iptUserId', value: '', placeholder: '사용자ID 또는 사용자명', keyword: '', maxLength: 50, readOnly: false, disabled: false },
		iptUserNm: { id: 'iptUserNm', value: '', placeholder: '', maxLength: 30, readOnly: false, disabled: false },
		iptOrgNm: { id: 'iptOrgNm', ognzCd: '', ognzNm: '', keyword: '', placeholder: '' },
		iptHomeTelNo: { id: 'iptHomeTelNo', value: '', placeholder: '', maxLength: 15, readOnly: false, disabled: false },
		iptMblTelNo: { id: 'iptMblTelNo', value: '', placeholder: '', maxLength: 15, readOnly: false, disabled: false },
		iptEmlAddr: { id: 'iptEmlAddr', value: '', placeholder: '', maxLength: 100, readOnly: false, disabled: false },
		iptCtiId: { id: 'iptCtiId', value: '', placeholder: '', maxLength: 20, readOnly: false, disabled: false },
		iptWorkTm: { id: 'iptWorkTm', value: '', placeholder: '', maxLength: 10, readOnly: false, disabled: false },
		iptEmpNo: { id: 'iptEmpNo', value: '', placeholder: '', maxLength: 32, readOnly: false, disabled: false },
		iptExtNo: { id: 'iptExtNo', value: '', placeholder: '', maxLength: 20, readOnly: false, disabled: false }
	});

	// 🔧 초기 Calendar Props
	getInitialCalendarProps = () => ({
		jncmpYmd: {
			id: 'jncmpYmd',
			value: getCurrentDateDisplay(),
			disabled: false,
			onChange: this.event.input.onChange
		},
		rsgntnYmd: {
			id: 'rsgntnYmd',
			value: null,
			disabled: false,
			onChange: this.event.input.onChange
		}
	});

	// 🔧 이벤트 바인딩
	bindEvents = () => {
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
		this.event.grid.onRowClicked = this.event.grid.onRowClicked.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
		this.event.userSelect.onChange = this.event.userSelect.onChange.bind(this);
		this.event.ognzSelect.onChange = this.event.ognzSelect.onChange.bind(this);
		this.event.detailOgnzSelect.onChange = this.event.detailOgnzSelect.onChange.bind(this);
		this.handleImageSelect = this.handleImageSelect.bind(this);
	};

	componentDidMount() {
		// 초기 데이터 로드
		// if (this.validation("SYS0030R01")) {
		// 	this.transaction("SYS0030R01");
		// }

		if(this.validation("INITIAL_DATA")) {
			this.transaction("INITIAL_DATA");
		}
	}

	// 🔧 필드 유효성 검증
	validationField = (transId) => {
		const { userDetailForm } = this.state;
		
		// 필수 필드 검증
		const requiredFields = [
			{ field: 'userId', message: '사용자ID는 필수입니다.' },
			{ field: 'userNm', message: '사용자명은 필수입니다.' },
			{ field: 'authrtCd', message: '사용자등급을 선택해 주십시오.' },
			{ field: 'ognzCd', message: '소속조직을 선택해 주십시오.' },
			{ field: 'ctiUseYn', message: 'CTI사용여부를 선택해 주십시오.' },
			{ field: 'ctiAutoLgnYn', message: 'CTI자동로그인여부를 선택해 주십시오.' }
		];

		for (const { field, message } of requiredFields) {
			if (StrLib.isNull(userDetailForm[field])) {
				ComLib.openDialog('A', 'SYSI0010', [message]);
				return false;
			}
		}

		// 기본값 설정
		if (StrLib.isNull(userDetailForm.userTypeCd)) {
			userDetailForm.userTypeCd = '01';
		}

		// CTI 사용 시 추가 필수 필드
		if (this.state.selectboxProps.selCtiUseYn.value === 'Y') {
			if (StrLib.isNull(userDetailForm.ctiId)) {
				ComLib.openDialog('A', 'SYSI0010', ['CTI ID를 입력해 주십시오.']);
				return false;
			}
			if (StrLib.isNull(userDetailForm.extNo)) {
				ComLib.openDialog('A', 'SYSI0010', ['내선 번호를 입력해 주십시오.']);
				return false;
			}
		}

		// 형식 검증
		const validations = [
			{ 
				field: 'userId', 
				pattern: /^[a-zA-Z0-9]+$/, 
				message: '사용자ID에 사용할 수 없는 문자가 포함되어 있습니다.' 
			},
			{ 
				field: 'homeTelNo', 
				pattern: /^[0-9]+$/, 
				message: '자택전화번호에 사용할 수 없는 문자가 포함되어 있습니다.' 
			},
			{ 
				field: 'mblTelNo', 
				pattern: /^[0-9]+$/, 
				message: '휴대전화번호에 사용할 수 없는 문자가 포함되어 있습니다.' 
			},
			{ 
				field: 'extNo', 
				pattern: /^[0-9]+$/, 
				message: '내선번호에 사용할 수 없는 문자가 포함되어 있습니다.' 
			},
			{ 
				field: 'emlAddr', 
				pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
				message: '이메일 주소 형식이 올바르지 않습니다.' 
			}
		];

		for (const { field, pattern, message } of validations) {
			if (userDetailForm[field] && !pattern.test(userDetailForm[field])) {
				ComLib.openDialog('A', 'SYSI0010', [message]);
				return false;
			}
		}

		if(transId === 'SYS0030U01NEW'){
			this.transaction("SYS0030U01NEW");
		} else if(transId === 'SYS0030U01'){
			this.transaction("SYS0030U01");
		}
	}

	// 🔧 통합 유효성 검증
	validation = (transId) => {
		switch (transId) {
			case 'SYS0030R01':
				return true;

			case 'SYS0030R02':
				if (StrLib.isNull(this.currentRow)) {
					ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택해 주십시오.']);
					return false;
				}
				return true;

			case 'SYS0030U01':
				return this.validationField(transId);

			case 'SYS0030U01NEW':
				if(this.state.dsUserList.getRecords().some(item => item.userId === this.state.userDetailForm.userId)){
					ComLib.openDialog('A', 'SYSI0010', ['이미 존재하는 사용자ID입니다.']);
					return false;
				}
				return this.validationField(transId);

			case 'SYS0030U02':
			case 'SYS0030U03':
				if (StrLib.isNull(this.currentRow)) {
					ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택해 주십시오.']);
					return false;
				}
				return true;

			case 'INITIAL_DATA':
				return true;

			default:
				return true;
		}
	}

	// 🔧 통합 서버 통신
	transaction = (transId) => {
		let transManager = new TransManager();
		transManager.setTransId(transId);

		switch (transId) {
			case 'SYS0030R01':
				this.executeSearch(transManager);
				break;

			case 'SYS0030R02':
				this.executeUserDetailSearch(transManager);
				break;

			case 'SYS0030U01':
			case 'SYS0030U01NEW':
				this.executeUserSave(transManager);
				break;

			case 'SYS0030U02':
				this.executeLoginReset(transManager);
				break;

			case 'SYS0030U03':
				this.executePasswordReset(transManager);
				break;

			case 'INITIAL_DATA':
				this.executeInitialDataLoad(transManager);
				break;

			default:
				break;
		}
	}

	// 🔧 검색 실행
	executeSearch = (transManager) => {
		transManager.setTransUrl('/api/cmm/user/r01');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsSearch',
			datasetrecv: 'dsUserList'
		});
		
		const searchData = {
			ognzCd: this.state.ognzSelectProps.ognzCd || '',
			userId: this.state.userSelectProps.userId || '',
			userNm: this.state.userSelectProps.userNm || '',
			authrtCd: this.state.selectboxProps.selAuthrtNmSearch.value === 'ALL' ? '' : this.state.selectboxProps.selAuthrtNmSearch.value,
			ctiUseYn: this.state.selectboxProps.selCtiUseYnSearch.value === 'ALL' ? '' : this.state.selectboxProps.selCtiUseYnSearch.value,
			useYn: this.state.selectboxProps.selUseYnSearch.value === 'ALL' ? '' : this.state.selectboxProps.selUseYnSearch.value
		};
		
		transManager.setFormData(searchData);
		transManager.agent();
	}

	// 🔧 사용자 상세 검색 실행
	executeUserDetailSearch = (transManager) => {
		transManager.setTransUrl('/api/cmm/user/r02');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsSearch',
			datasetrecv: 'dsUserDetail'
		});
		
		transManager.setFormData({ userId: this.currentRow });
		transManager.agent();
	}

	// 🔧 사용자 저장 실행
	executeUserSave = (transManager) => {
		transManager.setTransUrl('/api/cmm/user/u01');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsUserDetail'
		});
		
		transManager.setFormData(this.state.userDetailForm);
		transManager.agent();
	}

	// 🔧 로그인 초기화 실행
	executeLoginReset = (transManager) => {
		transManager.setTransUrl('/api/cmm/user/u02');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsSearch'
		});
		
		transManager.setFormData({ userId: this.currentRow });
		transManager.agent();
	}

	// 🔧 비밀번호 초기화 실행
	executePasswordReset = (transManager) => {
		transManager.setTransUrl('/api/cmm/user/u03');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetsend: 'dsSearch'
		});
		
		transManager.setFormData({ userId: this.currentRow });
		transManager.agent();
	}

	// 🔧 초기 데이터 로드 실행
	executeInitialDataLoad = (transManager) => {
		transManager.setTransUrl('/api/cmm/authrt-grade/r01');
		transManager.setCallBack(this.callback);
		transManager.addConfig({
			datasetrecv: 'dsAuthrtList'
		});
		
		transManager.setFormData({});
		transManager.agent();
	}

	// 응답 처리 (기능정의서 기준)
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
			case 'SYS0030R01':
				this.handleSearchResult(res);
				break;

			case 'SYS0030R02':
				this.handleUserDetailResult(res);
				break;

			case 'SYS0030U01':
				this.handleUserUpdateResult(res);
				break;

			case 'SYS0030U01NEW':
				this.handleUserCreateResult(res);
				break;

			case 'SYS0030U02':
				this.handleLoginResetResult(res);
				break;

			case 'SYS0030U03':
				this.handlePasswordResetResult(res);
				break;

			case 'INITIAL_DATA':
				this.handleInitialDataResult(res);
				break;

			default:
				break;
		}
	}

	// 🔧 검색 결과 처리
	handleSearchResult = (res) => {
		if (res.result) {
			const formattedData = res.data.map(item => ({
				...item,
				jncmpYmd: item.jncmpYmd ? formatDateToDisplay(item.jncmpYmd) : null,
				rsgntnYmd: item.rsgntnYmd ? formatDateToDisplay(item.rsgntnYmd) : null
			}));
			this.state.dsUserList.setRecords(formattedData || []);
			this.setState({ ...this.state }, () => {
				if (this.gridApi) {
					this.gridApi.updateGridOptions({ rowData: this.state.dsUserList.getRecords() });
				}
			});
		}
	}

	// 🔧 사용자 상세 결과 처리
	handleUserDetailResult = (res) => {
		if (res.result) {
			this.updateStateFromUserDetail(res.data);
			this.updateUserDetailUI(res.data);
		}
	}

	// 🔧 State 업데이트 (사용자 상세에서)
	updateStateFromUserDetail = (userDetail) => {
		this.setState({
			...this.state,
			selectboxProps: {
				...this.state.selectboxProps,
				selAuthrtNm: { ...this.state.selectboxProps.selAuthrtNm, value: userDetail.authrtCd || '' },
				selUserTypeNm: { ...this.state.selectboxProps.selUserTypeNm, value: userDetail.userTypeCd || '' },
				selUseYn: { ...this.state.selectboxProps.selUseYn, value: userDetail.useYn || 'Y' },
				selCtiUseYn: { ...this.state.selectboxProps.selCtiUseYn, value: userDetail.ctiUseYn || 'Y' },
				selCtiAutoLgnYn: { ...this.state.selectboxProps.selCtiAutoLgnYn, value: userDetail.ctiAutoLgnYn || 'N' },
				selDscsnTaskSeCd: { ...this.state.selectboxProps.selDscsnTaskSeCd, value: userDetail.dscsnTaskSeCd || '' },
				selCallbakTaskUseYn: { ...this.state.selectboxProps.selCallbakTaskUseYn, value: userDetail.callbakTaskUseYn || 'N' },
				selWorkTm: { ...this.state.selectboxProps.selWorkTm, value: userDetail.workTm || '' }
			},
			calendarProps: {
				...this.state.calendarProps,
				jncmpYmd: { ...this.state.calendarProps.jncmpYmd, value: formatDateToDisplay(userDetail.jncmpYmd) || '', onChange: this.event.input.onChange },
				rsgntnYmd: { ...this.state.calendarProps.rsgntnYmd, value: userDetail.rsgntnYmd ? formatDateToDisplay(userDetail.rsgntnYmd) : null, onChange: this.event.input.onChange }
			},
			readOnlyInfo: {
				...this.state.readOnlyInfo,
				lgnYn: userDetail.lgnYn || '',
				lgnIp: userDetail.lgnIp || '',
				lgnTryCnt: String(userDetail.lgnTryCnt || 0),
			}
		});
	}

	// 🔧 사용자 수정 결과 처리
	handleUserUpdateResult = (res) => {
		if (res.result) {
			ComLib.openDialog('A', 'SYSI0010', ['사용자 정보가 수정되었습니다.']);
			this.refreshUserList();
		} else {
			ComLib.openDialog('A', 'SYSI0010', ['사용자 정보 수정 중 오류가 발생했습니다.']);
		}
	}

	// 🔧 사용자 생성 결과 처리
	handleUserCreateResult = (res) => {
		if (res.result) {
			ComLib.openDialog('A', 'SYSI0010', ['신규 사용자가 저장되었습니다.']);
			this.refreshUserList();
		} else {
			ComLib.openDialog('A', 'SYSI0010', ['신규 사용자 저장 중 오류가 발생했습니다.']);
		}
	}

	// 🔧 로그인 초기화 결과 처리
	handleLoginResetResult = (res) => {
		if (res.result) {
			ComLib.openDialog('A', 'SYSI0010', ['로그인 정보가 초기화되었습니다.']);
			this.refreshUserList();
		} else {
			ComLib.openDialog('A', 'SYSI0010', ['로그인 초기화 중 오류가 발생했습니다.']);
		}
	}

	// 🔧 비밀번호 초기화 결과 처리
	handlePasswordResetResult = (res) => {
		if (res.result) {
			ComLib.openDialog('A', 'SYSI0010', ['비밀번호가 초기화되었습니다.']);
			this.refreshUserList();
		} else {
			ComLib.openDialog('A', 'SYSI0010', ['비밀번호 초기화 중 오류가 발생했습니다.']);
		}
	}

	// 🔧 초기 데이터 결과 처리
	handleInitialDataResult = (res) => {
		if (res.result) {
			this.setupAuthorities(res.data);
		}
		this.setupCommonCodes();
	}

	// 🔧 권한 설정
	setupAuthorities = (authrtData) => {
		const authrtDataset = authrtData.map(item => ({ value: item.authrtCd, name: item.authrtNm, authrtSe: item.authrtSe }));
		const currentUserAuthrtCd = ComLib.getSession('gdsUserInfo').authrtCd;
		if(!currentUserAuthrtCd) {
			console.error('currentUserAuthrtCd is not defined');
			return;
		}
		const currentUserAuthrtSe = authrtDataset.filter(item => item.value === currentUserAuthrtCd)[0].authrtSe;
		const filteredAuthrtData = authrtDataset.filter(item => item.authrtSe <= currentUserAuthrtSe);

		const searchDataset = [{ value: 'ALL', name: '전체' }, ...filteredAuthrtData]; // 검색용에는 ALL 포함
		const detailDataset = [...filteredAuthrtData]; // 상세용에는 ALL 제외
		
		this.setState({
			selectboxProps: {
				...this.state.selectboxProps,
				selAuthrtNmSearch: { ...this.state.selectboxProps.selAuthrtNmSearch, dataset: searchDataset },
				selAuthrtNm: { 
					...this.state.selectboxProps.selAuthrtNm, 
					dataset: detailDataset,
					value: detailDataset.length > 0 ? detailDataset[0].value : ''
				}
			}
		});
	}

	// 🔧 공통코드 설정
	setupCommonCodes = () => {
		let gdsCommCode = ComLib.getSession('gdsCommCode');
		if(!gdsCommCode) {
			console.error('gdsCommCode is not defined');
			return;
		}

		const useYnList = gdsCommCode.filter(item => item.cdGroup === 'USE_YN');
		const userTypeList = gdsCommCode.filter(item => item.cdGroup === 'USER_TYPE_CD');
		const dscsnTaskSeList = gdsCommCode.filter(item => item.cdGroup === 'DSCSN_TASK_SE_CD');
		const workTmList = gdsCommCode.filter(item => item.cdGroup === 'UI_WORK_TM');

		this.updateSelectboxDatasets({
			useYnList,
			userTypeList,
			dscsnTaskSeList,
			workTmList
		});
	}

	// 🔧 Selectbox 데이터셋 업데이트
	updateSelectboxDatasets = (datasets) => {
		const { useYnList, userTypeList, dscsnTaskSeList, workTmList } = datasets;
		
		this.setState({
			selectboxProps: {
				...this.state.selectboxProps,
				selCtiUseYnSearch: { ...this.state.selectboxProps.selCtiUseYnSearch, dataset: [...this.state.selectboxProps.selCtiUseYnSearch.dataset, ...useYnList] },
				selCtiUseYn: { 
					...this.state.selectboxProps.selCtiUseYn, 
					dataset: [...this.state.selectboxProps.selCtiUseYn.dataset, ...useYnList],
					value: useYnList.length > 0 ? useYnList[0].value : 'Y'
				},
				selUseYnSearch: { ...this.state.selectboxProps.selUseYnSearch, dataset: [...this.state.selectboxProps.selUseYnSearch.dataset, ...useYnList] },
				selUseYn: { 
					...this.state.selectboxProps.selUseYn, 
					dataset: [...this.state.selectboxProps.selUseYn.dataset, ...useYnList],
					value: useYnList.length > 0 ? useYnList[0].value : 'Y'
				},
				selCtiAutoLgnYn: { 
					...this.state.selectboxProps.selCtiAutoLgnYn, 
					dataset: [...this.state.selectboxProps.selCtiAutoLgnYn.dataset, ...useYnList],
					value: useYnList.length > 0 ? useYnList[0].value : 'N'
				},
				selUserTypeNm: { 
					...this.state.selectboxProps.selUserTypeNm, 
					dataset: [...this.state.selectboxProps.selUserTypeNm.dataset, ...userTypeList],
					value: userTypeList.length > 0 ? userTypeList[0].value : '01'
				},
				selCallbakTaskUseYn: { 
					...this.state.selectboxProps.selCallbakTaskUseYn, 
					dataset: [...this.state.selectboxProps.selCallbakTaskUseYn.dataset, ...useYnList],
					value: useYnList.length > 0 ? useYnList[0].value : 'N'
				},
				selDscsnTaskSeCd: { 
					...this.state.selectboxProps.selDscsnTaskSeCd, 
					dataset: [...this.state.selectboxProps.selDscsnTaskSeCd.dataset, ...dscsnTaskSeList],
					value: dscsnTaskSeList.length > 0 ? dscsnTaskSeList[0].value : ''
				},
				selWorkTm: { 
					...this.state.selectboxProps.selWorkTm, 
					dataset: [...this.state.selectboxProps.selWorkTm.dataset, ...workTmList],
					value: workTmList.length > 0 ? workTmList[0].value : ''
				}
			}
		});
	}

	// 🔧 사용자 목록 새로고침
	refreshUserList = () => {
		if (this.validation("SYS0030R01")) {
			this.transaction("SYS0030R01");
		}
	}

	// 사용자 상세정보 UI 업데이트
	updateUserDetailUI = (userDetail) => {
		const userPhoto = userDetail.userPhoto ? userDetail.userPhoto.replace(/＝/g, '=') : '';
		
		this.setState({
			...this.state,
			userPhotoProps: {
				...this.state.userPhotoProps,
				userPhoto: userPhoto
			},
			profileImagePreview: userPhoto,
			textFieldProps: {
				...this.state.textFieldProps,
				iptUserId: { ...this.state.textFieldProps.iptUserId, value: userDetail.userId || '', readOnly: userDetail.userId ? true : false },
				iptUserNm: { ...this.state.textFieldProps.iptUserNm, value: userDetail.userNm || '' },
				iptOrgNm: { 
					...this.state.textFieldProps.iptOrgNm, 
					ognzCd: userDetail.ognzCd || '',
					ognzNm: userDetail.ognzNm || '',
					keyword: userDetail.ognzNm || ''
				},
				iptHomeTelNo: { ...this.state.textFieldProps.iptHomeTelNo, value: userDetail.homeTelNo || '' },
				iptMblTelNo: { ...this.state.textFieldProps.iptMblTelNo, value: userDetail.mblTelNo || '' },
				iptEmlAddr: { ...this.state.textFieldProps.iptEmlAddr, value: userDetail.emlAddr || '' },
				iptCtiId: { ...this.state.textFieldProps.iptCtiId, value: userDetail.ctiId || '' },
				iptEmpNo: { ...this.state.textFieldProps.iptEmpNo, value: userDetail.empNo || '', readOnly: userDetail.empNo ? true : false },
				iptExtNo: { ...this.state.textFieldProps.iptExtNo, value: userDetail.extNo || '' }
			},
			selectboxProps: {
				...this.state.selectboxProps,
				selAuthrtNm: { ...this.state.selectboxProps.selAuthrtNm, value: userDetail.authrtCd || '' },
				selUserTypeNm: { ...this.state.selectboxProps.selUserTypeNm, value: userDetail.userTypeCd || '' },
				selUseYn: { ...this.state.selectboxProps.selUseYn, value: userDetail.useYn || 'Y' },
				selCtiUseYn: { ...this.state.selectboxProps.selCtiUseYn, value: userDetail.ctiUseYn || 'Y' },
				selCtiAutoLgnYn: { ...this.state.selectboxProps.selCtiAutoLgnYn, value: userDetail.ctiAutoLgnYn || 'N' },
				selDscsnTaskSeCd: { ...this.state.selectboxProps.selDscsnTaskSeCd, value: userDetail.dscsnTaskSeCd || '' },
				selCallbakTaskUseYn: { ...this.state.selectboxProps.selCallbakTaskUseYn, value: userDetail.callbakTaskUseYn || 'N' },
				selWorkTm: { ...this.state.selectboxProps.selWorkTm, value: userDetail.workTm || '' }
			},
			calendarProps: {
				...this.state.calendarProps,
				jncmpYmd: { ...this.state.calendarProps.jncmpYmd, value: formatDateToDisplay(userDetail.jncmpYmd) || '', onChange: this.event.input.onChange },
				rsgntnYmd: { ...this.state.calendarProps.rsgntnYmd, value: formatDateToDisplay(userDetail.rsgntnYmd) || '', onChange: this.event.input.onChange }
			},
			readOnlyInfo: {
				lgnYn: userDetail.lgnYn || '',
				lgnIp: userDetail.lgnIp || '',
				lgnTryCnt: userDetail.lgnTryCnt || '',
				pswdChgDt: userDetail.pswdChgDt ? formatDateToDisplay(userDetail.pswdChgDt) : '',
			},
		});
	}

	// 🔧 사용자 상세정보 초기화
	clearUserDetail = () => {
		this.currentRow = null;
		this.setState({
			...this.state,
			userPhotoProps: {
				...this.state.userPhotoProps,
				userPhoto: ''
			},
			profileImagePreview: null,
			textFieldProps: this.getInitialTextFieldProps(),
			selectboxProps: {
				...this.state.selectboxProps,
				selAuthrtNm: { ...this.state.selectboxProps.selAuthrtNm, value: 'MEMBER' },
				selUserTypeNm: { ...this.state.selectboxProps.selUserTypeNm, value: '' },
				selUseYn: { ...this.state.selectboxProps.selUseYn, value: 'Y' },
				selCtiUseYn: { ...this.state.selectboxProps.selCtiUseYn, value: 'Y' },
				selCtiAutoLgnYn: { ...this.state.selectboxProps.selCtiAutoLgnYn, value: 'Y' },
				selDscsnTaskSeCd: { ...this.state.selectboxProps.selDscsnTaskSeCd, value: '' },
				selCallbakTaskUseYn: { ...this.state.selectboxProps.selCallbakTaskUseYn, value: 'Y' },
				selWorkTm: { ...this.state.selectboxProps.selWorkTm, value: '0700' }
			},
			calendarProps: this.getInitialCalendarProps(),
			readOnlyInfo: {
				...this.state.readOnlyInfo,
				lgnYn: '',
				lgnIp: '',
				lgnTryCnt: 0,
				pswdChgDt: '',
			}
		});
	}

	// 이미지 선택 핸들러
	handleImageSelect = (e) => {
		const file = e.target.files[0];
		
		if (!file) return;

		// 파일 유효성 검증
		if (!file.type.startsWith('image/')) {
			ComLib.openDialog('A', 'SYSI0010', ['이미지 파일만 선택할 수 있습니다.']);
			return;
		}
		
		if (file.size > 5 * 1024 * 1024) {
			ComLib.openDialog('A', 'SYSI0010', ['이미지 파일 크기는 5MB를 초과할 수 없습니다.']);
			return;
		}
		
		const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
		const fileExtension = file.name.split('.').pop().toLowerCase();
		if (!allowedExtensions.includes(fileExtension)) {
			ComLib.openDialog('A', 'SYSI0010', ['이미지 파일 형식은 jpg, jpeg, png, gif만 선택할 수 있습니다.']);
			return;
		}

		// 파일을 base64로 변환
		const reader = new FileReader();
		reader.onload = (event) => {
			const base64Data = event.target.result;
			this.updateUserImageWithBase64(base64Data);
		};
		reader.readAsDataURL(file);
	}

	// 사용자 이미지 업데이트
	updateUserImageWithBase64 = (base64Data) => {
		this.setState({ 
			profileImagePreview: base64Data,
			userPhotoProps: {
				...this.state.userPhotoProps,
				userPhoto: base64Data
			}
		});
		
		// 이미지 변경 알림
		ComLib.openDialog('A', 'SYSI0010', ['이미지가 변경되었습니다.']);
	}

	// 신규 사용자 모드
	newUserMode = () => {
		// UI 상태 초기화 (dsUserDetail 제외)
		this.clearUserDetail();
	}

	// 🔧 사용자 상세 정보 폼 데이터 생성
	buildUserDetailForm = () => ({
		// 기본 정보
		userId: this.state.textFieldProps.iptUserId.value || null,
		userNm: this.state.textFieldProps.iptUserNm.value || null,
		authrtCd: this.state.selectboxProps.selAuthrtNm.value || null,
		userTypeCd: this.state.selectboxProps.selUserTypeNm.value || null,
		ognzCd: this.state.textFieldProps.iptOrgNm.ognzCd || null,
		empNo: this.state.textFieldProps.iptEmpNo.value || null,
		extNo: this.state.textFieldProps.iptExtNo.value || null,
		
		// CTI 정보
		ctiUseYn: this.state.selectboxProps.selCtiUseYn.value === 'ALL' ? 'Y' : (this.state.selectboxProps.selCtiUseYn.value || 'N'),
		ctiAutoLgnYn: this.state.selectboxProps.selCtiAutoLgnYn.value || 'N',
		ctiId: this.state.textFieldProps.iptCtiId.value || null,
		
		// 업무 정보
		dscsnTaskSeCd: this.state.selectboxProps.selDscsnTaskSeCd.value === 'ALL' ? null : (this.state.selectboxProps.selDscsnTaskSeCd.value || null),
		callbakTaskUseYn: this.state.selectboxProps.selCallbakTaskUseYn.value === 'ALL' ? 'Y' : (this.state.selectboxProps.selCallbakTaskUseYn.value || 'N'),
		workTm: this.state.selectboxProps.selWorkTm.value === 'ALL' ? null : (this.state.selectboxProps.selWorkTm.value || null),

		// 날짜 정보 (YYYYMMDD 형식으로 변환)
		jncmpYmd: this.state.calendarProps.jncmpYmd.value ? formatDateToStorage(this.state.calendarProps.jncmpYmd.value) : null,
		rsgntnYmd: this.state.calendarProps.rsgntnYmd.value === null ? null : (this.state.calendarProps.rsgntnYmd.value ? formatDateToStorage(this.state.calendarProps.rsgntnYmd.value) : null),
		
		// 연락처 정보
		homeTelNo: this.state.textFieldProps.iptHomeTelNo.value || null,
		mblTelNo: this.state.textFieldProps.iptMblTelNo.value || null,
		emlAddr: this.state.textFieldProps.iptEmlAddr.value || null,
		
		// 기타 정보
		useYn: this.state.selectboxProps.selUseYn.value === 'ALL' ? 'N' : (this.state.selectboxProps.selUseYn.value || 'Y'),
		userPhoto: this.state.profileImagePreview || this.state.userPhotoProps.userPhoto || null
	});

	// 이벤트 핸들러 (표준 패턴)
	event = {
		button: {
			onClick: (e) => {
				switch (e.target.id) {
					case 'btnSearch':
						if (this.validation("SYS0030R01")) {
							this.transaction("SYS0030R01");
						}
						break;

					case 'btnSave':
						const isNewMode = StrLib.isNull(this.currentRow);
						const userDetailForm = this.buildUserDetailForm();
						
						// 모드별 다른 처리
						if (isNewMode) {
							userDetailForm.lgnYn = 'N';
							userDetailForm.lgnTryCnt = 0;
						}
						
						this.setState({
							...this.state,
							userDetailForm: userDetailForm
						}, () => {
							ComLib.openDialog('C', 'SYSI0010', ['저장하시겠습니까?'], checked => { 
								if (checked === true) {
									if (isNewMode) {
										this.validation("SYS0030U01NEW");
									} else {
										this.validation("SYS0030U01");
									}
								}
							});
							
						});
						break;

					case 'btnNew':
						this.newUserMode();
						break;

					case 'btnLoginReset':
						if (this.validation("SYS0030U02")) {
							ComLib.openDialog('C', 'SYSI0010', ['로그인 정보를 초기화하시겠습니까?'], checked => { 
								if (checked === true) {
									this.transaction("SYS0030U02");
								}
							});
						}
						break;

					case 'btnPasswordReset':
						if (this.validation("SYS0030U03")) {
							ComLib.openDialog('C', 'SYSI0010', ['비밀번호를 초기화하시겠습니까?'], checked => { 
								if (checked === true) {
									this.transaction("SYS0030U03");
								}
							});
						}
						break;

					// case 'btnIpManage':
					// 	if (StrLib.isNull(this.currentRow)) {
					// 		ComLib.openDialog('A', 'SYSI0010', ['사용자를 선택해 주십시오.']);
					// 		return;
					// 	}

					// 	ComLib.openPop('SYS0080', 'IP관리', {
					// 		modaless: false, 
					// 		width: '800px', 
					// 		height: '600px',
					// 	});
					// 	break;

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

			onRowClicked: (e) => {
				this.currentRow = e.data.userId;
				if (this.validation("SYS0030R02")) {
					this.transaction("SYS0030R02");
				}
			}
		},

		input: {
			onChange: (e) => {
				if (!e || !e.target) {
					console.warn('⚠️ onChange 이벤트에 target이 없습니다:', e);
					return;
				}
				
				const { id, value } = e.target;

				if(id === 'jncmpYmd' || id === 'rsgntnYmd'){
					this.setState({
						...this.state,
						calendarProps: {
							...this.state.calendarProps,
							[id]: { ...this.state.calendarProps[id], value: value }
						}
					});
				} else {
					this.setState({
						...this.state,
						textFieldProps: {
							...this.state.textFieldProps,
							[id]: { ...this.state.textFieldProps[id], value: value }
						}
					});
				}
			}
		},

		selectbox: {
			onChange: (e) => {
				const { id, value } = e.target

				this.setState({
					...this.state,
					selectboxProps: {
						...this.state.selectboxProps,
						[id]: { ...this.state.selectboxProps[id], value: value }
					}
				});
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
		},

		detailOgnzSelect: {
			onChange: (ognzData) => {	
				this.setState({
					...this.state,
					textFieldProps: {
						...this.state.textFieldProps,
						iptOrgNm: { 
							...this.state.textFieldProps.iptOrgNm, 
							ognzCd: ognzData.ognzCd || '',
							ognzNm: ognzData.ognzNm || '',
							keyword: ognzData.ognzCd || ognzData.ognzNm || ''
						}
					}
				});
			}
		}
	}

	render() {
		return (
			<FullPanel>
				{/* 조회 조건 영역 */}
				<SearchPanel className="sys-search-panel">
					<RelativeGroup>
						<LFloatArea style={{flexDirection: 'column'}}>
							<div style={{display: 'grid', gridTemplateColumns: '53px 400px 95px 150px 102px 1fr', alignItems: 'center', marginBottom: '5px'}}>
								<Label value="조직" />
								<OgnzSelect
									id={this.state.ognzSelectProps.id}
									ognzCd={this.state.ognzSelectProps.ognzCd}
									ognzNm={this.state.ognzSelectProps.ognzNm}
									keyword={this.state.ognzSelectProps.keyword}
									disabled={false}
									onChange={this.event.ognzSelect.onChange}
									/>
								<Label value="사용자등급" />
								<Selectbox
									{...this.state.selectboxProps.selAuthrtNmSearch}
									onChange={this.event.selectbox.onChange}
								/>
								<Label value="CTI사용여부" />
								<Selectbox
									{...this.state.selectboxProps.selCtiUseYnSearch}
									onChange={this.event.selectbox.onChange}
								/>
							</div>
							<div style={{display: 'grid', gridTemplateColumns: '53px 400px 95px 150px', alignItems: 'center'}}>
								<Label value="사용자" />
								<UserSelect
									id={this.state.userSelectProps.id}
									userId={this.state.userSelectProps.userId}
									userNm={this.state.userSelectProps.userNm}
									keyword={this.state.userSelectProps.keyword}
									disabled={false}
									onChange={this.event.userSelect.onChange}
									/>
								<Label value="사용여부" />
								<Selectbox
									{...this.state.selectboxProps.selUseYnSearch}
									onChange={this.event.selectbox.onChange}
								/>
							</div>
						</LFloatArea>
						<RFloatArea>
							<Button {...this.state.btnProps.btnSearch} onClick={this.event.button.onClick} />
							<Button {...this.state.btnProps.btnReset}/>
						</RFloatArea>
					</RelativeGroup>
				</SearchPanel>

				{/* 메인 컨텐츠 영역 */}
				<SubFullPanel>
					<ComponentPanel>
					{/* 사용자 목록 그리드 */}
					<Grid
						{...this.state.grdProps.grdUserList}
						data={this.state.dsUserList}
						onGridReady={this.event.grid.onGridReady}
						onRowClicked={this.event.grid.onRowClicked}
					/>
					</ComponentPanel>
					<ComponentPanel>
						<FlexPanel>
							{/* 사용자 상세정보 및 사진등록 */}			
							<div style={{flex: 1, marginRight: '16px'}}>
								<RelativeGroup>
									<LFloatArea>
										<div className="scrm-component-panel-namearea">
											<span>사용자 상세정보</span>
										</div>
									</LFloatArea>
								</RelativeGroup>	
								<div className='tb_no-border'>								
									<Table className="sys-table-detail scrm-modern-detail-table ghost"
										id="tblUserDetail"
										colGrp={[
											{width: '8%'}, {width: '19%'},
											{width: '8%'}, {width: '19%'},
											{width: '8%'}, {width: '19%'},
											{width: '8%'}, {width: '19%'}
										]}
										tbData={[
											[
												{type: 'T', value: '사용자ID', className: 'req', required: true},
												{type: 'D', value: (
													<Textfield
														{...this.state.textFieldProps.iptUserId}
														onChange={this.event.input.onChange}
														className={`${this.state.textFieldProps.iptUserId.readOnly ? 'read-only' : ''}`}
													/>
												)},
												{type: 'T', value: '사용자명', className: 'req', required: true},
												{type: 'D', value: (
													<Textfield
														{...this.state.textFieldProps.iptUserNm}
														onChange={this.event.input.onChange}
													/>
												)},
												{type: 'T', value: '사용자등급', className: 'req', required: true},
												{type: 'D', value: (
													<Selectbox
														{...this.state.selectboxProps.selAuthrtNm}
														onChange={this.event.selectbox.onChange}
													/>
												)},
												{type: 'T', value: '사용자유형', className: 'req', required: true},
												{type: 'D', value: (
													<Selectbox
														{...this.state.selectboxProps.selUserTypeNm}
														onChange={this.event.selectbox.onChange}
													/>
												)}
											],
											[
												{type: 'T', value: '소속조직', className: 'req', required: true},
												{type: 'D', value: (
													<OgnzSelect
														id={this.state.textFieldProps.iptOrgNm.id}
														ognzCd={this.state.textFieldProps.iptOrgNm.ognzCd}
														ognzNm={this.state.textFieldProps.iptOrgNm.ognzNm}
														keyword={this.state.textFieldProps.iptOrgNm.keyword}
														disabled={false}
														authrt={false}
														onChange={this.event.detailOgnzSelect.onChange}
													/>
												), colSpan: 3},
												{type: 'T', value: '사용시작일'},
												{type: 'D', value: (
													<InputCalendar
														{...this.state.calendarProps.jncmpYmd}
														onChange={this.event.input.onChange}
													/>
												)},
												{type: 'T', value: '사용종료일'},
												{type: 'D', value: (
													<InputCalendar
														{...this.state.calendarProps.rsgntnYmd}
														onChange={this.event.input.onChange}
													/>
												)}
											],
											[
												{type: 'T', value: '자택전화번호'},
												{type: 'D', value: (
													<Textfield
														{...this.state.textFieldProps.iptHomeTelNo}
														onChange={this.event.input.onChange}
													/>
												)},
												{type: 'T', value: '휴대전화번호'},
												{type: 'D', value: (
													<Textfield
														{...this.state.textFieldProps.iptMblTelNo}
														onChange={this.event.input.onChange}
													/>
												)},
												{type: 'T', value: '이메일주소'},
												{type: 'D', value: (
													<Textfield
														{...this.state.textFieldProps.iptEmlAddr}
														onChange={this.event.input.onChange}
													/>
												)},
												{type: 'T', value: '사용여부', className: 'req', required: true},
												{type: 'D', value: (
													<Selectbox
														{...this.state.selectboxProps.selUseYn}
														onChange={this.event.selectbox.onChange}
													/>
												)}
											],
											[
												{type: 'T', value: '로그인여부'},
												{type: 'D', value: (
													<Label value={this.state.readOnlyInfo.lgnYn} />
												)},
												{type: 'T', value: '로그인IP'},
												{type: 'D', value: (
													<Label value={this.state.readOnlyInfo.lgnIp} />
												)},
												{type: 'T', value: '로그인시도횟수'},
												{type: 'D', value: (
													<Label value={this.state.readOnlyInfo.lgnTryCnt} />
												)},
												{type: 'T', value: '비밀번호 변경일시'},
												{type: 'D', value: (
													<Label value={this.state.readOnlyInfo.pswdChgDt} />
												)}
											]
											// [
											// 	{type: 'T', value: 'CTI사용여부', className: 'req', required: true},
											// 	{type: 'D', value: (
											// 		<Selectbox
											// 			{...this.state.selectboxProps.selCtiUseYn}
											// 			onChange={this.event.selectbox.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: 'CTI자동로그인여부', className: 'req', required: true},
											// 	{type: 'D', value: (
											// 		<Selectbox
											// 			{...this.state.selectboxProps.selCtiAutoLgnYn}
											// 			onChange={this.event.selectbox.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: 'CTI Agent ID'},
											// 	{type: 'D', value: (
											// 		<Textfield
											// 			{...this.state.textFieldProps.iptCtiId}
											// 			onChange={this.event.input.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: '내선번호'},
											// 	{type: 'D', value: (
											// 		<Textfield
											// 			{...this.state.textFieldProps.iptExtNo}
											// 			onChange={this.event.input.onChange}
											// 		/>
											// 	)}
											// ],
											// [
											// 	{type: 'T', value: '출근시간'},
											// 	{type: 'D', value: (
											// 		<Selectbox
											// 			{...this.state.selectboxProps.selWorkTm}
											// 			onChange={this.event.selectbox.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: '업무구분'},
											// 	{type: 'D', value: (
											// 		<Selectbox
											// 			{...this.state.selectboxProps.selDscsnTaskSeCd}
											// 			onChange={this.event.selectbox.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: '콜백업무여부'},
											// 	{type: 'D', value: (
											// 		<Selectbox
											// 			{...this.state.selectboxProps.selCallbakTaskUseYn}
											// 			onChange={this.event.selectbox.onChange}
											// 		/>
											// 	)},
											// 	{type: 'T', value: '사원번호'},
											// 	{type: 'D', value: (
											// 		<Textfield
											// 			{...this.state.textFieldProps.iptEmpNo}
											// 			className={`${this.state.textFieldProps.iptEmpNo.readOnly ? 'read-only' : ''}`}
											// 			onChange={this.event.input.onChange}
											// 		/>
											// 	)}
											// ]
										]}
									/>
								</div>
							</div>
							{/* 사진등록 영역 */}
							<div style={{width: '180px'}}>
								<RelativeGroup>
									<LFloatArea>
										<div className="scrm-component-panel-namearea">
											<span>사진등록</span>
										</div>
									</LFloatArea>
								</RelativeGroup>
								<div className='user-photo'>
									{(this.state.profileImagePreview || this.state.userPhotoProps.userPhoto) ? (
										<img 
											src={this.state.profileImagePreview || this.state.userPhotoProps.userPhoto} 
											alt="사진"
										/>
									) : (
										<div className="photo-placeholder">
											<span className="fas fa-camera empty-photo"></span>
											<span>사진</span>
										</div>
									)}
									{/* 파일 업로드 기능 */}
									<input 
										type="file" 
										accept="image/*" 
										onChange={this.handleImageSelect}
										id="userPhotoInput"
										style={{ display: 'none' }}
									/>
									<label htmlFor="userPhotoInput" className="photo-upload-btn">
										<span className="fas fa-camera"></span>
									</label>
								</div>						
							</div>
						</FlexPanel>
					</ComponentPanel>
					{/* 하단 버튼 영역 */}
					<BottomPanel>
						<RelativeGroup>
							<LFloatArea>
								<Button {...this.state.btnProps.btnLoginReset} onClick={this.event.button.onClick} />
								<Button {...this.state.btnProps.btnPasswordReset} onClick={this.event.button.onClick} />
							</LFloatArea>
							<RFloatArea>
								<Button {...this.state.btnProps.btnNew} onClick={this.event.button.onClick} />
								<Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
							</RFloatArea>
						</RelativeGroup>
					</BottomPanel>
				</SubFullPanel>
			</FullPanel>
		);
	}
}

export default View; 