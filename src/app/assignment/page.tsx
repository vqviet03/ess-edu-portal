"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense } from "react";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { AssignmentPage } from "@/features/assignments/page";
export default function Page() {
  return (
    <Guard>
      <Suspense fallback={null}>
        <Shell>
          <PageHeader />
          <AssignmentPage />
        </Shell>
      </Suspense>
    </Guard>
  );
}
