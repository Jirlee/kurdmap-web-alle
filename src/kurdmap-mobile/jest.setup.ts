// ─── Mock expo-asset & expo-font (needed by @expo/vector-icons) ─
jest.mock('expo-asset', () => ({
  Asset: { fromModule: jest.fn(() => ({ downloadAsync: jest.fn() })) },
}));

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const MockIcon = (props: any) => require('react').createElement(View, { ...props, testID: props.name });
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
  };
});

// ─── Mock expo-secure-store ────────────────────────────────
const mockSecureStorage = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStorage.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStorage.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStorage.delete(key);
    return Promise.resolve();
  }),
}));

// ─── Mock @react-native-async-storage ──────────────────────
const mockAsyncStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockAsyncStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockAsyncStorage.delete(key);
      return Promise.resolve();
    }),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map((k) => [k, mockAsyncStorage.get(k) ?? null])),
    ),
  },
}));

// ─── Mock expo-router ──────────────────────────────────────
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

// ─── Mock expo-location ────────────────────────────────────
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 50.9375, longitude: 6.9603 },
    }),
  ),
  Accuracy: { Balanced: 3 },
}));

// ─── Mock react-native-maps ───────────────────────────────
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Callout: View,
    PROVIDER_GOOGLE: 'google',
  };
});

// ─── Mock @react-native-community/netinfo ─────────────────
const mockNetInfoListeners: Array<(state: { isConnected: boolean }) => void> = [];
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((cb: (state: { isConnected: boolean }) => void) => {
      mockNetInfoListeners.push(cb);
      return () => {
        const idx = mockNetInfoListeners.indexOf(cb);
        if (idx >= 0) mockNetInfoListeners.splice(idx, 1);
      };
    }),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
    __emit: (state: { isConnected: boolean }) =>
      mockNetInfoListeners.forEach((cb) => cb(state)),
  },
}));

// ─── Mock expo-haptics ─────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── Mock react-native-safe-area-context ───────────────────
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: jest.fn(() => insets),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ─── Mock expo-image ───────────────────────────────────────
jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image };
});

// ─── Mock expo-linear-gradient ─────────────────────────────
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// ─── Mock expo-constants ───────────────────────────────────
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:8080',
      },
    },
  },
}));

// ─── Mock expo-notifications ───────────────────────────────
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif-id')),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 1 },
}));

// ─── Mock expo-device ──────────────────────────────────────
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// ─── Mock @sentry/react-native ─────────────────────────────
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(),
}));

// ─── Mock expo-updates ─────────────────────────────────────
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  isEnabled: false,
}));

// ─── Mock expo-splash-screen ───────────────────────────────
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// ─── Silence console.warn for act() warnings ──────────────
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  originalWarn(...args);
};
