/* Điều hướng theo hash; mỗi trang nạp lười (dynamic import) và có AbortController riêng để dọn listener. */
import { renderNav, ROUTES } from './nav.js';
const loaders = {
  '/tong-quan': () => import('../features/dashboard/dashboardView.js'),
  '/viec': () => import('../features/checklist/checklistView.js'),
  '/ngan-sach': () => import('../features/budget/budgetView.js'),
  '/cai-dat': () => import('../features/settings/settingsView.js'),
};
let ctrl, first = true;
export function startRouter(main) {
  const go = async () => {
    const want = location.hash.slice(1), path = loaders[want] ? want : '/tong-quan';
    ctrl?.abort(); ctrl = new AbortController(); const { signal } = ctrl;
    const mod = await loaders[path](); if (signal.aborted) return;
    renderNav(path); document.title = `${ROUTES.find(r => r.path === path).label} — Sổ tay cưới`;
    main.replaceChildren(); mod.mount(main, signal);
    if (!first) { main.focus({ preventScroll: true }); scrollTo(0, 0); } first = false;
  };
  addEventListener('hashchange', go); return go();
}
