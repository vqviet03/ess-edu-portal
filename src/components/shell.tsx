"use client";
import { useState } from "react";
import { useStore } from "react-redux";
import Menu from "@mui/material/Menu";
import NextLink from "next/link";
import { ProfileAvatar } from "@/features/profile/avatar";
import IconButton from "@mui/material/IconButton";
import { Box, Container, MenuItem, Stack, Typography } from "./ui";
import {
  AppScale,
  DisplayTools,
  GuideLayout,
  useAppDisplay,
  zoomLevels,
} from "@/features/help/display";
import Brand from "./brand";
import { NotificationBell } from "@/features/notifications/bell";
import Tooltip from "@mui/material/Tooltip";
import Language from "@mui/icons-material/Language";
import BrightnessAuto from "@mui/icons-material/BrightnessAuto";
import MoreVert from "@mui/icons-material/MoreVert";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import Logout from "@mui/icons-material/Logout";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import Remove from "@mui/icons-material/Remove";
import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import LightMode from "@mui/icons-material/LightModeOutlined";
import DarkMode from "@mui/icons-material/DarkModeOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { useAppearance } from "./providers";
import { type RootState, useAppDispatch, useAppSelector } from "@/store";
import { loggedOut } from "@/store/auth";
import { useLogoutMutation } from "@/api/api";
import { useApplicationName } from "@/features/settings/hooks";
export default function Shell({ children }: { children: React.ReactNode }) {
  const appName = useApplicationName();
  const [menu, setMenu] = useState<{
    kind: "theme" | "language" | "profile" | "more";
    anchor: HTMLElement;
  } | null>(null);
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const display = useAppDisplay(),
    { zoom } = display,
    zoomIndex = (zoomLevels as readonly number[]).indexOf(zoom);
  const appearance = useAppearance();
  const student = useAppSelector((s) => s.auth.student);
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [logout, logoutState] = useLogoutMutation();
  async function signOut() {
    setMenu(null);
    const token = store.getState().auth.accessToken;
    try {
      await logout().unwrap();
    } catch {
      /* Local logout still works when the backend is unavailable. */
    } finally {
      if (store.getState().auth.accessToken === token) dispatch(loggedOut());
    }
  }
  const preferenceItems = [
    <MenuItem
      key="guide"
      onClick={() => {
        setMenu(null);
        display.toggle();
      }}
    >
      <ListItemIcon>
        <HelpOutlined fontSize="small" />
      </ListItemIcon>
      {display.open ? "Ẩn hướng dẫn" : "Hướng dẫn"}
    </MenuItem>,
    <Stack
      key="zoom"
      direction="row"
      role="group"
      aria-label="Cỡ giao diện"
      sx={{ alignItems: "center", px: 2, py: 0.5, gap: 1 }}
    >
      <Typography variant="body2" sx={{ flex: 1 }}>
        Cỡ giao diện
      </Typography>
      <IconButton
        size="small"
        aria-label="Thu nhỏ giao diện"
        disabled={zoomIndex <= 0}
        onClick={() => display.setZoom(zoomLevels[zoomIndex - 1])}
      >
        <Remove fontSize="small" />
      </IconButton>
      <Typography
        component="button"
        type="button"
        aria-label="Đặt lại kích thước 100%"
        onClick={() => display.setZoom(100)}
        sx={{
          border: 0,
          bgcolor: "transparent",
          color: "primary.main",
          font: "inherit",
          fontWeight: 700,
          fontSize: 13,
          minWidth: 44,
          cursor: "pointer",
        }}
      >
        {zoom}%
      </Typography>
      <IconButton
        size="small"
        aria-label="Phóng to giao diện"
        disabled={zoomIndex === zoomLevels.length - 1}
        onClick={() => display.setZoom(zoomLevels[zoomIndex + 1])}
      >
        <Add fontSize="small" />
      </IconButton>
    </Stack>,
    <Divider key="d1" />,
    <ListSubheader key="theme-h" sx={{ lineHeight: "32px" }}>
      Giao diện
    </ListSubheader>,
    ...(["light", "dark", "system"] as const).map((mode, i) => (
      <MenuItem
        key={mode}
        selected={appearance.preference === mode}
        onClick={() => {
          appearance.change(mode);
          setMenu(null);
        }}
      >
        <ListItemIcon>
          {mode === "light" ? (
            <LightMode fontSize="small" />
          ) : mode === "dark" ? (
            <DarkMode fontSize="small" />
          ) : (
            <BrightnessAuto fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText>{["Sáng", "Tối", "Theo hệ thống"][i]}</ListItemText>
        {appearance.preference === mode && (
          <Check fontSize="small" color="primary" />
        )}
      </MenuItem>
    )),
    <Divider key="d2" />,
    <MenuItem key="lang" onClick={() => setMenu(null)}>
      <ListItemIcon>
        <Language fontSize="small" />
      </ListItemIcon>
      <ListItemText secondary="Tiếng Việt">Ngôn ngữ</ListItemText>
    </MenuItem>,
  ];
  return (
    <AppScale>
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1280 / (zoom / 100), px: { xs: 2.5, md: 3 }, pb: 5 }}
      >
        <Stack
          component="header"
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            py: { xs: 1, sm: 2.5 },
            mb: { xs: 1, sm: 0 },
            gap: { xs: 0.5, sm: 1 },
            flexWrap: { xs: "nowrap", sm: "wrap" },
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              minWidth: 0,
              maxWidth: "100%",
              flex: { xs: 1, sm: "0 1 auto" },
              "& .MuiTypography-root": {
                fontSize: { xs: "1.05rem", sm: "1.25rem" },
              },
            }}
          >
            <Brand name={appName} />
          </Stack>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              flexWrap: { xs: "nowrap", sm: "wrap" },
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: { xs: "none", sm: "contents" } }}>
              <DisplayTools />
            </Box>
            <Tooltip title="Ngôn ngữ">
              <IconButton
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
                aria-label="Ngôn ngữ"
                onClick={(e) =>
                  setMenu({ kind: "language", anchor: e.currentTarget })
                }
              >
                <Language fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Giao diện">
              <IconButton
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
                aria-label="Giao diện"
                onClick={(e) =>
                  setMenu({ kind: "theme", anchor: e.currentTarget })
                }
              >
                <BrightnessAuto fontSize="small" />
              </IconButton>
            </Tooltip>
            {student && <NotificationBell />}
            {student && (
              <Tooltip title="Tài khoản">
                <IconButton
                  aria-label="Tài khoản"
                  disabled={logoutState.isLoading}
                  onClick={(e) =>
                    setMenu({ kind: "profile", anchor: e.currentTarget })
                  }
                >
                  <ProfileAvatar
                    name={student.fullName}
                    value={student.avatar}
                    size={30}
                  />
                </IconButton>
              </Tooltip>
            )}
            {!student && (
              <IconButton
                aria-label="Tùy chọn khác"
                aria-haspopup="menu"
                aria-expanded={menu?.kind === "more"}
                sx={{ display: { xs: "inline-flex", sm: "none" } }}
                onClick={(e) =>
                  setMenu({ kind: "more", anchor: e.currentTarget })
                }
              >
                <MoreVert />
              </IconButton>
            )}
          </Stack>
        </Stack>
        <Menu
          anchorEl={menu?.anchor}
          open={!!menu}
          onClose={() => setMenu(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: { sx: { minWidth: 220, maxWidth: "calc(100vw - 24px)" } },
          }}
        >
          {menu?.kind === "theme" &&
            (["light", "dark", "system"] as const).map((mode, i) => (
              <MenuItem
                key={mode}
                selected={appearance.preference === mode}
                onClick={() => {
                  appearance.change(mode);
                  setMenu(null);
                }}
              >
                {["Sáng", "Tối", "Theo hệ thống"][i]}
              </MenuItem>
            ))}
          {menu?.kind === "more" && preferenceItems}
          {menu?.kind === "language" && (
            <MenuItem selected onClick={() => setMenu(null)}>
              Tiếng Việt
            </MenuItem>
          )}
          {menu?.kind === "profile" && [
            <MenuItem
              key="profile"
              component={NextLink}
              href="/profile/"
              onClick={() => setMenu(null)}
            >
              <ListItemIcon>
                <PersonOutlined fontSize="small" />
              </ListItemIcon>
              Hồ sơ cá nhân
            </MenuItem>,
            // Phones have no separate ⋮: preferences live in the avatar menu.
            ...(compact ? [<Divider key="pref-d" />, ...preferenceItems] : []),
            <Divider key="out-d" />,
            <MenuItem
              key="out"
              disabled={logoutState.isLoading}
              onClick={signOut}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              Đăng xuất
            </MenuItem>,
          ]}
        </Menu>
        <GuideLayout>
          <Box component="main">{children}</Box>
        </GuideLayout>
        <Typography
          component="footer"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 4, textAlign: "center", overflowWrap: "anywhere" }}
        >
          {appName} · Báo cáo học tập của học sinh
        </Typography>
      </Container>
    </AppScale>
  );
}
