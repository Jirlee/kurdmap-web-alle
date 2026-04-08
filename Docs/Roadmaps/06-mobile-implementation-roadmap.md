# KurdMap Mobile App — Implementation Roadmap

> **Project:** `kurdmap-mobile`  
> **Stack:** React Native 0.76.9 + Expo SDK 52 + TypeScript 5.6 (strict)  
> **Last Updated:** April 2026  
> **Total Source:** 70+ files · 7,500+ lines · 0 TypeScript errors  
> **Purpose:** Complete feature tracker from foundation to production

---

## Table of Contents

1. [Project Audit Summary](#project-audit-summary)
2. [Completed Phases (1–8)](#completed-phases)
3. [Phase 9: Onboarding Flow](#phase-9-onboarding-flow)
4. [Phase 10: Password Reset](#phase-10-password-reset-flow)
5. [Phase 11: Privacy Policy & App Store Compliance](#phase-11-privacy-policy--app-store-compliance)
6. [Phase 12: Enhanced Search — Radius & City Selector](#phase-12-enhanced-search--radius--city-selector)
7. [Phase 13: Business Owner Portal](#phase-13-business-owner-portal)
8. [Phase 14: Push Notifications](#phase-14-push-notifications)
9. [Phase 15: Unit & Integration Tests](#phase-15-unit--integration-tests)
10. [Phase 16: Mobile CI/CD Pipeline](#phase-16-mobile-cicd-pipeline)
11. [Phase 17: Performance & Polish](#phase-17-performance--polish)
12. [Phase 18: Security Hardening](#phase-18-security-hardening)
13. [Phase 19: App Store Publishing](#phase-19-app-store-publishing)
14. [Post-Launch Operations](#post-launch-operations)
15. [Architecture Diagram](#architecture-diagram)

---

## Project Audit Summary

### ✅ Complete Features (Production-Ready)

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| Project setup & structure | ✅ 100% | `package.json`, `tsconfig.json`, `app.json` | Expo 52, TypeScript strict, 8 path aliases |
| Authentication (Login/Register) | ✅ 100% | `(auth)/login.tsx`, `(auth)/register.tsx` | JWT, SecureStore, auto-refresh with request queue |
| Home screen | ✅ 100% | `(tabs)/index.tsx` (217 lines) | Featured businesses, category grid, ad banner, nearby, pull-to-refresh |
| Business search + filters | ✅ 100% | `(tabs)/search.tsx` (356 lines) | FlashList infinite scroll, debounce, city/category/6-sort-options filter modal |
| Map view | ✅ 100% | `(tabs)/map.tsx` (198 lines) | Native MapView, markers + callouts, user location, web fallback |
| Business detail | ✅ 100% | `business/[slug].tsx` (457 lines) | Images, hours, services, menu, map, reviews, favorite, share, call, directions |
| Reviews (read + write) | ✅ 100% | `business/[slug]/reviews.tsx` (207 lines) | Auth-gated submission, star rating (1–5 interactive) |
| Favorites | ✅ 100% | `(tabs)/favorites.tsx` (157 lines) | Auth-gated, toggle, FlashList, unfavorite mutation |
| Profile & settings | ✅ 100% | `(tabs)/profile.tsx` (308 lines) | Language (4), theme (3), About/Contact nav, logout |
| About page | ✅ 100% | `about.tsx` (252 lines) | Mission, features grid, open source, version info |
| Contact page | ✅ 100% | `contact.tsx` (352 lines) | Info cards, form (name/email/message), success state |
| Category listing | ✅ 100% | `category/[id].tsx` (123 lines) | Infinite scroll filtered by category |
| i18n (4 languages) | ✅ 100% | `locales/{en,de,ku,kmr}.ts` | **135 keys each**, fully synchronized |
| RTL support | ✅ 100% | `hooks/useRtl.ts` | Kurdish Sorani forces `I18nManager.forceRTL` |
| Theme system | ✅ 100% | `theme/index.ts`, `ThemeContext.tsx` | Light/dark/system, design tokens, 79+26 lines |
| Offline detection | ✅ 100% | `OfflineBanner.tsx`, `useNetworkStatus.ts` | Red banner when no network |
| Skeleton loading | ✅ 100% | `Skeleton.tsx` (153 lines) | Shimmer + `HomeScreenSkeleton` + `BusinessCardSkeleton` |
| Animations | ✅ 100% | `Animations.tsx` (91 lines) | FadeInView, StaggerChildren, ScaleOnPress |
| 16 reusable components | ✅ 100% | `src/components/` (1,386 lines) | BusinessCard, SearchBar, ImageGallery, StarRating, etc. |
| API layer | ✅ 100% | `src/api/` (8 files, 215 lines) | Businesses, auth, favorites, reviews, ads, categories, cities |
| Secure storage | ✅ 100% | `auth-store.ts` | expo-secure-store for JWT tokens |
| Deep linking | ✅ 100% | `app.json` → `kurdmap://` | Configured scheme |
| API local testing | ✅ 100% | `client.ts`, `.env*`, `app.json` | Docker (8080), .NET (5110), Android 10.0.2.2 auto-fix |

### ⚠️ Partially Complete

| Feature | Status | Issue |
|---------|--------|-------|
| Contact form backend | ⚠️ 80% | UI complete, but form doesn't call any API — client-only success state |
| Haptic feedback | ✅ 100% | Centralized `src/utils/haptics.ts`, wired to favorites, tabs, detail |
| Geolocation search | ⚠️ 70% | Sends lat/lng for NearestFirst sort, but **no radius picker UI** (1/5/10/25/50 km) |

### ❌ Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| Onboarding screens | 🔴 High | `hasSeenOnboarding` flag exists in store but **no onboarding UI** |
| Password reset flow | 🔴 High | "Forgot password?" text exists on login screen but no flow |
| Privacy policy page | 🔴 High | Required for App Store/Play Store submission |
| Unit/Integration tests | ✅ Done | 14 test suites · 87 tests · jest-expo + RNTL |
| Mobile CI/CD | 🔴 High | `ci.yml`/`deploy.yml` have no mobile jobs; no `eas.json` |
| Push notifications | 🟡 Medium | No `expo-notifications` installed |
| Business owner portal | 🟡 Medium | API supports full owner CRUD — no mobile UI |
| EAS Build config | 🟡 Medium | No `eas.json` file for cloud builds |
| ESLint config | 🟢 Low | Package installed, no `.eslintrc` config file |

---

## Completed Phases

### Phase 1: Audio Playback Integration ✅
**Priority:** High — Core dictionary feature  
**Files:** `dictionary-store.ts`, `dictionary.tsx`, `package.json`

- [x] Install `expo-av` for audio playback
- [x] Create `useAudioPlayer` hook with play/pause/stop
- [x] Wire audio URL from store to actual Sound playback
- [x] Show loading state while audio buffers
- [x] Auto-stop when navigating away / closing word detail
- [x] Handle audio errors gracefully

### Phase 2: Offline Mode Indicator ✅
**Priority:** High — UX quality  
**Files:** `useNetworkStatus.ts`, `OfflineBanner.tsx`, `_layout.tsx`

- [x] Create `useNetworkStatus` hook using `@react-native-community/netinfo`
- [x] Create `OfflineBanner` component (persistent top bar when offline)
- [x] Add banner to main layout
- [x] Integrate with existing cache-first pattern

### Phase 3: Missing i18n Languages ✅
**Priority:** Medium — Platform supports 4 languages  
**Files:** `src/i18n/locales/`, `src/i18n/index.ts`

- [x] Add Kurmanji (kmr) — Northern Kurdish / Latin script
- [x] Add German (de) — Primary market language
- [x] Register all 4 languages in i18n config
- [x] Update RTL hook for Kurdish Sorani detection

### Phase 4: Language Detection UI ✅
**Priority:** Medium — API endpoint exists  
**Files:** `dictionary-store.ts`, `dictionary.tsx`

- [x] Add `detectLanguage` action to dictionary store
- [x] Create language detection section in dictionary
- [x] Show detected language with confidence indicator

### Phase 5: Sentence Analysis Screen ✅
**Priority:** Low — Advanced feature  
**Files:** `sentence-analysis.tsx`

- [x] Create `sentence-analysis.tsx` screen
- [x] Text input for sentence
- [x] Display analysis results (language, word breakdown)

### Phase 6: Mobile CI/CD Pipeline ✅
**Priority:** High  
**Files:** `.github/workflows/mobile-ci.yml`

- [x] Create GitHub Actions workflow for mobile builds
- [x] Lint + TypeScript check job
- [x] Unit test job with coverage
- [x] EAS build trigger for preview/production

### Phase 7: Pull-to-Refresh on Search Results ✅
- [x] Add RefreshControl to search results FlatList

### Phase 8: Tests for New Features ✅
- [x] Test `useAudioPlayer` hook
- [x] Test `useNetworkStatus` hook
- [x] Test language detection store action
- [x] Test sentence analysis flow

---

## New Implementation Phases

### Phase 9: Onboarding Flow ✅
**Priority:** 🔴 High — First-time user experience  
**Effort:** ~3 hours  
**Files:** `app/onboarding.tsx` (231 lines), `app/_layout.tsx`, `src/stores/app-store.ts`

The store already has `hasSeenOnboarding` + `completeOnboarding()` — now fully wired.

- [x] Create `app/onboarding.tsx` — 4-slide carousel
  - Slide 1: 🗺️ "Discover Kurdish Businesses" — gradient map icon
  - Slide 2: 🔍 "Smart Search" — search icon, filter & sort
  - Slide 3: ⭐ "Reviews & Ratings" — star icon, community reviews
  - Slide 4: 🌍 "4 Languages" — globe icon, multilingual CTA
- [x] Use `FlatList` with `pagingEnabled` horizontal scroll + dot pagination
- [x] "Skip" button on all slides, "Get Started" on final slide
- [x] Guard in `_layout.tsx`: redirect to onboarding if `!hasSeenOnboarding` (with `preferencesRestored` flag)
- [x] Call `completeOnboarding()` on finish → navigate to `/(tabs)`
- [x] FadeInView animations on icon, title, description per slide
- [x] i18n keys for all 4 slide titles + descriptions (4 languages)

---

### Phase 10: Password Reset Flow ✅
**Priority:** 🔴 High — Critical auth feature  
**Effort:** ~2 hours  
**Files:** `app/(auth)/forgot-password.tsx`, `app/(auth)/reset-password.tsx`, `src/api/auth.ts`

- [x] Create `app/(auth)/forgot-password.tsx` — email input + send reset link + success state
- [x] Create `app/(auth)/reset-password.tsx` — new password + confirm with live validation
- [x] Add `forgotPassword(email)` and `resetPassword(token, newPassword)` to `auth.ts` API
- [x] Wire "Forgot Password?" link on login screen to new route
- [x] Handle deep link `token` param from email via `useLocalSearchParams`
- [x] Success state with redirect to login
- [x] Validate: minimum 8 chars, at least 1 uppercase + 1 number (live RequirementRow indicators)
- [x] i18n keys for all flow steps (4 languages)

> **API Note:** Backend needs `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` endpoints. Client-side is ready — connect when backend endpoints are deployed.

---

### Phase 11: Privacy Policy & App Store Compliance ✅
**Priority:** 🔴 High — Required for App Store/Play Store submission  
**Effort:** ~2 hours  
**Files:** `app/policy.tsx`, `app/(auth)/register.tsx`, `app/(tabs)/profile.tsx`, `app/_layout.tsx`

- [x] Create `app/policy.tsx` — Privacy Policy + Terms of Service with tab switcher:
  - Introduction (data collection scope)
  - Data Collection (what data, how stored)
  - Local Storage (SecureStore, AsyncStorage usage)
  - Third-Party Services (maps, analytics)
  - User Rights (access, deletion, GDPR compliance)
  - Contact Information
  - Last Updated date
- [x] Add "I agree to the Privacy Policy" checkbox on register screen (with link, disables button)
- [x] Add Privacy Policy row in profile settings (between Contact and version)
- [x] Register route in `_layout.tsx`
- [x] i18n keys for all policy + terms sections (4 languages, ~30 keys)
- [x] Terms of Service scaffolding — same screen with tab toggle (5 sections)

---

### Phase 12: Enhanced Search — Radius & City Selector ✅
**Priority:** 🟡 Medium — Feature parity with web frontend  
**Effort:** ~3 hours  
**Files:** `app/(tabs)/search.tsx`, `app/(tabs)/index.tsx`, `src/components/CitySelector.tsx`

#### 12a: Geolocation Radius Picker
- [x] Add "Near Me" toggle button to search filter bar
- [x] When active, show radius picker (segmented control: **1 · 5 · 10 · 25 · 50 km**)
- [x] Pass `radiusKm` to `businessesApi.search()` (type already in `BusinessSearchParams`)
- [x] Auto-switch sort to `NearestFirst` when Near Me is activated
- [x] Show distance badge on each business card result (already wired from previous work)
- [x] Include radius in TanStack Query cache key

#### 12b: City Selector Component
- [x] Create `CitySelector.tsx` — horizontal scroll of city cards with gradient backgrounds
- [x] Each card: city name (localized), gradient color, location icon
- [x] Tap: navigate to search filtered by that city's id
- [x] Add to Home screen between categories and featured businesses
- [x] Fetch cities from `citiesApi.getAll()` (already wired)

#### 12c: Active Filter Chips
- [x] Show removable chips below search bar for each active filter
- [x] Chip types: category, city, near me (with radius), sort order
- [x] "Clear all" button when ≥2 filters active
- [x] Deep link support: search screen accepts `city` param from CitySelector navigation

---

### Phase 13: Business Owner Portal
**Priority:** 🟡 Medium — Major differentiator, API fully ready  
**Effort:** ~8 hours  
**Files:** New screens, new API methods, new store

The API supports the full `BusinessOwner` role — `POST /api/v1/businesses`, `PUT /{id}`, image upload, menu items, services. This enables business owners to manage their listings from mobile.

#### 13a: My Business Dashboard
- [ ] Create `app/(tabs)/my-business.tsx` or `app/owner/` route group
- [ ] Show owner's business listing with status badge (Pending/Active/Rejected)
- [ ] Display stats: view count, favorite count, review count, average rating
- [ ] Quick actions: edit, manage photos, manage menu, manage services

#### 13b: Create/Edit Business Form
- [ ] Create `app/owner/edit-business.tsx` — multi-step form:
  - Step 1: Basic info (name in 4 languages, category, city)
  - Step 2: Contact (phone, email, website, address)
  - Step 3: Location (map picker for coordinates)
  - Step 4: Opening hours (per day: open/close/closed)
  - Step 5: Description (4 languages, rich text)
- [ ] Add `createBusiness()` and `updateBusiness()` to businesses API
- [ ] Input validation with clear error messages
- [ ] Draft auto-save to AsyncStorage

#### 13c: Image Management
- [ ] Create `app/owner/manage-images.tsx`
- [ ] Upload photos from camera or gallery (`expo-image-picker`)
- [ ] Drag-to-reorder, set primary, delete
- [ ] Add `uploadImage()`, `deleteImage()`, `setPrimaryImage()` API methods
- [ ] Compress before upload (max 6MB enforced by API)

#### 13d: Menu & Service Management
- [ ] Create `app/owner/menu-items.tsx` and `app/owner/services.tsx`
- [ ] Add/edit/delete menu items (name ×4 langs, description ×4, price, image URL)
- [ ] Add/edit/delete services (name ×4 langs, description ×4, price)
- [ ] Sortable list with drag handles
- [ ] Add CRUD methods to API layer

---

### Phase 14: Push Notifications ✅ (partial)
**Priority:** 🟡 Medium — Engagement driver  
**Effort:** ~4 hours  
**Files:** New `src/hooks/useNotifications.ts`, modify `_layout.tsx`, `app.json`

- [x] Install `expo-notifications`
- [x] Create `useNotifications` hook:
  - [x] Register for push token on app start
  - [ ] Send token to backend (`POST /api/v1/users/push-token`) — backend endpoint not yet built
  - [x] Handle foreground notification display
  - [x] Handle notification tap → deep link navigation
- [x] Configure notification channels (Android):
  - [x] `reviews` — New review on your business
  - [x] `favorites` — Favorite business updated
  - [x] `general` — Platform announcements
- [ ] Permission request flow: explain value before requesting
- [ ] Notification preferences in profile settings
- [x] Add `expo-notifications` plugin to `app.json`

> **API Note:** Backend needs `POST /api/v1/users/push-token` and a notification sending service. Scaffold client-side first, connect when backend is ready.

---

### Phase 15: Unit & Integration Tests ✅
**Priority:** 🔴 High — Zero tests currently exist  
**Effort:** ~6 hours  
**Files:** New `__tests__/` directory tree (14 test suites · 87 tests)

Jest, jest-expo, and `@testing-library/react-native` are already installed as devDependencies.

#### 15a: Test Infrastructure ✅
- [x] Create `jest.setup.ts` with RNTL matchers and native module mocks
- [x] Mock: `expo-secure-store`, `expo-router`, `react-native-maps`, `@react-native-community/netinfo`, `expo-asset`, `expo-font`, `@expo/vector-icons`, `expo-haptics`, `expo-image`, `expo-linear-gradient`, `expo-constants`
- [x] Create test utils: `renderWithProviders()` (Theme + Query + i18n wrappers)
- [x] Add `jest.config.js` with `transformIgnorePatterns` for node_modules

#### 15b: Unit Tests — Hooks & Utils ✅
- [x] `useDebounce.test.ts` — 5 tests: debounce timing, value updates, cleanup
- [x] `useLocation.test.ts` — 4 tests: permission grant/deny, coordinates, unmount safety
- [x] `useNetworkStatus.test.ts` — 5 tests: online/offline transitions, unsubscribe
- [x] `useRtl.test.ts` — 5 tests: RTL detection for `ku` locale, LTR for others
- [x] `localization.test.ts` — 12 tests: `getLocalizedName()`, `haversineDistance()`, `formatDistance()`
- [x] `validation.test.ts` — 10 tests: email validation, sanitizeText, maxLength

#### 15c: Unit Tests — Stores ✅
- [x] `auth-store.test.ts` — 8 tests: login, register, logout, restoreSession, token storage
- [x] `app-store.test.ts` — 7 tests: language switch, theme switch, onboarding flag

#### 15d: Component Tests ✅
- [x] `BusinessCard.test.tsx` — 8 tests: render with data, featured badge, favorite toggle, navigation
- [x] `SearchBar.test.tsx` — 7 tests: input, submit, filter button, clear
- [x] `StarRating.test.tsx` — 4 tests: display mode, interactive mode, rating change
- [x] `ErrorView.test.tsx` — 4 tests: error message, retry callback
- [x] `EmptyState.test.tsx` — 4 tests: icon, title, subtitle render
- [x] `OfflineBanner.test.tsx` — 3 tests: visible when offline, hidden when online

#### Coverage Target: **≥70%** for stores/hooks/utils, **≥50%** for screens

#### 15e: Screen Integration Tests ✅
- [x] `login.test.tsx` — 11 tests: renders fields, login call, empty validation, error state, loading state, navigation
- [x] `about.test.tsx` — 6 tests: title, mission, feature cards, open source, version, back navigation
- [x] `policy.test.tsx` — 5 tests: privacy tab default, tab switcher, terms tab switch, last updated text
- [x] Added `react-native-safe-area-context` mock to `jest.setup.ts`

> **Status:** ✅ 17 test suites · 109 tests · all passing.

---

### Phase 16: Mobile CI/CD Pipeline ✅
**Priority:** 🔴 High — No mobile jobs in existing CI  
**Effort:** ~3 hours  
**Files:** `.github/workflows/ci.yml`, `eas.json`

The existing `ci.yml` has backend + admin + frontend jobs but **zero mobile coverage**.

#### 16a: Add Mobile Job to CI ✅
- [x] Added `mobile` job to `.github/workflows/ci.yml`:
  - `npm ci`, `npx tsc --noEmit`, `npx eslint app/ src/ --ext .ts,.tsx --max-warnings=50`, `npx jest --ci --coverage`
  - `NODE_OPTIONS='--no-experimental-strip-types'` for Node 22 compatibility
  - Upload coverage artifact
  - Docker job now depends on `[backend, admin, frontend, mobile]`

#### 16b: EAS Build Configuration ✅
- [x] Created `eas.json` with development, preview, production profiles
- [x] Preview profile: APK distribution for internal testing
- [x] Production profile: AAB app-bundle for Play Store
- [x] Environment-specific `EXPO_PUBLIC_API_URL` per profile
- [x] Submit configuration scaffolded for Android (Google Play) and iOS (App Store Connect)
- [ ] Add EAS build step in CI for tagged releases (needs `EXPO_TOKEN` GitHub secret)
- [ ] Configure `EXPO_TOKEN` secret in GitHub

#### 16c: ESLint Configuration ✅
- [x] Created `.eslintrc.js` extending `@react-native/eslint-config`
- [x] Rules: no-console (warn, allow error/warn), react/react-in-jsx-scope off, no-inline-styles off
- [x] Fixed all ESLint errors across `src/` and `app/` (unused imports, deps, variable naming)
- [x] Result: 0 errors, 40 warnings (all curly brace style)

---

### Phase 17: Performance & Polish ✅

#### 17a: List Performance (Target: 60 FPS) ✅
- [x] All `FlashList` instances have `estimatedItemSize={240}` (search, favorites, category)
- [x] `React.memo()` on all list item components (BusinessCard, CategoryCard, ReviewCard, CitySelector)
- [x] FlashList handles `removeClippedSubviews` internally — not needed
- [x] All FlashList instances have proper `keyExtractor`

#### 17b: Image Optimization ✅
- [x] Added `cachePolicy="memory-disk"` to all expo-image usages (BusinessCard, AdBanner, ImageGallery thumbnails + modal)
- [x] BusinessCard already has `placeholder` and `transition={200}`
- [x] AdBanner has `transition={300}`, ImageGallery has `transition={200}`

#### 17c: Haptic Feedback ✅
- [x] Create centralized `src/utils/haptics.ts` — light/medium/heavy/success/warning/error/selection (web-safe)
- [x] Wire haptics to: favorite toggle (success), tab bar press (light), business detail (success)

#### 17d: Console Stripping ✅
- [x] Add `babel-plugin-transform-remove-console` for production (strips console.log, keeps error/warn)

#### 17e: Splash Screen & App Icon ✅
- [x] Design KurdMap app icon (1024×1024 master)
- [x] Configure adaptive icon (Android) in `app.json`
- [x] Create splash screen with KurdMap branding
- [x] Configure `expo-splash-screen` for smooth transition

---

### Phase 18: Security Hardening ✅
**Priority:** 🔴 High — Pre-launch requirement  
**Effort:** ~3 hours  
**Files:** Various security-related files

Reference: [04-security.md](./04-security.md), OWASP MAS compliance

#### 18a: Token & Auth Security ✅
- [x] Fixed refresh token flow: `client.ts` now sends both `userId` AND `refreshToken` to `/refresh` — matching backend `RefreshRequest(Guid UserId, string RefreshToken)`
- [x] Updated `auth.ts` API method signature: `refresh(userId, refreshToken)`
- [x] Added proactive JWT expiry check: `isTokenExpired()` decodes JWT payload, checks `exp` claim with 30s buffer
- [x] `ensureValidToken()` in request interceptor proactively refreshes before 401
- [x] 401 response interceptor preserved as fallback with shared queue
- [x] Clear all sensitive data on logout (SecureStore + memory)
- [ ] Replace `PLACEHOLDER_PRIMARY_PIN` with real SHA-256 certificate pins (needs production server cert)

#### 18b: Input Validation ✅
- [x] Create `src/utils/validation.ts` — sanitize all text inputs (prevent XSS in rendered content)
- [x] Validate email format on client before sending to API
- [x] Enforce max length on all TextInput fields (email:254, password:128, fullName:100, search:200)
- [x] Add validation tests (10 tests)

#### 18c: Runtime Protection ✅
- [x] Strip `console.log` in production builds (`babel-plugin-transform-remove-console`)
- [x] Create `src/utils/env.ts` — environment variable validation at startup (crash early if `API_URL` missing)
- [x] Wire `validateEnv()` in root `_layout.tsx` at module load
- [ ] Add screenshot prevention on sensitive screens (`FLAG_SECURE` on Android)

#### 18d: Network Security ✅ (partial)
- [x] Created `.env.production` with HTTPS API URL (`https://api.kurdmap.de`)
- [x] EAS build profiles use HTTPS URLs for preview/production
- [x] Network request timeout verified: 15s on both `apiClient` and `authClient`
- [x] Removed 3 unused dependencies: `expo-blur`, `lottie-react-native`, `@react-navigation/native`
- [ ] Enable SSL pinning for production API domain (needs production cert)

---

### Phase 19: App Store Publishing
**Priority:** 🔴 High — Launch milestone  
**Effort:** ~6 hours  
**Files:** `app.json`, `eas.json`, Play Console, App Store Connect

Reference: [09-publishing-deployment.md](./09-publishing-deployment.md)

#### 19a: Pre-Release Checklist
- [ ] All `console.log` removed or guarded by `__DEV__`
- [ ] Production API URL configured (not localhost)
- [ ] Privacy Policy accessible from app + store listing
- [ ] Test on physical devices: Android (API 28+) + iOS (15+)
- [ ] Cold start time < 2 seconds
- [ ] Memory usage < 200 MB under normal use
- [ ] All deep links verified working
- [ ] Accessibility: all interactive elements ≥ 44dp, labels, roles

#### 19b: Google Play Store
- [ ] Generate upload keystore (`keytool -genkey...`)
- [ ] Configure Gradle signing in `eas.json` or `android/app/build.gradle`
- [ ] Build release AAB: `eas build --platform android --profile production`
- [ ] Create Play Console listing:
  - App name: "KurdMap — Kurdish Business Directory"
  - Short description (80 chars, 4 languages)
  - Full description (4000 chars, 4 languages)
  - Screenshots: phone (2+), tablet (optional)
  - Feature graphic (1024×500)
  - Privacy policy URL
  - Content rating questionnaire
  - Target audience: 13+ general
- [ ] Submit to internal testing track → closed beta → production

#### 19c: Apple App Store
- [ ] Configure iOS bundle signing in `eas.json`
- [ ] Build IPA: `eas build --platform ios --profile production`
- [ ] Create App Store Connect listing (same content as Play Store)
- [ ] Submit for App Review
- [ ] Handle review feedback and resubmit if needed

#### 19d: OTA Updates (Post-Launch)
- [ ] Configure `expo-updates` for over-the-air JS updates
- [ ] Set update check policy: `ON_LAUNCH` with 10s timeout
- [ ] Create update channels: `preview`, `production`
- [ ] Test OTA update flow end-to-end

---

## Post-Launch Operations

### Production Monitoring
- [ ] Configure Sentry DSN (`EXPO_PUBLIC_SENTRY_DSN`)
- [ ] Set up Sentry alerts: crash rate threshold, ANR detection
- [ ] Create dashboard: crash-free rate, session count, API error rate
- [ ] Configure user feedback collection in Sentry

### Analytics
- [ ] Add analytics events for key actions: search, view business, favorite, review, share
- [ ] Track funnel: home → search → detail → action (call/directions/review)
- [ ] Weekly active users, retention cohorts, language distribution

### Maintenance
- [ ] Monitor Expo SDK updates (currently 52, plan upgrade to 53+)
- [ ] React Native version tracking (currently 0.76.9, plan upgrade to 0.80+)
- [ ] Dependency audit: `npm audit`, `npx expo-doctor` monthly
- [ ] Review and respond to store reviews
- [ ] Content moderation: review queue, reported businesses

### Future Features (Post-Launch Ideas)
- [ ] **Business claim flow** — Existing businesses can be "claimed" by owners with verification
- [ ] **Review replies** — Business owners respond to reviews
- [ ] **Photo reviews** — Users upload photos with reviews
- [ ] **Events calendar** — Kurdish cultural events in Cologne/Düsseldorf
- [ ] **Deals & promotions** — Time-limited offers from businesses
- [ ] **Social features** — User profiles, follow businesses, activity feed
- [ ] **Multi-city expansion** — Berlin, Hamburg, Munich → city selection on first launch
- [ ] **Offline map tiles** — Download Cologne/Düsseldorf region for offline navigation
- [ ] **Voice search** — Kurdish voice input for search queries
- [ ] **Barcode/QR scanner** — Scan QR code at business → open detail page
- [ ] **Widget (Android)** — Nearby businesses home screen widget
- [ ] **Apple Watch / WearOS** — Quick business lookup on wearables

---

## Post-Implementation Checklist

- [ ] Certificate pinning keys — Replace `PLACEHOLDER_PRIMARY_PIN` with real SHA-256 pins
- [ ] Sentry DSN — Configure `EXPO_PUBLIC_SENTRY_DSN` environment variable
- [ ] OAuth client IDs — Configure Google and GitHub client IDs
- [ ] EAS project ID — Set `EAS_PROJECT_ID` for OTA updates
- [ ] Bundle analysis — Run `npm run bundle:analyze` to verify size
- [ ] Remove unused dependencies: `@react-navigation/native`, `expo-blur` (if unused)
- [ ] Production `.env` — HTTPS API URL, not localhost
- [ ] Contact form — Wire to backend API endpoint (currently client-only)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Expo Router v4 (File-Based)                    │
│  ┌──────────────────────────────────────────────────────────────────┤
│  │ (tabs)/    Home · Search · Map · Favorites · Profile             │
│  │ (auth)/    Login · Register · Forgot-Password · Reset-Password   │
│  │ business/  [slug] detail · [slug]/reviews                        │
│  │ category/  [id] listing                                          │
│  │ owner/     My Business · Edit · Images · Menu · Services         │
│  │            About · Contact · Policy · Onboarding                 │
├──┴──────────────────────────────────────────────────────────────────┤
│                         Zustand Stores                               │
│  auth-store.ts (148 lines) — JWT, SecureStore, user state           │
│  app-store.ts (54 lines) — lang, theme, onboarding, AsyncStorage    │
├─────────────────────────────────────────────────────────────────────┤
│                    API Layer (Axios · 8 files · 215 lines)           │
│  client.ts: dual clients (apiClient + authClient), 401 token queue  │
│  businesses · auth · favorites · reviews · ads · categories · cities │
├─────────────────────────────────────────────────────────────────────┤
│                     Hooks (4 files · 115 lines)                      │
│  useDebounce · useLocation · useNetworkStatus · useRtl              │
├─────────────────────────────────────────────────────────────────────┤
│                   Components (16 files · 1,386 lines)                │
│  BusinessCard · SearchBar · ImageGallery · Skeleton · Animations    │
│  StarRating · CategoryCard · AdBanner · OpeningHours · MapPreview   │
│  ErrorView · EmptyState · LoadingSpinner · OfflineBanner · ReviewCard│
├─────────────────────────────────────────────────────────────────────┤
│                    Theme · Types · Utils · i18n                      │
│  Light/Dark/System themes · 256-line API types · 4 locales (135 keys)│
├─────────────────────────────────────────────────────────────────────┤
│                       Security Layer                                 │
│  SecureStore tokens · HTTPS · Input sanitization · Deep link scheme  │
│  Certificate pinning (placeholder) · Crash reporting (Sentry scaffold│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Inventory (27 production + 10 dev)

| Category | Package | Version | Used? |
|----------|---------|---------|-------|
| **Core** | `react` | 18.3.1 | ✅ |
| | `react-native` | 0.76.9 | ✅ |
| | `expo` | ~52.0 | ✅ |
| | `expo-router` | ~4.0 | ✅ |
| | `typescript` | ~5.6 | ✅ |
| **State** | `zustand` | ^5.0 | ✅ |
| | `@tanstack/react-query` | ^5.62 | ✅ |
| **HTTP** | `axios` | ^1.7 | ✅ |
| **i18n** | `i18next` + `react-i18next` | ^24 / ^15 | ✅ |
| **UI** | `react-native-reanimated` | ~3.16 | ✅ |
| | `react-native-gesture-handler` | ~2.20 | ✅ |
| | `@shopify/flash-list` | 1.7.3 | ✅ |
| | `react-native-maps` | 1.18 | ✅ |
| | `expo-image` | ~2.0 | ✅ |
| | `expo-linear-gradient` | ~14.0 | ✅ |
| | `expo-blur` | ~14.0 | ⚠️ Not imported |
| | `lottie-react-native` | ^7.1 | ⚠️ Not imported |
| **Platform** | `expo-location` | ~18.0 | ✅ |
| | `expo-secure-store` | ~14.0 | ✅ |
| | `expo-haptics` | ~14.0 | ⚠️ Partially used |
| | `expo-font` | ~13.0 | ✅ |
| | `expo-constants` | ~17.0 | ✅ |
| | `expo-linking` | ~7.0 | ✅ |
| | `@react-native-async-storage/async-storage` | 1.23 | ✅ |
| | `@react-native-community/netinfo` | 11.4 | ✅ |
| | `react-native-web` | ~0.19 | ✅ |
| | `@react-navigation/native` | ^7.0 | ⚠️ Not imported (expo-router bundles own) |
