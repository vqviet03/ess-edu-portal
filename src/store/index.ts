import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import auth, { loggedOut, signedIn } from "./auth";
import { api } from "../api/api";
import { writeSession } from "../auth/session";
import { libraryApi } from "@/api/library-api";
import {
  noticeReceived,
  noticeSnapshotReceived,
  mergeNotice,
} from "@/features/materials/notification-state";
const sessionMiddleware =
  (service: typeof api): Middleware =>
  (store) =>
  (next) =>
  (action) => {
    const result = next(action);
    if (signedIn.match(action)) writeSession(action.payload);
    if (loggedOut.match(action)) {
      writeSession(null);
      store.dispatch(service.util.resetApiState());
    }
    return result;
  };
export const makeStore = (service = api) => {
  type NoticeState = Parameters<
    typeof libraryApi.util.selectCachedArgsForQuery
  >[0] & { auth: ReturnType<typeof auth> };
  const listener = createListenerMiddleware<
    NoticeState,
    ThunkDispatch<NoticeState, unknown, UnknownAction>
  >();
  let queue = Promise.resolve();
  listener.startListening({
    actionCreator: noticeSnapshotReceived,
    effect: (action, context) => {
      const token = context.getState().auth.accessToken;
      queue = queue.then(async () => {
        if (
          service !== api ||
          !token ||
          context.getState().auth.accessToken !== token
        )
          return;
        const filters = libraryApi.util.selectCachedArgsForQuery(
          context.getState(),
          "notifications",
        );
        for (const filter of filters) {
          context.dispatch(
            libraryApi.util.updateQueryData("notifications", filter, (page) => {
              for (const item of action.payload.items)
                mergeNotice(page, filter, item, 0);
              page.unreadCount = action.payload.unreadCount;
            }),
          );
        }
        await context.dispatch(
          libraryApi.util.upsertQueryData("notifications", {}, action.payload),
        );
      });
      return queue;
    },
  });
  listener.startListening({
    actionCreator: noticeReceived,
    effect: (action, context) => {
      const token = context.getState().auth.accessToken;
      queue = queue.then(async () => {
        if (
          service !== api ||
          !token ||
          context.getState().auth.accessToken !== token
        )
          return;
        const state = context.getState(),
          filters = libraryApi.util.selectCachedArgsForQuery(
            state,
            "notifications",
          );
        if (!filters.length) {
          await context.dispatch(
            libraryApi.util.upsertQueryData(
              "notifications",
              {},
              {
                items: [action.payload],
                nextCursor: null,
                unreadCount: Number(!action.payload.isRead),
              },
            ),
          );
          return;
        }
        const previous = filters
          .map((filter) =>
            libraryApi.endpoints.notifications
              .select(filter)(state)
              .data?.items.find((n) => n.id === action.payload.id),
          )
          .find((n) => n !== undefined);
        if (previous && previous.version >= action.payload.version) return;
        const delta =
          Number(!action.payload.isRead) -
          (previous ? Number(!previous.isRead) : 0);
        for (const filter of filters)
          context.dispatch(
            libraryApi.util.updateQueryData("notifications", filter, (page) => {
              mergeNotice(page, filter, action.payload, delta);
            }),
          );
      });
      return queue;
    },
  });
  return configureStore({
    reducer: { auth, [service.reducerPath]: service.reducer },
    middleware: (getDefault) =>
      getDefault()
        .prepend(listener.middleware)
        .concat(service.middleware, sessionMiddleware(service)),
  });
};
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export const useAppDispatch = useDispatch.withTypes<AppStore["dispatch"]>();
export const useAppSelector = useSelector.withTypes<RootState>();
