import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  FavouriteItem,
  JournalEntry,
  ToggleFavouritePayload,
} from '@/types/favourites';

export interface FavouritesState {
  activeUserId: number | string | null;
  items: FavouriteItem[];
  isRestoring: boolean;
  restoreError: string | null;
}

const initialState: FavouritesState = {
  activeUserId: null,
  items: [],
  isRestoring: false,
  restoreError: null,
};

export const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    setActiveUser: (state, action: PayloadAction<number | string | null>) => {
      const nextUserId = action.payload ?? null;
      if (state.activeUserId !== nextUserId) {
        state.activeUserId = nextUserId;
        state.items = [];
        state.isRestoring = Boolean(nextUserId);
        state.restoreError = null;
      }
    },
    setRestoring: (
      state,
      action: PayloadAction<{ userId: number | string; isRestoring: boolean }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        state.isRestoring = action.payload.isRestoring;
      }
    },
    setRestoreError: (
      state,
      action: PayloadAction<{ userId: number | string; error: string | null }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        state.restoreError = action.payload.error;
        state.isRestoring = false;
      }
    },
    setFavourites: (
      state,
      action: PayloadAction<{ userId: number | string; items: FavouriteItem[] }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        // Enforce deduplication by nasaId
        const seen = new Set<string>();
        state.items = action.payload.items.filter((item) => {
          if (!item?.nasaId || seen.has(item.nasaId)) return false;
          seen.add(item.nasaId);
          return true;
        });
        state.isRestoring = false;
        state.restoreError = null;
      }
    },
    toggleFavouriteItem: (
      state,
      action: PayloadAction<{ userId: number | string; item: ToggleFavouritePayload }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        const { item } = action.payload;
        const index = state.items.findIndex((fav) => fav.nasaId === item.nasaId);

        if (index >= 0) {
          // Remove from favourites
          state.items.splice(index, 1);
        } else {
          // Add to start of favourites
          state.items.unshift({
            ...item,
            savedAt: new Date().toISOString(),
          });
        }
      }
    },
    removeFavouriteItem: (
      state,
      action: PayloadAction<{ userId: number | string; nasaId: string }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        state.items = state.items.filter((fav) => fav.nasaId !== action.payload.nasaId);
      }
    },
    updateJournalEntry: (
      state,
      action: PayloadAction<{
        userId: number | string;
        nasaId: string;
        journal: JournalEntry | null;
      }>
    ) => {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        const item = state.items.find((fav) => fav.nasaId === action.payload.nasaId);
        if (item) {
          item.journal = action.payload.journal;
        }
      }
    },
    clearFavouritesView: (state) => {
      state.activeUserId = null;
      state.items = [];
      state.isRestoring = false;
      state.restoreError = null;
    },
  },
});

export const {
  setActiveUser,
  setRestoring,
  setRestoreError,
  setFavourites,
  toggleFavouriteItem,
  removeFavouriteItem,
  updateJournalEntry,
  clearFavouritesView,
} = favouritesSlice.actions;

export default favouritesSlice.reducer;
