import React from 'react';
import { renderToContainer, unmountFromContainer } from 'utils/reactRootManager';
import ReactDOM from 'react-dom';

/**
 * 알림 컴포넌트
 * 우측 하단에 표시되는 개별 알림
 */
const NotificationItem = ({ id, message, type, onRemove, isDialog = false }) => {
    // console.log('NotificationItem 렌더링:', { id, message, type, isDialog });
    
    const [isRemoving, setIsRemoving] = React.useState(false);
    
    React.useEffect(() => {
        // console.log('NotificationItem useEffect 실행:', id);
        // 2초 후 자동 제거
        const timer = setTimeout(() => {
            // console.log('자동 제거 타이머 실행:', id);
            handleRemove();
        }, 2000);

        return () => {
            // console.log('타이머 정리:', id);
            clearTimeout(timer);
        };
    }, [id]);
    
    const handleRemove = () => {
        // console.log('즉시 제거 실행:', id);
        // 즉시 제거 (애니메이션 없음)
        onRemove(id);
    };

    const getTypeClass = () => {
        switch (type) {
            case 'success': return 'scrm-toast-notification-success';
            case 'error': return 'scrm-toast-notification-error';
            case 'warning': return 'scrm-toast-notification-warning';
            case 'info': 
            default: return 'scrm-toast-notification-info';
        }
    };

    // 메시지 텍스트 처리 - 줄바꿈 문자 처리
    const formatMessage = (msg) => {
        if (!msg) return '메시지 없음';
        
        // 문자열로 변환
        const messageStr = String(msg).trim();
        
        if (!messageStr) return '빈 메시지';
        
        // 줄바꿈 문자를 <br> 태그로 변환
        const lines = messageStr.split('\n');
        
        return lines.map((line, index) => (
            <React.Fragment key={index}>
                {line || ' '}
                {index < lines.length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // 애니메이션 클래스 선택 (나타날 때만)
    const getAnimationClass = () => {
        // 나타날 때만 페이드인, 사라질 때는 애니메이션 없음
        return 'scrm-toast-notification-fade-in';
    };
    
    const animationDuration = '0.3s'; // 나타날 때만
    
    return (
        <div 
            className={`scrm-toast-notification-item ${getTypeClass()}`} 
            data-notification-id={id}
            style={{
                animation: `${getAnimationClass()} ${animationDuration} cubic-bezier(0.25, 0.46, 0.45, 0.94)`
            }}
        >
            <div className="scrm-toast-notification-content">
                <div 
                    className="scrm-toast-notification-message"
                    style={{
                        fontSize: '12px',
                        color: '#333333',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "맑은 고딕", Roboto, "Helvetica Neue", Arial, sans-serif',
                        lineHeight: '1.4',
                        display: 'block',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        padding: 0,
                        opacity: 1,
                        visibility: 'visible'
                    }}
                >
                    {formatMessage(message)}
                </div>
                <button 
                    className="scrm-toast-notification-close" 
                    onClick={handleRemove}
                    aria-label="닫기"
                    type="button"
                    style={{
                        fontSize: '16px',
                        color: '#999999',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
};

/**
 * 알림 컨테이너 컴포넌트
 * 모든 알림을 관리하고 표시 (다중 컬럼 지원)
 */
const NotificationContainer = ({ notifications, onRemove, isDialog = false }) => {
    // console.log('NotificationContainer 렌더링:', notifications, 'isDialog:', isDialog);
    
    if (!notifications || notifications.length === 0) {
        // console.log('알림이 없어서 null 반환');
        return null;
    }

    // 다중 컬럼 레이아웃 계산
    const maxHeight = window.innerHeight * 0.8; // 화면 높이의 80%
    const notificationHeight = 60; // 알림 하나당 예상 높이
    const maxPerColumn = Math.floor(maxHeight / notificationHeight);
    
    // 알림을 컬럼별로 분배
    const columns = [];
    for (let i = 0; i < notifications.length; i += maxPerColumn) {
        columns.push(notifications.slice(i, i + maxPerColumn));
    }

    // console.log('컬럼 분배:', columns, 'maxPerColumn:', maxPerColumn);

    return (
        <div 
            className="scrm-toast-notification-wrapper"
            style={{
                position: 'fixed',
                top: 'auto',
                right: '15px',
                bottom: '15px',
                zIndex: 10000,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'row-reverse', // 우측부터 시작
                gap: '15px',
                alignItems: 'flex-end'
            }}
        >
            {columns.map((columnNotifications, columnIndex) => (
                <div
                    key={`column-${columnIndex}`}
                    className="scrm-toast-notification-column"
                    style={{
                        display: 'flex',
                        flexDirection: 'column-reverse', // 아래부터 쌓기
                        maxWidth: '300px',
                        width: '300px'
                    }}
                >
                    {columnNotifications.map((notification) => {
                        // console.log('알림 아이템 렌더링:', notification, 'column:', columnIndex);
                        return (
                            <NotificationItem
                                key={notification.id}
                                id={notification.id}
                                message={notification.message}
                                type={notification.type}
                                onRemove={onRemove}
                                isDialog={isDialog}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

/**
 * 알림 관리 클래스
 * 화면 우측 하단에 알림을 표시하고 관리
 */
class NotificationManager {
    constructor(containerId = null) {
        this.notifications = [];
        this.container = null;
        this.nextId = 1;
        this.containerId = containerId; // 특정 컨테이너 ID (Dialog용)
        this.maxNotifications = Infinity; // 무제한 알림 개수
        this.maxHeight = window.innerHeight * 0.8; // 화면 높이의 80%까지 사용
        this.notificationHeight = 60; // 예상 알림 높이 (여백 포함)
        this.columns = []; // 다중 컬럼 관리
        this.init();
    }

    /**
     * 알림 시스템 초기화
     */
    init() {
        try {
            // Dialog 내부인지 확인
            if (this.containerId) {
                this.initDialogContainer();
            } else {
                // 전역 알림 컨테이너
                this.initGlobalContainer();
            }

            // 초기 렌더링
            this.render();
        } catch (error) {
            console.error('NotificationManager 초기화 오류:', error);
        }
    }

    /**
     * Dialog 내부 알림 컨테이너 초기화
     */
    initDialogContainer() {
        // console.log('Dialog ID로 컨테이너 찾기:', this.containerId);
        
        // Dialog의 실제 컨테이너 찾기 (popupdivid + "_inner_div")
        const dialogInnerDiv = document.getElementById(this.containerId + "_inner_div");
        // console.log('Dialog inner div 찾기:', dialogInnerDiv);
        
        if (dialogInnerDiv) {
            // Dialog body 영역 찾기
            const dialogBody = dialogInnerDiv.querySelector('.scrm-popup-modal-content-body');
            const targetElement = dialogBody || dialogInnerDiv;
            
            // console.log('알림을 추가할 대상 요소:', targetElement);
            // console.log('대상 요소 크기:', targetElement.offsetWidth, 'x', targetElement.offsetHeight);
            
            // 대상 요소에 상대적 위치 설정 (알림 컨테이너의 기준점)
            if (targetElement) {
                const currentPosition = window.getComputedStyle(targetElement).position;
                if (currentPosition === 'static') {
                    targetElement.style.position = 'relative';
                    // console.log('대상 요소에 relative position 설정');
                }
                
                // Dialog body의 overflow 설정 조정 (알림이 잘리지 않도록)
                if (targetElement.classList.contains('scrm-popup-modal-content-body')) {
                    const currentOverflow = window.getComputedStyle(targetElement).overflow;
                    if (currentOverflow === 'auto' || currentOverflow === 'hidden') {
                        targetElement.style.overflow = 'visible';
                        // console.log('Dialog body overflow를 visible로 설정');
                    }
                }
            }
            
            const notificationId = `scrm-toast-notification-root-${this.containerId}`;
            this.container = document.getElementById(notificationId);
            
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = notificationId;
                this.container.style.cssText = `
                    position: absolute;
                    top: auto;
                    right: 10px;
                    bottom: 10px;
                    z-index: 10010;
                    pointer-events: none;
                    max-width: none;
                    width: auto;
                    overflow: visible;
                `;
                targetElement.appendChild(this.container);
                // console.log('Dialog 알림 컨테이너 생성됨:', this.container, '부모:', targetElement);
                
                // 컨테이너가 실제로 DOM에 추가되었는지 확인
                setTimeout(() => {
                    const addedContainer = document.getElementById(notificationId);
                    // console.log('컨테이너 DOM 추가 확인:', addedContainer ? '성공' : '실패');
                    if (addedContainer) {
                        // console.log('컨테이너 위치:', addedContainer.getBoundingClientRect());
                    }
                }, 100);
            }
        } else {
            console.warn('Dialog 요소를 찾을 수 없음:', this.containerId);
            // console.log('DOM에서 Dialog 관련 요소들 검색:');
            
            // 모든 Dialog 관련 요소 찾기
            const allDialogs = document.querySelectorAll('[id*="' + this.containerId + '"]');
            // console.log('발견된 Dialog 관련 요소들:', allDialogs);
            
            // 잠시 후 다시 시도
            setTimeout(() => {
                // console.log('Dialog 컨테이너 재시도...');
                this.initDialogContainer();
            }, 500);
            
            // 임시로 전역 컨테이너 사용
            this.initGlobalContainer();
        }
    }

    /**
     * 전역 알림 컨테이너 초기화
     */
    initGlobalContainer() {
        this.container = document.getElementById('scrm-toast-notification-root');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scrm-toast-notification-root';
            this.container.style.cssText = `
                position: fixed;
                top: auto;
                right: 15px;
                bottom: 15px;
                z-index: 10000;
                pointer-events: none;
                max-width: none;
                width: auto;
            `;
            document.body.appendChild(this.container);
            // console.log('전역 알림 컨테이너 생성됨:', this.container);
        }
    }

    /**
     * 알림 추가
     * @param {string} message - 표시할 메시지
     * @param {string} type - 알림 타입 (info, success, error, warning)
     */
    show(message, type = 'info') {
        // console.log('NotificationManager.show 호출:', { message, type });
        
        if (!message) {
            console.warn('빈 메시지로 인해 알림 표시 중단');
            return;
        }

        // 메시지 처리
        let processedMessage = message;
        
        // 배열인 경우 줄바꿈으로 연결
        if (Array.isArray(message)) {
            processedMessage = message.join('\n');
        }
        
        // 객체인 경우 JSON 문자열로 변환
        if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
            processedMessage = JSON.stringify(message, null, 2);
        }
        
        // 문자열로 변환
        processedMessage = String(processedMessage).trim();
        
        if (!processedMessage) {
            console.warn('처리된 메시지가 비어있어 알림 표시 중단');
            return;
        }

        const notification = {
            id: this.nextId++,
            message: processedMessage,
            type: type,
            timestamp: Date.now()
        };

        // console.log('생성된 알림:', notification);

        // 새 알림을 배열 앞쪽에 추가 (위쪽에 표시)
        this.notifications.unshift(notification);

        // console.log('현재 알림 목록:', this.notifications);
        this.render();
        return notification.id;
    }

    /**
     * 특정 알림 제거
     * @param {number} id - 제거할 알림 ID
     */
    remove(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.render();
    }

    /**
     * 모든 알림 제거
     */
    clear() {
        this.notifications = [];
        this.render();
    }

    /**
     * 알림 컨테이너 렌더링
     */
    render() {
        if (!this.container) {
            console.error('알림 컨테이너가 없어 렌더링 불가');
            return;
        }

        // console.log('알림 렌더링 시작:', this.notifications.length, '개');

        try {
            // Dialog 환경인지 확인
            const isDialog = !!this.containerId;
            
            renderToContainer(this.container, <NotificationContainer 
                    notifications={this.notifications}
                    onRemove={(id) => this.remove(id)}
                    isDialog={isDialog}
                />);
            // console.log('알림 렌더링 완료');
        } catch (error) {
            console.error('알림 렌더링 오류:', error);
        }
    }

    /**
     * 성공 알림
     * @param {string} message - 메시지
     */
    success(message) {
        return this.show(message, 'success');
    }

    /**
     * 에러 알림
     * @param {string} message - 메시지
     */
    error(message) {
        return this.show(message, 'error');
    }

    /**
     * 경고 알림
     * @param {string} message - 메시지
     */
    warning(message) {
        return this.show(message, 'warning');
    }

    /**
     * 정보 알림
     * @param {string} message - 메시지
     */
    info(message) {
        return this.show(message, 'info');
    }

    /**
     * 인스턴스 정리
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            unmountFromContainer(this.container);
            this.container.parentNode.removeChild(this.container);
        }
        this.notifications = [];
        this.container = null;
    }
}

// 싱글톤 인스턴스 생성 (전역용)
const notificationManager = new NotificationManager();

// Dialog용 알림 관리자 인스턴스들을 저장하는 맵
const dialogNotificationManagers = new Map();

/**
 * Dialog용 알림 관리자 생성/반환
 * @param {string} dialogId - Dialog ID
 * @returns {NotificationManager} Dialog 전용 알림 관리자
 */
const getDialogNotificationManager = (dialogId) => {
    if (!dialogId) {
        return notificationManager; // 전역 관리자 반환
    }
    
    if (!dialogNotificationManagers.has(dialogId)) {
        const dialogManager = new NotificationManager(dialogId);
        dialogNotificationManagers.set(dialogId, dialogManager);
        // console.log('Dialog 알림 관리자 생성:', dialogId);
    }
    
    return dialogNotificationManagers.get(dialogId);
};

/**
 * Dialog용 알림 관리자 제거
 * @param {string} dialogId - Dialog ID
 */
const removeDialogNotificationManager = (dialogId) => {
    if (dialogNotificationManagers.has(dialogId)) {
        const manager = dialogNotificationManagers.get(dialogId);
        manager.destroy();
        dialogNotificationManagers.delete(dialogId);
        // console.log('Dialog 알림 관리자 제거:', dialogId);
    }
};

export default notificationManager;
export { 
    NotificationManager, 
    getDialogNotificationManager, 
    removeDialogNotificationManager 
};
