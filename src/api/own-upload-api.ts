import { api } from "./api";
import { assignmentApi } from "./assignment-api";
import type { Envelope } from "@/models";
export type UploadDeletion = {
  id: string;
  status: string;
  draftVersion?: number | null;
  profileVersion?: number | null;
  commentVersion?: number | null;
};
export type OwnUploadDelete = {
  source: "submission" | "comment" | "avatar";
  contextId?: string;
  fileId: string;
  version?: number;
  draftVersion?: number;
  questionId?: string;
  commentId?: string;
};
export const ownUploadApi = api.injectEndpoints({
  endpoints: (b) => ({
    deleteOwnUpload: b.mutation<UploadDeletion, OwnUploadDelete>({
      async queryFn(
        { source, contextId, fileId, version, ...body },
        _,
        __,
        base,
      ) {
        if (version == null) {
          const detail = await base(`/materials/${fileId}`);
          if (
            detail.error &&
            !(source === "avatar" && detail.error.status === 404)
          )
            return { error: detail.error };
          // A previous DELETE may have committed before its response was lost.
          // The scoped endpoint still verifies ownership of the deletion record.
          version = detail.error
            ? 0
            : (detail.data as Envelope<{ version: number }>).data.version;
        }
        const url =
          source === "submission"
            ? `/assignments/${contextId}/uploads/${fileId}`
            : source === "comment"
              ? `/posts/${contextId}/own-uploads/${fileId}`
              : `/me/avatar-uploads/${fileId}`;
        const result = await base({
          url,
          method: "DELETE",
          body: { ...body, version },
        });
        if (result.error) return { error: result.error };
        return { data: (result.data as Envelope<UploadDeletion>).data };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (arg.source === "submission" && arg.contextId)
            dispatch(
              assignmentApi.util.updateQueryData(
                "assignmentDraft",
                arg.contextId,
                (draft) => {
                  if (!draft || draft.submittedAt) return;
                  if (data.draftVersion != null)
                    draft.version = data.draftVersion;
                  for (const answer of draft.answers) {
                    if (answer.questionId !== arg.questionId) continue;
                    answer.text = answer.text.replaceAll(
                      `[file:${arg.fileId}]`,
                      "",
                    );
                    answer.materialIds = answer.materialIds.filter(
                      (id) => id !== arg.fileId,
                    );
                    answer.files = answer.files?.filter(
                      (file) => file.id !== arg.fileId,
                    );
                    answer.recordingSessionId = null;
                  }
                },
              ),
            );
        } catch {
          /* Keep the original draft on a failed delete. */
        }
      },
      invalidatesTags: (_, error, q) =>
        error || q.source !== "comment"
          ? []
          : [{ type: "Comments", id: q.contextId }],
    }),
  }),
});
export const { useDeleteOwnUploadMutation } = ownUploadApi;
