import { APP_NAME } from 'constants/brand';

/**
 * 색 테마 — 빌드 시점의 VITE_COMPANY_CODE 로 색 계열을 고른다.
 *
 * 여기에는 «색»만 있다.
 *  · 이름·표어·마크 글자 → src/constants/brand.js
 *  · 탭 아이콘           → index.html 의 <link rel="icon"> (원본 public/brand/icon-source.svg)
 *
 * 종전에는 여기에 회사별 로고 파일명·파비콘 파일명·회사명까지 있었는데
 * <아무도 읽지 않는 값>이었다(가리키던 /images/company/ 폴더도 없었다).
 * 정의만 있고 읽는 곳이 없는 설정은 「있으니 되겠지」로 읽혀 점검을 방해한다. 걷어냈다.
 */

const defaultTheme = {
  primaryColor: '#1976d2',
  secondaryColor: '#1565c0',
};

// 회사·테마별 색 계열. 필요하면 늘린다 — 키는 VITE_COMPANY_CODE 값이다.
const companyThemes = {
  'COMPANY_A': { primaryColor: '#1976d2', secondaryColor: '#1565c0' },
  'COMPANY_B': { primaryColor: '#388e3c', secondaryColor: '#2e7d32' },
  'COMPANY_C': { primaryColor: '#d32f2f', secondaryColor: '#c62828' },
};

export const getCompanyCode = () => process.env.REACT_APP_COMPANY_CODE || 'DEFAULT';

export const getCurrentTheme = () => companyThemes[getCompanyCode()] || defaultTheme;

export const getPrimaryColor = () =>
  process.env.REACT_APP_PRIMARY_COLOR || getCurrentTheme().primaryColor;

export const getSecondaryColor = () =>
  process.env.REACT_APP_SECONDARY_COLOR || getCurrentTheme().secondaryColor;

/** CSS 변수로 색을 심고, 탭 제목을 브랜드 이름으로 둔다 */
export const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', getPrimaryColor());
  root.style.setProperty('--secondary-color', getSecondaryColor());
  document.title = APP_NAME;
};

export default {
  getCompanyCode,
  getCurrentTheme,
  getPrimaryColor,
  getSecondaryColor,
  applyTheme,
};
