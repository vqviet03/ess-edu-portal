"use client";
import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import Icon from "./icon";
import { api } from "@/lib/api";
import { ApiError, percent, type Unit } from "@/lib/api/types";
export default function UnitDetail({ unitId, token, onClose, onUnauthorized }: {
    unitId: string | null;
    token: string;
    onClose: () => void;
    onUnauthorized: () => void;
}) {
    const [unit, setUnit] = useState<Unit | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (!unitId)
            return;
        const controller = new AbortController();
        setUnit(null);
        setError("");
        api.getUnit(token, unitId, controller.signal).then(setUnit).catch(error => {
            if (controller.signal.aborted)
                return;
            if (error instanceof ApiError && error.status === 401) {
                onUnauthorized();
                return;
            }
            setError(error instanceof Error ? error.message : "Không tải được unit.");
        });
        return () => controller.abort();
    }, [unitId, token, attempt, onUnauthorized]);
    return <Dialog open={!!unitId} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="unit-dialog-title">
    <DialogTitle id="unit-dialog-title" sx={{ pr: 7 }}>{unit ? `Unit ${String(unit.order).padStart(2, "0")} · ${unit.title}` : "Chi tiết unit"}
      <IconButton onClick={onClose} aria-label="Đóng chi tiết unit" sx={{ position: "absolute", right: 12, top: 12 }}><Icon name="close"/></IconButton>
    </DialogTitle>
    <DialogContent>
      {error ? <Alert severity="error" action={<Button onClick={() => setAttempt(n => n + 1)}>Thử lại</Button>}>{error}</Alert> : !unit ? <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress aria-label="Đang tải chi tiết unit"/></Box> : <>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{unit.description}</Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}><Typography variant="body2">{unit.completedLessons}/{unit.totalLessons} bài hoàn thành</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{percent(unit.completedLessons, unit.totalLessons)}%</Typography></Stack>
        <LinearProgress variant="determinate" value={percent(unit.completedLessons, unit.totalLessons)} aria-label="Tiến độ unit"/>
        <Typography component="h3" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Sau unit này, bạn có thể</Typography>
        <Box component="ul" sx={{ pl: 2.5, mt: 0, color: "text.secondary" }}>{unit.objectives.map(goal => <li key={goal}><Typography sx={{ mb: .5 }}>{goal}</Typography></li>)}</Box>
        <Divider sx={{ my: 3 }}/>
        <Typography component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>Nội dung bài học</Typography>
        <Stack spacing={1}>{unit.lessons.map((lesson, i) => <Stack key={lesson.id} direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Box sx={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: lesson.completed ? "#e5f5ed" : "#eef3f9", color: lesson.completed ? "success.main" : "text.secondary" }}>{lesson.completed ? <Icon name="check" fontSize="small"/> : i + 1}</Box>
          <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{lesson.title}</Typography><Typography variant="body2" color="text.secondary">{lesson.type} · {lesson.minutes} phút</Typography></Box>
          <Chip size="small" variant="outlined" label={lesson.completed ? "Đã học" : "Chưa học"} color={lesson.completed ? "success" : "default"}/>
        </Stack>)}</Stack>
      </>}
    </DialogContent>
  </Dialog>;
}
