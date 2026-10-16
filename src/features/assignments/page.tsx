"use client";
import { useSearchParams } from "next/navigation";
import {
  useAssignmentQuery,
  useAssignmentDraftQuery,
} from "@/api/assignment-api";
import { Feedback } from "@/shared/ui";
import { AssignmentPlayer } from "./player";
export function AssignmentPage() {
  const p = useSearchParams(),
    id = p.get("assignmentId") ?? "",
    query = useAssignmentQuery({ id }, { skip: !id }),
    draft = useAssignmentDraftQuery(id, { skip: !query.data });
  if (!id) return <Feedback empty="Mở bài tập từ bài đăng trong lớp." />;
  return (
    <>
      <Feedback
        loading={query.isLoading || draft.isLoading}
        error={query.error || draft.error}
        retry={() => {
          void query.refetch();
          if (query.data) void draft.refetch();
        }}
      />
      {query.data && draft.data !== undefined && (
        <AssignmentPlayer
          key={`${id}:${query.data.assignmentVersionId}:${draft.data?.attempt ?? 1}`}
          assignment={query.data}
          initial={draft.data}
        />
      )}
    </>
  );
}
