import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveApiUrl(): string {
  const configured =
    Constants.expoConfig?.extra?.apiUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://localhost:8080';

  // Android emulator can't reach host's localhost — use 10.0.2.2
  if (Platform.OS === 'android' && configured.includes('localhost')) {
    return configured.replace('localhost', '10.0.2.2');
  }
  return configured;
}

const API_BASE_URL = resolveApiUrl();

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export const authClient = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

/** Decode JWT payload and check if token expires within `bufferSec` seconds. */
function isTokenExpired(token: string, bufferSec = 30): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp as number | undefined;
    if (!exp) return true;
    return Date.now() >= (exp - bufferSec) * 1000;
  } catch {
    return true;
  }
}

/** Proactively refresh the token if it's about to expire. Returns the valid access token. */
async function ensureValidToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!token) return null;

  if (!isTokenExpired(token)) return token;

  // Token expired or about to expire — proactively refresh
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const userId = await SecureStore.getItemAsync('userId');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!userId || !refreshToken) return null;

    const { data } = await authClient.post('/refresh', { userId, refreshToken });
    const newToken = data.accessToken as string;

    await SecureStore.setItemAsync('accessToken', newToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);

    processQueue(null, newToken);
    return newToken;
  } catch (err) {
    processQueue(err, null);
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userId');
    return null;
  } finally {
    isRefreshing = false;
  }
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await ensureValidToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const userId = await SecureStore.getItemAsync('userId');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!userId || !refreshToken) throw new Error('No credentials for refresh');

      const { data } = await authClient.post('/refresh', { userId, refreshToken });
      const newToken = data.accessToken as string;

      await SecureStore.setItemAsync('accessToken', newToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);

      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
