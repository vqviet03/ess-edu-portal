import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
import {
  type RewardDetail,
  type StudySchedule,
  vietnamToday,
} from "../src/features/rewards/models";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
test("student reward history and four cumulative curves are read-only, responsive and signal-driven", async ({
  page,
}, testInfo) => {
  const fixture = await installApiFixture(page);
  const today = vietnamToday();
  const data: RewardDetail = {
    classId: "juniors-03",
    studentId: "student-test",
    todayDate: today,
    attendance: "PRESENT",
    todayProgress: 50,
    totals: { earned: 28, penalty: 4, spent: 10, net: 24, balance: 14 },
    today: { earned: 3, penalty: 1, spent: 0, net: 2, balance: 2 },
    chart: [
      {
        date: "2026-10-01",
        attendance: "PRESENT",
        dailyEarned: 5,
        dailyPenalty: 0,
        dailySpent: 0,
        earned: 5,
        penalty: 0,
        net: 5,
        balance: 5,
      },
      {
        date: "2026-10-03",
        attendance: "PRESENT",
        dailyEarned: 7,
        dailyPenalty: 0,
        dailySpent: 0,
        earned: 12,
        penalty: 0,
        net: 12,
        balance: 12,
      },
      {
        date: "2026-10-05",
        attendance: "ABSENT",
        dailyEarned: 0,
        dailyPenalty: 0,
        dailySpent: 0,
        earned: null,
        penalty: null,
        net: null,
        balance: null,
      },
      {
        date: "2026-10-07",
        attendance: "PRESENT",
        dailyEarned: 13,
        dailyPenalty: 3,
        dailySpent: 10,
        earned: 25,
        penalty: 3,
        net: 22,
        balance: 12,
      },
      {
        date: "2026-10-09",
        attendance: "PRESENT",
        dailyEarned: 3,
        dailyPenalty: 1,
        dailySpent: 0,
        earned: 28,
        penalty: 4,
        net: 24,
        balance: 14,
      },
    ],
    activities: [],
    activityCount: 0,
  };
  const schedule: StudySchedule = {
    classId: "juniors-03",
    version: 1,
    effectiveFrom: today,
    configuration: {
      mode: "FLEXIBLE",
      cycle: "WEEKLY",
      timeMode: "FLEXIBLE",
      startTime: null,
      endTime: null,
      slots: [{ day: null, date: today, startTime: null, endTime: null }],
    },
    occurrences: [{ date: today, startTime: null, endTime: null }],
    timeZone: "Asia/Ho_Chi_Minh",
  };
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization,content-type,idempotency-key,accept",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  };
  let rewardReads = 0;
  await page.route("**/v1/me/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const path = url.pathname;
    if (!/rewards|reward-classes|schedule/.test(path)) return route.fallback();
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    expect(req.method()).toBe("GET");
    expect(req.headers().authorization).toMatch(/^Bearer /);
    let value: unknown = data;
    if (path.endsWith("reward-classes"))
      value = [{ id: "juniors-03", name: "Juniors 03" }];
    else if (path.endsWith("schedule")) value = schedule;
    else if (path.endsWith("history"))
      value = { items: [], page: 1, pageSize: 20, total: 0 };
    else rewardReads++;
    await route.fulfill({ status: 200, headers, json: { data: value } });
  });
  await page.goto(`${base}/login/`);
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("tab", { name: "Điểm tích luỹ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hành trình tích luỹ", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="chart-surface"] svg path[fill="none"][stroke-width="2.5"]')).toHaveCount(4);
  await page.screenshot({
    path: testInfo.outputPath("student-rewards-desktop.png"),
    fullPage: true,
  });
  await expect(
    page.getByText("Đóng góp ròng", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Chưa có hoạt động nào.", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Vi phạm", exact: true }).click();
  await expect(page.locator('[data-testid="chart-surface"] svg path[fill="none"][stroke-width="2.5"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Vi phạm", exact: true }).click();
  await expect(page.locator('[data-testid="chart-surface"] svg path[fill="none"][stroke-width="2.5"]')).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Ghi nhận thành tích", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Xem lịch học", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText(/Giờ sẽ được thông báo/),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("student-rewards-mobile.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({
    path: testInfo.outputPath("student-rewards-mobile-dark.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.clock.install();
  const previous = rewardReads;
  await page.clock.fastForward(60000);
  expect(rewardReads).toBe(previous);
  fixture.notify({
    id: "reward-notice",
    type: "REWARD",
    title: "Điểm động viên",
    href: "/class/?classId=juniors-03&tab=rewards",
    isRead: false,
    version: 1,
    createdAt: new Date().toISOString(),
  });
  await expect.poll(() => rewardReads).toBe(previous + 1);
  fixture.notify({
    id: "reward-notice",
    type: "REWARD",
    title: "Điểm động viên",
    href: "/class/?classId=juniors-03&tab=rewards",
    isRead: false,
    version: 1,
    createdAt: new Date().toISOString(),
  });
  await page.clock.fastForward(30000);
  expect(rewardReads).toBe(previous + 1);
});
