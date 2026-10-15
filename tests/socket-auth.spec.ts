import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
async function login(page: import("@playwright/test").Page) {
  await page.goto(`${base}/login/`);
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/home\//);
  await expect(page.getByTestId("lesson-post")).toBeVisible();
  // Let the homepage move from its initial no-class group to the selected class.
  await page.waitForTimeout(150);
}
const meUrl = process.env.NEXT_PUBLIC_API_BASE_URL! + "/me";
const connections = (fixture: Awaited<ReturnType<typeof installApiFixture>>) =>
  fixture.connectionCount();

test("socket rejection verifies HTTP auth once and does not log out or loop when session is valid", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  fixture.rejectSocketAuth(10);
  let reads = 0;
  page.on("request", (r) => {
    if (r.method() === "GET" && r.url() === meUrl) reads++;
  });
  await page.clock.install();
  await login(page);
  await expect.poll(() => reads).toBe(1);
  await expect.poll(() => connections(fixture)).toBeGreaterThanOrEqual(2);
  await page.clock.fastForward(60000);
  expect(reads).toBe(1);
  // The homepage may select its class after recovery: one additional scoped connection, never a retry loop.
  expect(connections(fixture)).toBeLessThanOrEqual(3);
  await expect(page).toHaveURL(/\/home\//);
  expect(
    await page.evaluate(() => localStorage.getItem("learnleaf.session")),
  ).not.toBeNull();
});

test("socket rejection waits for API 401 before clearing session", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  await login(page);
  await expect.poll(() => fixture.activeConnections()).toBe(1);
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route(meUrl, async (route) => {
    await gate;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        error: { code: "UNAUTHORIZED", message: "Phiên không hợp lệ." },
      }),
    });
  });
  const checked = page.waitForRequest(
    (r) => r.method() === "GET" && r.url() === meUrl,
  );
  fixture.disconnectUnauthorized();
  await checked;
  await expect(page).toHaveURL(/\/home\//);
  expect(
    await page.evaluate(() => localStorage.getItem("learnleaf.session")),
  ).not.toBeNull();
  finish();
  await expect(page).toHaveURL(/\/login\//);
  expect(
    await page.evaluate(() => localStorage.getItem("learnleaf.session")),
  ).toBeNull();
});

test("failed auth verification preserves login without repeated HTTP attempts", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  await page.route(meUrl, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        error: { code: "UNAVAILABLE", message: "Tạm thời không khả dụng." },
      }),
    }),
  );
  fixture.rejectSocketAuth(10);
  let reads = 0;
  page.on("request", (r) => {
    if (r.method() === "GET" && r.url() === meUrl) reads++;
  });
  await page.clock.install();
  await login(page);
  await expect.poll(() => reads).toBe(1);
  await page.clock.fastForward(60000);
  expect(reads).toBe(1);
  expect(connections(fixture)).toBe(1);
  await expect(page).toHaveURL(/\/home\//);
  expect(
    await page.evaluate(() => localStorage.getItem("learnleaf.session")),
  ).not.toBeNull();
});
