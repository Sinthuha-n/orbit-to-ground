import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import {
  loadUserFavourites,
  saveUserFavourites,
} from '@/services/favourites-storage';
import { deleteNasaPhotoDirectory } from '@/services/photo-storage';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearFavouritesView,
  removeFavouriteItem,
  setActiveUser,
  setFavourites,
  setRestoreError,
  setRestoring,
  toggleFavouriteItem,
  updateJournalEntry,
} from '@/store/slices/favourites-slice';
import {
  FavouriteItem,
  hasJournalEntry,
  JournalEntry,
  ToggleFavouritePayload,
} from '@/types/favourites';

export function useFavourites() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const favouritesState = useAppSelector((state) => state.favourites);

  const userId = user?.id ?? null;
  const activeUserIdRef = useRef<number | string | null>(userId);
  activeUserIdRef.current = userId;

  const restoreForUser = useCallback(
    async (targetUserId: number | string) => {
      dispatch(setRestoring({ userId: targetUserId, isRestoring: true }));
      try {
        const storedItems = await loadUserFavourites(targetUserId);
        // Guard against race conditions if user switched during async read
        if (String(activeUserIdRef.current) === String(targetUserId)) {
          dispatch(setFavourites({ userId: targetUserId, items: storedItems }));
        }
      } catch (err: any) {
        if (String(activeUserIdRef.current) === String(targetUserId)) {
          dispatch(
            setRestoreError({
              userId: targetUserId,
              error: err?.message || 'Failed to load saved favourites. Please try again.',
            })
          );
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (userId !== null && userId !== undefined) {
      dispatch(setActiveUser(userId));
      restoreForUser(userId);
    } else {
      dispatch(clearFavouritesView());
    }
  }, [userId, dispatch, restoreForUser]);

  const isFavourite = useCallback(
    (nasaId: string): boolean => {
      if (!nasaId) return false;
      return favouritesState.items.some((item) => item.nasaId === nasaId.trim());
    },
    [favouritesState.items]
  );

  const getFavourite = useCallback(
    (nasaId: string): FavouriteItem | undefined => {
      if (!nasaId) return undefined;
      return favouritesState.items.find((item) => item.nasaId === nasaId.trim());
    },
    [favouritesState.items]
  );

  const executeRemoval = useCallback(
    async (nasaId: string) => {
      if (!userId) return;
      const cleanNasaId = nasaId.trim();
      dispatch(removeFavouriteItem({ userId, nasaId: cleanNasaId }));

      const updatedItems = favouritesState.items.filter(
        (fav) => fav.nasaId !== cleanNasaId
      );

      try {
        await saveUserFavourites(userId, updatedItems);
        await deleteNasaPhotoDirectory(userId, cleanNasaId);
      } catch (err) {
        console.error('Failed to persist removal:', err);
      }
    },
    [userId, favouritesState.items, dispatch]
  );

  const removeFavourite = useCallback(
    async (nasaId: string, skipConfirm = false) => {
      if (!userId) return;
      const cleanNasaId = nasaId.trim();
      const existing = favouritesState.items.find((fav) => fav.nasaId === cleanNasaId);

      if (!skipConfirm && hasJournalEntry(existing)) {
        Alert.alert(
          'Remove from Favourites?',
          'This observation has a personal ground note or photo. Removing it from favourites will permanently delete your ground journal entry.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                executeRemoval(cleanNasaId);
              },
            },
          ]
        );
        return;
      }

      await executeRemoval(cleanNasaId);
    },
    [userId, favouritesState.items, executeRemoval]
  );

  const toggleFavourite = useCallback(
    async (item: ToggleFavouritePayload, onToggled?: (isNowFav: boolean) => void) => {
      if (!userId) return;
      const cleanNasaId = item.nasaId.trim();
      const currentItems = favouritesState.items;
      const existing = currentItems.find((fav) => fav.nasaId === cleanNasaId);

      if (existing) {
        // If it has a ground journal entry, confirm before removing
        if (hasJournalEntry(existing)) {
          Alert.alert(
            'Remove from Favourites?',
            'This observation has a personal ground note or photo. Removing it from favourites will permanently delete your ground journal entry.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  await executeRemoval(cleanNasaId);
                  onToggled?.(false);
                },
              },
            ]
          );
          return;
        }

        await executeRemoval(cleanNasaId);
        onToggled?.(false);
      } else {
        // Add to favourites
        dispatch(
          toggleFavouriteItem({
            userId,
            item: {
              ...item,
              nasaId: cleanNasaId,
            },
          })
        );

        const updatedItems: FavouriteItem[] = [
          {
            ...item,
            nasaId: cleanNasaId,
            savedAt: new Date().toISOString(),
            journal: null,
          },
          ...currentItems,
        ];

        try {
          await saveUserFavourites(userId, updatedItems);
        } catch (err) {
          console.error('Failed to persist favourite addition:', err);
        }
        onToggled?.(true);
      }
    },
    [userId, favouritesState.items, dispatch, executeRemoval]
  );

  const saveJournalEntry = useCallback(
    async (
      nasaId: string,
      note: string,
      photoUri: string | null
    ): Promise<void> => {
      if (!userId) {
        throw new Error('You must be signed in to save journal notes.');
      }

      // Prevent in-flight edit from committing if user switched accounts
      if (String(activeUserIdRef.current) !== String(userId)) {
        throw new Error('User account changed during editing. Save aborted.');
      }

      const cleanNasaId = nasaId.trim();
      const cleanNote = note.trim().slice(0, 300);
      const isBlank = cleanNote.length === 0 && !photoUri;

      const journal: JournalEntry | null = isBlank
        ? null
        : {
            note: cleanNote,
            photoUri: photoUri || null,
            updatedAt: new Date().toISOString(),
          };

      // Optimistically dispatch to Redux
      dispatch(
        updateJournalEntry({
          userId,
          nasaId: cleanNasaId,
          journal,
        })
      );

      const updatedItems = favouritesState.items.map((fav) => {
        if (fav.nasaId === cleanNasaId) {
          return {
            ...fav,
            journal,
          };
        }
        return fav;
      });

      try {
        await saveUserFavourites(userId, updatedItems);
      } catch (err: any) {
        console.error('Failed to save journal to storage:', err);
        throw new Error(err?.message || 'Failed to save journal entry. Please retry.');
      }
    },
    [userId, favouritesState.items, dispatch]
  );

  const retryRestore = useCallback(() => {
    if (userId !== null && userId !== undefined) {
      restoreForUser(userId);
    }
  }, [userId, restoreForUser]);

  return {
    items: favouritesState.items,
    isRestoring: favouritesState.isRestoring,
    restoreError: favouritesState.restoreError,
    activeUserId: favouritesState.activeUserId,
    isFavourite,
    getFavourite,
    toggleFavourite,
    removeFavourite,
    saveJournalEntry,
    retryRestore,
  };
}
