"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Refresh from "@mui/icons-material/Refresh";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import {
  useRewardClassesQuery,
  useRewardDetailQuery,
  useRewardHistoryQuery,
  useRewardActivitiesQuery,
} from "@/api/rewards-api";
import { Feedback } from "@/shared/ui";
import { IconAction } from "@/shared/icon-action";
import { RewardEntries, RewardOverview } from "./view";
import { vietnamToday, type RewardKind } from "./models";
import { StudySchedulePanel } from "./schedule";
import { rewardSurface, rewardTabs } from "./design";
function ClassRewardDetail({ classId }: { classId: string }) {
  const [range, setRange] = useState(() => ({ from: "", to: vietnamToday() })),
    [kind, setKind] = useState<RewardKind | "">(""),
    [page, setPage] = useState(1),
    [activityPage, setActivityPage] = useState(1),
    [historyDate, setHistoryDate] = useState("");
  const activities = useRewardActivitiesQuery(
    { classId, page: activityPage },
    { skip: activityPage === 1 },
  );
  const detail = useRewardDetailQuery({ classId, ...range }),
    history = useRewardHistoryQuery({
      classId,
      kind: kind || undefined,
      date: historyDate || undefined,
      page,
    });
  return (
    <Stack spacing={2.5}>
      <Feedback
        loading={detail.isLoading || (detail.isFetching && !detail.currentData)}
        error={detail.error}
        retry={() => void detail.refetch()}
      />
      {detail.currentData && (
        <RewardOverview
          data={detail.currentData}
          activities={
            activityPage === 1
              ? undefined
              : (activities.currentData?.items ?? [])
          }
          activityPaging={
            detail.currentData.activityCount > 20 ? (
              <Stack direction="row" spacing={1}>
                <Feedback
                  loading={activities.isLoading}
                  error={activities.error}
                  retry={() => void activities.refetch()}
                />
                <Typography variant="caption">
                  {`${detail.currentData.activityCount} lượt · Trang ${activityPage}`}
                </Typography>
                <IconAction
                  label="Hoạt động trước"
                  icon={<ArrowBack />}
                  disabled={activityPage === 1}
                  onClick={() => setActivityPage((v) => v - 1)}
                />
                <IconAction
                  label="Hoạt động tiếp theo"
                  icon={<ArrowForward />}
                  disabled={
                    activityPage * 20 >= detail.currentData.activityCount
                  }
                  onClick={() => setActivityPage((v) => v + 1)}
                />
              </Stack>
            ) : undefined
          }
          range={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                label="Từ ngày (trống = toàn bộ)"
                type="date"
                value={range.from}
                onChange={(e) => {
                  setRange((v) => ({ ...v, from: e.target.value }));
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: range.to },
                }}
              />
              <TextField
                size="small"
                label="Đến ngày"
                type="date"
                value={range.to}
                onChange={(e) => {
                  if (e.target.value)
                    setRange((v) => ({ ...v, to: e.target.value }));
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: range.from, max: vietnamToday() },
                }}
              />
              <IconAction
                label="Làm mới điểm"
                icon={<Refresh />}
                onClick={() => {
                  void detail.refetch();
                  void history.refetch();
                }}
              />
            </Stack>
          }
          history={
            <Paper sx={rewardSurface}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontSize: 18 }}>
                  Lịch sử điểm
                </Typography>
                <Tabs
                  value={kind}
                  onChange={(_, v: RewardKind | "") => {
                    setKind(v);
                    setPage(1);
                  }}
                  variant="scrollable"
                  aria-label="Loại lịch sử điểm"
                  sx={rewardTabs}
                >
                  <Tab label="Tất cả" value="" />
                  <Tab label="Được thưởng" value="EARN" />
                  <Tab label="Vi phạm" value="PENALTY" />
                  <Tab label="Đã dùng" value="SPEND" />
                </Tabs>
                <TextField
                  size="small"
                  label="Lọc ngày (xoá để xem tất cả)"
                  type="date"
                  value={historyDate}
                  onChange={(e) => {
                    setHistoryDate(e.target.value);
                    setPage(1);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ maxWidth: 270 }}
                />
                <Feedback
                  loading={history.isLoading}
                  error={history.error}
                  retry={() => void history.refetch()}
                />
                {history.currentData && (
                  <>
                    <RewardEntries entries={history.currentData.items} />
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="caption">
                        {history.currentData.total} lượt · Trang {page}
                      </Typography>
                      <Box>
                        <IconAction
                          label="Trang trước"
                          icon={<ArrowBack />}
                          disabled={page === 1}
                          onClick={() => setPage((v) => v - 1)}
                        />
                        <IconAction
                          label="Trang sau"
                          icon={<ArrowForward />}
                          disabled={page * 20 >= history.currentData.total}
                          onClick={() => setPage((v) => v + 1)}
                        />
                      </Box>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          }
        />
      )}
      <StudySchedulePanel classId={classId} />
    </Stack>
  );
}
export function StudentRewards({ classId }: { classId: string }) {
  const query = useRewardClassesQuery(),
    [selected, setSelected] = useState(classId),
    classes = query.currentData ?? [],
    valid = classes.some((c) => c.id === selected)
      ? selected
      : (classes[0]?.id ?? "");
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Điểm tích luỹ</Typography>
      <Feedback
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {classes.length > 0 ? (
        <>
          <Tabs
            value={valid}
            onChange={(_, id: string) => setSelected(id)}
            variant="scrollable"
            aria-label="Lớp tích luỹ điểm"
            sx={rewardTabs}
          >
            {classes.map((c) => (
              <Tab key={c.id} label={c.name} value={c.id} />
            ))}
          </Tabs>
          <ClassRewardDetail key={valid} classId={valid} />
        </>
      ) : !query.isLoading && !query.error ? (
        <Feedback empty="Chưa có lớp để xem điểm tích luỹ." />
      ) : null}
    </Stack>
  );
}
