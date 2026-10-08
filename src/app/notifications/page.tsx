"use client";
import { Suspense } from "react";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { NotificationsPage } from "@/features/notifications/page";
export default function Page() {
  return (
    <Guard>
      <Suspense fallback={null}>
        <Shell>
          <NotificationsPage />
        </Shell>
      </Suspense>
    </Guard>
  );
}
