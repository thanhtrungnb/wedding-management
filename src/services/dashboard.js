/* Logic thuần (không DOM) cho bảng tổng quan. */
import { daysBetween } from '../utils/format.js';
export const childrenOf = (tasks, id) => tasks.filter(t => t.parentId === id);
/** Tối đa 2 cấp: chỉ việc cấp 1 mới được làm cha. */
export const canHaveParent = (tasks, parentId) => { const p = tasks.find(t => t.id === parentId); return !!p && p.parentId === null; };
/** Đơn vị tiến độ: việc cha có con → tính theo các việc con; còn lại tự tính. Không đếm trùng. */
export const progressUnits = tasks => tasks.filter(t => childrenOf(tasks, t.id).length === 0);
export function progress(tasks) {
  const u = progressUnits(tasks), done = u.filter(t => t.done).length;
  return { done, total: u.length, pct: u.length ? Math.round(done / u.length * 100) : 0 };
}
export const parentProgress = (tasks, id) => { const c = childrenOf(tasks, id); return { done: c.filter(t => t.done).length, total: c.length }; };
export const categoryProgress = (tasks, cats) => cats.map(c => ({ ...c, ...progress(tasks.filter(t => t.categoryId === c.id)) })).filter(c => c.total);
const PRI = { high:0, medium:1, low:2 };
/** Quá hạn trước, rồi gần hạn nhất; ưu tiên cao được đẩy lên nhẹ. Việc không có ngày xếp cuối. */
export function nextActions(tasks, today, limit = 5) {
  const open = progressUnits(tasks).filter(t => !t.done).map(t => ({ ...t, days: daysBetween(t.due, today) }));
  const score = t => (t.days === null ? 9e3 : t.days < 0 ? -1e4 + t.days : t.days) + PRI[t.priority] * 4;
  return open.sort((a, b) => score(a) - score(b)).slice(0, limit);
}
export const overdueCount = (tasks, today) => progressUnits(tasks).filter(t => !t.done && (daysBetween(t.due, today) ?? 0) < 0).length;
export const weekCount = (tasks, today) => progressUnits(tasks).filter(t => { const d = daysBetween(t.due, today); return !t.done && d !== null && d >= 0 && d <= 7; }).length;
export const parentOf = (tasks, t) => tasks.find(x => x.id === t.parentId);
/** Dự kiến và thực tế tách riêng. Còn phải trả = đã chốt − đã trả. */
export function budgetSummary(b) {
  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const planned = sum(b.items,'planned'), committed = sum(b.items,'committed'), paid = sum(b.items,'paid'), income = sum(b.income,'amount');
  return { planned, committed, paid, outstanding: committed - paid, unbooked: Math.max(0, planned - committed), overCommit: Math.max(0, committed - planned), income, balance: income - planned };
}
