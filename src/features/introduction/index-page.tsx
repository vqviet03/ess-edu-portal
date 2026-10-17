"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Provider, useStore } from "react-redux";
import { type RootState, useAppSelector } from "@/store";
import { Box, Button, Paper, Stack, Typography } from "@/components/ui";
import { AppIcon } from "@/features/pwa/app-icon";
import { useApplicationName } from "@/features/settings/hooks";
import { PublicIntroductionApp } from "./public-app";
import { introductionApi, introductionStore } from "./public-api";

function StudentEntry() {
  const name = useApplicationName();
  return (
    <Box
      component="main"
      sx={{ minHeight: "100svh", display: "grid", placeItems: "center", p: 2 }}
    >
      <Paper
        component="section"
        sx={{
          width: "100%",
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: "divider",
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{ color: "primary.main", overflowWrap: "anywhere" }}
          >
            <AppIcon />
            {name}
          </Typography>
          <Button component={Link} href="/login/" variant="contained">
            Đăng nhập
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function Content({
  authenticated,
  fallback,
}: {
  authenticated: boolean;
  fallback: ReactNode;
}) {
  const q = introductionApi.usePublicIntroductionQuery(),
    router = useRouter();
  const unpublished = q.error && "status" in q.error && q.error.status === 404;
  useEffect(() => {
    if (unpublished && authenticated) router.replace("/home/");
  }, [unpublished, authenticated, router]);
  if (q.data)
    return (
      <PublicIntroductionApp
        content={q.data.content}
        assetsBase={process.env.NEXT_PUBLIC_BASE_PATH ?? ""}
      />
    );
  if (unpublished) return fallback;
  return (
    <main style={{ padding: 32 }}>
      {q.isLoading ? (
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
    applicationStore = useStore<RootState>(),
    status = useAppSelector((s) => s.auth.status);
  return (
    <Provider store={store}>
      <Content
        authenticated={status === "authenticated"}
        fallback={
          <Provider store={applicationStore}>
            <StudentEntry />
          </Provider>
        }
      />
    </Provider>
  );
}
