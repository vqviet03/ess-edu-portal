import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
test("student tab is a static page, and post back restores exact tab after reload without extra reads", async ({
  page,
}) => {
  await installApiFixture(page);
  let classes = 0,
    threads = 0;
  page.on("request", (r) => {
    if (r.method() !== "GET") return;
    const url = new URL(r.url());
    if (url.pathname.endsWith("/me/classes")) classes++;
    if (url.pathname.endsWith("/threads")) threads++;
  });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("lesson-post")).toBeVisible();
  await page.getByRole("tab", { name: "Tài liệu", exact: true }).click();
  await expect(page).toHaveURL(/\/home\/files\//);
  const origin = page.url();
  await page.getByRole("link", { name: "Thread Unit 1", exact: true }).click();
  await expect(page).toHaveURL(/\/post\//);
  await page.getByRole("link", { name: "Về thread", exact: true }).click();
  await expect(page).toHaveURL(origin);
  await expect(
    page.getByRole("tab", { name: "Tài liệu", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  expect(classes).toBe(1);
  expect(threads).toBe(2);
  await page.getByRole("link", { name: "Thread Unit 1", exact: true }).click();
  await expect(page).toHaveURL(/\/post\//);
  await page.reload();
  await page.getByRole("link", { name: "Về thread", exact: true }).click();
  await expect(page).toHaveURL(origin);
  await page.getByRole("tab", { name: "Báo cáo kết quả", exact: true }).click();
  await expect(page).toHaveURL(/\/home\/report\//);
  await page.goBack();
  await expect(
    page.getByRole("tab", { name: "Tài liệu", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.goForward();
  await expect(
    page.getByRole("tab", { name: "Báo cáo kết quả", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("assignment deadline is visible with urgency text in feed and detail, including dark mobile", async ({
  page,
}) => {
  const deadline = new Date(Date.now() + 3600000).toISOString();
  await installApiFixture(page, { assignmentDeadline: deadline });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const chip = page.getByTestId("assignment-deadline");
  await expect(chip).toHaveAttribute("data-urgency", "urgent");
  await expect(chip).toContainText("Còn dưới 24 giờ");
  await page.getByRole("link", { name: "Thread Unit 1", exact: true }).click();
  await expect(page).toHaveURL(/\/post\//);
  await expect(chip).toHaveAttribute("data-urgency", "urgent");
  const overflowing = await chip.evaluate(
    (el) => el.getBoundingClientRect().right > window.innerWidth,
  );
  expect(overflowing).toBe(false);
});
