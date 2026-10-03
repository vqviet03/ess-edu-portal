import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, Student } from '../models';
export interface AuthState { status: 'booting' | 'validating' | 'authenticated' | 'guest'; accessToken: string | null; expiresAt: string | null; student: Student | null; classId: string | null; unitId: string | null; reason: string | null }
const initialState: AuthState = { status: 'booting', accessToken: null, expiresAt: null, student: null, classId: null, unitId: null, reason: null };
const slice = createSlice({ name: 'auth', initialState, reducers: {
  restore(state, action: PayloadAction<AuthSession | null>) { return action.payload ? { ...initialState, ...action.payload, status: 'validating' } : { ...initialState, status: 'guest' }; },
  signedIn(state, action: PayloadAction<AuthSession>) { return { ...initialState, ...action.payload, status: 'authenticated' }; },
  validated(state, action: PayloadAction<Student>) { if (state.status === 'validating') { state.student = action.payload; state.status = 'authenticated'; } },
  loggedOut(state, action: PayloadAction<string | undefined>) { return { ...initialState, status: 'guest', reason: action.payload ?? null }; },
  chooseClass(state, action: PayloadAction<string>) { state.classId = action.payload; state.unitId = null; },
  chooseUnit(state, action: PayloadAction<string>) { state.unitId = action.payload; },
}});
export const { restore, signedIn, validated, loggedOut, chooseClass, chooseUnit } = slice.actions;
export default slice.reducer;
