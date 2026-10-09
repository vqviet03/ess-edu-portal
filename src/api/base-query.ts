import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { AuthState } from '../store/auth';
import { loggedOut } from '../store/auth';
import { expired } from '../auth/session';
import { errorDetails } from './errors';
import { resolveApiConfiguration } from './config';
export type AppBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;
export function createAppBaseQuery(baseUrl?: string, timeout: string | number = 15000): AppBaseQuery {
  const config = resolveApiConfiguration(baseUrl, timeout);
  const query = fetchBaseQuery({ baseUrl: config.baseUrl, timeout: config.timeout, prepareHeaders(headers, { getState, endpoint }) {
    const token = (getState() as {auth: AuthState}).auth.accessToken;
    if (token && !['login', 'exchange', 'applicationSettings'].includes(endpoint)) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return headers;
  }});
  return async (args, api, extra) => {
    if (config.error) return { error: { status: 'CUSTOM_ERROR', error: 'Chưa cấu hình API.', data: { error: { code: 'CONFIGURATION_ERROR', message: 'Hệ thống chưa sẵn sàng. Vui lòng liên hệ trung tâm.' } } } };
    const url = typeof args === 'string' ? args : args.url;
    const protectedRequest = !['/auth/login', '/auth/exchange', '/application-settings'].includes(url);
    const auth = (api.getState() as {auth: AuthState}).auth;
    const originalToken = auth.accessToken;
    if (protectedRequest && (!originalToken || expired(auth.expiresAt, originalToken))) {
      api.dispatch(loggedOut('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      return { error: { status: 401, data: { error: { code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn.' } } } };
    }
    const result = await query(args, api, extra);
    if (protectedRequest && result.error?.status === 401 && (api.getState() as {auth: AuthState}).auth.accessToken === originalToken) api.dispatch(loggedOut('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'));
    return result;
  };
}

export {errorDetails} from "./errors";
export function errorMessage(e: unknown) { return e instanceof Error ? e.message : errorDetails(e).message; }
