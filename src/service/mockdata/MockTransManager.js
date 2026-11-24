/**
 * Mock TransManager
 * 
 * 기존 TransManager와 동일한 인터페이스를 제공하여
 * 추후 실제 인터페이스 연계 시 최소한의 수정으로 전환 가능
 */

import mockServiceManager from './MockServiceManager';

class MockTransManager {
    constructor() {
        this.isMockMode = true; // Mock 모드 플래그
    }

    /**
     * POST 요청 시뮬레이션
     * @param {string} url - API URL
     * @param {Object} data - 요청 데이터
     * @param {Function} callback - 콜백 함수
     * @param {Object} options - 옵션
     */
    post(url, data, callback, options = {}) {
        if (!this.isMockMode) {
            console.warn('[MockTransManager] Mock 모드가 비활성화되어 있습니다.');
            return;
        }

        // Mock 서비스 매니저를 통해 호출
        mockServiceManager.post(url, data, callback, options);
    }

    /**
     * GET 요청 시뮬레이션 (POST로 처리)
     * @param {string} url - API URL
     * @param {Object} data - 요청 데이터
     * @param {Function} callback - 콜백 함수
     * @param {Object} options - 옵션
     */
    get(url, data, callback, options = {}) {
        // GET 요청도 POST로 처리 (기존 TransManager와 동일)
        this.post(url, data, callback, options);
    }

    /**
     * Mock 모드 설정
     * @param {boolean} enabled - Mock 모드 활성화 여부
     */
    setMockMode(enabled) {
        this.isMockMode = enabled;
        console.log(`[MockTransManager] Mock 모드 ${enabled ? '활성화' : '비활성화'}`);
    }

    /**
     * Mock 모드 상태 확인
     * @returns {boolean} Mock 모드 활성화 여부
     */
    isMockEnabled() {
        return this.isMockMode;
    }

    /**
     * Mock 서비스 매니저 설정
     * @param {Object} config - 설정 객체
     */
    configure(config = {}) {
        if (config.delay !== undefined) {
            mockServiceManager.setDelay(config.delay);
        }
        
        if (config.clearCache) {
            mockServiceManager.clearCache();
        }
    }
}

// 싱글톤 인스턴스 생성
const mockTransManager = new MockTransManager();

export default mockTransManager; 