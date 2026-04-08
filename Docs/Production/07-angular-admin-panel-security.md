# Angular 21 & Admin Panel Security

> **Ziel:** Government-Grade Frontend-Sicherheit für SPA und Admin Panel  
> **Framework:** Angular 21 (Standalone, Signals)  
> **Schwerpunkt:** XSS-Prävention, CSP, Secure Token Handling, Route Security

---

## Inhaltsverzeichnis

- [1. Angular Security Architecture](#1-angular-security-architecture)
- [2. XSS Prevention](#2-xss-prevention)
- [3. Content Security Policy (CSP)](#3-content-security-policy-csp)
- [4. Authentication & Token Management](#4-authentication--token-management)
- [5. Route Guards & Authorization](#5-route-guards--authorization)
- [6. HTTP Interceptors](#6-http-interceptors)
- [7. Form Security](#7-form-security)
- [8. Admin Panel Hardening](#8-admin-panel-hardening)
- [9. Build & Deployment Security](#9-build--deployment-security)
- [10. Third-Party Library Security](#10-third-party-library-security)

---

## 1. Angular Security Architecture

### 1.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Angular Security Layers                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Build Security                                 │
│  ├── Production Build (AOT, Tree-shaking)                │
│  ├── No Source Maps                                      │
│  ├── Dependency Audit (npm audit)                        │
│  └── Subresource Integrity (SRI)                         │
│                                                          │
│  Layer 2: Content Security Policy                        │
│  ├── Strict CSP Headers (via Caddy)                      │
│  ├── No inline scripts "unsafe-inline"                   │
│  ├── No eval "unsafe-eval"                               │
│  └── Trusted Types (Chrome)                              │
│                                                          │
│  Layer 3: XSS Prevention                                 │
│  ├── Angular Auto-Escaping (Templates)                   │
│  ├── DomSanitizer                                        │
│  ├── No innerHTML with user input                        │
│  └── No bypassSecurityTrust*                             │
│                                                          │
│  Layer 4: Authentication                                 │
│  ├── HttpOnly Secure Cookies (Tokens)                    │
│  ├── CSRF Protection                                     │
│  ├── Token Refresh (Rotation)                            │
│  └── Session Timeout                                     │
│                                                          │
│  Layer 5: Authorization                                  │
│  ├── Route Guards (canActivate)                          │
│  ├── Component-Level Guards                              │
│  ├── Server-Side Authorization (IMMER!)                  │
│  └── Role-Based UI Rendering                             │
│                                                          │
│  Layer 6: Network Security                               │
│  ├── HTTP Interceptors                                   │
│  ├── Error Handling (no info leak)                        │
│  ├── Certificate Pinning (optional)                      │
│  └── Request/Response Validation                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. XSS Prevention

### 2.1 Angular Auto-Escaping

```typescript
// ✅ SICHER — Angular Template Auto-Escaping
@Component({
  template: `
    <!-- Angular escaped automatisch -->
    <p>{{ userInput }}</p>
    
    <!-- Property Binding escaped automatisch -->
    <div [textContent]="userInput"></div>
    
    <!-- Auch in Attributen sicher -->
    <img [alt]="userInput" [src]="sanitizedUrl">
  `
})
export class SafeComponent {
  userInput = signal('<script>alert("XSS")</script>');
  // Wird als Text gerendert, NICHT als HTML
}
```

### 2.2 Verbotene Muster

```typescript
// ❌ NIEMALS — innerHTML mit User-Input
// element.innerHTML = userInput;

// ❌ NIEMALS — bypassSecurityTrust* mit User-Input
// this.sanitizer.bypassSecurityTrustHtml(userInput);

// ❌ NIEMALS — eval oder Function Constructor
// eval(userProvidedCode);
// new Function(userProvidedCode);

// ❌ NIEMALS — document.write
// document.write(userContent);

// ❌ NIEMALS — jQuery-ähnliches .html()
// $(element).html(userInput);

// ❌ NIEMALS — Template Literals in URLs mit User-Input ohne Sanitizing
// window.location.href = `https://example.com/redirect?url=${userInput}`;
```

### 2.3 Sicheres HTML-Rendering (wenn nötig)

```typescript
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  template: `<div [innerHTML]="safeHtml()"></div>`
})
export class RichTextComponent {
  private sanitizer = inject(DomSanitizer);
  
  rawHtml = input.required<string>();
  
  safeHtml = computed<SafeHtml>(() => {
    // DOMPurify für zusätzliche Sicherheit
    const cleaned = DOMPurify.sanitize(this.rawHtml(), {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    });
    
    // Angular Sanitizer als zweite Schicht
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  });
}
```

---

## 3. Content Security Policy (CSP)

### 3.1 Angular-kompatible CSP

```typescript
// angular.json — CSP Nonce Support
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            // Subresource Integrity
            "subresourceIntegrity": true,
            // Cross-Origin Attribute
            "crossOrigin": "anonymous"
          }
        }
      }
    }
  }
}
```

### 3.2 CSP Meta-Tag (Backup)

```html
<!-- index.html — Fallback CSP -->
<meta http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.example.com wss://api.example.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  ">
```

---

## 4. Authentication & Token Management

### 4.1 Sichere Token-Strategie

```yaml
Token-Strategie für Banking/Government:
  Access Token:
    Storage: HttpOnly Secure Cookie (NICHT LocalStorage!)
    Lifetime: 15 Minuten
    Type: JWT (asymmetrisch signiert, RS512)
    
  Refresh Token:
    Storage: HttpOnly Secure Cookie (separater Cookie)
    Lifetime: 7 Tage (mit Rotation)
    Type: Opaque Token (in DB gespeichert)
    Rotation: Jedes Refresh erzeugt neuen Token
    
  CSRF Token:
    Storage: Readable Cookie + Header
    Validation: Double Submit Cookie Pattern
    
  VERBOTEN:
    - Tokens in LocalStorage (XSS-anfällig)
    - Tokens in SessionStorage (XSS-anfällig)
    - Tokens in URL-Parametern (Server Logs, Referrer)
    - Symmetrisch signierte JWTs (Secret-Sharing Problem)
```

### 4.2 Auth Service Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Reactive Auth State
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal(false);
  private tokenExpiresAt = signal<Date | null>(null);
  
  readonly user = this.currentUser.asReadonly();
  readonly authenticated = this.isAuthenticated.asReadonly();
  
  // Token Refresh Timer
  private refreshTimerDestroy?: () => void;
  
  login(credentials: LoginDto): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials, {
      withCredentials: true // Cookies mitsenden
    }).pipe(
      tap(response => {
        // Token ist im HttpOnly Cookie — nicht im JS-Code!
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.tokenExpiresAt.set(new Date(response.expiresAt));
        this.scheduleTokenRefresh(response.expiresAt);
      }),
      map(() => void 0),
      catchError(error => {
        // Keine Details zum Fehler exponieren
        if (error.status === 401) {
          return throwError(() => new Error('Invalid credentials'));
        }
        if (error.status === 429) {
          return throwError(() => new Error('Too many attempts. Please try later.'));
        }
        return throwError(() => new Error('Login failed'));
      })
    );
  }
  
  logout(): void {
    this.http.post('/api/auth/logout', null, { withCredentials: true })
      .subscribe({
        complete: () => {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          this.tokenExpiresAt.set(null);
          this.router.navigate(['/login']);
        }
      });
  }
  
  refreshToken(): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/refresh', null, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.tokenExpiresAt.set(new Date(response.expiresAt));
        this.scheduleTokenRefresh(response.expiresAt);
      }),
      map(() => void 0),
      catchError(() => {
        // Refresh fehlgeschlagen → Logout
        this.logout();
        return EMPTY;
      })
    );
  }
  
  private scheduleTokenRefresh(expiresAt: string): void {
    const expiresInMs = new Date(expiresAt).getTime() - Date.now();
    // 1 Minute vor Ablauf refreshen
    const refreshInMs = Math.max(expiresInMs - 60_000, 0);
    
    const timeoutId = setTimeout(() => {
      this.refreshToken().subscribe();
    }, refreshInMs);
    
    this.refreshTimerDestroy = () => clearTimeout(timeoutId);
  }
  
  // Session Activity Check
  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }
}
```

### 4.3 Session Timeout

```typescript
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private auth = inject(AuthService);
  
  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 Minuten
  private readonly WARNING_MS = 2 * 60 * 1000;  // 2 Minuten vor Timeout warnen
  private timeoutId?: ReturnType<typeof setTimeout>;
  private warningId?: ReturnType<typeof setTimeout>;
  
  constructor() {
    // Activity Events überwachen
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), { passive: true });
    });
  }
  
  start(): void {
    this.resetTimer();
  }
  
  private resetTimer(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
    
    // Warnung vor Timeout
    this.warningId = setTimeout(() => {
      // Dialog anzeigen: "Session läuft ab, verlängern?"
      this.showTimeoutWarning();
    }, this.TIMEOUT_MS - this.WARNING_MS);
    
    // Automatischer Logout
    this.timeoutId = setTimeout(() => {
      this.auth.logout();
    }, this.TIMEOUT_MS);
  }
  
  private showTimeoutWarning(): void {
    // MatDialog oder Toast: "Session expires in 2 minutes"
  }
}
```

---

## 5. Route Guards & Authorization

### 5.1 Authentication Guard

```typescript
// Functional Guard (Angular 21+)
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.authenticated()) {
    return true;
  }
  
  // Redirect zu Login mit Return-URL
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

// Role Guard
export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    if (!auth.authenticated()) {
      router.navigate(['/login']);
      return false;
    }
    
    const hasRole = requiredRoles.some(role => auth.hasRole(role));
    if (!hasRole) {
      router.navigate(['/forbidden']);
      return false;
    }
    
    return true;
  };
};

// MFA Guard
export const mfaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.user()?.mfaVerified) {
    return true;
  }
  
  router.navigate(['/mfa-verify']);
  return false;
};
```

### 5.2 Route Configuration

```typescript
export const routes: Routes = [
  // Öffentlich
  { path: 'login', component: LoginComponent },
  
  // Authentifiziert
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  
  // Admin-Bereich (Role + MFA)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['Admin']), mfaGuard],
    children: [
      { path: 'users', component: UserManagementComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'audit-log', component: AuditLogComponent },
    ]
  },
  
  // Banking (spezielle Sicherheit)
  {
    path: 'banking',
    canActivate: [authGuard, roleGuard(['BankingOperator']), mfaGuard],
    children: [
      { path: 'transfer', component: TransferComponent },
      { path: 'accounts', component: AccountsComponent },
    ]
  },
  
  // 404
  { path: '**', component: NotFoundComponent }
];
```

---

## 6. HTTP Interceptors

### 6.1 Security Interceptor Chain

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        correlationIdInterceptor,
        csrfInterceptor,
        errorHandlingInterceptor,
        authRefreshInterceptor,
      ]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
};

// Correlation ID Interceptor
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const requestId = crypto.randomUUID();
  const clonedReq = req.clone({
    headers: req.headers.set('X-Request-ID', requestId)
  });
  return next(clonedReq);
};

// CSRF Interceptor
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // CSRF Token aus Cookie lesen
  const csrfToken = getCookie('XSRF-TOKEN');
  
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const clonedReq = req.clone({
      headers: req.headers.set('X-XSRF-TOKEN', csrfToken)
    });
    return next(clonedReq);
  }
  
  return next(req);
};

// Error Handling Interceptor
export const errorHandlingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // KEINE sensitiven Informationen in der UI anzeigen
      switch (error.status) {
        case 401:
          // Token abgelaufen → Refresh oder Logout
          inject(AuthService).logout();
          break;
        case 403:
          inject(Router).navigate(['/forbidden']);
          break;
        case 429:
          // Rate Limit → Benutzer informieren
          inject(NotificationService).error('Too many requests. Please wait.');
          break;
        default:
          inject(NotificationService).error('An error occurred. Please try again.');
      }
      
      // Fehler NICHT mit Details weiterleiten
      return throwError(() => new Error('Request failed'));
    })
  );
};

// Auto Token Refresh Interceptor
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return auth.refreshToken().pipe(
          switchMap(() => next(req)) // Retry original request
        );
      }
      return throwError(() => error);
    })
  );
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
```

---

## 7. Form Security

### 7.1 Sichere Formulare

```typescript
@Component({
  template: `
    <form [formGroup]="transferForm" (ngSubmit)="onSubmit()">
      <input formControlName="amount" type="number" 
             [attr.autocomplete]="'off'"
             [attr.inputmode]="'numeric'">
      
      <input formControlName="iban" type="text"
             [attr.autocomplete]="'off'"
             [attr.spellcheck]="'false'">
      
      @if (transferForm.get('amount')?.errors?.['max']) {
        <span class="error">Amount exceeds maximum</span>
      }
      
      <button type="submit" [disabled]="transferForm.invalid || isSubmitting()">
        Transfer
      </button>
    </form>
  `
})
export class TransferComponent {
  private fb = inject(FormBuilder);
  isSubmitting = signal(false);
  
  transferForm = this.fb.group({
    amount: [0, [
      Validators.required, 
      Validators.min(0.01),
      Validators.max(1_000_000),
      Validators.pattern(/^\d+(\.\d{1,2})?$/) // Max 2 Dezimalstellen
    ]],
    iban: ['', [
      Validators.required,
      Validators.pattern(/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/),
      this.ibanValidator
    ]],
    description: ['', [
      Validators.maxLength(140),
      this.noScriptValidator // XSS Prevention
    ]]
  });
  
  // Custom Validator: Keine Script-Tags
  noScriptValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (/<script|javascript:|on\w+=/i.test(value)) {
      return { scriptInjection: true };
    }
    return null;
  }
  
  // IBAN Checksum Validator
  ibanValidator(control: AbstractControl): ValidationErrors | null {
    // IBAN Prüfsumme validieren...
    return null;
  }
  
  async onSubmit(): Promise<void> {
    if (this.transferForm.invalid || this.isSubmitting()) return;
    
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(
        this.http.post('/api/banking/transfer', this.transferForm.value, {
          withCredentials: true
        })
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

---

## 8. Admin Panel Hardening

### 8.1 Admin-spezifische Sicherheit

```typescript
// Admin Environment Config
export const adminEnvironment = {
  // Session Timeout: Kürzer für Admin
  sessionTimeout: 10 * 60 * 1000, // 10 Minuten
  
  // MFA immer erforderlich
  requireMfa: true,
  
  // IP-Whitelist (wird auch Server-seitig geprüft)
  allowedIpRanges: ['10.0.0.0/24'],
  
  // Keine Passwort-Speicherung
  disablePasswordAutocomplete: true,
  
  // Clipboard-Schutz für sensitive Daten
  disableClipboard: true,
  
  // Screenshot-Prevention (CSS)
  preventScreenCapture: true,
};

// Admin Activity Logger
@Injectable({ providedIn: 'root' })
export class AdminActivityLogger {
  private http = inject(HttpClient);
  
  logAction(action: string, details: Record<string, unknown>): void {
    this.http.post('/api/admin/audit-log', {
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`
    }, { withCredentials: true }).subscribe();
  }
}
```

### 8.2 Anti-Screenshot CSS

```css
/* Sensitive Daten vor Screenshots schützen */
.sensitive-data {
  /* Zeigt Sternchen wenn nicht fokussiert */
  color: transparent;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.sensitive-data:focus,
.sensitive-data:hover {
  color: inherit;
  text-shadow: none;
}

/* Print-Schutz */
@media print {
  .sensitive-data,
  .admin-content {
    display: none !important;
  }
  body::after {
    content: "PRINTING OF SENSITIVE DATA IS NOT ALLOWED";
    display: block;
    font-size: 2rem;
    padding: 2rem;
  }
}
```

---

## 9. Build & Deployment Security

### 9.1 angular.json Production Build

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kB",
                  "maximumError": "4kB"
                }
              ],
              "subresourceIntegrity": true,
              "crossOrigin": "anonymous"
            }
          }
        }
      }
    }
  }
}
```

### 9.2 Pre-Build Security Checks

```bash
#!/bin/bash
# pre-build-security-check.sh

echo "=== Angular Security Pre-Build Check ==="

# 1. Dependency Audit
echo "Checking dependencies..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
    echo "FAIL: High/Critical vulnerabilities found!"
    exit 1
fi

# 2. Keine console.log in Production Code
echo "Checking for console statements..."
CONSOLE_COUNT=$(grep -r "console\.\(log\|debug\|info\|warn\)" src/ --include="*.ts" | grep -v "spec.ts" | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo "WARNING: $CONSOLE_COUNT console statements found"
    grep -r "console\.\(log\|debug\|info\|warn\)" src/ --include="*.ts" | grep -v "spec.ts"
fi

# 3. Keine hardcoded Secrets
echo "Checking for hardcoded secrets..."
grep -rn "password\|secret\|api_key\|apikey\|token" src/ --include="*.ts" | grep -v "spec.ts" | grep -v "\.d\.ts" | grep -v "environment"

# 4. Keine unsafe Security Bypasses
echo "Checking for security bypasses..."
grep -rn "bypassSecurityTrust\|innerHTML\s*=" src/ --include="*.ts" | grep -v "spec.ts"

# 5. Source Maps deaktiviert
echo "Checking source maps..."
grep -q '"sourceMap": false' angular.json
if [ $? -ne 0 ]; then
    echo "FAIL: Source maps are enabled in production!"
    exit 1
fi

echo "=== Security checks passed ==="
```

---

## 10. Third-Party Library Security

### 10.1 Dependency Management

```json
// package.json — Locked Dependencies
{
  "scripts": {
    "preinstall": "npx npm-force-resolutions",
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix",
    "check-updates": "npx npm-check-updates"
  },
  "overrides": {
    // Erzwungene Versionen für bekannte Schwachstellen
  }
}
```

```bash
# Regelmäßige Dependency-Checks
npm audit --audit-level=high
npx better-npm-audit audit

# Lockfile-Integrität prüfen
npm ci  # Installiert exakt die Versionen aus package-lock.json
```

### 10.2 Erlaubte/Blockierte Libraries

```yaml
Erlaubt:
  - "@angular/*": "Framework"
  - "rxjs": "Reactive Programming"
  - "DOMPurify": "HTML Sanitization"
  
Blockiert:
  - "jquery": "DOM Manipulation → XSS Risiko"
  - "lodash": "Prototype Pollution Risiko (einzelne Funktionen stattdessen)"
  - "moment.js": "Deprecated, zu groß (date-fns oder Temporal API nutzen)"
  - "eval*": "Alles mit eval"
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [06 — ASP.NET Core API](06-aspnet-core-api-security.md) | Backend-Sicherheit |
| [08 — Authentication](08-authentication-identity.md) | Auth-Strategie |
| [05 — Caddy Reverse Proxy](05-reverse-proxy-tls-caddy.md) | CSP Header-Konfiguration |
