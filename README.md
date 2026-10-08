# ESS · Báo cáo học tập

[Thread, đính kèm bình luận, file private và rollout](docs/thread-materials.md): mặc định tab Thread cho học sinh; liên hệ giảng viên; routing upload theo storage; migration Materials `005_materials.sql` trước triển khai frontend.
Next.js App Router + TypeScript strict + MUI + Redux Toolkit/RTK Query. Static export cho GitHub Pages; giao diện Sáng/Tối/Theo hệ thống, ưu tiên mobile. Recharts tải khi biểu đồ đi vào vùng nhìn.

## Chạy với backend thật

Yêu cầu Node.js 24 và backend `ess-edu-api` đã deploy.

```sh
npm ci
cp .env.example .env.local
```

`.env.example` đã có URL Cloud Run hiện tại; sao chép là có thể gọi API thật. Có thể đổi URL trong `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://ess-edu-portal-api-246816830212.asia-southeast1.run.app/v1
NEXT_PUBLIC_API_TIMEOUT_MS=15000
NEXT_PUBLIC_BASE_PATH=
```

Có thể dùng URL gốc `https://<cloud-run-host>`; frontend tự thêm `/v1`. URL đã có `/v1` được giữ nguyên. HTTP chỉ được dùng với localhost khi phát triển. Sau đó chạy `npm run dev`, mở http://localhost:3000/login/.

Đăng nhập bằng tài khoản học sinh do backend cấp. Hồ sơ, lớp, Unit, điểm, nhận xét, tiến trình và tài liệu đều lấy từ API. Báo cáo chỉ xuất hiện sau khi giảng viên công bố từ Staff Portal; đánh dấu hoàn thành bài kiểm tra chưa công bố báo cáo. Nếu có nhiều lớp active, mặc định chọn phần tử active đầu tiên theo thứ tự API; học sinh chọn đúng lớp để xem báo cáo tương ứng.

Ứng dụng **chỉ gọi backend thật**, không có chế độ offline hoặc dữ liệu mẫu trong mã ứng dụng. Thiếu URL hoặc timeout không hợp lệ sẽ làm production build thất bại. API trả rỗng/lỗi thì giao diện hiển thị empty/error state và nút thử lại; không thay dữ liệu backend bằng giá trị mẫu. Các biến `NEXT_PUBLIC_*` công khai và được cố định lúc build, cần build/deploy lại sau khi đổi. Không đặt chuỗi kết nối database, JWT signing key hoặc secret vào frontend.

## API và phiên đăng nhập

- `src/models`: types, lựa chọn lớp/Unit mặc định và tính chênh lệch.
- `src/api`: cấu hình, typed endpoints, `fetchBaseQuery`, Bearer headers, timeout và xử lý lỗi.
- `src/store`, `src/auth`: Redux, JWT trong sessionStorage, khôi phục phiên rồi xác minh `GET /me`.
- `src/features`, `src/components`, `src/app`: báo cáo, biểu đồ và routes.

Đăng nhập dùng `POST /auth/login {studentId,password}`. Link học sinh dùng `/auth/link/#code=<mã-backend-cấp>` và `POST /auth/exchange`; xóa fragment ngay, đổi mã một lần. Mọi mã đăng nhập phải do backend cấp và xác thực; frontend không tạo hoặc chấp nhận mã offline. Không dùng endpoint trao đổi mã dành cho staff `/auth/link/exchange`.

Mọi request được bảo vệ gửi `Authorization: Bearer <accessToken>`. Logout gọi `POST /auth/logout` thu hồi phiên trên backend, sau đó xóa session, cache và lựa chọn lớp/Unit; nếu mạng lỗi vẫn xóa phiên tại trình duyệt. 401/expiry xóa phiên; 403 giữ phiên và hiện lỗi. Không tự retry mutation hoặc refresh token. Phiên lưu được gắn với URL backend; token sai cấu trúc hoặc hết hạn bị loại bỏ. Reload khôi phục phiên rồi xác minh `/me`; kiểm tra `exp` ở client không xác minh chữ ký JWT. Backend phải xác thực và phân quyền mọi endpoint; route guard chỉ phục vụ giao diện.

Thread và tài liệu lấy theo lớp. Mỗi preview/download/thumbnail gọi API có Bearer JWT; trình duyệt chỉ mở Blob nội bộ, không nhận signed GET/public storage URL. Backend cần CORS cho origin `https://vqviet03.github.io` (không thêm đường dẫn repo), và `http://localhost:3000` khi phát triển. Chi tiết request/response: [docs/api-contract.md](docs/api-contract.md).

## Build và kiểm tra

```sh
npm run lint
npm run typecheck
npm test
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run test:e2e
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run preview
```

Build đọc URL trong `.env.local`. Để chạy browser tests hãy export cùng `NEXT_PUBLIC_API_BASE_URL` và base path đã dùng khi build; ví dụ:

```sh
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run test:e2e
```

`npm test` kiểm tra công thức/lựa chọn mặc định, phiên JWT và RTK Query gọi HTTP với server test: tất cả endpoints, Bearer, cấu hình, abort, cache keys, 401/403 và phản hồi 401 đến muộn. Browser tests intercept HTTP **chỉ trong test runner**, kiểm tra bảy đường cong, tám biểu đồ chênh lệch, đăng nhập/link, reload/logout, chọn lớp/Unit, tài liệu, theme, mobile và static deep links. Dữ liệu tổng hợp ở `tests/support/data.ts` chỉ phục vụ kiểm thử và không được import bởi `src` hoặc đưa vào ứng dụng export.

Kiểm tra tích hợp backend ASP.NET + PostgreSQL đã seed trong môi trường thử nghiệm riêng (không chạy trên production vì sẽ tạo/thu hồi phiên và mã đăng nhập):

```sh
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8092/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
TEST_LIVE_API=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8092/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npx playwright test tests/live-api.spec.ts
```

Backend test cần cho phép CORS `http://127.0.0.1:4173` và có demo seed `HV000123`, `GV000001`. Nếu Chromium có sẵn: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

Preview: http://localhost:4173/ess-edu-portal/. Routes `/`, `/login/`, `/auth/link/`, `/home/`, `/materials/` có HTML riêng, reload không cần SPA rewrite. `/dashboard/` cũ chuyển sang `/home/` ở client.

## Cấu hình tài liệu trên Cloud Run

Backend cần biến môi trường sau để tạo URL truy cập tài liệu (URL gốc, không thêm `/v1`):

```dotenv
Api__PublicBaseUrl=https://ess-edu-portal-api-246816830212.asia-southeast1.run.app
```

Cloud Run → service → Edit & deploy new revision → Variables & Secrets → thêm biến này và deploy revision. URL tài liệu bên ngoài cũng phải dùng HTTPS; file trong bucket cần cấu hình `Storage__Bucket`. Đây là cấu hình backend; frontend vẫn hiển thị danh sách và báo lỗi từ API.

Giá trị thiếu từ API giữ `null`, hiển thị trạng thái chưa có dữ liệu. Nhận xét và lời khuyên hiển thị đúng nội dung backend trả về. Điểm số không phải tỷ lệ hoàn thành khóa học.

## GitHub Pages

PR vào `dev` chạy lint, typecheck, tests, production build và browser tests, không deploy. Chỉ push vào `dev` sau merge (hoặc chạy workflow thủ công trên `dev`) deploy `out/`. Không tự merge nhánh tính năng.

1. Settings → Pages → Source: **GitHub Actions**.
2. URL backend hiện tại đã được đặt trong workflow: `https://ess-edu-portal-api-246816830212.asia-southeast1.run.app/v1`. Tùy chọn ghi đè bằng repository variable `NEXT_PUBLIC_API_BASE_URL` trong Settings → Secrets and variables → Actions → **Variables**.
3. Tùy chọn `NEXT_PUBLIC_API_TIMEOUT_MS` (mặc định 15000).
4. Backend deploy code mới và cho phép CORS origin Pages; merge PR rồi chờ workflow deploy.

Workflow dùng URL Cloud Run đã cấu hình khi không có repository variable, nên không cần quyền quản lý variables để deploy. URL backend là cấu hình công khai, không cần GitHub Secret. Build ngoài workflow vẫn yêu cầu URL hợp lệ.

Workflow lấy base path từ `actions/configure-pages`: project Pages dùng `/<repo>`, root/custom domain theo cấu hình Pages. Local/build ngoài Actions đặt `NEXT_PUBLIC_BASE_PATH` tương ứng, không dấu `/` cuối. Links, assets và reload trực tiếp hoạt động dưới base path; không cần Next server.

## Hướng dẫn, thu/phóng và biểu đồ

Header có “Hướng dẫn” cho đăng nhập, báo cáo và tài liệu: giải thích từng phần kèm minh họa được ghi rõ không phải dữ liệu tài khoản. Desktop mở cột bên phải; mobile mở vùng cuộn phía dưới, vẫn thao tác được nội dung chính. “Ẩn hướng dẫn” đóng vùng này.

Nút −/100%/+ chọn 75/85/100/115/125%, lưu localStorage `ess.student.zoom`. Chỉ đổi hiển thị, không thay dữ liệu. Mỗi đường kỹ năng và biểu đồ chênh lệch có nút bật/tắt với aria-pressed, có hiện/ẩn tất cả; mặc định đủ 7 đường và 8 biểu đồ, bảng điểm/nhận xét luôn giữ nguyên. Báo cáo được cập nhật theo tín hiệu WebSocket của lớp; không có polling interval hoặc refetch định kỳ/focus. Kết nối lại replay signal theo cursor; thao tác tải lại/thử lại vẫn chủ động gọi API. Ứng dụng vẫn chỉ dùng API thật; fixtures giới hạn trong tests.

Thread lớp, quyền tác giả và triển khai: [docs/class-thread-posts.md](docs/class-thread-posts.md).
