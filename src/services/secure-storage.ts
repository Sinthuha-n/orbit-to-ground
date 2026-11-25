import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'orbit_access_token';
const REFRESH_TOKEN_KEY = 'orbit_refresh_token';

// Web memory fallback for testing / web environment where SecureStore is unavailable
let webTokenStore: { [key: string]: string } = {};

/**
 * Saves authentication tokens securely in device hardware keychain / keystore.
 * Never stores tokens in AsyncStorage or plaintext local storage.
 */
export async function saveAuthTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
}): Promise<void> {
  if (Platform.OS === 'web') {
    webTokenStore[ACCESS_TOKEN_KEY] = tokens.accessToken;
    if (tokens.refreshToken) {
      webTokenStore[REFRESH_TOKEN_KEY] = tokens.refreshToken;
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  } catch {
    // Graceful error isolation: Avoid logging token contents
  }
}

/**
 * Retrieves the stored authentication tokens.
 */
export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  if (Platform.OS === 'web') {
    return {
      accessToken: webTokenStore[ACCESS_TOKEN_KEY] || null,
      refreshToken: webTokenStore[REFRESH_TOKEN_KEY] || null,
    };
  }

  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Clears stored tokens on logout or session expiration.
 */
export async function clearAuthTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    webTokenStore = {};
    return;
  }

  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore deletion errors on already deleted items
  }
}
