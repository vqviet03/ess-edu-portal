"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense } from "react";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { AssignmentProfileReport } from "@/features/assignments/profile-report";
export default function Page() {
  return (
    <Guard>
      <Suspense fallback={null}>
        <Shell>
          <PageHeader />
          <AssignmentProfileReport />
        </Shell>
      </Suspense>
    </Guard>
  );
}
