# Video Demo Shot List & Speaking Script 🎥

**Assignment**: IN3210 Mobile Application Development — Assignment 2  
**Student Index**: `234197U`  
**Application**: Orbit to Ground (Space & Science • Personal Notes & Photos)  
**Total Target Duration**: Under 3 minutes (180 seconds maximum)  

---

## Breakdown Timing Summary

| Segment | Timing | Duration | Focus |
| --- | --- | --- | --- |
| **Part 1: Live App Demo** | 0:00 – 1:05 | ~65 seconds | Login → Explore → Details → Favourite → Ground Journal → Restart |
| **Part 2: Code Walkthrough** | 1:05 – 2:45 | ~100 seconds | Navigation, Redux/RTK Query, Storage, Journal, Test Suite |
| **Part 3: Conclusion** | 2:45 – 3:00 | ~15 seconds | Wrap-up & submission readiness |

---

## Part 1: Live Mobile Demonstration (0:00 – 1:05)

### Shot 1 (0:00 – 0:15): Introduction & Authentication
- **Action on Screen**:
  - Open app on Samsung S21 Ultra (or Expo Go).
  - Show Login screen with Orbit to Ground title.
  - Fill in `emilys` and `emilyspass`. Tap **Sign In**.
- **Speaking Script**:
  > *"Hello, I am presenting Orbit to Ground for IN3210 Assignment 2. My student index is 234197U. My assigned domain is Space & Science and the required twist is Personal Notes & Photos. I begin by logging in with DummyJSON credentials. Auth tokens are validated and stored in hardware SecureStore."*

### Shot 2 (0:15 – 0:30): Explore Screen & NASA Imagery
- **Action on Screen**:
  - Show Explore screen feed displaying river deltas.
  - Scroll down smoothly past 2–3 cards. Pull down to trigger pull-to-refresh.
- **Speaking Script**:
  > *"The Explore feed pulls live satellite Earth observations from NASA's Image & Video Library focusing on river deltas. Each card displays NASA flight centers, mission IDs, titles, and descriptions with automatic image fallback."*

### Shot 3 (0:30 – 0:45): Details Navigation & Favourites
- **Action on Screen**:
  - Tap the first observation card (e.g., Nile River Delta).
  - Show the high-res "From Orbit" presentation.
  - Tap the **Heart** button in the header bar.
- **Speaking Script**:
  > *"Tapping an item pushes a typed route with only the NASA ID. The Details screen independently fetches the high-resolution record. Under 'From Orbit', we see the satellite view. Tapping the header heart icon adds it to favourites, updating our shared Redux state."*

### Shot 4 (0:45 – 1:05): "From Ground" Journal & Persistence Restart
- **Action on Screen**:
  - Scroll down to **From Ground • Personal Journal**.
  - Tap **Take Photo** (or **From Gallery**) to attach a ground photo.
  - Type a note: *"Walked along the delta sediment line at low tide."* (show the character counter `51/300`). Tap **Save Note**.
  - Swipe up to close Expo Go completely, then relaunch the app.
  - Go to the **Favourites** tab: show the saved card with the **Ground Journal** badge and note quote. Tap it to reopen Details.
- **Speaking Script**:
  > *"Now under 'From Ground', I attach a local ground comparison photo and enter a field observation within the 300-character limit. The photo is copied to app-owned persistent storage. I fully close and reopen the app: in the Favourites tab, my observation persists with a journal badge, and opening Details shows both my ground photo and note fully preserved."*

---

## Part 2: Narrated Code Walkthrough (1:05 – 2:45)

### Shot 5 (1:05 – 1:25): Navigation & Route Protection
- **Code on Screen**: Open `src/app/_layout.tsx` and `src/app/details/[nasaId].tsx`.
- **Speaking Script**:
  > *"In our codebase, we use Expo Router with file-based routing. In `_layout.tsx`, our session restoration hook checks hardware SecureStore on launch before rendering, protecting tabs and details screens. Navigation passes only the typed string parameter `nasaId`, ensuring routes are decoupled and deep-linkable."*

### Shot 6 (1:25 – 1:45): RTK Query & Redux State Management
- **Code on Screen**: Open `src/store/api/nasa-api.ts` and `src/store/slices/favourites-slice.ts`.
- **Speaking Script**:
  > *"For server state, RTK Query handles NASA API queries with a two-stage fallback: search records and asset manifests for high-resolution images. In `favourites-slice.ts`, favourites and journal entries are managed in Redux, keeping Explore, Details, and Favourites perfectly synchronized."*

### Shot 7 (1:45 – 2:10): Three-Tier Storage Architecture
- **Code on Screen**: Open `src/services/secure-storage.ts`, `src/services/favourites-storage.ts`, and `src/services/photo-storage.ts`.
- **Speaking Script**:
  > *"We enforce a strict three-tier storage architecture: hardware `expo-secure-store` for JWT tokens; `AsyncStorage` scoped by user ID for favourites and note metadata; and `expo-file-system` for persistent ground photos. Temporary picker URIs are copied into app-owned document directories, and superseded photos are cleanly deleted."*

### Shot 8 (2:10 – 2:30): Unfavourite Safeguard & Ground Journal Editor
- **Code on Screen**: Open `src/hooks/use-favourites.ts` (scroll to `removeFavourite` / `Alert.alert`) and `src/components/ground-journal-editor.tsx`.
- **Speaking Script**:
  > *"In `use-favourites.ts`, if an observation contains a ground note or photo, attempting to unfavourite prompts a native confirmation alert. If confirmed, it removes the favourite and purges its photo directory on disk, preventing orphaned files and accidental data loss."*

### Shot 9 (2:30 – 2:45): Verification Suite & TypeScript Checks
- **Code on Screen**: Show terminal running `npm test && npm run typecheck`.
- **Speaking Script**:
  > *"We have three comprehensive test suites covering authentication validation, NASA data mapping, and favourites isolation. Running `npm test` and `npm run typecheck` passes with zero errors."*

---

## Part 3: Conclusion (2:45 – 3:00)

### Shot 10 (2:45 – 3:00): Wrap-Up
- **Code / Screen**: Show GitHub repository page `https://github.com/Sinthuha-n/orbit-to-ground`.
- **Speaking Script**:
  > *"All requirements for Space & Science and Personal Notes & Photos have been implemented, tested, and published to our public GitHub repository for Assignment 2. Thank you!"*
