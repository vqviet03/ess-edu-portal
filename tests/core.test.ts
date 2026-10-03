import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { difference, changes, selectClass, selectUnit } from '../src/models/report';
import { classes, mockSession, progress, reports, units } from '../src/mock/fixtures';
import { makeStore } from '../src/store';
import { api } from '../src/api/api';
import { loggedOut, signedIn, chooseClass, chooseUnit } from '../src/store/auth';
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
test('exact source data, null raw scores, seven skills, four pieces of advice', () => {
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
  assert(!expired(new Date(Date.now()+60000).toISOString(), 'mock.demo.123'));
});
test('mock login, protected cache, class selection reset, and logout cleanup', async () => {
  const store = makeStore();
  const bad = await store.dispatch(api.endpoints.login.initiate({studentId:'HV000123',password:'bad'})); assert('error' in bad);
  const session = await store.dispatch(api.endpoints.login.initiate({studentId:'HV000123',password:'Demo123!'})).unwrap(); store.dispatch(signedIn(session));
  const request = store.dispatch(api.endpoints.classes.initiate()); assert.equal((await request.unwrap()).length,2);
  store.dispatch(chooseClass('juniors-03')); store.dispatch(chooseUnit('u3')); store.dispatch(chooseClass('juniors-02')); assert.equal(store.getState().auth.unitId,null);
  store.dispatch(loggedOut()); assert.equal(store.getState().auth.student,null); assert.equal(store.getState().auth.classId,null); assert.deepEqual(store.getState().studentApi.queries,{}); request.unsubscribe();
});
test('mock link exchange is one-use; clear invalid/expired errors', async () => {
  const store = makeStore();
  await store.dispatch(api.endpoints.exchange.initiate({code:'demo-bon'})).unwrap();
  for (const [code, expected] of [['demo-bon',410],['demo-expired',410],['incorrect',400]]) {
    const res = await store.dispatch(api.endpoints.exchange.initiate({code:String(code)})); assert('error' in res && res.error && 'status' in res.error); assert.equal(res.error.status,expected);
  }
});
test('401 clears session/cache; 403 retains authentication; empty fixtures', async () => {
  for (const id of ['HVFORBIDDEN','HVEMPTY','HVEXPIRED']) {
    const store = makeStore(); store.dispatch(signedIn(mockSession(id)));
    const req = store.dispatch(api.endpoints.classes.initiate()); const result = await req;
    if (id === 'HVFORBIDDEN') {assert('error' in result); assert.equal(store.getState().auth.status,'authenticated');}
    if (id === 'HVEMPTY') assert.deepEqual(result.data,[]);
    if (id === 'HVEXPIRED') {assert.equal(store.getState().auth.status,'guest'); assert.deepEqual(store.getState().studentApi.queries,{});}
    req.unsubscribe(); store.dispatch(loggedOut());
  }
});
test('missing real URL never falls back to mock', async () => {
  const result = await createAppBaseQuery('real','')({url:'/auth/login',method:'POST',body:{}}, context(), {});
  assert.equal(result.error?.status,'CUSTOM_ERROR');
});
test('real mode calls configured endpoint with bearer header and contract; abort is supported', async () => {
  const store = makeStore(); const session = mockSession('HV000123'); store.dispatch(signedIn(session));
  const server = createServer((req,res) => {
    assert.equal(req.url,'/v1/me'); assert.equal(req.headers.authorization,`Bearer ${session.accessToken}`);
    res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({data: session.student}));
  }).listen(0,'127.0.0.1');
  await new Promise<void>(resolve => server.once('listening',resolve));
  try { const result = await createAppBaseQuery('real',`http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`)('/me',context(store),{}); assert.deepEqual(result.data,{data:session.student}); } finally {server.close();}
  const controller = new AbortController(); controller.abort(); const result = await createAppBaseQuery('mock')('/me',{...context(store), signal:controller.signal},{}); assert.equal(result.error?.status,'FETCH_ERROR');
});
