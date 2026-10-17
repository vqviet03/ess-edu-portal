import { configureStore } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { IntroductionPage, Registration } from "./models";
// A guest-only API store: no access token, private reducer or realtime connection is bundled in the public page.
export const introductionApi = createApi({
  reducerPath: "publicIntroduction",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1/introduction",
    timeout: 15000,
  }),
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (b) => ({
    publicIntroduction: b.query<IntroductionPage, void>({
      query: () => "",
      transformResponse: (r: { data: IntroductionPage }) => r.data,
    }),
    registerIntroduction: b.mutation<{ received: boolean }, Registration>({
      query: (body) => ({ url: "/registrations", method: "POST", body }),
      transformResponse: (r: { data: { received: boolean } }) => r.data,
    }),
  }),
});
export const introductionStore = () =>
  configureStore({
    reducer: { [introductionApi.reducerPath]: introductionApi.reducer },
    middleware: (g) => g().concat(introductionApi.middleware),
  });
