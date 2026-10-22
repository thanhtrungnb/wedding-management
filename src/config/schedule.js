export const SCHEDULE_CONFIG = { maxImportantEvents: 3 };

export function importantEvents(events, limit = SCHEDULE_CONFIG.maxImportantEvents) {
  return events.filter(event => event.important).slice().sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99:99').localeCompare(b.time || '99:99')).slice(0, limit);
}
