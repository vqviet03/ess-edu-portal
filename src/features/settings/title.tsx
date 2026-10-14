"use client";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useApplicationSettingsQuery } from "@/api/api";
import { assignmentApi } from "@/api/assignment-api";
import { libraryApi } from "@/api/library-api";
import { useAppSelector } from "@/store";

export function ApplicationTitle() {
  const settings = useApplicationSettingsQuery();
  const name = settings.data?.appName?.trim() || "Cổng học sinh";
  return (
    <Suspense fallback={<title>{`${name} · Báo cáo học tập`}</title>}>
      <LinkedContentTitle name={name} />
    </Suspense>
  );
}

function LinkedContentTitle({ name }: { name: string }) {
  const path = usePathname(),
    params = useSearchParams();
  const postId = /\/post\/?$/.test(path) ? (params.get("postId") ?? "") : "";
  const assignmentId = /\/assignment\/?$/.test(path)
    ? (params.get("assignmentId") ?? "")
    : "";
  // Read the screen's existing RTK Query cache; never issue another content request.
  const postTitle = useAppSelector(
    (state) => libraryApi.endpoints.post.select(postId)(state).data?.title,
  );
  const assignmentTitle = useAppSelector(
    (state) =>
      assignmentApi.endpoints.assignment.select({ id: assignmentId })(state)
        .data?.title,
  );
  const title =
    (postId ? postTitle : assignmentId ? assignmentTitle : undefined)?.trim() ||
    "Báo cáo học tập";
  return <title>{`${name} · ${title}`}</title>;
}
