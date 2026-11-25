import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useFavourites } from '@/hooks/use-favourites';
import { useTheme } from '@/hooks/use-theme';
import { FavouriteItem } from '@/types/favourites';

interface FavouriteCardProps {
  item: FavouriteItem;
  onRemove: (nasaId: string) => void;
  onPress: (nasaId: string) => void;
}

function FavouriteCard({ item, onRemove, onPress }: FavouriteCardProps) {
  const theme = useTheme();
  const [hasImageError, setHasImageError] = useState(false);

  const shouldShowImage = Boolean(item.thumbnailUrl) && !hasImageError;

  return (
    <Pressable
      onPress={() => onPress(item.nasaId)}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
      accessibilityHint="Navigates to NASA observation details">
      <ThemedView type="backgroundElement" style={styles.card}>
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

          {/* Remove Action Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onRemove(item.nasaId);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.title} from favourites`}
            accessibilityHint="Deletes this observation from your saved list"
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.removeButtonPressed,
            ]}>
            <Feather name="trash-2" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardMetaRow}>
            <ThemedText type="code" themeColor="textSecondary" style={styles.idBadge}>
              {item.center ? `${item.center} • ` : ''}
              {item.nasaId}
            </ThemedText>
            <Feather name="chevron-right" size={16} color={theme.textSecondary} style={styles.chevron} />
          </View>

          <ThemedText type="default" style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user, logout } = useAuthSession();
  const {
    items,
    isRestoring,
    restoreError,
    removeFavourite,
    retryRestore,
  } = useFavourites();

  const containerPadding = {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleCardPress = (nasaId: string) => {
    if (nasaId && typeof nasaId === 'string') {
      router.push({
        pathname: '/details/[nasaId]',
        params: { nasaId: nasaId.trim() },
      });
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Profile / Mission Row */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
          <Feather name="heart" size={13} color="#E5484D" />
          <ThemedText type="code" style={styles.badgeText}>
            Personal Collection
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
        Favourites
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.headingSubtitle}>
        {items.length === 1
          ? '1 saved Earth observation'
          : `${items.length} saved Earth observations`}
      </ThemedText>
    </View>
  );

  // 1. Loading / Restoring State
  if (isRestoring && items.length === 0) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <View style={styles.stateCenter}>
            <ActivityIndicator size="large" color="#208AEF" />
            <ThemedText type="default" style={styles.stateTitle}>
              Restoring saved observations...
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateSubtitle}>
              Loading your favourites from storage
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  // 2. Storage Error State
  if (restoreError && items.length === 0) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <ThemedView type="backgroundElement" style={styles.stateCard}>
            <View style={styles.errorIconCircle}>
              <Feather name="alert-triangle" size={32} color="#E5484D" />
            </View>
            <ThemedText type="default" style={styles.stateTitle}>
              Unable to Restore Favourites
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              {restoreError}
            </ThemedText>
            <Pressable
              onPress={retryRestore}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retry restoring favourites">
              <Feather name="refresh-cw" size={16} color={theme.background} />
              <ThemedText style={[styles.actionButtonText, { color: theme.background }]}>
                Retry
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // 3. Empty State
  if (items.length === 0) {
    return (
      <ThemedView style={styles.screen}>
        <View style={[styles.innerContainer, containerPadding]}>
          {renderHeader()}
          <ThemedView type="backgroundElement" style={styles.stateCard}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: 'rgba(229, 72, 77, 0.12)' },
              ]}>
              <Feather name="heart" size={32} color="#E5484D" />
            </View>
            <ThemedText type="default" style={styles.stateTitle}>
              No Favourites Saved Yet
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.stateDescription}>
              Tap the heart icon on any Earth observation card in Explore to save it
              here for quick access.
            </ThemedText>
            <Pressable
              onPress={() => router.navigate('/explore')}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.text },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Browse Explore screen">
              <Feather name="compass" size={16} color={theme.background} />
              <ThemedText style={[styles.actionButtonText, { color: theme.background }]}>
                Browse Explore
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  // 4. Populated Favourites List
  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.nasaId}
        renderItem={({ item }) => (
          <FavouriteCard
            item={item}
            onRemove={removeFavourite}
            onPress={handleCardPress}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, containerPadding]}
        showsVerticalScrollIndicator={false}
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
    gap: Spacing.four,
  },
  header: {
    paddingBottom: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
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
    borderRadius: Spacing.three,
    maxWidth: 160,
  },
  userName: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
  },
  logoutText: {
    color: '#E5484D',
    fontSize: 11,
    fontWeight: '600',
  },
  headingTitle: {
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 34,
  },
  headingSubtitle: {
    marginTop: Spacing.half,
    fontSize: 15,
  },
  cardPressable: {
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
  removeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 72, 77, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  removeButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idBadge: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chevron: {
    opacity: 0.6,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
  },
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  stateTitle: {
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
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
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
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
  stateDescription: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 290,
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
    minWidth: 150,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
