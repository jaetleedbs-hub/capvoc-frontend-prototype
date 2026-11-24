import React from 'react';
import { ComLib } from 'common';

/**
 * CoreWorks 서브메뉴 패널 — 메뉴 전용.
 * 아이콘바에서 고른 대분류의 DB 메뉴(gdsMenu) 2·3단계 트리를 그린다
 * (.cw-sm-group / .cw-sm-item). 즐겨찾기·알림·마이메모는 여기 없다 —
 * GNB 아이콘 → 우측 드로어(utildrawer)로 분리했다(사용자 지시: 메뉴와 영역을 겹치지 않게).
 *
 * 메뉴 실행 분기(npagYn)는 옛 side/menu 와 동일하다:
 *  'X' 비활성 · 'Y' 모달 팝업 · 'P' 새창 · 그 외 메인 트레이(addTray)
 */

const Arrow = ({ open }) => (
  <span className={`cw-sm-disclosure${open ? ' expanded' : ''}`}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      {open ? <path d="M4 6l4 4 4-4" /> : <path d="M6 4l4 4-4 4" />}
    </svg>
  </span>
);

class SubMenuPanel extends React.Component {
  state = {
    keyword: '',
    collapsed: {}, // { [menuId]: true } — 2단계 그룹 접힘
  };

  /** 숨김('H') 서브트리 제거 + 유효한 잎이 없는 상위 제거 (옛 side/menu 와 동일 로직) */
  filterMenus = (menuList) => {
    if (!menuList || menuList.length === 0) return [];

    const hiddenMenuIds = new Set();
    menuList.forEach((menu) => {
      if (menu.menuUseYn === 'H') hiddenMenuIds.add(menu.menuId);
    });
    const findHiddenChildren = (parentId) => {
      menuList.forEach((menu) => {
        if (menu.upMenuId === parentId && !hiddenMenuIds.has(menu.menuId)) {
          hiddenMenuIds.add(menu.menuId);
          findHiddenChildren(menu.menuId);
        }
      });
    };
    hiddenMenuIds.forEach((hiddenId) => findHiddenChildren(hiddenId));

    const visibleMenus = menuList.filter((menu) => !hiddenMenuIds.has(menu.menuId));

    const hasValidChildren = (menuId, allMenus) => {
      const children = allMenus.filter((menu) => menu.upMenuId === menuId);
      if (children.length === 0) return false;
      return children.some(
        (child) => child.menuUseYn !== 'H' || hasValidChildren(child.menuId, allMenus)
      );
    };

    return visibleMenus.filter((menu) => {
      if (hasValidChildren(menu.menuId, visibleMenus)) return true;
      if (menu.npagYn && menu.menuUseYn !== 'H' && menu.npagYn !== 'X') return true;
      return false;
    });
  };

  /**
   * 화면ID 접두([BO401_S])는 <로컬 환경에서만> 붙인다 — 개발서버 등 외부에는 숨긴다(사용자 지시 2026-09-02).
   *
   * ⚠ SYSTEM_DV('L') 로 판정하지 않는다 — setServerInfos 가 REACT_APP_ENV 를 읽는데
   *   vite define 이 그 값을 주입하지 않아 <어디서나> 'L' 이다(dev 에도 ID 가 붙던 원인).
   *   SYSTEM_DV 산정을 고치면 SYSTEM_DV != 'L' 에 걸린 beforeunload 로그아웃(base/index.js)이
   *   dev 에서 깨어나는 부작용이 있어 건드리지 않는다(별건).
   *   브라우저 접속 호스트가 곧 환경이다 — localhost 계열이면 로컬이다.
   */
  isLocalHost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname);

  labelOf = (menu) =>
    this.isLocalHost ? `[${menu.menuId}] ${menu.menuNm}` : menu.menuNm;

  onItemClick = (menuInfo) => {
    if (menuInfo.npagYn === 'X') return;
    if (menuInfo.npagYn === 'Y') {
      ComLib.openPop(menuInfo.menuId, menuInfo.menuNm, { modaless: false });
      return;
    }
    if (menuInfo.npagYn === 'P') {
      ComLib.openPop(menuInfo.menuId, menuInfo.menuNm);
      return;
    }
    this.props.openMenu(menuInfo);
  };

  toggleGroup = (menuId) => {
    this.setState((prev) => ({
      collapsed: { ...prev.collapsed, [menuId]: !prev.collapsed[menuId] },
    }));
  };

  /** 검색어에 걸린 잎 + 그 조상들만 남긴다 (옛 side/menu 와 동일한 규칙) */
  matchedSet = (menus, keyword) => {
    const byId = new Map(menus.map((m) => [m.menuId, m]));
    const set = new Set();
    menus.forEach((m) => {
      if (
        m.menuNm.toLowerCase().includes(keyword) ||
        m.menuId.toLowerCase().includes(keyword)
      ) {
        let cur = m;
        while (cur && !set.has(cur.menuId)) {
          set.add(cur.menuId);
          cur = cur.upMenuId ? byId.get(cur.upMenuId) : null;
        }
      }
    });
    return set;
  };

  renderLeaf = (menu, depth) => {
    const { selected } = this.props;
    const isActive = selected && selected.menuId === menu.menuId;
    const disabled = menu.npagYn === 'X';
    return (
      <button
        key={menu.menuId}
        type="button"
        className={`cw-sm-item cw-sm-depth-${depth}${isActive ? ' active' : ''}`}
        disabled={disabled}
        title={disabled ? '비활성 메뉴' : undefined}
        onClick={() => this.onItemClick(menu)}
      >
        <span className="cw-sm-tree-node-name">{this.labelOf(menu)}</span>
      </button>
    );
  };

  renderMenuTree = () => {
    const { menu, panel } = this.props;
    const { keyword, collapsed } = this.state;
    const menus = this.filterMenus(menu || []);
    const kw = keyword.toLowerCase().trim();
    const visible = kw ? this.matchedSet(menus, kw) : null;
    const inSearch = (id) => !visible || visible.has(id);

    const sortSn = (m) => Number(m.sortSn) || 0;
    const childrenOf = (id) =>
      menus.filter((m) => m.upMenuId === id && inSearch(m.menuId)).sort((a, b) => sortSn(a) - sortSn(b));

    const level2 = childrenOf(panel);
    if (level2.length === 0) {
      return <div className="cw-sm-empty">{kw ? '검색 결과가 없습니다.' : '표시할 메뉴가 없습니다.'}</div>;
    }

    return level2.map((m2) => {
      const level3 = childrenOf(m2.menuId);
      if (level3.length === 0) {
        return this.renderLeaf(m2, 2);
      }
      const isCollapsed = !kw && collapsed[m2.menuId];
      return (
        <div key={m2.menuId} className={`cw-sm-group${isCollapsed ? ' collapsed' : ''}`}>
          <div
            className="cw-sm-group-header cw-sm-group-header-static"
            role="button"
            tabIndex={0}
            onClick={() => this.toggleGroup(m2.menuId)}
            onKeyDown={(e) => e.key === 'Enter' && this.toggleGroup(m2.menuId)}
          >
            <span className="cw-sm-group-left">
              <Arrow open={!isCollapsed} />
              {this.labelOf(m2)}
            </span>
          </div>
          <div className="cw-sm-group-body cw-sm-tree-children">
            {level3.map((m3) => this.renderLeaf(m3, 3))}
          </div>
        </div>
      );
    });
  };

  render() {
    const { title } = this.props;
    const { keyword } = this.state;

    return (
      <aside className="cw-submenu">
        <div className="cw-sm-header">
          <div className="cw-sm-header-left">
            <span className="cw-sm-title cw-sm-title--static">{title}</span>
          </div>
        </div>
        <div className="cw-sm-search">
          <input
            className="cw-input"
            type="text"
            placeholder="메뉴 검색"
            value={keyword}
            onChange={(e) => this.setState({ keyword: e.target.value })}
          />
          {keyword && (
            <button
              type="button"
              className="cw-sm-header-btn"
              title="지우기"
              onClick={() => this.setState({ keyword: '' })}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div className="cw-sm-nav">{this.renderMenuTree()}</div>
      </aside>
    );
  }
}

export default SubMenuPanel;
