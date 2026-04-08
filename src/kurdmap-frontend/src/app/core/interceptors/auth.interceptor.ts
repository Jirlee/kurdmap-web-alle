import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BrowserStorageService } from '../services/browser-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(BrowserStorageService);
  const token = storage.getItem('kurdmap-token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
