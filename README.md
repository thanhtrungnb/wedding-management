# Sổ tay cưới — Wedding Management

Ứng dụng sổ tay lập kế hoạch cưới bằng tiếng Việt. Frontend thuần tĩnh: ES modules vanilla, không framework, không build step. Phục vụ thư mục qua HTTP bằng `npx serve .`.

## Kết nối đám mây (thống nhất)

MỘT Google Apps Script + MỘT Google Sheet cho toàn app, cấu hình một lần trong menu **Cài đặt → Kết nối đám mây** (URL Web App + khóa quản trị). Ba sheet trong cùng một file:

- `Du_lieu` — dữ liệu app (task, ghi chép, ngân sách…).
- `Khach_moi` — danh sách khách mời + trạng thái lời mời/RSVP.
- `Thiep` — cấu hình thiệp (khối, màu, thời gian…).

Triển khai: tạo Google Sheet → Extensions → Apps Script → dán `google-apps-script/Code.gs` → đổi `ADMIN_KEY` thành khóa ngẫu nhiên dài → Deploy Web app (Anyone) → nhập URL `/exec` + khóa vào Cài đặt. Khóa chỉ lưu trên thiết bị quản lý, không bao giờ nằm trong link thiệp.

API: `?action=invite&token=…` (public — chỉ dữ liệu của đúng 1 khách), `{action:'rsvp'}` (public), `{action:'read'}`, `{action:'save-app'}`, `{action:'publish'}` (quản trị, cần adminKey).

## Thiệp (menu Thiệp)

- Cấu hình chung: tiêu đề, lời mời, thời gian, địa điểm, màu, ảnh bìa, mẫu tin nhắn lời mời.
- Dựng thiệp theo khối kiểu TopCV: thêm/xóa/đổi thứ tự các khối có sẵn (ảnh bìa, kính mời, tiêu đề, tên đôi uyên ương, lời chào tên khách, lời mời, thời gian & địa điểm, đếm ngược, form RSVP, chân trang).
- Preview trực tiếp dùng chung bộ render với trang thiệp public — thấy gì preview thì link y như vậy.

## Khách mời (menu Khách mời)

- Danh sách khách mặc định lưu trong `localStorage`. Chrome/Edge có thể mở hoặc tạo CSV database trực tiếp; thay đổi khách sẽ tự ghi về CSV đã chọn. CSV/Excel cũng có thể nhập/xuất.
- Nhập `.csv`, `.xlsx`, `.xls`; chỉ cần cột tên (`name` hoặc `Tên`), cột danh xưng và ghi chú tùy chọn — mã thiệp (token) tự sinh. Khách trùng tên được cập nhật.
- Mỗi khách một link thiệp riêng theo mã ngẫu nhiên (`?invite=<token>&backend=<scriptUrl>`); sao chép tin nhắn lời mời có sẵn link, tick đã mời, lọc theo trạng thái lời mời/RSVP.
- Trang public lấy dữ liệu theo mã thiệp, khách RSVP trực tiếp trên link; endpoint không trả danh sách khách.

## Dữ liệu ứng dụng

Dữ liệu kế hoạch lưu trong `localStorage` dưới khóa `wm:data:v1`. Sao lưu JSON vẫn ở menu Cài đặt. CSV được chọn làm database chỉ lưu trên thiết bị đó; GitHub Pages không thể đọc file trên máy quản lý — dùng Apps Script khi cần link public và RSVP.
