import test from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_KEY, readSession, writeSession } from '../src/auth/session';
import { testSession } from './support/data';

test('browser session restores only a valid JWT for the configured backend and logout clears it', () => {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  try {
    const session = testSession(); writeSession(session); assert.deepEqual(readSession(), session);
    const stored = JSON.parse(values.get(SESSION_KEY)!);
    assert.deepEqual(Object.keys(stored).sort(), ['accessToken', 'apiBaseUrl', 'expiresAt', 'student', 'tokenType']);
    values.set(SESSION_KEY, JSON.stringify({...stored, apiBaseUrl:'https://other-backend.example/v1'})); assert.equal(readSession(), null);
    for (const accessToken of ['', 'legacy.HV000123.123', 'not-a-jwt']) {
      values.set(SESSION_KEY, JSON.stringify({...stored, accessToken})); assert.equal(readSession(), null);
    }
    writeSession(testSession('expired', Date.now() - 1000)); assert.equal(readSession(), null);
    writeSession(null); assert.equal(values.has(SESSION_KEY), false); assert.equal(readSession(), null);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
