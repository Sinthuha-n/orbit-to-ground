import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FavouriteButton } from '@/components/favourite-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFavourites } from '@/hooks/use-favourites';
import { useTheme } from '@/hooks/use-theme';
import { hasJournalEntry } from '@/types/favourites';
import { NasaEarthObservation } from '@/types/nasa';

interface ObservationCardProps {
  item: NasaEarthObservation;
}

export function ObservationCard({ item }: ObservationCardProps) {
  const theme = useTheme();
  const { getFavourite } = useFavourites();
  const [hasImageError, setHasImageError] = useState(false);

  const favItem = getFavourite(item.id);
  const hasJournal = hasJournalEntry(favItem);

  const shouldShowImage = Boolean(item.thumbnailUrl) && !hasImageError;

  const handlePress = () => {
    // Only pass the validated ID to the Details route
    if (item.id && typeof item.id === 'string') {
      router.push({
        pathname: '/details/[nasaId]',
        params: { nasaId: item.id.trim() },
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.pressable, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
      accessibilityHint="Navigates to full NASA orbital observation details">
      <ThemedView type="backgroundElement" style={styles.card}>
        {/* Thumbnail or Fallback Icon */}
        <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSelected }]}>
          {shouldShowImage ? (
            <Image
              source={{ uri: item.thumbnailUrl! }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              onError={() => setHasImageError(true)}
              accessibilityLabel={item.title}
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Feather name="image" size={36} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.fallbackText}>
                Image unavailable
              </ThemedText>
            </View>
          )}

          {/* Favourite Toggle Button */}
          <View style={styles.favouriteButtonOverlay}>
            <FavouriteButton
              item={{
                nasaId: item.id,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                center: item.center,
                dateCreated: item.dateCreated,
              }}
              variant="floating"
            />
          </View>
        </View>

        {/* Content Details */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.idBadgeGroup}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.idBadge}>
                {item.center ? `${item.center} • ` : ''}
                {item.id}
              </ThemedText>
              {hasJournal ? (
                <View style={[styles.journalPill, { backgroundColor: 'rgba(32, 138, 239, 0.12)' }]}>
                  <Feather name="book-open" size={10} color="#208AEF" />
                  <ThemedText type="code" style={styles.journalPillText}>
                    Ground Note
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={theme.textSecondary}
              style={styles.chevron}
            />
          </View>

          <ThemedText type="default" style={styles.title} numberOfLines={2}>
            {item.title}
          </ThemedText>

          {item.description ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={3}
              style={styles.description}>
              {item.description}
            </ThemedText>
          ) : (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.descriptionMissing}>
              No description available for this observation.
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Spacing.four,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.15)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  fallbackText: {
    fontSize: 12,
  },
  favouriteButtonOverlay: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    zIndex: 5,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  journalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one + Spacing.half,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  journalPillText: {
    fontSize: 10,
    color: '#208AEF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  idBadge: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chevron: {
    opacity: 0.6,
  },
  title: {
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 23,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionMissing: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
