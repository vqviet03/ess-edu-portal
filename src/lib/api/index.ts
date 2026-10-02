import { mockApi } from "./mock";
import { ApiError, type Classroom, type LearningDocument, type Session, type Student, type StudentApi, type Unit, type UnitReport, type UnitSummary } from "./types";

export const isMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
async function request<T>(path: string, token?: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new ApiError("Chưa cấu hình địa chỉ API.");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET", signal, cache: "no-store",
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("Không kết nối được máy chủ. Vui lòng thử lại.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(
    response.status === 401 ? "ID, mật khẩu hoặc phiên đăng nhập không hợp lệ." : "Không tải được dữ liệu. Vui lòng thử lại.", response.status,
  );
  if (data === null) throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ.");
  return data as T;
}
const realApi: StudentApi = {
  login: (studentId, password) => request<Session>("/auth/login", undefined, { studentId, password }),
  getStudent: (token, signal) => request<Student>("/students/me", token, undefined, signal),
  getUnits: (token, signal) => request<UnitSummary[]>("/students/me/units", token, undefined, signal),
  getUnit: (token, id, signal) => request<Unit>(`/students/me/units/${encodeURIComponent(id)}`, token, undefined, signal),
  getClasses: (token, signal) => request<Classroom[]>("/students/me/classes", token, undefined, signal),
  getClassUnits: (token, classId, signal) => request<UnitSummary[]>(`/students/me/classes/${encodeURIComponent(classId)}/units`, token, undefined, signal),
  getUnitReport: (token, classId, unitId, signal) => request<UnitReport>(`/students/me/classes/${encodeURIComponent(classId)}/units/${encodeURIComponent(unitId)}/report`, token, undefined, signal),
  getDocuments: (token, classId, signal) => request<LearningDocument[]>(`/students/me/classes/${encodeURIComponent(classId)}/documents`, token, undefined, signal),
};
export const api: StudentApi = isMockApi ? mockApi : realApi;
const SESSION_KEY = "student-portal-token";
export const session = {
  get: () => sessionStorage.getItem(SESSION_KEY),
  save: (token: string) => sessionStorage.setItem(SESSION_KEY, token),
  clear: () => sessionStorage.removeItem(SESSION_KEY),
};
