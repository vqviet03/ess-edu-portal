import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { difference, changes, selectClass, selectUnit } from '../src/models/report';
import { classes, testSession, progress, reports, units } from './support/data';
import { makeStore } from '../src/store';
import { signedIn, loggedOut } from '../src/store/auth';
import { createAppBaseQuery } from '../src/api/base-query';
import { expired } from '../src/auth/session';

function context(store = makeStore(), endpoint = 'classes'): BaseQueryApi {
  return { getState: store.getState, dispatch: store.dispatch, signal: new AbortController().signal, abort() {}, extra: undefined, endpoint, type: 'query' };
}
test('defaults respect API order, active class and highest unit; empty state', () => {
  assert.equal(selectClass(classes, null)?.id, 'juniors-03');
  assert.equal(selectClass(classes.map(c => ({...c, isActive: true})), null)?.id, classes[0].id);
  assert.equal(selectClass(classes.map(c => ({...c, isActive: false})), null)?.id, classes[0].id);
  assert.equal(selectUnit(units, null)?.order, 3);
  assert.equal(selectUnit(units, 'u1')?.order, 1);
  assert.equal(selectClass([], null), null); assert.equal(selectUnit([], null), null);
});
test('API report values preserve null raw scores, seven skills and advice', () => {
  assert.deepEqual(reports[2].total, {score: 23.1, maxScore: 35, percentage: 66});
  assert.equal(reports[2].skills.length, 7); assert.equal(reports[2].advice.length, 4);
  for (const report of reports.slice(0,2)) { assert.equal(report.total.score, null); assert.equal(report.overallComment, null); assert(report.skills.every(s => s.score === null && s.maxScore === null && s.comment === null)); }
  assert.equal(difference(78.6,20), -58.6); assert.equal(difference(0,73.3),73.3); assert.equal(difference(null,20),null);
  assert.deepEqual(changes([...progress].reverse(),'total').map(c => c.value), [9.2, -10.5]);
});
test('JWT expiration and invalid API expiry', () => {
  assert(expired('bad')); assert(expired(new Date(Date.now()-1).toISOString()));
  const jwt = `e30.${Buffer.from(JSON.stringify({exp:1})).toString('base64url')}.signature`;
  assert(expired(new Date(Date.now()+60000).toISOString(), jwt));
  assert(!expired(testSession().expiresAt, testSession().accessToken));
  for (const token of ['invalid', 'legacy.HV000123.123', 'e30.e30.signature', 'e30.bm90LWpzb24.signature']) assert(expired(new Date(Date.now()+60000).toISOString(), token));
});
test('missing backend URL returns a configuration error', async () => {
  const result = await createAppBaseQuery('')({url:'/auth/login',method:'POST',body:{}}, context(), {});
  assert.equal(result.error?.status,'CUSTOM_ERROR');
});
test('configured endpoint uses HTTP and Bearer; abort and expired-session checks are supported', async () => {
  const store = makeStore(); const session = testSession(); store.dispatch(signedIn(session));
  let calls = 0;
  const server = createServer((req,res) => {
    calls++;
    assert.equal(req.url,'/v1/me'); assert.equal(req.headers.authorization,`Bearer ${session.accessToken}`);
    res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({data: session.student}));
  }).listen(0,'127.0.0.1');
  await new Promise<void>(resolve => server.once('listening',resolve));
  try {
    const query = createAppBaseQuery(`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`);
    const result = await query('/me',context(store),{}); assert.deepEqual(result.data,{data:session.student});
    const controller = new AbortController(); controller.abort(); const aborted = await query('/me',{...context(store), signal:controller.signal},{}); assert.equal(aborted.error?.status,'FETCH_ERROR');
    assert.equal(calls, 1);
    store.dispatch(signedIn(testSession('expired', Date.now() - 1000)));
    const rejected = await query('/me',context(store),{}); assert.equal(rejected.error?.status,401); assert.equal(calls,1); assert.equal(store.getState().auth.status,'guest');
  } finally { store.dispatch(loggedOut()); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
