import { startRouter } from './router.js';
import { toast } from './toast.js';
import { recovered } from './store.js';
document.addEventListener('click', e => { if (e.target.closest('[data-soon]')) toast('Mục này sẽ có ở bước tiếp theo.'); });
await startRouter(document.getElementById('main'));
if (recovered) toast('Dữ liệu cũ không đọc được nên đã được giữ lại riêng; ứng dụng đang dùng dữ liệu mẫu.');
