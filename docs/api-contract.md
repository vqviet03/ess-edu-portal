# Hợp đồng API ESS v1

Base URL: NEXT_PUBLIC_API_BASE_URL, ví dụ https://api.example.com/v1. Tất cả ID là string, ngày giờ là ISO 8601. Giá trị chưa có là null; danh sách rỗng là items: []. Response thành công có data; lỗi có error. Content-Type và Accept: application/json.

## Xác thực

POST /auth/login và /auth/exchange là public; POST /auth/logout và mọi endpoint /me yêu cầu Authorization: Bearer <accessToken>. Frontend lưu session trong sessionStorage, đồng bộ Redux, rồi xác minh /me khi khôi phục. Backend luôn xác minh chữ ký JWT, issuer, audience, exp và quyền học sinh/lớp/unit/tài liệu. Không tin studentId, classId hoặc dữ liệu client để cấp quyền. 401 xóa phiên/cache và chuyển về login; 403 hiển thị không có quyền, không logout tự động. Không tự refresh/retry 401 và không log token/mật khẩu.

## Link một lần

URL frontend: /<basePath>/auth/link/#code=<one-time-code>. Backend phát mã ngẫu nhiên đủ entropy, hạn ngắn (khuyến nghị vài phút), lưu dạng hash và tiêu thụ một lần bằng thao tác nguyên tử. Ràng buộc mã vào học sinh/đích sử dụng. Frontend đọc hash, xóa ngay bằng history.replaceState rồi POST /auth/exchange. Không cho mật khẩu hay JWT vào URL. Không ghi mã vào analytics/access logs. Không có chức năng gửi link trong frontend. Code sai trả 400; code hết hạn/đã dùng trả 410. Sau trao đổi, điều hướng replace sang /home/. StrictMode không tạo hai request exchange.

## Models và quy tắc số liệu

Định nghĩa TypeScript chuẩn tại src/models/index.ts. SkillCode gồm vocabulary, grammar, pronunciation, listening, reading, speaking, writing. Student.nickname, testedAt, score/maxScore/percentage, comment/overallComment và dữ liệu chưa cung cấp có thể null. Advice là string[], dùng [] nếu chưa có. Material.type: pdf | audio | video | link; unitId/sizeBytes/durationSeconds có thể null. Không suy đoán điểm thô từ tỷ lệ đã làm tròn.

Lớp mặc định: phần tử isActive đầu tiên theo thứ tự API, nếu không có chọn lớp đầu. Unit mặc định: order lớn nhất; list unit là các unit của học sinh trong lớp. hasReport=false không gọi report. API progress trả theo unitOrder; frontend cũng sắp tăng để ổn định. Tổng điểm do backend cung cấp, không lấy trung bình đơn giản 7 phần trăm. Chênh lệch = percentage sau - percentage trước, làm tròn 1 chữ số, đơn vị điểm phần trăm. Nhãn biểu đồ giữ % như mẫu, tooltip giải thích đơn vị. Các giá trị null không chuyển thành 0 hoặc nối đường qua điểm thiếu.

## Request/response mẫu
### POST /auth/login

Request

```json
{
  "studentId": "HV000123",
  "password": "Demo123!"
}
```

### POST /auth/exchange

Request

```json
{
  "code": "<opaque-one-time-code>"
}
```

### Response chung của login/exchange

```json
{
  "data": {
    "accessToken": "<JWT>",
    "tokenType": "Bearer",
    "expiresAt": "2026-10-03T11:00:00Z",
    "student": {
      "id": "student-bon",
      "studentCode": "HV000123",
      "fullName": "Hữu Văn",
      "nickname": "Bon"
    }
  }
}
```

### POST /auth/logout

Không cần body. Gửi Authorization: Bearer <accessToken>. Backend thu hồi session chứa JWT hiện tại; các request dùng lại token trả 401. Response:

```json
{
  "data": { "loggedOut": true }
}
```

Frontend luôn xóa phiên/cache/lựa chọn lớp và Unit sau thao tác logout, kể cả khi mạng lỗi; backend session khi ấy vẫn tồn tại đến expiry nếu chưa nhận được yêu cầu thu hồi.

### GET /me

```json
{
  "data": {
    "id": "student-bon",
    "studentCode": "HV000123",
    "fullName": "Hữu Văn",
    "nickname": "Bon"
  }
}
```

### GET /me/classes

```json
{
  "data": {
    "items": [
      {
        "id": "juniors-02",
        "name": "Juniors 02",
        "subject": "Tiếng Anh",
        "isActive": false
      },
      {
        "id": "juniors-03",
        "name": "Juniors 03",
        "subject": "Tiếng Anh",
        "isActive": true
      }
    ]
  }
}
```

### GET /me/classes/{classId}/units

```json
{
  "data": {
    "items": [
      {
        "id": "u2",
        "name": "Unit 2",
        "order": 2,
        "hasReport": true
      },
      {
        "id": "u1",
        "name": "Unit 1",
        "order": 1,
        "hasReport": true
      },
      {
        "id": "u3",
        "name": "Unit 3",
        "order": 3,
        "hasReport": true
      }
    ]
  }
}
```

### GET /me/classes/{classId}/units/{unitId}/report

```json
{
  "data": {
    "classId": "juniors-03",
    "unitId": "u3",
    "testedAt": null,
    "total": {
      "score": 23.1,
      "maxScore": 35,
      "percentage": 66
    },
    "skills": [
      {
        "code": "vocabulary",
        "score": 1,
        "maxScore": 4,
        "percentage": 25,
        "comment": "Vốn từ còn hạn chế ở các chủ đề của Unit 3. Cần ôn lại từ vựng theo chủ đề và đặt câu để sử dụng tự nhiên hơn."
      },
      {
        "code": "grammar",
        "score": 3,
        "maxScore": 3,
        "percentage": 100,
        "comment": "Nắm chắc cấu trúc ngữ pháp trong bài. Hãy tiếp tục duy trì và vận dụng linh hoạt."
      },
      {
        "code": "pronunciation",
        "score": 2,
        "maxScore": 3,
        "percentage": 66.7,
        "comment": "Phát âm khá tốt, một số âm còn chưa ổn định. Nên nghe và nhắc lại theo mẫu ngắn."
      },
      {
        "code": "listening",
        "score": 10,
        "maxScore": 11,
        "percentage": 90.9,
        "comment": "Nghe tốt, hiểu nội dung chính và chi tiết. Đây là kỹ năng tiến bộ rõ nhất qua ba Unit."
      },
      {
        "code": "reading",
        "score": 4,
        "maxScore": 5,
        "percentage": 80,
        "comment": "Đọc hiểu tốt, trả lời đúng phần lớn câu hỏi. Có thể luyện thêm để tăng tốc độ đọc."
      },
      {
        "code": "speaking",
        "score": 2.1,
        "maxScore": 4,
        "percentage": 52.5,
        "comment": "Có thể trả lời câu hỏi cơ bản nhưng còn ngập ngừng. Nên luyện nói thường xuyên hơn."
      },
      {
        "code": "writing",
        "score": 1,
        "maxScore": 5,
        "percentage": 20,
        "comment": "Kỹ năng viết còn yếu. Nên luyện viết câu đơn đúng trước, sau đó mở rộng thành đoạn ngắn."
      }
    ],
    "overallComment": "Ở Unit 3, Hữu Văn có điểm mạnh rõ ở Grammar, Listening và Reading. Đây là những kỹ năng đang ổn định và có tiến bộ tốt so với Unit 1. Tuy nhiên, Vocabulary và Writing là hai kỹ năng giảm đáng kể so với Unit trước, và đang kéo tổng điểm xuống. Speaking cũng có xu hướng giảm nhẹ. Con cần luyện nói thường xuyên hơn để tăng sự tự tin và khả năng diễn đạt.",
    "advice": [
      "Ôn từ vựng theo chủ đề và đặt câu.",
      "Luyện viết đoạn ngắn 3–5 câu.",
      "Thực hành nói hằng ngày với câu hoàn chỉnh.",
      "Tiếp tục duy trì Grammar, Listening, Reading."
    ]
  }
}
```

### GET /me/classes/{classId}/progress

```json
{
  "data": {
    "items": [
      {
        "unitId": "u1",
        "unitOrder": 1,
        "unitName": "Unit 1",
        "totalPercentage": 67.3,
        "skills": {
          "vocabulary": 80,
          "grammar": 80,
          "pronunciation": 0,
          "listening": 54,
          "reading": 53.8,
          "speaking": 70,
          "writing": 76.5
        }
      },
      {
        "unitId": "u2",
        "unitOrder": 2,
        "unitName": "Unit 2",
        "totalPercentage": 76.5,
        "skills": {
          "vocabulary": 75,
          "grammar": 100,
          "pronunciation": 73.3,
          "listening": 72.7,
          "reading": 77.3,
          "speaking": 60,
          "writing": 78.6
        }
      },
      {
        "unitId": "u3",
        "unitOrder": 3,
        "unitName": "Unit 3",
        "totalPercentage": 66,
        "skills": {
          "vocabulary": 25,
          "grammar": 100,
          "pronunciation": 66.7,
          "listening": 90.9,
          "reading": 80,
          "speaking": 52.5,
          "writing": 20
        }
      }
    ]
  }
}
```

### GET /me/classes/{classId}/materials

```json
{
  "data": {
    "items": [
      {
        "id": "pdf",
        "title": "Tài liệu PDF mẫu",
        "type": "pdf",
        "unitId": "u3",
        "sizeBytes": null,
        "durationSeconds": null
      },
      {
        "id": "audio",
        "title": "Âm thanh minh họa",
        "type": "audio",
        "unitId": "u3",
        "sizeBytes": null,
        "durationSeconds": null
      },
      {
        "id": "video",
        "title": "Video minh họa",
        "type": "video",
        "unitId": null,
        "sizeBytes": null,
        "durationSeconds": null
      },
      {
        "id": "link",
        "title": "British Council · LearnEnglish Kids",
        "type": "link",
        "unitId": null,
        "sizeBytes": null,
        "durationSeconds": null
      }
    ]
  }
}
```

### POST /me/classes/{classId}/materials/{materialId}/access

Không cần body. Response

```json
{
  "data": {
    "url": "https://cdn.example.com/file.pdf?signature=<opaque-signature>",
    "expiresAt": "2026-10-03T10:05:00Z"
  }
}
```

## Lỗi

Response lỗi chuẩn:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu chưa hợp lệ.",
    "fieldErrors": {
      "studentId": "Nhập ID học sinh.",
      "password": "Nhập mật khẩu."
    }
  }
}
```

| HTTP | code mẫu | Khi sử dụng |
| --- | --- | --- |
| 400 | VALIDATION_ERROR / INVALID_CODE | Body sai, thiếu dữ liệu hoặc mã link không hợp lệ |
| 401 | INVALID_CREDENTIALS / TOKEN_EXPIRED / INVALID_TOKEN | Sai thông tin đăng nhập; JWT thiếu, hết hạn hoặc không hợp lệ |
| 403 | FORBIDDEN | Học sinh không có quyền với lớp/unit/tài liệu |
| 404 | NOT_FOUND | Không tồn tại đối tượng; có thể dùng để không tiết lộ tài nguyên |
| 410 | CODE_EXPIRED / CODE_USED | Mã link hết hạn hoặc đã tiêu thụ |
| 429 | RATE_LIMITED | Rate limit login/exchange/access, gửi Retry-After |
| 500 | INTERNAL_ERROR | Lỗi backend; không trả stack trace hoặc thông tin nhạy cảm |

Mỗi lỗi dùng cùng envelope error với code và thông báo phù hợp tiếng Việt; fieldErrors tùy chọn. Frontend có timeout cấu hình bằng NEXT_PUBLIC_API_TIMEOUT_MS (mặc định 15s), loading/empty/error và retry cho query; không tự phát lại mutation exchange/access.

## Tài liệu có thời hạn

Endpoint access kiểm tra học sinh thuộc lớp và có quyền với materialId rồi trả URL HTTPS có thời hạn. Không đính kèm JWT vào URL. CDN/backend phải thực thi expiry, quyền đối tượng và Content-Type; frontend kiểm tra scheme/expiry, có trình phát audio/video và link mở tab mới. Cho phép range requests với media và CORS/CDN phù hợp nếu cần. Không cache response cấp URL tại proxy công khai (Cache-Control: no-store).

## CORS, HTTPS và vận hành

Production dùng HTTPS. Allow-Origin cho GitHub Pages là https://vqviet03.github.io (không có /ess-edu-portal); thêm đúng origin custom domain nếu dùng. Cho phép GET, POST, OPTIONS và headers Authorization, Content-Type, Accept; xử lý preflight OPTIONS. Dev thêm http://localhost:3000. Không dùng wildcard để thay kiểm tra quyền; ứng dụng dùng Bearer, không yêu cầu credential cookie cross-site.

Auth/exchange, /me và báo cáo dùng Cache-Control: no-store hoặc private phù hợp. Rate-limit login/exchange, hạn chế brute force; redact Authorization, password, code trong logs. Thử nghiệm quyền bằng học sinh A truy cập tài nguyên B trên mọi endpoint. Frontend chỉ gọi backend qua RTK Query/fetchBaseQuery; cấu hình NEXT_PUBLIC_API_BASE_URL rồi build lại để kết nối. URL gốc tự thêm /v1; URL đã có /v1 không bị thêm hai lần. Production build từ chối cấu hình thiếu/sai; lỗi hoặc dữ liệu rỗng từ backend được hiển thị trực tiếp, không tạo dữ liệu thay thế. Biến NEXT_PUBLIC_* công khai, không chứa secret.
