import { getData, commit } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveTask, kidsOf } from '../../services/taskService.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { dropdown, bindDropdowns, setDropdown } from '../../ui/dropdown.js';
import { PRIORITIES, OWNERS } from '../../models/task.js';
import { esc } from '../../utils/format.js';

const toOpts = o => Object.entries(o).map(([value, label]) => ({ value, label }));
const field = (key, label, inner, hint = '') => `<div class="field" data-field="${key}">${inner.includes('data-dd') ? `<span class="field__l">${label}</span>` : `<label class="field__l" for="f-${key}">${label}</label>`}${inner}${hint ? `<p class="field__h">${hint}</p>` : ''}<p class="field__err" data-err="${key}" role="alert"></p></div>`;

/** Thêm mới (không tham số), sửa ({id}) hoặc thêm việc con ({parentId}). */
export function openTaskDialog({ id = null, parentId = '' } = {}) {
  const d = getData(), t = id ? d.tasks.find(x => x.id === id) : null;
  if (id && !t) return;
  const hasKids = !!t && kidsOf(d.tasks, id).length > 0, pid = t ? t.parentId || '' : parentId;
  const catOf = p => d.tasks.find(x => x.id === p)?.categoryId;
  const cat = pid ? catOf(pid) : (t?.categoryId ?? d.categories[0]?.id ?? '');
  const parents = [{ value: '', label: 'Không — đây là việc chính' }, ...d.tasks.filter(x => !x.parentId && x.id !== id).map(x => ({ value: x.id, label: x.title }))];
  const html = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">${t ? 'Sửa việc' : pid ? 'Thêm việc con' : 'Thêm việc mới'}</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    ${field('title', 'Tên việc', `<input id="f-title" name="title" class="input" maxlength="120" autocomplete="off" required value="${esc(t?.title ?? '')}" autofocus>`)}
    <div class="row2">${field('categoryId', 'Nhóm', dropdown({ name: 'categoryId', label: 'Nhóm', options: d.categories.map(c => ({ value: c.id, label: c.name })), value: cat, disabled: !!pid }))}
    ${field('parentId', 'Thuộc việc chính', dropdown({ name: 'parentId', label: 'Thuộc việc chính', options: parents, value: pid, disabled: hasKids }), hasKids ? 'Việc này đang có việc con nên giữ vai trò việc chính.' : '')}</div>
    <div class="row2">${field('due', 'Hạn', `<input id="f-due" name="due" type="date" class="input" value="${esc(t?.due ?? '')}">`)}
    ${field('priority', 'Ưu tiên', dropdown({ name: 'priority', label: 'Ưu tiên', options: toOpts(PRIORITIES), value: t?.priority ?? 'medium' }))}</div>
    ${field('owner', 'Phụ trách', dropdown({ name: 'owner', label: 'Phụ trách', options: [{ value: '', label: 'Chưa phân công' }, ...toOpts(OWNERS)], value: t?.owner ?? '' }))}
    ${field('tags', 'Thẻ', `<input id="f-tags" name="tags" class="input" autocomplete="off" placeholder="ví dụ: đặt cọc, gia đình" value="${esc((t?.tags ?? []).join(', '))}">`, 'Ngăn cách bằng dấu phẩy.')}
    ${field('note', 'Ghi chú', `<textarea id="f-note" name="note" class="input" rows="3">${esc(t?.note ?? '')}</textarea>`)}
    <footer class="sheet__foot"><button class="btn" type="submit">${t ? 'Lưu thay đổi' : 'Thêm việc'}</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer></form>`;
  openSheet(html, { label: t ? 'Sửa việc' : 'Thêm việc', onMount(dlg, signal) {
    const form = dlg.querySelector('form');
    bindDropdowns(form, signal, (name, v) => {
      if (name !== 'parentId') return;
      const c = catOf(v); setDropdown(form, 'categoryId', c ?? form.elements.categoryId.value, { disabled: !!v });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.querySelectorAll('[data-err]').forEach(p => { p.textContent = ''; });
      const input = Object.fromEntries(new FormData(form));
      const r = commit(dd => saveTask(dd, input, id));
      if (!r.ok) { Object.entries(r.errors).forEach(([k, m]) => { const p = form.querySelector(`[data-err="${k}"]`); if (p) p.textContent = m; });
        form.querySelector('[data-err]:not(:empty)')?.closest('.field')?.querySelector('input,button')?.focus(); return; }
      closeSheet(); toast(id ? 'Đã lưu thay đổi.' : 'Đã thêm việc mới.');
    }, { signal });
  } });
}
