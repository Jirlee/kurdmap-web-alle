# KurdMap Mobile — Google Play Publishing Guide

> Complete, production-ready guide to building, signing, and publishing the
> **KurdMap** Android app to the Google Play Store using Expo Application
> Services (EAS). Written for the current codebase
> (`src/kurdmap-mobile`, Expo SDK 52 / React Native 0.76).

---

## 0. App facts (already configured)

These values come straight from `app.json` / `eas.json` — verify they are
correct before your first production build.

| Field | Value | Source |
| --- | --- | --- |
| App name | `KurdMap` | `app.json → expo.name` |
| Android package | `de.kurdmap.mobile` | `app.json → android.package` |
| iOS bundle id | `de.kurdmap.mobile` | `app.json → ios.bundleIdentifier` |
| Version (user-facing) | `1.0.0` | `app.json → expo.version` |
| Version code | `1` (auto-incremented by EAS in production) | `app.json → android.versionCode` + `eas.json → build.production.autoIncrement` |
| Production API | `https://gs6xapi.kurdmap.eu` | `eas.json → build.production.env.EXPO_PUBLIC_API_URL` |
| Location permission | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | `app.json → android.permissions` |
| Blocked permissions | `CAMERA`, `RECORD_AUDIO` | `app.json → android.blockedPermissions` |
| OTA updates | `https://u.expo.dev/90b7a526-7f93-4a49-a833-7f741f86e20c` | `app.json → updates.url` |
| EAS project | `@jirlee/kurdmap-mobile` (ID `90b7a526-7f93-4a49-a833-7f741f86e20c`) | `app.json → extra.eas.projectId` |
| Crash reporting | Sentry (org `kurdmap`, project `kurdmap-mobile`) | `app.json → plugins` |

> **No user accounts.** The app has no login/register/auth. It only reads
> public data and stores favorites and preferences locally on-device. Keep
> this in mind for the **Data safety** form (Section 9).

### Setup status (done in terminal)

- [x] `eas login` — signed in as **`jirlee`** (`jirlee.kurdisch@gmail.com`).
- [x] `eas init` — project created and linked
  (ID `90b7a526-7f93-4a49-a833-7f741f86e20c`).
- [x] `extra.eas.projectId` written; `updates.url` points at the project ID.
- [x] Android **keystore generated in the cloud** (EAS-managed).
- [x] First **production AAB build** queued (version code auto-managed by EAS).
- [ ] Create the **Play service account** key (`play-service-account.json`) —
  Section 8 (only needed for automated `eas submit`).

---

## 1. Prerequisites

### Accounts

- [ ] **Google Play Developer account** (one-time **$25** fee). Developer ID on
  file: `6357578476746386658`. The account must complete **identity
  verification** and **phone verification** before you can publish.
- [ ] **Expo account** (free) — <https://expo.dev/signup>.
- [ ] A Google Cloud project for the **Play service account** (Section 8) — can
  be auto-created from Play Console.

### Local tools

```bash
# Node 18+ (project uses NODE_OPTIONS='--no-experimental-strip-types')
node -v

# Install the EAS CLI globally
npm install -g eas-cli

# Log in to Expo
eas login
eas whoami
```

> You do **not** need Android Studio or a local Android SDK — EAS builds in the
> cloud. (You only need them if you choose local builds, which this guide does
> not cover.)

---

## 2. Required store assets (gather these first)

Prepare every asset below **before** starting the Play Console listing so you
can fill the form in one pass.

### App icons / launcher (already in repo)

| Asset | Spec | Repo path |
| --- | --- | --- |
| App icon | 1024×1024 PNG, no transparency | `assets/icon.png` |
| Adaptive icon (foreground) | 1024×1024 PNG, transparent, safe zone 66% | `assets/adaptive-icon.png` |
| Splash | 1242×2436 (or contain-fit) PNG, bg `#064E3B` | `assets/splash.png` |

> Verify `assets/icon.png` is exactly **1024×1024** and has **no alpha
> channel** — Play rejects transparent 512 icons. The Play *store* icon
> (separate from the launcher icon) is **512×512 PNG, 32-bit, ≤1 MB**.

### Play Store listing graphics (create these)

| Asset | Spec | Required? |
| --- | --- | --- |
| **Store icon** | 512×512 PNG, ≤1 MB | ✅ Required |
| **Feature graphic** | 1024×500 PNG/JPG, no alpha | ✅ Required |
| **Phone screenshots** | 2–8 images, 16:9 or 9:16, min 320 px, max 3840 px | ✅ Required (min 2) |
| 7" tablet screenshots | up to 8 | Optional |
| 10" tablet screenshots | up to 8 | Optional |
| Promo video (YouTube URL) | — | Optional |

> **Screenshot tip:** Capture Home, Search, Map, Business detail, and
> Favorites screens. Use a clean emulator/device frame. Provide at least one
> set per supported language if you localize the listing (ku / kmr / de / en).

### Text content (write these)

| Field | Limit | Notes |
| --- | --- | --- |
| App name | 30 chars | `KurdMap` |
| Short description | 80 chars | e.g. "Discover Kurdish businesses across Europe." |
| Full description | 4000 chars | Features, languages, no-account note |
| App category | — | `Maps & Navigation` (or `Travel & Local`) |
| Contact email | — | Required, public |
| Privacy policy URL | — | **Required** (Section 9) |
| Website (optional) | — | `https://kurdmap.eu` |

---

## 3. Initialize EAS for the project

From `src/kurdmap-mobile`:

```bash
cd src/kurdmap-mobile

# Make sure dependencies are installed
npm install

# Link the project to your Expo account and write the EAS projectId
eas init
# → updates app.json → extra.eas.projectId with the real value

# Sanity check the config the build will use
npx expo config --type public | head -40
```

Commit the resulting `projectId` change (it is **not** secret).

---

## 4. Android app signing (Play App Signing)

KurdMap uses **EAS-managed credentials** with **Google Play App Signing** — the
recommended, lowest-risk setup.

How it works:

1. EAS generates and stores your **upload keystore** (the key you sign builds
   with).
2. Google Play re-signs your app with the **app signing key** it holds. If you
   ever lose the upload key, Google can reset it.

```bash
# Inspect / generate Android credentials (interactive)
eas credentials -p android
```

Choose **"Set up a new keystore"** (let EAS generate it) the first time. EAS
stores it server-side; you never check a keystore into git (`*.jks` and
`*.keystore` are already git-ignored).

> **Critical:** Do **not** generate your own keystore and lose it. With EAS +
> Play App Signing you are safe, but still record that the keystore lives in
> EAS. To back it up locally:
> ```bash
> eas credentials -p android   # → Download keystore
> ```
> Store the downloaded `.jks` and its passwords in your password manager.

---

## 5. Pre-build verification (run every release)

```bash
cd src/kurdmap-mobile

# 1. Type safety — must be clean
NODE_OPTIONS='--no-experimental-strip-types' npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Tests — must be green
NODE_OPTIONS='--no-experimental-strip-types' npx jest

# 4. Confirm the production API URL resolves in the built config
EXPO_PUBLIC_API_URL=https://gs6xapi.kurdmap.eu npx expo config --type public \
  | grep -i apiUrl
```

Baseline at time of writing: **tsc clean**, **89 tests passing**.

> Also confirm the **API is reachable over HTTPS** from a device network, and
> that CORS / host filtering on the server allows the app's requests (the app
> sends no `Origin` header from native, so server-side `AllowedHosts` is what
> matters, not browser CORS).

---

## 6. Versioning policy

| Field | Meaning | Who increments |
| --- | --- | --- |
| `expo.version` (`1.0.0`) | User-facing version name | **You**, manually per release |
| `android.versionCode` (`1`) | Internal integer Play uses to order builds | **EAS** (`autoIncrement: true` in production) |
| `runtimeVersion.policy: appVersion` | OTA-update compatibility key = the version name | Derived from `expo.version` |

Rules:

- Bump `expo.version` (e.g. `1.0.0 → 1.0.1`) for every Play release.
- Because `runtimeVersion` follows `appVersion`, a **native** change (new SDK,
  new permission, new native module) requires a **new build + new version
  name** — it cannot ship as an OTA update.
- **Bug-fix-only JS changes** can ship as OTA via `eas update` (Section 12)
  **without** a Play submission, as long as the version name is unchanged.

---

## 7. Build the production App Bundle (AAB)

Google Play requires the **Android App Bundle (.aab)** format —
`eas.json → build.production.android.buildType` is already `app-bundle`.

```bash
cd src/kurdmap-mobile

# Cloud build, production profile (uses EXPO_PUBLIC_API_URL=gs6xapi.kurdmap.eu)
eas build -p android --profile production
```

- The build runs in the cloud; the CLI prints a URL to follow logs.
- On success you get a downloadable **`.aab`** artifact and it is registered
  with your EAS project.
- `autoIncrement` bumps `versionCode` automatically (because
  `cli.appVersionSource` is `remote`).

**Quick internal test build (APK, installable directly):**

```bash
eas build -p android --profile preview   # APK, same prod API
```

Use the `preview` APK for fast device smoke-testing before the heavier
production AAB + Play review cycle.

---

## 8. Create a Play service account (for automated submit)

This lets `eas submit` upload builds without manual file handling.

1. **Play Console → Setup → API access** (or Google Cloud Console).
2. Create / link a Google Cloud project.
3. Create a **service account**, grant it the **"Service Account User"** role.
4. In **Play Console → Users & permissions**, invite the service-account email
   and grant **Release** permissions (at least: *Release to testing tracks* and
   *Manage production releases*).
5. Create a **JSON key** for the service account and download it.
6. Save it as `src/kurdmap-mobile/play-service-account.json` (already
   git-ignored — **never commit it**).

This path matches `eas.json → submit.production.android.serviceAccountKeyPath`.

---

## 9. Play Console: create the app & complete required forms

### 9.1 Create the app

**Play Console → All apps → Create app**

- App name: `KurdMap`
- Default language: choose primary (e.g. `English (United States)` or `German`)
- App or game: **App**
- Free or paid: **Free**
- Confirm declarations (developer program policies, US export laws).

> The app may already exist in **Draft** under package `de.kurdmap.mobile`.

### 9.2 Privacy policy (required)

Host a privacy policy at a public URL (e.g. `https://kurdmap.eu/privacy`) and
enter it under **App content → Privacy policy**. The in-app policy text already
reflects the no-account reality — mirror it on the web. Key points to state:

- No user accounts; no login or authentication data collected.
- Location is used only to find nearby businesses (foreground only).
- Favorites + language/theme/onboarding preferences are stored **locally** on
  the device and never leave it.
- Crash diagnostics via Sentry (if DSN configured) — disclose this.
- No personal data sold or shared with third parties for advertising.

### 9.3 Data safety form (App content → Data safety)

Because there are no accounts, this form is short. Declare honestly:

| Data type | Collected? | Notes |
| --- | --- | --- |
| Location (approximate/precise) | **Yes**, if you use the nearby feature | Used in-app only, not shared, foreground |
| Personal info (name, email) | **No** | App has no accounts |
| App activity / diagnostics | **Yes** if Sentry crash reporting is enabled | Crash logs; not for ads |
| Data encrypted in transit | **Yes** | All API calls over HTTPS (`gs6xapi.kurdmap.eu`) |
| User can request deletion | **N/A** (no account data stored server-side) | Local data is removable by uninstalling |

### 9.4 Other required "App content" sections

- [ ] **Ads** — declare whether the app shows ads (it displays in-app
  Advertisements from your own API; this is generally *not* third-party ad
  networks — answer accordingly).
- [ ] **Content rating** questionnaire (IARC) — complete it; a business
  directory typically rates **Everyone**.
- [ ] **Target audience & content** — choose age groups (not directed at
  children unless intended).
- [ ] **News app** — No.
- [ ] **Government app** — No.
- [ ] **Data safety** — completed in 9.3.
- [ ] **Permissions** — location only; no sensitive permissions
  (camera/audio are explicitly blocked).
- [ ] **App access** — choose **"All functionality available without special
  access"** (true, since there is no login). This is important: reviewers can
  use the whole app without credentials.

### 9.5 Store listing (Main store listing)

Fill name, short + full description, store icon (512), feature graphic
(1024×500), and at least 2 phone screenshots (Section 2). Set the app
**category** and contact email.

---

## 10. Testing tracks → Production (mandatory closed-testing rule)

> **New personal developer accounts** (created after Nov 2023) **must** run a
> **closed test with at least 12 testers for at least 14 days** before applying
> for production access. Plan for this.

Recommended progression:

1. **Internal testing** (up to 100 testers, no review delay) — fast iteration.
2. **Closed testing** (≥ 12 testers, ≥ 14 continuous days) — satisfies the
   production-access requirement. Add testers by email list or Google Group.
3. **Production** — apply for access after the 14-day closed test, then submit.

### Upload a build to a track

**Option A — automated (recommended):**

```bash
cd src/kurdmap-mobile

# Submit the latest production build to the internal track as a draft
eas submit -p android --profile production --latest
```

(`eas.json` already sets `track: internal`, `releaseStatus: draft`.)

**Option B — manual:** In Play Console → **Testing → Internal testing →
Create new release**, upload the `.aab` you downloaded from EAS.

To promote: Play Console → move the release from Internal → Closed → Production
(or change `track` in `eas.json` to `production` once eligible).

---

## 11. Pre-launch release checklist

Run through this before clicking **"Send for review"** on the production track.

### Build & code

- [ ] `tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `jest` all green
- [ ] `expo.version` bumped for this release
- [ ] Production build uses `EXPO_PUBLIC_API_URL=https://gs6xapi.kurdmap.eu`
- [ ] App tested on a **physical device** against the production API
- [ ] Deep links / notification taps route correctly
- [ ] Offline banner + error/empty states verified
- [ ] All 4 languages (ku / kmr / de / en) render; RTL correct for Sorani
- [ ] Favorites persist across app restarts (local AsyncStorage)
- [ ] Reviews display read-only (no post UI)

### Credentials & config

- [ ] EAS Android keystore generated **and backed up** to password manager
- [ ] `extra.eas.projectId` is the real id (not the placeholder)
- [ ] `play-service-account.json` present locally, **git-ignored**, never committed
- [ ] No secrets committed (`.env`, keystores, service-account JSON ignored)

### Play Console — App content

- [ ] Privacy policy URL live and accurate
- [ ] Data safety form completed (location + diagnostics; no accounts)
- [ ] Content rating questionnaire submitted
- [ ] Target audience set
- [ ] Ads declaration answered
- [ ] **App access** = "no special access required"

### Play Console — Store listing

- [ ] Store icon 512×512 (≤1 MB, no alpha)
- [ ] Feature graphic 1024×500
- [ ] ≥ 2 phone screenshots
- [ ] Short (≤80) + full (≤4000) descriptions
- [ ] Category + contact email set

### Account & rollout

- [ ] Developer account identity + phone verified
- [ ] Closed test with ≥ 12 testers ran ≥ 14 days (if required)
- [ ] Countries/regions selected for distribution
- [ ] Staged rollout percentage chosen (e.g. start at 20%)

---

## 12. Releasing updates after launch

### JS-only update (no native change) → OTA, no Play review

```bash
cd src/kurdmap-mobile

# Keep expo.version the SAME; push JS/asset changes over-the-air
eas update --branch production --message "Fix: search filter bug"
```

Devices on the same `runtimeVersion` (= same `appVersion`) pick it up on next
launch (`fallbackToCacheTimeout: 3000`).

### Native change (SDK bump, new permission/module) → new build + submit

```bash
# 1. Bump expo.version in app.json (e.g. 1.0.1)
# 2. Rebuild and submit
eas build -p android --profile production
eas submit -p android --profile production --latest
# 3. Promote internal → production in Play Console (or set track: production)
```

### Versioning quick reference

| Change type | Action | Play review? |
| --- | --- | --- |
| JS/asset fix, same version name | `eas update` | No |
| New feature with native dep / SDK upgrade | bump `expo.version` → `eas build` + `eas submit` | Yes |
| New permission | bump version → rebuild + update Data safety | Yes |

---

## 13. Common rejection causes (and how this app avoids them)

| Cause | Mitigation in KurdMap |
| --- | --- |
| Login wall blocks reviewers | No accounts — set **App access = no special access** |
| Undeclared data collection | Data safety declares location + diagnostics only |
| Missing privacy policy | Host at `https://kurdmap.eu/privacy` |
| Requests unused sensitive permissions | Camera/audio **blocked**; only location requested |
| Transparent/oversized icon | 512 store icon, no alpha; 1024 launcher icon |
| Crashes on launch | Validated by tests + on-device smoke test; Sentry monitors prod |
| Broken backend in review | Production API `gs6xapi.kurdmap.eu` reachable over HTTPS |

---

## 14. One-page command cheat sheet

```bash
cd src/kurdmap-mobile

# Setup (once)
npm install -g eas-cli
eas login
eas init
eas credentials -p android        # create + back up keystore

# Verify (every release)
NODE_OPTIONS='--no-experimental-strip-types' npx tsc --noEmit
npm run lint
NODE_OPTIONS='--no-experimental-strip-types' npx jest

# Build & submit
eas build  -p android --profile preview        # APK smoke test
eas build  -p android --profile production      # AAB for Play
eas submit -p android --profile production --latest

# Post-launch JS-only updates
eas update --branch production --message "..."
```

---

**Maintainer notes**

- Production API: `https://gs6xapi.kurdmap.eu` (set in `eas.json`).
- Sentry: org `kurdmap`, project `kurdmap-mobile` — set `EXPO_PUBLIC_SENTRY_DSN`
  as an EAS secret for production crash reporting (`eas secret:create`).
- Keep `play-service-account.json` and any downloaded keystore **out of git**
  and in a password manager.
