import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthStore } from '../../../core/auth';
import { NotificationService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'admin-totp-verify',
  imports: [FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-md">
      <div class="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl
                  dark:border-white/10 dark:bg-surface/90">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/30">
            <span class="material-icons text-3xl text-white" aria-hidden="true">security</span>
          </div>
          <h1 class="text-2xl font-bold text-text">پشتڕاستکردنەوەی دوو هەنگاو</h1>
          <p class="mt-1 text-sm text-text-secondary">Zwei-Faktor-Authentifizierung</p>
          <p class="mt-3 text-sm text-text-secondary leading-relaxed">
            تکایە کۆدی ٦ ژمارەیی لە ئەپی Google Authenticator بنووسە
          </p>
        </div>

        <!-- OTP Input -->
        <form (ngSubmit)="handleVerify()">
          <div class="space-y-5">
            @if (errorMessage()) {
              <div class="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
                   role="alert">
                <span class="material-icons text-lg" aria-hidden="true">error_outline</span>
                {{ errorMessage() }}
              </div>
            }

            <div>
              <label for="totp-code" class="block text-sm font-medium text-text mb-2">
                کۆدی پشتڕاستکردنەوە / Bestätigungscode
              </label>
              <input
                id="totp-code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                pattern="[0-9]{6}"
                class="w-full rounded-xl border border-border bg-surface px-4 py-3.5
                       text-center text-2xl font-bold tracking-[0.5em] text-text
                       placeholder:text-text-secondary/40 placeholder:tracking-[0.3em]
                       focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
                       transition-all"
                placeholder="000000"
                [(ngModel)]="code"
                name="code"
                [disabled]="loading()"
                (keydown)="onKeyDown($event)"
              />
            </div>

            <admin-button
              type="submit"
              [fullWidth]="true"
              [loading]="loading()"
              [disabled]="loading() || code.length !== 6"
              size="lg"
            >
              @if (!loading()) {
                پشتڕاستکردنەوە / Bestätigen
              } @else {
                ...
              }
            </admin-button>

            <button
              type="button"
              (click)="handleCancel()"
              class="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary
                     hover:bg-surface-alt transition-colors"
            >
              گەڕانەوە بۆ چوونەژوورەوە / Zurück zur Anmeldung
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TotpVerifyComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected code = '';
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    if (!this.userId) {
      this.router.navigate(['/login']);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    // Only allow digits, backspace, tab, arrows
    if (!/^\d$/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      event.preventDefault();
    }
  }

  protected handleVerify(): void {
    if (this.code.length !== 6 || !this.userId) return;

    this.errorMessage.set('');
    this.loading.set(true);

    this.authService.verifyTotp(this.userId, this.code).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.authStore.setAuth(response);
        this.authStore.setMfaVerified();
        this.notifications.success('پشتڕاستکراوە — بەخێربێیت!');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.loading.set(false);
        this.code = '';
        if (err.status === 401) {
          this.errorMessage.set('کۆدەکە هەڵەیە. دووبارە هەوڵ بدەوە / Ungültiger Code');
        } else {
          this.errorMessage.set(`هەڵەی سێرڤەر: ${err.status}`);
        }
      },
    });
  }

  protected handleCancel(): void {
    this.authStore.clear();
    this.router.navigate(['/login']);
  }
}
