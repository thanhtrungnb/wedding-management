# Sổ tay cưới — Wedding Management

Ứng dụng sổ tay lập kế hoạch cưới bằng tiếng Việt. Frontend thuần tĩnh: ES modules vanilla, không framework, không build step, không package manager. Toàn bộ chữ nghĩa UI bằng tiếng Việt.

## Chạy thử

Phục vụ thư mục qua HTTP (ES modules không chạy từ `file://`):

```
npx serve .
```

Mở URL được phục vụ. Dữ liệu lưu trong `localStorage` dưới khóa `wm:data:v1`.

## Trạng thái tiến độ

Dự án đang phát triển dần — cập nhật 2026-10-22.

### Hoàn thành

- **Tổng quan** (`#/tong-quan`): đếm ngược ngày cưới, việc nên làm tiếp, việc sắp tới trong 7 ngày, mốc quan trọng, tiến độ theo nhóm, tóm tắt ngân sách.
- **Việc cần làm** (`#/viec`): danh sách theo nhóm, việc cha/con (tối đa 2 cấp), tìm kiếm, lọc theo phụ trách/trạng thái, sắp xếp, thêm/sửa/xóa qua popup, xem chi tiết popup.
- **Cài đặt** (`#/cai-dat`): thông tin đám cưới, xuất/nhập sao lưu `.json`, bắt đầu sổ trống, khôi phục dữ liệu mẫu.
- **Nền tảng**: store tập trung kèm hoàn tác (undo qua toast), router hash, validate schema đầu vào (localStorage + import), cách ly dữ liệu hỏng (`wm:corrupt:*`), design token, accessibility (focus, aria, reduced-motion, tap target 44px).

### Đang làm

- **Ngân sách** (`#/ngan-sach`): logic tính toán đã sẵn trong `services/dashboard.js` (`budgetSummary`) — còn thiếu view. Trên mobile tạm ẩn khỏi tabbar, sidebar desktop hiển thị nhãn "Sắp có".

### Chưa bắt đầu

- **Lịch trình** (`#/lich-trinh`): chưa có logic lẫn view.
- Dark mode, bản in (print stylesheet), ornament empty state.

### Nhật ký sửa gần đây (2026-10-22)

- Sửa nút "Xóa bộ lọc" luôn hiển thị dù chưa lọc (`.btn` đè thuộc tính `hidden`).
- Sửa lời hứa chết "Chi tiết sẽ có ở trang Ngân sách" trên Tổng quan (route chưa tồn tại).
- Tối giản `--ink-3` đạt tương phản WCAG AA trên nền giấy.
- Tabbar mobile chỉ còn 3 mục dùng được thật (bỏ 2 mục "Sắp có").
- Thêm/sửa/xem chi tiết việc đổi từ ngăn kéo bên phải thành **popup giữa màn hình** (desktop + mobile).
- Favicon SVG monogram + tiêu đề tab thuần Việt.

## Kiến trúc

Luồng dữ liệu phân lớp nghiêm ngặt — phụ ứng chỉ trỏ một chiều:

```
features/ (views, DOM)
  → services/ (business logic, thuần: đổi `data`, không DOM, không storage)
    → models/ (validate schema, quy tắc miền)
      → utils/
features/ cũng → core/store.js (state dùng chung)
  → repositories/appRepository.js (hợp đồng load/save/reset — đổi file này để cắm backend)
    → storage/localStore.js (tầng thấp nhất; chỉ repository được gọi)
```

Chi tiết cơ chế (commit/undo, router + signal, quy tắc việc cha/con, pattern view) xem `CLAUDE.md`.
