import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';

      switch (error.status) {
        case 0:
          message = 'Unable to connect to server';
          break;
        case 401:
          message = 'Unauthorized';
          break;
        case 403:
          message = 'Access denied';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 422:
          message = error.error?.title || 'Validation error';
          break;
        case 500:
          message = 'Server error';
          break;
      }

      if (!environment.production) {
        console.error(`[HTTP ${error.status}] ${req.url}: ${message}`);
      }
      return throwError(() => ({ status: error.status, message, errors: error.error?.errors }));
    })
  );
};
