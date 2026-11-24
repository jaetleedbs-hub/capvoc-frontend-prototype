import React from 'react';
import { ThemeColorSettingsPanel } from '../../../coreworks/profile/ThemeColorSettings';
import {
	DEFAULT_THEME,
	readThemePrefs,
	validateThemeDraft,
	writeThemePrefs,
	applyTheme,
} from '../../../coreworks/common/themePrefs';

/**
 * COM0030 환경설정 — 개인 화면 컬러 (CoreWorks 컬러설정 이식).
 *
 * DB 메뉴가 아니라 EssentialRoutes 로 등록되며, GNB 톱니에서 같은 창 모달로 뜬다.
 * CoreWorks 원본과 같이 <고르면 즉시 적용 + localStorage 저장>이다. 저장은 서버에
 * 가지 않는다(브라우저 개인 설정). 다른 창(새창 팝업)은 storage 이벤트로 따라 바뀐다.
 */
class COM0030 extends React.Component {
	state = {
		draft: readThemePrefs(),
	};

	onChange = (key, value) => {
		const draft = { ...this.state.draft, [key]: value };
		this.setState({ draft });
		// hex 6자리로 완성된 순간에만 적용한다 — 입력 중간값으로 화면이 튀지 않게
		const valid = validateThemeDraft(draft);
		if (valid) {
			writeThemePrefs(valid);
			applyTheme(valid);
		}
	};

	onReset = () => {
		writeThemePrefs(DEFAULT_THEME);
		applyTheme(DEFAULT_THEME);
		this.setState({ draft: { ...DEFAULT_THEME } });
	};

	render() {
		return (
			<div className="cw-theme-settings">
				<ThemeColorSettingsPanel draft={this.state.draft} onChange={this.onChange} />
				<div className="cw-theme-color-actions">
					<button type="button" className="cw-btn-outline" onClick={this.onReset}>기본값으로 초기화</button>
					<button type="button" className="cw-btn-primary" onClick={() => this.props.onClose && this.props.onClose()}>닫기</button>
				</div>
			</div>
		);
	}
}

export default COM0030;
