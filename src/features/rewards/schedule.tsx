"use client";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import { useStudyScheduleQuery } from "@/api/rewards-api";
import { Feedback } from "@/shared/ui";
import { IconAction } from "@/shared/icon-action";
import { displayDate, scheduleLabel } from "./models";
import { rewardButton, rewardDialog, rewardSurface } from "./design";
export function StudySchedulePanel({ classId }: { classId: string }) {
  const query = useStudyScheduleQuery(classId, { skip: !classId }),
    [open, setOpen] = useState(false),
    data = query.currentData;
  return (
    <>
      <Paper sx={rewardSurface}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="h6" sx={{ fontSize: 18 }}>
              Lịch học{data ? ` · ${scheduleLabel(data.configuration)}` : ""}
            </Typography>
            <IconAction
              label="Xem lịch học"
              icon={<CalendarMonth />}
              onClick={() => setOpen(true)}
              disabled={!data}
            />
          </Stack>
          <Feedback
            loading={query.isLoading}
            error={query.error}
            retry={() => void query.refetch()}
          />
          {data && (
            <>
              {data.occurrences.length ? (
                <Typography>
                  Buổi tiếp theo: {displayDate(data.occurrences[0].date)} ·{" "}
                  {data.occurrences[0].startTime && data.occurrences[0].endTime
                    ? `${data.occurrences[0].startTime}–${data.occurrences[0].endTime}`
                    : "Giờ thông báo sau"}
                </Typography>
              ) : (
                <Typography color="text.secondary">
                  Chưa có ngày học cụ thể trong 60 ngày tới.
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Múi giờ Việt Nam.
                {data.configuration.timeMode === "FLEXIBLE"
                  ? " Phụ huynh theo dõi thông báo của giảng viên để biết giờ học."
                  : ""}
              </Typography>
            </>
          )}
        </Stack>
      </Paper>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={false}
        slotProps={{ paper: { sx: rewardDialog(760) } }}
      >
        <DialogTitle>
          <Typography component="span" sx={{ fontSize: 24, fontWeight: 700 }}>
            Lịch học của lớp
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {data?.occurrences.length ? (
              data.occurrences.map((o) => (
                <Typography key={o.date}>
                  {displayDate(o.date)} ·{" "}
                  {o.startTime && o.endTime
                    ? `${o.startTime}–${o.endTime}`
                    : "Giờ sẽ được thông báo"}
                </Typography>
              ))
            ) : (
              <Typography>Chưa có ngày học cụ thể.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size="small" sx={rewardButton} onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
