import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { authApi } from './api/auth-api';
import { nasaApi } from './api/nasa-api';
import authReducer from './slices/auth-slice';
import favouritesReducer from './slices/favourites-slice';

export const store = configureStore({
  reducer: {
    [nasaApi.reducerPath]: nasaApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
    favourites: favouritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(nasaApi.middleware, authApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
