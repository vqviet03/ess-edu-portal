'use client';
import {Suspense} from 'react';import {Guard} from '@/auth/runtime';import Shell from '@/components/shell';import {AssignmentPage} from '@/features/assignments/page';
export default function Page(){return <Guard><Suspense fallback={null}><Shell><AssignmentPage/></Shell></Suspense></Guard>;}
