"use client";
import { Alert, Box, Button, CircularProgress, Typography } from "./ui";
import { errorDetails } from "@/api/errors";
export function Feedback({
  loading,
  error,
  retry,
  empty,
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  empty?: string;
}) {
  if (error)
    return (
      <Alert
        severity="error"
        sx={{ my: 2 }}
        action={
          retry ? (
            <Button color="inherit" onClick={retry}>
              Thử lại
            </Button>
          ) : undefined
        }
      >
        {errorDetails(error).message}
      </Alert>
    );
  if (!loading && empty === undefined) return null;
  if (loading) return <Loading page />;
  return (
    <Box role="status" sx={{ py: 5, px: 2, textAlign: "center" }}>
      <Typography color="text.secondary">{empty}</Typography>
    </Box>
  );
}
/**
 * Circular loading indicator. `page` centres it in the page area; without it
 * it is a compact inline spinner for a section that is refreshing.
 */
export function Loading({ page = false }: { page?: boolean }) {
  return (
    <Box
      role="status"
      aria-label="Đang tải"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: page ? 0 : 1.5,
        minHeight: page ? "40vh" : undefined,
        animation: "ess-loading-in 240ms cubic-bezier(0.2, 0, 0, 1) both",
        "@keyframes ess-loading-in": {
          from: { opacity: 0, transform: "scale(0.6)" },
          to: { opacity: 1, transform: "none" },
        },
      }}
    >
      <CircularProgress size={page ? 36 : 24} thickness={4.5} />
    </Box>
  );
}
