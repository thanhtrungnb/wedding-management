import { getData, commit } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { saveEvent } from '../../services/scheduleService.js';
import { openSheet, closeSheet } from '../../ui/sheet.js';
import { esc } from '../../utils/format.js';

const types = { ceremony: 'Nghi lễ', meeting: 'Gia đình', booking: 'Lịch hẹn', other: 'Khác' };
const field = (key, label, input) => `<div class="field"><label class="field__l" for="event-${key}">${label}</label>${input}<p class="field__err" data-err="${key}" role="alert"></p></div>`;

export function openEventDialog({ id = null } = {}) {
  const event = id ? getData().events.find(x => x.id === id) : null;
  if (id && !event) return;
  const form = `<form class="sheet__body" novalidate>
    <header class="sheet__head"><h2 class="sheet__title">${event ? 'Sửa sự kiện' : 'Thêm sự kiện'}</h2><button type="button" class="sheet__x" data-close aria-label="Đóng">×</button></header>
    ${field('title', 'Tên sự kiện', `<input id="event-title" name="title" class="input" maxlength="120" required autocomplete="off" value="${esc(event?.title ?? '')}" autofocus>`)}
    <div class="row2">${field('date', 'Ngày', `<input id="event-date" name="date" type="date" class="input" required value="${esc(event?.date ?? '')}">`)}
    ${field('time', 'Giờ', `<input id="event-time" name="time" type="time" class="input" value="${esc(event?.time ?? '')}">`)}</div>
    ${field('type', 'Loại sự kiện', `<select id="event-type" name="type" class="input">${Object.entries(types).map(([value, label]) => `<option value="${value}" ${event?.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select>`)}
    ${field('location', 'Địa điểm', `<input id="event-location" name="location" class="input" maxlength="120" value="${esc(event?.location ?? '')}">`)}
    ${field('note', 'Ghi chú', `<textarea id="event-note" name="note" class="input" rows="3" maxlength="500">${esc(event?.note ?? '')}</textarea>`)}
    <footer class="sheet__foot"><button class="btn" type="submit">${event ? 'Lưu thay đổi' : 'Thêm sự kiện'}</button><button class="btn btn--quiet" type="button" data-close>Hủy</button></footer>
  </form>`;
  openSheet(form, { label: event ? 'Sửa sự kiện' : 'Thêm sự kiện', onMount(host, signal) {
    host.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const target = e.currentTarget;
      target.querySelectorAll('[data-err]').forEach(x => { x.textContent = ''; });
      const result = commit(d => saveEvent(d, Object.fromEntries(new FormData(target)), id));
      if (!result.ok) {
        Object.entries(result.errors).forEach(([key, message]) => { const error = target.querySelector(`[data-err="${key}"]`); if (error) error.textContent = message; });
        target.querySelector('[data-err]:not(:empty)')?.closest('.field')?.querySelector('input,select,textarea')?.focus();
        return;
      }
      closeSheet(); toast(event ? 'Đã lưu sự kiện.' : 'Đã thêm sự kiện.');
    }, { signal });
  } });
}
