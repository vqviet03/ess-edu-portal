import { createApi } from '@reduxjs/toolkit/query/react';
import type { Access, AuthSession, Class, Envelope, Material, ProgressEntry, Report, Student, Unit } from '../models';
import { createAppBaseQuery } from './base-query';
import { apiConfiguration, type ApiConfiguration } from './config';
const unwrap = <T>(response: Envelope<T>) => response.data;
const list = <T>(response: Envelope<{items: T[]}>) => response.data.items;
const path = (id: string) => `/me/classes/${encodeURIComponent(id)}`;
export const createStudentApi = (config: ApiConfiguration = apiConfiguration) => createApi({
  reducerPath: 'studentApi', baseQuery: createAppBaseQuery(config.baseUrl, config.timeout),
  keepUnusedDataFor: 86400,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: ['Classes', 'Report', 'Units', 'Progress', 'Materials', 'Threads', 'Comments', 'Contacts', 'Notifications'],
  endpoints: build => ({
    login: build.mutation<AuthSession, {studentId: string; password: string}>({ query: body => ({url: '/auth/login', method: 'POST', body}), transformResponse: unwrap<AuthSession> }),
    exchange: build.mutation<AuthSession, {code: string}>({ query: body => ({url: '/auth/exchange', method: 'POST', body}), transformResponse: unwrap<AuthSession> }),
    logout: build.mutation<{loggedOut: boolean}, void>({ query: () => ({url: '/auth/logout', method: 'POST'}), transformResponse: unwrap<{loggedOut: boolean}> }),
    me: build.query<Student, void>({query: () => '/me', transformResponse: unwrap<Student>}),
    classes: build.query<Class[], void>({query: () => '/me/classes', transformResponse: list<Class>, providesTags: ['Classes']}),
    units: build.query<Unit[], string>({query: id => `${path(id)}/units`, transformResponse: list<Unit>, providesTags: (_, __, id) => [{type: 'Units', id}]}),
    report: build.query<Report, {classId: string; unitId: string}>({query: ({classId, unitId}) => `${path(classId)}/units/${encodeURIComponent(unitId)}/report`, transformResponse: unwrap<Report>, providesTags: (_, __, q) => [{type: 'Report', id: q.classId}]}),
    progress: build.query<ProgressEntry[], string>({query: id => `${path(id)}/progress`, transformResponse: (res: Envelope<{items: ProgressEntry[]}>) => [...res.data.items].sort((a,b) => a.unitOrder - b.unitOrder), providesTags: (_, __, id) => [{type: 'Progress', id}]}),
    materials: build.query<Material[], string>({query: id => `${path(id)}/materials`, transformResponse: list<Material>, providesTags: (_, __, id) => [{type: 'Materials', id}]}),
    materialAccess: build.mutation<Access, {classId: string; materialId: string}>({query: ({classId, materialId}) => ({url: `${path(classId)}/materials/${encodeURIComponent(materialId)}/access`, method: 'POST'}), transformResponse: unwrap<Access>}),
  }),
});
export const api = createStudentApi();
export const { useLoginMutation, useExchangeMutation, useLogoutMutation, useMeQuery, useClassesQuery, useUnitsQuery, useReportQuery, useProgressQuery, useMaterialsQuery, useMaterialAccessMutation } = api;
