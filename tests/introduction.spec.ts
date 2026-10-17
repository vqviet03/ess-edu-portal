import { test, expect } from "@playwright/test";
import { defaultContent } from "../src/features/introduction/models";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
for (const theme of ["light", "dark"] as const) {
  test(`public landing ${theme} respects mobile/desktop layout and submits only once`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    let submits = 0;
    await page.route("**/api/v1/introduction**", (r) => {
      if (r.request().method() === "POST") {
        submits++;
        const body = r.request().postDataJSON();
        expect(body.parentName).toBe("Nguyễn Mai");
        expect(body.consent).toBe(true);
        expect(body.requestKey).toMatch(/^[a-f0-9-]{36}$/);
        return r.fulfill({ json: { data: { received: true } } });
      }
      return r.fulfill({
        json: {
          data: {
            content: defaultContent,
            version: 1,
            publishedAt: "2026-10-16T00:00:00Z",
          },
        },
      });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Vững tiếng Anh. Tự tin mỗi ngày.",
    );
    expect(
      await page
        .locator(".intro-container")
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    ).toBe(1120);
    await page.screenshot({
      path: `test-results/introduction-desktop-${theme}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("button", { name: "Mở menu" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await page.getByRole("button", { name: "Mở menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Điều hướng trang giới thiệu" }),
    ).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Về EES", exact: true })
      .click();
    await page.screenshot({
      path: `test-results/introduction-mobile-${theme}.png`,
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Họ tên phụ huynh" })
      .fill("Nguyễn Mai");
    await page
      .getByRole("textbox", { name: "Số điện thoại" })
      .fill("0901234567");
    await page
      .getByRole("textbox", { name: "Họ tên học sinh" })
      .fill("Hữu Văn");
    await page
      .getByRole("combobox", { name: "Lớp đang học" })
      .selectOption("Lớp 4");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Gửi đăng ký tư vấn" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Đã gửi thông tin đăng ký",
        exact: true,
      }),
    ).toBeVisible();
    expect(submits).toBe(1);
  });
}
