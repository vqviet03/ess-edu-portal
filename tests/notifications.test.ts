import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeNotice,
  notificationFilter,
  noticeReceived,
  noticeSnapshotReceived,
  studentNoticeHref,
} from "../src/features/materials/notification-state";
import type {
  Notification,
  CursorPage,
} from "../src/features/materials/models";
import { realtimeTags } from "../src/api/realtime-tags";
import { libraryApi } from "../src/api/library-api";
import { makeStore } from "../src/store";
import { signedIn, loggedOut } from "../src/store/auth";
import { testSession } from "./support/data";
const notice: Notification = {
  id: "notice-1",
  type: "REPLY",
  title: "Trả lời",
  href: "/session/?classId=class-1&postId=post-1&commentId=reply-1",
  isRead: false,
  version: 1,
  createdAt: "2026-10-08T10:00:00Z",
};
test("notification links stay inside the student portal and preserve the exact resource", () => {
  assert.equal(
    studentNoticeHref(notice),
    "/home/?classId=class-1&tab=thread&postId=post-1&commentId=reply-1",
  );
  assert.equal(
    studentNoticeHref({
      ...notice,
      type: "SCORE",
      href: "/home/?classId=c&unitId=u&tab=report",
    }),
    "/home/?classId=c&tab=report&unitId=u",
  );
  for (const href of [
    "https://evil.example/?classId=c",
    "//evil.example/?classId=c",
    "javascript:alert(1)",
    "/home/",
  ])
    assert.equal(studentNoticeHref({ ...notice, href }), null);
  assert.deepEqual(
    notificationFilter({ type: "", cursor: "", isRead: false }),
    { isRead: false },
  );
});
test("socket notices merge by ID/version without double counting and respect filters", () => {
  const page: CursorPage<Notification> = {
    items: [],
    nextCursor: null,
    unreadCount: 0,
  };
  mergeNotice(page, {}, notice);
  mergeNotice(page, {}, notice);
  assert.equal(page.items.length, 1);
  assert.equal(page.unreadCount, 1);
  mergeNotice(page, { isRead: false }, { ...notice, isRead: true, version: 2 });
  assert.equal(page.items.length, 0);
  assert.equal(page.unreadCount, 0);
  const older: CursorPage<Notification> = {
    items: [],
    nextCursor: "60",
    unreadCount: 0,
  };
  mergeNotice(older, { cursor: "30" }, notice);
  assert.equal(older.items.length, 0);
  const filtered: CursorPage<Notification> = {
    items: [],
    nextCursor: null,
    unreadCount: 0,
  };
  mergeNotice(filtered, { type: "SCORE" }, notice);
  assert.equal(filtered.items.length, 0);
});
test("score events refresh scores while reply events never fetch reports", () => {
  assert.deepEqual(realtimeTags("NOTIFICATION", "c", "SCORE"), [
    { type: "Report", id: "c" },
    { type: "Progress", id: "c" },
    { type: "Units", id: "c" },
  ]);
  assert.deepEqual(realtimeTags("NOTIFICATION", "c", "REPLY"), [
    { type: "Threads", id: "c" },
    "Comments",
  ]);
});
test("queued socket snapshot followed by a notice is durable in Redux and logout clears it", async () => {
  const store = makeStore();
  store.dispatch(signedIn(testSession()));
  store.dispatch(
    noticeSnapshotReceived({ items: [], nextCursor: null, unreadCount: 0 }),
  );
  store.dispatch(noticeReceived(notice));
  store.dispatch(noticeReceived(notice));
  await new Promise((resolve) => setTimeout(resolve, 25));
  const result = libraryApi.endpoints.notifications.select({})(
    store.getState(),
  ).data;
  assert.equal(result?.items.length, 1);
  assert.equal(result?.unreadCount, 1);
  store.dispatch(loggedOut());
  store.dispatch(noticeReceived({ ...notice, id: "private" }));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(
    libraryApi.endpoints.notifications.select({})(store.getState()).data,
    undefined,
  );
});
