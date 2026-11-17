"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/shell";
import { Guard } from "@/auth/runtime";
import { Feedback } from "@/components/feedback";
import { useClassesQuery } from "@/api/api";
import { useAppSelector } from "@/store";
import { selectClass } from "@/models/report";
import { TeacherContacts } from "@/features/materials/contacts";
import { ClassTabs } from "@/features/materials/class-tabs";
function Materials() {
  const params = useSearchParams(),
    selected = useAppSelector((s) => s.auth.classId),
    classes = useClassesQuery(),
    requested = params.get("classId"),
    classroom = requested
      ? classes.currentData?.find((c) => c.id === requested)
      : selectClass(classes.currentData ?? [], selected);
  return (
    <Shell>
      <PageHeader
        title="Thread & tài liệu học tập"
        subtitle={classroom?.name}
      />
      <Feedback
        loading={classes.isLoading}
        error={classes.error}
        retry={() => void classes.refetch()}
      />
      {classroom ? (
        <>
          <TeacherContacts classId={classroom.id} />
          <ClassTabs
            key={classroom.id}
            classId={classroom.id}
            initialTab={params.get("tab") ?? "thread"}
          />
        </>
      ) : !classes.isLoading && !classes.error ? (
        <Feedback empty="Không tìm thấy lớp hoặc chưa được cấp quyền." />
      ) : null}
    </Shell>
  );
}
export function MaterialsPage() {
  return (
    <Guard>
      <Suspense fallback={<Feedback loading />}>
        <Materials />
      </Suspense>
    </Guard>
  );
}
