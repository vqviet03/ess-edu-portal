import { AuthSession, Class, Material, ProgressEntry, Report, Student, Unit, skillCodes } from '../models';
export const student: Student = { id: 'student-bon', studentCode: 'HV000123', fullName: 'Hữu Văn', nickname: 'Bon' };
export const classes: Class[] = [
  { id: 'juniors-02', name: 'Juniors 02', subject: 'Tiếng Anh', isActive: false },
  { id: 'juniors-03', name: 'Juniors 03', subject: 'Tiếng Anh', isActive: true },
];
export const units: Unit[] = [{ id: 'u2', name: 'Unit 2', order: 2, hasReport: true }, { id: 'u1', name: 'Unit 1', order: 1, hasReport: true }, { id: 'u3', name: 'Unit 3', order: 3, hasReport: true }];
const values = [[80, 80, 0, 54, 53.8, 70, 76.5], [75, 100, 73.3, 72.7, 77.3, 60, 78.6], [25, 100, 66.7, 90.9, 80, 52.5, 20]];
export const progress: ProgressEntry[] = values.map((row, i) => ({ unitId: `u${i + 1}`, unitOrder: i + 1, unitName: `Unit ${i + 1}`, totalPercentage: [67.3, 76.5, 66.0][i], skills: Object.fromEntries(skillCodes.map((code, j) => [code, row[j]])) as ProgressEntry['skills'] }));
const comments = [
  'Vốn từ còn hạn chế ở các chủ đề của Unit 3. Cần ôn lại từ vựng theo chủ đề và đặt câu để sử dụng tự nhiên hơn.',
  'Nắm chắc cấu trúc ngữ pháp trong bài. Hãy tiếp tục duy trì và vận dụng linh hoạt.',
  'Phát âm khá tốt, một số âm còn chưa ổn định. Nên nghe và nhắc lại theo mẫu ngắn.',
  'Nghe tốt, hiểu nội dung chính và chi tiết. Đây là kỹ năng tiến bộ rõ nhất qua ba Unit.',
  'Đọc hiểu tốt, trả lời đúng phần lớn câu hỏi. Có thể luyện thêm để tăng tốc độ đọc.',
  'Có thể trả lời câu hỏi cơ bản nhưng còn ngập ngừng. Nên luyện nói thường xuyên hơn.',
  'Kỹ năng viết còn yếu. Nên luyện viết câu đơn đúng trước, sau đó mở rộng thành đoạn ngắn.',
];
export const reports: Report[] = progress.map((entry, index) => ({
  classId: 'juniors-03', unitId: entry.unitId, testedAt: null,
  total: { score: index === 2 ? 23.1 : null, maxScore: index === 2 ? 35 : null, percentage: entry.totalPercentage },
  skills: skillCodes.map((code, i) => ({ code, score: index === 2 ? [1, 3, 2, 10, 4, 2.1, 1][i] : null, maxScore: index === 2 ? [4, 3, 3, 11, 5, 4, 5][i] : null, percentage: entry.skills[code], comment: index === 2 ? comments[i] : null })),
  overallComment: index === 2 ? 'Ở Unit 3, Hữu Văn có điểm mạnh rõ ở Grammar, Listening và Reading. Đây là những kỹ năng đang ổn định và có tiến bộ tốt so với Unit 1. Tuy nhiên, Vocabulary và Writing là hai kỹ năng giảm đáng kể so với Unit trước, và đang kéo tổng điểm xuống. Speaking cũng có xu hướng giảm nhẹ. Con cần luyện nói thường xuyên hơn để tăng sự tự tin và khả năng diễn đạt.' : null,
  advice: index === 2 ? ['Ôn từ vựng theo chủ đề và đặt câu.', 'Luyện viết đoạn ngắn 3–5 câu.', 'Thực hành nói hằng ngày với câu hoàn chỉnh.', 'Tiếp tục duy trì Grammar, Listening, Reading.'] : [],
}));
export const materials: Material[] = [
  { id: 'pdf', title: 'Tài liệu PDF mẫu', type: 'pdf', unitId: 'u3', sizeBytes: null, durationSeconds: null },
  { id: 'audio', title: 'Âm thanh minh họa', type: 'audio', unitId: 'u3', sizeBytes: null, durationSeconds: null },
  { id: 'video', title: 'Video minh họa', type: 'video', unitId: null, sizeBytes: null, durationSeconds: null },
  { id: 'link', title: 'British Council · LearnEnglish Kids', type: 'link', unitId: null, sizeBytes: null, durationSeconds: null },
];
export const materialUrls: Record<string, string> = {
  pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  audio: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  link: 'https://learnenglishkids.britishcouncil.org/',
};
export const accounts = ['HV000123', 'HVEMPTY', 'HVNOUNITS', 'HVNOREPORT', 'HVFORBIDDEN', 'HVERROR', 'HVEXPIRED'];
export function mockSession(id: string): AuthSession {
  const expiry = Date.now() + (id === 'HVEXPIRED' ? -1000 : 60 * 60 * 1000);
  return { accessToken: `mock.${id}.${expiry}`, tokenType: 'Bearer', expiresAt: new Date(expiry).toISOString(), student: { ...student, studentCode: id } };
}
