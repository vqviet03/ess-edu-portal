import test from "node:test";
import assert from "node:assert/strict";
import { realtimeTags } from "../src/api/realtime-tags";
test("comments/reactions refresh thread and comments, never score/report APIs", () => {
  assert.deepEqual(realtimeTags("NOTIFICATION", "class-a", "SOCIAL"), [
    { type: "Threads", id: "class-a" },
    "Comments",
  ]);
  assert.deepEqual(realtimeTags("NOTIFICATION", "class-a", "MATERIAL"), [
    { type: "Threads", id: "class-a" },
    "Comments",
    { type: "Materials", id: "class-a" },
  ]);
});
test("academic operations target class reports and units, not the library", () => {
  assert.deepEqual(realtimeTags("RESOURCE_CHANGED", "class-a"), [
    "Classes",
    { type: "Report", id: "class-a" },
    { type: "Progress", id: "class-a" },
    { type: "Units", id: "class-a" },
  ]);
});

test("assignment reopen refreshes only its form and draft", () => {
  const tags = realtimeTags(
    "NOTIFICATION",
    "class-a",
    "ASSIGNMENT",
    "assignment-a",
  );
  assert.deepEqual(tags.slice(0, 2), [
    { type: "AssignmentForm", id: "assignment-a" },
    { type: "AssignmentDraft", id: "assignment-a" },
  ]);
});
