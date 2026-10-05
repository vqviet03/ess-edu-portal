'use client';
import { useEffect } from 'react';
import NextLink from 'next/link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Guard } from '@/auth/runtime';
import Shell from '@/components/shell';
import { Box, Button, MenuItem, TextField, Typography } from '@/components/ui';
import { Feedback } from '@/components/feedback';
import { useClassesQuery, useUnitsQuery, useProgressQuery, useReportQuery } from '@/api/api';
import { useAppDispatch, useAppSelector } from '@/store';
import { chooseClass, chooseUnit } from '@/store/auth';
import { selectClass, selectUnit } from '@/models/report';
import ReportView from '@/features/report';
function HomeContent() {
  const auth = useAppSelector(s => s.auth); const dispatch = useAppDispatch();
  const classes = useClassesQuery();
  const classroom = selectClass(classes.currentData ?? [], auth.classId);
  const units = useUnitsQuery(classroom?.id ?? '', {skip: !classroom});
  const unit = selectUnit(units.currentData ?? [], auth.unitId);
  useEffect(() => { if (classroom && auth.classId !== classroom.id) dispatch(chooseClass(classroom.id)); }, [classroom, auth.classId, dispatch]);
  useEffect(() => { if (unit && auth.unitId !== unit.id) dispatch(chooseUnit(unit.id)); }, [unit, auth.unitId, dispatch]);
  const report = useReportQuery({classId: classroom?.id ?? '', unitId: unit?.id ?? ''}, {skip: !classroom || !unit?.hasReport, pollingInterval: 30000, skipPollingIfUnfocused: true});
  const progress = useProgressQuery(classroom?.id ?? '', {skip: !classroom});
  const entries = progress.currentData ?? [];
  return <Shell>
    <Typography variant="h4" component="h1">Báo cáo kết quả học tập</Typography>
    <Typography color="text.secondary" sx={{mt: 1}}>{classroom?.subject ?? 'Học sinh'} · {auth.student?.fullName}{auth.student?.nickname ? ` (${auth.student.nickname})` : ''}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{mb: 2.5}}>Unit hiện tại: {unit?.order ?? '—'} · Ngày kiểm tra: {report.currentData?.testedAt ? new Date(report.currentData.testedAt).toLocaleDateString('vi-VN') : '--/--/----'}</Typography>
    {classes.isFetching ? <Feedback loading/> : classes.error ? <Feedback error={classes.error} retry={classes.refetch}/> : !classroom ? <Feedback empty="Chưa có lớp học nào."/> : <>
      <TextField select label="Lớp học" fullWidth value={classroom.id} onChange={e => dispatch(chooseClass(e.target.value))} sx={{bgcolor: 'background.paper', maxWidth: {md: 480}, mb: 2}}>{classes.currentData!.map(c => <MenuItem key={c.id} value={c.id}>{c.name}{c.isActive ? ' · Đang học' : ''}</MenuItem>)}</TextField>
      {units.isFetching ? <Feedback loading/> : units.error ? <Feedback error={units.error} retry={units.refetch}/> : unit ? <Tabs aria-label="Chọn Unit" value={unit.id} variant="scrollable" scrollButtons="auto" onChange={(_, id: string) => dispatch(chooseUnit(id))} sx={{mb: 2, '& .MuiTabs-indicator': {display: 'none'}, '& .MuiTab-root': {bgcolor: 'background.paper', borderRadius: 2, mr: 1, flex: {xs: 1, md: 'initial'}}, '& .Mui-selected': {bgcolor: 'action.selected', color: 'primary.main'}}}>{[...(units.currentData ?? [])].sort((a,b) => a.order - b.order).map(u => <Tab key={u.id} value={u.id} label={u.name} id={`tab-${u.id}`} aria-controls="unit-report"/>)}</Tabs> : <Feedback empty="Lớp này chưa có Unit học tập."/>}
      <Button component={NextLink} href={`/materials/?classId=${encodeURIComponent(classroom.id)}`} variant="contained" sx={{mb: 2.5}}>Tài liệu học tập</Button>
      <Box id="unit-report" role="tabpanel" aria-labelledby={unit ? `tab-${unit.id}` : undefined}>
        {unit && (report.isFetching ? <Feedback loading/> : !unit.hasReport ? <Feedback empty="Unit này chưa có báo cáo."/> : report.error ? <Feedback error={report.error} retry={report.refetch}/> : report.currentData ? <ReportView report={report.currentData} entries={entries} unitName={unit.name} progressLoading={progress.isFetching} progressError={progress.error} retryProgress={progress.refetch}/> : <Feedback empty="Chưa có báo cáo cho Unit này."/>)}
      </Box>
    </>}
  </Shell>;
}
export default function Home() { return <Guard><HomeContent/></Guard>; }
