/* Kiểm tra & chuẩn hóa toàn bộ dữ liệu ứng dụng (dùng cho dữ liệu lưu cục bộ và tệp nhập). */
import { parseDate } from '../utils/format.js';
import { PRIORITIES, OWNERS, parseTags } from './task.js';
export const SCHEMA_VERSION = 1;
const str = v => (typeof v === 'string' ? v.trim() : '');
const money = n => Number.isInteger(n) && n >= 0;

export function validateAppData(raw) {
  const err = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['Tệp không đúng định dạng.'] };
  if ((raw.schemaVersion ?? 1) > SCHEMA_VERSION) err.push('Tệp được tạo bởi phiên bản mới hơn của ứng dụng.');
  const list = k => Array.isArray(raw[k]) ? raw[k] : (err.push(`Thiếu danh sách “${k}”.`), []);
  const rc = list('categories'), rt = list('tasks');
  const ids = new Set(), categories = [], tasks = [];
  rc.forEach((c, i) => { if (!str(c?.id) || !str(c?.name)) return err.push(`Nhóm #${i + 1} thiếu mã hoặc tên.`); if (ids.has('c' + c.id)) return err.push(`Nhóm trùng mã: ${c.id}`); ids.add('c' + c.id); categories.push({ id: c.id, name: str(c.name) }); });
  const tid = new Set();
  rt.forEach((t, i) => {
    if (!str(t?.id) || !str(t?.title)) return err.push(`Việc #${i + 1} thiếu mã hoặc tên.`);
    if (tid.has(t.id)) return err.push(`Việc trùng mã: ${t.id}`); tid.add(t.id);
    if (t.due && !parseDate(t.due)) err.push(`Việc “${t.title}” có ngày không hợp lệ.`);
    tasks.push({ id: t.id, parentId: t.parentId || null, title: str(t.title), categoryId: t.categoryId || '', due: t.due || '', priority: PRIORITIES[t.priority] ? t.priority : 'medium',
      owner: OWNERS[t.owner] ? t.owner : '', done: !!t.done, tags: Array.isArray(t.tags) ? parseTags(t.tags.join(',')) : [], note: str(t.note) });
  });
  const byId = new Map(tasks.map(t => [t.id, t]));
  tasks.forEach(t => { if (!t.parentId) return; const p = byId.get(t.parentId); if (!p || p.parentId) err.push(`Việc “${t.title}” có việc cha không hợp lệ (tối đa 2 cấp).`); });
  tasks.forEach(t => { if (!t.parentId && !categories.some(c => c.id === t.categoryId)) err.push(`Việc “${t.title}” thuộc nhóm không tồn tại.`); });
  const b = raw.budget ?? { income: [], items: [] };
  (b.items ?? []).forEach(x => { if (!['planned', 'committed', 'paid'].every(k => money(x?.[k]))) err.push(`Khoản chi “${x?.name ?? '?'}” có số tiền không hợp lệ.`); });
  (b.income ?? []).forEach(x => { if (!money(x?.amount)) err.push(`Khoản thu “${x?.label ?? '?'}” có số tiền không hợp lệ.`); });
  if (raw.weddingDate && !parseDate(raw.weddingDate)) err.push('Ngày cưới không hợp lệ.');
  const data = { schemaVersion: SCHEMA_VERSION, isSample: !!raw.isSample, couple: { bride: str(raw.couple?.bride), groom: str(raw.couple?.groom) },
    weddingDate: raw.weddingDate || '', categories, tasks, milestones: Array.isArray(raw.milestones) ? raw.milestones : [], budget: { income: b.income ?? [], items: b.items ?? [] } };
  return { ok: err.length === 0, errors: err.slice(0, 6), data };
}
