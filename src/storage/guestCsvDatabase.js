import { parseCSV } from './guestFiles.js';

let handle = null, lastSaved = '', pendingWrite = Promise.resolve();
const headers = ['id', 'token', 'name', 'salutation', 'invitedAt', 'inviteTime', 'rsvp', 'partySize', 'note'];
const quote = value => {
  const text = String(value ?? ''), first = text[0];
  const safe = ['=', '+', '-', '@', '\t', '\r'].includes(first) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};
const serialize = guests => [headers.join(','), ...guests.map(guest => headers.map(key => quote(guest[key])).join(','))].join('\r\n');

function decode(text) {
  const parsed = parseCSV(text), columns = parsed.columns;
  const index = Object.fromEntries(headers.map(key => [key, columns.indexOf(key)]));
  if (headers.some(key => index[key] < 0)) throw new Error(`CSV database cần các cột: ${headers.join(', ')}.`);
  const guests = parsed.map(row => ({ id: row[index.id], token: row[index.token], name: row[index.name], salutation: row[index.salutation], invitedAt: row[index.invitedAt], inviteTime: row[index.inviteTime], rsvp: row[index.rsvp] || 'pending', partySize: Number(row[index.partySize]) || 0, note: row[index.note] }));
  const ids = new Set(), tokens = new Set();
  for (const guest of guests) {
    if (!guest.id || !guest.name || !/^[A-Za-z0-9_-]{32,100}$/.test(guest.token) || ids.has(guest.id) || tokens.has(guest.token)) throw new Error('CSV có khách thiếu dữ liệu hoặc mã bị trùng.');
    if (!['pending', 'attending', 'declined'].includes(guest.rsvp)) throw new Error(`Trạng thái RSVP không hợp lệ cho ${guest.name}.`);
    ids.add(guest.id); tokens.add(guest.token);
  }
  return guests;
}

export const supportsGuestDatabase = () => typeof showOpenFilePicker === 'function' && typeof showSaveFilePicker === 'function';
export async function openGuestDatabase() {
  if (!supportsGuestDatabase()) throw new Error('Trình duyệt chưa hỗ trợ mở CSV trực tiếp; dùng nhập/xuất CSV thay thế.');
  const [picked] = await showOpenFilePicker({ multiple: false, types: [{ description: 'CSV database khách mời', accept: { 'text/csv': ['.csv'] } }] });
  const text = await (await picked.getFile()).text(), guests = decode(text);
  handle = picked; lastSaved = '';
  return guests;
}
export async function createGuestDatabase(initialGuests = []) {
  if (!supportsGuestDatabase()) throw new Error('Trình duyệt chưa hỗ trợ tạo CSV trực tiếp; dùng nhập/xuất CSV thay thế.');
  handle = await showSaveFilePicker({ suggestedName: 'khach-moi-database.csv', types: [{ description: 'CSV database khách mời', accept: { 'text/csv': ['.csv'] } }] });
  lastSaved = '';
  await saveGuestDatabase(initialGuests);
}
export function saveGuestDatabase(guests) {
  const content = `﻿${serialize(guests)}`;
  if (!handle || content === lastSaved) return pendingWrite;
  pendingWrite = pendingWrite.then(async () => {
    if (!handle || content === lastSaved) return true;
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    lastSaved = content;
    return true;
  });
  return pendingWrite;
}
export const guestDatabaseActive = () => !!handle;
