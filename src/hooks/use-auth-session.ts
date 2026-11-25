import { useCallback, useEffect } from 'react';

import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/services/secure-storage';
import { useLazyGetCurrentUserQuery, useRefreshSessionMutation } from '@/store/api/auth-api';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearSession,
  setAuthenticatedUser,
  setRestoringSession,
  setSessionRestoreError,
} from '@/store/slices/auth-slice';

export function useAuthSession() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isRestoringSession, sessionRestoreError } =
    useAppSelector((state) => state.auth);

  const [triggerGetCurrentUser] = useLazyGetCurrentUserQuery();
  const [triggerRefresh] = useRefreshSessionMutation();

  const restoreSession = useCallback(async () => {
    dispatch(setRestoringSession(true));
    dispatch(setSessionRestoreError(null));

    const { accessToken, refreshToken } = await getAuthTokens();

    // No stored token -> user is unauthenticated
    if (!accessToken) {
      dispatch(clearSession());
      return;
    }

    try {
      // Validate current session against DummyJSON /auth/me
      const result = await triggerGetCurrentUser(accessToken).unwrap();
      dispatch(setAuthenticatedUser(result));
    } catch (err: any) {
      const status = err?.status;

      // Case 1: Rejected or expired session (401 / 403)
      if (status === 401 || status === 403) {
        // Attempt token refresh if a refresh token exists
        if (refreshToken) {
          try {
            const refreshed = await triggerRefresh(refreshToken).unwrap();
            if (refreshed.accessToken) {
              await saveAuthTokens({
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken || refreshToken,
              });

              // Re-validate with refreshed token
              const refreshedUser = await triggerGetCurrentUser(
                refreshed.accessToken
              ).unwrap();
              dispatch(setAuthenticatedUser(refreshedUser));
              return;
            }
          } catch {
            // Refresh failed or invalid
          }
        }

        // Expired or invalid refresh: clear stored tokens and return to login
        await clearAuthTokens();
        dispatch(clearSession());
      } else {
        // Case 2: Temporary network failure or server outage
        // Preserve saved credentials in SecureStore and surface retryable error
        dispatch(
          setSessionRestoreError({
            isNetworkError: true,
            message:
              'Could not connect to authentication service. Please check your connection.',
          })
        );
      }
    }
  }, [dispatch, triggerGetCurrentUser, triggerRefresh]);

  const logout = useCallback(async () => {
    await clearAuthTokens();
    dispatch(clearSession());
  }, [dispatch]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return {
    user,
    isAuthenticated,
    isRestoringSession,
    sessionRestoreError,
    restoreSession,
    logout,
  };
}
