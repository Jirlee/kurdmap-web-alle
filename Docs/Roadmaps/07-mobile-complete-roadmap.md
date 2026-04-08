# KurdMap Mobile App — Complete Roadmap

> **Project:** `src/kurdmap-mobile/`  
> **Stack:** React Native 0.76.9 + Expo SDK 52 + TypeScript 5.6 (strict)  
> **Platform:** Android + iOS  
> **API Backend:** KurdMap.API (ASP.NET Core 10)  
> **Created:** April 2026  
> **Last Updated:** 7 April 2026

---

## 📊 وضعیت نهایی توسعه — Development Status

> **تمام مراحل قابل پیاده‌سازی با کد (Phase 1–19) با موفقیت تکمیل شده‌اند.**  
> All code-implementable development phases are **complete**.

| # | مرحله / Phase | وضعیت | توضیحات |
|---|--------------|-------|---------|
| 1 | Project Setup & Config | ✅ تکمیل | Expo, TypeScript strict, path aliases, Expo Router |
| 2 | TypeScript Types & API Layer | ✅ تکمیل | All DTOs, Axios client, 7 API modules |
| 3 | State Management | ✅ تکمیل | Zustand auth-store + app-store, React Query |
| 4 | Theme & Internationalization | ✅ تکمیل | Light/dark/system, 4 languages (ku, kmr, de, en) |
| 5 | Reusable Components | ✅ تکمیل | 16+ components: BusinessCard, SearchBar, StarRating, etc. |
| 6 | Tab Screens | ✅ تکمیل | Home, Search, Map, Favorites, Profile |
| 7 | Detail & Sub-Screens | ✅ تکمیل | Business detail, reviews, category listing |
| 8 | Authentication | ✅ تکمیل | Login, register, auth guards, token refresh |
| 9 | Polish & Quality | ✅ تکمیل | Offline banner, pull-to-refresh, skeletons, haptics |
| 10 | Onboarding Flow | ✅ تکمیل | 4-slide carousel, skip/get-started, i18n |
| 11 | Password Reset | ✅ تکمیل | Forgot + reset with live validation |
| 12 | Privacy Policy & Compliance | ✅ تکمیل | Privacy + Terms tabs, register checkbox |
| 13 | Enhanced Search | ✅ تکمیل | Radius picker, city selector, filter chips |
| 14 | Unit & Integration Tests | ✅ تکمیل | 17 suites · 109 tests · all passing |
| 15 | CI/CD Pipeline | ✅ تکمیل | GitHub Actions, ESLint, EAS build profiles |
| 16 | Performance & Polish | ✅ تکمیل | React.memo, FlashList, image caching, console strip |
| 17 | Security Hardening | ✅ تکمیل | JWT expiry check, token refresh fix, input validation |
| 18 | OTA Updates & Notifications | ✅ تکمیل | expo-updates, expo-notifications, push token utility |
| 19 | Crash Reporting & Analytics | ✅ تکمیل | Sentry integration, analytics abstraction |
| — | App Store Publishing | ⏳ معلق | نیاز به Apple Developer + Google Play Console |
| — | Post-Launch Backend Features | ⏳ معلق | نیاز به endpoint های جدید سمت سرور |

### معیارهای کیفیت — Quality Metrics

| معیار / Metric | مقدار / Value |
|----------------|---------------|
| TypeScript Errors | **0** |
| ESLint Errors | **0** (45 warnings — curly brace style) |
| Test Suites | **17 passed** |
| Total Tests | **109 passed** |
| Production Dependencies | **34** |
| Dev Dependencies | **12** |
| Source Files | **75+** |

---

## 1. Project Overview

KurdMap Mobile is the native companion app for the KurdMap web platform — a multilingual directory for Kurdish businesses in Cologne and Düsseldorf, Germany. It connects the Kurdish diaspora, locals, and tourists with restaurants, barbershops, hotels, and services.

### Core Features

| Feature | Description |
|---------|-------------|
| **Business Search** | Full-text search with category, city, and geo-location filters |
| **Business Detail** | Images, menu, services, hours, reviews, map location |
| **Interactive Map** | Browse businesses on a map with clustering |
| **Categories** | Browse by business type (restaurants, shops, etc.) |
| **Favorites** | Save businesses for quick access |
| **Reviews** | Read and write reviews with star ratings |
| **Authentication** | Login/register with JWT tokens + auto-refresh |
| **Multilingual** | Kurdish (Sorani), Kurdish (Kurmanji), German, English |
| **Advertisements** | Display promoted businesses |
| **Offline Support** | Cache-first strategy for browsed content |
| **Dark Mode** | System-aware light/dark themes |
| **Push Notifications** | Expo push token registration + local notifications |
| **Crash Reporting** | Sentry integration (activated with DSN) |
| **OTA Updates** | expo-updates for over-the-air JS updates |

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Expo SDK 52+ | Managed native framework |
| **Language** | TypeScript 5.x (strict) | Type-safe development |
| **Engine** | Hermes | JavaScript engine |
| **Navigation** | Expo Router v4 | File-based routing |
| **Server State** | TanStack React Query v5 | API caching, pagination, sync |
| **Client State** | Zustand v5 | Auth state, preferences |
| **Storage** | expo-secure-store | Tokens (encrypted) |
| **Storage** | @react-native-async-storage | Cache (non-sensitive) |
| **Maps** | react-native-maps | Business locations |
| **HTTP** | Axios | API client with interceptors |
| **i18n** | i18next + react-i18next | 4-language support |
| **Lists** | @shopify/flash-list | High-performance lists |
| **Images** | expo-image | Cached image loading (`memory-disk`) |
| **Location** | expo-location | User geolocation |
| **Notifications** | expo-notifications | Push & local notifications |
| **Updates** | expo-updates | Over-the-air JS updates |
| **Crash Reporting** | @sentry/react-native | Error tracking & monitoring |
| **Testing** | Jest + RNTL | Unit + component + screen tests |
| **CI/CD** | GitHub Actions + EAS | Lint, test, build |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Expo Router (Navigation)                   │
│  ┌──────────────────────────────────────────────────────────┤
│  │ (auth)/    login, register, forgot-password, reset-pw    │
│  │ (tabs)/    home, search, map, favorites, profile         │
│  │ business/  [slug] detail, reviews                        │
│  │ category/  [id] filtered list                            │
│  │            onboarding, about, contact, policy             │
├──┴──────────────────────────────────────────────────────────┤
│                     React Query                              │
│  useBusinesses, useBusinessDetail, useCategories, useCities │
│  useReviews, useFavorites, useAdvertisements, useSearch      │
├─────────────────────────────────────────────────────────────┤
│                   Zustand Stores                             │
│  auth-store (tokens, user, login/logout)                    │
│  app-store (language, theme, onboarding)                    │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (Axios)                          │
│  client.ts → JWT expiry check + auto-refresh + 401 fallback │
│  auth.ts, businesses.ts, categories.ts, cities.ts,          │
│  reviews.ts, favorites.ts, advertisements.ts                 │
├─────────────────────────────────────────────────────────────┤
│                  Reusable Components (16+)                    │
│  BusinessCard, CategoryCard, SearchBar, StarRating,          │
│  OpeningHours, ImageGallery, ReviewCard, AdBanner,           │
│  CitySelector, Skeleton, Animations, LoadingSpinner,         │
│  ErrorView, EmptyState, OfflineBanner, MapPreview            │
├─────────────────────────────────────────────────────────────┤
│                   Utilities & Services                        │
│  haptics.ts | env.ts | validation.ts | localization.ts      │
│  notifications.ts | sentry.ts | analytics.ts                │
├─────────────────────────────────────────────────────────────┤
│                    i18n (4 languages × 135+ keys)            │
│  ku (Sorani/RTL) | kmr (Kurmanji) | de (German) | en       │
├─────────────────────────────────────────────────────────────┤
│                   Security & Storage                         │
│  expo-secure-store (tokens) | AsyncStorage (cache)          │
│  Input sanitization | maxLength | JWT expiry check           │
│  Environment validation | console strip (prod)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Phases — All Complete ✅

### Phase 1: Project Setup & Config ✅
- [x] Create Expo project with TypeScript strict
- [x] Configure path aliases (`@/api`, `@/components`, etc.)
- [x] Set up ESLint + Prettier
- [x] Configure Expo Router file-based navigation
- [x] Set up environment variables (API URL, etc.)
- [x] Create `.gitignore`

### Phase 2: TypeScript Types & API Layer ✅
- [x] Define all API types matching backend DTOs
- [x] Create Axios client with JWT interceptor + token refresh
- [x] Implement API modules: auth, businesses, categories, cities, reviews, favorites, advertisements

### Phase 3: State Management ✅
- [x] Create auth store (Zustand) with secure token persistence
- [x] Create app store (language, theme, onboarding state)
- [x] Set up React Query provider with cache configuration

### Phase 4: Theme & Internationalization ✅
- [x] Create light/dark theme tokens
- [x] Create ThemeContext with system-aware switching
- [x] Set up i18next with 4 languages (ku, kmr, de, en)
- [x] Create RTL hook for Kurdish Sorani

### Phase 5: Reusable Components ✅
- [x] BusinessCard (image, name, category, rating, distance)
- [x] CategoryCard (icon, name, business count)
- [x] SearchBar (text input with debounce)
- [x] StarRating (display + interactive)
- [x] OpeningHours (weekly schedule display)
- [x] ImageGallery (horizontal scroll with zoom)
- [x] ReviewCard (user, rating, comment, date)
- [x] AdBanner (promotional banner carousel)
- [x] LoadingSpinner, ErrorView, EmptyState, OfflineBanner

### Phase 6: Tab Screens ✅
- [x] Home (featured businesses, categories, ads)
- [x] Search (text search, filters, sorting, results)
- [x] Map (MapView with business markers)
- [x] Favorites (saved businesses list)
- [x] Profile (user info, settings, language, theme, dynamic version)

### Phase 7: Detail & Sub-Screens ✅
- [x] Business Detail (full info, images, menu, services, hours, reviews, map)
- [x] Business Reviews (list + create)
- [x] Category Businesses (filtered list by category)

### Phase 8: Authentication ✅
- [x] Login screen (email + password)
- [x] Register screen (name + email + password)
- [x] Auth guards (redirect unauthenticated users)
- [x] Token refresh flow (userId + refreshToken)

### Phase 9: Polish & Quality ✅
- [x] Offline banner with network detection
- [x] Pull-to-refresh on all lists
- [x] Loading skeletons
- [x] Error boundaries
- [x] Haptic feedback on interactions

### Phase 10: Onboarding Flow ✅
- [x] Create `app/onboarding.tsx` — 4-slide carousel with FadeInView animations
- [x] "Skip" button on all slides, "Get Started" on final slide
- [x] Guard in `_layout.tsx`: redirect to onboarding if `!hasSeenOnboarding`
- [x] i18n keys for all slides (4 languages)

### Phase 11: Password Reset Flow ✅
- [x] Create `app/(auth)/forgot-password.tsx` — email input + send reset link
- [x] Create `app/(auth)/reset-password.tsx` — new password with live validation
- [x] Add `forgotPassword()` and `resetPassword()` API methods
- [x] Validate: min 8 chars, 1 uppercase + 1 number

### Phase 12: Privacy Policy & Compliance ✅
- [x] Create `app/policy.tsx` — Privacy Policy + Terms of Service with tab switcher
- [x] Add "I agree to Privacy Policy" checkbox on register screen
- [x] Add Privacy Policy row in profile settings
- [x] i18n keys for all policy sections (4 languages, ~30 keys)

### Phase 13: Enhanced Search — Radius & City Selector ✅
- [x] "Near Me" toggle with radius picker (1 · 5 · 10 · 25 · 50 km)
- [x] Auto-switch sort to NearestFirst when Near Me is activated
- [x] Create `CitySelector.tsx` — horizontal scroll of city cards
- [x] Active filter chips with "Clear all" button
- [x] Deep link support: search screen accepts `city` param

### Phase 14: Unit & Integration Tests ✅
- [x] Create `jest.config.js` with jest-expo preset, module aliases, coverage config
- [x] Create `jest.setup.ts` — 20+ native module mocks (incl. notifications, sentry, updates)
- [x] Create `__tests__/test-utils.tsx` — `renderWithProviders()` utility
- [x] Hook tests: useDebounce (5), useLocation (4), useNetworkStatus (5), useRtl (5)
- [x] Util tests: localization (12), validation (10)
- [x] Store tests: auth-store (8), app-store (7)
- [x] Component tests: StarRating (4), ErrorView (4), EmptyState (4), OfflineBanner (3), SearchBar (7), BusinessCard (8)
- [x] Screen integration tests: LoginScreen (11), AboutScreen (6), PolicyScreen (5)
- [x] **17 test suites · 109 tests · all passing**

### Phase 15: CI/CD Pipeline ✅
- [x] Add `mobile` job to `.github/workflows/ci.yml` (npm ci, tsc, eslint, jest --coverage)
- [x] Create `.eslintrc.js` — @react-native config, no-console warn
- [x] Fix all ESLint errors across `src/` and `app/`
- [x] Create `eas.json` — development, preview (APK), production (AAB) build profiles
- [x] Environment-specific API URLs per EAS profile
- [x] Create `.env.production` with HTTPS API URL

### Phase 16: Performance & Polish ✅
- [x] React.memo on all list item components (BusinessCard, CategoryCard, ReviewCard, CitySelector)
- [x] FlashList with `estimatedItemSize={240}` on all list screens
- [x] Add `cachePolicy="memory-disk"` to all expo-image usages
- [x] Create centralized `src/utils/haptics.ts` — web-safe haptic feedback
- [x] Wire haptics: favorite toggle, tab bar press, business detail
- [x] Add `babel-plugin-transform-remove-console` for production

### Phase 17: Security Hardening ✅
- [x] Fix token refresh: send both `userId` AND `refreshToken` to match backend
- [x] Add proactive JWT expiry check: decode payload, check `exp` with 30s buffer
- [x] `ensureValidToken()` in request interceptor — proactive refresh before 401
- [x] 401 response interceptor preserved as safety fallback
- [x] Create `src/utils/env.ts` — environment validation at startup
- [x] Create `src/utils/validation.ts` — email validation, HTML sanitization, maxLength
- [x] Add `maxLength` to all TextInput fields
- [x] Create `.env.production` with HTTPS URL
- [x] Remove 3 unused dependencies (expo-blur, lottie-react-native, @react-navigation/native)

### Phase 18: OTA Updates & Push Notifications ✅
- [x] Install & configure `expo-updates` — OTA update support
- [x] Add `updates` + `runtimeVersion` config to `app.json`
- [x] Install & configure `expo-notifications` + `expo-device`
- [x] Add notification plugin to `app.json` with icon + color
- [x] Create `src/utils/notifications.ts` — push token registration, Android channel, local notifications
- [x] Configure adaptive icon (Android) in `app.json` ✅ (already set)
- [x] Configure splash screen in `app.json` ✅ (already set: green #10B981)

### Phase 19: Crash Reporting & Analytics ✅
- [x] Install `@sentry/react-native` with Expo plugin
- [x] Create `src/utils/sentry.ts` — `initSentry()` with DSN from env, environment detection
- [x] Wire `initSentry()` in root `_layout.tsx`
- [x] Create `src/utils/analytics.ts` — analytics abstraction (search, view, favorite, review, screen, language, theme)
- [x] Add `EXPO_PUBLIC_SENTRY_DSN` to `.env.example`
- [x] Dynamic app version in profile screen (from `Constants.expoConfig`)
- [x] Add jest mocks for expo-notifications, expo-device, @sentry/react-native, expo-updates

---

## 5. موارد معلق — Deferred Items (نیاز به منابع خارجی)

> این موارد نیاز به اکانت‌های خارجی، سرویس‌های ابری، یا طراحی گرافیکی دارند و در کد قابل اجرا نیستند.

### انتشار در فروشگاه — App Store Publishing ⏳
> **نیاز دارد به:** Apple Developer Account ($99/سال) + Google Play Console ($25)

| مورد | وضعیت | توضیح |
|------|-------|-------|
| App icon (production quality) | ⏳ | نیاز به طراح گرافیک — placeholder موجود |
| Splash screen (production quality) | ⏳ | نیاز به طراح — placeholder موجود |
| Generate upload keystore | ⏳ | نیاز به محیط production |
| Build AAB (Android) | ⏳ | `eas build --platform android --profile production` |
| Build IPA (iOS) | ⏳ | `eas build --platform ios --profile production` |
| Play Console listing | ⏳ | نام، توضیحات ×4 زبان، اسکرین‌شات‌ها |
| App Store Connect | ⏳ | نیاز به Apple Developer Program |
| `EXPO_TOKEN` in GitHub | ⏳ | نیاز به Expo account |
| `eas.projectId` in app.json | ⏳ | نیاز به `eas init` با Expo account |

### ویژگی‌های پس از انتشار — Post-Launch ⏳
> **نیاز دارد به:** endpoint های جدید سمت سرور

| مورد | وضعیت | توضیح |
|------|-------|-------|
| Push token → backend | ⏳ | نیاز به `POST /api/v1/users/push-token` |
| Business Owner Portal | ⏳ | CRUD بیزنس، آپلود تصویر — endpoint سمت سرور |
| Sentry DSN | ⏳ | کد آماده — فقط `EXPO_PUBLIC_SENTRY_DSN` مورد نیاز |
| Contact form backend | ⏳ | فعلاً `mailto:` — نیاز به endpoint API |
| SSL Certificate Pinning | ⏳ | نیاز به certificate سرور production |

### ایده‌های آینده — Future Ideas
- [ ] Business claim flow for existing owners
- [ ] Review replies by business owners
- [ ] Photo reviews
- [ ] Events calendar for Kurdish community
- [ ] Deals & promotions
- [ ] Multi-city expansion (Berlin, Hamburg, Munich)
- [ ] Offline map tiles
- [ ] Voice search in Kurdish

---

## 6. API Endpoints Used

| Endpoint | Screen | Method |
|----------|--------|--------|
| `POST /api/auth/login` | Login | Auth |
| `POST /api/auth/register` | Register | Auth |
| `POST /api/auth/refresh` | Auto (interceptor) | Token refresh |
| `POST /api/auth/logout` | Profile | Logout |
| `POST /api/auth/forgot-password` | Forgot Password | Auth |
| `POST /api/auth/reset-password` | Reset Password | Auth |
| `GET /api/v1/businesses/search` | Search, Map | Public |
| `GET /api/v1/businesses/{slug}` | Business Detail | Public |
| `GET /api/v1/categories` | Home, Search | Public |
| `GET /api/v1/cities` | Search filters | Public |
| `GET /api/v1/reviews/business/{id}` | Business Detail | Public |
| `POST /api/v1/reviews` | Business Detail | Auth |
| `GET /api/v1/favorites/{userId}` | Favorites | Auth |
| `POST /api/v1/favorites` | Business Card/Detail | Auth |
| `GET /api/v1/advertisements?activeOnly=true` | Home | Public |

---

## 7. File Structure

```
src/kurdmap-mobile/
├── app/                              # Expo Router screens (21 files)
│   ├── _layout.tsx                   # Root layout (providers, env, sentry)
│   ├── index.tsx                     # Entry redirect
│   ├── onboarding.tsx                # 4-slide onboarding carousel
│   ├── policy.tsx                    # Privacy Policy + Terms of Service
│   ├── about.tsx                     # About screen
│   ├── contact.tsx                   # Contact form
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Tab navigator (haptic on tab press)
│   │   ├── index.tsx                # Home
│   │   ├── search.tsx               # Search (radius, filters)
│   │   ├── map.tsx                  # MapView
│   │   ├── map.web.tsx              # Web fallback
│   │   ├── favorites.tsx            # Saved businesses
│   │   └── profile.tsx              # Settings (dynamic version)
│   ├── business/
│   │   ├── [slug].tsx               # Business detail
│   │   └── [slug]/reviews.tsx       # Reviews
│   └── category/
│       └── [id].tsx                 # Category list
├── src/
│   ├── api/                         # Axios client + 7 service modules
│   │   ├── client.ts                # JWT expiry check, 401 fallback
│   │   ├── auth.ts
│   │   ├── businesses.ts
│   │   ├── categories.ts
│   │   ├── cities.ts
│   │   ├── reviews.ts
│   │   ├── favorites.ts
│   │   └── advertisements.ts
│   ├── components/                  # 16+ reusable UI components
│   ├── hooks/                       # useDebounce, useLocation, useNetworkStatus, useRtl
│   ├── i18n/                        # 4 locales × 135+ keys
│   ├── stores/                      # auth-store, app-store
│   ├── theme/                       # Light/Dark tokens + ThemeContext
│   ├── types/                       # API DTOs
│   └── utils/
│       ├── analytics.ts             # Event tracking abstraction
│       ├── env.ts                   # Environment validation
│       ├── haptics.ts               # Haptic feedback (web-safe)
│       ├── localization.ts          # getLocalizedName, haversineDistance
│       ├── notifications.ts         # Push token registration, local notifs
│       ├── sentry.ts                # Sentry init (from DSN env)
│       └── validation.ts            # Email, sanitize, maxLength
├── __tests__/                       # 17 suites · 109 tests
│   ├── test-utils.tsx
│   ├── hooks/                       # 4 hook tests (19 tests)
│   ├── stores/                      # 2 store tests (15 tests)
│   ├── components/                  # 6 component tests (30 tests)
│   ├── screens/                     # 3 screen tests (22 tests)
│   └── utils/                       # 2 utility tests (22 tests)
├── assets/                          # icon.png, adaptive-icon.png, splash.png, placeholder.png
├── .eslintrc.js                     # ESLint: @react-native + custom rules
├── .env.example                     # Template (API URL + Sentry DSN)
├── .env.production                  # Production HTTPS API URL
├── app.json                         # Expo: splash, icon, plugins, updates, notifications, sentry
├── babel.config.js                  # + transform-remove-console (prod)
├── eas.json                         # EAS: dev, preview (APK), prod (AAB), submit
├── jest.config.js                   # jest-expo, aliases, coverage thresholds
├── jest.setup.ts                    # 20+ native module mocks
├── package.json                     # 34 prod + 12 dev dependencies
└── tsconfig.json                    # Strict mode, path aliases
```

---

## 8. نتیجه‌گیری نهایی — Conclusion

### ✅ مراحل تکمیل شده (19 از 19 مرحله کدنویسی)

تمام مراحل توسعه‌ای که با کد قابل پیاده‌سازی بودند **کامل شده‌اند**:

- **Phase 1–9:** پایه پروژه، API، استیت، تم، کامپوننت‌ها، صفحات، احراز هویت، پولیش
- **Phase 10–13:** آنبوردینگ، ریست رمز، حریم خصوصی، جستجوی پیشرفته
- **Phase 14:** ۱۰۹ تست (۱۷ مجموعه) — hooks، stores، components، screens، utils
- **Phase 15:** CI/CD — GitHub Actions + ESLint + EAS build profiles
- **Phase 16:** بهینه‌سازی — React.memo، FlashList، image caching، haptics
- **Phase 17:** امنیت — JWT expiry check، token refresh fix، input validation
- **Phase 18:** OTA updates + Push notifications — `expo-updates` + `expo-notifications`
- **Phase 19:** Crash reporting + Analytics — `@sentry/react-native` + analytics abstraction

### ⏳ موارد معلق (نیاز به منابع خارجی)

| مورد مورد نیاز | برای |
|----------------|------|
| Apple Developer Account ($99/سال) | انتشار در App Store |
| Google Play Console ($25 یک‌بار) | انتشار در Play Store |
| Expo account + `eas init` | تنظیم `eas.projectId` + cloud builds |
| `EXPO_PUBLIC_SENTRY_DSN` | فعال‌سازی Sentry (کد آماده) |
| طراحی آیکون و splash | جایگزینی placeholder ها |
| Backend endpoints جدید | Push token، contact form، business portal |

### آماده برای production 🚀

اپلیکیشن موبایل **کاملاً عملیاتی، تست شده، lint شده و آماده build های production** است.  
فقط کافیست منابع خارجی بالا فراهم شوند.

The mobile app is **fully functional, tested, linted, and ready for production builds** once the external resources above are obtained.
