import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useFavourites } from '@/hooks/use-favourites';
import { useTheme } from '@/hooks/use-theme';
import { ToggleFavouritePayload } from '@/types/favourites';

interface FavouriteButtonProps {
  item: ToggleFavouritePayload;
  size?: number;
  variant?: 'floating' | 'inline' | 'topBar';
  style?: StyleProp<ViewStyle>;
}

export function FavouriteButton({
  item,
  size = 20,
  variant = 'floating',
  style,
}: FavouriteButtonProps) {
  const theme = useTheme();
  const { isFavourite, toggleFavourite } = useFavourites();

  const isFav = isFavourite(item.nasaId);

  const handlePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    toggleFavourite(item);
  };

  const getContainerStyle = (pressed: boolean) => {
    if (variant === 'floating') {
      return [
        styles.floatingContainer,
        {
          backgroundColor: isFav
            ? 'rgba(229, 72, 77, 0.18)'
            : 'rgba(0, 0, 0, 0.45)',
          borderColor: isFav ? '#E5484D' : 'rgba(255, 255, 255, 0.25)',
        },
        pressed && styles.pressed,
        style,
      ];
    }

    if (variant === 'topBar') {
      return [
        styles.topBarContainer,
        {
          backgroundColor: isFav
            ? 'rgba(229, 72, 77, 0.18)'
            : theme.backgroundElement,
          borderColor: isFav ? '#E5484D' : 'transparent',
        },
        pressed && styles.pressed,
        style,
      ];
    }

    return [
      styles.inlineContainer,
      {
        backgroundColor: isFav
          ? 'rgba(229, 72, 77, 0.15)'
          : theme.backgroundElement,
      },
      pressed && styles.pressed,
      style,
    ];
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        isFav
          ? `Remove ${item.title} from favourites`
          : `Add ${item.title} to favourites`
      }
      accessibilityState={{ selected: isFav }}
      accessibilityHint={
        isFav
          ? 'Removes this orbital observation from your saved list'
          : 'Saves this orbital observation to your favourites'
      }
      style={({ pressed }) => getContainerStyle(pressed)}>
      <Feather
        name="heart"
        size={size}
        color={isFav ? '#E5484D' : variant === 'floating' ? '#FFFFFF' : theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  topBarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inlineContainer: {
    width: 44,
    height: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
  },
});
