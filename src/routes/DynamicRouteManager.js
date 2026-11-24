import React from 'react';
import { ComLib } from 'common';
import { getEssentialRoutes, getSpecialPopupRoutes } from './EssentialRoutes';

/**
 * [vite] 화면 모듈 정적 등록표
 *
 * 화면은 gdsMenu 의 urlAddr 로만 결정되므로 번들러가 대상 모듈을 정적으로 알 수 없다.
 * 예전 webpack 은 `import(\`../${path}\`)` 를 컨텍스트 모듈로 처리해 폴더 전체를 묶어줬지만
 * rollup(vite build) 은 그렇지 않다. `@vite-ignore` 를 붙이면 분석을 아예 건너뛰므로
 * 청크가 생성되지 않고, 런타임 요청이 SPA fallback(index.html) 로 떨어져
 * "Expected a JavaScript module script but the server responded with a MIME type of text/html"
 * 로 전 화면이 실패한다.
 *
 * import.meta.glob 은 빌드시점에 아래 패턴에 맞는 모듈을 모두 찾아
 * `{ 경로: () => import(경로) }` 로 만들어 주므로 청크가 정상 생성된다.
 */
const CONTAINER_MODULES = import.meta.glob('../containers/**/*.js');

/** 대소문자 표기 흔들림 대비용 소문자 색인 (리눅스 빌드는 대소문자를 구분한다) */
const CONTAINER_MODULES_LOWER = Object.keys(CONTAINER_MODULES).reduce((acc, key) => {
    acc[key.toLowerCase()] = CONTAINER_MODULES[key];
    return acc;
}, {});

/**
 * importPath(`containers/bo/BO301_S` 형태) 로 모듈 로더를 찾는다.
 * 폴더(index.js) / 단일 파일 / 확장자 포함 경로를 모두 허용한다.
 */
const resolveContainerLoader = (importPath) => {
    const rel = importPath.replace(/^containers\//, '');
    const candidates = [
        `../containers/${rel}/index.js`,
        `../containers/${rel}.js`,
        `../containers/${rel}`,
    ];

    for (const key of candidates) {
        if (CONTAINER_MODULES[key]) return CONTAINER_MODULES[key];
    }
    for (const key of candidates) {
        const loader = CONTAINER_MODULES_LOWER[key.toLowerCase()];
        if (loader) return loader;
    }
    return null;
};

/**
 * 동적 라우트 관리자
 * gdsMenu 정보를 기반으로 사용자 권한에 따른 라우트를 동적으로 생성
 */
class DynamicRouteManager {
    constructor() {
        this.routeCache = new Map(); // 라우트 캐시
        this.componentCache = new Map(); // 컴포넌트 캐시
        this.menuHash = null; // 메뉴 해시 (캐시 무효화용)
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.routeCache.clear();
        this.componentCache.clear();
        this.menuHash = null;
        // console.log('🔄 DynamicRouteManager: 캐시가 초기화되었습니다.');
    }

    /**
     * 메뉴 데이터에서 해시 생성 (캐시 무효화 판단용)
     */
    getMenuHash(menuList) {
        if (!menuList || menuList.length === 0) return 'empty';
        
        const hashData = menuList
            .filter(menu => menu.npagYn !== 'X') // 비활성 메뉴 제외
            .map(menu => `${menu.menuId}:${menu.urlAddr}:${menu.npagYn}`)
            .sort()
            .join('|');
        
        // 간단한 해시 생성
        let hash = 0;
        for (let i = 0; i < hashData.length; i++) {
            const char = hashData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit 정수로 변환
        }
        return hash.toString();
    }

    /**
     * 접근 가능한 화면 목록 추출
     */
    extractAccessibleScreens(menuList) {
        if (!menuList || menuList.length === 0) return [];

        const screens = [];
        
        menuList.forEach(menu => {
            // npagYn이 'X'가 아닌 모든 메뉴 포함
            if (menu.npagYn !== 'X' && menu.urlAddr) {
                screens.push({
                    menuId: menu.menuId,
                    menuNm: menu.menuNm,
                    urlAddr: menu.urlAddr,
                    npagYn: menu.npagYn,
                    upMenuId: menu.upMenuId,
                    scrnSize: menu.scrnSize,
                    sortSn: menu.sortSn
                });
            }
        });

        // console.log(`📋 DynamicRouteManager: 접근 가능한 화면 ${screens.length}개 추출`);
        return screens;
    }

    /**
     * urlAddr 기반 동적 컴포넌트 생성
     */
    createDynamicComponent(urlAddr, screenId) {
        const cacheKey = `${urlAddr}_${screenId}`;
        
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
            }

            try {
            const component = this.createUrlAddrBasedImport(urlAddr, screenId);
            this.componentCache.set(cacheKey, component);
            return component;
        } catch (error) {
            console.warn(`⚠️ 컴포넌트 로드 실패 [${screenId}]: ${urlAddr}`, error);
            const errorComponent = this.getErrorComponent(screenId, `컴포넌트 로드 중 오류가 발생했습니다: ${error.message}`);
            this.componentCache.set(cacheKey, errorComponent);
            return errorComponent;
        }
    }

    /**
     * urlAddr 기반 동적 import 생성
     */
    createUrlAddrBasedImport(urlAddr, screenId) {
        // urlAddr 정규화
        let importPath = urlAddr;
        if (importPath.startsWith('/')) {
            importPath = importPath.substring(1);
        }
        if (!importPath.startsWith('containers/')) {
            importPath = `containers/${importPath}`;
        }

        // console.log(`🔗 동적 import 생성: ${screenId} -> ${importPath}`);

        const loader = resolveContainerLoader(importPath);

        // 등록표에 없는 화면 = 메뉴는 남아 있으나 소스가 없는 경우. 로드 시도 없이 안내한다.
        if (!loader) {
            console.error(`❌ 등록되지 않은 화면: ${screenId} -> ${importPath}`);
            return this.getErrorComponent(
                screenId,
                `화면 소스를 찾을 수 없습니다. (경로: ${importPath})`
            );
        }

        return React.lazy(() =>
            loader()
                .then(module => {
                    console.log(`✅ 동적 컴포넌트 로드 성공: ${screenId} -> ${importPath}`);
                    return module;
                })
                .catch(importError => {
                    console.error(`❌ 동적 import 실패: ${screenId} -> ${importPath}`, importError);

                    // 에러 발생 시 fallback 컴포넌트 반환
                    return {
                        default: () => (
                            <div className="scrm-error-message">
                                <h3>화면을 불러올 수 없습니다</h3>
                                <p>화면 ID: <strong>{screenId}</strong></p>
                                <p>경로: <code>{importPath}</code></p>
                                <p>화면 모듈을 내려받지 못했습니다. 배포본이 갱신되었을 수 있습니다.</p>
                                <details style={{marginTop: '10px'}}>
                                    <summary>기술적 세부사항</summary>
                                    <pre style={{fontSize: '12px', color: '#666'}}>
                                        {importError.message}
                                        {importError.stack && '\n\nStack trace:\n' + importError.stack}
                                    </pre>
                                </details>
                                <button
                                    onClick={() => window.location.reload()}
                                    style={{marginTop: '10px', padding: '8px 16px'}}
                                >
                                    새로고침
                                </button>
                            </div>
                        )
                    };
                })
        );
    }

    /**
     * 오류 컴포넌트 반환
     */
    getErrorComponent(screenId, errorMessage = '화면을 찾을 수 없습니다.') {
        return React.lazy(() => Promise.resolve({
            default: () => (
                <div className="scrm-error-message">
                    <h3>화면을 불러올 수 없습니다</h3>
                    <p>화면 ID: <strong>{screenId}</strong></p>
                    <p>{errorMessage}</p>
                    <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                        <h4 style={{margin: '0 0 10px 0', fontSize: '14px'}}>해결 방법:</h4>
                        <ul style={{margin: 0, paddingLeft: '20px', fontSize: '13px'}}>
                            <li>화면 ID가 올바른지 확인해주세요</li>
                            <li>해당 화면이 구현되어 있는지 확인해주세요</li>
                            <li>시스템 관리자에게 문의해주세요</li>
                        </ul>
                    </div>
                </div>
            )
        }));
    }

    /**
     * 동적 라우트 생성
     */
    createDynamicRoutes(accessibleScreens, routeType = 'app') {
        const routes = [];

        accessibleScreens.forEach(screen => {
            const { menuId, menuNm, urlAddr, npagYn, scrnSize } = screen;
            const isPopupScreen = ['Y', 'P'].includes(npagYn);

            // 라우트 타입에 따른 필터링
            if (routeType === 'app' && !isPopupScreen) {
                // 일반 앱 라우트
                const component = this.createDynamicComponent(urlAddr, menuId);
                const path = this.generateRoutePath(urlAddr, false);
                
                    routes.push({
                    id: menuId,
                    path: path,
                        exact: true,
                    component: component,
                    menuNm: menuNm,
                    npagYn: npagYn,
                        urlAddr: urlAddr
                    });

                // console.log(`📱 앱 라우트 생성: ${menuId} -> ${path}`);
            } else if (routeType === 'popup' && isPopupScreen) {
                // 팝업 라우트
                const component = this.createDynamicComponent(urlAddr, menuId);
                const path = this.generateRoutePath(urlAddr, true);
                
                    routes.push({
                    id: menuId,
                    path: path,
                        exact: true,
                    component: component,
                    menuNm: menuNm,
                    scrnSize: scrnSize,
                    npagYn: npagYn,
                        urlAddr: urlAddr
                    });

                // CNS0160 특별 디버깅
                // console.log(`🔗 팝업 라우트 생성: ${menuId} -> ${path}`);
            }
        });

        // 특별 팝업 라우트 추가 (SYS4020 등)
        if (routeType === 'popup') {
            this.addSpecialPopupRoutes(routes, accessibleScreens);
        }

        return routes;
    }

    /**
     * 라우트 경로 생성
     */
    generateRoutePath(urlAddr, isPopup = false) {
        let path = urlAddr;
        
        // 앞의 슬래시 제거
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        
        // containers/ 제거
        if (path.startsWith('containers/')) {
            path = path.substring('containers/'.length);
        }
        
        // 팝업인 경우 /popup/ 접두사 추가
        if (isPopup) {
            path = `/popup/${path}`;
        } else {
            path = `/${path}`;
        }
        
        return path;
    }

    /**
     * 특별 팝업 라우트 추가 (SYS4020의 하위 팝업 등)
     */
    addSpecialPopupRoutes(routes, accessibleScreens) {
        const specialRoutes = getSpecialPopupRoutes(accessibleScreens);
        routes.push(...specialRoutes);
    }

    /**
     * 라우트 생성 (메인 메서드)
     */
    generateRoutes(menuList, routeType = 'app') {
        try {
            // 메뉴 데이터 검증
            if (!menuList || menuList.length === 0) {
                console.info('ℹ️ 메뉴 데이터가 없습니다. 필수 라우트만 반환합니다.');
                return this.getEssentialRoutes(routeType);
            }

            // 캐시 확인
            const currentHash = this.getMenuHash(menuList);
            const cacheKey = `${routeType}_${currentHash}`;
            
            if (this.routeCache.has(cacheKey) && this.menuHash === currentHash) {
                // console.log(`💾 캐시된 라우트 반환: ${routeType} (${this.routeCache.get(cacheKey).length}개)`);
                return this.routeCache.get(cacheKey);
            }

            // 새로운 라우트 생성
            // console.log(`🔄 새로운 라우트 생성 시작: ${routeType}`);

            const accessibleScreens = this.extractAccessibleScreens(menuList);
            const essentialRoutes = this.getEssentialRoutes(routeType);
            const dynamicRoutes = this.createDynamicRoutes(accessibleScreens, routeType);
            
            // 중복 제거: dynamicRoutes가 essentialRoutes를 덮어쓰도록 처리
            const routeMap = new Map();
            
            // 먼저 essentialRoutes 추가
            essentialRoutes.forEach(route => {
                const key = route.id || route.path;
                if (key) {
                    routeMap.set(key, route);
                }
            });
            
            // dynamicRoutes로 덮어쓰기 (중복 시 동적 라우트가 우선)
            dynamicRoutes.forEach(route => {
                const key = route.id || route.path;
                if (key) {
                    routeMap.set(key, route);
                }
            });
            
            const allRoutes = Array.from(routeMap.values());
            
            // 캐시 저장
            this.routeCache.set(cacheKey, allRoutes);
            this.menuHash = currentHash;
            
            // console.log(`✅ 라우트 생성 완료: ${routeType} (필수: ${essentialRoutes.length}, 동적: ${dynamicRoutes.length}, 총: ${allRoutes.length}개)`);
            
            return allRoutes;
            
        } catch (error) {
            console.error('❌ 라우트 생성 중 오류 발생:', error);
            return this.getEssentialRoutes(routeType);
        }
    }

    /**
     * 필수 라우트 반환 (EssentialRoutes에서 가져옴)
     */
    getEssentialRoutes(routeType) {
        const essentialRoutes = getEssentialRoutes(routeType);
        
        // 팝업 라우트의 경우 path가 없으면 자동 생성
        if (routeType === 'popup') {
            return essentialRoutes.map(route => {
                if (!route.path && route.urlAddr) {
                    return {
                        ...route,
                        path: this.generateRoutePath(route.urlAddr, true),
                        exact: true
                    };
                }
                return {
                    ...route,
                    exact: true
                };
            });
        }
        
        return essentialRoutes.map(route => ({
            ...route,
            exact: true
        }));
    }

    /**
     * 특정 라우트 존재 여부 확인
     */
    hasRoute(routeId, routeType = 'app') {
        try {
            const menuList = ComLib.getSession('gdsMenu') || [];
        const routes = this.generateRoutes(menuList, routeType);
        return routes.some(route => route.id === routeId);
        } catch (error) {
            console.error('라우트 존재 확인 중 오류:', error);
            return false;
        }
    }

    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        const menuList = ComLib.getSession('gdsMenu') || [];
        return {
            캐시크기: this.routeCache.size,
            컴포넌트캐시크기: this.componentCache.size,
            메뉴해시: this.menuHash,
            메뉴개수: menuList.length,
            캐시키목록: Array.from(this.routeCache.keys())
        };
    }
}

// 싱글톤 인스턴스 생성
const dynamicRouteManager = new DynamicRouteManager();

export default dynamicRouteManager;
export { DynamicRouteManager };
