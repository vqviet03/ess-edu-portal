import { api } from "./api";
import type { Envelope } from "@/models";
import type { PersonalProfile } from "@/features/profile/models";
import { profileUpdated } from "@/store/auth";
export const profileApi = api.enhanceEndpoints({ addTagTypes: ["PersonalProfile"] }).injectEndpoints({
  endpoints: b => ({
    personalProfile: b.query<PersonalProfile, void>({
      query: () => "/profile", transformResponse: (r: Envelope<PersonalProfile>) => r.data,
      providesTags: ["PersonalProfile"],
    }),
    savePersonalProfile: b.mutation<PersonalProfile, PersonalProfile & { currentPassword?: string }>({
      query: body => ({ url: "/profile", method: "PATCH", body }),
      transformResponse: (r: Envelope<PersonalProfile>) => r.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileUpdated(data));
          dispatch(profileApi.util.upsertQueryData("personalProfile", undefined, data));
        } catch { /* Keep the draft on validation/conflict. */ }
      },
      invalidatesTags: (_, e) => e ? [] : ["Threads", "Comments", "Members"],
    }),
  }),
});
export const { usePersonalProfileQuery, useSavePersonalProfileMutation } = profileApi;
