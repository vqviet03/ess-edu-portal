"use client";
import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Refresh from "@mui/icons-material/Refresh";
import DoneAll from "@mui/icons-material/DoneAll";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnread from "@mui/icons-material/MarkEmailUnread";
import OpenInNew from "@mui/icons-material/OpenInNew";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import FirstPage from "@mui/icons-material/FirstPage";
import {
  libraryApi,
  useNotificationsQuery,
  useChangeNotificationMutation,
  useReadNotificationsMutation,
} from "@/api/library-api";
import { useAppDispatch } from "@/store";
import { Feedback } from "@/shared/ui";
import { studentNoticeHref } from "@/features/materials/notification-state";

const types: Record<string, string> = {
  MATERIAL: "Bài đăng / tài liệu",
  REPLY: "Trả lời bình luận",
  SCORE: "Công bố điểm",
  REWARD: "Điểm động viên",
  SCHEDULE: "Lịch học",
  SOCIAL: "Bình luận / tương tác",
};
export function NotificationsPage() {
  const dispatch = useAppDispatch(),
    [type, setType] = useState(""),
    [read, setRead] = useState(""),
    [cursor, setCursor] = useState<string>(),
    [error, setError] = useState<unknown>();
  const filter = {
      type,
      isRead: read === "" ? undefined : read === "true",
      cursor,
    },
    filtered = !!type || !!read || !!cursor;
  const requested = useNotificationsQuery(filter, { skip: !filtered }),
    cached = libraryApi.endpoints.notifications.useQueryState(filter),
    query = filtered ? requested : cached;
  const [change, changing] = useChangeNotificationMutation(),
    [readAll, reading] = useReadNotificationsMutation();
  const reload = () => {
    setError(undefined);
    void dispatch(
      libraryApi.endpoints.notifications.initiate(filter, {
        forceRefetch: true,
        subscribe: false,
      }),
    );
  };
  async function mark(
    id: string,
    version: number,
    isRead?: boolean,
    deleted?: boolean,
  ) {
    try {
      setError(undefined);
      await change({ id, version, isRead, deleted }).unwrap();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Tooltip title="Về lớp học">
            <IconButton component={Link} href="/home/" aria-label="Về lớp học">
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography component="h1" variant="h4">
              Thông báo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {query.currentData?.unreadCount ?? 0} chưa đọc
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row">
          <Tooltip title="Tải lại">
            <IconButton
              aria-label="Tải lại thông báo"
              disabled={query.isFetching}
              onClick={reload}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Đánh dấu tất cả đã đọc">
            <span>
              <IconButton
                aria-label="Đánh dấu tất cả đã đọc"
                disabled={reading.isLoading || !query.currentData?.unreadCount}
                onClick={async () => {
                  try {
                    setError(undefined);
                    await readAll().unwrap();
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                <DoneAll fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          select
          label="Loại thông báo"
          size="small"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setCursor(undefined);
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {Object.entries(types).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Trạng thái thông báo"
          size="small"
          value={read}
          onChange={(e) => {
            setRead(e.target.value);
            setCursor(undefined);
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="false">Chưa đọc</MenuItem>
          <MenuItem value="true">Đã đọc</MenuItem>
        </TextField>
      </Stack>
      <Feedback
        loading={query.isLoading}
        error={query.error || error}
        retry={reload}
      />
      {!query.currentData && !query.isLoading && !query.error && (
        <Typography color="text.secondary">
          Đang kết nối thông báo. Bạn có thể bấm tải lại để xem danh sách.
        </Typography>
      )}
      {query.currentData && !query.currentData.items.length && (
        <Feedback empty="Chưa có thông báo phù hợp." />
      )}
      {query.currentData?.items.map((n) => {
        const href = studentNoticeHref(n);
        return (
          <Paper
            key={n.id}
            component="article"
            aria-label={n.title}
            sx={{
              p: 1.5,
              borderLeft: 3,
              borderColor: n.isRead ? "divider" : "primary.main",
            }}
          >
            <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: n.isRead ? 400 : 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {n.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {types[n.type] ?? "Thông báo"} ·{" "}
                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                </Typography>
              </Box>
              <Stack
                direction="row"
                sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
              >
                {href && (
                  <Tooltip title="Mở nội dung">
                    <IconButton
                      component={Link}
                      href={href}
                      aria-label={`Mở ${n.title}`}
                      onClick={() => {
                        if (!n.isRead) void mark(n.id, n.version, true);
                      }}
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip
                  title={n.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                >
                  <span>
                    <IconButton
                      disabled={changing.isLoading}
                      aria-label={`${n.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}: ${n.title}`}
                      onClick={() => void mark(n.id, n.version, !n.isRead)}
                    >
                      {n.isRead ? (
                        <MarkEmailUnread fontSize="small" />
                      ) : (
                        <MarkEmailRead fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Ẩn thông báo">
                  <span>
                    <IconButton
                      disabled={changing.isLoading}
                      aria-label={`Ẩn thông báo: ${n.title}`}
                      onClick={() =>
                        void mark(n.id, n.version, undefined, true)
                      }
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
      <Stack direction="row" sx={{ justifyContent: "center" }}>
        {cursor && (
          <Tooltip title="Thông báo mới nhất">
            <IconButton
              aria-label="Thông báo mới nhất"
              onClick={() => setCursor(undefined)}
            >
              <FirstPage fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {query.currentData?.nextCursor && (
          <Tooltip title="Thông báo tiếp theo">
            <IconButton
              aria-label="Thông báo tiếp theo"
              onClick={() =>
                setCursor(query.currentData?.nextCursor ?? undefined)
              }
            >
              <ArrowForward fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
}
