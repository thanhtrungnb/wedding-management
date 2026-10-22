/* Đồng bộ qua Google Apps Script Web App (xem google-apps-script/Code.gs).
   Tùy chọn: app vẫn chạy hoàn toàn offline khi chưa kết nối. */
import { validateAppData } from '../models/schema.js';
const URL_KEY = 'wm:sync:url', AT_KEY = 'wm:sync:at';
const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
export const getSyncUrl = () => read(URL_KEY) ?? '';
export const setSyncUrl = u => { try { localStorage.setItem(URL_KEY, u.trim()); } catch { /* chế độ riêng tư: bỏ qua */ } };
export const getLastSync = () => { const v = read(AT_KEY); return v ? new Date(v) : null; };
const markSync = () => { try { localStorage.setItem(AT_KEY, new Date().toISOString()); } catch {} };
const fetchTimeout = (url, opts = {}, ms = 15000) => {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
};
/** Tải dữ liệu từ Sheet về; kết quả đã qua validateAppData như mọi nguồn dữ liệu đầu vào. */
export async function pull() {
  const url = getSyncUrl(); if (!url) return { ok: false, errors: ['Chưa nhập địa chỉ Web App.'] };
  let res;
  try { res = await fetchTimeout(url); } catch { return { ok: false, errors: ['Không kết nối được. Kiểm tra mạng và địa chỉ Web App.'] }; }
  let body; try { body = JSON.parse(await res.text()); } catch { return { ok: false, errors: ['Địa chỉ không trả về dữ liệu hợp lệ.'] }; }
  if (!body.ok) return { ok: false, errors: [body.error ?? 'Sheet báo lỗi.'] };
  if (body.data == null) return { ok: false, errors: ['Sheet chưa có dữ liệu. Hãy bấm "Gửi lên Sheet" trước.'] };
  const v = validateAppData(body.data);
  if (!v.ok) return { ok: false, errors: v.errors };
  markSync(); return { ok: true, data: v.data, updatedAt: body.updatedAt };
}
/** Gửi toàn bộ dữ liệu hiện tại lên Sheet (ghi đè bản cũ). */
export async function push(data) {
  const url = getSyncUrl(); if (!url) return { ok: false, errors: ['Chưa nhập địa chỉ Web App.'] };
  try {
    // text/plain để tránh preflight CORS — Apps Script không xử lý OPTIONS.
    const res = await fetchTimeout(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
    const body = JSON.parse(await res.text());
    if (!body.ok) return { ok: false, errors: [body.error ?? 'Sheet báo lỗi.'] };
    markSync(); return { ok: true, updatedAt: body.updatedAt };
  } catch { return { ok: false, errors: ['Không gửi được lên Sheet. Kiểm tra mạng và địa chỉ Web App.'] }; }
}
