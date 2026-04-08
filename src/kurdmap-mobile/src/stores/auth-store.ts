import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/api/auth';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  fullName: null,
  roles: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(data);
      await persistTokens(res);
      set({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        roles: res.roles,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      await persistTokens(res);
      set({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        roles: res.roles,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
    await clearTokens();
    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      fullName: null,
      roles: [],
      isAuthenticated: false,
      error: null,
    });
  },

  deleteAccount: async (password: string) => {
    const currentEmail = _get().email;
    if (!currentEmail) throw new Error('No email found');

    set({ isLoading: true, error: null });
    try {
      await authApi.deleteAccount({ email: currentEmail, password });
      await clearTokens();
      set({
        accessToken: null,
        refreshToken: null,
        userId: null,
        email: null,
        fullName: null,
        roles: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Account deletion failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userId = await SecureStore.getItemAsync('userId');
      const email = await SecureStore.getItemAsync('email');
      const fullName = await SecureStore.getItemAsync('fullName');
      const rolesJson = await SecureStore.getItemAsync('roles');

      if (accessToken && userId) {
        set({
          accessToken,
          refreshToken,
          userId,
          email,
          fullName,
          roles: rolesJson ? JSON.parse(rolesJson) : [],
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

async function persistTokens(res: AuthResponse) {
  await SecureStore.setItemAsync('accessToken', res.accessToken);
  await SecureStore.setItemAsync('refreshToken', res.refreshToken);
  await SecureStore.setItemAsync('userId', res.userId);
  await SecureStore.setItemAsync('email', res.email);
  await SecureStore.setItemAsync('fullName', res.fullName);
  await SecureStore.setItemAsync('roles', JSON.stringify(res.roles));
}

async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('userId');
  await SecureStore.deleteItemAsync('email');
  await SecureStore.deleteItemAsync('fullName');
  await SecureStore.deleteItemAsync('roles');
}
