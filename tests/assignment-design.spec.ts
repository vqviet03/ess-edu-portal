import { test, expect } from "@playwright/test";
import { installApiFixture } from "./support/api-fixture";
import type { Assignment } from "../src/features/assignments/models";
const assignment: Assignment = {
  id: "assignment-design",
  classId: "juniors-03",
  postId: "post-design",
  sessionId: null,
  unitNumber: 1,
  title: "Khám phá đại dương",
  instructions: "Hoàn thành bài tập",
  status: "PUBLISHED",
  deadline: null,
  allowLate: true,
  publishedAt: new Date().toISOString(),
  version: 1,
  assignmentVersionId: "version-design",
  schemaVersion: 1,
  canEdit: false,
  totalMax: 3,
  questions: [
    {
      id: "question-one",
      type: "SINGLE",
      content: "Which animal lives in the sea?",
      instructions: "",
      maxScore: 1,
      order: 0,
      allowUploadedAudio: true,
      maxDurationSeconds: 60,
      options: [
        { id: "option-a", content: "A fish", order: 0, media: [] },
        { id: "option-b", content: "A cat", order: 1, media: [] },
      ],
      media: [],
    },
    {
      id: "question-two",
      type: "TEXT",
      content: "Viết câu trả lời",
      instructions: "",
      maxScore: 2,
      order: 1,
      allowUploadedAudio: true,
      maxDurationSeconds: 60,
      options: [],
      media: [],
    },
  ],
};
test("mobile player uses inline chips and compact options; draft and submit keep the typed API contract", async ({
  page,
}) => {
  await installApiFixture(page);
  let writes = 0;
  await page.route("**/assignments/assignment-design**", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization,content-type",
        },
      });
    const draft = route.request().url().endsWith("/draft");
    const method = route.request().method();
    if (draft && method === "PUT") {
      writes++;
      const payload = route.request().postDataJSON();
      expect(payload.answers[1].text).toContain("https://example.com");
      return route.fulfill({
        headers: { "Access-Control-Allow-Origin": "*" },
        json: {
          data: {
            id: "draft-one",
            version: writes,
            assignmentVersionId: assignment.assignmentVersionId,
            submittedAt: null,
            status: "DRAFT",
            answers: payload.answers,
            grades: [],
            totalScore: null,
            totalMax: 3,
            percentage: null,
            overallComment: "",
            overallAdvice: "",
          },
        },
      });
    }
    return route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: { data: draft ? null : assignment },
    });
  });
  await page.goto("login/");
  await page.getByLabel("ID học sinh").fill("HV000123");
  await page.locator("input[type=password]").fill("Demo123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Thread Unit 1", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "assignment/?assignmentId=assignment-design&classId=juniors-03",
  );
  await expect(page).toHaveTitle(
    "Trung tâm Ngoại ngữ Lá Xanh · Khám phá đại dương",
  );
  const header = page.locator("header");
  await expect(
    header.getByRole("button", { name: "Giao diện", exact: true }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", { name: "Tài khoản", exact: true }),
  ).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Menu học sinh" }),
  ).toHaveCount(0);
  expect(
    await header.evaluate(
      (el) => el.closest("[data-assignment-surface]") === null,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "1. Which animal lives in the sea?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "0 / 2 câu · Xem danh sách" }),
  ).toBeVisible();
  const input = page.getByRole("textbox", { name: "Câu trả lời của em" });
  await input.fill("Em học tại https://example.com");
  await input.press("Tab");
  await expect(input.locator(".assignment-chip-link")).toHaveText(
    "example.com",
  );
  await page.getByRole("radio", { name: "A fish" }).check();
  await expect.poll(() => writes).toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Nộp bài", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục làm bài" }).click();
  await expect(input).toHaveText("Em học tại example.com");
});
