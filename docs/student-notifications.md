# Thông báo học sinh và Thread gọn

Header có chuông và số chưa đọc; `/notifications/` là route static. Danh sách có lọc loại/trạng thái, mở nội dung, đọc/chưa đọc, đọc tất cả, ẩn và phân trang. Không dùng polling, không gọi HTTP lấy thông báo khi mở trang mặc định: socket gửi snapshot và các sự kiện mới vào RTK Query cache. Chỉ lọc/phân trang/tải lại chủ động mới GET; PATCH/DELETE cập nhật cache, không GET lại. Logout xóa dữ liệu.

## Contract dùng chung với backend

- `GET /notifications?type=&isRead=&cursor=` → `{data:{items,nextCursor,unreadCount}}`.
- `PATCH /notifications/{id}` body `{version,isRead}` → `{data:Notification}`.
- `DELETE /notifications/{id}` body `{version}` → soft delete.
- `POST /notifications/read-all` → đánh dấu tất cả thông báo được phép đọc.
- `Notification`: `{id,type,title,href,isRead,version,createdAt}`.
- Socket `/events/ws`: AUTH bằng frame, sau đó `NOTIFICATIONS` snapshot và `NOTIFICATION` riêng lẻ. Không đặt token trong URL.
- `MATERIAL`: bài đăng được công bố; `REPLY`: trả lời đúng chủ bình luận, không tự thông báo mình; `SCORE`: công bố báo cáo điểm, không phải lưu điểm nháp. `SOCIAL` giữ các tín hiệu bình luận/tương tác khác.
- Học sinh chỉ đọc/sửa thông báo của mình, thuộc lớp có enrollment và hồ sơ đang hoạt động. Backend kiểm tra lại khi mở bài, bình luận, báo cáo hoặc file.
- FE chuyển href backend thành `/home/?classId=...&tab=thread&postId=...&commentId=...` hoặc `tab=report&unitId=...`. Link ngoài ứng dụng bị bỏ qua. `GET /posts/{id}` lấy bài ở trang cũ khi cần; `GET /posts/{id}/comments?around={commentId}` tìm trang chứa bình luận, vẫn kiểm tra quyền.

## Tương tác và thumbnail

Bài đăng căn giữa; input/nút mặc định MUI small. Các thao tác chung dùng icon, tooltip và aria-label; vùng chạm vẫn đủ trên thiết bị cảm ứng. Thống kê hiện từng icon + số. Nhấp nút reaction để bật/tắt; nhấn giữ 450ms để chọn loại, có phản hồi thị giác và rung nhẹ nếu hỗ trợ. Kéo để cuộn hủy nhấn giữ. Bàn phím dùng ArrowDown/Shift+F10 để mở menu.

Ảnh bài đăng/bình luận dùng thumbnail xác thực trong khung cố định, `object-fit: cover`; không lấy file gốc để dựng danh sách. Bấm preview mới mở viewer.

## Triển khai

Deploy PR backend hỗ trợ REPLY/SCORE và deep link trước khi merge frontend. Không thêm biến môi trường, polling hoặc migration. Giữ Cloud Tasks/PubSub và Pages workflow hiện có. Backend cũ không phát thông báo công bố điểm/trả lời riêng.
