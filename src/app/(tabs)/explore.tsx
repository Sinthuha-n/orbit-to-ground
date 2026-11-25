import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ObservationCard } from '@/components/observation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useTheme } from '@/hooks/use-theme';
import { useGetEarthImageryQuery } from '@/store/api/nasa-api';
import { NasaEarthObservation } from '@/types/nasa';

const DEFAULT_QUERY = 'river delta';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user, logout } = useAuthSession();

  const {
    data: observations = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetEarthImageryQuery(DEFAULT_QUERY);

  const containerPadding = {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
  };

  const handleLogout = async () => {
    await logout();
    // Use replace so Android Back cannot reopen an authenticated screen after logout
    router.replace('/(auth)/login');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Profile / Mission Row */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
          <Feather name="globe" size={13} color={theme.text} />
          <ThemedText type="code" style={styles.badgeText}>
            NASA Earth Science
          </ThemedText>
        </View>

        {user ? (
          <View style={styles.userSection}>
            <View style={[styles.userChip, { backgroundColor: theme.backgroundElement }]}>
              <Feather name="user" size={12} color={theme.text} />
              <ThemedText type="smallBold" numberOfLines={1} style={styles.userName}>
                {user.firstName} {user.lastName}
              </ThemedText>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign out of application">
              <Feather name="log-out" size={13} color="#E5484D" />
              <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <ThemedText type="subtitle" style={styles.headingTitle}>
        Orbit to Ground
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.headingSubtitle}>
        Explore Earth from orbit
      </ThemedText>
    </View>
  );

  // Loading State
  if (isLoading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <View style={styles.stateCenter}>
            <ActivityIndicator size="large" color="#208AEF" />
            <ThemedText type="default" style={styles.stateTitle}>
              Scanning Earth observations...
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              Connecting to the NASA Image & Video Library
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  // Error State with Working Retry Action
  if (isError) {
    const errorMessage =
      error && 'status' in error
        ? `NASA service responded with status ${error.status}`
        : 'Could not connect to NASA imagery servers. Please verify your connection.';

    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <ThemedView type="backgroundElement" style={styles.stateBox}>
            <View style={styles.errorIconCircle}>
              <Feather name="alert-circle" size={32} color="#E5484D" />
            </View>
            <ThemedText type="default" style={styles.stateTitle}>
              Unable to load observations
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              {errorMessage}
            </ThemedText>

            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading NASA observations">
              <Feather name="refresh-cw" size={16} color={theme.background} />
              <ThemedText style={[styles.retryButtonText, { color: theme.background }]}>
                Retry
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // Empty State
  if (observations.length === 0) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <ThemedView type="backgroundElement" style={styles.stateBox}>
            <Feather name="compass" size={40} color={theme.textSecondary} />
            <ThemedText type="default" style={styles.stateTitle}>
              No observations found
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              No Earth imagery matched the query &ldquo;{DEFAULT_QUERY}&rdquo;.
            </ThemedText>

            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Refresh observation records">
              <Feather name="refresh-cw" size={16} color={theme.background} />
              <ThemedText style={[styles.retryButtonText, { color: theme.background }]}>
                Refresh
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // Loaded State: Scrollable FlatList of Cards
  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={observations}
        keyExtractor={(item: NasaEarthObservation) => item.id}
        renderItem={({ item }) => <ObservationCard item={item} />}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[styles.listContent, containerPadding]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => {
              refetch();
            }}
            tintColor={theme.text}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  header: {
    marginBottom: Spacing.four,
    gap: Spacing.one,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    maxWidth: 160,
  },
  userName: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  logoutText: {
    color: '#E5484D',
    fontSize: 12,
    fontWeight: '700',
  },
  headingTitle: {
    fontWeight: '800',
    fontSize: 30,
    lineHeight: 36,
  },
  headingSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  separator: {
    height: Spacing.four,
  },
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  stateBox: {
    marginTop: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 72, 77, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  stateTitle: {
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    minHeight: 48,
    minWidth: 140,
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
