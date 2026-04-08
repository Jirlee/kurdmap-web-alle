import { act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/api/auth';

jest.mock('@/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockAuthResponse = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  userId: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['User'],
};

describe('auth-store', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
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
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('sets user state on success', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login({ email: 'test@example.com', password: 'Pass123!' });
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.userId).toBe('user-123');
      expect(state.email).toBe('test@example.com');
      expect(state.fullName).toBe('Test User');
      expect(state.accessToken).toBe('test-access-token');
      expect(state.isLoading).toBe(false);
    });

    it('persists tokens to SecureStore', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login({ email: 'test@example.com', password: 'Pass123!' });
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'test-access-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userId', 'user-123');
    });

    it('sets error on failure', async () => {
      (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        act(async () => {
          await useAuthStore.getState().login({ email: 'bad@example.com', password: 'wrong' });
        }),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('sets user state on success', async () => {
      (authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().register({
          email: 'new@example.com',
          password: 'Pass123!',
          fullName: 'New User',
        });
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.fullName).toBe('Test User');
    });
  });

  describe('logout', () => {
    it('clears state and SecureStore', async () => {
      useAuthStore.setState({
        accessToken: 'token',
        userId: 'user-123',
        isAuthenticated: true,
      });

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userId).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    });

    it('still clears state if API call fails', async () => {
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Network error'));
      useAuthStore.setState({ isAuthenticated: true, accessToken: 'token' });

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('restoreSession', () => {
    it('restores from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        const data: Record<string, string> = {
          accessToken: 'stored-token',
          refreshToken: 'stored-refresh',
          userId: 'stored-user',
          email: 'stored@example.com',
          fullName: 'Stored User',
          roles: '["User"]',
        };
        return Promise.resolve(data[key] ?? null);
      });

      await act(async () => {
        await useAuthStore.getState().restoreSession();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('stored-token');
      expect(state.roles).toEqual(['User']);
      expect(state.isLoading).toBe(false);
    });

    it('stays unauthenticated when no stored tokens', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await useAuthStore.getState().restoreSession();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
