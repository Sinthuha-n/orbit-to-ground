import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const BASE_PHOTOS_DIR = 'orbit_ground_photos/';

/**
 * Returns the app-owned directory URI for a specific user and NASA observation.
 */
export function getGroundPhotoDirectory(userId: number | string, nasaId: string): string | null {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }
  const cleanId = encodeURIComponent(nasaId.trim());
  return `${FileSystem.documentDirectory}${BASE_PHOTOS_DIR}user_${userId}/${cleanId}/`;
}

/**
 * Copies a temporary picker URI into persistent, app-owned storage.
 * Deletes any superseded photo after the new file is confirmed written.
 */
export async function saveGroundPhoto(
  userId: number | string,
  nasaId: string,
  tempUri: string,
  existingPhotoUri?: string | null
): Promise<string> {
  // On web, file storage uses object URLs or base64
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return tempUri;
  }

  const dir = getGroundPhotoDirectory(userId, nasaId);
  if (!dir) return tempUri;

  // Ensure target directory exists
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const extension = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  const cleanExt = extension.length > 5 ? 'jpg' : extension;
  const fileName = `ground_${Date.now()}.${cleanExt}`;
  const destUri = `${dir}${fileName}`;

  // Copy into app-owned persistent storage
  await FileSystem.copyAsync({
    from: tempUri,
    to: destUri,
  });

  // Verify the new photo exists
  const info = await FileSystem.getInfoAsync(destUri);
  if (!info.exists) {
    throw new Error('Failed to verify copied ground photo in app storage');
  }

  // Clean up superseded old photo if it exists and is different
  if (existingPhotoUri && existingPhotoUri !== destUri && existingPhotoUri.startsWith('file://')) {
    try {
      await FileSystem.deleteAsync(existingPhotoUri, { idempotent: true });
    } catch (cleanupErr) {
      console.warn('Could not clean up superseded photo:', cleanupErr);
    }
  }

  return destUri;
}

/**
 * Deletes a ground photo file from app storage.
 */
export async function deleteGroundPhoto(photoUri?: string | null): Promise<void> {
  if (!photoUri || Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return;
  }

  if (photoUri.startsWith('file://')) {
    try {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    } catch (err) {
      console.warn('Error deleting photo file:', err);
    }
  }
}

/**
 * Deletes the entire directory containing photos for a specific NASA observation.
 * Used when an observation is unfavourited.
 */
export async function deleteNasaPhotoDirectory(
  userId: number | string,
  nasaId: string
): Promise<void> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return;
  }

  const dir = getGroundPhotoDirectory(userId, nasaId);
  if (dir) {
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch (err) {
      console.warn('Error deleting observation photo directory:', err);
    }
  }
}
