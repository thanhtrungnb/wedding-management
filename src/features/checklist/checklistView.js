import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { toggleDone } from '../../services/taskService.js';
import { progress } from '../../services/dashboard.js';
import { dropdown, bindDropdowns, setDropdown } from '../../ui/dropdown.js';
import { svg } from '../../ui/icons.js';
import { applyFilters, isFiltered, DEFAULT_FILTERS } from './filters.js';
import { taskRow } from './taskRow.js';
import { openTaskDialog } from './taskDialog.js';
import { openTaskDetail } from './taskDetail.js';
import { esc, todayStart } from '../../utils/format.js';

/* Trạng thái giao diện giữ lại khi chuyển trang: bộ lọc và các việc cha đang mở (mặc định: đóng). */
let filters = { ...DEFAULT_FILTERS };
const opened = new Set();

const OWNER_OPTS = [['all', 'Tất cả'], ['bride', 'Cô dâu'], ['groom', 'Chú rể'], ['both', 'Cả hai'], ['none', 'Chưa phân công']];
const STATUS_OPTS = [['all', 'Tất cả'], ['open', 'Đang làm'], ['done', 'Đã xong'], ['overdue', 'Quá hạn']];
const SORT_OPTS = [['due', 'Hạn gần nhất'], ['priority', 'Ưu tiên cao trước'], ['title', 'Tên A–Z']];
const o = a => a.map(([value, label]) => ({ value, label }));

const shell = () => `<header class="page-head"><div><p class="eyebrow">Chuẩn bị cưới</p><h1 class="page-title">Việc cần làm</h1><p class="lede" id="summary"></p></div>
  <button type="button" class="btn" data-add>${svg('plus')} Thêm việc</button></header>
  <div class="toolbar" role="search"><label class="search">${svg('search')}<span class="sr">Tìm việc</span>
    <input id="q" type="search" class="input" placeholder="Tìm theo tên, ghi chú, thẻ" autocomplete="off" value="${esc(filters.q)}"></label>
    ${dropdown({ name: 'f_owner', label: 'Phụ trách', options: o(OWNER_OPTS), value: filters.owner })}
    ${dropdown({ name: 'f_status', label: 'Trạng thái', options: o(STATUS_OPTS), value: filters.status })}
    ${dropdown({ name: 'f_sort', label: 'Sắp xếp', options: o(SORT_OPTS), value: filters.sort })}
    <button type="button" class="btn btn--quiet btn--sm" data-clear hidden>Xóa bộ lọc</button></div>
  <div id="list"></div>`;

function keyOf(el) {
  const d = el?.dataset; if (!d) return null;
  return d.toggle ? `[data-toggle="${d.toggle}"]` : d.open ? `[data-open="${d.open}"]` : d.id ? `.check[data-id="${d.id}"]` : null;
}
function renderList(el) {
  const data = getData(), today = todayStart(), key = keyOf(document.activeElement);
  const entries = applyFilters(data.tasks, filters, today), p = progress(data.tasks), on = isFiltered(filters);
  el.querySelector('#summary').textContent = data.tasks.length ? `Hai bạn đã hoàn thành ${p.done}/${p.total} đầu việc${on ? ` · đang hiển thị ${entries.length} việc chính` : ''}.` : '';
  el.querySelector('[data-clear]').hidden = !on;
  let html = '';
  data.categories.forEach(c => {
    const rows = entries.filter(e => e.task.categoryId === c.id); if (!rows.length) return;
    const cp = progress(data.tasks.filter(t => t.categoryId === c.id));
    html += `<section class="group" aria-label="${esc(c.name)}"><h2 class="group__t">${esc(c.name)}<span>${cp.done}/${cp.total} xong</span></h2><ul class="tasks">${rows.map(e => {
      const isParent = e.children.length > 0, open = isParent && (opened.has(e.task.id) || e.viaKids);
      return taskRow(e.task, { tasks: data.tasks, categories: data.categories, today, kids: isParent ? e.children : null, open, showTags: true });
    }).join('')}</ul></section>`;
  });
  if (!html) html = !data.tasks.length
    ? `<div class="empty"><h2 class="serif">Chưa có việc nào</h2><p>Bắt đầu bằng một việc nhỏ, ví dụ “Chốt ngân sách sơ bộ”. Hai bạn có thể thêm việc con để chia nhỏ từng bước.</p><button type="button" class="btn" data-add>Thêm việc đầu tiên</button></div>`
    : `<div class="empty"><h2 class="serif">Không có việc phù hợp</h2><p>Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p><button type="button" class="btn btn--quiet" data-clear>Xóa bộ lọc</button></div>`;
  el.querySelector('#list').innerHTML = html;
  if (key) el.querySelector(key)?.focus();
}
export function mount(el, signal) {
  el.innerHTML = shell(); const render = () => renderList(el); render();
  bindDropdowns(el.querySelector('.toolbar'), signal, (name, v) => { filters[name.slice(2)] = v; render(); });
  onChange(render, signal);
  el.addEventListener('input', e => { if (e.target.id === 'q') { filters.q = e.target.value; render(); } }, { signal });
  el.addEventListener('change', e => {
    const c = e.target.closest('.check'); if (!c) return;
    const r = commit(d => toggleDone(d, c.dataset.id), { undoable: true });
    if (r.ok) toast(`${r.done ? 'Đã xong' : 'Đã mở lại'}: ${r.title}`, { label: 'Hoàn tác', run: undo });
  }, { signal });
  el.addEventListener('click', e => {
    const tg = e.target.closest('[data-toggle]'); if (tg) { const id = tg.dataset.toggle; opened.has(id) ? opened.delete(id) : opened.add(id); return render(); }
    const op = e.target.closest('[data-open]'); if (op) return openTaskDetail(op.dataset.open);
    if (e.target.closest('[data-add]')) return openTaskDialog();
    if (e.target.closest('[data-clear]')) {
      filters = { ...DEFAULT_FILTERS }; el.querySelector('#q').value = '';
      Object.entries(filters).forEach(([k, v]) => k !== 'q' && setDropdown(el, 'f_' + k, v)); render();
    }
  }, { signal });
}
