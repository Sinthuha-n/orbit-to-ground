import AsyncStorage from '@react-native-async-storage/async-storage';

import { FavouriteItem } from '@/types/favourites';

const STORAGE_KEY_PREFIX = 'orbit_favourites_user_';

export function getFavouritesStorageKey(userId: number | string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Loads the saved favourites list for a specific DummyJSON user.
 * Throws on storage failure so caller can display a retry state instead of an empty list.
 */
export async function loadUserFavourites(
  userId: number | string
): Promise<FavouriteItem[]> {
  const key = getFavouritesStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Deduplicate by nasaId and sanitize structure
    const seen = new Set<string>();
    const sanitized: FavouriteItem[] = [];

    for (const item of parsed) {
      if (item && typeof item.nasaId === 'string' && item.nasaId.trim()) {
        const id = item.nasaId.trim();
        if (!seen.has(id)) {
          seen.add(id);
          sanitized.push({
            nasaId: id,
            title: typeof item.title === 'string' ? item.title.trim() : 'Untitled Observation',
            thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl : null,
            center: typeof item.center === 'string' ? item.center : null,
            dateCreated: typeof item.dateCreated === 'string' ? item.dateCreated : null,
            savedAt: typeof item.savedAt === 'string' ? item.savedAt : new Date().toISOString(),
          });
        }
      }
    }

    return sanitized;
  } catch {
    throw new Error('Failed to parse saved favourites data');
  }
}

/**
 * Persists the favourites list for a specific DummyJSON user.
 */
export async function saveUserFavourites(
  userId: number | string,
  items: FavouriteItem[]
): Promise<void> {
  const key = getFavouritesStorageKey(userId);
  // Ensure deduplication before saving
  const seen = new Set<string>();
  const uniqueItems = items.filter((item) => {
    if (!item?.nasaId || seen.has(item.nasaId)) return false;
    seen.add(item.nasaId);
    return true;
  });

  const serialized = JSON.stringify(uniqueItems);
  await AsyncStorage.setItem(key, serialized);
}
