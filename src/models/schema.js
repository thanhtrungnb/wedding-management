/* Kiểm tra & chuẩn hóa toàn bộ dữ liệu ứng dụng (dùng cho dữ liệu lưu cục bộ và tệp nhập). */
import { parseDate } from '../utils/format.js';
import { PRIORITIES, OWNERS, parseTags } from './task.js';
import { SCHEDULE_CONFIG } from '../config/schedule.js';
export const SCHEMA_VERSION = 1;
const str = v => (typeof v === 'string' ? v.trim() : '');
const money = n => Number.isInteger(n) && n >= 0;

export function validateAppData(raw) {
  const err = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['Tệp không đúng định dạng.'] };
  if ((raw.schemaVersion ?? 1) > SCHEMA_VERSION) err.push('Tệp được tạo bởi phiên bản mới hơn của ứng dụng.');
  const list = k => Array.isArray(raw[k]) ? raw[k] : (err.push(`Thiếu danh sách “${k}”.`), []);
  const rc = list('categories'), rt = list('tasks');
  const ids = new Set(), categories = [], tasks = [], events = [];
  const maxImportantEvents = SCHEDULE_CONFIG.maxImportantEvents;
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
  let importantCount = 0;
  (Array.isArray(raw.events) ? raw.events : []).forEach((x, i) => {
    if (!str(x?.id) || !str(x?.title)) return err.push(`Sự kiện #${i + 1} thiếu mã hoặc tên.`);
    if (events.some(e => e.id === x.id)) return err.push(`Sự kiện trùng mã: ${x.id}`);
    if (!parseDate(x?.date)) return err.push(`Sự kiện “${x.title}” có ngày không hợp lệ.`);
    if (x.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)) err.push(`Sự kiện “${x.title}” có giờ không hợp lệ.`);
    const important = !!x.important;
    if (important && ++importantCount > maxImportantEvents) err.push(`Chỉ được đánh dấu tối đa ${maxImportantEvents} sự kiện quan trọng.`);
    events.push({ id: str(x.id), title: str(x.title), date: x.date, time: x.time || '', location: str(x.location), note: str(x.note), important, type: ['ceremony', 'meeting', 'booking', 'other'].includes(x.type) ? x.type : 'other' });
  });
  /* Ngân sách: khoản (danh mục) gắn nhóm dùng chung; ghi chép tách riêng để ghi dần, trả sau là cờ trên ghi chép.
     Dữ liệu cũ dùng khóa `payments` (toàn chi) — đọc được như ghi chép chi để không mất dữ liệu đã lưu. */
  const b = raw.budget ?? {};
  const bItems = [], bRecords = [], biid = new Set();
  (Array.isArray(b.items) ? b.items : []).forEach((x, i) => {
    const id = str(x?.id) || `b${i + 1}`;
    if (!str(x?.name)) return err.push(`Khoản #${i + 1} thiếu tên.`);
    if (biid.has(id)) return err.push(`Khoản trùng mã: ${id}`); biid.add(id);
    if (!money(x?.planned)) return err.push(`Khoản “${x.name}” có số tiền dự tính không hợp lệ.`);
    if (!categories.some(c => c.id === x?.categoryId)) return err.push(`Khoản “${x.name}” thuộc nhóm không tồn tại.`);
    if (x?.date && !parseDate(x.date)) err.push(`Khoản “${x.name}” có ngày dự kiến không hợp lệ.`);
    bItems.push({ id, categoryId: x.categoryId, name: str(x.name), type: x?.type === 'thu' ? 'thu' : 'chi',
      planned: x.planned, date: x.date || '', note: str(x?.note) });
  });
  const itemIds = new Set(bItems.map(x => x.id));
  (Array.isArray(b.records) ? b.records : (Array.isArray(b.payments) ? b.payments : [])).forEach((x, i) => {
    if (!money(x?.amount)) return err.push(`Ghi chép #${i + 1} có số tiền không hợp lệ.`);
    if (!itemIds.has(x?.itemId)) return err.push(`Ghi chép #${i + 1} không thuộc khoản nào.`);
    if (x?.date && !parseDate(x.date)) err.push(`Ghi chép #${i + 1} có ngày không hợp lệ.`);
    if (x?.deferred && x?.dueDate && !parseDate(x.dueDate)) err.push(`Ghi chép #${i + 1} có ngày trả dự kiến không hợp lệ.`);
    bRecords.push({ id: str(x?.id) || `r${i + 1}`, itemId: x.itemId, type: x?.type === 'thu' ? 'thu' : 'chi', amount: x.amount,
      date: x.date || '', note: str(x?.note), deferred: !!x?.deferred, dueDate: x?.deferred ? (x.dueDate || '') : '' });
  });
  if (raw.weddingDate && !parseDate(raw.weddingDate)) err.push('Ngày cưới không hợp lệ.');
  const data = { schemaVersion: SCHEMA_VERSION, isSample: !!raw.isSample, couple: { bride: str(raw.couple?.bride), groom: str(raw.couple?.groom) },
    weddingDate: raw.weddingDate || '', categories, tasks, events, milestones: Array.isArray(raw.milestones) ? raw.milestones : [], budget: { items: bItems, records: bRecords } };
  return { ok: err.length === 0, errors: err.slice(0, 6), data };
}
