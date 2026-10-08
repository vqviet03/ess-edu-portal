import {test, expect, type Page} from '@playwright/test';
import { installApiFixture } from './support/api-fixture';
test.beforeEach(async ({page}) => { await installApiFixture(page); });
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
async function login(page: Page, student = 'HV000123') {
  await page.goto('login/'); await page.getByLabel('ID học sinh').fill(student); await page.locator('input[autocomplete="current-password"]').fill('Demo123!'); await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
}
async function logout(page: Page) { await page.getByRole('button',{name:'Tài khoản',exact:true}).click(); await page.getByRole('menuitem',{name:'Đăng xuất'}).click(); await expect(page).toHaveURL(/\/login\/$/); }
test('manual login, exact data, seven curves, eight comparisons, class/unit state and logout', async ({page}) => {
  const errors: string[] = []; page.on('pageerror',e => errors.push(e.message));
  await page.goto('home/'); await expect(page).toHaveURL(/\/login\/$/);
  await page.getByLabel('ID học sinh').fill('HV000123'); await page.locator('input[autocomplete="current-password"]').fill('wrong'); await page.getByRole('button',{name:'Hiện mật khẩu'}).click(); await expect(page.locator('input[autocomplete="current-password"]')).toHaveAttribute('type','text'); await page.getByRole('button',{name:'Đăng nhập',exact:true}).click(); await expect(page.locator('.MuiAlert-root')).toContainText('không đúng');
  await page.locator('input[autocomplete="current-password"]').fill('Demo123!'); await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Unit 3'})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible();
  await expect(page.getByText('23.1 / 35').first()).toBeVisible();
  await page.getByRole('heading',{name:/Biểu đồ tiến độ theo kỹ năng/}).scrollIntoViewIfNeeded(); const chart = page.getByTestId('skills-chart'); await chart.scrollIntoViewIfNeeded(); await expect(chart.locator('.recharts-line-curve')).toHaveCount(7);
  for (const path of await chart.locator('.recharts-line-curve').all()) expect(await path.getAttribute('d')).toContain('C');
  await page.getByRole('heading',{name:'Thay đổi điểm theo từng kỹ năng qua các Unit'}).scrollIntoViewIfNeeded(); await expect(page.getByTestId('change-chart')).toHaveCount(8); await expect(page.getByTestId('change-chart').nth(1).locator('.recharts-label-list text')).toHaveText(['+20.0%', '0.0%']);
  await expect(page.getByText('-58.6%',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Unit 1'}).click(); await expect(page.getByText('Chưa có nhận xét tổng thể.')).toBeVisible();
  await page.getByRole('combobox',{name:'Lớp học'}).click(); await page.getByRole('option',{name:'Juniors 02',exact:true}).click(); await expect(page.getByText('Lớp này chưa có Unit học tập.')).toBeVisible(); await expect(page.getByRole('heading',{name:/Tổng quan kết quả/})).toHaveCount(0);
  await page.getByRole('combobox',{name:'Lớp học'}).click(); await page.getByRole('option',{name:'Juniors 03 · Đang học'}).click(); await expect(page.getByRole('tab',{name:'Unit 3'})).toHaveAttribute('aria-selected','true');
  await page.reload(); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible();
  await logout(page); expect(await page.evaluate(() => sessionStorage.getItem('learnleaf.session'))).toBeNull(); await page.goto('home/'); await expect(page).toHaveURL(/\/login\/$/); expect(errors).toEqual([]);
});
test('one-time link sanitizes URL, succeeds once and rejects used/expired code', async ({page}) => {
  await page.goto('auth/link/#code=valid-test-code'); await expect(page).toHaveURL(/\/home\/$/); expect(new URL(page.url()).hash).toBe(''); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible(); await logout(page);
  await page.goto('auth/link/#code=valid-test-code'); await expect(page.locator('.MuiAlert-root')).toContainText('đã được sử dụng'); expect(new URL(page.url()).hash).toBe('');
  await page.goto('auth/link/#code=expired-test-code'); await expect(page.locator('.MuiAlert-root')).toContainText('hết hạn');
  await page.goto('auth/link/#code=invalid'); await expect(page.locator('.MuiAlert-root')).toContainText('không hợp lệ');
});
test('401 on /me clears the session without navigation loops', async ({page}) => {
  await login(page); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible();
  await page.evaluate(() => { const key='learnleaf.session'; const session=JSON.parse(sessionStorage.getItem(key)!); session.accessToken=session.accessToken.replace(/\.[^.]+$/,'.revoked-signature'); sessionStorage.setItem(key,JSON.stringify(session)); });
  const rejected = page.waitForResponse(response => response.url().endsWith('/me') && response.status() === 401);
  await page.reload(); await rejected; await expect(page).toHaveURL(/\/login\/$/); expect(await page.evaluate(() => sessionStorage.getItem('learnleaf.session'))).toBeNull();
});
test('empty, forbidden and missing-report fixtures have usable states', async ({page}) => {
  await login(page,'HVEMPTY'); await expect(page.getByText('Chưa có lớp học nào.')).toBeVisible(); await logout(page);
  await login(page,'HVFORBIDDEN'); await expect(page.locator('.MuiAlert-root')).toContainText('không có quyền'); await logout(page);
  await login(page,'HVNOREPORT'); await expect(page.getByText('Unit này chưa có báo cáo.')).toBeVisible();
});
test.describe('mobile', () => {
  test.use({hasTouch: true});
  test('materials, settings, mobile and static deep links', async ({page, request}) => {
  for (const route of ['', 'login/', 'auth/link/', 'home/', 'materials/']) { const response=await request.get(`http://127.0.0.1:${process.env.PORT ?? 4173}${base}/${route}`); expect(response.status()).toBe(200); }
  await page.setViewportSize({width:390,height:844}); await login(page); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible();
  await page.getByRole('button',{name:'Giao diện',exact:true}).click(); await page.getByRole('menuitem',{name:'Tối',exact:true}).click(); expect(await page.evaluate(() => localStorage.getItem('learnleaf.theme'))).toBe('dark');
  await page.reload(); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('heading',{name:/Biểu đồ tiến độ theo kỹ năng/}).scrollIntoViewIfNeeded(); const chart = page.getByTestId('skills-chart'); await chart.scrollIntoViewIfNeeded(); await expect(chart.locator('.recharts-line-curve')).toHaveCount(7);
  await chart.locator('.recharts-line-dots').first().locator('circle').last().tap(); await expect(chart.locator('.recharts-tooltip-wrapper')).toBeVisible(); await expect(chart.locator('.recharts-tooltip-item')).toHaveCount(7);
  await page.getByRole('heading',{name:'Thay đổi điểm theo từng kỹ năng qua các Unit'}).scrollIntoViewIfNeeded(); await expect(page.getByTestId('change-chart')).toHaveCount(8); await expect(page.getByTestId('change-chart').nth(1).locator('.recharts-label-list text')).toHaveText(['+20.0%', '0.0%']);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({path:'test-results/mobile-dark.png',fullPage:true});
  await page.getByRole('button',{name:'Ngôn ngữ',exact:true}).click(); await expect(page.getByRole('menuitem',{name:'Tiếng Việt'})).toBeVisible(); await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Tài liệu học tập',exact:true}).click(); await expect(page).toHaveURL(/materials\/\?classId=juniors-03$/); await expect(page.getByRole('tab',{name:'Thread',exact:true})).toHaveAttribute('aria-selected','true'); await page.getByRole('tab',{name:'Tài liệu',exact:true}).click(); await expect(page.getByText('Tài liệu PDF mẫu')).toBeVisible();
  await page.getByRole('button',{name:'Xem / tải tài liệu',exact:true}).nth(1).click(); await expect(page.locator('audio')).toHaveAttribute('src',/^blob:/); await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('link',{name:'← Về báo cáo'}).click(); await page.getByRole('button',{name:'Giao diện',exact:true}).click(); await page.getByRole('menuitem',{name:'Sáng',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000}); await expect(page.getByRole('heading',{name:'Tổng quan kết quả Unit 3'})).toBeVisible(); await chart.scrollIntoViewIfNeeded(); await expect(chart.locator('.recharts-line-curve')).toHaveCount(7); await page.getByRole('heading',{name:'Thay đổi điểm theo từng kỹ năng qua các Unit'}).scrollIntoViewIfNeeded(); await expect(page.getByTestId('change-chart')).toHaveCount(8); await expect(page.getByTestId('change-chart').nth(1).locator('.recharts-label-list text')).toHaveText(['+20.0%', '0.0%']); await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({path:'test-results/desktop-light.png',fullPage:true});
});
});
