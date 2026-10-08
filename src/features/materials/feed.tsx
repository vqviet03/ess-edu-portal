"use client";
import { PostSurface } from "./post-surface";
import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import {
  useReactionMutation,
  useCommentsQuery,
  useSaveCommentMutation,
  useRemoveCommentMutation,
} from "@/api/library-api";
import { useAppSelector } from "@/store";
import { Feedback } from "@/shared/ui";
import { useThreadsQuery } from "@/api/library-api";
import { useUnsaved } from "@/shared/unsaved";
import type { MaterialFile, Post } from "./models";

import { MaterialViewer } from "./viewer";
import { UploadDialog } from "./upload";
function Comments({ post }: { post: Post }) {
  const student = useAppSelector((s) => s.auth.student),
    me = student ? { id: student.id, roles: [] as string[] } : null,
    [cursor, setCursor] = useState<string>(),
    query = useCommentsQuery({ postId: post.id, cursor }),
    [body, setBody] = useState(""),
    [upload, setUpload] = useState(false),
    [attachments, setAttachments] = useState<MaterialFile[]>([]),
    [preview, setPreview] = useState<MaterialFile | null>(null),
    [parent, setParent] = useState<string>(),
    [editing, setEditing] = useState<{ id: string; version: number } | null>(
      null,
    ),
    [save, state] = useSaveCommentMutation(),
    [remove] = useRemoveCommentMutation(),
    [error, setError] = useState<unknown>();
  useUnsaved(!!body.trim() || attachments.length > 0);
  return (
    <Stack spacing={1.5}>
      <Feedback
        loading={query.isLoading}
        error={query.error || error}
        retry={() => {
          setError(undefined);
          void query.refetch();
        }}
      />
      {query.currentData?.items.map((c) => (
        <Paper
          key={c.id}
          variant="outlined"
          sx={{ p: 1.5, ml: c.parentId ? { xs: 1, md: 3 } : 0 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {c.authorName} · {new Date(c.createdAt).toLocaleString("vi-VN")}
          </Typography>
          {c.parentId && (
            <Typography variant="caption" color="text.secondary">
              Trả lời bình luận
            </Typography>
          )}
          <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {c.body}
          </Typography>
          {c.attachments?.map((file) => (
            <Button key={file.id} onClick={() => setPreview(file)}>
              {file.displayName}
            </Button>
          ))}
          <Stack direction="row">
            <Button
              disabled={c.version === 0}
              onClick={() => {
                setParent(c.id);
                setEditing(null);
              }}
            >
              Trả lời
            </Button>
            {c.authorId === me?.id && (
              <Button
                onClick={() => {
                  if (c.version === 0) return;
                  setEditing({ id: c.id, version: c.version });
                  setBody(c.body);
                  setAttachments(c.attachments ?? []);
                  setParent(undefined);
                }}
              >
                Sửa
              </Button>
            )}
            {(c.authorId === me?.id || me?.roles?.includes("MANAGER")) && (
              <Button
                disabled={c.version === 0}
                onClick={async () => {
                  if (!window.confirm("Xóa mềm bình luận này?")) return;
                  try {
                    await remove({
                      id: c.id,
                      postId: post.id,
                      version: c.version,
                    }).unwrap();
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Xóa
              </Button>
            )}
          </Stack>
        </Paper>
      ))}
      <Stack direction="row">
        {cursor && (
          <Button onClick={() => setCursor(undefined)}>Bình luận đầu</Button>
        )}
        {query.currentData?.nextCursor && (
          <Button
            onClick={() =>
              setCursor(query.currentData?.nextCursor ?? undefined)
            }
          >
            Bình luận tiếp theo
          </Button>
        )}
      </Stack>
      {(parent || editing) && (
        <Chip
          label={editing ? "Đang sửa bình luận" : "Đang trả lời"}
          onDelete={() => {
            setParent(undefined);
            setEditing(null);
          }}
        />
      )}
      <TextField
        multiline
        minRows={2}
        label="Viết bình luận"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 5000 } }}
      />
      <Button onClick={() => setUpload(true)}>
        Đính kèm ảnh / file / audio / video
      </Button>
      {attachments.map((file) => (
        <Chip
          key={file.id}
          label={file.displayName}
          onDelete={() =>
            setAttachments((old) => old.filter((f) => f.id !== file.id))
          }
        />
      ))}
      {upload && (
        <UploadDialog
          folderId={null}
          postId={post.id}
          close={() => setUpload(false)}
          added={(file) => setAttachments((old) => [...old, file])}
        />
      )}
      {preview && (
        <MaterialViewer file={preview} close={() => setPreview(null)} />
      )}
      <Button
        variant="contained"
        disabled={(!body.trim() && !attachments.length) || state.isLoading}
        onClick={async () => {
          setError(undefined);
          try {
            await save({
              postId: post.id,
              id: editing?.id,
              version: editing?.version,
              body,
              parentId: parent,
              materialIds: attachments.map((file) => file.id),
            }).unwrap();
            setBody("");
            setAttachments([]);
            setParent(undefined);
            setEditing(null);
            setCursor(undefined);
          } catch (e) {
            setError(e);
          }
        }}
      >
        Gửi bình luận
      </Button>
    </Stack>
  );
}
function PostCard({ post, cursor }: { post: Post; cursor?: string }) {
  const me = useAppSelector((s) => s.auth.student),
    [showComments, setShowComments] = useState(false),
    [preview, setPreview] = useState<MaterialFile | null>(null),
    [reaction, state] = useReactionMutation(),
    [error, setError] = useState<unknown>();
  return (
    <>
      <PostSurface
        post={post}
        viewerName={me?.fullName ?? "Bạn"}
        commentOpen={showComments}
        openComments={() => setShowComments((s) => !s)}
        preview={setPreview}
        reacting={state.isLoading}
        onReaction={async (value) => {
          setError(undefined);
          try {
            await reaction({
              id: post.id,
              sessionId: post.sessionId,
              cursor,
              reaction: post.myReaction === value ? null : value,
            }).unwrap();
          } catch (e) {
            setError(e);
          }
        }}
      >
        <Comments post={post} />
      </PostSurface>
      <Feedback error={error} />
      {preview && (
        <MaterialViewer file={preview} close={() => setPreview(null)} />
      )}
    </>
  );
}
export function ThreadFeed({
  classId,
  sessionId,
  postType,
  enabled = true,
}: {
  classId: string;
  sessionId?: string;
  postType?: Post["postType"];
  enabled?: boolean;
}) {
  const [cursor, setCursor] = useState<string>(),
    list = useThreadsQuery(
      { classId, cursor, sessionId, postType },
      { skip: !enabled },
    );
  return (
    <Stack spacing={2}>
      <Feedback
        loading={list.isLoading}
        error={list.error}
        retry={() => void list.refetch()}
      />
      {list.currentData?.items.map((post) => (
        <PostCard key={post.id} post={post} cursor={cursor} />
      ))}
      {!list.isLoading && !list.error && !list.currentData?.items.length && (
        <Feedback empty="Lớp chưa có thread được công bố." />
      )}
      <Stack direction="row">
        {cursor && (
          <Button onClick={() => setCursor(undefined)}>Thread mới nhất</Button>
        )}
        {list.currentData?.nextCursor && (
          <Button
            onClick={() => setCursor(list.currentData?.nextCursor ?? undefined)}
          >
            Thread tiếp theo
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
