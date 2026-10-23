/**
 * "Sổ tay cưới" — backend Google Sheet (Apps Script Web App).
 * MỘT script, MỘT spreadsheet, nhiều sheet:
 *   - Du_lieu   : dữ liệu app (task, ghi chép, ngân sách…) lưu dạng JSON chunks.
 *   - Khach_moi : danh sách khách mời + trạng thái lời mời/RSVP.
 *   - Thiep     : cấu hình thiệp (khối, màu, thời gian…) + couple + weddingDate.
 *
 * Triển khai:
 * 1. Tạo Google Sheet mới → Extensions → Apps Script → dán toàn bộ file này.
 * 2. Đổi ADMIN_KEY bên dưới thành khóa ngẫu nhiên dài; không đưa khóa này vào link khách mời.
 * 3. Deploy → New deployment → loại "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * 4. Nhập URL /exec và ADMIN_KEY trong menu Cài đặt của app (một kết nối dùng cho mọi tính năng).
 *
 * API:
 *   GET  ?action=invite&token=…                          — public: dữ liệu thiệp của đúng 1 khách.
 *   POST {action:'rsvp', token, rsvp, partySize}         — public: khách xác nhận tham dự.
 *   POST {action:'read', adminKey}                       — quản trị: đọc app + khách + thiệp.
 *   POST {action:'save-app', adminKey, data}             — quản trị: ghi Du_lieu.
 *   POST {action:'publish', adminKey, guests, invitation,…} — quản trị: ghi Khach_moi + Thiep.
 */
const ADMIN_KEY = '';
const SHEET_NAME = 'Du_lieu';
const GUESTS_SHEET = 'Khach_moi';
const SETTINGS_SHEET = 'Thiep';
const CHUNK = 40000;

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function adminOk_(body) {
  return !!ADMIN_KEY && body.adminKey === ADMIN_KEY;
}
function sheetByName_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
const guestSheet_ = () => sheetByName_(GUESTS_SHEET);
const settingsSheet_ = () => sheetByName_(SETTINGS_SHEET);
const dataSheet_ = () => sheetByName_(SHEET_NAME);
function guestRows_() {
  const sh = guestSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 9).getValues().map(row => ({ id: row[0], token: row[1], name: row[2], salutation: row[3], invitedAt: row[4], inviteTime: row[8] || '', rsvp: row[5], partySize: Number(row[6]) || 0, note: row[7] }));
}
function findGuest_(token) {
  const sh = guestSheet_(), last = sh.getLastRow();
  if (last < 2) return null;
  const tokens = sh.getRange(2, 2, last - 1, 1).getValues();
  const index = tokens.findIndex(row => String(row[0]) === String(token));
  if (index < 0) return null;
  const row = sh.getRange(index + 2, 1, 1, 9).getValues()[0];
  return { row: index + 2, guest: { id: row[0], token: row[1], name: row[2], salutation: row[3], invitedAt: row[4], inviteTime: row[8] || '', rsvp: row[5], partySize: Number(row[6]) || 0, note: row[7] } };
}
function readInvitation_() {
  const values = settingsSheet_().getRange(1, 1, 1, 4).getValues()[0];
  return { invitation: JSON.parse(values[0] || '{}'), couple: JSON.parse(values[1] || '{}'), weddingDate: values[2] || '', updatedAt: values[3] || '' };
}
function readApp_() {
  const sh = dataSheet_(), n = Number(sh.getRange(1, 1).getValue()) || 0;
  if (!n) return { app: null, appUpdatedAt: null };
  const raw = sh.getRange(2, 1, n, 1).getValues().map(r => r[0]).join('');
  return { app: JSON.parse(raw), appUpdatedAt: sh.getRange(1, 2).getValue() || null };
}
function saveApp_(data) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Dữ liệu app không hợp lệ.' };
  const raw = JSON.stringify(data), rows = [];
  for (let i = 0; i < raw.length; i += CHUNK) rows.push([raw.slice(i, i + CHUNK)]);
  const sh = dataSheet_(), old = Number(sh.getRange(1, 1).getValue()) || 0;
  if (old > rows.length) sh.getRange(2 + rows.length, 1, old - rows.length, 1).clearContent();
  sh.getRange(1, 1).setValue(rows.length);
  if (rows.length) sh.getRange(2, 1, rows.length, 1).setValues(rows);
  const now = new Date().toISOString(); sh.getRange(1, 2).setValue(now);
  return { ok: true, updatedAt: now };
}
function doGet(e) {
  if (e.parameter.action === 'invite') {
    const token = e.parameter.token || '';
    if (token.length < 32 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) return json_({ ok: false, error: 'Mã thiệp không hợp lệ.' });
    const found = findGuest_(token);
    if (!found) return json_({ ok: false, error: 'Không tìm thấy thiệp.' });
    const data = readInvitation_();
    /* Public API chỉ trả dữ liệu của đúng khách theo mã; không bao giờ trả danh sách. */
    return json_({ ok: true, invite: { guest: { name: found.guest.name, salutation: found.guest.salutation, inviteTime: found.guest.inviteTime, rsvp: found.guest.rsvp, partySize: found.guest.partySize }, invitation: data.invitation, couple: data.couple, weddingDate: data.weddingDate } });
  }
  return json_({ ok: false, error: 'Không hỗ trợ thao tác này.' });
}
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch { return json_({ ok: false, error: 'Nội dung gửi lên không phải JSON hợp lệ.' }); }
  if (body.action === 'rsvp') {
    if (typeof body.token !== 'string' || body.token.length < 32 || body.token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(body.token)) return json_({ ok: false, error: 'Mã thiệp không hợp lệ.' });
    if (!['attending', 'declined'].includes(body.rsvp)) return json_({ ok: false, error: 'Lựa chọn phản hồi không hợp lệ.' });
    const found = findGuest_(body.token);
    if (!found) return json_({ ok: false, error: 'Không tìm thấy thiệp.' });
    const partySize = Math.max(0, Math.min(30, Number(body.partySize) || 0));
    guestSheet_().getRange(found.row, 6, 1, 2).setValues([[body.rsvp, partySize]]);
    return json_({ ok: true, updatedAt: new Date().toISOString() });
  }
  if (!adminOk_(body)) return json_({ ok: false, error: 'Không có quyền quản trị.' });
  if (body.action === 'read') return json_({ ok: true, ...readApp_(), guests: guestRows_(), ...readInvitation_() });
  if (body.action === 'save-app') {
    const saved = saveApp_(body.data);
    return json_(saved);
  }
  if (body.action !== 'publish') return json_({ ok: false, error: 'Không hỗ trợ thao tác này.' });
  if (!Array.isArray(body.guests) || !body.invitation || typeof body.invitation !== 'object') return json_({ ok: false, error: 'Dữ liệu khách hoặc thiệp không hợp lệ.' });
  const sh = guestSheet_(), previous = new Map(guestRows_().map(g => [g.id, g]));
  const uniqueTokens = new Set(), uniqueIds = new Set();
  for (const g of body.guests) {
    if (typeof g?.id !== 'string' || !g.id || uniqueIds.has(g.id) || typeof g?.name !== 'string' || !g.name.trim() || typeof g?.token !== 'string' || g.token.length < 32 || g.token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(g.token) || uniqueTokens.has(g.token)) return json_({ ok: false, error: 'Danh sách chứa khách hoặc mã thiệp không hợp lệ.' });
    uniqueIds.add(g.id); uniqueTokens.add(g.token);
  }
  /* Giữ lại RSVP/đã mời của bản cũ khi token chưa đổi — khách đã phản hồi không bị mất khi đẩy lại. */
  const guestRows = body.guests.map(g => {
    const prior = previous.get(g.id), keep = prior && prior.token === g.token;
    return [g.id, g.token, g.name, g.salutation || '', g.invitedAt || (keep ? prior.invitedAt : '') || '', keep ? prior.rsvp : g.rsvp || 'pending', keep ? prior.partySize : Number(g.partySize) || 0, g.note || '', g.inviteTime || ''];
  });
  sh.clearContents();
  sh.getRange(1, 1, 1, 9).setValues([['id', 'token', 'name', 'salutation', 'invitedAt', 'rsvp', 'partySize', 'note', 'inviteTime']]);
  if (guestRows.length) sh.getRange(2, 1, guestRows.length, 9).setValues(guestRows);
  const updatedAt = new Date().toISOString();
  settingsSheet_().getRange(1, 1, 1, 4).setValues([[JSON.stringify(body.invitation), JSON.stringify(body.couple || {}), body.weddingDate || '', updatedAt]]);
  return json_({ ok: true, updatedAt });
}
