import { svg } from '../ui/icons.js';
import { getLastSync } from '../storage/remoteStore.js';
import { formatSyncTime } from '../utils/format.js';
export const ROUTES = [
  { path: '/tong-quan', label: 'Tổng quan', short: 'Tổng quan', icon: 'home' },
  { path: '/viec', label: 'Việc cần làm', short: 'Việc làm', icon: 'list' },
  { path: '/ngan-sach', label: 'Ngân sách', short: 'Ngân sách', icon: 'coin', soon: true },
  { path: '/lich-trinh', label: 'Lịch trình', short: 'Lịch trình', icon: 'cal', soon: true },
  { path: '/cai-dat', label: 'Cài đặt', short: 'Cài đặt', icon: 'sliders' },
];
const item = (r, active, cls, text) => r.soon
  ? `<button type="button" class="${cls}" aria-disabled="true" data-soon>${svg(r.icon)}<span>${text}</span>${cls === 'nav__item' ? '<span class="nav__soon">Sắp có</span>' : ''}</button>`
  : `<a class="${cls}" href="#${r.path}" ${r.path === active ? 'aria-current="page"' : ''}>${svg(r.icon)}<span>${text}</span></a>`;
/** Cập nhật dòng "đồng bộ lần cuối" ở chân thanh bên — gọi lại sau mỗi lần push/pull. */
export const updateSyncNote = () => { const el = document.getElementById('side-sync'); if (el) el.textContent = formatSyncTime(getLastSync()); };
export function renderNav(active) {
  /* Cài đặt tách riêng, đẩy xuống cuối thanh menu. */
  const main = ROUTES.filter(r => r.path !== '/cai-dat'), end = ROUTES.filter(r => r.path === '/cai-dat');
  document.getElementById('nav').innerHTML = main.map(r => item(r, active, 'nav__item', r.label)).join('')
    + end.map(r => item(r, active, 'nav__item nav__item--end', r.label)).join('')
    /* Dòng đồng bộ nằm ngay sát nút Cài đặt ở cuối thanh, như chú thích của riêng nút đó. */
    + `<p class="side__sync" id="side-sync">${formatSyncTime(getLastSync())}</p>`;
  /* Tabbar mobile chỉ gồm các mục dùng được thật — mục "Sắp có" chiếm chỗ mà không dẫn đi đâu. */
  document.getElementById('tabbar').innerHTML = ROUTES.filter(r => !r.soon).map(r => item(r, active, 'tab', r.short)).join('');
  updateSyncNote();
}
