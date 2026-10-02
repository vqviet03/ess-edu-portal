export type Student = { id: string; name: string; className: string; courseName: string };
export type Session = { token: string; student: Student };
export type Lesson = { id: string; title: string; type: string; minutes: number; completed: boolean };
export type UnitSummary = {
  id: string;
  order: number;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  minutes: number;
};
export type Unit = UnitSummary & { objectives: string[]; lessons: Lesson[] };
export type Classroom = {
  id: string;
  name: string;
  level: string;
  teacher: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
};
export type SkillResult = {
  id: "listening" | "speaking" | "reading" | "writing";
  label: string;
  score: number;
  previousScore: number | null;
  comment: string;
};
export type UnitReport = {
  unit: Unit;
  startDate: string;
  endDate: string;
  averageScore: number;
  previousScore: number | null;
  attendance: { attended: number; total: number };
  homework: { submitted: number; total: number };
  skills: SkillResult[];
  history: { unitId: string; order: number; title: string; score: number }[];
  feedback: { teacher: string; message: string; strengths: string[]; improvements: string[] };
};
export type LearningDocument = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "PDF" | "HTML";
  size: string;
  updatedAt: string;
  url: string;
};
export interface StudentApi {
  login(studentId: string, password: string): Promise<Session>;
  getStudent(token: string, signal?: AbortSignal): Promise<Student>;
  getUnits(token: string, signal?: AbortSignal): Promise<UnitSummary[]>;
  getUnit(token: string, id: string, signal?: AbortSignal): Promise<Unit>;
  getClasses(token: string, signal?: AbortSignal): Promise<Classroom[]>;
  getClassUnits(token: string, classId: string, signal?: AbortSignal): Promise<UnitSummary[]>;
  getUnitReport(token: string, classId: string, unitId: string, signal?: AbortSignal): Promise<UnitReport>;
  getDocuments(token: string, classId: string, signal?: AbortSignal): Promise<LearningDocument[]>;
}
export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); this.name = "ApiError"; }
}
export function percent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.max(0, Math.round(done / total * 100))) : 0;
}
