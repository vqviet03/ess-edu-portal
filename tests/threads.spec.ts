import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
test("thread default, teacher contacts, reaction, comment and idle requests on mobile", async ({
  page,
}) => {
  await installApiFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng quan kết quả Unit 3" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Tài liệu học tập", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Thread", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Thread Unit 1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "teacher@example.test" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "👍 Thích", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "👍 Thích", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Bình luận/ }).click();
  await page.getByLabel("Viết bình luận").fill("Con đã làm bài");
  await page
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await expect(page.getByText("Con đã làm bài", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  let requests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/v1/")) requests++;
  });
  await page.clock.fastForward(120000);
  expect(requests).toBe(0);
});
