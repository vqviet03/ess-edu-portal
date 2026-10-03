'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Feedback } from '@/components/feedback';
import { Guard } from '@/auth/runtime';
export default function Index() {
  const status = useAppSelector(s => s.auth.status);
  const router = useRouter();
  useEffect(() => { if (status === 'authenticated') router.replace('/home/'); else if (status === 'guest') router.replace('/login/'); }, [status, router]);
  return <Guard><Feedback loading/></Guard>;
}
