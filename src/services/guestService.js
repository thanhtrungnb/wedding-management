import { newId } from '../utils/id.js';

const clean = value => String(value ?? '').trim();
const createToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};
export function saveGuest(data, input, id = null) {
  const name = clean(input.name), salutation = clean(input.salutation);
  if (!name) return { ok: false, errors: { name: 'Nhập tên khách mời.' } };
  let guest = id ? data.guests.find(item => item.id === id) : null;
  if (id && !guest) return { ok: false, errors: { name: 'Không tìm thấy khách mời.' } };
  if (!guest) {
    guest = { id: newId('g'), token: createToken(), invitedAt: '', inviteTime: '', rsvp: 'pending', partySize: 0, note: '' };
    data.guests.push(guest);
  }
  /* inviteTime = giờ mời in trên thiệp RIÊNG của khách (mỗi top khách một giờ);
     invitedAt không đụng tới ở đây — "đã mời" do user tick thủ công trong bảng. */
  Object.assign(guest, { name, salutation, inviteTime: clean(input.inviteTime), note: clean(input.note), partySize: Math.max(0, Number(input.partySize) || 0) });
  return { ok: true, guest };
}

export function removeGuest(data, id) {
  const i = data.guests.findIndex(item => item.id === id);
  if (i < 0) return { ok: false };
  const [guest] = data.guests.splice(i, 1);
  return { ok: true, guest };
}

export function importGuests(data, rows) {
  const byName = new Map(data.guests.map(guest => [guest.name.toLocaleLowerCase('vi'), guest]));
  let added = 0, updated = 0, skipped = 0;
  rows.forEach(row => {
    const name = clean(row.name);
    if (!name) { skipped++; return; }
    const existing = byName.get(name.toLocaleLowerCase('vi'));
    if (existing) {
      if (row.salutation != null) existing.salutation = clean(row.salutation);
      if (row.inviteTime != null) existing.inviteTime = clean(row.inviteTime);
      if (row.note != null) existing.note = clean(row.note);
      updated++;
      return;
    }
    const result = saveGuest(data, row);
    if (result.ok) { byName.set(name.toLocaleLowerCase('vi'), result.guest); added++; }
  });
  return { added, updated, skipped };
}
/** Gộp trạng thái RSVP/đã mời đọc từ đám mây vào danh sách local.
    Chỉ áp cho khách trùng id VÀ token — tránh ghi đè nhầm khi hai máy có danh sách khác nhau.
    Không áp inviteTime từ đám mây: giờ mời là dữ liệu quản trị chỉnh ở local, kéo về chỉ để lấy RSVP. */
export function applyRemoteGuestState(data, remoteGuests) {
  const byId = new Map(data.guests.map(guest => [guest.id, guest]));
  (Array.isArray(remoteGuests) ? remoteGuests : []).forEach(remote => {
    const guest = byId.get(remote.id);
    if (guest && guest.token === remote.token) Object.assign(guest, { invitedAt: remote.invitedAt || '', rsvp: remote.rsvp || 'pending', partySize: Number(remote.partySize) || 0 });
  });
  return { ok: true };
}
