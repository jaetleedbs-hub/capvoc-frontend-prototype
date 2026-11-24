import React from 'react';
import { APP_NAME } from 'constants/brand';
import Main from './main';
import Header from './header';
import IconBar from './iconbar';
import SubMenuPanel from './submenu';
import UtilDrawer from './utildrawer';
// 화면 제목 바를 없애며 GNB 로 옮긴 것들(사용자 지적 — 제목 3중 표시)
import FavoriteLayer from './main/FavoriteLayer';
import StatusMessageDisplay from './main/StatusMessageDisplay';
import { appRoute, getAppRoutes, refreshAppRoutes } from 'routes';
import { refreshPopupRoutes } from 'routes/popupRoute';

import { ComLib, DataLib, TransManager } from 'common';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as appModuleActions from 'store/modules/appModule';
import { withRouter } from 'utils/withRouter';

import {
	LAYOUT_LS,
	readLsBool,
	writeLsBool,
} from '../../coreworks/common/layoutPrefs';

// 홈(아이콘바 로고) 목적지 = 대시보드.
// openDefaultMenu 의 폴백과 <같은 화면>이다 — 옛 COM3010 은 API 가 전부 500 이라
// 2026-08-17 에 BO10_S 로 대체됐다. 한 곳에서만 바꾸도록 상수로 둔다.
const HOME_MENU_ID = 'BO10_S';

// CoreWorks 원본과 같은 값 — cw_submenu_width 에 저장, 끌어서 바꾼다
const SUBMENU_WIDTH_KEY = 'cw_submenu_width';
const SUBMENU_MIN = 100;
const SUBMENU_MAX = 400;
const SUBMENU_DEFAULT = 220;

class AppMain extends React.Component {
	/*******************************************************************
	 * Constructor
	 *******************************************************************/
	constructor() {
		super();
		this.menuSource = ComLib.getSession("gdsMenu");
		this.openDefaultMenu = this.openDefaultMenu.bind(this);
		// GNB 의 화면 초기화 버튼이 Main 의 hasInitializeMethod/handleInitialize 를 부른다
		this.mainRef = React.createRef();

		const groups = this.visibleTopGroups(this.menuSource || []);

		this.state = {
			dsUser: DataLib.datalist.getInstance(),
			// CoreWorks 셸 상태 — localStorage 로 지속(레이아웃은 CoreWorks 와 같은 키)
			menuExpanded: readLsBool(LAYOUT_LS.MENU_EXPANDED, false),
			submenuVisible: readLsBool(LAYOUT_LS.SUBMENU_VISIBLE, true),
			submenuWidth: this.readSubmenuWidth(),
			// 아이콘바 선택: 대분류 menuId (메뉴 전용 — 유틸 패널은 utilPanel 이 맡는다)
			activePanel: groups.length > 0 ? groups[0].menuId : null,
			// 우측 슬라이드 패널: null | 'favorite' | 'notification' | 'memo'
			utilPanel: null,
		};
	}

	/** 아이콘바에 올릴 대분류 — 숨김이 아니고, 실행 가능한 잎을 하나라도 가진 것만 */
	visibleTopGroups = (menuList) => {
		const visible = menuList.filter((m) => m.menuUseYn !== 'H');
		const hasRunnableLeaf = (menuId) => {
			const children = visible.filter((m) => m.upMenuId === menuId);
			return children.some(
				(c) => (c.npagYn && c.npagYn !== 'X') || hasRunnableLeaf(c.menuId)
			);
		};
		return visible
			.filter((m) => !m.upMenuId && hasRunnableLeaf(m.menuId))
			.sort((a, b) => (Number(a.sortSn) || 0) - (Number(b.sortSn) || 0));
	};

	readSubmenuWidth = () => {
		try {
			const raw = localStorage.getItem(SUBMENU_WIDTH_KEY);
			const n = raw ? Number(raw) : NaN;
			return Number.isFinite(n)
				? Math.min(SUBMENU_MAX, Math.max(SUBMENU_MIN, n))
				: SUBMENU_DEFAULT;
		} catch (e) {
			return SUBMENU_DEFAULT;
		}
	};

	openDefaultMenu = () => {
		const {AppModuleAction} = this.props;
		const thisMenuSource = ComLib.getSession("gdsMenu") || this.menuSource;

		function _openMenu(menuId){
			if(!thisMenuSource){
				return false;
			}

			menuId = menuId.trim();
			const currentRoutes = getAppRoutes();
			const targetMenu = currentRoutes.find(route => route.id === menuId);
			if (!targetMenu) {
				return false;
			}

			let bscScrnMenuInfo = thisMenuSource.filter(menu => menu.menuId === menuId);
			if( bscScrnMenuInfo.length == 0){
				return false;
			}

			// 메뉴 객체 생성
			const menuInfo = Object.assign({}, bscScrnMenuInfo[0], {
				closeable: false
			});
			AppModuleAction.addTray(menuInfo);
			return true;
		}

		setTimeout(() => {

			// URL Path를 기반으로 route 에 있는 메뉴 추가 (우선 순위 1)
			const path = this.props.location.pathname;
			if (path !== '/' && path !== '/main') {
				const currentRoutes = getAppRoutes();
				const targetMenu = currentRoutes.find(route => route.path === path);
				if(targetMenu){
					if(_openMenu(targetMenu.id)){
						return;
					}
				}
			}

			// 사용자 정보에 포함된 기본 프로그램 실행
			let bascScrnMenuId = ComLib.getSessionUserInfo('bscScrnMenuId');
			let isOpenDefaultMenu = false;
			let defaultMenuList = [];
			if( bascScrnMenuId){
				// 배열에 있는 모든 화면을 실행
				if( bascScrnMenuId.indexOf(',') > -1){
					let values = bascScrnMenuId.split(',');
					defaultMenuList = defaultMenuList.concat(values);
				} else {
					defaultMenuList.push(bascScrnMenuId);
				}
			}

			// 권한이 있는지 확인한다.
			for(let menuId of defaultMenuList){
				if(_openMenu(menuId)){
					isOpenDefaultMenu = true;
				}
			}

			if( !isOpenDefaultMenu ){
				// 기본 경로일 때 기본 화면 로드
				//
				// [2026-08-17] 종전 값: 'COM3010'
				//  COM3010 은 <옛 세대 대시보드>다. 그 화면이 부르는 /api/com3010/r04~r08 은
				//  백엔드에 컨트롤러가 <이력상 한 번도 없었고>(관련 mapper/VO 는 2026-07-26
				//  死코드 정리에서 "컨트롤러 없음"으로 삭제됐다), 지금은 다섯 패널 전부 500 이다.
				//
				//  그런데 이 폴백은 실제로 탄다 — cmpt_authrt.bsc_scrn_menu_id 가 비어 있는
				//  권한(LEADER 팀장, TEST)이 있어서, 그 사용자는 로그인 직후 <데이터가 하나도
				//  안 나오는 화면>을 본다.
				//
				//  대체 화면은 BO10_S(대시보드)다. 이쪽은 /api/stat/dashboard/* 로 살아 있다.
				_openMenu('BO10_S');
			}
		}, 0);
	}


	/*******************************************************************
	 * Event
	 *******************************************************************/
	componentDidMount() {
		this.state.dsUser.setRecords(ComLib.getSession("gdsUserInfo"));

		if (ComLib.getSession("SYSTEM_DV") != "L") {
			window.addEventListener('beforeunload', this.event.window.onbeforeunload);
			window.addEventListener('unload', this.event.window.onunload);
			ComLib.setSession('logoutComplete', "false");
		}


		// (_assistAutoRun 세션 초기화는 제거 — 유일한 소비처였던 COM1100 의
		//  상담어시스트 토글이 사용자 지시로 삭제됐다 2026-09-02)

		this.openDefaultMenu();

		// 메뉴를 서버에서 다시 가져온다 — 종전에는 로그인 응답에만 실려 와서
		// 메뉴가 바뀌어도 재로그인 전에는 반영되지 않았다(사용자 지적 2026-09-02).
		// 메인 기동 = 로그인 직후와 <새로고침> 둘 다이므로, 여기서 부르면 둘 다 덮는다.
		this.refreshMenus();

	}

	componentWillUnmount() {
		// if (ComLib.getSession("SYSTEM_DV") != "L") {
			window.removeEventListener('beforeunload', this.event.window.onbeforeunload);
			window.removeEventListener('unload', this.event.window.onunload);
		// }
	}
	componentDidUpdate (prevProps) {
		this.handler.trayWidthTransform();

		// 선택된 화면(트레이 탭)이 바뀌면 서브메뉴를 그 화면의 대분류로 따라가게 한다
		// (CoreWorks 가 location 으로 활성 그룹을 잡는 것과 같은 규칙).
		// 즐겨찾기/알림/메모 패널을 보고 있을 때는 건드리지 않는다 — 일부러 연 패널이다.
		const { selected } = this.props;
		if (selected && (!prevProps.selected || prevProps.selected.menuId !== selected.menuId)) {
			const menuSource = ComLib.getSession("gdsMenu") || this.menuSource || [];
			const rootId = this.rootGroupOf(selected.menuId, menuSource);
			const current = this.state.activePanel;
			const currentIsGroup = menuSource.some((m) => m.menuId === current);
			// 아이콘바에 실제로 있는 그룹으로만 옮긴다 — 대시보드(BO10_S)처럼 최상위에
			// 바로 붙은 잎은 자기 자신이 루트라, 따라가면 서브메뉴가 빈다(실측)
			const isIconbarGroup = this.visibleTopGroups(menuSource).some((g) => g.menuId === rootId);
			if (rootId && currentIsGroup && isIconbarGroup && rootId !== current) {
				this.setState({ activePanel: rootId });
			}
		}
	}

	/**
	 * 서버에서 내 메뉴를 다시 가져와 세션·라우트를 갱신한다.
	 * 응답 모양은 로그인 응답의 menuList 와 같다(백엔드가 같은 서비스를 태운다).
	 * 실패·빈 응답이면 조용히 기존 세션을 유지한다 — 백그라운드 갱신이 화면을 막으면 안 된다.
	 */
	refreshMenus = () => {
		const transManager = new TransManager();
		// 백그라운드 갱신 — 로딩바·오류 다이얼로그를 띄우지 않는다(NotificationLayer 폴링과 같은 규약).
		// 새 jar 가 배포되지 않은 백엔드에서는 이 호출이 500/404 인데, 그건 오류가 아니라
		// <아직 없는 기능>이다. 조용히 기존 세션을 유지한다. 실측: 로컬 28030(옛 jar)에서
		// 이 억제가 없으면 메인 진입마다 "서버 오류 발생 (500)" 다이얼로그가 떴다.
		transManager.constants.noProgressbar = true;
		transManager.setErrorCallback(() => true);
		transManager.get('/api/cmm/login-user/menus', null, (res) => {
			const list = res && res.data;
			if (!Array.isArray(list) || list.length === 0) {
				return;
			}
			const prev = ComLib.getSession('gdsMenu') || [];
			if (JSON.stringify(prev) === JSON.stringify(list)) {
				return; // 변화 없음 — 라우트 캐시를 흔들 이유가 없다
			}

			ComLib.setSession('gdsMenu', list);
			this.menuSource = list;
			try {
				refreshAppRoutes();
				refreshPopupRoutes();
			} catch (error) {
				console.warn('메뉴 갱신 후 라우트 캐시 새로고침 실패:', error);
			}

			// 지금 보고 있는 대분류가 사라졌으면 첫 그룹으로 옮긴다
			this.setState((prevState) => {
				const groups = this.visibleTopGroups(list);
				return groups.some((g) => g.menuId === prevState.activePanel)
					? {} // setState 자체가 리렌더를 일으켜 새 메뉴 트리가 그려진다
					: { activePanel: groups.length > 0 ? groups[0].menuId : null };
			});
		});
	}

	/** menuId 의 최상위 조상(대분류) menuId */
	rootGroupOf = (menuId, menuSource) => {
		const byId = new Map(menuSource.map((m) => [m.menuId, m]));
		let cur = byId.get(menuId);
		let guard = 0;
		while (cur && cur.upMenuId && byId.has(cur.upMenuId) && guard++ < 10) {
			cur = byId.get(cur.upMenuId);
		}
		return cur ? cur.menuId : null;
	}

	event = {
		window: {
			onbeforeunload: (e) => {
				const logoutComplete = ComLib.getSession("logoutComplete");
				// 문자열 "false"/"true"를 boolean으로 변환
				const isLogoutComplete = logoutComplete === true || logoutComplete === "true";

				if (!isLogoutComplete) {
					e.preventDefault();
					e.returnValue = "작업 중인 내용이 저장되지 않을 수 있습니다. 페이지를 나가시겠습니까?";
					return e.returnValue;
				}
			},
			onunload: (e) => {
				const logoutComplete = ComLib.getSession("logoutComplete");
				const isLogoutComplete = logoutComplete === true || logoutComplete === "true";

				if (!isLogoutComplete) {
					if (this.validation("BASE_D01"))
						this.transaction("BASE_D01");
				}
			}
		}
	}

	/*******************************************************************
	 * Validation
	 *******************************************************************/
	validation = (serviceid) => {
		switch(serviceid) {
		case 'BASE_D01':
			break;
		default : break;
		}

		this.setdata(serviceid);

		return true;
	}

	/*******************************************************************
	 * Set Data
	 *******************************************************************/
	setdata = (serviceid) => {
		switch(serviceid) {
		case 'BASE_D01':
			this.state.dsUser.setValue(0, "PS_STA_CD", "20");
			break;
		default: break;
		}
	}

	/*******************************************************************
	 * Transaction
	 *******************************************************************/
	transaction = (serviceid) => {
		let transManager = new TransManager();
		try {
			switch(serviceid) {
			case 'BASE_D01':
				TransManager.get('/api/common/user-auth/logout', {}, (result) => {
					ComLib.logout();
				});
				break;
			default: break;
			}
		} catch (err) {
			console.log(err);
		}
	}

	/*******************************************************************
	 * Callback
	 *******************************************************************/
	callback = (res) => {
		switch(res.id) {
		case 'BASE_D01':
			break;
		default: break;
		}
	}

	/*******************************************************************
	 * CoreWorks 셸 핸들러
	 *******************************************************************/
	handleToggleMenuExpand = () => {
		const next = !this.state.menuExpanded;
		this.setState({ menuExpanded: next });
		writeLsBool(LAYOUT_LS.MENU_EXPANDED, next);
	}

	handleToggleSubmenu = () => {
		const next = !this.state.submenuVisible;
		this.setState({ submenuVisible: next });
		writeLsBool(LAYOUT_LS.SUBMENU_VISIBLE, next);
	}

	/**
	 * 홈 — 대시보드로 이동한다(사용자 지시 2026-09-03).
	 *
	 * 이미 열려 있으면 ADD_TRAY 가 트레이를 늘리지 않고 <그 탭을 선택>한다(appModule §ADD_TRAY).
	 * 로그인 직후 기본화면과 같은 방식으로 `closeable:false` 를 준다 — 홈은 닫는 화면이 아니다.
	 * 권한에 없거나 라우트가 없으면 아무 일도 하지 않는다("화면을 불러올 수 없습니다"를 띄우지 않는다).
	 */
	handleGoHome = () => {
		const menuSource = ComLib.getSession("gdsMenu") || this.menuSource || [];
		const home = menuSource.find((m) => m.menuId === HOME_MENU_ID);
		if (!home) {
			return;
		}
		if (!getAppRoutes().some((r) => r.id === HOME_MENU_ID)) {
			return;
		}
		this.props.AppModuleAction.addTray({ ...home, closeable: false });
	}

	handleSelectPanel = (key) => {
		this.setState({ activePanel: key });
		// 서브메뉴가 접혀 있으면 펴서 보여준다 — 눌렀는데 아무 일도 없으면 고장으로 읽힌다
		if (!this.state.submenuVisible) {
			this.setState({ submenuVisible: true });
			writeLsBool(LAYOUT_LS.SUBMENU_VISIBLE, true);
		}
	}

	// GNB 아이콘 → 우측 드로어 토글 (같은 아이콘을 다시 누르면 닫힌다)
	handleToggleUtil = (key) => {
		this.setState((prev) => ({ utilPanel: prev.utilPanel === key ? null : key }));
	}

	handleCloseUtil = () => {
		this.setState({ utilPanel: null });
	}

	// 드로어 안에서 화면을 열면(즐겨찾기·알림) 드로어를 닫는다 —
	// 열린 화면이 드로어에 가려진 채 남으면 "안 열렸다"로 읽힌다
	handleOpenFromUtil = (menuInfo) => {
		this.props.AppModuleAction.addTray(menuInfo);
		this.setState({ utilPanel: null });
	}

	handleSubmenuResizeStart = (e) => {
		e.preventDefault();
		const startX = e.clientX;
		const startW = this.state.submenuWidth;
		const clamp = (w) => Math.min(SUBMENU_MAX, Math.max(SUBMENU_MIN, w));
		const move = (ev) => {
			this.setState({ submenuWidth: clamp(startW + ev.clientX - startX) });
		};
		const up = (ev) => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', up);
			const w = clamp(startW + ev.clientX - startX);
			try {
				localStorage.setItem(SUBMENU_WIDTH_KEY, String(w));
			} catch (err) { /* 무시 */ }
		};
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', up);
	}

	handleLogout = () => {
		// CTI 상태 확인 (CTILib이 있는 경우) — 옛 헤더의 로그아웃과 같은 검사
		if (window.CTILib && window.CTILib.agentState) {
			const agentState = window.CTILib.agentState;
			if( agentState === "READY" || agentState === "TALKING" ) {
				ComLib.openAlertDialog("대기 또는 상담중인 상태에서는 로그아웃할 수 없습니다.");
				return;
			}
		}

		ComLib.openConfirmDialog("로그아웃하시겠습니까?", (confirm) => {
			if(!confirm) {
				return;
			}
			const transManager = new TransManager();
			transManager.get('/api/common/user-auth/logout', {}, (result) => {
				ComLib.logout();
			});
		});
	}

	/*******************************************************************
	 * User Function
	 *******************************************************************/
	handler = {
		trayWidthTransform : () => {
			const trayPanel = document.getElementById('_trayPanelMenu');
			const trayUl = document.getElementById('_ul_mainTrayDiv');
			if (!trayPanel || !trayUl || !trayPanel.querySelector('.scrm-rfloat-div')) {
				return;
			}
			// 전체 tray width 에서 버튼 영역의 width 제거 ()
			let width = trayPanel.offsetWidth - trayPanel.querySelector('.scrm-rfloat-div').offsetWidth;
			let trayWidth = 0;
			for (let intA = 0; intA < trayUl.children.length; intA ++) {
				// 15px 만큼의 padding이 잡혀 있어 해당 px도 포함
				trayWidth += (trayUl.children[intA].offsetWidth + 15);
			}
			const selectedLi = trayUl.querySelector('.scrm-tray-div-li-selected');
			if (width > trayWidth) {
				trayUl.style.transform = "translateX(0)";
			} else if (selectedLi) {
				// 첫번째 행이 셀렉트 인 경우, tray 원위치
				if (selectedLi.id === trayUl.children[0].id) {
					trayUl.style.transform = "translateX(0)";
				} else {
					// ul tag에 잡혀있는 margin이 50px이라 그만큼 빼줌
					if (selectedLi.getBoundingClientRect().x - 50 < 0) {
						trayUl.style.transform = "translateX(" + ((trayUl.getBoundingClientRect().x - selectedLi.getBoundingClientRect().x) + 50).toString() + "px)";
					} else {
						// 선택된 트레이의 right 좌표가 트레이 너비보다 클 경우, 트레이 div 위치 이동
						if (selectedLi.getBoundingClientRect().right > width) {
							trayUl.style.transform = "translateX(" + (width - trayWidth - 50).toString() + "px)";
						}
					}
				}
			}
		}
	}

	render () {
		const {selected, tray, unReadNoticesCount, notificationCountList} = this.props;
		const {AppModuleAction} = this.props;
		const { menuExpanded, submenuVisible, submenuWidth, activePanel, utilPanel } = this.state;

		const menuSource = ComLib.getSession("gdsMenu") || this.menuSource || [];
		const groups = this.visibleTopGroups(menuSource);
		const activeGroup = groups.find((g) => g.menuId === activePanel);

		return(
			<div className="cw-root">
				<div className="cw-body">
					<IconBar
						groups={groups}
						active={activePanel}
						expanded={menuExpanded}
						homeActive={!!selected && selected.menuId === HOME_MENU_ID}
						onToggleExpand={this.handleToggleMenuExpand}
						onSelect={this.handleSelectPanel}
						onHome={this.handleGoHome}
						onLogout={this.handleLogout}
					/>

					{submenuVisible && (
						<div
							className="cw-submenu-wrap cw-side-panel-wrap"
							style={{ width: submenuWidth, minWidth: SUBMENU_MIN, maxWidth: SUBMENU_MAX }}
						>
							<SubMenuPanel
								menu={menuSource}
								panel={activePanel}
								title={activeGroup ? activeGroup.menuNm : ''}
								selected={selected}
								openMenu={AppModuleAction.addTray}
							/>
							{/* 끌어서 폭을 바꾼다 — CoreWorks 와 같은 방식(cw_submenu_width) */}
							<div className="cw-panel-resizer cw-submenu-resizer" onMouseDown={this.handleSubmenuResizeStart} />
						</div>
					)}

					<div className="cw-main">
						<div className="cw-content-gnb">
							<button
								className="cw-btn-outline"
								type="button"
								style={{ padding: '4px 9px' }}
								onClick={this.handleToggleSubmenu}
								title={submenuVisible ? '서브메뉴 접기' : '서브메뉴 펼치기'}
							>
								{submenuVisible ? '‹' : '›'}
							</button>
							{/* 즐겨찾기 ☆ — 화면 제목 바에서 이관. 현재 화면을 즐겨찾기에 넣고 뺀다 */}
							{/* ⚠ key 를 주지 않는다 — menuId 를 key 로 걸면 <탭을 전환할 때마다>
							    언마운트·재마운트가 일어난다. props 만 바뀌면 되는 컴포넌트다. */}
							{selected && (
								<FavoriteLayer
									menuId={selected.menuId}
									selectedMenuId={selected.menuId}
								/>
							)}
							<span className="cw-content-gnb-title">{selected ? selected.menuNm : APP_NAME}</span>
							{/* 화면별 상태메시지 — 열린 탭마다 인스턴스를 상주시켜(핸들러 등록 수명 유지)
							    선택된 것만 보인다. 화면 제목 바에서 이관 */}
							{(tray || []).map((t) => (
								<span
									key={'gnb_status_' + t.menuId}
									className="cw-gnb-status"
									hidden={!selected || selected.menuId !== t.menuId}
								>
									<StatusMessageDisplay menuId={t.menuId} />
								</span>
							))}
							{selected && this.mainRef.current && this.mainRef.current.hasInitializeMethod(selected.menuId) && (
								<button
									type="button"
									className="cw-gnb-icon-btn"
									title="화면 초기화"
									onClick={() => this.mainRef.current && this.mainRef.current.handleInitialize()}
								>
									<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
										<path d="M16.5 10a6.5 6.5 0 11-1.9-4.6M16.5 2.8v3.4h-3.4" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</button>
							)}
							<span className="cw-gnb-right">
								<Header
									activeUtil={utilPanel}
									utilCounts={{
										notification: unReadNoticesCount || 0,
										memo: (notificationCountList && notificationCountList.reservationMemosCount) || 0,
									}}
									onToggleUtil={this.handleToggleUtil}
								/>
							</span>
						</div>
						<div className="cw-mdi-host">
							<Main
								ref={this.mainRef}
								tray={tray}
								selected = {selected}
								openMenu = {AppModuleAction.addTray}
								closeMenu = {AppModuleAction.delTray}
								prevMenu = {AppModuleAction.prevTray}
								nextMenu = {AppModuleAction.nextTray}
								selectMenu = {AppModuleAction.selectTray}
								closeAllMenu = {AppModuleAction.delAllTray}
							/>
						</div>
					</div>
				</div>

				{/* 우측 슬라이드 패널 — 좌측 메뉴와 영역이 겹치지 않는다 */}
				{utilPanel && (
					<UtilDrawer
						panel={utilPanel}
						openMenu={this.handleOpenFromUtil}
						onClose={this.handleCloseUtil}
					/>
				)}
			</div>
		);
	}
}
export default connect(
	(state) => ({
		selected : state.appModule.selected,
		tray : state.appModule.tray,
		popupList : state.appModule.popupList,
		needConfirmCount : state.appModule.needConfirmCount,
		unReadNoticesCount : state.appModule.unReadNoticesCount,
		notificationCountList : state.appModule.notificationCountList
	}),
	(dispatch) => ({
		AppModuleAction : bindActionCreators(appModuleActions, dispatch)
	})
)(withRouter(AppMain));
