import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { getPopupRoutes } from 'routes/popupRoute';
import { ErrorBoundary } from 'components';
import { ComLib } from 'common';
import { withRouter } from 'utils/withRouter';

export const PopupContext = React.createContext({
    isPopup: false
});

function PopupRouteWrapper({ route }) {
    const Component = route.component;
    
    let options = {};
    try {
        const popupId = sessionStorage.getItem('currentPopupId');
        if (popupId) {
            const optionsStr = sessionStorage.getItem(`popupData_${popupId}`);
            if (optionsStr) {
                options = JSON.parse(optionsStr);
            }
        }
    } catch (error) {
        console.warn('[PopupBase] options 데이터 로드 실패:', error);
    }
    
    const componentProps = {
        options: options,
        isPopup: true,
        onCallbackFunc: (data) => {
            console.log('[PopupBase] callback 호출 시도:', data);
            if (window.opener && window.opener.PopupManagerInstance) {
                const popupId = sessionStorage.getItem('currentPopupId');
                if (popupId) {
                    const popupInfo = window.opener.PopupManagerInstance.popups.get(popupId);
                    if (popupInfo && popupInfo.callback) {
                        popupInfo.callback(data);
                    }
                }
            }
            window.close();
        },
        onClose: () => window.close()
    };
    
    return (
        <div className="scrm-popup-content-body" style={{ width: '100%', boxSizing: 'border-box' }}>
            <ErrorBoundary showUserMessage={false}>
                <Suspense fallback={
                    <div className="scrm-loading-container">
                        <div className="scrm-loading-spinner"></div>
                        <div className="scrm-loading-text">팝업을 불러오는 중...</div>
                    </div>
                }>
                    <Component {...componentProps} />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

class PopupBase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPath: props.location ? props.location.pathname : window.location.pathname
        };
    }

    componentDidMount() {
        window.addEventListener('popstate', this.handlePathChange);
    }

    componentWillUnmount() {
        window.removeEventListener('popstate', this.handlePathChange);
    }

    componentDidUpdate(prevProps) {
        if (this.props.location && prevProps.location && 
            this.props.location.pathname !== prevProps.location.pathname) {
            this.setState({ currentPath: this.props.location.pathname });
        }
    }

    handlePathChange = () => {
        const newPath = this.props.location ? this.props.location.pathname : window.location.pathname;
        this.setState({ currentPath: newPath });
    }

    getScreenName = (path) => {
        try {
            const pathParts = path.split('/');
            if (pathParts.length >= 4) {
                const moduleCode = pathParts[2].toUpperCase();
                const screenId = pathParts[3];
                const menuList = ComLib.getSession("gdsMenu") || [];
                const menuItem = menuList.find(menu => 
                    menu.menuId === screenId || 
                    menu.prgrm_id === screenId ||
                    menu.url === path ||
                    menu.url === `/${moduleCode.toLowerCase()}/${screenId}`
                );
                if (menuItem) {
                    return `${menuItem.menuNm || menuItem.menu_nm || screenId}`;
                }
                return `${screenId} (${moduleCode})`;
            }
            return "팝업 화면";
        } catch (error) {
            console.warn('화면 이름 조회 중 오류:', error);
            return "팝업 화면";
        }
    }

    render() {
        const allPopupRoutes = getPopupRoutes();
        const popupRoutes = allPopupRoutes
            .filter(route => route && route.path && route.path.startsWith('/popup/'))
            .map(route => ({
                ...route,
                path: route.path.replace(/^\/popup/, '')
            }));
        const screenName = this.getScreenName(this.state.currentPath);

        return (
            <PopupContext.Provider value={{ isPopup: true }}>
                {/* CoreWorks 팝업 셸 — 머리색은 --iconbar-bg(개인 테마)를 따른다 */}
                <div className="cw-popup-root">
                    <div className="cw-popup-gnb">
                        <span className="cw-popup-gnb-title">{screenName}</span>
                        <button
                            className="cw-popup-close"
                            onClick={() => window.close()}
                            title="닫기"
                        >
                            <i className="xi-close"></i>
                        </button>
                    </div>

                    <div className="cw-popup-body">
                        <Routes>
                            {popupRoutes.map((route, index) => (
                                <Route
                                    key={index}
                                    path={route.path}
                                    element={<PopupRouteWrapper route={route} />}
                                />
                            ))}
                            <Route path="*" element={
                                <div style={{ 
                                    display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center', 
                                    height: '100%', fontSize: '18px', color: '#666', padding: '20px'
                                }}>
                                    <div style={{ marginBottom: '10px' }}>⚠️</div>
                                    <div>요청하신 페이지를 찾을 수 없습니다.</div>
                                    <div style={{ fontSize: '14px', marginTop: '10px', color: '#999' }}>
                                        경로: {this.state.currentPath}
                                    </div>
                                </div>
                            } />
                        </Routes>
                    </div>
                </div>
            </PopupContext.Provider>
        );
    }
}

export default withRouter(PopupBase);
