import React from 'react';
import { ComLib } from 'common';

/**
 * 필수 라우트 설정
 * 사용자 권한과 관계없이 항상 등록되어야 하는 라우트들
 */

/**
 * 필수 앱 라우트
 *
 * 화면은 원칙적으로 <DB 메뉴(cmpt_menu.url_addr)>가 정한다 — 여기에 적지 않는다.
 * 이 배열은 메뉴에 없어도 항상 있어야 하는 화면만을 위한 자리다(현재 없음).
 */
export const essentialAppRoutes = [];

/**
 * 필수 팝업 라우트
 *
 * 메뉴 권한과 무관하게 <누구에게나> 필요한 팝업. 로그인한 사람이면 자기 비밀번호를
 * 바꿀 수 있어야 하므로, 이것은 메뉴가 아니라 여기에 둔다.
 */
export const essentialPopupRoutes = [
    {
        id: 'COM0020',
        component: React.lazy(() => import('containers/com/COM0020')),
        description: '비밀번호 변경'
    },
    {
        id: 'COM0030',
        component: React.lazy(() => import('containers/com/COM0030')),
        description: '환경설정(개인 화면 컬러) — DB 메뉴가 아니라 GNB 톱니로 진입'
    },
];

/**
 * 특별 팝업 라우트 — 「어떤 화면에 딸린 하위 팝업」의 등록 자리
 *
 * ★ 확장점이다. 새 업무화면에 팝업을 붙일 때 여기에 한 줄 추가한다.
 *
 * 왜 메뉴로 하지 않는가: 하위 팝업은 <자기 부모 화면을 볼 수 있는 사람>에게만 필요하다.
 * 메뉴로 만들면 권한을 두 번 관리해야 하고, 메뉴 트리에 팝업이 섞여 보인다.
 * 그래서 부모 화면의 접근 가능 여부(accessibleScreens)에 얹는다.
 *
 * 사용 예 —
 *   { owner: 'SYS1010', id: 'SYS1010_detailPopup',
 *     load: () => import('containers/sys/SYS1010/detailPopup.js'),
 *     description: '메뉴 상세 팝업' }
 */
const SPECIAL_POPUPS = [
    {
        owner: 'OMP1060',
        id: 'OMP1060_detailPopup',
        load: () => import('containers/voc/OMP1060/detailPopup.js'),
        description: '표준용어 상세 팝업',
    },
];

export const getSpecialPopupRoutes = (accessibleScreens) => {
    const owned = new Set((accessibleScreens || []).map((s) => s.menuId));

    return SPECIAL_POPUPS
        .filter((p) => owned.has(p.owner))
        .map((p) => ({
            id: p.id,
            component: React.lazy(p.load),
            description: p.description,
        }));
};

/**
 * 라우트 타입별 필수 라우트 반환
 */
export const getEssentialRoutes = (routeType = 'app') => {
    switch (routeType) {
        case 'popup':
            return [...essentialPopupRoutes];
        case 'app':
        default:
            return [...essentialAppRoutes];
    }
};

/**
 * 모든 필수 라우트 반환 (디버깅용)
 */
export const getAllEssentialRoutes = () => {
    return {
        app: essentialAppRoutes,
        popup: essentialPopupRoutes
    };
};

/**
 * 필수 라우트 검증
 */
export const validateEssentialRoutes = () => {
    const issues = [];

    // 앱 라우트 검증
    essentialAppRoutes.forEach(route => {
        if (!route.id || !route.path || !route.component) {
            issues.push(`앱 라우트 누락 필드: ${route.id || 'unknown'}`);
        }
    });

    // 팝업 라우트 검증
    essentialPopupRoutes.forEach(route => {
        if (!route.id || !route.component) {
            issues.push(`팝업 라우트 누락 필드: ${route.id || 'unknown'}`);
        }
    });

    if (issues.length > 0) {
        console.warn('⚠️ 필수 라우트 검증 실패:', issues);
        return false;
    }

    console.log('✅ 필수 라우트 검증 통과');
    return true;
};

// 초기화 시 검증 실행
validateEssentialRoutes();
