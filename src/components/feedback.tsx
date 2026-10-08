'use client';
import { Alert, Box, Button, CircularProgress, Typography } from './ui';
import { errorDetails } from '@/api/errors';
export function Feedback({loading, error, retry, empty}: {loading?: boolean; error?: unknown; retry?: () => void; empty?: string}) {
  if (error) return <Alert severity="error" sx={{my: 2}} action={retry ? <Button color="inherit" onClick={retry}>Thử lại</Button> : undefined}>{errorDetails(error).message}</Alert>;
  if (!loading && empty === undefined) return null;
  return <Box role="status" sx={{py: 5, px: 2, textAlign: 'center'}}>{loading ? <><CircularProgress size={28}/><Typography color="text.secondary" sx={{mt: 1}}>Đang tải…</Typography></> : <Typography color="text.secondary">{empty}</Typography>}</Box>;
}
