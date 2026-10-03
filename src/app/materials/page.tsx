'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@/components/ui';
import { Feedback } from '@/components/feedback';
import Shell from '@/components/shell';
import { Guard } from '@/auth/runtime';
import { expired } from '@/auth/session';
import { useClassesQuery, useMaterialsQuery, useMaterialAccessMutation } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/store';
import { chooseClass } from '@/store/auth';
import { selectClass } from '@/models/report';
import { errorDetails } from '@/api/errors';
import type { Access, Material } from '@/models';
function Materials() {
  const params = useSearchParams(); const selected = useAppSelector(s => s.auth.classId); const dispatch = useAppDispatch();
  const classes = useClassesQuery(); const requested = params.get('classId');
  const classroom = requested ? classes.currentData?.find(c => c.id === requested) : selectClass(classes.currentData ?? [], selected);
  const materials = useMaterialsQuery(classroom?.id ?? '', {skip: !classroom});
  const [access, state] = useMaterialAccessMutation(); const [view, setView] = useState<{material: Material; access: Access} | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (classroom && classroom.id !== selected) dispatch(chooseClass(classroom.id)); }, [classroom, selected, dispatch]);
  useEffect(() => { if (!view) return; const timer = setTimeout(() => {setView(null); setError('Liên kết tài liệu đã hết hạn. Vui lòng mở lại.');}, Math.max(0, Date.parse(view.access.expiresAt) - Date.now())); return () => clearTimeout(timer); }, [view]);
  async function open(material: Material) {
    if (!classroom) return; setError('');
    try { const value = await access({classId: classroom.id, materialId: material.id}).unwrap(); const url = new URL(value.url); if (url.protocol !== 'https:' || url.username || url.password || expired(value.expiresAt)) throw new Error('Liên kết tài liệu không hợp lệ hoặc đã hết hạn.'); setView({material, access: value}); } catch (e) {setError(e instanceof Error ? e.message : errorDetails(e).message);}
  }
  return <Shell><Button component={NextLink} href="/home/" sx={{mb: 2}}>Về báo cáo</Button><Typography component="h1" variant="h4">Tài liệu học tập</Typography><Typography color="text.secondary" sx={{my: 1}}>{classroom?.name ?? 'Tài liệu theo lớp học'}</Typography>
    {classes.isFetching ? <Feedback loading/> : classes.error ? <Feedback error={classes.error} retry={classes.refetch}/> : !classroom ? <Feedback empty="Không tìm thấy lớp học hoặc bạn chưa được cấp quyền."/> : materials.isFetching ? <Feedback loading/> : materials.error ? <Feedback error={materials.error} retry={materials.refetch}/> : !materials.currentData?.length ? <Feedback empty="Lớp này chưa có tài liệu."/> : <Stack spacing={2} sx={{mt: 3}}>{materials.currentData.map(material => <Paper key={material.id} sx={{p: 2.5}}><Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{justifyContent: 'space-between', alignItems: {sm: 'center'}}}><Box><Chip label={material.type.toUpperCase()} size="small" sx={{mb: 1}}/><Typography sx={{fontWeight: 700}}>{material.title}</Typography><Typography variant="body2" color="text.secondary">{material.sizeBytes === null ? 'Chưa có dung lượng' : `${Math.ceil(material.sizeBytes / 1024)} KB`}{material.durationSeconds !== null ? ` · ${material.durationSeconds} giây` : ''}</Typography></Box><Button variant="outlined" disabled={state.isLoading} onClick={() => open(material)}>{state.isLoading && state.originalArgs?.materialId === material.id ? 'Đang mở…' : ['audio', 'video'].includes(material.type) ? 'Phát tài liệu' : 'Mở tài liệu'}</Button></Stack></Paper>)}</Stack>}
    {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
    <Dialog open={!!view} onClose={() => setView(null)} fullWidth maxWidth="md" aria-labelledby="material-title"><DialogTitle id="material-title">{view?.material.title}</DialogTitle><DialogContent>
      {view?.material.type === 'audio' && <Box component="audio" controls src={view.access.url} sx={{width: '100%'}}/>}
      {view?.material.type === 'video' && <Box component="video" controls src={view.access.url} sx={{width: '100%', maxHeight: '60vh'}}/>}
      {view?.material.type === 'pdf' && <Box component="iframe" title={view.material.title} src={view.access.url} sx={{width: '100%', height: '60vh', border: 0}}/>}
      {view && <Button href={view.access.url} target="_blank" rel="noopener noreferrer" sx={{mt: 2}}>Mở trong tab mới</Button>}
    </DialogContent><DialogActions><Button onClick={() => setView(null)}>Đóng</Button></DialogActions></Dialog>
  </Shell>;
}
export default function MaterialsPage() { return <Guard><Suspense fallback={<Feedback loading/>}><Materials/></Suspense></Guard>; }
