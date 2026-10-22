/* Lớp thấp nhất chạm vào LocalStorage. Chỉ repository được gọi file này. */
const KEY = 'wm:data:v1';
export const readRaw = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const writeRaw = s => { try { localStorage.setItem(KEY, s); return true; } catch { return false; } };
export const clearRaw = () => { try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ } };
/** Giữ lại bản dữ liệu hỏng để tránh mất dữ liệu âm thầm. */
export const quarantine = raw => { try { localStorage.setItem(`wm:corrupt:${Date.now()}`, raw); return true; } catch { return false; } };
