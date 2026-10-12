'use client';
import {NotificationToast} from "@/features/notifications/toast";
import {UnsavedRuntime} from '@/shared/unsaved';
import {StudentRealtime} from './realtime';
import { createContext, useContext, useEffect } from 'react';
import {loginRedirect} from "@/shared/auth-navigation";
import { useRouter } from 'next/navigation';
import { useStore } from 'react-redux';
import { type RootState, useAppDispatch, useAppSelector } from '@/store';
import { loggedOut, restore, validated } from '@/store/auth';
import { api, useMeQuery } from '@/api/api';
import { SESSION_KEY, expired, expiryTime, readSession, writeSession } from './session';
import { Feedback } from '@/components/feedback';
const CheckContext = createContext<{error: unknown; retry: () => void}>({error: null, retry: () => {}});
export function AuthRuntime({children}: {children: React.ReactNode}) {
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(s => s.auth);
  const me = useMeQuery(undefined, {skip: auth.status !== 'validating'});
  useEffect(() => { if (store.getState().auth.status !== 'booting') return; const saved = readSession(); if (!saved) writeSession(null); dispatch(restore(saved)); }, [dispatch, store]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if ((event.key !== null && event.key !== SESSION_KEY) || event.storageArea !== localStorage) return;
      const session = readSession();
      if (store.getState().auth.accessToken === (session?.accessToken ?? null)) return;
      dispatch(restore(session));
      dispatch(api.util.resetApiState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch, store]);
  useEffect(() => { if (me.currentData && auth.status === 'validating') dispatch(validated(me.currentData)); }, [me.currentData, auth.status, dispatch]);
  useEffect(() => {
    if (!auth.accessToken) return;
    if (expired(auth.expiresAt, auth.accessToken)) { dispatch(loggedOut('Phiên đăng nhập đã hết hạn.')); return; }
    let timer: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      const remaining = expiryTime(auth.expiresAt, auth.accessToken) - Date.now();
      if (remaining <= 0) dispatch(loggedOut('Phiên đăng nhập đã hết hạn.'));
      else timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    };
    checkExpiry();
    return () => clearTimeout(timer);
  }, [auth.accessToken, auth.expiresAt, dispatch]);
  return <CheckContext.Provider value={{error: me.error, retry: me.refetch}}><UnsavedRuntime/><StudentRealtime/><NotificationToast key={auth.student?.id??"guest"}/>{children}</CheckContext.Provider>;
}
export function Guard({children}: {children: React.ReactNode}) {
  const status = useAppSelector(s => s.auth.status);
  const check = useContext(CheckContext);
  const router = useRouter();
  useEffect(() => { if (status === 'guest') router.replace(loginRedirect(location.pathname + location.search + location.hash, process.env.NEXT_PUBLIC_BASE_PATH)); }, [status, router]);
  if (status === 'validating' && check.error) return <Feedback error={check.error} retry={check.retry}/>;
  if (status !== 'authenticated') return <Feedback loading/>;
  return children;
}
