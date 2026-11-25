import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FavouriteButton } from '@/components/favourite-button';
import { GroundJournalEditor } from '@/components/ground-journal-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGetImageDetailsQuery } from '@/store/api/nasa-api';
import { isValidNasaId, NasaImageDetail } from '@/types/nasa';

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function DetailsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { nasaId } = useLocalSearchParams<{ nasaId?: string }>();

  // Validate the ID parameter before performing any request
  const validId = isValidNasaId(nasaId) ? nasaId.trim() : null;

  const {
    data: observation,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetImageDetailsQuery(validId ?? '', {
    skip: !validId,
  });

  const [hasImageError, setHasImageError] = useState(false);

  const containerPadding = {
    paddingTop: insets.top + Spacing.two,
    paddingBottom: insets.bottom + Spacing.six,
  };

  // Top navigation header bar with Back button and optional Favourite action
  const renderTopBar = (
    titleText: string = 'Observation Details',
    observationData?: NasaImageDetail
  ) => (
    <View style={styles.topBar}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText style={styles.backButtonLabel}>Back</ThemedText>
      </Pressable>

      <ThemedText
        type="code"
        themeColor="textSecondary"
        numberOfLines={1}
        style={styles.topBarTitle}>
        {titleText}
      </ThemedText>

      {observationData ? (
        <FavouriteButton
          item={{
            nasaId: observationData.id,
            title: observationData.title,
            thumbnailUrl: observationData.thumbnailUrl || observationData.imageUrl,
            center: observationData.center,
            dateCreated: observationData.dateCreated,
          }}
          variant="topBar"
        />
      ) : (
        <View style={styles.topBarPlaceholder} />
      )}
    </View>
  );

  // 1. Invalid ID parameter state
  if (!validId) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderTopBar('Invalid Request')}
          <ThemedView type="backgroundElement" style={styles.stateCard}>
            <Feather name="alert-triangle" size={44} color="#E5484D" />
            <ThemedText type="default" style={styles.stateTitle}>
              Invalid Observation ID
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              No valid NASA ID was provided. Please choose an observation from the Explore list.
            </ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText style={[styles.actionButtonText, { color: theme.background }]}>
                Return to Explore
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // 2. Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderTopBar(validId)}
          <View style={styles.stateCenter}>
            <ActivityIndicator size="large" color="#208AEF" />
            <ThemedText type="default" style={styles.stateTitle}>
              Loading orbital observation...
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              Connecting to NASA library for {validId}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  // 3. Error state (supports 404 missing item and network error with Retry)
  if (isError || !observation) {
    const is404 =
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error.status === 404 || error.status === 'CUSTOM_ERROR');

    const errorMessage =
      error && typeof error === 'object' && 'data' in error && typeof error.data === 'string'
        ? error.data
        : 'Could not connect to NASA imagery servers. Please verify your connection.';

    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderTopBar(validId)}
          <ThemedView type="backgroundElement" style={styles.stateCard}>
            <View style={styles.errorIconCircle}>
              <Feather
                name={is404 ? 'file-text' : 'alert-circle'}
                size={32}
                color={is404 ? theme.textSecondary : '#E5484D'}
              />
            </View>
            <ThemedText type="default" style={styles.stateTitle}>
              {is404 ? 'Observation Not Found' : 'Unable to Load Details'}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              {errorMessage}
            </ThemedText>

            {!is404 ? (
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.text },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Retry loading NASA observation details">
                <Feather name="refresh-cw" size={16} color={theme.background} />
                <ThemedText style={[styles.actionButtonText, { color: theme.background }]}>
                  Retry
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.text },
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText style={[styles.actionButtonText, { color: theme.background }]}>
                  Return to Explore
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // 4. Success state: Scrollable details view
  const formattedDate = formatDate(observation.dateCreated);
  const shouldShowImage = Boolean(observation.imageUrl) && !hasImageError;

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.stickyHeaderWrapper}>
        <View style={[styles.innerContainer, { paddingTop: insets.top + Spacing.two }]}>
          {renderTopBar(observation.id, observation)}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.six }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => {
                refetch();
              }}
              tintColor={theme.text}
            />
          }>
          <View style={styles.innerContainer}>
            {/* From Orbit Section Header */}
            <View style={styles.orbitBadgeRow}>
              <View style={[styles.orbitBadge, { backgroundColor: '#208AEF' }]}>
                <Feather name="globe" size={13} color="#FFFFFF" />
                <ThemedText style={styles.orbitBadgeText}>From Orbit • Satellite Observation</ThemedText>
              </View>
            </View>

            {/* Orbital Image Presentation or Unavailable Image Fallback */}
            <View style={[styles.imageCard, { backgroundColor: theme.backgroundSelected }]}>
            {shouldShowImage ? (
              <Image
                source={{ uri: observation.imageUrl! }}
                style={styles.orbitalImage}
                contentFit="cover"
                transition={250}
                onError={() => setHasImageError(true)}
                accessibilityLabel={observation.title}
              />
            ) : (
              <View style={styles.imageFallback}>
                <Feather name="image" size={48} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.imageFallbackText}>
                  Orbital image unavailable for this observation
                </ThemedText>
              </View>
            )}
          </View>

          {/* Metadata Badges Row */}
          <View style={styles.badgeRow}>
            {observation.center ? (
              <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                <Feather name="compass" size={12} color={theme.text} />
                <ThemedText type="code" style={styles.chipText}>
                  Center: {observation.center}
                </ThemedText>
              </View>
            ) : null}

            {formattedDate ? (
              <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                <Feather name="calendar" size={12} color={theme.text} />
                <ThemedText type="code" style={styles.chipText}>
                  {formattedDate}
                </ThemedText>
              </View>
            ) : null}

            <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="code" style={styles.chipText}>
                #{observation.id}
              </ThemedText>
            </View>
          </View>

          {/* Title */}
          <ThemedText type="subtitle" style={styles.titleText}>
            {observation.title}
          </ThemedText>

          {/* Credit / Photographer Attribution */}
          {observation.credit ? (
            <View style={styles.creditRow}>
              <Feather name="award" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.creditText}>
                {observation.credit}
              </ThemedText>
            </View>
          ) : null}

          {/* Description Section */}
          <ThemedView type="backgroundElement" style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={16} color={theme.text} />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Observation Overview
              </ThemedText>
            </View>

            {observation.description ? (
              <ThemedText
                type="default"
                themeColor="textSecondary"
                style={styles.descriptionBody}>
                {observation.description}
              </ThemedText>
            ) : (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.descriptionMissing}>
                No written description was recorded for this observation.
              </ThemedText>
            )}
          </ThemedView>

          {/* From Ground Section (Personal Field Journal & Comparison Photo) */}
          <GroundJournalEditor
            nasaId={observation.id}
            title={observation.title}
            thumbnailUrl={observation.thumbnailUrl || observation.imageUrl}
            center={observation.center}
            dateCreated={observation.dateCreated}
          />

          {/* Scientific Keywords */}
          {observation.keywords.length > 0 ? (
            <View style={styles.keywordsSection}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.keywordsHeading}>
                Keywords & Topics
              </ThemedText>
              <View style={styles.keywordsWrap}>
                {observation.keywords.map((kw, idx) => (
                  <View
                    key={`${kw}-${idx}`}
                    style={[styles.keywordTag, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="code" style={styles.keywordText}>
                      {kw}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
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
  keyboardAvoid: {
    flex: 1,
  },
  stickyHeaderWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
    zIndex: 10,
  },
  innerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  orbitBadgeRow: {
    marginBottom: Spacing.two,
  },
  orbitBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  orbitBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    minHeight: 40,
  },
  backButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  topBarTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 180,
  },
  topBarPlaceholder: {
    width: 44,
    height: 44,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  scrollContent: {
    paddingTop: Spacing.four,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  orbitalImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  imageFallbackText: {
    textAlign: 'center',
    fontSize: 13,
    maxWidth: 240,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  titleText: {
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing.two,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  creditText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  descriptionSection: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.15)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  descriptionBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  descriptionMissing: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  keywordsSection: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  keywordsHeading: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keywordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  keywordTag: {
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  keywordText: {
    fontSize: 11,
  },
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  stateCard: {
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
  actionButton: {
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
  actionButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
