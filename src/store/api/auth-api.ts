import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '@/types/auth';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://dummyjson.com/',
  }),
  tagTypes: ['UserSession'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: credentials,
      }),
      invalidatesTags: ['UserSession'],
    }),

    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: 'users/add',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: userData,
      }),
    }),

    getCurrentUser: builder.query<User, string>({
      query: (accessToken) => ({
        url: 'auth/me',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      providesTags: ['UserSession'],
    }),

    refreshSession: builder.mutation<
      { accessToken: string; refreshToken?: string },
      string
    >({
      query: (refreshToken) => ({
        url: 'auth/refresh',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          refreshToken,
          expiresInMins: 60,
        },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLazyGetCurrentUserQuery,
  useRefreshSessionMutation,
} = authApi;
