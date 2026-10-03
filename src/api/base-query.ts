import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { AuthState } from '../store/auth';
import { loggedOut } from '../store/auth';
import { expired } from '../auth/session';
export type AppBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;
export function createAppBaseQuery(mode: string, baseUrl?: string): AppBaseQuery {
  const real = fetchBaseQuery({ baseUrl, timeout: 15000, prepareHeaders(headers, { getState, endpoint }) {
    const token = (getState() as {auth: AuthState}).auth.accessToken;
    if (token && endpoint !== 'login' && endpoint !== 'exchange') headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return headers;
  }});
  return async (args, api, extra) => {
    if (!['mock', 'real'].includes(mode) || (mode === 'real' && !baseUrl?.trim())) return { error: { status: 'CUSTOM_ERROR', error: 'Chưa cấu hình API.', data: { error: { code: 'CONFIGURATION_ERROR', message: 'Thiếu hoặc sai cấu hình API. Vui lòng liên hệ quản trị viên.' } } } };
    const url = typeof args === 'string' ? args : args.url;
    const protectedRequest = !url.startsWith('/auth/');
    const auth = (api.getState() as {auth: AuthState}).auth;
    const originalToken = auth.accessToken;
    if (protectedRequest && (!originalToken || expired(auth.expiresAt, originalToken))) {
      api.dispatch(loggedOut('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      return { error: { status: 401, data: { error: { code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn.' } } } };
    }
    const result = mode === 'mock' ? await (await import('../mock/base-query')).mockBaseQuery(args, api, extra) : await real(args, api, extra);
    if (protectedRequest && result.error?.status === 401 && (api.getState() as {auth: AuthState}).auth.accessToken === originalToken) api.dispatch(loggedOut('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'));
    return result;
  };
}
