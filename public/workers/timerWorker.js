/**
 * 타이머 Web Worker
 * 
 * @description
 * 소프트폰 타이머 기능을 담당하는 Web Worker입니다.
 * MM:SS 형식으로 시작하여 1시간 이상 시 HH:MM:SS 형식으로 동적 변경됩니다.
 */

let timerInterval = null;
let startTime = null;
let isRunning = false;

// Worker 메시지 처리
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'START':
            startTimer(data.startTime);
            break;
            
        case 'STOP':
            stopTimer();
            break;
            
        case 'RESET':
            resetTimer();
            break;
            
        case 'PAUSE':
            pauseTimer();
            break;
            
        case 'RESUME':
            resumeTimer();
            break;
            
        default:
            console.log('Timer Worker: 알 수 없는 메시지 타입:', type);
    }
};

/**
 * 타이머 시작
 * @param {number} customStartTime - 시작 시간 (timestamp 또는 0)
 */
function startTimer(customStartTime = null) {
    // 기존 타이머가 실행 중이면 정지
    if (isRunning) {
        stopTimer();
    }
    
    // startTime이 0이면 현재 시간부터 시작, 아니면 전달받은 시간부터 시작
    if (customStartTime === 0) {
        startTime = Date.now();
        console.log('Timer Worker: 타이머 0부터 시작됨');
    } else {
        startTime = customStartTime || Date.now();
        console.log('Timer Worker: 타이머 시작됨 (startTime:', startTime, ')');
    }
    
    isRunning = true;
    
    // 1초마다 타이머 업데이트
    timerInterval = setInterval(() => {
        if (isRunning) {
            const elapsedTime = Date.now() - startTime;
            const formattedTime = formatTime(elapsedTime);
            
            // 메인 스레드에 시간 업데이트 전송
            self.postMessage({
                type: 'TIMER_UPDATE',
                data: {
                    formattedTime,
                    elapsedTime,
                    startTime
                }
            });
        }
    }, 1000);
}

/**
 * 타이머 정지
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    startTime = null;
    
    console.log('Timer Worker: 타이머 정지됨');
}

/**
 * 타이머 리셋
 */
function resetTimer() {
    stopTimer();
    
    // 메인 스레드에 리셋 알림 전송
    self.postMessage({
        type: 'TIMER_RESET',
        data: {
            formattedTime: '00:00',
            elapsedTime: 0
        }
    });
    
    console.log('Timer Worker: 타이머 리셋됨');
}

/**
 * 타이머 일시정지
 */
function pauseTimer() {
    isRunning = false;
    console.log('Timer Worker: 타이머 일시정지됨');
}

/**
 * 타이머 재개
 */
function resumeTimer() {
    if (!startTime) {
        console.log('Timer Worker: 시작 시간이 없어 재개할 수 없습니다.');
        return;
    }
    
    isRunning = true;
    console.log('Timer Worker: 타이머 재개됨');
}

/**
 * 시간을 동적 포맷으로 변환
 * @param {number} milliseconds - 밀리초
 * @returns {string} 포맷팅된 시간 문자열 (MM:SS 또는 HH:MM:SS)
 */
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // 1시간(3600초) 이상인 경우 HH:MM:SS 형식, 그렇지 않으면 MM:SS 형식
    if (hours > 0) {
        // HH:MM:SS 형식
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
        // MM:SS 형식
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        return `${formattedMinutes}:${formattedSeconds}`;
    }
}

console.log('Timer Worker: 초기화 완료'); 