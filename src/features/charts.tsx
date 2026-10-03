'use client';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Rectangle, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@/components/ui';
import { changes, percentage, skills } from '@/models/report';
import type { ProgressEntry } from '@/models';
export default function Charts({entries, deltas}: {entries: ProgressEntry[]; deltas: boolean}) {
  const theme = useTheme(); const tick = {fill: theme.palette.text.secondary, fontSize: 12};
  const tooltipStyle = {backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderColor: theme.palette.divider, borderRadius: 10};
  const data = entries.map(entry => ({name: entry.unitName, ...entry.skills}));
  if (!deltas) return <Box data-testid="skills-chart" sx={{height: 370, width: '100%', minWidth: 0}}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top: 12, right: 12, left: -20, bottom: 0}} accessibilityLayer>
    <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3"/><XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false}/><YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={n => `${n}%`} tick={tick} axisLine={false} tickLine={false}/>
    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [percentage(value == null ? null : Number(value)), name]}/><Legend wrapperStyle={{fontSize: 12, paddingTop: 14}} iconType="circle"/>
    {skills.map(skill => <Line key={skill.code} name={skill.label} dataKey={skill.code} type="monotone" stroke={skill.color} strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} connectNulls={false} isAnimationActive={false}/>)}
  </LineChart></ResponsiveContainer></Box>;
  return <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))'}, gap: 1.5}}>
    {[...skills, {code: 'total' as const, label: 'Tổng điểm', color: ''}].map(skill => {
      const values = changes(entries, skill.code); const limit = Math.max(80, ...values.map(v => Math.ceil(Math.abs(v.value ?? 0) / 20) * 20));
      return <Box data-testid="change-chart" key={skill.code} sx={{bgcolor: 'background.default', borderRadius: 2, p: 1.5, minWidth: 0}}><Typography sx={{fontWeight: 700, mb: 1}}>{skill.label}</Typography>{!values.length ? <Typography color="text.secondary">Cần ít nhất 2 Unit để so sánh.</Typography> : <Box sx={{height: 215}}><ResponsiveContainer width="100%" height="100%"><BarChart data={values} accessibilityLayer margin={{top: 20, right: 12, bottom: 0, left: -16}}>
        <CartesianGrid stroke={theme.palette.divider} vertical={false}/><XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false}/><YAxis domain={[-limit, limit]} ticks={[-limit, -limit / 2, 0, limit / 2, limit]} tickFormatter={n => `${n}%`} tick={tick} tickLine={false} axisLine={false}/><ReferenceLine y={0} stroke={theme.palette.text.secondary}/>
        <Tooltip contentStyle={tooltipStyle} formatter={value => [value == null ? 'Chưa có dữ liệu' : `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(1)} điểm phần trăm (tỷ lệ Unit sau − Unit trước)`, 'Thay đổi']}/>
        <Bar dataKey="value" shape={<Rectangle/>} maxBarSize={38} isAnimationActive={false}>{values.map((v, i) => <Cell key={i} fill={(v.value ?? 0) < 0 ? '#f16b95' : '#45c49a'}/>)}<LabelList dataKey="value" position="top" formatter={v => v == null ? '—' : `${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(1)}%`} fill={theme.palette.text.primary} fontSize={12}/></Bar>
      </BarChart></ResponsiveContainer></Box>}</Box>;
    })}
  </Box>;
}
