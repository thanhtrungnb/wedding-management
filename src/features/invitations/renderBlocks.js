/* Bộ render thiệp DÙNG CHUNG: menu Thiệp dùng làm preview trực tiếp, trang public
   (publicInvitation.js) dùng render thật — thấy gì preview thì link thiệp y như vậy.
   Chỉ render phần nội dung bên trong .invitation; biến màu (--paper/--forest) do bên gọi set. */
import { esc, formatDateShort } from '../../utils/format.js';

export const sampleGuest = { name: 'Khách mời', salutation: 'Anh/Chị' };
const safeImageUrl = url => {
  if (!url) return '';
  try { const u = new URL(url, location.href); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; }
  catch { return ''; }
};
export function countdownText(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const days = Math.ceil((date - Date.now()) / 86400000);
  return days > 0 ? `Còn ${days} ngày nữa là đến ngày vui!` : 'Đã đến ngày trọng đại!';
}
/** CSS cho các class inv-*; dùng biến màu có giá trị mặc định để chạy được ở mọi nơi. */
export const invitationStyles = () => `<style>
.invitation{width:min(100% - 32px,720px);margin:32px auto;padding:clamp(24px,7vw,64px);background:var(--surface,#FBF8F1);border:1px solid var(--line,#DDD3BF);text-align:center;box-shadow:0 18px 70px #1f2a2415;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:var(--ink,#1F2A24)}
.invitation img.inv-img{display:block;width:100%;max-height:360px;object-fit:cover;margin:0 auto 28px;border-radius:var(--r-md,8px)}
.inv-eyebrow{letter-spacing:.16em;text-transform:uppercase;color:var(--accent,#A8573A);font-size:.75rem;margin:0}
.inv-title{font:400 clamp(2rem,7vw,4rem)/1.1 Georgia,serif;color:var(--forest,#2F4A3C);margin:16px 0}
.inv-couple{font:400 clamp(1.6rem,5vw,2.6rem) Georgia,serif;color:var(--forest,#2F4A3C);margin:12px 0}
.inv-greeting{font-size:1.15rem;margin:18px 0}
.inv-message{white-space:pre-line;margin:24px auto;max-width:52ch}
.inv-detail{margin:14px 0}
.inv-countdown{margin:18px 0;font-weight:600;color:var(--forest,#2F4A3C)}
.inv-rsvp{margin-top:36px;padding-top:26px;border-top:1px solid var(--line,#DDD3BF);text-align:left}
.inv-rsvp h2{font:600 1.15rem/1.3 Georgia,serif;color:var(--forest,#2F4A3C)}
.inv-rsvp label{display:block;margin:14px 0 6px}
.inv-rsvp select,.inv-rsvp input{width:100%;min-height:48px;padding:10px;border:1px solid var(--line,#DDD3BF);border-radius:6px;background:#fff;font:inherit}
.inv-rsvp button{width:100%;min-height:48px;margin-top:18px;border:0;border-radius:6px;background:var(--forest,#2F4A3C);color:#fff;font:inherit;cursor:pointer}
.inv-status{min-height:26px;color:var(--forest,#2F4A3C)}
.inv-note{color:var(--ink-3,#6b7570);font-style:italic}
.inv-footer{margin-top:28px;color:var(--ink-3,#6b7570);font-style:italic}
</style>`;
/**
 * Render chuỗi khối thiệp. ctx = { invitation, couple, weddingDate, guest, interactive }.
 * interactive=false (preview trong app): form RSVP chỉ hiện chú thích, không gửi được.
 */
export function renderBlocks(ctx) {
  const { invitation, couple, weddingDate, guest = sampleGuest, interactive = false } = ctx;
  const coupleText = [couple?.bride, couple?.groom].filter(Boolean).map(esc).join(' &amp; ');
  const greeting = esc([guest.salutation, guest.name].filter(Boolean).join(' '));
  const image = safeImageUrl(invitation.imageUrl);
  const html = [];
  for (const block of invitation.blocks) {
    const text = block.text || '';
    switch (block.type) {
      case 'hero': if (image) html.push(`<img class="inv-img" src="${esc(image)}" alt="Ảnh thiệp cưới">`); break;
      case 'eyebrow': html.push(`<p class="inv-eyebrow">${esc(text || 'Trân trọng kính mời')}</p>`); break;
      case 'title': html.push(`<h1 class="inv-title">${esc(text || invitation.title || 'Thiệp mời')}</h1>`); break;
      case 'couple': if (coupleText) html.push(`<p class="inv-couple">${coupleText}</p>`); break;
      case 'greeting': if (greeting) html.push(`<p class="inv-greeting">${greeting}</p>`); break;
      case 'message': html.push(`<p class="inv-message">${esc(text || invitation.message || 'Trân trọng kính mời bạn cùng chung vui trong ngày trọng đại của chúng mình.')}</p>`); break;
      case 'eventInfo': {
        /* Giờ mời riêng của khách (mỗi top một giờ) override giờ chung; kèm ngày cưới cho đủ ngữ cảnh. */
        const dateText = formatDateShort(weddingDate) || weddingDate || '';
        const when = text || (guest.inviteTime
          ? `Vào giờ ${guest.inviteTime} ngày ${dateText}`
          : (invitation.ceremonyAt || weddingDate || ''));
        const where = invitation.venue || '';
        if (when) html.push(`<p class="inv-detail">${esc(when)}</p>`);
        if (where) html.push(`<p class="inv-detail">${esc(where)}</p>`);
        break;
      }
      case 'countdown': {
        const label = countdownText(weddingDate);
        if (label) html.push(`<p class="inv-countdown" data-countdown="${esc(weddingDate)}">${esc(label)}</p>`);
        break;
      }
      case 'rsvp':
        html.push(interactive
          ? `<section class="inv-rsvp"><h2>Xác nhận tham dự</h2><form novalidate><label for="answer">Phản hồi của bạn</label><select id="answer" name="rsvp"><option value="attending">Chúng tôi sẽ tham dự</option><option value="declined">Rất tiếc, không thể tham dự</option></select><label for="party-size">Số người tham dự</label><input id="party-size" name="partySize" type="number" min="0" max="30" value="1"><button type="submit">Gửi xác nhận</button><p class="inv-status" role="status"></p></form></section>`
          : `<section class="inv-rsvp"><h2>Xác nhận tham dự</h2><p class="inv-note">Form xác nhận tham dự hiển thị trên link thiệp thật của từng khách.</p></section>`);
        break;
      case 'footer': html.push(`<p class="inv-footer">${esc(text || 'Hẹn gặp bạn trong ngày vui của chúng mình!')}</p>`); break;
    }
  }
  return html.join('');
}
