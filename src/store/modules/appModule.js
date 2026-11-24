import { createAction, handleActions} from 'redux-actions';

const ADD_POP = 'base/ADD_POP';
const DELETE_POP = 'base/DELETE_POP';
const DELETE_ALL_POP = 'base/DELETE_ALL_POP';
const SELECT_POP = 'base/SELECT_POP';
const ADD_TRAY = 'base/ADD_TRAY';
const DELETE_TRAY = 'base/DELETE_TRAY';
const DELETE_ALL_TRAY = 'base/DELETE_ALL_TRAY';
const SELECT_TRAY = 'base/SELECT_TRAY';
const PREVIOUS_TRAY = 'base/PREVIOUS_TRAY';
const NEXT_TRAY = 'base/NEXT_TRAY';
const MEMO_WITH_FOLDER_UPDATE = 'base/MEMO_WITH_FOLDER_UPDATE';
const MEMO_UPDATE = 'base/MEMO_UPDATE';
const NOTIFICATION_UPDATE = 'base/NOTIFICATION_UPDATE';
const UNREAD_NOTICES_COUNT_UPDATE = 'base/UNREAD_NOTICES_COUNT_UPDATE';

export const addTray	= createAction(ADD_TRAY);
export const delTray	= createAction(DELETE_TRAY);
export const delAllTray	= createAction(DELETE_ALL_TRAY);
export const selectTray	= createAction(SELECT_TRAY);
export const prevTray	= createAction(PREVIOUS_TRAY);
export const nextTray	= createAction(NEXT_TRAY);

export const addPop		= createAction(ADD_POP);
export const delPop		= createAction(DELETE_POP);
export const delAllPop	= createAction(DELETE_ALL_POP);
export const selectPop	= createAction(SELECT_POP);

export const memoWithFolderUpdate = createAction(MEMO_WITH_FOLDER_UPDATE);
export const memoUpdate = createAction(MEMO_UPDATE);
export const notificationUpdate = createAction(NOTIFICATION_UPDATE);
export const unreadNoticesCountUpdate = createAction(UNREAD_NOTICES_COUNT_UPDATE);

const initState = {
	selected : '',
	tray : [],
	popupList : [],
	memoList: [],
	folderList: [],
	needConfirmCount : 0,
	/**
	 * 알림 계열 건수.
	 *
	 * 종전에는 여섯 개였다 — 부서/나의/미처리 업무 이관 · 콜백 배정 · 통화 예약 · 예약 메모.
	 * 앞의 다섯은 이전 시스템(CNS*)의 상담 기능이고 ChatCall 에 없다. 그 다섯을 띄우던
	 * 알림 항목은 §10.106 에서 제거됐고(사용자 결정), 남은 소비자가 0 이라 여기서도 지운다.
	 * 서버(`UserSummaryDto`)는 아직 다섯을 함께 내려주지만 화면이 쓰지 않는다.
	 *
	 * `reservationMemosCount` 만 살아 있다 — 사이드 <마이메모> 배지가 쓰고,
	 * `sup_memo` 를 실제로 세어 온다(실측 1건).
	 */
	notificationCountList : {
		reservationMemosCount: 0,
	},
	/** 미확인 공지 건수. 숫자다 — 종전에는 객체를 넣고 한 겹 더 파서 꺼내 썼다. */
	unReadNoticesCount: 0
}

export default handleActions ({
	[ADD_POP] : (state, { payload : popup }) => {
		return { ...state, popupList : state.popupList.concat(popup) };
	},
	[DELETE_POP] : (state, { payload : popup }) => {
		return { ...state, popupList : state.popupList.filter(item => item.id !== popup.id) };
	},
	[DELETE_ALL_POP] : (state, action) => {
		return { ...state , popupList : [] };
	},
	[SELECT_POP] : (state, { payload : popup }) => {
		return { ...state, popupList : state.popupList.filter(item => item.id !== popup.id) };
	},
	[ADD_TRAY] : (state, { payload : menu }) => {
		if (state.tray.indexOf(state.tray.filter(item => item.menuId === menu.menuId)[0]) < 0) {
			return {
				...state,
				tray: state.tray.concat(menu),
				selected : menu
			}
		} else {
			return {
				...state,
				tray: state.tray,
				selected : menu
			}
		}
	},
	[DELETE_TRAY] : (state, { payload : menu }) => {
		const currentIndex = state.tray.findIndex(element => element.menuId === menu.menuId);
		
		// 메뉴를 찾을 수 없으면 상태 변경 없음
		if (currentIndex === -1) {
			console.warn(`⚠️ 삭제할 트레이를 찾을 수 없습니다: ${menu.menuId}`);
			return state;
		}
		
		// closeable이 false인 경우 삭제 방지
		if (menu.closeable === false) {
			console.warn(`⚠️ 닫을 수 없는 트레이입니다: ${menu.menuId}`);
			return state;
		}
		
		const newTray = state.tray.filter(item => item.menuId !== menu.menuId);
		
		// 모든 트레이가 삭제되면 빈 상태로
		if (newTray.length === 0) {
			return {
				...state,
				tray: [],
				selected: null
			};
		}
		
		// 삭제된 트레이가 현재 선택된 트레이인 경우 새로운 선택 트레이 결정
		let newSelected = state.selected;
		if (state.selected?.menuId === menu.menuId) {
			// 이전 트레이가 있으면 이전 트레이 선택, 없으면 다음 트레이 선택
			if (currentIndex > 0) {
				newSelected = newTray[currentIndex - 1];
			} else if (newTray.length > 0) {
				newSelected = newTray[0];
			} else {
				newSelected = null;
			}
		}
		
		console.log(`✅ 트레이 삭제: ${menu.menuId}, 새로운 선택: ${newSelected?.menuId || 'none'}`);
		
		return {
			...state,
			tray: newTray,
			selected: newSelected
		};
	},
	[DELETE_ALL_TRAY] : (state, action) => {
		// tray가 비어있으면 아무것도 하지 않음
		if (!state.tray || state.tray.length === 0) {
			return state;
		}
		
		// closeable이 false인 화면들만 남김 (닫기 버튼이 없는 화면)
		const nonCloseableTrays = state.tray.filter(tray => tray.closeable === false);
		
		// 닫을 수 없는 화면이 없으면 모든 화면 닫기
		if (nonCloseableTrays.length === 0) {
			return {
				...state,
				tray: [],
				selected: null
			};
		}
		
		// 닫을 수 없는 화면들만 남기고, 첫 번째 것을 선택
		return {
			...state,
			tray: nonCloseableTrays,
			selected: nonCloseableTrays[0]
		};
	},
	[SELECT_TRAY] : (state, { payload : menu }) => {
		return {
			...state,
			tray: state.tray,
			selected : menu
		}
	},
	[PREVIOUS_TRAY] : (state, { payload : menu }) => {
		if (parseInt(state.tray.findIndex(element => element === menu)) === 0) {
			return {
				...state,
				tray: state.tray,
				selected : menu
			}
		} else {
			return {
				...state,
				tray: state.tray,
				selected : state.tray[parseInt(state.tray.findIndex(element => element === menu)) - 1]
			}
		}
	},
	[NEXT_TRAY] : (state, { payload : menu }) => {
		if(parseInt(state.tray.findIndex(element => element === menu)) === state.tray.length-1) {
			return {
				...state,
				tray: state.tray,
				selected : menu
			}
		} else {
			return {
				...state,
				tray: state.tray,
				selected : state.tray[parseInt(state.tray.findIndex(element => element === menu)) + 1]
			}
		}
	},
	[MEMO_WITH_FOLDER_UPDATE] : (state, { payload : list }) => {
		return {
			...state,
			folderList : list
		}
	},
	[NOTIFICATION_UPDATE] : (state, { payload : list }) => {
		return {
			...state,
			notificationCountList : list
		}
	},
	[UNREAD_NOTICES_COUNT_UPDATE] : (state, { payload : count }) => {
		// payload 는 숫자다. 종전에는 { unReadNoticesCount: n } 객체가 통째로 들어와
		// 상태가 객체가 됐고, 읽는 쪽이 state.unReadNoticesCount.unReadNoticesCount 로
		// 한 겹 더 파고 있었다.
		return {
			...state,
			unReadNoticesCount : count
		}
	}
}, initState);

