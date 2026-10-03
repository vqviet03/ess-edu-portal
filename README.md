# LearnLeaf · Báo cáo học tập

Next.js App Router + TypeScript + MUI + Redux Toolkit/RTK Query. Static export cho GitHub Pages, ưu tiên mobile, giao diện Sáng/Tối/Theo hệ thống. Recharts được tải khi biểu đồ đi vào vùng nhìn.

## Chạy và kiểm tra

Yêu cầu Node.js 24.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3000/login/. Demo: **HV000123 / Demo123!**. Link một lần: http://localhost:3000/auth/link/#code=demo-bon. Mock ghi nhận code đã dùng trong tab, kể cả sau logout/reload; dùng tab mới hoặc xóa `learnleaf.mock.used-code` để thử lại. Link mock `demo-expired`, `demo-used` và mã bất kỳ khác mô phỏng lỗi.

```sh
npm run lint
npm run typecheck
npm test
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run build
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run test:e2e
NEXT_PUBLIC_BASE_PATH=/ess-edu-portal npm run preview
```

Preview static: http://localhost:4173/ess-edu-portal/. Các route `/`, `/login/`, `/auth/link/`, `/home/`, `/materials/` có HTML riêng; reload không cần SPA rewrite. `/dashboard/` cũ chuyển sang `/home/` ở client.

Nếu Chromium có sẵn trên máy: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Kiểm thử browser gồm đăng nhập, link một lần, URL sanitization, reload phiên, 401/logout, lựa chọn lớp/unit, biểu đồ, tài liệu, theme, mobile và deep links. Kiểm thử core bao gồm routing mock/real, JWT, dữ liệu gốc và phép tính chênh lệch.

## Dữ liệu mẫu và API thật

- `src/models`: hợp đồng dữ liệu và tính toán; `src/mock`: fixtures + mock baseQuery.
- `src/api`: tất cả endpoints, fetchBaseQuery, timeout 15 giây, xử lý lỗi/401.
- `src/store`, `src/auth`: Redux, JWT sessionStorage, khôi phục phiên qua `/me` và guard phía client.
- `src/features`, `src/components`, `src/app`: báo cáo, biểu đồ và routes.

`NEXT_PUBLIC_API_MODE=mock` là mặc định. Để nối backend, đặt `NEXT_PUBLIC_API_MODE=real`, `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1`, rồi build lại. Thiếu URL hoặc sai mode báo lỗi cấu hình; không fallback sang mock. Các giá trị `NEXT_PUBLIC_*` là công khai, tuyệt đối không chứa secret. API thật phải kiểm tra JWT và quyền học sinh trên mọi endpoint; guard phía client chỉ phục vụ UX.

Mock token không ký JWT và không sử dụng secret. Tài liệu demo là nguồn công khai để kiểm tra PDF/audio/video/link; URL không phải signed URL thật. Backend thật phải cấp URL HTTPS có thời hạn qua endpoint access. Không đưa dữ liệu học sinh riêng tư vào fixtures public.

Các ID kiểm thử đều dùng mật khẩu `Demo123!`:

| ID | Tình huống |
| --- | --- |
| HV000123 | Hữu Văn (Bon), lớp Juniors 03 active, Unit 3 mặc định |
| HVEMPTY | Không có lớp |
| HVNOUNITS | Không có unit |
| HVNOREPORT | Unit chưa có báo cáo |
| HVFORBIDDEN | API trả 403 |
| HVERROR | API trả 500 |
| HVEXPIRED | Phiên hết hạn |

Số liệu U1/U2 chỉ có tỷ lệ; điểm thô, ngày kiểm tra và nhận xét chưa có dùng `null`, không suy đoán thành 0. Nhận xét U3 và 4 lời khuyên chép từ [Figma](https://www.figma.com/design/gNvnZayK3PO34Erb6S8WOn?node-id=2-3). Các đường biểu đồ là dữ liệu tương tác Recharts `monotone`, không dùng ảnh chụp biểu đồ.

## GitHub Pages và review

PR vào `dev` chạy lint, typecheck, core tests, production build và browser tests; không có quyền deploy. Chỉ push vào `dev` sau merge (hoặc chạy workflow thủ công trên `dev`) mới build và deploy `out/`. Nhánh tính năng không được tự merge.

Trong Settings → Pages chọn Source: GitHub Actions. Workflow lấy `base_path` từ `actions/configure-pages`: project Pages dùng `/<repo>`, root Pages hoặc custom domain dùng đường dẫn được Pages cấu hình. Local/build ngoài Actions đặt `NEXT_PUBLIC_BASE_PATH` tương ứng (không dấu `/` cuối). `next/link`, assets, favicon và client navigation đều tôn trọng basePath.

Repository variables cho deploy: `NEXT_PUBLIC_API_MODE` (mặc định mock) và `NEXT_PUBLIC_API_BASE_URL`. Sau khi thay cấu hình, chạy lại deploy trên `dev`. Chi tiết backend: [docs/api-contract.md](docs/api-contract.md).
