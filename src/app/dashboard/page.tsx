'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Feedback } from '@/components/feedback';
export default function LegacyDashboard() { const router = useRouter(); useEffect(() => {router.replace('/home/');}, [router]); return <Feedback loading/>; }
