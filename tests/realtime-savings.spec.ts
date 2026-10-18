import { test, expect, type Page } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
async function login(page: Page) {
  await page.goto(`${base}/login/`);
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/home\//);
  await expect(page.getByTestId("lesson-post")).toBeVisible();
}
async function hidden(page: Page, value: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, value);
}
test("visible idle sleeps at ten minutes; waking consumes gesture and never polls HTTP", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  await page.clock.install();
  await login(page);
  await expect.poll(() => fixture.activeConnections()).toBe(1);
  await page.waitForTimeout(150);
  let reads = 0;
  page.on("request", (r) => {
    if (r.url().includes("/v1/") && r.method() !== "OPTIONS") reads++;
  });
  await page.clock.fastForward(9 * 60 * 1000);
  await expect(page.getByTestId("realtime-idle")).toHaveCount(0);
  await page.mouse.move(200, 200);
  await page.clock.fastForward(9 * 60 * 1000);
  await expect(page.getByTestId("realtime-idle")).toHaveCount(0);
  await page.clock.fastForward(60 * 1000 + 1);
  await expect(page.getByTestId("realtime-idle")).toBeVisible();
  await expect.poll(() => fixture.activeConnections()).toBe(0);
  expect(reads).toBe(0);
  await page.evaluate(() => {
    (window as unknown as { clicks: number }).clicks = 0;
    document.addEventListener("click", () => {
      (window as unknown as { clicks: number }).clicks++;
    });
  });
  await page.mouse.click(220, 220);
  await expect(page.getByTestId("realtime-idle")).toHaveCount(0);
  await expect.poll(() => fixture.activeConnections()).toBe(1);
  expect(
    await page.evaluate(() => (window as unknown as { clicks: number }).clicks),
  ).toBe(0);
});
test("hidden tabs stop immediately without blur and reset their visible idle deadline", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  await page.clock.install();
  await login(page);
  await expect.poll(() => fixture.activeConnections()).toBe(1);
  await hidden(page, true);
  await expect.poll(() => fixture.activeConnections()).toBe(0);
  await page.clock.fastForward(11 * 60 * 1000);
  await expect(page.getByTestId("realtime-idle")).toHaveCount(0);
  await hidden(page, false);
  await expect.poll(() => fixture.activeConnections()).toBe(1);
  await expect(page.getByTestId("realtime-idle")).toHaveCount(0);
});
test("same session/context shares one socket; owner hide hands over and events reach both tabs", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    }),
  );
  const shared = { sessions: new Map<string, string>() };
  const first = await installApiFixture(page, shared);

  await login(page);
  const secondPage = await context.newPage();
  const second = await installApiFixture(secondPage, shared);
  await secondPage.goto(`${base}/home/`);
  await expect(secondPage).toHaveURL(/\/home\//);
  const active = () => first.activeConnections() + second.activeConnections();
  await expect.poll(active).toBe(1);
  // Wait until the follower participates in the elected transport (not just initial load).
  await expect(
    secondPage.getByRole("link", { name: /^Thông báo/ }),
  ).toBeVisible();
  const notice = {
    id: "shared-notice",
    type: "MATERIAL" as const,
    title: "Bài mới qua kết nối chung",
    href: "/materials/",
    isRead: false,
    version: 1,
    createdAt: new Date().toISOString(),
  };
  first.notify(notice);
  second.notify(notice);
  await expect(
    page.getByRole("link", { name: "Thông báo (1 chưa đọc)", exact: true }),
  ).toBeVisible();
  await expect(
    secondPage.getByRole("link", {
      name: "Thông báo (1 chưa đọc)",
      exact: true,
    }),
  ).toBeVisible();
  // Shared transport keeps both inboxes current, but only one visible window alerts.
  const alerts = (view: Page) =>
    view.getByRole("alert").filter({ hasText: notice.title });
  await expect
    .poll(
      async () =>
        (await alerts(page).count()) + (await alerts(secondPage).count()),
    )
    .toBe(1);
  const alerted = (await alerts(page).count()) ? page : secondPage;
  await alerted
    .getByRole("button", { name: "Đóng thông báo", exact: true })
    .click();
  const owner = first.activeConnections() ? page : secondPage;
  await hidden(owner, true);
  await expect.poll(active).toBe(1);
  expect(
    owner === page ? first.activeConnections() : second.activeConnections(),
  ).toBe(0);
  await hidden(page, true);
  await hidden(secondPage, true);
  await expect.poll(active).toBe(0);
  await secondPage.close();
});
test("thumbnail bytes wait for intersection and never request original post images", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pending = new Set<() => void>();
    window.IntersectionObserver = class {
      constructor(private callback: IntersectionObserverCallback) {}
      private run?: () => void;
      observe(target: Element) {
        this.run = () =>
          this.callback(
            [{ isIntersecting: true, target } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        pending.add(this.run);
      }
      unobserve() {
        this.disconnect();
      }
      disconnect() {
        if (this.run) pending.delete(this.run);
      }
    } as unknown as typeof IntersectionObserver;
    (window as unknown as { showMedia: () => void }).showMedia = () => {
      for (const run of [...pending]) run();
    };
  });
  await installApiFixture(page, { images: true });
  const content: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "GET" && /\/materials\/[^/]+\/content/.test(r.url()))
      content.push(r.url());
  });
  await login(page);
  expect(content).toHaveLength(0);
  await page.evaluate(() =>
    (window as unknown as { showMedia: () => void }).showMedia(),
  );
  await expect.poll(() => content.length).toBeGreaterThan(0);
  expect(
    content.every(
      (url) => new URL(url).searchParams.get("purpose") === "thumbnail",
    ),
  ).toBe(true);
});
