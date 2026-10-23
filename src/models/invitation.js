/* Domain thiệp mời: danh sách khối dựng thiệp (kiểu thêm/xóa như TopCV).
   Mỗi khối chỉ mang type + nội dung tùy chọn; thông tin chung (thời gian, địa điểm, màu…)
   nằm trong invitation config để sửa một chỗ cập nhật toàn bộ. */
export const BLOCK_TYPES = ['hero', 'eyebrow', 'title', 'couple', 'greeting', 'message', 'eventInfo', 'countdown', 'rsvp', 'footer'];
export const BLOCK_LABELS = {
  hero: 'Ảnh bìa', eyebrow: 'Dòng kính mời', title: 'Tiêu đề', couple: 'Tên cô dâu chú rể',
  greeting: 'Lời chào tên khách', message: 'Lời mời', eventInfo: 'Thời gian & địa điểm',
  countdown: 'Đếm ngược ngày cưới', rsvp: 'Form xác nhận tham dự', footer: 'Chân trang',
};
/* Ghi chú trong trình biên tập: khối lấy dữ liệu ở đâu. */
export const BLOCK_HINTS = {
  hero: 'Ảnh từ cấu hình chung', eyebrow: 'Có thể ghi đè nội dung', title: 'Mặc định theo tiêu đề chung',
  couple: 'Từ thông tin đám cưới', greeting: 'Tự động theo từng khách (token)', message: 'Mặc định theo lời mời chung',
  eventInfo: 'Thời gian + địa điểm chung', countdown: 'Theo ngày cưới', rsvp: 'Chỉ hoạt động trên link thiệp thật',
  footer: 'Có thể ghi đè nội dung',
};
/* Khối cho phép nhập nội dung riêng; khối còn lại lấy từ config. */
export const TEXT_BLOCKS = ['eyebrow', 'title', 'message', 'footer'];
export const defaultBlocks = () => [
  { type: 'hero', text: '' }, { type: 'eyebrow', text: '' }, { type: 'title', text: '' },
  { type: 'couple', text: '' }, { type: 'greeting', text: '' }, { type: 'message', text: '' },
  { type: 'eventInfo', text: '' }, { type: 'rsvp', text: '' }, { type: 'footer', text: '' },
];
/** Chuẩn hóa danh sách khối từ dữ liệu vào (localStorage / tệp nhập / Apps Script);
    dữ liệu cũ không có khối nào thì dùng bộ khung mặc định. */
export function normalizeBlocks(raw) {
  if (!Array.isArray(raw)) return defaultBlocks();
  const blocks = raw
    .map(b => (b && typeof b === 'object' && BLOCK_TYPES.includes(b.type)
      ? { type: b.type, text: typeof b.text === 'string' ? b.text.trim() : '' }
      : null))
    .filter(Boolean);
  return blocks.length ? blocks.slice(0, 40) : defaultBlocks();
}
