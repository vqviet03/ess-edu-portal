import type { Page, WebSocketRoute } from "@playwright/test";
import type {
  Comment,
  MaterialFile,
  Post,
  Notification,
} from "../../src/features/materials/models";
import {
  classes,
  materials,
  materialUrls,
  progress,
  reports,
  student,
  units,
} from "./data";
import { resolveApiConfiguration } from "../../src/api/config";

// Only the test runner imports this. Browser code always sends HTTP requests.
export async function installApiFixture(
  page: Page,
  options: { images?: boolean } = {},
) {
  const { baseUrl } = resolveApiConfiguration(
    process.env.NEXT_PUBLIC_API_BASE_URL,
  );
  const sessions = new Map<string, string>();
  let consumed = false;
  const files: MaterialFile[] = materials.slice(0, 2).map((m) => ({
    id: m.id,
    originalName: m.title,
    displayName: m.title,
    mimeType: m.type === "audio" ? "audio/mpeg" : "application/pdf",
    sizeBytes: 1200,
    thumbnailUrl: null,
    folderId: null,
    authorId: "teacher-one",
    authorName: "Vũ Quốc Việt",
    uploadedBy: "teacher-one",
    uploadSource: "session",
    sourceSessionId: "session-one",
    sourcePostId: "post-one",
    status: "AVAILABLE",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const thread: Post = {
    id: "post-one",
    sessionId: "session-one",
    classId: "juniors-03",
    title: "Thread Unit 1",
    postType: "SESSION_MATERIAL",
    sessionName: "Unit 1",
    className: "Juniors 03",
    editedAt: null,
    canEdit: false,
    canDelete: false,
    body: "Hướng dẫn học tập",
    status: "PUBLISHED",
    authorId: "teacher-one",
    authorName: "Vũ Quốc Việt",
    publishedBy: "teacher-one",
    publisherName: "Vũ Quốc Việt",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    attachments: files.map((file) => ({
      materialId: file.id,
      group: file.mimeType.startsWith("audio/") ? "AUDIO" : "LESSON",
      available: true,
      file,
    })),
    reactions: [],
    myReaction: null,
    commentCount: 0,
  };
  const comments: Comment[] = [];
  if (options.images) {
    files[0].thumbnailUrl = "/protected-thumbnail";
    files[0].mimeType = "image/png";
    comments.push({
      id: "image-comment",
      postId: thread.id,
      parentId: null,
      authorId: student.id,
      authorName: student.fullName,
      body: "Ảnh bình luận",
      version: 1,
      createdAt: new Date().toISOString(),
      attachments: [files[0]],
    });
    thread.commentCount = comments.length;
    const pdf = {
      ...files[0],
      id: "mixed-pdf",
      displayName: "Bài học kèm ảnh.pdf",
      mimeType: "application/pdf",
      thumbnailUrl: null,
    };
    files.push(pdf);
    thread.attachments.push({
      materialId: pdf.id,
      group: "LESSON",
      available: true,
      file: pdf,
    });
  }
  const notices: Notification[] = [],
    sockets = new Set<WebSocketRoute>();
  const snapshot = () => ({
    type: "NOTIFICATIONS",
    data: {
      items: notices.filter((n) => !deleted.has(n.id)),
      nextCursor: null,
      unreadCount: notices.filter((n) => !n.isRead && !deleted.has(n.id))
        .length,
    },
  });
  const deleted = new Set<string>();

  const issue = (id: string) => {
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    const accessToken = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.parse(expiresAt) / 1000) })).toString("base64url")}.${id}`;
    sessions.set(accessToken, id);
    return {
      accessToken,
      expiresAt,
      tokenType: "Bearer",
      student: { ...student, studentCode: id },
    };
  };
  await page.routeWebSocket(
    `${baseUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:")}/events/ws`,
    (socket) => {
      sockets.add(socket);
      socket.onMessage(message => {
        const frame=JSON.parse(String(message)) as {type:string};
        if(frame.type!=="AUTH")return;
        socket.send(JSON.stringify({ type: "READY", cursor: "0" }));
        socket.send(JSON.stringify(snapshot()));
      });
      socket.onClose(() => sockets.delete(socket));
    },
  );
  await page.route(`${baseUrl}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url()).pathname.replace(
      new URL(baseUrl).pathname,
      "",
    );
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization,content-type,accept",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    };
    const send = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    const fail = (status: number, code: string, message: string) =>
      send({ error: { code, message } }, status);
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (/^\/(posts|comments)\/[^/]+\/view$/.test(url) && req.method()==="POST") return send({data:{recorded:true}});
    if (/^\/(posts|comments)\/[^/]+\/viewers$/.test(url)) return send({data:{items:[],total:0,page:1,pageSize:30}});
    if (url === "/application-settings")
      return send({ data: { appName: "Trung tâm Ngoại ngữ Lá Xanh", classIdPrefix: "lx", version: 2, schemaReady: true } });
    if (url === "/auth/login") {
      const body = req.postDataJSON();
      if (req.headers().authorization)
        return fail(400, "INVALID_REQUEST", "Login không gửi JWT.");
      if (
        !["HV000123", "HVEMPTY", "HVFORBIDDEN", "HVNOREPORT"].includes(
          body.studentId,
        ) ||
        body.password !== "Demo123!"
      )
        return fail(
          401,
          "INVALID_CREDENTIALS",
          "ID học sinh hoặc mật khẩu không đúng.",
        );
      return send({ data: issue(body.studentId) });
    }
    if (url === "/auth/exchange") {
      const { code } = req.postDataJSON();
      if (code === "expired-test-code")
        return fail(410, "CODE_EXPIRED", "Liên kết đã hết hạn.");
      if (code !== "valid-test-code")
        return fail(400, "INVALID_CODE", "Mã đăng nhập không hợp lệ.");
      if (consumed) return fail(410, "CODE_USED", "Liên kết đã được sử dụng.");
      consumed = true;
      return send({ data: issue("HV000123") });
    }
    const token = (req.headers().authorization ?? "").replace(/^Bearer /, "");
    const id = sessions.get(token);
    if (!id) return fail(401, "UNAUTHORIZED", "Phiên không hợp lệ.");
    if (url === "/auth/logout") {
      sessions.delete(token);
      return send({ data: { loggedOut: true } });
    }
    if (url === "/notifications/read-all") {
      for (const n of notices) {
        if (!n.isRead) {
          n.isRead = true;
          n.version++;
        }
      }
      return send({ data: { read: true } });
    }
    if (url === "/notifications") {
      const params = new URL(req.url()).searchParams;
      return send({
        data: {
          items: notices.filter(
            (n) =>
              !deleted.has(n.id) &&
              (!params.get("type") || n.type === params.get("type")) &&
              (!params.has("isRead") ||
                n.isRead === (params.get("isRead") === "true")),
          ),
          nextCursor: null,
          unreadCount: notices.filter((n) => !n.isRead && !deleted.has(n.id))
            .length,
        },
      });
    }
    if (url.startsWith("/notifications/")) {
      const n = notices.find((n) => n.id === url.split("/").at(-1));
      if (!n) return fail(404, "NOT_FOUND", "Không tìm thấy");
      const body = req.postDataJSON();
      if (body.version !== n.version)
        return fail(409, "CONFLICT", "Dữ liệu đã thay đổi");
      if (req.method() === "DELETE") {
        deleted.add(n.id);
        return send({ data: { deleted: true } });
      }
      n.isRead = body.isRead;
      n.version++;
      return send({ data: n });
    }
    if (url === "/posts/post-one") return send({ data: thread });
    if (url === "/me") return send({ data: { ...student, studentCode: id } });
    if (id === "HVFORBIDDEN")
      return fail(403, "FORBIDDEN", "Bạn không có quyền truy cập dữ liệu này.");
    if (
      /^\/classes\/[^/]+\/(threads|thread-sessions)$/.test(url) &&
      !url.includes("juniors-03")
    )
      return send({ data: { items: [], nextCursor: null } });
    if (url === "/me/classes")
      return send({ data: { items: id === "HVEMPTY" ? [] : classes } });
    if (url.match(/^\/classes\/[^/]+\/contacts$/))
      return send({
        data: {
          items: [
            {
              id: "vq.viet",
              name: "Vũ Quốc Việt",
              email: "teacher@example.test",
              phone: "0900000000",
            },
          ],
        },
      });
    if (url === "/classes/juniors-03/thread-sessions")
      return send({
        data: {
          items: [
            {
              id: "session-one",
              name: "Unit 1",
              date: "2026-10-06",
              unitNumber: 1,
              status: "COMPLETED",
            },
            {
              id: "session-two",
              name: "Unit 2",
              date: "2026-10-08",
              unitNumber: 2,
              status: "DRAFT",
            },
          ],
        },
      });
    if (url === "/classes/juniors-03/threads") {
      const sid = new URL(req.url()).searchParams.get("sessionId");
      return send({
        data: {
          items: sid && sid !== thread.sessionId ? [] : [thread],
          nextCursor: null,
        },
      });
    }
    if (url === "/posts/post-one/reaction") {
      const reaction =
        req.method() === "DELETE" ? null : req.postDataJSON().reaction;
      thread.myReaction = reaction;
      thread.reactions = reaction ? [{ reaction, count: 1 }] : [];
      return send({ data: { reaction } });
    }
    if (url === "/posts/post-one/comments") {
      if (req.method() === "GET")
        return send({ data: { items: comments, nextCursor: null } });
      const body = req.postDataJSON();
      const comment = {
        id: `comment-${comments.length + 1}`,
        postId: "post-one",
        parentId: body.parentId ?? null,
        parentAuthorName:
          comments.find((c) => c.id === body.parentId)?.authorName ?? null,
        authorId: student.id,
        authorName: student.fullName,
        body: body.body,
        version: 1,
        createdAt: new Date().toISOString(),
        attachments: files.filter((f) => body.materialIds?.includes(f.id)),
      };
      comments.push(comment);
      thread.commentCount = comments.length;
      return send({ data: comment });
    }
    const commentId = url.match(/^\/comments\/(.+)$/)?.[1];
    if (commentId) {
      const index = comments.findIndex((c) => c.id === commentId);
      if (index < 0) return fail(404, "NOT_FOUND", "Không tìm thấy bình luận.");
      if (req.method() === "DELETE") {
        comments.splice(index, 1);
        thread.commentCount = comments.length;
        return send({ data: { deleted: true } });
      }
      const body = req.postDataJSON();
      comments[index] = {
        ...comments[index],
        body: body.body,
        version: comments[index].version + 1,
        attachments: files.filter((f) => body.materialIds?.includes(f.id)),
      };
      return send({ data: comments[index] });
    }
    if (url === "/material-upload-settings")
      return send({
        data: {
          maxUploadBytes: 1e8,
          largeFileWarningBytes: 2e7,
          areas: ["OTHER"],
          storages: [{ id: "OTHER", name: "Kho bình luận", category: "OTHER" }],
          routes: [
            {
              source: "comment",
              fileType: "all",
              storageId: "OTHER",
              version: 1,
            },
          ],
        },
      });
    if (url === "/material-uploads/initiate")
      return send({
        data: {
          uploadId: "comment-upload",
          uploadUrl: "https://uploads.example.test/comment",
          thumbnailUploadUrl: null,
          method: "PUT",
          headers: {},
          version: 1,
          expiresAt: "2099-01-01T00:00:00Z",
        },
      });
    if (url === "/material-uploads/comment-upload/complete") {
      const file: MaterialFile = {
        ...files[0],
        id: "comment-file",
        displayName: "ghi-chu.txt",
        originalName: "ghi-chu.txt",
        mimeType: "text/plain",
        uploadSource: "comment",
      };
      files.push(file);
      return send({ data: file });
    }
    if (url === "/materials/audio/content") {
      const wav = Buffer.alloc(160044);
      wav.write("RIFF");
      wav.writeUInt32LE(160036, 4);
      wav.write("WAVEfmt ", 8);
      wav.writeUInt32LE(16, 16);
      wav.writeUInt16LE(1, 20);
      wav.writeUInt16LE(1, 22);
      wav.writeUInt32LE(8000, 24);
      wav.writeUInt32LE(16000, 28);
      wav.writeUInt16LE(2, 32);
      wav.writeUInt16LE(16, 34);
      wav.write("data", 36);
      wav.writeUInt32LE(160000, 40);
      return route.fulfill({
        status: 200,
        headers,
        contentType: "audio/wav",
        body: wav,
      });
    }
    if (
      url.match(/^\/materials\/[^/]+\/content$/) &&
      new URL(req.url()).searchParams.get("purpose") === "thumbnail"
    )
      return route.fulfill({
        status: 200,
        headers,
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvL0AAAAASUVORK5CYII=",
          "base64",
        ),
      });
    if (url.match(/^\/materials\/[^/]+\/content$/))
      return route.fulfill({
        status: 200,
        headers,
        contentType: url.includes("audio")
          ? "audio/mpeg"
          : "application/octet-stream",
        body: "private-test-file",
      });
    const match = url.match(/^\/me\/classes\/([^/]+)\/(.*)$/);
    if (!match) return fail(404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    const [, classId, endpoint] = match;
    const empty = classId !== "juniors-03";
    if (endpoint === "units")
      return send({
        data: {
          items: empty
            ? []
            : units.map((u) => ({ ...u, hasReport: id !== "HVNOREPORT" })),
        },
      });
    if (endpoint === "progress")
      return send({ data: { items: empty ? [] : progress } });
    if (endpoint === "materials")
      return send({ data: { items: empty ? [] : materials } });
    const reportId = endpoint.match(/^units\/([^/]+)\/report$/)?.[1];
    const report = reports.find((r) => r.unitId === reportId);
    if (report && !empty && id !== "HVNOREPORT") return send({ data: report });
    const materialId = endpoint.match(/^materials\/([^/]+)\/access$/)?.[1];
    if (materialId && !empty && materialUrls[materialId])
      return send({
        data: {
          url: materialUrls[materialId],
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      });
    return fail(404, "NOT_FOUND", "Chưa có báo cáo.");
  });
  return {
    changeComment(id: string, body: string) {
      const comment = comments.find(c => c.id === id);
      if (!comment) throw new Error("Test comment not found");
      comment.body = body;
      comment.version++;
    },
    resourceChanged(data: {id: string; href: string}) {
      for (const socket of sockets)
        socket.send(JSON.stringify({type: "RESOURCE_CHANGED", data}));
    },
    notify(n: Notification) {
      const at = notices.findIndex((old) => old.id === n.id);
      if (at < 0) notices.unshift({ ...n });
      else notices[at] = { ...n };
      for (const socket of sockets)
        socket.send(JSON.stringify({ type: "NOTIFICATION", data: n }));
    },
  };
}
