import React from 'react';
import LoginBrandAside from './LoginBrandAside';
import '../coreworks.css';
import { APP_FOOTER } from 'constants/brand';

/**
 * 로그인 화면 껍데기(좌: 브랜드 패널 / 우: 입력 폼).
 *
 * ★ 문구는 여기 없다 — `src/constants/brand.js` 를 고친다.
 * 상세는 ../PORTED.md
 */
export default function AuthFormShell({
  title,
  subtitle,
  children,
  footer,
  showFooter = true,
}) {
  return (
    <div className="cw-login-page">
      <LoginBrandAside />
      <main className="cw-login-form-panel">
        <div className="cw-login-form-wrap">
          <div className="cw-login-form-head">
            <h1 className="cw-login-form-title">{title}</h1>
            {subtitle && <p className="cw-login-form-desc">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="cw-login-links">{footer}</div>}
          {showFooter && (
            <div className="cw-login-footer">{APP_FOOTER}</div>
          )}
        </div>
      </main>
    </div>
  );
}
