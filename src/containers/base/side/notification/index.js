import React from 'react';
import { connect } from 'react-redux';  
import { bindActionCreators } from 'redux';
import * as appModule from 'store/modules/appModule';
import { ComLib } from 'common';
import { BasicButton } from 'components';

class SideNotification extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            btnProps: {
                btnRefresh: {
                    id: 'btnRefresh',
                    disabled: false,
                    value: '',
                    hidden: false,
                    color: 'blue',
                    size: 'lg',
                    fiiled: true,
                    icon: 'redo',
                    innerImage: true
                }
            }
        }
    }

    
    handleMarkAllRead = () => {
        this.setState({
            notifications: this.state.notifications.map(item => ({
                ...item,
                isRead: true
            }))
        });
    }

    handleFilterChange = (filter) => {
        this.setState({ filter });
    }

    /**
     * [A4 잔여] 알림 목록.
     *
     * <p>종전에는 6개였다. 그중 5개(부서/나의/미처리 업무 이관 · 콜백 배정 · 통화 예약)는
     * 이전 시스템의 상담 화면 CNS4020·CNS0010·CNS5010 을 가리켰는데, 그 셋은
     * cmpt_menu 에 <아예 없다>. 라우팅이 100% DB 메뉴 구동이라 누르면 전부
     * "해당 메뉴를 찾을 수 없습니다" 대화상자가 떴다. ChatCall 에 없는 기능이라 지운다.
     *
     * <p>공지사항은 실재하는 기능이라 남기고, 목적지를 살아 있는 화면으로 바꾼다 —
     * 종전 COM3010(옛 세대 대시보드)은 use_yn='N' 이라 메뉴에 실리지 않는다.
     *
     * <p>건수는 헤더의 NotificationLayer 가 60초마다
     * `/api/common/polling/user-summary` 를 조회해 채운다(`unReadNoticesCount`).
     * 원천은 `cmpt_bbs_pst` × `cmpt_bbs_read_sts` 의 미확인 공지다.
     */
    getFilteredNotifications = () => {
        return [
            {
                id: 6,
                type: 'notices',
                title: '공지사항',
                message: '',
                unreadCount: this.props.unReadNoticesCount, // 미확인 건수
                componentId: 'BO301_S',
            }
        ]
    }

    openComponent = (componentId, title) => {
        const menuList = ComLib.getSession('gdsMenu');
        
        if (!menuList || !Array.isArray(menuList) || menuList.length === 0) {
            console.warn('메뉴 데이터가 없습니다. 잠시 후 다시 시도해주세요.');
            ComLib.openDialog('메뉴 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        let menuInfo = menuList.find(item => item.menuId === componentId);
        
        if (!menuInfo) {
            console.warn(`메뉴를 찾을 수 없습니다: ${componentId}`);
            ComLib.openDialog(`해당 메뉴를 찾을 수 없습니다: ${componentId}`);
            return;
        }
        
        if(menuInfo.npagYn === 'X') {
            return;
        }

        if(menuInfo.npagYn === 'Y') {
            // 모달 팝업
            ComLib.openPop(menuInfo.menuId, menuInfo.menuNm, {modaless: false});
            return;
        }

        if(menuInfo.npagYn === 'P') {
            // 새창 팝업
            ComLib.openPop(menuInfo.menuId, menuInfo.menuNm);
            return;
        }
        this.props.openMenu(menuInfo);
    }

    handleRefresh = () => {
        window.dispatchEvent(new CustomEvent('refreshNotification'));
    }
    /*******************************************************************
     * Validation
     *******************************************************************/
    // validation = (...params) => {
    //     const transId = params[0];
    //     switch(transId) {
    //         case 'COM2050R01':
    //             break;
    //     }
    // }

    /*******************************************************************
     * Transaction
     *******************************************************************/
    // transaction = (...params) => {
    //     const transId = params[0];
    //     switch(transId) {
    //         case 'COM2050R01':
    //             break;
    //     }
    // }

    /*******************************************************************
     * Callback
     *******************************************************************/
    // callback = (res, data) => {
    //     if(res.result) {
    //         switch(res.id) {
    //             case 'COM2050R01':
    //                 break;
    //         }
    //     }
    // }
    render() {
        const filteredNotifications = this.getFilteredNotifications();

        return (
            <div className="notifications">
                <div className="notifications-list">
                    {filteredNotifications.map(item => (
                        <button key={item.id} className={`notification-item ${item.unreadCount > 0 ? 'unread' : 'read'}`} onClick={() => this.openComponent(item.componentId, item.title)}>
                            <div className="notification-content">
                                <div className="notification-title">
                                    <span>{item.title}</span>
                                </div>
                                {item.unreadCount > 0 && (
                                    <div className="notification-unread-count">
                                        <span>{item.unreadCount}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
               <BasicButton
               {...this.state.btnProps.btnRefresh}
               onClick={this.handleRefresh}
               >
                </BasicButton>
            </div>
        );
    }
}

export default connect(
    (state) => ({
        unReadNoticesCount: state.appModule.unReadNoticesCount
    }),
    (dispatch) => ({
        appModuleActions: bindActionCreators(appModule, dispatch)
    })
)(SideNotification); 