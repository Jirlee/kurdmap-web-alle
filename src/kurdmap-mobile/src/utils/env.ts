import Constants from 'expo-constants';

/**
 * Validates required environment variables at startup.
 * Call this early in _layout.tsx to fail fast.
 */
export function validateEnv(): { apiUrl: string } {
  const apiUrl =
    Constants.expoConfig?.extra?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.trim().length === 0) {
    throw new Error(
      '[KurdMap] Missing required environment variable: API_URL. ' +
      'Set EXPO_PUBLIC_API_URL in .env or extra.apiUrl in app.json.',
    );
  }

  return { apiUrl };
}

/**
 * Returns true if the API URL uses HTTPS (required for production).
 */
export function isSecureUrl(url: string): boolean {
  return url.startsWith('https://');
}
