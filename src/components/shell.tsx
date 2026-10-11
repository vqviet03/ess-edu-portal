'use client';
import { useState } from 'react';
import { useStore } from 'react-redux';
import Menu from '@mui/material/Menu';
import NextLink from 'next/link';
import {ProfileAvatar} from '@/features/profile/avatar';
import IconButton from '@mui/material/IconButton';
import { Box, Container, MenuItem, Stack, Typography } from './ui';
import { AppScale, DisplayTools, GuideLayout, useAppDisplay } from '@/features/help/display';
import Brand from './brand';
import { NotificationBell } from '@/features/notifications/bell';
import Tooltip from '@mui/material/Tooltip';
import Language from '@mui/icons-material/Language';
import BrightnessAuto from '@mui/icons-material/BrightnessAuto';
import { useAppearance } from './providers';
import { type RootState, useAppDispatch, useAppSelector } from '@/store';
import { loggedOut } from '@/store/auth';
import { useLogoutMutation } from '@/api/api';
import { useApplicationName } from '@/features/settings/hooks';
export default function Shell({children}: {children: React.ReactNode}) {
  const appName = useApplicationName();
  const [menu, setMenu] = useState<{kind: 'theme' | 'language' | 'profile'; anchor: HTMLElement} | null>(null);
  const { zoom } = useAppDisplay();
  const appearance = useAppearance();
  const student = useAppSelector(s => s.auth.student);
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [logout, logoutState] = useLogoutMutation();
  async function signOut() {
    setMenu(null);
    const token = store.getState().auth.accessToken;
    try { await logout().unwrap(); } catch { /* Local logout still works when the backend is unavailable. */ }
    finally { if (store.getState().auth.accessToken === token) dispatch(loggedOut()); }
  }
  return <AppScale><Container maxWidth={false} sx={{maxWidth: 1280 / (zoom / 100), px: {xs: 2.5, md: 3}, pb: 5}}>
    <Stack component="header" direction="row" sx={{alignItems: 'center', justifyContent: 'space-between', py: 2.5, gap: 1, flexWrap: 'wrap'}}>
      <Brand name={appName}/>
      <Stack direction="row" sx={{alignItems: 'center', flexWrap: 'wrap'}}><DisplayTools/>
        <Tooltip title="Ngôn ngữ"><IconButton aria-label="Ngôn ngữ" onClick={e => setMenu({kind: 'language', anchor: e.currentTarget})}><Language fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Giao diện"><IconButton aria-label="Giao diện" onClick={e => setMenu({kind: 'theme', anchor: e.currentTarget})}><BrightnessAuto fontSize="small" /></IconButton></Tooltip>{student && <NotificationBell/>}
        {student && <Tooltip title="Tài khoản"><IconButton aria-label="Tài khoản" disabled={logoutState.isLoading} onClick={e => setMenu({kind: 'profile', anchor: e.currentTarget})}><ProfileAvatar name={student.fullName} value={student.avatar} size={30}/></IconButton></Tooltip>}
      </Stack>
    </Stack>
    <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
      {menu?.kind === 'theme' && (['light', 'dark', 'system'] as const).map((mode, i) => <MenuItem key={mode} selected={appearance.preference === mode} onClick={() => {appearance.change(mode); setMenu(null);}}>{['Sáng', 'Tối', 'Theo hệ thống'][i]}</MenuItem>)}
      {menu?.kind === 'language' && <MenuItem selected onClick={() => setMenu(null)}>Tiếng Việt</MenuItem>}
      {menu?.kind === 'profile' && <MenuItem component={NextLink} href="/profile/" onClick={()=>setMenu(null)}>Hồ sơ cá nhân</MenuItem>}
      {menu?.kind === 'profile' && <MenuItem disabled={logoutState.isLoading} onClick={signOut}>Đăng xuất</MenuItem>}
    </Menu>
    <GuideLayout><Box component="main">{children}</Box></GuideLayout>
    <Typography component="footer" variant="body2" color="text.secondary" sx={{mt: 4, textAlign: 'center', overflowWrap: 'anywhere'}}>{appName} · Báo cáo học tập của học sinh</Typography>
  </Container></AppScale>;
}
