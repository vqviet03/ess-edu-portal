import { test } from "node:test";
import assert from "node:assert/strict";
import { vietnamToday, dateWindow } from "../src/features/rewards/models";
import { realtimeTags } from "../src/api/realtime-tags";
import { studentNoticeHref } from "../src/features/materials/notification-state";
test("reward dates are Vietnam local dates, no timezone shift in day windows", () => {
  assert.equal(vietnamToday(new Date("2026-10-08T17:01:00Z")), "2026-10-09");
  assert.deepEqual(dateWindow("2026-03-01", 1), {
    from: "2026-02-28",
    to: "2026-03-01",
  });
});
test("reward events only invalidate rewards; schedule updates refresh dependent chart", () => {
  assert.deepEqual(realtimeTags("NOTIFICATION", "class-1", "REWARD"), [
    { type: "Rewards", id: "class-1" },
  ]);
  assert.deepEqual(realtimeTags("NOTIFICATION", "class-1", "SCHEDULE"), [
    { type: "Rewards", id: "class-1" },
    { type: "Schedule", id: "class-1" },
    { type: "Attendance", id: "class-1" },
  ]);
});
test("reward notice opens the accumulation tab, keeps classroom scope", () => {
  const href = studentNoticeHref({
    href: "/class/?classId=class-1&tab=rewards",
    type: "REWARD",
  });
  assert.match(href ?? "", /classId=class-1/);
  assert.match(href ?? "", /tab=rewards/);
});
