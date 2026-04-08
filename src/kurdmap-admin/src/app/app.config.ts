import {
  ApplicationConfig,
  ErrorHandler,
  Injectable,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth';

@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (isDevMode()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[KurdMap Error]', message, error);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
