import { validateAppData } from '../models/schema.js';
export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wedding-management-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
/** Đọc và kiểm tra tệp nhập; không động vào dữ liệu hiện có. */
export async function readImport(file) {
  if (file.size > 5e6) return { ok: false, errors: ['Tệp quá lớn (tối đa 5 MB).'] };
  let obj; try { obj = JSON.parse(await file.text()); } catch { return { ok: false, errors: ['Tệp không phải JSON hợp lệ.'] }; }
  return validateAppData(obj);
}
