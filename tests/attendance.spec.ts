import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
import {
  todayDate,
  type StudentAttendance,
} from "../src/features/attendance/models";

test("student sees own attendance, thresholds, calendar and notices without writes or polling", async ({
  page,
}) => {
  await installApiFixture(page);
  const today = todayDate();
  const day = {
    date: today,
    status: "ABSENT" as const,
    scheduled: true,
    confirmed: true,
    reasonKind: null,
    reason: "",
    replacesDate: null,
    replaced: false,
    startTime: "18:00",
    endTime: "19:30",
  };
  const data: StudentAttendance = {
    classId: "juniors-03",
    today,
    stats: {
      present: 7,
      absent: 4,
      unrecorded: 2,
      plannedSessions: 20,
      absencePercentage: 20,
      warning: "WARNING",
    },
    calendar: [day],
    todaySession: day,
    items: [day],
    total: 1,
    page: 1,
    pageSize: 20,
  };
  let reads = 0,
    writes = 0;
  await page.route(
    "**/v1/me/classes/juniors-03/attendance**",
    async (route) => {
      if (route.request().method() !== "GET") writes++;
      reads++;
      const month = new URL(route.request().url()).searchParams.get("month");
      await route.fulfill({
        json: {
          data: { ...data, calendar: month === today.slice(0, 7) ? [day] : [] },
        },
      });
    },
  );
  await page.route("**/v1/notifications?type=ATTENDANCE", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "attendance-notice",
              type: "ATTENDANCE",
              title: "Giảng viên đã lưu điểm danh của em",
              href: "/home/?classId=juniors-03&tab=attendance",
              isRead: false,
              version: 1,
              createdAt: new Date().toISOString(),
            },
          ],
          nextCursor: null,
          unreadCount: 1,
        },
      },
    }),
  );
  await page.clock.install();
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("tab", { name: "Điểm danh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Điểm danh của em" }),
  ).toBeVisible();
  await expect(
    page.getByText("Cần chú ý chuyên cần", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("20% số buổi nghỉ", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Giảng viên đã lưu điểm danh của em", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu điểm danh" })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: "test-results/student-attendance-desktop.png",
    fullPage: true,
  });
  const before = reads;
  await page.clock.fastForward(120000);
  expect(reads).toBe(before);
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Tháng trước", exact: true }).click();
  await expect.poll(() => reads).toBe(before + 1);
  await expect(
    page.getByText("20% số buổi nghỉ", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: "test-results/student-attendance-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Giao diện", exact: true }).click();
  await page.getByRole("menuitem", { name: "Tối", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Điểm danh của em" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/student-attendance-mobile-dark.png",
    fullPage: true,
  });
});
