import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models';
import { environment } from '../../../environments/environment';

export interface TotpSetupResponse {
  sharedKey: string;
  qrCodeUri: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, { email, password });
  }

  verifyTotp(userId: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/verify-totp`, { userId, code });
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/refresh`, { refreshToken });
  }

  setupTotp(): Observable<TotpSetupResponse> {
    return this.http.post<TotpSetupResponse>(`${this.apiUrl}/api/auth/totp/setup`, {});
  }

  enableTotp(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/auth/totp/enable`, { code });
  }

  disableTotp(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/auth/totp/disable`, { code });
  }
}
