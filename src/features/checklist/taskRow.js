import { esc, daysBetween, formatDateShort } from '../../utils/format.js';
import { ownerLabel, PRIORITIES } from '../../models/task.js';
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
/** ctx: { tasks, categories, today, kids?, open?, showCat?, showParent?, to? } — `to` vẽ link "Xem chi tiết" trỏ sang trang việc (dùng ở Tổng quan). */
export function taskRow(t, ctx) {
  const { tasks, categories, today, kids = null, open = false } = ctx;
  const cat = categories.find(c => c.id === t.categoryId), par = ctx.showParent && t.parentId ? tasks.find(x => x.id === t.parentId) : null;
  const all = kids ? tasks.filter(k => k.parentId === t.id) : [], dn = all.filter(k => k.done).length;
  const dd = daysBetween(t.due, today), over = !t.done && dd !== null && dd < 0;
  /* Hàng việc 2 dòng: dòng 1 tiêu đề + tag ưu tiên, dòng 2 hạn/người/tiến độ, icon ghi chú cuối dòng.
     Cột xoay luôn dành sẵn (kể cả việc không có con) để nút tick thẳng hàng trên mọi cấp. */
  const lead = kids
    ? `<button type="button" class="twist ${open ? 'is-open' : ''}" data-toggle="${esc(t.id)}" aria-expanded="${open}" aria-controls="kids-${esc(t.id)}" aria-label="${open ? 'Thu gọn' : 'Mở'} việc con của “${esc(t.title)}”">${svg('chev')}</button>`
    : '<span class="task__lead" aria-hidden="true"></span>';
  const tick = `<label class="hit"><input class="check" type="checkbox" data-id="${esc(t.id)}" ${t.done ? 'checked' : ''} aria-label="Hoàn thành: ${esc(t.title)}"></label>`;
  /* Trung bình là mặc định nên không gắn tag — chỉ nổi Cao/Thấp để bớt nhiễu; việc đã xong không cần ưu tiên nữa. */
  const prio = !t.done && t.priority !== 'medium' ? `<span class="tag tag--prio-${t.priority}">${PRIORITIES[t.priority]}</span>` : '';
  const count = kids ? `<span class="count" title="Việc con đã xong"><span class="sr">Đã xong </span>${dn}/${all.length}<span class="sr"> việc con</span></span>` : '';
  const flat = t.note ? t.note.replace(/\s+/g, ' ').trim() : '';
  const note = flat ? `<span class="task__note" title="${esc(flat.length > 50 ? flat.slice(0, 50).trimEnd() + '…' : flat)}">${svg('note')}<span class="sr">Có ghi chú</span></span>` : '';
  const dateMeta = t.done ? (t.due ? `<span class="tag">Hạn ${formatDateShort(t.due)}</span>` : '') : dueTag(t, today);
  const meta = [dateMeta, `<span>${esc(ownerLabel(t.owner))}</span>`, kids ? count : '',
    ctx.showCat && cat ? `<span>· ${esc(cat.name)}</span>` : '', par ? `<span>· thuộc “${esc(par.title)}”</span>` : '',
    ...(ctx.showTags ? (t.tags || []).map(g => `<span class="tag tag--plain">${esc(g)}</span>`) : [])].join('');
  const go = !kids && ctx.to ? `<a class="task__go" href="#${esc(ctx.to)}">Xem chi tiết ${svg('chev')}</a>` : '';
  return `<li class="task ${t.done ? 'is-done' : ''} ${kids ? 'is-parent' : ''} ${over ? 'is-over' : ''} ${go ? 'is-go' : ''}"${kids ? ` data-row="${esc(t.id)}"` : ''}>${lead}${tick}
    <div class="task__body"><div class="task__l1"><button type="button" class="task__t" data-open="${esc(t.id)}">${esc(t.title)}</button>${prio}</div><div class="task__m">${meta}${note}</div></div>${go}
    ${kids ? `<ul class="task__kids" id="kids-${esc(t.id)}" ${open ? '' : 'hidden'}>${kids.map(k => taskRow(k, { ...ctx, kids: null, showCat: false })).join('')}</ul>` : ''}</li>`;
}
