import React from 'react';

// 컴포넌트 import
import {
  ComponentPanel, Label, Selectbox, Textfield, BasicButton,
  RelativeGroup, LFloatArea, RFloatArea, FlexPanel, FullPanel, Table
} from 'components';

// 공통 라이브러리 import
import { ComLib, TransManager } from 'common';

class COM2070 extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      dsFolder: [], // 폴더(카테고리) 목록 데이터셋
      formData: {   // 폼 입력 데이터
        bokmkCtgySn: '',
        bokmkCtgyNm: '',
        bokmkMenuNm: '',
        menuId: '',
        menuUrl: ''
      },

      // UI Props
      selectboxProps: {
        selBookmarkFolder: {
          id: 'selBookmarkFolder',
          value: '',
          dataset: [],
          width: 300,
          selected: 0,
        }
      },
      textFieldProps: {
        iptBookmarkName: {
          id: 'iptBookmarkName',
          value: '',
          maxLength: 50,
          readOnly: true,
        },
        iptBookmarkMenu: {
          id: 'iptBookmarkMenu',
          value: '',
          placeholder: '메뉴를 선택하세요',
          readOnly: true,
        }
      },

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
    };
  }
  
  componentDidMount() {
    this.trGetCategoryList();
  }

  /* ================================================================================== */
  /* Validation */
  /* ================================================================================== */
  validateSave = () => {
    const { formData } = this.state;
    if (!formData.bokmkCtgySn) {
      ComLib.openDialog('A','COM2070', '즐겨찾기 폴더를 선택해주세요.');
      return false;
    }
    if (!formData.menuId) {
      ComLib.openDialog('A', 'COM2070', '즐겨찾기 할 메뉴를 선택해주세요.');
      return false;
    }
    return true;
  }

  /* ================================================================================== */
  /* Transaction */
  /* ================================================================================== */
  // 카테고리 목록 조회
  trGetCategoryList = () => {
    TransManager.get('/api/sup/bookmark/r01', null, (res) => {
      if (ComLib.handleResponse(res, 'search')) {
        this.prCategoryList(res.data);
      }
    });
  }

  // 즐겨찾기 저장
  trSaveBookmark = () => {
    if (!this.validateSave()) return;

    const params = {
      userId: ComLib.getSession('gdsUserInfo').userId,
      action: 'INSERT',
      bokmkCtgySn: this.state.formData.bokmkCtgySn,
      bokmkMenuId: this.state.formData.menuId,
    };

    TransManager.post('/api/sup/bookmark/u01', params, (res) => {
      if (ComLib.handleResponse(res, 'save')) {
        this.prSaveBookmark(res);
        this.props.onClose(true);
        
        window.dispatchEvent(new CustomEvent('favoriteListFolderChanged'));

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('favoriteAdded', { 
            detail: { bokmkMenuId: params.bokmkMenuId } 
          }));
        }, 300);
      }
    });
  }

  /* ================================================================================== */
  /* Process */
  /* ================================================================================== */
  // 카테고리 목록 처리
  prCategoryList = (data) => {
    const categoryList = data || [];
    const folderDataset = [
      { value: '', name: '폴더를 선택하세요' },
      ...categoryList.filter(item => item.bokmkCtgySn !== 0).map(item => ({
        value: item.bokmkCtgySn,
        name: item.bokmkCtgyNm
      }))
    ];
    
    this.setState({
      dsFolder: folderDataset,
      selectboxProps: {
        ...this.state.selectboxProps,
        selBookmarkFolder: {
          ...this.state.selectboxProps.selBookmarkFolder,
          dataset: folderDataset
        }
      }
    });
  }

  // 저장 결과 처리
  prSaveBookmark = (res) => {
    if (ComLib.handleResponse(res, 'save')) {
      ComLib.openDialog('A', '저장이 완료되었습니다.', () => {

        if (this.props.onClose) {
          this.props.onClose(true);
        }
      });
    }
  }

  /* ================================================================================== */
  /* Handle */
  /* ================================================================================== */
  // 입력 필드 변경 핸들러
  handleInputChange = (e) => {
    const { id, value } = e.target;
    const newFormData = { ...this.state.formData, [id]: value };
    this.setState({
      formData: newFormData,
      textFieldProps: {
        ...this.state.textFieldProps,
        [id]: { ...this.state.textFieldProps[id], value }
      }
    });
  }

  // 셀렉트박스 변경 핸들러
  handleSelectChange = (e) => {
    const { id, value } = e.target;
    const selectedFolder = this.state.dsFolder.find(folder => Number(folder.value) === Number(value));

    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        bokmkCtgySn: value,
        bokmkCtgyNm: selectedFolder.name,
      },
      selectboxProps: {
        ...prevState.selectboxProps,
        [id]: { ...prevState.selectboxProps[id], value }
      }
    }));
  }

  // 메뉴 검색 버튼 처리
  handleMenuSearch = () => {
    ComLib.openPop('SYS1020', '메뉴찾기', {
        modaless: false, 
        width: '800px', 
        height: '610px',
        fromComponent: 'COM2070',
        onMenuSelect: this.handleMenuSelected
    });
  }

  // 메뉴 선택 처리
  handleMenuSelected = (selectedMenu) => {
    this.setState({
      textFieldProps: {
        ...this.state.textFieldProps,
        iptBookmarkName: { ...this.state.textFieldProps.iptBookmarkName, value: selectedMenu.menuNm },
        iptBookmarkMenu: { ...this.state.textFieldProps.iptBookmarkMenu, value: selectedMenu.menuId }
      }
    })
    
    this.setState({
      formData: {
        ...this.state.formData,
        bokmkMenuNm: selectedMenu.menuNm,
        menuId: selectedMenu.menuId,  
      }
    })
  }

  // 저장 버튼 핸들러
  handleSave = () => {
    this.trSaveBookmark();
  }
  
  // 신규(초기화) 버튼 핸들러
  handleNew = () => {
    this.setState({
      formData: {
        bokmkCtgySn: '',
        bokmkCtgyNm: '',
        bokmkMenuNm: '',
        menuId: '',
        menuUrl: ''
      },
      selectboxProps: {
        ...this.state.selectboxProps,
        selBookmarkFolder: { ...this.state.selectboxProps.selBookmarkFolder, value: '' }
      },
      textFieldProps: {
        iptBookmarkName: { ...this.state.textFieldProps.iptBookmarkName, value: '' },
        iptBookmarkMenu: { ...this.state.textFieldProps.iptBookmarkMenu, value: '' },
      }
    });
  }
  render() {
    return (
      <FullPanel>
          <Table
            id="tblBookmarkForm"
            colGrp={[
              {width: '15%'}, {width: '85%'}
            ]}
            tbData={[
              [
                {type: 'T', value: '즐겨찾기 폴더', className: 'req', required: true},
                {type: 'D', value: (
                  <Selectbox 
                    id="selBookmarkFolder"
                    value={this.state.formData.bokmkCtgySn}
                    dataset={this.state.dsFolder}
                    onChange={this.handleSelectChange}
                  />
                )}
              ],
              [
                {type: 'T', value: '즐겨찾기 명', className: 'req', required: true},
                {type: 'D', value: (
                  <Textfield 
                    {...this.state.textFieldProps.iptBookmarkName}
                    id="iptBookmarkName"
                    onChange={this.handleInputChange}
                  />
                )}
              ],
              [
                {type: 'T', value: '즐겨찾기 메뉴', className: 'req', required: true},
                {type: 'D', value: (
                  <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                    <Textfield 
                      {...this.state.textFieldProps.iptBookmarkMenu}
                      id="iptBookmarkMenu"
                      width="calc(100% - 32px)"
                    />
                    <BasicButton
                      id="btnMenuSearch"
                      value=""
                      onClick={this.handleMenuSearch}
                      size="md"
                      innerImage={true}
                      icon="srch"
                      fiiled={true}
                      color="blue"
                    />
                  </div>
                )}
              ]
            ]}
          />
          
          {/* 버튼 영역 */}
          <FlexPanel style={{marginTop: '10px'}}>
            <RelativeGroup>
              <RFloatArea>
                <BasicButton 
                  {...this.state.btnProps.btnNew}
                  onClick={this.handleNew}
                />
                <BasicButton
                  {...this.state.btnProps.btnSave}
                  onClick={this.handleSave}
                />
              </RFloatArea>
            </RelativeGroup>
          </FlexPanel>
      </FullPanel>
    );
  }
}

export default COM2070;
