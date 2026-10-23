/* Nghiệp vụ hạng mục — dữ liệu gốc dùng chung cho việc cần làm và khoản ngân sách. Thao tác trên `data`, không DOM, không storage. */
import { newId } from '../utils/id.js';

export function saveCategory(data, input, id = null) {
  const name = String(input.name ?? '').trim();
  if (!name) return { ok: false, errors: { name: 'Hãy nhập tên hạng mục.' } };
  if (name.length > 60) return { ok: false, errors: { name: 'Tên hạng mục tối đa 60 ký tự.' } };
  if (data.categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase()))
    return { ok: false, errors: { name: 'Đã có hạng mục cùng tên.' } };
  if (id) {
    const cur = data.categories.find(c => c.id === id);
    if (!cur) return { ok: false, errors: { name: 'Không tìm thấy hạng mục.' } };
    cur.name = name;
    return { ok: true };
  }
  data.categories.push({ id: newId('c'), name });
  return { ok: true };
}

/** Chỉ xóa được hạng mục trống — việc hoặc khoản treo vào hạng mục không tồn tại sẽ làm toàn bộ dữ liệu không qua được kiểm tra schema. */
export function removeCategory(data, id) {
  const cur = data.categories.find(c => c.id === id);
  if (!cur) return { ok: false };
  const nTasks = data.tasks.filter(t => t.categoryId === id).length;
  const nItems = data.budget.items.filter(x => x.categoryId === id).length;
  if (nTasks || nItems) {
    const parts = [];
    if (nTasks) parts.push(`${nTasks} việc`);
    if (nItems) parts.push(`${nItems} khoản ngân sách`);
    return { ok: false, message: `Không xóa được — hạng mục đang chứa ${parts.join(' và ')}.` };
  }
  data.categories = data.categories.filter(c => c.id !== id);
  return { ok: true, name: cur.name };
}
