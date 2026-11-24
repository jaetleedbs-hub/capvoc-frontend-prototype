import React from 'react';
import SideFavorite from '../side/favorite';
import SideNotification from '../side/notification';
import SideMemo from '../side/memo';

// 즐겨찾기·알림·마이메모 패널의 기존 스타일(explorer-* 등)은 side.css 에 있다.
import 'assets/styles/side.css';

const TITLES = { favorite: '즐겨찾기', notification: '알림', memo: '마이메모' };

/**
 * 우측 슬라이드 패널 — GNB 아이콘(즐겨찾기·알림·마이메모)으로 연다.
 *
 * 좌측은 메뉴 전용, 유틸 패널은 우측 드로어 — 두 영역이 겹치지 않는다(사용자 지시).
 * 패널 컴포넌트는 옛 사이드 레일의 것을 그대로 태운다.
 */
class UtilDrawer extends React.Component {
	componentDidMount() {
		window.addEventListener('keydown', this.onKeyDown);
	}

	componentWillUnmount() {
		window.removeEventListener('keydown', this.onKeyDown);
	}

	onKeyDown = (e) => {
		if (e.key === 'Escape') this.props.onClose();
	};

	renderPanel() {
		const { panel, openMenu, onClose } = this.props;
		if (panel === 'favorite') {
			return <SideFavorite openMenu={openMenu} onMenuToggle={onClose} />;
		}
		if (panel === 'notification') {
			return <SideNotification openMenu={openMenu} />;
		}
		return <SideMemo />;
	}

	render() {
		const { panel, onClose } = this.props;
		return (
			<aside className="cw-util-drawer" aria-label={TITLES[panel]}>
				<div className="cw-util-drawer-header">
					<span className="cw-util-drawer-title">{TITLES[panel]}</span>
					<button type="button" className="cw-sm-header-btn" title="닫기" onClick={onClose}>
						<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
						</svg>
					</button>
				</div>
				{/* key=panel — 패널을 갈아탈 때 이전 패널 상태를 끌고 가지 않는다 */}
				<div className="cw-util-drawer-body" key={panel}>{this.renderPanel()}</div>
			</aside>
		);
	}
}

export default UtilDrawer;
