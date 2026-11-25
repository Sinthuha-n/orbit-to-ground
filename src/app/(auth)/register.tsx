import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
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
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRegisterMutation } from '@/store/api/auth-api';
import { RegisterFormErrors, RegisterFormValues, validateRegisterForm } from '@/types/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [form, setForm] = useState<RegisterFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const handleFieldChange = (field: keyof RegisterFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return; // Prevent duplicate submission

    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await registerMutation({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
      }).unwrap();

      // Navigate to Login screen with explanatory notice about DummyJSON mock behavior
      router.replace({
        pathname: '/(auth)/login',
        params: {
          notice:
            'Registration simulated successfully! DummyJSON does not persist new accounts. Please log in using the demo account.',
        },
      });
    } catch (err: any) {
      const message =
        err?.data?.message || 'Registration simulation failed. Please try again.';
      setErrors({ general: message });
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
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in">
                <Feather name="arrow-left" size={18} color={theme.text} />
                <ThemedText type="small">Sign In</ThemedText>
              </Pressable>

              <ThemedText type="subtitle" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Simulate registration with DummyJSON
              </ThemedText>
            </View>

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
              {/* First Name & Last Name */}
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText type="smallBold" style={styles.label}>
                    First Name
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: errors.firstName
                          ? '#E5484D'
                          : 'rgba(128, 128, 128, 0.25)',
                      },
                    ]}>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Jane"
                      placeholderTextColor={theme.textSecondary}
                      value={form.firstName}
                      onChangeText={(val) => handleFieldChange('firstName', val)}
                      autoCapitalize="words"
                      accessibilityLabel="First name input"
                    />
                  </View>
                  {errors.firstName ? (
                    <ThemedText type="small" style={styles.fieldError}>
                      {errors.firstName}
                    </ThemedText>
                  ) : null}
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText type="smallBold" style={styles.label}>
                    Last Name
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: errors.lastName
                          ? '#E5484D'
                          : 'rgba(128, 128, 128, 0.25)',
                      },
                    ]}>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Doe"
                      placeholderTextColor={theme.textSecondary}
                      value={form.lastName}
                      onChangeText={(val) => handleFieldChange('lastName', val)}
                      autoCapitalize="words"
                      accessibilityLabel="Last name input"
                    />
                  </View>
                  {errors.lastName ? (
                    <ThemedText type="small" style={styles.fieldError}>
                      {errors.lastName}
                    </ThemedText>
                  ) : null}
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email Address
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: errors.email
                        ? '#E5484D'
                        : 'rgba(128, 128, 128, 0.25)',
                    },
                  ]}>
                  <Feather name="mail" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="explorer@orbit.nasa.gov"
                    placeholderTextColor={theme.textSecondary}
                    value={form.email}
                    onChangeText={(val) => handleFieldChange('email', val)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email input"
                  />
                </View>
                {errors.email ? (
                  <ThemedText type="small" style={styles.fieldError}>
                    {errors.email}
                  </ThemedText>
                ) : null}
              </View>

              {/* Username */}
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
                    placeholder="Choose username"
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

              {/* Password */}
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
                    placeholder="At least 6 characters"
                    placeholderTextColor={theme.textSecondary}
                    value={form.password}
                    onChangeText={(val) => handleFieldChange('password', val)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Password input"
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}>
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

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Confirm Password
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: errors.confirmPassword
                        ? '#E5484D'
                        : 'rgba(128, 128, 128, 0.25)',
                    },
                  ]}>
                  <Feather name="check-circle" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.textSecondary}
                    value={form.confirmPassword}
                    onChangeText={(val) => handleFieldChange('confirmPassword', val)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Confirm password input"
                  />
                </View>
                {errors.confirmPassword ? (
                  <ThemedText type="small" style={styles.fieldError}>
                    {errors.confirmPassword}
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
                accessibilityLabel="Create Account">
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <>
                    <Feather name="user-plus" size={18} color={theme.background} />
                    <ThemedText style={[styles.submitButtonText, { color: theme.background }]}>
                      Create Account
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            {/* Explanatory Note */}
            <ThemedView type="backgroundElement" style={styles.infoBox}>
              <Feather name="info" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                Registration is simulated with DummyJSON. DummyJSON mock servers return a generated
                ID but do not persist new users.
              </ThemedText>
            </ThemedView>
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
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Spacing.five,
    marginBottom: Spacing.two,
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
  },
  subtitle: {
    fontSize: 14,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
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
    marginTop: Spacing.two,
  },
  submitButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
