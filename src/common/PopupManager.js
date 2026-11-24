/**
 * 팝업 관리자 - window.open을 통한 팝업 창 관리 시스템
 * 
 * 주요 기능:
 * - 팝업 인스턴스 관리 및 추적
 * - postMessage를 통한 개별 팝업 통신
 * - BroadcastChannel을 통한 브로드캐스트 통신
 * - 온디맨드 메모리 정리
 * - 팝업 상태 모니터링
 */

class PopupManager {
    constructor() {
        /** @type {Map<string, PopupInfo>} */
        this.popups = new Map();
        
        /** @type {Set<Function>} */
        this.closeListeners = new Set();
        
        /** @type {number} */
        this.nextId = 1;
        
        /** @type {Map<string, BroadcastChannel>} */
        this.broadcastChannels = new Map();
        
        /** @type {Set<Function>} */
        this.broadcastListeners = new Set();
        
        /** @type {boolean} */
        this.broadcastSupported = typeof BroadcastChannel !== 'undefined';
        
        /** @type {Map<string, Set<Function>>} */
        this.componentListeners = new Map(); // 컴포넌트별 리스너 관리
        
        // 페이지 언로드 시 모든 팝업 정리
        this._setupPageUnloadHandler();
        
        // postMessage 수신 핸들러 설정
        this._setupMessageHandler();
        
        // BroadcastChannel 설정
        this._setupBroadcastChannels();
        
        // 자동 브로드캐스트 리스너 설정
        this._setupAutoBroadcastListeners();
        
        // 주기적 정리 작업 설정 (5분마다)
        this._setupPeriodicCleanup();
    }
    
    /**
     * 팝업을 열고 관리 목록에 추가
     */
    open(url, name = null, features = '', metadata = {}, callback = null) {
        try {
            const popupId = this._generateId();
            const popupName = name || `popup_${popupId}`;
            
            const defaultFeatures = 'width=1024,height=768,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no';
            const finalFeatures = features || defaultFeatures;
            
            
            
            const popupInfo = {
                id: popupId,
                url: url,
                name: popupName,
                features: finalFeatures,
                createdAt: new Date(),
                lastChecked: new Date(),
                isClosed: false,
                metadata: { ...metadata },
                callback: callback // 콜백 함수 저장
            };
            
            this.popups.set(popupId, popupInfo);
            
            // 팝업 창에 ID 정보 전달
            try {
                window.sessionStorage.setItem('currentPopupId', popupId);

                // metadata를 팝업별로 sessionStorage에 저장 (options 변수명 사용)
                if (metadata && Object.keys(metadata).length > 0) {
                    window.sessionStorage.setItem(`popupData_${popupId}`, JSON.stringify(metadata));
                    console.log(`[PopupManager] 팝업 옵션 저장 완료. ID: ${popupId}`, metadata);
                }                
            } catch (error) {
                console.warn('[PopupManager] 팝업 창에 ID 정보 설정 실패:', error);
            }
            
            // console.log(`[PopupManager] 팝업이 열렸습니다. ID: ${popupId}, URL: ${url}`);
            
            const popupWindow = window.open(url, popupName, finalFeatures);
            if (!popupWindow) {
                window.sessionStorage.removeItem(`popupData_${popupId}`);
                throw new Error('팝업 차단기에 의해 팝업이 차단되었습니다.');
            }
            
            // 팝업 윈도우 정보를 popupInfo에 추가
            popupInfo.window = popupWindow;
            
            // 팝업 정보를 관리 목록에 저장
            this.popups.set(popupId, popupInfo);
            
            // 팝업 저장 상태 로깅
            console.log(`[PopupManager] 팝업 저장 완료:`, {
                popupId: popupId,
                totalPopups: this.popups.size,
                popupWindow: !!popupWindow,
                windowClosed: popupWindow ? popupWindow.closed : 'N/A',
                popupName: popupName,
                url: url
            });
            
            // 현재 저장된 모든 팝업 ID 로깅
            const allPopupIds = Array.from(this.popups.keys());
            console.log(`[PopupManager] 현재 저장된 팝업 목록:`, allPopupIds);
            
            // 팝업이 완전히 로드된 후 콜백 실행
            this._waitForPopupLoad(popupWindow, popupId, callback);
            
            return popupId;
            
        } catch (error) {
            console.error('[PopupManager] 팝업 열기 실패:', error);
            throw error;
        }
    }
    
    /**
     * 팝업 로드 완료 대기 후 콜백 실행
     * @private
     * @param {Window} popupWindow - 팝업 윈도우
     * @param {string} popupId - 팝업 ID
     * @param {Function} callback - 실행할 콜백 함수
     */
    _waitForPopupLoad(popupWindow, popupId, callback) {
        if (!callback) return;
        
        let checkCount = 0;
        const maxChecks = 50; // 최대 5초 대기 (100ms * 50)
        
        const checkLoad = () => {
            checkCount++;
            
            try {
                // 팝업이 닫혔는지 확인
                if (popupWindow.closed) {
                    // console.log(`[PopupManager] 팝업이 닫혔습니다: ${popupId}`);
                    return;
                }
                
                // 최대 체크 횟수 초과 시 강제 실행
                if (checkCount >= maxChecks) {
                    console.warn(`[PopupManager] 팝업 로드 체크 시간 초과, 강제 실행: ${popupId} (체크 횟수: ${checkCount})`);
                    this._executePopupCallback(popupId, popupWindow, callback, 'timeout');
                    return;
                }
                
                // 팝업이 로드되었는지 확인
                if (popupWindow.document.readyState === 'complete') {
                    // console.log(`[PopupManager] 팝업 로드 완료: ${popupId} (체크 횟수: ${checkCount})`);
                    this._executePopupCallback(popupId, popupWindow, callback, 'complete');
                } else {
                    // 아직 로드 중이면 다시 시도
                    // console.log(`[PopupManager] 팝업 로드 대기 중: ${popupId} (상태: ${popupWindow.document.readyState}, 체크: ${checkCount}/${maxChecks})`);
                    setTimeout(checkLoad, 100);
                }
            } catch (error) {
                // 팝업이 다른 도메인인 경우 등으로 접근할 수 없는 경우
                console.warn(`[PopupManager] 팝업 상태 확인 실패: ${popupId} (체크: ${checkCount}/${maxChecks})`, error);
                
                // 크로스 도메인 등으로 인한 접근 제한인 경우 더 긴 대기 시간 후 실행
                if (checkCount >= 10) { // 1초 후부터 강제 실행 고려
                    // console.log(`[PopupManager] 크로스 도메인 접근 제한으로 인한 강제 실행: ${popupId}`);
                    this._executePopupCallback(popupId, popupWindow, callback, 'crossdomain');
                } else {
                    setTimeout(checkLoad, 100);
                }
            }
        };
        
        // 즉시 체크 시작
        checkLoad();
    }

    /**
     * 팝업 콜백 실행 및 GlobalContext 동기화
     * @private
     * @param {string} popupId - 팝업 ID
     * @param {Window} popupWindow - 팝업 윈도우
     * @param {Function} callback - 콜백 함수
     * @param {string} reason - 실행 이유 ('complete', 'timeout', 'crossdomain')
     */
    _executePopupCallback(popupId, popupWindow, callback, reason) {
        // console.log(`[PopupManager] 팝업 콜백 실행 시작: ${popupId} (이유: ${reason})`);
        
        // React 앱 초기화를 위한 추가 대기 시간 설정
        const syncDelays = {
            'complete': 500,    // 정상 로드 완료: 500ms
            'timeout': 800,     // 타임아웃: 800ms  
            'crossdomain': 1200 // 크로스 도메인: 1200ms
        };
        
        const syncDelay = syncDelays[reason] || 500;
        
        // GlobalContext 동기화 (지연 실행)
        setTimeout(() => {
            // console.log(`[PopupManager] GlobalContext 동기화 시작: ${popupId} (지연: ${syncDelay}ms, 이유: ${reason})`);
            this.syncInitialGlobalContextToPopup(popupId);
        }, syncDelay);
        
        // 콜백 실행 (팝업 정보와 함께)
        try {
            const popupInfo = this.popups.get(popupId);
            callback(popupId, popupInfo, popupWindow);
            // console.log(`[PopupManager] 팝업 콜백 실행 완료: ${popupId}`);
        } catch (error) {
            console.error(`[PopupManager] 팝업 콜백 실행 실패: ${popupId}`, error);
        }
    }
    
    /**
     * 특정 팝업에 메시지 전송 (상태 체크 포함)
     */
    postMessage(popupId, message, targetOrigin = '*') {
        try {
            const popupInfo = this.popups.get(popupId);
            
            if (!popupInfo) {
                console.warn(`[PopupManager] 존재하지 않는 팝업 ID: ${popupId}`);
                return false;
            }
            
            // 메시지 전송 시점에 팝업 상태 체크
            if (popupInfo.isClosed || popupInfo.window.closed) {
                console.warn(`[PopupManager] 이미 닫힌 팝업에 메시지 전송 시도: ${popupId}`);
                this._markAsClosed(popupId);
                return false;
            }
            
            const messageWithSender = {
                ...message,
                _sender: {
                    type: 'parent',
                    popupId: popupId,
                    timestamp: new Date().getTime()
                }
            };
            
            popupInfo.window.postMessage(messageWithSender, targetOrigin);
            popupInfo.lastChecked = new Date();
            
            // console.log(`[PopupManager] 메시지 전송 완료. 팝업 ID: ${popupId}`, message);
            return true;
            
        } catch (error) {
            console.error(`[PopupManager] 메시지 전송 실패. 팝업 ID: ${popupId}`, error);
            this._markAsClosed(popupId);
            return false;
        }
    }
    
    /**
     * 특정 팝업 닫기
     */
    close(popupId) {
        try {
            const popupInfo = this.popups.get(popupId);
            
            if (!popupInfo) {
                console.warn(`[PopupManager] 존재하지 않는 팝업 ID: ${popupId}`);
                return false;
            }
            
            console.log(`[PopupManager] 팝업 닫기 처리: ${popupId}`, {
                isClosed: popupInfo.isClosed,
                windowClosed: popupInfo.window ? popupInfo.window.closed : 'N/A',
                windowExists: !!popupInfo.window
            });
            
            if (!popupInfo.isClosed && popupInfo.window && !popupInfo.window.closed) {
                console.log(`[PopupManager] window.close() 호출: ${popupId}`);
                
                try {
                    // 1차 시도: 일반적인 window.close()
                    popupInfo.window.close();
                    
                    // 2차 시도: 강제 닫기 (100ms 후)
                    setTimeout(() => {
                        try {
                            if (popupInfo.window && !popupInfo.window.closed) {
                                console.log(`[PopupManager] 강제 닫기 시도: ${popupId}`);
                                
                                // postMessage로 팝업에게 닫기 명령 전송
                                popupInfo.window.postMessage({
                                    type: 'FORCE_CLOSE',
                                    popupId: popupId
                                }, '*');
                                
                                // 추가 강제 닫기 시도
                                popupInfo.window.close();
                                
                                // 3차 시도: 500ms 후 최종 확인
                                setTimeout(() => {
                                    try {
                                        const isClosed = popupInfo.window.closed;
                                        console.log(`[PopupManager] 최종 닫기 상태 확인: ${popupId}, closed: ${isClosed}`);
                                        
                                        if (!isClosed) {
                                            console.warn(`[PopupManager] 팝업 닫기 실패 - 수동 처리 필요: ${popupId}`);
                                            // 강제로 상태를 닫힘으로 변경
                                            this._markAsClosed(popupId);
                                        }
                                    } catch (e) {
                                        console.log(`[PopupManager] 최종 상태 확인 불가: ${popupId}`, e.message);
                                        // 예외 발생 시 닫힌 것으로 간주
                                        this._markAsClosed(popupId);
                                    }
                                }, 500);
                            } else {
                                console.log(`[PopupManager] 닫기 성공: ${popupId}`);
                            }
                        } catch (e) {
                            console.log(`[PopupManager] 강제 닫기 중 오류: ${popupId}`, e.message);
                        }
                    }, 100);
                    
                } catch (error) {
                    console.error(`[PopupManager] window.close() 호출 실패: ${popupId}`, error);
                }
            } else {
                console.log(`[PopupManager] 이미 닫힌 팝업: ${popupId}`);
            }
            
            this._markAsClosed(popupId);
            console.log(`[PopupManager] 팝업 닫기 완료: ${popupId}`);
            return true;
            
        } catch (error) {
            console.error(`[PopupManager] 팝업 닫기 실패. ID: ${popupId}`, error);
            this._markAsClosed(popupId);
            return false;
        }
    }
    
    /**
     * 모든 팝업 닫기 (window.open 팝업 + Modal 팝업)
     */
    closeAll() {
        let closedCount = 0;
        const totalPopups = this.popups.size;
        
        console.log(`[PopupManager] closeAll 시작 - 총 ${totalPopups}개 window.open 팝업 처리`);
        
        // 현재 저장된 모든 팝업 상세 정보 로깅
        if (totalPopups > 0) {
            console.log(`[PopupManager] 저장된 팝업 상세 정보:`);
            for (const [popupId, popupInfo] of this.popups.entries()) {
                console.log(`  - ${popupId}:`, {
                    url: popupInfo.url,
                    name: popupInfo.name,
                    isClosed: popupInfo.isClosed,
                    windowExists: !!popupInfo.window,
                    windowClosed: popupInfo.window ? popupInfo.window.closed : 'N/A',
                    createdAt: popupInfo.createdAt
                });
            }
        } else {
            console.log(`[PopupManager] 저장된 window.open 팝업이 없습니다. Map 크기: ${this.popups.size}`);
            console.log(`[PopupManager] Map 내용:`, Array.from(this.popups.entries()));
        }
        
        // 1. window.open으로 열린 팝업 닫기
        for (const popupId of this.popups.keys()) {
            console.log(`[PopupManager] 팝업 닫기 시도: ${popupId}`);
            if (this.close(popupId)) {
                closedCount++;
                console.log(`[PopupManager] 팝업 닫기 성공: ${popupId}`);
            } else {
                console.log(`[PopupManager] 팝업 닫기 실패: ${popupId}`);
            }
        }
        
        console.log(`[PopupManager] window.open 팝업 닫기 완료 - ${closedCount}/${totalPopups}개 팝업 닫힘`);
        
        // 2. Modal 팝업(ComLib.openModal)도 함께 닫기
        let modalClosedCount = 0;
        try {
            // ComLib가 로드되어 있는지 확인
            if (typeof window.ComLib !== 'undefined' && typeof window.ComLib.closeAllModals === 'function') {
                console.log(`[PopupManager] Modal 팝업 닫기 시작`);
                modalClosedCount = window.ComLib.closeAllModals();
                console.log(`[PopupManager] Modal 팝업 닫기 완료 - ${modalClosedCount}개 닫힘`);
            } else {
                console.log(`[PopupManager] ComLib.closeAllModals를 찾을 수 없습니다. Modal 팝업은 별도로 닫아야 합니다.`);
            }
        } catch (error) {
            console.error(`[PopupManager] Modal 팝업 닫기 중 오류:`, error);
        }
        
        const totalClosed = closedCount + modalClosedCount;
        console.log(`[PopupManager] 전체 팝업 닫기 완료 - window.open: ${closedCount}개, Modal: ${modalClosedCount}개, 총: ${totalClosed}개`);
        
        return totalClosed;
    }
    
    /**
     * 팝업 정보 조회 (상태 체크 포함)
     */
    getPopup(popupId) {
        const popupInfo = this.popups.get(popupId);
        if (!popupInfo) return null;
        
        // 조회 시점에 상태 체크
        this._checkPopupStatus(popupId);
        
        return popupInfo.isClosed ? null : popupInfo;
    }
    
    /**
     * 팝업 존재 여부 확인 (상태 체크 포함)
     */
    exists(popupId) {
        const popup = this.popups.get(popupId);
        if (!popup) return false;
        
        // 존재 확인 시점에 상태 체크
        this._checkPopupStatus(popupId);
        
        return !popup.isClosed;
    }
    
    /**
     * 활성 팝업 개수 조회 (전체 상태 체크 포함)
     */
    getActiveCount() {
        // 전체 팝업 상태 체크
        this._checkAllPopupStatus();
        
        return Array.from(this.popups.values()).filter(popup => !popup.isClosed).length;
    }
    
    /**
     * 모든 팝업 목록 조회 (상태 체크 포함)
     */
    getAllPopups(includesClosed = false) {
        // 전체 팝업 상태 체크
        this._checkAllPopupStatus();
        
        const popupList = Array.from(this.popups.values());
        
        if (includesClosed) {
            return popupList;
        }
        
        return popupList.filter(popup => !popup.isClosed);
    }
    
    /**
     * 수동으로 닫힌 팝업들 정리
     */
    cleanup() {
        this._checkAllPopupStatus();
        
        const toRemove = [];
        const now = new Date();
        
        for (const [popupId, popupInfo] of this.popups.entries()) {
            if (popupInfo.isClosed) {
                const timeSinceClosed = now - popupInfo.lastChecked;
                if (timeSinceClosed > 5 * 60 * 1000) { // 5분
                    toRemove.push(popupId);
                }
            }
        }
        
        // 완전 제거 (닫힌 팝업만)
        for (const popupId of toRemove) {
            const popupInfo = this.popups.get(popupId);
            
            // 팝업이 실제로 닫혔는지 다시 한 번 확인
            if (popupInfo && popupInfo.isClosed) {
                this.popups.delete(popupId);
                
                // sessionStorage에서도 해당 팝업 데이터 정리
                try {
                    window.sessionStorage.removeItem(`popupData_${popupId}`);
                    console.log(`[PopupManager] 오래된 팝업 데이터 정리: ${popupId}`);
                } catch (error) {
                    console.warn(`[PopupManager] 오래된 팝업 데이터 정리 실패: ${popupId}`, error);
                }
                
                // console.log(`[PopupManager] 팝업 메모리에서 완전 제거: ${popupId}`);
            } else {
                console.log(`[PopupManager] 팝업 제거 취소 (아직 열려있음): ${popupId}`);
            }
        }
        
        // console.log(`[PopupManager] 수동 정리 완료. 제거된 팝업 수: ${toRemove.length}`);
        return toRemove.length;
    }
    
    /**
     * 팝업 닫힘 리스너 등록
     */
    onPopupClosed(callback) {
        this.closeListeners.add(callback);
    }
    
    /**
     * 팝업 닫힘 리스너 제거
     */
    offPopupClosed(callback) {
        this.closeListeners.delete(callback);
    }
    
    // ========== BroadcastChannel 관련 메서드들 ==========
    
    /**
     * BroadcastChannel을 통해 모든 창에 메시지 브로드캐스트
     * @param {string} channelName - 채널 이름
     * @param {Object} message - 전송할 메시지
     * @param {Object} options - 브로드캐스트 옵션
     * @returns {boolean} 전송 성공 여부
     */
    broadcast(channelName, message, options = {}) {
        if (!this.broadcastSupported) {
            console.warn('[PopupManager] BroadcastChannel이 지원되지 않습니다.');
            return false;
        }
        
        try {
            const channel = this._getOrCreateChannel(channelName);
            
            const broadcastMessage = {
                ...message,
                _broadcast: {
                    channelName: channelName,
                    timestamp: new Date().getTime(),
                    sender: 'PopupManager',
                    options: options
                }
            };
            
            channel.postMessage(broadcastMessage);
            
            // console.log(`[PopupManager] 브로드캐스트 메시지 전송 (채널: ${channelName}):`, broadcastMessage);
            return true;
            
        } catch (error) {
            console.error(`[PopupManager] 브로드캐스트 전송 실패 (채널: ${channelName}):`, error);
            return false;
        }
    }
    
    /**
     * 다중 채널에 동시 브로드캐스트
     * @param {string[]} channelNames - 채널 이름 배열
     * @param {Object} message - 전송할 메시지
     * @param {Object} options - 브로드캐스트 옵션
     * @returns {Object} 채널별 전송 결과
     */
    broadcastMultiple(channelNames, message, options = {}) {
        const results = {};
        
        channelNames.forEach(channelName => {
            results[channelName] = this.broadcast(channelName, message, options);
        });
        
        // console.log('[PopupManager] 다중 브로드캐스트 결과:', results);
        return results;
    }
    
    /**
     * 브로드캐스트 메시지 수신 리스너 등록
     * @param {string} channelName - 채널 이름 (null이면 모든 채널)
     * @param {Function} callback - 콜백 함수
     */
    onBroadcast(channelName, callback) {
        if (!this.broadcastSupported) {
            console.warn('[PopupManager] BroadcastChannel이 지원되지 않습니다.');
            return;
        }
        
        if (typeof channelName === 'function') {
            // channelName이 함수면 모든 채널 리스너로 등록
            callback = channelName;
            channelName = null;
        }
        
        const listener = {
            channelName: channelName,
            callback: callback,
            id: this._generateId()
        };
        
        this.broadcastListeners.add(listener);
        
        // 특정 채널 리스너인 경우 채널 생성
        if (channelName) {
            this._getOrCreateChannel(channelName);
        }
        
        // console.log(`[PopupManager] 브로드캐스트 리스너 등록 (채널: ${channelName || '전체'})`);
        
        return listener.id; // 리스너 ID 반환 (해제용)
    }
    
    /**
     * 브로드캐스트 메시지 수신 리스너 제거
     * @param {string} listenerId - 리스너 ID
     */
    offBroadcast(listenerId) {
        for (const listener of this.broadcastListeners) {
            if (listener.id === listenerId) {
                this.broadcastListeners.delete(listener);
                // console.log(`[PopupManager] 브로드캐스트 리스너 제거 (ID: ${listenerId})`);
                return true;
            }
        }
        return false;
    }
    
    /**
     * 활성 브로드캐스트 채널 목록 조회
     * @returns {string[]} 채널 이름 배열
     */
    getBroadcastChannels() {
        return Array.from(this.broadcastChannels.keys());
    }
    
    /**
     * 특정 채널의 리스너 수 조회
     * @param {string} channelName - 채널 이름
     * @returns {number} 리스너 수
     */
    getBroadcastListenerCount(channelName) {
        return Array.from(this.broadcastListeners).filter(
            listener => listener.channelName === channelName || (!channelName && !listener.channelName)
        ).length;
    }
    
    /**
     * 컴포넌트별 브로드캐스트 리스너 등록 (간편 메소드)
     * @param {string} componentName - 컴포넌트 이름 (예: 'COM1080', 'CNS0160')
     * @param {string} channelName - 채널 이름
     * @param {Function} callback - 콜백 함수
     * @returns {string} 리스너 ID
     */
    registerComponentListener(componentName, channelName, callback) {
        if (!this.componentListeners.has(componentName)) {
            this.componentListeners.set(componentName, new Set());
        }
        
        const listenerId = this.onBroadcast(channelName, callback);
        this.componentListeners.get(componentName).add(listenerId);
        
        // console.log(`[PopupManager] 컴포넌트 리스너 등록: ${componentName} -> ${channelName}`);
        return listenerId;
    }
    
    /**
     * 컴포넌트의 모든 브로드캐스트 리스너 해제
     * @param {string} componentName - 컴포넌트 이름
     */
    unregisterComponentListeners(componentName) {
        const listeners = this.componentListeners.get(componentName);
        if (listeners) {
            for (const listenerId of listeners) {
                this.offBroadcast(listenerId);
            }
            listeners.clear();
            // console.log(`[PopupManager] 컴포넌트 리스너 해제: ${componentName}`);
        }
    }
    
    /**
     * 특정 팝업 ID에만 브로드캐스트 전송 (사용 중단 - 전체 브로드캐스트 사용)
     * @deprecated 팝업 ID 식별 문제로 인해 사용 중단. broadcast() 메서드 사용 권장
     * @param {string} popupId - 대상 팝업 ID
     * @param {string} channelName - 채널 이름
     * @param {Object} message - 전송할 메시지
     * @param {Object} options - 브로드캐스트 옵션
     * @returns {boolean} 전송 성공 여부
     */
    broadcastToPopup(popupId, channelName, message, options = {}) {
        console.warn('[PopupManager] broadcastToPopup은 사용 중단되었습니다. broadcast() 메서드를 사용하세요.');
        
        // 전체 브로드캐스트로 대체
        return this.broadcast(channelName, message, options);
    }
    
    /**
     * 특정 팝업들에게만 브로드캐스트 전송 (사용 중단 - 전체 브로드캐스트 사용)
     * @deprecated 팝업 ID 식별 문제로 인해 사용 중단. broadcast() 메서드 사용 권장
     * @param {string[]} popupIds - 대상 팝업 ID 배열
     * @param {string} channelName - 채널 이름
     * @param {Object} message - 전송할 메시지
     * @param {Object} options - 브로드캐스트 옵션
     * @returns {Object} 팝업별 전송 결과
     */
    broadcastToPopups(popupIds, channelName, message, options = {}) {
        console.warn('[PopupManager] broadcastToPopups는 사용 중단되었습니다. broadcast() 메서드를 사용하세요.');
        
        // 전체 브로드캐스트로 대체
        return { result: this.broadcast(channelName, message, options) };
    }
    
    /**
     * 조건에 맞는 팝업들에게만 브로드캐스트 전송 (사용 중단 - 전체 브로드캐스트 사용)
     * @deprecated 팝업 ID 식별 문제로 인해 사용 중단. broadcast() 메서드 사용 권장
     * @param {Function} filterFn - 팝업 필터링 함수
     * @param {string} channelName - 채널 이름
     * @param {Object} message - 전송할 메시지
     * @param {Object} options - 브로드캐스트 옵션
     * @returns {Object} 필터링된 팝업들의 전송 결과
     */
    broadcastToFilteredPopups(filterFn, channelName, message, options = {}) {
        console.warn('[PopupManager] broadcastToFilteredPopups는 사용 중단되었습니다. broadcast() 메서드를 사용하세요.');
        
        // 전체 브로드캐스트로 대체
        return { result: this.broadcast(channelName, message, options) };
    }
    
    /**
     * 팝업에 초기 GlobalContext 데이터 전달
     * @param {string} popupId - 팝업 ID
     * @param {number} retryCount - 재시도 횟수 (기본값: 0)
     */
    syncInitialGlobalContextToPopup(popupId, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 500; // 500ms 간격으로 재시도
        
        try {
            // console.log(`[PopupManager] GlobalContext 동기화 시도 (${retryCount + 1}/${maxRetries + 1}) - 팝업 ID: ${popupId}`);
            // console.log('[PopupManager] GlobalContext 인스턴스 확인:', this.globalContextInstance);
            // console.log('[PopupManager] window.globalContextInstance 확인:', window.globalContextInstance);
            
            // GlobalContext 인스턴스 확인 (백업 방법 포함)
            const globalInstance = this.globalContextInstance || window.globalContextInstance;
            
            if (!globalInstance) {
                console.warn(`[PopupManager] GlobalContext 인스턴스가 등록되지 않았습니다. (시도 ${retryCount + 1}/${maxRetries + 1})`);
                console.warn('[PopupManager] this.globalContextInstance:', this.globalContextInstance);
                console.warn('[PopupManager] window.globalContextInstance:', window.globalContextInstance);
                
                // 재시도 로직
                if (retryCount < maxRetries) {
                    // console.log(`[PopupManager] ${retryDelay}ms 후 GlobalContext 동기화 재시도...`);
                    setTimeout(() => {
                        this.syncInitialGlobalContextToPopup(popupId, retryCount + 1);
                    }, retryDelay);
                    return false;
                }
                
                console.error(`[PopupManager] GlobalContext 동기화 최종 실패 - 최대 재시도 횟수 초과 (팝업 ID: ${popupId})`);
                return false;
            }

            // console.log('[PopupManager] GlobalContext 인스턴스 state:', globalInstance.state);

            // 현재 GlobalContext 데이터 수집 
            // 우선순위: 직접 설정 > 메서드 > state 접근
            let globalData = {};
            let dataSource = '';
            
            // 1순위: CNS0010에서 직접 설정한 데이터 사용 (기존 방식)
            if (this.currentGlobalData) {
                // console.log('[PopupManager] 직접 설정된 GlobalContext 데이터 사용 (기존 방식)');
                globalData = { ...this.currentGlobalData }; // 깊은 복사로 안전성 확보
                dataSource = 'currentGlobalData';
            }
            // 2순위: getCurrentGlobalData 메서드 사용
            else if (typeof globalInstance.getCurrentGlobalData === 'function') {
                // console.log('[PopupManager] getCurrentGlobalData 메서드 사용');
                globalData = globalInstance.getCurrentGlobalData();
                dataSource = 'getCurrentGlobalData';
            } 
            // 3순위: 기존 방식으로 state 직접 접근
            else {
                // console.log('[PopupManager] 기존 방식으로 state 직접 접근');
                globalData = {
                    gCustomerData: globalInstance.state?.gCustomerData || {},
                    gCtiData: globalInstance.state?.gCtiData || {},
                    gCallData: globalInstance.state?.gCallData || {},
                    gCnslData: globalInstance.state?.gCnslData || {}
                };
                dataSource = 'directStateAccess';
            }

            // 데이터 유효성 검증
            const hasValidData = this._validateGlobalContextData(globalData);
            if (!hasValidData && retryCount < maxRetries) {
                console.warn(`[PopupManager] GlobalContext 데이터가 비어있습니다. (시도 ${retryCount + 1}/${maxRetries + 1})`);
                console.warn('[PopupManager] 수집된 데이터:', globalData);
                
                // 재시도 로직
                // console.log(`[PopupManager] ${retryDelay}ms 후 GlobalContext 동기화 재시도...`);
                setTimeout(() => {
                    this.syncInitialGlobalContextToPopup(popupId, retryCount + 1);
                }, retryDelay);
                return false;
            }

            // console.log(`[PopupManager] 수집된 GlobalContext 데이터 (소스: ${dataSource}):`, globalData);
            // console.log('[PopupManager] gCustomerData 상세:', globalData.gCustomerData);

            // 팝업에 초기 데이터 브로드캐스트
            const success = this.broadcast('POPUP_BROADCAST', {
                type: 'GLOBAL_CONTEXT_INITIAL_SYNC',
                data: globalData,
                targetPopupId: popupId, // 참고용
                dataSource: dataSource, // 디버깅용
                retryCount: retryCount, // 디버깅용
                _sender: {
                    type: 'parent',
                    source: 'PopupManager',
                    timestamp: new Date().getTime()
                }
            });

            // console.log(`[PopupManager] 팝업 ${popupId}에 초기 GlobalContext 데이터 전달 성공 (시도 ${retryCount + 1}/${maxRetries + 1}):`, globalData);
            
            // 직접 설정된 데이터 정리 (일회성 사용) - 성공 시에만 정리
            if (this.currentGlobalData && success) {
                // console.log('[PopupManager] 직접 설정된 GlobalContext 데이터 정리');
                delete this.currentGlobalData;
            }
            
            return success;

        } catch (error) {
            console.error(`[PopupManager] 초기 GlobalContext 동기화 실패 (시도 ${retryCount + 1}/${maxRetries + 1}):`, error);
            
            // 재시도 로직
            if (retryCount < maxRetries) {
                // console.log(`[PopupManager] ${retryDelay}ms 후 GlobalContext 동기화 재시도...`);
                setTimeout(() => {
                    this.syncInitialGlobalContextToPopup(popupId, retryCount + 1);
                }, retryDelay);
                return false;
            }
            
            console.error(`[PopupManager] GlobalContext 동기화 최종 실패 - 최대 재시도 횟수 초과 (팝업 ID: ${popupId})`);
            return false;
        }
    }

    /**
     * GlobalContext 데이터 유효성 검증
     * @private
     * @param {Object} globalData - 검증할 GlobalContext 데이터
     * @returns {boolean} 유효한 데이터 여부
     */
    _validateGlobalContextData(globalData) {
        if (!globalData || typeof globalData !== 'object') {
            return false;
        }

        // 최소한 하나의 유효한 데이터가 있는지 확인
        const hasCustomerData = globalData.gCustomerData && 
                               globalData.gCustomerData.basicInfo && 
                               Object.keys(globalData.gCustomerData.basicInfo).length > 0;
        
        const hasCtiData = globalData.gCtiData && 
                          Object.keys(globalData.gCtiData).length > 0;
        
        const hasCallData = globalData.gCallData && 
                           Object.keys(globalData.gCallData).length > 0;
        
        const hasCnslData = globalData.gCnslData && 
                           Object.keys(globalData.gCnslData).length > 0;

        const isValid = hasCustomerData || hasCtiData || hasCallData || hasCnslData;
        
        // console.log('[PopupManager] GlobalContext 데이터 유효성 검증:', {
        //     hasCustomerData,
        //     hasCtiData, 
        //     hasCallData,
        //     hasCnslData,
        //     isValid
        // });
        
        return isValid;
    }

    /**
     * 모든 활성 팝업에 현재 GlobalContext 데이터 동기화
     */
    syncGlobalContextToAllPopups() {
        const activePopups = this.getAllPopups();
        let syncCount = 0;

        activePopups.forEach(popup => {
            if (this.syncInitialGlobalContextToPopup(popup.id)) {
                syncCount++;
            }
        });

        // console.log(`[PopupManager] ${syncCount}개 팝업에 GlobalContext 동기화 완료`);
        return syncCount;
    }
    
    /**
     * 팝업 관리자 정리 및 종료
     */
    destroy() {
        // 모든 팝업 닫기
        this.closeAll();
        
        // 이벤트 리스너 정리
        this.closeListeners.clear();
        
        // 브로드캐스트 채널 정리
        this._cleanupBroadcastChannels();
        
        // sessionStorage 데이터 정리 (닫힌 팝업만)
        try {
            const allKeys = Object.keys(window.sessionStorage);
            const popupDataKeys = allKeys.filter(key => key.startsWith('popupData_'));
            let cleanedCount = 0;
            
            for (const key of popupDataKeys) {
                // popupData_${popupId} 형태에서 popupId 추출
                const popupId = key.replace('popupData_', '');
                const popupInfo = this.popups.get(popupId);
                
                // 팝업이 없거나 닫힌 상태인 경우만 정리
                if (!popupInfo || popupInfo.isClosed) {
                    window.sessionStorage.removeItem(key);
                    console.log(`[PopupManager] sessionStorage 정리: ${key} (팝업 상태: ${!popupInfo ? '없음' : '닫힘'})`);
                    cleanedCount++;
                } else {
                    console.log(`[PopupManager] sessionStorage 보존: ${key} (팝업이 아직 열려있음)`);
                }
            }
            
            // currentPopupId 확인 후 정리
            const currentPopupId = window.sessionStorage.getItem('currentPopupId');
            if (currentPopupId) {
                const currentPopupInfo = this.popups.get(currentPopupId);
                if (!currentPopupInfo || currentPopupInfo.isClosed) {
                    window.sessionStorage.removeItem('currentPopupId');
                    console.log(`[PopupManager] currentPopupId 정리: ${currentPopupId}`);
                } else {
                    console.log(`[PopupManager] currentPopupId 보존: ${currentPopupId} (팝업이 아직 열려있음)`);
                }
            }
            
            console.log(`[PopupManager] sessionStorage 정리 완료: ${cleanedCount}개 정리, ${popupDataKeys.length - cleanedCount}개 보존`);
        } catch (error) {
            console.warn('[PopupManager] sessionStorage 정리 중 오류:', error);
        }
        
        // 데이터 정리
        this.popups.clear();
        
        // postMessage 핸들러 제거
        window.removeEventListener('message', this._messageHandler);
        window.removeEventListener('beforeunload', this._unloadHandler);
        window.removeEventListener('unload', this._unloadHandler);
        window.removeEventListener('pagehide', this._unloadHandler);
        
        // 주기적 정리 작업 중단
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
            console.log('[PopupManager] 주기적 정리 작업이 중단되었습니다');
        }
        
        // console.log('[PopupManager] 팝업 관리자가 정리되었습니다.');
    }
    
    // ========== 내부 메서드들 ==========
    
    /**
     * 고유 ID 생성
     * @private
     */
    _generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `popup_${timestamp}_${random}_${this.nextId++}`;
    }
    
    /**
     * 팝업을 닫힌 상태로 표시
     * @private
     */
    _markAsClosed(popupId) {
        const popupInfo = this.popups.get(popupId);
        if (popupInfo && !popupInfo.isClosed) {
            popupInfo.isClosed = true;
            popupInfo.lastChecked = new Date();
            
            // sessionStorage 정리 (팝업 데이터)
            try {
                window.sessionStorage.removeItem(`popupData_${popupId}`);
                console.log(`[PopupManager] 팝업 데이터 정리 완료. ID: ${popupId}`);
                
                // 현재 팝업 ID가 닫힌 팝업이면 currentPopupId도 정리
                const currentPopupId = window.sessionStorage.getItem('currentPopupId');
                if (currentPopupId === popupId) {
                    window.sessionStorage.removeItem('currentPopupId');
                    console.log(`[PopupManager] 현재 팝업 ID 정리 완료. ID: ${popupId}`);
                }
            } catch (error) {
                console.warn(`[PopupManager] sessionStorage 정리 실패. ID: ${popupId}`, error);
            }
            
            // 닫힘 리스너들에게 알림
            for (const callback of this.closeListeners) {
                try {
                    callback(popupId, popupInfo);
                } catch (error) {
                    console.error('[PopupManager] 닫힘 리스너 실행 오류:', error);
                }
            }
        }
    }
    
    /**
     * 특정 팝업 상태 체크
     * @private
     */
    _checkPopupStatus(popupId) {
        const popupInfo = this.popups.get(popupId);
        if (!popupInfo || popupInfo.isClosed) return;
        
        try {
            if (popupInfo.window.closed) {
                this._markAsClosed(popupId);
            } else {
                popupInfo.lastChecked = new Date();
            }
        } catch (error) {
            console.warn(`[PopupManager] 팝업 상태 확인 오류 (ID: ${popupId}):`, error);
            this._markAsClosed(popupId);
        }
    }
    
    /**
     * 모든 팝업 상태 체크
     * @private
     */
    _checkAllPopupStatus() {
        for (const popupId of this.popups.keys()) {
            this._checkPopupStatus(popupId);
        }
    }
    
    /**
     * 페이지 언로드 핸들러 설정
     * @private
     */
    _setupPageUnloadHandler() {
        this._unloadHandler = () => {
            console.log('[PopupManager] 페이지 언로드 감지 - 모든 팝업 닫기 시작');
            const closedCount = this.closeAll();
            console.log(`[PopupManager] 페이지 언로드 - ${closedCount}개 팝업 닫기 완료`);
        };
        
        window.addEventListener('beforeunload', this._unloadHandler);
        window.addEventListener('unload', this._unloadHandler);
        window.addEventListener('pagehide', this._unloadHandler);
        console.log('[PopupManager] 페이지 언로드 이벤트 리스너 등록 완료 (beforeunload, unload, pagehide)');
    }
    
    /**
     * 주기적 정리 작업 설정
     * @private
     */
    _setupPeriodicCleanup() {
        // 5분마다 자동 정리 실행
        this._cleanupInterval = setInterval(() => {
            // 먼저 모든 팝업의 상태를 확인
            this._checkAllPopupStatus();
            
            // 그 다음 정리 작업 수행
            const removedCount = this.cleanup();
            if (removedCount > 0) {
                console.log(`[PopupManager] 주기적 정리 완료: ${removedCount}개 팝업 제거`);
            }
        }, 5 * 60 * 1000); // 5분
        
        console.log('[PopupManager] 주기적 정리 작업이 설정되었습니다 (5분 간격)');
    }
    
    /**
     * postMessage 수신 핸들러 설정
     * @private
     */
    _setupMessageHandler() {
        this._messageHandler = (event) => {
            const messageData = event.data;
            
            // 팝업 ID 요청 처리
            if (messageData && messageData.type === 'GET_POPUP_ID') {
                const popupId = this._findPopupIdByWindow(event.source);
                if (popupId) {
                    event.source.postMessage({
                        type: 'POPUP_ID_RESPONSE',
                        popupId: popupId,
                        requestId: messageData.requestId
                    }, '*');
                }
                return;
            }
            
            if (messageData && messageData._sender && messageData._sender.type === 'popup') {
                // console.log('[PopupManager] 팝업으로부터 메시지 수신:', messageData);
                
                const customEvent = new CustomEvent('popupMessage', {
                    detail: {
                        popupId: messageData._sender.popupId,
                        message: messageData,
                        origin: event.origin,
                        source: event.source
                    }
                });
                
                window.dispatchEvent(customEvent);
            }
        };
        
        window.addEventListener('message', this._messageHandler);
    }
    
    /**
     * BroadcastChannel 초기 설정
     * @private
     */
    _setupBroadcastChannels() {
        if (!this.broadcastSupported) {
            // console.log('[PopupManager] BroadcastChannel이 지원되지 않아 브로드캐스트 기능을 건너뜁니다.');
            return;
        }
        
        // 기본 채널들 생성
        const defaultChannels = [
            'CTI_EVENTS_BROADCAST', // CTI 이벤트 브로드캐스트 채널
            'CTI_FUNC_BROADCAST',    // CTI 기능 호출
            'POPUP_BROADCAST' // 팝업 전용 브로드캐스트 채널
        ];
        
        defaultChannels.forEach(channelName => {
            this._getOrCreateChannel(channelName);
        });
        
        // console.log('[PopupManager] 기본 브로드캐스트 채널 설정 완료:', defaultChannels);
    }
    
    /**
     * 자동 브로드캐스트 리스너 설정
     * @private
     */
    _setupAutoBroadcastListeners() {
        if (!this.broadcastSupported) {
            return;
        }
        
        // CTI_EVENTS_BROADCAST 채널 자동 리스너
        this.onBroadcast('CTI_EVENTS_BROADCAST', (message, channelName) => {
            // console.log(`[PopupManager] 자동 CTI 이벤트 수신 (${channelName}):`, message);
            
            // 전역 이벤트 발생
            const event = new CustomEvent('ctiEventReceived', {
                detail: { message, channelName }
            });
            window.dispatchEvent(event);
        });
        
        // CTI_FUNC_BROADCAST 채널 자동 리스너  
        this.onBroadcast('CTI_FUNC_BROADCAST', (message, channelName) => {
            // console.log(`[PopupManager] 자동 CTI 기능 수신 (${channelName}):`, message);
            
            // 전역 이벤트 발생
            const event = new CustomEvent('ctiFunctionReceived', {
                detail: { message, channelName }
            });
            window.dispatchEvent(event);
        });
        
    // POPUP_BROADCAST 채널 자동 리스너
    this.onBroadcast('POPUP_BROADCAST', (message, channelName) => {
        // console.log(`[PopupManager] 자동 팝업 이벤트 수신 (${channelName}):`, message);
        
        // ⭐ GlobalContext 동기화 처리 추가
        if (message.type === 'GLOBAL_CONTEXT_UPDATE' || message.type === 'GLOBAL_CONTEXT_INITIAL_SYNC') {
            const syncEvent = new CustomEvent('globalContextSync', {
                detail: {
                    type: message.type,
                    dataType: message.dataType,
                    data: message.data,
                    sender: message._sender
                }
            });
            window.dispatchEvent(syncEvent);
            // console.log('[PopupManager] GlobalContext 동기화 이벤트 발생:', message.type, message.dataType);
        }
        
        // 전역 이벤트 발생
        const event = new CustomEvent('popupEventReceived', {
            detail: { message, channelName }
        });
        window.dispatchEvent(event);
    });
        
        // console.log('[PopupManager] 자동 브로드캐스트 리스너 설정 완료');
    }
    
    /**
     * 채널 가져오기 또는 생성
     * @private
     * @param {string} channelName - 채널 이름
     * @returns {BroadcastChannel} 브로드캐스트 채널
     */
    _getOrCreateChannel(channelName) {
        if (this.broadcastChannels.has(channelName)) {
            return this.broadcastChannels.get(channelName);
        }
        
        try {
            const channel = new BroadcastChannel(channelName);
            
            // 메시지 수신 핸들러 설정
            channel.onmessage = (event) => {
                this._handleBroadcastMessage(channelName, event);
            };
            
            // 에러 핸들러 설정
            channel.onerror = (error) => {
                console.error(`[PopupManager] 브로드캐스트 채널 에러 (${channelName}):`, error);
            };
            
            this.broadcastChannels.set(channelName, channel);
            
            // console.log(`[PopupManager] 브로드캐스트 채널 생성: ${channelName}`);
            return channel;
            
        } catch (error) {
            console.error(`[PopupManager] 브로드캐스트 채널 생성 실패 (${channelName}):`, error);
            return null;
        }
    }
    
    /**
     * 브로드캐스트 메시지 수신 처리
     * @private
     * @param {string} channelName - 채널 이름
     * @param {MessageEvent} event - 메시지 이벤트
     */
    _handleBroadcastMessage(channelName, event) {
        const messageData = event.data;
        
        // console.log(`[PopupManager] 브로드캐스트 메시지 수신 (채널: ${channelName}):`, messageData);
        
        // 특정 팝업 타겟팅 기능 제거 - 모든 메시지를 처리
        // (팝업 ID 식별 문제로 인해 전체 브로드캐스트로 변경)
        
        // 리스너들에게 알림
        for (const listener of this.broadcastListeners) {
            try {
                // 전체 리스너이거나 해당 채널 리스너인 경우
                if (!listener.channelName || listener.channelName === channelName) {
                    listener.callback(messageData, channelName, event);
                }
            } catch (error) {
                console.error(`[PopupManager] 브로드캐스트 리스너 실행 오류 (채널: ${channelName}):`, error);
            }
        }
        
        // 커스텀 이벤트로도 알림
        const customEvent = new CustomEvent('broadcastMessage', {
            detail: {
                channelName: channelName,
                message: messageData,
                originalEvent: event,
                isTargeted: false // 특정 타겟팅 기능 제거
            }
        });
        
        window.dispatchEvent(customEvent);
    }
    
    /**
     * 현재 창의 팝업 ID를 가져오는 헬퍼
     * @private
     * @returns {string|null} 현재 팝업 ID
     */
    _getCurrentPopupId() {
        // 1. 현재 창이 팝업인지 확인
        if (window.opener && window.opener !== window) {
            // 팝업 창인 경우
            
            // 1-1. 부모 창의 PopupManager 인스턴스에 접근
            if (window.opener.PopupManagerInstance) {
                const parentPopupManager = window.opener.PopupManagerInstance;
                
                // 1-2. window.name으로 팝업 찾기
                if (window.name) {
                    for (const [popupId, popupInfo] of parentPopupManager.popups.entries()) {
                        if (popupInfo.name === window.name) {
                            // console.log(`[PopupManager] window.name으로 팝업 ID 찾음: ${popupId}`);
                            return popupId;
                        }
                    }
                }
                
                // 1-3. window 객체 참조로 팝업 찾기
                for (const [popupId, popupInfo] of parentPopupManager.popups.entries()) {
                    if (popupInfo.window === window) {
                        // console.log(`[PopupManager] window 객체 참조로 팝업 ID 찾음: ${popupId}`);
                        return popupId;
                    }
                }
                
                // 1-4. URL 파라미터에서 팝업 ID 찾기
                const urlParams = new URLSearchParams(window.location.search);
                const popupId = urlParams.get('popupId');
                if (popupId) {
                    // console.log(`[PopupManager] URL 파라미터로 팝업 ID 찾음: ${popupId}`);
                    return popupId;
                }
                
                // 1-5. 세션스토리지에서 팝업 ID 찾기
                const sessionPopupId = sessionStorage.getItem('currentPopupId');
                if (sessionPopupId) {
                    // console.log(`[PopupManager] 세션스토리지로 팝업 ID 찾음: ${sessionPopupId}`);
                    return sessionPopupId;
                }
            }
            
            // 1-6. 부모 창에 팝업 ID 요청
            try {
                window.opener.postMessage({
                    type: 'GET_POPUP_ID',
                    requestId: Date.now()
                }, '*');
            } catch (error) {
                console.warn('[PopupManager] 부모 창에 팝업 ID 요청 실패:', error);
            }
            
            console.warn('[PopupManager] 팝업 ID를 찾을 수 없습니다.');
            return null;
        }
        
        // 2. 메인 창인 경우
        // console.log('[PopupManager] 메인 창입니다.');
        return null;
    }

    /**
     * 윈도우 객체로 팝업 ID 찾기
     * @private
     * @param {Window} targetWindow - 대상 윈도우
     * @returns {string|null} 팝업 ID
     */
    _findPopupIdByWindow(targetWindow) {
        for (const [popupId, popupInfo] of this.popups.entries()) {
            if (popupInfo.window === targetWindow) {
                return popupId;
            }
        }
        return null;
    }
    
    /**
     * 모든 브로드캐스트 채널 정리
     * @private
     */
    _cleanupBroadcastChannels() {
        if (!this.broadcastSupported) {
            return;
        }
        
        // 모든 채널 닫기
        for (const [channelName, channel] of this.broadcastChannels.entries()) {
            try {
                channel.close();
                // console.log(`[PopupManager] 브로드캐스트 채널 닫힘: ${channelName}`);
            } catch (error) {
                console.error(`[PopupManager] 브로드캐스트 채널 닫기 실패 (${channelName}):`, error);
            }
        }
        
        // 데이터 정리
        this.broadcastChannels.clear();
        this.broadcastListeners.clear();
        
        // console.log('[PopupManager] 모든 브로드캐스트 채널이 정리되었습니다.');
    }
}

// 싱글톤 인스턴스 생성
console.log('[PopupManager] 싱글톤 인스턴스 생성 시작');
const popupManager = new PopupManager();
console.log('[PopupManager] 싱글톤 인스턴스 생성 완료');

// 전역 접근을 위한 윈도우 객체에 할당 (개발/디버깅용)
if (typeof window !== 'undefined') {
    window.PopupManagerInstance = popupManager;
    console.log('[PopupManager] 전역 window.PopupManagerInstance 등록 완료');
    
    // 로그아웃 시 사용할 수 있는 전역 메서드
    window.closeAllPopups = () => {
        console.log('[PopupManager] 전역 closeAllPopups 호출됨');
        return popupManager.closeAll();
    };
    console.log('[PopupManager] 전역 window.closeAllPopups 메서드 등록 완료');
}

export default popupManager;
export { PopupManager };