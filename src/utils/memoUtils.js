/**
 * 메모 알람 관련 공통 유틸리티 함수들
 */

/**
 * 특정 메모의 알람 상태를 확인
 * @param {Object} memo - 메모 객체 
 * @returns {string} 'needConfirm' | 'setAlarm' | 'noAlarm'
 */
export const checkMemoAlarm = (memo) => {
    if (!memo || !memo.memoAlrmYn || !memo.memoAlrmDt) {
        return 'noAlarm';
    }

    const currentTime = new Date();
    
    // 현재 시간을 YYYYMMDDHHMISS 형식으로 변환 (초는 항상 00)
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hour = String(currentTime.getHours()).padStart(2, '0');
    const minute = String(currentTime.getMinutes()).padStart(2, '0');
    const second = '00'; // 초는 항상 00으로 고정
    
    const formattedCurrentTime = `${year}${month}${day}${hour}${minute}${second}`;
    
    // 특정 메모에 대한 알람 상태 반환
    if (formattedCurrentTime >= memo.memoAlrmDt && memo.memoAlrmYn === 'Y') {
        return 'needConfirm';
    } else if (formattedCurrentTime < memo.memoAlrmDt && memo.memoAlrmYn === 'Y') {
        return 'setAlarm';
    } else {
        return 'noAlarm';
    }
};

/**
 * 메모 알람 마크 상태 반환
 * @param {Object} memo - 메모 객체
 * @returns {string} 'needConfirm' | 'setAlarm' | 'noAlarm'
 */
export const memoAlarmMark = (memo) => {
    switch(checkMemoAlarm(memo)){
        case 'needConfirm':
        return 'needConfirm'
        case 'setAlarm':
            return 'setAlarm'
        case 'noAlarm':
            return 'noAlarm';
        default:
            return 'noAlarm';
    }
};

/**
 * 전체 메모 데이터에서 확인이 필요한 알람 개수를 계산
 * @param {Array} folderList - 폴더 배열 (각 폴더는 memos 배열을 가짐)
 * @param {Array} memoList - 일반 메모 배열
 * @returns {number} 확인이 필요한 메모 개수
 */
export const checkAllMemoAlarms = (folderList, memoList) => {
    let needConfirmCount = 0;
    
    // 폴더 내 메모들 체크
    if (Array.isArray(folderList)) {
        folderList.forEach(folder => {
            if (folder.memos && Array.isArray(folder.memos)) {
                folder.memos.forEach(memo => {
                    if (checkMemoAlarm(memo) === 'needConfirm') {
                        needConfirmCount++;
                    }
                });
            }
        });
    }

    // 일반 메모들 체크
    if (Array.isArray(memoList)) {
        memoList.forEach(memo => {
            if (checkMemoAlarm(memo) === 'needConfirm') {
                needConfirmCount++;
            }
        });
    }
    
    return needConfirmCount;
}
