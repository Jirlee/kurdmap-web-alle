# React Native Core Concepts & TypeScript

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [TypeScript in React Native](#typescript-in-react-native)
2. [Project Configuration](#project-configuration)
3. [Integration with Existing Apps](#integration-with-existing-apps)
4. [Integration with Android Fragments](#integration-with-android-fragments)
5. [Networking & API Communication](#networking--api-communication)
6. [Release Management & Versioning](#release-management--versioning)

---

## 1. TypeScript in React Native

### Default TypeScript Support

React Native uses TypeScript by default since 2024+. New projects created with `npx create-expo-app` or `npx @react-native-community/cli init` automatically include TypeScript.

### TypeScript Configuration

**`tsconfig.json`** (uses the shared RN config):

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### How TypeScript Works in RN

- TypeScript is **not** compiled by `tsc` at runtime
- **Babel** transforms TypeScript files during bundling via `@babel/plugin-transform-typescript`
- Type checking is done by your **IDE** (VS Code) and **CI pipeline** only
- Codegen uses TypeScript specs to generate native C++/Java/ObjC++ code

### Enterprise TypeScript Patterns

#### Strict Typing for Navigation

```typescript
// types/navigation.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  WordDetail: { wordId: string; lang: 'ku' | 'en' | 'ar' };
  Search: { query?: string };
  Settings: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type WordDetailProps = NativeStackScreenProps<RootStackParamList, 'WordDetail'>;
```

#### API Response Types

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  definition: string;
  pronunciation: string;
  audioUrl?: string;
  examples: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Component Props with Generics

```typescript
// components/DataList.tsx
import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

interface DataListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  emptyMessage?: string;
  loading?: boolean;
}

function DataList<T extends { id: string }>({
  data,
  renderItem,
  emptyMessage = 'No items',
  loading = false,
  ...rest
}: DataListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => renderItem(item, index)}
      {...rest}
    />
  );
}

export default DataList;
```

#### Custom Hooks with Type Safety

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import { ApiResponse } from '../types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiCall();
      if (response.success) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: response.message });
      }
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  return { ...state, execute };
}
```

---

## 2. Project Configuration

### Babel Configuration

**`babel.config.js`:**

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Path aliases
    ['module-resolver', {
      root: ['./src'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@screens': './src/screens',
      },
    }],
    // Optional: Reanimated plugin (must be last)
    'react-native-reanimated/plugin',
  ],
};
```

### Metro Configuration

**`metro.config.js`:**

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Add custom file extensions
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

### ESLint Configuration

**`.eslintrc.js`:**

```javascript
module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

---

## 3. Integration with Existing Apps

### When to Integrate vs. Build Fresh

| Scenario | Approach |
|---|---|
| Brand new mobile app | Fresh RN project (Expo recommended) |
| Add RN screens to existing native app | Integration mode |
| Migrate native app to RN incrementally | Hybrid integration |
| Shared business logic with web | RN + shared TypeScript modules |

### Android Integration

#### Step 1: Add React Native Dependencies

In your existing Android project's `settings.gradle`:

```groovy
includeBuild('../node_modules/@react-native/gradle-plugin')

apply(from: file("../node_modules/@react-native/gradle-plugin/settings.gradle.kts"))

include ':app'
```

In `app/build.gradle`:

```groovy
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

dependencies {
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.react:hermes-android")
}
```

#### Step 2: Create React Native Activity

```kotlin
// MyReactActivity.kt
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MyReactActivity : ReactActivity() {
    override fun getMainComponentName(): String = "MyReactNativeApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
```

#### Step 3: Launch from Existing Activity

```kotlin
// In your existing Activity or Fragment
val intent = Intent(this, MyReactActivity::class.java)
startActivity(intent)
```

### Android Fragment Integration

For embedding React Native in a `Fragment` within an existing Activity:

```kotlin
// ReactFragment.kt
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.facebook.react.ReactFragment

class MyReactFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ReactFragment.Builder()
            .setComponentName("MyReactComponent")
            .setLaunchOptions(arguments ?: Bundle())
            .build()
            .onCreateView(inflater, container, savedInstanceState)
    }
}
```

### iOS Integration

#### Step 1: Configure Podfile

```ruby
# ios/Podfile
require_relative '../node_modules/react-native/scripts/react_native_pods'

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'YourExistingApp' do
  config = use_native_modules!
  use_react_native!(
    :path => "../node_modules/react-native",
    :hermes_enabled => true,
    :fabric_enabled => true,
  )
end
```

#### Step 2: Create RCTRootView

```swift
// In your existing ViewController
import React

func showReactNativeView() {
    let bundleURL = RCTBundleURLProvider.sharedSettings()
        .jsBundleURL(forBundleRoot: "index")
    
    let rootView = RCTRootView(
        bundleURL: bundleURL!,
        moduleName: "MyReactComponent",
        initialProperties: ["userId": "123"],
        launchOptions: nil
    )
    
    let vc = UIViewController()
    vc.view = rootView
    present(vc, animated: true)
}
```

---

## 4. Integration with Android Fragments

### Complete Fragment Integration Guide

React Native can render inside a Fragment, which is useful for:
- Tab-based navigation with native tabs
- Bottom sheets containing React Native content
- Partial screen React Native views

```kotlin
// Step 1: Application setup
class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages
            
            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)
}

// Step 2: Host Activity with FrameLayout
class HostActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_host)
        
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .add(R.id.fragment_container, MyReactFragment())
                .commit()
        }
    }
}
```

**Layout XML (`activity_host.xml`):**

```xml
<FrameLayout
    android:id="@+id/fragment_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### Passing Data to Fragment

```kotlin
class MyReactFragment : Fragment() {
    companion object {
        fun newInstance(wordId: String, lang: String): MyReactFragment {
            return MyReactFragment().apply {
                arguments = Bundle().apply {
                    putString("wordId", wordId)
                    putString("lang", lang)
                }
            }
        }
    }
}
```

---

## 5. Networking & API Communication

### Fetch API (Built-in)

React Native supports the standard `fetch` API:

```typescript
// services/api.ts
const BASE_URL = 'https://api.jirlee.com/api';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout ?? 30000
  );

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Usage
export const dictionaryApi = {
  search: (query: string) =>
    apiRequest<DictionaryEntry[]>(`/words/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    }),
  
  getWord: (id: string) =>
    apiRequest<DictionaryEntry>(`/words/${id}`, { method: 'GET' }),
};
```

### WebSocket Support

```typescript
// services/websocket.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;

  connect(url: string, onMessage: (data: unknown) => void) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        setTimeout(() => this.connect(url, onMessage), delay);
      }
    };
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.maxReconnects = 0; // Prevent reconnection
    this.ws?.close();
  }
}
```

### Network Security Configuration (Android)

**`android/app/src/main/res/xml/network_security_config.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Production: HTTPS only -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Debug: Allow localhost cleartext -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>

    <!-- Allow cleartext for Metro bundler in dev -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

### iOS App Transport Security (ATS)

**`ios/MyApp/Info.plist`:**

```xml
<!-- Production: enforce HTTPS -->
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Remove NSAllowsArbitraryLoads in production -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

---

## 6. Release Management & Versioning

### React Native Release Cycle

- **6 minor releases per year** (roughly bi-monthly)
- **Latest 3 minor series** are actively supported
- Current: **0.84.x** (active), 0.83.x, 0.82.x (supported)
- Next: **0.85** (branch cut: 2026-03-02, stable: 2026-04-06)

### Version Schema

```
0.MINOR.PATCH

0.84.0    → Initial release of 0.84 series
0.84.1    → Patch with bug fixes
0.84.2-rc.0 → Release candidate for next patch
```

### Upgrade Strategy

```bash
# Check what changes are needed
npx react-native upgrade

# Use React Native Upgrade Helper (recommended)
# https://react-native-community.github.io/upgrade-helper/

# Step-by-step upgrade
npm install react-native@0.85.0
cd ios && pod install

# For Expo projects
npx expo install expo@latest
```

### Upgrade Checklist

- [ ] Read changelog for breaking changes
- [ ] Update `react-native` package
- [ ] Update peer dependencies (`react`, `@react-native/*`)
- [ ] Run `pod install` for iOS
- [ ] Clean build caches
- [ ] Run full test suite
- [ ] Test on both platforms
- [ ] Update CI/CD pipeline configs
