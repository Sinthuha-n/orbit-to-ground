import { useCallback, useEffect, useRef } from 'react';

import {
  loadUserFavourites,
  saveUserFavourites,
} from '@/services/favourites-storage';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearFavouritesView,
  removeFavouriteItem,
  setActiveUser,
  setFavourites,
  setRestoreError,
  setRestoring,
  toggleFavouriteItem,
} from '@/store/slices/favourites-slice';
import { FavouriteItem, ToggleFavouritePayload } from '@/types/favourites';

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

  const toggleFavourite = useCallback(
    async (item: ToggleFavouritePayload) => {
      if (!userId) return;
      const cleanNasaId = item.nasaId.trim();
      const currentItems = favouritesState.items;
      const alreadyFav = currentItems.some((fav) => fav.nasaId === cleanNasaId);

      // Optimistically update Redux
      dispatch(
        toggleFavouriteItem({
          userId,
          item: {
            ...item,
            nasaId: cleanNasaId,
          },
        })
      );

      // Compute next array for AsyncStorage persistence
      let updatedItems: FavouriteItem[];
      if (alreadyFav) {
        updatedItems = currentItems.filter((fav) => fav.nasaId !== cleanNasaId);
      } else {
        updatedItems = [
          {
            ...item,
            nasaId: cleanNasaId,
            savedAt: new Date().toISOString(),
          },
          ...currentItems,
        ];
      }

      try {
        await saveUserFavourites(userId, updatedItems);
      } catch (err) {
        console.error('Failed to persist favourite change:', err);
      }
    },
    [userId, favouritesState.items, dispatch]
  );

  const removeFavourite = useCallback(
    async (nasaId: string) => {
      if (!userId) return;
      const cleanNasaId = nasaId.trim();
      dispatch(removeFavouriteItem({ userId, nasaId: cleanNasaId }));

      const updatedItems = favouritesState.items.filter(
        (fav) => fav.nasaId !== cleanNasaId
      );

      try {
        await saveUserFavourites(userId, updatedItems);
      } catch (err) {
        console.error('Failed to persist removal:', err);
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
    toggleFavourite,
    removeFavourite,
    retryRestore,
  };
}
