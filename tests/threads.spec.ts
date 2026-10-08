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
    page.getByRole("tab", { name: "Thread", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /Đăng bài/ })).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Báo cáo kết quả", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("skills-chart")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/student-thread-mobile-light.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: "teacher@example.test" }),
  ).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
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
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("tab", { name: "Tài liệu", exact: true }).click();
  await expect(
    page.getByText("Tài liệu PDF mẫu", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("combobox", { name: "Lọc theo phiên học" })
    .fill("Unit 2");
  await page.getByRole("option", { name: /Unit 2/ }).click();
  await expect(
    page.getByText("Lớp chưa có thread được công bố.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Thread", exact: true }).click();
  await page.getByRole("button", { name: "♥ Yêu thích", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "♥ Yêu thích", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Bình luận/ }).click();
  await page.getByLabel("Viết bình luận").fill("Con đã làm bài");
  const refreshed = Promise.all([
    page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname.endsWith("/posts/post-one/comments"),
    ),
    page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname.endsWith("/classes/juniors-03/threads"),
    ),
  ]);
  await page
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await refreshed;
  await expect(page.getByLabel("Viết bình luận")).toHaveValue("");
  await expect(page.getByText("Con đã làm bài", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
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

test("teacher contacts retain real error, retry and empty states", async ({
  page,
}) => {
  await installApiFixture(page);
  let attempts = 0;
  await page.route("**/classes/*/contacts", async (route) => {
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization,content-type,accept",
      "access-control-allow-methods": "GET,OPTIONS",
    };
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers });
    }
    attempts++;
    return route.fulfill({
      status: attempts === 1 ? 503 : 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify(
        attempts === 1
          ? {
              error: {
                code: "UNAVAILABLE",
                message: "Không tải được liên hệ giảng viên.",
              },
            }
          : { data: { items: [] } },
      ),
    });
  });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const contactError = page
    .getByRole("alert")
    .filter({ hasText: "Không tải được liên hệ giảng viên." });
  await expect(contactError).toBeVisible();
  await expect(
    page.getByText("Chưa có giảng viên đang phụ trách.", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    page.getByText("Chưa có giảng viên đang phụ trách.", { exact: true }),
  ).toBeVisible();
  await expect(contactError).toHaveCount(0);
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
  expect(attempts).toBe(2);
});
