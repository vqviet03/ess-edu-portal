"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Container, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import Brand from "@/components/brand";
import Icon from "@/components/icon";
import UnitDetail from "@/components/unit-detail";
import { api, isMockApi, session } from "@/lib/api";
import { ApiError, percent, type Student, type UnitSummary } from "@/lib/api/types";
export default function Dashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [units, setUnits] = useState<UnitSummary[]>([]);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const logout = useCallback(() => { session.clear(); router.replace("/"); }, [router]);
    useEffect(() => {
        const auth = session.get();
        if (!auth) {
            router.replace("/");
            return;
        }
        setToken(auth);
        setLoading(true);
        setError("");
        const controller = new AbortController();
        Promise.all([api.getStudent(auth, controller.signal), api.getUnits(auth, controller.signal)]).then(([profile, data]) => {
            setStudent(profile);
            setUnits([...data].sort((a, b) => a.order - b.order));
        }).catch(error => {
            if (controller.signal.aborted)
                return;
            if (error instanceof ApiError && error.status === 401) {
                logout();
                return;
            }
            setError(error instanceof Error ? error.message : "Không tải được dữ liệu.");
        }).finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [router, logout, attempt]);
    const done = units.reduce((n, unit) => n + unit.completedLessons, 0);
    const total = units.reduce((n, unit) => n + unit.totalLessons, 0);
    const completedUnits = units.filter(unit => unit.totalLessons > 0 && unit.completedLessons >= unit.totalLessons).length;
    const next = units.find(unit => unit.completedLessons < unit.totalLessons);
    const progress = percent(done, total);
    return <Box sx={{ minHeight: "100dvh" }}>
    <Box component="header" sx={{ bgcolor: "white", borderBottom: "1px solid", borderColor: "divider" }}><Container maxWidth="lg"><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", py: 2 }}>
      <Brand /><Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "center" }}>{isMockApi && <Chip label="Bản demo" size="small" variant="outlined" sx={{ display: { xs: "none", sm: "flex" } }}/>}
        {student && <Avatar sx={{ bgcolor: "#e8f1ff", color: "primary.main", width: 36, height: 36, fontSize: ".9rem", fontWeight: 700 }}>{student.name.split(" ").slice(-2).map(part => part[0]).join("")}</Avatar>}
        <Button color="inherit" startIcon={<Icon name="logout" fontSize="small"/>} onClick={logout}>Đăng xuất</Button></Stack>
    </Stack></Container></Box>
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {loading ? <Box sx={{ py: 12, textAlign: "center" }}><CircularProgress aria-label="Đang tải dashboard"/><Typography color="text.secondary" sx={{ mt: 2 }}>Đang tải hành trình học…</Typography></Box> : error ? <Alert severity="error" action={<Button onClick={() => setAttempt(n => n + 1)}>Thử lại</Button>}>{error}</Alert> : student && <>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2.5, color: "text.secondary" }}><Icon name="grid" sx={{ fontSize: 18 }}/><Typography variant="body2">Tổng quan học tập</Typography></Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "start", sm: "center" }, mb: 3.5 }}>
          <Box><Typography variant="h4" component="h1" sx={{ fontSize: { xs: "1.85rem", sm: "2.25rem" } }}>Chào {student.name.split(" ").slice(-2).join(" ")}!</Typography><Typography color="text.secondary" sx={{ mt: .8 }}>Cùng tiếp tục hành trình học hôm nay.</Typography></Box>
          <Box sx={{ textAlign: { sm: "right" } }}><Typography sx={{ fontWeight: 600 }}>{student.courseName}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{student.className} · {student.id}</Typography></Box>
        </Stack>
        <Paper sx={{ p: { xs: 3, sm: 4 }, bgcolor: "#152f51", color: "white", borderRadius: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" }, gap: 4 }}>
            <Box><Typography sx={{ color: "#c0d3ec", mb: 1 }}>Tiến độ toàn khóa</Typography><Typography sx={{ fontSize: "3rem", fontWeight: 750, lineHeight: 1.2 }}>{progress}<Box component="span" sx={{ fontSize: "1.5rem", color: "#b6d3fa", ml: .5 }}>%</Box></Typography>
              <LinearProgress variant="determinate" value={progress} aria-label="Tiến độ toàn khóa" sx={{ mt: 2.5, bgcolor: "#ffffff20", "& .MuiLinearProgress-bar": { bgcolor: "#82bbff" } }}/>
              <Typography variant="body2" sx={{ mt: 1.5, color: "#c0d3ec" }}>{done} / {total} bài học đã hoàn thành</Typography>
            </Box>
            <Stack direction="row" spacing={4} sx={{ alignItems: "center", justifyContent: { xs: "start", sm: "center" }, borderLeft: { sm: "1px solid #ffffff25" }, pl: { sm: 4 } }}>
              <Box><Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>{completedUnits}<Box component="span" sx={{ color: "#b0c5df", fontSize: "1.1rem" }}> / {units.length}</Box></Typography><Typography variant="body2" sx={{ color: "#c0d3ec" }}>Unit hoàn thành</Typography></Box>
              <Box><Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>{Math.max(0, total - done)}</Typography><Typography variant="body2" sx={{ color: "#c0d3ec" }}>Bài học còn lại</Typography></Box>
            </Stack>
          </Box>
        </Paper>
        {next && <Paper variant="outlined" sx={{ mt: 3, p: 2.5, borderColor: "#cee1fb", bgcolor: "#eef5ff" }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "start", sm: "center" } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}><Box sx={{ bgcolor: "white", p: 1.5, borderRadius: 2, color: "primary.main", display: "flex" }}><Icon name="play"/></Box><Box><Typography variant="body2" color="text.secondary">Unit tiếp theo của bạn</Typography><Typography sx={{ fontWeight: 700, mt: .4 }}>Unit {String(next.order).padStart(2, "0")} · {next.title}</Typography></Box></Stack>
          <Button variant="contained" onClick={() => setSelected(next.id)}>Xem nội dung unit</Button>
        </Stack></Paper>}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 4.5, mb: 2.5 }}><Typography component="h2" variant="h5">Lộ trình học</Typography><Typography variant="body2" color="text.secondary">{units.length} unit</Typography></Stack>
        {!units.length ? <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}><Typography>Chưa có unit nào được giao.</Typography></Paper> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {units.map(unit => {
                    const value = percent(unit.completedLessons, unit.totalLessons);
                    const completed = unit.totalLessons > 0 && unit.completedLessons >= unit.totalLessons;
                    const started = unit.completedLessons > 0;
                    return <Paper key={unit.id} component="article" variant="outlined" sx={{ p: 2.75, display: "flex", flexDirection: "column", borderColor: unit.id === next?.id ? "#8ebbf2" : "divider", transition: "box-shadow .2s", "&:hover": { boxShadow: "0 6px 20px #152f510b" } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: ".06em", color: "text.secondary" }}>UNIT {String(unit.order).padStart(2, "0")}</Typography><Chip label={completed ? "Hoàn thành" : started ? "Đang học" : "Chưa bắt đầu"} size="small" sx={{ color: completed ? "#187250" : started ? "#145bb6" : "#576b83", bgcolor: completed ? "#e8f5ee" : started ? "#eaf2fe" : "#f0f3f7" }}/></Stack>
              <Typography component="h3" variant="h6" sx={{ mt: 2 }}>{unit.title}</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 2.5, flex: 1, lineHeight: 1.65 }}>{unit.description}</Typography>
              <Stack direction="row" spacing={.7} sx={{ alignItems: "center", mb: 2, color: "text.secondary" }}><Icon name="clock" sx={{ fontSize: 17 }}/><Typography variant="body2">{unit.totalLessons} bài học · {unit.minutes} phút</Typography></Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}><Typography variant="body2" color="text.secondary">{unit.completedLessons}/{unit.totalLessons} bài</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{value}%</Typography></Stack>
              <LinearProgress variant="determinate" value={value} color={completed ? "success" : "primary"} aria-label={`Tiến độ unit ${unit.order}`}/>
              <Button variant="outlined" fullWidth sx={{ mt: 2.5, borderColor: "divider" }} onClick={() => setSelected(unit.id)} aria-label={`Xem chi tiết unit ${unit.order}: ${unit.title}`}>Xem chi tiết</Button>
            </Paper>;
                })}
        </Box>}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>{isMockApi ? "Bạn đang xem dữ liệu minh họa. Tiến độ trong bản demo không thay đổi." : "Tiến độ được cập nhật từ hệ thống học tập."}</Typography>
      </>}
    </Container>
    {token && <UnitDetail unitId={selected} token={token} onClose={() => setSelected(null)} onUnauthorized={logout}/>}
  </Box>;
}
