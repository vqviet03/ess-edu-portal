import { ApiError, type Student, type StudentApi, type Unit } from "./types";

export const DEMO = { studentId: "HS001", password: "demo123" };
const student: Student = { id: "HS001", name: "Nguyễn Minh Anh", className: "Lớp A2 · Khóa 2026", courseName: "Tiếng Anh nền tảng" };
const topics = [
  ["getting-to-know-you", "Getting to know you", "Làm quen, giới thiệu bản thân và những người xung quanh.", "Giới thiệu bản thân", "Hỏi và trả lời thông tin cá nhân"],
  ["everyday-life", "Everyday life", "Nói về thói quen và các hoạt động trong ngày.", "Miêu tả lịch sinh hoạt", "Sử dụng thì hiện tại đơn"],
  ["food-and-drink", "Food & drink", "Khám phá từ vựng về món ăn và giao tiếp tại nhà hàng.", "Gọi món và hỏi giá", "Sử dụng danh từ đếm được và không đếm được"],
  ["around-town", "Around town", "Khám phá các địa điểm và cách hỏi đường trong thành phố.", "Hỏi và chỉ đường", "Miêu tả vị trí với giới từ"],
  ["travel-stories", "Travel stories", "Kể về những chuyến đi và trải nghiệm đáng nhớ.", "Kể một câu chuyện trong quá khứ", "Sử dụng thì quá khứ đơn"],
  ["looking-ahead", "Looking ahead", "Chia sẻ dự định và lên kế hoạch cho tương lai.", "Nói về kế hoạch sắp tới", "Ôn tập kiến thức khóa học"],
];
const units: Unit[] = topics.map(([id, title, description, ...objectives], index) => {
  const done = index < 2 ? 4 : index === 2 ? 2 : 0;
  const lessons = [
    ["Từ vựng theo chủ đề", "Vocabulary", 15],
    ["Nghe và hội thoại", "Listening", 20],
    ["Ngữ pháp trong ngữ cảnh", "Grammar", 20],
    ["Luyện tập tổng hợp", "Practice", 15],
  ].map(([title, type, minutes], i) => ({ id: `${id}-${i + 1}`, title: String(title), type: String(type), minutes: Number(minutes), completed: i < done }));
  return { id, order: index + 1, title, description, objectives, lessons, totalLessons: 4, completedLessons: done, minutes: 70 };
});
async function mockResponse<T>(token: string, value: T, signal?: AbortSignal): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, 250));
  signal?.throwIfAborted();
  if (token !== "mock-HS001") throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
  return structuredClone(value);
}
export const mockApi: StudentApi = {
  async login(studentId, password) {
    await new Promise(resolve => setTimeout(resolve, 350));
    if (studentId.trim().toUpperCase() !== DEMO.studentId || password !== DEMO.password) {
      throw new ApiError("ID học sinh hoặc mật khẩu chưa đúng.", 401);
    }
    return { token: "mock-HS001", student: structuredClone(student) };
  },
  getStudent: (token, signal) => mockResponse(token, student, signal),
  getUnits: (token, signal) => mockResponse(token, units.map(({ lessons, objectives, ...unit }) => { void lessons; void objectives; return unit; }), signal),
  async getUnit(token, id, signal) {
    const unit = units.find(unit => unit.id === id);
    if (!unit) throw new ApiError("Không tìm thấy unit này.", 404);
    return mockResponse(token, unit, signal);
  },
};
