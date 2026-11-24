/*******************************************************************
 * COM0020 비밀번호변경
 * 
 * 기능:
 * 1. 로그인된 사용자의 비밀번호 변경
 * 2. 현재 비밀번호 확인 후 새로운 비밀번호로 변경
 * 3. 변경 성공 시 자동 로그아웃 처리
 * 
 * 컴포넌트:
 * - TextPasswdfield: 비밀번호 입력 필드
 * - BasicButton: 변경/취소 버튼
 * - ComponentPanel, FullPanel: 레이아웃
 *******************************************************************/
import React from 'react';
import { ComLib, TransManager } from 'common';
import { 
  ComponentPanel, 
  FullPanel, 
  FlexPanel,
  RelativeGroup,
  RFloatArea,
  Label, 
  TextPasswdfield, 
  BasicButton,
  LFloatArea,
  Textfield,
  Table
} from 'components';
import './ChangePw.css';

class View extends React.Component {
  /*******************************************************************
   * Constructor
   *******************************************************************/
  constructor(props) {
    super(props);
    const passwordChange = ComLib.getSession('passwordChange') || ComLib.getSession('gdsUserInfo') || '';
    this.userId = passwordChange.userId || props.options?.param[0]?.USR_CD || ''; // 인스턴스 변수로 저장
    ComLib.removeSession('passwordChange');
    this.state = {
      // UI Props 관리
      textFieldProps: {
        iptUserIdPopup: {
          id: 'iptUserIdPopup',
          name: 'iptUserIdPopup ',
          value: this.userId,
          placeholder: '사용자ID를 입력하세요',
          maxLength: 20,
          readOnly: true,
          disabled: true
        },
        iptCurrentPassword: {
          id: 'iptCurrentPassword',
          name: 'iptCurrentPassword',
          value: '',
          placeholder: '현재 비밀번호를 입력하세요',
          maxLength: 20,
          minLength: 6,
          readOnly: false,
          disabled: false
        },
        iptNewPassword: {
          id: 'iptNewPassword',
          name: 'iptNewPassword',
          value: '',
          placeholder: '새 비밀번호를 입력하세요',
          maxLength: 20,
          minLength: 8,
          readOnly: false,
          disabled: false
        },
        iptConfirmPassword: {
          id: 'iptConfirmPassword',
          name: 'iptConfirmPassword',
          value: '',
          placeholder: '새 비밀번호를 다시 입력하세요',
          maxLength: 20,
          minLength: 8,
          readOnly: false,
          disabled: false
        }
      },
      
      btnProps: {
        btnChange: {
          id: 'btnChange',
          disabled: false,
          value: '변경',
          hidden: false,
          color: 'purple',
          size: 'md',
          fiiled: true
        },
        btnCancel: {
          id: 'btnCancel',
          disabled: false,
          value: '취소',
          hidden: false,
          color: 'grey',
          size: 'md',
          fiiled: true
        }
      }
    };
    
    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.input.onKeyPress = this.event.input.onKeyPress.bind(this);
  }

  /*******************************************************************
   * Lifecycle Methods
   *******************************************************************/
  componentDidMount() {

    // 팝업 창 크기 자동 조정 (현재 컴포넌트 참조 전달)
    ComLib.resizePopupAfterLoad({
      width: 400,
      height: 245,
      center: true 
    }, this);

    // 포커스 설정
    setTimeout(() => {
      const currentPasswordField = document.getElementById('iptCurrentPassword');
      if (currentPasswordField) {
        currentPasswordField.focus();
      }
    }, 100);
  }

  /*******************************************************************
   * Event Handlers
   *******************************************************************/
  event = {
    button: {
      onClick: (e) => {
        const btnId = e.target.id || e.currentTarget.id;
        
        switch (btnId) {
          case 'btnChange':
            if (this.validation('COM0020U01')) {
              this.transaction('COM0020U01');
            }
            break;
            
          case 'btnCancel':
            this.handleCancel();
            break;
            
          default:
            break;
        }
      }
    },
    
    input: {
      onChange: (e) => {
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
      },
      
      onKeyPress: (e) => {
        if (e.key === 'Enter') {
          if (this.validation('COM0020U01')) {
            this.transaction('COM0020U01');
          }
        }
      }
    }
  };

  /*******************************************************************
   * Validation
   *******************************************************************/
  validation = (serviceid) => {
    switch (serviceid) {
      case 'COM0020U01':

        if(this.state.textFieldProps.iptCurrentPassword.value === '') {
          ComLib.openAlertDialog('현재 비밀번호를 입력해 주십시오.');
          return false;
        }
        if(this.state.textFieldProps.iptNewPassword.value === '') {
          ComLib.openAlertDialog('새 비밀번호를 입력해 주십시오.');
          return false;
        }
        if(this.state.textFieldProps.iptConfirmPassword.value === '') {
          ComLib.openAlertDialog('새 비밀번호 확인을 입력해 주십시오.');
          return false;
        }

        if(this.state.textFieldProps.iptCurrentPassword.value === this.state.textFieldProps.iptNewPassword.value) {
          ComLib.openAlertDialog('현재 비밀번호와 바꿀 비밀번호가 같습니다.');
          return false;
        }

        if(this.state.textFieldProps.iptNewPassword.value.includes(this.userId)) {
          ComLib.openAlertDialog('비밀번호에 아이디가 포함되지 않도록 작성해 주십시오.')
          return false;
        }
        if(this.state.textFieldProps.iptNewPassword.value !== this.state.textFieldProps.iptConfirmPassword.value) {
          ComLib.openAlertDialog('새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  /*******************************************************************
   * Set Data
   *******************************************************************/

  /*******************************************************************
   * Transaction
   *******************************************************************/
  transaction = (serviceid) => {
    let transManager = new TransManager();
    
    try {
      switch (serviceid) {
        case 'COM0020U01':
          const passwordData = {
            currentPassword: this.state.textFieldProps.iptCurrentPassword.value,
            newPassword: this.state.textFieldProps.iptNewPassword.value,
            confirmPassword: this.state.textFieldProps.iptConfirmPassword.value,
            userId: ComLib.getSession('passwordChange')?.userId || ComLib.getSession('gdsUserInfo')?.userId || this.state.textFieldProps.iptUserIdPopup.value || ''
          };	
        
          transManager.post('/api/auth/password/u01', passwordData, (res) => {
            // 로그인 시도 횟수 초과시 431 에러
            if (res.data.status === 431) {
              ComLib.openAlertDialog(res.data.message, () => {
                this.handleLogout();
              })
            } else {
              this.callback(res);
            }
          });
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error(err);
      ComLib.openAlertDialog('처리 중 오류가 발생했습니다.');
    }
  };

  /*******************************************************************
   * Callback
   *******************************************************************/
  callback = (res) => {
        const data = (res && res.data) || {};
        // 성공 판정: 서버가 내려준 결과 코드(resultCode)로 판단 (한글 메시지 부분일치 제거)
        if (res.result === 'success' && data.resultCode === 'SUCCESS') {
          ComLib.openAlertDialog(data.message, () => {
            this.handleLogout();
          });
        } else {
          // 실패 시 오류 메시지 표시
          const errorMessage = data.message || '비밀번호 변경에 실패했습니다.';
          ComLib.openAlertDialog(errorMessage);

          // 실패 필드 포커스 이동: 결과 코드 → 입력 필드 매핑
          const focusFieldByCode = {
            MISSING_CURRENT: 'iptCurrentPassword',
            SAME_AS_CURRENT: 'iptCurrentPassword',
            MISSING_NEW: 'iptNewPassword',
            CONFIRM_MISMATCH: 'iptConfirmPassword',
            MISSING_CONFIRM: 'iptConfirmPassword',
          };
          const focusId = focusFieldByCode[data.resultCode];
          if (focusId) {
            const el = document.getElementById(focusId);
            if (el) el.focus();
          }
        }
  };

  /*******************************************************************
   * User Functions
   *******************************************************************/
  
  // 취소 처리
  handleCancel = () => {
    // ComLib.openConfirmDialog('비밀번호 변경을 취소하시겠습니까?', (confirmed) => {
      // if (confirmed) {
        this.clearForm();
        // 팝업이면 닫기, 일반 화면이면 이전 화면으로
        if (this.props.onClose) {
          this.props.onClose();
        } else {
          window.history.back();
        }
      // }
    // });
  };
  
  // 폼 초기화
  clearForm = () => {
    this.setState(prevState => ({
      textFieldProps: {
        ...prevState.textFieldProps,
        iptCurrentPassword: { ...prevState.textFieldProps.iptCurrentPassword, value: '' },
        iptNewPassword: { ...prevState.textFieldProps.iptNewPassword, value: '' },
        iptConfirmPassword: { ...prevState.textFieldProps.iptConfirmPassword, value: '' }
      }
    }));
  };
  
  // 로그아웃 처리
  handleLogout = () => {
    ComLib.clearSession();
    ComLib.setSession("logoutComplete", true);
    window.location = '/';
  };

  /*******************************************************************
   * Render
   *******************************************************************/
  render() {
    const { textFieldProps, btnProps } = this.state;
    
    return (
      <FullPanel>
        <ComponentPanel className="change-password-popup">
          <Table  
            id="passwordChangeTable" 
            colGrp={[
              {width: '15%'}, {width: '85%'}
            ]}
            tbData={[
              [
                {type: 'T', value: '사용자ID', colSpan: 1, rowSpan: 1 },
                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                  <Textfield
                    {...this.state.textFieldProps.iptUserIdPopup}
                    onChange={this.handleInputChange}
                  />
                )}
              ],
              [
                {type: 'T', value: '현재 비밀번호', colSpan: 1, rowSpan: 1 },
                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                  <TextPasswdfield 
                    {...textFieldProps.iptCurrentPassword}
                    onChange={this.event.input.onChange}
                    onKeyPress={this.event.input.onKeyPress}
                  />
                )}
              ],
              [
                {type: 'T', value: '새 비밀번호', colSpan: 1, rowSpan: 1 },
                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                  <TextPasswdfield 
                    {...textFieldProps.iptNewPassword}
                    onChange={this.event.input.onChange}
                    onKeyPress={this.event.input.onKeyPress}
                  />
                )}
              ],
              [
                {type: 'T', value: '새 비밀번호 확인', colSpan: 1, rowSpan: 1 },
                {type: 'D', colSpan: 1, rowSpan: 1, value: (
                  <TextPasswdfield 
                    {...textFieldProps.iptConfirmPassword}
                    onChange={this.event.input.onChange}
                    onKeyPress={this.event.input.onKeyPress}	
                  />
                )}
              ]
            ]}
          />
        </ComponentPanel>
        {/* 버튼 영역 */}
        <ComponentPanel>
          <RelativeGroup>
            <RFloatArea>
              <BasicButton 
                {...btnProps.btnCancel}
                onClick={this.event.button.onClick}
              />
              <BasicButton 
                {...btnProps.btnChange}
                onClick={this.event.button.onClick}
              />
            </RFloatArea>
          </RelativeGroup>
        </ComponentPanel>
      </FullPanel>
    );
  }
}

export default View;
