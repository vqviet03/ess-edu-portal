# Lớp học — Student portal

Next.js + TypeScript + MUI. Site tĩnh, phù hợp GitHub Pages. Giao diện tiếng Việt, tương thích mobile.

## Chạy local

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Tài khoản mẫu: **HS001 / demo123**, hoặc chọn **Vào xem bản demo**.

```sh
npm run typecheck
npm run build
```

## Thay API mock bằng backend thật

- Dữ liệu mẫu và thông tin demo: `src/lib/api/mock.ts`.
- API HTTP và lựa chọn mock/real: `src/lib/api/index.ts`.
- Hợp đồng dữ liệu: `src/lib/api/types.ts`.

Copy `.env.example` thành `.env.local`, đặt `NEXT_PUBLIC_USE_MOCK_API=false` và `NEXT_PUBLIC_API_BASE_URL=https://backend-cua-ban`. Restart dev server hoặc build lại. Nếu backend dùng cấu trúc khác, sửa adapter `realApi`.

| Method | Endpoint | Response |
| --- | --- | --- |
| POST | `/auth/login` | `Session` — body `{ studentId, password }` |
| GET | `/students/me` | `Student` |
| GET | `/students/me/units` | `UnitSummary[]` |
| GET | `/students/me/units/:id` | `Unit` có `objectives` và `lessons` |

GET gửi `Authorization: Bearer <token>`. Session chỉ giữ token trong sessionStorage của tab, không lưu mật khẩu. HTTP 401 đưa học sinh về trang đăng nhập; lỗi mạng có nút thử lại. Backend phải kiểm tra token và quyền truy cập của học sinh, và cho phép CORS từ domain Pages. Đăng nhập mock và kiểm tra ở phía trình duyệt chỉ dành cho demo, không bảo vệ dữ liệu thật. GitHub Pages không chạy API/server của Next.js; backend thật cần được host riêng qua HTTPS.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` build và deploy khi push `main`. Chọn **Settings → Pages → Source: GitHub Actions** nếu Pages chưa được bật. `basePath` tự lấy tên repo, hoặc rỗng nếu repo là `<username>.github.io`.

Để bật backend trên Pages, đặt Repository variables trong **Settings → Secrets and variables → Actions → Variables**:

- `NEXT_PUBLIC_USE_MOCK_API`: `false`
- `NEXT_PUBLIC_API_BASE_URL`: URL backend HTTPS

Chạy lại workflow sau khi đổi. Các giá trị `NEXT_PUBLIC_*` được nhúng vào site công khai; không đặt khóa bí mật ở đây.

## Phạm vi bản đầu

Home đăng nhập → dashboard lấy hồ sơ và danh sách unit → popup lấy chi tiết từng unit. Hiển thị tiến độ, mục tiêu và danh sách bài học. Chưa có học bài, cập nhật tiến độ hoặc nội dung bài học.
