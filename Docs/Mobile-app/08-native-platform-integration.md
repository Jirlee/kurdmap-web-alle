# React Native Native Platform Integration

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [Native Platform Overview](#native-platform-overview)
2. [Communication: Native ↔ React Native](#communication-native--react-native)
3. [Android Native Integration](#android-native-integration)
4. [iOS Native Integration](#ios-native-integration)
5. [Legacy Interop Layer](#legacy-interop-layer)
6. [Platform-Specific Code](#platform-specific-code)

---

## 1. Native Platform Overview

React Native provides two categories of native extensions:

| Category | Purpose | New Arch Name | Legacy Name |
|---|---|---|---|
| **Native Modules** | Functions with no UI (storage, sensors, analytics) | Turbo Native Modules | Legacy Native Modules |
| **Native Components** | Platform views (maps, video, WebView) | Fabric Native Components | Legacy Native Components |

### Choosing the Right Approach

```
Need native UI rendering?
├── Yes → Fabric Native Component (or Legacy Native Component)
│   ├── Android: ViewManager + custom View
│   └── iOS: ViewManager + UIView subclass
│
└── No → Turbo Native Module (or Legacy Native Module)
    ├── Both platforms differ → Platform-specific Java + ObjC implementations
    └── Same logic on both → Pure C++ Module
```

---

## 2. Communication: Native ↔ React Native

### Data Flow Principles

React Native follows **one-directional data flow** (same as React):
- Parent → Child: via **props** (properties)
- Child → Parent: via **callbacks** and **events**
- Across boundaries: via **native modules** and **events**

### Passing Properties: Native → React Native

**Android:**

```kotlin
class MainActivity : ReactActivity() {
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : ReactActivityDelegate(this, mainComponentName) {
            override fun getLaunchOptions(): Bundle {
                return Bundle().apply {
                    putString("userId", "user_123")
                    putString("language", "ku")
                    putStringArrayList("features", arrayListOf("search", "audio"))
                }
            }
        }
}
```

```typescript
// In your root component
interface AppProps {
  userId: string;
  language: string;
  features: string[];
}

function App(props: AppProps) {
  // props.userId === "user_123"
  // props.language === "ku"
  return <MainScreen {...props} />;
}
```

**Updating properties dynamically (Android):**

```kotlin
// Properties can be updated at any time from native side
val updatedProps = reactRootView.appProperties ?: Bundle()
updatedProps.putString("language", "en")
reactRootView.appProperties = updatedProps
// This triggers a re-render with new props (on main thread only)
```

### Passing Properties: React Native → Native

Properties flow to native components via `@ReactProp`:

```java
// Android ViewManager
@ReactProp(name = "sourceUrl")
public void setSourceUrl(ReactWebView view, String url) {
    view.loadUrl(url);
}

@ReactProp(name = "zoomEnabled", defaultBoolean = true)
public void setZoomEnabled(ReactWebView view, boolean enabled) {
    view.getSettings().setSupportZoom(enabled);
}
```

```typescript
// In React
<WebView sourceUrl="https://jirlee.com" zoomEnabled={false} />
```

### Events: Native → React Native

Native components can emit events that JavaScript listens to:

```java
// Android: Emit event from native view
public void emitEvent(String eventName, WritableMap data) {
    ReactContext context = (ReactContext) getContext();
    int surfaceId = UIManagerHelper.getSurfaceId(context);
    EventDispatcher dispatcher = UIManagerHelper
        .getEventDispatcherForReactTag(context, getId());
    
    if (dispatcher != null) {
        dispatcher.dispatchEvent(new CustomEvent(surfaceId, getId(), data));
    }
}
```

```typescript
// JavaScript: Listen for event
<NativeComponent
  onCustomEvent={(event) => {
    console.log(event.nativeEvent.data);
  }}
/>
```

### Native Modules: React Native → Native

```typescript
// Calling native function from JavaScript
import NativeLocalStorage from './specs/NativeLocalStorage';

// Synchronous call (via JSI in New Architecture)
const value = NativeLocalStorage.getItem('key');

// Async call with Promise
const result = await NativeAnalytics.trackEvent('search', { query: 'hello' });
```

### Event Emitter Pattern (Native Modules → JS)

```java
// Android: Emit events from module (not component)
import com.facebook.react.modules.core.DeviceEventManagerModule;

private void sendEvent(String eventName, WritableMap params) {
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
}
```

```typescript
// JavaScript: Subscribe to events
import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.MyModule);
const subscription = emitter.addListener('onStatusChange', (event) => {
  console.log('Status:', event.status);
});

// Clean up
subscription.remove();
```

---

## 3. Android Native Integration

### Android Project Structure

```
android/
├── app/
│   ├── build.gradle                     # App-level build config
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/jirlee/mobile/
│   │   │   ├── MainApplication.kt      # App entry, package registration
│   │   │   ├── MainActivity.kt         # Main React activity
│   │   │   ├── NativeLocalStorageModule.kt  # Turbo module
│   │   │   └── NativeLocalStoragePackage.kt # Package registration
│   │   ├── jni/                         # C++ native code
│   │   │   ├── CMakeLists.txt
│   │   │   └── OnLoad.cpp
│   │   └── res/                         # Android resources
│   └── proguard-rules.pro
├── build.gradle                         # Project-level build config
├── gradle.properties                    # Build properties
└── settings.gradle
```

### Android Permissions

```xml
<!-- AndroidManifest.xml -->
<manifest>
    <!-- Internet (auto-included, required for development) -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Common permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Biometric -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
</manifest>
```

**Runtime Permission Handling:**

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Permission',
      message: 'Jirlee needs microphone access to record pronunciations',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
```

### Headless JS (Android Background Tasks)

Run JavaScript tasks when the app is in the background:

```java
// Register headless task service
// AndroidManifest.xml
<service android:name="com.facebook.react.HeadlessJsTaskService" />
```

```typescript
// Register the task
import { AppRegistry } from 'react-native';

const syncDictionaryTask = async (taskData: { userId: string }) => {
  // Background sync logic
  const response = await fetch(`https://api.jirlee.com/sync/${taskData.userId}`);
  // Process response...
};

AppRegistry.registerHeadlessTask('SyncDictionary', () => syncDictionaryTask);
```

---

## 4. iOS Native Integration

### iOS Project Structure

```
ios/
├── MyApp/
│   ├── AppDelegate.mm          # App lifecycle, module registration
│   ├── Info.plist              # App configuration
│   ├── LaunchScreen.storyboard
│   └── NativeLocalStorage.mm   # Turbo module implementation
├── MyApp.xcworkspace           # Xcode workspace (use this to open)
├── Podfile                     # CocoaPods dependencies
└── Podfile.lock
```

### iOS Permissions

```xml
<!-- Info.plist -->
<key>NSCameraUsageDescription</key>
<string>Jirlee needs camera access to scan word images</string>

<key>NSMicrophoneUsageDescription</key>
<string>Jirlee needs microphone to record pronunciations</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Jirlee uses your location for regional dialect recommendations</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Jirlee needs photo access to import word images</string>

<key>NSFaceIDUsageDescription</key>
<string>Jirlee uses Face ID for secure authentication</string>
```

### iOS App Extensions

React Native works with iOS App Extensions (widgets, share extensions, etc.) with some considerations:
- Extensions have limited memory (16 MB for widgets)
- Share the same app group for data access
- Cannot run a full React Native runtime in extensions

---

## 5. Legacy Interop Layer

### When You Need Legacy Modules

- Using third-party libraries that haven't migrated to New Architecture
- Incrementally migrating an existing app
- Libraries that use reflection-based APIs

### Legacy Module with New Architecture

React Native 0.84+ includes an interop layer that allows Legacy Native Modules to work with the New Architecture transparently:

```java
// A Legacy Native Module still works 
@ReactModule(name = "LegacyModule")
public class LegacyModule extends ReactContextBaseJavaModule {
    
    @ReactMethod
    public void doSomething(String input, Promise promise) {
        // This works with both old and new architecture
        promise.resolve("result");
    }
}
```

### Migration Strategy

| Phase | Action |
|---|---|
| 1 | Enable New Architecture (`newArchEnabled=true`) |
| 2 | Verify existing modules work via interop layer |
| 3 | Write new modules as Turbo Modules |
| 4 | Gradually migrate legacy modules to Turbo Modules |
| 5 | Convert legacy components to Fabric components |

---

## 6. Platform-Specific Code

### File Extension Approach

```
Button.tsx           # Shared logic
Button.android.tsx   # Android-specific
Button.ios.tsx       # iOS-specific
```

Metro automatically picks the right file based on platform.

### `Platform` API

```typescript
import { Platform, StyleSheet } from 'react-native';

// Simple platform check
const instructions = Platform.select({
  ios: 'Shake your device for dev menu',
  android: 'Double-tap R to reload',
  default: 'Unknown platform',
});

// Platform-specific styles
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  }),
});

// Version checking
if (Platform.OS === 'android' && Platform.Version >= 33) {
  // Android 13+ specific code
}

if (Platform.OS === 'ios') {
  const majorVersion = parseInt(Platform.Version as string, 10);
  if (majorVersion >= 17) {
    // iOS 17+ specific code
  }
}
```

### Platform-Specific Constants

```typescript
// Platform constants
Platform.OS           // 'ios' | 'android'
Platform.Version      // Android API level (number) or iOS version (string)
Platform.isPad        // iOS iPad
Platform.isTV         // Apple TV
Platform.isTesting    // Running in test environment
Platform.constants    // { reactNativeVersion, osVersion, ... }
```

### Native-Specific Features Matrix

| Feature | Android | iOS |
|---|---|---|
| Background tasks | Headless JS, WorkManager | Background Modes, BGTaskScheduler |
| Push notifications | Firebase Cloud Messaging | APNs |
| Deep links | App Links (HTTPS) | Universal Links (HTTPS) |
| Biometrics | BiometricPrompt API | LocalAuthentication (Face ID / Touch ID) |
| Secure storage | EncryptedSharedPreferences | Keychain Services |
| In-app purchases | Google Play Billing | StoreKit 2 |
| Widgets | App Widgets (Jetpack Glance) | WidgetKit |
| File system | DocumentProvider | FileProvider |
