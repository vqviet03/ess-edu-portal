"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Stack, TextField, MenuItem } from "@mui/material";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { useGiftClassesQuery } from "@/api/gifts-api";
import { useAppSelector } from "@/store";
import { Feedback } from "@/shared/ui";
import { GiftCatalogView } from "./catalog";
function Content() {
  const params = useSearchParams(),
    router = useRouter(),
    classes = useGiftClassesQuery(),
    studentId = useAppSelector((s) => s.auth.student?.id ?? ""),
    selected = useAppSelector((s) => s.auth.classId),
    id = params.get("classId") ?? selected ?? classes.data?.[0]?.id ?? "";
  return (
    <Shell>
      <Stack spacing={2.5}>
        <PageHeader
          title="Góc đổi quà"
          subtitle="Mỗi nỗ lực, một niềm vui nhỏ."
        />
        <Feedback
          loading={classes.isLoading}
          error={classes.error}
          retry={classes.refetch}
        />
        <TextField
          select
          label="Lớp học"
          value={classes.data?.some((c) => c.id === id) ? id : ""}
          onChange={(e) =>
            router.push(`/home/rewards/gifts/?classId=${e.target.value}`, {
              scroll: false,
            })
          }
          sx={{ maxWidth: 400 }}
        >
          {classes.data?.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
              {c.status === "COMPLETED" ? " · Đã hoàn thành" : ""}
            </MenuItem>
          ))}
        </TextField>
        {id && studentId && (
          <GiftCatalogView
            key={id}
            classId={id}
            studentId={studentId}
            initialTab={
              params.get("tab") ??
              (classes.data?.find((c) => c.id === id)?.status === "COMPLETED"
                ? "history"
                : "all")
            }
          />
        )}
      </Stack>
    </Shell>
  );
}
export function GiftsPage() {
  return (
    <Guard>
      <Suspense fallback={<Feedback loading />}>
        <Content />
      </Suspense>
    </Guard>
  );
}
