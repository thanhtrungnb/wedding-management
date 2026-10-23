/* Cấu hình kết nối đám mây DÙNG CHUNG: 1 URL Web App + 1 khóa quản trị cho mọi tính năng
   (đồng bộ dữ liệu app, khách mời, thiệp, RSVP). Khóa chỉ lưu trên thiết bị quản lý,
   không bao giờ nằm trong link thiệp hay mã public.
   Kế thừa giá trị từ khóa cũ (wm:sync:url, wm:guest:*) để không phải cấu hình lại sau nâng cấp. */
const URL_KEY = 'wm:cloud:url', KEY_KEY = 'wm:cloud:key';
const read = k => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
export const SCRIPT_URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/;
export const getCloudUrl = () => read(URL_KEY) || read('wm:guest:script-url') || read('wm:sync:url');
export const getAdminKey = () => read(KEY_KEY) || read('wm:guest:admin-key');
export function setCloudConnection(url, key) {
  try { localStorage.setItem(URL_KEY, url.trim()); localStorage.setItem(KEY_KEY, key.trim()); } catch { /* chế độ riêng tư: bỏ qua */ }
}
export const isCloudConfigured = () => SCRIPT_URL_RE.test(getCloudUrl()) && !!getAdminKey();
/** Gọi một action quản trị lên Apps Script; mọi action đều phải mang adminKey. */
export async function cloudPost(action, extra = {}) {
  const url = getCloudUrl(), key = getAdminKey();
  if (!SCRIPT_URL_RE.test(url)) throw new Error('Chưa nhập địa chỉ Web App hợp lệ (kết thúc /exec) trong Cài đặt.');
  if (!key) throw new Error('Chưa nhập khóa quản trị trong Cài đặt.');
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    // text/plain để tránh preflight CORS — Apps Script không xử lý OPTIONS.
    response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: controller.signal, body: JSON.stringify({ action, adminKey: key, ...extra }) });
  } catch { throw new Error('Không kết nối được đám mây. Kiểm tra mạng và địa chỉ Web App.'); }
  finally { clearTimeout(timer); }
  let result; try { result = JSON.parse(await response.text()); } catch { throw new Error('Địa chỉ không trả về dữ liệu hợp lệ.'); }
  if (!response.ok || !result.ok) throw new Error(result.error || 'Đám mây báo lỗi.');
  return result;
}
