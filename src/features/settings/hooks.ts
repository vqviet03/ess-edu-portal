'use client';
import { useApplicationSettingsQuery } from '@/api/api';

export function useApplicationName() {
  const query = useApplicationSettingsQuery();
  return query.data?.portals?.student?.name?.trim() || query.data?.appName?.trim() || 'Cổng học sinh';
}
