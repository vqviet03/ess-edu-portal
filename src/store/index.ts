import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import auth, { loggedOut, signedIn } from './auth';
import { api } from '../api/api';
import { writeSession } from '../auth/session';
const sessionMiddleware: Middleware = store => next => action => {
  const result = next(action);
  if (signedIn.match(action)) writeSession(action.payload);
  if (loggedOut.match(action)) { writeSession(null); store.dispatch(api.util.resetApiState()); }
  return result;
};
export const makeStore = () => configureStore({ reducer: { auth, [api.reducerPath]: api.reducer }, middleware: getDefault => getDefault().concat(api.middleware, sessionMiddleware) });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export const useAppDispatch = useDispatch.withTypes<AppStore['dispatch']>();
export const useAppSelector = useSelector.withTypes<RootState>();
