/* Nghiệp vụ ngân sách — thao tác trên `data`, không DOM, không storage. */
import { newId } from '../utils/id.js';
import { normalizeItemInput, validateItem, normalizeRecordInput, validateRecord } from '../models/budget.js';

export const recordsOf = (budget, itemId) => budget.records.filter(r => r.itemId === itemId);
/** Thực tế của khoản: chi trừ thu (khoản chi được hoàn tiền thì giảm), khoản thu thì thu trừ chi. */
export function itemActual(budget, item) {
  const rs = recordsOf(budget, item.id);
  const chi = rs.filter(r => r.type !== 'thu').reduce((s, r) => s + r.amount, 0);
  const thu = rs.filter(r => r.type === 'thu').reduce((s, r) => s + r.amount, 0);
  return item.type === 'thu' ? thu - chi : chi - thu;
}
/** Nợ = các ghi chép chi đánh dấu trả sau. */
export const itemDebt = (budget, item) => recordsOf(budget, item.id).filter(r => r.deferred && r.type !== 'thu').reduce((s, r) => s + r.amount, 0);
/** Ngày trả nợ gần nhất của khoản — null nếu chưa có ngày nào. */
export function itemDebtDue(budget, item) {
  const ds = recordsOf(budget, item.id).filter(r => r.deferred && r.type !== 'thu' && r.dueDate).map(r => r.dueDate).sort();
  return ds[0] ?? null;
}

export function saveItem(data, input, id = null) {
  const it = normalizeItemInput(input);
  const errors = validateItem(it, { categories: data.categories });
  if (Object.keys(errors).length) return { ok: false, errors };
  if (id) { const cur = data.budget.items.find(x => x.id === id); if (!cur) return { ok: false, errors: { name: 'Không tìm thấy khoản.' } }; Object.assign(cur, it); return { ok: true }; }
  data.budget.items.push({ id: newId('b'), ...it });
  return { ok: true };
}
/** Xóa khoản thì xóa luôn các ghi chép của nó — không còn nơi nào để treo. */
export function removeItem(data, id) {
  const it = data.budget.items.find(x => x.id === id); if (!it) return { ok: false };
  data.budget.items = data.budget.items.filter(x => x.id !== id);
  data.budget.records = data.budget.records.filter(r => r.itemId !== id);
  return { ok: true, name: it.name };
}
export function addRecord(data, input) {
  const r = normalizeRecordInput(input);
  const item = data.budget.items.find(x => x.id === r.itemId);
  if (!item) return { ok: false, errors: { amount: 'Hãy chọn khoản.' } };
  const errors = validateRecord(r);
  if (Object.keys(errors).length) return { ok: false, errors };
  data.budget.records.push({ id: newId('r'), ...r });
  return { ok: true, item };
}
/** Sửa ghi chép: thay nội dung, giữ nguyên id. */
export function saveRecord(data, input, id) {
  const r = normalizeRecordInput(input);
  const item = data.budget.items.find(x => x.id === r.itemId);
  if (!item) return { ok: false, errors: { amount: 'Hãy chọn khoản.' } };
  const errors = validateRecord(r);
  if (Object.keys(errors).length) return { ok: false, errors };
  const cur = data.budget.records.find(x => x.id === id);
  if (!cur) return { ok: false, errors: { amount: 'Không tìm thấy ghi chép.' } };
  Object.assign(cur, r);
  return { ok: true, item };
}
export function removeRecord(data, id) {
  const r = data.budget.records.find(x => x.id === id); if (!r) return { ok: false };
  data.budget.records = data.budget.records.filter(x => x.id !== id);
  return { ok: true, amount: r.amount };
}
