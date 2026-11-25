import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useFavourites } from '@/hooks/use-favourites';
import { useTheme } from '@/hooks/use-theme';
import {
  deleteGroundPhoto,
  saveGroundPhoto,
} from '@/services/photo-storage';

interface GroundJournalEditorProps {
  nasaId: string;
  title: string;
  thumbnailUrl: string | null;
  center?: string | null;
  dateCreated?: string | null;
}

const MAX_NOTE_LENGTH = 300;

export function GroundJournalEditor({
  nasaId,
  title,
  thumbnailUrl,
  center,
  dateCreated,
}: GroundJournalEditorProps) {
  const theme = useTheme();
  const { user } = useAuthSession();
  const { isFavourite, getFavourite, toggleFavourite, saveJournalEntry } =
    useFavourites();

  const isFav = isFavourite(nasaId);
  const favItem = getFavourite(nasaId);
  const currentJournal = favItem?.journal ?? null;

  // Local editing states
  const [noteText, setNoteText] = useState(currentJournal?.note || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  // Sync state when external favourite changes (e.g. after restore or account switch)
  useEffect(() => {
    setNoteText(currentJournal?.note || '');
    setPhotoError(false);
  }, [currentJournal]);

  const currentPhotoUri = currentJournal?.photoUri || null;
  const hasSavedNote = Boolean(currentJournal?.note && currentJournal.note.trim().length > 0);
  const hasSavedPhoto = Boolean(currentPhotoUri);
  const hasAnyJournal = hasSavedNote || hasSavedPhoto;

  // Handler for adding to favourites if not favourited yet
  const handleAddToFavourites = () => {
    toggleFavourite({
      nasaId,
      title,
      thumbnailUrl,
      center,
      dateCreated,
    });
  };

  // Camera capture handler
  const handleTakePhoto = async () => {
    try {
      setSaveError(null);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Orbit to Ground needs access to your camera to capture ground comparison photos. You can enable it in device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return; // User canceled; preserve existing photo
      }

      await applyNewGroundPhoto(result.assets[0].uri);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not launch camera.');
    }
  };

  // Gallery picker handler
  const handleChooseFromGallery = async () => {
    try {
      setSaveError(null);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Orbit to Ground needs access to your photo library to select ground landscape photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return; // User canceled; preserve existing photo
      }

      await applyNewGroundPhoto(result.assets[0].uri);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not access photo library.');
    }
  };

  // Photo application & persistent storage copy
  const applyNewGroundPhoto = async (tempPickerUri: string) => {
    if (!user?.id) {
      setSaveError('You must be signed in to save ground photos.');
      return;
    }

    setIsProcessingPhoto(true);
    setSaveError(null);
    setPhotoError(false);

    try {
      // Copy to persistent, app-owned storage
      const persistentUri = await saveGroundPhoto(
        user.id,
        nasaId,
        tempPickerUri,
        currentPhotoUri
      );

      // Persist reference to Redux & AsyncStorage
      await saveJournalEntry(nasaId, noteText, persistentUri);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save ground photo. Previous photo preserved.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Remove photo independently
  const handleRemovePhoto = async () => {
    if (!currentPhotoUri) return;
    const oldUri = currentPhotoUri;
    setIsProcessingPhoto(true);
    setSaveError(null);

    try {
      // Save entry with null photoUri (keeps note intact)
      await saveJournalEntry(nasaId, noteText, null);
      // Clean up file on disk
      await deleteGroundPhoto(oldUri);
    } catch (err: any) {
      setSaveError('Failed to remove photo reference.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Save or update note independently
  const handleSaveNote = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveJournalEntry(nasaId, noteText, currentPhotoUri);
      setIsEditingNote(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save note. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear note independently
  const handleClearNote = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveJournalEntry(nasaId, '', currentPhotoUri);
      setNoteText('');
      setIsEditingNote(false);
    } catch (err: any) {
      setSaveError('Failed to clear note.');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Not favourited state: Show invitation to favourite first
  if (!isFav) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <Feather name="map-pin" size={14} color={theme.text} />
            <ThemedText type="smallBold" style={styles.headerTitle}>
              From Ground • Field Journal
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.promptText}>
          What did you notice from the ground? Add this observation to your favourites to
          record personal field notes and ground comparison photos.
        </ThemedText>

        <Pressable
          onPress={handleAddToFavourites}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: '#E5484D' },
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add this observation to favourites to unlock field journal">
          <Feather name="heart" size={16} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>
            Add to Favourites to Start Journal
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // 2. Favourited state: Full Field Journal Editor
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Feather name="camera" size={15} color="#208AEF" />
          <ThemedText type="smallBold" style={styles.headerTitle}>
            From Ground • Personal Journal
          </ThemedText>
        </View>
        {hasAnyJournal ? (
          <View style={[styles.savedTag, { backgroundColor: 'rgba(32, 138, 239, 0.12)' }]}>
            <Feather name="check-circle" size={12} color="#208AEF" />
            <ThemedText type="code" style={styles.savedTagText}>
              Recorded
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.promptText}>
        What did you notice from the ground? Capture a similar local landscape or write
        field observations to contrast with orbital NASA imagery.
      </ThemedText>

      {/* Error banner with retry */}
      {saveError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color="#E5484D" />
          <ThemedText style={styles.errorBannerText}>{saveError}</ThemedText>
        </View>
      ) : null}

      {/* Ground Photo Section */}
      <View style={styles.photoSection}>
        <ThemedText type="smallBold" style={styles.subHeading}>
          Ground Landscape Photo
        </ThemedText>

        {isProcessingPhoto ? (
          <View style={[styles.photoLoadingBox, { backgroundColor: theme.backgroundSelected }]}>
            <ActivityIndicator size="small" color="#208AEF" />
            <ThemedText type="small" themeColor="textSecondary">
              Processing persistent ground photo...
            </ThemedText>
          </View>
        ) : currentPhotoUri && !photoError ? (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: currentPhotoUri }}
              style={styles.groundImage}
              contentFit="cover"
              transition={200}
              onError={() => setPhotoError(true)}
              accessibilityLabel="Ground comparison photo taken by user"
            />
            <View style={styles.photoActionRow}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Replace photo using camera">
                <Feather name="camera" size={14} color={theme.text} />
                <ThemedText style={styles.photoActionText}>Retake</ThemedText>
              </Pressable>

              <Pressable
                onPress={handleChooseFromGallery}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Replace photo from gallery">
                <Feather name="image" size={14} color={theme.text} />
                <ThemedText style={styles.photoActionText}>Replace</ThemedText>
              </Pressable>

              <Pressable
                onPress={handleRemovePhoto}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  { backgroundColor: 'rgba(229, 72, 77, 0.12)' },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Remove ground photo">
                <Feather name="trash-2" size={14} color="#E5484D" />
                <ThemedText style={[styles.photoActionText, { color: '#E5484D' }]}>
                  Remove
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyPhotoBox, { backgroundColor: theme.backgroundSelected }]}>
            <Feather name="image" size={32} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyPhotoText}>
              No ground photo attached yet
            </ThemedText>
            <View style={styles.photoButtonGroup}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: theme.text },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Take photo with camera">
                <Feather name="camera" size={15} color={theme.background} />
                <ThemedText style={[styles.secondaryButtonText, { color: theme.background }]}>
                  Take Photo
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleChooseFromGallery}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose photo from device gallery">
                <Feather name="image" size={15} color={theme.text} />
                <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>
                  From Gallery
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Field Note Section */}
      <View style={styles.noteSection}>
        <View style={styles.noteHeaderRow}>
          <ThemedText type="smallBold" style={styles.subHeading}>
            Field Observations Note
          </ThemedText>
          <ThemedText
            type="code"
            themeColor="textSecondary"
            style={[
              styles.charCounter,
              noteText.length >= MAX_NOTE_LENGTH && styles.charCounterLimit,
            ]}>
            {noteText.length}/{MAX_NOTE_LENGTH}
          </ThemedText>
        </View>

        {isEditingNote || !hasSavedNote ? (
          <View style={styles.editorBox}>
            <TextInput
              value={noteText}
              onChangeText={(text) => setNoteText(text.slice(0, MAX_NOTE_LENGTH))}
              placeholder="e.g. Looked at the sediment patterns along the river bend..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={MAX_NOTE_LENGTH}
              style={[
                styles.textInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSelected,
                  borderColor: 'rgba(128, 128, 128, 0.2)',
                },
              ]}
              accessibilityLabel="Personal ground observations note input"
              accessibilityHint="Enter up to 300 characters describing ground observations"
            />

            <View style={styles.noteActionsRow}>
              {noteText.trim().length > 0 ? (
                <Pressable
                  onPress={handleClearNote}
                  disabled={isSaving}
                  style={({ pressed }) => [
                    styles.clearButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear note">
                  <Feather name="x" size={14} color="#E5484D" />
                  <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
                </Pressable>
              ) : null}

              {hasSavedNote && isEditingNote ? (
                <Pressable
                  onPress={() => {
                    setNoteText(currentJournal?.note || '');
                    setIsEditingNote(false);
                  }}
                  disabled={isSaving}
                  style={({ pressed }) => [
                    styles.cancelEditButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <ThemedText style={styles.cancelEditText}>Cancel</ThemedText>
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleSaveNote}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.saveNoteButton,
                  { backgroundColor: theme.text },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save ground observations note">
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <>
                    <Feather name="check" size={15} color={theme.background} />
                    <ThemedText style={[styles.saveNoteText, { color: theme.background }]}>
                      Save Note
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.savedNoteCard, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="default" style={styles.savedNoteBody}>
              {currentJournal?.note}
            </ThemedText>
            <View style={styles.savedNoteFooter}>
              {currentJournal?.updatedAt ? (
                <ThemedText type="code" themeColor="textSecondary" style={styles.updatedAtText}>
                  Updated: {new Date(currentJournal.updatedAt).toLocaleDateString()}
                </ThemedText>
              ) : null}

              <View style={styles.savedNoteControls}>
                <Pressable
                  onPress={() => setIsEditingNote(true)}
                  style={({ pressed }) => [
                    styles.noteEditButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit saved note">
                  <Feather name="edit-2" size={13} color={theme.text} />
                  <ThemedText style={styles.noteEditText}>Edit</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleClearNote}
                  style={({ pressed }) => [
                    styles.noteEditButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Delete saved note">
                  <Feather name="trash-2" size={13} color="#E5484D" />
                  <ThemedText style={[styles.noteEditText, { color: '#E5484D' }]}>
                    Clear
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  savedTagText: {
    fontSize: 11,
    color: '#208AEF',
    fontWeight: '700',
  },
  promptText: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  errorBannerText: {
    color: '#E5484D',
    fontSize: 12,
    flex: 1,
  },
  photoSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoContainer: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  groundImage: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 36,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyPhotoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  emptyPhotoText: {
    fontSize: 13,
  },
  photoLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  photoButtonGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    minHeight: 46,
    marginTop: Spacing.one,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    minHeight: 40,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteSection: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCounter: {
    fontSize: 11,
  },
  charCounterLimit: {
    color: '#E5484D',
    fontWeight: '700',
  },
  editorBox: {
    gap: Spacing.two,
  },
  textInput: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  noteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#E5484D',
    fontWeight: '600',
  },
  cancelEditButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  cancelEditText: {
    fontSize: 12,
  },
  saveNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    minHeight: 38,
    minWidth: 100,
  },
  saveNoteText: {
    fontWeight: '700',
    fontSize: 13,
  },
  savedNoteCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  savedNoteBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  savedNoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
  },
  updatedAtText: {
    fontSize: 11,
  },
  savedNoteControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginLeft: 'auto',
  },
  noteEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  noteEditText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
