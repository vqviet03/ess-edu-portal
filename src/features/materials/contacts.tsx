"use client";
import { useState } from "react";
import { useContactsQuery } from "@/api/library-api";
import { Paper, Stack, Typography, Button } from "@/components/ui";
import { Feedback } from "@/components/feedback";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MailOutline from "@mui/icons-material/MailOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
export function TeacherContacts({ classId }: { classId: string }) {
  const q = useContactsQuery(classId, { skip: !classId });
  // On phones the card is a one-line summary; contact details open on demand
  // so the class tabs stay in the first screen.
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm")),
    [expanded, setExpanded] = useState(false),
    showDetails = !compact || expanded,
    names = q.currentData?.items.map((t) => t.name).join(", ");
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, my: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: 15, sm: "1.25rem" } }}>
            Giảng viên phụ trách & liên hệ
          </Typography>
          {!showDetails && names && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {names}
            </Typography>
          )}
        </Stack>
        {compact && !!q.currentData?.items.length && (
          <IconButton
            aria-label={expanded ? "Thu gọn liên hệ" : "Xem liên hệ giảng viên"}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <ExpandMore
              sx={{
                transition: "transform .2s",
                transform: expanded ? "rotate(180deg)" : "none",
              }}
            />
          </IconButton>
        )}
      </Stack>
      <Feedback
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      <Collapse in={showDetails}>
        {q.currentData?.items.map((t) => (
          <Stack
            key={t.id}
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
            {t.email && (
              <Button
                href={`mailto:${t.email}`}
                startIcon={compact ? <MailOutline /> : undefined}
                sx={{ maxWidth: "100%", overflowWrap: "anywhere" }}
              >
                {t.email}
              </Button>
            )}
            {t.phone && (
              <Button
                href={`tel:${t.phone.replace(/[^+0-9]/g, "")}`}
                startIcon={compact ? <PhoneOutlined /> : undefined}
              >
                {t.phone}
              </Button>
            )}
            {!t.email && !t.phone && (
              <Typography variant="body2">Chưa có liên hệ</Typography>
            )}
          </Stack>
        ))}
      </Collapse>
      {q.currentData?.items.length === 0 && (
        <Typography>Chưa có giảng viên đang phụ trách.</Typography>
      )}
    </Paper>
  );
}
