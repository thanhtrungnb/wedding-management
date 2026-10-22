/* Hợp đồng dữ liệu: load / save / reset / blank. Thay file này để đổi sang backend khác. */
import { SAMPLE } from '../data/sample.js';
import { SCHEMA_VERSION, validateAppData } from '../models/schema.js';
import { readRaw, writeRaw, clearRaw, quarantine } from '../storage/localStore.js';
const seed = () => validateAppData({ ...structuredClone(SAMPLE), schemaVersion: SCHEMA_VERSION }).data;
export function load() {
  const raw = readRaw();
  if (raw == null) return { data: seed(), recovered: false };
  try { const v = validateAppData(JSON.parse(raw)); if (v.ok) return { data: v.data, recovered: false }; } catch { /* rơi xuống phần khôi phục */ }
  quarantine(raw);
  return { data: seed(), recovered: true };
}
export const save = data => writeRaw(JSON.stringify(data));
export const reset = () => { clearRaw(); return seed(); };
/** Sổ trống: giữ các nhóm công việc gợi ý, không có việc nào. */
export const blank = () => ({ schemaVersion: SCHEMA_VERSION, isSample: false, couple: { bride: '', groom: '' }, weddingDate: '', categories: structuredClone(SAMPLE.categories), tasks: [], milestones: [], budget: { income: [], items: [] } });
