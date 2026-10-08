"use client";
import { useContactsQuery } from "@/api/library-api";
import { Paper, Stack, Typography, Button } from "@/components/ui";
import { Feedback } from "@/components/feedback";
export function TeacherContacts({ classId }: { classId: string }) {
  const q = useContactsQuery(classId, { skip: !classId });
  return (
    <Paper sx={{ p: 2, my: 2 }}>
      <Typography variant="h6">Giảng viên phụ trách & liên hệ</Typography>
      <Feedback
        loading={q.isLoading}
        error={q.error}
        retry={() => void q.refetch()}
      />
      {q.currentData?.items.map((t) => (
        <Stack
          key={t.id}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
          {t.email && <Button href={`mailto:${t.email}`}>{t.email}</Button>}
          {t.phone && (
            <Button href={`tel:${t.phone.replace(/[^+0-9]/g, "")}`}>
              {t.phone}
            </Button>
          )}
          {!t.email && !t.phone && (
            <Typography variant="body2">Chưa có liên hệ</Typography>
          )}
        </Stack>
      ))}
      {q.currentData?.items.length === 0 && (
        <Typography>Chưa có giảng viên đang phụ trách.</Typography>
      )}
    </Paper>
  );
}
