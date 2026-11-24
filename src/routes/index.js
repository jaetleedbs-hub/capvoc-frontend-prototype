/*******************************************************************
 * NEXSIS 동적 라우트 시스템
 * 
 * 주요 기능:
 * - gdsMenu 기반 동적 라우트 생성
 * - 사용자 권한에 따른 화면 접근 제어
 * - 필수 라우트(SAM, DOCSAMPLE)는 항상 등록
 * - 업무 화면은 권한이 있는 경우만 동적 등록
 *******************************************************************/

import { ComLib } from 'common';
import dynamicRouteManager from './DynamicRouteManager';
import { popRoute } from './popupRoute';

/*******************************************************************
 * 동적 라우트 생성 함수
 *******************************************************************/

/**
 * 앱 라우트 생성
 * @returns {Array} 앱 라우트 배열
 */
export const getAppRoutes = () => {
    try {
        const menuList = ComLib.getSession('gdsMenu');
        
        if (!menuList || menuList.length === 0) {
            console.info('ℹ️ ComLib이 아직 로드되지 않았습니다. 필수 라우트만 반환합니다.');
            return dynamicRouteManager.generateRoutes([], 'app');
        }

        // console.log(`📊 메뉴 데이터 로드됨: ${menuList.length}개`);
        // console.log(`📋 메뉴 샘플:`, menuList.slice(0, 3).map(m => ({
        //     menuId: m.menuId,
        //     menuNm: m.menuNm,
        //     urlAddr: m.urlAddr,
        //     npagYn: m.npagYn
        // })));

        // SUP0010 메뉴 확인
        const sup0010Menu = menuList.find(m => m.menuId === 'SUP0010');
        if (sup0010Menu) {
            // console.log(`🔍 SUP0010 메뉴 발견:`, sup0010Menu);
        }

        const routes = dynamicRouteManager.generateRoutes(menuList, 'app');
        // console.log(`✅ 앱 라우트 생성 완료: ${routes.length}개`);
        
        return routes;
        
    } catch (error) {
        console.error('❌ 앱 라우트 생성 실패:', error);
        return dynamicRouteManager.generateRoutes([], 'app');
    }
};

/**
 * 기존 호환성을 위한 appRoute export
 * @deprecated getAppRoutes() 사용 권장
 */
export const appRoute = [];

/**
 * 특정 라우트 존재 여부 확인
 */
export const hasAppRoute = (routeId) => {
    return dynamicRouteManager.hasRoute(routeId, 'app');
};

/**
 * 라우트 캐시 초기화 (로그인 후 호출)
 */
export const refreshAppRoutes = () => {
    // console.log('🔄 앱 라우트 캐시 새로고침');
    dynamicRouteManager.clearCache();
};

/**
 * 디버그 정보 반환
 */
export const getAppRouteDebugInfo = () => {
    const menuList = ComLib.getSession('gdsMenu') || [];
    return {
        ...dynamicRouteManager.getDebugInfo(),
        menuCount: menuList.length,
        menuSample: menuList.slice(0, 5).map(m => ({
            menuId: m.menuId,
            menuNm: m.menuNm,
            urlAddr: m.urlAddr,
            npagYn: m.npagYn
        }))
    };
};

/*******************************************************************
 * 팝업 라우트 재export (호환성)
 *******************************************************************/
export { popRoute };

/*******************************************************************
 * 개발자 도구용 전역 함수 등록
 *******************************************************************/
if (process.env.NODE_ENV === 'development') {
    window.debugRoutes = {
        getAppRoutes,
        getAppRouteDebugInfo,
        refreshAppRoutes,
        hasAppRoute,
        dynamicRouteManager
    };
    // console.log('🛠️ 개발자 도구: window.debugRoutes 사용 가능');
}
