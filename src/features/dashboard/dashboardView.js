import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import * as D from '../../services/dashboard.js';
import { toggleDone } from '../../services/taskService.js';
import { taskRow } from '../checklist/taskRow.js';
import { openTaskDetail } from '../checklist/taskDetail.js';
import { formatVND, formatVNDShort, formatDate, formatDateLong, daysBetween, todayStart, esc } from '../../utils/format.js';

const coupleTitle = c => c.bride && c.groom ? `${esc(c.bride)} <em class="serif">&amp;</em> ${esc(c.groom)}` : 'Sổ tay cưới của hai bạn';

function view() {
  const today = todayStart();
  const d = getData(), p = D.progress(d.tasks), b = D.budgetSummary(d.budget);
  const left = daysBetween(d.weddingDate, today), over = D.overdueCount(d.tasks, today), week = D.weekCount(d.tasks, today);
  const next = D.nextActions(d.tasks, today, 5), top = next[0], topPar = top && D.parentOf(d.tasks, top);
  const pctOf = v => b.planned ? Math.max(0, v / Math.max(b.planned, b.committed) * 100) : 0;
  const hero = left === null ? 'Hãy đặt ngày cưới để bắt đầu đếm ngược' : left < 0 ? 'Chúc mừng hai bạn!' : left === 0 ? 'Hôm nay là ngày cưới của hai bạn' : '';
  const lede = !p.total ? 'Hãy thêm vài đầu việc đầu tiên — mình cùng bắt đầu từng bước nhé.' : over
    ? `Hai bạn đã hoàn thành ${p.done}/${p.total} đầu việc. Có ${over} việc đã qua hạn — mình cùng xử lý trước nhé.`
    : `Hai bạn đã hoàn thành ${p.done}/${p.total} đầu việc. Mọi thứ đang dần thành hình.`;
  return `
  <section class="hero rise" aria-labelledby="h1"><div>
    ${d.isSample ? '<p class="eyebrow"><span class="tag tag--sample">Dữ liệu mẫu</span></p>' : '<p class="eyebrow">Sổ tay cưới</p>'}
    <h1 id="h1">${coupleTitle(d.couple)}</h1>
    <p class="hero__lede">${lede}</p></div>
    <div class="countdown">${left!==null&&left>0?`<div class="countdown__n">${left}</div><p class="countdown__l">ngày nữa đến ngày cưới</p>`:`<p class="countdown__l">${hero}</p>`}<p class="countdown__d">${esc(formatDateLong(d.weddingDate))}</p></div>
  </section>

  <section class="next rise" aria-labelledby="hn">${top?`<div><p class="eyebrow">Việc nên làm tiếp</p><h2 id="hn">${esc(top.title)}</h2>
    <p>${esc(top.note || (topPar ? `Một bước trong “${topPar.title}”.` : 'Hoàn thành việc này sẽ giúp các bước sau thuận lợi hơn.'))}</p></div>
    <div class="next__why"><p>${top.days<0?`Việc này đã qua hạn ${-top.days} ngày. Chốt sớm sẽ giúp hai bạn yên tâm hơn cho các bước tiếp theo.`:`Hạn ${esc(formatDate(top.due))}. Đây là việc gần hạn nhất trong danh sách.`}</p>
    <button class="btn" data-done="${esc(top.id)}">Đánh dấu đã xong</button></div>`
    :`<div><p class="eyebrow">Việc nên làm tiếp</p><h2 id="hn">Hai bạn đã xong hết các việc hiện có</h2><p>Hãy thêm việc mới khi sẵn sàng.</p></div>`}</section>

  <div class="two">
  <section class="section" aria-labelledby="hp"><div class="section__head"><h2 id="hp">Việc sắp tới</h2><span class="eyebrow">${week} việc trong 7 ngày tới</span></div>
    ${next.length?`<ul class="tasks">${next.map(t=>taskRow(t,{tasks:d.tasks,categories:d.categories,today,showCat:true,showParent:true})).join('')}</ul>`:'<p>Chưa có việc nào đang chờ.</p>'}</section>
  <section class="section" aria-labelledby="hm"><div class="section__head"><h2 id="hm">Mốc quan trọng</h2></div>
    <ol class="miles">${d.milestones.map(m=>{const n=daysBetween(m.date,today);return `<li class="${m.big?'is-big':''}"><time>${esc(formatDate(m.date))}</time><b>${esc(m.title)}</b><span class="eyebrow">${n===null?'':n<0?'Đã qua':`Còn ${n} ngày`}</span></li>`}).join('')}</ol></section></div>

  <div class="two">
  <section class="section" aria-labelledby="ht"><div class="section__head"><h2 id="ht">Hành trình chuẩn bị</h2></div>
    <div class="progress"><div class="progress__n">${p.pct}%</div><div><div class="bar" role="img" aria-label="Đã hoàn thành ${p.pct}% công việc"><i style="width:${p.pct}%;background:var(--forest)"></i></div><p class="fine">${p.done} trên ${p.total} đầu việc đã xong. Việc cha được tính theo các việc con.</p></div></div>
    <ul class="cats">${D.categoryProgress(d.tasks,d.categories).map(c=>`<li><span>${esc(c.name)}</span><span>${c.done}/${c.total}</span><div class="bar"><i style="width:${c.pct}%;background:var(--forest)"></i></div></li>`).join('')}</ul></section>
  <section class="section" aria-labelledby="hb"><div class="section__head"><h2 id="hb">Ngân sách</h2></div>
    <p class="eyebrow">Dự kiến chi</p><p class="money">${esc(formatVNDShort(b.planned))}</p>
    <div class="bar stack" role="img" aria-label="Đã trả ${formatVND(b.paid)}, còn phải trả ${formatVND(b.outstanding)}, chưa chốt ${formatVND(b.unbooked)}">
      <i style="width:${pctOf(b.paid)}%;background:var(--forest)"></i><i style="width:${pctOf(b.outstanding)}%;background:var(--brass)"></i><i style="width:${pctOf(b.unbooked)}%;background:var(--line-strong)"></i></div>
    <ul class="legend"><li><span class="sw" style="background:var(--forest)"></span>Đã thanh toán<b>${formatVND(b.paid)}</b></li>
    <li><span class="sw" style="background:var(--brass)"></span>Đã chốt, còn phải trả<b>${formatVND(b.outstanding)}</b></li>
    <li><span class="sw" style="background:var(--line-strong)"></span>Dự kiến, chưa chốt<b>${formatVND(b.unbooked)}</b></li>
    <li><span></span>Nguồn thu dự kiến<b>${formatVND(b.income)}</b></li></ul>
    <p class="fine">Số liệu ước tính tách riêng với chi phí thực tế. Trang Ngân sách chi tiết sắp có.</p></section></div>`;
}


export function mount(el, signal) {
  const render = () => { el.innerHTML = view(); };
  render(); onChange(render, signal);
  const done = id => { const r = commit(d => toggleDone(d, id), { undoable: true }); if (r.ok) toast(`${r.done ? 'Đã xong' : 'Đã mở lại'}: ${r.title}`, { label: 'Hoàn tác', run: undo }); };
  el.addEventListener('change', e => { const c = e.target.closest('.check'); if (c) done(c.dataset.id); }, { signal });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-done]'); if (b) return done(b.dataset.done);
    const o = e.target.closest('[data-open]'); if (o) openTaskDetail(o.dataset.open);
  }, { signal });
}
