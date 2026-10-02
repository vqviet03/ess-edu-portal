"use client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: { main: "#1769d2", dark: "#104c9c" },
    secondary: { main: "#164f58" },
    background: { default: "#f4f7fb", paper: "#ffffff" },
    text: { primary: "#152d4a", secondary: "#576b83" },
    success: { main: "#187250" },
    divider: "#e3eaf2",
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h3: { fontWeight: 750, letterSpacing: "-0.04em" },
    h4: { fontWeight: 750, letterSpacing: "-0.035em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700, fontSize: "0.9375rem" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 44 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    MuiLinearProgress: { styleOverrides: { root: { height: 8, borderRadius: 8, backgroundColor: "#e7eef7" }, bar: { borderRadius: 8 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.8125rem" } } },
  },
});
export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
