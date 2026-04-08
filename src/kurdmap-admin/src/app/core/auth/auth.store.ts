import { Injectable, signal, computed, effect } from '@angular/core';
import { AuthState, AuthResponse } from '../models';

const STORAGE_KEY = 'kurdmap_auth';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly state = signal<AuthState | null>(this.loadFromStorage());

  readonly isAuthenticated = computed(() => !!this.state()?.accessToken);
  readonly user = computed(() => this.state());
  readonly fullName = computed(() => this.state()?.fullName ?? '');
  readonly email = computed(() => this.state()?.email ?? '');
  readonly roles = computed(() => this.state()?.roles ?? []);
  readonly userId = computed(() => this.state()?.userId ?? null);
  readonly accessToken = computed(() => this.state()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.state()?.refreshToken ?? null);

  readonly isSuperAdmin = computed(() => this.roles().includes('SuperAdmin'));
  readonly isAdmin = computed(() => this.roles().includes('Admin') || this.isSuperAdmin());
  readonly hasAdminAccess = computed(() =>
    this.roles().some(r => r === 'Admin' || r === 'SuperAdmin' || r === 'Moderator'),
  );
  readonly twoFactorEnabled = computed(() => this.state()?.twoFactorEnabled ?? false);
  readonly mfaVerified = computed(() => this.state()?.mfaVerified ?? false);

  constructor() {
    effect(() => {
      const current = this.state();
      if (current) {
        this.saveToStorage(current);
      } else {
        this.removeFromStorage();
      }
    });
  }

  setAuth(response: AuthResponse): void {
    this.state.set({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      roles: response.roles,
      twoFactorEnabled: response.twoFactorEnabled ?? false,
      mfaVerified: !response.requiresTwoFactor,
    });
  }

  setMfaVerified(): void {
    const current = this.state();
    if (current) {
      this.state.set({ ...current, mfaVerified: true });
    }
  }

  updateTokens(accessToken: string, refreshToken: string): void {
    const current = this.state();
    if (current) {
      this.state.set({ ...current, accessToken, refreshToken });
    }
  }

  clear(): void {
    this.state.set(null);
  }

  private loadFromStorage(): AuthState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.accessToken && parsed?.userId) {
        return parsed as AuthState;
      }
      return null;
    } catch {
      return null;
    }
  }

  private saveToStorage(state: AuthState): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* Storage unavailable */ }
  }

  private removeFromStorage(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* Storage unavailable */ }
  }
}
