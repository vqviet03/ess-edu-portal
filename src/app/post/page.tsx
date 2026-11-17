"use client";
import { PageHeader } from "@/shared/page-header";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Guard } from "@/auth/runtime";
import Shell from "@/components/shell";
import { PostDetailPage } from "@/features/materials/feed";
function Content() {
  const p = useSearchParams();
  return <PostDetailPage postId={p.get("postId") ?? ""} />;
}
export default function Page() {
  return (
    <Guard>
      <Suspense fallback={null}>
        <Shell>
          <PageHeader />
          <Content />
        </Shell>
      </Suspense>
    </Guard>
  );
}
