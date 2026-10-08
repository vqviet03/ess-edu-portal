"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Box, Button, Stack, Paper, Typography } from "@/components/ui";
import Shell from "@/components/shell";
import { Guard } from "@/auth/runtime";
import { Feedback } from "@/components/feedback";
import { useClassesQuery, useMaterialsQuery } from "@/api/api";
import { useAppSelector } from "@/store";
import { selectClass } from "@/models/report";
import { ThreadFeed } from "@/features/materials/feed";
import { TeacherContacts } from "@/features/materials/contacts";
import { MaterialViewer } from "@/features/materials/viewer";
import type { MaterialFile } from "@/features/materials/models";
function Materials() {
  const params = useSearchParams(),
    selected = useAppSelector((s) => s.auth.classId),
    classes = useClassesQuery(),
    requested = params.get("classId");
  const classroom = requested
    ? classes.currentData?.find((c) => c.id === requested)
    : selectClass(classes.currentData ?? [], selected);
  const [tab, setTab] = useState("thread"),
    [view, setView] = useState<Pick<MaterialFile, "id" | "displayName" | "mimeType"> | null>(null);
  const materials = useMaterialsQuery(classroom?.id ?? "", {
    skip: !classroom || tab !== "files",
  });
  return (
    <Shell>
      <Button component={NextLink} href="/home/">
        ← Về báo cáo
      </Button>
      <Typography variant="h4">Thread & tài liệu học tập</Typography>
      <Typography color="text.secondary">{classroom?.name}</Typography>
      <Feedback
        loading={classes.isLoading}
        error={classes.error}
        retry={() => void classes.refetch()}
      />
      {classroom ? (
        <>
          <TeacherContacts classId={classroom.id} />
          <Tabs
            value={tab}
            onChange={(_, v: string) => setTab(v)}
            aria-label="Nội dung lớp"
          >
            <Tab label="Thread" value="thread" />
            <Tab label="Tài liệu" value="files" />
          </Tabs>
          <Box hidden={tab !== "thread"} sx={{ mt: 2 }}>
            <ThreadFeed key={classroom.id} classId={classroom.id} />
          </Box>
          <Box hidden={tab !== "files"} sx={{ mt: 2 }}>
            <Feedback
              loading={materials.isLoading}
              error={materials.error}
              retry={() => void materials.refetch()}
            />
            <Stack spacing={2}>
              {materials.currentData?.map((m) => (
                <Paper key={m.id} sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 600 }}>{m.title}</Typography>
                  <Button
                    onClick={() =>
                      setView({
                        id: m.id,
                        displayName: m.title,
                        mimeType:
                          m.type === "pdf"
                            ? "application/pdf"
                            : m.type === "audio"
                              ? "audio/mpeg"
                              : m.type === "video"
                                ? "video/mp4"
                                : "application/octet-stream",
                      })
                    }
                  >
                    Xem / tải tài liệu
                  </Button>
                </Paper>
              ))}
            </Stack>
            {!materials.isLoading &&
              !materials.error &&
              materials.currentData?.length === 0 && (
                <Feedback empty="Chưa có tài liệu." />
              )}
          </Box>
        </>
      ) : (
        !classes.isLoading && (
          <Feedback empty="Không tìm thấy lớp hoặc chưa được cấp quyền." />
        )
      )}
      {view && <MaterialViewer file={view} close={() => setView(null)} />}
    </Shell>
  );
}
export default function MaterialsPage() {
  return (
    <Guard>
      <Suspense fallback={<Feedback loading />}>
        <Materials />
      </Suspense>
    </Guard>
  );
}
