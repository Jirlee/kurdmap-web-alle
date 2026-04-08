import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from './auth.store';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const session = inject(SessionService);

  if (!authStore.isAuthenticated() || !authStore.hasAdminAccess()) {
    return router.createUrlTree(['/login']);
  }

  // Check session idle timeout
  const lastActivity = session.lastActivityTime();
  const idleMs = Date.now() - lastActivity;
  if (idleMs > 15 * 60 * 1000) {
    authStore.clear();
    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'session_expired' },
    });
  }

  return true;
};

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const hasRole = authStore.roles().some(r => allowedRoles.includes(r));
    return hasRole || router.createUrlTree(['/']);
  };
};

export const loginGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated() && authStore.hasAdminAccess()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
