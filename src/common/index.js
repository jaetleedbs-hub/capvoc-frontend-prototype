import axios from 'axios';
import { runLocalRequest } from 'service/local';
import { renderToContainer, unmountFromContainer } from 'utils/reactRootManager';
import 'x-axios-progress-bar/dist/nprogress.css';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import {Dialog} from 'components';
import { Provider } from 'react-redux';
import store from '../store';
import { GlobalProvider } from './GlobalContext'; // 추가
import { getPopupRoutes } from 'routes/popupRoute';

// 팝업 관리자 import 추가
import PopupManager, { PopupManager as PopupManagerClass } from './PopupManager';

// 알림 관리자 import 추가
import NotificationManager, { getDialogNotificationManager } from './NotificationManager';

const newScrmObj = {
	constants: {
		crud: {
			read: 'r',
			create: 'c',
			update: 'u',
			destroy: 'd',
			remove: 'e'
		},
		datetime: {
			format: 'YYYYMMDDHH24MISS'
		},
		mdi: {
			DIALOG : 'dialog',
			POP_UP : 'popup',
			PLAYER : 'player',
			LOADING : '_loadDiv'
		},
		// 로딩 카운터 시스템
		loading: {
			counter: 0,
			totalRequests: 0
		},
		select: {
			argument: {
				all: 'a',
				select: 's',
				none: 'n',
			},
			dataType : {
					all : 'A'
				,	cns : 'B'
				,	qa : 'Q'
				,	mng : 'M'
			},
			authControl : {
				QA : {
					CENT : [4, 5, 6, 7, 9],
					TEAM  : [5, 6, 9],
					USER : [5]
				},
				CSR : {
					CENT : [4, 6, 7],
					TEAM  : [4, 6],
					USER : [4]
				}
			}
		},
		rowtype: {
			CREATE_OR_UPDATE: 'cu',
			DESTROY: 'd'
		}
	}
};
const ComLib = {
	cache: {},
	sessionKeys: [],
	
	// 메시지 이벤트 시스템 (하위 호환성을 위해 유지, 실제로는 알림 시스템 사용)
	_messageHandlers: {},
	_currentMenuId: null,

	// 현재 메뉴 ID 설정 (하위 호환성)
	setCurrentMenuId: (menuId) => {
		ComLib._currentMenuId = menuId;
	},

	// 메시지 핸들러 등록 (하위 호환성)
	registerMessageHandler: (menuId, handler) => {
		ComLib._messageHandlers[menuId] = handler;
	},

	// 메시지 핸들러 제거 (하위 호환성)
	unregisterMessageHandler: (menuId) => {
		delete ComLib._messageHandlers[menuId];
	},

	// 전역 메시지 전송 (하위 호환성을 위해 유지)
	sendMessage: (message, type = 'status') => {
		const currentMenuId = ComLib._currentMenuId;
		if (currentMenuId && ComLib._messageHandlers[currentMenuId]) {
			ComLib._messageHandlers[currentMenuId](message, type);
		} else {
			// 기존 콘솔 로그는 개발 환경에서만 표시
			if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
				console.log(`[${type.toUpperCase()}] ${message}`);
			}
		}
	},

	// 특정 메뉴에 메시지 전송 (하위 호환성)
	sendMessageToMenu: (menuId, message, type = 'status') => {
		if (ComLib._messageHandlers[menuId]) {
			ComLib._messageHandlers[menuId](message, type);
		} else {
			// 기존 콘솔 로그는 개발 환경에서만 표시
			if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
				console.log(`[${type.toUpperCase()}] ${message} (Menu: ${menuId})`);
			}
		}
	},

	// 로딩 시스템 유틸리티 함수들
	startLoading: () => {
		const transManager = new TransManager();
		transManager.startLoading();
	},

	endLoading: () => {
		const transManager = new TransManager();
		transManager.endLoading();
	},

	resetLoading: () => {
		const transManager = new TransManager();
		transManager.resetLoading();
	},

	// 여러 axios 호출을 관리하는 헬퍼 함수
	executeMultipleRequests: async (requests) => {
		const transManager = new TransManager();
		
		// 처리 건수 초기화 및 총 요청 수 설정
		newScrmObj.constants.loading.counter = 0;
		newScrmObj.constants.loading.totalRequests = requests.length;
		
		try {
			const results = await Promise.all(
				requests.map(async (request, index) => {
					try {
						transManager.startLoading();
						const result = await request();
						transManager.endLoading();
						return { success: true, data: result, index };
					} catch (error) {
						transManager.endLoading();
						return { success: false, error, index };
					}
				})
			);
			
			return results;
		} finally {
			// 모든 요청 완료 후 로딩 완전 초기화
			transManager.resetLoading();
		}
	},

	// Dialog 환경 감지 함수
	detectDialogEnvironment: () => {
		try {
			console.log('Dialog 환경 감지 시작');
			
			// 1. 호출 스택 기반 감지 (가장 확실한 방법)
			const error = new Error();
			const stack = error.stack;
			if (stack) {
				// 스택에서 Dialog 관련 정보 찾기
				const stackLines = stack.split('\n');
				for (let line of stackLines) {
					if (line.includes('popup') || line.includes('dialog') || line.includes('PopupDialog')) {
						console.log('스택에서 Dialog 관련 코드 발견:', line);
					}
				}
			}
			
			// 2. 현재 활성화된 요소에서 Dialog 찾기
			let activeElement = document.activeElement;
			console.log('현재 활성 요소:', activeElement);
			
			while (activeElement && activeElement !== document.body) {
				if (activeElement.className && activeElement.className.includes('scrm-popup-modal-content')) {
					const dialogId = activeElement.id ? activeElement.id.replace('_inner_div', '') : null;
					console.log('활성 요소에서 Dialog 발견:', dialogId);
					if (dialogId) return dialogId;
				}
				activeElement = activeElement.parentElement;
			}
			
			// 3. DOM에서 현재 활성화된 Dialog 찾기 (z-index 기준)
			const activeDialogs = document.querySelectorAll('.scrm-popup-modal-content');
			console.log('발견된 Dialog 수:', activeDialogs.length);
			
			if (activeDialogs.length > 0) {
				let highestZIndex = -1;
				let activeDialogId = null;
				
				activeDialogs.forEach((dialog, index) => {
					const parentElement = dialog.parentElement;
					if (parentElement) {
						const zIndex = parseInt(window.getComputedStyle(parentElement).zIndex) || 0;
						console.log(`Dialog ${index}: ID=${dialog.id}, z-index=${zIndex}`);
						
						if (zIndex > highestZIndex) {
							highestZIndex = zIndex;
							activeDialogId = dialog.id ? dialog.id.replace('_inner_div', '') : null;
						}
					}
				});
				
				console.log('최상위 Dialog ID:', activeDialogId);
				return activeDialogId;
			}
			
			// 4. 이벤트 타겟에서 Dialog 찾기
			if (window.event && window.event.target) {
				let eventTarget = window.event.target;
				while (eventTarget && eventTarget !== document.body) {
					if (eventTarget.className && eventTarget.className.includes('scrm-popup-modal-content')) {
						const dialogId = eventTarget.id ? eventTarget.id.replace('_inner_div', '') : null;
						console.log('이벤트 타겟에서 Dialog 발견:', dialogId);
						if (dialogId) return dialogId;
					}
					eventTarget = eventTarget.parentElement;
				}
			}
			
			// 5. 마지막으로 포커스된 Dialog 찾기
			const focusedElements = document.querySelectorAll(':focus');
			for (let element of focusedElements) {
				let parent = element;
				while (parent && parent !== document.body) {
					if (parent.className && parent.className.includes('scrm-popup-modal-content')) {
						const dialogId = parent.id ? parent.id.replace('_inner_div', '') : null;
						console.log('포커스된 요소에서 Dialog 발견:', dialogId);
						if (dialogId) return dialogId;
					}
					parent = parent.parentElement;
				}
			}
			
			console.log('Dialog 환경이 아님');
		} catch (error) {
			console.warn('Dialog 환경 감지 중 오류:', error);
		}
		
		return null; // Dialog 환경이 아님
	},

	// Dialog 컨텍스트 저장 (수동 설정용)
	_currentDialogContext: null,
	
	// Dialog 컨텍스트 설정 (Dialog에서 호출)
	setDialogContext: (dialogId) => {
		console.log('Dialog 컨텍스트 설정:', dialogId);
		ComLib._currentDialogContext = dialogId;
	},
	
	// Dialog 컨텍스트 해제 (Dialog 닫힐 때 호출)
	clearDialogContext: () => {
		console.log('Dialog 컨텍스트 해제:', ComLib._currentDialogContext);
		ComLib._currentDialogContext = null;
	},
	
	// 적절한 알림 관리자 반환
	getNotificationManager: () => {
		// 1. 수동으로 설정된 Dialog 컨텍스트 우선 사용
		if (ComLib._currentDialogContext) {
			console.log('수동 설정된 Dialog 컨텍스트 사용:', ComLib._currentDialogContext);
			return getDialogNotificationManager(ComLib._currentDialogContext);
		}
		
		// 2. 자동 감지 시도
		const dialogId = ComLib.detectDialogEnvironment();
		return getDialogNotificationManager(dialogId);
	},

	// 상태 메시지 (새로운 알림 시스템 사용)
	showStatusMessage: (message, type = 'info') => {
		// 빈 메시지 체크
		if (!message) return;
		
		// 배열인 경우 문자열로 변환
		if (Array.isArray(message)) {
			message = message.length > 1 ? message.join('\n') : message[0];
		}
		
		// 객체인 경우 문자열로 변환
		if (typeof message === 'object' && message !== null) {
			message = JSON.stringify(message);
		}

		// 적절한 알림 관리자 사용 (Dialog 내부면 Dialog용, 아니면 전역용)
		const notificationManager = ComLib.getNotificationManager();
		notificationManager.show(message, type);
	},

	// 일반 메시지 (새로운 알림 시스템 사용)
	showMessage: (message, type = 'info') => {
		// 빈 메시지 체크
		if (!message) return;
		
		// 배열인 경우 문자열로 변환
		if (Array.isArray(message)) {
			message = message.length > 1 ? message.join('\n') : message[0];
		}
		
		// 객체인 경우 문자열로 변환
		if (typeof message === 'object' && message !== null) {
			message = JSON.stringify(message);
		}

		// 적절한 알림 관리자 사용 (Dialog 내부면 Dialog용, 아니면 전역용)
		const notificationManager = ComLib.getNotificationManager();
		notificationManager.show(message, type);
	},

	// 성공 메시지
	showSuccessMessage: (message) => {
		ComLib.showStatusMessage(message, 'success');
	},

	// 에러 메시지
	showErrorMessage: (message) => {
		ComLib.showStatusMessage(message, 'error');
	},

	// 경고 메시지
	showWarningMessage: (message) => {
		ComLib.showStatusMessage(message, 'warning');
	},

	// 정보 메시지
	showInfoMessage: (message) => {
		ComLib.showStatusMessage(message, 'info');
	},

	isNull: (obj) => {
		if (typeof obj === 'undefined' || obj === null) return true;
	},
	isJson: (data) => {
		try {
			let json = JSON.parse(data);
			return (typeof json === 'object');
		} catch (e) {
			return false;
		}
	},


	structuredClone : (obj) => {
		if( window !== undefined && window.structuredClone !== undefined) {
			return window.structuredClone(obj);
		}
		return JSON.parse(JSON.stringify(obj));
	},
	
	removeSession: (id) => {
		sessionStorage.removeItem(id);
	},
	
	setSession: (id, obj) => {
		if(ComLib.sessionKeys.indexOf(id) === -1){
			ComLib.sessionKeys.push(id);
		}

		let useParse = typeof obj === 'object';
		if (useParse) {
			let textValue = JSON.stringify(obj);
			sessionStorage.setItem(id, textValue);
			delete ComLib.cache[id];
			// 배열인지 확인하고 적절하게 복사
			let cachedObj = Array.isArray(obj) ? [...obj] : Object.assign({}, obj);
			ComLib.cache[id] = {useParse: useParse, obj: cachedObj, textValue: textValue};
		} else {
			sessionStorage.setItem(id, obj);
		}
	},
	getSession: (id) => {
		let sessionValue = sessionStorage.getItem(id);
		// 미존재만 null. 빈 문자열("")은 유효값(예: 로컬 SVR_URL 상대경로) → null로 취급하면 "null"+url 버그 발생
		if(sessionValue === null || sessionValue === undefined){
			console.log("session not found", id);
			return null;
		}

		let data = ComLib.cache[id];
		if( data && data.textValue === sessionValue){
			// 같을 경우에만 캐시 사용
			return data.obj;
		}

		if (!ComLib.isJson(sessionValue)) {
			return sessionValue;
		}
		
		let obj = JSON.parse(sessionValue);
		ComLib.setSession(id, obj);
		return obj;
	},

	/*----------------------------------------------------------------------------------------
	 * 세션 연장 거부 (사용자 결정 2026-09-03 — A안)
	 *
	 * 「장기 미사용 … 토큰을 갱신하시겠습니까?」에서 <아니오>를 고르면, 그 세션은 더 이상
	 * 자동으로 연장되지 않는다.
	 *
	 * ⚠ 왜 필요한가 — 종전에는 이 확인창이 <장식>이었다. 확인창은 폴링(NotificationLayer,
	 *   noErrorDialog=true 라 자동 갱신이 꺼진 경로)에만 붙어 있고, 나머지 모든 화면 호출은
	 *   471 을 받으면 commonCallback 이 <묻지 않고> updateToken() 을 불렀다. 그래서 거부해도
	 *   다음 클릭 한 번이면 세션이 되살아났다(2026-09-03 실측: 아니오 직후 메뉴 클릭만으로 갱신).
	 *--------------------------------------------------------------------------------------*/
	_sessionEndNotified : false,

	declineTokenRenew : () => {
		try { sessionStorage.setItem('tokenRenewDeclined', 'true'); } catch (e) { /* 무시 */ }
	},

	allowTokenRenew : () => {
		try { sessionStorage.removeItem('tokenRenewDeclined'); } catch (e) { /* 무시 */ }
	},

	isTokenRenewDeclined : () => {
		try { return sessionStorage.getItem('tokenRenewDeclined') === 'true'; } catch (e) { return false; }
	},

	/**
	 * 만료된 세션을 끝낸다 — 안내 후 로그아웃.
	 *
	 * 동시에 여러 요청이 471 을 받아도 안내창이 여러 개 뜨지 않게 한 번만 수행한다.
	 * clearSession 이 이 표시를 되돌리므로 <그 뒤에> 세운다.
	 */
	endExpiredSession : () => {
		if (ComLib._sessionEndNotified) {
			return;
		}
		ComLib.clearSession();
		ComLib._sessionEndNotified = true;
		ComLib.openAlertDialog('세션이 종료되었습니다.\n다시 로그인해주세요.', () => {
			ComLib.logout();
		});
	},

	clearSession : () => {
		// 새 세션은 다시 <자동 갱신 허용> 상태에서 시작한다.
		ComLib._sessionEndNotified = false;

		// 세션 정리 시 모든 팝업 닫기
		if (window.closeAllPopups) {
			console.log('[ComLib.clearSession] 팝업 닫기 시작');
			const closedCount = window.closeAllPopups();
			console.log(`[ComLib.clearSession] ${closedCount}개 팝업 닫기 완료`);
		}
		
		let cache = ComLib.cache;

		// accessToken은 이제 HttpOnly 쿠키로 관리되므로 sessionStorage에서 제거 불필요
		let cacheKeys = ['gdsCommCode', 'gdsPrgrm', 'token', 'gdsUserInfo', 'gdsMenu', 'favoriteList', 'infos', 'gdsSysBaseInfo', 'gdsFrontendSysBaseInfo',
			'tokenRenewDeclined'];   // 연장 거부 표시도 함께 지운다 — 다시 로그인하면 평소대로 갱신된다
		cacheKeys.forEach(key => {
			sessionStorage.removeItem(key);
		});

		if(!cache){
			return;
		}
	
		for(let key in cache){
			delete ComLib.cache[key];
		}
	},

	// 암호화/복호화 관련 상수 (Java와 동일한 키 사용)
	_encryptionConstants: {
		SIMPLE_ENCRYPTED_PREFIX: "ENC_S_",
		OBFUSCATED_PREFIX: "OBF_",
		BASE_CHARSET: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
		OBFUSCATED_CHARSET: "ZhsIo2yW1GxCXS83airEtubNcdPD9qzYMAlBjO6Vf7QUR4LKvpmHgnJkT5w0Fe"
	},

	// 문자 치환 맵 생성 (캐시 사용으로 성능 최적화)
	_charMapCache: null,
	_getCharMaps: () => {
		if (ComLib._charMapCache) {
			return ComLib._charMapCache;
		}

		const constants = ComLib._encryptionConstants;
		const encodeMap = {};
		const decodeMap = {};
		
		for (let i = 0; i < constants.BASE_CHARSET.length; i++) {
			const baseChar = constants.BASE_CHARSET.charAt(i);
			const obfuscatedChar = constants.OBFUSCATED_CHARSET.charAt(i);
			encodeMap[baseChar] = obfuscatedChar;
			decodeMap[obfuscatedChar] = baseChar;
		}

		ComLib._charMapCache = { encodeMap, decodeMap };
		return ComLib._charMapCache;
	},

	/**
	 * 간단한 Base64 암호화 (난독화 암호화로 위임)
	 * 
	 * @param {string} plainText 평문
	 * @returns {string} 암호화된 문자열
	 */
	encryptSimple: (plainText) => {
		return ComLib.encryptObfuscated(plainText);
	},

	/**
	 * 간단한 Base64 복호화 (난독화 복호화로 위임)
	 * 
	 * @param {string} encodedText 암호화된 문자열
	 * @returns {string} 복호화된 문자열
	 */
	decryptSimple: (encodedText) => {
		return ComLib.decryptObfuscated(encodedText);
	},

	/**
	 * 고급 난독화 암호화 (Base64 + 문자 치환)
	 * Java와 호환되는 방식으로 구현
	 * 
	 * @param {string} plainText 평문
	 * @returns {string} 난독화된 문자열
	 */
	encryptObfuscated: (plainText) => {
		if (!plainText) {
			return plainText;
		}

		try {
			// 1. UTF-8 인코딩 후 Base64 인코딩 (Java와 동일한 방식)
			const base64Encoded = btoa(unescape(encodeURIComponent(plainText)));
			
			// 2. 문자 치환을 통한 난독화 ('=' 패딩 문자는 제외)
			const { encodeMap } = ComLib._getCharMaps();
			let obfuscated = '';
			for (let i = 0; i < base64Encoded.length; i++) {
				const char = base64Encoded.charAt(i);
				if (char === '=') {
					obfuscated += '='; // 패딩 문자는 그대로 유지
				} else {
					obfuscated += encodeMap[char] || char;
				}
			}
			const result = ComLib._encryptionConstants.OBFUSCATED_PREFIX + obfuscated;
			return result;

		} catch (e) {
			console.error('JavaScript 암호화 실패:', e);
			return plainText;
		}
	},

	/**
	 * 고급 난독화 복호화
	 * Java와 호환되는 방식으로 구현
	 * 
	 * @param {string} obfuscatedText 난독화된 문자열
	 * @returns {string} 복호화된 문자열
	 */
	decryptObfuscated: (obfuscatedText) => {
		if (!obfuscatedText) {
			return obfuscatedText;
		}

		// 프리픽스 제거
		let textToDecode = obfuscatedText;
		if (textToDecode.startsWith(ComLib._encryptionConstants.OBFUSCATED_PREFIX)) {
			textToDecode = textToDecode.substring(ComLib._encryptionConstants.OBFUSCATED_PREFIX.length);
		}

		try {
			// 1. 문자 치환 복원 ('=' 패딩 문자는 제외)
			const { decodeMap } = ComLib._getCharMaps();
			let restored = '';
			for (let i = 0; i < textToDecode.length; i++) {
				const char = textToDecode.charAt(i);
				if (char === '=') {
					restored += '='; // 패딩 문자는 그대로 유지
				} else {
					restored += decodeMap[char] || char;
				}
			}

			// 2. Base64 디코딩 후 UTF-8 디코딩 (Java와 동일한 방식)
			const result = decodeURIComponent(escape(atob(restored)));

			return result;

		} catch (e) {
			console.error("JavaScript 복호화 오류:", e);
			return obfuscatedText;
		}
	},

	/**
	 * 암호화 여부 확인 (난독화 여부 확인으로 위임)
	 * 
	 * @param {string} text 확인할 텍스트
	 * @returns {boolean} 암호화 여부
	 */
	isEncrypted: (text) => {
		return ComLib.isObfuscated(text);
	},

	/**
	 * 간단한 암호화 여부 확인 (난독화 여부 확인으로 위임)
	 * 
	 * @param {string} text 확인할 텍스트
	 * @returns {boolean} 간단한 암호화 여부
	 */
	isSimpleEncrypted: (text) => {
		return ComLib.isObfuscated(text);
	},

	/**
	 * 난독화 여부 확인
	 * 
	 * @param {string} text 확인할 텍스트
	 * @returns {boolean} 난독화 여부
	 */
	isObfuscated: (text) => {
		if (!text) {
			return false;
		}
		
		const constants = ComLib._encryptionConstants;
		return text.startsWith(constants.OBFUSCATED_PREFIX);
	},


	openAlertDialog : (msg, callback) => {
		ComLib.openDialog("A", "", msg, callback);
	},

	openConfirmDialog : (msg, callback) => {
		ComLib.openDialog("C", "", msg, callback);
	},

	openDialog : (type, msgcd, msg, callback) => {
		let dialog = document.getElementById(newScrmObj.constants.mdi.DIALOG);
		if ( !dialog) {
			dialog = document.createElement('div');
			dialog.id = newScrmObj.constants.mdi.DIALOG;
			document.body.appendChild(dialog);
		}

		// 메시지 처리 개선
		if( Array.isArray(msg) && msg.length > 0 ){
			if( msg.length > 1 ){
				msg = msg.join('\n');
			} else {
				msg = msg[0];
			}
		}

		// 객체인 경우 문자열로 변환
		if (typeof msg === 'object' && msg !== null) {
			msg = JSON.stringify(msg);
		}

		// override 
		if( callback === undefined){

			// 3개 인자 전달 시 마지막 인자가 콜백 함수인 경우
			if( typeof msg === 'function'){
//				msgcd = msg;
				callback = msg;
				msg = msgcd;
			} else if (typeof msg === 'undefined'){
				msg = msgcd;
			}
		}

		// let dialog = document.getElementById(newScrmObj.constants.mdi.DIALOG);
		// 안전한 다이얼로그 제거 함수
		const safeRemoveDialog = () => {
			try {
				if (dialog && dialog.parentNode) {
					dialog.parentNode.removeChild(dialog);
				}
			} catch (error) {
				console.warn('Dialog already removed:', error);
			}
		};

		if (type === 'C') {
			if (typeof callback === 'undefined' || typeof callback !== 'function') { return false; }
			renderToContainer(dialog, <Dialog.ConfirmDialog open={true} message={msg}  onReturnVal = {callback}
											onClose={ safeRemoveDialog }/>);
		} else {
			renderToContainer(dialog, <Dialog.AlertDialog   open={true} message={msg}
											onClose={ () => { 
												if( typeof callback === 'function'){
													callback();
												}
												safeRemoveDialog();
											} }/>);
		}
	},
	
	
	openPop : (url, name, options, callbackFunc) => {

		// 동적 팝업 라우트에서 검색
		const allPopupRoutes = getPopupRoutes();
		const popupRoutes = allPopupRoutes.filter(route => route.id === url);

		if( !popupRoutes || popupRoutes.length === 0 || (popupRoutes[0].npagYn !== 'Y' && popupRoutes[0].npagYn !== 'P') ) {
			ComLib.openModal(url, name, options, callbackFunc);
			return;
		}
		const popupRoute = popupRoutes[0];

		options = options || {};

		let sizeWidth = popupRoute.npagYn === 'P' ? '1000' : '800';
		let sizeHeight = popupRoute.npagYn === 'P' ? '800' : '600';
		if( popupRoute.scrnSize && popupRoute.scrnSize.indexOf(',') > 0 ){
			let arrScrnSize = popupRoute.scrnSize.split(',');
			sizeWidth = arrScrnSize[0].trim();
			sizeHeight = arrScrnSize[1].trim();
		}
		if( options.width && !isNaN(options.width)){
			sizeWidth = options.width;
		}

		if( options.height && !isNaN(options.height)){
			sizeHeight = options.height;
		}

		options.width = parseInt(sizeWidth) + 'px';
		options.height = parseInt(sizeHeight) + 'px';

		if( popupRoute.npagYn === 'P' ) {
			return ComLib._openWindow(popupRoute, options, callbackFunc);
		}

		ComLib.openModal(url, name, options, callbackFunc);
	},



	openModal : (url, name, options, callbackFunc) => {
		let arrPopTag = Object.values(document.body.children).filter(
			tag => tag.tagName === 'DIV'
		).filter(
			item => item.id.substring(0, newScrmObj.constants.mdi.POP_UP.length) === newScrmObj.constants.mdi.POP_UP
		);

		// 중복 체크 로직 추가 (openPlayer 패턴과 동일)
		let isAlreadyOpened = false;
		let existingPopupId = null;

		for (let i = 0; i < arrPopTag.length; i++) {
			let currentPopup = document.getElementById(arrPopTag[i].id + "_inner_div");
			
			if (currentPopup) {
				// data-popup-url 속성으로 URL 비교
				const popupUrl = currentPopup.getAttribute('data-popup-url');
				
				if (popupUrl === url) {
					isAlreadyOpened = true;
					existingPopupId = arrPopTag[i].id;
					
					// 기존 팝업을 최상위로 올림
					const parentElement = currentPopup.parentElement;
					if (parentElement) {
						parentElement.style.zIndex = '9992';
					}
				} else {
					// 다른 팝업들은 z-index 낮춤
					const parentElement = currentPopup.parentElement;
					if (parentElement) {
						parentElement.style.zIndex = '9991';
					}
				}
			}
		}

		// 이미 열려있으면 기존 팝업 ID 반환하고 종료
		if (isAlreadyOpened) {
			console.log(`[openModal] 이미 열린 팝업: ${url}`);
			return existingPopupId;
		}

		let popDiv = document.createElement('div');
		let position = {x: 0, y: 0};
		if (arrPopTag.length === 0) {
			popDiv.id = newScrmObj.constants.mdi.POP_UP + '_div_' + arrPopTag.length;
		} else {
			popDiv.id = newScrmObj.constants.mdi.POP_UP + '_div_' + (Number(arrPopTag[arrPopTag.length - 1].id.substr((newScrmObj.constants.mdi.POP_UP.length + '_div_'.length))) + 1).toString();
			position = { x : arrPopTag.length * 10,  y: arrPopTag.length * 10 }
		}
		document.body.appendChild(popDiv);

		options = options || {};
		options.modaless = options.modaless === undefined ? true : options.modaless;

		renderToContainer(popDiv, <Provider store={store}>
            	<GlobalProvider>  {/* ✅ GlobalProvider 추가 */}
				<Dialog.PopupDialog
					popupdivid = {popDiv.id}
					open={true}
					url={url}
					name={name}
					modaless={options.modaless}
					hideCloseButton={options.hideCloseButton}
					position = {position}
					options={options}
					onCallbackFunc={callbackFunc}
						onClose={
							() => {
								return new Promise ( (resolve, reject) => {
									try {
										if (typeof options.callback === "function") {
											try {
												options.callback();
											} catch (err) {
												reject(err);
											}
										}
										resolve();
									} catch (error) {
										reject(error);
									}
								}).then(function () {
									unmountFromContainer(document.getElementById(popDiv.id));
								}).catch(function (error) {
									console.log(error);
								}).then(function () {
									try{
										document.body.removeChild(popDiv);
									} catch (error) {
										console.log(error);
									}
								});
							}
						}
					/>
				</GlobalProvider>
			</Provider>);

		// 생성된 팝업에 URL 정보 저장 (중복 체크용)
		setTimeout(() => {
			const innerDiv = document.getElementById(popDiv.id + "_inner_div");
			if (innerDiv) {
				innerDiv.setAttribute('data-popup-url', url);
			}
		}, 100);

		return popDiv.id;
	},

	/*----------------------------------------------------------------------------------------
	* [모든 Modal 팝업 종료]
	* @return	:	integer - 종료된 팝업 개수
	* @see		:	openModal로 생성된 모든 팝업을 종료합니다.
	*--------------------------------------------------------------------------------------*/
	closeAllModals: () => {
		let arrPopTag = Object.values(document.body.children).filter(
			tag => tag.tagName === 'DIV'
		).filter(
			item => item.id.substring(0, newScrmObj.constants.mdi.POP_UP.length) === newScrmObj.constants.mdi.POP_UP
		);

		let closedCount = 0;
		
		for (let i = arrPopTag.length - 1; i >= 0; i--) {
			try {
				const popDiv = arrPopTag[i];
				const innerDiv = document.getElementById(popDiv.id + "_inner_div");
				
				if (innerDiv) {
					// React 컴포넌트 언마운트
					unmountFromContainer(popDiv);
				}
				
				// DOM에서 제거
				if (popDiv.parentNode) {
					document.body.removeChild(popDiv);
					closedCount++;
					console.log(`[closeAllModals] 팝업 종료: ${popDiv.id}`);
				}
			} catch (error) {
				console.error(`[closeAllModals] 팝업 종료 중 오류:`, error);
			}
		}
		
		console.log(`[closeAllModals] 총 ${closedCount}개 팝업 종료 완료`);
		return closedCount;
	},

	/*----------------------------------------------------------------------------------------
	* [특정 팝업 종료]
	* @param	:	string popupId - 종료할 팝업 ID (예: 'popup_div_0')
	* @return	:	boolean - 종료 성공 여부
	* @see		:	지정된 ID의 팝업을 종료합니다.
	*--------------------------------------------------------------------------------------*/
	closeModal: (popupId) => {
		if (!popupId) {
			console.warn('[closeModal] popupId가 제공되지 않았습니다.');
			return false;
		}

		try {
			const popDiv = document.getElementById(popupId);
			
			if (!popDiv) {
				console.warn(`[closeModal] 팝업을 찾을 수 없습니다: ${popupId}`);
				return false;
			}

			// React 컴포넌트 언마운트
			unmountFromContainer(popDiv);
			
			// DOM에서 제거
			if (popDiv.parentNode) {
				document.body.removeChild(popDiv);
				console.log(`[closeModal] 팝업 종료: ${popupId}`);
				return true;
			}
			
			return false;
		} catch (error) {
			console.error(`[closeModal] 팝업 종료 중 오류:`, error);
			return false;
		}
	},

	/*----------------------------------------------------------------------------------------
	* [자식 Modal 팝업 종료]
	* @param	:	string parentPopupId - 부모 팝업 ID (선택적, 미제공 시 현재 컨텍스트)
	* @return	:	integer - 종료된 팝업 개수
	* @see		:	특정 부모 팝업에서 열린 하위 팝업들을 종료합니다.
	*			부모 팝업 ID를 제공하지 않으면 현재 컨텍스트에서 열린 모든 하위 팝업을 종료합니다.
	*--------------------------------------------------------------------------------------*/
	closeChildModals: (parentPopupId) => {
		let arrPopTag = Object.values(document.body.children).filter(
			tag => tag.tagName === 'DIV'
		).filter(
			item => item.id.substring(0, newScrmObj.constants.mdi.POP_UP.length) === newScrmObj.constants.mdi.POP_UP
		);

		// parentPopupId가 제공되지 않은 경우, 현재 컨텍스트 감지
		if (!parentPopupId) {
			// 현재 활성화된 팝업 감지 (z-index가 가장 높은 것)
			let highestZIndex = -1;
			let activePopup = null;

			arrPopTag.forEach(popDiv => {
				const innerDiv = document.getElementById(popDiv.id + "_inner_div");
				if (innerDiv) {
					const parentElement = innerDiv.parentElement;
					if (parentElement) {
						const zIndex = parseInt(window.getComputedStyle(parentElement).zIndex) || 0;
						if (zIndex > highestZIndex) {
							highestZIndex = zIndex;
							activePopup = popDiv;
						}
					}
				}
			});

			if (activePopup) {
				parentPopupId = activePopup.id;
				console.log(`[closeChildModals] 현재 활성 팝업: ${parentPopupId}`);
			} else {
				console.log('[closeChildModals] 활성 팝업을 찾을 수 없습니다. 모든 팝업을 종료합니다.');
				return ComLib.closeAllModals();
			}
		}

		// 부모 팝업의 인덱스 추출
		const parentIndexMatch = parentPopupId.match(/_div_(\d+)$/);
		if (!parentIndexMatch) {
			console.warn(`[closeChildModals] 유효하지 않은 팝업 ID: ${parentPopupId}`);
			return 0;
		}

		const parentIndex = parseInt(parentIndexMatch[1]);
		let closedCount = 0;

		// 부모 인덱스보다 큰 인덱스를 가진 팝업들을 종료 (나중에 열린 팝업들)
		for (let i = arrPopTag.length - 1; i >= 0; i--) {
			try {
				const popDiv = arrPopTag[i];
				const indexMatch = popDiv.id.match(/_div_(\d+)$/);
				
				if (indexMatch) {
					const currentIndex = parseInt(indexMatch[1]);
					
					// 부모보다 나중에 열린 팝업만 종료
					if (currentIndex > parentIndex) {
						const innerDiv = document.getElementById(popDiv.id + "_inner_div");
						
						if (innerDiv) {
							// React 컴포넌트 언마운트
							unmountFromContainer(popDiv);
						}
						
						// DOM에서 제거
						if (popDiv.parentNode) {
							document.body.removeChild(popDiv);
							closedCount++;
							console.log(`[closeChildModals] 하위 팝업 종료: ${popDiv.id}`);
						}
					}
				}
			} catch (error) {
				console.error(`[closeChildModals] 팝업 종료 중 오류:`, error);
			}
		}

		console.log(`[closeChildModals] 총 ${closedCount}개 하위 팝업 종료 완료`);
		return closedCount;
	},


	_openWindow : (popupRoute, options, callbackFunc) => {	

		// 새창으로 열기
		const popupUrl = popupRoute.path;
		const popupName = popupRoute.id;
		let sizeWidth = options.width;
		let sizeHeight = options.height;

		const popupFeatures = 'width=' + sizeWidth + ',height=' + sizeHeight + ',scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no';
		
		// debugger;
		console.log(`✅ SideMenu 팝업 창 열기: ${popupUrl}`);

		// console.log('SideMenu: window.open', popupUrl, popupName, popupFeatures);
		const popupId = PopupManager.open(
			popupUrl, 
			popupName, 
			popupFeatures,
			options || {},
			// 팝업 로드 완료 후 실행될 콜백
			(popupId, popupInfo, popupWindow) => {
				if( typeof callbackFunc === 'function'){
					callbackFunc(popupId, popupInfo, popupWindow);
				}
			});

		return popupId;
	},



	openPlayer : (options, callbackFunc) => {
		options.height = '810px';
		let title = 'STT플레이어 : ' + (options.useUuid === true ? options.UUID : options.callId);
		
		// ComLib.openPop('STT000001', title, options, callbackFunc);

		let arrPlayerTag = Object.values(document.body.children).filter(
			tag => tag.tagName === 'DIV'
		).filter(
			item => item.id.substring(0, newScrmObj.constants.mdi.PLAYER.length) === newScrmObj.constants.mdi.PLAYER
		);
		
		let isAreadyOpened = false;

		for (let i = 0; i < arrPlayerTag.length; i ++) {
			let currentplayer = document.getElementById(arrPlayerTag[i].id + "_inner_div").parentElement;

			if (arrPlayerTag[i].id === newScrmObj.constants.mdi.PLAYER + '_div_' + (options.useUuid === true ? options.UUID : options.callId)) {				
				isAreadyOpened = true;
				currentplayer.style.zIndex = '9992'

			} else {
				
				currentplayer.style.zIndex = '9991'
			}
		}

		if (isAreadyOpened) {
			return;
		}

		let playerDiv = document.createElement('div');
		let position = {x: 0, y: 0};

		if (arrPlayerTag.length === 0) {
			playerDiv.id = newScrmObj.constants.mdi.PLAYER + '_div_' + (options.useUuid === true ? options.UUID : options.callId);
		} else {
			playerDiv.id = newScrmObj.constants.mdi.PLAYER + '_div_' + (options.useUuid === true ? options.UUID : options.callId);
			position = { x : arrPlayerTag.length * 10,  y: arrPlayerTag.length * 10 }
		}
		
		document.body.appendChild(playerDiv);

		renderToContainer(playerDiv, <Provider store={store}>
				<Dialog.PopupDialog
					popupdivid = {playerDiv.id}
					open={true}
					url={'STT000001'}
					name={title}
					modaless={options.modaless}
					// hideCloseButton={options.hideCloseButton}
					position = {position}
					options={options}
					onCallbackFunc={callbackFunc}
					onClose={
						() => {
							return new Promise ( (resolve, reject) => {
								try {
									if (typeof options.callback === "function") {
										try {
											options.callback();
										} catch (err) {
											reject(err);
										}
									}
									resolve();
								} catch (error) {
									reject(error);
								}
							}).then(function () {
								unmountFromContainer(document.getElementById(playerDiv.id));
							}).catch(function (error) {
								console.log(error);
							}).then(function () {
								document.body.removeChild(playerDiv);
							});
						}
					}
				/>
			</Provider>);

		return playerDiv.id;
			
	},
	openRealTime : (options, callbackFunc) => {
		options.height = '810px';
		// let title = 'STT플레이어 : ' + (options.useUuid === true ? options.UUID : options.callId);
		let title = options.params.CONST_NM + "(" + options.params.CONST_CD + ")";
		
		// ComLib.openPop('STT000001', title, options, callbackFunc);

		let arrRealTimeTag = Object.values(document.body.children).filter(
			tag => tag.tagName === 'DIV'
		).filter(
			item => item.id.substring(0, newScrmObj.constants.mdi.realTime.length) === newScrmObj.constants.mdi.realTime
		);
		
		let isAreadyOpened = false;

		for (let i = 0; i < arrRealTimeTag.length; i ++) {
			let currentRealTime = document.getElementById(arrRealTimeTag[i].id + "_inner_div").parentElement;

			if (arrRealTimeTag[i].id === newScrmObj.constants.mdi.realTime + '_div_' + options.params.CONST_CD + "_" + options.params.CALL_ID) {				
				isAreadyOpened = true;
				currentRealTime.style.zIndex = '9992'

			} else {
				
				currentRealTime.style.zIndex = '9991'
			}
		}

		if (isAreadyOpened) {
			return;
		}

		let realTimeDiv = document.createElement('div');
		let position = {x: 0, y: 0};

		if (arrRealTimeTag.length === 0) {
			realTimeDiv.id = newScrmObj.constants.mdi.realTime + '_div_' + options.params.CONST_CD + "_" + options.params.CALL_ID;
		} else {
			realTimeDiv.id = newScrmObj.constants.mdi.realTime + '_div_' + options.params.CONST_CD + "_" + options.params.CALL_ID;
			position = { x : arrRealTimeTag.length * 10,  y: arrRealTimeTag.length * 10 }
		}
		
		document.body.appendChild(realTimeDiv);

		renderToContainer(realTimeDiv, <Provider store={store}>
				<Dialog.PopupDialog
					popupdivid = {realTimeDiv.id}
					open={true}
					url={'STT010001'}
					name={title}
					modaless={options.modaless}
					// hideCloseButton={options.hideCloseButton}
					position = {position}
					options={options}
					onCallbackFunc={callbackFunc}
					onClose={
						() => {
							return new Promise ( (resolve, reject) => {
								try {
									if (typeof options.callback === "function") {
										try {
											options.callback();
										} catch (err) {
											reject(err);
										}
									}
									resolve();
								} catch (error) {
									reject(error);
								}
							}).then(function () {
								unmountFromContainer(document.getElementById(realTimeDiv.id));
							}).catch(function (error) {
								console.log(error);
							}).then(function () {
								document.body.removeChild(realTimeDiv);
							});
						}
					}
				/>
			</Provider>);

		return realTimeDiv.id;
		
	},

	openExternalDirectUrl : (url, name, options) => {
		options = options || 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no';
		name = name || '외부 어시스트';
		window.open(url, name, options);
	},



	writeTxtFile : (strData, strFileName) => {
		let file = new Blob([strData], {type: 'text/plain'});

		/// IE
		if (navigator.appVersion.toString().indexOf('.NET') > 0)
			window.navigator.msSaveBlob(file, strFileName);
		/// Chrome
		else{
			let element = document.createElement("a");
			element.href = window.URL.createObjectURL(file);
			element.download = strFileName;
			element.click();
		}
	},
	/*
	 * TODO: 사용자 정보 반환 로직 변경 필요
	 */
	getSessionUserInfo : (attributeName) => {
		let userInfo = (() => {
			let userList = ComLib.getSession("gdsUserInfo");
			if( userList == null) {
				return {};
			}
			return userList;
		})();

		if( attributeName){
			return userInfo[attributeName] || "";
		} else {
			return userInfo;
		}
	},

	logout : () => {
		// 로그아웃 시 모든 팝업 닫기
		if (window.closeAllPopups) {
			console.log('[ComLib.logout] 팝업 닫기 시작');
			const closedCount = window.closeAllPopups();
			console.log(`[ComLib.logout] ${closedCount}개 팝업 닫기 완료`);
		} else {
			console.warn('[ComLib.logout] PopupManager가 로드되지 않았습니다');
		}
		
		ComLib.clearSession();
		ComLib.setSession("logoutComplete", true);
		window.location.reload();
	},

	// 쿠키 기반 인증 상태 확인 함수
	isAuthenticated: () => {
		// 서버에서 HttpOnly 쿠키로 관리되므로 직접 확인 불가
		// 대신 사용자 정보 존재 여부로 판단
		const userInfo = ComLib.getSessionUserInfo();
		return userInfo && userInfo.userId;
	},

	getLoginUser : (attributeName) => {
		return ComLib.getSessionUserInfo(attributeName);
	},

	getComCodeValue : (sBigCtgCd) => {
		var arr = ComLib.getCommCodeList(sBigCtgCd).map(item => { return item['value']});
		return arr;
	},
	getComCodeName : (sBigCtgCd, value) => {
		let arr = ComLib.getCommCodeList(sBigCtgCd).filter(ele => ele['value'] === value);
		if (arr.length === 0) return '';
		else return arr[0]['name'];
	},
	/*
	 * @Deprecated
	 */
	getComCodeCdVal : (sBigCtgCd, value) => {
		let arr = ComLib.getCommCodeList(sBigCtgCd).filter(ele => ele['value'] === value);
		if (arr.length === 0) return '';
		else return arr[0]['CD_VAL'];
	},
	setDisableByAuth : (tgtOrg, blnQa) => {
		if (blnQa) {
			if (newScrmObj.constants.select.authControl['QA'][tgtOrg].filter(item => item === ComLib.getSessionUserInfo('orgnInqRangCd')).length > 0) {
				return true;
			}
		} else {
			if (newScrmObj.constants.select.authControl['CSR'][tgtOrg].filter(item => item === ComLib.getSessionUserInfo('orgnInqRangCd')).length > 0) {
				if (ComLib.getSessionUserInfo('orgnInqRangCd') === 6)  {
					if (tgtOrg !== 'CENT') {
						if (ComLib.getSessionUserInfo()['TEAM_TP_CD'] === 'Q') {
							return false;
						}
					}
				}
				return true;
			}
		}
		return false;
	},

	/*
	 * @Deprecated
	 */
	setOrgComboValue : (orgCode, blnQa) => {
		let code = orgCode.substring(0, orgCode.length-3);
		if  (code === "USR") code = "USER";

		if (blnQa) {
			if (newScrmObj.constants.select.authControl['QA'][code].filter(item => item === ComLib.getSessionUserInfo('orgnInqRangCd')).length > 0) {
				if (orgCode !== 'CENT_CD') {
					if (ComLib.getSessionUserInfo()['TEAM_TP_CD'] === 'Q') {
						return ComLib.getSessionUserInfo()[orgCode];
					}
				} else {
					return ComLib.getSessionUserInfo()[orgCode];
				}
			}
		} else {
			if (newScrmObj.constants.select.authControl['CSR'][code].filter(item => item === ComLib.getSessionUserInfo('orgnInqRangCd')).length > 0) {
				if (orgCode !== 'CENT_CD') {
					if (ComLib.getSessionUserInfo()['TEAM_TP_CD'] !== 'Q') {
						return ComLib.getSessionUserInfo()[orgCode];
					}
				} else {
					return ComLib.getSessionUserInfo()[orgCode];
				}
			}
		}
		return "";
	},
	/*----------------------------------------------------------------------------------------
	* [대분류 코드에 해당하는 소분류 공통코드를 갖고온다]
	* @param	:	string sBigCtgCd
	* @return	:	array
	* @see		:	1. sBigCtgCd : 공통코드 대분류 코드
					2. 성공 => 대분류 코드에 해당하는 소분류 코드를 array로 return
					   실패 => empty array return
	*--------------------------------------------------------------------------------------*/
	getCommCodeList: (sBigCtgCd, sMdlCtgCd) => {
		let commCodeList = [];
		if (!StrLib.isNull(sessionStorage.getItem('gdsCommCode'))) {
			commCodeList = JSON.parse(sessionStorage.getItem('gdsCommCode'));
			commCodeList = commCodeList.filter(item => item.cdGroup === sBigCtgCd);
		}
		return commCodeList;
	},

	/*----------------------------------------------------------------------------------------
	* [기준 코드에 해당하는 사용자 센터의 기준값을 갖고 온다]
	* @param	:	string strStndCd, string strTargetCol
	* @return	:	string
	* @see		:	1. strStndCd : 기준코드
					2. strTargetCol : 대상 컬럼 ID ( 예 : 'ETC1_CONT' )
					3. 성공 => 사용자 센터에 등록된 기준값 정보에서 해당 기준 코드
						-> 대상 컬럼의 Value를 return
					   실패 => '' return
	*--------------------------------------------------------------------------------------*/
	/*
	 * @Deprecated
	 */
	getCentStndVl: (strStndCd, strTargetCol) => {
		console.warn("deprecated function getCentStndVl");
		return null;
		/*
		var strRtn = "";
		var arrStndVl = ComLib.getSession("gdsCentStndVl");

		if (typeof arrStndVl === "object") {
			for (var idx = 0; idx < arrStndVl.length; idx++) {
				if (arrStndVl[idx].STND_CD === strStndCd) {
					if (arrStndVl[idx].APY_YN === "Y") {
						strRtn = arrStndVl[idx][strTargetCol];
					} else {
						if (strTargetCol === 'APY_YN') strRtn = "N";
						else strRtn = "";
					}
				}
			}
		}
		return strRtn;
		*/
	},

	getInitScreen: () => {
		var rtn = {};
		rtn = ComLib.getSession("gdsMenu")[0];
		return rtn;
	},

	/*----------------------------------------------------------------------------------------
	* [이미 변경된 Dataset을 react state에 Update]
	* @param	:	object obj, string strDatasetId
	* @return	:
	* @see		:	1. obj : setState 대상 화면 Object (this)
					2. strDatasetId : 변경 대상 Dataset ID
	*--------------------------------------------------------------------------------------*/
	setStateDs: (obj, strDatasetId, callback) => {
		obj.setState((state) => { return DataLib.setRecordsToDs(state, strDatasetId, state[strDatasetId].records); }, () => {
			if (typeof callback === 'function') callback();
		});

	},
	/*----------------------------------------------------------------------------------------
	* [변경된 Dataset Value를 Target Dataset, react state에 Update]
	* @param	:	object obj, string strDatasetId, integer nRowIndex, string strColumnId, string strValue
	* @return	:
	* @see		:	1. obj : setState 대상 화면 Object (this)
					2. strDatasetId : 변경 대상 Dataset ID
					3. nRowIndex : 변경 대상 Row Index
					4. strColumnId : 변경 대상 Column ID
					5. strValue : 변경 Value
	*--------------------------------------------------------------------------------------*/
	setStateValue: (obj, strDatasetId, nRowIndex, strColumnId, strValue, callback) => {
		obj.setState((state) => { return DataLib.setValueToDs(state, strDatasetId, nRowIndex, strColumnId, strValue); }, () => {
			if (typeof callback === 'function') callback();
		});
	},

	/*----------------------------------------------------------------------------------------
	* [변경된 Dataset Records를 Target Dataset, react state에 Update]
	* @param	:	object obj, string strDatasetId, array arrRecords
	* @return	:
	* @see		:	1. obj : setState 대상 화면 Object (this)
					2. strDatasetId : 변경 대상 Dataset ID
					3. arrRecords : 변경 데이터 array
	*--------------------------------------------------------------------------------------*/
	setStateRecords: (obj, strDatasetId, objRecords, callback) => {

		let objDs = obj.state[strDatasetId];
		if(!objDs){
			console.error(`setStateRecords: ${strDatasetId} is not found`);
			return;
		} 

		// 데이터 변경 (setRecords 메서드가 내부적으로 페이징 처리)
		// 인피니트 스크롤의 경우 setRecords에서 first 페이지 여부에 따라 initRecords/appendRecords를 자동 처리
		let updatedDs = DataLib.setRecordsToDs(obj.state, strDatasetId, objRecords);
		
		obj.setState( updatedDs, () => {
			if(typeof callback === 'function') callback(obj);
		});
	},

	isPagingDataset: (objDs) => {
		return !(!objDs || objDs.content === undefined || objDs.totalElements === undefined);
	},

	/*----------------------------------------------------------------------------------------
	* [Dataset Records를 Initialize]
	* @param	:	object obj, string strDatasetId, array arrRecords
	* @return	:
	* @see		:	1. obj : setState 대상 화면 Object (this)
					2. strDatasetId : 변경 대상 Dataset ID
					3. arrRecords : 변경 데이터 array
	*--------------------------------------------------------------------------------------*/
	setStateInitRecords: (obj, strDatasetId, arrRecords) => {
		obj.setState((state) => { return DataLib.initRecordsToDs(state, strDatasetId, arrRecords); });
	},

	/*----------------------------------------------------------------------------------------
	* [SelectBox List로 변환]
	* @param	:	array arrRecords, string args
	* @return	:	array
	* @see		:	1. arrRecords : select inner list data
					2. args : list add flag (all : 전체 / select : 선택 / none)
					3. options : { valueField: 'value', nameField: 'name' } - 사용할 필드명 지정 (선택사항)
	*--------------------------------------------------------------------------------------*/
	convComboList: (arrRecords, args, options) => {
		var arr = [];
		// 필드명 설정 (기본값: value, name)
		var valueField = (options && options.valueField) ? options.valueField : "value";
		var nameField = (options && options.nameField) ? options.nameField : "name";
		var subField = (options && options.subField) ? options.subField : "sub";
		
		if (args === newScrmObj.constants.select.argument.all) {
			arr.push({value: "", name: "전체"});
		} else if (args === newScrmObj.constants.select.argument.select) {
			arr.push({value: "", name: "선택"});
		}
		
		for (var index = 0; index < arrRecords.length; index++) {
			if (!StrLib.isNull(arrRecords[index][subField])) {
				arr.push({value: arrRecords[index][valueField], name: arrRecords[index][nameField], sub: arrRecords[index][subField]});
			}else{
				arr.push({value: arrRecords[index][valueField], name: arrRecords[index][nameField]});
			}
		}
		return arr;
	},

	/*----------------------------------------------------------------------------------------
	* [메시지 코드에 해당하는 메시지 내용을 갖고 온다]
	* @param	:	string msgcd, array args
	* @return	:	string
	* @see		:	1. msgcd : 메시지 코드
					2. args : 메시지 내용 Replace value
					3. select inner list array return
	*--------------------------------------------------------------------------------------*/
	getMsgCont: (msgcd, args) => {
		console.warn("deprecated function getMsgCont ", msgcd, args);
		return args;
	},

	setServerInfos: () => {
		const { protocol, hostname, port } = window.location;
		const svrUrl = (port && port !== '80' && port !== '443')
			? `${protocol}//${hostname}:${port}`
			: `${protocol}//${hostname}`;
		
		
		// Vite 환경: process 전역이 없어 미정의 process.env.* 접근은 예외 → 안전 가드(미설정 시 'local')
		const env = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ENV) || 'local';
		let systemDv = "";

		if(env === 'prod' || env === 'demo'){
			systemDv = 'P';
			ComLib.setSession("SVR_URL", svrUrl);
		} else if(env === 'dev'){
			systemDv = 'D';
			ComLib.setSession("SVR_URL", svrUrl);
		} else {
			systemDv = 'L';
			// 로컬(Vite dev): 상대경로 사용 → Vite 프록시(/api,/login,/logout)가 백엔드로 전달(CORS 회피, 세션쿠키 동일출처)
			ComLib.setSession("SVR_URL", "");
		}

		ComLib.setSession("SYSTEM_DV", systemDv);
	  },

	/*
	 * @Deprecated
	 */
	getCentList: (blnBizPsb) => { //BIZ_PSB_YN Filtering
		console.warn("deprecated function getCentList");
		return null;
		/*
		if (ComLib.isNull(blnBizPsb)) blnBizPsb = false;
		let arrCentList = ComLib.getSession("gdsCentList");
		if (blnBizPsb) arrCentList = arrCentList.filter(item => item.BIZ_PSB_YN === 'Y');
		return arrCentList;
		*/
	},

	/*
	 * @Deprecated
	 */
	getTeamList: (objDs, teamType) => { //Filtering 필요한 경우 추가
		console.warn("deprecated function getTeamList");
		return null;
		/*
		let arrTeamList = ComLib.getSession("gdsTeamList");
		teamType = (StrLib.isNull(teamType)) ? newScrmObj.constants.select.dataType.all : teamType;
		if (!StrLib.isNull(objDs.getValue(0, "CENT_CD"))) {
			if (teamType !== newScrmObj.constants.select.dataType.all) {
				arrTeamList = ComLib.getSession("gdsTeamList").filter(item => item.CENT_CD === objDs.getValue(0, "CENT_CD")).filter(item => item['TP_CD'] === teamType);
			} else {
				arrTeamList = ComLib.getSession("gdsTeamList").filter(item => item.CENT_CD === objDs.getValue(0, "CENT_CD"));
			}
		}
		return arrTeamList;
		*/
	},

	/*
	 * @Deprecated
	 */
	getUserList: (objDs, blnActive) => { //Active Filtering
		console.warn("deprecated function getUserList");
		return null;
		/*
		if (ComLib.isNull(blnActive)) blnActive = true;

		let arrUsrList = ComLib.getSession("gdsUserList");
		if (!StrLib.isNull(objDs.getValue(0, "CENT_CD")))
			arrUsrList = arrUsrList.filter(item => item.CENT_CD === objDs.getValue(0, "CENT_CD"));
		if (!StrLib.isNull(objDs.getValue(0, "TEAM_CD")))
			arrUsrList = arrUsrList.filter(item => item.TEAM_CD === objDs.getValue(0, "TEAM_CD"));
		if (blnActive)
			arrUsrList = arrUsrList.filter(usr => usr.ACT_STA_CD === 'A');

		return arrUsrList;
		*/
	},

// KKO 추가 함수 시작
  /**
   * 회원사 API 프록시(desk) 실패 메시지 여부.
   * CompanyApiAdapter 가 만드는 "회원사 API 호출 실패" 시그니처만 매칭한다(다른 오류엔 영향 없음).
   */
  isCompanyApiProxyError: (resOrMessage) => {
    // 구조화된 에러코드(error==='CompanyApiError')로 우선 판정, 없으면 레거시 메시지 부분일치로 폴백
    if (resOrMessage && typeof resOrMessage === 'object') {
      const body = (resOrMessage.data && typeof resOrMessage.data === 'object') ? resOrMessage.data : resOrMessage;
      const code = (body && body.error) || resOrMessage.error;
      if (code) return code === 'CompanyApiError';
      const msg = resOrMessage.message || (body && body.message) || '';
      return typeof msg === 'string' && msg.indexOf('회원사 API 호출 실패') >= 0;
    }
    return typeof resOrMessage === 'string' && resOrMessage.indexOf('회원사 API 호출 실패') >= 0;
  },

  /**
   * 실패 응답/메시지 → { cause, action, raw } 로 번역(인라인 배너/버튼 비활성화 판단용).
   * 회원사 API 프록시(desk) 실패는 응답 statusCode(에러코드) 별 원인+조치로, 그 외는 일반 안내로 분기.
   * 응답객체가 주어지면 error/status 필드로 판정하고, 문자열만 주어지면 메시지 부분일치로 폴백한다.
   * @param resOrMessage 응답객체(res) 또는 메시지 문자열
   */
  getApiErrorInfo: (resOrMessage) => {
    let raw = '';
    let errorCode = '';
    let statusCode = null;
    if (typeof resOrMessage === 'string') {
      raw = resOrMessage;
    } else if (resOrMessage) {
      const body = (resOrMessage.data && typeof resOrMessage.data === 'object') ? resOrMessage.data : resOrMessage;
      raw = resOrMessage.message || (body && body.message) || '';
      errorCode = (body && body.error) || resOrMessage.error || '';
      const s = (body && body.status != null) ? body.status : (resOrMessage.status != null ? resOrMessage.status : null);
      statusCode = (typeof s === 'number') ? s : (typeof s === 'string' && /^\d+$/.test(s) ? Number(s) : null);
    }
    // 회원사 API 프록시 실패 여부: 에러코드 우선, 없으면 메시지 시그니처로 폴백
    const proxy = errorCode ? (errorCode === 'CompanyApiError') : ComLib.isCompanyApiProxyError(raw);
    // statusCode 가 있으면 숫자 비교, 없으면(문자열 입력) 메시지 부분일치로 폴백
    const hasStatus = (code) => (statusCode != null) ? (statusCode === code) : (raw.indexOf(String(code)) >= 0);
    const isUnavailable = () => (statusCode != null)
      ? (statusCode === 503 || statusCode === 504 || statusCode === 500)
      : (raw.indexOf('연결할 수 없') >= 0 || raw.indexOf('503') >= 0 || raw.indexOf('타임아웃') >= 0 || raw.indexOf('timeout') >= 0 || raw.indexOf('Timeout') >= 0 || raw.indexOf('500') >= 0);
    let cause, action;
    if (proxy && hasStatus(403)) {
      cause = '회원사 서버가 접근을 거부했습니다 (403 · 권한 없음).';
      action = '회원사 서버 간 인증(API 인증정보)·접근 권한 설정을 확인하세요. (API 서버 URL·연결 자체는 정상)';
    } else if (proxy && hasStatus(401)) {
      cause = '회원사 서버 인증에 실패했습니다 (401).';
      action = '[기본정보] 탭의 API 인증 정보(키/토큰)를 확인·갱신하세요.';
    } else if (proxy && hasStatus(404)) {
      cause = '회원사 서버에서 해당 API를 찾을 수 없습니다 (404).';
      action = 'API 서버 URL/버전 또는 회원사 서버 배포 상태를 확인하세요.';
    } else if (proxy && isUnavailable()) {
      cause = '회원사 API 서버에 연결할 수 없습니다.';
      action = '[기본정보] 탭의 API 서버 URL이 올바른지, 회원사 서버가 기동 중인지 확인하세요.';
    } else if (proxy) {
      cause = '회원사 API 호출에 실패했습니다.';
      action = 'API 서버 URL과 서버 상태를 확인하세요.';
    } else {
      cause = raw || '조회 중 오류가 발생했습니다.';
      action = '잠시 후 다시 시도하거나 서버 상태를 확인해 주세요.';
    }
    return { cause, action, raw };
  },

  /** 회원사 API 실패 응답/메시지 → 비차단 토스트용 한 줄 문구(getApiErrorInfo 재사용) */
  describeCompanyApiError: (resOrMessage) => {
    const info = ComLib.getApiErrorInfo(resOrMessage);
    return info.cause + ' 조치: ' + info.action;
  },

  /*----------------------------------------------------------------------------------------
  * [API 응답 처리 핸들러]
  * @param	:	object res - API 응답 객체
  * @param	:	string actionType - 액션 타입 ('search', 'save' 등)
  * @return	:	boolean - 처리 성공 여부
  * @see		:	API 호출 후 응답을 받아 성공/실패 메시지를 처리하고, 데이터 유무를 판단.
  *--------------------------------------------------------------------------------------*/
  handleResponse: (res, actionType = 'search') => {
      if (res.result === 'success') {
        //   if (actionType === 'search') {
        //       let hasData = false;
        //       if (Array.isArray(res.data)) {
        //           if (res.data.length > 0) hasData = true;
        //       } else if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
        //           hasData = true;
        //       }
        //   } else {
        //       const message = res.message || '처리가 완료되었습니다.';
        //   }
          return true;

      } else {
          // 회원사 API 프록시(desk) 실패는 차단 모달 대신 비차단 안내(원인+조치)로 강등
          // — 사용자가 다른 탭/작업 중에도 흐름을 막지 않도록. (org 탭은 자체 인라인 배너 사용)
          // 응답객체(res)를 그대로 전달하여 error/status 필드 기반으로 판정한다.
          if (ComLib.isCompanyApiProxyError(res)) {
              ComLib.showMessage(ComLib.describeCompanyApiError(res), 'error');
              return false;
          }
          // 백엔드 오류 메시지는 res.message 또는 res.data.message(에러 응답 ErrorResponse)에 담김
          // → 서버가 준 구체 메시지(예: "서버 상태를 점검해 주세요")를 우선 표시
          const serverMessage = res.message || (res.data && res.data.message);
          ComLib.openAlertDialog(serverMessage || '처리 중 오류가 발생했습니다.', 'error');
          return false;
      }
  },

  /*----------------------------------------------------------------------------------------
  * [범용 입력 변경 핸들러]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 상태 객체의 키 (예: 'dsSearch', 'formData')
  * @param	:	string fieldId - 상태 객체 내에서 해당 입력 필드의 값을 저장할 필드 ID
  * @param	:	function callback - 상태 업데이트 후 실행될 콜백 함수
  * @return	:	function - 이벤트 핸들러 함수
  * @see		:	다양한 입력 컴포넌트에서 사용. 이벤트 객체의 구조에 따라 값을 추출하여 해당 state를 업데이트.
  *--------------------------------------------------------------------------------------*/
  handleChange: (componentName, component, stateKey, fieldId, callback) => (e) => {
      const compName = componentName || 'ComLib'; // Default to ComLib if no name provided

      if (!component || !component.setState) {
          ComLib.openAlertDialog(`${compName}: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.`);
          return;
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog(`${compName}: 'stateKey' 파라미터는 문자열이어야 합니다.`);
          return;
      }
      if (!fieldId || typeof fieldId !== 'string') {
          ComLib.openAlertDialog(`${compName}: 'fieldId' 파라미터는 문자열이어야 합니다.`);
          return;
      }
      if (callback && typeof callback !== 'function') {
          ComLib.openAlertDialog(`${compName}: 'callback' 파라미터는 함수여야 합니다.`);
          return;
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`${compName}: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return;
      }

      let newValue;
      switch (componentName) {
          case 'Textfield':
          case 'Textarea':
          case 'TextPasswdfield':
          case 'Selectbox':
          case 'InputCalendar':
          case 'ToggleButtonGroup':
          case 'ComboList':
              newValue = e.target.value;
              break;
          case 'Checkbox':
              newValue = e.checked ? 'Y' : '';
              break;
          case 'Radio':
              newValue = e.value;
              break;
          default:
              ComLib.openAlertDialog(`${compName}: 알 수 없는 컴포넌트 타입입니다. 이벤트 객체 'e'가 유효하지 않거나 'value' 속성이 없습니다.`);
              return;
      }
      component.setState(prevState => ({
          [stateKey]: {
              ...prevState[stateKey],
              [fieldId]: newValue
          }
      }), callback);
  },

  /*----------------------------------------------------------------------------------------
  * [날짜 범위 입력 변경 핸들러]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 상태 객체의 키 (예: 'dsSearch')
  * @param	:	string startField - 시작 날짜 필드명 (예: 'startDate')
  * @param	:	string endField - 종료 날짜 필드명 (예: 'endDate')
  * @param	:	function callback - 상태 업데이트 후 실행될 콜백 함수
  * @return	:	function - 이벤트 핸들러 함수
  * @see		:	<RangeInputCalendar> 컴포넌트 등에서 사용. 시작/종료 날짜를 이용해 해당 state를 업데이트.
  *--------------------------------------------------------------------------------------*/
  handleRangeCalendarChange: (component, stateKey, startField, endField, callback) => (e) => {
      if (!component || !component.setState) {
          ComLib.openAlertDialog("RangeCalendar: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.");
          return;
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog("RangeCalendar: 'stateKey' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!startField || typeof startField !== 'string' || !endField || typeof endField !== 'string') {
          ComLib.openAlertDialog("RangeCalendar: 'startField' 또는 'endField' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!e || e.startDate === undefined || e.endDate === undefined) {
          ComLib.openAlertDialog("RangeCalendar: 이벤트 객체 'e'에 'startDate' 또는 'endDate' 속성이 없습니다.");
          return;
      }
      if (callback && typeof callback !== 'function') {
          ComLib.openAlertDialog("RangeCalendar: 'callback' 파라미터는 함수여야 합니다.");
          return;
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`RangeCalendar: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return;
      }
      component.setState(prevState => ({
          [stateKey]: {
              ...prevState[stateKey],
              [startField]: e.startDate,
              [endField]: e.endDate
          }
      }), callback);
  },

  /*----------------------------------------------------------------------------------------
  * [멀티 체크박스 변경 핸들러]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 상태 객체 내 선택된 코드들을 저장하는 키
  * @param	:	string datasetKey - 전체 체크박스 항목 데이터셋의 키
  * @param	:	function callback - 상태 업데이트 후 실행될 콜백 함수
  * @return	:	function - 이벤트 핸들러 함수
  * @see		:	멀티 체크박스 컴포넌트에서 사용. 선택된 항목의 코드를 state에 추가/제거.
  *--------------------------------------------------------------------------------------*/
  handleMultiCheckboxChange: (component, stateKey, fieldId, datasetKey, callback) => (e) => { // fieldId 파라미터 추가
      if (!component || !component.setState) {
          ComLib.openAlertDialog("MultiCheckbox: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.");
          return;
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog("MultiCheckbox: 'stateKey' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!fieldId || typeof fieldId !== 'string') { // fieldId 유효성 검사 추가
          ComLib.openAlertDialog("MultiCheckbox: 'fieldId' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!datasetKey || typeof datasetKey !== 'string') {
          ComLib.openAlertDialog("MultiCheckbox: 'datasetKey' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!e || e.id === undefined || e.index === undefined || e.checked === undefined) {
          ComLib.openAlertDialog("MultiCheckbox: 이벤트 객체 'e'에 'id', 'index', 'checked' 속성이 없습니다.");
          return;
      }
      if (callback && typeof callback !== 'function') {
          ComLib.openAlertDialog("MultiCheckbox: 'callback' 파라미터는 함수여야 합니다.");
          return;
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`MultiCheckbox: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return;
      }
      if (!component.state[datasetKey]) {
          ComLib.openAlertDialog(`MultiCheckbox: Dataset 객체에 '${datasetKey}' 키가 존재하지 않습니다.`);
          return;
      }
      const { id, index, checked } = e; //eslint-disable-line
      
      const clickedItemValue = component.state[datasetKey][index].value;
      
      component.setState(prevState => {
          const currentSelectedCodes = prevState[stateKey][fieldId];
          let newSelectedCodes;

          if (checked) {
              newSelectedCodes = [...currentSelectedCodes, clickedItemValue];
          } else {
              newSelectedCodes = currentSelectedCodes.filter(value => value !== clickedItemValue);
          }

          return {
              [stateKey]: {
                  ...prevState[stateKey],
                  [fieldId]: newSelectedCodes, // fieldId 사용
              },
          };
      }, callback);
  },

  /*----------------------------------------------------------------------------------------
  * [체크박스 데이터셋 업데이트 함수]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 상태 객체 내 선택된 코드들을 저장하는 키
  * @param	:	string fieldId - 상태 객체 내 선택된 코드들을 저장하는 키
  * @param	:	string datasetKey - 전체 체크박스 항목 데이터셋의 키
  * @return	:	array - 업데이트된 체크박스 데이터셋 (value가 'Y'/'N'으로 설정됨)
  * @see		:	체크박스 컴포넌트에서 선택 상태에 따라 데이터셋의 value 값을 'Y' 또는 'N'으로 변경.
  *--------------------------------------------------------------------------------------*/
  getUpdatedCheckboxDataset: (component, stateKey, fieldId, datasetKey) => {
      if (!component || !component.state) {
          ComLib.openAlertDialog("CheckboxDataset: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.");
          return [];
      }
      if (!fieldId || typeof fieldId !== 'string') {
          ComLib.openAlertDialog("CheckboxDataset: 'fieldId' 파라미터는 문자열이어야 합니다.");
          return [];
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog("CheckboxDataset: 'stateKey' 파라미터는 문자열이어야 합니다.");
          return [];
      }
      if (!datasetKey || typeof datasetKey !== 'string') {
          ComLib.openAlertDialog("CheckboxDataset: 'datasetKey' 파라미터는 문자열이어야 합니다.");
          return [];
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`CheckboxDataset: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return [];
      }
      if (!component.state[datasetKey]) {
          ComLib.openAlertDialog(`CheckboxDataset: Dataset 객체에 '${datasetKey}' 키가 존재하지 않습니다.`);
          return [];
      }
      const dataset = component.state[datasetKey];
      const selectedValues = component.state[stateKey][fieldId];

      return dataset.map(item => ({
          ...item,
          value: selectedValues.includes(item.value) ? 'Y' : 'N'
      }));
  },
  /*----------------------------------------------------------------------------------------
  * [Enter 키 핸들러]
  * @param	:	function callback - Enter 키 입력 시 실행될 콜백 함수
  * @return	:	function - 이벤트 핸들러 함수
  * @see		:	검색 필드 등에서 Enter 키 입력 시 특정 동작을 수행할 때 사용.
  *--------------------------------------------------------------------------------------*/
  handleEnterKey: (callback) => (e) => {
      if (!callback || typeof callback !== 'function') {
          ComLib.openAlertDialog("handleEnterKey: 'callback' 파라미터는 함수여야 합니다.");
          return;
      }
      if (!e || e.key === undefined) {
          ComLib.openAlertDialog("handleEnterKey: 이벤트 객체 'e'에 'key' 속성이 없습니다.");
          return;
      }

      if (e.key === 'Enter') {
          callback();
      }
  },

  /*----------------------------------------------------------------------------------------
  * [State 객체의 특정 필드 업데이트 함수 (범용)]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 업데이트할 상태 객체의 키
  * @param	:	object updates - 업데이트할 필드와 값들을 포함하는 객체
  * @param	:	function callback - 상태 업데이트 후 실행될 콜백 함수
  * @return	:	void
  * @see		:	다양한 폼 입력 필드나 기타 상태 업데이트 로직에서 공통적으로 사용될 수 있음.
  *--------------------------------------------------------------------------------------*/
  updateStateObject: (component, stateKey, updates, callback) => {
      if (!component || !component.setState) {
          ComLib.openAlertDialog("updateStateObject: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.");
          return;
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog("updateStateObject: 'stateKey' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
          ComLib.openAlertDialog("updateStateObject: 'updates' 파라미터는 객체여야 합니다.");
          return;
      }
      if (callback && typeof callback !== 'function') {
          ComLib.openAlertDialog("updateStateObject: 'callback' 파라미터는 함수여야 합니다.");
          return;
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`updateStateObject: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return;
      }

      component.setState(prevState => ({
          [stateKey]: {
              ...prevState[stateKey],
              ...updates
          }
      }), callback);
  },

  /*----------------------------------------------------------------------------------------
  * [State 배열 업데이트 함수 (범용)]
  * @param	:	object component - React 컴포넌트 인스턴스 (this)
  * @param	:	string stateKey - 업데이트할 상태 배열의 키
  * @param	:	array newArray - 새로운 배열 값
  * @param	:	function callback - 상태 업데이트 후 실행될 콜백 함수
  * @return	:	void
  * @see		:	배열 전체를 교체하는 경우에 사용. updateStateObject와 달리 배열을 직접 받음.
  *--------------------------------------------------------------------------------------*/
  updateStateArray: (component, stateKey, newArray, callback) => {
      if (!component || !component.setState) {
          ComLib.openAlertDialog("updateStateArray: 'component' 파라미터는 React 컴포넌트 인스턴스여야 합니다.");
          return;
      }
      if (!stateKey || typeof stateKey !== 'string') {
          ComLib.openAlertDialog("updateStateArray: 'stateKey' 파라미터는 문자열이어야 합니다.");
          return;
      }
      if (!Array.isArray(newArray)) {
          ComLib.openAlertDialog("updateStateArray: 'newArray' 파라미터는 배열이어야 합니다.");
          return;
      }
      if (callback && typeof callback !== 'function') {
          ComLib.openAlertDialog("updateStateArray: 'callback' 파라미터는 함수여야 합니다.");
          return;
      }

      if (!component.state[stateKey]) {
          ComLib.openAlertDialog(`updateStateArray: State 객체에 '${stateKey}' 키가 존재하지 않습니다.`);
          return;
      }

      component.setState(prevState => ({
          [stateKey]: newArray
      }), callback);
  },

  /*----------------------------------------------------------------------------------------
  * [컴포넌트 준비 상태 관리자 생성]
  * @param	:	number totalCount - 준비해야 할 컴포넌트 총 개수
  * @param	:	function onComplete - 모든 컴포넌트 준비 완료 시 실행될 콜백 함수
  * @return	:	object - 준비 상태 관리 객체
  * @see		:	권한 컴포넌트나 초기화가 필요한 여러 컴포넌트의 준비 상태를 관리할 때 사용
  *--------------------------------------------------------------------------------------*/
  createReadyManager: (totalCount, onComplete) => {
      if (!totalCount || typeof totalCount !== 'number' || totalCount <= 0) {
          ComLib.openAlertDialog("createReadyManager: 'totalCount'는 양수여야 합니다.");
          return null;
      }
      if (!onComplete || typeof onComplete !== 'function') {
          ComLib.openAlertDialog("createReadyManager: 'onComplete'는 함수여야 합니다.");
          return null;
      }
      let count = 0;
      const total = totalCount;
      return {
          get count() { return count; },
          get total() { return total; },
          increment: function() {
              count++;
              if (count >= total) {
                  onComplete();
              }
          }
      };
  },
  // 로컬스토리지 설정
  setLocal: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  // 로컬스토리지 가져오기
  getLocal: (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  // 로컬스토리지 삭제
  removeLocal: (key) => {
    localStorage.removeItem(key);
  },
  // KKO 추가 함수 끝

  /*----------------------------------------------------------------------------------------
  * [팝업 창 크기를 직접 설정하는 함수]
  * @param	:	Object config - {width: number, height: number, left: number, top: number, center: boolean}
  * @return	:	boolean - 성공 여부
  * @see		:	1. 팝업 창 또는 Dialog에서 동작합니다
  *				2. width, height: 창 크기 (픽셀)
  *				3. left, top: 창 위치 (픽셀, center가 false일 때만 적용)
  *				4. center: 화면 중앙 정렬 여부 (기본값: true)
  *--------------------------------------------------------------------------------------*/
  resizePopup: (config, componentRef = null) => {
    // Dialog 환경 확인 (PopupDialog 컴포넌트로 실행된 경우)
    const isDialog = document.querySelector('.scrm-popup-dialog') !== null;
    
    // 팝업 창 또는 Dialog 환경에서만 실행
    if (!window.opener && !window.name && !isDialog) {
      console.warn('[ComLib] 팝업 또는 Dialog 환경이 아닙니다.');
      return false;
    }

    try {
      // Dialog인 경우 Dialog 크기 조정
      if (isDialog) {
        let modalContentElement = null;
        
        // 방법 1: componentRef가 제공된 경우, 해당 컴포넌트가 속한 dialog 찾기
        if (componentRef) {
          // React 컴포넌트에서 DOM 요소 찾기 시도
          let componentElement = null;
          
          // ReactDOM.findDOMNode 대신 클래스명으로 찾기
          const changePasswordElements = document.querySelectorAll('.change-password-popup');
          if (changePasswordElements.length > 0) {
            // 가장 최근에 마운트된 요소 선택
            componentElement = changePasswordElements[changePasswordElements.length - 1];
          }
          
          if (componentElement) {
            // 해당 요소에서 상위로 올라가며 dialog 찾기
            let currentElement = componentElement;
            while (currentElement && currentElement !== document.body) {
              if (currentElement.classList && currentElement.classList.contains('scrm-popup-modal-content')) {
                modalContentElement = currentElement;
                break;
              }
              currentElement = currentElement.parentElement;
            }
          }
        }
        
        // 방법 2: componentRef가 없거나 실패한 경우, 현재 활성 요소에서 찾기
        if (!modalContentElement) {
          let currentElement = document.activeElement;
          while (currentElement && currentElement !== document.body) {
            if (currentElement.classList && currentElement.classList.contains('scrm-popup-modal-content')) {
              modalContentElement = currentElement;
              break;
            }
            currentElement = currentElement.parentElement;
          }
        }
        
        // 방법 3: 위 방법들이 실패하면 가장 최근에 열린 dialog 찾기 (fallback)
        if (!modalContentElement) {
          const allDialogs = document.querySelectorAll('.scrm-popup-modal-content');
          if (allDialogs.length === 1) {
            modalContentElement = allDialogs[0];
          } else if (allDialogs.length > 1) {
            // 가장 높은 z-index를 가진 dialog 선택 (가장 최근에 열린 것)
            let highestZIndex = -1;
            allDialogs.forEach(dialog => {
              const dialogContainer = dialog.closest('.scrm-popup-dialog');
              if (dialogContainer) {
                const zIndex = parseInt(window.getComputedStyle(dialogContainer).zIndex) || 0;
                if (zIndex > highestZIndex) {
                  highestZIndex = zIndex;
                  modalContentElement = dialog;
                }
              }
            });
          }
        }
        
        if (modalContentElement) {
          // 실제 내용 영역의 크기 조정
          if (config.width) {
            modalContentElement.style.width = config.width + 'px';
          }
          if (config.height) {
            modalContentElement.style.height = config.height + 'px';
          }
          
          // Draggable 컨테이너 찾기 (react-draggable 클래스를 가진 부모 요소)
          let draggableElement = modalContentElement.parentElement;
          while (draggableElement && !draggableElement.classList.contains('react-draggable')) {
            draggableElement = draggableElement.parentElement;
          }
          
          if (draggableElement) {
            // Dialog 위치 조정
            if (config.center !== false && (config.left === undefined && config.top === undefined)) {
              // 화면 중앙으로 이동 - Draggable의 기본 동작 유지
              const screenWidth = window.innerWidth;
              const screenHeight = window.innerHeight;
              const dialogWidth = config.width || modalContentElement.offsetWidth;
              const dialogHeight = config.height || modalContentElement.offsetHeight;
              
              const left = (screenWidth - dialogWidth) / 2;
              const top = (screenHeight - dialogHeight) / 2;
              
              // 기존 transform 값 파싱 후 위치만 업데이트
              const currentTransform = draggableElement.style.transform || '';
              const newTransform = `translate(${left}px, ${top}px)`;
              draggableElement.style.transform = newTransform;
              
            } else if (config.left !== undefined || config.top !== undefined) {
              // 지정된 위치로 이동
              const left = config.left !== undefined ? config.left : 0;
              const top = config.top !== undefined ? config.top : 0;
              
              const newTransform = `translate(${left}px, ${top}px)`;
              draggableElement.style.transform = newTransform;
            }
          }
          
          console.log(`[ComLib] Dialog 크기 조정 완료: ${config.width || 'auto'}x${config.height || 'auto'}${config.left !== undefined || config.top !== undefined ? ` 위치: (${config.left || 'auto'}, ${config.top || 'auto'})` : ''}`);
          return true;
        }
      } else {
        // 일반 팝업 창인 경우 기존 로직 사용
        const currentWidth = window.outerWidth;
        const currentHeight = window.outerHeight;
        
        const newWidth = config.width || currentWidth;
        const newHeight = config.height + 60 || currentHeight;

        // 창 크기 조정
        window.resizeTo(newWidth, newHeight);
        
        // 위치 조정
        if (config.center === true && (config.left === undefined && config.top === undefined)) {
          // 화면 중앙으로 이동 (기본값)
          const screenWidth = window.screen.availWidth;
          const screenHeight = window.screen.availHeight;
          const left = Math.max(0, (screenWidth - newWidth) / 2);
          const top = Math.max(0, (screenHeight - newHeight) / 2);
          
          window.moveTo(left, top);
        } else if (config.left !== undefined || config.top !== undefined) {
          // 지정된 위치로 이동
          const left = config.left !== undefined ? config.left : window.screenX;
          const top = config.top !== undefined ? config.top : window.screenY;
          
          window.moveTo(left, top);
        }

        console.log(`[ComLib] 팝업 창 크기 조정 완료: ${newWidth}x${newHeight}${config.left !== undefined || config.top !== undefined ? ` 위치: (${config.left || window.screenX}, ${config.top || window.screenY})` : ''}`);
        return true;
      }
    } catch (error) {
      console.error('[ComLib] 창 크기 조정 실패:', error);
      return false;
    }
    
    return false;
  },

  /*----------------------------------------------------------------------------------------
  * [팝업 환경인지 확인하는 함수]
  * @return	:	boolean - 팝업 또는 Dialog 환경 여부
  * @see		:	window.opener, window.name 또는 Dialog 클래스 존재 여부로 판단
  *--------------------------------------------------------------------------------------*/
  isPopupEnvironment: () => {
    const isDialog = document.querySelector('.scrm-popup-dialog') !== null;
    return !!(window.opener && window.name) || isDialog;
  },

  /*----------------------------------------------------------------------------------------
  * [페이지 로드 완료 후 크기 조정을 실행하는 함수]
  * @param	:	Object config - {width: number, height: number, left: number, top: number, center: boolean}
  * @param	:	number delay - 지연 시간 (밀리초, 기본값: 100)
  * @return	:	boolean - 실행 여부
  * @see		:	DOM 로드 완료를 기다린 후 크기 조정을 실행합니다
  *--------------------------------------------------------------------------------------*/
  resizePopupAfterLoad: (config, componentRef = null, delay = 100 ) => {
	return;
    if (!ComLib.isPopupEnvironment()) {
      return false;
    }

    const executeResize = () => {
      ComLib.resizePopup(config, componentRef);
    };

    if (document.readyState === 'complete') {
      setTimeout(executeResize, delay);
    } else {
      window.addEventListener('load', () => {
        setTimeout(executeResize, delay);
      });
    }

    return true;
  },

  
  
};

// 상담업무 상수 선언
const cnsObj = {
  tempCustObj: {
    custNo: '9999999999',
    custNm: '미등록고객'
  },
  CUSTOMER_UPDATE_EVENT: 'CNS5010_UPDATE_CUSTOMER', // 고객 정보 업데이트 이벤트명
  CAMPAIGN_UPDATE_EVENT: 'CNS0040_UPDATE_CAMPAIGN',  // 캠페인 목록 교체 이벤트명
  CALLBACK_UPDATE_EVENT: 'CNS0030_UPDATE_CALLBACK',  // 콜백 배정 이벤트명
  RESERVATION_UPDATE_EVENT: 'CNS0020_UPDATE_RESERVATION',  // 통화 예약 이벤트명
  TRANS_UPDATE_EVENT: 'CNS4020_UPDATE_TRANS'  // 업무 이관 정보 업데이트
};

const StrLib = {
	/*----------------------------------------------------------------------------------------
	* [입력값이 null에 해당하는 경우 모두를 한번에 체크한다]
	* @param	:	string sValue
	* @return	:	boolean
	* @see		:	1. sValue : 체크할 문자열 ( 예 : null 또는 undefined 또는 "" 또는 "abc" )
					2. sValue가 undefined, null, NaN, "", Array.length = 0인 경우 = true, 이외의 경우 false를 return한다.
	*--------------------------------------------------------------------------------------*/
	isNull: (sValue) => {
		sValue = StrLib.getTrim(sValue);
		if (String(sValue).valueOf() === "undefined") return true;
		if (String(sValue).valueOf() === "null") return true;
		if (String(sValue).valueOf() === "") return true;
		if (sValue === null) return true;
		if (sValue === '') return true;
		if ((sValue === "") && (String(sValue.length).valueOf() === "undefined")) return true;
		if (sValue.length === 0) return true;
		return false;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열의 위치를 대소문자 구별하여 찾는다]
	* @param	:	String sOrg, String sFind, integer nStart
	* @return	:	integer
	* @see		:	1. sOrg : 원래 문자열( 예 : "aaBBbbcc" )
					2. sFind : 찾고자 하는 문자열( 예 : "bb" )
					3. nStart : 검색 시작위치 (옵션 : Default=0) ( 예 : 1 )
					4. 성공 => 찾고자 하는 문자열의 시작위치를 return ( 예 : 4 )
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	 getPos: (sOrg, sFind, nStart) => {
		if (StrLib.isNull(sOrg) || StrLib.isNull(sFind)) { return -1; }
		if (StrLib.isNull(nStart)) { nStart = 0; }
		return sOrg.indexOf(sFind, nStart);
	},

	/*----------------------------------------------------------------------------------------
	* [문자열의 위치를 대소문자 구별없이 찾는다]
	* @param	:	String sOrg, String sFind, integer nStart
	* @return	:	integer
	* @see		:	1. sOrg : 원래 문자열( 예 : "aaBBbbcc" )
					2. sFind : 찾고자 하는 문자열( 예 : "bb" )
					3. nStart : 검색 시작위치 (옵션 : Default=0) ( 예 : 1 )
					4. 성공 => 찾고자 하는 문자열의 시작위치를 return ( 예 : 2)
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getPosCase: (sOrg, sFind, nStart) => {
		if (StrLib.isNull(sOrg) || StrLib.isNull(sFind)) { return -1; }
		if (StrLib.isNull(nStart)) { nStart = 0; }
		return sOrg.toLowerCase().indexOf(sFind.toLowerCase(), nStart);
	},

	/*----------------------------------------------------------------------------------------
	* [문자열의 위치를 대소문자 구별하여 거꾸로 찾는다]
	* @param	:	String sOrg, String sFind, integer nStart
	* @return	:	integer
	* @see		:	1. sOrg : 원래 문자열( 예 : "aaBBbbcc" )
					2. sFind : 찾고자 하는 문자열( 예 : "bb" )
					3. nStart : 검색 시작위치 (옵션 : Default=문자열의 끝) ( 예 : 1 )
					4. 성공 => 찾고자 하는 문자열의 시작위치를 return ( 예 : 2)
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getPosReverse: (sOrg, sFind, nStart) => {
		if (StrLib.isNull(sOrg) || StrLib.isNull(sFind)) { return -1; }
		if (StrLib.isNull(nStart)) { nStart = sOrg.length-1; }

		let pos;
		for (pos = nStart; pos >= 0; pos--) {
			if (sOrg.substr(pos, sFind.length) === sFind) break;
		}

		return pos;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열의 위치를 대소문자 구별없이 거꾸로 찾는다]
	* @param	:	String sOrg, String sFind, integer nStart
	* @return	:	integer
	* @see		:	1. sOrg : 원래 문자열( 예 : "aaBBbbcc" )
					2. sFind : 찾고자 하는 문자열( 예 : "bb" )
					3. nStart : 검색 시작위치 (옵션 : Default=문자열의 끝) ( 예 : 1 )
					4. 성공 => 찾고자 하는 문자열의 시작위치를 return ( 예 : 4)
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getPosReverseCase: (sOrg, sFind, nStart) => {
		if (StrLib.isNull(sOrg) || StrLib.isNull(sFind)) { return -1; }
		if (StrLib.isNull(nStart)) { nStart = sOrg.length-1; }

		let pos;
		for (pos = nStart; pos >= 0; pos--) {
			if (sOrg.substr( pos, sFind.length ).toLowerCase() === sFind.toLowerCase()) break;
		}

		return pos;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열을 대소문자 구별하여 치환한다]
	* @param	:	String sOrg, String sRepFrom, string sRepTo
	* @return	:	string
	* @see		: 	1. sOrg : 원래문자열 (예 : "aaBBbbccBB" )
					2. sRepFrom : 치환할 문자열 ( 예 : "BB" )
					3. sRepTo : 치환될 문자열 ( 예 : "xx" )
					4. 성공 => 치환된 문자열 ( 예 : "aaxxbbccxx" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getReplace: ( sOrg, sRepFrom, sRepTo ) => {
		if (StrLib.isNull(sOrg)) return "";
		if (StrLib.isNull(sRepFrom)) return "";
		if (StrLib.isNull(sRepTo)) return "";

		let pos, nStart = 0, sRet = "";
		while (1) {
			pos = StrLib.getPos(sOrg, sRepFrom, nStart);
			if (pos < 0) {
				sRet += sOrg.substr(nStart);
				break;
			} else {
				sRet += sOrg.substr(nStart, pos - nStart);
				sRet += sRepTo;
				nStart = pos + sRepFrom.length;
			}
		}
		return sRet;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열을 대소문자 구별없이 치환한다]
	* @param	:	String sOrg, String sRepFrom, string sRepTo
	* @return	:	string
	* @see		: 	1. sOrg : 원래문자열 (예 : "aaBBbbccBB" )
					2. sRepFrom : 치환할 문자열 ( 예 : "BB" )
					3. sRepTo : 치환될 문자열 ( 예 : "xx" )
					4. 성공 => 치환된 문자열 ( 예 : "aaxxxxccxx" ) return
					   실패 => sOrg return
	*--------------------------------------------------------------------------------------*/
	getReplaceCase: ( sOrg, sRepFrom, sRepTo ) => {
		if (StrLib.isNull(sOrg)) return "";
		if (StrLib.isNull(sRepFrom)) return "";
		if (StrLib.isNull(sRepTo)) return "";

		let pos, nStart = 0, sRet = "";
		while (1) {
			pos = StrLib.getPosCase(sOrg, sRepFrom, nStart);
			if (pos < 0) {
				sRet += sOrg.substr(nStart);
				break;
			} else {
				sRet += sOrg.substr(nStart, pos - nStart);
				sRet += sRepTo;
				nStart = pos + sRepFrom.length;
			}
		}
		return sRet;
	},

	/*----------------------------------------------------------------------------------------
	* [주민번호(7자리 이상)에서 성별 구분]
	* @param	:	string sRrNo
	* @return	:	string
	* @see		: 	1. sRrNo : 생년월일성별 또는 주민번호
					2. 성공 => 7번째 자리 번호 기준 남자 : 'M' / 여자 : 'F' return
					   실패 => '' return
	*--------------------------------------------------------------------------------------*/
	getSexCd: (sRrNo) => {
		let strRno = StrLib.getNumStr(sRrNo);
		if (strRno.length < 7) return '';

		let strSexCd = "";
		if ((parseInt(strRno.substr(6, 1), 10)%2) === 0) strSexCd = "F";
		else strSexCd = "M";

		return strSexCd;
	},

	/*----------------------------------------------------------------------------------------
	* [왼쪽에 문자열 추가]
	* @param	:	string sOrg, integer nTotLen, string sPad
	* @return	:	string
	* @see		: 	1. sOrg : 원래 문자열 ( 예 : "bbccCC" )
					2. nCnt : Pad할 총 길이 ( 예 : 7)
					3. sPad : Pad할 문자열 (옵션 : Default=" ") ( 예 : "aa" )
					4. 성공 => Pad된 문자열 ( 예 : "abbccCC" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getLPad: (sOrg, nTotLen, sPad) => {
		if (StrLib.isNull(sOrg)) return "";
		if (StrLib.isNull(nTotLen)) return "";
		if (StrLib.isNull(sPad)) sPad = " ";

		let sRet = "";
		let nPadLen = nTotLen - sOrg.length;
		if (nPadLen <= 0) {
			return sOrg;
		} else {
			while (1) {
				if (nPadLen >= sPad.length) {
					sRet += sPad;
					nPadLen -= sPad.length;
				} else {
					if (nPadLen > 0) sRet += sPad.substr(0, nPadLen);
					break;
				}
			}
		}

		return sRet + sOrg;
	},

	/*----------------------------------------------------------------------------------------
	* [오른쪽에 문자열 추가]
	* @param	:	String sOrg, integer nTotLen, String sPad
	* @return	:	string
	* @see		: 	1. sOrg : 원래 문자열 ( 예 : "bbccCC" )
					2. nTotLen : Pad할 총 길이 ( 예 : 7 )
					3. sPad : Pad할 문자열 (옵션 : Default=" ")( 예 : "aa" )
					4. 성공 => Pad된 문자열 ( 예 : "bbccCCaa" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getRPad:(sOrg, nTotLen, sPad) => {
		if (StrLib.isNull(sOrg)) return "";
		if (StrLib.isNull(nTotLen)) return "";
		if (StrLib.isNull(sPad)) sPad = " ";

		let sRet = "";
		let nPadLen = nTotLen - sOrg.length;
		if (nPadLen <= 0) {
			return sOrg;
		} else {
			while (1) {
				if (nPadLen >= sPad.length) {
					sRet += sPad;
					nPadLen -= sPad.length;
				} else {
					if (nPadLen > 0) sRet += sPad.substr(0, nPadLen);
					break;
				}
			}
		}

		return sOrg + sRet;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열의 오른쪽에서 nSize만큼의 문자열을 가져온다]
	* @param	:	string sOrg, integer nSize
	* @return	:	string
	* @see		: 	1. sOrg : 원래 문자열( 예 : "aaBBbbcc" )
					2. nSize : 가져올문자열 길이 ( 예 : 2 )
					3. 성공 => 오른쪽에서 nSize만큼의 문자열 ( 예 : "cc" ) return
					   실패 => "" return
	* @note		:	sOrg의 길이가 nSize보다 작은경우는 sOrg가 Return된다.
					( 예 : sOrg="a", nSize=2 ===> return = "a" )
	*--------------------------------------------------------------------------------------*/
	getRight: (sOrg, nSize) => {
		if (StrLib.isNull(sOrg) || StrLib.isNull(nSize)) return "";
		if (sOrg.length < nSize) return sOrg;
		else return sOrg.substr(sOrg.length - nSize, nSize);
	},

	/*----------------------------------------------------------------------------------------
	* [문자 Byte 길이를 계산 (한글 : 2Byte / 문자, 숫자, 특수문자 : 1Byte)]
	* @param	:	String sVal
	* @return	:	integer
	* @see		: 	1. sVal : 입력받은 문자열 ( 예 : "a1\n한韓" )
					2. 성공 => 길이 ( 예 : 7 ) return
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getLenB: (sVal) => {
		if (StrLib.isNull(sVal)) return -1;

		let len = 0;
		for (var i = 0; i < sVal.length; i++) {
			if (sVal.charCodeAt(i) > 127) len += 2;
			else len += 1;
		}
		return len;
	},

	/*----------------------------------------------------------------------------------------
	* [문자 Byte 길이를 계산 (한글 : 3Byte / 문자, 숫자, 특수문자 : 1Byte)]
	* @param	:	String sVal
	* @return	:	integer
	* @see		: 	1. sVal : 입력받은 문자열 ( 예 : "a1\n한韓" )
					2. 성공 => 길이 ( 예 : 9 ) return
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getLen3B: (sVal) => {
		if (StrLib.isNull(sVal)) return -1;

		let len = 0;
		for (var i = 0; i < sVal.length; i++) {
			if (sVal.charCodeAt(i) > 127) len += 3;
			else len += 1;
		}
		return len;
	},

	/*----------------------------------------------------------------------------------------
	* [전각문자를 반각문자로]
	* @reference:	전각문자는 "정사각형" 안에 들어가는 문자이고, 반각은 그 정사각형의 반쪽에 들어가는 문자이다.
					전각문자의 폭은, 반각문자의 2배입니다.
					예를 들어 숫자 "3" 은, 한글 "가"의 절반의 폭만을 가지고 있습니다.
					그래서 영문과 숫자 등은 반각이고, 한글이나 한자들은 전각문자입니다.
					다만, 영문과 숫자를 전각으로 표현할 수도 있습니다.
					(예 : 전각문자 ===> ※★０＋
						반각문자 ===> 1a )
	* @param	:	string sFull
	* @return	:	string
	* @see		: 	1. sFull : 전각문자( 예 : "０＋" )
					2. 성공 => 반각문자 ( 예 : "0+" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getFull2Half: (sFull) => {
		if (StrLib.isNull(sFull)) return "";

		let sHalf = "";
		for (var i = 0; i < sFull.length; i++) {
			let c = sFull.charCodeAt(i);
			if (c === 12288) sHalf += unescape("%20");
			else if ((c >= 65281) && (c <= 65374)) sHalf += unescape("%"+(c-65248).toString(16));
			else sHalf += sFull.charAt(i);
		}
		return  sHalf;
	},

	/*----------------------------------------------------------------------------------------
	* [반각문자를 전각문자로]
	* @param	:	string sHalf
	* @return	:	string
	* @see		: 	1. sHalf : 반각문자( 예 : "0+" )
					2. 성공 => 전각문자 ( 예 : "０＋" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getHalf2Full: (sHalf) => {
		if (StrLib.isNull(sHalf)) return "";

		let rTmp = "";
		let iTmp = "";
		for (var i = 0; i < sHalf.length; i++ ) {
			//기본 아스키 코드 값을 벗어난 경우(한글)는 전자로 변환할 필요 없음.
			if ((sHalf.charCodeAt(i) >= 32) && (sHalf.charCodeAt(i) <= 126)) {
				if (sHalf.charCodeAt(i) === 32) iTmp = unescape("%u"+(12288).toString(16));
				else iTmp = sHalf.charCodeAt(i) + 65248;
			} else {
				iTmp = sHalf.charCodeAt(i);
			}

			if (sHalf.charCodeAt(i) === 32) rTmp = rTmp + (iTmp);
			else rTmp += String.fromCharCode(iTmp);
		}

		return rTmp;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열이 숫자형식에 맞는지 여부 체크]
	* @param	:	String sNum
	* @return	:	boolean
	* @see		: 	1. sNum : 체크할 문자열숫자 ( 예 : "-1234.56" ) (단, ","가 들어있으면 안 됨)
					2. 숫자형식에 맞는경우 => true return
					   숫자형식에 맞지않는 경우 => false return
	*--------------------------------------------------------------------------------------*/
	isNum: (sNum) => {
		if (StrLib.isNull(sNum)) return false;

		let point_cnt = 0;
		let ret = true;
		for (var i = 0; i < sNum.length; i++) {
			var c = sNum.charAt(i);
			if (i === 0 && (c === "+" || c === "-"));
			else if (c >= "0" && c <= "9");
			else if (c === ".") {
				point_cnt++;
				if (point_cnt > 1) {
					ret = false;
					break;
				}
			} else {
				ret = false;
				break;
			}
		}
		return ret;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열이 알파벳(a~z, A~Z)만으로 구성되어 있는지 체크]
	* @param	:	string sVal
	* @return	:	boolean
	* @see		: 	1. sVal : 체크할 문자열 ( 예 : "aAzZ" )
					2. 알파벳만 있는경우 = true return,
					   알파벳이 아닌 글자가 하나라도 있는 경우 = false return
	*--------------------------------------------------------------------------------------*/
	isAlpha: (sVal) => {
		if (StrLib.isNull(sVal)) return false;
		if (sVal.search("[^A-Za-z]") >= 0) return false;
		else return true;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열이 알파벳(a~z, A~Z), 숫자만으로 구성되어 있는지 체크]
	* @param	:	string sVal
	* @return	:	boolean
	* @see		: 	1. sVal : 체크할 문자열 ( 예 : "aAzZ09" )
					2. 알파벳, 숫자만 있는경우 = true return,
					   알파벳, 숫자가 아닌 글자가 하나라도 있는 경우 = false return
	*--------------------------------------------------------------------------------------*/
	isAlNum: (sVal) => {
		if (StrLib.isNull(sVal)) return false;
		if (sVal.search("[^A-Za-z0-9]") >= 0) return false;
		else return true;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열이 한글로만 구성되어 있는지 체크]
	* @param	: String sVal
	* @return	: boolean
	* @see		: 	1. sVal : 체크할 문자열 ( 예 : "가나다" )
					2. 한글만 있는경우 = true return,
					한글이 아닌 글자가 하나라도 있는 경우 = false return
	*--------------------------------------------------------------------------------------*/
	isKor: (sVal) => {
		if (StrLib.isNull(sVal)) return false;
		for (var i = 0; i < sVal.length; i++ ) {
			if (!((sVal.charCodeAt(i) > 0x3130 && sVal.charCodeAt(i) < 0x318F) || (sVal.charCodeAt(i) >= 0xAC00 && sVal.charCodeAt(i) <= 0xD7A3))) return false;
		}
		return true;
	},

	/*----------------------------------------------------------------------------------------
	* [문자열열 날짜 형식 체크]
	* @param	:	string date
	* @return	:	boolean
	* @see		: 	1. date : 날짜 문자열 ( 예 : '20230101' )
					2. 성공 => true return,
					   실패 => false return
	*--------------------------------------------------------------------------------------*/
	isValidYyyymmdd: (date) => {
		if (StrLib.isNull(date)) return false;
		if (date.length !== 8) return false;
		if (!/^\d{8}$/.test(date)) return false;
		// 연, 월, 일 분리
		var year = parseInt(date.substring(0, 4), 10);
		var month = parseInt(date.substring(4, 6), 10);
		var day = parseInt(date.substring(6, 8), 10);
	  
		// 연월일 범위 체크
		if (year < 1000 || year > 3000 || month < 1 || month > 12) {
		  return false;
		}
	  
		// 각 월의 마지막 일
		var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		// 윤년 처리
		if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
		  monthLength[1] = 29;
		}
		return day > 0 && day <= monthLength[month - 1];
	},

	/*----------------------------------------------------------------------------------------
	* [문자열 Trim 함수]
	* @param	:	string args
	* @return	:	string
	* @see		:   1. args : trim 할 값
					2. 성공 => trim String return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getTrim: (arg) => {
		let str = String(arg);
		if (str === null || str === "null") return "";
		if (String(str).valueOf() === "undefined") return "";
		if (String(str) === null) return "";
		return str.replace(/(^\s*)|(\s*$)/g, "");
	},

	/*----------------------------------------------------------------------------------------
	* [문자열에서 숫자만 추출한다.]
	* @param	:	string sValue
	* @return	:	string
	* @see		:   1. sValue : 추출대상 ( 예 : '2020-09-02' )
					2. 성공 => '20200902' return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getNumStr: (sValue) => {
		const trimSValue = StrLib.getTrim(sValue);
		if (trimSValue === "") return "";

		let sResult = "";
		let sNum = "0123456789";
		for (var i = 0; i<trimSValue.length; i++) {
			if (sNum.indexOf(trimSValue.charAt(i)) > -1) sResult += trimSValue.charAt(i);
		}
		return sResult;
	},

	/*----------------------------------------------------------------------------------------
	* [숫자에 ","를 집어넣기]
	* @param	:	string sNum
	* @return	:	string
	* @see		: 	1. sNum : 숫자 형식의 문자열 ( 예 : '-1234567.89' )
					2. 성공 => ","가 들어간 문자열 ( 예 : -1,234,567.89 ) return,
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	setComma: (sNum) => {
		if (StrLib.isNull(sNum)) return "";
		if (!StrLib.isNum(sNum)) return "";

		let nEnd, nStart = 0, sRet = "";
		const trimSNum = StrLib.getTrim(sNum);

		if (trimSNum.charAt(0) === "+" || trimSNum.charAt(0) === "-") {
			sRet += trimSNum.charAt(0);
			nStart = 1;
		}

		let ppos = StrLib.getPos(trimSNum, ".", nStart);
		if (ppos < 0) nEnd = trimSNum.length;
		else nEnd = ppos;

		let sDigit = trimSNum.substr(nStart, nEnd-nStart);
		for (let pos = 0; pos < sDigit.length; pos ++ ) {
			if ( pos !== 0 && (sDigit.length-pos)%3 === 0) sRet += ",";
			sRet += sDigit.charAt(pos);
		}

		sRet += trimSNum.substr(nEnd);
		return sRet;
	},
	/*----------------------------------------------------------------------------------------
	* [Array에 있는 값들을 Distinct(중복제거)한다]
	* @param	:	array aOrg
	* @return	:	array
	* @see		: 	1. aOrg : 중복을 제거할 원래 Array ( 예 : (1,1,2,2,3,4,5) )
					2. 성공 => 중복이 제거된 Array ( 예 : (1,2,3,4,5) ) return,
					   실패 => 빈 Array return
	*--------------------------------------------------------------------------------------*/
	getDistinct: (aOrg) => {
		const aDist = [];
		if (StrLib.isNull(aOrg)) return aDist;

		for (var i = 0; i < aOrg.length; i++) {
			const vDist = aOrg[i];
			let flag = false;
			for (let j = 0; j < aDist.length; j++) {
				if ("x" + aDist[j] === "x" + vDist) {
					flag = true;
					break;
				}
			}
			if (flag === false) aDist.push(vDist);
		}
		return aDist;
	},
	/*----------------------------------------------------------------------------------------
	* [넘겨받은  String 데이터를 Date Format으로 변경한다.]
	* @param	:	String
	* @return	:	String
	* @see		: 	1. date : YYYYMMDD or YYYYMMDDHHMISS (8자리 또는 14자리만 가능)
					2. str : '-' or '/' (default : '-')
					2. 성공 => 날짜 포맷으로 변경하여 리턴(YYYY-MM-DD or YYYY/MM/DD)
					   실패 => 그대로 return
	*--------------------------------------------------------------------------------------*/
	setFormatData : (date, str) => {
		if(!date){
			return date;
		}

		if(date.length !== 8 && date.length !== 14) {
			return date;
		}

		const delim = (StrLib.isNull(str)) ? '-' : str;

		const year = date.substring(0,4);
		const month = date.substring(4,6);
		const day = date.substring(6,8);

		const formattedDate = `${year}${delim}${month}${delim}${day}`;

		if (date.length === 14) {
			const hour = date.substring(8,10);
			const minute = date.substring(10,12);
			const second = date.substring(12,14);
			return `${formattedDate} ${hour}:${minute}:${second}`;
		}
		return formattedDate;
	},

	/**
	 * 날짜 데이터를 지정된 형식으로 변환
	 * @param {string} date - 변환할 날짜 문자열 (예: '20230101')
	 * @param {string} format - 변환할 형식 (예: 'YYYY-MM-DD')
	 * @return {string} - 변환된 날짜 문자열
	 */
	setDateFormat: (date, format) => {
		if (!date || !format) return date;
		
		const year = date.substring(0,4);
		const month = date.substring(4,6);
		const day = date.substring(6,8);
		const hour = date.length > 8 ? date.substring(8,10) : '00';
		const minute = date.length > 10 ? date.substring(10,12) : '00';
		const second = date.length > 12 ? date.substring(12,14) : '00';
		
		return format
			.replace(/YYYY/g, year)
			.replace(/MM/g, month)
			.replace(/DD/g, day)
			.replace(/HH/g, hour)
			.replace(/mm/g, minute)
			.replace(/ss/g, second);
	},
	
	/*----------------------------------------------------------------------------------------
	* [기본 날짜 시작 시간 설정]
	* @param	:	string date
	* @return	:	string
	* @see		: 	1. date : 날짜 문자열 ( 예 : '20230101' )
					2. 성공 => 날짜 시작 시간 문자열 ( 예 : '20230101000000' ) return
					   실패 => 그대로 return
	*--------------------------------------------------------------------------------------*/
	setDefaultDtFromDt: (date) => StrLib.isValidYyyymmdd(date) ? date + '000000' : date,

	/*----------------------------------------------------------------------------------------
	* [기본 날짜 종료 시간 설정]
	* @param	:	string date
	* @return	:	string
	* @see		: 	1. date : 날짜 문자열 ( 예 : '20230101' )
					2. 성공 => 날짜 종료 시간 문자열 ( 예 : '20230101235959' ) return
					   실패 => 그대로 return
	*--------------------------------------------------------------------------------------*/
	setDefaultDtToDt: (date) => StrLib.isValidYyyymmdd(date) ? date + '235959' : date,

	// 마스킹 함수들
	/*----------------------------------------------------------------------------------------
	* [전화번호 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	전화번호를 마스킹하여 반환 (예: 010-1234-5678 -> 010-****-5678)
	*--------------------------------------------------------------------------------------*/
	maskPhoneNumber: (value) => {
		if (!value) return '';
    
		// 숫자만 추출
		const numbers = value.replace(/[^0-9]/g, "");
		
		// 지역번호 패턴별 처리
		if (numbers.startsWith('02')) {
			// 서울 지역번호 (02)
			if (numbers.length === 9) {
				return `${numbers.slice(0, 2)}-***-${numbers.slice(5)}`;
			} else if (numbers.length === 10) {
				return `${numbers.slice(0, 2)}-****-${numbers.slice(6)}`;
			}
		} else if (numbers.startsWith('0') && numbers.length >= 10) {
			// 지방 지역번호 (031, 032, 033, 041, 042, 043, 051, 052, 053, 054, 055, 061, 062, 063, 064, 070, 080, 082, 083, 084, 087, 088, 089)
			if (numbers.length === 10) {
				return `${numbers.slice(0, 3)}-***-${numbers.slice(6)}`;
			} else if (numbers.length === 11) {
				return `${numbers.slice(0, 3)}-****-${numbers.slice(7)}`;
			}
		} else if (numbers.length === 8) {
			// 일반 전화번호 (8자리)
			return `${numbers.slice(0, 4)}-****`;
		} else if (numbers.length === 9) {
			// 일반 전화번호 (9자리)
			return `${numbers.slice(0, 4)}-****-${numbers.slice(8)}`;
		}
		
		// 기본 처리 (11자리 초과 또는 예외 케이스)
		if (numbers.length > 11) {
			const limitedNumbers = numbers.slice(0, 11);
			return `${limitedNumbers.slice(0, 3)}-****-${limitedNumbers.slice(7)}`;
		}
		
		// 그 외의 경우 원본 반환
		return numbers;
	},

	/*----------------------------------------------------------------------------------------
	* [주민등록번호 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	주민등록번호를 마스킹하여 반환 (예: 900101-1234567 -> 900101-1******)
	*--------------------------------------------------------------------------------------*/
	maskRRN: (value) => {
		if (!value) return '';
		const cleanValue = value.replace(/[^0-9-]/g, "");
		if (cleanValue.length < 7) return cleanValue;
		return `${cleanValue.slice(0, 6)}-${cleanValue.slice(6, 7)}${'*'.repeat(Math.min(cleanValue.length - 7, 7))}`;
	},

	/*----------------------------------------------------------------------------------------
	* [주민등록번호 포맷팅 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	주민등록번호를 포맷팅하여 반환 (예: 9001011234567 -> 900101-1234567)
	*--------------------------------------------------------------------------------------*/
	formatRRN: (value) => {
		if (!value) return '';
		const numbers = value.replace(/[^0-9]/g, "");
		if (numbers.length <= 6) return numbers;
		if (numbers.length <= 13) return `${numbers.slice(0, 6)}-${numbers.slice(6)}`;
		
		const limitedNumbers = numbers.slice(0, 13);
		return `${limitedNumbers.slice(0, 6)}-${limitedNumbers.slice(6)}`;
	},

	/*----------------------------------------------------------------------------------------
	* [이름 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	이름을 마스킹하여 반환 (예: 홍길동 -> 홍*동, 남궁민수 -> 남**수)
	*--------------------------------------------------------------------------------------*/
	maskName: (value) => {
		if (!value) return '';
		const name = value.trim();
		if (name.length <= 1) return name;
		if (name.length === 2) return `${name[0]}*`;
		return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
	},

	/*----------------------------------------------------------------------------------------
	* [ID 마스킹 함수 - 길이별 동적 처리]
	* @param	:	string value - ID
	* @return	:	string - 마스킹된 ID
	* @see		:	ID 길이에 따라 동적으로 마스킹 처리
	*          4자리 이하: 두번째부터 (ID길이-1)/2 길이만큼 마스킹
	*          5자리 이상: 두번째부터 (ID길이-1)/2 길이만큼 + 뒤에서 두번째 자리 마스킹
	*          예시) JUAN -> J*AN, ROS17 -> R*S*7, JOHN9LA -> J**9L*A
	*--------------------------------------------------------------------------------------*/
	maskId: (value) => {
		if (!value) return '';
		
		const id = value.toString();
		const length = id.length;
		
		if (length <= 1) {
			return id; // 1자리는 마스킹하지 않음
		}
		
		if (length <= 4) {
			// 4자리 이하: 두번째부터 (ID길이-1)/2 길이만큼 마스킹
			const maskLength = Math.floor((length - 1) / 2);
			const maskStart = 1; // 두번째 자리부터
			
			return id.substring(0, maskStart) + 
			       '*'.repeat(maskLength) + 
			       id.substring(maskStart + maskLength);
		} else {
			// 5자리 이상: 두번째부터 (ID길이-1)/2 길이만큼 + 뒤에서 두번째 자리 마스킹
			const maskLength = Math.floor((length - 1) / 2);
			const maskStart = 1; // 두번째 자리부터
			
			// 앞쪽 마스킹
			let result = id.substring(0, maskStart) + 
			             '*'.repeat(maskLength) + 
			             id.substring(maskStart + maskLength);
			
			// 뒤에서 두번째 자리 마스킹
			const secondLastIndex = result.length - 2;
			if (secondLastIndex > 0 && result[secondLastIndex] !== '*') {
				result = result.substring(0, secondLastIndex) + 
				         '*' + 
				         result.substring(secondLastIndex + 1);
			}
			
			return result;
		}
	},

	/*----------------------------------------------------------------------------------------
	* [이메일 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	이메일을 마스킹하여 반환 (예: test@example.com -> te**@example.com)
	*--------------------------------------------------------------------------------------*/
	maskEmail: (value) => {
		if (!value) return '';
		const parts = value.split('@');
		if (parts.length !== 2) return value;
		
		const [local, domain] = parts;
		if (local.length <= 2) return value;
		
		const maskedLocal = `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}`;
		return `${maskedLocal}@${domain}`;
	},

	/*----------------------------------------------------------------------------------------
	* [주소 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	주소를 마스킹하여 반환 ('구 ' 또는 '면 ' 뒤를 마스킹)
	*--------------------------------------------------------------------------------------*/
	maskAddress: (value) => {
		if (!value) return '';
		const address = value.trim();
		if (address.length <= 10) return address;
		
		// '구 ' 또는 '면 ' 뒤를 마스킹
		const guIndex = address.indexOf('구 ');
		const myeonIndex = address.indexOf('면 ');
		
		if (guIndex !== -1) {
			// '구 ' 뒤를 마스킹
			const beforeGu = address.substring(0, guIndex + 2); // '구 ' 포함
			return `${beforeGu}*****`;
		} else if (myeonIndex !== -1) {
			// '면 ' 뒤를 마스킹
			const beforeMyeon = address.substring(0, myeonIndex + 2); // '면 ' 포함
			return `${beforeMyeon}*****`;
		} else {
			// 기존 로직: 마지막 부분을 마스킹
			const parts = address.split(' ');
			if (parts.length <= 2) return address;
			
			const lastPart = parts[parts.length - 1]; //eslint-disable-line
			const maskedLastPart = '*****';
			return `${parts.slice(0, -1).join(' ')} ${maskedLastPart}`;
		}
	},

	/*----------------------------------------------------------------------------------------
	* [계좌번호 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	계좌번호를 마스킹하여 반환 (예: 12345678 -> 1234****)
	*--------------------------------------------------------------------------------------*/
  maskAccountNumber: (value) => {
    if (!value) return '';
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue.length < 4) return cleanValue;
    
    // 8자리 계좌번호: 앞 4자리는 보이고, 뒤 4자리는 마스킹
    return `${cleanValue.slice(0, 4)}${'*'.repeat(Math.min(cleanValue.length - 4, 4))}`;
  },

	/*----------------------------------------------------------------------------------------
	* [계좌번호 마스킹 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	계좌번호를 마스킹하여 반환 (예: 12345678901 -> 1234*******)
	*--------------------------------------------------------------------------------------*/
	maskAccountNumber11: (value) => {
		if (!value) return '';
		const cleanValue = value.replace(/[^0-9]/g, "");
		if (cleanValue.length < 4) return cleanValue;
		
		// 11자리 계좌번호: 000-**-****** 형식으로 마스킹
		if (cleanValue.length < 3) return cleanValue;
		const part1 = cleanValue.slice(0, 3);
		const part2 = cleanValue.length > 3 ? cleanValue.slice(3, 5) : '';
		const part3 = cleanValue.length > 5 ? cleanValue.slice(5, 11).replace(/./g, '*') : '';
		return `${part1}-${part2}-${part3}`;
	},
	
	// 포맷팅 함수들
	/*----------------------------------------------------------------------------------------
	* [전화번호 포맷팅 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	전화번호를 포맷팅하여 반환 (예: 01012345678 -> 010-1234-5678)
	*--------------------------------------------------------------------------------------*/
	formatPhoneNumber: (pvalue) => {
		if (!pvalue) return '';
		let value = (""+pvalue).trim();
		// 숫자만 추출
		const numbers = value.replace(/[^0-9]/g, "");
		
		// 지역번호 패턴별 처리
		if (numbers.startsWith('02')) {
			// 서울 지역번호 (02)
			if (numbers.length === 9) {
				return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
			} else if (numbers.length === 10) {
				return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
			}
		} else if (numbers.startsWith('0') && numbers.length >= 10) {
			// 지방 지역번호 (031, 032, 033, 041, 042, 043, 051, 052, 053, 054, 055, 061, 062, 063, 064, 070, 080, 082, 083, 084, 087, 088, 089)
			if (numbers.length === 10) {
				return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
			} else if (numbers.length === 11) {
				return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
			}
		} else if (numbers.length === 8) {
			// 일반 전화번호 (8자리)
			return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
		} else if (numbers.length === 9) {
			// 일반 전화번호 (9자리)
			return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8)}`;
		}
		
		// 기본 처리 (11자리 초과 또는 예외 케이스)
		if (numbers.length > 11) {
			const limitedNumbers = numbers.slice(0, 20);
			// return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
			return `${limitedNumbers}`;
		}
		
		// 그 외의 경우 원본 반환
		return numbers;
	},

	/*----------------------------------------------------------------------------------------
	* [날짜 포맷팅 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	날짜를 포맷팅하여 반환 (예: 20231201 -> 2023-12-01)
	*--------------------------------------------------------------------------------------*/
	formatDate: (value) => {
		const numbers = value.replace(/[^0-9]/g, "");
		if (numbers.length <= 4) return numbers;
		if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
		if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`;
		
		const limitedNumbers = numbers.slice(0, 8);
		return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 6)}-${limitedNumbers.slice(6)}`;
	},

	/*----------------------------------------------------------------------------------------
	* [날짜시간 포맷팅 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	날짜시간을 포맷팅하여 반환 (예: 20231201143000 -> 2023-12-01 14:30:00)
	*--------------------------------------------------------------------------------------*/
	formatDateTime: (value) => {
		const numbers = value.replace(/[^0-9]/g, "");
		if (numbers.length <= 4) return numbers;
		if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
		if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
		if (numbers.length <= 10) return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
		if (numbers.length <= 12) return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10, 12)}`;
		if (numbers.length <= 14) return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)} ${numbers.slice(8, 10)}:${numbers.slice(10, 12)}:${numbers.slice(12, 14)}`;
		
		const limitedNumbers = numbers.slice(0, 14);
		return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 6)}-${limitedNumbers.slice(6, 8)} ${limitedNumbers.slice(8, 10)}:${limitedNumbers.slice(10, 12)}:${limitedNumbers.slice(12, 14)}`;
	},

	/*----------------------------------------------------------------------------------------
	* [전화번호 검증 함수]
	* @param	:	string value
	* @return	:	boolean
	* @see		:	전화번호 검증 함수
	*--------------------------------------------------------------------------------------*/
	isPhoneNumber: (phoneNumber) => {
		if (!phoneNumber || phoneNumber.trim() === '') {
			return false;
		}
		const cleanPhone = phoneNumber.replace(/\s/g, '');
		const basicRegex = /^[0-9-]+$/;
		if (!basicRegex.test(cleanPhone)) {
			return false;
		}
		const numbersOnly = cleanPhone.replace(/-/g, '');
		if (numbersOnly.length < 9 || numbersOnly.length > 11) {
			return false;
		}
		const landlinePatterns = [/^0[2-6][0-9]-?[0-9]{3,4}-?[0-9]{4}$/, /^070-?[0-9]{4}-?[0-9]{4}$/, /^1[5-9][0-9]{2}-?[0-9]{4}$/]; // 일반전화 패턴
		const mobilePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
		const isLandline = landlinePatterns.some(pattern => pattern.test(cleanPhone));
		const isMobile = mobilePattern.test(cleanPhone);
		return isLandline || isMobile;
	},

	/*----------------------------------------------------------------------------------------
	* [계좌번호 포맷팅 함수]
	* @param	:	string value
	* @return	:	string
	* @see		:	계좌번호 포맷팅 함수
	*--------------------------------------------------------------------------------------*/
	formatAccountNumber: (accountNumber) => {

		// 11자리 계좌번호 포맷팅
		if (accountNumber.length === 11) {
			return accountNumber.replace(/(\d{3})(\d{2})(\d{6})/, '$1-$2-$3');
		}

		// 그외 계좌번호 포맷팅(원본그대로 반환)
		return accountNumber;
	}
};

const FileLib = {
	/*----------------------------------------------------------------------------------------
	* [File Path 문자열(예 : C:\a\b\filename.ext)에서 File명(예 : filename)을 추출]
	* @param	: string sPath, boolean bExt
	* @return	: string
	* @see		: 	1. sPath   - File Path 문자열 (예 : "C:\a\b\filename.ext")
					2. bExt    - extend를 return되는 File명에 포함시킬지 여부 ( 옵션 : Default=false )
								- true 	: extend를 File명에 포함시킴
								- false : extend를 File명에 포함시키지 않음
					2. 성공 =
							- bExt = true인 경우 ===> sPath에서 File명(예 : "filename.ext") return
							- bExt = false인 경우 ===> sPath에서 File명(예 : "filename") return
					실패 = "" return

	getFileName : ( sPath, bExt ) => {
		let start_pos, end_pos, tmp_pos, filename;

		if( StrLib.isNull(sPath) )		return "";
		if( StrLib.isNull(bExt) )
			bExt = false;

		start_pos = Math.max(StrLib.getPosReverse( sPath, "\\" ), StrLib.getPosReverse( sPath, "/" ));
		tmp_pos = StrLib.getPosReverse( sPath, "::");
		if( tmp_pos > 0 ) tmp_pos++;
		start_pos = Math.max( start_pos, tmp_pos );
		if( bExt === false ) {
			end_pos = StrLib.getPosReverse( sPath, "." );
			if( end_pos < 0 )
				end_pos = sPath.length;
			filename = sPath.substr( start_pos+1, end_pos-start_pos-1 );
		} else {
			filename = sPath.substr( start_pos+1 );
		}

		return filename;
	}
	*--------------------------------------------------------------------------------------*/
};
const ExcelLib = {
	exportToExcel : (header, data, rtn, grdId) => {
		if (rtn) {
			let fileName = "[" + DateLib.getTodayTime() + "]_" + grdId + '_excel.xls';
			let excelComponent = document.createElement('a');
			excelComponent.setAttribute('id', '_aExcelExport');
			excelComponent.setAttribute('download', fileName);
			excelComponent.setAttribute('style', "display:none");
			excelComponent.setAttribute('href', "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + ExcelLib.base64(ExcelLib.export(ExcelLib.convertDataStructureToTable(header, data))));
			document.getElementById('root').appendChild(excelComponent);
			document.getElementById('_aExcelExport').click();
			document.getElementById('root').removeChild(document.getElementById('_aExcelExport'));
		}
	},
	getHeaderDepth : (header) => {
		let cnt = 1;
		let maxCnt = 1

		for (let intA = 0; intA < header.length; intA ++) {
			if (header[intA].hasOwnProperty('children')) {
				cnt += ExcelLib.getHeaderDepth(header[intA]['children']);
				if (maxCnt < cnt) {
					maxCnt = cnt;
				}
			}
		}
		return maxCnt;
	},
	getMaxDepth : (header) => {
		let maxDepth = 0;
		let depthArr = header.map(item => {return 1;});
		for (let intA = 0; intA < header.length; intA ++) {
			if (header[intA].hasOwnProperty('children')) {
				depthArr[intA] += ExcelLib.getMaxDepth(header[intA]['children']);
			}
		}
		maxDepth = depthArr.reduce( function (previous, current) {  return previous > current ? previous:current; });
		return maxDepth;
	},
	setHeader : (header) => {
		let getMaxDepth = ExcelLib.getMaxDepth(header);
		let result = "";
		for (let intA = 0; intA < getMaxDepth; intA ++) {
			result += "<tr>";
			for (let intB = 0; intB < header.length; intB ++) {
				if (!header[intB]['hide'] && !StrLib.isNull(header[intB]['headerName']) && header[intB]['cellRenderer'] !== 'actionButton'){
					result += "<th style= text-align: 'center'; ";
					if (header[intB].hasOwnProperty('children')) {
						result += "colspan='" + header[intB]['children'].length + "';";
					} else {
						result += "rowspan='" + getMaxDepth + "';";
					}
					result += ">";
					result += header[intB]['headerName'].replace(/\*/g,'');
					result += "</th>";
				}
			}
			result += "</tr>";
			if (header.filter(item => item.hasOwnProperty('children')).length > 0) {
				let headerArr = [];
				header.filter(item => item.hasOwnProperty('children')).forEach((item) => {
					item['children'].forEach((children) => {
						headerArr.push(children);
					});
				});
				result += ExcelLib.setHeader(headerArr);
			}
			return result;
		}
	},
	setHeaderforBody : (header) => {
		let bodyHeader = [];
		function setColumn (data, rtnArr) {
			for (let intA = 0; intA < data.length; intA ++) {
				if (!data[intA].hasOwnProperty('children')) {
					let json = ComLib.structuredClone(data[intA]);
					json['valueFormatter'] = data[intA]['valueFormatter'];
					bodyHeader.push(json);
					json = null;
				} else {
					setColumn(data[intA]['children'], rtnArr);
				}
			}
		}
		setColumn(header, bodyHeader);
		return bodyHeader;
	},
	convertDataStructureToTable : (header, data) => {
		let result;

		try {
			result = "<table>";
			result += "<thead>";
			result += ExcelLib.setHeader(header);
			result += "</thead>";
			result += "<tbody>";

			let rowNum = 1;
			let bodyHeader = ExcelLib.setHeaderforBody(header);
			data.forEach(item => {
				result += "<tr>";
				bodyHeader.forEach(head => {
					if (!head['hide'] && !StrLib.isNull(head['headerName']) && head['cellRenderer'] !== 'actionButton') {
						if (head['field'] === '_No') {
							result += "<td style= 'text-align: center;'>";
							result += rowNum;
							result += "</td>";
						}
						if (item.hasOwnProperty(head['field'])) {
							// 데이터 미 존재시 null로 찍히는걸 방지
							if (item[head['field']] === null ) { item[head['field']] = ''; }
							if (head['width'] !== undefined && head['width'] !== null && head['width'] !== '') {
								result += "<td style= 'mso-number-format: \\@; width: " + head['width'] + "px;";
								if (head['textAlign'] !== undefined && head['textAlign'] !== null && head['textAlign'] !== ''){
									result += "text-align: " + head['textAlign'] + ";";
								}
							} else {
								if (head['textAlign'] !== undefined && head['textAlign'] !== null && head['textAlign'] !== ''){
									result += "<td style= 'mso-number-format: \\@; text-align: " + head['textAlign'] + ";";
								} else {
									result += "<td style= 'mso-number-format: \\@;";
								}
							}
							result += "'>";
							if (typeof head['valueFormatter'] === 'function') {
								result += head['valueFormatter']({ 
											data : item
										,	value : item[head['field']]
										,	node : item['node']
								});
							} else {
								result += item[head['field']];
							}
							result += "</td>";
						}
					}
				});
				rowNum += 1;
				result += "</tr>";
			});
			result += "</tbody>";
			result += "</table>";
			return result;
		} finally {
			result = null;
		}
	},
	export : (htmltable) => {
		try {
			var excelFile = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
			excelFile += "<head>";
			excelFile += '<meta http-equiv="Content-type" content="text/html;charset=utf-8" />';
			excelFile += "<!--[if gte mso 9]>";
			excelFile += "<xml>";
			excelFile += "<x:ExcelWorkbook>";
			excelFile += "<x:ExcelWorksheets>";
			excelFile += "<x:ExcelWorksheet>";
			excelFile += "<x:Name>";
			excelFile += "{worksheet}";
			excelFile += "</x:Name>";
			excelFile += "<x:WorksheetOptions>";
			excelFile += "<x:DisplayGridlines/>";
			excelFile += "</x:WorksheetOptions>";
			excelFile += "</x:ExcelWorksheet>";
			excelFile += "</x:ExcelWorksheets>";
			excelFile += "</x:ExcelWorkbook>";
			excelFile += "</xml>";
			excelFile += "<![endif]-->";
			excelFile += "</head>";
			excelFile += "<body>";
			excelFile += htmltable.replace(/"/g, '\'');
			excelFile += "</body>";
			excelFile += "</html>";

			var ctx = { worksheet: 'My Worksheet', table: htmltable };
			var rtn = (ExcelLib.format(excelFile, ctx));
			return  rtn;
		} finally {
			rtn = null;
		}
	},
	format : (s, c) => {
		return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; });
	},
	base64 : (s) => {
		return window.btoa(unescape(encodeURIComponent(s)));
	}
};
const DateLib = {
	/*----------------------------------------------------------------------------------------
	* [해당월의 마지막 날짜를 숫자로 구하기]
	* @param	:	string sDate
	* @return	:	integer
	* @see		: 	1. sDate : yyyyMMdd형태의 날짜 ( 예 : "20121122" )
					2. 성공 => 마지막 날짜 숫자값 ( 예 : 30 ) return
					   실패 => -1 return
	*--------------------------------------------------------------------------------------*/
	getLastDateNum: (sDate) => {
		if (typeof sDate !== "string") sDate = new String(sDate);
		let nMonth, nLastDate;

		if (StrLib.isNull(sDate)) return -1;

		nMonth = parseInt(sDate.substr(4,2), 10);
		if (nMonth === 1 || nMonth === 3 || nMonth === 5 || nMonth === 7  || nMonth === 8 || nMonth === 10 || nMonth === 12 ) {
			nLastDate = 31;
		} else if (nMonth === 2) {
			if ( DateLib.isLeapYear(sDate) === true ) nLastDate = 29;
			else nLastDate = 28;
		} else {
			nLastDate = 30;
		}
		return nLastDate;
	},

	/*----------------------------------------------------------------------------------------
	* [윤년여부 확인]
	* @param	:	string sDate
	* @return	:	boolean
	* @see		: 	1. sDate : yyyyMMdd형태의 날짜 ( 예 : "20121122" )
					2. sDate가 윤년인 경우			=> true return
					   sDate가 윤년이 아닌 경우		=> false return
					   sDate가 입력되지 않은 경우	=> false return
	*--------------------------------------------------------------------------------------*/
	isLeapYear: (sDate) => {
		if (typeof sDate !== "string") sDate = new String(sDate);
		let ret, nY;

		if (StrLib.isNull(sDate)) return false;

		nY = parseInt(sDate.substring(0,4), 10);
		if ((nY % 4) === 0) {
			if ((nY % 100) !== 0 || (nY % 400) === 0) ret = true;
			else ret = false;
		} else {
			ret = false;
		}
		return ret;
	},

	/*----------------------------------------------------------------------------------------
	* [해당월의 마지막 날짜를 yyyyMMdd형태로 구하기]
	* @param	:	string sDate
	* @return	:	string
	* @see		: 	1. sDate : yyyyMMdd형태의 날짜 ( 예 : "20121122" )
					2. 성공 => yyyyMMdd형태의 마지막 날짜 ( 예 : "20121130" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getLastDate: (sDate) => {
		if (typeof sDate !== "string") sDate = new String(sDate);
		if (StrLib.isNull(sDate)) return "";
		let nLastDate = DateLib.getLastDateNum(sDate);
		return sDate.substr(0,6) + nLastDate.toString();
	},

	/*----------------------------------------------------------------------------------------
	* [입력된 날자에 nOffset 으로 지정된 만큼의 일을 증감한다]
	* @param	:	string sDate, integer nOffset
	* @return	:	string
	* @see		: 	1. sDate : 날짜 ( 예 : "20121122" )
					2. nOffset : 일 증감값 ( 예 : 10 또는 -10 )
					3. 성공 => yyyyMMdd형태의 증감된 날짜 ( 예 : "20121202" 또는 "20121112" ) return
					   실패 => "" return
	*--------------------------------------------------------------------------------------*/
	getAddDate: (sDate, nOffset) => {
		if (typeof sDate !== "string") sDate = new String(sDate);

		if (StrLib.isNull(sDate) || StrLib.isNull(nOffset)) return "";

		let nYear	= parseInt(sDate.substr(0, 4));
		let nMonth	= parseInt(sDate.substr(4, 2));
		let nDate	= parseInt(sDate.substr(6, 2)) + nOffset;

		let objDate = new Date(nYear, nMonth - 1, nDate);

		let sYear	= objDate.getFullYear().toString();
		let sMonth = (objDate.getMonth() + 1);
		if( sMonth < 10){
			sMonth = "0" + sMonth;
		}
		let sDay = objDate.getDate();
		if( sDay < 10){
			sDay = "0" + sDay;
		}
		return sYear + ""+sMonth + ""+sDay;
	},

	/*----------------------------------------------------------------------------------------
	* [입력된 날자에 nOffset 으로 지정된 만큼의 월을 증감한다]
	* @param	:	string sDate, integer nOffset
	* @return	:	string
	* @see		: 	1. sDate : 날짜 ( 예 : "20121122" )
					2. nOffset : 월 증감값 ( 예 : 1 또는 -1 )
					3. 성공 => yyyyMMdd형태의 증감된 날짜 ( 예 : "20121202" 또는 "20121022" ) return
					   실패 => "" return
	* @note  	:	단, 증감된 날짜가 그달의 마지막 날짜 월보다 큰 경우 그달의 마지막 날짜를 return한다.
					예를 들어, sDate="20120531", nOffset=-1일 경우 return="20120430" 이 된다.
	*--------------------------------------------------------------------------------------*/
	getAddMonth: (sDate, nOffset) => {
		if (typeof sDate !== "string") sDate = new String(sDate);

		if (StrLib.isNull(sDate) || StrLib.isNull(nOffset)) return "";
		sDate = StrLib.getTrim(sDate);

		let nYear 	= parseInt(sDate.substr(0, 4));
		let nMonth 	= parseInt(sDate.substr(4, 2)) + nOffset;
		let nDate 	= parseInt(sDate.substr(6, 2));

		let nLastDate, sRet;
		let objDate = new Date(nYear, nMonth, nDate);

		let sYear	= objDate.getFullYear().toString();
		let sMonth	= StrLib.getLPad(objDate.getMonth().toString(), 2, '0');
		let sDay	= StrLib.getLPad(objDate.getDate().toString(), 2, '0');
		if (sMonth === '00') {
			sYear = (parseInt(sYear) - 1).toString();
			sMonth = '12';
		}
		sRet = sYear + sMonth + sDay;

		let nsDate 	= parseInt(sRet.substr(6, 2));
		nLastDate = DateLib.getLastDateNum(sRet);
		sRet = sRet.substr(0,6);

		if (nsDate > nLastDate) sRet += nLastDate.toString();
		else sRet += (StrLib.getRight("0" + nsDate, 2)).toString();

		return sRet;
	},

	/*----------------------------------------------------------------------------------------
	* [해당 PC의 오늘 날짜를 가져온다]
	* @param	:
	* @return	:	string
	* @see		: 	1. 성공 => yyyyMMdd형태의 오늘 날짜 ( 예 : "20121122" ) return
					   실패 => 없음
	*--------------------------------------------------------------------------------------*/
	getToday: () => {
		let objDate = new Date();
		let sToday  = objDate.getFullYear().toString();
		sToday += StrLib.getRight("0" + (objDate.getMonth() + 1), 2);
		sToday += StrLib.getRight("0" + objDate.getDate(), 2);

		return sToday;
	},

	/*----------------------------------------------------------------------------------------
	* [해당 PC의 오늘 날짜 + 시간을 가져온다]
	* @param	:
	* @return	:	string
	* @see		: 	1. 성공 => yyyyMMddhhmiss형태의 오늘 날짜 ( 예 : "20121122223010" ) return
					   실패 => 없음
	*--------------------------------------------------------------------------------------*/
	getTodayTime: () => {
		let objDate = new Date();
		let sToday  = objDate.getFullYear().toString();
		sToday += StrLib.getRight("0" + (objDate.getMonth() + 1), 2);
		sToday += StrLib.getRight("0" + objDate.getDate(), 2);
		sToday += StrLib.getRight("0" + objDate.getHours(), 2);
		sToday += StrLib.getRight("0" + objDate.getMinutes(), 2);
		sToday += StrLib.getRight("0" + objDate.getSeconds(), 2);

		return sToday;
	},

	/*----------------------------------------------------------------------------------------
	* [두 일자간의 차이 일수 계산]
	* @param	: 	tring sStartDate, string sEndDate
	* @return	:	integer
	* @see		: 	1. sStartDate : yyyyMMdd형태의 From 일자 ( 예 : "20121122" )
					2. sEndDate   : yyyyMMdd형태의 To 일자 ( 예 : "20121202" )
					3. 성공 => 숫자 형태의 차이일수  ( 예 : 10 )  return
						* 단, sEndDate < sStartDate이면 음수가 return된다
					   실패 => return NaN
	*--------------------------------------------------------------------------------------*/
	getDiffDate: (sStartDate, sEndDate) => {
		sStartDate	= StrLib.getTrim(sStartDate);
		sEndDate	= StrLib.getTrim(sEndDate);
		if (StrLib.isNull(sStartDate) || StrLib.isNull(sEndDate)) return NaN;

		let vFromDate = new Date(parseInt(sEndDate.substring(0,4),  10), parseInt(sEndDate.substring(4,6)-1,  10), parseInt(sEndDate.substring(6,8), 10));
		let vToDate = new Date(parseInt(sStartDate.substring(0,4),  10), parseInt(sStartDate.substring(4,6)-1,  10), parseInt(sStartDate.substring(6,8), 10));

		return parseInt((vFromDate - vToDate) / (1000 * 60 * 60 * 24));
	},

	/*----------------------------------------------------------------------------------------
	* [두 월간의 차이 월수 계산]
	* @param	:	string sStartDate, string sEndDate
	* @return	:	integer
	* @see		: 	1. sStartDate : yyyyMMdd형태의 From 일자 ( 예 : "20121122" )
					2. sEndDate   : yyyyMMdd형태의 To 일자 ( 예 : "20131202" )
					3. 성공 => 숫자 형태의 차이월수  ( 예 : 10 ) return
						* 단, sEndDate < sStartDate이면 음수가 return된다.
					   실패 => NaN return
	* @note		:	단, sStartDate, sEndDate의 일은 포함하지 않고 계산된다
	*--------------------------------------------------------------------------------------*/
	getDiffMonth: (sStartDate, sEndDate) => {
		let nStartMon, nEndMon;
		sStartDate	= StrLib.getTrim(sStartDate);
		sEndDate	= StrLib.getTrim(sEndDate);
		if (StrLib.isNull(sStartDate) || StrLib.isNull(sEndDate)) return NaN;

		nStartMon = parseInt(sStartDate.substr(0, 4), 10) * 12 + parseInt(sStartDate.substr(4, 2), 10);
		nEndMon = parseInt(sEndDate.substr(0, 4), 10) * 12 + parseInt(sEndDate.substr(4, 2), 10);

		return (nEndMon - nStartMon);
	},

	/*----------------------------------------------------------------------------------------
	* [date => string]
	* @param	:	date objDate
	* @return	:	string
	* @see		:	1. objDate : Date Object
					2. 성공 => yyyyMMdd 형태의 날짜 문자열 return
					   실패 => '' return
	*--------------------------------------------------------------------------------------*/
	getStringDate: (objDate) => {
		if (StrLib.isNull(objDate)) return '';

		let year = objDate.getFullYear();
		let month = StrLib.getLPad((1 + objDate.getMonth()).toString(), 2, '0');
		let day = StrLib.getLPad((objDate.getDate()).toString(), 2, '0');

		return year + month + day;
	},

	/*----------------------------------------------------------------------------------------
	* [string => date]
	* @param	:	string sDate
	* @return	:	date
	* @see		:	1. sDate : yyyyMMdd 형태의 날짜 문자열
					2. 성공 => Date Object 형태로 return
					   실패 => '' return
	*--------------------------------------------------------------------------------------*/
	getDateYymmdd: (sDate) => {
		if (StrLib.isNull(sDate)) return '';
		if (sDate.length === 8) return new Date(parseInt(sDate.substring(0, 4)), parseInt(sDate.substring(4, 6)) - 1, parseInt(sDate.substring(6, 8)));
		else return '';
	},
	calculateDefaultDateRange: (defaultValue, startDateProp, endDateProp) => {
		if(!defaultValue){
			return { startDate: startDateProp, endDate: endDateProp };
		}

		let lowerDefaultValue = (defaultValue || '').toLowerCase();
		if(lowerDefaultValue.indexOf('today') === -1 && lowerDefaultValue.indexOf('end') === -1 && lowerDefaultValue.indexOf('start') === -1){
			console.error('기준값 오류', lowerDefaultValue);
			return { startDate: startDateProp, endDate: endDateProp };
		}
		
		let baseDateField = null;
		let baseDate = null;
		if( lowerDefaultValue.indexOf('today') > -1){
			baseDate = DateLib.getToday();
			baseDateField = 'today'
		} else if(lowerDefaultValue.indexOf('end') > -1){
			baseDate = endDateProp;
			baseDateField = 'end'
		} else if(lowerDefaultValue.indexOf('start') > -1){
			baseDate = startDateProp;
			baseDateField = 'start'
		}

		if(!baseDate){
			if (baseDateField === 'today') {
				baseDate = DateLib.getToday();
			} else {
				console.warn('기준일자(startDate/endDate)가 없어 today를 기준으로 설정합니다.', lowerDefaultValue);
				baseDate = DateLib.getToday();
				baseDateField = 'today';
			}
		}
		
		let calculatedStartDate = startDateProp;
		let calculatedEndDate = endDateProp;
		
		if( lowerDefaultValue.indexOf('+') === -1 && lowerDefaultValue.indexOf('-') === -1){
			calculatedStartDate = baseDate;
			calculatedEndDate = baseDate;
		} else {
			let isSum = 1;
			let sumData = "";
			if(lowerDefaultValue.indexOf('+') > -1){
				isSum = 1;
				sumData = lowerDefaultValue.split('+')[1];
			} else if(lowerDefaultValue.indexOf('-') > -1){
				isSum = -1;
				sumData = lowerDefaultValue.split('-')[1];
			}

			if((baseDateField === 'start' && isSum === -1) || (baseDateField === 'end' && isSum === 1)){
				console.error('시작보다 과거, 종료보다 미래 설정할 수 없는 범위', lowerDefaultValue, baseDateField, isSum);
				return { startDate: startDateProp, endDate: endDateProp };
			}

			if(!sumData){
				console.log('연산값이 전달되지 않음', lowerDefaultValue);
				return { startDate: startDateProp, endDate: endDateProp };
			}

			let sumValue = parseInt(sumData);
			let dateDv = sumData.replace(''+ sumValue, '');
			
			let targetDate = null;
			switch(dateDv){
				case 'w':
					targetDate = DateLib.getAddDate(baseDate, sumValue * (7 * isSum));
					break;
				case 'm':
					targetDate = DateLib.getAddMonth(baseDate, sumValue * isSum);
					break;
				case 'y':
					targetDate = DateLib.getAddMonth(baseDate, sumValue * (12 * isSum));
					break;
				case 'd':
				default:
					targetDate = DateLib.getAddDate(baseDate, sumValue * isSum);
					break;
			}

			if(baseDateField === 'today'){
				if( isSum === 1){
					calculatedStartDate = baseDate;
					calculatedEndDate = targetDate;
				} else {
					calculatedStartDate = targetDate;
					calculatedEndDate = baseDate;
				}
			} else if(baseDateField === 'end'){
				calculatedStartDate = targetDate;
				calculatedEndDate = baseDate;
			} else if(baseDateField === 'start'){
				calculatedStartDate = baseDate;
				calculatedEndDate = targetDate;
			}
		}

        return { startDate: calculatedStartDate, endDate: calculatedEndDate };
	},
};

const DataLib = {
	/*----------------------------------------------------------------------------------------
	* [변경된 Value를 Dataset Objec 및 react state에 Update]
	* @param	:	state prevState, string strDatasetId, integer nRowIndex, string, strColumnId, string strValue
	* @return	:	object
	* @see		:	1. prevState : React Class의 변경 전 state
					2. strDatasetId : Update 대상 Dataset Id 문자열 (state의 Dataset Key) ( 예 : 'dsLogin')
					3. nRowIndex : 변경 Value의 Target Row Index
					4. strColumnId : 변경 Value의 Target Column ID ( 예 : 'userId')
					5. strValue : 변경 Value
					2. 성공 => 변경 Value가 적용 된 Dataset Object 전체를 return
					   실패 => 없음
	*--------------------------------------------------------------------------------------*/
	setValueToDs: (prevState, strDatasetId, nRowIndex, strColumnId, strValue) => {
		let objDs = prevState[strDatasetId];
		objDs.setValue(nRowIndex, strColumnId, strValue);
		return {[strDatasetId]: objDs};
	},

	/*----------------------------------------------------------------------------------------
	* [변경된 Record를 Dataset Object 및 react state에 Update]
	* @param	:	state prevState, string strDatasetId, array arrRecords
	* @return	:	object
	* @see		:	1. prevState : React Class의 변경 전 state
					2. strDatasetId : Update 대상 Dataset Id 문자열 (state의 Dataset Key) ( 예 : 'dsLogin' )
					3. arrRecords : 변경된 Records (데이터 리스트) ( 예 : 쿼리 조회 결과 데이터 )
					2. 성공 => 변경 Value가 적용 된 Dataset Object 전체를 return
					   실패 => 없음
	*--------------------------------------------------------------------------------------*/
	setRecordsToDs: (prevState, strDatasetId, arrRecords) => {
		let objDs = prevState[strDatasetId];
		objDs.setRecords(arrRecords);
		return {[strDatasetId]: objDs};
	},
	/*----------------------------------------------------------------------------------------
	* [Dataset Record를 Initialize]
	* @param	:	state prevState, string strDatasetId, array arrRecords
	* @return	:	object
	* @see		:	1. prevState : React Class의 변경 전 state
					2. strDatasetId : Update 대상 Dataset Id 문자열 (state의 Dataset Key) ( 예 : 'dsLogin' )
					3. arrRecords : 변경된 Records (데이터 리스트) ( 예 : 쿼리 조회 결과 데이터 )
					2. 성공 => 변경 Value가 적용 된 Dataset Object 전체를 return
					   실패 => 없음
	*--------------------------------------------------------------------------------------*/
	initRecordsToDs: (prevState, strDatasetId, arrRecords) => {
		let objDs = prevState[strDatasetId];
		objDs.initRecords(arrRecords);
		return {[strDatasetId]: objDs};
	},
	appendRecordsToDs: (prevState, strDatasetId, arrRecords) => {
		let objDs = prevState[strDatasetId];
		objDs.appendRecords(arrRecords);
		return {[strDatasetId]: objDs};
	},

	datalist: {
		records: [],
		orgrecords: [],
		header: {},
		paging: {
			use: false,
			totalElements: 0,
			totalPages: 0,
			page: 0,
			size: 0,
		},
		size: function() {return this.records.length;},
		getRecords: function() {
			return ComLib.structuredClone(this.records);
		},
		getTransRecords: function(strRowType) {
			var arrRecords = ComLib.structuredClone(this.records);
			var arrOrgRecs = this.orgrecords;

			if (strRowType !== null && (strRowType === newScrmObj.constants.rowtype.CREATE_OR_UPDATE)) arrRecords = arrRecords.filter(item => item.rowtype === 'c' || item.rowtype === 'u');
			else if (strRowType !== null && strRowType === newScrmObj.constants.rowtype.DESTROY) arrRecords = arrRecords.filter(item => item.rowtype === 'd');

			for (var idxA = 0; idxA < arrRecords.length; idxA++) {
				for (var idxB = 0; idxB < arrOrgRecs.length; idxB++) {
					if (arrRecords[idxA].recid === arrOrgRecs[idxB].recid) arrRecords[idxA].orgdata = arrOrgRecs[idxB];
				}
			}
			return arrRecords;
		},
		
		updatePaging: function(data){
			if( this.paging.use === false){
				return false;
			}

			this.paging.totalElements = data.totalElements;
			this.paging.totalPages = data.totalPages;
			this.paging.page = data.number;
			// this.paging.size = data.size;
			this.paging.sort = data.sort;
			this.paging.first = data.first;
			this.paging.last = data.last;
			return true;
		},

		setRecords: function(data) {
			console.log('=== DataLib.setRecords 시작 ===', {
				dataType: typeof data,
				isArray: Array.isArray(data),
				hasContent: data && data.content !== undefined,
				dataLength: data && data.length !== undefined ? data.length : 'N/A',
				contentLength: data && data.content ? data.content.length : 'N/A',
				currentRecordsLength: this.records.length,
				pagingUse: this.paging.use,
				currentPaging: {...this.paging}
			});
			
			let records = [];
			if(!data || data.length === 0){
				console.log('DataLib.setRecords: 빈 데이터 - 초기화');
				this.records = [];
				this.resetPage();
				return;
			}
			
			if( data.content){
				records = data.content;
				console.log('DataLib.setRecords: data.content 사용', {recordsLength: records.length});
			} else {
				records = data;
				console.log('DataLib.setRecords: data 직접 사용', {recordsLength: records.length});
			}

			// 페이징하는 데이터 세트인가?
			const updatePagingResult = this.updatePaging(data);
			console.log('DataLib.setRecords: updatePaging 결과', {
				updatePagingResult: updatePagingResult,
				afterUpdatePaging: {...this.paging}
			});
			
			if( updatePagingResult ){

				// 페이징 데이터인지 확인 (first, last 등의 페이징 정보가 있는지)
				const isPagingData = data.first !== undefined || data.last !== undefined || data.page !== undefined;
				
				// 첫 페이지 여부 판단: 기존 데이터가 없거나 서버에서 첫 페이지라고 명시한 경우
				// 또는 페이징 데이터가 아닌 경우 (일반 데이터 변경)
				const isNewSearch = data.first === true && this.paging.page > 0;
				const shouldInitialize = this.getRecords().length === 0 || 
					(data.first === true && this.isFirstPage()) || 
					isNewSearch || 
					!isPagingData; // 페이징 정보가 없는 일반 데이터는 항상 초기화
				
				console.log('DataLib.setRecords: 조건 체크', {
					'getRecords().length === 0': this.getRecords().length === 0,
					'data.first === true': data.first === true,
					'this.isFirstPage()': this.isFirstPage(),
					'data.first === true && this.isFirstPage()': (data.first === true && this.isFirstPage()),
					isNewSearch: isNewSearch,
					isPagingData: isPagingData,
					shouldInitialize: shouldInitialize
				});
				
				if( shouldInitialize ){
					console.log('DataLib.setRecords: initRecords called', {
						currentLength: this.getRecords().length,
						isFirstPage: this.isFirstPage(),
						dataFirst: data.first,
						isNewSearch: isNewSearch,
						currentPage: this.paging.page,
						reason: this.getRecords().length === 0 ? 'no existing data' : 
								isNewSearch ? 'new search detected' : 'server first page'
					});
					this.initRecords(records);
				} else {
					console.log('DataLib.setRecords: appendRecords called (infinite scroll)', {
						currentLength: this.getRecords().length,
						isFirstPage: this.isFirstPage(),
						dataFirst: data.first,
						isPagingData: isPagingData
					});
					this.appendRecords(records);
					
					// 인피니트 스크롤에서 appendRecords 후 Grid 업데이트 트리거
					console.log('Triggering grid update after appendRecords:', {
						totalRecords: this.getRecords().length
					});
					
					// 약간의 지연 후 강제로 참조 변경을 통해 React 업데이트 트리거
					setTimeout(() => {
						console.log('Checking for grid callback:', {
							hasCallback: !!this._gridUpdateCallback,
							callbackType: typeof this._gridUpdateCallback
						});
						
						if (this._gridUpdateCallback) {
							console.log('Calling grid update callback');
							this._gridUpdateCallback(this.getRecords());
						} else {
							console.log('No grid callback found');
						}
					}, 10);
				}
			} else {
				this.initRecords(records);
			}

		},

		isLastPage: function() {
			if( this.paging.use === false){
				return true;
			}
			return this.paging.last;
		},

		isFirstPage: function() {
			if( this.paging.use === false){
				return true;
			}
			return this.paging.first;
		},

		nextPage: function() {
			if( this.paging.use === false || this.isLastPage()){
				return -1;
			}
			return this.paging.page++;
		},

		resetPage: function(){
			if( this.paging.use === false){
				return;
			}
			this.paging.totalElements = 0;
			this.paging.totalPages = 0;
			this.paging.page = 0;
			this.paging.first = true;
			this.paging.last = true;
		},

		getPaging: function(){
			if( this.paging.use === false){
				return {};
			}
			return this.paging;
		},

		getTotalRowCnt: function(){
			if( this.paging.use === false){
				return 0;
			}
			return this.paging.totalElements;
		},

		appendRecords: function(records) {
			console.log('appendRecords called:', {
				recordsType: typeof records,
				isArray: Array.isArray(records),
				recordsLength: records ? records.length : 0,
				currentRecordsLength: this.getRecords().length
			});
			
			if( records && records.length > 0 ){
				const beforeLength = this.getRecords().length;
				this.records.push.apply(this.records, records);
				const afterLength = this.getRecords().length;
				console.log('appendRecords completed:', {
					beforeLength: beforeLength,
					afterLength: afterLength,
					addedCount: afterLength - beforeLength
				});
			}
		},
		initRecords: function(records) {
			console.log('initRecords called:', {
				recordsType: typeof records,
				isArray: Array.isArray(records),
				recordsLength: records ? records.length : 0,
				currentRecordsLength: this.records.length,
				beforeClear: this.records.slice(0, 3) // 처음 3개 데이터만 로그
			});
			
			records = records || [];
			if (records.length !== undefined) {
				this.initialize(records);
				this.records = records;
				this.orgrecords = ComLib.structuredClone(records);
				
				console.log('initRecords completed:', {
					newRecordsLength: this.records.length,
					afterInit: this.records.slice(0, 3) // 처음 3개 데이터만 로그
				});
			}
		},
		getValue: function(index, column) {return this.records[index][column];},
		setValue: function(index, column, value) {
			var blnModified = false;
			if(!this.records || index < 0 || index >= this.records.length) {
				console.log("setValue empty records", index, column, value);
				return;
			}

			this.records[index][column] = value;
			if (this.records[index].rowtype !== 'c' && this.records[index].rowtype !== 'd') {
				var recid = this.records[index].recid;
				var arrCol = Object.keys(this.header);
				for (var idxA = 0; idxA < this.orgrecords.length; idxA++) {
					if (this.orgrecords[idxA].recid === recid) {
						for (var idxB = 0; idxB < arrCol.length; idxB++) {
							if (this.records[index][arrCol[idxB]] !== this.orgrecords[idxA][arrCol[idxB]]) {
								blnModified = true;
								break;
							}
						}
					}
				}
				if (blnModified) this.records[index].rowtype = 'u';
				else this.records[index].rowtype = 'r';
			}
		},
		getValueByRecId: function(recid, column) {
			var index = this.indexOf("recid", recid);
			if (index < 0 || index >= this.records.length) {
				console.log("getValueByRecId recid not found", recid, column);
				return undefined;
			}
			return this.records[index][column];
		},
		setValueByRecId: function(recid, column, value) {
			var index = this.indexOf("recid", recid);
			if (index < 0 || index >= this.records.length) {
				console.log("setValueByRecId recid not found", recid, column, value);
				return;
			}
			this.records[index][column] = value;
			if (this.records[index].rowtype !== 'c' && this.records[index].rowtype !== 'd') {
				for (var idx = 0; idx < this.orgrecords.length; idx++) {
					if (this.orgrecords[idx].recid === recid) {
						if (this.orgrecords[idx][column] === value) this.records[index].rowtype = "r";
						else if (this.orgrecords[idx][column] !== value) this.records[index].rowtype = "u";
					}
				}
			}
		},
		addRow: function(index) {
			if (typeof index === 'number') {
				this.records.splice(index, 0, ComLib.structuredClone(this.header));
				this.records[index]['rowtype'] = 'c';
				return index;
			} else {
				this.records.push(ComLib.structuredClone(this.header));
				this.records[this.size()-1]['rowtype'] = 'c';
				return this.size() - 1;
			}
		},
		getRow: function(index) {
			if (this.records.length > 0) return ComLib.structuredClone([this.records[index]]);
			else return [];
		},
		indexOf: function(column, value) {
			var index = -1;
			for (var i = 0; i < this.records.length; i++) {
				if (this.records[i][column] === value) {
					index = i;
					break;
				}
			}
			return index;
		},
		lastIndexOf: function(column, value) {
			let index = -1;
			for (let i = this.records.length; i >=0; i--) {
				if (this.records[i][column] === value) {
					index = i;
					break;
				}
			}
			return index;
		},
		find: function(column, value) {
			return this.records.filter(obj => obj[column] == value);
		  },
		findFirst: function(column, value) {
			return this.getRow(this.indexOf(column, value));
		},
		findLast: function(column, value) {
			return this.getRow(this.lastIndexOf(column, value));
		},
		filter: function(filterexpr) {
			return this.records.filter((new Function(`return ds => ${filterexpr}`))());
		},
		lookup: function(column, value, target) {
			const record = this.findFirst(column, value);
			return record === undefined ? undefined : record[target];
		},
		isUpdated: function() {
			if (this.records.filter(obj => obj.rowtype !== 'r').length > 0) return true;
			else return false;
		},
		initialize: function(records) {
			for (var idx = 0; idx < records.length; idx++) {
				if (!records[idx].hasOwnProperty("recid")) records[idx].recid = idx + 1;
				if (!records[idx].hasOwnProperty("rowtype")) records[idx].rowtype = 'r';
			}
			if (records.length > 0) {
				var arrCol = Object.keys(records[0]);
				for (var idx = 0; idx < arrCol.length; idx++) {
					this.header[arrCol[idx]] = "";
				}
			} else {
				this.header = {};
			}
		},

	getInstance: function(options) {
		options = options || {};
		let columns = options.columns || [];
		if( Array.isArray(options)) {
			columns = options;
		}
		
		// 깊은 복사를 위해 paging 객체도 복제
		const paging = ComLib.structuredClone(options.paging || {use:false});

		// 완전히 새로운 인스턴스 생성 (배열의 참조를 공유하지 않도록)
		const newInstance = Object.assign({}, DataLib.datalist, {
			records: [],  // 새로운 배열 생성
			orgrecords: [],  // 새로운 배열 생성
			header: {},  // 새로운 객체 생성
			paging: paging
		});

		if ( columns && columns.length > 0) {
			newInstance.initialize(columns);
			newInstance.records = [...columns];  // 배열 복사
			newInstance.orgrecords = ComLib.structuredClone(columns);  // 깊은 복사
		}

		return newInstance;
	},
	}
};

class TransManager {
	constructor() {
		this.id = '';
		this.url = '';
		this.callback = null;
		this.errorCallback = null;
		this.beforeSend = null;
		this.erorr = null;
		this.timeout = (1000 * 120);
		this.async = true;
		this.asyncdata = null;
		this.dataType = 'json';
		this.contentType = 'application/json';
		this.progress = true;
		this.httpMethod = 'post';
		this._tokenRetried = false;   // 토큰 갱신 후 원 요청 재시도는 요청당 한 번뿐(무한 루프 방지)
		this.constants = {
			url: {
				common: '/json.service.do',
				upload: '/upload.service.do',
			},
			errorcode: {
				SUCCESS: 'success',
				INVALID: 'invalid',
				ERROR: 'error',
				UPLOADFAIL: 'upload fail',
				TOKEN_EXPIRED: 'token_expired'
			},
			systemid: {
			},
			crudh: {
				create: '0',
				read: '1',
				update: '2',
				destroy: '3',
				procedure: '4',
				handle: '5',
				sequence: '6',
				iterator: '7',
				batch: '8',
				dir: '9',
				passwd: '10',
				interface: '11',

				dataset: 'ds_config'
			},
			dao: {
				base: '0'
			},
			config: {
				dao: '',
				crudh: '',
				sqlmapid: '',
				datasetmap: '',
				datasetsend: '',
				datasetrecv: '',
				columnid: '',
				systemid: '',
				retry: 0
			},
			accessToken: '',
			contentType: {
				form: 'application/x-www-form-urlencoded',
				upload: 'multipart/form-data',
				json: 'application/json',
				javascript : 'application/json'
			},
			noProgressbar : false
		};
		this.paging = null;
		this.transdata = {
			epytwor: newScrmObj.constants.crud,
			gifnoc: [],
			datasets: {},
//			reyolpme: { "CENT_CD": "", "TEAM_CD": "", "USR_CD" : "", "AUTH_LV": "", "CONN_IP": "" },
			noisivid: ComLib.getSession("SYSTEM_DV"),
		};
		this.datatype = {
			html: 'html',
			json: 'json',
			script: 'script',
			xml: 'xml'
		};
	};
	initialize = () => {
		this.transdata.epytwor = newScrmObj.constants.crud;
		this.transdata.gifnoc = [];
//		this.transdata.reyolpme = { "CENT_CD": "", "TEAM_CD": "", "USR_CD" : "", "AUTH_LV": "", "CONN_IP": "" };
		this.transdata.datasets = {};
		// this.setAccessToken(ComLib.getSession('accessToken')); // 쿠키 기반으로 변경되어 불필요
	};
	/*
	 * @deprecated
	*/
	setReyolpme = () => {
		var reyolpme = this.transdata.reyolpme;
		if (sessionStorage.getItem("gdsUserInfo") !== null) {
			var arrUser = ComLib.getSession("gdsUserInfo");
			reyolpme = {
				"CENT_CD": arrUser[0]["CENT_CD"],
				"TEAM_CD": arrUser[0]["TEAM_CD"],
				"USR_CD" : arrUser[0]["USR_CD"],
				"AUTH_LV": arrUser[0]["AUTH_LV"],
				"CONN_IP": arrUser[0]["CONN_IP"],
			};
		}
		return reyolpme;
	};
	setTransUrl = (url) => {
		this.url = url;
		if (this.constants.url.common === url) this.contentType = this.constants.contentType.json;
		else if (this.constants.url.upload === url) this.contentType = this.constants.contentType.upload;
	};
	setBeforeSend = (beforeSend) => {
		this.beforeSend = beforeSend;
	};
	setTransId = (transId) => {
		this.initialize();
		this.id	= transId;
//		this.transdata.reyolpme = this.setReyolpme();
	};
	setCallBack = (callback) => {
		this.callback	= callback;
	};
	setErrorCallback = (errorCallback) => {
		this.errorCallback = errorCallback;
	};
	setError = (error) => {
		this.error = error;
	};
	setTimeout = (timeout) => {
		this.timeout = timeout;
	};
	setAsync = (async) => {
		this.async = async;
	};
	setProgress = (progress) => {
		this.progress = progress;
	};
	makeTransData = () => {
		return { transdata: JSON.stringify(this.transdata) };
	};
	addConfig = (props) => {
		this.transdata.gifnoc.push(_.assign({}, this.constants.config, props));
	};
	addDataset = (name, dataset) => {
		this.transdata.datasets[name] = dataset;
	};
	addSequence = (props) => {
		this.addConfig( _.assign(props, { crudh: this.constants.crudh.sequence }));
	};
	addIterator = (props) => {
		this.addConfig( _.assign(props, { crudh: this.constants.crudh.iterator }));
	};
	addSendDataset = (name, dataset) => {
		this.transdata.datasets[name] = dataset;
	};
	addRecvDataset = (name, dataset) => {
		this.transdata.datasets[name] = dataset;
	};
	// setAccessToken = (token) => {
	//	this.constants.accessToken = token;
	// }; // 쿠키 기반으로 변경되어 불필요
	setProgressBar = (bln) => {
		this.constants.noProgressbar = bln;
	}
	replcaceSpChar = (data) => {
		if( data === undefined || data === null) {
			return '';
		}

		return data;

		// if( typeof data === 'string') {
		// 	return data.replace(/%/g, '％').replace(/=/g, '＝').replace(/&amp;/g, '＆').replace(/&/g, '＆');
		// } else {
		// 	return data;
		// }
	};
	// 로딩 카운터 관리 함수들
	startLoading = () => {
		newScrmObj.constants.loading.counter++;
		this.updateLoadingDisplay();
	};

	endLoading = () => {
		if (newScrmObj.constants.loading.counter > 0) {
			newScrmObj.constants.loading.counter--;
		}
		this.updateLoadingDisplay();
	};

	resetLoading = () => {
		newScrmObj.constants.loading.counter = 0;
		newScrmObj.constants.loading.totalRequests = 0;
		this.updateLoadingDisplay();
	};

	updateLoadingDisplay = () => {
		const { counter, totalRequests } = newScrmObj.constants.loading;
		const isVisible = counter > 0;
		
		// 로딩이 종료될 때 처리 건수 초기화
		if (!isVisible) {
			newScrmObj.constants.loading.totalRequests = 0;
		}
		
		let objLoadDiv = document.getElementById(newScrmObj.constants.mdi.LOADING);
		if (ComLib.isNull(objLoadDiv)) {
			objLoadDiv = document.createElement("div");
			objLoadDiv.id = newScrmObj.constants.mdi.LOADING;
		}
		document.body.appendChild(objLoadDiv);
		
		// 진행 상황 메시지 생성
		let progressMessage = '';
		// totalRequests가 미리 설정된 경우에만 진행률 표시
		if (isVisible && totalRequests > 0) {
			// completedRequests는 실제 완료된 요청 수를 나타냄
			// counter는 현재 진행 중인 요청 수를 나타냄
			const actualCompleted = Math.max(0, totalRequests - counter);
			progressMessage = `${actualCompleted}/${totalRequests}`;
		}
		
		renderToContainer(objLoadDiv, <Dialog.ModalLoading 
				isOpen={isVisible} 
				progressMessage={progressMessage}
			/>);
	};

	// 기존 doLoading 함수 (하위 호환성 유지)
	doLoading = (bVisible) => {
		if (bVisible) {
			this.startLoading();
		} else {
			this.endLoading();
		}
	};
	agent = () => {
		//console.log('request => ');
		//console.log(this.transdata);
		if (!this.constants.noProgressbar) {
			// loadProgressBar();
			if (this.progress) this.doLoading(this.progress);
		}
		if (!this.async) this.agentSync();
		else this.agentAsync();
	};

	post = (url, param, callback) => {
		return this.submit('post', url, param, callback);
	}

	get = (url, param, callback) => {
		return this.submit('get', url, param, callback);
	}
	
	submit = (httpMethod, url, param, callback) => {
		this.httpMethod = httpMethod;
		this.transdata = param;
		this.callback = callback;

		if( httpMethod === 'get' && param){
			url += '?' + Object.entries(param).map(([key, value]) => `${key}=${value}`).join('&');
			param = null;
		}
		this.url = url;

		if (!this.constants.noProgressbar) {
			// loadProgressBar();
			if (this.progress) this.doLoading(this.progress);
		}
		this.agentAsync();
	}
	
	agentAsync = async() => {
		const reqOptions = {
			method: this.httpMethod,
			//url: process.env.API_URL + this.url,
			url: ComLib.getSession("SVR_URL") + this.url,
			//data: this.contentType === this.constants.contentType.json ? this.replcaceSpChar(JSON.stringify(this.transdata)) : this.transdata.datasets.fileupload,
			headers: {
				"Content-Type": this.contentType,
			},
			json: true,
			retry: 0,
			progress: this.progress,
			timeout: this.timeout,
			withCredentials: true,
		};

		// 토큰은 이제 HttpOnly 쿠키로 자동 전송되므로 수동 설정 불필요
		// const accessToken = ComLib.getSession('accessToken') || '';
		// if( accessToken){
		//     axios.defaults.headers.common['Authorization'] = accessToken;
		//     reqOptions.headers["Authorization"] = accessToken;
		// }

		if( this.contentType === this.constants.contentType.form){
            const formData = new URLSearchParams();
			for(let key in this.transdata){
				formData.append(key, this.transdata[key]);
			}
            reqOptions.data = formData;
		} else if (this.contentType === this.constants.contentType.upload){
			reqOptions.data = this.transdata.datasets.fileupload;
		} else {
			if(this.paging){
				reqOptions.data = this.replcaceSpChar(JSON.stringify({...this.transdata, paging: this.paging}));
			} else {
				reqOptions.data = this.replcaceSpChar(JSON.stringify(this.transdata));
			}
		}

		if( this.paging){
			if( reqOptions.url.indexOf('?') === -1){
				reqOptions.url += '?';
			} else {
				reqOptions.url += '&';
			}
			const queryParts = [];
			for (const key of Object.keys(this.paging)) {
				const value = this.paging[key];
				if (key === 'sort' && Array.isArray(value)) {
					value.forEach(sortItem => {
						queryParts.push(`${key}=${encodeURIComponent(sortItem)}`);
					});
				} else if (value !== undefined && value !== null) {
					queryParts.push(`${key}=${encodeURIComponent(value)}`);
				}
			}
			reqOptions.url += queryParts.join('&');
		}

		let resData = null; // resData 변수를 try 블록 밖으로 이동하여 catch 블록에서도 유효하게 접근
		let responseResult = { id: this.id, data: {}, result: this.constants.errorcode.ERROR }; // 기본 오류 결과로 초기화

		
		try {
			if (!this.constants.noProgressbar && this.progress) { // progress가 정의되어 있고 false가 아닐 때만 시작
				this.startLoading(); // 로딩 시작
			}
			
			// 토큰 갱신 함수 생성
			this.updateToken = this.createUpdateToken(reqOptions);

			// 프로토타입은 백엔드로 나가지 않는다. 같은 요청 옵션을 로컬 저장소가 처리한다.
			resData = await runLocalRequest(reqOptions);

			if (!this.constants.noProgressbar && this.progress) {
				this.endLoading(); // 로딩 종료
			}

			responseResult = { id: this.id, data: resData.data, result: this.constants.errorcode.SUCCESS };
			const regex = /\/r(0[1-9]|[1-9][0-9])$/;


		} catch (err) {
			responseResult = this.commonCallback(err, resData);
			if( responseResult === false){
				return;
			}
		} finally {
			if (!this.constants.noProgressbar && this.progress) {
				this.endLoading(); // 로딩 종료
			}
		}
	
		// 최종 결과 반환 (Promise 또는 콜백)
		// 콜백이 제공되면 콜백으로 처리하고, 그렇지 않으면 Promise를 반환
		if (this.callback && typeof this.callback === 'function') {
			return this.callback(responseResult, resData);
		} else {
			// 성공 시 resolve, 실패 시 reject
			if (responseResult && responseResult.result === this.constants.errorcode.SUCCESS) {
				return Promise.resolve(responseResult);
			} else {
				return Promise.reject(responseResult);
			}
		}
	};

	errorDialog = (message, err, resData) => {
		console.error('API 호출 중 오류 발생: ', message, this.id, err, resData);
		if( this.constants.noErrorDialog){
			return;
		}
	
		// ComLib.showStatusMessage(message);
		ComLib.openDialog('A', 'SYSI0010', [message]);
	}

	commonCallback = (err, resData) => {

		if (!this.constants.noProgressbar && this.progress) {
			this.endLoading(); // 로딩 종료
		}

		if( this.errorCallback && typeof this.errorCallback === 'function'){
			if( this.errorCallback(err, resData)){
				return;
			}
		}
		// 정상응답이 아닌 경우 처리
		if(!err.response){
			let message = '';
			if (err.request) {
				// 요청이 이루어졌지만 응답을 받지 못했습니다.
				// `err.request`는 브라우저의 XMLHttpRequest 인스턴스 또는 Node.js의 http.ClientRequest 인스턴스
				message = '네트워크 오류 발생\n서버 응답 없음.';
			} else {
				// 오류를 발생시킨 요청을 설정하는 중에 무언가 발생했습니다.
				message = '클라이언트 요청 오류 발생\n로그를 확인하십시오.';
			}
			this.errorDialog(message, err, resData);
			return { id: this.id, data: {message: message}, status: this.constants.errorcode.INVALID };
		}

		// Axios 오류 응답 구조 확인 (response, request, message 등)
		// JWT 토큰 만료 처리 (백엔드에서 400 상태코드로 반환)
		switch( err.response.data.status){
			case 400: // 클라이언트 요청 오류
			    return { id: this.id, data: err.response.data || {}, status: this.constants.errorcode.INVALID };

			case 401: // 클라이언트 요청 오류
				this.errorDialog(err.response.data.message, err, resData);
				return false;
			case 471: // Access Token 만료 (accessToke 재발급)
				// [A안 2026-09-03] 사용자가 「아니오」로 연장을 거부했으면 <조용히 살리지 않는다>.
				//  종전에는 이 자리가 묻지 않고 갱신해, 확인창의 답이 아무 의미가 없었다.
				if (ComLib.isTokenRenewDeclined()) {
					console.log('세션 연장을 거부한 상태 — 자동 갱신하지 않고 종료한다');
					ComLib.endExpiredSession();
					return false;
				}
				console.log('accessToken 만료 재발급');
				if (this.updateToken && typeof this.updateToken === 'function') {
					this.updateToken().catch(tokenError => {
						console.error('토큰 갱신 실패:', tokenError);
					});
				}
				return false;

			case 473: // 세션 만료
				ComLib.clearSession();
				ComLib.openAlertDialog('세션이 종료되었습니다.\n다시 로그인해주세요.', () => {
					ComLib.logout();
					return;
				});
				return false;
			case 474: // 유효하지 않은 Refresh Token
				ComLib.clearSession();
				ComLib.openAlertDialog('로그인 정보가 올바르지 않습니다.\n다시 로그인해주세요.', () => {
					ComLib.logout();
				});
				return false;
			case 475: // 중복 로그인
				// ComLib.setSession('accessToken', ''); // 쿠키는 서버에서 자동 삭제됨
				ComLib.clearSession();
				ComLib.openAlertDialog('중복 로그인이 감지되었습니다.\n다시 로그인해주세요.', () => {
					ComLib.logout();
				});
				return false;
		}

		if(err.response.status === 403){
			console.log(resData);
			this.errorDialog("서비스 사용 권한이 없습니다.", err, resData);
			return false;
		}

		// 서버가 응답을 반환했지만, 2xx 범위 밖의 상태 코드
		if(err.response.status >= 500){
			const errorMessage = err.response.data && err.response.data.message ? err.response.data.message : '로그를 확인하십시오.';
			this.errorDialog(`서버 오류 발생 (${err.response.status})\n${errorMessage}`, err, resData);
			return { id: this.id, data: err.response.data || {}, status: this.constants.errorcode.ERROR };
			
		} else {
			return { id: this.id, data: err.response.data || {}, status: this.constants.errorcode.INVALID };
		}
		
	}


	createUpdateToken = (reqOptions) => {
		// this 컨텍스트를 보존하기 위해 변수에 저장
		const self = this;

		if( this.constants.noErrorDialog){
			// 에러 대화상자 비활성화 시 토큰 갱신 함수 비활성화
			return () => {
				console.log('에러 대화상자 비활성화 시 토큰 갱신 함수 비활성화');
				return Promise.resolve();
			}
		}

		return async () => {
			try {
				// ⚠ 재시도 상한 — 갱신 뒤 원 요청을 다시 보내는데 그것이 <또> 471 이면
				//   여기로 되돌아와 갱신·재시도를 무한 반복한다(2026-09-03 실측: 8초에 702회).
				//   한 번 재시도해도 안 되면 서버가 살려 줄 수 없는 상태다 — 세션을 끝낸다.
				if (reqOptions && self._tokenRetried) {
					console.warn('토큰을 갱신하고 재시도했는데도 만료 응답 — 세션을 종료한다');
					ComLib.endExpiredSession();
					return;
				}

				console.log('Access Token 갱신 시도...');

				const api = axios.create({
					headers: {
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				});
				
				const resData = await api.post(ComLib.getSession('SVR_URL') + '/api/auth/refresh', {});
				
				console.log('Access Token 갱신 성공');
				
				// 토큰 갱신 성공 시 원래 요청 재시도 (요청당 한 번만 — 위 상한 참조)
				if( reqOptions){
					console.log('원래 요청 재시도...');
					self._tokenRetried = true;
					return await self.agentAsync();
				}
				
				return resData;
				
			} catch (error) {
				console.error('Access Token 갱신 실패:', error);
				
				// 갱신 실패 시 로그아웃 처리
				if (error.response && (error.response.status === 473 || error.response.status === 474)) {
					ComLib.clearSession();
					ComLib.openAlertDialog('로그인 세션이 만료되었습니다.\n다시 로그인해주세요.', () => {
						ComLib.logout();
					});
				} else {
					ComLib.openAlertDialog('토큰 갱신 중 오류가 발생했습니다.\n다시 로그인해주세요.', () => {
						ComLib.logout();
					});
				}
				
				throw error;
			}
		}
	}


    // contentType을 외부에서 설정할 수 있는 메서드 추가
    setContentType = (contentType) => {
        this.contentType = contentType;
    };
    
    // 또는 상수를 사용하여 설정하는 메서드
    setContentTypeByConstant = (type) => {
		if(!this.constants.contentType[type]){
			throw new Error("Invalid contentType ["+ type+"]");
		}
		this.contentType = this.constants.contentType[type];
    };
	setPaging = (paging) => {
		this.paging = paging;
	}

	setFormData = (formData) => {
		this.transdata = formData;
	}
};

TransManager.post = (url, param, callback, options) => {
	let transManager = new TransManager();
	transManager.setTransId(url);
	transManager.setTransUrl(url);
	transManager.setCallBack(callback);
	// options.onError 를 주면 기본 차단 모달(SYSI0010) 대신 호출부가 오류를 처리한다.
	// 화면 일부(예: 요금제 목록)만 실패했을 때 탭 전체를 막지 않고 인라인 배너로 알리기 위한 통로다.
	if (options && typeof options.onError === 'function') {
		transManager.setErrorCallback((err, resData) => { options.onError(err, resData); return true; });
	}
    if (param.paging && typeof param.paging === 'object' && !Array.isArray(param.paging) && param.paging.size !== undefined) {
		transManager.setPaging(param.paging);
	}
	transManager.setFormData(param);
	transManager.httpMethod = 'post';
	
	// 로딩 처리를 위해 agent() 메서드 사용 (agentAsync 직접 호출 대신)
	transManager.agent();

	// return new TransManager().submit('post', url, param, callback);
}

TransManager.get = (url, param, callback) => {
	let transManager = new TransManager();
	
	// 페이징 정보 분리 - setPaging은 호출하지 않고 URL에만 추가
	if (param && param.paging && typeof param.paging === 'object' && !Array.isArray(param.paging) && param.paging.size !== undefined) {
		// paging 객체를 param에서 제거하고 개별 파라미터로 변환
		const { paging, ...restParam } = param;
		param = restParam;
		
		// Spring Pageable이 인식하는 page, size 파라미터 추가
		if (paging.page !== undefined) {
			param.page = paging.page;
		}
		if (paging.size !== undefined) {
			param.size = paging.size;
		}
	}
	
	if (param) {
		url += '?' + Object.entries(param)
			.filter(([_, value]) => value !== null && value !== undefined && value !== '')
			.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
			.join('&');
	}

	transManager.setTransId(url);
	transManager.setTransUrl(url);
	transManager.setCallBack(callback);
	transManager.setFormData(param);
	transManager.httpMethod = 'get';
	
	// 로딩 처리를 위해 agent() 메서드 사용 (agentAsync 직접 호출 대신)
	transManager.agent();
}

// PopupManager에서 접근할 수 있도록 ComLib를 전역 객체로 등록
if (typeof window !== 'undefined') {
    window.ComLib = ComLib;
    window.StrLib = StrLib;
    console.log('[index.js] ComLib, StrLib가 window 객체에 등록되었습니다.');
}

export { 
    newScrmObj, 
    ComLib, 
    StrLib, 
    FileLib, 
    ExcelLib, 
    DateLib, 
    TransManager, 
    DataLib,
    PopupManager,      // 팝업 관리자 인스턴스 추가
    PopupManagerClass,  // 팝업 관리자 클래스 추가
    NotificationManager, // 알림 관리자 추가
    getDialogNotificationManager, // Dialog 알림 관리자 함수 추가
    cnsObj
};