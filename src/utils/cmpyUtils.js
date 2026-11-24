import { ComLib, TransManager } from '../common';

export const CmpyUtils =  {

    /**
     * 회원사별 코드목록 조회
     * @param {string} cmpyTypeCd 회원사 유형
     * @param {string} cdGroup 코드그룹
     * @param {function} callback 콜백 함수
     */
	getCmpyCdList: (cmpyTypeCd, cdGroup, callback) => {

        let result = [];
		if (!cmpyTypeCd || !cdGroup) {
			return;
		}

		TransManager.get('/api/common-component/company-code-list', {
			cmpyTypeCd: cmpyTypeCd,
			cdGroup: cdGroup
		}, (res) => {
			if (ComLib.handleResponse(res, 'search')) {
                result = res.data || [];
				if (typeof callback === 'function') {
					callback(result);
				}
			}
		});
	},
}