import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { NasaEarthObservation } from '@/types/nasa';

interface ObservationCardProps {
  item: NasaEarthObservation;
}

export function ObservationCard({ item }: ObservationCardProps) {
  const theme = useTheme();
  const [hasImageError, setHasImageError] = useState(false);

  const shouldShowImage = Boolean(item.thumbnailUrl) && !hasImageError;

  return (
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
      </View>

      {/* Content Details */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.idBadge}>
            {item.center ? `${item.center} • ` : ''}
            {item.id}
          </ThemedText>
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
  );
}

const styles = StyleSheet.create({
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
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idBadge: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
