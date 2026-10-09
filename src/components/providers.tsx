'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { makeStore } from '@/store';
import { AppDisplayProvider } from '@/features/help/display';
import { AuthRuntime } from '@/auth/runtime';
import { ApplicationTitle } from '@/features/settings/title';
type Preference = 'light' | 'dark' | 'system';
const Appearance = createContext<{preference: Preference; change: (p: Preference) => void}>({preference: 'system', change: () => {}});
export const useAppearance = () => useContext(Appearance);
export default function Providers({children}: {children: React.ReactNode}) {
  const [store] = useState(() => makeStore());
  useEffect(() => setupListeners(store.dispatch), [store]);
  const [preference, setPreference] = useState<Preference>('system');
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  useEffect(() => { try { const value = localStorage.getItem('learnleaf.theme'); if (value === 'light' || value === 'dark' || value === 'system') setPreference(value); } catch {} }, []);
  const change = (value: Preference) => { setPreference(value); try { localStorage.setItem('learnleaf.theme', value); } catch {} };
  const mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createTheme({
    palette: {
      mode, action: {selected: mode === 'light' ? '#def1e3' : '#284937'}, primary: { main: mode === 'light' ? '#277751' : '#99d7b2', contrastText: mode === 'light' ? '#ffffff' : '#123321' },
      background: { default: mode === 'light' ? '#f2f7f3' : '#111d17', paper: mode === 'light' ? '#ffffff' : '#1b2c22' },
      text: { primary: mode === 'light' ? '#203c2c' : '#e1f0e5', secondary: mode === 'light' ? '#617568' : '#aec4b5' },
      divider: mode === 'light' ? '#dde8e0' : '#35493b', success: {main: mode === 'light' ? '#277751' : '#99d7b2'}, error: {main: mode === 'light' ? '#bb4264' : '#ffa9c3'},
    },
    typography: { fontFamily: 'Arial, Helvetica, sans-serif', h4: {fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.4}, h5: {fontSize: '1.25rem', fontWeight: 700}, h6: {fontSize: '1.125rem', fontWeight: 700}, body1: {lineHeight: 1.65}, button: {textTransform: 'none', fontWeight: 700} },
    shape: {borderRadius: 14},
    components: {
      MuiPaper: {defaultProps: {elevation: 0}, styleOverrides: {root: {backgroundImage: 'none'}}},
      MuiButton: {defaultProps: {disableElevation: true, size: 'small'}, styleOverrides: {root: {'@media (pointer: coarse)': {minHeight: 44}}}},
      MuiIconButton: {defaultProps:{size:'small'},styleOverrides:{root:{'@media (pointer: coarse)':{minWidth:44,minHeight:44}}}},
      MuiTextField: {defaultProps:{size:'small'}},
      MuiFormControl: {defaultProps:{size:'small'}},
      MuiInputBase: {defaultProps:{size:'small'}},
      MuiSelect: {defaultProps:{size:'small'}},
      MuiChip: {defaultProps:{size:'small'}},
      MuiMenuItem: {styleOverrides: {root: {'@media (pointer: coarse)': {minHeight: 44}}}},
      MuiTab: {styleOverrides: {root: {minHeight: 48, textTransform: 'none', fontSize: '0.9375rem', fontWeight: 600}}},
    },
  }), [mode]);
  return <Provider store={store}><ApplicationTitle/><Appearance.Provider value={{preference, change}}><ThemeProvider theme={theme}><CssBaseline/><AppDisplayProvider storageKey="ess.student.zoom"><AuthRuntime>{children}</AuthRuntime></AppDisplayProvider></ThemeProvider></Appearance.Provider></Provider>;
}
