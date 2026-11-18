"use client";
import { useRouteState } from "@/shared/route-state";
import { useSectionTab } from "@/shared/page-navigation";
import { ClassPresenceContext, ClassMembers } from "@/features/presence/roster";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Check from "@mui/icons-material/Check";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import type { ReactNode } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Feedback } from "@/components/feedback";
import { useThreadSessionsQuery } from "@/api/library-api";
import { confirmLeave } from "@/shared/unsaved";
import { ThreadFeed } from "./feed";
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
type Section = "report" | "assignments" | "attendance" | "rewards";
const sections: {
  value: Section;
  label: string;
  short: string;
  icon: ReactNode;
}[] = [
  {
    value: "report",
    label: "Kết quả kiểm tra",
    short: "Kiểm tra",
    icon: <QuizOutlined fontSize="small" />,
  },
  {
    value: "assignments",
    label: "Bài tập",
    short: "Bài tập",
    icon: <AssignmentOutlined fontSize="small" />,
  },
  {
    value: "attendance",
    label: "Điểm danh",
    short: "Điểm danh",
    icon: <EventAvailableOutlined fontSize="small" />,
  },
  {
    value: "rewards",
    label: "Điểm tích luỹ",
    short: "Tích luỹ",
    icon: <EmojiEventsOutlined fontSize="small" />,
  },
];
/**
 * Picks a part of the class report. Deliberately a grid of icon tiles (not
 * a second tab strip) so it reads as a section switch inside "Báo cáo".
 */
function ReportSections({
  value,
  onChange,
}: {
  value: Section;
  onChange: (value: Section) => void;
}) {
  return (
    <Box
      role="tablist"
      aria-label="Mục báo cáo"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 0.75,
        p: 0.5,
        borderRadius: "16px",
        bgcolor: "action.hover",
      }}
    >
      {sections.map((s) => {
        const selected = s.value === value;
        return (
          <ButtonBase
            key={s.value}
            role="tab"
            aria-selected={selected}
            aria-label={s.label}
            title={s.label}
            onClick={() => onChange(s.value)}
            sx={{
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 0.25, sm: 1 },
              py: { xs: 0.75, sm: 1 },
              px: 0.5,
              minWidth: 0,
              borderRadius: "12px",
              fontSize: { xs: 12, sm: 14 },
              fontWeight: 600,
              color: selected ? "primary.main" : "text.secondary",
              bgcolor: selected ? "background.paper" : "transparent",
              boxShadow: selected ? 1 : 0,
            }}
          >
            {s.icon}
            <Box
              component="span"
              sx={{
                maxWidth: "100%",
                textAlign: "center",
                lineHeight: 1.2,
                overflowWrap: "anywhere",
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "inline", md: "none" } }}
              >
                {s.short}
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                {s.label}
              </Box>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
/** Thread with a "Tài liệu" filter and a Unit picker (default: all). */
function ClassThread({
  classId,
  materials,
  onMaterials,
}: {
  classId: string;
  /** The filter lives in the URL (/home/files/), so Back and links keep it. */
  materials: boolean;
  onMaterials: (value: boolean) => void;
}) {
  const sessions = useThreadSessionsQuery(classId),
    [unit, setUnit] = useRouteState<number | null>(
      `thread:${classId}:unit`,
      null,
    );
  const units = [
    ...new Set(
      (sessions.currentData?.items ?? [])
        .map((s) => s.unitNumber)
        .filter((n): n is number => n !== null),
    ),
  ].sort((a, b) => a - b);
  const unitSessions =
    unit === null
      ? []
      : (sessions.currentData?.items ?? [])
          .filter((s) => s.unitNumber === unit)
          .sort((a, b) => b.date.localeCompare(a.date));
  const postType = materials ? ("SESSION_MATERIAL" as const) : undefined;
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
        <Chip
          icon={materials ? <Check /> : <FolderOutlined />}
          label="Tài liệu"
          clickable
          color={materials ? "primary" : "default"}
          variant={materials ? "filled" : "outlined"}
          aria-pressed={materials}
          onClick={() => onMaterials(!materials)}
          sx={{ height: 36, borderRadius: "10px", fontWeight: 600, px: 0.5 }}
        />
        <TextField
          select
          size="small"
          label="Unit"
          value={unit === null ? "" : String(unit)}
          onChange={(e) => {
            if (confirmLeave())
              setUnit(e.target.value === "" ? null : Number(e.target.value));
          }}
          slotProps={{
            select: { displayEmpty: true },
            inputLabel: { shrink: true },
          }}
          sx={{ minWidth: 0, flex: { xs: 1, sm: "0 0 200px" } }}
        >
          <MenuItem value="">Tất cả Unit</MenuItem>
          {units.map((n) => (
            <MenuItem key={n} value={String(n)}>
              Unit {n}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Feedback error={sessions.error} retry={() => void sessions.refetch()} />
      {unit === null ? (
        <ThreadFeed
          key={`all:${postType ?? "all"}`}
          classId={classId}
          postType={postType}
        />
      ) : unitSessions.length ? (
        unitSessions.map((s) => (
          <ThreadFeed
            key={`${s.id}:${postType ?? "all"}`}
            classId={classId}
            sessionId={s.id}
            postType={postType}
          />
        ))
      ) : (
        <Feedback empty="Unit này chưa có bài đăng." />
      )}
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
  // Old routes stay valid: files opens Thread filtered to materials, and the
  // report parts open the "Báo cáo" tab on the matching section.
  const main =
    tab === "files"
      ? "thread"
      : tab === "report" ||
          tab === "assignments" ||
          tab === "attendance" ||
          tab === "rewards"
        ? "report"
        : tab;
  return (
    <>
      <ClassPresenceContext classId={classId} />
      <Tabs
        value={main}
        onChange={(_, v: "thread" | "report" | "members") => {
          setTab(v);
        }}
        aria-label="Nội dung lớp"
        variant="fullWidth"
        sx={{ "& .MuiTab-root": { minWidth: 0, px: 1, whiteSpace: "nowrap" } }}
      >
        <Tab
          label="Thread"
          value="thread"
          id="class-thread-tab"
          aria-controls="class-thread-panel"
        />
        <Tab
          label="Báo cáo"
          value="report"
          id="class-report-tab"
          aria-controls="class-report-panel"
        />
        <Tab
          label="Thành viên"
          value="members"
          id="class-members-tab"
          aria-controls="class-members-panel"
        />
      </Tabs>
      <Box
        role="tabpanel"
        id="class-thread-panel"
        aria-labelledby="class-thread-tab"
        hidden={main !== "thread"}
        sx={{ mt: 2 }}
      >
        {main === "thread" && (
          <ClassThread
            classId={classId}
            materials={tab === "files"}
            onMaterials={(on) => setTab(on ? "files" : "thread")}
          />
        )}
      </Box>
      <Box
        role="tabpanel"
        id="class-report-panel"
        aria-labelledby="class-report-tab"
        hidden={main !== "report"}
        sx={{ mt: 2 }}
      >
        {main === "report" && (
          <Stack spacing={2}>
            <ReportSections value={tab as Section} onChange={setTab} />
            <Box>
              {tab === "report" && <Report classId={classId} />}
              {tab === "assignments" && (
                <AssignmentReport classId={classId} enabled />
              )}
              {tab === "attendance" && <Attendance classId={classId} />}
              {tab === "rewards" && <Rewards classId={classId} />}
            </Box>
          </Stack>
        )}
      </Box>
      <Box
        role="tabpanel"
        id="class-members-panel"
        aria-labelledby="class-members-tab"
        hidden={main !== "members"}
        sx={{ mt: 2 }}
      >
        {main === "members" && <ClassMembers classId={classId} />}
      </Box>
    </>
  );
}
