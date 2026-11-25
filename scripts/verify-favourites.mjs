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
          items = [{ ...item, savedAt: new Date().toISOString() }, ...state.items];
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
  console.log('--- Testing Favourites Storage & Redux Slice ---');

  // Test 1: Storage Key Scoping
  assert.equal(getFavouritesStorageKey(1), 'orbit_favourites_user_1');
  assert.equal(getFavouritesStorageKey(15), 'orbit_favourites_user_15');
  console.log('✓ Storage key scoping verified');

  // Test 2: Save and Load Favourites for User 1
  const user1Items = [
    {
      nasaId: 'iss064e001234',
      title: 'Mississippi River Delta',
      thumbnailUrl: 'https://images-assets.nasa.gov/image/1234~thumb.jpg',
      center: 'JSC',
      dateCreated: '2021-03-15T00:00:00Z',
      savedAt: '2026-11-25T10:00:00Z',
    },
    {
      nasaId: 'iss064e005678',
      title: 'Amazon River Plume',
      thumbnailUrl: 'https://images-assets.nasa.gov/image/5678~thumb.jpg',
      center: 'JSC',
      dateCreated: '2021-04-10T00:00:00Z',
      savedAt: '2026-11-25T11:00:00Z',
    },
  ];

  await saveUserFavourites(1, user1Items);
  const loaded1 = await loadUserFavourites(1);
  assert.equal(loaded1.length, 2);
  assert.equal(loaded1[0].nasaId, 'iss064e001234');
  assert.equal(loaded1[1].nasaId, 'iss064e005678');
  console.log('✓ User 1 favourites saved and loaded properly');

  // Test 3: Deduplication in Storage
  const duplicateList = [
    ...user1Items,
    {
      nasaId: 'iss064e001234', // duplicate
      title: 'Mississippi River Delta Duplicate',
      thumbnailUrl: null,
      savedAt: '2026-11-25T12:00:00Z',
    },
  ];
  await saveUserFavourites(1, duplicateList);
  const loadedDeduplicated = await loadUserFavourites(1);
  assert.equal(loadedDeduplicated.length, 2, 'Duplicate nasaId must be deduplicated');
  console.log('✓ Deduplication by nasaId verified in storage');

  // Test 4: User Isolation
  // User 2 should have 0 items even though User 1 has 2
  const loaded2 = await loadUserFavourites(2);
  assert.equal(loaded2.length, 0, 'User 2 must start with empty favourites');

  const user2Items = [
    {
      nasaId: 'as11-40-5874',
      title: 'Earthrise from Lunar Orbit',
      thumbnailUrl: 'https://images-assets.nasa.gov/image/5874~thumb.jpg',
      center: 'HQ',
      dateCreated: '1969-07-20T00:00:00Z',
      savedAt: '2026-11-25T13:00:00Z',
    },
  ];
  await saveUserFavourites(2, user2Items);

  const reloaded1 = await loadUserFavourites(1);
  const reloaded2 = await loadUserFavourites(2);
  assert.equal(reloaded1.length, 2, 'User 1 items must remain intact');
  assert.equal(reloaded2.length, 1, 'User 2 items must remain intact');
  assert.notEqual(reloaded1[0].nasaId, reloaded2[0].nasaId);
  console.log('✓ Account isolation verified: User 1 and User 2 lists do not collide');

  // Test 5: Redux Slice Reducer Transitions
  let state = {
    activeUserId: null,
    items: [],
    isRestoring: false,
    restoreError: null,
  };

  // Set active user 1
  state = favouritesReducer(state, { type: 'setActiveUser', payload: 1 });
  assert.equal(state.activeUserId, 1);
  assert.equal(state.isRestoring, true);

  // Set items for user 1
  state = favouritesReducer(state, {
    type: 'setFavourites',
    payload: { userId: 1, items: loaded1 },
  });
  assert.equal(state.items.length, 2);
  assert.equal(state.isRestoring, false);

  // Toggle remove existing item
  state = favouritesReducer(state, {
    type: 'toggleFavouriteItem',
    payload: { userId: 1, item: { nasaId: 'iss064e001234', title: 'Delta' } },
  });
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].nasaId, 'iss064e005678');
  console.log('✓ Toggle remove existing item verified');

  // Toggle add new item
  state = favouritesReducer(state, {
    type: 'toggleFavouriteItem',
    payload: { userId: 1, item: { nasaId: 'iss064e009999', title: 'Grand Canyon' } },
  });
  assert.equal(state.items.length, 2);
  assert.equal(state.items[0].nasaId, 'iss064e009999');
  console.log('✓ Toggle add new item verified');

  // Remove by ID
  state = favouritesReducer(state, {
    type: 'removeFavouriteItem',
    payload: { userId: 1, nasaId: 'iss064e009999' },
  });
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].nasaId, 'iss064e005678');
  console.log('✓ Remove item by nasaId verified');

  // Race condition protection: late dispatch for inactive user is ignored
  state = favouritesReducer(state, {
    type: 'setFavourites',
    payload: { userId: 999, items: [{ nasaId: 'hacker-data', title: 'Wrong' }] },
  });
  assert.equal(state.items.length, 1, 'Late update for different user must be ignored');
  console.log('✓ Race condition protection against inactive user updates verified');

  // Logout / clear favourites view
  state = favouritesReducer(state, { type: 'clearFavouritesView' });
  assert.equal(state.activeUserId, null);
  assert.equal(state.items.length, 0);
  assert.equal(state.isRestoring, false);
  console.log('✓ Clear in-memory favourites on logout verified');

  // Test 6: Storage Failure Handling
  mockStorage.set('orbit_favourites_user_corrupt', 'NOT_VALID_JSON{[');
  await assert.rejects(
    async () => await loadUserFavourites('corrupt'),
    /Failed to parse saved favourites data/
  );
  console.log('✓ Corrupt storage throws error to trigger retryable UI state');

  console.log('\nAll Favourites verification tests PASSED! ✨');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
