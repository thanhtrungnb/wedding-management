import { getData, commit, undo, onChange, replaceAll, startBlank, restoreSample } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveProfile } from '../../services/profileService.js';
import { removeItem } from '../../services/budgetService.js';
import { openNewItemDialog, openItemDialog } from '../budget/budgetDialogs.js';
import { exportJSON, readImport } from '../../storage/backup.js';
import { getSyncUrl, setSyncUrl, getLastSync, pull, push } from '../../storage/remoteStore.js';
import { openSheet } from '../../ui/sheet.js';
import { svg } from '../../ui/icons.js';
import { updateSyncNote } from '../../core/nav.js';
import { esc, formatVNDShort, formatDateShort, formatSyncTime } from '../../utils/format.js';
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
      <li><em>Deploy</em> → <em>New deployment</em> → <em>Web app</em>, mục truy cập chọn <em>Anyone</em> → <em>Deploy</em>.</li>
      <li>Copy địa chỉ kết thúc bằng <code>/exec</code>, dán vào ô địa chỉ ở Cài đặt rồi bấm <em>Gửi lên Sheet</em>.</li>
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

/* Danh mục ngân sách: khoản được cấu hình ở đây, trang Ngân sách chỉ ghi chép theo danh mục này. */
function budgetList(d) {
  if (!d.budget.items.length) return '<p class="fine">Chưa có khoản nào — bấm “Thêm khoản” để bắt đầu.</p>';
  return d.categories.map(c => {
    const items = d.budget.items.filter(x => x.categoryId === c.id); if (!items.length) return '';
    return `<h3 class="bcfg__group">${esc(c.name)}</h3><ul class="bcfg">${items.map(x => `<li>
      <span class="bcfg__n">${esc(x.name)}${x.type === 'thu' ? ' <span class="tag tag--done">Thu</span>' : ''}</span>
      <span class="bcfg__m ${x.type === 'thu' ? 't-green' : 't-red'}">${esc(formatVNDShort(x.planned))}</span>
      <span class="bcfg__d">${x.date ? esc(formatDateShort(x.date)) : ''}</span>
      <span class="bcfg__act"><button type="button" class="btn btn--sm btn--quiet" data-edit-item="${esc(x.id)}">Sửa</button><button type="button" class="btn btn--sm btn--quiet btn--danger" data-del-item="${esc(x.id)}" aria-label="Xóa khoản ${esc(x.name)}">Xóa</button></span></li>`).join('')}</ul>`;
  }).join('');
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
  <section class="set__card" aria-labelledby="st-budget"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('coin')}</span><h2 id="st-budget">Danh mục ngân sách</h2></div><p>Khoản thu/chi dùng để ghi chép trong trang Ngân sách — mỗi khoản thuộc một nhóm công việc.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-add-item>Thêm khoản</button></div>
    <div id="budget-items">${budgetList(d)}</div></section>
  <section class="set__card" aria-labelledby="st-backup"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('save')}</span><h2 id="st-backup">Sao lưu</h2></div><p>Dữ liệu nằm trên trình duyệt này — nên xuất bản sao định kỳ.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-export>Xuất tệp .json</button>
    <label class="btn btn--sm btn--quiet filebtn">Nhập từ tệp<input type="file" accept="application/json,.json" data-import hidden></label></div>
    <p id="import-msg" role="status" class="fine"></p></section>
  <section class="set__card" aria-labelledby="st-sync"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('sync')}</span><h2 id="st-sync">Đồng bộ Google Sheet</h2></div><p>Gửi bản sao lên Google Sheet để dùng trên nhiều thiết bị.</p></div>
    <div class="field"><label class="field__l" for="sync-url">Địa chỉ Web App (kết thúc bằng /exec)</label>
    <input id="sync-url" class="input" type="url" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(getSyncUrl())}"></div>
    <div class="set__row"><button type="button" class="btn btn--sm" data-push>Gửi lên Sheet</button><button type="button" class="btn btn--sm btn--quiet" data-pull>Tải từ Sheet</button>
    <button type="button" class="btn btn--sm btn--quiet" data-guide>Hướng dẫn kết nối</button></div>
    <p id="sync-status" role="status" class="fine">${esc(formatSyncTime(getLastSync()))}</p></section>
  <section class="set__card set__card--danger" aria-labelledby="st-reset"><div class="set__intro"><div class="set__ttl"><span class="set__ico">${svg('warn')}</span><h2 id="st-reset">Bắt đầu lại</h2></div><p>Xóa dữ liệu hiện tại — nên xuất bản sao lưu trước.</p></div>
    <div class="set__row"><button type="button" class="btn btn--sm btn--quiet" data-blank>Sổ trống</button><button type="button" class="btn btn--sm btn--quiet" data-sample>Dữ liệu mẫu</button></div></section>
  </div>`;
}
export function mount(el, signal) {
  el.innerHTML = `<div class="setpage">${view()}</div>`;
  /* Chỉ vẽ lại danh sách khoản — không vẽ lại cả trang để không mất giá trị đang nhập ở các ô khác. */
  onChange(() => { const box = el.querySelector('#budget-items'); if (box) box.innerHTML = budgetList(getData()); }, signal);
  el.addEventListener('submit', e => {
    e.preventDefault(); const form = e.target;
    const r = commit(d => saveProfile(d, Object.fromEntries(new FormData(form))));
    if (r.ok) toast('Đã lưu thông tin đám cưới.'); else form.querySelector('[data-err]').textContent = r.errors.weddingDate ?? r.errors.names ?? '';
  }, { signal });
  el.addEventListener('click', async e => {
    if (e.target.closest('[data-add-item]')) return openNewItemDialog();
    const ed = e.target.closest('[data-edit-item]'); if (ed) return openItemDialog({ id: ed.dataset.editItem });
    const del = e.target.closest('[data-del-item]');
    if (del) {
      const r = commit(d => removeItem(d, del.dataset.delItem), { undoable: true });
      if (r.ok) toast(`Đã xóa khoản “${r.name}”.`, { label: 'Hoàn tác', run: undo });
      return;
    }
    if (e.target.closest('[data-export]')) { exportJSON(getData()); toast('Đã tạo tệp sao lưu.'); }
    if (e.target.closest('[data-blank]') && confirm('Xóa toàn bộ dữ liệu hiện tại và bắt đầu sổ trống?')) { await startBlank(); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã tạo sổ trống.'); }
    if (e.target.closest('[data-sample]') && confirm('Thay dữ liệu hiện tại bằng dữ liệu mẫu?')) {
      try { await restoreSample(); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã khôi phục dữ liệu mẫu.'); }
      catch { toast('Không đọc được tệp dữ liệu mẫu.'); }
    }
    if (e.target.closest('[data-guide]')) { openGuide(); return; }
    const btn = e.target.closest('[data-push],[data-pull]'); if (!btn) return;
    setSyncUrl(el.querySelector('#sync-url').value);
    const st = el.querySelector('#sync-status'), isPush = btn.hasAttribute('data-push');
    el.querySelectorAll('[data-push],[data-pull]').forEach(b => b.disabled = true);
    st.textContent = isPush ? 'Đang gửi lên Sheet…' : 'Đang tải từ Sheet…';
    const r = isPush ? await push(getData()) : await pull();
    el.querySelectorAll('[data-push],[data-pull]').forEach(b => b.disabled = false);
    if (!r.ok) { st.textContent = r.errors[0]; return; }
    if (isPush) { st.textContent = formatSyncTime(new Date(r.updatedAt)); updateSyncNote(); toast('Đã gửi dữ liệu lên Google Sheet.'); return; }
    if (confirm(`Thay dữ liệu trên máy bằng bản trên Sheet (${r.data.tasks.length} việc)?`)) { replaceAll(r.data); el.innerHTML = `<div class="setpage">${view()}</div>`; updateSyncNote(); toast('Đã tải dữ liệu từ Google Sheet.'); }
    else st.textContent = formatSyncTime(getLastSync());
  }, { signal });
  el.addEventListener('change', async e => {
    if (e.target.id === 'sync-url') { setSyncUrl(e.target.value); toast(e.target.value.trim() ? 'Đã lưu địa chỉ đồng bộ.' : 'Đã xóa địa chỉ đồng bộ.'); return; }
    const f = e.target.closest('[data-import]')?.files?.[0]; if (!f) return;
    const msg = el.querySelector('#import-msg'), r = await readImport(f); e.target.value = '';
    if (!r.ok) { msg.innerHTML = `Không thể nhập tệp này, dữ liệu hiện tại được giữ nguyên:<br>${r.errors.map(esc).join('<br>')}`; return; }
    if (confirm(`Thay dữ liệu hiện tại bằng tệp này (${r.data.tasks.length} việc)?`)) { replaceAll(r.data); el.innerHTML = `<div class="setpage">${view()}</div>`; toast('Đã nhập dữ liệu từ tệp.'); }
  }, { signal });
}
