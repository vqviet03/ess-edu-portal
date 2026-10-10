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
