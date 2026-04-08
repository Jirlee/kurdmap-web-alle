# Jirlee Mobile App — Master Roadmap

> **Level:** Senior Enterprise  
> **Technology:** React Native 0.84.x + Expo  
> **Platform Target:** Android + iOS  
> **Last Updated:** 2026

---

## Table of Contents

1. [Document Index](#document-index)
2. [Architecture Decision](#architecture-decision)
3. [Technology Stack](#technology-stack)
4. [Phase 1: Foundation](#phase-1-foundation-weeks-1-3)
5. [Phase 2: Core Features](#phase-2-core-features-weeks-4-7)
6. [Phase 3: Advanced Features](#phase-3-advanced-features-weeks-8-11)
7. [Phase 4: Security Hardening](#phase-4-security-hardening-week-12)
8. [Phase 5: Performance & Polish](#phase-5-performance--polish-weeks-13-14)
9. [Phase 6: Testing & QA](#phase-6-testing--qa-weeks-15-16)
10. [Phase 7: Publishing & Launch](#phase-7-publishing--launch-weeks-17-18)
11. [Post-Launch Operations](#post-launch-operations)
12. [Essential Libraries](#essential-libraries)

---

## 1. Document Index

| # | Document | Topics |
|---|---|---|
| 01 | [Environment Setup](./01-environment-setup.md) | Node.js, JDK, Android Studio, Xcode, Emulators, Hermes |
| 02 | [Core Concepts & TypeScript](./02-core-concepts-typescript.md) | TypeScript config, Integration, Networking, Versioning |
| 03 | [UI, Styling & Interaction](./03-ui-styling-interaction.md) | StyleSheet, Flexbox, Dimensions, Colors, Gestures, Accessibility |
| 04 | [Security](./04-security.md) | OWASP MAS, Keychain/Keystore, OAuth2 PKCE, SSL Pinning |
| 05 | [Performance Optimization](./05-performance-optimization.md) | 60 FPS, FlatList, Animations, Profiling, Memory |
| 06 | [Testing & Debugging](./06-testing-debugging.md) | Jest, RNTL, Detox, DevTools, CI/CD Testing |
| 07 | [New Architecture](./07-new-architecture.md) | Codegen, Turbo Modules, Fabric Components, C++ Modules |
| 08 | [Native Platform Integration](./08-native-platform-integration.md) | Native↔JS Communication, Permissions, Platform APIs |
| 09 | [Publishing & Deployment](./09-publishing-deployment.md) | Play Store, App Store, CI/CD, OTA Updates, Versioning |

---

## 2. Architecture Decision

### Why React Native for Jirlee Mobile?

| Factor | React Native | Native (Kotlin/Swift) | Flutter |
|---|---|---|---|
| **Code sharing with web** | High (TypeScript, business logic) | None | Low |
| **Team expertise** | Leverages existing Angular/TS skills | New language + paradigm | New language (Dart) |
| **API integration** | Direct TypeScript types from existing API | Manual | Manual |
| **Time to market** | Fast (single codebase) | 2× slower (two codebases) | Fast |
| **New Architecture perf** | Near-native via JSI | Native | Near-native |
| **Community ecosystem** | Enormous | Platform-specific | Growing |

### Recommended Stack: Expo + React Native

```
Expo (Managed Workflow)
├── Expo Router (file-based navigation)
├── Expo Modules (native API access)
├── EAS Build (cloud builds)
├── EAS Submit (store submission)
└── EAS Update (OTA updates)
```

### App Architecture Pattern

```
┌─────────────────────────────────────────────┐
│                  Screens                     │
│  (SearchScreen, WordDetailScreen, etc.)     │
├─────────────────────────────────────────────┤
│               Components                     │
│  (WordCard, SearchBar, AudioPlayer, etc.)   │
├─────────────────────────────────────────────┤
│                 Hooks                        │
│  (useApi, useAuth, useDebounce, etc.)       │
├─────────────────────────────────────────────┤
│               State Management               │
│  (React Query / Zustand / Context)          │
├─────────────────────────────────────────────┤
│                 Services                     │
│  (API client, Auth, Storage, Analytics)     │
├─────────────────────────────────────────────┤
│            Native Modules (if needed)        │
│  (Audio recording, TTS, Biometrics)         │
└─────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Core

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Expo SDK 52+ | Managed native framework |
| **Language** | TypeScript 5.x (strict) | Type-safe development |
| **Engine** | Hermes | JavaScript engine (bytecode compiled) |
| **Architecture** | New Architecture | JSI, Fabric, Turbo Modules |
| **Bundler** | Metro | JavaScript bundler |

### Navigation & UI

| Library | Purpose |
|---|---|
| `expo-router` | File-based navigation (recommended) |
| `react-native-reanimated` | High-performance animations |
| `react-native-gesture-handler` | Native gesture handling |
| `react-native-safe-area-context` | Safe area management |
| `@shopify/flash-list` | Ultra-fast list rendering |

### State & Data

| Library | Purpose |
|---|---|
| `@tanstack/react-query` | Server state management, caching |
| `zustand` | Client state management (lightweight) |
| `react-native-mmkv` | High-performance key-value storage |

### Security

| Library | Purpose |
|---|---|
| `expo-secure-store` | Keychain/Keystore secure storage |
| `react-native-app-auth` | OAuth 2.0 + PKCE authentication |
| `react-native-keychain` | Biometric-protected credentials |

### Testing

| Library | Purpose |
|---|---|
| `jest` | Test runner + assertions |
| `@testing-library/react-native` | Component testing |
| `msw` | API mocking |
| `detox` or `maestro` | End-to-end testing |

### Build & Deploy

| Tool | Purpose |
|---|---|
| `eas-cli` | Build, submit, update |
| GitHub Actions | CI/CD pipeline |
| Sentry / Crashlytics | Error tracking |

---

## 4. Phase 1: Foundation (Weeks 1-3)

### Week 1: Setup & Architecture

- [ ] Set up development environment (Doc: `01-environment-setup.md`)
- [ ] Create Expo project: `npx create-expo-app@latest jirlee-mobile --template tabs`
- [ ] Configure TypeScript strict mode (Doc: `02-core-concepts-typescript.md`)
- [ ] Set up ESLint + Prettier
- [ ] Configure path aliases (`@/`, `@components/`, etc.)
- [ ] Initialize Git repository with `.gitignore`
- [ ] Set up project structure:
  ```
  src/
  ├── app/          # Expo Router screens
  ├── components/   # Shared components
  ├── hooks/        # Custom hooks
  ├── services/     # API client, auth, storage
  ├── types/        # TypeScript types
  ├── utils/        # Utility functions
  ├── constants/    # App constants, theme
  └── assets/       # Images, fonts
  ```

### Week 2: Design System & Theme

- [ ] Define theme (colors, typography, spacing) (Doc: `03-ui-styling-interaction.md`)
- [ ] Implement `ThemeProvider` with dark mode support
- [ ] Create base components:
  - [ ] `Button` (primary, secondary, outline, ghost)
  - [ ] `TextInput` (with label, error, RTL support)
  - [ ] `Card` (elevated, outlined)
  - [ ] `Typography` (H1-H3, Body, Caption)
  - [ ] `LoadingSpinner`
  - [ ] `EmptyState`
  - [ ] `ErrorBoundary`
- [ ] Set up RTL (Right-to-Left) support for Kurdish

### Week 3: Navigation & API Client

- [ ] Configure Expo Router navigation:
  ```
  app/
  ├── (tabs)/
  │   ├── index.tsx        # Home / Word of the day
  │   ├── search.tsx       # Search
  │   ├── favorites.tsx    # Saved words
  │   └── settings.tsx     # Settings
  ├── word/[id].tsx        # Word detail
  └── _layout.tsx          # Root layout
  ```
- [ ] Build API client service:
  - [ ] Base fetch wrapper with auth headers
  - [ ] Request/response interceptors
  - [ ] Error handling + retry logic
  - [ ] Type-safe API methods matching Jirlee API endpoints
- [ ] Set up React Query:
  - [ ] Query client configuration
  - [ ] Offline support + cache persistence
  - [ ] Optimistic updates

---

## 5. Phase 2: Core Features (Weeks 4-7)

### Week 4: Search & Browse

- [ ] Search screen with debounced input
- [ ] Search results list (FlashList) with pagination
- [ ] Word card component (Kurdish word, definition, pronunciation)
- [ ] Search history (stored locally)
- [ ] Empty state and loading skeleton
- [ ] Keyboard handling (dismiss on scroll)

### Week 5: Word Detail

- [ ] Word detail screen:
  - [ ] Word, transliteration, part of speech
  - [ ] Definitions (multiple languages)
  - [ ] Example sentences
  - [ ] Related words / synonyms
  - [ ] Etymology (if available)
- [ ] Audio pronunciation playback
- [ ] Share word functionality
- [ ] Add to favorites

### Week 6: Audio Features

- [ ] Audio playback service (for word pronunciation)
- [ ] Audio recording (for user pronunciation practice)
- [ ] Waveform visualization
- [ ] Audio permissions handling (Doc: `08-native-platform-integration.md`)

### Week 7: Offline Support

- [ ] Offline word database (SQLite or MMKV for frequently accessed)
- [ ] Download word packs for offline use
- [ ] Queue actions when offline (favorites, history)
- [ ] Sync when connectivity restored
- [ ] Network status indicator

---

## 6. Phase 3: Advanced Features (Weeks 8-11)

### Week 8: Authentication

- [ ] OAuth 2.0 + PKCE login flow (Doc: `04-security.md`)
- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Secure token storage (Keychain/Keystore)
- [ ] Auto token refresh
- [ ] Logout + session management
- [ ] Account settings screen

### Week 9: User Features

- [ ] Favorites / bookmarks with categories
- [ ] Word lists (custom collections)
- [ ] Learning progress tracking
- [ ] Daily word notification
- [ ] User profile

### Week 10: Notifications & Deep Linking

- [ ] Push notification setup (FCM + APNs)
- [ ] Daily word of the day notification
- [ ] Deep link handling (Doc: `04-security.md` § Deep Linking)
  - `https://jirlee.com/word/{id}` → Word detail
  - `https://jirlee.com/search?q={query}` → Search
- [ ] Universal Links (iOS) + App Links (Android)
- [ ] Share links that deep-link into app

### Week 11: Accessibility & RTL

- [ ] Full RTL layout for Kurdish content (Doc: `03-ui-styling-interaction.md`)
- [ ] Screen reader support (TalkBack + VoiceOver)
- [ ] Accessibility labels on all interactive elements
- [ ] Dynamic text size support
- [ ] High contrast mode
- [ ] Haptic feedback on actions

---

## 7. Phase 4: Security Hardening (Week 12)

- [ ] SSL certificate pinning for `api.jirlee.com` (Doc: `04-security.md`)
- [ ] Disable cleartext HTTP in production
- [ ] Strip `console.log` from production builds
- [ ] Enable ProGuard/R8 for Android
- [ ] Root/jailbreak detection
- [ ] Secure input fields for credentials
- [ ] Review all OWASP MAS checklist items
- [ ] Security audit of dependencies (`npm audit`)

---

## 8. Phase 5: Performance & Polish (Weeks 13-14)

### Week 13: Performance Optimization

- [ ] Profile with Android Studio Profiler (Doc: `05-performance-optimization.md`)
- [ ] Profile with Xcode Instruments
- [ ] Optimize FlatList/FlashList rendering
- [ ] Implement image caching (FastImage)
- [ ] Reduce bundle size (tree-shaking, code splitting)
- [ ] Enable inline requires in Metro
- [ ] Verify 60 FPS during scroll and animations
- [ ] Cold start optimization (< 2s target)
- [ ] Memory leak analysis

### Week 14: UI Polish

- [ ] Loading skeletons for all screens
- [ ] Smooth transitions and animations (Reanimated)
- [ ] Pull-to-refresh
- [ ] Error recovery flows
- [ ] Empty states for all screens
- [ ] Splash screen + app icon
- [ ] Adaptive icon (Android) + icon sets (iOS)

---

## 9. Phase 6: Testing & QA (Weeks 15-16)

### Week 15: Test Implementation (Doc: `06-testing-debugging.md`)

- [ ] Unit tests for all utility functions (>90% coverage)
- [ ] Unit tests for all custom hooks (>85% coverage)
- [ ] Component tests for all shared components (>75% coverage)
- [ ] Integration tests for critical flows:
  - [ ] Search → Results → Word Detail
  - [ ] Login → Authenticated state
  - [ ] Favorites add/remove
- [ ] API mocking with MSW

### Week 16: E2E & Device Testing

- [ ] E2E tests with Detox or Maestro:
  - [ ] Search flow (type → results → detail)
  - [ ] Authentication flow (login → session → logout)
  - [ ] Offline behavior
  - [ ] Deep linking
- [ ] Test on physical devices:
  - [ ] Android: Low-end (2GB RAM), Mid-range, High-end
  - [ ] iOS: iPhone SE (smallest), iPhone 15, iPad
- [ ] Test different network conditions (3G, offline)
- [ ] Accessibility audit with TalkBack + VoiceOver

---

## 10. Phase 7: Publishing & Launch (Weeks 17-18)

### Week 17: Pre-Launch (Doc: `09-publishing-deployment.md`)

- [ ] Generate Android upload key + configure signing
- [ ] Configure Apple certificates + provisioning profiles
- [ ] Set up EAS Build + Submit (or GitHub Actions CI/CD)
- [ ] Create store listings:
  - [ ] App name, description, keywords (Kurdish, English, Arabic)
  - [ ] Screenshots for all required sizes
  - [ ] Feature graphic (Android)
  - [ ] Privacy policy URL
- [ ] Beta testing:
  - [ ] Android: Internal test track on Google Play
  - [ ] iOS: TestFlight

### Week 18: Launch

- [ ] Production build and final testing
- [ ] Submit to Google Play Store (review: 1-3 days)
- [ ] Submit to Apple App Store (review: 1-7 days)
- [ ] Configure OTA updates (EAS Update)
- [ ] Set up crash reporting (Sentry)
- [ ] Set up analytics
- [ ] Announce launch

---

## 11. Post-Launch Operations

### Monitoring

- **Crash reporting**: Sentry or Firebase Crashlytics
- **Analytics**: PostHog, Amplitude, or Firebase Analytics
- **Performance**: React Native Performance monitoring
- **User feedback**: In-app feedback form

### Update Strategy

| Update Type | Channel | Review Required |
|---|---|---|
| Bug fix (JS only) | OTA via EAS Update | No |
| Feature (JS only) | OTA via EAS Update | No |
| Native module change | Store update | Yes |
| Security patch | Store update (expedited) | Yes |
| Major version | Store update | Yes |

### React Native Version Upgrades

- Follow upgrade every 2-3 minor versions
- Use [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- Test thoroughly on both platforms after upgrade
- Keep dependencies updated monthly

---

## 12. Essential Libraries

### Complete Recommended Stack

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-updates": "~0.26.0",
    "react": "18.3.1",
    "react-native": "0.84.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.12.0",
    "@shopify/flash-list": "~1.7.0",
    "@tanstack/react-query": "~5.60.0",
    "zustand": "~5.0.0",
    "react-native-mmkv": "~3.1.0",
    "react-native-fast-image": "~8.6.0",
    "react-native-app-auth": "~8.0.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "~12.8.0",
    "jest": "~29.7.0",
    "msw": "~2.6.0",
    "detox": "~20.30.0",
    "typescript": "~5.6.0",
    "eslint": "~9.0.0"
  }
}
```

---

## References

- [React Native Official Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [OWASP Mobile Application Security](https://mas.owasp.org)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [React Native Directory](https://reactnative.directory) — Community library directory
