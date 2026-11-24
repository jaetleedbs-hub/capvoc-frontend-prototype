import React from 'react';
import { newScrmObj, ComLib, TransManager, StrLib, DataLib } from 'common';
import { refreshAppRoutes } from 'routes';
import { refreshPopupRoutes } from 'routes/popupRoute';
import { withRouter } from 'utils/withRouter';
import AuthFormShell from '../../../coreworks/login/AuthFormShell';

class Login extends React.Component {
	/*******************************************************************
	 * Constructor
	 *******************************************************************/
	constructor(props){
		super();

		ComLib.clearSession();

		// state 초기화
		this.state = {
			timeoutId: null,
			warning: false,
			dsLogin: DataLib.datalist.getInstance(),
			dsRst: DataLib.datalist.getInstance(),
			dsLoginInfo: DataLib.datalist.getInstance([{userId: "", password: "", CENT_CD: "", CONN_IP: ""}]),
		};
		// 이벤트 바인딩
		this.event.button.onClick = this.event.button.onClick.bind(this);
		this.event.input.onChange = this.event.input.onChange.bind(this);
		this.event.input.onKeyUp = this.event.input.onKeyUp.bind(this);
	}

	componentDidUpdate(){
		if (this.state.warning && this.state.timeoutId !== null) {
			let timeoutId = setTimeout(() => this.setState({...this.state, warning: false, timeoutId: null}), 1500);
			this.setState({...this.state, timeoutId: timeoutId});
		}		
		// ComLib.clearSession();
	}

	componentDidMount () {
		window.dispatchEvent(new CustomEvent("navigationhandler"));
		ComLib.setServerInfos();
	} 

	event = {
		button: {
			onClick: (e) => {
				switch (e.target.id) {
				case 'btnLogin':
					 if (this.validation('LOGIN_R01')) { this.transaction('LOGIN_R01'); }
					break;
				case 'btnChgPasswd':
					if (document.getElementById('popup_div_0') != undefined) {
						document.getElementById('popup_div_0').hidden = false;
					} else {
						let option = { width: '350px', height: '300px', modaless: false,
							param: [{
								userId: this.state.dsLoginInfo.getValue(0, "userId"),
								CUR_PWD: this.state.dsLoginInfo.getValue(0, "password"),
								NEW_PWD: '',
								CON_PWD: '',
							}],
						};
						ComLib.openPop('pwdChg', '비밀번호 변경', option);
					}
					break;
				default:
					break;
				}
			}
		},
		input: {
			onChange: (e) => {
				switch (e.target.id) {
				case 'txtUsrCd':
					this.state.dsLoginInfo.setValue(0, "userId", e.target.value);
					ComLib.setStateDs(this, "dsLoginInfo");
					break;
				case 'txtUsrPasswd':
					ComLib.setStateValue(this, "dsLoginInfo", 0, "password", e.target.value);
					break;
				default:
					break;
				}
			},
			onKeyUp: (e) => {
				switch (e.target.id) {
				case 'txtUsrPasswd':
					if (e.getModifierState("CapsLock")) {
						this.setState({ warning: true });

					} else {
						this.setState({ warning: false });
					}

					if (e.keyCode === 13) {
						if (!ComLib.isNull(document.getElementById(newScrmObj.constants.mdi.DIALOG))) {
						} else if (!ComLib.isNull(document.getElementById(newScrmObj.constants.mdi.LOADING))) {
							if (document.getElementById(newScrmObj.constants.mdi.LOADING).hasChildNodes()) {
							} else { document.getElementById('btnLogin').click(); }
						} else { document.getElementById('btnLogin').click(); }
					}
					break;
				default:
					break;
				}
			}
		},
	}

	/*******************************************************************
	 * Validation
	 *******************************************************************/
	validation = (serviceid) => {
		switch (serviceid) {
		case 'LOGIN_R01':
			if (StrLib.isNull(this.state.dsLoginInfo.getValue(0, "userId"))) {
				ComLib.openDialog('A', 'SYSI0010', ['ID를 입력해주세요.']);
				return false;
			}
			if (StrLib.isNull(this.state.dsLoginInfo.getValue(0, "password"))) {
				ComLib.openDialog('A', 'SYSI0010', ['비밀번호를 입력해주세요.']);
				return false;
			}

			break;
		default :
			break;
		}

		this.setdata(serviceid);

		return true;
	}

	/*******************************************************************
	 * Set Data
	 *******************************************************************/
	setdata = (serviceid) => {
		switch(serviceid) {
		case 'LOGIN_R01':
			break;
		default :
			break;
		}
	}

	/*******************************************************************
	 * Transaction
	 * LOGIN_R01 : 로그인 체크
	 * LOGIN_R02 : 사용자 정보 조회
	 * LOGIN_U01 : 비멀번호 오류 카운트 업데이트
	 *******************************************************************/
	transaction = (serviceid) => {
		let transManager = new TransManager();
		try {
			switch (serviceid) {
			case 'LOGIN_R01':
				if(!ComLib.getSession("SVR_URL")) {
					ComLib.setServerInfos();
				}
				transManager.setTransId(serviceid);
				transManager.setTransUrl("/login");
				transManager.setCallBack(this.callback);
				transManager.setContentTypeByConstant('form');
				transManager.setFormData({
					username: this.state.dsLoginInfo.getValue(0, "userId"),
					password: this.state.dsLoginInfo.getValue(0, "password"),
				});
				transManager.agent();

				break;

			default :
				break;
			}
		} catch (err) {
			console.log(err);
		}
	}

	/*******************************************************************
	 * Callback
	 *******************************************************************/
	callback = (res) => {
		switch (res.id) {
		case 'LOGIN_R01':
			if(res.status === 'invalid'){
				let resData = res.data || {};
				if( resData.error == 'INITIAL_PSWD' || resData.error == 'CHANGE_PSWD') {
					ComLib.setSession('passwordChange', this.state.dsLoginInfo.getValue(0, "userId"));
					ComLib.openAlertDialog(resData.message, () => {
						const options = { width: '450px', height: '250px', modaless: false,
							param: [{
							USR_CD: this.state.dsLoginInfo.getValue(0, "userId") || '',
							CUR_PWD: '',
							NEW_PWD: '',
							CON_PWD: '',
							}],
						};
						ComLib.openPop('COM0020', '비밀번호 변경', options);
					});
					// 비밀번호 변경 실행
					return;
				}

				if( resData.error == 'DUPLICATE_LOGIN') {
					// 중복로그인 처리 실행
					if( resData.message) {
						ComLib.openConfirmDialog("이미 로그인 중인 사용자가 있습니다.\r\n이전 사용자를 로그아웃하고 로그인하시겠습니까?", (confirm) => {
							if(!confirm) {
								return;
							}
							TransManager.get('/api/common/user-auth/duplicate-login', {"statusMessage": encodeURIComponent(resData.message)}, (result) => {
								if(result.data === 'ok') {
									this.transaction('LOGIN_R01');
								} else {
									ComLib.openDialog('A','', result.data.message);
								}
							});
						});
					} else {
						ComLib.openDialog('A', 'SYSI0010', ['이미 로그인 중인 사용자가 있습니다. 관리자에게 문의세요.']);
					}
					return;
				}
				ComLib.openAlertDialog(resData.message);
				return false;
			}

			// 서비스 응답
			// let user = res.data.user;

		// TODO
			// 비밀번호 변경 시에만 동작한다.
			// 나머지는 정상 로그인 처리

			// const access_token = true;
			// ComLib.setSession('token', access_token);

			ComLib.setSession('gdsUserInfo',	res.data.user);
			ComLib.setSession('gdsCommCode',	res.data.codeList);
			ComLib.setSession('gdsMenu', 		res.data.menuList);
			ComLib.setSession('favoriteList', 	res.data.bookmarkList);
			ComLib.setSession('gdsFrontendSysBaseInfo', res.data.frontendSysBaseInfo);
			ComLib.setSession('logoutComplete', "false");

			// ComLib.setSession('gdsCentStndVl',	res.data.dsCentStvlInfo);
			// ComLib.setSession('gdsCentList',	res.data.dsCentList);
			// ComLib.setSession('gdsTeamList',	res.data.dsTeamList);
			// ComLib.setSession('gdsUserList',	res.data.dsUserList);
			// ComLib.setSession('gdsMsgList',		res.data.dsMsgList);

			// 동적 라우트 캐시 새로고침
			try {
				const menuList = ComLib.getSession('gdsMenu');
				console.log('🔍 로그인 후 gdsMenu 데이터:', {
					메뉴개수: menuList?.length || 0,
					샘플메뉴: menuList?.slice(0, 3)?.map(m => ({
						menuId: m.menuId,
						menuNm: m.menuNm,
						urlAddr: m.urlAddr,
						npagYn: m.npagYn
					})) || []
				});

				
				const appRoutes = refreshAppRoutes();
				const popupRoutes = refreshPopupRoutes();
				
				console.log('✅ 로그인 후 라우트 캐시 새로고침 완료:', {
					앱라우트수: appRoutes?.length || 0,
					팝업라우트수: popupRoutes?.length || 0
				});
			} catch (error) {
				console.warn('⚠️ 라우트 캐시 새로고침 실패:', error);
			}

			// App은 세션 변경만으로는 리렌더되지 않으므로 인증 변경 알림 후 이동
			window.dispatchEvent(new CustomEvent('chatcall-auth-changed'));
			// 메인 화면으로 이동
			// document.getElementById('linkBase').click();
			this.props.history.push('/');
			break;
		case 'LOGIN_U01':
			break;
		default:
			break;
		}
	}

	/*******************************************************************
	 * render
	 *******************************************************************/
	render () {
		return (
			<AuthFormShell
				title="로그인"
				subtitle="프로토타입 계정 admin / Proto#2026"
			>
				<div className="cw-login-form">
					<div className="cw-login-field">
						<label htmlFor="txtUsrCd">아이디</label>
						<input className="cw-login-input" type="text" id="txtUsrCd" value={this.state.dsLoginInfo.records[0]["userId"]} placeholder="아이디" onChange={this.event.input.onChange} autoComplete="off" />
					</div>
					<div className="cw-login-field">
						<label htmlFor="txtUsrPasswd">비밀번호</label>
						<input className="cw-login-input" type="password" id="txtUsrPasswd" value={this.state.dsLoginInfo.records[0]["password"]} placeholder="비밀번호" onChange={this.event.input.onChange} onKeyUp={this.event.input.onKeyUp} autoComplete="off" />
					</div>
					{this.state.warning && (
						<div className="cw-login-error" id="err_capslock"><strong>Caps Lock</strong> 이 켜져 있습니다.</div>
					)}
					<button className="cw-login-submit" id="btnLogin" onClick={this.event.button.onClick}>로그인</button>
				</div>
			</AuthFormShell>
		);
	}
}

export default withRouter(Login);