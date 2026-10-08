"use client";
import { Comments } from "./comments";
import { PostSurface } from "./post-surface";
import { useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { useReactionMutation } from "@/api/library-api";
import { Feedback } from "@/shared/ui";
import { useThreadsQuery } from "@/api/library-api";
import type { MaterialFile, Post } from "./models";

import { MaterialViewer } from "./viewer";
function PostCard({ post, cursor }: { post: Post; cursor?: string }) {
  const [showComments, setShowComments] = useState(false),
    [preview, setPreview] = useState<MaterialFile | null>(null),
    [reaction, state] = useReactionMutation(),
    [error, setError] = useState<unknown>();
  return (
    <>
      <PostSurface
        post={post}
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
        <Comments
          post={post}
          expanded={showComments}
          expand={() => setShowComments(true)}
        />
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
