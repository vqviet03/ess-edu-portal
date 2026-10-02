"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import Brand from "@/components/brand";
import Icon from "@/components/icon";
import { api, isMockApi, session } from "@/lib/api";
import { DEMO } from "@/lib/api/mock";
export default function Home() {
    const router = useRouter();
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => { if (session.get())
        router.replace("/dashboard/"); }, [router]);
    async function login(id: string, pass: string) {
        setBusy(true);
        setError("");
        try {
            const result = await api.login(id.trim(), pass);
            session.save(result.token);
            router.push("/dashboard/");
        }
        catch (error) {
            setError(error instanceof Error ? error.message : "Không thể đăng nhập.");
            setBusy(false);
        }
    }
    function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void login(studentId, password); }
    return <Box sx={{ minHeight: "100dvh", bgcolor: "white", display: "flex", flexDirection: "column" }}>
    <Container maxWidth="lg" sx={{ py: 3 }}><Brand /></Container>
    <Container maxWidth="lg" sx={{ flex: 1, display: "grid", alignItems: "center", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: { xs: 4, md: 10 }, py: { xs: 4, md: 7 } }}>
      <Box sx={{ maxWidth: 510 }}>
        <Chip label="CỔNG HỌC SINH" sx={{ color: "primary.dark", bgcolor: "#edf5ff", mb: 3, letterSpacing: ".09em" }}/>
        <Typography component="h1" variant="h3" sx={{ fontSize: { xs: "2.6rem", md: "3.7rem" }, lineHeight: 1.15 }}>Mỗi unit,<br />một bước <Box component="span" sx={{ color: "primary.main" }}>tiến xa.</Box></Typography>
        <Typography color="text.secondary" sx={{ mt: 2.5, maxWidth: 390, lineHeight: 1.8 }}>Đăng nhập để xem lộ trình, theo dõi tiến độ và khám phá nội dung học của bạn.</Typography>
        <Paper variant="outlined" sx={{ mt: 4, p: 2.5, bgcolor: "#f7faff", maxWidth: 390 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box sx={{ p: 1.2, bgcolor: "#e4efff", color: "primary.main", borderRadius: 2, display: "flex" }}><Icon name="book"/></Box>
            <Box><Typography sx={{ fontWeight: 700 }}>Hành trình học của bạn</Typography><Typography variant="body2" color="text.secondary">Từng bài học, từng bước tiến.</Typography></Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2.5 }} aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(n => <Box key={n} sx={{ flex: 1, height: 7, borderRadius: 3, bgcolor: n <= 2 ? "primary.main" : n === 3 ? "#8ebdf5" : "#e0e8f3" }}/>)}</Stack>
        </Paper>
      </Box>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4.5 }, width: "100%", maxWidth: 460, justifySelf: { xs: "start", md: "end" }, boxShadow: "0 12px 50px #15345708" }}>
        <Typography component="h2" variant="h5">Chào mừng trở lại</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Sử dụng ID học sinh và mật khẩu được cấp.</Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="ID học sinh" placeholder="Ví dụ: HS001" name="studentId" autoComplete="username" required fullWidth value={studentId} onChange={e => setStudentId(e.target.value)} disabled={busy}/>
            <TextField label="Mật khẩu tạm" type="password" name="password" autoComplete="current-password" required fullWidth value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/>
            <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit"/> : undefined}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
          </Stack>
        </Box>
        {isMockApi && <><Divider sx={{ my: 3 }}/><Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Tài khoản thử: <strong>HS001 / demo123</strong></Typography>
          <Button variant="outlined" fullWidth disabled={busy} onClick={() => { setStudentId(DEMO.studentId); setPassword(DEMO.password); void login(DEMO.studentId, DEMO.password); }}>Vào xem bản demo</Button></>}
      </Paper>
    </Container>
    <Container maxWidth="lg" sx={{ py: 2.5 }}><Typography variant="body2" color="text.secondary">Lớp học · Cổng thông tin học sinh {isMockApi && "· Dữ liệu minh họa"}</Typography></Container>
  </Box>;
}
