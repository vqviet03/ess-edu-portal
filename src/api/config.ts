export interface ApiConfiguration {
  baseUrl: string;
  timeout: number;
  error: string | null;
}

export function resolveApiConfiguration(value?: string, timeoutValue: string | number = 15000): ApiConfiguration {
  const timeout = Number(timeoutValue);
  const config: ApiConfiguration = { baseUrl: '', timeout, error: null };
  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 120000) config.error = 'NEXT_PUBLIC_API_TIMEOUT_MS phải là số nguyên từ 1 đến 120000.';
  else {
    try {
      const url = new URL(value?.trim() ?? '');
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error();
      url.pathname = url.pathname.replace(/\/+$/, '') || '/v1';
      config.baseUrl = url.toString().replace(/\/$/, '');
    } catch {
      config.error = 'NEXT_PUBLIC_API_BASE_URL cần URL HTTPS của backend, ví dụ https://<cloud-run-host>/v1 (HTTP chỉ dùng localhost).';
    }
  }
  return config;
}

export const apiConfiguration = resolveApiConfiguration(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? '15000',
);
