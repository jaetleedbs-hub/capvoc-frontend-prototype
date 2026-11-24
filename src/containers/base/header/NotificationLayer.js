import React from 'react';
import './NotificationLayer.css';
import axios from 'axios';
import { ComLib , TransManager} from 'common';
import { memoAlarmMark, checkMemoAlarm } from 'utils/memoUtils';
import { connect } from 'react-redux';
import { APP_GREETING } from 'constants/brand';
import { bindActionCreators } from 'redux';
import * as appModuleActions from 'store/modules/appModule';

// Constants for sessionStorage
const HIDDEN_NOTICES_KEY = 'scrm_hidden_notices';

const FALLBACK_MESSAGE = {
    id: 'fallback',
    message: APP_GREETING,
    type: 'normal'
};

class NotificationLayer extends React.Component {
    constructor(props) {
        super(props);

        this.cycleTimeout = null;
        this.animationTimeout = null;
        this.snoozeTimers = {};
        this.textWrapperRef = React.createRef();
        this.textRef = React.createRef();

        // 사용자 요약 폴링 인터벌
        this.summaryInterval = null;
        this.pollingInterval = 60 * 1000; // 60초 간격으로 조정 (부하 감소)

        const notices = this.props.notices && this.props.notices.length > 0 ? this.props.notices : [];
        const hiddenIds = JSON.parse(sessionStorage.getItem(HIDDEN_NOTICES_KEY) || '[]');
        
        this.state = {
            allNotices: notices,
            displayQueue: this.createDisplayQueue(notices),
            hiddenIds: hiddenIds,
            snoozedIds: {},
            currentIndex: -1,
            currentNotice: null,
            animationState: 'fade-in',
            isScrolling: false,
        };
    }

    componentDidMount() {
        this.startPolling(); // 정기폴링 시작
        this.runNextCycle(true); // 공지사항 사이클 시작
        
        window.addEventListener('refreshNotification', this.handleRefreshNotification);
    }

    componentWillUnmount() {
        this.stopPolling(); // 폴링 정리
        window.removeEventListener('refreshNotification', this.handleRefreshNotification);
        
        // 기존 타이머들도 정리
        if (this.cycleTimeout) clearTimeout(this.cycleTimeout);
        if (this.animationTimeout) clearTimeout(this.animationTimeout);
        Object.values(this.snoozeTimers).forEach(clearTimeout);
    }

    handleRefreshNotification = () => {
        this.poll();
    };

    /**
     * 사용자 요약 폴링 시작.
     *
     * <p>종전에는 이 안이 <통째로 주석>이었다. 즉시호출·setInterval·setTransUrl 셋 다
     * 꺼져 있어서 폴링이 <한 번도 돌지 않았다>(실측: 로그인 후 관찰된 /api 요청에
     * /api/common/polling/* 이 0건). 리듀서와 디스패치 코드는 멀쩡히 있었으므로
     * "액션을 보내는 코드가 없다"가 아니라 "그 코드에 도달하지 못한다"가 정확한 진단이다.
     */
    startPolling = () => {
        this.poll();
        this.summaryInterval = setInterval(this.poll, this.pollingInterval);
    }

    /** 배지(건수)와 띠(목록)를 한 주기에 함께 갱신한다. */
    poll = () => {
        this.fetchUserSummary();
        this.fetchNotices();
    }

    /**
     * 폴링 정지
     */
    stopPolling = () => {
        if (this.summaryInterval) {
            clearInterval(this.summaryInterval);
            this.summaryInterval = null;
        }
    }

    /**
     * 사용자 요약 조회 — 알림 배지의 유일한 공급원.
     *
     * <p>`/unified` 가 아니라 `/user-summary` 를 쓴다. `/unified` 는 같은 요약에
     * <세션 검증·최종접속시각 갱신>이 붙어 있어(중복로그인 감지 475 포함) 배지 하나를
     * 위해 60초마다 쓰기와 로그아웃 판정을 유발한다. `/user-summary` 는 순수 조회다.
     */
    fetchUserSummary = () => {
        // 쿠키 기반 인증으로 변경 - 사용자 정보 존재 여부로 인증 상태 확인
        if(!ComLib.isAuthenticated()){
            return;
        }

        if( ComLib.getSession("token") === "true"){
            return;
        }

        let that = this;

        let transManager = new TransManager();
        transManager.setTransId('user-summary-polling');
        transManager.setTransUrl('/api/common/polling/user-summary');
        transManager.constants.noProgressbar = true;
        transManager.constants.noErrorDialog = true;
        transManager.timeout = 15 * 1000; // 15초 타임아웃
        transManager.httpMethod = 'get';
        transManager.errorCallback = (err, resData) => {
            if(err.response && err.response.data && err.response.data.status === 471){
                // 이미 거부한 세션이면 다시 묻지 않는다 — 만료 안내는 commonCallback 이 한다.
                if (ComLib.isTokenRenewDeclined()) {
                    return false;
                }
                ComLib.openConfirmDialog('장기 미사용 중 입니다. 곧 세션이 종료됩니다. 토큰을 갱신하시겠습니까?', function(confirmed){
                    if (confirmed) {
                        // 계속 쓰겠다는 뜻이므로 거부 표시를 걷는다(전에 거부했더라도).
                        ComLib.allowTokenRenew();
                        (new TransManager().createUpdateToken())();
                    } else {
                        // [A안 2026-09-03] 거부하면 <이 세션은 더 이상 자동 갱신하지 않는다>.
                        //  종전에는 아무것도 하지 않아, 다음 화면 호출이 조용히 연장해 버렸다.
                        ComLib.declineTokenRenew();
                    }
                });
            }
            return false;
        };
        transManager.setCallBack((res) => {
            if(res.result === 'success'){
                that.handleUserSummaryResponse(res.data);
            }
            // 실패는 다음 정기폴링에서 자동 재시도
        });
        transManager.agentAsync();
    }

    /**
     * 공지 목록 조회 — 흐르는 띠의 공급원.
     *
     * <p>종전에는 이 폴링도 통째로 주석이었고, 살아 있었더라도 서버가 <빈 배열>을 줬다
     * (KMS 스텁). 그래서 띠에는 언제나 폴백 문구만 돌았다.
     * 지금은 서버가 ChatCall 자기 공지를 미확인 먼저 실어 준다.
     */
    fetchNotices = () => {
        if(!ComLib.isAuthenticated()){
            return;
        }

        if( ComLib.getSession("token") === "true"){
            return;
        }

        let that = this;

        let transManager = new TransManager();
        transManager.setTransId('notice-polling');
        transManager.setTransUrl('/api/common/polling/notification');
        transManager.constants.noProgressbar = true;
        transManager.constants.noErrorDialog = true;
        transManager.timeout = 15 * 1000;
        transManager.httpMethod = 'get';
        transManager.errorCallback = () => false;
        transManager.setCallBack((res) => {
            if(res.result === 'success' && res.data){
                that.setState({ displayQueue: that.createDisplayQueue(res.data.notices) });
            }
        });
        transManager.agentAsync();
    }

    /**
     * 사용자 요약 응답 처리.
     *
     * <p>서버 계약은 `UserSummaryDto` 다 — 지금은 `{ noticesCount, reservationMemosCount }`
     * 둘뿐이다(죽은 상담 계열 5개는 응답에서 걷어냈다). 종전 코드는 단수 `noticeCount` 가
     * <있을 때만> 복수 `noticesCount` 를 읽어 어느 쪽이든 값이 반영되지 않았다.
     *
     * <p>값이 0 이어도 <반드시> 보낸다. 읽음 처리 뒤 배지가 줄어드는 것까지가 배선이다 —
     * 여기에 `if(count)` 를 두면 늘어나기만 하고 줄지 않는다.
     */
    handleUserSummaryResponse = (data) => {
        if(!data) return;

        const { appModuleActions } = this.props;

        appModuleActions.unreadNoticesCountUpdate(data.noticesCount);
        appModuleActions.notificationUpdate({
            reservationMemosCount: data.reservationMemosCount,
        });
    }

    createDisplayQueue = (notices) => {
        if( !notices || notices.length === 0) {
            return [];
        }

        const urgent = notices.filter(n => n.type === 'urgent');
        const normal = notices.filter(n => n.type === 'normal');
        const event = notices.filter(n => n.type === 'event');
        
        const queue = [];
        while (urgent.length || normal.length || event.length) {
            if (urgent.length) queue.push(urgent.shift());
            if (normal.length) queue.push(normal.shift());
            if (urgent.length) queue.push(urgent.shift());
            if (event.length) queue.push(event.shift());
        }
        return queue;
    }




    scheduleNextCycle = (delay) => {
        if (this.cycleTimeout) clearTimeout(this.cycleTimeout);
        this.cycleTimeout = setTimeout(() => this.runNextCycle(false), delay);
    }

    checkIfScrollingNeeded = () => {
        setTimeout(() => {
            const textEl = this.textRef.current;
            const wrapperEl = this.textWrapperRef.current;
            let isOverflowing = false;
            if (textEl && wrapperEl) {
                isOverflowing = textEl.scrollWidth > wrapperEl.clientWidth;
            }
            
            if (isOverflowing !== this.state.isScrolling) {
                this.setState({ isScrolling: isOverflowing });
            }

            const nextDelay = isOverflowing ? 15000 + 300 : 8000;
            this.scheduleNextCycle(nextDelay);
        }, 0);
    }

    runNextCycle = (isInitialRun = false) => {
        if (this.cycleTimeout) clearTimeout(this.cycleTimeout);

        if (!isInitialRun) {
            this.setState({ animationState: 'fade-out' });
        }
        
        this.animationTimeout = setTimeout(() => {
            const { displayQueue, hiddenIds, snoozedIds } = this.state;
            let nextIndex = this.state.currentIndex;
            let nextNotice = null;

            if (displayQueue.length > 0) {
                for (let i = 0; i < displayQueue.length; i++) {
                    nextIndex = (nextIndex + 1) % displayQueue.length;
                    const potentialNotice = displayQueue[nextIndex];
                    if (!hiddenIds.includes(potentialNotice.id) && !snoozedIds[potentialNotice.id]) {
                        nextNotice = potentialNotice;
                        break;
                    }
                }
            }

            this.setState({
                currentIndex: nextIndex,
                currentNotice: nextNotice || FALLBACK_MESSAGE,
                animationState: 'fade-in',
                isScrolling: false
            }, this.checkIfScrollingNeeded);

        }, isInitialRun ? 0 : 500);
    }
    
    handleHideNotice = (e, noticeId) => {
        e.stopPropagation();
        if (window.confirm('이 공지를 더 이상 표시하지 않으시겠습니까?')) {
            this.setState(prevState => {
                const newHiddenIds = [...prevState.hiddenIds, noticeId];
                ComLib.setSession(HIDDEN_NOTICES_KEY, newHiddenIds);
                // sessionStorage.setItem(HIDDEN_NOTICES_KEY, JSON.stringify(newHiddenIds));
                return { hiddenIds: newHiddenIds };
            }, this.runNextCycle);
        }
    }

    handleSnoozeNotice = (e, noticeId) => {
        e.stopPropagation();
        this.setState(prevState => ({
            snoozedIds: { ...prevState.snoozedIds, [noticeId]: true }
        }), this.runNextCycle);

        if (this.snoozeTimers[noticeId]) clearTimeout(this.snoozeTimers[noticeId]);
        
        this.snoozeTimers[noticeId] = setTimeout(() => {
            this.setState(prevState => {
                const newSnoozed = { ...prevState.snoozedIds };
                delete newSnoozed[noticeId];
                return { snoozedIds: newSnoozed };
            });
            delete this.snoozeTimers[noticeId];
        }, 3 * 60 * 1000);
    }

    handleReset = () => {
        this.setState({ currentIndex: -1 }, this.runNextCycle);
    }

    handleClearSnooze = () => {
        Object.values(this.snoozeTimers).forEach(clearTimeout);
        this.snoozeTimers = {};
        this.setState({ snoozedIds: {} }, this.runNextCycle);
    }

    // [2026-08-20] handleNoticeClick 을 지웠다.
    //  남아 있던 분기는 둘 — 메리츠 전용 URL 직접호출(envCorp==='M', ChatCall 에서는 死)과
    //  "공지사항 조회 데이터가 없습니다" 알림뿐이었다. 띠에 실제 공지가 흐르게 된 지금
    //  그 알림은 <있는 것을 없다고 말하는> 막다른 길이 된다. 띠는 표시 전용으로 둔다.

    memoAlarmMark = (memo) => {
        return memoAlarmMark(memo);
    }

    checkMemoAlarm = (memo) => {
        return checkMemoAlarm(memo);
    }

    render() {
        const { displayQueue, currentNotice, animationState, isScrolling, hiddenIds, snoozedIds } = this.state;

        if (!currentNotice) {
            return <div className="scrm-notification-layer"></div>;
        }

        const totalVisibleCount = displayQueue.filter(n => !hiddenIds.includes(n.id)).length;
        const snoozedCount = Object.keys(snoozedIds).length;
        
        const textClasses = `scrm-notification-text ${currentNotice.type} ${isScrolling ? 'scrolling' : ''}`;

        return (
            <div className="scrm-notification-layer">
                <div className="scrm-notification-message-wrapper">
                    <div className={`scrm-notification-message ${animationState}`}>
                        {currentNotice.id !== 'fallback' && (
                            <span className="scrm-notification-actions">
                                <i className="xi-close-circle-o" title="더 이상 보지 않기" onClick={(e) => this.handleHideNotice(e, currentNotice.id)}></i>
                                <i className="xi-pause-circle-o" title="잠시 보지 않기" onClick={(e) => this.handleSnoozeNotice(e, currentNotice.id)}></i>
                            </span>
                        )}
                        <div 
                            className="scrm-notification-text-wrapper"
                            ref={this.textWrapperRef}
                        >
                            <span className={textClasses} ref={this.textRef}>
                                {currentNotice.message}
                            </span>
                        </div>
                    </div>
                </div>
                {displayQueue.length > 0 && (
                    <div className="scrm-notification-counter">
                        (
                        <span className="current-index" title="'잠시 보지 않기' 모두 해제" onClick={this.handleClearSnooze}> {snoozedCount} </span>
                        /
                        <span className="total-count" title="처음부터 다시 보기" onClick={this.handleReset}> {totalVisibleCount} </span>
                        )
                    </div>
                )}
            </div>
        );
    }
}

export default connect(
    (state) => ({
        // state에서 필요한 데이터가 있다면 여기에 추가
    }),
    (dispatch) => ({
        appModuleActions: bindActionCreators(appModuleActions, dispatch)
    })
)(NotificationLayer);