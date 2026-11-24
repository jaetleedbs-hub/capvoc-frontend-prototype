import React from 'react';

// 1. 레이아웃 컴포넌트
import { ComponentPanel, FlexPanel, FullPanel, SubFullPanel, BottomPanel, RelativeGroup, RFloatArea, LFloatArea } from 'components';
// 2. UI 컴포넌트
import { Label, Textfield, Selectbox, Checkbox, Radio, Table } from 'components';
// 3. 버튼 컴포넌트
import { BasicButton as Button } from 'components';
// 4. 공통 라이브러리
import { ComLib, DataLib, StrLib, TransManager, newScrmObj } from 'common';

/**
 * @class SYS5020
 * @classdesc 비밀번호정책관리
 * @author NEXSIS 개발팀
 */
class View extends React.Component {
  constructor() {
    super();

    this.state = {
      // 데이터셋
      dsPolicy: DataLib.datalist.getInstance(),

      // 버튼 Props
      btnProps: {
        btnSave: {
          id: 'btnSave',
          disabled: false,
          value: '저장',
          hidden: false,
          color: 'blue',
          size: 'md',
          fiiled: true,
          className: 'icon-act'
        }
      },

      // 셀렉트박스 Props
      selectboxProps: {
        selChgCycl: {
          id: 'selChgCycl',
          value: '30',
          dataset: [
            { value: '30', name: '30일' },
            { value: '60', name: '60일' },
            { value: '90', name: '90일' },
            { value: '180', name: '180일' },
            { value: '365', name: '365일' }
          ],
          width: 120,
          selected: 0,
          disabled: false
        },
        selMaxLgnTry: {
          id: 'selMaxLgnTry',
          value: '3',
          dataset: [
            { value: '3', name: '3회' },
            { value: '5', name: '5회' },
            { value: '10', name: '10회' }
          ],
          width: 120,
          selected: 0,
          disabled: false
        }
      },

      // 텍스트필드 Props
      textFieldProps: {
        iptMinPswdLen: {
          id: 'iptMinPswdLen',
          name: 'iptMinPswdLen',
          value: '5',
          placeholder: '최소 길이 입력',
          type: 'onlyNum',
          maxLength: 2,
          readOnly: false,
          disabled: false
        },
        iptPswdFrbd: {
          id: 'iptPswdFrbd',
          name: 'iptPswdFrbd',
          value: 'ABC',
          placeholder: '금칙어 입력',
          type: 'text',
          maxLength: 200,
          readOnly: false,
          disabled: false
        }
      },

      // 라디오 버튼 Props (직전 비밀번호 허용/비허용)
      radioProps: {
        rdoPrvsPswd: {
          id: 'rdoPrvsPswd',
          name: 'rdoPrvsPswd',
          selected: 'Y',  // Y: 허용, N: 비허용
          keyProp: 'keyProp',  // 실제 값을 담는 필드명
          value: 'value',       // 표시 텍스트를 담는 필드명
          dataset: [
            { keyProp: 'Y', value: '허용' },
            { keyProp: 'N', value: '비허용' }
          ],
          disabled: false
        }
      },

      // 체크박스 Props (비밀번호 포함 옵션)
      checkboxProps: {
        chkPswdIncNum: {
          id: 'chkPswdIncNum',
          index: 0,
          value: '숫자',
          keyProp: 'PSWD_INC_NUM',
          checked: 'Y',
          readOnly: false
        },
        chkPswdIncUpp: {
          id: 'chkPswdIncUpp',
          index: 1,
          value: '대문자',
          keyProp: 'PSWD_INC_UPP',
          checked: 'Y',
          readOnly: false
        },
        chkPswdIncLow: {
          id: 'chkPswdIncLow',
          index: 2,
          value: '소문자',
          keyProp: 'PSWD_INC_LOW',
          checked: 'Y',
          readOnly: false
        },
        chkPswdIncSpc: {
          id: 'chkPswdIncSpc',
          index: 3,
          value: '특수문자',
          keyProp: 'PSWD_INC_SPC',
          checked: 'Y',
          readOnly: false
        }
      }
    };
  }

  /*------------------------------------------------------------------------------------------------*
   * React 라이프 사이클
   *------------------------------------------------------------------------------------------------*/
  componentDidMount() {


    // 팝업 창 크기 자동 조정 (현재 컴포넌트 참조 전달)
    ComLib.resizePopupAfterLoad({
      width: 500,
      height: 400,
      center: true
    }, this);


    // 초기 데이터 로드
    if (this.validation('SYS5020R01')) {
      this.transaction('SYS5020R01');
    }
  }

  /*------------------------------------------------------------------------------------------------*
   * 데이터 처리
   *------------------------------------------------------------------------------------------------*/
  validation = (transId) => {
    switch (transId) {
      case 'SYS5020R01':
        // 조회 시 유효성 검증
        break;

      case 'SYS5020U01':
        // 저장 시 유효성 검증
        if (StrLib.isNull(this.state.textFieldProps.iptMinPswdLen.value)) {
          ComLib.openDialog('A', 'SYSI0010', ['비밀번호 최소 길이는 필수 입력 항목입니다.']);
          return false;
        }

        if (parseInt(this.state.textFieldProps.iptMinPswdLen.value) < 4) {
          ComLib.openDialog('A', 'SYSI0010', ['비밀번호 최소 길이는 4자 이상이어야 합니다.']);
          return false;
        }

        // 비밀번호 포함 옵션 중 하나 이상 체크 확인
        if (this.state.checkboxProps.chkPswdIncNum.checked !== 'Y' &&
          this.state.checkboxProps.chkPswdIncUpp.checked !== 'Y' &&
          this.state.checkboxProps.chkPswdIncLow.checked !== 'Y' &&
          this.state.checkboxProps.chkPswdIncSpc.checked !== 'Y') {
          ComLib.openDialog('A', 'SYSI0010', ['포함할 비밀번호 구성을 하나 이상 선택해야 합니다.']);
          return false;
        }
        break;

      default:
        break;
    }
    return true;
  };

  transaction = (transId) => {
    let transManager = new TransManager();

    try {
      switch (transId) {
        case 'SYS5020R01':
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/pswd-plcy/r01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: '',
            datasetrecv: 'dsPolicy'
          });
          transManager.agent();
          break;

        case 'SYS5020U01':
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/cmm/pswd-plcy/u01");
          transManager.setCallBack(this.callback);
          transManager.addConfig({
            datasetsend: 'dsPolicy',
            datasetrecv: ''
          });

          // 저장 데이터 구성
          let policyData = {
            pswdChgCycCnt: parseInt(this.state.selectboxProps.selChgCycl.value),
            lgnTryPsbltyCnt: parseInt(this.state.selectboxProps.selMaxLgnTry.value),
            pswdReuseYn: this.state.radioProps.rdoPrvsPswd.selected,
            pswdMinLen: parseInt(this.state.textFieldProps.iptMinPswdLen.value),
            pswdUcReqYn: this.state.checkboxProps.chkPswdIncUpp.checked,
            pswdLcReqYn: this.state.checkboxProps.chkPswdIncLow.checked,
            pswdNumReqYn: this.state.checkboxProps.chkPswdIncNum.checked,
            pswdSpcCharReqYn: this.state.checkboxProps.chkPswdIncSpc.checked,
            pswdDenyChar: this.state.textFieldProps.iptPswdFrbd.value
          };

          console.log(policyData);
          transManager.setFormData(policyData);
          transManager.agent();
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('Transaction Error:', err);
    }
  };

  callback = (res) => {
    console.log(res);
    if (res.result) {
      switch (res.id) {
        case 'SYS5020R01':
          // 조회 결과 처리

          console.log(res.data);

          if (res.data) {
            const policyData = res.data;
            console.log(policyData);

            // 조회된 데이터를 state에 반영 (백엔드 필드명에 맞춰 매핑)
            this.setState({
              ...this.state,
              selectboxProps: {
                ...this.state.selectboxProps,
                selChgCycl: {
                  ...this.state.selectboxProps.selChgCycl,
                  value: policyData.pswdChgCycCnt !== null && policyData.pswdChgCycCnt !== undefined ? policyData.pswdChgCycCnt.toString() : '30'
                },
                selMaxLgnTry: {
                  ...this.state.selectboxProps.selMaxLgnTry,
                  value: policyData.lgnTryPsbltyCnt !== null && policyData.lgnTryPsbltyCnt !== undefined ? policyData.lgnTryPsbltyCnt.toString() : '3'
                }
              },
              textFieldProps: {
                ...this.state.textFieldProps,
                iptMinPswdLen: {
                  ...this.state.textFieldProps.iptMinPswdLen,
                  value: policyData.pswdMinLen !== null && policyData.pswdMinLen !== undefined ? policyData.pswdMinLen.toString() : '5'
                },
                iptPswdFrbd: {
                  ...this.state.textFieldProps.iptPswdFrbd,
                  value: policyData.pswdDenyChar !== null && policyData.pswdDenyChar !== undefined ? policyData.pswdDenyChar : 'ABC'
                }
              },
              radioProps: {
                ...this.state.radioProps,
                rdoPrvsPswd: {
                  ...this.state.radioProps.rdoPrvsPswd,
                  selected: policyData.pswdReuseYn === 'Y' ? 'Y' : 'N'
                }
              },
              checkboxProps: {
                ...this.state.checkboxProps,
                chkPswdIncNum: {
                  ...this.state.checkboxProps.chkPswdIncNum,
                  checked: policyData.pswdNumReqYn === 'Y' ? 'Y' : 'N'
                },
                chkPswdIncUpp: {
                  ...this.state.checkboxProps.chkPswdIncUpp,
                  checked: policyData.pswdUcReqYn === 'Y' ? 'Y' : 'N'
                },
                chkPswdIncLow: {
                  ...this.state.checkboxProps.chkPswdIncLow,
                  checked: policyData.pswdLcReqYn === 'Y' ? 'Y' : 'N'
                },
                chkPswdIncSpc: {
                  ...this.state.checkboxProps.chkPswdIncSpc,
                  checked: policyData.pswdSpcCharReqYn === 'Y' ? 'Y' : 'N'
                }
              }
            });
          }
          break;

        case 'SYS5020U01':
          // 저장 결과 처리
          ComLib.openDialog('A', 'SYSI0010', ['저장되었습니다.']);
          // 재조회
          if (this.validation('SYS5020R01')) {
            this.transaction('SYS5020R01');
          }
          break;

        default:
          break;
      }
    } else {
      ComLib.openDialog('A', 'SYSI0010', ['처리 중 오류가 발생했습니다.']);
    }
  };

  /*------------------------------------------------------------------------------------------------*
   * 이벤트 핸들러
   *------------------------------------------------------------------------------------------------*/
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;

        switch (btnId) {
          case 'btnSave':
            if (this.validation('SYS5020U01')) {
              this.transaction('SYS5020U01');
            }
            break;

          default:
            break;
        }
      }
    },

    input: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;

        this.setState({
          ...this.state,
          textFieldProps: {
            ...this.state.textFieldProps,
            [fieldId]: {
              ...this.state.textFieldProps[fieldId],
              value: value
            }
          }
        });
      }
    },

    selectbox: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;

        this.setState({
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [fieldId]: {
              ...this.state.selectboxProps[fieldId],
              value: value
            }
          }
        });
      }
    },

    radio: {
      onChange: (e) => {
        let fieldId = e.id;
        let value = e.value;

        this.setState({
          ...this.state,
          radioProps: {
            ...this.state.radioProps,
            [fieldId]: {
              ...this.state.radioProps[fieldId],
              selected: value
            }
          }
        });
      }
    },

    checkbox: {
      onChange: (e) => {
        console.log('체크박스 onChange 이벤트:', e);
        console.log('현재 this.state:', this.state);

        let fieldId = e.id;
        let checked = e.checked ? 'Y' : 'N';

        console.log('체크박스 처리:', { fieldId, checked });

        // 일반 체크박스 처리 (비밀번호 포함 옵션)
        this.setState({
          ...this.state,
          checkboxProps: {
            ...this.state.checkboxProps,
            [fieldId]: {
              ...this.state.checkboxProps[fieldId],
              checked: checked
            }
          }
        }, () => {
          console.log('체크박스 setState 완료 후:', this.state.checkboxProps[fieldId]);
        });
      }
    }
  };

  /*------------------------------------------------------------------------------------------------*
   * 렌더링
   *------------------------------------------------------------------------------------------------*/
  render() {
    console.log(this.state.selectboxProps.selChgCycl);
    return (
      <FullPanel>
        <SubFullPanel>
          <RelativeGroup>
            <LFloatArea>
              <h3>비밀번호 제약</h3>
            </LFloatArea>
          </RelativeGroup>
          <div className="tb_no-border mb20">
            <Table
              id="tblPasswordConstraint"
              colGrp={[
                { width: '25%' }, { width: '75%' }
              ]}
              tbData={[
                [
                  { type: 'T', value: '변경주기' },
                  {
                    type: 'D', value: (
                      <Selectbox {...this.state.selectboxProps.selChgCycl} onChange={this.event.selectbox.onChange} />
                    )
                  }
                ],
                [
                  { type: 'T', value: '최대 로그인 시도 수' },
                  {
                    type: 'D', value: (
                      <Selectbox {...this.state.selectboxProps.selMaxLgnTry} onChange={this.event.selectbox.onChange} />
                    )
                  }
                ],
                [
                  { type: 'T', value: '직전 비밀번호 허용' },
                  {
                    type: 'D', value: (
                      <Radio {...this.state.radioProps.rdoPrvsPswd} onChange={this.event.radio.onChange} />
                    )
                  }
                ]
              ]}
            />
          </div>

          <SubFullPanel>
            <RelativeGroup>
              <LFloatArea>
                <h3>비밀번호 구성</h3>
              </LFloatArea>
            </RelativeGroup>
            <div className="tb_no-border">
              <Table
                id="tblPasswordComposition"
                colGrp={[
                  { width: '25%' }, { width: '75%' }
                ]}
                tbData={[
                  [
                    { type: 'T', value: '비밀번호 최소 길이' },
                    {
                      type: 'D', value: (
                        <Textfield {...this.state.textFieldProps.iptMinPswdLen} onChange={this.event.input.onChange} />
                      )
                    }
                  ],
                  [
                    { type: 'T', value: '비밀번호 포함' },
                    {
                      type: 'D', value: (
                        <FlexPanel>
                          <Checkbox {...this.state.checkboxProps.chkPswdIncNum} onChange={this.event.checkbox.onChange} />
                          <Checkbox {...this.state.checkboxProps.chkPswdIncUpp} onChange={this.event.checkbox.onChange} />
                          <Checkbox {...this.state.checkboxProps.chkPswdIncLow} onChange={this.event.checkbox.onChange} />
                          <Checkbox {...this.state.checkboxProps.chkPswdIncSpc} onChange={this.event.checkbox.onChange} />
                        </FlexPanel>
                      )
                    }
                  ],
                  [
                    { type: 'T', value: '비밀번호 금칙어' },
                    {
                      type: 'D', value: (
                        <Textfield {...this.state.textFieldProps.iptPswdFrbd} onChange={this.event.input.onChange} />
                      )
                    }
                  ]
                ]}
              />
            </div>
          </SubFullPanel>

          {/* 액션 버튼 영역 */}
          <BottomPanel>
            <RelativeGroup>
              <RFloatArea>
                <Button {...this.state.btnProps.btnSave} onClick={this.event.button.onClick} />
              </RFloatArea>
            </RelativeGroup>
          </BottomPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View; 