"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Stack from "@mui/material/Stack";
import { useClassesQuery } from "@/api/api";
import { Feedback } from "@/shared/ui";
import { AssignmentReportView } from "./report";
export function AssignmentProfileReport() {
  const params = useSearchParams();
  const query = useClassesQuery(),
    [selected, setSelected] = useState(params.get("classId") ?? "");
  const classes = query.currentData ?? [];
  const id = classes.some((c) => c.id === selected)
    ? selected
    : ((classes.find((c) => c.isActive) ?? classes[0])?.id ?? "");
  return (
    <Stack spacing={2}>
      <Feedback
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
        empty={
          !query.isLoading && !query.error && !classes.length
            ? "Em chưa có lớp học."
            : undefined
        }
      />
      {!!id && (
        <AssignmentReportView
          classes={classes}
          onClassChange={setSelected}
          key={id}
          classId={id}
          className={classes.find((c) => c.id === id)?.name}
        />
      )}
    </Stack>
  );
}
