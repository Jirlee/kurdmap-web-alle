# React Native Environment Setup & Configuration

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x (Current Stable)  
> **Last Updated:** 2026

---

## Table of Contents

1. [Prerequisites & System Requirements](#prerequisites--system-requirements)
2. [Framework Selection: Expo vs Bare](#framework-selection-expo-vs-bare)
3. [Node.js & Package Manager Setup](#nodejs--package-manager-setup)
4. [Android Development Environment](#android-development-environment)
5. [iOS Development Environment](#ios-development-environment)
6. [Creating a New Project](#creating-a-new-project)
7. [Running on Physical Devices](#running-on-physical-devices)
8. [Environment Variables & Configuration](#environment-variables--configuration)
9. [Troubleshooting Common Setup Issues](#troubleshooting-common-setup-issues)

---

## 1. Prerequisites & System Requirements

### Minimum Requirements

| Requirement | Android Development | iOS Development |
|---|---|---|
| **OS** | Windows, macOS, Linux | macOS only |
| **Node.js** | 22.11 or newer | 22.11 or newer |
| **JDK** | JDK 17 (Azul Zulu recommended) | Not required |
| **IDE** | Android Studio (latest) | Xcode (latest) |
| **RAM** | 8 GB+ (16 GB recommended) | 8 GB+ (16 GB recommended) |
| **Disk** | ~15 GB for SDK + emulator | ~25 GB for Xcode + simulators |

### Verify Installations

```bash
# Node.js
node --version   # Should be >= 22.11

# Java
java -version    # Should show JDK 17

# npm / yarn
npm --version
yarn --version

# React Native CLI (optional for Expo projects)
npx react-native --version
```

---

## 2. Framework Selection: Expo vs Bare

### Expo (Recommended for New Projects)

Expo is the **officially recommended** framework for new React Native projects as of 2025+. It provides:

- **Expo Go**: Test on physical devices instantly without building
- **EAS Build**: Cloud build service for iOS/Android
- **EAS Submit**: Automated store submission
- **Expo Router**: File-based routing (similar to Next.js)
- **Managed workflow**: Handles native configuration automatically
- **Over-the-Air Updates**: Push JS updates without app store review

```bash
# Create new Expo project
npx create-expo-app@latest MyApp
cd MyApp
npx expo start
```

### Bare React Native (Community CLI)

Use bare workflow when you need:

- Full control over native code (Android/iOS)
- Custom native modules not available in Expo
- Integration with existing native apps
- Specific native build configurations

```bash
npx @react-native-community/cli@latest init MyApp
cd MyApp
npm run android  # or npm run ios
```

### Decision Matrix

| Factor | Expo | Bare |
|---|---|---|
| Setup Time | Minutes | Hours |
| Native Module Access | Via Expo Modules | Direct |
| Build System | EAS (cloud) or local | Xcode/Android Studio |
| OTA Updates | Built-in | Manual setup |
| Custom Native Code | Expo Modules API | Direct Native |
| Enterprise CI/CD | EAS + custom | Full control |

---

## 3. Node.js & Package Manager Setup

### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version  # v22.11.0 or newer
```

### Package Manager

```bash
# npm (included with Node.js)
npm --version

# Yarn (alternative)
corepack enable
yarn --version

# pnpm (alternative — verify RN compatibility)
npm install -g pnpm
```

### Watchman (Recommended for macOS/Linux)

Watchman improves file watching performance for Metro bundler:

```bash
# macOS
brew install watchman

# Linux (build from source or use pre-built)
# See https://facebook.github.io/watchman/docs/install
```

---

## 4. Android Development Environment

### Step 1: Install JDK 17

```bash
# macOS (Homebrew)
brew install --cask zulu@17

# Verify
java -version
# openjdk version "17.x.x"
```

Add to shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Step 2: Install Android Studio

Download from [developer.android.com/studio](https://developer.android.com/studio).

During installation, ensure these are checked:
- Android SDK
- Android SDK Platform
- Android Virtual Device

### Step 3: Configure Android SDK

Open Android Studio → **Settings** → **Languages & Frameworks** → **Android SDK**:

**SDK Platforms tab:**
- Check **"Show Package Details"**
- Select **Android 15 (VanillaIceCream)** → **Android SDK Platform 35**
- Select **Intel x86 Atom_64 System Image** or **Google APIs ARM 64 v8a** (Apple Silicon)

**SDK Tools tab:**
- Check **"Show Package Details"**
- Select **Android SDK Build-Tools 36.0.0**
- Android SDK Command-line Tools (latest)
- Android Emulator
- Android SDK Platform-Tools

### Step 4: Set Environment Variables

Add to your shell profile:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk    # macOS
# export ANDROID_HOME=$HOME/Android/Sdk          # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload:

```bash
source ~/.zshrc  # or ~/.bashrc
```

Verify:

```bash
echo $ANDROID_HOME
adb --version
emulator -list-avds
```

### Step 5: Create Android Virtual Device (AVD)

1. Open Android Studio → **Virtual Device Manager**
2. Click **Create Device**
3. Select hardware profile (e.g., Pixel 7)
4. Select system image: **VanillaIceCream** API 35
5. Name the AVD and click **Finish**

```bash
# Start emulator from CLI
emulator -avd Pixel_7_API_35
```

### Step 6: Gradle Configuration

In `android/gradle.properties`:

```properties
# Memory allocation
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m

# Enable Hermes engine
hermesEnabled=true

# Enable New Architecture
newArchEnabled=true

# Enable parallel builds
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.caching=true
```

---

## 5. iOS Development Environment

### Step 1: Install Xcode

```bash
# Via Mac App Store or
xcode-select --install

# Verify
xcodebuild -version
# Xcode 16.x
```

### Step 2: Install CocoaPods

```bash
# Using Homebrew (recommended)
brew install cocoapods

# Or using Ruby gem
sudo gem install cocoapods

# Verify
pod --version
```

### Step 3: Install iOS Dependencies

```bash
cd ios
bundle install        # Install Ruby dependencies
bundle exec pod install  # Install CocoaPods
cd ..
```

### Step 4: Configure Xcode Signing

1. Open `ios/MyApp.xcworkspace` in Xcode
2. Select the project in navigator
3. Go to **Signing & Capabilities**
4. Select your **Team** (Apple Developer account)
5. Set **Bundle Identifier** (e.g., `com.yourcompany.myapp`)

---

## 6. Creating a New Project

### With Expo (Recommended)

```bash
# Create with default template
npx create-expo-app@latest MyApp

# Create with specific template
npx create-expo-app@latest MyApp --template tabs
npx create-expo-app@latest MyApp --template blank-typescript

# Navigate and start
cd MyApp
npx expo start
```

### With Bare React Native

```bash
# Create project
npx @react-native-community/cli@latest init MyApp

# Navigate
cd MyApp

# Install iOS dependencies
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on platforms (in separate terminals)
npm run android
npm run ios
```

### Project Structure (Bare)

```
MyApp/
├── android/                 # Android native project
│   ├── app/
│   │   ├── build.gradle    # App-level Gradle config
│   │   └── src/main/
│   │       ├── java/       # Native Android code
│   │       └── AndroidManifest.xml
│   ├── build.gradle         # Project-level Gradle
│   └── gradle.properties    # Build properties
├── ios/                     # iOS native project
│   ├── MyApp/
│   │   ├── AppDelegate.mm
│   │   └── Info.plist
│   ├── Podfile
│   └── MyApp.xcworkspace
├── src/                     # Your application code
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   └── utils/
├── __tests__/               # Test files
├── App.tsx                  # Root component
├── index.js                 # Entry point
├── metro.config.js          # Metro bundler config
├── babel.config.js          # Babel config
├── tsconfig.json            # TypeScript config
└── package.json
```

---

## 7. Running on Physical Devices

### Android Physical Device

1. **Enable Developer Options**: Settings → About Phone → Tap "Build Number" 7 times
2. **Enable USB Debugging**: Settings → Developer Options → USB Debugging → On
3. **Connect via USB** and accept the debugging prompt

```bash
# Verify device is detected
adb devices
# List of devices attached
# XXXXXXXX    device

# Run on connected device
npm run android
# or
npx react-native run-android
```

**Wireless Debugging (Android 11+):**

```bash
# On device: Developer Options → Wireless debugging → ON
# Note the IP:port shown

adb pair <ip>:<pairing-port>    # Enter pairing code
adb connect <ip>:<connection-port>
```

### iOS Physical Device

1. Connect iPhone via USB
2. Open `ios/MyApp.xcworkspace` in Xcode
3. Select your device in the device toolbar
4. Set up code signing (Team + Bundle ID)
5. Build and run (Cmd+R)

```bash
# CLI approach
npm run ios -- --device "iPhone Name"
```

**First-time device setup:**
- On iPhone: Settings → General → VPN & Device Management → Trust your developer certificate

### Metro Bundler

Metro runs automatically but can be started manually:

```bash
# Start Metro
npx react-native start

# Start with cache clear
npx react-native start --reset-cache

# Start on specific port
npx react-native start --port 8082
```

---

## 8. Environment Variables & Configuration

### React Native Config

```bash
npm install react-native-config
```

Create `.env` file at project root:

```env
API_URL=https://api.jirlee.com
API_KEY=your_api_key
ENV=production
```

Usage in code:

```typescript
import Config from 'react-native-config';

console.log(Config.API_URL);  // https://api.jirlee.com
```

### Expo Environment Variables

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.jirlee.com
```

```typescript
// Access in code
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### Build Variants

**Android** (`android/app/build.gradle`):

```groovy
android {
    buildTypes {
        debug {
            buildConfigField "String", "API_URL", "\"https://dev-api.jirlee.com\""
        }
        release {
            buildConfigField "String", "API_URL", "\"https://api.jirlee.com\""
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**iOS** (Xcode Schemes):
- Edit Scheme → Run → Arguments → Environment Variables

---

## 9. Troubleshooting Common Setup Issues

### Android Issues

| Problem | Solution |
|---|---|
| `SDK location not found` | Set `ANDROID_HOME` environment variable |
| `Could not find tools.jar` | Install JDK 17 and set `JAVA_HOME` |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Clear emulator data or increase virtual disk |
| Gradle build timeout | Increase `org.gradle.jvmargs` memory |
| `adb: device unauthorized` | Re-enable USB debugging; revoke/re-trust |
| Metro bundler connection refused | `adb reverse tcp:8081 tcp:8081` |

### iOS Issues

| Problem | Solution |
|---|---|
| `No signing certificate` | Add Apple Developer account in Xcode |
| Pod install fails | `cd ios && pod deintegrate && pod install` |
| Xcode build error after update | Clean build folder (Shift+Cmd+K) |
| `Unable to boot device` | Reset simulator (Device → Erase All Content) |

### General Issues

```bash
# Nuclear option: clean everything
cd android && ./gradlew clean && cd ..
cd ios && pod deintegrate && pod install && cd ..
npx react-native start --reset-cache

# Watchman issues
watchman watch-del-all

# Node modules
rm -rf node_modules && npm install
```

### Hermes Engine Verification

```javascript
// Check if Hermes is enabled at runtime
const isHermes = () => !!global.HermesInternal;
console.log('Hermes enabled:', isHermes());
```

---

## Quick Start Checklist

- [ ] Node.js 22.11+ installed
- [ ] JDK 17 installed (for Android)
- [ ] Android Studio + SDK Platform 35 + Build-Tools 36
- [ ] `ANDROID_HOME` and `JAVA_HOME` environment variables set
- [ ] Xcode latest + CocoaPods installed (for iOS)
- [ ] Watchman installed (recommended)
- [ ] Emulator/Simulator created and tested
- [ ] Physical device USB debugging enabled (optional)
- [ ] Project created and runs on target platform(s)
- [ ] Hermes engine verified as enabled
- [ ] New Architecture enabled (`newArchEnabled=true`)
