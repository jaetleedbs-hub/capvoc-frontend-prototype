/**
 * Mock Service Manager
 * 
 * 실제 서비스 호출을 시뮬레이션하여 Mock 데이터를 반환하는 관리자
 * 추후 실제 인터페이스 연계 시 최소한의 수정으로 전환 가능하도록 설계
 */

// Mock 데이터 로더
class MockDataLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Mock 데이터 파일을 동적으로 로드
     * @param {string} modulePath - 모듈 경로 (예: 'cns/cns0083/agent-info-list')
     * @returns {Promise<Object>} Mock 데이터
     */
    async loadMockData(modulePath) {
        try {
            // 캐시된 데이터가 있으면 반환
            if (this.cache.has(modulePath)) {
                return this.cache.get(modulePath);
            }

            // 동적 import로 JSON 파일 로드
            const mockData = await import(`./data/${modulePath}.json`);
            
            // 캐시에 저장
            this.cache.set(modulePath, mockData.default);
            
            return mockData.default;
        } catch (error) {
            console.error(`Mock 데이터 로드 실패: ${modulePath}`, error);
            return {
                success: false,
                message: 'Mock 데이터를 찾을 수 없습니다.',
                data: []
            };
        }
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
    }
}

// Mock 서비스 매니저
class MockServiceManager {
    constructor() {
        this.dataLoader = new MockDataLoader();
        this.delayTime = 500; // 기본 지연 시간 (ms)
    }

    /**
     * Mock 서비스 호출 시뮬레이션
     * @param {string} url - API URL (예: '/api/cns/cns0083/r01')
     * @param {Object} requestData - 요청 데이터
     * @param {Function} callback - 콜백 함수
     * @param {Object} options - 옵션 (delay, error 등)
     */
    async post(url, requestData, callback, options = {}) {
        try {
            console.log(`[MockService] 호출: ${url}`, requestData);

            // URL에서 모듈 경로 추출
            const modulePath = this.extractModulePath(url);
            
            // Mock 데이터 로드
            const mockData = await this.dataLoader.loadMockData(modulePath);
            
            // 지연 시간 설정 (로딩 시뮬레이션)
            const delay = options.delay || this.delayTime;
            
            setTimeout(() => {
                // 에러 시뮬레이션 (옵션에 따라)
                if (options.error) {
                    const errorResponse = {
                        success: false,
                        message: options.errorMessage || 'Mock 에러가 발생했습니다.',
                        data: null
                    };
                    callback(errorResponse);
                    return;
                }

                // 검색 조건에 따른 데이터 필터링
                let filteredData = mockData;
                if (url.includes('/api/cns/cns0010/r01') && requestData) {
                    console.log(`[MockService] CNS0010 필터링 적용:`, requestData);
                    filteredData = this.filterCustomerData(mockData, requestData);
                } else if (url.includes('/api/cns/cns0060/r01') && requestData) {
                    console.log(`[MockService] CNS0060 필터링 적용:`, requestData);
                    filteredData = this.filterCustomerBasicInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0070/r01') && requestData) {
                    console.log(`[MockService] CNS0070 필터링 적용:`, requestData);
                    filteredData = this.filterCustomerDetailInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0070/r02') && requestData) {
                    console.log(`[MockService] CNS0070/r02 마케팅정보동의 필터링 적용:`, requestData);
                    filteredData = this.filterMarketingConsentInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0081/r01') && requestData) {
                    console.log(`[MockService] CNS0081 필터링 적용:`, requestData);
                    filteredData = this.filterCustomerCautionInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0090/r01') && requestData) {
                    console.log(`[MockService] CNS0090 거래내역조회 호출:`, requestData);
                    // CNS0090은 특별한 필터링 없이 Mock 데이터 그대로 반환
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0121/r01') && requestData) {
                    console.log(`[MockService] CNS0121 계좌현황조회 호출:`, requestData);
                    // CNS0121은 특별한 필터링 없이 Mock 데이터 그대로 반환
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0100/r01') && requestData) {
                    console.log(`[MockService] CNS0100 통장거래내역조회 호출:`, requestData);
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0110/r01') && requestData) {
                    console.log(`[MockService] CNS0110 출금가능금액조회 호출:`, requestData);
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0120/r01') && requestData) {
                    console.log(`[MockService] CNS0120 고객별카드현황조회 호출:`, requestData);
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0130/r01') && requestData) {
                    console.log(`[MockService] CNS0130 상품이율조회 호출:`, requestData);
                    filteredData = mockData;
                } else if (url.includes('/api/CNS0150/r01') && requestData) {
                    console.log(`[MockService] CNS0150 SMS인증목록조회 호출:`, requestData);
                    filteredData = mockData;
                } else if (url.includes('/api/cns/cns0082/r01') && requestData) {
                    console.log(`[MockService] CNS0082 필터링 적용:`, requestData);
                    filteredData = this.filterAccountInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0082/r02') && requestData) {
                    console.log(`[MockService] CNS0082/r02 필터링 적용:`, requestData);
                    filteredData = this.filterAccountBasicInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0082/r03') && requestData) {
                    console.log(`[MockService] CNS0082/r03 필터링 적용:`, requestData);
                    filteredData = this.filterSpotBalanceInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0082/r04') && requestData) {
                    console.log(`[MockService] CNS0082/r04 필터링 적용:`, requestData);
                    filteredData = this.filterAccountServiceInfo(mockData, requestData);
                } else if (url.includes('/api/cns/cns0083/r01') && requestData) {
                    console.log(`[MockService] CNS0083 필터링 적용:`, requestData);
                    filteredData = this.filterAgentInfo(mockData, requestData);
                }

                // 성공 응답 시뮬레이션
                const response = {
                    ...filteredData,
                    requestUrl: url,
                    requestData: requestData,
                    timestamp: new Date().toISOString()
                };

                console.log(`[MockService] 응답: ${url}`, response);
                callback(response);
            }, delay);

        } catch (error) {
            console.error(`[MockService] 오류: ${url}`, error);
            
            const errorResponse = {
                success: false,
                message: 'Mock 서비스 호출 중 오류가 발생했습니다.',
                data: null,
                error: error.message
            };
            
            callback(errorResponse);
        }
    }

    /**
     * 고객정보 데이터 필터링 (CNS0010)
     * @param {Object} mockData - 원본 Mock 데이터
     * @param {Object} requestData - 요청 데이터 (검색 조건)
     * @returns {Object} 필터링된 데이터
     */
filterCustomerData(mockData, requestData) {
    if (!mockData.success || !mockData.data || !mockData.data.customerInfo) {
        return mockData;
    }

    const { Tp, AcntNo, Rmnno24, CustmNo, CustmHpCode, CustmHpExno, CustmHpSeqno, CustmNm } = requestData;
    let filteredCustomers = [...mockData.data.customerInfo];

    console.log(`[MockService] CNS0010 필터링 조건: Tp=${Tp}, AcntNo=${AcntNo}, Rmnno24=${Rmnno24}, CustmNo=${CustmNo}`);

    // Tp 값에 따른 필터링
    if (Tp === '0' && AcntNo && AcntNo.trim()) {
        // 계좌번호 조회 (Tp: 0)
        console.log(`[MockService] 계좌번호로 필터링: ${AcntNo}`);
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.AcntNo && customer.AcntNo === AcntNo.trim()
        );
    } else if (Tp === '1' && requestData.EmailAddr && requestData.EmailAddr.trim()) {
        // E-Mail 조회 (Tp: 1)
        console.log(`[MockService] E-Mail로 필터링: ${requestData.EmailAddr}`);
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.EmailAddr && customer.EmailAddr.includes(requestData.EmailAddr.trim())
        );
    } else if (Tp === '2' && Rmnno24 && Rmnno24.trim()) {
        // 실명번호 조회 (Tp: 2)
        console.log(`[MockService] 실명번호로 필터링: ${Rmnno24}`);
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.Rmnno24 && customer.Rmnno24 === Rmnno24.trim()
        );
    } else if (Tp === '3') {
        // 고객번호 조회 (Tp: 3) - CustmNo 또는 Rmnno24 둘 중 하나라도 있으면 처리
        if (CustmNo && CustmNo.trim()) {
            console.log(`[MockService] 고객번호로 필터링: ${CustmNo}`);
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.CustmNo && customer.CustmNo === CustmNo.trim()
            );
        } else if (Rmnno24 && Rmnno24.trim()) {
            // CustmNo가 없고 Rmnno24가 있는 경우 (실명번호로 고객번호 조회)
            console.log(`[MockService] 실명번호로 고객번호 필터링: ${Rmnno24}`);
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.Rmnno24 && customer.Rmnno24 === Rmnno24.trim()
            );
        } else {
            console.log(`[MockService] Tp=3이지만 CustmNo와 Rmnno24가 모두 없음`);
            filteredCustomers = []; // 조건이 없으면 빈 결과 반환
        }
    } else if (Tp === '4' && (CustmHpCode || CustmHpExno || CustmHpSeqno)) {
        // 휴대폰전화번호 조회 (Tp: 4)
        const phoneNumber = `${CustmHpCode || ''}${CustmHpExno || ''}${CustmHpSeqno || ''}`;
        console.log(`[MockService] 휴대폰번호로 필터링: ${phoneNumber}`);
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.CustmHpNo && customer.CustmHpNo.replace(/[^0-9]/g, '').includes(phoneNumber)
        );
    } else if (Tp === '7' && CustmNm && CustmNm.trim()) {
        // 고객명 조회 (Tp: 7)
        console.log(`[MockService] 고객명으로 필터링: ${CustmNm}`);
        filteredCustomers = filteredCustomers.filter(customer => 
            customer.CustmNm && customer.CustmNm.includes(CustmNm.trim())
        );
    } else {
        // 필터링 조건이 없거나 잘못된 경우 빈 결과 반환
        console.log(`[MockService] 필터링 조건이 없거나 잘못됨: Tp=${Tp}`);
        console.log(`[MockService] 상세 조건: AcntNo=${AcntNo}, Rmnno24=${Rmnno24}, CustmNo=${CustmNo}`);
        filteredCustomers = []; // ⭐ 중요: 조건이 맞지 않으면 빈 배열 반환
    }

    // 필터링된 결과에 따른 메시지 설정
    let message = mockData.message;
    if (filteredCustomers.length === 0) {
        message = '검색 조건에 맞는 고객정보가 없습니다.';
    } else if (filteredCustomers.length < mockData.data.customerInfo.length) {
        message = `검색 조건에 맞는 고객정보 ${filteredCustomers.length}건이 조회되었습니다.`;
    }

    console.log(`[MockService] 필터링 결과: ${filteredCustomers.length}건`);

    return {
        ...mockData,
        message: message,
        data: {
            ...mockData.data,
            customerInfo: filteredCustomers,
            totalCount: filteredCustomers.length,
            pageInfo: {
                ...mockData.data.pageInfo,
                totalPages: Math.ceil(filteredCustomers.length / (mockData.data.pageInfo?.pageSize || 10))
            }
        }
    };
}

    /**
     * 고객 기본정보 데이터 필터링 (CNS0060)
     * @param {Object} mockData - 원본 Mock 데이터
     * @param {Object} requestData - 요청 데이터 (검색 조건)
     * @returns {Object} 필터링된 데이터
     */
    filterCustomerBasicInfo(mockData, requestData) {
        // console.log(`[MockService] filterCustomerBasicInfo 시작:`, { requestData, originalDataCount: mockData.data?.length || 0 });
        
        if (!mockData.success || !mockData.data) {
            // console.log(`[MockService] filterCustomerBasicInfo - 데이터 없음`);
            return mockData;
        }

        // CNS0060/r01은 고객정보 배열 형태
        let customerData = Array.isArray(mockData.data) ? mockData.data : [mockData.data];
        // console.log(`[MockService] filterCustomerBasicInfo - 초기 데이터 개수:`, customerData.length);
        
        // 모든 필터링 조건을 AND 조건으로 적용
        if (requestData) {
            customerData = customerData.filter(customer => {
                // 계좌번호로 필터링 (정확히 일치)
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!customer.AcntNo || customer.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 고객명으로 필터링 (부분 일치)
                if (requestData.CustmNm && requestData.CustmNm.trim()) {
                    if (!customer.CustmNm || !customer.CustmNm.includes(requestData.CustmNm.trim())) {
                        return false;
                    }
                }

                // 고객번호로 필터링 (정확히 일치)
                if (requestData.CustmNo && requestData.CustmNo.trim()) {
                    if (!customer.CustmNo || customer.CustmNo !== requestData.CustmNo.trim()) {
                        return false;
                    }
                }

                // 생년월일로 필터링 (부분 일치)
                if (requestData.CustmDob && requestData.CustmDob.trim()) {
                    if (!customer.CustmDob || !customer.CustmDob.includes(requestData.CustmDob.trim())) {
                        return false;
                    }
                }

                // 휴대폰번호로 필터링 (부분 일치)
                if (requestData.CustmHpNo && requestData.CustmHpNo.trim()) {
                    if (!customer.CustmHpNo || !customer.CustmHpNo.includes(requestData.CustmHpNo.trim())) {
                        return false;
                    }
                }

                // 이메일로 필터링 (부분 일치)
                if (requestData.EmailAddr && requestData.EmailAddr.trim()) {
                    if (!customer.EmailAddr || !customer.EmailAddr.includes(requestData.EmailAddr.trim())) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        // console.log(`[MockService] filterCustomerBasicInfo - 필터링 후 데이터 개수:`, customerData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (customerData.length === 0) {
            message = '검색 조건에 맞는 고객 기본정보가 없습니다.';
        } else if (customerData.length < (Array.isArray(mockData.data) ? mockData.data.length : 1)) {
            message = `검색 조건에 맞는 고객 기본정보 ${customerData.length}건이 조회되었습니다.`;
        }

        // 필터링된 모든 결과를 배열로 반환 (단일 항목이 아닌 전체 배열)
        const result = {
            ...mockData,
            message: message,
            data: customerData,
            totalCount: customerData.length
        };
        
        // console.log(`[MockService] filterCustomerBasicInfo 완료:`, { 
        //     filteredCount: customerData.length, 
        //     message: message,
        //     sampleData: customerData.length > 0 ? customerData[0] : null
        // });
        
        return result;
    }

    /**
     * 고객 상세정보 필터링 (CNS0070)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터
     * @returns {Object} 필터링된 데이터
     */
    filterCustomerDetailInfo(mockData, requestData) {
        // console.log(`[MockService] filterCustomerDetailInfo 시작 - 요청 데이터:`, requestData);
        // console.log(`[MockService] filterCustomerDetailInfo - 초기 데이터 개수:`, 
            // mockData.data?.customerDetail?.length || 0);

        // customerDetail 배열이 없으면 빈 결과 반환
        if (!mockData.data || !mockData.data.customerDetail || !Array.isArray(mockData.data.customerDetail)) {
            // console.log(`[MockService] filterCustomerDetailInfo - customerDetail 배열이 없음`);
            return {
                ...mockData,
                message: '고객 상세정보 데이터가 없습니다.',
                data: { customerDetail: [] },
                totalCount: 0
            };
        }

        let customerDetailData = mockData.data.customerDetail;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            customerDetailData = customerDetailData.filter(customer => {
                // 고객번호로 필터링 (정확 일치)
                if (requestData.ClntNo && requestData.ClntNo.trim()) {
                    if (!customer.ClntNo || customer.ClntNo !== requestData.ClntNo.trim()) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        // console.log(`[MockService] filterCustomerDetailInfo - 필터링 후 데이터 개수:`, customerDetailData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (customerDetailData.length === 0) {
            message = '검색 조건에 맞는 고객 상세정보가 없습니다.';
        } else if (customerDetailData.length < mockData.data.customerDetail.length) {
            message = `검색 조건에 맞는 고객 상세정보 ${customerDetailData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: { customerDetail: customerDetailData },
            totalCount: customerDetailData.length
        };
        
        // console.log(`[MockService] filterCustomerDetailInfo 완료:`, { 
        //     filteredCount: customerDetailData.length, 
        //     message: message,
        //     sampleData: customerDetailData.length > 0 ? customerDetailData[0] : null
        // });
        
        return result;
    }

    /**
     * 마케팅정보동의 필터링 (CNS0070/r02)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (Rmnno, AcntNo, Pwd 등)
     * @returns {Object} 필터링된 데이터
     */
    filterMarketingConsentInfo(mockData, requestData) {
        // console.log(`[MockService] filterMarketingConsentInfo 시작 - 요청 데이터:`, requestData);
        // console.log(`[MockService] filterMarketingConsentInfo - 초기 데이터 개수:`, 
        //     mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            // console.log(`[MockService] filterMarketingConsentInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '마케팅정보동의 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let marketingConsentData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            marketingConsentData = marketingConsentData.filter(item => {
                // 실명확인번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.Rmnno && requestData.Rmnno.trim()) {
                    if (!item.Rmnno || item.Rmnno !== requestData.Rmnno.trim()) {
                        return false;
                    }
                }

                // 계좌번호로 필터링 (정확 일치) - 우선순위 2
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 처리구분으로 필터링 (정확 일치) - 우선순위 3
                if (requestData.TrxTp && requestData.TrxTp.trim()) {
                    if (!item.TrxTp || item.TrxTp !== requestData.TrxTp.trim()) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        // console.log(`[MockService] filterMarketingConsentInfo - 필터링 후 데이터 개수:`, marketingConsentData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (marketingConsentData.length === 0) {
            message = '검색 조건에 맞는 마케팅정보동의 데이터가 없습니다.';
        } else if (marketingConsentData.length < mockData.data.length) {
            message = `검색 조건에 맞는 마케팅정보동의 데이터 ${marketingConsentData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: marketingConsentData,
            totalCount: marketingConsentData.length
        };
        
        // console.log(`[MockService] filterMarketingConsentInfo 완료:`, { 
        //     filteredCount: marketingConsentData.length, 
        //     message: message,
        //     sampleData: marketingConsentData.length > 0 ? marketingConsentData[0] : null
        // });
        
        return result;
    }

    /**
     * 고객 주의사항 정보 필터링 (CNS0081)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (ClntNo, AcntNo, customerName 등)
     * @returns {Object} 필터링된 데이터
     */
    filterCustomerCautionInfo(mockData, requestData) {
        console.log(`[MockService] filterCustomerCautionInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterCustomerCautionInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterCustomerCautionInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '고객 주의사항 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let customerCautionData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            customerCautionData = customerCautionData.filter(item => {
                // 고객번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.ClntNo && requestData.ClntNo.trim()) {
                    if (!item.ClntNo || item.ClntNo !== requestData.ClntNo.trim()) {
                        return false;
                    }
                }

                // 계좌번호로 필터링 (정확 일치) - 우선순위 2
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 고객명으로 필터링 (부분 일치) - 우선순위 3
                if (requestData.customerName && requestData.customerName.trim()) {
                    if (!item.ClntMemoCntsTrm || !item.ClntMemoCntsTrm.includes(requestData.customerName.trim())) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterCustomerCautionInfo - 필터링 후 데이터 개수:`, customerCautionData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (customerCautionData.length === 0) {
            message = '검색 조건에 맞는 고객 주의사항 데이터가 없습니다.';
        } else if (customerCautionData.length < mockData.data.length) {
            message = `검색 조건에 맞는 고객 주의사항 데이터 ${customerCautionData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: customerCautionData,
            totalCount: customerCautionData.length
        };
        
        console.log(`[MockService] filterCustomerCautionInfo 완료:`, { 
            filteredCount: customerCautionData.length, 
            message: message,
            sampleData: customerCautionData.length > 0 ? customerCautionData[0] : null
        });
        
        return result;
    }

    /**
     * 계좌정보 필터링 (CNS0082)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (ClntCnfNo, AcntNo, customerName 등)
     * @returns {Object} 필터링된 데이터
     */
    filterAccountInfo(mockData, requestData) {
        console.log(`[MockService] filterAccountInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterAccountInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterAccountInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '계좌정보 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let accountInfoData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            accountInfoData = accountInfoData.filter(item => {
                // 고객번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.ClntCnfNo && requestData.ClntCnfNo.trim()) {
                    if (!item.ClntCnfNo || item.ClntCnfNo !== requestData.ClntCnfNo.trim()) {
                        return false;
                    }
                }

                // 계좌번호로 필터링 (정확 일치) - 우선순위 2
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 고객명으로 필터링 (부분 일치) - 우선순위 3
                if (requestData.customerName && requestData.customerName.trim()) {
                    if (!item.ClntMemoCntsTrm || !item.ClntMemoCntsTrm.includes(requestData.customerName.trim())) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterAccountInfo - 필터링 후 데이터 개수:`, accountInfoData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (accountInfoData.length === 0) {
            message = '검색 조건에 맞는 계좌정보가 없습니다.';
        } else if (accountInfoData.length < mockData.data.length) {
            message = `검색 조건에 맞는 계좌정보 ${accountInfoData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: accountInfoData,
            totalCount: accountInfoData.length
        };
        
        console.log(`[MockService] filterAccountInfo 완료:`, { 
            filteredCount: accountInfoData.length, 
            message: message,
            sampleData: accountInfoData.length > 0 ? accountInfoData[0] : null
        });
        
        return result;
    }

    /**
     * 계좌 기본정보 필터링 (CNS0082/r02)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (ClntCnfNo, AcntNo, customerName 등)
     * @returns {Object} 필터링된 데이터
     */
    filterAccountBasicInfo(mockData, requestData) {
        console.log(`[MockService] filterAccountBasicInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterAccountBasicInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterAccountBasicInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '계좌 기본정보 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let accountBasicInfoData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            accountBasicInfoData = accountBasicInfoData.filter(item => {
                // 고객번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.ClntCnfNo && requestData.ClntCnfNo.trim()) {
                    if (!item.ClntNo || item.ClntNo !== requestData.ClntCnfNo.trim()) {
                        return false;
                    }
                }

                // 계좌번호로 필터링 (정확 일치) - 우선순위 2
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.BnkDlgConnAcntNo || item.BnkDlgConnAcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 고객명으로 필터링 (부분 일치) - 우선순위 3
                if (requestData.customerName && requestData.customerName.trim()) {
                    if (!item.AcntNm || !item.AcntNm.includes(requestData.customerName.trim())) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterAccountBasicInfo - 필터링 후 데이터 개수:`, accountBasicInfoData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (accountBasicInfoData.length === 0) {
            message = '검색 조건에 맞는 계좌 기본정보가 없습니다.';
        } else if (accountBasicInfoData.length < mockData.data.length) {
            message = `검색 조건에 맞는 계좌 기본정보 ${accountBasicInfoData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: accountBasicInfoData,
            totalCount: accountBasicInfoData.length
        };
        
        console.log(`[MockService] filterAccountBasicInfo 완료:`, { 
            filteredCount: accountBasicInfoData.length, 
            message: message,
            sampleData: accountBasicInfoData.length > 0 ? accountBasicInfoData[0] : null
        });
        
        return result;
    }

    /**
     * 신현물체결잔고조회 필터링 (CNS0082/r03)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (AcntNo 등)
     * @returns {Object} 필터링된 데이터
     */
    filterSpotBalanceInfo(mockData, requestData) {
        console.log(`[MockService] filterSpotBalanceInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterSpotBalanceInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterSpotBalanceInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '신현물체결잔고조회 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let spotBalanceData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            spotBalanceData = spotBalanceData.filter(item => {
                // 계좌번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterSpotBalanceInfo - 필터링 후 데이터 개수:`, spotBalanceData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (spotBalanceData.length === 0) {
            message = '검색 조건에 맞는 신현물체결잔고조회 데이터가 없습니다.';
        } else if (spotBalanceData.length < mockData.data.length) {
            message = `검색 조건에 맞는 신현물체결잔고조회 데이터 ${spotBalanceData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: spotBalanceData,
            totalCount: spotBalanceData.length
        };
        
        console.log(`[MockService] filterSpotBalanceInfo 완료:`, { 
            filteredCount: spotBalanceData.length, 
            message: message,
            sampleData: spotBalanceData.length > 0 ? spotBalanceData[0] : null
        });
        
        return result;
    }

    /**
     * 계좌 서비스 정보 필터링 (CNS0082/r04)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (AcntNo 등)
     * @returns {Object} 필터링된 데이터
     */
    filterAccountServiceInfo(mockData, requestData) {
        console.log(`[MockService] filterAccountServiceInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterAccountServiceInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterAccountServiceInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '계좌 서비스 정보 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let accountServiceInfoData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            accountServiceInfoData = accountServiceInfoData.filter(item => {
                // 계좌번호로 필터링 (정확 일치) - 우선순위 1
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterAccountServiceInfo - 필터링 후 데이터 개수:`, accountServiceInfoData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (accountServiceInfoData.length === 0) {
            message = '검색 조건에 맞는 계좌 서비스 정보가 없습니다.';
        } else if (accountServiceInfoData.length < mockData.data.length) {
            message = `검색 조건에 맞는 계좌 서비스 정보 ${accountServiceInfoData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: accountServiceInfoData,
            totalCount: accountServiceInfoData.length
        };
        
        console.log(`[MockService] filterAccountServiceInfo 완료:`, { 
            filteredCount: accountServiceInfoData.length, 
            message: message,
            sampleData: accountServiceInfoData.length > 0 ? accountServiceInfoData[0] : null
        });
        
        return result;
    }

    /**
     * 대리인 정보 필터링 (CNS0083)
     * @param {Object} mockData - Mock 데이터
     * @param {Object} requestData - 요청 데이터 (AcntTp, AcntNo, Pwd)
     * @returns {Object} 필터링된 데이터
     */
    filterAgentInfo(mockData, requestData) {
        console.log(`[MockService] filterAgentInfo 시작 - 요청 데이터:`, requestData);
        console.log(`[MockService] filterAgentInfo - 초기 데이터 개수:`, 
            mockData.data?.length || 0);

        // data 배열이 없으면 빈 결과 반환
        if (!mockData.data || !Array.isArray(mockData.data)) {
            console.log(`[MockService] filterAgentInfo - data 배열이 없음`);
            return {
                ...mockData,
                message: '대리인 정보 데이터가 없습니다.',
                data: [],
                totalCount: 0
            };
        }

        let agentInfoData = mockData.data;

        // 요청 데이터가 있으면 필터링 적용
        if (requestData && Object.keys(requestData).length > 0) {
            agentInfoData = agentInfoData.filter(item => {
                // 계좌구분으로 필터링 (정확 일치) - 우선순위 1
                if (requestData.AcntTp && requestData.AcntTp.trim()) {
                    if (!item.AcntTp || item.AcntTp !== requestData.AcntTp.trim()) {
                        return false;
                    }
                }

                // 계좌번호로 필터링 (정확 일치) - 우선순위 2
                if (requestData.AcntNo && requestData.AcntNo.trim()) {
                    if (!item.AcntNo || item.AcntNo !== requestData.AcntNo.trim()) {
                        return false;
                    }
                }

                // 비밀번호로 필터링 (정확 일치) - 우선순위 3
                if (requestData.Pwd && requestData.Pwd.trim()) {
                    if (!item.Pwd || item.Pwd !== requestData.Pwd.trim()) {
                        return false;
                    }
                }

                // 모든 조건을 만족하면 true 반환
                return true;
            });
        }

        console.log(`[MockService] filterAgentInfo - 필터링 후 데이터 개수:`, agentInfoData.length);
        
        // 필터링된 결과에 따른 메시지 설정
        let message = mockData.message;
        if (agentInfoData.length === 0) {
            message = '검색 조건에 맞는 대리인 정보가 없습니다.';
        } else if (agentInfoData.length < mockData.data.length) {
            message = `검색 조건에 맞는 대리인 정보 ${agentInfoData.length}건이 조회되었습니다.`;
        }

        // 필터링된 결과를 반환
        const result = {
            ...mockData,
            message: message,
            data: agentInfoData,
            totalCount: agentInfoData.length
        };
        
        console.log(`[MockService] filterAgentInfo 완료:`, { 
            filteredCount: agentInfoData.length, 
            message: message,
            sampleData: agentInfoData.length > 0 ? agentInfoData[0] : null
        });
        
        return result;
    }

    /**
     * URL에서 모듈 경로 추출
     * @param {string} url - API URL
     * @returns {string} 모듈 경로
     */
    extractModulePath(url) {
        // '/api/cns/cns0060/r01' -> 'cns/cns0060/r01'
        const urlParts = url.split('/');
        
        if (urlParts.length >= 5) {
            const module = urlParts[2]; // 'cns'
            const screen = urlParts[3]; // 'cns0060'
            const action = urlParts[4]; // 'r01'
            
            // CNS JG 폴더 매핑: 특정 CNS API들을 jg 폴더로 라우팅
            const cnsJgScreens = [
                'CNS0090', 'CNS0100', 'CNS0110', 'CNS0120', 'CNS0121', 'CNS0130', 'CNS0150',
                'cns0090', 'cns0100', 'cns0110', 'cns0120', 'cns0121', 'cns0130', 'cns0150'
            ];
            
            if (module === 'cns' && cnsJgScreens.includes(screen.toUpperCase())) {
                // /api/cns/cns0121/r01 -> cns/jg/CNS0121_r01
                return `cns/jg/${screen.toUpperCase()}_${action}`;
            }
            
            // 기본 URL 패턴: /api/cns/cns0060/r01 -> cns/cns0060/r01
            return `${module}/${screen}/${action}`;
        }
        
        return 'default/default';
    }

    /**
     * 지연 시간 설정
     * @param {number} delay - 지연 시간 (ms)
     */
    setDelay(delay) {
        this.delayTime = delay;
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.dataLoader.clearCache();
    }
}

// 싱글톤 인스턴스 생성
const mockServiceManager = new MockServiceManager();

export default mockServiceManager; 