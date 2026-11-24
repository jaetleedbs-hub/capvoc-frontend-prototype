import React from 'react';
import { ComLib, TransManager } from 'common';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as appModule from 'store/modules/appModule';
import { checkAllMemoAlarms, checkMemoAlarm, memoAlarmMark } from 'utils/memoUtils';

class SideMemo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchKeyword: '',
            memos: [],
            isNewFolder: false,
            newFolderName: '',
            openFolderIds: new Set(),
            isFolderClick: false,
            selectedFolderId: null,
            openFolders: {},
            folderList: [],
            memoList: [],
            isAllExpanded: false,
        };
    }

    componentDidMount() {
        this.trGetInitialData();
        window.addEventListener('memoSave', this.trGetInitialData);
    }

    componentWillUnmount() {
        window.removeEventListener('memoSave', this.trGetInitialData);
    }
    
    trGetInitialData = () => {
        TransManager.get('/api/sup/memo/r03', null, (res) => {
            if (ComLib.handleResponse(res, 'get')) {
                const folders = res.data;

                TransManager.get('/api/sup/memo/r02', null, (res) => {
                    if (ComLib.handleResponse(res, 'get') && res.data.length > 0) {
                        const changedTypeMemos = res.data.map(item => {
                            return {
                                ...item,
                                memoCtgySid: Number(item.memoCtgySid)
                            }
                        })
                        this.processMemos(folders, changedTypeMemos);
                    } else {
                        this.processMemos(folders, []);
                    }
                });
            }
        });

        
    }

    handleSearchChange = (e) => {
        this.setState({ searchKeyword: e.target.value });
    }

    handleAddMemo = () => {
        ComLib.openPop('COM2080', '메모 등록', {
            modaless: false,
            folders: this.props.folderList,
        }, (result) => {
            console.log('메모 등록 결과:', result);
        });
    }

    handleToggleAllFolders = () => {
        const { isAllExpanded, folderList } = this.state;
        const newOpenFolders = {};
        
        if (!isAllExpanded) {
            // 전체 펼침
            folderList.forEach(folder => {
                newOpenFolders[folder.id] = true;
            });
        } else {
            // 전체 접힘
            folderList.forEach(folder => {
                newOpenFolders[folder.id] = false;
            });
        }
        
        this.setState({
            openFolders: newOpenFolders,
            isAllExpanded: !isAllExpanded
        });
    }

    handleEditMemo = (memo) => {
        ComLib.openPop('COM2080', '메모 등록', {
            modaless: false,
            memoData: memo,
            folders: this.props.folderList,
        }, (result) => {
            console.log('메모 수정 결과:', result);
        });
    }

    handleDeleteMemo = (e, memo) => {
        e.stopPropagation();
        ComLib.openConfirmDialog("해당 항목을 삭제하시겠습니까?", (isConfirm) => {
            if (isConfirm) {
                this.trDeleteMemo(memo);
            }
        });
    }

    trDeleteMemo = (memo) => {
        const params = {
            memoSid: memo.memoSid,
            memoCtgySid: memo.memoCtgySid,
            action: 'DELETE'
        }
    
        this.setState({
            memos: this.state.memos.filter(memo => memo.memoSid !== memo.memoSid)
        });

        TransManager.post('/api/sup/memo/u01', params, (res) => {
            if (ComLib.handleResponse(res, 'delete')) {
                ComLib.openAlertDialog(res.message || '메모가 삭제되었습니다.', 'success');
                this.trGetInitialData();
            }
        });
    }

    getFilteredMemos = () => {
        const keyword = this.state.searchKeyword.toLowerCase();
        if (!keyword) return this.state.memos;
        
        return this.state.memos.filter(memo => 
            memo.title.toLowerCase().includes(keyword) ||
            memo.content.toLowerCase().includes(keyword)
        );
    }

    handleNewFolder = () => {
        this.setState({ isNewFolder: true });
    }
    
    handleResetFolderState = () => this.setState({ isNewFolder: false, newFolderName: '' });
    
    // 새 폴더 입력 취소
    handleCloseNewFolder = () => this.handleResetFolderState();

    handleDeleteFolder = (e, id) => {
        e.stopPropagation();
        ComLib.openConfirmDialog("해당 폴더와 폴더 내의 모든 메모가 삭제됩니다. 계속하시겠습니까?", (isConfirm) => {
            if (isConfirm) {
                this.trDeleteFolder(id);
            }
        });
    }

    trDeleteFolder = (id) => {
        const params = {
            memoCtgySid: id,
        };

        TransManager.post('/api/sup/memo/d02', params, (res) => {
            if (ComLib.handleResponse(res, 'delete')) {
                ComLib.openAlertDialog(res.message || '폴더가 삭제되었습니다.', 'success');
                this.trGetInitialData();
            }
        });
    }

    // 새 폴더 추가 버튼 클릭 (엔터키 지원)
    handleAddNewFolder = () => {
        this.trAddNewFolder();
    }
    
    // 새 폴더 이름 입력
    handleNewFolderName = (e) => this.setState({ newFolderName: e.target.value });
    
    // 폴더 클릭
    handleFolderToggle = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        this.setState(prevState => {
            const newOpenFolders = { ...prevState.openFolders };
            if (newOpenFolders[id]) {
                delete newOpenFolders[id];
            } else {
                newOpenFolders[id] = true;
            }
            return { openFolders: newOpenFolders };
        });
    }

    trAddNewFolder = () => {
        if(this.validation('COM2080U02')) {
            this.transaction('COM2080U02');
        }
    }
    
    validation = (...params) => {
        const transId = params[0];
        const memo = params[1];
        switch(transId) {
                case 'COM2080U01':
                if(memo.memoAlrmYn !== 'Y') {
                    ComLib.openAlertDialog('알람이 설정되지 않은 메모입니다.', 'error');
                    return false;
                }
                break;
            case 'COM2080U02':
                if(this.state.newFolderName.trim() === '') {
                    ComLib.openAlertDialog('폴더 이름을 입력해주세요.', 'error');
                    return false;
                }
                break;
            default:
                return true;
        }
        return true;
    }
    
    /*******************************************************************
     * Transaction
     *******************************************************************/
    transaction = (...params) => {
        const transId = params[0]; 
        const memo = params[1] ? params[1] : null;

        try {
            switch(transId) {
                case 'COM2080U01':
                    const alarmParams = {
                        ...memo,
                        action: 'UPDATE',
                        memoAlrmYn: 'N',
                        memoAlrmDt: ''
                    };

                    TransManager.post('/api/sup/memo/u01', alarmParams, (res) => {
                        this.callback({ id: 'COM2080U01', result: ComLib.handleResponse(res, 'update'), message: res.message });
                    });
                    break;

                case 'COM2080U02':
                    const folderParams = {
                        memoCtgyNm: this.state.newFolderName,
                        action: 'INSERT'
                    };
            
                    TransManager.post('/api/sup/memo/u02', folderParams, (res) => {
                        this.callback({ id: 'COM2080U02', result: ComLib.handleResponse(res, 'insert'), message: res.message });
                    });
                    break;
                    
                default:
                    break;
            }
        } catch (error) {
            console.error('트랜잭션 오류:', error);
            this.callback({ id: transId, result: false, message: '시스템 오류가 발생했습니다.' });
        }
    }

    /*******************************************************************
     * Callback
     *******************************************************************/
    callback = (res) => {
        if (res.result) {
            switch (res.id) {
                case 'COM2080U01':
                    ComLib.openAlertDialog(res.message || '알림이 해제되었습니다.', 'success');
                    this.trGetInitialData();
                    break;

                case 'COM2080U02':
                    ComLib.openAlertDialog(res.message || '새 폴더가 생성되었습니다.', 'success');
                    this.trGetInitialData();
                    this.handleResetFolderState();
                    break;
                    
                default:
                    break;
            }
        } else {
            // 에러 처리
            switch (res.id) {
                case 'COM2080U01':
                    ComLib.openAlertDialog(res.message || '알림 해제에 실패했습니다.', 'error');
                    break;

                case 'COM2080U02':
                    ComLib.openAlertDialog(res.message || '새 폴더 생성에 실패하였습니다.', 'error');
                    this.handleResetFolderState();
                    break;
                    
                default:
                    ComLib.openAlertDialog(res.message || '처리 중 오류가 발생했습니다.', 'error');
                    break;
            }
        }
    }


    processMemos = (folders, memos) => {
        const folderMap = new Map();
        if (folders) {
            folders.forEach(folder => {
                folderMap.set(folder.memoCtgySid, {
                    id: folder.memoCtgySid,
                    name: folder.memoCtgyNm,
                    type: 'folder',
                    icon: 'fas xi-folder',
                    memos: []
                });
            });
        }   

        const memosWithoutFolder = [];
        if (memos) {
            memos.forEach(memo => {
                if (memo.memoCtgySid && folderMap.has(memo.memoCtgySid)) {
                    folderMap.get(memo.memoCtgySid).memos.push(memo);
                } else {
                    memosWithoutFolder.push(memo);
                }
            });
        }

        const folderList = Array.from(folderMap.values());
        const memoList = memosWithoutFolder;

        this.setState({
            folderList: folderList,
            memoList: memoList
        });
    }

    // 공통 유틸리티 함수 사용
    checkMemoAlarm = (memo) => {
        return checkMemoAlarm(memo);
    }

    memoAlarmMark = (memo) => {
        return memoAlarmMark(memo);
    }

    handleConfirmMemo = (...params) => {
        const e = params[0];
        const memo = params[1];
        const state = params[2];
        
        e.stopPropagation();

        if(state === 'needConfirm') {
            if(this.validation('COM2080U01', memo)) {
                this.transaction('COM2080U01', memo, state);
            }
        }
    }

    render() {
        return (
            <div className="memo-container">
                <div className="memo-header">
                    <div className="header-title">
                        <span className="fas fa-file-alt"></span>
                        <h3>나의 메모</h3>
                    </div>
                    
                    <div style={{display: 'flex', gap: '4px'}}>
                        <button className="add-memo-btn" onClick={this.handleAddMemo}>
                            <i className="fas fa-plus"></i>
                            메모 등록
                        </button>
                        <button 
                            className="expand-all-btn" 
                            onClick={this.handleToggleAllFolders}
                            style={{
                                padding: '6px 8px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px'
                            }}
                            title={this.state.isAllExpanded ? '전체 접기' : '전체 펼치기'}
                        >
                            <i className={`xi ${this.state.isAllExpanded ? 'xi-angle-up' : 'xi-angle-down'}`}></i>
                        </button>
                    </div>
                </div>
                <div className='memo-wrapper'>
                    <div className="explorer-item new" onClick={this.handleNewFolder}>
                        <i className="fas fa-plus"></i>
                        새 폴더
                    </div>
                    {this.state.isNewFolder && (
                        <div id="newFolderInput" style={{display: 'block', padding: '8px'}}>
                            <div style={{display: 'flex', gap: '4px', alignItems: 'center', width: '100%'}}>
                                <input type="text" className="folder-name-input" value={this.state.newFolderName} onChange={this.handleNewFolderName} onKeyDown={ComLib.handleEnterKey(this.handleAddNewFolder)} placeholder="폴더 이름 입력" autoComplete="off" style={{flex: 1, padding: '2px 4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px', width: '120px'}}/>
                                <div style={{display: 'flex', gap: '2px'}}>
                                    <button onClick={this.handleAddNewFolder} style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0066cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px'}}>
                                        <i className="fas xi-check"></i>
                                    </button>
                                    <button style={{width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px'}} onClick={this.handleCloseNewFolder}>
                                        <i className="xi-close"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {this.state.folderList.map(item => (
                        <React.Fragment key={item.id}>
                            <div className={`explorer-item ${this.state.openFolders[item.id] && item.memos.length > 0 ? 'active' : ''}`} onClick={(e) => this.handleFolderToggle(e, item.id)}>
                                <i className={item.icon}></i>
                                {item.name}
                                <span className="delete-icon" onClick={(e) => this.handleDeleteFolder(e, item.id)}>
                                    <i className="xi-close"></i>
                                </span>
                            </div>
                            {this.state.openFolders[item.id] && (
                                <div className="explorer-item-sub">
                                    {item.memos && item.memos.length > 0 ? (
                                        item.memos.map(memo => (
                                            <div className='memo-list' key={memo.memoSid}>
                                                <div className={`memo-item ${this.memoAlarmMark(memo)}`}>
                                                    <div className="memo-item-header">
                                                        <div className="memo-title">
                                                            {memo.memoTtlNm}
                                                        </div>
                                                        <div className="memo-content">
                                                            <p className="memo-text">
                                                                {memo.memoCn.length > 15 ? memo.memoCn.slice(0, 15) + '...' : memo.memoCn}
                                                            </p>
                                                        </div>
                                                        <div className="memo-actions">
                                                            <span className="memo-date">{memo.rgstDttm}</span>
                                                            <button 
                                                                className="memo-edit"
                                                                onClick={() => this.handleEditMemo(memo)}
                                                            >
                                                                <span className="fas fa-edit"></span>
                                                            </button>
                                                            <button 
                                                                className="memo-alarm"
                                                                onClick={(e) => this.handleConfirmMemo(e,memo, this.checkMemoAlarm(memo))}
                                                            >
                                                                <span className="fas fa-bell"></span>
                                                            </button>
                                                            <button 
                                                                className="memo-delete"
                                                                onClick={(e) => this.handleDeleteMemo(e, memo)}
                                                            >
                                                                <span className="fas fa-trash-alt"></span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="explorer-item-empty" style={{'marginLeft': '20px'}}></div>
                                    )}
                                </div>
                            )}
                    </React.Fragment>
                    ))}
                    <div className='explorer-divider' style={{
                        height: '3px',
                        margin: '8px 0'
                    }}> 
                    </div>
                    <div className="memo-list">
                        {this.state.memoList.map(memo => (
                            <div key={memo.memoSid} className={`memo-item ${this.memoAlarmMark(memo)}`}>
                                <div className="memo-item-header">
                                    <div className="memo-title">
                                        {memo.memoTtlNm}
                                    </div>
                                    <div className="memo-content">
                                        <p className="memo-text">
                                            {memo.memoCn.length > 15 ? memo.memoCn.slice(0, 15) + '...' : memo.memoCn}
                                        </p>
                                    </div>
                                    <div className="memo-actions">
                                        <span className="memo-date">{memo.rgstDttm}</span>
                                        <button 
                                            className="memo-edit"
                                            onClick={() => this.handleEditMemo(memo)}
                                        >
                                            <span className="fas fa-edit"></span>
                                        </button>
                                        <button 
                                            className="memo-alarm"
                                            onClick={(e) => this.handleConfirmMemo(e,memo, this.checkMemoAlarm(memo))}
                                        >
                                            <span className="fas fa-bell"></span>
                                        </button>
                                        <button 
                                            className="memo-delete"
                                            onClick={(e) => this.handleDeleteMemo(e, memo)}
                                        >
                                            <span className="fas fa-trash-alt"></span>
                                        </button>
                                    </div>
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(
    (state) => ({
        notificationCountList: state.appModule.notificationCountList,
    }),
    (dispatch) => ({
        appModuleActions: bindActionCreators(appModule, dispatch)
    })
)(SideMemo); 