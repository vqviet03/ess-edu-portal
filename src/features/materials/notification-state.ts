import { createAction } from "@reduxjs/toolkit";
import type { CursorPage, Notification } from "./models";

export interface NotificationFilter {
  type?: string;
  isRead?: boolean;
  cursor?: string;
}
export const noticeReceived = createAction<Notification>(
  "student/noticeReceived",
);
export const noticeSnapshotReceived = createAction<CursorPage<Notification>>(
  "student/noticeSnapshotReceived",
);
export function notificationFilter(
  filter: NotificationFilter,
): NotificationFilter {
  return {
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.isRead !== undefined ? { isRead: filter.isRead } : {}),
    ...(filter.cursor ? { cursor: filter.cursor } : {}),
  };
}
export function mergeNotice(
  page: CursorPage<Notification>,
  filter: NotificationFilter,
  notice: Notification,
  unreadDelta?: number,
) {
  const index = page.items.findIndex((item) => item.id === notice.id),
    old = page.items[index];
  if (old && old.version >= notice.version) return;
  if (page.unreadCount !== undefined)
    page.unreadCount = Math.max(
      0,
      page.unreadCount +
        (unreadDelta ??
          (old
            ? Number(!notice.isRead) - Number(!old.isRead)
            : Number(!notice.isRead))),
    );
  const matches =
    (!filter.type || filter.type === notice.type) &&
    (filter.isRead === undefined || filter.isRead === notice.isRead);
  if (index >= 0) {
    if (matches) page.items[index] = notice;
    else page.items.splice(index, 1);
  } else if (!filter.cursor && matches) {
    page.items.unshift(notice);
    while(page.items.length>15){const index=page.items.findLastIndex(n=>n.id!==notice.id&&(n.isRead||n.priority!=="IMPORTANT"&&!["APPROVAL","CONSENT"].includes(n.type)));if(index<0)break;const [removed]=page.items.splice(index,1);if(!removed.isRead&&page.unreadCount!==undefined)page.unreadCount=Math.max(0,page.unreadCount-1);}
  }
}
export function studentNoticeHref(
  notice: Pick<Notification, "type" | "href">,
): string | null {
  try {
    const target = new URL(notice.href, "https://portal.invalid");
    if (target.origin !== "https://portal.invalid") return null;
    const classId = target.searchParams.get("classId");
    if (!classId) return null;
    const query = new URLSearchParams({
      classId,
      tab:
        notice.type === "ATTENDANCE" || notice.type === "SCHEDULE"
          ? "attendance"
          : notice.type === "REWARD"
            ? "rewards"
            : notice.type === "SCORE"
              ? "report"
              : "thread",
    });
    for (const key of ["postId", "commentId", "unitId"]) {
      const value = target.searchParams.get(key);
      if (value) query.set(key, value);
    }
    return `/home/?${query}`;
  } catch {
    return null;
  }
}
