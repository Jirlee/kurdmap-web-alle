import React, { useCallback, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { validateEnv } from '@/utils/env';
import { initSentry } from '@/utils/sentry';
import { useNotifications } from '@/hooks/useNotifications';
import '@/i18n';

// Keep splash screen visible until we explicitly hide it
SplashScreen.preventAutoHideAsync();

// Validate environment on module load — crash early if config is missing
validateEnv();

// Initialize Sentry crash reporting (no-op if DSN not configured)
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutInner() {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const preferencesRestored = useAppStore((s) => s.preferencesRestored);

  // Register push notifications & listen for notification taps
  useNotifications();

  useEffect(() => {
    if (!preferencesRestored) return;
    const inOnboarding = (segments[0] as string) === 'onboarding';
    if (!hasSeenOnboarding && !inOnboarding) {
      router.replace('/onboarding' as any);
    }
  }, [preferencesRestored, hasSeenOnboarding, segments, router]);

  return (
    <>
      <StatusBar style={theme.colors.statusBar} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="business/[slug]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="contact" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="policy" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const restorePreferences = useAppStore((s) => s.restorePreferences);
  const preferencesRestored = useAppStore((s) => s.preferencesRestored);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      await restoreSession();
      await restorePreferences();
      setAppReady(true);
    }
    prepare();
  }, [restoreSession, restorePreferences]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Hide splash screen with a smooth fade once the app is ready
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootLayoutInner />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
