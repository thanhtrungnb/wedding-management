/* Trạng thái dùng chung + lưu trữ + hoàn tác một bước. */
import * as repo from '../repositories/appRepository.js';
import { toast } from './toast.js';
const loaded = repo.load();
let data = loaded.data, snapshot = null;
const subs = new Set();
export const recovered = loaded.recovered;
export const getData = () => data;
const notify = () => subs.forEach(f => f());
/** Đăng ký lắng nghe; tự hủy khi `signal` bị abort (đổi trang). */
export function onChange(fn, signal) { subs.add(fn); signal?.addEventListener('abort', () => subs.delete(fn)); }
function persist() { if (!repo.save(data)) toast('Không lưu được vào trình duyệt. Hãy xuất bản sao lưu để tránh mất dữ liệu.'); }
/** Chạy `mutator(data)`; chỉ lưu khi kết quả không báo lỗi. */
export function commit(mutator, { undoable = false } = {}) {
  const before = structuredClone(data);
  const r = mutator(data) ?? { ok: true };
  if (r.ok === false) { data = before; return r; }
  if (undoable) snapshot = before;
  persist(); notify(); return r;
}
export function undo() { if (!snapshot) return false; data = snapshot; snapshot = null; persist(); notify(); return true; }
export function replaceAll(next) { data = next; snapshot = null; persist(); notify(); }
export function resetAll(next) { data = next; snapshot = null; persist(); notify(); }
export const startBlank = () => resetAll(repo.blank());
export const restoreSample = () => resetAll(repo.reset());
