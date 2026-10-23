/* Trang thiệp public: chạy khi URL có ?invite=<token> (kèm &backend=<scriptUrl> tùy chọn).
   Dữ liệu chỉ lấy theo mã thiệp từ Apps Script; render dùng chung bộ renderBlocks
   với preview trong menu Thiệp. */
import { loadPublicInvitation, submitRSVP } from '../storage/guestBackend.js';
import { esc } from '../utils/format.js';
import { invitationStyles, renderBlocks, countdownText } from './invitations/renderBlocks.js';

const pageStyles = `<style>:root{--paper:#F6F0E4;--forest:#2F4A3C;--accent:#A8573A;--ink:#1F2A24;--surface:#FBF8F1;--line:#DDD3BF}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--paper);font:16px/1.6 "Be Vietnam Pro",system-ui,sans-serif;color:var(--ink)}</style>`;
export async function showPublicInvitation(root, token) {
  root.innerHTML = `${pageStyles}${invitationStyles()}<main class="invitation"><h1 class="inv-title">Đang mở thiệp…</h1><p class="inv-status" role="status"></p></main>`;
  let invite;
  try { invite = (await loadPublicInvitation(token)).invite; }
  catch (error) { root.querySelector('.inv-status').textContent = error.message; return; }
  const hex = v => /^#[\da-f]{6}$/i.test(v) ? v : '';
  document.documentElement.style.setProperty('--paper', hex(invite.invitation.background) || '#F6F0E4');
  document.documentElement.style.setProperty('--forest', hex(invite.invitation.accent) || '#2F4A3C');
  const couple = [invite.couple?.bride, invite.couple?.groom].filter(Boolean).map(esc).join(' &amp; ');
  document.title = `${invite.invitation.title || 'Thiệp mời'}${couple ? ` — ${couple}` : ''}`;
  root.innerHTML = `${invitationStyles()}<main class="invitation">${renderBlocks({ invitation: invite.invitation, couple: invite.couple, weddingDate: invite.weddingDate, guest: invite.guest, interactive: true })}</main>`;
  /* Đếm ngược tự cập nhật mỗi phút; khối không có thì bỏ qua. */
  const countdown = root.querySelector('[data-countdown]');
  if (countdown) {
    const tick = () => { countdown.textContent = countdownText(countdown.dataset.countdown); };
    tick(); setInterval(tick, 60000);
  }
  const form = root.querySelector('.inv-rsvp form');
  if (!form) return;
  form.elements.rsvp.value = invite.guest.rsvp === 'declined' ? 'declined' : 'attending';
  form.elements.partySize.value = invite.guest.partySize || 1;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.inv-status'), submit = form.querySelector('button');
    submit.disabled = true; status.textContent = 'Đang gửi…';
    try { await submitRSVP(token, form.elements.rsvp.value, Number(form.elements.partySize.value)); status.textContent = 'Đã ghi nhận phản hồi. Cảm ơn bạn!'; }
    catch (error) { status.textContent = error.message; }
    finally { submit.disabled = false; }
  });
}
