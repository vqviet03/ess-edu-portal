'use client';
import { useState } from 'react';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { Box, Button, Container, MenuItem, Stack, Typography } from './ui';
import Brand from './brand';
import { useAppearance } from './providers';
import { useAppDispatch, useAppSelector } from '@/store';
import { loggedOut } from '@/store/auth';
export default function Shell({children}: {children: React.ReactNode}) {
  const [menu, setMenu] = useState<{kind: 'theme' | 'language' | 'profile'; anchor: HTMLElement} | null>(null);
  const appearance = useAppearance();
  const student = useAppSelector(s => s.auth.student);
  const dispatch = useAppDispatch();
  return <Container maxWidth="lg" sx={{px: {xs: 2.5, md: 3}, pb: 5}}>
    <Stack component="header" direction="row" sx={{alignItems: 'center', justifyContent: 'space-between', py: 2.5, gap: 1}}>
      <Brand/>
      <Stack direction="row" sx={{alignItems: 'center'}}>
        <Button aria-label="Ngôn ngữ" color="inherit" sx={{minWidth: 44}} onClick={e => setMenu({kind: 'language', anchor: e.currentTarget})}>VI</Button>
        <IconButton aria-label="Giao diện" onClick={e => setMenu({kind: 'theme', anchor: e.currentTarget})}><Box component="span" aria-hidden sx={{fontSize: 25}}>☼</Box></IconButton>
        {student && <IconButton aria-label="Tài khoản" onClick={e => setMenu({kind: 'profile', anchor: e.currentTarget})}><Avatar sx={{width: 30, height: 30, fontSize: 13, bgcolor: 'action.selected', color: 'primary.main'}}>HV</Avatar></IconButton>}
      </Stack>
    </Stack>
    <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
      {menu?.kind === 'theme' && (['light', 'dark', 'system'] as const).map((mode, i) => <MenuItem key={mode} selected={appearance.preference === mode} onClick={() => {appearance.change(mode); setMenu(null);}}>{['Sáng', 'Tối', 'Theo hệ thống'][i]}</MenuItem>)}
      {menu?.kind === 'language' && <MenuItem selected onClick={() => setMenu(null)}>Tiếng Việt</MenuItem>}
      {menu?.kind === 'profile' && <MenuItem onClick={() => {setMenu(null); dispatch(loggedOut());}}>Đăng xuất</MenuItem>}
    </Menu>
    <Box component="main">{children}</Box>
    <Typography variant="body2" color="text.secondary" sx={{mt: 4, textAlign: 'center'}}>LearnLeaf · Báo cáo học tập của học sinh</Typography>
  </Container>;
}
