import { esc, daysBetween, formatDateShort } from '../../utils/format.js';
import { ownerLabel } from '../../models/task.js';
import { svg } from '../../ui/icons.js';

export function dueTag(t, today) {
  if (t.done) return '<span class="tag tag--done">Đã xong</span>';
  const n = daysBetween(t.due, today);
  if (n === null) return '<span class="tag">Chưa đặt hạn</span>';
  if (n < 0) return `<span class="tag tag--urgent">Quá hạn ${-n} ngày</span>`;
  if (n === 0) return '<span class="tag tag--urgent">Hạn hôm nay</span>';
  if (n <= 7) return `<span class="tag tag--urgent">Còn ${n} ngày</span>`;
  return `<span class="tag">Hạn ${formatDateShort(t.due)}</span>`;
}
/** ctx: { tasks, categories, today, kids?, open?, showCat?, showParent? } */
export function taskRow(t, ctx) {
  const { tasks, categories, today, kids = null, open = false } = ctx;
  const cat = categories.find(c => c.id === t.categoryId), par = ctx.showParent && t.parentId ? tasks.find(x => x.id === t.parentId) : null;
  const all = kids ? tasks.filter(k => k.parentId === t.id) : [], dn = all.filter(k => k.done).length;
  const lead = kids
    ? `<button type="button" class="twist ${open ? 'is-open' : ''}" data-toggle="${esc(t.id)}" aria-expanded="${open}" aria-controls="kids-${esc(t.id)}" aria-label="${open ? 'Thu gọn' : 'Mở'} việc con của “${esc(t.title)}”">${svg('chev')}</button>`
    : `<label class="hit"><input class="check" type="checkbox" data-id="${esc(t.id)}" ${t.done ? 'checked' : ''} aria-label="Hoàn thành: ${esc(t.title)}"></label>`;
  const count = kids ? `<span class="count" title="Việc con đã xong"><span class="sr">Đã xong </span>${dn}/${all.length}<span class="sr"> việc con</span></span>` : '';
  const meta = [kids ? count : '', dueTag(t, today), `<span>${esc(ownerLabel(t.owner))}</span>`,
    ctx.showCat && cat ? `<span>· ${esc(cat.name)}</span>` : '', par ? `<span>· thuộc “${esc(par.title)}”</span>` : '',
    ...(ctx.showTags ? (t.tags || []).map(g => `<span class="tag tag--plain">${esc(g)}</span>`) : [])].join('');
  return `<li class="task ${t.done ? 'is-done' : ''} ${kids ? 'is-parent' : ''}">${lead}
    <div class="task__body"><button type="button" class="task__t" data-open="${esc(t.id)}">${esc(t.title)}</button><div class="task__m">${meta}</div></div>
    ${kids ? `<ul class="task__kids" id="kids-${esc(t.id)}" ${open ? '' : 'hidden'}>${kids.map(k => taskRow(k, { ...ctx, kids: null, showCat: false })).join('')}</ul>` : ''}</li>`;
}
