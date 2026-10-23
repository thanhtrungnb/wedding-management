const columns = ['name', 'salutation', 'inviteTime', 'note'];
const spreadsheetSafe = value => {
  const text = String(value ?? ''), first = text[0];
  return ['=', '+', '-', '@', '\t', '\r'].includes(first) ? `'${text}` : text;
};
const quote = value => `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;
export function exportGuests(guests) {
  const csv = ['name,salutation,inviteTime,note', ...guests.map(guest => [guest.name, guest.salutation, guest.inviteTime, guest.note].map(quote).join(','))].join('\r\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'khach-moi.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && !cell) quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Tệp CSV có dấu ngoặc kép chưa đóng.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift()?.map(value => value.trim().toLocaleLowerCase('vi')) ?? [];
  const result = rows.filter(values => values.some(value => value.trim())).map(values => headers.map((_, index) => values[index] ?? ''));
  result.columns = headers;
  return result;
}

export function parseGuestRows(rows) {
  const headers = rows.columns ?? [];
  const nameCol = headers.findIndex(value => ['name', 'ten', 'họ tên', 'ho ten', 'tên khách', 'ten khach', 'tên khách mời', 'ten khach moi'].includes(value));
  if (nameCol < 0) throw new Error('Không tìm thấy cột tên. Dùng tiêu đề name hoặc tên.');
  const salCol = headers.findIndex(value => ['salutation', 'danh xưng', 'danh xung', 'xưng hô', 'xung ho'].includes(value));
  const timeCol = headers.findIndex(value => ['invitetime', 'invite time', 'thời gian mời', 'thoi gian moi', 'giờ mời', 'gio moi'].includes(value));
  const noteCol = headers.findIndex(value => ['note', 'ghi chú', 'ghi chu'].includes(value));
  return rows.map(values => ({ name: values[nameCol], salutation: salCol >= 0 ? values[salCol] : '', inviteTime: timeCol >= 0 ? values[timeCol] : '', note: noteCol >= 0 ? values[noteCol] : '' }));
}

export async function readGuestFile(file) {
  const name = file.name.toLocaleLowerCase();
  if (name.endsWith('.csv')) return parseGuestRows(parseCSV(await file.text()));
  if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) throw new Error('Chỉ nhận tệp .csv, .xlsx hoặc .xls.');
  if (!globalThis.XLSX) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = resolve; script.onerror = () => reject(new Error('Không tải được thư viện đọc Excel. Hãy thử CSV.'));
      document.head.append(script);
    });
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map(row => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLocaleLowerCase('vi'), value]));
    const pick = keys => keys.map(key => normalized[key]).find(value => value != null) ?? '';
    return { name: pick(['name', 'tên', 'ten', 'họ tên', 'ho ten', 'tên khách', 'ten khach']),
      salutation: pick(['salutation', 'danh xưng', 'danh xung', 'xưng hô', 'xung ho']),
      inviteTime: pick(['inviteTime', 'invite time', 'thời gian mời', 'thoi gian moi', 'giờ mời', 'gio moi']),
      note: pick(['note', 'ghi chú', 'ghi chu']) };
  });
}

export const guestCSVColumns = columns;
