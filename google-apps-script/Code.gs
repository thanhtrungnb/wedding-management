/**
 * "Sổ tay cưới" — backend Google Sheet (Apps Script Web App).
 *
 * Triển khai:
 * 1. Tạo Google Sheet mới → Extensions → Apps Script → dán toàn bộ file này.
 * 2. (Khuyên dùng) Sửa TOKEN bên dưới thành một cụm bí mật, ví dụ 'hong-lan-2026'.
 * 3. Deploy → New deployment → loại "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * 4. Copy địa chỉ kết thúc bằng /exec (nếu có TOKEN thì thêm ?token=<khóa>) vào
 *    Cài đặt → Đồng bộ Google Sheet của app.
 *
 * Dữ liệu được lưu dạng JSON nén, cắt khúc 40.000 ký tự vào cột A vì mỗi ô Sheet
 * giới hạn 50.000 ký tự. Ô A1 = số khúc, ô B1 = thời gian ghi gần nhất.
 */
const TOKEN = '';
const SHEET_NAME = 'Du_lieu';
const CHUNK = 40000;

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function checkToken_(e) {
  return !TOKEN || e.parameter.token === TOKEN;
}
function dataSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function doGet(e) {
  if (!checkToken_(e)) return json_({ ok: false, error: 'Sai khóa truy cập (token).' });
  const sh = dataSheet_();
  const n = Number(sh.getRange(1, 1).getValue()) || 0;
  if (!n) return json_({ ok: true, data: null, updatedAt: null });
  try {
    const raw = sh.getRange(2, 1, n, 1).getValues().map(r => r[0]).join('');
    return json_({ ok: true, data: JSON.parse(raw), updatedAt: sh.getRange(1, 2).getValue() || null });
  } catch (err) { return json_({ ok: false, error: 'Dữ liệu trên Sheet bị hỏng: ' + err }); }
}
function doPost(e) {
  if (!checkToken_(e)) return json_({ ok: false, error: 'Sai khóa truy cập (token).' });
  let body;
  try { body = JSON.parse(e.postData.contents); } catch { return json_({ ok: false, error: 'Nội dung gửi lên không phải JSON hợp lệ.' }); }
  const raw = JSON.stringify(body); // nén lại, không lưu rác định dạng
  const rows = [];
  for (let i = 0; i < raw.length; i += CHUNK) rows.push([raw.slice(i, i + CHUNK)]);
  const sh = dataSheet_();
  const old = Number(sh.getRange(1, 1).getValue()) || 0;
  if (old > rows.length) sh.getRange(2 + rows.length, 1, old - rows.length, 1).clearContent();
  sh.getRange(1, 1).setValue(rows.length);
  if (rows.length) sh.getRange(2, 1, rows.length, 1).setValues(rows);
  const now = new Date().toISOString();
  sh.getRange(1, 2).setValue(now);
  return json_({ ok: true, updatedAt: now });
}
