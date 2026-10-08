import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
test("thread default, teacher contacts, reaction, comment and idle requests on mobile", async ({
  page,
}) => {
  await installApiFixture(page);
  let commentReads = 0,
    legacyReads = 0;
  page.on("request", (r) => {
    if (r.method() !== "GET") return;
    if (r.url().includes("/posts/post-one/comments")) commentReads++;
    if (r.url().includes("/me/classes/juniors-03/materials")) legacyReads++;
  });
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
  const post = page
    .getByRole("tabpanel", { name: "Thread", exact: true })
    .getByTestId("lesson-post");
  const input = post.getByRole("textbox", {
    name: "Viết bình luận",
    exact: true,
  });
  await expect(input).toBeVisible();
  await expect(
    post.getByRole("button", { name: "Mở phần bình luận" }),
  ).toHaveCount(0);
  await expect(
    post.getByRole("button", { name: "Gửi bình luận", exact: true }),
  ).toBeDisabled();
  expect(commentReads).toBe(0);
  await page.getByRole("tab", { name: "Tài liệu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Xem Tài liệu PDF mẫu", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu.", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Tài liệu tổng hợp của lớp", { exact: true }),
  ).toHaveCount(0);
  expect(legacyReads).toBe(0);
  await page
    .getByRole("combobox", { name: "Lọc theo phiên học" })
    .fill("Unit 2");
  await page.getByRole("option", { name: /Unit 2/ }).click();
  await expect(
    page.getByText("Lớp chưa có thread được công bố.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Thread", exact: true }).click();
  await post.getByRole("button", { name: "Thích", exact: true }).click();
  await expect(
    post.getByRole("button", { name: "Thích", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    post.getByRole("button", { name: "Thích", exact: true }),
  ).toHaveText("");
  const iconShapes = new Set<string | null>();
  for (const [label, color] of [
    ["Tuyệt vời", "rgb(214, 155, 36)"],
    ["Thích", "rgb(83, 151, 229)"],
    ["Yêu thích", "rgb(231, 106, 145)"],
  ]) {
    await post.locator('button[aria-haspopup="menu"][aria-pressed]').press("ArrowDown");
    await page
      .getByRole("menuitem", { name: `Chọn ${label}`, exact: true })
      .click();
    const selected = post.getByRole("button", { name: label, exact: true });
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await expect(selected.locator("svg")).toBeVisible();
    iconShapes.add(await selected.locator("svg path").getAttribute("d"));
    await expect(selected).toHaveCSS("color", color);
  }
  expect(iconShapes.size).toBe(3);
  expect(iconShapes.has(null)).toBe(false);
  expect(commentReads).toBe(0);
  const originalInput = await input.elementHandle();
  await input.fill("Con đã làm bài\nGiữ xuống dòng");
  await expect(post.getByTestId("comment-list")).toBeVisible();
  await post.getByRole("button", { name: /^Bình luận/ }).click();
  await expect(post.getByTestId("comment-list")).toHaveCount(0);
  await expect(input).toHaveValue("Con đã làm bài\nGiữ xuống dòng");
  await post.getByRole("button", { name: /^Bình luận/ }).click();
  expect(await input.evaluate((el, old) => el === old, originalInput)).toBe(
    true,
  );
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
  await post
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await refreshed;
  await expect(input).toHaveValue("");
  await expect(post.getByTestId("post-comment")).toContainText(
    "Con đã làm bài",
  );
  await post.getByRole("button", { name: "Trả lời", exact: true }).click();
  await input.fill("Con xin bổ sung");
  await post
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await expect(post.getByTestId("post-comment")).toHaveCount(2);
  await expect(
    post.getByText("Trả lời bình luận", { exact: true }),
  ).toBeVisible();
  const first = post.getByTestId("post-comment").first();
  await first.getByRole("button", { name: /^Thao tác bình luận/ }).click();
  await page
    .getByRole("menuitem", { name: "Sửa bình luận", exact: true })
    .click();
  await input.fill("Nội dung đã sửa");
  await post
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await expect(first).toContainText("Nội dung đã sửa");
  await first.getByRole("button", { name: /^Thao tác bình luận/ }).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("menuitem", { name: "Xóa bình luận", exact: true })
    .click();
  await expect(post.getByTestId("post-comment")).toHaveCount(1);
  await page.screenshot({
    path: "test-results/student-inline-comments-light.png",
    fullPage: true,
  });
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

test("comment attachment icon uploads and sends through existing authenticated endpoints", async ({
  page,
}) => {
  await installApiFixture(page);
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "PUT,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
  let uploads = 0,
    commits = 0;
  await page.route("https://uploads.example.test/comment", (route) => {
    expect(route.request().headers().authorization).toBeUndefined();
    if (route.request().method() === "PUT") uploads++;
    return route.fulfill({ status: 200, headers: cors, body: "" });
  });
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      req.url().includes("/posts/post-one/comments")
    ) {
      expect(req.headers().authorization).toMatch(/^Bearer /);
      expect(req.postDataJSON().materialIds).toEqual(["comment-file"]);
      commits++;
    }
  });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const post = page.getByTestId("lesson-post");
  const input = post.getByRole("textbox", { name: "Viết bình luận" });
  await input.fill("Tệp ghi chú của con");
  const form = post.getByRole("form", { name: "Soạn bình luận" });
  await form
    .getByRole("button", {
      name: "Đính kèm ảnh / file / audio / video",
      exact: true,
    })
    .click();
  const upload = page.getByRole("dialog");
  await expect(
    upload.getByText("Upload đính kèm bình luận", { exact: true }),
  ).toBeVisible();
  await upload.locator('input[type="file"]').setInputFiles({
    name: "ghi-chu.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Xin chào\nGhi chú"),
  });
  await upload
    .getByRole("button", { name: "Tải các file đã chọn", exact: true })
    .click();
  await expect(
    upload.getByText("Đã tải và xác minh", { exact: true }),
  ).toBeVisible();
  await upload.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(input).toHaveValue("Tệp ghi chú của con");
  await expect(post.getByText("ghi-chu.txt", { exact: true })).toBeVisible();
  await form
    .getByRole("button", { name: "Gửi bình luận", exact: true })
    .click();
  await expect(post.getByTestId("post-comment")).toContainText("ghi-chu.txt");
  expect(uploads).toBe(1);
  expect(commits).toBe(1);
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
