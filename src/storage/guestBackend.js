/* API phía khách/thiệp: publish (quản trị), read (quản trị), invite + rsvp (public theo token).
   Endpoint và khóa quản trị lấy từ cloudConfig — một kết nối chung cho toàn app. */
import { getCloudUrl, cloudPost } from './cloudConfig.js';
let publicEndpoint = '';
export const setPublicEndpoint = url => { publicEndpoint = url; };
export async function publishGuestData(data) {
  return cloudPost('publish', { guests: data.guests, invitation: data.invitation, couple: data.couple, weddingDate: data.weddingDate });
}
export async function readGuestState() {
  return cloudPost('read');
}
/* Trang public chỉ biết endpoint qua tham số `backend` trong link (khóa không bao giờ đi cùng). */
const publicUrl = () => publicEndpoint || getCloudUrl();
export async function loadPublicInvitation(token) {
  const url = publicUrl();
  if (!url) throw new Error('Thiệp chưa được kết nối với máy chủ.');
  const endpoint = new URL(url); endpoint.searchParams.set('action', 'invite'); endpoint.searchParams.set('token', token);
  const response = await fetch(endpoint.href), result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Không mở được thiệp.');
  return result;
}
export async function submitRSVP(token, rsvp, partySize) {
  const url = publicUrl();
  if (!url) throw new Error('Thiệp chưa được kết nối với máy chủ.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'rsvp', token, rsvp, partySize }) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Không gửi được phản hồi.');
  return result;
}
export const invitationURL = token => {
  const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('invite', token);
  const scriptUrl = getCloudUrl(); if (scriptUrl) url.searchParams.set('backend', scriptUrl);
  return url.href;
};
export const invitationText = (data, guest) => {
  const template = data.invitation.messageTemplate || 'Thân mời {salutation} {name} đến chung vui cùng gia đình chúng mình. Xem thiệp và xác nhận tại: {link}';
  return template.replaceAll('{name}', guest.name).replaceAll('{salutation}', guest.salutation).replaceAll('{link}', invitationURL(guest.token));
};
