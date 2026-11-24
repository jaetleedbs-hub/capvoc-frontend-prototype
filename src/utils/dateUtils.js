/**
 * 날짜 유틸리티 함수들
 * NEXSIS 프로젝트용 날짜 형식 변환 및 유효성 검사
 */

/**
 * YYYYmmDD → YYYY-MM-DD 형식으로 변환 (화면 표시용)
 * @param {string} dateStr - YYYYmmDD 형식의 날짜 문자열
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateToDisplay = (dateStr) => {
	if (!dateStr || dateStr.length !== 8) {
		return '';
	}
	
	const year = dateStr.substring(0, 4);
	const month = dateStr.substring(4, 6);
	const day = dateStr.substring(6, 8);
	
	return `${year}-${month}-${day}`;
};

/**
 * YYYY-MM-DD → YYYYmmDD 형식으로 변환 (저장용)
 * @param {string} dateStr - YYYY-MM-DD 형식의 날짜 문자열
 * @returns {string} YYYYmmDD 형식의 날짜 문자열
 */
export const formatDateToStorage = (dateStr) => {
	if (!dateStr) {
		return '';
	}
	
	// 하이픈 제거
	return dateStr.replace(/-/g, '');
};

/**
 * 현재 날짜를 YYYYmmDD 형식으로 반환
 * @returns {string} YYYYmmDD 형식의 현재 날짜
 */
export const getCurrentDateString = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	
	return `${year}${month}${day}`;
};

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns {string} YYYY-MM-DD 형식의 현재 날짜
 */
export const getCurrentDateDisplay = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	
	return `${year}-${month}-${day}`;
};

/**
 * 날짜 문자열 유효성 검사
 * @param {string} dateStr - 검사할 날짜 문자열
 * @param {string} format - 날짜 형식 ('YYYYMMDD' 또는 'YYYY-MM-DD')
 * @returns {boolean} 유효한 날짜인지 여부
 */
export const isValidDate = (dateStr, format = 'YYYY-MM-DD') => {
	if (!dateStr) return false;
	
	let year, month, day;
	
	if (format === 'YYYYMMDD') {
		if (dateStr.length !== 8) return false;
		year = parseInt(dateStr.substring(0, 4));
		month = parseInt(dateStr.substring(4, 6));
		day = parseInt(dateStr.substring(6, 8));
	} else {
		const parts = dateStr.split('-');
		if (parts.length !== 3) return false;
		year = parseInt(parts[0]);
		month = parseInt(parts[1]);
		day = parseInt(parts[2]);
	}
	
	const date = new Date(year, month - 1, day);
	return date.getFullYear() === year && 
		   date.getMonth() === month - 1 && 
		   date.getDate() === day;
};

/**
 * Date 객체를 YYYY-MM-DD HH:mm:ss 형식으로 변환
 * @param {Date} date - Date 객체
 * @returns {string} YYYY-MM-DD HH:mm:ss 형식의 날짜 문자열
 */
export const formatDateTimeToDisplay = (date) => {
	if (!date || !(date instanceof Date)) {
		return '';
	}
	
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 날짜 비교 (첫 번째 날짜가 두 번째 날짜보다 나중인지 확인)
 * @param {string} date1 - 첫 번째 날짜 (YYYY-MM-DD)
 * @param {string} date2 - 두 번째 날짜 (YYYY-MM-DD)
 * @returns {boolean} date1이 date2보다 나중인지 여부
 */
export const isDateAfter = (date1, date2) => {
	if (!date1 || !date2) return false;
	
	const d1 = new Date(date1);
	const d2 = new Date(date2);
	
	return d1 > d2;
};

/**
 * 날짜 차이 계산 (일 단위)
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {number} 날짜 차이 (일 단위)
 */
export const getDateDifference = (startDate, endDate) => {
	if (!startDate || !endDate) return 0;
	
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = Math.abs(end - start);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	
	return diffDays;
};

/**
 * 날짜에 일수 추가
 * @param {string} dateStr - 기준 날짜 (YYYY-MM-DD)
 * @param {number} days - 추가할 일수
 * @returns {string} 계산된 날짜 (YYYY-MM-DD)
 */
export const addDays = (dateStr, days) => {
	if (!dateStr) return '';
	
	const date = new Date(dateStr);
	date.setDate(date.getDate() + days);
	
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	
	return `${year}-${month}-${day}`;
};
