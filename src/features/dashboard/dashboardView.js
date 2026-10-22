import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import * as D from '../../services/dashboard.js';
import { toggleDone } from '../../services/taskService.js';
import { importantEvents } from '../../config/schedule.js';
import { taskRow } from '../checklist/taskRow.js';
import { openTaskDetail } from '../checklist/taskDetail.js';
import { formatVND, formatVNDShort, formatDateLong, daysBetween, todayStart, parseDate, esc } from '../../utils/format.js';

const coupleTitle = c => c.bride && c.groom ? `${esc(c.bride)} <em class="serif">&amp;</em> ${esc(c.groom)}` : 'Sổ tay cưới của hai bạn';

/* Họa tiết hình khối: cặp nhẫn cưới giao nhau, viên kim cương phía trên — điểm nhấn cho khối đếm ngược. */
const rings = `<svg class="rings" viewBox="0 0 108 74" aria-hidden="true"><circle cx="38" cy="44" r="26"/><circle cx="70" cy="44" r="26"/><path d="M54 2l9 7-9 11-9-11z"/></svg>`;

const MN = ['thg 1','thg 2','thg 3','thg 4','thg 5','thg 6','thg 7','thg 8','thg 9','thg 10','thg 11','thg 12'];
/** Tách ngày thành số + nhãn tháng để vẽ cột ngày lớn của dòng thời gian. */
const dmy = s => { const d = parseDate(s); return d ? { d: d.getDate(), m: `${MN[d.getMonth()]} · ${d.getFullYear()}` } : null; };

function view() {
  const today = todayStart();
  const d = getData(), p = D.progress(d.tasks), b = D.budgetSummary(d.budget);
  const left = daysBetween(d.weddingDate, today), over = D.overdueCount(d.tasks, today), week = D.weekCount(d.tasks, today);
  const next = D.nextActions(d.tasks, today, 6);
  const keyEvents = importantEvents(d.events);
  const pctOf = v => b.planned ? Math.max(0, Math.min(100, v / b.planned * 100)) : 0;
  const hero = left === null ? 'Hãy chọn ngày cưới để bắt đầu hành trình đếm ngược' : left < 0 ? 'Chúc mừng hai bạn!' : left === 0 ? 'Hôm nay là ngày cưới của hai bạn' : '';
  const lede = !p.total
    ? 'Hãy thêm những đầu việc đầu tiên để cùng nhau khởi động hành trình chuẩn bị.'
    : over
      ? `Hai bạn đã hoàn tất ${p.done} trên ${p.total} đầu việc. Hiện còn ${over} việc đã quá hạn — rất mong hai bạn ưu tiên xử lý.`
      : `Hai bạn đã hoàn tất ${p.done} trên ${p.total} đầu việc. Mọi thứ đang từng bước nên trọn.`;
  const miles = keyEvents.map(m => {
    const n = daysBetween(m.date, today), x = dmy(m.date);
    const when = n === null ? '' : n < 0 ? '<span class="tag">Đã qua</span>' : n <= 14 ? `<span class="tag tag--urgent">Còn ${n} ngày</span>` : `<span class="tag">Còn ${n} ngày</span>`;
    return `<li class="${m.big ? 'is-big' : ''}"><time><b>${x ? x.d : '–'}</b><span>${x ? x.m : 'Chưa đặt ngày'}</span></time><span class="miles__dot" aria-hidden="true"></span><span class="miles__tx"><b><a class="section__link" href="#/lich-trinh">${esc(m.title)}</a></b>${when}</span></li>`;
  }).join('');
  return `
  <section class="hero rise" aria-labelledby="h1">
    <div class="hero__in">
      <div class="hero__body">
        ${d.isSample ? '<p class="hero__sample"><span class="tag tag--sample">Dữ liệu mẫu</span></p>' : ''}
        <h1 id="h1">${coupleTitle(d.couple)}</h1>
        <p class="hero__lede">${lede}</p></div>
      <div class="hero__count">${rings}
        ${left !== null && left > 0 ? `<div class="count__n">${left}</div><p class="count__l">ngày nữa đến ngày cưới</p>` : `<p class="count__l">${hero}</p>`}
        <p class="count__d">${esc(formatDateLong(d.weddingDate))}</p></div>
    </div>
  </section>

  <div class="three">
  <section class="panel" aria-labelledby="ht"><div class="section__head"><h2 id="ht">Hành trình chuẩn bị</h2></div>
    <div class="progress"><div class="progress__n">${p.pct}%</div><div><div class="bar" role="img" aria-label="Đã hoàn thành ${p.pct}% công việc"><i style="width:${p.pct}%;background:var(--forest)"></i></div><p class="fine">${p.done} trên ${p.total} đầu việc đã hoàn tất. Việc cha được tính theo tiến độ của các việc con.</p></div></div>
    <ul class="cats">${D.categoryProgress(d.tasks,d.categories).map(c=>`<li><span>${esc(c.name)}</span><span>${c.done}/${c.total}</span><div class="bar"><i style="width:${c.pct}%;background:var(--forest)"></i></div></li>`).join('')}</ul></section>
  <section class="panel" aria-labelledby="hb"><div class="section__head"><h2 id="hb">Ngân sách</h2><span class="eyebrow"><a class="section__link" href="#/ngan-sach">Chi tiết</a></span></div>
    <p class="eyebrow">Dự chi toàn bộ</p><p class="money">${esc(formatVNDShort(b.planned))}</p>
    <div class="bar stack" role="img" aria-label="Đã trả ${formatVND(b.paid)}, trả sau ${formatVND(b.debt)}, còn lại trong dự chi ${formatVND(Math.max(0, b.planned - b.chi))}">
      <i style="width:${pctOf(b.paid)}%;background:var(--forest)"></i><i style="width:${pctOf(b.debt)}%;background:var(--brass)"></i><i style="width:${pctOf(Math.max(0, b.planned - b.chi))}%;background:var(--line-strong)"></i></div>
    <ul class="legend"><li><span class="sw" style="background:var(--forest)"></span>Đã trả<b>${esc(formatVNDShort(b.paid))}</b></li>
      <li><span class="sw" style="background:var(--brass)"></span>Trả sau<b>${esc(formatVNDShort(b.debt))}</b></li>
      <li><span class="sw" style="background:var(--line-strong)"></span>Còn lại dự chi<b>${esc(formatVNDShort(Math.max(0, b.planned - b.chi)))}</b></li>
      <li><span></span>Độ lệch<b>${esc(b.variance === 0 ? '0 ₫' : (b.variance > 0 ? '+' : '−') + formatVNDShort(Math.abs(b.variance)))}</b></li>
      <li><span></span>Đã thu<b>${esc(formatVNDShort(b.thu))}</b></li></ul>
    <p class="fine">Độ lệch = thực chi − dự chi. Thực chi ghi dần theo từng lần trả; khoản “trả sau” đã tính vào thực chi nhưng chưa ra tiền.</p></section>
  <section class="panel" aria-labelledby="hm"><div class="section__head"><h2 id="hm">Mốc quan trọng</h2></div>
    ${keyEvents.length ? `<ol class="miles">${miles}</ol>` : '<p>Chưa có sự kiện quan trọng.</p>'}</section>
  </div>

  <section class="panel band" aria-labelledby="hv"><div class="section__head"><h2 id="hv">Danh sách việc cần làm</h2><span class="eyebrow">${week} việc trong 7 ngày tới · <a class="section__link" href="#/viec">Xem thêm</a></span></div>
    ${next.length?`<ul class="tasks tasks--grid">${next.map(t=>taskRow(t,{tasks:d.tasks,categories:d.categories,today,showCat:true,showParent:true,to:'/viec'})).join('')}</ul>`:'<p>Hiện không có việc nào đang chờ xử lý.</p>'}</section>`;
}


export function mount(el, signal) {
  const render = () => { el.innerHTML = view(); };
  render(); onChange(render, signal);
  const done = id => { const r = commit(d => toggleDone(d, id), { undoable: true }); if (r.ok) toast(`${r.done ? 'Đã xong' : 'Đã mở lại'}: ${r.title}`, { label: 'Hoàn tác', run: undo }); };
  el.addEventListener('change', e => { const c = e.target.closest('.check'); if (c) done(c.dataset.id); }, { signal });
  el.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) openTaskDetail(o.dataset.open);
  }, { signal });
}
