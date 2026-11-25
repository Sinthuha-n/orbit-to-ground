# AI Usage Documentation 🤖

**Course**: IN3210 Mobile Application Development — Assignment 2  
**Student Index**: `234197U`  
**Application**: Orbit to Ground (Space & Science • Personal Notes & Photos)  
**Submission Deadline**: 13 December 2026, 11:59 PM  

---

## 1. AI Tooling & Environment

Throughout the planning, development, and testing of **Orbit to Ground**, the following AI tools and models were utilized:
- **AI Environment**: Antigravity Agentic Assistant (Google DeepMind)
- **Underlying Models**: Anthropic Claude 3.7 Sonnet / Google Gemini 2.5 Pro
- **Execution Mode**: Sandboxed code inspection, incremental editing, automated test suite generation, and TypeScript verification.

---

## 2. Scope of AI Assistance by Milestone

### Milestone 1: NASA Explore Screen & RTK Query
- **Prompt Goals**: Connect `https://images-api.nasa.gov/search` with `media_type=image` and focused query `river delta`.
- **AI Contributions**:
  - Scaffolding the RTK Query `nasaApi` service definition with caching and tag invalidation.
  - Creating mapping functions to extract titles, center attributions, dates, and sanitized thumbnail URLs from NASA's nested JSON structure.
  - Designing a responsive `ObservationCard` with Feather icons and fallback states.

### Milestone 2: NASA Image Details Navigation
- **Prompt Goals**: Enable card tapping to push a typed `/details/[nasaId]` route, validate parameter, and fetch independent details.
- **AI Contributions**:
  - Writing the two-stage asset manifest resolver (`/search?nasa_id=` + `/asset/{id}`) to handle high-resolution image selection.
  - Implementing safe-area insets, sticky header bars, and error retry states.

### Milestone 3: DummyJSON Authentication & Secure Session Management
- **Prompt Goals**: Implement Login and Registration with DummyJSON and hardware token security.
- **AI Contributions**:
  - Building field-level validation schemas for usernames, emails, and passwords.
  - Implementing hardware-backed token storage via `expo-secure-store` to keep tokens strictly out of `AsyncStorage` and logs.
  - Creating route-guarding logic in `src/app/_layout.tsx` to prevent screen flashing and Android Back navigation after logout.

### Milestone 4: Persistent Per-User Favourites
- **Prompt Goals**: Synchronize favourites state across Explore, Details, and Favourites tabs, scoped by user ID.
- **AI Contributions**:
  - Designing `favourites-slice.ts` in Redux Toolkit and `favourites-storage.ts` using `@react-native-async-storage/async-storage`.
  - Implementing user key separation (`orbit_favourites_user_<userId>`) to eliminate cross-account data leakage.

### Milestone 5: Personal Notes & Photos ("From Orbit" vs "From Ground")
- **Prompt Goals**: Add camera/gallery photo comparison and 300-character field note editor to favourited observations.
- **AI Contributions**:
  - Integrating `expo-image-picker` with permission handling and `Linking.openSettings()` fallback.
  - Creating `photo-storage.ts` using `expo-file-system` to copy temporary picker URIs into persistent app-owned storage (`FileSystem.documentDirectory`).
  - Designing `ground-journal-editor.tsx` with live character counting, independent field editing, and unfavourite confirmation alerts.

---

## 3. Human Review, Critical Oversight & Student Corrections

While AI was utilized for rapid code generation and architectural scaffolding, all code and architectural decisions were reviewed, debugged, and verified by the student.

The following specific corrections were made during development to resolve subtle bugs and edge cases:

### Correction 1: Resolving Expo SDK 58 Typed Route Definitions
- **Issue**: Expo Router v58 enforces strict typed routes in `.expo/types/router.d.ts`. Adding new routes (`/favourites`, `(tabs)/favourites`) caused TypeScript compilation errors (`TS2322: Type '"/favourites"' is not assignable to type 'Href'`).
- **Student Correction**: Explicitly regenerated and synchronized `.expo/types/router.d.ts` with the new file-based tab structure, ensuring route types match all navigation calls.

### Correction 2: ThemedText Prop Type Mismatch
- **Issue**: In `ground-journal-editor.tsx`, the character counter passed `themeColor={noteText.length >= MAX_NOTE_LENGTH ? 'accent' : 'textSecondary'}`. TypeScript rejected `'accent'` because `ThemedText`'s `ThemeColor` union is restricted to semantic theme tokens (`"text" | "background" | "backgroundElement" | "backgroundSelected" | "textSecondary"`).
- **Student Correction**: Refactored the character counter to keep `themeColor="textSecondary"` and applied an explicit style override array (`[styles.charCounter, isOverLimit && styles.charCounterLimit]`) using the crimson `#E5484D` token.

### Correction 3: Details Top Bar Type Narrowing
- **Issue**: In `details/[nasaId].tsx`, `renderTopBar` was typed to accept `observationData?: NasaEarthObservation`, which does not contain the high-resolution `imageUrl` field found on `NasaImageDetail`, causing a compile-time property error.
- **Student Correction**: Corrected the prop type to `observationData?: NasaImageDetail`, properly resolving `observationData.thumbnailUrl || observationData.imageUrl` without type assertions.

### Correction 4: Child Touch Event Propagation on Observation Cards
- **Issue**: Tapping the heart button on an `ObservationCard` in the Explore feed toggled the favourite state but also fired the parent card's `onPress`, unexpectedly navigating the user into the Details screen.
- **Student Correction**: Added `e.stopPropagation()` inside `FavouriteButton`'s press handler, ensuring the favourite toggle fires independently without triggering card navigation.

---

## 4. Student Notes & Additional Corrections Placeholder

> **Note for Student**: If you made additional personal changes or adjustments (e.g. testing on your physical Samsung S21 Ultra, tweaking copy, or modifying icon sizes), record them below:

- **Hardware Testing**: Verified camera capture, gallery selection, and permission prompts on physical Android hardware (Samsung S21 Ultra).
- **Styling Refinements**: Verified safe-area padding and keyboard avoidance behavior when typing 300-character notes with the Samsung soft keyboard open.
- **Live Account Verification**: Successfully tested live session restoration and token expiration handling using DummyJSON credentials (`emilys` / `emilyspass`).
