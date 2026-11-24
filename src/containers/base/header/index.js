import React from 'react';
import {ComLib, DataLib, TransManager} from 'common';
import NotificationLayer from './NotificationLayer';
import DisplayLayer from './displayLayer';

/**
 * GNB 우측 위젯 — CoreWorks 셸(.cw-content-gnb)의 오른쪽 영역.
 *
 * 옛 전폭 헤더를 대체한다. 렌더만 바뀌었고 생명주기 부수효과
 * (사용자 이미지 조회 · 기준정보 이관 gdsFrontendSysBaseInfo→gdsSysBaseInfo)는 그대로다.
 * 로그아웃은 아이콘바 하단으로 옮겼다(containers/base/index.js handleLogout).
 */
class Header extends React.Component{
	/*******************************************************************
	 * Constructor
	 *******************************************************************/
	constructor(){
		super();
		this.state = {
			dsUser: DataLib.datalist.getInstance(),
			dsSysBaseInfo: DataLib.datalist.getInstance(),
			userImage: '',
		}
		this.userInfo = {
			userImage: '',
			userOgnzNm: ComLib.getSessionUserInfo('ognzNm'),
			userName: ComLib.getSessionUserInfo('userNm'),
			userCtiUseYn: ComLib.getSessionUserInfo('ctiUseYn') === 'Y' ? true : false
		}
	}

	static defaultProps = {
	}

	/*******************************************************************
	 * Event
	 *******************************************************************/
	componentDidMount() {
		this.state.dsUser.setRecords(ComLib.getSession("c"));
		if(this.state.userImage === '') {
			this.getUserInfo();
		}

		// 기준정보 조회
		this.getSysBaseInfo()

		window.addEventListener('userImageChanged', this.getUserImageOnly);
	}

	componentWillUnmount() {
		window.removeEventListener('userImageChanged', this.getUserImageOnly);
	}

	onClickUserInfo = () => {
		ComLib.openPop('COM1100', this.userInfo.userName + '님 로그인 정보', {modaless: false, width: '350px', height: '570px', param: { keyword: this.state.keyword }});
	}

	onClickSettings = () => {
		// 환경설정(개인 컬러) — EssentialRoutes 의 COM0030, 같은 창 모달로 뜬다
		ComLib.openPop('COM0030', '환경설정', {modaless: false, width: '460px', height: '700px'});
	}

	getUserImageOnly = () => {
		const localUserInfo = ComLib.getSession('gdsUserInfo');
		this.setState({
			userImage: localUserInfo.userPhoto
		});
	}

	getUserInfo = () => {
		const transManager = new TransManager();
		transManager.get('/api/cmm/login-user/r01', null, (res) => {
			if(ComLib.handleResponse(res, 'search')) {
				let profileImage = res.data.userPhoto;
				if (profileImage) {
					profileImage = profileImage.replace(/＝/g, '=');
				}
				ComLib.setSession('gdsUserInfo', {
					...ComLib.getSession('gdsUserInfo'),
					userPhoto: profileImage,
				});
				if(res.data.ognzNm !== ComLib.getSession('gdsUserInfo').ognzNm) {
					ComLib.setSession('gdsUserInfo', {
						...ComLib.getSession('gdsUserInfo'),
						ognzNm: res.data.ognzNm,
						authrtNm: res.data.authrtNm
					});
				}
				if(res.data.authrtNm !== ComLib.getSession('gdsUserInfo').authrtNm) {
					ComLib.setSession('gdsUserInfo', {
						...ComLib.getSession('gdsUserInfo'),
						authrtNm: res.data.authrtNm
					});
				}

				this.setState({
					userImage: profileImage
				});
			}
		});
	}

	// 기준정보 조회
	getSysBaseInfo = () => {


		const gdsFrontendSysBaseInfo = ComLib.getSession('gdsFrontendSysBaseInfo');
		if(!gdsFrontendSysBaseInfo){
			ComLib.setSession('gdsSysBaseInfo', {});
			return;
		}

		ComLib.setSession('gdsSysBaseInfo', {
			ctiServerIpA: gdsFrontendSysBaseInfo.CTI_SERVER_IP_A, // CTI 서버 IP A
			ctiServerIpB: gdsFrontendSysBaseInfo.CTI_SERVER_IP_B, // CTI 서버 IP B
			ctiPortA: gdsFrontendSysBaseInfo.CTI_PORT_A, // CTI 포트 A
			ctiPortB: gdsFrontendSysBaseInfo.CTI_PORT_B, // CTI 포트 B
			ctiSsl: gdsFrontendSysBaseInfo.CTI_SSL, // CTI SSL
			ctiEnabled: gdsFrontendSysBaseInfo.CTI_ENABLED, // CTI 활성화
			ctiPrefix: gdsFrontendSysBaseInfo.CTI_PREFIX, // CTI 접두사
			ctiSseServer: gdsFrontendSysBaseInfo.CTI_SSE_SERVER, // CTI SSE 서버
			envCorp: gdsFrontendSysBaseInfo.ENV_CORP, // 환경 코드
		});

		ComLib.removeSession('gdsFrontendSysBaseInfo');
	};
	/*******************************************************************
	 * Render
	 *******************************************************************/
	// GNB 유틸 아이콘 — 사용자 정보 왼쪽, 누르면 우측 드로어(utildrawer)가 열린다
	renderUtilButton = (key, label, path, badge) => {
		const { activeUtil, onToggleUtil } = this.props;
		return (
			<button
				type="button"
				className={`cw-gnb-icon-btn${activeUtil === key ? ' active' : ''}`}
				title={label}
				onClick={() => onToggleUtil && onToggleUtil(key)}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
					<path d={path} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				{badge > 0 && <span className="cw-gnb-badge">{badge > 99 ? '99+' : badge}</span>}
			</button>
		);
	}

	render () {
		const { utilCounts = {} } = this.props;
		return (
			<React.Fragment>
				<div className="cw-gnb-notice"><NotificationLayer /></div>
				{this.userInfo.userCtiUseYn && ComLib.getSession('gdsSysBaseInfo')?.envCorp === 'W' && <DisplayLayer />}
				{this.renderUtilButton('favorite', '즐겨찾기', 'M10 3l2.2 4.5 4.8.7-3.5 3.4.8 4.9L10 14.2 5.7 16.5l.8-4.9L3 8.2l4.8-.7L10 3z', 0)}
				{this.renderUtilButton('notification', '알림', 'M6 8a4 4 0 118 0c0 3.2 1.5 4.5 1.5 4.5h-11S6 11.2 6 8M8.4 15.5a1.8 1.8 0 003.2 0', utilCounts.notification || 0)}
				{this.renderUtilButton('memo', '마이메모', 'M5 3h7l3 3v11H5V3zM12 3v3h3M7.5 10h5M7.5 13h4', utilCounts.memo || 0)}
				<button type="button" className="cw-gnb-icon-btn" title="환경설정" onClick={this.onClickSettings}>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
						<path d="M10 6.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1" strokeLinecap="round" />
					</svg>
				</button>
				<div className="cw-gnb-user" onClick={this.onClickUserInfo} title="나의 정보">
					{this.state.userImage &&
						<img className="cw-gnb-user-photo" src={this.state.userImage} alt='' />
					}
					<div>
						<div className="cw-gnb-user-name">{this.userInfo.userName}님</div>
						<div className="cw-gnb-user-ognz">{this.userInfo.userOgnzNm}</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
}
export default Header;
