import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveAuthTokens } from '@/services/secure-storage';
import { useLoginMutation } from '@/store/api/auth-api';
import { useAppDispatch } from '@/store';
import { setAuthenticatedUser } from '@/store/slices/auth-slice';
import { LoginFormErrors, LoginFormValues, validateLoginForm } from '@/types/auth';

const DEMO_USER = 'emilys';
const DEMO_PASS = 'emilyspass';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ notice?: string }>();

  const [form, setForm] = useState<LoginFormValues>({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginMutation, { isLoading }] = useLoginMutation();

  const handleFieldChange = (field: keyof LoginFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleFillDemo = () => {
    setForm({ username: DEMO_USER, password: DEMO_PASS });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (isLoading) return; // Prevent duplicate taps

    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await loginMutation({
        username: form.username.trim(),
        password: form.password,
        expiresInMins: 120,
      }).unwrap();

      const accessToken = response.accessToken || response.token;
      if (!accessToken) {
        setErrors({ general: 'Server failed to issue an access token' });
        return;
      }

      // Store tokens securely in hardware keychain
      await saveAuthTokens({
        accessToken,
        refreshToken: response.refreshToken,
      });

      // Update Redux state with authenticated user
      dispatch(
        setAuthenticatedUser({
          id: response.id,
          username: response.username,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          gender: response.gender,
          image: response.image,
        })
      );

      // Navigate to authenticated Explore screen
      router.replace('/(tabs)/explore');
    } catch (err: any) {
      let errorMessage = 'Network error: could not connect to auth service.';
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.status === 400) {
        errorMessage = 'Invalid username or password. Please try again.';
      }
      setErrors({ general: errorMessage });
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.four,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Logo & Hero */}
            <View style={styles.heroSection}>
              <View style={[styles.iconBox, { backgroundColor: theme.backgroundElement }]}>
                <Feather name="globe" size={40} color={theme.text} />
              </View>
              <ThemedText type="subtitle" style={styles.appName}>
                Orbit to Ground
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.appSubtitle}>
                Sign in to access NASA Earth observation logs
              </ThemedText>
            </View>

            {/* Notice banner (e.g. from registration simulation) */}
            {params.notice ? (
              <View style={[styles.noticeBanner, { backgroundColor: 'rgba(32, 138, 239, 0.12)' }]}>
                <Feather name="info" size={16} color="#208AEF" />
                <ThemedText type="small" style={styles.noticeText}>
                  {params.notice}
                </ThemedText>
              </View>
            ) : null}

            {/* General Error Banner */}
            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: 'rgba(229, 72, 77, 0.12)' }]}>
                <Feather name="alert-circle" size={16} color="#E5484D" />
                <ThemedText type="small" style={styles.errorBannerText}>
                  {errors.general}
                </ThemedText>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.formCard}>
              {/* Username Field */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Username
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: errors.username
                        ? '#E5484D'
                        : 'rgba(128, 128, 128, 0.25)',
                    },
                  ]}>
                  <Feather name="user" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter username"
                    placeholderTextColor={theme.textSecondary}
                    value={form.username}
                    onChangeText={(val) => handleFieldChange('username', val)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Username input"
                  />
                </View>
                {errors.username ? (
                  <ThemedText type="small" style={styles.fieldError}>
                    {errors.username}
                  </ThemedText>
                ) : null}
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Password
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: errors.password
                        ? '#E5484D'
                        : 'rgba(128, 128, 128, 0.25)',
                    },
                  ]}>
                  <Feather name="lock" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter password"
                    placeholderTextColor={theme.textSecondary}
                    value={form.password}
                    onChangeText={(val) => handleFieldChange('password', val)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Password input"
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <ThemedText type="small" style={styles.fieldError}>
                    {errors.password}
                  </ThemedText>
                ) : null}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: theme.text },
                  (pressed || isLoading) && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign in">
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <>
                    <Feather name="log-in" size={18} color={theme.background} />
                    <ThemedText style={[styles.submitButtonText, { color: theme.background }]}>
                      Sign In
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Demo Helper Card */}
            <ThemedView type="backgroundElement" style={styles.demoCard}>
              <View style={styles.demoHeader}>
                <Feather name="key" size={16} color={theme.text} />
                <ThemedText type="smallBold">Demo Credentials</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.demoDesc}>
                Use DummyJSON test account:{' '}
                <ThemedText type="code">{DEMO_USER}</ThemedText> /{' '}
                <ThemedText type="code">{DEMO_PASS}</ThemedText>
              </ThemedText>
              <Pressable
                onPress={handleFillDemo}
                style={({ pressed }) => [
                  styles.fillDemoButton,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Auto-fill demo credentials">
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  Auto-fill Demo Credentials
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Register Link */}
            <View style={styles.registerLinkRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Don&apos;t have an account?{' '}
              </ThemedText>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <ThemedText type="linkPrimary">Create an account</ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  appName: {
    fontWeight: '800',
    fontSize: 28,
  },
  appSubtitle: {
    textAlign: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  noticeText: {
    flex: 1,
    color: '#208AEF',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  errorBannerText: {
    flex: 1,
    color: '#E5484D',
    lineHeight: 18,
  },
  formCard: {
    gap: Spacing.three,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.two,
  },
  fieldError: {
    color: '#E5484D',
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    minHeight: 50,
    marginTop: Spacing.one,
  },
  submitButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  demoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  demoDesc: {
    fontSize: 13,
  },
  fillDemoButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
});
