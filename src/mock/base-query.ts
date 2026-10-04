import type { FetchArgs } from '@reduxjs/toolkit/query';
import type { AppBaseQuery } from '../api/base-query';
import type { AuthState } from '../store/auth';
import { accounts, classes, materials, materialUrls, mockSession, progress, reports, student, units } from './fixtures';
const usedCodes = new Set<string>();
const fail = (status: number, code: string, message: string, fieldErrors?: Record<string, string>) => ({ error: { status, data: { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } } } });
export const mockBaseQuery: AppBaseQuery = async (input, api) => {
  await new Promise<void>(resolve => { if (api.signal.aborted) { resolve(); return; } const timer = setTimeout(done, 180); function done() { clearTimeout(timer); api.signal.removeEventListener('abort', done); resolve(); } api.signal.addEventListener('abort', done, { once: true }); });
  if (api.signal.aborted) return { error: { status: 'FETCH_ERROR', error: 'Request aborted' } };
  const args: FetchArgs = typeof input === 'string' ? {url: input} : input;
  const method = args.method ?? 'GET';
  const body = (args.body ?? {}) as Record<string, string>;
  if (args.url === '/auth/login' && method === 'POST') {
    if (!body.studentId?.trim() || !body.password) return fail(400, 'VALIDATION_ERROR', 'Vui lòng nhập đủ thông tin.', { studentId: 'Nhập ID học sinh.', password: 'Nhập mật khẩu.' });
    const id = body.studentId.trim().toUpperCase();
    return accounts.includes(id) && body.password === 'Demo123!' ? { data: { data: mockSession(id) } } : fail(401, 'INVALID_CREDENTIALS', 'ID học sinh hoặc mật khẩu không đúng.');
  }
  if (args.url === '/auth/exchange' && method === 'POST') {
    if (body.code === 'demo-expired') return fail(410, 'CODE_EXPIRED', 'Liên kết đã hết hạn. Vui lòng yêu cầu liên kết mới.');
    let consumed = usedCodes.has(body.code) || body.code === 'demo-used';
    try { consumed ||= sessionStorage.getItem('learnleaf.mock.used-code') === body.code; } catch {}
    if (consumed) return fail(410, 'CODE_USED', 'Liên kết đã được sử dụng. Vui lòng đăng nhập bằng ID.');
    if (body.code !== 'demo-bon') return fail(400, 'INVALID_CODE', 'Mã đăng nhập không hợp lệ.');
    usedCodes.add(body.code);
    try { sessionStorage.setItem('learnleaf.mock.used-code', body.code); } catch {}
    return { data: { data: mockSession('HV000123') } };
  }
  const token = (api.getState() as {auth: AuthState}).auth.accessToken;
  const [prefix, id, expiry] = (token ?? '').split('.');
  if (prefix !== 'mock' || !accounts.includes(id) || Number(expiry) <= Date.now() || !Number.isFinite(Number(expiry))) return fail(401, 'TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
  if (args.url === '/auth/logout' && method === 'POST') return { data: {data: {loggedOut: true}} };
  if (args.url === '/me' && method === 'GET') return { data: {data: {...student, studentCode: id}} };
  if (id === 'HVFORBIDDEN') return fail(403, 'FORBIDDEN', 'Bạn không có quyền truy cập dữ liệu này.');
  if (id === 'HVERROR') return fail(500, 'INTERNAL_ERROR', 'Hệ thống đang gặp sự cố. Vui lòng thử lại.');
  if (args.url === '/me/classes' && method === 'GET') return { data: {data: {items: id === 'HVEMPTY' ? [] : classes}} };
  const match = args.url.match(/^\/me\/classes\/([^/]+)\/(.*)$/);
  if (!match || !classes.some(item => item.id === match[1]) || id === 'HVEMPTY') return fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
  const [, classId, endpoint] = match;
  const empty = classId !== 'juniors-03';
  if (method === 'GET') {
    if (endpoint === 'units') return { data: { data: { items: empty || id === 'HVNOUNITS' ? [] : units.map(u => ({...u, hasReport: id !== 'HVNOREPORT'})) } } };
    if (endpoint === 'progress') return { data: { data: { items: empty || ['HVNOUNITS', 'HVNOREPORT'].includes(id) ? [] : progress } } };
    if (endpoint === 'materials') return { data: { data: { items: empty ? [] : materials } } };
    const reportMatch = endpoint.match(/^units\/([^/]+)\/report$/);
    const report = reportMatch && reports.find(r => r.unitId === reportMatch[1]);
    if (report && !empty && !['HVNOUNITS', 'HVNOREPORT'].includes(id)) return { data: {data: report} };
  }
  const access = endpoint.match(/^materials\/([^/]+)\/access$/);
  if (method === 'POST' && access && materialUrls[access[1]] && !empty) return { data: {data: {url: materialUrls[access[1]], expiresAt: new Date(Date.now() + 300000).toISOString()}} };
  return fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
};
