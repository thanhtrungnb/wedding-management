import { svg } from '../ui/icons.js';
export const ROUTES = [
  { path: '/tong-quan', label: 'Tổng quan', short: 'Tổng quan', icon: 'home' },
  { path: '/viec', label: 'Việc cần làm', short: 'Việc làm', icon: 'list' },
  { path: '/ngan-sach', label: 'Ngân sách', short: 'Ngân sách', icon: 'coin', soon: true },
  { path: '/lich-trinh', label: 'Lịch trình', short: 'Lịch trình', icon: 'cal', soon: true },
  { path: '/cai-dat', label: 'Cài đặt', short: 'Cài đặt', icon: 'cog' },
];
const item = (r, active, cls, text) => r.soon
  ? `<button type="button" class="${cls}" aria-disabled="true" data-soon>${svg(r.icon)}<span>${text}</span>${cls === 'nav__item' ? '<span class="nav__soon">Sắp có</span>' : ''}</button>`
  : `<a class="${cls}" href="#${r.path}" ${r.path === active ? 'aria-current="page"' : ''}>${svg(r.icon)}<span>${text}</span></a>`;
export function renderNav(active) {
  document.getElementById('nav').innerHTML = ROUTES.map(r => item(r, active, 'nav__item', r.label)).join('');
  /* Tabbar mobile chỉ gồm các mục dùng được thật — mục "Sắp có" chiếm chỗ mà không dẫn đi đâu. */
  document.getElementById('tabbar').innerHTML = ROUTES.filter(r => !r.soon).map(r => item(r, active, 'tab', r.short)).join('');
}
