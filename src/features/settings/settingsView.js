import { getData, commit, replaceAll, startBlank, restoreSample, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveProfile } from '../../services/profileService.js';
import { exportJSON, readImport } from '../../storage/backup.js';
import { esc } from '../../utils/format.js';

function view() {
  const d = getData();
  return `<header class="page-head"><div><p class="eyebrow">Cài đặt</p><h1 class="page-title">Thông tin &amp; dữ liệu</h1><p class="lede">Dữ liệu được lưu ngay trên trình duyệt này. Hãy xuất bản sao lưu định kỳ để an tâm.</p></div></header>
  <section class="section"><div class="section__head"><h2>Thông tin đám cưới</h2></div>
  <form id="profile" class="stack-form" novalidate>
    <div class="row2"><div class="field"><label class="field__l" for="p-bride">Cô dâu</label><input id="p-bride" name="bride" class="input" maxlength="40" value="${esc(d.couple.bride)}"></div>
    <div class="field"><label class="field__l" for="p-groom">Chú rể</label><input id="p-groom" name="groom" class="input" maxlength="40" value="${esc(d.couple.groom)}"></div></div>
    <div class="field"><label class="field__l" for="p-date">Ngày cưới</label><input id="p-date" name="weddingDate" type="date" class="input narrow" value="${esc(d.weddingDate)}"><p class="field__err" data-err="weddingDate" role="alert"></p></div>
    <div class="sheet__foot"><button class="btn" type="submit">Lưu thông tin</button></div></form></section>
  <section class="section"><div class="section__head"><h2>Sao lưu &amp; khôi phục</h2></div>
    <div class="sheet__foot"><button type="button" class="btn" data-export>Xuất tệp sao lưu (.json)</button>
    <label class="btn btn--quiet filebtn">Nhập từ tệp sao lưu<input type="file" accept="application/json,.json" data-import hidden></label></div>
    <div id="import-msg" role="status" class="fine"></div></section>
  <section class="section"><div class="section__head"><h2>Bắt đầu lại</h2></div>
    <p class="lede">Dùng khi hai bạn muốn xóa dữ liệu mẫu và bắt đầu sổ của riêng mình. Nên xuất bản sao lưu trước.</p>
    <div class="sheet__foot"><button type="button" class="btn btn--quiet" data-blank>Bắt đầu với sổ trống</button><button type="button" class="btn btn--quiet" data-sample>Khôi phục dữ liệu mẫu</button></div></section>`;
}
export function mount(el, signal) {
  el.innerHTML = view();
  el.addEventListener('submit', e => {
    e.preventDefault(); const form = e.target;
    const r = commit(d => saveProfile(d, Object.fromEntries(new FormData(form))));
    if (r.ok) toast('Đã lưu thông tin đám cưới.'); else form.querySelector('[data-err]').textContent = r.errors.weddingDate ?? r.errors.names ?? '';
  }, { signal });
  el.addEventListener('click', e => {
    if (e.target.closest('[data-export]')) { exportJSON(getData()); toast('Đã tạo tệp sao lưu.'); }
    if (e.target.closest('[data-blank]') && confirm('Xóa toàn bộ dữ liệu hiện tại và bắt đầu sổ trống?')) { startBlank(); el.innerHTML = view(); toast('Đã tạo sổ trống.'); }
    if (e.target.closest('[data-sample]') && confirm('Thay dữ liệu hiện tại bằng dữ liệu mẫu?')) { restoreSample(); el.innerHTML = view(); toast('Đã khôi phục dữ liệu mẫu.'); }
  }, { signal });
  el.addEventListener('change', async e => {
    const f = e.target.closest('[data-import]')?.files?.[0]; if (!f) return;
    const msg = el.querySelector('#import-msg'), r = await readImport(f); e.target.value = '';
    if (!r.ok) { msg.innerHTML = `Không thể nhập tệp này, dữ liệu hiện tại được giữ nguyên:<br>${r.errors.map(esc).join('<br>')}`; return; }
    if (confirm(`Thay dữ liệu hiện tại bằng tệp này (${r.data.tasks.length} việc)?`)) { replaceAll(r.data); el.innerHTML = view(); toast('Đã nhập dữ liệu từ tệp.'); }
  }, { signal });
}
