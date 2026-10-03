import { createApi } from '@reduxjs/toolkit/query/react';
import type { Access, AuthSession, Class, Envelope, Material, ProgressEntry, Report, Student, Unit } from '../models';
import { createAppBaseQuery } from './base-query';
const unwrap = <T>(response: Envelope<T>) => response.data;
const list = <T>(response: Envelope<{items: T[]}>) => response.data.items;
const path = (id: string) => `/me/classes/${encodeURIComponent(id)}`;
export const api = createApi({
  reducerPath: 'studentApi', baseQuery: createAppBaseQuery(process.env.NEXT_PUBLIC_API_MODE ?? 'mock', process.env.NEXT_PUBLIC_API_BASE_URL),
  keepUnusedDataFor: 60,
  endpoints: build => ({
    login: build.mutation<AuthSession, {studentId: string; password: string}>({ query: body => ({url: '/auth/login', method: 'POST', body}), transformResponse: unwrap<AuthSession> }),
    exchange: build.mutation<AuthSession, {code: string}>({ query: body => ({url: '/auth/exchange', method: 'POST', body}), transformResponse: unwrap<AuthSession> }),
    me: build.query<Student, void>({query: () => '/me', transformResponse: unwrap<Student>}),
    classes: build.query<Class[], void>({query: () => '/me/classes', transformResponse: list<Class>}),
    units: build.query<Unit[], string>({query: id => `${path(id)}/units`, transformResponse: list<Unit>}),
    report: build.query<Report, {classId: string; unitId: string}>({query: ({classId, unitId}) => `${path(classId)}/units/${encodeURIComponent(unitId)}/report`, transformResponse: unwrap<Report>}),
    progress: build.query<ProgressEntry[], string>({query: id => `${path(id)}/progress`, transformResponse: (res: Envelope<{items: ProgressEntry[]}>) => [...res.data.items].sort((a,b) => a.unitOrder - b.unitOrder)}),
    materials: build.query<Material[], string>({query: id => `${path(id)}/materials`, transformResponse: list<Material>}),
    materialAccess: build.mutation<Access, {classId: string; materialId: string}>({query: ({classId, materialId}) => ({url: `${path(classId)}/materials/${encodeURIComponent(materialId)}/access`, method: 'POST'}), transformResponse: unwrap<Access>}),
  }),
});
export const { useLoginMutation, useExchangeMutation, useMeQuery, useClassesQuery, useUnitsQuery, useReportQuery, useProgressQuery, useMaterialsQuery, useMaterialAccessMutation } = api;
