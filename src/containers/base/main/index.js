import React, { Suspense } from 'react';
import {appRoute, getAppRoutes} from 'routes';
import {TrayPanel, IconButton, RFloatArea, LFloatArea, TrayDiv, ErrorBoundary} from 'components';
import { newScrmObj, ComLib, TransManager, StrLib, DataLib } from 'common';

class Main extends React.Component{
	constructor (props) {
		super(props);
		this.state = {
			trayProp : [],
		}

		// 각 화면 컴포넌트의 ref를 저장할 객체
		this.componentRefs = {};
		
		// ref 콜백 함수를 캐시할 객체 (무한 루프 방지)
		this.refCallbacks = {};

		// 라우트 캐시 (render 메서드에서 매번 getAppRoutes() 호출 방지)
		this.cachedRoutes = null;
		this.lastMenuHash = null;

		this.onClick = this.onClick.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onPrevMove = this.onPrevMove.bind(this);
		this.onNextMove = this.onNextMove.bind(this);
		this.onSelect = this.onSelect.bind(this);
	}
	onClick = (e) => { this.selectMenu(); }
	onClose = (e) => { this.props.closeMenu(e); }
	onPrevMove  = (e) => { this.props.prevMenu(e); }
	onNextMove  = (e) => { this.props.nextMenu(e); }
	onSelect  = (e) => { this.props.selectMenu(e); }
	
	/*------------------------------------------------------------------------------------------------*
	 * React 라이프 사이클
	 *------------------------------------------------------------------------------------------------*/
	componentDidMount() {
		// 초기 라우트 캐시 생성
		this.getCachedRoutes();
	}

	componentDidUpdate(prevProps) {
		// tray가 변경되었을 때 사용하지 않는 컴포넌트 참조 정리
		if (prevProps.tray !== this.props.tray) {
			this.cleanupUnusedComponentRefs();
			// tray 변경 시 라우트 캐시 갱신 (메뉴 권한 변경 가능성)
			this.cachedRoutes = null;
			this.lastMenuHash = null;
		}
	}

	componentWillUnmount() {
		// 메인 화면 종료 시 모든 팝업 닫기
		if (window.closeAllPopups) {
			console.log('[Main] 메인 화면 종료 - 팝업 닫기 시작');
			const closedCount = window.closeAllPopups();
			console.log(`[Main] 메인 화면 종료 - ${closedCount}개 팝업 닫기 완료`);
		}
		
		// 컴포넌트 언마운트 시 모든 참조 정리
		this.componentRefs = {};
		this.refCallbacks = {};
		this.cachedRoutes = null;
		this.lastMenuHash = null;
	}

	/*------------------------------------------------------------------------------------------------*
	 * 유틸리티 메서드
	 *------------------------------------------------------------------------------------------------*/
	// 사용하지 않는 컴포넌트 참조 정리
	cleanupUnusedComponentRefs = () => {
		if (!this.props.tray || this.props.tray.length === 0) {
			// tray가 비어있으면 모든 참조 정리
			this.componentRefs = {};
			this.refCallbacks = {};
			return;
		}

		const currentMenuIds = this.props.tray.map(item => item.menuId);
		const refMenuIds = Object.keys(this.componentRefs);
		const callbackMenuIds = Object.keys(this.refCallbacks);

		// 현재 tray에 없는 menuId의 참조 제거
		refMenuIds.forEach(menuId => {
			if (!currentMenuIds.includes(menuId)) {
				delete this.componentRefs[menuId];
			}
		});

		// 현재 tray에 없는 menuId의 ref 콜백 제거
		callbackMenuIds.forEach(menuId => {
			if (!currentMenuIds.includes(menuId)) {
				delete this.refCallbacks[menuId];
			}
		});
	}

	// ref 콜백 함수 생성 및 캐시 (무한 루프 방지)
	createRefCallback = (menuId) => {
		// 이미 생성된 콜백이 있으면 재사용
		if (!this.refCallbacks[menuId]) {
			this.refCallbacks[menuId] = (ref) => this.setComponentRef(menuId, ref);
		}
		return this.refCallbacks[menuId];
	}

	// 컴포넌트 ref 설정 메서드
	setComponentRef = (menuId, ref) => {
		// 이미 동일한 ref가 설정되어 있다면 중복 처리 방지
		if (this.componentRefs[menuId] === ref) {
			return;
		}
		
		const prevRef = this.componentRefs[menuId];
		this.componentRefs[menuId] = ref;
		
		// forceUpdate() 제거 - 무한 루프 방지
		// ref 설정만으로 충분하며, 강제 리렌더링은 불필요함
		console.log(`📌 컴포넌트 ref 설정: ${menuId}`, ref ? '설정됨' : '해제됨');
	}

	// 빈 options 객체 캐시 (props 안정화용)
	getEmptyOptions = () => {
		if (!this._emptyOptions) {
			this._emptyOptions = {};
		}
		return this._emptyOptions;
	}

	// 캐시된 라우트 가져오기 (render 메서드 최적화용)
	getCachedRoutes = () => {
		try {
			const menuList = ComLib.getSession('gdsMenu') || [];
			const currentMenuHash = JSON.stringify(menuList.map(m => m.menuId).sort());
			
			// 메뉴가 변경되지 않았으면 캐시된 라우트 반환
			if (this.lastMenuHash === currentMenuHash && this.cachedRoutes) {
				return this.cachedRoutes;
			}
			
			// 새로운 라우트 생성 및 캐시
			this.cachedRoutes = getAppRoutes();
			this.lastMenuHash = currentMenuHash;
			
			return this.cachedRoutes;
		} catch (error) {
			console.error('라우트 캐시 처리 중 오류:', error);
			// 오류 시 직접 호출 (fallback)
			return getAppRoutes();
		}
	}

	// 초기화 기능 지원 여부 확인 메서드
	hasInitializeMethod = (menuId) => {
		// 1. 먼저 ref가 있는 경우 확인 (인스턴스 레벨) - 가장 정확함
		const component = this.componentRefs[menuId];
		if (component) {
			return typeof component.initialize === 'function';
		}
		
		// 2. ref가 없는 경우 캐시된 라우트에서 컴포넌트 클래스 확인
		const currentRoutes = this.getCachedRoutes();
		const routeItem = currentRoutes.find(item => item.id === menuId);
		if (routeItem && routeItem.component) {
			// React.lazy 컴포넌트는 초기화 지원 불가
			if (routeItem.component.$$typeof === Symbol.for('react.lazy')) {
				return false;
			}
			
			// 함수형 컴포넌트는 초기화 지원 불가
			const isFunctionComponent = (
				typeof routeItem.component === 'function' && 
				!routeItem.component.prototype?.render
			);
			if (isFunctionComponent) {
				return false;
			}
			
			// 정적 속성 hasInitializeSupport 확인
			if (routeItem.component.hasInitializeSupport === true) {
				return true;
			}
			
			// prototype에서 initialize 메서드 확인
			try {
				return typeof routeItem.component.prototype?.initialize === 'function';
			} catch (error) {
				// prototype 접근 실패 시 false 반환
				return false;
			}
		}
		
		return false;
	}

	// 초기화 버튼 클릭 처리 메서드 — 버튼은 GNB(AppMain)에 있고 ref 로 이 메서드를 부른다
	handleInitialize = () => {
		const currentMenuId = this.props.selected.menuId;
		const currentComponent = this.componentRefs[currentMenuId];
		if (currentComponent && typeof currentComponent.initialize === 'function') {
			try {
				// 해당 화면의 초기화 메서드 호출
				currentComponent.initialize();
				ComLib.showMessage('A', 'SYSI0010', ['화면이 초기화되었습니다.']);
			} catch (error) {
				console.error('초기화 처리 중 오류 발생:', error);
			}
		}
	}

	event = {
		button : {
			onClick : (e, tray) => {
				switch (e.target.id) {
					case 'btnPrev' :
						this.props.prevMenu(this.props.selected);
						break;
					case 'btnNext' :
						this.props.nextMenu(this.props.selected);
						break;
					case 'btnClose' :
						// MDI 영역에 화면이 있을 때만 전체 닫기 실행
						if (this.props.tray && this.props.tray.length > 0) {
							this.props.closeAllMenu();
						}
						break;
					default : break;
				}
			}
		}
	}

	render () {
		// tray 배열 안전성 검사 및 필터링
		const safeTray = this.props.tray && Array.isArray(this.props.tray) ? 
			this.props.tray.filter(item => item && item.menuId) : [];

		return (
			<React.Fragment>
				{/* CoreWorks 셸에서 트레이(탭 띠)는 GNB 바로 아래, 본문 위에 온다 */}
				<TrayPanel id = {"_trayPanelMenu"}>
					<LFloatArea>
						<TrayDiv id={"_mainTrayDiv"} data={safeTray} selected = {this.props.selected} onClick = {this.onClick} onClose = {this.onClose} onSelect={this.onSelect}/>
					</LFloatArea>
					<RFloatArea>
						<div className="scrm-tray-btn-div" id = "_trayBtnArea">
							<IconButton classes='scrm-tray-btn-prev' id='btnPrev' onClick={this.event.button.onClick} />
							<IconButton classes='scrm-tray-btn-next' id='btnNext' onClick={this.event.button.onClick} />
							<IconButton
								classes='scrm-tray-btn-close'
								id='btnClose'
								onClick={this.event.button.onClick}
								disabled={!safeTray || safeTray.length === 0}
							/>
						</div>
					</RFloatArea>
				</TrayPanel>
				<div className={'scrm-main-view-area'}>
					{safeTray.length === 0 ? (
						// tray가 비어있을 때 표시할 내용
						<div className="cw-empty-tray">
							<p>열린 화면이 없습니다.</p>
						</div>
					) : (
						safeTray.map((tray, key) => {
							// this.props.selected가 없으면 null 반환 (마지막 탭 닫기 시)
							if (!this.props.selected) {
								return null;
							}

							const selectedMenuId = this.props.selected.menuId;

							if (selectedMenuId === tray.menuId) {
								ComLib.setCurrentMenuId(tray.menuId);
							}

							return (
								<div id={tray.menuId} style={{display : (selectedMenuId === tray.menuId) ? 'block' : 'none', height: '100%'}} key={'_menu_div_' + tray.menuId}>
									{/* 화면 제목 바는 없앴다 — 제목이 GNB·트레이 탭과 세 번 겹쳤다(사용자 지적 2026-09-02).
									    즐겨찾기 ☆·상태메시지·초기화는 GNB 로 이동(containers/base/index.js) */}
									<div className={'scrm-main-view-area-content'}><div>
									<ErrorBoundary showUserMessage={false}>
										<Suspense fallback={
											<div className="scrm-loading-container">
												<div className="scrm-loading-spinner"></div>
												<div className="scrm-loading-text">화면을 불러오는 중...</div>
											</div>
										}>
										{
											(() => {
												// 캐시된 라우트에서 컴포넌트 찾기 (무한 루프 방지)
												const currentRoutes = this.getCachedRoutes();
												const matchedRoute = currentRoutes.find(item => item.id === tray.menuId);
												
												if (!matchedRoute) {
													return <div className="scrm-error-message">
														<h3>화면을 불러올 수 없습니다</h3>
														<p>화면 ID: <strong>{tray.menuId}</strong></p>
														<p>화면 이름: <strong>{tray.menuNm}</strong></p>
														<p>요청한 화면이 등록되지 않았거나 접근 권한이 없습니다.</p>
														<div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
															<h4 style={{margin: '0 0 10px 0', fontSize: '14px'}}>해결 방법:</h4>
															<ul style={{margin: 0, paddingLeft: '20px', fontSize: '13px'}}>
																<li>메뉴 권한이 있는지 확인해주세요</li>
																<li>화면이 구현되어 있는지 확인해주세요</li>
																<li>시스템 관리자에게 문의해주세요</li>
															</ul>
														</div>
														{process.env.NODE_ENV === 'development' && (
															<details style={{marginTop: '10px'}}>
																<summary>개발자 정보</summary>
																<div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
																	<p>사용 가능한 화면: {currentRoutes.map(r => r.id).join(', ')}</p>
																</div>
															</details>
														)}
													</div>;
												}

												// 컴포넌트 타입 확인
												const isConnectedComponent = matchedRoute.component.displayName && 
													(matchedRoute.component.displayName.includes('Connect') || 
													 matchedRoute.component.displayName.includes('ConnectFunction'));
												
												// 함수형 컴포넌트인지 확인
												const isFunctionComponent = (
													typeof matchedRoute.component === 'function' && 
													!matchedRoute.component.prototype?.render &&
													!isConnectedComponent
												);
												
												// React.lazy로 감싸진 컴포넌트인지 확인
												const isLazyComponent = matchedRoute.component.$$typeof === Symbol.for('react.lazy');
												
												// options 객체 안정화 (매번 새 객체 생성 방지)
												const stableOptions = tray.options || this.getEmptyOptions();
												
												const componentProps = {
													key: `menu_comp_${matchedRoute.id}_${tray.menuId}`,
													options: stableOptions
												};
												
												// 클래스 컴포넌트이고 Connect되지 않은 경우에만 ref 추가
												// 함수형 컴포넌트나 React.lazy 컴포넌트에는 ref를 추가하지 않음
												if (!isConnectedComponent && !isFunctionComponent && !isLazyComponent) {
													componentProps.ref = this.createRefCallback(tray.menuId);
												}
												return React.createElement(matchedRoute.component, componentProps);
											})()
										}
										</Suspense>
									</ErrorBoundary>
									</div></div>
								</div>
							)
						})
					)}
				</div>
			</React.Fragment>
		);
	}
}
export default Main;