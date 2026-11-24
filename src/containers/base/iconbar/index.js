import React from 'react';
import { APP_NAME, APP_MARK } from 'constants/brand';

/**
 * CoreWorks 아이콘바 — 좌측 1열 셸.
 * 구조·클래스는 CoreWorks(coreworks.css)의 .cw-iconbar/.cw-ib-* 규격 그대로다.
 *
 * 상단 = DB 메뉴(gdsMenu)의 대분류 그룹 · 하단 = 로그아웃.
 * 그룹을 누르면 서브메뉴 패널이 그 그룹의 트리로 바뀐다(화면 이동은 서브메뉴에서).
 * 즐겨찾기·알림·마이메모는 여기 없다 — GNB 아이콘 → 우측 드로어(utildrawer)다(사용자 지시).
 */

const ico = (d) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* 대분류 메뉴에는 아이콘이 없다(DB 컬럼 없음) — 알려진 그룹은 지정, 나머지는 폴더 */
const GROUP_ICONS = {
  BO20: ico('M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M10 3.5a3 3 0 110 6 3 3 0 010-6'),
  BO30: ico('M3 8v4h3l6 4V4L6 8H3zM15 7a4.2 4.2 0 010 6'),
  BO40: ico('M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z'),
  DSH: ico('M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z'),
  OMP: ico('M10 3l6 3.5v7L10 17l-6-3.5v-7L10 3z'),
  CTM: ico('M5 3.5h7l3 3V16.5H5v-13zM12 3.5V7h3'),
  OTC: ico('M4 7h12M4 10h12M4 13h8'),
  HIF: ico('M4 15.5V8l6-4 6 4v7.5'),
  ITD: ico('M4 6h5v8H4zM11 6h5v8h-5z'),
  MAP: ico('M4 14l4-8 3 5 2-3 3 6'),
  QCM: ico('M10 3.5l6 2v5c0 3.4-2.5 5.6-6 6.5-3.5-.9-6-3.1-6-6.5v-5l6-2z'),
  RQS: ico('M5 7a4 4 0 017-2l1 1M15 13a4 4 0 01-7 2l-1-1M14 5l2 2M6 15l-2-2'),
  SYS: ico('M10 6.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1'),
};
const DEFAULT_ICON = ico('M3 5.5h5l2 2h7v8.5H3v-10.5z');

class IconBar extends React.Component {
  renderItem = (key, label, icon) => {
    const { active, onSelect } = this.props;
    return (
      <button
        key={key}
        type="button"
        className={`cw-ib-item${active === key ? ' active' : ''}`}
        title={label}
        onClick={() => onSelect(key)}
      >
        {icon}
        <span className="cw-ib-label">{label}</span>
      </button>
    );
  };

  render() {
    const { groups, expanded, homeActive, onToggleExpand, onHome, onLogout } = this.props;

    return (
      <nav className={`cw-iconbar${expanded ? ' expanded' : ''}`} aria-label="주 메뉴">
        <button
          className="cw-ib-hamburger"
          type="button"
          onClick={onToggleExpand}
          title={expanded ? '메뉴 접기' : '메뉴 펼치기'}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>

        {/* 로고 = 홈 버튼. CoreWorks 원본도 이 자리가 button 이고 .cw-ib-logo:hover/.active
            스타일이 이미 있다 — 눌러서 대시보드로 간다(사용자 지시 2026-09-03). */}
        <button
          type="button"
          className={`cw-ib-logo${homeActive ? ' active' : ''}`}
          title="홈 — 대시보드"
          onClick={onHome}
        >
          <span className="cw-ib-logo-mark">{APP_MARK}</span>
          <span className="cw-ib-logo-text">{APP_NAME}</span>
        </button>

        <div className="cw-ib-main">
          {groups.map((g) =>
            this.renderItem(g.menuId, g.menuNm, GROUP_ICONS[g.menuId] || DEFAULT_ICON)
          )}
        </div>

        <div className="cw-ib-bottom">
          <button type="button" className="cw-ib-item cw-ib-logout" title="로그아웃" onClick={onLogout}>
            {ico('M8 3H4v14h4M12 6l4 4-4 4M16 10H7')}
            <span className="cw-ib-label">로그아웃</span>
          </button>
        </div>
      </nav>
    );
  }
}

export default IconBar;
