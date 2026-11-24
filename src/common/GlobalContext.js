// src/common/GlobalContext.js
import React, { createContext, Component } from 'react';

// Context 생성
const GlobalContext = createContext();

// 싱글톤 GlobalContext 클래스
class GlobalContextSingleton {
  constructor() {
    if (GlobalContextSingleton.instance) {
      console.log('🔄 GlobalContext: 기존 싱글톤 인스턴스 반환');
      return GlobalContextSingleton.instance;
    }
    
    console.log('🌍 GlobalContext: 새로운 싱글톤 인스턴스 생성');
    
    // 초기 상태 설정
    this.state = {
      // ========== 마스킹 정보 ==========
      gMaskingData: {
        single: false,
        multiple: true
      },

      // ========== 고객 정보 ==========
      gCustomerData: {
        // 고객기본정보
        basicInfo: {
          CustmNo: '', // 고객번호
          PsnlCorpCode: '', // 개인/법인 구분 코드
          CustmNm: '', // 고객명
          CustmStatCode: '', // 고객상태 코드
          CustmStatCodeNm: '', // 고객상태 코드명
          AcntNo: '', // 계좌번호
          CustmDob: '', // 생년월일
          Age: '', // 나이
          SexCodeNm: '', // 성별 코드명
          CustmHpNo: '', // 고객휴대전화번호
          CustmHomeTelNo: '', // 고객자택전화번호
          CustmWkplcTelNo: '', // 고객회사전화번호
          EmailAddr: '', // 고객이메일주소
          CustmAddr: '', // 고객주소
          ScrDivTpCode: '', // 화면구분 코드
          Rmnno24: '' // 실명확인번호
        },
        // 계좌정보
        accountInfo: [
          {
            actNo: '',
          }
        ],
        // 인증 계좌정보
        accountInfoCert: [
          // {
          //   actNo: '', // 계좌번호
          //   pwd: '' // 비밀번호
          // }
        ],
      },

      // ========== CTI 정보 ==========
      gCtiData: {
        ctiServerIpA: '', // CTI 서버 IP A
        ctiServerIpB: '', // CTI 서버 IP B
        ctiPortA: '', // CTI 포트 A
        ctiPortB: '', // CTI 포트 B
        ctiSsl: '', // CTI SSL
        ctiEnabled: '', // CTI 활성화
        ctiPrefix: '', // CTI 접두사
        ctiSseServer: '', // CTI SSE 서버
        ctiCallerId: '', // CTI 대표발신번호
      },

      // ========== (TODO)IVR 고객 입력 정보 ========== (TODO 추후 필요시 추가)
      gIvrData: {
        actNo: '', // 계좌번호
        actPw: '', // 비밀번호
        rmnno: '', // 실명확인번호
      },

      // ========== 통화 정보 ==========
      gCallData: {
        callId: '', // 통화ID
        ani: '', // 연결전화번호
        dnis: '', // 전화번호
        callTryDt: '', //  (삭제예정) 통화 시도 시간 (삭제예정)
        callBgngDt: '', //  (삭제예정) 통화 시작 시간
        callEndDt: '', //  (삭제예정) 통화 종료 시간
        arsSrvcPath: '', // (삭제예정) ARS 서비스 경로
        dsptchTelNo: '', // 발신번화번호
        cti_contact_id: '', // 통화 ID
        variables: {
          callVariable1: '',
          callVariable2: '',
          callVariable3: '',
          callVariable4: '',
          callVariable5: '',
          callVariable6: '',
          callVariable7: '',
          callVariable8: '',
          callVariable9: '',
          callVariable10: '',
        },
        telNumber: '', // 전화번호 (상담AP에서 셋팅)
      },

      // ========== 상담 정보 ==========
      gCnslData: {
        dscsnSid: '', // 상담 ID
        rsvtSid: '', // 통화예약 시퀀스ID
        callbakSid: '', // 콜백 시퀀스ID
        cmpId: '', // 캠페인 ID
        cmpSn: '', // 캠페인 일련번호
        callId: '', // 통화ID
        telNo: '', // 전화번호
        repTelNo: '', // 대표발신번호
        IO: '', // (미정) 인아웃구분 (I/O)
        isSaveCnsl: true, // 상담정보 저장 여부
        arrCtiContactId: [], // 통화 ID 리스트
        frstCtiContactId: '', // 최초 통화 ID
        holdCtiContactId: '', // 보류 통화 ID
        callTryDt: '', // 통화시도일시
        callBgngDt: '', // 통화시작일시
        callEndDt: '', // 통화종료일시
        arsSrvcPath: '', // ARS 서비스경로
        dscsnStopRsnCd: '', // 상담중지사유코드
        actNo: '', // 계좌번호
        actIndex: '', // 계좌일련번호
        actPwd: '', // 계좌비밀번호
        pwdYn: '',// 비밀번호 IVR 취득여부
        cmpNm: '', // 캠페인명
        isBusy: false, // 상담정보 저장 여부
        certActNo: '', // 인증계좌번호
        certActNm: '', // 인증계좌명
        calswtUserId: '',// calswt_user_id 호전환 사용자 ID
        thprtUserId: '',// thprt_user_id 3자 사용자 ID
        calswtCallId: '', // 호전환 통화 ID
        thprtCallId: '', // 3자 통화 ID
        arrCtiContactIdInfo: [
        //   {
        //   ctiContactId: '',
        //   state:'',
        //   callType:''
        // }
        ], // 통화 ID 리스트 정보
      },
      
      // ========== 인입정보 ==========
      gCallIBData: {
        ani: '', // 인입전화번호
        waitingTime: '', // 대기시간
        number: '', // 인입대표번호(W)
        authInfo: '', // 인증정보
        arsPath: '', // ARS서비스(코드)
        arsPathNm: '', // ARS 이름
        inflowPoint: '', // 인입점(M)
      }
    };
    
    // 상태 변경 리스너들
    this.stateChangeListeners = new Set();
    
    // 브로드캐스트 동기화 설정
    this.setupBroadcastSync();
    
    // PopupManager에 GlobalContext 인스턴스 등록
    this.registerToPopupManager();
    
    // 싱글톤 인스턴스 저장
    GlobalContextSingleton.instance = this;
  }
  
  // 정적 메서드로 싱글톤 인스턴스 반환
  static getInstance() {
    if (!GlobalContextSingleton.instance) {
      GlobalContextSingleton.instance = new GlobalContextSingleton();
    }
    return GlobalContextSingleton.instance;
  }
  
  // 상태 변경 리스너 등록
  addStateChangeListener(listener) {
    this.stateChangeListeners.add(listener);
  }
  
  // 상태 변경 리스너 제거
  removeStateChangeListener(listener) {
    this.stateChangeListeners.delete(listener);
  }
  
  // 상태 변경 알림
  notifyStateChange() {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('🌍 GlobalContext: 상태 변경 리스너 오류:', error);
      }
    });
  }
  
  // 상태 업데이트 메서드 (React 컴포넌트의 setState 대체)
  setState(newState, callback) {
    if (typeof newState === 'function') {
      this.state = { ...this.state, ...newState(this.state) };
    } else {
      this.state = { ...this.state, ...newState };
    }
    
    // 상태 변경 알림
    this.notifyStateChange();
    
    // 콜백 실행
    if (typeof callback === 'function') {
      callback();
    }
  }

  // ========== PopupManager 연동 관련 메서드 ==========
  
  /**
   * PopupManager에 GlobalContext 인스턴스 등록 (싱글톤 보장)
   */
  registerToPopupManager = () => {
    try {
      // console.log('🌍 GlobalContext: 싱글톤 인스턴스 PopupManager 등록 시도');
      
      // 이미 등록된 인스턴스가 있고 그것이 현재 인스턴스가 아니면 등록하지 않음
      if (window.globalContextInstance && window.globalContextInstance !== this) {
        console.log('🔄 GlobalContext: 다른 인스턴스가 이미 등록되어 있음, 등록 건너뜀');
        return;
      }
      
      // 전역 참조 설정 (싱글톤 보장)
      window.globalContextInstance = this;
      // console.log('🌍 GlobalContext: window.globalContextInstance 설정 완료 (싱글톤)');
      
      // PopupManager에 인스턴스 등록
      if (window.PopupManagerInstance) {
        // 이미 등록된 인스턴스가 있고 그것이 현재 인스턴스가 아니면 등록하지 않음
        if (window.PopupManagerInstance.globalContextInstance && 
            window.PopupManagerInstance.globalContextInstance !== this) {
          console.log('🔄 GlobalContext: PopupManager에 다른 인스턴스가 이미 등록되어 있음');
          return;
        }
        
        window.PopupManagerInstance.globalContextInstance = this;
        // console.log('🌍 GlobalContext: PopupManager에 싱글톤 인스턴스 등록 완료');
      } else {
        console.warn('🌍 GlobalContext: PopupManager가 아직 로드되지 않았습니다. 나중에 다시 시도합니다.');
        
        // PopupManager가 로드될 때까지 대기 후 재시도
        setTimeout(() => {
          if (window.PopupManagerInstance && !window.PopupManagerInstance.globalContextInstance) {
            window.PopupManagerInstance.globalContextInstance = this;
            // console.log('🌍 GlobalContext: PopupManager에 지연 등록 완료 (싱글톤)');
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('🌍 GlobalContext: PopupManager 등록 실패:', error);
    }
  };

  // ========== 브로드캐스트 동기화 관련 메서드 ==========
  
  /**
   * 브로드캐스트 동기화 설정
   */
  setupBroadcastSync = () => {
    // console.log('🔄 GlobalContext: 브로드캐스트 동기화 설정');
    
    // 동기화 메시지 수신 리스너
    this.    handleSyncMessage = (event) => {
      const { message } = event.detail;
      
      if (message.type !== 'GLOBAL_CONTEXT_UPDATE' && message.type !== 'GLOBAL_CONTEXT_INITIAL_SYNC') {
        return;
      }

      // 자신이 보낸 메시지는 무시
      const currentSource = window.name || 'main';
      if (message._sender?.source === currentSource) {
        return;
      }

      // console.log('📥 GlobalContext: 동기화 메시지 수신:', {
      //   type: message.type,
      //   dataType: message.dataType,
      //   sender: message._sender?.source
      // });

      // 초기 동기화 처리
      if (message.type === 'GLOBAL_CONTEXT_INITIAL_SYNC') {
        // console.log('🔄 GlobalContext: 초기 데이터 동기화 시작');
        
        this.setState({
          gMaskingData: message.data.gMaskingData || this.state.gMaskingData,
          gCustomerData: message.data.gCustomerData || this.state.gCustomerData,
          gCtiData: message.data.gCtiData || this.state.gCtiData,
          gCallData: message.data.gCallData || this.state.gCallData,
          gCnslData: message.data.gCnslData || this.state.gCnslData,
          gCallIBData: message.data.gCallIBData || this.state.gCallIBData,
        }, () => {
          // console.log('✅ GlobalContext: 초기 데이터 동기화 완료');
        });
        return;
      }

      // 수신된 데이터로 로컬 상태 업데이트 (브로드캐스트 없이)
      this.updateLocalState(message.dataType, message.data);
    };

  // PopupManager에서 발생하는 globalContextSync 이벤트 리스너 추가
  this.handleGlobalContextSync = (event) => {
    const { type, data, sender } = event.detail;
    
    // 자신이 보낸 메시지는 무시
    const currentSource = window.name || 'main';
    if (sender?.source === currentSource) {
      return;
    }

    // console.log('📥 GlobalContext: PopupManager 동기화 이벤트 수신:', {
    //   dataType: type,
    //   sender: sender?.source
    // });

    // 수신된 데이터로 로컬 상태 업데이트 (브로드캐스트 없이)
    this.updateLocalState(type, data);
  };

    // 이벤트 리스너 등록
    window.addEventListener('popupEventReceived', this.handleSyncMessage);
    window.addEventListener('globalContextSync', this.handleGlobalContextSync); // 추가
  }

  /**
   * 브로드캐스트 동기화 정리
   */
  cleanupBroadcastSync = () => {
    if (this.handleSyncMessage) {
      window.removeEventListener('popupEventReceived', this.handleSyncMessage);
    }
    
    if (this.handleGlobalContextSync) {
      window.removeEventListener('globalContextSync', this.handleGlobalContextSync);
    }
    // console.log('🧹 GlobalContext: 브로드캐스트 동기화 정리 완료');
  }

  /**
   * 로컬 상태 업데이트 (브로드캐스트 없이)
   */
  updateLocalState = (dataType, data) => {
    switch (dataType) {
      case 'CUSTOMER_DATA':
        this.setState({ gCustomerData: data });
        break;
      case 'CTI_DATA':
        this.setState(prevState => ({
          gCtiData: { ...prevState.gCtiData, ...data }
        }));
        break;
      case 'CALL_DATA':
        this.setState(prevState => ({
          gCallData: { ...prevState.gCallData, ...data }
        }));
        break;
      case 'CNSL_DATA':
        this.setState(prevState => ({
          gCnslData: { ...prevState.gCnslData, ...data }
        }));
        break;
      case 'IB_DATA':
        this.setState(prevState => ({
          gCallIBData: { ...prevState.gCallIBData, ...data }
        }));
        break;
      case 'ALL_DATA':
        this.setState({
          gMaskingData: data.gMaskingData || this.state.gMaskingData,
          gCustomerData: data.gCustomerData || this.state.gCustomerData,
          gCtiData: data.gCtiData || this.state.gCtiData,
          gCallData: data.gCallData || this.state.gCallData,
          gCnslData: data.gCnslData || this.state.gCnslData,
          gCallIBData: data.gCallIBData || this.state.gCallIBData,
        });
        break;
    }
  }

  /**
   * 브로드캐스트 전송
   */
  broadcastUpdate = (dataType, data) => {
    const popupManager = window.PopupManagerInstance;
    
    if (!popupManager || !popupManager.broadcastSupported) {
      console.warn('GlobalContext: PopupManager 또는 BroadcastChannel을 사용할 수 없습니다.');
      return false;
    }

    const message = {
      type: 'GLOBAL_CONTEXT_UPDATE',
      dataType: dataType,
      data: data,
      _sender: {
        type: 'globalContext',
        source: window.name || 'main',
        timestamp: new Date().getTime()
      }
    };

    const result = popupManager.broadcast('POPUP_BROADCAST', message);
    // console.log(`📡 GlobalContext: 브로드캐스트 전송 (${dataType}):`, result);
    
    return result;
  }

  // ========== 고객 데이터 관련 메서드 ==========
  updateCustomerData = (dataKey, data) => {
    // console.log(`🌍 GlobalContext: 고객데이터 ${dataKey} 업데이트`, data);
    
    this.setState(prevState => ({
      gCustomerData: {
        ...prevState.gCustomerData,
        [dataKey]: data
      }
    }));
  }

  setCustomerData = (gCustomerData) => {
    // console.log('🌍 GlobalContext: 전체 고객데이터 교체', gCustomerData);
    this.setState({ gCustomerData });
  }

  /**
   * 고객 데이터 업데이트 (동기화 지원)
   */
  updateCustomerDataSync = (dataKey, data, enableSync = true) => {
    // console.log(`🌍 GlobalContext: 고객데이터 ${dataKey} 업데이트 (동기화: ${enableSync})`, data);
    
    this.setState(prevState => ({
      gCustomerData: {
        ...prevState.gCustomerData,
        [dataKey]: data
      }
    }), () => {
      // 동기화 활성화 시 브로드캐스트
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCustomerData);
      }
    });
  }

  /**
   * 전체 고객 데이터 설정 (동기화 지원)
   */
  setCustomerDataSync = (gCustomerData, enableSync = true) => {
    // console.log(`🌍 GlobalContext: 전체 고객데이터 교체 (동기화: ${enableSync})`, gCustomerData);
    
    this.setState({ gCustomerData }, () => {
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', gCustomerData);
      }
    });
  }

  resetCustomerData = (enableSync = true) => {
    this.setState(() => ({
      gCustomerData: {
        basicInfo: {
          CustmNo: '', // 고객번호
          PsnlCorpCode: '', // 개인/법인 구분 코드
          CustmNm: '', // 고객명
          CustmStatCode: '', // 고객상태 코드
          CustmStatCodeNm: '', // 고객상태 코드명
          AcntNo: '', // 계좌번호
          CustmDob: '', // 생년월일
          Age: '', // 나이
          SexCodeNm: '', // 성별 코드명
          CustmHpNo: '', // 고객휴대전화번호
          CustmHomeTelNo: '', // 고객자택전화번호
          CustmWkplcTelNo: '', // 고객회사전화번호
          EmailAddr: '', // 고객이메일주소
          CustmAddr: '', // 고객주소
          ScrDivTpCode: '', // 화면구분 코드
          Rmnno24: '' // 실명확인번호
        },
        accountInfo: [
          {
            actNo: '',
          }
        ],
        // 인증 계좌정보
        accountInfoCert: [
          // {
          //   actNo: '', // 계좌번호
          //   pwd: '' // 비밀번호
          // }
        ],
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCallData);
      }
    });

  }

  // ========== 고객 데이터 조회 메서드 ==========
  getCustomerData = () => {
    // console.log('📋 GlobalContext: 전체 고객데이터 조회');
    return this.state.gCustomerData;
  }

  getCustomerBasicInfo = () => {
    // console.log('📋 GlobalContext: 고객기본정보 조회');
    return this.state.gCustomerData.basicInfo;
  }

  // getCustomerAccountInfo = () => {
  //   // console.log('📋 GlobalContext: 고객계좌정보 조회');
  //   return this.state.gCustomerData.accountInfo;
  // }

  // getCustomerNo = () => {
  //   // console.log('📋 GlobalContext: 고객번호 조회');
  //   return this.state.gCustomerData.basicInfo.CustmNo;
  // }

  // getCustomerName = () => {
  //   // console.log('📋 GlobalContext: 고객명 조회');
  //   return this.state.gCustomerData.basicInfo.CustmNm;
  // }

  hasCustomerData = () => {
    const basicInfo = this.state.gCustomerData.basicInfo;
    const hasData = !!(basicInfo.CustmNo || basicInfo.CustmNm || basicInfo.CustmHpNo);
    // console.log('📋 GlobalContext: 고객데이터 존재 여부 확인:', hasData);
    return hasData;
  }

  // ========== 인증 계좌 정보(accountInfoCert) 관련 메서드 ==========
  
  /**
   * 인증 계좌 정보 전체 설정
   * @param {Array} accountInfoCert - 계좌 정보 배열 [{ actNo: '', pwd: '' }]
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  setAccountInfoCert = (accountInfoCert, enableSync = true) => {
    const validList = Array.isArray(accountInfoCert) ? accountInfoCert : [];

    this.setState(prevState => ({
      gCustomerData: {
        ...prevState.gCustomerData,
        accountInfoCert: validList
      }
    }), () => {
      if(enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCustomerData);
      }
    });
  }

  /**
   * 인증 계좌 정보 단일 추가
   * @param {Object} accountInfo - 계좌 정보 { actNo: '', pwd: '' }
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  addAccountInfoCert = (accountInfo, enableSync = true) => {
    if (!accountInfo || !accountInfo.actNo) {
      console.warn('📋 GlobalContext: 추가할 계좌번호가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCustomerData.accountInfoCert || [];
      
      // 중복 체크 (계좌번호 기준)
      const existingIndex = currentList.findIndex(item => item.actNo === accountInfo.actNo);
      
      let updatedList;
      if (existingIndex !== -1) {
        // 이미 존재하면 업데이트
        updatedList = [...currentList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...accountInfo
        };
        
      } else {
        updatedList = [...currentList, accountInfo];
      }

      return {
        gCustomerData: {
          ...prevState.gCustomerData,
          accountInfoCert: updatedList
        }
      };      
    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCustomerData);
      }
    });
  }

  /**
   * 인증 계좌 정보 제거
   * @param {string} actNo - 제거할 계좌번호
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  removeAccountInfoCert = (actNo, enableSync = true) => {
    if (!actNo) {
      console.warn('📋 GlobalContext: 제거할 계좌번호가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCustomerData.accountInfoCert || [];
      const updatedList = currentList.filter(item => item.actNo !== actNo);
      
      if (currentList.length === updatedList.length) {
        console.warn('📋 GlobalContext: 제거할 계좌번호가 리스트에 없습니다:', actNo);
        return prevState; // 상태 변경 없음
      }

      return {
        gCustomerData: {
          ...prevState.gCustomerData,
          accountInfoCert: updatedList
        }
      };

    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCustomerData);
      }
    });
  }

  /**
   * 인증 계좌 정보 초기화
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  clearAccountInfoCert = (enableSync = true) => {

    this.setState(prevState => ({
      gCustomerData: {
        ...prevState.gCustomerData,
        accountInfoCert: []
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CUSTOMER_DATA', this.state.gCustomerData);
      }
    });
  }

  /**
   * 인증 계좌 정보 조회
   * @returns {Array} 인증 계좌 정보 배열
   */
  getAccountInfoCert = () => {
    const list = this.state.gCustomerData.accountInfoCert || [];
    return list;
  }

  /**
   * 특정 계좌번호의 인증 정보 조회
   * @param {string} actNo - 조회할 계좌번호
   * @returns {Object|null} 계좌 정보 또는 null
   */
  getAccountInfoCertByActNo = (actNo) => {
    if (!actNo) {
      return null;
    }
    const list = this.state.gCustomerData.accountInfoCert || [];
    const account = list.find(item => item.actNo === actNo);
    // console.log('📋 GlobalContext: 계좌번호로 인증 정보 조회:', actNo, account);
    return account || null;
  }

  /**
   * 인증 계좌 정보 존재 여부 확인
   * @param {string} actNo - 확인할 계좌번호 (선택사항)
   * @returns {boolean} 존재 여부
   */
  hasAccountInfoCert = (actNo = null) => {
    const list = this.state.gCustomerData.accountInfoCert || [];
    
    if (actNo) {
      // 특정 계좌번호 존재 여부 확인
      const exists = list.some(item => item.actNo === actNo);
      // console.log('📋 GlobalContext: 인증 계좌 존재 여부 확인:', actNo, exists);
      return exists;
    } else {
      // 전체 리스트 존재 여부 확인
      const hasData = list.length > 0;
      // console.log('📋 GlobalContext: 인증 계좌정보 존재 여부 확인:', hasData);
      return hasData;
    }
  }

  // ========== CTI 관련 메서드 ==========
  updateCtiData = (ctiUpdateData) => {
    // console.log('📞 GlobalContext: CTI 정보 업데이트', ctiUpdateData);
    this.setState(prevState => ({
      gCtiData: {
        ...prevState.gCtiData,
        ...ctiUpdateData
      }
    }));
  }

  /**
   * CTI 데이터 업데이트 (동기화 지원)
   */
  updateCtiDataSync = (ctiUpdateData, enableSync = true) => {
    // console.log(`📞 GlobalContext: CTI 정보 업데이트 (동기화: ${enableSync})`, ctiUpdateData);
    
    this.setState(prevState => ({
      gCtiData: {
        ...prevState.gCtiData,
        ...ctiUpdateData
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CTI_DATA', this.state.gCtiData);
      }
    });
  }

  // updateAgentState = (agentState) => {
  //   console.log('👤 GlobalContext: 상담원 상태 업데이트', agentState);
  //   this.setState(prevState => ({
  //     gCtiData: {
  //       ...prevState.gCtiData,
  //       agentState
  //     }
  //   }));
  // }

  // updateCtiConnection = (isConnected, isLoggedIn = null) => {
  //   console.log('🔗 GlobalContext: CTI 연결상태 업데이트', { isConnected, isLoggedIn });
  //   this.setState(prevState => ({
  //     gCtiData: {
  //       ...prevState.gCtiData,
  //       isConnected,
  //       ...(isLoggedIn !== null && { isLoggedIn })
  //     }
  //   }));
  // }

  // updateWaitInfo = (waitTime, waitCustomer) => {
  //   console.log('⏰ GlobalContext: 대기정보 업데이트', { waitTime, waitCustomer });
  //   this.setState(prevState => ({
  //     gCtiData: {
  //       ...prevState.gCtiData,
  //       waitTime,
  //       waitCustomer
  //     }
  //   }));
  // }

  resetCtiData = () => {
    // console.log('🗑️ GlobalContext: CTI데이터 초기화');
    this.setState({
      gCtiData: {
        ctiServerIpA: '',
        ctiServerIpB: '',
        ctiPortA: '',
        ctiPortB: '',
        ctiSsl: '',
        ctiEnabled: '',
        ctiPrefix: '',
        ctiSseServer: '',
      }
    });
  }

  // ========== 통화 데이터 관련 메서드 ==========
  updateCallData = (callUpdateData) => {
    // console.log('📞 GlobalContext: 통화데이터 업데이트', callUpdateData);
    this.setState(prevState => ({
      gCallData: {
        ...prevState.gCallData,
        ...callUpdateData
      }
    }));
  }

  /**
   * 통화 데이터 업데이트 (동기화 지원)
   */
  updateCallDataSync = (callUpdateData, enableSync = true) => {
    // console.log(`📞 GlobalContext: 통화데이터 업데이트 (동기화: ${enableSync})`, callUpdateData);
    
    this.setState(prevState => ({
      gCallData: {
        ...prevState.gCallData,
        ...callUpdateData
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CALL_DATA', this.state.gCallData);
      }
    });
  }

  resetCallData = (enableSync = true) => {
    // console.log('🗑️ GlobalContext: 통화데이터 초기화');
    this.setState(() => ({
      gCallData: {
        callId: '',
        ani: '',
        dnis: '',
        callTryDt: '',
        callBgngDt: '',
        callEndDt: '',
        arsSrvcPath: '',
        cti_contact_id: '',
        variables: {
          callVariable1: '',
          callVariable2: '',
          callVariable3: '',
          callVariable4: '',
          callVariable5: '',
          callVariable6: '',
          callVariable7: '',
          callVariable8: '',
          callVariable9: '',
          callVariable10: '',
        },
        telNumber: '', // 전화번호 (상담AP에서 셋팅)
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CALL_DATA', this.state.gCallData);
      }
    });
  }


  resetCnslData = (enableSync = true) => {
    this.setState(() => ({
      // ========== 상담 정보 ==========
      gCnslData: {
        dscsnSid: '', // 상담 ID
        rsvtSid: '', // 통화예약 시퀀스ID
        callbakSid: '', // 콜백 시퀀스ID
        cmpId: '', // 캠페인 ID
        cmpSn: '', // 캠페인 일련번호
        callId: '', // 통화ID
        telNo: '', // 전화번호
        repTelNo: '', // 대표발신번호
        IO: '', // (미정) 인아웃구분 (I/O)
        isSaveCnsl: true, // 상담정보 저장 여부
        arrCtiContactId: [], // 통화 ID 리스트
        frstCtiContactId: '', // 최초 통화 ID
        holdCtiContactId: '', // 보류 통화 ID
        callTryDt: '', // 통화시도일시
        callBgngDt: '', // 통화시작일시
        callEndDt: '', // 통화종료일시
        arsSrvcPath: '', // ARS 서비스경로
        dscsnStopRsnCd: '', // 상담중지사유코드
        actNo:'', // 계좌번호
        actIndex:'', // 계좌일련번호
        actPwd: '', // 계좌비밀번호
        pwdYn: '',// 비밀번호 IVR 취득여부
        cmpNm: '', // 캠페인명
        isBusy: false, // 상담정보 저장 여부
        certActNo: '', // 인증계좌번호
        certActNm: '', // 인증계좌명
        calswtUserId: '',// calswt_user_id 호전환 사용자 ID
        thprtUserId: '',// thprt_user_id 3자 사용자 ID
        calswtCallId: '', // 호전환 통화 ID
        thprtCallId: '', // 3자 통화 ID
        arrCtiContactIdInfo: [
          // {
          // ctiContactId: '',
          // state:'',
          // callType:''
          // }
        ], // 통화 ID 리스트 정보
      }   
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });



  }
  // ========== 상담 데이터 관련 메서드 ==========
  updateCnslData = (cnslUpdateData) => {
    // console.log('💬 GlobalContext: 상담데이터 업데이트', cnslUpdateData);
    this.setState(prevState => ({
      gCnslData: {
        ...prevState.gCnslData,
        ...cnslUpdateData
      }
    }));
  }

  /**
   * 상담 데이터 업데이트 (동기화 지원)
   */
  updateCnslDataSync = (cnslUpdateData, enableSync = true) => {
    // console.log(`💬 GlobalContext: 상담데이터 업데이트 (동기화: ${enableSync})`, cnslUpdateData);
    
    this.setState(prevState => ({
      gCnslData: {
        ...prevState.gCnslData,
        ...cnslUpdateData
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }


  // ========== 상담 데이터 조회 메서드 ==========
  getCnslData = () => {
    // console.log('📋 GlobalContext: 전체 상담데이터 조회');
    return this.state.gCnslData;
  }

  getDscsnSid = () => {
    // console.log('📋 GlobalContext: 상담 ID 조회');
    return this.state.gCnslData.dscsnSid;
  }

  hasDscsnSid = () => {
    const hasData = !!this.state.gCnslData.dscsnSid;
    // console.log('📋 GlobalContext: 상담 ID 존재 여부 확인:', hasData);
    return hasData;
  }

  getIsSaveCnsl = () => {
    return this.state.gCnslData.isSaveCnsl;
  }
  // ========== 통화 ID 리스트 관리 메서드 ==========

  /**
   * 통화 ID 정보를 리스트에 추가
   * @param {string} ctiContactId - 추가할 통화 ID
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  addCtiContactIdInfo = (ctiContactIdInfo, enableSync = true) => {
    if (!ctiContactIdInfo || !ctiContactIdInfo.ctiContactId) {
      console.warn('💬 GlobalContext:ctiContactIdInfo 추가할 통화 ID가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCnslData.arrCtiContactIdInfo || [];
      
      const existingIndex = currentList.findIndex(
        item => item.ctiContactId === ctiContactIdInfo.ctiContactId
      );

      let updatedList;

      // 중복 체크
      if (existingIndex !== -1) {
        updatedList = [...currentList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...ctiContactIdInfo
        };

      } else {
        updatedList = [...currentList, ctiContactIdInfo];
      }

      console.log('💬 GlobalContext:ctiContactIdInfo 전체 리스트:', updatedList);

      return {
        gCnslData: {
          ...prevState.gCnslData,
          arrCtiContactIdInfo: updatedList
        }
      };
    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 정보를 리스트에서 제거
   * @param {string} ctiContactId - 제거할 통화 ID
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  removeCtiContactIdInfo = (ctiContactId, enableSync = true) => {
    if (!ctiContactId) {
      console.warn('💬 GlobalContext: 제거할 통화 ID가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCnslData.arrCtiContactIdInfo || [];
      const updatedList = currentList.filter(item => item.ctiContactId !== ctiContactId);
      
      if (currentList.length === updatedList.length) {
        // console.warn('💬 GlobalContext: 제거할 통화 ID가 리스트에 없습니다:', ctiContactId);
        return prevState; // 상태 변경 없음
      }

      // console.log('💬 GlobalContext: 통화 ID 제거:', ctiContactId, '전체 리스트:', updatedList);

      return {
        gCnslData: {
          ...prevState.gCnslData,
          arrCtiContactIdInfo: updatedList
        }
      };
    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 정보 리스트 초기화
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  clearCtiContactIdInfoList = (enableSync = true) => {
    // console.log('💬 GlobalContext: 통화 ID 리스트 초기화');

    this.setState(prevState => ({
      gCnslData: {
        ...prevState.gCnslData,
        arrCtiContactIdInfo: []
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 정보 리스트 조회
   * @returns {Array} 현재 통화 ID 리스트
   */
  getCtiContactIdInfoList = () => {
    const list = this.state.gCnslData.arrCtiContactIdInfo || [];
    // console.log('📋 GlobalContext: 통화 ID 리스트 조회:', list);
    return list;
  }

  /**
   * 통화 ID를 리스트에 추가
   * @param {string} ctiContactId - 추가할 통화 ID
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  addCtiContactId = (ctiContactId, enableSync = true) => {
    if (!ctiContactId) {
      console.warn('💬 GlobalContext: 추가할 통화 ID가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCnslData.arrCtiContactId || [];
      
      // 중복 체크
      if (currentList.includes(ctiContactId)) {
        console.warn('💬 GlobalContext: 이미 존재하는 통화 ID입니다:', ctiContactId);
        return prevState; // 상태 변경 없음
      }

      const updatedList = [...currentList, ctiContactId];
      console.log('💬 GlobalContext: 통화 ID 추가:', ctiContactId, '전체 리스트:', updatedList);

      return {
        gCnslData: {
          ...prevState.gCnslData,
          arrCtiContactId: updatedList
        }
      };
    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID를 리스트에서 제거
   * @param {string} ctiContactId - 제거할 통화 ID
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  removeCtiContactId = (ctiContactId, enableSync = true) => {
    if (!ctiContactId) {
      console.warn('💬 GlobalContext: 제거할 통화 ID가 없습니다.');
      return;
    }

    this.setState(prevState => {
      const currentList = prevState.gCnslData.arrCtiContactId || [];
      const updatedList = currentList.filter(id => id !== ctiContactId);
      
      if (currentList.length === updatedList.length) {
        // console.warn('💬 GlobalContext: 제거할 통화 ID가 리스트에 없습니다:', ctiContactId);
        return prevState; // 상태 변경 없음
      }

      // console.log('💬 GlobalContext: 통화 ID 제거:', ctiContactId, '전체 리스트:', updatedList);

      return {
        gCnslData: {
          ...prevState.gCnslData,
          arrCtiContactId: updatedList
        }
      };
    }, () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 리스트 전체 설정
   * @param {Array} ctiContactIdList - 설정할 통화 ID 배열
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  setCtiContactIdList = (ctiContactIdList, enableSync = true) => {
    const validList = Array.isArray(ctiContactIdList) ? ctiContactIdList : [];
    // console.log('💬 GlobalContext: 통화 ID 리스트 전체 설정:', validList);

    this.setState(prevState => ({
      gCnslData: {
        ...prevState.gCnslData,
        arrCtiContactId: validList
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 리스트 초기화
   * @param {boolean} enableSync - 동기화 활성화 여부 (기본값: true)
   */
  clearCtiContactIdList = (enableSync = true) => {
    // console.log('💬 GlobalContext: 통화 ID 리스트 초기화');

    this.setState(prevState => ({
      gCnslData: {
        ...prevState.gCnslData,
        arrCtiContactId: []
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('CNSL_DATA', this.state.gCnslData);
      }
    });
  }

  /**
   * 통화 ID 리스트 조회
   * @returns {Array} 현재 통화 ID 리스트
   */
  getCtiContactIdList = () => {
    const list = this.state.gCnslData.arrCtiContactId || [];
    // console.log('📋 GlobalContext: 통화 ID 리스트 조회:', list);
    return list;
  }

  /**
   * 통화 ID 존재 여부 확인
   * @param {string} ctiContactId - 확인할 통화 ID
   * @returns {boolean} 존재 여부
   */
  hasCtiContactId = (ctiContactId) => {
    const list = this.state.gCnslData.arrCtiContactId || [];
    const exists = list.includes(ctiContactId);
    // console.log('📋 GlobalContext: 통화 ID 존재 여부 확인:', ctiContactId, exists);
    return exists;
  }

  /**
   * 전체 데이터 브로드캐스트
   */
  broadcastAllData = () => {
    // console.log('📡 GlobalContext: 전체 데이터 브로드캐스트');
    
    const allData = {
      gMaskingData: this.state.gMaskingData,
      gCustomerData: this.state.gCustomerData,
      gCtiData: this.state.gCtiData,
      gCallData: this.state.gCallData,
      gCnslData: this.state.gCnslData,
      gCallIBData: this.state.gCallIBData
    };
    
    return this.broadcastUpdate('ALL_DATA', allData);
  }

  // ========== 인입정보 관련 메서드 ==========
  updateCallIBData = (ibUpdateData) => {
    // console.log('📞 GlobalContext: 인입정보 업데이트', ibUpdateData);
    this.setState(prevState => ({
      gCallIBData: {
        ...prevState.gCallIBData,
        ...ibUpdateData
      }
    }));
  }

  /**
   * 인입정보 업데이트 (동기화 지원)
   */
  updateCallIBDataSync = (ibUpdateData, enableSync = true) => {
    // console.log(`📞 GlobalContext: 인입정보 업데이트 (동기화: ${enableSync})`, ibUpdateData);
    
    this.setState(prevState => ({
      gCallIBData: {
        ...prevState.gCallIBData,
        ...ibUpdateData
      }
    }), () => {
      if (enableSync) {
        this.broadcastUpdate('IB_DATA', this.state.gCallIBData);
      }
    });
  }

  resetCallIBData = () => {
    // console.log('🗑️ GlobalContext: 인입정보 초기화');
    this.setState({
      gCallIBData: {
        ani: '', // 인입전화번호
        waitingTime: '', // 대기시간
        number: '', // 인입대표번호(W)
        authInfo: '', // 인증정보
        arsPath: '', // ARS서비스(코드)
        arsPathNm: '', // ARS 이름
        inflowPoint: '', // 인입점(M)
      }
    });
  }

  // ========== 인입정보 조회 메서드 ==========
  getCallIBData = () => {
    // console.log('📋 GlobalContext: 전체 인입정보 조회');
    return this.state.gCallIBData;
  }

  // ========== 전체 초기화 ==========
  resetAllData = () => {
    // console.log('🗑️ GlobalContext: 전체 데이터 초기화');
    this.setState({
      gMaskingData: {
        single: false,
        multiple: true
      },
      gCustomerData: {
        basicInfo: {
          CustmNo: '', // 고객번호
          PsnlCorpCode: '', // 개인/법인 구분 코드
          CustmNm: '', // 고객명
          CustmStatCode: '', // 고객상태 코드
          CustmStatCodeNm: '', // 고객상태 코드명
          AcntNo: '', // 계좌번호
          CustmDob: '', // 생년월일
          Age: '', // 나이
          SexCodeNm: '', // 성별 코드명
          CustmHpNo: '', // 고객휴대전화번호
          CustmHomeTelNo: '', // 고객자택전화번호
          CustmWkplcTelNo: '', // 고객회사전화번호
          EmailAddr: '', // 고객이메일주소
          CustmAddr: '', // 고객주소
          ScrDivTpCode: '', // 화면구분 코드
          Rmnno24: '' // 실명확인번호
        },
        selectedAccountNo: '', // 선택된 계좌번호
        accountInfo: [
          {
            actNo: '',
            selected: false, // 선택된 계좌번호 여부
            pw: '', // 비밀번호
          }
        ],
        // 인증 계좌정보
        accountInfoCert: [
          // {
          //   actNo: '', // 계좌번호
          //   pwd: '' // 비밀번호
          // }
        ],
      },
      gCtiData: {
        ctiServerIpA: '',
        ctiServerIpB: '',
        ctiPortA: '',
        ctiPortB: '',
        ctiSsl: '',
        ctiEnabled: '',
        ctiPrefix: '',
        ctiSseServer: '',
      },
      gCallData: {
        callId: '', // 콜ID
        ani: '',
        dnis: '',
        callTryDt: '', // 통화시도일시
        callBgngDt: '', // 통화시작일시
        callEndDt: '', // 통화종료일시
        arsSrvcPath: '', // ARS 서비스경로
        cti_contact_id: '',
        variables: {
          callVariable1: '',
          callVariable2: '',
          callVariable3: '',
          callVariable4: '',
          callVariable5: '',
          callVariable6: '',
          callVariable7: '',
          callVariable8: '',
          callVariable9: '',
          callVariable10: '',
        },
        telNumber: '', // 전화번호 (상담AP에서 셋팅)
      },
      gCnslData: {
        dscsnSid: '', // 상담 ID
        rsvtSid: '', // 통화예약 시퀀스ID
        callbakSid: '', // 콜백 시퀀스ID
        cmpId: '', // 캠페인 ID
        cmpSn: '', // 캠페인 일련번호
        telNo: '', // 전화번호
        repTelNo: '', // 대표발신번호
        IO: '', // (미정) 인아웃구분 (I/O)
        isSaveCnsl: true, // 상담정보 저장 여부
        arrCtiContactId: [], // 통화 ID 리스트
        frstCtiContactId: '', // 최초 통화 ID
        holdCtiContactId: '', // 보류 통화 ID
        callTryDt: '', // 통화시도일시
        callBgngDt: '', // 통화시작일시
        callEndDt: '', // 통화종료일시
        arsSrvcPath: '', // ARS 서비스경로
        dscsnStopRsnCd: '', // 상담중지사유코드
        actNo:'', // 계좌번호
        actIndex:'', // 계좌일련번호
        actPwd: '', // 계좌비밀번호
        pwdYn: '',// 비밀번호 IVR 취득여부
        cmpNm: '', // 캠페인명
        isBusy: false, // 상담정보 저장 여부
        certActNo: '', // 인증계좌번호
        certActNm: '', // 인증계좌명
        calswtUserId: '',// calswt_user_id 호전환 사용자 ID
        thprtUserId: '',// thprt_user_id 3자 사용자 ID
        calswtCallId: '', // 호전환 통화 ID
        thprtCallId: '', // 3자 통화 ID
        arrCtiContactIdInfo: [
          // {
          // ctiContactId: '',
          // state:'',
          // callType:''
          // }
        ], // 통화 ID 리스트 정보
      },
      // ========== 인입정보 ==========
      gCallIBData: {
        ani: '', // 인입전화번호
        waitingTime: '', // 대기시간
        number: '', // 인입대표번호(W)
        authInfo: '', // 인증정보
        arsPath: '', // ARS서비스(코드)
        arsPathNm: '', // ARS 이름
        inflowPoint: '', // 인입점(M)
      }

    });
  }

  // ========== PopupManager용 데이터 접근 메서드 ==========
  /**
   * PopupManager에서 현재 GlobalContext 데이터를 가져오는 메서드
   * @returns {Object} 현재 GlobalContext의 모든 데이터
   */
  getCurrentGlobalData = () => {
    // console.log('🌍 GlobalContext: getCurrentGlobalData 호출, 현재 state:', this.state);
    return {
      gMaskingData: this.state.gMaskingData,
      gCustomerData: this.state.gCustomerData,
      gCtiData: this.state.gCtiData,
      gCallData: this.state.gCallData,
      gCnslData: this.state.gCnslData,
      gCallIBData: this.state.gCallIBData,
      
      
    };
  }
}

// Provider 컴포넌트 (싱글톤 인스턴스 사용)
export class GlobalProvider extends Component {
  constructor(props) {
    super(props);
    
    // 싱글톤 인스턴스 가져오기
    this.globalContextInstance = GlobalContextSingleton.getInstance();
    
    // 상태 변경 리스너 등록
    this.handleStateChange = (newState) => {
      this.forceUpdate(); // React 컴포넌트 리렌더링 트리거
    };
    
    this.globalContextInstance.addStateChangeListener(this.handleStateChange);
  }

  componentDidMount() {
    console.log('🌍 GlobalProvider: 컴포넌트 마운트 완료 (싱글톤 사용)');
  }

  componentWillUnmount() {
    // 상태 변경 리스너 제거
    if (this.globalContextInstance && this.handleStateChange) {
      this.globalContextInstance.removeStateChangeListener(this.handleStateChange);
    }
    
    console.log('🌍 GlobalProvider: 컴포넌트 언마운트 완료');
  }

  render() {
    const instance = this.globalContextInstance;
    
    const contextValue = {
      // ========== 데이터 ==========
      gMaskingData: instance.state.gMaskingData,
      gCustomerData: instance.state.gCustomerData,
      gCtiData: instance.state.gCtiData,
      gCallData: instance.state.gCallData,
      gCnslData: instance.state.gCnslData,
      gCallIBData: instance.state.gCallIBData,

      // ========== 고객 관련 메서드 ==========
      updateCustomerData: instance.updateCustomerData,
      setCustomerData: instance.setCustomerData,
      resetCustomerData: instance.resetCustomerData,
      
      // ========== 고객 데이터 조회 메서드 ==========
      getCustomerData: instance.getCustomerData,
      getCustomerBasicInfo: instance.getCustomerBasicInfo,
      // getCustomerAccountInfo: instance.getCustomerAccountInfo,
      // getCustomerNo: instance.getCustomerNo,
      // getCustomerName: instance.getCustomerName,
      hasCustomerData: instance.hasCustomerData,

      // ========== 인증 계좌 정보(accountInfoCert) 관련 메서드 ==========
      setAccountInfoCert: instance.setAccountInfoCert,
      addAccountInfoCert: instance.addAccountInfoCert,
      removeAccountInfoCert: instance.removeAccountInfoCert,
      clearAccountInfoCert: instance.clearAccountInfoCert,
      getAccountInfoCert: instance.getAccountInfoCert,
      getAccountInfoCertByActNo: instance.getAccountInfoCertByActNo,
      hasAccountInfoCert: instance.hasAccountInfoCert,

      // ========== CTI 관련 메서드 ==========
      updateCtiData: instance.updateCtiData,
      resetCtiData: instance.resetCtiData,

      // ========== 통화 관련 메서드 ==========
      updateCallData: instance.updateCallData,
      resetCallData: instance.resetCallData,

      // ========== 상담 관련 메서드 ==========
      resetCnslData: instance.resetCnslData,
      updateCnslData: instance.updateCnslData,
      
      // ========== 상담 데이터 조회 메서드 ==========
      getCnslData: instance.getCnslData,
      getDscsnSid: instance.getDscsnSid,
      hasDscsnSid: instance.hasDscsnSid,
      getIsSaveCnsl: instance.getIsSaveCnsl,

      // ========== 통화 ID 리스트 관리 메서드 ==========
      addCtiContactIdInfo: instance.addCtiContactIdInfo,
      removeCtiContactIdInfo: instance.removeCtiContactIdInfo,
      getCtiContactIdInfoList: instance.getCtiContactIdInfoList,

      addCtiContactId: instance.addCtiContactId,
      removeCtiContactId: instance.removeCtiContactId,
      setCtiContactIdList: instance.setCtiContactIdList,
      clearCtiContactIdList: instance.clearCtiContactIdList,
      getCtiContactIdList: instance.getCtiContactIdList,
      hasCtiContactId: instance.hasCtiContactId,

      // ========== 전체 초기화 ==========
      resetAllData: instance.resetAllData,

      // ========== 인입정보 관련 메서드 ==========
      updateCallIBData: instance.updateCallIBData,
      resetCallIBData: instance.resetCallIBData,
      getCallIBData: instance.getCallIBData,

      // ========== 동기화 지원 메서드들 ==========
      updateCustomerDataSync: instance.updateCustomerDataSync,
      setCustomerDataSync: instance.setCustomerDataSync,
      updateCtiDataSync: instance.updateCtiDataSync,
      updateCallDataSync: instance.updateCallDataSync,
      updateCnslDataSync: instance.updateCnslDataSync,
      updateCallIBDataSync: instance.updateCallIBDataSync,
      broadcastAllData: instance.broadcastAllData
    };

    return (
      <GlobalContext.Provider value={contextValue}>
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}

// HOC 패턴 (클래스 컴포넌트용) - 싱글톤 지원
export const withGlobalData = (WrappedComponent) => {
  return class extends Component {
    static contextType = GlobalContext;

    render() {
      const globalContext = this.context;
      return (
        <WrappedComponent 
          {...this.props} 
          globalContext={globalContext}
        />
      );
    }
  };
};

// withGlobalData HOC를 사용하되 ref 전달 보장 - 싱글톤 지원
export const withGlobalDataAndRef = (WrappedComponent) => {
  const WithGlobalDataComponent = React.forwardRef((props, ref) => {
    return (
      <GlobalContext.Consumer>
        {(globalContext) => (
          <WrappedComponent 
            {...props} 
            ref={ref} 
            globalContext={globalContext} 
          />
        )}
      </GlobalContext.Consumer>
    );
  });
  
  // displayName 설정 (디버깅용)
  WithGlobalDataComponent.displayName = `withGlobalDataAndRef(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithGlobalDataComponent;
};

// Hook 패턴 (함수형 컴포넌트용) - 싱글톤 지원
export const useGlobalData = () => {
  const context = React.useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalData는 GlobalProvider 안에서 사용되어야 합니다.');
  }
  return context;
};

// 싱글톤 인스턴스 직접 접근 유틸리티 함수들
export const getGlobalContextInstance = () => {
  return GlobalContextSingleton.getInstance();
};

// 모달 팝업에서 사용할 수 있는 직접 접근 Hook
export const useGlobalDataDirect = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const instanceRef = React.useRef(null);
  
  React.useEffect(() => {
    // 싱글톤 인스턴스 가져오기
    instanceRef.current = GlobalContextSingleton.getInstance();
    
    // 상태 변경 리스너 등록
    const handleStateChange = () => {
      forceUpdate();
    };
    
    instanceRef.current.addStateChangeListener(handleStateChange);
    
    // 정리 함수
    return () => {
      if (instanceRef.current) {
        instanceRef.current.removeStateChangeListener(handleStateChange);
      }
    };
  }, []);
  
  if (!instanceRef.current) {
    instanceRef.current = GlobalContextSingleton.getInstance();
  }
  
  // Context와 동일한 인터페이스 제공
  return {
    // 데이터
    gMaskingData: instanceRef.current.state.gMaskingData,
    gCustomerData: instanceRef.current.state.gCustomerData,
    gCtiData: instanceRef.current.state.gCtiData,
    gCallData: instanceRef.current.state.gCallData,
    gCnslData: instanceRef.current.state.gCnslData,
    gCallIBData: instanceRef.current.state.gCallIBData,
    
    // 메서드들
    updateCustomerData: instanceRef.current.updateCustomerData,
    setCustomerData: instanceRef.current.setCustomerData,
    resetCustomerData: instanceRef.current.resetCustomerData,
    getCustomerData: instanceRef.current.getCustomerData,
    getCustomerBasicInfo: instanceRef.current.getCustomerBasicInfo,
    hasCustomerData: instanceRef.current.hasCustomerData,
    
    // 인증 계좌 정보 메서드들
    setAccountInfoCert: instanceRef.current.setAccountInfoCert,
    addAccountInfoCert: instanceRef.current.addAccountInfoCert,
    removeAccountInfoCert: instanceRef.current.removeAccountInfoCert,
    clearAccountInfoCert: instanceRef.current.clearAccountInfoCert,
    getAccountInfoCert: instanceRef.current.getAccountInfoCert,
    getAccountInfoCertByActNo: instanceRef.current.getAccountInfoCertByActNo,
    hasAccountInfoCert: instanceRef.current.hasAccountInfoCert,
    
    updateCtiData: instanceRef.current.updateCtiData,
    resetCtiData: instanceRef.current.resetCtiData,
    updateCallData: instanceRef.current.updateCallData,
    resetCallData: instanceRef.current.resetCallData,
    resetCnslData: instanceRef.current.resetCnslData,
    updateCnslData: instanceRef.current.updateCnslData,
    getCnslData: instanceRef.current.getCnslData,
    getDscsnSid: instanceRef.current.getDscsnSid,
    hasDscsnSid: instanceRef.current.hasDscsnSid,
    getIsSaveCnsl: instanceRef.current.getIsSaveCnsl,
    addCtiContactId: instanceRef.current.addCtiContactId,
    removeCtiContactId: instanceRef.current.removeCtiContactId,
    setCtiContactIdList: instanceRef.current.setCtiContactIdList,
    clearCtiContactIdList: instanceRef.current.clearCtiContactIdList,
    getCtiContactIdList: instanceRef.current.getCtiContactIdList,
    addCtiContactIdInfo: instanceRef.current.addCtiContactIdInfo,
    removeCtiContactIdInfo: instanceRef.current.removeCtiContactIdInfo,
    getCtiContactIdInfoList: instanceRef.current.getCtiContactIdInfoList,
    hasCtiContactId: instanceRef.current.hasCtiContactId,
    resetAllData: instanceRef.current.resetAllData,
    updateCallIBData: instanceRef.current.updateCallIBData,
    resetCallIBData: instanceRef.current.resetCallIBData,
    getCallIBData: instanceRef.current.getCallIBData,
    updateCustomerDataSync: instanceRef.current.updateCustomerDataSync,
    setCustomerDataSync: instanceRef.current.setCustomerDataSync,
    updateCtiDataSync: instanceRef.current.updateCtiDataSync,
    updateCallDataSync: instanceRef.current.updateCallDataSync,
    updateCnslDataSync: instanceRef.current.updateCnslDataSync,
    updateCallIBDataSync: instanceRef.current.updateCallIBDataSync,
    broadcastAllData: instanceRef.current.broadcastAllData
  };
};

export default GlobalContext;