"use client";
import Grow from "@mui/material/Grow";
import { compactControls } from "@/theme/compact";
import { RouteStateProvider } from "@/shared/route-state";
import { NavigationRuntime } from "@/shared/page-navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PwaRuntime } from "@/features/pwa/runtime";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { makeStore } from "@/store";
import { AppDisplayProvider } from "@/features/help/display";
import { AuthRuntime } from "@/auth/runtime";
import { ApplicationTitle } from "@/features/settings/title";
// Motion curves shared by the theme.
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EMPHASIZED = "cubic-bezier(0.2, 0, 0, 1)";
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
/**
 * Select menus copy the field's width as min-width in unzoomed CSS px, but
 * the menu renders outside the zoomed page; scale it before positioning so
 * the menu matches the field at every app zoom.
 */
const fitMenuToZoom = (node: HTMLElement) => {
  const zoom =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--app-zoom"),
    ) || 1;
  if (zoom === 1 || !node.style.minWidth || node.dataset.zoomFitted) return;
  node.style.minWidth = `${parseFloat(node.style.minWidth) * zoom}px`;
  node.dataset.zoomFitted = "1";
};
type Preference = "light" | "dark" | "system";
const Appearance = createContext<{
  preference: Preference;
  change: (p: Preference) => void;
}>({ preference: "system", change: () => {} });
export const useAppearance = () => useContext(Appearance);
export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  useEffect(() => setupListeners(store.dispatch), [store]);
  const [preference, setPreference] = useState<Preference>("system");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  useEffect(() => {
    try {
      const value = localStorage.getItem("learnleaf.theme");
      if (value === "light" || value === "dark" || value === "system")
        setPreference(value);
    } catch {}
  }, []);
  const change = (value: Preference) => {
    setPreference(value);
    try {
      localStorage.setItem("learnleaf.theme", value);
    } catch {}
  };
  const mode =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          action: { selected: mode === "light" ? "#def1e3" : "#284937" },
          primary: {
            main: mode === "light" ? "#277751" : "#99d7b2",
            contrastText: mode === "light" ? "#ffffff" : "#123321",
          },
          background: {
            default: mode === "light" ? "#f2f7f3" : "#111d17",
            paper: mode === "light" ? "#ffffff" : "#1b2c22",
          },
          text: {
            primary: mode === "light" ? "#203c2c" : "#e1f0e5",
            secondary: mode === "light" ? "#617568" : "#aec4b5",
          },
          divider: mode === "light" ? "#dde8e0" : "#35493b",
          success: { main: mode === "light" ? "#277751" : "#99d7b2" },
          error: { main: mode === "light" ? "#bb4264" : "#ffa9c3" },
        },
        typography: {
          fontFamily: "Arial, Helvetica, sans-serif",
          h4: {
            fontSize: "1.625rem",
            fontWeight: 700,
            lineHeight: 1.4,
            "@media (max-width:599.95px)": { fontSize: "1.25rem" },
          },
          h5: {
            fontSize: "1.25rem",
            fontWeight: 700,
            "@media (max-width:599.95px)": { fontSize: "1.1rem" },
          },
          h6: { fontSize: "1.125rem", fontWeight: 700 },
          body1: { lineHeight: 1.65 },
          button: { textTransform: "none", fontWeight: 700 },
        },
        shape: { borderRadius: 14 },
        // Shared motion: springy (slightly overshooting) easing for things that
        // appear or move, emphasized easing for colour changes. Only transform and
        // opacity animate, so interactions stay smooth; reduced motion disables it.
        transitions: {
          easing: {
            easeInOut: "cubic-bezier(0.2, 0, 0, 1)",
            easeOut: "cubic-bezier(0.05, 0.7, 0.1, 1)",
            easeIn: "cubic-bezier(0.3, 0, 0.8, 0.15)",
            sharp: "cubic-bezier(0.2, 0, 0, 1)",
          },
          duration: {
            shortest: 120,
            shorter: 180,
            short: 220,
            standard: 280,
            complex: 360,
            enteringScreen: 300,
            leavingScreen: 200,
          },
        },
        components: {
          // Popups render outside the zoomed page: scale their content with the app zoom.
          MuiTooltip: {
            styleOverrides: { tooltip: { zoom: "var(--app-zoom, 1)" } },
          },
          MuiAutocomplete: {
            styleOverrides: { paper: { zoom: "var(--app-zoom, 1)" } },
          },
          MuiCssBaseline: {
            styleOverrides: {
              // Mobile browsers zoom the page when a focused field is under
              // 16px; keep typing text at 16px on touch screens instead.
              "@media (pointer: coarse)": {
                "input, textarea, select": { fontSize: "16px !important" },
              },
              "@media (prefers-reduced-motion: reduce)": {
                "*, *::before, *::after": {
                  animationDuration: "1ms !important",
                  transitionDuration: "1ms !important",
                },
              },
            },
          },
          // Press: a quick squash, then an elastic bounce back on release.
          MuiButtonBase: {
            styleOverrides: {
              root: {
                transition: `transform 460ms ${SPRING}, background-color 180ms ${EMPHASIZED}, color 180ms ${EMPHASIZED}, box-shadow 180ms ${EMPHASIZED}`,
                "&:active:not(.Mui-disabled)": {
                  transform: "scale(1.05, 0.92)",
                  transition: `transform 90ms ease-out, background-color 180ms ${EMPHASIZED}`,
                },
              },
            },
          },
          // Wide rows squash less so lists don't wobble.
          MuiListItemButton: {
            styleOverrides: {
              root: {
                "&&:active:not(.Mui-disabled)": { transform: "scale(0.985)" },
              },
            },
          },
          // Menus, popovers, dialogs and toasts pop open with a spring.
          MuiPopover: {
            styleOverrides: {
              paper: { "& > *": { zoom: "var(--app-zoom, 1)" } },
            },
            defaultProps: {
              transitionDuration: { enter: 340, exit: 160 },
              slotProps: {
                transition: { easing: { enter: SPRING, exit: EMPHASIZED } },
              },
            },
          },
          MuiMenu: {
            defaultProps: {
              transitionDuration: { enter: 340, exit: 160 },
              slotProps: {
                transition: {
                  easing: { enter: SPRING, exit: EMPHASIZED },
                  onEntering: fitMenuToZoom,
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                zoom: "var(--app-zoom, 1)",
                "&.MuiDialog-paperFullScreen": {
                  zoom: 1,
                  "& > *": { zoom: "var(--app-zoom, 1)" },
                },
              },
            },
            defaultProps: {
              slots: { transition: Grow },
              transitionDuration: { enter: 380, exit: 180 },
              slotProps: {
                transition: { easing: { enter: SPRING, exit: EMPHASIZED } },
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: { "& > *": { zoom: "var(--app-zoom, 1)" } },
            },
            defaultProps: {
              transitionDuration: { enter: 420, exit: 240 },
              slotProps: {
                transition: { easing: { enter: DRAWER, exit: EMPHASIZED } },
              },
            },
          },
          MuiCollapse: {
            defaultProps: {
              timeout: 320,
              easing: { enter: DRAWER, exit: EMPHASIZED },
            },
          },
          MuiTabs: {
            styleOverrides: {
              // Drawn on the selected tab itself (below): the measured indicator
              // is misplaced under the app's CSS zoom.
              indicator: { display: "none" },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              switchBase: {
                transition: `transform 380ms ${SPRING} !important`,
              },
              thumb: {
                transition: `transform 380ms ${SPRING}`,
              },
            },
          },
          // Dragging a slider swells the thumb; releasing snaps it with a spring.
          MuiSlider: {
            styleOverrides: {
              thumb: {
                transition: `left 360ms ${SPRING}, bottom 360ms ${SPRING}, transform 360ms ${SPRING}, box-shadow 150ms ease`,
                "&.Mui-active": {
                  transform: "translate(-50%, -50%) scale(1.3)",
                },
              },
              track: {
                transition: `width 360ms ${SPRING}, left 360ms ${SPRING}`,
              },
              dragging: {
                "& .MuiSlider-thumb, & .MuiSlider-track": {
                  transition: "transform 120ms ease-out",
                },
              },
            },
          },
          MuiSnackbar: {
            styleOverrides: {
              root: { "& > *": { zoom: "var(--app-zoom, 1)" } },
            },
            defaultProps: {
              anchorOrigin: { vertical: "top", horizontal: "center" },
              slotProps: {
                transition: { easing: { enter: SPRING, exit: EMPHASIZED } },
              },
            },
          },
          // Compact toasts at the top of the screen.
          MuiSnackbarContent: {
            styleOverrides: {
              root: {
                minWidth: 0,
                padding: "4px 12px",
                borderRadius: 12,
                fontSize: 13,
                maxWidth: "calc(100vw - 24px)",
              },
              message: { padding: "6px 0" },
            },
          },
          MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { backgroundImage: "none" } },
          },
          MuiButton: {
            defaultProps: { disableElevation: true, size: "small" },
            styleOverrides: {
              root: { "@media (pointer: coarse)": { minHeight: 44 } },
            },
          },
          MuiIconButton: {
            defaultProps: { size: "small" },
            styleOverrides: {
              root: {
                "@media (pointer: coarse)": { minWidth: 44, minHeight: 44 },
              },
            },
          },
          MuiTextField: { defaultProps: { size: "small" } },
          MuiFormControl: { defaultProps: { size: "small" } },
          MuiInputBase: { defaultProps: { size: "small" } },
          MuiSelect: { defaultProps: { size: "small" } },
          MuiChip: { defaultProps: { size: "small" } },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                "&&:active:not(.Mui-disabled)": { transform: "scale(0.985)" },
                "@media (pointer: coarse)": { minHeight: 44 },
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                "&&:active:not(.Mui-disabled)": { transform: "scale(0.96)" },
                position: "relative",
                "&.Mui-selected::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  borderRadius: "2px 2px 0 0",
                  backgroundColor: "currentColor",
                  animation: `ess-tab-underline 380ms ${SPRING} both`,
                },
                "@keyframes ess-tab-underline": {
                  from: { transform: "scaleX(0.2)", opacity: 0 },
                  to: { transform: "scaleX(1)", opacity: 1 },
                },
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.9375rem",
                fontWeight: 600,
              },
            },
          },

          ...compactControls,
        },
      }),
    [mode],
  );
  return (
    <Provider store={store}>
      <NavigationRuntime />
      <RouteStateProvider>
        <ApplicationTitle />
        <Appearance.Provider value={{ preference, change }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppDisplayProvider storageKey="ess.student.zoom">
              <PwaRuntime />
              <AuthRuntime>{children}</AuthRuntime>
            </AppDisplayProvider>
          </ThemeProvider>
        </Appearance.Provider>
      </RouteStateProvider>
    </Provider>
  );
}
