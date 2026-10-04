# ESS · Báo cáo học tập

Next.js App Router + TypeScript strict + MUI + Redux Toolkit/RTK Query. Static export cho GitHub Pages; giao diện Sáng/Tối/Theo hệ thống, ưu tiên mobile. Recharts tải khi biểu đồ đi vào vùng nhìn.

## Chạy với backend thật

Yêu cầu Node.js 24 và backend `ess-edu-api` đã deploy.

```sh
npm ci
cp .env.example .env.local
```

`.env.example` đã có URL Cloud Run hiện tại; sao chép là có thể gọi API thật. Có thể đổi URL trong `.env.local`:

```dotenv
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_BASE_URL=https://ess-edu-portal-api-246816830212.asia-southeast1.run.app/v1
NEXT_PUBLIC_API_TIMEOUT_MS=15000
NEXT_PUBLIC_BASE_PATH=
```

Có thể dùng URL gốc `https://<cloud-run-host>`; frontend tự thêm `/v1`. URL đã có `/v1` được giữ nguyên. HTTP chỉ được dùng với localhost khi phát triển. Sau đó chạy `npm run dev`, mở http://localhost:3000/login/.

Backend demo đã seed: **HV000123 / Demo123!** và **HV000124 / Demo123!**. Đây là tài khoản thử nghiệm, không dùng mật khẩu này cho người dùng thật. Lớp `ess20-a1` chỉ hiện báo cáo sau khi backend công bố Unit/báo cáo; dữ liệu nháp hiển thị trạng thái chưa có dữ liệu.

Mặc định là **API thật**. Thiếu URL, sai mode hoặc timeout không hợp lệ sẽ làm production build thất bại; không tự chuyển về mock. Các biến `NEXT_PUBLIC_*` công khai và được cố định lúc build, cần build/deploy lại sau khi đổi. Không đặt chuỗi kết nối database, JWT signing key hoặc secret vào frontend.

## API và phiên đăng nhập

- `src/models`: types, lựa chọn lớp/Unit mặc định và tính chênh lệch.
- `src/api`: cấu hình, typed endpoints, `fetchBaseQuery`, Bearer headers, timeout và xử lý lỗi.
- `src/store`, `src/auth`: Redux, JWT trong sessionStorage, khôi phục phiên rồi xác minh `GET /me`.
- `src/features`, `src/components`, `src/app`: báo cáo, biểu đồ và routes; không chứa nhánh mock.
- `src/mock`: adapter và fixtures, chỉ tải khi bật chế độ mock rõ ràng.

Đăng nhập dùng `POST /auth/login {studentId,password}`. Link học sinh dùng `/auth/link/#code=<mã-backend-cấp>` và `POST /auth/exchange`; xóa fragment ngay, đổi mã một lần. `demo-bon` chỉ hoạt động trong chế độ mock. Không dùng endpoint trao đổi mã dành cho staff `/auth/link/exchange`.

Mọi request được bảo vệ gửi `Authorization: Bearer <accessToken>`. Logout gọi `POST /auth/logout` thu hồi phiên trên backend, sau đó xóa session, cache và lựa chọn lớp/Unit; nếu mạng lỗi vẫn xóa phiên tại trình duyệt. 401/expiry xóa phiên; 403 giữ phiên và hiện lỗi. Không tự retry mutation hoặc refresh token. Phiên mock cũ không được dùng trong chế độ real; thay mode/backend yêu cầu đăng nhập lại. Backend phải xác thực và phân quyền mọi endpoint; route guard chỉ phục vụ giao diện.

Tài liệu lấy theo lớp và xin URL HTTPS có thời hạn qua endpoint access, không gắn JWT vào link. Backend cần CORS cho origin `https://vqviet03.github.io` (không thêm đường dẫn repo), và `http://localhost:3000` khi phát triển. Chi tiết request/response: [docs/api-contract.md](docs/api-contract.md).

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

Build đọc URL trong `.env.local`. Để chạy browser tests hãy export cùng `NEXT_PUBLIC_API_MODE`, `NEXT_PUBLIC_API_BASE_URL` và base path đã dùng khi build; ví dụ:

```sh
NEXT_PUBLIC_API_MODE=real NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
NEXT_PUBLIC_API_MODE=real NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run test:e2e
```

`npm test` gồm regression mock và các kiểm thử RTK Query gọi HTTP thật với server test: tất cả endpoints, Bearer, timeout/config, cache keys, 401/403 và phản hồi 401 đến muộn. Browser tests mặc định intercept HTTP bằng fixtures **trong tests**, kiểm tra bản build real, bảy đường cong, tám biểu đồ chênh lệch, đăng nhập/link, reload/logout, chọn lớp/Unit, tài liệu, theme, mobile và static deep links. Fixtures kiểm thử không được đưa vào ứng dụng real.

Kiểm tra tích hợp backend ASP.NET + PostgreSQL đã seed trong môi trường thử nghiệm riêng (không chạy trên production vì sẽ tạo/thu hồi phiên và mã đăng nhập):

```sh
NEXT_PUBLIC_API_MODE=real NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8092/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
TEST_LIVE_API=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8092/v1 NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npx playwright test tests/live-api.spec.ts
```

Backend test cần cho phép CORS `http://127.0.0.1:4173` và có demo seed `HV000123`, `GV000001`. Nếu Chromium có sẵn: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

Preview: http://localhost:4173/ess-edu-portal/. Routes `/`, `/login/`, `/auth/link/`, `/home/`, `/materials/` có HTML riêng, reload không cần SPA rewrite. `/dashboard/` cũ chuyển sang `/home/` ở client.

## Cấu hình tài liệu trên Cloud Run

API thật hiện trả `500 CONFIGURATION_ERROR` khi mở tài liệu: `URL tài liệu/API phải dùng HTTPS.` Backend cần biến môi trường sau (URL gốc, không thêm `/v1`):

```dotenv
Api__PublicBaseUrl=https://ess-edu-portal-api-246816830212.asia-southeast1.run.app
```

Cloud Run → service → Edit & deploy new revision → Variables & Secrets → thêm biến này và deploy revision. URL tài liệu bên ngoài cũng phải dùng HTTPS; file trong bucket cần cấu hình `Storage__Bucket`. Đây là cấu hình backend; frontend vẫn hiển thị danh sách và báo lỗi từ API.

## Mock tùy chọn

Đặt `NEXT_PUBLIC_API_MODE=mock` và build/chạy lại để duyệt offline, không cần backend URL. **HV000123 / Demo123!**, link http://localhost:3000/auth/link/#code=demo-bon. Mã mock dùng một lần trong tab; thử lại bằng tab mới hoặc xóa `learnleaf.mock.used-code`. `demo-expired`/`demo-used` mô phỏng lỗi.

Các ID chỉ tồn tại trong mock, mật khẩu đều `Demo123!`: `HVEMPTY` (không lớp), `HVNOUNITS` (không Unit), `HVNOREPORT` (chưa báo cáo), `HVFORBIDDEN` (403), `HVERROR` (500), `HVEXPIRED` (hết phiên). Mock token không phải JWT thật; tài liệu demo công khai, không chứa thông tin riêng tư.

Số liệu U1/U2 chỉ có tỷ lệ; điểm thô, ngày kiểm tra và nhận xét thiếu dùng `null`. Nhận xét U3 và bốn lời khuyên giữ nguyên từ [thiết kế](https://www.figma.com/design/gNvnZayK3PO34Erb6S8WOn?node-id=2-3). Điểm số không phải tỷ lệ hoàn thành khóa học.

## GitHub Pages

PR vào `dev` chạy lint, typecheck, tests, production build real và browser tests, không deploy. Chỉ push vào `dev` sau merge (hoặc chạy workflow thủ công trên `dev`) deploy `out/`. Không tự merge nhánh tính năng.

1. Settings → Pages → Source: **GitHub Actions**.
2. URL backend hiện tại đã được đặt trong workflow: `https://ess-edu-portal-api-246816830212.asia-southeast1.run.app/v1`. Tùy chọn ghi đè bằng repository variable `NEXT_PUBLIC_API_BASE_URL` trong Settings → Secrets and variables → Actions → **Variables**.
3. Tùy chọn `NEXT_PUBLIC_API_TIMEOUT_MS` (mặc định 15000).
4. Backend deploy code mới và cho phép CORS origin Pages; merge PR rồi chờ workflow deploy.

Workflow deploy luôn build **real**, không dùng biến API mode để vô tình xuất bản demo. Workflow dùng URL Cloud Run đã cấu hình khi không có repository variable, nên không cần quyền quản lý variables để deploy. URL backend là cấu hình công khai, không cần GitHub Secret. Build ngoài workflow vẫn yêu cầu URL hợp lệ.

Workflow lấy base path từ `actions/configure-pages`: project Pages dùng `/<repo>`, root/custom domain theo cấu hình Pages. Local/build ngoài Actions đặt `NEXT_PUBLIC_BASE_PATH` tương ứng, không dấu `/` cuối. Links, assets và reload trực tiếp hoạt động dưới base path; không cần Next server.
