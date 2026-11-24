import React, { Component } from 'react';
import { ComLib, TransManager } from 'common';

class FavoriteLayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            favoriteList: ComLib.getSession('favoriteList') || []
        };
    }

    /**
     * ⚠ 리스너는 <같은 참조>로 등록하고 해제한다.
     *
     * 종전에는 등록도 해제도 <그 자리에서 만든 익명 화살표 함수>였다. 참조가 서로 달라
     * removeEventListener 가 아무것도 지우지 못했고('favoriteAdded' 는 해제 시도조차 없었다),
     * 마운트할 때마다 window 리스너 2개와 죽은 컴포넌트 인스턴스가 영구히 쌓였다.
     * 장시간 켜 두면 계속 늘어나는 누수라 클래스 필드로 참조를 고정한다(2026-09-03).
     */
    handleFavoriteListChangedRemove = () => {
        this.setState({ favoriteList: ComLib.getSession('favoriteList') });
    }

    handleFavoriteAdded = (event) => {
        this.setState({ favoriteList: ComLib.getSession('favoriteList') });
        this.isBookmark(event.detail?.bokmkMenuId);
    }

    componentDidMount() {
        window.addEventListener('favoriteListChangedRemove', this.handleFavoriteListChangedRemove);
        window.addEventListener('favoriteAdded', this.handleFavoriteAdded);
    }

    componentWillUnmount() {
        window.removeEventListener('favoriteListChangedRemove', this.handleFavoriteListChangedRemove);
        window.removeEventListener('favoriteAdded', this.handleFavoriteAdded);
    }
    
    // Validation - 즐겨찾기 저장 유효성 검증
    validateFavoriteSave = (menuId) => {
        if (!menuId) {
            ComLib.openDialog('A', '메뉴 ID가 없습니다.');
            return false;
        }
        return true;
    }

    // 즐겨찾기 여부 확인
    isBookmark = (menuId) => {
        const { favoriteList } = this.state;

        if (!Array.isArray(favoriteList)) {
            return false;
        }

        return favoriteList.some(item => item && item.bokmkMenuId === menuId);
    }

    // 즐겨찾기 클릭 이벤트
    handleBookmarkClick = (e, menuId) => {
        const { selectedMenuId } = this.props;
        const gdsMenu = ComLib.getSession('gdsMenu');
        const selectedMenu = gdsMenu.find(menu => menu.menuId === selectedMenuId);

        this.setState({
            favoriteList: ComLib.getSession('favoriteList')
        })

        const sendBookmarkInfo = {
            userId: ComLib.getSession('gdsUserInfo').userId,
            bokmkCtgySn: 0, //  프레임에서 저장 경우 0, 폴더 이동시 폴더Id 부여
            bokmkCtgyNm: "즐겨찾기",
            bokmkMenuId: menuId,
            menuNm: selectedMenu.menuNm,
            ctgySortSn: 1, // 고정
            menuSortSn: 1 // 고정
        }

        // 현재 선택된 메뉴가 아닌 경우 처리하지 않음
        if (selectedMenuId !== menuId) {
            return;
        }
        
        const params = {
            action: this.isBookmark(menuId) ? 'DELETE' : 'INSERT',
            bokmkCtgySn: 0,
            bokmkMenuId: menuId
        }
        TransManager.post('/api/sup/bookmark/u01', params, (res) => {
            if (ComLib.handleResponse(res, 'update')) {
                if(res.data.action === 'DELETE') {
                    ComLib.setSession('favoriteList', this.state.favoriteList.filter(item => item.bokmkMenuId !== menuId)); 
                } else {
                    ComLib.setSession('favoriteList', [...this.state.favoriteList, sendBookmarkInfo]);
                }
        
                this.setState({ favoriteList: ComLib.getSession('favoriteList') });

                // 즐겨찾기 목록 변경 이벤트를 발생시켜 SideFavorite에 알립니다.
                window.dispatchEvent(new CustomEvent('favoriteListChanged'));
            }
        });
    }

    render() {
        const { menuId } = this.props;

        return (
            <span 
                className={'scrm-main-view-favorite-icon' + (this.isBookmark(menuId) ? ' active' : '')} 
                onClick={(e) => this.handleBookmarkClick(e, menuId)}
            />
        );
    }
}

export default FavoriteLayer; 