/** 개인 테마 색상 — 메뉴·서브메뉴·업무 화면·버튼 포인트 */

export const THEME_LS = {
  POINT_COLOR: 'cw_theme_point_color',
  MENU_BG: 'cw_theme_menu_bg',
  SUBMENU_BG: 'cw_theme_submenu_bg',
  WORK_VIEW_BG: 'cw_theme_work_view_bg',
};

export const DEFAULT_POINT_COLOR = '#007acc';
export const DEFAULT_MENU_BG = '#007acc';
export const DEFAULT_SUBMENU_BG = '#f5f3f1';
export const DEFAULT_WORK_VIEW_BG = '#f1f4f9';

export const DEFAULT_THEME = {
  pointColor: DEFAULT_POINT_COLOR,
  menuBg: DEFAULT_MENU_BG,
  submenuBg: DEFAULT_SUBMENU_BG,
  workViewBg: DEFAULT_WORK_VIEW_BG,
};

const HEX_RE = /^#?([0-9a-f]{6})$/i;

export function normalizeHexColor(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const m = trimmed.match(HEX_RE);
  if (!m) return null;
  return `#${m[1].toLowerCase()}`;
}

export function readThemePrefs() {
  try {
    const pointColor = normalizeHexColor(localStorage.getItem(THEME_LS.POINT_COLOR)) || DEFAULT_POINT_COLOR;
    const menuStored = normalizeHexColor(localStorage.getItem(THEME_LS.MENU_BG));
    const submenuBg = normalizeHexColor(localStorage.getItem(THEME_LS.SUBMENU_BG)) || DEFAULT_SUBMENU_BG;
    const workViewBg = normalizeHexColor(localStorage.getItem(THEME_LS.WORK_VIEW_BG)) || DEFAULT_WORK_VIEW_BG;
    return {
      pointColor,
      menuBg: menuStored || pointColor,
      submenuBg,
      workViewBg,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function writeThemePrefs(prefs) {
  const pointColor = normalizeHexColor(prefs.pointColor);
  const menuBg = normalizeHexColor(prefs.menuBg);
  const submenuBg = normalizeHexColor(prefs.submenuBg);
  const workViewBg = normalizeHexColor(prefs.workViewBg);
  if (!pointColor || !menuBg || !submenuBg || !workViewBg) return false;
  try {
    localStorage.setItem(THEME_LS.POINT_COLOR, pointColor);
    localStorage.setItem(THEME_LS.MENU_BG, menuBg);
    localStorage.setItem(THEME_LS.SUBMENU_BG, submenuBg);
    localStorage.setItem(THEME_LS.WORK_VIEW_BG, workViewBg);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated readThemePrefs 사용 */
export function readPointColor() {
  return readThemePrefs().pointColor;
}

/** @deprecated writeThemePrefs 사용 */
export function writePointColor(hex) {
  const prefs = readThemePrefs();
  return writeThemePrefs({ ...prefs, pointColor: hex });
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r, g, b) {
  const to = (n) => clampByte(n).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function darkenRgb(r, g, b, ratio = 0.12) {
  return {
    r: r * (1 - ratio),
    g: g * (1 - ratio),
    b: b * (1 - ratio),
  };
}

function mixWithWhite(r, g, b, whiteWeight = 0.9) {
  const w = whiteWeight;
  const c = 1 - w;
  return {
    r: r * c + 255 * w,
    g: g * c + 255 * w,
    b: b * c + 255 * w,
  };
}

function relativeLuminance(r, g, b) {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function isDarkBackground(hex) {
  const { r, g, b } = hexToRgb(normalizeHexColor(hex) || DEFAULT_POINT_COLOR);
  return relativeLuminance(r, g, b) < 0.45;
}

const ON_LIGHT_FG = '#1e293b';
const ON_DARK_FG = '#ffffff';

export function derivePointTokens(pointHex) {
  const hex = normalizeHexColor(pointHex) || DEFAULT_POINT_COLOR;
  const { r, g, b } = hexToRgb(hex);
  const hover = darkenRgb(r, g, b, 0.14);
  const light = mixWithWhite(r, g, b, 0.9);
  const dark = isDarkBackground(hex);

  return {
    point: hex,
    pointHover: rgbToHex(hover.r, hover.g, hover.b),
    pointLight: rgbToHex(light.r, light.g, light.b),
    pointRgb: `${r}, ${g}, ${b}`,
    pointFg: dark ? ON_DARK_FG : ON_LIGHT_FG,
    pointFgMuted: dark ? 'rgba(255,255,255,0.82)' : 'rgba(30,41,59,0.72)',
    pointOnLightFg: ON_LIGHT_FG,
  };
}

export function deriveMenuBarTokens(menuHex) {
  const hex = normalizeHexColor(menuHex) || DEFAULT_MENU_BG;
  const dark = isDarkBackground(hex);
  return {
    iconbarBg: hex,
    iconbarText: dark ? 'rgba(255,255,255,0.82)' : 'rgba(30,41,59,0.72)',
    iconbarTextActive: dark ? ON_DARK_FG : ON_LIGHT_FG,
    iconbarHover: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    iconbarActive: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
    iconbarLogoBg: dark ? '#ffffff' : hex,
    iconbarLogoFg: dark ? hex : ON_DARK_FG,
  };
}

const POINT_CSS_KEYS = [
  ['--cw-point', 'point'],
  ['--cw-point-hover', 'pointHover'],
  ['--cw-point-light', 'pointLight'],
  ['--cw-point-rgb', 'pointRgb'],
  ['--cw-point-fg', 'pointFg'],
  ['--cw-point-fg-muted', 'pointFgMuted'],
  ['--cw-point-on-light-fg', 'pointOnLightFg'],
  ['--cw-primary', 'point'],
  ['--cw-primary-hover', 'pointHover'],
  ['--cw-primary-light', 'pointLight'],
  ['--cw-primary-fg', 'pointFg'],
];

const MENU_CSS_KEYS = [
  ['--iconbar-bg', 'iconbarBg'],
  ['--iconbar-text', 'iconbarText'],
  ['--iconbar-text-active', 'iconbarTextActive'],
  ['--iconbar-hover', 'iconbarHover'],
  ['--iconbar-active', 'iconbarActive'],
  ['--iconbar-logo-bg', 'iconbarLogoBg'],
  ['--iconbar-logo-fg', 'iconbarLogoFg'],
];

/**
 * document 루트에 테마 CSS 변수 적용 (앱 로드·색상 변경 시 호출)
 */
export function applyTheme(prefs) {
  if (typeof document === 'undefined') {
    return {
      point: derivePointTokens(prefs?.pointColor),
      menu: deriveMenuBarTokens(prefs?.menuBg),
    };
  }
  const resolved = prefs || readThemePrefs();
  const point = derivePointTokens(resolved.pointColor);
  const menu = deriveMenuBarTokens(resolved.menuBg);
  const root = document.documentElement;

  POINT_CSS_KEYS.forEach(([cssVar, tokenKey]) => {
    root.style.setProperty(cssVar, point[tokenKey]);
  });
  MENU_CSS_KEYS.forEach(([cssVar, tokenKey]) => {
    root.style.setProperty(cssVar, menu[tokenKey]);
  });
  root.style.setProperty('--submenu-bg', normalizeHexColor(resolved.submenuBg) || DEFAULT_SUBMENU_BG);
  root.style.setProperty('--work-view-bg', normalizeHexColor(resolved.workViewBg) || DEFAULT_WORK_VIEW_BG);

  return { point, menu };
}

/** @deprecated applyTheme 사용 */
export function applyPointTheme(color) {
  const prefs = readThemePrefs();
  return applyTheme({ ...prefs, pointColor: color });
}

export function validateThemeDraft(draft) {
  const pointColor = normalizeHexColor(draft.pointColor);
  const menuBg = normalizeHexColor(draft.menuBg);
  const submenuBg = normalizeHexColor(draft.submenuBg);
  const workViewBg = normalizeHexColor(draft.workViewBg);
  if (!pointColor || !menuBg || !submenuBg || !workViewBg) return null;
  return { pointColor, menuBg, submenuBg, workViewBg };
}
