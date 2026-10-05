import type { Page } from '@playwright/test';
import { classes, materials, materialUrls, progress, reports, student, units } from './data';
import { resolveApiConfiguration } from '../../src/api/config';

// Only the test runner imports this. Browser code always sends HTTP requests.
export async function installApiFixture(page: Page) {
  const { baseUrl } = resolveApiConfiguration(process.env.NEXT_PUBLIC_API_BASE_URL);
  const sessions = new Map<string, string>();
  let consumed = false;
  const issue = (id: string) => {
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    const accessToken = `e30.${Buffer.from(JSON.stringify({exp: Math.floor(Date.parse(expiresAt) / 1000)})).toString('base64url')}.${id}`;
    sessions.set(accessToken, id);
    return { accessToken, expiresAt, tokenType: 'Bearer', student: {...student, studentCode:id} };
  };
  await page.route(`${baseUrl}/**`, async route => {
    const req = route.request(); const url = new URL(req.url()).pathname.replace(new URL(baseUrl).pathname, '');
    const headers = {'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,POST,OPTIONS'};
    const send = (data: unknown, status=200) => route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
    const fail = (status: number, code: string, message: string) => send({error:{code,message}},status);
    if (req.method() === 'OPTIONS') return route.fulfill({status:204,headers});
    if (url === '/auth/login') {
      const body=req.postDataJSON();
      if (req.headers().authorization) return fail(400,'INVALID_REQUEST','Login không gửi JWT.');
      if (!['HV000123','HVEMPTY','HVFORBIDDEN','HVNOREPORT'].includes(body.studentId) || body.password!=='Demo123!') return fail(401,'INVALID_CREDENTIALS','ID học sinh hoặc mật khẩu không đúng.');
      return send({data:issue(body.studentId)});
    }
    if (url === '/auth/exchange') {
      const {code}=req.postDataJSON();
      if (code==='expired-test-code') return fail(410,'CODE_EXPIRED','Liên kết đã hết hạn.');
      if (code!=='valid-test-code') return fail(400,'INVALID_CODE','Mã đăng nhập không hợp lệ.');
      if (consumed) return fail(410,'CODE_USED','Liên kết đã được sử dụng.');
      consumed=true; return send({data:issue('HV000123')});
    }
    const token=(req.headers().authorization??'').replace(/^Bearer /,''); const id=sessions.get(token);
    if (!id) return fail(401,'UNAUTHORIZED','Phiên không hợp lệ.');
    if (url==='/auth/logout') {sessions.delete(token); return send({data:{loggedOut:true}});}
    if (url==='/me') return send({data:{...student,studentCode:id}});
    if (id==='HVFORBIDDEN') return fail(403,'FORBIDDEN','Bạn không có quyền truy cập dữ liệu này.');
    if (url==='/me/classes') return send({data:{items:id==='HVEMPTY'?[]:classes}});
    const match=url.match(/^\/me\/classes\/([^/]+)\/(.*)$/);
    if (!match) return fail(404,'NOT_FOUND','Không tìm thấy dữ liệu.');
    const [,classId,endpoint]=match; const empty=classId!=='juniors-03';
    if (endpoint==='units') return send({data:{items:empty?[]:units.map(u=>({...u,hasReport:id!=='HVNOREPORT'}))}});
    if (endpoint==='progress') return send({data:{items:empty?[]:progress}});
    if (endpoint==='materials') return send({data:{items:empty?[]:materials}});
    const reportId=endpoint.match(/^units\/([^/]+)\/report$/)?.[1]; const report=reports.find(r=>r.unitId===reportId);
    if (report && !empty && id!=='HVNOREPORT') return send({data:report});
    const materialId=endpoint.match(/^materials\/([^/]+)\/access$/)?.[1];
    if (materialId && !empty && materialUrls[materialId]) return send({data:{url:materialUrls[materialId],expiresAt:new Date(Date.now()+300000).toISOString()}});
    return fail(404,'NOT_FOUND','Chưa có báo cáo.');
  });
}
