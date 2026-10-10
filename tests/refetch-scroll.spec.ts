import { test, expect } from '@playwright/test';
import { installApiFixture } from './support/api-fixture';

async function login(page: import('@playwright/test').Page) {
  await page.goto('login/');
  await page.getByLabel('ID học sinh').fill('HV000123');
  await page.locator('input[autocomplete="current-password"]').fill('Demo123!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('Thread Unit 1', {exact: true})).toBeVisible();
}

test('deep-linked comment does not scroll again after realtime refetch', async ({page}) => {
  const fixture = await installApiFixture(page, {images: true});
  await login(page);
  await page.goto('home/?classId=juniors-03&postId=post-one&commentId=image-comment');
  await expect(page.locator('#comment-image-comment')).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as {scrollCalls: number}).scrollCalls = 0;
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      (window as unknown as {scrollCalls: number}).scrollCalls++;
      return original.apply(this, args);
    };
    window.scrollTo(0, 150);
  });
  const before = await page.evaluate(() => window.scrollY);
  const response = page.waitForResponse(r => r.url().includes('/posts/post-one/comments') && r.request().method() === 'GET');
  fixture.changeComment('image-comment', 'Bình luận vừa được cập nhật');
  fixture.notify({id: 'reply-scroll',type: 'REPLY', title: 'Phản hồi mới',href: '/home/?classId=juniors-03',isRead: false,version: 1,createdAt: new Date().toISOString()});
  await response;
  await expect(page.getByText('Bình luận vừa được cập nhật', {exact: true})).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as {scrollCalls: number}).scrollCalls)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

test('failed class refetch retains mounted thread and draft', async ({page}) => {
  const fixture = await installApiFixture(page);
  await login(page);
  const input = page.getByRole('textbox', {name: 'Viết bình luận', exact: true});
  await input.fill('Bản nháp cần giữ');
  await page.route('**/me/classes', route => route.fulfill({status: 500,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body: JSON.stringify({error:{code:'UNAVAILABLE',message:'Tạm không tải được lớp'}})}));
  fixture.resourceChanged({id:'class-change',href:'/home/?classId=juniors-03'});
  await expect(page.getByText('Tạm không tải được lớp', {exact:true})).toBeVisible();
  await expect(input).toHaveValue('Bản nháp cần giữ');
  await expect(page.getByText('Thread Unit 1', {exact:true})).toBeVisible();
});

test('report refetch errors retain mounted charts and current reading region', async ({page}) => {
  const fixture = await installApiFixture(page);
  await login(page);
  await page.getByRole('tab', {name:'Báo cáo kết quả',exact:true}).click();
  const chart = page.getByTestId('skills-chart');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.getByTestId('native-chart')).toBeVisible();
  await chart.evaluate(el => el.setAttribute('data-scroll-regression', 'same-node'));
  await page.getByRole('heading', {name:'Nhận xét tổng thể',exact:true}).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(100);
  await page.route('**/me/classes/juniors-03/progress', route => route.fulfill({
    status:500,headers:{'access-control-allow-origin':'*'},json:{error:{code:'UNAVAILABLE',message:'Không tải được lịch sử điểm'}},
  }));
  fixture.notify({id:'score-refetch',type:'SCORE',title:'Điểm cập nhật',href:'/home/?classId=juniors-03',isRead:false,version:1,createdAt:new Date().toISOString()});
  await expect(page.getByText('Không tải được lịch sử điểm',{exact:true})).toBeVisible();
  await expect(chart).toHaveAttribute('data-scroll-regression','same-node');
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect(page.getByRole('heading',{name:'Nhận xét tổng thể',exact:true})).toBeVisible();
});

test('attendance error and delayed filter refetch keep the full layout mounted', async ({page}) => {
  const fixture=await installApiFixture(page);
  let fail=false, delay=false, release: (()=>void) | undefined;
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
  const item = {date:today,status:'PRESENT',scheduled:true,confirmed:true,reasonKind:null,reason:'',replacesDate:null,replaced:false,startTime:'18:00',endTime:'19:30'};
  await page.route('**/me/classes/juniors-03/attendance**', async route => {
    if (delay) await new Promise<void>(resolve=>{release=resolve;});
    if (fail) return route.fulfill({status:500,headers:{'access-control-allow-origin':'*'},json:{error:{code:'UNAVAILABLE',message:'Không tải được điểm danh'}}});
    await route.fulfill({headers:{'access-control-allow-origin':'*'},json:{data:{
      classId:'juniors-03',today,stats:{present:1,absent:0,unrecorded:0,plannedSessions:20,absencePercentage:0,warning:'ACCEPTABLE'},
      calendar:[item],items:[item],total:1,page:1,pageSize:20,
    }}});
  });
  await login(page);
  await page.getByRole('tab',{name:'Điểm danh',exact:true}).click();
  const content=page.getByTestId('attendance-report-content');
  await expect(content).toBeVisible();
  await content.evaluate(el=>el.setAttribute('data-scroll-regression','same-node'));
  await page.getByText('Cách tính cảnh báo',{exact:true}).scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>window.scrollY)).toBeGreaterThan(100);
  fail=true;
  fixture.notify({id:'attendance-refetch',type:'ATTENDANCE',title:'Điểm danh cập nhật',href:'/home/?classId=juniors-03',isRead:false,version:1,createdAt:new Date().toISOString()});
  await expect(page.getByText('Không tải được điểm danh',{exact:true})).toBeVisible();
  await expect(content).toHaveAttribute('data-scroll-regression','same-node');
  expect(await page.evaluate(()=>window.scrollY)).toBeGreaterThan(100);
  fail=false; delay=true;
  const height=await content.evaluate(el=>el.getBoundingClientRect().height);
  await page.getByRole('button',{name:'Tháng trước',exact:true}).click();
  await expect(content).toHaveAttribute('aria-busy','true');
  expect(await content.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(height-100);
  await expect(content).toHaveAttribute('data-scroll-regression','same-node');
  await expect.poll(()=>!!release).toBe(true);
  delay=false; release!();
  await expect(content).toHaveAttribute('aria-busy','false');
  await expect(page.getByRole('heading',{name:'Điểm danh của em',exact:true})).toBeVisible();
});
