/* Đồng bộ dữ liệu app (task, ghi chép, ngân sách…) lên Apps Script — sheet Du_lieu.
   Dùng chung kết nối đám mây với khách/thiệp (xem cloudConfig.js); khách & thiệp
   đồng bộ riêng qua action publish/read nên phần app luôn loại chúng ra khỏi payload. */
import { validateAppData } from '../models/schema.js';
import { cloudPost } from './cloudConfig.js';
const AT_KEY = 'wm:sync:at';
const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
export const getLastSync = () => { const v = read(AT_KEY); return v ? new Date(v) : null; };
const markSync = () => { try { localStorage.setItem(AT_KEY, new Date().toISOString()); } catch {} };
/** Tải dữ liệu app từ Sheet về; kết quả đã qua validateAppData như mọi nguồn dữ liệu đầu vào. */
export async function pull() {
  let body;
  try { body = await cloudPost('read'); } catch (error) { return { ok: false, errors: [error.message] }; }
  if (body.app == null) return { ok: false, errors: ['Sheet chưa có dữ liệu app. Hãy bấm “Gửi dữ liệu app” trước.'] };
  const v = validateAppData(body.app);
  if (!v.ok) return { ok: false, errors: v.errors };
  markSync(); return { ok: true, data: v.data, updatedAt: body.appUpdatedAt };
}
/** Gửi toàn bộ dữ liệu app hiện tại lên Sheet (ghi đè bản cũ). */
export async function push(data) {
  const { guests, invitation, ...app } = data;
  try {
    const body = await cloudPost('save-app', { data: app });
    markSync(); return { ok: true, updatedAt: body.updatedAt };
  } catch (error) { return { ok: false, errors: [error.message] }; }
}
