"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import { useStudentAttendanceQuery } from "@/api/attendance-api";
import { useNotificationsQuery } from "@/api/library-api";
import { Feedback } from "@/shared/ui";
import {
  AttendanceBadge,
  AttendanceCalendar,
  AttendanceMetric,
  AttendanceSurface,
} from "./shared";
import {
  dateLabel,
  reasonLabels,
  todayDate,
  type AttendanceStatus,
} from "./models";
export function AttendanceReport({classId}: {classId: string}) {
  return <AttendanceReportContent key={classId} classId={classId}/>;
}
function AttendanceReportContent({ classId }: { classId: string }) {
  const [month, setMonth] = useState(todayDate().slice(0, 7)),
    [selected, setSelected] = useState(todayDate()),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    query = useStudentAttendanceQuery({ classId, month, status, page }),
    notices = useNotificationsQuery({ type: "ATTENDANCE" });
  const data = query.currentData ?? query.data;
  if (!data)
    return (
      <Feedback
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
    );
  const stats = data.stats,
    color =
      stats.warning === "DANGER"
        ? "red"
        : stats.warning === "WARNING"
          ? "orange"
          : "green",
    today =
      data.todaySession ?? data.calendar.find((d) => d.date === data.today);
  return (
    <Box aria-busy={query.isFetching} data-testid="attendance-report-content" sx={{position: "relative"}}>
      {query.currentData && <Feedback error={query.error} retry={() => void query.refetch()}/>}
      {!query.currentData && <Box sx={{position: "absolute", inset: 0, zIndex: 1}}><Feedback loading={query.isFetching} error={query.error} retry={() => void query.refetch()}/></Box>}
      <Box sx={{visibility: query.currentData ? "visible" : "hidden"}}>
    <AttendanceSurface>
      <Typography component="h2" sx={{ fontSize: 24, fontWeight: 700 }}>
        Điểm danh của em
      </Typography>
      <Box
        sx={{
          p: 3,
          borderRadius: "16px",
          bgcolor: `var(--att-${color}-bg)`,
          color: `var(--att-${color})`,
        }}
      >
        <Typography sx={{ fontSize: 12, mb: 1 }}>
          {stats.warning === "NO_PLAN"
            ? "Chưa có kế hoạch"
            : stats.warning === "DANGER"
              ? "Vượt ngưỡng nghỉ học"
              : stats.warning === "WARNING"
                ? "Cần chú ý chuyên cần"
                : "Trong mức chấp nhận"}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 1 }}>
          {stats.absencePercentage === null
            ? "Chưa có tỷ lệ nghỉ học"
            : `${stats.absencePercentage.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% số buổi nghỉ`}
        </Typography>
        <Typography sx={{ fontSize: 14 }}>
          {stats.absent} buổi vắng / {stats.plannedSessions} buổi kế hoạch ban
          đầu
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 1 }}>
          {stats.warning === "NO_PLAN"
            ? "Quản lý cần khai báo số buổi kế hoạch. Chưa ghi nhận không được tính là vắng."
            : stats.warning === "DANGER"
              ? "Số buổi nghỉ đã vượt 20% kế hoạch. Hãy trao đổi với giảng viên để được hỗ trợ."
              : stats.warning === "WARNING"
                ? "Số buổi nghỉ từ 10% đến 20% kế hoạch. Em hãy chú ý tham gia các buổi học tiếp theo."
                : "Em đang duy trì chuyên cần tốt. Cố gắng tham gia đầy đủ nhé!"}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2,minmax(0,1fr))",
            md: "repeat(4,minmax(0,1fr))",
          },
          gap: 1.5,
        }}
      >
        <AttendanceMetric
          label="Buổi có mặt"
          value={stats.present}
          detail="Chỉ tính đã ghi nhận"
        />
        <AttendanceMetric
          label="Buổi vắng"
          value={stats.absent}
          detail="Không tính ngày chưa ghi nhận"
        />
        <AttendanceMetric
          label="Chưa ghi nhận"
          value={stats.unrecorded}
          detail="Giảng viên cần bổ sung"
        />
        <AttendanceMetric
          label="Kế hoạch ban đầu"
          value={stats.plannedSessions || "—"}
          detail="Buổi bổ sung không tăng mẫu số"
        />
      </Box>
      <Alert
        severity="info"
        sx={{
          bgcolor: "var(--att-blue-bg)",
          color: "var(--att-blue)",
          borderRadius: "16px",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          Hôm nay · {dateLabel(data.today)}
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 1 }}>
          {today
            ? (today.scheduled ? "Theo lịch" : "Ngoài lịch") +
              ` · ${today.startTime ? `${today.startTime}–${today.endTime}` : "Giờ linh động"} · `
            : "Không có buổi học được xác nhận hôm nay. "}
          {today && <AttendanceBadge status={today.status} />} Em sẽ nhận thông
          báo sau khi giảng viên lưu điểm danh.
        </Typography>
      </Alert>
      <AttendanceCalendar
        month={month}
        onMonth={setMonth}
        selected={selected}
        onSelect={(d) => {
          setSelected(d);
          setMonth(d.slice(0, 7));
        }}
        items={data.calendar}
        today={data.today}
      />
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            Lịch sử tham gia
          </Typography>
          <TextField
            size="small"
            select
            label="Trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            sx={{ maxWidth: 260 }}
          >
            <MenuItem value="">Tất cả trạng thái</MenuItem>
            {["PRESENT", "ABSENT", "UNSET", "REPLACED"].map((s) => (
              <MenuItem key={s} value={s}>
                {s === "PRESENT"
                  ? "Có mặt"
                  : s === "ABSENT"
                    ? "Vắng"
                    : s === "REPLACED"
                      ? "Đã có buổi học bù"
                      : "Chưa ghi nhận"}
              </MenuItem>
            ))}
          </TextField>
          {data.items.map((item) => (
            <Box
              key={item.date}
              sx={{
                bgcolor: selected === item.date ? "var(--att-bg)" : undefined,
                borderRadius: "8px",
                px: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 150px 1fr" },
                gap: 1,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: 14 }}>
                {dateLabel(item.date)} ·{" "}
                {item.reasonKind ? reasonLabels[item.reasonKind] : "Theo lịch"}
              </Typography>
              <Box>
                <AttendanceBadge status={item.status as AttendanceStatus} />
              </Box>
              <Typography sx={{ fontSize: 12, color: "var(--att-muted)" }}>
                {item.reason ||
                  (item.status === "UNSET"
                    ? "Chờ giảng viên điểm danh"
                    : item.status === "REPLACED"
                      ? "Xem kết quả ở buổi học bù"
                      : "Đã ghi nhận tham gia")}
              </Typography>
            </Box>
          ))}
          {!data.items.length && (
            <Typography sx={{ fontSize: 14, color: "var(--att-muted)" }}>
              Chưa có buổi học trong phạm vi này.
            </Typography>
          )}
          {data.total > data.pageSize && (
            <Pagination
              size="small"
              count={Math.ceil(data.total / data.pageSize)}
              page={page}
              onChange={(_, p) => setPage(p)}
            />
          )}
        </Stack>
      </Paper>
      <Alert
        severity="info"
        sx={{
          bgcolor: "var(--att-blue-bg)",
          color: "var(--att-blue)",
          borderRadius: "16px",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          Cách tính cảnh báo
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 1 }}>
          Dưới 10%: chấp nhận · 10%–20%: cảnh báo cam · Trên 20%: cảnh báo đỏ.
          Buổi chưa ghi nhận và buổi bị thay bằng học bù không tính là vắng. Mẫu
          số là kế hoạch ban đầu của lớp.
        </Typography>
      </Alert>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 1.5 }}>
          Thông báo điểm danh
        </Typography>
        <Feedback
          loading={notices.isLoading}
          error={notices.error}
          retry={() => void notices.refetch()}
        />
        {notices.currentData?.items
          .filter(
            (n) =>
              new URL(n.href, "https://portal.invalid").searchParams.get(
                "classId",
              ) === classId,
          )
          .slice(0, 5)
          .map((n) => (
            <Box
              key={n.id}
              sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Typography sx={{ fontSize: 14 }}>{n.title}</Typography>
              <Typography
                sx={{ fontSize: 12, color: "var(--att-muted)", mt: 0.5 }}
              >
                {new Date(n.createdAt).toLocaleString("vi-VN")}
              </Typography>
            </Box>
          ))}
      </Paper>
    </AttendanceSurface>
      </Box>
    </Box>
  );
}
