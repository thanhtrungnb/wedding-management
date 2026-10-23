/* Menu Khách mời: thanh công cụ (thêm/nhập/xuất/database dev/đồng bộ hai chiều) + bảng danh sách full-width.
   Thiết kế thiệp nằm ở menu Thiệp riêng; kết nối đám mây dùng chung từ cloudConfig (Cài đặt). */
import { getData, commit, onChange, undo } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { esc } from '../../utils/format.js';
import { svg } from '../../ui/icons.js';
import { saveGuest, removeGuest, importGuests, applyRemoteGuestState } from '../../services/guestService.js';
import { exportGuests, readGuestFile } from '../../storage/guestFiles.js';
import { publishGuestData, readGuestState, invitationText, invitationURL } from '../../storage/guestBackend.js';
import { isCloudConfigured } from '../../storage/cloudConfig.js';
import { supportsGuestDatabase, openGuestDatabase, createGuestDatabase, saveGuestDatabase, guestDatabaseActive } from '../../storage/guestCsvDatabase.js';

const RSVP = { pending: 'Chưa phản hồi', attending: 'Tham dự', declined: 'Không tham dự' };
const field = (id, label, value = '', type = 'text', cls = '') => `<div class="field"><label class="field__l" for="guest-${id}">${label}</label><input class="input ${cls}" id="guest-${id}" name="${id}" type="${type}" value="${esc(value)}" maxlength="${id === 'name' ? 120 : 160}"><p class="field__err" data-err="${id}" role="alert"></p></div>`;

function guestDialog(guest = null) {
  const form = `<form class="sheet__body" novalidate><header class="sheet__head"><h2 class="sheet__title">${guest ? 'Sửa khách mời' : 'Thêm khách mời'}</h2><button class="sheet__x" type="button" data-close aria-label="Đóng">×</button></header>
    ${field('name', 'Tên khách mời', guest?.name)}${field('salutation', 'Danh xưng', guest?.salutation)}${field('inviteTime', 'Giờ mời in trên thiệp (mỗi top khách một giờ, VD 11:00)', guest?.inviteTime, 'time', 'narrow')}${field('note', 'Ghi chú', guest?.note)}${field('partySize', 'Số người dự kiến', guest?.partySize || 0, 'number', 'narrow')}
    <footer class="sheet__foot"><button class="btn" type="submit">Lưu</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(form, { label: guest ? 'Sửa khách mời' : 'Thêm khách mời', onMount(host, signal) {
    host.querySelector('form').addEventListener('submit', event => {
      event.preventDefault(); const result = commit(data => saveGuest(data, Object.fromEntries(new FormData(event.currentTarget)), guest?.id));
      if (!result.ok) { host.querySelector('[data-err="name"]').textContent = result.errors.name; return; }
      closeSheet(); toast(guest ? 'Đã lưu khách mời.' : 'Đã thêm khách mời.');
    }, { signal });
  } });
}
function rows(data, fInvite, fRsvp, query) {
  const q = query.trim().toLocaleLowerCase('vi');
  const guests = data.guests.filter(g => {
    const invited = !!g.invitedAt;
    return (fInvite === 'all' || (fInvite === 'invited') === invited)
      && (fRsvp === 'all' || g.rsvp === fRsvp)
      && `${g.name} ${g.salutation} ${g.note}`.toLocaleLowerCase('vi').includes(q);
  });
  if (!guests.length) return '<tr><td colspan="7" class="guest-empty">Chưa có khách phù hợp bộ lọc.</td></tr>';
  return guests.map(g => `<tr>
    <td class="guest-id" title="${esc(g.id)}">${esc(g.id)}</td>
    <td><strong>${esc(g.name)}</strong>${g.salutation ? `<small>${esc(g.salutation)}</small>` : ''}</td>
    <td class="guest-invite-time">${g.inviteTime ? `giờ ${esc(g.inviteTime)}` : '—'}</td>
    <td><input type="checkbox" data-invited="${esc(g.id)}" ${g.invitedAt ? 'checked' : ''} aria-label="Đã mời ${esc(g.name)}"></td>
    <td><a class="guest-link" href="${esc(invitationURL(g.token))}" target="_blank" rel="noopener" title="Xem trước thiệp của ${esc(g.name)}">thiệp·${esc(g.token.slice(0, 8))}…</a></td>
    <td><span class="guest-status ${g.rsvp === 'attending' ? 'is-done' : g.rsvp === 'declined' ? 'is-no' : ''}">${RSVP[g.rsvp]}</span></td>
    <td><div class="guest-actions"><button class="ibtn" type="button" data-copy="${esc(g.id)}" title="Copy lời mời" aria-label="Copy lời mời">${svg('copy')}</button><button class="ibtn" type="button" data-edit="${esc(g.id)}" title="Sửa" aria-label="Sửa">${svg('pencil')}</button><button class="ibtn ibtn--danger" type="button" data-delete="${esc(g.id)}" title="Xóa" aria-label="Xóa">${svg('trash')}</button></div></td>
  </tr>`).join('');
}
function view(data) {
  return `<div class="wrap guest-page"><header class="page-head"><div><p class="eyebrow">Danh sách & lời mời</p><h1 class="page-title">Khách mời</h1><p class="lede">Mỗi khách một link thiệp riêng; thiết kế thiệp ở menu Thiệp, kết nối đám mây ở Cài đặt.</p></div></header>
    <section class="guest-bar"><div class="guest-toolbar">
      <button class="btn" data-add>${svg('plus')} Thêm khách</button>
      <label class="btn btn--quiet filebtn">Nhập khẩu<input type="file" accept=".csv,.xlsx,.xls" data-import hidden></label>
      <button class="btn btn--quiet" data-export>Xuất khẩu</button>
      <button class="btn btn--quiet" data-db-toggle ${supportsGuestDatabase() ? '' : 'disabled'}>Database <span class="tag">dev</span></button>
      <button class="btn btn--quiet" data-sync title="Kéo phản hồi từ Google Sheet về rồi đẩy dữ liệu mới lên">${svg('sync')} Đồng bộ</button>
      <span id="guest-status" class="fine" role="status">${guestDatabaseActive() ? 'Đang dùng CSV database; thay đổi lưu vào file.' : isCloudConfigured() ? '' : 'Chưa cấu hình kết nối đám mây — mở menu Cài đặt.'}</span>
    </div>
    <div class="guest-db" id="guest-db-panel" hidden><p class="fine">Công cụ dev (sẽ bỏ): chọn file CSV làm database làm việc — thay đổi tự lưu vào file. CSV/Excel nhập và xuất vẫn khả dụng ở trình duyệt khác.</p>
      <div class="guest-toolbar"><button class="btn btn--sm btn--quiet" data-open-csv>Mở CSV database</button><button class="btn btn--sm btn--quiet" data-create-csv>Tạo CSV database</button><span id="csv-db-status" class="fine" role="status"></span></div></div></section>
    <section class="guest-table-section"><div class="guest-table-head"><h2>Danh sách khách (${data.guests.length})</h2><label class="guest-search"><span>Tìm</span><input class="input" type="search" data-search placeholder="Tên, danh xưng…"></label></div>
    <div class="guest-filters">
      <label>Trạng thái mời <select class="input" data-filter-invite><option value="all">Tất cả</option><option value="invited">Đã mời</option><option value="not-invited">Chưa mời</option></select></label>
      <label>Trạng thái phản hồi <select class="input" data-filter-rsvp><option value="all">Tất cả</option><option value="pending">Chưa phản hồi</option><option value="attending">Tham dự</option><option value="declined">Không tham dự</option></select></label>
    </div>
    <div class="guest-table-wrap"><table class="guest-table"><thead><tr><th>ID</th><th>Khách</th><th>Thời gian mời</th><th>Đã mời</th><th>Link</th><th>Phản hồi</th><th>Thao tác</th></tr></thead><tbody id="guest-rows">${rows(data, 'all', 'all', '')}</tbody></table></div></section></div>`;
}
const copyText = async text => { try { await navigator.clipboard.writeText(text); return true; } catch { const area = document.createElement('textarea'); area.value = text; area.style.cssText = 'position:fixed;opacity:0'; document.body.append(area); area.select(); const ok = document.execCommand('copy'); area.remove(); return ok; } };
export function mount(el, signal) {
  const draw = () => { el.innerHTML = view(getData()); };
  draw();
  const currentFilters = () => [el.querySelector('[data-filter-invite]').value, el.querySelector('[data-filter-rsvp]').value, el.querySelector('[data-search]').value];
  onChange(() => { const body = el.querySelector('#guest-rows'); if (!body) return; const data = getData(); body.innerHTML = rows(data, ...currentFilters()); el.querySelector('.guest-table-head h2').textContent = `Danh sách khách (${data.guests.length})`; if (guestDatabaseActive()) saveGuestDatabase(data.guests).catch(error => { const status = el.querySelector('#csv-db-status'); if (status) status.textContent = `Không lưu được CSV: ${error.message}`; }); }, signal);
  el.addEventListener('input', event => { if (event.target.matches('[data-search]')) el.querySelector('#guest-rows').innerHTML = rows(getData(), ...currentFilters()); }, { signal });
  el.addEventListener('change', event => {
    if (event.target.matches('[data-filter-invite],[data-filter-rsvp]')) el.querySelector('#guest-rows').innerHTML = rows(getData(), ...currentFilters());
  }, { signal });
  el.addEventListener('click', async event => {
    if (event.target.closest('[data-db-toggle]')) { const panel = el.querySelector('#guest-db-panel'); panel.hidden = !panel.hidden; return; }
    if (event.target.closest('[data-open-csv]')) {
      try { const guests = await openGuestDatabase(); commit(data => { data.guests = guests; }); el.querySelector('#guest-status').textContent = 'Đang dùng CSV database; thay đổi lưu vào file.'; toast(`Đã mở CSV database (${guests.length} khách).`); }
      catch (error) { if (error.name !== 'AbortError') el.querySelector('#csv-db-status').textContent = error.message; }
      return;
    }
    if (event.target.closest('[data-create-csv]')) {
      try { const guests = getData().guests; await createGuestDatabase(guests); el.querySelector('#guest-status').textContent = 'Đang dùng CSV database; thay đổi lưu vào file.'; toast('Đã tạo CSV database và ghi danh sách hiện tại.'); }
      catch (error) { if (error.name !== 'AbortError') el.querySelector('#csv-db-status').textContent = error.message; }
      return;
    }
    if (event.target.closest('[data-add]')) return guestDialog();
    if (event.target.closest('[data-export]')) return exportGuests(getData().guests);
    const sync = event.target.closest('[data-sync]');
    if (sync) {
      if (!isCloudConfigured()) { el.querySelector('#guest-status').textContent = 'Chưa cấu hình kết nối đám mây — mở menu Cài đặt.'; return; }
      const status = el.querySelector('#guest-status');
      sync.disabled = true;
      status.textContent = 'Đang kéo dữ liệu từ Google Sheet…';
      try {
        const remote = await readGuestState();
        commit(data => applyRemoteGuestState(data, remote.guests));
        status.textContent = 'Đang đẩy dữ liệu mới lên…';
        await publishGuestData(getData());
        status.textContent = 'Đồng bộ hai chiều xong.';
      } catch (error) { status.textContent = error.message; }
      finally { sync.disabled = false; }
      return;
    }
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      const guest = getData().guests.find(item => item.id === copy.dataset.copy);
      if (!guest) return;
      const ok = await copyText(invitationText(getData(), guest));
      if (ok) toast('Đã sao chép lời mời. Hãy đánh dấu “Đã mời” sau khi gửi.');
      else toast('Không sao chép được nội dung.');
      return;
    }
    const edit = event.target.closest('[data-edit]'); if (edit) return guestDialog(getData().guests.find(item => item.id === edit.dataset.edit));
    const del = event.target.closest('[data-delete]'); if (del) { const result = commit(data => removeGuest(data, del.dataset.delete), { undoable: true }); if (result.ok) toast(`Đã xóa “${result.guest.name}”.`, { label: 'Hoàn tác', run: undo }); }
  }, { signal });
  el.addEventListener('change', async event => {
    const invited = event.target.closest('[data-invited]');
    if (invited) {
      const guestId = invited.dataset.invited;
      commit(data => { const guest = data.guests.find(item => item.id === guestId); if (guest) guest.invitedAt = invited.checked ? (guest.invitedAt || new Date().toISOString()) : ''; });
      if (isCloudConfigured()) publishGuestData(getData()).catch(error => toast(`Đã lưu trên máy; chưa đồng bộ đám mây: ${error.message}`));
      return;
    }
    const file = event.target.closest('[data-import]')?.files?.[0]; if (!file) return;
    const status = el.querySelector('#guest-status'); event.target.value = '';
    try {
      const imported = await readGuestFile(file);
      if (!imported.length) { status.textContent = 'Tệp không có dòng khách hợp lệ.'; return; }
      const preview = imported.slice(0, 5).map(item => item.name).filter(Boolean).join(', ');
      const missing = imported.filter(item => !String(item.name ?? '').trim()).length;
      if (!confirm(`Tìm thấy ${imported.length} dòng (${missing} dòng thiếu tên sẽ bỏ qua). Ví dụ: ${preview}. Nhập? Khách trùng tên sẽ được cập nhật.`)) return;
      let result; commit(data => { result = importGuests(data, imported); });
      status.textContent = `Đã thêm ${result.added}, cập nhật ${result.updated}, bỏ qua ${result.skipped} dòng thiếu tên.`;
    } catch (error) { status.textContent = error.message; }
  }, { signal });
}
