import { parseDate } from '../utils/format.js';
export const ITEM_TYPES = { chi: 'Chi', thu: 'Thu' };

export function normalizeItemInput(i) {
  return { categoryId: i.categoryId || '', name: String(i.name ?? '').trim(), type: ITEM_TYPES[i.type] ? i.type : 'chi',
    planned: Math.round(Number(i.planned) || 0), date: i.date || '', note: String(i.note ?? '').trim() };
}
/** Quy tắc miền cho khoản (danh mục). Trả về { trường: thông báo } — rỗng nghĩa là hợp lệ. */
export function validateItem(it, { categories }) {
  const e = {};
  if (!it.name) e.name = 'Hãy nhập tên khoản.'; else if (it.name.length > 120) e.name = 'Tên khoản tối đa 120 ký tự.';
  if (!Number.isInteger(it.planned) || it.planned < 0) e.planned = 'Số tiền dự tính phải là số không âm.';
  if (!categories.some(c => c.id === it.categoryId)) e.categoryId = 'Hãy chọn nhóm.';
  if (it.date && !parseDate(it.date)) e.date = 'Ngày dự kiến không hợp lệ.';
  return e;
}
export function normalizeRecordInput(i) {
  return { itemId: i.itemId || '', type: ITEM_TYPES[i.type] ? i.type : 'chi', amount: Math.round(Number(i.amount) || 0),
    date: i.date || '', note: String(i.note ?? '').trim(), deferred: !!i.deferred, dueDate: i.deferred ? (i.dueDate || '') : '' };
}
/** Trả sau = đã chốt nhưng chưa ra tiền — ngày trả dự kiến là tùy chọn (chưa chốt lịch thì để trống). */
export function validateRecord(r) {
  const e = {};
  if (!Number.isInteger(r.amount) || r.amount <= 0) e.amount = 'Số tiền phải lớn hơn 0.';
  if (r.date && !parseDate(r.date)) e.date = 'Ngày ghi chép không hợp lệ.';
  if (r.deferred && r.dueDate && !parseDate(r.dueDate)) e.dueDate = 'Ngày trả dự kiến không hợp lệ.';
  return e;
}
