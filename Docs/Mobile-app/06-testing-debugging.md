# React Native Testing & Debugging

> **Level:** Senior Enterprise  
> **React Native Version:** 0.84.x  
> **Last Updated:** 2026

---

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Static Analysis](#static-analysis)
3. [Unit Testing with Jest](#unit-testing-with-jest)
4. [Component Testing with RNTL](#component-testing-with-rntl)
5. [Integration Testing](#integration-testing)
6. [End-to-End (E2E) Testing](#end-to-end-e2e-testing)
7. [Snapshot Testing](#snapshot-testing)
8. [Debugging Tools & Techniques](#debugging-tools--techniques)
9. [CI/CD Testing Pipeline](#cicd-testing-pipeline)

---

## 1. Testing Strategy Overview

### The Testing Pyramid

```
         ╱╲
        ╱ E2E ╲           Few — Slow — High confidence
       ╱────────╲
      ╱Integration╲       Moderate
     ╱──────────────╲
    ╱   Component     ╲    Many
   ╱────────────────────╲
  ╱      Unit Tests       ╲  Most — Fast — Low confidence
 ╱──────────────────────────╲
╱      Static Analysis        ╲  Fastest — Catches type errors
╲━━━━━━━━━━━━━━━━━━━━━━━━━━━━╱
```

### Testing Types at a Glance

| Type | Tool | What It Tests | Speed |
|---|---|---|---|
| **Static** | TypeScript + ESLint | Type correctness, code patterns | Instant |
| **Unit** | Jest | Pure functions, hooks, services | < 1s |
| **Component** | React Native Testing Library | UI behavior, user interaction | < 5s |
| **Integration** | RNTL + MSW | Screen flows, API integration | < 10s |
| **E2E** | Detox / Maestro | Full app on device/emulator | 30s+ |
| **Snapshot** | Jest | UI regression detection | < 1s |

---

## 2. Static Analysis

### TypeScript

TypeScript catches type errors at compile time:

```bash
# Run type checking
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

```json
// tsconfig.json — strict settings
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint

```bash
# Install
npm install --save-dev @react-native/eslint-config eslint

# Run
npx eslint src/ --ext .ts,.tsx

# Auto-fix
npx eslint src/ --ext .ts,.tsx --fix
```

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'warn',
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
```

---

## 3. Unit Testing with Jest

### Setup

Jest comes pre-configured with React Native projects:

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Testing Pure Functions

```typescript
// utils/dictionary.ts
export function normalizeKurdishText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC');
}

export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}
```

```typescript
// __tests__/utils/dictionary.test.ts
import { normalizeKurdishText, calculateLevenshteinDistance } from '../../utils/dictionary';

describe('normalizeKurdishText', () => {
  it('trims whitespace', () => {
    expect(normalizeKurdishText('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeKurdishText('hello   world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(normalizeKurdishText('')).toBe('');
  });
});

describe('calculateLevenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(calculateLevenshteinDistance('test', 'test')).toBe(0);
  });

  it('returns correct distance for single edit', () => {
    expect(calculateLevenshteinDistance('cat', 'bat')).toBe(1);
  });

  it('handles empty strings', () => {
    expect(calculateLevenshteinDistance('', 'abc')).toBe(3);
  });
});
```

### Testing Custom Hooks

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// __tests__/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    );

    rerender({ value: 'world' });
    expect(result.current).toBe('hello'); // Not updated yet

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('world'); // Updated after delay
  });

  it('cancels previous timeout on new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => jest.advanceTimersByTime(300));

    expect(result.current).toBe('c'); // 'b' was cancelled
  });
});
```

### Mocking

```typescript
// Mock native modules
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({ password: 'mock-token' }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [], success: true }),
});

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { wordId: '123' } }),
}));
```

---

## 4. Component Testing with RNTL

### Setup

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

```typescript
// jest-setup.ts
import '@testing-library/jest-native/extend-expect';
```

### Testing User Interaction

```typescript
// components/SearchBar.tsx
function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
    if (text.trim()) onSearch(text.trim());
  };

  return (
    <View>
      <TextInput
        placeholder="Search words..."
        value={text}
        onChangeText={setText}
        accessibilityLabel="Search input"
      />
      <Pressable onPress={handleSubmit} accessibilityRole="button">
        <Text>Search</Text>
      </Pressable>
    </View>
  );
}
```

```typescript
// __tests__/components/SearchBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import SearchBar from '../../components/SearchBar';

describe('SearchBar', () => {
  it('renders input and button', () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByLabelText('Search input')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('calls onSearch with trimmed text', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.changeText(screen.getByLabelText('Search input'), '  hello  ');
    fireEvent.press(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  it('does not call onSearch with empty text', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.press(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
  });
});
```

### Testing Async Components

```typescript
import { render, screen, waitFor } from '@testing-library/react-native';

describe('WordDetailScreen', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { id: '1', word: 'خەو', definition: 'Dream' },
          success: true,
        }),
    });
  });

  it('shows loading, then word data', async () => {
    render(<WordDetailScreen />);

    // Loading state
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();

    // Data loaded
    await waitFor(() => {
      expect(screen.getByText('خەو')).toBeTruthy();
      expect(screen.getByText('Dream')).toBeTruthy();
    });
  });

  it('shows error on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<WordDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeTruthy();
    });
  });
});
```

---

## 5. Integration Testing

### Testing with Mock Service Worker (MSW)

```bash
npm install --save-dev msw
```

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.jirlee.com/api/words/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    return HttpResponse.json({
      data: [
        { id: '1', word: 'خەو', definition: 'Dream' },
        { id: '2', word: 'خوێن', definition: 'Blood' },
      ].filter(w => w.word.includes(query ?? '')),
      success: true,
    });
  }),

  http.get('https://api.jirlee.com/api/words/:id', ({ params }) => {
    return HttpResponse.json({
      data: { id: params.id, word: 'خەو', definition: 'Dream', examples: [] },
      success: true,
    });
  }),
];
```

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// jest.setup.ts
import { server } from './test/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 6. End-to-End (E2E) Testing

### Detox (React Native Specific)

```bash
npm install --save-dev detox
```

**`detox.config.js`:**

```javascript
module.exports = {
  testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7_API_35' } },
  },
  configurations: {
    'ios.release': { device: 'simulator', app: 'ios.release' },
    'android.release': { device: 'emulator', app: 'android.release' },
  },
};
```

```typescript
// e2e/searchFlow.test.ts
describe('Search Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should search for a word and view details', async () => {
    // Navigate to search
    await element(by.id('search-tab')).tap();

    // Type search query
    await element(by.id('search-input')).typeText('خەو');

    // Wait for results
    await waitFor(element(by.id('search-result-0')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap first result
    await element(by.id('search-result-0')).tap();

    // Verify detail screen
    await expect(element(by.id('word-title'))).toHaveText('خەو');
    await expect(element(by.id('word-definition'))).toBeVisible();
  });

  it('should show empty state for no results', async () => {
    await element(by.id('search-tab')).tap();
    await element(by.id('search-input')).typeText('zzzzzzz');

    await waitFor(element(by.id('empty-state')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### Maestro (Alternative — No Code Changes)

Create `.maestro/searchFlow.yaml`:

```yaml
appId: com.jirlee.mobile
---
- launchApp
- tapOn: "Search"
- tapOn:
    id: "search-input"
- inputText: "خەو"
- waitForAnimationToEnd
- assertVisible: "خەو"
- tapOn: "خەو"
- assertVisible: "Dream"
```

```bash
# Run
maestro test .maestro/searchFlow.yaml
```

### Appium (Cross-Platform)

Best for when you need cross-platform E2E tests or need to test alongside non-RN apps.

---

## 7. Snapshot Testing

```typescript
import { render } from '@testing-library/react-native';
import WordCard from '../../components/WordCard';

it('matches snapshot', () => {
  const tree = render(
    <WordCard
      word={{ id: '1', word: 'خەو', definition: 'Dream' }}
      onPress={jest.fn()}
    />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});

// Update snapshots after intentional UI changes:
// npm test -- --updateSnapshot
```

**When to use snapshots:**
- Detect unintended UI changes
- Document component structure
- NOT a substitute for behavioral tests

---

## 8. Debugging Tools & Techniques

### Dev Menu

Access with:
- **iOS Simulator**: Cmd+D
- **Android Emulator**: Cmd+M (Mac) or Ctrl+M (Windows/Linux)
- **Physical device**: Shake device

**Dev Menu Options:**
- Reload (R, R)
- Open React Native DevTools
- Open Debugger
- Toggle Performance Monitor
- Toggle Element Inspector

### React Native DevTools

```bash
# Launch standalone
npx react-native start
# Then press 'j' to open DevTools in browser
```

**Panels:**

| Panel | Purpose |
|---|---|
| **Console** | JavaScript console, filtered by log level |
| **Sources** | JS source browsing, breakpoints, step debugging |
| **Network** | HTTP request inspection (requires Flipper or interceptor) |
| **Performance** | CPU profiling, flame charts |
| **Memory** | Heap snapshots, memory leak detection |

### Breakpoint Debugging

```typescript
// Method 1: debugger statement
function processWord(word: string) {
  debugger; // Execution pauses here when DevTools is connected
  return normalizeKurdishText(word);
}

// Method 2: Conditional breakpoints in DevTools
// Right-click line → Add Conditional Breakpoint → word.length > 10
```

### LogBox

React Native's in-app logging system:

```typescript
import { LogBox } from 'react-native';

// Ignore specific warnings (use sparingly)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

// Ignore all logs (never in production)
LogBox.ignoreAllLogs(); // ❌ Only for debugging

// Custom error handling
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (isFatal) {
    // Report to crash reporting service
    crashlytics().recordError(error);
  }
});
```

### Network Debugging

```typescript
// Interceptor for debugging (dev only)
if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    const [url, options] = args;
    console.log(`[FETCH] ${options?.method ?? 'GET'} ${url}`);
    const start = Date.now();
    const response = await originalFetch(...args);
    console.log(`[FETCH] ${response.status} (${Date.now() - start}ms)`);
    return response;
  };
}
```

### Performance Monitor

Enable via Dev Menu → "Perf Monitor". Shows:

| Metric | Healthy | Warning |
|---|---|---|
| JS FPS | 60 | < 30 = severe jank |
| UI FPS | 60 | < 45 = noticeable |
| RAM | < 200MB | > 300MB = investigate |

---

## 9. CI/CD Testing Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/ --ext .ts,.tsx

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm test -- --coverage --ci
      - uses: codecov/codecov-action@v4

  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx detox build --configuration ios.release
      - run: npx detox test --configuration ios.release --cleanup

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/setup-java@v4
        with: { java-version: 17, distribution: 'zulu' }
      - name: Start emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 35
          script: |
            npm ci
            npx detox build --configuration android.release
            npx detox test --configuration android.release --cleanup
```

### Coverage Targets

| Layer | Target |
|---|---|
| Utility functions | > 90% |
| Custom hooks | > 85% |
| Components | > 75% |
| Screens | > 50% |
| E2E critical paths | 100% of happy paths |
