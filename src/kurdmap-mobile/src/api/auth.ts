import { authClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';

export const authApi = {
  login(data: LoginRequest): Promise<AuthResponse> {
    return authClient.post<AuthResponse>('/login', data).then((r) => r.data);
  },

  register(data: RegisterRequest): Promise<AuthResponse> {
    return authClient.post<AuthResponse>('/register', data).then((r) => r.data);
  },

  refresh(userId: string, refreshToken: string): Promise<AuthResponse> {
    return authClient.post<AuthResponse>('/refresh', { userId, refreshToken }).then((r) => r.data);
  },

  logout(): Promise<void> {
    return authClient.post('/logout');
  },

  forgotPassword(email: string): Promise<void> {
    return authClient.post('/forgot-password', { email });
  },

  resetPassword(data: { email: string; token: string; newPassword: string }): Promise<void> {
    return authClient.post('/reset-password', data);
  },

  deleteAccount(data: { email: string; password: string }): Promise<void> {
    return authClient.delete('/delete-account', { data });
  },
};
