"use client";
import { Suspense, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FloatingBack, PageBack, useFloatingBack } from "./page-back";

/**
 * The common page header: Back (on every non-entry page, from the route
 * table in `page-back`), the page title, an optional subtitle and actions.
 * Pages without a visible title (post detail, assignments) render it with no
 * `title` to keep Back in the same place.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const [floatRef, floatState] = useFloatingBack(12);
  return (
    <Stack
      component="section"
      aria-label={typeof title === "string" ? title : undefined}
      spacing={{ xs: 0.5, sm: 1 }}
      sx={{ mb: { xs: 1.5, sm: 2 } }}
    >
      <Stack
        ref={floatRef}
        direction="row"
        sx={{ alignItems: "center", gap: 0.5 }}
      >
        <Suspense>
          <PageBack />
          <FloatingBack
            shown={floatState.shown}
            left={floatState.left}
            top={12}
          />
        </Suspense>
        {title && (
          <Typography
            component="h1"
            variant="h4"
            sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
          >
            {title}
          </Typography>
        )}
        {actions && (
          <Stack
            direction="row"
            sx={{ alignItems: "center", ml: "auto", flexShrink: 0 }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
      {subtitle && (
        <Typography
          component="div"
          color="text.secondary"
          sx={{ fontSize: { xs: 13, sm: 16 } }}
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}
