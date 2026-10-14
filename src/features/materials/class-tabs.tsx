"use client";
import { useRouteState } from "@/shared/route-state";
import { useSectionTab } from "@/shared/page-navigation";
import { ClassPresenceContext, ClassMembers } from "@/features/presence/roster";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Feedback } from "@/components/feedback";
import { useThreadSessionsQuery } from "@/api/library-api";
import { confirmLeave } from "@/shared/unsaved";
import { ThreadFeed } from "./feed";
import type { ThreadSession } from "./models";
const AssignmentReport = dynamic(
  () =>
    import("@/features/assignments/report").then((m) => m.AssignmentReportView),
  { loading: () => <Feedback loading /> },
);
const Report = dynamic(
  () => import("@/features/class-report").then((m) => m.ClassReport),
  { loading: () => <Feedback loading /> },
);
const Rewards = dynamic(
  () => import("@/features/rewards/detail").then((m) => m.StudentRewards),
  { loading: () => <Feedback loading /> },
);
const Attendance = dynamic(
  () => import("@/features/attendance/report").then((m) => m.AttendanceReport),
  { loading: () => <Feedback loading /> },
);
function SessionMaterials({ classId }: { classId: string }) {
  const sessions = useThreadSessionsQuery(classId),
    [session, setSession] = useRouteState<ThreadSession | null>(
      `materials:${classId}:session`,
      null,
    );
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
  const values = [
    "thread",
    "files",
    "report",
    "rewards",
    "attendance",
    "members",
    "assignments",
  ] as const;
  const [tab, setTab] = useSectionTab(
    "home",
    values,
    values.includes(initialTab as (typeof values)[number])
      ? (initialTab as (typeof values)[number])
      : "thread",
  );
  return (
    <>
      <ClassPresenceContext classId={classId} />
      <Tabs
        value={tab}
        onChange={(_, v: (typeof values)[number]) => {
          setTab(v);
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
        <Tab
          label="Điểm tích luỹ"
          value="rewards"
          id="class-rewards-tab"
          aria-controls="class-rewards-panel"
        />
        <Tab
          label="Điểm danh"
          value="attendance"
          id="class-attendance-tab"
          aria-controls="class-attendance-panel"
        />
        <Tab
          label="Thành viên"
          value="members"
          id="class-members-tab"
          aria-controls="class-members-panel"
        />
        <Tab
          label="Bài tập"
          value="assignments"
          id="class-assignments-tab"
          aria-controls="class-assignments-panel"
        />
      </Tabs>
      <Box
        role="tabpanel"
        id="class-members-panel"
        aria-labelledby="class-members-tab"
        hidden={tab !== "members"}
        sx={{ mt: 2 }}
      >
        {tab === "members" && <ClassMembers classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-assignments-panel"
        aria-labelledby="class-assignments-tab"
        hidden={tab !== "assignments"}
        sx={{ mt: 2 }}
      >
        {tab === "assignments" && (
          <AssignmentReport classId={classId} enabled={tab === "assignments"} />
        )}
      </Box>
      <Box
        role="tabpanel"
        id="class-thread-panel"
        aria-labelledby="class-thread-tab"
        hidden={tab !== "thread"}
        sx={{ mt: 2 }}
      >
        {tab === "thread" && <ThreadFeed classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-files-panel"
        aria-labelledby="class-files-tab"
        hidden={tab !== "files"}
        sx={{ mt: 2 }}
      >
        {tab === "files" && <SessionMaterials classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-report-panel"
        aria-labelledby="class-report-tab"
        hidden={tab !== "report"}
        sx={{ mt: 2 }}
      >
        {tab === "report" && <Report classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-attendance-panel"
        aria-labelledby="class-attendance-tab"
        hidden={tab !== "attendance"}
        sx={{ mt: 2 }}
      >
        {tab === "attendance" && <Attendance classId={classId} />}
      </Box>
      <Box
        role="tabpanel"
        id="class-rewards-panel"
        aria-labelledby="class-rewards-tab"
        hidden={tab !== "rewards"}
        sx={{ mt: 2 }}
      >
        {tab === "rewards" && <Rewards classId={classId} />}
      </Box>
    </>
  );
}
