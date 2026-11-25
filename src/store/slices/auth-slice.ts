import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { User } from '@/types/auth';

export interface SessionRestoreError {
  isNetworkError: boolean;
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  sessionRestoreError: SessionRestoreError | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isRestoringSession: true,
  sessionRestoreError: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticatedUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isRestoringSession = false;
      state.sessionRestoreError = null;
    },
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isRestoringSession = false;
      state.sessionRestoreError = null;
    },
    setRestoringSession: (state, action: PayloadAction<boolean>) => {
      state.isRestoringSession = action.payload;
    },
    setSessionRestoreError: (state, action: PayloadAction<SessionRestoreError | null>) => {
      state.sessionRestoreError = action.payload;
      state.isRestoringSession = false;
    },
  },
});

export const {
  setAuthenticatedUser,
  clearSession,
  setRestoringSession,
  setSessionRestoreError,
} = authSlice.actions;

export default authSlice.reducer;
