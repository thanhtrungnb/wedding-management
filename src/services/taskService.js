/* Nghiệp vụ công việc — thao tác trên `data`, không DOM, không storage. */
import { newId } from '../utils/id.js';
import { normalizeTaskInput, validateTask } from '../models/task.js';
export const kidsOf = (tasks, id) => tasks.filter(t => t.parentId === id);
/** Việc cha xong khi và chỉ khi mọi việc con xong. Không bao giờ tự đổi trạng thái việc con. */
export function syncParents(tasks) { tasks.forEach(p => { const k = kidsOf(tasks, p.id); if (k.length) p.done = k.every(x => x.done); }); }

export function saveTask(data, input, id = null) {
  const t = normalizeTaskInput(input);
  const errors = validateTask(t, { tasks: data.tasks, categories: data.categories, selfId: id });
  if (Object.keys(errors).length) return { ok: false, errors };
  if (t.parentId) t.categoryId = data.tasks.find(x => x.id === t.parentId).categoryId; // việc con theo nhóm của việc cha
  if (id) { const cur = data.tasks.find(x => x.id === id); if (!cur) return { ok: false, errors: { title: 'Không tìm thấy việc.' } }; Object.assign(cur, t); }
  else data.tasks.push({ id: newId('t'), done: false, ...t });
  syncParents(data.tasks);
  return { ok: true };
}
export function toggleDone(data, id) {
  const t = data.tasks.find(x => x.id === id);
  if (!t) return { ok: false };
  if (kidsOf(data.tasks, id).length) return { ok: false, reason: 'Việc này hoàn thành khi mọi việc con đã xong.' };
  t.done = !t.done; syncParents(data.tasks);
  return { ok: true, done: t.done, title: t.title };
}
export function removeTask(data, id) {
  const t = data.tasks.find(x => x.id === id); if (!t) return { ok: false };
  const gone = data.tasks.filter(x => x.id === id || x.parentId === id).length;
  data.tasks = data.tasks.filter(x => x.id !== id && x.parentId !== id); syncParents(data.tasks);
  return { ok: true, title: t.title, count: gone };
}
