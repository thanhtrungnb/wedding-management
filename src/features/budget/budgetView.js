import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import * as D from '../../services/dashboard.js';
import { removeItem, removeRecord, recordsOf } from '../../services/budgetService.js';
import { svg } from '../../ui/icons.js';
import { openRecordDialog, openItemDialog, openNewItemDialog } from './budgetDialogs.js';
import { esc, formatVND, formatVNDShort, formatDateShort } from '../../utils/format.js';

/* Trạng thái đóng/mở của hàng master — chỉ giữ trong phiên làm việc. */
const collapsed = new Set();

const shell = () => `<header class="page-head"><div><h1 class="page-title">Ngân sách</h1><p class="lede" id="summary"></p></div></header>
  <div id="stats"></div>
  <div class="btable-bar"><button type="button" class="btn" data-add-record>${svg('plus')} Thêm ghi chép</button><button type="button" class="btn btn--quiet" data-add-item>${svg('plus')} Thêm khoản</button></div>
  <div id="table"></div>`;

function keyOf(el) {
  const d = el?.dataset; if (!d) return null;
  if (d.edit) return `[data-edit="${d.edit}"]`;
  if (d.del) return `[data-del="${d.del}"]`;
  if (d.editRec) return `[data-edit-rec="${d.editRec}"]`;
  if (d.delRec) return `[data-del-rec="${d.delRec}"]`;
  return d.row ? `.brow[data-row="${d.row}"] .brow__t` : null;
}

/* Dải tổng hợp: thu xanh, chi đỏ — màu chỉ áp cho số tiền. */
function renderStats(el, b) {
  const leap = b.variance === 0 ? '0 ₫' : (b.variance > 0 ? '+' : '−') + formatVNDShort(Math.abs(b.variance));
  const bal = b.balance === 0 ? '0 ₫' : (b.balance > 0 ? '+' : '−') + formatVNDShort(Math.abs(b.balance));
  el.querySelector('#stats').innerHTML = `<div class="bstats">
    <div class="bstat"><p class="eyebrow">Dự chi</p><p class="bstat__v t-red">${esc(formatVNDShort(b.planned))}</p></div>
    <div class="bstat"><p class="eyebrow">Thực chi</p><p class="bstat__v t-red">${esc(formatVNDShort(b.chi))}</p></div>
    <div class="bstat"><p class="eyebrow">Độ lệch</p><p class="bstat__v ${b.variance > 0 ? 't-red' : b.variance < 0 ? 't-green' : ''}">${esc(leap)}</p></div>
    <div class="bstat"><p class="eyebrow">Đã thu</p><p class="bstat__v t-green">${esc(formatVNDShort(b.thu))}</p></div>
    <div class="bstat"><p class="eyebrow">Còn nợ</p><p class="bstat__v t-warn">${esc(formatVNDShort(b.debt))}</p></div>
    <div class="bstat"><p class="eyebrow">Số dư</p><p class="bstat__v ${b.balance > 0 ? 't-green' : b.balance < 0 ? 't-red' : ''}">${esc(bal)}</p></div></div>`;
}

const leapCell = v => v === 0 ? '<span class="bleap">0 ₫</span>'
  : v > 0 ? `<span class="bleap t-red">+${esc(formatVNDShort(v))}</span>`
  : `<span class="bleap t-green">−${esc(formatVNDShort(-v))}</span>`;

const byDate = (a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31');
const hid = catId => collapsed.has(catId) ? ' hidden' : '';

/* Hàng ghi chép: tiêu đề = tên khoản, ghi chú nằm dưới; bấm tên để sửa ghi chép. */
function recordRow(r, it) {
  const cls = r.type === 'thu' ? 't-green' : 't-red';
  return `<tr class="brow" data-cat="${esc(it.categoryId)}" data-row="${esc(r.id)}"${hid(it.categoryId)}>
    <td class="brow__name"><button type="button" class="brow__t" data-edit-rec="${esc(r.id)}">${esc(it.name)}</button>${r.note ? `<span class="brow__note">${esc(r.note)}</span>` : ''}</td>
    <td class="brow__date">${r.date ? esc(formatDateShort(r.date)) : '—'}</td>
    <td class="num">—</td>
    <td class="num ${cls}">${esc(formatVNDShort(r.amount))}</td>
    <td class="num">—</td>
    <td class="num">${r.deferred ? (r.dueDate ? esc(formatDateShort(r.dueDate)) : '<i>chưa rõ ngày</i>') : ''}</td>
    <td class="brow__act"><button type="button" class="ibtn" data-edit-rec="${esc(r.id)}" aria-label="Sửa ghi chép">${svg('pencil')}</button><button type="button" class="ibtn ibtn--danger" data-del-rec="${esc(r.id)}" aria-label="Xóa ghi chép">${svg('trash')}</button></td></tr>`;
}

/* Khoản chưa có ghi chép vẫn chiếm một hàng để thấy dự tính — bấm tên để sửa khoản. */
function itemRow(it) {
  const cls = it.type === 'thu' ? 't-green' : 't-red';
  return `<tr class="brow brow--item" data-cat="${esc(it.categoryId)}" data-row="${esc(it.id)}"${hid(it.categoryId)}>
    <td class="brow__name"><button type="button" class="brow__t" data-edit="${esc(it.id)}">${esc(it.name)}</button>${it.type === 'thu' ? ' <span class="tag tag--done">Thu</span>' : ''}${it.note ? `<span class="brow__note">${esc(it.note)}</span>` : ''}</td>
    <td class="brow__date">${it.date ? esc(formatDateShort(it.date)) : '—'}</td>
    <td class="num ${cls}">${esc(formatVNDShort(it.planned))}</td>
    <td class="num">—</td>
    <td class="num">—</td>
    <td class="num"></td>
    <td class="brow__act"><button type="button" class="ibtn" data-edit="${esc(it.id)}" aria-label="Sửa khoản ${esc(it.name)}">${svg('pencil')}</button><button type="button" class="ibtn ibtn--danger" data-del="${esc(it.id)}" aria-label="Xóa khoản ${esc(it.name)}">${svg('trash')}</button></td></tr>`;
}

function renderTable(el, data) {
  const groups = D.budgetByCategory(data.budget, data.categories);
  if (!groups.length) {
    el.querySelector('#table').innerHTML = `<div class="empty"><h2 class="serif">Chưa có khoản nào</h2><p>Bấm “Thêm khoản” để tạo khoản thu/chi đầu tiên, sau đó ghi chép từng lần chi tiêu.</p></div>`;
    return;
  }
  const rows = groups.map(g => {
    const items = data.budget.items.filter(x => x.categoryId === g.id);
    const due = g.debtDue ? esc(formatDateShort(g.debtDue)) : g.debt ? '<i>chưa rõ ngày</i>' : '';
    const open = !collapsed.has(g.id);
    const master = `<tr class="brow brow--master${open ? '' : ' is-collapsed'}" data-toggle="${esc(g.id)}" aria-expanded="${open}">
      <th scope="row" colspan="2"><span class="brow__chev">${svg('chev')}</span>${esc(g.name)}</th>
      <td class="num">${esc(formatVNDShort(g.planned))}</td><td class="num">${esc(formatVNDShort(g.actual))}</td>
      <td class="num">${leapCell(g.variance)}</td><td class="num">${due}</td><td class="brow__act"></td></tr>`;
    const details = items.flatMap(it => {
      const rs = recordsOf(data.budget, it.id).slice().sort(byDate);
      return rs.length ? rs.map(r => recordRow(r, it)) : [itemRow(it)];
    }).join('');
    return master + details;
  }).join('');
  el.querySelector('#table').innerHTML = `<div class="btable-wrap"><table class="btable">
    <thead><tr><th class="btable__h-name">Tiêu đề</th><th>Thời gian</th><th class="btable__h-num">Dự tính</th><th class="btable__h-num">Thực tế</th><th class="btable__h-num">Độ lệch</th><th>Ngày trả nợ</th><th><span class="sr">Thao tác</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="fine">Hàng đậm là tổng nhóm — bấm để đóng/mở. Mỗi hàng bên dưới là một ghi chép (thu xanh, chi đỏ); khoản chưa có ghi chép hiện cùng dự tính của nó. Bấm tên để sửa.</p>`;
}

function renderAll(el) {
  const data = getData(), key = keyOf(document.activeElement);
  const b = D.budgetSummary(data.budget);
  el.querySelector('#summary').textContent = data.budget.items.length
    ? `Dự chi ${formatVND(b.planned)} · thực chi ${formatVND(b.chi)} · đã thu ${formatVND(b.thu)}.`
    : '';
  renderStats(el, b); renderTable(el, data);
  if (key) el.querySelector(key)?.focus();
}

export function mount(el, signal) {
  el.innerHTML = `<div class="wrap">${shell()}</div>`;
  const render = () => renderAll(el);
  render(); onChange(render, signal);
  el.addEventListener('click', e => {
    /* Đóng/mở nhóm: sửa thẳng DOM để không mất vị trí cuộn của bảng. */
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const id = tg.dataset.toggle, wasCollapsed = collapsed.has(id);
      wasCollapsed ? collapsed.delete(id) : collapsed.add(id);
      tg.classList.toggle('is-collapsed', !wasCollapsed);
      tg.setAttribute('aria-expanded', String(wasCollapsed));
      el.querySelectorAll(`.brow[data-cat="${CSS.escape(id)}"]`).forEach(r => { r.hidden = !wasCollapsed; });
      return;
    }
    const er = e.target.closest('[data-edit-rec]'); if (er) return openRecordDialog({ id: er.dataset.editRec });
    const dr = e.target.closest('[data-del-rec]');
    if (dr) {
      const r = commit(d => removeRecord(d, dr.dataset.delRec), { undoable: true });
      if (r.ok) toast(`Đã xóa ghi chép ${formatVND(r.amount)}.`, { label: 'Hoàn tác', run: undo });
      return;
    }
    const ed = e.target.closest('[data-edit]'); if (ed) return openItemDialog({ id: ed.dataset.edit });
    const del = e.target.closest('[data-del]');
    if (del) {
      const r = commit(d => removeItem(d, del.dataset.del), { undoable: true });
      if (r.ok) toast(`Đã xóa khoản “${r.name}”.`, { label: 'Hoàn tác', run: undo });
      return;
    }
    if (e.target.closest('[data-add-item]')) return openNewItemDialog();
    if (e.target.closest('[data-add-record]')) return openRecordDialog();
  }, { signal });
}
