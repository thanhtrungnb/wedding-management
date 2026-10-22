/* Một <dialog> dùng chung: bottom sheet trên điện thoại, hộp thoại bên phải trên máy tính. */
let dlg, ctrl, opener;
export function closeSheet() { dlg?.open && dlg.close(); }
export function openSheet(html, { label = '', onMount } = {}) {
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.className = 'sheet';
    dlg.addEventListener('mousedown', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) dlg.close(); });
    dlg.addEventListener('close', () => { ctrl?.abort(); if (opener?.isConnected) opener.focus(); });
    document.body.append(dlg);
  }
  ctrl?.abort(); ctrl = new AbortController();
  dlg.setAttribute('aria-label', label);
  let host = dlg.querySelector('[data-sheet-host]');
  if (!host) { host = document.createElement('div'); host.dataset.sheetHost = ''; dlg.prepend(host); }
  host.innerHTML = html;
  if (!dlg.open) { opener = document.activeElement; dlg.showModal(); }
  onMount?.(host, ctrl.signal);   // host: vùng nội dung; thông báo (toast) nằm cạnh để không bị xóa khi vẽ lại
}
