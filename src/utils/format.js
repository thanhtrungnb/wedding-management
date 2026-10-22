const vnd = new Intl.NumberFormat('vi-VN');
export const formatVND = n => `${vnd.format(Math.round(n))} ₫`;
export const formatVNDShort = n => n >= 1e9 ? `${vnd.format(+(n/1e9).toFixed(2))} tỷ ₫` : n >= 1e6 ? `${vnd.format(+(n/1e6).toFixed(1))} triệu ₫` : formatVND(n);
const dtf = new Intl.DateTimeFormat('vi-VN',{day:'numeric',month:'long',year:'numeric'});
const dtfShort = new Intl.DateTimeFormat('vi-VN',{day:'numeric',month:'numeric'});
const dtfLong = new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
export const parseDate = s => { const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||''); if(!m) return null; const d=new Date(+m[1],m[2]-1,+m[3]); return isNaN(d)?null:d; };
export const formatDate = s => { const d=parseDate(s); return d?dtf.format(d):'Chưa đặt ngày'; };
export const formatDateShort = s => { const d=parseDate(s); return d?dtfShort.format(d):''; };
export const formatDateLong = s => { const d=parseDate(s); return d?dtfLong.format(d):''; };
export const todayStart = () => { const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()); };
/** Số ngày từ `from` đến ngày `s`; null nếu ngày không hợp lệ; âm = đã qua. */
export const daysBetween = (s, from = todayStart()) => { const d=parseDate(s); return d?Math.round((d-from)/864e5):null; };
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
