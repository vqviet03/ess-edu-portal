import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
import type { Notification } from "../src/features/materials/models";
async function login(page: import("@playwright/test").Page) {
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("lesson-post")).toBeVisible();
}
test("student receives notifications via socket without polling, deduplicates and opens score unit", async ({
  page,
}) => {
  const fixture = await installApiFixture(page);
  let reads = 0,
    threads = 0;
  page.on("request", (r) => {
    if (r.method() === "GET" && r.url().includes("/v1/notifications")) reads++;
    if (r.method() === "GET" && r.url().includes("/threads")) threads++;
  });
  await page.clock.install();
  await login(page);
  await expect(
    page.getByRole("link", { name: "Thông báo (0 chưa đọc)" }),
  ).toBeVisible();
  const n: Notification = {
    id: "reply-1",
    type: "REPLY",
    title: "Cô trả lời bình luận",
    href: "/session/?classId=juniors-03&postId=post-one&commentId=comment-1",
    isRead: false,
    version: 1,
    createdAt: new Date().toISOString(),
  };
  fixture.notify(n);
  await expect(
    page.getByRole("link", { name: "Thông báo (1 chưa đọc)" }),
  ).toBeVisible();
  const afterEvent = threads;
  fixture.notify(n);
  await page.clock.fastForward(30000);
  expect(threads).toBe(afterEvent);
  expect(reads).toBe(0);
  fixture.notify({
    ...n,
    id: "score-1",
    type: "SCORE",
    title: "Điểm Unit 1",
    href: "/home/?classId=juniors-03&unitId=u1&tab=report",
  });
  await page.getByRole("link", { name: "Thông báo (2 chưa đọc)" }).click();
  await expect(
    page.getByRole("heading", { name: "Thông báo", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article", { name: n.title })).toBeVisible();
  await page
    .getByRole("button", { name: `Đánh dấu đã đọc: ${n.title}`, exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Thông báo (1 chưa đọc)" }),
  ).toBeVisible();
  expect(reads).toBe(0);
  await page.getByRole("link", { name: "Mở Điểm Unit 1", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Báo cáo kết quả", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tab", { name: "Unit 1", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  expect(reads).toBe(0);
});
test("hold reaction gives feedback and does not submit before choosing; image thumbnails have fixed cover frames", async ({
  page,
}) => {
  await installApiFixture(page, { images: true });
  let writes = 0,
    originals = 0;
  page.on("request", (r) => {
    if (r.method() === "PUT" && r.url().includes("/reaction")) writes++;
    if (
      r.method() === "GET" &&
      r.url().includes("/content") &&
      !r.url().includes("purpose=thumbnail")
    )
      originals++;
  });
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const post = page.getByTestId("lesson-post"),
    button = post.getByRole("button", { name: "Thích", exact: true });
  await button.scrollIntoViewIfNeeded();
  const bounds = await button.boundingBox();
  if (!bounds) throw new Error("Button missing");
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-holding", "true");
  await page.clock.fastForward(500);
  await expect(
    page.getByRole("menuitem", { name: "Chọn Yêu thích", exact: true }),
  ).toBeVisible();
  await page.mouse.up();
  expect(writes).toBe(0);
  await page
    .getByRole("menuitem", { name: "Chọn Yêu thích", exact: true })
    .click();
  await expect(
    post.getByRole("button", { name: "Yêu thích", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(post.getByLabel("Yêu thích: 1", { exact: true })).toBeVisible();
  expect(writes).toBe(1);
  const active = post.getByRole("button", { name: "Yêu thích", exact: true }),
    activeBounds = await active.boundingBox();
  if (!activeBounds) throw new Error("Button missing");
  await page.mouse.move(
    activeBounds.x + activeBounds.width / 2,
    activeBounds.y + activeBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    activeBounds.x + activeBounds.width / 2 + 15,
    activeBounds.y + activeBounds.height / 2,
  );
  await page.clock.fastForward(500);
  await page.mouse.up();
  await expect(
    page.getByRole("menuitem", { name: "Chọn Yêu thích", exact: true }),
  ).toHaveCount(0);
  expect(writes).toBe(1);
  await active.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Chọn Yêu thích", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(writes).toBe(1);
  await post.getByRole("button", { name: /^Bình luận/ }).click();
  await expect(post.getByText("Ảnh bình luận", { exact: true })).toBeVisible();
  const images = post.locator('img[src^="blob:"]');
  await expect(images).toHaveCount(2);
  for (const image of await images.all())
    await expect(image).toHaveCSS("object-fit", "cover");
  expect(originals).toBe(0);
  const commentPreview = post.getByTestId("comment-thumbnail-frame").last();
  const frame = await commentPreview.boundingBox();
  expect(frame?.height).toBe(120);
  expect(frame?.width).toBe(190);
  expect(
    await post.evaluate((el) =>
      Math.abs(
        el.getBoundingClientRect().left -
          (innerWidth - el.getBoundingClientRect().right),
      ),
    ),
  ).toBeLessThan(2);
  await page.screenshot({
    path: "test-results/compact-thread-mobile.png",
    fullPage: true,
  });
});
