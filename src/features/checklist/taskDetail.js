import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { toggleDone, removeTask, kidsOf } from '../../services/taskService.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { openTaskDialog } from './taskDialog.js';
import { dueTag } from './taskRow.js';
import { PRIORITIES, ownerLabel } from '../../models/task.js';
import { esc, formatDateLong, todayStart, daysBetween } from '../../utils/format.js';

function statusText(t, kids, today) {
  if (kids.length) return `${kids.filter(k => k.done).length}/${kids.length} việc con đã xong`;
  if (t.done) return 'Đã xong';
  const n = daysBetween(t.due, today);
  return n !== null && n < 0 ? `Đang làm · quá hạn ${-n} ngày` : 'Đang làm';
}
function body(id) {
  const d = getData(), t = d.tasks.find(x => x.id === id); if (!t) return null;
  const today = todayStart(), kids = kidsOf(d.tasks, id), par = d.tasks.find(x => x.id === t.parentId), cat = d.categories.find(c => c.id === t.categoryId);
  return `<article class="sheet__body">
  <header class="sheet__head"><div><p class="eyebrow">${esc(cat?.name ?? '')}${par ? ` · thuộc “${esc(par.title)}”` : ''}</p><h2 class="sheet__title">${esc(t.title)}</h2></div>
    <button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
  <dl class="facts">
    <div><dt>Trạng thái</dt><dd>${esc(statusText(t, kids, today))}</dd></div>
    <div><dt>Hạn</dt><dd>${t.due ? esc(formatDateLong(t.due)) : 'Chưa đặt hạn'} ${dueTag(t, today)}</dd></div>
    <div><dt>Ưu tiên</dt><dd>${PRIORITIES[t.priority]}</dd></div>
    <div><dt>Phụ trách</dt><dd>${esc(ownerLabel(t.owner))}</dd></div>
    ${t.tags?.length ? `<div><dt>Thẻ</dt><dd>${t.tags.map(g => `<span class="tag tag--plain">${esc(g)}</span>`).join(' ')}</dd></div>` : ''}
  </dl>
  ${t.note ? `<p class="sheet__note">${esc(t.note)}</p>` : ''}
  ${kids.length ? `<h3 class="sheet__sub">Việc con</h3><ul class="tasks">${kids.map(k => `<li class="task ${k.done ? 'is-done' : ''}"><span class="task__lead" aria-hidden="true"></span><label class="hit"><input class="check" type="checkbox" data-id="${esc(k.id)}" ${k.done ? 'checked' : ''} aria-label="Hoàn thành: ${esc(k.title)}"></label><div class="task__body"><span class="task__t">${esc(k.title)}</span><div class="task__m">${dueTag(k, today)}<span>${esc(ownerLabel(k.owner))}</span></div></div></li>`).join('')}</ul>` : ''}
  <footer class="sheet__foot">
    <button type="button" class="btn" data-edit>Sửa</button>
    ${!kids.length && !par ? '' : ''}${!t.parentId ? '<button type="button" class="btn btn--quiet" data-addkid>Thêm việc con</button>' : ''}
    ${!t.parentId ? '<button type="button" class="btn btn--quiet" data-addkid>Thêm việc con</button>' : ''}
    <button type="button" class="btn btn--quiet" data-toggle-done>${t.done ? 'Mở lại việc' : 'Đánh dấu đã xong'}</button>
    <button type="button" class="btn btn--quiet btn--danger" data-del>Xóa</button></footer></article>`;
}
export function openTaskDetail(id) {
  const html = body(id); if (!html) return;
  openSheet(html, { label: 'Chi tiết công việc', onMount(dlg, signal) {
    const refresh = () => { const h = body(id); if (!h) return closeSheet(); dlg.innerHTML = h; };
    onChange(refresh, signal);
    dlg.addEventListener('change', e => {
      const c = e.target.closest('.check'); if (!c) return;
      const r = commit(d => toggleDone(d, c.dataset.id), { undoable: true });
      if (r.ok) toast(`${r.done ? 'Đã xong' : 'Đã mở lại'}: ${r.title}`, { label: 'Hoàn tác', run: undo });
    }, { signal });
    dlg.addEventListener('click', e => {
      if (e.target.closest('[data-edit]')) return openTaskDialog({ id });
      if (e.target.closest('[data-addkid]')) return openTaskDialog({ parentId: id });
      if (e.target.closest('[data-toggle-done]')) { const r = commit(d => toggleDone(d, id), { undoable: true }); if (r.ok) toast(`${r.done ? 'Đã xong' : 'Đã mở lại'}: ${r.title}`, { label: 'Hoàn tác', run: undo }); return; }
      if (e.target.closest('[data-del]')) {
        const r = commit(d => removeTask(d, id), { undoable: true }); closeSheet();
        if (r.ok) toast(`Đã xóa “${r.title}”${r.count > 1 ? ` và ${r.count - 1} việc con` : ''}`, { label: 'Hoàn tác', run: undo });
      }
    }, { signal });
  } });
}
