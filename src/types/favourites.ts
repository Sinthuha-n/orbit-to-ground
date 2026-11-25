export interface JournalEntry {
  note: string;
  photoUri: string | null;
  updatedAt: string;
}

export interface FavouriteItem {
  nasaId: string;
  title: string;
  thumbnailUrl: string | null;
  center?: string | null;
  dateCreated?: string | null;
  savedAt: string;
  journal?: JournalEntry | null;
}

export type ToggleFavouritePayload = Omit<FavouriteItem, 'savedAt' | 'journal'>;

export interface SaveJournalPayload {
  nasaId: string;
  note: string;
  photoUri: string | null;
}

/**
 * Checks whether a favourite item has an active personal note or photo.
 */
export function hasJournalEntry(item?: FavouriteItem | null): boolean {
  if (!item?.journal) return false;
  const hasNote = Boolean(item.journal.note && item.journal.note.trim().length > 0);
  const hasPhoto = Boolean(item.journal.photoUri && item.journal.photoUri.trim().length > 0);
  return hasNote || hasPhoto;
}
