import { parseDate } from '../utils/format.js';
export function saveProfile(data, { bride, groom, weddingDate }) {
  const errors = {};
  if (weddingDate && !parseDate(weddingDate)) errors.weddingDate = 'Ngày không hợp lệ.';
  if (String(bride).length > 40 || String(groom).length > 40) errors.names = 'Tên tối đa 40 ký tự.';
  if (Object.keys(errors).length) return { ok: false, errors };
  data.couple = { bride: String(bride).trim(), groom: String(groom).trim() }; data.weddingDate = weddingDate || '';
  return { ok: true };
}
