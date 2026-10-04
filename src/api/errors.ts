import type { ApiFailure } from '../models';
export function errorDetails(error: unknown): ApiFailure['error'] {
  if (error && typeof error === 'object' && 'data' in error) {
    const payload = error.data as ApiFailure | undefined;
    if (payload?.error?.message) return payload.error;
  }
  if (error && typeof error === 'object' && 'status' in error && error.status === 403) return {code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập dữ liệu này.'};
  if (error && typeof error === 'object' && 'status' in error && error.status === 404) return {code: 'NOT_FOUND', message: 'Chưa có dữ liệu hoặc dữ liệu không còn tồn tại.'};
  if (error && typeof error === 'object' && 'status' in error && error.status === 'TIMEOUT_ERROR') return {code: 'TIMEOUT', message: 'Máy chủ phản hồi chậm. Vui lòng thử lại.'};
  return {code: 'NETWORK_ERROR', message: 'Không thể kết nối máy chủ. Vui lòng thử lại.'};
}
