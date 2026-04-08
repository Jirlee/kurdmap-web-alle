import { Injectable, signal, computed } from '@angular/core';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'kurdmap_login_security';

interface LoginSecurityState {
  failedAttempts: number;
  lockoutUntil: number | null;
  lastFailedAt: number | null;
}

@Injectable({ providedIn: 'root' })
export class LoginSecurityService {
  private readonly state = signal<LoginSecurityState>(this.loadState());

  readonly failedAttempts = computed(() => this.state().failedAttempts);
  readonly isLockedOut = computed(() => {
    const lockout = this.state().lockoutUntil;
    return lockout !== null && Date.now() < lockout;
  });
  readonly lockoutRemainingMs = computed(() => {
    const lockout = this.state().lockoutUntil;
    if (!lockout) return 0;
    return Math.max(0, lockout - Date.now());
  });
  readonly remainingAttempts = computed(() => Math.max(0, MAX_ATTEMPTS - this.state().failedAttempts));

  recordFailedAttempt(): void {
    const current = this.state();
    const newAttempts = current.failedAttempts + 1;
    const newState: LoginSecurityState = {
      failedAttempts: newAttempts,
      lastFailedAt: Date.now(),
      lockoutUntil: newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : current.lockoutUntil,
    };
    this.state.set(newState);
    this.saveState(newState);
  }

  recordSuccessfulLogin(): void {
    const clear: LoginSecurityState = { failedAttempts: 0, lockoutUntil: null, lastFailedAt: null };
    this.state.set(clear);
    this.saveState(clear);
  }

  canAttemptLogin(): boolean {
    const lockout = this.state().lockoutUntil;
    if (lockout && Date.now() < lockout) return false;

    // Auto-reset if lockout expired
    if (lockout && Date.now() >= lockout) {
      const reset: LoginSecurityState = { failedAttempts: 0, lockoutUntil: null, lastFailedAt: null };
      this.state.set(reset);
      this.saveState(reset);
    }

    return true;
  }

  private loadState(): LoginSecurityState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return { failedAttempts: 0, lockoutUntil: null, lastFailedAt: null };
      const parsed = JSON.parse(raw);

      // Auto-reset if lockout expired
      if (parsed.lockoutUntil && Date.now() >= parsed.lockoutUntil) {
        return { failedAttempts: 0, lockoutUntil: null, lastFailedAt: null };
      }

      return parsed as LoginSecurityState;
    } catch {
      return { failedAttempts: 0, lockoutUntil: null, lastFailedAt: null };
    }
  }

  private saveState(state: LoginSecurityState): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* Storage unavailable */ }
  }
}
