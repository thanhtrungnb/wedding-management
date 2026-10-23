/* Menu Thiệp: cấu hình chung (tiêu đề, thời gian, màu…) + trình biên tập khối kiểu TopCV
   (thêm/xóa/đổi thứ tự các khối trong bộ khung có sẵn) + preview trực tiếp
   dùng chung bộ render với trang thiệp public. */
import { getData, commit, onChange } from '../../core/store.js';
import { toast } from '../../core/toast.js';
import { esc } from '../../utils/format.js';
import { BLOCK_TYPES, BLOCK_LABELS, BLOCK_HINTS, TEXT_BLOCKS } from '../../models/invitation.js';
import { invitationStyles, renderBlocks, sampleGuest } from './renderBlocks.js';

const field = (id, label, value = '', type = 'text') => `<div class="field"><label class="field__l" for="inv-${id}">${label}</label><input class="input" id="inv-${id}" name="${id}" type="${type}" value="${esc(value)}" maxlength="300"></div>`;
function configForm(inv) {
  return `<form id="inv-config" class="inv-config" novalidate>
    ${field('title', 'Tiêu đề thiệp', inv.title)}
    <div class="field"><label class="field__l" for="inv-message">Lời mời chung</label><textarea class="input" id="inv-message" name="message" rows="4">${esc(inv.message)}</textarea></div>
    <div class="inv-grid">${field('ceremonyAt', 'Thời gian (ví dụ: 6:00 Chủ nhật 12/10)', inv.ceremonyAt)}${field('venue', 'Địa điểm', inv.venue)}</div>
    <div class="inv-grid">${field('background', 'Màu nền (hex)', inv.background)}${field('accent', 'Màu nhấn (hex)', inv.accent)}</div>
    ${field('imageUrl', 'URL ảnh bìa (tùy chọn)', inv.imageUrl, 'url')}
    <div class="field"><label class="field__l" for="inv-message-template">Mẫu tin nhắn lời mời (dùng {name}, {salutation}, {link})</label><textarea class="input" id="inv-message-template" name="messageTemplate" rows="3">${esc(inv.messageTemplate)}</textarea></div>
    <button class="btn btn--sm" type="submit">Lưu cấu hình</button></form>`;
}
function blockEditor(inv) {
  return `<div class="inv-editor">
    <div class="inv-add"><label class="field__l" for="inv-block-type">Thêm khối</label>
      <div class="inv-add__row"><select class="input" id="inv-block-type">${BLOCK_TYPES.map(t => `<option value="${t}">${BLOCK_LABELS[t]}</option>`).join('')}</select>
      <button class="btn btn--sm" type="button" data-add-block>Thêm</button></div></div>
    <ol class="inv-blocks">${inv.blocks.map((b, i) => `<li class="inv-block">
      <div class="inv-block__head"><strong>${BLOCK_LABELS[b.type]}</strong><span class="fine">${BLOCK_HINTS[b.type]}</span>
        <span class="inv-block__btns"><button class="btn btn--sm btn--quiet" type="button" data-up="${i}" aria-label="Đưa lên" ${i === 0 ? 'disabled' : ''}>↑</button><button class="btn btn--sm btn--quiet" type="button" data-down="${i}" aria-label="Đưa xuống" ${i === inv.blocks.length - 1 ? 'disabled' : ''}>↓</button><button class="btn btn--sm btn--quiet btn--danger" type="button" data-remove="${i}" aria-label="Xóa khối">×</button></span></div>
      ${TEXT_BLOCKS.includes(b.type) ? `<input class="input inv-block__text" data-block-text="${i}" value="${esc(b.text)}" placeholder="Bỏ trống để dùng nội dung chung" maxlength="500">` : ''}
    </li>`).join('')}</ol></div>`;
}
function preview(data, override = {}) {
  const inv = { ...data.invitation, ...override };
  return `<div class="inv-preview" style="--paper:${esc(inv.background)};--forest:${esc(inv.accent)}">${invitationStyles()}<div class="invitation">${renderBlocks({ invitation: inv, couple: data.couple, weddingDate: data.weddingDate, guest: sampleGuest, interactive: false })}</div></div>`;
}
function view(data) {
  return `<div class="wrap inv-page"><header class="page-head"><div><p class="eyebrow">Thiệp mời online</p><h1 class="page-title">Thiệp</h1><p class="lede">Sửa cấu hình chung và dựng thiệp từ các khối có sẵn; xem trước ngay tại chỗ. Mỗi khách nhận link riêng theo mã thiệp.</p></div></header>
    <div class="inv-layout">
      <div class="inv-main">
        <section class="inv-section"><h2>Cấu hình chung</h2><p class="fine">Thông tin dùng chung cho mọi thiệp — các khối dưới đây chỉ tham chiếu, sửa một chỗ cập nhật toàn bộ.</p>${configForm(data.invitation)}</section>
        <section class="inv-section"><h2>Khối thiệp</h2><p class="fine">Thêm, xóa, đổi thứ tự các khối trong bộ khung có sẵn. Thiết kế visual sau này chỉ thêm mẫu khối mới, không phá cấu trúc.</p>${blockEditor(data.invitation)}</section>
      </div>
      <aside class="inv-side"><h2>Xem trước</h2><div id="inv-preview-box">${preview(data)}</div><p class="fine">Preview dùng khách mẫu; link thật hiển thị tên khách tương ứng.</p><p class="fine"><a href="thiep.html" target="_blank" rel="noopener">Mở mẫu thiết kế mới (thiep.html) →</a></p></aside>
    </div></div>`;
}
/** Đọc giá trị đang nhập trong form cấu hình (chưa lưu) để preview cập nhật live. */
function formOverride(el) {
  const form = el.querySelector('#inv-config');
  if (!form) return {};
  return Object.fromEntries(new FormData(form));
}
export function mount(el, signal) {
  el.innerHTML = view(getData());
  /* Chỉ vẽ lại editor + preview; form cấu hình giữ nguyên để không mất con trỏ đang nhập. */
  const redraw = (override = {}) => {
    const data = getData();
    const editorBox = el.querySelector('.inv-editor');
    if (editorBox) editorBox.outerHTML = blockEditor(data.invitation);
    const box = el.querySelector('#inv-preview-box');
    if (box) box.innerHTML = preview(data, override);
  };
  onChange(() => redraw(formOverride(el)), signal);
  el.addEventListener('input', event => {
    if (event.target.closest('#inv-config')) redraw(formOverride(el));
  }, { signal });
  el.addEventListener('submit', event => {
    if (event.target.id !== 'inv-config') return;
    event.preventDefault();
    commit(data => { data.invitation = { ...data.invitation, ...Object.fromEntries(new FormData(event.target)) }; });
    toast('Đã lưu cấu hình thiệp.');
  }, { signal });
  el.addEventListener('change', event => {
    const input = event.target.closest('[data-block-text]');
    if (!input) return;
    const index = Number(input.dataset.blockText);
    commit(data => { if (data.invitation.blocks[index]) data.invitation.blocks[index].text = input.value; });
  }, { signal });
  el.addEventListener('click', event => {
    if (event.target.closest('[data-add-block]')) {
      const type = el.querySelector('#inv-block-type').value;
      commit(data => { data.invitation.blocks.push({ type, text: '' }); });
      return;
    }
    const up = event.target.closest('[data-up]');
    if (up) { const i = Number(up.dataset.up); commit(data => { const b = data.invitation.blocks; if (i > 0) [b[i - 1], b[i]] = [b[i], b[i - 1]]; }); return; }
    const down = event.target.closest('[data-down]');
    if (down) { const i = Number(down.dataset.down); commit(data => { const b = data.invitation.blocks; if (i < b.length - 1) [b[i + 1], b[i]] = [b[i], b[i + 1]]; }); return; }
    const remove = event.target.closest('[data-remove]');
    if (remove) { const i = Number(remove.dataset.remove); commit(data => { data.invitation.blocks.splice(i, 1); }); toast('Đã xóa khối.'); }
  }, { signal });
}
