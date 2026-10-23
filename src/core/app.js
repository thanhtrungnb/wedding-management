import { startRouter } from './router.js';
import { toast } from './toast.js';
import { recovered, sampleFailed } from './store.js';
import { showPublicInvitation } from '../features/publicInvitation.js';
import { setPublicEndpoint } from '../storage/guestBackend.js';
document.addEventListener('click', e => { if (e.target.closest('[data-soon]')) toast('Mục này sẽ có ở bước tiếp theo.'); });
const query = new URLSearchParams(location.search), inviteToken = query.get('invite'), publicBackend = query.get('backend');
if (inviteToken) {
  if (publicBackend) setPublicEndpoint(publicBackend);
  document.body.innerHTML = '<main id="public-invitation"></main>';
  await showPublicInvitation(document.getElementById('public-invitation'), inviteToken);
} else {
  await startRouter(document.getElementById('main'));
  if (recovered) toast('Dữ liệu cũ không đọc được nên đã được giữ lại riêng; ứng dụng đang dùng dữ liệu mẫu.');
  if (sampleFailed) toast('Không đọc được tệp dữ liệu mẫu nên sổ đang trống.');
}
