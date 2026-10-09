import { api } from "./api";
import type { Envelope } from "@/models";
import type {
  RewardClass,
  RewardDetail,
  RewardHistory,
  RewardKind,
  StudySchedule,
} from "@/features/rewards/models";
const unwrap = <T>(response: Envelope<T>) => response.data;
const path = (id: string) => `/me/classes/${encodeURIComponent(id)}`;
export const rewardsApi = api.injectEndpoints({
  endpoints: (b) => ({
    rewardClasses: b.query<RewardClass[], void>({
      query: () => "/me/reward-classes",
      transformResponse: unwrap<RewardClass[]>,
      providesTags: ["Rewards"],
    }),
    rewardDetail: b.query<
      RewardDetail,
      { classId: string; from: string; to: string }
    >({
      query: (q) => ({
        url: `${path(q.classId)}/rewards`,
        params: { from: q.from || undefined, to: q.to || undefined },
      }),
      transformResponse: unwrap<RewardDetail>,
      providesTags: (_, __, q) => [{ type: "Rewards", id: q.classId }],
    }),
    rewardActivities: b.query<
      RewardHistory,
      { classId: string; date?: string; page: number }
    >({
      query: (q) => ({
        url: `${path(q.classId)}/rewards/activities`,
        params: { date: q.date, page: q.page, pageSize: 20 },
      }),
      transformResponse: unwrap<RewardHistory>,
      providesTags: (_, __, q) => [{ type: "Rewards", id: q.classId }],
    }),
    rewardHistory: b.query<
      RewardHistory,
      { classId: string; kind?: RewardKind; date?: string; page: number }
    >({
      query: (q) => ({
        url: `${path(q.classId)}/rewards/history`,
        params: { kind: q.kind, date: q.date, page: q.page, pageSize: 20 },
      }),
      transformResponse: unwrap<RewardHistory>,
      providesTags: (_, __, q) => [{ type: "Rewards", id: q.classId }],
    }),
    studySchedule: b.query<StudySchedule, string>({
      query: (id) => `${path(id)}/schedule`,
      transformResponse: unwrap<StudySchedule>,
      providesTags: (_, __, id) => [{ type: "Schedule", id }],
    }),
  }),
});
export const {
  useRewardClassesQuery,
  useRewardDetailQuery,
  useRewardHistoryQuery,
  useRewardActivitiesQuery,
  useStudyScheduleQuery,
} = rewardsApi;
