import { test, expect } from '@playwright/test';
import { installApiFixture } from './support/api-fixture';
import { resolveApiConfiguration } from '../src/api/config';

test('center name drives header, footer and browser title with one cached request', async ({page}) => {
  await installApiFixture(page);
  const {baseUrl} = resolveApiConfiguration(process.env.NEXT_PUBLIC_API_BASE_URL);
  let name = 'Trung tâm Ngoại ngữ Lá Xanh', requests = 0;
  await page.route(`${baseUrl}/application-settings`, async route => {
    if (route.request().method() === 'OPTIONS') return route.fallback();
    requests++;
    expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({status:200, headers:{'access-control-allow-origin':'*'}, json:{data:{appName:name,classIdPrefix:'lx',version:requests,schemaReady:true}}});
  });
  const branding = async () => {
    await expect(page.locator('header')).toContainText(name);
    await expect(page.locator('footer')).toHaveText(`${name} · Báo cáo học tập của học sinh`);
    await expect(page).toHaveTitle(`${name} · Báo cáo học tập`);
  };
  await page.goto('login/'); await branding();
  await page.getByLabel('ID học sinh').fill('HV000123');
  await page.locator('input[autocomplete="current-password"]').fill('Demo123!');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(page).toHaveURL(/\/home\//); await branding();
  await page.getByRole('link',{name:'Tài liệu học tập',exact:true}).click();
  await expect(page).toHaveURL(/\/materials\//); await branding();
  expect(requests).toBe(1);
  await page.clock.install(); await page.clock.fastForward(60000); expect(requests).toBe(1);
  name = 'Trung tâm Ngoại ngữ Quốc tế Lá Xanh Việt Nam';
  await page.setViewportSize({width:390,height:844});
  await page.reload(); await branding(); expect(requests).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
