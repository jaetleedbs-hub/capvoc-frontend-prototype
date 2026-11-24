import { createRoot } from 'react-dom/client';

const rootMap = new Map();

export function renderToContainer(container, element) {
  const id = typeof container === 'string' ? container : container.id || container;
  const domNode = typeof container === 'string' ? document.getElementById(container) : container;
  if (!domNode) return null;

  let entry = rootMap.get(id);
  if (entry && entry.container !== domNode) {
    try { entry.root.unmount(); } catch (e) { /* already unmounted */ }
    entry = null;
    rootMap.delete(id);
  }
  if (!entry) {
    const root = createRoot(domNode);
    entry = { root, container: domNode };
    rootMap.set(id, entry);
  }
  entry.root.render(element);
  return entry.root;
}

export function unmountFromContainer(container, removeFromDOM = false) {
  const id = typeof container === 'string' ? container : (container && container.id) || container;
  const entry = rootMap.get(id);
  if (entry) {
    try { entry.root.unmount(); } catch (e) { /* already unmounted */ }
    rootMap.delete(id);
  }
  if (removeFromDOM) {
    const domNode = typeof container === 'string' ? document.getElementById(container) : container;
    if (domNode && domNode.parentNode) {
      domNode.parentNode.removeChild(domNode);
    }
  }
}

export function getRoot(containerId) {
  const entry = rootMap.get(containerId);
  return entry ? entry.root : null;
}

export function hasRoot(containerId) {
  return rootMap.has(containerId);
}
