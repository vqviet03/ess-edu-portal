# Refetch và vị trí đọc

Điểm danh trước đây return loading/error khi thiếu currentData hoặc refetch lỗi, gỡ cả calendar/lịch sử. Báo cáo gỡ chart/bảng khi query lịch sử điểm lỗi; đổi Unit chưa có currentData cũng làm mất chiều cao trang.

Giữ dữ liệu và DOM của cùng lớp trong RTK Query khi refetch. Trong lúc đổi filter/Unit chưa có kết quả, giữ chiều cao nội dung cũ nhưng ẩn nội dung và phủ loading/lỗi: không gắn số liệu cũ với bộ lọc/Unit mới. Wrapper key theo classId để không giữ dữ liệu lớp khác. Lỗi refetch cùng query vẫn hiển thị nội dung đã tải kèm Thử lại. Chart giữ mounted để không mất zoom/pan/ẩn hiện đường khi lỗi progress.

Không thêm scrollTo hay polling. Tests/refetch-scroll.spec.ts kiểm tra realtime refetch lỗi, giữ DOM chart/điểm danh, vùng đọc và request filter có độ trễ. Checks GitHub Actions chạy lint/typecheck/unit/build/browser trên PR trước khi merge.
