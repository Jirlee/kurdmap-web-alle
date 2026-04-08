import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry crash reporting.
 * Only initializes when a valid DSN is configured via EXPO_PUBLIC_SENTRY_DSN.
 */
export function initSentry(): void {
  if (!DSN) {
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version ?? '1.0.0',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__,
  });
}

export { Sentry };
