import { test, expect, type Page } from '@playwright/test';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
test.describe('ASP.NET + PostgreSQL integration (opt-in, isolated demo backend)', () => {
  test.skip(process.env.TEST_LIVE_API !== 'true', 'Set TEST_LIVE_API=true with a separately seeded demo backend.');
  test.setTimeout(60000);

  async function login(page: Page, studentId = 'HV000123') {
    await page.goto('login/');
    await page.getByLabel('ID học sinh').fill(studentId);
    await page.locator('input[autocomplete="current-password"]').fill('Demo123!');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/home\/$/);
    await page.getByRole('tab',{name:'Báo cáo kết quả',exact:true}).click();
  }

  test('real login, /me reload, scoped class/unit reports, materials, logout and revoked session', async ({page, request}) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await login(page);
    await expect(page.getByRole('heading', { name: 'Tổng quan kết quả Unit 3' })).toBeVisible();
    await expect(page.getByText('23.1 / 35').first()).toBeVisible();
    await page.reload();
    await page.getByRole('tab',{name:'Báo cáo kết quả',exact:true}).click();
    await expect(page.getByRole('heading', { name: 'Tổng quan kết quả Unit 3' })).toBeVisible();
    await page.getByRole('tab', { name: 'Unit 2' }).click();
    await expect(page.getByRole('heading', { name: 'Tổng quan kết quả Unit 2' })).toBeVisible();
    await page.getByRole('link', { name: 'Tài liệu học tập', exact: true }).click();
    await expect(page).toHaveURL(/materials\/\?classId=/);
    await expect(page.getByRole('button', { name: 'Mở tài liệu', exact: true }).first()).toBeVisible();
    const accessResponse = page.waitForResponse(response => response.url().endsWith('/access') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Mở tài liệu', exact: true }).first().click();
    expect((await accessResponse).status()).toBe(200);
    await expect(page.getByRole('link', { name: 'Mở trong tab mới' })).toHaveAttribute('href', /^https:/);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.getByRole('link', { name: 'Về báo cáo' }).click();
    await expect(page.getByRole('tab', { name: 'Unit 2' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('combobox', { name: 'Lớp học' }).click();
    await page.getByRole('option', { name: /ess20-a1/ }).click();
    await page.getByRole('tab',{name:'Báo cáo kết quả',exact:true}).click();
    await expect(page.getByRole('heading', { name: /Tổng quan kết quả/ })).toHaveCount(0);
    await expect(page.getByText('Lớp này chưa có Unit học tập.')).toBeVisible();

    const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('learnleaf.session')!).accessToken as string);
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login\/$/);
    expect(await page.evaluate(() => sessionStorage.getItem('learnleaf.session'))).toBeNull();
    expect((await request.get(`${baseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(401);

    await login(page);
    const currentToken = await page.evaluate(() => JSON.parse(sessionStorage.getItem('learnleaf.session')!).accessToken as string);
    expect((await request.post(`${baseUrl}/auth/logout`, { headers: { Authorization: `Bearer ${currentToken}` } })).status()).toBe(200);
    await page.reload();
    await expect(page).toHaveURL(/\/login\/$/);
    expect(await page.evaluate(() => sessionStorage.getItem('learnleaf.session'))).toBeNull();
    expect(errors).toEqual([]);
    await login(page, 'HV000124');
    await expect(page.getByText('Lớp này chưa có Unit học tập.')).toBeVisible();
  });

  test('backend-generated student link exchanges once and removes fragment', async ({page, request}) => {
    const teacherResponse = await request.post(`${baseUrl}/teacher/auth/login`, { data: {email: 'teacher@ess.local', password: 'TeacherDemo123!'} });
    expect(teacherResponse.status()).toBe(200);
    const teacher = (await teacherResponse.json()).data as {accessToken: string};
    const studentResponse = await request.post(`${baseUrl}/auth/login`, { data: {studentId: 'HV000123', password: 'Demo123!'} });
    expect(studentResponse.status()).toBe(200);
    const student = (await studentResponse.json()).data as {accessToken: string; student: {id: string}};
    const classesResponse = await request.get(`${baseUrl}/me/classes`, { headers: {Authorization: `Bearer ${student.accessToken}`} });
    const classes = (await classesResponse.json()).data.items as {id: string; name: string; isActive: boolean}[];
    const classroom = classes.find(item => item.name === 'Juniors 03');
    expect(classroom).toBeDefined();
    const headers = {Authorization: `Bearer ${teacher.accessToken}`};
    const linkResponse = await request.post(`${baseUrl}/teacher/classes/${classroom!.id}/students/${student.student.id}/login-link`, { headers });
    expect(linkResponse.status()).toBe(200);
    const link = (await linkResponse.json()).data as {url: string};
    const fragment = new URL(link.url).hash;
    await page.goto(`auth/link/${fragment}`);
    await expect(page).toHaveURL(/\/home\/$/);
    await page.getByRole('tab',{name:'Báo cáo kết quả',exact:true}).click();
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.getByRole('heading', { name: 'Tổng quan kết quả Unit 3' })).toBeVisible();
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login\/$/);
    await page.goto(`auth/link/${fragment}`);
    await expect(page.locator('.MuiAlert-root')).toContainText(/đã.*sử dụng/i);
    expect(new URL(page.url()).hash).toBe('');
    await request.post(`${baseUrl}/auth/logout`, { headers });
    await request.post(`${baseUrl}/auth/logout`, { headers: {Authorization: `Bearer ${student.accessToken}`} });
  });
});
