import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
import type { Assignment } from "../src/features/assignments/models";

test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

async function openRecorder(page: Page) {
  await installApiFixture(page);
  const assignment: Assignment = {
    id: "assignment-recording",
    classId: "juniors-03",
    postId: "assignment-post",
    sessionId: null,
    unitNumber: 1,
    title: "Bài nói kiểm thử",
    instructions: "",
    status: "PUBLISHED",
    deadline: null,
    allowLate: true,
    publishedAt: new Date().toISOString(),
    version: 1,
    assignmentVersionId: "form-v1",
    schemaVersion: 1,
    canEdit: false,
    totalMax: 5,
    questions: [
      {
        id: "question-speaking",
        type: "SPEAKING",
        content: "Giới thiệu bản thân",
        instructions: "",
        maxScore: 5,
        order: 0,
        allowUploadedAudio: false,
        maxDurationSeconds: 60,
        options: [],
        media: [],
      },
    ],
  };
  await page.route("**/assignments/assignment-recording**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/draft")
      ? null
      : path.endsWith("/recordings")
        ? {
            id: "recording-test",
            version: 1,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            maxDurationSeconds: 60,
          }
        : assignment;
    return route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": "*" },
      json: { data },
    });
  });
  await page.addInitScript(() => {
    const streams: MediaStream[] = [];
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      streams.push(stream);
      return stream;
    };
    Object.defineProperty(window, "assignmentLiveTracks", {
      get: () =>
        streams
          .flatMap((s) => s.getTracks())
          .filter((t) => t.readyState === "live").length,
    });
  });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator('input[autocomplete="current-password"]').fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Thread Unit 1", { exact: true })).toBeVisible();
  await page.goto("assignment/?assignmentId=assignment-recording");
  await expect(
    page.getByRole("heading", { name: assignment.title, exact: true }),
  ).toBeVisible();
}

test("recording stops its microphone and countdown on stop and client navigation", async ({
  page,
}) => {
  await openRecorder(page);
  await page.getByRole("button", { name: "Bắt đầu ghi âm" }).click();
  const live = () =>
    page.evaluate(() => Reflect.get(window, "assignmentLiveTracks"));
  await expect.poll(live).toBe(1);
  await page.getByRole("button", { name: "Dừng ghi âm" }).click();
  await expect.poll(live).toBe(0);
  await expect(
    page.getByRole("button", { name: "Sử dụng bản ghi" }),
  ).toBeVisible();
  const timer = await page.getByRole("timer").textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByRole("timer")).toHaveText(timer!);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Ghi lại", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu ghi âm" }).click();
  await expect.poll(live).toBe(1);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("menuitem", { name: "Hồ sơ cá nhân" }).click();
  await expect(page).toHaveURL(/profile\/$/);
  await expect.poll(live).toBe(0);
});

test("retry after audio verification failure keeps one upload and confirms the recording", async ({
  page,
}) => {
  await openRecorder(page);
  let initiations = 0,
    puts = 0,
    completions = 0,
    confirmations = 0;
  await page.route("**/assignments/assignment-recording/uploads", (route) => {
    expect(route.request().postDataJSON().originalName).toMatch(
      /^Bài nộp 1 - Bài nói kiểm thử - Unit 1\.(webm|m4a|ogg)$/,
    );
    initiations++;
    return route.fulfill({
      json: {
        data: {
          uploadId: "recorded-file",
          uploadUrl: "http://127.0.0.1:4173/test-recording-put",
          version: 1,
        },
      },
    });
  });
  await page.route("**/test-recording-put", (route) => {
    puts++;
    return route.fulfill({ status: 200 });
  });
  await page.route("**/material-uploads/recorded-file/complete", (route) => {
    completions++;
    return completions === 1
      ? route.fulfill({
          status: 503,
          json: {
            error: {
              code: "MEDIA_UNAVAILABLE",
              message: "Chưa xác minh được audio. Thử lại.",
            },
          },
        })
      : route.fulfill({
          json: {
            data: {
              id: "recorded-file",
              originalName: "bai-noi.webm",
              displayName: "Bài nói",
              mimeType: "audio/webm",
              sizeBytes: 100,
              status: "AVAILABLE",
              version: 2,
            },
          },
        });
  });
  await page.route("**/recordings/recording-test/complete", (route) => {
    confirmations++;
    return route.fulfill({
      json: {
        data: {
          id: "recording-test",
          status: "CONFIRMED",
          materialId: "recorded-file",
          version: 2,
        },
      },
    });
  });
  await page.getByRole("button", { name: "Bắt đầu ghi âm" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Dừng ghi âm" }).click();
  await page.getByRole("button", { name: "Sử dụng bản ghi" }).click();
  await expect(
    page.getByText("Chưa xác minh được audio. Thử lại.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ghi lại", exact: true }),
  ).toBeVisible();
  expect(confirmations).toBe(0);
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect.poll(() => confirmations).toBe(1);
  await expect(
    page.getByRole("button", { name: "Bắt đầu ghi âm" }),
  ).toHaveCount(0);
  expect(initiations).toBe(1);
  expect(puts).toBe(1);
  expect(completions).toBe(2);
  expect(confirmations).toBe(1);
});

test("student permanently deletes a saved recording from its draft, retries safely and records again after reload", async ({
  page,
}) => {
  await openRecorder(page);
  const file = {
    id: "saved-recording",
    displayName: "Bản ghi cũ",
    originalName: "bai-noi.webm",
    mimeType: "audio/webm",
    sizeBytes: 100,
    thumbnailUrl: null,
    folderId: null,
    authorId: "student",
    authorName: "Em",
    uploadedBy: "student",
    uploadSource: "submission",
    sourceSessionId: null,
    sourcePostId: "assignment-post",
    status: "AVAILABLE",
    version: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const draft = {
    id: "draft-test",
    assignmentId: "assignment-recording",
    assignmentVersionId: "form-v1",
    studentId: "student",
    studentName: "Em",
    submittedAt: null as string | null,
    publishedAt: null,
    version: 3,
    status: "DRAFT",
    answers: [
      {
        questionId: "question-speaking",
        text: "",
        link: "",
        optionIds: [],
        materialIds: [file.id],
        files: [file],
        recordingSessionId: "recording-test" as string | null,
      },
    ],
    grades: [],
    overallComment: "",
    overallAdvice: "",
    totalMax: 5,
    totalScore: null,
    percentage: null,
  };
  await page.route("**/assignments/assignment-recording/draft", (route) =>
    route.fulfill({ json: { data: draft } }),
  );
  let deletions = 0;
  await page.route(
    "**/assignments/assignment-recording/uploads/saved-recording",
    async (route) => {
      deletions++;
      expect(route.request().method()).toBe("DELETE");
      expect(route.request().postDataJSON()).toMatchObject({
        version: 2,
        draftVersion: 3,
        questionId: "question-speaking",
      });
      if (deletions === 1)
        return route.fulfill({
          status: 503,
          json: {
            error: {
              code: "STORAGE_UNAVAILABLE",
              message: "Chưa thể xóa. Hãy thử lại.",
            },
          },
        });
      draft.version = 4;
      draft.answers[0].materialIds = [];
      draft.answers[0].files = [];
      draft.answers[0].recordingSessionId = null;
      return route.fulfill({
        status: 202,
        json: { data: { id: file.id, status: "DELETING", draftVersion: 4 } },
      });
    },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  let contentRequests = 0;
  await page.route("**/materials/saved-recording/content?*", (route) => {
    contentRequests++;
    return route.fulfill({
      path: path.resolve("tests/fixtures/live-recording.webm"),
      contentType: "audio/webm",
    });
  });
  await page.reload();
  await expect(
    page.getByText("Bản ghi bài nộp", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Bản ghi cũ", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ghi âm lại", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Phát Bản ghi bài nộp", exact: true })
    .click();
  const player = page.locator("audio").last();
  await expect
    .poll(() =>
      player.evaluate((a: HTMLAudioElement) =>
        Number.isFinite(a.duration) ? a.duration : 0,
      ),
    )
    .toBeGreaterThan(2);
  await expect
    .poll(() => player.evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(0.1);
  await expect(page.getByText(/\/ 0:03$/)).toBeVisible();
  await page
    .getByRole("button", { name: "Tạm dừng Bản ghi bài nộp", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Phát Bản ghi bài nộp", exact: true })
    .click();
  expect(contentRequests).toBe(1);
  expect(
    (await page
      .getByRole("slider", { name: "Tua Bản ghi bài nộp" })
      .boundingBox())!.width,
  ).toBeGreaterThan(80);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("submission-audio-mobile.png"),
  });
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Xóa bản ghi bài nộp", exact: true })
    .click();
  expect(deletions).toBe(0);

  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Xóa bản ghi bài nộp", exact: true })
    .click();
  await expect(
    page.getByText("Chưa thể xóa. Hãy thử lại.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ghi âm lại", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ghi âm lại", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu ghi âm", exact: true }),
  ).toBeVisible();
  expect(deletions).toBe(2);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("menuitem", { name: "Hồ sơ cá nhân" }).click();
  await expect(page).toHaveURL(/profile\/$/);
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Bắt đầu ghi âm", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xóa bản ghi bài nộp", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bắt đầu ghi âm", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xóa bản ghi bài nộp", exact: true }),
  ).toHaveCount(0);
  draft.submittedAt = new Date().toISOString();
  draft.answers[0].files = [file];
  draft.answers[0].materialIds = [file.id];
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Ghi âm lại", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xóa bản ghi bài nộp", exact: true }),
  ).toHaveCount(0);
});
