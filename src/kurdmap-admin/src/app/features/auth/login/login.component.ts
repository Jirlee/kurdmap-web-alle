import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthStore } from '../../../core/auth';
import { NotificationService } from '../../../core/services';
import { LoginSecurityService } from '../../../core/services/login-security.service';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'admin-login',
  imports: [FormsModule, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-md">
      <!-- Glass Card -->
      <div class="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl
                  dark:border-white/10 dark:bg-surface/90">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
            <span class="material-icons text-3xl text-white" aria-hidden="true">admin_panel_settings</span>
          </div>
          <h1 class="text-2xl font-bold text-text">KurdMap</h1>
          <p class="mt-1 text-sm text-text-secondary">پانێڵی بەڕێوەبردن</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="handleLogin()" #loginForm="ngForm">
          <div class="space-y-5">
            @if (sessionExpiredMsg()) {
              <div class="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
                   role="status">
                <span class="material-icons text-lg" aria-hidden="true">timer_off</span>
                دانیشتنەکەت بەسەرچووە. تکایە دووبارە بچۆرەوە / Sitzung abgelaufen
              </div>
            }

            @if (loginSecurity.isLockedOut()) {
              <div class="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
                   role="alert">
                <span class="material-icons text-lg" aria-hidden="true">lock</span>
                هەژمارەکەت قفڵکراوە. دوای ١٥ خولەک دووبارە هەوڵ بدەوە / Konto gesperrt für 15 Minuten
              </div>
            }

            <admin-input
              label="ئیمەیڵ / E-Mail"
              type="email"
              icon="email"
              placeholder="admin&#64;kurdmap.de"
              [required]="true"
              [(ngModel)]="email"
              name="email"
              [error]="emailError()"
            />

            <admin-input
              label="وشەی نهێنی / Passwort"
              type="password"
              icon="lock"
              placeholder="••••••••"
              [required]="true"
              [(ngModel)]="password"
              name="password"
              [error]="passwordError()"
            />

            @if (errorMessage()) {
              <div class="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
                   role="alert">
                <span class="material-icons text-lg" aria-hidden="true">error_outline</span>
                <div>
                  <div>{{ errorMessage() }}</div>
                  @if (loginSecurity.remainingAttempts() > 0 && loginSecurity.remainingAttempts() < 4) {
                    <div class="mt-1 text-xs opacity-75">
                      {{ loginSecurity.remainingAttempts() }} هەوڵی ماوە / {{ loginSecurity.remainingAttempts() }} Versuche übrig
                    </div>
                  }
                </div>
              </div>
            }

            <admin-button
              type="submit"
              [fullWidth]="true"
              [loading]="loading()"
              [disabled]="loading() || loginSecurity.isLockedOut()"
              size="lg"
            >
              @if (!loading()) {
                چوونەژوورەوە / Anmelden
              } @else {
                چوونەژوورەوە...
              }
            </admin-button>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <p class="mt-6 text-center text-xs text-white/50">
        &copy; {{ currentYear }} KurdMap — هەموو مافەکان پارێزراون
      </p>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loginSecurity = inject(LoginSecurityService);

  protected email = '';
  protected password = '';

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');
  protected readonly sessionExpiredMsg = signal(false);

  protected readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionExpiredMsg.set(true);
    }
  }

  protected handleLogin(): void {
    this.errorMessage.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.sessionExpiredMsg.set(false);

    if (!this.loginSecurity.canAttemptLogin()) {
      this.errorMessage.set('هەژمارەکەت قفڵکراوە / Konto gesperrt');
      return;
    }

    if (!this.email) {
      this.emailError.set('ئیمەیڵ پێویستە');
      return;
    }
    if (!this.password) {
      this.passwordError.set('وشەی نهێنی پێویستە');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.email, this.password).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        // Check if 2FA is required
        if (response.requiresTwoFactor) {
          this.loading.set(false);
          this.router.navigate(['/totp-verify'], {
            queryParams: { userId: response.userId },
          });
          return;
        }

        const hasAccess = response.roles.some(
          r => r === 'Admin' || r === 'SuperAdmin' || r === 'Moderator'
        );

        if (!hasAccess) {
          this.loginSecurity.recordFailedAttempt();
          this.errorMessage.set('دەستگەیشتنت بە پانێڵی بەڕێوەبردن نییە');
          this.loading.set(false);
          return;
        }

        this.loginSecurity.recordSuccessfulLogin();
        this.authStore.setAuth(response);
        this.notifications.success(`بەخێربێیت ${response.fullName}`);

        const returnUrl = this.getReturnUrl();
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.loginSecurity.recordFailedAttempt();
        if (err.status === 401) {
          this.errorMessage.set('ئیمەیڵ یان وشەی نهێنی هەڵەیە / E-Mail oder Passwort ist falsch');
        } else if (err.status === 429) {
          this.errorMessage.set('زۆر هەوڵت داوە. تکایە چاوەڕوان بە / Zu viele Versuche');
        } else if (err.status === 0) {
          this.errorMessage.set('ناتوانرێت پەیوەندی بە API سێرڤەرەوە بکرێت');
        } else {
          this.errorMessage.set(`هەڵەی سێرڤەر: ${err.status}`);
        }
      },
    });
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (
      returnUrl &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//') &&
      !returnUrl.includes(':') &&
      !returnUrl.includes('\\')
    ) {
      return returnUrl;
    }
    return '/';
  }
}
