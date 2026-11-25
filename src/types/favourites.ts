export interface FavouriteItem {
  nasaId: string;
  title: string;
  thumbnailUrl: string | null;
  center?: string | null;
  dateCreated?: string | null;
  savedAt: string;
}

export type ToggleFavouritePayload = Omit<FavouriteItem, 'savedAt'>;
