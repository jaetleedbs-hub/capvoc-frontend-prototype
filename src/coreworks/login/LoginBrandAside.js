import React from 'react';
import { APP_NAME, APP_SUBTITLE, APP_MARK, APP_TAGLINE, APP_FEATURES } from 'constants/brand';

/**
 * 로그인 화면 좌측 브랜드 패널.
 *
 * ★ 문구는 여기 없다 — `src/constants/brand.js` 하나에 모여 있다.
 *   이 파일은 «어떻게 보이는가»만 다룬다.
 */
function FeatureIcon({ type }) {
  if (type === 'work') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M5 7h6M5 10h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="12" height="11" rx="1.5" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2.5h7l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1v-10a1 1 0 011-1z" />
      <path d="M10 2.5v3h3M5 9h6M5 11.5h4" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginBrandAside() {
  return (
    <aside className="cw-login-brand" aria-hidden="false">
      <div className="cw-login-brand-inner">
        <div className="cw-login-brand-logo">
          <span className="cw-login-brand-mark">{APP_MARK}</span>
          <div>
            <div className="cw-login-brand-name">{APP_NAME}</div>
            <div className="cw-login-brand-sub">{APP_SUBTITLE}</div>
          </div>
        </div>
        <p className="cw-login-brand-tagline">{APP_TAGLINE}</p>
        <ul className="cw-login-brand-features">
          {APP_FEATURES.map(({ key, icon, label }) => (
            <li key={key} className="cw-login-brand-feature">
              <span className="cw-login-brand-feature-icon">
                <FeatureIcon type={icon} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
