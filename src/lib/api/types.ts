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
export interface StudentApi {
  login(studentId: string, password: string): Promise<Session>;
  getStudent(token: string, signal?: AbortSignal): Promise<Student>;
  getUnits(token: string, signal?: AbortSignal): Promise<UnitSummary[]>;
  getUnit(token: string, id: string, signal?: AbortSignal): Promise<Unit>;
}
export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); this.name = "ApiError"; }
}
export function percent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.max(0, Math.round(done / total * 100))) : 0;
}
