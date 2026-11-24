import React from 'react';
import { ComLib, TransManager } from 'common';

class SideFavorite extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isNewFolder: false,
            newFolderName: '',
            folderList: [], // 폴더 목록
            favoriteList: [], // 카테고리에 속하지 않는 즐겨찾기 목록
            openFolderIds: new Set(), // 여러 폴더를 동시에 열 수 있도록 Set으로 관리
            rawFolderList: [], // 원본 폴더 데이터 저장
            isFolderClick: false, // 폴더 클릭 상태
            selectedFolderId: null, // 선택된 폴더 ID
            openFolders: {}
        }
    }
    
    componentDidMount() {
        this.trGetInitialData();
        window.addEventListener('favoriteListChanged', this.handleFavoriteListChanged);
        window.addEventListener('favoriteListFolderChanged', this.handleFavoriteListFolderChanged);
    }

    componentWillUnmount() {
        window.removeEventListener('favoriteListChanged', this.handleFavoriteListChanged);
        window.removeEventListener('favoriteListFolderChanged', this.handleFavoriteListFolderChanged);
    }

    handleFavoriteListChanged = () => {
        const favorites = ComLib.getSession('favoriteList');
        if (favorites) {
            const changedTypeFavorites = favorites.map(item => ({
                ...item, bokmkCtgySn: Number(item.bokmkCtgySn)
            }));
            this.processFavorites(this.state.rawFolderList, changedTypeFavorites);
        }
    }

    handleFavoriteListFolderChanged = () => {
        this.trGetFavoriteList();
    }

    trGetInitialData = () => {
            TransManager.get('/api/sup/bookmark/r01', null, (folderRes) => {
                if (ComLib.handleResponse(folderRes, 'get') && folderRes.result === 'success') {
                 
                    const folders = folderRes.data;
                    this.setState({ rawFolderList: folders });

                    const favorites = ComLib.getSession('favoriteList') || [];
                    const changedTypeFavorites = favorites.map(item => {
                        return {
                            ...item, bokmkCtgySn: Number(item.bokmkCtgySn)
                        }
                    })
                    this.processFavorites(folders, changedTypeFavorites);
                } else {
                    ComLib.openAlertDialog(folderRes.data.message || '즐겨찾기 목록 조회에 실패하였습니다.', 'error');
                }
            });
    }

    trGetFavoriteList = () => {
        TransManager.get('/api/sup/bookmark/r01', null, (folderRes) => {
            if (ComLib.handleResponse(folderRes, 'get') && folderRes.result === 'success') {
                const folders = folderRes.data;
                this.setState({ rawFolderList: folders });

                TransManager.get('/api/sup/bookmark/r02', null, (favRes) => {
                    if (ComLib.handleResponse(favRes, 'get') && favRes.result === 'success') {
                        const favorites = favRes.data;
                        const changedTypeFavorites = favorites.map(item => {
                            return {
                                ...item, bokmkCtgySn: Number(item.bokmkCtgySn)
                            }
                        })
                        ComLib.setSession('favoriteList', changedTypeFavorites);
          
                        this.processFavorites(folders, changedTypeFavorites);
                    } else {
                        ComLib.openAlertDialog(favRes.data.message || '즐겨찾기 목록 조회에 실패하였습니다.', 'error');
                    }
                });
            } else {
                ComLib.openAlertDialog(folderRes.data.message || '즐겨찾기 조회에 실패하였습니다.', 'error');
            }
        });
    }

    // 즐겨찾기 추가
    handleAddFavorite = () => {
        // COM2070 즐겨찾기 등록 팝업 열기
        ComLib.openPop('COM2070', '즐겨찾기 등록', {
            modaless: false,
            width: '440px',
            height: '209px',
            // 초기 데이터 전달
            initialData: {
                menuName: '', // 현재 메뉴 정보 (필요시 설정)
                menuId: '',
                menuUrl: ''
            },
        }, (result) => {
            // 즐겨찾기 저장 성공 시 콜백
            if (result) {
                console.log('즐겨찾기 저장 성공:', result);
                
                // 즐겨찾기 목록에 추가
                const newFavorite = {
                    id: this.state.favoriteList.length + 1,
                    name: result.bookmarkName || '새 즐겨찾기',
                    type: 'bookmark',
                    icon: 'fas xi-star',
                    folder: result.bookmarkFolder,
                    menuId: result.bookmarkMenuId,
                    menuUrl: result.bookmarkMenuUrl
                };
                
                const updatedFavoriteList = [...this.state.favoriteList, newFavorite];
                
                // 상태 업데이트
                this.setState({
                    favoriteList: updatedFavoriteList
                });
                
                // 로컬스토리지 업데이트
                try {
                    ComLib.setSession('favoriteList', updatedFavoriteList);
                } catch (error) {
                    console.error('즐겨찾기 로컬스토리지 저장 실패:', error);
                }
                
                ComLib.openDialog('A', '', '즐겨찾기가 추가되었습니다.');
            }
        });
    }

    /* ================================================================================== */
    /* Process */
    /* ================================================================================== */
    // 즐겨찾기 목록 데이터 가공
    processFavorites = (folders, favorites) => {
        const folderMap = new Map();
        if (folders) {
            folders.forEach(folder => {
                // bokmkCtgySn=0 데이터 제외
                if (folder.bokmkCtgySn !== 0) {
                    folderMap.set(folder.bokmkCtgySn, {
                        id: folder.bokmkCtgySn,
                        name: folder.bokmkCtgyNm,
                        type: 'folder',
                        icon: 'fas xi-folder',
                        bookmarks: []
                    });
                }
            });
        }

        const favoritesWithoutFolder = [];
        if (favorites) {
            favorites.forEach(favorite => {
                if (favorite.bokmkCtgySn && folderMap.has(favorite.bokmkCtgySn)) {
                    // 즐겨찾기의 bokmkCtgySn 값이 Map에 있으면 해당 폴더의 bookmarks에 추가
                    folderMap.get(favorite.bokmkCtgySn).bookmarks.push(favorite);
                } else {
                    // 폴더 없는 즐겨찾기 목록에 추가
                    favoritesWithoutFolder.push(favorite);
                }
            });
        }

        this.setState({
            folderList: Array.from(folderMap.values()),
            favoriteList: favoritesWithoutFolder
        });
    }

    /* ================================================================================== */
    /* Handle */
    /* ================================================================================== */

    // 즐겨찾기 제거
    handleDeleteBookmark = (e, bookmarkItem) => {
        e.stopPropagation();
        ComLib.openConfirmDialog("해당 항목을 삭제하시겠습니까?", (isConfirm) => {
            if (isConfirm) {
                this.trDeleteFavorite(bookmarkItem);
            } else {
                ComLib.openAlertDialog('즐겨찾기 삭제에 실패하였습니다.', 'error');
            }
        });
    }
    
    trDeleteFavorite = (bookmarkItem) => {
        const params = {
            action: 'DELETE',
            bokmkCtgySn: bookmarkItem.bokmkCtgySn,
            bokmkMenuId: bookmarkItem.bokmkMenuId
        };
    
        ComLib.setSession('favoriteList', this.state.favoriteList.filter(item => item.bokmkMenuId !== bookmarkItem.bokmkMenuId));
    
        TransManager.post('/api/sup/bookmark/u01', params, (res) => {
            if (ComLib.handleResponse(res, 'delete') && res.result === 'success') {
                this.trGetFavoriteList();
                window.dispatchEvent(new CustomEvent('favoriteListChangedRemove'));
            } else {
                ComLib.openAlertDialog(res.data.message || '즐겨찾기 삭제에 실패하였습니다.', 'error');
            }
        });
    }

    // 폴더 삭제 버튼 클릭
    handleDeleteFolder = (e, id) => {
        e.stopPropagation();
        ComLib.openConfirmDialog("해당 폴더와 폴더 내의 모든 즐겨찾기가 삭제됩니다. 계속하시겠습니까?", (isConfirm) => {
            if (isConfirm) {
                this.trDeleteFolder(id);
            }
        });
    }

    trDeleteFolder = (id) => {
        const params = {
            bokmkCtgySn: id
        };

        TransManager.post('/api/sup/bookmark/d01', params, (res) => {
            if (ComLib.handleResponse(res, 'delete') && res.result === 'success') {
                this.trGetFavoriteList();
                this.setState({ folderList: this.state.folderList.filter(item => item.id !== id)
                    , favoriteList: this.state.favoriteList.filter(item => item.bokmkCtgySn !== id)
                 });
                window.dispatchEvent(new CustomEvent('favoriteListChangedRemove'));
            } else {
                ComLib.openAlertDialog(res.data.message || '폴더 삭제에 실패하였습니다.', 'error');
            }
        });
    }
    
    // 새 폴더 버튼 클릭
    handleNewFolder = () => this.setState({ isNewFolder: true });
    
    handleResetFolderState = () => this.setState({ isNewFolder: false, newFolderName: '' });
    
    // 새 폴더 입력 취소
    handleCloseNewFolder = () => this.handleResetFolderState();
    
    trAddNewFolder = () => {
        const params = {
            bokmkCtgyNm: this.state.newFolderName
        };

        TransManager.post('/api/sup/bookmark/u02', params, (res) => {
            if(res.status === 'invalid') {
                ComLib.openAlertDialog(res.data.message, 'error');
                return;
            } else if (ComLib.handleResponse(res, 'insert') && res.result === 'success') {
                ComLib.openAlertDialog(res.data.message || '새 폴더가 생성되었습니다.', 'success');
                this.trGetFavoriteList();
                this.handleResetFolderState();
            } else {
                ComLib.openAlertDialog(res.data.message || '새 폴더 생성에 실패하였습니다.', 'error');
                this.handleResetFolderState();
            }
        });
    }

    // 새 폴더 추가 버튼 클릭 (엔터키 지원)
    handleAddNewFolder = () => this.trAddNewFolder();
    
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

    // 즐겨찾기 메뉴 클릭 시 해당 메뉴 열기
    handleFavoriteMenuClick = (item) => {
        // 메뉴 데이터에서 팝업 여부 확인
        const gdsMenu = ComLib.getSession('gdsMenu') || [];
        const menuData = gdsMenu.find(menu => menu.menuId === item.bokmkMenuId);
        
        console.log('즐겨찾기 메뉴 클릭:', {
            item: item,
            menuData: menuData,
            npagYn: menuData ? menuData.npagYn : 'not found'
        });

        // 메뉴 데이터가 없으면 기본적으로 메인 화면으로 처리
        if (!menuData) {
            console.log(`메뉴 데이터 없음, 메인 화면으로 열기: ${item.bokmkMenuId}`);
            const menuInfo = {
                menuId: item.bokmkMenuId,
                menuNm: item.menuNm,
                closeable: true
            };
            this.props.openMenu(menuInfo);
            return;
        }

        // npagYn 값에 따른 처리 (메뉴 컴포넌트와 동일한 로직)
        const npagYn = menuData.npagYn;
        
        // 비활성 메뉴는 실행하지 않음
        if (npagYn === 'X') {
            console.log(`비활성 메뉴: ${item.bokmkMenuId}`);
            return;
        }

        // 팝업으로 열기 ('Y': 모달 팝업)
        if (npagYn === 'Y') {
            console.log(`모달 팝업으로 열기: ${item.bokmkMenuId}`);
            ComLib.openPop(item.bokmkMenuId, item.menuNm, {modaless: false});
            return;
        }

        // 새창으로 열기 ('P': 새창 팝업)
        if (npagYn === 'P') {
            console.log(`새창 팝업으로 열기: ${item.bokmkMenuId}`);
            ComLib.openPop(item.bokmkMenuId, item.menuNm);
            return;
        }

        // 기본적으로 메인 화면으로 열기 ('N' 또는 기타)
        console.log(`메인 화면으로 열기: ${item.bokmkMenuId}`);
        const menuInfo = {
            menuId: item.bokmkMenuId,
            menuNm: item.menuNm,
            closeable: true
        };
        this.props.openMenu(menuInfo);
    }

    render() {
        return (
            <div className="explorer-menu">
                <div className="header-title favorite-header">
                    <span className="fas fa-star"></span>
                    <h3>즐겨찾기 모음</h3>
                </div>
                <div className='favorite-wrapper'>
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
                        <div className={`explorer-item ${this.state.openFolders[item.id] && item.bookmarks.length > 0 ? 'active' : ''}`} onClick={(e) => this.handleFolderToggle(e, item.id)}>
                            <i className={item.icon}></i>
                            {item.name}
                            <span className="delete-icon" onClick={(e) => this.handleDeleteFolder(e, item.id)}>
                                <i className="xi-close"></i>
                            </span>
                        </div>
                        {this.state.openFolders[item.id] && (
                            <div className="explorer-item-sub">
                                {item.bookmarks && item.bookmarks.length > 0 ? (
                                    item.bookmarks.map(bookmark => (
                                        <div key={bookmark.bokmkMenuId} className="explorer-item" onClick={() => this.handleFavoriteMenuClick(bookmark)}>
                                            <i className="fas xi-star" style={{'marginLeft': '10px'}}></i>
                                            {bookmark.menuNm}
                                            <span className="delete-icon" onClick={(e) => {
                                                e.stopPropagation();
                                                this.handleDeleteBookmark(e, bookmark);
                                            }}>
                                                <i className="xi-close"></i>
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="explorer-item-empty" style={{'marginLeft': '20px'}}></div>
                                )}
                            </div>
                        )}
                   </React.Fragment>
                ))}
                <div className="explorer-divider"></div>
                <div className="explorer-item new" onClick={this.handleAddFavorite}>
                    <i className="fas fa-plus"></i>
                    새 즐겨찾기 추가
                </div>
                {this.state.favoriteList.map(item => (
                    <div key={item.bokmkMenuId} className="explorer-item" onClick={() => this.handleFavoriteMenuClick(item)}>
                        <i className="fas xi-star"></i>
                        {item.menuNm}
                        <span 
                            className="delete-icon" 
                            onClick={(e) => {
                                e.stopPropagation();
                                this.handleDeleteBookmark(e, item);
                            }}
                        >
                            <i className="xi-close"></i>
                        </span>
                    </div>
                ))}
                </div>
            </div>
        )
    }
}

export default SideFavorite; 