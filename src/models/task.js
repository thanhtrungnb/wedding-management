import { parseDate } from '../utils/format.js';
export const PRIORITIES = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
export const OWNERS = { bride: 'Cô dâu', groom: 'Chú rể', both: 'Cả hai' };
export const ownerLabel = o => OWNERS[o] || 'Chưa phân công';
export const parseTags = s => [...new Set(String(s ?? '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean))].slice(0, 8);

export function normalizeTaskInput(i) {
  return { title: String(i.title ?? '').trim(), categoryId: i.categoryId || '', parentId: i.parentId || null, due: i.due || '',
    priority: i.priority || 'medium', owner: i.owner || '', tags: Array.isArray(i.tags) ? i.tags : parseTags(i.tags), note: String(i.note ?? '').trim() };
}
/** Quy tắc miền: tối đa 2 cấp. Trả về { trường: thông báo } — rỗng nghĩa là hợp lệ. */
export function validateTask(t, { tasks, categories, selfId = null }) {
  const e = {};
  if (!t.title) e.title = 'Hãy nhập tên việc.'; else if (t.title.length > 120) e.title = 'Tên việc tối đa 120 ký tự.';
  if (t.due && !parseDate(t.due)) e.due = 'Ngày không hợp lệ.';
  if (!PRIORITIES[t.priority]) e.priority = 'Mức ưu tiên không hợp lệ.';
  if (t.owner && !OWNERS[t.owner]) e.owner = 'Người phụ trách không hợp lệ.';
  if (t.parentId) {
    const p = tasks.find(x => x.id === t.parentId);
    if (!p) e.parentId = 'Không tìm thấy việc cha.';
    else if (p.parentId) e.parentId = 'Việc con không thể làm việc cha (tối đa 2 cấp).';
    else if (p.id === selfId) e.parentId = 'Một việc không thể là con của chính nó.';
    else if (selfId && tasks.some(x => x.parentId === selfId)) e.parentId = 'Việc này đang có việc con nên không thể trở thành việc con.';
  } else if (!categories.some(c => c.id === t.categoryId)) e.categoryId = 'Hãy chọn nhóm công việc.';
  return e;
}
