import { getData, commit, undo, onChange, replaceAll, startBlank, restoreSample } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveProfile } from '../../services/profileService.js';
import { saveCategory, removeCategory } from '../../services/categoryService.js';
import { exportJSON, readImport } from '../../storage/backup.js';
import { getLastSync, pull, push } from '../../storage/remoteStore.js';
import { getCloudUrl, getAdminKey, setCloudConnection, isCloudConfigured } from '../../storage/cloudConfig.js';
import { publishGuestData, readGuestState } from '../../storage/guestBackend.js';
import { applyRemoteGuestState } from '../../services/guestService.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { svg } from '../../ui/icons.js';
import { updateSyncNote } from '../../core/nav.js';
import { esc, formatSyncTime } from '../../utils/format.js';
/** Clipboard API cần ngữ cảnh bảo mật (https/localhost) — có fallback cho http thường. */
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
/** Popup hướng dẫn: mở trang Apps Script, sao chép mã nguồn, triển khai Web app. */
function openGuide() {
  openSheet(`<div class="sheet__body">
    <div class="sheet__head"><div><p class="eyebrow">Đồng bộ</p><h2 class="sheet__title">Kết nối Google Sheet</h2></div>
    <button class="sheet__x" data-close aria-label="Đóng">×</button></div>
    <ol class="guide">
      <li>Mở <a href="https://sheets.new" target="_blank" rel="noopener">Google Sheet mới</a> bằng tài khoản Google của bạn.</li>
      <li>Trên Sheet: <em>Extensions</em> → <em>Apps Script</em>. Xóa nội dung mặc định rồi dán mã nguồn:
        <div class="set__row"><button type="button" class="btn btn--sm" data-copy-code>Sao chép mã nguồn</button><span id="copy-msg" class="fine" role="status"></span></div></li>
      <li>Trong mã nguồn vừa dán, đổi <code>ADMIN_KEY</code> thành một khóa ngẫu nhiên dài — khóa này chỉ nhập trên thiết bị quản lý, không đưa vào link thiệp.</li>
      <li><em>Deploy</em> → <em>New deployment</em> → <em>Web app</em>, mục truy cập chọn <em>Anyone</em> → <em>Deploy</em>.</li>
      <li>Copy địa chỉ kết thúc bằng <code>/exec</code>, dán vào ô địa chỉ ở Cài đặt cùng với khóa quản trị, rồi bấm <em>Gửi dữ liệu app</em>.</li>
    </ol></div>`, {
    label: 'Hướng dẫn kết nối Google Sheet',
    onMount(host, sig) {
      host.addEventListener('click', async e => {
        if (!e.target.closest('[data-copy-code]')) return;
        const msg = host.querySelector('#copy-msg');
        let code; try { code = await (await fetch('google-apps-script/Code.gs')).text(); }
        catch { msg.textContent = 'Không đọc được tệp mã nguồn.'; return; }
        msg.textContent = copyText(code) ? 'Đã sao chép — dán vào trình soạn Apps Script.' : 'Không sao chép được, hãy mở tệp google-apps-script/Code.gs thủ công.';
      }, { signal: sig });
    },
  });
}

/* Hạng mục: dữ liệu gốc dùng chung — việc cần làm và khoản ngân sách đều gắn vào một hạng mục. Không tổng hợp tiền ở đây. */
function catList(d) {
  if (!d.categories.length) return '<p class="fine">Chưa có hạng mục nào — bấm “Thêm hạng mục” để bắt đầu.</p>';
  return `<ul class="catlist">${d.categories.map(c => `<li>
    <span class="catlist__n">${esc(c.name)}</span>
    <span class="catlist__act"><button type="button" class="ibtn" data-edit-cat="${esc(c.id)}" aria-label="Sửa hạng mục ${esc(c.name)}">${svg('pencil')}</button><button type="button" class="ibtn ibtn--danger" data-del-cat="${esc(c.id)}" aria-label="Xóa hạng mục ${esc(c.name)}">${svg('trash')}</button></span></li>`).join('')}</ul>`;
}

/** Thêm/sửa hạng mục — hạng mục chỉ có tên, dùng chung cho việc cần làm và ngân sách. */
function openCategoryDialog({ id } = {}) {
  const d = getData(), cur = id ? d.categories.find(c => c.id === id) : null;
  if (id && !cur) return;
  const html = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">${id ? 'Sửa hạng mục' : 'Thêm hạng mục'}</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    <div class="field"><label class="field__l" for="f-cat">Tên hạng mục</label>
      <input id="f-cat" name="name" class="input" maxlength="60" autocomplete="off" required autofocus placeholder="ví dụ: Địa điểm, Trang phục, Nhiếp ảnh" value="${esc(cur?.name ?? '')}">
      <p class="field__err" data-err="name" role="alert"></p></div>
    <footer class="sheet__foot"><button class="btn" type="submit">${id ? 'Lưu thay đổi' : 'Thêm hạng mục'}</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(html, { label: id ? 'Sửa hạng mục' : 'Thêm hạng mục', onMount(dlg, signal) {
    const form = dlg.querySelector('form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(form));
      const r = commit(dd => saveCategory(dd, input, id ?? null));
      if (!r.ok) return void (form.querySelector('[data-err="name"]').textContent = r.errors.name ?? '');
      closeSheet(); toast(id ? 'Đã lưu thay đổi.' : `Đã thêm hạng mục “${input.name.trim()}”.`);
    }, { signal });
  } });
}

function view() {
  const d = getData();
  return `<header class="page-head"><div><h1 class="page-title">Thông tin &amp; dữ liệu</h1></div></header>
  <div class="set">
  <section class="set__card" aria-labelledby="st-profile"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('user')}</span><h2 id="st-profile">Thông tin đám cưới</h2></div><p>Dùng cho trang tổng quan và đếm ngược ngày cưới.</p></div>
    <form id="profile" class="stack-form" novalidate>
      <div class="row3"><div class="field"><label class="field__l" for="p-bride">Cô dâu</label><input id="p-bride" name="bride" class="input" maxlength="40" value="${esc(d.couple.bride)}"></div>
      <div class="field"><label class="field__l" for="p-groom">Chú rể</label><input id="p-groom" name="groom" class="input" maxlength="40" value="${esc(d.couple.groom)}"></div>
      <div class="field"><label class="field__l" for="p-date">Ngày cưới</label><input id="p-date" name="weddingDate" type="date" class="input" value="${esc(d.weddingDate)}"><p class="field__err" data-err="weddingDate" role="alert"></p></div></div>
      <div class="set__row"><button class="btn btn--sm" type="submit">Lưu thông tin</button></div></form></section>
  <section class="set__card" aria-labelledby="st-cats"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('list')}</span><h2 id="st-cats">Hạng mục</h2></div><p>Dữ liệu gốc dùng chung: việc trong trang Việc cần làm và khoản trong trang Ngân sách đều gắn vào một hạng mục. Không tổng hợp số tiền ở đây.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-add-cat>Thêm hạng mục</button></div>
    <div id="cat-list">${catList(d)}</div></section>
  <section class="set__card" aria-labelledby="st-backup"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('save')}</span><h2 id="st-backup">Sao lưu</h2></div><p>Dữ liệu nằm trên trình duyệt này — nên xuất bản sao định kỳ.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-export>Xuất tệp .json</button>
    <label class="btn btn--sm btn--quiet filebtn">Nhập từ tệp<input type="file" accept="application/json,.json" data-import hidden></label></div>
    <p id="import-msg" role="status" class="fine"></p></section>
  <section class="set__card" aria-labelledby="st-sync"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('sync')}</span><h2 id="st-sync">Kết nối đám mây</h2></div><p>Một URL Web App + một khóa quản trị dùng chung cho toàn app: đồng bộ dữ liệu, khách mời, thiệp và RSVP. Khóa chỉ lưu trên thiết bị này.</p></div>
    <div class="field"><label class="field__l" for="sync-url">Địa chỉ Web App (kết thúc bằng /exec)</label>
    <input id="sync-url" class="input" type="url" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(getCloudUrl())}"></div>
    <div class="field"><label class="field__l" for="sync-key">Khóa quản trị (ADMIN_KEY trong mã nguồn Apps Script)</label>
    <input id="sync-key" class="input" type="password" autocomplete="off" value="${esc(getAdminKey())}"></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-push>Gửi dữ liệu app</button><button type="button" class="btn btn--sm btn--quiet" data-pull>Tải dữ liệu app</button>
    <button type="button" class="btn btn--sm btn--quiet" data-publish>Đẩy khách &amp; thiệp</button><button type="button" class="btn btn--sm btn--quiet" data-pull-rsvp>Tải RSVP</button>
    <button type="button" class="btn btn--sm btn--quiet" data-guide>Hướng dẫn kết nối</button></div>
    <p id="sync-status" role="status" class="fine">${esc(formatSyncTime(getLastSync()))}</p></section>
  <section class="set__card set__card--danger" aria-labelledby="st-reset"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('warn')}</span><h2 id="st-reset">Bắt đầu lại</h2></div><p>Xóa dữ liệu hiện tại — nên xuất bản sao lưu trước.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm btn--quiet" data-blank>Sổ trống</button><button type="button" class="btn btn--sm btn--quiet" data-sample>Dữ liệu mẫu</button></div></section>
  </div>`;
}
export function mount(el, signal) {
  el.innerHTML = `<div class="setpage">${view()}</div>`;
  /* Chỉ vẽ lại danh sách hạng mục — không vẽ lại cả trang để không mất giá trị đang nhập ở các ô khác. */
  onChange(() => {
    const cats = el.querySelector('#cat-list'); if (cats) cats.innerHTML = catList(getData());
  }, signal);
  el.addEventListener('submit', e => {
    e.preventDefault(); const form = e.target;
    const r = commit(d => saveProfile(d, Object.fromEntries(new FormData(form))));
    if (r.ok) toast('Đã lưu thông tin đám cưới.'); else form.querySelector('[data-err]').textContent = r.errors.weddingDate ?? r.errors.names ?? '';
  }, { signal });
  el.addEventListener('click', async e => {
    if (e.target.closest('[data-add-cat]')) return openCategoryDialog();
    const ec = e.target.closest('[data-edit-cat]'); if (ec) return openCategoryDialog({ id: ec.dataset.editCat });
    const dc = e.target.closest('[data-del-cat]');
    if (dc) {
      const r = commit(d => removeCategory(d, dc.dataset.delCat), { undoable: true });
      if (r.ok) toast(`Đã xóa hạng mục “${r.name}”.`, { label: 'Hoàn tác', run: undo });
      else toast(r.message || 'Không xóa được hạng mục.');
      return;
    }
    if (e.target.closest('[data-export]')) { exportJSON(getData()); toast('Đã tạo tệp sao lưu.'); }
    if (e.target.closest('[data-blank]') && confirm('Xóa toàn bộ dữ liệu hiện tại và bắt đầu sổ trống?')) { await startBlank(); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã tạo sổ trống.'); }
    if (e.target.closest('[data-sample]') && confirm('Thay dữ liệu hiện tại bằng dữ liệu mẫu?')) {
      try { await restoreSample(); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã khôi phục dữ liệu mẫu.'); }
      catch { toast('Không đọc được tệp dữ liệu mẫu.'); }
    }
    if (e.target.closest('[data-guide]')) { openGuide(); return; }
    const btn = e.target.closest('[data-push],[data-pull],[data-publish],[data-pull-rsvp]'); if (!btn) return;
    setCloudConnection(el.querySelector('#sync-url').value, el.querySelector('#sync-key').value);
    if (!isCloudConfigured()) { el.querySelector('#sync-status').textContent = 'Nhập địa chỉ Web App hợp lệ và khóa quản trị trước.'; return; }
    const st = el.querySelector('#sync-status');
    const buttons = () => el.querySelectorAll('[data-push],[data-pull],[data-publish],[data-pull-rsvp]');
    buttons().forEach(b => b.disabled = true);
    try {
      if (btn.hasAttribute('data-publish')) {
        st.textContent = 'Đang đẩy khách & thiệp…';
        await publishGuestData(getData());
        st.textContent = 'Đã cập nhật khách mời và thiệp lên đám mây.';
      } else if (btn.hasAttribute('data-pull-rsvp')) {
        st.textContent = 'Đang tải RSVP…';
        const remote = await readGuestState();
        commit(data => applyRemoteGuestState(data, remote.guests));
        st.textContent = 'Đã tải trạng thái RSVP mới nhất.';
      } else if (btn.hasAttribute('data-push')) {
        st.textContent = 'Đang gửi dữ liệu app…';
        const r = await push(getData());
        if (!r.ok) { st.textContent = r.errors[0]; return; }
        st.textContent = formatSyncTime(new Date(r.updatedAt)); updateSyncNote(); toast('Đã gửi dữ liệu app lên đám mây.');
      } else {
        st.textContent = 'Đang tải dữ liệu app…';
        const r = await pull();
        if (!r.ok) { st.textContent = r.errors[0]; return; }
        if (confirm(`Thay dữ liệu trên máy bằng bản trên đám mây (${r.data.tasks.length} việc)? Danh sách khách và thiết kế thiệp cục bộ được giữ nguyên.`)) {
          const current = getData(); replaceAll({ ...r.data, guests: current.guests, invitation: current.invitation });
          el.innerHTML = `<div class="setpage">${view()}</div>`; updateSyncNote(); toast('Đã tải dữ liệu app từ đám mây.');
        }
        else st.textContent = formatSyncTime(getLastSync());
      }
    } catch (error) { st.textContent = error.message; }
    finally { buttons().forEach(b => b.disabled = false); }
  }, { signal });
  el.addEventListener('change', async e => {
    if (e.target.id === 'sync-url' || e.target.id === 'sync-key') { setCloudConnection(el.querySelector('#sync-url').value, el.querySelector('#sync-key').value); toast('Đã lưu kết nối đám mây.'); return; }
    const f = e.target.closest('[data-import]')?.files?.[0]; if (!f) return;
    const msg = el.querySelector('#import-msg'), r = await readImport(f); e.target.value = '';
    if (!r.ok) { msg.innerHTML = `Không thể nhập tệp này, dữ liệu hiện tại được giữ nguyên:<br>${r.errors.map(esc).join('<br>')}`; return; }
    if (confirm(`Thay dữ liệu hiện tại bằng tệp này (${r.data.tasks.length} việc)?`)) { replaceAll(r.data); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã nhập dữ liệu từ tệp.'); }
  }, { signal });
}
