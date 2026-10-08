import { api } from "./api";
import type { Envelope } from "@/models";
import type {
  CursorPage,
  Post,
  PostType,
  ThreadSession,
  Comment,
  MaterialFile,
  UploadInput,
  UploadSettings,
  UploadTicket,
  Reaction,
} from "@/features/materials/models";
import {
  putSigned,
  uploadBuffers,
} from "@/features/materials/upload-transport";
const unwrap = <T>(r: Envelope<T>) => r.data;
export const libraryApi = api.injectEndpoints({
  endpoints: (b) => ({
    threads: b.query<
      CursorPage<Post>,
      {
        classId: string;
        cursor?: string;
        sessionId?: string;
        postType?: PostType;
      }
    >({
      query: (q) => ({
        url: `/classes/${q.classId}/threads`,
        params: {
          cursor: q.cursor,
          sessionId: q.sessionId,
          postType: q.postType,
          limit: 10,
        },
      }),
      transformResponse: unwrap<CursorPage<Post>>,
      providesTags: (_, __, q) => [{ type: "Threads", id: q.classId }],
    }),
    threadSessions: b.query<{ items: ThreadSession[] }, string>({
      query: (id) => `/classes/${id}/thread-sessions`,
      transformResponse: unwrap<{ items: ThreadSession[] }>,
      providesTags: (_, __, id) => [{ type: "Units", id }],
    }),
    posts: b.query<CursorPage<Post>, { sessionId: string; cursor?: string }>({
      query: (q) => ({
        url: `/sessions/${q.sessionId}/posts`,
        params: { cursor: q.cursor },
      }),
      transformResponse: unwrap<CursorPage<Post>>,
      providesTags: ["Threads"],
    }),
    contacts: b.query<
      { items: { id: string; name: string; email: string; phone: string }[] },
      string
    >({
      query: (id) => `/classes/${id}/contacts`,
      transformResponse: unwrap<{
        items: { id: string; name: string; email: string; phone: string }[];
      }>,
      providesTags: ["Contacts"],
    }),
    comments: b.query<CursorPage<Comment>, { postId: string; cursor?: string }>(
      {
        query: (q) => ({
          url: `/posts/${q.postId}/comments`,
          params: { cursor: q.cursor },
        }),
        transformResponse: unwrap<CursorPage<Comment>>,
        providesTags: (_, __, q) => [{ type: "Comments", id: q.postId }],
      },
    ),
    saveComment: b.mutation<
      Comment,
      {
        id?: string;
        postId: string;
        body: string;
        parentId?: string;
        version?: number;
        materialIds?: string[];
      }
    >({
      query: ({ id, postId, ...body }) => ({
        url: id ? `/comments/${id}` : `/posts/${postId}/comments`,
        method: id ? "PATCH" : "POST",
        body,
      }),
      transformResponse: unwrap<Comment>,
      invalidatesTags: (_, e, q) =>
        e ? [] : [{ type: "Comments", id: q.postId }, "Threads"],
    }),
    removeComment: b.mutation<
      unknown,
      { id: string; postId: string; version: number }
    >({
      query: ({ id, version }) => ({
        url: `/comments/${id}`,
        method: "DELETE",
        body: { version, reason: "Xóa bình luận của tôi" },
      }),
      invalidatesTags: (_, e, q) =>
        e ? [] : [{ type: "Comments", id: q.postId }, "Threads"],
    }),
    reaction: b.mutation<
      unknown,
      {
        id: string;
        sessionId?: string | null;
        cursor?: string;
        reaction: Reaction | null;
      }
    >({
      query: (q) => ({
        url: `/posts/${q.id}/reaction`,
        method: q.reaction ? "PUT" : "DELETE",
        body: q.reaction ? { reaction: q.reaction } : undefined,
      }),
      async onQueryStarted(q, { dispatch, getState, queryFulfilled }) {
        const patches = libraryApi.util
          .selectCachedArgsForQuery(getState(), "threads")
          .map((args) =>
            dispatch(
              libraryApi.util.updateQueryData("threads", args, (draft) => {
                const p = draft.items.find((p) => p.id === q.id);
                if (!p) return;
                if (p.myReaction) {
                  const old = p.reactions.find(
                    (r) => r.reaction === p.myReaction,
                  );
                  if (old) old.count = Math.max(0, old.count - 1);
                }
                p.myReaction = q.reaction;
                if (q.reaction) {
                  const row = p.reactions.find(
                    (r) => r.reaction === q.reaction,
                  );
                  if (row) row.count++;
                  else p.reactions.push({ reaction: q.reaction, count: 1 });
                }
              }),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (_, e) => (e ? [] : ["Threads"]),
    }),
    content: b.query<
      { url: string; mimeType: string },
      { id: string; purpose: "preview" | "download" | "thumbnail" }
    >({
      query: (q) => ({
        url: `/materials/${q.id}/content`,
        params: { purpose: q.purpose },
        responseHandler: async (res) => {
          if (!res.ok) return res.json();
          const blob = await res.blob();
          return {
            url: URL.createObjectURL(blob),
            mimeType: blob.type.split(";")[0],
          };
        },
      }),
      keepUnusedDataFor: 0,
      async onCacheEntryAdded(_, { cacheDataLoaded, cacheEntryRemoved }) {
        let url: string | undefined;
        try {
          url = (await cacheDataLoaded).data.url;
          await cacheEntryRemoved;
        } catch {
        } finally {
          if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
        }
      },
    }),
    uploadSettings: b.query<UploadSettings, void>({
      query: () => "/material-upload-settings",
      transformResponse: unwrap<UploadSettings>,
    }),
    initiateUpload: b.mutation<UploadTicket, UploadInput>({
      query: (body) => ({
        url: "/material-uploads/initiate",
        method: "POST",
        body,
      }),
      transformResponse: unwrap<UploadTicket>,
    }),
    cancelUpload: b.mutation<unknown, { uploadId: string; version: number }>({
      query: (q) => ({
        url: `/material-uploads/${q.uploadId}`,
        method: "DELETE",
        body: { version: q.version },
      }),
    }),
    transferUpload: b.mutation<
      MaterialFile,
      { key: string; ticket: UploadTicket }
    >({
      async queryFn(arg, ctx, _, base) {
        const buffer = uploadBuffers.get(arg.key);
        if (!buffer)
          return { error: { status: "CUSTOM_ERROR", error: "Không có file." } };
        try {
          await putSigned(
            arg.ticket.uploadUrl,
            buffer.file,
            buffer.file.type || "application/octet-stream",
            ctx.signal,
            (v) => buffer.progress(Math.round(v * 0.9)),
          );
          if (buffer.thumbnail && arg.ticket.thumbnailUploadUrl)
            await putSigned(
              arg.ticket.thumbnailUploadUrl,
              buffer.thumbnail,
              buffer.thumbnail.type,
              ctx.signal,
              (v) => buffer.progress(90 + Math.round(v * 0.1)),
            );
          const result = await base({
            url: `/material-uploads/${arg.ticket.uploadId}/complete`,
            method: "POST",
            body: { version: arg.ticket.version },
          });
          return result.error
            ? { error: result.error }
            : { data: (result.data as Envelope<MaterialFile>).data };
        } catch (e) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: e instanceof Error ? e.message : "Upload thất bại.",
            },
          };
        }
      },
    }),
  }),
});
export const {
  useThreadsQuery,
  useThreadSessionsQuery,
  usePostsQuery,
  useContactsQuery,
  useCommentsQuery,
  useSaveCommentMutation,
  useRemoveCommentMutation,
  useReactionMutation,
  useContentQuery,
  useLazyContentQuery,
  useUploadSettingsQuery,
  useInitiateUploadMutation,
  useCancelUploadMutation,
  useTransferUploadMutation,
} = libraryApi;
