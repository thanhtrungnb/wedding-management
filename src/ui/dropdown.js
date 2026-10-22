/* Dropdown tùy biến (listbox) — bàn phím, ARIA, đóng khi bấm ra ngoài. Có input ẩn nên dùng được trong <form>. */
import { esc } from '../utils/format.js';
import { svg } from './icons.js';

export function dropdown({ name, label, options, value = '', disabled = false }) {
  const cur = options.find(o => o.value === value) ?? options[0];
  return `<div class="dd" data-dd="${name}"><span class="dd__lab" id="dd-${name}-l">${esc(label)}</span>
  <input type="hidden" name="${name}" value="${esc(cur.value)}">
  <button type="button" class="dd__btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="dd-${name}-l dd-${name}-v" ${disabled ? 'disabled' : ''}>
    <span class="dd__v" id="dd-${name}-v">${esc(cur.label)}</span>${svg('down')}</button>
  <ul class="dd__list" role="listbox" aria-labelledby="dd-${name}-l" hidden>${options.map((o, i) =>
    `<li role="option" id="dd-${name}-o${i}" data-v="${esc(o.value)}" aria-selected="${o.value === cur.value}">${esc(o.label)}</li>`).join('')}</ul></div>`;
}
const opts = dd => [...dd.querySelectorAll('[role=option]')];
function setOpen(dd, open) {
  const btn = dd.querySelector('.dd__btn'), list = dd.querySelector('.dd__list');
  list.hidden = !open; btn.setAttribute('aria-expanded', open);
  if (open) { const sel = opts(dd).find(o => o.getAttribute('aria-selected') === 'true') ?? opts(dd)[0]; setActive(dd, sel); }
  else btn.removeAttribute('aria-activedescendant');
}
function setActive(dd, li) {
  opts(dd).forEach(o => o.classList.toggle('is-active', o === li));
  dd.querySelector('.dd__btn').setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' });
}
function pick(dd, li, onChange) {
  const name = dd.dataset.dd, v = li.dataset.v;
  setDropdown(dd, name, v); setOpen(dd, false); dd.querySelector('.dd__btn').focus(); onChange?.(name, v);
}
/** Cập nhật giá trị/trạng thái từ code (không phát sự kiện onChange). */
export function setDropdown(root, name, value, { disabled } = {}) {
  const dd = root.dataset?.dd === name ? root : root.querySelector(`[data-dd="${name}"]`); if (!dd) return;
  const li = opts(dd).find(o => o.dataset.v === value) ?? opts(dd)[0];
  dd.querySelector('input').value = li.dataset.v; dd.querySelector('.dd__v').textContent = li.textContent;
  opts(dd).forEach(o => o.setAttribute('aria-selected', o === li));
  if (disabled !== undefined) dd.querySelector('.dd__btn').disabled = disabled;
}
export function bindDropdowns(root, signal, onChange) {
  const closeAll = except => root.querySelectorAll('.dd').forEach(d => d !== except && setOpen(d, false));
  root.addEventListener('click', e => {
    const dd = e.target.closest('.dd'); if (!dd) return;
    const li = e.target.closest('[role=option]');
    if (li) return pick(dd, li, onChange);
    if (e.target.closest('.dd__btn')) { const open = dd.querySelector('.dd__list').hidden; closeAll(dd); setOpen(dd, open); }
  }, { signal });
  root.addEventListener('keydown', e => {
    const dd = e.target.closest('.dd'); if (!dd || !e.target.closest('.dd__btn')) return;
    const open = !dd.querySelector('.dd__list').hidden, list = opts(dd), cur = list.findIndex(o => o.classList.contains('is-active'));
    const move = i => { if (!open) setOpen(dd, true); setActive(dd, list[Math.max(0, Math.min(list.length - 1, i))]); };
    if (e.key === 'ArrowDown') { e.preventDefault(); open ? move(cur + 1) : setOpen(dd, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); open ? move(cur - 1) : setOpen(dd, true); }
    else if (e.key === 'Home' && open) { e.preventDefault(); move(0); }
    else if (e.key === 'End' && open) { e.preventDefault(); move(list.length - 1); }
    else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); pick(dd, list[cur], onChange); }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(dd, false); }
    else if (e.key === 'Tab') setOpen(dd, false);
  }, { signal });
  document.addEventListener('click', e => { if (!e.target.closest('.dd')) closeAll(); }, { signal });
}
