import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
const catalog = {
  id: "catalog-test",
  name: "Quà động viên",
  description: "Cùng nhau cố gắng mỗi ngày",
  ownerId: "teacher-test",
  ownerName: "Cô Mai",
  status: "ACTIVE",
  version: 1,
  classIds: ["class-green"],
  managerIds: [],
  canManage: true,
  canManageMembers: true,
};
const gift = {
  id: "gift-test",
  catalogId: catalog.id,
  name: "Gấu bông pastel",
  description: "Món quà từ những nỗ lực",
  category: "Đồ chơi",
  points: 20,
  available: 3,
  reserved: 0,
  status: "ACTIVE",
  version: 1,
  fileIds: [],
  favorite: false,
};
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  test(`gift catalog uses a reviewed cart at ${viewport.width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await installApiFixture(page);
    let quantity = 0;
    const preview = () => ({
      classId: "juniors-03",
      studentId: "student-test",
      studentName: "Daisy",
      nickname: "Daisy",
      studentCode: "HV000123",
      className: "Juniors 03",
      balanceBefore: 100,
      balanceAfter: 100 - quantity * gift.points,
      totalPoints: quantity * gift.points,
      items: quantity
        ? [{ gift, quantity, expectedPoints: gift.points, priceChanged: false }]
        : [],
      canConfirm: quantity > 0,
      errors: [],
    });
    await page.route(/\/v1\/reward-gifts(?:\/|\?|$)/, async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname.split("/reward-gifts")[1];
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization,content-type,x-workspace,idempotency-key",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      };
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      let data: unknown = [];
      if (path === "/my-classes")
        data = [{ id: "juniors-03", name: "Juniors 03", status: "ACTIVE" }];
      else if (path.endsWith("/categories")) data = ["Đồ chơi"];
      else if (path === "")
        data = { items: [gift], total: 1, page: 1, pageSize: 20 };
      else if (path.includes("/cart")) {
        if (request.method() === "PUT")
          quantity = request.postDataJSON().quantity;
        data = preview();
      }
      return route.fulfill({ headers, json: { data } });
    });
    await page.goto(`${base}/login/`);
    await page.getByLabel("ID học sinh").fill("HV000123");
    await page
      .locator('input[autocomplete="current-password"]')
      .fill("Demo123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/home/);
    await page.goto(`${base}/home/rewards/gifts/?classId=juniors-03`);
    await expect(
      page.getByRole("heading", { name: "Góc đổi quà" }),
    ).toBeVisible();
    await expect(page.getByText(gift.name, { exact: true })).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`gifts-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
    await expect.poll(() => quantity).toBe(1);
    await page.getByRole("button", { name: /Mở giỏ quà/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Xem lại giỏ" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
