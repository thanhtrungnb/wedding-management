/* Thông báo dạng popover (nằm trên cả hộp thoại), có thể kèm nút “Hoàn tác”. */
let timer; const el = () => document.getElementById('toast');
export function toast(msg, action = null) {
  const t = el(); t.replaceChildren(document.createTextNode(msg));
  if (action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'toast__act'; b.textContent = action.label; b.onclick = () => { hide(); action.run(); }; t.append(b); }
  /* Hộp thoại modal làm phần còn lại của trang “inert”, nên toast phải nằm trong hộp thoại khi nó đang mở. */
  if (t.matches(':popover-open')) t.hidePopover();
  (document.querySelector('dialog.sheet[open]') ?? document.body).append(t);
  t.showPopover?.();
  requestAnimationFrame(() => t.classList.add('is-on'));
  clearTimeout(timer); timer = setTimeout(hide, action ? 6000 : 2800);
}
export function hide() { const t = el(); t.classList.remove('is-on'); setTimeout(() => { if (!t.classList.contains('is-on') && t.matches(':popover-open')) t.hidePopover(); }, 300); }
