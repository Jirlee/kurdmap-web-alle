import { Injectable, signal, computed, NgZone, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent, merge, throttleTime, Subject } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for admin
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const LAST_ACTIVITY_KEY = 'kurdmap_last_activity';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionExpired$ = new Subject<void>();

  private checkIntervalId: ReturnType<typeof setInterval> | null = null;

  readonly lastActivityTime = signal(Date.now());
  readonly isSessionWarning = computed(() => {
    const elapsed = Date.now() - this.lastActivityTime();
    return elapsed > IDLE_TIMEOUT_MS - 2 * 60 * 1000; // Warn 2 min before
  });

  init(): void {
    this.updateActivity();

    // Track user activity
    this.zone.runOutsideAngular(() => {
      merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart'),
      ).pipe(
        throttleTime(10_000), // Update at most every 10 seconds
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.updateActivity();
      });
    });

    // Periodic idle check
    this.zone.runOutsideAngular(() => {
      this.checkIntervalId = setInterval(() => {
        this.checkIdleTimeout();
      }, CHECK_INTERVAL_MS);
    });

    this.destroyRef.onDestroy(() => {
      if (this.checkIntervalId) {
        clearInterval(this.checkIntervalId);
      }
    });
  }

  private updateActivity(): void {
    const now = Date.now();
    this.lastActivityTime.set(now);
    try {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch { /* Storage unavailable */ }
  }

  private checkIdleTimeout(): void {
    if (!this.authStore.isAuthenticated()) return;

    let lastActivity = this.lastActivityTime();

    // Also check storage (for cross-tab sync)
    try {
      const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      if (stored) {
        const storedTime = parseInt(stored, 10);
        if (storedTime > lastActivity) {
          lastActivity = storedTime;
          this.lastActivityTime.set(storedTime);
        }
      }
    } catch { /* Storage unavailable */ }

    const elapsed = Date.now() - lastActivity;
    if (elapsed >= IDLE_TIMEOUT_MS) {
      this.zone.run(() => {
        this.expireSession();
      });
    }
  }

  private expireSession(): void {
    this.authStore.clear();
    this.sessionExpired$.next();
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session_expired' },
    });
  }

  get onSessionExpired$() {
    return this.sessionExpired$.asObservable();
  }
}
