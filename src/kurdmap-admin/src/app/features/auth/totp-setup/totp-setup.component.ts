import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService, type TotpSetupResponse, AuthStore } from '../../../core/auth';
import { NotificationService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'admin-totp-setup',
  imports: [FormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div class="flex items-center gap-3 border-b border-border px-6 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <span class="material-icons text-lg text-amber-600 dark:text-amber-400" aria-hidden="true">security</span>
        </div>
        <div>
          <h3 class="text-base font-semibold text-text">ناسینەوەی دوو هەنگاو — 2FA / TOTP</h3>
          <p class="text-xs text-text-secondary">Zwei-Faktor-Authentifizierung (Google Authenticator)</p>
        </div>
        @if (authStore.twoFactorEnabled()) {
          <span class="ms-auto inline-flex items-center gap-1 rounded-full bg-success-100 dark:bg-success-900/30 px-3 py-1 text-xs font-medium text-success-700 dark:text-success-400">
            <span class="material-icons text-sm" aria-hidden="true">check_circle</span>
            چالاکە — Aktiv
          </span>
        } @else {
          <span class="ms-auto inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-text-secondary">
            <span class="material-icons text-sm" aria-hidden="true">radio_button_unchecked</span>
            ناچالاک — Inaktiv
          </span>
        }
      </div>

      <div class="p-6">
        @if (!authStore.twoFactorEnabled()) {
          <!-- Setup Flow -->
          @if (!setupData()) {
            <div class="text-center py-4">
              <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                <span class="material-icons text-4xl text-amber-500" aria-hidden="true">shield</span>
              </div>
              <p class="text-sm text-text-secondary leading-relaxed max-w-md mx-auto mb-6">
                ناسینەوەی دوو هەنگاو ئاستی ئاسایشی هەژمارەکەت بەرز دەکاتەوە. تکایە ئەپی
                <strong>Google Authenticator</strong> یان <strong>Authy</strong> دابەزێنە.
              </p>
              <admin-button (click)="startSetup()" [loading]="setupLoading()">
                دەستپێکردنی ڕێکخستن — Einrichten
              </admin-button>
            </div>
          } @else {
            <!-- QR Code + Manual Key -->
            <div class="space-y-6">
              <div class="text-center">
                <p class="text-sm text-text-secondary mb-4">
                  ئەم QR کۆدە سکان بکە بە ئەپی Authenticator:
                </p>
                <div class="inline-flex items-center justify-center rounded-xl border-2 border-dashed border-border p-6 bg-white">
                  <img [src]="qrCodeUrl()" alt="TOTP QR Code" class="w-48 h-48" />
                </div>
              </div>

              <div class="rounded-lg bg-surface-alt p-4">
                <p class="text-xs text-text-secondary mb-1">یان ئەم کۆدە بەدەستی بنووسە:</p>
                <code class="block text-center text-lg font-mono font-bold text-text tracking-wider select-all">
                  {{ setupData()!.sharedKey }}
                </code>
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  کۆدی ٦ ژمارەیی بنووسە بۆ پشتڕاستکردنەوە:
                </label>
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  pattern="[0-9]{6}"
                  class="w-full rounded-xl border border-border bg-surface px-4 py-3
                         text-center text-xl font-bold tracking-[0.4em] text-text
                         focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="000000"
                  [(ngModel)]="verifyCode"
                />
              </div>

              @if (errorMessage()) {
                <div class="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
                  <span class="material-icons text-base" aria-hidden="true">error_outline</span>
                  {{ errorMessage() }}
                </div>
              }

              <div class="flex gap-3">
                <admin-button (click)="enableTotp()" [loading]="enableLoading()" [disabled]="verifyCode.length !== 6" [fullWidth]="true">
                  چالاککردن — Aktivieren
                </admin-button>
                <button (click)="cancelSetup()" class="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors">
                  پاشگەزبوونەوە
                </button>
              </div>
            </div>
          }
        } @else {
          <!-- Disable Flow -->
          <div class="space-y-4">
            <div class="flex items-start gap-3 rounded-lg bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800 p-4">
              <span class="material-icons text-success-600 mt-0.5" aria-hidden="true">verified_user</span>
              <div>
                <p class="text-sm font-medium text-success-800 dark:text-success-300">ناسینەوەی دوو هەنگاو چالاکە</p>
                <p class="text-xs text-success-600 dark:text-success-400 mt-1">
                  هەژمارەکەت بە ئەپی Authenticator پارێزراوە.
                </p>
              </div>
            </div>

            @if (showDisable()) {
              <div class="space-y-3 pt-2">
                <label class="block text-sm font-medium text-text">
                  بۆ ناچالاککردن، کۆدی Authenticator بنووسە:
                </label>
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  pattern="[0-9]{6}"
                  class="w-full rounded-xl border border-border bg-surface px-4 py-3
                         text-center text-xl font-bold tracking-[0.4em] text-text
                         focus:border-danger-500 focus:outline-none focus:ring-2 focus:ring-danger-500/20"
                  placeholder="000000"
                  [(ngModel)]="disableCode"
                />
                @if (errorMessage()) {
                  <div class="flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">
                    <span class="material-icons text-base" aria-hidden="true">error_outline</span>
                    {{ errorMessage() }}
                  </div>
                }
                <div class="flex gap-3">
                  <admin-button variant="danger" (click)="disableTotp()" [loading]="disableLoading()" [disabled]="disableCode.length !== 6" [fullWidth]="true">
                    ناچالاککردن — Deaktivieren
                  </admin-button>
                  <button (click)="showDisable.set(false)" class="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors">
                    پاشگەزبوونەوە
                  </button>
                </div>
              </div>
            } @else {
              <button
                (click)="showDisable.set(true)"
                class="text-sm text-danger-600 hover:text-danger-700 hover:underline transition-colors"
              >
                ناچالاککردنی 2FA — 2FA deaktivieren
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class TotpSetupComponent {
  private readonly authService = inject(AuthService);
  protected readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly setupData = signal<TotpSetupResponse | null>(null);
  protected readonly setupLoading = signal(false);
  protected readonly enableLoading = signal(false);
  protected readonly disableLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showDisable = signal(false);

  protected verifyCode = '';
  protected disableCode = '';

  protected qrCodeUrl = signal('');

  protected startSetup(): void {
    this.setupLoading.set(true);
    this.authService.setupTotp().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.setupData.set(data);
        this.qrCodeUrl.set(
          `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(data.qrCodeUri)}`
        );
        this.setupLoading.set(false);
      },
      error: () => {
        this.setupLoading.set(false);
        this.notifications.error('هەڵە لە ڕێکخستنی 2FA');
      },
    });
  }

  protected enableTotp(): void {
    if (this.verifyCode.length !== 6) return;
    this.errorMessage.set('');
    this.enableLoading.set(true);

    this.authService.enableTotp(this.verifyCode).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.enableLoading.set(false);
        this.setupData.set(null);
        this.verifyCode = '';
        // Update local state
        const current = this.authStore.user();
        if (current) {
          this.authStore.setAuth({
            ...current,
            roles: current.roles,
            twoFactorEnabled: true,
          });
        }
        this.notifications.success('2FA بەسەرکەوتوویی چالاک کرا!');
      },
      error: (err) => {
        this.enableLoading.set(false);
        this.verifyCode = '';
        this.errorMessage.set(err.status === 400 ? 'کۆدەکە هەڵەیە' : `هەڵە: ${err.status}`);
      },
    });
  }

  protected disableTotp(): void {
    if (this.disableCode.length !== 6) return;
    this.errorMessage.set('');
    this.disableLoading.set(true);

    this.authService.disableTotp(this.disableCode).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.disableLoading.set(false);
        this.showDisable.set(false);
        this.disableCode = '';
        const current = this.authStore.user();
        if (current) {
          this.authStore.setAuth({
            ...current,
            roles: current.roles,
            twoFactorEnabled: false,
          });
        }
        this.notifications.success('2FA ناچالاک کرا');
      },
      error: (err) => {
        this.disableLoading.set(false);
        this.disableCode = '';
        this.errorMessage.set(err.status === 400 ? 'کۆدەکە هەڵەیە' : `هەڵە: ${err.status}`);
      },
    });
  }

  protected cancelSetup(): void {
    this.setupData.set(null);
    this.verifyCode = '';
    this.errorMessage.set('');
  }
}
