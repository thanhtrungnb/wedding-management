/* Hợp đồng dữ liệu: load / save / reset / blank. Thay file này để đổi sang backend khác. */
import { SCHEMA_VERSION, validateAppData } from '../models/schema.js';
import { defaultBlocks } from '../models/invitation.js';
import { readRaw, writeRaw, clearRaw, quarantine } from '../storage/localStore.js';

/* Dữ liệu mẫu nằm trong "khuôn" JSON: mỗi việc/mốc chỉ mang offset so với ngày cưới.
   Lúc nạp, ứng dụng sinh ngày cưới = hôm nay + prepDays rồi tính ngày thật —
   nhờ vậy mẫu luôn tươi, không bị cũ theo thời gian như ngày hardcode.
   Trường `done` ghi sẵn trong khuôn; trạng thái việc cha độc lập với việc con. */
let templatePromise = null;
const loadTemplate = () => templatePromise ??= fetch(new URL('../data/sample_tasks.json', import.meta.url))
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
/* Khuôn ngân sách tách file riêng; nếu đọc không được thì vẫn seed việc được — ngân sách chỉ bỏ trống. */
let budgetTplPromise = null;
const loadBudgetTemplate = () => budgetTplPromise ??= fetch(new URL('../data/sample_budget.json', import.meta.url))
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
let scheduleTplPromise = null;
const loadScheduleTemplate = () => scheduleTplPromise ??= fetch(new URL('../data/sample_schedule.json', import.meta.url))
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Sinh dữ liệu mẫu từ khuôn: chỉ dịch offset thành ngày thật, mọi trường khác giữ nguyên. */
function buildSample(tpl) {
  const now = new Date(), today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const wedding = addDays(today0, tpl.prepDays ?? 150);
  const due = off => iso(addDays(wedding, off));
  const tasks = tpl.tasks.map(t => ({ id: t.id, parentId: t.parentId || null, title: t.title, categoryId: t.categoryId,
    due: due(t.dueOffset), priority: t.priority || 'medium', owner: t.owner || '', done: !!t.done, tags: t.tags || [], note: t.note || '' }));
  return { weddingDate: iso(wedding), tasks, milestones: (tpl.milestones || []).map(m => ({ id: m.id, title: m.title, date: due(m.offset), big: !!m.big })), due };
}

/** Dịch khuôn ngân sách: offset của khoản/ghi chép → ngày thật, giống khuôn việc. */
function buildBudget(tpl, due) {
  const items = (tpl.items || []).map(x => ({ id: x.id, categoryId: x.categoryId, name: x.name, type: x.type === 'thu' ? 'thu' : 'chi',
    planned: x.planned, date: x.dateOffset != null ? due(x.dateOffset) : '', note: x.note || '' }));
  const records = (tpl.records || []).map((p, i) => ({ id: 'sr' + (i + 1), itemId: p.itemId, type: p.type === 'thu' ? 'thu' : 'chi', amount: p.amount,
    date: p.offset != null ? due(p.offset) : '', note: p.note || '', deferred: !!p.deferred, dueDate: p.deferred && p.dueOffset != null ? due(p.dueOffset) : '' }));
  return { items, records };
}

async function seed() {
  const tpl = await loadTemplate(), s = buildSample(tpl);
  const [budgetTpl, scheduleTpl] = await Promise.all([
    loadBudgetTemplate().catch(() => ({ items: [], records: [] })),
    loadScheduleTemplate().catch(() => ({ events: [] })),
  ]);
  const budget = buildBudget(budgetTpl, s.due);
  return validateAppData({ schemaVersion: SCHEMA_VERSION, isSample: true, couple: tpl.couple, weddingDate: s.weddingDate,
    categories: tpl.categories, tasks: s.tasks, events: (scheduleTpl.events || []).map(e => ({ ...e, date: s.due(e.offset) })), milestones: s.milestones, budget }).data;
}

/* Nhóm gợi ý dự phòng khi không đọc được khuôn — "Sổ trống" vẫn dùng được, không bricked. */
const FALLBACK_CATEGORIES = [
  { id: 'venue', name: 'Địa điểm & tiệc' }, { id: 'photo', name: 'Ảnh cưới' }, { id: 'attire', name: 'Trang phục' },
  { id: 'family', name: 'Lễ nghi & gia đình' }, { id: 'guest', name: 'Khách mời & thiệp' },
];
const blankData = () => ({ schemaVersion: SCHEMA_VERSION, isSample: false, couple: { bride: '', groom: '' }, weddingDate: '',
  categories: structuredClone(FALLBACK_CATEGORIES), tasks: [], events: [], milestones: [], budget: { items: [], records: [] }, guests: [],
  invitation: { messageTemplate: '', title: '', message: '', venue: '', ceremonyAt: '', background: '#F6F0E4', accent: '#2F4A3C', imageUrl: '', blocks: defaultBlocks() } });

export async function load() {
  const raw = readRaw();
  if (raw == null) {
    try { return { data: await seed(), recovered: false }; }
    catch { return { data: blankData(), recovered: false, sampleFailed: true }; }
  }
  try { const v = validateAppData(JSON.parse(raw)); if (v.ok) return { data: v.data, recovered: false }; } catch { /* rơi xuống phần khôi phục */ }
  quarantine(raw);
  try { return { data: await seed(), recovered: true }; }
  catch { return { data: blankData(), recovered: true, sampleFailed: true }; }
}
export const save = data => writeRaw(JSON.stringify(data));
export async function reset() { clearRaw(); return seed(); }
/** Sổ trống: giữ các nhóm công việc gợi ý, không có việc nào. */
export async function blank() {
  try { const tpl = await loadTemplate(); return { ...blankData(), categories: structuredClone(tpl.categories) }; }
  catch { return blankData(); }
}
