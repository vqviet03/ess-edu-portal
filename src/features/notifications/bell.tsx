"use client";
import Link from "next/link";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import NotificationsNone from "@mui/icons-material/NotificationsNone";
import { libraryApi } from "@/api/library-api";
export function NotificationBell() {
  const query = libraryApi.endpoints.notifications.useQueryState({});
  return (
    <Tooltip title="Thông báo">
      <IconButton
        component={Link}
        href="/notifications/"
        aria-label={`Thông báo (${query.data?.unreadCount ?? 0} chưa đọc)`}
      >
        <Badge badgeContent={query.data?.unreadCount ?? 0} color="error">
          <NotificationsNone fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
