import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createStudentApi } from '../src/api/api';
import { resolveApiConfiguration } from '../src/api/config';
import { makeStore } from '../src/store';
import { signedIn, loggedOut, chooseClass, chooseUnit } from '../src/store/auth';
import { student, classes, units, reports, progress, materials } from './support/data';
import type { AuthSession } from '../src/models';
import { errorDetails } from '../src/api/errors';

const session = (suffix = 'first'): AuthSession => ({ accessToken: `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.${suffix}`, tokenType: 'Bearer', expiresAt: new Date(Date.now() + 3600000).toISOString(), student });
async function server(handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>) {
  const http = createServer((req, res) => { Promise.resolve(handler(req, res)).catch(() => { res.statusCode = 500; res.end(); }); });
  await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
  const service = createStudentApi(resolveApiConfiguration(`http://127.0.0.1:${(http.address() as AddressInfo).port}/v1/`));
  return { http, service, store: makeStore(service) };
}
function reply(res: ServerResponse, data: unknown, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
async function body(req: IncomingMessage) { let text = ''; for await (const part of req) text += part; return text ? JSON.parse(text) : null; }

test('backend URL is required and normalized; timeout configuration is validated', () => {
  assert(resolveApiConfiguration().error);
  assert.equal(resolveApiConfiguration('https://example.run.app/').baseUrl, 'https://example.run.app/v1');
  assert.equal(resolveApiConfiguration('https://example.run.app/v1/').baseUrl, 'https://example.run.app/v1');
  for (const url of ['', 'http://example.run.app/v1', 'https://user:pass@example.run.app/v1', 'https://example.run.app/v1?token=x', 'https://example.run.app/#jwt=x']) assert(resolveApiConfiguration(url).error);
  for (const timeout of [0, -1, 1.5, NaN, 120001]) assert(resolveApiConfiguration('https://example.run.app/v1', timeout).error);
  assert.equal(errorDetails({status:'TIMEOUT_ERROR'}).code, 'TIMEOUT');
});

test('public application settings use real HTTP without JWT, share cache and preserve auth on failure', async () => {
  let calls = 0, failing = false;
  const settings = { appName: 'Trung tâm Lá Xanh', classIdPrefix: 'lx', version: 2 };
  const {http, service, store} = await server((req, res) => {
    calls++; assert.equal(req.url, '/v1/application-settings'); assert.equal(req.headers.authorization, undefined);
    reply(res, failing ? {error:{code:'UNAVAILABLE',message:'Tạm thời không khả dụng'}} : {data:settings}, failing ? 401 : 200);
  });
  try {
    const first = store.dispatch(service.endpoints.applicationSettings.initiate());
    const second = store.dispatch(service.endpoints.applicationSettings.initiate());
    assert.deepEqual(await first.unwrap(), settings); assert.deepEqual(await second.unwrap(), settings); assert.equal(calls, 1);
    assert.equal(store.getState().auth.status, 'booting');
    const issued = session(); store.dispatch(signedIn(issued));
    assert.deepEqual(await store.dispatch(service.endpoints.applicationSettings.initiate()).unwrap(), settings); assert.equal(calls, 1);
    failing = true;
    const result = await store.dispatch(service.endpoints.applicationSettings.initiate(undefined, {forceRefetch:true}));
    assert(result.error); assert.equal(store.getState().auth.accessToken, issued.accessToken); assert.equal(store.getState().auth.status, 'authenticated');
    assert.equal(calls, 2);
    first.unsubscribe(); second.unsubscribe();
  } finally { store.dispatch(loggedOut()); http.closeAllConnections(); await new Promise<void>(resolve => http.close(() => resolve())); }
});

test('all student endpoints use real HTTP, envelopes, Bearer and class/unit keys', async () => {
  const issued = session(); const requests: string[] = [];
  const fixture = await server(async (req, res) => {
    const url = req.url!; requests.push(`${req.method} ${url}`);
    if (url === '/v1/auth/login') {
      assert.equal(req.headers.authorization, undefined); assert.deepEqual(await body(req), { studentId:'HV000123', password:'Demo123!' }); reply(res, {data:issued}); return;
    }
    if (url === '/v1/auth/exchange') { assert.equal(req.headers.authorization, undefined); assert.deepEqual(await body(req), {code:'one-time-code'}); reply(res, {data:issued}); return; }
    assert.equal(req.headers.authorization, `Bearer ${issued.accessToken}`);
    if (url === '/v1/me') reply(res, {data:student});
    else if (url === '/v1/me/classes') reply(res, {data:{items:classes}});
    else if (url === '/v1/me/classes/juniors-03/units') reply(res, {data:{items:units}});
    else if (url === '/v1/me/classes/juniors-02/units') reply(res, {data:{items:[]}});
    else if (url === '/v1/me/classes/juniors-03/units/u3/report') reply(res, {data:reports[2]});
    else if (url === '/v1/me/classes/juniors-03/progress') reply(res, {data:{items:[...progress].reverse()}});
    else if (url === '/v1/me/classes/juniors-03/materials') reply(res, {data:{items:materials}});
    else if (url === '/v1/me/classes/juniors-03/materials/m-pdf/access') { assert.equal(req.method, 'POST'); reply(res, {data:{url:'https://example.com/document',expiresAt:new Date(Date.now()+60000).toISOString()}}); }
    else if (url === '/v1/auth/logout') { assert.equal(req.method, 'POST'); reply(res, {data:{loggedOut:true}}); }
    else reply(res, {error:{code:'NOT_FOUND',message:'Not found'}},404);
  });
  const {http,service,store} = fixture;
  try {
    store.dispatch(signedIn(await store.dispatch(service.endpoints.login.initiate({studentId:'HV000123',password:'Demo123!'})).unwrap()));
    await store.dispatch(service.endpoints.exchange.initiate({code:'one-time-code'})).unwrap();
    assert.deepEqual(await store.dispatch(service.endpoints.me.initiate()).unwrap(), student);
    assert.deepEqual(await store.dispatch(service.endpoints.classes.initiate()).unwrap(), classes);
    assert.deepEqual(await store.dispatch(service.endpoints.units.initiate('juniors-03')).unwrap(), units);
    assert.deepEqual(await store.dispatch(service.endpoints.units.initiate('juniors-02')).unwrap(), []);
    store.dispatch(chooseClass('juniors-03')); store.dispatch(chooseUnit('u3')); store.dispatch(chooseClass('juniors-02')); assert.equal(store.getState().auth.unitId,null);
    assert.deepEqual(await store.dispatch(service.endpoints.report.initiate({classId:'juniors-03',unitId:'u3'})).unwrap(),reports[2]);
    assert.deepEqual(await store.dispatch(service.endpoints.progress.initiate('juniors-03')).unwrap(),progress);
    assert.deepEqual(await store.dispatch(service.endpoints.materials.initiate('juniors-03')).unwrap(),materials);
    assert.equal((await store.dispatch(service.endpoints.materialAccess.initiate({classId:'juniors-03',materialId:'m-pdf'})).unwrap()).url,'https://example.com/document');
    assert.deepEqual(await store.dispatch(service.endpoints.logout.initiate()).unwrap(),{loggedOut:true});
    store.dispatch(loggedOut()); assert.deepEqual(store.getState().studentApi.queries,{}); assert.equal(store.getState().auth.student,null); assert.equal(requests.length,11);
  } finally { store.dispatch(loggedOut()); http.closeAllConnections(); await new Promise<void>(resolve=>http.close(()=>resolve())); }
});

test('real API 401 resets session/cache; 403 and failed login keep their proper states', async () => {
  let status = 403;
  const {http,service,store} = await server((req,res) => reply(res,{error:{code:status===401?'UNAUTHORIZED':'FORBIDDEN',message:'Backend message'}},status));
  try {
    store.dispatch(signedIn(session()));
    const denied = await store.dispatch(service.endpoints.classes.initiate()); assert(denied.error); assert.equal(store.getState().auth.status,'authenticated');
    status=401;
    await store.dispatch(service.endpoints.classes.initiate(undefined,{forceRefetch:true}));
    assert.equal(store.getState().auth.status,'guest'); assert.deepEqual(store.getState().studentApi.queries,{});
    await store.dispatch(service.endpoints.login.initiate({studentId:'HV000123',password:'wrong'})); assert.equal(store.getState().auth.reason,'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  } finally { store.dispatch(loggedOut()); http.closeAllConnections(); await new Promise<void>(resolve=>http.close(()=>resolve())); }
});

test('a late 401 for the old token cannot delete a newly signed-in session', async () => {
  let release!: () => void; let received!: () => void;
  const started = new Promise<void>(resolve=>{received=resolve;}); const pending = new Promise<void>(resolve=>{release=resolve;});
  const {http,service,store} = await server(async (_,res)=>{ received(); await pending; reply(res,{error:{code:'UNAUTHORIZED',message:'Expired old session'}},401); });
  try {
    store.dispatch(signedIn(session('old'))); const request=store.dispatch(service.endpoints.me.initiate()); await started;
    store.dispatch(loggedOut()); const newer=session('new'); store.dispatch(signedIn(newer)); release(); await request;
    assert.equal(store.getState().auth.accessToken,newer.accessToken); assert.equal(store.getState().auth.status,'authenticated');
  } finally { release(); store.dispatch(loggedOut()); http.closeAllConnections(); await new Promise<void>(resolve=>http.close(()=>resolve())); }
});

test('cached report does not refetch on focus/network or resubscribe; targeted event refreshes only its class', async () => {
  const calls: string[] = [];
  const {http,service,store} = await server((req,res) => { calls.push(req.url!); reply(res,{data:reports[2]}); });
  const active: {unsubscribe: () => void}[] = [];
  try {
    store.dispatch(signedIn(session()));
    const first = store.dispatch(service.endpoints.report.initiate({classId:'class-a',unitId:'u3'})); active.push(first); await first.unwrap();
    const other = store.dispatch(service.endpoints.report.initiate({classId:'class-b',unitId:'u3'})); active.push(other); await other.unwrap();
    store.dispatch(service.internalActions.onFocus()); store.dispatch(service.internalActions.onOnline());
    const repeated = store.dispatch(service.endpoints.report.initiate({classId:'class-a',unitId:'u3'})); active.push(repeated); await repeated.unwrap();
    assert.equal(calls.length,2);
    store.dispatch(service.util.invalidateTags([{type:'Report',id:'class-a'}]));
    await store.dispatch(service.endpoints.report.initiate({classId:'class-a',unitId:'u3'})).unwrap();
    assert.equal(calls.length,3); assert.equal(calls.filter(url=>url.includes('class-b')).length,1);
  } finally {active.forEach(q=>q.unsubscribe()); store.dispatch(loggedOut()); http.closeAllConnections(); await new Promise<void>(resolve=>http.close(()=>resolve()));}
});
