import { test } from "node:test";
import assert from "node:assert/strict";
import {
  absenceWarning,
  calendarCells,
} from "../src/features/attendance/models";
import { realtimeTags } from "../src/api/realtime-tags";
import { studentNoticeHref } from "../src/features/materials/notification-state";
test("attendance warnings do not divide by zero or round across thresholds", () => {
  assert.equal(absenceWarning(0, 0).percentage, null);
  assert.equal(absenceWarning(2, 20).warning, "WARNING");
  assert.equal(absenceWarning(4, 20).warning, "WARNING");
  assert.equal(absenceWarning(5, 20).warning, "DANGER");
  assert.equal(
    calendarCells("2028-02").filter((d) => d === "2028-02-29").length,
    1,
  );
});
test("attendance notifications open the report and refresh only affected resources", () => {
  assert.deepEqual(realtimeTags("NOTIFICATION", "c", "ATTENDANCE"), [
    { type: "Attendance", id: "c" },
    { type: "Rewards", id: "c" },
  ]);
  assert.equal(
    studentNoticeHref({
      type: "ATTENDANCE",
      href: "/class/?classId=c&tab=attendance",
    }),
    "/home/?classId=c&tab=attendance",
  );
});
