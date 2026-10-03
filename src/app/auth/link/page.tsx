'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Shell from '@/components/shell';
import { Alert, Button, Paper, Typography } from '@/components/ui';
import { Feedback } from '@/components/feedback';
import { useExchangeMutation } from '@/api/api';
import { errorDetails } from '@/api/errors';
import { consumeLinkCode } from '@/auth/session';
import { useAppDispatch } from '@/store';
import { loggedOut, signedIn } from '@/store/auth';
export default function LinkLogin() {
  const [exchange] = useExchangeMutation();
  const request = useRef<ReturnType<typeof exchange> | null>(null);
  const started = useRef(false); const [error, setError] = useState('');
  const dispatch = useAppDispatch(); const router = useRouter();
  useEffect(() => {
    let active = true;
    function watch(pending: ReturnType<typeof exchange> | null) {
      pending?.unwrap().then(data => { if (active && request.current === pending) { dispatch(signedIn(data)); router.replace('/home/'); } }).catch(e => { if (active && request.current === pending) setError(errorDetails(e).message); });
    }
    function begin() {
      const code = consumeLinkCode();
      setError('');
      dispatch(loggedOut());
      request.current = code ? exchange({code}) : null;
      if (!code) setError('Liên kết không có mã đăng nhập.');
      watch(request.current);
    }
    if (!started.current) { started.current = true; begin(); }
    else watch(request.current);
    window.addEventListener('hashchange', begin);
    return () => { active = false; window.removeEventListener('hashchange', begin); };
  }, [dispatch, exchange, router]);
  return <Shell><Paper sx={{maxWidth: 480, mx: 'auto', mt: 6, p: 3}}><Typography component="h1" variant="h5">Đăng nhập bằng liên kết</Typography>{error ? <><Alert severity="error" sx={{my: 3}}>{error}</Alert><Button component={NextLink} href="/login/" variant="contained">Về đăng nhập</Button></> : <Feedback loading/>}</Paper></Shell>;
}
