/* Lọc & sắp xếp thuần (không DOM). */
import { daysBetween } from '../../utils/format.js';
export const DEFAULT_FILTERS = { q: '', owner: 'all', status: 'all', sort: 'due' };
const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const PRI = { high: 0, medium: 1, low: 2 };

function matches(t, f, today) {
  if (f.q.trim()) { const hay = fold([t.title, t.note, ...(t.tags || [])].join(' ')); if (!fold(f.q.trim()).split(/\s+/).every(w => hay.includes(w))) return false; }
  if (f.owner !== 'all' && (f.owner === 'none' ? t.owner !== '' : t.owner !== f.owner)) return false;
  if (f.status === 'open' && t.done) return false;
  if (f.status === 'done' && !t.done) return false;
  if (f.status === 'overdue' && (t.done || (daysBetween(t.due, today) ?? 0) >= 0)) return false;
  return true;
}
const cmp = (sort) => (a, b) => {
  if (a.done !== b.done) return a.done ? 1 : -1;                        // việc đã xong luôn xuống cuối
  if (sort === 'priority') { const d = PRI[a.priority] - PRI[b.priority]; if (d) return d; }
  if (sort === 'title') return a.title.localeCompare(b.title, 'vi');
  if (a.due !== b.due) return !a.due ? 1 : !b.due ? -1 : a.due < b.due ? -1 : 1;
  return a.title.localeCompare(b.title, 'vi');
};
/** Trả về [{ task, children, viaKids }]. viaKids: việc cha chỉ hiện vì có việc con khớp. */
export function applyFilters(tasks, f, today) {
  const out = [];
  tasks.filter(t => !t.parentId).forEach(t => {
    const kids = tasks.filter(k => k.parentId === t.id), self = matches(t, f, today), hit = kids.filter(k => matches(k, f, today));
    if (!self && !hit.length) return;
    out.push({ task: t, children: (self ? kids : hit).sort(cmp(f.sort)), viaKids: !self });
  });
  return out.sort((a, b) => cmp(f.sort)(a.task, b.task));
}
export const isFiltered = f => !!f.q.trim() || f.owner !== 'all' || f.status !== 'all';
