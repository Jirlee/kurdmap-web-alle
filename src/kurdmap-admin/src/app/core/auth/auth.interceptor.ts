import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService } from './auth.service';

const refreshState = {
  isRefreshing: false,
  refreshSubject$: new BehaviorSubject<string | null>(null),
};

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authStore.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (refreshState.isRefreshing) {
        return refreshState.refreshSubject$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap(newToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })),
          ),
        );
      }

      refreshState.isRefreshing = true;
      refreshState.refreshSubject$.next(null);

      const refreshToken = authStore.refreshToken();

      if (!refreshToken) {
        refreshState.isRefreshing = false;
        authStore.clear();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return authService.refreshToken(refreshToken).pipe(
        switchMap(response => {
          refreshState.isRefreshing = false;
          authStore.updateTokens(response.accessToken, response.refreshToken);
          refreshState.refreshSubject$.next(response.accessToken);
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` },
          }));
        }),
        catchError(refreshError => {
          refreshState.isRefreshing = false;
          authStore.clear();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
