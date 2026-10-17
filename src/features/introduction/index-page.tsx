"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Provider } from "react-redux";
import { useAppSelector } from "@/store";
import { PublicIntroductionApp } from "./public-app";
import { introductionApi, introductionStore } from "./public-api";
function Content({
  authenticated,
  guest,
}: {
  authenticated: boolean;
  guest: boolean;
}) {
  const q = introductionApi.usePublicIntroductionQuery(),
    router = useRouter();
  const unpublished = q.error && "status" in q.error && q.error.status === 404;
  useEffect(() => {
    if (!unpublished) return;
    if (authenticated) router.replace("/home/");
    else if (guest) router.replace("/login/");
  }, [unpublished, authenticated, guest, router]);
  if (q.data)
    return (
      <PublicIntroductionApp
        content={q.data.content}
        assetsBase={process.env.NEXT_PUBLIC_BASE_PATH ?? ""}
      />
    );
  return (
    <main style={{ padding: 32 }}>
      {q.isLoading || unpublished ? (
        <p>Đang tải…</p>
      ) : (
        <>
          <p>Không tải được trang giới thiệu.</p>
          <Link href="/login/">Đăng nhập</Link>
        </>
      )}
    </main>
  );
}
export function IntroductionIndex() {
  const [store] = useState(introductionStore),
    status = useAppSelector((s) => s.auth.status);
  return (
    <Provider store={store}>
      <Content
        authenticated={status === "authenticated"}
        guest={status === "guest"}
      />
    </Provider>
  );
}
