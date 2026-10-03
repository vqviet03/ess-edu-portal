# PostgreSQL database

Schema này triển khai hợp đồng trong `docs/api-contract.md`. ID dùng UUID nhưng API
trả dạng string. Điểm dùng `numeric`, dữ liệu chưa có giữ `NULL`; file lớn không lưu
trong PostgreSQL.

## Chạy migration

Đặt connection string vào biến môi trường, không ghi vào Git:

```sh
export DATABASE_URL='postgresql://...?...sslmode=require'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_runtime_permissions.sql
```

Project đề xuất tên `ess-edu-portal`, database `ess_edu_portal`. `essadmin` nên là
owner dùng cho migration. Backend production nên đăng nhập bằng
role riêng được cấp `ess_api`; không dùng owner để phục vụ request. Mật khẩu học sinh
phải hash bằng Argon2id hoặc BCrypt trong backend. Mã đăng nhập một lần phải sinh ngẫu
nhiên, chỉ lưu SHA-256 trong `code_hash`, tiêu thụ bằng một transaction nguyên tử.

## Quy tắc truy vấn

- `/me/classes`: join `enrollments` → `classes`, sắp theo dữ liệu nghiệp vụ; `is_active`
  nằm trên enrollment vì trạng thái khác nhau theo học sinh.
- Units và materials luôn lọc cả quyền enrollment và `class_id`.
- Report dùng khóa kép để database không cho enrollment, unit và class lệch nhau.
- Progress đọc reports theo `units.unit_order`; không tính lại tổng điểm bằng trung bình
  bảy kỹ năng.
- URL tài liệu có thời hạn được backend tạo từ `object_key`; không lưu JWT/signed URL.

Khi dữ liệu lớn, các index đã bao phủ truy vấn theo học sinh/lớp/unit. `school_id` cho
phép phân vùng theo trường về sau mà không đổi API. Chỉ cân nhắc partition `reports`
và audit data khi bảng đạt hàng chục triệu dòng; partition sớm làm migration phức tạp.

## Backup và vận hành Neon

Dùng pooled connection string cho API và direct connection cho migration. Giới hạn
pool phía ASP.NET Core (khởi đầu 10–20), dùng timeout và retry có backoff. Bật point-in-
time recovery theo gói Neon, giữ migration trong Git và định kỳ thử restore sang branch
database khác.
