import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import { ButtonComponent, LoadingComponent } from '../../shared/components';
import { TotpSetupComponent } from '../auth/totp-setup/totp-setup.component';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  defaultLanguage: string;
  enableRegistration: boolean;
  enableReviews: boolean;
  enableAdvertisements: boolean;
  maintenanceMode: boolean;
  itemsPerPage: number;
  maxUploadSizeMb: number;
  cacheTimeoutMinutes: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
}

@Component({
  selector: 'admin-settings',
  imports: [FormsModule, ButtonComponent, LoadingComponent, TotpSetupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-text">ڕێکخستنەکان</h1>
      <p class="mt-1 text-sm text-text-secondary">ڕێکخستنی گشتی سیستەم و سەرچاوەکان (Einstellungen)</p>
    </div>

    @if (loading()) {
      <admin-loading />
    } @else {
      <div class="grid gap-6 lg:grid-cols-2">

        <!-- General Settings -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2">
            <span class="material-icons text-primary-500" aria-hidden="true">settings</span>
            <h2 class="text-lg font-semibold text-text">ڕێکخستنی گشتی</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label for="siteName" class="mb-1 block text-sm font-medium text-text">ناوی ماڵپەڕ</label>
              <input
                id="siteName"
                type="text"
                [(ngModel)]="settings.siteName"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label for="siteDescription" class="mb-1 block text-sm font-medium text-text">وەسفی ماڵپەڕ</label>
              <textarea
                id="siteDescription"
                rows="3"
                [(ngModel)]="settings.siteDescription"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              ></textarea>
            </div>

            <div>
              <label for="contactEmail" class="mb-1 block text-sm font-medium text-text">ئیمەیڵی پەیوەندی</label>
              <input
                id="contactEmail"
                type="email"
                [(ngModel)]="settings.contactEmail"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="supportPhone" class="mb-1 block text-sm font-medium text-text">ژمارەی تەلەفۆنی پشتگیری</label>
              <input
                id="supportPhone"
                type="tel"
                [(ngModel)]="settings.supportPhone"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="defaultLanguage" class="mb-1 block text-sm font-medium text-text">زمانی بنەڕەت</label>
              <select
                id="defaultLanguage"
                [(ngModel)]="settings.defaultLanguage"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="ku">کوردی (سۆرانی)</option>
                <option value="kmr">کوردی (کرمانجی)</option>
                <option value="de">ئەڵمانی</option>
                <option value="en">ئینگلیزی</option>
              </select>
            </div>

            <div>
              <label for="itemsPerPage" class="mb-1 block text-sm font-medium text-text">ژمارەی بەرهەم بۆ هەر پەڕەیەک</label>
              <input
                id="itemsPerPage"
                type="number"
                min="5"
                max="100"
                [(ngModel)]="settings.itemsPerPage"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <!-- Feature Toggles -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2">
            <span class="material-icons text-primary-500" aria-hidden="true">toggle_on</span>
            <h2 class="text-lg font-semibold text-text">چالاککردنی تایبەتمەندییەکان</h2>
          </div>

          <div class="space-y-4">
            @for (toggle of featureToggles; track toggle.key) {
              <label class="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-surface-alt">
                <div>
                  <p class="text-sm font-medium text-text">{{ toggle.label }}</p>
                  <p class="text-xs text-text-secondary">{{ toggle.description }}</p>
                </div>
                <div class="relative">
                  <input
                    type="checkbox"
                    class="peer sr-only"
                    [checked]="getToggleValue(toggle.key)"
                    (change)="setToggleValue(toggle.key, $event)"
                  />
                  <div class="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-500 dark:bg-gray-600"></div>
                  <div class="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"></div>
                </div>
              </label>
            }
          </div>
        </div>

        <!-- Upload & Cache Settings -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2">
            <span class="material-icons text-primary-500" aria-hidden="true">cloud_upload</span>
            <h2 class="text-lg font-semibold text-text">ڕێکخستنی بارکردن و کاش</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label for="maxUploadSizeMb" class="mb-1 block text-sm font-medium text-text">
                زۆرترین قەبارەی بارکردن (مێگابایت)
              </label>
              <input
                id="maxUploadSizeMb"
                type="number"
                min="1"
                max="50"
                [(ngModel)]="settings.maxUploadSizeMb"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="cacheTimeoutMinutes" class="mb-1 block text-sm font-medium text-text">
                ماوەی کاش (خولەک)
              </label>
              <input
                id="cacheTimeoutMinutes"
                type="number"
                min="0"
                max="1440"
                [(ngModel)]="settings.cacheTimeoutMinutes"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <!-- SMTP Settings -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-5 flex items-center gap-2">
            <span class="material-icons text-primary-500" aria-hidden="true">email</span>
            <h2 class="text-lg font-semibold text-text">ڕێکخستنی ئیمەیڵ (SMTP)</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label for="smtpHost" class="mb-1 block text-sm font-medium text-text">SMTP Host</label>
              <input
                id="smtpHost"
                type="text"
                [(ngModel)]="settings.smtpHost"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="smtpPort" class="mb-1 block text-sm font-medium text-text">SMTP Port</label>
              <input
                id="smtpPort"
                type="number"
                [(ngModel)]="settings.smtpPort"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="smtpUser" class="mb-1 block text-sm font-medium text-text">SMTP User</label>
              <input
                id="smtpUser"
                type="text"
                [(ngModel)]="settings.smtpUser"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>

            <div>
              <label for="smtpFrom" class="mb-1 block text-sm font-medium text-text">ناردن لە ناونیشانی</label>
              <input
                id="smtpFrom"
                type="email"
                [(ngModel)]="settings.smtpFrom"
                class="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text
                       outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 2FA / TOTP Settings -->
      <div class="mt-6">
        <admin-totp-setup />
      </div>

      <!-- Save Button -->
      <div class="mt-8 flex justify-end gap-3">
        <admin-button variant="secondary" (clicked)="resetSettings()">
          <span class="material-icons me-1 text-base align-middle">restart_alt</span>
          ڕیسێتکردن
        </admin-button>
        <admin-button variant="primary" (clicked)="saveSettings()" [loading]="saving()">
          <span class="material-icons me-1 text-base align-middle">save</span>
          پاشەکەوتکردن
        </admin-button>
      </div>
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  settings: SystemSettings = this.getDefaultSettings();

  readonly featureToggles = [
    { key: 'enableRegistration', label: 'چالاککردنی تۆمارکردن', description: 'ڕێگەدان بە بەکارهێنەرانی نوێ بۆ تۆمارکردن' },
    { key: 'enableReviews', label: 'چالاککردنی هەڵسەنگاندن', description: 'بەکارهێنەران دەتوانن هەڵسەنگاندن بنووسن' },
    { key: 'enableAdvertisements', label: 'چالاککردنی ڕیکلام', description: 'نیشاندانی ڕیکلامەکان لە سایت' },
    { key: 'maintenanceMode', label: 'دۆخی چاککردنەوە', description: 'سایت دادەخرێت بۆ چاککردنەوە' },
  ] as const;

  ngOnInit(): void {
    this.loadSettings();
  }

  getToggleValue(key: string): boolean {
    return (this.settings as unknown as Record<string, unknown>)[key] as boolean;
  }

  setToggleValue(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    (this.settings as unknown as Record<string, unknown>)[key] = checked;
  }

  loadSettings(): void {
    // Load from localStorage for now (can be replaced with API call later)
    const stored = localStorage.getItem('kurdmap_settings');
    if (stored) {
      try {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      } catch {
        this.settings = this.getDefaultSettings();
      }
    }
    this.loading.set(false);
  }

  saveSettings(): void {
    this.saving.set(true);
    // Save to localStorage (can be replaced with API call later)
    localStorage.setItem('kurdmap_settings', JSON.stringify(this.settings));
    setTimeout(() => {
      this.saving.set(false);
      this.notifications.success('ڕێکخستنەکان پاشەکەوتکران');
    }, 300);
  }

  resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.notifications.info('ڕێکخستنەکان ڕیسێتکران بۆ بنەڕەت');
  }

  private getDefaultSettings(): SystemSettings {
    return {
      siteName: 'KurdMap',
      siteDescription: 'نەخشەی بازرگانییەکانی کورد لە ئەڵمانیا',
      contactEmail: 'info@kurdmap.eu',
      supportPhone: '+49 123 456 789',
      defaultLanguage: 'ku',
      enableRegistration: true,
      enableReviews: true,
      enableAdvertisements: true,
      maintenanceMode: false,
      itemsPerPage: 25,
      maxUploadSizeMb: 10,
      cacheTimeoutMinutes: 60,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: 'noreply@kurdmap.de',
      smtpFrom: 'noreply@kurdmap.de',
    };
  }
}
