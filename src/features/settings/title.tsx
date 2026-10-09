'use client';
import { useApplicationName } from './hooks';

export function ApplicationTitle() {
  const name = useApplicationName();
  return <title>{`${name} · Báo cáo học tập`}</title>;
}
