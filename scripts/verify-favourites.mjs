import assert from 'node:assert/strict';

// In-memory mock of AsyncStorage
const mockStorage = new Map();
const mockAsyncStorage = {
  getItem: async (key) => mockStorage.get(key) ?? null,
  setItem: async (key, val) => mockStorage.set(key, val),
  clear: async () => mockStorage.clear(),
};

const STORAGE_KEY_PREFIX = 'orbit_favourites_user_';
function getFavouritesStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

async function loadUserFavourites(userId) {
  const key = getFavouritesStorageKey(userId);
  const raw = await mockAsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const sanitized = [];
    for (const item of parsed) {
      if (item && typeof item.nasaId === 'string' && item.nasaId.trim()) {
        const id = item.nasaId.trim();
        if (!seen.has(id)) {
          seen.add(id);
          const journal =
            item.journal && typeof item.journal === 'object'
              ? {
                  note:
                    typeof item.journal.note === 'string'
                      ? item.journal.note.slice(0, 300)
                      : '',
                  photoUri:
                    typeof item.journal.photoUri === 'string'
                      ? item.journal.photoUri
                      : null,
                  updatedAt:
                    typeof item.journal.updatedAt === 'string'
                      ? item.journal.updatedAt
                      : new Date().toISOString(),
                }
              : null;

          sanitized.push({
            nasaId: id,
            title: typeof item.title === 'string' ? item.title.trim() : 'Untitled Observation',
            thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl : null,
            center: typeof item.center === 'string' ? item.center : null,
            dateCreated: typeof item.dateCreated === 'string' ? item.dateCreated : null,
            savedAt: typeof item.savedAt === 'string' ? item.savedAt : new Date().toISOString(),
            journal,
          });
        }
      }
    }
    return sanitized;
  } catch {
    throw new Error('Failed to parse saved favourites data');
  }
}

async function saveUserFavourites(userId, items) {
  const key = getFavouritesStorageKey(userId);
  const seen = new Set();
  const uniqueItems = items.filter((item) => {
    if (!item?.nasaId || seen.has(item.nasaId)) return false;
    seen.add(item.nasaId);
    return true;
  });
  await mockAsyncStorage.setItem(key, JSON.stringify(uniqueItems));
}

function hasJournalEntry(item) {
  if (!item?.journal) return false;
  const hasNote = Boolean(item.journal.note && item.journal.note.trim().length > 0);
  const hasPhoto = Boolean(item.journal.photoUri && item.journal.photoUri.trim().length > 0);
  return hasNote || hasPhoto;
}

// Redux reducer simulation
function favouritesReducer(state, action) {
  switch (action.type) {
    case 'setActiveUser': {
      const nextUserId = action.payload ?? null;
      if (state.activeUserId !== nextUserId) {
        return {
          activeUserId: nextUserId,
          items: [],
          isRestoring: Boolean(nextUserId),
          restoreError: null,
        };
      }
      return state;
    }
    case 'setRestoring': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        return { ...state, isRestoring: action.payload.isRestoring };
      }
      return state;
    }
    case 'setRestoreError': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        return { ...state, restoreError: action.payload.error, isRestoring: false };
      }
      return state;
    }
    case 'setFavourites': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        const seen = new Set();
        const items = action.payload.items.filter((item) => {
          if (!item?.nasaId || seen.has(item.nasaId)) return false;
          seen.add(item.nasaId);
          return true;
        });
        return { ...state, items, isRestoring: false, restoreError: null };
      }
      return state;
    }
    case 'toggleFavouriteItem': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        const { item } = action.payload;
        const exists = state.items.some((fav) => fav.nasaId === item.nasaId);
        let items;
        if (exists) {
          items = state.items.filter((fav) => fav.nasaId !== item.nasaId);
        } else {
          items = [{ ...item, savedAt: new Date().toISOString(), journal: null }, ...state.items];
        }
        return { ...state, items };
      }
      return state;
    }
    case 'removeFavouriteItem': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        return {
          ...state,
          items: state.items.filter((fav) => fav.nasaId !== action.payload.nasaId),
        };
      }
      return state;
    }
    case 'updateJournalEntry': {
      if (String(state.activeUserId) === String(action.payload.userId)) {
        return {
          ...state,
          items: state.items.map((fav) => {
            if (fav.nasaId === action.payload.nasaId) {
              return {
                ...fav,
                journal: action.payload.journal,
              };
            }
            return fav;
          }),
        };
      }
      return state;
    }
    case 'clearFavouritesView': {
      return {
        activeUserId: null,
        items: [],
        isRestoring: false,
        restoreError: null,
      };
    }
    default:
      return state;
  }
}

async function runTests() {
  console.log('--- Testing Favourites & Journal Storage & Redux Slice ---');

  // Test 1: Storage Key Scoping
  assert.equal(getFavouritesStorageKey(1), 'orbit_favourites_user_1');
  assert.equal(getFavouritesStorageKey(15), 'orbit_favourites_user_15');
  console.log('✓ Storage key scoping verified');

  // Test 2: Backwards Compatibility (Old favourites without journal property)
  const legacyItems = [
    {
      nasaId: 'legacy-001',
      title: 'Legacy Observation without Journal',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      savedAt: '2026-11-20T00:00:00Z',
    },
  ];
  await saveUserFavourites(10, legacyItems);
  const loadedLegacy = await loadUserFavourites(10);
  assert.equal(loadedLegacy.length, 1);
  assert.equal(loadedLegacy[0].journal, null);
  assert.equal(hasJournalEntry(loadedLegacy[0]), false);
  console.log('✓ Backward compatibility verified: legacy favourites load with journal: null');

  // Test 3: Note By Itself, Photo By Itself, and Both
  const itemWithNoteOnly = {
    nasaId: 'iss-note-only',
    title: 'Ganges Delta',
    thumbnailUrl: 'https://example.com/ganges.jpg',
    savedAt: '2026-11-25T10:00:00Z',
    journal: {
      note: 'Observed muddy brown sediment river plume near coast.',
      photoUri: null,
      updatedAt: '2026-11-25T10:05:00Z',
    },
  };

  const itemWithPhotoOnly = {
    nasaId: 'iss-photo-only',
    title: 'Nile Delta',
    thumbnailUrl: 'https://example.com/nile.jpg',
    savedAt: '2026-11-25T10:10:00Z',
    journal: {
      note: '',
      photoUri: 'file:///data/user/0/host.exp.exponent/files/orbit_ground_photos/user_1/nile/ground_123.jpg',
      updatedAt: '2026-11-25T10:15:00Z',
    },
  };

  const itemWithBoth = {
    nasaId: 'iss-both',
    title: 'San Francisco Bay',
    thumbnailUrl: 'https://example.com/sf.jpg',
    savedAt: '2026-11-25T10:20:00Z',
    journal: {
      note: 'Walked the salt marsh trail at sunset.',
      photoUri: 'file:///data/user/0/host.exp.exponent/files/orbit_ground_photos/user_1/sf/ground_456.jpg',
      updatedAt: '2026-11-25T10:25:00Z',
    },
  };

  await saveUserFavourites(1, [itemWithNoteOnly, itemWithPhotoOnly, itemWithBoth]);
  const loadedMulti = await loadUserFavourites(1);
  assert.equal(loadedMulti.length, 3);
  assert.equal(hasJournalEntry(loadedMulti[0]), true);
  assert.equal(hasJournalEntry(loadedMulti[1]), true);
  assert.equal(hasJournalEntry(loadedMulti[2]), true);
  console.log('✓ Note-only, photo-only, and note+photo entries saved and identified correctly');

  // Test 4: 300-Character Note Limit Enforcement
  const overlyLongNote = 'A'.repeat(500);
  const itemLong = {
    nasaId: 'iss-long',
    title: 'Long Note Test',
    thumbnailUrl: null,
    savedAt: '2026-11-25T10:30:00Z',
    journal: {
      note: overlyLongNote,
      photoUri: null,
      updatedAt: '2026-11-25T10:30:00Z',
    },
  };
  await saveUserFavourites(1, [itemLong]);
  const loadedLong = await loadUserFavourites(1);
  assert.equal(loadedLong[0].journal.note.length, 300);
  console.log('✓ 300-character limit truncation on note verified');

  // Test 5: Redux Journal Operations: Independent Edit and Remove
  let state = {
    activeUserId: 1,
    items: [itemWithBoth],
    isRestoring: false,
    restoreError: null,
  };

  // 5a. Remove photo independently: note remains intact
  state = favouritesReducer(state, {
    type: 'updateJournalEntry',
    payload: {
      userId: 1,
      nasaId: 'iss-both',
      journal: {
        note: 'Walked the salt marsh trail at sunset.',
        photoUri: null,
        updatedAt: '2026-11-25T11:00:00Z',
      },
    },
  });
  assert.equal(state.items[0].journal.note, 'Walked the salt marsh trail at sunset.');
  assert.equal(state.items[0].journal.photoUri, null);
  console.log('✓ Remove photo independently preserves note');

  // 5b. Clear note independently: photo remains intact (simulate re-adding photo first)
  state = favouritesReducer(state, {
    type: 'updateJournalEntry',
    payload: {
      userId: 1,
      nasaId: 'iss-both',
      journal: {
        note: '',
        photoUri: 'file:///photo_new.jpg',
        updatedAt: '2026-11-25T11:05:00Z',
      },
    },
  });
  assert.equal(state.items[0].journal.note, '');
  assert.equal(state.items[0].journal.photoUri, 'file:///photo_new.jpg');
  console.log('✓ Clear note independently preserves photo');

  // 5c. Replace photo independently: note remains intact
  state = favouritesReducer(state, {
    type: 'updateJournalEntry',
    payload: {
      userId: 1,
      nasaId: 'iss-both',
      journal: {
        note: 'New field observation.',
        photoUri: 'file:///photo_replaced.jpg',
        updatedAt: '2026-11-25T11:10:00Z',
      },
    },
  });
  assert.equal(state.items[0].journal.note, 'New field observation.');
  assert.equal(state.items[0].journal.photoUri, 'file:///photo_replaced.jpg');
  console.log('✓ Replace photo independently preserves note');

  // Test 6: In-Flight Edit Isolation Across Switched Users
  state = favouritesReducer(state, {
    type: 'updateJournalEntry',
    payload: {
      userId: 999, // wrong user!
      nasaId: 'iss-both',
      journal: {
        note: 'Malicious overwrite',
        photoUri: null,
      },
    },
  });
  assert.equal(state.items[0].journal.note, 'New field observation.', 'Must reject edits from other users');
  console.log('✓ In-flight edit isolation verified across different accounts');

  // Test 7: Confirmation Condition on Unfavourite
  const itemWithoutJournal = {
    nasaId: 'iss-clean',
    title: 'Clean Item',
    thumbnailUrl: null,
    savedAt: '2026-11-25T10:00:00Z',
    journal: null,
  };
  assert.equal(hasJournalEntry(itemWithoutJournal), false, 'No confirm needed for empty journal');
  assert.equal(hasJournalEntry(state.items[0]), true, 'Confirm REQUIRED when journal note/photo exists');
  console.log('✓ Confirmation trigger verified: only items with notes or photos require confirmation before unfavouriting');

  console.log('\nAll Favourites & Journal verification tests PASSED! ✨');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
