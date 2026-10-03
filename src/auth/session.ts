import type { AuthSession } from '../models';
export const SESSION_KEY = 'learnleaf.session';
export function expiryTime(expiresAt: string | null, token?: string | null) {
  let deadline = expiresAt ? Date.parse(expiresAt) : 0;
  if (!Number.isFinite(deadline)) return 0;
  // JWT exp is an additional expiry check, never proof of authentication.
  if (token && !token.startsWith('mock.')) {
    try { const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (typeof payload.exp === 'number') deadline = Math.min(deadline, payload.exp * 1000); } catch { /* Backend /me validates token authenticity. */ }
  }
  return deadline;
}
export const expired = (expiresAt: string | null, token?: string | null) => expiryTime(expiresAt, token) <= Date.now();
export function readSession(): AuthSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return value && typeof value.accessToken === 'string' && value.tokenType === 'Bearer' && !expired(value.expiresAt, value.accessToken) ? value : null;
  } catch { return null; }
}
export function writeSession(value: AuthSession | null) {
  try { if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); else sessionStorage.removeItem(SESSION_KEY); } catch { /* Redux keeps the current in-memory session if storage is unavailable. */ }
}
export function consumeLinkCode(): string | null {
  const hash = window.location.hash.slice(1);
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  return new URLSearchParams(hash).get('code');
}
