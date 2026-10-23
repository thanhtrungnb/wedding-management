import { svg } from '../ui/icons.js';
import { getLastSync } from '../storage/remoteStore.js';
import { formatSyncTime } from '../utils/format.js';
export const ROUTES = [
  { path: '/tong-quan', label: 'Tổng quan', short: 'Tổng quan', icon: 'home' },
  { path: '/viec', label: 'Việc cần làm', short: 'Việc làm', icon: 'list' },
  { path: '/ngan-sach', label: 'Ngân sách', short: 'Ngân sách', icon: 'coin' },
  { path: '/lich-trinh', label: 'Lịch trình', short: 'Lịch trình', icon: 'cal' },
  { path: '/thiep', label: 'Thiệp', short: 'Thiệp', icon: 'heart' },
  { path: '/khach-moi', label: 'Khách mời', short: 'Khách mời', icon: 'user' },
  { path: '/cai-dat', label: 'Cài đặt', short: 'Cài đặt', icon: 'sliders' },
];
/* Tabbar mobile chỉ cố định 3 mục dùng nhiều nhất — mục còn lại gộp vào nút "Thêm" để không bị chật trên màn hẹp. */
const TAB_PRIMARY = ['/tong-quan', '/viec', '/ngan-sach'];
const item = (r, active, cls, text) => r.soon
  ? `<button type="button" class="${cls}" aria-disabled="true" data-soon>${svg(r.icon)}<span>${text}</span>${cls === 'nav__item' ? '<span class="nav__soon">Sắp có</span>' : ''}</button>`
  : `<a class="${cls}" href="#${r.path}" ${r.path === active ? 'aria-current="page"' : ''}>${svg(r.icon)}<span>${text}</span></a>`;
/** Cập nhật dòng "đồng bộ lần cuối" ở chân thanh bên — gọi lại sau mỗi lần push/pull. */
export const updateSyncNote = () => { const el = document.getElementById('side-sync'); if (el) el.textContent = formatSyncTime(getLastSync()); };
let currentPath = '', menuEl = null;
function closeMore() {
  menuEl?.remove(); menuEl = null;
  document.querySelector('.tab__more')?.setAttribute('aria-expanded', 'false');
}
export function renderNav(active) {
  currentPath = active;
  closeMore();
  /* Cài đặt tách riêng, đẩy xuống cuối thanh menu. */
  const main = ROUTES.filter(r => r.path !== '/cai-dat'), end = ROUTES.filter(r => r.path === '/cai-dat');
  document.getElementById('nav').innerHTML = main.map(r => item(r, active, 'nav__item', r.label)).join('')
    + end.map(r => item(r, active, 'nav__item nav__item--end', r.label)).join('')
    /* Dòng đồng bộ nằm ngay sát nút Cài đặt ở cuối thanh, như chú thích của riêng nút đó. */
    + `<p class="side__sync" id="side-sync">${formatSyncTime(getLastSync())}</p>`;
  /* Tabbar: 3 mục chính + nút "Thêm"; nút "Thêm" sáng lên khi đang đứng ở một mục trong menu. */
  const tabs = ROUTES.filter(r => !r.soon);
  const primary = tabs.filter(r => TAB_PRIMARY.includes(r.path));
  const moreOn = tabs.some(r => !TAB_PRIMARY.includes(r.path) && r.path === active);
  document.getElementById('tabbar').innerHTML = primary.map(r => item(r, active, 'tab', r.short)).join('')
    + `<button type="button" class="tab tab__more${moreOn ? ' is-on' : ''}" aria-haspopup="menu" aria-expanded="false">${svg('menu')}<span>Thêm</span></button>`;
  updateSyncNote();
}
/* Gắn một lần cho tabbar tĩnh trong index.html — renderNav chỉ thay innerHTML nên listener không bị mất. */
const tabbar = document.getElementById('tabbar');
tabbar.addEventListener('click', e => {
  if (!e.target.closest('.tab__more')) return;
  if (menuEl) return closeMore();
  menuEl = document.createElement('div');
  menuEl.className = 'tabmore';
  menuEl.setAttribute('role', 'menu');
  menuEl.innerHTML = ROUTES.filter(r => !r.soon && !TAB_PRIMARY.includes(r.path))
    .map(r => `<a role="menuitem" href="#${r.path}" ${r.path === currentPath ? 'aria-current="page"' : ''}>${svg(r.icon)}<span>${r.label}</span></a>`).join('');
  document.body.append(menuEl);
  e.target.closest('.tab__more').setAttribute('aria-expanded', 'true');
});
document.addEventListener('click', e => {
  if (menuEl && !e.target.closest('.tabmore') && !e.target.closest('.tab__more')) closeMore();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMore(); });
