import type { AuthSession } from '../models';
import { apiConfiguration } from '../api/config';
export const SESSION_KEY = 'learnleaf.session';
export function expiryTime(expiresAt: string | null, token?: string | null) {
  let deadline = expiresAt ? Date.parse(expiresAt) : 0;
  if (!Number.isFinite(deadline)) return 0;
  // JWT exp is an additional expiry check, never proof of authentication.
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return 0;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= 0) return 0;
      deadline = Math.min(deadline, payload.exp * 1000);
    } catch { return 0; }
  }
  return deadline;
}
export const expired = (expiresAt: string | null, token?: string | null) => expiryTime(expiresAt, token) <= Date.now();
export function readSession(): AuthSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!value || typeof value.accessToken !== 'string' || !value.accessToken || typeof value.expiresAt !== 'string' || value.tokenType !== 'Bearer' || expired(value.expiresAt, value.accessToken)) return null;
    if (!value.student || typeof value.student.id !== 'string' || typeof value.student.studentCode !== 'string' || typeof value.student.fullName !== 'string') return null;
    if (value.apiBaseUrl !== apiConfiguration.baseUrl) return null;
    return { accessToken: value.accessToken, tokenType: 'Bearer', expiresAt: value.expiresAt, student: value.student };
  } catch { return null; }
}
export function writeSession(value: AuthSession | null) {
  try { if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify({...value, apiBaseUrl: apiConfiguration.baseUrl})); else sessionStorage.removeItem(SESSION_KEY); } catch { /* Redux keeps the current in-memory session if storage is unavailable. */ }
}
export function consumeLinkCode(): string | null {
  const hash = window.location.hash.slice(1);
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  return new URLSearchParams(hash).get('code');
}
