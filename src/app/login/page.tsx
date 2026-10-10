'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import InputAdornment from '@mui/material/InputAdornment';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@/components/ui';
import Shell from '@/components/shell';
import { useLoginMutation } from '@/api/api';
import { errorDetails } from '@/api/errors';
import { useAppDispatch, useAppSelector } from '@/store';
import { signedIn } from '@/store/auth';
export default function Login() {
  const [id, setId] = useState(''); const [password, setPassword] = useState(''); const [visible, setVisible] = useState(false);
  const [login, result] = useLoginMutation();
  const auth = useAppSelector(s => s.auth); const dispatch = useAppDispatch(); const router = useRouter();
  useEffect(() => { if (auth.status === 'authenticated') router.replace('/home/'); }, [auth.status, router]);
  const error = result.error ? errorDetails(result.error) : null;
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); try { const data = await login({studentId: id.trim(), password}).unwrap(); setPassword(''); dispatch(signedIn(data)); router.replace('/home/'); } catch {} }
  return <Shell><Box sx={{minHeight: '70dvh', display: 'grid', placeItems: 'center'}}><Paper sx={{p: {xs: 3, sm: 4}, width: '100%', maxWidth: 440}}>
    <Typography variant="h4" component="h1">Chào mừng trở lại</Typography><Typography color="text.secondary" sx={{mt: 1, mb: 3}}>Đăng nhập để theo dõi kết quả học tập.</Typography>
    <Stack component="form" spacing={2.5} onSubmit={submit}>
      {auth.reason && <Alert severity="info">{auth.reason}</Alert>}
      {error && <Alert severity="error">{error.message}</Alert>}
      <TextField label="ID học sinh / email / số điện thoại" autoComplete="username" value={id} onChange={e => setId(e.target.value)} required disabled={result.isLoading} error={!!error?.fieldErrors?.studentId} helperText={error?.fieldErrors?.studentId}/>
      <TextField label="Mật khẩu" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={result.isLoading} error={!!error?.fieldErrors?.password} helperText={error?.fieldErrors?.password} slotProps={{input: {endAdornment: <InputAdornment position="end"><Button aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(v => !v)} sx={{minWidth: 44}}>{visible ? 'Ẩn' : 'Hiện'}</Button></InputAdornment>}}}/>
      <Button type="submit" variant="contained" size="large" disabled={result.isLoading} startIcon={result.isLoading ? <CircularProgress size={18} color="inherit"/> : undefined}>{result.isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
    </Stack>
  </Paper></Box></Shell>;
}
