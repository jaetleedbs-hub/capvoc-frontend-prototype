import React from 'react';
import { ComLib } from 'common';
import './DisplayLayer.css';

class DisplayLayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            waitingCustomers: 0,
            waitingTime: '00:00:00',
            connectionStatus: 'connecting' // connecting, connected, error
        };
        this.eventSource = null;
    }

    componentDidMount() {
        // 전역적으로 SSE 초기화를 호출할 수 있도록 window 객체에 등록
        window.DISPLAYLAYER_initializeSSE = this.initializeSSE;
        window.DISPLAYLAYER_closeSSE = this.closeSSE;
        
        const gdsUserInfo = ComLib.getSession('gdsUserInfo');

        // cti사용여부 체크
        if(gdsUserInfo && gdsUserInfo.ctiUseYn === 'Y') {
            // ctiId 를 넘겨서 조회
            this.initializeSSE();
        }
    }

    componentWillUnmount() {
        this.closeSSE();
        
        // 전역 함수 정리
        if (window.DISPLAYLAYER_initializeSSE) {
            delete window.DISPLAYLAYER_initializeSSE;
        }
        if (window.DISPLAYLAYER_closeSSE) {
            delete window.DISPLAYLAYER_closeSSE;
        }
    }

    initializeSSE = () => {
        try {
            // 기존 연결이 있으면 먼저 정리
            if (this.eventSource) {
                console.log('기존 SSE 연결 정리 중 - DisplayLayer');
                this.eventSource.close();
                this.eventSource = null;
            }

            const gdsUserInfo = ComLib.getSession('gdsUserInfo');
            const gdsSysBaseInfo = ComLib.getSession('gdsSysBaseInfo');
            
            // 상담사 ID는 props에서 받거나 전역 상태에서 가져올 수 있도록 구현
            // 현재는 기본값으로 설정 (실제 구현시 수정 필요)
            const agtid = gdsUserInfo.ctiId;
            const BASE_URL = gdsSysBaseInfo.ctiSseServer + "/cc";
            const url = `${BASE_URL}/sse/subscribe/${agtid}`;

            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => {
                console.log('SSE 연결 성공 - DisplayLayer');
                this.setState({ connectionStatus: 'connected' });
            };

            this.eventSource.onerror = () => {
                console.error('SSE 연결 오류 - DisplayLayer');
                this.setState({ connectionStatus: 'error' });
                
                // EventSource 자동 재연결 중단을 위해 명시적으로 닫기
                if (this.eventSource) {
                    this.eventSource.close();
                    this.eventSource = null;
                    console.log('SSE EventSource 자동 재연결 중단 - DisplayLayer');
                }
            };

            // esp-agent-dashboard 이벤트 리스너 등록
            this.eventSource.addEventListener("esp-agent-dashboard", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // console.log('SSE 데이터 수신:', data);
                    
                    // 대기시간 포맷팅: 포맷된 값이 있으면 사용, 없으면 초 단위를 변환
                    let formattedWaitingTime = '00:00:00';
                    if (data.waitingtimeFormatted) {
                        formattedWaitingTime = data.waitingtimeFormatted;
                    } else if (data.waitingtime) {
                        formattedWaitingTime = this.formatSecondsToTime(data.waitingtime);
                    }
                    
                    // 대기고객과 대기시간 업데이트
                    this.setState({
                        waitingCustomers: parseInt(data.waiting) || 0,
                        waitingTime: formattedWaitingTime
                    });
                } catch (error) {
                    console.error('SSE 데이터 파싱 오류:', error, event.data);
                }
            });

        } catch (error) {
            console.error('SSE 초기화 오류:', error);
            this.setState({ connectionStatus: 'error' });
        }
    }

    closeSSE = () => {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            console.log('SSE 연결 종료 - DisplayLayer');
        }
    }

    // 초를 HH:MM:SS 형식으로 변환하는 함수
    formatSecondsToTime = (seconds) => {
        if (!seconds || isNaN(seconds)) {
            return '00:00:00';
        }
        
        const totalSeconds = parseInt(seconds, 10);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        return [hours, minutes, secs]
            .map(val => String(val).padStart(2, '0'))
            .join(':');
    }

    render() {
        const { waitingCustomers, waitingTime } = this.state;
        
        return (
            <div className="scrm-header-status-section">
                <div className="status-item">                    
                    <em>대기고객</em> 
                    <span>{String(waitingCustomers).padStart(3, '0')}</span>
                </div>
                <div className="status-item">
                    <em>대기시간</em> 
                    <span>{waitingTime}</span>
                </div>
            </div>
        );
    }
}

export default DisplayLayer;