import { ApiError, type Classroom, type LearningDocument, type SkillResult, type Student, type StudentApi, type Unit, type UnitReport } from "./types";

export const DEMO = { studentId: "HS001", password: "demo123" };
// Unsigned demo JWT only. Real authentication is verified by the backend.
const MOCK_TOKEN = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJIUzAwMSIsImRlbW8iOnRydWV9.";
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
  if (token !== MOCK_TOKEN) throw new ApiError("Phiên đăng nhập đã hết hạn.", 401);
  return structuredClone(value);
}
const classrooms: Classroom[] = [
  { id: "starter-a1", name: "Starter A1 · Lớp 01", level: "A1", teacher: "Cô Thu Hà", isActive: false, startDate: "2026-01-10", endDate: "2026-05-30" },
  { id: "explorer-a2", name: "Explorer A2 · Lớp 02", level: "A2", teacher: "Cô Ngọc Anh", isActive: true, startDate: "2026-06-01", endDate: "2026-12-15" },
];
function classUnits(classId: string): Unit[] {
  if (!classrooms.some(item => item.id === classId)) throw new ApiError("Không tìm thấy lớp học.", 404);
  return units.slice(0, classId === "explorer-a2" ? 4 : 6).map((unit, i) => {
    const done = classId === "explorer-a2" && i === 3 ? 3 : unit.totalLessons;
    return { ...unit, completedLessons: done, lessons: unit.lessons.map((lesson, j) => ({ ...lesson, completed: j < done })) };
  });
}
function unitReport(classId: string, unitId: string): UnitReport {
  const list = classUnits(classId);
  const unit = list.find(item => item.id === unitId);
  if (!unit) throw new ApiError("Không tìm thấy báo cáo unit.", 404);
  const scores = classId === "explorer-a2" ? [68, 74, 82, 88] : [65, 72, 69, 80, 83, 86];
  const index = unit.order - 1;
  const previousScore = index ? scores[index - 1] : null;
  const labels: [SkillResult["id"], string, number, string][] = [
    ["listening", "Nghe", 2, "Nhận biết tốt ý chính trong các đoạn hội thoại."],
    ["speaking", "Nói", -3, "Tự tin giao tiếp; tiếp tục luyện phát âm."],
    ["reading", "Đọc", 4, "Hiểu nội dung và tìm thông tin khá tốt."],
    ["writing", "Viết", -3, "Viết câu rõ ràng; chú ý chia động từ."],
  ];
  return {
    unit, startDate: `2026-0${classId === "explorer-a2" ? 6 + index : 1 + index}-01`, endDate: `2026-0${classId === "explorer-a2" ? 6 + index : 1 + index}-28`,
    averageScore: scores[index], previousScore,
    attendance: { attended: index === 3 ? 7 : 8, total: 8 },
    homework: { submitted: index === 3 ? 5 : 6, total: 6 },
    skills: labels.map(([id, label, offset, comment]) => ({ id, label, comment, score: scores[index] + offset, previousScore: previousScore === null ? null : previousScore + offset })),
    history: list.slice(0, index + 1).map((item, i) => ({ unitId: item.id, order: item.order, title: item.title, score: scores[i] })),
    feedback: {
      teacher: classrooms.find(item => item.id === classId)!.teacher,
      message: "Minh Anh chủ động tham gia các hoạt động trên lớp và có sự tiến bộ rõ rệt. Con hãy duy trì thói quen ôn tập mỗi ngày để sử dụng kiến thức tự nhiên hơn.",
      strengths: ["Tự tin trao đổi và hợp tác với bạn bè", "Nắm vững từ vựng theo chủ đề"],
      improvements: ["Luyện phát âm và ngữ điệu 10 phút mỗi ngày", "Kiểm tra chia động từ khi viết câu"],
    },
  };
}
const documentBase = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/materials-demo`;
function documents(classId: string): LearningDocument[] {
  const classroom = classrooms.find(item => item.id === classId);
  if (!classroom) throw new ApiError("Không tìm thấy lớp học.", 404);
  return [
    { id: `${classId}-guide`, title: `Lộ trình học ${classroom.level}`, description: "Nội dung khóa học và hướng dẫn ôn tập tại nhà.", category: "Hướng dẫn", type: "HTML", size: "3 KB", updatedAt: "2026-09-25", url: `${documentBase}/${classroom.level.toLowerCase()}-guide.html` },
    { id: `${classId}-practice`, title: `Phiếu ôn tập ${classroom.level}`, description: "Các hoạt động ôn tập từ vựng và giao tiếp.", category: "Bài tập", type: "HTML", size: "3 KB", updatedAt: "2026-09-28", url: `${documentBase}/${classroom.level.toLowerCase()}-practice.html` },
  ];
}
export const mockApi: StudentApi = {
  async login(studentId, password) {
    await new Promise(resolve => setTimeout(resolve, 350));
    if (studentId.trim().toUpperCase() !== DEMO.studentId || password !== DEMO.password) {
      throw new ApiError("ID học sinh hoặc mật khẩu chưa đúng.", 401);
    }
    return { token: MOCK_TOKEN, student: structuredClone(student) };
  },
  getStudent: (token, signal) => mockResponse(token, student, signal),
  getUnits: (token, signal) => mockResponse(token, units.map(({ lessons, objectives, ...unit }) => { void lessons; void objectives; return unit; }), signal),
  async getUnit(token, id, signal) {
    const unit = units.find(unit => unit.id === id);
    if (!unit) throw new ApiError("Không tìm thấy unit này.", 404);
    return mockResponse(token, unit, signal);
  },
  getClasses: (token, signal) => mockResponse(token, classrooms, signal),
  getClassUnits: async (token, classId, signal) => mockResponse(token, classUnits(classId).map(({ lessons, objectives, ...unit }) => { void lessons; void objectives; return unit; }), signal),
  getUnitReport: async (token, classId, unitId, signal) => mockResponse(token, unitReport(classId, unitId), signal),
  getDocuments: async (token, classId, signal) => mockResponse(token, documents(classId), signal),
};
