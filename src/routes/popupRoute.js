/*******************************************************************
 * NEXSIS 동적 팝업 라우트 시스템
 * 
 * 주요 기능:
 * - gdsMenu 기반 동적 팝업 라우트 생성
 * - 사용자 권한에 따른 팝업 화면 접근 제어
 * - 필수 팝업 라우트(비밀번호 관련)는 항상 등록
 * - 업무 팝업은 권한이 있는 경우만 동적 등록
 *******************************************************************/

import { ComLib } from 'common';
import dynamicRouteManager from './DynamicRouteManager';

/*******************************************************************
 * 동적 팝업 라우트 생성 함수
 *******************************************************************/

/**
 * 팝업 라우트 생성
 * @returns {Array} 팝업 라우트 배열
 */
export const getPopupRoutes = () => {
    try {
        // ComLib이 로드되었는지 확인
        if (!ComLib || typeof ComLib.getSession !== 'function') {
            // console.info('ℹ️ ComLib이 아직 로드되지 않았습니다. 필수 팝업 라우트만 반환합니다.');
            return dynamicRouteManager.generateRoutes([], 'popup');
        }
        
        const menuList = ComLib.getSession('gdsMenu');
        
        if (!menuList || menuList.length === 0) {
            // console.info('ℹ️ ComLib이 아직 로드되지 않았습니다. 필수 팝업 라우트만 반환합니다.');
            return dynamicRouteManager.generateRoutes([], 'popup');
        }

        // console.log(`📊 팝업 라우트용 메뉴 데이터 로드됨: ${menuList.length}개`);
        
        // // 팝업 메뉴 확인 (npagYn이 'Y' 또는 'P'인 메뉴)
        // const popupMenus = menuList.filter(menu => ['Y', 'P'].includes(menu.npagYn));
        // console.log(`🔍 팝업 메뉴 발견: ${popupMenus.length}개`, popupMenus.slice(0, 3).map(m => ({
        //     menuId: m.menuId,
        //     menuNm: m.menuNm,
        //     npagYn: m.npagYn,
        //     scrnSize: m.scrnSize,
        //     urlAddr: m.urlAddr
        // })));
        

        const routes = dynamicRouteManager.generateRoutes(menuList, 'popup');
        console.log(`✅ 팝업 라우트 생성 완료: ${routes.length}개`);
        
        return routes;
        
    } catch (error) {
        console.error('❌ 팝업 라우트 생성 실패:', error);
        return dynamicRouteManager.generateRoutes([], 'popup');
    }
};

/**
 * 기존 호환성을 위한 popRoute export (지연 초기화)
 * @deprecated getPopupRoutes() 사용 권장
 */
let _popRouteCache = null;
let _initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

export const popRoute = new Proxy([], {
    get(target, prop) {
        // 캐시가 없거나 배열 메서드 호출 시 초기화
        if (_popRouteCache === null || typeof target[prop] === 'function') {
            try {
                _popRouteCache = getPopupRoutes();
                
                // 유효성 검사
                if (!Array.isArray(_popRouteCache)) {
                    throw new Error(`getPopupRoutes()가 배열이 아닌 ${typeof _popRouteCache}를 반환했습니다.`);
                }
                
                // 캐시된 라우트를 현재 배열에 복사
                target.length = 0;
                target.push(..._popRouteCache);
                _initializationAttempts = 0; // 성공 시 카운터 리셋
                
            } catch (error) {
                _initializationAttempts++;
                console.warn(`⚠️ popRoute 초기화 실패 (시도 ${_initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS}):`, error.message);
                
                // 최대 시도 횟수 초과 시 더 상세한 로그
                if (_initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
                    console.error('🚨 popRoute 초기화 최대 시도 횟수 초과. 시스템 상태 확인 필요:', {
                        error: error.message,
                        stack: error.stack,
                        ComLibAvailable: typeof ComLib !== 'undefined',
                        sessionAvailable: typeof sessionStorage !== 'undefined'
                    });
                }
                
                _popRouteCache = [];
                target.length = 0;
            }
        }
        
        // 배열 메서드인 경우 바인딩하여 반환
        if (typeof target[prop] === 'function') {
            return target[prop].bind(target);
        }
        
        return target[prop];
    },
    
    has(target, prop) {
        // length나 배열 인덱스 접근 시에도 초기화
        if (prop === 'length' || !isNaN(prop)) {
            if (_popRouteCache === null) {
                try {
                    _popRouteCache = getPopupRoutes();
                    target.length = 0;
                    target.push(..._popRouteCache);
                } catch (error) {
                    console.warn('⚠️ popRoute 초기화 실패, 빈 배열 반환:', error.message);
                    _popRouteCache = [];
                    target.length = 0;
                }
            }
        }
        return prop in target;
    },
    
    ownKeys(target) {
        // 키 열거 시에도 초기화
        if (_popRouteCache === null) {
            try {
                _popRouteCache = getPopupRoutes();
                target.length = 0;
                target.push(..._popRouteCache);
            } catch (error) {
                console.warn('⚠️ popRoute 초기화 실패, 빈 배열 반환:', error.message);
                _popRouteCache = [];
                target.length = 0;
            }
        }
        return Reflect.ownKeys(target);
    }
});

/**
 * 특정 팝업 라우트 존재 여부 확인
 */
export const hasPopupRoute = (routeId) => {
    return dynamicRouteManager.hasRoute(routeId, 'popup');
};

/**
 * 팝업 라우트 캐시 초기화 (로그인 후 호출)
 */
export const refreshPopupRoutes = () => {
    console.log('🔄 팝업 라우트 캐시 새로고침');
    dynamicRouteManager.clearCache();
    // popRoute 캐시도 초기화
    _popRouteCache = null;
};

/**
 * 팝업 라우트 디버그 정보 반환
 */
export const getPopupRouteDebugInfo = () => {
    const menuList = ComLib.getSession('gdsMenu') || [];
    const popupMenus = menuList.filter(m => ['Y', 'P'].includes(m.npagYn));
    
    return {
        ...dynamicRouteManager.getDebugInfo(),
        totalMenuCount: menuList.length,
        popupMenuCount: popupMenus.length,
        popupMenuSample: popupMenus.slice(0, 5).map(m => ({
            menuId: m.menuId,
            menuNm: m.menuNm,
            urlAddr: m.urlAddr,
            scrnSize: m.scrnSize,
            npagYn: m.npagYn
        }))
    };
};

/*******************************************************************
 * 개발자 도구용 전역 함수 등록
 *******************************************************************/
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    window.debugPopupRoutes = {
        getPopupRoutes,
        getPopupRouteDebugInfo,
        refreshPopupRoutes,
        hasPopupRoute
    };
    console.log('🛠️ 개발자 도구: window.debugPopupRoutes 사용 가능');
}
