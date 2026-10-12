"use client";
import { Suspense } from "react";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { AssignmentProfileReport } from "@/features/assignments/profile-report";
export default function Page() {
  return (
    <Guard>
      <Suspense fallback={null}>
        <Shell>
          <AssignmentProfileReport />
        </Shell>
      </Suspense>
    </Guard>
  );
}
