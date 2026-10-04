import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import auth, { loggedOut, signedIn } from './auth';
import { api } from '../api/api';
import { writeSession } from '../auth/session';
const sessionMiddleware = (service: typeof api): Middleware => store => next => action => {
  const result = next(action);
  if (signedIn.match(action)) writeSession(action.payload);
  if (loggedOut.match(action)) { writeSession(null); store.dispatch(service.util.resetApiState()); }
  return result;
};
export const makeStore = (service = api) => configureStore({ reducer: { auth, [service.reducerPath]: service.reducer }, middleware: getDefault => getDefault().concat(service.middleware, sessionMiddleware(service)) });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export const useAppDispatch = useDispatch.withTypes<AppStore['dispatch']>();
export const useAppSelector = useSelector.withTypes<RootState>();
