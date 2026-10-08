"use client";
import { Comments } from "./comments";
import { PostSurface } from "./post-surface";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { IconAction } from "@/shared/icon-action";
import FirstPage from "@mui/icons-material/FirstPage";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { useReactionMutation } from "@/api/library-api";
import { Feedback } from "@/shared/ui";
import { useThreadsQuery, usePostQuery } from "@/api/library-api";
import type { MaterialFile, Post } from "./models";

import { MaterialViewer } from "./viewer";
function PostCard({
  post,
  cursor,
  targetComment,
}: {
  post: Post;
  cursor?: string;
  targetComment?: string;
}) {
  const [showComments, setShowComments] = useState(!!targetComment),
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
          targetComment={targetComment}
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
  const params = useSearchParams(),
    targetId = params.get("postId"),
    targetComment = params.get("commentId") ?? undefined;
  const inPage = list.currentData?.items.some((p) => p.id === targetId);
  const target = usePostQuery(targetId ?? "", {
    skip: !enabled || !targetId || !list.currentData || !!inPage,
  });
  const pinned =
    target.currentData?.classId === classId &&
    !inPage &&
    (!postType || target.currentData.postType === postType) &&
    (!sessionId || target.currentData.sessionId === sessionId)
      ? target.currentData
      : undefined;
  const scrolled = useRef<string | null>(null);
  useEffect(() => {
    if (targetId && (inPage || pinned) && scrolled.current !== targetId) {
      document
        .getElementById(`post-${targetId}`)
        ?.scrollIntoView({ block: "center" });
      scrolled.current = targetId;
    }
  }, [targetId, inPage, pinned]);
  return (
    <Stack spacing={2} sx={{ maxWidth: 680, mx: "auto", width: "100%" }}>
      {targetId && (
        <Feedback
          loading={target.isLoading}
          error={target.error}
          retry={() => void target.refetch()}
        />
      )}
      {pinned && (
        <Box id={`post-${pinned.id}`}>
          <PostCard
            post={pinned}
            cursor={cursor}
            targetComment={targetComment}
          />
        </Box>
      )}
      <Feedback
        loading={list.isLoading}
        error={list.error}
        retry={() => void list.refetch()}
      />
      {list.currentData?.items.map((post) => (
        <Box key={post.id} id={`post-${post.id}`}>
          <PostCard
            post={post}
            cursor={cursor}
            targetComment={post.id === targetId ? targetComment : undefined}
          />
        </Box>
      ))}
      {!list.isLoading && !list.error && !list.currentData?.items.length && (
        <Feedback empty="Lớp chưa có thread được công bố." />
      )}
      <Stack direction="row">
        {cursor && (
          <IconAction
            label="Thread mới nhất"
            icon={<FirstPage fontSize="small" />}
            onClick={() => setCursor(undefined)}
          />
        )}
        {list.currentData?.nextCursor && (
          <IconAction
            label="Thread tiếp theo"
            icon={<ArrowForward fontSize="small" />}
            onClick={() => setCursor(list.currentData?.nextCursor ?? undefined)}
          />
        )}
      </Stack>
    </Stack>
  );
}
