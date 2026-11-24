import React from 'react';
import {
  FullPanel,
  ComponentPanel,
  FlexPanel,
  LFloatArea,
  Label,
  Textfield,
} from 'components';
import { DataLib, ComLib, TransManager } from 'common';

import './UserInfo.css';

class View extends React.Component {
  constructor(props) {
    super(props);
    
    // 필수 참조 변수들
    this.currentRow = '';
    
    this.state = {
      // 데이터셋 (표준 패턴)
      dsUserInfo: DataLib.datalist.getInstance(),
      
      // UI 프로퍼티 관리 (표준 패턴)
      btnProps: {
        btnClose: {
          id: 'btnClose',
          value: '닫기',
          color: 'gray',
          size: 'md',
          disabled: false
        }
      },
      
      textFieldProps: {
        iptUserId: {
          id: 'iptUserId',
          name: 'iptUserId',
          value: '',
          placeholder: '',
          readOnly: true,
          disabled: false,
          type: 'text'
        },
        iptUserName: {
          id: 'iptUserName',
          name: 'iptUserName',
          value: '',
          placeholder: '',
          readOnly: true,
          disabled: false,
          type: 'text'
        },
        iptOgnzCd: {
          id: 'iptOgnzCd',
          name: 'iptOgnzCd',
          value: '',
          placeholder: '',
          readOnly: true,
          disabled: false,
          type: 'text'
        },
        iptAuthrtCd: {
          id: 'iptAuthrtCd',
          name: 'iptAuthrtCd',
          value: '',
          placeholder: '',
          readOnly: true,
          disabled: false,
          type: 'text'
        },
      },
      
      profileImagePreview: null
    };
    // 이벤트 바인딩 (필수)
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

  }
  
  componentDidMount() {
    
    // 팝업 창 크기 자동 조정 (현재 컴포넌트 참조 전달)
    ComLib.resizePopupAfterLoad({
      width: 350,
      height: 570,
      center: true 
    }, this);

    // 초기 사용자 정보 로드 (표준 패턴)
    if(this.validation('COM1100R01')) {
      this.transaction('COM1100R01');
    }
  }


  handleImageSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // 파일 유효성 검증
    if (!file.type.startsWith('image/')) {
      ComLib.openAlertDialog('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      ComLib.openAlertDialog('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }
    
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      ComLib.openAlertDialog('이미지 파일 형식은 jpg, jpeg, png, gif만 선택할 수 있습니다.');
      return;
    }

    // 파일을 base64로 변환
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      this.updateUserImageWithBase64(base64Data);
    };
    reader.readAsDataURL(file);
  }

  // 사용자 이미지 업데이트
  updateUserImageWithBase64 = (base64Data) => {
    this.setState({ profileImagePreview: base64Data });
    this.transaction('COM1100U01');
  }
  
  // 유효성 검증
  validation = (...params) => {
    const transId = params[0];
    
    switch (transId) {
      case 'COM1100R01':
        // 사용자 프로필 조회 - 세션 확인
        if (!ComLib.getLoginUser()) {
			    ComLib.openAlertDialog('로그인이 필요합니다.');
          return false;
        }

        return true;
        
      case 'COM1100U01':
        // 사용자 이미지 변경 - 로그인 확인
        if (!ComLib.getLoginUser()) {
          ComLib.openAlertDialog('로그인이 필요합니다.');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };
  
  // 서버 통신 (표준 패턴)
  transaction = (transactionId) => {
    const transManager = new TransManager();
    transManager.setTransId(transactionId);
    
    switch (transactionId) {
      case 'COM1100R01':
        const userInfo = ComLib.getSession('gdsUserInfo');
        this.setState({
          textFieldProps: {
            ...this.state.textFieldProps,
            iptUserId: { ...this.state.textFieldProps.iptUserId, value: userInfo.userId || '' },
            iptUserName: { ...this.state.textFieldProps.iptUserName, value: userInfo.userNm || '' },
            iptOgnzCd: { ...this.state.textFieldProps.iptOgnzCd, value: userInfo.ognzNm || '' },
            iptAuthrtCd: { ...this.state.textFieldProps.iptAuthrtCd, value: userInfo.authrtNm || '' }
          },
          profileImagePreview: userInfo.userPhoto || null
        });
        break;
        
      case 'COM1100U01':
        const params = {
          userId: ComLib.getSession('gdsUserInfo').userId || '',
          userPhoto: this.state.profileImagePreview || null
        };

        transManager.post('/api/cmm/login-user/u01', params, (res) => {
          if(ComLib.handleResponse(res, 'save')) {
            this.callback(res);
          }
        });

        break;
        
      default:
        console.warn('알 수 없는 트랜잭션 ID:', transactionId);
        return;
    }
  };
  
  // 응답 처리 (표준 패턴)
  callback = (res) => {
    if (res && res.data) {
      let profileImage = res.data.userPhoto;
      
      // 전각 문자를 반각 문자로 정규화 (특히 base64 패딩 문자 =)
      if (profileImage) {
        profileImage = profileImage.replace(/＝/g, '=');
      }
      
      this.setState({
        profileImagePreview: profileImage
      });
      
      ComLib.setSession('gdsUserInfo', {
        ...ComLib.getSession('gdsUserInfo'),
        userPhoto: profileImage
      });
      ComLib.openAlertDialog('변경되었습니다.');
      window.dispatchEvent(new CustomEvent('userImageChanged'));
    } else {
      ComLib.openAlertDialog(res?.resultMessage || res?.message || '이미지 업데이트 중 오류가 발생했습니다.');
    }
  };
  

  
  // 이벤트 핸들러 (표준 패턴)
  handleButtonClick = (e) => {
    const { id } = e.target;
    
    switch (id) {
      case 'btnClose':
        // 화면 닫기
        if (window.opener) {
          window.close();
        } else {
          window.history.back();
        }
        break;
      
      case 'btnChgPasswd':
        const popupElement = document.getElementById('popup_div_1');
        if(popupElement) {
          popupElement.hidden = false;
        } else {
          const options = { width: '450px', height: '240px', modaless: false,
            param: [{
              USR_CD: this.state.textFieldProps.iptUserId.value || '',
              CUR_PWD: '',
              NEW_PWD: '',
              CON_PWD: '',
            }],
          };
          ComLib.openPop('COM0020', '비밀번호 변경', options);
        }
        break;
      default:
        console.log('Unknown button clicked:', id);
        break;
    }
  };

  // 입력 이벤트 핸들러 (표준 패턴)
  handleInputChange = (e) => {
    const { id, value } = e.target;
    
    this.setState(prevState => ({
      textFieldProps: {
        ...prevState.textFieldProps,
        [id]: {
          ...prevState.textFieldProps[id],
          value: value
        }
      }
    }));
  };

  render() {
    return (
      <FullPanel>
        <ComponentPanel className='user-info-container'>
          {/* 사용자 프로필 이미지 */}
          <div className='user-profile-image'>
           <img 
             src={this.state.profileImagePreview || "/public/media/profile.40ac423f.png"} 
             alt="프로필 이미지"
             onError={(e) => {
               e.target.src = "/public/media/profile.40ac423f.png";
             }}
           />
           <input 
             type="file" 
             accept="image/*" 
             onChange={this.handleImageSelect}
             id="profileImageInput"
           />
           <label htmlFor="profileImageInput" style={{ cursor: 'pointer' }}>
             <span className='fas fa-camera'></span>
           </label>
          </div>

          {/* 사용자 정보 */}
          <FlexPanel>
            <LFloatArea>
              <Label value="사용자ID" />
            </LFloatArea>
            <Textfield
              {...this.state.textFieldProps.iptUserId}
            />
          </FlexPanel>
          
          <FlexPanel>
            <LFloatArea>
              <Label value="이름" />
            </LFloatArea>
            <Textfield
              {...this.state.textFieldProps.iptUserName}
            />
          </FlexPanel>
          
          <FlexPanel>
            <LFloatArea>
              <Label value="소속" />
            </LFloatArea>
            <Textfield
              {...this.state.textFieldProps.iptOgnzCd}
            />
          </FlexPanel>
          
          <div className='divider'></div>
          
          <FlexPanel>
            <LFloatArea>
              <Label value="권한" />
            </LFloatArea>
            <Textfield
              {...this.state.textFieldProps.iptAuthrtCd}
            />
          </FlexPanel>
          
          {/* CTI ID·내선번호·로그인IP·상담어시스트 자동실행여부는 사용자 지시(2026-09-02)로 제거 —
              admin(계약담당자 콘솔)에는 상담용 CTI 항목이 의미가 없다 */}
          <div className='divider'></div>
          <FlexPanel style={{justifyContent: 'flex-end', width: '100%'}}>
            <div className='scrm-password-change-btn'>
							<button id = 'btnChgPasswd' onClick = {this.handleButtonClick}>{'비밀번호 변경'}</button>
					  </div>
          </FlexPanel>
        </ComponentPanel>
      </FullPanel>
    );
  }
}

export default View;
