import { getData, commit } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveItem, saveRecord, addRecord } from '../../services/budgetService.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { dropdown, bindDropdowns, setDropdown } from '../../ui/dropdown.js';
import { ITEM_TYPES } from '../../models/budget.js';
import { esc, formatVND, todayStart } from '../../utils/format.js';

const field = (key, label, inner, hint = '') => `<div class="field" data-field="${key}">${inner.includes('data-dd') ? `<span class="field__l">${label}</span>` : `<label class="field__l" for="f-${key}">${label}</label>`}${inner}${hint ? `<p class="field__h">${hint}</p>` : ''}<p class="field__err" data-err="${key}" role="alert"></p></div>`;
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const showErrors = (form, errors) => {
  form.querySelectorAll('[data-err]').forEach(p => { p.textContent = ''; });
  Object.entries(errors).forEach(([k, m]) => { const p = form.querySelector(`[data-err="${k}"]`); if (p) p.textContent = m; });
  form.querySelector('[data-err]:not(:empty)')?.closest('.field')?.querySelector('input,button')?.focus();
};
/** Danh sách khoản cho dropdown ghi chép: đệm tên nhóm trước để dễ tìm khi nhiều khoản. */
const itemOptions = d => d.categories.flatMap(c => d.budget.items.filter(x => x.categoryId === c.id).map(x => ({ value: x.id, label: `${c.name} — ${x.name}` })));
const typeOptions = () => Object.entries(ITEM_TYPES).map(([value, label]) => ({ value, label }));

/** Sửa khoản (dùng cho cả bảng Ngân sách và Cài đặt). Không còn "thêm" ở đây — khoản mới tạo trong Cài đặt. */
export function openItemDialog({ id } = {}) {
  const d = getData(), it = id ? d.budget.items.find(x => x.id === id) : null;
  if (!it) return;
  const html = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">Sửa khoản</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    ${field('name', 'Tên khoản', `<input id="f-name" name="name" class="input" maxlength="120" autocomplete="off" required value="${esc(it.name)}" autofocus>`)}
    <div class="row2">${field('categoryId', 'Nhóm', dropdown({ name: 'categoryId', label: 'Nhóm', options: d.categories.map(c => ({ value: c.id, label: c.name })), value: it.categoryId }))}
    ${field('type', 'Loại', dropdown({ name: 'type', label: 'Loại', options: typeOptions(), value: it.type }))}</div>
    <div class="row2">${field('planned', 'Số tiền dự tính (₫)', `<input id="f-planned" name="planned" type="number" class="input" min="0" step="1000" inputmode="numeric" required value="${it.planned}">`)}
    ${field('date', 'Ngày dự kiến', `<input id="f-date" name="date" type="date" class="input" value="${esc(it.date)}">`)}</div>
    ${field('note', 'Ghi chú', `<textarea id="f-note" name="note" class="input" rows="2">${esc(it.note)}</textarea>`)}
    <footer class="sheet__foot"><button class="btn" type="submit">Lưu thay đổi</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(html, { label: 'Sửa khoản', onMount(dlg, signal) {
    const form = dlg.querySelector('form');
    bindDropdowns(form, signal);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(form));
      const r = commit(dd => saveItem(dd, input, id));
      if (!r.ok) return showErrors(form, r.errors);
      closeSheet(); toast('Đã lưu thay đổi.');
    }, { signal });
  } });
}

/** Thêm khoản mới — vào từ Cài đặt (nơi cấu hình danh mục ngân sách). */
export function openNewItemDialog() {
  const d = getData();
  const html = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">Thêm khoản</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    ${field('name', 'Tên khoản', `<input id="f-name" name="name" class="input" maxlength="120" autocomplete="off" required autofocus placeholder="ví dụ: Tiệc cưới, Hoàn tiền đặt cọc">`)}
    <div class="row2">${field('categoryId', 'Nhóm', dropdown({ name: 'categoryId', label: 'Nhóm', options: d.categories.map(c => ({ value: c.id, label: c.name })), value: d.categories[0]?.id ?? '' }))}
    ${field('type', 'Loại', dropdown({ name: 'type', label: 'Loại', options: typeOptions(), value: 'chi' }))}</div>
    <div class="row2">${field('planned', 'Số tiền dự tính (₫)', `<input id="f-planned" name="planned" type="number" class="input" min="0" step="1000" inputmode="numeric" required>`)}
    ${field('date', 'Ngày dự kiến', `<input id="f-date" name="date" type="date" class="input">`)}</div>
    ${field('note', 'Ghi chú', `<textarea id="f-note" name="note" class="input" rows="2"></textarea>`)}
    <footer class="sheet__foot"><button class="btn" type="submit">Thêm khoản</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(html, { label: 'Thêm khoản', onMount(dlg, signal) {
    const form = dlg.querySelector('form');
    bindDropdowns(form, signal);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(form));
      const r = commit(dd => saveItem(dd, input));
      if (!r.ok) return showErrors(form, r.errors);
      closeSheet(); toast(`Đã thêm khoản “${input.name.trim()}”.`);
    }, { signal });
  } });
}

/** Thêm/sửa ghi chép. Khi sửa, khoản cố định — hiện dạng nhãn, không cho chuyển khoản. */
export function openRecordDialog({ itemId = '', id = '' } = {}) {
  const d = getData();
  const rec = id ? d.budget.records.find(x => x.id === id) : null;
  if (id && !rec) return;
  const opts = itemOptions(d);
  if (!opts.length) return toast('Chưa có khoản nào — hãy thêm khoản trong Cài đặt trước.');
  const first = d.budget.items.find(x => x.id === (rec?.itemId || itemId || opts[0].value));
  const cat = d.categories.find(c => c.id === first?.categoryId);
  const itemField = rec
    ? `<input type="hidden" name="itemId" value="${esc(first?.id ?? '')}"><p class="eyebrow">${esc(cat?.name ?? '')} · ${esc(first?.name ?? '')}</p>`
    : field('itemId', 'Khoản', dropdown({ name: 'itemId', label: 'Khoản', options: opts, value: first?.id ?? '' }));
  const v = rec ?? {};
  const html = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">${id ? 'Sửa ghi chép' : 'Thêm ghi chép'}</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    ${itemField}
    ${field('type', 'Loại', dropdown({ name: 'type', label: 'Loại', options: typeOptions(), value: v.type ?? first?.type ?? 'chi' }))}
    ${field('amount', 'Số tiền (₫)', `<input id="f-amount" name="amount" type="number" class="input" min="0" step="1000" inputmode="numeric" required autofocus value="${v.amount ?? ''}">`)}
    ${field('date', 'Thời gian', `<input id="f-date" name="date" type="date" class="input" value="${esc(v.date ?? iso(todayStart()))}">`, 'Bỏ trống nếu chưa nhớ ngày.')}
    <div class="field" data-field="deferred"><label class="checkline"><input type="checkbox" name="deferred" data-def${v.deferred ? ' checked' : ''}><span>Trả sau — đã chốt nhưng chưa ra tiền</span></label></div>
    <div class="field" data-field="dueDate"${v.deferred ? '' : ' hidden'}><label class="field__l" for="f-dueDate">Ngày trả dự kiến</label><input id="f-dueDate" name="dueDate" type="date" class="input" value="${esc(v.dueDate ?? '')}"><p class="field__err" data-err="dueDate" role="alert"></p></div>
    ${field('note', 'Ghi chú', `<input id="f-note" name="note" class="input" maxlength="200" autocomplete="off" placeholder="ví dụ: đợt 1, đặt cọc" value="${esc(v.note ?? '')}">`)}
    <footer class="sheet__foot"><button class="btn" type="submit">${id ? 'Lưu thay đổi' : 'Ghi chép'}</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(html, { label: id ? 'Sửa ghi chép' : 'Thêm ghi chép', onMount(dlg, signal) {
    const form = dlg.querySelector('form');
    bindDropdowns(form, signal, (name, val) => {
      if (name !== 'itemId') return;
      const it = d.budget.items.find(x => x.id === val);
      setDropdown(form, 'type', it?.type ?? 'chi');
    });
    form.querySelector('[data-def]').addEventListener('change', e => {
      const box = form.querySelector('[data-field="dueDate"]');
      box.hidden = !e.target.checked; if (e.target.checked) box.querySelector('input').focus();
    }, { signal });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(form));
      const r = id ? commit(dd => saveRecord(dd, input, id)) : commit(dd => addRecord(dd, input));
      if (!r.ok) return showErrors(form, r.errors);
      closeSheet();
      toast(id ? 'Đã lưu ghi chép.' : `Đã ghi chép ${formatVND(Number(input.amount))} cho “${r.item.name}”.`);
    }, { signal });
  } });
}
