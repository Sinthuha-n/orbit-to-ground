import Feather from '@expo/vector-icons/Feather';
import { DarkTheme, DefaultTheme, ThemeProvider, router, useSegments } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { Provider } from 'react-redux';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useTheme } from '@/hooks/use-theme';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

function RootNavigationContent() {
  const { isAuthenticated, isRestoringSession, sessionRestoreError, restoreSession } =
    useAuthSession();
  const segments = useSegments();
  const theme = useTheme();

  // Guard all authenticated routes and handle redirection
  useEffect(() => {
    // Wait until initial session restoration has finished before redirecting
    if (isRestoringSession || sessionRestoreError) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Unauthenticated users are redirected to Login (guards (tabs), details, etc.)
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated users in auth group are redirected to Explore
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, isRestoringSession, sessionRestoreError, segments]);

  // 1. Prevent screen flash during session restoration on launch
  if (isRestoringSession) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Verifying orbital session...
        </ThemedText>
      </ThemedView>
    );
  }

  // 2. Handle temporary network failure during session validation
  // Preserves saved credentials in SecureStore and offers a Retry action
  if (sessionRestoreError && !isAuthenticated) {
    return (
      <ThemedView style={styles.centerContainer}>
        <View style={styles.errorIconCircle}>
          <Feather name="wifi-off" size={36} color="#E5484D" />
        </View>
        <ThemedText type="default" style={styles.errorTitle}>
          Connection Failed
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.errorSubtitle}>
          {sessionRestoreError.message}
        </ThemedText>
        <Pressable
          onPress={restoreSession}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.text },
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retry session restoration">
          <Feather name="refresh-cw" size={16} color={theme.background} />
          <ThemedText style={[styles.retryButtonText, { color: theme.background }]}>
            Retry Connection
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="details/[nasaId]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootNavigationContent />
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  centerText: {
    marginTop: Spacing.two,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229, 72, 77, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  errorTitle: {
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  errorSubtitle: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    minHeight: 48,
    minWidth: 160,
  },
  retryButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
