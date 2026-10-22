import { getData, commit, undo, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { removeEvent, toggleImportantEvent } from '../../services/scheduleService.js';
import { SCHEDULE_CONFIG } from '../../config/schedule.js';
import { openEventDialog } from './scheduleDialog.js';
import { svg } from '../../ui/icons.js';
import { esc, formatDateLong, formatDateShort, daysBetween, todayStart } from '../../utils/format.js';

const star = filled => `<svg class="star-icon${filled ? ' is-filled' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.75 5.58 6.16.9-4.45 4.33 1.05 6.13L12 17.05l-5.51 2.9 1.05-6.14-4.45-4.33 6.16-.9z"/></svg>`;

const types = { ceremony: 'Nghi lễ', meeting: 'Gia đình', booking: 'Lịch hẹn', other: 'Khác' };
const dateTime = (a, b) => a.date.localeCompare(b.date) || (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title, 'vi');
const shell = () => `<header class="page-head"><div><p class="eyebrow">Hành trình của hai bạn</p><h1 class="page-title">Lịch trình</h1><p class="lede">Những ngày đáng nhớ, từ chuẩn bị đến ngày chung đôi.</p></div></header>
  <section class="schedule-intro"><div class="schedule-intro__sun" aria-hidden="true">✳</div><div><p class="eyebrow">Ngày cưới</p><p class="schedule-intro__date" id="wedding-date"></p><p class="fine" id="schedule-count"></p></div></section>
  <div class="schedule-toolbar"><button class="btn" type="button" data-add>${svg('plus')} Thêm sự kiện</button></div>
  <section class="schedule-list" id="schedule-list" aria-label="Các sự kiện theo thời gian"></section>`;

function timeline(data) {
  const events = [...data.events].sort(dateTime);
  if (!events.length) return '<div class="schedule-empty"><span aria-hidden="true">✿</span><h2 class="serif">Hành trình bắt đầu từ đây</h2><p>Thêm lịch hẹn, nghi lễ hoặc những dấu mốc hai bạn muốn ghi nhớ.</p></div>';
  const today = todayStart(), importantCount = data.events.filter(event => event.important).length;
  return `<ol class="timeline">${events.map((event, index) => {
    const days = daysBetween(event.date, today), state = days === null ? '' : days < 0 ? 'is-past' : days === 0 ? 'is-today' : 'is-upcoming';
    const when = days === null ? '' : days < 0 ? 'Đã diễn ra' : days === 0 ? 'Hôm nay' : `Còn ${days} ngày`;
    const details = `<div class="timeline__top"><span class="schedule-tag schedule-tag--${esc(event.type)}">${esc(types[event.type] || types.other)}</span><span class="timeline__when">${esc(when)}</span></div>
      <div class="timeline__date"><span>${esc(formatDateLong(event.date))}</span>${event.time ? `<time>${esc(event.time)}</time>` : ''}</div>
      ${event.location ? `<p class="timeline__meta">${svg('pin')} ${esc(event.location)}</p>` : ''}${event.note ? `<p class="timeline__note">${esc(event.note)}</p>` : ''}`;
    const timeTitle = days < 0 ? `<span class="timeline__past-date">${esc(formatDateShort(event.date))}${event.time ? ` · ${esc(event.time)}` : ''}</span>` : '';
    return `<li class="timeline__item ${state} ${index % 2 ? 'is-left' : 'is-right'}" style="--i:${Math.min(index, 12)}">
      <article class="timeline__card${days < 0 ? ' is-collapsed' : ''}" data-event-card>
        <button class="timeline__star${event.important ? ' is-active' : ''}" type="button" data-important="${esc(event.id)}" aria-pressed="${!!event.important}" aria-label="${event.important ? 'Bỏ dấu sự kiện quan trọng' : `Đánh dấu quan trọng (${importantCount}/${SCHEDULE_CONFIG.maxImportantEvents})`}" title="${event.important ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}">${star(!!event.important)}</button>
        <div class="timeline__heading"><button class="timeline__toggle" type="button" aria-expanded="${days < 0 ? 'false' : 'true'}" aria-label="${days < 0 ? 'Hiện' : 'Thu gọn'} chi tiết ${esc(event.title)}"><span class="timeline__title">${esc(event.title)}</span>${days < 0 ? timeTitle : ''}</button></div>
        <div class="timeline__details"${days < 0 ? ' hidden' : ''}>${details}<div class="timeline__actions"><button class="ibtn" type="button" data-edit="${esc(event.id)}" aria-label="Sửa ${esc(event.title)}">${svg('pencil')}</button><button class="ibtn ibtn--danger" type="button" data-delete="${esc(event.id)}" aria-label="Xóa ${esc(event.title)}">${svg('trash')}</button></div></div>
      </article><span class="timeline__marker ${days < 0 ? 'is-checked' : ''}" aria-hidden="true"><span>${days < 0 ? '✓' : ''}</span></span><span class="timeline__spacer" aria-hidden="true"></span>
    </li>`;
  }).join('')}</ol>`;
}

function render(el) {
  const data = getData();
  el.querySelector('#wedding-date').textContent = data.weddingDate ? formatDateLong(data.weddingDate) : 'Chưa đặt ngày cưới';
  el.querySelector('#schedule-count').textContent = `${data.events.length} sự kiện trong hành trình`;
  const list = el.querySelector('#schedule-list');
  list.innerHTML = timeline(data);
}

export function mount(el, signal) {
  el.innerHTML = `<div class="wrap schedule-page">${shell()}</div>`;
  render(el); onChange(() => render(el), signal);
  el.addEventListener('click', e => {
    const important = e.target.closest('[data-important]');
    if (important) {
      const r = commit(d => toggleImportantEvent(d, important.dataset.important));
      if (!r.ok && r.limit) toast(`Tối đa ${r.limit} sự kiện quan trọng. Bỏ sao sự kiện khác trước.`);
      else if (r.ok) toast(r.important ? `Đã thêm Mốc quan trọng (${getData().events.filter(event => event.important).length}/${SCHEDULE_CONFIG.maxImportantEvents}).` : 'Đã bỏ khỏi Mốc quan trọng.');
      return;
    }
    const toggle = e.target.closest('.timeline__toggle');
    if (toggle) {
      const card = toggle.closest('[data-event-card]'), expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      card.classList.toggle('is-collapsed', expanded);
      card.querySelector('.timeline__details').hidden = expanded;
      toggle.setAttribute('aria-label', `${expanded ? 'Hiện' : 'Thu gọn'} chi tiết ${toggle.querySelector('span').textContent}`);
      return;
    }
    if (e.target.closest('[data-add]')) return openEventDialog();
    const edit = e.target.closest('[data-edit]'); if (edit) return openEventDialog({ id: edit.dataset.edit });
    const del = e.target.closest('[data-delete]'); if (!del) return;
    const r = commit(d => removeEvent(d, del.dataset.delete), { undoable: true });
    if (r.ok) toast(`Đã xóa sự kiện “${r.title}”.`, { label: 'Hoàn tác', run: undo });
  }, { signal });
}
