import type { api } from "./api";
// Social signals never refresh scores: paid requests should follow changed resources.
export function realtimeTags(
  kind: "NOTIFICATION" | "RESOURCE_CHANGED",
  classId: string | null,
  noticeType?: string,
): Parameters<typeof api.util.invalidateTags>[0] {
  if (kind === "RESOURCE_CHANGED")
    return classId
      ? [
          "Classes",
          { type: "Report", id: classId },
          { type: "Progress", id: classId },
          { type: "Units", id: classId },
        ]
      : ["Classes", "Report", "Progress", "Units"];
  if (noticeType === "ATTENDANCE")
    return [
      { type: "Attendance", ...(classId ? { id: classId } : {}) },
      { type: "Rewards", ...(classId ? { id: classId } : {}) },
    ];
  if (noticeType === "REWARD" || noticeType === "SCHEDULE")
    return [
      { type: "Rewards", ...(classId ? { id: classId } : {}) },
      ...(noticeType === "SCHEDULE"
        ? [{ type: "Schedule" as const, ...(classId ? { id: classId } : {}) }]
        : []),
    ];
  if (noticeType === "SCORE")
    return classId
      ? [
          { type: "Report", id: classId },
          { type: "Progress", id: classId },
          { type: "Units", id: classId },
        ]
      : ["Report", "Progress", "Units"];
  const threads = classId
    ? { type: "Threads" as const, id: classId }
    : ("Threads" as const);
  if (noticeType === "SOCIAL" || noticeType === "REPLY")
    return [threads, "Comments"];
  return [
    threads,
    "Comments",
    classId ? { type: "Materials", id: classId } : "Materials",
  ];
}
