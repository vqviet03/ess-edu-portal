"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Feedback } from "@/components/feedback";
function Redirect() {
  const router = useRouter(),
    params = useSearchParams();
  useEffect(() => {
    router.replace(`/home/?${params}`);
  }, [router, params]);
  return <Feedback loading />;
}
export default function Page() {
  return (
    <Suspense fallback={<Feedback loading />}>
      <Redirect />
    </Suspense>
  );
}
