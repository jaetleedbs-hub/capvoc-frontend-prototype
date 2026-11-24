import React from 'react';
import { SubFullPanel, BasicButton, Textfield, Textarea, Selectbox, Checkbox, InputCalendar, Label, RelativeGroup, RFloatArea, FlexPanel, LFloatArea, FullPanel, Table } from 'components';
import { ComLib, DataLib, TransManager, DateLib, newScrmObj } from 'common';

class View extends React.Component {
  constructor(props) {
    super(props);

    this.folders = (this.props.options)? this.props.options.folders : null;
    this.memoData = (this.props.options)? this.props.options.memoData : null;
    this.state = {
      // 데이터셋
      dsMemoCategory: [],

      // 알림 설정 활성화 여부
      alarmEnabled: false,

      formData: {
        memoCtgySid: 0,
        memoCtgyNm: '',
        memoTtlNm: '',
        memoCn: '',
        memoAlrmYn: 'N',
        memoAlrmDt: '',
      },

      // 버튼 Props
      btnProps: {
        btnNew: {
          id: 'btnNew',
          disabled: false,
          value: '신규',
          hidden: false,
          color: 'green',
          size: 'md',
          fiiled: true
        },
        btnSave: {
          id: 'btnSave',
          disabled: false,
          value: '저장',
          hidden: false,
          color: 'purple',
          size: 'md',
          fiiled: true
        }
      },

      // 텍스트 필드 Props
      textFieldProps: {
        iptMemoTitle: {
          id: 'iptMemoTitle',
          value: '',
          placeholder: '제목을 입력하세요',
          maxLength: 100,
          readOnly: false,
          disabled: false
        }
      },

      // 텍스트영역 Props
      textAreaProps: {
        txtMemoContent: {
          id: 'txtMemoContent',
          value: '',
          placeholder: '내용을 입력하세요.',
          maxLength: 1000,
          rows: 5,
          readOnly: false,
          disabled: false
        }
      },
      // 체크박스 Props
      checkboxProps: {
        chkAlarmSetting: {
          id: 'chkAlarmSetting',
          value: '알림설정',
          keyProp: 'ALARM_SETTING',
          checked: 'N',
          disabled: false
        }
      },
      // 셀렉트박스 Props
      selectboxProps: {
        selMemoFolder: {
          id: 'selMemoFolder',
          value: '',
          dataset: [
            { value: '', name: '폴더를 선택하세요' },
          ],
          width: 200,
          selected: 0,
          disabled: false
        },
        selAlarmTimeHour: {
          id: 'selAlarmTimeHour',
          value: '',
          dataset: ComLib.convComboList(
            ComLib.getCommCodeList("UI_ALRM_HOUR"),
            newScrmObj.constants.select.argument.all
        ),
          width: 120,
          selected: 0,
          disabled: true,
        },
        selAlarmTimeMinute: {
          id: 'selAlarmTimeMinute',
          value: '',
          dataset: ComLib.convComboList(
            ComLib.getCommCodeList("UI_ALRM_TM"),
            newScrmObj.constants.select.argument.all
        ),
          width: 120,
          selected: 0,
          disabled: true,
        }
      },
      calendarDate: DateLib.getToday(),
    };

    // 이벤트 바인딩 (프로젝트 표준 패턴)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.inputcalendar.onChange = this.event.inputcalendar.onChange.bind(this);
    this.onAlarmSettingChange = this.onAlarmSettingChange.bind(this);
    this.onNewClick = this.onNewClick.bind(this);
    this.onSaveClick = this.onSaveClick.bind(this);
  }

  componentDidMount() {
    // 팝업 창 크기 자동 조정 (현재 컴포넌트 참조 전달)
    ComLib.resizePopupAfterLoad({
      width: 450,
      height: 330,
      center: true 
    }, this);

    if(this.folders) {
      this.prMemoCategoryList(this.folders);
    } else {
      this.trGetMemoCategoryList();
    }

    if (this.memoData) {
      // 알람 날짜는 앞에서 8글자만 추출
      const memoAlrmDt = this.memoData.memoAlrmDt.substring(0, 8);
      // 알람 시간은 뒤에서 6글자만 추출하고 뒤에 00을 제거, 2글자는 시간, 2글자는 분
      const memoAlrmTime = this.memoData.memoAlrmDt.substring(8, 14).replace(/00$/, '').replace(/^(\d{2})(\d{2})$/, '$1:$2');
      const timeValueHour = memoAlrmTime.split(':')[0];
      const timeValueMinute = memoAlrmTime.split(':')[1];
      this.setState({
        formData: {
          memoCtgySid: this.memoData.memoCtgySid,
          memoCtgyNm: this.memoData.memoCtgyNm,
          memoTtlNm: this.memoData.memoTtlNm,
          memoCn: this.memoData.memoCn,
          memoAlrmYn: this.memoData.memoAlrmYn,
          memoAlrmDt: this.memoData.memoAlrmDt,
        },
        selectboxProps: {
          ...this.state.selectboxProps,
          selMemoFolder: {
            ...this.state.selectboxProps.selMemoFolder,
            value: this.memoData.memoCtgySid,
            selected: this.memoData.memoCtgySid
          },
          selAlarmTimeHour: {
            ...this.state.selectboxProps.selAlarmTimeHour,
            value: timeValueHour,
            selected: 0,
            disabled: this.memoData.memoAlrmYn === 'N'
          },
          selAlarmTimeMinute: {
            ...this.state.selectboxProps.selAlarmTimeMinute,
            value: timeValueMinute,
            selected: 0,
            disabled: this.memoData.memoAlrmYn === 'N'
          }
        },
        textFieldProps: {
          ...this.state.textFieldProps,
          iptMemoTitle: {
            ...this.state.textFieldProps.iptMemoTitle,
            value: this.memoData.memoTtlNm
          }
        },
        textAreaProps: {
          ...this.state.textAreaProps,
          txtMemoContent: {
            ...this.state.textAreaProps.txtMemoContent,
            value: this.memoData.memoCn
          }
        },
        calendarDate: memoAlrmDt,
        checkboxProps: {
          ...this.state.checkboxProps,
          chkAlarmSetting: {
            ...this.state.checkboxProps.chkAlarmSetting,
            checked: this.memoData.memoAlrmYn
          }
        }
      })
    }
  } 

  trGetMemoCategoryList = () => {
    TransManager.get('/api/sup/memo/r03', null, (res) => {
      if (ComLib.handleResponse(res, 'get')) {
        this.prMemoCategoryList(res.data);
      }
    });
  }

  prMemoCategoryList = (data) => {
    const categoryList = this.folders || data || [];
    const folderDataset = [
      { value: 0, name: '폴더를 선택하세요' },
      ...categoryList.filter(item => item.memoCtgySid || item.id !== 0).map(item => ({
        value: item.memoCtgySid || item.id,
        name: item.memoCtgyNm || item.name
      }))
    ];

    this.setState({
      dsMemoCategory: folderDataset,
      selectboxProps: {
        ...this.state.selectboxProps,
        selMemoFolder: {
          ...this.state.selectboxProps.selMemoFolder,
          dataset: folderDataset
        }
      }
    });
  }

  validation = (...params) => {
    const transId = params[0];

    switch (transId) {
      case 'COM2080U01':
        // 메모제목 필수 검증
        if (!this.state.textFieldProps.iptMemoTitle.value.trim()) {
          ComLib.openAlertDialog('메모제목을 입력하세요.');
          document.getElementById('iptMemoTitle').focus();
          return false;
        }

        // 메모제목 길이 검증
        if (this.state.textFieldProps.iptMemoTitle.value.length > 100) {
          ComLib.openAlertDialog('메모제목은 100자 이내로 입력하세요.');
          return false;
        }

        // 메모내용 필수 검증
        if (!this.state.textAreaProps.txtMemoContent.value.trim()) {
          ComLib.openAlertDialog('메모내용을 입력하세요.');
          document.getElementById('txtMemoContent').focus();
          return false;
        }

        // 메모내용 길이 검증
        if (this.state.textAreaProps.txtMemoContent.value.length > 1000) {
          ComLib.openAlertDialog('메모내용은 1000자 이내로 입력하세요.');
          return false;
        }

        // 알림설정이 체크된 경우 날짜와 시간 검증
        if (this.state.checkboxProps.chkAlarmSetting.checked === 'Y') {
          if (!this.state.calendarDate) {
            ComLib.openAlertDialog('알림 날짜를 선택하세요.');
            return false;
          }

          if (!this.state.selectboxProps.selAlarmTimeHour.value) {
            ComLib.openAlertDialog('알림 시간을 선택하세요.');
            return false;
          }
          
          if (!this.state.selectboxProps.selAlarmTimeMinute.value) {
            ComLib.openAlertDialog('알림 시간을 선택하세요.');
            return false;
          }
        }

        return true;

      default:
        return true;
    }
  };

  transaction = (...params) => {
    const transId = params[0];

    switch (transId) {
      case 'COM2080U01':
        try {
          const transManager = new TransManager();
          transManager.setTransId(transId);
          transManager.setTransUrl('/api/sup/memo/u01');

          const timeValueHour = this.state.selectboxProps.selAlarmTimeHour.value;
          const timeValueMinute = this.state.selectboxProps.selAlarmTimeMinute.value;

          // memoAlrmDt는 알람 날짜와 시간을 합치고 특수문자를 제거, 14자리 형식(YYYYMMDDHHMISS)으로 구성
          const timeValue = timeValueHour + timeValueMinute
          const memoAlrmDt = this.state.checkboxProps.chkAlarmSetting.checked === 'Y' ? this.state.calendarDate + timeValue + '00' : '';

          // 요청 데이터 구성
          const requestData = {
            userId: ComLib.getSession('gdsUserInfo').userId,
            action: this.memoData ? 'UPDATE' : 'INSERT',
            memoSid: this.memoData ? this.memoData.memoSid : null,
            memoCtgySid: this.state.formData.memoCtgySid,
            // 수정 모드에서 폴더 변경 시 기존 폴더 정보도 전달
            originalMemoCtgySid: this.memoData ? this.memoData.memoCtgySid : null,
            memoTtlNm: this.state.textFieldProps.iptMemoTitle.value,  
            memoCn: this.state.textAreaProps.txtMemoContent.value,
            memoAlrmYn: this.state.checkboxProps.chkAlarmSetting.checked,
            memoAlrmDt: this.state.checkboxProps.chkAlarmSetting.checked === 'Y' ? memoAlrmDt : ''
          };

          TransManager.post('/api/sup/memo/u01', requestData, (res) => {
            if (ComLib.handleResponse(res, 'save')) {
              this.callback(res);
            }
          });

        } catch (error) {
          console.error('트랜잭션 오류:', error);
          ComLib.openAlertDialog('시스템 오류가 발생했습니다.', 'error');
        }
        break;

      default:
        break;
    }
  };

  callback = (res) => {
    if (res && res.result === 'success') {
      ComLib.openAlertDialog(res.message || '처리가 완료되었습니다.', 'success');

      // 팝업 닫기
      if (this.props.onClose) {
        this.props.onClose();
      }
    
      this.onNewClick();
      window.dispatchEvent(new CustomEvent('memoSave'));

    } else {
      ComLib.openAlertDialog(res.message || '처리 중 오류가 발생했습니다.', 'error');
    }
  };

  event = {
    button: {
      onClick: (e) => {
        const { id } = e.target;

        switch (id) {
          case 'btnNew':
            this.onNewClick();
            break;
          case 'btnSave':
            this.onSaveClick();
            break;
          default:
            break;
        }
      }
    },
    input: {
      onChange: (e) => {
        const { id, value } = e.target;

        if (id === 'iptMemoTitle') {
          this.setState(prevState => ({
            formData: {
              ...prevState.formData,
              memoTtlNm: value
            }
          }));
        } else if (id === 'txtMemoContent') {
          this.setState(prevState => ({
            formData: {
              ...prevState.formData,
              memoCn: value
            }
          }));
        }
      }
    },
    inputcalendar: {
      onChange: (e) => {
        // 프로젝트 표준 캘린더 이벤트 처리 패턴
        switch (e.target.id) {
          case 'date':
            this.setState(prevState => ({
              calendarDate: e.target.value
            }));
            break;
          default:
            break;
        }
      }
    }
  };

  handleSelectboxChange = (e) => {
    const { id, value } = e.target;
    const selectedFolder = this.state.dsMemoCategory.find(folder => Number(folder.value) === Number(value));

    if(id === 'selMemoFolder') {
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          memoCtgySid: value,
          memoCtgyNm: selectedFolder.name,
        },
  
        selectboxProps: {
          ...prevState.selectboxProps,
          selMemoFolder: {
            ...prevState.selectboxProps.selMemoFolder,
            value: value,
            selected: selectedFolder.value
          }
        }
      }));
    } else if(id === 'selAlarmTimeHour') {
      this.setState(prevState => ({
        selectboxProps: {
          ...prevState.selectboxProps,
          selAlarmTimeHour: {
            ...prevState.selectboxProps.selAlarmTimeHour,
            value: value
          }
        }
      }));
    } else if(id === 'selAlarmTimeMinute') {
      this.setState(prevState => ({
        selectboxProps: {
          ...prevState.selectboxProps,
          selAlarmTimeMinute: {
            ...prevState.selectboxProps.selAlarmTimeMinute,
            value: value
          }
        }
      }));
    }
  };
  

  handleDateChange = (data) => this.setState({ calendarDate: data.target.value });
  handleInputChange = (e) => {
    const { id, value } = e.target;
    
    this.setState({
      formData: {
        ...this.state.formData,
        [id]: value
      },
      textFieldProps: {
        ...this.state.textFieldProps,
        [id]: { ...this.state.textFieldProps[id], value }
      }
    })
  };
  handleTextareaChange = (e) => {
    const { id, value } = e.target;
    this.setState({
      formData: { ...this.state.formData, [id]: value },
      textAreaProps: { ...this.state.textAreaProps, [id]: { ...this.state.textAreaProps[id], value } }
    });
  };

  // 신규 버튼 클릭
  onNewClick = () => {
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        memoTtlNm: '',
        memoCn: '',
        memoAlrmYn: 'N',
        memoAlrmDt: '',
      },
      textFieldProps: {
        iptMemoTitle: {
          ...prevState.textFieldProps.iptMemoTitle,
          value: ''
        }
      },
      textAreaProps: {
        txtMemoContent: {
          ...prevState.textAreaProps.txtMemoContent,
          value: ''
        }
      },
      selectboxProps: {
        selMemoFolder: {
          ...prevState.selectboxProps.selMemoFolder,
          value: 0,
          selected: 0
        },
        selAlarmTimeHour: {
          ...prevState.selectboxProps.selAlarmTimeHour,
          value: '',
          selected: 0
        },
        selAlarmTimeMinute: {
          ...prevState.selectboxProps.selAlarmTimeMinute,
          value: '',
          selected: 0
        }
      },
      checkboxProps: {
        ...prevState.checkboxProps,
        chkAlarmSetting: {
          ...prevState.checkboxProps.chkAlarmSetting,
          checked: 'N'
        }
      },
      calendarDate: DateLib.getToday(),
      alarmEnabled: false
    }));
  };

  onAlarmSettingChange = (e) => {
    const { checked } = e.target;
    const newAlarmSetting = checked ? 'Y' : 'N';

    this.setState({
      ...this.state,
      checkboxProps: {
        ...this.state.checkboxProps,
        chkAlarmSetting: {
          ...this.state.checkboxProps.chkAlarmSetting,
          checked: newAlarmSetting
        }
      },
      selectboxProps: {
        ...this.state.selectboxProps,
        selAlarmTimeHour: {
          ...this.state.selectboxProps.selAlarmTimeHour,
          disabled: !checked
        },
        selAlarmTimeMinute: {
          ...this.state.selectboxProps.selAlarmTimeMinute,
          disabled: !checked
        },
      },
      calendarDate: DateLib.getToday(),
    })
  };

  // 저장 버튼 클릭
  onSaveClick = () => {
    this.trSaveMemo();
  };

  trSaveMemo = () => {
    if (this.validation('COM2080U01')) {
      this.transaction('COM2080U01');
    }
  };

  render() {
		return (
      <FullPanel>
        <SubFullPanel>
          {/* 메모 기본 정보 */}
          <Table
            id="tblMemoInfo" 
            colGrp={[
              { width: '15%' }, { width: '85%' }
            ]}
            tbData={[
              [
                { type: 'T', value: '메모폴더', className: 'req'},
                { type: 'D', value: (
                  <Selectbox
                    {...this.state.selectboxProps.selMemoFolder}
                    value={this.state.formData.memoCtgySid}
                    dataset={this.state.dsMemoCategory}
                    onChange={this.handleSelectboxChange}
                  />
                )}
              ],
              [
                { type: 'T', value: '메모제목', className: 'req'},
                { type: 'D', value: (
                  <Textfield
                    {...this.state.textFieldProps.iptMemoTitle}
                    onChange={this.handleInputChange}
                  />
                )}
              ],
              [
                { type: 'T', value: '메모내용', className: 'req'},
                { type: 'D',  value: (
                  <Textarea
                    {...this.state.textAreaProps.txtMemoContent}
                    onChange={this.handleTextareaChange}
                  />
                )}
              ],
              [
                { type: 'T', value: (
                  <Checkbox
                    {...this.state.checkboxProps.chkAlarmSetting}
                    onChange={this.onAlarmSettingChange}
                  />
                )},
                { type: 'D', value: (
                  <div style={{
                    opacity: this.state.checkboxProps.chkAlarmSetting.checked === 'Y' ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                    }}>
                    {/* 프로젝트 표준 InputCalendar 사용 */}
                    <InputCalendar 
                      {...this.state.calendarDate}
                      value={this.state.calendarDate} 
                      disabled={this.state.checkboxProps.chkAlarmSetting.checked === 'N'} 
                      onChange={this.handleDateChange} 
                    />
                    <Selectbox
                      {...this.state.selectboxProps.selAlarmTimeHour}
                      onChange={this.handleSelectboxChange}
                      disabled={this.state.checkboxProps.chkAlarmSetting.checked === 'N'}
                      selectStyle={{ width: "90px" }}
                    />
                    <Selectbox
                      {...this.state.selectboxProps.selAlarmTimeMinute}
                      onChange={this.handleSelectboxChange}
                      disabled={this.state.checkboxProps.chkAlarmSetting.checked === 'N'}
                      selectStyle={{ width: "90px" }}
                    />
                  </div>
                )}
              ]
            ]}
          />
        </SubFullPanel>
        <SubFullPanel>
            {/* 버튼 영역 */}
            <RelativeGroup>
              <RFloatArea>
                <BasicButton
                  {...this.state.btnProps.btnNew}
                  onClick={this.onNewClick}
                />
                <BasicButton
                  {...this.state.btnProps.btnSave}
                  onClick={this.onSaveClick}
                />
              </RFloatArea>
            </RelativeGroup>
          </SubFullPanel>
				</FullPanel>
		);
	}
}

export default View;
