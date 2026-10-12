"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useStore } from "react-redux";
import Menu from "@mui/material/Menu";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import { usePathname, useSearchParams } from "next/navigation";
import { AssignmentSurface } from "@/features/assignments/surface";
import { useClassesQuery } from "@/api/api";
import NextLink from "next/link";
import { ProfileAvatar } from "@/features/profile/avatar";
import IconButton from "@mui/material/IconButton";
import { Box, Container, MenuItem, Stack, Typography } from "./ui";
import {
  AppScale,
  DisplayTools,
  GuideLayout,
  useAppDisplay,
} from "@/features/help/display";
import Brand from "./brand";
import { NotificationBell } from "@/features/notifications/bell";
import Tooltip from "@mui/material/Tooltip";
import Language from "@mui/icons-material/Language";
import BrightnessAuto from "@mui/icons-material/BrightnessAuto";
import { useAppearance } from "./providers";
import { type RootState, useAppDispatch, useAppSelector } from "@/store";
import { loggedOut } from "@/store/auth";
import { useLogoutMutation } from "@/api/api";
import { useApplicationName } from "@/features/settings/hooks";
function AssignmentBreadcrumb({ name }: { name: string }) {
  const params = useSearchParams(),
    id = params.get("classId"),
    classes = useClassesQuery();
  const room = classes.data?.find((c) => c.id === id);
  return (
    <>
      {name}
      {room ? ` / ${room.name}` : ""}
    </>
  );
}
function AssignmentSidebar({ appName }: { appName: string }) {
  const pathname = usePathname(),
    params = useSearchParams();
  return (
    <Paper
      component="aside"
      sx={{
        display: { xs: "none", md: "block" },
        p: 2.5,
        border: 0,
        borderRadius: "16px",
        position: "sticky",
        top: 0,
        alignSelf: "start",
      }}
    >
      <Typography color="primary.main" sx={{ fontWeight: 700, fontSize: 18 }}>
        {appName}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          my: 1.5,
          pb: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        STUDENT PORTAL
      </Typography>
      <Stack component="nav" aria-label="Menu học sinh" spacing={1.5}>
        {[
          ["Tổng quan", "/home/"],
          ["Lớp học", "/home/"],
          [
            "Bài tập",
            `/materials/?classId=${encodeURIComponent(params.get("classId") ?? "")}`,
          ],
          [
            "Báo cáo",
            `/assignment-report/?classId=${encodeURIComponent(params.get("classId") ?? "")}`,
          ],
          ["Thông báo", "/notifications/"],
          ["Tài khoản", "/profile/"],
        ].map(([name, href]) => (
          <Typography
            component={NextLink}
            key={name}
            href={href}
            aria-current={
              name ===
              (pathname.includes("assignment-report") ? "Báo cáo" : "Bài tập")
                ? "page"
                : undefined
            }
            sx={{
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              color:
                name ===
                (pathname.includes("assignment-report") ? "Báo cáo" : "Bài tập")
                  ? "primary.main"
                  : "text.secondary",
            }}
          >
            {name}
          </Typography>
        ))}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Học sinh
      </Typography>
    </Paper>
  );
}
export default function Shell({ children }: { children: React.ReactNode }) {
  const appName = useApplicationName();
  const pathname = usePathname(),
    assignmentRoute = /^\/assignment(?:-report)?\/?$/.test(pathname),
    theme = useTheme();
  const [optionsAnchor, setOptionsAnchor] = useState<HTMLElement | null>(null);
  const [menu, setMenu] = useState<{
    kind: "theme" | "language" | "profile";
    anchor: HTMLElement;
  } | null>(null);
  const { zoom } = useAppDisplay();
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
  const headerControls = (
    <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <DisplayTools />
      <Tooltip title="Ngôn ngữ">
        <IconButton
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
          aria-label="Giao diện"
          onClick={(e) => setMenu({ kind: "theme", anchor: e.currentTarget })}
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
    </Stack>
  );
  const content = (
    <AppScale>
      <Container
        maxWidth={false}
        disableGutters={assignmentRoute}
        sx={{
          maxWidth: (assignmentRoute ? 1200 : 1280) / (zoom / 100),
          px: assignmentRoute ? 0 : { xs: 2.5, md: 3 },
          pb: assignmentRoute ? 0 : 5,
          ...(assignmentRoute
            ? {
                display: { md: "grid" },
                gridTemplateColumns: "180px minmax(0,1fr)",
                bgcolor: "var(--a-bg)",
                minHeight: "100vh",
              }
            : {}),
        }}
      >
        {assignmentRoute && (
          <Suspense fallback={null}>
            <AssignmentSidebar appName={appName} />
          </Suspense>
        )}
        <Box sx={assignmentRoute ? { minWidth: 0, p: { xs: 2, md: 3.5 } } : {}}>
          <Stack
            component="header"
            className={assignmentRoute ? "assignment-topbar" : undefined}
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              py: assignmentRoute ? 0 : 2.5,
              mb: assignmentRoute ? 2.5 : 0,
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {assignmentRoute ? (
              <Typography variant="caption" color="text.secondary">
                <AssignmentBreadcrumb name={appName} />
              </Typography>
            ) : (
              <Brand name={appName} />
            )}
            {assignmentRoute ? (
              <>
                <Button
                  aria-label="Tuỳ chọn giao diện và tài khoản"
                  onClick={(e) => setOptionsAnchor(e.currentTarget)}
                  sx={{
                    p: 0,
                    minHeight: 18,
                    bgcolor: "transparent",
                    fontSize: 12,
                    fontWeight: 400,
                    color: "text.secondary",
                  }}
                >
                  VI · {theme.palette.mode === "dark" ? "Tối" : "Sáng"}
                </Button>
                <Popover
                  open={!!optionsAnchor}
                  anchorEl={optionsAnchor}
                  onClose={() => setOptionsAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <Box sx={{ p: 1.5, maxWidth: 420 }}>{headerControls}</Box>
                </Popover>
              </>
            ) : (
              headerControls
            )}
          </Stack>
          <Menu
            anchorEl={menu?.anchor}
            open={!!menu}
            onClose={() => setMenu(null)}
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
            {menu?.kind === "language" && (
              <MenuItem selected onClick={() => setMenu(null)}>
                Tiếng Việt
              </MenuItem>
            )}
            {menu?.kind === "profile" && (
              <MenuItem
                component={NextLink}
                href="/profile/"
                onClick={() => setMenu(null)}
              >
                Hồ sơ cá nhân
              </MenuItem>
            )}
            {menu?.kind === "profile" && (
              <MenuItem disabled={logoutState.isLoading} onClick={signOut}>
                Đăng xuất
              </MenuItem>
            )}
          </Menu>
          <GuideLayout>
            <Box component="main">{children}</Box>
          </GuideLayout>
          <Typography
            component="footer"
            variant="body2"
            color="text.secondary"
            sx={{
              display: assignmentRoute ? "none" : undefined,
              mt: 4,
              textAlign: "center",
              overflowWrap: "anywhere",
            }}
          >
            {appName} · Báo cáo học tập của học sinh
          </Typography>
        </Box>
      </Container>
    </AppScale>
  );
  return assignmentRoute ? (
    <AssignmentSurface>{content}</AssignmentSurface>
  ) : (
    content
  );
}
