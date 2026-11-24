export const LAYOUT_LS = {
  MENU_EXPANDED: 'cw_layout_menu_expanded',
  SUBMENU_VISIBLE: 'cw_layout_submenu_visible',
};

export const LAYOUT_EVENTS = {
  SUBMENU_VISIBLE_CHANGED: 'cw:layout-submenu-visible-changed',
};

export function readLsBool(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

export function writeLsBool(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function setSubMenuVisible(visible) {
  writeLsBool(LAYOUT_LS.SUBMENU_VISIBLE, visible);
  window.dispatchEvent(new CustomEvent(LAYOUT_EVENTS.SUBMENU_VISIBLE_CHANGED, {
    detail: { visible },
  }));
}

export function subscribeSubMenuVisible(callback) {
  const notify = () => callback(readLsBool(LAYOUT_LS.SUBMENU_VISIBLE, true));
  const onCustom = () => notify();
  const onStorage = (event) => {
    if (!event || event.key === LAYOUT_LS.SUBMENU_VISIBLE) notify();
  };
  window.addEventListener(LAYOUT_EVENTS.SUBMENU_VISIBLE_CHANGED, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LAYOUT_EVENTS.SUBMENU_VISIBLE_CHANGED, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
