import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveApiUrl(): string {
  const configured =
    Constants.expoConfig?.extra?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://localhost:8080';

  // Android emulator can't reach the host's localhost — use 10.0.2.2
  if (Platform.OS === 'android' && configured.includes('localhost')) {
    return configured.replace('localhost', '10.0.2.2');
  }
  return configured;
}

const API_BASE_URL = resolveApiUrl();

/**
 * Public, read-only API client for the KurdMap mobile app.
 * The app has no user accounts: every endpoint consumed here is public
 * (businesses, categories, cities, reviews, advertisements). No tokens,
 * cookies, or credentials are ever sent.
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Pass through responses; reject errors unchanged for the UI layer to handle. */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error),
);
