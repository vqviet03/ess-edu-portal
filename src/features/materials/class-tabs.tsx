"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { Feedback } from "@/components/feedback";
import { useThreadSessionsQuery } from "@/api/library-api";
import { useMaterialsQuery } from "@/api/api";
import { confirmLeave } from "@/shared/unsaved";
import { ThreadFeed } from "./feed";
import { MaterialViewer } from "./viewer";
import type { MaterialFile, ThreadSession } from "./models";
const Report = dynamic(
  () => import("@/features/class-report").then((m) => m.ClassReport),
  { loading: () => <Feedback loading /> },
);
function SessionMaterials({ classId }: { classId: string }) {
  const sessions = useThreadSessionsQuery(classId),
    [session, setSession] = useState<ThreadSession | null>(null),
    materials = useMaterialsQuery(classId),
    [view, setView] = useState<Pick<
      MaterialFile,
      "id" | "displayName" | "mimeType"
    > | null>(null);
  return (
    <Stack spacing={2}>
      <Autocomplete
        options={sessions.currentData?.items ?? []}
        value={session}
        getOptionLabel={(s) => `${s.name} · ${s.date}`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, value) => {
          if (confirmLeave()) setSession(value);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Lọc theo phiên học"
            placeholder="Tất cả phiên · Tìm tên hoặc ngày"
          />
        )}
      />
      <Feedback
        loading={sessions.isLoading}
        error={sessions.error}
        retry={() => void sessions.refetch()}
      />
      <ThreadFeed
        key={session?.id ?? "all-sessions"}
        classId={classId}
        sessionId={session?.id}
        postType="SESSION_MATERIAL"
      />
      {!session && (
        <>
          <Typography variant="h6">Tài liệu tổng hợp của lớp</Typography>
          <Feedback
            loading={materials.isLoading}
            error={materials.error}
            retry={() => void materials.refetch()}
          />
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
          {materials.currentData?.length === 0 && (
            <Feedback empty="Chưa có tài liệu." />
          )}
        </>
      )}
      {view && <MaterialViewer file={view} close={() => setView(null)} />}
    </Stack>
  );
}
export function ClassTabs({
  classId,
  initialTab = "thread",
}: {
  classId: string;
  initialTab?: string;
}) {
  const first = ["thread", "files", "report"].includes(initialTab)
      ? initialTab
      : "thread",
    [tab, setTab] = useState(first),
    [visited, setVisited] = useState<string[]>([first]);
  return (
    <>
      <Tabs
        value={tab}
        onChange={(_, v: string) => {
          setTab(v);
          setVisited((old) => (old.includes(v) ? old : [...old, v]));
        }}
        aria-label="Nội dung lớp"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          label="Thread"
          value="thread"
          id="class-thread-tab"
          aria-controls="class-thread-panel"
        />
        <Tab
          label="Tài liệu"
          value="files"
          id="class-files-tab"
          aria-controls="class-files-panel"
        />
        <Tab
          label="Báo cáo kết quả"
          value="report"
          id="class-report-tab"
          aria-controls="class-report-panel"
        />
      </Tabs>
      <Box
        role="tabpanel"
        id="class-thread-panel"
        aria-labelledby="class-thread-tab"
        hidden={tab !== "thread"}
        sx={{ mt: 2 }}
      >
        {visited.includes("thread") && <ThreadFeed classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-files-panel"
        aria-labelledby="class-files-tab"
        hidden={tab !== "files"}
        sx={{ mt: 2 }}
      >
        {visited.includes("files") && <SessionMaterials classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-report-panel"
        aria-labelledby="class-report-tab"
        hidden={tab !== "report"}
        sx={{ mt: 2 }}
      >
        {visited.includes("report") && <Report classId={classId} />}
      </Box>
    </>
  );
}
