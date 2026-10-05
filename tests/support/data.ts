// Synthetic HTTP response data for tests only. Never imported by the application.
import { AuthSession, Class, Material, ProgressEntry, Report, Student, Unit, skillCodes } from '../../src/models';
export const student: Student = { id: 'student-test', studentCode: 'HV000123', fullName: 'Học Sinh Kiểm Thử', nickname: 'Test' };
export const classes: Class[] = [
  { id: 'juniors-02', name: 'Juniors 02', subject: 'Tiếng Anh', isActive: false },
  { id: 'juniors-03', name: 'Juniors 03', subject: 'Tiếng Anh', isActive: true },
];
export const units: Unit[] = [{ id: 'u2', name: 'Unit 2', order: 2, hasReport: true }, { id: 'u1', name: 'Unit 1', order: 1, hasReport: true }, { id: 'u3', name: 'Unit 3', order: 3, hasReport: true }];
const values = [[80, 80, 0, 54, 53.8, 70, 76.5], [75, 100, 73.3, 72.7, 77.3, 60, 78.6], [25, 100, 66.7, 90.9, 80, 52.5, 20]];
export const progress: ProgressEntry[] = values.map((row, i) => ({ unitId: `u${i + 1}`, unitOrder: i + 1, unitName: `Unit ${i + 1}`, totalPercentage: [67.3, 76.5, 66.0][i], skills: Object.fromEntries(skillCodes.map((code, j) => [code, row[j]])) as ProgressEntry['skills'] }));
const comments = skillCodes.map(code => `Nhận xét kiểm thử ${code}.\nGiữ nguyên xuống dòng.`);
export const reports: Report[] = progress.map((entry, index) => ({
  classId: 'juniors-03', unitId: entry.unitId, testedAt: null,
  total: { score: index === 2 ? 23.1 : null, maxScore: index === 2 ? 35 : null, percentage: entry.totalPercentage },
  skills: skillCodes.map((code, i) => ({ code, score: index === 2 ? [1, 3, 2, 10, 4, 2.1, 1][i] : null, maxScore: index === 2 ? [4, 3, 3, 11, 5, 4, 5][i] : null, percentage: entry.skills[code], comment: index === 2 ? comments[i] : null })),
  overallComment: index === 2 ? 'Nhận xét tổng thể kiểm thử từ HTTP response.' : null,
  advice: index === 2 ? ['Lời khuyên kiểm thử 1.', 'Lời khuyên kiểm thử 2.', 'Lời khuyên kiểm thử 3.', 'Lời khuyên kiểm thử 4.'] : [],
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
export function testSession(id = student.studentCode, expiry = Date.now() + 3600000): AuthSession {
  const payload = Buffer.from(JSON.stringify({exp: Math.floor(expiry / 1000)})).toString('base64url');
  return { accessToken: `e30.${payload}.test-signature`, tokenType: 'Bearer', expiresAt: new Date(expiry).toISOString(), student: { ...student, studentCode: id } };
}
