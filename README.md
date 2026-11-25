# Orbit to Ground 🌍🛰️

**IN3210 Mobile Application Development — Assignment 2**  
- **Student Index**: `234197U`  
- **Domain**: Space & Science (NASA Earth Observation Imagery)  
- **Required Twist**: Personal Notes & Photos ("From Orbit" vs "From Ground" Field Journal)  
- **Submission Deadline**: 13 December 2026, 11:59 PM  

---

## 1. Project Overview & Purpose

**Orbit to Ground** is a mobile application built with **React Native**, **Expo (SDK 58)**, and **TypeScript** designed to bridge orbital Earth observations with ground-level personal perspectives.

Astronauts and Earth-observing satellites frequently photograph dynamic landforms—such as river deltas, coastal estuaries, and geological faults—from hundreds of kilometers above. **Orbit to Ground** allows science enthusiasts and field researchers to:
1. Browse high-resolution NASA satellite photography of Earth's river deltas and coastal landscapes.
2. View detailed observation records, flight centers, creation dates, and scientific metadata.
3. Save favourite observations to a persistent, per-user collection.
4. Record **"From Ground" field journal entries**: attach personal landscape comparison photos taken via camera or chosen from device gallery, paired with a concise field note (300-character limit with a live counter).

---

## 2. NASA API Choice & Justification

- **API Used**: [NASA Image and Video Library API](https://images-api.nasa.gov/)
  - **Search Endpoint**: `https://images-api.nasa.gov/search?media_type=image&q=river+delta`
  - **Asset Manifest Endpoint**: `https://images-api.nasa.gov/asset/{nasa_id}`
- **Justification**:
  - **No API Key Required & Zero Rate Limiting Friction**: Completely public and CORS-compatible, eliminating fragile setup requirements during evaluation.
  - **Curated Scientific Dataset**: The focused query `q=river+delta` surfaces actual astronaut photography from the International Space Station (ISS) and Space Shuttle missions (e.g., Nile, Mississippi, Godavari, and Amazon river deltas).
  - **Two-Stage Asset Resolution**: NASA search records provide thumbnails and metadata, while the asset manifest endpoint provides verified direct high-resolution URLs (`~orig.jpg`, `~large.jpg`, `~medium.jpg`), ensuring resilience against broken CDN links.
  - **Stable Identifier**: Every NASA item includes an immutable `nasa_id` (e.g., `sts41g-120-175`), which acts as the stable key for route parameters, RTK Query caches, and per-user favourites.

---

## 3. Architecture & Tech Stack

```
src/
├── app/                      # Expo Router (file-based navigation)
│   ├── (auth)/               # Unauthenticated stack (Login, Register)
│   ├── (tabs)/               # Authenticated bottom tabs (Home, Explore, Favourites)
│   │   ├── explore.tsx       # Live NASA imagery discovery FlatList
│   │   ├── favourites.tsx    # Per-user saved observations with journal previews
│   │   └── index.tsx         # Welcome / overview screen
│   ├── details/
│   │   └── [nasaId].tsx      # Observation Details (From Orbit vs From Ground)
│   └── _layout.tsx           # Root stack, route guards, session restoration
├── components/               # Accessible, themed UI components
│   ├── favourite-button.tsx  # Feather heart toggle button with 44x44 touch target
│   ├── ground-journal-editor.tsx # Camera/gallery picker & 300-char note editor
│   ├── observation-card.tsx  # NASA card with image fallback & journal badges
│   └── themed-text.tsx       # Themed typography tokens
├── hooks/                    # Custom application hooks
│   ├── use-auth-session.ts   # Session restoration, login, logout, registration
│   ├── use-favourites.ts     # Favourites & journal sync, safe unfavourite alerts
│   └── use-theme.ts          # Color scheme theme hook
├── services/                 # Native hardware & storage services
│   ├── favourites-storage.ts # User-scoped AsyncStorage persistence
│   ├── photo-storage.ts      # App-owned FileSystem persistent image storage
│   └── secure-storage.ts     # Hardware-backed SecureStore for auth tokens
├── store/                    # Redux Toolkit & RTK Query
│   ├── api/
│   │   ├── auth-api.ts       # DummyJSON authentication RTK Query endpoints
│   │   └── nasa-api.ts       # NASA imagery RTK Query search & details cache
│   ├── slices/
│   │   ├── auth-slice.ts     # Auth session Redux slice
│   │   └── favourites-slice.ts # Per-user favourites & journal Redux slice
│   └── index.ts              # Configured Redux store
└── types/                    # Strict TypeScript definitions
    ├── auth.ts               # User & session types
    ├── favourites.ts         # FavouriteItem & JournalEntry interfaces
    └── nasa.ts               # NASA raw and sanitized observation models
```

### Key Libraries
- **Framework**: Expo SDK 58 (React Native 0.88, React 19)
- **Routing**: Expo Router v58 (file-based typed routes)
- **State Management**: Redux Toolkit & RTK Query (`@reduxjs/toolkit`, `react-redux`)
- **Media & Hardware**: `expo-image-picker`, `expo-file-system`, `expo-image`
- **Security & Storage**: `expo-secure-store`, `@react-native-async-storage/async-storage`
- **Icons**: `@expo/vector-icons` (Feather)

---

## 4. State Management & Three-Tier Storage Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Redux Toolkit Store                  │
│   ┌────────────────────┐      ┌────────────────────┐   │
│   │     auth-slice     │      │  favourites-slice  │   │
│   └─────────┬──────────┘      └─────────┬──────────┘   │
└─────────────┼───────────────────────────┼──────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│   Hardware SecureStore  │   │       AsyncStorage       │
│  - User Auth Token      │   │  - Saved Favourites      │
│  - Kept out of logs     │   │  - Scoped by User ID     │
│  - Kept out of storage  │   │  - Note Metadata         │
└─────────────────────────┘   └───────────┬──────────────┘
                                          │
                                          ▼
                              ┌──────────────────────────┐
                              │ App FileSystem Directory │
                              │  - App-owned JPEG files  │
                              │  - No ephemeral URIs     │
                              │  - Cleaned on unfavourite│
                              └──────────────────────────┘
```

1. **Hardware Tier (`expo-secure-store`)**: Stores authentication tokens securely. Tokens are never written to `AsyncStorage`, Redux persistence, or console logs.
2. **Metadata Tier (`@react-native-async-storage/async-storage`)**: Stores favourite items and journal text metadata, scoped strictly per user (`orbit_favourites_user_<userId>`). This prevents account data leakage.
3. **File System Tier (`expo-file-system`)**: Stores personal ground photos under `${FileSystem.documentDirectory}orbit_ground_photos/user_<userId>/<nasaId>/`. Temporary picker cache URIs are copied into permanent storage; obsolete or unfavourited photos are deleted from disk to prevent storage leaks.

---

## 5. Key Architectural Decisions

### Decision 1: Typed Parameter-Only Routing over Payload Passing
- **Context**: When navigating from an Explore card to the Details screen, some mobile architectures serialize the entire card object into route parameters.
- **Decision**: Orbit to Ground passes only the typed string parameter `/details/[nasaId]`. The Details screen independently fetches the observation using the RTK Query cache.
- **Why**: Passing full payloads leads to state drift, breaks deep-linking and reload restoration, and violates clean route separation. Passing only `nasaId` guarantees the Details screen remains self-sufficient and bookmarkable.

### Decision 2: Three-Tier Storage Isolation (SecureStore vs AsyncStorage vs FileSystem)
- **Context**: Mobile apps must manage tokens, structured collections, and binary photos. Storing binary image data or base64 strings in `AsyncStorage` causes severe performance degradation and cursor crashes.
- **Decision**: Partitioned data storage across three dedicated systems: hardware `SecureStore` for auth tokens, `AsyncStorage` for JSON metadata (scoped by user ID), and app-owned `FileSystem.documentDirectory` for ground photo binaries.
- **Why**: Guarantees maximum hardware-level security for credentials, eliminates AsyncStorage quota exhaustion, and ensures photos survive OS cache purges.

### Decision 3: Safe Unfavourite Safeguard with Disk Purging
- **Context**: Users might accidentally tap the heart icon on an observation that contains carefully written field notes and a comparison photo.
- **Decision**: If an observation has an active journal entry (`hasJournalEntry(item)`), tapping unfavourite triggers a native confirmation dialog (`Alert.alert`). If confirmed, both the favourite metadata and the observation's photo directory on disk are purged.
- **Why**: Prevents irreversible accidental data loss while ensuring deleted observations do not leave orphaned image files consuming user storage.

---

## 6. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or higher, v20+ recommended)
- npm or bun
- Samsung S21 Ultra or any physical Android/iOS device with the **Expo Go** app installed (or an Android emulator/iOS simulator)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite & Typecheck
```bash
npm test
npm run typecheck
```

### 3. Start Development Server
```bash
npx expo start
```
- Press `a` for Android Emulator.
- Press `w` for Web Preview.
- Scan the displayed QR code using the **Expo Go** app on your Samsung S21 Ultra.

---

## 7. Demo Account Credentials (DummyJSON)

The app validates against the DummyJSON authentication service:
- **Username**: `emilys`
- **Password**: `emilyspass`
- *(Alternative Account)*: `michaelw` / `michaelwpass`

---

## 8. Screenshot Gallery & Verification Checklist

| Screen | File / Area | Verification Status |
| --- | --- | --- |
| **Login / Register** | `src/app/(auth)/login.tsx` | Validated field errors, DummyJSON auth, SecureStore token save |
| **Explore** | `src/app/(tabs)/explore.tsx` | Live NASA API search, FlatList, pull-to-refresh, retryable error |
| **Details (From Orbit)** | `src/app/details/[nasaId].tsx` | Satellite imagery, center attribution, full observation description |
| **Details (From Ground)** | `src/components/ground-journal-editor.tsx` | Camera & gallery picker, 300-char note editor, live counter |
| **Favourites Tab** | `src/app/(tabs)/favourites.tsx` | Saved collection, note snippets, ground journal indicator |
| **Unfavourite Safeguard** | `src/hooks/use-favourites.ts` | Native confirmation modal before deleting journal data |

> **Note for Evaluators**: If capturing screenshots on a physical device, capture:
> 1. `01-login-screen.png` — Login screen with validation.
> 2. `02-explore-screen.png` — NASA river delta discovery feed.
> 3. `03-details-orbit.png` — Details screen showing "From Orbit" satellite imagery.
> 4. `04-details-ground-journal.png` — "From Ground" section with attached photo and note.
> 5. `05-favourites-tab.png` — Favourites tab showing saved cards with journal badges.
> 6. `06-unfavourite-alert.png` — Confirmation alert when attempting to remove an entry with journal data.
