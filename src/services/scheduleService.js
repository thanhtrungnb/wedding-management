import { newId } from '../utils/id.js';
import { parseDate } from '../utils/format.js';
import { SCHEDULE_CONFIG } from '../config/schedule.js';

export function saveEvent(data, input, id = null) {
  const title = String(input.title ?? '').trim(), date = input.date || '', time = input.time || '';
  const errors = {};
  if (!title) errors.title = 'Hãy nhập tên sự kiện.';
  if (!parseDate(date)) errors.date = 'Hãy chọn ngày hợp lệ.';
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time = 'Giờ không hợp lệ.';
  if (Object.keys(errors).length) return { ok: false, errors };
  const event = { title, date, time, location: String(input.location ?? '').trim(), note: String(input.note ?? '').trim(), important: !!(id && data.events.find(x => x.id === id)?.important), type: ['ceremony', 'meeting', 'booking', 'other'].includes(input.type) ? input.type : 'other' };
  if (id) {
    const current = data.events.find(x => x.id === id);
    if (!current) return { ok: false, errors: { title: 'Không tìm thấy sự kiện.' } };
    Object.assign(current, event);
  } else data.events.push({ id: newId('e'), ...event });
  return { ok: true };
}

export function toggleImportantEvent(data, id) {
  const event = data.events.find(x => x.id === id);
  if (!event) return { ok: false };
  if (event.important) {
    event.important = false;
    return { ok: true, important: false, title: event.title };
  }
  if (data.events.filter(x => x.important).length >= SCHEDULE_CONFIG.maxImportantEvents)
    return { ok: false, limit: SCHEDULE_CONFIG.maxImportantEvents };
  event.important = true;
  return { ok: true, important: true, title: event.title };
}

export function removeEvent(data, id) {
  const index = data.events.findIndex(x => x.id === id);
  if (index < 0) return { ok: false };
  const [event] = data.events.splice(index, 1);
  return { ok: true, title: event.title };
}
