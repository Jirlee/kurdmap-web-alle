# React Native Publishing & Deployment

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [Pre-Release Checklist](#pre-release-checklist)
2. [Publishing to Google Play Store](#publishing-to-google-play-store)
3. [Publishing to Apple App Store](#publishing-to-apple-app-store)
4. [Alternative Distribution](#alternative-distribution)
5. [Over-the-Air (OTA) Updates](#over-the-air-ota-updates)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [App Versioning Strategy](#app-versioning-strategy)

---

## 1. Pre-Release Checklist

### Before Any Release Build

- [ ] Remove all `console.log` statements (or use babel plugin)
- [ ] Verify `__DEV__` guards on debug-only code
- [ ] Set correct environment variables (production API URLs)
- [ ] Run full test suite (unit + component + E2E)
- [ ] Test on physical devices (not just emulators)
- [ ] Verify Hermes engine is enabled
- [ ] Check app permissions are minimal and necessary
- [ ] Validate deep links work correctly
- [ ] Test offline behavior and error states
- [ ] Review privacy policy and compliance
- [ ] Verify analytics tracking is production-ready
- [ ] Check accessibility with screen readers

### Performance Validation

- [ ] Cold start time < 2 seconds
- [ ] Smooth scrolling at 60 FPS
- [ ] Memory usage under 200 MB
- [ ] No memory leaks after extended use
- [ ] Network requests have proper timeouts

---

## 2. Publishing to Google Play Store

### Step 1: Generate Upload Key

```bash
# macOS
sudo keytool -genkey -v \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Windows (run as administrator from JDK bin)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

> **CRITICAL:** Keep the keystore file private. Never commit it to version control. If lost or compromised, follow [Google's key recovery instructions](https://support.google.com/googleplay/android-developer/answer/7384423#reset).

### Step 2: Configure Gradle Variables

Place `my-upload-key.keystore` in `android/app/`.

Edit `~/.gradle/gradle.properties` (NOT `android/gradle.properties` — keeps credentials out of git):

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

> **Security Note:** On macOS, you can store credentials in Keychain Access instead of plaintext. See [Safer Passwords in Gradle](https://pilloxa.gitlab.io/posts/safer-passwords-in-gradle/).

### Step 3: Add Signing Config to Gradle

```groovy
// android/app/build.gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                          'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build Release AAB

```bash
# Generate Android App Bundle (recommended for Play Store)
npx react-native build-android --mode=release
```

The AAB file is generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

> **Note:** Ensure `gradle.properties` does NOT include `org.gradle.configureondemand=true` — this causes the release build to skip JS bundling.

### Step 5: Test Release Build

```bash
# Uninstall any debug version first
adb uninstall com.jirlee.mobile

# Install release build
npm run android -- --mode="release"
```

### Step 6: Upload to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app or select existing
3. Go to **Production** → **Create new release**
4. Upload the `.aab` file
5. Configure App Signing by Google Play (required for AAB)
6. Add release notes
7. Submit for review

### APK Size Optimization

```groovy
// Per-architecture APK splits (for non-Play Store distribution)
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false  // true if distributing to stores without device targeting
        }
    }
}
```

### Enable ProGuard

```groovy
// Reduce APK size by stripping unused Java bytecode
def enableProguardInReleaseBuilds = true
```

### Default Permissions

- `INTERNET` — automatically added (required for Metro in debug)
- `SYSTEM_ALERT_WINDOW` — added in debug mode only, removed in release

---

## 3. Publishing to Apple App Store

### Step 1: Configure Release Scheme

1. Open Xcode: `ios/MyApp.xcworkspace`
2. **Product** → **Scheme** → **Edit Scheme**
3. Select **Run** tab → Set **Build Configuration** to `Release`

**Pro Tip:** Speed up physical device debug builds by skipping bundling:

```bash
# In Xcode Build Phase "Bundle React Native code and images"
if [ "${CONFIGURATION}" == "Debug" ]; then
  export SKIP_BUNDLING=true
fi
```

### Step 2: Build for Release

**Option A: Via Xcode**
1. Select target device as "Any iOS Device (arm64)"
2. Press Cmd+B to build
3. **Product** → **Archive**

**Option B: Via CLI**

```bash
npm run ios -- --mode="Release"
```

### Step 3: Create Archive & Upload

1. After archive completes, Xcode opens the **Archives** window
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Upload**
5. Choose signing: **Automatically manage signing** (recommended)
6. Click **Upload**

### Step 4: Submit via App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** to test with beta users
4. When ready: **App Store** → Select build → Fill required info → **Submit for Review**

### Step 5: Screenshots

Apple requires screenshots for supported device sizes:

| Device | Required | Resolution |
|---|---|---|
| iPhone 6.9" (Pro Max) | If supporting | 1320 × 2868 or equivalent |
| iPhone 6.7" | Yes | 1290 × 2796 |
| iPhone 6.5" | Optional if 6.7" provided | 1242 × 2688 |
| iPhone 5.5" | Optional if 6.5"+ provided | 1242 × 2208 |
| iPad Pro 13" | If supporting iPad | 2048 × 2732 |

### Code Signing Requirements

| Item | Purpose |
|---|---|
| **Apple Developer Account** | $99/year (individual or organization) |
| **App ID** | Unique identifier (e.g., `com.jirlee.mobile`) |
| **Provisioning Profile** | Links App ID + certificates + devices |
| **Distribution Certificate** | Signs the app for App Store |
| **Push Notification Certificate** | Required for push notifications |

---

## 4. Alternative Distribution

### Expo EAS Build & Submit

If using Expo:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for both platforms
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**`eas.json`:**

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

### Alternative Android Stores

| Store | Notes |
|---|---|
| **Amazon AppStore** | Supports device targeting per APK |
| **F-Droid** | Open source apps, supports multiple APKs |
| **Samsung Galaxy Store** | Large Samsung user base |
| **Huawei AppGallery** | Required for Huawei devices without Google Play |
| **APKFiles / APKPure** | Direct APK distribution (use universal APK) |

### Enterprise Distribution (Internal)

- **Android**: Direct APK install or enterprise MDM
- **iOS**: Apple Developer Enterprise Program or TestFlight
- **Expo**: Internal distribution via `eas build --profile preview`

---

## 5. Over-the-Air (OTA) Updates

### Expo Updates

Push JavaScript-only updates without app store review:

```bash
# Publish update
eas update --branch production --message "Fix search bug"

# Check for updates in app
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync(); // Restart with new update
  }
}
```

### CodePush (Microsoft)

Alternative OTA solution for non-Expo projects:

```bash
# Install
npm install react-native-code-push

# Release update
appcenter codepush release-react -a Owner/MyApp-Android -d Production
appcenter codepush release-react -a Owner/MyApp-iOS -d Production
```

### OTA Update Limitations

- **Can update**: JavaScript code, images, assets
- **Cannot update**: Native code changes, new native modules, permission changes
- **App store rules**: Must not fundamentally change app behavior via OTA

---

## 6. CI/CD Pipeline

### GitHub Actions — Complete Pipeline

```yaml
# .github/workflows/release.yml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --coverage --ci

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/setup-java@v4
        with: { java-version: 17, distribution: 'zulu' }

      - run: npm ci

      - name: Decode keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/my-upload-key.keystore

      - name: Build AAB
        env:
          MYAPP_UPLOAD_STORE_FILE: my-upload-key.keystore
          MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
          MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew bundleRelease

      - uses: actions/upload-artifact@v4
        with:
          name: android-aab
          path: android/app/build/outputs/bundle/release/app-release.aab

  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }

      - run: npm ci
      - run: cd ios && pod install

      - name: Build iOS
        run: |
          xcodebuild \
            -workspace ios/MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -archivePath build/MyApp.xcarchive \
            archive

      - name: Export IPA
        run: |
          xcodebuild \
            -exportArchive \
            -archivePath build/MyApp.xcarchive \
            -exportPath build/ipa \
            -exportOptionsPlist ios/ExportOptions.plist

      - uses: actions/upload-artifact@v4
        with:
          name: ios-ipa
          path: build/ipa/*.ipa

  deploy-android:
    needs: build-android
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: android-aab }
      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.jirlee.mobile
          releaseFiles: app-release.aab
          track: internal  # internal → alpha → beta → production

  deploy-ios:
    needs: build-ios
    runs-on: macos-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: ios-ipa }
      - name: Upload to App Store Connect
        env:
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
        run: xcrun altool --upload-app -f *.ipa --type ios --apiKey "$APP_STORE_CONNECT_API_KEY"
```

---

## 7. App Versioning Strategy

### Semantic Versioning for Mobile

```
MAJOR.MINOR.PATCH
  1  .  2  .  3

MAJOR: Breaking changes, UI redesign, forced update
MINOR: New features, non-breaking API changes
PATCH: Bug fixes, performance improvements
```

### Version Configuration

**Android** (`android/app/build.gradle`):

```groovy
android {
    defaultConfig {
        versionCode 10203       // Unique integer, always incrementing
        versionName "1.2.3"     // Human-readable version
    }
}
```

**iOS** (`ios/MyApp/Info.plist`):

```xml
<key>CFBundleShortVersionString</key>
<string>1.2.3</string>          <!-- Display version -->

<key>CFBundleVersion</key>
<string>10203</string>           <!-- Build number, always incrementing -->
```

### Auto-Incrementing Build Numbers

```bash
# Script to increment version code
CURRENT=$(grep "versionCode" android/app/build.gradle | awk '{print $2}')
NEW=$((CURRENT + 1))
sed -i "s/versionCode $CURRENT/versionCode $NEW/" android/app/build.gradle
```

### Forced Update Strategy

```typescript
// Check minimum supported version on app launch
async function checkMinVersion() {
  const response = await fetch('https://api.jirlee.com/config/app-version');
  const { minVersion } = await response.json();
  
  const currentVersion = DeviceInfo.getVersion(); // e.g., "1.2.3"
  
  if (compareVersions(currentVersion, minVersion) < 0) {
    Alert.alert(
      'Update Required',
      'Please update Jirlee to continue.',
      [{ text: 'Update', onPress: () => Linking.openURL(STORE_URL) }],
      { cancelable: false }
    );
  }
}
```

### Release Channels

| Channel | Purpose | Distribution |
|---|---|---|
| **Development** | Daily builds | Internal team |
| **Alpha** | Feature testing | QA team |
| **Beta** | Pre-release testing | TestFlight / Internal test track |
| **Production** | Public release | App Store / Play Store |
