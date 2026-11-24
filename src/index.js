import { createRoot } from 'react-dom/client';
import App from 'containers/App.js';
import 'react-app-polyfill/stable';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 회사별 파비콘·타이틀 적용(CSS 변수 주입은 CoreWorks 테마가 대신한다)
import { applyTheme as applyCompanyMeta } from 'common/theme';
// CoreWorks 개인 테마(포인트색·메뉴/서브메뉴/본문 배경) — localStorage 기반
import { applyTheme as applyCwTheme, THEME_LS } from './coreworks/common/themePrefs';
// CoreWorks 셸·컴포넌트 스타일 (component.css 뒤에 로드되어 이긴다)
import 'assets/styles/cw-shell.css';

applyCompanyMeta();
applyCwTheme();

// 컬러설정은 팝업 창(COM0030)에서 바꾼다 — 같은 오리진의 storage 이벤트로
// 본창(그리고 다른 팝업 창)이 실시간으로 따라 바뀐다.
const THEME_KEYS = new Set(Object.values(THEME_LS));
window.addEventListener('storage', (e) => {
  if (!e || e.key === null || THEME_KEYS.has(e.key)) {
    applyCwTheme();
  }
});

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path='/*' element={<App />} />
    </Routes>
  </BrowserRouter>
);
