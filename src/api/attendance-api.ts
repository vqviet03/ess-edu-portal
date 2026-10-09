import { api } from "./api";
import type { Envelope } from "@/models";
import type { StudentAttendance } from "@/features/attendance/models";
export const attendanceApi = api.injectEndpoints({
  endpoints: (b) => ({
    studentAttendance: b.query<
      StudentAttendance,
      { classId: string; month: string; status: string; page: number }
    >({
      query: ({ classId, ...params }) => ({
        url: `/me/classes/${encodeURIComponent(classId)}/attendance`,
        params: { ...params, status: params.status || undefined, pageSize: 20 },
      }),
      transformResponse: (r: Envelope<StudentAttendance>) => r.data,
      providesTags: (_, __, q) => [{ type: "Attendance", id: q.classId }],
    }),
  }),
});
export const { useStudentAttendanceQuery } = attendanceApi;
