# React Native New Architecture

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x (New Architecture Enabled by Default)  
> **Last Updated:** 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Codegen](#codegen)
3. [Turbo Native Modules](#turbo-native-modules)
4. [Fabric Native Components](#fabric-native-components)
5. [Pure C++ Modules (Cross-Platform)](#pure-c-modules-cross-platform)
6. [Advanced Topics](#advanced-topics)
7. [Appendix: Codegen Type Mappings](#appendix-codegen-type-mappings)

---

## 1. Architecture Overview

### Old Architecture vs New Architecture

| Feature | Old Architecture | New Architecture |
|---|---|---|
| **Bridge** | Async JSON serialization | JSI (JavaScript Interface) — synchronous C++ |
| **Native Modules** | Legacy Native Modules | **Turbo Native Modules** |
| **UI Components** | Old Renderer | **Fabric** |
| **Code Generation** | Manual boilerplate | **Codegen** (auto-generated from specs) |
| **Concurrency** | All on JS thread | Concurrent rendering support |
| **Type Safety** | Runtime only | Compile-time via Codegen |
| **Performance** | Bridge overhead | Direct C++ calls |

### Enabling New Architecture

New Architecture is **enabled by default** in React Native 0.84+:

```properties
# android/gradle.properties
newArchEnabled=true   # Default: true

# To disable (not recommended for new projects):
# newArchEnabled=false
```

### Key Components

```
┌────────────────────────────────────────────┐
│              JavaScript Layer               │
│  (TypeScript / Flow Spec Files)            │
└──────────────┬─────────────────────────────┘
               │ Codegen
               ▼
┌────────────────────────────────────────────┐
│              C++ Scaffolding               │
│  (Auto-generated interfaces + delegates)   │
└──────┬───────────────────────┬─────────────┘
       │                       │
       ▼                       ▼
┌──────────────┐    ┌───────────────────┐
│ Android (Java│    │ iOS (Obj-C++ /    │
│ / Kotlin)    │    │ Swift)            │
└──────────────┘    └───────────────────┘
```

---

## 2. Codegen

### What is Codegen?

Codegen is a **build-time tool** that reads your TypeScript/Flow **spec files** and generates:
- C++ glue code (JSI interfaces)
- Java/Kotlin scaffolding (Android)
- Objective-C++ scaffolding (iOS)

This ensures **type-safe communication** between JavaScript and native code.

### How Codegen Works

1. You write a **spec file** in TypeScript (or Flow)
2. At build time, Codegen reads the spec
3. Generates C++ interfaces + platform-specific code
4. Your native code implements the generated interfaces

### Spec File Naming Conventions

| Type | Naming Pattern | Example |
|---|---|---|
| **Native Module** | `Native<ModuleName>.ts` | `NativeLocalStorage.ts` |
| **Native Component** | `<ComponentName>NativeComponent.ts` | `WebViewNativeComponent.ts` |

These suffixes are **not just conventions** — Codegen uses them to detect spec files.

### Running Codegen

**Android** — runs automatically during Gradle build, or manually:

```bash
cd android
./gradlew generateCodegenArtifactsFromSchema
```

**iOS** — runs automatically during `pod install`:

```bash
cd ios
bundle exec pod install
```

### Codegen Configuration in `package.json`

```json
{
  "codegenConfig": {
    "name": "AppSpec",
    "type": "all",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.jirlee.mobile"
    },
    "ios": {
      "componentProvider": {
        "CustomWebView": "RCTWebView"
      }
    }
  }
}
```

| Field | Description |
|---|---|
| `name` | Output artifact name (used in generated code) |
| `type` | `"modules"`, `"components"`, or `"all"` |
| `jsSrcsDir` | Directory containing spec files |
| `android.javaPackageName` | Java package for generated Android code |
| `ios.componentProvider` | Maps JS component names to iOS class names |

---

## 3. Turbo Native Modules

### What are Turbo Modules?

Turbo Native Modules replace Legacy Native Modules. They provide:
- **Lazy initialization** (loaded only when used)
- **Synchronous access** via JSI (no bridge overhead)
- **Type-safe** interfaces via Codegen
- **Direct C++ invocation** from JavaScript

### Complete Example: Local Storage Module

#### Step 1: Define the Spec

```typescript
// specs/NativeLocalStorage.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear(): void;
  getAllKeys(): string[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeLocalStorage');
```

#### Step 2: Configure Codegen

```json
// package.json
{
  "codegenConfig": {
    "name": "AppSpec",
    "type": "modules",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.jirlee.mobile"
    }
  }
}
```

#### Step 3: Android Implementation (Kotlin)

```kotlin
// android/app/src/main/java/com/jirlee/mobile/NativeLocalStorageModule.kt
package com.jirlee.mobile

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeLocalStorageModule.NAME)
class NativeLocalStorageModule(reactContext: ReactApplicationContext) :
    NativeLocalStorageSpec(reactContext) {

    companion object {
        const val NAME = "NativeLocalStorage"
    }

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences("jirlee_storage", Context.MODE_PRIVATE)

    override fun getName(): String = NAME

    override fun setItem(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    override fun getItem(key: String): String? {
        return prefs.getString(key, null)
    }

    override fun removeItem(key: String) {
        prefs.edit().remove(key).apply()
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }

    override fun getAllKeys(): Array<String> {
        return prefs.all.keys.toTypedArray()
    }
}
```

#### Step 4: Register the Module (Android)

```kotlin
// android/app/src/main/java/com/jirlee/mobile/NativeLocalStoragePackage.kt
package com.jirlee.mobile

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeLocalStoragePackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeLocalStorageModule.NAME) {
            NativeLocalStorageModule(reactContext)
        } else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeLocalStorageModule.NAME to ReactModuleInfo(
                    NativeLocalStorageModule.NAME,
                    NativeLocalStorageModule.NAME,
                    false, false, false, true
                )
            )
        }
    }
}
```

Add to `MainApplication`:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(NativeLocalStoragePackage())
    }
```

#### Step 5: iOS Implementation (Objective-C++)

```objc
// ios/NativeLocalStorage.h
#import <AppSpec/AppSpec.h>

@interface NativeLocalStorage : NSObject <NativeLocalStorageSpec>
@end
```

```objc
// ios/NativeLocalStorage.mm
#import "NativeLocalStorage.h"

@implementation NativeLocalStorage

RCT_EXPORT_MODULE(NativeLocalStorage)

- (void)setItem:(NSString *)key value:(NSString *)value {
    [[NSUserDefaults standardUserDefaults] setObject:value forKey:key];
}

- (NSString *)getItem:(NSString *)key {
    return [[NSUserDefaults standardUserDefaults] stringForKey:key];
}

- (void)removeItem:(NSString *)key {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
}

- (void)clear {
    NSDictionary *keys = [[NSUserDefaults standardUserDefaults] dictionaryRepresentation];
    for (NSString *key in keys) {
        [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
    }
}

- (NSArray<NSString *> *)getAllKeys {
    return [[[NSUserDefaults standardUserDefaults] dictionaryRepresentation] allKeys];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeLocalStorageSpecJSI>(params);
}

@end
```

#### Step 6: Use in JavaScript

```typescript
// components/StorageDemo.tsx
import NativeLocalStorage from '../specs/NativeLocalStorage';

function StorageDemo() {
  const [value, setValue] = useState('');

  const save = () => {
    NativeLocalStorage.setItem('greeting', value);
    alert('Saved!');
  };

  const load = () => {
    const stored = NativeLocalStorage.getItem('greeting');
    if (stored) setValue(stored);
  };

  const clear = () => {
    NativeLocalStorage.clear();
    setValue('');
  };

  return (
    <View>
      <TextInput value={value} onChangeText={setValue} />
      <Button title="Save" onPress={save} />
      <Button title="Load" onPress={load} />
      <Button title="Clear" onPress={clear} />
    </View>
  );
}
```

---

## 4. Fabric Native Components

### What is Fabric?

Fabric is the new rendering system that replaces the old renderer. It enables:
- **Synchronous rendering** (no bridge delays for UI updates)
- **Concurrent rendering** support
- **Typed props** via Codegen

### Creating a Fabric Native Component (WebView Example)

#### Step 1: Define the Spec

```typescript
// specs/WebViewNativeComponent.ts
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type WebViewScriptLoadedEvent = {
  result: 'success' | 'error';
};

export interface NativeProps extends ViewProps {
  sourceURL?: string;
  onScriptLoaded?: CodegenTypes.BubblingEventHandler<WebViewScriptLoadedEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
  'CustomWebView',
) as HostComponent<NativeProps>;
```

#### Step 2: Configure Codegen

```json
{
  "codegenConfig": {
    "name": "AppSpec",
    "type": "components",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.webview"
    },
    "ios": {
      "componentProvider": {
        "CustomWebView": "RCTWebView"
      }
    }
  }
}
```

#### Step 3: Android — ReactWebView

```java
// android/src/main/java/com/webview/ReactWebView.java
package com.webview;

import android.content.Context;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;

public class ReactWebView extends WebView {
    public ReactWebView(Context context) {
        super(context);
        configureComponent();
    }

    private void configureComponent() {
        this.setLayoutParams(new LayoutParams(
            LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        this.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                emitOnScriptLoaded(OnScriptLoadedEventResult.success);
            }
        });
    }

    public void emitOnScriptLoaded(OnScriptLoadedEventResult result) {
        ReactContext reactContext = (ReactContext) getContext();
        int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
        var eventDispatcher = UIManagerHelper
            .getEventDispatcherForReactTag(reactContext, getId());

        WritableMap payload = Arguments.createMap();
        payload.putString("result", result.name());

        if (eventDispatcher != null) {
            eventDispatcher.dispatchEvent(
                new OnScriptLoadedEvent(surfaceId, getId(), payload));
        }
    }

    public enum OnScriptLoadedEventResult { success, error }

    private class OnScriptLoadedEvent extends Event<OnScriptLoadedEvent> {
        private final WritableMap payload;

        OnScriptLoadedEvent(int surfaceId, int viewId, WritableMap payload) {
            super(surfaceId, viewId);
            this.payload = payload;
        }

        @Override public String getEventName() { return "onScriptLoaded"; }
        @Override public WritableMap getEventData() { return payload; }
    }
}
```

#### Step 4: Android — ViewManager

```java
// android/src/main/java/com/webview/ReactWebViewManager.java
package com.webview;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.CustomWebViewManagerInterface;
import com.facebook.react.viewmanagers.CustomWebViewManagerDelegate;

@ReactModule(name = ReactWebViewManager.REACT_CLASS)
class ReactWebViewManager extends SimpleViewManager<ReactWebView>
    implements CustomWebViewManagerInterface<ReactWebView> {

    static final String REACT_CLASS = "CustomWebView";

    private final CustomWebViewManagerDelegate<ReactWebView,
        ReactWebViewManager> delegate = new CustomWebViewManagerDelegate<>(this);

    @Override
    public ViewManagerDelegate<ReactWebView> getDelegate() { return delegate; }

    @Override
    public String getName() { return REACT_CLASS; }

    @Override
    public ReactWebView createViewInstance(ThemedReactContext context) {
        return new ReactWebView(context);
    }

    @ReactProp(name = "sourceUrl")
    @Override
    public void setSourceURL(ReactWebView view, String sourceURL) {
        if (sourceURL == null) {
            view.emitOnScriptLoaded(ReactWebView.OnScriptLoadedEventResult.error);
            return;
        }
        view.loadUrl(sourceURL, new java.util.HashMap<>());
    }
}
```

#### Step 5: Use in App

```typescript
// App.tsx
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import WebView from './specs/WebViewNativeComponent';

function App() {
  return (
    <View style={styles.container}>
      <WebView
        sourceURL="https://react.dev/"
        style={styles.webview}
        onScriptLoaded={() => Alert.alert('Page Loaded')}
      />
    </View>
  );
}
```

---

## 5. Pure C++ Modules (Cross-Platform)

### When to Use C++ Modules

- Logic shared identically between Android and iOS
- Performance-critical computations (image processing, crypto)
- Existing C/C++ libraries you want to wrap
- Write once, works on both platforms

### Complete Example: C++ Math Module

#### Step 1: Spec File

```typescript
// specs/NativeSampleModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  add(a: number, b: number): number;
  multiply(a: number, b: number): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeSampleModule');
```

#### Step 2: C++ Implementation

```cpp
// shared/NativeSampleModule.h
#pragma once

#include <AppSpecJSI.h>  // Generated by Codegen

namespace facebook::react {

class NativeSampleModule : public NativeSampleModuleCxxSpec<NativeSampleModule> {
public:
    NativeSampleModule(std::shared_ptr<CallInvoker> jsInvoker);

    double add(jsi::Runtime& rt, double a, double b);
    double multiply(jsi::Runtime& rt, double a, double b);
};

} // namespace facebook::react
```

```cpp
// shared/NativeSampleModule.cpp
#include "NativeSampleModule.h"

namespace facebook::react {

NativeSampleModule::NativeSampleModule(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeSampleModuleCxxSpec(std::move(jsInvoker)) {}

double NativeSampleModule::add(jsi::Runtime& rt, double a, double b) {
    return a + b;
}

double NativeSampleModule::multiply(jsi::Runtime& rt, double a, double b) {
    return a * b;
}

} // namespace facebook::react
```

#### Step 3: Android Registration (OnLoad.cpp)

```cpp
// android/app/src/main/jni/OnLoad.cpp
#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <rncore.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <NativeSampleModule.h>

namespace facebook::react {

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  if (name == "NativeSampleModule") {
    return std::make_shared<NativeSampleModule>(jsInvoker);
  }
  return nullptr;
}

} // namespace facebook::react
```

#### Step 4: Android CMakeLists.txt

```cmake
# android/app/src/main/jni/CMakeLists.txt
cmake_minimum_required(VERSION 3.13)
project(appmodules)

# Add the shared C++ source
add_library(appmodules SHARED
    OnLoad.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../shared/NativeSampleModule.cpp
)

target_include_directories(appmodules PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../shared
)

target_link_libraries(appmodules
    fabricjni
    fbjni
    jsi
    react_codegen_AppSpec
    react_nativemodule_core
    reactnativejni
    turbomodulejsijni
)
```

#### Step 5: iOS Registration

```objc
// ios/SampleApp/AppDelegate.mm
#import "NativeSampleModule.h"

// In module provider:
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker {
  if (name == "NativeSampleModule") {
    return std::make_shared<facebook::react::NativeSampleModule>(jsInvoker);
  }
  return nullptr;
}
```

---

## 6. Advanced Topics

### Custom C++ Types

Add custom types to your C++ modules for complex data structures:

```cpp
// Define a custom type that bridges between JS and C++
struct WordEntry {
    std::string word;
    std::string definition;
    std::vector<std::string> examples;
};
```

### Use Swift in Turbo Modules

Swift can be used for iOS implementations of Turbo Modules via Objective-C++ bridging.

### Native Module Events

Turbo Modules can emit events back to JavaScript for real-time communication.

### Native Module Lifecycle

Modules can respond to app lifecycle events (foreground, background, etc.).

### Direct Manipulation

Fabric Components support direct manipulation for performance-critical updates that bypass React's reconciliation:

- `measure()` — get component dimensions
- `setNativeProps()` — update props directly
- Native commands via `dispatchCommand()`

---

## 7. Appendix: Codegen Type Mappings

### Supported Types

| TypeScript | Java (Android) | Obj-C (iOS) |
|---|---|---|
| `string` | `String` | `NSString` |
| `boolean` | `Boolean` | `NSNumber` (BOOL) |
| `number` | `double` | `NSNumber` |
| `Object` | `ReadableMap` | `@` (untyped dict) |
| `Array<T>` | `ReadableArray` | `NSArray` |
| `Promise<T>` | `Promise` | `RCTPromiseResolve + RCTPromiseReject` |
| `() => void` (callback) | `Callback` | `RCTResponseSenderBlock` |
| `{| key: type |}` (object literal) | Generated class | Generated struct |
| `'A' \| 'B'` (union) | Only in callbacks | Only in callbacks |
| `?T` (nullable) | `@Nullable T` | `T _Nullable` |

### Terminology

| Term | Definition |
|---|---|
| **Spec** | TypeScript/Flow file describing the API for a module or component |
| **Native Module** | Library with no UI — functions and objects (storage, network) |
| **Native Component** | Platform view exposed as React component (WebView, MapView) |
| **Turbo Module** | New Architecture version of Native Module |
| **Fabric Component** | New Architecture version of Native Component |
| **JSI** | JavaScript Interface — synchronous C++ bridge to JS engine |
| **Codegen** | Tool that generates native scaffolding from spec files |
